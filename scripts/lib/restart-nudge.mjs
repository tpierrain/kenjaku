// ─────────────────────────────────────────────────────────────────────────────
// restart-nudge.mjs — the "restart Claude" nudge (ship-blocker A2, F-B7d). The
// SessionStart self-heal converges a brain in the background; without a nudge, a user
// never learns they must restart to pick up the freshly-installed skills/MCP.
//
// ⚠️ Which channel carries it — corrected by ADR 0036 (see its matrix; the claim that
// used to sit here, "statusLine IS rendered on Desktop", was false, F4):
//   • CLI      → the SessionStart `systemMessage` (session-status.mjs), plus the
//                opt-in status line for an owner who wired one.
//   • Desktop  → NOTHING deterministic. The 🛑 MANDATORY chat rule in the
//                update-engine skill is the sole delivery, and always was.
//
// Mechanism (deterministic, ADR 0009): the self-heal writes a flag the moment it
// detects the brain's on-disk engine state is AHEAD of what this session loaded (a
// gap → a background reconcile is installing capabilities this session won't pick up);
// status-line reads the flag and shows the segment until a FRESH session — which has
// loaded the converged state — clears it. The flag lives under the gitignored .cache/
// so it is a per-checkout marker, never committed.
//
// Pure decider here (trivially testable); the I/O (flag read/write) is wired by the
// callers (status-line.mjs reads, session-self-heal.mjs writes/clears).
// ─────────────────────────────────────────────────────────────────────────────

// Flag path, relative to the brain root. Under .cache/ → gitignored (cf. .gitignore).
export const RESTART_FLAG_REL = ".cache/restart-needed";

// A restart is pending when the on-disk engine is ahead of what THIS session loaded, by
// EITHER of two independent signals (status-line ORs them):
//   • gapNeeded  — engine-delivered skills/MCP are on disk but not yet installed/registered.
//     This is the signal that fires in the SAME session right after an update whose OLD
//     orchestrator stayed silent: the new status-line.mjs runs on the next refresh, sees the
//     gap, and nudges — no fresh session (and no flag) required. (Thomas's rig-QA failure.)
//   • flagExists — an explicit marker the self-heal / new core writes when it converged code
//     this session predates. Covers "converged on disk, but this conversation hasn't loaded it".
// Pure so the OR-policy is unit-pinned; the I/O (flag read, gap derivation) is the caller's.
export function isRestartPending({ flagExists, gapNeeded }) {
  return Boolean(flagExists || gapNeeded);
}

// Given whether a restart is pending, return the loud statusLine segment, or null when
// nothing is pending (keep the status line clean).
export function restartNudgeSegment(pending) {
  return pending ? "⚠️ RESTART Claude to finish the engine update" : null;
}

// The SAME nudge, on the channel that reaches Desktop and repeats: injected as
// `additionalContext` by a `UserPromptSubmit` hook, so it is re-stated on every prompt until
// the owner actually restarts (ADR 0036's matrix — `systemMessage` and `statusLine` are both
// CLI-only). It INJECTS, it never blocks: a wrong verdict must cost one sentence, never lock
// someone out of their own brain. Returns null when nothing is pending — the normal case, and
// the one that must add exactly nothing to a prompt.
//
// Wording deliberately reuses the update-engine skill's: a FULL close + reopen, then back to
// THIS conversation — never a new one, which is the distinct initial-rooting rule.
export function restartPromptDirective(pending) {
  if (!pending) return null;
  return (
    "🛑 This conversation is running the OLD engine: newer code is on disk, and a session " +
    "loads its hooks, skills and servers only at start. Open your reply by telling the " +
    "owner, calmly and in their own language: fully CLOSE Claude and REOPEN it, then come " +
    "back to THIS same conversation — do not open a new conversation. Then answer them."
  );
}
