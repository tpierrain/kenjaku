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

// ─────────────────────────────────────────────────────────────────────────────
// S10-4 — THE SAFETY COMMIT, before the one offer that destroys.
//
// 🚨 WHY THIS IS THE ONE PLACE A GIT FAILURE MUST STOP THE CALLER. Everywhere else
// in this codebase a refused commit is NEWS: the files are already on disk, and the
// report names the cause (`commitEngineUpdate`, just above, is the reference). Here
// it is a VETO, because the write has not happened yet and it is not undoable.
//
// Measured in the plan's § S10-0, and it is the whole reason this exists: an edit
// the owner already committed is recoverable from git history, but an edit made
// outside a session and never swept is **overwritten and then committed over, in one
// pass, with no trace** — `auto-commit` stages the whole tree and `engine-commit`
// runs after the update wrote. "Take the new one" is the only offer that can do that,
// so it is the one that has to earn it.
//
// 🧭 WHAT THIS FUNCTION CANNOT DO, said plainly rather than implied: it has no idea
// when the caller writes, so it cannot enforce "before". What it CAN do is refuse to
// say `proceed` unless the owner's current bytes are in history — which is why the
// verdict is ONE field and not a string for each caller to interpret its own way.
// ─────────────────────────────────────────────────────────────────────────────

// Written for whoever reads `git log` a year from now knowing none of this machinery:
// what was saved, whose it was, and what was about to happen to it.
export const SAFETY_COMMIT_MESSAGE = (rel) => `safety: your ${rel} saved before taking the engine's version`;

// A veto the owner cannot read is a file that silently did not change — the blind spot
// S10 exists to close, wearing a different coat. One sentence per blocking outcome:
// what was NOT done, why, and the one thing that lifts it.
export const ADOPTION_BLOCKED_LINE = {
  refused: (rel) =>
    `I left ${rel} exactly as it is: git would not save your current version first` +
    ` (often: no name/email set yet — git config --global user.email "you@example.com"),` +
    ` and I will not overwrite something I cannot give you back.`,
  conflicted: (rel) =>
    `I left ${rel} exactly as it is: your brain's repo has a merge in progress, so saving your` +
    ` current version first would bury the conflict markers. Finish that merge and ask me again.`,
};

// `{ outcome, proceed }`. `proceed` is the ONLY thing a caller should branch on: the
// rule "which outcomes are safe" lives here, so a second caller cannot invent a looser
// one. `outcome` is for the sentence and the log, never for the decision.
export function safetyCommit({ git, rel }) {
  const state = treeState(git(["status", "--porcelain"]).out);
  // Nothing on disk to lose — `auto-commit` has already swept, which is the common
  // case. An empty commit here would be noise in the owner's history standing for a
  // risk that was never taken.
  if (state === "clean") return { outcome: "clean", proceed: true };
  // Same hazard, same answer as `commitEngineUpdate` and the session-start sweep:
  // `add -A` on an unmerged tree buries `<<<<<<<` markers in what it stages.
  if (state === "conflicted") return { outcome: "conflicted", proceed: false };
  // `add -A`, never the one file. The owner's edit to the file being adopted is the
  // obvious casualty; the note they wrote in the same minute is the quiet one, and
  // this commit exists to make the whole moment before the overwrite recoverable.
  git(["add", "-A"]);
  const committed = git(["commit", "-m", SAFETY_COMMIT_MESSAGE(rel)]);
  return committed.ok ? { outcome: "committed", proceed: true } : { outcome: "refused", proceed: false };
}
