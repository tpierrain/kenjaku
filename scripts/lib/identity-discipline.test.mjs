import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, sep } from "node:path";
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
  {
    // F6, F7's companion. `people/stephanie-music.md` was created "to resolve an
    // incoming link"; that name then occurred exactly once in the whole vault — in
    // its own title. A dangling link is a defect OF THE LINK, and creating its
    // target promotes a mis-resolution into the vault's answer to "who exists",
    // which is what the next resolution then resolves against.
    why: "a dangling [[people/…]] link is repaired at the source, never by creating the person it names",
    pattern: [/a link is not a person/i, /never create a `people\/`/i],
  },
  {
    // The homonymy block. Rule 1 is unusable when the vault's own answer is
    // three cards wide: the field brain held 3 Romain, 3 Marie, 2 Karim, 2
    // Caroline and 2 Michael. A card that does not say which one does not
    // resolve anything — it moves the ambiguity one hop, into the vault.
    //
    // Two sides, and the second is what makes the first usable: the card SAYS
    // what tells this person apart (the builder refuses the write otherwise),
    // and at read time a bare first name matching several cards is UNRESOLVED,
    // never resolved to the nearest one.
    why: "a person card says WHICH one (the `distinguish` block), and a first name matching several cards stays unresolved",
    pattern: [/say which one/i, /distinguish/, /unresolved/i],
  },
  {
    // "Conformant ≠ true." The builder hands every card the same clean
    // frontmatter and the same green lint, so nothing on the page tells a
    // resolution read off an org chart from one inferred out of a nickname —
    // and the vault reads both as its own answer to who exists, forever.
    //
    // The scale is the claim discipline's, deliberately: v4.5.0 shipped
    // ✅ observed / 🟡 derived or probable / 🔴 unverified, and a second
    // vocabulary here would be a second discipline. The pattern pins the middle
    // marker's exact words for that reason.
    //
    // The read half is what makes the block worth writing: a marked card is a
    // lead, not the vault's answer, so it is re-verified rather than inherited.
    why: "a person card says HOW SURE its identity is, in the claim discipline's own scale, and a marked card is re-verified rather than inherited",
    pattern: [/say how sure you are/i, /🟡 derived or probable/, /re-verify/i],
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
  {
    why: "un lien `[[people/…]]` cassé se répare à la source, jamais en créant la personne qu'il nomme",
    pattern: [/un lien n'est pas une personne/i, /ne crée jamais une fiche `people\/`/i],
  },
  {
    why: "une fiche dit DE QUI il s'agit (le bloc `distinguish`), et un prénom qui correspond à plusieurs fiches reste non résolu",
    pattern: [/dis de qui il s'agit/i, /distinguish/, /non résolu/i],
  },
  {
    why: "une fiche dit À QUEL POINT son identité est sûre, dans l'échelle de la discipline de revendication, et une fiche marquée se revérifie au lieu de s'hériter",
    pattern: [/dis à quel point c'est sûr/i, /🟡 déduit ou probable/, /revérifie/i],
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

// ── F6's own carrier: the repair gesture that MANUFACTURED the fabrication ──
// The discipline above states the rule; `/lint` is where the gesture is actually
// OFFERED, and it offered exactly the wrong one: "Dangling → fix the target
// spelling, or CREATE THE MISSING NOTE, or remove the dead link", with no carve-out
// for a person. Applied to a mis-resolved `[[people/…]]`, that bullet IS how
// `people/stephanie-music.md` came to exist — a name occurring once in the whole
// vault, in its own title, that every later resolution would have resolved against.
//
// Creating the missing note stays right for a TOPIC the vault meant to hold, so the
// assertion is not "the gesture is gone" but "the gesture excludes people". And the
// reason is not restated here: `/lint` POINTS at the producer's section, the same way
// prepare-1-1 does, because two paraphrases of one discipline are two disciplines.
// The relative path holds on a deployed brain: both skills are installed siblings
// under `.claude/skills/`.
const LINT = "engine-skills/lint/SKILL.md";
const LINT_FIXES = /^#+ 3\. Propose fixes/m;

test("the lint skill never offers to create a person to satisfy a dangling link", () => {
  const section = docSection(read(LINT), LINT_FIXES);
  assert.notEqual(section, "", "the propose-fixes section must still exist");
  assert.match(
    section,
    /never.*\[\[people\//is,
    "the create-the-missing-note gesture must exclude a person target, or it repeats F6 verbatim",
  );
  assert.match(
    section,
    IDENTITY_ANCHOR_EN,
    "the carve-out must send the reader to the producer's identity SECTION, not carry its own wording",
  );
});

// ── The OTHER door onto a fabricated person: `/consolidate` ────────────────
// `/lint` was the door F6 was found at; this is the one it hands off to. The scan
// proposes "an entity/PERSON [[mentioned]] in captures but with no page yet", ranked
// by how many captures cite it — and a fabricated `[[people/jeremy-hinard]]` that
// F7 wrote into three captures reads as signal, not as a defect. Mention count
// measures how often a link was written, never whether the person exists.
//
// This is not a duplicate of the `/lint` carve-out: creating the page IS this
// skill's purpose, so the rule here is that a PERSON candidate gets resolved before
// it is written, not that the gesture is refused. Same anchor, for the same reason.
const CONSOLIDATE = "engine-skills/consolidate/SKILL.md";
const CONSOLIDATE_BOUND = /^#+ 2\. Bound the batch/m;

test("consolidate resolves a person candidate instead of trusting the mention count", () => {
  const section = docSection(read(CONSOLIDATE), CONSOLIDATE_BOUND);
  assert.notEqual(section, "", "the bound-the-batch section must still exist");
  assert.match(
    section,
    /count[^.\n]*not[^.\n]*(evidence|proof)/i,
    "the skill must say what the count does NOT establish, or a fabricated name reads as signal",
  );
  assert.match(
    section,
    IDENTITY_ANCHOR_EN,
    "a person candidate must be sent to the producer's identity SECTION before a page is written",
  );
});

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

// Every skill that hands a fenced prompt to a sub-agent is a carrier of this
// trap, and the list below must be DERIVED from the repo rather than kept by
// hand: `engine-skills/consolidate` spawned sub-agents from the day it shipped,
// carried the banned phrasing verbatim, and this guard iterated `SKILLS` — four
// files that never included it. The rule read green for a release while the
// other write-door still ordered the invention.
const PROMPT_CARRIERS = [
  ...SKILLS,
  { name: "consolidate", locale: "EN", path: CONSOLIDATE },
];

const SKILL_ROOTS = [".claude/skills", "templates/fr/.claude/skills", "engine-skills"];
const SPAWNS_SUBAGENTS = /^\s*prompt="""/m;

const skillFilesUnder = (root) =>
  readdirSync(join(REPO_ROOT, root), { recursive: true, encoding: "utf8" })
    .filter((rel) => rel.endsWith("SKILL.md"))
    .map((rel) => `${root}/${rel.split(sep).join("/")}`);

test("every skill that spawns sub-agents is covered by the prompt-text guard", () => {
  const carriers = SKILL_ROOTS.flatMap(skillFilesUnder).filter((path) =>
    SPAWNS_SUBAGENTS.test(read(path)),
  );
  assert.ok(carriers.length > 0, "the discovery itself must find something, or this guard proves nothing");
  const uncovered = carriers.filter((path) => !PROMPT_CARRIERS.some((c) => c.path === path));
  assert.deepEqual(
    uncovered,
    [],
    "a skill handing a prompt to a sub-agent and unlisted here is exactly how the wording that manufactured the invention survived a release",
  );
});

for (const { name, locale, path } of PROMPT_CARRIERS) {
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

// ── The two doors that WRITE a person card must name the field ──────────────
// The rule above is stated in the producer's discipline; these two skills are
// where a `people/` card is actually created, and they both write through the
// same builder — which now REFUSES a person whose first name the vault already
// holds until the spec says which one. A skill that documents the builder's exit
// codes without that one leaves the writer reading a refusal it never mentioned,
// and the likeliest repair is to drop the card or invent a surname (F7 again).
//
// Same shape as `/lint` and `/consolidate` under F6: name the field, then POINT
// at the producer's section. Two paraphrases of one discipline are two
// disciplines.
const WRITE_DOORS = [
  { name: "file-back", path: "engine-skills/file-back/SKILL.md" },
  { name: "consolidate", path: "engine-skills/consolidate/SKILL.md" },
];

for (const { name, path } of WRITE_DOORS) {
  test(`${name} tells the writer about the homonymy block the builder demands`, () => {
    const text = read(path);
    assert.match(
      text,
      /distinguish/,
      "the skill drives the builder — a refusal it never mentions reads as a bug in the tool",
    );
    assert.match(
      text,
      IDENTITY_ANCHOR_EN,
      "the reason belongs to the producer's identity SECTION, not to a second wording here",
    );
  });
}
