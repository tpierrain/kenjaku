// ─────────────────────────────────────────────────────────────────────────────
// engine-skill-refresh.mjs — WHICH skill files the engine may update, and how they
// are grouped when the owner is told about it (plan Increment 2.5, then S2).
// The proof lives on every deployed brain: `engine-manifest.json` records a sha256
// `provenance` base per `merge` file (installer.mjs / engine-source.mjs), and S1 adds
// the base's BYTES beside it. What is decided from those is `engine-merge.mjs`'s nine
// rows; what reaches the disk is `engine-merge-apply.mjs`'s.
//
// ⚠️ This header used to claim a "PURE decision core… no fs, no side effects". That
// stopped being true at S2a-3, when the verdict moved out and the I/O stayed. The
// extraction at S2b-1 is what finally makes the sentence above accurate.
// ─────────────────────────────────────────────────────────────────────────────
import { selectMergeFiles } from "./engine-source.mjs";
// The journey from verdict to disk, shared with every other family of engine-owned
// file. The DECISION is `engine-merge.mjs`'s; the MERGE is `engine-merge-git.mjs`'s —
// and its default belongs to the carrier, which is the only module that calls it.
import { applyMergeGoverned } from "./engine-merge-apply.mjs";
// SKILLS_PREFIX = the runtime home of the skills a brain uses; STAGING_PREFIX = where a
// staged skill's source ships. Increment 2.5 refreshes SKILLS only: the other `merge`
// files (the constitution, settings.json, the engine-owned scripts) keep their current
// regimes — the constitution's own layering stays a Gate 4 subject.
import { SKILLS_PREFIX, STAGING_PREFIX } from "./staged-skills.mjs";

// The source files eligible for a provenance-gated refresh: those the manifest
// DECLARES engine-owned (`merge` regime) AND that live in the skills tree. A skill the
// manifest never names (the user's own) can never be selected — the founding principle
// of ADR 0012, unchanged here.
export function selectRefreshableSkillFiles({ sourceFiles, manifest }) {
  return selectMergeFiles(manifest, sourceFiles).filter((rel) => rel.startsWith(SKILLS_PREFIX));
}

// The refresh works on (installed path ← source path) pairs, because the two families of
// engine skills do NOT ship at the same place:
//   • the 9 `merge` skills ship AT their runtime path (`.claude/skills/<name>/…`);
//   • the staged ones ship at `engine-skills/<name>/…` and are install-if-absent'd into
//     `.claude/skills/<name>/…` — the sacred scrub forbids delivering a skill under
//     `.claude/skills/` by copy (ADR 0026), which is exactly what protects the owner's.
// Mapping them here lets ONE verdict + ONE write path serve both.
export function refreshableSkillPairs({ sourceFiles, manifest }) {
  const merge = selectRefreshableSkillFiles({ sourceFiles, manifest }).map((rel) => ({ rel, sourceRel: rel }));
  const staged = sourceFiles
    .filter((f) => f.startsWith(STAGING_PREFIX) && f.slice(STAGING_PREFIX.length).includes("/"))
    .map((sourceRel) => ({ rel: SKILLS_PREFIX + sourceRel.slice(STAGING_PREFIX.length), sourceRel }));
  return [...merge, ...staged];
}

// The skill a rel path belongs to: `.claude/skills/switch/SKILL.md` → `switch`.
const skillNameOf = (rel) => rel.slice(SKILLS_PREFIX.length).split("/")[0];

// ─── The skills' wiring onto the shared carrier ──────────────────────────────
// Everything about HOW a verdict reaches the disk lives in `engine-merge-apply.mjs`
// since S2b-1, because the engine scripts (S2b) and the constitution (S2c) need the
// same journey. What is left here is what is genuinely the skills': which files are
// eligible, where each ships from, and that a SKILL — not a file — is what the owner
// is told about.
//
// The report keeps its `skills*` names, so no caller of this function changed.
// `merge` carries NO default here: `applyMergeGoverned` already owns it. Two modules
// naming the same default is two places to change it and one of them to forget —
// the `gitBin` lesson, which the discipline suite caught once already.
export function refreshUntouchedSkills({ brainDir, sourceDir, sourceFiles, manifest, provenance = {}, merge }) {
  const { refreshed, preserved, merged, conflicts, deliveredFileMap } = applyMergeGoverned({
    brainDir,
    sourceDir,
    sourceFiles,
    pairs: refreshableSkillPairs({ sourceFiles, manifest }),
    provenance,
    merge,
    // A skill is a SUBTREE: an owner who edited two of its files edited ONE skill, and
    // what they need to hear is "your coach kept your edits", not a path list.
    groupOf: skillNameOf,
  });
  return {
    skillsRefreshed: refreshed,
    skillsPreserved: preserved,
    skillsMerged: merged,
    conflicts,
    refreshedFileMap: deliveredFileMap,
  };
}
