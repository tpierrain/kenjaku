import { test } from "node:test";
import assert from "node:assert/strict";
import { findDuplicateKey, parseDocument } from "./frontmatter-parser.js";
import { DEFAULT_UNIVERSE } from "./universe.js";

test("prefers the frontmatter title over the filename fallback", () => {
  // Local-mirror pages are named by Notion pageId (a UUID) and carry the real title
  // only in the frontmatter — with no '# Heading' in the body. Without this precedence,
  // parsed.title would be the UUID and the title chunk would be useless for retrieval.
  const raw = "---\ntitle: Naxos\nmirror: travel\n---\n";

  const parsed = parseDocument(raw, "mirrors/travel/8c1f2a3b.md");

  assert.equal(parsed.title, "Naxos");
});

test("exposes the mirror source_url from the frontmatter (clickable Notion link)", () => {
  const raw = "---\ntitle: Naxos\nsource_url: https://www.notion.so/abc\n---\n";

  const parsed = parseDocument(raw, "mirrors/travel/8c1f2a3b.md");

  assert.equal(parsed.sourceUrl, "https://www.notion.so/abc");
});

test("sourceUrl is null when the note has no source_url (non-mirror note)", () => {
  const raw = "---\ntitle: Plain\n---\n# Plain\n";

  const parsed = parseDocument(raw, "topics/plain.md");

  assert.equal(parsed.sourceUrl, null);
});

// --- type detection ---------------------------------------------------------

const PREFIX_TYPES: [string, string][] = [
  ["daily/", "daily"],
  ["people/", "person"],
  ["topics/", "topic"],
  ["decisions/", "decision"],
  ["meetings/", "meeting"],
  ["prep-1-1/", "prep-1-1"],
  ["prep-day/", "prep-day"],
  ["backlog/", "backlog"],
  ["coaching/", "coaching"],
  ["initiatives/", "initiative"],
  ["raw-sources/", "raw-source"],
  ["briefings/", "briefing"],
  ["domains/", "domain"],
  ["drafts/", "draft"],
  ["articles/", "article"],
];

for (const [prefix, expectedType] of PREFIX_TYPES) {
  test(`maps the "${prefix}" folder to type "${expectedType}"`, () => {
    const parsed = parseDocument("body", `${prefix}note.md`);
    assert.equal(parsed.type, expectedType);
  });
}

test("an explicit frontmatter type overrides the folder prefix", () => {
  const parsed = parseDocument("---\ntype: custom\n---\n", "topics/x.md");
  assert.equal(parsed.type, "custom");
});

test("strips the leading universe segment before matching the type folder (ADR 0034)", () => {
  // A created universe's notes live under vault/<universe>/<type>/… . The universe
  // segment must NOT defeat folder-based type detection: acme/daily/… is a daily.
  const parsed = parseDocument("---\nuniverse: acme\n---\n", "acme/daily/2026-07-10.md");
  assert.equal(parsed.type, "daily");
});

test("a universe note with no nested type folder is still \"other\" (strip reveals no type)", () => {
  const parsed = parseDocument("---\nuniverse: acme\n---\n", "acme/loose-note.md");
  assert.equal(parsed.type, "other");
});

test("the strip only fires on the DECLARED universe segment, not any leading folder", () => {
  // universe "acme" does not prefix "people/", so nothing is stripped and the real
  // type folder is honoured. Guards against a mutant that strips the first segment
  // unconditionally (which would turn this person note into "other").
  const parsed = parseDocument("---\nuniverse: acme\n---\n", "people/alice.md");
  assert.equal(parsed.type, "person");
});

test("falls back to type \"other\" for an unknown folder", () => {
  const parsed = parseDocument("body", "unknown-folder/x.md");
  assert.equal(parsed.type, "other");
});

// --- title extraction -------------------------------------------------------

test("trims surrounding whitespace from the frontmatter title", () => {
  const parsed = parseDocument("---\ntitle: '  Naxos  '\n---\n", "topics/x.md");
  assert.equal(parsed.title, "Naxos");
});

test("a blank frontmatter title does not win (falls through to the heading)", () => {
  const parsed = parseDocument("---\ntitle: '   '\n---\n# Real Heading\n", "topics/x.md");
  assert.equal(parsed.title, "Real Heading");
});

test("uses the first Markdown H1 heading when there is no frontmatter title", () => {
  const parsed = parseDocument("intro\n\n# The Heading\n\nbody", "topics/x.md");
  assert.equal(parsed.title, "The Heading");
});

test("falls back to the filename (without .md) when there is no title nor heading", () => {
  const parsed = parseDocument("just a body, no heading", "topics/sub/my-note.md");
  assert.equal(parsed.title, "my-note");
});

test("only treats a '#' at the start of a line as a heading", () => {
  // "C# is great" has a mid-line '# ' that must NOT be read as an H1 heading,
  // otherwise the title would become "is great" instead of the filename.
  const parsed = parseDocument("C# is great here\n", "topics/csharp.md");
  assert.equal(parsed.title, "csharp");
});

test("trims the extracted heading title", () => {
  const parsed = parseDocument("# Heading with trailing spaces   \nbody", "topics/x.md");
  assert.equal(parsed.title, "Heading with trailing spaces");
});

test("strips only the trailing .md extension from the filename", () => {
  // The '$' anchor matters: a literal '.md' earlier in the name must survive.
  const parsed = parseDocument("body", "topics/v2.md-notes.md");
  assert.equal(parsed.title, "v2.md-notes");
});

// --- tags -------------------------------------------------------------------

test("coerces every frontmatter tag to a string", () => {
  const parsed = parseDocument("---\ntags: [alpha, 42]\n---\n", "topics/x.md");
  assert.deepEqual(parsed.tags, ["alpha", "42"]);
});

