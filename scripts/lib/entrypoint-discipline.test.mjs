import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import {
  findSymlinkBlindGuards,
  findHandRolledGuards,
  hasEntrypointTail,
  findInlineInvocations,
} from "./entrypoint-discipline.mjs";

// ─────────────────────────────────────────────────────────────────────────────
// findHandRolledGuards — every spelling of "am I the entry point?" that is NOT
// the shared tail. The inventory of 2026-08-20 found THREE of them in the tree.
// ─────────────────────────────────────────────────────────────────────────────

test("flags the raw shared predicate — runAsEntrypoint is the tail, isEntrypoint is not", () => {
  // The IMPORT line is deliberately not a finding: it is the CALL that hand-rolls
  // the guard, and reporting the import too would name every offender twice.
  const src = 'import { isEntrypoint } from "./lib/entrypoint.mjs";\nif (isEntrypoint(import.meta.url, process.argv[1])) {\n  process.exit(run());\n}\n';
  assert.deepEqual(findHandRolledGuards(src), [
    { line: 2, token: "isEntrypoint(" },
    { line: 2, token: "process.argv[1]" },
  ]);
});

test("flags auto-commit's duplicate predicate, reversed arguments and all", () => {
  const src = "export function isEntryPoint(argv1, metaUrl) {\n  return true;\n}\n";
  assert.deepEqual(findHandRolledGuards(src), [{ line: 1, token: "isEntryPoint(" }]);
});

test("flags the inline comparison, whatever it is wrapped in", () => {
  const src = "if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {\n";
  assert.deepEqual(findHandRolledGuards(src), [
    { line: 1, token: "process.argv[1]" },
    { line: 1, token: "process.argv[1]" },
  ]);
});

test("a predicate named only in a COMMENT is not a hand-rolled guard", () => {
  // A file that documents the predicate it used to carry (auto-commit.mjs does)
  // must not be counted as still carrying it — otherwise the ceiling can never
  // reach zero and the history has to be silenced to keep the guard honest.
  const src = "// This file used to carry isEntryPoint(argv1, meta), now shared.\n/* see isEntrypoint(a, b) */\nrunAsEntrypoint(import.meta.url, process.argv, main);\n";
  assert.deepEqual(findHandRolledGuards(src), []);
});

test("the shared tail is clean — process.argv goes through WHOLE, never indexed", () => {
  const src = 'runAsEntrypoint(import.meta.url, process.argv, main);\nconst rest = process.argv.slice(2);\n';
  assert.deepEqual(findHandRolledGuards(src), []);
});

// ─────────────────────────────────────────────────────────────────────────────
// hasEntrypointTail — a top-level script with no tail runs its whole body at
// import, which is why no test can reach it. The three files that shape named at
// v4.8.0 — status-line.mjs, upstream-check-run.mjs and session-status.mjs — are
// all converted now; what the ceiling still holds is the inherited remainder.
// ─────────────────────────────────────────────────────────────────────────────

test("a script is 'tailed' when it calls the shared runner, and only then", () => {
  assert.equal(hasEntrypointTail("runAsEntrypoint(import.meta.url, process.argv, main);"), true);
  assert.equal(hasEntrypointTail("await runAsEntrypoint(import.meta.url, process.argv, main);"), true);
  assert.equal(hasEntrypointTail("console.log('hello');\nprocess.exit(0);\n"), false);
  assert.equal(hasEntrypointTail("// runAsEntrypoint is what this SHOULD use\n"), false);
});

// ─────────────────────────────────────────────────────────────────────────────
// findInlineInvocations — debt 2's shape. A child process whose request is
// composed AT the call site is a request no test can assert: the v4.5.0 fix was
// to make it a value first (buildCrosscheckInvocation → {command, args, options}).
// ─────────────────────────────────────────────────────────────────────────────

test("flags an args array literal AND an options object literal, both, on the same call", () => {
  const src = 'const out = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" });';
  assert.deepEqual(findInlineInvocations(src), [
    { line: 1, runner: "execFileSync", kind: "args-array" },
    { line: 1, runner: "execFileSync", kind: "options-object" },
  ]);
});

