// ─────────────────────────────────────────────────────────────────────────────
// conversation-reads.mjs — which universes THIS conversation read notes from, per
// session id (issue #130).
//
// `/switch` used to tell a brand-new conversation "I still have everything I read in
// 'acme'" because the core knew only which universe was active before — often left
// there by an EARLIER session — and nothing about the conversation. This module is
// the missing record: the `conversation-reads.mjs` hook adds the universe of every
// note a vault tool RETURNED, and the switch CLI reads it back to say only what is true.
//
// Why the notes and not the pointer: the pointer says where the server meant to look;
// the notes say what reached the window. An answer with no citation (no results, a
// stale-index gate) read nothing, an all-universes search read exactly the universes
// it returned, and a get_document read the universe of the note it opened.
//
// The record is one append-only file per conversation (one universe per line), so
// two hooks running at once can never erase each other: the worst they do is write
// the same line twice, which parseReads collapses.
//
// Pure: the hook and the CLI own every byte of I/O. The key is the session id the
// harness hands every hook (and exports to Bash as CLAUDE_CODE_SESSION_ID), which is
// also what makes the record reset on `/clear`.
// ─────────────────────────────────────────────────────────────────────────────
import { DEFAULT_UNIVERSE } from "./universes.mjs";

/** How many conversations are remembered. A switch only ever asks about its own. */
export const MAX_SESSIONS = 50;

// The SessionStart sources that open an EMPTY window. `resume` and `compact` carry a
// window whose earlier reads this record may never have seen.
const FRESH_WINDOW_SOURCES = new Set(["startup", "clear"]);

// A session id is used as a file name: only the shape the harness actually hands out
// (a UUID) and nothing that could climb out of the record's directory.
const SAFE_SESSION_ID = /^[A-Za-z0-9_-]{1,128}$/;

// One citation line of formatSearchCitations (rag/src/lib/citation-renderer.ts), at
// the start of a line: "**Path:** `vault/<path>` | **Type:** …".
const CITATION_PATH = /^\*\*Path:\*\* `vault\/([^`]+)` \|/gm;

// A leading YAML frontmatter block, CRLF-tolerant (cf. stamp-universe.mjs).
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
const UNIVERSE_KEY = /^universe:[ \t]+(.*?)[ \t]*\r?$/m;

/** The file name for a session's record, or null when the id is unusable as one. */
export function sessionFileName(sessionId) {
  return typeof sessionId === "string" && SAFE_SESSION_ID.test(sessionId) ? sessionId : null;
}

/** Whether a SessionStart source begins with an empty window (startup, /clear). */
export function opensFreshWindow(source) {
  return FRESH_WINDOW_SOURCES.has(source);
}

// The text parts of a tool response, whichever shape it arrives in: the MCP content
// array (what PostToolUse hands over), that array wrapped in `{ content }`, or a string.
function responseTexts(toolResponse) {
  if (typeof toolResponse === "string") return [toolResponse];
  const content = Array.isArray(toolResponse) ? toolResponse : toolResponse?.content;
  return Array.isArray(content) ? content.map((c) => c?.text).filter((t) => typeof t === "string") : [];
}

/**
 * The vault-relative paths of the notes a vault tool put in the window: every
 * citation of a search_vault answer, or the one note a get_document opened. Anything
 * else — another tool, an answer without a citation — read no note.
 */
export function citedNotePaths({ toolName, toolInput, toolResponse }) {
  const name = String(toolName);
  if (name.endsWith("get_document")) {
    const path = toolInput?.path;
    return typeof path === "string" && path ? [path] : [];
  }
  if (name.endsWith("search_vault")) {
    return responseTexts(toolResponse).flatMap((text) => [...text.matchAll(CITATION_PATH)].map((m) => m[1]));
  }
  return [];
}

/** A note's universe: its frontmatter `universe:`, or the cross-cutting default (also for
 * a note that could not be read, passed as null). */
export function universeOfNote(raw) {
  const block = String(raw).match(FRONTMATTER);
  const declared = block?.[1].match(UNIVERSE_KEY)?.[1].replace(/^(["'])(.*)\1$/, "$2").trim();
  return declared || DEFAULT_UNIVERSE;
}

/** The named universes (never the default, which no switch puts out of scope), once each. */
export function namedUniverses(universes) {
  return [...new Set(universes)].filter((u) => u !== DEFAULT_UNIVERSE);
}

/** The universes in a record file's text: one per line, blanks and repeats collapsed. */
export function parseReads(text) {
  return [...new Set(String(text).split(/\r?\n/).map((l) => l.trim()).filter(Boolean))];
}

/** What to append to a record so it holds `universes`: only the missing ones, a line each. */
export function linesToAppend(knownText, universes) {
  const known = new Set(parseReads(knownText));
  return [...new Set(universes)].filter((u) => !known.has(u)).map((u) => `${u}\n`).join("");
}

/** A record's text with universe `from` renamed `to` (rename-universe.mjs). */
export function renameInReads(text, from, to) {
  const renamed = parseReads(text).map((u) => (u === from ? to : u));
  return [...new Set(renamed)].map((u) => `${u}\n`).join("");
}

/** The record files to delete so only the `keep` most recent conversations remain. */
export function sessionsToPrune(entries, keep = MAX_SESSIONS) {
  return [...entries]
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .slice(keep)
    .map((e) => e.name);
}
