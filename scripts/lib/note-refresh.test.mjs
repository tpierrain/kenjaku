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

test("with NO section, the date is bumped and the body is left exactly as it was", () => {
  // Reachable from production: `refresh-note.mjs` passes `spec.section` straight
  // through, and `{"path":"topics/x.md"}` is a valid spec — "mark this page as
  // still current" with nothing to add. It must not append a blank section, and
  // must not read `.replace` off an absent one.
  const out = refreshNote({ content: PAGE, today: "2026-07-28" });

  assert.equal(
    out,
    "---\ntype: topic\ncreated: 2026-06-02\nupdated: 2026-07-28\ntags: [crise, kandor]\n---\n\n" +
      "# Crise Kandor\n\nSome earlier body.\n",
  );
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
    {
      message:
        "this page's frontmatter declares duplicate key(s): updated. That is invalid " +
        "YAML, so the engine cannot read the page — fix it before refreshing.",
    },
  );
});

test("EVERY duplicated key is named, separated, and in order of first appearance", () => {
  // Two, not one: a message that names only the first key sends the owner back for
  // a second round on a page they were told they had fixed. And the separator is
  // load-bearing — `tagsupdated` names no key that exists.
  const damaged = `---
type: topic
tags: [a]
created: 2026-06-02
tags: [b]
updated: 2026-07-19
updated: 2026-07-20
---

# T
`;
  assert.deepEqual(duplicateFrontmatterKeys(damaged), ["tags", "updated"]);
  assert.throws(
    () => refreshNote({ content: damaged, today: "2026-07-28", section: "## s\n" }),
    {
      message:
        "this page's frontmatter declares duplicate key(s): tags, updated. That is invalid " +
        "YAML, so the engine cannot read the page — fix it before refreshing.",
    },
  );
});

test("a healthy page has no duplicate keys, and a bodyless one does not crash the check", () => {
  assert.deepEqual(duplicateFrontmatterKeys(PAGE), []);
  assert.deepEqual(duplicateFrontmatterKeys("no frontmatter at all\n"), []);
});

test("only a line's FIRST column declares a key — a nested one is not a duplicate", () => {
  // The exact defect this check's own comment warns about: rag's looser twin invented
  // a key (`- https`) out of a list of URLs. Unanchored, the two `- name:` entries
  // below read as one key declared twice, and a perfectly valid page would be REFUSED
  // as damaged — the worst outcome available, since the owner has nothing to fix.
  const nested = `---
type: topic
authors:
  - name: alice
  - name: bob
updated: 2026-07-19
---

# T
`;
  assert.deepEqual(duplicateFrontmatterKeys(nested), []);
  assert.doesNotThrow(() => refreshNote({ content: nested, today: "2026-07-28", section: "## s\n" }));
});

test("a frontmatter line that declares nothing is skipped, not crashed on", () => {
  // A blank separator line and a `#` comment are both legal YAML and both appear in
  // hand-written notes. Neither matches the key pattern, so the loop must move on
  // rather than reach into a null match.
  const spaced = "---\ntype: topic\n\n# a comment\nupdated: 2026-07-19\n---\n\n# T\n";
  assert.deepEqual(duplicateFrontmatterKeys(spaced), []);
  const out = refreshNote({ content: spaced, today: "2026-07-28", section: "## s\n" });
  assert.equal(out, "---\ntype: topic\n\n# a comment\nupdated: 2026-07-28\n---\n\n# T\n\n## s\n");
});

test("frontmatter must be the FIRST thing in the file — a leading blank line is not frontmatter", () => {
  // Neither YAML nor Obsidian reads a block that does not open the file. Matching it
  // anyway would silently drop whatever came before it on the way back out.
  assert.throws(
    () => refreshNote({ content: "\n---\ntype: topic\n---\n\nbody\n", today: "2026-07-28", section: "## s\n" }),
    {
      message:
        "this page has no frontmatter — refreshing expects a living vault page, not a loose file",
    },
  );
});

test("a stub with no body and no trailing newline is still a living page", () => {
  // `---\ntype: topic\n---` with nothing after it: what a hand-created placeholder
  // looks like, and what an editor that does not add a final newline leaves behind.
  const stub = "---\ntype: topic\nupdated: 2026-07-19\n---";
  const out = refreshNote({ content: stub, today: "2026-07-28", section: "## s\n" });
  assert.equal(out, "---\ntype: topic\nupdated: 2026-07-28\n---\n\n## s\n");
});

