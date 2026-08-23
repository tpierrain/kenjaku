// ═══════════════════════════════════════════════════════════════════════════
// tracked-files.mjs — PURE parsing of `git ls-files -z` output. No I/O.
// ═══════════════════════════════════════════════════════════════════════════

// `git ls-files -z` separates each path with a NUL (\0) — robust to spaces and
// accents in names — and terminates the list with a trailing NUL. We split on
// \0 and drop the trailing empty entry (and any empty entry).
export function parseLsFilesZ(output) {
  return output.split("\0").filter((p) => p !== "");
}

// ── WHAT THE OBJECT STORE HOLDS, vs what the checkout holds (plan W2) ────────
//
// The installer copies the launcher's WORKING TREE byte-verbatim, and git for
// Windows defaults `core.autocrlf` to true — so a launcher cloned there hands
// every brain CRLF from install day, and the installer digests those bytes, so
// the brain's recorded shas are CRLF too and match no row of a fingerprint table
// folded from LF blobs. (W1 repairs the brains that already have it; this is the
// half that stops it recurring.)
//
// The installer clones nothing, so there is no `-c core.autocrlf=false` to add
// here. What there is: `git ls-files --eol`, which reports per file the form the
// INDEX holds, the form the worktree holds, and the `.gitattributes` verdict.
// Deliver the index's form and the whole question is answered — by git, on the
// launcher's own rules, rather than by a guess about file extensions.
//
// `git ls-files --eol -z` emits, per file: three SPACE-PADDED fields, a single
// TAB, the path, then NUL. The tab is what makes a path with spaces safe, and the
// attribute field is what makes `attr/text eol=crlf` (two words, one value)
// readable — both are why this is parsed rather than split on whitespace.
// The whole record format, stated once as a pattern rather than walked with index
// arithmetic — which is what the mutation run asked for: three of its survivors were
// `indexOf` comparisons whose false branch no output git produces can reach, so they
// were unkillable AND load-bearing-looking. A pattern that either matches or does not
// has no such half-states.
const EOL_FIELDS = /^(i\/\S+)\s+(w\/\S+)\s+attr\/(.*)$/;

export function parseLsFilesEolZ(output) {
  const byPath = {};
  for (const record of output.split("\0")) {
    const tab = record.indexOf("\t");
    // No tab → not a record: the trailing empty entry, or anything git did not emit
    // in this format.
    if (tab < 0) continue;
    const fields = EOL_FIELDS.exec(record.slice(0, tab));
    // 🛑 A record it cannot FULLY read is skipped, never half-read. A half-parsed one
    // becomes an entry keyed by a real path carrying a wrong verdict, and the caller
    // then delivers that file in the wrong form. Silence is the safe failure: an
    // unknown file is copied byte-verbatim, which is what the installer always did.
    if (!fields) continue;
    const [, index, worktree, attr] = fields;
    byPath[record.slice(tab + 1)] = { index, worktree, attr: attr.trim() };
  }
  return byPath;
}

// Does this file get LF-normalised on its way into the brain? Two refusals, and
// each is a real artefact rather than a defensive habit:
//
//   • anything the index does NOT hold as LF — `-text` (binary: 29 PNG boards
//     travel into every brain), `crlf` and `mixed` (content the launcher really
//     committed that way). Normalising any of them changes what was committed,
//     which is the opposite of the rule this function is named after.
//   • an explicit `eol=crlf` attribute. Nothing in the launcher carries one today,
//     and the day one does it will be a `.cmd`: cmd.exe re-seeks a batch file by
//     byte offset, and an LF-only one resumes MID-TOKEN. That shipped once
//     (field report 2026-08-07, fixed at v4.8.1) and `.gitattributes` exists
//     because of it.
//
// An unknown file is a refusal too: the `git ls-files --eol` call is best effort,
// and an empty map must mean "copy everything verbatim, exactly as before" rather
// than "normalise everything".
export function deliversAsLf(info) {
  if (info?.index !== "i/lf") return false;
  return !/(^|\s)eol=crlf(\s|$)/.test(info.attr);
}

