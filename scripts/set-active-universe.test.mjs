import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
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
