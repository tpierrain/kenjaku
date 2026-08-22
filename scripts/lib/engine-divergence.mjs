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
import { INSTALLED_REFUSAL, normalizeEol, verifyBase } from "./engine-base.mjs";
import { selectMergeFiles } from "./engine-source.mjs";
import { matchesAny } from "./glob-match.mjs";

// 🚪 THE ONE FILE THIS REPORT MAY NOT NAME (Thomas's call, 2026-08-22, on F1 of the
// v5.0.0 code review: *"ne parler que des fichiers vraiment tenus par toi"*).
//
// `CLAUDE.md` is the OWNER's half of the constitution and the product's own doctrine
// TELLS them to edit it — the README, the install hand-off and the constitution itself
// all invite it. So every brain diverges on it within days and stays diverged for life,
// and no refresh family ever writes a `.new` sidecar beside it, which means the line is
// not dismissible either (`adoptCandidate` answers `no-candidate` forever). Saying "the
// engine is leaving this file alone" about a file we ASKED them to write is a false
// claim, and repeating it unbidden at every session start is precisely the consent
// fatigue this whole surface was built to prevent.
//
// ⚠️ SCOPED TO WHAT IS SAID, and that boundary is the decision. `CLAUDE.md` stays a
// `merge` file: the update-time behaviour is untouched, the owner's edits still merge
// exactly as before. What changes is only that the brain stops narrating it.
//
// A NAME, not a shape: `CLAUDE.engine.md` is the ENGINE's half — the engine writes it,
// the owner is never asked to — so it is still reported. One dot apart, opposite verdict.
// S12 — DECLARED per release in `engine-manifest.json`, like every other file family,
// rather than compiled in here. A list in code can only reach a brain by shipping a new
// engine; a list in the manifest reaches one at its next update, because `advanceRegimes`
// already carries `regimes` onto older brains. It rides inside `regimes` for exactly that
// reason, and it is NOT a delivery family: `CLAUDE.md` stays under `merge` and is
// delivered exactly as before, and `regimeOf` walks a fixed list of the four delivery
// regimes, so the write guard never sees this key.
//
// The fallback below is NOT a defensive habit — it is a state the fleet was measurably
// in. An update is performed by the brain's OLD engine, and until the first-update fix
// (2026-08-23) this new code could sit beside a manifest whose families had never been
// advanced. Falling back to nothing there would put the undismissible fleet-wide line
// about the constitution straight back, on the one run where nobody could act on it.
export const INVITED_EDITS_FALLBACK = ["CLAUDE.md"];

const invitedEdits = (manifest) => manifest?.regimes?.invited ?? INVITED_EDITS_FALLBACK;

// Candidates are what is ON DISK, never the union with the record — and that is
// the one deliberate asymmetry with `planBaseSeed`, which does take the union. A
// recorded file the owner deleted is not being held back: the install-if-absent
// path re-delivers it at the next update, so it is on its way back. It is a
// different fact, and this module owns exactly one.
// 🚨 THE DIGEST TRAVELS AND THE FILE DOES NOT (S4, second pass of the v5.0.0 review).
//
// `.claude/settings.json` bakes an absolute path, so it is gitignored and regenerated per
// machine — while `engine-manifest.json`, which records its digest, is tracked and travels
// in the clone. On a second machine the recorded sha therefore describes MACHINE A's bytes,
// and every session start told that owner they were holding back a file they had never
// opened. Un-dismissable, too: no refresh family writes a `.new` beside it.
//
// `.engine-base/<rel>` is a different kind of evidence: it is the bytes the ENGINE last
// wrote HERE, and it is written by the same act that regenerates the file. Where the brain
// holds it, it answers the question the digest was only ever a proxy for — so the ancestor
// this machine HOLDS outranks the digest the shared manifest REMEMBERS. Where it does not,
// the digest still decides, exactly as before.
//
// ⚠️ This does NOT silence the owner's own edit: bytes that differ from the ancestor are
// the owner's, ancestor or no ancestor, and that is the whole point of the report. It is
// F1's invariant read from the other end — *a file the ENGINE wrote must never read as a
// file the OWNER is holding back* — and the engine's own bytes are the honest witness.
//
// EOL is forgiven exactly as `verifyBase` forgives it, and for the same reason: git
// rewrote the line endings, the owner did not. A second definition of "unchanged" here
// would put the whole Windows fleet back in the report.
function matchesLocalAncestor(baseContent, installed) {
  if (baseContent === null || baseContent === undefined) return false;
  return normalizeEol(baseContent) === normalizeEol(installed);
}

export function engineDivergence({ manifest, installedFileMap, baseContentMap = {} }) {
  const provenance = manifest?.provenance ?? {};
  const baseRefs = manifest?.baseRefs ?? {};
  const held = [];
  for (const rel of selectMergeFiles(manifest, Object.keys(installedFileMap))) {
    // Filtered BEFORE the verdict is computed, so it holds for BOTH branches: the whole
    // deployed fleet is `no-provenance` on `CLAUDE.md` (no regime named it before v4), and
    // silencing only the `customized` half would leave the fleet-wide line exactly where
    // it was.
    if (matchesAny(invitedEdits(manifest), rel)) continue;
    // The seeding question, asked of the installed file: "would these bytes make a
    // provable base?" Yes → the file still IS what the engine delivered, nothing is
    // held back. There is no second definition of "unchanged" in this codebase, and
    // this is where a second one would have been written (EOL normalization included,
    // without which the whole Windows fleet reads as holding back every file).
    const verdict = verifyBase({ recorded: provenance[rel], baseContent: installedFileMap[rel] });
    if (verdict.usable) continue;
    // Asked only once the digest has already said "held back" — the digest is right for
    // every file that travels, and this is the second opinion for the ones that cannot.
    if (matchesLocalAncestor(baseContentMap[rel], installedFileMap[rel])) continue;
    held.push({ rel, reason: INSTALLED_REFUSAL[verdict.reason], since: baseRefs[rel] ?? null });
  }
  // By path, because a human reads it — the same comparator, and the same reason for
  // having no equal case, as `syncBaseTree`'s report: a rel appears at most once, so
  // spelling out equality would add a branch no input can reach.
  return held.sort((a, b) => (a.rel < b.rel ? -1 : 1));
}
