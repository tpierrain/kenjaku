import { test } from "node:test";
import assert from "node:assert/strict";

import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { runConsolidateScan } from "./consolidate-scan.mjs";

const CLI = join(dirname(fileURLToPath(import.meta.url)), "consolidate-scan.mjs");

// ═══════════════════════════════════════════════════════════════════════════
// consolidate-scan — the thin CLI glue over the pure Track C candidate core. It
// reads the vault and prints an honest list of what needs consolidating, with a
// binary exit code (0 nothing to consolidate / 1 candidates found), so it
// composes in scripts. All side effects come through an injected `deps` port so
// the glue itself is unit-testable (no untestable top-level side effects).
// ═══════════════════════════════════════════════════════════════════════════

function fakeDeps(overrides = {}) {
  const logs = [];
  const seenDirs = [];
  const deps = {
    cwd: () => "/brain",
    readNotes: (dir) => {
      seenDirs.push(dir);
      return [];
    },
    log: (line) => logs.push(line),
    ...overrides,
  };
  return { deps, logs, seenDirs };
}

test("runConsolidateScan — a vault with nothing to consolidate prints the count + clean line and exits 0", () => {
  const { deps, logs, seenDirs } = fakeDeps();
  const code = runConsolidateScan([], deps);
  assert.equal(code, 0);
  assert.deepEqual(seenDirs, ["/brain/vault"]);
  assert.deepEqual(logs, ["Scanned 0 notes under /brain/vault", "✓ Nothing to consolidate"]);
});

test("runConsolidateScan — a vault with candidates prints the report and exits 1", () => {
  const notes = [
    {
      path: "meetings/2026-07-15-revue.md",
      frontmatter: { type: "meeting", updated: "2026-07-15" },
      body: "[[Marie Dupont]] a tranché.",
    },
  ];
  const { deps, logs } = fakeDeps({ readNotes: () => notes });
  const code = runConsolidateScan([], deps);
  assert.equal(code, 1);
  assert.equal(logs[0], "Scanned 1 notes under /brain/vault");
  assert.ok(logs.includes("✗ Consolidation candidates found"), "prints the candidates header");
  assert.ok(
    logs.includes("  [[Marie Dupont]] — cited by 1: meetings/2026-07-15-revue.md"),
    "lists the new-page candidate",
  );
});

test("runConsolidateScan — an explicit path argument overrides the default ./vault", () => {
  const { deps, seenDirs } = fakeDeps();
  runConsolidateScan(["/data/other-vault"], deps);
  assert.deepEqual(seenDirs, ["/data/other-vault"]);
});

// ─────────────────────────────────────────────────────────────────────────────
// The entry-point seam — asserted by RUNNING the CLI as a process, which is the
// only thing that proves the tail actually fires. Mirrors the lint-vault
// conversion (S0bis): the same shared tail lands on every top-level script.
// ─────────────────────────────────────────────────────────────────────────────

test("the CLI, run as a process — an empty vault exits 0 and says so", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "consolidate-scan-cli-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(join(dir, "vault"));

  const run = spawnSync(process.execPath, [CLI, join(dir, "vault")], { encoding: "utf8" });

  assert.equal(run.status, 0, `expected a clean exit, got ${run.status} — stderr: ${run.stderr}${run.stdout}`);
  assert.match(run.stdout, /Scanned 0 notes/);
  assert.match(run.stdout, /✓ Nothing to consolidate/);
});

test("the CLI, IMPORTED rather than run — the body must not fire on import", async () => {
  // The whole point of the tail: importing the module runs nothing. Asserted from
  // a child process so an accidental process.exit() cannot take the suite with it.
  const probe = `import("${pathToFileURL(CLI).href}").then(() => { console.log("imported-and-still-alive"); });`;
  const run = spawnSync(process.execPath, ["--input-type=module", "-e", probe], { encoding: "utf8" });

  assert.equal(run.status, 0, `importing the CLI must not exit — stderr: ${run.stderr}`);
  assert.equal(run.stdout.trim(), "imported-and-still-alive");
});
