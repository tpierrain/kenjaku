// ─────────────────────────────────────────────────────────────────────────────
// skill-retirement.mjs — THE ENGINE'S ONLY SUBTRACTIVE DOOR (plan S6b, ADR 0039
// amending 0025). Everything else the engine does to a deployed brain is additive
// or a merge; this is the one path that ERASES, and it is shaped on ADR 0036's
// status-line retreat, the only removal that came before it:
//   • DECLARED — the caller reaches this from a `retired` tombstone in the manifest,
//     never from "the manifest no longer mentions it". An absence is what a
//     truncated fetch looks like; a tombstone is what a decision looks like.
//   • PROVENANCE-GUARDED — remove only what is provably ours, byte for byte. Every
//     doubt (no record, an edit, one file we never delivered) preserves, and names
//     the file that caused it, because the owner's next question is "which one?".
// The argument is the cost asymmetry, and 0036 already wrote it down: a leftover
// skill is cosmetic, deleting someone's work is not.
//
// Pure: the caller lists the directory and reads the bytes, this decides. No fs
// here, so the decision is testable without a brain on disk — and the delete
// itself stays in the one module that already answers for writes.
// ─────────────────────────────────────────────────────────────────────────────
import { verifyBase, INSTALLED_REFUSAL } from "./engine-base.mjs";

// Asked file by file, through `verifyBase` rather than a byte comparison of our own,
// and that is the load-bearing reuse: it forgives a LF→CRLF rewrite, which git does by
// itself on a Windows clone. Judge that as authorship and the whole Windows fleet keeps
// its retired skill forever. `INSTALLED_REFUSAL` turns its three refusals into the words
// the report already uses elsewhere — one vocabulary, so a file the merge calls
// `customized` and a file this preserves as `customized` are the same file.
export function decideSkillRetirement({ dir, files, provenance = {} }) {
  const blockers = files
    .map(({ rel, content }) => ({ rel, ...verifyBase({ recorded: provenance[rel], baseContent: content }) }))
    .filter(({ usable }) => !usable)
    .map(({ rel, reason }) => ({ rel, reason: INSTALLED_REFUSAL[reason] }))
    // A directory walk's order is an accident of the filesystem; the report is read by
    // a human. Sorted so the same brain never gets two different messages, and
    // locale-aware so `SKILL.md` files in among lowercase ones read alphabetically
    // rather than being herded to the front by their capital letter.
    .sort((a, b) => a.rel.localeCompare(b.rel));

  // The common case on the fleet, and it is neither of the other two: most brains never
  // had this skill. Reporting "preserved" would claim a rescue that never happened.
  if (files.length === 0) return { dir, verdict: "absent", blockers: [] };
  if (blockers.length > 0) return { dir, verdict: "preserve", blockers };
  return { dir, verdict: "remove", blockers: [] };
}
