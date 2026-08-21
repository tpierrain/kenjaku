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
import { fingerprint, reseedProvenance } from "./engine-source.mjs";
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
