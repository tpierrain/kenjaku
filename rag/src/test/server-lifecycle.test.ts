import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// The test `rag` never had. Every other suite here exercises the server's ANSWERS; none
// exercised its DEATH — so when the live vault watcher started holding the event loop open,
// the server quietly outlived its client and nothing went red. The field bill: 21 orphaned
// processes in one day, each keeping the exclusive SQLite lock on `vault.db`, each making the
// next session's startup time out and leave one more survivor behind.
//
// `local-mirror` had this test and leaked zero orphans. That is not luck, so the same proof
// now lives here — against the REAL process, not a seam. The unit tests in
// `shared/mcp-shutdown.test.ts` prove the wiring calls exit; only spawning the actual server
// proves nothing else in it keeps the process alive afterwards.

const ragRoot = fileURLToPath(new URL("../..", import.meta.url));

/** The line that says the watcher is armed — i.e. the very thing that used to hold the loop open. */
const WATCHER_ARMED = "Live-update watcher active";

interface Outcome {
  code: number | null;
  signal: NodeJS.Signals | null;
  armed: boolean;
  stderr: string;
}

/**
 * Start the real vault server on a throwaway vault, wait until the live watcher is armed,
 * then close its stdin the way a departing MCP client does — and report how it died.
 *
 * Waiting for the ARMED line is what makes this a test rather than a formality: close stdin at
 * the earlier "running on stdio" line and even the leaking server exits, because the watcher
 * that pins the event loop has not started yet. Arm first, then pull the pipe.
 */
function runUntilStdinCloses(patience: number): Promise<Outcome> {
  const vault = mkdtempSync(join(tmpdir(), "rag-lifecycle-vault-"));
  const cache = mkdtempSync(join(tmpdir(), "rag-lifecycle-cache-"));

  const child = spawn(process.execPath, ["--import", "tsx", "src/index.ts"], {
    cwd: ragRoot,
    stdio: ["pipe", "pipe", "pipe"],
    env: {
      ...process.env,
      VAULT_DIR: vault,
      CACHE_DIR: cache,
      // No `.env`, therefore no key and no embedder to reach: an empty vault indexes 0 notes
      // in a few hundred milliseconds, so this test needs no network and no model weights.
      SBG_ENV_PATH: join(cache, "there-is-no-env-here"),
    },
  });

  return new Promise<Outcome>((resolve) => {
    let stderr = "";
    let armed = false;
    // Drain stdout: an unread pipe would eventually block the very process we are timing.
    child.stdout.resume();
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
      if (!armed && stderr.includes(WATCHER_ARMED)) {
        armed = true;
        child.stdin.end();
      }
    });

    const giveUp = setTimeout(() => {
      child.kill("SIGKILL");
    }, patience);

    child.on("exit", (code, signal) => {
      clearTimeout(giveUp);
      rmSync(vault, { recursive: true, force: true });
      rmSync(cache, { recursive: true, force: true });
      resolve({ code, signal, armed, stderr });
    });
  });
}

// The regression itself, stated as the property the field lost: a server whose client is gone
// must be gone too. SIGKILL here does not mean "slow", it means "orphan" — the exact state that
// starves the next session.
test(
  "the vault server exits when its client closes stdin, even with the live watcher armed",
  { timeout: 90_000 },
  async () => {
    const outcome = await runUntilStdinCloses(20_000);

    assert.equal(
      outcome.armed,
      true,
      `the live watcher never armed, so this run proves nothing about the leak. stderr:\n${outcome.stderr}`
    );
    assert.equal(
      outcome.signal,
      null,
      `the server had to be killed instead of exiting — it is an orphan holding the index lock. stderr:\n${outcome.stderr}`
    );
    assert.equal(
      outcome.code,
      0,
      `expected a clean exit after the client left. stderr:\n${outcome.stderr}`
    );
  }
);
