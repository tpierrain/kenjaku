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

test("readHookPayload: asking whether fd 0 is a terminal must NOT instantiate process.stdin", () => {
  // THE defect, 2026-09-05, and it cost the barrier below its whole purpose. Reading
  // `process.stdin.isTTY` builds the stdin STREAM, and building it puts fd 0 into
  // NON-BLOCKING mode. `readFileSync(0)` then throws EAGAIN whenever the harness has
  // not written yet — silence, no session id, barrier skipped, and the session is told
  // the universe this machine woke up in. `tty.isatty(0)` answers the same question
  // and leaves the descriptor alone. Measured: with the stream, a payload handed over
  // 500 ms late is EAGAIN every time; with isatty, it is read every time.
  const real = Object.getOwnPropertyDescriptor(process, "stdin");
  let touched = false;
  Object.defineProperty(process, "stdin", {
    configurable: true,
    get() {
      touched = true;
      return real.get.call(process);
    },
  });
  try {
    readHookPayload({ readInput: () => '{"session_id":"a1b2"}' });
  } finally {
    Object.defineProperty(process, "stdin", real);
  }

  assert.equal(touched, false, "the tty question must never build the stdin stream");
});

test("readHookPayload: a pipe that has not been written to YET is waited for, not read as silence", () => {
  // EAGAIN means "nothing there yet", never "there is nothing". The harness writes the
  // payload and the hook boots concurrently; whoever wins is not ours to decide.
  const attempts = [];
  let reads = 0;
  const payload = readHookPayload({
    readInput: () => {
      attempts.push("read");
      reads += 1;
      if (reads <= 2) {
        const error = new Error("EAGAIN: resource temporarily unavailable, read");
        error.code = "EAGAIN";
        throw error;
      }
      return '{"session_id":"late"}';
    },
    isTTY: () => false,
    now: () => 0,
    sleep: () => attempts.push("slept"),
  });

  assert.equal(payload, '{"session_id":"late"}');
  assert.deepEqual(attempts, ["read", "slept", "read", "slept", "read"]);
});

test("readHookPayload: a pipe that NEVER speaks still fails open, and the wait is bounded", () => {
  // Fail-open is the right answer in the end — a hook that hangs costs the session
  // start it was meant to inform. What changes is that silence is now a VERDICT
  // reached after waiting, not a first impression.
  let elapsed = 0;
  let reads = 0;
  const payload = readHookPayload({
    readInput: () => {
      reads += 1;
      const error = new Error("EAGAIN");
      error.code = "EAGAIN";
      throw error;
    },
    isTTY: () => false,
    now: () => elapsed,
    sleep: (ms) => (elapsed += ms),
    waitMs: 100,
    pollMs: 20,
  });

  assert.equal(payload, "");
  assert.equal(elapsed, 100, "it waits its budget and not a millisecond more");
  assert.equal(reads, 6, "one read per poll across the budget, plus the first");
});

test("readHookPayload: a genuine EOF is silence AT ONCE — an empty pipe is not a slow one", () => {
  // The distinction the defect could not make. `/dev/null`, or a harness that closed
  // fd 0 having written nothing, RETURNS "" — it does not throw. Waiting on that would
  // add the whole budget to every hook run by a script.
  let slept = 0;
  const payload = readHookPayload({
    readInput: () => "",
    isTTY: () => false,
    now: () => 0,
    sleep: () => (slept += 1),
  });

  assert.equal(payload, "");
  assert.equal(slept, 0, "an empty read is an answer, not a reason to wait");
});

