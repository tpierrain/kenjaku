// ─────────────────────────────────────────────────────────────────────────────
// engine-divergence-nudge.mjs — what the SESSION says about the files the engine
// is holding back (plan S4-4a).
//
// S4-2 answers WHICH files and SINCE WHEN; S4-3 says it inside the update report,
// while an update is running. This module says the same fact AT REST, which is the
// half the field finding was actually about: a brain frozen since install never
// runs an update report at all, so the one moment the truth was spoken was the one
// moment it could not be heard.
//
// Two rules shape every sentence below, and both are decisions, not style:
//
//   • STATE, NEVER NAG. A held-back file is a legitimate steady state an owner may
//     keep for years. The alarm voice belongs to `session-health.mjs` (breakage);
//     mixing the two is the failure `session-obsidian-hint.mjs` was split out to
//     avoid.
//   • ONE LINE, ONE FILE NAMED, THE COUNT EXACT. ⚠️ This one was written wrong first
//     and a guard caught it. The draft listed five files on five lines, reasoning
//     that `additionalContext` only ever talks to the AGENT, which then chooses its
//     moment. It does not: F5 measured that the CLI echoes it VERBATIM to the owner,
//     prefixed `SessionStart:startup says:`, before they have typed a word. So the
//     draft was a ~990-character banner of file paths at every session start — the
//     exact nagging the rule above forbids, arriving through the channel that looked
//     innocent. Hence: one sentence, the first file named with its clause, the rest
//     a number. The full list is already free in the update report.
//
// The per-file clauses MOVED here from `update-engine.mjs`, where they were
// private: two surfaces saying the same thing in two files is a divergence waiting
// to happen, and the sentence an owner reads must not depend on which door it came
// through.
// ─────────────────────────────────────────────────────────────────────────────
import { isAnswered } from "./engine-answers.mjs";

// One clause per verdict of `engineDivergence`. `no-provenance` takes no argument on
// purpose: it is the verdict that can prove nothing, so it may not say "yours" — the
// false claim that once sent an owner diffing a file nobody had edited.
export const DIVERGENCE_LINE = {
  customized: (since) =>
    since === null
      ? `yours; no record of which engine version it came from`
      : `yours; the engine last delivered here at ${since}`,
  "no-provenance": () => `left as-is; no record of what the engine delivered there`,
};

// The calm verdict, load-bearing rather than decorative: a list with nothing under it
// reads as a list of problems. It says "a file", not "your file" — one of the two
// reasons above is precisely that we cannot tell whose it is.
export const DIVERGENCE_CLOSING = "Nothing to do: a file the engine leaves alone is a choice, not a problem.";

// The nudge, or null when there is nothing to say. Pure: the divergence list is S4-2's
// (already sorted by path), and `ref` is the version the brain runs — a fact about the
// BRAIN, deliberately kept apart from each file's `since`. Filling an unknown `since`
// from it is the exact confusion `baseRefs` was added to end.
//
// 🚨 S10-3 — THE SUBTRACTION IS THIS FUNCTION'S, NOT THE CALLER'S, and that is a decision.
// This is the one surface that speaks UNBIDDEN, at every session start, so it is the only
// place consent fatigue can be built. A file the owner has already been asked about and
// settled must stop being raised — and if the filter lived in the caller, a second caller
// would reinstate the nag by simply not knowing about it.
//
// `answers` defaults to "nothing answered" because that is the literal state of the whole
// fleet and of every brain until the brain-side skill writes one — not a fallback covering
// a caller that forgot. What a forgetful caller would break is the WIRING, and the wiring
// is pinned where it lives (`session-engine-divergence.test.mjs`).
//
// The subtraction is keyed by the ref the answer was GIVEN at, so a new engine version
// re-opens every question by construction: `engine-answers.mjs` carries the why.
export function engineDivergenceNudge({ divergence, ref, answers = {} }) {
  const open = divergence.filter(({ rel }) => !isAnswered({ answers, rel, ref }));
  if (open.length === 0) return null;
  const count = open.length;
  const subject = ref === null ? `This brain records no engine version` : `This brain runs ${ref}`;
  // The first by path, not the "most important" one: there is no such ranking, and
  // inventing one would be a claim about the owner's intent we have no way to make.
  const [{ rel, reason, since }] = open;
  const rest = count - 1;
  return (
    `⚙️ ${subject}, and the engine is leaving ${count} file${count > 1 ? "s" : ""} alone` +
    ` — ${rel} (${DIVERGENCE_LINE[reason](since)})` +
    `${rest > 0 ? `, and ${rest} more` : ""}.` +
    ` ${DIVERGENCE_CLOSING}`
  );
}

// Wrap it into the SessionStart hook output, or null when nothing is emitted at all.
// Mirrors `buildWikiHealthHookOutput`: `additionalContext` is the ONLY Desktop-visible
// channel (the agent relays it into the chat), `systemMessage` is kept for the CLI and
// dropped harmlessly by Desktop's Code tab.
//
// The directive is where "state, never nag" is enforced: the agent is given the three
// moments the fact is worth saying, plus the one thing it must not do — offer to fix a
// divergence that is the owner's own choice. It is one sentence because it is echoed
// verbatim, and its length is asserted (F5).
export function buildEngineDivergenceHookOutput(nudge) {
  if (!nudge) return null;
  return {
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext:
        `[engine-divergence] A standing fact about this brain, not an alert. ${nudge} ` +
        `Mention it only if they ask about their engine version, an update, or why a skill behaves ` +
        `as it does — never open a session with it, and never offer to "fix" it.`,
    },
    // A SIBLING of `hookSpecificOutput`, never a key inside it — the client reads it at
    // the top level. Nested, it is a CLI channel that emits nothing while the JSON stays
    // perfectly valid, which is the quietest way there is to ship half a surface.
    systemMessage: nudge,
  };
}
