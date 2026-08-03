import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { docSection } from "./doc-section.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// F18 — the claim discipline must exist on EVERY surface that produces an
// assertion about a colleague, and it must say the same thing on each.
//
// The finding (postmortem written by a real brain after two consecutive failing
// sessions, 2026-08-02 and 2026-08-03): the dangerous output is not the fact the
// brain invents, it is the SILENCE it reports. A search index is relevance-ranked,
// never state-complete, so "no reply", "nobody decided", "still not started" are
// properties of the query, not of the world — and they are ACCUSATIONS about
// named people, one paste away from a team channel.
//
// Why a doc guard and not a runtime check: what fails here is what the model is
// told, and the telling lives in four files that drift independently — two skills
// (the producer `sync-sources` and its consumer `prepare-1-1`) and two
// constitutions (EN + FR). The FR layer has drifted before, which is why the
// parity assertion exists at all (see constitution-mirror-citations.test.mjs).
//
// Reach, recorded here because it decided the carrier: the two skills are in the
// `merge` regime and DO reach a deployed brain, while CLAUDE.engine.md is in no
// regime at all (propagation deferred to Gate 3, locked by engine-apply-plan.test.mjs).
// So the constitution half is worth writing but must never be the only carrier —
// hence the skills are asserted just as strictly as the constitutions.
// ═══════════════════════════════════════════════════════════════════════════

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (rel) => readFileSync(join(REPO_ROOT, rel), "utf8");

// The discipline SECTION of a document, sliced from its heading to the next
// heading of the same or a higher level — asserted inside that slice only, for
// the reasons written in doc-section.mjs (the identity guard shares it).
const disciplineSection = docSection;

const HEADING_EN = /^#+ Claim discipline/m;
const HEADING_FR = /^#+ Discipline d'affirmation/m;

// The producer of every briefing, and the consumer that re-uses its fan-out —
// in BOTH locales. The FR copies under `templates/fr/.claude/skills/` are a
// separate set of files that a FR brain gets instead of the EN ones, so a rule
// added only to the EN pair reaches no French user at all. That near-miss is
// why they are enumerated here rather than assumed: a first pass of this fix
// listed only the EN two, because `.claude` is hidden and did not show up in a
// directory listing of `templates/fr`.
const SKILLS = [
  { name: "sync-sources", locale: "EN", path: ".claude/skills/sync-sources/SKILL.md" },
  { name: "prepare-1-1", locale: "EN", path: ".claude/skills/prepare-1-1/SKILL.md" },
  { name: "sync-sources", locale: "FR", path: "templates/fr/.claude/skills/sync-sources/SKILL.md" },
  { name: "prepare-1-1", locale: "FR", path: "templates/fr/.claude/skills/prepare-1-1/SKILL.md" },
];

// A constitution is the UNION of its two layers: the thin sacred file and the
// engine layer it @imports. Asserting on the union keeps the test correct
// wherever the directive ends up sitting.
const CONSTITUTIONS = [
  { locale: "EN", layers: ["CLAUDE.md.template", "CLAUDE.engine.md"] },
  { locale: "FR", layers: ["templates/fr/CLAUDE.md.template", "templates/fr/CLAUDE.engine.md"] },
];

// ── The five rules, each with the failure it prevents ──────────────────────
// Every entry names a REAL defect from the field, so a future reader can tell
// what the pattern is for rather than deleting it as boilerplate.
const RULES_EN = [
  {
    why: 'the phrasing flip — "I did not find X", never "there is no X"',
    pattern: /I did not find/i,
  },
  {
    why: "a negative or behavioural claim must name its check, or be reworded as an open question",
    pattern: /open question/i,
  },
  {
    why: 'thread resolution — a root message is the moment a question was ASKED ("no reply since Thursday" on a thread that had 12 replies that day)',
    pattern: /thread/i,
  },
  {
    why: 'a reply count above zero is a HARD BLOCK on "unanswered / pending / unresolved" wording',
    pattern: /repl(y|ies)/i,
  },
  {
    why: "reconcile the retrieved set BEFORE writing (the worst defect had its own refutation inside the same tool response)",
    pattern: /contradict/i,
  },
];

const RULES_FR = [
  { why: 'la bascule de formulation — « je n\'ai pas trouvé », jamais « il n\'y a pas »', pattern: /pas trouvé/i },
  { why: "une affirmation négative ou comportementale nomme sa vérification, ou devient une question ouverte", pattern: /question ouverte/i },
  { why: "la résolution du thread avant de citer un message comme un état courant", pattern: /thread/i },
  { why: "un nombre de réponses non nul bloque toute formulation « sans réponse / en attente »", pattern: /réponses/i },
  { why: "la passe de réconciliation avant d'écrire", pattern: /contredit/i },
];

