import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import {
  buildScriptRunner,
  persistCampaign,
  shouldPersistCampaign,
} from "./campaign-persist.js";

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

test("a campaign that changed something commits, THEN pushes", async () => {
  const ran: string[] = [];
  const outcome = await persistCampaign(
    { indexed: 1, removed: 0 },
    { runScript: (script) => { ran.push(script); } },
  );
  // The whole sequence, in order: the push is worthless before the commit.
  assert.deepEqual(ran, ["auto-commit.mjs", "auto-push.mjs"]);
  assert.equal(outcome, "persisted");
});

test("a campaign that changed NOTHING runs no script at all", async () => {
  // F11's lock at the wiring layer: `.obsidian/` UI churn ends a campaign too.
  // Harmless today only by accident (`.obsidian/` is gitignored), and `autopush`
  // would carry the needless commit to the network.
  const ran: string[] = [];
  const outcome = await persistCampaign(
    { indexed: 0, removed: 0 },
    { runScript: (script) => { ran.push(script); } },
  );
  assert.deepEqual(ran, []);
  assert.equal(outcome, "skipped");
});

test("a commit that blows up stops there, reports the failure, and never throws", async () => {
  // The watcher runs this inside its debounced campaign: a throw here would take
  // down the live-update loop, i.e. the very thing that makes notes searchable.
  // And a push over a tree that was never committed persists nothing.
  const ran: string[] = [];
  const outcome = await persistCampaign(
    { indexed: 1, removed: 0 },
    {
      runScript: (script) => {
        ran.push(script);
        throw new Error("git is not on PATH");
      },
    },
  );
  assert.deepEqual(ran, ["auto-commit.mjs"]);
  assert.equal(outcome, "failed");
});

test("a push that fails ASYNCHRONOUSLY is caught too — the commit still stands", () => {
  // The real runner spawns a child process, so a failure arrives as a rejected
  // promise, not a throw. Unawaited, it would escape as an unhandled rejection
  // AND the campaign would report success over a push that never happened.
  const ran: string[] = [];
  return persistCampaign(
    { indexed: 0, removed: 1 },
    {
      runScript: async (script) => {
        ran.push(script);
        if (script === "auto-push.mjs") throw new Error("no route to host");
      },
    },
  ).then((outcome) => {
    assert.deepEqual(ran, ["auto-commit.mjs", "auto-push.mjs"]);
    assert.equal(outcome, "failed");
  });
});

test("the real runner launches the brain's own script, with this node, from the brain root", async () => {
  const calls: Array<[string, readonly string[], { cwd: string }]> = [];
  const runner = buildScriptRunner({
    brainRoot: join("/brains", "mind-palace"),
    nodeExec: "/usr/local/bin/node",
    run: async (command, args, options) => { calls.push([command, args, options]); },
  });

  await runner("auto-commit.mjs");

  // `process.execPath`, never a bare "node": the MCP server may well run under a
  // node that is not on the PATH the desktop app hands us.
  assert.deepEqual(calls, [
    [
      "/usr/local/bin/node",
      [join("/brains", "mind-palace", "scripts", "auto-commit.mjs")],
      { cwd: join("/brains", "mind-palace") },
    ],
  ]);
});
