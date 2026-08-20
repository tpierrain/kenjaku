import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { refreshUntouchedSkills, refreshableSkillPairs, selectRefreshableSkillFiles } from "./engine-skill-refresh.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// engine-skill-refresh — the I/O orchestrator that carries S2's verdict to the
// skills (plan S2a-3). The DECISION itself moved out to `engine-merge.mjs` and is
// tested there against its nine rows; what is tested here is what reaches the
// disk, since that is all this module does.
//
// Until this slice, "the owner touched it" had exactly one outcome: preserve, and
// drop the engine's version beside it forever. Now the common case — they edited
// one region, the engine another — MERGES, and only a real clash still costs
// anyone anything.
//
// House pattern for an fs-touching lib module: real `node:fs` against a temp dir,
// and real git for the merges. A double that ignores its arguments certifies
// nothing, and this module's whole job IS its arguments reaching the disk.
// ═══════════════════════════════════════════════════════════════════════════

const fp = (content) => "sha256:" + createHash("sha256").update(content).digest("hex");

const REL = ".claude/skills/coach/SKILL.md";
const BASE = "# Coach\n\nthe intro paragraph\n\nthe body paragraph\n";
const OWNER = "# Coach\n\nthe intro paragraph, extended by the owner\n\nthe body paragraph\n";
const ENGINE = "# Coach\n\nthe intro paragraph\n\nthe body paragraph\n\n## A section the engine added\n\nnew\n";
const MERGED = "# Coach\n\nthe intro paragraph, extended by the owner\n\nthe body paragraph\n\n## A section the engine added\n\nnew\n";

const MANIFEST = { regimes: { merge: [".claude/skills/coach/**"], local: [".engine-base/**"] } };

