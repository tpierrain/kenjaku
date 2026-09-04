#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// author-identity.mjs — run FROM the brain folder to answer the one question this
// brain cannot answer for itself:
//
//   node scripts/author-identity.mjs --same-person "tpierrain"     # you, other Mac
//   node scripts/author-identity.mjs --different "Claire Dubois"   # a second person
//   node scripts/author-identity.mjs --list                        # what is recorded
//
// WHY IT EXISTS: everything here reads who writes from git author names, so one
// owner whose two Macs say `Thomas Pierrain` and `tpierrain` is indistinguishable
// from a duo. The session hook therefore ASKS rather than assumes — and a question
// nobody can answer is a question asked at every session start forever. This is
// the answer's way in.
//
// It writes `.vault-rag/authors.json` and then COMMITS AND PUSHES IT, scoped, through
// the universe switch's own machinery: the question is about the OTHER machine, so an
// answer that stays here is one that machine will ask for again. A commit or push that
// cannot happen is said out loud rather than swallowed — the answer IS recorded on
// disk (exit stays 0), but the human must hear that it has not travelled.
//
// Exit 0 when the answer is recorded, 2 when the question itself is broken.
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

import { buildGit, repoRoot } from "./auto-commit.mjs";
import { PUSH_FAILED_WARNING, realSleep } from "./auto-push.mjs";
import { fuseAuthors, markDistinct, readAuthorsState, writeAuthorsState } from "./lib/author-identities.mjs";
import { duoConfirmedNotice, GIT_AUTHOR_ARGS, localAuthorName } from "./lib/brain-author.mjs";
import { defaultGit } from "./lib/engine-fetch.mjs";
import { runAsEntrypoint } from "./lib/entrypoint.mjs";
import { persistVaultRagChange } from "./lib/universe-persist.mjs";
import { vaultRagDir } from "./lib/universes.mjs";

const USAGE =
  `usage: author-identity.mjs --same-person "<name>" | --different "<name>" | --list\n` +
  `       --same-person: that spelling is YOU, on another machine (the two are fused).\n` +
  `       --different:   that really is a second person (asked about once, never again).`;

// Loud, because the alternative is silent: an answer recorded here and nowhere else
// leaves the OTHER machine — the one the question was about — asking it again.
export const ANSWER_NOT_COMMITTED_WARNING =
  "\n⚠️  ANSWER NOT COMMITTED — it is recorded on THIS machine only and will not " +
  "reach the other one. Run `git status` in your brain to see what stopped the commit.";

// Calm on purpose: a deferral is the NORMAL outcome mid-merge, not a failure — the
// Stop-hook sweep commits (unscoped) at turn end, which git does allow there.
export const ANSWER_DEFERRED_NOTE =
  "\nNote: a merge/rebase is in progress here, so the answer will be committed with " +
  "it at the end of the turn.";

export const realAuthorIdentityDeps = () => ({
  io: {
    existsSync,
    readFileSync: (p) => readFileSync(p, "utf-8"),
    writeFileSync,
    mkdirSync,
  },
  vaultRagDir: vaultRagDir(repoRoot(import.meta.url)),
  git: buildGit(repoRoot(import.meta.url)),
  sleep: realSleep,
  // ONE notion of "who is at this keyboard" for the whole brain (brain-author.mjs).
  author: () => localAuthorName(buildGit(repoRoot(import.meta.url))),
  log: (m) => console.log(m),
  error: (m) => console.error(m),
});

/**
 * The intent, or null when what was typed is not one of the two answers. Deliberately
 * strict: a name that lands under the wrong flag fuses two colleagues or splits one
 * person, and both are corrected by hand afterwards.
 */
export function parseAnswer(argv) {
  if (argv.length === 1 && argv[0] === "--list") return { action: "list" };
  if (argv.length !== 2) return null;
  const [flag, name] = argv;
  if (flag === "--same-person") return { action: "fuse", name };
  if (flag === "--different") return { action: "distinct", name };
  return null;
}

/** What `--list` prints: plain sentences, never the JSON shape — a human reads this. */
export function describeAnswers({ identities, distinct }) {
  const lines = [];
  for (const entry of identities) {
    const aka = Array.isArray(entry?.aka) ? entry.aka : [];
    if (typeof entry?.name !== "string") continue;
    lines.push(aka.length === 0 ? `${entry.name}` : `${entry.name} — also writes as ${aka.join(", ")}`);
  }
  for (const name of distinct) lines.push(`${name} — a second person, confirmed`);
  return lines.length === 0 ? "Nothing recorded yet: no name in this brain has been placed." : lines.join("\n");
}

/** Whatever the persistence has to add to the answer — nothing at all when it travelled. */
function travelNote({ commit, push }) {
  let note = "";
  if (commit === "failed" || commit === "conflicted") note += ANSWER_NOT_COMMITTED_WARNING;
  if (commit === "deferred") note += ANSWER_DEFERRED_NOTE;
  if (push === "failed") note += PUSH_FAILED_WARNING;
  return note;
}

/** Records the answer and says what it did. Returns the exit code: 0 recorded / 2 broken question. */
export function runAuthorIdentity(argv, deps = realAuthorIdentityDeps()) {
  const intent = parseAnswer(argv);
  if (intent === null) {
    deps.error(`✗ ${USAGE}`);
    return 2;
  }

  const state = readAuthorsState(deps.io, deps.vaultRagDir);
  if (intent.action === "list") {
    deps.log(describeAnswers(state));
    return 0;
  }

  let result;
  let message;
  let said;
  if (intent.action === "fuse") {
    // A fusion needs a name to fuse INTO, and that is whoever is at this keyboard: the
    // question asked was "or YOU on another machine?". A machine whose git has no name
    // cannot answer it — and cannot file a note of its own either.
    const me = deps.author();
    if (!me) {
      deps.error(
        `✗ this machine's git has no user.name, so there is nobody to fuse "${intent.name}" with. ` +
          `Set it first: git config user.name "<your name>".`,
      );
      return 2;
    }
    result = fuseAuthors(state, me, intent.name);
    message = `auto: ${intent.name} is ${result.canonical ?? me} on another machine`;
    said = () =>
      `Recorded: "${intent.name}" is you, on another machine. Your notes stay filed under ` +
      `${result.canonical}, and no note of yours will be split in two.`;
  } else {
    result = markDistinct(state, intent.name);
    message = `auto: ${intent.name} is a second person in this brain`;
    said = () => duoConfirmedNotice(intent.name);
  }

  if (!result.ok) {
    deps.error(
      `✗ "${intent.name}" is not a name this brain can file under (it has no letters or digits), ` +
        `so it cannot be recorded. Use the spelling git shows in the question.`,
    );
    return 2;
  }

  // Nothing new to write is not an error: the human answered a question they had
  // already answered, so the answer is repeated and the disk is left alone. Writing
  // anyway would dirty the tree and make the next sync tick defer, for nothing.
  if (!result.changed) {
    deps.log(said());
    return 0;
  }

  writeAuthorsState(deps.io, deps.vaultRagDir, result.state);
  // Committed AFTER the write, or the commit carries the previous answer.
  const persisted = persistVaultRagChange({ git: deps.git, sleep: deps.sleep, message });
  deps.log(said() + travelNote(persisted));
  return 0;
}

runAsEntrypoint(import.meta.url, process.argv, runAuthorIdentity);

// Named so a reader can follow it back to the one notion of "who": the fusion's
// canonical side is exactly what `git config --get user.name` answers.
export { GIT_AUTHOR_ARGS };
