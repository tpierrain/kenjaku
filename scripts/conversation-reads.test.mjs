import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

import { CONVERSATION_READS_DIR_REL, readConversationReads, renameConversationReads, runRecorder } from "./conversation-reads.mjs";
import { MAX_SESSIONS } from "./lib/conversation-reads.mjs";

// Issue #130 — the hook that records which universes a conversation read notes from.
// Run as the host runs it: a process, on real stdin, from a copy of scripts/ inside a
// throwaway brain (it derives the brain from its own location).

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));

// Notes written by hand, the way file-back-note leaves them: a universe's notes under
// vault/<universe>/ and declaring it; a cross-cutting note at the root declaring none.
const NOTES = {
  "acme/deals/big-deal.md": "---\ntype: topic\nuniverse: acme\n---\nThe big deal.\n",
  "blue/people/bob.md": "---\nuniverse: blue\n---\nBob.\n",
  "people/jane.md": "---\ntype: person\n---\nJane, cross-cutting.\n",
};

function withBrain(fn, { universes = ["acme", "blue"] } = {}) {
  const brain = realpathSync(mkdtempSync(join(tmpdir(), "kenjaku-reads-")));
  try {
    mkdirSync(join(brain, ".vault-rag"), { recursive: true });
    writeFileSync(join(brain, ".vault-rag", "universes.json"), JSON.stringify({ universes }));
    writeFileSync(join(brain, ".vault-rag", "active-universe"), "acme\n");
    for (const [rel, raw] of Object.entries(NOTES)) {
      mkdirSync(dirname(join(brain, "vault", rel)), { recursive: true });
      writeFileSync(join(brain, "vault", rel), raw);
    }
    cpSync(SCRIPTS_DIR, join(brain, "scripts"), { recursive: true });
    return fn(brain);
  } finally {
    rmSync(brain, { recursive: true, force: true });
  }
}

// The two entry points, one per event (see session-reads.mjs for why they are two).
function runHook(brain, input) {
  const script = input?.hook_event_name === "SessionStart" ? "session-reads.mjs" : "conversation-reads.mjs";
  return spawnSync(process.execPath, [join(brain, "scripts", script)], {
    input: typeof input === "string" ? input : JSON.stringify(input),
    encoding: "utf8",
  });
}

const recordFile = (brain, id) => join(brain, CONVERSATION_READS_DIR_REL, id);
const reads = (brain, id) => readConversationReads(brain, id);

// A citation the way the server renders it (by hand, not by the renderer).
const cite = (path) => `### 1. T — S\n**Path:** \`vault/${path}\` | **Type:** topic | **Score:** 0.9\n\nexcerpt`;

const start = (brain, session_id, source = "startup") =>
  runHook(brain, { session_id, hook_event_name: "SessionStart", source });
const search = (brain, session_id, paths, tool_input = { query: "q" }) =>
  runHook(brain, {
    session_id,
    hook_event_name: "PostToolUse",
    tool_name: "mcp__vault-rag__search_vault",
    tool_input,
    tool_response: [{ type: "text", text: paths.length ? paths.map(cite).join("\n\n---\n\n") : "No results found in the vault." }],
  });
const open = (brain, session_id, path) =>
  runHook(brain, {
    session_id,
    hook_event_name: "PostToolUse",
    tool_name: "mcp__vault-rag__get_document",
    tool_input: { path },
    tool_response: [{ type: "text", text: "note body" }],
  });

test("a conversation that starts, then searches, records the universes of the notes returned, in silence", () => {
  withBrain((brain) => {
    const began = start(brain, "s-live");
    assert.equal(began.status, 0, began.stderr);
    assert.equal(began.stdout, "", "a SessionStart hook's stdout lands in the conversation: it must say nothing");
    assert.deepEqual(reads(brain, "s-live"), []);

    // One named note and one cross-cutting one: only the named universe is recorded.
    const run = search(brain, "s-live", ["acme/deals/big-deal.md", "people/jane.md"]);
    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.stdout, "", "a recorder never speaks");
    assert.deepEqual(reads(brain, "s-live"), ["acme"]);
  });
});

test("an answer with no citation records nothing (no results, a stale-index gate)", () => {
  withBrain((brain) => {
    start(brain, "s1");
    search(brain, "s1", []);
    assert.deepEqual(reads(brain, "s1"), []);
  });
});

