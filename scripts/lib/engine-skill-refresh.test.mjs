import { test } from "node:test";
import assert from "node:assert/strict";

import { fingerprint } from "./engine-source.mjs";
import { refreshVerdict } from "./engine-skill-refresh.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// engine-skill-refresh — the PURE verdict behind "refresh an engine skill only
// if we can PROVE nobody touched it" (plan Increment 2.5, Step 1). Given what the
// brain has on disk, the provenance base the engine recorded when it last delivered
// the file, and the candidate new content, it answers: install it / refresh it /
// preserve the owner's version. No fs, no side effects.
// ═══════════════════════════════════════════════════════════════════════════

test("a file the brain does not have yet → install it", () => {
  assert.deepEqual(
    refreshVerdict({ installed: null, base: undefined, candidate: "# new skill\n" }),
    { verdict: "absent-install" },
  );
});

test("installed file still byte-identical to the recorded base → refresh it", () => {
  const delivered = "# switch (v3.6.0)\n";
  assert.deepEqual(
    refreshVerdict({
      installed: delivered,
      base: fingerprint(delivered),
      candidate: "# switch (v3.6.2)\n",
    }),
    { verdict: "refresh" },
  );
});

test("CRLF copy of the candidate itself → still nothing to do", () => {
  // Same content, Windows line endings: rewriting it would flip the file to LF at
  // every single update (autocrlf puts the CRLFs back) — pure churn, zero gain.
  const candidate = "# switch (v3.6.2)\nline two\n";
  const installed = candidate.split("\n").join("\r\n");
  assert.deepEqual(
    refreshVerdict({ installed, base: fingerprint(candidate), candidate }),
    { verdict: "unchanged" },
  );
});

test("owner customized the file (hash no longer matches the base) → preserve it", () => {
  const delivered = "# prepare-1-1 (v3.6.0)\n";
  assert.deepEqual(
    refreshVerdict({
      installed: delivered + "\nMy own KPIs section.\n", // the documented customization case
      base: fingerprint(delivered),
      candidate: "# prepare-1-1 (v3.6.2)\n",
    }),
    { verdict: "preserve", reason: "customized" },
  );
});

test("no provenance base recorded (pre-provenance brain) → preserve, but say WHY", () => {
  // Nothing was ever fingerprinted for this file, so "untouched" is UNPROVABLE — we
  // still keep the owner's copy, but the report must not call them a customizer.
  assert.deepEqual(
    refreshVerdict({ installed: "# switch\n", base: undefined, candidate: "# switch v2\n" }),
    { verdict: "preserve", reason: "no-provenance" },
  );
});

test("a base is recorded but the file is gone from disk → install it back", () => {
  // Absence is whatever the fs seam reports for "no content" (null OR undefined) —
  // a recorded base must never turn a missing file into a "preserve".
  const delivered = "# switch (v3.6.0)\n";
  for (const missing of [null, undefined]) {
    assert.deepEqual(
      refreshVerdict({ installed: missing, base: fingerprint(delivered), candidate: "# switch (v3.6.2)\n" }),
      { verdict: "absent-install" },
    );
  }
});

test("already carrying the candidate content → nothing to do (no write, no churn)", () => {
  // The steady state of an up-to-date brain: re-running the update must NOT rewrite
  // the file, or every session would produce auto-commit noise for a no-op.
  const current = "# switch (v3.6.2)\n";
  assert.deepEqual(
    refreshVerdict({ installed: current, base: fingerprint(current), candidate: current }),
    { verdict: "unchanged" },
  );
});

test("Windows CRLF drift is NOT a customization → still refresh it", () => {
  // A Windows brain whose checkout/editor rewrote the line endings differs from the
  // base BYTE-wise while nobody edited a word. Freezing those brains forever would
  // hand the whole Windows fleet the very bug this increment fixes.
  const delivered = "# switch (v3.6.0)\nline two\n";
  assert.deepEqual(
    refreshVerdict({
      installed: delivered.split("\n").join("\r\n"),
      base: fingerprint(delivered),
      candidate: "# switch (v3.6.2)\nline two\n",
    }),
    { verdict: "refresh" },
  );
});
