#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// ai-summary-guard.mjs — the PostToolUse hook that speaks when an AI synthesis
// has just been READ, before it can quietly become the source.
//
// The decision lives in lib/ai-summary-guard.mjs (pure, tested on the shapes the
// field exports actually have). This file is only the contract with the harness:
// read the hook JSON on stdin, and answer in the one dialect that reaches the
// model — `hookSpecificOutput.additionalContext` (a `systemMessage` shows in the
// terminal but never lands in the conversation, and the reader here is the model,
// not the owner).
//
// NON-BLOCKING by construction, and fail-open: it sits on the READ path, which
// every session walks constantly. It cannot deny anything (a PostToolUse hook
// runs after the fact), it emits nothing when it has nothing to say, and any
// surprise — unusable stdin, an unexpected payload shape — costs silence rather
// than an interrupted read. A false positive here is one line of text; that is
// the whole reason it is allowed to guess at all.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync } from "node:fs";

import { summaryNotice, payloadText } from "./lib/ai-summary-guard.mjs";
import { runAsEntrypoint } from "./lib/entrypoint.mjs";

export const realSummaryGuardDeps = {
  readInput: () => readFileSync(0, "utf8"),
  emit: (payload) => console.log(JSON.stringify(payload)),
};

// Whether the payload is a search RESULT rather than a document that was opened.
// Keyed on the tool name, because that is the only thing that tells the two
// apart once the bytes are in hand — and the answer differs: a hit is opened,
// a document is read further down.
function isSearchTool(toolName) {
  return typeof toolName === "string" && /search/i.test(toolName);
}

/**
 * Reads the hook JSON on stdin and hands the model a notice when what just came
 * back is an AI synthesis. Always returns 0 — see the fail-open note above.
 */
export function runSummaryGuard(deps = realSummaryGuardDeps) {
  try {
    const input = JSON.parse(deps.readInput());
    const notice = summaryNotice({
      text: payloadText(input?.tool_response),
      fromSearch: isSearchTool(input?.tool_name),
    });
    if (notice) {
      deps.emit({
        hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: notice },
      });
    }
  } catch {
    // Fail-open, deliberately silent: see the doc comment above.
  }
  return 0;
}

// runSummaryGuard() takes a `deps` argument (defaulted to the real ports), not
// argv — so it must be wrapped rather than passed directly, or it would receive
// the CLI args array as `deps` and lose its real stdin/emit ports.
runAsEntrypoint(import.meta.url, process.argv, () => runSummaryGuard());
