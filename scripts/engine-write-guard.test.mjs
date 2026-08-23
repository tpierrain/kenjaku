import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { runGuard, realGuardDeps } from "./engine-write-guard.mjs";

// This test file sits in scripts/, exactly like the hook — so the brain root is one
// level up from HERE too, computed independently of the code under test.
const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const BRAIN_ROOT = resolve(SCRIPTS_DIR, "..");

// ═══════════════════════════════════════════════════════════════════════════
// The WIRING half of S3. `scripts/lib/engine-write-guard.mjs` already decides
// (three-way verdict, 98.89 %); this file is the entry script Claude Code runs
// as a `PreToolUse(Write|Edit)` hook. Its whole job is the contract with the
// harness: read the hook JSON on stdin, ask, and answer in the one dialect the
// harness acts on. A decision nobody reads stops nothing.
//
// FAIL-OPEN, like its precedent: this hook stands in front of every write the
// brain makes, so anything it cannot judge passes, in silence.
// ═══════════════════════════════════════════════════════════════════════════

// A manifest that exists nowhere on disk, so a verdict matching it proves the
// INJECTED manifest was the one consulted rather than the repo's own.
const STUB_MANIFEST = { regimes: { replace: ["scripts/only-in-the-stub.mjs"] } };

const hookInput = ({ tool = "Write", path = "/brain/scripts/only-in-the-stub.mjs" } = {}) =>
  JSON.stringify({ tool_name: tool, tool_input: { file_path: path } });

const captured = (overrides = {}) => {
  const emitted = [];
  const code = runGuard({
    readInput: () => hookInput(),
    brainDir: () => "/brain",
    readManifest: () => STUB_MANIFEST,
    emit: (payload) => emitted.push(payload),
    ...overrides,
  });
  return { emitted, code };
};

// ── fail-open, which is the condition of survival for a hook this exposed ──

test("stdin that is not the hook JSON lets the write THROUGH, silently, without throwing", () => {
  for (const junk of ["", "not json at all", "null"]) {
    const { emitted, code } = captured({ readInput: () => junk });

    assert.deepEqual(emitted, [], `junk stdin produced a payload: ${junk}`);
    assert.equal(code, 0, `junk stdin produced a non-zero exit: ${junk}`);
  }
});

test("a manifest that cannot be read lets an engine-file write through, in silence", () => {
  const { emitted, code } = captured({
    readManifest: () => {
      throw new Error("no manifest here");
    },
  });

  assert.deepEqual(emitted, []);
  assert.equal(code, 0);
});

test("...but the recorded base is STILL refused, manifest or no manifest", () => {
  // The one verdict that is not fail-open, asserted end to end rather than only
  // in the pure module: it must survive the wiring, not just the decision.
  const { emitted, code } = captured({
    readInput: () => hookInput({ path: "/brain/.engine-base/CLAUDE.md" }),
    readManifest: () => {
      throw new Error("no manifest here");
    },
  });

  assert.equal(code, 0);
  assert.equal(emitted.length, 1);
  assert.equal(emitted[0].hookSpecificOutput.permissionDecision, "deny");
});

test("a payload with no tool_input at all is allowed, not crashed on", () => {
  // The `?.` on `input.tool_input` cannot be KILLED — without it the read throws
  // and the outer catch-all produces the same silence — so this test earns its
  // place on the behaviour, not on the mutant: the day that catch-all is
  // narrowed, a malformed payload must still fail open here rather than there.
  const { emitted, code } = captured({ readInput: () => JSON.stringify({ tool_name: "Write" }) });

  assert.deepEqual(emitted, []);
  assert.equal(code, 0);
});

test("a file no regime names goes through with nothing for the owner to read", () => {
  const { emitted, code } = captured({ readInput: () => hookInput({ path: "/brain/vault/notes/mine.md" }) });

  assert.deepEqual(emitted, []);
  assert.equal(code, 0);
});

// ── the dialect the harness acts on ────────────────────────────────────────

test("an engine file is ASKED about, in the harness's own dialect, naming the file and the price", () => {
  const { emitted, code } = captured();

  assert.equal(code, 0);
  assert.equal(emitted.length, 1);
  assert.equal(emitted[0].hookSpecificOutput.hookEventName, "PreToolUse");
  assert.equal(emitted[0].hookSpecificOutput.permissionDecision, "ask");
  assert.match(emitted[0].hookSpecificOutput.permissionDecisionReason, /scripts\/only-in-the-stub\.mjs/);
  assert.match(emitted[0].hookSpecificOutput.permissionDecisionReason, /overwrite/);
});

test("the reason travels — an ask with no sentence is a dialog the owner cannot answer", () => {
  const { emitted } = captured();

  assert.equal(typeof emitted[0].hookSpecificOutput.permissionDecisionReason, "string");
  assert.ok(emitted[0].hookSpecificOutput.permissionDecisionReason.length > 0);
});

