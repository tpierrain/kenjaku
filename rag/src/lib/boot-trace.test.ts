import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";

import { BOOT_TRACE_FILE, bootTraceBody, stampBootTrace } from "./boot-trace.js";

// ─── #90, step 2a: the instrument, and it decides NOTHING ────────────────────
// The restart nudge cannot tell "the owner obeyed and reopened the app" from "the marker is
// stale", because the only code that erases the marker is a SessionStart, and resuming a
// conversation runs none. What a full quit and reopen DOES do is respawn this server. So it
// leaves a timestamped trace when it starts, and nothing reads it yet: shipped write-only,
// a wrong trace cannot silence a nudge that is still true.
//
// The verdict (2b) waits on what a real restart, watched on a real machine, says about one
// unknown: does coming back to a conversation WITHOUT quitting the app respawn us too? If it
// does, a trace-based verdict would trade a false alarm for a silent one, which is worse.

test("bootTraceBody — the two facts a later verdict will need: when, and which process", () => {
  const body = JSON.parse(bootTraceBody(new Date("2026-09-08T09:02:00.000Z"), 4242));

  assert.equal(body.bootedAt, "2026-09-08T09:02:00.000Z");
  // The pid is the evidence half. A timestamp alone cannot distinguish "respawned" from
  // "rewritten by the same long-lived process", and telling those apart IS the measurement
  // step 2a exists to make.
  assert.equal(body.pid, 4242);
});

test("stampBootTrace — writes one trace into the cache it was given, parents included", () => {
  const dirs: unknown[][] = [];
  const writes: string[][] = [];

  const stamped = stampBootTrace({
    cacheDir: "/cache",
    now: () => new Date("2026-09-08T09:02:00.000Z"),
    pid: 4242,
    mkdirSync: (dir: string, opts: unknown) => void dirs.push([dir, opts]),
    writeFileSync: (path: string, body: string) => void writes.push([path, body]),
  });

  assert.equal(stamped, true);
  assert.deepEqual(dirs, [["/cache", { recursive: true }]]);
  assert.equal(writes.length, 1, "one boot, one trace: the newest boot REPLACES the last");
  assert.equal(writes[0][0], join("/cache", BOOT_TRACE_FILE));
  assert.equal(JSON.parse(writes[0][1]).pid, 4242);
});

test("stampBootTrace — a disk that refuses it is swallowed, and says so", () => {
  // An instrument may cost a measurement. It may never cost the owner their search server:
  // this runs on the startup path of the process every question goes through.
  const stamped = stampBootTrace({
    cacheDir: "/cache",
    now: () => new Date("2026-09-08T09:02:00.000Z"),
    pid: 4242,
    mkdirSync: () => {},
    writeFileSync: () => {
      throw new Error("EROFS: read-only file system");
    },
  });

  assert.equal(stamped, false);
});
