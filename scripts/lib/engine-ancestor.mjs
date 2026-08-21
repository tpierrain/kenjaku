// ─────────────────────────────────────────────────────────────────────────────
// engine-ancestor.mjs — WHICH ancestors are worth going to get, and from where
// (plan S7-5-1 of v5-unfreezes-the-existing-fleet-action.md).
//
// S7 healed the files with NO recorded sha. This is the OTHER half of the fleet, and
// the two do not overlap: files that HAVE a recorded sha, whose bytes on disk no
// longer match it (the owner edited them), and whose ancestor is not on the disk —
// `.engine-base/` was only invented in this release. Today they land on row 7 of
// `mergeVerdict` (`preserve/customized`, a `.new` sidecar beside them): the sha proves
// the file moved, and there is nothing to merge FROM.
//
// The bytes exist, in a published tag, and the recorded sha says which:
// `table.files[rel][recorded]` → `{ since, locale }` is a DIRECT lookup. The table
// built for S7 pays for itself twice, and needs no reverse index to do it.
//
// PURE: it decides what to ask for. The git shell next door goes and gets it, and
// verifies it against `recorded` before a byte reaches the disk.
// ─────────────────────────────────────────────────────────────────────────────
import { selectMergeFiles } from "./engine-source.mjs";
import { verifyBase } from "./engine-base.mjs";

// "Do these bytes ARE the recorded ones?" — `verifyBase`'s own question, asked of the
// installed file instead of a base. Reused rather than re-spelled: a second spelling
// of "matches the record" is a second place for the EOL forgiveness to be forgotten,
// and a Windows checkout would then fetch an ancestor it already holds.
const matchesRecord = (recorded, content) => verifyBase({ recorded, baseContent: content }).usable;

// The source path a rel's bytes shipped at, for the locale the table reports. Merge
// files always ship at their own rel or its locale twin — a staged skill, which ships
// somewhere else entirely, is by construction never a merge file.
const sourcePathFor = (rel, locale) => (locale === "en" ? rel : `templates/${locale}/${rel}`);

export function planAncestorFetch({ manifest, provenance = {}, installedFileMap = {}, baseContentMap = {}, table }) {
  return selectMergeFiles(manifest, Object.keys(installedFileMap))
    .map((rel) => {
      const recorded = provenance[rel];
      // No record at all → S7's business (recognise the bytes), never this one.
      // ⚠️ A NAMED EQUIVALENT, and a different animal from the dead branches S7-2 and
      // S7-3 deleted: this guard is REACHED on real input, it is merely REDUNDANT.
      // Remove it and BOTH ways out still return null — either `matchesRecord` forgives
      // the absent record, or the table lookup misses on an `undefined` key two lines
      // down. Kept, because it answers the question at the place a reader asks it, and
      // because leaning on two distant behaviours to skip a file is how a refactor
      // downstream silently changes this one.
      if (!recorded) return null;
      // 🛑 HOLES ONLY. An existing `.engine-base/<rel>` is the REAL recorded ancestor;
      // replacing it with bytes fetched on the strength of a historical digest would
      // swap a fact for a guess, and a wrong ancestor is how an update clobbers an edit.
      if (baseContentMap[rel] != null) return null;
      // Untouched → rows 4-5 deliver on the record alone. Fetching here would buy a
      // network round-trip and change no outcome.
      if (matchesRecord(recorded, installedFileMap[rel])) return null;

      // The tag is the one the BRAIN'S OWN record points at, never the newest the table
      // holds for this rel: fetching the newest would hand the merge someone else's
      // ancestor, which is the clobber risk wearing a plausible face. A sha the table
      // does not carry names no tag — which is also why `CLAUDE.md` and
      // `.claude/settings.json`, generated per brain, never appear here.
      const entry = table?.files?.[rel]?.[recorded];
      if (!entry) return null;

      return { rel, tag: entry.since, sourcePath: sourcePathFor(rel, entry.locale), recorded };
    })
    .filter(Boolean)
    // No equal case, and `<` vs `<=` is a NAMED EQUIVALENT: the rels come from object
    // keys, so one cannot appear twice — the same shape, and the same reasoning, as
    // `healProvenance`'s comparator next door.
    .sort((a, b) => (a.rel < b.rel ? -1 : 1));
}
