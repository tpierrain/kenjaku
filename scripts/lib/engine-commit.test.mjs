import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  ADOPTION_BLOCKED_LINE,
  SAFETY_COMMIT_MESSAGE,
  commitEngineUpdate,
  defaultCommitEngineWrites,
  safetyCommit,
} from "./engine-commit.mjs";

// Fake git keyed on the FULL command (never on args[0]): a partial key lets every
// later arg-string mutant survive. `calls` records the whole sequence so the test
// pins the exact commands, message included. Outputs carry the trailing newline a
// real git emits, so production `.trim()`s stay pinned.
function fakeGit({ porcelain = "", commitOk = true } = {}) {
  const calls = [];
  const git = (args) => {
    calls.push(args.join(" "));
    if (args.join(" ") === "status --porcelain") return { out: porcelain, ok: true };
    if (args[0] === "commit") return { out: "Author identity unknown\n", ok: commitOk };
    return { out: "", ok: true };
  };
  return { git, calls };
}

test("commitEngineUpdate: an already-clean tree commits NOTHING (no empty commit)", () => {
  const { git, calls } = fakeGit({ porcelain: "" });

  const outcome = commitEngineUpdate({ git, ref: "v4.2.0" });

  assert.equal(outcome, "clean");
  assert.deepEqual(calls, ["status --porcelain"]); // it looked, and stopped there
});

test("commitEngineUpdate: a clean tree reported as a bare newline is still CLEAN", () => {
  // `git status --porcelain` on a clean tree can hand back a lone newline rather than
  // an empty string. Read literally that is "dirty", and the update would land an
  // empty commit on every run.
  const { git, calls } = fakeGit({ porcelain: "\n" });

  assert.equal(commitEngineUpdate({ git, ref: "v4.2.0" }), "clean");
  assert.deepEqual(calls, ["status --porcelain"]);
});

test("commitEngineUpdate: a dirty tree is staged and committed, naming the engine version", () => {
  const { git, calls } = fakeGit({ porcelain: " M engine-manifest.json\n M scripts/lib/tracked-files.mjs\n" });

  const outcome = commitEngineUpdate({ git, ref: "v4.2.0" });

  assert.equal(outcome, "committed");
  assert.deepEqual(calls, [
    "status --porcelain",
    "add -A",
    "commit -m engine: update to v4.2.0",
  ]);
});

test("commitEngineUpdate: an UNMERGED tree is left alone — the markers must not be committed", () => {
  // An update can be asked for while a rebase is stopped on a conflict (the startup
  // banner is telling the user so at that very moment). `add -A && commit` there
  // would stage `<<<<<<<` INTO the manifest and fake-resolve the rebase — and that
  // corrupted manifest is what the NEXT update `JSON.parse`s. Same hazard, same
  // answer as the session-start sweep: hands off.
  const { git, calls } = fakeGit({ porcelain: "UU engine-manifest.json\n M scripts/lib/tracked-files.mjs\n" });

  assert.equal(commitEngineUpdate({ git, ref: "v4.3.0" }), "conflicted");
  assert.deepEqual(calls, ["status --porcelain"]); // it looked, and stopped there
});

test("commitEngineUpdate: a commit git REFUSED is not reported as committed", () => {
  // A brain with no `user.email` configured (a fresh machine, a fresh account) makes
  // `git commit` fail. Claiming "committed" there tells the owner their engine files
  // are safe while the tree is left fully staged and dirty — so the next pull is
  // blocked and the report was the one thing that could have said why.
  const { git, calls } = fakeGit({ porcelain: " M engine-manifest.json\n", commitOk: false });

  assert.equal(commitEngineUpdate({ git, ref: "v4.3.0" }), "refused");
  assert.deepEqual(calls, ["status --porcelain", "add -A", "commit -m engine: update to v4.3.0"]);
});

