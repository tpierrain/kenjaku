import { test } from "node:test";
import assert from "node:assert/strict";

import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { runLint } from "./lint-vault.mjs";

const CLI = join(dirname(fileURLToPath(import.meta.url)), "lint-vault.mjs");

// ═══════════════════════════════════════════════════════════════════════════
// lint-vault — the thin CLI glue over the pure wiki-health core. Binary exit
// code (0 clean / 1 bleeding / 2 usage error). All side effects come through an
// injected `deps` port so the glue itself is unit-testable (no untestable
// top-level side effects — TDD mutation lesson #6).
// ═══════════════════════════════════════════════════════════════════════════

function fakeDeps(overrides = {}) {
  const logs = [];
  const errors = [];
  const seenDirs = [];
  const deps = {
    cwd: () => "/brain",
    readNotes: (dir) => {
      seenDirs.push(dir);
      return [];
    },
    log: (line) => logs.push(line),
    error: (line) => errors.push(line),
    ...overrides,
  };
  return { deps, logs, errors, seenDirs };
}

test("runLint — a clean vault prints the scan count + clean line and exits 0", () => {
  const { deps, logs, seenDirs } = fakeDeps();
  const code = runLint([], deps);
  assert.equal(code, 0);
  assert.deepEqual(seenDirs, ["/brain/vault"]);
  assert.deepEqual(logs, ["Scanned 0 notes under /brain/vault", "✓ Wiki health: clean"]);
});

test("runLint — a bleeding vault prints the report and exits 1", () => {
  const notes = [{ path: "a.md", frontmatter: { type: "topic", created: "d", updated: "d", tags: ["t"] }, body: "[[Missing]]" }];
  const { deps, logs } = fakeDeps({ readNotes: () => notes });
  const code = runLint([], deps);
  assert.equal(code, 1);
  assert.equal(logs[0], "Scanned 1 notes under /brain/vault");
  assert.ok(logs.includes("✗ Wiki health: issues found"), "prints the bleeding header");
  assert.ok(logs.includes("  a.md → [[Missing]]"), "lists the dangling link");
});

test("runLint — an explicit path argument overrides the default ./vault", () => {
  const { deps, seenDirs } = fakeDeps();
  runLint(["/data/other-vault"], deps);
  assert.deepEqual(seenDirs, ["/data/other-vault"]);
});

// ─────────────────────────────────────────────────────────────────────────────
// The entry-point seam — asserted by RUNNING the CLI as a process, which is the
// only thing that proves the tail actually fires. This is the canary of the
// S0bis conversion: the same three lines land on every other top-level script,
// so if the shared tail is wrong it is wrong HERE first, on one file.
// ─────────────────────────────────────────────────────────────────────────────

test("the CLI, run as a process — a clean vault exits 0 and says so", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "lint-vault-cli-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(join(dir, "vault"));
  // Two notes that link to each other: a lone note is an ORPHAN, which is itself
  // a wiki-health issue — a clean vault has to be a connected one.
  const note = (body) =>
    `---\ntype: topic\ncreated: 2026-08-20\nupdated: 2026-08-20\ntags: [demo]\n---\n\n${body}\n`;
  writeFileSync(join(dir, "vault", "alpha.md"), note("Links to [[beta]]."));
  writeFileSync(join(dir, "vault", "beta.md"), note("Links back to [[alpha]]."));

  const run = spawnSync(process.execPath, [CLI, join(dir, "vault")], { encoding: "utf8" });

  assert.equal(run.status, 0, `expected a clean exit, got ${run.status} — stderr: ${run.stderr}${run.stdout}`);
  assert.match(run.stdout, /Scanned 2 notes/);
  assert.match(run.stdout, /✓ Wiki health: clean/);
});

test("the CLI, run as a process — a dangling link exits 1 and names the note", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "lint-vault-cli-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(join(dir, "vault"));
  writeFileSync(
    join(dir, "vault", "broken.md"),
    "---\ntype: topic\ncreated: 2026-08-20\nupdated: 2026-08-20\ntags: [demo]\n---\n\nSee [[Nowhere]].\n",
  );

  const run = spawnSync(process.execPath, [CLI, join(dir, "vault")], { encoding: "utf8" });

  assert.equal(run.status, 1, `a bleeding vault must exit 1 — stderr: ${run.stderr}`);
  assert.match(run.stdout, /broken\.md → \[\[Nowhere\]\]/);
});

test("the CLI, IMPORTED rather than run — the body must not fire on import", async () => {
  // The whole point of the tail: importing the module runs nothing. Asserted from
  // a child process so an accidental process.exit() cannot take the suite with it.
  const probe = `import("${pathToFileURL(CLI).href}").then(() => { console.log("imported-and-still-alive"); });`;
  const run = spawnSync(process.execPath, ["--input-type=module", "-e", probe], { encoding: "utf8" });

  assert.equal(run.status, 0, `importing the CLI must not exit — stderr: ${run.stderr}`);
  assert.equal(run.stdout.trim(), "imported-and-still-alive");
});
