import type { ShutdownPlan } from "../../../shared/mcp-shutdown.js";

/** What the vault server holds that outlives a session, each behind its own seam. */
export interface VaultShutdownDeps {
  /** Stop the live vault watcher (a no-op when it never started). */
  stopWatcher: () => void;
  /**
   * Stop the live-sync clock (a no-op when it never started). It spawns a git child every
   * 90 s: one that outlived its session would keep pulling into a brain nobody is looking
   * at, and the next session's `.git/index.lock` contention would be with a process that
   * has no window at all.
   */
  stopRemoteSync: () => void;
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
 * what else goes wrong on the way there — and no background loop may be skipped because the one
 * before it refused to stop.
 */
export function vaultShutdownPlan(deps: VaultShutdownDeps): ShutdownPlan {
  return {
    cleanup: () => {
      deps.trace("🛑 session ended — stopping the watcher and releasing the index");
      stopQuietly(deps.stopWatcher, "the live watcher", deps.trace);
      stopQuietly(deps.stopRemoteSync, "the live-sync clock", deps.trace);
      deps.closeIndex();
    },
  };
}

/** Stops one background loop, reporting a refusal instead of letting it end the shutdown. */
function stopQuietly(stop: () => void, what: string, trace: (message: string) => void): void {
  try {
    stop();
  } catch (error) {
    trace(`⚠️ ${what} would not stop: ${error instanceof Error ? error.message : String(error)}`);
  }
}
