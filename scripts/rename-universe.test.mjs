import { test } from "node:test";
import assert from "node:assert/strict";

import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { runRenameUniverse } from "./rename-universe.mjs";

const CLI = join(dirname(fileURLToPath(import.meta.url)), "rename-universe.mjs");

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

test("runRenameUniverse --preflight says what the rename will do, and does none of it", () => {
  const { args, calls } = deps({
    files: {
      "/brain/.vault-rag/universes.json": '{"universes":["acme"]}',
      "__notes__/brain/vault/acme": ["daily/2026-07-27.md", "topics/widgets.md"],
    },
  });

  const code = runRenameUniverse(["--preflight", "acme", "Acme Corp"], args);

  assert.equal(code, 0);
  const said = calls.logged.join("\n");
  assert.match(said, /'acme' → 'acme-corp'/);
  assert.match(said, /2 notes/);
  // The whole point: the cost is named BEFORE anyone commits to it.
  assert.match(said, /re-encode/i);
  assert.match(said, /minutes/i);
  assert.deepEqual(calls.moved, []);
  assert.deepEqual(calls.written, []);
  assert.deepEqual(calls.spawned, []);
});

test("runRenameUniverse --preflight tells you whether the rename moves you or not", () => {
  const standingThere = deps({
    files: {
      "/brain/.vault-rag/universes.json": '{"universes":["acme","blue"]}',
      "/brain/.vault-rag/active-universe": "acme\n",
    },
  });
  const standingElsewhere = deps({
    files: {
      "/brain/.vault-rag/universes.json": '{"universes":["acme","blue"]}',
      "/brain/.vault-rag/active-universe": "blue\n",
    },
  });

  runRenameUniverse(["--preflight", "acme", "acme-corp"], standingThere.args);
  runRenameUniverse(["--preflight", "acme", "acme-corp"], standingElsewhere.args);

  assert.match(standingThere.calls.logged.join("\n"), /keep standing in it/);
  assert.match(standingElsewhere.calls.logged.join("\n"), /stay where you are/);
});

test("runRenameUniverse --preflight refuses an impossible rename before anyone waits for it", () => {
  const { args, calls } = deps({
    files: { "/brain/.vault-rag/universes.json": '{"universes":["acme","blue"]}' },
  });

  // The refusals are worth more here than after the fact: nothing has run yet.
  assert.equal(runRenameUniverse(["--preflight", "acme", "blue"], args), 1);
  assert.match(calls.errored.join("\n"), /'blue'/);
  assert.deepEqual(calls.logged, []);
});

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

test("runRenameUniverse works from a backslashed root: POSIX paths throughout", () => {
  // Windows hands cwd() back as C:\brain, and the folder move, the note re-stamp
  // and the reindex all hang off it. A single leaked backslash makes the registry
  // read miss and the rename find nothing to rename.
  const { args, calls } = deps({
    cwd: () => "C:\\brain",
    files: {
      "C:/brain/.vault-rag/universes.json": '{"universes":["acme"]}',
      "__notes__C:/brain/vault/acme-corp": ["daily/2026-07-27.md"],
      "C:/brain/vault/acme-corp/daily/2026-07-27.md": "---\nuniverse: acme\n---\nbody\n",
    },
  });

  assert.equal(runRenameUniverse(["acme", "acme-corp"], args), 0);

  assert.deepEqual(calls.moved, [{ from: "C:/brain/vault/acme", to: "C:/brain/vault/acme-corp" }]);
  assert.equal(calls.written[0].path, "C:/brain/vault/acme-corp/daily/2026-07-27.md");
  assert.equal(calls.spawned[0][2].cwd, "C:/brain/rag");
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

// ─────────────────────────────────────────────────────────────────────────────
// The entry-point seam — asserted by RUNNING the CLI as a process, mirroring the
// lint-vault conversion (S0bis): importing must fire nothing, and one harmless
// invocation proves the tail actually runs the body when it IS the entry point.
// ─────────────────────────────────────────────────────────────────────────────

test("the CLI, IMPORTED rather than run — the body must not fire on import", async () => {
  // The whole point of the tail: importing the module runs nothing. Asserted from
  // a child process so an accidental process.exit() cannot take the suite with it.
  const probe = `import("${pathToFileURL(CLI).href}").then(() => { console.log("imported-and-still-alive"); });`;
  const run = spawnSync(process.execPath, ["--input-type=module", "-e", probe], { encoding: "utf8" });

  assert.equal(run.status, 0, `importing the CLI must not exit — stderr: ${run.stderr}`);
  assert.equal(run.stdout.trim(), "imported-and-still-alive");
});

test("the CLI, run as a process — no args refuses without touching anything", (t) => {
  // Harmless by construction: an empty temp cwd has no .vault-rag registry, so the
  // "empty" refusal fires before any write, git spawn or network reach — nothing
  // else about this CLI (a real rename, then a commit) is safe to run as a probe.
  const dir = mkdtempSync(join(tmpdir(), "rename-universe-cli-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));

  const run = spawnSync(process.execPath, [CLI], { cwd: dir, encoding: "utf8" });

  assert.equal(run.status, 1, `a missing universe name must exit 1 — stderr: ${run.stderr}`);
  assert.match(run.stderr, /A rename needs both a universe to rename and a new name/);
});
