import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { docSection } from "./doc-section.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// F7 — the brain writes ABOUT people into the vault without ever reading what
// the vault already says about them.
//
// Two field failures, on two machines, one evening apart:
//   • a source said "Jérémy (front Candor)" — a bare first name — and the note
//     asserted "Jérémy Hinard", a surname that exists nowhere but in that note;
//   • a 1-1 prep wrote "Hossam, who would become CTO Visma France (unconfirmed)"
//     while the vault's own people/hossam-laanait.md said "CTO Visma France
//     (confirmed 04/06)" — a dated record downgraded into a rumour.
//
// The second one is why this is a doc guard and not a note fixer: correcting the
// note does NOT stop it. The vault carried the right answer to both laptops and
// the skill read neither, so it fires again at the next briefing, and the next.
//
// And the invention was not the model being creative — the skill ORDERED it. Its
// "People registry" section said, in the same breath, "never a first name alone,
// [[people/jane]] is forbidden" AND "create the backlinks even if the target page
// doesn't exist". Handed a bare first name, an agent obeying both has exactly two
// exits: drop the link, or invent a surname. So the fix repairs a rule the engine
// ships — which is also why it must land here and never brain-side (patching a
// skill inside a brain freezes it against every future engine fix, F5).
//
// Same carrier and same shape as the claim discipline (F18): the producer
// `sync-sources`, its consumer `prepare-1-1`, EN and FR, plus both constitutions.
// ═══════════════════════════════════════════════════════════════════════════

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (rel) => readFileSync(join(REPO_ROOT, rel), "utf8");

const HEADING_EN = /^#+ Identity discipline/m;
const HEADING_FR = /^#+ Discipline d'identité/m;

const SKILLS = [
  { name: "sync-sources", locale: "EN", path: ".claude/skills/sync-sources/SKILL.md" },
  { name: "prepare-1-1", locale: "EN", path: ".claude/skills/prepare-1-1/SKILL.md" },
  { name: "sync-sources", locale: "FR", path: "templates/fr/.claude/skills/sync-sources/SKILL.md" },
  { name: "prepare-1-1", locale: "FR", path: "templates/fr/.claude/skills/prepare-1-1/SKILL.md" },
];

// ── The rules, each naming the field failure it prevents ───────────────────
const RULES_EN = [
  {
    why: "resolve against the vault's own people cards BEFORE writing a person into a note",
    pattern: /Resolve before you write/i,
  },
  {
    why: 'a bare first name stays plain text — never a [[people/…]] link, never a surname you supplied ("Jérémy" → "Jérémy Hinard")',
    pattern: /never invent the missing half/i,
  },
  {
    why: 'nothing is "new" until the vault has been asked — and the check must be NAMED, not implied (tier 3 of the claim discipline)',
    pattern: [/before you call anything new/i, /search_vault/],
  },
];

const RULES_FR = [
  {
    why: "résoudre contre les fiches du vault AVANT d'écrire une personne dans une note",
    pattern: /Résous avant d'écrire/i,
  },
  {
    why: "un prénom seul reste du texte, jamais un lien, jamais un nom de famille fourni par le modèle",
    pattern: /n'invente jamais la moitié manquante/i,
  },
  {
    why: "rien n'est « nouveau » tant que le vault n'a pas été interrogé — et la vérification doit être NOMMÉE",
    pattern: [/avant de qualifier quoi que ce soit de nouveau/i, /search_vault/],
  },
];

for (const { name, locale, path } of SKILLS.filter((s) => s.name === "sync-sources")) {
  const heading = locale === "FR" ? HEADING_FR : HEADING_EN;
  const rules = locale === "FR" ? RULES_FR : RULES_EN;
  test(`${locale} ${name} has an identity-discipline section at all`, () => {
    assert.match(read(path), heading, `${path} must carry the discipline under its own heading`);
  });
  for (const { why, pattern } of rules) {
    test(`${locale} ${name} carries the identity discipline: ${why}`, () => {
      const section = docSection(read(path), heading);
      for (const one of [pattern].flat()) {
        assert.match(section, one, `${path} lost the rule — ${why}`);
      }
    });
  }
}

// ── The constitutions carry it too — same words, deliberately ──────────────
// The two skills are the operative carriers; the constitution is what a brain
// reads when no skill is loaded, which is most of the time. It is asserted
// against the SAME patterns as the skills on purpose: two paraphrases of one
// discipline are two disciplines (the rule the claim guard already enforces).
//
// Reach caveat, unchanged since F18 and NOT a reason to skip this: the skills
// are in the manifest's `merge` regime and do reach deployed brains, while
// `CLAUDE.engine.md` is in no regime and reaches new installs only. So the
// constitution is worth writing and must never be the only carrier — which is
// why the skill assertions above exist and come first.
const CONSTITUTIONS = [
  { locale: "EN", layers: ["CLAUDE.md.template", "CLAUDE.engine.md"] },
  { locale: "FR", layers: ["templates/fr/CLAUDE.md.template", "templates/fr/CLAUDE.engine.md"] },
];

for (const { locale, layers } of CONSTITUTIONS) {
  const heading = locale === "FR" ? HEADING_FR : HEADING_EN;
  const rules = locale === "FR" ? RULES_FR : RULES_EN;
  const constitution = () => layers.map(read).join("\n");
  test(`${locale} constitution has an identity-discipline section at all`, () => {
    assert.match(constitution(), heading, "the discipline must have its own heading");
  });
  for (const { why, pattern } of rules) {
    test(`${locale} constitution carries the identity discipline: ${why}`, () => {
      const section = docSection(constitution(), heading);
      for (const one of [pattern].flat()) {
        assert.match(section, one, `the ${locale} constitution lost the rule — ${why}`);
      }
    });
  }
}

