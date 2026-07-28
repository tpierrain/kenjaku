// Markdown assembly — the thin contract local-mirror writes into the vault (PRD §6):
// the produced body plus mandatory citation frontmatter. This is *what local-mirror
// writes*, not a RAG requirement. Frontmatter via gray-matter (js-yaml under the hood).

import matter from 'gray-matter';
import { load as yamlLoad, dump as yamlDump } from 'js-yaml';
import type { SourceItem } from '../domain/ports.js';

// gray-matter 4.x defaults to js-yaml 3's `safeLoad`/`safeDump`, both removed in
// js-yaml 4. We force the patched js-yaml >=4.2.0 (GHSA-h67p-54hq-rp68 DoS, all
// <=4.1.1 vulnerable, no patched 3.x) and route gray-matter's YAML through js-yaml
// 4's `load`/`dump` — safe by default. `stringify` (write) is the production path;
// `parse` (read) backs the round-trip assertions in tests.
const YAML_ENGINE = {
  engines: {
    yaml: {
      parse: (input: string) => yamlLoad(input) as object,
      stringify: (obj: object) => yamlDump(obj),
    },
  },
} as const;

/** The frontmatter stamped on every produced note (PRD §6). */
export interface LocalMirrorFrontmatter {
  mirror: string;
  source_id: string;
  title: string;
  /** Source URL — indispensable for the citation (without it, no clickable link). */
  source_url: string;
  /** Notion last_edited_time — feeds the watermark. */
  last_edited_time: string;
  /** Retrieval universe (ADR 0034), stamped LAST and only when the mirror is universe-scoped. */
  universe?: string;
}

/** The keys every produced note carries, and the ones a move rebuilds from (`universe` apart). */
const REQUIRED_FRONTMATTER = [
  'mirror',
  'source_id',
  'title',
  'source_url',
  'last_edited_time',
] as const;

/**
 * Assemble one note: produced body + mandatory citation frontmatter (PRD §6). When `universe`
 * is truthy it is stamped LAST (matching `stamp-universe.mjs`'s append-last convention, so the
 * mirror's frontmatter reads like an imported note's).
 */
export function toLocalMirrorMarkdown(
  mirror: string,
  item: SourceItem,
  body: string,
  universe?: string,
): string {
  const frontmatter: LocalMirrorFrontmatter = {
    mirror: mirror,
    source_id: item.id,
    title: item.title,
    source_url: item.url,
    last_edited_time: item.lastEditedTime,
  };
  if (universe) frontmatter.universe = universe;
  return renderNote(frontmatter, body);
}

/**
 * The single write path: frontmatter block + body, appended verbatim.
 *
 * `{ content }`, never the bare string: handed a string, gray-matter PARSES it as a whole file,
 * so a body opening with `---` (a Notion page whose first block is a divider) comes back as
 * characters scattered into the frontmatter and an emptied note. The body is a payload to
 * append, not a document to re-read.
 */
function renderNote(frontmatter: object, body: string): string {
  return matter.stringify({ content: body }, frontmatter, YAML_ENGINE);
}

/**
 * Re-file a produced note into another universe (ADR 0034): the note is REBUILT through
 * `toLocalMirrorMarkdown`, so a moved note is byte-identical to the one a sync would write
 * there — otherwise the next sync would see a hash mismatch and rewrite every page. Passing no
 * universe (the cross-cutting scope) drops the key, which is what "default" means on disk.
 */
export function reuniverseLocalMirrorMarkdown(raw: string, universe?: string): string {
  const { data, content } = parseLocalMirrorMarkdown(raw);
  // A note stripped of its citation frontmatter cannot be rebuilt into a valid one — it would
  // land in the new folder indexed and uncitable. Naming every missing key is what tells the
  // owner which note to repair. Refusing here throws inside phase 1 of the move, which rolls the
  // new copies back and leaves the old corpus untouched.
  const missing = REQUIRED_FRONTMATTER.filter((key) => !data[key]);
  if (missing.length > 0) {
    throw new Error(
      `this note is missing the local-mirror frontmatter a move rebuilds from: ${missing.join(', ')}`,
    );
  }
  // Every key the note carries is kept, in place — a `tags:` the owner added, a key a later
  // engine version stamps. Rebuilding from the five fields this module knows would DELETE the
  // rest, and a move only re-files a note. `universe` alone is re-stamped, last.
  const { universe: _previous, ...kept } = data;
  const frontmatter: Record<string, unknown> = { ...kept };
  if (universe) frontmatter.universe = universe;
  return renderNote(frontmatter, content);
}

/** Read back a local-mirror note (frontmatter + body) using the same js-yaml-4 engine. */
export function parseLocalMirrorMarkdown(raw: string): { data: Record<string, unknown>; content: string } {
  const { data, content } = matter(raw, YAML_ENGINE);
  return { data, content };
}
