import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { runGuard, realGuardDeps } from "./vault-write-guard.mjs";

// This test file sits in scripts/, exactly like the hook — so the brain root is one
// level up from HERE too, computed independently of the code under test.
const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const BRAIN_ROOT = resolve(SCRIPTS_DIR, "..");

// ═══════════════════════════════════════════════════════════════════════════
// The WIRING half of F11/F12. `scripts/lib/vault-write-guard.mjs` already decides
// (and is tested against the engine's real parser, on the real field payload); this
// file is the entry script Claude Code actually runs as a `PreToolUse(Write|Edit)`
// hook. Its whole job is the contract with the harness: read the hook JSON on stdin,
// ask for the decision, and speak the ONE dialect the harness acts on
// (`hookSpecificOutput.permissionDecision`). A decision nobody reads blocks nothing.
// ═══════════════════════════════════════════════════════════════════════════

// A parser stub that refuses with a message no real YAML error would carry, so the
// deny reason proves the INJECTED parser was the one consulted — a stub throwing a
// plausible "bad indentation" would be indistinguishable from the guard inventing one.
const refusingParser = () => () => {
  throw new Error("stub parser refused (7:42)");
};

const hookInput = ({ tool = "Write", path = "/brain/vault/inqom/briefings/2026-08-02.md", content = "---\nsummary: Réunion: bilan\n---\n" } = {}) =>
  JSON.stringify({ tool_name: tool, tool_input: { file_path: path, content } });

const captured = (overrides = {}) => {
  const emitted = [];
  const code = runGuard({
    readInput: () => hookInput(),
    readFile: () => "",
    brainDir: () => "/brain",
    parser: refusingParser,
    emit: (payload) => emitted.push(payload),
    ...overrides,
  });
  return { emitted, code };
};

// Fail-open is not politeness here, it is the condition of survival: this hook stands in
// front of EVERY write the brain makes. A guard that throws its own stack at the owner
// once is a guard they disable, and a disabled guard protects nothing. So anything it
// cannot judge — stdin that is not JSON, a payload shaped like nothing we know — passes.
test("stdin that is not the hook JSON lets the write THROUGH, silently, without throwing", () => {
  for (const junk of ["", "not json at all", "null"]) {
    const { emitted, code } = captured({ readInput: () => junk });

    assert.deepEqual(emitted, [], `junk stdin produced a payload: ${junk}`);
    assert.equal(code, 0, `junk stdin produced a non-zero exit: ${junk}`);
  }
});

test("a note the parser accepts goes through in SILENCE — no payload, nothing for the owner to read", () => {
  const { emitted, code } = captured({ parser: () => () => ({ data: {}, content: "" }) });

  assert.deepEqual(emitted, []);
  assert.equal(code, 0);
});

test("a note the parser refuses is DENIED in the harness's own dialect, naming the note and the cause", () => {
  const { emitted, code } = captured();

  assert.equal(code, 0, "the hook itself did not fail — it decided; a non-zero exit is the harness's error path");
  assert.equal(emitted.length, 1);
  assert.equal(emitted[0].hookSpecificOutput.hookEventName, "PreToolUse");
  assert.equal(emitted[0].hookSpecificOutput.permissionDecision, "deny");
  assert.match(
    emitted[0].hookSpecificOutput.permissionDecisionReason,
    /vault\/inqom\/briefings\/2026-08-02\.md.*stub parser refused \(7:42\)/s,
  );
});

// ── realGuardDeps — the wiring that runs in production, and that a behaviour test
// cannot reach: every test above injects its own deps, so the REAL ones (the parser
// that must be the engine's, the stdin read, the one line the harness parses) were
// observed by nothing. A mis-wire here passes every test above and blocks nothing.

test("realGuardDeps.brainDir is the brain root, one level above scripts/", () => {
  assert.equal(realGuardDeps.brainDir(), BRAIN_ROOT);
});

