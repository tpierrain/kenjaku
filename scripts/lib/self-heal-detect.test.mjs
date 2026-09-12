import { test } from "node:test";
import assert from "node:assert/strict";
import { detectSelfHealGap, missingInstalledDependencies } from "./self-heal-detect.mjs";

// detectSelfHealGap is now a PURE gate over EXPLICIT desired-state lists (F-B7 2g):
// the wrapper derives `wantedSkillDirs` (engine merge skills ∪ staged engine-skills/)
// and `wantedServerIds` (keys of the DELIVERED .mcp.json.template) and feeds them in.
// The gate no longer reads a manifest itself — it just diffs wanted vs present.
const WANTED = {
  wantedSkillDirs: [".claude/skills/local-mirror", ".claude/skills/update-engine"],
  wantedServerIds: ["vault-rag", "local-mirror"],
};

test("detectSelfHealGap — converged brain (all skills + servers present) → not needed", () => {
  const gap = detectSelfHealGap({
    ...WANTED,
    skillDirExists: () => true,
    mcpServerRegistered: () => true,
  });
  assert.equal(gap.needed, false);
});

test("detectSelfHealGap — a freshly-shipped skill not yet installed → needed, named", () => {
  const gap = detectSelfHealGap({
    ...WANTED,
    skillDirExists: (dir) => dir !== ".claude/skills/local-mirror",
    mcpServerRegistered: () => true,
  });
  assert.equal(gap.needed, true);
  assert.deepEqual(gap.missingSkills, [".claude/skills/local-mirror"]);
  assert.deepEqual(gap.missingServers, []);
});

test("detectSelfHealGap — a freshly-shipped MCP server not yet registered → needed, named", () => {
  const gap = detectSelfHealGap({
    ...WANTED,
    skillDirExists: () => true,
    mcpServerRegistered: (id) => id !== "local-mirror",
  });
  assert.equal(gap.needed, true);
  assert.deepEqual(gap.missingSkills, []);
  assert.deepEqual(gap.missingServers, ["local-mirror"]);
});

// Every list here defaults to empty, and the defaults are the whole safety of the
// gate: a caller that has not ASKED a question must be told nothing found — never
// nothing wrong, and never a gap it did not describe. Omitting them is the only way
// to exercise the defaults; passing `[]` exercises the caller instead.
test("detectSelfHealGap — a caller that names no desired state at all reports nothing, and asks the disk nothing", () => {
  const asked = [];
  const gap = detectSelfHealGap({
    skillDirExists: (dir) => {
      asked.push(dir);
      return false;
    },
    mcpServerRegistered: (id) => {
      asked.push(id);
      return false;
    },
  });
  assert.deepEqual(gap, {
    needed: false,
    missingSkills: [],
    missingServers: [],
    unwiredHooks: [],
    missingDependencies: [],
  });
  assert.deepEqual(asked, [], "an undescribed desired state must not be invented on the caller's behalf");
});

test("detectSelfHealGap — empty wanted lists → never needed (a brain that delivers no spec yet)", () => {
  const gap = detectSelfHealGap({
    wantedSkillDirs: [],
    wantedServerIds: [],
    skillDirExists: () => false,
    mcpServerRegistered: () => false,
  });
  assert.equal(gap.needed, false);
});

// ═══════════════════════════════════════════════════════════════════════════
// #96 — the gate asked two questions and an engine update makes THREE kinds of
// promise. Files travel through git; machine-local wiring does not.
//
// An owner running one brain on two machines updates on A. B pulls, reports the
// same version, and is missing whatever the release put in `.claude/settings.json`
// (which hooks run) or in `rag/node_modules` — both gitignored by construction. A
// new skill or MCP server was noticed; a new HOOK was not, and a hook that was
// never wired runs never, so it cannot report its own absence.
//
// Both new questions are asked the same way as the first two: the desired state is
// derived from the files the engine DELIVERS, never from a frozen record.
// ═══════════════════════════════════════════════════════════════════════════

test("detectSelfHealGap — a hook the engine delivers but this machine never wired → needed, named", () => {
  const gap = detectSelfHealGap({
    ...WANTED,
    skillDirExists: () => true,
    mcpServerRegistered: () => true,
    unwiredHooks: ["scripts/prompt-restart-nudge.mjs"],
  });
  assert.equal(gap.needed, true);
  assert.deepEqual(gap.unwiredHooks, ["scripts/prompt-restart-nudge.mjs"]);
  assert.deepEqual(gap.missingSkills, []);
  assert.deepEqual(gap.missingServers, []);
});

test("detectSelfHealGap — a dependency the new engine declares and this machine never installed → needed, named", () => {
  const gap = detectSelfHealGap({
    ...WANTED,
    skillDirExists: () => true,
    mcpServerRegistered: () => true,
    missingDependencies: ["js-yaml"],
  });
  assert.equal(gap.needed, true);
  assert.deepEqual(gap.missingDependencies, ["js-yaml"]);
});

test("detectSelfHealGap — a converged brain reports all four answers empty", () => {
  const gap = detectSelfHealGap({
    ...WANTED,
    skillDirExists: () => true,
    mcpServerRegistered: () => true,
    unwiredHooks: [],
    missingDependencies: [],
  });
  assert.deepEqual(gap, {
    needed: false,
    missingSkills: [],
    missingServers: [],
    unwiredHooks: [],
    missingDependencies: [],
  });
});

// A caller that predates the two new questions must not be told a brain is broken —
// nor that it is fine on a question it never asked. Absent means UNASKED, and an
// unasked question is reported as nothing found rather than as nothing wrong.
test("detectSelfHealGap — a caller that supplies neither new list behaves exactly as before", () => {
  const gap = detectSelfHealGap({
    ...WANTED,
    skillDirExists: () => true,
    mcpServerRegistered: () => true,
  });
  assert.equal(gap.needed, false);
  assert.deepEqual(gap.unwiredHooks, []);
  assert.deepEqual(gap.missingDependencies, []);
});

// ── The dependency half, on its own ────────────────────────────────────────
test("missingInstalledDependencies — names a declared package this machine never installed", () => {
  const missing = missingInstalledDependencies({
    declared: ["better-sqlite3", "js-yaml", "gray-matter"],
    isInstalled: (name) => name !== "js-yaml",
  });
  assert.deepEqual(missing, ["js-yaml"]);
});

test("missingInstalledDependencies — a fully installed tree reports nothing", () => {
  assert.deepEqual(
    missingInstalledDependencies({ declared: ["a", "b"], isInstalled: () => true }),
    [],
  );
});

// Same reason as the gate's own defaults above: `declared` omitted, not `declared: []`.
test("missingInstalledDependencies — a caller that declares nothing at all touches nothing", () => {
  const asked = [];
  const missing = missingInstalledDependencies({
    isInstalled: (name) => {
      asked.push(name);
      return false;
    },
  });
  assert.deepEqual(missing, []);
  assert.deepEqual(asked, []);
});

test("missingInstalledDependencies — a brain declaring nothing asks nothing of the disk", () => {
  const asked = [];
  const missing = missingInstalledDependencies({
    declared: [],
    isInstalled: (name) => {
      asked.push(name);
      return false;
    },
  });
  assert.deepEqual(missing, []);
  assert.deepEqual(asked, [], "an empty declaration must not touch the filesystem at all");
});
