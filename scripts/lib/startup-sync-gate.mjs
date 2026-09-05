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
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { isatty } from "node:tty";

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
// How long the payload itself is worth waiting for, and how often fd 0 is asked.
// Generous next to a `node` boot, and it sits on TOP of the ceiling above, so the
// worst case still clears the hooks' 20 s timeout. Only a pipe nobody ever writes to
// pays it in full — and no harness does that.
const PAYLOAD_WAIT_MS = 2_000;
const PAYLOAD_POLL_MS = 20;
// fd 0, named because `isatty(0)` on its own reads like a magic number.
const STDIN_FD = 0;
// The one hook that owns the sweep+pull (session-status.mjs). Named here rather
// than at each call site: the puller and the readers must not drift apart.
const PULLER_SCRIPT = "session-status.mjs";

/**
 * The raw hook payload, from fd 0 where the harness pipes it. A TTY is left alone
 * on purpose: run by hand, fd 0 is a keyboard and the read would hang the hook.
 * Every dep is injected so that guard is assertable without a terminal.
 *
 * ⚠️ The tty question is asked with `isatty(0)` and NOT with `process.stdin.isTTY`,
 * and the difference is the whole reliability of the barrier below. Touching
 * `process.stdin` BUILDS the stdin stream, and building it switches fd 0 to
 * NON-BLOCKING: `readFileSync(0)` then throws EAGAIN for as long as the harness has
 * not written yet. Measured 2026-09-05 — with the stream, a payload handed over
 * 500 ms late threw every time; with `isatty`, it was read every time. The hook then
 * had no session id, skipped the wait, and told the session the universe this machine
 * went to sleep in. `isatty` answers the same question and leaves the descriptor's
 * mode alone.
 *
 * And because a future import could rebuild that stream out of our sight, EAGAIN is
 * no longer read as silence: it means "nothing there YET", and is worth a bounded
 * wait. A genuine EOF (an empty read, `/dev/null`) still answers instantly — silence
 * that has been waited for, rather than a first impression.
 */
export function readHookPayload({
  readInput = () => readFileSync(0, "utf8"),
  isTTY = () => isatty(STDIN_FD),
  now = Date.now,
  sleep = blockingSleep,
  waitMs = PAYLOAD_WAIT_MS,
  pollMs = PAYLOAD_POLL_MS,
} = {}) {
  if (isTTY()) return "";
  const startedAt = now();
  for (;;) {
    try {
      return readInput();
    } catch (error) {
      if (error?.code !== "EAGAIN") return "";
      if (now() - startedAt >= waitMs) return "";
      sleep(pollMs);
    }
  }
}

/**
 * A REAL blocking wait, with no event loop to lend us: a SessionStart hook is a
 * straight-line script, and `await` would let it fall off the end before the pull
 * lands. `Atomics.wait` on a lock nobody notifies parks the thread for exactly the
 * requested time, on every platform.
 */
export function blockingSleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/**
 * The session id the harness hands every hook on stdin — the one key the puller
 * and its readers can agree on. Unusable stdin yields null, and a null id opens
 * the barrier: guessing would be worse than not having one (see the wait below).
 */
export function hookSessionId(input) {
  try {
    return JSON.parse(input).session_id ?? null;
  } catch {
    return null;
  }
}

/**
 * Will anyone actually pull this session? Read from the brain's OWN settings, so a
 * brain that predates the puller — or an owner who removed it — is never made to
 * wait for a marker that cannot appear. Anything unreadable answers "no".
 */
export function pullerIsWired(settings) {
  const entries = settings?.hooks?.SessionStart ?? [];
  return entries.some((entry) =>
    (entry?.hooks ?? []).some((hook) => String(hook?.command ?? "").includes(PULLER_SCRIPT)),
  );
}

/** The same question, asked of the settings file on disk. Unreadable → "no". */
export function pullerWiredIn({ repo, io }) {
  const path = join(repo, ".claude", "settings.json");
  try {
    return io.existsSync(path) ? pullerIsWired(JSON.parse(io.readFileSync(path))) : false;
  } catch {
    return false;
  }
}

/** Announce that THIS session's startup sync is under way. */
export function markSyncRunning({ repo, sessionId, io, now }) {
  return writeMarker({ repo, sessionId, io, phase: "running", now });
}

/** Announce that it has landed — the flip every waiter is polling for. */
export function markSyncDone({ repo, sessionId, io, now }) {
  return writeMarker({ repo, sessionId, io, phase: "done", now });
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

// Says whether the marker really landed. FAIL-SOFT, like every side-channel this
// brain writes at startup: the marker exists to spare other hooks a stale read, and
// a disk that refuses it must never cost the owner the pull itself.
function writeMarker({ repo, sessionId, io, phase, now }) {
  if (!sessionId) return false; // nothing to key it on — see hookSessionId.
  try {
    const path = join(repo, SYNC_MARKER_REL);
    io.mkdirSync(dirname(path), { recursive: true });
    io.writeFileSync(path, JSON.stringify({ sessionId, phase, at: now() }));
    return true;
  } catch {
    return false;
  }
}

/**
 * THE ONE SPELLING of "wait for THIS session's pull before reading anything tracked".
 *
 * Spelled at the call site it is five arguments that all have to agree, and the way they
 * stop agreeing is a hook that quietly stops waiting: a wrong `repo` waits on another
 * brain's marker, a forgotten `pullerWired` makes every pre-barrier brain pay the grace
 * at every session start, and either reads as success. T11 added the second caller, so
 * the spelling gets a home before there are two of it.
 *
 * Fail-open like everything else here, and it needs no try/catch of its own to be: every
 * part it composes already swallows — `readHookPayload`, `hookSessionId`, `pullerWiredIn`
 * and the gate's own `readMarker`. A hostile io therefore answers `not-expected` (nobody
 * will pull, carry on) rather than throwing at a caller for whom this is now the FIRST
 * thing done, ahead of its own try/catch. A wrapper here would be unreachable code
 * claiming to guard something — it was written, then measured, then removed.
 *
 * `readPayload` is a SEAM, not a convenience: its default reads the harness's JSON off
 * `readFileSync(0)`, and a test process's stdin is a pipe with no writer. POSIX answers
 * EAGAIN there and the swallow hides it; WINDOWS BLOCKS, forever. A test that called this
 * without the seam held a CI runner 2 h 46 min on 2026-08-23 and queued three hours of
 * jobs behind it. Every caller that is not a real hook must pass it.
 *
 * ⚠️ `session-universe.mjs` deliberately keeps its inline spelling until after the v5.0.0
 * tag. Its three files are byte-identical to `main`, and that is exactly what makes the
 * macOS CI flake diagnosable as inherited rather than introduced (release plan, § THE
 * macOS FLAKE). Adopting this helper there is post-tag work, alongside the instrument
 * that will record WHICH fail-open branch the flake takes.
 */
export function awaitStartupSync({ repo, io, now = Date.now, sleep = blockingSleep, readPayload = readHookPayload }) {
  return waitForStartupSync({
    repo,
    sessionId: hookSessionId(readPayload()),
    io,
    now,
    sleep,
    pullerWired: pullerWiredIn({ repo, io }),
  });
}
