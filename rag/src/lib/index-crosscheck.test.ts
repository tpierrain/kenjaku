import { test } from "node:test";
import assert from "node:assert/strict";
import {
  crosscheckIndex,
  affectedNotes,
  reportLines,
  permanentFindings,
} from "./index-crosscheck.js";
import { STALE_ANSWER_CLAUSE } from "./frontmatter-parser.js";

test("a note edited since it was indexed is reported as answering from stale content", () => {
  const report = crosscheckIndex({
    disk: [{ path: "topics/crise.md", hash: "hash-of-what-is-on-disk-now" }],
    indexed: [{ path: "topics/crise.md", hash: "hash-of-what-was-indexed", chunks: 4 }],
  });

  assert.deepEqual(report.stale, ["topics/crise.md"]);
});

test("a note whose disk content still matches what was indexed is not reported", () => {
  const report = crosscheckIndex({
    disk: [
      { path: "topics/crise.md", hash: "unchanged" },
      { path: "people/lea.md", hash: "edited-since" },
    ],
    indexed: [
      { path: "topics/crise.md", hash: "unchanged", chunks: 4 },
      { path: "people/lea.md", hash: "as-indexed", chunks: 2 },
    ],
  });

  assert.deepEqual(report.stale, ["people/lea.md"]);
});

test("a row whose file is gone from disk is residue, never a stale note", () => {
  const report = crosscheckIndex({
    disk: [{ path: "topics/crise.md", hash: "unchanged" }],
    indexed: [
      { path: "topics/crise.md", hash: "unchanged", chunks: 4 },
      { path: "topics/renamed-away.md", hash: "whatever", chunks: 3 },
    ],
  });

  assert.deepEqual(report.goneFromDisk, ["topics/renamed-away.md"]);
  assert.deepEqual(report.stale, []);
});

test("a note on disk that the index does not hold at all is reported as unsearchable", () => {
  const report = crosscheckIndex({
    disk: [
      { path: "briefings/2026-08-02.md", hash: "written-and-committed" },
      { path: "topics/crise.md", hash: "unchanged" },
    ],
    indexed: [{ path: "topics/crise.md", hash: "unchanged", chunks: 4 }],
  });

  assert.deepEqual(report.missingFromIndex, ["briefings/2026-08-02.md"]);
  assert.deepEqual(report.goneFromDisk, []);
});

test("a document counted by the index but holding no chunk is reported as unsearchable", () => {
  const report = crosscheckIndex({
    disk: [
      { path: "topics/empty.md", hash: "unchanged" },
      { path: "topics/crise.md", hash: "unchanged" },
    ],
    indexed: [
      { path: "topics/empty.md", hash: "unchanged", chunks: 0 },
      { path: "topics/crise.md", hash: "unchanged", chunks: 4 },
    ],
  });

  assert.deepEqual(report.emptyInIndex, ["topics/empty.md"]);
  assert.deepEqual(report.stale, []);
  assert.deepEqual(report.missingFromIndex, []);
});

test("a note the engine's parser rejects is reported WITH the reason it gave", () => {
  const report = crosscheckIndex({
    disk: [
      {
        path: "topics/crise.md",
        hash: "edited-since",
        parseError: 'damaged front-matter key "updated": declared twice, on lines 4 and 7',
      },
      { path: "people/lea.md", hash: "unchanged" },
    ],
    indexed: [
      { path: "topics/crise.md", hash: "as-indexed", chunks: 4 },
      { path: "people/lea.md", hash: "unchanged", chunks: 2 },
    ],
  });

  assert.deepEqual(report.unreadable, [
    {
      path: "topics/crise.md",
      reason: 'damaged front-matter key "updated": declared twice, on lines 4 and 7',
    },
  ]);
  // …and it is ALSO stale: the note stays in the index, answering from the content it
  // was last indexed with. That pairing is the whole point of F15.
  assert.deepEqual(report.stale, ["topics/crise.md"]);
});

test("a note hit by two modes at once is one affected note, not two", () => {
  const report = crosscheckIndex({
    disk: [
      { path: "topics/crise.md", hash: "edited-since", parseError: "damaged front-matter" },
      { path: "briefings/2026-08-02.md", hash: "written-and-committed" },
      { path: "people/lea.md", hash: "unchanged" },
    ],
    indexed: [
      { path: "topics/crise.md", hash: "as-indexed", chunks: 4 },
      { path: "people/lea.md", hash: "unchanged", chunks: 2 },
    ],
  });

  assert.deepEqual(affectedNotes(report), ["briefings/2026-08-02.md", "topics/crise.md"]);
});

test("an index that holds exactly what the vault holds affects no note", () => {
  const report = crosscheckIndex({
    disk: [
      { path: "topics/crise.md", hash: "unchanged" },
      { path: "people/lea.md", hash: "unchanged", parseError: null },
    ],
    indexed: [
      { path: "topics/crise.md", hash: "unchanged", chunks: 4 },
      { path: "people/lea.md", hash: "unchanged", chunks: 2 },
    ],
  });

  assert.deepEqual(affectedNotes(report), []);
});

test("a clean crosscheck reports one reassuring line and nothing else", () => {
  const report = crosscheckIndex({
    disk: [{ path: "topics/crise.md", hash: "unchanged" }],
    indexed: [{ path: "topics/crise.md", hash: "unchanged", chunks: 4 }],
  });

  assert.deepEqual(reportLines(report), [
    "✓ The index holds exactly what the vault holds.",
  ]);
});

