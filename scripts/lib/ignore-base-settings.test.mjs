import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { BASE_SETTINGS_ENTRY, ignoreBaseSettings } from "./ignore-base-settings.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// F4 (v5.0.0 code review) — THE BACKUP REPO MUST NOT PUBLISH THIS MACHINE.
//
// `.claude/settings.json` is gitignored, and its own comment says why: absolute
// paths belonging to one machine, plus that machine's connector permissions. This
// release invents `.engine-base/`, which keeps the last-delivered bytes of every
// merge file — that one included — and nothing ignored the copy. Auto-commit sweeps
// it, auto-push publishes it, and on a second machine the pulled base describes
// machine A.
//
// The migration's contract is `unignore-pointer.mjs`'s, inverted: this file is the
// OWNER's, so we add exactly one entry and one comment, at the end, and leave every
// other byte — their lines, their order, their line endings — where it was.
// ═══════════════════════════════════════════════════════════════════════════

const OWNERS = "# my own rules\nnotes-drafts/\n*.bak\n";

test("a brain that never ignored the base copy gains the entry, and keeps every line it had", () => {
  const { text, changed } = ignoreBaseSettings(OWNERS);

  assert.equal(changed, true);
  assert.ok(text.startsWith(OWNERS), "the owner's file is added to, never rewritten");
  assert.ok(
    text.split("\n").includes(BASE_SETTINGS_ENTRY),
    "the entry must be a line of its own, matchable by git",
  );
  assert.match(text, /THIS machine/, "and it must say WHY, in words an owner reads when their sync misbehaves");
});

// Idempotence is what keeps a converged brain from committing a `.gitignore` churn at
// every session start — this runs on BOTH the update and the self-heal path.
test("a second run returns the SAME string, byte for byte", () => {
  const once = ignoreBaseSettings(OWNERS).text;

  const twice = ignoreBaseSettings(once);

  assert.equal(twice.changed, false);
  assert.equal(twice.text, once, "not merely equivalent — the same bytes, or auto-commit sees a diff");
});

// A leading slash is the same entry to git, and an owner may well have written one.
// Without this, their line would be joined by ours and the file would carry both.
test("an entry the owner spelled with a leading slash is recognised as the same entry", () => {
  const { text, changed } = ignoreBaseSettings(`${OWNERS}/${BASE_SETTINGS_ENTRY}\n`);

  assert.equal(changed, false);
  assert.equal(text.split("\n").filter((l) => l.includes(BASE_SETTINGS_ENTRY)).length, 1, "one entry, not two");
});

// Trailing whitespace is not a different entry either — git strips it, so must we, or a
// hand-edited file quietly gets a duplicate at the next update.
test("an entry with trailing spaces is recognised as the same entry", () => {
  assert.equal(ignoreBaseSettings(`${OWNERS}${BASE_SETTINGS_ENTRY}   \n`).changed, false);
});

// 🪟 A brain cloned on Windows carries CRLF. Appending an LF-only block there leaves a
// mixed file — which git tolerates, but which shows up in the owner's diff as a change
// to lines nobody edited.
test("a CRLF file stays CRLF", () => {
  const crlf = OWNERS.split("\n").join("\r\n");

  const { text } = ignoreBaseSettings(crlf);

  assert.ok(text.endsWith(`${BASE_SETTINGS_ENTRY}\r\n`), "the appended block follows the file's own line endings");
  assert.equal(text.includes("\n\n"), false, "and never leaves a bare LF among them");
});

// A `.gitignore` whose last line has no newline is ordinary (most editors do it): welded
// onto our comment, that last entry becomes a string git no longer matches — so the file
// would silently stop ignoring whatever it named.
test("a file with no trailing newline does not have its last entry welded to our comment", () => {
  const { text } = ignoreBaseSettings("*.bak");

  assert.ok(text.split("\n").includes("*.bak"), "their last entry must survive as its own line");
  assert.ok(text.split("\n").includes(BASE_SETTINGS_ENTRY));
});

// 🎯 THE TWO SPELLINGS MUST AGREE. A fresh install copies the launcher's own
// `.gitignore`; a deployed brain gets the entry from the migration above. If the shipped
// file lacked it, every new brain would leak until its first update — and if it spelled
// it differently, the migration would append a duplicate to every brain, forever.
test("the launcher's own .gitignore already ignores it, so a fresh install needs no migration", () => {
  const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  const shipped = readFileSync(join(repoRoot, ".gitignore"), "utf8");

  assert.equal(
    ignoreBaseSettings(shipped).changed,
    false,
    "the shipped .gitignore must already carry the entry the migration adds, spelled identically",
  );
});
