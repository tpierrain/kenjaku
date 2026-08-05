import { test } from "node:test";
import assert from "node:assert/strict";

import { consolidationCandidates, hasCandidates, reportLines } from "./consolidation-candidates.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// consolidation-candidates — the pure, I/O-free core of Track C ("consolidate
// raw captures into entity/topic pages", ADR 0009 rung 1). Given already-parsed
// notes it surfaces WHAT needs consolidating, grouped by target page: entity
// mentions that lack a page (new-page candidates) and entity pages a fresher
// capture has left behind (refresh candidates). Resumability is STATELESS: a
// capture is a candidate purely because it is fresher than the page it feeds
// (or that page doesn't exist yet). The LLM fan-out does the merge; the write
// reuses Track B. Reuses Track A's link extraction + resolver + note shape.
// ═══════════════════════════════════════════════════════════════════════════

test("consolidationCandidates — an empty vault yields no candidates", () => {
  assert.deepEqual(consolidationCandidates([]), { newPages: [], refreshes: [] });
});

test("consolidationCandidates — only captures drive candidates; a curated page's mention is ignored", () => {
  const notes = [
    {
      path: "meetings/2026-07-15-revue.md",
      frontmatter: { type: "meeting", updated: "2026-07-15" },
      body: "[[Marie Dupont]] a tranché.",
    },
    {
      path: "topics/rag.md",
      frontmatter: { type: "topic", updated: "2026-07-15" },
      body: "See [[Some Missing Concept]].",
    },
  ];
  assert.deepEqual(consolidationCandidates(notes), {
    newPages: [
      { target: "Marie Dupont", sources: [{ path: "meetings/2026-07-15-revue.md", updated: "2026-07-15" }] },
    ],
    refreshes: [],
  });
});

test("consolidationCandidates — the same missing target across two captures groups into one candidate, sources sorted", () => {
  const notes = [
    {
      path: "meetings/2026-07-16-suivi.md",
      frontmatter: { type: "meeting", updated: "2026-07-16" },
      body: "Point avec [[Marie Dupont]].",
    },
    {
      path: "daily/2026-07-15.md",
      frontmatter: { type: "daily", updated: "2026-07-15" },
      body: "Échange [[Marie Dupont]] sur le RAG.",
    },
  ];
  assert.deepEqual(consolidationCandidates(notes), {
    newPages: [
      {
        target: "Marie Dupont",
        sources: [
          { path: "daily/2026-07-15.md", updated: "2026-07-15" },
          { path: "meetings/2026-07-16-suivi.md", updated: "2026-07-16" },
        ],
      },
    ],
    refreshes: [],
  });
});

test("consolidationCandidates — distinct new-page candidates come out sorted by target (deterministic)", () => {
  const notes = [
    {
      path: "meetings/2026-07-15-revue.md",
      frontmatter: { type: "meeting", updated: "2026-07-15" },
      body: "[[Zoe Zeta]] then [[Alice Alpha]].",
    },
  ];
  assert.deepEqual(
    consolidationCandidates(notes).newPages.map((c) => c.target),
    ["Alice Alpha", "Zoe Zeta"],
  );
});

test("consolidationCandidates — a mention resolving to an existing (not-stale) page is not a new-page candidate", () => {
  const notes = [
    {
      path: "meetings/2026-07-15-revue.md",
      frontmatter: { type: "meeting", updated: "2026-07-15" },
      body: "[[people/marie-dupont]] a tranché.",
    },
    {
      path: "people/marie-dupont.md",
      frontmatter: { type: "person", updated: "2026-07-15" },
      body: "Head of Platform.",
    },
  ];
  assert.deepEqual(consolidationCandidates(notes), { newPages: [], refreshes: [] });
});

// ── refresh candidates: an entity page a fresher capture has left behind ───────

