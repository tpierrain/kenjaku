// Mutation audit — the `scripts` package, run in BATCHES inside a disposable git
// worktree. Same scope and tuning as stryker.scripts.config.mjs (which it spreads);
// it exists for the two things the base config cannot express, both paid for on
// 2026-07-28 before this file existed and lived only in a scratchpad.
//
//   1. `inPlace: true`. The base config uses Stryker's SANDBOX because `inPlace` on the
//      REAL tree is destructive (a clear-example-notes mutant once deleted the vault's
//      demo notes). A worktree gives us both: git is present — `engine-manifest-integrity`
//      needs it, and it is the ONLY thing the sandbox lacked — while every deletion stays
//      confined to a throwaway checkout. So the whole harness suite dry-runs green here
//      (1033 at the time), and a batch score is NOT pessimistic.
//   2. `disableTypeChecks: false`. Left on, Stryker prepends `// @ts-nocheck` to ~370
//      files, and under `inPlace` that lands on the worktree itself. These are plain
//      `.mjs` with nothing to type-check. The CLI has no flag for it — hence this file.
//
// ⚠️ The whole package is ~30 min for ~1230 mutants, and a backgrounded command is
// capped at 10 min. Split it: pass `--mutate "<comma-separated paths>"` per batch, and
// RESET the worktree between batches with `git reset --hard <sha>` + `git clean -fd` —
// never `git checkout -- .`. A killed run leaves Stryker's instrumentation behind, and
// a mutant of auto-commit.mjs can COMMIT that instrumented tree, at which point
// `checkout -- .` faithfully restores it and every later dry run dies on
// `SyntaxError: Identifier 'stryNS_…' has already been declared`.
//
// Recipe: see RESULTS.md → "Reproduce".
import base from "./stryker.scripts.config.mjs";

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  ...base,
  inPlace: true,
  disableTypeChecks: false,
  tempDirName: ".stryker-tmp",
  reporters: ["clear-text", "progress"],
};
