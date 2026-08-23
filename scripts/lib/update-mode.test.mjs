import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { isSelfHeal, findRawDirComparisons } from "./update-mode.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// "IS THIS AN UPDATE, OR A SELF-HEAL?" — asked at three doors, and it used to be
// spelled three ways (T8, v5.0.0 third code-review pass).
//
// 🚨 WHY THE SPELLING IS A SAFETY MATTER, not tidiness. The answer gates the two
// acts the engine may not perform on the brain itself:
//   • `retireDeclaredSkills` — the ONE `rmSync` under the owner's `.claude/`;
//   • `fetchAncestors` — a `git fetch origin` that, aimed at the brain, points
//     engine machinery at the owner's PRIVATE vault remote.
// Two of the three compared the raw strings. Measured on a throwaway fixture:
// spell `sourceDir` as `<brainDir>/` or `<brainDir>/.` and the verdict flips to
// `remove` — the skill is erased, and on the self-heal path the child is detached
// with `stdio: "ignore"`, so the report saying so goes nowhere at all.
//
// It was latent only because the two live call sites happen to pass the same
// variable twice. `reconcile-brain`'s own `--brainDir` / `--sourceDir` flags are
// the reachable surface, and a human typing a trailing slash is not exotic.
//
// The third spelling already normalized with `resolve()`, and so did the
// main-branch predecessor that was deleted: the weaker comparison was newly
// written exactly where the consequence became "a directory erased".
// ═══════════════════════════════════════════════════════════════════════════

test("the same directory, however it is spelled, is a self-heal", () => {
  // The four spellings a caller can produce without meaning anything by it: a CLI
  // flag with a trailing separator, a shell completion's `/.`, a relative path, and
  // a walk back up through a sibling. All name one directory.
  const brainDir = "/home/ada/second-brain";

  assert.deepEqual(
    [
      brainDir,
      `${brainDir}/`,
      `${brainDir}/.`,
      `${brainDir}/../second-brain`,
      `${brainDir}//`,
    ].map((sourceDir) => isSelfHeal({ brainDir, sourceDir })),
    [true, true, true, true, true],
  );
});

test("a genuinely different source is an update, INCLUDING one whose path merely starts with the brain's", () => {
  // The boundary, and it is the one a normalizing comparison could get wrong in the
  // dangerous direction: `…/second-brain-old` shares every character of the brain's
  // path and is a different directory. Reading it as a self-heal would silently skip
  // a real update; reading a self-heal as an update is what deletes things.
  const brainDir = "/home/ada/second-brain";

  assert.deepEqual(
    [
      "/tmp/kenjaku-launcher",
      `${brainDir}-old`,
      `${brainDir}/nested`,
      dirname(brainDir),
    ].map((sourceDir) => isSelfHeal({ brainDir, sourceDir })),
    [false, false, false, false],
  );
});

test("the brain's own spelling is normalized too, not just the source's", () => {
  // Both sides come from callers. Normalizing one and not the other leaves exactly
  // half the defect standing.
  assert.equal(isSelfHeal({ brainDir: "/home/ada/second-brain/", sourceDir: "/home/ada/second-brain" }), true);
  assert.equal(isSelfHeal({ brainDir: "/home/ada/second-brain/.", sourceDir: "/home/ada/second-brain" }), true);
});

// ───────────────────────────────────────────────────────────────────────────
// THE SCANNER — what stops a FOURTH spelling being written.
//
// Same shape and same argument as `engine-script-coupling.mjs`: a pure scanner over
// a source string, and one repo-wide fail-loud test below. A raw `sourceDir ===
// brainDir` is not a style choice, it is the defect itself, and it is invisible in
// review because it reads exactly like the safe version.
// ───────────────────────────────────────────────────────────────────────────

