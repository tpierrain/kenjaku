#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// conversation-reads.mjs — the hook that RECORDS which universes a conversation read
// notes from (issue #130). Two events, one record per conversation:
//   • SessionStart (startup, /clear) — creates an EMPTY record for the conversation.
//     That record is what makes it known: it only vouches for a window it saw begin.
//   • PostToolUse(mcp__vault-rag__search_vault|get_document) — appends the universe of
//     every note the tool returned (its own frontmatter), once each.
//
// `/switch` reads it back (set-active-universe.mjs) so its residue disclosure says
// only what is true: nothing to a conversation that read nothing, and every universe
// a conversation did read, even two switches ago. The decisions live in
// lib/conversation-reads.mjs (pure); this file is only the contract with the harness.
//
// It NEVER speaks and never blocks: no stdout, always exit 0. It runs after every
// vault read, so anything unexpected (unreadable stdin, no session id, a missing
// note, a read-only disk) leaves the read exactly as it was, in silence — and the
// worst a lost record costs is that one switch says nothing it should have said
// about a read the hook missed.
// ─────────────────────────────────────────────────────────────────────────────
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { runAsEntrypoint } from "./lib/entrypoint.mjs";
import {
  citedNotePaths,
  linesToAppend,
  namedUniverses,
  opensFreshWindow,
  parseReads,
  renameInReads,
  sessionFileName,
  sessionsToPrune,
  universeOfNote,
} from "./lib/conversation-reads.mjs";
import { isMultiverse, readRegistry, vaultRagDir } from "./lib/universes.mjs";

// Per-machine, gitignored, throwaway: what a conversation read is a property of that
// conversation, never of the brain, so it must not travel with it.
export const CONVERSATION_READS_DIR_REL = join(".cache", "conversation-reads");

const readsDir = (brainDir) => join(brainDir, CONVERSATION_READS_DIR_REL);

function recordPath(brainDir, sessionId) {
  const name = sessionFileName(sessionId);
  return name ? join(readsDir(brainDir), name) : null;
}

/** This conversation's universes, or null when the record never saw it begin. */
export function readConversationReads(brainDir, sessionId) {
  // No usable id (a null path) and no record (ENOENT) both land in the catch: unknown.
  try {
    return parseReads(readFileSync(recordPath(brainDir, sessionId), "utf8"));
  } catch {
    return null;
  }
}

/** Renames a universe in every local record (rename-universe.mjs). */
export function renameConversationReads(brainDir, from, to) {
  const dir = readsDir(brainDir);
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    writeFileSync(path, renameInReads(readFileSync(path, "utf8"), from, to));
  }
}

const fsIo = { existsSync, readFileSync: (path) => readFileSync(path, "utf8") };

export const realReadsDeps = {
  readInput: () => readFileSync(0, "utf8"),
  // From THIS module's location (one level up from scripts/), never the hook's cwd.
  brainDir: () => resolve(dirname(fileURLToPath(import.meta.url)), ".."),
  isMultiverse: (brainDir) => isMultiverse(readRegistry(fsIo, vaultRagDir(brainDir))),
  // A note by its vault-relative path, or null — never a file outside vault/, the
  // same fence get_document keeps.
  readNote: (brainDir, rel) => {
    const vault = resolve(brainDir, "vault");
    const path = resolve(vault, rel);
    if (!path.startsWith(vault + sep)) return null;
    try {
      return readFileSync(path, "utf8");
    } catch {
      return null;
    }
  },
  startRecord: (brainDir, path) => {
    const dir = readsDir(brainDir);
    mkdirSync(dir, { recursive: true });
    writeFileSync(path, "");
    const entries = readdirSync(dir).map((name) => ({ name, mtimeMs: statSync(join(dir, name)).mtimeMs }));
    for (const name of sessionsToPrune(entries)) rmSync(join(dir, name), { force: true });
  },
  readRecord: (path) => (existsSync(path) ? readFileSync(path, "utf8") : null),
  // O_APPEND: two hooks appending at once cannot tear or erase each other's lines.
  appendRecord: (path, text) => appendFileSync(path, text),
};

export function runRecorder(deps = realReadsDeps) {
  try {
    const input = JSON.parse(deps.readInput());
    const brainDir = deps.brainDir();
    const path = recordPath(brainDir, input.session_id);
    if (!path) return 0;
    if (input.hook_event_name === "SessionStart") {
      if (opensFreshWindow(input.source)) deps.startRecord(brainDir, path);
      return 0;
    }
    // A conversation the record never saw begin stays unknown: a partial list would
    // name some spheres and hide others.
    const known = deps.readRecord(path);
    if (known === null || !deps.isMultiverse(brainDir)) return 0;
    const universes = namedUniverses(
      citedNotePaths({ toolName: input.tool_name, toolInput: input.tool_input, toolResponse: input.tool_response })
        // A note gone since the search reads as null, which universeOfNote files under
        // the cross-cutting default: recorded as nothing.
        .map((rel) => universeOfNote(deps.readNote(brainDir, rel))),
    );
    const text = linesToAppend(known, universes);
    if (text) deps.appendRecord(path, text);
  } catch {
    // Fail-open, deliberately silent: see the header.
  }
  return 0;
}

runAsEntrypoint(import.meta.url, process.argv, () => runRecorder());
