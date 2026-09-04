// ─────────────────────────────────────────────────────────────────────────────
// brain-author.test.mjs — who writes in this brain, and what the brain owes them
// for noticing (plan steps 4.2, 4.3, 4.3bis, 4.3ter).
//
// Duo mode is IMPLICIT (the owner's call): nothing to switch on, no profile to
// fill in, no list of people to maintain. The name comes from `git config --get
// user.name`, which git already writes into every commit this brain makes and
// which the live sync already speaks aloud ("1 note from Claire arrived").
//
// What implicitness owes in exchange is not a switch: a brain that quietly starts
// filing things differently is opaque. It owed a SENTENCE, and step 8 found that
// the sentence it was saying can be false — this brain compares git author names,
// so an owner's second Mac and a colleague look exactly alike. So it owes a
// QUESTION, asked until it is answered, and the answer is what silences it.
// ─────────────────────────────────────────────────────────────────────────────
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  authorsReminder,
  buildAuthorsHookOutput,
  canonicalAuthor,
  distinctAuthors,
  duoConfirmedNotice,
  GIT_AUTHOR_ARGS,
  GIT_AUTHORS_ARGS,
  localAuthorName,
  secondAuthorQuestion,
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
  assert.equal(secondAuthorQuestion({ authors: [ME], me: null }), null);
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

// ── The question, and why it is a question ───────────────────────────────────
//
// 🛑 STEP 8. What used to stand here ASSERTED "a second person now writes here" —
// a sentence this brain has no way of knowing is true. It compares git author
// names, so an owner's second Mac is indistinguishable from a colleague. A brain
// may FILE on a guess (a file in an unexpected place is visible and reversible);
// it may not ASSERT one.

test("an unplaced second name is a QUESTION, and it names the name", () => {
  const asked = secondAuthorQuestion({ authors: [HER], me: ME });

  assert.match(asked, new RegExp(HER), "the human cannot answer about a name they were not shown");
  assert.match(asked, /someone else/i);
  assert.match(asked, /another machine/i);
  assert.match(asked, /ask/i, "it is put to the human, not decided");
  assert.match(asked, /never guess|do not guess/i);
});

test("the question carries the exact way to record either answer", () => {
  const asked = secondAuthorQuestion({ authors: [HER], me: ME });

  assert.match(asked, /scripts\/author-identity\.mjs/, "an answer nobody can record is a question asked forever");
  assert.match(asked, /--same-person/);
  assert.match(asked, /--different/);
});

test("nothing is asked on a brain with one author", () => {
  assert.equal(secondAuthorQuestion({ authors: [ME], me: ME }), null);
});

// 🛑 THE ANSWER IS WHAT SILENCES IT, and both answers do. A design that only
// remembered "yes, it's me" would ask an honest duo the same question at every
// session start for the life of their brain — punishing the true answer.
test("a confirmed second person is never asked about again", () => {
  assert.equal(secondAuthorQuestion({ authors: [HER], me: ME, distinct: [HER] }), null);
  assert.equal(
    secondAuthorQuestion({ authors: [HER], me: ME, distinct: ["  claire   DUBOIS "] }),
    null,
    "matched by slug, like every other name here",
  );
});

test("a fused machine is never asked about either, and a third name still is", () => {
  const identities = [{ name: ME, aka: ["tpierrain"] }];

  assert.equal(secondAuthorQuestion({ authors: ["tpierrain"], me: ME, identities }), null);
  assert.match(secondAuthorQuestion({ authors: ["tpierrain", HER], me: ME, identities }), new RegExp(HER));
});

test("two unplaced names are asked about together, in one question", () => {
  const asked = secondAuthorQuestion({ authors: [HER, "Amina Haddad"], me: ME });

  assert.match(asked, /Claire Dubois, Amina Haddad/);
});

// A brain whose git has no user.name cannot ask "or YOU on another machine?" — it
// does not know who "you" is — and could not record the answer either, since a
// fusion needs a canonical name to fuse INTO. Silence beats an unanswerable question.
test("with no name at this keyboard, nothing is asked", () => {
  assert.equal(secondAuthorQuestion({ authors: [HER, "Amina Haddad"], me: null }), null);
});

