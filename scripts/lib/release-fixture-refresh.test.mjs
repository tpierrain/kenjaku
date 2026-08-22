// ═══════════════════════════════════════════════════════════════════════════
// release-fixture-refresh.test.mjs — the QA of the skill refresh (Increment 2.5)
// against brains reproduced from REAL release tags, not hand-written fixtures.
//
// WHY A SEPARATE SUITE. `reconcile-brain.test.mjs` drives the mechanism with tiny
// synthetic skills — right for the unit-level contract, blind to the one question
// this increment exists to answer: does a brain deployed at v3.6.0 actually END UP
// with the v3.6.2 `switch` skill? Here the source is THE REPOSITORY ITSELF and the
// brain is built from bytes taken verbatim from the tags (`maintainers/qa/release-
// fixtures/<tag>/`, captured with `git show <tag>:<path>`), so the assertions are
// about released content, not about a mock.
//
// Never a real deployed brain's content: the tags are public, the personal edits are
// synthetic (`maintainers/plans/…/engine-managed-file-merge-strategy.md`, Step 8).
//
// The fixtures live under `maintainers/` (dev-only prefix, never copied into a brain);
// this test file ships like every other `scripts/lib/*.test.mjs` and is simply never run
// there. The I/O seams (npm install, reindex, launchers) are injected — no network.
// ═══════════════════════════════════════════════════════════════════════════

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

// The brain builder, the stubbed seams and the one-real-update helper were EXTRACTED
// to `maintainers/qa/release-fixtures/brain-at-release.mjs` when the doctrine QA
// needed the same brain. Nothing below this line changed with the move — that the
// four tests still pass untouched is the proof it was a move.
import {
  FIXTURES,
  brainAtRelease,
  readBrain,
  readRepo,
  skillFilesOf,
  updateFrom,
} from "../../maintainers/qa/release-fixtures/brain-at-release.mjs";
// The PRODUCTION digest, deliberately: a hand-rolled sha256 in the test would silently
// disagree with the manifest's format and turn every untouched skill into "customized".
import { fingerprint, reseedProvenance, selectMergeFiles } from "./engine-source.mjs";
// The write guard's own reader, deliberately: W3's claim is about what the STANDING
// surfaces see, so the pole asks the surface rather than re-reading the glob list itself.
import { regimeOf } from "./engine-write-guard.mjs";
import { crlfify } from "./engine-base.mjs";
import { syncBaseTree } from "./engine-base-fs.mjs";

// ── The case this increment was pulled forward for (plan §"The trigger") ──────
// `4e43e70` shipped 22 lines into `.claude/skills/switch/SKILL.md` in v3.6.2. A brain
// installed at v3.6.0 or v3.6.1 could never receive them: its skill directory exists, so
// install-if-absent skipped it, while the deterministic core it drives (a `replace` glob)
// was refreshed at every update — the core/skill drift, live on shipped releases.
test("QA v3.6.0 → HEAD — the untouched `switch` skill ends up at the released v3.6.2 content", async (t) => {
  const { brainDir, manifest } = brainAtRelease("v3.6.0");
  t.after(() => rmSync(brainDir, { recursive: true, force: true }));
  const installedAtRelease = readBrain(brainDir, ".claude/skills/switch/SKILL.md");

  const report = await updateFrom(brainDir, manifest);

  assert.equal(
    readBrain(brainDir, ".claude/skills/switch/SKILL.md"),
    readRepo(".claude/skills/switch/SKILL.md"),
    "the v3.6.0 brain must end up byte-identical to the released skill",
  );
  assert.notEqual(readBrain(brainDir, ".claude/skills/switch/SKILL.md"), installedAtRelease);
  // Not just "some bytes changed": the single-account connectors reminder `4e43e70` added.
  assert.match(readBrain(brainDir, ".claude/skills/switch/SKILL.md"), /single-account/);
  assert.ok(report.skillsRefreshed.includes("switch"), "and the owner is told which skill moved");
  // Silent delivery is the bug we are fixing, so an untouched skill is never "preserved".
  assert.deepEqual(report.skillsPreserved.filter((p) => p.name === "switch"), []);
});

