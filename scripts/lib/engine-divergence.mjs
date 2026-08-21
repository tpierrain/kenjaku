// ─────────────────────────────────────────────────────────────────────────────
// engine-divergence.mjs — WHICH engine files a brain is holding back, and since
// which engine version each of them last received bytes (plan S4-2).
//
// This is the field finding's third defect, asked at rest instead of at update
// time: a skill was frozen for weeks, every update re-confirmed the freeze, and
// **nothing ever said so**. The verdict itself is not new — row 7 of the merge
// table decides it on every update — but it was only ever spoken while an update
// was running, about the files that update happened to touch.
//
// Pure, offline, and cheap by construction: the manifest is the record, the
// installed bytes are the disk, and the answer is a list. Two facts per file and
// no third:
//   • WHY it is held back — `customized` (the owner's bytes, provably) or
//     `no-provenance` (nothing recorded, so nothing provable either way). The
//     words are `engine-base.mjs`'s, deliberately: the seeder that defers a file
//     and the report that names it must be talking about the same file.
//   • SINCE WHICH VERSION — `baseRefs[rel]`, or `null` when the brain records
//     none. `null` is an answer ("we do not know, say: since your install"), and
//     the one thing this module may never do is fill it in from `source.ref` —
//     the version the brain runs today is not the version the file is behind.
//
// What it deliberately does NOT compute: how MANY releases behind. That needs the
// release list, i.e. a network call, for a number the two version names already
// convey to the only reader that matters.
// ─────────────────────────────────────────────────────────────────────────────
import { INSTALLED_REFUSAL, verifyBase } from "./engine-base.mjs";
import { selectMergeFiles } from "./engine-source.mjs";

// Candidates are what is ON DISK, never the union with the record — and that is
// the one deliberate asymmetry with `planBaseSeed`, which does take the union. A
// recorded file the owner deleted is not being held back: the install-if-absent
// path re-delivers it at the next update, so it is on its way back. It is a
// different fact, and this module owns exactly one.
export function engineDivergence({ manifest, installedFileMap }) {
  const provenance = manifest?.provenance ?? {};
  const baseRefs = manifest?.baseRefs ?? {};
  const held = [];
  for (const rel of selectMergeFiles(manifest, Object.keys(installedFileMap))) {
    // The seeding question, asked of the installed file: "would these bytes make a
    // provable base?" Yes → the file still IS what the engine delivered, nothing is
    // held back. There is no second definition of "unchanged" in this codebase, and
    // this is where a second one would have been written (EOL normalization included,
    // without which the whole Windows fleet reads as holding back every file).
    const verdict = verifyBase({ recorded: provenance[rel], baseContent: installedFileMap[rel] });
    if (verdict.usable) continue;
    held.push({ rel, reason: INSTALLED_REFUSAL[verdict.reason], since: baseRefs[rel] ?? null });
  }
  // By path, because a human reads it — the same comparator, and the same reason for
  // having no equal case, as `syncBaseTree`'s report: a rel appears at most once, so
  // spelling out equality would add a branch no input can reach.
  return held.sort((a, b) => (a.rel < b.rel ? -1 : 1));
}
