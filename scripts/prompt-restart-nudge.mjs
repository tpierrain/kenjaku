#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// prompt-restart-nudge.mjs — THE UserPromptSubmit hook. It keeps its first name
// for the same reason a street does, and it now carries THREE messages: the
// restart nudge it was born for (F20), what the live sync pulled in while nobody
// was typing (#84), and the offer to install a waiting engine release (#100).
//
// They share this file rather than getting a hook each because the cost of the
// event is the PROCESS, not the message: a sibling hook on `UserPromptSubmit`
// would put one more node start-up in front of every prompt an owner types, which
// is the latency budget the owner has already ruled on once.
//
// Why this event, and not one more line in the SessionStart banner: that banner
// prints once, at the top of a session that may run for hours, and on Desktop it
// is dropped entirely (ADR 0036's channel matrix — `systemMessage` and
// `statusLine` are both CLI-only). `UserPromptSubmit` is the only deterministic
// channel Desktop receives, and it repeats on every prompt, so the nudge cannot
// scroll away.
//
// It INJECTS and never blocks. The event can refuse a prompt outright (exit 2);
// that lever is deliberately not used, because a wrong verdict would lock an owner
// out of their own brain, while a wrong sentence costs them one sentence.
//
// It carries a SECOND message (plan #84): what the live sync pulled in while
// nobody was typing. Same reasoning, one door further — the search server that
// ran the sync cannot speak into a conversation at all, so the news waits on disk
// until the owner's next message, which is this event.
//
// And a THIRD (#100): a release is waiting upstream. The daily probe has known for
// up to a day, the session start says it once at the top of a session that may run
// for hours, and Desktop drops that banner entirely — so the fact reached nobody
// and the fleet sat several releases behind. Here it becomes a question.
//
// The words live in lib/restart-nudge.mjs, lib/remote-arrivals.mjs and
// lib/update-offer.mjs; the disk verdicts in lib/restart-signal.mjs, the arrivals
// trace and lib/upstream-cache.mjs. This file is only the contract with the
// harness.
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { currentClaudeApp } from "./lib/claude-app-identity.mjs";
import { restartPromptDirective } from "./lib/restart-nudge.mjs";
import { buildTrace, markAnnounced, remoteArrivalsDirective } from "./lib/remote-arrivals.mjs";
import { restartPendingOnDisk } from "./lib/restart-signal.mjs";
import { runAsEntrypoint } from "./lib/entrypoint.mjs";
import { readActiveUniverse, vaultRagDir } from "./lib/universes.mjs";
import { afterAsked, readOfferState, updateOfferDirective, writeOfferState } from "./lib/update-offer.mjs";
import { UPSTREAM_CACHE_REL } from "./lib/upstream-cache.mjs";
import { deriveWanted } from "./session-self-heal.mjs";

export const realNudgeDeps = {
  // The brain root is derived from THIS module's location (one level up from
  // scripts/), never from the hook's cwd — same rule as auto-commit.mjs.
  brainDir: () => resolve(dirname(fileURLToPath(import.meta.url)), ".."),
  // #90 — this hook is the ONLY surface that both repeats and runs where no `SessionStart`
  // ever will, so it is the one that asks "is the app above me still the app that armed the
  // marker?", and the one that erases a marker the answer has just made stale. The two
  // answers are parameters so a test can hand them in: forcing a real restart would mean
  // quitting the app running the tests. status-line and session-status deliberately ask
  // neither — both run only where a fresh session already clears the marker, and paying for
  // a process-table read there would buy nothing.
  pending: (repo, { readAppIdentity = currentClaudeApp, onStale = eraseStaleMarker } = {}) =>
    restartPendingOnDisk({ repo, deriveWanted, existsSync, readFileSync, readAppIdentity, onStale }),
  trace: (repo) => buildTrace(repo),
  // Read HERE, after the pull, and through the VALIDATED reader: a pointer left aimed at a
  // universe that is gone resolves to the default scope, which is where the searches really
  // land — announcing the ghost would name a sphere nothing can be found in.
  universe: (repo) =>
    readActiveUniverse({ existsSync, readFileSync: (p) => readFileSync(p, "utf-8") }, vaultRagDir(repo)),
  // #100 — the two files the offer turns on, read together because they are only
  // ever read together, and only when there is no restart to announce first. An
  // absent or damaged verdict reads as "nobody has looked yet", which offers
  // nothing: the probe's own four states are kept apart in `update-offer.mjs`, and
  // "could not find out" must never reach an owner dressed as an offer.
  offer: (repo) => ({
    verdict: readJsonQuietly(join(repo, UPSTREAM_CACHE_REL)),
    state: readOfferState({ brainDir: repo }),
    stamp: (next) => writeOfferState({ brainDir: repo, state: next }),
  }),
  now: () => new Date(),
  emit: (payload) => console.log(JSON.stringify(payload)),
};

