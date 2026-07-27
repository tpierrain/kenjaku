// ─────────────────────────────────────────────────────────────────────────────
// universe-reminder.mjs — the pure, I/O-free core of the SessionStart universe
// reminder (ADR 0034 Step 4). Given the committed registry and the active-universe
// pointer, it builds the compact chat nudge naming the active universe, or null
// when the progressive-disclosure gate is closed (a single-universe brain says
// nothing at all — exactly today's behaviour).
//
// Mirrors wiki-health-nudge.mjs: a pure nudge builder plus a hook-output wrapper.
// The ONLY Desktop-visible channel is the CHAT, and a SessionStart hook's
// `hookSpecificOutput.additionalContext` is injected into the agent's context, so
// the agent relays it into the chat; `systemMessage` is kept too (CLI-only).
// ─────────────────────────────────────────────────────────────────────────────
import { isMultiverse, listAllUniverses, DEFAULT_UNIVERSE } from "./universes.mjs";

/**
 * Builds the SessionStart reminder from the registry + active pointer, or null
 * when the gate is closed (fewer than two universes). Pure: no I/O, deterministic.
 */
export function universeReminder({ registry, active }) {
  if (!isMultiverse(registry)) return null;
  const current = active || DEFAULT_UNIVERSE;
  const all = listAllUniverses(registry);
  return `Active universe: '${current}' (of ${all.length}: ${all.join(", ")}).`;
}

/**
 * The one-line notice for a pointer this session just repaired: the universe it
 * named is gone (deleted or renamed on another machine, pulled in since), so the
 * scope fell back to the default. Pure; null when nothing was healed.
 *
 * Deliberately NOT behind the progressive-disclosure gate: a heal can only happen
 * on a brain that had a universe, so the word is not new to this owner, and a
 * search scope that changed under their feet must never pass in silence.
 */
export function pointerHealNotice({ healed, from, active }) {
  if (!healed) return null;
  return (
    `The universe '${from}' this machine was working in no longer exists ` +
    `(deleted or renamed elsewhere), so the scope is back to '${active}'.`
  );
}

/**
 * Wraps the nudge into the SessionStart hook output, or null when there is nothing
 * to emit. Mirrors buildWikiHealthHookOutput: the nudge rides `additionalContext`
 * (the only Desktop-visible channel), phrased as a DIRECTIVE the agent relays to
 * the user; `systemMessage` carries the raw fact (dropped on Desktop, shown on CLI).
 */
export function buildUniverseHookOutput({ nudge = null, digest = null } = {}) {
  if (!nudge && !digest) return null;
  const parts = [];
  if (nudge) {
    parts.push(
      `[universe] ${nudge} Early in your next reply, briefly and in the user's language, ` +
        `remind the user which universe is active and that searches stay scoped to it plus ` +
        `their cross-cutting (default) notes. They can say "search all universes" to span them, ` +
        `or /switch to change universe. Mention it once, do not nag.`,
    );
  }
  if (digest) {
    // Deliberately says nothing about universes: a single-universe brain can have a
    // profile (that IS the backfill case), and progressive disclosure means it must
    // not meet the word before it owns two of them. This block is about THEIR world.
    parts.push(
      `[working context]\n${digest}\n` +
        `That is background on the sphere this owner works in — their role, their people, ` +
        `the accounts their tools use. USE it silently when it helps (who someone is, which ` +
        `account to reach for); do not repeat it back to them and do not treat it as a task.`,
    );
  }
  return {
    hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: parts.join("\n\n") },
    systemMessage: [nudge, digest].filter(Boolean).join("\n"),
  };
}
