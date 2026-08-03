import { test } from "node:test";
import assert from "node:assert/strict";

import { slugify, filedNotePath, renderFiledNote, homonymCards } from "./filed-note.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// filed-note — the pure, I/O-free core of Track B ("file the good answer back").
// Given a filing spec it builds a note that is conformant to the vault taxonomy
// BY CONSTRUCTION (ADR 0009 rung 1): correct path, complete frontmatter, woven
// [[links]] — so a filed-back answer never re-introduces the very defects /lint
// (Track A) detects. This block covers slugify (title → filename-safe slug).
// ═══════════════════════════════════════════════════════════════════════════

test("slugify — a two-word title becomes kebab-case, lowercased", () => {
  assert.equal(slugify("Jane Doe"), "jane-doe");
});

test("slugify — strips accents to plain ASCII (no accents in filenames)", () => {
  assert.equal(slugify("Café Résumé"), "cafe-resume");
});

test("slugify — collapses punctuation and repeated spaces to single hyphens, trimmed", () => {
  assert.equal(slugify("  RAG & Embeddings!  "), "rag-embeddings");
});

test("slugify — a title with no slug-able characters throws (fail-loud, not empty)", () => {
  assert.throws(() => slugify("!?…"), /empty slug|no slug-able/i);
});

// ── filedNotePath: the vault-relative path implied by type + title (+ date) ────

test("filedNotePath — a living page (topic) is <folder>/<slug>.md, no date", () => {
  assert.equal(
    filedNotePath({ type: "topic", title: "Capacity Management" }),
    "topics/capacity-management.md",
  );
});

test("filedNotePath — a person page lives under people/ (folder is not a naive plural)", () => {
  assert.equal(filedNotePath({ type: "person", title: "Jane Doe" }), "people/jane-doe.md");
});

test("filedNotePath — a dated type (decision) is <folder>/<date>-<slug>.md", () => {
  assert.equal(
    filedNotePath({
      type: "decision",
      title: "Adopt The Hive",
      date: "2026-07-17",
    }),
    "decisions/2026-07-17-adopt-the-hive.md",
  );
});

test("filedNotePath — a meeting is dated too, distinct from an undated topic", () => {
  assert.equal(
    filedNotePath({ type: "meeting", title: "Q3 Review", date: "2026-07-17" }),
    "meetings/2026-07-17-q3-review.md",
  );
});

test("filedNotePath — an unknown type throws, naming the supported types", () => {
  assert.throws(
    () => filedNotePath({ type: "recipe", title: "Whatever" }),
    /unknown type "recipe".*person.*topic.*decision.*meeting/is,
  );
  // Whole, separators included: run together, "persontopicdecisionmeeting" is a
  // list of four types the reader has to guess the boundaries of.
  assert.throws(() => filedNotePath({ type: "recipe", title: "Whatever" }), {
    message: 'unknown type "recipe": supported types are person, topic, decision, meeting',
  });
});

test("filedNotePath — a dated type without a date throws (fail-loud)", () => {
  assert.throws(
    () => filedNotePath({ type: "decision", title: "Adopt The Hive" }),
    /decision.*requires a date/i,
  );
});

// ── universe-awareness (ADR 0034): a filed note lands in the active universe ────

test("filedNotePath — an active universe prefixes the path with <universe>/", () => {
  assert.equal(
    filedNotePath({ type: "person", title: "Jane Doe", universe: "acme" }),
    "acme/people/jane-doe.md",
  );
});

test("filedNotePath — a dated type under a universe keeps its date, prefixed", () => {
  assert.equal(
    filedNotePath({
      type: "meeting",
      title: "Q3 Review",
      date: "2026-07-17",
      universe: "acme",
    }),
    "acme/meetings/2026-07-17-q3-review.md",
  );
});

test("filedNotePath — the default universe (and no universe) stays at the vault root", () => {
  assert.equal(
    filedNotePath({ type: "topic", title: "RAG", universe: "default" }),
    "topics/rag.md",
  );
  assert.equal(filedNotePath({ type: "topic", title: "RAG" }), "topics/rag.md");
});

// ── renderFiledNote: a taxonomy-conformant { path, content } by construction ───

test("renderFiledNote — throws when today is missing (created/updated would be blank)", () => {
  assert.throws(
    () =>
      renderFiledNote({
        type: "topic",
        title: "X",
        tags: ["a"],
        body: "b",
        links: [],
      }),
    /today.*required/i,
  );
});

test("renderFiledNote — throws on empty tags (frontmatter conformance would break)", () => {
  assert.throws(
    () =>
      renderFiledNote({
        type: "topic",
        title: "X",
        tags: [],
        body: "b",
        links: [],
        today: "2026-07-17",
      }),
    /at least one tag|tags.*required|non-empty/i,
  );
});

