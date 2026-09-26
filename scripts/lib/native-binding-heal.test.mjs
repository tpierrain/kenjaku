import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  healNeverBuiltBinding,
  probeSqlite,
  removeSqliteModule,
} from "./native-binding-heal.mjs";
import { defaultRunInstall } from "./engine-seams.mjs";

// npm 12 blocks a dependency's install scripts unless package.json allows them
// (plan v5.5.2 § S4.3, issue #132). A brain installed or updated with npm 12
// BEFORE v5.5.2 declared them has a better-sqlite3 whose native binary was never
// built — and neither `npm install` nor `npm rebuild` re-runs a script npm 12
// blocked. Measured 2026-09-26 with npm 12.1.0: only removing the module and
// reinstalling brings the database back. So the update does exactly that, once,
// and ONLY on that failure: an ABI skew is left to the rag server's own
// start-time rebuild (ADR 0021), which already cures it.

const NEVER_BUILT =
  "Could not locate the bindings file. Tried:\n → /b/rag/node_modules/better-sqlite3/build/better_sqlite3.node";
const ABI_SKEW =
  "The module was compiled against a different Node.js version using NODE_MODULE_VERSION 137. " +
  "This version of Node.js requires NODE_MODULE_VERSION 127.";

// A scripted run: each probe answers the next scripted result, and every call is
// recorded in order so the sequence itself is asserted, not just the outcome.
function scripted(probeResults, { reinstallThrows } = {}) {
  const calls = [];
  const results = [...probeResults];
  return {
    calls,
    probe: () => {
      calls.push("probe");
      return results.shift();
    },
    remove: () => {
      calls.push("remove");
    },
    reinstall: () => {
      calls.push("reinstall");
      if (reinstallThrows) throw new Error(reinstallThrows);
    },
  };
}

test("a database that opens is left alone: one probe, nothing removed, nothing reinstalled", () => {
  const s = scripted([{ ok: true }]);
  assert.deepEqual(healNeverBuiltBinding(s), { outcome: "loaded" });
  assert.deepEqual(s.calls, ["probe"]);
});

test("an ABI skew is left to the rag server's own rebuild, never reinstalled here", () => {
  const s = scripted([{ ok: false, message: ABI_SKEW }]);
  assert.deepEqual(healNeverBuiltBinding(s), { outcome: "left-to-runtime", detail: ABI_SKEW });
  assert.deepEqual(s.calls, ["probe"]);
});

test("any other failure is not a never-built binary either, and is left alone", () => {
  const other = "Cannot find module 'better-sqlite3'";
  const s = scripted([{ ok: false, message: other }]);
  assert.deepEqual(healNeverBuiltBinding(s), { outcome: "left-to-runtime", detail: other });
  assert.deepEqual(s.calls, ["probe"]);
});

test("a never-built binary is removed, reinstalled, and probed again — in that order", () => {
  const s = scripted([{ ok: false, message: NEVER_BUILT }, { ok: true }]);
  assert.deepEqual(healNeverBuiltBinding(s), { outcome: "healed" });
  assert.deepEqual(s.calls, ["probe", "remove", "reinstall", "probe"]);
});

test("still broken after the reinstall: says so, and reinstalls only once (no loop)", () => {
  const s = scripted([
    { ok: false, message: NEVER_BUILT },
    { ok: false, message: NEVER_BUILT },
    { ok: true },
  ]);
  assert.deepEqual(healNeverBuiltBinding(s), { outcome: "still-broken", detail: NEVER_BUILT });
  assert.deepEqual(s.calls, ["probe", "remove", "reinstall", "probe"]);
});

test("a reinstall that fails (no network) is reported, never thrown: the brain was already broken", () => {
  const s = scripted([{ ok: false, message: NEVER_BUILT }], { reinstallThrows: "ENOTFOUND registry.npmjs.org" });
  assert.deepEqual(healNeverBuiltBinding(s), {
    outcome: "still-broken",
    detail: "ENOTFOUND registry.npmjs.org",
  });
  assert.deepEqual(s.calls, ["probe", "remove", "reinstall"]);
});

// ── The real probe and removal, against a throwaway rag/ on disk ────────────
// A stand-in better-sqlite3 module lets a real child Node load it, with no npm,
// no network and no native build — the probe's I/O is exercised for real.

function writeSqliteModule(ragDir, moduleSource) {
  const modDir = join(ragDir, "node_modules", "better-sqlite3");
  mkdirSync(modDir, { recursive: true });
  writeFileSync(join(modDir, "package.json"), JSON.stringify({ name: "better-sqlite3", main: "index.js" }));
  writeFileSync(join(modDir, "index.js"), moduleSource);
}

function ragWith(moduleSource) {
  const ragDir = mkdtempSync(join(tmpdir(), "heal-rag-"));
  if (moduleSource !== null) writeSqliteModule(ragDir, moduleSource);
  return ragDir;
}

// The binding loads lazily, in the constructor (ADR 0021's empirical correction):
// a probe that only `require`s would call a never-built binary healthy.
const OPENS = `module.exports = class Database { constructor(p) { this.p = p; } close() {} };`;
const NEVER_BUILT_ON_OPEN = `module.exports = class Database {
  constructor() { throw new Error(${JSON.stringify(NEVER_BUILT)}); }
};`;
const OPEN_BUT_NO_CLOSE = `module.exports = class Database { constructor() {} };`;

test("probeSqlite: a module that opens a database answers ok", () => {
  const ragDir = ragWith(OPENS);
  try {
    assert.deepEqual(probeSqlite({ ragDir }), { ok: true });
  } finally {
    rmSync(ragDir, { recursive: true, force: true });
  }
});

