// ─────────────────────────────────────────────────────────────────────────────
// staged-skills.mjs — deliver UPGRADER-BOUND skills (ADR 0026). The sacred scrub
// (engine-apply-plan) forbids the engine from writing under `.claude/skills/`, so a
// NEW engine skill can't ride in via the `replace` regime directly. Instead its
// canonical source ships at a NON-sacred staging path `engine-skills/<name>/` (a
// `replace` file → pass-1 delivers it, the scrub keeps it), and this helper
// install-if-absent's each staged skill into `<brainDir>/.claude/skills/<name>/`.
//
// install-if-absent at the SKILL-DIR level (mirrors reconcileBrain's merge-skill
// install, ADR 0025): a skill dir already present (possibly user-customized) is left
// byte-identical; a brand-new staged skill is copied in whole. Pure I/O, win32-safe
// (POSIX rels split back to the OS separator, ADR 0015). Returns the installed names.
// ─────────────────────────────────────────────────────────────────────────────
import { readdirSync, mkdirSync, copyFileSync, existsSync, readFileSync } from "node:fs";
import { join, dirname, sep } from "node:path";

import { listFilesRelPosix } from "./fs-walk.mjs";
import { fingerprint } from "./engine-source.mjs";
import { resolveLocaleSource } from "./engine-copy-select.mjs";
import { readBrainLocale } from "./brain-locale.mjs";
import { recogniseInstalled } from "./engine-heal.mjs";
import { isSelfHeal } from "./update-mode.mjs";

// The staging path a staged skill's SOURCE ships at, and where it gets installed.
export const STAGING_PREFIX = "engine-skills/";
export const SKILLS_PREFIX = ".claude/skills/";

// The provenance base of the staged skills — for free, and retroactively for the whole
// deployed fleet (Increment 2.5). Provenance is recorded for `merge` files only, so a
// staged skill has none and would read `no-provenance` forever, frozen at the version it
// was installed at. But the brain's OWN `engine-skills/<name>/` copy IS byte-for-byte
// what the engine last delivered — install-if-absent copied that very subtree into
// `.claude/skills/<name>/`. So it answers the only question the refresh asks: "is what
// is installed still what we delivered?".
//
// ⚠️ MUST be read BEFORE the copy step overwrites `engine-skills/**` (a `replace` glob),
// or the base becomes the NEW content and every staged skill reads as untouched.
// Keyed by the INSTALLED path, so the refresh consumes it like any other base.
export function readStagedProvenance(brainDir) {
  const stagingDir = join(brainDir, STAGING_PREFIX);
  if (!existsSync(stagingDir)) return {}; // pre-staging brain → no base, nothing claimed
  const base = {};
  for (const rel of listFilesRelPosix(stagingDir)) {
    base[SKILLS_PREFIX + rel] = fingerprint(readFileSync(join(stagingDir, rel.split("/").join(sep)), "utf8"));
  }
  return base;
}

