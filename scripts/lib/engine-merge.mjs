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

// The table, in the order a reader needs it. `installed` is null/undefined when the
// brain holds nothing, `recorded`/`baseContent` are the ancestor and its proof,
// `candidate` is what this update would deliver, and `merge({base, ours, theirs})`
// returns `{clean, merged}` — the marked-up text included, since a conflict's whole
// value to the owner is seeing the region that clashed.
//
//   1. nothing installed        → absent-install : deliver it
//   2. no provable base, but the brain already holds the candidate → nothing to do
//   3. no provable base         → preserve, under the refusal's own name
//   4. untouched, up to date    → unchanged
//   5. untouched, outdated      → refresh (fast-forward — today's behaviour)
//   6. edited, engine stood still → the owner's edit simply stands
//   7. both moved, no clash     → merge
//   8. both moved, they clash   → conflict: touch nothing, hand over the markers
export function mergeVerdict({ installed, recorded, baseContent, candidate, merge }) {
  if (installed === null || installed === undefined) {
    return { verdict: "absent-install", write: candidate, deliver: candidate };
  }

  const proof = verifyBase({ recorded, baseContent });
  if (!proof.usable) {
    // A merge with no ancestor is not a merge — but "we cannot prove anything" is
    // not the same as "there is something to preserve": a brain holding the exact
    // bytes this update carries needs nothing, and reporting it as preserved puts a
    // phantom on the owner's report at every single update, forever.
    if (same(installed, candidate)) return { verdict: "unchanged", reason: "no-base" };
    // The three refusals stay apart because their repairs differ: a file that never
    // entered a regime, an incomplete tree, a drifted one.
    return { verdict: "preserve", reason: proof.reason };
  }

  // Line endings are not authorship: a Windows checkout can rewrite the installed
  // file LF→CRLF with nobody touching a word, and reading that as an edit would drag
  // the whole Windows fleet into merges — then conflicts — over whitespace.
  if (same(installed, baseContent)) {
    return same(installed, candidate)
      ? { verdict: "unchanged" }
      : { verdict: "refresh", write: candidate, deliver: candidate };
  }

  // The owner edited. If the engine did not, there is nothing to merge IN: their
  // edit stands, and no sidecar is dropped — today's code offers one here at every
  // update, byte-identical to the base, which is pure noise and teaches owners to
  // ignore the one sidecar that will matter on row 8.
  if (same(candidate, baseContent)) return { verdict: "unchanged", reason: "owner-edit-stands" };

  const { clean, merged } = merge({ base: baseContent, ours: installed, theirs: candidate });
  // A conflict delivers NOTHING. An advanced base would claim the engine shipped
  // content this file never received, and the next merge would read that claim as
  // the owner having deleted the update.
  if (!clean) return { verdict: "conflict", sidecar: merged };
  // The one row where the two differ. A merge whose result equals what is already on
  // disk is still a merge — the base must move all the same, or the next update would
  // re-merge content nobody is missing. Whether identical bytes are re-written is the
  // fs layer's call: one place decides that, and it is not this one.
  return { verdict: "merge", write: merged, deliver: candidate };
}
