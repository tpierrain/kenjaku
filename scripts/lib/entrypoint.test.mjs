import { test } from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { mkdtempSync, writeFileSync, symlinkSync, realpathSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { isEntrypoint, runAsEntrypoint } from "./entrypoint.mjs";

test("isEntrypoint — true when the meta-url is the canonical URL of argv1", () => {
  const argv1 = "/Users/dev/brain/scripts/clear-example-notes.mjs";
  assert.equal(isEntrypoint(pathToFileURL(argv1).href, argv1), true);
});

test("isEntrypoint — false for a different file", () => {
  const argv1 = "/Users/dev/brain/scripts/clear-example-notes.mjs";
  const otherUrl = pathToFileURL("/Users/dev/brain/scripts/reindex.mjs").href;
  assert.equal(isEntrypoint(otherUrl, argv1), false);
});

test("isEntrypoint — true when argv1 reaches the file THROUGH a symlink (review, v4.9.1)", () => {
  // Node realpath-resolves the MAIN module by default, so import.meta.url holds
  // the real path while argv1 keeps the symlinked spelling (macOS /var →
  // /private/var being the everyday case: every tmpdir path). Unresolved, the
  // guard silently never fires — set-active-universe.mjs then switches without
  // persisting, the exact defect #69 is about. Same lesson as auto-commit.mjs's
  // isEntryPoint, now shared by the ONE canonical predicate.
  const dir = mkdtempSync(join(tmpdir(), "entrypoint-"));
  try {
    const realDir = realpathSync(dir); // tmpdir itself may sit behind a symlink
    writeFileSync(join(realDir, "tool.mjs"), "// empty\n");
    symlinkSync(realDir, join(realDir, "alias"), "dir");
    const throughSymlink = join(realDir, "alias", "tool.mjs");
    const metaUrl = pathToFileURL(join(realDir, "tool.mjs")).href; // what Node builds

    assert.equal(isEntrypoint(metaUrl, throughSymlink), true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("isEntrypoint — false for a missing or empty argv1 (imported, not spawned)", () => {
  const metaUrl = pathToFileURL("/Users/dev/brain/scripts/tool.mjs").href;
  assert.equal(isEntrypoint(metaUrl, undefined), false);
  assert.equal(isEntrypoint(metaUrl, ""), false);
  // A nonexistent argv1 (realpath throws) must degrade to a plain mismatch, not crash.
  assert.equal(isEntrypoint(metaUrl, "/no/such/file.mjs"), false);
});

// ─────────────────────────────────────────────────────────────────────────────
// runAsEntrypoint — the shared tail every top-level scripts/*.mjs ends with.
// It exists so the per-script body stops being an unimportable top-level block
// (the 0 %-scored shape the v4.8.0 mutation pass named as debt 1) and becomes an
// exported function a test can call. Tested ONCE, here.
// ─────────────────────────────────────────────────────────────────────────────

// argv as Node builds it: [execPath, scriptPath, ...userArgs]. The script path is
// spelled through pathToFileURL so the fixture is never produced by the code under test.
const SCRIPT = "/Users/dev/brain/scripts/lint-vault.mjs";
const SCRIPT_URL = pathToFileURL(SCRIPT).href;
const argvFor = (...userArgs) => ["/usr/bin/node", SCRIPT, ...userArgs];

test("runAsEntrypoint — imported, not invoked: the body never runs and nothing exits", () => {
  const calls = [];
  const exits = [];
  const otherUrl = pathToFileURL("/Users/dev/brain/scripts/verify-index.mjs").href;

  const ran = runAsEntrypoint(otherUrl, argvFor("--fix"), (a) => calls.push(a), {
    exit: (c) => exits.push(c),
  });

  assert.equal(ran, false);
  assert.deepEqual(calls, []);
  assert.deepEqual(exits, []);
});

test("runAsEntrypoint — invoked: the body gets the USER arguments, and its code is the exit code", () => {
  const calls = [];
  const exits = [];

  const ran = runAsEntrypoint(SCRIPT_URL, argvFor("--fix", "vault/note.md"), (a) => {
    calls.push(a);
    return 3;
  }, { exit: (c) => exits.push(c) });

  assert.equal(ran, true);
  // slice(2): neither the node binary nor the script path reaches the body.
  assert.deepEqual(calls, [["--fix", "vault/note.md"]]);
  assert.deepEqual(exits, [3]);
});

test("runAsEntrypoint — exit code 0 is an exit, not a falsy skip", () => {
  // Triangulates the operator: a `if (code)` implementation would silently stop
  // exiting on success, and every green CLI would start reporting whatever code
  // the process happened to end on.
  const exits = [];
  runAsEntrypoint(SCRIPT_URL, argvFor(), () => 0, { exit: (c) => exits.push(c) });
  assert.deepEqual(exits, [0]);
});

test("runAsEntrypoint — a NON-numeric result exits nothing (the fall-through bodies)", () => {
  // auto-commit.mjs's body returns an object and relies on the natural exit 0.
  // Forcing process.exit() on it would change the hook's behaviour.
  const exits = [];
  runAsEntrypoint(SCRIPT_URL, argvFor(), () => ({ committed: true }), { exit: (c) => exits.push(c) });
  runAsEntrypoint(SCRIPT_URL, argvFor(), () => undefined, { exit: (c) => exits.push(c) });
  runAsEntrypoint(SCRIPT_URL, argvFor(), () => "done", { exit: (c) => exits.push(c) });
  assert.deepEqual(exits, []);
});

test("runAsEntrypoint — an async body is awaited, and its resolved code is the exit code", async () => {
  const exits = [];
  const ran = runAsEntrypoint(SCRIPT_URL, argvFor("--apply"), async (a) => {
    assert.deepEqual(a, ["--apply"]);
    return 2;
  }, { exit: (c) => exits.push(c) });

  // The exit must NOT have happened before the promise settles — otherwise the
  // async body (delete-universe, update-engine) is killed mid-flight.
  assert.deepEqual(exits, []);
  assert.equal(await ran, true);
  assert.deepEqual(exits, [2]);
});

test("runAsEntrypoint — an async body resolving to nothing exits nothing either", async () => {
  const exits = [];
  await runAsEntrypoint(SCRIPT_URL, argvFor(), async () => undefined, {
    exit: (c) => exits.push(c),
  });
  assert.deepEqual(exits, []);
});

test("runAsEntrypoint — an argv with no script path is 'imported', never a crash", () => {
  const calls = [];
  for (const argv of [[], ["/usr/bin/node"], ["/usr/bin/node", ""], undefined]) {
    assert.equal(runAsEntrypoint(SCRIPT_URL, argv, () => calls.push(argv), { exit: () => {} }), false);
  }
  assert.deepEqual(calls, []);
});

test("runAsEntrypoint — defaults to process.exit when no seam is injected", () => {
  // The default matters: every call site relies on it, and nothing else asserts it.
  const original = process.exit;
  const exits = [];
  process.exit = (c) => exits.push(c);
  try {
    runAsEntrypoint(SCRIPT_URL, argvFor(), () => 7);
  } finally {
    process.exit = original;
  }
  assert.deepEqual(exits, [7]);
});

test("isEntrypoint — true when argv1 contains a space (percent-encoded path)", () => {
  // import.meta.url is ALWAYS a canonical, percent-encoded file URL. A path with a
  // space (`C:\Users\John Doe\…`, `/Users/John Doe/…`) encodes to `%20`, whereas the
  // hand-rolled `file://${argv1}` keeps the literal space → the guard never matched
  // → silent no-op (bug B2). This reproduces it cross-platform, no Windows needed.
  const argv1 = "/Users/John Doe/brain/scripts/clear-example-notes.mjs";
  assert.equal(isEntrypoint(pathToFileURL(argv1).href, argv1), true);
});
