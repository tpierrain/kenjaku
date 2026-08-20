import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { refreshEngineScripts, selectMergeGovernedScripts } from "./engine-script-refresh.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// engine-script-refresh — the four engine scripts stop being overwritten blind
// (plan S2b-3). `auto-commit`, `auto-push`, `status-line`, `verify-rag` are
// declared `merge` and were applied `replace`: the mirror image of the skills'
// bug, and the one that can destroy an owner's edit TODAY.
//
// Twin of `engine-skill-refresh.mjs`, and deliberately as thin: the journey to
// the disk is `engine-merge-apply.mjs`'s, the decision is `engine-merge.mjs`'s.
// What is this module's own is WHICH files, that a file is its own report entry
// (a script is not a subtree), and that the merge output is SYNTAX-GATED because
// the brain executes these files at every session.
// ═══════════════════════════════════════════════════════════════════════════

const fp = (content) => "sha256:" + createHash("sha256").update(content).digest("hex");

const REL = "scripts/auto-commit.mjs";
const BASE = "export const a = 1;\n\nexport function run() {\n  return a;\n}\n";
const OWNER = "export const a = 2;\n\nexport function run() {\n  return a;\n}\n";
const ENGINE = "export const a = 1;\n\nexport function run() {\n  return a;\n}\n\nexport const added = true;\n";
const MERGED = "export const a = 2;\n\nexport function run() {\n  return a;\n}\n\nexport const added = true;\n";

const MANIFEST = {
  regimes: {
    replace: ["scripts/update-engine.mjs", "scripts/lib/**"],
    merge: ["CLAUDE.md", ".claude/skills/coach/**", "scripts/auto-commit.mjs", "scripts/auto-push.mjs"],
    local: [".engine-base/**"],
  },
};

