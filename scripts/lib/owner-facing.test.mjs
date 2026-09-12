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
