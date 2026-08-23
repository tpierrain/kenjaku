#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// prompt-restart-nudge.mjs — the UserPromptSubmit hook that keeps saying "this
// conversation is running the OLD engine" until the owner restarts (F20).
//
// Why this event, and not one more line in the SessionStart banner: that banner
// prints once, at the top of a session that may run for hours, and on Desktop it
// is dropped entirely (ADR 0036's channel matrix — `systemMessage` and
// `statusLine` are both CLI-only). `UserPromptSubmit` is the only deterministic
// channel Desktop receives, and it repeats on every prompt, so the nudge cannot
// scroll away.
//
// It INJECTS and never blocks. The event can refuse a prompt outright (exit 2);
// that lever is deliberately not used, because a wrong verdict would lock an owner
// out of their own brain, while a wrong sentence costs them one sentence.
//
// The words live in lib/restart-nudge.mjs, the disk verdict in lib/restart-signal.mjs.
// This file is only the contract with the harness.
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { restartPromptDirective } from "./lib/restart-nudge.mjs";
import { restartPendingOnDisk } from "./lib/restart-signal.mjs";
import { runAsEntrypoint } from "./lib/entrypoint.mjs";
import { deriveWanted } from "./session-self-heal.mjs";

export const realNudgeDeps = {
  // The brain root is derived from THIS module's location (one level up from
  // scripts/), never from the hook's cwd — same rule as auto-commit.mjs.
  brainDir: () => resolve(dirname(fileURLToPath(import.meta.url)), ".."),
  pending: (repo) => restartPendingOnDisk({ repo, deriveWanted, existsSync, readFileSync }),
  emit: (payload) => console.log(JSON.stringify(payload)),
};

/**
 * Asks whether a restart is pending and, if so, injects the directive. Always returns 0:
 * this hook sits in front of every prompt the owner types, so its own breakage must never
 * become theirs — an unreadable brain, a hiccup in the verdict, anything unexpected leaves
 * the prompt untouched, in silence.
 */
export function runPromptNudge(deps = realNudgeDeps) {
  try {
    const directive = restartPromptDirective(deps.pending(deps.brainDir()));
    if (directive) {
      deps.emit({ hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: directive } });
    }
  } catch {
    // Silent by design: see the doc comment above.
  }
  return 0;
}

// runPromptNudge's own parameter is `deps` (defaulted to realNudgeDeps), not argv — so it
// must be wrapped, never passed directly: passed as-is, runAsEntrypoint would hand it the
// argv slice in place of deps.
runAsEntrypoint(import.meta.url, process.argv, () => runPromptNudge());