test("a request passed as values is clean — this is the shape debt 2 must reach", () => {
  const src = "export function defaultRunCrosscheck(opts, spawn = spawnSync) {\n  const { command, args, options } = buildCrosscheckInvocation(opts);\n  return spawn(command, args, options);\n}\n";
  assert.deepEqual(findInlineInvocations(src), []);
});

test("flags every runner, not just the one that happened to be in the debt", () => {
  const runners = ["spawn", "spawnSync", "execFile", "execFileSync", "execSync", "fork"];
  const found = runners.map((r) => findInlineInvocations(`${r}(cmd, [], opts);`));
  assert.deepEqual(
    found,
    runners.map((runner) => [{ line: 1, runner, kind: "args-array" }]),
  );
});

test("execSync takes its options in second position — flagged there too", () => {
  assert.deepEqual(findInlineInvocations('execSync("git status", { cwd: dir });'), [
    { line: 1, runner: "execSync", kind: "options-object" },
  ]);
});

test("a runner reached through a namespace still counts", () => {
  assert.deepEqual(findInlineInvocations("child_process.spawnSync(cmd, args, { shell: true });"), [
    { line: 1, runner: "spawnSync", kind: "options-object" },
  ]);
});

test("a name that merely ENDS with a runner's name is not a runner", () => {
  assert.deepEqual(findInlineInvocations("respawn(cmd, [], {});"), []);
  assert.deepEqual(findInlineInvocations("mySpawnSync(cmd, [], {});"), []);
});

test("brackets and braces inside strings, arrays and callbacks do not shift the argument count", () => {
  const src = 'spawn(build("a, b"), args, options);\nspawn(cmd, args.map((a) => ({ a })), options);\n';
  assert.deepEqual(findInlineInvocations(src), []);
});

test("declaring a runner as an injected default is not an invocation", () => {
  // `spawn = spawnSync` and `{ spawn }` destructuring must stay clean, otherwise
  // every seam in the tree becomes an offender and the allowlist grows instead.
  const src = "export function run(opts, spawn = spawnSync) {\n  const { execFile } = deps;\n  return spawn(command, args, options);\n}\n";
  assert.deepEqual(findInlineInvocations(src), []);
});

test("reports findings from several calls, sorted by line", () => {
  const src = "spawn(a, b, c);\nexecSync(cmd, { cwd });\nfork(mod, [\"--x\"], opts);\n";
  assert.deepEqual(findInlineInvocations(src), [
    { line: 2, runner: "execSync", kind: "options-object" },
    { line: 3, runner: "fork", kind: "args-array" },
  ]);
});

test("a runner mentioned only in a comment is not an invocation", () => {
  const src = '// spawnSync("git", ["log"], { cwd });\n/* execFileSync("git", [], {}) */\nspawn(c, a, o);\n';
  assert.deepEqual(findInlineInvocations(src), []);
});

// ─────────────────────────────────────────────────────────────────────────────
// The comment/quote state machine. These scanners read source WITHOUT a JS
// parser, so the only thing standing between them and a false report is the
// hand-rolled skipping of strings and comments. Each case below is a way that
// skipping can go wrong on real repo source.
// ─────────────────────────────────────────────────────────────────────────────

test("a // inside a STRING does not start a comment", () => {
  // A URL in an argument is the everyday case. Treated as a comment, the rest of
  // the line vanishes and the invocation stops being reported at all.
  assert.deepEqual(findInlineInvocations('spawn("https://host/x", args, { cwd });'), [
    { line: 1, runner: "spawn", kind: "options-object" },
  ]);
});

test("an ESCAPED quote does not end the string it sits in", () => {
  // Lose the backslash handling and the quote state inverts: everything after is
  // read as being inside a string, and nothing downstream is ever seen.
  assert.deepEqual(findInlineInvocations('spawn("a\\"b", args, { cwd });'), [
    { line: 1, runner: "spawn", kind: "options-object" },
  ]);
});

test("a template literal is a string too, braces and all", () => {
  assert.deepEqual(findInlineInvocations("spawn(`${bin}-cli`, args, { cwd });"), [
    { line: 1, runner: "spawn", kind: "options-object" },
  ]);
});

