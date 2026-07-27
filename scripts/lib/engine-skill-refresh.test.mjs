import { test } from "node:test";
import assert from "node:assert/strict";

import { fingerprint } from "./engine-source.mjs";
import { refreshableSkillPairs, refreshVerdict, selectRefreshableSkillFiles } from "./engine-skill-refresh.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// engine-skill-refresh — the PURE verdict behind "refresh an engine skill only
// if we can PROVE nobody touched it" (plan Increment 2.5, Step 1). Given what the
// brain has on disk, the provenance base the engine recorded when it last delivered
// the file, and the candidate new content, it answers: install it / refresh it /
// preserve the owner's version. No fs, no side effects.
// ═══════════════════════════════════════════════════════════════════════════

test("a file the brain does not have yet → install it", () => {
  assert.deepEqual(
    refreshVerdict({ installed: null, base: undefined, candidate: "# new skill\n" }),
    { verdict: "absent-install" },
  );
});

test("installed file still byte-identical to the recorded base → refresh it", () => {
  const delivered = "# switch (v3.6.0)\n";
  assert.deepEqual(
    refreshVerdict({
      installed: delivered,
      base: fingerprint(delivered),
      candidate: "# switch (v3.6.2)\n",
    }),
    { verdict: "refresh" },
  );
});

test("CRLF copy of the candidate itself → still nothing to do", () => {
  // Same content, Windows line endings: rewriting it would flip the file to LF at
  // every single update (autocrlf puts the CRLFs back) — pure churn, zero gain.
  const candidate = "# switch (v3.6.2)\nline two\n";
  const installed = candidate.split("\n").join("\r\n");
  assert.deepEqual(
    refreshVerdict({ installed, base: fingerprint(candidate), candidate }),
    { verdict: "unchanged" },
  );
});

test("owner customized the file (hash no longer matches the base) → preserve it", () => {
  const delivered = "# prepare-1-1 (v3.6.0)\n";
  assert.deepEqual(
    refreshVerdict({
      installed: delivered + "\nMy own KPIs section.\n", // the documented customization case
      base: fingerprint(delivered),
      candidate: "# prepare-1-1 (v3.6.2)\n",
    }),
    { verdict: "preserve", reason: "customized" },
  );
});

test("no provenance base recorded (pre-provenance brain) → preserve, but say WHY", () => {
  // Nothing was ever fingerprinted for this file, so "untouched" is UNPROVABLE — we
  // still keep the owner's copy, but the report must not call them a customizer.
  assert.deepEqual(
    refreshVerdict({ installed: "# switch\n", base: undefined, candidate: "# switch v2\n" }),
    { verdict: "preserve", reason: "no-provenance" },
  );
});

test("a base is recorded but the file is gone from disk → install it back", () => {
  // Absence is whatever the fs seam reports for "no content" (null OR undefined) —
  // a recorded base must never turn a missing file into a "preserve".
  const delivered = "# switch (v3.6.0)\n";
  for (const missing of [null, undefined]) {
    assert.deepEqual(
      refreshVerdict({ installed: missing, base: fingerprint(delivered), candidate: "# switch (v3.6.2)\n" }),
      { verdict: "absent-install" },
    );
  }
});

test("already carrying the candidate content → nothing to do (no write, no churn)", () => {
  // The steady state of an up-to-date brain: re-running the update must NOT rewrite
  // the file, or every session would produce auto-commit noise for a no-op.
  const current = "# switch (v3.6.2)\n";
  assert.deepEqual(
    refreshVerdict({ installed: current, base: fingerprint(current), candidate: current }),
    { verdict: "unchanged" },
  );
});

test("a base RECORDED on CRLF bytes still matches its own file → refresh, not 'customized'", () => {
  // The mirror image of the drift case below. On Windows, `git clone` with autocrlf hands
  // the engine CRLF bytes, so what it DELIVERED — and therefore fingerprinted as the base —
  // is CRLF. At the next update the file still matches that base RAW, but no longer once
  // normalized. Comparing the normalized form alone would freeze the whole Windows fleet as
  // "customized"; the raw comparison is what keeps them refreshable.
  const deliveredCrlf = "# switch (v3.6.0)\r\nline two\r\n";
  assert.deepEqual(
    refreshVerdict({
      installed: deliveredCrlf,
      base: fingerprint(deliveredCrlf),
      candidate: "# switch (v3.6.2)\nline two\n",
    }),
    { verdict: "refresh" },
  );
});

test("Windows CRLF drift is NOT a customization → still refresh it", () => {
  // A Windows brain whose checkout/editor rewrote the line endings differs from the
  // base BYTE-wise while nobody edited a word. Freezing those brains forever would
  // hand the whole Windows fleet the very bug this increment fixes.
  const delivered = "# switch (v3.6.0)\nline two\n";
  assert.deepEqual(
    refreshVerdict({
      installed: delivered.split("\n").join("\r\n"),
      base: fingerprint(delivered),
      candidate: "# switch (v3.6.2)\nline two\n",
    }),
    { verdict: "refresh" },
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
