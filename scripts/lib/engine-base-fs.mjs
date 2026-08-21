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
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { baseRelPath, planBaseAdvance, planBaseSeed } from "./engine-base.mjs";
import { engineDivergence } from "./engine-divergence.mjs";
import { globRoots } from "./glob-match.mjs";
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
//
// It walks the globs' ROOTS, not the brain (S4-4c). It used to list every file under
// `brainDir` and filter — which meant reading the owner's entire vault to look at files
// no `merge` glob can name: measured at ~2.3 µs per file, 18.5 ms for 8 000 notes, and
// paid at every session start once S4-4 put this on the SessionStart path. The set is
// unchanged by construction (every path a glob matches is under that glob's own static
// prefix) and by test — the equivalence is pinned against a full walk on a real disk.
export function readInstalledMergeFiles({ brainDir, manifest }) {
  const rels = selectMergeFiles(manifest, listFilesUnderRoots(brainDir, globRoots(manifest?.regimes?.merge ?? [])));
  return Object.fromEntries(rels.map((rel) => [rel, readFileSync(join(brainDir, rel), "utf8")]));
}

// A root is a directory to walk, a single file to take as-is, or absent — and `""` is
// the honest fallback `globRoots` returns when some glob begins with a wildcard and
// there is no prefix to start from.
function listFilesUnderRoots(brainDir, roots) {
  return roots.flatMap((root) => {
    const abs = join(brainDir, root);
    if (!existsSync(abs)) return [];
    if (root === "") return listFilesRelPosix(brainDir);
    return statSync(abs).isDirectory() ? listFilesRelPosix(abs, brainDir) : [root];
  });
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
  // No equal case: a rel appears at most once, so a comparator that spells one out is a
  // branch no input can reach — and an unreachable branch is a survivor by construction.
  const byPath = (a, b) => (a.rel < b.rel ? -1 : 1);
  return {
    advanced: advance.map((entry) => entry.rel).sort(),
    seeded: seeds.map((seed) => seed.rel).sort(),
    deferred: [...deferred].sort(byPath),
  };
}

// S4-3 — the standing state, read off the brain AS IT NOW IS. Both inputs come from
// the same disk read, deliberately: a divergence computed from the manifest we wrote
// earlier in the pass would describe a brain that existed halfway through the update
// (the finalize child rewrites that manifest after us).
//
// Fail-soft, like the two steps it sits beside: an unreadable manifest means we cannot
// say where the brain stands, and "cannot say" is silence, never a thrown error over an
// update that already succeeded and is already recorded.
export function readEngineDivergence({ brainDir }) {
  let manifest = null;
  try {
    manifest = JSON.parse(readFileSync(join(brainDir, "engine-manifest.json"), "utf8"));
  } catch {
    // Deliberately empty. An early `return []` stood here and said the same thing
    // twice: `engineDivergence` already answers "nothing to say" for a null manifest,
    // and a brain with no readable regimes selects no files to read either. The
    // measurement is what proved it — emptying this block changed no test, because
    // there was nothing here a caller could tell apart.
  }
  return engineDivergence({ manifest, installedFileMap: readInstalledMergeFiles({ brainDir, manifest }) });
}

// The INSTALL composition root. Recording the source and the provenance without laying
// down the bytes they describe is how the fleet ended up with fifteen digests and no
// ancestor — so the two are one call, and an install cannot ship a brain without a tree.
export function recordSourceProvenanceAndBase({ brainDir, git }) {
  const manifest = recordSourceAndProvenance({ brainDir, git });
  syncBaseTree({ brainDir, manifest, provenance: manifest.provenance });
  return manifest;
}
