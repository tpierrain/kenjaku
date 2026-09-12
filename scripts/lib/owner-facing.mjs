// ─────────────────────────────────────────────────────────────────────────────
// owner-facing.mjs — the two mechanically decidable halves of ADR 0043's second
// decision: a string a human reads is written for a human.
//
// The doctrine has two halves and only one of them can be checked by a machine:
//
//   • WHO IT IS FOR — `directiveTraces`. A payload written for the MODEL must not
//     reach the owner's screen. That is decidable because the markers are literals
//     WE write: a bracketed routing tag, a command line, a third-person reference
//     to the owner, an all-caps instruction.
//   • WHAT WORDS IT USES — `jargonTraces`. The machinery's vocabulary in a sentence
//     a person reads. Decidable only as a word list, and only over literals.
//
// 🛑 WHAT THIS MODULE CANNOT DO, stated here so nobody trusts it for it (the
// `locale-drift.mjs` habit of a guard declaring its own blindness):
//
//   1. It sees LITERALS ONLY — strings this engine prints. It can say nothing
//      about a sentence the model composes at runtime, which is most of what an
//      owner actually reads. ADR 0043 is explicit that no guard can judge that
//      half, and this module does not pretend to.
//   2. It cannot tell whether the replacement is any CLEARER. Swapping `orphan`
//      for `unlinked node` passes and is no better. The word list catches the
//      vocabulary we already know is wrong; plain language stays a writing
//      convention.
//   3. It judges a string, never a channel. Whether that string was routed to the
//      owner is the caller's question — each emitter's own test answers it.
// ─────────────────────────────────────────────────────────────────────────────

// Phrases that can only be an instruction to the model, never a fact about the
// owner's brain. Each one is a literal this engine writes, which is what makes the
// check honest: it is not parsing English, it is looking for its own fingerprints.
//
// Deliberately NOT here: a bare `they` / `them` / `their`. A perfectly good sentence
// for the owner says "2 notes the engine cannot read (they answer from stale
// content)" — the pronoun is about the notes. Only the phrases that place the OWNER
// in the third person are markers, because that is the tell of a sentence written
// about them rather than to them.
const DIRECTIVE_PHRASES = [
  // Bare, and matched on word boundaries, because the live payload says "this
  // OWNER's context" rather than "the owner" — a phrase list that only knew the
  // article would have passed the very string it was written for. A sentence to a
  // person calls them "you"; one that calls them "the owner" is about them.
  "owner",
  "user",
  "their language",
  "tell them",
  "ask them",
  "offer once",
  "offer to",
  "say so once",
  "say it once",
  "do not recite",
  "use it silently",
  "silent background",
  "in one line",
  "verbatim",
];

// An all-caps word is how this engine shouts at the model. A human-facing sentence
// has no reason to, and every occurrence measured in the payloads was a directive.
// Two letters minimum so an acronym the owner legitimately reads (RAG, MCP, CLI)
// does not trip it — those are in the allow-list below rather than excluded by
// length, because the distinction is meaning, not size.
const SHOUTED = /\b[A-Z]{2,}\b/g;

// Capitalised words a sentence to the owner may legitimately contain. They name
// things the owner has (their search engine, their tools), not orders to the model.
const SHOUTING_ALLOWED = new Set([
  "RAG",
  "MCP",
  "CLI",
  "API",
  "YAML",
  "URL",
  "OK",
  "ID",
  "AI",
  "PR",
  "UTC",
]);

// A command line is the single most unmistakable directive marker: an owner is never
// asked to run one from a status banner, and every one measured sat inside a payload
// telling the model how to record an answer.
const COMMAND_LINE = /\bnode\s+(scripts|rag)\//;

// A bracketed routing tag opening a line — `[wiki-health]`, `[universe]`,
// `[onboarding]` — is addressing whoever dispatches the payload, not whoever reads it.
const ROUTING_TAG = /^\s*\[[^\]\n]+\]/m;

// 🛑 A FILENAME IS NOT SHOUTING, and this carve-out was earned rather than foreseen:
// the very first real payload the shout rule met was the engine-divergence line, which
// names `.claude/skills/coach/SKILL.md` — and `SKILL` read as an order to the model.
// A guard that is wrong about a legitimate string is a guard someone switches off
// (CONVENTIONS §5quater: judge a checker on its FALSE POSITIVES).
//
// A token is path-like when it holds a `/` or an extension — a dot followed by two to
// five LETTERS. Requiring letters is what keeps a sentence-final full stop out of it:
// blanking "changes." would erase the last word of every sentence, including the
// shouted ones this rule exists for.
const PATH_LIKE = /\S*(?:\/|\.[a-z]{2,5}\b)\S*/g;

/**
 * Every trace of an instruction-to-the-model found in `text`, as plain strings a
 * failing test can print. Empty means the string reads as written for a human.
 *
 * Order is source order within each family, and families in the order above, so a
 * failure message is stable enough to assert on.
 */
export function directiveTraces(text) {
  if (typeof text !== "string" || text === "") return [];
  const traces = [];
  for (const phrase of DIRECTIVE_PHRASES) {
    // Word boundaries, so `user` does not fire on `username` and `owner` does fire
    // on `owner's`. A plain substring test gets exactly one of those two right.
    if (new RegExp(`\\b${phrase}\\b`, "i").test(text)) traces.push(`phrase: ${phrase}`);
  }
  if (ROUTING_TAG.test(text)) traces.push("routing tag");
  if (COMMAND_LINE.test(text)) traces.push("command line");
  const prose = text.replace(PATH_LIKE, " ");
  for (const shout of prose.match(SHOUTED) ?? []) {
    if (!SHOUTING_ALLOWED.has(shout)) traces.push(`shouted: ${shout}`);
  }
  return traces;
}

/** True when `text` carries no trace of having been written for the model. */
export function isOwnerFacing(text) {
  return directiveTraces(text).length === 0;
}

// The machinery's own vocabulary, from ADR 0043's list. A word here in a sentence a
// person reads names the mechanism instead of what it costs them.
//
// `link` is deliberately absent and `dangling` is present: a broken link is a thing
// an owner can picture, "dangling" is the scanner's word for it.
const JARGON = [
  "orphan",
  "frontmatter",
  "fan-out",
  "dangling",
  "idempotent",
  "reconcile",
  "chunk",
  "ledger",
  "append-only",
  "payload",
];

/**
 * Every machinery word found in `text`. The match is on a word boundary and
 * case-insensitive, so `Orphans` and `orphan` both count, and `orphanage` does not.
 */
export function jargonTraces(text) {
  if (typeof text !== "string" || text === "") return [];
  return JARGON.filter((word) => new RegExp(`\\b${word}s?\\b`, "i").test(text)).map(
    (word) => `jargon: ${word}`,
  );
}
