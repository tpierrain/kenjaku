// ─────────────────────────────────────────────────────────────────────────────
// wiki-health-nudge.mjs — the pure, I/O-free core of Track F (ADR 0009 rung 1).
// Given the two STRUCTURED reports (lintVault's + consolidationCandidates'), it
// builds the compact SessionStart chat nudge — or null when nothing actionable.
//
// It surfaces ONLY the self-clearing / true-regression signals: consolidation
// candidates (stateless — they drop off once the page is refreshed) and dangling
// links (real breakage, always worth fixing). Orphans/stale/frontmatter are a
// standing backlog on a real vault → they stay in the on-demand /lint, never at
// session start (the noise guardrail).
// ─────────────────────────────────────────────────────────────────────────────

// Build the Track-F nudge from the two structured reports, or null when there is
// nothing actionable to surface. Pure: no I/O, deterministic.
export function wikiHealthNudge({ lintReport, consolidationReport }) {
  const dangling = lintReport.danglingLinks.length;
  const candidates = consolidationReport.newPages.length + consolidationReport.refreshes.length;
  if (dangling === 0 && candidates === 0) return null;

  // Counts, and nothing else. This string IS the `systemMessage`, which the CLI prints
  // clean to the owner — so it must read as a fact about THEIR vault, never as the
  // instruction we hand the agent (F5: `(offer /consolidate)` was on their first screen).
  // The two command names live in the wrapper below, which already spells both out.
  const parts = [];
  if (candidates > 0) parts.push(`${candidates} consolidation candidates`);
  if (dangling > 0) parts.push(`${dangling} dangling links`);
  return parts.join(" and ");
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
        `[wiki-health] Pending housekeeping: ${nudge}. Tell them once, in their language, and ` +
        `offer to run it: /consolidate promotes raw captures into entity/topic pages, /lint gives ` +
        `the full report. Optional, and every write stays confirmed — never auto-file.`,
    },
    systemMessage: nudge,
  };
}
