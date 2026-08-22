// ─────────────────────────────────────────────────────────────────────────────
// engine-base.mjs — THE IMMUTABLE BASE (plan S1). The bytes the engine last
// DELIVERED to an installed file, kept in the brain so an update can do more than
// compare (today `merge` owns a base and only ever uses it for an equality test,
// which leaves exactly two outcomes — clobber the owner, or abandon the file — and
// the engine chose abandon, permanently and silently).
//
// Four facts live here, in the order a reader needs them, and nothing else
// (pure: no fs, no verdicts, no merge):
//   • WHERE a base lives — a single `.engine-base/<rel>` tree, whatever family the
//     file belongs to. Three of the four `merge` families have no base home at all
//     today (the constitution, the allowlist, the four engine scripts), and the
//     staging tree that serves the fourth cannot host `CLAUDE.md` without becoming
//     a second mechanism.
//   • WHETHER the base on disk is PROVABLY the one the engine wrote — the recorded
//     sha256 becomes the proof, checked before any merge, instead of an equality
//     test between two live files.
//   • WHERE THE FIRST ONE COMES FROM — the migration: a brain seeds the tree from
//     itself, because a file still matching its recorded sha IS the last delivery.
//   • WHEN a base MOVES — to what was delivered, never to what was fetched.
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

// The OTHER file the engine derives from a rel: the version it is offering, dropped
// beside the owner's. Named here, beside `baseRelPath`, for the same reason and by the
// same rule — it was spelled inline in four places, and S10-QA found what that costs:
// a `merge` glob matches `SKILL.md.new` as happily as `SKILL.md`, so every sidecar was
// counted as an engine file the brain was "holding back", and the session nudge named,
// to the owner, a file the engine itself had just created.
//
// So the suffix and the question "is this rel a sidecar?" now have exactly one home,
// and no reader has to trust that four string literals still agree.
export const SIDECAR_SUFFIX = ".new";

export function sidecarPath(rel) {
  return rel + SIDECAR_SUFFIX;
}

export function isSidecarRel(rel) {
  return rel.endsWith(SIDECAR_SUFFIX);
}

// Line endings are not authorship. This tree is engine-written and never hand-edited,
// but a brain cloned on Windows can have it rewritten LF→CRLF by git itself, and the
// recorded sha was taken on the LF bytes the engine delivered — so a normalized match
// is still a match, or the whole Windows fleet holds an unprovable base.
export const normalizeEol = (content) => content.split("\r\n").join("\n");

// The mirror, and it exists because a Windows brain's RECORD was taken over CRLF
// bytes: the installer digests what it wrote, and what it wrote came from a working
// tree git had already rewritten. Normalising FIRST is not a flourish — over bytes
// that are already CRLF, a bare `split("\n")` yields `\r\r\n`, a byte-state nothing in
// the fleet holds and whose digest would miss for a reason nobody could see.
export const crlfify = (content) => normalizeEol(content).split("\n").join("\r\n");

// WHICH byte-state IS the record — a different question from `verifyBase`'s, and
// deliberately an UNFORGIVING one.
//
// `verifyBase` answers *"do these bytes match?"* and forgives EOL to do it, which is
// right when the answer is a yes/no about bytes already on disk. It is useless when the
// answer has to BE bytes: the ancestor fetch, on the miss path, holds a row it has not
// proved and must write back the exact byte-state the record was taken over. A forgiving
// match cannot say which of the two that was, and writing the wrong one puts an ancestor
// in `.engine-base/` that provably is not the record.
//
// So: raw first, then the CRLF form, and null rather than a guess. The row that answers
// IS the delivered content — a MEMBERSHIP proof, never a derivation, and never taken
// from the installed bytes (those are the owner's, and trusting them is the clobber this
// whole mechanism exists to avoid). A digest cannot be un-digested, which is why the
// caller must walk candidates at all instead of resolving the row directly.
export function recordedVariant({ recorded, content }) {
  if (!recorded || content === null || content === undefined) return null;
  if (fingerprint(content) === recorded) return content;
  const crlf = crlfify(content);
  return fingerprint(crlf) === recorded ? crlf : null;
}

