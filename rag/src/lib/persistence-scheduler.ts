// ═══════════════════════════════════════════════════════════════════════════
// persistence-scheduler.ts — WHEN the watcher path commits and pushes, which is
// a different question from when it indexes.
//
// Both used to share one 5 s debounce, so every pause longer than five seconds
// cost a commit AND a network push (with `auto-push.mjs`'s blocking retry). Half
// an hour of writing in Obsidian with twenty real pauses bought twenty of each.
// Search freshness genuinely wants those five seconds; git does not.
//
// So persistence gets its own cadence, and it is a race between two windows:
//   • a QUIET window — commit once the vault has been still for a while;
//   • a CAP — and commit anyway if writing simply never stops.
// The cap is the half people forget. The hooks that otherwise cover this
// (`auto-commit.mjs` on PostToolUse, `auto-push.mjs` on Stop) only fire on a
// Claude *turn*, and the whole scenario the watcher exists for is Claude sitting
// idle while someone types in Obsidian. Without a cap, that session's work stays
// uncommitted until it finally pauses.
// ═══════════════════════════════════════════════════════════════════════════

export type TimerHandle = ReturnType<typeof setTimeout>;

/** How still the vault must be before a commit fires (Thomas, 2026-07-28). */
export const DEFAULT_QUIET_MS = 120_000;

/** The longest a change may stay uncommitted while someone keeps typing. */
export const DEFAULT_CAP_MS = 600_000;

export interface PersistenceSchedulerOptions {
  /** The actual persistence to trigger (injected). */
  persist: () => Promise<unknown>;
  /** Quiet window before committing (default: {@link DEFAULT_QUIET_MS}). */
  quietMs?: number;
  /** Maximum wait under continuous writing (default: {@link DEFAULT_CAP_MS}). */
  capMs?: number;
  /** Scheduling a timer (default: global setTimeout). */
  setTimer?: (fn: () => void, ms: number) => TimerHandle;
  /** Cancelling a timer (default: global clearTimeout). */
  clearTimer?: (handle: TimerHandle) => void;
}

/**
 * Persistence cadence for the watcher path. Pure/injectable like its sibling
 * {@link import("./reindex-scheduler.js").ReindexScheduler} — the filesystem
 * stays outside, so both windows are driven by a virtual clock in the tests.
 */
export class PersistenceScheduler {
  private readonly persist: () => Promise<unknown>;
  private readonly quietMs: number;
  private readonly capMs: number;
  private readonly setTimer: (fn: () => void, ms: number) => TimerHandle;
  private readonly clearTimer: (handle: TimerHandle) => void;
  private quietTimer: TimerHandle | null = null;
  private capTimer: TimerHandle | null = null;
  private running = false;
  private pending = false;

  constructor(opts: PersistenceSchedulerOptions) {
    this.persist = opts.persist;
    this.quietMs = opts.quietMs ?? DEFAULT_QUIET_MS;
    this.capMs = opts.capMs ?? DEFAULT_CAP_MS;
    this.setTimer = opts.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
    this.clearTimer = opts.clearTimer ?? ((h) => clearTimeout(h));
  }

  /**
   * Signals there is unpersisted work in the vault. Called once a catch-up
   * campaign has actually changed something — never on a raw write, so a
   * campaign that indexed nothing still commits nothing.
   */
  notify(): void {
    if (this.quietTimer !== null) this.clearTimer(this.quietTimer);
    this.quietTimer = this.setTimer(() => this.fire(), this.quietMs);
    // The cap is armed by the FIRST write since the last commit and never
    // re-armed after. Re-arming it on every write would just make it a second,
    // longer quiet window — continuous typing would push it forever, which is
    // the exact hole it exists to close.
    if (this.capTimer === null) {
      this.capTimer = this.setTimer(() => this.fire(), this.capMs);
    }
  }

  /** Cancels both windows: whichever one fired, the other is now moot. */
  private disarm(): void {
    if (this.quietTimer !== null) this.clearTimer(this.quietTimer);
    if (this.capTimer !== null) this.clearTimer(this.capTimer);
    this.quietTimer = null;
    this.capTimer = null;
  }

  /**
   * Persists, unless one is already in progress: `auto-commit.mjs` and
   * `auto-push.mjs` are child processes sharing a single `.git/index.lock`, and
   * the push can hold the network for two minutes. A second run started
   * meanwhile would contend for that lock, commit nothing, and still exit 0 — so
   * we coalesce into exactly one rerun at the end, never a parallel git.
   */
  private fire(): void {
    this.disarm();
    if (this.running) {
      this.pending = true;
      return;
    }
    this.running = true;
    void Promise.resolve(this.persist()).finally(() => {
      this.running = false;
      if (this.pending) {
        this.pending = false;
        this.fire();
      }
    });
  }
}