// ── The default seam, against a REAL git repo ────────────────────────────────
// The pure function above proves the DECISION; only this proves the WIRING (right
// cwd, right runner, a commit that actually lands). It is the one thing a fake git
// can never show — and the wiring is exactly what was missing when an update left a
// brain permanently dirty.
function makeRepo() {
  const dir = mkdtempSync(join(tmpdir(), "sbg-engine-commit-"));
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" });
  git("init", "--quiet");
  // A CI runner has no global git identity → configure one locally or `commit` fails.
  git("config", "user.email", "test@example.invalid");
  git("config", "user.name", "Test");
  writeFileSync(join(dir, "engine-manifest.json"), '{"ref":"v1.0.0"}\n');
  git("add", "-A");
  git("commit", "--quiet", "-m", "initial");
  return { dir, git };
}

test("defaultCommitEngineWrites: a real dirty repo ends CLEAN, under a message naming the version", (t) => {
  const { dir, git } = makeRepo();
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  // What an update really leaves behind: a rewritten manifest + a new engine file.
  writeFileSync(join(dir, "engine-manifest.json"), '{"ref":"v4.2.0"}\n');
  writeFileSync(join(dir, "new-engine-file.mjs"), "// delivered by the update\n");

  const outcome = defaultCommitEngineWrites({ brainDir: dir, ref: "v4.2.0" });

  assert.equal(outcome, "committed");
  // THE invariant: nothing left dirty → the next SessionStart pull can run.
  assert.equal(git("status", "--porcelain").trim(), "");
  assert.equal(git("log", "-1", "--format=%s").trim(), "engine: update to v4.2.0");
  // Both files really made it in — not just the one git happened to stage.
  const filesInCommit = git("show", "--name-only", "--format=", "HEAD").trim().split("\n").sort();
  assert.deepEqual(filesInCommit, ["engine-manifest.json", "new-engine-file.mjs"]);
});

test("defaultCommitEngineWrites: a real CLEAN repo gains no empty commit", (t) => {
  const { dir, git } = makeRepo();
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const before = git("rev-parse", "HEAD").trim();

  const outcome = defaultCommitEngineWrites({ brainDir: dir, ref: "v4.2.0" });

  assert.equal(outcome, "clean");
  assert.equal(git("rev-parse", "HEAD").trim(), before, "history must not have moved");
});

// ═══════════════════════════════════════════════════════════════════════════
// S10-4 — THE SAFETY COMMIT, and it is the only place in this codebase where a
// git failure must STOP the caller rather than be reported and moved past.
//
// "Take the new one" is the one offer that destroys. Measured in § S10-0: an edit
// already committed is recoverable from git history, but an edit made outside a
// session and never swept is overwritten AND committed over in one pass, with no
// trace. So the owner's current bytes go into history FIRST, or the adoption does
// not happen. The offer that destroys is the one that has to earn it.
//
// Contrast with `commitEngineUpdate` right above: there, a refused commit is news
// (the files are already written, the report names the cause). Here it is a VETO.
// ═══════════════════════════════════════════════════════════════════════════

const REL = ".claude/skills/coach/SKILL.md";

test("safetyCommit: the owner's uncommitted work is staged and committed, and the message names the file", () => {
  const { git, calls } = fakeGit({ porcelain: ` M ${REL}\n` });

  assert.deepEqual(safetyCommit({ git, rel: REL }), { outcome: "committed", proceed: true });
  assert.deepEqual(calls, [
    "status --porcelain",
    "add -A",
    `commit -m ${SAFETY_COMMIT_MESSAGE(REL)}`,
  ]);
});

test("safetyCommit: `add -A`, not the one file — everything on disk goes in, or the safety net has holes", () => {
  // The owner's edit to the file being adopted is the OBVIOUS casualty; a note they
  // wrote in the same minute is the quiet one. This commit exists to make the moment
  // before the overwrite recoverable, and half a tree is not that moment.
  const { git, calls } = fakeGit({ porcelain: ` M ${REL}\n?? notes/idea.md\n` });

  safetyCommit({ git, rel: REL });

  assert.ok(calls.includes("add -A"), "the whole tree is staged");
  assert.ok(!calls.some((c) => c.startsWith("add ") && c !== "add -A"), "and nothing narrower");
});

