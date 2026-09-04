// ─────────────────────────────────────────────────────────────────────────────
// universe-persist.mjs — makes a universe switch LEAVE THE MACHINE (issue #69).
//
// WHY this exists: `/switch` writes the .vault-rag pointer through Bash, so
// neither half of the persistence net sees it — auto-commit is a PostToolUse
// hook on Write|Edit, and the Stop hook is push-only. The switch survived as a
// dirty file; close the laptop and the "universe travels with you" promise of
// v4.9.0 was void. Same invariant as engine-commit.mjs: a deterministic write
// owns its own commit, and here its own push too — waiting for the next
// session's sweep is exactly the window where a second machine's stale pointer
// wins (the observed ping-pong).
//
// The staging is SCOPED to .vault-rag/: a switch must never sweep the owner's
// pending notes under its own message. The push reuses the Stop hook's
// attemptPush, so the `secondbrain.autopush` opt-in and its retry are decided
// in ONE place. `git`/`sleep` are injected (same runner shape as auto-commit's).
// ─────────────────────────────────────────────────────────────────────────────
import { treeState } from "./repo-status.mjs";
import { attemptPush, PUSH_FAILED_WARNING } from "../auto-push.mjs";
import { runSwitchCli } from "./universes.mjs";

export function switchCommitMessage(name) {
  return `auto: switch active universe to '${name}'`;
}

// Loud, because the alternative is the silent v4.9.0 defect: a pointer that
// looks switched here and never reaches the other machines.
export const SWITCH_NOT_COMMITTED_WARNING =
  "\n⚠️  SWITCH NOT COMMITTED — the universe changed on THIS machine only and " +
  "will not travel. Run `git status` in your brain to see what stopped the commit.";

// Calm on purpose: a deferral is the NORMAL outcome mid-merge, not a failure —
// the Stop-hook sweep commits (unscoped) at turn end, which git does allow there.
export const SWITCH_COMMIT_DEFERRED_NOTE =
  "\nNote: a merge/rebase is in progress here, so the switch will be committed " +
  "with it at the end of the turn.";

// The states in which git REFUSES a partial (pathspec) commit — "fatal: cannot
// do a partial commit during a merge" — reproduced live on both merge and
// rebase (correctness review, v4.9.1). Probed via rev-parse so the answer is
// git's own, not a guess about .git internals.
const IN_PROGRESS_HEADS = ["MERGE_HEAD", "REBASE_HEAD", "CHERRY_PICK_HEAD"];
const operationInProgress = (git) =>
  IN_PROGRESS_HEADS.some((h) => git(["rev-parse", "-q", "--verify", h]).ok);

// Commits whatever the caller just wrote into .vault-rag, under ITS OWN message.
// Returns "committed" | "clean" | "conflicted" | "deferred" | "failed" — same
// vocabulary as attemptCommit, same shared treeState refusal of an unmerged tree
// (committing there would bury `<<<<<<<` markers). "clean" also covers the
// idempotent re-write: the scoped add staged nothing, so there is nothing to say.
// NEVER throws.
//
// The message is a PARAMETER because .vault-rag is no longer only the universe
// pointer: the duo-mode answers (`authors.json`) live there too and must travel the
// same way, for the same reason (a fact about the world, true on every machine).
// One scoping rule, one opt-in, one retry — and each writer says what it did.
export function commitVaultRagState({ git, message }) {
  const state = treeState(git(["status", "--porcelain"]).out);
  if (state !== "dirty") return state;
  // A paused merge/rebase whose conflicts are already staged reads "dirty", but
  // a pathspec commit is refused there: hands off entirely, defer to the sweep.
  if (operationInProgress(git)) return "deferred";
  if (!git(["add", "-A", "--", ".vault-rag"]).ok) return "failed";
  // The gate AND the commit both carry the pathspec (review finding, v4.9.1):
  // unscoped, work the owner had already staged — a draft, a half-finished
  // conflict resolution — rode along under the switch message. Scoped, it stays
  // exactly where they left it: staged, uncommitted, theirs.
  if (git(["diff", "--cached", "--quiet", "--", ".vault-rag"]).ok) return "clean";
  return git(["commit", "-m", message, "--", ".vault-rag"]).ok ? "committed" : "failed";
}

/** The same commit, under the universe switch's own message. */
export function commitUniverseState({ git, name }) {
  return commitVaultRagState({ git, message: switchCommitMessage(name) });
}

// The whole persistence: commit, then push through the Stop hook's own logic
// (remote + `secondbrain.autopush` opt-in + upstream + something to push). The
// push is GATED on this write having committed (review finding): a failed or
// deferred commit must not turn a .vault-rag write into a push of unrelated
// local commits.
export function persistVaultRagChange({ git, sleep, message }) {
  const commit = commitVaultRagState({ git, message });
  const push = commit === "committed" ? attemptPush({ git, sleep }) : "skipped";
  return { commit, push };
}

/** The same persistence, for a universe switch. */
export function persistUniverseSwitch({ git, sleep, name }) {
  return persistVaultRagChange({ git, sleep, message: switchCommitMessage(name) });
}

// runSwitchCli, then persistence — but ONLY when the CLI says it wrote (`wrote`
// carries the slug): read-only commands and refused switches never touch git.
// Failures are appended to the user-facing message, never swallowed: the switch
// itself did happen on disk (code stays 0), but the owner must hear it stayed
// local. A deferral (paused merge/rebase) is noted calmly, not shouted.
export function runSwitchCliPersisted(io, dir, argv, { git, sleep }) {
  const res = runSwitchCli(io, dir, argv);
  if (!res.wrote) return res;
  const { commit, push } = persistUniverseSwitch({ git, sleep, name: res.wrote });
  let message = res.message;
  if (commit === "failed" || commit === "conflicted") message += SWITCH_NOT_COMMITTED_WARNING;
  if (commit === "deferred") message += SWITCH_COMMIT_DEFERRED_NOTE;
  if (push === "failed") message += PUSH_FAILED_WARNING;
  return { ...res, message };
}
