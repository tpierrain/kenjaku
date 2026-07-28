import { test } from "node:test";
import assert from "node:assert/strict";

import { repoStatusLine, countVaultUncommitted, countUnmerged } from "./repo-status.mjs";

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

test("countUnmerged: counts the paths git left unmerged, including the two U-less codes", () => {
  // Two conflicts, deliberately unsorted and mixed with ordinary dirt: the codes
  // WITHOUT a U ('AA' both added, 'DD' both deleted) are conflicts just the same.
  const porcelain = [
    "UU vault/notes/idea.md", //  both modified
    " M scripts/lib/repo-status.mjs", // ordinary dirt → not a conflict
    "AA vault/draft.md", //       both added
    "?? vault/UU-DD-naming.md", //the decoy: the CODES are in the PATH, not the status
  ].join("\n");
  assert.equal(countUnmerged(porcelain), 2);
  assert.equal(countUnmerged("DD vault/gone.md\n"), 1, "both deleted counts too");
});

test("countUnmerged: each unmerged code counts ON ITS OWN, whichever side git marked", () => {
  // One fixture per reason: with only 'UU' (which satisfies BOTH the "U left" and
  // "U right" cases at once), either half could be deleted with the suite still green.
  assert.equal(countUnmerged("UD vault/kept-here.md\n"), 1, "deleted by them (U on the left)");
  assert.equal(countUnmerged("AU vault/added-here.md\n"), 1, "added by us (U on the right)");
});

test("countUnmerged: a tree with no conflict at all → 0", () => {
  assert.equal(countUnmerged(" M vault/note.md\n?? vault/draft.md\n"), 0);
  assert.equal(countUnmerged(""), 0);
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
      // Noise that MENTIONS a diagnostic word mid-line: only a line that STARTS with
      // one is a diagnostic, otherwise git's hints get quoted back as the reason.
      "hint: see 'git help rebase' if this error: keeps happening",
      "  error: cannot pull with rebase: You have unstaged changes.", // git may indent
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

test("repoStatusLine: UNcommitted vault changes → ⚠️ fail-loud (the sweep couldn't commit them)", () => {
  const line = repoStatusLine({
    pullOk: true,
    pullOut: "Already up to date.",
    short: "abc1234",
    changedCount: 0,
    uncommittedVault: 2,
  });
  // The WHOLE message, not a fragment of it: this line is the only warning a user
  // gets that their notes are unversioned, so every clause of it — the count, the
  // cause, the reassurance that the notes still exist, and the way out — is part of
  // the contract, not decoration.
  //
  // The cause it names had to change with the startup sweep: this very line is
  // printed BY a hook that just tried to commit, so "the hooks didn't run" no longer
  // holds. What's left is a git that refused the commit — and git will say why.
  assert.equal(
    line,
    "⚠️ 2 vault note(s) NOT committed — the startup sweep could not commit them. " +
      "Your notes are ON DISK but not versioned. Commit by hand to get git's own reason: " +
      "git add -A && git commit (a missing git identity is the usual culprit)."
  );
});

test("repoStatusLine: an unresolved conflict asks for a HUMAN decision, never for a blind commit", () => {
  // The one state the startup sweep deliberately refuses to touch. Telling the user
  // to `git add -A && git commit` here would bury the markers inside their notes, so
  // this line must NOT carry that advice — it must hand the decision back to them.
  const line = repoStatusLine({
    pullOk: false,
    pullOut: "error: could not apply 9f2a1c… Your local changes would be overwritten.",
    short: "abc1234",
    conflictedCount: 2,
    uncommittedVault: 2,
  });
  assert.equal(
    line,
    "⚠️ Sync BLOCKED by a conflict — 2 file(s) hold changes git could not merge on its own. " +
      "Nothing was committed for you (that would bury the <<<<<<< markers in your notes). " +
      "Open them, keep what you want, then finish with: git rebase --continue."
  );
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
