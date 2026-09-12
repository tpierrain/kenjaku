// ─────────────────────────────────────────────────────────────────────────────
// update-offer.mjs — the memory that turns "an update is available" into an OFFER
// THAT COMES BACK (#100).
//
// Everything upstream of this file already worked: a detached probe asks once a
// day, `upstream-cache.mjs` keeps the four states apart — available / up to date /
// could not find out / checking — and `/update-engine --check` quotes each
// release's own `What you get`. What was missing is that the answer only ever
// reached the owner as a LINE at the top of a session, and on Desktop not even
// that (ADR 0036's matrix). A line is something you scroll past, so a fleet whose
// every machine knew better sat several releases behind.
//
// So the verdict becomes a question, on the one channel that repeats and that
// Desktop receives (`UserPromptSubmit`), and this module holds the two halves that
// question needs: WHEN it may be raised, and WHAT it says.
//
// 🛑 Two rules govern the whole file, and both are the owner's:
//
//   • "REMIND ME LATER" IS THE FLOOR, AND THE HOOK STAMPS IT ITSELF the moment it
//     speaks — before any answer exists, and whether or not one ever arrives. An
//     owner who answers nothing, a host that refuses to run the recording command,
//     a conversation abandoned mid-question: all of them land on "ask again
//     tomorrow", which is exactly what "remind me later" means. That is why no
//     path through this file can produce a nag, and why the recording command
//     below is an improvement on the floor rather than a load-bearing part.
//   • A REFUSAL IS ABOUT A VERSION, NEVER ABOUT UPDATING. "No thanks" walks a
//     ladder (+3 days, +5 days, +3 weeks, +2 months, then silence for that
//     version) and a newly published release resets it: someone who declined v5.3
//     has said nothing whatsoever about v5.4.
//
// Every decision here is PURE, and the two disk gestures at the bottom are the
// exception that proves it: they are here because TWO callers need them — the hook
// that speaks and stamps, and the CLI that records an answer — and neither may
// import the other, two top-level scripts importing each other being the
// cross-version trap `remote-arrivals.mjs` documents. Same split, same reason.
// ─────────────────────────────────────────────────────────────────────────────
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { countOf } from "./plural.mjs";
import { UPDATE_DURATION_SENTENCE } from "./update-duration.mjs";

/**
 * Beside the verdict it answers, under `.cache/`, which every brain gitignores:
 * one laptop's "no thanks" is not the other's, and committing an answer would
 * carry a refusal given on a machine into a machine that never asked.
 */
export const OFFER_STATE_REL = join(".cache", "engine-update-offer.json");

const DAY = 24 * 60 * 60 * 1000;

/** The floor, and the only rung "remind me later" ever uses. Repeatable for ever. */
export const REMIND_LATER_MS = DAY;

/**
 * The ladder a refusal walks, as the owner specified it: +3 days, +5 days,
 * +3 weeks, +2 months. Past the last rung, that version is never raised again.
 * Widening it apart is deliberate — someone who says no twice is answering about
 * this release, someone who says no four times is answering about being asked.
 */
export const DECLINE_LADDER_MS = [3 * DAY, 5 * DAY, 21 * DAY, 60 * DAY];

/** The whole quote budget for the release's own words, before the rest is cut away. */
const QUOTE_MAX = 420;

/**
 * May this verdict be raised right now?
 *
 * Only `available` is ever an offer. "Could not find out" must never render as
 * anything an owner could act on — that separation is the reason `upstream-cache`
 * keeps four states instead of two, and blurring it here would undo it at the one
 * surface an owner actually reads.
 *
 * A record that cannot be understood reads as "nothing asked yet". It is the same
 * fail-soft discipline as the verdict beside it: the damaged case costs at most
 * one extra question, and may never be the reason an owner is never asked at all.
 * Silence is therefore EXPLICIT (`silenced`), never inferred from a missing field.
 */
export function offerDue({ verdict, state, now }) {
  const version = offerableVersion(verdict);
  if (version === null) return false;
  if (state?.version !== version) return true; // a newer release resets everything
  if (state.silenced === true) return false;
  const due = Date.parse(state.nextAskAt ?? "");
  return Number.isNaN(due) ? true : now >= due;
}

/** The version an offer would be about, or null when this verdict is not one. */
function offerableVersion(verdict) {
  if (verdict?.state !== "available") return null;
  return typeof verdict.target === "string" && verdict.target !== "" ? verdict.target : null;
}

/**
 * The record to write the moment the offer is SPOKEN — not when it is answered.
 * This is the floor described at the top of the file: it is written by the hook
 * itself, so the worst case is being asked once a day.
 *
 * A ladder already walked for this same version survives, or a refusal would be
 * cancelled by the very next question it was supposed to postpone.
 */
export function afterAsked({ state, version, now }) {
  const walked = state?.version === version ? (state.declines ?? 0) : 0;
  return { version, declines: walked, nextAskAt: new Date(now + REMIND_LATER_MS).toISOString(), silenced: false };
}

/**
 * The record for an answer the owner actually gave.
 *
 * Only `no-thanks` moves the ladder. Everything else — "later", "install", and
 * anything unrecognised a future caller might hand in — lands on the floor: a day.
 * An unknown answer resolving to silence is the one failure mode that would be
 * invisible, so the default is the loud, harmless one.
 *
 * `install` buys a day as well, which is not a detail: the update runs for a
 * minute or several, and every prompt typed while it runs would otherwise meet
 * the offer again.
 */
