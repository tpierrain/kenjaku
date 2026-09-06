import { test } from "node:test";
import assert from "node:assert/strict";
import {
  commitUniverseState,
  commitVaultRagState,
  persistUniverseSwitch,
  persistVaultRagChange,
  runSwitchCliPersisted,
  switchCommitMessage,
  SWITCH_NOT_COMMITTED_WARNING,
  SWITCH_COMMIT_DEFERRED_NOTE,
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

// Recording git fake, EXACT-keyed on the full command (args.join(" ")) with a
// STRICT default: an unmapped command answers {ok:false} — same discipline (and
// same reason) as auto-push.test.mjs's makeGit. Mutating ANY arg — dropping the
// `-- .vault-rag` pathspec included — produces an unknown command, a broken
// answer, a failed happy path: the mutant dies structurally. Commits are COUNTED
// so an unmapped `rev-list` answers like real git (a commit the code just made
// becomes pending): a mutant pushing BEFORE the commit reads 0 pending, skips
// the push, and fails the ordering assertion.
function fakeGit(responses = {}) {
  const calls = [];
  let commits = 0;
  const git = (args) => {
    calls.push(args);
    const key = args.join(" ");
    if (key === "rev-list --count @{u}..HEAD" && !(key in responses)) {
      return { out: `${commits}\n`, ok: true };
    }
    const mapped = responses[key];
    const result = mapped ? { out: "", ok: true, ...mapped } : { out: "", ok: false };
    if (result.ok && args[0] === "commit") commits += 1;
    return result;
  };
  git.calls = calls;
  return git;
}

const keysOf = (git) => git.calls.map((args) => args.join(" "));
const has = (git, key) => keysOf(git).includes(key);

// The exact commands of a healthy acme-bound persistence, spelled out once.
const MSG_ACME = "auto: switch active universe to 'acme'";
const MSG_BLUE = "auto: switch active universe to 'blue'";
const commitPath = (msg, status = " M .vault-rag/active-universe\n") => ({
  "status --porcelain": { out: status },
  "add -A -- .vault-rag": {},
  "diff --cached --quiet -- .vault-rag": { ok: false }, // our files ARE staged
  [`commit -m ${msg} -- .vault-rag`]: {},
});
// A push-ready repo, opted in — mapped EXPLICITLY (an upstream by accident is a
// test lying about its arrangement).
const pushReady = () => ({
  "remote": { out: "origin\n" },
  "config --get secondbrain.autopush": { out: "true\n" },
  "rev-parse --abbrev-ref --symbolic-full-name @{u}": { out: "origin/main\n" },
  "push": {},
});

// ── commitUniverseState: the commit half, scoped to the .vault-rag state ─────

test("commitUniverseState stages the .vault-rag state and commits with the switch message", () => {
  const git = fakeGit(commitPath(MSG_ACME));

  const result = commitUniverseState({ git, name: "acme" });

  assert.equal(result, "committed");
  assert.ok(has(git, "add -A -- .vault-rag"));
  assert.ok(has(git, `commit -m ${MSG_ACME} -- .vault-rag`));
});

test("switchCommitMessage names the universe it switched to", () => {
  assert.equal(switchCommitMessage("blue-team"), "auto: switch active universe to 'blue-team'");
});

// `.vault-rag` stopped being only the universe pointer: the duo-mode answers
// (`authors.json`) live there too and must travel the same way, for the same reason.
// So the MESSAGE is a parameter and the scoping, the opt-in and the retry stay in
// one place — a second copy of this would be a second, subtly different notion of
// "commit the state that travels".
test("commitVaultRagState carries whatever message its caller owns, with the same scoping", () => {
  const message = "auto: tpierrain is Thomas Pierrain on another machine";
  const git = fakeGit(commitPath(message, " M .vault-rag/authors.json\n"));

  assert.equal(commitVaultRagState({ git, message }), "committed");

  assert.deepEqual(
    git.calls.filter((a) => a[0] === "commit"),
    [["commit", "-m", message, "--", ".vault-rag"]],
  );
});

test("persistVaultRagChange commits THEN pushes, exactly as a switch does", () => {
  const message = "auto: Claire Dubois is a second person in this brain";
  const git = fakeGit({ ...commitPath(message, " M .vault-rag/authors.json\n"), ...pushReady() });

  assert.deepEqual(persistVaultRagChange({ git, sleep: () => {}, message }), {
    commit: "committed",
    push: "pushed",
  });
  const keys = keysOf(git);
  assert.ok(keys.findIndex((k) => k.startsWith("commit ")) < keys.indexOf("push"), keys.join(" | "));
});

test("commitUniverseState scopes BOTH the emptiness gate and the commit to .vault-rag (review finding, v4.9.1)", () => {
  // Proved on a throwaway repo: an unscoped `git commit -m` swept the owner's
  // PRE-STAGED work (e.g. half-finished conflict resolutions, a staged draft)
  // under the switch message. The pathspec keeps the commit surgical. The strict
  // fake already refuses unscoped variants; the deepEqual pins the exact shape.
  const git = fakeGit(
    commitPath(MSG_ACME, " M .vault-rag/active-universe\nM  vault/secret-draft.md\n")
  );

  const result = commitUniverseState({ git, name: "acme" });

  assert.equal(result, "committed");
  assert.deepEqual(
    git.calls.filter((a) => a[0] === "diff"),
    [["diff", "--cached", "--quiet", "--", ".vault-rag"]]
  );
  assert.deepEqual(
    git.calls.filter((a) => a[0] === "commit"),
    [["commit", "-m", MSG_ACME, "--", ".vault-rag"]]
  );
});

test("commitUniverseState reports clean when the switch changed nothing on disk", () => {
  // Unrelated dirt only: the scoped add stages nothing, so nothing is committed —
  // a /switch must never sweep the owner's pending notes under its own message.
  const git = fakeGit({
    "status --porcelain": { out: " M vault/pending-note.md\n" },
    "add -A -- .vault-rag": {},
    "diff --cached --quiet -- .vault-rag": { ok: true }, // nothing of OURS staged
  });

  const result = commitUniverseState({ git, name: "acme" });

  assert.equal(result, "clean");
  assert.ok(!git.calls.some((a) => a[0] === "commit"));
});

test("commitUniverseState does not even stage on a fully clean tree", () => {
  const git = fakeGit({ "status --porcelain": { out: "" } });

  const result = commitUniverseState({ git, name: "acme" });

  assert.equal(result, "clean");
  assert.ok(!git.calls.some((a) => a[0] === "add"));
});

test("commitUniverseState refuses an unmerged tree without staging anything", () => {
  const git = fakeGit({ "status --porcelain": { out: "UU vault/note.md\n" } });

  const result = commitUniverseState({ git, name: "acme" });

  assert.equal(result, "conflicted");
  assert.ok(!git.calls.some((a) => a[0] === "add"));
  assert.ok(!git.calls.some((a) => a[0] === "commit"));
});

test("commitUniverseState DEFERS during a merge in progress (partial commits are refused there)", () => {
  // Reproduced on a real repo (correctness review, v4.9.1): once a merge's
  // conflicts are resolved and staged, treeState reads "dirty" again — but
  // `git commit -- pathspec` is a PARTIAL commit and git refuses it mid-merge
  // ("fatal: cannot do a partial commit during a merge"). Deferring to the
  // Stop-hook sweep is the correct move: it commits unscoped at turn end.
  const git = fakeGit({
    "status --porcelain": { out: " M .vault-rag/active-universe\n" },
    "rev-parse -q --verify MERGE_HEAD": {},
  });

  const result = commitUniverseState({ git, name: "acme" });

  assert.equal(result, "deferred");
  assert.ok(!git.calls.some((a) => a[0] === "add"), "a paused merge is left untouched");
});

test("commitUniverseState DEFERS during a rebase too (same partial-commit refusal)", () => {
  const git = fakeGit({
    "status --porcelain": { out: " M .vault-rag/active-universe\n" },
    "rev-parse -q --verify REBASE_HEAD": {},
  });

  assert.equal(commitUniverseState({ git, name: "acme" }), "deferred");
});

test("commitUniverseState reports failed when git refuses the ADD (index.lock tier)", () => {
  // The one failure mode a second brain must never paper over (cf. auto-commit):
  // a refused add reported as "clean" would claim persistence that never happened.
  const git = fakeGit({
    "status --porcelain": { out: " M .vault-rag/active-universe\n" },
    "add -A -- .vault-rag": { ok: false, out: "fatal: Unable to create '.git/index.lock'" },
  });

  assert.equal(commitUniverseState({ git, name: "acme" }), "failed");
  assert.ok(!git.calls.some((a) => a[0] === "commit"));
});

test("commitUniverseState reports failed when git refuses the commit", () => {
  const git = fakeGit({
    ...commitPath(MSG_ACME),
    [`commit -m ${MSG_ACME} -- .vault-rag`]: { ok: false, out: "fatal: no user.email" },
  });

  assert.equal(commitUniverseState({ git, name: "acme" }), "failed");
});

// ── persistUniverseSwitch: commit then push, reusing the Stop hook's opt-in ──

test("persistUniverseSwitch commits THEN pushes when the owner opted into autopush", () => {
  // Nothing pending beforehand: the push only has work BECAUSE the commit ran
  // first (the fake's rev-list counts commits, like real git). A swapped order
  // reads 0 pending, skips, and fails both assertions — the twin of the
  // ordering pin in auto-push.test.mjs, absent here until the test review.
  const git = fakeGit({ ...commitPath(MSG_ACME), ...pushReady() });

  const result = persistUniverseSwitch({ git, sleep: () => {}, name: "acme" });

  assert.deepEqual(result, { commit: "committed", push: "pushed" });
  const keys = keysOf(git);
  assert.ok(
    keys.findIndex((k) => k.startsWith("commit ")) < keys.indexOf("push"),
    `commit must precede push, got: ${keys.join(" | ")}`
  );
});

test("persistUniverseSwitch never pushes when the owner has not opted in", () => {
  const git = fakeGit({
    ...commitPath(MSG_ACME),
    "remote": { out: "origin\n" },
    "config --get secondbrain.autopush": { out: "" },
    "rev-parse --abbrev-ref --symbolic-full-name @{u}": { out: "origin/main\n" },
  });

  const result = persistUniverseSwitch({ git, sleep: () => {}, name: "acme" });

  assert.deepEqual(result, { commit: "committed", push: "skipped" });
  assert.ok(!has(git, "push"));
});

test("persistUniverseSwitch does not push AT ALL unless this switch committed (review finding)", () => {
  // A failed or deferred commit must not turn the switch into a push of
  // unrelated local commits (worst shape: pushing mid-rebase).
  const git = fakeGit({
    ...commitPath(MSG_ACME),
    ...pushReady(),
    [`commit -m ${MSG_ACME} -- .vault-rag`]: { ok: false, out: "fatal: no user.email" },
  });

  const result = persistUniverseSwitch({ git, sleep: () => {}, name: "acme" });

  assert.deepEqual(result, { commit: "failed", push: "skipped" });
  assert.ok(!has(git, "push"));
});

// ── runSwitchCliPersisted: the wired CLI — switch, then leave the machine ────

function twoUniverseFs() {
  const io = fakeFs();
  writeRegistry(io, DIR, ["acme", "blue"]);
  writeActiveUniverse(io, DIR, "acme");
  return io;
}

const noPersistenceWarning = (message) => {
  assert.ok(!message.includes(SWITCH_NOT_COMMITTED_WARNING));
  assert.ok(!message.includes(PUSH_FAILED_WARNING));
};

test("runSwitchCliPersisted persists a successful switch and keeps the message intact", () => {
  const io = twoUniverseFs();
  const git = fakeGit(commitPath(MSG_BLUE));

  const res = runSwitchCliPersisted(io, DIR, ["blue"], { git, sleep: () => {} });

  assert.equal(res.code, 0);
  assert.match(res.message, /switched to 'blue'/);
  noPersistenceWarning(res.message); // the connectors reminder may carry its own ⚠️
  assert.equal(readActiveUniverse(io, DIR), "blue");
  assert.ok(has(git, `commit -m ${MSG_BLUE} -- .vault-rag`));
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
    ...commitPath(MSG_BLUE),
    [`commit -m ${MSG_BLUE} -- .vault-rag`]: { ok: false, out: "fatal: no user.email" },
  });

  const res = runSwitchCliPersisted(io, DIR, ["blue"], { git, sleep: () => {} });

  assert.equal(res.code, 0); // the switch itself DID happen on disk
  assert.match(res.message, /switched to 'blue'/);
  assert.ok(res.message.includes(SWITCH_NOT_COMMITTED_WARNING));
});

