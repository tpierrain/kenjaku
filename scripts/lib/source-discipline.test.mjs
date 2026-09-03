import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { docSection } from "./doc-section.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// 14.7 layer 3 — an AI summary was served as a source while the verbatim sat in
// the same file.
//
// The rule this pins ALREADY existed in both constitutions — "verbatim > human
// synthesis > AI synthesis" — and the defect happened anyway, because that rule
// is PASSIVE: it says how to RANK sources when citing, never WHEN to stop and go
// read the raw one. The choice was never presented. The summary arrived unasked,
// at the top of the very file that held the transcript, in the exact shape of the
// asked-for deliverable, and a partial read (the first 140 lines of a
// 110k-character export) landed on the summary alone. This is the
// `repeated-ask-means-unwired-net` shape: the net existed and never ran.
//
// So what is guarded here is an ORDERING, not a ranking — a rule with a gesture
// in it. Layers 1 and 2 are the deterministic halves (the builder refuses a note
// that declares no source tier; the PostToolUse notice speaks at the moment of
// the read). This is the half no script can enforce: only the reader can decide
// to go further down the file before writing.
//
// Same shape as the claim (F18), identity (F7), consent (F3) and connector (14.6)
// guards: sliced with the shared `docSection`, so a rule can never pass on
// unrelated prose elsewhere in the file — "verbatim" and "source" appear all over
// both carriers for other reasons.
//
// Reach, checked rather than assumed: `.claude/skills/sync-sources/**` is in the
// manifest's `merge` regime, so a brain that never edited it IS brought up to date
// (ADR 0026 §8) and the fleet gets this; `CLAUDE.engine.md` is in NO regime, so the
// constitution half reaches new installs only — which is why the skill carries the
// full rule and the constitution carries the condensed one, never the reverse.
// ═══════════════════════════════════════════════════════════════════════════

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (rel) => readFileSync(join(REPO_ROOT, rel), "utf8");

