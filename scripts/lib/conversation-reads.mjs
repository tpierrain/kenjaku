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
export const MAX_SESSIONS = 50;

// The SessionStart sources that open an EMPTY window. `resume` and `compact` carry a
// window whose earlier reads this record may never have seen.
const FRESH_WINDOW_SOURCES = new Set(["startup", "clear"]);

/**
 * The universe a vault read landed in: the one active when it ran (the server scopes
 * every search to it, ADR 0034), or every universe for an explicit all-universes search.
 */
export function universeOfRead({ toolInput, active }) {
  return toolInput?.allUniverses === true ? ALL_UNIVERSES_READ : active;
}

function sessionsOf(state) {
  const sessions = state?.sessions;
  return sessions && typeof sessions === "object" && !Array.isArray(sessions) ? sessions : null;
}

function universesOf(entry) {
  return Array.isArray(entry?.universes) ? entry.universes : [];
}

function withSession(sessions, sessionId, entry) {
  const kept = Object.entries({ ...sessions, [sessionId]: entry })
    .sort(([, a], [, b]) => (b?.at ?? 0) - (a?.at ?? 0))
    .slice(0, MAX_SESSIONS);
  return { sessions: Object.fromEntries(kept) };
}

/**
 * The record with an EMPTY entry for a conversation that has just begun with an empty
 * window (startup, /clear). This entry is what makes the conversation KNOWN: the record
 * can only vouch for a silence it saw from the first instant. Any other source, or no
 * session id, returns the state as it was (the caller writes nothing). A corrupt record
 * is started afresh. Keeps the MAX_SESSIONS most recent. Does not mutate its input.
 */
export function startSession(state, { sessionId, source, now }) {
  if (!sessionId || !FRESH_WINDOW_SOURCES.has(source)) return state;
  return withSession(sessionsOf(state) ?? {}, sessionId, { universes: [], at: now });
}

/**
 * The record with `universe` added to this conversation's reads — only if the record
 * saw it begin. A conversation it never saw (started before the recorder was wired, or
 * resumed after its entry was pruned) stays unknown: a partial list would name some
 * spheres and hide others. Does not mutate its input.
 */
export function recordRead(state, { sessionId, universe, now }) {
  const sessions = sessionsOf(state);
  if (!sessionId || !sessions || !(sessionId in sessions)) return state;
  const known = universesOf(sessions[sessionId]);
  return withSession(sessions, sessionId, { universes: [...new Set([...known, universe])], at: now });
}

/** This conversation's universes, or null when the record never saw it begin. */
export function readsFor(state, sessionId) {
  const sessions = sessionsOf(state);
  if (!sessions || !(sessionId in sessions)) return null;
  return universesOf(sessions[sessionId]);
}

/**
 * What the switch may rely on: this conversation's reads when they are KNOWN, otherwise
 * null — which makes the residue reminder fall back to a conditional sentence rather
 * than guess.
 */
export function conversationReads({ sessionId, state }) {
  if (!sessionId) return null;
  return readsFor(state, sessionId);
}
