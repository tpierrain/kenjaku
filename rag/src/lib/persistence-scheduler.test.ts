import { test } from "node:test";
import assert from "node:assert/strict";
import { PersistenceScheduler } from "./persistence-scheduler.js";

/**
 * Virtual clock. Unlike the reindex scheduler's fake, this one MUST honour each
 * timer's duration: the whole point of this class is that two windows of
 * different lengths race, so a fake that fires everything at once could not tell
 * the quiet window from the cap.
 */
type Handle = ReturnType<typeof setTimeout>;

function fakeClock() {
  const timers = new Map<number, { at: number; fn: () => void }>();
  let nextId = 1;
  let now = 0;
  return {
    set(fn: () => void, ms: number): Handle {
      const id = nextId++;
      timers.set(id, { at: now + ms, fn });
      return id as unknown as Handle;
    },
    /**
     * Refuses a missing handle. A real `clearTimeout(null)` is a silent no-op, so
     * a double that shrugs at one cannot tell "cancelled the pending window" from
     * "cancelled nothing at all" — and every `!== null` guard in the scheduler
     * becomes untestable.
     */
    clear(handle: Handle) {
      assert.ok(
        handle !== null && handle !== undefined,
        "clearTimer was handed no handle — a window was cancelled that had never been armed"
      );
      timers.delete(handle as unknown as number);
    },
    /** Moves time forward, firing every timer whose deadline is reached, in order. */
    advance(ms: number) {
      const target = now + ms;
      for (;;) {
        const due = [...timers.entries()]
          .filter(([, t]) => t.at <= target)
          .sort((a, b) => a[1].at - b[1].at)[0];
        if (!due) break;
        timers.delete(due[0]);
        now = due[1].at;
        due[1].fn();
      }
      now = target;
    },
    pending() {
      return timers.size;
    },
  };
}

test("the quiet window: one write, and the commit waits for the window to elapse", () => {
  let persisted = 0;
  const clock = fakeClock();
  const scheduler = new PersistenceScheduler({
    persist: async () => {
      persisted++;
    },
    quietMs: 120_000,
    capMs: 600_000,
    setTimer: clock.set,
    clearTimer: clock.clear,
  });

  scheduler.notify();
  clock.advance(119_999);
  assert.equal(persisted, 0, "still inside the quiet window");

  clock.advance(1);
  assert.equal(persisted, 1, "the quiet window elapsed → exactly one commit");
});

test("the quiet window re-arms: writing every 30 s commits nothing until you stop", () => {
  let persisted = 0;
  const clock = fakeClock();
  const scheduler = new PersistenceScheduler({
    persist: async () => {
      persisted++;
    },
    quietMs: 120_000,
    capMs: 600_000,
    setTimer: clock.set,
    clearTimer: clock.clear,
  });

  // 8 minutes of steady typing: each write cancels the pending window.
  for (let i = 0; i < 16; i++) {
    scheduler.notify();
    clock.advance(30_000);
  }
  assert.equal(persisted, 0, "still writing → no commit, and no burst of them");

  clock.advance(120_000);
  assert.equal(persisted, 1, "typing stopped → one commit, folding the whole session");
});

/** Lets a settled persistence's continuations run (it is async in production). */
async function flush() {
  for (let i = 0; i < 5; i++) await Promise.resolve();
}

test("the cap: a writing session that never pauses still commits, every 10 minutes", async () => {
  let persisted = 0;
  const clock = fakeClock();
  const scheduler = new PersistenceScheduler({
    persist: async () => {
      persisted++;
    },
    quietMs: 120_000,
    capMs: 600_000,
    setTimer: clock.set,
    clearTimer: clock.clear,
  });

  /** Types for `minutes`, never leaving a gap the quiet window could catch. */
  const typeFor = async (minutes: number) => {
    for (let i = 0; i < minutes * 2; i++) {
      scheduler.notify();
      clock.advance(30_000);
      await flush();
    }
  };

  await typeFor(9.5); // 9 min 30 s of continuous writing
  assert.equal(persisted, 0, "just under the cap → nothing yet");

  await typeFor(0.5); // reaching 10 min
  assert.equal(persisted, 1, "the cap fired even though the quiet window never did");

  await typeFor(20); // 30 minutes in total
  assert.equal(persisted, 3, "one commit per 10-minute cap, not one per pause");
});

