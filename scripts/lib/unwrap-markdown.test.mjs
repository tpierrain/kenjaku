import { test } from "node:test";
import assert from "node:assert/strict";

import { unwrapMarkdown } from "./unwrap-markdown.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// unwrap-markdown — the deterministic net behind the engine constitution's
// "never insert a line break the content does not require" rule (#95).
//
// The whole difficulty is the SECOND half: a rewriter that joins everything is
// worse than none at all, because it silently destroys the breaks that DO carry
// meaning (a table row, a list item, a fenced block, a YAML key). So most of the
// batch below asserts what must be left ALONE, and each such case names the
// thing that would be corrupted if the join fired there.
//
// Assertions are on the WHOLE document rather than on a substring: a joiner that
// gets one line right and drops another would satisfy a `includes()` check.
// ═══════════════════════════════════════════════════════════════════════════

test("two hard-wrapped prose lines become one, with a single space at the seam", () => {
  const wrapped = ["A paragraph that was cut by an editor at some column,", "and whose rest landed here."].join("\n");
  assert.equal(unwrapMarkdown(wrapped), "A paragraph that was cut by an editor at some column, and whose rest landed here.");
});

test("a run of FOUR wrapped lines collapses to one, not just the first pair", () => {
  const wrapped = ["one", "two", "three", "four"].join("\n");
  assert.equal(unwrapMarkdown(wrapped), "one two three four");
});

test("the seam is exactly one space, whatever indentation the continuation carried", () => {
  assert.equal(unwrapMarkdown("first    \nsecond"), "first    \nsecond", "two trailing spaces are a hard break — untouched");
  assert.equal(unwrapMarkdown("first\n      second"), "first second");
});

test("a blank line separates two paragraphs, and both survive as their own line", () => {
  const doc = ["para one cut", "here.", "", "para two cut", "here too."].join("\n");
  assert.equal(unwrapMarkdown(doc), ["para one cut here.", "", "para two cut here too."].join("\n"));
});

test("several blank lines in a row are preserved exactly as spelled", () => {
  assert.equal(unwrapMarkdown("a\n\n\n\nb"), "a\n\n\n\nb");
});

test("a heading neither absorbs the line after it nor is absorbed by the line before", () => {
  const doc = ["trailing prose", "## A heading", "prose under it", "wrapped on."].join("\n");
  assert.equal(unwrapMarkdown(doc), ["trailing prose", "## A heading", "prose under it wrapped on."].join("\n"));
});

test("every heading level from # to ###### is protected, and a seventh # is prose", () => {
  for (const hashes of ["#", "##", "###", "####", "#####", "######"]) {
    assert.equal(unwrapMarkdown(`${hashes} Title\nbody`), `${hashes} Title\nbody`, `${hashes} must not absorb the next line`);
  }
  assert.equal(unwrapMarkdown("####### seven hashes\nbody"), "####### seven hashes body", "seven hashes is not a heading, it is prose");
});

test("a fenced code block is preserved verbatim — its line breaks ARE its content", () => {
  const doc = ["intro", "```js", "const a = 1;", "const b = 2;", "", "return a + b;", "```", "outro cut", "here."].join("\n");
  assert.equal(
    unwrapMarkdown(doc),
    ["intro", "```js", "const a = 1;", "const b = 2;", "", "return a + b;", "```", "outro cut here."].join("\n"),
  );
});

test("a tilde fence protects its body just as a backtick fence does", () => {
  const doc = ["~~~", "line one", "line two", "~~~"].join("\n");
  assert.equal(unwrapMarkdown(doc), doc);
});

test("YAML frontmatter is preserved verbatim — joining two keys would destroy the note's metadata", () => {
  const doc = ["---", "type: topic", "created: 2026-09-11", "tags: [a, b]", "---", "body cut", "here."].join("\n");
  assert.equal(unwrapMarkdown(doc), ["---", "type: topic", "created: 2026-09-11", "tags: [a, b]", "---", "body cut here."].join("\n"));
});

test("a `---` that is NOT on the first line is a horizontal rule, and stays on its own line", () => {
  const doc = ["prose", "", "---", "", "more prose"].join("\n");
  assert.equal(unwrapMarkdown(doc), doc);
});

test("a horizontal rule written with asterisks or underscores is protected too", () => {
  for (const rule of ["***", "___", "-----"]) {
    assert.equal(unwrapMarkdown(`a\n\n${rule}\n\nb`), `a\n\n${rule}\n\nb`, `${rule} is a rule, not prose`);
  }
});