test("consolidationCandidates — an entity page older than a capture citing it is a refresh candidate", () => {
  const notes = [
    {
      path: "meetings/2026-07-15-revue.md",
      frontmatter: { type: "meeting", updated: "2026-07-15" },
      body: "On a reparlé de [[topics/rag]] en profondeur.",
    },
    {
      path: "topics/rag.md",
      frontmatter: { type: "topic", updated: "2026-04-01" },
      body: "Retrieval-augmented generation.",
    },
  ];
  assert.deepEqual(consolidationCandidates(notes), {
    newPages: [],
    refreshes: [
      {
        page: "topics/rag.md",
        updated: "2026-04-01",
        sources: [{ path: "meetings/2026-07-15-revue.md", updated: "2026-07-15" }],
      },
    ],
  });
});

test("consolidationCandidates — refreshes group multiple fresher captures per page and come out sorted", () => {
  const notes = [
    { path: "topics/rag.md", frontmatter: { type: "topic", updated: "2026-04-01" }, body: "RAG." },
    { path: "people/alice.md", frontmatter: { type: "person", updated: "2026-03-01" }, body: "Alice." },
    {
      path: "meetings/2026-07-15-revue.md",
      frontmatter: { type: "meeting", updated: "2026-07-15" },
      body: "Reparlé de [[topics/rag]].",
    },
    {
      path: "daily/2026-07-16.md",
      frontmatter: { type: "daily", updated: "2026-07-16" },
      body: "[[topics/rag]] et [[people/alice]].",
    },
  ];
  assert.deepEqual(consolidationCandidates(notes), {
    newPages: [],
    refreshes: [
      {
        page: "people/alice.md",
        updated: "2026-03-01",
        sources: [{ path: "daily/2026-07-16.md", updated: "2026-07-16" }],
      },
      {
        page: "topics/rag.md",
        updated: "2026-04-01",
        sources: [
          { path: "daily/2026-07-16.md", updated: "2026-07-16" },
          { path: "meetings/2026-07-15-revue.md", updated: "2026-07-15" },
        ],
      },
    ],
  });
});

test("consolidationCandidates — EVERY entity type a page can carry is refreshable, not just person and topic", () => {
  // The five types are one list and are only proven by feeding all of it. Dropped
  // silently, `company` would mean a whole class of curated pages quietly stopping
  // to be proposed for refresh — invisible, since the gesture simply says nothing.
  const capture = {
    path: "meetings/2026-07-15.md",
    frontmatter: { type: "meeting", updated: "2026-07-15" },
    body: "[[pages/alice]] [[pages/rag]] [[pages/acme]] [[pages/atlas]] [[pages/hexagonal]]",
  };
  const page = (type, slug) => ({
    path: `pages/${slug}.md`,
    frontmatter: { type, updated: "2026-04-01" },
    body: "",
  });
  const report = consolidationCandidates([
    capture,
    page("person", "alice"),
    page("topic", "rag"),
    page("company", "acme"),
    page("project", "atlas"),
    page("concept", "hexagonal"),
  ]);
  assert.deepEqual(report.newPages, []);
  assert.deepEqual(
    report.refreshes.map((r) => r.page),
    ["pages/acme.md", "pages/alice.md", "pages/atlas.md", "pages/hexagonal.md", "pages/rag.md"],
  );
});

test("consolidationCandidates — a capture with no updated date can't be proven fresher, so it's no refresh (fail-safe)", () => {
  const notes = [
    {
      path: "daily/2026-07-15.md",
      frontmatter: { type: "daily" }, // no `updated` → freshness unknown
      body: "[[topics/rag]] encore.",
    },
    { path: "topics/rag.md", frontmatter: { type: "topic", updated: "2026-01-01" }, body: "RAG." },
  ];
  assert.deepEqual(consolidationCandidates(notes), { newPages: [], refreshes: [] });
});

test("consolidationCandidates — captureZones is configurable: a bespoke zone drives candidates, defaults don't", () => {
  const notes = [
    {
      path: "journal/2026-07-15.md",
      frontmatter: { type: "journal", updated: "2026-07-15" },
      body: "[[Marie Dupont]].",
    },
    {
      path: "meetings/2026-07-15-revue.md",
      frontmatter: { type: "meeting", updated: "2026-07-15" },
      body: "[[Someone Else]].",
    },
  ];
  assert.deepEqual(consolidationCandidates(notes, { captureZones: ["journal/"] }), {
    newPages: [
      { target: "Marie Dupont", sources: [{ path: "journal/2026-07-15.md", updated: "2026-07-15" }] },
    ],
    refreshes: [],
  });
});

