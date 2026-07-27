import { test } from "node:test";
import assert from "node:assert/strict";
import { stampUniverse, restampUniverse } from "./stamp-universe.mjs";

// stampUniverse adds an additive `universe:` key to a note's frontmatter for the
// import router (ADR 0034 Step 6). It NEVER clobbers existing keys, and never
// touches a note that already declares a universe.

test("stampUniverse adds the universe key to existing frontmatter, keeping other keys and body", () => {
  const raw = "---\ntype: daily\ntags: [a, b]\n---\n\n# Title\n\nBody.\n";
  const out = stampUniverse(raw, "acme");

  assert.match(out, /^---\n/);
  assert.match(out, /universe: acme/);
  // Existing keys untouched.
  assert.match(out, /type: daily/);
  assert.match(out, /tags: \[a, b\]/);
  // Body preserved verbatim.
  assert.match(out, /# Title\n\nBody\.\n$/);
});

test("stampUniverse never clobbers a note that already declares a universe", () => {
  const raw = "---\ntype: topic\nuniverse: blue\n---\n\nBody.\n";
  // A different requested universe must NOT overwrite the existing one.
  assert.equal(stampUniverse(raw, "acme"), raw);
});

test("stampUniverse creates a minimal frontmatter block when the note has none", () => {
  const raw = "# Loose note\n\nNo frontmatter here.\n";
  const out = stampUniverse(raw, "acme");
  assert.equal(out, "---\nuniverse: acme\n---\n\n# Loose note\n\nNo frontmatter here.\n");
});

// restampUniverse is the rename counterpart: where stampUniverse protects an
// existing scope, this one REPLACES it — a renamed universe leaves no note behind
// still declaring the old name.

test("restampUniverse replaces an existing universe value, leaving everything else alone", () => {
  const raw = "---\ntype: topic\nuniverse: acme\ntags: [x]\n---\n\n# T\n\nBody.\n";

  assert.equal(
    restampUniverse(raw, "acme-corp"),
    "---\ntype: topic\nuniverse: acme-corp\ntags: [x]\n---\n\n# T\n\nBody.\n",
  );
});

test("restampUniverse stamps a note that declares no universe (hand-written in Obsidian)", () => {
  // Notes filed by the brain always carry the key, but a note typed straight into
  // vault/<slug>/ from Obsidian does not — and it must not survive a rename
  // unscoped, or it would silently fall back to the cross-cutting scope.
  const raw = "---\ntype: topic\n---\n\nBody.\n";

  assert.equal(restampUniverse(raw, "acme-corp"), "---\ntype: topic\nuniverse: acme-corp\n---\n\nBody.\n");
});

test("restampUniverse replaces only the universe LINE, not a body mentioning universe:", () => {
  // The body of a note about universes is exactly the decoy a loose regex eats.
  const raw = "---\nuniverse: acme\n---\n\nWrote `universe: something` in my notes.\n";

  assert.equal(
    restampUniverse(raw, "blue"),
    "---\nuniverse: blue\n---\n\nWrote `universe: something` in my notes.\n",
  );
});
