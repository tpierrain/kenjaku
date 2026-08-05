import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatEngineVersion,
  startupVersionLine,
  readStartupVersionLine,
  upstreamSegment,
} from "./engine-version.mjs";

test("formatEngineVersion — semver tag ref → 'engine <tag>'", () => {
  assert.equal(
    formatEngineVersion({ source: { repo: "https://x", ref: "v1.1.0" } }),
    "engine v1.1.0",
  );
});

test("formatEngineVersion — non-semver ref (branch/commit) shown verbatim, never invented", () => {
  assert.equal(
    formatEngineVersion({ source: { ref: "engine-packaging" } }),
    "engine engine-packaging",
  );
  assert.equal(formatEngineVersion({ source: { ref: "e6bfba0" } }), "engine e6bfba0");
});

test("formatEngineVersion — no source (launcher) → falls back to engineVersion.rag", () => {
  assert.equal(
    formatEngineVersion({ engineVersion: { rag: "1.1.0" } }),
    "engine 1.1.0",
  );
});

test("formatEngineVersion — source present but ref empty → falls back to rag", () => {
  assert.equal(
    formatEngineVersion({ source: { repo: "https://x", ref: "" }, engineVersion: { rag: "1.1.0" } }),
    "engine 1.1.0",
  );
});

test("formatEngineVersion — no source and no rag → null (never invent)", () => {
  assert.equal(formatEngineVersion({ manifestVersion: 1 }), null);
});

test("formatEngineVersion — missing/invalid manifest → null", () => {
  assert.equal(formatEngineVersion(null), null);
  assert.equal(formatEngineVersion(undefined), null);
  assert.equal(formatEngineVersion("nope"), null);
  assert.equal(formatEngineVersion(42), null);
});

// ═══════════════════════════════════════════════════════════════════════════
// The SESSION-START segment (owner's request, 2026-08-03: "j'aimerai que tu
// rajoutes la version de Kenjaku au démarrage").
//
// Same resolution as the status-line label, a different LABEL: this one is read
// by a human at every session start, so it names the product ("Kenjaku engine
// v4.5.0", chosen by the owner) rather than the bare "engine v4.5.0" the retired
// status line used.
// ═══════════════════════════════════════════════════════════════════════════

test("startupVersionLine — the tag the brain was installed from → the startup segment", () => {
  assert.equal(
    startupVersionLine({ source: { repo: "https://x", ref: "v4.5.0" } }),
    "⚙️ Kenjaku engine v4.5.0",
  );
});

test("startupVersionLine — a non-semver ref (branch/commit) is shown verbatim, never dressed up as a release", () => {
  assert.equal(startupVersionLine({ source: { ref: "main" } }), "⚙️ Kenjaku engine main");
  assert.equal(startupVersionLine({ source: { ref: "e6bfba0" } }), "⚙️ Kenjaku engine e6bfba0");
});

// The one decision worth not re-deriving: with no `source.ref`, this brain does
// NOT know which Kenjaku release it came from, and `engineVersion.rag` is a
// package number (1.3.0) that has never matched the release (v4.5.0). Printing
// "Kenjaku engine 1.3.0" would send an owner to report a version that does not
// exist — so the segment is DROPPED instead. (The status-line label keeps that
// fallback: it says "engine", claiming nothing about the product's release.)
// Naming that state out loud belongs to F3, which owns "unknown" — deferred to v4.8.0.
test("startupVersionLine — no ref → NO segment, never the rag package number dressed as a release", () => {
  assert.equal(startupVersionLine({ engineVersion: { rag: "1.3.0" } }), null);
  assert.equal(startupVersionLine({ source: { repo: "https://x", ref: "" } , engineVersion: { rag: "1.3.0" } }), null);
});

// The absence twin of every `?.` above: a brain whose manifest is missing or
// unreadable must lose the segment, never crash the SessionStart hook that
// carries the repo and RAG lines with it.
test("startupVersionLine — missing/invalid manifest → null (fail-silent, never throws)", () => {
  assert.equal(startupVersionLine(null), null);
  assert.equal(startupVersionLine(undefined), null);
  assert.equal(startupVersionLine("nope"), null);
  assert.equal(startupVersionLine(42), null);
  assert.equal(startupVersionLine({}), null);
});

// ── The reader, with its I/O injected ──────────────────────────────────────
// The two callers are top-level scripts no test can import, so the file read +
// JSON.parse + fail-silent catch would live where nothing can reach them (§6 of
// the TDD discipline: "not testable here" means "extract a seam").
test("readStartupVersionLine — reads the brain's manifest and labels what it found", () => {
  const seen = [];
  const line = readStartupVersionLine({
    manifestPath: "/brains/mind-palace/engine-manifest.json",
    existsSync: (p) => { seen.push(["exists", p]); return true; },
    readFileSync: (p, enc) => {
      seen.push(["read", p, enc]);
      return JSON.stringify({ source: { ref: "v4.5.0" } });
    },
  });
  assert.equal(line, "⚙️ Kenjaku engine v4.5.0");
  assert.deepEqual(seen, [
    ["exists", "/brains/mind-palace/engine-manifest.json"],
    ["read", "/brains/mind-palace/engine-manifest.json", "utf8"],
  ]);
});

