import { test } from "node:test";
import assert from "node:assert/strict";
import { shouldPersistCampaign } from "./campaign-persist.js";

test("a campaign that indexed a note asks for the vault to be persisted", () => {
  assert.equal(shouldPersistCampaign({ indexed: 1, removed: 0 }), true);
});

test("a campaign that changed NOTHING asks for nothing", () => {
  // F11's lock and the boundary that separates `> 0` from `>= 0`: an
  // all-unchanged catch-up must not commit. Campaigns fire on churn that git
  // cannot see, and with `secondbrain.autopush` on, a needless commit reaches
  // the network.
  assert.equal(shouldPersistCampaign({ indexed: 0, removed: 0 }), false);
});

test("a DELETION asks for it too, though it indexed nothing", () => {
  // F9, field-observed: `rm` of a note runs a campaign reporting
  // `indexed:0, removed:1`. Gating on `indexed` alone — the obvious reading of
  // "end of an indexing campaign" — leaves every deletion uncommitted.
  assert.equal(shouldPersistCampaign({ indexed: 0, removed: 1 }), true);
});
