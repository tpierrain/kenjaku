import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { UPDATE_DURATION_SENTENCE, UPDATE_DURATION_SENTENCE_FR } from "./update-duration.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// #101 — WHICH NUMBER AN OWNER READS before saying yes to an update.
//
// The consent message describes, at length and correctly, code being replaced on
// someone's machine. The only duration in it was the scary one — "a few minutes",
// the re-index case — so a non-technical reader could not tell whether yes costs
// them a minute or an afternoon. An unknown cost is postponed, and postponing is
// what leaves a fleet several releases behind, which is #100's whole subject.
//
// The sentence therefore lives in ONE module and is QUOTED by both surfaces that
// say it: the skill's step 1, read by an agent, and the offer built by code. Typed
// twice, they drift — and this guard is what makes "quoted" true rather than
// aspirational.
//
// 🇫🇷 The French twin is a SECOND constant rather than a translation done live,
// for the same reason: the French skill is a shipped artifact, and a sentence
// re-invented at each rendering is a sentence nobody can review. Its wording is
// the owner's to correct, in the module and the skill together.
// ═══════════════════════════════════════════════════════════════════════════

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (rel) => readFileSync(join(REPO_ROOT, rel), "utf8");

const SURFACES = [
  {
    locale: "EN",
    path: ".claude/skills/update-engine/SKILL.md",
    sentence: UPDATE_DURATION_SENTENCE,
    asks: /^#+ Then ask — as a control/m,
  },
  {
    locale: "FR",
    path: "templates/fr/.claude/skills/update-engine/SKILL.md",
    sentence: UPDATE_DURATION_SENTENCE_FR,
    asks: /^#+ Puis demande, comme un vrai contrôle/m,
  },
];

for (const { locale, path, sentence, asks } of SURFACES) {
  test(`${locale} — the shipped skill quotes the duration sentence word for word`, () => {
    assert.ok(
      read(path).includes(sentence),
      `${path} must quote the sentence from update-duration.mjs verbatim, not a variant of it:\n${sentence}`,
    );
  });

  test(`${locale} — it is said BEFORE the question, never after it`, () => {
    // A cost stated after the control has already been offered is a cost stated
    // to someone who has already answered. This is the same defect as #98, one
    // sentence further down: the ORDER is the feature.
    const body = read(path);
    const said = body.indexOf(sentence);
    const asked = body.search(asks);

    assert.ok(asked > -1, `the question's own heading moved in ${path}; this guard needs it`);
    assert.ok(said > -1 && said < asked, `the duration must come before the question in ${path}`);
  });
}

test("the sentence carries all three of its parts — the usual case, the exception, and the reassurance", () => {
  // What makes it answerable rather than merely present. Drop any one of them and
  // it is back to being the scary number on its own, which is the defect.
  assert.match(UPDATE_DURATION_SENTENCE, /about a minute/);
  assert.match(UPDATE_DURATION_SENTENCE, /re-index/);
  assert.match(UPDATE_DURATION_SENTENCE, /nothing you have written is lost/);

  assert.match(UPDATE_DURATION_SENTENCE_FR, /environ une minute/);
  assert.match(UPDATE_DURATION_SENTENCE_FR, /réindex/);
  assert.match(UPDATE_DURATION_SENTENCE_FR, /rien de ce que tu as écrit n'est perdu/);
});

test("both spellings make the ENGINE the visible actor, which is the pro-drop trap", () => {
  // The skill's own phrasing rule, and it bites hardest in French: a subjectless
  // present ("récupère un moteur plus récent…") reads as an order given to the
  // person, not as a description of what the engine will do.
  assert.ok(UPDATE_DURATION_SENTENCE.startsWith("The engine will"), UPDATE_DURATION_SENTENCE);
  assert.ok(UPDATE_DURATION_SENTENCE_FR.startsWith("Le moteur "), UPDATE_DURATION_SENTENCE_FR);
});
