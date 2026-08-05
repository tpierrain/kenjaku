import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";

import { UPSTREAM_CACHE_REL, shouldReprobe, probeUpstream } from "./upstream-cache.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// F3's sibling — the session start could not tell "you are current" from "nobody
// looked", because nothing ever looked. This is what looks: a detached probe,
// exactly like the health re-probe (ADR 0028), writing a verdict the NEXT session
// start reads in a single file read. Session start never waits on a network call.
//
// Throttled on purpose: engine releases are not hourly, and this is the one
// outbound call a brain makes on its own behalf. Once a day is enough to make the
// answer true, and rare enough that a private brain is not chatting to GitHub at
// every window it opens.
// ═══════════════════════════════════════════════════════════════════════════

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse("2026-08-05T10:00:00.000Z");

test("shouldReprobe — nothing measured yet, so measure", () => {
  assert.equal(shouldReprobe({ cached: null, installedRef: "v4.7.0", now: NOW }), true);
});

test("shouldReprobe — a fresh verdict about THIS engine is left alone", () => {
  assert.equal(
    shouldReprobe({
      cached: { installed: "v4.7.0", checkedAt: new Date(NOW - 3 * 60 * 60 * 1000).toISOString() },
      installedRef: "v4.7.0",
      now: NOW,
    }),
    false,
  );
});

test("shouldReprobe — a day old, or about another engine, or undatable → measure again", () => {
  const stale = { installed: "v4.7.0", checkedAt: new Date(NOW - DAY - 1000).toISOString() };
  assert.equal(shouldReprobe({ cached: stale, installedRef: "v4.7.0", now: NOW }), true);

  // Just updated: the verdict describes the engine that was replaced.
  const otherEngine = { installed: "v4.6.0", checkedAt: new Date(NOW - 60_000).toISOString() };
  assert.equal(shouldReprobe({ cached: otherEngine, installedRef: "v4.7.0", now: NOW }), true);

  assert.equal(shouldReprobe({ cached: { installed: "v4.7.0" }, installedRef: "v4.7.0", now: NOW }), true);
  assert.equal(
    shouldReprobe({ cached: { installed: "v4.7.0", checkedAt: "yesterday-ish" }, installedRef: "v4.7.0", now: NOW }),
    true,
  );
});

test("shouldReprobe — exactly at the boundary the verdict is still fresh", () => {
  const atBoundary = { installed: "v4.7.0", checkedAt: new Date(NOW - DAY).toISOString() };
  assert.equal(shouldReprobe({ cached: atBoundary, installedRef: "v4.7.0", now: NOW }), false);
  const justPast = { installed: "v4.7.0", checkedAt: new Date(NOW - DAY - 1).toISOString() };
  assert.equal(shouldReprobe({ cached: justPast, installedRef: "v4.7.0", now: NOW }), true);
});

test("probeUpstream — writes the verdict, stamped, where the next session start reads it", async () => {
  const brainDir = mkdtempSync(join(tmpdir(), "sbg-upstream-"));
  writeFileSync(
    join(brainDir, "engine-manifest.json"),
    JSON.stringify({ source: { repo: "git@github.com:tpierrain/kenjaku.git", ref: "v4.6.0" } }),
  );

  const written = await probeUpstream({
    brainDir,
    now: () => NOW,
    checkUpstream: async ({ repo, installedRef }) => {
      assert.equal(repo, "git@github.com:tpierrain/kenjaku.git");
      assert.equal(installedRef, "v4.6.0");
      return { state: "available", installed: "v4.6.0", target: "v4.7.0", ahead: 1, releases: [], reason: null };
    },
  });

  const onDisk = JSON.parse(readFileSync(join(brainDir, UPSTREAM_CACHE_REL), "utf8"));
  assert.deepEqual(onDisk, {
    state: "available",
    installed: "v4.6.0",
    target: "v4.7.0",
    ahead: 1,
    reason: null,
    checkedAt: "2026-08-05T10:00:00.000Z",
  });
  assert.deepEqual(written, onDisk, "what it returns is what it wrote");
  assert.ok(
    !JSON.stringify(onDisk).includes("releases"),
    "the release prose is NOT cached: the session line quotes none of it, and a vault repo is not a place to park release notes",
  );
});

test("probeUpstream — creates the cache folder it needs, and ends the file with a newline", async () => {
  const brainDir = mkdtempSync(join(tmpdir(), "sbg-upstream-mkdir-"));
  writeFileSync(join(brainDir, "engine-manifest.json"), JSON.stringify({ source: { repo: "r", ref: "v1.0.0" } }));
  assert.equal(existsSync(join(brainDir, ".cache")), false, "the folder does not exist yet");

  await probeUpstream({
    brainDir,
    now: () => NOW,
    checkUpstream: async () => ({ state: "up-to-date", installed: "v1.0.0", target: "v1.0.0", ahead: 0, releases: [], reason: null }),
  });

  assert.ok(readFileSync(join(brainDir, UPSTREAM_CACHE_REL), "utf8").endsWith("\n"));
});

