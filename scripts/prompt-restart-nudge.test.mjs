import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { runPromptNudge, realNudgeDeps } from "./prompt-restart-nudge.mjs";
import { RESTART_FLAG_REL } from "./lib/restart-nudge.mjs";

// This test file sits in scripts/, exactly like the hook — so the brain root is one
// level up from HERE too, computed independently of the code under test.
const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const BRAIN_ROOT = resolve(SCRIPTS_DIR, "..");

// F20's delivery half. The verdict itself is decided elsewhere (restart-signal.mjs reads the
// disk, restart-nudge.mjs writes the words); this file is only the contract with the harness —
// ask, and answer in the one dialect `UserPromptSubmit` acts on.
function deps({ pending = false, trace = null, writeFails = false, universe = "acme" } = {}) {
  const emitted = [];
  const asked = [];
  const written = [];
  return {
    emitted,
    asked,
    written,
    brainDir: () => "/brain",
    universe: (repo) => {
      asked.push(repo);
      return universe;
    },
    pending: (repo) => {
      asked.push(repo);
      return pending;
    },
    trace: (repo) => {
      asked.push(repo);
      return {
        read: () => trace,
        write: (next) => {
          if (writeFails) throw new Error("read-only disk");
          written.push(next);
        },
      };
    },
    now: () => new Date("2026-09-08T09:02:00.000Z"),
    emit: (payload) => emitted.push(payload),
  };
}

/** What the tick leaves behind when notes arrived and nobody has been told yet. */
const arrived = (over = {}) => ({
  arrivedAt: "2026-09-08T09:00:00.000Z",
  files: ["vault/people/claire.md"],
  authors: ["Claire"],
  blocked: null,
  announcedAt: null,
  ...over,
});

