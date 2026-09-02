// ─────────────────────────────────────────────────────────────────────────────
// os-banner.test.mjs — the native banner the live sync raises when someone ELSE's
// notes land (plan #84, step 5.2).
//
// It is the only part of this feature that reaches a person who is not looking at
// Claude: the window may be behind a browser, or the laptop may be shut. So it is
// also the part that must be hardest to turn into noise — one per tick, never for
// one's own notes, never in CI, and off with one variable.
// ─────────────────────────────────────────────────────────────────────────────
import { test } from "node:test";
import assert from "node:assert/strict";

import { BANNER_SPAWN_OPTIONS, BANNER_TITLE, bannerBody, buildBannerCommand, buildNotifier, shouldBanner } from "./os-banner.mjs";

// ── What it says ─────────────────────────────────────────────────────────────

test("the body names how many notes arrived and from whom", () => {
  assert.equal(
    bannerBody({ files: ["vault/people/claire.md"], authors: ["Claire"] }),
    "1 note from Claire — already in your brain.",
  );
  assert.equal(
    bannerBody({ files: ["vault/a.md", "vault/b.md"], authors: ["Claire", "Paul"] }),
    "2 notes from Claire and Paul — already in your brain.",
  );
});

test("files that are not notes are called files, on the banner too", () => {
  assert.equal(bannerBody({ files: ["scripts/lib/x.mjs"], authors: ["Paul"] }), "1 file from Paul — already in your brain.");
  assert.equal(
    bannerBody({ files: ["vault/a.md", "scripts/x.mjs"], authors: ["Paul"] }),
    "1 note and 1 file from Paul — already in your brain.",
  );
});

test("an arrival with no author named still says what landed", () => {
  assert.equal(bannerBody({ files: ["vault/a.md"], authors: [] }), "1 note — already in your brain.");
});

test("nothing arrived → no body, so there is nothing to raise", () => {
  assert.equal(bannerBody({ files: [], authors: ["Claire"] }), null);
});

// ── Which command, on which machine ──────────────────────────────────────────

test("macOS raises the banner through osascript, as the POC proved from a child with no terminal", () => {
  const command = buildBannerCommand("darwin", { title: BANNER_TITLE, body: "1 note from Claire" });

  assert.equal(command.command, "osascript");
  assert.deepEqual(command.args, ["-e", 'display notification "1 note from Claire" with title "Second brain"']);
  assert.deepEqual(command.options, { detached: true, stdio: "ignore" }, "the whole request is a value, options included");
  assert.deepEqual(BANNER_SPAWN_OPTIONS, { detached: true, stdio: "ignore" });
});

// The title and body are ordinary text, and a note's author is whatever their git config says.
// A quote in it would close the AppleScript literal and osascript would exit non-zero: no
// banner, and nobody the wiser. Same shape as the engine's own notify.ts, one package over.
test("a quote or a backslash in a name cannot break the AppleScript literal", () => {
  const command = buildBannerCommand("darwin", { title: 'He said "hi"', body: "C:\\notes" });

  assert.deepEqual(command.args, ["-e", 'display notification "C:\\\\notes" with title "He said \\"hi\\""']);
});

test("Windows raises a balloon tip through PowerShell, with its own escaping", () => {
  const command = buildBannerCommand("win32", { title: BANNER_TITLE, body: 'a $var and a "quote"' });

  assert.equal(command.command, "powershell");
  assert.deepEqual(command.args.slice(0, 2), ["-NoProfile", "-Command"]);
  assert.match(command.args[2], /ShowBalloonTip/);
  assert.match(command.args[2], /a `\$var and a `"quote`"/, "PowerShell's escape char is the backtick");
});

test("any other platform gets no banner at all, rather than a wrong one", () => {
  assert.equal(buildBannerCommand("linux", { title: "t", body: "b" }), null);
  assert.equal(buildBannerCommand("aix", { title: "t", body: "b" }), null);
});

// ── When it stays quiet ──────────────────────────────────────────────────────

test("the owner's off switch is one variable, and only `0` turns it off", () => {
  assert.equal(shouldBanner({}), true);
  assert.equal(shouldBanner({ REMOTE_SYNC_BANNER: "0" }), false);
  assert.equal(shouldBanner({ REMOTE_SYNC_BANNER: " 0 " }), false);
  assert.equal(shouldBanner({ REMOTE_SYNC_BANNER: "1" }), true);
  assert.equal(shouldBanner({ REMOTE_SYNC_BANNER: "" }), true, "an empty value is not a decision");
});

test("automated contexts stay silent: a toast nobody is there to see is spam in a log", () => {
  assert.equal(shouldBanner({ CI: "true" }), false);
  assert.equal(shouldBanner({ SBG_NO_NOTIFY: "1" }), false, "the engine's existing install/QA switch is honoured too");
});

// ── The notifier the tick actually calls ─────────────────────────────────────

function recorder() {
  const spawned = [];
  const spawn = (command, args, options) => {
    spawned.push({ command, args, options });
    return { unref: () => spawned.push({ unreffed: true }) };
  };
  return { spawn, spawned };
}

test("the notifier spawns the platform's command, detached, and lets go of it", () => {
  const { spawn, spawned } = recorder();

  buildNotifier({ platform: "darwin", env: {}, spawn })({ files: ["vault/a.md"], authors: ["Claire"] });

  assert.equal(spawned[0].command, "osascript");
  assert.match(spawned[0].args[1], /1 note from Claire/);
  assert.equal(spawned[0].options.detached, true, "the tick must not wait on a toast");
  assert.deepEqual(spawned[0].options.stdio, "ignore");
  assert.deepEqual(spawned[1], { unreffed: true }, "…nor be kept alive by one");
});

test("switched off, on an unknown platform, or with nothing to say: no child at all", () => {
  for (const [platform, env, arrival] of [
    ["darwin", { REMOTE_SYNC_BANNER: "0" }, { files: ["vault/a.md"], authors: ["Claire"] }],
    ["linux", {}, { files: ["vault/a.md"], authors: ["Claire"] }],
    ["darwin", {}, { files: [], authors: [] }],
  ]) {
    const { spawn, spawned } = recorder();
    buildNotifier({ platform, env, spawn })(arrival);
    assert.deepEqual(spawned, [], `${platform} with ${JSON.stringify(env)} must stay silent`);
  }
});

// Best-effort, like every other notification path in this engine: a machine with no
// `osascript` on its PATH must cost a missing toast, never a failed sync.
test("a spawn that throws is swallowed: the tick has already done the useful work", () => {
  const notify = buildNotifier({
    platform: "darwin",
    env: {},
    spawn: () => {
      throw new Error("osascript: not found");
    },
  });

  assert.doesNotThrow(() => notify({ files: ["vault/a.md"], authors: ["Claire"] }));
});
