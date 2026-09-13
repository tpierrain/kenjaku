import { test } from "node:test";
import assert from "node:assert/strict";
import { planBatch, batchMessage } from "./batched-announcement.mjs";
import { directiveTraces, jargonTraces } from "./owner-facing.mjs";

// ─────────────────────────────────────────────────────────────────────────────
// The 🟡 tier, built once (ADR 0043 §4: "the whole cure").
//
// Five prompts answered one by one is five interruptions; the same five announced
// in one message is one. The owner's move is a VETO — silence proceeds — and that
// asymmetry is the whole point: an announcement that waits for a yes is just a
// confirmation dialog wearing a new name.
//
// It lives in the engine rather than in each skill because five inventions of one
// rule is exactly the drift the ADR warns about. The core composes the sentence,
// the skill relays it.
// ─────────────────────────────────────────────────────────────────────────────

const REPAIR = { what: "put 2 links back on the note they meant", count: 2, committed: true };
const STAMP = { what: "fill in the date on 3 notes that lost it", count: 3, committed: true };

// ── planBatch: who may ride the batch, and who must still be asked ────────────

test("a gesture whose write is committed may ride the batch", () => {
  assert.deepEqual(planBatch([REPAIR]), { announce: [REPAIR], ask: [] });
});

// 🛑 THE NET IS WHAT BUYS THE TIER (ADR 0043 §3). A 🟡 is acceptable because it is one
// `git revert` away, in the owner's own history. A write that escapes auto-commit has
// no such net, so announcing it and proceeding would be autonomy bought on credit.
test("a gesture whose write would NOT be committed never rides the batch", () => {
  const uncommitted = { what: "rewrite something nothing records", count: 1, committed: false };

  assert.deepEqual(planBatch([REPAIR, uncommitted]), {
    announce: [REPAIR],
    ask: [uncommitted],
  });
});

test("planBatch keeps the order it was given, so the message reads the way the skill meant it", () => {
  assert.deepEqual(planBatch([STAMP, REPAIR]).announce, [STAMP, REPAIR]);
});

test("nothing to do produces two empty lists, never a null anyone has to guard", () => {
  assert.deepEqual(planBatch([]), { announce: [], ask: [] });
  assert.deepEqual(planBatch(), { announce: [], ask: [] });
});

// ── batchMessage: the one sentence that replaces the cascade ──────────────────

test("nothing to announce says nothing at all", () => {
  assert.equal(batchMessage([]), null);
  assert.equal(batchMessage(), null);
});

test("the message leads with the COUNT, then the list — the trigger before the detail", () => {
  const message = batchMessage([REPAIR, STAMP]);

  // The count is the first thing on the line, because it is what decides whether the
  // owner reads any further. His own words, July: the trigger up front, the detail after.
  assert.match(message, /^I'm about to do 2 things/);
  assert.ok(
    message.indexOf("2 things") < message.indexOf(REPAIR.what),
    "the count must come before the first item",
  );
});

test("every gesture is named, and none is folded away", () => {
  const message = batchMessage([REPAIR, STAMP]);

  assert.ok(message.includes(REPAIR.what), "the first gesture");
  assert.ok(message.includes(STAMP.what), "the second gesture");
});

test("one thing to do is announced as one thing, not as '1 things'", () => {
  assert.match(batchMessage([REPAIR]), /^I'm about to do 1 thing[^s]/);
});

// 🛑 THE ASYMMETRY, ASSERTED IN BOTH DIRECTIONS. This is the single line that makes
// the tier a 🟡 rather than a 🔴, so it is pinned word for word: the message must say
// that silence proceeds, and must never ask for a go-ahead.
test("the message says that silence proceeds — it is a veto, not a request", () => {
  const message = batchMessage([REPAIR]);

  assert.match(message, /Say stop if you'd rather I didn't — otherwise I'll go ahead\.$/);
});

test("the message never asks for permission", () => {
  const message = batchMessage([REPAIR, STAMP]);

  assert.doesNotMatch(message, /\?/, "a question mark here turns the veto back into a prompt");
  assert.doesNotMatch(message, /shall I|may I|would you like|do you want|is that ok/i);
});

test("the message is written for the owner, in the owner's words", () => {
  const message = batchMessage([REPAIR, STAMP]);

  assert.deepEqual(directiveTraces(message), []);
  assert.deepEqual(jargonTraces(message), []);
});

test("the whole message, word for word, so no part of it can be emptied unnoticed", () => {
  assert.equal(
    batchMessage([REPAIR, STAMP]),
    "I'm about to do 2 things: put 2 links back on the note they meant; " +
      "fill in the date on 3 notes that lost it. " +
      "Say stop if you'd rather I didn't — otherwise I'll go ahead.",
  );
});