// ── The rule that MANUFACTURED the defect must be gone, not merely balanced ──
// "People registry" ordered two things that cannot both hold when a source gives
// only a first name: `[[people/jane]]` is FORBIDDEN, and create the backlink even
// with no target page. The agent obeyed both by inventing the surname. Adding the
// identity discipline while leaving that section intact would leave the two
// instructions fighting inside one file, which is how the field defect was born.
const REGISTRY_EN = /^#+ People registry/m;
const REGISTRY_FR = /^#+ Référentiel de personnes/m;

for (const { locale, path } of SKILLS.filter((s) => s.name === "sync-sources")) {
  const registry = locale === "FR" ? REGISTRY_FR : REGISTRY_EN;
  test(`${locale} the people registry no longer orders a link a bare first name cannot satisfy`, () => {
    const section = docSection(read(path), registry);
    assert.notEqual(section, "", "the registry section must still exist");
    assert.doesNotMatch(
      section,
      locale === "FR" ? /interdit/i : /forbidden/i,
      "an absolute ban on a bare-first-name link is what left inventing a surname as the only exit",
    );
    assert.match(
      section,
      locale === "FR" ? /Discipline d'identité/ : /Identity discipline/,
      "the registry must send the reader to the discipline that says what to do with an unresolved name",
    );
  });
}

// ── The novelty check must sit in the OPERATIVE step, not only in the prose ──
// The sub-agents never see the vault — they read external sources. "This is new"
// is asserted in the main context, at the synthesis, which is also the only place
// holding both the delta and the ability to run a `search_vault`. A rule stated in
// the discipline section but absent from the reconcile passes is a rule nothing
// executes: that is how a two-month-old fact was republished as a scoop.
const SYNTHESIS_EN = /^#+ Step 3 — Synthesis/m;
const SYNTHESIS_FR = /^#+ Étape 3 — Synthèse/m;

for (const { locale, path } of SKILLS.filter((s) => s.name === "sync-sources")) {
  test(`${locale} the synthesis step runs the novelty check, and counts its own passes`, () => {
    const section = docSection(read(path), locale === "FR" ? SYNTHESIS_FR : SYNTHESIS_EN);
    assert.match(section, /search_vault/, "the reconcile must name the check, not imply it");
    assert.match(
      section,
      locale === "FR" ? /^3\. \*\*/m : /^3\. \*\*/m,
      "the novelty check must be a numbered pass like the other two, not a footnote",
    );
    assert.doesNotMatch(
      section,
      locale === "FR" ? /Deux passes/i : /Two passes/i,
      "the intro still promises two passes while three are listed — the third reads as optional",
    );
  });
}

// ── The consumer POINTS, it does not paraphrase ────────────────────────────
// F7's own lesson applied to the skills themselves: the control belongs where
// the facts are produced. `prepare-1-1` consumes the `sync-sources` fan-out, and
// it was already carrying its own wording of the producer's rules ("the vault
// outranks the delta…", "a bare first name stays a bare first name") — true
// today, and free to drift tomorrow. Two paraphrases are two disciplines.
//
// Anchored at the SECTION, never merely at the file: prepare-1-1 has linked
// `../sync-sources/SKILL.md` for the fan-out architecture since long before any
// of this, so a bare file link would go green on prose that predates the fix.
const IDENTITY_ANCHOR_EN = /sync-sources\/SKILL\.md#identity-discipline/;
const IDENTITY_ANCHOR_FR = /sync-sources\/SKILL\.md#discipline-didentit/;

for (const { locale, path } of SKILLS.filter((s) => s.name === "prepare-1-1")) {
  const heading = locale === "FR" ? HEADING_FR : HEADING_EN;
  test(`${locale} prepare-1-1 defers to the producer's identity section instead of restating it`, () => {
    const text = read(path);
    assert.match(text, heading, "the consumer must name the discipline it obeys, under its own heading");
    assert.match(
      docSection(text, heading),
      locale === "FR" ? IDENTITY_ANCHOR_FR : IDENTITY_ANCHOR_EN,
      "the pointer must reach the producer's identity SECTION, so the two cannot drift into two rules",
    );
  });
}

// ── The same trap, in the OPERATIVE text: the sub-agent prompts ─────────────
// The prose sections are read by a human maintainer; these bullets are handed to
// the extraction sub-agents verbatim, and they still carried the pair that has no
// exit — "create the backlinks even if the target page doesn't exist" NEXT TO
// "never a first name alone". Read together by an agent holding "Jérémy (front
// Candor)", the only way to obey both is to produce a surname.
//
// The phrasing must therefore say what to DO (no full name → no link at all),
// never merely what is forbidden. Asserted file-wide on purpose: these bullets sit
// inside fenced prompt blocks, and a rule that moved into another prompt would
// still be handed to an agent.
const LINKLESS_EN = /no full name[^.\n]*no link/i;
const LINKLESS_FR = /pas de nom complet[^.\n]*pas de lien/i;

for (const { name, locale, path } of SKILLS) {
  test(`${locale} ${name}: an unresolved first name yields NO link, and the old ban is gone`, () => {
    const text = read(path);
    assert.doesNotMatch(
      text,
      locale === "FR" ? /jamais de prénom seul/i : /never a first name alone/i,
      "that phrasing bans the link while the neighbouring bullet still demands one — inventing the surname is the only way out",
    );
    assert.match(
      text,
      locale === "FR" ? LINKLESS_FR : LINKLESS_EN,
      "the prompt must state the action (no full name → no link at all), not only the ban",
    );
  });
}
