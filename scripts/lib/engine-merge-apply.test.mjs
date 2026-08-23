import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";

import { applyMergeGoverned } from "./engine-merge-apply.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// engine-merge-apply — the GROUP-AGNOSTIC carrier of S2's verdict to the disk
// (plan S2b-1). It was `refreshUntouchedSkills`'s inner loop, extracted the day a
// SECOND client appeared: the four engine scripts (S2b), and the constitution
// after them (S2c). What it owns is the journey — read the three sides, ask
// `mergeVerdict`, write, record what was DELIVERED, drop or clear the sidecar,
// classify — and nothing about what kind of file it is carrying.
//
// The nine verdict ROWS are `engine-merge.test.mjs`'s subject and are not
// re-litigated here; the skills' end-to-end proof stays in
// `engine-skill-refresh.test.mjs`. What is tested HERE is what only this module
// decides: grouping, the (installed ← source) pairing, the self-heal guard, and
// the four ways bytes do or do not reach the disk.
//
// Real `node:fs` against temp dirs, real git for the merges: a double that
// ignores its arguments certifies nothing, and this module's whole job IS its
// arguments reaching the disk.
// ═══════════════════════════════════════════════════════════════════════════

const fp = (content) => "sha256:" + createHash("sha256").update(content).digest("hex");

const BASE = "# doc\n\nthe intro paragraph\n\nthe body paragraph\n";
const OWNER = "# doc\n\nthe intro paragraph, extended by the owner\n\nthe body paragraph\n";
const ENGINE = "# doc\n\nthe intro paragraph\n\nthe body paragraph\n\n## A section the engine added\n\nnew\n";
const MERGED = "# doc\n\nthe intro paragraph, extended by the owner\n\nthe body paragraph\n\n## A section the engine added\n\nnew\n";
const CLASHING = "# doc\n\nthe intro paragraph, rewritten by the engine\n\nthe body paragraph\n";

