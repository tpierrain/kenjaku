import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";

import { TSX_CLI_REL, tsxInvocation } from "./tsx-invocation.mjs";

// The same defect as the launchers (field report 2026-08-07, defect 3), one layer down.
// `npx tsx rag/src/<cli>.ts` runs with cwd = the brain root, where there is no
// node_modules — tsx is a devDependency of rag/ — so npx cannot resolve it locally and
// pays a registry round-trip. Measured on the maintainer's Mac: 1.55 s via npx versus
// 0.30 s calling tsx/dist/cli.mjs directly; 9.8 s via npx on the reporters' Windows
// machines. The live-health plan prices a per-session probe at the DIRECT figure, so this
// is not a micro-optimisation: it is the premise that section rests on.
//
// The request is built as a VALUE rather than spawned inline — the v4.5.0 lesson this repo
// has now paid for twice (a real child-process runner nothing observed). A value can be
// asserted on every platform without spawning anything.

const exists = (wanted) => (path) => path === wanted;
const never = () => false;

test("tsxInvocation — the tsx next to the script wins, and node runs it directly", () => {
  const brainDir = "/brains/mine";
  const cli = join(brainDir, "rag", "node_modules", "tsx", "dist", "cli.mjs");

  const inv = tsxInvocation({
    brainDir,
    platform: "darwin",
    script: "rag/src/health-check-cli.ts",
    args: ["--depth", "light"],
    exists: exists(cli),
    nodeExe: "/usr/local/bin/node",
  });

  assert.deepEqual(inv, {
    command: "/usr/local/bin/node",
    args: [cli, "rag/src/health-check-cli.ts", "--depth", "light"],
    shell: false,
  });
});

// The node BINARY, not the name: these callers are themselves running under node, so
// process.execPath is known for certain. Going back through PATH would re-open the very
// hole the launchers' PATH self-heal exists to plug.
test("tsxInvocation — node defaults to the running interpreter, never to a PATH lookup", () => {
  const brainDir = "/brains/mine";
  const cli = join(brainDir, "rag", "node_modules", "tsx", "dist", "cli.mjs");

  const inv = tsxInvocation({ brainDir, platform: "darwin", script: "rag/src/notify-cli.ts", exists: exists(cli) });

  assert.equal(inv.command, process.execPath);
  assert.deepEqual(inv.args, [cli, "rag/src/notify-cli.ts"]);
});

test("tsxInvocation — no local tsx: npx still gets the job, arguments and all", () => {
  const inv = tsxInvocation({
    brainDir: "/brains/mine",
    platform: "darwin",
    script: "rag/src/health-check-cli.ts",
    args: ["--depth", "light"],
    exists: never,
  });

  assert.deepEqual(inv, {
    command: "npx",
    args: ["tsx", "rag/src/health-check-cli.ts", "--depth", "light"],
    shell: false,
  });
});

// ADR 0015 / 0031: npx is a shell-wrapped `.cmd` on Windows, and spawning a `.cmd`
// without a shell throws EINVAL since Node ≥ 18.20 (CVE-2024-27980). The direct call has
// neither problem — it is a real binary — so the shell must go with the fallback, not
// come along for the ride.
test("tsxInvocation — on Windows the npx fallback keeps its .cmd and its shell", () => {
  const inv = tsxInvocation({ brainDir: "C:\\brains\\mine", platform: "win32", script: "rag/src/notify-cli.ts", exists: never });

  assert.equal(inv.command, "npx.cmd");
  assert.equal(inv.shell, true);
});

test("tsxInvocation — on Windows the DIRECT call needs no shell, being a real binary", () => {
  const brainDir = "C:\\brains\\mine";
  const cli = join(brainDir, "rag", "node_modules", "tsx", "dist", "cli.mjs");

  const inv = tsxInvocation({ brainDir, platform: "win32", script: "rag/src/notify-cli.ts", exists: exists(cli) });

  assert.equal(inv.shell, false);
  assert.equal(inv.args[0], cli);
});

// local-mirror has its own node_modules; the package to look in is the script's own first
// segment, not a hardcoded "rag". Getting this wrong would silently demote every
// local-mirror call back to npx — the quiet half-fix this report is full of.
test("tsxInvocation — tsx is looked for beside the SCRIPT's package, not beside rag", () => {
  const brainDir = "/brains/mine";
  const cli = join(brainDir, "local-mirror", "node_modules", "tsx", "dist", "cli.mjs");

  const inv = tsxInvocation({ brainDir, platform: "darwin", script: "local-mirror/src/server.ts", exists: exists(cli) });

  assert.equal(inv.args[0], cli);
});

// One fact, one home: the launchers embed this same relative path in shell syntax.
test("TSX_CLI_REL — the single stated fact about where tsx lives", () => {
  assert.equal(TSX_CLI_REL, "node_modules/tsx/dist/cli.mjs");
});
