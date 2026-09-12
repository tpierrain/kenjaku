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
 * ⏱️ The figure is CONFIRMED BY MEASUREMENT, and it is this constant that carries
 * it. Timed for v5.3 on a real brain (a copy of one installed at v3.4.0, 30 notes)
 * running the actual update, nothing stubbed: **9 s** with no re-index, **24 s**
 * with one. If a later run disagrees, this line is what changes — never one of the
 * surfaces that quote it.
 *
 * 🗣️ **The sentence states the measured RANGE, and that is the owner's own call**
 * _(2026-09-12: « intègre la vraie durée dans ce cas => (entre 10 secondes et moins
 * d'1 minute) »)_. An earlier draft rounded it to "about a minute" to stay on the
 * safe side; the range is better, because it is what actually happened and it still
 * has room for what the stopwatch could not see — that brain's dependencies were
 * already installed, and a cold `npm install` on a slow line is what fills the rest
 * of the minute. A duration an owner beats is a promise kept.
 *
 * 🔎 And it hedges on purpose. Whether a given update will re-index is NOT knowable
 * before the swap: the target's `indexSchemaVersion` lives in the launcher's own
 * manifest, which the update reads only after cloning it, and the check does one
 * `git ls-remote` on purpose. Reading it over the network beforehand would work on
 * GitHub and nowhere else — and would still not give a figure, since a re-index
 * takes as long as the vault is big. So "usually" is the honest word, not a
 * rounding of one.
 */
export const UPDATE_DURATION_SENTENCE =
  "The engine will usually be updated in between 10 seconds and under a minute; if the way your notes are " +
  "indexed has changed, it will also re-index them, which adds a few minutes on a big set of notes — and " +
  "either way, nothing you have written is lost.";

/**
 * 🇫🇷 The French twin, shipped in `templates/fr/**`. A SECOND constant rather than
 * a translation done at rendering time, and for this module's own reason: a
 * sentence re-invented on each rendering is a sentence nobody can review. It is
 * the owner's to correct — here and in the French skill, in one commit.
 *
 * The phrasing rule bites hardest here, which is why the subject is explicit: in a
 * pro-drop language a subjectless present ("sera mis à jour…" with no actor) reads
 * as an instruction aimed at the reader rather than a description of what the
 * engine does. No em dash either: that is the French typography rule, not a slip.
 */
export const UPDATE_DURATION_SENTENCE_FR =
  "Le moteur sera en général mis à jour en 10 secondes à moins d'une minute ; si la façon dont tes notes " +
  "sont indexées a changé, il les réindexera aussi, ce qui ajoute quelques minutes sur un gros ensemble de " +
  "notes, et dans tous les cas, rien de ce que tu as écrit n'est perdu.";
