import { test } from "node:test";
import assert from "node:assert/strict";

import { summaryNotice, payloadText } from "./ai-summary-guard.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// ai-summary-guard — the pure half of the PostToolUse notice that fires when an
// AI synthesis has just been READ, so it cannot quietly become the source.
//
// The field defect, in one line: a Meet export held a Gemini summary AND, below
// it, the verbatim transcript; the deliverable was built on the summary. Layer 1
// (the source header) makes that visible at the moment of WRITING, and refuses a
// note that declares nothing — but only for notes born through the builder. This
// layer is the other belt: it speaks at the moment of READING, on any path,
// including a hand-written note.
//
// It NEVER blocks (ADR 0009's spirit here: deterministic, but a false positive
// must cost a line of text, not a refused read) and it must stay silent on an
// ordinary document — a checker that cries wolf is a checker nobody reads
// (CONVENTIONS.md §5quater).
// ═══════════════════════════════════════════════════════════════════════════

// A Meet export, in the shape the field one had: the AI notes first, the
// transcription below — which is exactly why reading "the top of the file"
// lands on the summary.
const MEET_EXPORT = `Point Julien - 2026/08/05 10:00 CEST - Notes par Gemini

Résumé

Thomas et Julien font le point sur la capacité d'exécution du studio.

Étapes suivantes

- Julien: relancer Nexcer avant vendredi.

Détails

Nous vous conseillons d'examiner les notes de Gemini.

Transcription

Thomas: on en est où sur le studio ?
Julien: deux semaines ! Deux semaines !
Thomas: ok, je note.
`;

// The same export, cut where a partial read cuts it — which is how the field
// failure actually happened: a 110k-character file, an extraction, then a read
// of the first 140 lines, and those 140 lines ARE the summary.
const SUMMARY_ONLY = MEET_EXPORT.split("Transcription")[0];

test("summaryNotice — an export holding BOTH says which half is the source", () => {
  const notice = summaryNotice({ toolName: "Read", text: MEET_EXPORT });
  assert.match(notice, /verbatim/i, "the notice must name what the source IS");
  assert.match(
    notice,
    /Transcription/,
    "and where it starts, so reading it is one gesture rather than a search",
  );
});

test("summaryNotice — with no verbatim in sight, it says so rather than naming a section", () => {
  // The two situations are NOT the same and must not read the same (this plan's
  // own reframe): "the verbatim is right there, further down" is a gesture away;
  // "there is no verbatim here" is a caveat the note has to carry. Naming a
  // section that is not in the payload would send the reader looking for a
  // heading that does not exist — and, unguarded, would name it `undefined`.
  const notice = summaryNotice({ toolName: "Read", text: SUMMARY_ONLY });
  assert.match(notice, /AI synthesis/i, "it must still say what tier was just read");
  assert.doesNotMatch(notice, /undefined/, "never a section that is not there");
  assert.match(
    notice,
    /if there is none|no verbatim/i,
    "and what to do when the raw material cannot be found: say so in the note",
  );
});

test("summaryNotice — a verbatim with no heading of its own is still a verbatim", () => {
  // Not every export labels its transcript. Noota's does not: it runs speaker
  // turns as "<name>  mm:ss", and a Meet export in Markdown runs "**Name:**".
  // Missing them would send the reader hunting for a transcript that is already
  // under their eyes — the same wrong tier, reached by a different door.
  const noota = `Résumé de la réunion par Noota

Points clés: la capacité du studio.

Julien  00:12
deux semaines ! deux semaines !

Thomas  00:18
ok, je note.

Julien  00:24
et pour Nexcer, je relance.
`;
  const notice = summaryNotice({ toolName: "Read", text: noota });
  assert.match(notice, /verbatim is the source/i);
  assert.match(
    notice,
    /speaker turns/i,
    "it must point at what it actually found, not invent a section name",
  );
});

// ── Silence on a healthy read (CONVENTIONS.md §5quater) ────────────────────
// This hook fires on the reading path, i.e. constantly. A checker is judged on
// what it says about a HEALTHY brain, and one that speaks on ordinary documents
// is one whose warning is skipped on the day it matters.

test("summaryNotice — an ordinary document says nothing at all", () => {
  const plain = `# Capacity management

Notes from the product page. We track WIP per squad, and the studio's own
capacity is reviewed every quarter with Julien.
`;
  assert.equal(summaryNotice({ text: plain }), null);
});

