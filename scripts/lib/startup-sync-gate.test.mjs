import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";

import {
  SYNC_MARKER_REL,
  hookSessionId,
  markSyncDone,
  markSyncRunning,
  pullerIsWired,
  waitForStartupSync,
} from "./startup-sync-gate.mjs";

// In-memory fs with the four calls the gate is allowed to make. Keyed on the real
// `join`, so the assertions hold on Windows too (the CI matrix is the arbiter, §9).
function fakeIo(files = new Map()) {
  return {
    files,
    existsSync: (p) => files.has(p),
    readFileSync: (p) => {
      if (!files.has(p)) throw new Error(`ENOENT: ${p}`);
      return files.get(p);
    },
    writeFileSync: (p, body) => files.set(p, body),
    mkdirSync: () => {},
  };
}

const MARKER = join("/brain", SYNC_MARKER_REL);

// A clock the test drives: `sleep` is the ONLY thing that makes time pass, so a
// wait that forgets to sleep spins forever instead of quietly passing.
function fakeClock(start = 0) {
  let t = start;
  const slept = [];
  return {
    now: () => t,
    sleep: (ms) => {
      slept.push(ms);
      t += ms;
    },
    slept,
  };
}

test("markSyncRunning: BEFORE pulling, the puller names this session — so a hook that must wait knows a writer exists", () => {
  const io = fakeIo();

  markSyncRunning({ repo: "/brain", sessionId: "s-42", io, now: () => 1000 });

  assert.deepEqual(JSON.parse(io.files.get(MARKER)), {
    sessionId: "s-42",
    phase: "running",
    at: 1000,
  });
});

test("markSyncDone: the pull has landed, and the marker says so — that flip is what releases the waiters", () => {
  const io = fakeIo();
  markSyncRunning({ repo: "/brain", sessionId: "s-42", io, now: () => 1000 });

  markSyncDone({ repo: "/brain", sessionId: "s-42", io, now: () => 1400 });

  assert.deepEqual(JSON.parse(io.files.get(MARKER)), {
    sessionId: "s-42",
    phase: "done",
    at: 1400,
  });
});

test("waitForStartupSync: the pull has already landed when the reader looks — it reads on, without sleeping once", () => {
  const io = fakeIo();
  const clock = fakeClock();
  markSyncDone({ repo: "/brain", sessionId: "s-42", io, now: () => 0 });

  const outcome = waitForStartupSync({
    repo: "/brain",
    sessionId: "s-42",
    io,
    now: clock.now,
    sleep: clock.sleep,
    pullerWired: true,
  });

  assert.deepEqual(outcome, { status: "done", waitedMs: 0 });
  assert.deepEqual(clock.slept, []);
});

test("waitForStartupSync: the pull is still in flight — the reader polls, and resumes the very moment it lands", () => {
  const io = fakeIo();
  const clock = fakeClock();
  markSyncRunning({ repo: "/brain", sessionId: "s-42", io, now: () => 0 });
  // The puller is another PROCESS: the marker flips under the reader's feet. Here
  // it flips after the second look, so the third one releases the wait.
  let reads = 0;
  const watched = {
    ...io,
    readFileSync: (p) => {
      const body = io.readFileSync(p);
      reads += 1;
      if (reads === 2) markSyncDone({ repo: "/brain", sessionId: "s-42", io, now: () => 500 });
      return body;
    },
  };

  const outcome = waitForStartupSync({
    repo: "/brain",
    sessionId: "s-42",
    io: watched,
    now: clock.now,
    sleep: clock.sleep,
    pullerWired: true,
  });

  assert.deepEqual(outcome, { status: "done", waitedMs: 100 });
  assert.deepEqual(clock.slept, [50, 50]);
});

test("waitForStartupSync: no puller is wired at all (a brain from before this hook) — the reader NEVER waits for a pull nobody will do", () => {
  const io = fakeIo();
  const clock = fakeClock();

  const outcome = waitForStartupSync({
    repo: "/brain",
    sessionId: "s-42",
    io,
    now: clock.now,
    sleep: clock.sleep,
    pullerWired: false,
  });

  assert.deepEqual(outcome, { status: "not-expected", waitedMs: 0 });
  assert.deepEqual(clock.slept, []);
});

