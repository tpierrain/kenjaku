import { test } from "node:test";
import assert from "node:assert/strict";

import {
  BULLET_CAP,
  BULLET_CHAR_CEILING,
  briefBullets,
  briefShapeVerdict,
  firstScreenLines,
  isBriefShaped,
  readFirstScreen,
} from "./brief-shape.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// #128 S4 — the check that fails when a prep's FIRST SCREEN is not the brief.
//
// The rule is written for humans in the `brief-shape` skill; this suite pins the
// arithmetic it reduces to. What makes the arithmetic load-bearing rather than
// decorative: the shape without a check is exactly today's situation — a prep
// note written in the field on 2026-09-13 already had the right shape and it
// never reproduced, because nothing ever said no.
//
// 🛑 THE REFUSAL BLOCKS THE WRITE (the owner's call, Q1), so every pole here is
// written against that cost. A false refusal is not a lint warning somebody
// scrolls past: it is a note that does not exist, minutes before a meeting. That
// is why the out-of-scope poles are as numerous as the in-scope ones, why lazy
// continuation is honoured rather than refused, and why the boundary is asserted
// on BOTH sides every time (7 passes, 8 fails; 220 passes, 221 fails).
// ═══════════════════════════════════════════════════════════════════════════

const TITLE = "# Prep 1-1 — Alex — 2026-09-15";

/** A first screen of `n` distinct bullets, under both ceilings. */
const bullets = (n) => Array.from({ length: n }, (_, i) => `- Thing number ${i + 1} to say out loud.`);

/** A note: the title, the bullets, then a real ammunition section. */
const note = (lines) => [TITLE, "", ...lines, "", "## Ammunition — only if they dig, contest or ask", "", "- a quote"].join("\n");

const reasons = (verdict) => verdict.violations.map((v) => v.message).join(" · ");
const rules = (verdict) => verdict.violations.map((v) => v.rule);

// ── The scope: a PREFIX on `type:`, and nothing else (Q2) ──────────────────
// Over-cap content on purpose: out of scope must mean "not measured", not "measured
// and happened to pass". A single in-scope example would also pass with a selector
// that says yes to everything, which is why the negatives outnumber it here.

test("a note with no type: at all is out of scope, however long its first screen", () => {
  const verdict = briefShapeVerdict({ content: note(bullets(12)), type: undefined });
  assert.deepEqual(verdict, { ok: true, violations: [] });
});

test("the vault's other note types are out of scope", () => {
  for (const type of ["daily", "person", "topic", "decision", "meeting", "backlog"]) {
    assert.deepEqual(briefShapeVerdict({ content: note(bullets(12)), type }).violations, [], `${type} is not a prep`);
  }
});

test("`prep` and `preparation` are NOT prep-shaped — the prefix carries its dash", () => {
  // The dash is what makes the prefix a type family rather than a word match: drop
  // it and `preparation-guide` (a topic someone writes) starts being refused.
  assert.equal(isBriefShaped("prep"), false);
  assert.equal(isBriefShaped("preparation"), false);
  assert.equal(isBriefShaped("briefing"), false);
  assert.equal(isBriefShaped("unprep-1-1"), false, "the prefix anchors at the start, it is not a substring");
});

test("every prep- and briefing- type is in scope, including one invented later", () => {
  // Q2's whole point: the check covers a prep type the day it is first written, with
  // no edit here. The last one has never been produced by anything.
  for (const type of ["prep-1-1", "prep-meeting", "briefing-day", "prep-board-review-2027"]) {
    assert.equal(isBriefShaped(type), true, type);
    assert.equal(briefShapeVerdict({ content: note(bullets(12)), type }).ok, false, `${type} must be measured`);
  }
});

test("a type: that is not a string is out of scope rather than a crash", () => {
  // Frontmatter is free text: `type: 2026` parses as a number, `type: [a, b]` as an
  // array. This guard sits in front of every write the brain makes — it may not throw.
  for (const type of [42, null, ["prep-1-1"], { prefix: "prep-" }, true]) {
    assert.deepEqual(briefShapeVerdict({ content: note(bullets(12)), type }).violations, []);
  }
});

// ── The anchor: between the `#` title and the first `##` ───────────────────

test("the first screen stops at the first `##`, so ammunition is never counted", () => {
  const content = [TITLE, "", ...bullets(3), "", "## Ammunition", "", ...bullets(40)].join("\n");
  assert.deepEqual(briefBullets(firstScreenLines(content)).map((b) => b.text.slice(0, 5)), ["Thing", "Thing", "Thing"]);
  assert.deepEqual(briefShapeVerdict({ content, type: "prep-1-1" }), { ok: true, violations: [] });
});