test("summaryNotice — a pure verbatim is the RIGHT tier and must not be scolded", () => {
  // Reading a transcript is the behaviour the whole layer is trying to produce.
  // A notice here would train its reader to dismiss the one that matters.
  const transcript = `Transcription

**Thomas:** on en est où sur le studio ?
**Julien:** deux semaines ! Deux semaines !
**Thomas:** ok, je note.
`;
  assert.equal(summaryNotice({ text: transcript }), null);
});

test("summaryNotice — merely NAMING a note-taker is not a synthesis", () => {
  // "We should try Otter" is a sentence about a product. Matching a bare product
  // name would fire on meeting notes, tool comparisons and this very repo.
  const mention = `# Tooling

We compared Otter and Fireflies last month; Gemini is enabled on the workspace.
Nobody has decided anything yet.
`;
  assert.equal(summaryNotice({ text: mention }), null);
});

test("summaryNotice — a search HIT is told apart from a document that was opened", () => {
  // Mechanism (1) of the field failure, and the one nothing else catches: Drive's
  // `search_files` returned a `contentSnippet` already holding the summary AND
  // its "Étapes suivantes" list. It was in context before any document was
  // opened, so there was never a verbatim-or-summary choice to make. A snippet is
  // not a low tier — it is not a source, and the notice has to say the gesture:
  // open the document.
  const hit = `Point Julien - Notes par Gemini — Résumé: capacité du studio. Étapes suivantes: relancer Nexcer.`;
  const notice = summaryNotice({ text: hit, fromSearch: true });
  assert.match(notice, /search (?:hit|result)/i, "it must name what this payload IS");
  assert.match(notice, /never a source/i);
  assert.match(notice, /open the document/i, "and the gesture that fixes it");
  // The same text, actually opened, is a different situation and gets the
  // ordinary summary notice — not the snippet one.
  assert.doesNotMatch(summaryNotice({ text: hit }), /search (?:hit|result)/i);
});

// ── Getting at the text, whatever tool answered ────────────────────────────
// The hook sees `tool_response`, and its shape is the tool's business: a string
// for some, `{ file: { content } }` for Read, `{ content: [{ type, text }] }` for
// an MCP connector. Flattening happens HERE, in the pure half, because the one
// thing that must survive it is the LINE STRUCTURE — every detection above is
// line-anchored, and a JSON.stringify would hand the regexes one long line with
// literal `\n` in it, silently matching nothing ever again.

test("payloadText — pulls the strings out of any response shape, keeping the lines", () => {
  assert.equal(payloadText("plain string"), "plain string");
  assert.equal(payloadText({ file: { filePath: "/a/b.md", content: "one\ntwo" } }), "/a/b.md\none\ntwo");
  assert.equal(
    payloadText({ content: [{ type: "text", text: "first" }, { type: "text", text: "second" }] }),
    "text\nfirst\ntext\nsecond",
  );
  assert.equal(payloadText(undefined), "");
  assert.equal(payloadText({ ok: true, count: 3 }), "", "non-strings carry no prose to judge");
});

// ── Where the verbatim is, and where it only LOOKS like it is ───────────────
// The mutation pass left 15 survivors inside the two heading regexes and 13
// inside the two turn shapes: both anchors of every one of them could be
// dropped green. An unanchored heading match is not a smaller net, it is a
// different one — it fires on any line that merely CONTAINS the word, and the
// notice then sends its reader to a section that does not exist.

// The heading, with the cosmetic noise a real export puts around it: indentation,
// the Markdown hard-break's trailing double space, one-to-six hashes, and the
// hash written tight against the word. The line sits directly under prose, with
// no blank line above it — a blank line would let a mutant that eats one leading
// whitespace character match anyway, which is exactly how these survived.
const summaryHeaded = (heading) => `Notes par Gemini

Résumé

Thomas et Julien font le point sur la capacité du studio.
${heading}
Thomas: on en est où sur le studio ?
`;

test("summaryNotice — the verbatim heading is found through an export's cosmetic noise", () => {
  for (const [heading, named] of [
    ["Transcription", "Transcription"],
    ["  Transcription  ", "Transcription"],
    ["## Transcript", "Transcript"],
    ["#Transcript", "Transcript"],
    ["   ###   Transcript   ", "Transcript"],
  ]) {
    assert.equal(
      summaryNotice({ text: summaryHeaded(heading) }),
      noticeWithVerbatim(`it starts at the "${named}" section`),
      `the heading written as ${JSON.stringify(heading)} must still be found`,
    );
  }
});

