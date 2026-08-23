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

import { baseRelPath, isSidecarRel, isStrayArtifactRel, planBaseAdvance, planBaseSeed } from "./engine-base.mjs";
import { engineDivergence } from "./engine-divergence.mjs";
import { globRoots } from "./glob-match.mjs";
import { recordSourceAndProvenance, reseedBaseRefs, reseedProvenance, selectMergeFiles } from "./engine-source.mjs";
import { installRef } from "./engine-version.mjs";
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
//
// 🚨 `unreadable` — THE OPT-IN COLLECTOR (S5, second pass of the v5.0.0 review). One file
// this process cannot read (a bad umask, a locked file, a sync client's placeholder) used
// to deny the whole answer, and both surfaces that ask this question swallow the throw —
// so the report went blank and nothing distinguished "nothing held back" from "could not
// look". Hand an array and the unreadable rels are set aside into it, every other file
// still judged.
//
// OPT-IN on purpose: `syncBaseTree` reads the same files to decide what to WRITE, and a
// seeder that quietly skipped a file it could not read would record an ancestor for a
// brain it never saw. Silence is only ever safe for a caller that DESCRIBES.
export function readInstalledMergeFiles({ brainDir, manifest, unreadable = null }) {
  // 🛑 Sidecars are filtered BEFORE the glob decides, because the glob cannot tell them
  // apart: `.claude/skills/**` matches `SKILL.md.new` exactly as well as `SKILL.md`
  // (S10-QA, on the real v3.6.0 tree). A sidecar is the engine's own offer, loaded by
  // nothing — counting it makes the brain claim to hold back a file it has never held.
  //
  // T6 — and the same sentence is true of somebody ELSE's leftovers: an editor's `.bak`,
  // vim's swap, a merge tool's `.orig`, the OS's `.DS_Store`. Filtered HERE rather than in
  // the report, because nothing downstream should ever have been asked about a file the
  // engine cannot deliver — not the heal, not the ancestor fetch, not the base seed.
  const onDisk = listFilesUnderRoots(brainDir, globRoots(manifest?.regimes?.merge ?? [])).filter(
    (rel) => !isSidecarRel(rel) && !isStrayArtifactRel(rel),
  );
  const rels = selectMergeFiles(manifest, onDisk);
  const entries = [];
  for (const rel of rels) {
    try {
      entries.push([rel, readFileSync(join(brainDir, rel), "utf8")]);
    } catch (error) {
      if (!unreadable) throw error;
      unreadable.push(rel);
    }
  }
  return Object.fromEntries(entries);
}

