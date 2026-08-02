#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// vault-write-guard.mjs — the PreToolUse(Write|Edit) hook that stops a vault note
// being BORN with frontmatter the engine's own indexer refuses (F11/F12).
//
// The decision lives in lib/vault-write-guard.mjs (pure, tested against the real
// parser on the real field payload). This file is only the contract with the
// harness: read the hook JSON on stdin, ask, and answer in the one dialect the
// harness acts on — `hookSpecificOutput.permissionDecision`.
//
// FAIL-OPEN by construction: it sits in front of every write the brain makes, so
// anything unexpected (unreadable stdin, no engine dependencies, another tool)
// lets the write through. The only thing it ever refuses is bytes the engine's
// parser has actually rejected.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { engineParser, guardDecision } from "./lib/vault-write-guard.mjs";
import { isEntrypoint } from "./lib/entrypoint.mjs";

export const realGuardDeps = {
  readInput: () => readFileSync(0, "utf8"),
  readFile: (path) => readFileSync(path, "utf8"),
  // The brain root is derived from THIS module's location (one level up from
  // scripts/), never from the hook's cwd — same rule as auto-commit.mjs.
  brainDir: () => resolve(dirname(fileURLToPath(import.meta.url)), ".."),
  parser: (brainDir) => engineParser({ brainDir }),
  emit: (payload) => console.log(JSON.stringify(payload)),
};

/**
 * Reads the hook JSON on stdin, denies a note the indexer would refuse. Always
 * returns 0: this hook only ever DECIDES, so a non-zero exit would mean the guard
 * itself broke — and the one thing it must never do is turn its own breakage into
 * the owner's problem. Hence the catch-all: unusable stdin, an unexpected payload
 * shape, a parser that cannot be built → the write goes through, in silence.
 */
export function runGuard(deps = realGuardDeps) {
  try {
    const input = JSON.parse(deps.readInput());
    const brainDir = deps.brainDir();

    const decision = guardDecision({
      toolName: input.tool_name,
      toolInput: input.tool_input,
      brainDir,
      parse: deps.parser(brainDir),
      readFile: deps.readFile,
    });

    if (!decision.allow) {
      deps.emit({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: decision.reason,
        },
      });
    }
  } catch {
    // Fail-open, deliberately silent: see the doc comment above.
  }
  return 0;
}

if (isEntrypoint(import.meta.url, process.argv[1])) {
  process.exit(runGuard());
}
