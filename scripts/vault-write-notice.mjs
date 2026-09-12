#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// vault-write-notice.mjs — the PreToolUse(Write|Edit) hook that SPEAKS about the
// sphere a note lands in, and corrects a spelling the owner already resolved.
//
// The sibling of `vault-write-guard.mjs`, and deliberately a separate process
// from it: that one REFUSES (a note the indexer could not read), this one only
// ever speaks. Mixing a refusal and an advisory in one verdict is how a warning
// eventually starts blocking.
//
// The decisions live in lib/vault-write-notice.mjs (pure, injected everything).
// This file is only the contract with the harness: read the hook JSON on stdin,
// ask, and answer in the two dialects the host honours —
// `hookSpecificOutput.updatedInput` (the corrected bytes, applied before the file
// exists) and `hookSpecificOutput.additionalContext` (the directive to Claude).
//
// ⚠️ IT NEVER CLAIMS A PERMISSION DECISION. Measured 2026-09-12: `updatedInput` is
// honoured on its own. Emitting `permissionDecision: "allow"` would auto-approve
// every write this hook touches, including ones the owner's own rules would stop —
// correcting a spelling must never GRANT a write.
//
// FAIL-OPEN by construction, like its sibling: it sits in front of every write the
// brain makes, so anything unexpected (unreadable stdin, no registry, an absent
// profile) leaves the call exactly as it was, in silence.
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { runAsEntrypoint } from "./lib/entrypoint.mjs";
import { readUniverseProfile } from "./lib/universe-profile.mjs";
import { readActiveUniverse, readRegistry, vaultRagDir } from "./lib/universes.mjs";
import { writeNotice } from "./lib/vault-write-notice.mjs";

// Where this session's memory lives: per-machine, gitignored, throwaway. What was
// already said is a property of one conversation, not of the brain, so it must never
// travel with it (unlike the registry and the pointer, which are the owner's state).
export const NOTICE_STATE_REL = join(".cache", "write-notices.json");

// The one-shot list an undo leaves behind. Same directory, same throwaway nature:
// it exists for the two seconds between "no, put it back" and the write that puts it
// back. See the `/switch` skill for what the brain writes here.
export const BYPASS_REL = join(".cache", "spelling-bypass.json");

const fsIo = { existsSync, readFileSync: (path) => readFileSync(path, "utf8") };

export const realNoticeDeps = {
  readInput: () => readFileSync(0, "utf8"),
  // The brain root is derived from THIS module's location (one level up from
  // scripts/), never from the hook's cwd — same rule as auto-commit.mjs.
  brainDir: () => resolve(dirname(fileURLToPath(import.meta.url)), ".."),
  registry: (brainDir) => readRegistry(fsIo, vaultRagDir(brainDir)),
  // Through the VALIDATED reader: a pointer aimed at a universe that is gone resolves
  // to the default scope, which is where the searches really land. Naming the ghost
  // would disclose a sphere nothing can be found in.
  pointer: (brainDir) => readActiveUniverse(fsIo, vaultRagDir(brainDir)),
  profile: (brainDir, universe) => readUniverseProfile(fsIo, join(brainDir, "vault"), universe),
  readState: (brainDir) => readJson(join(brainDir, NOTICE_STATE_REL)),
  writeState: (brainDir, state) => writeJson(join(brainDir, NOTICE_STATE_REL), state),
  readBypass: (brainDir) => readJson(join(brainDir, BYPASS_REL))?.spellings ?? [],
  clearBypass: (brainDir) => rmSync(join(brainDir, BYPASS_REL), { force: true }),
  emit: (payload) => console.log(JSON.stringify(payload)),
};

// A corrupt or absent marker reads as "nothing said yet": worst case one sentence is
// repeated, which beats wedging a write over a broken state file.
function readJson(path) {
  try {
    return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
  } catch {
    return null;
  }
}

function writeJson(path, value) {
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
  } catch {
    /* best-effort: a session that cannot remember says one sentence twice */
  }
}

/**
 * What this session has already disclosed, or an empty memory when the state file
 * belongs to a DIFFERENT session. That comparison is what makes "once per session"
 * true across a `/clear`: a new conversation is a new session id, and the first note
 * of it is disclosed again.
 */
export function sessionMemory(state, sessionId) {
  if (!state || state.sessionId !== sessionId) return { universes: [], corrections: [] };
  return {
    universes: Array.isArray(state.universes) ? state.universes : [],
    corrections: Array.isArray(state.corrections) ? state.corrections : [],
  };
}

/**
 * Reads the hook JSON on stdin, asks the core, and emits at most one payload. Always
 * returns 0: this hook only ever SPEAKS, so a non-zero exit would mean the hook itself
 * broke — and the one thing it must never do is turn its own breakage into the owner's
 * problem. Hence the catch-all: unusable stdin, an unexpected payload shape, a
 * registry that cannot be read → the call goes through untouched, in silence.
 */
export function runNotice(deps = realNoticeDeps) {
  try {
    const input = JSON.parse(deps.readInput());
    const brainDir = deps.brainDir();
    const said = sessionMemory(deps.readState(brainDir), input.session_id);
    const bypass = deps.readBypass(brainDir);

    const notice = writeNotice({
      toolName: input.tool_name,
      toolInput: input.tool_input,
      brainDir,
      registry: deps.registry(brainDir),
      pointer: deps.pointer(brainDir),
      readProfile: (universe) => deps.profile(brainDir, universe),
      said,
      bypass,
    });

    // Consumed the moment it is used, and only then: a bypass that outlived its undo
    // would silently disable the rule for the rest of the session.
    if (notice.bypassUsed) deps.clearBypass(brainDir);

    const fresh = [...notice.said.universes, ...notice.said.corrections];
    if (fresh.length > 0) {
      deps.writeState(brainDir, {
        sessionId: input.session_id,
        universes: [...new Set([...said.universes, ...notice.said.universes])],
        corrections: [...new Set([...said.corrections, ...notice.said.corrections])],
      });
    }

    const payload = { hookEventName: "PreToolUse" };
    if (notice.updatedInput) payload.updatedInput = notice.updatedInput;
    if (notice.context) payload.additionalContext = notice.context;
    // Nothing to say and nothing to fix → NOTHING emitted. A hook that answers on
    // every write teaches its reader to stop reading it.
    if (payload.updatedInput || payload.additionalContext) deps.emit({ hookSpecificOutput: payload });
  } catch {
    // Fail-open, deliberately silent: see the doc comment above.
  }
  return 0;
}

runAsEntrypoint(import.meta.url, process.argv, () => runNotice());