test("an apostrophe inside a COMMENT does not leave the scanner stuck in a string", () => {
  // "don't" in a comment is ordinary prose. A scanner that tracks quotes inside
  // comments swallows the whole rest of the file from there.
  const src = "// don't compose the invocation here\nspawn(cmd, args, { cwd });\n";
  assert.deepEqual(findInlineInvocations(src), [
    { line: 2, runner: "spawn", kind: "options-object" },
  ]);
});

test("a block comment MID-LINE is skipped without shifting the arguments", () => {
  assert.deepEqual(findInlineInvocations("spawn(cmd, /* the argv */ args, { cwd });"), [
    { line: 1, runner: "spawn", kind: "options-object" },
  ]);
});

test("line numbers survive the comments that precede the finding", () => {
  // Both comment forms must emit their newlines, or every reported line number
  // drifts upward by however much prose sits above it — and a report that points
  // at the wrong line is a report nobody trusts.
  const lineComments = "// one\n// two\n// three\nexecSync(cmd, { cwd });\n";
  assert.deepEqual(findInlineInvocations(lineComments), [
    { line: 4, runner: "execSync", kind: "options-object" },
  ]);

  const blockComment = "/* one\n   two\n   three */\nexecSync(cmd, { cwd });\n";
  assert.deepEqual(findInlineInvocations(blockComment), [
    { line: 4, runner: "execSync", kind: "options-object" },
  ]);
});

test("whitespace and newlines between the runner and its ( still make it a call", () => {
  assert.deepEqual(findInlineInvocations("spawnSync\n  (cmd, [], opts);"), [
    { line: 1, runner: "spawnSync", kind: "args-array" },
  ]);
  // …and a bare mention that is NOT a call is not one.
  assert.deepEqual(findInlineInvocations("const runner = spawnSync;\n"), []);
});

test("a runner at the very first character of the file is still a runner", () => {
  // There is no character before it to inspect — the boundary check must treat
  // "nothing" as a valid separator rather than as part of a longer name.
  assert.deepEqual(findInlineInvocations("fork(mod, [], opts);"), [
    { line: 1, runner: "fork", kind: "args-array" },
  ]);
});

// ── F12: the scanner knew about strings and comments, and not about REGEXES ──
//
// Not hypothetical, and not found by imagining a fixture: run this scanner over the
// repo's own `scripts/**` and **13 files leave it stuck inside a phantom string** at
// end of file — one of them production code delivered into every brain
// (`brain-locale.mjs`, whose `/BRAIN_LOCALE\s*=\s*"([^"]+)"/` carries THREE quote
// characters). From that line on, in that file, no comment is stripped: every `//` note
// mentioning a guard token counts as live code. This guard's ceilings are declared to
// only ever go DOWN, and a file can be pushed over one by a sentence of prose.
test("a QUOTE inside a regex literal does not open a string that swallows the file", () => {
  // The real line, copied from `brain-locale.mjs`, followed by the kind of comment this
  // repo writes everywhere: the history of a debt that has been paid.
  const src =
    'const m = /BRAIN_LOCALE\\s*=\\s*"([^"]+)"/.exec(content);\n' +
    "// the old shape of this file read process.argv[1] itself\n" +
    "runAsEntrypoint(import.meta.url, process.argv, main);\n";
  assert.deepEqual(findHandRolledGuards(src), []);
  assert.equal(hasEntrypointTail(src), true);
});

test("a SLASH PAIR inside a regex character class does not blank the rest of the line", () => {
  // `[//]` is a valid class (a `/` does not close the literal inside brackets), and it
  // is the finding's own case: read as a comment, everything after it on the line — the
  // guard included — is gone, and the file reads as clean.
  const src = "const sep = /[//]/;  const first = process.argv[1];\n";
  assert.deepEqual(findHandRolledGuards(src), [{ line: 1, token: "process.argv[1]" }]);
});

test("a DIVISION is not mistaken for a regex, however it is spaced", () => {
  // The other half of the same ambiguity, and the one that breaks a scanner that treats
  // every `/` as a literal: `total / 2` would open a "regex" that runs to the next `/`,
  // eating whatever sits between — here the guard token.
  assert.deepEqual(findHandRolledGuards("const half = total / 2; const a = process.argv[1] / 3;\n"), [
    { line: 1, token: "process.argv[1]" },
  ]);
});

