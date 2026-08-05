import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { docSection } from "./doc-section.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// The backlog restitution — a brain asked "show me what I'm expected to deliver"
// answered with a near-raw dump of two backlogs: items already done presented as
// still to do, and the chantier that mattered most at the bottom of the list.
//
// The rule for exactly this already existed, and it did not fire. That is the
// point. § Backlogs carried it TWICE: once broadly and unconditionally ("never
// present an action as to do without having checked"), but under an "on each
// ingestion of external data" heading that scopes it by reading; and once as an
// operational three-phase flow whose own trigger was "when you list actions from
// EXTERNAL SOURCES". So the broad rule had no procedure attached, the procedure
// had a narrow trigger, and a plain recall from the vault fired neither.
//
// Same defect shape as the plans rule whose trigger moved from "step finished"
// to "hand rendered", and the same family as the source (14.7) and claim (F18)
// disciplines: the net existed and never ran, because its entry point was drawn
// around where the data CAME FROM rather than around what was about to be SAID.
// Hence the new trigger: displaying an unchecked action, whatever its origin.
//
// ⚠️ Reach, checked rather than assumed, and it is the limit of this guard:
// `CLAUDE.md` sits in the manifest's `merge` regime, but `engine-apply-plan.mjs`
// refreshes only the top-level scripts and the skills of that regime — the
// constitution is left alone on an update (the 3-way merge is the still-unshipped
// `engine-managed-file-merge-strategy` plan). So this reaches NEW INSTALLS ONLY.
// There is no skill carrier for it either: the failing question is the main flow,
// not a skill. F18's own guard says the constitution half "must never be the only
// carrier" — here it is, and that debt is named in the v4.9.0 plan rather than
// papered over.
// ═══════════════════════════════════════════════════════════════════════════

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (rel) => readFileSync(join(REPO_ROOT, rel), "utf8");

const CONSTITUTIONS = [
  { locale: "EN", path: "CLAUDE.engine.md", heading: /^### Backlogs/m },
  { locale: "FR", path: "templates/fr/CLAUDE.engine.md", heading: /^### Backlogs/m },
];

// ── The rules, each naming what it stops from happening again ──────────────
// Every pattern must stay on ONE line in the carrier: a guarded phrase that wraps
// goes red for typography rather than for meaning (recorded at 12.3, met twice at
// 14.3 and again at 14.6).
const RULES = {
  EN: [
    {
      why: "the trigger is what is about to be DISPLAYED, not where the data came from",
      pattern: /trigger is \*\*displaying\*\* an unchecked action, not ingesting a source/i,
    },
    {
      why: "a plain recall from the vault is named as the case it is, so nothing self-exempts",
      pattern: /reading the vault back is enough/i,
    },
    {
      why: "an unverified status is said on the line, not left for the reader to assume",
      pattern: /statuses are not verified yet/i,
    },
    {
      why: "an unchecked box is a record of the writing, never a fact about the world",
      pattern: /never a mute `- \[ \]`/i,
    },
    {
      why: "and what it actually means is spelled out, both halves of it",
      pattern: /means \*not re-verified\*, never \*not done\*/i,
    },
    {
      why: "a box whose trace was not looked for says so, in words, on the line",
      pattern: /status not verified/i,
    },
    {
      why: "the display is capped, and ONLY for backlogs — not turned into a rule about long answers",
      pattern: /backlogs and action items only, not long answers in general/i,
    },
    {
      why: "the fold is spoken: how many were folded",
      pattern: /how many\*\* you folded/i,
    },
    {
      why: "and on what basis the head was chosen, which is the other half of the same defect",
      pattern: /on what basis\*\* you picked the head/i,
    },
    {
      why: "dumping is named for what it is: handing the triage back",
      pattern: /hands the triage back/i,
    },
  ],
  FR: [
    {
      why: "the trigger is what is about to be DISPLAYED, not where the data came from",
      pattern: /déclencheur, c'est \*\*afficher\*\* une action non cochée, pas ingérer une source/i,
    },
    {
      why: "a plain recall from the vault is named as the case it is, so nothing self-exempts",
      pattern: /une simple relecture du vault suffit/i,
    },
    {
      why: "an unverified status is said on the line, not left for the reader to assume",
      pattern: /les statuts ne sont pas encore vérifiés/i,
    },
    {
      why: "an unchecked box is a record of the writing, never a fact about the world",
      pattern: /jamais de `- \[ \]` muet/i,
    },
    {
      why: "and what it actually means is spelled out, both halves of it",
      pattern: /veut dire « pas revérifié », jamais « pas fait »/i,
    },
    {
      why: "a box whose trace was not looked for says so, in words, on the line",
      pattern: /statut non vérifié/i,
    },
    {
      why: "the display is capped, and ONLY for backlogs — not turned into a rule about long answers",
      pattern: /backlogs et les action items uniquement, pas pour les réponses longues/i,
    },
    {
      why: "the fold is spoken: how many were folded",
      pattern: /\*\*combien\*\* ont été repliés/i,
    },
    {
      why: "and on what basis the head was chosen, which is the other half of the same defect",
      pattern: /\*\*sur quel critère\*\* la tête a été choisie/i,
    },
    {
      why: "dumping is named for what it is: handing the triage back",
      pattern: /repasser le tri à la personne/i,
    },
  ],
};

for (const { locale, path, heading } of CONSTITUTIONS) {
  const section = () => docSection(read(path), heading);

  test(`${locale} constitution carries the backlog section`, () => {
    assert.notEqual(section(), "", `${path} has no § Backlogs section`);
  });

  for (const { why, pattern } of RULES[locale]) {
    test(`${locale} backlog discipline: ${why}`, () => {
      assert.match(section(), pattern);
    });
  }
}

test("the two constitutions carry the SAME discipline, rule for rule", () => {
  // The FR layer has drifted before (that is why the parity guards exist at all).
  // Counting is not cosmetic here: a rule that lands in one locale only is a rule
  // half the fleet does not have, and nothing else would notice.
  assert.equal(
    RULES.EN.length,
    RULES.FR.length,
    "a rule added to one locale must be added to the other",
  );
});
