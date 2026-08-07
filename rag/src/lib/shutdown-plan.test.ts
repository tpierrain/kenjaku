import { test } from "node:test";
import assert from "node:assert/strict";
import { vaultShutdownPlan } from "./shutdown-plan.js";

// What the server must release when its session ends. The order is not cosmetic: the watcher
// can schedule a reindex, and a reindex against a closed database throws. Stop what can still
// write, THEN close what it writes to.
test("the cleanup stops the watcher first, then closes the index", () => {
  const released: string[] = [];

  vaultShutdownPlan({
    stopWatcher: () => released.push("watcher"),
    closeIndex: () => released.push("index"),
    trace: () => {},
  }).cleanup();

  assert.deepEqual(released, ["watcher", "index"]);
});

// The lock is what starves the next session, so releasing it cannot be conditional on the rest
// of the shutdown going well. A watcher that refuses to stop must cost a log line, not a vault.
test("a watcher that fails to stop is reported, and the index is closed anyway", () => {
  const released: string[] = [];
  const traced: string[] = [];

  vaultShutdownPlan({
    stopWatcher: () => {
      throw new Error("chokidar is wedged");
    },
    closeIndex: () => released.push("index"),
    trace: (message) => traced.push(message),
  }).cleanup();

  assert.deepEqual(released, ["index"]);
  assert.equal(traced.length, 2);
  assert.match(traced[0]!, /session ended/i);
  assert.match(traced[1]!, /chokidar is wedged/);
});

// This defect was invisible for the length of its life: no error, no warning, just tools that
// were not there. A session that ends leaves a line in the same trace as the rest of the
// lifecycle, so "did this server ever die?" stops being answerable only with `ps`.
test("the end of a session is announced in the trace", () => {
  const traced: string[] = [];

  vaultShutdownPlan({
    stopWatcher: () => {},
    closeIndex: () => {},
    trace: (message) => traced.push(message),
  }).cleanup();

  assert.equal(traced.length, 1);
  assert.match(traced[0]!, /session ended/i);
});
