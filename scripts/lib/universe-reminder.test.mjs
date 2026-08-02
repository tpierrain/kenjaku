import { test } from "node:test";
import assert from "node:assert/strict";
import {
  universeReminder,
  buildUniverseHookOutput,
  profileCaptureOffer,
} from "./universe-reminder.mjs";
import { DEFAULT_UNIVERSE } from "./universes.mjs";

// ── universeReminder: the SessionStart nudge, gated by progressive disclosure ──
test("universeReminder stays silent for a single-universe brain (below the gate)", () => {
  assert.equal(universeReminder({ registry: [], active: DEFAULT_UNIVERSE }), null);
});

test("universeReminder names the active universe and lists all once the gate is open", () => {
  const nudge = universeReminder({ registry: ["acme", "blue"], active: "acme" });
  assert.match(nudge, /Active universe: 'acme'/);
  // The full list, default first, appears so the user knows what to switch/span to.
  assert.match(nudge, /default, acme, blue/);
  // And the count (3) is stated.
  assert.match(nudge, /of 3/);
});

test("universeReminder falls back to the default when the active pointer is blank", () => {
  // Gate is open (a universe was created) but the active pointer is unset/blank →
  // the owner is on their cross-cutting default corpus, and we say so by name.
  const nudge = universeReminder({ registry: ["acme"], active: "" });
  assert.match(nudge, /Active universe: 'default'/);
});

// ── profileCaptureOffer: the ONE skippable offer to describe your context ────
// D2: existing brains (Thomas' own included) have no profile and no reason to
// learn the command exists. So the session offers, once, and takes no for an
// answer forever.

test("profileCaptureOffer invites the owner to describe their context when there is no profile", () => {
  const offer = profileCaptureOffer({ hasProfile: false, declined: false });

  assert.match(offer, /context/i);
  // It must read as declinable, or a one-shot offer becomes a demand.
  assert.match(offer, /(skip|decline|no thanks|not now)/i);
});

test("profileCaptureOffer carries the FACT only — never how to run it (F5)", () => {
  // This payload is echoed VERBATIM to a CLI owner, prefixed `SessionStart:startup says:`
  // (field-verified 2026-07-28). So the trigger states the fact and stops: the seven
  // questions, the skill section, the write command and the decline command all live in
  // the `switch` skill, which the agent loads when the user accepts — or declines. Reciting
  // them upfront duplicates a document that gets read anyway, and it IS the eight lines.
  const offer = profileCaptureOffer({ hasProfile: false, declined: false });

  assert.doesNotMatch(offer, /switch/i);
  assert.doesNotMatch(offer, /set-universe-profile/);
  assert.doesNotMatch(offer, /skill/i);
});

