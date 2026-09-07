import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { SHIPPED_WORKFLOWS, isRetreatable, retireShippedWorkflows } from "./workflow-retreat.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// Issue #92 — a brain must never run a build, and the ones already out there
// must stop. This is the second of the two subtractive doors in the product,
// and the first to erase anything outside `.claude/skills/`.
//
// The proof rule is BY NAME, and that is the whole design: the sibling door
// (`skill-retirement`) removes only what it can prove it delivered byte for
// byte, from the brain's recorded provenance. No brain in the field records any
// provenance for these files — they were in no regime, so nothing ever recorded
// them — so demanding that proof here would preserve every workflow on every
// brain and ship a release that claims to have stopped the bill while stopping
// nothing.
// ═══════════════════════════════════════════════════════════════════════════

// A brain-shaped directory: the two shipped workflows, plus the owner's territory
// standing right next to them so every test asserts what SURVIVES, not only what goes.
function brainWithWorkflows() {
  const brainDir = mkdtempSync(join(tmpdir(), "kenjaku-workflow-retreat-"));
  mkdirSync(join(brainDir, ".github", "workflows"), { recursive: true });
  for (const rel of SHIPPED_WORKFLOWS) writeFileSync(join(brainDir, rel), "on: push\n");
  mkdirSync(join(brainDir, "vault"), { recursive: true });
  writeFileSync(join(brainDir, "vault", "a-note.md"), "the owner's note\n");
  return brainDir;
}

// An UPDATE, said the one way there is to say it: a source that is not the brain.
const UPDATE_SOURCE = "/somewhere/else/kenjaku-launcher";

test("retireShippedWorkflows — removes both workflows the launcher ever shipped", () => {
  const brainDir = brainWithWorkflows();

  const report = retireShippedWorkflows({ brainDir, sourceDir: UPDATE_SOURCE });

  assert.deepEqual(report.removed, [".github/workflows/ci.yml", ".github/workflows/mutation-nightly.yml"]);
  assert.equal(existsSync(join(brainDir, ".github/workflows/ci.yml")), false);
  assert.equal(existsSync(join(brainDir, ".github/workflows/mutation-nightly.yml")), false);
});

test("retireShippedWorkflows — a workflow the OWNER wrote is never touched", () => {
  // The cost asymmetry this door is built on: a leftover file of ours is cosmetic,
  // deleting someone's own automation is not. Ours are named; everything else stays.
  const brainDir = brainWithWorkflows();
  const theirs = join(brainDir, ".github/workflows/my-own-backup.yml");
  writeFileSync(theirs, "on: schedule\n");

  const report = retireShippedWorkflows({ brainDir, sourceDir: UPDATE_SOURCE });

  assert.equal(readFileSync(theirs, "utf8"), "on: schedule\n");
  assert.deepEqual(report.removed, [".github/workflows/ci.yml", ".github/workflows/mutation-nightly.yml"]);
});

test("retireShippedWorkflows — the owner's vault is untouched, and stays untouched", () => {
  const brainDir = brainWithWorkflows();

  retireShippedWorkflows({ brainDir, sourceDir: UPDATE_SOURCE });

  assert.equal(readFileSync(join(brainDir, "vault", "a-note.md"), "utf8"), "the owner's note\n");
});

test("retireShippedWorkflows — nothing to remove is SILENT and not an error", () => {
  // The overwhelming majority of updates, forever: every brain that already converged,
  // and every brain created after the copy fix. They must not pay for this and must not
  // hear about it.
  const brainDir = mkdtempSync(join(tmpdir(), "kenjaku-workflow-retreat-clean-"));

  const report = retireShippedWorkflows({ brainDir, sourceDir: UPDATE_SOURCE });

  assert.deepEqual(report.removed, []);
});

test("retireShippedWorkflows — running it twice removes nothing the second time", () => {
  const brainDir = brainWithWorkflows();

  retireShippedWorkflows({ brainDir, sourceDir: UPDATE_SOURCE });
  const second = retireShippedWorkflows({ brainDir, sourceDir: UPDATE_SOURCE });

  assert.deepEqual(second.removed, []);
});

