// ─────────────────────────────────────────────────────────────────────────────
// ci-path-filter.mjs — what CI is allowed to SKIP, and the reading of it.
//
// A `paths-ignore:` entry is the one CI change that cannot be seen: the run is
// green, it is faster, and nothing anywhere says a suite no longer runs. So the
// list is not left to a reviewer's eye — it is parsed, and the guard beside this
// module holds it to one directory.
//
// Why a hand-rolled reader and not a YAML parser: the harness suites run in the
// CI step that installs NO dependencies (`.github/workflows/ci.yml`, "Harness
// tests"), so `js-yaml` is not resolvable there. A guard that silently skipped in
// the one place it matters would be worse than no guard, so the two shapes GitHub
// accepts — a block list and an inline list — are both read here, and an
// unrecognised shape yields nothing rather than a false all-clear (the confinement
// test then reads an empty list, and the "the filter exists" test goes red).
// ─────────────────────────────────────────────────────────────────────────────

// The ONLY thing a commit may change without the suite running. Plans, and nothing
// else: they are the project's own record-keeping (what is next, what was decided),
// no shipped file reads them, and no test asserts on their content. Everything else
// in this repo either runs on a user's machine or is asserted by a test — including
// `templates/**`, which IS the product, and `maintainers/decisions/**`, which the
// doctrine guards read.
export const ALLOWED_IGNORE_PREFIXES = ["maintainers/plans/"];

/**
 * Every glob under every `paths-ignore:` in a workflow, in file order — one flat
 * list on purpose: the question this answers is "what can escape the suite", and
 * which trigger let it escape does not change the answer.
 */
export function ignoredGlobs(yamlText) {
  // Split on the line ending, `\r` included: a Windows checkout hands this function
  // CRLF, and in JavaScript `\r` is a LINE TERMINATOR — `.` never matches it and `$`
  // never matches before it. Splitting on `\n` alone therefore leaves a `\r` that makes
  // every `$`-anchored pattern below fail, and the failure is SILENT: the reader returns
  // "this workflow filters nothing", which is indistinguishable from a clean workflow.
  const lines = (yamlText ?? "").split(/\r?\n/);
  const globs = [];

  for (let i = 0; i < lines.length; i++) {
    const key = /^(\s*)paths-ignore:(.*)$/.exec(lines[i]);
    if (key === null) continue;

    const [, indent, inline] = key;
    if (inline.trim() !== "") {
      globs.push(...parseInlineList(inline));
      continue;
    }
    i = collectBlockItems(lines, i + 1, indent.length, globs) - 1;
  }
  return globs;
}

// The `- item` lines below a `paths-ignore:` key, until the first line that is
// neither one of them nor skippable. Returns where reading stopped, so the caller
// never re-reads a line it has already consumed.
function collectBlockItems(lines, from, keyIndent, out) {
  let i = from;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "" || line.trim().startsWith("#")) continue;

    const item = /^(\s*)-\s+(.+?)\s*$/.exec(line);
    if (item === null || item[1].length <= keyIndent) break;
    out.push(unquote(item[2]));
  }
  return i;
}

function parseInlineList(text) {
  const inside = /^\s*\[(.*)\]\s*$/.exec(text);
  if (inside === null) return [];
  return inside[1]
    .split(",")
    .map((entry) => unquote(entry.trim()))
    .filter((entry) => entry !== "");
}

function unquote(value) {
  const quoted = /^(["'])(.*)\1$/.exec(value);
  return quoted === null ? value : quoted[2];
}

/**
 * The globs that would leave real code untested — i.e. everything the allow-list
 * does not cover. Empty is the only acceptable answer for this repo's own workflow.
 * The prefixes carry their trailing slash, so `maintainers/plans-and-studies/**` is
 * NOT the plans directory and is named here.
 */
export function unsafeIgnores(globs, allowed = ALLOWED_IGNORE_PREFIXES) {
  return (globs ?? []).filter((glob) => !allowed.some((prefix) => glob.startsWith(prefix)));
}
