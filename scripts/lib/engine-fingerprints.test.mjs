import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { fingerprint } from "./engine-source.mjs";
import { deliveredSources } from "./engine-fingerprint-table.mjs";
import { isStrayArtifactRel } from "./engine-base.mjs";
import { parseLsFilesEolZ } from "./tracked-files.mjs";
import { instrumentationStandDown } from "./instrumented-source.mjs";

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

test("the table covers every merge file of the release being cut, in every locale", (t) => {
  const delivered = deliveredSources({ manifest, sourceFiles: trackedFiles, eolByPath, read });

  // A fingerprint IS the bytes: under a mutation run the bytes on disk are the
  // runner's, not the release's, and every row would read as missing.
  const standDown = instrumentationStandDown(delivered.map(({ sourcePath, content }) => ({ name: sourcePath, source: content })));
  if (standDown) return t.skip(standDown);

  const uncovered = delivered
    .filter(({ content, rel }) => !(fingerprint(content) in (table.files?.[rel] ?? {})))
    .map(({ sourcePath }) => sourcePath);

  assert.deepEqual(
    uncovered,
    [],
    `bytes shipped by this release that no row recognises (regenerate: ${REGENERATE}): ${uncovered.join(", ")}`,
  );
});

// 🚨 THE SAFETY GUARANTEE FOR T6's STRAY-ARTIFACT FILTER, and it lives here because this
// is the only file that reads the release's OWN delivered rels.
//
// `isStrayArtifactRel` is a named list of editor / merge-tool / OS leftovers, and a named
// list is incomplete by construction. That is acceptable only because of WHICH WAY it
// fails: a missing pattern leaves the status quo (one more line in the session nudge),
// while a greedy one would silence a real held-back engine file — the exact defect the
// whole divergence surface exists to prevent.
//
// So the greedy direction is not left to judgement. Every rel this release actually ships
// under a `merge` glob, both locales, is run through the filter here: not one may be
// caught. Add a pattern that eats a real file and this goes red on the same commit.
test("no file this release DELIVERS is mistaken for an editor's leftover", () => {
  const caught = deliveredSources({ manifest, sourceFiles: trackedFiles, eolByPath, read })
    .map(({ rel }) => rel)
    .filter(isStrayArtifactRel);

  assert.deepEqual(caught, [], `the stray-artifact filter would silence real engine files: ${caught.join(", ")}`);
});

test("and it does catch what it is named after, on paths shaped like a real brain's", () => {
  // The other half, or the pole above passes just as well with an empty pattern list.
  // Spelled at the depth these actually appear at — beside a skill, not at the root —
  // because the OS-dropping patterns are anchored on a path separator.
  const strays = [
    ".claude/skills/coach/SKILL.md.bak",
    ".claude/skills/coach/SKILL.md.orig",
    ".claude/skills/coach/SKILL.md.rej",
    ".claude/skills/coach/SKILL.md~",
    ".claude/skills/coach/.SKILL.md.swp",
    ".claude/skills/coach/.DS_Store",
    ".claude/skills/coach/._SKILL.md",
    ".claude/skills/coach/Thumbs.db",
    ".claude/skills/coach/desktop.ini",
  ];
  assert.deepEqual(strays.filter(isStrayArtifactRel), strays);
});

test("a stray at the BRAIN'S ROOT is one too — the patterns anchor on a separator OR the start", () => {
  // The `^` arm of every OS pattern, which a mutation run found unreached: with only
  // `(\/)` they would all miss a dropping sitting at the top of the brain, beside
  // `CLAUDE.md` — which is exactly where Finder and Explorer leave theirs.
  const atRoot = [".DS_Store", "._CLAUDE.md", "Thumbs.db", "desktop.ini"];
  assert.deepEqual(atRoot.filter(isStrayArtifactRel), atRoot);
});

test("a name that merely CONTAINS one of those endings is an engine file, not a leftover", () => {
  // Every pattern is anchored at the END of the name, and nothing tested that until a
  // mutation run deleted all thirteen `$` with the suite green. It is the same shape T2's
  // coupling scanner was quietly wrong about: the boundary was a guess.
  //
  // These are the files an unanchored filter would silence — and silencing a real
  // held-back engine file is the one direction this list must never fail in.
  const real = [
    ".claude/skills/coach/SKILL.md.bak.md",
    ".claude/skills/coach/SKILL.md.orig.md",
    ".claude/skills/coach/SKILL.md.rej.md",
    ".claude/skills/coach/notes~2.md",
    ".claude/skills/coach/SKILL.md.swp.md",
    ".claude/skills/coach/.DS_Store.md",
    ".claude/skills/coach/Thumbs.db.md",
    ".claude/skills/coach/desktop.ini.md",
    // And the filter judges the FILE, never its ancestry: a directory whose name looks
    // like a dropping does not silence what somebody put inside it.
    ".claude/skills/._coach/SKILL.md",
  ];
  assert.deepEqual(real.filter(isStrayArtifactRel), []);
});

// 🚨 THE PREMISE GUARD FOR T4's CARVE-OUT, and it lives here because this is the only
// file that reads the SHIPPED table.
//
// `engine-ancestor.test.mjs` asserts that an `invited` file is never nominated for an
// ancestor fetch, and that assertion only means something if the table really does hold
// rows the planner would otherwise walk. The pole it replaced asserted the opposite —
// *"no published byte can name its tag"* — against a fixture with no such rows, and was
// green for a year of commits while the real table held five. **A test whose premise is
// supplied by its own fixture proves the fixture.**
//
// So the premise is measured against the real thing: the launcher's own install stub
// lives at `CLAUDE.md`, is folded like any other delivered file, and its rows are what
// make the carve-out load-bearing rather than decorative. The day this goes red, the
// carve-out is free and its poles have stopped discriminating — which is worth being told.
test("the shipped table really does hold rows for an INVITED rel, or the ancestor carve-out guards nothing", () => {
  const invited = manifest.regimes?.invited ?? [];
  assert.ok(invited.length > 0, "the shipped manifest must declare the invited family at all");

  const withRows = invited.filter((rel) => Object.keys(table.files?.[rel] ?? {}).length > 0);
  assert.deepEqual(
    withRows,
    invited,
    `an invited rel the table cannot place needs no carve-out — invited: ${invited.join(", ")}`,
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
