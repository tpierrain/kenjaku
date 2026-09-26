import { test } from "node:test";
import assert from "node:assert/strict";

import {
  universeOfRead,
  startSession,
  recordRead,
  readsFor,
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

// ── startSession: a conversation is KNOWN from its first instant, or never ─────
// The record can only vouch for a conversation it saw begin. One that started before
// the recorder was wired (the gap between an update and the restart), or a resumed
// one whose entry was pruned, has reads nobody recorded — so it must stay UNKNOWN,
// never read as "read nothing".

test("startSession — a new conversation (startup or /clear) starts with an empty record", () => {
  for (const source of ["startup", "clear"]) {
    assert.deepEqual(startSession(null, { sessionId: "s1", source, now: 7 }), {
      sessions: { s1: { universes: [], at: 7 } },
    }, source);
  }
});

test("startSession — a resumed or compacted conversation is left as it was", () => {
  // Its window may hold reads from before: creating an empty entry would vouch for
  // a silence nobody observed.
  const state = { sessions: { s1: { universes: ["acme"], at: 1 } } };
  for (const source of ["resume", "compact", undefined]) {
    assert.equal(startSession(state, { sessionId: "s1", source, now: 9 }), state, String(source));
    assert.equal(startSession(null, { sessionId: "s2", source, now: 9 }), null, String(source));
  }
});

test("startSession — without a session id there is nothing to key it on", () => {
  assert.equal(startSession(null, { sessionId: undefined, source: "startup", now: 1 }), null);
  assert.equal(startSession(null, { sessionId: "", source: "startup", now: 1 }), null);
});

test("startSession — other conversations are kept, and the file keeps only the most recent", () => {
  const sessions = {};
  const order = [...Array(MAX_SESSIONS).keys()].reverse();
  for (const i of order) sessions[`s${i}`] = { universes: ["acme"], at: 100 + i };
  const next = startSession({ sessions }, { sessionId: "new", source: "startup", now: 999 });
  const ids = Object.keys(next.sessions);
  assert.equal(ids.length, MAX_SESSIONS);
  assert.ok(!ids.includes("s0"), "the oldest conversation is the one dropped");
  assert.deepEqual(next.sessions.s1, { universes: ["acme"], at: 101 });
  assert.deepEqual(next.sessions.new, { universes: [], at: 999 });
});

test("startSession — at exactly the cap, the new conversation fits without dropping anyone", () => {
  const sessions = {};
  for (let i = 0; i < MAX_SESSIONS - 1; i++) sessions[`s${i}`] = { universes: [], at: i };
  const next = startSession({ sessions }, { sessionId: "new", source: "startup", now: 999 });
  assert.equal(Object.keys(next.sessions).length, MAX_SESSIONS);
  assert.ok("s0" in next.sessions);
});

test("startSession — a corrupt record is started afresh rather than crashing the hook", () => {
  for (const bad of [{}, { sessions: "x" }, { sessions: [] }, 42]) {
    assert.deepEqual(startSession(bad, { sessionId: "s1", source: "startup", now: 5 }), {
      sessions: { s1: { universes: [], at: 5 } },
    });
  }
});

// ── recordRead: only a conversation the record saw begin is written to ──────────

test("recordRead — reads add a universe once, and leave other conversations alone", () => {
  const state = {
    sessions: {
      s1: { universes: [], at: 1 },
      s2: { universes: ["zeta"], at: 2 },
    },
  };
  const once = recordRead(state, { sessionId: "s1", universe: "blue", now: 3 });
  const twice = recordRead(once, { sessionId: "s1", universe: "acme", now: 4 });
  const again = recordRead(twice, { sessionId: "s1", universe: "blue", now: 5 });
  assert.deepEqual(again, {
    sessions: {
      s1: { universes: ["blue", "acme"], at: 5 },
      s2: { universes: ["zeta"], at: 2 },
    },
  });
  // Not mutated: the caller's copy is what it was.
  assert.deepEqual(state.sessions.s1, { universes: [], at: 1 });
});

test("recordRead — a conversation the record never saw begin is NOT started by a read", () => {
  // Its earlier reads were never recorded: a partial list would name some spheres and
  // hide others, which is worse than the conditional sentence.
  const state = { sessions: { s1: { universes: [], at: 1 } } };
  assert.equal(recordRead(state, { sessionId: "s2", universe: "acme", now: 2 }), state);
  assert.equal(recordRead(null, { sessionId: "s2", universe: "acme", now: 2 }), null);
  assert.equal(recordRead({ sessions: "x" }, { sessionId: "s2", universe: "acme", now: 2 }).sessions, "x");
});

test("recordRead — without a session id, nothing changes", () => {
  const state = { sessions: { s1: { universes: [], at: 1 } } };
  assert.equal(recordRead(state, { sessionId: undefined, universe: "blue", now: 2 }), state);
  assert.equal(recordRead(state, { sessionId: "", universe: "blue", now: 2 }), state);
});

test("recordRead — an entry whose universes are corrupt is repaired, not crashed on", () => {
  const state = { sessions: { s1: { universes: "acme", at: 1 } } };
  assert.deepEqual(recordRead(state, { sessionId: "s1", universe: "blue", now: 2 }).sessions.s1, {
    universes: ["blue"],
    at: 2,
  });
});

// ── what the switch may rely on ────────────────────────────────────────────────

test("readsFor — this conversation's universes, or null when the record never saw it begin", () => {
  const state = { sessions: { s1: { universes: ["acme", "blue"], at: 1 }, s3: { universes: [], at: 2 } } };
  assert.deepEqual(readsFor(state, "s1"), ["acme", "blue"]);
  // Seen begin, read nothing: a KNOWN empty window.
  assert.deepEqual(readsFor(state, "s3"), []);
  assert.equal(readsFor(state, "s2"), null);
  assert.equal(readsFor(null, "s1"), null);
  assert.equal(readsFor({ sessions: "x" }, "s1"), null);
  assert.deepEqual(readsFor({ sessions: { s1: { universes: "acme" } } }, "s1"), []);
});

test("conversationReads — unknown (null) without a session id, whatever the record says", () => {
  const state = { sessions: { s1: { universes: ["acme"], at: 1 } } };
  assert.equal(conversationReads({ sessionId: undefined, state }), null);
  assert.equal(conversationReads({ sessionId: "", state }), null);
  assert.deepEqual(conversationReads({ sessionId: "s1", state }), ["acme"]);
  assert.equal(conversationReads({ sessionId: "s9", state }), null);
});