test("a regex right after a KEYWORD is still a regex, not a division", () => {
  // `return /x/` and `typeof /x/`: the character before the slash is a letter, so a
  // "previous character is a word character → division" rule gets this exactly wrong and
  // re-opens the swallowing it was written to stop.
  const src = 'function f() { return /a"b/.test(s); }\n// once read process.argv[1]\nrunAsEntrypoint(a, b, c);\n';
  assert.deepEqual(findHandRolledGuards(src), []);
  assert.equal(hasEntrypointTail(src), true);
});

test("an UNTERMINATED regex is not allowed to eat the rest of the file", () => {
  // A `/` the heuristic reads as a regex opener with no closer on its line — the honest
  // failure mode is to give up at the newline, so a mis-read costs one line, never the
  // whole scan.
  const src = "const odd = a /b + c\nconst first = process.argv[1];\n";
  assert.deepEqual(findHandRolledGuards(src), [{ line: 2, token: "process.argv[1]" }]);
});

test("an UNTERMINATED block comment swallows the rest, and does not crash", () => {
  assert.deepEqual(findInlineInvocations("/* opened and never closed\nspawn(a, [], {});\n"), []);
});

test("a trailing comma does not invent an extra argument", () => {
  assert.deepEqual(findInlineInvocations("spawn(cmd, args, { cwd },);"), [
    { line: 1, runner: "spawn", kind: "options-object" },
  ]);
});

test("a call with NO arguments reports nothing", () => {
  assert.deepEqual(findInlineInvocations("spawn();"), []);
});

test("the hand-rolled scanner skips comments — and, deliberately, NOT strings", () => {
  // Comments are blanked, which is what lets a file explain the debt it used to
  // carry (auto-commit.mjs does exactly that).
  const commented = "// the old guard read process.argv[1] directly\nrunAsEntrypoint(import.meta.url, process.argv, main);\n";
  assert.deepEqual(findHandRolledGuards(commented), []);

  // A guard token inside a STRING is still reported, and that is a deliberate
  // limitation rather than an oversight: blanking string bodies would take a
  // second pass, no top-level CLI in this tree puts a guard token in a string,
  // and the failure mode is a loud false positive whose message says what to do
  // — never a guard that goes unnoticed. Pinned here so the choice is visible if
  // it ever needs revisiting.
  const quoted = 'const help = "pass process.argv[1] yourself";\n';
  assert.deepEqual(findHandRolledGuards(quoted), [{ line: 1, token: "process.argv[1]" }]);
});

// ─────────────────────────────────────────────────────────────────────────────
// The repo-wide guard — debt 1's second half, the one that makes the fix stick.
// Without it the next new script re-creates the shape and the debt comes back.
//
// Two mechanics, on purpose, because the two halves move at different speeds:
//
//   • The CEILINGS (the shape being converted right now) are plain counts that
//     may only be LOWERED. A count survives a fan-out: several agents converting
//     several files in parallel never contend on this file, and the count simply
//     falls below the ceiling. A NEW script hand-rolling its guard pushes it back
//     over, which is exactly when this test must go red.
//   • The NAMED allowlists (the debt this run does not pay) may only SHRINK, and
//     that is enforced rather than written down: an entry that is no longer an
//     offender turns this suite RED until it is deleted. A list that can only go
//     stale is a list that shrinks by itself.
// ─────────────────────────────────────────────────────────────────────────────

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..", "..");
const SCRIPTS = join(REPO_ROOT, "scripts");

// Ceilings measured on 2026-08-20, before the first conversion. LOWER THEM as the
// conversion lands; never raise one — raising it is what turned this into debt.
const NO_TAIL_CEILING = 13;
// 2026-08-23 (T1, third review pass): 9 -> 2. Seven top-level scripts were converted;
// what is left is import-brain.mjs (realpaths BOTH sides) and update-engine.mjs (calls
// the canonical predicate) — non-canonical spellings that are nonetheless CORRECT, so
// this count is a tidiness debt and cannot go to 0 on its own.
//
// 🛑 The hard ceiling is the OTHER one: "NO shipped script compares argv1 to
// import.meta.url without realpath", at 0 and staying there. A count of spellings was
// green at 9 while six SessionStart hooks were dead — which is why correctness now has
// a guard of its own instead of riding on a budget.
const HAND_ROLLED_CEILING = 2;