test("a pending restart is injected as context, on the one channel Desktop receives", () => {
  const d = deps({ pending: true });

  assert.equal(runPromptNudge(d), 0);
  assert.deepEqual(d.asked, ["/brain", "/brain"], "both verdicts are asked of the brain the script lives in");
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

// ── What the live sync pulled in while nobody was typing (plan #84, step 4) ──
// The tick has no voice: the search server cannot speak into a conversation, and the
// `FileChanged` event runs code without being able to tell anyone anything (POC 0.2). This
// hook is where the words finally reach someone — at the owner's very next message.

test("notes that arrived are handed to Claude as an instruction, and the trace is stamped as said", () => {
  const d = deps({ trace: arrived() });

  assert.equal(runPromptNudge(d), 0);

  assert.equal(d.emitted.length, 1);
  assert.match(d.emitted[0].hookSpecificOutput.additionalContext, /1 note from Claire/);
  assert.match(d.emitted[0].hookSpecificOutput.additionalContext, /people\/claire\.md/);
  assert.deepEqual(d.written, [{ ...arrived(), announcedAt: "2026-09-08T09:02:00.000Z" }]);
});

// Said once is said. Without the stamp the same three notes would be announced at every
// message for the rest of the session — which is how an announcement becomes noise.
test("a trace already announced adds nothing to the prompt, and is not re-stamped", () => {
  const d = deps({ trace: arrived({ announcedAt: "2026-09-08T09:01:00.000Z" }) });

  assert.equal(runPromptNudge(d), 0);

  assert.deepEqual(d.emitted, []);
  assert.deepEqual(d.written, []);
});

test("a restart pending AND notes arrived: one payload carries both, restart first", () => {
  const d = deps({ pending: true, trace: arrived() });

  assert.equal(runPromptNudge(d), 0);

  assert.equal(d.emitted.length, 1, "one hook, one payload: `additionalContext` is a single string");
  const context = d.emitted[0].hookSpecificOutput.additionalContext;
  assert.ok(context.indexOf("OLD engine") < context.indexOf("1 note from Claire"), "the blocker comes first");
  // One string, yes — but TWO paragraphs. Welded together they read as a single run-on
  // instruction, and the model receives "close and reopen Claude" and "notes arrived" as
  // one thought. The blank line is the whole difference, so it is asserted rather than
  // assumed: neither directive contains one of its own.
  const paragraphs = context.split("\n\n");
  assert.equal(paragraphs.length, 2, "two directives stay two paragraphs, separated by a blank line");
  assert.match(paragraphs[0], /OLD engine/);
  assert.match(paragraphs[1], /^📥 .*1 note from Claire/);
});

test("an empty trace is the ordinary case, and it must cost the prompt nothing", () => {
  const d = deps({ trace: arrived({ files: [], authors: [] }) });

  assert.equal(runPromptNudge(d), 0);
  assert.deepEqual(d.emitted, []);
  assert.deepEqual(d.written, []);
});

// ── The universe that arrived (2026-09-05, "enlève l'attente") ───────────────
// The session-start hook stopped waiting for the pull before naming the active universe
// (ADR 0028), so it can open a session on the sphere this machine went to sleep in. This
// hook is where that gets taken back — at the owner's very next message, and only when the
// pointer really arrived. Without this wiring the removal of the wait would not delay the
// information, it would LOSE it.

test("a universe that arrived is corrected at the next message, and named", () => {
  const d = deps({ trace: arrived({ files: [".vault-rag/active-universe"] }), universe: "blue-team" });

  assert.equal(runPromptNudge(d), 0);

  const context = d.emitted[0].hookSpecificOutput.additionalContext;
  assert.match(context, /'blue-team'/);
  assert.match(context, /correct/i);
  assert.ok(d.asked.includes("/brain"), "the pointer is read from the brain this script lives in");
});

test("a restart pending AND a universe that arrived: the blocker first, the correction next", () => {
  const d = deps({
    pending: true,
    trace: arrived({ files: [".vault-rag/active-universe", "vault/people/claire.md"] }),
    universe: "blue-team",
  });

  assert.equal(runPromptNudge(d), 0);

  const context = d.emitted[0].hookSpecificOutput.additionalContext;
  assert.ok(context.indexOf("OLD engine") < context.indexOf("blue-team"), "the blocker still comes first");
  assert.ok(context.indexOf("blue-team") < context.indexOf("1 note from Claire"), "…then the correction, then the news");
});

// The stamp is a nice-to-have; the announcement is not. A brain on a read-only disk (or one
// whose trace someone chmod'ed) must still say what arrived, and simply say it again later.
test("a trace that cannot be stamped is still announced, and the hook still exits 0", () => {
  const d = deps({ trace: arrived(), writeFails: true });

  assert.equal(runPromptNudge(d), 0);
  assert.equal(d.emitted.length, 1, "the owner hears about their notes even when the stamp fails");
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

test("realNudgeDeps.trace reads the arrivals file of the brain it is handed, and writes it back", () => {
  const dir = mkdtempSync(join(tmpdir(), "prompt-nudge-trace-"));
  try {
    const trace = realNudgeDeps.trace(dir);
    assert.equal(trace.read(), null, "a brain that never synced has nothing to announce");

    const record = { arrivedAt: "2026-09-08T09:00:00.000Z", files: ["vault/a.md"], authors: ["Claire"], blocked: null, announcedAt: null };
    trace.write(record);

    assert.deepEqual(realNudgeDeps.trace(dir).read(), record, "the very bytes the tick writes, read back here");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("realNudgeDeps.universe reads the pointer of the brain it is handed, VALIDATED against the registry", () => {
  const dir = mkdtempSync(join(tmpdir(), "prompt-nudge-universe-"));
  try {
    assert.equal(realNudgeDeps.universe(dir), "default", "a brain with no pointer works in the default scope");

    mkdirSync(join(dir, ".vault-rag"), { recursive: true });
    writeFileSync(join(dir, ".vault-rag", "universes.json"), JSON.stringify({ universes: ["blue-team"] }));
    writeFileSync(join(dir, ".vault-rag", "active-universe"), "blue-team\n");
    assert.equal(realNudgeDeps.universe(dir), "blue-team");

    // A pointer naming a universe that is gone is an orphan: the scope really IS the
    // default, and announcing the ghost would name a sphere nothing can be found in.
    writeFileSync(join(dir, ".vault-rag", "active-universe"), "vanished\n");
    assert.equal(realNudgeDeps.universe(dir), "default");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("realNudgeDeps.now is the real clock, so a stamp says when it was really said", () => {
  const before = Date.now();

  const stamped = realNudgeDeps.now();

  assert.ok(stamped instanceof Date);
  assert.ok(stamped.getTime() >= before && stamped.getTime() <= Date.now() + 1000);
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

test("the CLI, IMPORTED rather than run — the body must not fire on import", async () => {
  // The whole point of the shared tail: importing the module runs nothing. Asserted from
  // a child process so an accidental process.exit() cannot take the suite with it.
  const cli = join(SCRIPTS_DIR, "prompt-restart-nudge.mjs");
  const probe = `import("${pathToFileURL(cli).href}").then(() => { console.log("imported-and-still-alive"); });`;
  const run = spawnSync(process.execPath, ["--input-type=module", "-e", probe], { encoding: "utf8" });

  assert.equal(run.status, 0, `importing the CLI must not exit — stderr: ${run.stderr}`);
  assert.equal(run.stdout.trim(), "imported-and-still-alive");
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
