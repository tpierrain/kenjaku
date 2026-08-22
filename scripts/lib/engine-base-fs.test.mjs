import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { createHash } from "node:crypto";

import {
  readBaseTree,
  writeBaseEntries,
  readEngineDivergence,
  readInstalledMergeFiles,
  syncBaseTree,
  recordSourceProvenanceAndBase,
  rerecordEngineWrite,
} from "./engine-base-fs.mjs";
import { verifyBase } from "./engine-base.mjs";
import { reseedProvenance, selectMergeFiles } from "./engine-source.mjs";
import { listFilesRelPosix } from "./fs-walk.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// engine-base-fs — THE FS ORCHESTRATOR around the three pure planners of
// `engine-base.mjs` (plan S1). The planners answer WHERE a base lives, WHETHER it
// is provable, WHERE the first one comes from and WHEN it moves; nothing until now
// put a single byte on disk, so no brain has ever held a `.engine-base/` tree.
//
// This is the thin I/O that does, and the two places it is wired from: the install
// (seed the tree from the brain itself) and the update (advance what was delivered,
// then seed whatever the migration still owes).
//
// House pattern for an fs-touching lib module: real `node:fs` against a temp dir,
// no fake filesystem — a double that ignores its arguments certifies nothing, and
// this module's whole job IS its arguments reaching the disk.
// ═══════════════════════════════════════════════════════════════════════════

// The digest as `engine-source` records it, written HERE rather than imported, so a
// production change to the fingerprint shows up as a red test instead of moving both
// sides of the comparison at once.
const fp = (content) => "sha256:" + createHash("sha256").update(content).digest("hex");

