// ─────────────────────────────────────────────────────────────────────────────
// gitignore-entry.mjs — the ONE way the engine adds a line to a brain's `.gitignore`.
//
// A brain's `.gitignore` is carried by NO engine regime, so the launcher's own file
// reaches a fresh install and nobody else: every engine-owned path that must stay out
// of the repo needs a surgical migration, run on the update AND the SessionStart
// self-heal (see reconcile-brain.mjs). That was written once, for the base copy of
// settings.json (F4); the live sync between machines needs a second one, and a third
// would be the moment the subtle half — deciding whether a line ALREADY covers the
// path — drifts between copies. A wrong "yes" there leaves a machine-local file tracked
// and published; a wrong "no" appends a duplicate to someone's file at every session.
//
// The contract, inherited whole from F4: this file is the OWNER's. We add exactly one
// entry and one comment, at the end, and touch nothing else — their lines, their order,
// their line endings. Pure: the caller reads and writes.
// ─────────────────────────────────────────────────────────────────────────────

// Trailing spaces are git's own rule for a `.gitignore` entry, and `.trim()` also strips
// a CRLF file's trailing `\r`, which is whitespace.
const bare = (line) => line.trim();

/**
 * Does this `.gitignore` line already keep `entry` out of the repo?
 *
 * Not "is it our entry, spelled our way": a broader parent directory (`.engine-base/`)
 * is the line a maintainer writes by hand, and to git it already ignores everything
 * below it. Appending the narrow entry under it is churn on someone else's file — and
 * churn that comes back at every update, because an exact-match check can never see the
 * line it keeps duplicating.
 *
 * Deliberately literal: a **directory prefix**, nothing more. A glob (`*.json`,
 * `.engine-*`) may well cover the path too, and answering that would mean
 * re-implementing git's matcher — where a wrong "yes" leaks a machine-local file into a
 * published repo. An extra entry under a glob is harmless; a missing one is not.
 */
export function covers(line, entry) {
  // A leading `/` anchors, a trailing `/` says "directory": neither changes WHICH path
  // is named here, since every entry we add is anchored at the brain root either way.
  const named = bare(line).replace(/^\//, "").replace(/\/$/, "");

  // 🛑 A blank line, a `#` comment and a `!` negation need NO special case, and the
  // mutation run is what proved it: each one keeps its own leading character, so it can
  // neither equal the entry nor be a directory prefix of it. A guard that cannot change
  // an answer is not caution, it is a branch nothing can test — so it is not written.
  // The three of them are pinned by tests, on the behaviour rather than on the branch.
  return named === entry || entry.startsWith(`${named}/`);
}

/**
 * Returns the `.gitignore` with `entry` ignored and `comment` above it, and whether
 * anything moved. Already covered → the SAME string back, so a second run is provably a
 * no-op and a converged brain sees no churn.
 */
export function ensureIgnored({ text, entry, comment }) {
  if (text.split("\n").some((line) => covers(line, entry))) return { text, changed: false };

  // Appended, never inserted next to a sibling: the sibling may have been moved,
  // renamed or commented out by the owner, and an insertion point we have to find is an
  // insertion point we can get wrong on someone else's file.
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  // A file that does not end in a newline would otherwise have our comment welded onto
  // its last entry, turning that entry into something git no longer matches. On a file
  // that is EMPTY there is nothing to weld to and nothing to separate from: both the
  // separator and the blank line would be two leading blanks the owner never wrote, and
  // they would show up in their diff forever (S15a).
  const prefix = text === "" ? "" : `${text.endsWith("\n") ? "" : eol}${eol}`;
  return { text: `${text}${prefix}${comment}${eol}${entry}${eol}`, changed: true };
}
