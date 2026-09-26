import { test } from "node:test";
import assert from "node:assert/strict";

import {
  sessionFileName,
  opensFreshWindow,
  citedNotePaths,
  universeOfNote,
  namedUniverses,
  parseReads,
  linesToAppend,
  renameInReads,
  sessionsToPrune,
  MAX_SESSIONS,
} from "./conversation-reads.mjs";

// Issue #130 — what a conversation actually read, per session id, so the switch can
// stop claiming a residue it cannot see. Pure: the hook and the CLI own the I/O.
//
// What is recorded is the universe of every note a vault tool RETURNED (its own
// frontmatter, the indexer's rule), never the pointer at the time of the read: the
// pointer says where the server meant to look, the notes say what reached the window.

// ── which notes reached the window ─────────────────────────────────────────────

// The citation shape formatSearchCitations renders (rag/src/lib/citation-renderer.ts),
// written out by hand rather than produced by it (a fixture never comes from the code
// under test), with two notes and an excerpt between them.
const TWO_CITATIONS =
  "### 1. Deal — Notes\n" +
  "**Path:** `vault/acme/deals/big-deal.md` | **Type:** topic | **Score:** 0.812\n" +
  "🧠 [local copy](<file:///b/vault/acme/deals/big-deal.md>)\n" +
  "_Ask me to \"open citation 1\"…_\n\nSome excerpt.\n\n---\n\n" +
  "### 2. Jane — Bio\n" +
  "**Path:** `vault/people/jane doe.md` | **Type:** person | **Score:** 0.700\n" +
  "🧠 [local copy](<file:///b/vault/people/jane%20doe.md>)\n\nAnother excerpt.";

test("citedNotePaths — a search answer yields every note it cites, in order", () => {
  // The MCP content array, which is what PostToolUse hands over (seen live, 2026-09-26).
  assert.deepEqual(
    citedNotePaths({
      toolName: "mcp__vault-rag__search_vault",
      toolInput: { query: "q" },
      toolResponse: [{ type: "text", text: TWO_CITATIONS }],
    }),
    ["acme/deals/big-deal.md", "people/jane doe.md"],
  );
});

test("citedNotePaths — the response may also arrive wrapped, or as a bare string", () => {
  for (const toolResponse of [{ content: [{ type: "text", text: TWO_CITATIONS }] }, TWO_CITATIONS]) {
    assert.deepEqual(
      citedNotePaths({ toolName: "mcp__vault-rag__search_vault", toolInput: {}, toolResponse }),
      ["acme/deals/big-deal.md", "people/jane doe.md"],
    );
  }
});

test("citedNotePaths — an answer that cites nothing read nothing (no results, stale-index gate)", () => {
  for (const text of [
    "No results found in the vault.",
    "⚠️ Your notes were indexed with another engine… reindex?",
    // A path mentioned in prose, not as a citation line, is not a note returned.
    "See **Path:** `vault/acme/x.md` mentioned inline.",
  ]) {
    assert.deepEqual(
      citedNotePaths({ toolName: "mcp__vault-rag__search_vault", toolInput: {}, toolResponse: [{ type: "text", text }] }),
      [],
      text,
    );
  }
  assert.deepEqual(
    citedNotePaths({ toolName: "mcp__vault-rag__search_vault", toolInput: {}, toolResponse: undefined }),
    [],
  );
});

test("citedNotePaths — get_document read exactly the note it was asked for", () => {
  assert.deepEqual(
    citedNotePaths({
      toolName: "mcp__vault-rag__get_document",
      toolInput: { path: "acme/deals/big-deal.md" },
      // Its answer is the note itself: a citation-looking line inside it is not a read.
      toolResponse: [{ type: "text", text: TWO_CITATIONS }],
    }),
    ["acme/deals/big-deal.md"],
  );
  for (const toolInput of [{}, { path: "" }, { path: 42 }, undefined]) {
    assert.deepEqual(
      citedNotePaths({ toolName: "mcp__vault-rag__get_document", toolInput, toolResponse: [] }),
      [],
      JSON.stringify(toolInput),
    );
  }
});

test("citedNotePaths — any other tool read nothing from the vault", () => {
  assert.deepEqual(
    citedNotePaths({
      toolName: "mcp__vault-rag__list_documents",
      toolInput: { path: "acme/a.md" },
      toolResponse: [{ type: "text", text: TWO_CITATIONS }],
    }),
    [],
  );
});

// ── which universe a note belongs to ───────────────────────────────────────────

test("universeOfNote — the note's own frontmatter decides, as the indexer does", () => {
  assert.equal(universeOfNote("---\ntype: topic\nuniverse: acme\n---\nbody"), "acme");
  assert.equal(universeOfNote("---\r\nuniverse:   blue  \r\n---\r\nbody"), "blue");
  // YAML quoting is unwrapped, both kinds.
  assert.equal(universeOfNote('---\nuniverse: "acme"\n---\n'), "acme");
  assert.equal(universeOfNote("---\nuniverse: 'blue'\n---\n"), "blue");
});

