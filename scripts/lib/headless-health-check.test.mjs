import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { callHeadlessHealthCheck, buildHeadlessHealthCheckCaller, healthCliInvocation } from "./headless-health-check.mjs";

// callHeadlessHealthCheck (ADR 0030 §4/§6, F7-ter) is the runtime probe's HEADLESS
// `callHealthCheck`: it reads a module's on-disk state read-only (light depth) instead
// of doing an MCP round-trip that would boot a 2nd server next to the live one. Only
// vault-rag has a headless reader (rag/src/health-check-cli.ts) today; the CLI runner
// is injected so this is unit-testable without spawning anything.

test("callHeadlessHealthCheck — vault-rag → runs the headless CLI and returns its parsed verdict", async () => {
  let ran = null;
  const runCli = (opts) => {
    ran = opts;
    return '{"status":"ok","checks":[{"name":"canary","status":"ok","detail":"present (light)"}]}';
  };
  const verdict = await callHeadlessHealthCheck({
    module: "vault-rag",
    brainDir: "/brain",
    platform: "darwin",
    depth: "light",
    runCli,
  });
  assert.equal(verdict.status, "ok");
  assert.equal(verdict.checks[0].name, "canary");
  assert.ok(ran, "the headless CLI was actually invoked");
});

test("callHeadlessHealthCheck — a module with no headless reader → unknown, never boots/spawns", async () => {
  let called = false;
  const runCli = () => {
    called = true;
    return "{}";
  };
  const verdict = await callHeadlessHealthCheck({ module: "local-mirror", brainDir: "/brain", runCli });
  assert.equal(verdict.status, "unknown");
  assert.equal(called, false, "no headless reader → the runner is never invoked (no boot)");
});

test("callHeadlessHealthCheck — non-JSON CLI output → unknown (fail-open, never a false broken)", async () => {
  const verdict = await callHeadlessHealthCheck({
    module: "vault-rag",
    brainDir: "/brain",
    runCli: () => "tsx: command not found\n",
  });
  assert.equal(verdict.status, "unknown");
});

test("buildHeadlessHealthCheckCaller — isRegistered reads .mcp.json; callHealthCheck routes through the headless reader", async () => {
  const { isRegistered, callHealthCheck } = buildHeadlessHealthCheckCaller({
    mcpServers: { "vault-rag": { command: "sh" } },
    brainDir: "/brain",
    platform: "darwin",
    runCli: () => '{"status":"ok","checks":[]}',
  });
  assert.equal(isRegistered("vault-rag"), true);
  assert.equal(isRegistered("local-mirror"), false);
  const verdict = await callHealthCheck("vault-rag");
  assert.equal(verdict.status, "ok");
});

// ─── The spawn nothing observed (field report 2026-08-07, defect 3) ──────────────────
// The real runner used to build its own `npx tsx …` inline, so no test ever saw the one
// thing that mattered about it: which tsx it reached for. It reached for none — cwd is
// the brain root, tsx is a devDependency of rag/, so npx fell back to its cache and a
// registry round-trip (1.55 s here, 9.8 s on the reporters' machines). The request is a
// value now, and this is the test that watches it.

test("healthCliInvocation — the probe runs rag's OWN tsx, and stays read-only light", () => {
  const brainDir = join("/brains", "mine");

  const inv = healthCliInvocation({ brainDir, platform: "darwin", depth: "light", exists: () => true });

  assert.equal(inv.command, process.execPath);
  assert.deepEqual(inv.args, [
    join(brainDir, "rag", "node_modules", "tsx", "dist", "cli.mjs"),
    "rag/src/health-check-cli.ts",
    "--depth",
    "light",
  ]);
});

// The probe is deliberately cheap so it can run at every session start; the depth is the
// knob that keeps it cheap (light = disk reads, zero ONNX — ADR 0030 §6). It must reach
// the CLI, not be dropped on the way through the new indirection.
test("healthCliInvocation — the requested depth reaches the CLI, whatever it is", () => {
  const inv = healthCliInvocation({ brainDir: "/brains/mine", platform: "darwin", depth: "full", exists: () => true });

  assert.deepEqual(inv.args.slice(-2), ["--depth", "full"]);
});