test("retireShippedWorkflows — a SELF-HEAL deletes nothing at all", () => {
  // The session-start converge runs with the brain as its own source, detached and with
  // its output going nowhere. A delete there is a delete nobody is ever told about, so
  // this door is update-time only, exactly like the skills one.
  const brainDir = brainWithWorkflows();

  const report = retireShippedWorkflows({ brainDir, sourceDir: brainDir });

  assert.deepEqual(report.removed, []);
  assert.equal(existsSync(join(brainDir, ".github/workflows/ci.yml")), true);
});

test("retireShippedWorkflows — a self-heal spelled with a trailing slash or dot ALSO deletes nothing", () => {
  // T8's lesson, inherited rather than re-learned: `<brainDir>/` and `<brainDir>/.` name
  // the same directory, and a raw string compare opens the gate on both.
  const brainDir = brainWithWorkflows();

  assert.deepEqual(retireShippedWorkflows({ brainDir, sourceDir: `${brainDir}/` }).removed, []);
  assert.deepEqual(retireShippedWorkflows({ brainDir, sourceDir: `${brainDir}/.` }).removed, []);
  assert.equal(existsSync(join(brainDir, ".github/workflows/ci.yml")), true);
});

test("retireShippedWorkflows — an ABSENT sourceDir deletes nothing: 'I cannot tell' fails towards keeping", () => {
  const brainDir = brainWithWorkflows();

  assert.deepEqual(retireShippedWorkflows({ brainDir }).removed, []);
  assert.equal(existsSync(join(brainDir, ".github/workflows/ci.yml")), true);
});

test("isRetreatable — only paths anchored under .github/workflows/ are ever removable", () => {
  assert.equal(isRetreatable(".github/workflows/ci.yml"), true);
  assert.equal(isRetreatable("vault/my-note.md"), false, "the owner's notes");
  assert.equal(isRetreatable("CLAUDE.md"), false, "the owner's constitution");
  assert.equal(isRetreatable(".env"), false, "the owner's API key");
  assert.equal(isRetreatable(".github/FUNDING.yml"), false, "inside .github, but not a workflow");
  // Anchored at the START, not merely containing: a path that reaches the directory from
  // somewhere else is not a path that lives in it.
  assert.equal(isRetreatable("vault/.github/workflows/ci.yml"), false);
});

test("isRetreatable — a path that CLIMBS OUT is refused, whichever separator it climbs with", () => {
  // The T12 lesson, and it is the load-bearing one here: `.github/workflows/` is a prefix
  // check, and a prefix check has nothing to say about where a path ENDS UP. Both
  // separators, because `path.join` on Windows treats a backslash as one.
  assert.equal(isRetreatable(".github/workflows/../../vault/a-note.md"), false);
  assert.equal(isRetreatable(".github/workflows/..\\..\\vault\\a-note.md"), false);
  assert.equal(isRetreatable(".github/workflows/./ci.yml"), false);
  // And a legitimate name that merely CONTAINS dots stays removable: a guard that is
  // wrong about honest input is one people widen instead of read.
  assert.equal(isRetreatable(".github/workflows/ci..old.yml"), true);
});

test("isRetreatable — anything that is not a usable string is refused", () => {
  assert.equal(isRetreatable(undefined), false);
  assert.equal(isRetreatable(null), false);
  assert.equal(isRetreatable(""), false);
  assert.equal(isRetreatable(42), false);
});

test("SHIPPED_WORKFLOWS — names exactly the two files, and every one of them is retreatable", () => {
  // The list is the blast radius. Asserted whole rather than by length, so an entry added
  // here without a second thought fails a test that names what it is agreeing to.
  assert.deepEqual(SHIPPED_WORKFLOWS, [".github/workflows/ci.yml", ".github/workflows/mutation-nightly.yml"]);
  for (const rel of SHIPPED_WORKFLOWS) assert.equal(isRetreatable(rel), true, rel);
});
