import { test } from "node:test";
import assert from "node:assert/strict";
import {
  commitUniverseState,
  persistUniverseSwitch,
  runSwitchCliPersisted,
  switchCommitMessage,
  SWITCH_NOT_COMMITTED_WARNING,
} from "./universe-persist.mjs";
import { PUSH_FAILED_WARNING } from "../auto-push.mjs";
import { writeRegistry, writeActiveUniverse, readActiveUniverse } from "./universes.mjs";

const DIR = "/brain/.vault-rag";

// In-memory fs fake, same surface as universes.test.mjs's.
function fakeFs(initial = {}) {
  const files = new Map(Object.entries(initial));
  return {
    files,
    existsSync: (p) => files.has(p),
    readFileSync: (p) => {
      if (!files.has(p)) throw new Error(`ENOENT: ${p}`);
      return files.get(p);
    },
    writeFileSync: (p, data) => files.set(p, data),
    mkdirSync: () => {},
  };
}

// Recording git fake: `responses` maps a joined-args PREFIX to its {out, ok};
// anything unmapped succeeds with empty output. `calls` keeps the full sequence
// so a test can claim "this never committed" — not just "the result looked ok".
function fakeGit(responses = {}) {
  const calls = [];
  const git = (args) => {
    calls.push(args);
    const key = args.join(" ");
    for (const [prefix, res] of Object.entries(responses)) {
      if (key.startsWith(prefix)) return { out: "", ok: true, ...res };
    }
    return { out: "", ok: true };
  };
  git.calls = calls;
  return git;
}

const has = (calls, ...prefix) =>
  calls.some((args) => prefix.every((word, i) => args[i] === word));

// ── commitUniverseState: the commit half, scoped to the .vault-rag state ─────

test("commitUniverseState stages the .vault-rag state and commits with the switch message", () => {
  const git = fakeGit({
    "status --porcelain": { out: " M .vault-rag/active-universe\n" },
    "diff --cached --quiet": { ok: false }, // something IS staged
  });

  const result = commitUniverseState({ git, name: "acme" });

  assert.equal(result, "committed");
  assert.ok(has(git.calls, "add", "-A", "--", ".vault-rag"));
  assert.ok(has(git.calls, "commit", "-m", "auto: switch active universe to 'acme'"));
});

test("switchCommitMessage names the universe it switched to", () => {
  assert.equal(switchCommitMessage("blue-team"), "auto: switch active universe to 'blue-team'");
});

test("commitUniverseState reports clean when the switch changed nothing on disk", () => {
  // Unrelated dirt only: the scoped add stages nothing, so nothing is committed —
  // a /switch must never sweep the owner's pending notes under its own message.
  const git = fakeGit({
    "status --porcelain": { out: " M vault/pending-note.md\n" },
    "diff --cached --quiet": { ok: true }, // nothing staged
  });

  const result = commitUniverseState({ git, name: "acme" });

  assert.equal(result, "clean");
  assert.ok(!has(git.calls, "commit"));
});

test("commitUniverseState does not even stage on a fully clean tree", () => {
  const git = fakeGit({ "status --porcelain": { out: "" } });

  const result = commitUniverseState({ git, name: "acme" });

  assert.equal(result, "clean");
  assert.ok(!has(git.calls, "add"));
});

test("commitUniverseState refuses an unmerged tree without staging anything", () => {
  const git = fakeGit({ "status --porcelain": { out: "UU vault/note.md\n" } });

  const result = commitUniverseState({ git, name: "acme" });

  assert.equal(result, "conflicted");
  assert.ok(!has(git.calls, "add"));
  assert.ok(!has(git.calls, "commit"));
});

test("commitUniverseState reports failed when git refuses the commit", () => {
  const git = fakeGit({
    "status --porcelain": { out: " M .vault-rag/active-universe\n" },
    "diff --cached --quiet": { ok: false },
    commit: { ok: false, out: "fatal: no user.email" },
  });

  assert.equal(commitUniverseState({ git, name: "acme" }), "failed");
});

