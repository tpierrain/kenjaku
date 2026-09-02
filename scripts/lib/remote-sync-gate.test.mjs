// ─────────────────────────────────────────────────────────────────────────────
// remote-sync-gate.test.mjs — one effective clock per machine (plan #84, 2.3).
// Every open conversation runs its own vault-rag server, hence its own timer; the
// gate is the cross-process arbiter: a recent tick by ANY window, or a live holder,
// makes the others yield. Real files in a temp dir, injected clock, pid and liveness.
// ─────────────────────────────────────────────────────────────────────────────
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { LAST_TICK_FILE, LOCK_FILE, STALE_AFTER_MS, openTickGate } from "./remote-sync-gate.mjs";

const T0 = new Date("2026-09-08T09:00:00.000Z");
const at = (seconds) => new Date(T0.getTime() + seconds * 1000);

function dir(t) {
  const d = mkdtempSync(join(tmpdir(), "sbg-gate-"));
  t.after(() => rmSync(d, { recursive: true, force: true }));
  return d;
}

test("first tick on a quiet machine: acquired; release records the tick time and drops the lock", (t) => {
  const d = dir(t);
  const gate = openTickGate({ dir: d, pid: 101, now: () => T0, isAlive: () => true, minGapMs: 60_000 });
  assert.equal(gate.acquire(), true);
  assert.deepEqual(JSON.parse(readFileSync(join(d, LOCK_FILE), "utf8")), { pid: 101, acquiredAt: T0.toISOString() });
  gate.release();
  assert.equal(existsSync(join(d, LOCK_FILE)), false);
  assert.equal(readFileSync(join(d, LAST_TICK_FILE), "utf8"), T0.toISOString());
});

test("a second window within the minimum gap yields: one probe per interval per machine, whatever the window count", (t) => {
  const d = dir(t);
  const first = openTickGate({ dir: d, pid: 101, now: () => T0, isAlive: () => true, minGapMs: 60_000 });
  first.acquire();
  first.release();
  const second = openTickGate({ dir: d, pid: 202, now: () => at(30), isAlive: () => true, minGapMs: 60_000 });
  assert.equal(second.acquire(), false);
  const later = openTickGate({ dir: d, pid: 202, now: () => at(61), isAlive: () => true, minGapMs: 60_000 });
  assert.equal(later.acquire(), true);
});

test("a live holder blocks a concurrent tick; the loser yields without touching the lock", (t) => {
  const d = dir(t);
  const holder = openTickGate({ dir: d, pid: 101, now: () => T0, isAlive: () => true, minGapMs: 60_000 });
  holder.acquire();
  const rival = openTickGate({ dir: d, pid: 202, now: () => at(5), isAlive: (pid) => pid === 101, minGapMs: 60_000 });
  assert.equal(rival.acquire(), false);
  assert.equal(JSON.parse(readFileSync(join(d, LOCK_FILE), "utf8")).pid, 101);
});

test("a dead holder is reclaimed", (t) => {
  const d = dir(t);
  writeFileSync(join(d, LOCK_FILE), JSON.stringify({ pid: 999, acquiredAt: T0.toISOString() }));
  const gate = openTickGate({ dir: d, pid: 202, now: () => at(5), isAlive: () => false, minGapMs: 60_000 });
  assert.equal(gate.acquire(), true);
  assert.equal(JSON.parse(readFileSync(join(d, LOCK_FILE), "utf8")).pid, 202);
});

test("a stale holder (older than 10 min) is reclaimed even if its pid is alive", (t) => {
  const d = dir(t);
  writeFileSync(join(d, LOCK_FILE), JSON.stringify({ pid: 101, acquiredAt: T0.toISOString() }));
  const gate = openTickGate({ dir: d, pid: 202, now: () => at(11 * 60), isAlive: () => true, minGapMs: 60_000 });
  assert.equal(gate.acquire(), true);
});

test("an unreadable lock file counts as a dead holder, never as a permanent block", (t) => {
  const d = dir(t);
  writeFileSync(join(d, LOCK_FILE), "not json");
  const gate = openTickGate({ dir: d, pid: 202, now: () => T0, isAlive: () => true, minGapMs: 60_000 });
  assert.equal(gate.acquire(), true);
});

test("a malformed last-tick marker is ignored rather than blocking forever", (t) => {
  const d = dir(t);
  writeFileSync(join(d, LAST_TICK_FILE), "garbage");
  const gate = openTickGate({ dir: d, pid: 202, now: () => T0, isAlive: () => true, minGapMs: 60_000 });
  assert.equal(gate.acquire(), true);
});

