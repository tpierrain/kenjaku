// ═══════════════════════════════════════════════════════════════════════════
// release-fixture-doctrine.test.mjs — the QA of the DOCTRINE layer (plan S5),
// against a brain reproduced from a real release tag.
//
// WHY A SEPARATE SUITE, on `release-fixture-refresh.test.mjs`'s own precedent:
// that one is the QA of the SKILL refresh. This one answers a different
// question, and it is the acceptance test of S1-S5 — does `CLAUDE.engine.md`
// stop being frozen, and for WHOM?
//
// 🧨 WHAT WAS MEASURED BEFORE A LINE OF THIS WAS WRITTEN, because it is what
// makes the file below assert a contrast instead of an arrival: across the NINE
// published tags v3.6.0, v3.6.1, v4.0.0, v4.5.0, v4.6.0, v4.7.0, v4.8.0, v4.8.1
// and v4.9.1, `CLAUDE.engine.md` is ABSENT FROM EVERY REGIME — `merge` holds a
// steady 15 entries throughout and never names it. No update could ever have
// carried it, because nothing declared it as anything. Meanwhile the file grew
// 23 504 -> 33 531 bytes (EN) over 12 commits, +43 %. The freeze is not a bug in
// the update path; it is a file that was in no regime.
//
// 🎯 SO THE TWO POLES, and the only difference between them WAS the ANCESTOR:
//   • the OLD cohort (installed before this release) has no provenance for the
//     file, so nothing can be proven about its bytes -> preserved, and REPORTED.
//     A brain that was silent becomes one that says what it is holding back.
//     That, and only that, is what this release buys the deployed fleet.
//   • the NEW cohort (installed from this release on, base seeded on day one)
//     -> delivered, and byte-identical to the source.
// Asserting "the doctrine arrives" for a deployed brain would make the release
// note lie. That claim is the one S5's own header exists to forbid.
//
// ⚠️ 2026-08-21 — **THE PARAGRAPH ABOVE IS THE STATE BEFORE S7, AND POLE A HAS BEEN
// INVERTED.** It is kept, rather than rewritten, because it recorded a truth for the
// whole life of the product and the release note has to be able to quote what changed.
//
// What changed is not the ancestor's ABSENCE — the old cohort still records no
// provenance, and this suite still builds it that way. What changed is that the
// ancestor's bytes are **on the disk** and, since S7, **provable**: the brain's
// installed `CLAUDE.engine.md` is recognised in a table of every version the engine
// ever published, so `mergeVerdict` is handed a `recorded` it can act on. The two
// poles therefore now differ in HOW the ancestor is known (recorded vs recognised),
// not in whether the file arrives. **Pole A is the acceptance test of S7**, and its
// old assertion is rewritten below with this reason beside it, never deleted quietly.
//
// The tag chain (v4.5.0 -> ... -> v4.8.1) is deliberately NOT replayed: every
// hop answers identically, so it would cost one worktree and one fixture tree
// per tag to learn what v3.6.0 -> HEAD establishes in one run.
// ═══════════════════════════════════════════════════════════════════════════
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { rmSync } from "node:fs";

import {
  FIXTURES,
  brainAtRelease,
  readBrain,
  readRepo,
  updateFrom,
  writeFile,
} from "../../maintainers/qa/release-fixtures/brain-at-release.mjs";
// The PRODUCTION seeder and digest, never a hand-rolled base tree: a `.engine-base/`
// written by the test would be the test asserting against its own idea of an
// ancestor, which is exactly the tautology this repo's QA is built to avoid.
import { readInstalledMergeFiles, syncBaseTree } from "./engine-base-fs.mjs";
import { buildProvenance, fingerprint, reseedProvenance } from "./engine-source.mjs";

const DOCTRINE = "CLAUDE.engine.md";
const TAG = "v3.6.0";

const doctrineAtTag = () => readFileSync(join(FIXTURES, TAG, DOCTRINE), "utf8");

