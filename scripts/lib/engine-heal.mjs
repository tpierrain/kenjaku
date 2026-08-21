// ─────────────────────────────────────────────────────────────────────────────
// engine-heal.mjs — THE HEAL that unfreezes brains installed before v5.0.0 (plan
// S7 of v5-unfreezes-the-existing-fleet-action.md).
//
// `CLAUDE.engine.md` was in NO regime at any published tag, so no deployed brain
// carries provenance for it, and `mergeVerdict` answers `preserve/no-provenance`
// forever — it short-circuits on `!recorded` BEFORE `verifyBase` ever runs
// (engine-merge.mjs:59). Teaching `verifyBase` a second source would heal nothing
// on the merge path; handing it a `recorded` the brain can PROVE heals every
// consumer at the one place they all read from.
//
// 🛑 THE PROOF IS MEMBERSHIP, NOT ARITHMETIC. A sha is recorded only when the
// installed bytes are RECOGNISED in a table of every version the engine ever
// published — never invented, never derived from the installed bytes themselves.
// That distinction is the only thing standing between this module and silently
// telling the engine that an owner's edited file is untouched, which would let a
// future update clobber the edit instead of preserving it.
//
// PURE: no fs, no network — the table and the installed bytes are handed in.
// ─────────────────────────────────────────────────────────────────────────────
import { fingerprint, selectMergeFiles } from "./engine-source.mjs";
import { normalizeEol } from "./engine-base.mjs";

// One rel, one verdict. Matches the raw bytes first, then their EOL-normalized
// form (a Windows checkout, same story as `verifyBase`) — and either way the
// digest carried forward is the KEY THAT MATCHED, the bytes the engine actually
// shipped, never a digest computed from the installed content.
function healOne(rel, content, table) {
  const versions = table?.files?.[rel];
  if (!versions) return null;
  const raw = fingerprint(content);
  const digest = raw in versions ? raw : fingerprint(normalizeEol(content));
  const entry = versions[digest];
  return entry ? { rel, digest, ...entry } : null;
}

export function healProvenance({ manifest, provenance = {}, installedFileMap = {}, table = {} }) {
  // A recorded fact is never re-derived: the merge regime gates candidacy, a
  // prior provenance entry removes it — even when the disk matches a DIFFERENT
  // published version, the record is the truth, not the disk.
  const unrecorded = selectMergeFiles(manifest, Object.keys(installedFileMap)).filter(
    (rel) => !(rel in provenance),
  );

  // Reported by path, never in the order the caller's map happened to be built: this
  // is read by a human and said out loud to the owner.
  // No equal case, and `<` vs `<=` is a NAMED EQUIVALENT: the rels come from object
  // keys, so one cannot appear twice and the branch is unreachable by construction —
  // the same shape, and the same reasoning, as `syncBaseTree`'s own comparator.
  const healed = unrecorded
    .map((rel) => healOne(rel, installedFileMap[rel], table))
    .filter(Boolean)
    .sort((a, b) => (a.rel < b.rel ? -1 : 1));

  return {
    // The input provenance PLUS what got healed — never a fresh map, or a brain
    // updating from a source with no table would have its recorded facts wiped.
    provenance: { ...provenance, ...Object.fromEntries(healed.map((h) => [h.rel, h.digest])) },
    baseRefs: Object.fromEntries(healed.map((h) => [h.rel, h.since])),
    healed: healed.map(({ rel, since, locale }) => ({ rel, since, locale })),
  };
}
