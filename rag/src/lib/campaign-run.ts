// ═══════════════════════════════════════════════════════════════════════════
// campaign-run.ts — what happens at the end of one live catch-up campaign: the
// index is written, the burst is accounted for, and the vault is persisted. The
// watcher's whole body, extracted from index.ts so it is unit-testable with
// in-memory fakes ("test the glue too", maintainers/CONVENTIONS.md).
// ═══════════════════════════════════════════════════════════════════════════

import type { IndexResult } from "./index-manager.js";
import type { IndexingBurst } from "./notify.js";
import { shouldPersistCampaign, type PersistDeps } from "./campaign-persist.js";

export interface CampaignDeps {
  /** Runs the incremental catch-up and reports what it changed. */
  reindex: () => Promise<IndexResult>;
  /** Rewrites `last-run.md` so the run is observable like every other one. */
  writeLastRun: () => void;
  /** One timestamped line, both on the MCP console and in `watcher.log`. */
  trace: (msg: string) => void;
  /** Pops the settled OS notification, with the burst total. */
  notify: (total: number) => void;
  /** Does the watcher still have queued/scheduled work? (burst not settled yet) */
  moreComing: () => boolean;
  burst: IndexingBurst;
  notifyMin: number;
  /**
   * How to persist the vault — or `null` when this checkout is NOT an installed
   * brain (the launcher), where committing would sweep a maintainer's working tree.
   */
  persist: PersistDeps | null;
  /**
   * Signals that this campaign left something worth committing. WHEN that commit
   * happens is not the campaign's business — see `PersistenceScheduler`.
   *
   * Required on purpose, even though `persist: null` already covers the launcher:
   * a campaign that can persist but has nowhere to say so would index forever and
   * commit nothing, silently. The composition root must not be able to forget it.
   */
  requestPersist: () => void;
}

/** The `✅ catch-up done` line: what the campaign found, in the owner's log. */
export function formatCatchUpDone(result: IndexResult): string {
  return (
    `✅ catch-up done: ${result.indexed} indexed, ${result.skipped} unchanged` +
    (result.skippedLocked ? " (skipped: reindex already in progress)" : "") +
    (result.errors.length > 0 ? `, ${result.errors.length} errors` : "")
  );
}

/**
 * One debounced catch-up campaign, end to end. Persistence comes LAST and is
 * gated on what the campaign actually changed: this is the moment the engine
 * already knows its own result, whoever wrote the file — Claude, Obsidian, `rm`,
 * or one of the engine's own scripts.
 */
export async function runCatchUpCampaign(deps: CampaignDeps): Promise<void> {
  deps.trace("⚙️  catch-up triggered (debounce elapsed) — indexing in progress…");
  const result = await deps.reindex();
  deps.writeLastRun();
  deps.trace(formatCatchUpDone(result));

  // A big sync lands in waves: only toast once the watcher has settled, with the
  // accumulated total, never a premature "done — 8" mid-flight (Obs 3 / F5).
  const decision = deps.burst.record(result.indexed, deps.moreComing(), deps.notifyMin);
  if (decision.notify) deps.notify(decision.total);

  if (!deps.persist) return;
  // The gate stays here — it is the moment the engine knows what the campaign
  // changed. Only the CADENCE moved out: a campaign that changed nothing asks
  // for nothing, and one that did hands off to the persistence window.
  if (!shouldPersistCampaign(result)) return;
  deps.requestPersist?.();
  deps.trace("💾 vault persistence requested — committing once the vault is still");
}
