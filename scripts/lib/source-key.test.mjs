// ─────────────────────────────────────────────────────────────────────────────
// source-key.test.mjs — the spelling of a source identity (ADR 0041).
//
// Everything downstream of this file compares STRINGS: the duplicate check greps
// the vault's frontmatter for one. So the only property that matters here is that
// two people meeting the SAME source, through different connectors, in different
// timezones, with a display name on one side and a bare address on the other,
// reduce to the SAME string — and that two DIFFERENT sources never do.
//
// A key that is merely "usually right" is worse than no key at all: a check that
// never matches is indistinguishable from a check nobody wired up (ADR 0041).
// ─────────────────────────────────────────────────────────────────────────────
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  isSourceKey,
  noteSources,
  notesHoldingSource,
  renderSourcesField,
  sourceKey,
  SOURCE_TYPES,
  SOURCES_FIELD,
} from "./source-key.mjs";

// The five rows of ADR 0041's key table, spelled out as the ADR spells them. Hand-
// written on purpose (CONVENTIONS §5ter): a fixture computed by the code under test
// would agree with any spelling that code happened to produce.
const TABLE = [
  [{ type: "slack", channel: "C0CEQ4R5E", ts: "1725283200.001200" }, "slack|C0CEQ4R5E|1725283200.001200"],
  [{ type: "calendar", event: "pgtmb1knn969ftm8i3sd01ojiq_20260903T073000Z" }, "calendar|pgtmb1knn969ftm8i3sd01ojiq_20260903T073000Z"],
  [{ type: "drive", file: "1A2b3C4d5E6f7G8h9I0j" }, "drive|1A2b3C4d5E6f7G8h9I0j"],
  [{ type: "notion", page: "1f2a3b4c5d6e7f8091a2b3c4d5e6f708" }, "notion|1f2a3b4c5d6e7f8091a2b3c4d5e6f708"],
  [
    { type: "mail", from: "Facture <billing@example.com>", date: "2026-09-02T16:19:32Z", subject: "Your invoice is ready" },
    "mail|billing@example.com|20260902T161932Z|your-invoice-is-ready",
  ],
];

test("every row of the ADR's key table composes exactly the key the ADR promises", () => {
  for (const [descriptor, expected] of TABLE) {
    assert.equal(sourceKey(descriptor), expected, `${descriptor.type} is keyed as the table says`);
  }
});

test("every key the composer produces is a well-formed key — the round trip nothing may break", () => {
  assert.deepEqual(
    TABLE.map(([descriptor]) => isSourceKey(sourceKey(descriptor))),
    TABLE.map(() => true),
  );
});

// 🎯 THE WHOLE POINT. Two brains meet one mail through two connectors: one hands back a
// display name, an offset timezone and a subject with punctuation; the other a bare
// address, UTC, and the same subject in another case. They must land on one string.
test("two spellings of ONE mail, seen by two people, reduce to the same key", () => {
  const mine = sourceKey({
    type: "mail",
    from: "Billing Department <Billing@Example.COM>",
    date: "2026-09-02T18:19:32+02:00",
    subject: "  Your invoice, is ready!  ",
  });

  const theirs = sourceKey({
    type: "mail",
    from: "billing@example.com",
    date: "2026-09-02T16:19:32.000Z",
    subject: "Your Invoice, Is Ready!",
  });

  assert.equal(mine, theirs);
  assert.equal(mine, "mail|billing@example.com|20260902T161932Z|your-invoice-is-ready");
});

test("a sent timestamp is accepted as epoch seconds and as epoch milliseconds, and both name the same instant", () => {
  const asIso = sourceKey({ type: "mail", from: "a@b.com", date: "2026-09-02T16:19:32Z", subject: "x" });

  assert.equal(sourceKey({ type: "mail", from: "a@b.com", date: "1788365972", subject: "x" }), asIso);
  assert.equal(sourceKey({ type: "mail", from: "a@b.com", date: "1788365972000", subject: "x" }), asIso);
  assert.equal(sourceKey({ type: "mail", from: "a@b.com", date: 1788365972000, subject: "x" }), asIso);
});