test("once persisted, an idle vault commits nothing more (no self-sustaining loop)", async () => {
  let persisted = 0;
  const clock = fakeClock();
  const scheduler = new PersistenceScheduler({
    persist: async () => {
      persisted++;
    },
    quietMs: 120_000,
    capMs: 600_000,
    setTimer: clock.set,
    clearTimer: clock.clear,
  });

  scheduler.notify();
  clock.advance(120_000);
  assert.equal(persisted, 1);
  // Let the commit settle before idling: while one is still in flight the
  // scheduler swallows anything that fires (it coalesces instead of running a
  // second git), which would hide a window left armed behind the cap it forgot
  // to cancel.
  await flush();

  clock.advance(3_600_000); // an hour of nobody touching the vault
  assert.equal(persisted, 1, "no write, no commit — an empty commit is still noise");
  assert.equal(clock.pending(), 0, "and no timer left running for an idle process");
});

/**
 * Controllable persist: `auto-commit` + `auto-push` are child processes, and the
 * push can sit on the network for up to two minutes. We resolve by hand to hold
 * one "in progress" and write into the vault meanwhile.
 */
function controllablePersist() {
  const resolvers: Array<() => void> = [];
  let calls = 0;
  return {
    persist: () => {
      calls++;
      return new Promise<void>((resolve) => resolvers.push(resolve));
    },
    async completeOne() {
      resolvers.shift()?.();
      for (let i = 0; i < 5; i++) await Promise.resolve();
    },
    calls: () => calls,
  };
}

test("a write during a slow push never starts a second git — one rerun at the end", async () => {
  const ctrl = controllablePersist();
  const clock = fakeClock();
  const scheduler = new PersistenceScheduler({
    persist: ctrl.persist,
    quietMs: 120_000,
    capMs: 600_000,
    setTimer: clock.set,
    clearTimer: clock.clear,
  });

  scheduler.notify();
  clock.advance(120_000); // commit #1 starts, and hangs on the network
  assert.equal(ctrl.calls(), 1);

  scheduler.notify();
  clock.advance(120_000);
  scheduler.notify();
  clock.advance(120_000); // two more windows elapse while the push is stuck
  assert.equal(ctrl.calls(), 1, "no second git while the first is still running");

  await ctrl.completeOne();
  assert.equal(ctrl.calls(), 2, "the writes made meanwhile are persisted, exactly once");

  await ctrl.completeOne();
  assert.equal(ctrl.calls(), 2, "and nothing is left pending");
});

test("built on its defaults, the two windows are the ones we publish: 2 minutes and 10", () => {
  const asked: number[] = [];
  const scheduler = new PersistenceScheduler({
    persist: async () => {},
    setTimer: (_fn, ms) => {
      asked.push(ms);
      return 1 as unknown as Handle;
    },
    clearTimer: () => {},
  });

  scheduler.notify();

  // Deliberately literals, not the exported constants: every other test names
  // its own windows, so nothing until now proved the SHIPPED numbers are the
  // ones an owner gets — the defaults could have drifted with the suite green,
  // and they are the two figures the release note states.
  assert.deepEqual(asked, [120_000, 600_000], "quiet window then cap, in that order");
});

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

test("with nothing injected it schedules on the real clock, and a re-arm truly cancels", async () => {
  let persisted = 0;
  const scheduler = new PersistenceScheduler({
    persist: async () => {
      persisted++;
    },
    quietMs: 30,
    // Kept short on purpose: this is the one test on REAL timers, so a cap the
    // code forgets to cancel holds the whole suite open for its full duration.
    // Two seconds is long enough never to fire here, short enough to stay a
    // nuisance rather than a minute of dead wait under a mutation run.
    capMs: 2_000,
  });

  scheduler.notify();
  await delay(10);
  scheduler.notify(); // inside the window: the first commit must never happen
  await delay(150);

  assert.equal(persisted, 1, "exactly one commit — the first window was really cancelled");
});
