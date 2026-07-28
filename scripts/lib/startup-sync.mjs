// ─────────────────────────────────────────────────────────────────────────────
// startup-sync.mjs — the SessionStart repo sequence: SWEEP the tree clean, THEN
// pull. The order is the whole point, so it lives in one testable function.
//
// WHY the sweep: `git pull --rebase` refuses to run on a dirty tree, and a brain
// gets dirtied by writers no Claude hook ever sees — an engine update's own files,
// or a note edited in Obsidian. Left alone, the brain silently stops syncing at
// EVERY start until a human commits by hand. A SessionStart hook is a fresh node
// process reading this file off disk, so the sweep is live at the first restart
// after an update — including the update that installs it (ADR 0011).
//
// `git` is the injected runner (args → {out, ok}), same seam as auto-commit's.
// ─────────────────────────────────────────────────────────────────────────────
import { treeState } from "./repo-status.mjs";

export const SWEEP_MESSAGE = "auto: session-start sweep (outside-Claude edits or engine writes)";

export function sweepThenPull({ git }) {
  const porcelain = git(["status", "--porcelain"]).out;
  // An interrupted rebase/merge leaves UNMERGED paths. Sweeping those would bury
  // `<<<<<<<` markers in a note AND fake-resolve the rebase → hands off, and let
  // the pull fail loudly instead (the banner then says why). `treeState` is that
  // rule, shared with the engine update's own commit so the two cannot drift.
  const state = treeState(porcelain);
  const swept = state === "dirty" ? "committed" : state;
  if (swept === "committed") {
    git(["add", "-A"]);
    git(["commit", "-m", SWEEP_MESSAGE]);
  }
  const hasRemote = git(["remote"]).out.trim().length > 0;
  const pull = hasRemote ? git(["pull", "--rebase"]) : { out: "already up to date", ok: true };
  return { swept, pullOk: pull.ok, pullOut: pull.out };
}
