// ─────────────────────────────────────────────────────────────────────────────
// self-heal-detect.mjs — the pure gate for the SessionStart self-heal (ADR 0026,
// Layer B). Decides whether a brain still has a convergence GAP.
//
// FOUR questions, and they are four because an engine update makes two different
// kinds of promise (issue #96). FILES travel through git — scripts, skills, the
// templates — so a second machine gets them by pulling. MACHINE-LOCAL WIRING does
// not: `.claude/settings.json` (which hooks run), `.mcp.json` (which servers are
// registered) and `rag/node_modules` bake absolute paths or are build output, so
// they are gitignored by construction and only a reconcile ON THAT MACHINE
// refreshes them. The gate used to ask about skills and MCP servers only, so a
// release shipping a new HOOK or a new dependency converged on the machine that ran
// the update and nowhere else — silently, because a hook that was never wired runs
// never, and therefore cannot report its own absence.
//
// Pure & injectable (no fs / no JSON parsing / no manifest read here) so the gate is
// trivially testable: the wrapper derives the DESIRED-STATE from the files the engine
// DELIVERS — `wantedSkillDirs` (engine merge skills ∪ staged `engine-skills/`),
// `wantedServerIds` (keys of the delivered `.mcp.json.template`), `unwiredHooks` (the
// engine hook entries the brain's settings.json does not carry, computed by the very
// reconciler that would add them) and `missingDependencies` (declared in the brain's
// `rag/package.json`, absent from its `node_modules`) — and feeds them in alongside
// the real `skillDirExists` / `mcpServerRegistered` predicates (F-B7 2g). Deriving
// desired-state from delivered files — NOT the frozen user manifest, which
// update-engine never refreshes — is what closes the pre-3.3.0 convergence gap.
//
// 🛑 WHAT IS DELIBERATELY NOT ASKED: the permission allowlist. It lives in the same
// untravellable `settings.json`, so it drifts the same way — but an entry that is
// absent because the engine never delivered it and one the owner deliberately
// REMOVED are the same absence, and `/permissions` is a documented escape hatch.
// Detecting it would promise a heal that silently overrides an owner's choice, and
// the reconciler has no allowlist remedy to run anyway: a gate that reports a gap
// nothing can close is worse than one that stays quiet (F14's own lesson).
//
// When it returns `needed === false`, the SessionStart hook is a TRUE no-op (it
// spawns nothing) → fast + idempotent in the steady state.
// ─────────────────────────────────────────────────────────────────────────────

export function detectSelfHealGap({
  wantedSkillDirs = [],
  wantedServerIds = [],
  // Default to empty rather than to a predicate: a caller that does not supply these
  // has not ASKED the question, and an unasked question reports nothing found — never
  // "nothing wrong".
  unwiredHooks = [],
  missingDependencies = [],
  skillDirExists,
  mcpServerRegistered,
}) {
  const missingSkills = wantedSkillDirs.filter((dir) => !skillDirExists(dir));
  const missingServers = wantedServerIds.filter((id) => !mcpServerRegistered(id));
  return {
    needed:
      missingSkills.length > 0 ||
      missingServers.length > 0 ||
      unwiredHooks.length > 0 ||
      missingDependencies.length > 0,
    missingSkills,
    missingServers,
    unwiredHooks,
    missingDependencies,
  };
}

// The dependencies a brain's `rag/package.json` declares that its `node_modules`
// does not hold. Pure: `declared` is the dependency NAMES, `isInstalled` answers for
// one name. Build output is never in git, so a second machine that merely pulled a
// release adding a dependency has the new `package.json` and the old tree — and the
// RAG server then fails at import time, on that machine only.
//
// Names only, never versions: comparing ranges would mean resolving semver against
// what npm actually placed on disk, and a version check that is slightly wrong
// re-runs `npm install` at every session start forever. Absence is unambiguous.
export function missingInstalledDependencies({ declared = [], isInstalled }) {
  return declared.filter((name) => !isInstalled(name));
}
