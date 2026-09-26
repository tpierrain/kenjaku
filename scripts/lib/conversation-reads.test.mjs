import { test } from "node:test";
import assert from "node:assert/strict";

import {
  universeOfRead,
  recordRead,
  readsFor,
  recorderWired,
  conversationReads,
  MAX_SESSIONS,
} from "./conversation-reads.mjs";
import { ALL_UNIVERSES_READ } from "./universes.mjs";

// Issue #130 — what a conversation actually read, per session id, so the switch can
// stop claiming a residue it cannot see. Pure: the hook and the CLI own the I/O.

test("universeOfRead — a read lands in the universe active when it ran", () => {
  assert.equal(universeOfRead({ toolInput: { query: "q" }, active: "acme" }), "acme");
  // get_document has no scope flag at all: still the active universe.
  assert.equal(universeOfRead({ toolInput: { path: "a.md" }, active: "blue" }), "blue");
});

test("universeOfRead — an all-universes search is recorded as such, not as the active one", () => {
  assert.equal(
    universeOfRead({ toolInput: { query: "q", allUniverses: true }, active: "acme" }),
    ALL_UNIVERSES_READ
  );
  // Only a literal true spans them: anything else is the server's default scope.
  assert.equal(universeOfRead({ toolInput: { allUniverses: false }, active: "acme" }), "acme");
  assert.equal(universeOfRead({ toolInput: { allUniverses: "yes" }, active: "acme" }), "acme");
  assert.equal(universeOfRead({ toolInput: undefined, active: "acme" }), "acme");
});

test("recordRead — the first read of a session starts its record", () => {
  assert.deepEqual(recordRead(null, { sessionId: "s1", universe: "acme", now: 111 }), {
    sessions: { s1: { universes: ["acme"], at: 111 } },
  });
});

test("recordRead — later reads add a universe once, and leave other sessions alone", () => {
  const state = {
    sessions: {
      s1: { universes: ["acme"], at: 1 },
      s2: { universes: ["zeta"], at: 2 },
    },
  };
  const once = recordRead(state, { sessionId: "s1", universe: "blue", now: 3 });
  const twice = recordRead(once, { sessionId: "s1", universe: "acme", now: 4 });
  assert.deepEqual(twice, {
    sessions: {
      s1: { universes: ["acme", "blue"], at: 4 },
      s2: { universes: ["zeta"], at: 2 },
    },
  });
  // Not mutated: the caller's copy is what it was.
  assert.deepEqual(state.sessions.s1, { universes: ["acme"], at: 1 });
});

test("recordRead — without a session id there is nothing to key it on, so nothing changes", () => {
  const state = { sessions: { s1: { universes: ["acme"], at: 1 } } };
  assert.equal(recordRead(state, { sessionId: undefined, universe: "blue", now: 2 }), state);
  assert.equal(recordRead(state, { sessionId: "", universe: "blue", now: 2 }), state);
});

test("recordRead — a corrupt record is started afresh rather than crashing the hook", () => {
  for (const bad of [{}, { sessions: "x" }, { sessions: { s1: { universes: "acme" } } }, 42]) {
    assert.deepEqual(
      recordRead(bad, { sessionId: "s1", universe: "blue", now: 5 }).sessions.s1,
      { universes: ["blue"], at: 5 }
    );
  }
});

test("recordRead — the file keeps only the most recent sessions", () => {
  // MAX_SESSIONS existing, unsorted, then one more: the OLDEST goes, and only it.
  const sessions = {};
  const order = [...Array(MAX_SESSIONS).keys()].reverse();
  for (const i of order) sessions[`s${i}`] = { universes: ["acme"], at: 100 + i };
  const next = recordRead({ sessions }, { sessionId: "new", universe: "blue", now: 999 });
  const ids = Object.keys(next.sessions);
  assert.equal(ids.length, MAX_SESSIONS);
  assert.ok(!ids.includes("s0"), "the oldest session is the one dropped");
  assert.ok(ids.includes("s1") && ids.includes("new"));
});

test("recordRead — at exactly the cap, the new session fits without dropping anyone else", () => {
  const sessions = {};
  for (let i = 0; i < MAX_SESSIONS - 1; i++) sessions[`s${i}`] = { universes: [], at: i };
  const next = recordRead({ sessions }, { sessionId: "new", universe: "blue", now: 999 });
  assert.equal(Object.keys(next.sessions).length, MAX_SESSIONS);
  assert.ok("s0" in next.sessions);
});

test("readsFor — this session's universes, or none when it never read", () => {
  const state = { sessions: { s1: { universes: ["acme", "blue"], at: 1 } } };
  assert.deepEqual(readsFor(state, "s1"), ["acme", "blue"]);
  assert.deepEqual(readsFor(state, "s2"), []);
  assert.deepEqual(readsFor(null, "s1"), []);
  assert.deepEqual(readsFor({ sessions: { s1: { universes: "acme" } } }, "s1"), []);
});

// A settings.json written the way a human would leave it, never by the code under
// test: two events, the recorder among other PostToolUse hooks, a decoy elsewhere.
const WIRED = `{
  "hooks": {
    "PreToolUse": [ { "matcher": "Write", "hooks": [ { "type": "command", "command": "node \\"/b/scripts/vault-write-guard.mjs\\"" } ] } ],
    "PostToolUse": [
      { "matcher": "Write|Edit", "hooks": [ { "type": "command", "command": "node \\"/b/scripts/auto-commit.mjs\\"" } ] },
      { "matcher": "search_vault|get_document", "hooks": [ { "type": "command", "command": "node \\"/b/scripts/conversation-reads.mjs\\"" } ] }
    ]
  }
}`;

test("recorderWired — true when a PostToolUse hook runs the recorder", () => {
  assert.equal(recorderWired(WIRED), true);
});

test("recorderWired — false when the recorder is absent, misplaced, or the file unusable", () => {
  assert.equal(recorderWired(WIRED.replace("conversation-reads.mjs", "other.mjs")), false);
  // Under another event it records nothing at the moment a read happens.
  const misplaced = `{"hooks":{"PreToolUse":[{"hooks":[{"command":"node scripts/conversation-reads.mjs"}]}]}}`;
  assert.equal(recorderWired(misplaced), false);
  for (const bad of [null, "", "{not json", "{}", `{"hooks":{"PostToolUse":"x"}}`]) {
    assert.equal(recorderWired(bad), false, `settings ${JSON.stringify(bad)}`);
  }
});

test("conversationReads — known only with a session id AND a wired recorder", () => {
  const state = { sessions: { s1: { universes: ["acme"], at: 1 } } };
  assert.deepEqual(conversationReads({ sessionId: "s1", state, settingsText: WIRED }), ["acme"]);
  // Wired, and this session never read: a KNOWN empty window, not an unknown one.
  assert.deepEqual(conversationReads({ sessionId: "s9", state: null, settingsText: WIRED }), []);
});

test("conversationReads — unknown (null) without a session id", () => {
  const state = { sessions: { s1: { universes: ["acme"], at: 1 } } };
  assert.equal(conversationReads({ sessionId: undefined, state, settingsText: WIRED }), null);
  assert.equal(conversationReads({ sessionId: "", state, settingsText: WIRED }), null);
});

test("conversationReads — unknown (null) when the recorder is not wired, whatever the file says", () => {
  // A brain not yet updated: an empty record there proves nothing about the window.
  const state = { sessions: { s1: { universes: ["acme"], at: 1 } } };
  assert.equal(conversationReads({ sessionId: "s1", state, settingsText: "{}" }), null);
  assert.equal(conversationReads({ sessionId: "s1", state: null, settingsText: null }), null);
});