function writeFile(root, rel, content) {
  const abs = join(root, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
}

const read = (root, rel) => readFileSync(join(root, rel), "utf8");

// Four `merge` families (the constitution, the allowlist, a skill subtree, an engine
// script) + one `replace` path, so "only merge files get a base" is discriminating.
const MANIFEST = {
  regimes: {
    replace: ["scripts/lib/**"],
    merge: ["CLAUDE.md", ".claude/settings.json", ".claude/skills/coach/**", "scripts/auto-commit.mjs"],
    local: [".engine-base/**"],
  },
};

function brain(t, files = {}) {
  const dir = mkdtempSync(join(tmpdir(), "sbg-base-fs-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const [rel, content] of Object.entries(files)) writeFile(dir, rel, content);
  return dir;
}

// ── readBaseTree — the tree as `verifyBase` needs to be told about it ──────────

test("readBaseTree — reads `.engine-base/<rel>` for each candidate, and reports a missing one as null (verifyBase's `absent`)", (t) => {
  const dir = brain(t, {
    ".engine-base/CLAUDE.md": "# the base constitution\n",
    ".engine-base/.claude/skills/coach/SKILL.md": "coach, as delivered\n",
  });

  const tree = readBaseTree({
    brainDir: dir,
    rels: [".claude/skills/coach/SKILL.md", "scripts/auto-commit.mjs", "CLAUDE.md"],
  });

  assert.deepEqual(tree, {
    "CLAUDE.md": "# the base constitution\n",
    ".claude/skills/coach/SKILL.md": "coach, as delivered\n",
    "scripts/auto-commit.mjs": null,
  });
});

test("readBaseTree — hands back the bytes AS THEY ARE, CRLF included (normalizing is verifyBase's job, not the reader's)", (t) => {
  const dir = brain(t, { ".engine-base/CLAUDE.md": "line\r\nand another\r\n" });

  assert.deepEqual(readBaseTree({ brainDir: dir, rels: ["CLAUDE.md"] }), {
    "CLAUDE.md": "line\r\nand another\r\n",
  });
});

// ── writeBaseEntries — the only writer of the tree ────────────────────────────

test("writeBaseEntries — creates the missing parent directories and returns every base path it wrote", (t) => {
  const dir = brain(t);

  const written = writeBaseEntries({
    brainDir: dir,
    entries: [
      { baseRel: ".engine-base/.claude/skills/coach/SKILL.md", content: "coach v1\n" },
      { baseRel: ".engine-base/CLAUDE.md", content: "constitution v1\n" },
    ],
  });

  assert.deepEqual(written, [".engine-base/.claude/skills/coach/SKILL.md", ".engine-base/CLAUDE.md"]);
  assert.equal(read(dir, ".engine-base/.claude/skills/coach/SKILL.md"), "coach v1\n");
  assert.equal(read(dir, ".engine-base/CLAUDE.md"), "constitution v1\n");
});

test("writeBaseEntries — an existing base entry is OVERWRITTEN whole (an advance replaces the ancestor, it does not append to it)", (t) => {
  const dir = brain(t, { ".engine-base/CLAUDE.md": "constitution v1, a much longer previous base\n" });

  writeBaseEntries({ brainDir: dir, entries: [{ baseRel: ".engine-base/CLAUDE.md", content: "v2\n" }] });

  assert.equal(read(dir, ".engine-base/CLAUDE.md"), "v2\n");
});

// ── readInstalledMergeFiles — the union's disk half ───────────────────────────

test("readInstalledMergeFiles — returns the brain's `merge` files with their exact bytes, and nothing else it holds", (t) => {
  const dir = brain(t, {
    "CLAUDE.md": "# mine\n",
    "scripts/auto-commit.mjs": "// auto-commit\n",
    "scripts/lib/engine-fetch.mjs": "// replace regime, not merge\n",
    "vault/a-note.md": "# Mollecuisse\n",
    ".engine-base/CLAUDE.md": "# the base itself, never a candidate\n",
  });

  assert.deepEqual(readInstalledMergeFiles({ brainDir: dir, manifest: MANIFEST }), {
    "CLAUDE.md": "# mine\n",
    "scripts/auto-commit.mjs": "// auto-commit\n",
  });
});

test("readInstalledMergeFiles — a `.new` SIDECAR is not a file this brain holds (found by S10-QA)", (t) => {
  // 🛑 MEASURED ON THE REAL v3.6.0 TREE, not imagined: a glob like `.claude/skills/**`
  // matches `SKILL.md.new` just as happily as `SKILL.md`. So every sidecar the engine
  // drops becomes a PHANTOM engine file the brain is "holding back" — it inflates the
  // divergence count and the session nudge names, to the owner, a file the engine itself
  // just created and that they have never seen.
  //
  // The sidecar is the engine's own scratch: it is loaded by nothing, it is not a file
  // the brain holds, and it must never be a candidate for a base either.
  const dir = brain(t, {
    ".claude/skills/coach/SKILL.md": "# coach, theirs\n",
    ".claude/skills/coach/SKILL.md.new": "# coach, the engine's newer version\n",
  });

  assert.deepEqual(readInstalledMergeFiles({ brainDir: dir, manifest: MANIFEST }), {
    ".claude/skills/coach/SKILL.md": "# coach, theirs\n",
  });
});

test("readInstalledMergeFiles — the ROOTED walk returns EXACTLY what walking the whole brain returned (S4-4c)", (t) => {
  // The contract this optimization may not change by one entry. The old shape walked
  // brainDir and filtered; the new one starts from the merge globs' static prefixes.
  // Every path a glob can match lives under that glob's own prefix, so the two sets are
  // equal — and this test is what says so with files on a real disk rather than by
  // argument.
  const dir = brain(t, {
    "CLAUDE.md": "# mine\n",
    ".claude/settings.json": "{}\n",
    ".claude/skills/coach/SKILL.md": "coach\n",
    ".claude/skills/coach/nested/deeper.md": "deep\n",
    ".claude/skills/lint/SKILL.md": "not a merge skill\n",
    "scripts/auto-commit.mjs": "// auto-commit\n",
    "scripts/lib/engine-fetch.mjs": "// replace regime\n",
    "vault/a-note.md": "# Mollecuisse\n",
    "vault/deep/nested/note.md": "# deeper\n",
    ".engine-base/CLAUDE.md": "# the base, never a candidate\n",
  });

  const rooted = readInstalledMergeFiles({ brainDir: dir, manifest: MANIFEST });
  const byFullWalk = Object.fromEntries(
    selectMergeFiles(MANIFEST, listFilesRelPosix(dir)).map((rel) => [rel, read(dir, rel)]),
  );

  assert.deepEqual(rooted, byFullWalk);
  // Pinned whole, so an equivalence that becomes "both return nothing" cannot pass.
  assert.deepEqual(rooted, {
    "CLAUDE.md": "# mine\n",
    ".claude/settings.json": "{}\n",
    ".claude/skills/coach/SKILL.md": "coach\n",
    ".claude/skills/coach/nested/deeper.md": "deep\n",
    "scripts/auto-commit.mjs": "// auto-commit\n",
  });
});

test("readInstalledMergeFiles — a manifest with NO `regimes` key at all costs nothing (it must not throw)", (t) => {
  // Condemned by the mutation pass: `manifest?.regimes?.merge` had never been fed a
  // manifest that parses but declares no regimes. It is reachable — `readEngineDivergence`
  // JSON.parses whatever is on disk, and `{}` is valid JSON — and a throw here escapes
  // that function's own try, so a truncated manifest would take down the update report
  // it was written to keep alive. `selectMergeFiles` has always been defensive about
  // exactly this shape; this call site was not.
  const dir = brain(t, { "CLAUDE.md": "# mine\n" });

  assert.deepEqual(readInstalledMergeFiles({ brainDir: dir, manifest: {} }), {});
});

test("readInstalledMergeFiles — a merge glob with no static prefix walks the WHOLE brain, vault included", (t) => {
  // The `[""]` answer from globRoots, end to end: there is no prefix to start from, so
  // honesty costs a full walk and the owner's notes ARE read. Kept as a test because it
  // is the one case where the optimization must give itself up rather than under-select.
  const dir = brain(t, { "CLAUDE.md": "# mine\n", "vault/a-note.md": "# Mollecuisse\n" });

  // `**.md`, not `**/*.md`: in this dialect `**` is "any run of characters including /",
  // so `**/*.md` still demands a literal slash and would never match `CLAUDE.md`. The
  // first draft of this test used it and was wrong about the repo's own glob dialect.
  assert.deepEqual(readInstalledMergeFiles({ brainDir: dir, manifest: { regimes: { merge: ["**.md"] } } }), {
    "CLAUDE.md": "# mine\n",
    "vault/a-note.md": "# Mollecuisse\n",
  });
});

test("readInstalledMergeFiles — the owner's notes are NOT read, proved by making them unreadable", (t) => {
  // The measurement that opened S4-4c: the old walk read every note in the vault to
  // look at files no merge glob can name (~2.3 µs each, 18.5 ms for 8 000 notes, at
  // every session start). A vault the process cannot enter is the one observation that
  // tells the two implementations apart on any fixture — the old one throws EACCES,
  // the new one never looks.
  if (process.platform === "win32" || process.getuid?.() === 0) {
    t.skip("needs POSIX permissions and a non-root user to be meaningful");
    return;
  }
  const dir = brain(t, { "CLAUDE.md": "# mine\n", "vault/a-note.md": "# Mollecuisse\n" });
  chmodSync(join(dir, "vault"), 0o000);
  try {
    assert.deepEqual(readInstalledMergeFiles({ brainDir: dir, manifest: MANIFEST }), { "CLAUDE.md": "# mine\n" });
  } finally {
    // Restored HERE, not in a `t.after`: `brain()` registered its own rmSync first, and
    // after-hooks run in registration order — so the cleanup would hit a directory it
    // still cannot enter, and the test would fail on ENOTEMPTY with the assertion green.
    chmodSync(join(dir, "vault"), 0o755);
  }
});

// ── syncBaseTree — the install shape: seed from the brain itself ──────────────

test("syncBaseTree — with nothing delivered, a brain seeds its whole tree from itself (the migration), and says exactly what it seeded", (t) => {
  const installed = {
    "CLAUDE.md": "# constitution as installed\n",
    ".claude/skills/coach/SKILL.md": "coach, as installed\n",
  };
  const dir = brain(t, { ...installed, "scripts/lib/engine-fetch.mjs": "// replace regime\n" });
  const provenance = {
    "CLAUDE.md": fp(installed["CLAUDE.md"]),
    ".claude/skills/coach/SKILL.md": fp(installed[".claude/skills/coach/SKILL.md"]),
  };

  const report = syncBaseTree({ brainDir: dir, manifest: MANIFEST, provenance });

  assert.deepEqual(report, {
    advanced: [],
    seeded: [".claude/skills/coach/SKILL.md", "CLAUDE.md"],
    deferred: [],
  });
  assert.equal(read(dir, ".engine-base/CLAUDE.md"), installed["CLAUDE.md"]);
  assert.equal(read(dir, ".engine-base/.claude/skills/coach/SKILL.md"), installed[".claude/skills/coach/SKILL.md"]);
  assert.equal(existsSync(join(dir, ".engine-base/scripts/lib/engine-fetch.mjs")), false, "a `replace` file has no base");
});

// ── syncBaseTree — the update shape: advance to what was DELIVERED ────────────

test("syncBaseTree — a delivered `merge` file's base becomes the DELIVERED bytes, never what happens to sit on disk", (t) => {
  // The installed file already moved on (an owner edit landing between the delivery and
  // this pass): the base must still describe what the engine handed over.
  const dir = brain(t, { "CLAUDE.md": "# edited since the delivery\n" });
  const delivered = "# constitution v2, as delivered\n";

  const report = syncBaseTree({
    brainDir: dir,
    manifest: MANIFEST,
    provenance: { "CLAUDE.md": fp(delivered) },
    deliveredFileMap: { "CLAUDE.md": delivered, "scripts/lib/engine-fetch.mjs": "// replace regime\n" },
  });

  assert.deepEqual(report, { advanced: ["CLAUDE.md"], seeded: [], deferred: [] });
  assert.equal(read(dir, ".engine-base/CLAUDE.md"), delivered);
  assert.equal(
    existsSync(join(dir, ".engine-base/scripts/lib/engine-fetch.mjs")),
    false,
    "a delivered `replace` file gets no base — the regime gates the tree as it gates provenance",
  );
});

test("syncBaseTree — a base that is present AND provable is left strictly alone, even beside an installed file that has drifted", (t) => {
  const ancestor = "# constitution as the engine delivered it\n";
  const dir = brain(t, {
    "CLAUDE.md": "# the owner rewrote this weeks ago\n",
    ".engine-base/CLAUDE.md": ancestor,
  });

  const report = syncBaseTree({
    brainDir: dir,
    manifest: MANIFEST,
    provenance: { "CLAUDE.md": fp(ancestor) },
  });

  assert.deepEqual(report, { advanced: [], seeded: [], deferred: [] });
  assert.equal(
    read(dir, ".engine-base/CLAUDE.md"),
    ancestor,
    "re-seeding a correct ancestor from an edited file is the one way this migration could destroy what it protects",
  );
});

test("syncBaseTree — what it cannot seed is NAMED, one reason per refusal, rather than passed over in silence", (t) => {
  const dir = brain(t, {
    "CLAUDE.md": "# the owner's own version\n",
    ".claude/settings.json": '{ "allow": ["Bash(open:*)"] }\n',
  });

  const report = syncBaseTree({
    brainDir: dir,
    manifest: MANIFEST,
    // CLAUDE.md: recorded, but the installed bytes hash elsewhere → the owner customized it.
    // settings.json: installed, never recorded → it entered no regime.
    // auto-commit.mjs: recorded, but the owner deleted the file → nothing to seed from.
    provenance: {
      "CLAUDE.md": fp("# what the engine delivered\n"),
      "scripts/auto-commit.mjs": fp("// auto-commit\n"),
    },
  });

  assert.deepEqual(report, {
    advanced: [],
    seeded: [],
    // Ordered by path, never by the directory walk that happened to find them: this
    // list is read by a human (and, from S4 on, said out loud to the owner).
    deferred: [
      { rel: ".claude/settings.json", reason: "no-provenance" },
      { rel: "CLAUDE.md", reason: "customized" },
      { rel: "scripts/auto-commit.mjs", reason: "not-installed" },
    ],
  });
  assert.equal(existsSync(join(dir, ".engine-base")), false, "nothing provable, nothing written");
});

test("syncBaseTree — a DRIFTED base is repaired from the installed file, and the tree never nests inside itself", (t) => {
  const delivered = "// auto-commit, as delivered\n";
  const dir = brain(t, {
    "scripts/auto-commit.mjs": delivered,
    ".engine-base/scripts/auto-commit.mjs": "// something else entirely\n",
  });

  const report = syncBaseTree({
    brainDir: dir,
    manifest: MANIFEST,
    provenance: { "scripts/auto-commit.mjs": fp(delivered) },
  });

  assert.deepEqual(report, { advanced: [], seeded: ["scripts/auto-commit.mjs"], deferred: [] });
  assert.equal(read(dir, ".engine-base/scripts/auto-commit.mjs"), delivered);
  assert.equal(existsSync(join(dir, ".engine-base/.engine-base")), false, "the base tree is not a candidate for a base");
});

// The fold that makes the two passes agree: a file this call just advanced is provable
// by the digest the ADVANCE computed, not by whatever record the caller was holding when
// it called. Without it, the seeding pass looks at a freshly-advanced base through a
// stale sha, calls it a mismatch, and reports the file as the owner's customization —
// the exact false positive this whole chantier exists to remove.
test("syncBaseTree — a file it JUST advanced is never re-seeded nor called customized, whatever record the caller handed in", (t) => {
  const previous = "// auto-commit v1\n";
  const delivered = "// auto-commit v2\n";
  const dir = brain(t, {
    "scripts/auto-commit.mjs": delivered,
    ".engine-base/scripts/auto-commit.mjs": previous,
  });

  const report = syncBaseTree({
    brainDir: dir,
    manifest: MANIFEST,
    provenance: { "scripts/auto-commit.mjs": fp(previous) }, // the record as it was BEFORE the re-seed
    deliveredFileMap: { "scripts/auto-commit.mjs": delivered },
  });

  assert.deepEqual(report, { advanced: ["scripts/auto-commit.mjs"], seeded: [], deferred: [] });
  assert.equal(read(dir, ".engine-base/scripts/auto-commit.mjs"), delivered);
});

test("syncBaseTree — its lists are ordered by PATH, not by the order the delivery and the record happened to be written in", (t) => {
  const autoCommit = "// auto-commit as delivered\n";
  const constitution = "# constitution as delivered\n";
  const dir = brain(t, { "scripts/auto-commit.mjs": autoCommit, "CLAUDE.md": constitution });

  const report = syncBaseTree({
    brainDir: dir,
    manifest: MANIFEST,
    // Both maps below are written in REVERSE path order, so a list that simply echoed its
    // input would come out backwards.
    provenance: {
      "scripts/auto-commit.mjs": fp(autoCommit),
      "CLAUDE.md": fp(constitution),
      ".claude/skills/coach/SKILL.md": fp("coach, once\n"),
      ".claude/settings.json": fp("{}\n"),
    },
    deliveredFileMap: { "scripts/auto-commit.mjs": autoCommit, "CLAUDE.md": constitution },
  });

  assert.deepEqual(report, {
    advanced: ["CLAUDE.md", "scripts/auto-commit.mjs"],
    seeded: [],
    deferred: [
      { rel: ".claude/settings.json", reason: "not-installed" },
      { rel: ".claude/skills/coach/SKILL.md", reason: "not-installed" },
    ],
  });
});

// ── The cross-check: one fact, two writers, and they must agree ───────────────
// The tree holds the bytes and the manifest holds their digest. They are computed by
// two independent code paths (`planBaseAdvance` here, `reseedProvenance` in the
// manifest writer beside it), so a divergence would show up only later, as the
// `mismatch` that makes a three-way merge pick the wrong ancestor. Asserted here
// instead: the tree this module wrote is PROVABLE against the record its neighbour wrote.
test("syncBaseTree — the tree it writes is provable against the provenance `reseedProvenance` records for the same delivery", (t) => {
  const dir = brain(t, { "CLAUDE.md": "# old\n", "scripts/auto-commit.mjs": "// old\n" });
  const deliveredFileMap = {
    "CLAUDE.md": "# constitution v2\r\n",
    "scripts/auto-commit.mjs": "// auto-commit v2\n",
    "scripts/lib/engine-fetch.mjs": "// replace regime\n",
  };
  const provenance = reseedProvenance({ priorProvenance: {}, manifest: MANIFEST, deliveredFileMap });

  syncBaseTree({ brainDir: dir, manifest: MANIFEST, provenance, deliveredFileMap });

  const tree = readBaseTree({ brainDir: dir, rels: ["CLAUDE.md", "scripts/auto-commit.mjs"] });
  const verdicts = Object.fromEntries(
    Object.entries(tree).map(([rel, baseContent]) => [rel, verifyBase({ recorded: provenance[rel], baseContent })]),
  );
  assert.deepEqual(verdicts, {
    "CLAUDE.md": { usable: true },
    "scripts/auto-commit.mjs": { usable: true },
  });
});

// ── The install composition root ──────────────────────────────────────────────

test("recordSourceProvenanceAndBase — one call records source + provenance AND lays down the base tree, so no install can ship without one", (t) => {
  const constitution = "# the personalized constitution\n";
  const dir = brain(t, {
    "CLAUDE.md": constitution,
    "scripts/lib/engine-fetch.mjs": "// replace regime\n",
    "engine-manifest.json": JSON.stringify(MANIFEST, null, 2) + "\n",
  });

  const enriched = recordSourceProvenanceAndBase({
    brainDir: dir,
    git: { repo: "https://example.test/launcher.git", tag: "v4.9.1", branch: "main", commit: "deadbeef" },
  });

  const persisted = JSON.parse(read(dir, "engine-manifest.json"));
  assert.deepEqual(persisted.source, { repo: "https://example.test/launcher.git", ref: "v4.9.1" });
  assert.deepEqual(persisted.provenance, { "CLAUDE.md": fp(constitution) });
  assert.deepEqual(enriched.provenance, persisted.provenance, "the caller is handed the manifest that was written");
  assert.equal(read(dir, ".engine-base/CLAUDE.md"), constitution);
});

// The `seeded` list's own ordering, which the two sibling lists' test could not reach.
// It takes a real collision to observe: the walk lists each DIRECTORY sorted, so its
// output is already sorted for ordinary paths — but `coach` sorts before `coach.md`
// among directory entries, while `coach.md` sorts before `coach/SKILL.md` as a whole
// path. A brain holding both hands this module its seeds out of order, and nothing but
// the sort puts them back.
test("syncBaseTree — the SEEDED list is ordered by path too, even where the directory walk is not", (t) => {
  const skill = "# the coach skill\n";
  const note = "# a stray note beside it\n";
  const dir = brain(t, { ".claude/skills/coach/SKILL.md": skill, ".claude/skills/coach.md": note });
  // A glob wide enough to cover BOTH, which the shared fixture's `coach/**` is not.
  const skillsWide = { regimes: { ...MANIFEST.regimes, merge: [".claude/skills/**"] } };

  const report = syncBaseTree({
    brainDir: dir,
    manifest: skillsWide,
    provenance: { ".claude/skills/coach/SKILL.md": fp(skill), ".claude/skills/coach.md": fp(note) },
    deliveredFileMap: {},
  });

  assert.deepEqual(report.seeded, [".claude/skills/coach.md", ".claude/skills/coach/SKILL.md"]);
});

// ── readEngineDivergence — the standing state, read off a real brain (S4-3) ────
// The pure verdict is `engine-divergence.mjs`'s and is tested there. What is this
// module's own is the pair of reads, and the FAIL-SOFT: it runs at the end of an
// update that has already succeeded and is already recorded, so a brain whose manifest
// cannot be parsed must cost the report a sentence, never turn a successful update into
// a thrown error.
// ⚠️ The held-back file here is an engine SKILL, not `CLAUDE.md`. Since F1 the owner's
// half of the constitution is exempt from this report by name (the `invited` regime the
// release declares — see engine-divergence.mjs), so a fixture built on it would pin the two reads against a
// list it can no longer appear in — green forever, and about nothing.
test("readEngineDivergence — names the held-back merge files of a real brain, with the version each last received", (t) => {
  const delivered = "# as the engine delivered it\n";
  const dir = brain(t, {
    ".claude/skills/coach/SKILL.md": delivered + "and the owner's own paragraph.\n",
    ".claude/settings.json": delivered,
    "scripts/lib/engine-fetch.mjs": "// a replace file the owner rewrote entirely\n",
    "engine-manifest.json":
      JSON.stringify({
        ...MANIFEST,
        provenance: { ".claude/skills/coach/SKILL.md": fp(delivered), ".claude/settings.json": fp(delivered) },
        baseRefs: { ".claude/skills/coach/SKILL.md": "v4.7.0", ".claude/settings.json": "v4.7.0" },
      }) + "\n",
  });

  assert.deepEqual(readEngineDivergence({ brainDir: dir }), [
    { rel: ".claude/skills/coach/SKILL.md", reason: "customized", since: "v4.7.0" },
  ]);
});

// 🚨 S5 (second pass of the v5.0.0 review) — ONE UNREADABLE FILE USED TO COST THE WHOLE
// ANSWER, AND NOBODY WAS TOLD.
//
// F7 made the update's own call site fail-soft, on the argument that the session nudge is
// a standing surface and "a line omitted once comes back on its own". It does not: that
// hook catches the identical throw and returns `{reported:false}`. So an unreadable merge
// file — a locked file, a bad umask, a sync client's placeholder — blanked the report on
// BOTH surfaces, and nothing distinguished "nothing held back" from "could not look".
//
// The repair is per FILE: the file that cannot be read is set aside, every other file is
// still judged, and the caller that asked for the list is handed the names.
test("readEngineDivergence — one unreadable merge file no longer costs the whole report", (t) => {
  if (process.platform === "win32" || process.getuid?.() === 0) {
    t.skip("needs POSIX permissions and a non-root user to be meaningful");
    return;
  }
  const delivered = "# as the engine delivered it\n";
  const dir = brain(t, {
    ".claude/skills/coach/SKILL.md": delivered + "and the owner's own paragraph.\n",
    ".claude/settings.json": delivered,
    "engine-manifest.json":
      JSON.stringify({
        ...MANIFEST,
        provenance: { ".claude/skills/coach/SKILL.md": fp(delivered), ".claude/settings.json": fp(delivered) },
        baseRefs: { ".claude/skills/coach/SKILL.md": "v4.7.0" },
      }) + "\n",
  });
  chmodSync(join(dir, ".claude", "settings.json"), 0o000);
  const unreadable = [];
  try {
    // The held-back file is STILL named — that is the half the swallow used to lose.
    assert.deepEqual(readEngineDivergence({ brainDir: dir, unreadable }), [
      { rel: ".claude/skills/coach/SKILL.md", reason: "customized", since: "v4.7.0" },
    ]);
    // And the one that could not be read is named to the caller that asked, rather than
    // silently absent from a list that reads as complete.
    assert.deepEqual(unreadable, [".claude/settings.json"]);
  } finally {
    chmodSync(join(dir, ".claude", "settings.json"), 0o644);
  }
});

// The collector is OPT-IN, and that is deliberate: `syncBaseTree` reads the same files to
// decide what to WRITE, and a seeder that quietly skipped a file it could not read would
// record an ancestor for a brain it never saw. A caller that does not ask to be told still
// gets the throw.
test("readInstalledMergeFiles — without a collector, an unreadable file still throws", (t) => {
  if (process.platform === "win32" || process.getuid?.() === 0) {
    t.skip("needs POSIX permissions and a non-root user to be meaningful");
    return;
  }
  const dir = brain(t, { "CLAUDE.md": "# mine\n" });
  chmodSync(join(dir, "CLAUDE.md"), 0o000);
  try {
    assert.throws(() => readInstalledMergeFiles({ brainDir: dir, manifest: MANIFEST }), /EACCES|EPERM/);
  } finally {
    chmodSync(join(dir, "CLAUDE.md"), 0o644);
  }
});

// ── rerecordEngineWrite — the record follows the engine's own write (F1 / F8) ──
// The install's twin of what the reconciler does through `reconciledFileMap`: the
// connectors step merges permissions into `.claude/settings.json` AFTER the provenance
// was recorded, so a brand-new brain was born diverged and nagged about a file it had
// never let anyone edit. The engine wrote it; the record has to say so.

const INSTALLED = '{\n  "mine": true\n}\n';

// A freshly-installed brain: its settings recorded, then rewritten by the engine.
function installedBrain(t, { settings = INSTALLED, ref = "v5.0.0" } = {}) {
  const dir = brain(t, {
    ".claude/settings.json": settings,
    "engine-manifest.json":
      JSON.stringify({
        ...MANIFEST,
        source: { repo: "https://example.test/launcher.git", ref },
        provenance: { ".claude/settings.json": fp(INSTALLED) },
        baseRefs: { ".claude/settings.json": ref },
      }) + "\n",
  });
  syncBaseTree({ brainDir: dir, manifest: MANIFEST, provenance: { ".claude/settings.json": fp(INSTALLED) } });
  return dir;
}

test("rerecordEngineWrite — a merge file the ENGINE rewrote is recorded, digest, version and bytes", (t) => {
  const dir = installedBrain(t);
  const merged = '{\n  "mine": true,\n  "permissions": { "allow": ["mcp__notion"] }\n}\n';
  writeFile(dir, ".claude/settings.json", merged);
  // Fail-first pole: with the record left behind, the brain claims the OWNER is holding
  // the file back — the fleet-wide false claim, in one file.
  assert.deepEqual(readEngineDivergence({ brainDir: dir }), [
    { rel: ".claude/settings.json", reason: "customized", since: "v5.0.0" },
  ]);

  assert.deepEqual(rerecordEngineWrite({ brainDir: dir, rels: [".claude/settings.json"] }), [
    ".claude/settings.json",
  ]);

  assert.deepEqual(readEngineDivergence({ brainDir: dir }), []);
  const manifest = JSON.parse(read(dir, "engine-manifest.json"));
  assert.equal(manifest.provenance[".claude/settings.json"], fp(merged));
  assert.equal(manifest.baseRefs[".claude/settings.json"], "v5.0.0");
  // The BYTES too, not only the digest: an ancestor left at the pre-write content would
  // hand the next three-way merge a common origin the file never had.
  assert.equal(read(dir, ".engine-base/.claude/settings.json"), merged);
});

test("rerecordEngineWrite — a path outside the merge regime is recorded by nothing", (t) => {
  const dir = installedBrain(t);
  writeFile(dir, "scripts/lib/engine-fetch.mjs", "// a replace file\n");

  assert.deepEqual(rerecordEngineWrite({ brainDir: dir, rels: ["scripts/lib/engine-fetch.mjs"] }), []);

  const manifest = JSON.parse(read(dir, "engine-manifest.json"));
  assert.deepEqual(Object.keys(manifest.provenance), [".claude/settings.json"], "a `replace` file carries no base, and gains none here");
  assert.equal(existsSync(join(dir, ".engine-base/scripts/lib/engine-fetch.mjs")), false);
});

test("rerecordEngineWrite — a file that is not on disk is not invented", (t) => {
  const dir = installedBrain(t);
  const before = read(dir, "engine-manifest.json");

  assert.deepEqual(rerecordEngineWrite({ brainDir: dir, rels: ["CLAUDE.md"] }), []);

  assert.equal(read(dir, "engine-manifest.json"), before, "nothing to record → the manifest is not even rewritten");
});

// A brain that records no version at all (installed from a branch, no tag): the digest
// still moves — it is what the divergence verdict is computed from — while `baseRefs`
// stays silent rather than inventing a version the file never came from.
test("rerecordEngineWrite — no recorded engine version: the digest moves, the version stays unknown", (t) => {
  const dir = brain(t, {
    ".claude/settings.json": INSTALLED,
    "engine-manifest.json": JSON.stringify({ ...MANIFEST, provenance: { ".claude/settings.json": fp(INSTALLED) } }) + "\n",
  });
  const merged = INSTALLED.replace("true", "false");
  writeFile(dir, ".claude/settings.json", merged);

  assert.deepEqual(rerecordEngineWrite({ brainDir: dir, rels: [".claude/settings.json"] }), [".claude/settings.json"]);

  const manifest = JSON.parse(read(dir, "engine-manifest.json"));
  assert.equal(manifest.provenance[".claude/settings.json"], fp(merged));
  assert.deepEqual(manifest.baseRefs, {}, "an unknown version is left unknown, never filled in from the running ref");
  assert.deepEqual(readEngineDivergence({ brainDir: dir }), []);
});

test("readEngineDivergence — a manifest it cannot read costs a sentence, never a thrown update", (t) => {
  const absent = brain(t, { "CLAUDE.md": "# no manifest at all\n" });
  assert.deepEqual(readEngineDivergence({ brainDir: absent }), []);

  const corrupt = brain(t, {
    "CLAUDE.md": "# a manifest that is not JSON\n",
    "engine-manifest.json": "{ this is not json",
  });
  assert.deepEqual(readEngineDivergence({ brainDir: corrupt }), []);
});
