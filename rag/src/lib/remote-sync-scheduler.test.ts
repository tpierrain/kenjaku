import { test } from "node:test";
import assert from "node:assert/strict";
import { RemoteSyncScheduler } from "./remote-sync-scheduler.js";

// ═══════════════════════════════════════════════════════════════════════════
// The clock of the live sync between machines (plan #84, step 3.1). It lives in
// the search server because that is the one process that is up for exactly as
// long as a window is open — no daemon (ADR 0003), and no clock that outlives
// the session.
//
// Everything it must guarantee is a way the loop could die or double:
//   • it re-arms in `finally`, so ONE failing tick never ends the loop;
//   • the next tick is armed only once the previous has settled, so a slow tick
//     is never overlapped by the one behind it;
//   • `stop()` cancels the pending timer, so no orphan timer survives shutdown;
//   • the delay carries ±10 % of jitter, so two machines that started together
//     do not hit the remote in cadence forever.
// ═══════════════════════════════════════════════════════════════════════════

type Handle = ReturnType<typeof setTimeout>;

/** A virtual clock that honours each timer's duration, and remembers what was asked of it. */
function fakeClock() {
  const timers = new Map<number, { at: number; fn: () => void }>();
  const delays: number[] = [];
  let nextId = 1;
  let now = 0;
  return {
    delays,
    set(fn: () => void, ms: number): Handle {
      delays.push(ms);
      const id = nextId++;
      timers.set(id, { at: now + ms, fn });
      return id as unknown as Handle;
    },
    /**
     * Refuses a missing handle: a real `clearTimeout(undefined)` is a silent no-op, so a
     * double that shrugs at one cannot tell "cancelled the pending tick" from "cancelled
     * nothing at all".
     */
    clear(handle: Handle) {
      assert.ok(handle !== null && handle !== undefined, "clearTimer was handed no handle");
      timers.delete(handle as unknown as number);
    },
    advance(ms: number) {
      const target = now + ms;
      for (;;) {
        const due = [...timers.entries()].filter(([, t]) => t.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
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

/** No jitter, so a test that is about the LOOP is not also about the randomness. */
const noJitter = () => 0.5;

function build(overrides: Partial<ConstructorParameters<typeof RemoteSyncScheduler>[0]> = {}) {
  const clock = fakeClock();
  const ticks: number[] = [];
  const logs: string[] = [];
  const scheduler = new RemoteSyncScheduler({
    tick: async () => {
      ticks.push(ticks.length + 1);
    },
    intervalMs: 90_000,
    random: noJitter,
    setTimer: clock.set,
    clearTimer: clock.clear,
    log: (m) => logs.push(m),
    ...overrides,
  });
  return { clock, ticks, logs, scheduler };
}

test("nothing runs until the first interval has elapsed — a session start is not a reason to sync", () => {
  const { clock, ticks, scheduler } = build();

  scheduler.start();
  clock.advance(89_999);
  assert.deepEqual(ticks, [], "the startup pull already happened; this clock is for what comes after");

  clock.advance(1);
  assert.deepEqual(ticks, [1]);
});

test("each tick arms the next, for as long as the window stays open", async () => {
  const { clock, ticks, scheduler } = build();

  scheduler.start();
  for (let i = 0; i < 3; i++) {
    clock.advance(90_000);
    await scheduler.whenSettled();
  }

  assert.deepEqual(ticks, [1, 2, 3]);
});

// The one that matters most: a tick that throws is the NORMAL case here (no network, a
// git that refuses, a brain mid-rebase). A loop that stops at the first one would go
// quiet for the rest of the session, and nothing on screen would say so.
test("a tick that throws is logged and the loop survives it", async () => {
  const { clock, logs, scheduler } = build({
    tick: async () => {
      throw new Error("no route to host");
    },
  });

  scheduler.start();
  clock.advance(90_000);
  await scheduler.whenSettled();
  clock.advance(90_000);
  await scheduler.whenSettled();

  assert.equal(logs.length, 2, "both failures are reported");
  assert.match(logs[0], /no route to host/, "and with git's own words, not ours");
  assert.equal(clock.pending(), 1, "a third tick is armed: one bad tick never ends the loop");
});

test("a slow tick is never overlapped: the next one is armed only once it has settled", async () => {
  let release: () => void = () => {};
  let started = 0;
  const { clock, scheduler } = build({
    tick: () => {
      started++;
      return new Promise<void>((resolve) => {
        release = resolve;
      });
    },
  });

  scheduler.start();
  clock.advance(90_000);
  assert.equal(started, 1);
  clock.advance(900_000);
  assert.equal(started, 1, "ten intervals passed while one fetch hung: still exactly one tick");
  assert.equal(clock.pending(), 0, "and nothing is armed while it runs");

  release();
  await scheduler.whenSettled();
  assert.equal(clock.pending(), 1, "the next one is armed the moment it finishes");
});

test("stop() cancels the pending tick, so no clock outlives the session", () => {
  const { clock, ticks, scheduler } = build();

  scheduler.start();
  scheduler.stop();

  assert.equal(clock.pending(), 0, "the armed timer is cancelled, not merely ignored");
  clock.advance(900_000);
  assert.deepEqual(ticks, []);
});

test("stopping mid-tick keeps the loop from re-arming behind our back", async () => {
  let release: () => void = () => {};
  const { clock, scheduler } = build({
    tick: () =>
      new Promise<void>((resolve) => {
        release = resolve;
      }),
  });

  scheduler.start();
  clock.advance(90_000);
  scheduler.stop();
  release();
  await scheduler.whenSettled();

  assert.equal(clock.pending(), 0, "a tick that finishes after the shutdown must arm nothing");
});

test("stop() on a scheduler that was never started is a no-op, not a crash", () => {
  const { scheduler } = build();

  assert.doesNotThrow(() => scheduler.stop());
});

// Two machines started by the same person, one after the other, would otherwise probe the
// remote in lockstep forever. ±10 % is enough to break the cadence without making the
// interval mean anything different.
test("the delay carries ±10 % of jitter, and never leaves that band", () => {
  const cases: Array<[number, number]> = [
    [0, 81_000],
    [0.5, 90_000],
    [1, 99_000],
  ];
  for (const [roll, expected] of cases) {
    const { clock, scheduler } = build({ random: () => roll });
    scheduler.start();
    assert.equal(clock.delays[0], expected, `a roll of ${roll} must land at ${expected} ms`);
  }
});

test("the jitter is re-rolled at every tick: a fixed offset is a cadence too", async () => {
  const rolls = [0, 1, 0.25];
  let i = 0;
  const { clock, scheduler } = build({ random: () => rolls[i++ % rolls.length] });

  scheduler.start();
  for (let n = 0; n < 2; n++) {
    clock.advance(99_000);
    await scheduler.whenSettled();
  }

  assert.deepEqual(clock.delays, [81_000, 99_000, 85_500]);
});

test("the interval it is given is the interval it uses, whatever the default may be", () => {
  const { clock, scheduler } = build({ intervalMs: 30_000 });

  scheduler.start();

  assert.deepEqual(clock.delays, [30_000]);
});
