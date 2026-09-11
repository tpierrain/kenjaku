import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { docSection } from "./doc-section.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// #80 — A SOURCE THAT GOES QUIET MUST NOT READ AS A SOURCE WITH NO NEWS.
//
// The field report: during a wide catch-up pass, a mail connector's SEARCH route
// stopped returning anything while its READ route kept working. No error, no
// warning — the contract says in as many words that an empty result is not an
// error. So from inside the brain these two are byte-for-byte identical:
//
//   1. the mailbox genuinely holds nothing on this subject;
//   2. the search route is dead and will match nothing, ever, for any query.
//
// The brain reported the first. In a digest that surfaces as a section that is
// simply absent, or a line saying nothing was found — a reader sees a covered
// source with no news, where what happened is a source that was never read.
//
// ⚖️ WHAT IS NOT OURS, so this guard is not mistaken for one about an outage: the
// route belongs to a native connector this repo ships no code for, and the same
// tool answered normally the same day on another account. What is ours, and all
// this asserts, is that the brain PRESENTED AN UNREAD SOURCE AS A READ ONE.
//
// Why a doc guard and not a runtime check — the same argument as
// claim-discipline.test.mjs: what fails here is what the model is TOLD, the
// telling lives in four files that drift independently (the producer skill and
// the constitution, each in two locales), and no script in this repo can call an
// account-side connector to measure liveness for real.
// ═══════════════════════════════════════════════════════════════════════════

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (rel) => readFileSync(join(REPO_ROOT, rel), "utf8");

// ⚠️ Every multi-word pattern below matches ACROSS whitespace (`\s+`, never a literal
// space). These documents are hard-wrapped, so "same route" is one line break away from
// being "same\nroute" at any edit — and a guard that goes red because a paragraph
// re-wrapped is a guard that gets relaxed, then deleted. Measured here: the FR
// constitution's "sans mot-clé" wrapped between the two words on the first run.
const HEADING_EN = /^#+ Source liveness/m;
const HEADING_FR = /^#+ Vivacité des sources/m;

// The producer of every briefing, in both locales. The FR copy is a SEPARATE file
// that a French brain gets INSTEAD of the English one, so a rule added only to the
// EN side reaches no French user at all.
const SKILLS = [
  { name: "sync-sources", locale: "EN", path: ".claude/skills/sync-sources/SKILL.md" },
  { name: "sync-sources", locale: "FR", path: "templates/fr/.claude/skills/sync-sources/SKILL.md" },
];

// A constitution is the UNION of its two layers: the thin sacred file and the
// engine layer it @imports. Asserting on the union keeps this correct wherever the
// directive ends up sitting.
const CONSTITUTIONS = [
  { locale: "EN", layers: ["CLAUDE.md.template", "CLAUDE.engine.md"] },
  { locale: "FR", layers: ["templates/fr/CLAUDE.md.template", "templates/fr/CLAUDE.engine.md"] },
];

// ── The six load-bearing points, each named by the failure it prevents ──────
const RULES_EN = [
  {
    why: "the discriminator is a CONTROL query — one extra call whose emptiness is impossible on a live account",
    pattern: /control\s+quer/i,
  },
  {
    why: "the control goes through the SAME route that answered empty (in the report, the read route kept working while search was dead — testing the read route would have proved nothing)",
    pattern: /same\s+route/i,
  },
  {
    why: "the control carries NO search terms: a keyword is precisely what makes an honest zero possible",
    pattern: /keyword-free/i,
  },
  {
    why: "zero on the control means the source is DOWN, not empty",
    pattern: /\bdown\b/i,
  },
  {
    why: "a down source is an ALERT named in the reply and in the written artifact, never a silent omission",
    pattern: /never[\s\S]{0,40}silent|silently|alert/i,
  },
  {
    why: "a down source DISABLES the negative claims that depended on it",
    pattern: /negative\s+claim/i,
  },
  {
    why: "the verdict is re-established every pass, never inherited from a note",
    pattern: /never\s+(cached|inherited)|each\s+pass|every\s+pass/i,
  },
  {
    why: "the fan-out is paced — the report's trigger was a wide parallel pass with no throttle",
    pattern: /back off|back-off|throttl|pace/i,
  },
];

const RULES_FR = [
  { why: "le discriminant est une requête de CONTRÔLE", pattern: /requête\s+de\s+contrôle/i },
  { why: "le contrôle passe par la MÊME route que celle qui a répondu vide", pattern: /même\s+route/i },
  { why: "le contrôle ne porte AUCUN mot-clé", pattern: /sans\s+mot-clé|aucun\s+mot-clé/i },
  { why: "zéro au contrôle veut dire que la source est EN PANNE, pas vide", pattern: /en\s+panne/i },
  { why: "une source en panne est une alerte annoncée, jamais une omission silencieuse", pattern: /alerte|silencieuse/i },
  { why: "une source en panne interdit les affirmations négatives qui en dépendaient", pattern: /affirmations?\s+négatives?/i },
  { why: "le verdict est rétabli à chaque passe, jamais hérité d'une note", pattern: /chaque\s+passe|jamais\s+hérité/i },
  { why: "le fan-out est cadencé", pattern: /cadenc|throttl|ralent/i },
];

