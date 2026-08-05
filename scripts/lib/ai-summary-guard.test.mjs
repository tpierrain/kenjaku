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

test("payloadText — a Read-shaped response keeps its headings line-anchored", () => {
  // The regression this pins: with a stringified payload, `^Transcription$` never
  // matches, the notice quietly degrades to "look for the verbatim", and the one
  // situation where the verbatim is RIGHT THERE reads like the one where it does
  // not exist. Green tests, silent wrong answer.
  const response = { file: { filePath: "/tmp/meet.md", content: MEET_EXPORT } };
  assert.match(summaryNotice({ text: payloadText(response) }), /"Transcription" section/);
});
