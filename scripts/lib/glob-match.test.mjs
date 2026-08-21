import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { globRoots, globToRegExp, matchesAny } from "./glob-match.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// ═══════════════════════════════════════════════════════════════════════════
// glob-match — the single manifest glob dialect. Pins the contract two libs lean
// on (engine-source provenance selection, engine-apply-plan safety allowlist).
// ═══════════════════════════════════════════════════════════════════════════

test("exact entry matches only itself", () => {
  const re = globToRegExp("CLAUDE.md");
  assert.equal(re.test("CLAUDE.md"), true);
  assert.equal(re.test("docs/CLAUDE.md"), false);
  assert.equal(re.test("CLAUDE.md.bak"), false);
});

test("`*` matches a single path segment, never a slash", () => {
  const re = globToRegExp("scripts/*.mjs");
  assert.equal(re.test("scripts/auto-commit.mjs"), true);
  assert.equal(re.test("scripts/lib/helper.mjs"), false, "* must not cross a directory boundary");
});

test("`**` matches a whole subtree, including slashes", () => {
  const re = globToRegExp(".claude/skills/coach/**");
  assert.equal(re.test(".claude/skills/coach/SKILL.md"), true);
  assert.equal(re.test(".claude/skills/coach/lib/deep/x.mjs"), true);
  assert.equal(re.test(".claude/skills/other/SKILL.md"), false);
});

test("matchesAny — true iff at least one glob matches", () => {
  const globs = ["rag/src/**", "rag/package.json"];
  assert.equal(matchesAny(globs, "rag/src/lib/embedder.ts"), true);
  assert.equal(matchesAny(globs, "vault/note.md"), false);
});

// ── globRoots (S4-4c) ───────────────────────────────────────────────────────────
//
// Why it exists, measured: `readInstalledMergeFiles` walked the WHOLE brain and then
// filtered by the merge globs — so a session-start hook read every note its owner had
// ever written to look at files no merge glob can name (~2.3 µs per file, 18.5 ms for
// 8 000 notes, at every session start). These are the roots the walk may start from
// instead: the leading segments of each glob that contain no wildcard.

test("globRoots — a glob with no wildcard at all IS its own root (a file, not a directory)", () => {
  assert.deepEqual(globRoots(["CLAUDE.md"]), ["CLAUDE.md"]);
});

test("globRoots — a trailing ** yields the directory above it", () => {
  assert.deepEqual(globRoots([".claude/skills/coach/**"]), [".claude/skills/coach"]);
});

test("globRoots — a wildcard in a MIDDLE segment stops the root there", () => {
  assert.deepEqual(globRoots([".claude/skills/*/SKILL.md"]), [".claude/skills"]);
});

test("globRoots — several unrelated globs all keep their own root", () => {
  assert.deepEqual(globRoots(["CLAUDE.md", ".claude/settings.json", "scripts/auto-commit.mjs"]), [
    "CLAUDE.md",
    ".claude/settings.json",
    "scripts/auto-commit.mjs",
  ]);
});

test("globRoots — a directory glob beside its own files: the directory wins", () => {
  // `scripts/*.mjs` roots at `scripts`, which already contains the two named files.
  // Written the other way round first, and the test was the thing that was wrong.
  assert.deepEqual(globRoots(["scripts/auto-commit.mjs", "scripts/auto-push.mjs", "scripts/*.mjs"]), ["scripts"]);
});

test("globRoots — a root that CONTAINS another subsumes it, so nothing is walked twice", () => {
  // `.claude/skills` already covers `.claude/skills/coach`; keeping both would walk the
  // subtree twice and hand the caller the same path under two entries.
  assert.deepEqual(globRoots([".claude/skills/coach/**", ".claude/skills/*/SKILL.md"]), [".claude/skills"]);
});

test("globRoots — two globs rooting at the SAME directory yield it once, not twice", () => {
  // Found by the mutation pass: three survivors all pointed at the self-comparison
  // guards, because no fixture had ever produced two equal roots. It is not a cosmetic
  // duplicate — the caller walks each root, so the subtree would be read TWICE, which is
  // exactly the waste this slice exists to remove.
  assert.deepEqual(globRoots([".claude/skills/coach/**", ".claude/skills/coach/*.md"]), [".claude/skills/coach"]);
});

test("globRoots — subsumption respects segment boundaries, never bare string prefixes", () => {
  // `.claude/skills` must NOT swallow `.claude/skillsets`: the trap of a startsWith
  // check written without the separator.
  assert.deepEqual(globRoots([".claude/skills/**", ".claude/skillsets/**"]), [
    ".claude/skills",
    ".claude/skillsets",
  ]);
});

test("globRoots — a glob that starts with a wildcard forces the WHOLE tree", () => {
  // The honest fallback: there is no prefix to start from, so the caller must walk
  // everything. Returning [] here would silently select nothing.
  assert.deepEqual(globRoots(["**/*.md"]), [""]);
});

test("globRoots — one rootless glob poisons the batch: the whole tree wins over any prefix", () => {
  assert.deepEqual(globRoots(["CLAUDE.md", "**/*.md", ".claude/skills/coach/**"]), [""]);
});

test("globRoots — no globs at all → no roots (walk nothing, not everything)", () => {
  assert.deepEqual(globRoots([]), []);
});

test("globRoots — the real manifest's merge globs never reach into the vault", () => {
  // The finding this slice exists for, pinned so a future merge glob under `vault/`
  // cannot quietly re-enable the full walk without someone reading this line.
  const manifest = JSON.parse(readFileSync(join(REPO_ROOT, "engine-manifest.json"), "utf8"));
  const roots = globRoots(manifest.regimes.merge ?? []);
  assert.ok(!roots.includes(""), "a merge glob has no static prefix — the whole brain would be walked");
  assert.deepEqual(
    roots.filter((r) => r === "vault" || r.startsWith("vault/")),
    [],
    "a merge glob reaches into the owner's notes",
  );
});