// Top-level CLIs with no `.test.mjs` sibling. Inherited; paying them off is not
// this run's cargo, so they are named rather than counted.
const NO_SIBLING_EXEMPT = new Set([
  "scripts/import-brain.mjs",
  "scripts/open-env.mjs",
  "scripts/pick-folder.mjs",
  "scripts/run-eval.mjs",
  "scripts/update-engine.mjs",
  "scripts/verify-rag.mjs",
]);

// Modules that still compose a child-process request at the call site instead of
// building it as a value first (the v4.5.0 buildCrosscheckInvocation shape).
// `scripts/lib/engine-fetch.mjs` is DELIBERATELY absent: it is debt 2, paid here.
const INLINE_INVOCATION_EXEMPT = new Set([
  "scripts/auto-commit.mjs",
  "scripts/auto-push.mjs",
  "scripts/clear-example-notes.mjs",
  "scripts/delete-universe.mjs",
  "scripts/lib/auto-finalize.mjs",
  "scripts/lib/child-cleanup.mjs",
  "scripts/lib/engine-seams.mjs",
  "scripts/lib/folder-picker.mjs",
  "scripts/lib/mcp-search.mjs",
  "scripts/lib/mcp-smoke.mjs",
  "scripts/lib/obsidian-register.mjs",
  "scripts/lib/open-env.mjs",
  "scripts/rehydrate.mjs",
  "scripts/rename-universe.mjs",
  "scripts/run-eval.mjs",
  "scripts/session-health.mjs",
  "scripts/session-self-heal.mjs",
  "scripts/set-universe-profile.mjs",
  "scripts/status-line.mjs",
  "scripts/verify-rag.mjs",
]);

const rel = (file) => relative(REPO_ROOT, file).split("\\").join("/");

// The top-level CLIs: scripts/*.mjs, which is the perimeter the entry-guard debt
// was measured over. scripts/lib/** are libraries — they have no entry point.
function topLevelScripts() {
  return readdirSync(SCRIPTS)
    .filter((n) => n.endsWith(".mjs") && !n.endsWith(".test.mjs"))
    .sort()
    .map((n) => join(SCRIPTS, n));
}

function allScriptModules(dir = SCRIPTS) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "__fixtures__") continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...allScriptModules(full));
    else if (name.endsWith(".mjs") && !name.endsWith(".test.mjs")) out.push(full);
  }
  return out.sort();
}

test("every top-level script has a test sibling (allowlist may only shrink)", () => {
  const offenders = topLevelScripts()
    .filter((f) => !existsSync(f.replace(/\.mjs$/, ".test.mjs")))
    .map(rel);

  assert.deepEqual(
    offenders.filter((f) => !NO_SIBLING_EXEMPT.has(f)),
    [],
    "A top-level scripts/*.mjs with no .test.mjs sibling is a CLI nothing measures.",
  );
  // Shrink-only, enforced: an exemption that is no longer needed must GO.
  assert.deepEqual(
    [...NO_SIBLING_EXEMPT].filter((f) => !offenders.includes(f)).sort(),
    [],
    "These files now HAVE a test sibling — delete them from NO_SIBLING_EXEMPT.",
  );
});

test("no module composes a child-process request at the call site (allowlist may only shrink)", () => {
  const offenders = allScriptModules()
    .filter((f) => findInlineInvocations(readFileSync(f, "utf8")).length > 0)
    .map(rel);

  assert.deepEqual(
    offenders.filter((f) => !INLINE_INVOCATION_EXEMPT.has(f)),
    [],
    "Build the invocation as a value ({command, args, options}) and hand it to a thin runner — CONVENTIONS.md §5ter, debt 2 of the v4.8.0 pass.",
  );
  assert.deepEqual(
    [...INLINE_INVOCATION_EXEMPT].filter((f) => !offenders.includes(f)).sort(),
    [],
    "These modules no longer compose their invocation inline — delete them from INLINE_INVOCATION_EXEMPT.",
  );
});

