import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { findMissingPlanReferences } from "./roadmap-consistency.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// The map that lied — 2026-08-15 the owner corrected the ROADMAP twice in one
// conversation: a row still 🔴 LIVE pointing at a `prospective/` file whose plan
// had shipped and been archived a week earlier, and a gate unchecked a month
// after the migration it tracked was lived. The per-plan discipline ("tick as
// you go") triggers on the session doing the work; nothing triggers when the
// fact arrives from OUTSIDE (a release tail on another branch, work done
// brain-side). This guard mechanises the detectable half: a reference whose
// target no longer exists where the row says it is.
// ═══════════════════════════════════════════════════════════════════════════

test("a prospective reference whose file no longer exists is reported", () => {
  const markdown = "see `prospective/gone-plan.md` for the work order";
  const existing = ["archived/some-other-plan.md"];
  assert.deepEqual(findMissingPlanReferences(markdown, existing), [
    "prospective/gone-plan.md",
  ]);
});

test("existing references are kept quiet, missing ones (both dirs) reported once, in order met", () => {
  const markdown = [
    "| `archived/shipped-plan.md` | done |",
    "| `prospective/still-here.md` | live |",
    "see [the note](archived/lost-note.md) and again `archived/shipped-plan.md`",
    "then `prospective/vanished-action.md`, twice: `prospective/vanished-action.md`",
  ].join("\n");
  // Decoy: a file that exists but is never referenced must not appear either.
  const existing = [
    "archived/shipped-plan.md",
    "prospective/still-here.md",
    "prospective/unreferenced-decoy.md",
  ];
  assert.deepEqual(findMissingPlanReferences(markdown, existing), [
    "archived/lost-note.md",
    "prospective/vanished-action.md",
  ]);
});

test("a markdown with no plan references reports nothing", () => {
  assert.deepEqual(findMissingPlanReferences("just prose, no refs", ["archived/a.md"]), []);
});

// ── The guard itself: the REAL map against the REAL plan files ─────────────
// This is the CI tripwire. It goes red the day a plan is archived (or deleted)
// while a ROADMAP row still points at its old home — the exact way the v4.8.1
// row lied for a week. Fix the row, not the test.

const PLANS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "maintainers", "plans");

test("every plan file the ROADMAP references exists where the ROADMAP says it is", () => {
  const roadmap = readFileSync(join(PLANS_DIR, "ROADMAP.md"), "utf8");
  const existing = ["prospective", "archived"].flatMap((dir) =>
    readdirSync(join(PLANS_DIR, dir)).map((f) => `${dir}/${f}`)
  );
  assert.deepEqual(findMissingPlanReferences(roadmap, existing), []);
});
