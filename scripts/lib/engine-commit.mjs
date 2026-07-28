// ─────────────────────────────────────────────────────────────────────────────
// engine-commit.mjs — commits what an engine update just wrote into the brain.
//
// WHY this exists: an update rewrites engine-owned, VERSIONED files (the
// manifest, scripts/lib/**, launchers…). Nothing else commits them: the brain's
// auto-commit is a hook fired by a session WRITE, so a user who only reads for a
// few days never triggers it. Meanwhile the SessionStart `git pull --rebase`
// refuses to run on a dirty tree → the brain silently stops syncing, on every
// start, until someone commits by hand. Owning the commit here keeps the
// invariant: an update NEVER leaves the repo dirty.
//
// `git` is the injected runner (same shape as auto-commit's: args → {out, ok}),
// so the whole decision is unit-testable without a real repo.
// ─────────────────────────────────────────────────────────────────────────────

import { buildGit } from "../auto-commit.mjs";

export function commitMessage(ref) {
  return `engine: update to ${ref}`;
}

// Returns "committed" | "clean". Stages everything (`add -A`) rather than the
// copied-file list: the manifest, the launchers and the reconciler's own writes
// all land at different steps, and only "stage it all" actually guarantees the
// clean-tree invariant.
export function commitEngineUpdate({ git, ref }) {
  const dirty = git(["status", "--porcelain"]).out.trim().length > 0;
  if (!dirty) return "clean";
  git(["add", "-A"]);
  git(["commit", "-m", commitMessage(ref)]);
  return "committed";
}

// The real seam update-engine wires by default (the Gate injects a stub instead).
// It reuses auto-commit's git runner so both persistence paths map git failures
// the same way. It never PUSHES: the push stays opt-in (`secondbrain.autopush`),
// debounced by the Stop hook.
export function defaultCommitEngineWrites({ brainDir, ref }) {
  return commitEngineUpdate({ git: buildGit(brainDir), ref });
}
