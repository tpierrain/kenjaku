import { test } from "node:test";
import assert from "node:assert/strict";

import {
  DIVERGENCE_CLOSING,
  DIVERGENCE_LINE,
  buildEngineDivergenceHookOutput,
  engineDivergenceNudge,
} from "./engine-divergence-nudge.mjs";

// S4-4a — what the SESSION surface says about the files the engine is holding back.
//
// The prose IS the deliverable here (S3's measured lesson), so these tests assert whole
// sentences and whole objects. Sampling them with `includes` leaves the clauses in
// between unjudged, which is exactly how the last surface shipped a claim it could not
// make ("your customized" about a file nobody had provably edited).

const customized = { rel: "CLAUDE.md", reason: "customized", since: "v4.7.0" };
const customizedNoRef = { rel: ".claude/settings.json", reason: "customized", since: null };
const unprovable = { rel: ".claude/skills/coach/SKILL.md", reason: "no-provenance", since: null };

// ── the per-file clause: the map MOVED out of update-engine.mjs, now shared ──────

test("DIVERGENCE_LINE — customized WITH a recorded ref names it", () => {
  assert.equal(DIVERGENCE_LINE.customized("v4.7.0"), "yours; the engine last delivered here at v4.7.0");
});

test("DIVERGENCE_LINE — customized with NO recorded ref says so, and names no version", () => {
  assert.equal(DIVERGENCE_LINE.customized(null), "yours; no record of which engine version it came from");
});

test("DIVERGENCE_LINE — no-provenance never claims the file is the owner's", () => {
  // The false claim S4-3 removed: this verdict cannot say "yours".
  assert.equal(DIVERGENCE_LINE["no-provenance"](), "left as-is; no record of what the engine delivered there");
});

test("DIVERGENCE_CLOSING — the calm verdict, load-bearing and unchanged", () => {
  assert.equal(DIVERGENCE_CLOSING, "Nothing to do: a file the engine leaves alone is a choice, not a problem.");
});

// ── the nudge: ONE line, one file named, the count always exact ─────────────────

test("engineDivergenceNudge — nothing held back → null (the surface stays silent)", () => {
  assert.equal(engineDivergenceNudge({ divergence: [], ref: "v5.0.0" }), null);
});

test("engineDivergenceNudge — one file held back, whole sentence", () => {
  assert.equal(
    engineDivergenceNudge({ divergence: [customized], ref: "v5.0.0" }),
    "⚙️ This brain runs v5.0.0, and the engine is leaving 1 file alone — CLAUDE.md" +
      " (yours; the engine last delivered here at v4.7.0)." +
      " Nothing to do: a file the engine leaves alone is a choice, not a problem.",
  );
});

test("engineDivergenceNudge — several held back: the FIRST is named, the rest are counted", () => {
  assert.equal(
    engineDivergenceNudge({ divergence: [customized, unprovable, customizedNoRef], ref: "v5.0.0" }),
    "⚙️ This brain runs v5.0.0, and the engine is leaving 3 files alone — CLAUDE.md" +
      " (yours; the engine last delivered here at v4.7.0), and 2 more." +
      " Nothing to do: a file the engine leaves alone is a choice, not a problem.",
  );
});

test("engineDivergenceNudge — two held back: the tail is singular", () => {
  assert.equal(
    engineDivergenceNudge({ divergence: [unprovable, customized], ref: "v5.0.0" }),
    "⚙️ This brain runs v5.0.0, and the engine is leaving 2 files alone" +
      " — .claude/skills/coach/SKILL.md (left as-is; no record of what the engine delivered there)," +
      " and 1 more." +
      " Nothing to do: a file the engine leaves alone is a choice, not a problem.",
  );
});

// ── S10-3: a file the owner has ALREADY answered about stops being raised ───────
//
// 🚨 This is where consent fatigue would live if it lived anywhere. This surface speaks
// UNBIDDEN, at every single session start; re-raising a file the owner has settled is
// the exact nag `walkthroughOffer`'s "it does not repeat" was written against. The
// subtraction is the nudge's own, not the caller's, so a second caller cannot reinstate
// the nag by forgetting a filter.

const answeredAt = (rel, ref) => ({ [rel]: { decision: "keep-mine", at: ref } });

test("engineDivergenceNudge — a file answered AT THIS REF is subtracted, and never named", () => {
  assert.equal(
    engineDivergenceNudge({
      divergence: [customized, unprovable],
      ref: "v5.0.0",
      answers: answeredAt("CLAUDE.md", "v5.0.0"),
    }),
    "⚙️ This brain runs v5.0.0, and the engine is leaving 1 file alone" +
      " — .claude/skills/coach/SKILL.md (left as-is; no record of what the engine delivered there)." +
      " Nothing to do: a file the engine leaves alone is a choice, not a problem.",
    "the count drops to 1 AND the named file moves on — a subtraction that only hid the name would lie",
  );
});

