import matter from "gray-matter";
import { load as yamlLoad } from "js-yaml";
import { DEFAULT_UNIVERSE } from "./universe.js";

// gray-matter 4.x defaults to js-yaml 3's `safeLoad`, removed in js-yaml 4. We force
// the patched js-yaml >=4.2.0 (GHSA-h67p-54hq-rp68: quadratic-complexity DoS in merge
// keys, all <=4.1.1 vulnerable, no patched 3.x) and route YAML through `load`, which
// is safe by default in js-yaml 4 — so frontmatter parsing keeps working, patched.
const GRAY_MATTER_OPTIONS = {
  engines: { yaml: (input: string) => yamlLoad(input) as object },
} as const;

export interface ParsedDocument {
  frontmatter: Record<string, unknown>;
  content: string;
  type: string;
  tags: string[];
  title: string;
  /** Clickable source link for mirror notes (Notion); null for plain notes. */
  sourceUrl: string | null;
  /**
   * The normalized keys of what this note was captured from (ADR 0041) — the
   * MACHINE half, beside `sourceUrl`'s human one. Empty for every note written
   * before that decision, which reads as UNKNOWN and never as "drew on nothing".
   */
  sources: string[];
  /** Soft retrieval scope (ADR 0034); the default universe when unset. */
  universe: string;
}

const TYPE_BY_PREFIX: [string, string][] = [
  ["daily/", "daily"],
  ["people/", "person"],
  ["topics/", "topic"],
  ["decisions/", "decision"],
  ["meetings/", "meeting"],
  ["prep-1-1/", "prep-1-1"],
  ["prep-day/", "prep-day"],
  ["backlog/", "backlog"],
  ["coaching/", "coaching"],
  ["initiatives/", "initiative"],
  ["raw-sources/", "raw-source"],
  ["briefings/", "briefing"],
  ["domains/", "domain"],
  ["drafts/", "draft"],
  ["articles/", "article"],
];

function detectType(
  relativePath: string,
  fm: Record<string, unknown>,
  universe: string
): string {
  if (typeof fm.type === "string") return fm.type;
  // A created universe's notes live under vault/<universe>/<type>/… . Strip that
  // leading universe segment (only when it is the note's DECLARED non-default
  // universe) so folder-based type detection still sees the nested type (ADR 0034).
  const path =
    universe !== DEFAULT_UNIVERSE && relativePath.startsWith(`${universe}/`)
      ? relativePath.slice(universe.length + 1)
      : relativePath;
  for (const [prefix, type] of TYPE_BY_PREFIX) {
    if (path.startsWith(prefix)) return type;
  }
  return "other";
}

function extractTitle(
  content: string,
  relativePath: string,
  fm: Record<string, unknown>
): string {
  // An explicit frontmatter title wins: local-mirror pages carry their real title
  // here only (the file is named by Notion pageId, the body has no '# Heading').
  if (typeof fm.title === "string" && fm.title.trim()) return fm.title.trim();
  const match = content.match(/^#\s+(.+)$/m);
  if (match) return match[1].trim();
  const filename = relativePath.split("/").pop() ?? relativePath;
  return filename.replace(/\.md$/, "");
}

/**
 * The one damage our own consolidation inflicted on a real note (F12): a second
 * `updated:` appended instead of the first being replaced. js-yaml refuses the file —
 * rightly — but says "duplicated mapping key (6:1)", which names neither the key nor
 * the way out. We only look once the YAML has ALREADY failed, so this can never turn
 * a note the parser accepts into an error: it upgrades a message, it adds no verdict.
 */
export function findDuplicateKey(
  raw: string
): { key: string; first: number; second: number } | null {
  const lines = raw.split("\n");
  // `split` always yields at least one string, even on "" — no optional chain
  // needed, and one there would be a branch no note can take.
  if (lines[0].trim() !== "---") return null;
  const seenAtLine = new Map<string, number>();
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") break;
    // Top-level keys only (anchored, unindented): a nested `updated:` under another
    // key is a different mapping, and YAML accepts it. The character class is
    // deliberately strict — and identical to `duplicateFrontmatterKeys` in
    // scripts/lib/note-refresh.mjs, the sibling scan. A permissive "anything up to a
    // colon" also swallows unindented block-sequence items whose value holds a colon
    // (`- https://a.com`), and reports a key that does not exist.
    const key = lines[i].match(/^([A-Za-z0-9_-]+):/)?.[1];
    if (key === undefined) continue;
    const first = seenAtLine.get(key);
    if (first !== undefined) return { key, first, second: i + 1 };
    seenAtLine.set(key, i + 1);
  }
  return null;
}

/**
 * The consequence a damaged note carries, in one place. The crosscheck (F15) appends the
 * same warning to parser messages that do NOT already state it — so this sentence has one
 * owner, and no report can end up saying it twice in a row.
 */
export const STALE_ANSWER_CLAUSE =
  "keeps answering from the content it was last indexed with";

function parseRaw(raw: string): { data: Record<string, unknown>; content: string } {
  try {
    return matter(raw, GRAY_MATTER_OPTIONS);
  } catch (err) {
    const duplicate = findDuplicateKey(raw);
    if (!duplicate) throw err;
    throw new Error(
      `damaged front-matter key "${duplicate.key}": declared twice, on lines ` +
        `${duplicate.first} and ${duplicate.second}. A note can only carry one — ` +
        `until one of them is removed, this note ${STALE_ANSWER_CLAUSE}.`
    );
  }
}

export function parseDocument(raw: string, relativePath: string): ParsedDocument {
  const { data: frontmatter, content } = parseRaw(raw);
  const universe =
    typeof frontmatter.universe === "string" && frontmatter.universe.trim()
      ? frontmatter.universe.trim()
      : DEFAULT_UNIVERSE;
  const type = detectType(relativePath, frontmatter, universe);
  const tags = Array.isArray(frontmatter.tags)
    ? frontmatter.tags.map(String)
    : [];
  const title = extractTitle(content, relativePath, frontmatter);
  const sourceUrl =
    typeof frontmatter.source_url === "string" ? frontmatter.source_url : null;
  // A lone key is one source: YAML gives back a scalar for `sources: drive|1A2b`
  // and an array for the inline list, and both mean the same thing to a reader.
  const rawSources = frontmatter.sources;
  const sources = (Array.isArray(rawSources) ? rawSources : [rawSources])
    .filter((v) => typeof v === "string" && v.trim() !== "")
    .map((v) => (v as string).trim());
  return { frontmatter, content, type, tags, title, sourceUrl, sources, universe };
}
