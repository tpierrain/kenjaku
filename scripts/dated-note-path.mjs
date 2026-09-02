#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// dated-note-path.mjs — run FROM the brain folder to ask where today's dated note
// goes, instead of composing that path by hand:
//
//   node scripts/dated-note-path.mjs --folder daily --date 2026-09-02
//   node scripts/dated-note-path.mjs --folder acme/briefings --date 2026-09-02 --author "Claire Dubois"
//
// It answers TWO things, and the second is what makes the rule work tomorrow:
//
//   path: vault/briefings/2026-09-02-thomas-pierrain.md
//   author: Thomas Pierrain
//
// **Stamp that `author:` in the note's frontmatter.** Without it, tomorrow's
// resolution reads a note that claims nobody, falls back to the shared file, and
// the mechanism quietly stops existing.
//
// The rule itself lives in `lib/dated-note-path.mjs` (pure): the base name belongs
// to whoever writes first, and only a DIFFERENT author gets a suffix — so a solo
// owner never sees one. Every degradation here falls back to the shared file, i.e.
// to today's behaviour, which is a visible union merge rather than an invented path
// nobody would think to look in.
//
// Exit 0 with an answer, 2 when the question itself is broken.
// ─────────────────────────────────────────────────────────────────────────────
import { join } from "node:path";

import { localAuthorName } from "./lib/brain-author.mjs";
import { resolveDatedNotePath } from "./lib/dated-note-path.mjs";
import { defaultGit } from "./lib/engine-fetch.mjs";
import { runAsEntrypoint } from "./lib/entrypoint.mjs";
import { readVaultNotes } from "./lib/wiki-lint-io.mjs";

const USAGE =
  `usage: dated-note-path.mjs --folder <daily|briefings|…> --date <YYYY-MM-DD> [--author "<name>"]\n` +
  `       --folder may carry a universe (acme/daily); --author defaults to git config user.name.`;

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

export const realDatedNotePathDeps = {
  notes: () => readVaultNotes(join(process.cwd(), "vault")),
  // Rooted with `-C` rather than trusting the process's directory: a hook's cwd is
  // not this script's to assume, and a git command run in the wrong directory
  // succeeds — it just answers about somewhere else (the blindness locale-drift.mjs
  // was bitten by).
  author: () => localAuthorName((args) => defaultGit(["-C", process.cwd(), ...args])),
  log: (...a) => console.log(...a),
  error: (...a) => console.error(...a),
};

function parseFlags(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const name = argv[i].startsWith("--") ? argv[i].slice(2) : null;
    if (!name) throw new Error(`unexpected argument ${JSON.stringify(argv[i])}.\n${USAGE}`);
    if (i + 1 >= argv.length) throw new Error(`--${name} needs a value.\n${USAGE}`);
    flags[name] = argv[++i];
  }
  if (!flags.folder) throw new Error(`--folder is required.\n${USAGE}`);
  if (!flags.date) throw new Error(`--date is required.\n${USAGE}`);
  if (!ISO_DAY.test(flags.date)) {
    throw new Error(`--date must be a day, spelled YYYY-MM-DD (got ${JSON.stringify(flags.date)}).\n${USAGE}`);
  }
  return flags;
}

/** Prints where the note goes and who to stamp on it. Returns the exit code: 0 answered / 2 broken question. */
export function runDatedNotePath(argv, deps = realDatedNotePathDeps) {
  let flags;
  try {
    flags = parseFlags(argv);
  } catch (err) {
    deps.error(`✗ ${err.message}`);
    return 2;
  }

  const author = flags.author ?? deps.author();
  // An unreadable vault is "I could not find out", and the safe answer is the shared
  // file: it merges visibly, where an invented path would simply not be looked in.
  let notes = [];
  try {
    notes = deps.notes();
  } catch {
    notes = [];
  }

  if (!author) {
    deps.log(`path: vault/${flags.folder}/${flags.date}.md`);
    deps.log(
      `note: this machine's git has no user.name, so there is no author to stamp and no file of ` +
        `your own to give you. Set it (git config user.name "…") if two people write in this brain.`,
    );
    return 0;
  }

  const { path, suffixed } = resolveDatedNotePath({ notes, folder: flags.folder, date: flags.date, author });
  deps.log(`path: vault/${path}`);
  deps.log(`author: ${author}`);
  if (suffixed) {
    const base = notes.find((n) => n.path === `${flags.folder}/${flags.date}.md`);
    deps.log(
      `note: ${base.frontmatter.author} already wrote ${flags.folder}/${flags.date}.md today, so this ` +
        `one is yours — both are kept, and neither is merged into the other.`,
    );
  }
  return 0;
}

runAsEntrypoint(import.meta.url, process.argv, runDatedNotePath);