test("summaryNotice — a document that TALKS about the transcript has no heading to point at", () => {
  // Both anchors earn their keep here. Without `^`, a line ending in the word
  // matches; without `$`, a line starting with it does. Either way the notice
  // would claim the verbatim "starts at the Transcription section" of a document
  // whose whole point is that the verbatim was not kept.
  const noVerbatim = `Notes par Gemini

Résumé

Meet n'a pas produit de Transcription
Transcription indisponible côté Meet.
Nous n'avons pas de Transcript
Transcript introuvable pour ce point.
`;
  assert.equal(summaryNotice({ text: noVerbatim }), NOTICE_SUMMARY_ONLY);
});

test("summaryNotice — Markdown speaker turns are a verbatim, French colon spacing included", () => {
  // `**Name:**` was reached by nothing: the one test that fed it expects silence,
  // and silence is decided before the turn shapes are ever consulted. Two
  // spellings on purpose — the tight colon and the French space before it — so
  // neither the "some whitespace" nor the "no whitespace" reading of the
  // separator can satisfy all three turns on its own.
  const markdown = `Compte-rendu par Fathom

Points clés: la capacité du studio.

**Thomas**: on en est où sur le studio ?
**Julien** : deux semaines ! Deux semaines !
**Thomas**: ok, je note.
`;
  assert.equal(
    summaryNotice({ text: markdown }),
    noticeWithVerbatim("it is the speaker turns further down this same document"),
  );
});

test("summaryNotice — an hour-long meeting's turns are turns, trailing spaces and all", () => {
  // Three shapes at once, each of which a mutant walked through: the seconds
  // field of a meeting that ran past the hour, the trailing whitespace an export
  // leaves on its header lines, and turns packed with no blank line between them.
  // Built line by line rather than as one template literal, because the trailing
  // whitespace on the turn headers is load-bearing here and an invisible one is
  // an accident waiting to be reformatted away.
  const packed = [
    "Notes par Fireflies",
    "",
    "Résumé: la capacité du studio.",
    "",
    "Julien  01:00:12  ",
    "deux semaines ! deux semaines !",
    "Thomas  01:00:18  ",
    "ok, je note.",
    "Sarah  01:02:04  ",
    "et pour Nexcer, je relance.",
    "",
  ].join("\n");
  assert.equal(
    summaryNotice({ text: packed }),
    noticeWithVerbatim("it is the speaker turns further down this same document"),
  );
});

test("summaryNotice — a summary's own bullets and chapter index are not speaker turns", () => {
  // The three false positives an unanchored turn shape produces, and all three
  // are ordinary furniture of the very documents this hook reads: an actions
  // list with bold owners, a chapter index with timestamps, and prose that cites
  // a timestamp mid-sentence. Reported as a verbatim, each would send its reader
  // "further down this same document" to read the summary a second time.
  const bulletedOwners = `Notes par Noota

Étapes suivantes

- **Julien**: relancer Nexcer avant vendredi.
- **Thomas**: préparer le point capacité.
- **Sarah**: valider le budget studio.
`;
  const chapterIndex = `Résumé par Otter

Chapitres

- Introduction  00:00
- Capacité du studio  04:12
- Prochaines étapes  09:30
`;
  const citedInProse = `Notes par Otter

Détails

Julien  00:12 revient sur la capacité du studio.
Thomas  00:18 rappelle l'échéance de vendredi.
Sarah  01:04 propose de relancer Nexcer.
`;
  // The column alignment is the signature, not the timestamp: an unbulleted
  // chapter list separates its label from its time with a single space, and the
  // shape this looks for is deliberately the aligned one (§5quater — a net that
  // also catches tables of contents is a notice its reader learns to skip).
  const looseChapters = `Résumé par Otter

Chapitres

Introduction 00:00
Capacité du studio 04:12
Prochaines étapes 09:30
`;
  for (const [name, text] of [
    ["an actions list with bold owners", bulletedOwners],
    ["a chapter index", chapterIndex],
    ["timestamps cited in prose", citedInProse],
    ["an unaligned chapter list", looseChapters],
  ]) {
    assert.equal(summaryNotice({ text }), NOTICE_SUMMARY_ONLY, `${name} is not a transcript`);
  }
});

