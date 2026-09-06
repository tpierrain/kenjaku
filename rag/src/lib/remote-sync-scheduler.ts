// ═══════════════════════════════════════════════════════════════════════════
// remote-sync-scheduler.ts — WHEN the brain looks at the remote (plan #84, step 3).
//
// A brain that lives on more than one machine only caught up at session start and
// on `/sync`. This is the clock that closes the gap, and it lives HERE — inside the
// search server — for one reason: that process is up for exactly as long as a window
// is open. No daemon (ADR 0003), and no clock that outlives the session.
//
// The tick itself is `scripts/remote-sync.mjs`, run as a child: git stays in
// `scripts/`, the server is only the clock — the same division ADR 0037 already drew
// for the persistence path. Nothing here knows what a rebase is.
//
// Three properties, each of them a way this loop could die or double:
//   • it re-arms in `finally`. Failing is the NORMAL case here — offline, a git that
//     refuses, a brain mid-rebase — and a loop that stopped at the first failure
//     would go quiet for the rest of the session with nothing on screen to say so;
//   • the next tick is armed only once the previous SETTLED, so a fetch hanging on a
//     dead network is never overlapped by the tick behind it (the per-machine gate in
//     `scripts/lib/remote-sync-gate.mjs` covers the other windows; this covers ours);
//   • `stop()` cancels the pending timer, and a tick that finishes AFTER the shutdown
//     arms nothing.
//
// Shape borrowed whole from `local-mirror/src/auto-sync-scheduler.ts`.
// ═══════════════════════════════════════════════════════════════════════════

export type TimerHandle = ReturnType<typeof setTimeout>;

/**
 * How far the delay may stray from the interval, either way. Two machines started by
 * the same person minutes apart would otherwise probe the remote in lockstep for the
 * rest of the day; ±10 % breaks the cadence without making "every 90 seconds" mean
 * anything different to the person who set it.
 */
export const JITTER_RATIO = 0.1;

export interface RemoteSyncSchedulerOptions {
  /** One tick — in production, spawning `scripts/remote-sync.mjs`. May reject; it is caught. */
  tick: () => Promise<unknown>;
  /** The cadence, in milliseconds (resolved at the server boundary from `REMOTE_SYNC_INTERVAL`). */
  intervalMs: number;
  /** Where a failed tick is reported (default: stderr). */
  log?: (message: string) => void;
  /** The jitter roll, in [0, 1) (default: Math.random) — injected so the delay is assertable. */
  random?: () => number;
  /** Scheduling a timer (default: global setTimeout). */
  setTimer?: (fn: () => void, ms: number) => TimerHandle;
  /** Cancelling a timer (default: global clearTimeout). */
  clearTimer?: (handle: TimerHandle) => void;
}

export class RemoteSyncScheduler {
  private readonly tickOnce: () => Promise<unknown>;
  private readonly intervalMs: number;
  private readonly log: (message: string) => void;
  private readonly random: () => number;
  private readonly setTimer: (fn: () => void, ms: number) => TimerHandle;
  private readonly clearTimer: (handle: TimerHandle) => void;
  private timerHandle: TimerHandle | null = null;
  private stopped = false;
  private running: Promise<void> | null = null;

  constructor(opts: RemoteSyncSchedulerOptions) {
    this.tickOnce = opts.tick;
    this.intervalMs = opts.intervalMs;
    this.log = opts.log ?? ((message) => console.error(message));
    this.random = opts.random ?? (() => Math.random());
    this.setTimer = opts.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
    this.clearTimer = opts.clearTimer ?? ((h) => clearTimeout(h));
  }

  /** Arm the first tick — one interval from now, never at startup: the session start already pulled. */
  start(): void {
    this.stopped = false;
    this.schedule();
  }

  /** Halt the loop: cancel any pending tick so no orphan timer outlives the session. */
  stop(): void {
    this.stopped = true;
    if (this.timerHandle !== null) {
      this.clearTimer(this.timerHandle);
      this.timerHandle = null;
    }
  }

  /** Test seam: await the in-flight tick, and the reschedule its completion triggers. */
  async whenSettled(): Promise<void> {
    await this.running;
  }

  /** The next delay: the interval, ±{@link JITTER_RATIO} of it. Named so it can be reasoned about. */
  private nextDelayMs(): number {
    const spread = this.intervalMs * JITTER_RATIO;
    return this.intervalMs - spread + this.random() * spread * 2;
  }

  private schedule(): void {
    this.timerHandle = this.setTimer(() => {
      this.timerHandle = null;
      this.running = this.run().finally(() => {
        if (!this.stopped) this.schedule();
      });
    }, this.nextDelayMs());
  }

  private async run(): Promise<void> {
    try {
      await this.tickOnce();
    } catch (error) {
      // Fail-soft, and SAID: the tick's own words (git's, usually) rather than ours.
      this.log(`[vault-rag] remote sync: this tick failed — ${errorMessage(error)}`);
    }
  }
}

/** A readable message from a thrown value. */
function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
