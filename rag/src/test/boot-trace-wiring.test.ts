import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { BOOT_TRACE_FILE } from "../lib/boot-trace.js";

// ─── #90, step 2a: proven against the REAL process, never a seam ─────────────
// The whole point of the boot trace is that it is written by a process the app respawns. A
// unit test on `stampBootTrace` proves the words; only spawning the actual server proves the
// wiring — that it happens on the path a client takes, in the cache the server is configured
// with, and NOT on the paths that must stay silent.

const ragRoot = fileURLToPath(new URL("../..", import.meta.url));
const SERVING = "MCP server running on stdio";

interface Boot {
  trace: { bootedAt?: string; pid?: number } | null;
  childPid: number | undefined;
  stderr: string;
}

/**
 * Runs the real server on a throwaway vault and cache, waits until it says it is serving,
 * then closes its stdin the way a departing MCP client does — and reports what it left on
 * disk. In `--once` mode nothing is waited for: the process indexes and exits by itself.
 */
function runAndReadTrace(args: string[], patience: number): Promise<Boot> {
  const vault = mkdtempSync(join(tmpdir(), "rag-boot-vault-"));
  const cache = mkdtempSync(join(tmpdir(), "rag-boot-cache-"));

  const child = spawn(process.execPath, ["--import", "tsx", "src/index.ts", ...args], {
    cwd: ragRoot,
    stdio: ["pipe", "pipe", "pipe"],
    env: {
      ...process.env,
      VAULT_DIR: vault,
      CACHE_DIR: cache,
      // No `.env`, so no key and no embedder to reach: an empty vault indexes in a few
      // hundred milliseconds, and this test needs neither network nor model weights.
      SBG_ENV_PATH: join(cache, "there-is-no-env-here"),
    },
  });

  return new Promise<Boot>((resolve) => {
    let stderr = "";
    let leaving = false;
    child.stdout.resume();
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
      if (!leaving && stderr.includes(SERVING)) {
        leaving = true;
        child.stdin.end();
      }
    });

    const giveUp = setTimeout(() => child.kill("SIGKILL"), patience);

    child.on("exit", () => {
      clearTimeout(giveUp);
      const path = join(cache, BOOT_TRACE_FILE);
      const trace = existsSync(path) ? JSON.parse(readFileSync(path, "utf-8")) : null;
      rmSync(vault, { recursive: true, force: true });
      rmSync(cache, { recursive: true, force: true });
      resolve({ trace, childPid: child.pid, stderr });
    });
  });
}

test("serving a client leaves a boot trace naming this very process", { timeout: 90_000 }, async () => {
  const boot = await runAndReadTrace([], 20_000);

  assert.ok(boot.trace, `no boot trace was written by the running server. stderr:\n${boot.stderr}`);
  // The pid is what makes a later verdict able to say "respawned" rather than "rewritten":
  // asserting it against the pid WE spawned is what proves the trace describes the process
  // the app started, and not some earlier survivor.
  assert.equal(boot.trace?.pid, boot.childPid);
  assert.match(String(boot.trace?.bootedAt), /^\d{4}-\d{2}-\d{2}T/, "an ISO instant a marker can be compared to");
});

test("a CLI indexing run leaves NO boot trace", { timeout: 90_000 }, async () => {
  // `--once` is a reindex, not an app start: `update-engine`, the installer and a cron
  // refresh all take this path. A trace here would say "the owner restarted Claude" every
  // time their notes were re-indexed, which is exactly the false verdict step 2b must not
  // be built on.
  const boot = await runAndReadTrace(["--once"], 60_000);

  assert.equal(boot.trace, null, `a CLI run stamped a boot trace. stderr:\n${boot.stderr}`);
});