test("engineDivergenceNudge — an answer given at an EARLIER ref does not subtract", () => {
  // The whole point of keying answers by version: a new engine means a new candidate, so
  // the question is genuinely open again. Once per release, with no timer to tune.
  assert.equal(
    engineDivergenceNudge({
      divergence: [customized],
      ref: "v5.1.0",
      answers: answeredAt("CLAUDE.md", "v5.0.0"),
    }),
    "⚙️ This brain runs v5.1.0, and the engine is leaving 1 file alone — CLAUDE.md" +
      " (yours; the engine last delivered here at v4.7.0)." +
      " Nothing to do: a file the engine leaves alone is a choice, not a problem.",
  );
});

test("engineDivergenceNudge — every file answered → SILENCE, not a nudge with a zero in it", () => {
  assert.equal(
    engineDivergenceNudge({
      divergence: [customized, unprovable],
      ref: "v5.0.0",
      answers: { ...answeredAt("CLAUDE.md", "v5.0.0"), ...answeredAt(".claude/skills/coach/SKILL.md", "v5.0.0") },
    }),
    null,
  );
});

test("engineDivergenceNudge — no answers at all is the fleet's state today, and reads exactly as before", () => {
  // Anti-vacuous: every assertion above would also pass if the parameter were ignored
  // and the nudge simply never spoke. This pins that the default is "nothing answered".
  assert.equal(
    engineDivergenceNudge({ divergence: [customized], ref: "v5.0.0", answers: {} }),
    engineDivergenceNudge({ divergence: [customized], ref: "v5.0.0" }),
  );
});

test("engineDivergenceNudge — an unknown `since` is NEVER filled in from the running ref", () => {
  const nudge = engineDivergenceNudge({ divergence: [customizedNoRef], ref: "v5.0.0" });
  // The version the brain runs today is not the version the file is behind — the exact
  // confusion `baseRefs` was added to end. It may be named in the header and nowhere else.
  assert.equal(
    nudge,
    "⚙️ This brain runs v5.0.0, and the engine is leaving 1 file alone — .claude/settings.json" +
      " (yours; no record of which engine version it came from)." +
      " Nothing to do: a file the engine leaves alone is a choice, not a problem.",
  );
  assert.equal(nudge.split("v5.0.0").length - 1, 1, "the running ref is named once, as the brain's own version");
});

test("engineDivergenceNudge — no recorded engine version: the header says so, and prints no `null`", () => {
  const nudge = engineDivergenceNudge({ divergence: [customized], ref: null });
  assert.equal(
    nudge,
    "⚙️ This brain records no engine version, and the engine is leaving 1 file alone — CLAUDE.md" +
      " (yours; the engine last delivered here at v4.7.0)." +
      " Nothing to do: a file the engine leaves alone is a choice, not a problem.",
  );
  assert.ok(!nudge.includes("null"), "a missing ref is a sentence, never the word null");
});

// ── the hook envelope ───────────────────────────────────────────────────────────

test("buildEngineDivergenceHookOutput — nothing to say → null (nothing is written at all)", () => {
  assert.equal(buildEngineDivergenceHookOutput(null), null);
});

test("buildEngineDivergenceHookOutput — the WHOLE envelope, both channels", () => {
  const nudge = engineDivergenceNudge({ divergence: [customized], ref: "v5.0.0" });
  assert.deepEqual(buildEngineDivergenceHookOutput(nudge), {
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext:
        `[engine-divergence] A standing fact about this brain, not an alert. ${nudge} ` +
        `Mention it only if they ask about their engine version, an update, or why a skill behaves ` +
        `as it does — never open a session with it, and never offer to "fix" it.`,
    },
    // A SIBLING of hookSpecificOutput, never a key inside it: the client reads
    // `systemMessage` at the top level, so the first draft's nesting was a CLI channel
    // that emitted nothing at all — silently, since the JSON stayed perfectly valid.
    // `assert.deepEqual` on the WHOLE object is what makes that a red test rather than
    // a shape nobody looks at.
    systemMessage: nudge,
  });
});

test("buildEngineDivergenceHookOutput keeps the echoed payload short — volume IS the defect (F5)", () => {
  // Measured, not assumed: `additionalContext` is echoed to a CLI owner VERBATIM before
  // they have typed a word. This surface's first draft listed five files on five lines
  // (~990 chars) — which is the banner S4 forbids, arriving through the channel that
  // looked like it was only talking to the agent. Hence ONE line naming ONE file: the
  // full list is already free in the update report, and the count here stays exact.
  const payload = buildEngineDivergenceHookOutput(
    engineDivergenceNudge({
      // The worst case by LENGTH: a deep skill path, the longer of the two clauses, and
      // the tail. What floats is the owner's own path, exactly as the universe reminder's
      // budget lets their display name float.
      divergence: [unprovable, customized, customizedNoRef],
      ref: "v5.0.0",
    }),
  ).hookSpecificOutput.additionalContext;

  // MEASURED, not guessed: the launcher's own tree emits 490 chars here (14 files held
  // back, `.claude/skills/coach/SKILL.md` first). What floats is the owner's own path
  // length — exactly as the universe reminder lets their display name float — so the
  // bound has room for a deeper skill path and none for a second sentence.
  assert.ok(payload.length <= 520, `the startup payload grew back to ${payload.length} chars:\n${payload}`);
});
