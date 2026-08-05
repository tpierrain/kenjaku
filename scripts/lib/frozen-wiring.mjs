// ─────────────────────────────────────────────────────────────────────────────
// frozen-wiring.mjs — which of a set of paths a Claude session FREEZES when it
// starts (F20). Pure decider; the caller supplies the paths (session-status.mjs
// hands it the pull's own `git diff --name-only ORIG_HEAD HEAD`).
//
// Why a list of its own rather than the manifest's regimes: the question here is
// not "does an upgrade own this file" but "did THIS session already load it". A
// skill the owner wrote themselves is in no regime and is frozen all the same;
// `engine-manifest.json` is in no regime either, and it is the version vector
// every other surface quotes. The two sets overlap, they are not the same set.
//
// Paths are POSIX-shaped on every OS: git reports them that way, including on
// Windows. Nothing here joins or resolves — comparing is the whole job.
// ─────────────────────────────────────────────────────────────────────────────

// Everything under these lives in the session's frozen picture: the hooks it wired,
// the skills and settings it read, the staged skills a reconcile installs from, and
// the two MCP servers it spawned.
const FROZEN_PREFIXES = [
  "scripts/",
  ".claude/",
  "engine-skills/",
  "rag/",
  "local-mirror/",
  "CLAUDE.", // CLAUDE.md, CLAUDE.engine.md, CLAUDE.md.template — the constitution it loaded
];

// Two single files with no folder to stand for them.
const FROZEN_FILES = new Set(["engine-manifest.json", ".mcp.json.template"]);

/** The paths in a `git diff --name-only` stdout. Splits on either line ending, drops blanks. */
export function pulledPaths(diffOut) {
  return diffOut.split(/\r?\n/).filter((line) => line.trim().length > 0);
}

/** The subset of `paths` this session froze at start — empty when a pull brought only notes. */
export function frozenWiringIn(paths) {
  return paths.filter((p) => FROZEN_FILES.has(p) || FROZEN_PREFIXES.some((prefix) => p.startsWith(prefix)));
}
