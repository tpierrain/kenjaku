// ─────────────────────────────────────────────────────────────────────────────
// repo-status.mjs — decides the "repo" line of the SessionStart banner from git
// facts already collected (no I/O here → testable). Includes the FAIL-LOUD
// guard: if vault notes were left UNcommitted, that's the symptom of an
// auto-commit that didn't run (typically silent hooks under nvm / the desktop
// app's minimal PATH) → we SHOUT instead of showing a misleading ✅.
// ─────────────────────────────────────────────────────────────────────────────

// Counts the `git status --porcelain` entries that concern the vault. The
// porcelain format = 2 status chars + space + path (e.g. "?? vault/x.md",
// "  M vault/y.md") → we isolate the path (slice 3) and keep those under vault/.
export function countVaultUncommitted(porcelainOut) {
  return porcelainOut
    .split("\n")
    .filter((l) => l.trim().length > 0)
    .filter((l) => l.slice(3).startsWith("vault/"))
    .length;
}

// git speaks the user's locale, so the diagnostic prefix is not always English
// ("erreur : " under a French git). Same reason the "up to date" detection below
// carries its French twin.
const DIAGNOSTIC_PREFIX = /^(error|fatal|erreur)\s*:\s*/i;

// Condenses git's raw stdout+stderr into ONE readable reason, because the
// startup banner is a single line. Git prefixes its diagnostics with `error:` /
// `fatal:` and drowns them in fetch chatter ("From github.com…", "* branch…") →
// we keep only the diagnostic lines, stripped of that redundant prefix.
export function pullFailureReason(pullOut) {
  return (pullOut ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => DIAGNOSTIC_PREFIX.test(l))
    .map((l) => l.replace(DIAGNOSTIC_PREFIX, ""))
    .join(" ");
}

// Expected fields:
//   pullOk          : bool   — the `git pull --rebase` succeeded (or no remote → true)
//   pullOut         : string — its output (to detect "up to date")
//   short           : string — short HEAD
//   changedCount    : number — files changed by the pull (if updated)
//   uncommittedVault: number — uncommitted vault files (filtered porcelain)
export function repoStatusLine({ pullOk, pullOut, short, changedCount = 0, uncommittedVault = 0 }) {
  // Guard takes priority: uncommitted notes at startup = the auto-commit didn't
  // run. We flag it loudly, ahead of any reassuring "up to date" status.
  if (uncommittedVault > 0) {
    return (
      `⚠️ ${uncommittedVault} vault note(s) NOT committed — the auto-commit didn't ` +
      `run (silent hooks?). Your notes are ON DISK but not versioned. ` +
      `Check the hooks (can scripts/run-node.sh find node?), or commit by hand: ` +
      `git add -A && git commit.`
    );
  }
  if (!pullOk) return `⚠️ Pull failed — ${pullFailureReason(pullOut) || "check manually."}`;
  if (/already up to date|déjà à jour/i.test(pullOut)) return `✅ Repo up to date (commit ${short}).`;
  return `📥 Repo updated — ${changedCount} file(s) changed (commit ${short}).`;
}
