// ─────────────────────────────────────────────────────────────────────────────
// brain-author.test.mjs — who writes in this brain, and what the brain owes them
// for noticing (plan steps 4.2, 4.3, 4.3bis, 4.3ter).
//
// Duo mode is IMPLICIT (the owner's call): nothing to switch on, no profile to
// fill in, no list of people to maintain. The name comes from `git config --get
// user.name`, which git already writes into every commit this brain makes and
// which the live sync already speaks aloud ("1 note from Claire arrived").
//
// What implicitness owes in exchange is not a switch, it is a SENTENCE: a brain
// that quietly starts filing things differently is opaque. So the first time a
// second author is seen, it says so once, offers to describe who is who — an offer
// that activates nothing — and never mentions it again.
// ─────────────────────────────────────────────────────────────────────────────
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  authorsReminder,
  buildAuthorsHookOutput,
  distinctAuthors,
  GIT_AUTHOR_ARGS,
  GIT_AUTHORS_ARGS,
  localAuthorName,
  secondAuthorAnnouncement,
} from "./brain-author.mjs";

const ME = "Thomas Pierrain";
const HER = "Claire Dubois";

// ── The one notion of "who", shared with the live sync ────────────────────────

test("the local author is read the ONE way this brain reads it", () => {
  assert.deepEqual(GIT_AUTHOR_ARGS, ["config", "--get", "user.name"]);
  assert.deepEqual(GIT_AUTHORS_ARGS, ["log", "--format=%an"]);
});

test("localAuthorName trims what git hands back, and answers null when git has no name", () => {
  assert.equal(localAuthorName(() => ({ out: `${ME}\n`, ok: true })), ME);
  assert.equal(localAuthorName(() => ({ out: "", ok: false })), null);
  assert.equal(localAuthorName(() => ({ out: "   \n", ok: true })), null);
});

test("localAuthorName asks git exactly the shared question, and nothing else", () => {
  const asked = [];
  localAuthorName((args) => {
    asked.push(args);
    return { out: ME, ok: true };
  });

  assert.deepEqual(asked, [GIT_AUTHOR_ARGS]);
});

// ── Counting people, not spellings ────────────────────────────────────────────

test("one person spelled several ways is one author, and the first spelling is the one kept", () => {
  assert.deepEqual(distinctAuthors(["Claire Dubois", "claire dubois", "  Claire   Dubois  "]), [HER]);
});

// The kept spelling is TIDIED, not merely kept: a `user.name` really can carry a stray
// space at either end or a double space in the middle, and this name is about to be
// printed into a session-start line an owner reads before typing.
test("the kept spelling loses its stray whitespace, at the edges and in the middle", () => {
  assert.deepEqual(distinctAuthors(["  Claire   Dubois  "]), [HER]);
  assert.deepEqual(distinctAuthors(["\tAmina\t\tHaddad\n"]), ["Amina Haddad"]);
});

test("distinct authors keep the order they first appear in, so a list reads chronologically", () => {
  assert.deepEqual(distinctAuthors([HER, ME, HER, "Amina Haddad"]), [HER, ME, "Amina Haddad"]);
});

test("blank and unsluggable names are not people the brain can name", () => {
  assert.deepEqual(distinctAuthors(["", "   ", null, undefined, "!!!"]), []);
});

// ── The always-on line: silent for one person, factual for two ────────────────

// 🛑 THE PROGRESSIVE-DISCLOSURE GATE (ADR 0034's doctrine, applied here). A solo
// owner — even one with two Macs and a remote — must see nothing at all.
test("a brain with one author says nothing, ever", () => {
  assert.equal(authorsReminder({ authors: [ME, ME, "thomas pierrain"], me: ME }), null);
  assert.equal(authorsReminder({ authors: [], me: ME }), null);
  assert.equal(authorsReminder({ authors: [], me: null }), null);
});