// 🛑 THE NEGATIVE POLE, and the one ADR 0041 §5 forbids getting wrong: folding the case
// of an OPAQUE identifier invents a collision, and a collision is a false "already held"
// — the silent loss the whole design fails away from. Drive and Notion ids are
// case-sensitive; a subject is not.
test("case is preserved in an opaque id and folded in human text", () => {
  assert.notEqual(
    sourceKey({ type: "drive", file: "1A2b3C" }),
    sourceKey({ type: "drive", file: "1a2b3c" }),
    "two Drive ids differing only in case are two different files",
  );
  assert.equal(
    sourceKey({ type: "mail", from: "a@b.com", date: "2026-09-02T16:19:32Z", subject: "Quarterly Review" }),
    sourceKey({ type: "mail", from: "a@b.com", date: "2026-09-02T16:19:32Z", subject: "quarterly review" }),
    "one subject typed two ways is one subject",
  );
});

// ADR 0041 §7: a thread digested at 8 messages and met again at 20 has the same thread
// and different content, so the identity is the MESSAGE, not the container.
test("two messages in one channel are two keys — a conversation is keyed by its messages", () => {
  const first = sourceKey({ type: "slack", channel: "C0CEQ4R5E", ts: "1725283200.001200" });
  const later = sourceKey({ type: "slack", channel: "C0CEQ4R5E", ts: "1725290000.004500" });

  assert.notEqual(first, later);
  assert.deepEqual([first, later].map(isSourceKey), [true, true]);
});

test("a key never carries a comma, a colon, a bracket or a space, whatever the source spelled", () => {
  const key = sourceKey({
    type: "mail",
    from: "Ops <ops@example.com>",
    date: "2026-09-02T16:19:32Z",
    subject: "[URGENT] Re: budget, Q4 — please read",
  });

  assert.equal(key, "mail|ops@example.com|20260902T161932Z|urgent-re-budget-q4-please-read");
  assert.equal(isSourceKey(key), true);
});

test("an empty or missing subject is a legitimate mail, not a refusal", () => {
  const blank = sourceKey({ type: "mail", from: "a@b.com", date: "2026-09-02T16:19:32Z", subject: "" });

  assert.equal(blank, "mail|a@b.com|20260902T161932Z|-");
  assert.equal(sourceKey({ type: "mail", from: "a@b.com", date: "2026-09-02T16:19:32Z" }), blank);
  assert.equal(isSourceKey(blank), true);
});

// An id is reduced, not rewritten: each RUN of characters a key may not carry becomes
// ONE hyphen, and the hyphens that reduction leaves at the edges go. Spelled out with a
// value that carries several of each, because the failure mode is silent — a reduction
// that collapsed one character at a time, or dropped them instead, would still look
// like a key and would simply be a DIFFERENT one on the other person's machine.
test("an unsafe run inside an opaque id becomes one hyphen, and the edges are trimmed", () => {
  assert.equal(sourceKey({ type: "drive", file: "  1A2b//3C  " }), "drive|1A2b-3C");
});

// Hyphens a source really spelled are kept — `-` is in the safe set. Only the ones the
// reduction itself pushed to the edges go, and there can be several of them.
test("the hyphens an id really carries survive, at every position but the edges", () => {
  assert.equal(sourceKey({ type: "drive", file: "--1A--2b3C--" }), "drive|1A--2b3C");
});

test("a subject's accents are stripped, so one subject typed on two keyboards is one key", () => {
  assert.equal(
    sourceKey({ type: "mail", from: "a@b.com", date: "2026-09-02T16:19:32Z", subject: "Réunion budget" }),
    "mail|a@b.com|20260902T161932Z|reunion-budget",
  );
});