// TRACKED launcher files/folders that must NOT be copied into the brain: they
// only concern the development of the generator itself. They are all tracked (so
// listed by `ls-files`) and travel between the maintainer's machines, but must
// never land on the end user's side.
//   - DEVELOPING.md: the dev notice at the root.
//   - EN-QUOI-C-EST-DIFFERENT.md: the generator's positioning sheet (for whoever
//     evaluates the launcher) — points to the maintainers/ ADRs, no use in a brain.
//   - maintainers/: all the dev context (decisions, plans, archives).
//   - the EVAL-SET tooling (scripts/run-eval.mjs, scripts/lib/eval-*, mcp-search):
//     the instrument used to CHOOSE the launcher's embedder (Gemini vs local
//     measurement). No value in a user brain (Flemmr notes purged → everything FAILs).
//     Excluded by PREFIX → covers the .mjs AND their .test.mjs at once.
//   - scripts/lib/install-handoff: the installer's end-of-install banner. Purely
//     launcher-side (like installer.mjs) — printed once at install time, no use in
//     a brain. Excluded by PREFIX → covers the .mjs AND its .test.mjs.
//   - rag/scripts/: engine MEASUREMENT tooling (measure-batch — tune EMBED_BATCH
//     on a dense corpus; measure-contention — prove that search and indexing share
//     a warm session). Dev-only: imports the TS source and targets a confidential
//     local vault by default; no value (or place) in a user brain.
const DEV_ONLY_FILES = new Set(["DEVELOPING.md", "EN-QUOI-C-EST-DIFFERENT.md"]);
const DEV_ONLY_PREFIXES = [
  "maintainers/",
  "scripts/run-eval.mjs",
  "scripts/lib/eval-",
  "scripts/lib/mcp-search",
  // install-handoff: the installer's end-of-install banner (buildHandoff). Pure
  // launcher-side, like installer.mjs itself — useless in a brain. Covers the .mjs
  // AND its .test.mjs via the prefix.
  "scripts/lib/install-handoff",
  // node-compat: the installer's pre-`npm install` Node-version preflight
  // (checkNode). Pure launcher-side, like installer.mjs — useless in a brain.
  // Covers the .mjs AND its .test.mjs via the prefix.
  "scripts/lib/node-compat",
  // assert-matcher-lint: a maintainer-side test-quality guard (flags loose
  // assert.throws/rejects). Pure dev tooling, useless in a brain. Covers the .mjs
  // AND its .test.mjs via the prefix.
  "scripts/lib/assert-matcher-lint",
  // engine-fingerprint-table: the PURE half of the maintainer generator that builds
  // engine-fingerprints.json (plan S7-2). A brain READS that table on every update;
  // it never builds one, and building one means 25 tags of git I/O. Covers the .mjs
  // AND its .test.mjs via the prefix.
  // 🪤 The prefix MUST keep the `-table` suffix: `scripts/lib/engine-fingerprint`
  // would also swallow `engine-fingerprints.json` — excluding from the copy the very
  // artefact v5 exists to deliver, and leaving every brain frozen with no way to
  // notice. Pinned by a test in tracked-files.test.mjs.
  "scripts/lib/engine-fingerprint-table",
  "rag/scripts/",
  // NOTE: the marketing boards (docs/img/board-*.png/svg) used to be excluded here
  // (~87MB of README-only art). Compressed to ~12MB total (1760px + pngquant), they
  // now SHIP into a generated brain so its copy of the launcher README renders every
  // board instead of showing broken images. No prefix for them → they're copied like
  // the onboarding screenshots and the mascot.
  // Localized artefact sources (constitution, skills, demo vault) live under
  // templates/<locale>/. They are NOT bulk-copied: the installer overlays only
  // the chosen locale onto the brain (cf. resolveLocale/chooseLocale).
  "templates/",
];

// Keeps, among the tracked paths, those to copy into the generated brain.
export function filterCopyable(paths) {
  return paths.filter(
    (p) =>
      !DEV_ONLY_FILES.has(p) && !DEV_ONLY_PREFIXES.some((dir) => p.startsWith(dir)),
  );
}
