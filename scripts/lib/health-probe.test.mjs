import { test } from "node:test";
import assert from "node:assert/strict";
import { formatHealthBanner } from "./health-probe.mjs";

// ── formatHealthBanner — the cached-health reader's pure formatter (ADR 0028 §1).
// Quiet when healthy (all ok / only unknown → null), one loud banner when broken.

test("formatHealthBanner — all capabilities ok → null (quiet when healthy)", () => {
  const banner = formatHealthBanner([
    { capability: "rag", status: "ok" },
    { capability: "index", status: "ok" },
    { capability: "embedder", status: "ok" },
    { capability: "mcp", status: "ok" },
  ]);
  assert.equal(banner, null);
});

test("formatHealthBanner — a broken capability → one loud banner naming it", () => {
  const banner = formatHealthBanner([
    { capability: "rag", status: "ok" },
    { capability: "mcp", status: "broken", detail: "unreachable: local-mirror" },
  ]);
  // The legacy cache shape: a module with no structured `checks` at all. It cannot name a
  // cause, so it falls back to its own detail and a restart hint.
  assert.equal(
    banner,
    "⚠️ Last health-check found a problem with your brain:\n" +
      "   • mcp (unreachable: local-mirror) → restart the brain.\n" +
      "   Your notes themselves are untouched.",
  );
});

test("formatHealthBanner — only unknown (no broken) stays quiet → null", () => {
  const banner = formatHealthBanner([
    { capability: "rag", status: "ok" },
    { capability: "embedder", status: "unknown", detail: "api key not configured" },
    { capability: "mcp", status: "unknown", detail: "probe error: boom" },
  ]);
  assert.equal(banner, null);
});

// ── Per-module, actionable, layered messages (ADR 0030 F7-ter, baby-step 5).
// The banner must name the SPECIFIC cause and the RIGHT gesture per broken check —
// never the old generic "restart + /update-engine" catch-all.

test("formatHealthBanner — core vault-rag, index empty → names the cause + the reindex gesture, NOT /update-engine", () => {
  const banner = formatHealthBanner([
    {
      capability: "vault-rag",
      status: "broken",
      checks: [{ name: "index", status: "broken", detail: "index empty" }],
    },
  ]);
  // Asserted whole: the reassurance line, the indentation and the section boundary are
  // as much a part of this banner as the cause is, and a fragment match lets the core
  // module leak into the optional "a source is behind" section without a word changing.
  assert.equal(
    banner,
    "⚠️ Last health-check found a problem with your brain:\n" +
      "   • index empty → ask me to reindex your vault.\n" +
      "   Your notes themselves are untouched.",
  );
  assert.doesNotMatch(banner, /update-engine/, "no generic /update-engine remedy");
});

test("formatHealthBanner — optional local-mirror broken → soft 'a source behind' tone, NOT a scary core alarm", () => {
  const banner = formatHealthBanner([
    {
      capability: "local-mirror",
      status: "broken",
      checks: [{ name: "store", status: "broken", detail: "mirror store unreachable: ENOENT" }],
    },
  ]);
  assert.equal(
    banner,
    "ℹ️ A mirrored source is behind (your brain still answers):\n" +
      "   • mirror store unreachable: ENOENT → check the mirror's path, or refresh it.",
  );
  assert.doesNotMatch(banner, /⚠️/, "an optional source behind is not a core ⚠️ alarm");
});

test("formatHealthBanner — embedder in-process weights missing → re-download gesture (not a generic restart)", () => {
  const banner = formatHealthBanner([
    {
      capability: "vault-rag",
      status: "broken",
      checks: [{ name: "embedder", status: "broken", detail: "in-process weights missing" }],
    },
  ]);
  assert.equal(
    banner,
    "⚠️ Last health-check found a problem with your brain:\n" +
      "   • in-process weights missing → ask me to reindex your vault — the local model " +
      "re-downloads on first use.\n" +
      "   Your notes themselves are untouched.",
  );
});

test("formatHealthBanner — core AND optional broken → both sections, each with its own tone", () => {
  const banner = formatHealthBanner([
    {
      capability: "vault-rag",
      status: "broken",
      checks: [{ name: "index", status: "broken", detail: "index empty" }],
    },
    {
      capability: "local-mirror",
      status: "broken",
      checks: [{ name: "store", status: "broken", detail: "mirror store unreachable: ENOENT" }],
    },
  ]);
  // Both sections, in order, each holding ONLY its own module: the severity split is the
  // point of this function, and it is invisible to a match that merely finds both causes
  // somewhere in the string.
  assert.equal(
    banner,
    "⚠️ Last health-check found a problem with your brain:\n" +
      "   • index empty → ask me to reindex your vault.\n" +
      "   Your notes themselves are untouched.\n" +
      "ℹ️ A mirrored source is behind (your brain still answers):\n" +
      "   • mirror store unreachable: ENOENT → check the mirror's path, or refresh it.",
  );
});