test("a section arriving with trailing blank lines is normalised to exactly one newline", () => {
  // Callers assemble sections by concatenation, so trailing blank lines are routine.
  // Left in, they accumulate at the bottom of a page that is refreshed every week.
  const out = refreshNote({ content: PAGE, today: "2026-07-28", section: "## s\n\n\n" });
  assert.equal(
    out,
    "---\ntype: topic\ncreated: 2026-06-02\nupdated: 2026-07-28\ntags: [crise, kandor]\n---\n\n" +
      "# Crise Kandor\n\nSome earlier body.\n\n## s\n",
  );
});

test("a `---` rule INSIDE the body does not swallow the body into the frontmatter", () => {
  // A horizontal rule is ordinary Markdown, and consolidation writes them. A
  // frontmatter match that runs to the LAST `---` instead of the first would treat
  // half the page as keys: the duplicate-key check would then fire on prose, and
  // the rewrite would move the body above the closing fence.
  const page = "---\ntype: topic\nupdated: 2026-07-19\n---\n\n# T\n\nfirst\n\n---\n\nsecond\n";
  const out = refreshNote({ content: page, today: "2026-07-28", section: "## s\n" });

  assert.equal(
    out,
    "---\ntype: topic\nupdated: 2026-07-28\n---\n\n# T\n\nfirst\n\n---\n\nsecond\n\n## s\n",
  );
});

