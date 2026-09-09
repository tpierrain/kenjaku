import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { restartPendingOnDisk, armRestartPending } from "./restart-signal.mjs";
import { RESTART_FLAG_REL } from "./restart-nudge.mjs";

// The two on-disk reads the signal is made of, faked: which files exist, and what
// `.mcp.json` registers. `deriveWanted` is injected because it belongs to the
// self-heal, not here.
const FLAG_PATH = join("/brain", RESTART_FLAG_REL);

function deps({ files = [], servers = [], wanted = { wantedSkillDirs: [], wantedServerIds: [] }, flagBody = null } = {}) {
  const present = new Set(files);
  return {
    repo: "/brain",
    deriveWanted: () => wanted,
    existsSync: (p) => present.has(p),
    // Reads the way node's `fs` reads, on both counts: an encoding it does not know is an
    // ERROR (not a silently-returned Buffer), and an absent file throws. A call that forgot
    // `utf8`, or read a path nothing wrote, therefore fails here instead of passing by luck.
    readFileSync: (p, encoding) => {
      if (encoding !== "utf8") throw new Error(`Unknown encoding: ${encoding}`);
      if (!present.has(p)) throw new Error(`ENOENT: no such file, open '${p}'`);
      if (p === FLAG_PATH) return flagBody ?? "";
      return JSON.stringify({ mcpServers: Object.fromEntries(servers.map((s) => [s, {}])) });
    },
  };
}

test("a converged brain asks for no restart", () => {
  assert.equal(restartPendingOnDisk(deps()), false);
});

test("the explicit flag alone means a restart is pending", () => {
  // Written by the self-heal when it converged code THIS session predates.
  //
  // Built with `join`, never by string concatenation: the production code joins, so
  // on Windows it looks up `\brain\.cache\restart-needed` while a hand-spelled
  // `/brain/.cache/…` never matches. The nudge then goes silent on exactly the
  // platform where it was already hardest to notice. (`join` is path normalisation
  // here, not the function under test — that one is `restartPendingOnDisk`.)
  assert.equal(restartPendingOnDisk(deps({ files: [join("/brain", RESTART_FLAG_REL)] })), true);
});

test("an engine-delivered skill sitting on disk, uninstalled, means it too", () => {
  // The signal that fires in the SAME session after a silent update: no flag, but
  // the brain's on-disk state is ahead of what this session loaded.
  const d = deps({
    wanted: { wantedSkillDirs: [".claude/skills/switch"], wantedServerIds: [] },
  });
  assert.equal(restartPendingOnDisk(d), true);
});

// The converged brain of the test above, but with something to converge: the engine wants a
// skill and a server, and BOTH are already there. It is the case that says the two probes are
// really read — an "is it installed?" that answers nothing at all would report a gap here, and
// nudge a restart at every session start on a brain that has nothing to finish.
test("what the engine wants is installed and registered — still no restart", () => {
  const d = deps({
    files: [join("/brain", ".mcp.json"), join("/brain", ".claude/skills/switch")],
    servers: ["vault-rag"],
    wanted: { wantedSkillDirs: [".claude/skills/switch"], wantedServerIds: ["vault-rag"] },
  });

  assert.equal(restartPendingOnDisk(d), false);
});

// The other half of the same read: `.mcp.json` is there and parses, and what it registers is
// NOT what the engine delivered. The server exists on disk, this session never spawned it.
test("an engine-delivered MCP server that .mcp.json does not register means a restart too", () => {
  const d = deps({
    files: [join("/brain", ".mcp.json")],
    servers: ["vault-rag"],
    wanted: { wantedSkillDirs: [], wantedServerIds: ["local-mirror"] },
  });

  assert.equal(restartPendingOnDisk(d), true);
});

test("a read that blows up asks for NO restart — it never invents a nudge", () => {
  // Fail-soft: this runs on a hook and (today) on every status-line refresh. A
  // hiccup must not plant "⚠️ RESTART Claude" in front of an owner with nothing to do.
  const d = {
    repo: "/brain",
    deriveWanted: () => {
      throw new Error("unreadable manifest");
    },
    existsSync: () => false,
    readFileSync: () => "",
  };
  assert.equal(restartPendingOnDisk(d), false);
});

// ─── F20: the third writer of the flag, and the reason it moved here ─────────
// The flag is written by an update that ran on THIS machine (update-engine, self-heal),
// and `.cache/` is gitignored, so machine A's flag never travels. A machine that gets the
// same engine by `git pull` therefore had no writer at all — it ran the old code all
// session and said nothing. session-status arms it from the pull's own file list, through
// this function, so the three writers cannot drift on where the flag lives or what it says.
test("armRestartPending — writes the flag under the brain's .cache, parents included", () => {
  const dirs = [];
  const writes = [];
  const armed = armRestartPending({
    repo: "/brain",
    mkdirSync: (dir, opts) => dirs.push([dir, opts]),
    writeFileSync: (p, body) => writes.push([p, body]),
  });

  assert.equal(armed, true);
  assert.deepEqual(dirs, [[join("/brain", ".cache"), { recursive: true }]]);
  assert.equal(writes.length, 1);
  assert.equal(writes[0][0], join("/brain", RESTART_FLAG_REL));
  assert.match(writes[0][1], /restart/i);
});

test("armRestartPending — a write that blows up is swallowed, and says so (a hook never dies over a nudge)", () => {
  const armed = armRestartPending({
    repo: "/brain",
    mkdirSync: () => {},
    writeFileSync: () => {
      throw new Error("EROFS: read-only file system");
    },
  });

  assert.equal(armed, false);
});

