// ─────────────────────────────────────────────────────────────────────────────
// note-parse.mjs — the pure, I/O-free reader for a note's frontmatter + body.
//
// Dependency-free on purpose: the launcher ships no gray-matter, and the keys the
// brain's own tooling cares about (type / created / updated / tags / universe /
// displayName…) fit a small YAML subset — scalars and an inline `key: [a, b]`.
//
// Extracted from wiki-lint-io.mjs (which still re-exports it) so a PURE core can
// read a note without importing an fs adapter.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse one Markdown file's raw text into { frontmatter, body, fenced }. Pure.
 *
 * `fenced` says whether the note OPENED a frontmatter block at all, and it is not
 * decoration: a note with no block is an ordinary note, while a block that yields
 * no keys is damage (issue #81). The measured case is `  type: prep-1-1` indented
 * by two spaces — invalid YAML, which the engine's indexer refuses outright while
 * this dependency-free reader simply skips the line. Without `fenced` the two are
 * the same empty object, and the damage cannot be named.
 */
export function parseNote(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: raw, fenced: false };
  const frontmatter = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, rawValue] = kv;
    const inlineList = rawValue.match(/^\[(.*)\]$/);
    frontmatter[key] = inlineList
      ? inlineList[1].split(",").map((v) => v.trim()).filter((v) => v !== "")
      : rawValue.trim();
  }
  return { frontmatter, body: match[2], fenced: true };
}
