// ─────────────────────────────────────────────────────────────────────────────
// plural.mjs — the agreement rule, in ONE place.
//
// F14 of the v5.0.0 code review named what `(s)` really is: the hedge of a sentence
// that does not know what it is describing. Every sentence in this engine that carries
// one DOES know — it is holding the array. S11 then found six more of them in the
// update report alone, three lines under a line that had already been fixed, which is
// the shape a rule copied by hand always ends up in.
//
// So the rule lives here and is imported, rather than re-typed a fourth time: the
// update report, the session status line and the locale-drift guard all speak to the
// same owner, and they now agree with themselves the same way.
//
// Pure, no I/O, no dependency. Zero takes the plural, as English does.
// ─────────────────────────────────────────────────────────────────────────────

/** "1 engine file" / "2 engine files" — the count and its noun, agreeing. */
export function countOf(n, noun) {
  return `${n} ${agreeing(n, noun)}`;
}

/**
 * The noun alone, for a sentence that shows its count as a LIST rather than a number:
 * "new engine skill installed: coach" / "new engine skills installed: coach, sync".
 */
export function agreeing(n, noun) {
  return `${noun}${n === 1 ? "" : "s"}`;
}

/** The pronoun that follows a count, or the fix above just moves the tell one clause right. */
export function itOrThem(n) {
  return n === 1 ? "it" : "them";
}
