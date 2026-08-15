import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  attemptPush,
  buildGit,
  realSleep,
  runHook,
  repoRoot,
  realWrite,
  realHookDeps,
  PUSH_FAILED_WARNING,
  SWEEP_FAILED_WARNING,
} from "./auto-push.mjs";
import { COMMIT_MESSAGE } from "./auto-commit.mjs";

// auto-push.mjs is the Stop hook: it pushes the pending commits ONCE per turn,
// best-effort. attemptPush() is the testable core — the git runner is injected,
// so no real network/process is involved. It returns a status describing the
// outcome: "pushed" | "skipped" | "failed". It must NEVER throw.
//
// Mutation score 92.39 % — the 7 residual survivors are all documented equivalents:
//   • `Number(...out.trim())` losing its `.trim()` (Number() already trims surrounding
//     whitespace, so the mutant is behaviour-identical);
//   • the 6 mutants inside the `import.meta.url` entry-point guard (its condition +
//     body only run when THIS file IS the process — unreachable from a unit test).
// Effective 100 % on non-equivalent mutants.

// Fake git runner keyed on the FULL command (args.join(" ")), not just args[0],
// so mutating ANY arg string (e.g. "--get", "@{u}..HEAD") yields an unknown
// command → a broken/neutral {ok:false} answer that fails the happy path → the
// mutant is caught. Records every call so tests can assert push discipline.
function makeGit({ remote = "", autopush = false, upstream = false, unpushed = 0, pushOk = true, status = "" } = {}) {
  const calls = [];
  // Real git output carries trailing newlines → the code must .trim(); we mirror
  // that so trim-removing mutants change the outcome.
  // Commits are COUNTED so `rev-list` answers like real git: a commit the sweep
  // just made becomes pending. A mutant pushing BEFORE the sweep reads 0 pending
  // → skips the push → the ordering test fails it.
  let commits = 0;
  const responses = () => ({
    "status --porcelain": { out: status, ok: true },
    "add .": { out: "", ok: true },
    [`commit -m ${COMMIT_MESSAGE}`]: { out: "", ok: true },
    "remote": { out: remote, ok: true },
    "config --get secondbrain.autopush": { out: autopush ? "true\n" : "", ok: true },
    "rev-parse --abbrev-ref --symbolic-full-name @{u}": {
      out: upstream ? "origin/main\n" : "",
      ok: upstream,
    },
    "rev-list --count @{u}..HEAD": { out: `${unpushed + commits}\n`, ok: true },
    "push": { out: pushOk ? "" : "fatal: unable to access", ok: pushOk },
  });
  const git = (args) => {
    const key = args.join(" ");
    calls.push(key);
    const res = responses()[key] ?? { out: "", ok: false };
    if (key.startsWith("commit ") && res.ok) commits += 1;
    return res;
  };
  return { git, calls };
}

const noSleep = () => {};

test("auto-push — no remote → skipped, push never called", () => {
  const { git, calls } = makeGit({ remote: "", autopush: true, upstream: true, unpushed: 3 });
  const status = attemptPush({ git, sleep: noSleep });
  assert.equal(status, "skipped");
  assert.ok(!calls.some((c) => c.startsWith("push")), "no network push attempted");
});

test("auto-push — whitespace-only `git remote` output counts as no remote (trim) → skipped", () => {
  const { git, calls } = makeGit({ remote: "\n  ", autopush: true, upstream: true, unpushed: 3 });
  assert.equal(attemptPush({ git, sleep: noSleep }), "skipped");
  assert.ok(!calls.some((c) => c.startsWith("push")), "trimmed-empty remote → no push");
});

test("auto-push — remote+autopush+upstream+pending → pushed once", () => {
  const { git, calls } = makeGit({ remote: "origin", autopush: true, upstream: true, unpushed: 3 });
  const status = attemptPush({ git, sleep: noSleep });
  assert.equal(status, "pushed");
  assert.equal(calls.filter((c) => c.startsWith("push")).length, 1, "exactly one push");
});

test("auto-push — autopush disabled gates the push even when everything else is ready → skipped", () => {
  const { git, calls } = makeGit({ remote: "origin", autopush: false, upstream: true, unpushed: 3 });
  assert.equal(attemptPush({ git, sleep: noSleep }), "skipped");
  assert.ok(!calls.some((c) => c.startsWith("push")), "no push without secondbrain.autopush=true");
});

test("auto-push — upstream set but nothing pending → skipped, no network push", () => {
  const { git, calls } = makeGit({ remote: "origin", autopush: true, upstream: true, unpushed: 0 });
  const status = attemptPush({ git, sleep: noSleep });
  assert.equal(status, "skipped");
  assert.ok(!calls.some((c) => c.startsWith("push")), "no network push when @{u}..HEAD empty");
});

