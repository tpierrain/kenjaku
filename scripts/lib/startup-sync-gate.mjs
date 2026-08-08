// ─────────────────────────────────────────────────────────────────────────────
// startup-sync-gate.mjs — WHO runs the startup pull, and who has to WAIT for it.
//
// SessionStart hooks do NOT run in the order they are declared: the Claude Code
// hooks reference states that "all matching hooks run in parallel". So the pull
// (owned by session-status.mjs) RACES every other hook, and a hook that reads
// state the pull can change — the active-universe pointer above all, now that it
// travels between machines — usually wins that race and reads the PREVIOUS value.
// The session would then announce one universe and retrieve from another.
//
// The gate is the missing barrier: the puller marks the sync `running` before it
// starts and `done` when it lands, both stamped with the session id the harness
// hands every hook on stdin; a reader waits for that `done` before reading.
//
// FAIL-OPEN, always: no session id, no marker, no writer, a wait that times out —
// every one of them means "carry on with what is on disk", i.e. exactly today's
// behaviour. A session start is never blocked by this file.
// ─────────────────────────────────────────────────────────────────────────────
import { dirname, join } from "node:path";

// Under the brain's gitignored `.cache/`, alongside `restart-needed` and the
// upstream verdict: per-session, per-machine, regenerated at every start.
export const SYNC_MARKER_REL = join(".cache", "startup-sync.json");

// How long a reader may hold up its own hook, and how often it looks. The ceiling
// sits well under the hooks' 20 s timeout: a pull that slow has already cost the
// owner their session start, and waiting longer would turn a stale read into a
// dead hook. Polling a single small file every 50 ms is free next to a pull.
const WAIT_MS = 12_000;
const POLL_MS = 50;
// Grace for the puller to even exist: hooks are spawned together, so the reader can
// look before the puller's `node` has finished booting. Only a puller that dies
// before writing ever pays it in full.
const GRACE_MS = 3_000;

/** Announce that THIS session's startup sync is under way. */
export function markSyncRunning({ repo, sessionId, io, now }) {
  writeMarker({ repo, io, marker: { sessionId, phase: "running", at: now() } });
}

/** Announce that it has landed — the flip every waiter is polling for. */
export function markSyncDone({ repo, sessionId, io, now }) {
  writeMarker({ repo, io, marker: { sessionId, phase: "done", at: now() } });
}

/**
 * Block until THIS session's startup pull has landed, then let the caller read.
 * Returns why it stopped waiting; every non-`done` answer means "read what is on
 * disk anyway", which is what the brain did before this gate existed.
 */
export function waitForStartupSync({
  repo,
  sessionId,
  io,
  now,
  sleep,
  pullerWired,
  waitMs = WAIT_MS,
  pollMs = POLL_MS,
  graceMs = GRACE_MS,
}) {
  const startedAt = now();
  const waitedMs = () => now() - startedAt;
  // Nobody is going to pull: an older brain whose settings never got this hook, or
  // one where the owner removed it. Waiting would tax EVERY session start of that
  // brain for a marker that can never appear.
  if (!pullerWired) return { status: "not-expected", waitedMs: 0 };
  // No id means no way to tell this session's marker from the last one's, and a
  // barrier that cannot be keyed is worse than none: it would either release on
  // stale news or hold the session for nothing.
  if (!sessionId) return { status: "unknown-session", waitedMs: 0 };

  // Two deadlines, because two failures look alike from here. Until the puller has
  // said "running" for THIS session, all we know is that a process was supposed to
  // start — worth a short grace (a cold `node` start), never the full ceiling. Once
  // it HAS spoken, the pull is genuinely in flight and deserves the ceiling.
  let announced = false;
  for (;;) {
    const marker = readMarker({ repo, io });
    const mine = marker?.sessionId === sessionId;
    if (mine && marker.phase === "done") return { status: "done", waitedMs: waitedMs() };
    if (mine) announced = true;
    if (!announced && waitedMs() >= graceMs) return { status: "no-writer", waitedMs: waitedMs() };
    if (waitedMs() >= waitMs) return { status: "timeout", waitedMs: waitedMs() };
    sleep(pollMs);
  }
}

function readMarker({ repo, io }) {
  const path = join(repo, SYNC_MARKER_REL);
  try {
    return io.existsSync(path) ? JSON.parse(io.readFileSync(path)) : null;
  } catch {
    return null; // an unreadable marker is no marker at all — fail-open.
  }
}

function writeMarker({ repo, io, marker }) {
  const path = join(repo, SYNC_MARKER_REL);
  io.mkdirSync(dirname(path), { recursive: true });
  io.writeFileSync(path, JSON.stringify(marker));
}
