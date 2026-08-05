import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { docSection } from "./doc-section.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// 14.6 — a DECLARED connector is not a VERIFIED one.
//
// A universe profile carries a hand-typed `## Connector accounts` section, and the
// digest used to quote it as a fact. But the native connectors are single-account
// and do NOT follow a `/switch` (ADR 0034): after moving spheres, Slack is still
// authenticated on the workspace the owner left while the page on screen declares
// the new one. The brain then reads one organisation's messages and files them
// under another's name — a cross-universe leak that nothing downstream can catch,
// because the resulting note is perfectly well-formed.
//
// The deterministic half ships in `connector-accounts.mjs` + `--check-slack`. This
// guard pins the half no script can enforce: only the MODEL can ask Slack which
// workspace it is on, so the observation has to be asked for, carried back, and
// handed to the check. A rule with no gesture is a rule nothing ever runs, which
// is why the operative surfaces are guarded here alongside the prose one.
//
// Same shape as the claim (F18), identity (F7) and consent (F3) guards: sliced with
// the shared `docSection`, so a rule can never pass on unrelated prose elsewhere in
// the file, and so the rules are pinned as ONE discipline rather than scattered.
//
// Reach, checked rather than assumed: `.claude/skills/sync-sources/**` and
// `.claude/skills/switch/**` are both in the manifest's `merge` regime, so a brain
// that never edited them IS brought up to date (ADR 0026 §8); `scripts/lib/**` and
// `scripts/set-universe-profile.mjs` are in `replace`, so the check itself lands
// everywhere.
// ═══════════════════════════════════════════════════════════════════════════

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (rel) => readFileSync(join(REPO_ROOT, rel), "utf8");

const SKILLS = [
  { locale: "EN", path: ".claude/skills/sync-sources/SKILL.md", heading: /^## Connector discipline/m },
  {
    locale: "FR",
    path: "templates/fr/.claude/skills/sync-sources/SKILL.md",
    heading: /^## Discipline de connecteur/m,
  },
];

// ── The rules, each naming what it stops from happening again ──────────────
const RULES = {
  EN: [
    {
      why: "a declaration is named as a claim, which is the whole finding",
      pattern: /declared account is a claim, never an observation/i,
    },
    {
      why: "and the reason it can be wrong is stated, not merely asserted",
      pattern: /single-account and do \*\*not\*\* follow a `\/switch`/,
    },
    {
      why: "the sub-agent observes and the main context checks — the only split that works",
      pattern: /The observation is the sub-agent's, the check is yours/,
    },
    {
      why: "the model is told NOT to compare the strings itself (ADR 0009)",
      pattern: /Do not compare the two strings yourself/,
    },
    { why: "the gesture that settles it is spelled out", pattern: /--check-slack/ },
    {
      why: "the three non-matching answers must not be rounded up to the matching one",
      pattern: /never round the last three up to the first/i,
    },
    {
      why: "a divergence stops the write, rather than being merely mentioned",
      pattern: /divergence is a hard block on filing/i,
    },
    {
      why: "the unverifiable connectors say they are unverifiable",
      pattern: /declared and unverified/i,
    },
  ],
  FR: [
    {
      why: "a declaration is named as a claim, which is the whole finding",
      pattern: /compte déclaré est une affirmation, jamais une observation/i,
    },
    {
      why: "and the reason it can be wrong is stated, not merely asserted",
      pattern: /mono-compte et ne suivent \*\*pas\*\*/,
    },
    {
      why: "the sub-agent observes and the main context checks — the only split that works",
      pattern: /L'observation revient au sous-agent, la vérification à toi/,
    },
    {
      why: "the model is told NOT to compare the strings itself (ADR 0009)",
      pattern: /Ne compare pas les deux chaînes toi-même/,
    },
    { why: "the gesture that settles it is spelled out", pattern: /--check-slack/ },
    {
      why: "the three non-matching answers must not be rounded up to the matching one",
      // Kept on ONE line in the carrier on purpose: a guarded phrase that wraps
      // goes red for typography rather than for meaning (recorded at 12.3, met
      // twice at 14.3). The fix belongs in the prose, never in the pattern.
      pattern: /n'arrondis jamais les trois dernières vers la première/i,
    },
    {
      why: "a divergence stops the write, rather than being merely mentioned",
      pattern: /divergence bloque l'écriture/i,
    },
    {
      why: "the unverifiable connectors say they are unverifiable",
      pattern: /déclarés et non vérifiés/i,
    },
  ],
};

for (const { locale, path, heading } of SKILLS) {
  const section = () => docSection(read(path), heading);

  test(`${locale} sync-sources carries the connector discipline as its own named section`, () => {
    // Sliced, not searched: "Slack" appears all over this file for other reasons,
    // and a rule that passes on unrelated prose is a rule nobody is carrying.
    assert.notEqual(section(), "", `${path} has no connector-discipline section`);
  });

  for (const { why, pattern } of RULES[locale]) {
    test(`${locale} connector discipline: ${why}`, () => {
      assert.match(section(), pattern);
    });
  }
}

// ── The operative half: a rule stated only in prose is a rule nothing runs ──
// The lesson of 12.1, met again here. The sub-agents never see the vault, so the
// observation has to be ASKED FOR in the sub-agent's own prompt and CHECKED in the
// synthesis step — the only step holding both the observation and the profile.

test("the chat sub-agent is told to return the workspace it was on, in both locales", () => {
  for (const { path } of SKILLS) {
    const prompt = read(path);
    assert.match(prompt, /WORKSPACE: <[^>]+>/, `${path} never asks for the workspace`);
    // Told what to do when it cannot see one, or "unknown" becomes a guess.
    assert.match(prompt, /WORKSPACE: unknown/, `${path} lets an unseen workspace be invented`);
  }
});

test("the synthesis step runs the check before writing, in both locales", () => {
  const STEPS = [
    { path: SKILLS[0].path, heading: /^### Step 3 — Synthesis/m, passes: /Four passes/ },
    { path: SKILLS[1].path, heading: /^### Étape 3 — Synthèse/m, passes: /Quatre passes/ },
  ];
  for (const { path, heading, passes } of STEPS) {
    const step = docSection(read(path), heading);
    assert.match(step, /--check-slack/, `${path} states the rule but never runs it`);
    // The count is pinned for the same reason the claim guard pins its own: a
    // promise of three passes above a list of four is how the fourth reads as
    // optional. (Recorded at 12.1, where "Two passes" had to go.)
    assert.match(step, passes, `${path} still announces the old number of passes`);
  }
});

test("the /switch skill points at the discipline instead of paraphrasing it", () => {
  // Two paraphrases of one discipline are two disciplines (the claim guard's own
  // rule): `switch` is where the digest is printed, so it must send the reader to
  // the producer's section rather than restate the rules and drift from them.
  const skill = read(".claude/skills/switch/SKILL.md");
  assert.match(skill, /--check-slack/);
  assert.match(skill, /section \*\*Connector discipline\*\*/);
});