export function afterAnswer({ state, version, answer, now }) {
  if (answer !== "no-thanks") return afterAsked({ state, version, now });

  const declines = (state?.version === version ? (state.declines ?? 0) : 0) + 1;
  const wait = DECLINE_LADDER_MS[declines - 1];
  return wait === undefined
    ? { version, declines, nextAskAt: null, silenced: true }
    : { version, declines, nextAskAt: new Date(now + wait).toISOString(), silenced: false };
}

/**
 * The offer itself, or null when there is nothing to raise — and null must stay
 * the overwhelmingly common answer: this rides in front of a prompt the owner is
 * waiting on.
 *
 * 🗣️ IT ADDRESSES CLAUDE, NEVER THE HUMAN, like every other directive on this
 * channel. The sentence the owner reads is Claude's own, in the owner's language,
 * in the flow of the reply — a hook that wrote the human's sentence would speak
 * English into a French conversation, in identical words, every single time.
 *
 * 🔴 in ADR 0043's tiers: running an update is not cheaply undoable, so it is
 * genuinely asked — and asked with the host's question CONTROL rather than with a
 * line of prose, which is #98's lesson paid for in the field. The release's own
 * words are quoted rather than summarised, for the same reason `--check` quotes
 * them: a paraphrase of what an owner is being asked to install is the machinery
 * deciding what matters to them.
 */
export function updateOfferDirective({ verdict, state, now }) {
  if (!offerDue({ verdict, state, now })) return null;

  const version = verdict.target;
  const behind = verdict.ahead > 1 ? `, which is ${countOf(verdict.ahead, "release")} on from the one running here` : "";
  const notes = quoteWhatYouGet(verdict, version);

  return (
    `📦 A newer engine is available for this brain: ${version}${behind}. Tell the owner in their own ` +
    `language, calmly — their brain works, this is an offer, not a problem.\n\n` +
    `${notes}\n\n` +
    `${UPDATE_DURATION_SENTENCE}\n\n` +
    `Then ASK, with the host's question control (AskUserQuestion) so the question cannot be scrolled ` +
    `past: "Install now" · "Remind me later" · "No thanks". Where no such control exists, ask the same ` +
    `three in prose. On "Install now", load the update-engine skill and follow it. On "Remind me later", ` +
    `run \`node scripts/update-offer-answer.mjs later\`. On "No thanks", run ` +
    `\`node scripts/update-offer-answer.mjs no-thanks\` — without it nothing remembers the answer. ` +
    `Unanswered means nothing runs, and the offer comes back tomorrow.`
  );
}

/**
 * The release's own `What you get`, quoted and bounded — and what to do when there
 * is none to quote.
 *
 * What gives way when it overflows is the TAIL of the quote, never the sentence
 * around it, and the cut is announced with the one command that fetches the whole
 * thing live. A cut is honest; a summary would not be, because it would be the
 * machinery choosing which half of a release an owner gets to weigh.
 */
function quoteWhatYouGet(verdict, version) {
  const release = (verdict.releases ?? []).find((entry) => entry?.version === version);
  const body = typeof release?.whatYouGet === "string" ? release.whatYouGet.trim() : "";
  const full = "Its full notes: `/update-engine --check`.";
  if (body === "") {
    // The notes could not be read (a fork with no releases endpoint, a network
    // hiccup, a release published without the section). Offer it anyway, and
    // invent nothing: a release described in words nobody published is worse than
    // a release described in none.
    return `This brain could not read that release's notes, so nothing here describes it. ${full}`;
  }
  const quoted = body.length <= QUOTE_MAX ? body : `${cutAtLine(body, QUOTE_MAX)}\n…`;
  const where = body.length <= QUOTE_MAX ? "" : ` ${full}`;
  return `What the release itself says it brings, quoted and not paraphrased:\n${quoted}${where}`;
}

/** The longest whole-line prefix that fits, so a quote never stops mid-word. */
function cutAtLine(body, budget) {
  const lines = body.split("\n");
  const kept = [];
  let size = 0;
  for (const line of lines) {
    if (size + line.length + 1 > budget) break;
    kept.push(line);
    size += line.length + 1;
  }
  return kept.length > 0 ? kept.join("\n") : body.slice(0, budget);
}

/**
 * What this machine last answered, or null — and null is what EVERY unreadable
 * shape resolves to: absent, empty, truncated mid-write, or valid JSON that is not
 * an object. Null means "nothing asked yet", so the worst a damaged record can do
 * is cost one extra question. The opposite default — treating damage as an
 * answer — would silence an offer nobody ever declined, and silently.
 */
export function readOfferState({ brainDir, readFile = (p) => readFileSync(p, "utf8") }) {
  try {
    const parsed = JSON.parse(readFile(join(brainDir, OFFER_STATE_REL)));
    return parsed !== null && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Records the answer. Throws on a disk that refuses it, deliberately: both callers
 * already treat a failed write as the floor (ask again tomorrow), and a swallowed
 * failure here would be the one that reads as "recorded" to the owner watching.
 */
export function writeOfferState({
  brainDir,
  state,
  writeFile = (p, body) => writeFileSync(p, body),
  makeDir = (p) => mkdirSync(p, { recursive: true }),
}) {
  const path = join(brainDir, OFFER_STATE_REL);
  makeDir(dirname(path));
  writeFile(path, `${JSON.stringify(state, null, 2)}\n`);
  return state;
}