test("an all-universes search records exactly the universes it returned, not a blanket mark", () => {
  withBrain((brain) => {
    start(brain, "s1");
    search(brain, "s1", ["blue/people/bob.md", "acme/deals/big-deal.md"], { query: "q", allUniverses: true });
    assert.deepEqual(reads(brain, "s1"), ["blue", "acme"]);
  });
});

test("get_document records the universe of the note it opened, not the active one", () => {
  // The pointer names 'acme'; the note opened is Bob's, in 'blue'.
  withBrain((brain) => {
    start(brain, "s1");
    open(brain, "s1", "blue/people/bob.md");
    assert.deepEqual(reads(brain, "s1"), ["blue"]);
  });
});

test("a path that climbs out of the vault is never read", () => {
  withBrain((brain) => {
    writeFileSync(join(brain, "outside.md"), "---\nuniverse: acme\n---\n");
    start(brain, "s1");
    open(brain, "s1", "../outside.md");
    assert.deepEqual(reads(brain, "s1"), []);
  });
});

test("reads accumulate once each, per conversation, and never leak into another one", () => {
  withBrain((brain) => {
    start(brain, "s1");
    start(brain, "s2", "clear");
    search(brain, "s1", ["acme/deals/big-deal.md"]);
    open(brain, "s1", "blue/people/bob.md");
    search(brain, "s1", ["acme/deals/big-deal.md"]);
    search(brain, "s2", ["blue/people/bob.md"]);
    assert.equal(readFileSync(recordFile(brain, "s1"), "utf8"), "acme\nblue\n", "an already-recorded universe is not appended again");
    assert.deepEqual(reads(brain, "s2"), ["blue"]);
  });
});

test("a single-universe brain records nothing (nothing there can ever go out of scope)", () => {
  withBrain(
    (brain) => {
      start(brain, "s1");
      search(brain, "s1", ["acme/deals/big-deal.md"]);
      assert.deepEqual(reads(brain, "s1"), []);
    },
    { universes: [] },
  );
});

test("a conversation the recorder never saw begin stays unknown, even after it reads", () => {
  // The gap between an update and the restart: the hook is wired on disk, but this
  // conversation started without it. Recording its later reads would vouch for a
  // window whose earlier reads nobody saw.
  withBrain((brain) => {
    search(brain, "s-old", ["acme/deals/big-deal.md"]);
    start(brain, "s-old", "resume");
    start(brain, "s-old", "compact");
    open(brain, "s-old", "acme/deals/big-deal.md");
    assert.equal(reads(brain, "s-old"), null);
    assert.equal(existsSync(recordFile(brain, "s-old")), false);
  });
});

test("a new conversation keeps only the most recent records", () => {
  withBrain((brain) => {
    const dir = join(brain, CONVERSATION_READS_DIR_REL);
    mkdirSync(dir, { recursive: true });
    for (let i = 0; i < MAX_SESSIONS; i++) {
      writeFileSync(join(dir, `s${i}`), "acme\n");
      utimesSync(join(dir, `s${i}`), 1000 + i, 1000 + i);
    }
    start(brain, "new");
    const left = readdirSync(dir);
    assert.equal(left.length, MAX_SESSIONS);
    assert.ok(!left.includes("s0"), "the oldest conversation is the one dropped");
    assert.ok(left.includes("s1") && left.includes("new"));
  });
});

test("unusable stdin, no session id or an unsafe one: exit 0, silence, and nothing written", () => {
  withBrain((brain) => {
    for (const input of [
      "{not json",
      { hook_event_name: "SessionStart", source: "startup" },
      { session_id: "../escape", hook_event_name: "SessionStart", source: "startup" },
    ]) {
      const run = runHook(brain, input);
      assert.equal(run.status, 0, run.stderr);
      assert.equal(run.stdout, "");
    }
    assert.equal(existsSync(join(brain, CONVERSATION_READS_DIR_REL)), false);
    assert.equal(existsSync(join(brain, ".cache", "escape")), false);
    // Refutable: a hook that did nothing at all would pass the lines above.
    start(brain, "s-ok");
    assert.deepEqual(readdirSync(join(brain, CONVERSATION_READS_DIR_REL)), ["s-ok"]);
  });
});

