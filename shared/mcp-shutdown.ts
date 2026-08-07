/**
 * Shared shutdown wiring for this repo's MCP servers (`rag`, `local-mirror`).
 *
 * An MCP server talks over stdio: when the client goes away, the pipe closes and that is the
 * only notice the process gets. A server that keeps a timer or a filesystem watcher alive will
 * NOT wind down on its own — it becomes an orphan holding whatever the next session needs.
 */

/** Injectable seams for the shutdown wiring, so the signal/EOF handling is unit-testable. */
export interface ShutdownHooks {
  onSignal: (signal: NodeJS.Signals, handler: () => void) => void;
  onStdinEnd: (handler: () => void) => void;
  exit: (code: number) => void;
  log: (message: string) => void;
}

/**
 * The slice of `process` this module touches. Named as a port so that termination itself is
 * observable in a test: an `exit` that silently does nothing IS this defect, and a hook nobody
 * can call is a hook nobody can catch failing.
 */
export interface ProcessLike {
  once(event: string, handler: () => void): unknown;
  stdin: { once(event: string, handler: () => void): unknown };
  exit(code: number): void;
}

/**
 * The real wiring over `process`. Each server passes its own reporter so the message carries its
 * name (`[vault-rag]` / `[local-mirror]`) on the one stderr channel the MCP client shows.
 *
 * Both `end` AND `close` are wired: a client that dies without flushing its pipe emits `close`
 * and never `end`, and that abrupt death is precisely the case that used to orphan the server.
 */
export function realShutdownHooks(
  log: (message: string) => void,
  process: ProcessLike = globalThis.process,
): ShutdownHooks {
  return {
    onSignal: (signal, handler) => {
      process.once(signal, handler);
    },
    onStdinEnd: (handler) => {
      process.stdin.once("end", handler);
      process.stdin.once("close", handler);
    },
    exit: (code) => process.exit(code),
    log,
  };
}

/** What a server wants done when its session ends. */
export interface ShutdownPlan {
  /** Release what outlives the session: timers, watchers, database handles. */
  cleanup: () => void;
}

/**
 * Wire the end of the session: process signals and stdin EOF/close.
 *
 * On a SIGNAL we must ALSO terminate: registering a SIGINT/SIGTERM listener overrides Node's
 * default terminate-on-signal, so without an explicit exit here Ctrl-C / SIGTERM would merely
 * run the cleanup and leave an orphaned server holding stdio. Exit code = 128 + signal number.
 */
export function installShutdown(plan: ShutdownPlan, hooks: ShutdownHooks): void {
  // stdin emits BOTH `end` and `close`, and a signal can still land after either: the first
  // notice wins and the rest are ignored, so a database handle is never closed twice.
  let ending = false;
  const endSession = (code: number) => () => {
    if (ending) return;
    ending = true;
    try {
      plan.cleanup();
    } catch (error) {
      // Say it, then die anyway: the lock the next session needs is released by the exit,
      // not by the cleanup succeeding.
      hooks.log(`shutdown cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      hooks.exit(code);
    }
  };

  hooks.onStdinEnd(endSession(0));
  for (const [signal, code] of SIGNAL_EXIT_CODES) {
    hooks.onSignal(signal, endSession(code));
  }
}

/** Exit code = 128 + signal number, the shell convention (SIGINT 2 → 130, SIGTERM 15 → 143). */
const SIGNAL_EXIT_CODES: ReadonlyArray<readonly [NodeJS.Signals, number]> = [
  ["SIGINT", 130],
  ["SIGTERM", 143],
];
