import { test } from "node:test";
import assert from "node:assert/strict";

import { applyDeclaredSpellings, declaredSpellings } from "./declared-spellings.mjs";
import { renderUniverseDigest } from "./universe-profile.mjs";

// The field failure this exists for: a client's name — aXiom — spelled Axion in a
// transcript, Axiom by one colleague, Axion/Globex by another. The owner resolved it
// once and the vault recorded it; a note drafted from a Slack DM brought the wrong
// spelling straight back.
const PROFILE = `---
displayName: Globex
universe: globex
---

# Globex

The AI accelerator account.

## People

- Marie

## Always true here

- aXiom — never: Axion, Axiom, Axion/Globex
- The kickoff was in March, not February.
`;

// ── declaredSpellings — the closed, owner-written list ────────────────────────

test("declaredSpellings reads the canonical spelling and the wrong ones seen", () => {
  assert.deepEqual(declaredSpellings(PROFILE), [
    { canonical: "aXiom", wrong: ["Axion", "Axiom", "Axion/Globex"] },
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
  assert.deepEqual(declaredSpellings("## Always true here\n\n- aXiom  —  never:  Axion\n"), [
    { canonical: "aXiom", wrong: ["Axion"] },
  ]);
});

test("an empty item in the wrong-spelling list is dropped, not carried as a rule", () => {
  // A trailing comma and a doubled one are what hand-editing produces. An empty
  // spelling reaching the matcher would be an alternative that matches the empty
  // string everywhere.
  assert.deepEqual(declaredSpellings("## Always true here\n\n- aXiom — never: Axion, , Axiom,\n"), [
    { canonical: "aXiom", wrong: ["Axion", "Axiom"] },
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
  assert.doesNotMatch(digest, /aXiom|Axiom|Always true here/);
  assert.match(digest, /Marie/); // …while the sections that DO ride still ride
});

// ── applyDeclaredSpellings — the correction itself ────────────────────────────

const ENTRIES = [{ canonical: "aXiom", wrong: ["Axion", "Axiom", "Axion/Globex"] }];

test("a declared wrong spelling is replaced by the declared canonical one", () => {
  const { text, corrections } = applyDeclaredSpellings("Met the Axion team today.", ENTRIES);
  assert.equal(text, "Met the aXiom team today.");
  assert.deepEqual(corrections, [{ from: "Axion", to: "aXiom" }]);
});

test("every declared misspelling is corrected, and each is reported once", () => {
  const { text, corrections } = applyDeclaredSpellings(
    "Axiom asked. Axion answered. Axiom again.",
    ENTRIES,
  );
  assert.equal(text, "aXiom asked. aXiom answered. aXiom again.");
  assert.deepEqual(corrections, [
    { from: "Axiom", to: "aXiom" },
    { from: "Axion", to: "aXiom" },
  ]);
});

test("the longest declared spelling wins, so a compound is not half-corrected", () => {
  const { text } = applyDeclaredSpellings("Axion/Globex signed.", ENTRIES);
  assert.equal(text, "aXiom signed.");
});

test("it matches whatever the case, because a wrong spelling is wrong in any case", () => {
  const { text } = applyDeclaredSpellings("axion shipped.", ENTRIES);
  assert.equal(text, "aXiom shipped.");
});

test("it never corrects INSIDE a longer word", () => {
  const { text, corrections } = applyDeclaredSpellings("The hypothetical axions are fine.", ENTRIES);
  assert.equal(text, "The hypothetical axions are fine.");
  assert.deepEqual(corrections, []);
});

test("text with nothing to correct comes back byte-for-byte, with nothing to report", () => {
  const raw = "A note about nothing in particular.\n";
  const { text, corrections } = applyDeclaredSpellings(raw, ENTRIES);
  assert.equal(text, raw);
  assert.deepEqual(corrections, []);
});

test("no declared entries means no correction at all", () => {
  const raw = "Axion everywhere.";
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
  // `Axiom` is in the text on purpose: its entry declares a canonical that is not a
  // string, and a rule built from it would write `42` into the owner's note.
  const { text, corrections } = applyDeclaredSpellings("Axion and Axiom here.", [
    { canonical: "aXiom", wrong: ["", "Axion", null] },
    { canonical: 42, wrong: ["Axiom"] },
    { canonical: "X" },
  ]);
  assert.equal(text, "aXiom and Axiom here.");
  assert.deepEqual(corrections, [{ from: "Axion", to: "aXiom" }]);
});

test("a spelling containing regex punctuation matches itself, not a pattern", () => {
  // `Axion (AI)` is exactly the sort of thing an owner types, and its parentheses are
  // a grouping construct unless they are escaped on the way into the matcher.
  const { text, corrections } = applyDeclaredSpellings("Met Axion (AI) today.", [
    { canonical: "aXiom", wrong: ["Axion (AI)"] },
  ]);
  assert.equal(text, "Met aXiom today.");
  assert.deepEqual(corrections, [{ from: "Axion (AI)", to: "aXiom" }]);
});

// ── what it must never rewrite: falsifying a record is worse than the typo ────

test("quoted material is what the person actually wrote, so it is left alone", () => {
  const raw = 'Marie wrote: "Axion will confirm", and she meant it.';
  const { text, corrections } = applyDeclaredSpellings(raw, ENTRIES);
  assert.equal(text, raw);
  assert.deepEqual(corrections, []);
});

test("a blockquote is quoted material too", () => {
  const raw = "> Axion confirmed the date.\n\nSo we are on.";
  assert.equal(applyDeclaredSpellings(raw, ENTRIES).text, raw);
});

test("a fenced code block is never touched", () => {
  const raw = "```js\nconst client = 'Axion'\n```\n";
  assert.equal(applyDeclaredSpellings(raw, ENTRIES).text, raw);
});

test("inline code is never touched", () => {
  const raw = "Run `grep Axion` to check.";
  assert.equal(applyDeclaredSpellings(raw, ENTRIES).text, raw);
});

test("a link target is an address, not prose", () => {
  const raw = "See [the deck](https://drive.example/Axion/deck.pdf) for it.";
  assert.equal(applyDeclaredSpellings(raw, ENTRIES).text, raw);
});

test("the link's TEXT is prose, and it is corrected", () => {
  const { text } = applyDeclaredSpellings("See [the Axion deck](https://example.com/d) here.", ENTRIES);
  assert.equal(text, "See [the aXiom deck](https://example.com/d) here.");
});

test("an autolink is an address too", () => {
  const raw = "See <https://x.test/Axion> and Axion.";
  const { text, protectedHits } = applyDeclaredSpellings(raw, ENTRIES);
  assert.equal(text, "See <https://x.test/Axion> and aXiom.");
  assert.deepEqual(protectedHits, [{ from: "Axion", to: "aXiom" }]);
});

test("typographic quotes protect what they enclose, in English and in French", () => {
  // Straight quotes are covered above. These two are what a real vault actually holds:
  // macOS substitutes curly quotes as you type, and French notes use guillemets.
  const curly = applyDeclaredSpellings("She said “Axion will do” then Axion left.", ENTRIES);
  assert.equal(curly.text, "She said “Axion will do” then aXiom left.");
  const french = applyDeclaredSpellings("Elle a dit «Axion confirme» puis Axion partit.", ENTRIES);
  assert.equal(french.text, "Elle a dit «Axion confirme» puis aXiom partit.");
});

test("a horizontal rule mid-note is not frontmatter, and its prose IS corrected", () => {
  // Frontmatter is protected because it is machine-read, and only the block at the very
  // top is frontmatter. A `---` divider further down is ordinary Markdown, and treating
  // it as frontmatter would silently exempt the whole rest of the note.
  const { text } = applyDeclaredSpellings("Notes.\n\n---\nAxion is here\n---\n", ENTRIES);
  assert.equal(text, "Notes.\n\n---\naXiom is here\n---\n");
});

test("a `>` in the middle of a line is a greater-than sign, not a blockquote", () => {
  const { text } = applyDeclaredSpellings("5 > 3 and Axion agrees.", ENTRIES);
  assert.equal(text, "5 > 3 and aXiom agrees.");
});

test("protection stops exactly at the protected span's edges, on both sides", () => {
  // Touching is not overlapping. A spelling that begins where inline code ends — or
  // ends where it begins — is prose, and off-by-one here would silently spare it.
  assert.equal(applyDeclaredSpellings("`Axion`Axion here", ENTRIES).text, "`Axion`aXiom here");
  assert.equal(applyDeclaredSpellings("Axion`x`", ENTRIES).text, "aXiom`x`");
});

test("🔒 frontmatter is machine-read, so it is protected whole", () => {
  // Its values are a universe slug, tags, a path: correcting one changes what the
  // ENGINE does — a universe folder that stops matching its own notes — instead of
  // what the note says. The body below it is prose, and is corrected.
  const raw = "---\nuniverse: axion\ntitle: Axion kickoff\n---\n\nThe Axion kickoff.\n";
  const { text } = applyDeclaredSpellings(raw, ENTRIES);
  assert.equal(text, "---\nuniverse: axion\ntitle: Axion kickoff\n---\n\nThe aXiom kickoff.\n");
});

test("what was protected is REPORTED, so a left-alone spelling is never silent", () => {
  // Otherwise the one case the guard cannot fix is also the one nobody hears about.
  const { corrections, protectedHits } = applyDeclaredSpellings(
    'Marie wrote: "Axion will confirm".',
    ENTRIES,
  );
  assert.deepEqual(corrections, []);
  assert.deepEqual(protectedHits, [{ from: "Axion", to: "aXiom" }]);
});
