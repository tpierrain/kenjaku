import { test } from "node:test";
import assert from "node:assert/strict";
import { persistNote, persistenceWarning } from "./note-persistence.mjs";
import { COMMIT_MESSAGE } from "./vault-commit.mjs";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { docSection } from "./doc-section.mjs";

// ─────────────────────────────────────────────────────────────────────────────
// #77 — the engine's own writer scripts wrote notes nothing ever committed.
//
// The auto-commit hook matches `Write|Edit`. `refresh-note.mjs` and
// `file-back-note.mjs` are invoked from Bash on purpose — that routing is what
// makes their notes conformant by construction — so the net has never seen them.
// Measured on a real brain, 2026-08-23: a /consolidate pass refreshed five vault
// pages, printed `✓ Refreshed` five times, and committed none of them.
//
// This module is the writers' own persistence, so a note is versioned by the
// gesture that wrote it rather than by a hook that may not be installed, may have
// been tailored to an older version, or may simply not be this host's.
//
// 🧭 Why it wraps `attemptCommit` instead of re-deciding anything: the refusal of
// an unmerged tree, the staging and the message are the SAME gesture the hooks
// make. Two spellings of "commit the vault" are two behaviours to keep in step,
// and this one would be the copy nobody watches.
// ─────────────────────────────────────────────────────────────────────────────

// A fake git: records what it was asked, answers from a script of outcomes.
function fakeGit({ status = "", fails = [] } = {}) {
  const calls = [];
  const git = (args) => {
    calls.push(args);
    if (fails.includes(args[0])) return { out: "boom", ok: false };
    if (args[0] === "status") return { out: status, ok: true };
    return { out: "", ok: true };
  };
  git.calls = calls;
  return git;
}

test("persistNote — a dirty tree is staged and committed, with the hooks' own message", () => {
  const git = fakeGit({ status: " M vault/topics/crise.md\n" });
  assert.equal(persistNote({ git }), "committed");
  assert.deepEqual(git.calls, [
    ["status", "--porcelain"],
    ["add", "."],
    ["commit", "-m", COMMIT_MESSAGE],
  ]);
});

test("persistNote — a clean tree is 'clean', and nothing is staged", () => {
  const git = fakeGit({ status: "" });
  assert.equal(persistNote({ git }), "clean");
  assert.deepEqual(git.calls, [["status", "--porcelain"]]);
});

// The one case where persistence must step aside: `add .` on an unmerged tree
// stages the <<<<<<< markers AND fake-resolves the merge.
test("persistNote — an unmerged tree is 'conflicted', and NOTHING is staged", () => {
  const git = fakeGit({ status: "UU vault/topics/crise.md\n" });
  assert.equal(persistNote({ git }), "conflicted");
  assert.deepEqual(git.calls, [["status", "--porcelain"]]);
});

test("persistNote — a git that refuses the commit is 'failed', never a silent success", () => {
  const git = fakeGit({ status: " M vault/x.md\n", fails: ["commit"] });
  assert.equal(persistNote({ git }), "failed");
});

test("persistNote — a git that refuses to stage is 'failed', and never reaches commit", () => {
  const git = fakeGit({ status: " M vault/x.md\n", fails: ["add"] });
  assert.equal(persistNote({ git }), "failed");
  assert.deepEqual(
    git.calls.map(([verb]) => verb),
    ["status", "add"],
  );
});

// A note is already on disk by the time this runs, so a runner that EXPLODES must
// not take the write's own success report down with it.
test("persistNote — a runner that throws is 'failed', not an exception at the caller", () => {
  const git = () => {
    throw new Error("git is not on PATH");
  };
  assert.equal(persistNote({ git }), "failed");
});

// ── What the user is told, and when they are told nothing ──────────────────
test("persistenceWarning — a committed note says nothing: success is not an event", () => {
  assert.equal(persistenceWarning("committed", "topics/crise.md"), null);
});

test("persistenceWarning — 'clean' says nothing either: the bytes were already identical", () => {
  assert.equal(persistenceWarning("clean", "topics/crise.md"), null);
});

test("persistenceWarning — a failed commit names the note, and what to run to learn why", () => {
  const warning = persistenceWarning("failed", "topics/crise.md");
  assert.match(warning, /^⚠️ /, "it must read as a warning, not as a footnote");
  assert.match(warning, /vault\/topics\/crise\.md/, "the note that is at risk is named");
  assert.match(warning, /NOT committed/, "the claim the ✓ would otherwise imply is contradicted out loud");
  assert.match(warning, /git add -A && git commit/, "and the one command that reports git's own reason");
  assert.match(warning, /identity/i, "with the usual culprit, so the reader is not sent hunting");
});

test("persistenceWarning — a conflicted tree explains why NOT committing is the safe answer", () => {
  const warning = persistenceWarning("conflicted", "topics/crise.md");
  assert.match(warning, /^⚠️ /);
  assert.match(warning, /vault\/topics\/crise\.md/);
  assert.match(warning, /NOT committed/);
  assert.match(warning, /<<<<<<</, "the damage that committing would do is shown, not asserted");
  assert.match(
    warning,
    /Finish the merge first/,
    "and the remedy is named: a warning that only forbids leaves the reader stuck",
  );
  assert.doesNotMatch(
    warning,
    /git add -A && git commit/,
    "telling someone to commit an unmerged tree is the one piece of advice that does damage",
  );
});

// An outcome nobody planned for must not silently become "all good".
test("persistenceWarning — an unknown outcome warns rather than reassures", () => {
  const warning = persistenceWarning("something-new", "topics/crise.md");
  assert.match(warning, /^⚠️ /);
  assert.match(warning, /vault\/topics\/crise\.md/);
});

// ── The brain's own stated contract must stop being false ──────────────────
// `CLAUDE.engine.md` told the brain that persistence is a hook's job. That
// sentence was true for `Write`/`Edit` and false for every skill that writes
// *properly*, through a builder — which is the half that silently lost notes. A
// contract nobody can trust is worse than none, so both locales say what actually
// persists a note, and a reader can tell which path theirs went down.
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CONTRACTS = [
  {
    locale: "EN",
    path: "CLAUDE.engine.md",
    heading: /^#+ Automatic persistence & commit/m,
    hook: /hook/i,
  },
  {
    locale: "FR",
    path: "templates/fr/CLAUDE.engine.md",
    heading: /^#+ Persistance & commit automatiques/m,
    hook: /hook/i,
  },
];

for (const { locale, path, heading, hook } of CONTRACTS) {
  test(`${locale} constitution: the persistence contract names the writers, not only the hook`, () => {
    const section = docSection(readFileSync(join(REPO_ROOT, path), "utf8"), heading);
    assert.notEqual(section, "", "the persistence section must still be there");
    assert.match(section, hook, "the hook is still one of the paths, and stays named");
    assert.match(
      section,
      /file-back-note\.mjs/,
      "the builder that writes notes must be named as a path that commits its own",
    );
    assert.match(
      section,
      /refresh-note\.mjs/,
      "and so must the refresher — those two are the writes the hook never saw",
    );
  });
}