for (const { name, locale, path } of SKILLS) {
  const heading = locale === "FR" ? HEADING_FR : HEADING_EN;
  const rules = locale === "FR" ? RULES_FR : RULES_EN;
  test(`${locale} ${name} has a claim-discipline section at all`, () => {
    assert.match(read(path), heading, `${path} must carry the discipline under its own heading`);
  });
  for (const { why, pattern } of rules) {
    test(`${locale} ${name} carries the claim discipline: ${why}`, () => {
      const section = disciplineSection(read(path), heading);
      assert.match(section, pattern, `${path} lost the rule — ${why}`);
    });
  }
}

for (const { locale, layers } of CONSTITUTIONS) {
  const rules = locale === "FR" ? RULES_FR : RULES_EN;
  const heading = locale === "FR" ? HEADING_FR : HEADING_EN;
  test(`${locale} constitution has a claim-discipline section at all`, () => {
    assert.match(layers.map(read).join("\n"), heading, "the discipline must have its own heading");
  });
  for (const { why, pattern } of rules) {
    test(`${locale} constitution carries the claim discipline: ${why}`, () => {
      const section = disciplineSection(layers.map(read).join("\n"), heading);
      assert.match(section, pattern, `the ${locale} constitution lost the rule — ${why}`);
    });
  }
}

// ── Yesterday's caveat must not become today's premise ─────────────────────
// The compounding failure mode specific to a PERSISTENT brain: a briefing's
// caveat is prose, so the next session absorbs it as an established fact. It
// poisoned its own well twice — an explicit "no signal on e-invoicing, this
// silence is worth probing" (false: there were at least four) became a premise
// the following day. The fix is that the section says it is a DEBT, and that
// each debt is machine-visible (a checkbox), so the next session can FIND them
// instead of reading them as narrative.
for (const { name, locale, path } of SKILLS.filter((s) => s.name === "sync-sources")) {
  test(`${locale} ${name} frames the briefing's caveats as debts, machine-visibly`, () => {
    const text = read(path);
    assert.match(text, /## Caveats/, "the briefing template must still have a caveats section");
    assert.match(
      text,
      locale === "FR" ? /dette/i : /debt/i,
      "a caveat must be framed as a DEBT to re-verify, not as a fact to inherit",
    );
    assert.match(
      text,
      /unverified: true/,
      "the caveats must be machine-visible from the frontmatter, so the next session can find them without reading the prose",
    );
    assert.match(
      text,
      /^- \[ \] /m,
      "each debt must be a CHECKBOX — grep-able, and tickable only when a check actually cleared it",
    );
  });
}

// ── The consumer must not invent its own scale ─────────────────────────────
// F7's lesson, applied one layer up: the control belongs where the facts are
// PRODUCED, not re-invented in each consumer. `prepare-1-1` consumes the
// `sync-sources` fan-out, so it must point at that discipline rather than
// paraphrase it — two paraphrases are two different disciplines.
for (const { locale, path } of SKILLS.filter((s) => s.name === "prepare-1-1")) {
  test(`${locale} prepare-1-1 defers to sync-sources' discipline instead of restating its own`, () => {
    const section = disciplineSection(read(path), locale === "FR" ? HEADING_FR : HEADING_EN);
    // Anchored at the SECTION, not merely at the file: prepare-1-1 already linked
    // `../sync-sources/SKILL.md` for the fan-out architecture, so a bare file link
    // proved nothing — that assertion was green before a word of the fix existed.
    assert.match(
      section,
      /sync-sources\/SKILL\.md#/,
      "prepare-1-1 must point at the producer's discipline section itself, so the two cannot drift into two different rules",
    );
  });
}

// ── A recorded absence is a measurement, and measurements expire ───────────
// The vault had written down, as a PERMANENT limitation, that "the Slack
// connector does not expose permalinks", propagated it into several notes, and
// obeyed it. It was false — a wrong tool choice, not a platform constraint; the
// native connector returned permalinks on the first call. A brain that records a
// capability as absent must re-test it, never inherit it.
for (const { locale, layers } of CONSTITUTIONS) {
  test(`${locale} constitution: a capability recorded as ABSENT must be re-tested, not obeyed forever`, () => {
    const text = layers.map(read).join("\n");
    const pattern = locale === "FR" ? /re-tester|retester/i : /re-test/i;
    assert.match(text, pattern, "a recorded absence with no expiry becomes a false constraint the brain obeys");
  });
}