// ─── #90: the marker remembers WHICH app armed it ────────────────────────────
// Until now the marker's existence was the whole signal, and only a SessionStart
// could erase it — which resuming a conversation never runs, so obeying the nudge
// kept it alive forever. Now the marker also carries the identity of the Claude
// app that was running when it was armed, and every reader compares it with the
// app running now. A DIFFERENT app is the only proof that the owner really
// restarted (measured 2026-09-08: a new conversation changes everything else).
const APP_A = { pid: "75093", startedAt: "Wed Sep  9 09:20:39 2026" };
const APP_B = { pid: "80412", startedAt: "Wed Sep  9 11:04:02 2026" };

function armedBody(appIdentity) {
  const writes = [];
  armRestartPending({ repo: "/brain", mkdirSync: () => {}, writeFileSync: (p, body) => writes.push(body), appIdentity });
  return writes[0];
}

test("armRestartPending — the marker records the app that armed it, and still reads as a sentence", () => {
  const body = armedBody(APP_A);

  assert.deepEqual(JSON.parse(body).armedByApp, APP_A);
  // A human who opens this file deserves to understand it without our source. The
  // three writers must not each invent that sentence, so it is asserted here.
  assert.match(body, /restart/i);
});

test("armRestartPending — no app to name (every CLI session) still arms, it just records nobody", () => {
  const body = armedBody(null);

  assert.equal(JSON.parse(body).armedByApp, undefined);
  assert.match(body, /restart/i);
  // And the verdict on such a marker is the one that predates this whole fix.
  assert.equal(restartPendingOnDisk({ ...deps({ files: [FLAG_PATH], flagBody: body }), readAppIdentity: () => APP_B }), true);
});

test("the marker was armed by an app that is gone → the restart HAPPENED, so no nudge", () => {
  const stale = [];
  const pending = restartPendingOnDisk({
    ...deps({ files: [FLAG_PATH], flagBody: armedBody(APP_A) }),
    readAppIdentity: () => APP_B,
    onStale: () => stale.push(true),
  });

  assert.equal(pending, false);
  assert.deepEqual(stale, [true], "and the marker is handed to its owner to erase, exactly once");
});

test("the marker was armed by the app still running → the nudge stays, and nothing is erased", () => {
  const stale = [];
  const pending = restartPendingOnDisk({
    ...deps({ files: [FLAG_PATH], flagBody: armedBody(APP_A) }),
    readAppIdentity: () => ({ ...APP_A }),
    onStale: () => stale.push(true),
  });

  assert.equal(pending, true);
  assert.deepEqual(stale, []);
});

test("the app cannot be named right now → the nudge stays (an unanswerable question proves nothing)", () => {
  const pending = restartPendingOnDisk({
    ...deps({ files: [FLAG_PATH], flagBody: armedBody(APP_A) }),
    readAppIdentity: () => null,
  });

  assert.equal(pending, true);
});

test("a marker written by an older engine is prose, not JSON — and it still nudges", () => {
  // Every brain updating into this version has one of these on disk. Reading it must
  // not throw, and must not be mistaken for "no app armed it, therefore restarted".
  const pending = restartPendingOnDisk({
    ...deps({ files: [FLAG_PATH], flagBody: "restart needed to finish the engine update\n" }),
    readAppIdentity: () => APP_B,
  });

  assert.equal(pending, true);
});

test("a restart erases the marker but NEVER the gap — a skill uninstalled on disk is still uninstalled", () => {
  const stale = [];
  const pending = restartPendingOnDisk({
    ...deps({
      files: [FLAG_PATH],
      flagBody: armedBody(APP_A),
      wanted: { wantedSkillDirs: [".claude/skills/switch"], wantedServerIds: [] },
    }),
    readAppIdentity: () => APP_B,
    onStale: () => stale.push(true),
  });

  assert.equal(pending, true, "the gap is present tense: no restart makes it untrue");
  assert.deepEqual(stale, [true], "the marker is stale all the same, and saying so costs nothing");
});

test("reading the app blows up → the nudge stays, and the hook lives (fail-soft, both halves)", () => {
  const pending = restartPendingOnDisk({
    ...deps({ files: [FLAG_PATH], flagBody: armedBody(APP_A) }),
    readAppIdentity: () => {
      throw new Error("spawn ps ENOENT");
    },
  });

  assert.equal(pending, true);
});

// Against a REAL filesystem, because `onStale` exists to make a file disappear and a fake
// `rmSync` would only prove we called our own spy. This is also the shape the prompt hook
// wires: arm it the way the three writers arm it, come back as a different app, and the
// marker that could not be erased without a SessionStart is gone.
test("the marker is really erased from a real disk once the restart is proven", () => {
  const dir = mkdtempSync(join(tmpdir(), "restart-signal-"));
  const flag = join(dir, RESTART_FLAG_REL);
  try {
    armRestartPending({ repo: dir, mkdirSync, writeFileSync, appIdentity: APP_A });
    assert.equal(existsSync(flag), true, "armed, on disk, before anything is judged");

    const pending = restartPendingOnDisk({
      repo: dir,
      deriveWanted: () => ({ wantedSkillDirs: [], wantedServerIds: [] }),
      existsSync,
      readFileSync,
      readAppIdentity: () => APP_B,
      onStale: (path) => rmSync(path, { force: true }),
    });

    assert.equal(pending, false);
    assert.equal(existsSync(flag), false, "and the next prompt of that conversation pays nothing");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("with no marker at all, the app is never even looked up — the normal case stays free", () => {
  const looks = [];
  restartPendingOnDisk({ ...deps(), readAppIdentity: () => looks.push(true) });

  // This runs in front of every prompt of every session on a converged brain.
  // Reading the whole process table there would be a cost paid forever, for an
  // answer nothing asks for.
  assert.deepEqual(looks, []);
});