test("probeSqlite: a binary that fails only when the database is OPENED is caught, with npm's message", () => {
  const ragDir = ragWith(NEVER_BUILT_ON_OPEN);
  try {
    const r = probeSqlite({ ragDir });
    assert.equal(r.ok, false);
    assert.match(r.message, /Could not locate the bindings file/);
  } finally {
    rmSync(ragDir, { recursive: true, force: true });
  }
});

test("probeSqlite: the probe closes what it opens (a database without close() fails it)", () => {
  const ragDir = ragWith(OPEN_BUT_NO_CLOSE);
  try {
    assert.equal(probeSqlite({ ragDir }).ok, false);
  } finally {
    rmSync(ragDir, { recursive: true, force: true });
  }
});

test("probeSqlite: an absent module is a failure, not a pass", () => {
  const ragDir = ragWith(null);
  try {
    const r = probeSqlite({ ragDir });
    assert.equal(r.ok, false);
    assert.match(r.message, /Cannot find module 'better-sqlite3'/);
  } finally {
    rmSync(ragDir, { recursive: true, force: true });
  }
});

test("removeSqliteModule removes better-sqlite3 and only it", () => {
  const ragDir = ragWith(OPENS);
  const sibling = join(ragDir, "node_modules", "zod");
  mkdirSync(sibling, { recursive: true });
  try {
    removeSqliteModule({ ragDir });
    assert.equal(existsSync(join(ragDir, "node_modules", "better-sqlite3")), false);
    assert.equal(existsSync(sibling), true);
  } finally {
    rmSync(ragDir, { recursive: true, force: true });
  }
});

// ── The wiring: the update's install step heals a brain npm 12 broke ────────

function brainWithRag(moduleSource) {
  const brainDir = mkdtempSync(join(tmpdir(), "heal-brain-"));
  const ragDir = join(brainDir, "rag");
  writeSqliteModule(ragDir, moduleSource);
  return { brainDir, ragDir };
}

test("defaultRunInstall: a never-built binary gets one reinstall of rag/, and the brain opens its database again", async () => {
  const { brainDir, ragDir } = brainWithRag(NEVER_BUILT_ON_OPEN);
  const installs = [];
  const logs = [];
  // The fake npm: the first install leaves the broken module as npm 12 did; the
  // reinstall (after removal) lays down a module that opens — as a real one does.
  const npmInstall = ({ cwd }) => {
    installs.push(cwd);
    if (installs.length === 2) writeSqliteModule(cwd, OPENS);
  };
  try {
    await defaultRunInstall({ ragDir, brainDir, platform: process.platform, npmInstall, log: (l) => logs.push(l) });
    assert.deepEqual(installs, [ragDir, ragDir]);
    assert.deepEqual(probeSqlite({ ragDir }), { ok: true });
    assert.equal(logs.length, 1);
    assert.match(logs[0], /repaired/i);
  } finally {
    rmSync(brainDir, { recursive: true, force: true });
  }
});

test("defaultRunInstall: a healthy brain gets exactly one install and says nothing", async () => {
  const { brainDir, ragDir } = brainWithRag(OPENS);
  const installs = [];
  const logs = [];
  try {
    await defaultRunInstall({
      ragDir,
      brainDir,
      platform: process.platform,
      npmInstall: ({ cwd }) => installs.push(cwd),
      log: (l) => logs.push(l),
    });
    assert.deepEqual(installs, [ragDir]);
    assert.deepEqual(logs, []);
  } finally {
    rmSync(brainDir, { recursive: true, force: true });
  }
});

test("defaultRunInstall: still broken after the reinstall → prints the manual repair, never throws", async () => {
  const { brainDir, ragDir } = brainWithRag(NEVER_BUILT_ON_OPEN);
  const logs = [];
  const npmInstall = ({ cwd }) => writeSqliteModule(cwd, NEVER_BUILT_ON_OPEN);
  try {
    await defaultRunInstall({ ragDir, brainDir, platform: process.platform, npmInstall, log: (l) => logs.push(l) });
    assert.equal(logs.length, 1);
    assert.match(logs[0], /rm -rf node_modules\/better-sqlite3 && npm install/);
  } finally {
    rmSync(brainDir, { recursive: true, force: true });
  }
});

test("defaultRunInstall: an ABI skew is not touched here, and says nothing (the rag server rebuilds it)", async () => {
  const skew = `module.exports = class Database { constructor() { throw new Error(${JSON.stringify(ABI_SKEW)}); } };`;
  const { brainDir, ragDir } = brainWithRag(skew);
  const installs = [];
  const logs = [];
  try {
    await defaultRunInstall({
      ragDir,
      brainDir,
      platform: process.platform,
      npmInstall: ({ cwd }) => installs.push(cwd),
      log: (l) => logs.push(l),
    });
    assert.deepEqual(installs, [ragDir]);
    assert.deepEqual(logs, []);
    assert.equal(existsSync(join(ragDir, "node_modules", "better-sqlite3")), true);
  } finally {
    rmSync(brainDir, { recursive: true, force: true });
  }
});

test("defaultRunInstall: local-mirror is installed too when the brain carries it, and after rag/", async () => {
  const { brainDir, ragDir } = brainWithRag(OPENS);
  const gss = join(brainDir, "local-mirror");
  mkdirSync(gss);
  writeFileSync(join(gss, "package.json"), "{}");
  const installs = [];
  try {
    await defaultRunInstall({
      ragDir,
      brainDir,
      platform: process.platform,
      npmInstall: ({ cwd }) => installs.push(cwd),
      log: () => {},
    });
    assert.deepEqual(installs, [ragDir, gss]);
  } finally {
    rmSync(brainDir, { recursive: true, force: true });
  }
});
