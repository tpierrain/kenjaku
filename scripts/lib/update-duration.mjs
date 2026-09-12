// ─────────────────────────────────────────────────────────────────────────────
// update-duration.mjs — how much saying yes costs, in ONE sentence, in ONE place
// (#101).
//
// The defect it repairs is which number an owner reads. The consent message
// describes, at length and correctly, code being replaced on their machine, and
// the ONLY duration in it was the scary one — "a few minutes", the re-index case.
// So a non-technical reader could not tell whether yes costs them a minute or an
// afternoon, and an unknown cost is postponed. Postponing is what leaves a fleet
// several releases behind, which is the whole subject of #100 beside it.
//
// It lives in a module rather than in the two surfaces that say it — the
// `/update-engine` skill's step 1, read by an agent, and #100's offer, built by
// code — because a sentence typed twice is a sentence that drifts. Both surfaces
// QUOTE this one, and a test asserts the skill's shipped text still contains it.
//
// Three things it must carry, and the order is deliberate: the ordinary case
// first (that is the one that is true nearly every time), the exception named in
// the same breath rather than buried, and the reassurance last, because what an
// owner actually fears is not the wait.
//
// Phrasing rule, both locales: the engine is the visible actor, explicit subject,
// future tense — never a bare verb, which reads as an order given to the reader.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ⏱️ The figure is a MEASURED one, not an estimate: timed on a real brain during
 * the v5.3 release rehearsal (§10ter). If a later measurement disagrees, this
 * constant is what changes — never one of the surfaces that quote it.
 */
export const UPDATE_DURATION_SENTENCE =
  "The engine will usually be updated in about a minute; if the way your notes are indexed has changed, " +
  "it will also re-index them, which takes a few minutes more — and either way, nothing you have written is lost.";