for (const { name, locale, path } of SKILLS) {
  const heading = locale === "FR" ? HEADING_FR : HEADING_EN;
  const rules = locale === "FR" ? RULES_FR : RULES_EN;
  test(`${locale} ${name} has a source-liveness section at all`, () => {
    assert.match(read(path), heading, `${path} must carry the discipline under its own heading`);
  });
  for (const { why, pattern } of rules) {
    test(`${locale} ${name} carries the source-liveness discipline: ${why}`, () => {
      assert.match(docSection(read(path), heading), pattern, `${path} lost the rule — ${why}`);
    });
  }
}

for (const { locale, layers } of CONSTITUTIONS) {
  const heading = locale === "FR" ? HEADING_FR : HEADING_EN;
  const rules = locale === "FR" ? RULES_FR : RULES_EN;
  test(`${locale} constitution has a source-liveness section at all`, () => {
    assert.match(layers.map(read).join("\n"), heading, "the discipline must have its own heading");
  });
  for (const { why, pattern } of rules) {
    test(`${locale} constitution carries the source-liveness discipline: ${why}`, () => {
      assert.match(docSection(layers.map(read).join("\n"), heading), pattern, `the ${locale} constitution lost the rule — ${why}`);
    });
  }
}

// ── The per-connector table: the design call, pinned so it cannot quietly go ──
// ── back to being a vague instruction to "check the source is alive".        ──
//
// A rule that says "run a control query" and names no control is a rule every
// session re-invents, differently. The table is the answer to "what IS the
// control for THIS connector", and every source the installer can wire must have
// a row — otherwise the one with no row is exactly the one that goes unchecked.
const SHIPPED_SEARCH_SOURCES_EN = ["Mail", "Chat", "Calendar", "Drive", "Notion"];
const SHIPPED_SEARCH_SOURCES_FR = ["Mail", "Chat", "Agenda", "Drive", "Notion"];

for (const { name, locale, path } of SKILLS) {
  const heading = locale === "FR" ? HEADING_FR : HEADING_EN;
  const sources = locale === "FR" ? SHIPPED_SEARCH_SOURCES_FR : SHIPPED_SEARCH_SOURCES_EN;
  test(`${locale} ${name} names a control for EVERY source the installer can wire`, () => {
    const section = docSection(read(path), heading);
    const missing = sources.filter((source) => !new RegExp(`\\|\\s*\\*{0,2}${source}`, "i").test(section));
    assert.deepEqual(missing, [], `no control query named for: ${missing.join(", ")} — that source is the one that goes unchecked`);
  });
}

// The escape hatch has to be written down, or the table becomes a reason to skip
// the check on anything it does not cover.
for (const { name, locale, path } of SKILLS) {
  const heading = locale === "FR" ? HEADING_FR : HEADING_EN;
  const pattern = locale === "FR" ? /plus faible|moins fiable/i : /weaker/i;
  test(`${locale} ${name} says what to do when a connector has NO keyword-free form`, () => {
    assert.match(
      docSection(read(path), heading),
      pattern,
      "a connector with no keyword-free search must get the broadest control expressible, declared as weaker — never skipped in silence",
    );
  });
}

// The claim-discipline section already grades WHAT was retrieved; nothing graded
// WHETHER retrieval happened. The two must point at each other, or a reader meets
// one and never learns the other exists.
for (const { name, locale, path } of SKILLS) {
  const heading = locale === "FR" ? HEADING_FR : HEADING_EN;
  const pattern = locale === "FR" ? /Discipline d'affirmation/ : /Claim discipline/;
  test(`${locale} ${name} ties source liveness back to the claim discipline`, () => {
    assert.match(docSection(read(path), heading), pattern, "the two disciplines must reference each other");
  });
}

// ── The rule has to live where the work happens, not only where it is explained ──
//
// A discipline stated in its own section is met by whoever reads that section. The
// fan-out step is a procedure someone follows with the section three screens above,
// already read and already forgotten — and the fan-out is precisely where the control
// query has to fire and where the pacing has to be applied. Same carrier argument as
// the claim discipline being asserted on the skills and not only on the constitutions.
const FANOUT_HEADING_EN = /^#+ Step 2 — Sub-agent fan-out/m;
const FANOUT_HEADING_FR = /^#+ Étape 2 — Fan-out des sous-agents/m;

for (const { name, locale, path } of SKILLS) {
  const heading = locale === "FR" ? FANOUT_HEADING_FR : FANOUT_HEADING_EN;
  const control = locale === "FR" ? /requête\s+de\s+contrôle/i : /control\s+quer/i;
  const pacing = locale === "FR" ? /cadenc|ralent/i : /back off|back-off|pace/i;
  test(`${locale} ${name} — the fan-out step itself says to run the control first`, () => {
    assert.match(docSection(read(path), heading), control, "the step that fires the searches must name the control");
  });
  test(`${locale} ${name} — the fan-out step itself says to pace and back off`, () => {
    assert.match(docSection(read(path), heading), pacing, "the pacing rule belongs at the wide parallel pass it is about");
  });
}
