// ─────────────────────────────────────────────────────────────────────────────
// ignore-base-settings.mjs — F4 of the v5.0.0 code review: the brain's BACKUP REPO
// must not start publishing the owner's absolute paths.
//
// `.claude/settings.json` is gitignored on purpose, and the reason is written beside
// it in every brain's `.gitignore`: it holds absolute paths belonging to ONE machine,
// plus that machine's connector permissions. This release invents `.engine-base/`,
// which keeps the last-delivered BYTES of every merge file — settings.json included —
// and nothing ignored the copy. Auto-commit sweeps it, auto-push publishes it, and on
// a second machine the pulled base describes machine A.
//
// A gitignore line is the whole repair, and it is enough BECAUSE `.engine-base/` is
// new: no deployed brain has ever tracked that path, so there is nothing to untrack —
// only something to never start tracking. It has to land BEFORE the tree is written,
// which is why it runs inside the reconcile (the base is laid down after it) and why
// the launcher's own `.gitignore` — the one a fresh install copies — carries the line
// already. A test pins those two spellings against each other.
//
// The same surgical contract as `unignore-pointer.mjs`, its twin one door over: this
// file is the OWNER's. We add one entry and one comment, at the end, and touch nothing
// else — their lines, their order, their line endings. Pure: the caller reads and writes.
// ─────────────────────────────────────────────────────────────────────────────

// The path the engine keeps the ancestor bytes at. Spelled here once; the migration and
// the shipped `.gitignore` are asserted to agree rather than trusted to.
export const BASE_SETTINGS_ENTRY = ".engine-base/.claude/settings.json";

// Why, in the owner's terms rather than ours — they read this file when their sync
// misbehaves, and "provenance base" would mean nothing there.
export const BASE_SETTINGS_COMMENT =
  "# The engine's copy of settings.json (same reason as the line above: absolute paths" +
  " belonging to THIS machine — never commit it).";

// Trailing spaces are git's own rule for a `.gitignore` entry, and `.trim()` also strips
// a CRLF file's trailing `\r`, which is whitespace.
const bare = (line) => line.trim();

/**
 * Returns the `.gitignore` with the base copy of settings.json ignored, and whether
 * anything moved. Already ignored → the SAME string back, so a second run is provably
 * a no-op and a converged brain sees no churn.
 */
export function ignoreBaseSettings(text) {
  // A leading `/` is the same entry to git, and an owner may well have written one.
  const isEntry = (line) => bare(line).replace(/^\//, "") === BASE_SETTINGS_ENTRY;
  if (text.split("\n").some(isEntry)) return { text, changed: false };

  // Appended, never inserted next to its sibling: the sibling may have been moved,
  // renamed or commented out by the owner, and an insertion point we have to find is an
  // insertion point we can get wrong on someone else's file.
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  // A file that does not end in a newline would otherwise have our comment welded onto
  // its last entry, turning that entry into something git no longer matches.
  const separator = text.endsWith("\n") ? "" : eol;
  return { text: `${text}${separator}${eol}${BASE_SETTINGS_COMMENT}${eol}${BASE_SETTINGS_ENTRY}${eol}`, changed: true };
}