// ── What is said once the answer is "yes, that is somebody else" ─────────────
//
// The explanation duo mode owes moved HERE, from the guess to the confirmation:
// it is printed by the entry point that records the answer, so it is said exactly
// once by construction and needs no marker to remember it.

test("a confirmed duo is told what changes, once, and that nothing had to be switched on", () => {
  const said = duoConfirmedNotice(HER);

  assert.match(said, new RegExp(HER));
  assert.match(said, /once/i, "it is addressed to the human, in their language, exactly one time");
  assert.match(said, /own/, "it says what actually changes: each person's day gets its own note");
  assert.match(said, /twice/, "and that a shared source is not stored twice");
  assert.match(said, /nothing to switch on|switch on/i);
});

// ── The hook output ───────────────────────────────────────────────────────────

test("nothing to say produces no output at all, so a solo brain's session start is untouched", () => {
  assert.equal(buildAuthorsHookOutput({ reminder: null, question: null }), null);
  assert.equal(buildAuthorsHookOutput({}), null);
});

// The exact block, both halves, both channels: this is what a CLI owner reads verbatim,
// so its punctuation and its separation are part of the behaviour rather than around it.
test("what there is to say rides additionalContext, the only channel Claude Desktop shows", () => {
  const out = buildAuthorsHookOutput({ reminder: "R", question: "Q" });

  assert.deepEqual(out, {
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: "[authors] R\n\n[authors — ask, never guess] Q",
    },
    systemMessage: "R\nQ",
  });
});

// Each half alone must carry ONLY itself: a block that printed "[authors] null" would
// still match a test looking for the other half.
test("the reminder alone is enough to emit, and so is the question alone", () => {
  const reminderOnly = buildAuthorsHookOutput({ reminder: "R" });
  assert.equal(reminderOnly.hookSpecificOutput.additionalContext, "[authors] R");
  assert.equal(reminderOnly.systemMessage, "R");

  const questionOnly = buildAuthorsHookOutput({ question: "Q" });
  assert.equal(questionOnly.hookSpecificOutput.additionalContext, "[authors — ask, never guess] Q");
  assert.equal(questionOnly.systemMessage, "Q");
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
  const question = secondAuthorQuestion({ authors: MANY, me: ME });
  const { additionalContext } = buildAuthorsHookOutput({ reminder, question }).hookSpecificOutput;

  assert.ok(question.length <= 420, `the question is ${question.length} chars`);
  assert.ok(additionalContext.length <= 760, `the whole block is ${additionalContext.length} chars`);
});

// The question names at most three, like the line above it. Five unplaced names is a
// brain somebody handed round a team, and a roll call is not a question anyone answers.
test("the question stops naming at three and counts the rest", () => {
  const asked = secondAuthorQuestion({ authors: MANY, me: ME });

  assert.match(asked, /Claire Dubois, Amina Haddad, Lena Fischer \+2/);
  assert.doesNotMatch(asked, /Marco Rossi/);
});

// ═══════════════════════════════════════════════════════════════════════════
// STEP 8 — ONE PERSON WITH TWO MACS IS NOT A DUO.
//
// The defect this section pins: everything above compares git author NAMES, so
// an owner whose two machines are configured `Thomas Pierrain` and `tpierrain`
// is read as two humans — told "a second person now writes here" while alone,
// and their daily notes split one file per machine. The comment on the gate
// above even promises the opposite ("even one with two Macs"): case and spacing
// were the only spellings it ever reconciled.
//
// The fix is an IDENTITY REGISTRY — spellings the owner has confirmed are one
// person — consulted before any comparison. It resolves nothing on its own: it
// only remembers an answer already given, which is why it may never invent a
// fusion the human did not confirm.
// ═══════════════════════════════════════════════════════════════════════════

const ME_ON_THE_OTHER_MAC = "tpierrain";
const IDENTITIES = [{ name: ME, aka: [ME_ON_THE_OTHER_MAC] }];

test("a confirmed alias resolves to the spelling the owner keeps", () => {
  assert.equal(canonicalAuthor(ME_ON_THE_OTHER_MAC, IDENTITIES), ME);
  assert.equal(canonicalAuthor(ME, IDENTITIES), ME, "the canonical spelling resolves to itself");
});