test("the `#` title is not part of the first screen — it is the anchor, not content", () => {
  const lines = firstScreenLines([TITLE, "", "- one thing to say", "", "## Ammunition"].join("\n"));
  assert.deepEqual(
    lines.map((l) => l.text),
    ["", "- one thing to say", ""],
    "the title is dropped, everything between it and the first ## is kept verbatim",
  );
  assert.deepEqual(lines.map((l) => l.line), [2, 3, 4], "and each line knows where it is, so a message can point at it");
});

test("a `##` inside a fenced code block does not close the first screen", () => {
  // Otherwise everything after the fence is invisible to the cap: a prep that opens
  // on a fenced example would carry an unmeasured page underneath it.
  const content = [TITLE, "", "```markdown", "## not a heading", "```", "", ...bullets(9), "", "## Ammunition"].join("\n");
  assert.equal(briefShapeVerdict({ content, type: "prep-1-1" }).ok, false, "the nine bullets after the fence are still counted");
  assert.match(reasons(briefShapeVerdict({ content, type: "prep-1-1" })), /\b9\b/);
});

test("a note with no `##` at all is all first screen", () => {
  const content = [TITLE, "", ...bullets(8)].join("\n");
  assert.deepEqual(rules(briefShapeVerdict({ content, type: "prep-1-1" })), ["too-many-bullets"]);
});

// ── The cap: seven bullets, both sides of the boundary ─────────────────────

test("exactly seven bullets is correct — the cap is a maximum, not a warning line", () => {
  assert.equal(BULLET_CAP, 7);
  assert.deepEqual(briefShapeVerdict({ content: note(bullets(7)), type: "prep-1-1" }), { ok: true, violations: [] });
});

test("eight bullets is refused, and the message says how many and by how much", () => {
  const verdict = briefShapeVerdict({ content: note(bullets(8)), type: "prep-1-1" });
  assert.equal(verdict.ok, false);
  assert.deepEqual(rules(verdict), ["too-many-bullets"]);
  assert.match(reasons(verdict), /\b8\b/, "the count it found");
  assert.match(reasons(verdict), /\b7\b/, "and the cap it is judged against");
  assert.match(reasons(verdict), /\b1\b/, "and the overflow, so the fix is arithmetic rather than a guess");
});

test("the overflow is the real distance, not a fixed word", () => {
  // Triangulation on the subtraction: with `8 - 7` only, an implementation that
  // hard-codes "one over" is green for ever.
  assert.match(reasons(briefShapeVerdict({ content: note(bullets(12)), type: "prep-1-1" })), /\b5\b/);
});

// ── The ceiling: 220 characters per bullet, both sides ─────────────────────

const bulletOf = (chars) => `- ${"x".repeat(chars)}`;

test("a bullet of exactly 220 characters is correct", () => {
  assert.equal(BULLET_CHAR_CEILING, 220);
  const verdict = briefShapeVerdict({ content: note([bulletOf(220)]), type: "prep-1-1" });
  assert.deepEqual(verdict, { ok: true, violations: [] });
});

test("221 characters is refused, naming the bullet, its length and the overflow", () => {
  const verdict = briefShapeVerdict({ content: note([bullets(1)[0], bulletOf(221)]), type: "prep-1-1" });
  assert.deepEqual(rules(verdict), ["bullet-too-long"]);
  assert.match(reasons(verdict), /bullet 2\b/, "which bullet — counted as the reader sees them, from 1");
  assert.match(reasons(verdict), /\b221\b/);
  assert.match(reasons(verdict), /\b220\b/);
  assert.match(reasons(verdict), /\b1 character/, "by how much, singular at one");
});

test("the length is the bullet's TEXT, so its marker and its wrapping cannot hide anything", () => {
  // The defeat this closes: 300 characters spread over four wrapped lines, each of
  // them comfortably short. Markdown renders one bullet; the cap must see one bullet.
  const wrapped = ["- " + "a".repeat(100), "  " + "b".repeat(100), "  " + "c".repeat(100)].join("\n");
  const bulletsFound = briefBullets(firstScreenLines(note([wrapped])));
  assert.equal(bulletsFound.length, 1, "one bullet, not three");
  assert.equal(bulletsFound[0].text.length, 302, "its three pieces joined by the single space markdown renders");
  assert.deepEqual(rules(briefShapeVerdict({ content: note([wrapped]), type: "prep-1-1" })), ["bullet-too-long"]);
});

test("markdown's lazy continuation is a wrap, not a violation", () => {
  // An unindented continuation line is valid markdown and is what a model writing
  // prose produces. Refusing it would block a correct note over a habit.
  const lazy = ["- a thing to say that runs on", "to a second line without indentation"].join("\n");
  const found = briefBullets(firstScreenLines(note([lazy])));
  assert.deepEqual(found.map((b) => b.text), ["a thing to say that runs on to a second line without indentation"]);
  assert.deepEqual(briefShapeVerdict({ content: note([lazy]), type: "prep-1-1" }), { ok: true, violations: [] });
});

