#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// session-health.mjs — SessionStart health-check (ADR 0028, F7). Reports the LAST
// known health instantly (a file read → formatHealthBanner) and re-probes in a
// DETACHED background child. The presence-only self-heal (ADR 0026) catches MISSING
// engine skills/MCP; this catches FUNCTIONAL breakage (RAG answers nothing, weights
// gone, index corrupt, an engine MCP won't start).
//
// Contract (asserted by session-health.test.mjs):
//   • zero added latency — the user-facing path is a single file read; the probe is detached;
//   • the re-probe ALWAYS runs — it refreshes engine-health.json for next session start;
//   • quiet when healthy — all ok / only unknown → emits nothing (no crying wolf);
//   • fail-open — any error is swallowed; the function NEVER throws, the hook ALWAYS exits 0.
//
// Wired as a SessionStart hook AFTER session-self-heal.mjs (cf. .claude/settings.json).
// Cross-OS: pure Node, no bash/jq dependency.
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

import { formatHealthBanner } from "./lib/health-probe.mjs";
import { runAsEntrypoint } from "./lib/entrypoint.mjs";

export async function sessionHealth({ brainDir, readCachedHealth, spawnProbe, emit }) {
  let reported = false;
  // Reporting the cached verdict is best-effort: a corrupt/absent cache must never
  // stop the re-probe below (which is what regenerates engine-health.json).
  try {
    const verdict = readCachedHealth();
    const banner = verdict ? formatHealthBanner(verdict) : null;
    if (banner) {
      emit(banner);
      reported = true;
    }
  } catch {
    // swallow — fail-open; next session's banner reflects the fresh re-probe.
  }
  // The detached re-probe ALWAYS runs (refreshes the cache for next session start);
  // a failure to spawn is itself non-blocking.
  try {
    spawnProbe({ brainDir });
  } catch {
    // swallow — fail-open.
  }
  return { reported };
}

// ── main: wire the real I/O seams (deterministic glue, not unit-tested) ───────
// The cached verdict is read from engine-health.json (a plain file read → instant).
// The re-probe runs DETACHED in the background (it loads the embedder + searches →
// seconds) so session start never blocks. The probe child writes a fresh
// engine-health.json and OS-notifies on a newly-broken capability.
// runAsEntrypoint, never a hand-rolled argv[1] comparison: `resolve(argv[1])` is the
// path AS TYPED and `import.meta.url` is the path Node REALPATH-RESOLVED, so on any
// brain whose path holds a symlink the two differ and this whole block silently never
// ran -- no output, no error, no exit code. See lib/entrypoint.mjs.
// The chain is RETURNED so the tail awaits it; its own process.exit(0) still wins,
// which keeps "always exit 0, never block session start" byte-for-byte what it was.
runAsEntrypoint(import.meta.url, process.argv, () => {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const brainDir = resolve(__dirname, "..");
  const probeCli = join(__dirname, "health-probe-run.mjs");
  const healthFile = join(brainDir, "engine-health.json");
  const lines = [];

  return sessionHealth({
    brainDir,
    readCachedHealth: () =>
      existsSync(healthFile) ? JSON.parse(readFileSync(healthFile, "utf8")).verdict ?? null : null,
    spawnProbe: ({ brainDir: dir }) => {
      const child = spawn(
        process.execPath,
        [probeCli, "--brainDir", dir, "--platform", process.platform],
        // detached + unref → survives the hook; windowsHide → no console flash on Windows.
        { detached: true, stdio: "ignore", windowsHide: true },
      );
      child.unref();
    },
    emit: (msg) => lines.push(msg),
  })
    .then(() => {
      if (lines.length > 0) {
        process.stdout.write(
          JSON.stringify({
            hookSpecificOutput: { hookEventName: "SessionStart" },
            systemMessage: lines.join("\n"),
          }) + "\n",
        );
      }
      process.exit(0); // fail-open: ALWAYS exit 0, never block session start
    })
    .catch(() => process.exit(0));
});