test("universeOfNote — a note that declares none is cross-cutting (default)", () => {
  for (const raw of [
    "---\ntype: topic\n---\nbody",
    "no frontmatter at all\nuniverse: acme",
    "---\nuniverse:\n---\n",
    "---\nsubuniverse: acme\n---\n",
    "",
  ]) {
    assert.equal(universeOfNote(raw), "default", JSON.stringify(raw));
  }
  // Only the frontmatter counts: a `universe:` line in the body is prose.
  assert.equal(universeOfNote("---\ntype: x\n---\nuniverse: acme\n"), "default");
});

test("namedUniverses — the named ones, once each, in the order met", () => {
  assert.deepEqual(namedUniverses(["blue", "default", "acme", "blue", "default"]), ["blue", "acme"]);
  assert.deepEqual(namedUniverses(["default"]), []);
  assert.deepEqual(namedUniverses([]), []);
});

// ── the record: one append-only file per conversation ──────────────────────────

test("sessionFileName — a session id becomes a file name only when it is safe as one", () => {
  assert.equal(sessionFileName("e0ec1ab5-1eb3-4100-813d-424d7bce5a8c"), "e0ec1ab5-1eb3-4100-813d-424d7bce5a8c");
  assert.equal(sessionFileName("s_1"), "s_1");
  for (const bad of [undefined, null, "", "../x", "a/b", "a\\b", "a.b", "x".repeat(129), 42]) {
    assert.equal(sessionFileName(bad), null, String(bad));
  }
  assert.equal(sessionFileName("x".repeat(128)), "x".repeat(128));
});

test("opensFreshWindow — only startup and /clear begin with an empty window", () => {
  // A resumed or compacted conversation may hold reads from before: opening an empty
  // record for it would vouch for a silence nobody observed.
  assert.equal(opensFreshWindow("startup"), true);
  assert.equal(opensFreshWindow("clear"), true);
  for (const source of ["resume", "compact", undefined, ""]) {
    assert.equal(opensFreshWindow(source), false, String(source));
  }
});

test("parseReads — one universe per line, blanks and repeats collapsed", () => {
  // Two hooks appending at once may both add the same line: harmless, by design.
  assert.deepEqual(parseReads("acme\nblue\n\nacme\n  \nzeta\n"), ["acme", "blue", "zeta"]);
  assert.deepEqual(parseReads("acme\r\nblue\r\n"), ["acme", "blue"]);
  assert.deepEqual(parseReads(""), []);
});

test("linesToAppend — only the universes not recorded yet, one line each", () => {
  assert.equal(linesToAppend("acme\n", ["blue", "acme", "zeta", "blue"]), "blue\nzeta\n");
  assert.equal(linesToAppend("acme\nblue\n", ["blue", "acme"]), "");
  assert.equal(linesToAppend("", ["acme"]), "acme\n");
  assert.equal(linesToAppend("", []), "");
});

test("renameInReads — a renamed universe is renamed in the record too", () => {
  // Otherwise the switch would name a universe that no longer exists, and would report
  // the renamed one as out of scope when it is the very destination.
  assert.equal(renameInReads("blue\nacme\nzeta\n", "acme", "acme-corp"), "blue\nacme-corp\nzeta\n");
  // A line that merely CONTAINS the old name is another universe.
  assert.equal(renameInReads("acme-labs\nacme\n", "acme", "x"), "acme-labs\nx\n");
  assert.equal(renameInReads("blue\n", "acme", "x"), "blue\n");
  // Renaming onto a universe already recorded leaves one line, not two.
  assert.equal(renameInReads("acme\nx\n", "acme", "x"), "x\n");
});

test("sessionsToPrune — keeps the most recent conversations, names the rest", () => {
  const entries = [...Array(MAX_SESSIONS + 2).keys()]
    .map((i) => ({ name: `s${i}`, mtimeMs: 1000 + i }))
    // Unsorted on purpose: the order on disk means nothing.
    .sort((a, b) => (a.name < b.name ? 1 : -1));
  assert.deepEqual(sessionsToPrune(entries).sort(), ["s0", "s1"]);
  assert.deepEqual(sessionsToPrune(entries.slice(0, MAX_SESSIONS)), []);
  assert.deepEqual(sessionsToPrune([]), []);
  assert.deepEqual(
    sessionsToPrune([{ name: "old", mtimeMs: 1 }, { name: "new", mtimeMs: 3 }, { name: "mid", mtimeMs: 2 }], 2),
    ["old"],
  );
});
