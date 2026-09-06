// ─────────────────────────────────────────────────────────────────────────────
// gitignore-entry.test.mjs — the ONE way the engine adds a line to somebody else's
// `.gitignore`.
//
// A brain's `.gitignore` is carried by no engine regime, so every engine-owned path
// that must stay out of the repo needs a surgical migration on the update AND the
// self-heal path. That had been written once, for `.engine-base/.claude/settings.json`
// (F4). The live sync between machines needs a second one, and a third would have been
// the moment the subtle half — deciding whether a line ALREADY covers the path — drifts
// between two copies. So it is one function, and this file is where it is judged.
//
// `ignore-base-settings.test.mjs` keeps its own suite: it pins the F4 entry's contract
// through this function, and it is the non-regression proof of the extraction.
// ─────────────────────────────────────────────────────────────────────────────
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { ensureIgnored } from "./gitignore-entry.mjs";
import { TRACE_IGNORE_COMMENT, TRACE_REL } from "./remote-sync.mjs";

const OWNERS = "# my own rules\nnotes-drafts/\n*.bak\n";
const ARRIVALS = { entry: TRACE_REL, comment: TRACE_IGNORE_COMMENT };
const OTHER = { entry: "some/other/path.json", comment: "# because reasons" };

test("the entry and its reason are appended whole, one blank line below the owner's last line", () => {
  const { text, changed } = ensureIgnored({ text: OWNERS, ...ARRIVALS });

  assert.equal(changed, true);
  assert.equal(text, `${OWNERS}\n${TRACE_IGNORE_COMMENT}\n${TRACE_REL}\n`);
});

test("a second run returns the SAME string, byte for byte: a converged brain sees no churn", () => {
  const once = ensureIgnored({ text: OWNERS, ...ARRIVALS }).text;

  const twice = ensureIgnored({ text: once, ...ARRIVALS });

  assert.equal(twice.changed, false);
  assert.equal(twice.text, once);
});

test("it carries no entry of its own: whatever it is asked to ignore is what lands", () => {
  const { text } = ensureIgnored({ text: OWNERS, ...OTHER });

  assert.equal(text, `${OWNERS}\n# because reasons\nsome/other/path.json\n`);
  assert.equal(ensureIgnored({ text, ...ARRIVALS }).changed, true, "one entry present says nothing about another");
});

test("an empty file gains the block with no leading blank line, and a file with no final newline is not welded to", () => {
  assert.equal(ensureIgnored({ text: "", ...ARRIVALS }).text, `${TRACE_IGNORE_COMMENT}\n${TRACE_REL}\n`);
  assert.equal(
    ensureIgnored({ text: ".env", ...ARRIVALS }).text,
    `.env\n\n${TRACE_IGNORE_COMMENT}\n${TRACE_REL}\n`,
    "their last entry must stay an entry git still matches",
  );
});

test("a CRLF file stays a CRLF file: we add lines, we never rewrite theirs", () => {
  const { text } = ensureIgnored({ text: "# mine\r\n.env\r\n", ...ARRIVALS });

  assert.equal(text, `# mine\r\n.env\r\n\r\n${TRACE_IGNORE_COMMENT}\r\n${TRACE_REL}\r\n`);
  assert.equal(ensureIgnored({ text, ...ARRIVALS }).changed, false, "and it recognises its own CRLF line next time");
});

test("the spellings that already cover the path are recognised, whoever wrote them", () => {
  for (const spelling of [TRACE_REL, `/${TRACE_REL}`, `${TRACE_REL}  `]) {
    assert.equal(
      ensureIgnored({ text: `${OWNERS}${spelling}\n`, ...ARRIVALS }).changed,
      false,
      `${JSON.stringify(spelling)} already keeps the file out of the repo`,
    );
  }
  for (const spelling of [".engine-base", "/.engine-base/", ".engine-base/.claude/"]) {
    assert.equal(
      ensureIgnored({ text: `${OWNERS}${spelling}\n`, entry: ".engine-base/.claude/settings.json", comment: "# why" }).changed,
      false,
      `${spelling} covers the path as a parent directory`,
    );
  }
});

// 🛑 The negative pole, and the one that matters: reading a line as "covered" when it is
// not is how a coverage check becomes a lie — the file then stays tracked, and every
// machine publishes its own arrivals to the other.
test("a name that merely starts like ours, a negation and a comment cover NOTHING", () => {
  for (const spelling of [
    "remote-arrivals.json.bak",
    "remote-arrivals/",
    `!${TRACE_REL}`,
    `# ${TRACE_REL} used to be ignored here`,
    "",
  ]) {
    assert.equal(
      ensureIgnored({ text: `${OWNERS}${spelling}\n`, ...ARRIVALS }).changed,
      true,
      `${JSON.stringify(spelling)} does not ignore our path, so the entry is still owed`,
    );
  }
});

// 🎯 THE TWO SPELLINGS MUST AGREE (same claim as the F4 entry's, one door over): a fresh
// install copies the launcher's `.gitignore`, a deployed brain gets the block from the
// migration. A drift means two brains of the same version explain the same line
// differently — or worse, carry it twice.
test("the launcher's own .gitignore already ignores the arrivals trace, comment included", () => {
  const shipped = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "..", ".gitignore"), "utf8");

  assert.equal(ensureIgnored({ text: shipped, ...ARRIVALS }).changed, false, "a fresh install needs no migration");
  assert.ok(shipped.includes(TRACE_IGNORE_COMMENT), "and it explains the line in the same words");
});
