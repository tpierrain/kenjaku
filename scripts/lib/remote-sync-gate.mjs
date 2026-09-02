// ─────────────────────────────────────────────────────────────────────────────
// remote-sync-gate.mjs — ONE effective sync clock per machine (plan #84, 2.3).
//
// Every open conversation runs its own vault-rag server, hence its own timer, on
// the same repo. Left alone, five windows would probe the remote five times per
// interval and race each other on `.git/index.lock`. Two files under `.cache/`
// (gitignored, per machine) make the windows take turns:
//
//   • `remote-sync.last` — when the last tick RAN, whichever window ran it. A tick
//     that lands within `minGapMs` of it yields: the machine already probed.
//   • `remote-sync.lock` — who is ticking RIGHT NOW. It is written COMPLETE and then
//     hard-linked into place, so it appears already naming its holder and is never
//     observable half-made (see `tryCreate`). A dead holder (pid gone) or a stale one
//     (older than 10 min: a tick never takes that long) is reclaimed, as the local
//     mirror's per-source lock does (ADR 0032).
//
// Both reads fail OPEN on garbage (an unreadable marker is not a reason to stop
// syncing forever) and the whole thing is best-effort: an I/O error on release is
// swallowed — the next window reclaims a stale lock on its own.
// ─────────────────────────────────────────────────────────────────────────────
import { closeSync, linkSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync, writeSync } from "node:fs";
import { join } from "node:path";

export const LOCK_FILE = "remote-sync.lock";
export const LAST_TICK_FILE = "remote-sync.last";

/** A tick never takes this long: beyond it, the holder is presumed crashed. */
export const STALE_AFTER_MS = 10 * 60 * 1000;

const defaultIsAlive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM: the process exists but is not ours — alive nonetheless.
    return error.code === "EPERM";
  }
};

// The fallback for a filesystem with no hard links: create exclusively, fill after.
// It carries the race `tryCreate` exists to remove, and is reached only where the
// atomic route is unavailable.
function exclusiveCreate(path, record) {
  let fd;
  try {
    fd = openSync(path, "wx");
  } catch (error) {
    if (error.code === "EEXIST") return false;
    throw error;
  }
  try {
    writeSync(fd, record);
  } finally {
    closeSync(fd);
  }
  return true;
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

// `.trim()` is load-bearing, not tidiness: `Date.parse` answers NaN on a timestamp
// carrying so much as a trailing newline, and a marker file is exactly the kind of
// thing an editor, a shell redirect or a sync tool adds one to. Without it, such a
// marker reads as absent and every window on the machine ticks.
function readTime(path) {
  try {
    const t = Date.parse(readFileSync(path, "utf8").trim());
    return Number.isFinite(t) ? t : null;
  } catch {
    return null;
  }
}

/**
 * @param {object} opts
 * @param {string} opts.dir the `.cache/` dir of the brain (created if missing)
 * @param {number} [opts.pid]
 * @param {() => Date} [opts.now]
 * @param {(pid: number) => boolean} [opts.isAlive]
 * @param {number} opts.minGapMs a tick within this gap of the last one yields
 * @param {number} [opts.staleAfterMs]
 */
export function openTickGate({ dir, pid = process.pid, now = () => new Date(), isAlive = defaultIsAlive, minGapMs, staleAfterMs = STALE_AFTER_MS }) {
  const lockPath = join(dir, LOCK_FILE);
  const lastPath = join(dir, LAST_TICK_FILE);

  const holderIsLive = (record, at) => {
    if (!record || typeof record.pid !== "number") return false;
    const since = Date.parse(record.acquiredAt);
    if (!Number.isFinite(since) || at - since > staleAfterMs) return false;
    return isAlive(record.pid);
  };

  // The lock is written somewhere else FIRST and only then linked into place, and
  // that order is the whole exclusion. Creating the file and filling it afterwards
  // leaves a window — microseconds wide, and hit three times in four when four real
  // windows start together — in which the lock EXISTS but is EMPTY. A rival reading
  // it there finds no holder, `holderIsLive` says false as it must for a genuinely
  // corrupt lock, and it steals a lock whose owner is mid-fetch. Measured on the
  // field rehearsal of 2026-09-02: two windows through the gate, the second dying
  // on the git lock the first was holding.
  //
  // `link` fails with EEXIST when the name is taken, atomically, and the file it
  // publishes is already complete. Filesystems without hard links (a network share,
  // an exotic mount) answer something else: fall back to the exclusive create rather
  // than stop syncing — that is today's behaviour, race and all, and no worse.
  const tryCreate = (at) => {
    const record = JSON.stringify({ pid, acquiredAt: new Date(at).toISOString() });
    const staging = `${lockPath}.${pid}.staging`;
    try {
      writeFileSync(staging, record);
      linkSync(staging, lockPath);
      return true;
    } catch (error) {
      if (error.code === "EEXIST") return false;
      return exclusiveCreate(lockPath, record);
    } finally {
      try {
        rmSync(staging, { force: true });
      } catch {
        // best-effort: a leftover staging file is inert, and the next tick overwrites it
      }
    }
  };

  return {
    acquire() {
      const at = now().getTime();
      mkdirSync(dir, { recursive: true });
      const last = readTime(lastPath);
      if (last !== null && at - last < minGapMs) return false;
      if (tryCreate(at)) return true;
      // The EEXIST may be a dead or stale holder, so reclaim it and try ONCE more.
      // Not a loop: a further attempt could only lose the same race again, and a
      // count of two is a number no test can pin down.
      if (holderIsLive(readJson(lockPath), at)) return false;
      try {
        rmSync(lockPath, { force: true });
      } catch {
        return false;
      }
      return tryCreate(at);
    },
    release() {
      try {
        writeFileSync(lastPath, now().toISOString(), "utf8");
      } catch {
        // best-effort
      }
      try {
        rmSync(lockPath, { force: true });
      } catch {
        // best-effort: a stale lock is reclaimed by the next window
      }
    },
  };
}
