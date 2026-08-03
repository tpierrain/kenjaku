#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// verify-index.mjs — run FROM the brain folder: does the index really hold what your
// vault holds? (F15)
//
// The engine's counters answer "did the last run work?", which is a different question.
// A note whose frontmatter broke AFTER it was indexed stays in the index and keeps
// ANSWERING — from the content it was last indexed with — while every counter reads
// green. This command reads both sides (the notes on disk, the rows in the index) and
// names each note they disagree about.
//
// Read-only: no reindex, no server boot, nothing written. It is the sibling of
// verify-rag.mjs — that one proves the brain answers FROM the vault, this one proves it
// answers from ALL of it.
//
//   node scripts/verify-index.mjs          # human report
//   node scripts/verify-index.mjs --json   # the raw report, for another program
//
// Exit 0 = index and vault agree · 1 = they disagree (the notes are named) · 2 = the
// check could not run (no index yet, dependencies missing) — never confused with "fine".
// ─────────────────────────────────────────────────────────────────────────────
import { spawnSync } from "node:child_process";
import { join } from "node:path";

import { needsShell } from "./lib/spawn-shell.mjs";
import { isEntrypoint } from "./lib/entrypoint.mjs";

// The real wiring: run the engine's headless crosscheck, letting its output through
// untouched. Spawned from the brain's `rag/` — that is where tsx is installed, so npx
// resolves it locally instead of fetching one; the engine's own paths are anchored on
// its files, never on the cwd. npx is a shell-wrapped .cmd on Windows (ADR 0015 / 0031).
function defaultRunCrosscheck({ ragDir, platform = process.platform, argv = [] }) {
  const npx = platform === "win32" ? "npx.cmd" : "npx";
  return spawnSync(npx, ["tsx", "src/crosscheck-cli.ts", ...argv], {
    cwd: ragDir,
    stdio: "inherit",
    shell: needsShell(npx, platform),
    env: { ...process.env, SBG_NO_NOTIFY: "1" },
    windowsHide: true,
  });
}

export const realVerifyIndexDeps = {
  cwd: () => process.cwd(),
  runCrosscheck: defaultRunCrosscheck,
  error: (...a) => console.error(...a),
};

/**
 * Runs the crosscheck and returns the process exit code. A run that never STARTED
 * (npx missing, tsx not installed) must not be reported as "your index is out of step":
 * that is exit 2, with the reason, so a broken toolchain is never mistaken for a broken
 * vault — nor for a clean one.
 */
export function runVerifyIndex(argv, deps = realVerifyIndexDeps) {
  const result = deps.runCrosscheck({ ragDir: join(deps.cwd(), "rag"), argv });
  if (result.error || result.status === null) {
    deps.error(
      `✗ Could not run the crosscheck: ${result.error?.message ?? "the engine did not start"}`,
    );
    deps.error("  → From the brain folder: cd rag && npm install, then run this again.");
    return 2;
  }
  return result.status;
}

if (isEntrypoint(import.meta.url, process.argv[1])) {
  process.exit(runVerifyIndex(process.argv.slice(2)));
}
