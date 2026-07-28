import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { buildGit } from "../auto-commit.mjs";

import { sweepThenPull, SWEEP_MESSAGE } from "./startup-sync.mjs";

// Fake git keyed on the FULL command (never on args[0]): a partial key lets every
// later arg-string mutant survive. `calls` records the whole sequence so a test can
// pin the exact commands AND their order — which is the whole point here. Outputs
// carry the trailing newline a real git emits, so production `.trim()`s stay pinned.
function fakeGit({ porcelain = "", remote = "origin\n", pull = { out: "Already up to date.\n", ok: true } } = {}) {
  const calls = [];
  const git = (args) => {
    const cmd = args.join(" ");
    calls.push(cmd);
    if (cmd === "status --porcelain") return { out: porcelain, ok: true };
    if (cmd === "remote") return { out: remote, ok: true };
    if (cmd === "pull --rebase") return { out: pull.out, ok: pull.ok };
    return { out: "", ok: true };
  };
  return { git, calls };
}

test("sweepThenPull: a dirty tree is committed BEFORE the pull — the very thing that unblocks it", () => {
  // What an engine update leaves behind, plus a note edited in Obsidian.
  const { git, calls } = fakeGit({ porcelain: " M scripts/lib/repo-status.mjs\n?? vault/note.md\n" });

  const outcome = sweepThenPull({ git });

  assert.deepEqual(calls, [
    "status --porcelain",
    "add -A",
    "commit -m auto: session-start sweep (outside-Claude edits or engine writes)",
    "remote",
    "pull --rebase",
  ]);
  assert.equal(outcome.swept, "committed");
});

test("sweepThenPull: a clean tree pulls straight away, with NO empty commit", () => {
  // A clean `git status --porcelain` can hand back a lone newline rather than an
  // empty string. Read literally that is "dirty" → an empty commit at every start.
  const { git, calls } = fakeGit({ porcelain: "\n" });

  const outcome = sweepThenPull({ git });

  assert.deepEqual(calls, ["status --porcelain", "remote", "pull --rebase"]);
  assert.equal(outcome.swept, "clean");
});

test("sweepThenPull: a brain with NO remote still gets swept, and never pulls", () => {
  // Purely local usage: nothing to pull from, but the sweep still owes the user a
  // versioned note. The banner must read as up-to-date, not as a failed pull.
  const { git, calls } = fakeGit({ porcelain: "?? vault/note.md\n", remote: "\n" });

  const outcome = sweepThenPull({ git });

  assert.deepEqual(calls, [
    "status --porcelain",
    "add -A",
    `commit -m ${SWEEP_MESSAGE}`,
    "remote",
  ]);
  assert.deepEqual(outcome, { swept: "committed", pullOk: true, pullOut: "already up to date" });
});

test("sweepThenPull: a pull that fails anyway is handed back verbatim, so the banner can say WHY", () => {
  // The sweep is not a cure-all: a diverged history, an auth failure or an offline
  // remote still fails. What must NOT happen is losing git's own words on the way.
  const { git } = fakeGit({
    pull: { out: "fatal: could not read Username for 'https://github.com': terminal prompts disabled\n", ok: false },
  });

  const outcome = sweepThenPull({ git });

  assert.deepEqual(outcome, {
    swept: "clean",
    pullOk: false,
    pullOut: "fatal: could not read Username for 'https://github.com': terminal prompts disabled\n",
  });
});

test("sweepThenPull: an unresolved conflict is NEVER swept — committing it would bury the markers", () => {
  // A rebase stopped on a conflict leaves unmerged paths. `add -A && commit` there
  // would record `<<<<<<<` markers into the user's note AND fake-resolve the rebase.
  // We keep our hands off and let the pull fail loudly instead — the banner says why.
  const { git, calls } = fakeGit({
    porcelain: "UU vault/note.md\n M scripts/lib/repo-status.mjs\n",
    pull: { out: "fatal: It seems that there is already a rebase-merge directory\n", ok: false },
  });

  const outcome = sweepThenPull({ git });

  assert.deepEqual(calls, ["status --porcelain", "remote", "pull --rebase"]);
  assert.equal(outcome.swept, "conflicted");
});

