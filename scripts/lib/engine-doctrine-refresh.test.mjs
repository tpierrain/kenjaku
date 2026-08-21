import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { refreshEngineDoctrine, selectMergeGovernedDoctrine } from "./engine-doctrine-refresh.mjs";
import { computeApplyPlan } from "./engine-apply-plan.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// engine-doctrine-refresh — the engine's half of the constitution stops being
// frozen at install day (plan S5b). `CLAUDE.engine.md` was in NO regime for the
// product's whole life: the field finding of 2026-08-08 measured 12 commits of
// doctrine, on a brain running the LATEST tag, that had never arrived — 11 391
// bytes, +43 %, silently missing.
//
// The THIRD merge family, and the thinnest. The journey to the disk is
// `engine-merge-apply.mjs`'s, the decision is `engine-merge.mjs`'s nine rows,
// WHICH file is `engine-apply-plan.mjs`'s one exported predicate. What is left
// for this module is two deliberate absences, and both are pinned below:
//   • NO syntax gate. Its twin `engine-script-refresh.mjs` has one because the
//     brain EXECUTES those files; doctrine is read, by an agent, as prose. A gate
//     here would downgrade every constitution merge to `merge-unsafe` and freeze
//     the layer this slice exists to unfreeze.
//   • The file IS its own report entry (`groupOf: rel => rel`), like a script and
//     unlike a skill subtree — there is exactly one of it.
// ═══════════════════════════════════════════════════════════════════════════

const fp = (content) => "sha256:" + createHash("sha256").update(content).digest("hex");

const REL = "CLAUDE.engine.md";
const BASE = "# Doctrine\n\nRule one.\n\nRule two.\n";
const OWNER = "# Doctrine\n\nRule one, as I prefer it.\n\nRule two.\n";
const ENGINE = "# Doctrine\n\nRule one.\n\nRule two.\n\nRule three.\n";
const MERGED = "# Doctrine\n\nRule one, as I prefer it.\n\nRule two.\n\nRule three.\n";