test("findRawDirComparisons finds a raw comparison, either way round, and reports its line", () => {
  const source = [
    "const a = 1;",
    "if (sourceDir === brainDir) return;",
    "const b = 2;",
    "if (brainDir !== sourceDir) act();",
  ].join("\n");

  assert.deepEqual(findRawDirComparisons(source), [
    { line: 2, text: "sourceDir === brainDir" },
    { line: 4, text: "brainDir !== sourceDir" },
  ]);
});

test("findRawDirComparisons ignores the NORMALIZED comparison — that is the remedy, not the disease", () => {
  assert.deepEqual(findRawDirComparisons("if (resolve(sourceDir) === resolve(brainDir)) return report;"), []);
  assert.deepEqual(findRawDirComparisons("if (isSelfHeal({ brainDir, sourceDir })) return report;"), []);
});

test("findRawDirComparisons reads code, not prose: a comparison quoted in a comment is an explanation", () => {
  // Every one of these guards documents the rule it enforces, and every such comment
  // names the comparison. Flagging them would make the scanner unusable by the very
  // files it protects.
  const source = [
    "// Left ungated it also ran at self-heal (`sourceDir === brainDir`), which is",
    "/* spawned detached: sourceDir === brainDir means the source IS the brain. */",
    "const ok = true;",
  ].join("\n");

  assert.deepEqual(findRawDirComparisons(source), []);
});

test("findRawDirComparisons compares the two dirs to EACH OTHER, and to nothing else", () => {
  // A comparison against undefined, against a third variable, or between identifiers
  // that merely begin with those names is not this defect.
  const source = [
    "if (sourceDir === undefined) return;",
    "if (sourceDir === launcherDir) return;",
    "if (sourceDirs === brainDirs) return;",
    "if (mySourceDir === myBrainDir) return;",
  ].join("\n");

  assert.deepEqual(findRawDirComparisons(source), []);
});

test("findRawDirComparisons catches the LOOSE operators too", () => {
  // `==` and `!=` compare the same two strings just as wrongly, and a scanner that
  // only knows the strict pair invites the next author to slip through on a typo.
  assert.deepEqual(
    findRawDirComparisons("if (sourceDir == brainDir) return;\nif (sourceDir != brainDir) act();"),
    [
      { line: 1, text: "sourceDir == brainDir" },
      { line: 2, text: "sourceDir != brainDir" },
    ],
  );
});

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function engineSources() {
  return ["scripts", "scripts/lib"].flatMap((dir) =>
    readdirSync(join(REPO_ROOT, dir))
      .filter((name) => name.endsWith(".mjs") && !name.endsWith(".test.mjs"))
      .map((name) => `${dir}/${name}`)
      .sort(),
  );
}

test("the scanned set is the whole engine, not an accident of one folder", () => {
  // The anti-vacuity companion, and T7 is why it asserts a NAMED member rather than
  // only a count: a guard that quietly stops looking at anything stays green forever.
  const sources = engineSources();

  assert.ok(sources.length >= 40, `only ${sources.length} engine sources listed`);
  for (const rel of ["scripts/lib/skill-retirement-fs.mjs", "scripts/lib/engine-ancestor-fetch.mjs"]) {
    assert.ok(sources.includes(rel), `${rel} is not being scanned — is this guard still aimed right?`);
  }
});

test("no engine source asks 'is this a self-heal?' by comparing the raw strings", () => {
  const offenders = engineSources().flatMap((rel) =>
    findRawDirComparisons(readFileSync(join(REPO_ROOT, rel), "utf8")).map(
      ({ line, text }) => `${rel}:${line}  ${text}`,
    ),
  );

  assert.deepEqual(
    offenders,
    [],
    `A raw comparison of sourceDir and brainDir. It reads exactly like the safe version and
is not: spell either one with a trailing separator, a \`/.\` or a relative segment and the
answer flips. Two of the three doors that ask this question gate an irreversible act -- the
one rmSync under the owner's .claude/, and a git fetch aimed at their private vault remote.

Use isSelfHeal({ brainDir, sourceDir }) from ./update-mode.mjs.\n${offenders.join("\n")}`,
  );
});
