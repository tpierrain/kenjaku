import test from "node:test";
import assert from "node:assert/strict";

import { engineDivergence } from "./engine-divergence.mjs";
import { fingerprint } from "./engine-source.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// engine-divergence — WHICH engine files a brain is holding back, and since
// which engine version each of them last received bytes (S4-2).
//
// Pure and offline by construction: it is handed the manifest (the record) and
// the installed bytes (the disk), and answers with a list. No fs, no network,
// no release count — the two versions are named and the owner reads the
// distance, because counting releases would need a fetch for a number the
// versions already carry.
// ═══════════════════════════════════════════════════════════════════════════

const DELIVERED = "---\nname: coach\n---\nThe engine's own words.\n";
const EDITED = DELIVERED + "\nAnd the owner's.\n";

// A manifest in the shape the brain actually holds: the merge globs, the digest
// of what was last delivered, and (since S4-1) the version that delivered it.
function manifest({ provenance, baseRefs, merge = [".claude/skills/coach/SKILL.md"] } = {}) {
  return {
    manifestVersion: 1,
    regimes: {
      replace: ["rag/src/**"],
      merge,
    },
    source: { repo: "https://example.test/launcher.git", ref: "v5.0.0" },
    ...(provenance === undefined ? {} : { provenance }),
    ...(baseRefs === undefined ? {} : { baseRefs }),
  };
}

// ── The headline: an edited engine file, and the version it is behind ─────────

test("engineDivergence — an edited merge file is held back, and names the version that last reached it", () => {
  const result = engineDivergence({
    manifest: manifest({
      provenance: { ".claude/skills/coach/SKILL.md": fingerprint(DELIVERED) },
      baseRefs: { ".claude/skills/coach/SKILL.md": "v4.7.0" },
    }),
    installedFileMap: { ".claude/skills/coach/SKILL.md": EDITED },
  });

  // The WHOLE list, not just its first entry: the defect this module exists to end
  // is a file nobody mentions, so an extra entry is as wrong as a missing one.
  assert.deepEqual(result, [
    { rel: ".claude/skills/coach/SKILL.md", reason: "customized", since: "v4.7.0" },
  ]);
});

test("engineDivergence — a file still matching what was delivered is holding nothing back", () => {
  const result = engineDivergence({
    manifest: manifest({
      provenance: { ".claude/skills/coach/SKILL.md": fingerprint(DELIVERED) },
      baseRefs: { ".claude/skills/coach/SKILL.md": "v4.7.0" },
    }),
    installedFileMap: { ".claude/skills/coach/SKILL.md": DELIVERED },
  });

  assert.deepEqual(result, []);
});

// ⚠️ The same normalization `verifyBase` already applies, asserted HERE too rather
// than trusted: a brain cloned on Windows can have its files rewritten LF→CRLF by
// git itself. Without this, the entire Windows fleet would be told it is holding
// back every single engine file — the loudest possible false positive.
test("engineDivergence — CRLF is not an edit: a Windows checkout of the delivered bytes is converged", () => {
  const result = engineDivergence({
    manifest: manifest({
      provenance: { ".claude/skills/coach/SKILL.md": fingerprint(DELIVERED) },
      baseRefs: { ".claude/skills/coach/SKILL.md": "v4.7.0" },
    }),
    installedFileMap: { ".claude/skills/coach/SKILL.md": DELIVERED.split("\n").join("\r\n") },
  });

  assert.deepEqual(result, []);
});

// ── The silence the field finding is about, given a name instead ──────────────

test("engineDivergence — a merge file with no recorded base says exactly that, and is never called an edit", () => {
  const result = engineDivergence({
    manifest: manifest({ provenance: {}, baseRefs: {} }),
    installedFileMap: { ".claude/skills/coach/SKILL.md": EDITED },
  });

  assert.deepEqual(result, [
    { rel: ".claude/skills/coach/SKILL.md", reason: "no-provenance", since: null },
  ]);
});

test("engineDivergence — a held-back file whose version was never recorded says null, never a guess", () => {
  // A brain installed before S4: it has digests, so the edit is provable, but nothing
  // says which version delivered them. `null` is the honest answer and the caller turns
  // it into "since your install" — inventing `source.ref` here would name the version
  // the brain runs TODAY as the one the file is behind, which is the exact confusion
  // `baseRefs` was added to end.
  const result = engineDivergence({
    manifest: manifest({ provenance: { ".claude/skills/coach/SKILL.md": fingerprint(DELIVERED) } }),
    installedFileMap: { ".claude/skills/coach/SKILL.md": EDITED },
  });

  assert.deepEqual(result, [
    { rel: ".claude/skills/coach/SKILL.md", reason: "customized", since: null },
  ]);
});

// ── What is NOT divergence, pinned so the list cannot quietly grow ────────────

test("engineDivergence — a file outside the merge regime is never held back, whatever its bytes say", () => {
  const result = engineDivergence({
    manifest: manifest({ provenance: {}, baseRefs: {} }),
    // A `replace` file is overwritten whole at every update: it carries no base, and
    // "held back" is meaningless for a file the engine never asks permission about.
    installedFileMap: { "rag/src/index.ts": "// the owner's own edit\n" },
  });

  assert.deepEqual(result, []);
});

test("engineDivergence — a recorded file the owner DELETED is not reported as held back", () => {
  // It is absent from the disk map, so it is absent from the answer. Deliberate: the
  // install-if-absent path re-delivers a deleted engine file at the next update, so it
  // is not being held back — it is on its way back. A different fact deserves a
  // different sentence, and this module owns exactly one.
  const result = engineDivergence({
    manifest: manifest({
      provenance: { ".claude/skills/coach/SKILL.md": fingerprint(DELIVERED) },
      baseRefs: { ".claude/skills/coach/SKILL.md": "v4.7.0" },
    }),
    installedFileMap: {},
  });

  assert.deepEqual(result, []);
});

test("engineDivergence — a brain that records nothing at all reports nothing, rather than throwing", () => {
  assert.deepEqual(engineDivergence({ manifest: {}, installedFileMap: {} }), []);
  assert.deepEqual(engineDivergence({ manifest: manifest(), installedFileMap: {} }), []);
});

// ── Order is part of the contract, because a human reads this ─────────────────

test("engineDivergence — the list is sorted by path, not by the order the disk was walked", () => {
  const merge = ["CLAUDE.md", ".claude/settings.json", "scripts/auto-commit.mjs"];
  const result = engineDivergence({
    manifest: manifest({
      provenance: Object.fromEntries(merge.map((rel) => [rel, fingerprint(DELIVERED)])),
      baseRefs: { "CLAUDE.md": "v4.7.0", "scripts/auto-commit.mjs": "v4.9.0" },
      merge,
    }),
    // Deliberately in neither insertion nor sorted order, and with the entry that has
    // no recorded ref in the middle, so a comparator sorting the wrong field shows up.
    installedFileMap: {
      "scripts/auto-commit.mjs": EDITED,
      "CLAUDE.md": EDITED,
      ".claude/settings.json": EDITED,
    },
  });

  assert.deepEqual(result, [
    { rel: ".claude/settings.json", reason: "customized", since: null },
    { rel: "CLAUDE.md", reason: "customized", since: "v4.7.0" },
    { rel: "scripts/auto-commit.mjs", reason: "customized", since: "v4.9.0" },
  ]);
});
