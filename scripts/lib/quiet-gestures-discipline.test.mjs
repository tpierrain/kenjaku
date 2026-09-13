import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { docSection } from "./doc-section.mjs";
import { VETO_CLOSING } from "./batched-announcement.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// The three gestures that stopped asking — issue #118, the last third of the
// decision v5.4 took and deliberately did not apply.
//
// v5.4 sorted all 62 gestures the brain makes at a person into ADR 0043's three
// tiers. Three of them could not be re-tiered by design alone, because "it will
// now do this without asking me" is a product call: they were put to the owner
// as one list and answered YES on 2026-09-13
// (`maintainers/registers/gestures.md` § The 🟢 list). This guard holds the three
// answers where the brain actually reads them.
//
//   1. `/lint` — a note the engine can no longer read has its header put back at
//      the left margin. 🟢: it acts, and it is NAMED in the batched summary.
//   2. `/switch` — renaming a universe re-encodes its notes. 🟡: announced, then
//      it runs unless stopped.
//   3. `/rag` — the search index is rebuilt when the note-watching was not
//      running. 🟡, same shape.
//
// 📐 Item 2's label in the specification says "created or deleted", and both
// halves of that are wrong: creating a universe re-indexes nothing (it is empty),
// and deleting one re-indexes inside a destructive script the owner runs
// themselves after retyping the name. RENAMING is the gesture the register's own
// row describes — "confirm a full re-index, minutes of compute, no data at risk".
// The reasoning is in the v5.5 plan, § What S2.2 turned out to be.
//
// ⚠️ WHAT THIS GUARD CANNOT DO, said out loud so nobody trusts it for it. Like
// every doc guard here it asserts a rule is PRESENT and a retired one is GONE —
// never that a sentence is well written, and never that the model obeyed it.
// In particular it does not assert "no question mark": these sections carry
// headings that are themselves questions ("Where is my index at?"), so the
// question-in-disguise half is caught by the PHRASES below instead, which are
// the ones actually measured in the prose that asked.
// ═══════════════════════════════════════════════════════════════════════════

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (rel) => readFileSync(join(REPO_ROOT, rel), "utf8");

const LINT = "engine-skills/lint/SKILL.md";
const RAG = "engine-skills/rag/SKILL.md";
const SWITCH = ".claude/skills/switch/SKILL.md";

// 🛑 ANCHORED ON THE TIER EMOJI AND THE STEP NUMBER, NEVER ON A TITLE. The sibling
// guard in `identity-discipline.test.mjs` once located its section by a heading's
// words, the release retitled it, and the guard read an EMPTY section and judged
// nothing while staying green. The emoji IS the tier and a step number is the
// stable half of a procedure; the wording is what a release moves.
const ACTS = /^#+ 🟢/m;
const ANNOUNCES = /^#+ 🟡/m;
const ASKS = /^#+ 🔴/m;

// The tells of a confirmation, kept as the literal shapes these three sections
// actually used before they went quiet. An announcement that waits for a yes is a
// confirmation dialog wearing a new name (ADR 0043 §4).
//
// 🛑 THESE ARE THE DIRECTIVES THAT MAKE THE BRAIN WAIT — never the words of the
// runtime sentence itself ("shall I", "may I", "would you like"). Those were in the
// first version of this list and it was wrong: a skill's clearest way to forbid a
// phrase is to QUOTE it, so the guard went red on the very sentence that bans it.
// The runtime wording is pinned where the sentence actually exists — over
// `batchMessage`'s output, in `batched-announcement.test.mjs`, in both directions.
const WAITS_FOR_AN_ANSWER =
  /ask (them|the owner) to confirm|only after (they|the owner) confirm|once they have said yes|if they agree|on their go-?ahead/i;

const section = (rel, heading) => {
  const cut = docSection(read(rel), heading);
  assert.notEqual(cut, "", `the section is gone from ${rel} — check the anchor, not the wording`);
  return cut;
};

