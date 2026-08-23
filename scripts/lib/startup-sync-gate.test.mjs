import { test } from "node:test";
import assert from "node:assert/strict";
import { dirname, join } from "node:path";

import {
  SYNC_MARKER_REL,
  blockingSleep,
  hookSessionId,
  markSyncDone,
  markSyncRunning,
  pullerIsWired,
  pullerWiredIn,
  readHookPayload,
  waitForStartupSync,
  awaitStartupSync,
} from "./startup-sync-gate.mjs";

// In-memory fs with the four calls the gate is allowed to make. Keyed on the real
// `join`, so the assertions hold on Windows too (the CI matrix is the arbiter, §9).
function fakeIo(files = new Map()) {
  const mkdirs = [];
  return {
    files,
    mkdirs,
    existsSync: (p) => files.has(p),
    readFileSync: (p) => {
      if (!files.has(p)) throw new Error(`ENOENT: ${p}`);
      return files.get(p);
    },
    writeFileSync: (p, body) => files.set(p, body),
    // Recorded, arguments and all: a fake that swallows its call lets every option
    // of it drift unobserved (CONVENTIONS §5ter, cluster 1).
    mkdirSync: (...args) => mkdirs.push(args),
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

test("the marker's home is .cache/ — the dir every brain gitignores, so a session's marker is never committed", () => {
  // Asserted as a literal, not recomputed from the constant: every test below builds
  // its path FROM SYNC_MARKER_REL, so without this one the marker could move
  // anywhere — including somewhere auto-commit would sweep into the owner's history.
  assert.equal(SYNC_MARKER_REL, join(".cache", "startup-sync.json"));
});

test("markSync*: the .cache dir is created, recursively — a brain that never had one still writes its first marker", () => {
  const io = fakeIo();

  markSyncRunning({ repo: "/brain", sessionId: "s-42", io, now: () => 0 });

  assert.deepEqual(io.mkdirs, [[dirname(MARKER), { recursive: true }]]);
});

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

test("pullerIsWired: the puller declared SECOND on its entry, beside another command — one matching hook is enough", () => {
  // Deliberately no empty and no absent hooks list anywhere: an entry with none
  // answers "all of mine match" vacuously, which would let a reader that demands
  // ALL of them pass this test for the wrong reason. Every entry here has two.
  const sharedEntries = {
    hooks: {
      SessionStart: [
        {
          matcher: "",
          hooks: [
            { type: "command", command: 'node "/b/scripts/session-health.mjs"' },
            { type: "command", command: 'node "/b/scripts/session-universe.mjs"' },
          ],
        },
        {
          matcher: "",
          hooks: [
            { type: "command", command: 'node "/b/scripts/session-universe.mjs"' },
            { type: "command", command: 'node "/b/scripts/session-status.mjs"' },
          ],
        },
      ],
    },
  };

  assert.equal(pullerIsWired(sharedEntries), true);
});

test("pullerIsWired: settings a hand has dented — a blanked entry, a null hook slot — still answer, never throw", () => {
  // A hook that throws at session start costs the owner their start. This file is
  // the owner's to edit, so half-shapes are not hypothetical.
  const dented = {
    hooks: {
      SessionStart: [
        null,
        { matcher: "", hooks: [null, { type: "command", command: 'node "/b/scripts/session-health.mjs"' }] },
        { matcher: "", hooks: [{ type: "command", command: 'node "/b/scripts/session-status.mjs"' }] },
      ],
    },
  };

  assert.equal(pullerIsWired(dented), true);
});

test("markSync*: without a session id there is nothing to key a marker on — none is written, and the puller carries on", () => {
  const io = fakeIo();

  assert.equal(markSyncRunning({ repo: "/brain", sessionId: null, io, now: () => 0 }), false);
  assert.equal(markSyncDone({ repo: "/brain", sessionId: null, io, now: () => 0 }), false);
  assert.equal(io.files.size, 0);
});

test("markSync*: a disk that refuses the marker never costs the owner their pull", () => {
  const broken = { ...fakeIo(), writeFileSync: () => { throw new Error("EROFS"); } };

  assert.equal(markSyncRunning({ repo: "/brain", sessionId: "s-42", io: broken, now: () => 0 }), false);
  assert.equal(markSyncDone({ repo: "/brain", sessionId: "s-42", io: broken, now: () => 0 }), false);
});

test("markSync*: the ordinary path reports that the marker was actually written", () => {
  const io = fakeIo();

  assert.equal(markSyncRunning({ repo: "/brain", sessionId: "s-42", io, now: () => 0 }), true);
  assert.equal(markSyncDone({ repo: "/brain", sessionId: "s-42", io, now: () => 1 }), true);
});

test("readHookPayload: the hook payload is read from fd 0, where the harness pipes it", () => {
  assert.equal(
    readHookPayload({ readInput: () => '{"session_id":"a1b2"}', isTTY: () => false }),
    '{"session_id":"a1b2"}',
  );
});

test("readHookPayload: run by hand at a terminal, it reads NOTHING — fd 0 there is a keyboard, and would hang", () => {
  let read = false;
  const payload = readHookPayload({
    readInput: () => {
      read = true;
      return "typed by a human";
    },
    isTTY: () => true,
  });

  assert.equal(payload, "");
  assert.equal(read, false, "fd 0 must not even be touched at a terminal");
});

test("readHookPayload: the TTY guard is wired to the REAL stdin — not only to the stub the tests hand it", () => {
  // Every other test injects `isTTY`, so the default could be wired to anything and
  // stay green. It is the default that runs on the owner's machine, and if it stops
  // answering "this is a terminal", running the hook by hand blocks on the keyboard.
  const wasTTY = process.stdin.isTTY;
  process.stdin.isTTY = true;
  try {
    let read = false;
    const payload = readHookPayload({
      readInput: () => {
        read = true;
        return "typed by a human";
      },
    });

    assert.equal(payload, "");
    assert.equal(read, false, "the real stdin said terminal — fd 0 must not be touched");
  } finally {
    process.stdin.isTTY = wasTTY;
  }
});

test("readHookPayload: an unreadable fd 0 is silence, never a thrown hook", () => {
  assert.equal(
    readHookPayload({ readInput: () => { throw new Error("EAGAIN"); }, isTTY: () => false }),
    "",
  );
});

test("blockingSleep: it really blocks the thread — a poll loop that does not is a spin", () => {
  const before = Date.now();

  blockingSleep(30);

  assert.ok(Date.now() - before >= 25, "the wait must be a real one, not a no-op");
});

test("pullerWiredIn: the question is answered from the brain's OWN settings file, on disk", () => {
  const settingsPath = join("/brain", ".claude", "settings.json");
  const io = fakeIo(
    new Map([
      [
        settingsPath,
        JSON.stringify({
          hooks: { SessionStart: [{ hooks: [{ command: 'node "/b/scripts/session-status.mjs"' }] }] },
        }),
      ],
    ]),
  );

  assert.equal(pullerWiredIn({ repo: "/brain", io }), true);
});

test("pullerWiredIn: no settings file, or bytes that are not JSON — nobody is expected to pull", () => {
  assert.equal(pullerWiredIn({ repo: "/brain", io: fakeIo() }), false);
  const corrupt = fakeIo(new Map([[join("/brain", ".claude", "settings.json"), "{ not json"]]));
  assert.equal(pullerWiredIn({ repo: "/brain", io: corrupt }), false);
});

// ── awaitStartupSync — the ONE spelling, and the fail-open it owes (T11) ─────
// Added when the barrier got its SECOND caller (`session-engine-divergence.mjs`). At
// the call site it is five arguments that all have to agree, and the way they stop
// agreeing is a hook that quietly stops waiting: a wrong `repo` waits on another
// brain's marker, a forgotten `pullerWired` taxes every pre-barrier brain forever, and
// either one reads exactly like success.

test("awaitStartupSync: an io that throws costs a stale read at worst, never the session start", () => {
  // This runs BEFORE its callers' own try/catch — it is the first thing a hook does —
  // so the guarantee has to live in what SHIPS. A hook asserting the same thing through
  // an injected throwing double would only ever prove the double.
  //
  // A wrapper here was written first, and this test is what measured it as unreachable:
  // every part composed already swallows, so a disk in revolt answers "nobody will pull"
  // and the caller reads what is on disk. The wrapper came back out.
  const hostile = {
    existsSync: () => {
      throw new Error("EIO");
    },
    readFileSync: () => {
      throw new Error("EIO");
    },
  };

  const outcome = awaitStartupSync({ repo: "/brain", io: hostile, now: () => 0, sleep: () => {} });

  assert.deepEqual(outcome, { status: "not-expected", waitedMs: 0 }, "it answers, rather than throwing at its caller");
});

test("awaitStartupSync: no puller wired → it returns at once, without reading a marker", () => {
  // The brains that predate the barrier, and the owners who removed the hook. Waiting
  // would tax every one of their session starts for a marker that cannot appear.
  const io = fakeIo(new Map());

  const outcome = awaitStartupSync({ repo: "/brain", io, now: () => 0, sleep: () => {} });

  assert.deepEqual(outcome, { status: "not-expected", waitedMs: 0 });
});

test("awaitStartupSync: it asks the gate about the repo it was GIVEN, not about a default", () => {
  // A helper that resolved its own root would answer for the wrong brain and look like
  // success — the exact failure it exists to prevent at the call sites.
  const settings = JSON.stringify({
    hooks: { SessionStart: [{ hooks: [{ command: 'node "/elsewhere/scripts/session-status.mjs"' }] }] },
  });
  const io = fakeIo(new Map([[join("/elsewhere", ".claude", "settings.json"), settings]]));

  const wired = awaitStartupSync({ repo: "/elsewhere", io, now: () => 0, sleep: () => {} });
  const elsewhere = awaitStartupSync({ repo: "/brain", io, now: () => 0, sleep: () => {} });

  assert.equal(wired.status, "unknown-session", "the puller IS wired there — it got past the first gate");
  assert.equal(elsewhere.status, "not-expected", "and nothing is wired here");
});
