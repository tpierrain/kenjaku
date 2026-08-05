import type { RunProgress } from "./progress-report.js";

export interface ShortfallInput {
  docCount: number;
  scannedCount: number;
  /** The last catch-up run's persisted state — the engine's own record of what happened. */
  progress?: RunProgress | null;
  /**
   * The shortfall as it stood when this process last ASKED for a catch-up, if it ever did.
   * The bound on acting: a catch-up that closed nothing is evidence the notes are not late,
   * whatever the run state says — so the engine stops asking instead of looping.
   */
  lastCatchUpRemaining?: number | null;
}

/**
 * Why the index holds fewer notes than the vault. These are not five wordings of one
 * state: a refusal never resolves itself, a wall resolves on its own, a note that simply
 * arrived late is closed by asking NOW, a shortfall that survived a catch-up is none of the
 * three (the engine has already tried and must stop rather than loop), and a run still in
 * flight is the one wait nobody has to be told about — it is being closed as they read.
 */
export type ShortfallCause = "failures" | "cap" | "arrived" | "stalled" | "running";

export interface Shortfall {
  /** How many scanned notes the index does not hold. */
  remaining: number;
  cause: ShortfallCause;
  /** The failures the run recorded, verbatim — empty unless the cause is `failures`. */
  failures: string[];
  /** The part of the shortfall that is NOT explained by those failures. */
  queued: number;
}

/**
 * What a shortfall between the vault and the index IS — or null when there is none.
 */
export function describeShortfall(input: ShortfallInput): Shortfall | null {
  const remaining = input.scannedCount - input.docCount;
  if (remaining <= 0) return null;

  const failures = input.progress?.errors ?? [];
  return {
    remaining,
    cause: causeOf(remaining, failures.length, input),
    failures,
    queued: Math.max(0, remaining - failures.length),
  };
}

/**
 * Ordered by what can be done about it, most-actionable first. A refusal outranks a wall:
 * the wall lifts by itself, the refused note never does, and a shortfall carrying both must
 * not read as a wait.
 */
function causeOf(remaining: number, failures: number, input: ShortfallInput): ShortfallCause {
  if (failures > 0) return "failures";
  if (input.progress?.status === "running") return "running";
  if (input.progress?.hitCap) return "cap";
  // One term, not two: `!== null && !== undefined` reads as a pair of reasons while only
  // ever meaning "a number was recorded", and nothing can tell the halves apart.
  const asked = input.lastCatchUpRemaining;
  if (typeof asked === "number" && remaining >= asked) return "stalled";
  return "arrived";
}

/**
 * The memory that keeps the engine's own catch-up bounded (F21). Asking for one is the
 * right answer to notes that landed after the scan; asking a second time when the first
 * closed nothing is a loop, so the shortfall of the last ask is remembered and handed back
 * to `describeShortfall`, which then reads the state as `stalled` rather than `arrived`.
 *
 * Per server process, in memory, deliberately: the window it guards is one process's, and a
 * bound persisted to disk would outlive the run it describes.
 */
export class CatchUpBound {
  private lastRemaining: number | null = null;

  /** The shortfall this process last asked a catch-up to close — null if it never has. */
  lastCatchUpRemaining(): number | null {
    return this.lastRemaining;
  }

  /** Records the ask and answers whether a catch-up should be requested. */
  request(shortfall: Shortfall | null): boolean {
    if (shortfall?.cause !== "arrived") return false;
    this.lastRemaining = shortfall.remaining;
    return true;
  }
}