// Matched by slug like every other comparison here, or the registry would be a
// second, subtly different notion of "the same name" living beside the first.
test("an alias is matched the way every other name is: by slug, not by spelling", () => {
  assert.equal(canonicalAuthor("  TPierrain  ", IDENTITIES), ME);
});

test("a name nobody confirmed is returned untouched — the registry never guesses", () => {
  assert.equal(canonicalAuthor(HER, IDENTITIES), HER);
  assert.equal(canonicalAuthor("Thomas Pierre", IDENTITIES), "Thomas Pierre", "a near-miss is a different person");
});

// 🛑 FAIL-OPEN, IN EVERY DIRECTION. This registry is read off disk at session
// start; a missing file, a half-written one, or a hand-edited one must cost the
// fusion and nothing else. Anything harsher turns a corrupt byte into a brain
// that will not start.
test("an absent, empty or malformed registry behaves exactly as no registry at all", () => {
  for (const junk of [undefined, null, [], "nope", 42, {}, [null], [{}], [{ name: ME }], [{ aka: ["x"] }], [{ name: ME, aka: "x" }]]) {
    assert.equal(canonicalAuthor(ME_ON_THE_OTHER_MAC, junk), ME_ON_THE_OTHER_MAC, `junk: ${JSON.stringify(junk)}`);
  }
});

test("an entry whose canonical name cannot be slugged is not an identity anyone can be fused into", () => {
  assert.equal(canonicalAuthor(ME_ON_THE_OTHER_MAC, [{ name: "???", aka: [ME_ON_THE_OTHER_MAC] }]), ME_ON_THE_OTHER_MAC);
});

test("counting people goes through the registry, so two spellings of one owner are one author", () => {
  assert.deepEqual(distinctAuthors([ME, ME_ON_THE_OTHER_MAC], IDENTITIES), [ME]);
  assert.deepEqual(
    distinctAuthors([ME_ON_THE_OTHER_MAC, ME], IDENTITIES),
    [ME],
    "and the kept spelling is the canonical one even when the alias came first",
  );
});

test("without a registry, counting is exactly what it was — two spellings, two people", () => {
  assert.deepEqual(distinctAuthors([ME, ME_ON_THE_OTHER_MAC]), [ME, ME_ON_THE_OTHER_MAC]);
});

test("the registry fuses only who it was told about, and leaves a real second person alone", () => {
  assert.deepEqual(distinctAuthors([ME, ME_ON_THE_OTHER_MAC, HER], IDENTITIES), [ME, HER]);
});

// 🛑 THE DEFECT ITSELF, in the two places it reaches the human. This is the pair
// of assertions the whole step exists for: a solo owner with two differently
// configured Macs must be told NOTHING, and must never be announced a colleague.
test("a solo owner with two Macs, once confirmed, goes back to complete silence", () => {
  assert.equal(authorsReminder({ authors: [ME, ME_ON_THE_OTHER_MAC], me: ME, identities: IDENTITIES }), null);
  assert.equal(
    authorsReminder({ authors: [ME], me: ME_ON_THE_OTHER_MAC, identities: IDENTITIES }),
    null,
    "including when the OTHER Mac is the one at the keyboard",
  );
  assert.equal(secondAuthorQuestion({ authors: [ME, ME_ON_THE_OTHER_MAC], me: ME, identities: IDENTITIES }), null);
});

// And the converse, so the fix cannot be "stay silent more often": a genuine duo
// is still seen, registry or no registry.
test("a real second person is still counted, announced and named, registry or not", () => {
  const line = authorsReminder({ authors: [ME, ME_ON_THE_OTHER_MAC, HER], me: ME, identities: IDENTITIES });

  assert.match(line, /^More than one person writes here \(Thomas Pierrain, Claire Dubois\)\./);
  assert.doesNotMatch(line, new RegExp(ME_ON_THE_OTHER_MAC), "the alias is not a third name in the list");
  assert.match(secondAuthorQuestion({ authors: [ME, HER], me: ME, identities: IDENTITIES }), new RegExp(HER));
});
