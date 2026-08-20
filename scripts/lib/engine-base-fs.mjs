// ─────────────────────────────────────────────────────────────────────────────
// engine-base-fs.mjs — THE FS ORCHESTRATOR of the immutable base (plan S1).
//
// `engine-base.mjs` answers the four questions and touches nothing: where a base
// lives, whether it is provable, where the first one comes from, when it moves.
// This module is the thin I/O that carries those answers to the disk — and it is
// deliberately the ONLY writer of `.engine-base/`, so no caller can grow a second
// convention for a tree whose whole value is being trustworthy.
//
// What it adds to what the engine already did: `provenance` has always recorded a
// base's DIGEST and never kept its BYTES, which leaves an update exactly one thing
// to do with it — an equality test, hence clobber or abandon. Keeping the bytes is
// what gives S2's three-way merge an ancestor to merge from.
//
// Two moments, one function. At INSTALL the brain seeds the tree from itself (no
// fetch: a file matching its recorded sha IS the last delivery). At UPDATE the tree
// ADVANCES to what was delivered — and seeds again, because no deployed brain holds
// a tree yet, so every update is also that brain's migration.
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { baseRelPath, planBaseAdvance, planBaseSeed } from "./engine-base.mjs";
import { recordSourceAndProvenance, selectMergeFiles } from "./engine-source.mjs";
import { listFilesRelPosix } from "./fs-walk.mjs";

// The tree as `verifyBase` needs to hear about it: bytes, or `null` for "no bytes"
// (its `absent`). Handed back exactly as they sit on disk — a Windows checkout's CRLF
// included — because normalizing here would hide the very difference the proof knows
// how to forgive, and the seed would then record content the brain never held.
export function readBaseTree({ brainDir, rels }) {
  return Object.fromEntries(
    rels.map((rel) => {
      const abs = join(brainDir, baseRelPath(rel));
      return [rel, existsSync(abs) ? readFileSync(abs, "utf8") : null];
    }),
  );
}

// The single writer. Parent directories are created as they are met: the tree mirrors
// the brain's own layout, so its depth is whatever the manifest names.
export function writeBaseEntries({ brainDir, entries }) {
  return entries.map(({ baseRel, content }) => {
    const abs = join(brainDir, baseRel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
    return baseRel;
  });
}

// The disk half of the seeding planner's candidate union: what the brain HOLDS, gated
// by the manifest's `merge` regime exactly as provenance is. The tree itself can never
// be a candidate — no `merge` glob names `.engine-base/…`, which is why `baseRelPath`
// can stay an unconditional prefix.
export function readInstalledMergeFiles({ brainDir, manifest }) {
  const rels = selectMergeFiles(manifest, listFilesRelPosix(brainDir));
  return Object.fromEntries(rels.map((rel) => [rel, readFileSync(join(brainDir, rel), "utf8")]));
}

// ADVANCE what this pass delivered, then SEED whatever the brain can still prove about
// itself. Both, always, and in that order: a brain that has never held a tree meets the
// two on the same update, and the advance has to land first or the seed would be asked
// about a file whose recorded sha already describes content the tree does not hold yet.
//
// `provenance` is the record as the manifest writer BESIDE this call is writing it (the
// same delivery, the same digests). Passing it in rather than re-deriving it is what
// keeps one fact with one owner: this module writes bytes, `reseedProvenance` writes
// shas, and the two are asserted to agree.
export function syncBaseTree({ brainDir, manifest, provenance = {}, deliveredFileMap = {} }) {
  const advance = planBaseAdvance({ manifest, deliveredFileMap });
  writeBaseEntries({ brainDir, entries: advance });

  // Fold the advance's own digests in, so a file just advanced reads as PROVABLE below
  // and is left alone — instead of being seeded a second time from an installed file
  // that may already have moved on.
  const recorded = { ...provenance, ...Object.fromEntries(advance.map((entry) => [entry.rel, entry.sha])) };
  const installedFileMap = readInstalledMergeFiles({ brainDir, manifest });
  const candidates = [...new Set([...Object.keys(installedFileMap), ...Object.keys(recorded)])];
  const { seeds, deferred } = planBaseSeed({
    manifest,
    provenance: recorded,
    installedFileMap,
    baseContentMap: readBaseTree({ brainDir, rels: candidates }),
  });
  writeBaseEntries({ brainDir, entries: seeds });

  // Reported by path, never in the order a directory walk happened to return: this is
  // read by a human, and from S4 on it is said out loud to the owner.
  const byPath = (a, b) => (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0);
  return {
    advanced: advance.map((entry) => entry.rel).sort(),
    seeded: seeds.map((seed) => seed.rel).sort(),
    deferred: [...deferred].sort(byPath),
  };
}

// The INSTALL composition root. Recording the source and the provenance without laying
// down the bytes they describe is how the fleet ended up with fifteen digests and no
// ancestor — so the two are one call, and an install cannot ship a brain without a tree.
export function recordSourceProvenanceAndBase({ brainDir, git }) {
  const manifest = recordSourceAndProvenance({ brainDir, git });
  syncBaseTree({ brainDir, manifest, provenance: manifest.provenance });
  return manifest;
}