// The person who just cloned has committed NOTHING yet, and they are still a second
// author. Counting only the history would keep the brain silent for exactly as long
// as it matters most: their first session.
test("the person at the keyboard counts even before their first commit", () => {
  const line = authorsReminder({ authors: [HER], me: ME });

  assert.match(line, /more than one person/i);
  assert.match(line, new RegExp(ME));
  assert.match(line, new RegExp(HER));
});

test("the line names who is at THIS keyboard, because that is what decides where a note lands", () => {
  const line = authorsReminder({ authors: [HER, ME], me: ME });

  assert.match(line, /At this keyboard: Thomas Pierrain/);
  assert.match(line, /dated-note-path/, "and points at the deterministic answer, not at a convention to remember");
});

test("a machine whose git has no user name still gets the line, and is not named as someone", () => {
  const line = authorsReminder({ authors: [HER, ME], me: null });

  assert.match(line, /more than one person/i);
  assert.doesNotMatch(line, /At this keyboard/);
  // And nobody is invented to stand in for the missing name: the list is the history.
  assert.match(line, /^More than one person writes here \(Claire Dubois, Thomas Pierrain\)\. Take a dated note/);
});

// 🛑 THE SAME MACHINE, SOLO. A brain whose git has no `user.name` has ONE author, and a
// nameless keyboard is not a second one. Get this wrong and every such machine opens
// every session announcing a person who does not exist.
test("a nameless keyboard is not a second author — a solo brain stays silent on it", () => {
  assert.equal(authorsReminder({ authors: [ME, ME], me: null }), null);
  assert.equal(secondAuthorAnnouncement({ authors: [ME], me: null, announced: false }), null);
});

test("the name at the keyboard is tidied before it is shown, like every other name", () => {
  assert.match(authorsReminder({ authors: [HER], me: "  Thomas   Pierrain " }), /At this keyboard: Thomas Pierrain\./);
});

// 🛑 A `user.name` this brain cannot slug is not someone it can NAME, and it must not
// count as a second author either — otherwise a solo owner whose git says "???" would
// start seeing a line about "more than one person" written for nobody.
test("an unsluggable name at the keyboard is neither named nor counted", () => {
  assert.equal(authorsReminder({ authors: [ME], me: "???" }), null, "one real author plus a name that is not one");

  const line = authorsReminder({ authors: [HER, ME], me: "???" });
  assert.match(line, /^More than one person writes here \(Claire Dubois, Thomas Pierrain\)\. Take a dated note/);
});

// The whole sentence, once, so that no piece of it can be emptied without a test
// noticing: the count, the names, the keyboard, the instruction, and the ban on
// composing a path by hand — which is the only thing the line actually asks for.
test("the line says exactly what it means to say, word for word", () => {
  assert.equal(
    authorsReminder({ authors: [HER], me: ME }),
    "More than one person writes here (Claire Dubois, Thomas Pierrain). At this keyboard: Thomas Pierrain. " +
      "Take a dated note's path from `node scripts/dated-note-path.mjs --folder <f> --date <d>`; " +
      "never compose it. Silent background.",
  );
});

// The boundary of the "+N": three people are all named, four is where counting starts.
// One off either way and a brain either hides a name it had room for, or grows a roll call.
test("three authors are all named with no count; the fourth is where counting starts", () => {
  assert.match(
    authorsReminder({ authors: [HER, "Amina Haddad"], me: ME }),
    /\(Claire Dubois, Amina Haddad, Thomas Pierrain\)\./,
    "exactly three: named, and no +0 hanging off the end",
  );
  assert.match(
    authorsReminder({ authors: [HER, "Amina Haddad", "Lena Fischer"], me: ME }),
    /\(Claire Dubois, Amina Haddad, Lena Fischer \+1\)\./,
  );
});

// ── The one-time announcement, and the offer that activates nothing ───────────

