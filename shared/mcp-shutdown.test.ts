import { test } from "node:test";
import assert from "node:assert/strict";
import { installShutdown, realShutdownHooks, type ShutdownHooks } from "./mcp-shutdown.js";

// Why this module exists at all: `rag` had NO shutdown wiring, so once the live vault
// watcher kept the event loop alive the server survived its client — 21 orphans measured
// in one field day, each holding the exclusive SQLite lock that starves the next session.
// `local-mirror` had the wiring and leaked zero. The two servers drifting apart IS the
// defect, so the wiring is extracted here and imported by both, never copied.

function fakeHooks() {
  const signals = new Map<NodeJS.Signals, () => void>();
  const stdinHandlers: Array<() => void> = [];
  const exits: number[] = [];
  const logged: string[] = [];
  const hooks: ShutdownHooks = {
    onSignal: (signal, handler) => signals.set(signal, handler),
    onStdinEnd: (handler) => stdinHandlers.push(handler),
    exit: (code) => exits.push(code),
    log: (message) => logged.push(message),
  };
  return { hooks, signals, stdinHandlers, exits, logged };
}

// Registering a SIGINT/SIGTERM listener OVERRIDES Node's default terminate-on-signal, so a
// handler that only cleans up would leave the server alive holding stdio. It must also exit.
test("SIGINT runs the cleanup, then terminates the process (130)", () => {
  const { hooks, signals, exits } = fakeHooks();
  const ran: string[] = [];

  installShutdown({ cleanup: () => ran.push("cleanup") }, hooks);
  signals.get("SIGINT")!();

  assert.deepEqual(ran, ["cleanup"]);
  assert.deepEqual(exits, [130]);
});

test("SIGTERM runs the cleanup, then terminates the process (143)", () => {
  const { hooks, signals, exits } = fakeHooks();
  const ran: string[] = [];

  installShutdown({ cleanup: () => ran.push("cleanup") }, hooks);
  signals.get("SIGTERM")!();

  assert.deepEqual(ran, ["cleanup"]);
  assert.deepEqual(exits, [143]);
});

// The defect itself. Letting an EOF wind down "on its own" is an IMPLICIT contract with the
// event loop: it holds only as long as nothing keeps a handle open. `rag` added a live vault
// watcher, the contract silently broke, and the process outlived every session. So the exit is
// explicit here, for both servers — no server is left depending on being idle enough to die.
test("stdin EOF runs the cleanup, then terminates the process (0) — never waits for an idle event loop", () => {
  const { hooks, stdinHandlers, exits } = fakeHooks();
  const ran: string[] = [];

  installShutdown({ cleanup: () => ran.push("cleanup") }, hooks);
  assert.ok(stdinHandlers.length >= 1);
  stdinHandlers[0]!();

  assert.deepEqual(ran, ["cleanup"]);
  assert.deepEqual(exits, [0]);
});

// A cleanup that throws is exactly the bad day this module exists for: an unclosed database, a
// watcher that refused to stop. Dying anyway releases the OS-level lock; NOT dying leaves the
// orphan that starves the next session. So the exit is in a `finally`, and the failure is said
// out loud rather than swallowed.
test("a cleanup that throws is reported, and the process terminates anyway", () => {
  const { hooks, signals, exits, logged } = fakeHooks();

  installShutdown(
    {
      cleanup: () => {
        throw new Error("watcher would not stop");
      },
    },
    hooks,
  );
  signals.get("SIGINT")!();

  assert.deepEqual(exits, [130]);
  assert.equal(logged.length, 1);
  assert.match(logged[0]!, /watcher would not stop/);
});

// The end of a session is announced more than once: stdin emits BOTH `end` and `close`, and a
// signal can land after either. Closing a database handle twice throws, so the cleanup is
// once-only — and the FIRST notice still decides the exit code.
test("the cleanup runs once, however many times the end of the session is announced", () => {
  const { hooks, signals, stdinHandlers, exits } = fakeHooks();
  const ran: string[] = [];

  installShutdown({ cleanup: () => ran.push("cleanup") }, hooks);
  for (const handler of stdinHandlers) handler();
  signals.get("SIGTERM")!();

  assert.deepEqual(ran, ["cleanup"]);
  assert.deepEqual(exits, [0]);
});

// The real hooks are the adapter over `process`. Only `exit` stays unexercised — calling it
// would end the test run — so everything else is covered deterministically: a listener that is
// never registered is a shutdown that never fires, which is the whole defect wearing a disguise.
test("realShutdownHooks registers on the real process signals and on stdin end AND close", () => {
  const hooks = realShutdownHooks(() => {});
  const handler = () => {};
  const before = {
    sigint: process.listenerCount("SIGINT"),
    end: process.stdin.listenerCount("end"),
    close: process.stdin.listenerCount("close"),
  };

  hooks.onSignal("SIGINT", handler);
  hooks.onStdinEnd(handler);

  try {
    assert.equal(process.listenerCount("SIGINT"), before.sigint + 1);
    // BOTH: a client that dies without flushing its pipe emits `close` and never `end`.
    assert.equal(process.stdin.listenerCount("end"), before.end + 1);
    assert.equal(process.stdin.listenerCount("close"), before.close + 1);
  } finally {
    process.removeListener("SIGINT", handler);
    process.stdin.removeListener("end", handler);
    process.stdin.removeListener("close", handler);
  }
});

test("realShutdownHooks routes its log through the caller's reporter (each server names itself)", () => {
  const logged: string[] = [];

  realShutdownHooks((message) => logged.push(message)).log("closing the index");

  assert.deepEqual(logged, ["closing the index"]);
});

// `exit` is the one hook a test can never simply CALL — it would end the run. That is a reason
// to give it a seam, not a reason to leave it unjudged: an `exit` that quietly does nothing is
// the exact shape of this defect, and it must not be able to ship unnoticed.
test("realShutdownHooks terminates the real process with the code it is handed", () => {
  const exits: number[] = [];
  const proc = {
    once: () => {},
    stdin: { once: () => {} },
    exit: (code: number) => exits.push(code),
  };

  realShutdownHooks(() => {}, proc).exit(143);

  assert.deepEqual(exits, [143]);
});
