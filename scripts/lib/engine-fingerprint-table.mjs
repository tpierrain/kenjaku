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
import { fingerprint, selectMergeFiles, rejectRetired } from "./engine-source.mjs";
import { normalizeEol } from "./engine-base.mjs";
import { deliversAsLf } from "./tracked-files.mjs";
import { STAGING_PREFIX, SKILLS_PREFIX } from "./staged-skills.mjs";

// `templates/<locale>/<rel>` is the ONLY localized shape (there is no
// `templates/en/` — EN is the repo root). Three things carry weight here:
//   • `(.+)` and not `(.*)`: a path with nothing left after the locale names a
//     directory, and an empty rel would inject a key no lookup can ever match;
//   • `^`, because a root path that merely CONTAINS the segment (a demo note under
//     `vault/templates/fr/…`) would otherwise be filed under a rel that is not its
//     own — a wrong row, i.e. the clobber risk, not a missing one;
//   • `$` is defensive only, and it is a NAMED EQUIVALENT: it changes the answer
//     solely for a path containing a newline, and the generator's `git ls-files`
//     splits on newlines long before this is reached.
const LOCALIZED = /^templates\/([^/]+)\/(.+)$/;

// 📦 THE SECOND MAPPING, and it is the whole of #115. A STAGED skill ships at
// `engine-skills/<name>/…` and is install-if-absent'd into `.claude/skills/<name>/…`
// (ADR 0026, because the sacred scrub forbids the engine from writing under
// `.claude/skills/`). So the bytes a brain HOLDS sit at a path the release does not
// even have — exactly the asymmetry `LOCALIZED` exists for, one door along.
//
// Built from `STAGING_PREFIX` rather than respelled: the installer, the refresh and this
// table all name that directory, and a third spelling is a second chance to drift.
//
// `([^/]+\/.+)` carries the same weight as the locale regex's `(.+)`: a skill NAME and at
// least one file under it. `engine-skills/lint` is a directory, and mapping it would
// inject `.claude/skills/lint` — a key no lookup can match and no brain can present. The
// `^` is the clobber guard: a demo note under `vault/engine-skills/` must stay its own
// path, not be filed at somebody else's rel.
const STAGED = new RegExp(`^${STAGING_PREFIX}([^/]+/.+)$`);

// Where a source path INSTALLS, which locale it speaks for, and whether it reached its
// rel through the staging door. The two mappings compose in this order — strip the
// locale, then the staging prefix — because that is the order `installStagedSkills`
// resolves them in: `templates/fr/engine-skills/lint/SKILL.md` is read for a French
// brain and written to `.claude/skills/lint/SKILL.md` like any other.
//
// `staged` is reported rather than re-derived by the caller: the gate below needs it,
// and a second parse of the same path is a second place for the anchors above to be
// forgotten.
export function installedRelOf(sourcePath) {
  const localized = LOCALIZED.exec(sourcePath);
  const rel = localized ? localized[2] : sourcePath;
  const locale = localized ? localized[1] : "en";

  const staged = STAGED.exec(rel);
  return staged
    ? { rel: SKILLS_PREFIX + staged[1], locale, staged: true }
    : { rel, locale, staged: false };
}

// The sources of ONE tree (a published tag, or the working tree) that the table must
// fingerprint. TWO DOORS, and they are not the same question:
//
//   • the `merge` regime, asked once on the deduplicated rels, so it is read exactly as
//     the engine reads it — minus HEAD's tombstones, which `selectMergeFiles` subtracts;
//   • the STAGING path (#115). A staged skill is in NO regime — that is what ADR 0026
//     buys — so the merge door drops it and the table held no row for one until v5.5.0.
//     Its only proof was then the brain's own `engine-skills/` copy, which an update
//     advances one pass ahead of the installed skill: the two disagree for ever, and
//     every later release calls an untouched file customized.
//
// 🛑 The staged door still obeys the tombstones, and it must: a retirement is spelled at
// the INSTALLED path, which is where the brain holds the file, so both doors ask
// `rejectRetired` the very same question. A skill the engine no longer ships may not be
// healed back into recognition through the newer door.
export function selectFingerprintSources({ manifest, sourceFiles }) {
  const candidates = sourceFiles.map((sourcePath) => ({
    sourcePath,
    ...installedRelOf(sourcePath),
  }));
  const relsOf = (staged) => [...new Set(candidates.filter((c) => c.staged === staged).map((c) => c.rel))];
  const kept = new Set([
    ...selectMergeFiles(manifest, relsOf(false)),
    ...rejectRetired(manifest, relsOf(true)),
  ]);

  // Sorted by rel then locale so the generated artefact diffs cleanly from one
  // release to the next, and a reviewer reads a row, not a shuffle.
  //
  // `staged` is dropped here on purpose: it answers which door a source came through,
  // and DOWNSTREAM THERE ARE NO DOORS — `healOne` asks one question of every row, which
  // is precisely what lets one table serve both families.
  return candidates
    .filter((c) => kept.has(c.rel))
    .map(({ sourcePath, rel, locale }) => ({ sourcePath, rel, locale }))
    .sort((a, b) => (a.rel === b.rel ? cmp(a.locale, b.locale) : cmp(a.rel, b.rel)));
}

// The same sources, each carrying THE BYTES A BRAIN RECEIVES — which is NOT what
// `read` returns on a Windows clone.
//
// 🪟 The working tree is the only tree the generator cannot read from git's object
// store (it is not committed yet), and git for Windows checks it out as CRLF. Fold
// it verbatim there and the release being cut claims 23 CRLF digests: rows that
// recognise bytes no brain holds, in an artefact that looks exactly right. The
// freshness guard read the same tree, so it was red on Windows for the same reason
// — the last one on the branch.
//
// The oracle is `deliversAsLf`, the ONE function the installer copies with: what the
// table records is what the copy writes. LF for anything the index holds as LF,
// verbatim for the rest (binaries, committed CRLF, an `eol=crlf` attribute) — and
// verbatim, too, for a path git said nothing about, because both callers get their
// map best-effort and an unknown file is copied as-is.
//
// 🛑 An UNKNOWN PATH is verbatim; a MISSING MAP is a crash, and the asymmetry is
// deliberate. Crashing stops a release being cut, which is recoverable in seconds;
// folding a whole tree verbatim on Windows ships a CRLF table that reads as perfectly
// normal and leaves the fleet frozen. So no `?.` guards the lookup.
//
// Both callers go through here so a wrong table and a green guard cannot coexist.
export function deliveredSources({ manifest, sourceFiles, eolByPath, read }) {
  return selectFingerprintSources({ manifest, sourceFiles }).map((source) => {
    const raw = read(source.sourcePath);
    return {
      ...source,
      content: deliversAsLf(eolByPath[source.sourcePath]) ? normalizeEol(raw) : raw,
    };
  });
}

// No equal case, and `<` vs `<=` is a NAMED EQUIVALENT: both sort keys are built
// from unique paths (`git ls-files` cannot list one twice, and object keys cannot
// repeat), so the tie is unreachable by construction — the same shape, and the same
// reasoning, as `healProvenance`'s comparator. A third branch returning 0 would be
// dead code four mutants can hide in, so there is none.
const cmp = (a, b) => (a < b ? -1 : 1);

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
