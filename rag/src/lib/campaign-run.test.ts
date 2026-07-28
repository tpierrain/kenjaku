import { test } from "node:test";
import assert from "node:assert/strict";
import { runCatchUpCampaign } from "./campaign-run.js";
import { IndexingBurst } from "./notify.js";
import type { IndexResult } from "./index-manager.js";

// A campaign result as the indexer reports it — only the counters ever differ.
function campaign(partial: Partial<IndexResult>): IndexResult {
  return { scanned: 0, indexed: 0, skipped: 0, removed: 0, errors: [], ...partial };
}

interface Recorded {
  /** How many times the campaign asked for the vault to be committed. */
  asked: number;
  traced: string[];
  notified: number[];
}

function runWith(result: IndexResult, opts: { ourVault?: boolean } = {}) {
  const rec: Recorded = { asked: 0, traced: [], notified: [] };
  const promise = runCatchUpCampaign({
    reindex: async () => result,
    writeLastRun: () => {},
    trace: (msg) => rec.traced.push(msg),
    notify: (total) => rec.notified.push(total),
    moreComing: () => false,
    burst: new IndexingBurst(),
    notifyMin: 5,
    persist:
      opts.ourVault === false ? null : { runScript: () => {} },
    requestPersist: () => { rec.asked++; },
  });
  return promise.then(() => rec);
}

test("a note written by the engine's OWN script is committed", async () => {
  // The primary field case (F8/P1): `set-universe-profile.mjs` wrote a note in
  // Node, so no Write/Edit tool fired and the PostToolUse hook never ran.
  const rec = await runWith(campaign({ scanned: 1, indexed: 1 }));
  assert.equal(rec.asked, 1);
});

test("a note typed OUTSIDE Claude, in Obsidian, is committed", async () => {
  // F8: no tool call fires at all — the file just appears in the vault, the
  // watcher indexes it, and until now git heard about it at the next session start.
  const rec = await runWith(campaign({ scanned: 12, indexed: 1, skipped: 11 }));
  assert.equal(rec.asked, 1);
});

test("a note DELETED with `rm` is committed, though the campaign indexed nothing", async () => {
  // F9, field-observed as `indexed:0, removed:1`. Gating on `indexed` alone would
  // reproduce F9 inside its own fix.
  const rec = await runWith(campaign({ scanned: 11, skipped: 11, removed: 1 }));
  assert.equal(rec.asked, 1);
});

test("moving an Obsidian pane commits NOTHING", async () => {
  // F11's lock at the wiring layer: `.obsidian/` churn used to run a campaign.
  // It is ignored by the watcher now, and even if one reaches here it changed
  // nothing — which is the gate. Harmless today only by accident (`.obsidian/`
  // is gitignored); with `autopush` on, a needless commit reaches the network.
  const rec = await runWith(campaign({ scanned: 12, skipped: 12 }));
  assert.equal(rec.asked, 0);
  assert.deepEqual(rec.traced, [
    "⚙️  catch-up triggered (debounce elapsed) — indexing in progress…",
    "✅ catch-up done: 0 indexed, 12 unchanged",
  ]);
  // The toast is gated too, and nothing said so: a campaign that indexed
  // nothing has nothing to announce, and a desktop notification reading
  // "done — 0" for a pane someone moved is the noise F5 is about.
  assert.deepEqual(rec.notified, [], "and no toast for a campaign that changed nothing");
});

test("a campaign that found the reindex already running says so, in that same line", async () => {
  // `skippedLocked` is the honest half of the catch-up line: the campaign ran,
  // found the lock held, and indexed nothing THROUGH NO FAULT of the vault. Read
  // without that clause, "0 indexed, 0 unchanged" reads as an empty vault.
  const rec = await runWith(campaign({ scanned: 0, skippedLocked: true }));
  assert.deepEqual(rec.traced, [
    "⚙️  catch-up triggered (debounce elapsed) — indexing in progress…",
    "✅ catch-up done: 0 indexed, 0 unchanged (skipped: reindex already in progress)",
  ]);
  assert.equal(rec.asked, 0, "nothing changed → nothing to commit");
});

test("the launcher's own vault is never committed", async () => {
  // `persist: null` is what a checkout with no install provenance yields. The
  // campaign still indexes and traces — it just does not touch git.
  const rec = await runWith(campaign({ scanned: 1, indexed: 1 }), { ourVault: false });
  assert.equal(rec.asked, 0);
  assert.equal(rec.traced.length, 2);
});

test("the campaign traces what it DID, not an outcome it never checked", async () => {
  // The rule this test has always defended: never trace a fact we had no way to
  // observe. It used to say "commit + push ran" — true then, because the campaign
  // ran them. It no longer does, so claiming a commit here would be exactly the
  // pretence the test exists to prevent. It reports the request, which is all it
  // did; the line about the scripts now lives where they actually run
  // (`persistVaultNow`, campaign-persist.ts).
  const rec = await runWith(campaign({ scanned: 1, indexed: 1, errors: ["boom"] }));
  assert.deepEqual(rec.traced, [
    "⚙️  catch-up triggered (debounce elapsed) — indexing in progress…",
    "✅ catch-up done: 1 indexed, 0 unchanged, 1 errors",
    "💾 vault persistence requested — committing once the vault is still",
  ]);
});

test("the campaign asks for a commit, it does not run git on the spot", async () => {
  // The cadence is not the campaign's business: indexing must stay on its 5 s
  // debounce so search is fresh, while the commit waits for the vault to be
  // still (PersistenceScheduler). Running git here would tie the two together
  // again — one push per pause longer than five seconds.
  const rec: string[] = [];
  const asked: number[] = [];
  await runCatchUpCampaign({
    reindex: async () => campaign({ scanned: 1, indexed: 1 }),
    writeLastRun: () => {},
    trace: () => {},
    notify: () => {},
    moreComing: () => false,
    burst: new IndexingBurst(),
    notifyMin: 5,
    persist: { runScript: (s) => { rec.push(s); } },
    requestPersist: () => asked.push(1),
  });

  assert.deepEqual(asked, [1], "persistence was requested, exactly once");
  assert.deepEqual(rec, [], "and no git ran inside the campaign");
});

test("a bulk pickup toasts once the burst settled, and still commits", async () => {
  const rec = await runWith(campaign({ scanned: 40, indexed: 7 }));
  assert.deepEqual(rec.notified, [7]);
  assert.equal(rec.asked, 1);
});
