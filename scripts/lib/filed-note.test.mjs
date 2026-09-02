import { test } from "node:test";
import assert from "node:assert/strict";

import { slugify, slugSafe, filedNotePath, renderFiledNote, homonymCards, sourcesBlock } from "./filed-note.mjs";

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

// Every note declares what it was built from (see the source header section at
// the bottom of this file). The tests below are about something else, so they
// declare the plainest source there is — the exchange itself — rather than
// re-stating the header's own scale each time.
const SAID_HERE = [{ tier: "conversation", ref: "worked out with the user in this session" }];
const SAID_HERE_BLOCK = `> **Sources**
> - 💬 this conversation · worked out with the user in this session`;

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
    sources: SAID_HERE,
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
    sources: SAID_HERE,
    date: "2026-07-17",
    today: "2026-07-17",
  });
  assert.deepEqual(note, {
    sourceKeys: [],
    path: "decisions/2026-07-17-adopt-the-hive.md",
    content: `---
type: decision
created: 2026-07-17
updated: 2026-07-17
tags: [architecture]
source_tier: conversation
---

# Adopt The Hive

${SAID_HERE_BLOCK}

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
    sources: SAID_HERE,
    today: "2026-07-17",
    universe: "acme",
  });
  assert.deepEqual(note, {
    sourceKeys: [],
    path: "acme/topics/capacity-management.md",
    content: `---
type: topic
created: 2026-07-17
updated: 2026-07-17
tags: [rag]
source_tier: conversation
universe: acme
---

# Capacity Management

${SAID_HERE_BLOCK}

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
    sources: SAID_HERE,
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
    sources: SAID_HERE,
    today: "2026-07-17",
  });
  assert.deepEqual(note, {
    sourceKeys: [],
    path: "topics/capacity-management.md",
    content: `---
type: topic
created: 2026-07-17
updated: 2026-07-17
tags: [rag, retrieval]
source_tier: conversation
---

# Capacity Management

${SAID_HERE_BLOCK}

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
    sources: [{ tier: "ai-summary", ref: "the Gemini notes of the 08-02 sync" }],
    today: "2026-08-03",
  });
  // The two blocks answer two different questions and both belong on the card:
  // how sure the resolution is, and what it was resolved FROM. This card is the
  // field case itself — a name welded together inside an AI synthesis — and it
  // now says both, in that order.
  assert.deepEqual(note, {
    sourceKeys: [],
    path: "people/jeremy-hinard.md",
    content: `---
type: person
created: 2026-08-03
updated: 2026-08-03
tags: [candor]
confidence: probable
source_tier: ai-summary
---

# Jérémy Hinard

> **Confidence** — 🟡 derived or probable · source said "Jérémy (front Candor)"; the surname comes from the Candor org note.

> **Sources**
> - 🤖 AI synthesis · the Gemini notes of the 08-02 sync

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
    sources: SAID_HERE,
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
        sources: SAID_HERE,
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
        sources: SAID_HERE,
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
        sources: SAID_HERE,
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
    sources: SAID_HERE,
    today: "2026-08-03",
  });
  assert.match(
    note.content,
    /^tags: \[acme\]\nconfidence: unverified\n/m,
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
    sources: SAID_HERE,
    today: "2026-08-03",
  });
  assert.deepEqual(note, {
    sourceKeys: [],
    path: "people/romain-lefevre.md",
    content: `---
type: person
created: 2026-08-03
updated: 2026-08-03
tags: [acme]
source_tier: conversation
---

# Romain Lefèvre

> **Which one** — SRE at Acme — not [[people/romain-durand]] (product), nor Romain the freelance.

${SAID_HERE_BLOCK}

SRE, joined in March.
`,
  });
});

// ── The source header: what this note was BUILT FROM, and at which tier ───────
// A meeting export held a Gemini summary AND, further down the same file, the
// verbatim transcript. A backlog was built on the summary: a surname welded onto
// a first name, an open question rendered as settled, a fact inverted, three
// names lost that the verbatim resolved. The rule that would have stopped it
// EXISTED in both constitutions ("verbatim > human synthesis > AI synthesis")
// and never fired — it says how to RANK sources when citing, never when to stop
// and go read the raw one. So the builder asks the question instead: a note
// cannot be born without naming what it rests on, and an AI synthesis has to be
// written down AS an AI synthesis, which is what makes the mistake visible the
// second it is made.