test("probeUpstream — an unreadable manifest is a written 'unknown', not an unwritten file", async () => {
  // Silence here would be the exact defect: the session line would say "checking
  // for updates…" forever, which reads as "in progress" rather than "it cannot".
  const brainDir = mkdtempSync(join(tmpdir(), "sbg-upstream-nomanifest-"));

  const written = await probeUpstream({
    brainDir,
    now: () => NOW,
    checkUpstream: async () => assert.fail("with no manifest there is no source to ask"),
  });

  assert.equal(written.state, "unknown");
  assert.equal(written.installed, null);
  assert.equal(written.reason, "this brain's engine-manifest.json could not be read");
  assert.deepEqual(JSON.parse(readFileSync(join(brainDir, UPSTREAM_CACHE_REL), "utf8")), written);
});

test("probeUpstream — a probe that throws leaves no half-written verdict behind", async () => {
  const brainDir = mkdtempSync(join(tmpdir(), "sbg-upstream-throw-"));
  writeFileSync(join(brainDir, "engine-manifest.json"), JSON.stringify({ source: { repo: "r", ref: "v1.0.0" } }));
  mkdirSync(join(brainDir, ".cache"));
  writeFileSync(join(brainDir, UPSTREAM_CACHE_REL), '{"state":"up-to-date","installed":"v1.0.0"}\n');

  const written = await probeUpstream({
    brainDir,
    now: () => NOW,
    checkUpstream: async () => { throw new Error("git exploded"); },
  });

  assert.equal(written, null, "it says it wrote nothing");
  assert.deepEqual(
    JSON.parse(readFileSync(join(brainDir, UPSTREAM_CACHE_REL), "utf8")),
    { state: "up-to-date", installed: "v1.0.0" },
    "the previous verdict survives — a crashed probe must not erase what was known",
  );
});

test("probeUpstream — the SECOND probe of the day still writes: making the cache folder is idempotent", async () => {
  // This runs once a day, forever, on a folder that exists after the first time.
  // A non-idempotent mkdir throws EEXIST from the second probe onwards — and this
  // function catches everything, so the failure would be perfectly silent: the
  // verdict on disk would freeze at day one and quietly go stale for good.
  const brainDir = mkdtempSync(join(tmpdir(), "sbg-upstream-twice-"));
  writeFileSync(join(brainDir, "engine-manifest.json"), JSON.stringify({ source: { repo: "r", ref: "v1.0.0" } }));
  const verdict = async () => ({
    state: "available", installed: "v1.0.0", target: "v1.1.0", ahead: 1, releases: [], reason: null,
  });

  const first = await probeUpstream({ brainDir, now: () => NOW, checkUpstream: verdict });
  const second = await probeUpstream({ brainDir, now: () => NOW + DAY, checkUpstream: verdict });

  assert.equal(first.checkedAt, "2026-08-05T10:00:00.000Z");
  assert.equal(second.checkedAt, "2026-08-06T10:00:00.000Z", "the second probe wrote, it did not die quietly");
  assert.equal(
    JSON.parse(readFileSync(join(brainDir, UPSTREAM_CACHE_REL), "utf8")).checkedAt,
    "2026-08-06T10:00:00.000Z",
  );
});

test("probeUpstream — with no clock injected it stamps the REAL now, not an empty date", async () => {
  // Every test above hands it a clock, which is what makes them readable — and it
  // means the default was observed by nothing. It is the field's only clock, and
  // the stamp is what `shouldReprobe` reads to tell a day-old verdict from a fresh
  // one: an unparseable one would make the brain probe upstream on every session.
  const brainDir = mkdtempSync(join(tmpdir(), "sbg-upstream-realclock-"));
  writeFileSync(join(brainDir, "engine-manifest.json"), JSON.stringify({ source: { repo: "r", ref: "v1.0.0" } }));
  const before = Date.now();

  const written = await probeUpstream({
    brainDir,
    checkUpstream: async () => ({ state: "up-to-date", installed: "v1.0.0", target: "v1.0.0", ahead: 0, releases: [], reason: null }),
  });

  const stamped = Date.parse(written.checkedAt);
  assert.ok(!Number.isNaN(stamped), "the stamp is a date");
  assert.ok(stamped >= before && stamped <= Date.now(), "and it is THIS moment");
  assert.equal(shouldReprobe({ cached: written, installedRef: "v1.0.0", now: Date.now() }), false);
});

test("the cache file sits under .cache/, which every brain gitignores", () => {
  // Not a detail: this is a per-machine, transient verdict about one laptop's
  // network luck. Written anywhere else in the brain it would be committed by the
  // auto-commit hook and pulled by the other machine as if it were vault content.
  assert.deepEqual(UPSTREAM_CACHE_REL.split(sep), [".cache", "engine-upstream.json"]);
});
