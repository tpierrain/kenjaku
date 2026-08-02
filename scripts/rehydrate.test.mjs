// The `rehydrate` command (F14): what a SECOND machine runs on a fresh clone to
// rebuild everything the install generates but git cannot carry.
//
// Every side effect goes through injected deps, so each branch is reachable and
// the command is asserted on what it DID, not on a disk left behind.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

import { runRehydrate, realRehydrateDeps } from "./rehydrate.mjs";
import { seedHealthNote } from "./lib/staged-health-note.mjs";
import { buildRagInstallInvocation } from "./lib/rag-launcher.mjs";

function fakeDeps({ spawnStatus = 0, ...overrides } = {}) {
  const calls = { writes: [], spawns: [], invocations: [], cleanups: [], log: [], error: [] };
  const deps = {
    // Returns a fingerprint no real invocation would produce, so wiring it to the
    // spawn is proven rather than assumed.
    installInvocation: (platform, ragDir) => {
      calls.invocations.push({ platform, ragDir });
      return {
        command: "/fake/self-heal-sh",
        args: ["--fake-install"],
        cleanup: () => calls.cleanups.push(calls.invocations.length),
      };
    },
    cwd: () => "/brains/mind-palace",
    platform: "darwin",
    tmpDir: () => "/tmp",
    exists: () => true,
    readFile: () => "",
    writeFile: (path, content) => calls.writes.push({ path, content }),
    seedHealthNote: () => ({ present: true }),
    spawnSync: (command, args, opts) => {
      calls.spawns.push({ command, args, cwd: opts?.cwd, shell: opts?.shell });
      return { status: spawnStatus };
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

// What the run reports it REBUILT. The closing hand-off line (pinned in full by the
// end-to-end test) is dropped here so each artifact test stays about its artifact.
const rebuilt = (calls) => calls.log.slice(0, calls.log.indexOf(""));

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
  assert.deepEqual(rebuilt(calls), ["✓ regenerated .mcp.json"]);
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
  assert.deepEqual(rebuilt(calls), ["✓ regenerated .claude/settings.json"]);
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
  assert.deepEqual(rebuilt(calls), ["✓ reseeded vault/engine-health/health-check.md"]);
});

// `node_modules/` never travels either, and rag/ carries a NATIVE binding: the
// install has to go through the launcher's own self-heal PATH (ADR 0021-A), which
// is what `installInvocation` builds. The command only has to hand it the machine.
test("missing rag dependencies are installed through the launcher's own PATH", () => {
  const { deps, calls } = fakeDeps({ exists: (path) => !path.endsWith("/rag/node_modules") });

  assert.equal(runRehydrate([], deps), 0);

  assert.deepEqual(calls.invocations, [
    { platform: "darwin", ragDir: "/brains/mind-palace/rag" },
  ]);
  assert.deepEqual(calls.spawns, [
    {
      command: "/fake/self-heal-sh",
      args: ["--fake-install"],
      cwd: "/brains/mind-palace/rag",
      shell: false,
    },
  ]);
  // The win32 branch materialises a temp script inside rag/ — cleaned up pass or fail.
  assert.deepEqual(calls.cleanups, [1]);
  assert.deepEqual(calls.error, []);
  assert.deepEqual(rebuilt(calls), ["✓ installed the rag/ dependencies"]);
});

// The clone lost BOTH dependency trees, and the second one is the one `SETUP.md`
// forgot: without it the local-mirror server, wired in the .mcp.json just rebuilt,
// fails to boot. Pure JS, so a plain npm install is enough — no self-heal build.
test("missing local-mirror dependencies are installed too", () => {
  const { deps, calls } = fakeDeps({
    exists: (path) => !path.endsWith("/local-mirror/node_modules"),
  });

  assert.equal(runRehydrate([], deps), 0);

  assert.deepEqual(calls.invocations, []);
  assert.deepEqual(calls.spawns, [
    {
      command: "npm",
      args: ["install", "--silent"],
      cwd: "/brains/mind-palace/local-mirror",
      shell: false,
    },
  ]);
  assert.deepEqual(calls.error, []);
  assert.deepEqual(rebuilt(calls), ["✓ installed the local-mirror/ dependencies"]);
});

// The real second-machine case, end to end: nothing is there. Beyond doing the
// work, the command has to end on the step that no artifact can carry — the one
// the install hand-off exists for. A rehydrated folder is still inert until a NEW
// conversation is started IN it, since that is when the MCP servers and the hooks
// are loaded; a session already open keeps its old, empty wiring.
test("a freshly cloned brain gets everything back, then is told what only a human can do", () => {
  const { deps, calls } = fakeDeps({
    exists: () => false,
    readFile: (path) => (path.endsWith(".mcp.json.template") ? MCP_TEMPLATE : SETTINGS_TEMPLATE),
  });

  assert.equal(runRehydrate([], deps), 0);

  assert.deepEqual(calls.error, []);
  assert.deepEqual(calls.log, [
    "✓ regenerated .mcp.json",
    "✓ regenerated .claude/settings.json",
    "✓ reseeded vault/engine-health/health-check.md",
    "✓ installed the rag/ dependencies",
    "✓ installed the local-mirror/ dependencies",
    "",
    "→ Now open a NEW conversation rooted in this folder: the MCP servers and the hooks are loaded when a session starts, so an already-open one still runs on the old wiring.",
  ]);
});

// The other half of §10's lesson: on a posix CI, `npm` and the win32 `npm.cmd`
// shim are indistinguishable, and spawning the shim without a shell throws EINVAL
// (ADR 0031) — a Windows-only regression no green posix suite would ever show.
test("on Windows the local-mirror install goes through the npm shim, in a shell", () => {
  const { deps, calls } = fakeDeps({
    platform: "win32",
    exists: (path) => !path.endsWith("/local-mirror/node_modules"),
  });

  assert.equal(runRehydrate([], deps), 0);

  assert.deepEqual(calls.spawns, [
    {
      command: "npm.cmd",
      args: ["install", "--silent"],
      cwd: "/brains/mind-palace/local-mirror",
      shell: true,
    },
  ]);
});

// A rehydrate that half-succeeded must never read as done: the whole finding is
// that a second machine fails into the void, so a failed install exits non-zero and
// names the command to run by hand.
test("a failed rag install stops the command and says what to re-run", () => {
  const { deps, calls } = fakeDeps({
    exists: (path) => !path.endsWith("/rag/node_modules"),
    spawnStatus: 1,
  });

  assert.equal(runRehydrate([], deps), 1);

  assert.deepEqual(calls.log, []);
  assert.deepEqual(calls.error, [
    "✗ npm install failed in rag/ — run it by hand:  cd rag && npm install",
  ]);
  // The temp win32 script is removed on the failure path too.
  assert.deepEqual(calls.cleanups, [1]);
});

// Its own test, not a variation of the rag one: a single failing install proves
// nothing about the other branch, which would happily stay silent and exit 0.
test("a failed local-mirror install stops the command and says what to re-run", () => {
  const { deps, calls } = fakeDeps({
    exists: (path) => !path.endsWith("/local-mirror/node_modules"),
    spawnStatus: 1,
  });

  assert.equal(runRehydrate([], deps), 1);

  assert.deepEqual(calls.log, []);
  assert.deepEqual(calls.error, [
    "✗ npm install failed in local-mirror/ — run it by hand:  cd local-mirror && npm install",
  ]);
});

// Green on arrival, and here to stay: on a posix CI, forwarding `deps.platform` and
// hardcoding "darwin" are indistinguishable — the regression would only ever show
// up on a user's Windows machine, as a native binding built the wrong way.
test("the machine's real platform reaches the install invocation", () => {
  const { deps, calls } = fakeDeps({
    platform: "win32",
    exists: (path) => !path.endsWith("/rag/node_modules"),
  });

  assert.equal(runRehydrate([], deps), 0);

  assert.deepEqual(calls.invocations, [
    { platform: "win32", ragDir: "/brains/mind-palace/rag" },
  ]);
});

// ── realRehydrateDeps (the real wiring, used when runRehydrate is called w/o deps)
// Named and asserted rather than inlined: this is where a command usually stops
// being testable, and where a mis-wire (the canary seeded by nothing, the install
// built without the self-heal PATH) would pass every test above.
test("realRehydrateDeps wires the real machine", () => {
  assert.equal(realRehydrateDeps.seedHealthNote, seedHealthNote);
  assert.equal(realRehydrateDeps.installInvocation, buildRagInstallInvocation);
  assert.equal(realRehydrateDeps.spawnSync, spawnSync);
  assert.equal(realRehydrateDeps.platform, process.platform);
  assert.equal(realRehydrateDeps.cwd(), process.cwd());
  assert.equal(realRehydrateDeps.tmpDir(), tmpdir());
});

// A brain missing `.claude/settings.json` may be missing the folder around it too
// (nothing else in there is guaranteed on a partial clone), so writing must create
// the parent rather than throw.
test("realRehydrateDeps writes through a missing parent folder, and reads it back", () => {
  const root = mkdtempSync(join(tmpdir(), "rehydrate-wiring-"));
  try {
    const target = join(root, "nested", "settings.json");
    assert.equal(realRehydrateDeps.exists(target), false);

    realRehydrateDeps.writeFile(target, '{"hooks":{}}\n');

    assert.equal(realRehydrateDeps.exists(target), true);
    assert.equal(realRehydrateDeps.readFile(target), '{"hooks":{}}\n');
  } finally {
    rmSync(root, { recursive: true });
  }
});

test("realRehydrateDeps.log/error forward to console.log/console.error", () => {
  const [origLog, origErr] = [console.log, console.error];
  const logged = [];
  const errored = [];
  console.log = (line) => logged.push(line);
  console.error = (line) => errored.push(line);
  try {
    realRehydrateDeps.log("rebuilt");
    realRehydrateDeps.error("nope");
  } finally {
    console.log = origLog;
    console.error = origErr;
  }
  assert.deepEqual(logged, ["rebuilt"]);
  assert.deepEqual(errored, ["nope"]);
});
