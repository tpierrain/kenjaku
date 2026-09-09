import { execFileSync } from "node:child_process";

// ─────────────────────────────────────────────────────────────────────────────
// claude-app-identity.mjs — "which Claude app am I running under, and is it the
// same one that armed the restart marker?" (#90).
//
// WHY THIS EXISTS. The restart nudge tells the owner to quit Claude and come back
// to THIS conversation. Resuming a conversation runs no `SessionStart`, and
// `SessionStart` was the only code that erased the marker — so obeying the
// instruction guaranteed its own repetition, forever. The marker had no way to
// notice that the restart it asked for had actually happened.
//
// WHAT WAS MEASURED, AND WHY IT IS THE APP AND NOTHING ELSE (2026-09-08, on a
// throwaway brain, in Claude Desktop). A first attempt asked the search server to
// stamp a trace when it was respawned. It does not work: opening a NEW
// conversation without quitting anything respawns a server too, and stamps a
// trace indistinguishable from a real restart. Across those three readings
// exactly one thing discriminated — the **Claude app process**. It changed on a
// real ⌘Q + reopen, and it held across a new conversation. So:
//
//   "the app that spawned me is not the app that was running when the marker was
//    written" IS a restart, and nothing else is.
//
// The app is reachable by walking up from `process.ppid`, which means the hook
// that repeats the nudge can answer the question ITSELF — no trace file, no
// second writer, and no `SessionStart` needed. That is the whole fix.
//
// EVERY UNKNOWN ANSWERS "NO RESTART PROVEN", never "restarted". A false alarm
// costs the owner one sentence; a silent nudge leaves them working on an engine
// they believe they updated, which is the failure this file is paid to avoid.
// ─────────────────────────────────────────────────────────────────────────────

// The whole process table, in four columns. `lstart` is used deliberately over an
// elapsed-seconds field: it is compared as a RAW STRING and never parsed, so no
// date format and no locale can get between two readings of the same app.
// `-A` (all processes) is spelled the same on macOS and Linux.
export const PS_ARGS = ["-Ao", "pid=,ppid=,lstart=,command="];

// What the DESKTOP APP's executable path looks like, matched case-sensitively —
// and that is not a detail. The per-conversation process lives at
// `…/claude-code/<version>/claude.app/Contents/MacOS/claude`, which differs from
// the app's own path ONLY by case. That process is respawned by every new
// conversation, so a case-insensitive match here would call every new tab a
// restart, and silence a nudge that is still true.
const APP_EXECUTABLE = "Claude.app/Contents/MacOS/Claude";

// Belt to that braces: the per-conversation binary always ships under
// `claude-code/`, so anything down that path is disqualified whatever its case.
const PER_CONVERSATION_PATH = "/claude-code/";

// `ps` prints the start instant as five whitespace-separated tokens
// ("Wed Sep  9 09:20:39 2026" — weekday, month, day, time, year), between the
// parent pid and a command that has spaces of its own.
const ROW = /^\s*(\d+)\s+(\d+)\s+(\S+\s+\S+\s+\d+\s+\d+:\d{2}:\d{2}\s+\d{4})\s+(\S.*)$/;

/**
 * Parses `ps` output into `pid → { ppid, startedAt, command }`. Pids are kept as
 * STRINGS: they are only ever compared for equality, and a string survives being
 * written to the marker and read back without a number's rounding or type drift.
 *
 * A line that does not match the four columns is dropped rather than half-parsed:
 * a walk that followed a truncated command would answer confidently and wrongly.
 */
export function parseProcessTable(text) {
  const table = new Map();
  for (const line of String(text ?? "").split("\n")) {
    const row = ROW.exec(line);
    if (!row) continue;
    const [, pid, ppid, startedAt, command] = row;
    table.set(pid, { ppid, startedAt: startedAt.trim(), command });
  }
  return table;
}

/**
 * Walks up the parent chain from `startPid` and returns the first ancestor that
 * is the Claude desktop app, as `{ pid, startedAt }` — or `null` when there is
 * none, which is every CLI session and every platform this match does not cover.
 *
 * The walk is bounded by the processes it has already seen, so a parent cycle
 * ends the search instead of hanging it. This runs in front of every prompt the
 * owner types: a loop here would not slow their brain down, it would freeze it.
 */
export function findClaudeApp({ startPid, table }) {
  const seen = new Set();
  let pid = String(startPid);

  while (pid && !seen.has(pid)) {
    seen.add(pid);
    const proc = table.get(pid);
    if (!proc) return null;
    if (isTheApp(proc.command)) return { pid, startedAt: proc.startedAt };
    pid = proc.ppid;
  }
  return null;
}

function isTheApp(command) {
  return command.includes(APP_EXECUTABLE) && !command.includes(PER_CONVERSATION_PATH);
}

/**
 * The verdict, pure. True ONLY when both identities are fully known and differ —
 * by pid, or by start instant at the same pid, because pids are recycled and a
 * recycled one would otherwise read as "never restarted" forever.
 *
 * Anything unknown yields `false`: not "no restart", but "no restart PROVEN",
 * which is the answer that leaves today's behaviour untouched.
 */
export function appRestartedSince(armed, current) {
  if (!complete(armed) || !complete(current)) return false;
  return armed.pid !== current.pid || armed.startedAt !== current.startedAt;
}

function complete(identity) {
  return Boolean(identity && identity.pid && identity.startedAt);
}

/**
 * The `ps` call as a VALUE, built before anyone runs it (CONVENTIONS.md §5ter): a request
 * a test can read is a request a test can hold to its terms, and the terms here matter.
 *
 * The DEADLINE above all. This runs in front of every prompt the owner types, and a `ps`
 * that never returns would not slow their brain down, it would stop it. And stderr is
 * discarded rather than inherited: `ps` complaining on a locked-down machine must not land
 * in the owner's terminal, since the answer we want from that case is `null` anyway.
 */
export function psInvocation() {
  return { command: "ps", args: PS_ARGS, options: { encoding: "utf8", timeout: 2000, stdio: STDIO } };
}

const STDIO = ["ignore", "pipe", "ignore"];

/**
 * The identity of the Claude app above `pid`, read from the real process table by
 * running `ps` ONCE — the whole table, then the walk in memory, never a spawn per
 * hop. Returns `null` and stays silent when `ps` is absent or refuses (Windows, a
 * locked-down machine): an unanswerable question must cost the caller nothing.
 */
export function readClaudeAppIdentity({ pid, runPs }) {
  try {
    return findClaudeApp({ startPid: pid, table: parseProcessTable(runPs(psInvocation())) });
  } catch {
    return null;
  }
}

/**
 * The one call the engine's hooks make: "which Claude app is above ME, right now?" — or
 * `null`. It exists so the call sites do not each re-decide how `ps` is run.
 */
export function currentClaudeApp({ pid = process.pid, runPs = spawnPs } = {}) {
  return readClaudeAppIdentity({ pid, runPs });
}

// The thin runner: it decides nothing, which is the point of building the request first.
function spawnPs({ command, args, options }) {
  return execFileSync(command, args, options);
}
