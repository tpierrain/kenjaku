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
// What a WINDOWS brain recorded for the very same delivery — the CRLF form of the
// v3.6.0 blob. The planner cannot place it (no table row is CRLF), so it arrives here
// as a candidate list and this module is what proves which row it is.
const CRLF_ANCESTOR = "the engine shipped this at v3.6.0\r\n";
const SHA_ANCESTOR_CRLF = "sha256:61c9a16b626c7174448c9ecd50abed2ee0f75793fb8d428d6d250bdf667a1944";

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

// ── The Windows half of the fleet (W1 · plan § The DESIGN for (a)) ──────────
// A CRLF-recorded sha names no row, so the planner hands over the rel's rows instead
// of a tag. Proving WHICH row is the record is this module's job, and it is a
// membership proof: the row whose CRLF form digests to `recorded` IS what was
// delivered. Never derived from the installed bytes — those are the owner's.

const candidate = (over = {}) => ({
  rel: DOCTRINE,
  recorded: SHA_ANCESTOR_CRLF,
  candidates: [
    { tag: "v3.6.0", sourcePath: DOCTRINE },
    { tag: "v4.0.0", sourcePath: DOCTRINE },
  ],
  ...over,
});

test("fetchAncestors — a CANDIDATE list: the row whose CRLF form IS the record answers, and its CRLF bytes are written", (t) => {
  // 🚨 The pole CI fails on today, at the seam. And the bytes matter as much as the
  // hydration: the base must be WHAT WAS DELIVERED TO THAT BRAIN, and CRLF is what was
  // delivered. Writing the tag's LF blob would hand the merge an ancestor the brain
  // never held — provable against no record, and a `verifyBase` mismatch at the next pass.
  const brainDir = brain(t);
  const { git } = fakeGit({ [`v3.6.0:${DOCTRINE}`]: ANCESTOR, [`v4.0.0:${DOCTRINE}`]: IMPOSTOR });

  const result = fetchAncestors({ plan: [candidate()], sourceDir: SOURCE, brainDir, git });

  assert.deepEqual(result, { hydrated: [DOCTRINE], failed: [] });
  assert.equal(readFileSync(baseAt(brainDir, DOCTRINE), "utf8"), CRLF_ANCESTOR, "the CRLF form, not the LF blob");
});

test("fetchAncestors — the walk STOPS at the row that answers: the later candidates cost no show", (t) => {
  const brainDir = brain(t);
  const { git, calls } = fakeGit({ [`v3.6.0:${DOCTRINE}`]: ANCESTOR, [`v4.0.0:${DOCTRINE}`]: IMPOSTOR });

  fetchAncestors({ plan: [candidate()], sourceDir: SOURCE, brainDir, git });

  assert.deepEqual(calls, [
    ["-C", SOURCE, "fetch", "--depth", "1", "origin", "tag", "v3.6.0"],
    ["-C", SOURCE, "show", `v3.6.0:${DOCTRINE}`],
  ]);
});

test("fetchAncestors — a row further down the list still answers, and only it is written", (t) => {
  // The mirror of the test above: first-wins must not be first-only. A brain installed
  // at the newest release the table knows would otherwise never be repaired.
  const brainDir = brain(t);
  const { git, calls } = fakeGit({ [`v3.6.0:${DOCTRINE}`]: IMPOSTOR, [`v4.0.0:${DOCTRINE}`]: ANCESTOR });

  const result = fetchAncestors({ plan: [candidate()], sourceDir: SOURCE, brainDir, git });

  assert.deepEqual(result, { hydrated: [DOCTRINE], failed: [] });
  assert.equal(readFileSync(baseAt(brainDir, DOCTRINE), "utf8"), CRLF_ANCESTOR);
  assert.equal(calls.length, 4, "both tags fetched, both blobs shown, and no more");
});

test("fetchAncestors — a candidate list NOTHING can prove writes nothing at all, and says so", (t) => {
  // 🛑 THE negative pole of W1, and the whole risk of the change: loosening the lookup
  // must not loosen the PROOF. Neither row's raw bytes nor their CRLF form digests to
  // the record, so the file falls through to what it does today — preserved, with its
  // `.new` sidecar beside it — and no guess reaches `.engine-base/`.
  const brainDir = brain(t);
  const { git } = fakeGit({ [`v3.6.0:${DOCTRINE}`]: IMPOSTOR, [`v4.0.0:${DOCTRINE}`]: HOOK_ANCESTOR });

  const result = fetchAncestors({ plan: [candidate()], sourceDir: SOURCE, brainDir, git });

  assert.deepEqual(result, { hydrated: [], failed: [DOCTRINE] });
  assert.ok(!existsSync(baseAt(brainDir, DOCTRINE)), "not one byte was written");
});

