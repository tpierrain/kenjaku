// ─────────────────────────────────────────────────────────────────────────────
// repo-status.mjs — decides the "repo" line of the SessionStart banner from git
// facts already collected (no I/O here → testable). Includes the two FAIL-LOUD
// guards, both read AFTER the startup sweep + pull (startup-sync.mjs):
//   - UNMERGED paths → git needs a human decision, and must NOT be told to
//     "commit by hand" (that would bury the conflict markers in a note);
//   - vault notes still UNcommitted → the sweep could not commit them (a git
//     that refused, e.g. no identity configured).
// Either way we SHOUT instead of showing a misleading ✅.
// ─────────────────────────────────────────────────────────────────────────────

// Counts the `git status --porcelain` entries that concern the vault. The
// porcelain format = 2 status chars + space + path (e.g. "?? vault/x.md",
// "  M vault/y.md") → we isolate the path (slice 3) and keep those under vault/.
// No blank-line filter is needed: a blank (or whitespace-only) line cannot start
// with "vault/" once sliced, so the path test already drops it.
export function countVaultUncommitted(porcelainOut) {
  return porcelainOut
    .split("\n")
    .filter((l) => l.slice(3).startsWith("vault/"))
    .length;
}

// Counts the paths git left UNMERGED. Porcelain marks those with a `U` in either
// status column, plus the two U-less twins `AA` (both added) and `DD` (both
// deleted). Only the 2 status chars count — a note NAMED "UU-something.md" is
// ordinary dirt the startup sweep should happily commit. No anchors: the slice
// below IS the anchor (it hands over exactly the 2 status chars, never a path).
const UNMERGED_STATUS = /U.|.U|AA|DD/;

export function countUnmerged(porcelainOut) {
  return porcelainOut
    .split("\n")
    .filter((line) => UNMERGED_STATUS.test(line.slice(0, 2)))
    .length;
}

// The ONE reading of the tree both persistence paths share: the session-start
// sweep and the engine update's own commit. It lived, duplicated, in the sweep
// alone — which is exactly how the update path came to bury conflict markers the
// sweep had learned to refuse. One rule, one place, both callers.
//   "conflicted" → a human must resolve; committing would bury `<<<<<<<`
//   "dirty"      → ordinary uncommitted work, safe to stage
//   "clean"      → nothing to do (a lone newline still reads clean)
export function treeState(porcelainOut) {
  if (countUnmerged(porcelainOut) > 0) return "conflicted";
  return porcelainOut.trim().length > 0 ? "dirty" : "clean";
}

// git speaks the user's locale, so the diagnostic prefix is not always English
// ("erreur : " under a French git). Same reason the "up to date" detection below
// carries its French twin.
const DIAGNOSTIC_PREFIX = /^(error|fatal|erreur)\s*:/i;

// Condenses git's raw stdout+stderr into ONE readable reason, because the
// startup banner is a single line. Git prefixes its diagnostics with `error:` /
// `fatal:` and drowns them in fetch chatter ("From github.com…", "* branch…") →
// we keep only the diagnostic lines, stripped of that redundant prefix.
export function pullFailureReason(pullOut) {
  return (pullOut ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => DIAGNOSTIC_PREFIX.test(l))
    .map((l) => l.replace(DIAGNOSTIC_PREFIX, "").trim())
    .join(" ");
}

// Expected fields:
//   pullOk          : bool   — the `git pull --rebase` succeeded (or no remote → true)
//   pullOut         : string — its output (to detect "up to date")
//   short           : string — short HEAD
//   changedCount    : number — files changed by the pull (if updated)
//   uncommittedVault: number — uncommitted vault files (filtered porcelain)
//   conflictedCount : number — files git left unmerged (the sweep never touches them)
export function repoStatusLine({ pullOk, pullOut, short, changedCount = 0, uncommittedVault = 0, conflictedCount = 0 }) {
  // Highest priority: a conflict is the ONE dirty state the startup sweep refuses
  // to commit, so it is also the one where the usual "commit by hand" advice would
  // do damage. It needs a human, and it must say so first.
  if (conflictedCount > 0) {
    return (
      `⚠️ Sync BLOCKED by a conflict — ${conflictedCount} file(s) hold changes git could not ` +
      `merge on its own. Nothing was committed for you (that would bury the <<<<<<< markers ` +
      `in your notes). Open them, keep what you want, then finish with: git rebase --continue.`
    );
  }
  // Then: uncommitted notes at startup = the sweep couldn't commit them (a git
  // identity missing, a hook that never ran). Flag it loudly, ahead of any
  // reassuring "up to date" status.
  if (uncommittedVault > 0) {
    return (
      `⚠️ ${uncommittedVault} vault note(s) NOT committed — the startup sweep could not ` +
      `commit them. Your notes are ON DISK but not versioned. Commit by hand to get git's ` +
      `own reason: git add -A && git commit (a missing git identity is the usual culprit).`
    );
  }
  if (!pullOk) return `⚠️ Pull failed — ${pullFailureReason(pullOut) || "check manually."}`;
  if (/already up to date|déjà à jour/i.test(pullOut)) return `✅ Repo up to date (commit ${short}).`;
  return `📥 Repo updated — ${changedCount} file(s) changed (commit ${short}).`;
}
