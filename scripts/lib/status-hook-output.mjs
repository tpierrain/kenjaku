// ─────────────────────────────────────────────────────────────────────────────
// status-hook-output.mjs — the pure emission seam of the SessionStart status
// banner (repo / RAG / key / bootstrap / restart), plus the engine version.
//
// TWO CHANNELS, because they reach two different halves of the users (ADR 0036's
// channel matrix):
//   • `systemMessage` — rendered directly by the CLI terminal, and DROPPED by the
//     Code tab of Claude Desktop. Every status line this banner has ever printed
//     has therefore been CLI-only.
//   • `hookSpecificOutput.additionalContext` — injected into the agent's context,
//     so the agent relays it in the chat: the ONLY Desktop-visible channel.
// The version rides both, because "which version am I running" is a question a
// Desktop owner asks just as often. The other status lines keep their CLI-only
// reach on purpose: repo/RAG chatter in every first message is noise, a version
// stated once is an identity.
//
// No version (a brain that cannot say which release it came from) → the key is
// ABSENT rather than empty: an additionalContext saying "[engine] null" would be
// relayed to the owner as fact. Silence is the honest rendering here.
//
// `leadLine` is the restart nudge, and it outranks the version for a documented
// reason (ADR 0036): until the owner restarts, nothing they read comes from the
// engine they now have — the manifest already names the NEW version while the OLD
// code is still answering. So a pending restart both demotes the version on the
// CLI and silences its chat relay entirely, since additionalContext would carry
// that claim to Desktop with no restart line beside it to qualify it.
// ─────────────────────────────────────────────────────────────────────────────

export function buildStatusHookOutput({ leadLine = null, versionLine = null, statusLines = [] } = {}) {
  const hookSpecificOutput = { hookEventName: "SessionStart" };
  if (versionLine && !leadLine) {
    hookSpecificOutput.additionalContext =
      `[engine] ${versionLine} — state this version once, verbatim, in your first message.`;
  }
  return {
    hookSpecificOutput,
    systemMessage: [leadLine, versionLine, ...statusLines].filter(Boolean).join("\n"),
  };
}
