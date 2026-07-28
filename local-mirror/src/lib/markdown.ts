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
  // `{ content }`, never the bare string: handed a string, gray-matter PARSES it as a whole
  // file, so a body opening with `---` (a Notion page whose first block is a divider) comes
  // back as characters scattered into the frontmatter and an emptied note. The body is a
  // payload to append, not a document to re-read.
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
  return toLocalMirrorMarkdown(
    String(data.mirror),
    {
      id: String(data.source_id),
      title: String(data.title),
      url: String(data.source_url),
      lastEditedTime: String(data.last_edited_time),
    },
    content,
    universe,
  );
}

/** Read back a local-mirror note (frontmatter + body) using the same js-yaml-4 engine. */
export function parseLocalMirrorMarkdown(raw: string): { data: Record<string, unknown>; content: string } {
  const { data, content } = matter(raw, YAML_ENGINE);
  return { data, content };
}
