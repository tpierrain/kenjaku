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