// Both fail-silent twins, each as the SOLE reason (§9): a brain with no manifest
// at all, and a manifest that is on disk but unreadable / not JSON. Either one
// must cost the segment, never the SessionStart hook that carries the repo and
// RAG lines with it.
test("readStartupVersionLine — no manifest → null, and the file is never read", () => {
  let read = 0;
  assert.equal(
    readStartupVersionLine({
      manifestPath: "/brains/fresh-clone/engine-manifest.json",
      existsSync: () => false,
      readFileSync: () => { read += 1; return "{}"; },
    }),
    null,
  );
  assert.equal(read, 0, "a missing manifest must not be read");
});

test("readStartupVersionLine — unparseable manifest → null, never throws", () => {
  assert.equal(
    readStartupVersionLine({
      manifestPath: "/brains/x/engine-manifest.json",
      existsSync: () => true,
      readFileSync: () => "{ this is not json",
    }),
    null,
  );
  assert.equal(
    readStartupVersionLine({
      manifestPath: "/brains/x/engine-manifest.json",
      existsSync: () => true,
      readFileSync: () => { throw new Error("EACCES"); },
    }),
    null,
  );
});

test("a ref made of whitespace is NOT a version — it falls back like an absent one", () => {
  // "engine    " and "⚙️ Kenjaku engine    " are labels that look like they say
  // something and say nothing: the exact conflation the null case exists for.
  const manifest = { source: { ref: "   " }, engineVersion: { rag: "1.3.0" } };
  assert.equal(startupVersionLine(manifest), null);
  assert.equal(formatEngineVersion(manifest), "engine 1.3.0");
  assert.equal(formatEngineVersion({ source: { ref: "\t\n" } }), null);
});

// ═══════════════════════════════════════════════════════════════════════════
// F3's sibling — the session-start segment was version-blind too. It named the
// engine this brain runs and stopped there, so "you are current" and "nobody
// looked" reached the owner as the same sentence. One probe feeds this and the
// `--check` the skill runs, or the two surfaces drift.
// ═══════════════════════════════════════════════════════════════════════════

test("upstreamSegment — an update available is named, with how far ahead and the door to take", () => {
  assert.equal(
    upstreamSegment({
      cached: { state: "available", installed: "v4.6.0", target: "v4.7.0", ahead: 1, checkedAt: "2026-08-05T09:12:00.000Z" },
      installedRef: "v4.6.0",
    }),
    " · v4.7.0 available (1 release ahead) — ask me to update your engine",
  );
  assert.equal(
    upstreamSegment({
      cached: { state: "available", installed: "v4.5.0", target: "v4.7.0", ahead: 2, checkedAt: "2026-08-05T09:12:00.000Z" },
      installedRef: "v4.5.0",
    }),
    " · v4.7.0 available (2 releases ahead) — ask me to update your engine",
  );
});

test("upstreamSegment — being current is stated, and DATED: a cached verdict is not a live one", () => {
  assert.equal(
    upstreamSegment({
      cached: { state: "up-to-date", installed: "v4.7.0", target: "v4.7.0", ahead: 0, checkedAt: "2026-08-05T09:12:00.000Z" },
      installedRef: "v4.7.0",
    }),
    " · up to date (checked 2026-08-05)",
  );
});

test("upstreamSegment — a failed check reads as a failed check, never as 'nothing available'", () => {
  assert.equal(
    upstreamSegment({
      cached: { state: "unknown", installed: "v4.7.0", target: null, ahead: null, checkedAt: "2026-08-05T09:12:00.000Z" },
      installedRef: "v4.7.0",
    }),
    " · could not check for updates (2026-08-05)",
  );
});

test("upstreamSegment — nothing measured yet says so, rather than passing for good news", () => {
  // First session after an install or a rehydrate: the probe was just spawned and
  // has not written anything. Silence here would be the F14 shape again — "verified"
  // and "not looked at" rendering as the same blank.
  assert.equal(upstreamSegment({ cached: null, installedRef: "v4.7.0" }), " · checking for updates…");
  assert.equal(upstreamSegment({ cached: {}, installedRef: "v4.7.0" }), " · checking for updates…");
  assert.equal(upstreamSegment({ cached: { state: "nonsense" }, installedRef: "v4.7.0" }), " · checking for updates…");
  // …and the same nonsense written by a cache that IS about this version, so the
  // three named states are all refused and the fall-through is the one answering.
  // Without this, "unknown" and "any other word" are indistinguishable, and a cache
  // shape from another engine version would print a failed check that never happened.
  assert.equal(
    upstreamSegment({ cached: { state: "nonsense", installed: "v4.7.0" }, installedRef: "v4.7.0" }),
    " · checking for updates…",
  );
});

