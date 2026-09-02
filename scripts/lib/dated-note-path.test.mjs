// ─────────────────────────────────────────────────────────────────────────────
// dated-note-path.test.mjs — where today's dated note goes when a brain has more
// than one author (plan step 4).
//
// The defect this removes: two people sharing a brain both write
// `briefings/2026-09-02.md`, and the union merge — right for a ledger, wrong for a
// synthesis — concatenates two whole documents into one file, silently. That is
// the shape a first duo meets in its first week, and it is a PATH problem: a
// different path cannot collide, and needs no LLM discipline whatsoever.
//
// 🛑 The rule is deliberately asymmetric, and the asymmetry is the design (the
// owner's call, § Design calls): the base name belongs to whoever writes first, and
// only a DIFFERENT author gets a suffix. So a solo owner — even one with two Macs
// and a remote — never sees a suffix at all. Every degradation below falls back to
// the base name, i.e. to exactly today's behaviour, which is a union merge: a
// visible concatenation rather than an invented file nobody expects.
// ─────────────────────────────────────────────────────────────────────────────
import { test } from "node:test";
import assert from "node:assert/strict";

import { AUTHOR_FIELD, datedNotePath, noteAuthor, resolveDatedNotePath } from "./dated-note-path.mjs";

const DAY = "2026-09-02";

test("nobody has written today: the base name belongs to whoever writes first", () => {
  assert.deepEqual(datedNotePath({ folder: "daily", date: DAY, author: "Claire Dubois", base: null }), {
    path: "daily/2026-09-02.md",
    suffixed: false,
  });
});

test("the author who owns the base name keeps writing to it", () => {
  assert.deepEqual(
    datedNotePath({ folder: "daily", date: DAY, author: "Claire Dubois", base: { author: "Claire Dubois" } }),
    { path: "daily/2026-09-02.md", suffixed: false },
  );
});

// 🎯 THE CASE THE WHOLE STEP EXISTS FOR.
test("a DIFFERENT author writing the same day gets a file of their own", () => {
  assert.deepEqual(
    datedNotePath({ folder: "briefings", date: DAY, author: "Thomas Pierrain", base: { author: "Claire Dubois" } }),
    { path: "briefings/2026-09-02-thomas-pierrain.md", suffixed: true },
  );
});

test("one person spelled two ways is one person, so no suffix appears", () => {
  for (const spelling of ["claire dubois", "  Claire   Dubois ", "Claire Dubois"]) {
    assert.equal(
      datedNotePath({ folder: "daily", date: DAY, author: spelling, base: { author: "Claire Dubois" } }).suffixed,
      false,
      `${JSON.stringify(spelling)} is the same author as the one who owns the file`,
    );
  }
});

// 🛑 The two degradations, and both fall back to TODAY'S behaviour rather than to a
// name nobody can predict. A note that predates this rule names no author, and a git
// author name with no Latin letters has no slug: in both cases the honest answer is
// the shared file and a union merge, which is visible, and not an invented path.
test("a note that claims no author, and an author with no slug, both fall back to the shared file", () => {
  assert.deepEqual(datedNotePath({ folder: "daily", date: DAY, author: "Claire Dubois", base: { author: null } }), {
    path: "daily/2026-09-02.md",
    suffixed: false,
  });
  assert.deepEqual(datedNotePath({ folder: "daily", date: DAY, author: "日本語", base: { author: "Claire Dubois" } }), {
    path: "daily/2026-09-02.md",
    suffixed: false,
  });
});

test("a universe's notes live one folder deeper, and the rule follows them there", () => {
  assert.equal(
    datedNotePath({ folder: "acme/daily", date: DAY, author: "Thomas Pierrain", base: { author: "Claire Dubois" } })
      .path,
    "acme/daily/2026-09-02-thomas-pierrain.md",
  );
});

test("three authors on one day is three files, and only the first is unsuffixed", () => {
  const base = { author: "Claire Dubois" };
  const paths = [
    datedNotePath({ folder: "daily", date: DAY, author: "Claire Dubois", base }).path,
    datedNotePath({ folder: "daily", date: DAY, author: "Thomas Pierrain", base }).path,
    datedNotePath({ folder: "daily", date: DAY, author: "Amina Haddad", base }).path,
  ];

  assert.deepEqual(paths, [
    "daily/2026-09-02.md",
    "daily/2026-09-02-thomas-pierrain.md",
    "daily/2026-09-02-amina-haddad.md",
  ]);
  assert.equal(new Set(paths).size, 3, "a different path cannot collide — that is the whole mechanism");
});

// ── The field a dated note stamps, so the rule has something to read next time ──

test("the author field has ONE name, and it is read off the frontmatter", () => {
  assert.equal(AUTHOR_FIELD, "author");
  assert.equal(noteAuthor({ author: "Claire Dubois" }), "Claire Dubois");
  assert.equal(noteAuthor({ author: "  Claire Dubois  " }), "Claire Dubois");
});

test("a note written before this rule claims no author, which is not the same as claiming nobody wrote it", () => {
  assert.equal(noteAuthor({}), null);
  assert.equal(noteAuthor({ author: "" }), null);
  assert.equal(noteAuthor(undefined), null);
});

// ── Resolving against what the vault actually holds ────────────────────────────

const NOTES = [
  { path: "daily/2026-09-01.md", frontmatter: { author: "Thomas Pierrain" } },
  { path: "briefings/2026-09-02.md", frontmatter: { author: "Claire Dubois" } },
  { path: "daily/2026-09-02.md", frontmatter: {} },
];

test("resolveDatedNotePath finds the day's base note among the vault's notes and applies the rule", () => {
  assert.equal(
    resolveDatedNotePath({ notes: NOTES, folder: "briefings", date: DAY, author: "Thomas Pierrain" }).path,
    "briefings/2026-09-02-thomas-pierrain.md",
  );
  assert.equal(
    resolveDatedNotePath({ notes: NOTES, folder: "briefings", date: DAY, author: "Claire Dubois" }).path,
    "briefings/2026-09-02.md",
  );
});

test("resolveDatedNotePath — a day nobody has written, and a day whose note names no author", () => {
  assert.equal(
    resolveDatedNotePath({ notes: NOTES, folder: "daily", date: "2026-09-03", author: "Thomas Pierrain" }).path,
    "daily/2026-09-03.md",
  );
  assert.equal(
    resolveDatedNotePath({ notes: NOTES, folder: "daily", date: DAY, author: "Thomas Pierrain" }).path,
    "daily/2026-09-02.md",
    "an unauthored note predates the rule, so it degrades to today's behaviour",
  );
});

// A folder is matched WHOLE. Without this, `daily` would find `acme/daily/…`, and a
// universe's note would decide where a root note goes.
test("resolveDatedNotePath does not mistake one folder for another that ends the same way", () => {
  const notes = [{ path: "acme/briefings/2026-09-02.md", frontmatter: { author: "Claire Dubois" } }];

  assert.equal(
    resolveDatedNotePath({ notes, folder: "briefings", date: DAY, author: "Thomas Pierrain" }).path,
    "briefings/2026-09-02.md",
    "the root folder has no note today; the universe's is a different folder",
  );
  assert.equal(
    resolveDatedNotePath({ notes, folder: "acme/briefings", date: DAY, author: "Thomas Pierrain" }).path,
    "acme/briefings/2026-09-02-thomas-pierrain.md",
  );
});