test("profileCaptureOffer never says 'universe' in the words meant for the user", () => {
  // This offer reaches single-universe brains — the majority — and the word would
  // expose machinery they do not have yet (ADR 0034 progressive disclosure). The
  // `backticked` commands are for the agent alone, and are the ONLY place the word
  // may appear (a script has the filename it has).
  const prose = profileCaptureOffer({ hasProfile: false, declined: false }).replace(/`[^`]*`/g, "");

  assert.doesNotMatch(prose, /universe/i);
});

test("profileCaptureOffer forbids the word 'universe' to a single-universe brain, and allows it past the gate", () => {
  // THE dichotomy (ADR 0034): below the gate the machinery does not exist yet, so
  // the session must say "your context"; the moment a second universe exists,
  // everything is framed as universes. The core decides which — never the LLM,
  // which would have to count universes to know (ADR 0009).
  const alone = profileCaptureOffer({ hasProfile: false, declined: false, multiverse: false });
  const many = profileCaptureOffer({ hasProfile: false, declined: false, multiverse: true });

  assert.match(alone, /never use the word `universe`/i);
  assert.doesNotMatch(many, /never use the word `universe`/i);
  assert.match(many, /universe/i);
});

test("profileCaptureOffer stays silent once a profile exists", () => {
  assert.equal(profileCaptureOffer({ hasProfile: true, declined: false }), null);
});

test("profileCaptureOffer stays silent forever once declined", () => {
  // Without this, a skippable offer comes back every single session, which is the
  // definition of nagging.
  assert.equal(profileCaptureOffer({ hasProfile: false, declined: true }), null);
});

// ── buildUniverseHookOutput: wrap the nudge for the SessionStart hook ─────────
test("buildUniverseHookOutput returns null when there is nothing to say at all", () => {
  // Gate closed AND no profile: the hook must print nothing, not an empty envelope.
  assert.equal(buildUniverseHookOutput({}), null);
  assert.equal(buildUniverseHookOutput(), null);
  assert.equal(buildUniverseHookOutput({ nudge: null, digest: null }), null);
});

test("buildUniverseHookOutput injects a profile digest as context to USE, not to announce", () => {
  // The digest is ambient background (who you are here, who your people are). The
  // agent should ACT on it, never read it back at the owner like a status line.
  const out = buildUniverseHookOutput({
    digest: "Acme Corp (employer) — your role: Head of Engineering.\nPeople: Zoe (CTO).",
  });

  assert.match(out.hookSpecificOutput.additionalContext, /Acme Corp \(employer\)/);
  assert.match(out.hookSpecificOutput.additionalContext, /People: Zoe \(CTO\)\./);
  assert.match(out.hookSpecificOutput.additionalContext, /do not (repeat|recite|announce)/i);
});

test("buildUniverseHookOutput frames a lone digest WITHOUT naming universes", () => {
  // A single-universe brain can have a profile too (that is the whole backfill
  // case), and progressive disclosure means it must never meet the word before it
  // has two of them. The digest is about their world, not about the machinery.
  const out = buildUniverseHookOutput({ digest: "Acme Corp (employer)." });

  assert.doesNotMatch(out.hookSpecificOutput.additionalContext, /universe/i);
});

test("buildUniverseHookOutput carries the capture offer, and it survives alongside a reminder", () => {
  // The offer is the whole point of D2's backfill: it must reach the chat channel,
  // not just the CLI-only systemMessage that Desktop drops on the floor.
  const out = buildUniverseHookOutput({
    nudge: "Active universe: 'acme' (of 2: default, acme).",
    offer: "Your brain does not know your context yet.",
  });

  assert.match(out.hookSpecificOutput.additionalContext, /does not know your context yet/);
  assert.match(out.hookSpecificOutput.additionalContext, /Active universe: 'acme'/);
});

test("buildUniverseHookOutput returns an envelope for a lone offer (no reminder, no digest)", () => {
  // The commonest backfill case by far: a single-universe brain with no profile.
  // If only the nudge/digest opened the envelope, that owner would never be asked.
  const out = buildUniverseHookOutput({ offer: "Your brain does not know your context yet." });

  assert.match(out.hookSpecificOutput.additionalContext, /does not know your context yet/);
});

test("buildUniverseHookOutput keeps the whole startup payload short — volume IS the defect (F5)", () => {
  // The CLI echoes additionalContext VERBATIM, prefixed `SessionStart:startup says:`,
  // before the owner has typed a word. What triggered this fix was that screen: eight
  // lines of English protocol on a product sold to non-developers. So bound what WE
  // author. The digest is excluded on purpose — it is the owner's own prose, and its
  // length is theirs, not ours.
  const payload = buildUniverseHookOutput({
    nudge: universeReminder({ registry: ["acme", "blue"], active: "acme" }),
    offer: profileCaptureOffer({ hasProfile: false, declined: false, multiverse: true }),
  }).hookSpecificOutput.additionalContext;

  // Two blocks, each a fact plus one sentence of direction — about 190 chars apiece.
  assert.ok(
    payload.length <= 380,
    `the startup payload grew back to ${payload.length} chars:\n${payload}`,
  );
});

test("buildUniverseHookOutput frames the digest in one line, not a paragraph (F5)", () => {
  // Same echo, same bound, applied to the block we wrap the owner's profile in. The
  // digest itself is theirs; everything we add around it is startup noise they read.
  const digest = "Acme Corp (employer) — your role: Head of Engineering.\nPeople: Zoe (CTO).";
  const payload = buildUniverseHookOutput({ digest }).hookSpecificOutput.additionalContext;
  const framing = payload.length - digest.length;

  assert.ok(framing <= 180, `the digest framing grew back to ${framing} chars:\n${payload}`);
});

test("buildUniverseHookOutput carries the reminder AND the digest when both apply", () => {
  const out = buildUniverseHookOutput({
    nudge: "Active universe: 'acme' (of 2: default, acme).",
    digest: "Acme Corp (employer).",
  });

  assert.match(out.hookSpecificOutput.additionalContext, /Active universe: 'acme'/);
  assert.match(out.hookSpecificOutput.additionalContext, /Acme Corp \(employer\)\./);
});

test("buildUniverseHookOutput rides additionalContext (chat) and keeps systemMessage (CLI)", () => {
  const out = buildUniverseHookOutput({ nudge: "Active universe: 'acme' (of 2: default, acme)." });

  assert.equal(out.hookSpecificOutput.hookEventName, "SessionStart");
  // The chat channel embeds the fact AND instructs the agent to relay it.
  assert.match(out.hookSpecificOutput.additionalContext, /Active universe: 'acme'/);
  assert.match(out.hookSpecificOutput.additionalContext, /all universes/);
  assert.match(out.hookSpecificOutput.additionalContext, /switch/);
  // The CLI channel carries the raw fact.
  assert.equal(out.systemMessage, "Active universe: 'acme' (of 2: default, acme).");
});
