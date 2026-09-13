// ─────────────────────────────────────────────────────────────────────────────
// wiki-health-nudge.mjs — the pure, I/O-free core of Track F (ADR 0009 rung 1).
// Given the two STRUCTURED reports (lintVault's + consolidationCandidates'), it
// builds the compact SessionStart chat nudge — or null when nothing actionable.
//
// It surfaces ONLY the self-clearing / true-regression signals: notes the engine
// cannot read (issue #81), consolidation candidates (stateless — they drop off
// once the page is refreshed) and dangling links (real breakage, always worth
// fixing). Orphans/stale/missing keys are a standing backlog on a real vault →
// they stay in the on-demand /lint, never at session start (the noise guardrail).
//
// 🧭 Why an unreadable note passes a guardrail that keeps every other frontmatter
// finding out: it is not untidiness, it is a note that LIES. The engine refuses it
// and keeps answering from its last good content, so the vault looks healthy while
// it is out of date — measured standing three weeks, its only trace one error line
// nobody reads. And it self-clears the instant the note is fixed, which is exactly
// the guardrail's own criterion.
// ─────────────────────────────────────────────────────────────────────────────
import { countOf } from "./plural.mjs";

// Build the Track-F nudge from the two structured reports, or null when there is
// nothing actionable to surface. Pure: no I/O, deterministic.
export function wikiHealthNudge({ lintReport, consolidationReport }) {
  const dangling = lintReport.danglingLinks.length;
  const unreadable = lintReport.unreadableNotes.length;
  const candidates = consolidationReport.newPages.length + consolidationReport.refreshes.length;
  if (dangling === 0 && candidates === 0 && unreadable === 0) return null;

  // Counts, and nothing else. This string IS the `systemMessage`, which the CLI prints
  // clean to the owner — so it must read as a fact about THEIR vault, never as the
  // instruction we hand the agent (F5: `(offer /consolidate)` was on their first screen).
  // The two command names live in the wrapper below, which already spells both out.
  // 🗣️ IN THE OWNER'S WORDS (ADR 0043, v5.4). It used to say "6 consolidation
  // candidates and 28 dangling links" — the scanner's two nouns, neither of which
  // names what it costs the person reading. And the count did not agree with its
  // noun ("1 consolidation candidates"), which `countOf` is here to stop.
  const parts = [];
  if (candidates > 0) parts.push(`${countOf(candidates, "recent note")} worth folding into your pages`);
  if (dangling > 0) parts.push(`${countOf(dangling, "link")} pointing at a note that does not exist`);
  const housekeeping = parts.join(" and ");
  if (unreadable === 0) return housekeeping;
  // First, and phrased by what it COSTS: "invalid frontmatter" means nothing to the
  // person whose answers quietly went stale. Comma-separated from the rest, so the
  // sentence does not read as one undifferentiated backlog.
  const lead =
    `${countOf(unreadable, "note")} the engine cannot read ` +
    `(${unreadable === 1 ? "it answers" : "they answer"} from stale content)`;
  return housekeeping ? `${lead}, ${housekeeping}` : lead;
}

// Wrap the nudge into the SessionStart hook output, or null when there's nothing
// to emit. Mirrors buildSelfHealHookOutput (session-self-heal.mjs): the ONLY
// Desktop-visible channel is the CHAT, and a SessionStart hook's
// `hookSpecificOutput.additionalContext` is injected into the agent's context, so
// the agent relays it into the chat. So the nudge rides additionalContext, phrased
// as a DIRECTIVE the agent surfaces to the user. `systemMessage` is kept too —
// dropped on Desktop (harmless), shown on the CLI.
export function buildWikiHealthHookOutput(nudge) {
  if (!nudge) return null;
  return {
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext:
        `[wiki-health] Pending: ${nudge}. Tell them once, in their language; offer ` +
        `/consolidate for the candidates, /lint for the rest. Optional, and every write ` +
        `stays confirmed.`,
    },
    systemMessage: nudge,
  };
}
