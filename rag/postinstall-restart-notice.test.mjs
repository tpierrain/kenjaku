import { test } from "node:test";
import assert from "node:assert/strict";
import {
  shouldNudgeRestart,
  restartNoticeBanner,
  shouldFinishRefresh,
  finishRefreshBanner,
} from "./postinstall-restart-notice.mjs";

// ⛔ The "message in a bottle" (Thomas, 2026-06-21). The OLD update orchestrator (frozen on a
// pre-3.3 brain) ALWAYS runs `npm install` in rag/ with stdio:"inherit", and npm ALWAYS runs the
// `postinstall` of the package.json ON DISK — which is the NEW one (replace regime, copied before
// install). So a NEW postinstall runs UNDER the OLD orchestrator, deterministically, on the very
// first update. It must fire ONLY during an update, never on a fresh install.
//
// The deterministic update-vs-install signal: at postinstall time the new rag/package.json is on
// disk (new rag version) but the manifest still records the OLD version (it is rewritten AFTER
// npm install, step 7). So recorded != package ⇒ an update is mid-flight ⇒ nudge.

test("shouldNudgeRestart — update mid-flight (manifest exists, recorded rag != package rag) → true", () => {
  assert.equal(
    shouldNudgeRestart({ manifestExists: true, recordedRagVersion: "1.1.0", packageRagVersion: "1.1.5" }),
    true,
  );
});

test("shouldNudgeRestart — fresh install / no-op re-install (recorded == package) → false (no crying wolf)", () => {
  assert.equal(
    shouldNudgeRestart({ manifestExists: true, recordedRagVersion: "1.1.5", packageRagVersion: "1.1.5" }),
    false,
  );
});

test("shouldNudgeRestart — no manifest yet (brain not created, raw fresh install) → false", () => {
  assert.equal(
    shouldNudgeRestart({ manifestExists: false, recordedRagVersion: undefined, packageRagVersion: "1.1.5" }),
    false,
  );
});

// The banner lands in npm's stdout (stdio:"inherit") → the agent's tool result → the chat. The
// only renderer of the Desktop chat is the AGENT, so the banner is phrased as a DIRECTIVE to the
// agent (like a SessionStart additionalContext), maximizing the chance it surfaces it verbatim.
test("restartNoticeBanner — directs the AGENT to tell the user to restart, loudly, citing the constitution", () => {
  const b = restartNoticeBanner();
  assert.match(b, /RESTART/i);
  assert.match(b, /tell the user|inform the user/i); // agent-directed, not raw user prose
  assert.match(b, /CLAUDE\.md|constitution/i);        // the WHY: the constitution changed
  assert.match(b, /⚠️/);                               // unmissable
  // It must NOT undercut itself with an "optional / nothing to do" framing.
  assert.doesNotMatch(b, /nothing to do|optional|rien à faire/i);
});

// ── The SECOND bottle: finish the skill refresh on a pre-v3.3.0 brain ────────────
// Auto-finalize shipped in v3.3.0, whose manifest records engineVersion.scripts "1.1.0". An
// older brain's orchestrator never re-execs the freshly-written reconciler, so the untouched
// engine skills stay frozen until a SECOND update. At postinstall time the manifest still
// holds the brain's OLD versions → `recorded scripts < 1.1.0` names that cohort deterministically.

test("shouldFinishRefresh — pre-v3.3.0 orchestrator mid-update (scripts 1.0.0 < 1.1.0) → true", () => {
  assert.equal(
    shouldFinishRefresh({
      manifestExists: true,
      recordedRagVersion: "1.1.0",
      packageRagVersion: "1.1.5",
      recordedScriptsVersion: "1.0.0",
    }),
    true,
  );
});

// On the boundary: v3.3.0 itself HAS auto-finalize → one pass converges → no second run to ask for.
test("shouldFinishRefresh — exactly v3.3.0 (scripts 1.1.0) → false (auto-finalize is there)", () => {
  assert.equal(
    shouldFinishRefresh({
      manifestExists: true,
      recordedRagVersion: "1.1.0",
      packageRagVersion: "1.1.5",
      recordedScriptsVersion: "1.1.0",
    }),
    false,
  );
});

// A manifest with NO recorded scripts version predates the key itself → older than v3.3.0 by
// construction. Fire: an extra converging update is harmless, a frozen skill set is not.
test("shouldFinishRefresh — manifest with no recorded scripts version (older than the key) → true", () => {
  assert.equal(
    shouldFinishRefresh({
      manifestExists: true,
      recordedRagVersion: "1.0.9",
      packageRagVersion: "1.1.5",
      recordedScriptsVersion: undefined,
    }),
    true,
  );
});

// Same cohort, but NO update in flight (recorded rag == package rag): the SessionStart self-heal
// also runs `npm install`, and a converged brain re-installing its deps has nothing to finish.
// Without this conjunction, an old brain would be nagged to update at every single session start.
test("shouldFinishRefresh — old cohort but no update mid-flight (self-heal / fresh install) → false", () => {
  assert.equal(
    shouldFinishRefresh({
      manifestExists: true,
      recordedRagVersion: "1.1.5",
      packageRagVersion: "1.1.5",
      recordedScriptsVersion: "1.0.0",
    }),
    false,
  );
});

// Like the restart notice, the bottle PRINTS a directive and refreshes nothing itself: at
// postinstall time there is no source to refresh from (the new skills live in the orchestrator's
// temp clone), the staged base is already overwritten, and reconciling inside `npm install` would
// recurse. So the banner's whole job is to make the AGENT run the second pass, in this same
// interaction — the user asked once.
test("finishRefreshBanner — orders the AGENT to re-run the update NOW, naming the command", () => {
  const b = finishRefreshBanner();
  assert.match(b, /node scripts\/update-engine\.mjs/); // the exact command, copy-pasteable
  assert.match(b, /run (it|this command) (again|once more)/i); // an order to act, now
  assert.match(b, /immediately|now\b/i);
  assert.match(b, /skill/i); // the WHY: the engine skills are not refreshed yet
  assert.match(b, /⚠️/); // unmissable, like its sibling
  // It must not read as something to postpone or to hand over to the user.
  assert.doesNotMatch(b, /next time|later|ask the user to run|optional/i);
});