// Markdown prose wraps at the column, so the veto sentence can land across two
// lines. A guard a line break can silence is not a guard.
const flat = (text) => text.replace(/\s+/g, " ");

// ── 1. `/lint` — the note the engine cannot read ───────────────────────────
// The one finding in the whole report that costs the owner ANSWERS rather than
// tidiness: until the header is straightened the note is never re-read, so it
// keeps answering searches with what it said weeks ago. One was measured standing
// three weeks. The repair is mechanical — the keys are indented by a space or two.

test("lint: the note the engine cannot read is repaired, not asked about", () => {
  const acts = section(LINT, ACTS);

  assert.match(acts, /cannot read/i, "the finding must be in the acting tier now");
  assert.match(acts, /left margin/i, "and the repair itself must be the one described");
});

test("lint: the repair is named in the batch — an invisible repair is not the same gesture", () => {
  const acts = section(LINT, ACTS);

  // 🟢 does not mean unseen here. The owner accepted "it acts AND it is named in
  // the batched tidy-up summary" — the same shape ADR 0043's table gives the date
  // stamp: silent as to permission, visible as to fact.
  assert.match(acts, /batch|summary/i, "the acting tier must say this one rides the batch");
});

test("lint: what the owner is losing while it stands is still said, in their terms", () => {
  const acts = section(LINT, ACTS);

  // If the stake goes, the gesture reads as tidiness and the next audit will
  // quietly put it back behind a question.
  assert.match(acts, /answer/i, "the note keeps ANSWERING from stale content — that is the cost");
});

test("lint: and it has left the tier that stops to ask", () => {
  const asks = section(LINT, ASKS);

  assert.doesNotMatch(asks, /cannot read/i, "it must not be asked about in two places at once");
  assert.doesNotMatch(asks, /left margin/i, "the repair may not still be offered as a question");
  // The v5.4 marker that said this was still open. A skill that acts while a note
  // beside it says "it stays 🔴 until the owner says otherwise" carries both answers.
  assert.doesNotMatch(asks, /open question of v5\.4|until the owner says otherwise/i);
});

test("lint: the asking tier is still there, and still holds what genuinely needs a human", () => {
  const asks = section(LINT, ASKS);

  // The goal was never fewer questions. A page invented for a person becomes the
  // vault's own answer to who exists, and that is not reversible in effect.
  assert.match(asks, /people/i, "the fabricated-person rule must survive this release");
});

test("lint: the write is covered by the net that buys the tier", () => {
  const text = read(LINT);

  // ADR 0043 §3: a gesture that escapes auto-commit may not go quiet. This one
  // edits the owner's own note, so the net has to be named in the skill.
  assert.match(text, /auto-commit/i, "the repair is one `git revert` away, or it may not be silent");
});

// ── 2. `/switch` — renaming re-encodes the universe ────────────────────────
// Reversible (rename back), certain, and what it costs is a wait. The owner was
// being made to authorise minutes of compute that risk no note.

const RENAME = /^#+ Rename a universe/m;
const DELETE = /^#+ Delete a universe/m;

test("switch: renaming says what it costs and then starts", () => {
  const rename = section(SWITCH, RENAME);

  assert.ok(
    flat(rename).includes(VETO_CLOSING),
    "the announcement must close on the core's own veto line, not on a local paraphrase",
  );
  assert.match(rename, /minutes/i, "someone not told about the wait thinks their brain hung");
});

test("switch: renaming no longer waits for a yes", () => {
  const rename = section(SWITCH, RENAME);

  assert.doesNotMatch(rename, WAITS_FOR_AN_ANSWER, "this is a veto now, not a confirmation");
});

test("switch: deleting did NOT go quiet along with renaming", () => {
  const del = section(SWITCH, DELETE);

  // 🛑 The boundary ADR 0045 freezes: a DESTRUCTIVE gesture keeps its typed
  // confirmation, and nothing in this release makes deletion easier to reach.
  assert.match(del, /retype the name/i, "the typed confirmation is the gate");
  assert.ok(
    !flat(del).includes(VETO_CLOSING),
    "erasing notes may never be announced-then-done — the veto sentence has no business here",
  );
});

