import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, existsSync, writeFileSync, cpSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { realIo, runSetActiveUniverse } from "./set-active-universe.mjs";
import { runSwitchCli, readActiveUniverse, readRegistry } from "./lib/universes.mjs";
import {
  runSwitchCliPersisted,
  SWITCH_NOT_COMMITTED_WARNING,
} from "./lib/universe-persist.mjs";
import { PUSH_FAILED_WARNING } from "./auto-push.mjs";
import { buildGit } from "./auto-commit.mjs";

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const CLI = join(SCRIPTS_DIR, "set-active-universe.mjs");

// ─────────────────────────────────────────────────────────────────────────────
// runSetActiveUniverse — the CLI body extracted behind an injected `deps` port
// (the S0bis conversion), so it is importable and testable without ever running
// the real process (this CLI commits + pushes — see the process-spawn test at
// the bottom of this file, and NEVER add another one that invokes it live).
// ─────────────────────────────────────────────────────────────────────────────

// A scripted deps port: an in-memory io (empty vault-rag dir by default), a
// git runner that records every call and answers from a lookup table, an inert
// sleep, and a log sink. Every field mirrors realSwitchDeps' shape.
function fakeDeps(overrides = {}) {
  const logs = [];
  const gitCalls = [];
  const seenPaths = [];
  const deps = {
    io: {
      existsSync: (p) => {
        seenPaths.push(p);
        return false;
      },
      readFileSync: () => "",
      writeFileSync: () => {},
      mkdirSync: () => {},
    },
    vaultRagDir: "/brain/.vault-rag",
    git: (args) => {
      gitCalls.push(args);
      return { out: "", ok: true };
    },
    sleep: () => {},
    log: (m) => logs.push(m),
    ...overrides,
  };
  return { deps, logs, gitCalls, seenPaths };
}

test("runSetActiveUniverse — a read-only action logs the switch's message, returns its code, and never touches git", () => {
  const { deps, logs, gitCalls } = fakeDeps();
  const code = runSetActiveUniverse(["current"], deps);
  assert.equal(code, 0);
  assert.deepEqual(logs, ["default"]);
  assert.deepEqual(gitCalls, [], "current never writes, so persistence must never touch git");
});

test("runSetActiveUniverse — a refused switch returns the non-zero code the switch produced", () => {
  const { deps, logs } = fakeDeps();
  const code = runSetActiveUniverse(["switch", "nope"], deps);
  assert.equal(code, 1);
  assert.deepEqual(logs, ["unknown universe 'nope'. available: default"]);
});

test("runSetActiveUniverse — create threads the injected vaultRagDir + io + git through to the persisted switch", () => {
  // Registry already holds one universe (so creating a second never opens the
  // onboarding gate, keeping the expected message a single line) and a clean
  // tree (git status --porcelain empty), so the commit is a no-op "clean".
  const seenPaths = [];
  const { deps, logs, gitCalls } = fakeDeps({
    io: {
      existsSync: (p) => {
        seenPaths.push(p);
        return p.endsWith("universes.json");
      },
      readFileSync: () => JSON.stringify({ universes: ["beta"] }),
      writeFileSync: () => {},
      mkdirSync: () => {},
    },
  });

  const code = runSetActiveUniverse(["create", "Acme"], deps);

  assert.equal(code, 0);
  assert.deepEqual(logs, ["created and switched to 'acme'"]);
  assert.deepEqual(gitCalls, [["status", "--porcelain"]]);
  assert.ok(
    seenPaths.includes("/brain/.vault-rag/universes.json"),
    "the registry read must resolve under the INJECTED vaultRagDir, not a default",
  );
});

test("runSetActiveUniverse — a committed switch threads the injected sleep into the push retry, and reports a failed push", () => {
  const responses = {
    "status --porcelain": { out: " M .vault-rag/active-universe\n", ok: true },
    // No merge/rebase/cherry-pick in progress — each probe reports "not found".
    "rev-parse -q --verify MERGE_HEAD": { out: "", ok: false },
    "rev-parse -q --verify REBASE_HEAD": { out: "", ok: false },
    "rev-parse -q --verify CHERRY_PICK_HEAD": { out: "", ok: false },
    "add -A -- .vault-rag": { out: "", ok: true },
    "diff --cached --quiet -- .vault-rag": { out: "", ok: false }, // staged changes exist
    "commit -m auto: switch active universe to 'acme' -- .vault-rag": { out: "", ok: true },
    remote: { out: "origin\n", ok: true },
    "config --get secondbrain.autopush": { out: "true\n", ok: true },
    "rev-parse --abbrev-ref --symbolic-full-name @{u}": { out: "origin/main\n", ok: true },
    "rev-list --count @{u}..HEAD": { out: "1\n", ok: true },
    push: { out: "", ok: false },
  };
  const gitCalls = [];
  // Anything NOT scripted above fails closed (ok:false) — the merge/rebase
  // probes rely on this: an unscripted "found" would silently defer the switch.
  const git = (args) => {
    gitCalls.push(args);
    return responses[args.join(" ")] ?? { out: "", ok: false };
  };
  const sleepCalls = [];
  const { deps, logs } = fakeDeps({
    io: {
      existsSync: (p) => p.endsWith("universes.json"),
      readFileSync: () => JSON.stringify({ universes: ["beta"] }),
      writeFileSync: () => {},
      mkdirSync: () => {},
    },
    git,
    sleep: (ms) => sleepCalls.push(ms),
  });

  const code = runSetActiveUniverse(["create", "Acme"], deps);

  assert.equal(code, 0);
  assert.deepEqual(logs, ["created and switched to 'acme'" + PUSH_FAILED_WARNING]);
  assert.deepEqual(sleepCalls, [3000], "the retry pause must go through the INJECTED sleep");
  assert.deepEqual(
    gitCalls.filter((c) => c[0] === "push"),
    [["push"], ["push"]],
    "one push, one retry, both through the INJECTED git",
  );
});

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

test("the CLI, IMPORTED rather than run — the body must not fire on import", async () => {
  // The whole point of the tail: importing the module runs nothing — no pointer
  // write, no commit, no push. Asserted from a child process so an accidental
  // process.exit() (or, far worse, a fired switch) cannot take the suite with it.
  const probe = `import("${pathToFileURL(CLI).href}").then(() => { console.log("imported-and-still-alive"); });`;
  const run = spawnSync(process.execPath, ["--input-type=module", "-e", probe], { encoding: "utf8" });

  assert.equal(run.status, 0, `importing the CLI must not exit — stderr: ${run.stderr}`);
  assert.equal(run.stdout.trim(), "imported-and-still-alive");
});
