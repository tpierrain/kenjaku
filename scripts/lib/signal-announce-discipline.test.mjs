import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { docSection } from "./doc-section.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// Announce before acting on a SIGNAL — issue #61, doctrine cargo of v5.0.0.
//
// The field defect (engine v4.9.0): ending a session in plain words ("I want to
// clear") triggers the passive-observation ritual — scan the session for
// frictions, read the harness backlog, write the findings, print the summary.
// It ran SILENTLY and answered only once done: several seconds of unexplained
// pause at exactly the moment an immediate answer was expected. The work was
// useful; the silence was not.
//
// 🧭 It is an INTERNAL INCONSISTENCY, not a missing feature, which is why the
// fix adds no new concept: the engine already required exactly this one section
// earlier, for the background source sync ("you simply ANNOUNCE it in one line",
// and never ask permission for it). The end-of-session ritual was written
// without that clause. So the rule is stated ONCE, generally, and its two
// instances point at it — the reflex claim-discipline.test.mjs enforces for
// prepare-1-1: two paraphrases are two disciplines.
//
// Deliberately NOT a hook, in the reporter's own words: a hook cannot write the
// sentence. This is a writing convention, and a doc guard is what holds it.
//
// Reach: `CLAUDE.engine.md` is a `merge`-regime file since this release, so both
// locales must move together (locale-drift) and the fingerprint table must be
// regenerated in the same commit, or a brain holding these bytes stays frozen.
// ═══════════════════════════════════════════════════════════════════════════

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (rel) => readFileSync(join(REPO_ROOT, rel), "utf8");

const HEADING_EN = /^#+ Announce before acting on a signal/m;
const HEADING_FR = /^#+ Annonce avant d'agir sur un signal/m;

// The section that carried the defect, in each locale — the rule has to be
// legible from THERE, not only from the general section 150 lines above.
const RITUAL_EN = /^#+ Passive observation/m;
const RITUAL_FR = /^#+ Observation passive/m;

// A constitution is the UNION of its two layers: the thin sacred file and the
// engine layer it @imports. The union is also the READING ORDER, which the
// placement test depends on.
const CONSTITUTIONS = [
  { locale: "EN", layers: ["CLAUDE.md.template", "CLAUDE.engine.md"] },
  { locale: "FR", layers: ["templates/fr/CLAUDE.md.template", "templates/fr/CLAUDE.engine.md"] },
];

// ── The rules, each with the failure it prevents ───────────────────────────
const RULES_EN = [
  {
    why: "the action is ANNOUNCED, which is the whole of the fix",
    pattern: /announce/i,
  },
  {
    why: "the announcement comes BEFORE the work, not with the result — after the fact it is an apology",
    pattern: /before/i,
  },
  {
    why: "what triggers it is a SIGNAL from the user, not an explicit request — that distinction is the rule's scope",
    pattern: /signal/i,
  },
  {
    why: "announcing is NOT asking: permission is never requested for something that should run on its own",
    pattern: /permission/i,
  },
  {
    why: "the cost is named, so the rule is not read as politeness — the user sees SILENCE where an answer was expected",
    pattern: /silence/i,
  },
  {
    why: "the end-of-session ritual is named as an instance, so the rule is not abstract",
    pattern: /end of session/i,
  },
  {
    why: "the background source sync is named as the instance the engine ALREADY had right",
    pattern: /sync/i,
  },
];

const RULES_FR = [
  { why: "l'action est ANNONCÉE, et c'est tout le correctif", pattern: /annonc/i },
  {
    why: "l'annonce vient AVANT le travail, pas avec le résultat : après coup, c'est une excuse",
    pattern: /avant/i,
  },
  {
    why: "le déclencheur est un SIGNAL, pas une demande explicite, et cette distinction est la portée de la règle",
    pattern: /signal/i,
  },
  { why: "annoncer n'est pas demander : jamais de demande de permission", pattern: /permission/i },
  {
    why: "le coût est nommé, pour que la règle ne se lise pas comme de la politesse : un SILENCE là où une réponse était attendue",
    pattern: /silence/i,
  },
  { why: "le rituel de fin de session est nommé comme instance, pour que la règle ne soit pas abstraite", pattern: /fin de session/i },
  { why: "le sync de sources en tâche de fond est nommé comme l'instance que le moteur tenait DÉJÀ", pattern: /sync/i },
];

for (const { locale, layers } of CONSTITUTIONS) {
  const heading = locale === "FR" ? HEADING_FR : HEADING_EN;
  const rules = locale === "FR" ? RULES_FR : RULES_EN;

  test(`${locale} constitution has a signal-announce section at all`, () => {
    assert.match(layers.map(read).join("\n"), heading, "the rule must have its own heading");
  });

  for (const { why, pattern } of rules) {
    test(`${locale} constitution carries the signal-announce rule: ${why}`, () => {
      const section = docSection(layers.map(read).join("\n"), heading);
      assert.match(section, pattern, `the ${locale} constitution lost the rule — ${why}`);
    });
  }
}

// ── The section that carried the defect must carry the rule ────────────────
// The general rule sitting 150 lines above is not enough: what failed in the
// field is someone reading the ritual and running it. So the ritual's own block
// says the sentence out loud, and POINTS at the general rule rather than
// restating it — two paraphrases are two disciplines.
for (const { locale, layers } of CONSTITUTIONS) {
  test(`${locale} constitution: the end-of-session ritual itself announces, and defers to the general rule`, () => {
    const text = layers.map(read).join("\n");
    const ritual = docSection(text, locale === "FR" ? RITUAL_FR : RITUAL_EN);
    assert.notEqual(ritual, "", "the passive-observation ritual must still be there");
    assert.match(
      ritual,
      locale === "FR" ? /annonc/i : /announce/i,
      "the ritual that ran silently must be the one place a reader cannot miss the rule",
    );
    assert.match(
      ritual,
      locale === "FR" ? /Annonce avant d'agir sur un signal/ : /Announce before acting on a signal/,
      "the ritual must POINT at the general rule instead of paraphrasing it into a second one",
    );
  });
}

// ── A general rule read after its instances is read too late ───────────────
// Same reflex as the source-first placement guard: the rule governs both the
// main flow's sync and the end-of-session ritual, so it is stated before both.
for (const { locale, layers } of CONSTITUTIONS) {
  test(`${locale} constitution: the general rule is stated ABOVE both of its instances`, () => {
    const text = layers.map(read).join("\n");
    const at = text.search(locale === "FR" ? HEADING_FR : HEADING_EN);
    const flow = text.search(locale === "FR" ? /^#+ Flux principal/m : /^#+ Main flow/m);
    const ritual = text.search(locale === "FR" ? RITUAL_FR : RITUAL_EN);
    assert.notEqual(at, -1, "the general rule must be there at the start of a line");
    assert.equal(flow > -1 && ritual > -1, true, "both instances must still be there to be placed against");
    assert.equal(at < flow && at < ritual, true, "a general rule read after its instances is read too late");
  });
}
