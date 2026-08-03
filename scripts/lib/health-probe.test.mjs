import { test } from "node:test";
import assert from "node:assert/strict";
import { formatHealthBanner } from "./health-probe.mjs";

// ── formatHealthBanner — the cached-health reader's pure formatter (ADR 0028 §1).
// Quiet when healthy (all ok / only unknown → null), one loud banner when broken.

test("formatHealthBanner — all capabilities ok → null (quiet when healthy)", () => {
  const banner = formatHealthBanner([
    { capability: "rag", status: "ok" },
    { capability: "index", status: "ok" },
    { capability: "embedder", status: "ok" },
    { capability: "mcp", status: "ok" },
  ]);
  assert.equal(banner, null);
});

test("formatHealthBanner — a broken capability → one loud banner naming it", () => {
  const banner = formatHealthBanner([
    { capability: "rag", status: "ok" },
    { capability: "mcp", status: "broken", detail: "unreachable: local-mirror" },
  ]);
  assert.ok(banner, "expected a banner string");
  assert.match(banner, /mcp/);
  assert.match(banner, /⚠️/);
});

test("formatHealthBanner — only unknown (no broken) stays quiet → null", () => {
  const banner = formatHealthBanner([
    { capability: "rag", status: "ok" },
    { capability: "embedder", status: "unknown", detail: "api key not configured" },
    { capability: "mcp", status: "unknown", detail: "probe error: boom" },
  ]);
  assert.equal(banner, null);
});

// ── Per-module, actionable, layered messages (ADR 0030 F7-ter, baby-step 5).
// The banner must name the SPECIFIC cause and the RIGHT gesture per broken check —
// never the old generic "restart + /update-engine" catch-all.

test("formatHealthBanner — core vault-rag, index empty → names the cause + the reindex gesture, NOT /update-engine", () => {
  const banner = formatHealthBanner([
    {
      capability: "vault-rag",
      status: "broken",
      checks: [{ name: "index", status: "broken", detail: "index empty" }],
    },
  ]);
  assert.ok(banner, "expected a banner string");
  assert.match(banner, /index empty/);
  assert.match(banner, /reindex/i, "must point at the reindex gesture");
  assert.doesNotMatch(banner, /update-engine/, "no generic /update-engine remedy");
});

test("formatHealthBanner — optional local-mirror broken → soft 'a source behind' tone, NOT a scary core alarm", () => {
  const banner = formatHealthBanner([
    {
      capability: "local-mirror",
      status: "broken",
      checks: [{ name: "store", status: "broken", detail: "mirror store unreachable: ENOENT" }],
    },
  ]);
  assert.ok(banner, "expected a banner string");
  assert.match(banner, /mirror/i);
  assert.match(banner, /still/i, "must reassure the brain itself still works");
  assert.doesNotMatch(banner, /⚠️/, "an optional source behind is not a core ⚠️ alarm");
});

test("formatHealthBanner — embedder in-process weights missing → re-download gesture (not a generic restart)", () => {
  const banner = formatHealthBanner([
    {
      capability: "vault-rag",
      status: "broken",
      checks: [{ name: "embedder", status: "broken", detail: "in-process weights missing" }],
    },
  ]);
  assert.ok(banner, "expected a banner string");
  assert.match(banner, /in-process weights missing/);
  assert.match(banner, /re-download/i, "must point at the model re-download gesture");
});

test("formatHealthBanner — core AND optional broken → both sections, each with its own tone", () => {
  const banner = formatHealthBanner([
    {
      capability: "vault-rag",
      status: "broken",
      checks: [{ name: "index", status: "broken", detail: "index empty" }],
    },
    {
      capability: "local-mirror",
      status: "broken",
      checks: [{ name: "store", status: "broken", detail: "mirror store unreachable: ENOENT" }],
    },
  ]);
  assert.ok(banner, "expected a banner string");
  assert.match(banner, /⚠️.*problem with your brain/s, "core section present");
  assert.match(banner, /ℹ️.*mirrored source is behind/s, "optional section present");
  assert.match(banner, /index empty/);
  assert.match(banner, /mirror store unreachable/);
});

test("formatHealthBanner — a note the engine cannot bring in step → the repair gesture, not a restart", () => {
  // F15: the note is NAMED and the gesture is to repair it. "restart the brain" (the
  // default gesture) would be actively wrong here — nothing about a session restart
  // fixes a frontmatter the parser refuses.
  const banner = formatHealthBanner([
    {
      capability: "vault-rag",
      status: "broken",
      checks: [
        {
          name: "notes",
          status: "broken",
          detail:
            '1 note the engine cannot bring in step — topics/crise.md: damaged front-matter key "updated"',
        },
      ],
    },
  ]);
  assert.ok(banner, "expected a banner string");
  assert.match(banner, /topics\/crise\.md/, "must name the note");
  assert.match(banner, /repair/i, "must point at repairing the note");
  assert.doesNotMatch(banner, /restart the brain/, "a restart fixes nothing here");
});
