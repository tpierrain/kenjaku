import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ALLOWED_IGNORE_PREFIXES, ignoredGlobs, unsafeIgnores } from "./ci-path-filter.mjs";

// The launcher's root, from this file rather than from the runner's cwd — same reason
// `tracked-files.test.mjs` does it: `node --test` is invoked from several places here.
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CI_YML = join(REPO_ROOT, ".github", "workflows", "ci.yml");

// ═══════════════════════════════════════════════════════════════════════════
// A path filter on CI is a net that disables itself SILENTLY: everything stays
// green, faster, and nothing on screen says a suite stopped running. That is the
// exact failure class this repo keeps paying for, so the filter gets a guard.
//
// Two things are asserted, and they pull in opposite directions on purpose:
//   • the filter EXISTS — a commit that touches only plans must not spend seven
//     runs of the whole suite (owner's call, 2026-09-12: « quand on ne fait que
//     créer/modifier des issues et des plans, ça n'a aucun intérêt »);
//   • the filter is CONFINED to the plans — the day someone adds `templates/**`
//     or `scripts/**` to it, the product ships untested and the tracker says
//     nothing. This test is what goes red instead.
// ═══════════════════════════════════════════════════════════════════════════

test("the real ci.yml skips plan-only commits, on pushes AND on pull requests", () => {
  const globs = ignoredGlobs(readFileSync(CI_YML, "utf8"));

  // Both triggers, in file order: a filter on `push` alone still burns the matrix on
  // a documentation PR, and one on `pull_request` alone does nothing for the direct
  // pushes this repo actually makes to `main`.
  assert.deepEqual(globs, ["maintainers/plans/**", "maintainers/plans/**"]);
});

test("the real ci.yml never excuses anything but the plans from being tested", () => {
  const globs = ignoredGlobs(readFileSync(CI_YML, "utf8"));

  assert.deepEqual(unsafeIgnores(globs), []);
});

test("unsafeIgnores — names every glob that would leave code untested, in file order", () => {
  const globs = ["templates/**", "maintainers/plans/**", "scripts/lib/*.mjs", "rag/**"];

  assert.deepEqual(unsafeIgnores(globs), ["templates/**", "scripts/lib/*.mjs", "rag/**"]);
});

test("unsafeIgnores — a lookalike directory is NOT the plans directory", () => {
  // `maintainers/plans-and-studies/**` starts with the same letters and is not the
  // allowed path: a prefix test that forgets the trailing slash would let it through.
  assert.deepEqual(unsafeIgnores(["maintainers/plans-and-studies/**"]), [
    "maintainers/plans-and-studies/**",
  ]);
  assert.deepEqual(unsafeIgnores(["maintainers/plans/archived/x.md"]), []);
});

test("unsafeIgnores — the allowed list is the one the module publishes, and it is the plans", () => {
  assert.deepEqual(ALLOWED_IGNORE_PREFIXES, ["maintainers/plans/"]);
});

test("ignoredGlobs — reads every block, unquotes, and stops at the next key", () => {
  const yaml = [
    "on:",
    "  push:",
    "    paths-ignore:",
    "      # a comment inside the list must not end it",
    '      - "maintainers/plans/**"',
    "",
    "      - 'docs/**'",
    "    branches: [main]",
    "  pull_request:",
    "    paths-ignore:",
    "      - maintainers/plans/**",
    "jobs:",
    "  build:",
    "    steps:",
    "      - run: echo not a path",
  ].join("\n");

  assert.deepEqual(ignoredGlobs(yaml), ["maintainers/plans/**", "docs/**", "maintainers/plans/**"]);
});

test("ignoredGlobs — the inline form is read too, so the guard never goes quiet on a rewrite", () => {
  const yaml = 'on:\n  push:\n    paths-ignore: ["templates/**", \'scripts/**\']\n';

  assert.deepEqual(ignoredGlobs(yaml), ["templates/**", "scripts/**"]);
});

test("ignoredGlobs — a CRLF checkout reads exactly like an LF one (Windows)", () => {
  // Caught by the repo's own Windows cells on the first push, and worth keeping as a
  // fixture rather than a memory: in JavaScript `\r` is a LINE TERMINATOR, so `.` never
  // matches it and `$` never matches before it. A regex anchored with `$` therefore
  // fails on every line of a Windows checkout — silently, by finding nothing at all,
  // which here reads as "this workflow filters no path" instead of as a parse failure.
  const lf = ['on:', '  push:', '    paths-ignore:', '      - "maintainers/plans/**"', ""].join("\n");

  assert.deepEqual(ignoredGlobs(lf.replace(/\n/g, "\r\n")), ignoredGlobs(lf));
  assert.deepEqual(ignoredGlobs(lf.replace(/\n/g, "\r\n")), ["maintainers/plans/**"]);
});

test("ignoredGlobs — a workflow that filters nothing yields nothing", () => {
  assert.deepEqual(ignoredGlobs("on:\n  push:\n  pull_request:\n"), []);
});
