import { test } from "node:test";
import assert from "node:assert/strict";
import { crosscheckIndex } from "./index-crosscheck.js";

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
