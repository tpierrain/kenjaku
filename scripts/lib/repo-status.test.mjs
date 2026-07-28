import { test } from "node:test";
import assert from "node:assert/strict";

import { repoStatusLine, countVaultUncommitted } from "./repo-status.mjs";

test("countVaultUncommitted: counts porcelain entries under vault/ (modified + untracked)", () => {
  const porcelain = [
    " M vault/notes/idea.md", // modified
    "?? vault/draft.md", //       untracked
    " M rag/.cache/vault.db", // outside vault → ignored
    "?? .env", //                outside vault → ignored
  ].join("\n");
  assert.equal(countVaultUncommitted(porcelain), 2);
});

test("countVaultUncommitted: clean tree → 0", () => {
  assert.equal(countVaultUncommitted(""), 0);
});

test("repoStatusLine: repo up to date → ✅ with the short commit", () => {
  const line = repoStatusLine({
    pullOk: true,
    pullOut: "Already up to date.",
    short: "abc1234",
    changedCount: 0,
    uncommittedVault: 0,
  });
  assert.equal(line, "✅ Repo up to date (commit abc1234).");
});

test("repoStatusLine: pull failed → ⚠️ to check", () => {
  const line = repoStatusLine({ pullOk: false, pullOut: "boom", short: "abc1234", uncommittedVault: 0 });
  assert.match(line, /^⚠️/);
  assert.match(line, /[Pp]ull/);
});

test("repoStatusLine: pull failed → carries git's OWN reason, not just 'check manually'", () => {
  const line = repoStatusLine({
    pullOk: false,
    pullOut: "error: cannot pull with rebase: You have unstaged changes.",
    short: "abc1234",
    uncommittedVault: 0,
  });
  assert.match(line, /cannot pull with rebase: You have unstaged changes\./);
});

test("repoStatusLine: pull failed → condenses git's noisy multi-line output to ONE readable line", () => {
  // What git really writes on stdout+stderr: fetch chatter, then the error lines.
  const line = repoStatusLine({
    pullOk: false,
    pullOut: [
      "From github.com:someone/their-brain",
      " * branch            main       -> FETCH_HEAD",
      "error: cannot pull with rebase: You have unstaged changes.",
      "error: Please commit or stash them.",
      "",
    ].join("\n"),
    short: "abc1234",
    uncommittedVault: 0,
  });
  assert.equal(
    line,
    "⚠️ Pull failed — cannot pull with rebase: You have unstaged changes. Please commit or stash them."
  );
});

test("repoStatusLine: pull failed under a LOCALIZED git → the reason still comes through", () => {
  // git speaks the user's locale (the 'déjà à jour' case above already proves we
  // meet localized output); in French it prefixes 'erreur :', never 'error:'.
  const line = repoStatusLine({
    pullOk: false,
    pullOut: "erreur : impossible de tirer avec rebasage : vous avez des modifications non indexées.",
    short: "abc1234",
    uncommittedVault: 0,
  });
  assert.equal(
    line,
    "⚠️ Pull failed — impossible de tirer avec rebasage : vous avez des modifications non indexées."
  );
});

test("repoStatusLine: pull failed with NO output at all → still advises, never crashes the banner", () => {
  // The absent twin: a caller that omits pullOut entirely. This line is emitted by
  // a SessionStart hook, so a throw here would break every session start.
  const line = repoStatusLine({ pullOk: false, short: "abc1234", uncommittedVault: 0 });
  assert.equal(line, "⚠️ Pull failed — check manually.");
});

test("repoStatusLine: pull failed with NO recognizable reason → falls back to 'check manually'", () => {
  // git said something we can't parse (no error:/fatal: prefix) → we must not
  // emit a dangling dash; the fallback advice has to survive.
  const line = repoStatusLine({ pullOk: false, pullOut: "boom", short: "abc1234", uncommittedVault: 0 });
  assert.equal(line, "⚠️ Pull failed — check manually.");
});

test("repoStatusLine: repo updated → 📥 with the file count", () => {
  const line = repoStatusLine({
    pullOk: true,
    pullOut: "Updating 1..2\nFast-forward",
    short: "abc1234",
    changedCount: 3,
    uncommittedVault: 0,
  });
  assert.match(line, /^📥/);
  assert.match(line, /3 file/);
});

test("repoStatusLine: UNcommitted vault changes → ⚠️ fail-loud (silent auto-commit)", () => {
  const line = repoStatusLine({
    pullOk: true,
    pullOut: "Already up to date.",
    short: "abc1234",
    changedCount: 0,
    uncommittedVault: 2,
  });
  assert.match(line, /^⚠️/); // shouts instead of the green ✅
  assert.match(line, /2/); // number of notes at stake
  assert.match(line, /auto-commit/i); // names the cause (the hook didn't run)
});

test("repoStatusLine: the vault fail-loud TAKES PRIORITY over 'up to date'", () => {
  // Even when the pull says "up to date", uncommitted notes must shout:
  // that's exactly the symptom of silent hooks under nvm (minimal PATH).
  const line = repoStatusLine({
    pullOk: true,
    pullOut: "Already up to date.",
    short: "abc1234",
    changedCount: 0,
    uncommittedVault: 1,
  });
  assert.doesNotMatch(line, /✅/);
});
