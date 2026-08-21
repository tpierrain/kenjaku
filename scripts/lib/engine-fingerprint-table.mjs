// ─────────────────────────────────────────────────────────────────────────────
// engine-fingerprint-table.mjs — the PURE half of the generator that builds
// `scripts/lib/engine-fingerprints.json`, the table `healProvenance` recognises
// installed bytes in (plan S7-2 of v5-unfreezes-the-existing-fleet-action.md).
//
// PURE by design, and the split is not taste: the git I/O (25 published tags, two
// locales) lives in `maintainers/fingerprints/generate-fingerprints.mjs`, because
// CI globs `scripts/lib/*.test.mjs` and globs nothing under `maintainers/qa/**` —
// logic left in the maintainer script is logic no CI run ever executes.
//
// 🛑 DEV-ONLY: excluded from the copy into a brain by a `tracked-files.mjs` prefix.
// A brain READS the table on every update; it never builds one.
//
// 🛑 THE GATE RUNS ON THE INSTALLED REL, NEVER ON THE SOURCE PATH. A French brain
// holds the bytes of `templates/fr/CLAUDE.engine.md` AT `CLAUDE.engine.md`, so a
// generator that asks the merge regime about the source path recognises nothing on
// either of the owner's two real brains (S7-0, Correction 3).
// ─────────────────────────────────────────────────────────────────────────────
import { fingerprint, selectMergeFiles } from "./engine-source.mjs";

// `templates/<locale>/<rel>` is the ONLY localized shape (there is no
// `templates/en/` — EN is the repo root). `(.+)` and not `(.*)`: a path with
// nothing left after the locale names a directory, and an empty rel would inject
// a key into the table that no lookup can ever match.
const LOCALIZED = /^templates\/([^/]+)\/(.+)$/;

export function installedRelOf(sourcePath) {
  const match = LOCALIZED.exec(sourcePath);
  return match ? { rel: match[2], locale: match[1] } : { rel: sourcePath, locale: "en" };
}

// The sources of ONE tree (a published tag, or the working tree) that the table
// must fingerprint: every locale of every file under HEAD's `merge` regime, minus
// HEAD's tombstones. `selectMergeFiles` is asked once, on the deduplicated rels,
// so the regime is read exactly as the engine reads it — not re-implemented here.
export function selectFingerprintSources({ manifest, sourceFiles }) {
  const candidates = sourceFiles.map((sourcePath) => ({
    sourcePath,
    ...installedRelOf(sourcePath),
  }));
  const kept = new Set(selectMergeFiles(manifest, [...new Set(candidates.map((c) => c.rel))]));

  // Sorted by rel then locale so the generated artefact diffs cleanly from one
  // release to the next, and a reviewer reads a row, not a shuffle.
  return candidates
    .filter((c) => kept.has(c.rel))
    .sort((a, b) => (a.rel === b.rel ? cmp(a.locale, b.locale) : cmp(a.rel, b.rel)));
}

const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// The fold. `versions` comes in ASCENDING order, and FIRST WRITER WINS — so `since`
// is the EARLIEST version that shipped those bytes, and the release being cut can
// only ever claim bytes nobody shipped before it.
//
// ⚠️ When two locales hold identical bytes for one rel, one digest cannot carry two
// locales: the first folded keeps it. The `locale` field is a REPORT (it is printed
// to the owner), never a fact the heal branches on.
export function buildFingerprintTable({ generatedAt, versions }) {
  const files = {};
  for (const { version, files: shipped } of versions) {
    for (const { rel, locale, content } of shipped) {
      const digest = fingerprint(content);
      const versionsOfRel = (files[rel] ??= {});
      if (!(digest in versionsOfRel)) versionsOfRel[digest] = { since: version, locale };
    }
  }

  return {
    generatedAt,
    files: Object.fromEntries(Object.entries(files).sort(([a], [b]) => cmp(a, b))),
  };
}
