import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { fetchAncestors } from "./engine-ancestor-fetch.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// engine-ancestor-fetch — the git shell behind the planner
// (plan S7-5-2 of v5-unfreezes-the-existing-fleet-action.md).
//
// The planner said WHICH ancestors are worth going to get. This goes and gets them,
// and it is the half where a mistake costs the owner their work: a wrong ancestor
// written into `.engine-base/` is not a failed fetch, it is a three-way merge that
// silently resolves against someone else's file. So the load-bearing test here is
// not "the bytes arrive" — it is **the bytes that do NOT match the recorded sha are
// never written**.
//
// Best effort, never blocking (Q1 of the design): with no git, no network, or a tag
// that has gone, every file simply falls through to the behaviour it has today
// (`preserve/customized` + a `.new` sidecar). This module can regress nothing.
//
// 🛑 The temp dir is per-test (`mkdtempSync` + `t.after`), never a sweep of the
// SHARED system temp dir. RESULTS.md's top box records what the other idiom cost:
// under parallel mutation workers it saw other processes' files, failed at random,
// and every score measured while it existed was inflated.
// ═══════════════════════════════════════════════════════════════════════════

const DOCTRINE = "CLAUDE.engine.md";
const HOOK = "scripts/auto-commit.mjs";

const ANCESTOR = "the engine shipped this at v3.6.0\n";
const ANCESTOR_FR = "le moteur a livre ceci en v3.6.0\n";
const HOOK_ANCESTOR = "the hook as it shipped at v4.9.1\n";
const IMPOSTOR = "bytes from some other version entirely\n";

// Computed OUTSIDE this codebase (`shasum -a 256`), never through `fingerprint()`:
// a fixture produced by the code under test proves only that it agrees with itself.
const SHA_ANCESTOR = "sha256:a51f2a59d5c2b2e0e0c9d2c57182108ab36930d8f87f3b9cd6d2a972df17388d";
const SHA_ANCESTOR_FR = "sha256:7ed4b3b8b7bd8172e14af755a83a93bcc42e353d3a68afe869ada0bfe37dfcfa";
const SHA_HOOK = "sha256:65625d1b36eb737ae519e6792f762f3bd98600b0d625eb89b12fae87ff7c8d08";

const SOURCE = "/tmp/sbg-source-clone";

const entry = (over = {}) => ({
  rel: DOCTRINE,
  tag: "v3.6.0",
  sourcePath: DOCTRINE,
  recorded: SHA_ANCESTOR,
  ...over,
});

// A git that answers from a table of `"<tag>:<path>"` → content, and records every
// invocation whole. The recorded argv is the fingerprint: `-C <dir>` missing would
// run in the process's own directory, and that is invisible from a return value.
const fakeGit = (blobs = {}, { fetchFails = [], showFails = [] } = {}) => {
  const calls = [];
  const git = (args) => {
    calls.push(args);
    if (args[2] === "fetch") return { out: "", ok: !fetchFails.includes(args[args.length - 1]) };
    const spec = args[3];
    if (showFails.includes(spec)) return { out: "fatal: path does not exist", ok: false };
    return { out: blobs[spec] ?? "", ok: true };
  };
  return { git, calls };
};

