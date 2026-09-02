import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_REMOTE_SYNC_INTERVAL_SECONDS,
  resolveRemoteSyncIntervalSeconds,
} from "./remote-sync-interval.js";

// The knob a person turns when the live sync between machines is too eager, too slow, or
// unwelcome. It is read at boot, so the ONE thing it may never do is crash the server:
// every malformed spelling falls back to the default, and only a deliberate `0` turns the
// clock off. (Plan #84, step 3.3 — same contract as the local mirror's, one door over.)

test("the default is 90 seconds, and it is what an unset or blank value resolves to", () => {
  assert.equal(DEFAULT_REMOTE_SYNC_INTERVAL_SECONDS, 90);
  assert.equal(resolveRemoteSyncIntervalSeconds(undefined), 90);
  assert.equal(resolveRemoteSyncIntervalSeconds(""), 90);
  assert.equal(resolveRemoteSyncIntervalSeconds("   "), 90);
});

test("a whole number of seconds is taken as written, whitespace and all", () => {
  assert.equal(resolveRemoteSyncIntervalSeconds("30"), 30);
  assert.equal(resolveRemoteSyncIntervalSeconds(" 300 "), 300);
  assert.equal(resolveRemoteSyncIntervalSeconds("1"), 1);
});

// The off switch is the reason the parser cannot simply reject everything falsy: `0` is a
// VALID answer that means "never sync in the background", and the plan's own escape hatch.
test("0 is the off switch, and it survives the fallback that swallows every other odd value", () => {
  assert.equal(resolveRemoteSyncIntervalSeconds("0"), 0);
  assert.equal(resolveRemoteSyncIntervalSeconds(" 0 "), 0);
});

test("anything that is not a whole number of seconds falls back to the default, never to a crash", () => {
  for (const raw of ["-5", "90s", "1.5", "ninety", "9 0", "0x10", "+90", "1e2", "∞"]) {
    assert.equal(
      resolveRemoteSyncIntervalSeconds(raw),
      DEFAULT_REMOTE_SYNC_INTERVAL_SECONDS,
      `"${raw}" is not a cadence, so the server must boot on the default`,
    );
  }
});
