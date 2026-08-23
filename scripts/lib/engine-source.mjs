// ─────────────────────────────────────────────────────────────────────────────
// engine-source.mjs — pure helpers the installer uses to enrich a freshly-created
// brain's engine-manifest.json with:
//   • source: { repo, ref } — where (and at which launcher tag/commit) a future
//     `update-engine` should pull a newer Engine from;
//   • provenance — a base sha256 per `merge`-bucket file, seeding the Phase 2
//     3-way merge at no extra cost now (study §7 Q4, plan Step 1).
// PURE by design: the installer performs the git/FS I/O and passes the facts in.
// ─────────────────────────────────────────────────────────────────────────────
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { globToRegExp } from "./glob-match.mjs";
import { listFilesRelPosix } from "./fs-walk.mjs";

// Self-describing digest so the manifest records WHICH algorithm produced it
// (future-proofs the Phase 2 3-way if the hash ever changes).
export function fingerprint(content) {
  return "sha256:" + createHash("sha256").update(content).digest("hex");
}

// The concrete files (from `candidates`) that fall under the manifest's `merge`
// regime — i.e. the files that get a provenance base seed. Selection is by the
// manifest's globs ONLY: a file the manifest never names is, by construction, the
// user's property and is never fingerprinted (the founding principle, ADR 0012).
// ⚰️ MINUS what the manifest has RETIRED (plan S6c). A tombstone is a sibling of
// `regimes`, and subtracting it here rather than at each caller is what makes it mean
// one thing everywhere: a file the engine no longer ships is not a file it merges. The
// skills refresh, the base seeding, the provenance re-seed and the version stamps all
// ask this one question, and two of them were measurably wrong without it — the
// refresh's absent-install put a just-retired directory back in the SAME pass, and the
// base tree went on seeding an ancestor for a file nobody delivers any more.
export function selectMergeFiles(manifest, candidates) {
  const matchers = (manifest?.regimes?.merge ?? []).map(globToRegExp);
  const tombstones = (manifest?.retired ?? []).map(globToRegExp);
  return candidates.filter(
    (path) => matchers.some((re) => re.test(path)) && !tombstones.some((re) => re.test(path)),
  );
}

// THE FILES THE OWNER IS INVITED TO EDIT (S12), and which rels they are.
//
// It lives HERE, beside `selectMergeFiles`, because it is the same kind of question — a
// regime naming a set of rels — and because it now has TWO readers with nothing else in
// common: the session nudge, which stops narrating an edit it invited, and
// `planAncestorFetch`, which must not go and fetch an ancestor for a file that is
// generated per brain (T4). One spelling, or the second reader is a second place for the
// fallback below to be forgotten.
//
// The fallback is NOT a defensive habit — it is a state the fleet was measurably in. An
// update is performed by the brain's OLD engine, and `invited` is this release's own
// invention, so this new code sits beside manifests whose families have never named it.
// Falling back to nothing there would put BOTH defects straight back on the one run
// where nobody could act on either: the undismissible fleet-wide line about the
// constitution, and ten git subprocesses certain to fail.
export const INVITED_EDITS_FALLBACK = ["CLAUDE.md"];

export function invitedEdits(manifest) {
  return manifest?.regimes?.invited ?? INVITED_EDITS_FALLBACK;
}

// The provenance base map: { relPath: fingerprint(content) } over a file→content
// map the installer prepared (already restricted to the merge files). This is the
// base Phase 2's 3-way merge will diff against to detect user edits.
export function buildProvenance(fileMap) {
  return Object.fromEntries(
    Object.entries(fileMap).map(([path, content]) => [path, fingerprint(content)]),
  );
}

// The source record { repo, ref } the brain records so a future `update-engine`
// knows where (and at which launcher point) to pull a newer Engine from. The ref
// prefers an exact tag at HEAD (most reproducible + `git clone --branch`-able),
// then the branch, then the bare commit as a last resort.
export function buildSource({ repo, tag, branch, commit }) {
  const trimmed = (repo ?? "").trim();
  return { repo: trimmed || null, ref: tag || branch || commit };
}

// Where a brain should pull its NEXT update from. `recorded` is the repo the brain
// wrote at install (its install-day memory); `declared` is the `canonicalRepo` the
// launcher we just fetched states about ITSELF. The launcher wins: that is the only
// way a repository RENAME ever reaches an already-installed brain (F1) — otherwise
// every brain keeps cloning its install-day name forever, alive only on the host's
// redirect from a namespace we no longer own.
export function resolveSourceRepo({ recorded, declared }) {
  const trimmed = (declared ?? "").trim();
  return trimmed || recorded;
}

// Returns a NEW manifest with `source`, `provenance` and `baseRefs` set, every other
// field preserved. Never mutates the input (the brain's freshly-copied manifest).
export function enrichManifest(manifest, { source, provenance, baseRefs }) {
  return { ...manifest, source, provenance, baseRefs };
}

