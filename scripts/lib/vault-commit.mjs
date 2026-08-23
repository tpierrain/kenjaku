// ─────────────────────────────────────────────────────────────────────────────
// vault-commit.mjs — the one commit-the-vault gesture, shared by the two hook
// halves: `auto-commit.mjs` (PostToolUse, on every write) and `auto-push.mjs`
// (Stop, the once-a-turn sweep before the push).
//
// WHY IT LIVES IN `lib/` (T2, third v5.0.0 review pass). It used to live in
// `auto-commit.mjs`, and auto-push imported it from there — but BOTH files are
// `merge` regime and the manifest lists them separately, so an update refreshes
// them independently and either one can stay PRESERVED at its old version when the
// owner has tuned it. An import across that boundary is a promise across versions,
// and v5.0.0 broke it: dropping `isEntryPoint` from auto-commit killed the Stop
// hook — at LINK time, where `node --check` and `verifyWrite` are both blind — on
// every brain holding a customized v4.9.1 auto-push. `scripts/lib/**` is ONE
// `replace` glob: delivered whole, at the engine's version, never preserved. So
// the shared half belongs here, and `engine-script-coupling.test.mjs` keeps it here.
//
// Its tests live in `scripts/auto-commit.test.mjs`, which drives it through the
// re-export the deployed fleet still imports by that name.
// ─────────────────────────────────────────────────────────────────────────────
import { treeState } from "./repo-status.mjs";

export const COMMIT_MESSAGE = "auto: vault/claude sync";

// Commit-only vault persistence: if the tree is dirty, stage everything and
// commit (never pushes — the Stop hook does that once per turn). Returns
// "committed" | "clean" | "conflicted" | "failed". `git` is the injected runner.
// NEVER throws: `buildGit` maps a git that blew up to `{ok: false}`, and this reads
// it rather than assuming success. Best-effort still, but it says which.
//
// "committed" is a CLAIM, so it is only made when git accepted both halves. It used
// to be returned unconditionally, which turned an `.git/index.lock` contention with
// the PostToolUse hook into a silent non-commit reported as a success — the one
// failure mode a second brain must never paper over.
//
// "conflicted" is the one case where persistence steps aside: this hook fires on
// every write, conflict-resolution writes included, and `add .` on an unmerged tree
// stages the `<<<<<<<` markers AND fake-resolves the rebase. The rule is shared
// (`treeState`) with the session-start sweep and the engine update, so all three
// persistence paths refuse the same tree.
export function attemptCommit({ git }) {
  const state = treeState(git(["status", "--porcelain"]).out);
  if (state !== "dirty") return state;
  if (!git(["add", "."]).ok) return "failed";
  if (!git(["commit", "-m", COMMIT_MESSAGE]).ok) return "failed";
  return "committed";
}
