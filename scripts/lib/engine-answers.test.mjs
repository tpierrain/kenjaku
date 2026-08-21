import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  ANSWERS_REL,
  isAnswered,
  parseAnswers,
  readAnswers,
  recordAnswer,
  unansweredRels,
  writeAnswers,
} from "./engine-answers.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// engine-answers — what the OWNER has already been asked, and answered (plan S10-2).
//
// 🚨 THE ONE RULE EVERYTHING BELOW SERVES: an answer is scoped to the ENGINE VERSION it
// was given against. A new version means a new candidate, so the answer no longer covers
// it and the file is raised once more. That is how "raised once per release" happens with
// no timer, no rule and nothing to tune — it falls out of the key.
//
// 🧭 AND THE DIRECTION IT FAILS IN, which is a decision and not a detail: anything
// doubtful — unreadable file, malformed JSON, an entry with no version — counts as NOT
// ANSWERED. Re-asking is a mild annoyance; silently swallowing the question is the exact
// defect S10 exists to remove.
// ═══════════════════════════════════════════════════════════════════════════

const REL = "CLAUDE.engine.md";
const OTHER = ".claude/skills/coach/SKILL.md";

test("an answer given at one engine version does NOT cover the next one", () => {
  const answers = recordAnswer({ answers: {}, rel: REL, decision: "keep-mine", ref: "v5.0.0" });

  assert.equal(isAnswered({ answers, rel: REL, ref: "v5.0.0" }), true);
  assert.equal(isAnswered({ answers, rel: REL, ref: "v5.1.0" }), false, "a new version re-opens it");
});

test("an answer covers only the file it was about", () => {
  const answers = recordAnswer({ answers: {}, rel: REL, decision: "keep-mine", ref: "v5.0.0" });

  assert.equal(isAnswered({ answers, rel: OTHER, ref: "v5.0.0" }), false);
});

test("recordAnswer does not mutate the answers it was handed", () => {
  // The caller reads once and writes once; a function that edits its argument in place
  // makes "what was on disk" and "what we are about to write" the same object, and the
  // difference between them is the only thing worth logging when this goes wrong.
  const before = {};
  const after = recordAnswer({ answers: before, rel: REL, decision: "keep-mine", ref: "v5.0.0" });

  assert.deepEqual(before, {});
  assert.deepEqual(after, { [REL]: { decision: "keep-mine", at: "v5.0.0" } });
});

test("re-answering a file REPLACES its entry rather than stacking a history", () => {
  const first = recordAnswer({ answers: {}, rel: REL, decision: "keep-mine", ref: "v5.0.0" });
  const second = recordAnswer({ answers: first, rel: REL, decision: "keep-mine", ref: "v5.1.0" });

  assert.deepEqual(second, { [REL]: { decision: "keep-mine", at: "v5.1.0" } });
  assert.equal(isAnswered({ answers: second, rel: REL, ref: "v5.0.0" }), false, "the old ref is gone with it");
});

test("recordAnswer keeps the OTHER files' answers untouched", () => {
  const answers = recordAnswer({
    answers: recordAnswer({ answers: {}, rel: OTHER, decision: "keep-mine", ref: "v5.0.0" }),
    rel: REL,
    decision: "keep-mine",
    ref: "v5.0.0",
  });

  assert.deepEqual(answers, {
    [OTHER]: { decision: "keep-mine", at: "v5.0.0" },
    [REL]: { decision: "keep-mine", at: "v5.0.0" },
  });
});

test("unansweredRels subtracts what is answered AT THIS REF, and keeps the order it was given", () => {
  // Order preserved because the callers that consume this (the report, the nudge) each
  // sort for their own reasons, and a second opinion here would fight them.
  const answers = recordAnswer({ answers: {}, rel: OTHER, decision: "keep-mine", ref: "v5.0.0" });

  assert.deepEqual(
    unansweredRels({ rels: [REL, OTHER, "scripts/auto-push.mjs"], answers, ref: "v5.0.0" }),
    [REL, "scripts/auto-push.mjs"],
  );
  assert.deepEqual(
    unansweredRels({ rels: [REL, OTHER], answers, ref: "v5.1.0" }),
    [REL, OTHER],
    "a new version brings every one of them back",
  );
});

// ─── Reading what is on disk, and failing toward ASKING ──────────────────────

test("parseAnswers reads a well-formed record", () => {
  assert.deepEqual(parseAnswers(`{"${REL}":{"decision":"keep-mine","at":"v5.0.0"}}`), {
    [REL]: { decision: "keep-mine", at: "v5.0.0" },
  });
});