test("yields an empty tag list when tags is absent or not an array", () => {
  assert.deepEqual(parseDocument("body", "topics/x.md").tags, []);
  assert.deepEqual(
    parseDocument("---\ntags: not-a-list\n---\n", "topics/x.md").tags,
    []
  );
});

// --- universe (ADR 0034) ----------------------------------------------------

test("falls back to the default universe when the frontmatter has none", () => {
  const parsed = parseDocument("---\ntitle: T\n---\n", "topics/x.md");
  assert.equal(parsed.universe, DEFAULT_UNIVERSE);
});

test("reads an explicit non-default universe from the frontmatter", () => {
  const parsed = parseDocument("---\nuniverse: acme\n---\n", "topics/x.md");
  assert.equal(parsed.universe, "acme");
});

test("ignores a non-string universe value (falls back to the default)", () => {
  const parsed = parseDocument("---\nuniverse: [not, a, string]\n---\n", "topics/x.md");
  assert.equal(parsed.universe, DEFAULT_UNIVERSE);
});

test("a blank universe does not win (falls back to the default)", () => {
  const parsed = parseDocument("---\nuniverse: '   '\n---\n", "topics/x.md");
  assert.equal(parsed.universe, DEFAULT_UNIVERSE);
});

test("trims surrounding whitespace from an explicit universe", () => {
  const parsed = parseDocument("---\nuniverse: '  acme  '\n---\n", "topics/x.md");
  assert.equal(parsed.universe, "acme");
});

// --- damaged front-matter (F12) ---------------------------------------------

test("names the duplicated front-matter key, and both of its lines (F12)", () => {
  // The exact shape consolidation produced on a real note: a second `updated:`
  // appended instead of the first being replaced. js-yaml refuses it — but with
  // "duplicated mapping key (5:1)", which names neither the key nor the way out.
  const raw = "---\ntitle: Crise\ncreated: 2026-06-01\nupdated: 2026-06-12\ntype: topic\nupdated: 2026-07-28\n---\n# Crise\n";

  assert.throws(
    () => parseDocument(raw, "topics/crise.md"),
    /front-matter key "updated".*lines 4 and 6/s
  );
});

test("reads the key and the lines from the note, rather than assuming F12's shape", () => {
  const raw = "---\ntags: [a]\ntags: [b]\ntitle: T\n---\nbody\n";

  assert.throws(
    () => parseDocument(raw, "topics/x.md"),
    /front-matter key "tags".*lines 2 and 3/s
  );
});

test("a YAML failure that is NOT a duplicate key keeps its original error", () => {
  // We upgrade one message; we must not relabel every unreadable note as "damaged
  // key", which would send the owner looking for a duplicate that isn't there.
  const raw = "---\ntitle: [unclosed\n---\nbody\n";

  assert.throws(() => parseDocument(raw, "topics/x.md"), /YAMLException/);
});

test("indented lines are not keys: repeated text inside a block scalar is no duplicate", () => {
  // Only unindented, top-level keys count. Two `updated:` lines that are the TEXT of
  // a block scalar must not be reported as a duplicated key — that would send the
  // owner deleting a line of their own prose.
  const raw = "---\ntitle: [unclosed\nsummary: |\n  updated: yesterday\n  updated: today\n---\nbody\n";

  assert.throws(() => parseDocument(raw, "topics/x.md"), /YAMLException/);
});

test("the scan stops at the closing delimiter: the body holds no keys", () => {
  // `updated:` written twice in the note's own body is ordinary prose, not a
  // duplicated front-matter key.
  const raw = "---\ntitle: [unclosed\n---\nupdated: a\nupdated: b\n";

  assert.throws(() => parseDocument(raw, "topics/x.md"), /YAMLException/);
});

test("a list of URLs is not a duplicated key: `- ` items are values, not keys", () => {
  // The shape a person/source note actually has. An unindented block-sequence item
  // whose VALUE holds a colon (`- https://…`) looks like `<something>:` to a loose
  // scan, so two of them were reported as the key `- https` "declared twice" — and
  // the owner was sent to two perfectly valid lines to delete one. We only look once
  // the YAML has already failed for its own reason, so the wrong verdict lands
  // exactly when someone is already confused.
  const raw = "---\ntitle: [unclosed\nlinks:\n- https://a.com\n- https://b.com\n---\nbody\n";

  assert.equal(findDuplicateKey(raw), null);
});

test("a genuinely duplicated key is still named, with both of its lines", () => {
  // F12's own damage — the reason this scan exists. Assert the WHOLE verdict: a
  // check on the key alone would not notice the line numbers pointing elsewhere.
  const raw = "---\ntitle: [unclosed\nupdated: 2026-07-01\ntags: [a]\nupdated: 2026-07-28\n---\nbody\n";

  assert.deepEqual(findDuplicateKey(raw), { key: "updated", first: 3, second: 5 });
});

test("a note with no front-matter has no front-matter key, horizontal rules included", () => {
  // Read directly: a note whose YAML never parses in the first place cannot reach the
  // catch, so this contract is only observable here. A hand-written note may well open
  // on `key: value` prose (attendees, here) and carry a Markdown rule further down;
  // scanning it as front-matter would report a "duplicated key" the owner cannot find,
  // in a note that has no front-matter at all.
  const raw = "# Meeting\nAttendee: Alice\nAttendee: Bob\n\n---\n\nnotes\n";

  assert.equal(findDuplicateKey(raw), null);
});

// --- passthrough ------------------------------------------------------------

test("returns the body content with the frontmatter stripped", () => {
  const parsed = parseDocument("---\ntitle: T\n---\nhello world\n", "topics/x.md");
  assert.equal(parsed.content.trim(), "hello world");
  assert.equal(parsed.frontmatter.title, "T");
});
