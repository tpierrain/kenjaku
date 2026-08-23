// ─────────────────────────────────────────────────────────────────────────────
// staged-health-note.mjs — deliver the UPGRADER-BOUND `health_check` canary note
// (ADR 0026). Its runtime home `vault/engine-health/health-check.md` is SACRED
// (engine-apply-plan scrubs `vault/`), so the engine can't write it there directly.
// Instead its canonical source ships at the NON-sacred staging path
// `engine-health/health-check.md` (a `replace` file → pass-1/update delivers it,
// the scrub keeps it), and this helper install-if-absent's it into the vault.
//
// Works in BOTH update (sourceDir !== brainDir) and SessionStart self-heal
// (sourceDir === brainDir) modes: the staged source is on the brain's OWN disk, and
// src path `engine-health/…` ≠ dest `vault/engine-health/…`, so it is never a
// self-copy (cf. staged-skills). Never overwrites a present vault note (a user may
// have edited it). Returns whether the vault note is present (for the caller's
// reindex pairing — a seeded-but-unindexed note would be a false `broken`).
// ─────────────────────────────────────────────────────────────────────────────
import { mkdirSync, copyFileSync, existsSync } from "node:fs";
import { join, dirname, sep } from "node:path";

import { listFilesRelPosix } from "./fs-walk.mjs";
import { resolveLocaleSource } from "./engine-copy-select.mjs";
import { readBrainLocale } from "./brain-locale.mjs";

const STAGED_NOTE = "engine-health/health-check.md";
// Where the canary lives once seeded, brain-relative. Exported because whoever
// REBUILDS a brain has to know it too (the rehydrate command, F14) — and a second
// spelling of this path is a canary that silently stops being found.
export const VAULT_NOTE = "vault/engine-health/health-check.md";

// 🌍 LOCALE-RESOLVED SINCE T10 (third v5.0.0 review pass). The canary is the one artefact
// an owner reads in their own language at the exact moment they are checking whether
// their brain works, and it was delivered from the root regardless of locale. No twin
// exists yet, so this is future-proofing rather than a live regression — but that is
// precisely what ADR 0040 rule 1 promises: a localized artefact is covered the moment its
// twin exists, with no code change and no decision.
//
// The EXISTENCE check stays on the ROOT rel: the root staging path is what declares that
// the release ships a canary at all, so a twin committed ahead of its English source
// seeds nothing rather than a note the release does not carry.
export function seedHealthNote({
  sourceDir,
  brainDir,
  sourceFiles = listFilesRelPosix(sourceDir),
  locale = readBrainLocale(brainDir),
}) {
  const src = join(sourceDir, STAGED_NOTE);
  const dest = join(brainDir, VAULT_NOTE);
  if (existsSync(src) && !existsSync(dest)) {
    const srcRel = resolveLocaleSource({ rel: STAGED_NOTE, locale, sourceFiles });
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(join(sourceDir, srcRel.split("/").join(sep)), dest);
  }
  return { present: existsSync(dest) };
}