test("fetchAncestors — a candidate list refuses a row whose CRLF form is not the record EITHER", (t) => {
  // The same refusal in the other EOL form: a tag that already hands back CRLF, whose
  // content is simply not what this brain holds. `crlfify` must not become a way for
  // any CRLF blob to pass.
  const brainDir = brain(t);
  const { git } = fakeGit({
    [`v3.6.0:${DOCTRINE}`]: IMPOSTOR.split("\n").join("\r\n"),
    [`v4.0.0:${DOCTRINE}`]: IMPOSTOR,
  });

  const result = fetchAncestors({ plan: [candidate()], sourceDir: SOURCE, brainDir, git });

  assert.deepEqual(result, { hydrated: [], failed: [DOCTRINE] });
  assert.ok(!existsSync(baseAt(brainDir, DOCTRINE)));
});

test("fetchAncestors — a candidate whose TAG cannot be fetched costs the next candidate nothing", (t) => {
  const brainDir = brain(t);
  const { git, calls } = fakeGit(
    { [`v4.0.0:${DOCTRINE}`]: ANCESTOR },
    { fetchFails: ["v3.6.0"] },
  );

  const result = fetchAncestors({ plan: [candidate()], sourceDir: SOURCE, brainDir, git });

  assert.deepEqual(result, { hydrated: [DOCTRINE], failed: [] });
  assert.deepEqual(calls, [
    ["-C", SOURCE, "fetch", "--depth", "1", "origin", "tag", "v3.6.0"],
    ["-C", SOURCE, "fetch", "--depth", "1", "origin", "tag", "v4.0.0"],
    ["-C", SOURCE, "show", `v4.0.0:${DOCTRINE}`],
  ], "a dead tag is skipped, not shown, and the walk goes on");
});

test("fetchAncestors — a candidate whose PATH is gone at that tag costs the next candidate nothing", (t) => {
  // The FR overlay is the real case: `templates/fr/<rel>` exists at some tags and not
  // at others, so a rel's rows genuinely disagree about which paths resolve.
  const brainDir = brain(t);
  const { git } = fakeGit(
    { [`v4.0.0:${DOCTRINE}`]: ANCESTOR },
    { showFails: [`v3.6.0:templates/fr/${DOCTRINE}`] },
  );

  const result = fetchAncestors({
    plan: [
      candidate({
        candidates: [
          { tag: "v3.6.0", sourcePath: `templates/fr/${DOCTRINE}` },
          { tag: "v4.0.0", sourcePath: DOCTRINE },
        ],
      }),
    ],
    sourceDir: SOURCE,
    brainDir,
    git,
  });

  assert.deepEqual(result, { hydrated: [DOCTRINE], failed: [] });
});

test("fetchAncestors — an existing `.engine-base/<rel>` stops a CANDIDATE entry too, before any git", (t) => {
  // The dangerous skip, on the new path. An existing base is the REAL ancestor;
  // replacing it with a row chosen on the strength of a historical digest swaps a fact
  // for a guess — and the guard must not have been written for the hit path alone.
  const brainDir = brain(t);
  mkdirSync(join(brainDir, ".engine-base"), { recursive: true });
  writeFileSync(baseAt(brainDir, DOCTRINE), "the real ancestor, already here\n");
  const { git, calls } = fakeGit({ [`v3.6.0:${DOCTRINE}`]: ANCESTOR });

  const result = fetchAncestors({ plan: [candidate()], sourceDir: SOURCE, brainDir, git });

  assert.deepEqual(result, { hydrated: [], failed: [] });
  assert.deepEqual(calls, [], "no tag was even fetched");
  assert.equal(readFileSync(baseAt(brainDir, DOCTRINE), "utf8"), "the real ancestor, already here\n");
});

test("fetchAncestors — a SELF-HEAL never walks candidates either", (t) => {
  // The safety guard, not an optimisation: on a self-heal the source IS the owner's
  // vault, whose `origin` is their personal backup. A candidate walk would point engine
  // machinery at it N times instead of once.
  const brainDir = brain(t);
  const { git, calls } = fakeGit({ [`v3.6.0:${DOCTRINE}`]: ANCESTOR });

  const result = fetchAncestors({ plan: [candidate()], sourceDir: brainDir, brainDir, git });

  assert.deepEqual(result, { hydrated: [], failed: [] });
  assert.deepEqual(calls, []);
});

test("fetchAncestors — one tag fetched ONCE, however many candidate entries name it", (t) => {
  // The memo spans entries and candidate lists alike: two Windows files recorded at the
  // same release must not cost two fetches of the same tag.
  const brainDir = brain(t);
  const { git, calls } = fakeGit({ [`v3.6.0:${DOCTRINE}`]: ANCESTOR, [`v3.6.0:${HOOK}`]: HOOK_ANCESTOR });

  fetchAncestors({
    plan: [
      candidate({ candidates: [{ tag: "v3.6.0", sourcePath: DOCTRINE }] }),
      candidate({
        rel: HOOK,
        recorded: "sha256:d8f5b1f63e36ab9422db05e8ee699bc93f85dd01155c9aefe410c0397a855112",
        candidates: [{ tag: "v3.6.0", sourcePath: HOOK }],
      }),
    ],
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
