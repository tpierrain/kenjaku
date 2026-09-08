// ─────────────────────────────────────────────────────────────────────────────
// boot-trace.ts — the trace this server leaves when it is respawned (#90, step 2a).
//
// What it is FOR, and what it deliberately is not yet. The restart nudge
// (`scripts/lib/restart-nudge.mjs`) fires from a marker that only a SessionStart can
// erase; resuming a conversation runs none, so an owner who does exactly what the nudge
// asks — quit the app, reopen it, come back to the same conversation — keeps being told to
// restart by a brain that is already converged. What that full quit and reopen DOES do is
// respawn this process, which is the one event the marker could learn to notice.
//
// So: an instrument, shipped WRITE-ONLY. Nothing reads this file yet. The verdict (step 2b)
// is wired only once a real restart on a real machine has been watched writing it, because
// one unknown decides whether the verdict is safe at all — does coming back to a
// conversation WITHOUT quitting the app respawn us too? If it does, a trace-based verdict
// would silence a nudge that is still true, trading a false alarm for a silent failure.
//
// It lives beside the server's other runtime traces, under CACHE_DIR (`rag/.cache/`), which
// is gitignored and env-overridable — so a test never writes into the real brain, and the
// brain-side reader of step 2b finds it the way `scripts/lib/rag-status.mjs` already finds
// `rag/.cache/last-run.json`.
// ─────────────────────────────────────────────────────────────────────────────
import { join } from "node:path";

/** File name only: the directory is whichever CACHE_DIR the caller is running with. */
export const BOOT_TRACE_FILE = "engine-boot.json";

export interface BootTraceDeps {
  cacheDir: string;
  now: () => Date;
  pid: number;
  mkdirSync: (dir: string, opts: { recursive: true }) => void;
  writeFileSync: (path: string, body: string) => void;
}

/**
 * The trace's content: when this process started serving, and which process it is. The pid is
 * not decoration — a timestamp alone cannot tell "a new server was spawned" from "the same
 * long-lived server rewrote its file", and telling those two apart is the entire measurement
 * step 2a exists to make.
 */
export function bootTraceBody(now: Date, pid: number): string {
  return `${JSON.stringify({ bootedAt: now.toISOString(), pid }, null, 2)}\n`;
}

/**
 * Stamps one trace for this boot, replacing the previous one: the question a verdict will ask
 * is "did the app restart since the marker was armed", so only the most recent boot matters.
 *
 * FAIL-SOFT, and in one direction only. This runs on the startup path of the process every
 * question in the brain goes through, so a disk that refuses the write costs a measurement
 * and never the owner's search server. Returns whether the trace was actually written.
 */
export function stampBootTrace({ cacheDir, now, pid, mkdirSync, writeFileSync }: BootTraceDeps): boolean {
  try {
    mkdirSync(cacheDir, { recursive: true });
    writeFileSync(join(cacheDir, BOOT_TRACE_FILE), bootTraceBody(now(), pid));
    return true;
  } catch {
    return false;
  }
}
