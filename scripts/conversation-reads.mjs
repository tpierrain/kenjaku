#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// conversation-reads.mjs — the PostToolUse(search_vault|get_document) hook that
// RECORDS which universe a vault read ran in, per conversation (issue #130).
//
// `/switch` reads it back (set-active-universe.mjs) so its residue disclosure says
// only what is true: nothing to a conversation that read nothing, and every universe
// a conversation did read, even two switches ago. The decisions live in
// lib/conversation-reads.mjs (pure); this file is only the contract with the harness.
//
// It NEVER speaks and never blocks: no stdout, always exit 0. It runs after every
// vault read, so anything unexpected (unreadable stdin, no session id, a corrupt
// record, a read-only disk) leaves the read exactly as it was, in silence — and the
// worst a lost record costs is that one switch says nothing it should have said
// about a read the hook missed.
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { runAsEntrypoint } from "./lib/entrypoint.mjs";
import { recordRead, universeOfRead } from "./lib/conversation-reads.mjs";
import { readActiveUniverse, vaultRagDir } from "./lib/universes.mjs";

// Per-machine, gitignored, throwaway: what a conversation read is a property of that
// conversation, never of the brain, so it must not travel with it.
export const CONVERSATION_READS_REL = join(".cache", "conversation-reads.json");

const fsIo = { existsSync, readFileSync: (path) => readFileSync(path, "utf8") };

/** Reads the record, or null when it is absent or corrupt (started afresh then). */
export function readConversationReads(brainDir) {
  try {
    const path = join(brainDir, CONVERSATION_READS_REL);
    return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
  } catch {
    return null;
  }
}

export const realReadsDeps = {
  readInput: () => readFileSync(0, "utf8"),
  // From THIS module's location (one level up from scripts/), never the hook's cwd.
  brainDir: () => resolve(dirname(fileURLToPath(import.meta.url)), ".."),
  // Through the VALIDATED reader: a ghost pointer resolves to where the server really
  // searched.
  active: (brainDir) => readActiveUniverse(fsIo, vaultRagDir(brainDir)),
  readState: readConversationReads,
  writeState: (brainDir, state) => {
    const path = join(brainDir, CONVERSATION_READS_REL);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(state, null, 2) + "\n");
  },
  now: () => Date.now(),
};

export function runRecorder(deps = realReadsDeps) {
  try {
    const input = JSON.parse(deps.readInput());
    if (!input?.session_id) return 0;
    const brainDir = deps.brainDir();
    const universe = universeOfRead({ toolInput: input.tool_input, active: deps.active(brainDir) });
    const next = recordRead(deps.readState(brainDir), {
      sessionId: input.session_id,
      universe,
      now: deps.now(),
    });
    deps.writeState(brainDir, next);
  } catch {
    // Fail-open, deliberately silent: see the header.
  }
  return 0;
}

runAsEntrypoint(import.meta.url, process.argv, () => runRecorder());