test("the real emit writes ONE line of JSON on stdout, which is all the harness parses", () => {
  const lines = [];
  const original = console.log;
  console.log = (line) => lines.push(line);
  try {
    realGuardDeps.emit({ hookSpecificOutput: { permissionDecision: "ask" } });
  } finally {
    console.log = original;
  }

  assert.deepEqual(lines, ['{"hookSpecificOutput":{"permissionDecision":"ask"}}']);
});

// ── the real dependencies, which no injected stub can vouch for ────────────

test("the brain root is derived from the module's location, never from the hook's cwd", () => {
  // A hook runs with whatever cwd the harness had. Reading it would make the
  // guard judge paths against a directory that is not the brain.
  assert.equal(realGuardDeps.brainDir(), BRAIN_ROOT);
});

test("the real manifest read returns the repo's own regimes, and never throws", () => {
  const manifest = realGuardDeps.readManifest(BRAIN_ROOT);

  assert.ok(Array.isArray(manifest.regimes.replace), "the real manifest must be parsed, not swallowed");
  assert.deepEqual(realGuardDeps.readManifest(join(BRAIN_ROOT, "no", "such", "brain")), null);
});

// ── run the way the harness runs it ────────────────────────────────────────

test("run as the harness runs it, the hook reads stdin and asks on stdout", () => {
  // Against the REAL manifest at the repo root: `scripts/lib/**` is `replace`
  // there, so this also proves the entry reads the manifest off the disk.
  const run = spawnSync(process.execPath, [join(SCRIPTS_DIR, "engine-write-guard.mjs")], {
    input: JSON.stringify({
      tool_name: "Edit",
      tool_input: { file_path: join(BRAIN_ROOT, "scripts", "lib", "glob-match.mjs") },
    }),
    encoding: "utf8",
  });

  assert.equal(run.status, 0, run.stderr);
  const payload = JSON.parse(run.stdout);
  assert.equal(payload.hookSpecificOutput.hookEventName, "PreToolUse");
  assert.equal(payload.hookSpecificOutput.permissionDecision, "ask");
  assert.match(payload.hookSpecificOutput.permissionDecisionReason, /scripts\/lib\/glob-match\.mjs/);
});

test("run as the harness runs it, a write the guard does not judge prints NOTHING", () => {
  // An empty stdout is the whole silent path: the harness must see no payload,
  // not a payload saying "allow".
  const run = spawnSync(process.execPath, [join(SCRIPTS_DIR, "engine-write-guard.mjs")], {
    input: JSON.stringify({
      tool_name: "Write",
      tool_input: { file_path: join(BRAIN_ROOT, "vault", "notes", "mine.md") },
    }),
    encoding: "utf8",
  });

  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.stdout, "");
});

test("the hook, IMPORTED rather than run — the body must not fire on import", () => {
  // The whole point of the entrypoint tail: importing the module runs nothing (in
  // particular, it never blocks reading stdin). Asserted from a child process so an
  // accidental process.exit() cannot take the suite with it.
  const probe = `import("${pathToFileURL(join(SCRIPTS_DIR, "engine-write-guard.mjs")).href}").then(() => { console.log("imported-and-still-alive"); });`;
  const run = spawnSync(process.execPath, ["--input-type=module", "-e", probe], { encoding: "utf8" });

  assert.equal(run.status, 0, `importing the hook must not exit — stderr: ${run.stderr}`);
  assert.equal(run.stdout.trim(), "imported-and-still-alive");
});

// ── the wiring, and the trap it has to step around ─────────────────────────

const templateHooks = () =>
  JSON.parse(readFileSync(join(BRAIN_ROOT, ".claude", "settings.json.template"), "utf8")).hooks ?? {};

test("the guard is wired as a PreToolUse(Write|Edit) hook in the template", () => {
  const groups = templateHooks().PreToolUse ?? [];
  const mine = groups.filter((g) => (g.hooks ?? []).some((h) => h.command.includes("engine-write-guard.mjs")));

  assert.equal(mine.length, 1, "exactly one group must carry the guard");
  assert.equal(mine[0].matcher, "Write|Edit");
});

test("🪤 THE TRAP: the guard has its OWN group, because reconcileHooks only ever sees a group's FIRST script", () => {
  // `reconcileHooks` identifies a template group by
  // `(group.hooks ?? []).map(hookScript).find(Boolean)` and skips the group when
  // that script is already wired in the brain. Added as a second entry beside
  // `vault-write-guard` — present in every brain since v4.5 — this hook would
  // reach ZERO deployed brains, with nothing thrown and nothing reported.
  for (const [event, groups] of Object.entries(templateHooks())) {
    for (const group of groups) {
      const scripts = (group.hooks ?? []).flatMap((h) => h.command.match(/scripts\/[\w.-]+\.mjs/g) ?? []);
      assert.equal(
        scripts.length,
        1,
        `${event} group [${group.matcher}] wires ${scripts.length} scripts (${scripts.join(", ")}) — ` +
          `only the first would ever be delivered to a deployed brain`,
      );
    }
  }
});