// ── persistUniverseSwitch: commit then push, reusing the Stop hook's opt-in ──

test("persistUniverseSwitch commits then pushes when the owner opted into autopush", () => {
  const git = fakeGit({
    "status --porcelain": { out: " M .vault-rag/active-universe\n" },
    "diff --cached --quiet": { ok: false },
    remote: { out: "origin\n" },
    "config --get secondbrain.autopush": { out: "true\n" },
    "rev-list --count": { out: "1\n" },
  });

  const result = persistUniverseSwitch({ git, sleep: () => {}, name: "acme" });

  assert.deepEqual(result, { commit: "committed", push: "pushed" });
  assert.ok(has(git.calls, "push"));
});

test("persistUniverseSwitch never pushes when the owner has not opted in", () => {
  const git = fakeGit({
    "status --porcelain": { out: " M .vault-rag/active-universe\n" },
    "diff --cached --quiet": { ok: false },
    remote: { out: "origin\n" },
    "config --get secondbrain.autopush": { out: "" },
  });

  const result = persistUniverseSwitch({ git, sleep: () => {}, name: "acme" });

  assert.deepEqual(result, { commit: "committed", push: "skipped" });
  assert.ok(!has(git.calls, "push"));
});

// ── runSwitchCliPersisted: the wired CLI — switch, then leave the machine ────

function twoUniverseFs() {
  const io = fakeFs();
  writeRegistry(io, DIR, ["acme", "blue"]);
  writeActiveUniverse(io, DIR, "acme");
  return io;
}

test("runSwitchCliPersisted persists a successful switch and keeps the message intact", () => {
  const io = twoUniverseFs();
  const git = fakeGit({
    "status --porcelain": { out: " M .vault-rag/active-universe\n" },
    "diff --cached --quiet": { ok: false },
  });

  const res = runSwitchCliPersisted(io, DIR, ["blue"], { git, sleep: () => {} });

  assert.equal(res.code, 0);
  assert.match(res.message, /switched to 'blue'/);
  assert.doesNotMatch(res.message, /⚠️/u);
  assert.equal(readActiveUniverse(io, DIR), "blue");
  assert.ok(has(git.calls, "commit", "-m", "auto: switch active universe to 'blue'"));
});

test("runSwitchCliPersisted touches git on neither a read-only command nor a refused switch", () => {
  for (const argv of [["list"], ["current"], [], ["ghost"]]) {
    const io = twoUniverseFs();
    const git = fakeGit();

    runSwitchCliPersisted(io, DIR, argv, { git, sleep: () => {} });

    assert.deepEqual(git.calls, [], `argv ${JSON.stringify(argv)} must not touch git`);
  }
});

test("runSwitchCliPersisted shouts when the switch could not be committed", () => {
  const io = twoUniverseFs();
  const git = fakeGit({
    "status --porcelain": { out: " M .vault-rag/active-universe\n" },
    "diff --cached --quiet": { ok: false },
    commit: { ok: false, out: "fatal: no user.email" },
  });

  const res = runSwitchCliPersisted(io, DIR, ["blue"], { git, sleep: () => {} });

  assert.equal(res.code, 0); // the switch itself DID happen on disk
  assert.match(res.message, /switched to 'blue'/);
  assert.ok(res.message.includes(SWITCH_NOT_COMMITTED_WARNING));
});

test("runSwitchCliPersisted relays the Stop hook's warning when the push failed", () => {
  const io = twoUniverseFs();
  const git = fakeGit({
    "status --porcelain": { out: " M .vault-rag/active-universe\n" },
    "diff --cached --quiet": { ok: false },
    remote: { out: "origin\n" },
    "config --get secondbrain.autopush": { out: "true\n" },
    "rev-list --count": { out: "1\n" },
    push: { ok: false, out: "network unreachable" },
  });

  const res = runSwitchCliPersisted(io, DIR, ["blue"], { git, sleep: () => {} });

  assert.equal(res.code, 0);
  assert.ok(res.message.includes(PUSH_FAILED_WARNING));
});