test("auto-push — a throwing git runner is swallowed → failed, never propagates", () => {
  const git = () => { throw new Error("git binary missing"); };
  let status;
  assert.doesNotThrow(() => { status = attemptPush({ git, sleep: noSleep }); });
  assert.equal(status, "failed");
});

test("auto-push — push fails → 1 retry after a pause → still KO → failed", () => {
  const { git, calls } = makeGit({
    remote: "origin", autopush: true, upstream: true, unpushed: 3, pushOk: false,
  });
  let sleeps = 0;
  const status = attemptPush({ git, sleep: () => { sleeps += 1; } });
  assert.equal(status, "failed");
  assert.equal(calls.filter((c) => c.startsWith("push")).length, 2, "initial push + 1 retry");
  assert.equal(sleeps, 1, "one pause between the two attempts");
});

test("auto-push — first push KO, retry OK → pushed, pause is exactly 3000ms", () => {
  let pushAttempts = 0;
  const git = (args) => {
    switch (args[0]) {
      case "remote": return { out: "origin", ok: true };
      case "config": return { out: "true", ok: true };
      case "rev-parse": return { out: "origin/main", ok: true };
      case "rev-list": return { out: "3", ok: true };
      case "push":
        pushAttempts += 1;
        return { out: "", ok: pushAttempts >= 2 }; // 1st KO, 2nd OK
      default: return { out: "", ok: true };
    }
  };
  const sleepArgs = [];
  const status = attemptPush({ git, sleep: (ms) => sleepArgs.push(ms) });
  assert.equal(status, "pushed");
  assert.equal(pushAttempts, 2, "initial push + 1 retry");
  assert.deepEqual(sleepArgs, [3000], "one 3000ms pause before the retry");
});

// ── CLI seams (buildGit, runHook, realSleep) — the untested Stop-hook wiring ──
test("buildGit — maps a successful execFile to {out, ok:true} with the right git call", () => {
  const seen = [];
  const execFile = (bin, args, opts) => {
    seen.push({ bin, args, opts });
    return "some output";
  };
  const git = buildGit("/repo", execFile);
  const res = git(["remote"]);
  assert.deepEqual(res, { out: "some output", ok: true });
  assert.equal(seen[0].bin, "git");
  assert.deepEqual(seen[0].args, ["remote"]);
  assert.equal(seen[0].opts.cwd, "/repo");
  assert.equal(seen[0].opts.encoding, "utf8");
  assert.deepEqual(seen[0].opts.stdio, ["ignore", "pipe", "pipe"]);
  // A hung git (dead network mount, wedged credential helper) must not eat the
  // Stop hook's whole 30s budget — nor block a /switch (review finding, v4.9.1).
  assert.equal(seen[0].opts.timeout, 10000);
});

test("buildGit — null execFile output becomes '' (ok:true)", () => {
  const git = buildGit("/repo", () => null);
  assert.deepEqual(git(["remote"]), { out: "", ok: true });
});

test("buildGit — a throwing execFile → {ok:false}, out = stdout+stderr concatenated", () => {
  const git = buildGit("/repo", () => {
    const e = new Error("boom");
    e.stdout = "OUT";
    e.stderr = "ERR";
    throw e;
  });
  assert.deepEqual(git(["push"]), { out: "OUTERR", ok: false });
});

test("buildGit — throwing execFile with no stdout/stderr → out = '' (ok:false)", () => {
  const git = buildGit("/repo", () => { throw new Error("boom"); });
  assert.deepEqual(git(["push"]), { out: "", ok: false });
});

test("runHook — push failed → writes the warning, returns 0", () => {
  const git = () => { throw new Error("git missing"); }; // → attemptPush returns "failed"
  const writes = [];
  const code = runHook({ git, sleep: () => {}, write: (s) => writes.push(s) });
  assert.equal(code, 0);
  assert.deepEqual(writes, [PUSH_FAILED_WARNING]);
});

test("runHook — nothing to push (skipped) → no warning, returns 0", () => {
  const { git } = makeGit({ remote: "", autopush: true, upstream: true, unpushed: 3 });
  const writes = [];
  const code = runHook({ git, sleep: () => {}, write: (s) => writes.push(s) });
  assert.equal(code, 0);
  assert.equal(writes.length, 0);
});

test("runHook — successful push → no warning, returns 0", () => {
  const { git } = makeGit({ remote: "origin", autopush: true, upstream: true, unpushed: 3 });
  const writes = [];
  const code = runHook({ git, sleep: () => {}, write: (s) => writes.push(s) });
  assert.equal(code, 0);
  assert.equal(writes.length, 0);
});

// ── Stop-hook sweep (issue #69, class removal): commit out-of-band writes ────
// A file written through Bash (yesterday the universe pointer, tomorrow anything)
// never fires the PostToolUse net. The Stop hook is the last hand of the turn, so
// it sweeps: commit whatever is dirty, THEN push — instead of leaving the dirt to
// a next-session sweep that can lose to another machine's stale state.

