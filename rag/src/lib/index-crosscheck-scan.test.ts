import { test } from "node:test";
import assert from "node:assert/strict";
import { collectDiskNotes } from "./index-crosscheck-scan.js";
import { sha256 } from "./index-manager.js";

const raw = "---\ntitle: Crise\n---\n\nBody.\n";

test("each scanned note comes back keyed like the index, with the ENGINE's own hash", async () => {
  const notes = await collectDiskNotes({
    scan: async () => [
      { absolutePath: "/brain/vault/topics/crise.md", relativePath: "topics/crise.md" },
    ],
    readFile: async () => raw,
    parse: () => {},
  });

  assert.deepEqual(notes, [
    { path: "topics/crise.md", hash: sha256(raw), parseError: null },
  ]);
});

test("a note the parser refuses carries the parser's own message, and the scan goes on", async () => {
  const damaged = "---\nupdated: 2026-08-01\nupdated: 2026-08-02\n---\n\nBody.\n";

  const notes = await collectDiskNotes({
    scan: async () => [
      { absolutePath: "/brain/vault/topics/crise.md", relativePath: "topics/crise.md" },
      { absolutePath: "/brain/vault/people/lea.md", relativePath: "people/lea.md" },
    ],
    readFile: async (abs) => (abs.endsWith("crise.md") ? damaged : raw),
    parse: (_raw, relativePath) => {
      if (relativePath === "topics/crise.md") {
        throw new Error('damaged front-matter key "updated": declared twice, on lines 2 and 3');
      }
    },
  });

  assert.deepEqual(notes, [
    {
      path: "topics/crise.md",
      hash: sha256(damaged),
      parseError: 'damaged front-matter key "updated": declared twice, on lines 2 and 3',
    },
    { path: "people/lea.md", hash: sha256(raw), parseError: null },
  ]);
});

test("a note that cannot even be READ stays on the disk side, so its index row is never called residue", async () => {
  const notes = await collectDiskNotes({
    scan: async () => [
      { absolutePath: "/brain/vault/topics/crise.md", relativePath: "topics/crise.md" },
      { absolutePath: "/brain/vault/people/lea.md", relativePath: "people/lea.md" },
    ],
    readFile: async (abs) => {
      if (abs.endsWith("crise.md")) throw new Error("EACCES: permission denied");
      return raw;
    },
    parse: () => {},
  });

  assert.deepEqual(notes, [
    { path: "topics/crise.md", hash: "", parseError: "EACCES: permission denied" },
    { path: "people/lea.md", hash: sha256(raw), parseError: null },
  ]);
});