// ⚠️ THIS TEST WAS INVERTED BY S7-5, AND THE CLAIM IT USED TO MAKE IS KEPT HERE.
// It read: *"a customized skill is kept byte-identical, with the new version beside it"* —
// their file stands, the engine's newer version waits beside it as a `.new` sidecar. True
// for the product's whole life, and the best that could be promised while an owner who had
// edited a file before this release could never acquire an ancestor for it.
//
// ✅ S7-5 fetches that ancestor from the tag the recorded sha names, so the three-way merge
// that had nothing to merge FROM now has it. The owner's lines survive AND the update lands
// — in the same pass, on a brain built from the real v3.6.0 tag. That is a strictly better
// outcome, and it is the sentence the release could not honestly write before.
test("QA v3.6.0 → HEAD — a customized skill now MERGES: the owner's lines survive AND the update lands", async (t) => {
  const customized = readFileSync(join(FIXTURES, "v3.6.0/.claude/skills/prepare-1-1/SKILL.md"), "utf8") +
    "\n## My own KPIs\n- churn\n- time-to-first-review\n";
  const { brainDir, manifest } = brainAtRelease("v3.6.0", {
    edits: { ".claude/skills/prepare-1-1/SKILL.md": customized },
  });
  t.after(() => rmSync(brainDir, { recursive: true, force: true }));

  const report = await updateFrom(brainDir, manifest);

  const merged = readBrain(brainDir, ".claude/skills/prepare-1-1/SKILL.md");
  assert.match(merged, /## My own KPIs\n- churn\n- time-to-first-review/, "the owner's own lines are still there");
  assert.match(merged, /## Claim discipline/, "and the engine's newer content has ARRIVED, in the same pass");
  assert.deepEqual(report.skillsMerged, ["prepare-1-1"]);
  assert.deepEqual(report.conflicts, [], "and it merged cleanly — no sidecar, nothing to arbitrate");
  assert.deepEqual(report.skillsPreserved.filter((p) => p.name === "prepare-1-1"), []);
  assert.ok(!report.skillsRefreshed.includes("prepare-1-1"));
  // The sacred trio is untouched by the same run.
  assert.equal(readBrain(brainDir, "CLAUDE.md"), "# My constitution\nI tailored this.\n");
  assert.equal(readBrain(brainDir, ".env"), "GOOGLE_GEMINI_API_KEY=secret\n");
});

// The oldest cohort in the fleet. Its manifest predates `switch` entirely, so that skill
// arrives by install-if-absent (ADR 0025), while a skill it DOES carry and never touched
// is refreshed — the 12 skill commits that had reached nobody since v3.2.2.
test("QA v3.2.2 → HEAD — an untouched skill is refreshed, and a skill unknown at that release is installed", async (t) => {
  const { brainDir, manifest } = brainAtRelease("v3.2.2");
  t.after(() => rmSync(brainDir, { recursive: true, force: true }));
  assert.ok(!existsSync(join(brainDir, ".claude/skills/switch")), "v3.2.2 predates universes");

  const report = await updateFrom(brainDir, manifest);

  assert.equal(readBrain(brainDir, ".claude/skills/import/SKILL.md"), readRepo(".claude/skills/import/SKILL.md"));
  assert.ok(report.skillsRefreshed.includes("import"));
  assert.equal(readBrain(brainDir, ".claude/skills/switch/SKILL.md"), readRepo(".claude/skills/switch/SKILL.md"));
  assert.ok(report.installedSkills.includes("switch"), "a skill unknown at that release still arrives");
});

// A converged brain must stay byte-identical: every write here would be auto-committed,
// so a "refresh" that rewrites identical bytes turns each update into history churn.
test("QA already-converged brain — a second update refreshes nothing and rewrites nothing", async (t) => {
  const { brainDir, manifest } = brainAtRelease("v3.6.0");
  t.after(() => rmSync(brainDir, { recursive: true, force: true }));

  const first = await updateFrom(brainDir, manifest);
  // Re-seed through the PRODUCTION helper, over what the update path actually delivers:
  // the skills it refreshed AND the ones it installed. Leave the installed ones out and
  // they read `no-provenance` forever — frozen the day they arrived.
  manifest.provenance = reseedProvenance({
    priorProvenance: manifest.provenance,
    manifest,
    deliveredFileMap: { ...first.installedFileMap, ...first.refreshedFileMap },
  });
  const before = skillFilesOf("v3.6.0").map((rel) => fingerprint(readBrain(brainDir, rel)));

  const second = await updateFrom(brainDir, manifest);

  assert.deepEqual(second.skillsRefreshed, [], "nothing left to refresh");
  assert.deepEqual(second.skillsPreserved, [], "and nothing mistaken for a customization");
  assert.deepEqual(skillFilesOf("v3.6.0").map((rel) => fingerprint(readBrain(brainDir, rel))), before);
  assert.ok(!existsSync(join(brainDir, ".claude/skills/switch/SKILL.md.new")), "no sidecar on a converged brain");
});

// ── THE CLAIM THIS TEST USED TO PIN, AND WHY IT NO LONGER HOLDS ─────────────────
// It pinned the sentence a release note must not overstate: *"your edits are preserved AND
// you get the update"* was **FALSE for one population, permanently** — the files an owner
// had already edited before this release. The reasoning was sound and it is worth keeping:
// a merge needs an ancestor; `planBaseSeed` can only seed one from bytes that still match
// their recorded sha, and an edited file does not; and it cannot be seeded from the FETCHED
// copy either, because that is `theirs`, not the ancestor, and merging against it would
// silently discard everything the engine shipped between install and now.
//
// ✅ THE WORD THAT WAS WRONG IS "PERMANENTLY", and S7-5 is what disproved it. The
// reasoning has exactly one hole: the ancestor cannot be seeded FROM THE DISK, but it can
// be FETCHED — the recorded sha names a published tag, `table.files[rel][recorded]` says
// which, and the fetched bytes are verified against that same sha before one of them is
// written. The population this test describes is precisely the population that is served.
//
// What the test asserts now is the other half of the promise: the ancestor ARRIVES, it is
// the real v3.6.0 blob, and the base does not stay there — the merge consumes it and the
// base advances to what was just delivered, so the next update compares against the version
// actually shipped and no second fetch is ever needed.
test("QA v3.6.0 → HEAD — a skill edited BEFORE this release now ACQUIRES its ancestor, fetched from the tag", async (t) => {
  const REL = ".claude/skills/prepare-1-1/SKILL.md";
  const customized = readFileSync(join(FIXTURES, `v3.6.0/${REL}`), "utf8") + "\n## My own KPIs\n- churn\n";
  const { brainDir, manifest } = brainAtRelease("v3.6.0", { edits: { [REL]: customized } });
  t.after(() => rmSync(brainDir, { recursive: true, force: true }));

  const first = await updateFrom(brainDir, manifest);

  // 🛑 The whole finding, inverted, in three assertions.
  assert.deepEqual(first.ancestorsHydrated, [REL], "the ancestor was fetched, for this exact file");
  assert.deepEqual(first.ancestorsFailed, [], "and nothing had to be apologised for");
  assert.deepEqual(
    first.skillsPreserved.filter((p) => p.name === "prepare-1-1"),
    [],
    "so it is no longer deferred as `customized` — there is an ancestor now",
  );

  // The update path's own tail, through the production helpers `runReconcileCli` calls.
  const delivered = { ...first.installedFileMap, ...first.refreshedFileMap };
  manifest.provenance = reseedProvenance({ priorProvenance: manifest.provenance, manifest, deliveredFileMap: delivered });
  const sync = syncBaseTree({ brainDir, manifest, provenance: manifest.provenance, deliveredFileMap: delivered });

  // And the base is on disk, holding what was DELIVERED — not the v3.6.0 blob it was
  // fetched as. The ancestor did its job during the merge and the base then advanced, which
  // is why the fetch happens once ever and the next update reads a local file.
  assert.ok(existsSync(join(brainDir, ".engine-base", REL)), "the hole is filled");
  assert.equal(readBrain(brainDir, `.engine-base/${REL}`), readRepo(REL));
  assert.deepEqual(sync.deferred.filter((d) => d.rel === REL), [], "nothing left to defer");
});

// ── 🪟 THE SAME BRAIN, INSTALLED ON WINDOWS (W1) ────────────────────────────────
// The test above is the promise; this is the platform it went quiet on. A Windows
// brain records a CRLF digest at install (deliberately — the installer digests the
// bytes it wrote), and the fingerprint table holds none: every row is folded from a git
// blob, and the object store holds LF. The direct lookup missed, no fetch was even
// attempted, and *"your edits survive AND the update lands"* silently became *"your
// edits survive, and the new version waits beside them"* for a whole platform.
//
// 🛑 THIS POLE MUST ALSO BE GREEN ON A REAL WINDOWS RUNNER (W6), and a macOS pass is
// not that: here the CRLF is synthesised, there it is what git actually hands the
// checkout. The three QA poles CI fails on today are the proof, and reading the run is
// the acceptance condition — not predicting it from this file.
test("QA v3.6.0 on WINDOWS → HEAD — a CRLF-recorded brain's edited skill acquires its ancestor and MERGES", async (t) => {
  const REL = ".claude/skills/prepare-1-1/SKILL.md";
  const customized = crlfify(readFileSync(join(FIXTURES, `v3.6.0/${REL}`), "utf8") + "\n## My own KPIs\n- churn\n");
  const { brainDir, manifest } = brainAtRelease("v3.6.0", { eol: "crlf", edits: { [REL]: customized } });
  t.after(() => rmSync(brainDir, { recursive: true, force: true }));
  // The premise, asserted rather than assumed: this brain really holds CRLF, and its
  // record really is the digest of those bytes. Without it the test could pass on an LF
  // brain wearing a Windows name — the exact way the FR pole measured the wrong thing
  // for a day.
  //
  // ⚠️ AND THE FIRST SPELLING OF IT WAS macOS-SHAPED, which a real Windows runner said
  // out loud (W6, 2026-08-22). It read `notEqual(crlf digest, lf digest)` — true here,
  // FALSE on Windows, where git checks the fixture out as CRLF already, so `crlfify` is
  // a no-op and the two digests are one. A premise guard that only holds on the platform
  // that does not have the defect guards nothing. The bytes are what to assert on.
  assert.match(readBrain(brainDir, ".claude/skills/switch/SKILL.md"), /\r\n/, "this brain really holds CRLF");
  assert.equal(manifest.provenance[REL], fingerprint(crlfify(readFileSync(join(FIXTURES, `v3.6.0/${REL}`), "utf8"))));

  const first = await updateFrom(brainDir, manifest);

  assert.deepEqual(first.ancestorsHydrated, [REL], "the ancestor was fetched, on a CRLF-recorded sha");
  assert.deepEqual(first.ancestorsFailed, []);
  const merged = readBrain(brainDir, REL);
  assert.match(merged, /## My own KPIs\n- churn/, "the owner's own lines are still there");
  assert.match(merged, /## Claim discipline/, "and the engine's newer content has ARRIVED, in the same pass");
  assert.deepEqual(first.skillsMerged, ["prepare-1-1"]);
  assert.deepEqual(first.conflicts, [], "and it merged cleanly — CRLF is not a change to every line");
  assert.deepEqual(first.skillsPreserved.filter((p) => p.name === "prepare-1-1"), []);
  // And the file the owner never touched is refreshed exactly as on an LF brain: a
  // CRLF-recorded UNTOUCHED file must not be dragged into the fetch, nor mistaken for
  // a customization.
  assert.equal(readBrain(brainDir, ".claude/skills/switch/SKILL.md"), readRepo(".claude/skills/switch/SKILL.md"));
  assert.ok(first.skillsRefreshed.includes("switch"));
});

// ── W3 — a brain stops carrying its INSTALL-DAY regime list forever ────────────
// S10-QA measured this on this very fixture: step 7 never wrote `regimes` back, so a
// v3.6.0 brain kept a v3.6.0 list of file families for life. Thomas's call, 2026-08-22
// (answer 4, option (a)): advance it, and say so in the release note, because the write
// guard reads this same list and advancing it WIDENS what an agent gets asked about.
//
// The two real movements between v3.6.0 and HEAD, and neither is hypothetical:
//   · `CLAUDE.engine.md` — a `merge` family only v4+ declares. This release is the one
//     that unfreezes the doctrine, and a brain that does not list the file cannot see it
//     on any standing surface between two updates.
//   · `.claude/skills/tdd-discipline/**` — v3.6.0 lists it under `merge` and knows no
//     `retired` key at all. HEAD retires it. `selectMergeFiles` subtracts tombstones, so
//     until the brain adopts the list it goes on seeding a base for a skill nobody ships.
test("QA v3.6.0 → HEAD — the updated brain adopts the ENGINE's regimes, install-day list and all", async (t) => {
  const { brainDir, manifest } = brainAtRelease("v3.6.0");
  t.after(() => rmSync(brainDir, { recursive: true, force: true }));
  const target = JSON.parse(readRepo("engine-manifest.json"));
  // The premise, asserted rather than assumed — this pole proves nothing on a fixture
  // that already knew the doctrine family.
  assert.ok(!manifest.regimes.merge.includes("CLAUDE.engine.md"), "premise: v3.6.0 declares no doctrine family");
  assert.equal(manifest.retired, undefined, "premise: v3.6.0 predates tombstones entirely");
  assert.ok(manifest.regimes.merge.includes(".claude/skills/tdd-discipline/**"), "premise: and it still merges tdd-discipline");

  await updateFrom(brainDir, manifest);

  const after = JSON.parse(readBrain(brainDir, "engine-manifest.json"));
  assert.deepEqual(after.regimes, target.regimes, "the brain's families are now the engine's");
  assert.deepEqual(after.retired, target.retired, "and so are its tombstones");
  // What the owner actually gets out of it, on both surfaces that read this list:
  assert.equal(regimeOf({ rel: "CLAUDE.engine.md", manifest: after }), "merge", "the doctrine is finally an engine file here");
  assert.deepEqual(
    selectMergeFiles(after, [".claude/skills/tdd-discipline/SKILL.md", "CLAUDE.engine.md"]),
    ["CLAUDE.engine.md"],
    "the retired skill stops being treated as a merge file, and the doctrine starts",
  );
  // Nothing else in the manifest was collateral damage — step 7's own records stand.
  assert.deepEqual(after.engineVersion, target.engineVersion);
  assert.ok(Object.keys(after.provenance).length > 0, "provenance survived the same write");
});
