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
import { treeState } from "./repo-status.mjs";

export function commitMessage(ref) {
  return `engine: update to ${ref}`;
}

// Returns "committed" | "clean" | "conflicted". Stages everything (`add -A`)
// rather than the copied-file list: the manifest, the launchers and the
// reconciler's own writes all land at different steps, and only "stage it all"
// actually guarantees the clean-tree invariant.
//
// EXCEPT on an unmerged tree: an update can be asked for while a rebase is
// stopped on a conflict, and `add -A` there would bury `<<<<<<<` markers in the
// files it stages — including the manifest the NEXT update parses. Same hazard
// and same answer as the session-start sweep (`sweepThenPull`): hands off, and
// let the report say why the tree was left dirty.
export function commitEngineUpdate({ git, ref }) {
  const state = treeState(git(["status", "--porcelain"]).out);
  if (state !== "dirty") return state; // "conflicted" and "clean" are both answers
  git(["add", "-A"]);
  // git can refuse for reasons that have nothing to do with us — no `user.email` on a
  // fresh machine being the common one. Reporting "committed" then would tell the
  // owner their engine files are safe while the tree stays staged and dirty, and the
  // report is the one place that could have named the cause.
  const committed = git(["commit", "-m", commitMessage(ref)]);
  return committed.ok ? "committed" : "refused";
}

// The real seam update-engine wires by default (the Gate injects a stub instead).
// It reuses auto-commit's git runner so both persistence paths map git failures
// the same way. It never PUSHES: the push stays opt-in (`secondbrain.autopush`),
// debounced by the Stop hook.
export function defaultCommitEngineWrites({ brainDir, ref }) {
  return commitEngineUpdate({ git: buildGit(brainDir), ref });
}
