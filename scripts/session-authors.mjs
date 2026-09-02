#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// session-authors.mjs — SessionStart hook: once a brain has more than one author,
// every session learns who is at the keyboard, and ONE session in the brain's life
// says so out loud (plan steps 4.3, 4.3bis).
//
// Duo mode is implicit: nothing to switch on, no profile to fill in, no list of
// people to maintain. The names come from git history and from `git config --get
// user.name` — both of which this brain already writes into every commit it makes.
// Reading them is not collecting them.
//
// What implicitness owes back is a sentence, not a setting: a brain that quietly
// starts filing things differently is opaque. So the first time a second author is
// seen, the brain says it once, offers to describe who is who — an offer that
// activates nothing and whose refusal changes no behaviour — and never mentions it
// again. The "said it" marker is per machine, under `.cache/`, beside the sync's own.
//
// Below two authors it emits nothing at all, not even an empty payload: a solo
// owner's session start must be byte-identical to what it was (ADR 0034's doctrine).
//
// Contract, like every session hook: fail-open, ALWAYS exit 0. Cross-OS: pure Node
// plus git. Wired in `.claude/settings.json.template`.
// ─────────────────────────────────────────────────────────────────────────────
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  authorsReminder,
  buildAuthorsHookOutput,
  GIT_AUTHORS_ARGS,
  localAuthorName,
  secondAuthorAnnouncement,
} from "./lib/brain-author.mjs";
import { defaultGit } from "./lib/engine-fetch.mjs";
import { runAsEntrypoint } from "./lib/entrypoint.mjs";

/** Per machine, never committed: the other machine has its own first session to announce. */
export const ANNOUNCED_REL = join(".cache", "second-author-announced");

/**
 * The testable core. Every seam is injected, because the two things worth pinning
 * here are exactly the ones a real run hides: that the announcement fires ONCE, and
 * that nothing at all is emitted below two authors.
 *
 * Fail-open in every direction: a git history that cannot be read costs the notice,
 * and a marker that cannot be written costs only the MEMORY of the notice — the
 * sentence still gets out, which is the half the human needs.
 */
export function sessionAuthorsNotice({ authors, me, announced, markAnnounced, emit }) {
  let output = null;
  try {
    const seen = authors();
    const here = me();
    const reminder = authorsReminder({ authors: seen, me: here });
    const announcement = secondAuthorAnnouncement({ authors: seen, me: here, announced: announced() });
    output = buildAuthorsHookOutput({ reminder, announcement });
    if (output && announcement) {
      try {
        markAnnounced();
      } catch {
        // The sentence is worth more than the memory of it. Worst case it is said twice.
      }
    }
  } catch {
    return 0; // fail-open: session start belongs to the owner, not to this hook.
  }
  if (output) emit(output);
  return 0;
}

runAsEntrypoint(import.meta.url, process.argv, () => {
  // Rooted on THIS file, never on the process's directory: a hook's cwd is not this
  // script's to assume, and a git command run elsewhere succeeds — it just answers
  // about somewhere else (the blindness locale-drift.mjs was bitten by).
  const brainDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const git = (args) => defaultGit(["-C", brainDir, ...args]);
  const marker = join(brainDir, ANNOUNCED_REL);

  return sessionAuthorsNotice({
    authors: () => {
      const log = git(GIT_AUTHORS_ARGS);
      // A brain that is not a git repository yet has no history to read, and that is
      // not an error worth a word at session start.
      if (!log.ok) throw new Error("no git history");
      return log.out.split("\n");
    },
    me: () => localAuthorName(git),
    announced: () => {
      try {
        return readFileSync(marker, "utf8").trim() !== "";
      } catch {
        return false; // never announced, or unreadable → say it (at worst, twice).
      }
    },
    markAnnounced: () => {
      mkdirSync(dirname(marker), { recursive: true });
      writeFileSync(marker, `${new Date().toISOString()}\n`);
    },
    // additionalContext is the ONLY Desktop-visible channel — see buildAuthorsHookOutput.
    emit: (output) => process.stdout.write(`${JSON.stringify(output)}\n`),
  });
});
