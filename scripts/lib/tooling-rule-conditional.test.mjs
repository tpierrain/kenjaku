import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { docSection } from "./doc-section.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// The Outillage / Tooling rule must be CONDITIONAL and SELF-DESCRIBING —
// issue #67, doctrine cargo of v5.0.0.
//
// The field defect (mind-palace, engine v4.9.0, session of 2026-08-12 in AUTO
// permission mode): the rule ruled out Bash for probing the vault, on a rationale
// true of ONE surface in ONE permission mode — "each Bash command re-triggers a
// permission prompt in Claude Desktop" — but was WRITTEN AS AN ABSOLUTE. In that
// session the native `Grep` was not even available (the harness itself said to
// fall back to Bash), several Bash commands ran including a composed `cd … &&
// grep -rn …` the rule calls "refused outright", and NOT ONE prompt appeared.
//
// 🚨 What that cost, and it is worse than a wrong sentence: the assistant read
// its own constitution as self-contradictory, and filed a friction item asking
// the OWNER to arbitrate it. That arbitration was never theirs — the rule lives
// in the engine layer, which the constitution explicitly tells owners not to
// edit. Net result: engine-induced noise in a user's harness backlog, and a
// wasted round trip. A rule that states a local constraint as universal does not
// merely misinform; it manufactures work for the person it was meant to serve.
//
// The second half of the fix is a separation, not a rule: TWO tables read as one.
// - Routing (§ Vault) is about CORRECTNESS and holds in every environment.
// - Tooling is about ERGONOMICS — native vs Bash, purely to avoid prompts — and
//   is environment-dependent.
// Reading Tooling's `❌ grep` cell as "never run an exact search" is a natural
// misreading, and it collides head-on with Routing, which mandates exactly that.
// It also has teeth: an ABSENCE claim can only rest on an exhaustive exact
// search — a top-N by similarity can never prove a negative — which is the
// failure mode the claim discipline already records.
//
// Reach: `CLAUDE.engine.md` is a `merge`-regime file since this release, so both
// locales move together and the fingerprint table is regenerated in the same
// commit, or a brain holding these bytes stays frozen on them.
// ═══════════════════════════════════════════════════════════════════════════

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (rel) => readFileSync(join(REPO_ROOT, rel), "utf8");

const HEADING_EN = /^#+ Tooling — prefer the native tools/m;
const HEADING_FR = /^#+ Outillage — préfère les outils natifs/m;

const CONSTITUTIONS = [
  { locale: "EN", layers: ["CLAUDE.md.template", "CLAUDE.engine.md"] },
  { locale: "FR", layers: ["templates/fr/CLAUDE.md.template", "templates/fr/CLAUDE.engine.md"] },
];

// ── The rules, each with the failure it prevents ───────────────────────────
const RULES_EN = [
  {
    why: "the rule names the SURFACE its rationale comes from, instead of stating it universally",
    pattern: /Claude Desktop/,
  },
  {
    why: "it names the PERMISSION MODE it assumes — the premise that was false in the field session",
    pattern: /permission mode/i,
  },
  {
    why: "the fallback is stated: when the native tool is UNAVAILABLE, the Bash equivalent is the right move",
    pattern: /unavailable/i,
  },
  {
    why: "and that fallback is EXPECTED behaviour — the sentence that stops a brain filing a friction item about its own engine",
    pattern: /expected/i,
  },
  {
    why: "it says NOT to report it as a defect, because that report costs the owner an arbitration that is not theirs",
    pattern: /not a defect|nothing to report|do not report/i,
  },
  {
    why: "the two tables are separated by NAME: this one is about ergonomics",
    pattern: /ergonomic/i,
  },
  {
    why: "…and the routing table is about correctness, which holds in every environment",
    pattern: /correctness/i,
  },
  {
    why: "it POINTS at the routing table rather than paraphrasing it into a second rule",
    pattern: /Routing/,
  },
  {
    why: "the teeth: an absence claim needs an exhaustive exact search — a top-N by similarity cannot prove a negative",
    pattern: /prove a negative/i,
  },
];

const RULES_FR = [
  {
    why: "la règle nomme la SURFACE d'où vient sa justification, au lieu de l'énoncer universellement",
    pattern: /Claude Desktop/,
  },
  {
    why: "elle nomme le MODE DE PERMISSION qu'elle suppose, la prémisse qui était fausse sur le terrain",
    pattern: /mode de permission/i,
  },
  {
    why: "le repli est énoncé : quand l'outil natif est INDISPONIBLE, l'équivalent Bash est le bon geste",
    pattern: /indisponible/i,
  },
  {
    why: "et ce repli est un comportement ATTENDU, la phrase qui évite qu'un cerveau ouvre une friction sur son propre moteur",
    pattern: /attendu/i,
  },
  {
    why: "elle dit de ne PAS le remonter comme un défaut, car ça coûte un arbitrage qui n'appartient pas à la personne",
    pattern: /pas un défaut|rien à remonter|ne le remonte pas/i,
  },
  { why: "les deux tables sont séparées par leur NOM : celle-ci parle d'ergonomie", pattern: /ergonomi/i },
  { why: "…et la table de routage parle de justesse, vraie dans tout environnement", pattern: /justesse/i },
  { why: "elle POINTE vers la table de routage au lieu de la paraphraser en seconde règle", pattern: /Routage/ },
  {
    why: "les dents : une affirmation d'absence exige une recherche exacte exhaustive, un top-N par similarité ne prouve aucun négatif",
    pattern: /prouver un négatif/i,
  },
];

for (const { locale, layers } of CONSTITUTIONS) {
  const heading = locale === "FR" ? HEADING_FR : HEADING_EN;
  const rules = locale === "FR" ? RULES_FR : RULES_EN;

  test(`${locale} constitution has a tooling section under a conditional heading`, () => {
    assert.match(layers.map(read).join("\n"), heading, "the tooling rule must keep its own heading");
  });

  for (const { why, pattern } of rules) {
    test(`${locale} constitution — the tooling rule is conditional: ${why}`, () => {
      const section = docSection(layers.map(read).join("\n"), heading);
      assert.match(section, pattern, `the ${locale} tooling rule lost it — ${why}`);
    });
  }
}

// ── The absolute must be gone from the TITLE, not only softened in the body ──
// The heading is what a scanning reader carries away, and it read
// "NEVER Bash to probe the vault" — the very absolute the field session
// collided with. A body that qualifies a title nobody re-reads has fixed
// nothing.
for (const { locale, layers } of CONSTITUTIONS) {
  test(`${locale} constitution: the tooling HEADING no longer states an absolute`, () => {
    const text = layers.map(read).join("\n");
    const heading = locale === "FR" ? HEADING_FR : HEADING_EN;
    const at = text.search(heading);
    assert.notEqual(at, -1, "the tooling heading must be there");
    const line = text.slice(at, text.indexOf("\n", at));
    assert.doesNotMatch(
      line,
      locale === "FR" ? /JAMAIS/ : /NEVER/,
      "an absolute in the title survives every qualification in the body",
    );
  });
}
