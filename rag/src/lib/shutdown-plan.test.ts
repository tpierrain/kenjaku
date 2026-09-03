import { test } from "node:test";
import assert from "node:assert/strict";
import { vaultShutdownPlan } from "./shutdown-plan.js";

// What the server must release when its session ends. The order is not cosmetic: the watcher
// can schedule a reindex, and a reindex against a closed database throws. Stop what can still
// write, THEN close what it writes to.
test("the cleanup stops the watcher and the remote-sync clock first, then closes the index", () => {
  const released: string[] = [];

  vaultShutdownPlan({
    stopWatcher: () => released.push("watcher"),
    stopRemoteSync: () => released.push("remote-sync"),
    closeIndex: () => released.push("index"),
    trace: () => {},
  }).cleanup();

  assert.deepEqual(released, ["watcher", "remote-sync", "index"]);
});

// The clock spawns a git child every 90 s. One that outlived its session would keep pulling
// into a brain nobody is looking at — and the next session's `.git/index.lock` contention
// would be with a process that has no window at all. It stops here, or it never stops.
test("a watcher that fails to stop does not take the clock with it: both are released, and both are said", () => {
  const released: string[] = [];
  const traced: string[] = [];

  vaultShutdownPlan({
    stopWatcher: () => {
      throw new Error("chokidar is wedged");
    },
    stopRemoteSync: () => {
      throw new Error("the timer would not clear");
    },
    closeIndex: () => released.push("index"),
    trace: (message) => traced.push(message),
  }).cleanup();

  assert.deepEqual(released, ["index"]);
  assert.equal(traced.length, 3);
  // Whole lines, not just the error text: the LABEL is the half that says WHICH loop
  // refused, and it is the only thing that tells "the watcher is wedged" from "the clock
  // is still pulling into this brain" when the two errors read alike.
  assert.deepEqual(traced.slice(1), [
    "⚠️ the live watcher would not stop: chokidar is wedged",
    "⚠️ the live-sync clock would not stop: the timer would not clear",
  ]);
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
    stopRemoteSync: () => {},
    closeIndex: () => released.push("index"),
    trace: (message) => traced.push(message),
  }).cleanup();

  assert.deepEqual(released, ["index"]);
  assert.equal(traced.length, 2);
  assert.match(traced[0]!, /session ended/i);
  assert.equal(traced[1], "⚠️ the live watcher would not stop: chokidar is wedged");
});

// This defect was invisible for the length of its life: no error, no warning, just tools that
// were not there. A session that ends leaves a line in the same trace as the rest of the
// lifecycle, so "did this server ever die?" stops being answerable only with `ps`.
test("the end of a session is announced in the trace", () => {
  const traced: string[] = [];

  vaultShutdownPlan({
    stopWatcher: () => {},
    stopRemoteSync: () => {},
    closeIndex: () => {},
    trace: (message) => traced.push(message),
  }).cleanup();

  assert.equal(traced.length, 1);
  assert.match(traced[0]!, /session ended/i);
});