test("realGuardDeps.readFile returns the file's exact text, decoded as UTF-8", () => {
  const dir = mkdtempSync(join(tmpdir(), "guard-wiring-"));
  try {
    const note = join(dir, "note.md");
    // Accented on purpose: read without an encoding this returns a Buffer, and
    // decoded as latin1 it comes back mojibake — both then fail this equality.
    writeFileSync(note, "---\nsummary: Réunion\n---\n");

    assert.equal(realGuardDeps.readFile(note), "---\nsummary: Réunion\n---\n");
  } finally {
    rmSync(dir, { recursive: true });
  }
});

// Two tests below need the ENGINE's own gray-matter, which lives in `rag/node_modules`
// — absent in CI's harness step, whose invariant is "nothing to install". They skip
// there, and CI re-runs this file after `npm ci` in rag/. That re-run is pinned by the
// last test in this file: a skip is a deferral only as long as something cashes it in.
const needsEngine =
  realGuardDeps.parser(BRAIN_ROOT) === null
    ? { skip: "engine parser absent — CI re-runs this file after `npm ci` in rag/" }
    : {};

test("realGuardDeps.parser builds the ENGINE's parser: it refuses the field payload, accepts a healthy note", needsEngine, () => {
  const parse = realGuardDeps.parser(BRAIN_ROOT);

  assert.equal(typeof parse, "function");
  // The exact shape found in the field: an unquoted value containing ": ".
  assert.throws(() => parse("---\nsummary: Réunion: bilan\n---\n"), /mapping values|bad indentation|end of the stream/i);
  assert.deepEqual(parse("---\nsummary: fine\n---\nbody\n").data, { summary: "fine" });
});

test("realGuardDeps.emit prints the payload as ONE line of JSON on stdout", () => {
  const original = console.log;
  const lines = [];
  console.log = (line) => lines.push(line);
  try {
    realGuardDeps.emit({ hookSpecificOutput: { permissionDecision: "deny" } });
  } finally {
    console.log = original;
  }

  assert.deepEqual(lines, ['{"hookSpecificOutput":{"permissionDecision":"deny"}}']);
});

// The whole hook, run the way the harness runs it: a real child process, the JSON on
// its stdin, the decision on its stdout. It is the only test that exercises the stdin
// read and the entrypoint guard — i.e. that the file DOES something when executed.
test("run as the harness runs it, the hook reads stdin and denies on stdout", needsEngine, () => {
  const run = spawnSync(process.execPath, [join(SCRIPTS_DIR, "vault-write-guard.mjs")], {
    input: JSON.stringify({
      tool_name: "Write",
      tool_input: {
        file_path: join(BRAIN_ROOT, "vault", "briefings", "2026-08-02.md"),
        content: "---\nsummary: Réunion: bilan\n---\n",
      },
    }),
    encoding: "utf8",
  });

  assert.equal(run.status, 0, run.stderr);
  const payload = JSON.parse(run.stdout);
  assert.equal(payload.hookSpecificOutput.hookEventName, "PreToolUse");
  assert.equal(payload.hookSpecificOutput.permissionDecision, "deny");
  assert.match(payload.hookSpecificOutput.permissionDecisionReason, /vault[\\/]briefings[\\/]2026-08-02\.md/);
});

// ── The net under the two skips above ────────────────────────────────────────
// Same rule as `lib/vault-write-guard.test.mjs`: an assertion that skips when the
// engine is absent is worth exactly what CI does about it. Pinned from the suite, so
// dropping this file from the post-`npm ci` step goes red instead of going quiet.
test("CI cashes the deferral in: this file is re-run after the engine's own deps are installed", () => {
  const ci = readFileSync(join(BRAIN_ROOT, ".github", "workflows", "ci.yml"), "utf8");

  const engineInstall = ci.indexOf("run: npm ci");
  const rerun = ci.indexOf('"scripts/vault-write-guard.test.mjs"');

  assert.notEqual(rerun, -1, "ci.yml must re-run THIS file with the engine's parser resolvable");
  assert.notEqual(engineInstall, -1, "ci.yml must still install the engine");
  assert.ok(
    engineInstall < rerun,
    "the re-run must come AFTER `npm ci`, or the parser is just as absent as in the harness step",
  );
});
