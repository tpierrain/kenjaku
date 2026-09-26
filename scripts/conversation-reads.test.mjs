import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

import { CONVERSATION_READS_REL } from "./conversation-reads.mjs";

// Issue #130 — the PostToolUse hook that records which universe a vault read ran in,
// per conversation. Run as the host runs it: a process, on real stdin, from a copy of
// scripts/ inside a throwaway brain (it derives the brain from its own location).

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));

function withBrain(active, fn) {
  const brain = realpathSync(mkdtempSync(join(tmpdir(), "kenjaku-reads-")));
  try {
    mkdirSync(join(brain, ".vault-rag"), { recursive: true });
    writeFileSync(join(brain, ".vault-rag", "universes.json"), JSON.stringify({ universes: ["acme", "blue"] }));
    writeFileSync(join(brain, ".vault-rag", "active-universe"), `${active}\n`);
    cpSync(SCRIPTS_DIR, join(brain, "scripts"), { recursive: true });
    return fn(brain);
  } finally {
    rmSync(brain, { recursive: true, force: true });
  }
}

function runHook(brain, input) {
  return spawnSync(process.execPath, [join(brain, "scripts", "conversation-reads.mjs")], {
    input: typeof input === "string" ? input : JSON.stringify(input),
    encoding: "utf8",
  });
}

const record = (brain) => JSON.parse(readFileSync(join(brain, CONVERSATION_READS_REL), "utf8"));

const start = (brain, session_id, source = "startup") =>
  runHook(brain, { session_id, hook_event_name: "SessionStart", source });
const search = (brain, session_id, tool_input = { query: "q" }) =>
  runHook(brain, { session_id, hook_event_name: "PostToolUse", tool_name: "mcp__vault-rag__search_vault", tool_input });

test("a conversation that starts, then searches, records the active universe, in silence", () => {
  withBrain("acme", (brain) => {
    const began = start(brain, "s-live");
    assert.equal(began.status, 0, began.stderr);
    assert.equal(began.stdout, "", "a SessionStart hook's stdout lands in the conversation: it must say nothing");
    assert.deepEqual(record(brain).sessions["s-live"].universes, []);

    const run = search(brain, "s-live", { query: "who is Jane?" });
    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.stdout, "", "a recorder never speaks");
    const { sessions } = record(brain);
    assert.deepEqual(Object.keys(sessions), ["s-live"]);
    assert.deepEqual(sessions["s-live"].universes, ["acme"]);
    assert.equal(typeof sessions["s-live"].at, "number");
  });
});

test("reads accumulate per conversation, and an all-universes search is recorded as such", () => {
  withBrain("blue", (brain) => {
    start(brain, "s1");
    start(brain, "s2", "clear");
    runHook(brain, { session_id: "s1", hook_event_name: "PostToolUse", tool_name: "mcp__vault-rag__get_document", tool_input: { path: "a.md" } });
    search(brain, "s1", { query: "q", allUniverses: true });
    search(brain, "s2");
    const { sessions } = record(brain);
    assert.deepEqual(sessions.s1.universes, ["blue", "*"]);
    assert.deepEqual(sessions.s2.universes, ["blue"]);
  });
});

test("a conversation the recorder never saw begin stays unknown, even after it searches", () => {
  // The gap between an update and the restart: the hook is wired on disk, but this
  // conversation started without it. Recording its later reads would vouch for a
  // window whose earlier reads nobody saw.
  withBrain("acme", (brain) => {
    search(brain, "s-old");
    assert.equal(existsSync(join(brain, CONVERSATION_READS_REL)), false);
    start(brain, "s-old", "resume");
    search(brain, "s-old");
    assert.equal(existsSync(join(brain, CONVERSATION_READS_REL)), false);
  });
});

test("a pointer aimed at a universe that is gone records the scope the search really used", () => {
  // The validated reader resolves a ghost pointer to `default`, which is where the
  // server actually searched — recording the ghost would disclose a sphere nothing
  // could have been read in.
  withBrain("ghost", (brain) => {
    start(brain, "s1");
    search(brain, "s1");
    assert.deepEqual(record(brain).sessions.s1.universes, ["default"]);
  });
});

test("unusable stdin or no session id: exit 0, silence, and no record written", () => {
  withBrain("acme", (brain) => {
    for (const input of ["{not json", { hook_event_name: "SessionStart", source: "startup" }]) {
      const run = runHook(brain, input);
      assert.equal(run.status, 0, run.stderr);
      assert.equal(run.stdout, "");
    }
    assert.equal(existsSync(join(brain, CONVERSATION_READS_REL)), false);
    // Refutable: a hook that did nothing at all would pass the lines above, so the
    // same brain must still record a good start — and ONLY it.
    start(brain, "s-ok");
    assert.deepEqual(Object.keys(record(brain).sessions), ["s-ok"]);
  });
});

test("a corrupt record file never blocks anything, and a new conversation replaces it", () => {
  withBrain("acme", (brain) => {
    mkdirSync(dirname(join(brain, CONVERSATION_READS_REL)), { recursive: true });
    writeFileSync(join(brain, CONVERSATION_READS_REL), "{oops");
    const run = search(brain, "s1");
    assert.equal(run.status, 0, run.stderr);
    start(brain, "s1");
    search(brain, "s1");
    assert.deepEqual(record(brain).sessions, { s1: record(brain).sessions.s1 });
    assert.deepEqual(record(brain).sessions.s1.universes, ["acme"]);
  });
});