test("the announcement fires once, for the first second author, and never again", () => {
  const first = secondAuthorAnnouncement({ authors: [HER], me: ME, announced: false });

  assert.match(first, /once/i, "it is addressed to the human, in their language, exactly one time");
  assert.match(first, /own/, "it says what actually changes: each person's day gets its own note");
  assert.match(first, /twice/, "and that a shared source is not stored twice");
  assert.equal(secondAuthorAnnouncement({ authors: [HER], me: ME, announced: true }), null);
});

test("the announcement never fires on a brain with one author", () => {
  assert.equal(secondAuthorAnnouncement({ authors: [ME], me: ME, announced: false }), null);
});

// 🛑 4.3ter: the offer must be declinable at no cost. If declining changed anything,
// it would be a switch wearing the clothes of a question — the exact thing the
// owner's call rejected.
test("the offer is explicitly optional, and declining is said to change nothing", () => {
  const said = secondAuthorAnnouncement({ authors: [HER], me: ME, announced: false });

  assert.match(said, /offer/i);
  assert.match(said, /declin/i);
  assert.match(said, /nothing|no behaviour/i);
});

// ── The hook output ───────────────────────────────────────────────────────────

test("nothing to say produces no output at all, so a solo brain's session start is untouched", () => {
  assert.equal(buildAuthorsHookOutput({ reminder: null, announcement: null }), null);
  assert.equal(buildAuthorsHookOutput({}), null);
});

// The exact block, both halves, both channels: this is what a CLI owner reads verbatim,
// so its punctuation and its separation are part of the behaviour rather than around it.
test("what there is to say rides additionalContext, the only channel Claude Desktop shows", () => {
  const out = buildAuthorsHookOutput({ reminder: "R", announcement: "A" });

  assert.deepEqual(out, {
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: "[authors] R\n\n[authors — say this once] A",
    },
    systemMessage: "R\nA",
  });
});

// Each half alone must carry ONLY itself: a block that printed "[authors] null" would
// still match a test looking for the other half.
test("the reminder alone is enough to emit, and so is the announcement alone", () => {
  const reminderOnly = buildAuthorsHookOutput({ reminder: "R" });
  assert.equal(reminderOnly.hookSpecificOutput.additionalContext, "[authors] R");
  assert.equal(reminderOnly.systemMessage, "R");

  const announcementOnly = buildAuthorsHookOutput({ announcement: "A" });
  assert.equal(announcementOnly.hookSpecificOutput.additionalContext, "[authors — say this once] A");
  assert.equal(announcementOnly.systemMessage, "A");
});

// ═══════════════════════════════════════════════════════════════════════════
// F5 — volume IS the defect (F5). Everything this module puts in
// `additionalContext` is echoed to a CLI owner VERBATIM, prefixed
// `SessionStart:startup says:`, BEFORE they have typed a word. So it is bounded
// here, in its own test, the way every other emitter bounds its own: only this
// file knows what the block is for, and this one is background, not a warning.
// ═══════════════════════════════════════════════════════════════════════════

const MANY = ["Claire Dubois", "Amina Haddad", "Lena Fischer", "Marco Rossi", "Yuki Tanaka"];

test("the line stays short however many people write here — names stop at three, the rest are counted", () => {
  const line = authorsReminder({ authors: MANY, me: ME });

  assert.match(line, /Claire Dubois, Amina Haddad, Lena Fischer \+3/, "three names, then a count");
  assert.doesNotMatch(line, /Marco Rossi/, "a brain that grew a team must not open with a roll call");
  assert.ok(line.length <= 280, `the session-start line is ${line.length} chars`);
});

test("the whole payload stays under what an owner reads before typing a word", () => {
  const reminder = authorsReminder({ authors: MANY, me: ME });
  const announcement = secondAuthorAnnouncement({ authors: MANY, me: ME, announced: false });
  const { additionalContext } = buildAuthorsHookOutput({ reminder, announcement }).hookSpecificOutput;

  assert.ok(announcement.length <= 280, `the one-time sentence is ${announcement.length} chars`);
  assert.ok(additionalContext.length <= 600, `the whole block is ${additionalContext.length} chars`);
});
