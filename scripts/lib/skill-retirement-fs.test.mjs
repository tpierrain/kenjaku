import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { createHash } from "node:crypto";

import { retireDeclaredSkills } from "./skill-retirement-fs.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// skill-retirement-fs — THE THIN I/O around the pure decision (plan S6c). It lists
// the directory, hands the bytes to `decideSkillRetirement`, and is the ONE place in
// this product where the engine calls `rmSync` on something under `.claude/`.
//
// House pattern for an fs-touching lib module: real `node:fs` on a temp dir, no fake
// filesystem — a double that ignores its arguments certifies nothing, and here the
// whole question is whether a real directory is still on disk afterwards.
// ═══════════════════════════════════════════════════════════════════════════

const fp = (content) => "sha256:" + createHash("sha256").update(content).digest("hex");

function writeFile(root, rel, content) {
  const abs = join(root, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
}

function brainWith(files) {
  const dir = mkdtempSync(join(tmpdir(), "kenjaku-retire-"));
  for (const [rel, content] of Object.entries(files)) writeFile(dir, rel, content);
  return dir;
}

const TOMBSTONE = ".claude/skills/tdd-discipline/**";
const DIR = ".claude/skills/tdd-discipline";

// The fetched launcher an UPDATE hands the reconciler. Its contents are irrelevant here
// — what matters to this module is only that it is not the brain itself, which is what
// tells an update apart from a SessionStart self-heal (F3).
const UPDATE_SOURCE = "/tmp/a-fetched-launcher";

test("a declared, untouched skill is DELETED from the disk, and reported by its name", () => {
  const brainDir = brainWith({
    [`${DIR}/SKILL.md`]: "# tdd-discipline\n",
    [`${DIR}/reference/examples.md`]: "one test at a time\n", // nested: the walk must recurse
    ".claude/skills/coach/SKILL.md": "# coach\n",             // a neighbour, never declared
  });
  const report = retireDeclaredSkills({
    brainDir,
    sourceDir: UPDATE_SOURCE,
    plan: { retireSkills: [TOMBSTONE] },
    provenance: {
      [`${DIR}/SKILL.md`]: fp("# tdd-discipline\n"),
      [`${DIR}/reference/examples.md`]: fp("one test at a time\n"),
    },
  });
  assert.deepEqual(report, { skillsRetired: ["tdd-discipline"], skillsRetirePreserved: [] });
  assert.equal(existsSync(join(brainDir, DIR)), false, "the whole directory, not just the files we listed");
  assert.equal(existsSync(join(brainDir, ".claude/skills/coach/SKILL.md")), true, "and nothing beside it");
  rmSync(brainDir, { recursive: true, force: true });
});

// ── F3 (v5.0.0 code review) — RETIREMENT IS AN UPDATE-TIME ACT ────────────────
// This was the one family beside the three merge families NOT gated on
// `sourceDir !== brainDir`, so it also ran at SessionStart self-heal — which is
// spawned detached, `stdio: "ignore"`, so `skillsRetired` goes to nowhere at all.
// And provenance entries are never pruned, so a skill the owner RESTORED from their
// git history still matches its recorded digest: it was deleted again at the next
// session start, with not one word said anywhere.
//
// The gate lives HERE rather than at the call site, deliberately, and for the reason
// `fetchAncestors` gives for the same choice: this is the one place in the product
// that calls `rmSync` under `.claude/`, so no caller should have to remember.

test("F3 — a SELF-HEAL retires nothing, whatever the tombstone says", () => {
  const brainDir = brainWith({ [`${DIR}/SKILL.md`]: "# tdd-discipline\n" });
  // Everything an update would need in order to delete it: declared, and provably the
  // engine's own bytes. The ONLY thing standing between the owner and a silent deletion
  // is that this is a self-heal.
  const report = retireDeclaredSkills({
    brainDir,
    sourceDir: brainDir,
    plan: { retireSkills: [TOMBSTONE] },
    provenance: { [`${DIR}/SKILL.md`]: fp("# tdd-discipline\n") },
  });
  assert.deepEqual(report, { skillsRetired: [], skillsRetirePreserved: [] });
  assert.equal(existsSync(join(brainDir, `${DIR}/SKILL.md`)), true, "a skill the owner restored must survive their next session start");
  rmSync(brainDir, { recursive: true, force: true });
});

// 🛑 T8 — AND THE GATE MUST RECOGNISE THE BRAIN HOWEVER THE CALLER SPELLS IT. F3's gate
// compared the two paths as raw strings, so `<brainDir>/` and `<brainDir>/.` walked
// straight past it: measured on a fixture, verdict `remove`, the directory erased, and
// the report saying so swallowed by the detached child's `stdio: "ignore"`.
//
// A trailing separator is not an exotic input — `reconcile-brain`'s own `--brainDir` /
// `--sourceDir` flags are the reachable surface, and this was latent only because the two
// live call sites happen to pass the same variable twice. One typed slash is the distance
// between "nothing happens" and "a skill is deleted in silence".
test("T8 — a self-heal spelled with a trailing separator is still a self-heal", () => {
  const spellings = [
    (dir) => `${dir}/`,
    (dir) => `${dir}/.`,
    (dir) => `${dir}//`,
    (dir) => join(dir, "..", dir.split("/").pop()), // out through the parent and back in
  ];

  for (const spell of spellings) {
    const brainDir = brainWith({ [`${DIR}/SKILL.md`]: "# tdd-discipline\n" });
    const sourceDir = spell(brainDir);

    const report = retireDeclaredSkills({
      brainDir,
      sourceDir,
      plan: { retireSkills: [TOMBSTONE] },
      provenance: { [`${DIR}/SKILL.md`]: fp("# tdd-discipline\n") },
    });

    assert.deepEqual(report, { skillsRetired: [], skillsRetirePreserved: [] }, `spelled ${sourceDir}`);
    assert.equal(existsSync(join(brainDir, `${DIR}/SKILL.md`)), true, `spelled ${sourceDir}, the skill was deleted`);
    rmSync(brainDir, { recursive: true, force: true });
  }
});

// The other side of that boundary, and it is what stops the fix being "never delete
// anything": a source whose path merely STARTS with the brain's is a different directory
// and a real update, so the declared skill still goes.
test("T8 — a launcher path that merely starts with the brain's is an update, and retires", () => {
  const brainDir = brainWith({ [`${DIR}/SKILL.md`]: "# tdd-discipline\n" });
  const report = retireDeclaredSkills({
    brainDir,
    sourceDir: `${brainDir}-fetched`,
    plan: { retireSkills: [TOMBSTONE] },
    provenance: { [`${DIR}/SKILL.md`]: fp("# tdd-discipline\n") },
  });

  assert.deepEqual(report, { skillsRetired: ["tdd-discipline"], skillsRetirePreserved: [] });
  assert.equal(existsSync(join(brainDir, DIR)), false);
  rmSync(brainDir, { recursive: true, force: true });
});

// 🛑 The default FAILS TOWARDS KEEPING. A caller that says nothing has not told us this
// is an update, and "I cannot tell" must never resolve to a delete — this is the one
// door in the product that removes an owner's file.
test("F3 — a caller that names no source retires nothing either", () => {
  const brainDir = brainWith({ [`${DIR}/SKILL.md`]: "# tdd-discipline\n" });
  const report = retireDeclaredSkills({
    brainDir,
    plan: { retireSkills: [TOMBSTONE] },
    provenance: { [`${DIR}/SKILL.md`]: fp("# tdd-discipline\n") },
  });
  assert.deepEqual(report, { skillsRetired: [], skillsRetirePreserved: [] });
  assert.equal(existsSync(join(brainDir, `${DIR}/SKILL.md`)), true);
  rmSync(brainDir, { recursive: true, force: true });
});

// The half that costs the owner their work if it is wrong, so it is asserted on the
// DISK and not merely in the report: a preserved skill is still there, byte for byte.
test("one edited file and the directory stays — every byte of it, not just the edited one", () => {
  const brainDir = brainWith({
    [`${DIR}/SKILL.md`]: "# tdd-discipline\nMY OWN NOTES\n",
    [`${DIR}/examples.md`]: "untouched\n",
  });
  const report = retireDeclaredSkills({
    brainDir,
    sourceDir: UPDATE_SOURCE,
    plan: { retireSkills: [TOMBSTONE] },
    provenance: {
      [`${DIR}/SKILL.md`]: fp("# tdd-discipline\n"),
      [`${DIR}/examples.md`]: fp("untouched\n"),
    },
  });
  assert.deepEqual(report, {
    skillsRetired: [],
    skillsRetirePreserved: [{ name: "tdd-discipline", blockers: [{ rel: `${DIR}/SKILL.md`, reason: "customized" }] }],
  });
  assert.equal(readFileSync(join(brainDir, `${DIR}/SKILL.md`), "utf8"), "# tdd-discipline\nMY OWN NOTES\n");
  assert.equal(readFileSync(join(brainDir, `${DIR}/examples.md`), "utf8"), "untouched\n", "including the innocent one");
  rmSync(brainDir, { recursive: true, force: true });
});

// The commonest case in the fleet by far: the brain never had this skill. It is neither
// a deletion nor a rescue, so it must appear in NEITHER list — an owner told "preserved
// tdd-discipline" about a skill they never installed would go looking for it.
test("a brain that never had the skill hears nothing about it", () => {
  const brainDir = brainWith({ ".claude/skills/coach/SKILL.md": "# coach\n" });
  const report = retireDeclaredSkills({ brainDir, sourceDir: UPDATE_SOURCE, plan: { retireSkills: [TOMBSTONE] }, provenance: {} });
  assert.deepEqual(report, { skillsRetired: [], skillsRetirePreserved: [] });
  rmSync(brainDir, { recursive: true, force: true });
});

// A brain installed before provenance existed records nothing, and that is the fleet's
// default state — so this is the path most brains take. Nothing is deleted without proof.
test("no provenance at all — the skill stays, and the report says which files could not be proved", () => {
  const brainDir = brainWith({ [`${DIR}/SKILL.md`]: "# tdd-discipline\n" });
  const report = retireDeclaredSkills({ brainDir, sourceDir: UPDATE_SOURCE, plan: { retireSkills: [TOMBSTONE] } });
  assert.deepEqual(report, {
    skillsRetired: [],
    skillsRetirePreserved: [{ name: "tdd-discipline", blockers: [{ rel: `${DIR}/SKILL.md`, reason: "no-provenance" }] }],
  });
  assert.equal(existsSync(join(brainDir, `${DIR}/SKILL.md`)), true);
  rmSync(brainDir, { recursive: true, force: true });
});

// Two tombstones, and they must not share a fate: the report is a list, not a verdict,
// and a loop that stopped at the first decision would silently keep the second skill.
test("several tombstones are each decided on their own merits", () => {
  const brainDir = brainWith({
    [`${DIR}/SKILL.md`]: "# tdd-discipline\n",
    ".claude/skills/old-sync/SKILL.md": "# old-sync\nedited by hand\n",
  });
  const report = retireDeclaredSkills({
    brainDir,
    sourceDir: UPDATE_SOURCE,
    plan: { retireSkills: [TOMBSTONE, ".claude/skills/old-sync/**"] },
    provenance: {
      [`${DIR}/SKILL.md`]: fp("# tdd-discipline\n"),
      ".claude/skills/old-sync/SKILL.md": fp("# old-sync\n"),
    },
  });
  assert.deepEqual(report, {
    skillsRetired: ["tdd-discipline"],
    skillsRetirePreserved: [
      { name: "old-sync", blockers: [{ rel: ".claude/skills/old-sync/SKILL.md", reason: "customized" }] },
    ],
  });
  assert.equal(existsSync(join(brainDir, DIR)), false);
  assert.equal(existsSync(join(brainDir, ".claude/skills/old-sync/SKILL.md")), true);
  rmSync(brainDir, { recursive: true, force: true });
});

// An empty plan is what EVERY brain runs today and what most will keep running: a
// manifest with no tombstone at all must reach no `rmSync` and read no directory.
test("no tombstone declared — nothing is listed, nothing is removed", () => {
  const brainDir = brainWith({ ".claude/skills/coach/SKILL.md": "# coach\n" });
  const report = retireDeclaredSkills({ brainDir, sourceDir: UPDATE_SOURCE, plan: { retireSkills: [] }, provenance: {} });
  assert.deepEqual(report, { skillsRetired: [], skillsRetirePreserved: [] });
  assert.equal(existsSync(join(brainDir, ".claude/skills/coach/SKILL.md")), true);
  rmSync(brainDir, { recursive: true, force: true });
});

// Both anchors of the glob strip, each pinned by the shape that needs it. A tombstone
// is written by hand into a manifest, so neither end of `/\/\*\*?$/` is decoration:
// without the `?` a `/*` entry is not recognised as a skill dir at all, and without the
// `$` an interior `**` is stripped and the path we delete is one nobody declared.
test("a single-star tombstone is a skill directory too", () => {
  const brainDir = brainWith({ ".claude/skills/legacy/SKILL.md": "# legacy\n" });
  const report = retireDeclaredSkills({
    brainDir,
    sourceDir: UPDATE_SOURCE,
    plan: { retireSkills: [".claude/skills/legacy/*"] },
    provenance: { ".claude/skills/legacy/SKILL.md": fp("# legacy\n") },
  });
  assert.deepEqual(report, { skillsRetired: ["legacy"], skillsRetirePreserved: [] });
  assert.equal(existsSync(join(brainDir, ".claude/skills/legacy")), false);
  rmSync(brainDir, { recursive: true, force: true });
});

// 🛑 A tombstone naming a FILE rather than a directory — a hand-edited manifest, or a
// glob someone got creative with. The strip must not rewrite it into a shorter path that
// happens to exist: what we would delete then is a path nobody ever declared. It reads
// as a directory that is not there, which is the safe answer and the silent one.
test("a tombstone whose glob is not a trailing one deletes nothing, and does not throw", () => {
  const brainDir = brainWith({ [`${DIR}/SKILL.md`]: "# tdd-discipline\n" });
  const report = retireDeclaredSkills({
    brainDir,
    sourceDir: UPDATE_SOURCE,
    plan: { retireSkills: [`${DIR}/**/SKILL.md`] },
    provenance: { [`${DIR}/SKILL.md`]: fp("# tdd-discipline\n") },
  });
  assert.deepEqual(report, { skillsRetired: [], skillsRetirePreserved: [] });
  assert.equal(existsSync(join(brainDir, `${DIR}/SKILL.md`)), true, "every byte still there");
  rmSync(brainDir, { recursive: true, force: true });
});
