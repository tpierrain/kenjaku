// ─────────────────────────────────────────────────────────────────────────────
// notes-union-merge.test.mjs — two people (or two machines) appending to the SAME
// vault note must never produce a conflict: the launcher's `.gitattributes` gives
// git's built-in `union` merge driver to the vault's APPEND-ONLY zones, so a rebase
// keeps both sides with no markers and no human. Proven against real git in a temp
// repo, with the very `.gitattributes` the installer copies into each brain (#84).
//
// ⚠️ The SCOPE is half the claim, and it narrowed on 2026-09-03 (#84 step 4bis).
// Union is not a merge, it is a CONCATENATION: it keeps both sides' lines with no
// marker and no question. Right for a ledger nobody rewrites, wrong for a page two
// people edit — where it interleaves two versions of one paragraph, and on the
// frontmatter produces a note carrying `updated:` twice that the indexer refuses.
//
// So three claims are asserted here, not one:
//   • every RAW CAPTURE ZONE merges, at the vault root AND inside a universe;
//   • every CURATED page conflicts, at the root and inside a universe — and that
//     conflict is not a failure, it is the input the sync tick's guided-merge path
//     already reads;
//   • the zone list is not copied: `.gitattributes` and `wiki-lint.mjs` must AGREE.
// ─────────────────────────────────────────────────────────────────────────────
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { RAW_CAPTURE_ZONES } from "./wiki-lint.mjs";

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

test("a capture nested in a universe subtree is covered by the same rule", (t) => {
  const { git, file } = twoSidedAppend(t, join("vault", "acme", "daily", "2026-09-08.md"));
  assert.doesNotThrow(() => git("rebase", "main"));
  const merged = readFileSync(file, "utf8");
  assert.match(merged, /- CL: the notary answered\n[\s\S]*- TP: signed the lease\n|- TP: signed the lease\n[\s\S]*- CL: the notary answered\n/);
});

// ── The zones, one by one, at both depths ────────────────────────────────────
// The list is not spelled out here: it is READ from the linter, so a zone added
// there without a matching merge rule fails this file rather than shipping half a
// rule. A folder zone is exercised with a note inside it; `actions-log.md` is a
// single file and is exercised as itself.
const relPathIn = (zone, universe) => {
  const under = zone.endsWith("/") ? join(zone.slice(0, -1), "2026-09-08.md") : zone;
  return join("vault", ...(universe ? [universe] : []), under);
};

for (const zone of RAW_CAPTURE_ZONES) {
  for (const universe of [null, "acme"]) {
    const rel = relPathIn(zone, universe);
    test(`two appends to ${rel} keep both sides, with no human`, (t) => {
      const { git, file } = twoSidedAppend(t, rel);

      assert.doesNotThrow(() => git("rebase", "main"), `${zone} is append-only: a conflict there is a bug`);

      const merged = readFileSync(file, "utf8");
      assert.doesNotMatch(merged, /^(<{7}|={7}|>{7})/m);
      assert.match(merged, /- CL: the notary answered\n/);
      assert.match(merged, /- TP: signed the lease\n/);
    });
  }
}

// ── The negative pole, and the whole point of 4bis ───────────────────────────
// 🛑 A curated page is not append-only. Two people editing one person card must be
// STOPPED, because keeping both silently leaves a page that says two contradictory
// things — and, on the frontmatter, a note with `updated:` twice that the indexer
// refuses to read at all. Before 4bis these two cases merged.
for (const rel of [join("vault", "people", "claire-dubois.md"), join("vault", "acme", "topics", "invoicing.md")]) {
  test(`two edits to ${rel} stop the rebase: a curated page is not keep-both material`, (t) => {
    const { git } = twoSidedAppend(t, rel);

    assert.throws(() => git("rebase", "main"), /conflict/i);
    git("rebase", "--abort");
    assert.equal(git("status", "--porcelain"), "", "after the abort the local state is intact");
  });
}

// 4bis.4 — a conflict is NOT a failure: it is the input the sync tick already knows
// how to hand to a human (`scripts/lib/remote-sync.mjs` → `rebase --abort`, the files
// named in the trace, the brain guiding the merge at the next message). That path is
// unit-tested against a fake git; what is asserted here is that REAL git, on a real
// curated page, produces exactly what that path reads.
test("a curated-page conflict yields exactly what the sync tick reads before it aborts", (t) => {
  const { git } = twoSidedAppend(t, join("vault", "people", "claire-dubois.md"));

  assert.throws(() => git("rebase", "main"), /conflict/i);

  // The very command in remote-sync.mjs's conflict branch, and its very output shape.
  assert.equal(git("diff", "--name-only", "--diff-filter=U"), "vault/people/claire-dubois.md\n");
  git("rebase", "--abort");
  assert.equal(git("status", "--porcelain"), "");
});

// ── One rule, one list ───────────────────────────────────────────────────────
// CONVENTIONS §5quater: a rule written down twice drifts. `.gitattributes` cannot
// import anything, so the copy is unavoidable — the agreement is not.
test("the zones `.gitattributes` gives to union are exactly the linter's raw capture zones", () => {
  const rules = readFileSync(LAUNCHER_GITATTRIBUTES, "utf8")
    .split("\n")
    .filter((line) => line.includes("merge=union") && !line.trimStart().startsWith("#"));

  const zones = rules.map((line) => {
    const pattern = line.trim().split(/\s+/)[0];
    // `vault/**/daily/**/*.md` → `daily/` · `vault/**/actions-log.md` → `actions-log.md`
    const rest = pattern.replace(/^vault\/\*\*\//, "");
    return rest.endsWith("/**/*.md") ? `${rest.slice(0, -"**/*.md".length)}` : rest;
  });

  assert.deepEqual(
    zones.slice().sort(),
    RAW_CAPTURE_ZONES.slice().sort(),
    "a zone added on one side and not the other is half a rule, shipped",
  );
  assert.equal(zones.length, rules.length, "every union rule names a zone this test could read");
});

test("a file OUTSIDE the vault still conflicts: keep-both is a rule for notes, not for the constitution", (t) => {
  const { git } = twoSidedAppend(t, "CLAUDE.md");
  assert.throws(() => git("rebase", "main"), /conflict/i, "outside vault/ the two edits must stop the rebase");
  git("rebase", "--abort");
  assert.equal(git("status", "--porcelain"), "", "after the abort the local state is intact");
});
