import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// F6 — the owner typed `/rag` and the host answered `Unknown command: /rag. Did you
// mean /run?`. Nothing was broken (plain language worked), but the affordance was
// missing at the exact word an owner of a RAG-backed brain reaches for first — and the
// nearest-match pointed at `/run`, an unrelated built-in. This guard pins the front
// door: a `rag` skill exists, under the name people guess, and it REPORTS the engine's
// own deterministic status instead of narrating one.
//
// The skill ships at the NON-sacred staged path `engine-skills/rag/` (ADR 0026): the
// sacred scrub forbids the engine from writing under `.claude/skills/`, so a skill
// bound for the deployed fleet ships staged and is install-if-absent'd into the brain.
const SKILL_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../engine-skills/rag/SKILL.md"
);

const readSkill = () => readFileSync(SKILL_PATH, "utf8");

// The YAML frontmatter — the only part Claude loads to decide whether to route here.
const frontmatter = () => readSkill().split("---")[1] ?? "";

test("rag skill — it ships at the staged path, so a fresh install AND an upgrader both get it", () => {
  assert.ok(
    existsSync(SKILL_PATH),
    "engine-skills/rag/SKILL.md must exist — the staged path is the only one that reaches the fleet"
  );
});

// Everything after the frontmatter — the procedure Claude follows once routed here.
const body = () => readSkill().split("---").slice(2).join("---");

test("rag skill — the frontmatter routes on every word the field log saw an owner guess", () => {
  // `/rag` is the word that failed in the field; the other three are the neighbours F6
  // told us to sweep. Only `rag` gets a directory (hence a real slash command), so the
  // rest MUST be reachable through this description or they route nowhere.
  const guessed = ["/rag", "index", "reindex", "status"];
  const missing = guessed.filter((word) => !frontmatter().toLowerCase().includes(word));
  assert.deepEqual(
    missing,
    [],
    "the description must name every guessed word — a name nobody guesses is a feature nobody finds"
  );
});

test("rag skill — the answer comes from the engine's own tools, never from a narrated one", () => {
  // F6's whole point: "the surface exists, only its name is missing". `vault_stats`
  // already returns files/chunks, watcher liveness, embedder identity and the engine +
  // schema versions; `health_check` already returns a binary verdict. A skill that
  // re-derived any of that would be a second source of truth, free to drift — and F7
  // is the same repo's lesson about stating a number nobody measured.
  const engineTools = ["vault_stats", "health_check", "reindex"];
  const missing = engineTools.filter((tool) => !body().includes(tool));
  assert.deepEqual(
    missing,
    [],
    "the procedure must call the engine's tools — the skill reports the status, it does not compute it"
  );
});