test("renderFiledNote — omitted links default to no Related section (not a crash)", () => {
  const note = renderFiledNote({
    type: "topic",
    title: "X",
    tags: ["a"],
    body: "b",
    today: "2026-07-17",
  });
  assert.equal(note.content.includes("## Related"), false);
});

test("renderFiledNote — with no links, omits the Related section entirely", () => {
  const note = renderFiledNote({
    type: "decision",
    title: "Adopt The Hive",
    tags: ["architecture"],
    body: "We go modular monolith.",
    links: [],
    date: "2026-07-17",
    today: "2026-07-17",
  });
  assert.deepEqual(note, {
    path: "decisions/2026-07-17-adopt-the-hive.md",
    content: `---
type: decision
created: 2026-07-17
updated: 2026-07-17
tags: [architecture]
---

# Adopt The Hive

We go modular monolith.
`,
  });
});

test("renderFiledNote — under an active universe, prefixes the path and stamps universe:", () => {
  const note = renderFiledNote({
    type: "topic",
    title: "Capacity Management",
    tags: ["rag"],
    body: "The distilled answer.",
    today: "2026-07-17",
    universe: "acme",
  });
  assert.deepEqual(note, {
    path: "acme/topics/capacity-management.md",
    content: `---
type: topic
created: 2026-07-17
updated: 2026-07-17
tags: [rag]
universe: acme
---

# Capacity Management

The distilled answer.
`,
  });
});

test("renderFiledNote — the default universe stamps no universe: key (root behaviour unchanged)", () => {
  const note = renderFiledNote({
    type: "topic",
    title: "X",
    tags: ["a"],
    body: "b",
    today: "2026-07-17",
    universe: "default",
  });
  assert.equal(note.path, "topics/x.md");
  assert.equal(note.content.includes("universe:"), false);
});

