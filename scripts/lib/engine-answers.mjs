// ─────────────────────────────────────────────────────────────────────────────
// engine-answers.mjs — what the owner has already been ASKED about, and answered
// (plan S10-2).
//
// 🚨 WHY THIS IS THE ONLY NEW STATE S10 ADDS. The LIST of files the engine is holding
// back is DERIVED from the disk by `engineDivergence` and cannot go stale; storing it
// would be a second copy of a fact the disk already answers. What the disk cannot
// derive is that the owner has already been asked about a file and said *keep mine* —
// and without that, the question repeats at every session, which is the consent fatigue
// the whole feature exists to avoid.
//
// 🔑 THE KEY IS THE ENGINE VERSION, and that one choice replaces a rule. A new version
// means a new candidate, so an answer given against the old one no longer covers it and
// the file is raised once more — "raised once per release" with no timer and nothing to
// tune. It also answers the plan's open question *"what if they never answer?"*: their
// file stays theirs, and the calm divergence nudge goes on stating it, which is already
// the accepted steady state (`engine-divergence-nudge.mjs`: *"a file the engine leaves
// alone is a choice, not a problem"*).
//
// 🧭 IT FAILS TOWARD ASKING. Unreadable file, malformed JSON, an entry with no version:
// all count as NOT answered. Re-asking is a mild annoyance; silently swallowing the
// question is the exact defect being removed, so every doubtful case falls on the side
// that still speaks.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// The single file. Named once, here, so no caller can grow a second convention — the
// same discipline `BASE_PREFIX` follows one module over. It sits beside `.engine-base/`
// at the brain root: engine-written, swept into the repo by `git add -A`, and therefore
// carried to the owner's other machine, where they may well be the one answering.
export const ANSWERS_REL = ".engine-answers.json";

// An answer IS its version stamp: no readable `at`, no answer. Everything else a hand
// edit can leave behind — `null`, a bare string, a number, an entry with no `at`, an
// empty `at` — falls out of this one condition rather than needing a guard of its own.
const isEntry = (entry) => typeof entry?.at === "string" && entry.at.length > 0;

// PURE. `null` is the only parse result that cannot be walked at all (`Object.entries`
// throws on it); a primitive or an array simply yields no entry that `isEntry` accepts,
// so they need no guard of their own — measured, not assumed (mutation, S10-2).
export function parseAnswers(content) {
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    return {};
  }
  if (parsed === null) return {};
  // A malformed entry drops on its own and takes nothing with it: one bad line in a file
  // that travels between machines must not re-open every question the owner has settled.
  return Object.fromEntries(Object.entries(parsed).filter(([, entry]) => isEntry(entry)));
}

// 🛑 THE STAMP FOR A BRAIN THAT CANNOT NAME ITS ENGINE VERSION — found by S10-QA on the
// real `v3.6.0` tree, whose manifest carries no `source` at all. That is not an edge
// case: it is what the pre-v4 fleet looks like, and it is the cohort this release is for.
//
// Without it, `recordAnswer` wrote `"at": null`, which `isEntry` above correctly refuses
// on the way back in — so the answer was SAVED AND SILENTLY LOST, and the owner would
// have been asked the same question at every session forever. That is brick 5's consent
// fatigue, manufactured by the very file that exists to prevent it.
//
// It is a SENTENCE, not `null` and not `""`, for two reasons: this file is meant to be
// opened by a human, and the reader's refusal of `""`/missing must stay intact, because
// those are corruption. "This brain cannot name its version" is a state, not corruption,
// and a state deserves a stamp that reads back. No tag can ever collide with it.
export const UNKNOWN_REF = "engine-version-unknown";

// The ONE place null/"" becomes that stamp. Both the writer and the reader route through
// it, so a caller cannot open a second "unknown" era by passing the other spelling — and
// so the rule can never be half-applied on one side of the comparison.
const stampOf = (ref) => (typeof ref === "string" && ref !== "" ? ref : UNKNOWN_REF);

export function isAnswered({ answers, rel, ref }) {
  return answers[rel]?.at === stampOf(ref);
}

// Returns a NEW map. The caller reads once and writes once, and a function that edited
// its argument in place would make "what was on disk" and "what we are about to write"
// the same object — which is the one difference worth having when this goes wrong.
export function recordAnswer({ answers, rel, decision, ref }) {
  return { ...answers, [rel]: { decision, at: stampOf(ref) } };
}

// Order is the caller's, deliberately: the report and the nudge each sort for their own
// reasons, and a second opinion here would quietly fight them.
export function unansweredRels({ rels, answers, ref }) {
  return rels.filter((rel) => !isAnswered({ answers, rel, ref }));
}

// A brain that has never answered anything has no file, and that is not an error: the
// read throws and lands in the same `catch` as an unreadable one. Both mean the same
// thing to the caller — nothing is answered, so ask.
export function readAnswers({ brainDir }) {
  try {
    return parseAnswers(readFileSync(join(brainDir, ANSWERS_REL), "utf8"));
  } catch {
    return {};
  }
}

// Indented and newline-terminated because this file is VERSIONED and lands in diffs on
// the way to the other machine: one answer per line reviews, one long line does not.
export function writeAnswers({ brainDir, answers }) {
  writeFileSync(join(brainDir, ANSWERS_REL), `${JSON.stringify(answers, null, 2)}\n`);
}