test("consolidationCandidates — an entity page fresher than the capture citing it is not a refresh candidate", () => {
  const notes = [
    {
      path: "meetings/2026-04-01-vieux.md",
      frontmatter: { type: "meeting", updated: "2026-04-01" },
      body: "Première mention de [[topics/rag]].",
    },
    {
      path: "topics/rag.md",
      frontmatter: { type: "topic", updated: "2026-07-15" },
      body: "Retrieval-augmented generation, à jour.",
    },
  ];
  assert.deepEqual(consolidationCandidates(notes), { newPages: [], refreshes: [] });
});

test("consolidationCandidates — a capture citing a resolved NON-entity note (another capture) is not a refresh", () => {
  const notes = [
    {
      path: "meetings/2026-07-16-suivi.md",
      frontmatter: { type: "meeting", updated: "2026-07-16" },
      body: "Fait suite à [[meetings/2026-07-15-revue]].",
    },
    {
      path: "meetings/2026-07-15-revue.md",
      frontmatter: { type: "meeting", updated: "2026-07-15" },
      body: "Revue archi.",
    },
  ];
  assert.deepEqual(consolidationCandidates(notes), { newPages: [], refreshes: [] });
});

// ── new-page candidates: an entity mentioned in a capture but with no page ─────

test("consolidationCandidates — a capture's unresolved mention is a new-page candidate", () => {
  const notes = [
    {
      path: "meetings/2026-07-15-revue.md",
      frontmatter: { type: "meeting", updated: "2026-07-15" },
      body: "[[Marie Dupont]] a tranché : on part sur du RAG local.",
    },
  ];
  assert.deepEqual(consolidationCandidates(notes), {
    newPages: [
      { target: "Marie Dupont", sources: [{ path: "meetings/2026-07-15-revue.md", updated: "2026-07-15" }] },
    ],
    refreshes: [],
  });
});

test("consolidationCandidates — an `_inbox/` capture drives candidates like an `inbox/` one", () => {
  // The lint and the consolidation keep TWO spellings of "what a capture zone is"
  // (this list and wiki-lint's RAW_CAPTURE_ZONES). Teaching only the lint about the
  // underscored inbox would have stopped the false orphans while leaving every note
  // in it invisible to consolidation — the same defect, moved one surface over.
  const notes = [
    {
      path: "_inbox/2026-08-05-note.md",
      frontmatter: { updated: "2026-08-05" },
      body: "[[Marie Dupont]] a tranché.",
    },
    {
      path: "acme/_inbox/capture.md",
      frontmatter: { updated: "2026-08-05" },
      body: "[[Jean Dujardin]] aussi.",
    },
  ];
  assert.deepEqual(consolidationCandidates(notes), {
    newPages: [
      { target: "Jean Dujardin", sources: [{ path: "acme/_inbox/capture.md", updated: "2026-08-05" }] },
      { target: "Marie Dupont", sources: [{ path: "_inbox/2026-08-05-note.md", updated: "2026-08-05" }] },
    ],
    refreshes: [],
  });
});

// ── universe-aware (ADR 0034): paths gain a leading <universe>/ segment ────────

