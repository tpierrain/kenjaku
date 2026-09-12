// ─────────────────────────────────────────────────────────────────────────────
// batched-announcement.mjs — the 🟡 tier of ADR 0043, built ONCE.
//
// "Announce, then act unless vetoed" is what the doctrine calls the whole cure:
// five prompts answered one by one is five interruptions, the same five announced
// in one message is one. Before this module there was no shared way to say it, so
// every skill that needed one would have invented its own — and five inventions of
// one rule is precisely the drift the ADR exists against.
//
// Deterministic (ADR 0009 rung 1): pure functions over a list of gestures. The core
// composes the sentence, the skill relays it, exactly like `nativeConnectorsReminder`
// and `conversationResidueReminder` in `universes.mjs`.
//
// A gesture is `{ what, count, committed }`:
//   • `what`      — the gesture in the owner's words, ready to read out. The caller
//                   owns this string, because only the caller knows what it costs
//                   the owner; `owner-facing.mjs` is what keeps it honest.
//   • `count`     — how many things it touches, for the caller's own wording.
//   • `committed` — whether what it writes lands in a commit. See below.
// ─────────────────────────────────────────────────────────────────────────────
import { agreeing } from "./plural.mjs";

/**
 * Split the gestures into the ones that may be announced and acted on, and the ones
 * that must still be asked.
 *
 * 🛑 THE NET IS WHAT BUYS THE TIER (ADR 0043 §3). A 🟡 is acceptable only because it
 * is one `git revert` away, in the owner's own history. A write that escapes
 * auto-commit has no such net, so announcing it and proceeding would be autonomy
 * bought on credit — it goes back to the caller as something to ask about, rather
 * than being silently dropped, because dropping it would lose the gesture entirely.
 */
export function planBatch(gestures = []) {
  const announce = [];
  const ask = [];
  for (const gesture of gestures) {
    (gesture.committed ? announce : ask).push(gesture);
  }
  return { announce, ask };
}

/**
 * The one sentence that replaces the cascade, or null when there is nothing to say —
 * silence stays silence, and a skill with nothing to announce must be byte-identical
 * to one that never called this.
 *
 * The shape is the owner's own, asked for in July: **the count first, then the
 * detail.** The count is what decides whether he reads any further.
 *
 * And the closing line is the tier itself, which is why it is pinned by a test in
 * both directions: it says silence proceeds, and it asks nothing. An announcement
 * that waits for a yes is a confirmation dialog wearing a new name.
 */
export function batchMessage(announce = []) {
  if (announce.length === 0) return null;
  const things = `${announce.length} ${agreeing(announce.length, "thing")}`;
  const list = announce.map((gesture) => gesture.what).join("; ");
  return `I'm about to do ${things}: ${list}. Say stop if you'd rather I didn't — otherwise I'll go ahead.`;
}