// 🩹 THE PROOF THAT CANNOT DRIFT (#115) — and it is why the base above is a STAND-IN
// rather than an answer. `readStagedProvenance` holds only while the staging tree and
// the installed skill move TOGETHER. On the two-pass update out of an old engine they do
// not: the old parent copies `engine-skills/**` (a `replace` glob) before any refresh
// exists to advance the installed skill. From that update on the two disagree FOR EVER —
// `mergeVerdict` reads the installed file as an owner edit, and every later release
// drops a `.new` sidecar while calling a file the owner never opened "customized".
//
// So the installed bytes are proven against what the engine REALLY published, the same
// way `healProvenance` unfroze the merge families: by RECOGNISING them in
// `engine-fingerprints.json`. What comes back is layered OVER the stand-in, never under
// it — recognition is the stronger fact, and a rel nothing recognises is left to the
// stand-in, which is what keeps a genuinely edited skill preserved.
//
// 🛑 MEMBERSHIP, NEVER ARITHMETIC. `recogniseInstalled` hands back the KEY THAT MATCHED,
// so a digest here always names bytes the engine shipped. Compute one from the disk
// instead and an owner's edit reads as untouched at the very next update.
//
// 🛑 AND NOTHING IS PERSISTED FROM HERE. These rels are deliberately absent from the
// manifest's `provenance`: `reseedProvenance` advances merge files only, so a staged
// entry written into the manifest would be frozen at the version it was proven at and
// would then OUTRANK the stand-in for ever — the very defect above, in mirror image.
// Recomputing it at each update is both correct and cheap.
export function proveStagedSkills({ sourceDir, brainDir, table }) {
  // A self-heal refreshes no skill (the three families stand down on `sourceDir ===
  // brainDir`), so this would read the whole installed skills tree at every session
  // start for an answer nobody consumes.
  if (isSelfHeal({ brainDir, sourceDir })) return {};
  const stagingDir = join(sourceDir, STAGING_PREFIX);
  if (!existsSync(stagingDir)) return {};

  // Only DIRECTORIES are skills — the same pole `installStagedSkills` carries below. A
  // `README.md` at the staging root would otherwise be proven at `.claude/skills/
  // README.md`, a rel no brain installs at.
  const installedFileMap = {};
  for (const entry of readdirSync(stagingDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    for (const rel of listFilesRelPosix(join(stagingDir, entry.name))) {
      const installedRel = `${SKILLS_PREFIX}${entry.name}/${rel}`;
      try {
        installedFileMap[installedRel] = readFileSync(join(brainDir, installedRel.split("/").join(sep)), "utf8");
      } catch {
        // Absent (install-if-absent will deliver it whole this very pass) or unreadable.
        // Either way there is nothing to prove, and an update may not die over it.
      }
    }
  }

  return Object.fromEntries(
    recogniseInstalled({ rels: Object.keys(installedFileMap), installedFileMap, table }).map(
      ({ rel, digest }) => [rel, digest],
    ),
  );
}

// 🌍 LOCALE-RESOLVED SINCE T10 (third v5.0.0 review pass). The finding named
// reconcileBrain's merge-skill door; running it here found the SAME defect one door
// along — a French brain received the ENGLISH staged skill and then held it for good,
// because its dir now exists and install-if-absent never fires twice. The resolution is
// ADR 0040 rule 3's own function, not a second locale rule: read `templates/<locale>/
// engine-skills/<name>/…` when a twin exists, write `.claude/skills/<name>/…` either way.
//
// `sourceFiles` and `locale` are injectable because `reconcileBrain` has already computed
// both — walking the tree twice per session-start self-heal would be pure waste — and
// they default here so the installer's call site needs to know nothing about locales.
export function installStagedSkills({
  sourceDir,
  brainDir,
  sourceFiles = listFilesRelPosix(sourceDir),
  locale = readBrainLocale(brainDir),
}) {
  const stagingDir = join(sourceDir, "engine-skills");
  if (!existsSync(stagingDir)) return [];

  const installed = [];
  for (const entry of readdirSync(stagingDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const name = entry.name;
    const destSkillDir = join(brainDir, ".claude", "skills", name);
    if (existsSync(destSkillDir)) continue; // present → preserve, never overwrite

    const srcSkillDir = join(stagingDir, name);
    for (const rel of listFilesRelPosix(srcSkillDir)) {
      // The rel as the SOURCE TREE spells it — what rule 3 resolves against. The staging
      // dir is walked (never `templates/`), so a twin can add no file the root lacks:
      // an FR-only staged file is invisible here, exactly as an FR-only anything is.
      const stagedRel = `${STAGING_PREFIX}${name}/${rel}`;
      const srcRel = resolveLocaleSource({ rel: stagedRel, locale, sourceFiles });
      const dest = join(destSkillDir, rel.split("/").join(sep));
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(join(sourceDir, srcRel.split("/").join(sep)), dest);
    }
    installed.push(name);
  }
  return installed;
}