test("formatHealthBanner — a note the engine cannot bring in step → the repair gesture, not a restart", () => {
  // F15: the note is NAMED and the gesture is to repair it. "restart the brain" (the
  // default gesture) would be actively wrong here — nothing about a session restart
  // fixes a frontmatter the parser refuses.
  const banner = formatHealthBanner([
    {
      capability: "vault-rag",
      status: "broken",
      checks: [
        {
          name: "notes",
          status: "broken",
          detail:
            '1 note the engine cannot bring in step — topics/crise.md: damaged front-matter key "updated"',
        },
      ],
    },
  ]);
  assert.equal(
    banner,
    "⚠️ Last health-check found a problem with your brain:\n" +
      '   • 1 note the engine cannot bring in step — topics/crise.md: damaged front-matter ' +
      'key "updated" → ask me to repair that note.\n' +
      "   Your notes themselves are untouched.",
  );
  assert.doesNotMatch(banner, /restart the brain/, "a restart fixes nothing here");
});

// The canary shares the reindex gesture with the index — and shares nothing else, so it
// needs its own case: it is the check that proves the brain answers FROM the vault, and
// nothing else in this suite ever reaches its branch.
test("formatHealthBanner — the canary is a reindex gesture too, not a restart", () => {
  const banner = formatHealthBanner([
    {
      capability: "vault-rag",
      status: "broken",
      checks: [{ name: "canary", status: "broken", detail: "canary not retrieved from the vault" }],
    },
  ]);

  assert.equal(
    banner,
    "⚠️ Last health-check found a problem with your brain:\n" +
      "   • canary not retrieved from the vault → ask me to reindex your vault.\n" +
      "   Your notes themselves are untouched.",
  );
});

// The embedder's OTHER branch. The suite only ever fed it the in-process weights case, so
// the network/key gesture — the one an API user actually gets — could be emptied and stay
// green.
test("formatHealthBanner — an embedder that is not about weights points at network + key", () => {
  const banner = formatHealthBanner([
    {
      capability: "vault-rag",
      status: "broken",
      checks: [{ name: "embedder", status: "broken", detail: "embedding request refused (401)" }],
    },
  ]);

  assert.equal(
    banner,
    "⚠️ Last health-check found a problem with your brain:\n" +
      "   • embedding request refused (401) → check your network and the API key in your .env.\n" +
      "   Your notes themselves are untouched.",
  );
});

// A check name this formatter has never heard of. The fallback gesture is the one thing
// that must not be empty: an unknown cause with no suggested move is a line that tells the
// owner something is wrong and nothing to do about it.
test("formatHealthBanner — an unknown check name still gets a gesture, not an empty one", () => {
  const banner = formatHealthBanner([
    {
      capability: "vault-rag",
      status: "broken",
      checks: [{ name: "quantum-flux", status: "broken", detail: "something we never named" }],
    },
  ]);

  assert.equal(
    banner,
    "⚠️ Last health-check found a problem with your brain:\n" +
      "   • something we never named → restart the brain.\n" +
      "   Your notes themselves are untouched.",
  );
});

// A module is broken when ONE of its checks is: the healthy siblings must not be listed as
// causes. Two decoys on purpose (one `ok`, one `unknown`), unsorted — with a single check
// in the array, "filter the failing ones" and "list them all" are the same function.
//
// ⚠️ This test PINS a known defect, it does not bless it: the `unknown` check is listed
// under "found a problem", i.e. "we could not tell" is rendered as "it is broken" — the
// finding already recorded for v4.7.0 (field-findings-2026-08-02-action.md, F14's second
// field run). When that ships, this expectation changes on purpose.
test("formatHealthBanner — a module's healthy checks are not reported as causes", () => {
  const banner = formatHealthBanner([
    {
      capability: "vault-rag",
      status: "broken",
      checks: [
        { name: "embedder", status: "ok", detail: "in-process, ready" },
        { name: "index", status: "broken", detail: "index empty" },
        { name: "notes", status: "unknown", detail: "crosscheck could not run" },
      ],
    },
  ]);

  assert.equal(
    banner,
    "⚠️ Last health-check found a problem with your brain:\n" +
      "   • index empty → ask me to reindex your vault.\n" +
      "   • crosscheck could not run → ask me to repair that note.\n" +
      "   Your notes themselves are untouched.",
  );
});

// The twin of the legacy shape above, with the detail missing too. Feeding only the case
// where a detail EXISTS leaves "fall back to the status" indistinguishable from "and it
// with the status" — and the parenthesis would read `(false)` on a real brain.
test("formatHealthBanner — a legacy module with no detail falls back to its status", () => {
  const banner = formatHealthBanner([{ capability: "mcp", status: "broken" }]);

  assert.equal(
    banner,
    "⚠️ Last health-check found a problem with your brain:\n" +
      "   • mcp (broken) → restart the brain.\n" +
      "   Your notes themselves are untouched.",
  );
});
