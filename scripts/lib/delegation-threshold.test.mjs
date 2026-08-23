import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { docSection } from "./doc-section.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// Delegation needs an OBJECTIVE threshold — issue #64, RULE half only.
// Doctrine cargo of v5.0.0.
//
// The field defect (2026-08-11, article-review workflow in a real brain):
// auto-compaction fired far earlier than expected. The status line showed
// 43 % because it lags one turn behind; the actual trigger was the mid-turn
// injection of a very large bundled skill, loaded to source three figures, on
// top of a context already carrying several full articles and screenshots.
//
// 🧭 The root cause is not that the guidance was missing — it was there, and it
// was ADVISORY: "a large document", "reasonable size". No number. A rule with no
// number is remembered exactly when there is room to spare and forgotten exactly
// when there is not, because judging "large" costs attention that a loaded
// context no longer has. So the fix is a threshold, not a paragraph.
//
// 🛑 AND THE THRESHOLD NEEDS ITS EXCEPTION IN THE SAME BREATH, which is why this
// guard asserts both. The issue's own non-goal: routing every file open through
// a subagent breaks the edit flow, adds latency on small notes, and degrades
// fidelity for verbatim work. Two carve-outs are load-bearing — a file about to
// be EDITED (Edit requires a prior Read in the main context) and content to be
// QUOTED VERBATIM (a digest loses the word-level fidelity). A number shipped
// without them is a number that will be applied to everything.
//
// ⚠️ THE HOOK HALF IS NOT HERE, by the owner's arbitration: the issue also asks
// for a PreToolUse(Read) warning. It stays in the backlog. This guard covers the
// rule, and must not grow to assert a hook nobody agreed to ship.
//
// Reach: `CLAUDE.engine.md` is a `merge`-regime file since this release, so both
// locales move together and the fingerprint table is regenerated with them.
// ═══════════════════════════════════════════════════════════════════════════

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (rel) => readFileSync(join(REPO_ROOT, rel), "utf8");

const HEADING_EN = /^#+ Delegation to sub-agents/m;
const HEADING_FR = /^#+ Délégation aux sous-agents/m;

const CONSTITUTIONS = [
  { locale: "EN", layers: ["CLAUDE.md.template", "CLAUDE.engine.md"] },
  { locale: "FR", layers: ["templates/fr/CLAUDE.md.template", "templates/fr/CLAUDE.engine.md"] },
];

// ── The rules, each with the failure it prevents ───────────────────────────
const RULES_EN = [
  {
    why: "an objective threshold in LINES — 'large document' is a judgement the loaded context can no longer afford",
    pattern: /1,500 lines/,
  },
  {
    why: "…and in SIZE, because a wide file can be short on lines and still flood the context",
    pattern: /60 KB/,
  },
  {
    why: "the threshold is attached to CONSULTATION, which is the only case it governs",
    pattern: /consult/i,
  },
  {
    why: "carve-out 1 — a file about to be EDITED is read directly, whatever its size",
    pattern: /edit/i,
  },
  {
    why: "…and the mechanical reason is stated, so the exception is not read as a preference: Edit requires a prior Read",
    pattern: /prior Read/,
  },
  {
    why: "carve-out 2 — content to be quoted VERBATIM, where a digest loses word-level fidelity",
    pattern: /verbatim/i,
  },
  {
    why: "the skill-load vector is named: a huge skill loaded for a handful of facts is the same disease",
    pattern: /skill/i,
  },
  {
    why: "the non-goal is recorded, so a number does not get applied to every file open",
    pattern: /not every/i,
  },
  {
    why: "the number is a default a brain may move, not a constant handed down",
    pattern: /adjust/i,
  },
];

const RULES_FR = [
  {
    why: "an objective threshold in LINES — « gros document » is a judgement the loaded context can no longer afford",
    pattern: /1\s?500 lignes/,
  },
  { why: "…and in SIZE, because a wide file can be short on lines and still flood the context", pattern: /60 Ko/ },
  { why: "the threshold is attached to CONSULTATION, which is the only case it governs", pattern: /consultation/i },
  { why: "carve-out 1 — a file about to be EDITED is read directly, whatever its size", pattern: /édit/i },
  {
    why: "…and the mechanical reason is stated, so the exception is not read as a preference: Edit requires a prior Read",
    pattern: /préalable/i,
  },
  { why: "carve-out 2 — content to be quoted VERBATIM, where a digest loses word-level fidelity", pattern: /verbatim/i },
  { why: "the skill-load vector is named: a huge skill loaded for a handful of facts is the same disease", pattern: /skill/i },
  { why: "the non-goal is recorded, so a number does not get applied to every file open", pattern: /ne passent pas/i },
  { why: "the number is a default a brain may move, not a constant handed down", pattern: /ajuste/i },
];

for (const { locale, layers } of CONSTITUTIONS) {
  const heading = locale === "FR" ? HEADING_FR : HEADING_EN;
  const rules = locale === "FR" ? RULES_FR : RULES_EN;

  test(`${locale} constitution still has a delegation section`, () => {
    assert.match(layers.map(read).join("\n"), heading, "the delegation guidance must keep its heading");
  });

  for (const { why, pattern } of rules) {
    test(`${locale} constitution — delegation has an objective threshold: ${why}`, () => {
      const section = docSection(layers.map(read).join("\n"), heading);
      assert.match(section, pattern, `the ${locale} delegation rule lost it — ${why}`);
    });
  }
}

// ── A threshold whose exception lives elsewhere is applied to everything ────
// The framing assertion, third slice running: presence is the cheap half. Here
// the number and its carve-outs must be met TOGETHER — the failure mode is a
// reader who takes the number away and leaves the exception behind, which is
// exactly the issue's non-goal (broken edit flow, degraded verbatim fidelity).
for (const { locale, layers } of CONSTITUTIONS) {
  test(`${locale} constitution: the carve-outs are stated AFTER the number, not in another section`, () => {
    const section = docSection(layers.map(read).join("\n"), locale === "FR" ? HEADING_FR : HEADING_EN);
    const number = section.search(locale === "FR" ? /1\s?500 lignes/ : /1,500 lines/);
    const carveOut = section.search(locale === "FR" ? /verbatim/i : /verbatim/i);
    assert.notEqual(number, -1, "the threshold must be inside the delegation section");
    assert.notEqual(carveOut, -1, "the verbatim carve-out must be inside the same section");
    assert.equal(number < carveOut, true, "the exception must follow the number a reader just took away");
  });
}

// ── The hook half must NOT sneak in ────────────────────────────────────────
// The owner's arbitration kept the issue's PreToolUse(Read) warning in the
// backlog. A doc guard is exactly the place where undecided scope quietly
// becomes shipped scope, so the absence is asserted rather than assumed.
for (const { locale, layers } of CONSTITUTIONS) {
  test(`${locale} constitution: the rule does not promise the deterministic hook that was NOT arbitrated in`, () => {
    const section = docSection(layers.map(read).join("\n"), locale === "FR" ? HEADING_FR : HEADING_EN);
    assert.doesNotMatch(
      section,
      /PreToolUse/,
      "the hook half stays in the backlog by the owner's call — the rule must not announce it",
    );
  });
}