test("runSwitchCliPersisted shouts on an unmerged tree too (the other edge of the warning)", () => {
  // A switch during an unresolved rebase leaves the pointer uncommitted just the
  // same; claiming success silently there is the v4.9.0 defect all over again.
  const io = twoUniverseFs();
  const git = fakeGit({ "status --porcelain": { out: "UU vault/note.md\n" } });

  const res = runSwitchCliPersisted(io, DIR, ["blue"], { git, sleep: () => {} });

  assert.equal(res.code, 0);
  assert.ok(res.message.includes(SWITCH_NOT_COMMITTED_WARNING));
});

test("runSwitchCliPersisted says a deferral SOFTLY — a paused merge is not a failure", () => {
  const io = twoUniverseFs();
  const git = fakeGit({
    "status --porcelain": { out: " M .vault-rag/active-universe\n" },
    "rev-parse -q --verify MERGE_HEAD": {},
  });

  const res = runSwitchCliPersisted(io, DIR, ["blue"], { git, sleep: () => {} });

  assert.equal(res.code, 0);
  assert.ok(res.message.includes(SWITCH_COMMIT_DEFERRED_NOTE));
  assert.ok(!res.message.includes(SWITCH_NOT_COMMITTED_WARNING));
});

test("SWITCH_COMMIT_DEFERRED_NOTE — whole-text pin, calm on purpose", () => {
  assert.equal(
    SWITCH_COMMIT_DEFERRED_NOTE,
    "\nNote: a merge/rebase is in progress here, so the switch will be committed " +
      "with it at the end of the turn."
  );
});

