import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { docSection } from "./doc-section.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// F3 — the engine-update offer was version-blind, so the consent was uninformed.
//
// Field evidence (2026-08-05, the owner's own brain on v4.6.0): the prompt said it
// out loud — *"Tu es en v4.6.0. Je ne sais pas ce qui est disponible en amont :
// c'est le script qui le dira."* — and then asked for a yes. The owner was
// consenting to a code swap that could not answer "what for?".
//
// The target was knowable for free all along (one `git ls-remote`, which the update
// already runs at its own step 1), so this is not a missing capability: it was a
// call made AFTER the confirmation instead of before it. `--check` moved it, and
// this guard pins the conversational half — the skill must ASK AFTER IT KNOWS.
//
// Why a guard and not just an edit: the same defect has to stay fixed in TWO
// locales, and a rule that lives in only one of them is a rule half the fleet does
// not carry. Same shape as the claim (F18) and identity (F7) guards — section
// sliced with the shared `docSection`, so a rule cannot pass on unrelated prose
// elsewhere in the file.
//
// Reach, checked rather than assumed: `.claude/skills/update-engine/**` sits in the
// manifest's `merge` regime, so a brain that never edited this skill IS brought up
// to date by its next update (ADR 0026 §8) and the fleet gets this. A brain that
// tailored it keeps its own, with the new text dropped beside it as `.new`.
// ═══════════════════════════════════════════════════════════════════════════

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (rel) => readFileSync(join(REPO_ROOT, rel), "utf8");

const SKILLS = [
  {
    locale: "EN",
    path: ".claude/skills/update-engine/SKILL.md",
    heading: /^#+ Step 1 — Find out what the update contains/m,
  },
  {
    locale: "FR",
    path: "templates/fr/.claude/skills/update-engine/SKILL.md",
    heading: /^#+ Étape 1 : savoir ce que la mise à jour apporte/m,
  },
];

// ── The rules, each naming what it stops from happening again ──────────────
const RULES = {
  EN: [
    {
      why: "the check is RUN, and it is the same script — no separate probe to allowlist",
      pattern: /node scripts\/update-engine\.mjs --check/,
    },
    {
      why: "and it is run BEFORE the yes is asked for — the whole finding",
      pattern: /never ask for a yes before you can say what the yes buys/i,
    },
    {
      why: "an available update is presented with its target version AND how far ahead it is",
      pattern: [/📦/, /which version .* about to install/i],
    },
    {
      why: "the release prose is QUOTED, never summarised (ADR 0009 — no generated step on a consent)",
      pattern: [/quote/i, /never summarise|do not summarise/i],
    },
    {
      why: "'already up to date' ends the conversation instead of running the update anyway",
      pattern: [/✅/, /nothing to install/i],
    },
    {
      why: "'I could not find out' is said as itself, never as 'nothing is available'",
      pattern: [/❓/, /could not find out/i, /uninformed/i],
    },
  ],
  FR: [
    {
      why: "the check is RUN, and it is the same script",
      pattern: /node scripts\/update-engine\.mjs --check/,
    },
    {
      why: "and it is run BEFORE the yes is asked for",
      pattern: /jamais demander un oui avant de pouvoir dire ce que ce oui apporte/i,
    },
    {
      why: "an available update is presented with its target version and how far ahead it is",
      pattern: [/📦/, /quelle version .* installer/i],
    },
    {
      why: "the release prose is quoted, never summarised",
      pattern: [/cite/i, /ne (?:la )?résume/i],
    },
    {
      why: "'already up to date' ends the conversation",
      pattern: [/✅/, /rien à installer/i],
    },
    {
      why: "'I could not find out' is said as itself",
      pattern: [/❓/, /je n'ai pas pu savoir/i, /pas éclairé/i],
    },
  ],
};

for (const { locale, path, heading } of SKILLS) {
  test(`update-consent discipline — ${locale} update-engine carries the section, and it is where Step 1 was`, () => {
    const section = docSection(read(path), heading);
    assert.notEqual(section, "", `${path} has no "find out first" section — the skill still asks blind`);
    assert.ok(
      section.length > 400,
      `${path}'s section is a stub (${section.length} chars): a heading is not a discipline`,
    );
  });

  for (const { why, pattern } of RULES[locale]) {
    test(`update-consent discipline — ${locale} says: ${why}`, () => {
      const section = docSection(read(path), heading);
      for (const p of [pattern].flat()) {
        assert.match(section, p, `${path} — missing: ${why}`);
      }
    });
  }
}

// The check is worthless if the skill can reach the real update without it. Asserted
// on the WHOLE file, not the section: a "run the core" instruction anywhere in the
// document must be downstream of the check.
test("update-consent discipline — neither locale offers the update before the check", () => {
  for (const { locale, path } of SKILLS) {
    const text = read(path);
    const check = text.indexOf("node scripts/update-engine.mjs --check");
    const run = text.search(/node scripts\/update-engine\.mjs\s*\n/);
    assert.notEqual(check, -1, `${locale}: the check command is not in the file at all`);
    assert.notEqual(run, -1, `${locale}: the real command is not in the file at all`);
    assert.ok(
      check < run,
      `${locale}: the real update appears before the check — the reader meets the swap first`,
    );
  }
});
