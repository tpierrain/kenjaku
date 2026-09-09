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

// ─── #90: the third input, and the one that ends the loop ────────────────────
// The flag means "on disk is converged, but THIS conversation predates it". Until
// now nothing could tell it that the conversation had since been restarted — the
// only eraser was a SessionStart, which resuming a conversation never runs. The
// app identity (claude-app-identity.mjs) answers exactly that, and only that.
test("isRestartPending — the flag, on an app that has since restarted → NOT pending, and the loop ends", () => {
  assert.equal(isRestartPending({ flagExists: true, gapNeeded: false, appRestarted: true }), false);
});

test("isRestartPending — a restart NEVER cancels a real convergence gap", () => {
  // The two signals are not interchangeable. `gapNeeded` is a skill or a server
  // sitting on disk, uninstalled, RIGHT NOW: no amount of restarting makes that
  // untrue, and silencing it here would be the silent failure, dressed up as a fix.
  assert.equal(isRestartPending({ flagExists: true, gapNeeded: true, appRestarted: true }), true);
  assert.equal(isRestartPending({ flagExists: false, gapNeeded: true, appRestarted: true }), true);
});

test("isRestartPending — no restart proven → exactly today's behaviour, whether it is said or left unsaid", () => {
  assert.equal(isRestartPending({ flagExists: true, gapNeeded: false, appRestarted: false }), true);
  assert.equal(isRestartPending({ flagExists: true, gapNeeded: false }), true);
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
  // The WHY, and the place to put it. Both are load-bearing copy, not decoration: an owner
  // told to restart with no reason reads it as a glitch and ignores the next one, and a
  // directive that does not say "open your reply with it" gets buried under the answer to
  // whatever they actually asked — on a channel whose whole point is that it repeats.
  assert.match(directive, /only at start/i, "the reason a restart is what fixes it");
  assert.match(directive, /open your reply/i, "led with, not appended after the answer");
});

test("restartPromptDirective — nothing pending → nothing injected, on every prompt of every session", () => {
  assert.equal(restartPromptDirective(false), null);
});

// ─── #90: the loop, and the sentence that ends it ────────────────────────────
// The directive tells the owner to restart and come back to THIS conversation — and
// resuming a conversation runs no SessionStart, which is the only place the marker is
// erased. So obeying the instruction is exactly what keeps it firing, on every prompt,
// unbounded. The mechanism that will make the marker honest is a separate fix; this is
// the belt: an owner must never be locked inside a loop whose exit is unwritten.
//
// The condition is stated in prose ON PURPOSE, and it is the one thing the disk cannot
// check: "did they already restart?" is answered by the conversation, which the model
// reads and `.cache/` does not. Counting deliveries would have been a poor proxy — five
// messages typed BEFORE a legitimate restart are five repeats, and telling that owner
// their marker is stale would send them back to work on the old engine.
test("restartPromptDirective — an owner who already restarted is told the marker is stale, and how to clear it", () => {
  const directive = restartPromptDirective(true);

  assert.match(directive, /already/i, "the escape hatch is conditioned on the restart having happened");
  assert.match(directive, /stale/i, "and it names what is actually wrong: the marker, not the engine");
  assert.match(directive, /\.cache\/restart-needed/, "the marker is named, so the exit is actionable");
  // Order is the safety. Read the other way round, the first thing an owner sees is a way
  // to silence a nudge they have not acted on yet — which leaves them on the old engine,
  // silently, which is the whole failure this nudge exists to prevent.
  assert.ok(
    directive.indexOf("REOPEN") < directive.indexOf(".cache/restart-needed"),
    "the restart is asked for first; the escape hatch is the fallback, never the offer",
  );
});

// Its LENGTH is bounded where it is emitted (`scripts/prompt-restart-nudge.test.mjs`),
// per the F5 audit's convention: the bound belongs to the file that puts the text in the
// owner's channel, so the guard that hunts unbounded emitters can find it.
