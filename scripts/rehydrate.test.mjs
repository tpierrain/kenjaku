// The `rehydrate` command (F14): what a SECOND machine runs on a fresh clone to
// rebuild everything the install generates but git cannot carry.
//
// Every side effect goes through injected deps, so each branch is reachable and
// the command is asserted on what it DID, not on a disk left behind.
import { test } from "node:test";
import assert from "node:assert/strict";

import { runRehydrate } from "./rehydrate.mjs";

function fakeDeps(overrides = {}) {
  const calls = { writes: [], spawns: [], log: [], error: [] };
  const deps = {
    cwd: () => "/brains/mind-palace",
    platform: "darwin",
    tmpDir: () => "/tmp",
    exists: () => true,
    readFile: () => "",
    writeFile: (path, content) => calls.writes.push({ path, content }),
    seedHealthNote: () => ({ present: true }),
    spawnSync: (command, args, opts) => {
      calls.spawns.push({ command, args, cwd: opts?.cwd });
      return { status: 0 };
    },
    log: (line) => calls.log.push(line),
    error: (line) => calls.error.push(line),
    ...overrides,
  };
  return { deps, calls };
}

// Hand-written on purpose (never produced by the code under test): a template
// shaped like the one that travels in a clone, placeholders included.
const MCP_TEMPLATE = `{
  "mcpServers": {
    "vault-rag": {
      "type": "stdio", "command": "npx", "args": ["tsx", "rag/src/index.ts"],
      "cwd": "{{PROJECT_ROOT}}", "env": {}
    },
    "local-mirror": {
      "type": "stdio", "command": "npx", "args": ["tsx", "local-mirror/src/server.ts"],
      "cwd": "{{PROJECT_ROOT}}", "env": {}
    }
  }
}`;

// Compact on purpose: a settings file is copied through verbatim, so an assertion
// on the exact bytes proves the command substitutes rather than re-serialises.
const SETTINGS_TEMPLATE =
  '{"hooks":{"cmd":"{{NODE}} scripts/auto-commit.mjs"},"root":"{{PROJECT_ROOT}}","tmp":"{{TMP_DIR}}"}';

// Idempotence first: the command is meant to be suggested blindly (by the doc, by
// Claude), so on a brain that needs nothing it must touch nothing — not regenerate
// over a live `.mcp.json` the owner may have added connectors to.
test("a brain already wired for this machine is left untouched", () => {
  const { deps, calls } = fakeDeps();

  assert.equal(runRehydrate([], deps), 0);

  assert.deepEqual(calls.writes, []);
  assert.deepEqual(calls.spawns, []);
  assert.deepEqual(calls.error, []);
  assert.deepEqual(calls.log, ["Nothing to do — this brain is already wired for this machine."]);
});

// The clone carries `.mcp.json.template` but not `.mcp.json` (it bakes an absolute
// path). Rebuilding it is what gives the second machine its `vault-rag` server back.
test("a missing .mcp.json is rebuilt from the template that travelled in the clone", () => {
  const { deps, calls } = fakeDeps({
    exists: (path) => !path.endsWith("/.mcp.json"),
    readFile: (path) => {
      assert.equal(path, "/brains/mind-palace/.mcp.json.template");
      return MCP_TEMPLATE;
    },
  });

  assert.equal(runRehydrate([], deps), 0);

  assert.equal(calls.writes.length, 1);
  assert.equal(calls.writes[0].path, "/brains/mind-palace/.mcp.json");
  // Both servers: the machine's path baked in, and the command routed through the
  // OS-appropriate self-heal launcher — exactly what the installer produces.
  assert.deepEqual(JSON.parse(calls.writes[0].content), {
    mcpServers: {
      "vault-rag": {
        type: "stdio",
        command: "/bin/sh",
        args: ["rag/launch.sh"],
        cwd: "/brains/mind-palace",
        env: {},
      },
      "local-mirror": {
        type: "stdio",
        command: "/bin/sh",
        args: ["local-mirror/launch.sh"],
        cwd: "/brains/mind-palace",
        env: {},
      },
    },
  });
  assert.deepEqual(calls.log, ["✓ regenerated .mcp.json"]);
});

// Same story for the hooks + allowlist file — and it carries all three machine
// placeholders, including the hook runner that differs per OS.
test("a missing .claude/settings.json is rebuilt with the hooks pointed at this machine", () => {
  const { deps, calls } = fakeDeps({
    exists: (path) => !path.endsWith("/.claude/settings.json"),
    readFile: (path) => {
      assert.equal(path, "/brains/mind-palace/.claude/settings.json.template");
      return SETTINGS_TEMPLATE;
    },
  });

  assert.equal(runRehydrate([], deps), 0);

  assert.deepEqual(calls.writes, [
    {
      path: "/brains/mind-palace/.claude/settings.json",
      content:
        '{"hooks":{"cmd":"/bin/sh \\"/brains/mind-palace/scripts/run-node.sh\\" scripts/auto-commit.mjs"},' +
        '"root":"/brains/mind-palace","tmp":"/tmp"}',
    },
  ]);
  assert.deepEqual(calls.log, ["✓ regenerated .claude/settings.json"]);
});

// `vault/engine-health/` is gitignored and the installer alone seeds the canary, so
// a cloned brain never has it — and without it the health check can never again
// prove the index answers, silently. Reseeding it is why this step exists.
test("a missing health canary note is reseeded from the source staged in the clone", () => {
  const seeded = [];
  const { deps, calls } = fakeDeps({
    exists: (path) => !path.endsWith("/vault/engine-health/health-check.md"),
    seedHealthNote: (args) => {
      seeded.push(args);
      return { present: true };
    },
  });

  assert.equal(runRehydrate([], deps), 0);

  // Both dirs are the brain itself: the staged source travelled in the same clone.
  assert.deepEqual(seeded, [
    { sourceDir: "/brains/mind-palace", brainDir: "/brains/mind-palace" },
  ]);
  assert.deepEqual(calls.writes, []);
  assert.deepEqual(calls.error, []);
  assert.deepEqual(calls.log, ["✓ reseeded vault/engine-health/health-check.md"]);
});
