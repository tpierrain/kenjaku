#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// prompt-restart-nudge.mjs — the UserPromptSubmit hook that keeps saying "this
// conversation is running the OLD engine" until the owner restarts (F20).
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
// It carries a SECOND message now (plan #84): what the live sync pulled in while
// nobody was typing. Same reasoning, one door further — the search server that
// ran the sync cannot speak into a conversation at all, so the news waits on disk
// until the owner's next message, which is this event.
//
// The words live in lib/restart-nudge.mjs and lib/remote-arrivals.mjs, the disk
// verdicts in lib/restart-signal.mjs and the arrivals trace. This file is only the
// contract with the harness.
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { restartPromptDirective } from "./lib/restart-nudge.mjs";
import { buildTrace, markAnnounced, remoteArrivalsDirective } from "./lib/remote-arrivals.mjs";
import { restartPendingOnDisk } from "./lib/restart-signal.mjs";
import { runAsEntrypoint } from "./lib/entrypoint.mjs";
import { readActiveUniverse, vaultRagDir } from "./lib/universes.mjs";
import { deriveWanted } from "./session-self-heal.mjs";

export const realNudgeDeps = {
  // The brain root is derived from THIS module's location (one level up from
  // scripts/), never from the hook's cwd — same rule as auto-commit.mjs.
  brainDir: () => resolve(dirname(fileURLToPath(import.meta.url)), ".."),
  pending: (repo) => restartPendingOnDisk({ repo, deriveWanted, existsSync, readFileSync }),
  trace: (repo) => buildTrace(repo),
  // Read HERE, after the pull, and through the VALIDATED reader: a pointer left aimed at a
  // universe that is gone resolves to the default scope, which is where the searches really
  // land — announcing the ghost would name a sphere nothing can be found in.
  universe: (repo) =>
    readActiveUniverse({ existsSync, readFileSync: (p) => readFileSync(p, "utf-8") }, vaultRagDir(repo)),
  now: () => new Date(),
  emit: (payload) => console.log(JSON.stringify(payload)),
};

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

    const directive = [restart, arrivals].filter(Boolean).join("\n\n");
    if (directive) {
      deps.emit({ hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: directive } });
    }
    if (arrivals) stampQuietly(trace, arrived, deps.now());
  } catch {
    // Silent by design: see the doc comment above.
  }
  return 0;
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
