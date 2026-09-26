// Tests for scripts/sync-report.mjs — the entry point `/sync` runs at its last step
// and relays verbatim (issue #131). Its decisions are in lib/sync-report.mjs; what is
// judged here is the WIRING: the facts it reads from git and from the arrivals trace,
// and its exit codes. Run as a real process, in a throwaway brain with a real remote,
// because import-based tests never execute a composition root.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "./sync-report.mjs";

const SCRIPTS = dirname(fileURLToPath(import.meta.url));

function git(cwd, args, env = {}) {
  return execFileSync("git", args, { cwd, encoding: "utf8", env: { ...process.env, ...env } }).trim();
}

// A brain (this machine) and a clone standing for the owner's OTHER machine, which
// commits under another email at a fixed date: Friday 2026-09-25, 17:05:11 UTC.
function world() {
  const root = mkdtempSync(join(tmpdir(), "sync-report-"));
  const remote = join(root, "remote.git");
  const brain = join(root, "brain");
  const other = join(root, "other");
  execFileSync("git", ["init", "-q", "--bare", "-b", "main", remote]);
  execFileSync("git", ["clone", "-q", remote, brain]);
  cpSync(SCRIPTS, join(brain, "scripts"), { recursive: true, filter: (src) => !src.includes("node_modules") });
  git(brain, ["config", "user.name", "Thomas Pierrain"]);
  git(brain, ["config", "user.email", "thomas@home.example"]);
  git(brain, ["checkout", "-q", "-b", "main"]);
  writeFileSync(join(brain, "README.md"), "brain\n");
  git(brain, ["add", "README.md"]);
  git(brain, ["commit", "-q", "-m", "init"]);
  git(brain, ["push", "-q", "-u", "origin", "main"]);

  execFileSync("git", ["clone", "-q", remote, other]);
  git(other, ["config", "user.name", "Thomas Pierrain"]);
  git(other, ["config", "user.email", "thomas@work.example"]);
  return { brain, other };
}

function pushFromOtherMachine(other, rel, author = {}) {
  const at = "2026-09-25T17:05:11Z";
  execFileSync("mkdir", ["-p", join(other, dirname(rel))]);
  writeFileSync(join(other, rel), "# a note\n");
  git(other, ["add", rel]);
  git(other, ["commit", "-q", "-m", `add ${rel}`], { GIT_AUTHOR_DATE: at, GIT_COMMITTER_DATE: at, ...author });
  git(other, ["push", "-q", "origin", "main"]);
}

const runReport = (brain, args) =>
  spawnSync(process.execPath, [join(brain, "scripts", "sync-report.mjs"), ...args], {
    cwd: brain,
    encoding: "utf8",
    env: { ...process.env, TZ: "Europe/Paris" },
  });

test("the incident: nothing to rebase, an announced arrival on record → the report dates it", () => {
  const { brain, other } = world();
  pushFromOtherMachine(other, "vault/notes/prep.md");
  // The live sync pulled it the evening before, and a session announced it.
  git(brain, ["pull", "-q", "--rebase"]);
  writeFileSync(
    join(brain, "remote-arrivals.json"),
    JSON.stringify({
      arrivedAt: "2026-09-25T17:06:29.000Z",
      files: ["vault/notes/prep.md"],
      authors: ["Thomas Pierrain"],
      blocked: null,
      announcedAt: "2026-09-26T06:13:02.000Z",
    }),
  );
  const before = git(brain, ["rev-parse", "HEAD"]);
  git(brain, ["fetch", "-q", "origin"]);
  git(brain, ["rebase", "-q", "origin/main"]);

  const run = runReport(brain, ["--before", before, "--committed", "no", "--pushed", "ok"]);
  assert.equal(run.stderr, "");
  assert.equal(run.status, 0);
  assert.equal(
    run.stdout,
    [
      "✅ Nothing new since Friday 25 Sep at 19:06, when the automatic sync had already brought 1 file (1 of them note) here from your other machine.",
      "📤 Last push the remote received: Friday 25 Sep at 19:05, from your other machine (thomas@work.example).",
      "This /sync: local commit no · push sent.",
      "",
    ].join("\n"),
  );
});

