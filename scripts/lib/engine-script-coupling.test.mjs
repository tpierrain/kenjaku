import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { findSiblingImports } from "./engine-script-coupling.mjs";
import { selectMergeGovernedScripts } from "./engine-script-refresh.mjs";

// ─────────────────────────────────────────────────────────────────────────────
// The scanner — what counts as one engine-owned script reaching into another.
// ─────────────────────────────────────────────────────────────────────────────

test("findSiblingImports — a named import from a top-level sibling is a coupling", () => {
  const src = 'import { attemptCommit } from "./auto-commit.mjs";\n';
  assert.deepEqual(findSiblingImports(src), [{ line: 1, module: "auto-commit.mjs" }]);
});

test("findSiblingImports — a MULTILINE import is found, and reported at its specifier's line", () => {
  const src = ["import {", "  attemptCommit,", '} from "./auto-commit.mjs";', ""].join("\n");
  assert.deepEqual(findSiblingImports(src), [{ line: 3, module: "auto-commit.mjs" }]);
});

test("findSiblingImports — a default import, a re-export and a dynamic import all count", () => {
  const src = [
    'import legacy from "./auto-push.mjs";',
    'export { attemptCommit } from "./auto-commit.mjs";',
    'const m = await import("./status-line.mjs");',
    "",
  ].join("\n");
  assert.deepEqual(findSiblingImports(src), [
    { line: 1, module: "auto-push.mjs" },
    { line: 2, module: "auto-commit.mjs" },
    { line: 3, module: "status-line.mjs" },
  ]);
});

// `scripts/lib/**` is ONE `replace` glob: a brain receives the whole folder, at the
// engine's version, always. Depending on it is the REMEDY this guard points at, so
// it must never be reported as the disease.
test("findSiblingImports — `./lib/…` is NOT a sibling: it is the shared, always-replaced tree", () => {
  const src = 'import { treeState } from "./lib/repo-status.mjs";\n';
  assert.deepEqual(findSiblingImports(src), []);
});

test("findSiblingImports — node builtins and packages are not siblings", () => {
  const src = 'import { execFileSync } from "node:child_process";\nimport x from "some-pkg";\n';
  assert.deepEqual(findSiblingImports(src), []);
});

// The reason this scanner strips comments at all: the fix for T2 documents the very
// import line it is preventing, quoted verbatim, inside auto-commit.mjs's own header.
// A scanner that read prose would fail on the file that carries the explanation.
test("findSiblingImports — an import quoted in a comment is prose, not a coupling", () => {
  const src = [
    '// v4.9.1 opened with: import { attemptCommit } from "./auto-commit.mjs";',
    '/* also here: from "./auto-push.mjs" */',
    "",
  ].join("\n");
  assert.deepEqual(findSiblingImports(src), []);
});

// A path that merely LOOKS like a specifier is not one: the giveaway is the
// `from` / `import(` in front of it.
test("findSiblingImports — a bare string that is not a specifier is ignored", () => {
  const src = 'const doc = "./auto-commit.mjs";\nwriteFileSync(p, "./auto-push.mjs");\n';
  assert.deepEqual(findSiblingImports(src), []);
});

// The `from` has to be the LAST thing before the specifier, not merely present
// somewhere above it. A mutant proved the difference invisible, and the false
// positive it allows is the ordinary shape of every module in this repo: real
// imports at the top, a path named in a string further down.
test("findSiblingImports — a real import above does not turn a later plain path into one", () => {
  const src = [
    'import { readFileSync } from "node:fs";',
    'const REL = "./auto-commit.mjs";',
    "",
  ].join("\n");
  assert.deepEqual(findSiblingImports(src), []);
});

test("findSiblingImports — a nested path under another folder is not a top-level sibling", () => {
  const src = 'import x from "./engine-health/probe.mjs";\n';
  assert.deepEqual(findSiblingImports(src), []);
});