// ── Against a REAL git repo with a REAL remote ───────────────────────────────
// The fake above proves the DECISION and its order; only this proves the EFFECT —
// that a brain which had stopped syncing starts syncing again. That effect is the
// entire reason this code exists, and no fake git can show it.
function makeBrainWithRemote() {
  const root = mkdtempSync(join(tmpdir(), "sbg-startup-sync-"));
  const origin = join(root, "origin.git");
  const brain = join(root, "brain");
  const run = (dir) => (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" });
  execFileSync("git", ["init", "--bare", "--quiet", "--initial-branch=main", origin]);
  execFileSync("git", ["clone", "--quiet", origin, brain]);
  const git = run(brain);
  // A CI runner has no global git identity → configure one locally or `commit` fails.
  git("config", "user.email", "test@example.invalid");
  git("config", "user.name", "Test");
  writeFileSync(join(brain, "engine-manifest.json"), '{"ref":"v4.2.0"}\n');
  git("add", "-A");
  git("commit", "--quiet", "-m", "initial");
  git("push", "--quiet", "-u", "origin", "main");
  return { root, brain, git };
}

// Simulates the OTHER machine: pushes a note to the shared remote.
function pushFromElsewhere({ root, message }) {
  const other = join(root, "other");
  execFileSync("git", ["clone", "--quiet", join(root, "origin.git"), other]);
  const git = (...args) => execFileSync("git", args, { cwd: other, encoding: "utf8" });
  git("config", "user.email", "other@example.invalid");
  git("config", "user.name", "Other");
  mkdirSync(join(other, "vault"), { recursive: true });
  writeFileSync(join(other, "vault", "from-elsewhere.md"), `# ${message}\n`, { flag: "w" });
  git("add", "-A");
  git("commit", "--quiet", "-m", message);
  git("push", "--quiet");
}

test("sweepThenPull: a brain left dirty by an update SYNCS AGAIN — the bug this whole change exists for", (t) => {
  const { root, brain, git } = makeBrainWithRemote();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(brain, "vault"), { recursive: true });
  pushFromElsewhere({ root, message: "note written on the other machine" });
  // The dirt no Claude hook ever sees: an engine update's own files, and a note
  // edited in Obsidian. Before the sweep, THIS is what blocked every startup pull.
  writeFileSync(join(brain, "engine-manifest.json"), '{"ref":"v4.2.1"}\n');
  writeFileSync(join(brain, "vault", "edited-in-obsidian.md"), "# typed outside Claude\n");

  const outcome = sweepThenPull({ git: buildGit(brain) });

  assert.equal(outcome.swept, "committed");
  assert.equal(outcome.pullOk, true, `the pull must succeed now: ${outcome.pullOut}`);
  // The three proofs that matter: the remote's note landed, the local dirt is
  // versioned (not dropped), and the tree is clean for the NEXT start.
  assert.ok(existsSync(join(brain, "vault", "from-elsewhere.md")), "the other machine's note arrived");
  assert.equal(git("status", "--porcelain").trim(), "");
  // The rebase replayed the sweep commit on top → it IS the new HEAD.
  assert.equal(git("log", "-1", "--format=%s").trim(), SWEEP_MESSAGE);
  const swept = git("show", "--name-only", "--format=", "HEAD").trim().split("\n").sort();
  assert.deepEqual(swept, ["engine-manifest.json", "vault/edited-in-obsidian.md"]);
});

test("sweepThenPull: a REAL conflicted rebase is left untouched — no marker is ever committed", (t) => {
  const { root, brain, git } = makeBrainWithRemote();
  t.after(() => rmSync(root, { recursive: true, force: true }));
  // Both machines rewrite the same line → the rebase stops on a conflict.
  writeFileSync(join(brain, "engine-manifest.json"), '{"ref":"local"}\n');
  git("add", "-A");
  git("commit", "--quiet", "-m", "local edit");
  const other = join(root, "other");
  execFileSync("git", ["clone", "--quiet", join(root, "origin.git"), other]);
  const otherGit = (...args) => execFileSync("git", args, { cwd: other, encoding: "utf8" });
  otherGit("config", "user.email", "other@example.invalid");
  otherGit("config", "user.name", "Other");
  writeFileSync(join(other, "engine-manifest.json"), '{"ref":"remote"}\n');
  otherGit("add", "-A");
  otherGit("commit", "--quiet", "-m", "remote edit");
  otherGit("push", "--quiet");
  sweepThenPull({ git: buildGit(brain) }); // leaves the brain mid-rebase, conflicted

  const outcome = sweepThenPull({ git: buildGit(brain) }); // the NEXT session start

  assert.equal(outcome.swept, "conflicted");
  assert.equal(outcome.pullOk, false, "a conflicted tree cannot pull — and must not pretend to");
  // The markers are still THERE for the user to resolve, and never got committed.
  assert.match(readFileSync(join(brain, "engine-manifest.json"), "utf8"), /^<{7} /m);
  // Mid-rebase HEAD sits on the upstream commit, so the claim has to be made over
  // the WHOLE history: nowhere did the sweep slip a commit in.
  assert.doesNotMatch(git("log", "--all", "--format=%s"), new RegExp(SWEEP_MESSAGE.replace(/[()]/g, "\\$&")));
});


