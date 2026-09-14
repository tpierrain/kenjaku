import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { docSection } from "./doc-section.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// #128 — a prep's FIRST SCREEN is the whole brief, and the rule that says so
// lives in exactly ONE place.
//
// The finding (issue #119 part A): the capability is not missing. A prep note
// written in the field on 2026-09-13 already had the right shape — a page of
// things to say, the ammunition folded underneath. It does not reproduce
// because the shape is written nowhere as the rule, so the owner asks for it
// again every session.
//
// Why a doc guard and not only a runtime check: the runtime check (the cap)
// judges a note AFTER it is written. What decides whether the note comes out
// right in the first place is what the model was TOLD, and the telling lives
// in files that drift independently — the shape skill and its FR twin, plus
// the consumer `prepare-1-1` in both locales.
//
// Why the shape is its OWN skill and not a section of `prepare-1-1`, recorded
// here because it decided the carrier: engine updates install a skill only if
// it is ABSENT and preserve the one already there (`engine-apply-plan.mjs`
// § installSkills, proven by staged-skills.test.mjs's preserve-present case).
// Text added inside `prepare-1-1` therefore reaches fresh installs and no brain
// already in the field. A NEW staged skill under `engine-skills/` is the one
// carrier that reaches an upgrader — so that is where the shape lives, and the
// consumer defers to it the way it already defers to claim discipline.
// ═══════════════════════════════════════════════════════════════════════════

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (rel) => readFileSync(join(REPO_ROOT, rel), "utf8");

// The ONE home of the shape, and its French twin. The twin path is the one
// `staged-skills.mjs` resolves against (`templates/<locale>/engine-skills/…`),
// not a second skill: a French brain gets this file INSTEAD of the English one.
const SHAPE = [
  { locale: "EN", path: "engine-skills/brief-shape/SKILL.md", heading: /^#+ The shape/m },
  { locale: "FR", path: "templates/fr/engine-skills/brief-shape/SKILL.md", heading: /^#+ La forme/m },
];

// The consumers: skills that PRODUCE a prep and must obey the shape rather than
// restate it. Enumerated in both locales, and that enumeration is the point —
// the claim-discipline guard records a near-miss where a first pass listed only
// the EN pair, because `.claude` is hidden and did not show in a directory
// listing of `templates/fr`.
const CONSUMERS = [
  { locale: "EN", name: "prepare-1-1", path: ".claude/skills/prepare-1-1/SKILL.md" },
  { locale: "FR", name: "prepare-1-1", path: "templates/fr/.claude/skills/prepare-1-1/SKILL.md" },
];

// ── The rules the shape must carry, each with the failure it prevents ───────
// Every entry is a decision taken in the plan, with the reason it was taken, so
// a future reader can tell what the pattern is for rather than deleting it as
// boilerplate. Source: maintainers/plans/one-page-briefs-action.md § The shape,
// decided.
const RULES_EN = [
  {
    why: "the cap is SEVEN top-level bullets — bullets, because a sentence is not decidable",
    pattern: /\b7\b[^\n]*bullet|bullet[^\n]*\b7\b/i,
  },
  {
    why: "each bullet is capped at 220 characters, or seven bullets is gamed by seven paragraphs",
    pattern: /\b220\b/,
  },
  {
    why: "the cap is an UPPER bound: a short brief is correct, and a check that failed one would be padding pressure wired in (Q3)",
    pattern: /upper bound|fewer than|no floor|never pads?/i,
  },
  {
    why: "a thin brief SAYS what the vault does not document, instead of padding to reach a number (Q3)",
    pattern: /not documented|does not document|thin/i,
  },
  {
    why: "the brief section is everything between the # title and the first ## heading — the anchor, so the rule needs no magic heading name and is the same in both locales",
    pattern: /first `?##|first heading|before the first/i,
  },
  {
    why: "everything below is ammunition, labelled as opened only if they dig, contest or ask",
    pattern: /only if they dig/i,
  },
  {
    why: "every ammunition item carries its verbatim quote, its date and its source path — the load-bearing half: answering a contradiction with the exact words, in the room",
    pattern: /verbatim/i,
  },
  {
    why: "a closing block says what the vault does NOT support, so a negative claim is never spoken without knowing it is unsupported",
    pattern: /does not support|not supported|unsupported/i,
  },
  {
    why: "the scope is a PREFIX on frontmatter `type:` — prep- and briefing- — so a prep type invented later is covered the day it is written (Q2)",
    pattern: /prep-\*|`prep-`|prefix/i,
  },
];

const RULES_FR = [
  { why: "le plafond est de SEPT puces", pattern: /\b7\b[^\n]*puce|puce[^\n]*\b7\b/i },
  { why: "chaque puce est plafonnée à 220 caractères", pattern: /\b220\b/ },
  { why: "le plafond est un maximum, jamais un minimum (Q3)", pattern: /maximum|jamais un minimum|moins de/i },
  { why: "une prépa peu documentée le DIT au lieu de remplir (Q3)", pattern: /pas documenté|peu documenté/i },
  {
    why: "la première page va du titre # au premier titre ## — l'ancre, sans nom de section magique",
    pattern: /premier `?##|premier titre|avant le premier/i,
  },
  { why: "en dessous, les munitions, à n'ouvrir que si on te challenge", pattern: /si on te (challenge|conteste)|seulement si/i },
  { why: "chaque munition porte sa citation mot pour mot, sa date et sa source", pattern: /mot pour mot|verbatim/i },
  { why: "un bloc final dit ce que le vault ne soutient PAS", pattern: /ne soutient pas|non étayé|pas étayé/i },
  { why: "le périmètre est un PRÉFIXE sur le `type:` du frontmatter (Q2)", pattern: /prep-\*|`prep-`|préfixe/i },
];

for (const { locale, path, heading } of SHAPE) {
  test(`${locale} the brief shape is delivered at all`, () => {
    assert.ok(
      existsSync(join(REPO_ROOT, path)),
      `${path} must exist — a staged skill is the only carrier that reaches a brain already in the field`,
    );
  });

  test(`${locale} the brief shape has a section of its own`, () => {
    assert.match(read(path), heading, `${path} must carry the shape under its own heading`);
  });

  const rules = locale === "FR" ? RULES_FR : RULES_EN;
  for (const { why, pattern } of rules) {
    test(`${locale} the brief shape carries: ${why}`, () => {
      assert.match(docSection(read(path), heading), pattern, `${path} lost the rule — ${why}`);
    });
  }
}

// ── The consumer OBEYS, it does not restate ────────────────────────────────
// Two paraphrases are two disciplines. The consumer names the shape and defers,
// exactly as it already does for claim discipline: "the full rules live in one
// place and this skill obeys them rather than restating its own".
for (const { locale, name, path } of CONSUMERS) {
  test(`${locale} ${name} points at the brief shape`, () => {
    assert.match(
      read(path),
      /brief-shape/,
      `${path} must name the shape skill — a prep produced without it is the defect this issue is about`,
    );
  });

  test(`${locale} ${name} does NOT restate the cap`, () => {
    assert.doesNotMatch(
      read(path),
      /\b220\b/,
      `${path} restates the cap. A number written twice is a number that will disagree with itself; ` +
        `the consumer links to brief-shape instead`,
    );
  });
}