// Both triangulations below were demanded by a surviving mutant, not invented: the
// scanner passed every case above with the boundary quietly wrong.

// There is nothing in front of a specifier context that opens the file. A dynamic
// import on line 1 column 1 is the everyday shape of a lazily-loaded sibling.
test("findSiblingImports — a specifier context at the very START of the source counts", () => {
  assert.deepEqual(findSiblingImports('import("./auto-commit.mjs");\n'), [
    { line: 1, module: "auto-commit.mjs" },
  ]);
});

// A formatter wraps a long import, and `from` ends up a newline plus an indent away
// from its specifier. Trimming ONE whitespace character would lose it.
test("findSiblingImports — `from` separated from its specifier by a newline and an indent", () => {
  const src = ['import { attemptCommit } from', '  "./auto-commit.mjs";', ""].join("\n");
  assert.deepEqual(findSiblingImports(src), [{ line: 2, module: "auto-commit.mjs" }]);
});

// ─────────────────────────────────────────────────────────────────────────────
// The repo-wide guard — T2's class, held at zero.
//
// Two `merge`-regime files are refreshed INDEPENDENTLY (`groupOf: rel => rel`),
// and either one can be PRESERVED at its old version when the owner has tuned it.
// So a named import from one to the other is a promise the engine cannot keep:
// v5.0.0 dropped `isEntryPoint` from auto-commit.mjs and killed the Stop hook of
// every brain holding a customized v4.9.1 auto-push.mjs — silently, at link time,
// where `node --check` and `verifyWrite` are both blind.
//
// The remedy is structural, not a version dance: shared code belongs in
// `scripts/lib/**`, which is `replace` — delivered whole, at the engine's version,
// never preserved. This test is what stops the next one being written.
// ─────────────────────────────────────────────────────────────────────────────

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..", "..");

function repoFiles() {
  return readdirSync(join(REPO_ROOT, "scripts"))
    .filter((n) => n.endsWith(".mjs") && !n.endsWith(".test.mjs"))
    .map((n) => `scripts/${n}`)
    .sort();
}

function mergeGovernedScripts() {
  const manifest = JSON.parse(readFileSync(join(REPO_ROOT, "engine-manifest.json"), "utf8"));
  return selectMergeGovernedScripts({ sourceFiles: repoFiles(), manifest });
}

// The anti-vacuity companion: this guard is only worth its green if it is looking
// at a non-empty set. A manifest that stopped declaring any script `merge` would
// otherwise turn the test below into a tautology.
test("the merge-governed script set is non-empty and holds the two hook halves", () => {
  const scripts = mergeGovernedScripts();
  assert.ok(scripts.length >= 2, `expected merge-governed scripts, got ${JSON.stringify(scripts)}`);
  for (const rel of ["scripts/auto-commit.mjs", "scripts/auto-push.mjs"]) {
    assert.ok(scripts.includes(rel), `${rel} is no longer merge-governed — is this guard still aimed right?`);
  }
});

test("no merge-governed script imports another one (they are refreshed independently)", () => {
  const scripts = mergeGovernedScripts();
  const names = new Set(scripts.map((rel) => rel.slice("scripts/".length)));

  const offenders = [];
  for (const rel of scripts) {
    const source = readFileSync(join(REPO_ROOT, rel), "utf8");
    for (const { line, module } of findSiblingImports(source)) {
      if (names.has(module)) offenders.push(`${rel}:${line} imports ./${module}`);
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `A \`merge\`-regime script imports another \`merge\`-regime script. Both are refreshed
INDEPENDENTLY and either can be PRESERVED at an older version, so the import is a
promise across versions the engine cannot keep — v5.0.0's T2 killed the Stop hook of
every brain with a customized v4.9.1 auto-push.mjs exactly this way.

Move the shared function into scripts/lib/** (\`replace\` regime: delivered whole, at
the engine's version, never preserved) and import it from there.\n${offenders.join("\n")}`,
  );
});
