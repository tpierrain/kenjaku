#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// engine-write-guard.mjs — the PreToolUse(Write|Edit) hook that stops an agent
// diverging a brain from its engine without the owner being asked (plan S3).
//
// The decision lives in lib/engine-write-guard.mjs (pure, three-way, tested).
// This file is only the contract with the harness: read the hook JSON on stdin,
// ask, and answer in the one dialect the harness acts on —
// `hookSpecificOutput.permissionDecision`, whose accepted values are
// `allow | deny | ask | defer` and nothing else (the client's dispatcher throws
// on anything outside that set; `defer` is print-mode only).
//
// FAIL-OPEN by construction, exactly like `vault-write-guard.mjs`: it sits in
// front of every write the brain makes, so anything unexpected — unreadable
// stdin, no manifest, another tool — lets the write through. The single
// exception is the recorded base, and it is anchored inside the pure module so
// that no wiring accident can disarm it.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { guardDecision } from "./lib/engine-write-guard.mjs";
import { runAsEntrypoint } from "./lib/entrypoint.mjs";

export const realGuardDeps = {
  readInput: () => readFileSync(0, "utf8"),
  // The brain root is derived from THIS module's location (one level up from
  // scripts/), never from the hook's cwd — same rule as auto-commit.mjs. A hook
  // runs with whatever cwd the harness had; reading it would have the guard
  // judging paths against a directory that is not the brain.
  brainDir: () => resolve(dirname(fileURLToPath(import.meta.url)), ".."),
  // `null` means "we cannot judge", and the pure module reads it as fail-open —
  // except for the recorded base, whose refusal is keyed on the path.
  readManifest: (brainDir) => {
    try {
      return JSON.parse(readFileSync(join(brainDir, "engine-manifest.json"), "utf8"));
    } catch {
      return null;
    }
  },
  emit: (payload) => console.log(JSON.stringify(payload)),
};

/**
 * Reads the hook JSON on stdin and answers only when there is something to say:
 * an `allow` prints NOTHING, because a silent write is the normal case and the
 * owner should never be told about the hundreds of writes it has no opinion on.
 *
 * Always returns 0. This hook only ever DECIDES, so a non-zero exit would mean
 * the guard itself broke — and the one thing it must never do is turn its own
 * breakage into the owner's problem.
 */
export function runGuard(deps = realGuardDeps) {
  try {
    const input = JSON.parse(deps.readInput());
    const brainDir = deps.brainDir();

    // The manifest read gets its OWN catch, and that is not belt-and-braces over
    // the one below: the outer catch swallows the whole verdict, and the recorded
    // base's refusal is precisely the verdict that must survive an unreadable
    // manifest. Letting a failed read reach the outer catch would disarm the deny
    // through the very file it protects.
    let manifest = null;
    try {
      manifest = deps.readManifest(brainDir);
    } catch {
      // Deliberately empty: `manifest` is already `null`, and a `manifest = null`
      // here would be a statement no test could ever see fire — a failed read
      // never completed the assignment in the first place.
    }

    const decision = guardDecision({
      toolName: input.tool_name,
      filePath: input.tool_input?.file_path,
      brainDir,
      manifest,
    });

    if (decision.decision !== "allow") {
      deps.emit({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: decision.decision,
          permissionDecisionReason: decision.reason,
        },
      });
    }
  } catch {
    // Fail-open, deliberately silent: see the doc comment above.
  }
  return 0;
}

runAsEntrypoint(import.meta.url, process.argv, () => runGuard());