test("renderFiledNote — the note says what it was built from, in the tier's own words", () => {
  const note = renderFiledNote({
    type: "meeting",
    title: "Julien sync",
    tags: ["shodo"],
    body: "What was actually said.",
    sources: [{ tier: "verbatim", ref: 'Meet export 2026-08-05, section "Transcription"' }],
    date: "2026-08-05",
    today: "2026-08-05",
  });
  assert.match(
    note.content,
    /^> \*\*Sources\*\*\n> - 📄 verbatim · Meet export 2026-08-05, section "Transcription"$/m,
    "the block names the tier it was built at, then what it was built from",
  );
});

test("renderFiledNote — a tier outside the scale is refused, never rendered as `undefined`", () => {
  // Fail-loud (ADR 0009), and for the same reason the confidence scale is:
  // "undefined · a Meet export" is a header that LOOKS like it declares a tier
  // and declares nothing, which is the conflation the header exists to end.
  assert.throws(
    () =>
      renderFiledNote({
        type: "topic",
        title: "X",
        tags: ["a"],
        body: "b",
        sources: [{ tier: "a document", ref: "the Meet export" }],
        today: "2026-08-05",
      }),
    /source tier "a document".*verbatim, conversation, human-summary, ai-summary/s,
    "the refusal must name the offending tier AND the scale that would be accepted",
  );
});

test("renderFiledNote — a search-result snippet is refused AS a snippet, not as a typo", () => {
  // The first mechanism of the field defect: Drive's `search_files` returned a
  // `contentSnippet` that already held the summary and its "Next steps" list, so
  // the summary was in context BEFORE any document was opened — there was never
  // a "verbatim or summary?" moment at which a ranking rule could apply. A
  // snippet is not a low tier, it is not a source at all, and the refusal has to
  // say which door to take instead: open the document.
  for (const tier of ["snippet", "search-result", "search-snippet", "contentSnippet"]) {
    assert.throws(
      () =>
        renderFiledNote({
          type: "topic",
          title: "X",
          tags: ["a"],
          body: "b",
          sources: [{ tier, ref: "Drive search hit on the Meet export" }],
          today: "2026-08-05",
        }),
      {
        // Asserted whole, not by fragment: every sentence of a refusal is doing
        // work, and the mutation pass showed the last one — the four tiers to
        // answer with — could be blanked with the suite still green. A refusal
        // that names no way forward is a wall.
        message:
          `"${tier}": a search-result snippet is never a source — open the document, read it, ` +
          `and declare the tier you actually read (verbatim, conversation, human-summary, ai-summary).`,
      },
      `"${tier}" must be refused as a snippet, with the gesture that fixes it`,
    );
  }
});

test("renderFiledNote — a tier with no reference is refused: a tier alone names nothing", () => {
  // "📄 verbatim ·" is a header that asserts a reading nobody can go back to.
  // The reference is what makes the declaration checkable — which document,
  // which section, which date — and it is the half a future reader needs when
  // the note turns out to be wrong.
  for (const ref of [undefined, "", "   "]) {
    assert.throws(
      () =>
        renderFiledNote({
          type: "topic",
          title: "X",
          tags: ["a"],
          body: "b",
          sources: [{ tier: "verbatim", ref }],
          today: "2026-08-05",
        }),
      {
        message:
          `source "verbatim" needs a reference: name the document, the section and the date, ` +
          `so the reading can be gone back to.`,
      },
      `a ref of ${JSON.stringify(ref)} is nothing behind the tier`,
    );
  }
});

test("renderFiledNote — a note born of the exchange itself has a tier of its own to say so", () => {
  // Not every filed note comes from a document: the ordinary `/file-back` case
  // is "keep this answer we just worked out". Without a tier for it, the header
  // would force that note to either lie about a document or stay silent — and
  // silence is what the header exists to end. It ranks under `verbatim` (a
  // transcript can be re-read; this exchange is gone at the next /clear) and
  // above anything that re-tells someone else's words.
  const note = renderFiledNote({
    type: "topic",
    title: "Capacity Management",
    tags: ["rag"],
    body: "The distilled answer.",
    sources: [{ tier: "conversation", ref: "worked out with Thomas in this session, 2026-08-05" }],
    today: "2026-08-05",
  });
  assert.match(
    note.content,
    /^> - 💬 this conversation · worked out with Thomas in this session, 2026-08-05$/m,
  );
});