test("parseAnswers treats anything it cannot trust as NO answers at all", () => {
  // Every one of these is a state a real brain can reach: a half-written file, a hand
  // edit, a merge that went sideways. None of them may suppress a question.
  assert.deepEqual(parseAnswers("{ not json"), {});
  assert.deepEqual(parseAnswers(""), {});
  assert.deepEqual(parseAnswers(undefined), {});
  assert.deepEqual(parseAnswers("null"), {});
  assert.deepEqual(parseAnswers("[1, 2]"), {}, "an array is not a map of answers");
  assert.deepEqual(parseAnswers('"a string"'), {});
});

test("a NULL entry is dropped rather than crashing the read", () => {
  // `typeof null === "object"`, so without the explicit null check this throws while
  // reaching for `.at` — and a thrown parse takes down the whole update over one bad
  // line in a file that travels between machines.
  assert.deepEqual(parseAnswers(`{"${REL}":null,"${OTHER}":{"decision":"keep-mine","at":"v5.0.0"}}`), {
    [OTHER]: { decision: "keep-mine", at: "v5.0.0" },
  });
});

test("an EMPTY version is not a version", () => {
  // `at: ""` is what a half-written file or a bad hand edit leaves behind. It must not
  // count as an answer, and it must not accidentally match a caller passing "" as a ref.
  const answers = parseAnswers(`{"${REL}":{"decision":"keep-mine","at":""}}`);

  assert.deepEqual(answers, {});
  assert.equal(isAnswered({ answers, rel: REL, ref: "" }), false);
});

test("an entry with no version is NOT an answer, and it does not poison its siblings", () => {
  const parsed = parseAnswers(
    `{"${REL}":{"decision":"keep-mine"},"${OTHER}":{"decision":"keep-mine","at":"v5.0.0"}}`,
  );

  assert.deepEqual(parsed, { [OTHER]: { decision: "keep-mine", at: "v5.0.0" } });
  assert.equal(isAnswered({ answers: parsed, rel: REL, ref: "v5.0.0" }), false);
});

test("readAnswers on a brain that has never answered anything returns no answers", () => {
  const brainDir = mkdtempSync(join(tmpdir(), "sbg-answers-"));
  try {
    assert.deepEqual(readAnswers({ brainDir }), {});
  } finally {
    rmSync(brainDir, { recursive: true, force: true });
  }
});

test("writeAnswers then readAnswers is a round trip, and the file is human-readable", () => {
  const brainDir = mkdtempSync(join(tmpdir(), "sbg-answers-"));
  try {
    const answers = recordAnswer({ answers: {}, rel: REL, decision: "keep-mine", ref: "v5.0.0" });
    writeAnswers({ brainDir, answers });

    assert.deepEqual(readAnswers({ brainDir }), answers);
    const raw = readFileSync(join(brainDir, ANSWERS_REL), "utf8");
    // Indented and newline-terminated on purpose: this file is versioned and travels to
    // the owner's other machine, so it lands in diffs — one answer per line, not one line.
    assert.match(raw, /\n {2}"/);
    assert.ok(raw.endsWith("\n"));
  } finally {
    rmSync(brainDir, { recursive: true, force: true });
  }
});

test("a corrupted answers file makes the update ASK again, never crash", () => {
  const brainDir = mkdtempSync(join(tmpdir(), "sbg-answers-"));
  try {
    writeFileSync(join(brainDir, ANSWERS_REL), "{ half-written");

    assert.deepEqual(readAnswers({ brainDir }), {});
  } finally {
    rmSync(brainDir, { recursive: true, force: true });
  }
});

test("the answers file sits beside .engine-base, and is named ONCE", () => {
  // Same discipline as BASE_PREFIX: one name, in one module, so no caller can grow a
  // second convention for a file whose whole value is being found again next release.
  assert.equal(ANSWERS_REL, ".engine-answers.json");
});

test("the SHIPPED .gitignore does not ignore it — the answers must travel", () => {
  // 🛑 The module's own comment claims this file reaches the owner's other machine, and
  // that claim rests entirely on git tracking it. Measured rather than assumed: one line
  // added to the shipped `.gitignore` would silently strand every answer on one laptop,
  // and the only symptom would be questions the owner already settled coming back.
  const repoRoot = join(import.meta.dirname, "..", "..");
  const ignored = spawnSync("git", ["check-ignore", "-q", ANSWERS_REL], { cwd: repoRoot });

  assert.equal(ignored.status, 1, `the shipped .gitignore ignores ${ANSWERS_REL}`);
});
