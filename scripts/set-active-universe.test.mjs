import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, existsSync, writeFileSync, cpSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { realIo } from "./set-active-universe.mjs";
import { runSwitchCli, readActiveUniverse, readRegistry } from "./lib/universes.mjs";
import {
  runSwitchCliPersisted,
  SWITCH_NOT_COMMITTED_WARNING,
} from "./lib/universe-persist.mjs";
import { PUSH_FAILED_WARNING } from "./auto-push.mjs";
import { buildGit } from "./auto-commit.mjs";

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));

// A throwaway git repo with an identity, so commits are accepted deterministically.
function tempGitRepo() {
  const repo = mkdtempSync(join(tmpdir(), "universe-repo-"));
  const raw = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" });
  raw(["init"]);
  raw(["config", "user.email", "test@example.com"]);
  raw(["config", "user.name", "Test"]);
  return { repo, raw };
}

// Proves the REAL fs adapter (realIo) — not the in-memory fake — actually creates
// the .vault-rag dir, writes the registry + pointer and reads them back. Uses a
// throwaway temp dir so the repo is never touched.
test("realIo: create-and-switch round-trips through the real filesystem", () => {
  const dir = join(mkdtempSync(join(tmpdir(), "universe-")), ".vault-rag");
  try {
    const res = runSwitchCli(realIo, dir, ["create", "Acme Corp"]);

    assert.equal(res.code, 0);
    assert.ok(existsSync(join(dir, "universes.json")));
    assert.deepEqual(readRegistry(realIo, dir), ["acme-corp"]);
    assert.equal(readActiveUniverse(realIo, dir), "acme-corp");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// The reported case of issue #69, end to end minus the argv shim: a switch on a
// REAL repo leaves a commit containing the pointer — it no longer survives as a
// dirty file waiting for a sweep that may lose to another machine's stale state.
test("realIo + real git: a switch commits the pointer it wrote", () => {
  const { repo, raw } = tempGitRepo();
  try {
    const res = runSwitchCliPersisted(realIo, join(repo, ".vault-rag"), ["create", "Acme"], {
      git: buildGit(repo),
      sleep: () => {},
    });

    assert.equal(res.code, 0);
    // No PERSISTENCE noise (no remote → push skipped, silently); asserted by
    // content, not by glyph — the connectors reminder owns a ⚠️ of its own.
    assert.ok(!res.message.includes(SWITCH_NOT_COMMITTED_WARNING));
    assert.ok(!res.message.includes(PUSH_FAILED_WARNING));
    const log = raw(["log", "--stat", "--format=%s"]);
    assert.match(log, /auto: switch active universe to 'acme'/);
    assert.match(log, /\.vault-rag\/active-universe/);
    assert.match(log, /\.vault-rag\/universes\.json/);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

// Review finding (v4.9.1), proved here on REAL git because it is exactly the kind
// of semantics a fake cannot vouch for: work the owner had STAGED, MODIFIED or
// merely left UNTRACKED before the switch must neither ride along in the switch
// commit nor change state.
test("realIo + real git: a switch leaves the owner's pending work alone (staged, dirty, untracked)", () => {
  const { repo, raw } = tempGitRepo();
  try {
    writeFileSync(join(repo, "tracked.md"), "v1\n");
    raw(["add", "tracked.md"]);
    raw(["commit", "-m", "seed"]);
    writeFileSync(join(repo, "tracked.md"), "v2, not yet committed\n"); // dirty
    writeFileSync(join(repo, "secret-draft.md"), "not the switch's business\n");
    raw(["add", "secret-draft.md"]); // staged
    writeFileSync(join(repo, "scratch.md"), "untracked\n"); // untracked

    const res = runSwitchCliPersisted(realIo, join(repo, ".vault-rag"), ["create", "Acme"], {
      git: buildGit(repo),
      sleep: () => {},
    });

    assert.equal(res.code, 0);
    const show = raw(["show", "--stat", "--format=%s", "HEAD"]);
    assert.match(show, /auto: switch active universe to 'acme'/);
    assert.doesNotMatch(show, /tracked\.md|secret-draft\.md|scratch\.md/);
    // …and everything is still exactly where the owner left it.
    const status = raw(["status", "--porcelain"]);
    assert.match(status, /^A {2}secret-draft\.md$/m);
    assert.match(status, /^ M tracked\.md$/m);
    assert.match(status, /^\?\? scratch\.md$/m);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

// The BLOCKER of the test review: nothing exercised the production wiring, so
// reverting the entry point to the pre-fix, non-persisting runSwitchCli left the
// whole suite green. This spawns the REAL script (the scripts/ tree is copied so
// its module-anchored brain root lands on the throwaway repo) and requires the
// commit — the exact regression this branch exists to prevent.
test("the REAL entry point persists: spawning set-active-universe.mjs commits the switch", () => {
  const { repo, raw } = tempGitRepo();
  try {
    cpSync(SCRIPTS_DIR, join(repo, "scripts"), { recursive: true });

    const out = execFileSync(
      process.execPath,
      [join(repo, "scripts", "set-active-universe.mjs"), "create", "Acme"],
      { cwd: repo, encoding: "utf8" }
    );

    assert.match(out, /created and switched to 'acme'/);
    const log = raw(["log", "--stat", "--format=%s"]);
    assert.match(log, /auto: switch active universe to 'acme'/);
    assert.match(log, /\.vault-rag\/active-universe/);
    assert.equal(
      readFileSync(join(repo, ".vault-rag", "active-universe"), "utf8").trim(),
      "acme"
    );
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