function writeInto(root, rel, content) {
  const abs = join(root, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
  return abs;
}

function twoTrees(t, { installed, base, candidate = ENGINE } = {}) {
  const brainDir = mkdtempSync(join(tmpdir(), "sbg-script-brain-"));
  const sourceDir = mkdtempSync(join(tmpdir(), "sbg-script-src-"));
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  if (installed !== undefined) writeInto(brainDir, REL, installed);
  if (base !== undefined) writeInto(brainDir, `.engine-base/${REL}`, base);
  writeInto(sourceDir, REL, candidate);
  return { brainDir, sourceDir, sourceFiles: [REL] };
}

const run = ({ brainDir, sourceDir, sourceFiles }, rest = {}) =>
  refreshEngineScripts({ brainDir, sourceDir, sourceFiles, manifest: MANIFEST, ...rest });

const onDisk = (root, rel = REL) => readFileSync(join(root, rel), "utf8");

// ── WHICH files, and the one that must never be among them ──────────────────

test("selectMergeGovernedScripts — the merge-declared top-level scripts, and nothing else", () => {
  const manifest = {
    regimes: {
      replace: ["scripts/update-engine.mjs", "scripts/session-status.mjs", "scripts/lib/**"],
      merge: [
        "CLAUDE.md",                     // a merge file, not a script
        ".claude/settings.json",         // idem
        ".claude/skills/coach/**",       // a merge file, and a skill's business
        "scripts/auto-commit.mjs",
        "scripts/verify-rag.mjs",
      ],
    },
  };
  const sourceFiles = [
    "scripts/auto-commit.mjs",
    "scripts/verify-rag.mjs",
    "scripts/update-engine.mjs", // 🛑 `replace` — the self-update path is not a merge subject
    "scripts/session-status.mjs", // `replace` — engine internals, copied as before
    "scripts/lib/engine-merge.mjs", // `replace`, and not top-level either
    "CLAUDE.md",
    ".claude/skills/coach/SKILL.md",
  ];
  assert.deepEqual(selectMergeGovernedScripts({ sourceFiles, manifest }), [
    "scripts/auto-commit.mjs",
    "scripts/verify-rag.mjs",
  ]);
});

// A brain whose manifest declares a script the SOURCE no longer ships must not be
// asked to read a file that is not there. The selection is an intersection, never a
// replay of the manifest.
test("selectMergeGovernedScripts — a declared script the source does not carry is skipped", () => {
  const manifest = { regimes: { merge: ["scripts/auto-commit.mjs", "scripts/retired.mjs"] } };
  assert.deepEqual(selectMergeGovernedScripts({ sourceFiles: ["scripts/auto-commit.mjs"], manifest }), [
    "scripts/auto-commit.mjs",
  ]);
});

// ── The bug this slice exists to end ────────────────────────────────────────

// Today the owner's edit is destroyed outright: the script is copied over. Here
// both land, through real git, and the base advances to the CANDIDATE — never to
// the merged bytes, or the next update would read the file as untouched and
// fast-forward over the edit that was just preserved.
test("an edited script keeps the owner's edit AND receives the update", (t) => {
  const trees = twoTrees(t, { installed: OWNER, base: BASE });
  const report = run(trees, { provenance: { [REL]: fp(BASE) } });

  assert.equal(onDisk(trees.brainDir), MERGED);
  assert.deepEqual(report.scriptsMerged, [REL]);
  assert.deepEqual(report.scriptsPreserved, []);
  assert.deepEqual(report.refreshedFileMap, { [REL]: ENGINE });
  assert.ok(!existsSync(join(trees.brainDir, `${REL}.new`)), "a clean merge asks the owner for nothing");
});

// The common case, and the one that must not regress: nobody touched the script,
// so it is brought up to date exactly as the copy used to do it.
test("an untouched script still fast-forwards, exactly as the copy did", (t) => {
  const trees = twoTrees(t, { installed: BASE, base: BASE });
  const report = run(trees, { provenance: { [REL]: fp(BASE) } });

  assert.equal(onDisk(trees.brainDir), ENGINE);
  assert.deepEqual(report.scriptsRefreshed, [REL]);
  assert.deepEqual(report.refreshedFileMap, { [REL]: ENGINE });
});

// One line per FILE, not per subtree: a script is its own subject, and "your
// scripts kept your edits" would tell an owner nothing about which one to look at.
test("each script is its own report entry", (t) => {
  const second = "scripts/auto-push.mjs";
  const brainDir = mkdtempSync(join(tmpdir(), "sbg-script-brain-"));
  const sourceDir = mkdtempSync(join(tmpdir(), "sbg-script-src-"));
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  for (const rel of [REL, second]) {
    writeInto(brainDir, rel, OWNER);
    writeInto(brainDir, `.engine-base/${rel}`, BASE);
    writeInto(sourceDir, rel, ENGINE);
  }

  const report = refreshEngineScripts({
    brainDir,
    sourceDir,
    sourceFiles: [REL, second],
    manifest: MANIFEST,
    provenance: { [REL]: fp(BASE), [second]: fp(BASE) },
  });

  assert.deepEqual(report.scriptsMerged, [REL, second]);
});

// ── The gate, wired by default and not by the caller ────────────────────────

// 🛑 THE reason this module exists rather than a second call to the skills'. These
// files are EXECUTED — `auto-commit.mjs` at every Stop hook — so a clean merge that
// happens not to parse would leave a brain that silently stops committing itself.
// The gate is this module's OWN default: a caller that forgets it is not a caller
// that ships a broken hook.
test("a merge that would not parse is preserved, not written — and the gate is the default", (t) => {
  const trees = twoTrees(t, { installed: OWNER, base: BASE });
  // Real git would not produce this; the injected merge stands in for the day it
  // does. What is under test is that the module ASKS, not what node answers.
  const report = run(trees, {
    provenance: { [REL]: fp(BASE) },
    merge: () => ({ clean: true, merged: "export function broken( {\n" }),
  });

  assert.equal(onDisk(trees.brainDir), OWNER, "the owner's working script stands");
  assert.deepEqual(report.scriptsPreserved, [{ name: REL, reason: "merge-unsafe", newVersionPath: `${REL}.new` }]);
  assert.deepEqual(report.scriptsMerged, []);
  assert.equal(onDisk(trees.brainDir, `${REL}.new`), ENGINE);
  assert.deepEqual(report.refreshedFileMap, {}, "nothing delivered, so the ancestor must stand");
});

// The gate's other half: bytes that DO parse go through untouched. Without this the
// test above would pass on a module that preserves everything.
test("a merge that parses is written, so the gate is a gate and not a wall", (t) => {
  const trees = twoTrees(t, { installed: OWNER, base: BASE });
  const report = run(trees, { provenance: { [REL]: fp(BASE) } });
  assert.equal(onDisk(trees.brainDir), MERGED);
  assert.deepEqual(report.scriptsMerged, [REL]);
});

// ── The clash, and the file that must never carry markers ───────────────────

test("a real clash leaves the script alone and hands over a MARKED merge", (t) => {
  const theirs = "export const a = 3;\n\nexport function run() {\n  return a;\n}\n";
  const trees = twoTrees(t, { installed: OWNER, base: BASE, candidate: theirs });
  const report = run(trees, { provenance: { [REL]: fp(BASE) } });

  assert.equal(onDisk(trees.brainDir), OWNER, "conflict markers never reach a file the brain RUNS");
  assert.deepEqual(report.scriptConflicts, [{ name: REL, newVersionPath: `${REL}.new` }]);
  assert.deepEqual(report.refreshedFileMap, {});
  assert.ok(onDisk(trees.brainDir, `${REL}.new`).includes("<<<<<<< your version"));
});

// ── The fleet, which holds no ancestor yet ──────────────────────────────────

// `reconcileBrain` runs this before `syncBaseTree` lays the tree down, so on the
// first update of every brain installed before S1 there is no ancestor at all. An
// edited script must then be PRESERVED — which is already better than today, where
// it is silently overwritten.
test("with no ancestor, an edited script is preserved instead of being overwritten", (t) => {
  const trees = twoTrees(t, { installed: OWNER });
  const report = run(trees, { provenance: { [REL]: fp(BASE) } });

  assert.equal(onDisk(trees.brainDir), OWNER, "the edit this release exists to stop destroying");
  assert.deepEqual(report.scriptsPreserved, [{ name: REL, reason: "customized", newVersionPath: `${REL}.new` }]);
  assert.equal(onDisk(trees.brainDir, `${REL}.new`), ENGINE);
});

// ⚠️ The regression that would hurt most: a brain with no ancestor whose scripts
// NOBODY touched must still receive them. Left to `preserve`, the whole fleet would
// stop receiving engine-script fixes on the very release that unfreezes them.
test("with no ancestor, an UNTOUCHED script still fast-forwards", (t) => {
  const trees = twoTrees(t, { installed: BASE });
  const report = run(trees, { provenance: { [REL]: fp(BASE) } });

  assert.equal(onDisk(trees.brainDir), ENGINE);
  assert.deepEqual(report.scriptsRefreshed, [REL]);
});

// ── The guard that keeps a self-heal harmless ───────────────────────────────

test("sourceDir === brainDir writes nothing and reports nothing", (t) => {
  const trees = twoTrees(t, { installed: OWNER, base: BASE });
  const report = refreshEngineScripts({
    brainDir: trees.brainDir,
    sourceDir: trees.brainDir,
    sourceFiles: [REL],
    manifest: MANIFEST,
    provenance: { [REL]: fp(BASE) },
  });

  assert.deepEqual(report, {
    scriptsRefreshed: [],
    scriptsPreserved: [],
    scriptsMerged: [],
    scriptConflicts: [],
    refreshedFileMap: {},
  });
  assert.equal(onDisk(trees.brainDir), OWNER);
});