test("a table keeps one row per line — a joined table stops being a table at all", () => {
  const doc = ["| Slot | Who |", "|---|---|", "| 09:00 | JDO |", "| 10:00 | ABC |"].join("\n");
  assert.equal(unwrapMarkdown(doc), doc);
});

test("prose immediately after a table's last row is not sucked into that row", () => {
  const doc = ["| a | b |", "|---|---|", "| 1 | 2 |", "prose cut", "here."].join("\n");
  assert.equal(unwrapMarkdown(doc), ["| a | b |", "|---|---|", "| 1 | 2 |", "prose cut here."].join("\n"));
});

test("a list item absorbs its own continuation but never the next item", () => {
  const doc = ["- first item cut", "  in the middle", "- second item cut", "  in the middle too"].join("\n");
  assert.equal(unwrapMarkdown(doc), ["- first item cut in the middle", "- second item cut in the middle too"].join("\n"));
});

test("every bullet marker and both ordered forms start their own item", () => {
  for (const marker of ["-", "*", "+", "1.", "2)"]) {
    const doc = [`${marker} one`, `${marker} two`].join("\n");
    assert.equal(unwrapMarkdown(doc), doc, `${marker} must start a new item, not continue the previous one`);
  }
});

test("a blockquote joins its own continuation, and the `>` prefix is not duplicated at the seam", () => {
  const doc = ["> a quoted line cut", "> and continued here"].join("\n");
  assert.equal(unwrapMarkdown(doc), "> a quoted line cut and continued here");
});

test("two blockquote depths never merge — a nested quote is a different block", () => {
  const doc = ["> outer line", ">> inner line", "> outer again"].join("\n");
  assert.equal(unwrapMarkdown(doc), doc);
});

test("a quoted line and an unquoted one never merge in either direction", () => {
  assert.equal(unwrapMarkdown("> quoted\nplain"), "> quoted\nplain");
  assert.equal(unwrapMarkdown("plain\n> quoted"), "plain\n> quoted");
});

test("an explicit hard break is intentional and survives — both spellings", () => {
  assert.equal(unwrapMarkdown("line one  \nline two"), "line one  \nline two", "two trailing spaces are Markdown's hard break");
  assert.equal(unwrapMarkdown("line one\\\nline two"), "line one\\\nline two", "a trailing backslash is the other spelling");
});

test("an HTML line is left where it is", () => {
  const doc = ["<div>", "prose inside", "</div>"].join("\n");
  assert.equal(unwrapMarkdown(doc), doc);
});

test("a trailing newline is preserved, and an absent one is not invented", () => {
  assert.equal(unwrapMarkdown("a cut\nline\n"), "a cut line\n");
  assert.equal(unwrapMarkdown("a cut\nline"), "a cut line");
});

test("a CRLF document is rewritten with CRLF, not with a stray CR left mid-line", () => {
  // Windows reality (CONVENTIONS §9): a note read on Windows arrives CRLF. Splitting on
  // "\n" alone leaves the "\r" glued to the end of each line, so the join buries a carriage
  // return INSIDE the paragraph — invisible on macOS, corrupt everywhere.
  assert.equal(unwrapMarkdown("a cut\r\nline\r\n\r\nnext"), "a cut line\r\n\r\nnext");
  assert.ok(!unwrapMarkdown("a cut\r\nline").includes("\r "), "no carriage return may survive inside a joined line");
});

test("running it twice changes nothing the first pass did not already change", () => {
  const doc = ["---", "type: topic", "---", "", "# Title", "", "a cut", "paragraph", "", "- an item cut", "  in two", "", "| a |", "|---|", "| 1 |"].join("\n");
  const once = unwrapMarkdown(doc);
  assert.equal(unwrapMarkdown(once), once, "the rewriter must be idempotent, or it fights the file every run");
  assert.equal(once, ["---", "type: topic", "---", "", "# Title", "", "a cut paragraph", "", "- an item cut in two", "", "| a |", "|---|", "| 1 |"].join("\n"));
});

test("an already-unwrapped document comes back byte-identical", () => {
  const doc = ["# Title", "", "One long single-line paragraph that nobody ever cut.", "", "- one item", "- another item"].join("\n");
  assert.equal(unwrapMarkdown(doc), doc);
});

test("an empty document and a single blank line survive untouched", () => {
  assert.equal(unwrapMarkdown(""), "");
  assert.equal(unwrapMarkdown("\n"), "\n");
});