// Is the base we are about to merge FROM the one the engine actually delivered?
//   • no-provenance — nothing recorded: unprovable, whatever sits on disk. Not a
//     drift, just a file that never entered the regime. Reported first, because a
//     repair that seeds bytes without a record proves nothing either.
//   • absent — recorded, but no bytes: an incomplete tree, to re-seed.
//   • mismatch — bytes that hash elsewhere: the tree drifted, and feeding those to
//     a three-way merge would silently pick the wrong ancestor.
export function verifyBase({ recorded, baseContent }) {
  if (!recorded) return { usable: false, reason: "no-provenance" };
  if (baseContent === null || baseContent === undefined) return { usable: false, reason: "absent" };
  const matches = fingerprint(baseContent) === recorded || fingerprint(normalizeEol(baseContent)) === recorded;
  return matches ? { usable: true } : { usable: false, reason: "mismatch" };
}

// The three refusals above, asked of the INSTALLED file instead of the base, and
// renamed to what they mean there — the repairs differ, so the words must: a
// customized file waits for a delivery, a missing record waits for a regime, a
// deleted file waits for nothing.
//
// Exported because S4 asks `verifyBase` the very same question — "would these
// installed bytes make a provable base?" — and answers the owner with these words.
// One vocabulary: a file the seeder defers as `customized` and a file the report
// calls `customized` must be the same file, or the two halves of the promise
// (kept for you / here is how far behind) would disagree in public.
export const INSTALLED_REFUSAL = {
  "no-provenance": "no-provenance",
  absent: "not-installed",
  mismatch: "customized",
};

// WHERE THE FIRST BASE COMES FROM. Every brain in the fleet was installed before this
// tree existed, so the advance rule below has nothing to move until one appears — and
// it does not have to be fetched. The measurement on the deployed brains is what makes
// the migration cheap: a file whose installed bytes still match their recorded sha IS,
// by definition, the content the engine last delivered, so the brain seeds its own tree
// from itself. 13 of 15 recorded entries qualified on the live brain; the two that did
// not are the owner's edits.
//
// 🛑 AND THOSE TWO NEVER ACQUIRE AN ANCESTOR — say it plainly, because this comment used
// to claim they would "seed from the fetched copy at their next delivery", and there is
// no such path. A preserved customization is never DELIVERED (row 7 returns no `deliver`),
// so `planBaseAdvance` never moves its base; and it cannot be seeded from the fetched copy
// either, because that copy is `theirs`, not the ancestor — merging against it would
// silently discard everything the engine shipped between the install and now. So a file
// edited BEFORE this release stays at preserve + sidecar, permanently, and the `deferred`
// list says `customized` so the owner is told rather than left guessing. Files edited
// FROM this release on merge normally: their base is on disk before the edit happens.
// Pinned by `release-fixture-refresh.test.mjs`, "a skill edited BEFORE this release never
// acquires an ancestor" — including that a second update reaches the same verdict.
//
// The rule is not "seed when absent" but "seed whenever the tree cannot be PROVEN", so
// a base that drifted is repaired by the same pass. And the proof asked of the installed
// file is `verifyBase` itself: "would these bytes make a provable base?" is exactly the
// seeding question, which is why there is no second definition of it here.
//
// Candidates are the recorded entries UNION what the brain holds: a file the owner
// deleted is recorded but not installed, and a planner that walked only the disk would
// report nothing about it at all. The manifest's `merge` regime gates both, as ever.
export function planBaseSeed({ manifest, provenance, installedFileMap, baseContentMap = {} }) {
  const candidates = [...new Set([...Object.keys(installedFileMap), ...Object.keys(provenance)])];
  const seeds = [];
  const deferred = [];
  for (const rel of selectMergeFiles(manifest, candidates)) {
    const recorded = provenance[rel];
    // Already provable → the truth is on disk. Re-seeding it would overwrite a correct
    // ancestor with an installed file the owner may have edited since.
    if (verifyBase({ recorded, baseContent: baseContentMap[rel] }).usable) continue;
    const asBase = verifyBase({ recorded, baseContent: installedFileMap[rel] });
    // Seeded with the bytes AS THEY ARE on disk (a Windows checkout's CRLF included):
    // `verifyBase` proves either form, and inventing normalized bytes the brain never
    // held would make the base a fiction. No sha travels with a seed — the record
    // already exists and already matches, and a second writer for one fact is drift.
    if (asBase.usable) seeds.push({ rel, baseRel: baseRelPath(rel), content: installedFileMap[rel] });
    else deferred.push({ rel, reason: INSTALLED_REFUSAL[asBase.reason] });
  }
  return { seeds, deferred };
}

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