test("renderFiledNote — the WEAKEST declared tier is also a frontmatter field", () => {
  // Same reason as the confidence field: a caveat that lives only in prose is a
  // caveat the next session absorbs as fact. As a field it is findable — "which
  // notes in this vault rest on an AI synthesis?" is a query, not a re-read.
  // The weakest of the declared tiers, not the best: a note that quotes a
  // transcript AND a Gemini summary carries the summary's risk, and stamping
  // `verbatim` there would launder it.
  const note = renderFiledNote({
    type: "meeting",
    title: "Julien sync",
    tags: ["shodo"],
    body: "…",
    sources: [
      { tier: "verbatim", ref: 'Meet export 2026-08-05, section "Transcription"' },
      { tier: "ai-summary", ref: "the Gemini notes at the top of that same export" },
    ],
    date: "2026-08-05",
    today: "2026-08-05",
  });
  assert.match(
    note.content,
    /^tags: \[shodo\]\nsource_tier: ai-summary\n---$/m,
    "the field belongs in the frontmatter, and names the weakest source",
  );
});

test("renderFiledNote — the stamp is the scale's own order, not the order they were listed", () => {
  // Triangulates the previous test: taking the last entry, or the first, would
  // both have passed it. Here the weakest is listed FIRST and the strongest last.
  const note = renderFiledNote({
    type: "topic",
    title: "X",
    tags: ["a"],
    body: "b",
    sources: [
      { tier: "human-summary", ref: "Marie's recap in #general, 2026-08-04" },
      { tier: "verbatim", ref: "the thread she recapped" },
    ],
    today: "2026-08-05",
  });
  assert.match(note.content, /^source_tier: human-summary$/m);
});

test("renderFiledNote — a note that declares no source cannot be born at all", () => {
  // THE load-bearing assertion of the whole header. Left optional, the field is
  // not a net: the failing session never chose the summary over the verbatim —
  // it never met a moment where the question was asked. Required, the question
  // is asked at the one moment that cannot be skipped, the write itself. An
  // undeclared note and a note built on nothing external must not look alike.
  for (const sources of [undefined, []]) {
    assert.throws(
      () =>
        renderFiledNote({
          type: "topic",
          title: "X",
          tags: ["a"],
          body: "b",
          sources,
          today: "2026-08-05",
        }),
      {
        message:
          `at least one source is required: say what this note was built from, as ` +
          `"sources": [{ "tier": …, "ref": … }] — tier is one of ` +
          `verbatim, conversation, human-summary, ai-summary, ref names the document, section and date.`,
      },
      `sources: ${JSON.stringify(sources)} must be refused, naming the scale to answer with`,
    );
  }
});

