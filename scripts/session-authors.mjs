#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// session-authors.mjs — SessionStart hook: once a brain has more than one author,
// every session learns who is at the keyboard, and a name nobody has placed yet is
// PUT TO THE HUMAN AS A QUESTION (plan steps 4.3, 4.3bis, then 8.4).
//
// Duo mode is implicit: nothing to switch on, no profile to fill in, no list of
// people to maintain. The names come from git history and from `git config --get
// user.name` — both of which this brain already writes into every commit it makes.
// Reading them is not collecting them.
//
// What implicitness owes back is not a setting, and step 8 found it is not a
// sentence either: the sentence this hook used to emit ASSERTED a second person,
// which is something git author names cannot establish — one owner's two Macs look
// exactly like two people. So it asks, and it asks at EVERY session start until the
// answer is recorded. There is no per-machine "said it" marker any more: the memory
// is the answer itself, in `.vault-rag/authors.json`, and that one travels to the
// other machine — which is the whole point, since the question is about that machine.
//
// Below two authors it emits nothing at all, not even an empty payload: a solo
// owner's session start must be byte-identical to what it was (ADR 0034's doctrine).
//
// Contract, like every session hook: fail-open, ALWAYS exit 0, and it WRITES NOTHING.
// Cross-OS: pure Node plus git. Wired in `.claude/settings.json.template`.
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { readAuthorsState } from "./lib/author-identities.mjs";
import {
  authorsReminder,
  buildAuthorsHookOutput,
  fusionElsewhereQuestion,
  GIT_AUTHORS_ARGS,
  localAuthorName,
  secondAuthorQuestion,
} from "./lib/brain-author.mjs";
import { defaultGit } from "./lib/engine-fetch.mjs";
import { runAsEntrypoint } from "./lib/entrypoint.mjs";
import { vaultRagDir } from "./lib/universes.mjs";

/** The registry of a brain nobody has answered for yet — and of one whose answers cannot be read. */
const NO_ANSWERS = { identities: [], distinct: [] };

/**
 * The testable core. Every seam is injected, because the two things worth pinning
 * here are exactly the ones a real run hides: that an unplaced name is ASKED about
 * rather than announced, and that nothing at all is emitted below two authors.
 *
 * Fail-open in every direction, and in the right direction each time: a git history
 * that cannot be read costs the notice, while a REGISTRY that cannot be read costs
 * only the answers it held. Unreadable answers mean "not answered yet", so the
 * question comes back — one line, against a brain that would otherwise keep filing
 * on a guess the owner had already corrected.
 */
export function sessionAuthorsNotice({ authors, me, state, emit }) {
  let output = null;
  try {
    const seen = authors();
    const here = me();
    let answers = NO_ANSWERS;
    try {
      answers = state();
    } catch {
      // Kept deliberately narrow: only the registry read falls back here, so a
      // failure below still costs the whole notice rather than half of one.
    }
    const reminder = authorsReminder({ authors: seen, me: here, identities: answers.identities });
    const question = secondAuthorQuestion({
      authors: seen,
      me: here,
      identities: answers.identities,
      distinct: answers.distinct,
    });
    // Third, and the only one of the three that can fire ALONE: a fusion recorded on
    // the other machine silences both lines above by construction — it makes two
    // humans resolve to one — so this is the session start that would otherwise say
    // nothing at all (step 9.1).
    const fusion = fusionElsewhereQuestion({ identities: answers.identities, me: here });
    output = buildAuthorsHookOutput({ reminder, question, fusion });
  } catch {
    // Fail-open: session start belongs to the owner, not to this hook. Nothing was
    // built, so `output` is still null, nothing is emitted, and the 0 below is the
    // same 0 — which is why this block is deliberately empty rather than returning
    // a second time from a function with one exit.
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

  return sessionAuthorsNotice({
    authors: () => {
      const log = git(GIT_AUTHORS_ARGS);
      // A brain that is not a git repository yet has no history to read, and that is
      // not an error worth a word at session start.
      if (!log.ok) throw new Error("no git history");
      return log.out.split("\n");
    },
    me: () => localAuthorName(git),
    // Rooted on the brain, like the git calls above: read from anywhere else and the
    // answer the owner gave sits on disk, correct, and is never consulted.
    state: () =>
      readAuthorsState({ existsSync, readFileSync: (p) => readFileSync(p, "utf-8") }, vaultRagDir(brainDir)),
    // additionalContext is the ONLY Desktop-visible channel — see buildAuthorsHookOutput.
    emit: (output) => process.stdout.write(`${JSON.stringify(output)}\n`),
  });
});