// ═══════════════════════════════════════════════════════════════════════════
// THE BOUNDARIES, added after the first mutation run (81.45 %, 23 survivors).
//
// These add no production code and were not expected to go red: they pin the
// EDGES of each refusal, which is precisely what a happy-path batch leaves
// unmeasured. Every one of them corresponds to a mutant that lived — an anchor
// dropped, a quantifier loosened, a `.trim()` removed — and each of those is a
// real defect on a real document, not a theoretical one. A checker that protects
// an indented table but not a table, or that treats a paragraph mentioning a pipe
// as a table row, corrupts a file just as thoroughly as no checker at all.
// ═══════════════════════════════════════════════════════════════════════════

test("a horizontal rule needs THREE of its character, not one: a lone -, * or _ is prose", () => {
  for (const char of ["-", "*", "_"]) {
    assert.equal(unwrapMarkdown(`a\n${char}\nb`), `a ${char} b`, `a lone ${char} is not a rule`);
  }
});

test("a rule is the WHOLE line: dashes followed by text are prose, and text followed by stars too", () => {
  assert.equal(unwrapMarkdown("prose\n--- not a rule\nstill prose"), "prose --- not a rule still prose");
  assert.equal(unwrapMarkdown("bold ***\nnext line"), "bold *** next line");
});

test("a fence opens only at the START of a line — a paragraph that merely mentions ``` is still a paragraph", () => {
  assert.equal(unwrapMarkdown("use ``` to open a block\nand it keeps going"), "use ``` to open a block and it keeps going");
});

test("an INDENTED fence still protects its body — indentation is how a fence nests inside a list", () => {
  const doc = ["prose", "", "  ```", "  code one", "  code two", "  ```"].join("\n");
  assert.equal(unwrapMarkdown(doc), doc);
});

test("an INDENTED table row is still a table row", () => {
  const doc = ["  | a | b |", "  |---|---|", "  | 1 | 2 |"].join("\n");
  assert.equal(unwrapMarkdown(doc), doc);
});

test("a pipe in the MIDDLE of a sentence does not make that sentence a table row", () => {
  assert.equal(unwrapMarkdown("a || b appears in prose\nand the sentence goes on"), "a || b appears in prose and the sentence goes on");
});

test("an INDENTED html block is still an html block", () => {
  const doc = ["prose", "", "  <div>", "  inner", "  </div>"].join("\n");
  assert.equal(unwrapMarkdown(doc), doc);
});

test("a `<` in the middle of a sentence does not make that sentence html", () => {
  assert.equal(unwrapMarkdown("a < b holds here\nand the sentence goes on"), "a < b holds here and the sentence goes on");
});

test("a TWO-DIGIT ordered item starts its own item — a list does not collapse at ten", () => {
  const doc = ["10. ten", "11. eleven"].join("\n");
  assert.equal(unwrapMarkdown(doc), doc);
});

test("a dash inside a sentence is not a list marker: only the start of the line can be one", () => {
  assert.equal(unwrapMarkdown("a paragraph\nwith - a dash inside it"), "a paragraph with - a dash inside it");
});

test("an INDENTED list item is a NESTED item, not a continuation of its parent", () => {
  const doc = ["- parent item", "  - nested item"].join("\n");
  assert.equal(unwrapMarkdown(doc), doc);
});

test("an INDENTED heading is still a heading, and does not get pulled into the paragraph above", () => {
  const doc = ["prose", "  ## A heading"].join("\n");
  assert.equal(unwrapMarkdown(doc), doc);
});

test("a hard break is TRAILING: two spaces in the middle of a line are just two spaces", () => {
  assert.equal(unwrapMarkdown("a  b\nc"), "a  b c");
});

test("a hard break is TWO trailing spaces: one is not enough, and the seam stays a single space", () => {
  // This is also the only reachable input for the trailing-whitespace strip: anything
  // with two trailing whitespace characters is already a hard break and never joins.
  assert.equal(unwrapMarkdown("first \nsecond"), "first second");
});

test("frontmatter delimiters tolerate trailing whitespace — opening and closing alike", () => {
  const opening = ["--- ", "type: topic", "created: 2026-09-11", "---", "body"].join("\n");
  assert.equal(unwrapMarkdown(opening), opening, "a trailing space on the OPENING --- must not turn the keys into prose");
  const closing = ["---", "type: topic", "created: 2026-09-11", "--- ", "body cut", "here"].join("\n");
  assert.equal(
    unwrapMarkdown(closing),
    ["---", "type: topic", "created: 2026-09-11", "--- ", "body cut here"].join("\n"),
    "a trailing space on the CLOSING --- must not leave the whole document inside frontmatter",
  );
});