/** The verdict on disk, or null — absent, truncated and unparseable all mean the same here. */
function readJsonQuietly(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

// Best-effort, like every other write on this path: an owner whose marker cannot be removed
// gets the nudge once more, which is a nuisance. One that crashed here would get no prompt.
function eraseStaleMarker(flagPath) {
  try {
    rmSync(flagPath, { force: true });
  } catch {
    /* the verdict already stands; the file is just a leftover */
  }
}

/**
 * Asks the two questions this hook exists for and injects what they answer. Always returns
 * 0: it sits in front of every prompt the owner types, so its own breakage must never become
 * theirs — an unreadable brain, a hiccup in a verdict, anything unexpected leaves the prompt
 * untouched, in silence.
 *
 * The two are read in the order they matter. A pending restart is a BLOCKER — this
 * conversation is running code that is no longer on disk — while an arrival is news. They
 * ride in one payload because `additionalContext` is one string, not a list.
 *
 * And when what arrived is the ACTIVE-UNIVERSE POINTER, the news is also a correction: the
 * session start no longer waits for the pull before naming the universe (ADR 0028 — a
 * session start never blocks on the network), so it may have opened on the sphere this
 * machine went to sleep in. That half is not optional. Shipping the removal of the wait
 * without it would not delay the information, it would LOSE it.
 *
 * The second question is the live sync's (plan #84): the tick pulled while nobody was
 * typing and has no way to say so — the search server cannot speak into a conversation.
 * The trace is stamped as announced right after, so the same notes are named once and not
 * at every message for the rest of the session. The stamp is best-effort: a brain whose
 * disk refuses the write still gets its announcement, and simply gets it again later.
 */
export function runPromptNudge(deps = realNudgeDeps) {
  try {
    const repo = deps.brainDir();
    const restart = restartPromptDirective(deps.pending(repo));
    const trace = deps.trace(repo);
    const arrived = trace.read();
    const arrivals = remoteArrivalsDirective(arrived, () => deps.universe(repo));

    // THE RESTART TAKES PRECEDENCE, AND IT IS A PRODUCT RULE RATHER THAN TIDINESS.
    // A conversation running the old engine is being told to close and reopen; an
    // offer to install a NEWER engine on top of that is two update instructions in
    // one message, and an owner would reasonably do the wrong one first. Skipping
    // it also skips the two file reads, which is the right way round: the silent
    // case is the one that must cost nothing.
    const offer = restart ? null : askAboutUpdate(deps, repo);

    const directive = [restart, arrivals, offer?.directive].filter(Boolean).join("\n\n");
    if (directive) {
      deps.emit({ hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: directive } });
    }
    if (arrivals) stampQuietly(trace, arrived, deps.now());
    if (offer?.directive) offer.record();
  } catch {
    // Silent by design: see the doc comment above.
  }
  return 0;
}

/**
 * The waiting release, as a question — and the stamp that postpones it, ready but
 * not yet written (#100).
 *
 * 🛑 THE STAMP IS THE FLOOR OF THE WHOLE FEATURE, and it is written HERE, when the
 * offer is SPOKEN, not when it is answered. The answer arrives through a command
 * Claude runs afterwards, and every way that can fail — never run, refused by the
 * host, a read-only disk — must land on "ask again tomorrow" rather than on
 * "ask again at the very next prompt". So being asked is itself worth a day.
 *
 * `record` is separated from the directive because the two must not both happen
 * when only one of them can: stamping an offer that was never emitted would buy a
 * day of silence for a question nobody ever saw.
 */
function askAboutUpdate(deps, repo) {
  const { verdict, state, stamp } = deps.offer(repo);
  const directive = updateOfferDirective({ verdict, state, now: deps.now().getTime() });
  if (!directive) return null;
  return {
    directive,
    record: () => {
      try {
        stamp(afterAsked({ state, version: verdict.target, now: deps.now().getTime() }));
      } catch {
        // Best-effort, like the arrivals stamp beside it: the offer has already
        // gone out, and the cost of not recording it is the same offer tomorrow.
      }
    },
  };
}

/** Records that the arrivals were said. A failure here costs a repeat, never the message. */
function stampQuietly(trace, arrived, at) {
  try {
    trace.write(markAnnounced(arrived, at));
  } catch {
    // Best-effort: the announcement already went out, and the next tick rewrites the trace.
  }
}

// runPromptNudge's own parameter is `deps` (defaulted to realNudgeDeps), not argv — so it
// must be wrapped, never passed directly: passed as-is, runAsEntrypoint would hand it the
// argv slice in place of deps.
runAsEntrypoint(import.meta.url, process.argv, () => runPromptNudge());