function writeInto(root, rel, content) {
  const abs = join(root, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
  return abs;
}

// One brain, one source tree, both real. `sourceDir === brainDir` is the
// SessionStart self-heal guard, so they must never be the same directory.
function twoTrees(t, { installed, base, candidate = ENGINE, extra = {} }) {
  const brainDir = mkdtempSync(join(tmpdir(), "sbg-refresh-brain-"));
  const sourceDir = mkdtempSync(join(tmpdir(), "sbg-refresh-src-"));
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  if (installed !== undefined) writeInto(brainDir, REL, installed);
  if (base !== undefined) writeInto(brainDir, `.engine-base/${REL}`, base);
  writeInto(sourceDir, REL, candidate);
  for (const [rel, content] of Object.entries(extra)) writeInto(sourceDir, rel, content);
  return { brainDir, sourceDir, sourceFiles: [REL, ...Object.keys(extra)] };
}

const run = ({ brainDir, sourceDir, sourceFiles }, { provenance, ...rest } = {}) =>
  refreshUntouchedSkills({ brainDir, sourceDir, sourceFiles, manifest: MANIFEST, provenance, ...rest });

const onDisk = (brainDir, rel = REL) => readFileSync(join(brainDir, rel), "utf8");

// ── The case this whole chantier exists for ──────────────────────────────────

// The owner edited one paragraph, the engine added a section. Today this costs the
// owner the update, permanently and silently; here both land, through real git.
test("the owner's edit and the engine's update both land, and the BASE gets the candidate", (t) => {
  const trees = twoTrees(t, { installed: OWNER, base: BASE });
  const report = run(trees, { provenance: { [REL]: fp(BASE) } });

  assert.equal(onDisk(trees.brainDir), MERGED);
  assert.deepEqual(report.skillsMerged, ["coach"]);
  assert.deepEqual(report.skillsRefreshed, []);
  assert.deepEqual(report.skillsPreserved, []);
  // THE trap, at its only real call site: the map feeds `reseedProvenance` and
  // `syncBaseTree`, so it must carry what the ENGINE delivered. Carrying the merged
  // bytes would make the file read untouched at the next update, and the
  // fast-forward would clobber the very edit that was just preserved.
  assert.deepEqual(report.refreshedFileMap, { [REL]: ENGINE });
  assert.ok(!existsSync(join(trees.brainDir, `${REL}.new`)), "a clean merge asks the owner for nothing");
});

// The one case that costs a human anything: both sides rewrote the same line. The
// engine keeps its hands off the file entirely, and hands over a marked-up copy —
// which is worth more than the bare candidate, since everything mergeable is
// already merged in it.
test("a real clash leaves the file alone and hands over a MARKED merge, not the bare candidate", (t) => {
  const theirs = "# Coach\n\nthe intro paragraph, rewritten by the engine\n\nthe body paragraph\n";
  const trees = twoTrees(t, { installed: OWNER, base: BASE, candidate: theirs });
  const report = run(trees, { provenance: { [REL]: fp(BASE) } });

  assert.equal(onDisk(trees.brainDir), OWNER, "the owner's file is never touched on a conflict");
  assert.deepEqual(report.conflicts, [{ skill: "coach", newVersionPath: `${REL}.new` }]);
  assert.deepEqual(report.skillsMerged, []);
  // Absent from the map: the engine delivered nothing, so the base must stand where
  // it is. An advanced base would claim content this file never received.
  assert.deepEqual(report.refreshedFileMap, {});
  const sidecar = onDisk(trees.brainDir, `${REL}.new`);
  assert.ok(sidecar.includes("<<<<<<< your version"), "the markers name the sides");
  assert.ok(sidecar.includes("extended by the owner") && sidecar.includes("rewritten by the engine"));
});

// ── The fleet, which holds no ancestor yet ───────────────────────────────────

// `reconcileBrain` runs this refresh BEFORE `syncBaseTree` lays the tree down, so
// on the first update of every brain installed before S1 there is no ancestor at
// all. Both halves of today's behaviour must survive that, or the release that
// exists to unfreeze skills would freeze them instead.
test("with no ancestor on disk, a customized skill degrades to exactly today's behaviour", (t) => {
  const trees = twoTrees(t, { installed: OWNER });
  const report = run(trees, { provenance: { [REL]: fp(BASE) } });

  assert.equal(onDisk(trees.brainDir), OWNER);
  assert.deepEqual(report.skillsPreserved, [{ skill: "coach", reason: "customized", newVersionPath: `${REL}.new` }]);
  assert.equal(onDisk(trees.brainDir, `${REL}.new`), ENGINE, "the sidecar is the engine's version, as before");
  assert.deepEqual(report.refreshedFileMap, {});
});

test("with no ancestor on disk, an UNTOUCHED skill still fast-forwards", (t) => {
  const trees = twoTrees(t, { installed: BASE });
  const report = run(trees, { provenance: { [REL]: fp(BASE) } });

  assert.equal(onDisk(trees.brainDir), ENGINE);
  assert.deepEqual(report.skillsRefreshed, ["coach"]);
  assert.deepEqual(report.refreshedFileMap, { [REL]: ENGINE });
});

// ── The noise this slice removes ─────────────────────────────────────────────

// Today a customized skill is handed a `.new` at EVERY update, even when the engine
// has shipped nothing new — a sidecar byte-identical to the base. It teaches owners
// to ignore the one sidecar that will matter when a real conflict comes.
test("no sidecar for an update that never came, and a stale one is cleared", (t) => {
  const trees = twoTrees(t, { installed: OWNER, base: BASE, candidate: BASE });
  writeInto(trees.brainDir, `${REL}.new`, "a claim left by a previous run\n");
  const report = run(trees, { provenance: { [REL]: fp(BASE) } });

  assert.equal(onDisk(trees.brainDir), OWNER);
  assert.deepEqual(report.skillsPreserved, []);
  assert.deepEqual(report.conflicts, []);
  assert.ok(!existsSync(join(trees.brainDir, `${REL}.new`)), "a sidecar nothing backs any more is a lie");
});

// ── One line per SKILL, not per file ─────────────────────────────────────────

// A skill is a SUBTREE, and an owner who edited two of its files edited ONE skill.
// What they need to hear is "your coach kept your edits", not a path list — and a
// conflict named twice reads as two problems to resolve. Both new outcomes are
// asserted here because each keeps its own list, so each can lose the rule alone.
test("a skill whose two files both merge, then both clash, is named exactly once", (t) => {
  const OTHER = ".claude/skills/coach/references/notes.md";
  const brainDir = mkdtempSync(join(tmpdir(), "sbg-refresh-brain-"));
  const sourceDir = mkdtempSync(join(tmpdir(), "sbg-refresh-src-"));
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const provenance = { [REL]: fp(BASE), [OTHER]: fp(BASE) };
  const sourceFiles = [REL, OTHER];
  for (const rel of sourceFiles) {
    writeInto(brainDir, rel, OWNER);
    writeInto(brainDir, `.engine-base/${rel}`, BASE);
  }

  for (const rel of sourceFiles) writeInto(sourceDir, rel, ENGINE);
  const merged = refreshUntouchedSkills({ brainDir, sourceDir, sourceFiles, manifest: MANIFEST, provenance });
  assert.deepEqual(merged.skillsMerged, ["coach"]);

  const clashing = "# Coach\n\nthe intro paragraph, rewritten by the engine\n\nthe body paragraph\n";
  for (const rel of sourceFiles) {
    writeInto(brainDir, rel, OWNER);
    writeInto(sourceDir, rel, clashing);
  }
  const clashed = refreshUntouchedSkills({ brainDir, sourceDir, sourceFiles, manifest: MANIFEST, provenance });
  assert.deepEqual(clashed.conflicts, [{ skill: "coach", newVersionPath: `${REL}.new` }]);
  assert.deepEqual(clashed.skillsMerged, []);
});

// ── When git itself fails ────────────────────────────────────────────────────

// The seam THROWS on a technical failure rather than returning a conflict. If that
// throw escaped, one hiccup on one skill would take down the whole update — so it
// degrades this file to what a brain without an ancestor gets, and the run goes on.
test("a git that cannot run costs one skill its merge, not the whole update", (t) => {
  const trees = twoTrees(t, {
    installed: OWNER,
    base: BASE,
    extra: { ".claude/skills/coach/references/notes.md": "a reference file the engine adds\n" },
  });
  const report = run(trees, {
    provenance: { [REL]: fp(BASE) },
    merge: () => {
      throw new Error("git merge-file could not run: ENOENT");
    },
  });

  assert.equal(onDisk(trees.brainDir), OWNER, "the owner's file is never the casualty of a broken tool");
  assert.deepEqual(report.skillsPreserved, [{ skill: "coach", reason: "merge-failed", newVersionPath: `${REL}.new` }]);
  assert.equal(onDisk(trees.brainDir, `${REL}.new`), ENGINE);
  assert.deepEqual(
    report.refreshedFileMap,
    { ".claude/skills/coach/references/notes.md": "a reference file the engine adds\n" },
    "the other file of the same run still gets delivered",
  );
});

// ── Which files are even ELIGIBLE for the refresh ────────────────────────────
test("selectRefreshableSkillFiles — the engine-declared SKILL files, and nothing else", () => {
  const manifest = {
    regimes: {
      merge: [".claude/skills/coach/**", ".claude/skills/switch/**", "CLAUDE.md", "scripts/auto-commit.mjs"],
    },
  };
  const sourceFiles = [
    ".claude/skills/coach/SKILL.md",
    ".claude/skills/coach/references/radical-candor.md",
    ".claude/skills/switch/SKILL.md",
    ".claude/skills/zzz-mine/SKILL.md", // home-made → the manifest never names it
    "CLAUDE.md", // a merge file, but the constitution stays a Gate 4 concern
    "scripts/auto-commit.mjs", // a merge file, but not a skill
    "templates/fr/.claude/skills/coach/SKILL.md", // a SOURCE for a locale, not a target path
    "rag/src/index.ts",
  ];
  assert.deepEqual(selectRefreshableSkillFiles({ sourceFiles, manifest }), [
    ".claude/skills/coach/SKILL.md",
    ".claude/skills/coach/references/radical-candor.md",
    ".claude/skills/switch/SKILL.md",
  ]);
});

test("refreshableSkillPairs — a loose file directly under engine-skills/ is NOT a staged skill", () => {
  // A staged skill is `engine-skills/<name>/<file>`; the SKILL NAME is that first segment.
  // A file sitting directly under `engine-skills/` has no such segment, so mapping it would
  // aim at `.claude/skills/README.md` — a file loose in the skills root, belonging to no
  // skill. Since the refresh now DELIVERS what is absent, an unguarded prefix would write
  // that file into the owner's skills folder instead of merely ignoring it.
  const manifest = { regimes: { merge: [".claude/skills/switch/**"] } };
  const sourceFiles = [
    "engine-skills/README.md", // loose: no skill segment
    "engine-skills/lint/SKILL.md", // a genuine staged skill
    "engine-skills/local-mirror/references/scopes.md", // nested deeper, still genuine
    ".claude/skills/switch/SKILL.md",
  ];
  assert.deepEqual(refreshableSkillPairs({ sourceFiles, manifest }), [
    { rel: ".claude/skills/switch/SKILL.md", sourceRel: ".claude/skills/switch/SKILL.md" },
    { rel: ".claude/skills/lint/SKILL.md", sourceRel: "engine-skills/lint/SKILL.md" },
    {
      rel: ".claude/skills/local-mirror/references/scopes.md",
      sourceRel: "engine-skills/local-mirror/references/scopes.md",
    },
  ]);
});