const brain = (t) => {
  const dir = mkdtempSync(join(tmpdir(), "sbg-ancestor-fetch-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
};

const baseAt = (dir, rel) => join(dir, ".engine-base", rel);

// ── The load-bearing refusal ────────────────────────────────────────────────

test("fetchAncestors — bytes that do NOT match the recorded sha are NEVER written", (t) => {
  // 🛑 THE test of this module. `verifyBase` downstream would reject these too, but by
  // then they would be PERSISTED as a false ancestor — and a false ancestor is exactly
  // how an update discards an owner's edit while reporting success. The check belongs
  // at the fetch site, before a byte reaches the disk.
  const brainDir = brain(t);
  const { git, calls } = fakeGit({ [`v3.6.0:${DOCTRINE}`]: IMPOSTOR });

  const result = fetchAncestors({ plan: [entry()], sourceDir: SOURCE, brainDir, git });

  assert.deepEqual(result, { hydrated: [], failed: [DOCTRINE] });
  assert.equal(existsSync(baseAt(brainDir, DOCTRINE)), false, "nothing is written");
  assert.equal(calls.length, 2, "and it did try — fetch then show");
});

test("fetchAncestors — a verified file IS written, and its neighbour's impostor bytes are not", (t) => {
  // Best effort is PER FILE: one bad blob must not cost the other its ancestor.
  const brainDir = brain(t);
  const { git } = fakeGit({
    [`v3.6.0:${DOCTRINE}`]: IMPOSTOR,
    [`v3.6.0:${HOOK}`]: HOOK_ANCESTOR,
  });

  const result = fetchAncestors({
    plan: [entry(), entry({ rel: HOOK, sourcePath: HOOK, recorded: SHA_HOOK })],
    sourceDir: SOURCE,
    brainDir,
    git,
  });

  assert.deepEqual(result, { hydrated: [HOOK], failed: [DOCTRINE] });
  assert.equal(readFileSync(baseAt(brainDir, HOOK), "utf8"), HOOK_ANCESTOR);
  assert.equal(existsSync(baseAt(brainDir, DOCTRINE)), false);
});

// ── The invocation, asserted whole ──────────────────────────────────────────

test("fetchAncestors — the exact git argv: `-C <sourceDir>`, the explicit tag refspec, then show", (t) => {
  // Asserted WHOLE, not sampled. `-C <dir>` is mandatory (`buildGitInvocation` sets no
  // `cwd`, so a bare fetch runs wherever the process happens to be), and the explicit
  // `tag <tag>` refspec is required because the clone's `--single-branch` narrowed
  // `remote.origin.fetch` to the cloned ref alone.
  const brainDir = brain(t);
  const { git, calls } = fakeGit({ [`v3.6.0:${DOCTRINE}`]: ANCESTOR });

  fetchAncestors({ plan: [entry()], sourceDir: SOURCE, brainDir, git });

  assert.deepEqual(calls, [
    ["-C", SOURCE, "fetch", "--depth", "1", "origin", "tag", "v3.6.0"],
    ["-C", SOURCE, "show", `v3.6.0:${DOCTRINE}`],
  ]);
});

test("fetchAncestors — the bytes land at `.engine-base/<rel>`, byte-identical", (t) => {
  const brainDir = brain(t);
  const { git } = fakeGit({ [`v3.6.0:${DOCTRINE}`]: ANCESTOR });

  const result = fetchAncestors({ plan: [entry()], sourceDir: SOURCE, brainDir, git });

  assert.deepEqual(result, { hydrated: [DOCTRINE], failed: [] });
  assert.equal(readFileSync(baseAt(brainDir, DOCTRINE), "utf8"), ANCESTOR);
});

test("fetchAncestors — the planner's sourcePath is used VERBATIM, so a French brain reads the FR tree", (t) => {
  // The locale decision was made once, by the planner, off the same table lookup that
  // gave the tag. Re-deriving the path here would be a second spelling of it, free to
  // drift — and both of the owner's real brains are French.
  const brainDir = brain(t);
  const frPath = `templates/fr/${DOCTRINE}`;
  const { git, calls } = fakeGit({ [`v3.6.0:${frPath}`]: ANCESTOR_FR });

  const result = fetchAncestors({
    plan: [entry({ sourcePath: frPath, recorded: SHA_ANCESTOR_FR })],
    sourceDir: SOURCE,
    brainDir,
    git,
  });

  assert.deepEqual(result, { hydrated: [DOCTRINE], failed: [] });
  assert.deepEqual(calls[1], ["-C", SOURCE, "show", `v3.6.0:${frPath}`]);
  // 🛑 And it lands under the INSTALLED rel, not the source path: the brain has no
  // `templates/` tree, and a base filed there would be invisible to the merge.
  assert.equal(readFileSync(baseAt(brainDir, DOCTRINE), "utf8"), ANCESTOR_FR);
});

test("fetchAncestors — a blob whose line endings were rewritten still matches its record", (t) => {
  // The same forgiveness `verifyBase` grants, and for the same reason: the recorded sha
  // was taken on the LF bytes the engine delivered, and a checkout can hand back CRLF.
  // Without this, a whole platform fetches ancestors and then throws them away.
  const brainDir = brain(t);
  const crlf = ANCESTOR.split("\n").join("\r\n");
  const { git } = fakeGit({ [`v3.6.0:${DOCTRINE}`]: crlf });

  const result = fetchAncestors({ plan: [entry()], sourceDir: SOURCE, brainDir, git });

  assert.deepEqual(result, { hydrated: [DOCTRINE], failed: [] });
  assert.equal(readFileSync(baseAt(brainDir, DOCTRINE), "utf8"), crlf, "written as git gave them");
});

// ── One fetch per distinct tag ──────────────────────────────────────────────

test("fetchAncestors — two files at the SAME tag cost ONE fetch and two shows", (t) => {
  const brainDir = brain(t);
  const { git, calls } = fakeGit({
    [`v3.6.0:${DOCTRINE}`]: ANCESTOR,
    [`v3.6.0:${HOOK}`]: HOOK_ANCESTOR,
  });

  fetchAncestors({
    plan: [entry(), entry({ rel: HOOK, sourcePath: HOOK, recorded: SHA_HOOK })],
    sourceDir: SOURCE,
    brainDir,
    git,
  });

  assert.deepEqual(calls, [
    ["-C", SOURCE, "fetch", "--depth", "1", "origin", "tag", "v3.6.0"],
    ["-C", SOURCE, "show", `v3.6.0:${DOCTRINE}`],
    ["-C", SOURCE, "show", `v3.6.0:${HOOK}`],
  ]);
});

test("fetchAncestors — two DISTINCT tags cost one fetch each", (t) => {
  const brainDir = brain(t);
  const { git, calls } = fakeGit({
    [`v3.6.0:${DOCTRINE}`]: ANCESTOR,
    [`v4.9.1:${HOOK}`]: HOOK_ANCESTOR,
  });

  const result = fetchAncestors({
    plan: [entry(), entry({ rel: HOOK, tag: "v4.9.1", sourcePath: HOOK, recorded: SHA_HOOK })],
    sourceDir: SOURCE,
    brainDir,
    git,
  });

  assert.deepEqual(result, { hydrated: [DOCTRINE, HOOK], failed: [] });
  assert.deepEqual(
    calls.filter((c) => c[2] === "fetch"),
    [
      ["-C", SOURCE, "fetch", "--depth", "1", "origin", "tag", "v3.6.0"],
      ["-C", SOURCE, "fetch", "--depth", "1", "origin", "tag", "v4.9.1"],
    ],
  );
});

// ── Best effort: every way it can fail, and none of them throws ─────────────

test("fetchAncestors — a fetch that fails costs its files, and NO show is attempted for that tag", (t) => {
  // The whole point of one-fetch-per-tag: when the tag never arrived, asking for its
  // blobs is N pointless subprocesses, each one certain to fail.
  const brainDir = brain(t);
  const { git, calls } = fakeGit({}, { fetchFails: ["v3.6.0"] });

  const result = fetchAncestors({
    plan: [entry(), entry({ rel: HOOK, sourcePath: HOOK, recorded: SHA_HOOK })],
    sourceDir: SOURCE,
    brainDir,
    git,
  });

  assert.deepEqual(result, { hydrated: [], failed: [DOCTRINE, HOOK] });
  assert.deepEqual(calls, [["-C", SOURCE, "fetch", "--depth", "1", "origin", "tag", "v3.6.0"]]);
});

test("fetchAncestors — a failed tag does not cost the OTHER tag's files", (t) => {
  const brainDir = brain(t);
  const { git } = fakeGit({ [`v4.9.1:${HOOK}`]: HOOK_ANCESTOR }, { fetchFails: ["v3.6.0"] });

  const result = fetchAncestors({
    plan: [entry(), entry({ rel: HOOK, tag: "v4.9.1", sourcePath: HOOK, recorded: SHA_HOOK })],
    sourceDir: SOURCE,
    brainDir,
    git,
  });

  assert.deepEqual(result, { hydrated: [HOOK], failed: [DOCTRINE] });
});

test("fetchAncestors — a show that fails costs only its own file", (t) => {
  const brainDir = brain(t);
  const { git } = fakeGit(
    { [`v3.6.0:${HOOK}`]: HOOK_ANCESTOR },
    { showFails: [`v3.6.0:${DOCTRINE}`] },
  );

  const result = fetchAncestors({
    plan: [entry(), entry({ rel: HOOK, sourcePath: HOOK, recorded: SHA_HOOK })],
    sourceDir: SOURCE,
    brainDir,
    git,
  });

  assert.deepEqual(result, { hydrated: [HOOK], failed: [DOCTRINE] });
  assert.equal(existsSync(baseAt(brainDir, DOCTRINE)), false);
});

// ── The two silences ────────────────────────────────────────────────────────

test("fetchAncestors — an empty plan touches git NOT AT ALL", (t) => {
  // A brain that needs no ancestor must not pay a network round-trip to discover it,
  // and `update-engine` runs on every session of every brain.
  const brainDir = brain(t);
  const { git, calls } = fakeGit();

  assert.deepEqual(fetchAncestors({ plan: [], sourceDir: SOURCE, brainDir, git }), {
    hydrated: [],
    failed: [],
  });
  assert.deepEqual(calls, []);
});

test("fetchAncestors — a SELF-HEAL never fetches: sourceDir === brainDir stops it dead", (t) => {
  // 🚨 SAFETY, not optimisation. On a SessionStart self-heal the source IS the brain,
  // and the brain is a git repo — the OWNER'S vault, whose `origin` is their personal
  // backup. `git fetch origin tag …` there would point engine machinery at a private
  // repository. The guard lives HERE, at the one place that spawns git, rather than in
  // the caller that must remember.
  const brainDir = brain(t);
  const { git, calls } = fakeGit({ [`v3.6.0:${DOCTRINE}`]: ANCESTOR });

  const result = fetchAncestors({ plan: [entry()], sourceDir: brainDir, brainDir, git });

  // `failed` is EMPTY, deliberately: nothing was attempted, so the report has nothing
  // to say. A self-healing brain must not be told a fetch it never wanted went wrong.
  assert.deepEqual(result, { hydrated: [], failed: [] });
  assert.deepEqual(calls, []);
  assert.equal(existsSync(baseAt(brainDir, DOCTRINE)), false);
});

// ── Shape ───────────────────────────────────────────────────────────────────

test("fetchAncestors — an existing `.engine-base/<rel>` is left untouched", (t) => {
  // The planner already excludes holes-that-are-not-holes, so this is the second
  // opinion on the same rule: the REAL recorded ancestor is never overwritten by bytes
  // fetched on the strength of a historical digest. Here the plan is wrong on purpose.
  const brainDir = brain(t);
  mkdirSync(join(brainDir, ".engine-base"), { recursive: true });
  writeFileSync(baseAt(brainDir, DOCTRINE), "the REAL ancestor, already on disk\n");
  const { git, calls } = fakeGit({ [`v3.6.0:${DOCTRINE}`]: ANCESTOR });

  const result = fetchAncestors({ plan: [entry()], sourceDir: SOURCE, brainDir, git });

  assert.deepEqual(result, { hydrated: [], failed: [] }, "not a failure — there was nothing to do");
  assert.equal(readFileSync(baseAt(brainDir, DOCTRINE), "utf8"), "the REAL ancestor, already on disk\n");
  assert.deepEqual(calls, [], "and no git was spawned for it");
});
