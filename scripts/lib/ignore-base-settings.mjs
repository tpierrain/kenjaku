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
//
// HOW it is added is no longer written here: the live sync between machines needs the
// very same migration for its arrivals trace, and the subtle half — deciding whether a
// line ALREADY covers the path — must not exist in two copies. It moved, whole and with
// its mutation-run lessons, to `gitignore-entry.mjs`; this file keeps WHAT is ignored
// and WHY, which is all it ever really said.
// ─────────────────────────────────────────────────────────────────────────────
import { ensureIgnored } from "./gitignore-entry.mjs";

// The path the engine keeps the ancestor bytes at. Spelled here once; the migration and
// the shipped `.gitignore` are asserted to agree rather than trusted to.
export const BASE_SETTINGS_ENTRY = ".engine-base/.claude/settings.json";

// Why, in the owner's terms rather than ours — they read this file when their sync
// misbehaves, and "provenance base" would mean nothing there.
export const BASE_SETTINGS_COMMENT =
  "# The engine's copy of settings.json (same reason as the line above: absolute paths" +
  " belonging to THIS machine — never commit it).";

/**
 * Returns the `.gitignore` with the base copy of settings.json ignored, and whether
 * anything moved. Already ignored → the SAME string back, so a second run is provably
 * a no-op and a converged brain sees no churn.
 */
export function ignoreBaseSettings(text) {
  return ensureIgnored({ text, entry: BASE_SETTINGS_ENTRY, comment: BASE_SETTINGS_COMMENT });
}