test("the count of top-level scripts running their body at import only goes DOWN", () => {
  const offenders = topLevelScripts()
    .filter((f) => !hasEntrypointTail(readFileSync(f, "utf8")))
    .map(rel);

  assert.ok(
    offenders.length <= NO_TAIL_CEILING,
    `${offenders.length} top-level scripts have no runAsEntrypoint tail, ceiling is ${NO_TAIL_CEILING}. A script whose body runs at import is a body no test can reach — pass it to runAsEntrypoint instead of raising this number.\n${offenders.join("\n")}`,
  );
});

test("the count of hand-rolled entry guards only goes DOWN", () => {
  const offenders = topLevelScripts()
    .filter((f) => findHandRolledGuards(readFileSync(f, "utf8")).length > 0)
    .map(rel);

  assert.ok(
    offenders.length <= HAND_ROLLED_CEILING,
    `${offenders.length} top-level scripts hand-roll their entry detection, ceiling is ${HAND_ROLLED_CEILING}.

This count is a TIDINESS debt — correctness is guarded separately, by "NO shipped script
compares argv1 to import.meta.url without realpath". Do not raise this number: on
2026-08-23 it sat green at 9 while six of the eight SessionStart hooks were silently dead
on any brain path holding a symlink.

There is ONE canonical tail — runAsEntrypoint(import.meta.url, process.argv, main).\n${offenders.join("\n")}`,
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// findSymlinkBlindGuards — the SHARP half of the hand-rolled question.
//
// `findHandRolledGuards` above counts every spelling that is not the canonical
// tail, which includes spellings that are perfectly correct (import-brain.mjs
// realpaths both sides; update-engine.mjs calls the canonical predicate). Those
// are a tidiness debt.
//
// This one counts the spellings that are WRONG: a comparison of process.argv[1]
// against import.meta.url where argv[1] is not realpath-resolved first. Node
// realpath-resolves the main module, so such a guard is FALSE on any path holding
// a symlink and the body it protects silently never runs. Ceiling 0, forever.
// ─────────────────────────────────────────────────────────────────────────────
test("the disarmed shape — argv1 compared to import.meta.url without realpath — is found", () => {
  const src = "if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {\n";
  assert.deepEqual(findSymlinkBlindGuards(src), [{ line: 1 }]);
});

test("the hand-rolled URL shape (bug B2) is the same defect and is found too", () => {
  assert.deepEqual(findSymlinkBlindGuards("if (import.meta.url === `file://${process.argv[1]}`) {\n"), [
    { line: 1 },
  ]);
});

test("a comparison that DOES realpath argv1 is not a finding — that one is correct", () => {
  const src = "return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));\n";
  assert.deepEqual(findSymlinkBlindGuards(src), []);
});

test("delegating to the canonical predicate is not a comparison at all", () => {
  assert.deepEqual(findSymlinkBlindGuards("if (isEntrypoint(import.meta.url, process.argv[1])) {\n"), []);
});

test("argv1 used for something that is not this question is left alone", () => {
  assert.deepEqual(findSymlinkBlindGuards('const target = process.argv[1] ?? "";\n'), []);
});

test("a comment describing the defect is not the defect", () => {
  const src = "// resolve(process.argv[1]) === fileURLToPath(import.meta.url) is the disarmed shape\nconst a = 1;\n";
  assert.deepEqual(findSymlinkBlindGuards(src), []);
});

test("the comparison split across lines is still found — a formatter must not hide it", () => {
  const src = "if (\n  resolve(process.argv[1]) ===\n  fileURLToPath(import.meta.url)\n) {\n";
  assert.deepEqual(findSymlinkBlindGuards(src), [{ line: 2 }]);
});

test("NO shipped script compares argv1 to import.meta.url without realpath — ceiling 0, forever", () => {
  const offenders = topLevelScripts()
    .filter((f) => findSymlinkBlindGuards(readFileSync(f, "utf8")).length > 0)
    .map(rel);

  assert.deepEqual(
    offenders,
    [],
    `These scripts are DEAD on any brain whose path holds a symlink — the guarded body never runs, with no output and no error. Node realpath-resolves the main module, so argv[1] as typed never equals import.meta.url. Use runAsEntrypoint(import.meta.url, process.argv, main).\n${offenders.join("\n")}`,
  );
});
