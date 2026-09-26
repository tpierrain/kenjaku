// Tests for install-scripts.mjs — every dependency that runs an install script is
// declared in `allowScripts`, by name (plan v5.5.2 § S1.4, issue #132).
//
// npm 12 BLOCKS a dependency's install scripts unless the project's package.json
// allows them. For better-sqlite3 that script is what fetches the native binary, so
// an engine installed with npm 12 and no declaration loads no database at all
// ("Could not locate the bindings file") — measured on 2026-09-26 with npm 12.1.0.
// On npm 11 the same install printed nothing, which is why no test saw it coming.
//
// The lockfile already records which packages carry an install script
// (`hasInstallScript: true`), so the check needs no npm 12 and no network.
// Fixtures are hand-written, never produced by the code under test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { installScriptGaps } from "./install-scripts.mjs";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const lockfile = (packages) => ({ lockfileVersion: 3, packages: { "": { name: "x", hasInstallScript: true }, ...packages } });

test("every scripted dependency allowed by name → no gap", () => {
  const gaps = installScriptGaps(
    { allowScripts: { "better-sqlite3": true, esbuild: true } },
    lockfile({
      "node_modules/better-sqlite3": { version: "12.10.1", hasInstallScript: true },
      "node_modules/esbuild": { version: "0.28.1", hasInstallScript: true, dev: true },
      "node_modules/js-yaml": { version: "4.3.2" },
    }),
  );
  assert.deepEqual(gaps, { missing: [], pinned: [], denied: [] });
});

test("the project's own install script is not a dependency and needs no entry", () => {
  assert.deepEqual(installScriptGaps({}, lockfile({})), { missing: [], pinned: [], denied: [] });
});

test("scripted dependencies with no entry are missing, sorted, once each — nested copies included", () => {
  const gaps = installScriptGaps(
    { allowScripts: { esbuild: true } },
    lockfile({
      "node_modules/protobufjs": { version: "7.6.6", hasInstallScript: true },
      "node_modules/esbuild": { version: "0.28.1", hasInstallScript: true },
      "node_modules/@google/genai": { version: "1.52.0", hasInstallScript: true },
      "node_modules/a/node_modules/protobufjs": { version: "6.0.0", hasInstallScript: true },
      "node_modules/no-script": { version: "1.0.0" },
    }),
  );
  assert.deepEqual(gaps, { missing: ["@google/genai", "protobufjs"], pinned: [], denied: [] });
});

test("a package.json with no allowScripts at all leaves every scripted dependency missing", () => {
  const gaps = installScriptGaps({}, lockfile({ "node_modules/better-sqlite3": { version: "12.10.1", hasInstallScript: true } }));
  assert.deepEqual(gaps, { missing: ["better-sqlite3"], pinned: [], denied: [] });
});

test("a version-pinned entry is refused: the next dependency bump would silently block the script again", () => {
  const gaps = installScriptGaps(
    { allowScripts: { "better-sqlite3@12.10.1": true, "onnxruntime-node@1": true, esbuild: true } },
    lockfile({
      "node_modules/better-sqlite3": { version: "12.10.1", hasInstallScript: true },
      "node_modules/onnxruntime-node": { version: "1.30.0", hasInstallScript: true },
      "node_modules/esbuild": { version: "0.28.1", hasInstallScript: true },
    }),
  );
  assert.deepEqual(gaps, { missing: [], pinned: ["better-sqlite3@12.10.1", "onnxruntime-node@1"], denied: [] });
});

test("a scoped name without a version is not mistaken for a pin", () => {
  const gaps = installScriptGaps(
    { allowScripts: { "@google/genai": true } },
    lockfile({ "node_modules/@google/genai": { version: "1.52.0", hasInstallScript: true } }),
  );
  assert.deepEqual(gaps, { missing: [], pinned: [], denied: [] });
});

test("a pinned entry on a SCOPED package is still recognised as a pin, and still covers its package", () => {
  const gaps = installScriptGaps(
    { allowScripts: { "@google/genai@1.52.0": true } },
    lockfile({ "node_modules/@google/genai": { version: "1.52.0", hasInstallScript: true } }),
  );
  assert.deepEqual(gaps, { missing: [], pinned: ["@google/genai@1.52.0"], denied: [] });
});

test("an explicit denial of a scripted dependency is reported, not counted as covered", () => {
  const gaps = installScriptGaps(
    { allowScripts: { "better-sqlite3": false, esbuild: true } },
    lockfile({
      "node_modules/better-sqlite3": { version: "12.10.1", hasInstallScript: true },
      "node_modules/esbuild": { version: "0.28.1", hasInstallScript: true },
    }),
  );
  assert.deepEqual(gaps, { missing: [], pinned: [], denied: ["better-sqlite3"] });
});

// ── The real, shipped trees ──────────────────────────────────────────────────

for (const dir of ["rag", "local-mirror"]) {
  test(`${dir}/: every dependency with an install script is allowed by name`, () => {
    const pkg = JSON.parse(readFileSync(join(REPO, dir, "package.json"), "utf8"));
    const lock = JSON.parse(readFileSync(join(REPO, dir, "package-lock.json"), "utf8"));
    assert.deepEqual(installScriptGaps(pkg, lock), { missing: [], pinned: [], denied: [] });
  });
}