test("upstreamSegment — a verdict about ANOTHER version is not a verdict about this one", () => {
  // The owner just updated: the cache still says "2 releases ahead" about the engine
  // they no longer run. Reporting it would tell them to update to what they have.
  assert.equal(
    upstreamSegment({
      cached: { state: "available", installed: "v4.5.0", target: "v4.7.0", ahead: 2, checkedAt: "2026-08-05T09:12:00.000Z" },
      installedRef: "v4.7.0",
    }),
    " · checking for updates…",
  );
});

test("upstreamSegment — a verdict with no date is still shown, minus the date it does not have", () => {
  assert.equal(
    upstreamSegment({ cached: { state: "up-to-date", installed: "v4.7.0" }, installedRef: "v4.7.0" }),
    " · up to date",
  );
  assert.equal(
    upstreamSegment({ cached: { state: "unknown", installed: "v4.7.0", checkedAt: "not-a-date" }, installedRef: "v4.7.0" }),
    " · could not check for updates",
  );
});

test("upstreamSegment — a date is a date at the START, whole, and a string", () => {
  // The cache is a JSON file on the owner's disk: it can be hand-edited, half-written
  // or left over from another engine. Everything here must degrade to "no date", never
  // print a fragment that reads like one — the date is what tells a remembered verdict
  // from a live one, so a wrong date is worse than none.
  const segment = (checkedAt) =>
    upstreamSegment({ cached: { state: "unknown", installed: "v4.7.0", checkedAt }, installedRef: "v4.7.0" });

  assert.equal(segment("checked at 2026-08-05"), " · could not check for updates", "a date must START the value");
  assert.equal(segment("2026-08-0"), " · could not check for updates", "a truncated day is not a day");
  assert.equal(segment(["2026-08-05", "left over"]), " · could not check for updates", "JSON has arrays, and an array is not a date");
  assert.equal(segment(20260805), " · could not check for updates");
  assert.equal(segment(null), " · could not check for updates");
  // …and the shape the probe really writes still reads as the date it is.
  assert.equal(segment("2026-08-05T09:12:00.000Z"), " · could not check for updates (2026-08-05)");
});

test("readStartupVersionLine — a brain that cannot name its version says NOTHING, cache or no cache", () => {
  // No version line means there is nothing for the upstream segment to ride on.
  // Appending it anyway would put a bare " · checking for updates…" on screen with no
  // subject, or worse, glue it to the word "null".
  const line = readStartupVersionLine({
    manifestPath: "/brains/mine/engine-manifest.json",
    upstreamPath: "/brains/mine/.cache/engine-upstream.json",
    existsSync: () => true,
    readFileSync: (p) =>
      p === "/brains/mine/engine-manifest.json"
        ? JSON.stringify({ engineVersion: { rag: "1.4.0" } }) // no source.ref: no Kenjaku release to name
        : JSON.stringify({ state: "up-to-date", installed: null, checkedAt: "2026-08-05T09:12:00.000Z" }),
  });

  assert.equal(line, null);
});

test("readStartupVersionLine — with an upstream cache, the segment rides on the version line", () => {
  const line = readStartupVersionLine({
    manifestPath: "/brains/mine/engine-manifest.json",
    upstreamPath: "/brains/mine/.cache/engine-upstream.json",
    existsSync: (p) => p === "/brains/mine/engine-manifest.json" || p === "/brains/mine/.cache/engine-upstream.json",
    readFileSync: (p) =>
      p === "/brains/mine/engine-manifest.json"
        ? JSON.stringify({ source: { ref: "v4.6.0" } })
        : JSON.stringify({ state: "available", installed: "v4.6.0", target: "v4.7.0", ahead: 1, checkedAt: "2026-08-05T09:12:00.000Z" }),
  });

  assert.equal(line, "⚙️ Kenjaku engine v4.6.0 · v4.7.0 available (1 release ahead) — ask me to update your engine");
});

test("readStartupVersionLine — an unreadable cache degrades to 'checking', it never throws", () => {
  const line = readStartupVersionLine({
    manifestPath: "/brains/mine/engine-manifest.json",
    upstreamPath: "/brains/mine/.cache/engine-upstream.json",
    existsSync: () => true,
    readFileSync: (p) =>
      p === "/brains/mine/engine-manifest.json" ? JSON.stringify({ source: { ref: "v4.6.0" } }) : "{ truncated",
  });

  assert.equal(line, "⚙️ Kenjaku engine v4.6.0 · checking for updates…");
});
