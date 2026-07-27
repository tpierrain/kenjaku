import { test } from "node:test";
import assert from "node:assert/strict";

import { runSetUniverseProfile } from "./set-universe-profile.mjs";

// The deterministic surface behind the profile questions (ADR 0009): the skill
// gathers answers conversationally, this CLI is what actually writes the note, so
// the wording of what happened is never left to the model to improvise.

function deps(overrides = {}) {
  const calls = { logged: [], errored: [], written: [], spawned: [] };
  const files = new Map(Object.entries(overrides.files ?? {}));
  const base = {
    cwd: () => "/brain",
    today: () => "2026-07-27",
    activeUniverse: () => "acme",
    readInput: () => JSON.stringify({ displayName: "Acme Corp", kind: "employer" }),
    io: {
      existsSync: (p) => files.has(p),
      readFileSync: (p) => files.get(p),
      writeFileSync: (p, data) => (calls.written.push({ path: p, data }), files.set(p, data)),
      mkdirSync: () => {},
    },
    spawnSync: (...args) => (calls.spawned.push(args), { status: 0 }),
    platform: "darwin",
    log: (m) => calls.logged.push(m),
    error: (m) => calls.errored.push(m),
  };
  return { args: { ...base, ...overrides, files: undefined }, calls, files };
}

test("runSetUniverseProfile reindexes so the profile is searchable, and says it is", () => {
  // A profile the index has not seen is a page the brain cannot answer FROM,
  // which is most of the point of storing it as a note.
  const { args, calls } = deps();

  const code = runSetUniverseProfile([], args);

  assert.equal(code, 0);
  assert.deepEqual(calls.spawned, [
    ["npm", ["run", "--silent", "reindex"], { cwd: "/brain/rag", stdio: "inherit", shell: false }],
  ]);
  assert.deepEqual(calls.logged, [
    "✓ Profile written: vault/acme/universe.md",
    "✓ RAG re-indexed — the profile is searchable.",
  ]);
});

test("runSetUniverseProfile reports a failed reindex instead of claiming success", () => {
  const { args, calls } = deps({ spawnSync: () => ({ status: 1 }) });

  const code = runSetUniverseProfile([], args);

  assert.equal(code, 1);
  assert.match(calls.errored[0], /re-index failed/);
  assert.match(calls.errored[0], /cd rag && npm run reindex/);
});

test("runSetUniverseProfile refuses an existing profile and points at the page to edit", () => {
  // Refusing is only half the job: the owner must be told where the page they
  // already have lives, or a refusal reads as a dead end.
  const { args, calls } = deps({
    files: { "/brain/vault/acme/universe.md": "the owner's own page" },
  });

  const code = runSetUniverseProfile(["--no-reindex"], args);

  assert.equal(code, 1);
  assert.deepEqual(calls.written, []);
  assert.equal(calls.errored.length, 1);
  assert.match(calls.errored[0], /vault\/acme\/universe\.md already exists/);
  assert.match(calls.errored[0], /edit/i);
});

test("runSetUniverseProfile honours an explicit universe over the active one", () => {
  // The backfill flow fills in a universe you are NOT standing in, so an explicit
  // slug must win — otherwise the answers land on the wrong sphere's page.
  const { args, files } = deps({
    readInput: () => JSON.stringify({ universe: "blue", displayName: "Blue Team" }),
  });

  const code = runSetUniverseProfile(["--no-reindex"], args);

  assert.equal(code, 0);
  assert.ok(files.has("/brain/vault/blue/universe.md"));
  assert.ok(!files.has("/brain/vault/acme/universe.md"));
});

test("runSetUniverseProfile writes the profile of the ACTIVE universe and names the note", () => {
  const { args, calls, files } = deps();

  const code = runSetUniverseProfile(["--no-reindex"], args);

  assert.equal(code, 0);
  assert.deepEqual(calls.logged, ["✓ Profile written: vault/acme/universe.md"]);
  assert.match(files.get("/brain/vault/acme/universe.md"), /^---\ntype: universe\n/);
  assert.match(files.get("/brain/vault/acme/universe.md"), /displayName: Acme Corp/);
});