test("files this /sync pulled are read from the rebase itself, and a missing trace invents no arrival", () => {
  const { brain, other } = world();
  const before = git(brain, ["rev-parse", "HEAD"]);
  pushFromOtherMachine(other, "vault/notes/a.md");
  pushFromOtherMachine(other, "scripts-extra/tool.mjs");
  git(brain, ["fetch", "-q", "origin"]);
  git(brain, ["rebase", "-q", "origin/main"]);

  const run = runReport(brain, ["--before", before, "--committed", "yes", "--pushed", "failed"]);
  assert.equal(run.status, 0);
  assert.equal(
    run.stdout,
    [
      "📥 This /sync brought 2 files (1 of them note).",
      "📤 Last push the remote received: Friday 25 Sep at 19:05, from your other machine (thomas@work.example).",
      "This /sync: local commit yes · push failed.",
      "",
    ].join("\n"),
  );
});

test("a missing or malformed argument → exit 2 and nothing on stdout: a report built on a guess is not relayed", () => {
  const { brain } = world();
  const head = git(brain, ["rev-parse", "HEAD"]);
  for (const args of [
    [],
    ["--committed", "no", "--pushed", "ok"],
    ["--before", head, "--committed", "maybe", "--pushed", "ok"],
    ["--before", head, "--committed", "no", "--pushed", "sent"],
    ["--before", "not-a-commit", "--committed", "no", "--pushed", "ok"],
  ]) {
    const run = runReport(brain, args);
    assert.equal(run.status, 2, `args: ${args.join(" ")}`);
    assert.equal(run.stdout, "", `args: ${args.join(" ")}`);
  }
});

test("parseArgs: the three values, and nothing borrowed from a neighbouring flag", () => {
  assert.deepEqual(parseArgs(["--before", "abc", "--committed", "yes", "--pushed", "failed"]), {
    before: "abc",
    committed: true,
    pushed: "failed",
  });
  assert.deepEqual(parseArgs(["--pushed", "ok", "--committed", "no", "--before", "abc"]), { before: "abc", committed: false, pushed: "ok" });
  // Without --before, "--committed" must not be read as the missing flag's value.
  assert.equal(parseArgs(["--committed", "no", "--pushed", "ok"]), null);
  assert.equal(parseArgs(["--before", "abc", "--pushed", "ok"]), null);
});

test("a push made from THIS machine is said as such, read from this machine's own git email", () => {
  const { brain } = world();
  const before = git(brain, ["rev-parse", "HEAD"]);
  const run = runReport(brain, ["--before", before, "--committed", "no", "--pushed", "ok"]);
  assert.equal(run.status, 0);
  assert.match(run.stdout.split("\n")[1], /, under the same git identity as this machine\.$/);
});

test("the owner's own registry fuses a second spelling into 'your other machine'", () => {
  const { brain, other } = world();
  const before = git(brain, ["rev-parse", "HEAD"]);
  pushFromOtherMachine(other, "vault/notes/a.md", { GIT_COMMITTER_NAME: "tpierrain", GIT_COMMITTER_EMAIL: "t@work.example" });
  git(brain, ["fetch", "-q", "origin"]);
  git(brain, ["rebase", "-q", "origin/main"]);
  execFileSync("mkdir", ["-p", join(brain, ".vault-rag")]);
  writeFileSync(join(brain, ".vault-rag", "authors.json"), JSON.stringify({ identities: [{ name: "Thomas Pierrain", aka: ["tpierrain"] }], distinct: [] }));

  const run = runReport(brain, ["--before", before, "--committed", "no", "--pushed", "ok"]);
  assert.equal(run.status, 0);
  assert.equal(run.stdout.split("\n")[1], "📤 Last push the remote received: Friday 25 Sep at 19:05, from your other machine (t@work.example).");
});

test("a branch with no upstream: the remote line says unknown, the report still prints", () => {
  const { brain } = world();
  git(brain, ["checkout", "-q", "-b", "local-only"]);
  const before = git(brain, ["rev-parse", "HEAD"]);
  const run = runReport(brain, ["--before", before, "--committed", "no", "--pushed", "failed"]);
  assert.equal(run.status, 0);
  assert.equal(run.stdout.split("\n")[1], "📤 Last push the remote received: unknown (the remote branch could not be read).");
});