test("runSwitchCliPersisted raises NO false alarm on an idempotent re-switch (clean)", () => {
  // Re-selecting the current universe rewrites the same bytes: git sees nothing,
  // commit reports "clean" — and "clean" must not read as "not committed".
  const io = twoUniverseFs();
  const git = fakeGit({ "status --porcelain": { out: "" } });

  const res = runSwitchCliPersisted(io, DIR, ["acme"], { git, sleep: () => {} });

  assert.equal(res.code, 0);
  noPersistenceWarning(res.message);
});

test("runSwitchCliPersisted relays the Stop hook's warning when the push failed", () => {
  const io = twoUniverseFs();
  const git = fakeGit({
    ...commitPath(MSG_BLUE),
    ...pushReady(),
    "push": { ok: false, out: "network unreachable" },
  });

  const res = runSwitchCliPersisted(io, DIR, ["blue"], { git, sleep: () => {} });

  assert.equal(res.code, 0);
  assert.ok(res.message.includes(PUSH_FAILED_WARNING));
});

test("SWITCH_NOT_COMMITTED_WARNING — the words ARE the feature (whole-text pin)", () => {
  // Every other assertion compares against the constant itself; without this pin
  // the whole text could rot to "\nx" with the suite green — on the one line that
  // tells the owner their switch stayed local.
  assert.equal(
    SWITCH_NOT_COMMITTED_WARNING,
    "\n⚠️  SWITCH NOT COMMITTED — the universe changed on THIS machine only and " +
      "will not travel. Run `git status` in your brain to see what stopped the commit."
  );
});