test("readConversationReads — null for a conversation never seen, or with no usable id", () => {
  withBrain((brain) => {
    start(brain, "s1");
    assert.deepEqual(readConversationReads(brain, "s1"), []);
    assert.equal(readConversationReads(brain, "s2"), null);
    assert.equal(readConversationReads(brain, undefined), null);
    assert.equal(readConversationReads(brain, "../s1"), null);
  });
});

test("renameConversationReads — a renamed universe is renamed in every record", () => {
  withBrain((brain) => {
    start(brain, "s1");
    start(brain, "s2");
    search(brain, "s1", ["acme/deals/big-deal.md", "blue/people/bob.md"]);
    search(brain, "s2", ["blue/people/bob.md"]);
    renameConversationReads(brain, "acme", "acme-corp");
    assert.deepEqual(reads(brain, "s1"), ["acme-corp", "blue"]);
    assert.deepEqual(reads(brain, "s2"), ["blue"]);
  });
  // No record directory at all: nothing to rename, and no crash.
  withBrain((brain) => assert.doesNotThrow(() => renameConversationReads(brain, "acme", "x")));
});

// ── the wiring: the matcher must fire on the tool names Claude Code really uses ──
// Claude Code reads a matcher made only of letters, digits, `_` and `|` as a list of
// EXACT tool names, and anything else as a regex. An MCP tool is named
// mcp__<server>__<tool>, so `search_vault|get_document` never fires. Observed live on
// 2026-09-26 (Claude Code 2.1.283, a probe MCP server named vault-rag): that matcher
// stayed silent, `mcp__vault-rag__(search_vault|get_document)` and `mcp__vault-rag__.*`
// both fired. This models that rule, so the template is judged by it.
function hostMatcherFires(matcher, toolName) {
  if (matcher === "" || matcher === "*") return true;
  if (/^[A-Za-z0-9_|]+$/.test(matcher)) return matcher.split("|").includes(toolName);
  return new RegExp(`^(?:${matcher})$`).test(toolName);
}

test("the host's matcher rule, pinned on what was observed live", () => {
  assert.equal(hostMatcherFires("search_vault|get_document", "mcp__vault-rag__search_vault"), false);
  assert.equal(hostMatcherFires("mcp__vault-rag__(search_vault|get_document)", "mcp__vault-rag__search_vault"), true);
  assert.equal(hostMatcherFires("mcp__vault-rag__.*", "mcp__vault-rag__get_document"), true);
  assert.equal(hostMatcherFires("Write|Edit", "Edit"), true);
});

test("the template wires the recorder on the REAL names of the two vault tools, and on nothing else", () => {
  const root = join(SCRIPTS_DIR, "..");
  const settings = JSON.parse(readFileSync(join(root, ".claude", "settings.json.template"), "utf8"));
  const groups = settings.hooks.PostToolUse.filter((g) => g.hooks.some((h) => h.command.includes("conversation-reads.mjs")));
  assert.equal(groups.length, 1);
  // The server's name comes from the MCP template, so a rename there is caught here.
  const server = Object.keys(JSON.parse(readFileSync(join(root, ".mcp.json.template"), "utf8")).mcpServers).find(
    (name) => name === "vault-rag",
  );
  assert.equal(server, "vault-rag");
  const fires = (tool) => hostMatcherFires(groups[0].matcher, `mcp__${server}__${tool}`);
  assert.deepEqual(
    ["search_vault", "get_document", "list_documents", "reindex"].map(fires),
    [true, true, false, false],
  );
});

// ── runRecorder in-process, on doubles that record every call ──────────────────
function fakeDeps({ input, record = "", multiverse = true, notes = {} }) {
  const calls = [];
  return {
    calls,
    deps: {
      readInput: () => JSON.stringify(input),
      brainDir: () => "/brain",
      isMultiverse: (b) => (calls.push(["isMultiverse", b]), multiverse),
      readNote: (b, rel) => (calls.push(["readNote", b, rel]), notes[rel] ?? null),
      startRecord: (b, p) => calls.push(["startRecord", b, p]),
      readRecord: (p) => (calls.push(["readRecord", p]), record),
      appendRecord: (p, text) => calls.push(["appendRecord", p, text]),
    },
  };
}
const recordAt = join("/brain", CONVERSATION_READS_DIR_REL, "s1");
const readOf = (paths) => ({
  session_id: "s1",
  hook_event_name: "PostToolUse",
  tool_name: "mcp__vault-rag__search_vault",
  tool_input: {},
  tool_response: [{ type: "text", text: paths.map(cite).join("\n\n") }],
});

