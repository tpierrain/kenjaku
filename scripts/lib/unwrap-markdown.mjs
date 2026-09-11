// ═══════════════════════════════════════════════════════════════════════════
// unwrap-markdown.mjs — PURE rewriting of hard-wrapped Markdown. No I/O.
//
// One paragraph = one line, however long. This undoes a line break that the
// CONTENT never asked for, and only that one: a break that carries meaning —
// a blank line, a new list item, a table row, a heading, a fenced block, a YAML
// key, an explicit hard break — is left exactly where it is.
//
// The risk is entirely on that second half. A rewriter that joins too eagerly is
// worse than no rewriter at all: it turns a table into a sentence and a note's
// frontmatter into one unparseable key, silently, in a file the owner trusts. So
// every predicate below is a REFUSAL to join, and the default is to leave the
// line where it was found.
// ═══════════════════════════════════════════════════════════════════════════

// A line that opens a block of its own — it may never be swallowed by the line
// above it, and (except a list item, which owns its continuation) may not swallow
// the line below either.
const HEADING = /^#{1,6}\s/;
const HORIZONTAL_RULE = /^(-{3,}|\*{3,}|_{3,})$/;
const FENCE = /^\s*(```|~~~)/;
const TABLE_ROW = /^\s*\|/;
const HTML_BLOCK = /^\s*</;
const LIST_ITEM_START = /^([-*+]|\d+[.)])\s/;

// Markdown's two spellings of a break the author MEANT: two trailing spaces, or a
// trailing backslash. Joining through one of those destroys an intention rather
// than an accident, which is the one thing this tool must never do.
const EXPLICIT_HARD_BREAK = /(\s{2}|\\)$/;

const FRONTMATTER_DELIMITER = "---";

// Peel the blockquote prefixes off a line, returning the quote prefix it carried
// and what it actually says. Two lines only ever join under the SAME prefix: `>`
// and `>>` are different blocks, and merging them would re-attribute a quote.
//
// The prefix is rebuilt as a normalised string rather than counted, so that the
// thing compared IS the quote context ("> " and ">   " are the same block) instead
// of a number that happens to stand for it.
function peelQuote(line) {
  let quote = "";
  let content = line;
  while (/^\s*>/.test(content)) {
    quote += ">";
    // No `^` needed twice over — the loop condition above has already established
    // that the line starts with the prefix, so the leftmost match IS that one.
    // Kept anchored anyway: a reader should not have to re-derive that.
    content = content.replace(/^\s*>\s?/, "");
  }
  return { quote, content };
}

// Does this line open a block of its own? Used in both directions — a line that
// opens a block is never absorbed, and never absorbs.
function opensItsOwnBlock(content) {
  const trimmed = content.trim();
  return trimmed === "" || HEADING.test(trimmed) || HORIZONTAL_RULE.test(trimmed) || TABLE_ROW.test(content) || HTML_BLOCK.test(content);
}

// May this line be pulled up into the one above it? Everything `opensItsOwnBlock`
// refuses, plus a new list item: `- a` following `- b` is a sibling, not a
// continuation, so the list would collapse into a single bullet.
function isContinuation(content) {
  return !opensItsOwnBlock(content) && !LIST_ITEM_START.test(content.trim());
}

// A document read on Windows arrives CRLF (CONVENTIONS §9). Splitting on "\n"
// alone leaves the "\r" glued to each line, so a join buries a carriage return
// INSIDE the paragraph — invisible on the machine we develop on, corrupt
// everywhere else. Detect the ending once, split on either, re-emit the one found.
function lineEndingOf(text) {
  return text.includes("\r\n") ? "\r\n" : "\n";
}

export function unwrapMarkdown(text) {
  const eol = lineEndingOf(text);
  const lines = text.split(/\r?\n/);
  const out = [];
  let inFence = false;
  let inFrontmatter = false;
  // Where the last line that can still absorb another was emitted, and under which
  // quote prefix. `null` means the next line starts fresh whatever it says.
  let openLine = null;

  const emitVerbatim = (line) => {
    out.push(line);
    openLine = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Frontmatter is the note's metadata: every break in it is structural, and
    // joining two keys makes the whole block unparseable. Only a `---` on the
    // very first line opens it — anywhere else `---` is a horizontal rule.
    if (i === 0 && line.trim() === FRONTMATTER_DELIMITER) {
      inFrontmatter = true;
      emitVerbatim(line);
      continue;
    }
    if (inFrontmatter) {
      if (line.trim() === FRONTMATTER_DELIMITER) inFrontmatter = false;
      emitVerbatim(line);
      continue;
    }

    // Inside a fenced block the line breaks ARE the content.
    if (FENCE.test(line)) {
      inFence = !inFence;
      emitVerbatim(line);
      continue;
    }
    if (inFence) {
      emitVerbatim(line);
      continue;
    }

    const { quote, content } = peelQuote(line);

    if (openLine !== null && openLine.quote === quote && isContinuation(content)) {
      const previous = out[openLine.index];
      if (!EXPLICIT_HARD_BREAK.test(previous)) {
        // Trim both sides of the seam so the join is exactly one space, whatever
        // indentation the wrap left behind. At most ONE trailing whitespace can
        // reach here: two of them are already a hard break, refuted just above.
        out[openLine.index] = previous.trimEnd() + " " + content.trim();
        continue;
      }
    }

    out.push(line);
    // A list item DOES absorb what follows it (its own continuation lines), which
    // is why this is `opensItsOwnBlock` and not `isContinuation`.
    openLine = opensItsOwnBlock(content) ? null : { index: out.length - 1, quote };
  }

  return out.join(eol);
}
