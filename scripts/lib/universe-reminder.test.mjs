import { test } from "node:test";
import assert from "node:assert/strict";
import {
  universeReminder,
  buildUniverseHookOutput,
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
