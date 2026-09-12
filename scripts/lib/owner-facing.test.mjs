import { test } from "node:test";
import assert from "node:assert/strict";
import { directiveTraces, isOwnerFacing, jargonTraces } from "./owner-facing.mjs";

// ─────────────────────────────────────────────────────────────────────────────
// The rule under test: a string the OWNER reads must not be written for the MODEL.
//
// It exists because the leak measured on 2026-09-12 is not an echo from the host —
// it is this engine writing directives into `systemMessage`, which is the channel
// the CLI prints. The markers below are all literals we write ourselves, which is
// what makes the check honest rather than an attempt to parse English.
// ─────────────────────────────────────────────────────────────────────────────

// ── directiveTraces: what marks a payload as the model's, not the owner's ────

test("directiveTraces finds nothing in a sentence written for the owner", () => {
  // The status banner's own words: a fact about their brain, in their terms.
  assert.deepEqual(directiveTraces("Your notes are all indexed — 414 of 414."), []);
});

test("directiveTraces lets a pronoun about THINGS pass", () => {
  // The wiki-health lead says "they answer from stale content" about the NOTES.
  // A blunt /they/ rule would have flagged the one payload already written right,
  // which is how a guard teaches people to switch it off.
  assert.deepEqual(
    directiveTraces("2 notes the engine cannot read (they answer from stale content)."),
    [],
  );
});

test("directiveTraces catches the owner placed in the third person", () => {
  // The live payload's own words, and note the possessive: a marker list holding
  // "the owner" would have passed the very string it exists for.
  assert.deepEqual(directiveTraces("No profile yet for this owner's context."), ["phrase: owner"]);
});

test("directiveTraces does not fire on a word that merely CONTAINS a marker", () => {
  // `username` is not `user`. The boundary is what keeps the guard usable.
  assert.deepEqual(directiveTraces("Your username is already set."), []);
});

test("directiveTraces catches an instruction to speak for us", () => {
  // The live leak, word for word, from universe-reminder.mjs.
  const traces = directiveTraces("Offer once, in their language, to describe it.");
  assert.deepEqual(traces, ["phrase: their language", "phrase: offer once"]);
});

test("directiveTraces catches a routing tag opening the payload", () => {
  assert.deepEqual(directiveTraces("[wiki-health] Pending: 3 broken links."), ["routing tag"]);
});

test("directiveTraces catches a command line", () => {
  const traces = directiveTraces('Record their answer: node scripts/author-identity.mjs --same-person "x"');
  assert.ok(traces.includes("command line"), `expected a command-line trace, got ${traces.join(" · ")}`);
});

test("directiveTraces catches the engine shouting at the model", () => {
  const traces = directiveTraces("ASK before today's first note. NEVER guess.");
  assert.deepEqual(traces, ["shouted: ASK", "shouted: NEVER"]);
});

// 🛑 JUDGED ON ITS FALSE POSITIVES (CONVENTIONS §5quater), and this one fired on the
// very first real payload it met: the engine-divergence line names the file it is
// leaving alone, and that file is `.claude/skills/coach/SKILL.md`. A guard that calls
// a filename shouting is a guard that gets switched off.
test("directiveTraces does not mistake a FILENAME for shouting", () => {
  assert.deepEqual(
    directiveTraces("The engine is leaving .claude/skills/coach/SKILL.md alone."),
    [],
  );
  assert.deepEqual(directiveTraces("Created a running list (vault/actions-log.md)."), []);
  assert.deepEqual(directiveTraces("Edit CLAUDE.md, not this one."), []);
});

test("directiveTraces still hears shouting at the end of a sentence", () => {
  // The path carve-out must not swallow a real marker just because a full stop
  // follows it — that would blank the last word of every sentence.
  assert.deepEqual(directiveTraces("Do not guess. NEVER."), ["shouted: NEVER"]);
});

test("directiveTraces lets the acronyms an owner legitimately reads pass", () => {
  // A status line says "RAG unavailable" and an error says "MCP server not loaded".
  // Both are the owner's vocabulary, and a length rule would not have told them
  // apart from ASK — the distinction is meaning, so it is an allow-list.
  assert.deepEqual(directiveTraces("The RAG is unavailable: check the MCP server."), []);
});

