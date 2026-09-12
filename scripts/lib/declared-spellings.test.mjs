import { test } from "node:test";
import assert from "node:assert/strict";

import { applyDeclaredSpellings, declaredSpellings } from "./declared-spellings.mjs";
import { renderUniverseDigest } from "./universe-profile.mjs";

// The field failure this exists for: a client's name — cortAIx — spelled Cortex in a
// transcript, Cortaix by one colleague, Cortex/Thales by another. The owner resolved it
// once and the vault recorded it; a note drafted from a Slack DM brought the wrong
// spelling straight back.
const PROFILE = `---
displayName: Thales
universe: thales
---

# Thales

The AI accelerator account.

## People

- Marie

## Always true here

- cortAIx — never: Cortex, Cortaix, Cortex/Thales
- The kickoff was in March, not February.
`;

// ── declaredSpellings — the closed, owner-written list ────────────────────────

test("declaredSpellings reads the canonical spelling and the wrong ones seen", () => {
  assert.deepEqual(declaredSpellings(PROFILE), [
    { canonical: "cortAIx", wrong: ["Cortex", "Cortaix", "Cortex/Thales"] },
  ]);
});

test("a plain fact in the same section is left alone, not turned into a rule", () => {
  // `## Always true here` holds facts; only the ones written in the correctable form
  // are acted on. That is why the heading is not `## Proper names`: a glossary is the
  // second CLAUDE.md this feature exists to prevent.
  const entries = declaredSpellings(PROFILE);
  assert.equal(entries.length, 1);
});

test("declaredSpellings accepts `not:` and a plain hyphen, which is how people write", () => {
  const raw = "## Always true here\n\n- Globex - not: globbex, Glowbex\n";
  assert.deepEqual(declaredSpellings(raw), [{ canonical: "Globex", wrong: ["globbex", "Glowbex"] }]);
});

test("a profile with no such section declares nothing", () => {
  assert.deepEqual(declaredSpellings("# Acme\n\n## People\n\n- Marie\n"), []);
});

test("declaredSpellings survives an empty or absent profile rather than throwing", () => {
  assert.deepEqual(declaredSpellings(""), []);
  assert.deepEqual(declaredSpellings(null), []);
});

test("🔒 a declared spelling NEVER reaches the session-start digest", () => {
  // ADR 0035 §2 / finding F1: a SessionStart hook's context is echoed verbatim, before
  // the owner has typed a word — in every screenshot, screen share and transcript. The
  // worked example here is a client's identity, so this section staying out of the
  // digest IS the safety invariant of ADR 0044, not a rendering detail.
  const digest = renderUniverseDigest(PROFILE);
  assert.doesNotMatch(digest, /cortAIx|Cortaix|Always true here/);
  assert.match(digest, /Marie/); // …while the sections that DO ride still ride
});

// ── applyDeclaredSpellings — the correction itself ────────────────────────────

const ENTRIES = [{ canonical: "cortAIx", wrong: ["Cortex", "Cortaix", "Cortex/Thales"] }];

test("a declared wrong spelling is replaced by the declared canonical one", () => {
  const { text, corrections } = applyDeclaredSpellings("Met the Cortex team today.", ENTRIES);
  assert.equal(text, "Met the cortAIx team today.");
  assert.deepEqual(corrections, [{ from: "Cortex", to: "cortAIx" }]);
});

test("every declared misspelling is corrected, and each is reported once", () => {
  const { text, corrections } = applyDeclaredSpellings(
    "Cortaix asked. Cortex answered. Cortaix again.",
    ENTRIES,
  );
  assert.equal(text, "cortAIx asked. cortAIx answered. cortAIx again.");
  assert.deepEqual(corrections, [
    { from: "Cortaix", to: "cortAIx" },
    { from: "Cortex", to: "cortAIx" },
  ]);
});

test("the longest declared spelling wins, so a compound is not half-corrected", () => {
  const { text } = applyDeclaredSpellings("Cortex/Thales signed.", ENTRIES);
  assert.equal(text, "cortAIx signed.");
});

test("it matches whatever the case, because a wrong spelling is wrong in any case", () => {
  const { text } = applyDeclaredSpellings("cortex shipped.", ENTRIES);
  assert.equal(text, "cortAIx shipped.");
});

test("it never corrects INSIDE a longer word", () => {
  const { text, corrections } = applyDeclaredSpellings("The cerebral cortexes are fine.", ENTRIES);
  assert.equal(text, "The cerebral cortexes are fine.");
  assert.deepEqual(corrections, []);
});

test("text with nothing to correct comes back byte-for-byte, with nothing to report", () => {
  const raw = "A note about nothing in particular.\n";
  const { text, corrections } = applyDeclaredSpellings(raw, ENTRIES);
  assert.equal(text, raw);
  assert.deepEqual(corrections, []);
});

test("no declared entries means no correction at all", () => {
  const raw = "Cortex everywhere.";
  assert.deepEqual(applyDeclaredSpellings(raw, []), { text: raw, corrections: [], protectedHits: [] });
});

// ── what it must never rewrite: falsifying a record is worse than the typo ────

test("quoted material is what the person actually wrote, so it is left alone", () => {
  const raw = 'Marie wrote: "Cortex will confirm", and she meant it.';
  const { text, corrections } = applyDeclaredSpellings(raw, ENTRIES);
  assert.equal(text, raw);
  assert.deepEqual(corrections, []);
});

test("a blockquote is quoted material too", () => {
  const raw = "> Cortex confirmed the date.\n\nSo we are on.";
  assert.equal(applyDeclaredSpellings(raw, ENTRIES).text, raw);
});

test("a fenced code block is never touched", () => {
  const raw = "```js\nconst client = 'Cortex'\n```\n";
  assert.equal(applyDeclaredSpellings(raw, ENTRIES).text, raw);
});

test("inline code is never touched", () => {
  const raw = "Run `grep Cortex` to check.";
  assert.equal(applyDeclaredSpellings(raw, ENTRIES).text, raw);
});

test("a link target is an address, not prose", () => {
  const raw = "See [the deck](https://drive.example/Cortex/deck.pdf) for it.";
  assert.equal(applyDeclaredSpellings(raw, ENTRIES).text, raw);
});

test("the link's TEXT is prose, and it is corrected", () => {
  const { text } = applyDeclaredSpellings("See [the Cortex deck](https://example.com/d) here.", ENTRIES);
  assert.equal(text, "See [the cortAIx deck](https://example.com/d) here.");
});

test("🔒 frontmatter is machine-read, so it is protected whole", () => {
  // Its values are a universe slug, tags, a path: correcting one changes what the
  // ENGINE does — a universe folder that stops matching its own notes — instead of
  // what the note says. The body below it is prose, and is corrected.
  const raw = "---\nuniverse: cortex\ntitle: Cortex kickoff\n---\n\nThe Cortex kickoff.\n";
  const { text } = applyDeclaredSpellings(raw, ENTRIES);
  assert.equal(text, "---\nuniverse: cortex\ntitle: Cortex kickoff\n---\n\nThe cortAIx kickoff.\n");
});

test("what was protected is REPORTED, so a left-alone spelling is never silent", () => {
  // Otherwise the one case the guard cannot fix is also the one nobody hears about.
  const { corrections, protectedHits } = applyDeclaredSpellings(
    'Marie wrote: "Cortex will confirm".',
    ENTRIES,
  );
  assert.deepEqual(corrections, []);
  assert.deepEqual(protectedHits, [{ from: "Cortex", to: "cortAIx" }]);
});