test("renderFiledNote — builds path + conformant frontmatter, body, and woven [[links]]", () => {
  const note = renderFiledNote({
    type: "topic",
    title: "Capacity Management",
    tags: ["rag", "retrieval"],
    body: "The distilled answer.",
    links: ["people/jane-doe", "topics/rag"],
    today: "2026-07-17",
  });
  assert.deepEqual(note, {
    path: "topics/capacity-management.md",
    content: `---
type: topic
created: 2026-07-17
updated: 2026-07-17
tags: [rag, retrieval]
---

# Capacity Management

The distilled answer.

## Related

- [[people/jane-doe]]
- [[topics/rag]]
`,
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// The homonymy block — a card that does not say WHICH Romain only moves the
// ambiguity. The field brain carried 3 Romain, 3 Marie, 2 Karim, 2 Caroline and
// 2 Michael, and the identity discipline's "resolve against the vault before you
// write" is unusable when the vault's own answer is three cards wide.
//
// This is the pure half: which existing cards already bear the first name the
// new card is about to claim. It knows nothing of the fs — the caller hands it
// what it found.
// ═══════════════════════════════════════════════════════════════════════════

test("homonymCards — names the existing card that already bears this first name", () => {
  assert.deepEqual(
    homonymCards("people/romain-lefevre.md", ["people/romain-durand.md", "people/jane-doe.md"]),
    ["people/romain-durand.md"],
  );
});

test("homonymCards — a card in another universe's subtree is a homonym too", () => {
  // The resolution rule reads the active universe's people/ AND the root's
  // cross-cutting cards, so a Romain filed under acme/ is exactly the Romain the
  // next bare "Romain" could be resolved to. Basename-scoped on purpose.
  assert.deepEqual(homonymCards("people/romain-lefevre.md", ["acme/people/romain-durand.md"]), [
    "acme/people/romain-durand.md",
  ]);
});

test("homonymCards — names EVERY homonym, not just the first, and only the homonyms", () => {
  assert.deepEqual(
    homonymCards("people/romain-lefevre.md", [
      "people/marie-curie.md",
      "acme/people/romain-durand.md",
      "people/romain.md",
      "people/romainville-sud.md",
    ]),
    ["acme/people/romain-durand.md", "people/romain.md"],
  );
});

// ── The reliability block: how sure the card's own identity resolution is ─────
// "Conformant ≠ true." The builder guarantees FORM — right path, complete
// frontmatter, green lint — and that form is then read as substance: a card
// resolved from a bare "Jérémy (front Candor)" comes out looking exactly like
// one resolved from a signed org chart. This plan's own reframe, on the vault's
// most permanent surface. So the card SAYS what its resolution rests on, in the
// vocabulary the claim discipline already shipped (✅ observed / 🟡 derived or
// probable / 🔴 unverified) — never a second scale.

test("renderFiledNote — a probable resolution says so, in the claim discipline's own words", () => {
  const note = renderFiledNote({
    type: "person",
    title: "Jérémy Hinard",
    tags: ["candor"],
    body: "Front-end at Candor.",
    confidence: {
      level: "probable",
      basis: 'source said "Jérémy (front Candor)"; the surname comes from the Candor org note.',
    },
    today: "2026-08-03",
  });
  assert.deepEqual(note, {
    path: "people/jeremy-hinard.md",
    content: `---
type: person
created: 2026-08-03
updated: 2026-08-03
tags: [candor]
confidence: probable
---

# Jérémy Hinard

> **Confidence** — 🟡 derived or probable · source said "Jérémy (front Candor)"; the surname comes from the Candor org note.

Front-end at Candor.
`,
  });
});

test("renderFiledNote — a confirmed resolution reads as observed, not as the probable one", () => {
  // Triangulates the marker: with only the 🟡 example above, the whole scale
  // could be one hard-coded string and every card would claim the same thing.
  const note = renderFiledNote({
    type: "person",
    title: "Hossam Laanait",
    tags: ["visma"],
    body: "CTO Visma France.",
    confidence: { level: "observed", basis: "his own announcement, 04/06, quoted in the note." },
    today: "2026-08-03",
  });
  assert.match(
    note.content,
    /^> \*\*Confidence\*\* — ✅ observed · his own announcement, 04\/06, quoted in the note\.$/m,
    "an observed resolution must not be rendered in the probable marker",
  );
});

test("renderFiledNote — a level outside the scale is refused, never rendered as `undefined`", () => {
  // Fail-loud (ADR 0009). Rendered leniently, "🤷 undefined" is a card whose
  // reliability line says nothing while LOOKING like it says something — the
  // exact conflation this block exists to end.
  assert.throws(
    () =>
      renderFiledNote({
        type: "person",
        title: "Jane Doe",
        tags: ["acme"],
        body: "…",
        confidence: { level: "pretty sure", basis: "a hunch" },
        today: "2026-08-03",
      }),
    /confidence level "pretty sure".*observed, probable, unverified/s,
    "the refusal must name the offending level AND the scale that would be accepted",
  );
});

test("renderFiledNote — a marker with no basis is refused: an unbacked marker is decoration", () => {
  // The marker is a claim ABOUT a claim. Without what it rests on, "✅ observed"
  // is unfalsifiable — the reader cannot tell a sourced resolution from a
  // confident one, which is where this whole release started.
  assert.throws(
    () =>
      renderFiledNote({
        type: "person",
        title: "Jane Doe",
        tags: ["acme"],
        body: "…",
        confidence: { level: "observed" },
        today: "2026-08-03",
      }),
    /confidence "observed" needs a basis/,
    "a level with nothing behind it must not be writable",
  );
  // And a basis made of spaces is nothing behind it too — it renders as
  // "✅ observed · " , a marker whose justification is a blank the eye slides
  // over, which is the very look the block exists to end.
  assert.throws(
    () =>
      renderFiledNote({
        type: "person",
        title: "Jane Doe",
        tags: ["acme"],
        body: "…",
        confidence: { level: "observed", basis: "   " },
        today: "2026-08-03",
      }),
    /confidence "observed" needs a basis/,
  );
});

test("renderFiledNote — the level is ALSO a frontmatter field, not only prose", () => {
  // The claim discipline's own §4.6: a caveat left in prose is a caveat the next
  // session absorbs as confidence. Machine-visible means a FIELD — something
  // `/lint`, a query or a later pass can find without reading the sentence.
  const note = renderFiledNote({
    type: "person",
    title: "Jane Doe",
    tags: ["acme"],
    body: "…",
    confidence: { level: "unverified", basis: "no source names her team." },
    today: "2026-08-03",
  });
  assert.match(
    note.content,
    /^tags: \[acme\]\nconfidence: unverified\n---$/m,
    "the field belongs in the frontmatter, right after tags",
  );
});

test("renderFiledNote — `distinguish` becomes the homonymy block, right under the title", () => {
  const note = renderFiledNote({
    type: "person",
    title: "Romain Lefèvre",
    tags: ["acme"],
    body: "SRE, joined in March.",
    distinguish: "SRE at Acme — not [[people/romain-durand]] (product), nor Romain the freelance.",
    today: "2026-08-03",
  });
  assert.deepEqual(note, {
    path: "people/romain-lefevre.md",
    content: `---
type: person
created: 2026-08-03
updated: 2026-08-03
tags: [acme]
---

# Romain Lefèvre

> **Which one** — SRE at Acme — not [[people/romain-durand]] (product), nor Romain the freelance.

SRE, joined in March.
`,
  });
});
