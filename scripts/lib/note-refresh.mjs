// ─────────────────────────────────────────────────────────────────────────────
// note-refresh.mjs — the pure, I/O-free core of REFRESHING a living page: append
// a dated section and bump `updated:` BY KEY (ADR 0009 rung 1).
//
// Why it exists (F12, verified on disk): consolidation used to describe this edit
// in prose and let the agent perform it freehand, so *"bump the page's `updated:`"*
// became *"add a second `updated:`"* on `topics/crise-kandor-clemence.md`. Two keys
// three lines apart is invalid YAML → the indexer's re-read failed on every
// campaign since → the error was swallowed (F10) → the note stayed searchable and
// confidently out of date, its newest section absent from the index. Four defects
// chained, none of them audible. Creation was already deterministic
// (`file-back-note.mjs`); only the refresh was left freehand, and that is the one
// that damaged a page.
// ─────────────────────────────────────────────────────────────────────────────

const FRONTMATTER_RE = /^(---\r?\n)([\s\S]*?)(\r?\n---\r?\n?)([\s\S]*)$/;

// The SAME renderer the builder uses (and the same refusals on a bad level or a
// missing basis). Two renderers would let a promoted card and a fresh one word
// their reliability differently, which is the fiction a checker with its own
// parser measures — F16, on the writing side.
import { confidenceLine } from "./filed-note.mjs";

/** Splits a note into its frontmatter block and body, or null when it has none. Pure. */
function splitNote(content) {
  const m = content.match(FRONTMATTER_RE);
  if (!m) return null;
  return { open: m[1], frontmatter: m[2], close: m[3], body: m[4] };
}

/**
 * The frontmatter keys declared more than once, in order of first appearance.
 * A duplicate key is invalid YAML: the note becomes unreadable to the indexer, and
 * this is a one-line check — the difference between a defect that announces itself
 * and one that does not.
 */
export function duplicateFrontmatterKeys(content) {
  const parts = splitNote(content);
  if (!parts) return [];
  const seen = new Set();
  const dupes = [];
  for (const line of parts.frontmatter.split(/\r?\n/)) {
    // Kept character-for-character in step with `findDuplicateKey` in
    // rag/src/lib/frontmatter-parser.ts: the two answer the same question on the same
    // notes, and when they drifted apart the looser one invented a key (`- https`)
    // out of a list of URLs. Separate packages, so the tie is this comment, not code.
    const kv = line.match(/^([A-Za-z0-9_-]+):/);
    if (!kv) continue;
    const key = kv[1];
    if (seen.has(key) && !dupes.includes(key)) dupes.push(key);
    seen.add(key);
  }
  return dupes;
}

const CONFIDENCE_BLOCK = /^> \*\*Confidence\*\* — .*$/m;

/**
 * Returns `body` with the confidence block written in the builder's own slot: under
 * the H1, after the homonymy block when there is one, above the prose. Used only
 * when the page carries no block yet — every card written before this shipped is in
 * exactly that shape, and moving the field alone would leave a card that says how
 * sure it is to a `grep` and nothing at all to the human reading it in Obsidian.
 * Pure.
 */
function insertConfidenceBlock(body, line) {
  const lines = body.split("\n");
  // The title is a heading at the START of a line — a "# " inside a sentence is
  // prose, and burying the marker under it would hide the very thing it states.
  // No heading at all is not a special case: the walk simply starts at the top,
  // which keeps the blank line the body opens with rather than doubling it.
  const h1 = lines.findIndex((l) => /^# /.test(l));
  let at = h1 + 1;
  // Past the blank line, then past the homonymy block if the card has one: WHICH
  // one comes before HOW SURE, because it is what makes the card usable to the
  // next resolution. Inserting higher would rewrite, one refresh at a time, a
  // layout the builder guarantees on every new card.
  while (at < lines.length && lines[at].trim() === "") at += 1;
  if (at < lines.length && /^> \*\*Which one\*\* — /.test(lines[at])) {
    at += 1;
    while (at < lines.length && lines[at].trim() === "") at += 1;
  }
  lines.splice(at, 0, line, "");
  return lines.join("\n");
}

/**
 * Returns the page's content with `updated:` set to `today` (replaced in place, or
 * appended to the frontmatter when the page had none) and `section` appended to the
 * body, separated by one blank line.
 *
 * THROWS rather than guessing: on a page with no frontmatter (refreshing implies a
 * living page the vault already owns — inventing one would guess its type and its
 * creation date), and on a page whose frontmatter is ALREADY damaged, which is named
 * instead of appended to. Appending to a damaged page would keep it unreadable and
 * hide the damage one refresh longer.
 */
export function refreshNote({ content, today, section, confidence }) {
  if (!today) throw new Error("today (YYYY-MM-DD) is required to bump `updated:`");
  const parts = splitNote(content);
  if (!parts) {
    throw new Error(
      "this page has no frontmatter — refreshing expects a living vault page, not a loose file",
    );
  }
  const dupes = duplicateFrontmatterKeys(content);
  if (dupes.length > 0) {
    throw new Error(
      `this page's frontmatter declares duplicate key(s): ${dupes.join(", ")}. ` +
        `That is invalid YAML, so the engine cannot read the page — fix it before refreshing.`,
    );
  }

  const lines = parts.frontmatter.split(/\r?\n/);
  const at = lines.findIndex((l) => /^updated:/.test(l));
  if (at === -1) lines.push(`updated: ${today}`);
  else lines[at] = `updated: ${today}`;

  // A re-verified card is promoted in BOTH places at once. Rewriting the field
  // and leaving the block (or the reverse) would leave the page asserting two
  // different things about its own reliability — the conflation this whole
  // block exists to end, reproduced inside the fix for it.
  let body = parts.body;
  if (confidence) {
    const rendered = confidenceLine(confidence);
    const key = lines.findIndex((l) => /^confidence:/.test(l));
    if (key === -1) lines.push(`confidence: ${confidence.level}`);
    else lines[key] = `confidence: ${confidence.level}`;
    // A FUNCTION replacement, never a string: the basis is free-form prose about a
    // source, and a string replacement expands `$&`, `` $` ``, `$'` and `$$` — a
    // basis quoting a rate as "$500" beside a "$&" spliced the OLD block back into
    // the new one, which is the two-different-things state this block exists to end.
    const line = `> **Confidence** — ${rendered}`;
    body = CONFIDENCE_BLOCK.test(body)
      ? body.replace(CONFIDENCE_BLOCK, () => line)
      : insertConfidenceBlock(body, line);
  }

  body = body.replace(/\s*$/, "");
  const appended = section ? `${body}\n\n${section.replace(/\s*$/, "")}\n` : `${body}\n`;
  return `${parts.open}${lines.join("\n")}${parts.close}${appended}`;
}
