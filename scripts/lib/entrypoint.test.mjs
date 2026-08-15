import { test } from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { mkdtempSync, writeFileSync, symlinkSync, realpathSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { isEntrypoint } from "./entrypoint.mjs";

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

test("isEntrypoint — true when argv1 contains a space (percent-encoded path)", () => {
  // import.meta.url is ALWAYS a canonical, percent-encoded file URL. A path with a
  // space (`C:\Users\John Doe\…`, `/Users/John Doe/…`) encodes to `%20`, whereas the
  // hand-rolled `file://${argv1}` keeps the literal space → the guard never matched
  // → silent no-op (bug B2). This reproduces it cross-platform, no Windows needed.
  const argv1 = "/Users/John Doe/brain/scripts/clear-example-notes.mjs";
  assert.equal(isEntrypoint(pathToFileURL(argv1).href, argv1), true);
});