function writeInto(root, rel, content) {
  const abs = join(root, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
  return abs;
}

// Two real trees. `sourceDir === brainDir` is the SessionStart self-heal guard,
// so they must never be the same directory unless a test is asserting the guard.
function trees(t) {
  const brainDir = mkdtempSync(join(tmpdir(), "sbg-apply-brain-"));
  const sourceDir = mkdtempSync(join(tmpdir(), "sbg-apply-src-"));
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  return { brainDir, sourceDir };
}

const onDisk = (root, rel) => readFileSync(join(root, rel), "utf8");
const pairOf = (rel) => ({ rel, sourceRel: rel });
const byPath = (rel) => rel;

// ── What this module exists to have: a caller that groups per FILE ───────────

// The skills group per subtree; the four engine scripts are each their own
// subject, so their `groupOf` is the path itself. Nothing in this module may
// assume a grouping, and this is the case the extraction was performed for: two
// files that a skill would have named ONCE are named twice here.
test("groupOf decides the report's granularity — one entry per file when it says so", (t) => {
  const { brainDir, sourceDir } = trees(t);
  const rels = ["scripts/auto-commit.mjs", "scripts/auto-push.mjs"];
  for (const rel of rels) {
    writeInto(brainDir, rel, BASE);
    writeInto(sourceDir, rel, ENGINE);
  }

  const report = applyMergeGoverned({
    brainDir,
    sourceDir,
    sourceFiles: rels,
    pairs: rels.map(pairOf),
    provenance: Object.fromEntries(rels.map((rel) => [rel, fp(BASE)])),
    groupOf: byPath,
  });

  assert.deepEqual(report.refreshed, ["scripts/auto-commit.mjs", "scripts/auto-push.mjs"]);
  assert.deepEqual(report.deliveredFileMap, { "scripts/auto-commit.mjs": ENGINE, "scripts/auto-push.mjs": ENGINE });
});

// The mirror image, and the invariant a mutation run has already caught losing
// once: dedup is on "have I said THIS group", never on "have I said anything".
// The second form silences every entry after the first, which is the one failure
// an owner cannot recover from — they resolve one file and never learn the rest
// exist. Asserted on all four lists, because each keeps its own and can lose it
// alone.
test("a group named by two files is reported once, and a DIFFERENT group is still reported", (t) => {
  const { brainDir, sourceDir } = trees(t);
  const groupOf = (rel) => rel.split("/")[1];
  const first = ["pack/a/one.md", "pack/a/two.md"];
  const second = ["pack/b/one.md"];
  const all = [...first, ...second];
  const provenance = Object.fromEntries(all.map((rel) => [rel, fp(BASE)]));
  const run = (candidate, installed) => {
    for (const rel of all) {
      writeInto(brainDir, rel, installed);
      writeInto(brainDir, `.engine-base/${rel}`, BASE);
      writeInto(sourceDir, rel, candidate);
    }
    return applyMergeGoverned({
      brainDir,
      sourceDir,
      sourceFiles: all,
      pairs: all.map(pairOf),
      provenance,
      groupOf,
    });
  };

  assert.deepEqual(run(ENGINE, BASE).refreshed, ["a", "b"], "refreshed");
  assert.deepEqual(run(ENGINE, OWNER).merged, ["a", "b"], "merged");
  assert.deepEqual(
    run(CLASHING, OWNER).conflicts,
    [
      { name: "a", newVersionPath: "pack/a/one.md.new" },
      { name: "b", newVersionPath: "pack/b/one.md.new" },
    ],
    "conflicts",
  );
  // No ancestor on disk for this last one: written nowhere, so every file
  // degrades to `preserve: customized` and the same dedup must hold there too.
  const brainless = trees(t);
  for (const rel of all) {
    writeInto(brainless.brainDir, rel, OWNER);
    writeInto(brainless.sourceDir, rel, ENGINE);
  }
  const preserved = applyMergeGoverned({
    brainDir: brainless.brainDir,
    sourceDir: brainless.sourceDir,
    sourceFiles: all,
    pairs: all.map(pairOf),
    provenance,
    groupOf,
  });
  assert.deepEqual(preserved.preserved, [
    { name: "a", reason: "customized", newVersionPath: "pack/a/one.md.new" },
    { name: "b", reason: "customized", newVersionPath: "pack/b/one.md.new" },
  ]);
});

// ── The pairing: where it is READ is not where it LIVES ──────────────────────

// A staged skill ships at `engine-skills/<name>/…` and is installed at
// `.claude/skills/<name>/…`; a locale-owned file ships elsewhere again. So every
// path this module derives — the ancestor, the sidecar, the delivered key, the
// provenance lookup — hangs off the INSTALLED rel, and only the candidate's bytes
// come from the source rel. Getting that backwards writes the engine's tree.
test("the candidate comes from sourceRel; everything else hangs off rel", (t) => {
  const { brainDir, sourceDir } = trees(t);
  const rel = ".claude/skills/lint/SKILL.md";
  const sourceRel = "engine-skills/lint/SKILL.md";
  writeInto(brainDir, rel, OWNER);
  writeInto(brainDir, `.engine-base/${rel}`, BASE);
  writeInto(sourceDir, sourceRel, ENGINE);

  const report = applyMergeGoverned({
    brainDir,
    sourceDir,
    sourceFiles: [sourceRel],
    pairs: [{ rel, sourceRel }],
    provenance: { [rel]: fp(BASE) },
    groupOf: byPath,
  });

  assert.equal(onDisk(brainDir, rel), MERGED, "the merge happened at the INSTALLED path");
  assert.deepEqual(report.merged, [rel]);
  assert.deepEqual(report.deliveredFileMap, { [rel]: ENGINE }, "keyed on rel, and carrying what the ENGINE sent");
  assert.ok(!existsSync(join(brainDir, sourceRel)), "the source path is never created inside the brain");
});

// ── The guard that makes a SessionStart self-heal harmless ───────────────────

// Self-heal passes the brain as its own source: no new content, and nobody asked
// for anything. A file is only ever rewritten during an update the owner
// explicitly requested. Asserted on the DISK, not just on the report — a report
// that says nothing while bytes moved is the worst of both.
//
// ⚠️ This is the one case in this file that CANNOT be red before the module
// exists: a contract of "do nothing" is satisfied by a skeleton that does
// nothing. What judges it is the mutation run — drop the guard and the brain
// reads itself as its own candidate, which lands `preserve: customized` in the
// report and overwrites the sidecar below with the owner's own bytes. Both
// assertions catch that; neither would catch it if they only counted files.
const STALE_SIDECAR = "a claim left by a previous run\n";
test("sourceDir === brainDir writes nothing and reports nothing", (t) => {
  const { brainDir } = trees(t);
  const rel = "scripts/auto-commit.mjs";
  writeInto(brainDir, rel, OWNER);
  writeInto(brainDir, `${rel}.new`, STALE_SIDECAR);
  const long_ago = new Date("2020-01-01T00:00:00Z");
  utimesSync(join(brainDir, rel), long_ago, long_ago);

  const report = applyMergeGoverned({
    brainDir,
    sourceDir: brainDir,
    sourceFiles: [rel],
    pairs: [pairOf(rel)],
    provenance: { [rel]: fp(BASE) },
    groupOf: byPath,
  });

  assert.deepEqual(report, { refreshed: [], preserved: [], merged: [], conflicts: [], deliveredFileMap: {} });
  assert.equal(statSync(join(brainDir, rel)).mtimeMs, long_ago.getTime(), "the file was not even rewritten");
  assert.equal(onDisk(brainDir, `${rel}.new`), STALE_SIDECAR, "not even the stale sidecar is swept: nobody asked");
});

// 🛑 T8 — AND THE SPELLING. This door was the ONLY one of four that normalized, and
// nothing here said so: swap its guard for a raw string comparison and every test in
// this file stays green. A rule that survives only in the copy that happened to be
// correct is not a rule. `<brainDir>/` is what a `--sourceDir` flag with one typed
// trailing slash produces, and past this guard the brain becomes its own merge
// candidate — `preserve: customized`, and the owner's sidecar overwritten with their
// own bytes.
test("T8 — a self-heal spelled with a trailing separator writes nothing either", (t) => {
  const { brainDir } = trees(t);
  const rel = "scripts/auto-commit.mjs";

  // `basename`, NOT `split("/").pop()` — see the twin note in skill-retirement-fs.test.mjs:
  // a Windows tmpdir has no `/` in it, so the split hands back the whole absolute path.
  for (const sourceDir of [`${brainDir}/`, `${brainDir}/.`, join(brainDir, "..", basename(brainDir))]) {
    writeInto(brainDir, rel, OWNER);
    writeInto(brainDir, `${rel}.new`, STALE_SIDECAR);

    const report = applyMergeGoverned({
      brainDir,
      sourceDir,
      sourceFiles: [rel],
      pairs: [pairOf(rel)],
      provenance: { [rel]: fp(BASE) },
      groupOf: byPath,
    });

    assert.deepEqual(
      report,
      { refreshed: [], preserved: [], merged: [], conflicts: [], deliveredFileMap: {} },
      `spelled ${sourceDir}`,
    );
    assert.equal(onDisk(brainDir, `${rel}.new`), STALE_SIDECAR, `spelled ${sourceDir}, the sidecar was swept`);
  }
});

// ── The four ways bytes do, or do not, reach the disk ────────────────────────

// A file the brain does not have at all: the engine delivers it, parent
// directories and all. This is how a file a release ADDS under an
// already-installed subtree reaches a brain — install-if-absent decides one level
// up and is blind to it.
test("a file absent from the brain is created, with its parent directories", (t) => {
  const { brainDir, sourceDir } = trees(t);
  const rel = ".claude/skills/coach/references/deep/notes.md";
  writeInto(sourceDir, rel, ENGINE);

  const report = applyMergeGoverned({
    brainDir,
    sourceDir,
    sourceFiles: [rel],
    pairs: [pairOf(rel)],
    provenance: {},
    groupOf: byPath,
  });

  assert.equal(onDisk(brainDir, rel), ENGINE);
  assert.deepEqual(report.refreshed, [rel], "an absent file reports as delivered, not as preserved");
  assert.deepEqual(report.deliveredFileMap, { [rel]: ENGINE });
});

// A merge whose result is what was already installed is still a merge — the base
// moves — but the file must not be touched. Rewriting identical bytes churns the
// auto-commit history for a no-op. Observed on the MTIME, since identical content
// cannot tell the two apart.
test("a merge that changes nothing on disk does not touch the file at all", (t) => {
  const { brainDir, sourceDir } = trees(t);
  const rel = "scripts/status-line.mjs";
  writeInto(brainDir, rel, OWNER);
  writeInto(brainDir, `.engine-base/${rel}`, BASE);
  writeInto(sourceDir, rel, ENGINE);
  const long_ago = new Date("2020-01-01T00:00:00Z");
  utimesSync(join(brainDir, rel), long_ago, long_ago);

  const report = applyMergeGoverned({
    brainDir,
    sourceDir,
    sourceFiles: [rel],
    pairs: [pairOf(rel)],
    provenance: { [rel]: fp(BASE) },
    merge: () => ({ clean: true, merged: OWNER }),
    groupOf: byPath,
  });

  assert.deepEqual(report.merged, [rel], "it IS a merge");
  assert.deepEqual(report.deliveredFileMap, { [rel]: ENGINE }, "and the base moves all the same");
  assert.equal(statSync(join(brainDir, rel)).mtimeMs, long_ago.getTime(), "but nothing was written");
});

// A sidecar left by a previous update is a claim ("a newer version awaits") that
// only two verdicts still back. Any other makes it a lie — the owner adopted it,
// or we just merged under it — so it is cleared unconditionally.
test("a stale sidecar is cleared, whatever this pass concludes", (t) => {
  const { brainDir, sourceDir } = trees(t);
  const rel = "scripts/verify-rag.mjs";
  writeInto(brainDir, rel, BASE);
  writeInto(sourceDir, rel, ENGINE);
  writeInto(brainDir, `${rel}.new`, "a claim left by a previous run\n");

  const report = applyMergeGoverned({
    brainDir,
    sourceDir,
    sourceFiles: [rel],
    pairs: [pairOf(rel)],
    provenance: { [rel]: fp(BASE) },
    groupOf: byPath,
  });

  assert.equal(onDisk(brainDir, rel), ENGINE, "it fast-forwarded");
  assert.ok(!existsSync(join(brainDir, `${rel}.new`)), "a sidecar nothing backs any more is a lie");
  assert.deepEqual(report.preserved, []);
});

// The merge seam THROWS on a technical failure (a git that cannot run), never on
// a conflict. Letting that escape would take a whole update down over one file,
// so it degrades to what a brain with no ancestor gets — and the run goes on.
test("a merge that throws costs ONE file its merge, not the whole run", (t) => {
  const { brainDir, sourceDir } = trees(t);
  const doomed = "scripts/auto-commit.mjs";
  const spared = "scripts/auto-push.mjs";
  writeInto(brainDir, doomed, OWNER);
  writeInto(brainDir, `.engine-base/${doomed}`, BASE);
  writeInto(brainDir, spared, BASE);
  for (const rel of [doomed, spared]) writeInto(sourceDir, rel, ENGINE);

  const report = applyMergeGoverned({
    brainDir,
    sourceDir,
    sourceFiles: [doomed, spared],
    pairs: [doomed, spared].map(pairOf),
    provenance: { [doomed]: fp(BASE), [spared]: fp(BASE) },
    merge: () => {
      throw new Error("git merge-file could not run: ENOENT");
    },
    groupOf: byPath,
  });

  assert.equal(onDisk(brainDir, doomed), OWNER, "the owner's file is never the casualty of a broken tool");
  assert.deepEqual(report.preserved, [{ name: doomed, reason: "merge-failed", newVersionPath: `${doomed}.new` }]);
  assert.equal(onDisk(brainDir, `${doomed}.new`), ENGINE, "the engine's version still waits beside it");
  assert.equal(onDisk(brainDir, spared), ENGINE, "the other file of the same run still gets delivered");
  assert.deepEqual(report.deliveredFileMap, { [spared]: ENGINE });
});

// ── The gate on bytes that exist nowhere but this machine ───────────────────
//
// A caller whose files are EXECUTED (S2b's four engine scripts) hands in a
// `verifyWrite`. It is asked about the merge OUTPUT and nothing else: a
// fast-forward writes the engine's own candidate, which the suite already tested.

// The case the gate exists for. Both sides were valid; the merge of them is not,
// and it is about to be written into a file the brain runs at every session.
test("a merge whose bytes fail the gate is preserved, not written", (t) => {
  const { brainDir, sourceDir } = trees(t);
  const rel = "scripts/auto-commit.mjs";
  writeInto(brainDir, rel, OWNER);
  writeInto(brainDir, `.engine-base/${rel}`, BASE);
  writeInto(sourceDir, rel, ENGINE);

  const report = applyMergeGoverned({
    brainDir,
    sourceDir,
    sourceFiles: [rel],
    pairs: [pairOf(rel)],
    provenance: { [rel]: fp(BASE) },
    groupOf: byPath,
    verifyWrite: () => false,
  });

  assert.equal(onDisk(brainDir, rel), OWNER, "the owner's working file stands");
  assert.deepEqual(report.preserved, [{ name: rel, reason: "merge-unsafe", newVersionPath: `${rel}.new` }]);
  assert.deepEqual(report.merged, [], "a merge that cannot be written is not a merge");
  assert.equal(onDisk(brainDir, `${rel}.new`), ENGINE, "the engine's version still waits beside it");
  // Absent from the map: nothing was delivered, so the ancestor must stand where it
  // is. Advanced here, the next update would read the file as untouched and
  // fast-forward over the very edit this verdict was protecting.
  assert.deepEqual(report.deliveredFileMap, {});
});

// The gate must be asked about the merge and NOTHING else. Asked about a
// fast-forward it would be judging the engine's own shipped file — and one bad
// answer there would freeze that file across the whole fleet at once.
test("the gate sees the merged bytes, and is never asked about a fast-forward", (t) => {
  const { brainDir, sourceDir } = trees(t);
  const mergedFile = "scripts/auto-commit.mjs";
  const fastForwarded = "scripts/auto-push.mjs";
  writeInto(brainDir, mergedFile, OWNER);
  writeInto(brainDir, `.engine-base/${mergedFile}`, BASE);
  writeInto(brainDir, fastForwarded, BASE);
  for (const rel of [mergedFile, fastForwarded]) writeInto(sourceDir, rel, ENGINE);

  const asked = [];
  const report = applyMergeGoverned({
    brainDir,
    sourceDir,
    sourceFiles: [mergedFile, fastForwarded],
    pairs: [mergedFile, fastForwarded].map(pairOf),
    provenance: { [mergedFile]: fp(BASE), [fastForwarded]: fp(BASE) },
    groupOf: byPath,
    verifyWrite: (question) => (asked.push(question), true),
  });

  assert.deepEqual(asked, [{ rel: mergedFile, content: MERGED }], "asked once, about the merge, by name");
  assert.deepEqual(report.merged, [mergedFile]);
  assert.deepEqual(report.refreshed, [fastForwarded]);
  assert.equal(onDisk(brainDir, mergedFile), MERGED, "a gate that says yes changes nothing");
  assert.equal(onDisk(brainDir, fastForwarded), ENGINE);
});

// A gate that cannot RUN is not a gate that says no, and the two must not report
// the same thing: `merge-unsafe` tells the owner their merged file was broken,
// `merge-failed` tells them the tool was. Saying the first when the second is true
// is an accusation the engine has no evidence for.
test("a gate that throws degrades to merge-failed, never to merge-unsafe", (t) => {
  const { brainDir, sourceDir } = trees(t);
  const rel = "scripts/status-line.mjs";
  writeInto(brainDir, rel, OWNER);
  writeInto(brainDir, `.engine-base/${rel}`, BASE);
  writeInto(sourceDir, rel, ENGINE);

  const report = applyMergeGoverned({
    brainDir,
    sourceDir,
    sourceFiles: [rel],
    pairs: [pairOf(rel)],
    provenance: { [rel]: fp(BASE) },
    groupOf: byPath,
    verifyWrite: () => {
      throw new Error("node --check could not run: spawn ENOENT");
    },
  });

  assert.equal(onDisk(brainDir, rel), OWNER);
  assert.deepEqual(report.preserved, [{ name: rel, reason: "merge-failed", newVersionPath: `${rel}.new` }]);
  assert.deepEqual(report.deliveredFileMap, {});
});

// A caller with no gate — the skills, whose files are read and not run — must be
// completely unaffected. Every other test in this file passes no `verifyWrite`;
// this one says so on purpose, because "the default is off" is the contract that
// keeps S2b-2 from reaching the skills at all.
test("with no gate supplied, a merge is written exactly as before", (t) => {
  const { brainDir, sourceDir } = trees(t);
  const rel = ".claude/skills/coach/SKILL.md";
  writeInto(brainDir, rel, OWNER);
  writeInto(brainDir, `.engine-base/${rel}`, BASE);
  writeInto(sourceDir, rel, ENGINE);

  const report = applyMergeGoverned({
    brainDir,
    sourceDir,
    sourceFiles: [rel],
    pairs: [pairOf(rel)],
    provenance: { [rel]: fp(BASE) },
    groupOf: byPath,
  });

  assert.equal(onDisk(brainDir, rel), MERGED);
  assert.deepEqual(report.merged, [rel]);
  assert.deepEqual(report.preserved, []);
});

// A brain outside the regime (no recorded sha) gets NO sidecar: `no-provenance`
// says we cannot PROVE anything, and littering an older brain with unexplained
// `.new` files would be noise, not a choice. It is reported all the same, so the
// verdict is not lost — `formatReport` is what decides to stay quiet about it.
// ⚠️ INVERTED at S10-1. This test was named "…preserved silently, with no sidecar" and
// asserted exactly that. The premise it rested on — an unexplained sidecar is noise —
// is what S10 removes: the next conversation asks about this file and offers to take
// the new one, keep the owner's, or combine them, and two of those three need the
// engine's version readable on disk. What has NOT changed, and is asserted below: the
// owner's file is untouched, and `deliveredFileMap` stays empty so no base advances
// behind a decision nobody has taken yet.
test("a file with no recorded provenance keeps the owner's bytes, and the new version lands beside it", (t) => {
  const { brainDir, sourceDir } = trees(t);
  const rel = "scripts/auto-push.mjs";
  writeInto(brainDir, rel, OWNER);
  writeInto(sourceDir, rel, ENGINE);

  const report = applyMergeGoverned({
    brainDir,
    sourceDir,
    sourceFiles: [rel],
    pairs: [pairOf(rel)],
    provenance: {},
    groupOf: byPath,
  });

  assert.equal(onDisk(brainDir, rel), OWNER, "the owner's file is never overwritten");
  assert.deepEqual(report.preserved, [
    { name: rel, reason: "no-provenance", newVersionPath: `${rel}.new` },
  ]);
  assert.equal(onDisk(brainDir, `${rel}.new`), ENGINE, "and the engine's version is readable beside it");
  // 🛑 Still empty, and this is the load-bearing half: a sidecar is an OFFER, not a
  // delivery. Advancing the base here would record an ancestor the file never received
  // and make the owner's own bytes read as a deletion at the next update.
  assert.deepEqual(report.deliveredFileMap, {});
});
