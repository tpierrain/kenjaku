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
  ran: string[];
  traced: string[];
  notified: number[];
}

function runWith(result: IndexResult, opts: { ourVault?: boolean } = {}) {
  const rec: Recorded = { ran: [], traced: [], notified: [] };
  const promise = runCatchUpCampaign({
    reindex: async () => result,
    writeLastRun: () => {},
    trace: (msg) => rec.traced.push(msg),
    notify: (total) => rec.notified.push(total),
    moreComing: () => false,
    burst: new IndexingBurst(),
    notifyMin: 5,
    persist:
      opts.ourVault === false ? null : { runScript: (s) => { rec.ran.push(s); } },
  });
  return promise.then(() => rec);
}

test("a note written by the engine's OWN script is committed", async () => {
  // The primary field case (F8/P1): `set-universe-profile.mjs` wrote a note in
  // Node, so no Write/Edit tool fired and the PostToolUse hook never ran.
  const rec = await runWith(campaign({ scanned: 1, indexed: 1 }));
  assert.deepEqual(rec.ran, ["auto-commit.mjs", "auto-push.mjs"]);
});

test("a note typed OUTSIDE Claude, in Obsidian, is committed", async () => {
  // F8: no tool call fires at all — the file just appears in the vault, the
  // watcher indexes it, and until now git heard about it at the next session start.
  const rec = await runWith(campaign({ scanned: 12, indexed: 1, skipped: 11 }));
  assert.deepEqual(rec.ran, ["auto-commit.mjs", "auto-push.mjs"]);
});

test("a note DELETED with `rm` is committed, though the campaign indexed nothing", async () => {
  // F9, field-observed as `indexed:0, removed:1`. Gating on `indexed` alone would
  // reproduce F9 inside its own fix.
  const rec = await runWith(campaign({ scanned: 11, skipped: 11, removed: 1 }));
  assert.deepEqual(rec.ran, ["auto-commit.mjs", "auto-push.mjs"]);
});

test("moving an Obsidian pane commits NOTHING", async () => {
  // F11's lock at the wiring layer: `.obsidian/` churn used to run a campaign.
  // It is ignored by the watcher now, and even if one reaches here it changed
  // nothing — which is the gate. Harmless today only by accident (`.obsidian/`
  // is gitignored); with `autopush` on, a needless commit reaches the network.
  const rec = await runWith(campaign({ scanned: 12, skipped: 12 }));
  assert.deepEqual(rec.ran, []);
  assert.deepEqual(rec.traced, [
    "⚙️  catch-up triggered (debounce elapsed) — indexing in progress…",
    "✅ catch-up done: 0 indexed, 12 unchanged",
  ]);
});

test("the launcher's own vault is never committed", async () => {
  // `persist: null` is what a checkout with no install provenance yields. The
  // campaign still indexes and traces — it just does not touch git.
  const rec = await runWith(campaign({ scanned: 1, indexed: 1 }), { ourVault: false });
  assert.deepEqual(rec.ran, []);
  assert.equal(rec.traced.length, 2);
});

test("the campaign traces the persistence it performed, after the indexing line", async () => {
  const rec = await runWith(campaign({ scanned: 1, indexed: 1, errors: ["boom"] }));
  assert.deepEqual(rec.traced, [
    "⚙️  catch-up triggered (debounce elapsed) — indexing in progress…",
    "✅ catch-up done: 1 indexed, 0 unchanged, 1 errors",
    "💾 vault persistence: persisted",
  ]);
});

test("a bulk pickup toasts once the burst settled, and still commits", async () => {
  const rec = await runWith(campaign({ scanned: 40, indexed: 7 }));
  assert.deepEqual(rec.notified, [7]);
  assert.deepEqual(rec.ran, ["auto-commit.mjs", "auto-push.mjs"]);
});