test("runRecorder — appends only what is new, and writes nothing when nothing is", () => {
  const notes = { "acme/a.md": "---\nuniverse: acme\n---\n", "blue/b.md": "---\nuniverse: blue\n---\n", "gone.md": null };
  const fresh = fakeDeps({ input: readOf(["acme/a.md", "gone.md", "blue/b.md"]), record: "acme\n", notes });
  assert.equal(runRecorder(fresh.deps), 0);
  assert.deepEqual(fresh.calls, [
    ["readRecord", recordAt],
    ["isMultiverse", "/brain"],
    ["readNote", "/brain", "acme/a.md"],
    ["readNote", "/brain", "gone.md"],
    ["readNote", "/brain", "blue/b.md"],
    ["appendRecord", recordAt, "blue\n"],
  ]);
  const nothingNew = fakeDeps({ input: readOf(["acme/a.md"]), record: "acme\n", notes });
  runRecorder(nothingNew.deps);
  assert.deepEqual(nothingNew.calls.map(([name]) => name), ["readRecord", "isMultiverse", "readNote"]);
});

test("runRecorder — an unknown conversation, or a single-universe brain, reads no note at all", () => {
  const unknown = fakeDeps({ input: readOf(["acme/a.md"]), record: null });
  runRecorder(unknown.deps);
  assert.deepEqual(unknown.calls, [["readRecord", recordAt]]);
  const single = fakeDeps({ input: readOf(["acme/a.md"]), multiverse: false });
  runRecorder(single.deps);
  assert.deepEqual(single.calls, [["readRecord", recordAt], ["isMultiverse", "/brain"]]);
});

test("runRecorder — SessionStart opens a record only for a fresh window, and reads nothing", () => {
  const fresh = fakeDeps({ input: { session_id: "s1", hook_event_name: "SessionStart", source: "clear" } });
  runRecorder(fresh.deps);
  assert.deepEqual(fresh.calls, [["startRecord", "/brain", recordAt]]);
  const resumed = fakeDeps({ input: { session_id: "s1", hook_event_name: "SessionStart", source: "resume" } });
  runRecorder(resumed.deps);
  assert.deepEqual(resumed.calls, []);
});

test("a conversation never seen stays unknown even once another one has created the record directory", () => {
  withBrain((brain) => {
    start(brain, "s-other");
    search(brain, "s-old", ["acme/deals/big-deal.md"]);
    assert.equal(existsSync(recordFile(brain, "s-old")), false);
  });
});

test("the template opens the record with session-reads on SessionStart, and records with conversation-reads after a read", () => {
  const settings = JSON.parse(readFileSync(join(SCRIPTS_DIR, "..", ".claude", "settings.json.template"), "utf8"));
  const eventsRunning = (script) =>
    Object.entries(settings.hooks)
      .filter(([, groups]) => groups.some((g) => g.hooks.some((h) => h.command.includes(`scripts/${script}`))))
      .map(([event]) => event);
  assert.deepEqual(eventsRunning("session-reads.mjs"), ["SessionStart"]);
  assert.deepEqual(eventsRunning("conversation-reads.mjs"), ["PostToolUse"]);
});

test("no engine script is wired on two events", () => {
  // The update report is printed by the OLD engine already in a brain, whose reconcile
  // names a script once per event it adds it to: a script on two events reads
  // "conversation-reads, conversation-reads" to its owner, and no new code can reach
  // that line (seen on the rehearsal of 2026-09-26). One script, one event.
  const settings = JSON.parse(readFileSync(join(SCRIPTS_DIR, "..", ".claude", "settings.json.template"), "utf8"));
  const seen = new Map();
  for (const [event, groups] of Object.entries(settings.hooks)) {
    for (const g of groups) {
      for (const h of g.hooks) {
        const script = h.command.match(/scripts\/[\w.-]+\.mjs/)?.[0];
        if (!script) continue;
        seen.set(script, [...new Set([...(seen.get(script) ?? []), event])]);
      }
    }
  }
  assert.deepEqual([...seen].filter(([, events]) => events.length > 1), []);
});
