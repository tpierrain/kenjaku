import { test } from "node:test";
import assert from "node:assert/strict";
import { frozenWiringIn, pulledPaths } from "./frozen-wiring.mjs";

// F20 (field, 2026-08-05): a brain updated on machine A, then opened on machine B, ran the
// PRE-update engine for the whole session and never said so — the startup `git pull` had
// just landed the new code, and every hook / skill / MCP server was already frozen on the
// old one. The pull's own file list is the exact evidence, and session-status.mjs already
// computes it (`git diff --name-only ORIG_HEAD HEAD`) only to count it and throw it away.
test("frozenWiringIn — a pulled session hook is named (the code this session already froze)", () => {
  assert.deepEqual(frozenWiringIn(["scripts/session-universe.mjs"]), ["scripts/session-universe.mjs"]);
});

// The discriminator, and the one that decides whether this is shippable at all: the ordinary
// multi-machine pull brings NOTES, and notes need no restart (the RAG watches the vault and
// reindexes). A nudge that fired on every sync would be a phantom restart at every session —
// the repo's own rule (restart-signal.mjs): it costs a pointless one and teaches people to
// ignore the real one.
test("frozenWiringIn — pulled notes are not wiring, and do not drag a sibling script out with them", () => {
  assert.deepEqual(
    frozenWiringIn(["vault/people/hossam.md", "scripts/lib/rag-status.mjs", "vault/inbox/2026-08-05.md"]),
    ["scripts/lib/rag-status.mjs"],
  );
});

// The other four doors a session reads once and never again: the constitution it loaded, the
// skills + settings under `.claude/`, the staged `engine-skills/` the reconciler installs from,
// and the MCP servers it spawned. `engine-manifest.json` rides along because it is the version
// vector every other surface quotes — a session that pulled it is already ANSWERING with a
// number its running code does not match.
test("frozenWiringIn — the constitution, the skills, the staged engine skills, the servers and the manifest", () => {
  assert.deepEqual(
    frozenWiringIn([
      "CLAUDE.md",
      "CLAUDE.engine.md",
      ".claude/skills/switch/SKILL.md",
      ".claude/settings.json.template",
      "engine-skills/consolidate/SKILL.md",
      "rag/src/index.ts",
      "local-mirror/src/server.ts",
      "engine-manifest.json",
      ".mcp.json.template",
    ]),
    [
      "CLAUDE.md",
      "CLAUDE.engine.md",
      ".claude/skills/switch/SKILL.md",
      ".claude/settings.json.template",
      "engine-skills/consolidate/SKILL.md",
      "rag/src/index.ts",
      "local-mirror/src/server.ts",
      "engine-manifest.json",
      ".mcp.json.template",
    ],
  );
});

// A prefix, not a substring: a vault note filed under a folder that happens to be called
// `scripts` is a note. Told apart from `includes` only by a path where the token sits in the
// middle, which is exactly the shape an owner's own filing produces.
test("frozenWiringIn — the token must START the path, and a lookalike filename is not the file", () => {
  assert.deepEqual(
    frozenWiringIn([
      "vault/topics/scripts/shell-tricks.md",
      "maintainers/engine-manifest.json",
      "vault/CLAUDE.md",
    ]),
    [],
  );
});

// The list arrives as the raw stdout of `git diff --name-only`, which session-status.mjs
// used to split inline and immediately reduce to a count. Parsed here so both the count and
// the wiring verdict are read from one tested place. CRLF is fed on purpose: this repo has
// been bitten three times by a Windows checkout, and a trailing `\r` would turn every path
// into one nothing matches — a machine that is behind would then stay silent on Windows only.
test("pulledPaths — the raw diff becomes paths, blank lines and CRLF included", () => {
  assert.deepEqual(
    pulledPaths("scripts/session-status.mjs\r\nvault/inbox/note.md\r\n\r\n"),
    ["scripts/session-status.mjs", "vault/inbox/note.md"],
  );
});

// The other ending, and the majority one: git on macOS/Linux emits bare LF. Fed as its own
// case because a split that only knows CRLF still passes the test above — it would return
// the whole stdout as ONE path, which matches no prefix, and the machine that is behind goes
// silent on every Unix. The whitespace-only line is the second half of the same guard: a
// blank that is not empty must not survive as a path either.
test("pulledPaths — LF-only stdout, and a line that is blank without being empty", () => {
  assert.deepEqual(
    pulledPaths("scripts/session-status.mjs\n   \nvault/inbox/note.md\n"),
    ["scripts/session-status.mjs", "vault/inbox/note.md"],
  );
});

// A brain with no remote pulls nothing, and a brain that is already up to date pulls
// nothing either — session-status hands an empty list in both cases. It is the majority
// of all sessions, so it is the one that must cost nothing and say nothing.
test("frozenWiringIn — nothing pulled, nothing to say", () => {
  assert.deepEqual(frozenWiringIn([]), []);
});
