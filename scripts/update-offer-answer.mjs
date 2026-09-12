#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// update-offer-answer.mjs — the command that remembers what the owner answered to
// the update offer (#100).
//
//   node scripts/update-offer-answer.mjs later
//   node scripts/update-offer-answer.mjs no-thanks
//   node scripts/update-offer-answer.mjs install
//
// WHY A COMMAND. The offer is BUILT by a hook and ASKED by Claude, and neither can
// write the answer down: the hook has already exited by the time the question is
// on screen, and a conversation cannot call a function — it can only run a
// command. Same shape, and same reason, as `adopt-engine-file.mjs`.
//
// 🛑 IT IS AN IMPROVEMENT ON THE FLOOR, NOT A LOAD-BEARING PART, and that is what
// makes it safe for an owner to decline to run it. The hook stamps "ask again
// tomorrow" the moment it speaks, before any answer exists — so this command never
// runs, is refused by the host, or meets a read-only disk, and the cost is at most
// one question a day. What it buys is the LONGER silences: the ladder a refusal
// walks (+3 days, +5 days, +3 weeks, +2 months, then nothing more for that
// version).
//
// Exit codes, same contract as the other engine commands:
//   0 — recorded, or there was legitimately nothing to record.
//   1 — the answer could NOT be kept. The offer simply comes back tomorrow.
//   2 — the CALLER got it wrong. Never shown to the owner as-is.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { runAsEntrypoint } from "./lib/entrypoint.mjs";
import { afterAnswer, readOfferState, writeOfferState } from "./lib/update-offer.mjs";
import { UPSTREAM_CACHE_REL } from "./lib/upstream-cache.mjs";

export const USAGE =
  "usage: node scripts/update-offer-answer.mjs later|no-thanks|install\n" +
  "  later       ask me again tomorrow (repeatable for as long as you like)\n" +
  "  no-thanks   not this version: +3 days, then +5 days, +3 weeks, +2 months, then no more for it\n" +
  "  install     the update is being run now, so the offer stands aside while it does";

const ANSWERS = new Set(["later", "no-thanks", "install"]);

export const realAnswerDeps = {
  // The brain is derived from where THIS FILE lives, one level up from scripts/,
  // never from the working directory — same rule as the hook and auto-commit. A
  // conversation's cwd is not reliably the brain, and an answer written into the
  // wrong folder is an answer nothing will ever read.
  brainDir: resolve(dirname(fileURLToPath(import.meta.url)), ".."),
  readVerdict: (brainDir) => {
    try {
      return JSON.parse(readFileSync(join(brainDir, UPSTREAM_CACHE_REL), "utf8"));
    } catch {
      return null;
    }
  },
  readState: (brainDir) => readOfferState({ brainDir }),
  writeState: (state, brainDir) => writeOfferState({ brainDir, state }),
  now: () => Date.now(),
  log: (line) => console.log(line),
  error: (line) => console.error(line),
};

export function runUpdateOfferAnswer(argv, deps = realAnswerDeps) {
  const [answer, ...rest] = argv;
  if (!ANSWERS.has(answer) || rest.length > 0) {
    deps.error(USAGE);
    return 2;
  }

  // The version being answered ABOUT is read from the verdict, never passed in:
  // an argument would let a stale conversation record a refusal against a release
  // that is no longer the one on offer.
  const verdict = deps.readVerdict(deps.brainDir);
  if (verdict?.state !== "available" || !verdict.target) {
    deps.log("There is no update on offer right now, so there was nothing to record.");
    return 0;
  }

  const state = afterAnswer({
    state: deps.readState(deps.brainDir),
    version: verdict.target,
    answer,
    now: deps.now(),
  });

  try {
    deps.writeState(state, deps.brainDir);
  } catch {
    deps.error(
      `I could not write your answer down, so nothing remembers it: the offer for ${verdict.target} will come ` +
        `back tomorrow. Your brain is fine, and the update itself was not touched.`,
    );
    return 1;
  }

  deps.log(recorded(state, verdict.target));
  return 0;
}

/** What the owner reads back. It states the consequence, never the file it wrote. */
function recorded(state, version) {
  if (state.silenced) return `Noted: ${version} will not be brought up again.`;
  const when = new Date(Date.parse(state.nextAskAt)).toISOString().slice(0, 10);
  return `Noted. ${version} will not be brought up again before ${when}.`;
}

runAsEntrypoint(import.meta.url, process.argv, runUpdateOfferAnswer);