// A brain installed from THIS release, and the difference from the old cohort is
// exactly two things its installer does that no earlier one did: it holds the CURRENT
// manifest (which is what finally DECLARES the doctrine — see the header: no tag ever
// did), and it recorded the provenance of the bytes it wrote. Its FILES are still the
// tag's, which is the whole point: the engine moved after the install.
//
// Every step goes through the production path — `readInstalledMergeFiles` +
// `buildProvenance` are what an installer calls, `syncBaseTree` is the only writer of
// `.engine-base/`. A hand-written provenance map or base tree would have this suite
// assert against its own idea of an ancestor, which is the tautology the QA exists to
// avoid (the same argument that makes the sibling suite import `fingerprint`).
function newCohortAt(tag) {
  const { brainDir } = brainAtRelease(tag);
  const manifest = JSON.parse(readRepo("engine-manifest.json"));
  manifest.provenance = buildProvenance(readInstalledMergeFiles({ brainDir, manifest }));
  writeFile(brainDir, "engine-manifest.json", JSON.stringify(manifest, null, 2) + "\n");
  syncBaseTree({ brainDir, manifest, provenance: manifest.provenance });
  return { brainDir, manifest };
}

// ── Pole A — the OLD cohort, INVERTED by S7: the frozen fleet RECEIVES ────────────
//
// 🔄 THE ASSERTION THIS REPLACES, written out so nothing is lost: until 2026-08-21 this
// test asserted `doctrinePreserved: [{name, reason: "no-provenance"}]`, `doctrineRefreshed:
// []`, and "not one byte is written without an ancestor". Every word of it was true, and
// it is the measurement that stopped the release two hours from publication — a release
// named "the engine owns what it shipped" that unfroze nobody already installed.
//
// S7 is what makes it false, and this is the only test in the repo that proves it on a
// REAL historical tree rather than a fixture written by hand: a brain rebuilt from the
// v3.6.0 tag, holding NOT ONE recorded sha, updated from HEAD.
test("QA v3.6.0 → HEAD — a brain with NO provenance at all now RECEIVES the doctrine (S7)", async (t) => {
  const { brainDir, manifest } = brainAtRelease(TAG);
  t.after(() => rmSync(brainDir, { recursive: true, force: true }));
  const frozen = readBrain(brainDir, DOCTRINE);
  assert.equal(frozen, doctrineAtTag(), "the fixture must carry the tag's own doctrine bytes");
  assert.notEqual(frozen, readRepo(DOCTRINE), "and the engine must have moved since, or this QA proves nothing");
  // Not "records nothing at all" — a v3.6.0 brain does hold shas for the skills that WERE
  // in a regime. What it holds for the doctrine is the point, and it is nothing, because
  // no published tag ever declared the file. That absence is the freeze, exactly.
  assert.equal(
    manifest.provenance?.[DOCTRINE],
    undefined,
    "and it must record NOTHING for the doctrine, or this is not the frozen cohort",
  );

  const report = await updateFrom(brainDir, manifest);

  assert.equal(readBrain(brainDir, DOCTRINE), readRepo(DOCTRINE), "byte-identical to what the engine ships");
  assert.deepEqual(report.doctrineRefreshed, [DOCTRINE], "delivered, where it was preserved before S7");
  assert.deepEqual(report.doctrinePreserved, [], "and no longer held back for want of a provenance");
  assert.deepEqual(report.doctrineMerged, []);
  assert.deepEqual(report.doctrineConflicts, []);
  assert.ok(!existsSync(join(brainDir, `${DOCTRINE}.new`)), "no sidecar: it was a clean delivery, not a merge");
  // The proof was RECOGNISED, not recorded — the distinction the whole of S7 turns on.
  assert.deepEqual(
    report.healed.map((h) => h.rel),
    [DOCTRINE],
    "and the engine says which files it recognised, so the change of ancestry is never silent",
  );
});

