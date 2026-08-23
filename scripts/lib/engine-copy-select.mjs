// ─────────────────────────────────────────────────────────────────────────────
// engine-copy-select.mjs — PURE. Picks the rel paths `update-engine` should REALLY
// copy from a fetched source, applying the SAME two refinements the installer does
// over the manifest globs (the divergence that caused the PR #10 QA findings):
//   • F1 — drop the DEV-ONLY files (`filterCopyable`, e.g. scripts/lib/eval-*,
//     mcp-search.*): the engine globs include `scripts/lib/**`, which would
//     otherwise leak the eval/measurement tooling into a user brain.
//   • F2 — KEEP the LOCALE-OWNED files (e.g. scripts/lib/demo-locale.mjs): they are
//     installed from templates/<locale>/ and belong to the brain's install locale.
//     An update must not overwrite the brain's `demo-locale.mjs` (fr→en regression).
// This is an EXCLUSION from the copy, never a re-overlay (overlayLocale wipes vault/
// and would violate the safety core — see the fix plan).
// ─────────────────────────────────────────────────────────────────────────────
import { matchesAny } from "./glob-match.mjs";
import { filterCopyable } from "./tracked-files.mjs";
import { stripComments, lineOf } from "./source-scan.mjs";

// The rel paths a LOCALE owns, derived from the source's templates/<locale>/<rel>
// tree: `templates/fr/scripts/lib/demo-locale.mjs` → `scripts/lib/demo-locale.mjs`.
// Locale-agnostic and future-proof: any new localized artefact is covered the moment
// it appears under templates/<*>/, with no list to maintain here.
export function localeOwnedPaths(sourceFiles) {
  const owned = new Set();
  for (const rel of sourceFiles) {
    const m = /^templates\/[^/]+\/(.+)$/.exec(rel);
    if (m) owned.add(m[1]);
  }
  return owned;
}

// The SOURCE file to deliver for `rel` to a brain installed in `locale`. The mirror
// image of localeOwnedPaths: that one excludes locale-owned paths from the blind copy;
// this one resolves the ONE source a locale-aware delivery should read.
export function resolveLocaleSource({ rel, locale, sourceFiles }) {
  const localized = `templates/${locale}/${rel}`;
  return sourceFiles.includes(localized) ? localized : rel;
}

// ─────────────────────────────────────────────────────────────────────────────
// THE CENSUS OF THE DOORS — what stops a FOURTH one being written locale-blind.
//
// T10 was reported against ONE call site and there were THREE, each delivering engine
// content into a brain through its own `copyFileSync`, none of them resolving the locale.
// A hand-audit is what had already failed: a copy that reads the root rel is invisible in
// review, because it reads exactly like the correct one. So the rule gets a machine that
// counts its doors — same shape and same argument as `findRawDirComparisons`
// (`update-mode.mjs`, T8): a pure scanner over a source string, and one repo-wide
// fail-loud test that pins the whole set.
//
// It lives HERE, beside `resolveLocaleSource`, on purpose: rule 3 of ADR 0040 and the
// census of the places that must obey it are one subject, and splitting them is how the
// census stops being aimed at the rule.
// ─────────────────────────────────────────────────────────────────────────────
export function findDeliveryCopies(source) {
  const code = stripComments(source);
  const out = [];
  // The word boundary is what keeps a future `safeCopyFileSync` wrapper out of the
  // census, and `\s*\(` is what keeps a formatter's wrapped call in it. A bare mention
  // (an import, a destructured seam) has no `(` after it and is not a door.
  const call = /\bcopyFileSync\s*\(/g;
  let match;
  while ((match = call.exec(code)) !== null) {
    const lineStart = code.lastIndexOf("\n", match.index) + 1;
    const lineEnd = code.indexOf("\n", match.index);
    out.push({
      line: lineOf(code, match.index),
      text: code.slice(lineStart, lineEnd === -1 ? code.length : lineEnd).trim(),
    });
  }
  return out;
}

// The rel paths to ACTUALLY copy: matching the engine copy globs, MINUS the dev-only
// files, MINUS the locale-owned files. `localeOwnedRel` may be injected (tests); it
// defaults to the set derived from `sourceFiles`.
export function selectEngineFilesToCopy({ sourceFiles, copyGlobs, localeOwnedRel }) {
  const owned = localeOwnedRel ?? localeOwnedPaths(sourceFiles);
  return filterCopyable(sourceFiles).filter(
    (rel) => matchesAny(copyGlobs, rel) && !owned.has(rel),
  );
}
