import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { restartPendingOnDisk } from "./restart-signal.mjs";
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
    readFileSync: () => JSON.stringify({ mcpServers: Object.fromEntries(servers.map((s) => [s, {}])) }),
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