test("an unknown source type is refused loudly, and the refusal names the types that exist", () => {
  // Hand-written, not `SOURCE_TYPES.join(…)`: the point is that the refusal SEPARATES the
  // names it lists, and a list computed the same way the message computes it would agree
  // with a message that ran them all together.
  assert.deepEqual(SOURCE_TYPES, ["slack", "calendar", "drive", "notion", "mail"]);
  assert.throws(
    () => sourceKey({ type: "linkedin", post: "123" }),
    (err) =>
      /linkedin/.test(err.message) &&
      err.message.includes("slack, calendar, drive, notion, mail"),
    "a typo must not quietly disable dedup for a whole source",
  );
});

// A descriptor with no type at all — nothing, or an object that forgot the field — is the
// same mistake as a misspelled one, and must refuse the same way rather than crash.
test("a descriptor that names no type at all is refused as an unknown type, not as a crash", () => {
  const expected =
    'unknown source type "": the sources that carry an identity are slack, calendar, drive, notion, mail.';

  assert.throws(() => sourceKey({}), (err) => err.message === expected);
  assert.throws(() => sourceKey(undefined), (err) => err.message === expected);
});

test("a missing identifier is refused loudly, field by field — there is no key to guess", () => {
  const missing = [
    [{ type: "slack", ts: "1725283200.001200" }, "channel"],
    [{ type: "slack", channel: "C0CEQ4R5E" }, "ts"],
    [{ type: "calendar" }, "event"],
    [{ type: "drive", file: "   " }, "file"],
    [{ type: "notion", page: null }, "page"],
    [{ type: "mail", date: "2026-09-02T16:19:32Z", subject: "x" }, "from"],
    [{ type: "mail", from: "a@b.com", subject: "x" }, "date"],
  ];
  for (const [descriptor, field] of missing) {
    assert.throws(
      () => sourceKey(descriptor),
      (err) =>
        err.message.includes(field) &&
        err.message.includes(descriptor.type) &&
        // The instruction is the load-bearing half: a caller told only "field missing"
        // fills it with a placeholder, and a placeholder keys as a real source.
        err.message.includes("write no key rather than a partial one"),
      `a ${descriptor.type} descriptor without ${field} cannot be keyed`,
    );
  }
});

test("a timestamp that names no instant is refused, rather than keyed as one", () => {
  assert.throws(
    () => sourceKey({ type: "mail", from: "a@b.com", date: "last tuesday", subject: "x" }),
    (err) =>
      err.message.includes("last tuesday") &&
      err.message.includes("date") &&
      // Without the two accepted spellings, the refusal tells a connector author nothing.
      err.message.includes("epoch in seconds or milliseconds"),
  );
});

// 🛑 The epoch shortcuts are matched WHOLE. A longer number that merely ends in thirteen
// digits is not a timestamp, and reading its tail as one would key a real source at a
// wrong instant — two brains would then disagree about a mail they both hold.
test("a number that is not an epoch is refused, not read as the epoch hiding inside it", () => {
  for (const date of ["12345678901234", "017883659720"]) {
    assert.throws(
      () => sourceKey({ type: "mail", from: "a@b.com", date, subject: "x" }),
      (err) => err.message.includes(date),
      `${date} names no instant`,
    );
  }
});

test("isSourceKey accepts only what the composer can produce", () => {
  const rejected = [
    "",
    "mail",
    "mail|",
    "|a|b",
    "mail|a@b.com|2026-09-02T16:19:32Z|x", // a colon: unsafe in a YAML inline list
    "mail|a@b.com|20260902T161932Z|budget, q4", // a comma: splits the list
    "mail|a@b.com|20260902T161932Z|has space",
    "Mail|a@b.com|20260902T161932Z|x", // the type is lowercase by construction
    "mail|a@b.com|20260902T161932Z|[x]",
  ];
  assert.deepEqual(
    rejected.map(isSourceKey),
    rejected.map(() => false),
  );
  assert.equal(isSourceKey("slack|C0CEQ4R5E|1725283200.001200"), true);
});

