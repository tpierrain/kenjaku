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

test("the colon really is optional, which is the way most people write the line", () => {
  // `not: globbex` is covered above; this is the same line WITHOUT the colon, and it
  // is a distinct branch of the entry pattern rather than a rephrasing of that test.
  assert.deepEqual(declaredSpellings("## Always true here\n\n- Globex - not globbex\n"), [
    { canonical: "Globex", wrong: ["globbex"] },
  ]);
});

test("the spacing around the dash is the owner's, not a format to get right", () => {
  // Hand-written in Obsidian: extra spaces on either side of the dash are the norm,
  // and each side is a separate `\s+` in the pattern. Both are exercised here, and the
  // canonical comes back with no whitespace clinging to it — which is why the code
  // needs no trim.
  assert.deepEqual(declaredSpellings("## Always true here\n\n- cortAIx  —  never:  Cortex\n"), [
    { canonical: "cortAIx", wrong: ["Cortex"] },
  ]);
});

test("an empty item in the wrong-spelling list is dropped, not carried as a rule", () => {
  // A trailing comma and a doubled one are what hand-editing produces. An empty
  // spelling reaching the matcher would be an alternative that matches the empty
  // string everywhere.
  assert.deepEqual(declaredSpellings("## Always true here\n\n- cortAIx — never: Cortex, , Cortaix,\n"), [
    { canonical: "cortAIx", wrong: ["Cortex", "Cortaix"] },
  ]);
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

test("something that is not text comes back untouched instead of throwing", () => {
  // The caller is a PreToolUse hook reading a tool's input, so the payload is whatever
  // the harness hands it. Nothing here may throw on the write path.
  assert.deepEqual(applyDeclaredSpellings(null, ENTRIES), {
    text: null,
    corrections: [],
    protectedHits: [],
  });
  assert.deepEqual(applyDeclaredSpellings(undefined, ENTRIES).text, undefined);
});

test("a half-written profile entry is skipped, and the sound ones still apply", () => {
  // The list is hand-edited in Obsidian, so an empty spelling, a missing canonical and
  // a canonical that is not text all reach this function eventually. An empty spelling
  // in particular would become an alternative matching the empty string EVERYWHERE.
  // The trailing full stop is load-bearing: an empty alternative only ever matches
  // BETWEEN two non-letters, so it is punctuation and line ends that a `''` rule
  // splatters the canonical name across — never the middle of a sentence.
  const { text, corrections } = applyDeclaredSpellings("Cortex here.", [
    { canonical: "cortAIx", wrong: ["", "Cortex", null] },
    { canonical: 42, wrong: ["Cortaix"] },
    { canonical: "X" },
  ]);
  assert.equal(text, "cortAIx here.");
  assert.deepEqual(corrections, [{ from: "Cortex", to: "cortAIx" }]);
});

test("a spelling containing regex punctuation matches itself, not a pattern", () => {
  // `Cortex (AI)` is exactly the sort of thing an owner types, and its parentheses are
  // a grouping construct unless they are escaped on the way into the matcher.
  const { text, corrections } = applyDeclaredSpellings("Met Cortex (AI) today.", [
    { canonical: "cortAIx", wrong: ["Cortex (AI)"] },
  ]);
  assert.equal(text, "Met cortAIx today.");
  assert.deepEqual(corrections, [{ from: "Cortex (AI)", to: "cortAIx" }]);
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

test("an autolink is an address too", () => {
  const raw = "See <https://x.test/Cortex> and Cortex.";
  const { text, protectedHits } = applyDeclaredSpellings(raw, ENTRIES);
  assert.equal(text, "See <https://x.test/Cortex> and cortAIx.");
  assert.deepEqual(protectedHits, [{ from: "Cortex", to: "cortAIx" }]);
});

test("typographic quotes protect what they enclose, in English and in French", () => {
  // Straight quotes are covered above. These two are what a real vault actually holds:
  // macOS substitutes curly quotes as you type, and French notes use guillemets.
  const curly = applyDeclaredSpellings("She said “Cortex will do” then Cortex left.", ENTRIES);
  assert.equal(curly.text, "She said “Cortex will do” then cortAIx left.");
  const french = applyDeclaredSpellings("Elle a dit «Cortex confirme» puis Cortex partit.", ENTRIES);
  assert.equal(french.text, "Elle a dit «Cortex confirme» puis cortAIx partit.");
});

test("a horizontal rule mid-note is not frontmatter, and its prose IS corrected", () => {
  // Frontmatter is protected because it is machine-read, and only the block at the very
  // top is frontmatter. A `---` divider further down is ordinary Markdown, and treating
  // it as frontmatter would silently exempt the whole rest of the note.
  const { text } = applyDeclaredSpellings("Notes.\n\n---\nCortex is here\n---\n", ENTRIES);
  assert.equal(text, "Notes.\n\n---\ncortAIx is here\n---\n");
});

test("a `>` in the middle of a line is a greater-than sign, not a blockquote", () => {
  const { text } = applyDeclaredSpellings("5 > 3 and Cortex agrees.", ENTRIES);
  assert.equal(text, "5 > 3 and cortAIx agrees.");
});

test("protection stops exactly at the protected span's edges, on both sides", () => {
  // Touching is not overlapping. A spelling that begins where inline code ends — or
  // ends where it begins — is prose, and off-by-one here would silently spare it.
  assert.equal(applyDeclaredSpellings("`Cortex`Cortex here", ENTRIES).text, "`Cortex`cortAIx here");
  assert.equal(applyDeclaredSpellings("Cortex`x`", ENTRIES).text, "cortAIx`x`");
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
