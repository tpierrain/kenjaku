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

// The promise made to anyone who tailored a skill (the documented `prepare-1-1` "refine to
// your own KPIs" case): their file stands, and the engine's newer version waits beside it.
test("QA v3.6.0 → HEAD — a customized skill is kept byte-identical, with the new version beside it", async (t) => {
  const customized = readFileSync(join(FIXTURES, "v3.6.0/.claude/skills/prepare-1-1/SKILL.md"), "utf8") +
    "\n## My own KPIs\n- churn\n- time-to-first-review\n";
  const { brainDir, manifest } = brainAtRelease("v3.6.0", {
    edits: { ".claude/skills/prepare-1-1/SKILL.md": customized },
  });
  t.after(() => rmSync(brainDir, { recursive: true, force: true }));

  const report = await updateFrom(brainDir, manifest);

  assert.equal(readBrain(brainDir, ".claude/skills/prepare-1-1/SKILL.md"), customized, "never clobbered");
  assert.equal(
    readBrain(brainDir, ".claude/skills/prepare-1-1/SKILL.md.new"),
    readRepo(".claude/skills/prepare-1-1/SKILL.md"),
    "the engine's version is offered alongside, not imposed",
  );
  assert.deepEqual(
    report.skillsPreserved.filter((p) => p.name === "prepare-1-1"),
    [{ name: "prepare-1-1", reason: "customized", newVersionPath: ".claude/skills/prepare-1-1/SKILL.md.new" }],
  );
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
