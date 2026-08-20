// ─────────────────────────────────────────────────────────────────────────────
// engine-skill-refresh.mjs — the PURE decision core of "refresh an engine-shipped
// skill if, and only if, we can PROVE nobody touched it" (plan Increment 2.5).
// The proof already exists on every deployed brain: `engine-manifest.json` records a
// sha256 `provenance` base per `merge` file (installer.mjs / engine-source.mjs), so a
// file whose hash still matches that base is byte-identical to what the engine last
// delivered → safe to overwrite. Anything else is the owner's property.
// No fs, no side effects: the caller reads the bytes and applies the verdict.
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { selectMergeFiles } from "./engine-source.mjs";
// WHERE the ancestor lives. The proof itself, and every question asked of it, belong
// to `engine-merge.mjs` — this module reads bytes and writes bytes, nothing more.
import { baseRelPath } from "./engine-base.mjs";
import { mergeVerdict } from "./engine-merge.mjs";
import { mergeWithGit } from "./engine-merge-git.mjs";
import { resolveLocaleSource } from "./engine-copy-select.mjs";
import { readBrainLocale } from "./brain-locale.mjs";
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

// ─── I/O orchestrator (the reconciler's thin wiring) ─────────────────────────
// Applies the verdict above to every engine-declared skill file, reading the source
// through the brain's own locale (trap T2) and returning what it did, per SKILL.
//
// ⚠️ GUARD: `sourceDir === brainDir` means SessionStart self-heal — no new content, and
// nobody asked for anything. A skill is only ever overwritten during an update the owner
// explicitly requested (auto-finalize hands the reconciler the FETCHED source).
export function refreshUntouchedSkills({
  brainDir,
  sourceDir,
  sourceFiles,
  manifest,
  provenance = {},
  merge = mergeWithGit,
}) {
  const skillsRefreshed = [];
  const skillsPreserved = [];
  const skillsMerged = [];
  const conflicts = [];
  const refreshedFileMap = {};
  const report = { skillsRefreshed, skillsPreserved, skillsMerged, conflicts, refreshedFileMap };
  if (resolve(sourceDir) === resolve(brainDir)) return report;

  const locale = readBrainLocale(brainDir);
  // Reported per SKILL, not per file: what the owner needs to hear is "your prepare-1-1
  // stands as you wrote it", not a list of paths.
  const noteOnce = (list, entry) => {
    if (!list.some((seen) => seen.skill === entry.skill)) list.push(entry);
  };

  for (const { rel, sourceRel } of refreshableSkillPairs({ sourceFiles, manifest })) {
    const candidate = readFileSync(join(sourceDir, resolveLocaleSource({ rel: sourceRel, locale, sourceFiles })), "utf8");
    const installedPath = join(brainDir, rel);
    const installed = existsSync(installedPath) ? readFileSync(installedPath, "utf8") : null;
    // The ancestor is read HERE rather than handed in: this module already holds
    // `brainDir` and already reads the disk, so the merge reaches the skills without a
    // single caller signature changing. A brain that has never held a tree simply reads
    // `null`, which is `verifyBase`'s `absent` — and the verdict degrades accordingly.
    const basePath = join(brainDir, baseRelPath(rel));
    const baseContent = existsSync(basePath) ? readFileSync(basePath, "utf8") : null;
    const skill = skillNameOf(rel);

    let outcome;
    try {
      outcome = mergeVerdict({ installed, recorded: provenance[rel], baseContent, candidate, merge });
    } catch {
      // The merge seam throws on a TECHNICAL failure (a git that cannot run), never on a
      // conflict. Letting that escape would take a whole update down over one skill, so
      // this file degrades to what a brain with no ancestor gets — the owner's copy
      // stands, the engine's version waits beside it — and the run goes on.
      outcome = { verdict: "preserve", reason: "merge-failed", sidecar: candidate };
    }
    const { verdict, reason, write, deliver, sidecar } = outcome;

    // A sidecar left by a previous update is a claim ("a newer version awaits") that only
    // two verdicts still back: a preserved customization, and a real conflict. Any other
    // makes it a lie — the owner adopted it, or we just merged under it — so it goes.
    // Cleared UNCONDITIONALLY, and the branches below re-drop it where it is still true:
    // guarding this on the verdict would be redundant with that write (rm-then-write and
    // write-alone leave the same bytes), i.e. a condition no test could tell apart.
    rmSync(`${installedPath}.new`, { force: true });

    // ONE place decides whether bytes reach the disk, and it is byte equality: a merge
    // whose result is what was already installed must not churn the auto-commit history
    // for a no-op, and neither must a converged brain.
    if (write !== undefined && write !== installed) {
      mkdirSync(dirname(installedPath), { recursive: true });
      writeFileSync(installedPath, write);
    }
    // 🛑 What the engine DELIVERED, never what was written. On a clean merge those are
    // different bytes, and this map feeds `reseedProvenance` and `syncBaseTree`: recording
    // the merged file as the ancestor would make it read untouched at the next update, and
    // the fast-forward would clobber the edit that was just preserved.
    if (deliver !== undefined) refreshedFileMap[rel] = deliver;
    // "Never overwritten" must not mean "never offered": the engine's version (or, on a
    // conflict, the marked-up merge — everything mergeable already merged) lands BESIDE
    // the owner's so adopting it stays their call. `.new` is not a `SKILL.md`: nothing
    // loads it. A `no-provenance` preserve gets none: it says we cannot PROVE anything,
    // and littering an older brain with unexplained sidecars would be noise, not a choice.
    if (sidecar !== undefined) writeFileSync(`${installedPath}.new`, sidecar);

    // `absent-install` reports down the SAME path as `refresh`: a skill is a SUBTREE, and
    // install-if-absent decides at the skill-DIR level (`reconcile-brain.mjs` step 2.bis),
    // so a `references/` file a release adds under a skill the brain ALREADY has is
    // invisible to it. Dropping it here would leave that file unreachable by any number of
    // updates — the core/skill drift of increment 2.5, one level down.
    if (verdict === "refresh" || verdict === "absent-install") {
      if (!skillsRefreshed.includes(skill)) skillsRefreshed.push(skill);
    } else if (verdict === "merge") {
      if (!skillsMerged.includes(skill)) skillsMerged.push(skill);
    } else if (verdict === "conflict") {
      noteOnce(conflicts, { skill, newVersionPath: `${rel}.new` });
    } else if (verdict === "preserve") {
      noteOnce(skillsPreserved, sidecar === undefined ? { skill, reason } : { skill, reason, newVersionPath: `${rel}.new` });
    }
  }
  return report;
}