// A root is a directory to walk, a single file to take as-is, or absent.
//
// `""` — globRoots' honest "walk everything" — needs no case of its own, and the
// measurement is what proved it: `join(brainDir, "")` IS `brainDir`, which is a
// directory, so the general path already walks the whole tree. The special case that
// stood here said what the next line says, and a mutant that broke its condition
// changed no behaviour at all.
//
// Absence is FILTERED rather than returned-as-empty, so the guard stays observable: as
// an early `return []` its value was swallowed by `selectMergeFiles` downstream, and no
// input could tell an empty list from a bogus one.
function listFilesUnderRoots(brainDir, roots) {
  return roots
    .map((root) => ({ root, abs: join(brainDir, root) }))
    .filter(({ abs }) => existsSync(abs))
    .flatMap(({ root, abs }) => (statSync(abs).isDirectory() ? listFilesRelPosix(abs, brainDir) : [root]));
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
//
// 🚨 `unreadable` — THE SAME OPT-IN COLLECTOR, extended to the SEEDER (T3, third pass).
// S5 left the writers out of it on the argument that "a seeder that quietly skipped a
// file it could not read would record an ancestor for a brain it never saw". That is
// still true of a SILENT skip, and it is why the collector stays opt-in here too — a
// caller that does not ask to be told still gets the throw. What it is not an argument
// for is denying the other fifteen files their base: this function is the LAST writer on
// the reconcile path, so its bare throw took the whole converge with it — the copies,
// the retirement, the launcher regen, the manifest — on the strength of one locked file.
//
// The set-aside rel is dropped from the candidates rather than left to fall through
// `planBaseSeed`, which would defer it as `not-installed`: a sentence about a file the
// owner deleted, said about a file that is right there. Nothing is seeded for it, and the
// collector is the only thing that speaks about it.
export function syncBaseTree({ brainDir, manifest, provenance = {}, deliveredFileMap = {}, unreadable = null }) {
  const advance = planBaseAdvance({ manifest, deliveredFileMap });
  writeBaseEntries({ brainDir, entries: advance });

  // Fold the advance's own digests in, so a file just advanced reads as PROVABLE below
  // and is left alone — instead of being seeded a second time from an installed file
  // that may already have moved on.
  const advanced = { ...provenance, ...Object.fromEntries(advance.map((entry) => [entry.rel, entry.sha])) };
  const installedFileMap = readInstalledMergeFiles({ brainDir, manifest, unreadable });
  // `new Set(null)` is already the empty set, so no `?? []` guard: written with one, the
  // fallback was a mutant no input could kill — the only caller that reaches here with a
  // null collector is one for which nothing was set aside anyway.
  const setAside = new Set(unreadable);
  const recorded = Object.fromEntries(Object.entries(advanced).filter(([rel]) => !setAside.has(rel)));
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
// S5 — `unreadable` is passed straight through to the installed-files read: a caller that
// wants to be told which files it could not look at hands an array, one that does not gets
// the throw it always got. Both surfaces asking this question swallow, which is exactly why
// the answer has to be a VALUE rather than an exception.
export function readEngineDivergence({ brainDir, unreadable = null }) {
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
  const installedFileMap = readInstalledMergeFiles({ brainDir, manifest, unreadable });
  // S4 — the ancestor this machine HOLDS, handed to the report so a file whose digest
  // travelled from another machine is judged by bytes rather than by a foreign sha.
  // Read from the same disk pass as the installed bytes, for the same reason as above.
  const baseContentMap = readBaseTree({ brainDir, rels: Object.keys(installedFileMap) });
  return engineDivergence({ manifest, installedFileMap, baseContentMap });
}

// 🚨 THE ENGINE JUST REWROTE ONE OF ITS OWN MERGE FILES, IN PLACE (F1 / F8 of the v5.0.0
// code review). Not delivered from a source — rewritten where it stands: the connectors
// step merging permissions into `.claude/settings.json` after the install already recorded
// its provenance, which is why a brand-new brain with a connector was born diverged and
// nagged, at every session, about a file nobody had yet had time to edit.
//
// The rule this enforces is one sentence: **a file the ENGINE wrote must never read as a
// file the OWNER is holding back.** The reconcile path carries the same fact through
// `reconciledFileMap` (it has a manifest writer of its own, further down the pass); the
// installer has no such pass, so it gets a door.
//
// GATED BY THE MERGE REGIME, exactly like every other recorder here: a `replace` file is
// overwritten whole at every update and carries no base, so recording one would describe
// nothing. And gated on the file EXISTING — a caller naming a path the brain does not hold
// must not invent a record for it.
//
// Returns the rels it actually recorded, sorted, so a caller can say what it did. Writes
// nothing at all when that list is empty: an install that wired no connector must leave the
// manifest byte-identical.
export function rerecordEngineWrite({ brainDir, rels }) {
  const manifestPath = join(brainDir, "engine-manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const deliveredFileMap = Object.fromEntries(
    selectMergeFiles(manifest, rels)
      .filter((rel) => existsSync(join(brainDir, rel)))
      .map((rel) => [rel, readFileSync(join(brainDir, rel), "utf8")]),
  );
  const recorded = Object.keys(deliveredFileMap).sort();
  if (recorded.length === 0) return [];

  const provenance = reseedProvenance({
    priorProvenance: manifest.provenance ?? {},
    manifest,
    deliveredFileMap,
  });
  // The version the brain records about ITSELF: this write came from the engine the brain
  // is running, not from a fetch. A brain that records none records nothing here —
  // `reseedBaseRefs` refuses to turn an unknown into an answer.
  const baseRefs = reseedBaseRefs({
    priorBaseRefs: manifest.baseRefs ?? {},
    manifest,
    deliveredFileMap,
    ref: installRef(manifest),
  });
  const advanced = { ...manifest, provenance, baseRefs };
  writeFileSync(manifestPath, JSON.stringify(advanced, null, 2) + "\n");
  // The digest and the BYTES, or the next three-way merge would diff against an ancestor
  // the file never had — `engine-adopt.mjs`'s rule, one door over.
  syncBaseTree({ brainDir, manifest: advanced, provenance, deliveredFileMap });
  return recorded;
}

// The INSTALL composition root. Recording the source and the provenance without laying
// down the bytes they describe is how the fleet ended up with fifteen digests and no
// ancestor — so the two are one call, and an install cannot ship a brain without a tree.
export function recordSourceProvenanceAndBase({ brainDir, git }) {
  const manifest = recordSourceAndProvenance({ brainDir, git });
  syncBaseTree({ brainDir, manifest, provenance: manifest.provenance });
  return manifest;
}