test("`*`, `+` and a numbered list are bullets too — the shape is a flat list, not one character", () => {
  const mixed = ["- dash", "* star", "+ plus", "1. numbered"];
  assert.deepEqual(briefBullets(firstScreenLines(note(mixed))).map((b) => b.text), ["dash", "star", "plus", "numbered"]);
});

// ── No floor, and the one thing a first screen must have ───────────────────

test("two bullets is a correct brief — the cap is an upper bound with nothing under it (Q3)", () => {
  // A check that failed a short brief would BE the padding pressure, wired in. The
  // thin brief says what the vault does not document; it never pads to reach a number.
  const thin = ["- The one thing the vault supports, said plainly.", "- 🔴 Not documented: anything about the reorg."];
  assert.deepEqual(briefShapeVerdict({ content: note(thin), type: "prep-1-1" }), { ok: true, violations: [] });
});

test("a first screen with NO bullet is refused — that is the defect this shape exists to end", () => {
  // The old output shape, exactly: a title, then straight into `## What I want to
  // raise`. Nothing to say on the first screen, and the ammunition triaged in the room.
  const content = [TITLE, "", "## What I want to raise (Top 3)", "", "1. a topic"].join("\n");
  const verdict = briefShapeVerdict({ content, type: "prep-1-1" });
  assert.deepEqual(rules(verdict), ["no-first-screen"]);
  assert.match(reasons(verdict), /##/, "and it says where the page starts, since that is the fix");
});

test("prose above the fold is refused, and the message quotes the line it means", () => {
  // "Nothing else above the fold": without this, seven bullets is honoured by seven
  // bullets under a page of context, which is the arrangement the whole issue is about.
  const content = note(["Some context nobody asked for, three lines of it.", "", ...bullets(2)]);
  const verdict = briefShapeVerdict({ content, type: "prep-1-1" });
  assert.deepEqual(rules(verdict), ["not-a-bullet"]);
  assert.match(reasons(verdict), /line 3\b/, "the line number in the note, frontmatter aside");
  assert.match(reasons(verdict), /Some context nobody asked for/, "quoted, so it can be found without counting");
});

test("a sub-heading above the fold is prose too — the first screen has no sections", () => {
  const content = note(["### Context", "", ...bullets(2)]);
  assert.deepEqual(rules(briefShapeVerdict({ content, type: "prep-1-1" })), ["not-a-bullet"]);
});

test("a blank line is not prose, and neither is a first screen that is entirely blank lines", () => {
  const content = [TITLE, "", "", "", "- one thing", "", "", "## Ammunition"].join("\n");
  assert.deepEqual(briefShapeVerdict({ content, type: "prep-1-1" }), { ok: true, violations: [] });
});

// ── Every violation, in one pass ───────────────────────────────────────────

test("a note that breaks three rules is told all three at once", () => {
  // Its reader is a model rewriting the note, not a human reading a report: a second
  // refusal for a rule the first one already knew about is the same wait, paid twice.
  const content = note(["A preamble.", "", ...bullets(7), bulletOf(240)]);
  const verdict = briefShapeVerdict({ content, type: "prep-1-1" });
  assert.deepEqual(rules(verdict), ["not-a-bullet", "too-many-bullets", "bullet-too-long"]);
  assert.equal(verdict.ok, false);
});

test("every violation carries both a rule name and a message, and the rule names are stable", () => {
  // The rule name is what a caller may branch on or count; the message is what the
  // model reads. A violation missing either half is useless to one of the two.
  const verdict = briefShapeVerdict({ content: note(["A preamble.", "", ...bullets(9), bulletOf(240)]), type: "prep-1-1" });
  assert.equal(verdict.violations.length, 3);
  for (const violation of verdict.violations) {
    assert.deepEqual(Object.keys(violation).sort(), ["message", "rule"]);
    assert.match(violation.rule, /^[a-z-]+$/);
    assert.ok(violation.message.length > 30, `a message that says nothing: ${violation.message}`);
  }
});

test("readFirstScreen — a line is a bullet, part of one, or a stray, and never two of those", () => {
  // The reason bullets and strays come out of ONE walk: asked separately they are two
  // spellings of "what is a bullet", and the day they disagree a line is both a
  // violation and something you will say — or is silently neither.
  const lines = firstScreenLines(
    note(["A preamble.", "", "- a bullet", "  that wraps", "", "### a sub-heading", "", "1. numbered"]),
  );
  const { bullets, strays } = readFirstScreen(lines);

  assert.deepEqual(bullets.map((b) => b.text), ["a bullet that wraps", "numbered"]);
  assert.deepEqual(strays, [
    { text: "A preamble.", line: 3 },
    { text: "### a sub-heading", line: 8 },
  ]);
  const accounted = bullets.length + strays.length;
  assert.equal(accounted, 4, "every non-blank line is accounted for exactly once, wraps aside");
});
