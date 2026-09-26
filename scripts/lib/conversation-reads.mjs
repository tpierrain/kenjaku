// ─────────────────────────────────────────────────────────────────────────────
// conversation-reads.mjs — what THIS conversation read, per session id (issue #130).
//
// `/switch` used to tell a brand-new conversation "I still have everything I read in
// 'acme'" because the core knew only which universe was active before — often left
// there by an EARLIER session — and nothing about the conversation. This module is
// the missing record: the `conversation-reads.mjs` PostToolUse hook adds the universe
// a vault read ran in, and the switch CLI reads it back to say only what is true.
//
// Pure: the hook and the CLI own every byte of I/O. The record is keyed by the
// session id the harness hands every hook (and exports to Bash as
// CLAUDE_CODE_SESSION_ID), which is also what makes it reset on `/clear`.
// ─────────────────────────────────────────────────────────────────────────────
import { ALL_UNIVERSES_READ } from "./universes.mjs";

/** How many conversations the file remembers. A switch only ever asks about its own. */
export const MAX_SESSIONS = 20;

// The engine script whose presence under PostToolUse means reads ARE being recorded.
const RECORDER_SCRIPT = "scripts/conversation-reads.mjs";

/**
 * The universe a vault read landed in: the one active when it ran (the server scopes
 * every search to it, ADR 0034), or every universe for an explicit all-universes search.
 */
export function universeOfRead({ toolInput, active }) {
  return toolInput?.allUniverses === true ? ALL_UNIVERSES_READ : active;
}

function sessionsOf(state) {
  const sessions = state?.sessions;
  return sessions && typeof sessions === "object" && !Array.isArray(sessions) ? sessions : {};
}

function universesOf(entry) {
  return Array.isArray(entry?.universes) ? entry.universes : [];
}

/**
 * The record with `universe` added to this session's reads. Without a session id there
 * is nothing to key it on, so the state is returned as it was (the caller writes
 * nothing). A corrupt record is started afresh: a hook must never wedge a read.
 * Keeps the MAX_SESSIONS most recent sessions. Does not mutate its input.
 */
export function recordRead(state, { sessionId, universe, now }) {
  if (!sessionId) return state;
  const sessions = { ...sessionsOf(state) };
  const known = universesOf(sessions[sessionId]);
  sessions[sessionId] = { universes: [...new Set([...known, universe])], at: now };
  const kept = Object.entries(sessions)
    .sort(([, a], [, b]) => (b?.at ?? 0) - (a?.at ?? 0))
    .slice(0, MAX_SESSIONS);
  return { sessions: Object.fromEntries(kept) };
}

/** The universes this session read in; none when it never read (or the file is bad). */
export function readsFor(state, sessionId) {
  return universesOf(sessionsOf(state)[sessionId]);
}

/**
 * Whether this brain's settings.json runs the recorder after a tool call. Without it
 * an empty record proves nothing (a brain not yet updated records no read at all).
 */
export function recorderWired(settingsText) {
  try {
    const groups = JSON.parse(settingsText)?.hooks?.PostToolUse;
    if (!Array.isArray(groups)) return false;
    return groups.some((g) =>
      (g?.hooks ?? []).some((h) => typeof h?.command === "string" && h.command.includes(RECORDER_SCRIPT))
    );
  } catch {
    return false;
  }
}

/**
 * What the switch may rely on: this conversation's reads when they are KNOWN (a session
 * id, and a recorder wired to have written them), otherwise null — which makes the
 * residue reminder fall back to a conditional sentence rather than guess.
 */
export function conversationReads({ sessionId, state, settingsText }) {
  if (!sessionId || !recorderWired(settingsText)) return null;
  return readsFor(state, sessionId);
}