test("waitForStartupSync: the puller is wired but dies before saying a word — the reader gives up on a SHORT grace, not the full ceiling", () => {
  const io = fakeIo(); // no marker will ever be written
  const clock = fakeClock();

  const outcome = waitForStartupSync({
    repo: "/brain",
    sessionId: "s-42",
    io,
    now: clock.now,
    sleep: clock.sleep,
    pullerWired: true,
  });

  // Long enough to cover a cold `node` start on a slow machine, short enough that a
  // crashed puller costs seconds, not the 12 s a real in-flight pull is allowed.
  assert.deepEqual(outcome, { status: "no-writer", waitedMs: 3000 });
});

test("waitForStartupSync: the marker left by the PREVIOUS session is not this session's pull — it releases nobody", () => {
  const io = fakeIo();
  const clock = fakeClock();
  markSyncDone({ repo: "/brain", sessionId: "s-41", io, now: () => 0 }); // yesterday's start

  const outcome = waitForStartupSync({
    repo: "/brain",
    sessionId: "s-42",
    io,
    now: clock.now,
    sleep: clock.sleep,
    pullerWired: true,
  });

  assert.deepEqual(outcome, { status: "no-writer", waitedMs: 3000 });
});

test("waitForStartupSync: a pull that never lands releases the session anyway, at the ceiling — a hook is never allowed to hang", () => {
  const io = fakeIo();
  const clock = fakeClock();
  markSyncRunning({ repo: "/brain", sessionId: "s-42", io, now: () => 0 }); // and never flips

  const outcome = waitForStartupSync({
    repo: "/brain",
    sessionId: "s-42",
    io,
    now: clock.now,
    sleep: clock.sleep,
    pullerWired: true,
  });

  assert.deepEqual(outcome, { status: "timeout", waitedMs: 12_000 });
});

test("waitForStartupSync: the harness handed this hook no session id — no key, no barrier, and above all no wait", () => {
  const io = fakeIo();
  const clock = fakeClock();
  markSyncRunning({ repo: "/brain", sessionId: "s-42", io, now: () => 0 });

  const outcome = waitForStartupSync({
    repo: "/brain",
    sessionId: null,
    io,
    now: clock.now,
    sleep: clock.sleep,
    pullerWired: true,
  });

  assert.deepEqual(outcome, { status: "unknown-session", waitedMs: 0 });
  assert.deepEqual(clock.slept, []);
});

test("hookSessionId: the id every SessionStart hook is handed on stdin — the one key both sides share", () => {
  assert.equal(
    hookSessionId('{"session_id":"a1b2","transcript_path":"/t.jsonl","source":"startup"}'),
    "a1b2",
  );
});

test("hookSessionId: unusable stdin is no id — the barrier opens rather than guessing", () => {
  assert.equal(hookSessionId(""), null);
  assert.equal(hookSessionId("not json"), null);
  assert.equal(hookSessionId('{"source":"startup"}'), null);
  assert.equal(hookSessionId(null), null);
});

test("pullerIsWired: the brain's own settings say whether anyone will pull this session", () => {
  const wired = {
    hooks: {
      SessionStart: [
        { matcher: "", hooks: [{ type: "command", command: 'node "/b/scripts/session-universe.mjs"' }] },
        { matcher: "", hooks: [{ type: "command", command: 'node "/b/scripts/session-status.mjs"' }] },
      ],
    },
  };

  assert.equal(pullerIsWired(wired), true);
});

test("pullerIsWired: session-status wired on ANOTHER event does not pull at session start", () => {
  const elsewhere = {
    hooks: {
      SessionStart: [
        { matcher: "", hooks: [{ type: "command", command: 'node "/b/scripts/session-universe.mjs"' }] },
      ],
      SessionEnd: [
        { matcher: "", hooks: [{ type: "command", command: 'node "/b/scripts/session-status.mjs"' }] },
      ],
    },
  };

  assert.equal(pullerIsWired(elsewhere), false);
});

test("pullerIsWired: a brain with no hooks at all, or unreadable settings, expects no puller", () => {
  assert.equal(pullerIsWired({}), false);
  assert.equal(pullerIsWired(null), false);
});