test("sourcesBlock — several sources are several LINES, not one run-on line", () => {
  // The block is what a human reads to know what the note rests on. Joined with
  // nothing instead of a newline it still contains every word, every fragment
  // match still passes, and the header renders as one unreadable line inside a
  // blockquote. So it is pinned as the exact block, markers included — the
  // markers being the only part a reader takes in at a glance.
  assert.equal(
    sourcesBlock([
      { tier: "verbatim", ref: "Meet export 2026-08-05, Transcription section" },
      { tier: "ai-summary", ref: "same export, Gemini notes at the top" },
    ]),
    [
      "> **Sources**",
      "> - 📄 verbatim · Meet export 2026-08-05, Transcription section",
      "> - 🤖 AI synthesis · same export, Gemini notes at the top",
    ].join("\n"),
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// `sourceKeys` — the MACHINE identity of what a note was captured from (ADR 0041).
//
// ⚠️ It is NOT `sources`, and the two live one field apart in the same spec on
// purpose-built confusion: `sources` says what TIER of material this note rests on
// (verbatim, human synthesis, AI synthesis) and is read by a human; `sourceKeys`
// says WHICH objects it drew on and is read by a grep. A note may carry either,
// both, or neither.
// ═══════════════════════════════════════════════════════════════════════════

const A_MAIL = { type: "mail", from: "Billing <billing@example.com>", date: "2026-09-02T16:19:32Z", subject: "Your invoice is ready" };
const A_THREAD = { type: "slack", channel: "C0CEQ4R5E", ts: "1725283200.001200" };

test("renderFiledNote — the sources it drew on are stamped as normalized keys, and handed back", () => {
  const note = renderFiledNote({
    type: "topic",
    title: "Invoicing",
    tags: ["finance"],
    body: "b",
    sources: SAID_HERE,
    sourceKeys: [A_THREAD, A_MAIL],
    today: "2026-09-02",
  });

  assert.match(
    note.content,
    /^source_tier: conversation\nsources: \[slack\|C0CEQ4R5E\|1725283200\.001200, mail\|billing@example\.com\|20260902T161932Z\|your-invoice-is-ready\]\n---$/m,
    "one inline list, after the tier stamp, in the order the note drew on them",
  );
  assert.deepEqual(note.sourceKeys, [
    "slack|C0CEQ4R5E|1725283200.001200",
    "mail|billing@example.com|20260902T161932Z|your-invoice-is-ready",
  ], "the caller needs them to ask the vault whether it already holds one");
});

test("renderFiledNote — a note that drew on nothing identifiable carries no claim at all", () => {
  for (const spec of [{}, { sourceKeys: [] }]) {
    const note = renderFiledNote({
      type: "topic",
      title: "X",
      tags: ["a"],
      body: "b",
      sources: SAID_HERE,
      today: "2026-09-02",
      ...spec,
    });

    assert.doesNotMatch(note.content, /^sources:/m, "absent means UNKNOWN, and an empty list would claim otherwise");
    assert.deepEqual(note.sourceKeys, []);
  }
});

test("renderFiledNote — one source named twice is one source", () => {
  const note = renderFiledNote({
    type: "topic",
    title: "X",
    tags: ["a"],
    body: "b",
    sources: SAID_HERE,
    sourceKeys: [A_THREAD, { ...A_THREAD, channel: " C0CEQ4R5E " }],
    today: "2026-09-02",
  });

  assert.match(note.content, /^sources: \[slack\|C0CEQ4R5E\|1725283200\.001200\]$/m);
});

test("renderFiledNote — a descriptor that cannot be keyed refuses the note, it does not stamp a guess", () => {
  assert.throws(
    () =>
      renderFiledNote({
        type: "topic",
        title: "X",
        tags: ["a"],
        body: "b",
        sources: SAID_HERE,
        sourceKeys: [{ type: "slack", channel: "C0CEQ4R5E" }],
        today: "2026-09-02",
      }),
    (err) => err.message.includes("ts") && err.message.includes("slack"),
    "half a key matches nothing, so it would be a claim wearing the shape of one",
  );
});

test("renderFiledNote — the machine keys and the human tier stamp coexist without touching", () => {
  const note = renderFiledNote({
    type: "topic",
    title: "X",
    tags: ["a"],
    body: "b",
    sources: [{ tier: "ai-summary", ref: "the connector's own digest" }],
    sourceKeys: [A_MAIL],
    today: "2026-09-02",
  });

  assert.match(note.content, /^source_tier: ai-summary$/m);
  assert.match(note.content, /^sources: \[mail\|billing@example\.com\|20260902T161932Z\|your-invoice-is-ready\]$/m);
});

// `slugSafe` — the same rule as `slugify`, minus the throw. It exists because the
// per-person note paths need to ask "does this name have a slug at all?" and answer
// "no" without an exception: a name written in a script with no Latin letters is a
// legitimate git author, and the right answer there is to fall back to the shared
// path, not to refuse the note. One owner for the slug rule, per CONVENTIONS §5quater.
test("slugSafe — same slug as slugify wherever slugify has one", () => {
  for (const title of ["Jane Doe", "Capacity Management", "Claire Dubois", "Éloïse Martin"]) {
    assert.equal(slugSafe(title), slugify(title), title);
  }
});

test("slugSafe — answers null where slugify throws, instead of throwing", () => {
  for (const title of ["", "   ", "!!!", "日本語"]) {
    assert.equal(slugSafe(title), null, JSON.stringify(title));
    assert.throws(() => slugify(title), /empty slug/, "and slugify keeps its refusal");
  }
});
