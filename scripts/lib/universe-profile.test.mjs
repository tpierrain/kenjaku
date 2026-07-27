import { test } from "node:test";
import assert from "node:assert/strict";

import { universeProfilePath, renderUniverseProfile } from "./universe-profile.mjs";
import { DEFAULT_UNIVERSE } from "./universes.mjs";

// A universe's profile is a NOTE (decision D1): it lives in the vault, next to the
// notes of the universe it describes, so it is versioned, editable in Obsidian and
// searchable by the RAG like everything else.

test("universeProfilePath puts a created universe's profile inside its own subtree", () => {
  assert.equal(universeProfilePath("acme"), "acme/universe.md");
});

test("universeProfilePath puts the DEFAULT universe's profile at the vault root", () => {
  // The default universe has no subtree — it IS the root (ADR 0034), so its
  // profile cannot live under `default/`, a folder that must never exist.
  assert.equal(universeProfilePath(DEFAULT_UNIVERSE), "universe.md");
});

// --- rendering the profile note ----------------------------------------------
// The note must be conformant to the vault taxonomy BY CONSTRUCTION (like
// renderFiledNote): complete frontmatter, so `/lint` stays green on it, and an
// explicit `type: universe` so the parser never has to guess from the folder.

test("renderUniverseProfile builds a lint-conformant note for a created universe", () => {
  const { path, content } = renderUniverseProfile({
    universe: "acme",
    displayName: "Acme Corp",
    kind: "employer",
    today: "2026-07-27",
  });

  assert.equal(path, "acme/universe.md");
  assert.equal(
    content,
    [
      "---",
      "type: universe",
      "created: 2026-07-27",
      "updated: 2026-07-27",
      "tags: [universe]",
      "universe: acme",
      "displayName: Acme Corp",
      "kind: employer",
      "---",
      "",
      "# Acme Corp",
      "",
    ].join("\n"),
  );
});

test("renderUniverseProfile carries the optional role and period when they were answered", () => {
  // The twin (both absent → both omitted) is asserted by the two whole-content
  // tests around this one: they render no role/period line at all.
  const { content } = renderUniverseProfile({
    universe: "acme",
    displayName: "Acme Corp",
    kind: "employer",
    role: "Head of Engineering",
    period: "since 2024",
    today: "2026-07-27",
  });

  assert.equal(
    content,
    [
      "---",
      "type: universe",
      "created: 2026-07-27",
      "updated: 2026-07-27",
      "tags: [universe]",
      "universe: acme",
      "displayName: Acme Corp",
      "kind: employer",
      "role: Head of Engineering",
      "period: since 2024",
      "---",
      "",
      "# Acme Corp",
      "",
    ].join("\n"),
  );
});

test("renderUniverseProfile omits the universe key for the default (absence IS the default)", () => {
  const { path, content } = renderUniverseProfile({
    universe: DEFAULT_UNIVERSE,
    displayName: "My world",
    kind: "personal",
    today: "2026-07-27",
  });

  assert.equal(path, "universe.md");
  assert.equal(
    content,
    [
      "---",
      "type: universe",
      "created: 2026-07-27",
      "updated: 2026-07-27",
      "tags: [universe]",
      "displayName: My world",
      "kind: personal",
      "---",
      "",
      "# My world",
      "",
    ].join("\n"),
  );
});

test("renderUniverseProfile writes no kind key when the question was skipped", () => {
  // A backfill can be answered partially. An unanswered key must be ABSENT, never
  // present-and-empty: `kind: undefined` would read as a fact to every later reader.
  const { content } = renderUniverseProfile({
    universe: "acme",
    displayName: "Acme Corp",
    today: "2026-07-27",
  });

  assert.doesNotMatch(content, /kind:/);
  assert.match(content, /displayName: Acme Corp/);
});

test("renderUniverseProfile refuses a profile with no display name (it IS the note's title)", () => {
  assert.throws(
    () => renderUniverseProfile({ universe: "acme", kind: "employer", today: "2026-07-27" }),
    /displayName is required/,
  );
});

test("renderUniverseProfile refuses to guess the date instead of being given one", () => {
  assert.throws(
    () => renderUniverseProfile({ universe: "acme", displayName: "Acme Corp" }),
    /today .* is required/,
  );
});

test("universeProfilePath treats a missing universe as the default (single-universe brain)", () => {
  // Callers read the pointer, which reads back as the default when absent; an
  // undefined slug must land at the root too, never at "undefined/universe.md".
  assert.equal(universeProfilePath(undefined), "universe.md");
});