test("safetyCommit: a CLEAN tree needs no commit, and adoption proceeds", () => {
  // The common case: `auto-commit` already swept. There is nothing to protect, and an
  // empty commit in the owner's history would be noise standing for a risk not taken.
  const { git, calls } = fakeGit({ porcelain: "" });

  assert.deepEqual(safetyCommit({ git, rel: REL }), { outcome: "clean", proceed: true });
  assert.deepEqual(calls, ["status --porcelain"]);
});

test("safetyCommit: git REFUSING the commit VETOES the adoption", () => {
  // 🛑 The load-bearing assertion of the slice. The common cause is no `user.email` on
  // a fresh machine — nothing to do with this file — and the consequence is total: the
  // owner's bytes are not in history, so overwriting them is irreversible. `proceed`
  // is false, and it is one field so no caller re-derives the rule from `outcome`.
  const { git } = fakeGit({ porcelain: ` M ${REL}\n`, commitOk: false });

  assert.deepEqual(safetyCommit({ git, rel: REL }), { outcome: "refused", proceed: false });
});

test("safetyCommit: an unmerged tree is NEVER staged, and vetoes the adoption too", () => {
  // Same hazard and same answer as `commitEngineUpdate` and the session-start sweep:
  // `add -A` here would bury `<<<<<<<` markers in the files it stages.
  const { git, calls } = fakeGit({ porcelain: "UU CLAUDE.md\n" });

  assert.deepEqual(safetyCommit({ git, rel: REL }), { outcome: "conflicted", proceed: false });
  assert.deepEqual(calls, ["status --porcelain"], "it looked, and kept its hands off");
});

test("SAFETY_COMMIT_MESSAGE: findable a year later by someone who knows none of this machinery", () => {
  assert.equal(
    SAFETY_COMMIT_MESSAGE(REL),
    `safety: your ${REL} saved before taking the engine's version`,
  );
});

test("ADOPTION_BLOCKED_LINE: every non-proceeding outcome has a sentence, and only those", () => {
  // A veto the owner cannot read is a file that silently did not change — which is the
  // blind spot S10 exists to close, wearing a different coat. Each line says what was
  // NOT done, why, and the one thing that lifts it.
  assert.deepEqual(Object.keys(ADOPTION_BLOCKED_LINE).sort(), ["conflicted", "refused"]);
  assert.equal(
    ADOPTION_BLOCKED_LINE.refused(REL),
    `I left ${REL} exactly as it is: git would not save your current version first` +
      ` (often: no name/email set yet — git config --global user.email "you@example.com"),` +
      ` and I will not overwrite something I cannot give you back.`,
  );
  assert.equal(
    ADOPTION_BLOCKED_LINE.conflicted(REL),
    `I left ${REL} exactly as it is: your brain's repo has a merge in progress, so saving your` +
      ` current version first would bury the conflict markers. Finish that merge and ask me again.`,
  );
});

test("safetyCommit: the two blocking outcomes are exactly the two sentences", () => {
  // Anti-vacuous pairing: the map above could name any two keys and the tests would
  // still pass. This one walks the real outcomes and demands a sentence for each.
  const blocked = [
    safetyCommit({ git: fakeGit({ porcelain: ` M ${REL}\n`, commitOk: false }).git, rel: REL }),
    safetyCommit({ git: fakeGit({ porcelain: "UU CLAUDE.md\n" }).git, rel: REL }),
  ];

  assert.deepEqual(blocked.map((b) => b.proceed), [false, false]);
  for (const { outcome } of blocked) {
    assert.equal(typeof ADOPTION_BLOCKED_LINE[outcome], "function", `no sentence for ${outcome}`);
  }
});