test("a bleeding crosscheck names every mode, worst first, with the note and the reason", () => {
  const report = crosscheckIndex({
    disk: [
      {
        path: "topics/crise.md",
        hash: "edited-since",
        parseError: 'damaged front-matter key "updated": declared twice, on lines 4 and 7',
      },
      { path: "briefings/2026-08-02.md", hash: "written-and-committed" },
      { path: "topics/empty.md", hash: "unchanged" },
    ],
    indexed: [
      { path: "topics/crise.md", hash: "as-indexed", chunks: 4 },
      { path: "topics/empty.md", hash: "unchanged", chunks: 0 },
      { path: "topics/renamed-away.md", hash: "residue", chunks: 3 },
    ],
  });

  assert.deepEqual(reportLines(report), [
    "✗ 4 notes are out of step with the index — this brain is not answering from all of them.",
    "",
    "Answering from STALE content (1) — indexed, still answering, from what it held before:",
    "  topics/crise.md",
    "",
    "Frontmatter the engine REFUSES (1) — no re-read can land until it is fixed:",
    '  topics/crise.md — damaged front-matter key "updated": declared twice, on lines 4 and 7',
    "",
    "On disk but ABSENT from the index (1) — committed, and unfindable by search:",
    "  briefings/2026-08-02.md",
    "",
    "Indexed but holding NO chunk (1) — counted as a note, retrievable by nothing:",
    "  topics/empty.md",
    "",
    "In the index but GONE from disk (1) — residue of a delete or a rename:",
    "  topics/renamed-away.md",
  ]);
});

test("a single affected note is announced in the singular", () => {
  const report = crosscheckIndex({
    disk: [{ path: "topics/crise.md", hash: "edited-since" }],
    indexed: [{ path: "topics/crise.md", hash: "as-indexed", chunks: 4 }],
  });

  assert.equal(
    reportLines(report)[0],
    "✗ 1 note is out of step with the index — this brain is not answering from all of them."
  );
});

test("a note the parser refuses WHILE it is still indexed is permanent — and says it still answers", () => {
  const report = crosscheckIndex({
    disk: [
      {
        path: "topics/crise.md",
        hash: "edited-since",
        parseError: 'damaged front-matter key "updated": declared twice, on lines 4 and 7',
      },
    ],
    indexed: [{ path: "topics/crise.md", hash: "as-indexed", chunks: 4 }],
  });

  assert.deepEqual(permanentFindings(report), [
    {
      path: "topics/crise.md",
      reason:
        'damaged front-matter key "updated": declared twice, on lines 4 and 7 — until it is fixed, ' +
        "this note keeps ANSWERING from the content it was last indexed with",
    },
  ]);
});

test("a freshly edited note the engine will simply re-index is NOT a permanent finding", () => {
  const report = crosscheckIndex({
    disk: [
      { path: "topics/crise.md", hash: "edited-a-second-ago" },
      { path: "briefings/2026-08-02.md", hash: "written-a-second-ago" },
      { path: "people/lea.md", hash: "unchanged" },
    ],
    indexed: [
      { path: "topics/crise.md", hash: "as-indexed", chunks: 4 },
      { path: "people/lea.md", hash: "unchanged", chunks: 2 },
      { path: "topics/renamed-away.md", hash: "residue", chunks: 1 },
    ],
  });

  assert.deepEqual(permanentFindings(report), []);
});

test("a note the parser refuses and that never made it in is permanent too — but invisible, not answering", () => {
  const report = crosscheckIndex({
    disk: [
      {
        path: "briefings/2026-08-02.md",
        hash: "written-and-committed",
        parseError: "unquoted value containing \": \" on line 3",
      },
    ],
    indexed: [],
  });

  assert.deepEqual(permanentFindings(report), [
    {
      path: "briefings/2026-08-02.md",
      reason:
        "unquoted value containing \": \" on line 3 — until it is fixed, this note is absent " +
        "from the index, so search cannot find it at all",
    },
  ]);
});

test("a 0-chunk row is permanent too: an unchanged note is skipped by every later reindex", () => {
  const report = crosscheckIndex({
    disk: [
      { path: "topics/empty.md", hash: "unchanged" },
      { path: "people/lea.md", hash: "edited-a-second-ago" },
    ],
    indexed: [
      { path: "topics/empty.md", hash: "unchanged", chunks: 0 },
      { path: "people/lea.md", hash: "as-indexed", chunks: 2 },
    ],
  });

  assert.deepEqual(permanentFindings(report), [
    {
      path: "topics/empty.md",
      reason:
        "indexed but holding no chunk — it is counted as a note and retrievable by nothing, " +
        "and an unchanged note is skipped by every later reindex",
    },
  ]);
});

test("a parser message that ALREADY says the note keeps answering is not made to say it twice", () => {
  // The engine's duplicate-key message ends with that very sentence. Appending our own
  // consequence behind it produced a paragraph that said the same thing twice — so the
  // clause has one owner (the parser), and this is what pins them together.
  const report = crosscheckIndex({
    disk: [
      {
        path: "topics/crise.md",
        hash: "edited-since",
        parseError:
          'damaged front-matter key "updated": declared twice, on lines 4 and 5. A note can ' +
          `only carry one — until one of them is removed, this note ${STALE_ANSWER_CLAUSE}.`,
      },
    ],
    indexed: [{ path: "topics/crise.md", hash: "as-indexed", chunks: 4 }],
  });

  assert.deepEqual(permanentFindings(report), [
    {
      path: "topics/crise.md",
      reason:
        'damaged front-matter key "updated": declared twice, on lines 4 and 5. A note can ' +
        `only carry one — until one of them is removed, this note ${STALE_ANSWER_CLAUSE}.`,
    },
  ]);
});
