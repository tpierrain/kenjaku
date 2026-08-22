import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { fingerprint } from "./engine-source.mjs";
import { deliveredSources } from "./engine-fingerprint-table.mjs";
import { parseLsFilesEolZ } from "./tracked-files.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// THE FRESHNESS GUARD on `scripts/lib/engine-fingerprints.json` (plan S7-2).
//
// 🚨 THE RISK THIS EXISTS AGAINST, named in the design before the code: the table
// goes stale the first release nobody regenerates it — this repo's signature defect,
// committed one level up. A stale table is not a loud failure: the release ships,
// the update runs, and the file it was supposed to unfreeze stays frozen because its
// CURRENT bytes are in no row. Nothing says a word.
//
// So the expected value is computed from the WORKING TREE, never from the table:
// every merge-regime file of the release being cut — both locales — must already be
// recognisable. When this goes red the answer is one command, printed in the message:
//   node maintainers/fingerprints/generate-fingerprints.mjs --version <the tag>
//
// 🪟 …but from the working tree AS DELIVERED, not as checked out. On Windows git
// hands us CRLF, and comparing those bytes to a table folded from LF blobs failed
// every merge file at once (23 rels, run 32558375080) — a red that said "the table
// is stale" when the table was fine and the READING was wrong. `deliveredSources`
// answers with what a brain receives, and the generator folds through the very same
// function, so this guard and the artefact it judges cannot drift apart.
//
// What it deliberately does NOT do: re-read the 25 published tags to re-prove the
// historical rows. Those bytes cannot change; paying a minute of CI per run to
// re-confirm them buys nothing.
// ═══════════════════════════════════════════════════════════════════════════

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (rel) => readFileSync(join(REPO_ROOT, rel), "utf8");

const TABLE_REL = "scripts/lib/engine-fingerprints.json";
const REGENERATE = "node maintainers/fingerprints/generate-fingerprints.mjs --version <tag>";

const table = JSON.parse(read(TABLE_REL));
const manifest = JSON.parse(read("engine-manifest.json"));
const git = (args) => execFileSync("git", args, { cwd: REPO_ROOT, encoding: "utf8" });
const trackedFiles = git(["ls-files"]).split("\n").filter(Boolean);
const eolByPath = parseLsFilesEolZ(git(["ls-files", "--eol", "-z"]));

test("the table covers every merge file of the release being cut, in every locale", () => {
  const uncovered = deliveredSources({ manifest, sourceFiles: trackedFiles, eolByPath, read })
    .filter(({ content, rel }) => !(fingerprint(content) in (table.files?.[rel] ?? {})))
    .map(({ sourcePath }) => sourcePath);

  assert.deepEqual(
    uncovered,
    [],
    `bytes shipped by this release that no row recognises (regenerate: ${REGENERATE}): ${uncovered.join(", ")}`,
  );
});

test("the table names the version it was generated for", () => {
  // Without it, `since` on a row-2 match is a number nobody can trace back to a
  // release — and there is no other record of when the table was last refreshed.
  assert.match(table.generatedAt ?? "", /^v\d+\.\d+\.\d+/);
});

test("every row is keyed by a self-describing sha256 and carries both since and locale", () => {
  // `healProvenance` spreads the entry straight into what it reports to the owner:
  // a stray key would leak into that report, a missing one would print `undefined`.
  const malformed = Object.entries(table.files ?? {}).flatMap(([rel, versions]) =>
    Object.entries(versions)
      .filter(
        ([digest, entry]) =>
          !/^sha256:[0-9a-f]{64}$/.test(digest) ||
          typeof entry?.since !== "string" ||
          typeof entry?.locale !== "string" ||
          Object.keys(entry).length !== 2,
      )
      .map(([digest]) => `${rel} ${digest}`),
  );

  assert.deepEqual(malformed, [], `malformed rows: ${malformed.join(", ")}`);
});
