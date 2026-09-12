import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { docSection } from "./doc-section.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// Graduated autonomy and plain language — issue #79, the DECISION half only.
// ADR 0043 ratifies the model; this guard holds it in the delivered
// constitution, where the brain actually reads it.
//
// The field defect (owner, 2026-07-19): once `/lint` and `/consolidate` landed,
// the brain's original strength — things happen on their own — degraded into a
// wall of decision prompts written in tool jargon. Five subset-picker prompts in
// ONE session, and the owner's verdict was "I don't understand the subject or
// the options". The self-maintenance mechanics are right; the way they reach a
// human is not.
//
// 🧭 Why this ships with v5.2 rather than with the wide clean-up it opens: this
// release EMITS new user-facing strings (#98's clickable question above all) and
// the next one emits more. A doctrine written after them is re-work by
// construction. The audit of every existing string is weeks and belongs to v5.4;
// only the decision rides here.
//
// Deliberately NOT a hook, for the same reason as signal-announce: nothing can
// read a sentence before a human does, and a guard that judges prose is blind by
// construction. A doc guard pins that the rules are THERE, together, above their
// instances — never that a given sentence is well written.
//
// Reach: `CLAUDE.engine.md` is a `merge`-regime file, so both locales move
// together (locale-drift) or a brain holding these bytes stays frozen.
// ═══════════════════════════════════════════════════════════════════════════

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (rel) => readFileSync(join(REPO_ROOT, rel), "utf8");

const HEADING_EN = /^#+ Graduated autonomy — when to act, when to announce, when to ask/m;
// The FR heading takes a colon where the EN takes an em dash: the French half of
// this product is written without em dashes, and the existing FR sections already
// split both ways. Not a translation slip — a typography convention.
const HEADING_FR = /^#+ Autonomie graduée : quand agir, quand annoncer, quand demander/m;

// A constitution is the UNION of its two layers: the thin sacred file and the
// engine layer it @imports. The union is also the READING ORDER, which the
// placement test below depends on.
const CONSTITUTIONS = [
  { locale: "EN", layers: ["CLAUDE.md.template", "CLAUDE.engine.md"] },
  { locale: "FR", layers: ["templates/fr/CLAUDE.md.template", "templates/fr/CLAUDE.engine.md"] },
];

// ── The rules, each with the failure it prevents ───────────────────────────
// The two halves of #79 are pinned as one section on purpose: an autonomy tier
// that says "ask" without saying HOW to ask is what produced the wall of jargon
// in the first place. Splitting them is how one of them gets carried alone.
const RULES_EN = [
  {
    why: "there are THREE tiers, not the binary read-only-auto / writes-confirmed posture this replaces",
    pattern: /\bthree tiers\b/i,
  },
  {
    why: "the most autonomous tier exists and is NAMED — without it the doctrine is just a nicer way to keep asking",
    pattern: /🟢/,
  },
  {
    why: "the middle tier exists: announce, then act, without requesting permission",
    pattern: /🟡/,
  },
  {
    why: "the asking tier exists and stays legitimate — the goal was never to stop asking",
    pattern: /🔴/,
  },
  {
    why: "the gate is REVERSIBILITY, so the tier of a gesture is derived rather than felt",
    pattern: /reversib/i,
  },
  {
    why: "the gate's second half is CONFIDENCE — a reversible gesture the brain is unsure of is still a question",
    pattern: /confiden/i,
  },
  {
    why: "the safety net that makes acting acceptable is named: everything written is auto-committed, hence revertible",
    pattern: /auto-commit/i,
  },
  {
    why: "🟡 is BATCHED — one summary for N gestures, which is the actual cure for five prompts in one session",
    pattern: /batch/i,
  },
  {
    why: "a veto is what replaces a confirmation: the user stops it, they do not have to authorise it",
    pattern: /veto/i,
  },
  {
    why: "no tool jargon in anything a human reads — the half of the defect that survives fixing the tiers",
    pattern: /jargon/i,
  },
  {
    why: "a question says WHY IT MATTERS, for someone who does not know the machinery",
    pattern: /why it matters/i,
  },
  {
    why: "every reply says whether it asks something, so the user never hunts for the ask",
    pattern: /asks? (you )?(for )?(anything|something)/i,
  },
  {
    why: "where the host offers a clickable question, a 🔴 uses it instead of prose at the end of a long message (#98)",
    pattern: /clickable/i,
  },
  {
    why: "the prose question stays the FALLBACK, so a host without the tool can still ask",
    pattern: /fallback/i,
  },
  {
    why: "the rule governs every NEW string, which is what makes it a doctrine rather than a clean-up",
    pattern: /new (user-facing )?string/i,
  },
];

