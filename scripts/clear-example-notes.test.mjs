import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { clearExamples, runClear, realClearDeps } from "./clear-example-notes.mjs";

const CLI = join(dirname(fileURLToPath(import.meta.url)), "clear-example-notes.mjs");

const fmExemple = "---\ntype: topic\ntags: [exemple, architecture]\n---\n\n# Demo\n";
const fmHarness = "---\ntype: backlog\ntags: [harness, backlog]\n---\n\n# Frictions\n";

function makeBrain() {
  const root = mkdtempSync(join(tmpdir(), "brain-clear-"));
  mkdirSync(join(root, "vault", "topics"), { recursive: true });
  mkdirSync(join(root, "vault", "backlog"), { recursive: true });
  writeFileSync(join(root, "vault", "topics", "flemmr.md"), fmExemple);
  writeFileSync(join(root, "vault", "backlog", "harness.md"), fmHarness);
  return root;
}

test("clearExamples — removes the exemple-tagged notes under <root>/vault, keeps the rest", () => {
  const root = makeBrain();
  try {
    const deleted = clearExamples(root);
    assert.deepEqual(deleted, [join(root, "vault", "topics", "flemmr.md")]);
    assert.equal(existsSync(join(root, "vault", "topics", "flemmr.md")), false);
    assert.equal(existsSync(join(root, "vault", "backlog", "harness.md")), true);
  } finally {
    rmSync(root, { recursive: true });
  }
});

test("clearExamples — only clears <root>/vault, never example notes elsewhere in the brain", () => {
  const root = makeBrain();
  // an exemple-tagged note OUTSIDE vault/ must be left untouched (scope is vault/ only)
  mkdirSync(join(root, "notes"), { recursive: true });
  writeFileSync(join(root, "notes", "outside.md"), fmExemple);
  try {
    const deleted = clearExamples(root);
    assert.deepEqual(deleted, [join(root, "vault", "topics", "flemmr.md")]);
    assert.equal(existsSync(join(root, "notes", "outside.md")), true);
  } finally {
    rmSync(root, { recursive: true });
  }
});

test("clearExamples — returns [] when there is no vault/ (nothing to do)", () => {
  const root = mkdtempSync(join(tmpdir(), "brain-novault-"));
  try {
    assert.deepEqual(clearExamples(root), []);
  } finally {
    rmSync(root, { recursive: true });
  }
});

// ── runClear (the glue: argv parsing, deletion report, reindex spawn) ─────────
// Fake deps recording every side effect so branches/args are asserted without fs.
function fakeDeps(overrides = {}) {
  const calls = { log: [], error: [], spawn: [] };
  const deps = {
    cwd: () => "/brain",
    clear: () => ["/brain/vault/topics/flemmr.md"],
    spawnSync: (cmd, args, opts) => {
      calls.spawn.push({ cmd, args, opts });
      return { status: 0 };
    },
    platform: "darwin",
    log: (...a) => calls.log.push(a.join(" ")),
    error: (...a) => calls.error.push(a.join(" ")),
    ...overrides,
  };
  return { deps, calls };
}

test("runClear — nothing to do: logs, returns 0, never reindexes", () => {
  const { deps, calls } = fakeDeps({ clear: () => [] });
  assert.equal(runClear([], deps), 0);
  assert.deepEqual(calls.log, ["Nothing to do: no example notes found (already removed)."]);
  assert.equal(calls.spawn.length, 0);
});

test("runClear — deletes, reports each file + count, reindexes on success → 0", () => {
  const { deps, calls } = fakeDeps({
    clear: () => ["/brain/vault/a.md", "/brain/vault/b.md"],
  });
  assert.equal(runClear([], deps), 0);
  assert.deepEqual(calls.log, [
    "  🗑️  removed /brain/vault/a.md",
    "  🗑️  removed /brain/vault/b.md",
    "✓ 2 example note(s) removed.",
    "✓ RAG re-indexed — your brain has forgotten the example notes.",
  ]);
  assert.equal(calls.spawn.length, 1);
});

