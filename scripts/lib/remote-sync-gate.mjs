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
//   • `remote-sync.lock` — who is ticking RIGHT NOW. Taken by an exclusive create
//     (`wx` / O_EXCL), atomic across processes, so two windows ticking at the same
//     instant cannot both win. A dead holder (pid gone) or a stale one (older than
//     10 min: a tick never takes that long) is reclaimed, as the local mirror's
//     per-source lock does (ADR 0032).
//
// Both reads fail OPEN on garbage (an unreadable marker is not a reason to stop
// syncing forever) and the whole thing is best-effort: an I/O error on release is
// swallowed — the next window reclaims a stale lock on its own.
// ─────────────────────────────────────────────────────────────────────────────
import { closeSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync, writeSync } from "node:fs";
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
    return error?.code === "EPERM";
  }
};

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

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

  const tryCreate = (at) => {
    let fd;
    try {
      fd = openSync(lockPath, "wx");
    } catch (error) {
      if (error?.code === "EEXIST") return false;
      throw error;
    }
    try {
      writeSync(fd, JSON.stringify({ pid, acquiredAt: new Date(at).toISOString() }));
    } finally {
      closeSync(fd);
    }
    return true;
  };

  return {
    acquire() {
      const at = now().getTime();
      mkdirSync(dir, { recursive: true });
      const last = readTime(lastPath);
      if (last !== null && at - last < minGapMs) return false;
      // Two attempts: the first EEXIST may be a dead/stale holder we then reclaim.
      for (let attempt = 0; attempt < 2; attempt++) {
        if (tryCreate(at)) return true;
        if (holderIsLive(readJson(lockPath), at)) return false;
        try {
          rmSync(lockPath, { force: true });
        } catch {
          return false;
        }
      }
      return false;
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
