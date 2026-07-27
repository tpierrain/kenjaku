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

import { fingerprint, selectMergeFiles } from "./engine-source.mjs";
import { resolveLocaleSource } from "./engine-copy-select.mjs";
import { readBrainLocale } from "./brain-locale.mjs";

// The runtime home of the skills a brain uses. Increment 2.5 refreshes SKILLS only:
// the other `merge` files (the constitution, settings.json, the engine-owned scripts)
// keep their current regimes — the constitution's own layering stays a Gate 4 subject.
const SKILLS_PREFIX = ".claude/skills/";

// The source files eligible for a provenance-gated refresh: those the manifest
// DECLARES engine-owned (`merge` regime) AND that live in the skills tree. A skill the
// manifest never names (the user's own) can never be selected — the founding principle
// of ADR 0012, unchanged here.
export function selectRefreshableSkillFiles({ sourceFiles, manifest }) {
  return selectMergeFiles(manifest, sourceFiles).filter((rel) => rel.startsWith(SKILLS_PREFIX));
}

// Line endings are NOT authorship: a Windows checkout/editor can rewrite LF→CRLF
// without anyone touching a word, and the recorded base was fingerprinted on the LF
// content the engine delivered. Comparing the normalized content too keeps the whole
// Windows fleet eligible for refresh instead of being frozen as "customized".
const normalizeEol = (content) => content.split("\r\n").join("\n");

function matchesBase(installed, base) {
  return fingerprint(installed) === base || fingerprint(normalizeEol(installed)) === base;
}

// The verdict for ONE file, given what the brain has on disk (`installed`, null/undefined
// when absent), the provenance base the engine recorded when it last delivered it
// (`base`), and the content the update would deliver (`candidate`):
//   • absent-install — nothing on disk → deliver it;
//   • preserve (reason: customized | no-provenance) — the owner's copy stands;
//   • unchanged — provably untouched and already up to date → write nothing;
//   • refresh — provably untouched and outdated → overwrite.
export function refreshVerdict({ installed, base, candidate }) {
  if (installed === null || installed === undefined) return { verdict: "absent-install" };
  // No base recorded → "untouched" is UNPROVABLE (not "customized"): keep the owner's
  // copy either way, but the two deserve different prose in the update report.
  if (!base) return { verdict: "preserve", reason: "no-provenance" };
  if (!matchesBase(installed, base)) return { verdict: "preserve", reason: "customized" };
  // Untouched AND already the candidate → write nothing: a converged brain must stay
  // byte-identical, or every update would churn the auto-commit history for a no-op.
  if (normalizeEol(installed) === normalizeEol(candidate)) return { verdict: "unchanged" };
  return { verdict: "refresh" };
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
export function refreshUntouchedSkills({ brainDir, sourceDir, sourceFiles, manifest, provenance = {} }) {
  const skillsRefreshed = [];
  const skillsPreserved = [];
  const refreshedFileMap = {};
  if (resolve(sourceDir) === resolve(brainDir)) return { skillsRefreshed, skillsPreserved, refreshedFileMap };

  const locale = readBrainLocale(brainDir);
  for (const rel of selectRefreshableSkillFiles({ sourceFiles, manifest })) {
    const candidate = readFileSync(join(sourceDir, resolveLocaleSource({ rel, locale, sourceFiles })), "utf8");
    const installedPath = join(brainDir, rel);
    const installed = existsSync(installedPath) ? readFileSync(installedPath, "utf8") : null;
    const { verdict, reason } = refreshVerdict({ installed, base: provenance[rel], candidate });
    const skill = skillNameOf(rel);
    // Any verdict but "preserve: customized" means nothing newer is pending for that
    // file, so a sidecar left by a previous update is now a lie ("a newer version
    // awaits" when the owner already adopted it, or when we just refreshed it).
    if (verdict !== "preserve" || reason !== "customized") rmSync(`${installedPath}.new`, { force: true });
    if (verdict === "refresh") {
      mkdirSync(dirname(installedPath), { recursive: true });
      writeFileSync(installedPath, candidate);
      refreshedFileMap[rel] = candidate;
      if (!skillsRefreshed.includes(skill)) skillsRefreshed.push(skill);
    } else if (verdict === "preserve") {
      // "Never overwritten" must not mean "never offered": drop the engine's version
      // BESIDE the owner's (conffile fallback) so adopting it stays their call. Only
      // when they actually customized it — a `no-provenance` preserve says we cannot
      // PROVE anything, and littering an older brain with 9 unexplained `.new` files
      // would be noise, not a choice. `.new` is not a `SKILL.md`: nothing loads it.
      const newVersionPath = reason === "customized" ? `${rel}.new` : undefined;
      if (newVersionPath) writeFileSync(join(brainDir, newVersionPath), candidate);
      // Reported per SKILL, not per file: what the owner needs to hear is "your
      // prepare-1-1 stands as you wrote it", not a list of paths.
      if (!skillsPreserved.some((p) => p.skill === skill)) {
        skillsPreserved.push(newVersionPath ? { skill, reason, newVersionPath } : { skill, reason });
      }
    }
  }
  return { skillsRefreshed, skillsPreserved, refreshedFileMap };
}