// After an update-engine swap, refresh the provenance base for ONLY the merge files
// the engine actually re-delivered (`deliveredFileMap` = {rel: new content}). Files
// the engine replaces outright (rag/src…) never carry a base — same as at install.
// User merge files the swap never touched (CLAUDE.md/settings/skills) keep their
// prior base untouched, so Phase 2's 3-way still detects the user's edits against
// the version the engine last delivered. (Plan Step 5.)
export function reseedProvenance({ priorProvenance, manifest, deliveredFileMap }) {
  const redelivered = selectMergeFiles(manifest, Object.keys(deliveredFileMap));
  const refreshed = buildProvenance(
    Object.fromEntries(redelivered.map((rel) => [rel, deliveredFileMap[rel]])),
  );
  return { ...priorProvenance, ...refreshed };
}

// WHICH engine version each recorded base came from (S4). The base tree holds the
// last-delivered BYTES, and nothing held the VERSION they came from — so a brain could
// say "you are holding this file back" and never "back from what".
//
// One entry means exactly one thing: **the last engine version whose bytes this file
// actually received**. That single meaning is what keeps this a map and not a state
// machine — a "first became held back" stamp would have to know when to stop moving,
// and would be wrong the first time an owner edited a file twice.
//
// Same gate as `reseedProvenance`, deliberately: a `replace` file is overwritten whole
// at every update and carries no base, so stamping one would describe nothing.
export function reseedBaseRefs({ priorBaseRefs, manifest, deliveredFileMap, ref }) {
  // No usable ref → record NOTHING. An absent entry already means "unknown, say since
  // your install"; writing `null` or `""` would make an unknown look like an answer, and
  // every reader downstream would then have to know that it is not one.
  if (!ref) return { ...priorBaseRefs };
  const redelivered = selectMergeFiles(manifest, Object.keys(deliveredFileMap));
  return { ...priorBaseRefs, ...Object.fromEntries(redelivered.map((rel) => [rel, ref])) };
}

// The brain's record of WHICH file families the engine governs — and, until W3, the one
// field of the manifest that stayed at its install-day value forever. Step 7 wrote back
// `{...local, engineVersion, indexSchemaVersion, source, provenance, baseRefs}`, and
// `regimes` was in none of it, so a v3.6.0 brain kept a v3.6.0 list of families for the
// rest of its life. `session-self-heal.mjs` already named it in a comment ("update-engine
// never refreshes those, which is the whole bug") and worked around it by deriving the
// desired state from what the engine DELIVERS instead.
//
// What it costs v5 exactly: `CLAUDE.engine.md` is a `merge` family only v4+ declares. The
// doctrine is still offered correctly DURING an update, but every standing surface between
// two updates reads the brain's stale globs — so the session nudge never mentions it, and
// adopting it writes the file without advancing its ancestor, which brings the same
// question back at the next release instead of settling it.
//
// 🛑 THE FALLBACK IS LOAD-BEARING, not defensive habit. The result is SPREAD over the
// manifest, where an `undefined` value does not defer to what `{...local}` put there — it
// overwrites it, and `JSON.stringify` then drops the key. An engine that shipped without
// declaring its regimes would leave every updated brain with NO regime list at all, and
// the write guard recognises no engine file without one.
//
// Widening the allowlist to whatever the new engine declares is the POINT and also the
// risk, which is why the release note says so out loud (Thomas's call, 2026-08-22).
export function advanceRegimes({ local, target }) {
  return {
    regimes: target?.regimes ?? local?.regimes,
    retired: target?.retired ?? local?.retired,
  };
}

// ─── I/O orchestrator (the installer's thin wiring) ──────────────────────────
// Real fs on the brain dir; the launcher git facts are passed in as data (no git
// spawn / network here → unit-testable on a temp fixture brain). Walks the brain
// (shared fs-walk), fingerprints exactly the `merge` files, records where to pull a
// future update from, and writes the enriched engine-manifest.json back in place.

export function recordSourceAndProvenance({ brainDir, git }) {
  const manifestPath = join(brainDir, "engine-manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

  const mergeFiles = selectMergeFiles(manifest, listFilesRelPosix(brainDir));
  const fileMap = Object.fromEntries(
    mergeFiles.map((rel) => [rel, readFileSync(join(brainDir, rel), "utf8")]),
  );

  // At install every merge file IS delivered, so `reseedBaseRefs` over the same map
  // stamps them all at the version we are installing — the honest starting point: a
  // brand-new brain is behind on nothing.
  const source = buildSource(git);
  const enriched = enrichManifest(manifest, {
    source,
    provenance: buildProvenance(fileMap),
    baseRefs: reseedBaseRefs({
      priorBaseRefs: manifest.baseRefs,
      manifest,
      deliveredFileMap: fileMap,
      ref: source.ref,
    }),
  });
  writeFileSync(manifestPath, JSON.stringify(enriched, null, 2) + "\n");
  return enriched;
}
