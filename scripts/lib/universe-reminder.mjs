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
 * The one skippable offer to describe the sphere the owner works in (D2), or null
 * when there is already a profile or the offer was declined. Says nothing about
 * universes: it reaches single-universe brains, which must not meet the machinery
 * before they own a second one (ADR 0034). Pure.
 *
 * THE TRIGGER, NOT THE DETAIL (F5, Thomas 2026-07-28). This text is echoed VERBATIM
 * to a CLI owner, prefixed `SessionStart:startup says:` — so it states the FACT and
 * stops. The seven questions, the write command and the decline command live in the
 * `switch` skill, which the agent loads when the user accepts *or* declines; naming
 * them here duplicated a document that gets read anyway, and was the bulk of the
 * eight lines of protocol an owner met before typing a word. Field-validated: given
 * the fact alone the agent composes a better offer, in the owner's language, at the
 * right moment — the upfront detail bought nothing.
 */
export function profileCaptureOffer({ hasProfile, declined, multiverse = false }) {
  if (hasProfile || declined) return null;
  // THE dichotomy (ADR 0034). Below the gate the machinery does not exist yet, so
  // the word would name a thing this owner has never met; past it, the word IS the
  // vocabulary they already switch with. The CORE decides which, because deciding
  // requires counting universes, and counting is not the LLM's job (ADR 0009).
  const vocabulary = multiverse
    ? "say `universe` plainly — the active one"
    : "never use the word `universe`: they have never met the notion, say their context";
  return (
    `No profile yet for this owner's context, and no refusal on file. Offer once, in ` +
    `their language, to describe it, and say plainly it is skippable (${vocabulary}).`
  );
}

/**
 * Wraps the nudge into the SessionStart hook output, or null when there is nothing
 * to emit. Mirrors buildWikiHealthHookOutput: the nudge rides `additionalContext`
 * (the only Desktop-visible channel), phrased as a DIRECTIVE the agent relays to
 * the user; `systemMessage` carries the raw fact (dropped on Desktop, shown on CLI).
 */
export function buildUniverseHookOutput({ nudge = null, digest = null, offer = null } = {}) {
  if (!nudge && !digest && !offer) return null;
  const parts = [];
  if (nudge) {
    parts.push(
      `[universe] ${nudge} Searches are scoped to it plus their cross-cutting notes; ` +
        `"search all universes" spans them, /switch changes it. Say so once, in their language.`,
    );
  }
  if (digest) {
    // Deliberately says nothing about universes: a single-universe brain can have a
    // profile (that IS the backfill case), and progressive disclosure means it must
    // not meet the word before it owns two of them. This block is about THEIR world.
    parts.push(
      `[working context]\n${digest}\n` +
        `Background on this owner's world — use it silently when it helps; do not repeat it ` +
        `back to them, and do not treat it as a task.`,
    );
  }
  if (offer) parts.push(`[onboarding] ${offer}`);
  return {
    hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: parts.join("\n\n") },
    systemMessage: [nudge, digest, offer].filter(Boolean).join("\n"),
  };
}
