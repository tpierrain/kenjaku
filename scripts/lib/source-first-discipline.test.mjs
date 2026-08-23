import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { docSection } from "./doc-section.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// The source-first discipline — a source the owner HANDS OVER is the statement
// of the task, not ambience, and it is read before any search tool fires.
//
// The finding (2026-08-08, a real brain on v4.8.1, i.e. fully up to date): the
// owner asked for an article completing one of his Medium posts, WITH THE URL IN
// THE MESSAGE. The brain never opened it. It produced a full comparative analysis
// of what was "missing" from that post — including a table of what was already
// published — from a reconstruction of it. Asked afterwards to mention his tool
// Clepsydre, it ran a SEMANTIC search (the wrong instrument for a proper noun),
// found nothing, and asserted two falsehoods in a row: "not in the vault" and
// "your articles never name it". Clepsydre was in the addendum of the very
// article whose link had been handed over in the first message.
//
// Three defects, one root: a designated source treated as ambience. The other two
// had no opportunity to do harm until that first one happened — which is why this
// guard points at the EXISTING claim discipline rather than paraphrasing it (two
// paraphrases are two disciplines, the reflex claim-discipline.test.mjs already
// enforces for prepare-1-1).
//
// Why a doc guard and not a runtime check: what fails here is what the model is
// TOLD, and the telling lives in two files that drift independently (EN + FR).
// A UserPromptSubmit hook was weighed and deliberately NOT built — it fires
// before execution, so it can make a source salient but never prove it was read
// (see the plan's § "Deliberately out of scope").
//
// Reach: `CLAUDE.engine.md` joined the `merge` regime in this release, so unlike
// F18's era the constitution half now DOES arrive on a deployed brain. That is
// what makes writing the rule here worth anything at all.
// ═══════════════════════════════════════════════════════════════════════════

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (rel) => readFileSync(join(REPO_ROOT, rel), "utf8");

const HEADING_EN = /^#+ Level 1 — a source you are handed/m;
const HEADING_FR = /^#+ Niveau 1 : la source qu'on te tend/m;

// A constitution is the UNION of its two layers: the thin sacred file and the
// engine layer it @imports. Asserting on the union keeps the test correct
// wherever the directive ends up sitting — and the union is also the READING
// ORDER, which the placement test below depends on.
const CONSTITUTIONS = [
  { locale: "EN", layers: ["CLAUDE.md.template", "CLAUDE.engine.md"] },
  { locale: "FR", layers: ["templates/fr/CLAUDE.md.template", "templates/fr/CLAUDE.engine.md"] },
];

// ── The rules, each with the failure it prevents ───────────────────────────
// Every entry names a REAL defect from the 2026-08-08 session, so a future
// reader can tell what the pattern is for rather than deleting it as boilerplate.
const RULES_EN = [
  {
    why: "the handed-over source is OPENED, and the tool that opens it is named",
    pattern: /WebFetch/,
  },
  {
    why: "it is opened BEFORE any search fires — the ordering is the whole rule",
    pattern: /before any search/i,
  },
  {
    why: 'when the task is defined RELATIVE to the source ("complete this article"), the source IS the specification',
    pattern: /specification/i,
  },
  {
    why: "the levels below it are named IN ORDER, so 'first' is a position and not a vibe",
    pattern: /Grep[\s\S]*search_vault/,
  },
  {
    why: "a proper noun goes to exact search — a semantic search is the wrong instrument for it",
    pattern: /proper noun/i,
  },
  {
    why: "nothing negative is concluded before level 1 has been exhausted",
    pattern: /exhaust/i,
  },
  {
    why: "the corollary POINTS AT the existing claim discipline instead of paraphrasing it into a second one",
    pattern: /Claim discipline/,
  },
];

const RULES_FR = [
  { why: "the handed-over source is OPENED, and the tool that opens it is named", pattern: /WebFetch/ },
  { why: "it is opened BEFORE any search fires — the ordering is the whole rule", pattern: /avant toute recherche/i },
  {
    why: "when the task is defined RELATIVE to the source, the source IS the specification",
    pattern: /spécification/i,
  },
  {
    why: "the levels below it are named IN ORDER, so « d'abord » is a position and not a vibe",
    pattern: /Grep[\s\S]*search_vault/,
  },
  { why: "a proper noun goes to exact search — a semantic search is the wrong instrument for it", pattern: /nom propre/i },
  { why: "nothing negative is concluded before level 1 has been exhausted", pattern: /épuis/i },
  {
    why: "the corollary POINTS AT the existing claim discipline instead of paraphrasing it into a second one",
    pattern: /Discipline d'affirmation/,
  },
];

for (const { locale, layers } of CONSTITUTIONS) {
  const heading = locale === "FR" ? HEADING_FR : HEADING_EN;
  const rules = locale === "FR" ? RULES_FR : RULES_EN;

  test(`${locale} constitution has a source-first section at all`, () => {
    assert.match(layers.map(read).join("\n"), heading, "the discipline must have its own heading");
  });

  for (const { why, pattern } of rules) {
    test(`${locale} constitution carries the source-first discipline: ${why}`, () => {
      const section = docSection(layers.map(read).join("\n"), heading);
      assert.match(section, pattern, `the ${locale} constitution lost the rule — ${why}`);
    });
  }
}

// ── A rule about reading order must itself be read first ───────────────────
// The field defect is not that the brain lacked the rule, it is that it reached
// for `search_vault` before considering the URL in front of it. A "level 1"
// paragraph sitting BELOW the semantic-search routing is a rule the reader meets
// last, which is precisely the order that failed. So placement is asserted, not
// only presence — the same reflex as the markers-rule guard in F18.
for (const { locale, layers } of CONSTITUTIONS) {
  test(`${locale} constitution: the level-1 rule is placed ABOVE the vault's search routing`, () => {
    const text = layers.map(read).join("\n");
    const heading = locale === "FR" ? HEADING_FR : HEADING_EN;
    const vault = locale === "FR" ? /^#+ Vault — RAG sémantique/m : /^#+ Vault — semantic RAG/m;
    const at = text.search(heading);
    const vaultAt = text.search(vault);
    assert.notEqual(at, -1, "the level-1 rule must be there at the start of a line");
    assert.notEqual(vaultAt, -1, "the vault routing section must still be there to be placed against");
    assert.equal(at < vaultAt, true, "a level-1 rule read after the search routing is read too late");
  });
}

// ── The table a reader SCANS must name it too ──────────────────────────────
// Prose is read by whoever reads prose; the routing table is what a hurried
// reader scans. If its first rows are the semantic ones, the table teaches the
// exact order the prose just forbade.
for (const { locale, layers } of CONSTITUTIONS) {
  test(`${locale} constitution: the routing table lists the handed-over source before search_vault`, () => {
    const text = layers.map(read).join("\n");
    const row = /^\|.*WebFetch.*$/m;
    const searchRow = /^\|.*search_vault.*$/m;
    const at = text.search(row);
    assert.notEqual(at, -1, "the routing table must carry a row for a source the owner hands over");
    assert.equal(
      at < text.search(searchRow),
      true,
      "a table whose first row is the semantic search teaches the very order that failed in the field",
    );
  });
}