test("consolidationCandidates — a capture under <universe>/meetings/… still drives candidates, universe-relative links resolve", () => {
  // Regression: `isCapture` (startsWith zone) and the shared resolver both ignored
  // the leading `<universe>/` segment, so a universe capture was missed AND its
  // universe-relative `[[people/x]]` to an existing older page was a false new-page.
  const notes = [
    {
      path: "acme/meetings/2026-07-15-revue.md",
      frontmatter: { type: "meeting", updated: "2026-07-15" },
      body: "Reparlé de [[people/marie-dupont]] et de [[Some Missing Concept]].",
    },
    {
      path: "acme/people/marie-dupont.md",
      frontmatter: { type: "person", updated: "2026-04-01" },
      body: "Head of Platform.",
    },
  ];
  assert.deepEqual(consolidationCandidates(notes), {
    newPages: [
      {
        target: "Some Missing Concept",
        sources: [{ path: "acme/meetings/2026-07-15-revue.md", updated: "2026-07-15" }],
      },
    ],
    refreshes: [
      {
        page: "acme/people/marie-dupont.md",
        updated: "2026-04-01",
        sources: [{ path: "acme/meetings/2026-07-15-revue.md", updated: "2026-07-15" }],
      },
    ],
  });
});

// ── hasCandidates: the binary signal the CLI turns into an exit code ───────────

test("hasCandidates — an empty report is false (nothing to consolidate)", () => {
  assert.equal(hasCandidates({ newPages: [], refreshes: [] }), false);
});

test("hasCandidates — true when only new-page candidates exist", () => {
  assert.equal(hasCandidates({ newPages: [{ target: "X", sources: [] }], refreshes: [] }), true);
});

test("hasCandidates — true when only refresh candidates exist", () => {
  assert.equal(hasCandidates({ newPages: [], refreshes: [{ page: "topics/x.md", updated: "2026-01-01", sources: [] }] }), true);
});

// ── reportLines: an honest, human-readable rendering of the candidates ─────────

test("reportLines — a clean report is one reassuring line (nothing to consolidate)", () => {
  assert.deepEqual(reportLines({ newPages: [], refreshes: [] }), ["✓ Nothing to consolidate"]);
});

test("reportLines — renders both sections with counts, sources, and a titled header", () => {
  const report = {
    newPages: [
      {
        target: "Marie Dupont",
        sources: [{ path: "daily/2026-07-15.md" }, { path: "meetings/2026-07-16.md" }],
      },
    ],
    refreshes: [
      { page: "topics/rag.md", updated: "2026-04-01", sources: [{ path: "meetings/2026-07-15-revue.md" }] },
    ],
  };
  assert.deepEqual(reportLines(report), [
    "✗ Consolidation candidates found",
    "",
    "New pages to create (1):",
    "  [[Marie Dupont]] — cited by 2: daily/2026-07-15.md, meetings/2026-07-16.md",
    "",
    "Entity pages to refresh (1):",
    "  topics/rag.md (updated 2026-04-01) — 1 fresher: meetings/2026-07-15-revue.md",
  ]);
});

test("reportLines — a category with nothing in it gets NO header, not a header reading (0)", () => {
  // An empty section printed as `Entity pages to refresh (0):` is a finding that
  // isn't one: the reader scans the headers, not the counts. Same discipline as the
  // clean line above — say only what is true (CONVENTIONS §5quater).
  const report = {
    newPages: [{ target: "Marie Dupont", sources: [{ path: "daily/2026-07-15.md" }] }],
    refreshes: [],
  };
  assert.deepEqual(reportLines(report), [
    "✗ Consolidation candidates found",
    "",
    "New pages to create (1):",
    "  [[Marie Dupont]] — cited by 1: daily/2026-07-15.md",
  ]);
});

test("reportLines — a page with SEVERAL fresher sources lists them comma-separated, not run together", () => {
  // Two sources is the smallest list that can prove a separator exists at all; with
  // one, `join(", ")` and `join("")` render identically and the reader would be
  // handed `daily/a.mddaily/b.md` the first time a page had two captures behind it.
  const report = {
    newPages: [],
    refreshes: [
      {
        page: "topics/rag.md",
        updated: "2026-04-01",
        sources: [{ path: "daily/2026-07-15.md" }, { path: "daily/2026-07-16.md" }],
      },
    ],
  };
  assert.deepEqual(reportLines(report), [
    "✗ Consolidation candidates found",
    "",
    "Entity pages to refresh (1):",
    "  topics/rag.md (updated 2026-04-01) — 2 fresher: daily/2026-07-15.md, daily/2026-07-16.md",
  ]);
});