test("readHookPayload: an fd 0 that fails for any OTHER reason is silence, never a thrown hook", () => {
  let slept = 0;
  const payload = readHookPayload({
    readInput: () => {
      const error = new Error("EBADF: bad file descriptor");
      error.code = "EBADF";
      throw error;
    },
    isTTY: () => false,
    now: () => 0,
    sleep: () => (slept += 1),
    waitMs: 1_000,
  });

  assert.equal(payload, "");
  assert.equal(slept, 0, "only EAGAIN is worth waiting on — a broken fd will not heal");
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
//
// 🛑 AND EVERY ONE OF THEM PASSES `readPayload`, WHICH IS NOT DECORATION. Without the
// seam this helper called `readHookPayload()` internally, i.e. `readFileSync(0)` on the
// TEST PROCESS's own stdin. `node --test` gives each file a stdin pipe with no writer:
// POSIX answers EAGAIN and the swallow turns it into "", so all three tests below went
// green in microseconds on macOS — while Windows BLOCKS on that read, forever. Measured
// 2026-08-23: 2 h 46 min on one runner, three hours of CI queued behind it, `node --test`
// finally reporting only "Promise resolution is still pending". A unit test must never
// read the process's real stdin; whether the SHIPPED default is still `readFileSync(0)`
// is asserted separately, below.

test("awaitStartupSync: it reads the payload through the seam, never the process's own stdin", () => {
  // The regression test for the hang, and it is about REACHABILITY, not about a value:
  // if the helper ever goes back to reading fd 0 itself, the spy is not called and this
  // fails on POSIX — where the defect is otherwise invisible — instead of hanging on
  // Windows three hours after the push.
  const settings = JSON.stringify({
    hooks: { SessionStart: [{ hooks: [{ command: 'node "/brain/scripts/session-status.mjs"' }] }] },
  });
  const io = fakeIo(new Map([[join("/brain", ".claude", "settings.json"), settings]]));
  // 🛑 `fakeClock`, NOT `now: () => 0, sleep: () => {}`. The three tests above can afford a
  // frozen clock because each returns BEFORE the poll loop; this one gets past the puller
  // gate with a real session id, reaches the loop, and a clock that never advances never
  // reaches the grace deadline — an infinite spin. Caught locally, by the suite hanging.
  const clock = fakeClock();
  let asked = 0;

  const outcome = awaitStartupSync({
    repo: "/brain",
    io,
    now: clock.now,
    sleep: clock.sleep,
    readPayload: () => {
      asked += 1;
      return JSON.stringify({ session_id: "s-42" });
    },
  });

  assert.equal(asked, 1, "the injected reader is the ONLY thing consulted for the payload");
  assert.notEqual(outcome.status, "unknown-session", "and the session id it returned actually reached the gate");
});

test("awaitStartupSync: the SHIPPED default still reads the harness's payload off stdin", () => {
  // The other half of the seam: an injection point is also a way to ship a helper that
  // reads nothing in production. `readHookPayload` is the default, and it is `isTTY`-aware
  // — so a hook run at a keyboard reads "" rather than blocking on a human. Asserted here
  // because the test above deliberately never exercises the default.
  assert.equal(readHookPayload({ isTTY: () => true, readInput: () => "unreachable" }), "");
  assert.equal(readHookPayload({ isTTY: () => false, readInput: () => '{"session_id":"s-7"}' }), '{"session_id":"s-7"}');
});

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

  const outcome = awaitStartupSync({ repo: "/brain", io: hostile, now: () => 0, sleep: () => {}, readPayload: () => "" });

  assert.deepEqual(outcome, { status: "not-expected", waitedMs: 0 }, "it answers, rather than throwing at its caller");
});

test("awaitStartupSync: no puller wired → it returns at once, without reading a marker", () => {
  // The brains that predate the barrier, and the owners who removed the hook. Waiting
  // would tax every one of their session starts for a marker that cannot appear.
  const io = fakeIo(new Map());

  const outcome = awaitStartupSync({ repo: "/brain", io, now: () => 0, sleep: () => {}, readPayload: () => "" });

  assert.deepEqual(outcome, { status: "not-expected", waitedMs: 0 });
});

test("awaitStartupSync: it asks the gate about the repo it was GIVEN, not about a default", () => {
  // A helper that resolved its own root would answer for the wrong brain and look like
  // success — the exact failure it exists to prevent at the call sites.
  const settings = JSON.stringify({
    hooks: { SessionStart: [{ hooks: [{ command: 'node "/elsewhere/scripts/session-status.mjs"' }] }] },
  });
  const io = fakeIo(new Map([[join("/elsewhere", ".claude", "settings.json"), settings]]));

  const wired = awaitStartupSync({ repo: "/elsewhere", io, now: () => 0, sleep: () => {}, readPayload: () => "" });
  const elsewhere = awaitStartupSync({ repo: "/brain", io, now: () => 0, sleep: () => {}, readPayload: () => "" });

  assert.equal(wired.status, "unknown-session", "the puller IS wired there — it got past the first gate");
  assert.equal(elsewhere.status, "not-expected", "and nothing is wired here");
});