const SKILLS = [
  { locale: "EN", path: ".claude/skills/sync-sources/SKILL.md", heading: /^## Source discipline/m },
  { locale: "FR", path: "templates/fr/.claude/skills/sync-sources/SKILL.md", heading: /^## Discipline de source/m },
];

const CONSTITUTIONS = [
  { locale: "EN", path: "CLAUDE.engine.md", heading: /^### Source discipline/m },
  { locale: "FR", path: "templates/fr/CLAUDE.engine.md", heading: /^### Discipline de source/m },
];

// ── The rules, each naming what it stops from happening again ──────────────
// `where: "both"` is asserted on the constitutions too: the condensed copy has to
// be the SAME discipline, not a second paraphrase of it (the claim guard's rule).
const RULES = {
  EN: [
    {
      why: "a search-result snippet is refused as a source outright",
      pattern: /snippet is never a source/i,
      where: "both",
    },
    { why: "and the gesture that replaces it is named", pattern: /open the document/i, where: "both" },
    {
      why: "the ORDER is stated as an order — the verbatim is read before anything made from it",
      pattern: /read the verbatim before/i,
      where: "both",
    },
    {
      why: "the summary's own action list is named, because that is what gets copied",
      pattern: /never the list of decisions/i,
      where: "skill",
    },
    {
      why: "a partial read that lands on the summary is named as the mechanism it is",
      pattern: /partial read/i,
      where: "skill",
    },
    {
      why: "the tier that gets declared is the one actually read",
      pattern: /declare the tier you actually read/i,
      where: "both",
    },
    {
      why: "no verbatim is said in the note, rather than the summary being promoted into one",
      pattern: /say so in the note/i,
      where: "skill",
    },
    {
      why: "the read-path notice is a reminder, and its silence is not permission",
      pattern: /silence is not permission/i,
      where: "skill",
    },
  ],
  FR: [
    {
      why: "a search-result snippet is refused as a source outright",
      pattern: /extrait de recherche n'est jamais une source/i,
      where: "both",
    },
    { why: "and the gesture that replaces it is named", pattern: /ouvre le document/i, where: "both" },
    {
      why: "the ORDER is stated as an order — the verbatim is read before anything made from it",
      // Kept on ONE line in the carrier on purpose: a guarded phrase that wraps
      // goes red for typography rather than for meaning (recorded at 12.3, met
      // twice at 14.3, and again at 14.6). The fix belongs in the prose.
      pattern: /lis le verbatim avant/i,
      where: "both",
    },
    {
      why: "the summary's own action list is named, because that is what gets copied",
      pattern: /jamais la liste des décisions/i,
      where: "skill",
    },
    {
      why: "a partial read that lands on the summary is named as the mechanism it is",
      pattern: /lecture partielle/i,
      where: "skill",
    },
    {
      why: "the tier that gets declared is the one actually read",
      pattern: /déclare le palier que tu as réellement lu/i,
      where: "both",
    },
    {
      why: "no verbatim is said in the note, rather than the summary being promoted into one",
      pattern: /dis-le dans la note/i,
      where: "skill",
    },
    {
      why: "the read-path notice is a reminder, and its silence is not permission",
      pattern: /son silence ne vaut pas permission/i,
      where: "skill",
    },
  ],
};

for (const { locale, path, heading } of SKILLS) {
  const section = () => docSection(read(path), heading);

  test(`${locale} sync-sources carries the source discipline as its own named section`, () => {
    assert.notEqual(section(), "", `${path} has no source-discipline section`);
  });

  for (const { why, pattern } of RULES[locale]) {
    test(`${locale} source discipline: ${why}`, () => {
      assert.match(section(), pattern);
    });
  }
}

for (const { locale, path, heading } of CONSTITUTIONS) {
  const section = () => docSection(read(path), heading);

  test(`${locale} constitution carries the condensed source discipline`, () => {
    assert.notEqual(section(), "", `${path} has no source-discipline section`);
  });

  for (const { why, pattern } of RULES[locale].filter((r) => r.where === "both")) {
    test(`${locale} constitution source discipline: ${why}`, () => {
      assert.match(section(), pattern);
    });
  }
}

// ── The passive rule must not survive BESIDE the active one ────────────────
// Two rules about the same thing, one of which never fires, is how a reader learns
// which one to obey. The ranking sentence keeps its place (it is still true, and the
// tiers are the builder's own), but it has to POINT at the ordering rather than stand
// alone as it did when the defect happened.
test("the constitutions' ranking bullet points at the ordering rule instead of standing alone", () => {
  for (const { path, ranking } of [
    { path: "CLAUDE.engine.md", ranking: /verbatim \(transcript, raw message\) > human synthesis > AI synthesis[^\n]*Source discipline/ },
    { path: "templates/fr/CLAUDE.engine.md", ranking: /verbatim \(transcript, message brut\) > synthèse humaine > synthèse IA[^\n]*Discipline de source/ },
  ]) {
    assert.match(read(path), ranking, `${path}: the passive ranking rule still stands on its own`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SOURCE IDENTITY (ADR 0041) — the producing half of the duplication work.
//
// Steps 1, 2 and 4 of the duo plan built the mechanism: `known-source.mjs`
// answers, and `file-back-note.mjs` refuses a note whose `sources` a vault note
// already carries. NOTHING CALLS EITHER unless the skill says to — the producers
// are prose, and prose is what this file guards.
//
// So the rules below are the ones that make the machinery reachable: ask before
// capturing, stamp what you drew on, and the two readings that would turn the
// feature into a defect ("already held" read as "drop it", an absent key read as
// "already seen"). Sliced with `docSection` like every other discipline: "source"
// and "identity" appear all over both carriers for other reasons.
//
// The last block leaves the section on purpose. A discipline nobody applies at the
// three places that actually write (the fan-out prompts, the briefing's own
// frontmatter, the ledger line) is a paragraph, not a behaviour — and the path a
// dated note is written to is now a question with an answer (`dated-note-path.mjs`),
// never a string composed by hand.
// ═══════════════════════════════════════════════════════════════════════════

const IDENTITY_SKILLS = [
  { locale: "EN", path: ".claude/skills/sync-sources/SKILL.md", heading: /^## Source identity/m },
  {
    locale: "FR",
    path: "templates/fr/.claude/skills/sync-sources/SKILL.md",
    heading: /^## Identité de source/m,
  },
];

const IDENTITY_RULES = {
  EN: [
    {
      why: "the check is a command with a name, not an intention",
      pattern: /node scripts\/known-source\.mjs/,
    },
    {
      why: "a broken question is not a hit — the third exit code is the safety of the whole thing",
      pattern: /never treat "non-zero"/i,
    },
    {
      why: '"already held" sends you to the note, it never cancels the work',
      pattern: /means GO AND READ IT/,
    },
    { why: "a capture stamps one key", pattern: /a capture lists one/i },
    {
      why: "a synthesis stamps every source it drew on, which is why the field is a list",
      pattern: /a synthesis lists as many as it drew on/i,
    },
    {
      why: "the mail key is composed from what the cheap formats already return",
      pattern: /sender address \+ the sent timestamp \+ the subject/,
    },
    {
      why: "a raw fetch for one header is the cost this whole fan-out exists to avoid",
      pattern: /never fetch a raw message just to get an identity/i,
    },
    {
      why: "an absent key is UNKNOWN — every note written before this rule is in that state",
      pattern: /UNKNOWN, never "already seen"/i,
    },
    {
      why: "what is removed is duplicate storage, never a second person's question",
      pattern: /duplicate STORAGE, not duplicate thinking/,
    },
  ],
  FR: [
    {
      why: "the check is a command with a name, not an intention",
      pattern: /node scripts\/known-source\.mjs/,
    },
    {
      why: "a broken question is not a hit — the third exit code is the safety of the whole thing",
      pattern: /ne traite jamais un code non nul/i,
    },
    {
      why: '"already held" sends you to the note, it never cancels the work',
      pattern: /VA LA LIRE/,
    },
    { why: "a capture stamps one key", pattern: /une capture en liste une/i },
    {
      why: "a synthesis stamps every source it drew on, which is why the field is a list",
      pattern: /une synthèse en liste autant/i,
    },
    {
      why: "the mail key is composed from what the cheap formats already return",
      pattern: /adresse de l'expéditeur \+ l'horodatage d'envoi \+ le sujet/,
    },
    {
      why: "a raw fetch for one header is the cost this whole fan-out exists to avoid",
      pattern: /ne va jamais chercher un message brut/i,
    },
    {
      why: "an absent key is UNKNOWN — every note written before this rule is in that state",
      pattern: /INCONNUE, jamais/i,
    },
    {
      why: "what is removed is duplicate storage, never a second person's question",
      pattern: /le STOCKAGE en double, pas la réflexion en double/,
    },
  ],
};

for (const { locale, path, heading } of IDENTITY_SKILLS) {
  const section = () => docSection(read(path), heading);

  test(`${locale} sync-sources carries the source identity as its own named section`, () => {
    assert.notEqual(section(), "", `${path} has no source-identity section`);
  });

  for (const { why, pattern } of IDENTITY_RULES[locale]) {
    test(`${locale} source identity: ${why}`, () => {
      assert.match(section(), pattern);
    });
  }
}

// ── The three places that WRITE, and the path they write to ────────────────
// Asserted on the whole file rather than on a section: these are single lines
// inside the fan-out prompts, the briefing template and the ledger format, and
// each one lives where the writing actually happens.
const APPLIED = {
  EN: {
    path: ".claude/skills/sync-sources/SKILL.md",
    rules: [
      {
        why: "the sub-agents that capture run the check before storing anything",
        pattern: /run the source-identity check/g,
        times: 2,
      },
      {
        why: "a capture stamps the key of the one document it is",
        pattern: /sources: \["drive\|<DOC_ID>"\]/,
      },
      {
        why: "the briefing's own frontmatter carries the normalized keys it drew on",
        pattern: /sources: \["drive\|<id>", "slack\|/,
      },
      {
        why: "a dated note's path is asked for, never composed by hand",
        pattern: /node scripts\/dated-note-path\.mjs/,
      },
      {
        why: "the ledger line names who did it, so one shared ledger stays readable",
        pattern: /\[\[people\/recipient\]\] · <who>/,
      },
    ],
  },
  FR: {
    path: "templates/fr/.claude/skills/sync-sources/SKILL.md",
    rules: [
      {
        why: "the sub-agents that capture run the check before storing anything",
        pattern: /lance la vérification d'identité de source/g,
        times: 2,
      },
      {
        why: "a capture stamps the key of the one document it is",
        pattern: /sources: \["drive\|<DOC_ID>"\]/,
      },
      {
        why: "the briefing's own frontmatter carries the normalized keys it drew on",
        pattern: /sources: \["drive\|<id>", "slack\|/,
      },
      {
        why: "a dated note's path is asked for, never composed by hand",
        pattern: /node scripts\/dated-note-path\.mjs/,
      },
      {
        why: "the ledger line names who did it, so one shared ledger stays readable",
        pattern: /\[\[people\/destinataire\]\] · <qui>/,
      },
    ],
  },
};

for (const [locale, { path, rules }] of Object.entries(APPLIED)) {
  for (const { why, pattern, times } of rules) {
    test(`${locale} sync-sources applies it where it writes: ${why}`, () => {
      if (times === undefined) return assert.match(read(path), pattern);
      // Both capturing sub-agents, not one: the transcript extractor and the chat
      // extractor each store, and a check wired into one of them leaves the other
      // duplicating in silence.
      assert.equal((read(path).match(pattern) ?? []).length, times);
    });
  }
}

// ── The owner's constitution says what sharing a brain does NOT share ──────
// The one question a second owner asks first, and the one a brain answers wrongly
// with confidence: it sees ITS OWN mail and calendar, never the other person's, and
// nothing in the vault says so. It lives in the OWNER-EDITABLE constitution (he may
// rewrite it), which is why it reaches new installs rather than the fleet.
const SHARED_BRAIN = [
  {
    locale: "EN",
    path: "CLAUDE.md.template",
    heading: /^## If you share this brain with someone else/m,
    rules: [
      { why: "what crosses is the notes, never the tools", pattern: /the notes, not the tools/i },
      {
        why: "the calendar is named as the exception, because it is the one that does cross",
        pattern: /shared calendar DOES reach the other brain/i,
      },
      {
        why: "the answer about the other person comes from their notes, not from your connectors",
        pattern: /answer from their notes/i,
      },
    ],
  },
  {
    locale: "FR",
    path: "templates/fr/CLAUDE.md.template",
    heading: /^## Si tu partages ce cerveau avec quelqu'un d'autre/m,
    rules: [
      { why: "what crosses is the notes, never the tools", pattern: /les notes, pas les outils/i },
      {
        why: "the calendar is named as the exception, because it is the one that does cross",
        pattern: /un agenda partagé, lui, atteint bien l'autre cerveau/i,
      },
      {
        why: "the answer about the other person comes from their notes, not from your connectors",
        pattern: /réponds à partir de ses notes/i,
      },
    ],
  },
];

for (const { locale, path, heading, rules } of SHARED_BRAIN) {
  const section = () => docSection(read(path), heading);

  test(`${locale} constitution template carries the shared-brain perimeter`, () => {
    assert.notEqual(section(), "", `${path} says nothing about sharing the brain`);
  });

  for (const { why, pattern } of rules) {
    test(`${locale} shared-brain perimeter: ${why}`, () => {
      assert.match(section(), pattern);
    });
  }
}
