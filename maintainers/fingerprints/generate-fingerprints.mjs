#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// generate-fingerprints.mjs — writes `scripts/lib/engine-fingerprints.json`, the
// table that unfreezes the brains installed before v5.0.0 (plan S7-2 of
// maintainers/plans/prospective/v5-unfreezes-the-existing-fleet-action.md).
//
// Run it ONCE PER RELEASE, before cutting the tag:
//   node maintainers/fingerprints/generate-fingerprints.mjs --version v5.0.0
//
// It is the I/O shell and nothing else — every decision lives in the pure module
// `scripts/lib/engine-fingerprint-table.mjs`, where CI runs its tests. What happens
// here: enumerate the published tags, read each tree, fold, write.
//
// 🛑 THE TREES ARE READ UNDER **HEAD's** REGIME, NOT EACH TAG'S OWN. Measured over
// the 25 published tags: `CLAUDE.engine.md` was in NO regime at ANY of them — that
// IS the freeze this release exists to end. A generator that asks each tag "what did
// you call merge?" therefore reproduces the freeze inside the healing table itself
// (S7-0, Correction 2). Same cost, opposite result.
//
// 🛑 AND THE WORKING TREE IS FOLDED IN LAST, under `--version`. That is what absorbs
// row 2 (a brain holding the bytes of the release being cut is recognised like any
// other version), and it is what the freshness guard in
// `scripts/lib/engine-fingerprints.test.mjs` checks on every CI run.
//
// Lives under `maintainers/` on purpose: a dev-only prefix, never copied into a brain.
// ═══════════════════════════════════════════════════════════════════════════
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  selectFingerprintSources,
  deliveredSources,
  buildFingerprintTable,
} from "../../scripts/lib/engine-fingerprint-table.mjs";
import { parseLsFilesEolZ } from "../../scripts/lib/tracked-files.mjs";
import { parseSemverTag, compareSemverTags } from "../../scripts/lib/semver-tag.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUTPUT_REL = "scripts/lib/engine-fingerprints.json";

const git = (args) => execFileSync("git", args, { cwd: REPO_ROOT, encoding: "utf8" });

// A tag's tree, and a tag's file: `git show <tag>:<path>` is the only way to reach
// bytes that are not checked out, and the shallow clone the updater uses means old
// tags are never on a user's disk anyway — this runs on the maintainer's full clone.
const treeAt = (ref) =>
  git(["ls-tree", "-r", "--name-only", ref]).split("\n").filter(Boolean);
const readAt = (ref, path) => git(["show", `${ref}:${path}`]);

// The published set: `git tag --list` through the engine's own semver parser. The
// two non-semver tags (V1, V2) are the pre-history and carry no engine, so they are
// not "a version the engine ever published" and no installed brain can hold them.
function publishedTags() {
  // `compareSemverTags` orders PARSED tags, so parse once and carry the string:
  // ascending order is what makes `since` the earliest tag rather than a lexical
  // accident (v3.10.0 sorts before v3.2.0 as a string).
  return git(["tag", "--list"])
    .split("\n")
    .filter(Boolean)
    .map((tag) => ({ tag, parsed: parseSemverTag(tag) }))
    .filter(({ parsed }) => parsed)
    .sort((a, b) => compareSemverTags(a.parsed, b.parsed))
    .map(({ tag }) => tag);
}

function versionAt(manifest, ref, read, listing) {
  return {
    version: ref,
    files: selectFingerprintSources({ manifest, sourceFiles: listing }).map(
      ({ sourcePath, rel, locale }) => ({ rel, locale, content: read(sourcePath) }),
    ),
  };
}

function main(argv) {
  const at = argv.indexOf("--version");
  const version = at === -1 ? null : argv[at + 1];
  if (!version) {
    console.error(
      "usage: node maintainers/fingerprints/generate-fingerprints.mjs --version <the tag being cut>\n" +
        "The version is REQUIRED: it is the `since` of every byte-state this release ships first,\n" +
        "and there is no package.json to read it from.",
    );
    return 1;
  }

  // HEAD's manifest, HEAD's regime — read once, applied to every historical tree.
  const manifest = JSON.parse(readFileSync(join(REPO_ROOT, "engine-manifest.json"), "utf8"));

  const tags = publishedTags();
  const versions = tags.map((tag) =>
    versionAt(manifest, tag, (path) => readAt(tag, path), treeAt(tag)),
  );

  // The working tree LAST, so it only claims bytes no published tag shipped before.
  //
  // 🪟 And it is the ONE tree read off the disk rather than out of the object store,
  // so it is the one that can be CRLF: cut this release from a Windows clone and
  // every row it adds would be a digest no brain can ever hold. `deliveredSources`
  // folds what the installer WRITES instead of what the checkout holds — the same
  // function the freshness guard judges the result with.
  versions.push({
    version,
    files: deliveredSources({
      manifest,
      sourceFiles: git(["ls-files"]).split("\n").filter(Boolean),
      eolByPath: parseLsFilesEolZ(git(["ls-files", "--eol", "-z"])),
      read: (path) => readFileSync(join(REPO_ROOT, path), "utf8"),
    }),
  });

  const table = buildFingerprintTable({ generatedAt: version, versions });
  writeFileSync(join(REPO_ROOT, OUTPUT_REL), JSON.stringify(table, null, 2) + "\n");

  const rows = Object.values(table.files).reduce((n, v) => n + Object.keys(v).length, 0);
  console.log(
    `${OUTPUT_REL}: ${Object.keys(table.files).length} files, ${rows} distinct byte-states, ` +
      `over ${tags.length} published tags + ${version}.`,
  );
  return 0;
}

process.exitCode = main(process.argv.slice(2));
