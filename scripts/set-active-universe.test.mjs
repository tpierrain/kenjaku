import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { realIo } from "./set-active-universe.mjs";
import { runSwitchCli, readActiveUniverse, readRegistry } from "./lib/universes.mjs";
import { runSwitchCliPersisted } from "./lib/universe-persist.mjs";
import { buildGit } from "./auto-commit.mjs";

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
  const repo = mkdtempSync(join(tmpdir(), "universe-repo-"));
  try {
    const raw = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" });
    raw(["init"]);
    raw(["config", "user.email", "test@example.com"]);
    raw(["config", "user.name", "Test"]);

    const res = runSwitchCliPersisted(realIo, join(repo, ".vault-rag"), ["create", "Acme"], {
      git: buildGit(repo),
      sleep: () => {},
    });

    assert.equal(res.code, 0);
    assert.doesNotMatch(res.message, /⚠️/u); // no remote → push skipped, silently
    const log = raw(["log", "--stat", "--format=%s"]);
    assert.match(log, /auto: switch active universe to 'acme'/);
    assert.match(log, /\.vault-rag\/active-universe/);
    assert.match(log, /\.vault-rag\/universes\.json/);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

// Review finding (v4.9.1), proved here on REAL git because it is exactly the kind
// of semantics a fake cannot vouch for: work the owner had STAGED before the
// switch must neither ride along in the switch commit nor lose its staged state.
test("realIo + real git: a switch leaves the owner's pre-staged work alone", () => {
  const repo = mkdtempSync(join(tmpdir(), "universe-repo-"));
  try {
    const raw = (args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" });
    raw(["init"]);
    raw(["config", "user.email", "test@example.com"]);
    raw(["config", "user.name", "Test"]);
    writeFileSync(join(repo, "secret-draft.md"), "not the switch's business\n");
    raw(["add", "secret-draft.md"]);

    const res = runSwitchCliPersisted(realIo, join(repo, ".vault-rag"), ["create", "Acme"], {
      git: buildGit(repo),
      sleep: () => {},
    });

    assert.equal(res.code, 0);
    const show = raw(["show", "--stat", "--format=%s", "HEAD"]);
    assert.match(show, /auto: switch active universe to 'acme'/);
    assert.doesNotMatch(show, /secret-draft\.md/);
    // …and it is still exactly where the owner left it: staged, uncommitted.
    assert.match(raw(["diff", "--cached", "--name-only"]), /secret-draft\.md/);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