test("runClear — reindex spawn uses `npm`, run --silent reindex, cwd <root>/rag, inherit", () => {
  const { deps, calls } = fakeDeps({ cwd: () => "/xyz" });
  runClear([], deps);
  const { cmd, args, opts } = calls.spawn[0];
  assert.equal(cmd, "npm");
  assert.deepEqual(args, ["run", "--silent", "reindex"]);
  assert.equal(opts.cwd, join("/xyz", "rag"));
  assert.equal(opts.stdio, "inherit");
});

test("runClear — win32 uses npm.cmd and asks for a shell", () => {
  const { deps, calls } = fakeDeps({ platform: "win32" });
  runClear([], deps);
  assert.equal(calls.spawn[0].cmd, "npm.cmd");
  assert.equal(calls.spawn[0].opts.shell, true);
});

test("runClear — POSIX uses npm and no shell", () => {
  const { deps, calls } = fakeDeps({ platform: "linux" });
  runClear([], deps);
  assert.equal(calls.spawn[0].cmd, "npm");
  assert.equal(calls.spawn[0].opts.shell, false);
});

test("runClear — reindex failure (status != 0): logs error, returns 1", () => {
  const { deps, calls } = fakeDeps({ spawnSync: () => ({ status: 1 }) });
  assert.equal(runClear([], deps), 1);
  assert.equal(calls.error.length, 1);
  assert.match(calls.error[0], /re-index failed/);
  assert.equal(calls.log.at(-1), "✓ 1 example note(s) removed.");
});

test("runClear — --no-reindex: deletes but skips reindex, returns 0", () => {
  const { deps, calls } = fakeDeps();
  assert.equal(runClear(["--no-reindex"], deps), 0);
  assert.equal(calls.spawn.length, 0);
  assert.equal(calls.log.at(-1), "✓ 1 example note(s) removed.");
});

// ── realClearDeps (the default real wiring, used when runClear is called w/o deps)
test("realClearDeps — wires the real side effects (clear/spawnSync/platform/cwd)", () => {
  assert.equal(realClearDeps.clear, clearExamples);
  assert.equal(realClearDeps.spawnSync, spawnSync);
  assert.equal(realClearDeps.platform, process.platform);
  assert.equal(realClearDeps.cwd(), process.cwd());
});

test("realClearDeps.log/error forward to console.log/console.error", () => {
  const origLog = console.log;
  const origErr = console.error;
  const logged = [];
  const errored = [];
  console.log = (...a) => logged.push(a.join(" "));
  console.error = (...a) => errored.push(a.join(" "));
  try {
    realClearDeps.log("hello", "world");
    realClearDeps.error("oops");
  } finally {
    console.log = origLog;
    console.error = origErr;
  }
  assert.deepEqual(logged, ["hello world"]);
  assert.deepEqual(errored, ["oops"]);
});

// ─────────────────────────────────────────────────────────────────────────────
// The entry-point seam — asserted by RUNNING the CLI as a process, which is the
// only thing that proves the tail actually fires. Mirrors the lint-vault.mjs
// conversion (scripts/lint-vault.test.mjs).
// ─────────────────────────────────────────────────────────────────────────────

test("the CLI, run as a process with no example notes — logs 'nothing to do' and exits 0", (t) => {
  // A brain with no vault/ at all: harmless by construction — clearExamples
  // returns [] before any file is touched or npm is spawned. Runs with cwd
  // pointed at an empty temp dir so it can NEVER reach this repo's real vault/.
  const dir = mkdtempSync(join(tmpdir(), "clear-example-notes-cli-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));

  const run = spawnSync(process.execPath, [CLI], { cwd: dir, encoding: "utf8" });

  assert.equal(run.status, 0, `expected exit 0, got ${run.status} — stderr: ${run.stderr}${run.stdout}`);
  assert.match(run.stdout, /Nothing to do: no example notes found \(already removed\)\./);
});

test("the CLI, IMPORTED rather than run — the body must not fire on import", async () => {
  // The whole point of the tail: importing the module runs nothing. Asserted from
  // a child process so an accidental process.exit() cannot take the suite with it.
  const probe = `import("${pathToFileURL(CLI).href}").then(() => { console.log("imported-and-still-alive"); });`;
  const run = spawnSync(process.execPath, ["--input-type=module", "-e", probe], { encoding: "utf8" });

  assert.equal(run.status, 0, `importing the CLI must not exit — stderr: ${run.stderr}`);
  assert.equal(run.stdout.trim(), "imported-and-still-alive");
});
