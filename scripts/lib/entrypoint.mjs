// ─────────────────────────────────────────────────────────────────────────────
// entrypoint.mjs — "is this module the process entry point?" predicate.
//
// The idiom `import.meta.url === file://${process.argv[1]}` is a hand-rolled URL
// that breaks whenever argv[1] is not already a well-formed, percent-encoded file
// URL path: Windows paths (backslashes, `C:` drive letter) and any path with a
// space or other char that must be percent-encoded. `import.meta.url` is always a
// canonical file URL, so the two never match there → the guarded top-level block
// silently never runs (bug B2). Compare through the SAME canonicalisation the
// runtime uses instead.
// ─────────────────────────────────────────────────────────────────────────────
import { pathToFileURL } from "node:url";
import { realpathSync } from "node:fs";

// True when `metaUrl` (an import.meta.url) denotes the same file as `argv1`
// (a process.argv[1] filesystem path) — i.e. this module is the entry point.
// Canonicalise argv1 through pathToFileURL (the same transform the runtime applies
// to build import.meta.url) so backslashes, drive letters and spaces all match —
// and through realpathSync first (review, v4.9.1): Node realpath-resolves the
// main module, so a SYMLINKED argv1 (macOS /var → /private/var, any aliased
// brain path) never matched and the guarded block silently skipped. A path that
// does not resolve (unit tests use fictional ones) is compared as spelled.
// The shared tail of every top-level scripts/*.mjs: runs `fn` only when this
// module IS the process entry point, and turns its result into the exit code.
//
// Why it exists (debt 1 of the v4.8.0 mutation pass): the hand-rolled
// `if (isEntrypoint(…)) { …body… }` block is code no test can import, so it
// scores 0 % — the files whose WHOLE body is that shape scored exactly that.
// Passing the body in as a function makes it an ordinary exported function, and
// leaves one mechanical line here, tested once.
//
// The exit contract, deliberately narrow: a NUMERIC result exits with it,
// anything else exits nothing. The bodies that already fall through to the
// natural exit 0 (auto-commit's hook) must keep doing exactly that — an
// unconditional exit would change their behaviour. A thenable result is awaited
// first, so an async body is never killed mid-flight.
export function runAsEntrypoint(metaUrl, argv, fn, { exit = process.exit } = {}) {
  if (!isEntrypoint(metaUrl, argv?.[1])) return false;
  const outcome = fn(argv.slice(2));
  if (typeof outcome?.then === "function") {
    return outcome.then((code) => {
      exitWith(code, exit);
      return true;
    });
  }
  exitWith(outcome, exit);
  return true;
}

function exitWith(code, exit) {
  if (typeof code === "number") exit(code);
}

export function isEntrypoint(metaUrl, argv1) {
  if (!argv1) return false;
  let path = argv1;
  try {
    path = realpathSync(argv1);
  } catch {
    // Nonexistent argv1: fall back to the literal spelling — it can still match
    // a metaUrl built from the same fictional path, never a real module's.
  }
  return metaUrl === pathToFileURL(path).href;
}
