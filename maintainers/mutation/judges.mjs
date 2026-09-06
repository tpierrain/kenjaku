// ─────────────────────────────────────────────────────────────────────────────
// judges.mjs — which tests are allowed to judge a mutant.
//
// THE BILL THIS PAYS. The harness runner uses Stryker's `command` runner with
// `coverageAnalysis: 'off'`, and its command is the WHOLE suite. So every mutant
// re-runs every test: ~50 s of suite to judge one changed operator, 81 min for a
// batch of 487. A mutant of the author-name registry is judged by the tests of the
// search engine, the installer and the sync — none of which can observe it, all of
// which pass whatever it does. Measured 2026-09-05, plan
// ../plans/prospective/harness-speed-and-test-quality-action.md § S1.
//
// 🛡️ THE SAFETY PROPERTY, and it is the only reason this is allowed to exist:
// NARROWING THE JUDGES CAN ONLY LOWER A SCORE, NEVER RAISE IT. Removing tests
// removes kills; it cannot invent one. Everything below therefore leans the same
// way — when in doubt, INCLUDE the test. An over-included judge costs seconds; a
// missing one manufactures a survivor, and a survivor costs a human's afternoon
// reading a mutant that was already dead.
//
// The two kinds of edge, because this repo has both:
//
//   1. IMPORTS, transitively. A test that imports a helper that imports the target
//      can kill the target's mutants, and dropping it is exactly the false survivor
//      above.
//   2. NAMES, as plain strings. The entry-point seam rule (test-first-discipline)
//      says every executable entry point is tested by RUNNING IT AS A PROCESS. Such
//      a test imports nothing at all — it spawns `node scripts/foo.mjs` — so it is
//      invisible to an import graph and is the single most valuable judge a script
//      has. A test that names any file in the reachable set is kept.
//
// Both are grown to a FIXED POINT together: a test that spawns a script that
// imports a helper that imports the target still judges the target.
// ─────────────────────────────────────────────────────────────────────────────

/** Set on the mutation run's child process; read by the Stryker configs. */
export const JUDGES_ENV = "KENJAKU_MUTATION_JUDGES";

/**
 * The fallback: the exact command this config has carried since the first campaign,
 * so every published figure in RESULTS.md was measured with it. A drift here would
 * silently change what a re-measurement is comparable to, which is why a test pins it
 * character for character. (CI runs a wider command — it adds `rag/*.test.mjs`.)
 */
export const WHOLE_SUITE = 'node --test "scripts/*.test.mjs" "scripts/lib/*.test.mjs"';

const isTest = (path) => path.endsWith(".test.mjs");

/**
 * `from "…"`, `import("…")` and the bare side-effect `import "…"`, in one pass.
 * Deliberately textual rather than a parse: it over-matches (a specifier inside a
 * comment or a string counts), and over-matching adds judges, which is the safe
 * direction. A parser would be exact and would fail closed on a syntax it does not
 * know, which is the unsafe one.
 */
const SPECIFIER = /(?:from|import)\s*\(?\s*["']([^"']+)["']/g;

/** `scripts/lib/a.mjs` + `../b.mjs` → `scripts/b.mjs`. Posix-only: these are repo paths, not OS paths. */
export function resolveFrom(fromPath, specifier) {
  const segments = [...fromPath.split("/").slice(0, -1), ...specifier.split("/")];
  const out = [];
  for (const segment of segments) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") {
      out.pop();
      continue;
    }
    out.push(segment);
  }
  return out.join("/");
}

/** The relative imports of one file that land inside the corpus. Package imports are not edges. */
function importsOf(path, source, known) {
  const found = new Set();
  for (const [, specifier] of source.matchAll(SPECIFIER)) {
    if (!specifier.startsWith(".")) continue;
    const resolved = resolveFrom(path, specifier);
    if (known.has(resolved)) found.add(resolved);
  }
  return found;
}

/**
 * Everything that can observe `target`: itself, whatever imports it (transitively),
 * and whatever NAMES any of that as a string. Grown to a fixed point, so a cycle
 * terminates and a spawn chain is followed.
 */
function observersOf(target, sources, known) {
  const reached = new Set([target]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const [path, source] of Object.entries(sources)) {
      if (reached.has(path)) continue;
      const imports = importsOf(path, source, known);
      const seesByImport = [...imports].some((dep) => reached.has(dep));
      const seesByName = [...reached].some((member) => source.includes(member));
      if (!seesByImport && !seesByName) continue;
      reached.add(path);
      grew = true;
    }
  }
  return new Set([...reached].filter(isTest));
}

/**
 * The tests that may judge `targets`, or a refusal.
 *
 * @param {Record<string, string>} sources every `.mjs` of the measured package, path → text
 * @param {string[]} targets the production paths about to be mutated
 * @returns {{files: string[]|null, why: string|null}} `files: null` means "do not narrow" —
 *   the caller falls back to {@link WHOLE_SUITE}, which is slow and correct.
 */
export function judgingTests(sources, targets) {
  const known = new Set(Object.keys(sources));
  const all = new Set();

  for (const target of targets) {
    // A mistyped target would otherwise narrow to nothing and report every mutant
    // survived — the same class as the "0 mutants, score n/a" refusal in mutate-one.
    if (!known.has(target)) {
      return { files: null, why: `${target} is not in the measured package — refusing to narrow the judges` };
    }
    const observers = observersOf(target, sources, known);
    if (observers.size === 0) {
      return { files: null, why: `no test can observe ${target} — refusing to narrow the judges` };
    }
    for (const observer of observers) all.add(observer);
  }

  return { files: [...all].sort(), why: null };
}

/** The runner command for an explicit list of test files. Order is the caller's. */
export function judgeCommand(files) {
  return `node --test ${files.map((file) => `"${file}"`).join(" ")}`;
}

/**
 * What a Stryker config should use as its `commandRunner.command`. Absent, empty or
 * blank variable → the whole suite: a variable that arrived empty is a wiring
 * accident, and it must never read as "judge this with nothing".
 */
export function commandFrom(env) {
  const listed = (env[JUDGES_ENV] ?? "")
    .split(",")
    .map((file) => file.trim())
    .filter(Boolean);
  return listed.length === 0 ? WHOLE_SUITE : judgeCommand(listed);
}
