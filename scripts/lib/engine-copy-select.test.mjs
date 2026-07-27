import { test } from "node:test";
import assert from "node:assert/strict";

import { localeOwnedPaths, selectEngineFilesToCopy, resolveLocaleSource } from "./engine-copy-select.mjs";

// ── resolveLocaleSource: WHICH source file to deliver to a brain of a given locale ──
// The twin of localeOwnedPaths: that one EXCLUDES locale-owned paths from the blind
// copy; this one RESOLVES a rel path to the source the brain's locale should get
// (Increment 2.5, trap T2 — refreshing a FR brain from the root would re-anglicize it).
test("resolveLocaleSource — the default-locale brain reads the ROOT file", () => {
  assert.equal(
    resolveLocaleSource({
      rel: ".claude/skills/coach/SKILL.md",
      locale: "en",
      sourceFiles: [".claude/skills/coach/SKILL.md", "templates/fr/.claude/skills/coach/SKILL.md"],
    }),
    ".claude/skills/coach/SKILL.md",
  );
});

test("resolveLocaleSource — a FR brain reads its OWN localized source, not the root one", () => {
  assert.equal(
    resolveLocaleSource({
      rel: ".claude/skills/coach/SKILL.md",
      locale: "fr",
      sourceFiles: [".claude/skills/coach/SKILL.md", "templates/fr/.claude/skills/coach/SKILL.md"],
    }),
    "templates/fr/.claude/skills/coach/SKILL.md",
  );
});

test("resolveLocaleSource — no source in the brain's locale → the ROOT file, never another locale's", () => {
  // `switch` and `local-mirror` ship EN-only today. Falling back to the root is the
  // safe answer: it is exactly what the FR brain received at install, so refreshing
  // from it is a same-language update — never a regression, and never a Spanish skill.
  assert.equal(
    resolveLocaleSource({
      rel: ".claude/skills/switch/SKILL.md",
      locale: "fr",
      sourceFiles: [
        ".claude/skills/switch/SKILL.md",
        "templates/es/.claude/skills/switch/SKILL.md", // another locale → must NOT be picked
        "templates/fr/.claude/skills/coach/SKILL.md", // FR exists, but for another skill
      ],
    }),
    ".claude/skills/switch/SKILL.md",
  );
});

// ── localeOwnedPaths: which rel paths a locale OWNS (from templates/<locale>/<rel>) ──
test("localeOwnedPaths — derives the owned rel from templates/<locale>/<rel>", () => {
  const owned = localeOwnedPaths([
    "templates/fr/scripts/lib/demo-locale.mjs",
    "templates/fr/CLAUDE.md.template",
    "templates/en/scripts/lib/demo-locale.mjs",
    "scripts/lib/demo-locale.mjs", // a ROOT file is not locale-owned
    "rag/src/index.ts",
  ]);
  assert.ok(owned.has("scripts/lib/demo-locale.mjs"), "demo-locale.mjs is owned by a locale");
  assert.ok(owned.has("CLAUDE.md.template"), "the constitution template is locale-owned");
  assert.equal(owned.has("rag/src/index.ts"), false, "a plain engine file is not locale-owned");
});

// ── F1: the dev-only files under scripts/lib/** must never be copied to a brain ──
test("selectEngineFilesToCopy — F1: drops dev-only (eval-*, mcp-search) even when the glob is scripts/lib/**", () => {
  const sourceFiles = [
    "rag/src/index.ts",
    "scripts/lib/engine-fetch.mjs", // a real engine lib → copied
    "scripts/lib/eval-set.mjs", // dev-only → NOT copied
    "scripts/lib/eval-run.test.mjs", // dev-only → NOT copied
    "scripts/lib/mcp-search.mjs", // dev-only → NOT copied
  ];
  const copyGlobs = ["rag/src/**", "scripts/lib/**"];

  const selected = selectEngineFilesToCopy({ sourceFiles, copyGlobs });

  assert.ok(selected.includes("rag/src/index.ts"));
  assert.ok(selected.includes("scripts/lib/engine-fetch.mjs"));
  assert.equal(selected.includes("scripts/lib/eval-set.mjs"), false, "eval-* must not leak into a brain");
  assert.equal(selected.includes("scripts/lib/eval-run.test.mjs"), false);
  assert.equal(selected.includes("scripts/lib/mcp-search.mjs"), false, "mcp-search must not leak into a brain");
});

// ── F2: the locale-owned demo-locale.mjs must be KEPT (not overwritten by the root) ──
test("selectEngineFilesToCopy — F2: excludes locale-owned files so the brain keeps its installed locale", () => {
  const sourceFiles = [
    "rag/src/index.ts",
    "scripts/lib/demo-locale.mjs", // ROOT (en) → matches scripts/lib/** but is locale-owned → NOT copied
    "templates/fr/scripts/lib/demo-locale.mjs", // the fr owner (under templates/, never copied anyway)
    "templates/en/scripts/lib/demo-locale.mjs",
  ];
  const copyGlobs = ["rag/src/**", "scripts/lib/**"];

  const selected = selectEngineFilesToCopy({ sourceFiles, copyGlobs });

  assert.ok(selected.includes("rag/src/index.ts"));
  assert.equal(
    selected.includes("scripts/lib/demo-locale.mjs"),
    false,
    "demo-locale.mjs is locale-owned → update-engine must not overwrite the brain's installed locale (fr→en regression)",
  );
});
