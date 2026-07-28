import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildScriptRunner,
  persistCampaign,
  persistenceApplies,
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

test("the real runner launches the brain's own script, with this node, from the brain root, BOUNDED", async () => {
  const calls: Array<[string, readonly string[], { cwd: string; timeout?: number }]> = [];
  const runner = buildScriptRunner({
    brainRoot: join("/brains", "mind-palace"),
    nodeExec: "/usr/local/bin/node",
    run: async (command, args, options) => { calls.push([command, args, options]); },
  });

  await runner("auto-commit.mjs");

  // `process.execPath`, never a bare "node": the MCP server may well run under a
  // node that is not on the PATH the desktop app hands us.
  //
  // `timeout` is the load-bearing one, and it is spelled out here rather than read
  // from the module so that changing it stays a deliberate decision. `auto-push.mjs`
  // reaches the NETWORK; `ReindexScheduler` holds `running = true` for this whole
  // await and only records later writes as `pending`. So an unbounded child that
  // hangs — unreachable remote, a credential helper waiting on input — stops the
  // vault being indexed at all until the MCP server restarts. Bounded, the child is
  // killed, `persistCampaign` reports "failed", and the next campaign retries.
  assert.deepEqual(calls, [
    [
      "/usr/local/bin/node",
      [join("/brains", "mind-palace", "scripts", "auto-commit.mjs")],
      { cwd: join("/brains", "mind-palace"), timeout: 120_000 },
    ],
  ]);
});

test("vault persistence is refused for the REAL committed launcher manifest", () => {
  // Not a hand-written shape — THE file this repo ships. A synthetic fixture is
  // what let this guard fail open: it asserted a launcher "carries no provenance"
  // while the committed manifest carries `"provenance": {}`, so the guard returned
  // true on the generator, whose `vault/` is real. A maintainer running the engine
  // here (`npm run dev`) would have their working tree swept into an `auto:` commit.
  const launcherManifest = JSON.parse(
    readFileSync(
      resolve(dirname(fileURLToPath(import.meta.url)), "../../../engine-manifest.json"),
      "utf-8",
    ),
  );

  assert.equal(persistenceApplies(launcherManifest), false);
});

test("vault persistence applies to an INSTALLED brain — the shape `recordSourceAndProvenance` stamps", () => {
  // What `enrichManifest(manifest, {source: buildSource(git), provenance})` leaves
  // behind. `provenance` is present here too, on purpose: it is exactly what the
  // launcher also has, so a guard that keyed on it could not tell these two apart.
  const installed = {
    manifestVersion: 1,
    provenance: {},
    source: { repo: "https://github.com/tpierrain/kenjaku", ref: "v4.4.0" },
  };

  assert.equal(persistenceApplies(installed), true);
});

test("a brain whose install could not name a repo still owns its vault (`repo: null`)", () => {
  // `buildSource` yields `{repo: null, ref: undefined}` when the launcher had no
  // remote to report. That brain is still an installed brain with its own git and
  // its own vault: refusing to commit it would lose notes, which is the very
  // failure this release exists to fix.
  assert.equal(persistenceApplies({ source: { repo: null, ref: undefined } }), true);
});

test("a manifest whose `source` is null fails CLOSED (`typeof null === \"object\"`)", () => {
  // The trap the launcher guard already fell into once: a truthiness-shaped check
  // that a degenerate value satisfies. No install writes this, so it means the
  // manifest was hand-edited or half-written — exactly when NOT committing is right.
  assert.equal(persistenceApplies({ manifestVersion: 1, source: null }), false);
});

test("an unreadable manifest fails CLOSED — no commit over a repo we cannot identify", () => {
  // Both shapes a failed read produces. Not committing is the status quo the
  // release improves on; committing the wrong repo is damage.
  assert.equal(persistenceApplies(null), false);
  assert.equal(persistenceApplies("{ not json"), false);
});