const RULES_FR = [
  {
    why: "there are THREE tiers, not the binary read-only-auto / writes-confirmed posture this replaces",
    pattern: /trois (niveaux|paliers)/i,
  },
  {
    why: "the most autonomous tier exists and is NAMED — without it the doctrine is just a nicer way to keep asking",
    pattern: /🟢/,
  },
  { why: "the middle tier exists: announce, then act, without requesting permission", pattern: /🟡/ },
  { why: "the asking tier exists and stays legitimate — the goal was never to stop asking", pattern: /🔴/ },
  {
    why: "the gate is REVERSIBILITY, so the tier of a gesture is derived rather than felt",
    pattern: /réversib/i,
  },
  {
    why: "the gate's second half is CONFIDENCE — a reversible gesture the brain is unsure of is still a question",
    pattern: /confiance/i,
  },
  {
    why: "the safety net that makes acting acceptable is named: everything written is auto-committed, hence revertible",
    pattern: /auto-commit/i,
  },
  {
    why: "🟡 is BATCHED — one summary for N gestures, which is the actual cure for five prompts in one session",
    pattern: /group|lot/i,
  },
  {
    why: "a veto is what replaces a confirmation: the user stops it, they do not have to authorise it",
    pattern: /veto|arrête-moi/i,
  },
  {
    why: "no tool jargon in anything a human reads — the half of the defect that survives fixing the tiers",
    pattern: /jargon/i,
  },
  {
    why: "a question says WHY IT MATTERS, for someone who does not know the machinery",
    pattern: /pourquoi (ça|cela) compte/i,
  },
  {
    why: "every reply says whether it asks something, so the user never hunts for the ask",
    pattern: /décider quelque chose/i,
  },
  {
    why: "where the host offers a clickable question, a 🔴 uses it instead of prose at the end of a long message (#98)",
    pattern: /cliquable/i,
  },
  {
    why: "the prose question stays the FALLBACK, so a host without the tool can still ask",
    pattern: /repli|secours/i,
  },
  {
    why: "the rule governs every NEW string, which is what makes it a doctrine rather than a clean-up",
    pattern: /nouvelle phrase|nouveau message|toute phrase/i,
  },
];

for (const { locale, layers } of CONSTITUTIONS) {
  const heading = locale === "FR" ? HEADING_FR : HEADING_EN;
  const rules = locale === "FR" ? RULES_FR : RULES_EN;

  test(`${locale} constitution has a graduated-autonomy section at all`, () => {
    assert.match(layers.map(read).join("\n"), heading, "the doctrine must have its own heading");
  });

  for (const { why, pattern } of rules) {
    test(`${locale} constitution carries the autonomy doctrine: ${why}`, () => {
      const section = docSection(layers.map(read).join("\n"), heading);
      assert.match(section, pattern, `the ${locale} constitution lost the rule — ${why}`);
    });
  }
}

// ── The 🟡 tier's existing instance must defer to the general rule ─────────
// `Announce before acting on a signal` IS the middle tier, written before the
// tiers existed. Two paraphrases are two disciplines, so it points here rather
// than restating the model — the reflex signal-announce-discipline.test.mjs
// itself enforces one layer down.
const SIGNAL_EN = /^#+ Announce before acting on a signal/m;
const SIGNAL_FR = /^#+ Annonce avant d'agir sur un signal/m;

for (const { locale, layers } of CONSTITUTIONS) {
  test(`${locale} constitution: the announce rule names itself as the 🟡 tier`, () => {
    const section = docSection(layers.map(read).join("\n"), locale === "FR" ? SIGNAL_FR : SIGNAL_EN);
    assert.notEqual(section, "", "the signal-announce section must still be there");
    assert.match(section, /🟡/, "the rule that IS the middle tier must say so, or the model has two homes");
  });
}

// ── A general rule read after its instances is read too late ───────────────
// Same reflex as the source-first and signal-announce placement guards: the
// tiers govern the announce rule and everything the brain writes, so they are
// stated before them.
for (const { locale, layers } of CONSTITUTIONS) {
  test(`${locale} constitution: the tiers are stated ABOVE the instance that applies them`, () => {
    const text = layers.map(read).join("\n");
    const at = text.search(locale === "FR" ? HEADING_FR : HEADING_EN);
    const signal = text.search(locale === "FR" ? SIGNAL_FR : SIGNAL_EN);
    assert.notEqual(at, -1, "the doctrine must be there at the start of a line");
    assert.notEqual(signal, -1, "its instance must still be there to be placed against");
    assert.equal(at < signal, true, "a general rule read after its instance is read too late");
  });
}