// 🛑 A regular expression stringifies whatever it is handed, so a one-element ARRAY holding
// a key tests true. Accepting it would let a note claim a source through a shape this
// module never produced — and the writer that renders the frontmatter trusts this answer.
test("isSourceKey answers about a STRING, not about anything that reads like one", () => {
  const notStrings = [["slack|C0CEQ4R5E|1725283200.001200"], null, undefined, 42, { toString: () => "mail|a|b" }];

  assert.deepEqual(
    notStrings.map(isSourceKey),
    notStrings.map(() => false),
  );
});

test("the type is read case-insensitively, because a connector's label is not our vocabulary", () => {
  assert.equal(
    sourceKey({ type: " Slack ", channel: "C0CEQ4R5E", ts: "1725283200.001200" }),
    "slack|C0CEQ4R5E|1725283200.001200",
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// The vault IS the ledger (ADR 0041): "has anyone digested this?" is answered by
// "does any note list it?". These helpers own the frontmatter field's name and
// the two directions it travels — read by the check, written by the producers —
// so the reader and the writer can never drift into two spellings.
// ═══════════════════════════════════════════════════════════════════════════

const MAIL = "mail|billing@example.com|20260902T161932Z|your-invoice-is-ready";
const THREAD = "slack|C0CEQ4R5E|1725283200.001200";

test("the field has ONE name, and both directions use it", () => {
  assert.equal(SOURCES_FIELD, "sources");
});

test("a note's sources are read from an inline list, from a lone key, and from nothing at all", () => {
  assert.deepEqual(noteSources({ sources: [MAIL, ` ${THREAD} `] }), [MAIL, THREAD]);
  assert.deepEqual(noteSources({ sources: MAIL }), [MAIL], "one key needs no list to be one source");
  assert.deepEqual(noteSources({}), [], "a note written before this decision holds no claim, not an empty one");
  assert.deepEqual(noteSources({ sources: "" }), []);
  assert.deepEqual(noteSources({ sources: [] }), []);
  // A note whose frontmatter could not be parsed at all reaches here as nothing. That is
  // UNKNOWN — and UNKNOWN must answer "no claim", never abort the check for every note.
  assert.deepEqual(noteSources(undefined), []);
});

// A source is legitimately listed by SEVERAL notes: the capture that stored it and
// every synthesis that drew on it. The check must name them all, so the caller can
// cite the right one rather than the first one found.
test("every note holding a source is named, and a source nobody holds names nobody", () => {
  const notes = [
    { path: "briefings/2026-09-02.md", frontmatter: { sources: [THREAD, MAIL] } },
    { path: "people/claire-dubois.md", frontmatter: { sources: ["drive|1A2b3C"] } },
    { path: "raw-sources/2026-09-02-invoice.md", frontmatter: { sources: [MAIL] } },
    { path: "daily/2026-09-02.md", frontmatter: {} },
  ];

  assert.deepEqual(notesHoldingSource(notes, MAIL), [
    "briefings/2026-09-02.md",
    "raw-sources/2026-09-02-invoice.md",
  ]);
  assert.deepEqual(notesHoldingSource(notes, "calendar|never-seen"), []);
});

// 🛑 A near-miss must NOT read as a hit: that is the false "already held" of ADR 0041 §5.
test("a key that merely starts like another one is a different source", () => {
  const notes = [{ path: "raw-sources/a.md", frontmatter: { sources: [`${THREAD}extra`] } }];

  assert.deepEqual(notesHoldingSource(notes, THREAD), []);
});

test("the frontmatter line is rendered as an inline list, deduplicated, in the order given", () => {
  assert.equal(renderSourcesField([THREAD, MAIL, THREAD]), `[${THREAD}, ${MAIL}]`);
  assert.equal(renderSourcesField([MAIL]), `[${MAIL}]`);
});

test("rendering refuses a string the composer could not have produced, and says which one", () => {
  assert.throws(
    () => renderSourcesField([MAIL, "the invoice mail from billing"]),
    (err) => err.message.includes("the invoice mail from billing") && err.message.includes(SOURCES_FIELD),
    "a hand-written key never matches anything, so it is a silent no-op rather than a claim",
  );
});
