import { test } from "node:test";
import assert from "node:assert/strict";

import { runDeleteUniverse } from "./delete-universe.mjs";

// The only irreversible universe operation (D3). Two guarantees are tested here
// rather than trusted: it cannot run unless a HUMAN is at the keyboard, and it
// deletes nothing until that human has retyped the slug. Both live in the code,
// not in the model's restraint (ADR 0009) — an assistant that could answer the
// prompt itself would be a gate guarding nothing.

function deps(overrides = {}) {
  const calls = {
    logged: [],
    errored: [],
    removed: [],
    asked: [],
    spawned: [],
    written: [],
    timeline: [],
  };
  const files = new Map(Object.entries(overrides.files ?? {}));
  const base = {
    cwd: () => "/brain",
    isInteractive: () => true,
    // Returns a value no real implementation would produce unprompted, so a
    // miswired call site cannot pass by accident.
    askLine: (q) => (calls.asked.push(q), calls.timeline.push("ask"), "<<no answer stubbed>>"),
    io: {
      existsSync: (p) => files.has(p),
      readFileSync: (p) => files.get(p),
      writeFileSync: (p, data) => (calls.written.push({ path: p, data }), files.set(p, data)),
      mkdirSync: () => {},
    },
    listNotes: (dir) => (files.get(`__notes__${dir}`) ?? []),
    rmSync: (p, opts) => calls.removed.push({ path: p, opts }),
    spawnSync: (...args) => (calls.spawned.push(args), { status: 0 }),
    platform: "darwin",
    log: (m) => (calls.logged.push(m), calls.timeline.push("log")),
    error: (m) => calls.errored.push(m),
  };
  return { args: { ...base, ...overrides, files: undefined }, calls, files };
}

test("runDeleteUniverse refuses to run at all without an interactive terminal", async () => {
  // The whole point of D3: if this could run headless (a --yes flag, a piped
  // stdin, an assistant answering its own prompt), the confirmation would guard
  // nothing. Refusing is not a UX detail, it IS the guarantee.
  const { args, calls } = deps({ isInteractive: () => false });

  const code = await runDeleteUniverse(["blue"], args);

  assert.equal(code, 1);
  assert.match(calls.errored.join("\n"), /interactive terminal/i);
  assert.deepEqual(calls.removed, []);
  assert.deepEqual(calls.asked, []);
});

test("runDeleteUniverse relays the core's refusal for a universe that does not exist", async () => {
  const { args, calls } = deps({
    files: { "/brain/.vault-rag/universes.json": '{"universes":["acme"]}' },
  });

  const code = await runDeleteUniverse(["ghost"], args);

  assert.equal(code, 1);
  assert.match(calls.errored.join("\n"), /'ghost'/);
  // Offers only what CAN be deleted — never the default scope.
  assert.match(calls.errored.join("\n"), /acme/);
  assert.deepEqual(calls.removed, []);
  assert.deepEqual(calls.asked, []);
});

test("runDeleteUniverse shows what would be lost, then aborts when the slug is not retyped", async () => {
  const { args, calls } = deps({
    files: {
      "/brain/.vault-rag/universes.json": '{"universes":["acme","blue"]}',
      "__notes__/brain/vault/blue": ["one.md", "two.md", "three.md"],
    },
    askLine: (q) => (calls.asked.push(q), calls.timeline.push("ask"), "blu"), // a near-miss, the realistic slip
  });

  const code = await runDeleteUniverse(["blue"], args);

  assert.equal(code, 1);
  // The count comes BEFORE the question: you are told what you are about to lose
  // while you still have the chance not to answer it.
  assert.match(calls.logged.join("\n"), /3 notes/);
  // Order is the substance of the claim, not a detail: a count shown after the
  // question is a count nobody had when they answered it.
  assert.deepEqual(calls.timeline, ["log", "ask"]);
  assert.equal(calls.asked.length, 1);
  assert.match(calls.asked[0], /blue/);
  assert.deepEqual(calls.removed, []);
  assert.match(calls.errored.join("\n"), /nothing (was )?deleted/i);
});

test("runDeleteUniverse deletes the folder and prunes the registry once the slug is retyped", async () => {
  const { args, calls, files } = deps({
    files: {
      "/brain/.vault-rag/universes.json": '{"universes":["acme","blue"]}',
      "__notes__/brain/vault/blue": ["one.md"],
    },
    askLine: (q) => (calls.asked.push(q), calls.timeline.push("ask"), "blue\n"),
  });

  const code = await runDeleteUniverse(["blue"], args);

  assert.equal(code, 0);
  assert.deepEqual(calls.removed, [
    { path: "/brain/vault/blue", opts: { recursive: true, force: true } },
  ]);
  // 'acme' survives: a two-entry registry is what tells a prune from a wipe.
  assert.deepEqual(JSON.parse(files.get("/brain/.vault-rag/universes.json")), {
    universes: ["acme"],
  });
});

