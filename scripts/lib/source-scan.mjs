// ─────────────────────────────────────────────────────────────────────────────
// source-scan.mjs — the shared, parser-free reading of a JavaScript source that
// the repo's deterministic guards all need before they can look for anything:
// blank the comments, and turn an index back into a line number.
//
// Extracted from `entrypoint-discipline.mjs` when a SECOND guard needed it
// (`engine-script-coupling.mjs`, T2 of the v5.0.0 review). It is deliberately
// not a parser: cheap, conservative, and honest about its one blind spot below.
// ─────────────────────────────────────────────────────────────────────────────

// A `/` opens a REGEX LITERAL rather than a division when what precedes it cannot
// end an expression (F12). The everyday heuristic, and the only one available
// without a parser: after a value — a name, a number, `)`, `]`, a template's
// backtick — a slash divides; after an operator, a comma, an opening bracket or
// nothing at all, it opens a literal. The keyword list is the exception the plain
// "is the last character a letter?" rule gets exactly backwards: `return /x/` and
// `typeof /x/` end in letters and are followed by regexes.
//
// Its limit, stated rather than hidden: `if (a) /re/.test(b)` reads as a division,
// because `)` genuinely ends an expression far more often than it precedes a
// literal. The cost of that miss is one line, never the file — see below.
const ENDS_A_VALUE = /[\w$)\]`]$/;
const KEYWORD_BEFORE_REGEX = /\b(return|typeof|instanceof|case|in|of|new|delete|void|do|else|yield|await)$/;

function opensRegex(before) {
  const trimmed = before.replace(/\s+$/, "");
  if (trimmed === "") return true;
  if (KEYWORD_BEFORE_REGEX.test(trimmed)) return true;
  return !ENDS_A_VALUE.test(trimmed);
}

// Blanks out `//` and `/* */` comments, keeping every newline so reported line
// numbers still match the original file. Quote-aware, so a `//` inside a string
// (a URL) is not mistaken for a comment — and regex-aware, so the quotes and slash
// pairs that live inside a literal do not do it either.
//
// 🚨 F12 (v5.0.0 code review) — the regex half was missing, and it was not a
// theoretical gap: run this over the repo's own `scripts/**` and THIRTEEN files
// used to leave the scanner stuck inside a phantom string at end of file. One of
// them is production code delivered into every brain — `brain-locale.mjs`, whose
// `/BRAIN_LOCALE\s*=\s*"([^"]+)"/` carries an ODD number of quote characters. From
// that line on, in that file, nothing was stripped: every `//` note mentioning a
// guard token counted as live code, and the ceilings that read this are declared to
// only ever go DOWN. A sentence of prose could push a file over one.
export function stripComments(source) {
  let out = "";
  let quote = null;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (quote) {
      out += ch;
      if (ch === "\\") out += source[++i] ?? "";
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      quote = ch;
      out += ch;
      continue;
    }
    // Before the comment tests, because `/[//]/` and `/a\/\/b/` are literals whose
    // insides must not be read as a comment opener.
    if (ch === "/" && source[i + 1] !== "/" && source[i + 1] !== "*" && opensRegex(out)) {
      const literal = readRegexLiteral(source, i);
      if (literal !== null) {
        out += literal;
        i += literal.length - 1;
        continue;
      }
      // Not a literal after all (no closer before the newline). Fall through and
      // treat the slash as an ordinary character: a mis-read costs one slash, never
      // the rest of the file — which is the whole failure this guard is fixing.
    }
    if (ch === "/" && source[i + 1] === "/") {
      while (i < source.length && source[i] !== "\n") i++;
      out += "\n";
      continue;
    }
    if (ch === "/" && source[i + 1] === "*") {
      i += 2;
      while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) {
        if (source[i] === "\n") out += "\n";
        i++;
      }
      i++;
      continue;
    }
    out += ch;
  }
  return out;
}

// The literal starting at `from` (opening slash included, flags excluded — they are
// ordinary characters and copying them costs nothing), or `null` when there is no
// closing slash before the newline. Character classes are tracked because a `/`
// inside `[...]` does NOT close the literal, which is precisely the `[//]` case.
function readRegexLiteral(source, from) {
  let inClass = false;
  for (let i = from + 1; i < source.length; i++) {
    const ch = source[i];
    if (ch === "\n") return null;
    if (ch === "\\") {
      i++;
      continue;
    }
    if (ch === "[") inClass = true;
    else if (ch === "]") inClass = false;
    else if (ch === "/" && !inClass) return source.slice(from, i + 1);
  }
  return null;
}

// 1-based line number of `index` in `source`.
export function lineOf(source, index) {
  let line = 1;
  for (let i = 0; i < index; i++) if (source[i] === "\n") line++;
  return line;
}