// ── 3. `/rag` — the index that stopped following the notes ─────────────────
// Same shape as the rename: compute, no note at risk. And the cost of leaving it
// is the same as `/lint`'s unreadable note — searches answer from an index that
// stopped keeping up.

// 🔍 Cut to the BULLET, not the step. Step 1 legitimately holds a neighbouring
// gesture that IS an offer — a stale index, where the engine itself composes the
// offer and the skill's whole job is to relay it rather than pre-empt it. A guard
// spanning the whole step would have to forbid the word "offer" there too, and
// would be forbidding the right behaviour. So each bullet is judged on its own.
const bullet = (text, opening) => {
  const cut = flat(text).match(new RegExp(`${opening}.*?(?=- \\*\\*|$)`))?.[0] ?? "";
  assert.notEqual(cut, "", `the bullet is gone — check the anchor, not the wording`);
  return cut;
};

const WATCHER = "- \\*\\*The watcher running\\*\\*";

test("rag: an index that stopped following the notes is rebuilt, announced", () => {
  const watcher = bullet(section(RAG, /^#+ 1\. /m), WATCHER);

  // Tolerant of the emphasis around the word: the prose says "**not** running" in
  // places, and a guard that a pair of asterisks can silence is not a guard.
  assert.match(watcher, /not\W{0,4}running/i, "the condition that triggers it must still be named");
  assert.ok(
    watcher.includes(VETO_CLOSING),
    "the announcement must close on the core's own veto line, not on a local paraphrase",
  );
});

test("rag: it no longer offers, it goes", () => {
  const watcher = bullet(section(RAG, /^#+ 1\. /m), WATCHER);

  assert.doesNotMatch(watcher, WAITS_FOR_AN_ANSWER, "this is a veto now, not a confirmation");
  assert.doesNotMatch(watcher, /offer/i, "an offer is a question with better manners");
});

test("rag: the offer that is NOT this skill's to make is still relayed, not pre-empted", () => {
  // The neighbour above: when the engine gates search behind a re-index of its own,
  // the offer is the engine's and the skill relays it. Re-tiering the watcher gesture
  // may not quietly swallow that one — they look alike and they are not the same.
  const stale = bullet(section(RAG, /^#+ 1\. /m), "- \\*\\*A stale index\\*\\*");

  assert.match(stale, /relay the offer/i);
  assert.match(stale, /do not pre-empt it/i);
});

test("rag: a FULL rebuild is still something the owner asks for", () => {
  const reindex = section(RAG, /^#+ 3\. /m);

  // The quiet one is the incremental catch-up. A forced re-embed of every note
  // spends real time and, on an API embedder, real quota — a different gesture.
  assert.match(reindex, /only when the owner asks for one/i);
});

test("rag: nothing it does quietly touches a note", () => {
  const text = read(RAG);

  // This gesture needs no auto-commit net for the reason that it writes nothing of
  // the owner's: it rebuilds an index. That claim is what makes it safe, so it is
  // the claim the guard holds.
  assert.match(text, /never edits, moves or deletes a note/i);
});

// ── The property all three share, stated once ──────────────────────────────
// ADR 0043 §4: the owner's move is a VETO, and that asymmetry is the tier. Held
// against the core's own sentence rather than a retyped copy, so a skill and the
// engine can never say two different things about what silence means.

test("every announcement says the same thing, and it is the engine's sentence", () => {
  // `/lint`'s batch is in here as the THIRD carrier although this release did not
  // touch it: it is where the sentence was first retyped by hand, and it is what
  // the other two were written against. If the core's wording ever moves, all three
  // go red together — which is the only way a shared sentence stays one sentence.
  const carriers = [
    section(LINT, ANNOUNCES),
    section(SWITCH, RENAME),
    section(RAG, /^#+ 1\. /m),
  ];

  for (const carrier of carriers) {
    assert.ok(flat(carrier).includes(VETO_CLOSING), "one spelling of the veto, or there are two tiers");
  }
});
