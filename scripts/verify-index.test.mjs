import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  buildCrosscheckInvocation,
  defaultRunCrosscheck,
  realVerifyIndexDeps,
  runVerifyIndex,
} from "./verify-index.mjs";

const CLI = join(dirname(fileURLToPath(import.meta.url)), "verify-index.mjs");

// Spelled with `join`, like production: the command derives `rag/` from the cwd, so on
// Windows a fixture hand-written with `/` compares `\brain\rag` against `/brain/rag`
// and fails for a reason that has nothing to do with the behaviour (CONVENTIONS §9).
const BRAIN = join("/brain");

function deps(over = {}) {
  const errors = [];
  const calls = [];
  return {
    errors,
    calls,
    cwd: () => BRAIN,
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

  assert.deepEqual(d.calls, [{ ragDir: join(BRAIN, "rag"), argv: ["--json"] }]);
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

// The default wiring is what a real `node scripts/verify-index.mjs` runs, and every test
// above injects its own doubles — so without this, the seams that ARE the command could
// all be emptied and the suite would stay green (mutation testing said exactly that:
// `realVerifyIndexDeps = {}` survived).
test("realVerifyIndexDeps wires the real machine", () => {
  assert.equal(realVerifyIndexDeps.cwd(), process.cwd());
  assert.equal(realVerifyIndexDeps.runCrosscheck, defaultRunCrosscheck);
});

// The only channel this command has for "I could not even run": if it silently forwards
// nowhere, exit 2 arrives with no reason at all — the failure mode the exit codes exist
// to prevent.
test("realVerifyIndexDeps.error forwards to console.error, arguments and all", () => {
  const original = console.error;
  const errored = [];
  console.error = (...a) => errored.push(a);
  try {
    realVerifyIndexDeps.error("✗ Could not run the crosscheck:", "spawn npx ENOENT");
  } finally {
    console.error = original;
  }
  assert.deepEqual(errored, [["✗ Could not run the crosscheck:", "spawn npx ENOENT"]]);
});

// The engine's crosscheck is spawned, so what the command actually asks the OS for is the
// only thing worth asserting — and it is a pure value, not an effect. `tsx` comes from the
// brain's own `rag/node_modules`, which is why the cwd is rag/ and not the brain root.
test("posix: the invocation runs the engine's crosscheck through the brain's local npx", () => {
  const invocation = buildCrosscheckInvocation({
    ragDir: join(BRAIN, "rag"),
    platform: "darwin",
    argv: ["--json"],
  });

  assert.deepEqual(invocation, {
    command: "npx",
    args: ["tsx", "src/crosscheck-cli.ts", "--json"],
    options: {
      cwd: join(BRAIN, "rag"),
      stdio: "inherit",
      shell: false,
      env: { ...process.env, SBG_NO_NOTIFY: "1" },
      windowsHide: true,
    },
  });
});

// The other platform, fed on purpose: on Windows npx is a `.cmd`, which cannot be executed
// without a shell — and CI runs this suite on macOS, so nothing but an explicit fixture can
// tell this branch from the identity (ADR 0015 / 0031).
test("win32: npx is the .cmd, and it is launched through a shell", () => {
  const invocation = buildCrosscheckInvocation({
    ragDir: "D:\\brains\\mind-palace\\rag",
    platform: "win32",
    argv: [],
  });

  assert.deepEqual(invocation, {
    command: "npx.cmd",
    args: ["tsx", "src/crosscheck-cli.ts"],
    options: {
      cwd: "D:\\brains\\mind-palace\\rag",
      stdio: "inherit",
      shell: true,
      env: { ...process.env, SBG_NO_NOTIFY: "1" },
      windowsHide: true,
    },
  });
});

// The absent twin of the two tests above: the command is normally called with neither a
// platform nor arguments, and an argument list that quietly gained a value would hand the
// engine's CLI a flag nobody asked for.
test("called with nothing but a rag/ folder, it adds no argument of its own", () => {
  const invocation = buildCrosscheckInvocation({ ragDir: join(BRAIN, "rag") });

  assert.deepEqual(invocation.args, ["tsx", "src/crosscheck-cli.ts"]);
  assert.equal(invocation.command, process.platform === "win32" ? "npx.cmd" : "npx");
  assert.equal(invocation.options.shell, process.platform === "win32");
});

// The one line between the built invocation and the OS. A stub that returned `0` would be
// indistinguishable from the real spawn's nominal result, so it hands back a shape no
// spawnSync ever produces, and records what it was handed.
test("defaultRunCrosscheck hands the built invocation to the spawn, and returns its result", () => {
  const calls = [];
  const spawn = (...a) => {
    calls.push(a);
    return { status: 7, marker: "not-a-real-spawn-result" };
  };

  const result = defaultRunCrosscheck({ ragDir: join(BRAIN, "rag"), platform: "darwin" }, spawn);

  assert.deepEqual(result, { status: 7, marker: "not-a-real-spawn-result" });
  const { command, args, options } = buildCrosscheckInvocation({
    ragDir: join(BRAIN, "rag"),
    platform: "darwin",
  });
  assert.deepEqual(calls, [[command, args, options]]);
});

// ─────────────────────────────────────────────────────────────────────────────
// The entry-point seam — asserted by RUNNING the CLI as a process, which is the
// only thing that proves the tail actually fires. Only the import half is
// exercised here: every real invocation of this CLI spawns npx/tsx against a
// rag/ folder, so unlike lint-vault there is no harmless "run it and check the
// output" invocation — running it for real reaches the toolchain.
// ─────────────────────────────────────────────────────────────────────────────

test("the CLI, IMPORTED rather than run — the body must not fire on import", async () => {
  // The whole point of the tail: importing the module runs nothing. Asserted from
  // a child process so an accidental process.exit() cannot take the suite with it.
  const probe = `import("${pathToFileURL(CLI).href}").then(() => { console.log("imported-and-still-alive"); });`;
  const run = spawnSync(process.execPath, ["--input-type=module", "-e", probe], { encoding: "utf8" });

  assert.equal(run.status, 0, `importing the CLI must not exit — stderr: ${run.stderr}`);
  assert.equal(run.stdout.trim(), "imported-and-still-alive");
});
