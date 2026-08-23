#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// session-obsidian-hint.mjs — SessionStart soft Obsidian nudge (F8.3). A SEPARATE,
// soft channel from the broken-capability banner (session-health.mjs): Obsidian is
// OPTIONAL, so this never alarms. The runtime nag policy (runtimeObsidianHint) only
// surfaces the actionable, self-resolving case — Obsidian installed but THIS vault
// not yet registered — and stays silent otherwise (absent Obsidian = respected
// choice; ok = quiet). One "Open folder as vault" makes it quiet forever.
//
// Contract: zero-ish latency (two file reads, no spawn), quiet unless actionable,
// fail-open (never throws, the hook ALWAYS exits 0).
// Cross-OS: pure Node.
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

import { runAsEntrypoint } from "./lib/entrypoint.mjs";
import { obsidianHealth, runtimeObsidianHint } from "./lib/obsidian-health.mjs";

// Testable core: compute the hint (injected), emit it only when present, fail-open.
export function sessionObsidianHint({ computeHint, emit }) {
  try {
    const hint = computeHint();
    if (hint) {
      emit(hint);
      return { reported: true };
    }
  } catch {
    // swallow — fail-open; a missing/odd Obsidian must never disturb session start.
  }
  return { reported: false };
}

// ── main: wire the real read-only seams (deterministic glue, not unit-tested) ──
// runAsEntrypoint, never a hand-rolled argv[1] comparison: `resolve(argv[1])` is the
// path AS TYPED and `import.meta.url` is the path Node REALPATH-RESOLVED, so on any
// brain whose path holds a symlink the two differ and this whole block silently never
// ran -- no output, no error, no exit code. See lib/entrypoint.mjs.
runAsEntrypoint(import.meta.url, process.argv, () => {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const brainDir = resolve(__dirname, "..");
  const vaultPath = join(brainDir, "vault");
  const lines = [];

  sessionObsidianHint({
    computeHint: () =>
      runtimeObsidianHint(
        obsidianHealth(vaultPath, {
          platform: process.platform,
          env: process.env,
          home: homedir(),
          existsSync,
          readFileSync,
        }),
      ),
    emit: (msg) => lines.push(msg),
  });

  if (lines.length > 0) {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: { hookEventName: "SessionStart" },
        systemMessage: lines.join("\n"),
      }) + "\n",
    );
  }
  return 0; // fail-open: ALWAYS exit 0, never block session start
});
