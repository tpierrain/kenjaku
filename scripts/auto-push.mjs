#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// auto-push.mjs — Stop hook. SWEEP-commits any out-of-band write (a Bash-side
// file the PostToolUse net cannot see — issue #69), then pushes the pending
// commits ONCE per turn (the Stop event fires once per main-agent turn, whatever
// the number of edits), so 30 edits = 30 local commits + 1 push. Best-effort:
// never blocks the turn, always exits 0. auto-commit.mjs (PostToolUse) stays
// commit-only.
//
// Cross-OS: pure Node, no shell dependency. Repo root derived from the script
// location (not the hook's cwd).
// ─────────────────────────────────────────────────────────────────────────────
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { shouldPush } from "./lib/git-push.mjs";
import { attemptCommit } from "./auto-commit.mjs";
import { runAsEntrypoint } from "./lib/entrypoint.mjs";

// attemptPush — testable core. `git` is an injected runner (args[]) → {out, ok};
// `sleep` is an injected blocking pause (ms). Returns "pushed" | "skipped" |
// "failed". NEVER throws (a throwing runner is swallowed → treated as failure).
export function attemptPush({ git, sleep }) {
  try {
    const hasRemote = git(["remote"]).out.trim().length > 0;
    const autopush =
      git(["config", "--get", "secondbrain.autopush"]).out.trim() === "true";
    const hasUpstream = git([
      "rev-parse",
      "--abbrev-ref",
      "--symbolic-full-name",
      "@{u}",
    ]).ok;
    const unpushedCount = hasUpstream
      ? Number(git(["rev-list", "--count", "@{u}..HEAD"]).out.trim()) || 0
      : 0;

    if (!shouldPush({ hasRemote, autopush, hasUpstream, unpushedCount })) {
      return "skipped";
    }
    if (git(["push"]).ok) return "pushed";
    // One retry after a short pause (transient network blip). Still KO → give up,
    // best-effort: the local commits are the safety net, the next Stop catches up.
    sleep(3000);
    if (git(["push"]).ok) return "pushed";
    return "failed";
  } catch {
    // Best-effort: never let a hook failure block the turn.
    return "failed";
  }
}

// ── CLI wiring (the real Stop hook seams, extracted so they are testable) ────
// Builds the real git runner bound to `repo`. `execFile` is injected (default:
// execFileSync) so the ok/failure mapping is unit-testable without a real git.
export function buildGit(repo, execFile = execFileSync) {
  return (args) => {
    try {
      const out = execFile("git", args, {
        cwd: repo,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        // A hung git (dead network mount, wedged credential helper) maps to a
        // plain {ok:false} instead of eating the hook's whole 30s budget — a
        // hook killed at ITS deadline mid-commit can leave .git/index.lock
        // behind, while a timed-out child is reaped cleanly here.
        timeout: 10000,
      });
      return { out: out ?? "", ok: true };
    } catch (e) {
      return { out: `${e.stdout ?? ""}${e.stderr ?? ""}`, ok: false };
    }
  };
}

// Blocking pause (the hook runs synchronously, under a Claude Code timeout).
export const realSleep = (ms) =>
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

export const PUSH_FAILED_WARNING =
  "\n⚠️  PUSH FAILED — local commits OK but not pushed. Check your network; " +
  "the next turn will retry automatically (or run: git push).\n";

// Said out loud because the silent version IS issue #69's failure class: a git
// that refuses every sweep (stale .git/index.lock, missing identity) would
// otherwise leave changes uncommitted at every turn end with no signal at all.
export const SWEEP_FAILED_WARNING =
  "\n⚠️  SWEEP FAILED — some changes stay uncommitted on this machine. Run " +
  "`git status` in your brain to see what stopped the commit (a stale " +
  ".git/index.lock or a missing git identity are the usual causes).\n";

// Runs the hook: SWEEP-commit, then push (issue #69, class removal). A file
// written through Bash — yesterday the universe pointer, tomorrow anything —
// never fires the PostToolUse net; the Stop hook is the turn's last hand, so it
// commits whatever is dirty before pushing, instead of leaving the dirt to a
// next-session sweep that can lose to another machine's stale state. The sweep
// reuses attemptCommit (same message, same refusal of an unmerged tree) and is
// wrapped best-effort: it assumes buildGit's non-throwing runner, and a hook
// must never let a persistence hiccup block the turn. Prints a non-blocking
// warning on push failure. ALWAYS returns 0. `write` is injected for testing.
export function runHook({ git, sleep, write }) {
  try {
    // "failed" is worth a shout (review finding, v4.9.1) — "conflicted" is not:
    // the SessionStart banner already owns the unmerged-tree alarm.
    if (attemptCommit({ git }) === "failed") write(SWEEP_FAILED_WARNING);
  } catch {
    // A THROWING runner means git itself is broken — the push below fails too
    // and its warning already says "check"; one shout per turn is enough.
  }
  if (attemptPush({ git, sleep }) === "failed") write(PUSH_FAILED_WARNING);
  return 0;
}

// Repo root derived from THIS module's location (one level up from scripts/),
// not the hook's cwd. `metaUrl` is injected so it is testable.
export function repoRoot(metaUrl) {
  return resolve(dirname(fileURLToPath(metaUrl)), "..");
}

// Real stdout writer (forwards to process.stdout).
export const realWrite = (s) => process.stdout.write(s);

// The real hook wiring: a git runner bound to the repo root, the blocking sleep
// and the real writer. Injected as one object into runHook at the entry point.
export function realHookDeps(metaUrl) {
  return { git: buildGit(repoRoot(metaUrl)), sleep: realSleep, write: realWrite };
}

// ── CLI entry (the actual Stop hook) ─────────────────────────────────────────
// Guarded so importing this module in tests does NOT run it. Wires the real
// git/sleep/write, then ALWAYS exits 0 (ignores the hook stdin). The shared tail
// compares REAL paths (review finding, v4.9.1): the bare resolve() comparison
// silently disarmed the whole hook on any brain whose path holds a symlink
// (macOS /var → /private/var being the everyday case).
runAsEntrypoint(import.meta.url, process.argv, () => runHook(realHookDeps(import.meta.url)));