test("directiveTraces reports EVERY trace, not the first", () => {
  // A failing test that names one marker sends you round the loop once per marker.
  const traces = directiveTraces("[universe] Tell them, in their language. NEVER nag.");
  assert.deepEqual(traces, [
    "phrase: their language",
    "phrase: tell them",
    "routing tag",
    "shouted: NEVER",
  ]);
});

test("directiveTraces treats a missing or empty payload as nothing to report", () => {
  // Every wrapper here returns null when it has nothing to say, and a guard that
  // throws on null would turn a silent session start into a crash.
  assert.deepEqual(directiveTraces(null), []);
  assert.deepEqual(directiveTraces(""), []);
  assert.deepEqual(directiveTraces(undefined), []);
});

test("isOwnerFacing is the yes/no of the same judgment", () => {
  assert.equal(isOwnerFacing("Your brain is ready."), true);
  assert.equal(isOwnerFacing("Tell them, in their language."), false);
});

// ── jargonTraces: the machinery's vocabulary in a sentence a person reads ────

test("jargonTraces finds the machinery's words", () => {
  assert.deepEqual(jargonTraces("Orphans (3):"), ["jargon: orphan"]);
  assert.deepEqual(jargonTraces("Frontmatter issues"), ["jargon: frontmatter"]);
  assert.deepEqual(jargonTraces("Dangling links"), ["jargon: dangling"]);
});

test("jargonTraces matches on a word, not on a substring", () => {
  // `orphanage` is not `orphan`, and a guard that cannot tell them apart gets
  // switched off the first time it is wrong.
  assert.deepEqual(jargonTraces("The orphanage on the hill"), []);
});

test("jargonTraces leaves the words an owner actually uses alone", () => {
  // `link` stays: a broken link is something anyone can picture. It is `dangling`
  // that names the scanner's idea of it.
  assert.deepEqual(jargonTraces("3 links point at notes that do not exist."), []);
});

test("jargonTraces reports every distinct word once", () => {
  const traces = jargonTraces("The orphan and the other orphans have no frontmatter.");
  assert.deepEqual(traces, ["jargon: orphan", "jargon: frontmatter"]);
});

// 🗣️ `entity` — added when the sweep of step 6 met `Entity pages to refresh` on the
// consolidation report. It is the taxonomy's name for "a person, a subject, a
// company, a project", and it is the one word in that heading an owner cannot
// picture: they have people and topics, they have never had an entity.
test("jargonTraces knows the taxonomy's own noun for a person or a subject", () => {
  assert.deepEqual(jargonTraces("Entity pages to refresh"), ["jargon: entity"]);
  assert.deepEqual(jargonTraces("2 stale entities"), ["jargon: entity"]);
});

// The false-positive side, which is the one that gets a guard switched off
// (CONVENTIONS §5quater): the word list must not fire on ordinary English that
// merely begins the same way.
test("jargonTraces does not fire on a word that merely starts like one", () => {
  assert.deepEqual(jargonTraces("Your entitlement is unchanged."), []);
  assert.deepEqual(jargonTraces("The chunky notes"), []);
});

// 🛑 A WIKI LINK IS NOT A ROUTING TAG, and this one was found by the step-6 sweep
// rather than foreseen: the consolidation report indents each candidate as
// `  [[people/ada-lovelace]] — cited by 2`, and the doubled bracket read as the
// `[wiki-health]` dispatch marker. A `[[link]]` is the OWNER'S OWN notation — it
// is what they type in their notes — so flagging it would have made the guard
// wrong about the most ordinary string in the product (CONVENTIONS §5quater:
// judge a checker on its false positives).
test("a wiki link opening a line is the owner's own notation, not a routing tag", () => {
  assert.deepEqual(directiveTraces("  [[people/ada-lovelace]] — mentioned in 2 notes"), []);
  assert.deepEqual(directiveTraces("[[topics/kanban]]"), []);
});

