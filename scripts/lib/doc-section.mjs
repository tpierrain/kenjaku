// ─────────────────────────────────────────────────────────────────────────────
// doc-section.mjs — slice ONE section out of a Markdown document: from its
// heading down to the next heading of the same or a higher level.
//
// Why the doc guards need this rather than a flat search over the file: asserting
// on a whole file lets a rule pass on words that were already there for other
// reasons (F18's first red run — "your FIRST reply of the session" matched
// /repl(y|ies)/, "contradictory rules" matched /contradict/). A rule that passes
// because of unrelated prose is a rule nobody is actually carrying. Slicing also
// asserts something a flat search cannot: that the rules live TOGETHER, as one
// discipline, instead of being scattered where no reader meets them as a whole.
//
// Extracted from claim-discipline.test.mjs when the identity guard needed the
// same cut: two guards slicing differently would judge two different documents.
// ─────────────────────────────────────────────────────────────────────────────

export function docSection(text, heading) {
  const start = text.search(heading);
  if (start === -1) return "";
  const level = (text.slice(start).match(/^#+/) ?? ["#"])[0].length;
  // Start looking for the NEXT heading only after the current heading's own line —
  // otherwise the very first thing found is the heading we started from, and every
  // section slices down to a single "#".
  const nl = text.indexOf("\n", start);
  if (nl === -1) return text.slice(start);
  const rest = text.slice(nl + 1);
  const end = rest.search(new RegExp(`^#{1,${level}} `, "m"));
  return end === -1 ? text.slice(start) : text.slice(start, nl + 1 + end);
}
