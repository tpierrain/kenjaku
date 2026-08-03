import { test } from "node:test";
import assert from "node:assert/strict";
import { formatEngineVersion, startupVersionLine, readStartupVersionLine } from "./engine-version.mjs";

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
// Naming that state out loud belongs to F3 in v4.7.0, which owns "unknown".
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
