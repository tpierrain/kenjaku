import { test } from "node:test";
import assert from "node:assert/strict";

import { docSection } from "./doc-section.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// doc-section — the cut every doc guard reads through. It had no test of its
// own: both guard families exercised it only indirectly, against real
// documents where a degraded slice still happened to contain the words they
// were looking for. That is the fiction the file exists to prevent, one level
// up — a slicer that quietly returns the whole document turns every sliced
// guard back into the flat search it was extracted from, and nothing goes red.
// So: exact slices, asserted whole.
// ═══════════════════════════════════════════════════════════════════════════

const DOC = [
  "# Title",
  "",
  "Intro prose.",
  "",
  "## Identity discipline",
  "",
  "Rule 1.",
  "",
  "### A sub-rule",
  "",
  "Still inside the section.",
  "",
  "## Claim discipline",
  "",
  "Rule elsewhere.",
  "",
].join("\n");

test("docSection — cuts at the next heading of the SAME level, sub-headings included", () => {
  assert.equal(
    docSection(DOC, /^## Identity discipline/m),
    ["## Identity discipline", "", "Rule 1.", "", "### A sub-rule", "", "Still inside the section.", "", ""].join(
      "\n",
    ),
  );
});

test("docSection — a HIGHER-level heading ends the section too", () => {
  const doc = ["## Section", "", "Body.", "", "# Next chapter", "", "Elsewhere.", ""].join("\n");
  assert.equal(docSection(doc, /^## Section/m), ["## Section", "", "Body.", "", ""].join("\n"));
});

test("docSection — the LAST section runs to the end of the document", () => {
  assert.equal(
    docSection(DOC, /^## Claim discipline/m),
    ["## Claim discipline", "", "Rule elsewhere.", ""].join("\n"),
  );
});

test("docSection — a heading that is not there is an EMPTY slice, never a stray tail", () => {
  // The guards read this as "the section is missing" and go red. Anything else
  // — the last character of the file, a fragment — is a rule judged against
  // text it has nothing to do with.
  assert.equal(docSection(DOC, /^## Nowhere to be found/m), "");
});

test("docSection — a document ending ON its heading line, with no newline after it", () => {
  const doc = "# Title\n\nProse.\n\n## Trailing heading";
  assert.equal(docSection(doc, /^## Trailing heading/m), "## Trailing heading");
});

test("docSection — a pattern matching mid-line falls back to level 1, not to the next '#' it finds", () => {
  // The heading level is read at the START of the match. A pattern that lands
  // mid-line has no leading '#' there, and the fallback must be the widest
  // level (1) — reading a deeper '#' further down would cut the section at a
  // sub-heading and hide half of it from the guard.
  const doc = ["Prose mentioning Identity discipline here.", "", "### Deep", "", "x", "", "# Chapter", "", "y", ""].join(
    "\n",
  );
  assert.equal(
    docSection(doc, /Identity discipline here\./),
    ["Identity discipline here.", "", "### Deep", "", "x", "", ""].join("\n"),
  );
});