const MANIFEST = {
  regimes: {
    replace: ["scripts/lib/**", "scripts/update-engine.mjs"],
    merge: ["CLAUDE.md", ".claude/skills/coach/**", "scripts/auto-commit.mjs", REL],
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
  const brainDir = mkdtempSync(join(tmpdir(), "sbg-doctrine-brain-"));
  const sourceDir = mkdtempSync(join(tmpdir(), "sbg-doctrine-src-"));
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
  refreshEngineDoctrine({ brainDir, sourceDir, sourceFiles, manifest: MANIFEST, ...rest });

const onDisk = (root, rel = REL) => readFileSync(join(root, rel), "utf8");

// ── WHICH file, and the four it must never be confused with ─────────────────

// 🛑 One dot separates the engine's constitution from the OWNER's. `CLAUDE.md` is
// sacred (ADR 0003/0012); delivering it here would overwrite the one file the
// product tells its owners to make their own. The other three shapes are each
// reachable on a real tree: the sidecar the carrier itself drops, the locale source
// (the manifest names the DESTINATION rel and the locale is resolved at delivery —
// a second entry would be a second owner for one fact), and a copy in the vault.
test("selectMergeGovernedDoctrine — the engine's constitution, and never the owner's", () => {
  const sourceFiles = [
    "CLAUDE.md",
    "CLAUDE.engine.md",
    "CLAUDE.engine.md.new",
    "templates/fr/CLAUDE.engine.md",
    "vault/notes/CLAUDE.engine.md",
    "scripts/auto-commit.mjs",
    ".claude/skills/coach/SKILL.md",
  ];
  assert.deepEqual(selectMergeGovernedDoctrine({ sourceFiles, manifest: MANIFEST }), [REL]);
});

// The selection is an INTERSECTION with what the source ships, never a replay of
// the manifest: a brain whose manifest still names a file the engine has since
// retired must not be asked to read a file that is not there.
test("selectMergeGovernedDoctrine — declared but not shipped is skipped, not read", () => {
  assert.deepEqual(selectMergeGovernedDoctrine({ sourceFiles: ["CLAUDE.md"], manifest: MANIFEST }), []);
});

// ⚠️ Two selections must agree, or the file is delivered twice or not at all: the
// ALLOWLIST (what the engine is permitted to write, `computeApplyPlan`) and the
// DELIVERY (what this module actually writes). Its twin `engine-script-refresh.mjs`
// warns about that drift in a comment and duplicates the pattern anyway; here the
// predicate has ONE owner and is imported, so this test pins the property rather
// than a promise.
test("the allowlist and the delivery name the same file — one predicate, one owner", () => {
  assert.deepEqual(
    selectMergeGovernedDoctrine({ sourceFiles: [REL, "CLAUDE.md"], manifest: MANIFEST }),
    computeApplyPlan(MANIFEST).mergeDoctrine,
  );
});

// ── What the unfreeze is for ────────────────────────────────────────────────

// The common case, and the whole point: nobody edits the engine layer (the product
// tells them to write in `CLAUDE.md`), so the doctrine finally moves.
test("an untouched constitution receives the update", (t) => {
  const trees = twoTrees(t, { installed: BASE, base: BASE });
  const report = run(trees, { provenance: { [REL]: fp(BASE) } });

  assert.equal(onDisk(trees.brainDir), ENGINE);
  assert.deepEqual(report.doctrineRefreshed, [REL]);
  assert.deepEqual(report.refreshedFileMap, { [REL]: ENGINE });
});

// An owner who DID edit the engine layer — against the product's advice, but their
// disk — keeps the edit and still gets the new doctrine. The base advances to the
// CANDIDATE, never to the merged bytes, or the next update would read the file as
// untouched and fast-forward over the edit just preserved.
test("an edited constitution keeps the owner's words AND receives the update", (t) => {
  const trees = twoTrees(t, { installed: OWNER, base: BASE });
  const report = run(trees, { provenance: { [REL]: fp(BASE) } });

  assert.equal(onDisk(trees.brainDir), MERGED);
  assert.deepEqual(report.doctrineMerged, [REL]);
  assert.deepEqual(report.doctrinePreserved, []);
  assert.deepEqual(report.refreshedFileMap, { [REL]: ENGINE });
  assert.ok(!existsSync(join(trees.brainDir, `${REL}.new`)), "a clean merge asks the owner for nothing");
});

// ── 🛑 THE FINDING THE RELEASE NOTE MUST NOT OVERSTATE ──────────────────────

// EVERY brain deployed before this release is this test. The file was in no regime,
// so no provenance was ever recorded for it → nothing can be PROVEN about the bytes
// on disk, so they stand. S5 does not unfreeze those brains; it stops them being
// SILENT (S4's report and session line now name the file and say why). Claiming the
// freeze is over would be false until the ancestor machine lands.
test("a brain with NO provenance keeps its constitution — reported, not delivered", (t) => {
  const trees = twoTrees(t, { installed: OWNER });
  const report = run(trees, { provenance: {} });

  assert.equal(onDisk(trees.brainDir), OWNER, "unproven bytes are never overwritten");
  assert.deepEqual(report.doctrinePreserved, [{ name: REL, reason: "no-provenance" }]);
  assert.deepEqual(report.refreshedFileMap, {}, "and no ancestor is invented from them");
  assert.ok(
    !existsSync(join(trees.brainDir, `${REL}.new`)),
    "no sidecar either: 'we cannot prove anything' is not an offer, and a 37 KB unexplained .new is noise",
  );
});

// The other half, or the test above would pass on a module that reports everything
// forever: a brain already holding these exact bytes needs nothing and must appear
// on NO list. Otherwise every update, for the rest of that brain's life, shows a
// phantom entry about a file that is perfectly up to date.
test("a brain with no provenance but the right bytes is not reported at all", (t) => {
  const trees = twoTrees(t, { installed: ENGINE });
  const report = run(trees, { provenance: {} });

  assert.deepEqual(report, {
    doctrineRefreshed: [],
    doctrinePreserved: [],
    doctrineMerged: [],
    doctrineConflicts: [],
    refreshedFileMap: {},
  });
});

// ── The clash ───────────────────────────────────────────────────────────────

test("a real clash leaves the constitution alone and hands over a MARKED merge", (t) => {
  const theirs = "# Doctrine\n\nRule one, restated by the engine.\n\nRule two.\n";
  const trees = twoTrees(t, { installed: OWNER, base: BASE, candidate: theirs });
  const report = run(trees, { provenance: { [REL]: fp(BASE) } });

  assert.equal(onDisk(trees.brainDir), OWNER, "conflict markers never reach the file the agent READS as doctrine");
  assert.deepEqual(report.doctrineConflicts, [{ name: REL, newVersionPath: `${REL}.new` }]);
  assert.deepEqual(report.refreshedFileMap, {}, "a conflict delivers nothing, so the ancestor stands");
  assert.ok(onDisk(trees.brainDir, `${REL}.new`).includes("<<<<<<< your version"));
});

// ── The gate this family deliberately does NOT have ─────────────────────────

// 🛑 The one line that would freeze the layer again if someone copied the twin
// wholesale. `engine-script-refresh.mjs` defaults `verifyWrite` to `parsesAsModule`
// because the brain RUNS those files at every session. Doctrine is prose: it parses
// as nothing, is executed by nothing, and a syntax gate here would refuse every
// merge it ever produced. The bytes below are deliberately not valid JavaScript.
test("prose is never syntax-gated — a merge that parses as no module still lands", (t) => {
  const trees = twoTrees(t, { installed: OWNER, base: BASE });
  const prose = "# Doctrine\n\nRule one: function( { unbalanced — and perfectly fine in a sentence.\n";
  const report = run(trees, {
    provenance: { [REL]: fp(BASE) },
    merge: () => ({ clean: true, merged: prose }),
  });

  assert.equal(onDisk(trees.brainDir), prose);
  assert.deepEqual(report.doctrineMerged, [REL]);
  assert.deepEqual(report.doctrinePreserved, [], "nothing is downgraded to `merge-unsafe` on this path");
});

// ── The locale, which is why the regime could be `merge` at all ─────────────

// The Gate-1 lock deferred this whole slice until propagation was locale-aware, "or
// a FR brain would be re-anglicized on upgrade". The carrier already resolves
// `templates/<locale>/<rel>`; this pins that the doctrine family inherits it, since
// that inheritance is the argument the lock is being lifted on. The manifest still
// carries ONE entry — the destination — and the source is chosen at delivery.
test("a FR brain receives the FR constitution, from one manifest entry", (t) => {
  const brainDir = mkdtempSync(join(tmpdir(), "sbg-doctrine-brain-"));
  const sourceDir = mkdtempSync(join(tmpdir(), "sbg-doctrine-src-"));
  t.after(() => {
    rmSync(brainDir, { recursive: true, force: true });
    rmSync(sourceDir, { recursive: true, force: true });
  });
  const FR = "# Doctrine\n\nRègle une.\n";
  writeInto(brainDir, "scripts/lib/demo-locale.mjs", 'export const BRAIN_LOCALE = "fr";\n');
  writeInto(sourceDir, REL, ENGINE);
  writeInto(sourceDir, `templates/fr/${REL}`, FR);

  const report = refreshEngineDoctrine({
    brainDir,
    sourceDir,
    sourceFiles: [REL, `templates/fr/${REL}`],
    manifest: MANIFEST,
  });

  assert.equal(onDisk(brainDir), FR, "the FR brain must not be re-anglicized by its own update");
  assert.deepEqual(report.refreshedFileMap, { [REL]: FR }, "and the ancestor recorded is what was DELIVERED");
});

// ── The guard that keeps a self-heal harmless ───────────────────────────────

test("sourceDir === brainDir writes nothing and reports nothing", (t) => {
  const trees = twoTrees(t, { installed: OWNER, base: BASE });
  const report = refreshEngineDoctrine({
    brainDir: trees.brainDir,
    sourceDir: trees.brainDir,
    sourceFiles: [REL],
    manifest: MANIFEST,
    provenance: { [REL]: fp(BASE) },
  });

  assert.deepEqual(report, {
    doctrineRefreshed: [],
    doctrinePreserved: [],
    doctrineMerged: [],
    doctrineConflicts: [],
    refreshedFileMap: {},
  });
  assert.equal(onDisk(trees.brainDir), OWNER);
});
