import { test } from "node:test";
import assert from "node:assert/strict";

import { runVerifyIndex } from "./verify-index.mjs";

function deps(over = {}) {
  const errors = [];
  const calls = [];
  return {
    errors,
    calls,
    cwd: () => "/brain",
    runCrosscheck: (opts) => {
      calls.push(opts);
      return { status: 0 };
    },
    error: (...a) => errors.push(a.join(" ")),
    ...over,
  };
}

test("the crosscheck runs from the brain's rag/ folder, and its arguments travel through", () => {
  // rag/ and not the brain root: that is where the engine's own tsx is installed, so the
  // command works offline. The engine's paths are anchored on its files, not on the cwd.
  const d = deps();

  const code = runVerifyIndex(["--json"], d);

  assert.deepEqual(d.calls, [{ ragDir: "/brain/rag", argv: ["--json"] }]);
  assert.equal(code, 0);
});

test("a disagreement between vault and index comes back as exit 1, silently (the CLI already spoke)", () => {
  const d = deps({ runCrosscheck: () => ({ status: 1 }) });

  assert.equal(runVerifyIndex([], d), 1);
  assert.deepEqual(d.errors, []);
});

test("an engine that never started is exit 2 with its reason — never a clean bill of health", () => {
  // The dangerous confusion: "npx is missing" must not read as "your index is fine".
  const d = deps({ runCrosscheck: () => ({ error: new Error("spawn npx ENOENT"), status: null }) });

  assert.equal(runVerifyIndex([], d), 2);
  assert.deepEqual(d.errors, [
    "✗ Could not run the crosscheck: spawn npx ENOENT",
    "  → From the brain folder: cd rag && npm install, then run this again.",
  ]);
});

test("a spawn that reports no status and no error is still exit 2, not a pass", () => {
  const d = deps({ runCrosscheck: () => ({ status: null }) });

  assert.equal(runVerifyIndex([], d), 2);
  assert.deepEqual(d.errors, [
    "✗ Could not run the crosscheck: the engine did not start",
    "  → From the brain folder: cd rag && npm install, then run this again.",
  ]);
});