// ── The decision it implements must be findable from the doctrine ──────────
// A doctrine with no ADR behind it gets re-litigated at the next skill; an ADR
// nobody links to is read by nobody. The constitution carries the rules, the ADR
// carries why they are right — and only the second survives a disagreement.
for (const { locale, layers } of CONSTITUTIONS) {
  test(`${locale} constitution: the doctrine cites the decision that ratified it`, () => {
    const section = docSection(layers.map(read).join("\n"), locale === "FR" ? HEADING_FR : HEADING_EN);
    assert.match(section, /ADR 0043/, "the tiers must point at the decision, not re-argue it");
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// v5.4 — the doctrine, held where the owner actually meets it: the two skills
// that produced the complaint.
//
// The constitution guards above pin that the tiers EXIST. These pin that the
// two skills #79 was opened about apply them — because a doctrine every skill
// is free to ignore is a doctrine nobody reads twice.
//
// 🛑 ANCHORED ON THE STEP NUMBER, NEVER ON ITS TITLE. The first version of the
// sibling guard in `identity-discipline.test.mjs` located its section by the
// heading "3. Propose fixes"; v5.4 retitled that step, so the guard read an
// EMPTY section and its two assertions judged nothing, silently, while still
// passing green. A guard that goes quiet on a rename has stopped guarding. The
// step number is the stable part of a procedure; the wording is what this
// release moves.
//
// ⚠️ WHAT THESE CAN AND CANNOT DO. Like every doc guard here, they assert that
// a rule is PRESENT, never that a sentence is well written — nothing can read a
// sentence before a human does. They are a floor under the prose, not a judge
// of it.
// ═══════════════════════════════════════════════════════════════════════════

const LINT_SKILL = "engine-skills/lint/SKILL.md";
const CONSOLIDATE_SKILL = "engine-skills/consolidate/SKILL.md";

// `/lint` shipped first, so its rows below are REGRESSION PINS on behaviour that
// is already in the repo, not test-first steps. `/consolidate`'s were written
// against a skill that did not yet carry them, and went red for the right reason.
const TIERED_SKILLS = [
  {
    name: "lint",
    path: LINT_SKILL,
    // Its procedure's acting step, whatever it comes to be called.
    step: /^#+ 3\. /m,
  },
  {
    name: "consolidate",
    path: CONSOLIDATE_SKILL,
    step: /^#+ 4\. /m,
  },
];

for (const { name, path, step } of TIERED_SKILLS) {
  test(`${name} points at the decision rather than restating the tiers`, () => {
    assert.match(
      read(path),
      /ADR 0043/,
      "two paraphrases of one doctrine are two disciplines that will drift apart",
    );
  });

  test(`${name} names the tiers it uses, so a reader can tell which gesture is which`, () => {
    const text = read(path);
    for (const tier of ["🟡", "🔴"]) {
      assert.ok(text.includes(tier), `the ${tier} tier must be named in ${name}`);
    }
  });

  test(`${name} asks ONCE for the whole batch, never once per finding`, () => {
    const section = docSection(read(path), step);
    assert.notEqual(section, "", "the acting step must still exist — check the step number");
    assert.match(
      section,
      /one message/i,
      "the cure ADR 0043 §4 calls 'the whole cure' is the single message",
    );
    assert.match(
      section,
      /not one per|never one per/i,
      "five prompts in a row is the measured complaint, and it is what this must forbid",
    );
  });

  test(`${name} says why a question matters before it lists the options`, () => {
    const section = docSection(read(path), step);
    assert.match(
      section,
      /before the options/i,
      "ADR 0043 §5: an option list with no stake stated is the jargon wall in another shape",
    );
  });
}

// ── And what must NOT have been lost while the words moved ────────────────
// The tiers are about HOW the brain asks, never about whether a page may be
// written behind the owner's back. `/consolidate` creates pages and adjudicates
// nothing: a batch that ran without a yes would be this release trading one
// defect for a far worse one.
test("consolidate still writes nothing without a yes, batched or not", () => {
  const text = read(CONSOLIDATE_SKILL);
  assert.match(text, /write on yes|only on yes|never write yet/i);
  assert.match(
    text,
    /never adjudicate|never decides|flag contradictions/i,
    "a contradiction stays the human's to resolve",
  );
});