test("a note written with WINDOWS line endings is refreshed, not refused", () => {
  // The fleet runs on Windows too (CI matrix, CONVENTIONS §9), and Obsidian there
  // writes CRLF. A frontmatter pattern that only knows `\n` sees no frontmatter at
  // all and throws "this page has no frontmatter" at a page that plainly has one.
  const page = "---\r\ntype: topic\r\nupdated: 2026-07-19\r\n---\r\n\r\n# T\r\n\r\nbody\r\n";
  const out = refreshNote({ content: page, today: "2026-07-28", section: "## s\n" });

  assert.match(out, /^---\r\ntype: topic\nupdated: 2026-07-28\r\n---\r\n/);
  assert.match(out, /body\n\n## s\n$/);
  assert.equal(out.match(/^updated:/gm)?.length, 1, "still exactly one `updated:` key");
});

test("a key merely ENDING in `updated:` is not mistaken for it", () => {
  // The finder is anchored for a reason: `last_updated:` sorts before `updated:`
  // in this page, so an unanchored search would find the wrong line FIRST and
  // overwrite someone else's key — destroying data while reporting success.
  const page = "---\ntype: topic\nlast_updated: 2026-01-01\nupdated: 2026-07-19\n---\n\nbody\n";
  const out = refreshNote({ content: page, today: "2026-07-28", section: "## s\n" });

  assert.equal(
    out,
    "---\ntype: topic\nlast_updated: 2026-01-01\nupdated: 2026-07-28\n---\n\nbody\n\n## s\n",
  );
});

test("refreshing WITHOUT a date is refused — an `updated:` we cannot fill is worse than none", () => {
  // The caller owns the clock (this module is I/O-free, ADR 0009 rung 1), so a
  // missing `today` is a wiring defect, not a value to paper over: writing
  // `updated: undefined` would hand the indexer invalid YAML — the very damage
  // this module exists to prevent.
  for (const missing of [undefined, "", null]) {
    assert.throws(
      () => refreshNote({ content: PAGE, today: missing, section: "## s\n" }),
      { message: "today (YYYY-MM-DD) is required to bump `updated:`" },
    );
  }
});

test("a note with no frontmatter is refused rather than silently given one", () => {
  // Refreshing implies a living page the vault already owns. A file with no
  // frontmatter is not that, and inventing one would guess its type and its
  // creation date.
  // Asserted WHOLE: `/frontmatter/i` also matches "Cannot read properties of null
  // (reading 'frontmatter')", so the loose matcher stayed green on a version that
  // deleted the refusal and let a TypeError escape in its place.
  assert.throws(
    () => refreshNote({ content: "# Loose\n\ntext\n", today: "2026-07-28", section: "## s\n" }),
    {
      message:
        "this page has no frontmatter — refreshing expects a living vault page, not a loose file",
    },
  );
});

// ── Promoting a confidence marker, when the re-verification actually happens ──
// The identity discipline's rule 6 says a 🟡 or 🔴 card is a lead, re-verified
// before anything is resolved against it. A marker with no supported way to
// change is a marker that says 🟡 forever — and one readers learn to ignore,
// which is the block rotting back into the decoration it exists to replace.
// Freehand is not an option here: editing a frontmatter key by hand is exactly
// what put two `updated:` keys on one page and made it unreadable (F12).

const CARD = `---
type: person
created: 2026-06-02
updated: 2026-07-19
tags: [candor]
confidence: probable
---

# Jérémy Hinard

> **Confidence** — 🟡 derived or probable · the surname comes from the Candor org note.

Front-end at Candor.
`;

test("promoting confidence rewrites the FIELD and the visible block together", () => {
  // Rewriting one and not the other leaves the page asserting two different
  // things about itself — this plan's own defect shape, inside the fix for it.
  const out = refreshNote({
    content: CARD,
    today: "2026-08-03",
    confidence: { level: "observed", basis: "he introduced himself in #candor, 2026-08-03." },
  });
  assert.equal(
    out,
    `---
type: person
created: 2026-06-02
updated: 2026-08-03
tags: [candor]
confidence: observed
---

# Jérémy Hinard

> **Confidence** — ✅ observed · he introduced himself in #candor, 2026-08-03.

Front-end at Candor.
`,
  );
});

test("promoting a card that has NO confidence yet appends the field", () => {
  // Every card written before this shipped is in exactly this shape, so this is
  // the ordinary promotion, not an edge case: without the append, a re-verified
  // pre-v4.6.0 card could never record that it was confirmed.
  const card = `---
type: person
created: 2026-06-02
updated: 2026-07-19
tags: [candor]
---

# Jérémy Hinard

Front-end at Candor.
`;
  const out = refreshNote({
    content: card,
    today: "2026-08-03",
    confidence: { level: "probable", basis: "the Candor org note, 2026-06." },
  });
  assert.equal(
    out,
    `---
type: person
created: 2026-06-02
updated: 2026-08-03
tags: [candor]
confidence: probable
---

# Jérémy Hinard

Front-end at Candor.
`,
  );
});

test("a frontmatter VALUE mentioning confidence: is not mistaken for the field", () => {
  // Same shape as the `updated:`-suffix test above, and the same damage: the
  // rewrite would land on someone else's line and destroy it (F12 was one
  // hand-edited frontmatter key away from unreadable).
  const card = `---
type: person
created: 2026-06-02
updated: 2026-07-19
tags: [candor]
note: "ask him to raise confidence: unclear so far"
confidence: probable
---

# Jérémy Hinard

Front-end at Candor.
`;
  const out = refreshNote({
    content: card,
    today: "2026-08-03",
    confidence: { level: "observed", basis: "he introduced himself in #candor." },
  });
  assert.match(out, /\nnote: "ask him to raise confidence: unclear so far"\n/);
  assert.match(out, /\nconfidence: observed\n/);
});

test("an INDENTED mention of the block does not absorb the promotion, even first", () => {
  // These pages are edited by hand in Obsidian, so the card's own block is not
  // guaranteed to be the first thing that looks like one. The block is the one
  // at the START of a line: promoting an indented quotation instead would leave
  // the real block stale, and the page would then say two different things
  // about its own reliability — which is what the block exists to end.
  const card = `---
type: person
created: 2026-06-02
updated: 2026-07-19
tags: [candor]
confidence: probable
---

# Jérémy Hinard

Noted from his manager's card, which still reads
    > **Confidence** — 🔴 unverified · nothing but a first name, which is why we asked.

> **Confidence** — 🟡 derived or probable · the surname comes from the Candor org note.

Front-end at Candor.
`;
  const out = refreshNote({
    content: card,
    today: "2026-08-03",
    confidence: { level: "observed", basis: "he introduced himself in #candor." },
  });
  assert.match(
    out,
    /^> \*\*Confidence\*\* — ✅ observed · he introduced himself in #candor\.$/m,
    "the card's own block is promoted",
  );
  assert.match(
    out,
    /^ {4}> \*\*Confidence\*\* — 🔴 unverified · nothing but a first name, which is why we asked\.$/m,
    "and the quoted one is left exactly as it was",
  );
});
