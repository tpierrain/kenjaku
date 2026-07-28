import { test } from "node:test";
import assert from "node:assert/strict";
import { duplicateFrontmatterKeys, refreshNote } from "./note-refresh.mjs";

const PAGE = `---
type: topic
created: 2026-06-02
updated: 2026-07-19
tags: [crise, kandor]
---

# Crise Kandor

Some earlier body.
`;

test("bumping `updated:` REPLACES the key — it never adds a second one", () => {
  // F12, verified on disk: consolidation appended a second `updated:` to
  // vault/inqom/topics/crise-kandor-clemence.md. Two keys three lines apart is
  // invalid YAML, so every re-read failed, so the note stayed searchable and
  // confidently out of date — with its newest section absent from the index.
  const out = refreshNote({ content: PAGE, today: "2026-07-28", section: "## 2026-07-28 — x\n\nnew\n" });

  const frontmatter = out.split("---")[1];
  assert.equal(frontmatter.match(/^updated:/gm)?.length, 1, "exactly one `updated:` key");
  assert.match(frontmatter, /updated: 2026-07-28/);
  assert.doesNotMatch(frontmatter, /2026-07-19/, "the old date is replaced, not kept alongside");
});

test("the rest of the frontmatter is untouched, in its original order", () => {
  const out = refreshNote({ content: PAGE, today: "2026-07-28", section: "## s\n" });
  assert.match(out, /---\ntype: topic\ncreated: 2026-06-02\nupdated: 2026-07-28\ntags: \[crise, kandor\]\n---/);
});

test("a page with NO `updated:` key gains one instead of being left stale", () => {
  const page = "---\ntype: topic\ncreated: 2026-06-02\n---\n\n# T\n\nbody\n";
  const out = refreshNote({ content: page, today: "2026-07-28", section: "## s\n" });
  assert.equal(out.split("---")[1].match(/^updated:/gm)?.length, 1);
});

test("the dated section is appended to the body, separated by a blank line", () => {
  const out = refreshNote({
    content: PAGE,
    today: "2026-07-28",
    section: "## 2026-07-28 — what the fresher captures add\n\nThe distilled update.\n",
  });
  assert.match(out, /Some earlier body\.\n\n## 2026-07-28 — what the fresher captures add\n\nThe distilled update\.\n$/);
});

test("a page ALREADY damaged is named, not appended to", () => {
  // The exact shape that occurred: two `updated:` keys, three lines apart (5 and 7).
  // Appending to it would keep it unreadable and hide the damage one refresh longer.
  const damaged = `---
type: topic
created: 2026-06-02
updated: 2026-07-19
tags: [crise]
displayName: Crise
updated: 2026-07-19
---

# Crise
`;
  assert.deepEqual(duplicateFrontmatterKeys(damaged), ["updated"]);
  assert.throws(
    () => refreshNote({ content: damaged, today: "2026-07-28", section: "## s\n" }),
    /duplicate.*updated/i,
  );
});

test("a healthy page has no duplicate keys, and a bodyless one does not crash the check", () => {
  assert.deepEqual(duplicateFrontmatterKeys(PAGE), []);
  assert.deepEqual(duplicateFrontmatterKeys("no frontmatter at all\n"), []);
});

test("a note with no frontmatter is refused rather than silently given one", () => {
  // Refreshing implies a living page the vault already owns. A file with no
  // frontmatter is not that, and inventing one would guess its type and its
  // creation date.
  assert.throws(
    () => refreshNote({ content: "# Loose\n\ntext\n", today: "2026-07-28", section: "## s\n" }),
    /frontmatter/i,
  );
});
