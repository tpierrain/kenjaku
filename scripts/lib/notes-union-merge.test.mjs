// ─────────────────────────────────────────────────────────────────────────────
// notes-union-merge.test.mjs — two people (or two machines) appending to the SAME
// vault note must never produce a conflict: the launcher's `.gitattributes` gives
// every `vault/**/*.md` git's built-in `union` merge driver, so a rebase keeps both
// sides with no markers and no human. Proven against real git in a temp repo, with
// the very `.gitattributes` the installer copies into each brain (plan #84, step 1).
//
// The scope is the claim too: a file OUTSIDE the vault keeps conflicting, on purpose
// (a constitution edited two ways is not "keep both" material), and a note nested in
// a universe subtree IS covered by the `**` glob.
// ─────────────────────────────────────────────────────────────────────────────
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const LAUNCHER_GITATTRIBUTES = join(dirname(fileURLToPath(import.meta.url)), "..", "..", ".gitattributes");

/**
 * A repo where `main` and `here` each append a different line to `relPath`, the way two
 * brains do to one daily note. Returns a git runner bound to it, checked out on `here`,
 * so the caller decides whether the rebase must merge or must conflict.
 */
function twoSidedAppend(t, relPath) {
  const repo = mkdtempSync(join(tmpdir(), "sbg-union-"));
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  const git = (...args) =>
    execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  git("init", "--quiet", "--initial-branch=main");
  // The bytes are the claim (no markers, both lines): pin the line endings so a Windows
  // runner's autocrlf cannot turn a green into a CRLF red (same confound as the sync rule test).
  git("config", "core.autocrlf", "false");
  git("config", "user.email", "test@example.invalid");
  git("config", "user.name", "Test");
  writeFileSync(join(repo, ".gitattributes"), readFileSync(LAUNCHER_GITATTRIBUTES, "utf8"));
  const file = join(repo, relPath);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, "---\ntitle: Monday\n---\n\n## Log\n\n- shared line\n");
  git("add", "-A");
  git("commit", "--quiet", "-m", "shared history");
  git("checkout", "--quiet", "-b", "here");
  writeFileSync(file, readFileSync(file, "utf8") + "- TP: signed the lease\n");
  git("commit", "--quiet", "-am", "append here");
  git("checkout", "--quiet", "main");
  writeFileSync(file, readFileSync(file, "utf8") + "- CL: the notary answered\n");
  git("commit", "--quiet", "-am", "append elsewhere");
  git("checkout", "--quiet", "here");
  return { git, file };
}

test("two appends to the same daily note rebase with no conflict, and both lines survive", (t) => {
  const { git, file } = twoSidedAppend(t, join("vault", "daily", "2026-09-08.md"));

  assert.doesNotThrow(() => git("rebase", "main"), "the union driver must make the rebase succeed on its own");

  const merged = readFileSync(file, "utf8");
  assert.doesNotMatch(merged, /^(<{7}|={7}|>{7})/m, "no conflict markers may ever land in a note");
  assert.match(merged, /- CL: the notary answered\n/, "the line that arrived from the other side is kept");
  assert.match(merged, /- TP: signed the lease\n/, "the local line is kept too");
  assert.equal(git("status", "--porcelain"), "", "the tree is clean after the merge: nothing left for a human");
});

test("a note nested in a universe subtree is covered by the same rule", (t) => {
  const { git, file } = twoSidedAppend(t, join("vault", "acme", "people", "claire.md"));
  assert.doesNotThrow(() => git("rebase", "main"));
  const merged = readFileSync(file, "utf8");
  assert.match(merged, /- CL: the notary answered\n[\s\S]*- TP: signed the lease\n|- TP: signed the lease\n[\s\S]*- CL: the notary answered\n/);
});

test("a file OUTSIDE the vault still conflicts: keep-both is a rule for notes, not for the constitution", (t) => {
  const { git } = twoSidedAppend(t, "CLAUDE.md");
  assert.throws(() => git("rebase", "main"), /conflict/i, "outside vault/ the two edits must stop the rebase");
  git("rebase", "--abort");
  assert.equal(git("status", "--porcelain"), "", "after the abort the local state is intact");
});
