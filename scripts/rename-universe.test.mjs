import { test } from "node:test";
import assert from "node:assert/strict";

import { runRenameUniverse } from "./rename-universe.mjs";

// A FULL rename (decision D4): the folder moves, every note under it is
// re-stamped, the registry entry changes name, and the pointer follows if you
// were standing in it. Unlike deletion, this is reversible (rename it back), so
// it carries no TTY gate — the cost it does carry is a full re-embed, because
// every path changed.

function deps(overrides = {}) {
  const calls = { logged: [], errored: [], moved: [], written: [], spawned: [] };
  const files = new Map(Object.entries(overrides.files ?? {}));
  const base = {
    cwd: () => "/brain",
    io: {
      existsSync: (p) => files.has(p),
      readFileSync: (p) => files.get(p),
      writeFileSync: (p, data) => (calls.written.push({ path: p, data }), files.set(p, data)),
      mkdirSync: () => {},
    },
    listNotes: (dir) => files.get(`__notes__${dir}`) ?? [],
    renameSync: (from, to) => calls.moved.push({ from, to }),
    spawnSync: (...args) => (calls.spawned.push(args), { status: 0 }),
    platform: "darwin",
    log: (m) => calls.logged.push(m),
    error: (m) => calls.errored.push(m),
  };
  return { args: { ...base, ...overrides, files: undefined }, calls, files };
}

test("runRenameUniverse refuses a target name that is already taken, and moves nothing", () => {
  const { args, calls } = deps({
    files: { "/brain/.vault-rag/universes.json": '{"universes":["acme","blue"]}' },
  });

  const code = runRenameUniverse(["acme", "blue"], args);

  assert.equal(code, 1);
  assert.match(calls.errored.join("\n"), /'blue'/);
  assert.deepEqual(calls.moved, []);
});

test("runRenameUniverse moves the folder and renames the registry entry", () => {
  const { args, calls, files } = deps({
    files: { "/brain/.vault-rag/universes.json": '{"universes":["acme","blue"]}' },
  });

  const code = runRenameUniverse(["acme", "Acme Corp"], args);

  assert.equal(code, 0);
  assert.deepEqual(calls.moved, [{ from: "/brain/vault/acme", to: "/brain/vault/acme-corp" }]);
  // 'blue' is the decoy: a wipe-and-rewrite would lose it.
  assert.deepEqual(JSON.parse(files.get("/brain/.vault-rag/universes.json")), {
    universes: ["acme-corp", "blue"],
  });
});

test("runRenameUniverse re-stamps every note under the moved folder", () => {
  const { args, calls, files } = deps({
    files: {
      "/brain/.vault-rag/universes.json": '{"universes":["acme"]}',
      "__notes__/brain/vault/acme-corp": ["daily/2026-07-27.md", "topics/widgets.md"],
      // Read from the NEW path: the folder has already moved by then.
      "/brain/vault/acme-corp/daily/2026-07-27.md": "---\ntype: daily\nuniverse: acme\n---\n\nDay.\n",
      // A note typed straight into the folder from Obsidian, carrying no scope.
      "/brain/vault/acme-corp/topics/widgets.md": "---\ntype: topic\n---\n\nWidgets.\n",
    },
  });

  assert.equal(runRenameUniverse(["acme", "acme-corp"], args), 0);

  assert.equal(
    files.get("/brain/vault/acme-corp/daily/2026-07-27.md"),
    "---\ntype: daily\nuniverse: acme-corp\n---\n\nDay.\n",
  );
  assert.equal(
    files.get("/brain/vault/acme-corp/topics/widgets.md"),
    "---\ntype: topic\nuniverse: acme-corp\n---\n\nWidgets.\n",
  );
});

test("runRenameUniverse keeps you standing in the universe you just renamed", () => {
  const { args, files } = deps({
    files: {
      "/brain/.vault-rag/universes.json": '{"universes":["acme","blue"]}',
      "/brain/.vault-rag/active-universe": "acme\n",
    },
  });

  assert.equal(runRenameUniverse(["acme", "acme-corp"], args), 0);

  assert.equal(files.get("/brain/.vault-rag/active-universe"), "acme-corp\n");
});

test("runRenameUniverse leaves the pointer alone when you rename some OTHER universe", () => {
  const { args, calls, files } = deps({
    files: {
      "/brain/.vault-rag/universes.json": '{"universes":["acme","blue"]}',
      "/brain/.vault-rag/active-universe": "blue\n",
    },
  });

  assert.equal(runRenameUniverse(["acme", "acme-corp"], args), 0);

  assert.equal(files.get("/brain/.vault-rag/active-universe"), "blue\n");
  // The registry is the only state file written — the twin of the case above.
  assert.deepEqual(
    calls.written.map((w) => w.path),
    ["/brain/.vault-rag/universes.json"],
  );
});

test("runRenameUniverse reindexes and says the rename cost a full re-embed", () => {
  const { args, calls } = deps({
    files: { "/brain/.vault-rag/universes.json": '{"universes":["acme"]}' },
  });

  assert.equal(runRenameUniverse(["acme", "acme-corp"], args), 0);

  // Every path under the universe changed, so the index treats each note as new:
  // this is the cost D4 accepted, and it belongs in the message, not in a doc.
  assert.deepEqual(calls.spawned, [
    ["npm", ["run", "--silent", "reindex"], { cwd: "/brain/rag", stdio: "inherit", shell: false }],
  ]);
  assert.match(calls.logged.join("\n"), /'acme' → 'acme-corp'/);
});

test("runRenameUniverse reports a failed reindex instead of claiming a finished rename", () => {
  const { args, calls } = deps({
    files: { "/brain/.vault-rag/universes.json": '{"universes":["acme"]}' },
    spawnSync: (...a) => (calls.spawned.push(a), { status: 1 }),
  });

  // The files HAVE moved at this point; a silent index failure would leave
  // searches pointing at paths that no longer exist.
  assert.equal(runRenameUniverse(["acme", "acme-corp"], args), 1);
  assert.match(calls.errored.join("\n"), /npm run reindex/);
});
