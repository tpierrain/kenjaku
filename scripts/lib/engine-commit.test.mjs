import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { commitEngineUpdate, defaultCommitEngineWrites } from "./engine-commit.mjs";

// Fake git keyed on the FULL command (never on args[0]): a partial key lets every
// later arg-string mutant survive. `calls` records the whole sequence so the test
// pins the exact commands, message included. Outputs carry the trailing newline a
// real git emits, so production `.trim()`s stay pinned.
function fakeGit({ porcelain = "" } = {}) {
  const calls = [];
  const git = (args) => {
    calls.push(args.join(" "));
    if (args.join(" ") === "status --porcelain") return { out: porcelain, ok: true };
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