// ── The boundaries, which is where a gate is either right or off by one ──────

test("a holder exactly at the staleness limit is still live; a millisecond past it is not", (t) => {
  const held = (elapsedMs) => {
    const d = dir(t);
    writeFileSync(join(d, LOCK_FILE), JSON.stringify({ pid: 101, acquiredAt: T0.toISOString() }));
    const gate = openTickGate({
      dir: d,
      pid: 202,
      now: () => new Date(T0.getTime() + elapsedMs),
      isAlive: () => true,
      minGapMs: 60_000,
    });
    return gate.acquire();
  };

  assert.equal(held(STALE_AFTER_MS), false, "at the limit the holder is still working — do not steal its lock");
  assert.equal(held(STALE_AFTER_MS + 1), true, "one millisecond past it, it is presumed crashed");
});

test("a tick exactly one interval after the last one is allowed, and one millisecond short of it is not", (t) => {
  const ticks = (elapsedMs) => {
    const d = dir(t);
    writeFileSync(join(d, LAST_TICK_FILE), T0.toISOString());
    const gate = openTickGate({
      dir: d,
      pid: 202,
      now: () => new Date(T0.getTime() + elapsedMs),
      isAlive: () => true,
      minGapMs: 60_000,
    });
    return gate.acquire();
  };

  assert.equal(ticks(59_999), false);
  assert.equal(ticks(60_000), true, "the interval is the gap between ticks, not the gap plus one");
});

// `Date.parse` answers NaN on a timestamp with so much as a trailing newline, and a
// marker file on disk is exactly what picks one up. Read without trimming, the marker
// looks ABSENT — which is the one reading that makes every window on the machine tick.
test("a last-tick marker carrying a trailing newline still holds the machine back", (t) => {
  const d = dir(t);
  writeFileSync(join(d, LAST_TICK_FILE), `${T0.toISOString()}\n`);
  const gate = openTickGate({ dir: d, pid: 202, now: () => at(30), isAlive: () => true, minGapMs: 60_000 });
  assert.equal(gate.acquire(), false);
});

test("a lock file whose pid is missing or is not a number holds nothing", (t) => {
  for (const record of [{ acquiredAt: T0.toISOString() }, { pid: "101", acquiredAt: T0.toISOString() }, { pid: null }]) {
    const d = dir(t);
    writeFileSync(join(d, LOCK_FILE), JSON.stringify(record));
    // `isAlive` says yes to everything: only the shape of the record can save this.
    const gate = openTickGate({ dir: d, pid: 202, now: () => at(5), isAlive: () => true, minGapMs: 60_000 });
    assert.equal(gate.acquire(), true, `${JSON.stringify(record)} is not a holder`);
  }
});

// ── The liveness probe nobody injects in production ──────────────────────────
//
// Every test above hands the gate an `isAlive` of its own, so the real one — the
// one that actually runs on the fleet — was measured by nothing at all.

test("with no injection, the gate asks the operating system: our own process holds, a pid that does not exist is reclaimed", (t) => {
  const acquireAgainst = (pid) => {
    const d = dir(t);
    writeFileSync(join(d, LOCK_FILE), JSON.stringify({ pid, acquiredAt: T0.toISOString() }));
    return openTickGate({ dir: d, pid: 202, now: () => at(5), minGapMs: 60_000 }).acquire();
  };

  assert.equal(acquireAgainst(process.pid), false, "this very process is alive, so its lock stands");
  assert.equal(acquireAgainst(999_999), true, "no such process: the lock is a leftover, reclaim it");
});

// A pid we may not signal answers EPERM, and EPERM means ALIVE — the opposite of what
// a bare `catch → false` would conclude. On POSIX pid 1 is init and is never ours.
test("a process that exists but is not ours counts as alive, not as gone", { skip: process.platform === "win32" }, (t) => {
  const d = dir(t);
  writeFileSync(join(d, LOCK_FILE), JSON.stringify({ pid: 1, acquiredAt: T0.toISOString() }));
  const gate = openTickGate({ dir: d, pid: 202, now: () => at(5), minGapMs: 60_000 });
  assert.equal(gate.acquire(), false);
});

test("the gate creates its directory when .cache/ does not exist yet", (t) => {
  const d = join(dir(t), ".cache");
  const gate = openTickGate({ dir: d, pid: 1, now: () => T0, isAlive: () => true, minGapMs: 60_000 });
  assert.equal(gate.acquire(), true);
  gate.release();
  assert.equal(existsSync(join(d, LAST_TICK_FILE)), true);
});
