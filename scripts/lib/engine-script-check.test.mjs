import { test } from "node:test";
import assert from "node:assert/strict";

import { SYNTAX_CHECK_ARGS, buildSyntaxCheckInvocation, parsesAsModule } from "./engine-script-check.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// engine-script-check — the syntax gate (plan S2b-2).
//
// S2b merges files the brain EXECUTES: `auto-commit.mjs` runs at every Stop
// hook, `status-line.mjs` at every prompt. A conflict is never written (verdict
// row 9), so markers can never land — but a CLEAN line-based merge of two valid
// edits can still produce bytes that parse to nothing, and those bytes exist
// nowhere but that one machine: no engine test ever ran them. A broken SKILL.md
// degrades an answer; a broken `auto-commit.mjs` silently stops committing the
// brain, which is the product's whole promise.
//
// So the merge OUTPUT is parsed before it is written — and only the merge
// output. A fast-forward writes the engine's own candidate, which the suite
// already tested; this gate exists for bytes the engine has never seen.
//
// Against REAL node, like the git seam next door: a subprocess contract proven
// by a stub proves nothing. The injected runner appears only where real node
// cannot be made to misbehave on demand.
// ═══════════════════════════════════════════════════════════════════════════

// The request as a VALUE (CONVENTIONS.md §5ter), asserted whole. The three flags
// are a contract, not decoration: drop `--input-type=module` and node parses the
// source as CommonJS, where `import` is a syntax error and every engine script
// would be judged broken; drop the `-` and node has no input at all.
test("the check is a value: the flags, the stdin marker, and the source as input", () => {
  assert.deepEqual(
    buildSyntaxCheckInvocation({ source: "export const a = 1;\n", nodeBin: "/usr/local/bin/node" }),
    {
      command: "/usr/local/bin/node",
      args: ["--check", "--input-type=module", "-"],
      options: { encoding: "utf8", input: "export const a = 1;\n" },
    },
  );
});

// A merged engine script can be a few hundred lines; the check reads none of the
// output, so the shared args are a constant rather than a literal rebuilt per call.
test("the flags are exported as one list, in the order node expects", () => {
  assert.deepEqual(SYNTAX_CHECK_ARGS, ["--check", "--input-type=module", "-"]);
});

// ── Against real node ────────────────────────────────────────────────────────

test("valid ESM parses", () => {
  assert.equal(parsesAsModule({ source: "import { x } from './a.mjs';\nexport const y = x + 1;\n" }), true);
});

// The shape a conflict would leave, if one ever reached this gate. It cannot —
// row 9 never writes — but the gate must not be the reason we find that out.
test("conflict markers do not parse", () => {
  const marked = "<<<<<<< your version\nconst a = 1;\n||||||| engine base\nconst a = 0;\n=======\nconst a = 2;\n>>>>>>> engine update\n";
  assert.equal(parsesAsModule({ source: marked }), false);
});

// The shape a line-based merge actually produces when it goes wrong: a region
// taken from one side leaves a block unclosed. This is the case the gate is FOR.
test("a truncated function does not parse", () => {
  assert.equal(parsesAsModule({ source: "export function f() {\n  return 1;\n" }), false);
});

// Proves the gate is a real ESM parse and not a bracket count: a duplicate
// binding is an EARLY error, invalid only under the module goal. A merge that
// grafts the same export twice is exactly what two sides editing near each other
// produce, and a token scanner would wave it through.
test("a duplicate export — an early error, not a bracket mismatch — does not parse", () => {
  assert.equal(parsesAsModule({ source: "export const a = 1;\nexport const a = 2;\n" }), false);
});

// ⚠️ The gate's honest limit, asserted rather than described in a comment: it
// catches SYNTAX, not sense. `require` inside an ESM file parses fine and throws
// at runtime. Judging whether a merged `auto-commit.mjs` still BEHAVES is a
// different product; the answer to that is the conflict report, not a cleverer check.
test("it catches syntax, not sense: `require` in an ESM file still parses", () => {
  assert.equal(parsesAsModule({ source: 'const fs = require("fs");\n' }), true);
});

// An empty file is valid ESM. It matters because "falsy source" must not be read
// as "unsafe": a merge that legitimately empties a file is a merge, not a defect,
// and answering `false` here would preserve it for ever with no way to recover.
test("an empty module parses", () => {
  assert.equal(parsesAsModule({ source: "" }), true);
});

// The gate must run under the SAME engine that will later load the file — the
// brain's own node, not whatever happens to be first on PATH. A brain on an old
// node would otherwise be told its files are fine by a parser it never runs.
test("by default it is the brain's own node that judges", () => {
  const seen = [];
  parsesAsModule({ source: "export const a = 1;\n", run: (command, args) => (seen.push({ command, args }), { status: 0 }) });
  assert.deepEqual(seen, [{ command: process.execPath, args: ["--check", "--input-type=module", "-"] }]);
});

// ── The failure shapes real node will not produce on demand ──────────────────
//
// A gate that cannot run must never answer "unsafe": a false unsafe preserves a
// file for ever and tells the owner their merge is broken when it is the tool
// that is. It THROWS, and the caller degrades — the same contract as the git seam.
const failing = (result) => () => parsesAsModule({ source: "export const a = 1;\n", run: () => result });

test("a node that cannot be spawned throws, instead of answering unsafe", () => {
  assert.throws(failing({ error: new Error("spawn ENOENT"), status: null }), /spawn ENOENT/);
});

// Met ALONE, so it cannot hide behind the `error` guard above: a killed process
// sets a null status with no `error` at all.
test("a null status throws on its own, with no error field to lean on", () => {
  assert.throws(failing({ status: null }), /could not run/);
});

// 0 means "parses" and 1 means "does not"; every other code means node itself is
// unhappy (an unknown flag exits 9). Read as a verdict, a 9 would silently say
// "your merge is broken" about a perfectly good file, for ever.
test("a status that is neither 0 nor 1 is not a verdict, and throws", () => {
  assert.throws(failing({ status: 9 }), /could not run/);
  assert.throws(failing({ status: -1 }), /could not run/);
});

test("only 0 and 1 are answers, and they are the two answers", () => {
  assert.equal(parsesAsModule({ source: "x", run: () => ({ status: 0 }) }), true);
  assert.equal(parsesAsModule({ source: "x", run: () => ({ status: 1 }) }), false);
});
