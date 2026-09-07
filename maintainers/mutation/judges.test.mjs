// Tests for judges.mjs — which tests are allowed to judge a mutant (plan
// harness-speed-and-test-quality-action.md § S1).
//
// The defect being fixed is not a bug, it is a bill: the runner re-runs the WHOLE
// harness suite for every single mutant, ~50 s of tests to judge one changed
// operator, 81 min for one batch. A mutant of the author-name registry is judged
// by the tests of the search engine, the installer and the sync, none of which can
// observe it.
//
// So the safety property matters more than the speed, and it is asserted here
// rather than argued: NARROWING THE JUDGES CAN ONLY LOWER A SCORE, NEVER RAISE IT.
// Removing tests removes kills; it cannot invent one. Two things follow, and both
// are tests below: the chosen set is always a SUBSET of the whole suite, and a
// target nobody can observe is REFUSED rather than measured against nothing (a
// judge-less run reports every mutant survived, which is a catastrophic false
// reading dressed as a bad score).
//
// Every fixture here is hand-written, never produced by the code under test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { JUDGES_ENV, WHOLE_SUITE, commandFrom, judgeCommand, judgingTests, runsInWholeSuite } from "./judges.mjs";

// A small brain-shaped corpus: a target, its twin, a helper that reaches it, a
// process-level test that only NAMES it, and a stranger that ignores it all.
const CORPUS = {
  "scripts/lib/target.mjs": "export const answer = () => 42;\n",
  "scripts/lib/target.test.mjs": 'import { answer } from "./target.mjs";\n',
  "scripts/lib/helper.mjs": 'import { answer } from "./target.mjs";\nexport const via = answer;\n',
  "scripts/lib/helper.test.mjs": 'import { via } from "./helper.mjs";\n',
  "scripts/entry.mjs": 'import { answer } from "./lib/target.mjs";\n',
  "scripts/entry.test.mjs": 'import { spawnSync } from "node:child_process";\nspawnSync("node", ["scripts/entry.mjs"]);\n',
  "scripts/stranger.mjs": "export const nothing = () => null;\n",
  "scripts/stranger.test.mjs": 'import { nothing } from "./stranger.mjs";\n',
};

// ─────────────────────────────────────────────────────────────────────────────
// judgingTests — who can see the target

test("judgingTests — the target's own twin judges it", () => {
  const { files } = judgingTests(CORPUS, ["scripts/lib/target.mjs"]);
  assert.ok(files.includes("scripts/lib/target.test.mjs"));
});

test("judgingTests — a test that reaches the target THROUGH a helper judges it too", () => {
  // The whole point of "transitive, not just the twin": helper.test.mjs imports
  // helper.mjs, which imports the target. Its kills are real kills, and dropping
  // it would turn them into survivors — the exact false reading S1.3 warns about.
  const { files } = judgingTests(CORPUS, ["scripts/lib/target.mjs"]);
  assert.ok(files.includes("scripts/lib/helper.test.mjs"));
});

test("judgingTests — a test that only NAMES the target's path judges it (the entry-point seam)", () => {
  // entry.test.mjs imports nothing of the target: it SPAWNS the script as a
  // process, which is what this repo's entry-point rule requires of every
  // executable. An import graph cannot see that edge, and a judge set built from
  // imports alone would silently drop the only test that drives the real thing.
  const { files } = judgingTests(CORPUS, ["scripts/entry.mjs"]);
  assert.ok(files.includes("scripts/entry.test.mjs"));
});

test("judgingTests — a test that can observe nothing of the target is left out", () => {
  const { files } = judgingTests(CORPUS, ["scripts/lib/target.mjs"]);
  assert.ok(!files.includes("scripts/stranger.test.mjs"));
});

test("judgingTests — the whole answer, for one target, in order", () => {
  // Asserted WHOLE and sorted rather than field by field: the set IS the contract,
  // and "contains the twin" would still pass if it silently returned the suite.
  assert.deepEqual(judgingTests(CORPUS, ["scripts/lib/target.mjs"]), {
    files: ["scripts/entry.test.mjs", "scripts/lib/helper.test.mjs", "scripts/lib/target.test.mjs"],
    why: null,
  });
});