test("runDeleteUniverse sends you back to the default scope when you delete the one you were in", async () => {
  const { args, calls, files } = deps({
    files: {
      "/brain/.vault-rag/universes.json": '{"universes":["acme","blue"]}',
      "/brain/.vault-rag/active-universe": "blue\n",
    },
    askLine: (q) => (calls.asked.push(q), calls.timeline.push("ask"), "blue"),
  });

  assert.equal(await runDeleteUniverse(["blue"], args), 0);

  // Standing in a universe that no longer exists is exactly the ghost state the
  // self-heal was built for; here we simply never create it.
  assert.equal(files.get("/brain/.vault-rag/active-universe"), "default\n");
});

test("runDeleteUniverse leaves you where you are when you delete some OTHER universe", async () => {
  const { args, calls, files } = deps({
    files: {
      "/brain/.vault-rag/universes.json": '{"universes":["acme","blue"]}',
      "/brain/.vault-rag/active-universe": "acme\n",
    },
    askLine: (q) => (calls.asked.push(q), calls.timeline.push("ask"), "blue"),
  });

  assert.equal(await runDeleteUniverse(["blue"], args), 0);

  assert.equal(files.get("/brain/.vault-rag/active-universe"), "acme\n");
  // The registry is the ONLY state file touched — the twin of the case above, so
  // "reset the pointer" cannot pass as something done unconditionally.
  assert.deepEqual(
    calls.written.map((w) => w.path),
    ["/brain/.vault-rag/universes.json"],
  );
});

test("runDeleteUniverse reindexes, so the deleted notes stop coming back in searches", async () => {
  const { args, calls } = deps({
    files: { "/brain/.vault-rag/universes.json": '{"universes":["acme","blue"]}' },
    askLine: (q) => (calls.asked.push(q), calls.timeline.push("ask"), "blue"),
  });

  assert.equal(await runDeleteUniverse(["blue"], args), 0);

  // Files gone but still embedded = a brain quoting notes that no longer exist,
  // the one failure nobody would connect back to a deletion.
  assert.deepEqual(calls.spawned, [
    ["npm", ["run", "--silent", "reindex"], { cwd: "/brain/rag", stdio: "inherit", shell: false }],
  ]);
});

test("runDeleteUniverse reports a failed reindex instead of claiming a clean deletion", async () => {
  const { args, calls } = deps({
    files: { "/brain/.vault-rag/universes.json": '{"universes":["acme","blue"]}' },
    askLine: (q) => (calls.asked.push(q), calls.timeline.push("ask"), "blue"),
    spawnSync: (...a) => (calls.spawned.push(a), { status: 1 }),
  });

  // The notes ARE gone at this point; pretending the index followed would leave
  // the owner with search results they cannot open.
  assert.equal(await runDeleteUniverse(["blue"], args), 1);
  assert.match(calls.errored.join("\n"), /npm run reindex/);
});

test("runDeleteUniverse hands back the git command that undoes it", async () => {
  const { args, calls } = deps({
    files: {
      "/brain/.vault-rag/universes.json": '{"universes":["acme","blue"]}',
      "__notes__/brain/vault/blue": ["one.md", "two.md"],
    },
    askLine: (q) => (calls.asked.push(q), calls.timeline.push("ask"), "blue"),
  });

  assert.equal(await runDeleteUniverse(["blue"], args), 0);

  // "Irreversible" is true of the working tree, not of the repo: the auto-commit
  // hook has been versioning these notes all along. The one moment that fact is
  // worth anything is right after the deletion, not buried in a doc.
  const said = calls.logged.join("\n");
  assert.match(said, /deleted/i);
  assert.match(said, /git checkout .*vault\/blue/);
});

test("runDeleteUniverse wants the slug RETYPED, not merely mentioned", async () => {
  const { args, calls } = deps({
    files: { "/brain/.vault-rag/universes.json": '{"universes":["acme","blue"]}' },
    askLine: (q) => (calls.asked.push(q), calls.timeline.push("ask"), "yes delete blue"),
  });

  // An answer that CONTAINS the slug is the shape a hurried human — or an
  // assistant paraphrasing on their behalf — produces. Only the exact word counts.
  assert.equal(await runDeleteUniverse(["blue"], args), 1);
  assert.deepEqual(calls.removed, []);
});
