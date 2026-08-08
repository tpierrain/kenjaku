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
  assert.doesNotMatch(text, /^\.vault-rag\/active-universe$/m, "the ignore line must be gone");
  assert.doesNotMatch(text, /per-machine session state/, "a comment that now lies is worse than none");
  assert.match(text, /^engine-health\.json$/m, "everything around it is untouched");
  assert.match(text, /^\*\.log$/m);
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
