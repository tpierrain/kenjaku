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

import { isSourceKey, sourceKey, SOURCE_TYPES } from "./source-key.mjs";

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

test("an unknown source type is refused loudly, and the refusal names the types that exist", () => {
  assert.throws(
    () => sourceKey({ type: "linkedin", post: "123" }),
    (err) =>
      /linkedin/.test(err.message) && SOURCE_TYPES.every((t) => err.message.includes(t)),
    "a typo must not quietly disable dedup for a whole source",
  );
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
      (err) => err.message.includes(field) && err.message.includes(descriptor.type),
      `a ${descriptor.type} descriptor without ${field} cannot be keyed`,
    );
  }
});

test("a timestamp that names no instant is refused, rather than keyed as one", () => {
  assert.throws(
    () => sourceKey({ type: "mail", from: "a@b.com", date: "last tuesday", subject: "x" }),
    (err) => err.message.includes("last tuesday") && err.message.includes("date"),
  );
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

test("the type is read case-insensitively, because a connector's label is not our vocabulary", () => {
  assert.equal(
    sourceKey({ type: " Slack ", channel: "C0CEQ4R5E", ts: "1725283200.001200" }),
    "slack|C0CEQ4R5E|1725283200.001200",
  );
});
