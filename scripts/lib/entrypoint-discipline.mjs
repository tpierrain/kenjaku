// Deterministic guards for the two structural shapes the v4.8.0 mutation pass
// named as debt (maintainers/mutation/RESULTS.md § v4.8.0):
//
//   1. the hand-rolled entry-guard block — code no test can import, hence 0 %;
//   2. a child process whose request is composed AT the call site — a request no
//      test can assert, which is where defaultGit's 21 survivors lived.
//
// Same spirit and same shape as assert-matcher-lint.mjs: pure scanners over a
// source string here, one repo-wide fail-loud test next door. Cheap and
// conservative by design — no JS parser, only shapes we can read mechanically.

// ─────────────────────────────────────────────────────────────────────────────
// 1. Hand-rolled entry detection
// ─────────────────────────────────────────────────────────────────────────────

// Every spelling that is not the shared tail. `process.argv[1]` is the giveaway:
// the tail hands `process.argv` over WHOLE, so a top-level script has no reason
// to index it. `isEntrypoint(`/`isEntryPoint(` catch the predicate being used raw.
const GUARD_TOKENS = ["isEntrypoint(", "isEntryPoint(", "process.argv[1]"];

// Returns [{ line, token }] for every hand-rolled entry-detection token, in
// source order — a file's own line order is what makes the report readable.
export function findHandRolledGuards(source) {
  // Comments are blanked first: a file that documents the predicate it used to
  // carry must not be counted as still carrying it, or the ceiling could never
  // reach zero without silencing the history that explains the fix.
  const clean = stripComments(source);
  const findings = [];
  for (const token of GUARD_TOKENS) {
    let from = 0;
    for (;;) {
      const at = clean.indexOf(token, from);
      if (at === -1) break;
      from = at + token.length;
      findings.push({ line: lineOf(clean, at), token, at });
    }
  }
  return findings
    .sort((a, b) => a.at - b.at)
    .map(({ line, token }) => ({ line, token }));
}

// True when the module ends its body behind the shared tail rather than running
// it at import. A mention inside a comment does not count — it is the call that
// makes the body importable, not the intention to write one.
export function hasEntrypointTail(source) {
  return /(^|[^.\w])runAsEntrypoint\s*\(/.test(stripComments(source));
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. A child process built and executed in the same call
// ─────────────────────────────────────────────────────────────────────────────

const RUNNERS = ["spawnSync", "spawn", "execFileSync", "execFile", "execSync", "fork"];

// Returns [{ line, runner, kind }] — one finding per inline argument, where kind
// is "args-array" (an array literal where the arguments belong) or
// "options-object" (an object literal where the options belong). Both mean the
// invocation was never a value, so no test can assert what was actually run.
export function findInlineInvocations(source) {
  const clean = stripComments(source);
  const findings = [];
  for (const runner of RUNNERS) {
    let from = 0;
    for (;;) {
      const at = clean.indexOf(runner, from);
      if (at === -1) break;
      from = at + runner.length;
      // `mySpawnSync` is not `spawnSync`; `child_process.spawnSync` is.
      const before = clean[at - 1];
      if (before !== undefined && /[\w$]/.test(before)) continue;
      // A longer runner already matched here (`spawn` inside `spawnSync`).
      if (/[\w$]/.test(clean[at + runner.length] ?? "")) continue;
      const open = nextNonSpace(clean, at + runner.length);
      if (clean[open] !== "(") continue;

      for (const arg of topLevelArguments(clean, open + 1)) {
        if (arg.first === "[") findings.push({ line: lineOf(clean, at), runner, kind: "args-array", at });
        else if (arg.first === "{") findings.push({ line: lineOf(clean, at), runner, kind: "options-object", at });
      }
    }
  }
  return findings
    .sort((a, b) => a.at - b.at)
    .map(({ line, runner, kind }) => ({ line, runner, kind }));
}

// Walks a call's argument list from just after the opening `(`, and reports the
// first meaningful character of each top-level argument. Nesting and string
// literals are skipped, so a `{` inside a callback or a `[` inside a string
// never counts as an argument of its own.
function topLevelArguments(source, start) {
  const args = [];
  let nesting = 1;
  let quote = null;
  let expectingArgument = true;
  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (expectingArgument && !/\s/.test(ch)) {
      if (!(ch === ")" && nesting === 1)) args.push({ first: ch });
      expectingArgument = false;
    }
    if (ch === "'" || ch === '"' || ch === "`") quote = ch;
    else if (ch === "(" || ch === "[" || ch === "{") nesting++;
    else if (ch === ")" || ch === "]" || ch === "}") {
      nesting--;
      if (nesting === 0) return args;
    } else if (ch === "," && nesting === 1) expectingArgument = true;
  }
  return args; // unbalanced source: report what was read rather than crash
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
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
// guard token counted as live code, and this module's ceilings are declared to only
// ever go DOWN. A sentence of prose could push a file over one.
function stripComments(source) {
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

function nextNonSpace(source, from) {
  let i = from;
  while (i < source.length && /\s/.test(source[i])) i++;
  return i;
}

function lineOf(source, index) {
  let line = 1;
  for (let i = 0; i < index; i++) if (source[i] === "\n") line++;
  return line;
}