test("a real routing tag still fires, so the carve-out did not empty the rule", () => {
  assert.deepEqual(directiveTraces("[wiki-health] 3 notes to fold in"), ["routing tag"]);
  assert.deepEqual(directiveTraces("  [universe] switch happened"), ["routing tag"]);
});

// ═══════════════════════════════════════════════════════════════════════════
// What the mutation pass asked for (v5.4, §5quinquies). Nineteen mutants lived
// through the first run, and all but a couple pointed at the same hole: the
// FALSE-POSITIVE half of this module — the allow-list and the two carve-outs —
// was almost entirely unasserted. Emptying any acronym, or shortening the path
// pattern, changed no test. That is the half a guard is judged on (§5quater),
// so it is the half that gets the assertions.
// ═══════════════════════════════════════════════════════════════════════════

// One sentence per allowed acronym, each in an ordinary owner-facing line, so
// deleting any single entry from the allow-list turns a legitimate message into
// a "shouted" accusation and fails HERE rather than in the field.
test("every acronym the owner legitimately reads passes, one by one", () => {
  const SENTENCES = {
    RAG: "Your RAG index finished rebuilding.",
    MCP: "Your MCP connection to Slack is back.",
    CLI: "This works the same in the CLI.",
    API: "The API you connected answered again.",
    YAML: "The YAML block at the top of that note is back in shape.",
    URL: "That URL now points at a page that exists.",
    OK: "Everything is OK again.",
    ID: "The ID on that card did not change.",
    AI: "The AI summary in that export is kept as a summary.",
    PR: "The PR you opened was merged.",
    UTC: "Times are shown in UTC.",
  };

  for (const [acronym, sentence] of Object.entries(SENTENCES)) {
    assert.deepEqual(directiveTraces(sentence), [], `${acronym} must not read as shouting`);
  }
});

// A word that is NOT on the list still trips, in the same shape of sentence —
// otherwise the test above would pass just as well with the shout rule deleted.
test("an acronym nobody allowed still reads as shouting", () => {
  assert.deepEqual(directiveTraces("Everything is FINE again."), ["shouted: FINE"]);
});

// The path carve-out must swallow the WHOLE token, not stop at the extension: a
// doc link carries an anchor, and a heading anchor is upper-case by convention.
test("a path keeps its carve-out all the way past its anchor", () => {
  assert.deepEqual(directiveTraces("see .claude/skills/coach/SKILL.md#IDENTITY"), []);
  assert.deepEqual(directiveTraces("scripts/lib/wiki-lint.mjs:273 — the report"), []);
});

// A command line stays one however it was laid out: these payloads are composed
// by joining fragments, and a line that wrapped can arrive with extra spacing.
test("a command line is still a command line when the spacing is not exactly one space", () => {
  assert.deepEqual(directiveTraces("run node  scripts/author-identity.mjs"), ["command line"]);
  assert.deepEqual(directiveTraces("run node\tscripts/author-identity.mjs"), ["command line"]);
});

// The non-string guard, on the word-list half too: every emitter can hand it an
// absent value, and a crash at session start is the one outcome nobody recovers
// from on their own.
test("jargonTraces survives being handed nothing at all", () => {
  assert.deepEqual(jargonTraces(null), []);
  assert.deepEqual(jargonTraces(undefined), []);
  assert.deepEqual(jargonTraces(""), []);
  assert.deepEqual(jargonTraces(42), []);
});

// And the guard is what makes that safe, not luck. A regex coerces whatever it is
// handed, so a LIST of lines — the shape a caller most plausibly passes by mistake —
// would be read as the string "orphan notes" and answered as if it were one. The
// three cases above all happen to coerce to something harmless; this one does not.
test("jargonTraces refuses to judge a value that merely LOOKS like a sentence", () => {
  assert.deepEqual(jargonTraces(["orphan notes"]), []);
});

test("directiveTraces survives being handed something that is not a string", () => {
  assert.deepEqual(directiveTraces(42), []);
  assert.deepEqual(directiveTraces({ text: "owner" }), []);
});
