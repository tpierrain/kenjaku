// ─────────────────────────────────────────────────────────────────────────────
// engine-base.mjs — THE IMMUTABLE BASE (plan S1). The bytes the engine last
// DELIVERED to an installed file, kept in the brain so an update can do more than
// compare two live files. Today `merge` owns a base and only ever uses it for an
// equality test, which leaves exactly two outcomes — clobber the owner, or abandon
// the file — and the engine chose abandon, permanently and silently.
//
// Two facts live here, and nothing else (pure: no fs, no verdicts, no merge):
//   • WHERE a base lives — a single `.engine-base/<rel>` tree, whatever family the
//     file belongs to. Three of the four `merge` families have no base home at all
//     today (the constitution, the allowlist, the four engine scripts), and the
//     staging tree that serves the fourth cannot host `CLAUDE.md` without becoming
//     a second mechanism.
//   • WHETHER the base on disk is PROVABLY the one the engine wrote — the recorded
//     sha256 becomes the proof, checked before any merge, instead of an equality
//     test between two live files.
// ─────────────────────────────────────────────────────────────────────────────
import { fingerprint, selectMergeFiles } from "./engine-source.mjs";

// The single tree. Named once, here, so no caller can grow a second convention.
export const BASE_PREFIX = ".engine-base/";

// A file's base path. A pure prefix, deliberately unconditional: a rel path that
// already looks like a base nests under it like any other, rather than being
// short-circuited into standing in for itself.
export function baseRelPath(rel) {
  return BASE_PREFIX + rel;
}

// Line endings are not authorship. This tree is engine-written and never hand-edited,
// but a brain cloned on Windows can have it rewritten LF→CRLF by git itself, and the
// recorded sha was taken on the LF bytes the engine delivered — so a normalized match
// is still a match, or the whole Windows fleet holds an unprovable base.
export const normalizeEol = (content) => content.split("\r\n").join("\n");

// Is the base we are about to merge FROM the one the engine actually delivered?
//   • no-provenance — nothing recorded: unprovable, whatever sits on disk. Not a
//     drift, just a file that never entered the regime. Reported first, because a
//     repair that seeds bytes without a record proves nothing either.
//   • absent — recorded, but no bytes: an incomplete tree, to re-seed.
//   • mismatch — bytes that hash elsewhere: the tree drifted, and feeding those to
//     a three-way merge would silently pick the wrong ancestor.
// WHEN the base moves, and to what. The rule S1 is named after, in one line: the base
// moves to what the update **delivered** to the installed file, never to the newest
// content it fetched. So the only input is the DELIVERY MAP the reconcile already
// returns ({rel: the bytes actually written}); reading the source tree instead is the
// false positive itself — `engine-skills/**` is a `replace` target whose bytes advance
// at every update while the installed skill stands still, and a base that ran ahead
// makes an untouched file look customized forever.
//
// A file the update did NOT deliver is simply absent from the map, so its base stands
// where it was: that is what makes "preserve" keep an ancestor worth merging from.
// Selection stays the manifest's `merge` regime — the rule provenance has always
// followed, restated here because this is the planner that could break it.
//
// Each entry carries everything the fs orchestrator needs and nothing it must
// recompute: where the bytes go, the bytes, and the sha that will PROVE them. The
// content and its digest leave here as one object so the tree and the record can never
// be advanced apart — the drift `verifyBase` would then report as a mismatch.
export function planBaseAdvance({ manifest, deliveredFileMap }) {
  return selectMergeFiles(manifest, Object.keys(deliveredFileMap)).map((rel) => ({
    rel,
    baseRel: baseRelPath(rel),
    content: deliveredFileMap[rel],
    // Hashed as delivered, never normalized: `buildProvenance` records the raw bytes at
    // install, and the two paths must agree or a Windows brain would flip its recorded
    // digest at its first update, for content nobody touched.
    sha: fingerprint(deliveredFileMap[rel]),
  }));
}

export function verifyBase({ recorded, baseContent }) {
  if (!recorded) return { usable: false, reason: "no-provenance" };
  if (baseContent === null || baseContent === undefined) return { usable: false, reason: "absent" };
  const matches = fingerprint(baseContent) === recorded || fingerprint(normalizeEol(baseContent)) === recorded;
  return matches ? { usable: true } : { usable: false, reason: "mismatch" };
}
