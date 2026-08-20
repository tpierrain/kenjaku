// ─────────────────────────────────────────────────────────────────────────────
// engine-merge.mjs — THE VERDICT that ends "preserve means abandon" (plan S2a).
//
// The engine has always recorded a base's DIGEST and never kept its BYTES, which
// leaves an update exactly one thing to do with it — an equality test — hence two
// possible outcomes: clobber the owner, or abandon the file. It chose abandon,
// permanently and silently. S1 put the bytes on disk; this module is the decision
// that finally uses them, and it is pure: the caller reads, the caller writes, and
// the merge itself arrives as a function (its only impure part lives next door in
// `engine-merge-git.mjs`, so the mutation score here keeps meaning something).
//
// 🛑 THE TRAP THIS MODULE EXISTS TO MAKE UNMISSABLE:
//    the disk receives the MERGE, the base advances to the CANDIDATE.
// They are different bytes, and the plumbing S1 built calls both "delivered". So a
// verdict carries them apart — `write` (what the installed file becomes) and
// `deliver` (the engine content the base and the provenance move to) — and they
// disagree on exactly one row of the table below. Were `deliver` ever to carry the
// merged bytes, the next update would find `ours === base`, read the file as
// untouched, and fast-forward straight over the owner's edit: this chantier's own
// defect, reintroduced by its fix.
// ─────────────────────────────────────────────────────────────────────────────
import { normalizeEol, verifyBase } from "./engine-base.mjs";

const same = (a, b) => normalizeEol(a) === normalizeEol(b);

// ONE predicate, three questions — "are these bytes the ones the engine recorded?"
// asked of the installed file, of the candidate, and of the base itself. There is
// therefore no second definition of the proof to keep in step (`planBaseSeed`
// already asks it this way), and line endings stay forgiven everywhere at once.
const matchesRecord = (recorded, content) => verifyBase({ recorded, baseContent: content }).usable;

// The table, in the order a reader needs it. `installed` is null/undefined when the
// brain holds nothing, `recorded` is the provenance sha, `baseContent` the ancestor's
// bytes (which may not be on disk yet), `candidate` what this update would deliver,
// and `merge({base, ours, theirs})` returns `{clean, merged}` — the marked-up text
// included, since a conflict's whole value to the owner is seeing what clashed.
//
//   1. nothing installed          → absent-install : deliver it
//   2. nothing recorded, and the brain already holds the candidate → nothing to do
//   3. nothing recorded           → preserve : we cannot prove anything either way
//   4. untouched, up to date      → unchanged
//   5. untouched, outdated        → refresh (fast-forward — today's behaviour)
//   6. edited, engine stood still → the owner's edit simply stands
//   7. edited, engine moved, NO usable ancestor → preserve + the sidecar (today's)
//   8. edited, engine moved, no clash → merge
//   9. edited, engine moved, clash    → conflict: touch nothing, hand the markers over
//
// 🛑 THE SEPARATION THAT MAKES THIS SHIPPABLE (corrected 2026-08-20, before it went
// out): the base's BYTES are needed only to MERGE. The recorded sha alone answers
// rows 4-6. `reconcileBrain` runs the skill refresh BEFORE `syncBaseTree` lays the
// tree down, so on the first update of every brain installed before S1 there is no
// ancestor at all — and a table that asked the bytes for everything would have
// frozen every skill on the fleet, on the very release that exists to unfreeze them.
export function mergeVerdict({ installed, recorded, baseContent, candidate, merge }) {
  if (installed === null || installed === undefined) {
    return { verdict: "absent-install", write: candidate, deliver: candidate };
  }

  if (!recorded) {
    // "We cannot prove anything" is not "there is something to preserve": a brain
    // holding the exact bytes this update carries needs nothing, and reporting it as
    // preserved puts a phantom on the owner's report at every update, forever.
    if (same(installed, candidate)) return { verdict: "unchanged", reason: "no-base" };
    return { verdict: "preserve", reason: "no-provenance" };
  }

  // Untouched — proven by the sha, so this holds on a brain that has never carried a
  // base tree. Line endings are not authorship: a Windows checkout can rewrite the
  // file LF→CRLF with nobody touching a word, and reading that as an edit would drag
  // the whole Windows fleet into merges, then conflicts, over whitespace.
  if (matchesRecord(recorded, installed)) {
    return same(installed, candidate)
      ? { verdict: "unchanged" }
      : { verdict: "refresh", write: candidate, deliver: candidate };
  }

  // The owner edited. If the engine did not, there is nothing to merge IN: their edit
  // stands, and no sidecar is dropped — today's code offers one here at every update,
  // byte-identical to the base, which is pure noise and teaches owners to ignore the
  // one sidecar that will matter when a real conflict comes.
  if (matchesRecord(recorded, candidate)) return { verdict: "unchanged", reason: "owner-edit-stands" };

  // Only here do the ancestor's BYTES matter. Without a usable one this degrades to
  // exactly today's behaviour — keep the owner's file, offer the engine's version
  // beside it — and the merge arrives at the next update, once the tree exists.
  if (!verifyBase({ recorded, baseContent }).usable) {
    return { verdict: "preserve", reason: "customized", sidecar: candidate };
  }

  const { clean, merged } = merge({ base: baseContent, ours: installed, theirs: candidate });
  // A conflict delivers NOTHING. An advanced base would claim the engine shipped
  // content this file never received, and the next merge would read that claim as
  // the owner having deleted the update.
  if (!clean) return { verdict: "conflict", sidecar: merged };
  // The one row where `write` and `deliver` differ. A merge whose result equals what
  // is already on disk is still a merge — the base must move all the same, or the next
  // update would re-merge content nobody is missing. Whether identical bytes are
  // re-written is the fs layer's call: one place decides that, and it is not this one.
  return { verdict: "merge", write: merged, deliver: candidate };
}
