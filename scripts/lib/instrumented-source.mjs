// ─────────────────────────────────────────────────────────────────────────────
// instrumented-source.mjs — telling the repository's own bytes from a mutation
// runner's rewrite of them.
//
// A handful of this repo's guards do not test behaviour at all: they read the
// ENGINE'S SOURCE TEXT and judge it (the byte fingerprints of a release's merge
// files, which scripts spawn which, which modules still compose a child-process
// request at the call site). Mutation testing's whole job is to rewrite that same
// text — 157 files, ~10 000 mutants — so under a mutation run those guards are
// reading a copy that is not the repository's, and they fail saying so in terms
// that read exactly like a real defect.
//
// It has cost real time: the nightly whole-engine measurement failed every night
// from 2026-08-22, and half of what it reported was this (the other half a shallow
// clone). A guard cannot be right about text that has been rewritten underneath it,
// so it stands down and SAYS SO, which is the one outcome that is neither a false
// red nor a silent green.
//
// The detector matches the runner's HASHED identifiers, never the bare word: this
// module is itself engine source, read by the very guards it protects, and a
// detector that fired on prose about instrumentation would silence all of them on a
// clean checkout with nothing at all to see. Its own test pins that.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * What StrykerJS injects into every file it instruments: a namespace, a coverage
 * recorder and the mutant switch, each suffixed with the run's hash — `stryNS_`
 * followed by five hex digits. All three, because a file can carry one without the
 * others. And written here WITHOUT its hash on purpose: spelled in full, this very
 * comment would match, and the detector would report itself. Its test pins that.
 */
const MARKER = /\bstry(?:NS|Cov|MutAct)_[0-9a-f]{4,}\b/;

/**
 * Has this text been rewritten by the mutation runner?
 *
 * Coerced rather than type-checked, and that is the deliberate direction: a caller
 * that forgot the encoding hands a Buffer, and instrumented bytes are instrumented
 * whatever their container. Standing down on a Buffer costs one unasked question;
 * judging it costs a red that reads exactly like a real defect. `null`/`undefined`
 * become the empty string, so nothing here throws.
 */
export function isInstrumented(source) {
  return MARKER.test(String(source ?? ""));
}

/**
 * Why a source-reading guard must stand down, or `null` when it may judge.
 *
 * @param {Array<{name: string, source: string}>} entries the texts the guard is about to read
 * @returns {string | null} a sentence for `t.skip(...)`, naming the rewritten files
 */
export function instrumentationStandDown(entries) {
  const rewritten = entries.filter(({ source }) => isInstrumented(source)).map(({ name }) => name);
  if (rewritten.length === 0) return null;
  return (
    "the mutation runner has rewritten the engine's source text " +
    `(${rewritten.join(", ")}), and this guard judges source text: it cannot tell the ` +
    "repository's bytes from an instrumented copy of them, so it stands down rather than " +
    "report a defect that is not there"
  );
}