test("judgingTests — two targets give the UNION, sorted and deduplicated", () => {
  assert.deepEqual(judgingTests(CORPUS, ["scripts/lib/target.mjs", "scripts/stranger.mjs"]), {
    files: [
      "scripts/entry.test.mjs",
      "scripts/lib/helper.test.mjs",
      "scripts/lib/target.test.mjs",
      "scripts/stranger.test.mjs",
    ],
    why: null,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// The safety property — the whole reason this is allowed to exist

test("judgingTests — the chosen set is always a SUBSET of the files the whole suite runs", () => {
  const { files } = judgingTests(CORPUS, ["scripts/lib/target.mjs", "scripts/stranger.mjs"]);
  const everyTest = Object.keys(CORPUS).filter((path) => path.endsWith(".test.mjs"));
  for (const file of files) assert.ok(everyTest.includes(file), `${file} is not a test of the corpus`);
});

// 🚨 THE SUBSET ABOVE HELD BY ACCIDENT, and this is the hole it left. The corpus is
// every `.mjs` under `scripts/`, walked RECURSIVELY, while the whole suite globs only
// two levels — so "a test of the corpus" and "a test the baseline runs" are two
// different sets, and the first is the larger one. The day a test file lands in a
// deeper directory it becomes a legitimate judge that the baseline NEVER RAN, and the
// narrowed score can then come back HIGHER than the whole suite's: the one direction
// the safety property forbids, arriving silently, on a run nobody thinks to doubt.

test("runsInWholeSuite — the two levels the baseline command actually globs, and nothing under them", () => {
  // Derived from WHOLE_SUITE itself rather than restated: a predicate that repeats the
  // globs as a literal is a constant asserted against itself, and it would go on
  // agreeing with a command that had drifted underneath it.
  assert.equal(runsInWholeSuite("scripts/entry.test.mjs"), true);
  assert.equal(runsInWholeSuite("scripts/lib/target.test.mjs"), true);
  // `*` never crosses a separator — this is the whole point of the guard.
  assert.equal(runsInWholeSuite("scripts/lib/deep/down.test.mjs"), false);
  assert.equal(runsInWholeSuite("scripts/lib/deep/nested/further.test.mjs"), false);
  // Not a test, and not under the two globbed directories.
  assert.equal(runsInWholeSuite("scripts/lib/target.mjs"), false);
  assert.equal(runsInWholeSuite("rag/search.test.mjs"), false);
});

test("judgingTests — an observer the whole suite NEVER RUNS refuses the narrowing, and names it", () => {
  // Refusing, rather than quietly dropping it: dropping keeps the arithmetic safe and
  // hides a real defect — a test file that no run of the suite has ever executed. The
  // fallback is slow and correct, and the message is the only place that fact surfaces.
  const corpus = {
    "scripts/lib/target.mjs": "export const answer = () => 42;\n",
    "scripts/lib/target.test.mjs": 'import { answer } from "./target.mjs";\n',
    "scripts/lib/deep/down.test.mjs": 'import { answer } from "../target.mjs";\n',
  };
  const verdict = judgingTests(corpus, ["scripts/lib/target.mjs"]);
  assert.equal(verdict.files, null);
  assert.match(verdict.why, /scripts\/lib\/deep\/down\.test\.mjs/);
});

test("judgingTests — the stranger refuses the WHOLE run, not just the target that has one", () => {
  // Same shape as the unobservable target one door up: a partial answer would measure
  // the good target honestly and the other against a baseline it never shared.
  const corpus = {
    "scripts/lib/target.mjs": "export const answer = () => 42;\n",
    "scripts/lib/target.test.mjs": 'import { answer } from "./target.mjs";\n',
    "scripts/stranger.mjs": "export const nothing = () => null;\n",
    "scripts/stranger.test.mjs": 'import { nothing } from "./stranger.mjs";\n',
    "scripts/lib/deep/down.test.mjs": 'import { answer } from "../target.mjs";\n',
  };
  assert.equal(judgingTests(corpus, ["scripts/stranger.mjs", "scripts/lib/target.mjs"]).files, null);
});

test("judgingTests — a target NO test can observe is refused, and the refusal names it", () => {
  // Never narrow to nothing: a run with no judges kills no mutant and reports a
  // score of 0 % that looks like a measurement. Refusing hands the caller back to
  // the whole suite, which is slow and correct.
  const orphan = { ...CORPUS, "scripts/lib/orphan.mjs": "export const alone = () => 1;\n" };
  const verdict = judgingTests(orphan, ["scripts/lib/orphan.mjs"]);
  assert.equal(verdict.files, null);
  assert.match(verdict.why, /scripts\/lib\/orphan\.mjs/);
});

test("judgingTests — a target absent from the corpus is refused, and the refusal names it", () => {
  const verdict = judgingTests(CORPUS, ["scripts/lib/typo.mjs"]);
  assert.equal(verdict.files, null);
  assert.match(verdict.why, /scripts\/lib\/typo\.mjs/);
});

test("judgingTests — ONE unobservable target refuses the whole run, not just its own share", () => {
  // A partial answer is the dangerous one: the good target would be measured
  // correctly and the orphan would report every mutant survived, in the same table.
  const orphan = { ...CORPUS, "scripts/lib/orphan.mjs": "export const alone = () => 1;\n" };
  assert.equal(judgingTests(orphan, ["scripts/lib/target.mjs", "scripts/lib/orphan.mjs"]).files, null);
});

// ─────────────────────────────────────────────────────────────────────────────
// The import scan — the shapes real files actually carry

test("judgingTests — a package import is not an edge, and does not crash the scan", () => {
  const corpus = {
    "scripts/lib/target.mjs": 'import { readFileSync } from "node:fs";\nexport const answer = () => readFileSync;\n',
    "scripts/lib/target.test.mjs": 'import assert from "node:assert/strict";\nimport { answer } from "./target.mjs";\n',
  };
  assert.deepEqual(judgingTests(corpus, ["scripts/lib/target.mjs"]).files, ["scripts/lib/target.test.mjs"]);
});

test("judgingTests — `../` climbs out of lib, the way scripts/ actually imports", () => {
  // 🔁 The climb used to be shown by `scripts/lib/deep/down.test.mjs` reaching
  // `../target.mjs`, and that fixture PINNED the hole above: a judge two directories
  // deep, which the baseline command never runs. The assertion is unchanged in
  // strength — still the whole set, still deepEqual — and the climb is now shown by
  // the shape `scripts/` really has: a test in `lib/` reaching a script one level up.
  const corpus = {
    "scripts/target.mjs": "export const answer = () => 42;\n",
    "scripts/target.test.mjs": 'import { answer } from "./target.mjs";\n',
    "scripts/lib/climb.test.mjs": 'import { answer } from "../target.mjs";\n',
  };
  assert.deepEqual(judgingTests(corpus, ["scripts/target.mjs"]).files, [
    "scripts/lib/climb.test.mjs",
    "scripts/target.test.mjs",
  ]);
});

test("judgingTests — a dynamic import() is an edge too", () => {
  const corpus = {
    "scripts/lib/target.mjs": "export const answer = () => 42;\n",
    "scripts/lib/late.test.mjs": 'const m = await import("./target.mjs");\n',
  };
  assert.deepEqual(judgingTests(corpus, ["scripts/lib/target.mjs"]).files, ["scripts/lib/late.test.mjs"]);
});

test("judgingTests — an import CYCLE terminates instead of hanging", () => {
  const corpus = {
    "scripts/lib/a.mjs": 'import { b } from "./b.mjs";\nexport const a = b;\n',
    "scripts/lib/b.mjs": 'import { a } from "./a.mjs";\nexport const b = a;\n',
    "scripts/lib/a.test.mjs": 'import { a } from "./a.mjs";\n',
  };
  assert.deepEqual(judgingTests(corpus, ["scripts/lib/a.mjs"]).files, ["scripts/lib/a.test.mjs"]);
});

test("judgingTests — a test file is never its own judge by being a test", () => {
  // A `.test.mjs` that imports another test's helper must not drag unrelated tests
  // in: the edge that counts is reaching the TARGET, not sharing a directory.
  const corpus = {
    "scripts/lib/target.mjs": "export const answer = () => 42;\n",
    "scripts/lib/target.test.mjs": 'import { answer } from "./target.mjs";\n',
    "scripts/lib/neighbour.test.mjs": 'import { answer } from "./target.test.mjs";\n',
  };
  assert.deepEqual(judgingTests(corpus, ["scripts/lib/target.mjs"]).files, [
    "scripts/lib/neighbour.test.mjs",
    "scripts/lib/target.test.mjs",
  ]);
});

// ─────────────────────────────────────────────────────────────────────────────
// The command — what the runner is actually told to do

test("judgeCommand — one `node --test`, every file quoted", () => {
  assert.equal(
    judgeCommand(["scripts/lib/target.test.mjs", "scripts/entry.test.mjs"]),
    'node --test "scripts/lib/target.test.mjs" "scripts/entry.test.mjs"'
  );
});

test("commandFrom — no variable means the WHOLE suite, exactly as the config always said", () => {
  assert.equal(commandFrom({}), WHOLE_SUITE);
});

test("commandFrom — an empty or blank variable also means the whole suite", () => {
  // Fails towards the slow, correct answer: a variable that arrived empty is a
  // wiring accident, and it must never be read as "judge this with nothing".
  assert.equal(commandFrom({ [JUDGES_ENV]: "" }), WHOLE_SUITE);
  assert.equal(commandFrom({ [JUDGES_ENV]: "   " }), WHOLE_SUITE);
});

test("commandFrom — a list narrows the command to exactly those files", () => {
  assert.equal(
    commandFrom({ [JUDGES_ENV]: "scripts/lib/target.test.mjs,scripts/entry.test.mjs" }),
    'node --test "scripts/lib/target.test.mjs" "scripts/entry.test.mjs"'
  );
});

test("commandFrom — blanks around the separators are the caller's, not the runner's problem", () => {
  assert.equal(
    commandFrom({ [JUDGES_ENV]: " scripts/lib/target.test.mjs , , scripts/entry.test.mjs " }),
    'node --test "scripts/lib/target.test.mjs" "scripts/entry.test.mjs"'
  );
});

test("WHOLE_SUITE is the command every published figure was measured with, character for character", () => {
  // The fallback is not "some suite": it is the exact command the scripts config has
  // carried since the first campaign, so every figure in RESULTS.md was measured with
  // it. A drift here would silently change what a re-measurement is comparable to.
  // (CI runs a WIDER command — it adds rag/*.test.mjs — which is why this is pinned
  // against the config's own history and not against ci.yml.)
  assert.equal(WHOLE_SUITE, 'node --test "scripts/*.test.mjs" "scripts/lib/*.test.mjs"');
});
