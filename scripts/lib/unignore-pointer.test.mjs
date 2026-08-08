import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { unignoreActiveUniverse } from "./unignore-pointer.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// What every brain deployed before this release carries, verbatim.
const SHIPPED_BEFORE = [
  "# Universes (ADR 0034): the active-universe pointer is per-machine session state",
  "# (never commit it). Its sibling .vault-rag/universes.json registry IS committed on",
  "# purpose (structural: which universes exist) — only the pointer is transient.",
  ".vault-rag/active-universe",
].join("\n");

test("the deployed brain's stale block goes as a whole — the ignore line AND the comment that argued for it", () => {
  const before = `engine-health.json\n${SHIPPED_BEFORE}\n\n# ── Misc ──\n*.log\n`;

  const { text, changed } = unignoreActiveUniverse(before);

  assert.equal(changed, true);
  // The WHOLE file, not three matchers: what replaces the retracted comment is
  // prose we ship into someone else's file, so a blanked or reworded replacement
  // must fail here rather than pass because "the old line is gone".
  assert.equal(
    text,
    "engine-health.json\n" +
      "# Universes (ADR 0034): nothing under .vault-rag/ is ignored — which universe you are in is the OWNER's state, and it travels.\n" +
      "\n# ── Misc ──\n*.log\n",
  );
});

test("the engine's block at the very TOP of the file is still the engine's — no line above it to lean on", () => {
  // The boundary: the comment starts at index 0. An off-by-one here leaves the
  // stale "never commit it" comment sitting above a pointer that is now committed.
  const before = `${SHIPPED_BEFORE}\n*.log\n`;

  const { text, changed } = unignoreActiveUniverse(before);

  assert.equal(changed, true);
  assert.equal(
    text,
    "# Universes (ADR 0034): nothing under .vault-rag/ is ignored — which universe you are in is the OWNER's state, and it travels.\n*.log\n",
  );
});

test("the engine's comment the owner PARTLY rewrote is theirs now — all three lines, or none of them", () => {
  // The half-way case, and the one that decides between `every` and `some`: our
  // opening line kept, the rest replaced by their own words. Retracting that block
  // would delete a sentence the owner wrote, which is the one thing this migration
  // must never do.
  const before = [
    "# Universes (ADR 0034): the active-universe pointer is per-machine session state",
    "# and I keep it that way on purpose — this box is shared.",
    "# ask me before touching this.",
    ".vault-rag/active-universe",
    "*.log",
    "",
  ].join("\n");

  const { text, changed } = unignoreActiveUniverse(before);

  assert.equal(changed, true);
  assert.equal(
    text,
    "# Universes (ADR 0034): the active-universe pointer is per-machine session state\n" +
      "# and I keep it that way on purpose — this box is shared.\n" +
      "# ask me before touching this.\n" +
      "*.log\n",
  );
});

test("three lines of the OWNER's own above the pointer are not our comment, however well placed", () => {
  // Same shape as the engine's block (three comment lines, immediately above), so
  // only reading them tells the difference. Rewriting an owner's prose is worse
  // than leaving ours behind.
  const before = "# why I ignore this\n# (asked ops, 2026)\n# do not remove\n.vault-rag/active-universe\n*.log\n";

  const { text, changed } = unignoreActiveUniverse(before);

  assert.equal(changed, true);
  assert.equal(text, "# why I ignore this\n# (asked ops, 2026)\n# do not remove\n*.log\n");
});

test("a Windows brain carrying the engine's block keeps CRLF on the line we put back", () => {
  // The CRLF case where the replacement is actually written: the line we introduce
  // must carry the file's own ending, or a Windows .gitignore ends up mixed.
  const before = `${SHIPPED_BEFORE.split("\n").join("\r\n")}\r\n*.log\r\n`;

  const { text, changed } = unignoreActiveUniverse(before);

  assert.equal(changed, true);
  assert.equal(
    text,
    "# Universes (ADR 0034): nothing under .vault-rag/ is ignored — which universe you are in is the OWNER's state, and it travels.\r\n*.log\r\n",
  );
});

test("the entry as a careless hand left it — trailing spaces, which git ignores and so must we", () => {
  const before = ".vault-rag/active-universe   \n*.log\n";

  const { text, changed } = unignoreActiveUniverse(before);

  assert.equal(changed, true);
  assert.equal(text, "*.log\n");
});

test("only the comment the ENGINE wrote is removed — an owner's own note beside the line survives", () => {
  const before = "# my own reason for this one\n.vault-rag/active-universe\n*.log\n";

  const { text, changed } = unignoreActiveUniverse(before);

  assert.equal(changed, true);
  assert.equal(text, "# my own reason for this one\n*.log\n");
});

test("a brain already migrated is left byte-for-byte alone, and says so — running it twice changes nothing", () => {
  const shippedNow = readFileSync(join(REPO_ROOT, ".gitignore"), "utf8");

  const first = unignoreActiveUniverse(shippedNow);
  assert.equal(first.changed, false);
  assert.equal(first.text, shippedNow);

  const twice = unignoreActiveUniverse(unignoreActiveUniverse(`.vault-rag/active-universe\n*.log\n`).text);
  assert.equal(twice.changed, false);
  assert.equal(twice.text, "*.log\n");
});

test("a LOOK-ALIKE entry the owner added is not the pointer, and is never touched", () => {
  // The per-machine override this plan deliberately deferred — an owner may well have
  // invented it themselves. Removing it would un-ignore a file they meant to keep local.
  const before = ".vault-rag/active-universe.local\n.vault-rag/active-universe\n";

  const { text } = unignoreActiveUniverse(before);

  assert.equal(text, ".vault-rag/active-universe.local\n");
});

test("a CRLF .gitignore stays CRLF — a Windows brain must not have its whole file rewritten", () => {
  const before = "engine-health.json\r\n.vault-rag/active-universe\r\n*.log\r\n";

  const { text, changed } = unignoreActiveUniverse(before);

  assert.equal(changed, true);
  assert.equal(text, "engine-health.json\r\n*.log\r\n");
});

test("no .gitignore content at all is not a crash — it is simply nothing to migrate", () => {
  assert.deepEqual(unignoreActiveUniverse(""), { text: "", changed: false });
});

test("the entry re-added a second time somewhere else goes too — one left behind and the pointer still never travels", () => {
  const before = ".vault-rag/active-universe\n*.log\n/.vault-rag/active-universe\n";

  const { text, changed } = unignoreActiveUniverse(before);

  assert.equal(changed, true);
  assert.equal(text, "*.log\n");
});
