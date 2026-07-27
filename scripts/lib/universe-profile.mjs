// ─────────────────────────────────────────────────────────────────────────────
// universe-profile.mjs — the pure, I/O-free core of a universe's PROFILE
// (universes v2, decision D1): what this sphere IS (an employer, a client, a
// personal space), who is in it, which accounts its connectors use.
//
// The profile is a note in the vault (versioned, editable in Obsidian, indexed by
// the RAG) plus a short digest injected at session start — because the ambient
// facts of a universe are needed exactly when nobody thinks to search for them.
// ─────────────────────────────────────────────────────────────────────────────
import { DEFAULT_UNIVERSE } from "./universes.mjs";

// The profile note's filename. No leading underscore ON PURPOSE: the scanner
// excludes `_template.md` BY NAME, so an `_`-prefixed file would never be indexed
// — and an unindexed profile is a profile the RAG cannot answer from.
const PROFILE_FILENAME = "universe.md";

// The single gate on what "the default universe" means here, so the note's PATH
// and its FRONTMATTER can never disagree about it (an absent slug reads as the
// default, exactly like the pointer does).
const isDefaultUniverse = (universe) => !universe || universe === DEFAULT_UNIVERSE;

/**
 * The vault-relative path of a universe's profile note. The default universe has
 * no subtree of its own (it IS the vault root, ADR 0034), so its profile sits at
 * the root; a created universe keeps its profile inside its own subtree. Pure.
 */
export function universeProfilePath(universe) {
  return isDefaultUniverse(universe) ? PROFILE_FILENAME : `${universe}/${PROFILE_FILENAME}`;
}

/**
 * Builds a universe's profile note as { path, content }, conformant to the vault
 * taxonomy BY CONSTRUCTION (mirrors renderFiledNote): complete frontmatter so
 * `/lint` stays green, and an EXPLICIT `type: universe` so the parser never has to
 * infer a type from the folder. Pure: `today` is injected, never read off a clock.
 */
export function renderUniverseProfile(answers) {
  const { universe, displayName, kind, role, period, today } = answers;
  if (!today) throw new Error("today (YYYY-MM-DD) is required to stamp created/updated");
  if (!displayName) throw new Error("displayName is required: it is the profile note's title");
  // An unanswered question writes NO key at all: a profile half-filled today and
  // completed later must not carry empty keys in between (they read as facts).
  const optional = (key, value) => (value ? [`${key}: ${value}`] : []);
  const frontmatter = [
    "---",
    "type: universe",
    `created: ${today}`,
    `updated: ${today}`,
    "tags: [universe]",
    // Additive scope key, omitted at the root exactly like every other note: the
    // ABSENCE of `universe:` is what "default" means (ADR 0034), so stamping it
    // would make the default universe's own profile the one note that lies.
    ...(isDefaultUniverse(universe) ? [] : [`universe: ${universe}`]),
    `displayName: ${displayName}`,
    ...optional("kind", kind),
    ...optional("role", role),
    ...optional("period", period),
    "---",
  ];
  return {
    path: universeProfilePath(universe),
    content: [...frontmatter, "", `# ${displayName}`, ""].join("\n"),
  };
}
