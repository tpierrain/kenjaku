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

// Commits the .vault-rag state (pointer + registry). Returns "committed" |
// "clean" | "conflicted" | "failed" — same vocabulary as attemptCommit, same
// shared treeState refusal of an unmerged tree (committing there would bury
// `<<<<<<<` markers). "clean" also covers the idempotent re-switch: the scoped
// add staged nothing, so there is nothing to say. NEVER throws.
export function commitUniverseState({ git, name }) {
  const state = treeState(git(["status", "--porcelain"]).out);
  if (state !== "dirty") return state;
  if (!git(["add", "-A", "--", ".vault-rag"]).ok) return "failed";
  // The gate AND the commit both carry the pathspec (review finding, v4.9.1):
  // unscoped, work the owner had already staged — a draft, a half-finished
  // conflict resolution — rode along under the switch message. Scoped, it stays
  // exactly where they left it: staged, uncommitted, theirs.
  if (git(["diff", "--cached", "--quiet", "--", ".vault-rag"]).ok) return "clean";
  return git(["commit", "-m", switchCommitMessage(name), "--", ".vault-rag"]).ok
    ? "committed"
    : "failed";
}

// The whole persistence: commit, then push through the Stop hook's own logic
// (remote + `secondbrain.autopush` opt-in + upstream + something to push).
export function persistUniverseSwitch({ git, sleep, name }) {
  const commit = commitUniverseState({ git, name });
  const push = attemptPush({ git, sleep });
  return { commit, push };
}

// runSwitchCli, then persistence — but ONLY when the CLI says it wrote (`wrote`
// carries the slug): read-only commands and refused switches never touch git.
// Failures are appended to the user-facing message, never swallowed: the switch
// itself did happen on disk (code stays 0), but the owner must hear it stayed
// local.
export function runSwitchCliPersisted(io, dir, argv, { git, sleep }) {
  const res = runSwitchCli(io, dir, argv);
  if (res.code !== 0 || !res.wrote) return res;
  const { commit, push } = persistUniverseSwitch({ git, sleep, name: res.wrote });
  let message = res.message;
  if (commit === "failed" || commit === "conflicted") message += SWITCH_NOT_COMMITTED_WARNING;
  if (push === "failed") message += PUSH_FAILED_WARNING;
  return { ...res, message };
}
