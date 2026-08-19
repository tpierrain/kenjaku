import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import {
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

test("the shared tail is clean — process.argv goes through WHOLE, never indexed", () => {
  const src = 'runAsEntrypoint(import.meta.url, process.argv, main);\nconst rest = process.argv.slice(2);\n';
  assert.deepEqual(findHandRolledGuards(src), []);
});

// ─────────────────────────────────────────────────────────────────────────────
// hasEntrypointTail — a top-level script with no tail runs its whole body at
// import, which is why no test can reach it (status-line.mjs, session-status.mjs).
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
const NO_TAIL_CEILING = 18;
const HAND_ROLLED_CEILING = 12;

// Top-level CLIs with no `.test.mjs` sibling. Nine of them, inherited; paying
// them off is not this run's cargo, so they are named rather than counted.
const NO_SIBLING_EXEMPT = new Set([
  "scripts/import-brain.mjs",
  "scripts/open-env.mjs",
  "scripts/pick-folder.mjs",
  "scripts/run-eval.mjs",
  "scripts/session-status.mjs",
  "scripts/status-line.mjs",
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
  "scripts/session-status.mjs",
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
    `${offenders.length} top-level scripts hand-roll their entry detection, ceiling is ${HAND_ROLLED_CEILING}. There is ONE canonical tail — runAsEntrypoint(import.meta.url, process.argv, main).\n${offenders.join("\n")}`,
  );
});