test("runHook — sweeps out-of-band dirt into a commit BEFORE pushing", () => {
  const { git, calls } = makeGit({
    remote: "origin", autopush: true, upstream: true, unpushed: 0,
    status: " M .vault-rag/active-universe\n",
  });
  const code = runHook({ git, sleep: () => {}, write: () => {} });

  assert.equal(code, 0);
  const add = calls.indexOf("add .");
  const commit = calls.indexOf(`commit -m ${COMMIT_MESSAGE}`);
  const push = calls.indexOf("push");
  assert.ok(add !== -1, "the dirt is staged");
  assert.ok(commit !== -1, "the dirt is committed");
  assert.ok(push !== -1, "then pushed");
  assert.ok(add < commit && commit < push, `sweep before push, got: ${calls.join(" | ")}`);
});

test("runHook — refuses to sweep an unmerged tree but still pushes what is committed", () => {
  const { git, calls } = makeGit({
    remote: "origin", autopush: true, upstream: true, unpushed: 2,
    status: "UU vault/note.md\n",
  });
  const code = runHook({ git, sleep: () => {}, write: () => {} });

  assert.equal(code, 0);
  assert.ok(!calls.includes("add ."), "an unmerged tree is never staged (conflict markers)");
  assert.ok(calls.includes("push"), "the already-committed work still leaves the machine");
});

test("runHook — a sweep that git refuses is said OUT LOUD (review finding, v4.9.1)", () => {
  // A stale .git/index.lock or a missing git identity makes attemptCommit return
  // "failed" at EVERY Stop — silently swallowed, that is issue #69's silent-
  // persistence class relocated into the hook itself.
  const { git } = makeGit({
    remote: "origin", autopush: true, upstream: true, unpushed: 0,
    status: " M .vault-rag/active-universe\n",
  });
  const gitRefusingCommit = (args) =>
    args[0] === "commit" ? { out: "fatal: no user.email", ok: false } : git(args);
  const writes = [];
  const code = runHook({ git: gitRefusingCommit, sleep: () => {}, write: (s) => writes.push(s) });

  assert.equal(code, 0);
  assert.deepEqual(writes, [SWEEP_FAILED_WARNING]);
});

test("runHook — a conflicted tree stays silent here (the SessionStart banner owns that shout)", () => {
  const { git } = makeGit({
    remote: "origin", autopush: true, upstream: true, unpushed: 0,
    status: "UU vault/note.md\n",
  });
  const writes = [];
  runHook({ git, sleep: () => {}, write: (s) => writes.push(s) });

  assert.deepEqual(writes, []);
});

test("SWEEP_FAILED_WARNING — whole-text pin (fragment matches let half of it blank)", () => {
  assert.equal(
    SWEEP_FAILED_WARNING,
    "\n⚠️  SWEEP FAILED — some changes stay uncommitted on this machine. Run " +
      "`git status` in your brain to see what stopped the commit (a stale " +
      ".git/index.lock or a missing git identity are the usual causes).\n"
  );
});

test("runHook — a clean tree sweeps nothing (no add, no commit)", () => {
  const { git, calls } = makeGit({
    remote: "origin", autopush: true, upstream: true, unpushed: 3, status: "",
  });
  runHook({ git, sleep: () => {}, write: () => {} });

  assert.ok(!calls.includes("add ."));
  assert.ok(!calls.some((c) => c.startsWith("commit")));
});

test("PUSH_FAILED_WARNING — mentions the push failure and the retry", () => {
  assert.match(PUSH_FAILED_WARNING, /PUSH FAILED/);
  assert.match(PUSH_FAILED_WARNING, /git push/);
});

test("realSleep — a 0ms pause returns immediately without throwing", () => {
  // Atomics.wait on an unchanged value with a 0ms timeout returns 'timed-out'.
  assert.equal(realSleep(0), "timed-out");
});

test("repoRoot — resolves ONE level up from the module (scripts/ → repo root)", () => {
  const here = fileURLToPath(import.meta.url);
  const expected = resolve(dirname(here), "..");
  assert.equal(repoRoot(import.meta.url), expected);
  // sanity: it is strictly a parent, not the scripts dir itself
  assert.notEqual(repoRoot(import.meta.url), dirname(here));
});

test("realWrite — forwards its argument to process.stdout.write", () => {
  const orig = process.stdout.write;
  const seen = [];
  process.stdout.write = (s) => { seen.push(s); return true; };
  try {
    realWrite("payload");
  } finally {
    process.stdout.write = orig;
  }
  assert.deepEqual(seen, ["payload"]);
});

test("realHookDeps — wires a git runner + the real sleep + the real writer", () => {
  const deps = realHookDeps(import.meta.url);
  assert.equal(typeof deps.git, "function");
  assert.equal(deps.sleep, realSleep);
  assert.equal(deps.write, realWrite);
});