test("summaryNotice — the possessive spelling of Gemini's notes is a signature too", () => {
  // The one signature no other pattern subsumes: "Gemini's notes" says the same
  // thing as "notes by Gemini" with the words the other way round, so nothing
  // else in the list sees it. Both apostrophes, because an export that went
  // through a word processor carries the curly one — and the wrapped spelling,
  // because a phrase broken across two lines is the trap this repo has already
  // met twice on its doc guards.
  for (const owner of ["Gemini's notes", "Gemini’s notes", "Gemini's \nnotes"]) {
    assert.equal(
      summaryNotice({ text: `# Point Julien\n\nSource: ${owner} du 5 août.\n` }),
      NOTICE_SUMMARY_ONLY,
      `${JSON.stringify(owner)} must read as an AI synthesis`,
    );
  }
  // And the spelling that does NOT need a line of its own: the general "notes by
  // <taker>" signature already carries every connector, "de" included. A second
  // pattern for it would be a second opinion on the same rule — this pins that
  // the general one covers it, so nobody adds one back.
  for (const spelt of ["les notes de Gemini", "Notes de Gemini", "note de Gemini"]) {
    assert.equal(
      summaryNotice({ text: `# Point Julien\n\nSource: ${spelt}, 5 août.\n` }),
      NOTICE_SUMMARY_ONLY,
      `${JSON.stringify(spelt)} is caught by the general signature`,
    );
  }
});

// ── The three notices, asserted WHOLE ───────────────────────────────────────
// The mutation pass blanked four sentences green, and all four were the half
// that says what NOT to do: "do not lift the summary's own list of actions out
// of the snippet", "do not take the actions from the summary's own list", where
// the verbatim usually sits, and "declare the tier you actually read". A notice
// matched by a fragment can lose its consequence and stay green — the same
// lesson batch 2b paid for on the update-engine consent blocks. So each of the
// three branches is pinned as the exact string the model receives.

const NOTICE_SNIPPET =
  `⚠️ That search hit quotes an AI synthesis. A search-result snippet is never a source — ` +
  `open the document, read the verbatim in it, and declare the tier you actually read. ` +
  `Do not lift the summary's own list of actions out of the snippet.`;

const noticeWithVerbatim = (where) =>
  `⚠️ What you just read carries an AI synthesis AND the verbatim, in the same document. ` +
  `The verbatim is the source: ${where}. Read it before you write anything from this, ` +
  `and do not take the actions from the summary's own list.`;

const NOTICE_SUMMARY_ONLY =
  `⚠️ What you just read is an AI synthesis — the lowest source tier. Look for the verbatim ` +
  `before you write anything from this: in these exports it usually sits BELOW the summary, ` +
  `so a partial read lands on the summary alone. If there is none, say so in the note and ` +
  `declare the tier you actually read.`;

test("summaryNotice — each of the three notices is exactly what the model receives", () => {
  assert.equal(
    summaryNotice({ text: MEET_EXPORT }),
    noticeWithVerbatim(`it starts at the "Transcription" section`),
  );
  assert.equal(summaryNotice({ text: SUMMARY_ONLY }), NOTICE_SUMMARY_ONLY);
  assert.equal(
    summaryNotice({ text: `Notes par Gemini\n\nRésumé du point.`, fromSearch: true }),
    NOTICE_SNIPPET,
  );
});

// ── Getting at the text: the shapes a hook payload can actually take ────────

test("payloadText — a payload carrying null never throws (the hook is on the read path)", () => {
  // `typeof null === "object"` is JavaScript's oldest trap, and this walker
  // recurses on anything object-shaped. Losing the `value &&` guard turns every
  // null in a tool response into a TypeError — swallowed by the hook's catch,
  // so the notice would simply stop existing, silently, for that whole tool.
  assert.equal(payloadText(null), "");
  assert.equal(payloadText({ file: null, text: "kept" }), "kept");
  assert.equal(payloadText([null, "kept", undefined]), "kept");
});

test("payloadText — it stops walking once it has enough to judge", () => {
  // The cap exists because a meeting export runs to 110k characters and this
  // hook fires on every read. Without it a vault dump would be walked whole,
  // and the notice's cost would be paid on every tool call of every session.
  const chunk = (letter) => letter.repeat(200_000);
  const walked = payloadText([chunk("a"), chunk("b"), chunk("c")]);
  assert.equal(walked.length, 400_001, "two chunks and the newline joining them, never the third");
  assert.ok(!walked.includes("c"), "the walk stops at the cap instead of reading the whole payload");
});

test("payloadText — a Read-shaped response keeps its headings line-anchored", () => {
  // The regression this pins: with a stringified payload, `^Transcription$` never
  // matches, the notice quietly degrades to "look for the verbatim", and the one
  // situation where the verbatim is RIGHT THERE reads like the one where it does
  // not exist. Green tests, silent wrong answer.
  const response = { file: { filePath: "/tmp/meet.md", content: MEET_EXPORT } };
  assert.match(summaryNotice({ text: payloadText(response) }), /"Transcription" section/);
});
