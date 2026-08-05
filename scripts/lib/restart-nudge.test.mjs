import { test } from "node:test";
import assert from "node:assert/strict";
import { restartNudgeSegment, restartPromptDirective, isRestartPending, RESTART_FLAG_REL } from "./restart-nudge.mjs";

// F-B7d (A2, hardened after Thomas's rig QA): a pre-3.3 brain's FIRST /update-engine runs
// the OLD orchestrator → silent report → the user doesn't restart → the new skill/MCP stay
// unloaded in the stale session. The OLD core never converges and never sets the flag, so a
// flag-only nudge would NEVER fire in that session. status-line therefore decides "restart
// pending" from EITHER signal: an on-disk delivered-but-not-installed GAP (covers the stale
// same-session window — the new status-line.mjs runs on the next refresh and sees the gap),
// OR the explicit FLAG (covers converged-but-this-session-hasn't-loaded-it).
test("isRestartPending — an on-disk gap alone → pending (the silent-first-update fix)", () => {
  assert.equal(isRestartPending({ flagExists: false, gapNeeded: true }), true);
});

test("isRestartPending — the flag alone → pending (converged-but-not-loaded)", () => {
  assert.equal(isRestartPending({ flagExists: true, gapNeeded: false }), true);
});

test("isRestartPending — neither signal → not pending (a converged, loaded brain stays clean)", () => {
  assert.equal(isRestartPending({ flagExists: false, gapNeeded: false }), false);
});

test("isRestartPending — both signals → still just pending (idempotent)", () => {
  assert.equal(isRestartPending({ flagExists: true, gapNeeded: true }), true);
});

// F-B7d (ship-blocker A2): the SessionStart self-heal nudge must reach Desktop, which
// drops `systemMessage` — so it rides the PERSISTENT statusLine instead. status-line.mjs
// calls this pure decider with "is a restart pending?" (the on-disk flag), and shows a
// loud, unmissable segment until a fresh session has loaded the converged engine.
test("restartNudgeSegment — pending → a loud, unmissable restart segment", () => {
  const seg = restartNudgeSegment(true);
  assert.ok(seg, "a pending restart must produce a segment");
  assert.match(seg, /restart/i);
  assert.match(seg, /⚠️/);
});

test("restartNudgeSegment — not pending → no segment (null), so the status line stays clean", () => {
  assert.equal(restartNudgeSegment(false), null);
});

// The flag the self-heal writes / status-line reads lives under the gitignored .cache/ so
// it never reaches the user's git history (cross-machine noise) — a per-checkout marker.
test("RESTART_FLAG_REL — a stable, gitignored .cache-relative path", () => {
  assert.match(RESTART_FLAG_REL, /^\.cache\//);
});

// ─── F20: the channel that reaches Desktop, and repeats until it is acted on ──
// `systemMessage` is CLI-only and is printed once, at the top of a session that may run for
// hours; on Desktop it is dropped outright, and a pending restart even SILENCES the version
// relay (status-hook-output.mjs). So the only deterministic Desktop cue for "you are running
// the old engine" was a chat rule inside the update-engine skill — which fires when the update
// ran HERE, precisely the case F20 is not about. `UserPromptSubmit` can inject on every prompt.
// Inject, never block (exit 2): a false positive must cost a sentence, never lock an owner out
// of their own brain.
test("restartPromptDirective — pending → the agent is told to raise the restart, in the owner's language", () => {
  const directive = restartPromptDirective(true);

  assert.match(directive, /old engine/i);
  assert.match(directive, /close .*reopen/i);
  assert.match(directive, /same conversation/i, "a full restart resumes THIS conversation");
  // Not merely absent — FORBIDDEN, the way the update-engine skill forbids it: "open a new
  // conversation" is the distinct initial-rooting rule, and an agent that reaches for it here
  // sends the owner away from the thread they were working in.
  assert.match(directive, /do not .{0,30}new conversation/i);
  assert.match(directive, /their own language|owner's language/i);
});

test("restartPromptDirective — nothing pending → nothing injected, on every prompt of every session", () => {
  assert.equal(restartPromptDirective(false), null);
});

// Its LENGTH is bounded where it is emitted (`scripts/prompt-restart-nudge.test.mjs`),
// per the F5 audit's convention: the bound belongs to the file that puts the text in the
// owner's channel, so the guard that hunts unbounded emitters can find it.
