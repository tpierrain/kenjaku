import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { runPromptNudge, realNudgeDeps } from "./prompt-restart-nudge.mjs";
import { RESTART_FLAG_REL } from "./lib/restart-nudge.mjs";

// This test file sits in scripts/, exactly like the hook — so the brain root is one
// level up from HERE too, computed independently of the code under test.
const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const BRAIN_ROOT = resolve(SCRIPTS_DIR, "..");

// F20's delivery half. The verdict itself is decided elsewhere (restart-signal.mjs reads the
// disk, restart-nudge.mjs writes the words); this file is only the contract with the harness —
// ask, and answer in the one dialect `UserPromptSubmit` acts on.
function deps({ pending = false } = {}) {
  const emitted = [];
  const asked = [];
  return {
    emitted,
    asked,
    brainDir: () => "/brain",
    pending: (repo) => {
      asked.push(repo);
      return pending;
    },
    emit: (payload) => emitted.push(payload),
  };
}

test("a pending restart is injected as context, on the one channel Desktop receives", () => {
  const d = deps({ pending: true });

  assert.equal(runPromptNudge(d), 0);
  assert.deepEqual(d.asked, ["/brain"], "the verdict is asked of the brain the script lives in");
  assert.equal(d.emitted.length, 1);
  assert.equal(d.emitted[0].hookSpecificOutput.hookEventName, "UserPromptSubmit");
  assert.match(d.emitted[0].hookSpecificOutput.additionalContext, /old engine/i);
  assert.equal(
    d.emitted[0].hookSpecificOutput.permissionDecision,
    undefined,
    "it injects and never blocks: a wrong verdict costs a sentence, not a locked-out owner",
  );
});

// The normal case, on every prompt of every session for the rest of the brain's life: it must
// add exactly nothing. An `additionalContext` emitted with an empty body would still be a
// paragraph of instructions the model reads before each answer.
test("a converged brain has nothing injected into its prompts", () => {
  const d = deps();

  assert.equal(runPromptNudge(d), 0);
  assert.deepEqual(d.emitted, []);
});

test("a verdict that blows up leaves the prompt alone, and the hook still exits 0", () => {
  const emitted = [];
  const code = runPromptNudge({
    brainDir: () => "/brain",
    pending: () => {
      throw new Error("unreadable .cache");
    },
    emit: (payload) => emitted.push(payload),
  });

  assert.equal(code, 0);
  assert.deepEqual(emitted, []);
});

// ── realNudgeDeps — the wiring nothing above can reach ───────────────────────
// Every test above injects its own deps, so the REAL ones — where the brain root is
// read from, which disk verdict is consulted, the one line the harness parses — are
// observed by nobody. A mis-wire here passes all three and nudges nobody.

test("realNudgeDeps.brainDir is the brain root, one level above scripts/", () => {
  assert.equal(realNudgeDeps.brainDir(), BRAIN_ROOT);
});

test("realNudgeDeps.emit prints the payload as ONE line of JSON on stdout", () => {
  const original = console.log;
  const lines = [];
  console.log = (line) => lines.push(line);
  try {
    realNudgeDeps.emit({ hookSpecificOutput: { hookEventName: "UserPromptSubmit" } });
  } finally {
    console.log = original;
  }

  assert.deepEqual(lines, ['{"hookSpecificOutput":{"hookEventName":"UserPromptSubmit"}}']);
});

test("realNudgeDeps.pending reads the flag on disk, for the brain it is handed", () => {
  const dir = mkdtempSync(join(tmpdir(), "prompt-nudge-"));
  try {
    assert.equal(realNudgeDeps.pending(dir), false, "an empty folder is not a brain awaiting a restart");

    mkdirSync(join(dir, ".cache"), { recursive: true });
    writeFileSync(join(dir, RESTART_FLAG_REL), "restart needed\n");

    assert.equal(realNudgeDeps.pending(dir), true);
  } finally {
    rmSync(dir, { recursive: true });
  }
});

// The whole hook, run the way the harness runs it: a real child process, the payload on
// stdout. The only test that exercises the entrypoint guard — i.e. that the file DOES
// something when executed. The flag is planted in the real brain root (it lives under the
// gitignored .cache/, so it commits nothing) because that root is what the script derives.
test("run as the harness runs it, the hook injects the directive on stdout", () => {
  const flag = join(BRAIN_ROOT, RESTART_FLAG_REL);
  const preexisting = existsSync(flag);
  if (!preexisting) {
    mkdirSync(dirname(flag), { recursive: true });
    writeFileSync(flag, "restart needed (test)\n");
  }
  try {
    const run = spawnSync(process.execPath, [join(SCRIPTS_DIR, "prompt-restart-nudge.mjs")], {
      encoding: "utf8",
    });

    assert.equal(run.status, 0, run.stderr);
    const payload = JSON.parse(run.stdout);
    assert.equal(payload.hookSpecificOutput.hookEventName, "UserPromptSubmit");
    assert.match(payload.hookSpecificOutput.additionalContext, /old engine/i);
  } finally {
    if (!preexisting) rmSync(flag, { force: true });
  }
});

test("what it injects stays short — volume IS the defect (F5)", () => {
  // Harsher than the bound on a session start: this rides EVERY prompt while the restart is
  // pending, so an owner who keeps working reads it again and again. Long enough to say what
  // to do, short enough that re-reading it costs nothing.
  const d = deps({ pending: true });
  runPromptNudge(d);

  const injected = d.emitted[0].hookSpecificOutput.additionalContext;
  assert.ok(injected.length <= 360, `the injected directive grew to ${injected.length} chars:\n${injected}`);
});
