import type { ShutdownPlan } from "../../../shared/mcp-shutdown.js";

/** What the vault server holds that outlives a session, each behind its own seam. */
export interface VaultShutdownDeps {
  /** Stop the live vault watcher (a no-op when it never started). */
  stopWatcher: () => void;
  /** Close the SQLite index — this is what releases the exclusive lock. */
  closeIndex: () => void;
  trace: (message: string) => void;
}

/**
 * The end-of-session cleanup for the vault server.
 *
 * The lock on `vault.db` is the whole point: a server that outlives its client keeps it, the
 * next session waits on it, times out, and leaves one more survivor behind — the failure makes
 * the next failure likelier. Closing the index is therefore the step that must happen no matter
 * what else goes wrong on the way there.
 */
export function vaultShutdownPlan(deps: VaultShutdownDeps): ShutdownPlan {
  return {
    cleanup: () => {
      deps.trace("🛑 session ended — stopping the watcher and releasing the index");
      try {
        deps.stopWatcher();
      } catch (error) {
        deps.trace(
          `⚠️ the live watcher would not stop: ${error instanceof Error ? error.message : String(error)}`
        );
      }
      deps.closeIndex();
    },
  };
}
