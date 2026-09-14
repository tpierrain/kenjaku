// ─────────────────────────────────────────────────────────────────────────────
// link-syntax-agreement.test.mjs — the net for the class of defect #121 belonged
// to, rather than for #121 itself.
//
// TWO files decide what a link is, and they were written from different sources:
// `declared-spellings.mjs` lists the spans it must never rewrite (from Markdown's
// syntax), and `wiki-lint.mjs` knows every `[[…]]` form a note may use (from THIS
// product's own note format, the one `CLAUDE.engine.md` tells notes to write). The
// second knew about `[[…]]`, aliases, anchors and the escaped `\|`; the first did
// not, from its very first line. A declared spelling therefore rewrote the inside
// of a wikilink, which points a note at a file that does not exist.
//
// So this file asserts an AGREEMENT, not an enumeration: whatever the linter reads
// as a link target, the write-time guard leaves untouched. An enumeration can only
// ever prove what someone already thought of; this fails the day either file learns
// a link form the other has not — which is exactly the failure that shipped.
//
// The per-form cases the guard owns (a wikilink is an address, an alias is spared
// whole, an unclosed `[[` swallows nothing) live in `declared-spellings.test.mjs`.
// ─────────────────────────────────────────────────────────────────────────────
import { test } from "node:test";
import assert from "node:assert/strict";

import { applyDeclaredSpellings } from "./declared-spellings.mjs";
import { extractWikiLinks } from "./wiki-lint.mjs";

// The field failure's own data: the misspelling is a substring of the link TARGET,
// which is what makes the guard's word-boundary rule fire inside the address.
const ENTRIES = [{ canonical: "aXiom", wrong: ["Axion"] }];
const TARGET = "axion-migration";

// One of each form `extractWikiLinks` recognises. The name is what a failure prints,
// so it says which link form the two files stopped agreeing on.
const FORMS = [
  { form: "bare", body: `See [[${TARGET}]] for the detail.` },
  { form: "an alias", body: `See [[${TARGET}|the Axion migration]].` },
  { form: "a heading anchor", body: `See [[${TARGET}#Axion decisions]].` },
  {
    // `\|` inside a table cell is not a style choice: a bare `|` closes the cell, so
    // this is the ONLY spelling that keeps the table valid (#73).
    form: "an escaped pipe, the only spelling a table cell allows",
    body: `| Note | Who |\n| --- | --- |\n| [[${TARGET}\\|Axion]] | Marie |\n`,
  },
];

for (const { form, body } of FORMS) {
  test(`the guard never changes what a wikilink points at — ${form}`, () => {
    // The fixture is asserted against a hand-written target first, so the agreement
    // below can never pass by both sides finding nothing.
    assert.deepEqual(extractWikiLinks(body), [TARGET], `the ${form} fixture holds no link`);

    const { text } = applyDeclaredSpellings(body, ENTRIES);

    assert.deepEqual(extractWikiLinks(text), [TARGET]);
  });
}

test("every form at once, with the prose around them corrected — so the rule was live", () => {
  // A guard that corrected nothing would pass every case above. This body proves the
  // declared spelling fired: the prose says Axion before and aXiom after, while all
  // four addresses come through untouched.
  const body = `Axion met us.\n\n${FORMS.map(({ body: one }) => one).join("\n\n")}\n\nAxion signed.\n`;

  const { text, corrections } = applyDeclaredSpellings(body, ENTRIES);

  assert.deepEqual(extractWikiLinks(text), extractWikiLinks(body));
  assert.deepEqual(extractWikiLinks(text), Array(FORMS.length).fill(TARGET));
  assert.deepEqual(corrections, [{ from: "Axion", to: "aXiom" }]);
  assert.ok(text.startsWith("aXiom met us."), `prose was not corrected: ${text.slice(0, 40)}`);
  assert.ok(text.endsWith("aXiom signed.\n"), `prose was not corrected: ${text.slice(-40)}`);
});

test("a wikilink written INSIDE code is left alone by both files alike", () => {
  // `extractWikiLinks` drops links in code (Obsidian does not linkify them), so the
  // agreement above is silent here by construction — both sides see nothing. The
  // span is still asserted literally, because "neither file calls it a link" must
  // mean the bytes survive, not that nobody is looking.
  const body = `Write it as \`[[${TARGET}]]\`, or fenced:\n\n\`\`\`md\n[[${TARGET}#Axion]]\n\`\`\`\n`;

  const { text } = applyDeclaredSpellings(body, ENTRIES);

  assert.deepEqual(extractWikiLinks(body), []);
  assert.equal(text, body);
});
