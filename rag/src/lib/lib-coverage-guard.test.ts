import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "fs";
import { dirname, join, relative, sep } from "path";
import { fileURLToPath } from "url";

const here = dirname(fileURLToPath(import.meta.url));
const ragRoot = join(here, "..", "..");

// Modules under src/lib that intentionally ship WITHOUT a sibling unit test.
// Adding a name here must be a CONSCIOUS, reviewed decision with a reason in the
// comment — never a silent skip. Empty by design: the document-scanner /
// vault-watcher 0%-mutation gap came precisely from "it's just I/O glue, no test
// needed" dismissals. Pure I/O glue still hides logic; extract it behind a port
// and test it (see maintainers/CONVENTIONS.md, "Test the glue too").
const EXEMPT = new Set<string>([]);

// Deterministic guardrail (ADR 0009 spirit): every logic module in src/lib must
// carry a sibling *.test.ts. Catches the "no test at all" gap instantly — without
// waiting for a mutation run — and fails LOUD with the offending file names.
test("every src/lib module has a sibling *.test.ts (no silently-untested logic)", () => {
  const entries = readdirSync(here);
  const tests = new Set(entries.filter((f) => f.endsWith(".test.ts")));
  const prod = entries.filter(
    (f) => f.endsWith(".ts") && !f.endsWith(".test.ts") && !f.endsWith(".d.ts")
  );

  const missing = prod.filter(
    (f) => !EXEMPT.has(f) && !tests.has(f.replace(/\.ts$/, ".test.ts"))
  );

  assert.deepEqual(
    missing,
    [],
    `These src/lib modules have no sibling test (add one, or justify in EXEMPT): ${missing.join(", ")}`
  );
});

/** Every directory under `rag/` that holds at least one `*.test.ts`, relative to `rag/`. */
function directoriesHoldingTests(from: string): string[] {
  const found = new Set<string>();
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".test.ts")) found.add(relative(from, dir).split(sep).join("/"));
    }
  };
  walk(join(from, "src"));
  return [...found].sort();
}

// A test that runs NOWHERE asserts nothing, and says so to no one. This repo has already paid
// that bill twice: `rag/*.test.mjs` sat outside every glob until CI was taught to run it, and the
// vault write-guard suite shipped green-on-one-machine for 67 commits. A hand-maintained glob in
// `package.json` is the same trap — add a test directory, forget the glob, and CI stays silent.
// So the glob is checked against what is actually on disk, and adding a directory goes RED here
// instead of going quiet in CI.
test("`npm test` globs every directory that holds tests (a test outside the glob runs nowhere)", () => {
  const script = (
    JSON.parse(readFileSync(join(ragRoot, "package.json"), "utf8")) as {
      scripts: { test: string };
    }
  ).scripts.test;

  const ungobbled = directoriesHoldingTests(ragRoot).filter(
    (dir) => !script.includes(`${dir}/*.test.ts`)
  );

  assert.deepEqual(
    ungobbled,
    [],
    `These directories hold tests that \`npm test\` never runs (add them to the test script): ${ungobbled.join(", ")}`
  );
});
