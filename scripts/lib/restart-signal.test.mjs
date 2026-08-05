import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { restartPendingOnDisk, armRestartPending } from "./restart-signal.mjs";
import { RESTART_FLAG_REL } from "./restart-nudge.mjs";

// The two on-disk reads the signal is made of, faked: which files exist, and what
// `.mcp.json` registers. `deriveWanted` is injected because it belongs to the
// self-heal, not here.
function deps({ files = [], servers = [], wanted = { wantedSkillDirs: [], wantedServerIds: [] } } = {}) {
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
