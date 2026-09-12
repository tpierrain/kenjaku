import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { docSection } from "./doc-section.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// #98 — the consent was collected in the LAST LINE of a long message, as prose.
//
// Field evidence: a brain owner believed the upgrade had run. It never had. They
// had scrolled past the question. That is the opt-in rule's own failure mode
// reached from the opposite side — not an update without consent, but consent
// that was never given and never noticed.
//
// The cause is structural, not a slip: step 1 is REQUIRED to quote the release
// prose in full rather than summarise it (update-consent-discipline, ADR 0009),
// so the better the release notes, the further the only actionable sentence is
// pushed off screen. Making the message shorter would trade one defect for
// another; making the question a CONTROL costs nothing.
//
// The doctrine that governs this is ADR 0043: where the host offers a dedicated
// question control, a 🔴 uses it, and the prose question stays the fallback. This
// guard holds the two places the update actually asks — step 1's go-ahead, and
// step 4's per-file and grouped choices — in both locales.
//
// 🛑 What it deliberately does NOT change, and the guard says so: consent is
// still required. The tool is how the question is asked, never whether. An
// unanswered question stays unanswered and nothing runs.
//
// Reach: `.claude/skills/update-engine/**` sits in the manifest's `merge` regime,
// so a brain that never tailored this skill is brought up to date by its next
// update; one that tailored it is offered the new text beside its own.
// ═══════════════════════════════════════════════════════════════════════════

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (rel) => readFileSync(join(REPO_ROOT, rel), "utf8");

const SKILLS = [
  {
    locale: "EN",
    path: ".claude/skills/update-engine/SKILL.md",
    step1: /^#+ Step 1 — Find out what the update contains/m,
    step4: /^#+ Step 4 — The files it left alone/m,
    grouped: /^#+ Twelve files must not become twelve questions/m,
  },
  {
    locale: "FR",
    path: "templates/fr/.claude/skills/update-engine/SKILL.md",
    step1: /^#+ Étape 1 : savoir ce que la mise à jour apporte/m,
    step4: /^#+ Étape 4 : les fichiers laissés tels quels/m,
    grouped: /^#+ Douze fichiers ne doivent pas devenir douze questions/m,
  },
];

// ── Step 1: the go-ahead ───────────────────────────────────────────────────
const STEP1_RULES = {
  EN: [
    {
      why: "the host's question control is NAMED, so the instruction is executable rather than aspirational",
      pattern: /AskUserQuestion/,
    },
    {
      why: "and what it buys is said: a clickable control instead of a sentence to spot",
      pattern: /clickable/i,
    },
    {
      why: "the two options are spelled out, so the question cannot be re-invented per session",
      pattern: [/not now/i, /run the update|launch the update|start the update/i],
    },
    {
      why: "declining leaves the brain untouched AND says so — silence about a no is how a no reads as a failure",
      pattern: /not now[^.]{0,120}(untouched|exactly as it is)/is,
    },
    {
      why: "the prose question stays the fallback where the host has no such tool",
      pattern: /fallback/i,
    },
    {
      why: "the release notes still come FIRST — the tool asks the question, it does not replace what makes consent informed",
      pattern: /before .*(question|ask)|still .*(quote|relay)/i,
    },
    {
      why: "consent is still REQUIRED: this changes how it is collected, never whether it is needed",
      pattern: /how .*collected|not whether/i,
    },
    {
      why: "nothing to install means nothing is asked — a question with one real answer is noise",
      pattern: /ask(s)? nothing|no question at all|do not ask/i,
    },
  ],
  FR: [
    {
      why: "the host's question control is NAMED, so the instruction is executable rather than aspirational",
      pattern: /AskUserQuestion/,
    },
    { why: "and what it buys is said: a clickable control instead of a sentence to spot", pattern: /cliquable/i },
    {
      why: "the two options are spelled out, so the question cannot be re-invented per session",
      pattern: [/pas maintenant/i, /lancer la mise à jour/i],
    },
    {
      why: "declining leaves the brain untouched AND says so",
      pattern: /pas maintenant[^.]{0,120}(intact|tel quel|rien n'est touché)/is,
    },
    { why: "the prose question stays the fallback where the host has no such tool", pattern: /repli|secours/i },
    {
      why: "the release notes still come FIRST",
      pattern: /avant .*(question|demander)|toujours .*(cite|relaie)/i,
    },
    {
      why: "consent is still REQUIRED: this changes how it is collected, never whether it is needed",
      pattern: /comment[^.]{0,80}(recueilli|demandé)/is,
    },
    {
      why: "nothing to install means nothing is asked",
      pattern: /ne demande rien|aucune question/i,
    },
  ],
};

// ── Step 4: the per-file choice, and its grouped variant ───────────────────
const STEP4_RULES = {
  EN: [
    {
      why: "the same control is used for the three-way choice, which maps onto options one-for-one",
      pattern: /AskUserQuestion/,
    },
    {
      why: "the three branches stay exactly three — the offer is what it was, only its shape changed",
      pattern: [/take the new one/i, /keep mine/i, /combine/i],
    },
    {
      why: "the prose form is still there for a host without the tool",
      pattern: /fallback/i,
    },
  ],
  FR: [
    { why: "the same control is used for the three-way choice", pattern: /AskUserQuestion/ },
    {
      why: "the three branches stay exactly three",
      pattern: [/prendre la nouvelle/i, /garder la mienne/i, /combiner/i],
    },
    { why: "the prose form is still there for a host without the tool", pattern: /repli|secours/i },
  ],
};

const GROUPED_RULES = {
  EN: [
    {
      why: "the grouped question is a control too — this is the shape a fleet of twelve files actually meets",
      pattern: /AskUserQuestion/,
    },
    {
      why: "its three options are named, including the one that re-opens the per-file conversation",
      pattern: [/all the new ones/i, /all of mine/i, /one by one/i],
    },
  ],
  FR: [
    { why: "the grouped question is a control too", pattern: /AskUserQuestion/ },
    {
      why: "its three options are named, including the one that re-opens the per-file conversation",
      pattern: [/toutes les nouvelles/i, /toutes les miennes/i, /une par une|un par un/i],
    },
  ],
};

const SUITES = [
  { name: "step 1 go-ahead", key: "step1", rules: STEP1_RULES },
  { name: "step 4 per-file choice", key: "step4", rules: STEP4_RULES },
  { name: "step 4 grouped choice", key: "grouped", rules: GROUPED_RULES },
];

for (const skill of SKILLS) {
  for (const { name, key, rules } of SUITES) {
    for (const { why, pattern } of rules[skill.locale]) {
      test(`clickable consent — ${skill.locale} ${name}: ${why}`, () => {
        const section = docSection(read(skill.path), skill[key]);
        assert.notEqual(section, "", `${skill.path} lost the section this rule lives in`);
        for (const p of [pattern].flat()) {
          assert.match(section, p, `${skill.path} — missing: ${why}`);
        }
      });
    }
  }
}

// ── The doctrine behind it must be reachable from the skill ────────────────
// Without the pointer the next person to touch this skill re-litigates the shape
// of the question; with it, they read why a control beats a sentence and move on.
for (const { locale, path } of SKILLS) {
  test(`clickable consent — ${locale} update-engine cites the decision that governs how it asks`, () => {
    assert.match(read(path), /ADR 0043/, "the skill must point at the doctrine rather than re-argue it");
  });
}