// ── Pole B — the NEW cohort: one ancestor is the whole difference ─────────────────
test("QA v3.6.0 → HEAD — the SAME brain, given the ancestor its installer would record, converges", async (t) => {
  const { brainDir, manifest } = newCohortAt(TAG);
  t.after(() => rmSync(brainDir, { recursive: true, force: true }));
  assert.equal(
    readFileSync(join(brainDir, ".engine-base", DOCTRINE), "utf8"),
    doctrineAtTag(),
    "the production seeder must have laid the brain's own bytes down as the ancestor",
  );

  const report = await updateFrom(brainDir, manifest);

  assert.equal(readBrain(brainDir, DOCTRINE), readRepo(DOCTRINE), "byte-identical to what the engine ships");
  assert.deepEqual(report.doctrineRefreshed, [DOCTRINE]);
  assert.deepEqual(report.doctrinePreserved, [], "and never mistaken for a customization");
  assert.deepEqual(report.doctrineConflicts, []);
});

// ── Pole C — the claim the release is named after: preserve stops meaning abandon ──
// Not in the design's two poles; added on contact because B alone proves delivery to
// someone who changed nothing, which is the easy half. What "the engine owns what it
// shipped" actually promises is that an owner who WROTE in the file keeps their words
// AND receives the update.
test("QA v3.6.0 → HEAD — an owner who edited the doctrine keeps their line AND gets the update", async (t) => {
  const MINE = "\n## My own rule\nAlways ask before deleting a note.\n";
  const { brainDir, manifest } = newCohortAt(TAG);
  t.after(() => rmSync(brainDir, { recursive: true, force: true }));
  // The edit lands AFTER the ancestor is recorded — which is what an owner editing
  // their brain the day after install actually looks like on disk.
  writeFile(brainDir, DOCTRINE, doctrineAtTag() + MINE);

  const report = await updateFrom(brainDir, manifest);

  const landed = readBrain(brainDir, DOCTRINE);
  assert.ok(landed.includes("Always ask before deleting a note."), "the owner's line survives the update");
  assert.notEqual(landed, doctrineAtTag() + MINE, "and the file is no longer what they left");
  assert.deepEqual(report.doctrineMerged, [DOCTRINE]);
  assert.deepEqual(report.doctrinePreserved, [], "a merge is not an abandonment");
  assert.deepEqual(report.doctrineConflicts, []);

  // ⚠️ The advance is NOT `reconcileBrain`'s: `runReconcileCli` is the last writer on
  // the update path and does it after the report (its own comment says why). Replayed
  // here through the PRODUCTION helpers, with the same `delivered` map it builds — a
  // hand-written base tree would have this suite assert against its own idea of an
  // ancestor. Discovered by this assertion failing, which is the whole reason it is here.
  const delivered = { ...report.installedFileMap, ...report.refreshedFileMap };
  const advanced = reseedProvenance({ priorProvenance: manifest.provenance, manifest, deliveredFileMap: delivered });
  syncBaseTree({ brainDir, manifest, provenance: advanced, deliveredFileMap: delivered });

  // 🛑 The trap `engine-merge.mjs`'s header exists to make unmissable: the disk takes
  // the MERGE, the base advances to the CANDIDATE. Were the merged bytes recorded as
  // the ancestor, the next update would read the file as untouched and fast-forward
  // straight over the edit just preserved.
  assert.equal(
    readFileSync(join(brainDir, ".engine-base", DOCTRINE), "utf8"),
    readRepo(DOCTRINE),
    "the ancestor advances to what the ENGINE delivered, never to the merged file",
  );
  assert.equal(advanced[DOCTRINE], fingerprint(readRepo(DOCTRINE)), "and so does the recorded sha");
  assert.notEqual(advanced[DOCTRINE], fingerprint(landed), "never to the merged bytes");
});
