// ─────────────────────────────────────────────────────────────────────────────
// engine-doctrine-refresh.mjs — the engine's half of the constitution stops being
// frozen at install day (plan S5b). `CLAUDE.engine.md` sat in NO regime for the
// product's whole life: a doctrine rule written there reached fresh installs and
// nobody else. The field finding of 2026-08-08 measured it on a brain running the
// LATEST tag — 12 commits of doctrine, 11 391 bytes, +43 %, never delivered, with
// no error and no report.
//
// The THIRD merge family, after the skills (S2) and the scripts (S2b-3), and the
// thinnest of them. Everything shared is shared: the journey to the disk is
// `engine-merge-apply.mjs`'s, the decision is `engine-merge.mjs`'s nine rows, and
// WHICH file is the predicate exported by `engine-apply-plan.mjs` — imported here
// rather than re-declared, so the allowlist and the delivery cannot drift apart.
//
// What is genuinely this module's own is two ABSENCES, and its tests pin both:
//   • NO syntax gate. The scripts' twin defaults `verifyWrite` to `parsesAsModule`
//     because the brain EXECUTES those files at every session hook. Doctrine is
//     prose read by an agent: it parses as nothing, runs as nothing, and a gate
//     here would downgrade every merge it ever produced to `merge-unsafe` — it
//     would re-freeze the layer this slice exists to unfreeze.
//   • NO grouping. A skill is a subtree, so its report speaks about the directory;
//     there is exactly one constitution, so the file is its own subject.
//
// ⚠️ THIS HEADER CARRIED A CLAIM THAT IS NO LONGER TRUE, and it is kept here with its
// correction rather than deleted, because it recorded a real limit for a real while.
// It said: *this module unfreezes no ALREADY-DEPLOYED brain* — the file was in no
// regime, so no provenance was ever recorded, `mergeVerdict` could prove nothing about
// the bytes on disk, and it preserved them (`no-provenance`). True as written, and the
// reason the release was stopped two hours from publication.
//
// ✅ **S7 is the "ancestor machine" that sentence pointed at, and it shipped.** Nothing
// in THIS module changed: the heal works one level up, at the `recorded` INPUT
// (`engine-heal.mjs` proves the bytes against a table of every version the engine ever
// published; `reconcile-brain.mjs` computes it once and hands it down). So the honest
// statement today is that this module delivers to a deployed brain **exactly when the
// brain can prove its bytes** — which the fleet now can, for every file nobody edited.
// ─────────────────────────────────────────────────────────────────────────────
import { applyMergeGoverned } from "./engine-merge-apply.mjs";
import { selectMergeFiles } from "./engine-source.mjs";
import { ENGINE_DOCTRINE } from "./engine-apply-plan.mjs";

// The source files eligible for a merge-governed refresh: those the manifest
// DECLARES engine-owned AND that have this shape. An intersection with what the
// source actually ships, never a replay of the manifest: a brain whose manifest
// still names a file the engine has since retired must not be asked to read it.
export function selectMergeGovernedDoctrine({ sourceFiles, manifest }) {
  return selectMergeFiles(manifest, sourceFiles).filter((rel) => ENGINE_DOCTRINE.test(rel));
}

// ─── The doctrine's wiring onto the shared carrier ───────────────────────────
// `verifyWrite` is not passed AT ALL — see the header. Its absence is the design,
// not an omission, and the test named "prose is never syntax-gated" is what stops
// someone restoring it by copying the twin wholesale.
export function refreshEngineDoctrine({
  brainDir,
  sourceDir,
  sourceFiles,
  manifest,
  provenance = {},
  merge,
}) {
  const { refreshed, preserved, merged, conflicts, deliveredFileMap } = applyMergeGoverned({
    brainDir,
    sourceDir,
    sourceFiles,
    pairs: selectMergeGovernedDoctrine({ sourceFiles, manifest }).map((rel) => ({ rel, sourceRel: rel })),
    provenance,
    merge,
    // The constitution IS the subject: no grouping, the path is what the owner opens.
    groupOf: (rel) => rel,
  });
  return {
    doctrineRefreshed: refreshed,
    doctrinePreserved: preserved,
    doctrineMerged: merged,
    doctrineConflicts: conflicts,
    refreshedFileMap: deliveredFileMap,
  };
}
