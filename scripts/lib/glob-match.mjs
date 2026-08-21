// ─────────────────────────────────────────────────────────────────────────────
// glob-match.mjs — the ONE glob dialect shared by every engine-manifest consumer
// (engine-source's provenance selection, engine-apply-plan's safety allowlist), so
// "which files does this glob own" has a single, identical answer everywhere.
//   **  → any run of characters, including "/" (whole subtrees)
//   *   → any run of characters except "/" (a single path segment)
// Everything else is literal; the match is anchored (^…$) so a glob never selects a
// path that merely starts/ends with it.
// ─────────────────────────────────────────────────────────────────────────────

export function globToRegExp(glob) {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const body = escaped
    .replace(/\*\*/g, " ") // placeholder so "*" below doesn't eat "**"
    .replace(/\*/g, "[^/]*")
    .replace(/ /g, ".*");
  return new RegExp("^" + body + "$");
}

// True iff any of `globs` matches `path`.
export function matchesAny(globs, path) {
  return globs.some((glob) => globToRegExp(glob).test(path));
}

// The walk roots a set of globs allows: for each glob, its leading run of segments
// that contain no wildcard. Where the WHOLE tree used to be walked and then filtered,
// a caller can start from these instead and get the identical set — every path a glob
// can match lives under that glob's own static prefix.
//
// Why it was written (measured, S4-4c): `readInstalledMergeFiles` walked the whole
// brain for merge-regime files, and not one merge glob reaches into `vault/`. So a
// SessionStart hook read every note its owner had ever written — ~2.3 µs per file,
// 18.5 ms for 8 000 notes, every session — to look at files that were never among them.
//
// Two answers are deliberately different, and conflating them is the bug this would
// otherwise have: `[]` means "walk NOTHING" (there are no globs, so nothing can match),
// while `[""]` means "walk EVERYTHING" (some glob starts with a wildcard, so it has no
// prefix to start from and honesty costs a full walk).
export function globRoots(globs) {
  const roots = [];
  for (const glob of globs) {
    const segments = glob.split("/");
    const stable = segments.slice(0, firstWildcard(segments));
    if (stable.length === 0) return [""]; // no prefix at all: the whole tree, and say so
    roots.push(stable.join("/"));
  }
  // A root that contains another makes the inner one redundant, and keeping both would
  // walk the same subtree twice — handing the caller one path under two entries.
  return roots.filter((root, i) => !roots.some((other, j) => j !== i && contains(other, root)));
}

function firstWildcard(segments) {
  const at = segments.findIndex((segment) => segment.includes("*") || segment.includes("?"));
  return at === -1 ? segments.length : at;
}

// Containment on SEGMENT boundaries, never bare string prefixes: `.claude/skills` must
// not swallow `.claude/skillsets`. Equal roots are handled by index, so the first of a
// duplicate pair survives and the second does not eat it.
function contains(outer, inner) {
  return outer === inner ? false : inner.startsWith(outer + "/");
}
