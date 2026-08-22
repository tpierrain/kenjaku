// Mutation audit — the MAINTAINER TOOLING itself (dev-only .mjs under
// maintainers/mutation/, never shipped to a brain). It exists so §5quinquies
// applies to the tooling too: the runner that judges everyone else's tests is
// measured by the same rule the day it is written.
//
// Two things this config does differently from the `scripts` ones, both
// deliberate:
//
//   1. **Sandbox, not a worktree.** Everything mutated here injects its effects,
//      so no mutant can touch the real tree — the destructive shape that forces
//      `scripts` into a disposable worktree simply is not present.
//   2. **The entry-point tests are SKIPPED** (`--test-skip-pattern "^entry
//      point"`). They spawn the real file, and a mutant that flips `dryRun` to
//      false would then run `git worktree add` for real, from inside a test. That
//      is exactly the destruction the worktree exists to contain, so the two
//      cases are excluded instead — the seam they cover is asserted by the pure
//      cases, and excluding tests can only make the score PESSIMISTIC.
//
// Run from the REPO ROOT:
//   npm --prefix maintainers/mutation run mutate:maintainers
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: 'command',
  commandRunner: {
    command: 'node --test --test-skip-pattern "^entry point" "maintainers/mutation/*.test.mjs"',
  },
  // mutate-changed.mjs has no test sibling: mutating it would report a 0 % that
  // says nothing about this file's tests. Named debt, not silent scope.
  mutate: ['maintainers/mutation/mutate-one.mjs'],
  inPlace: false,
  coverageAnalysis: 'off',
  // Same tuning as the scripts configs, and for the same reason: more concurrent
  // runners oversubscribe the CPU and manufacture false timeouts.
  concurrency: 5,
  timeoutMS: 30000,
  timeoutFactor: 4,
  tempDirName: 'maintainers/mutation/.stryker-tmp',
  reporters: ['clear-text', 'progress', 'html'],
  htmlReporter: { fileName: 'maintainers/mutation/reports/mutation-maintainers.html' },
  thresholds: { high: 80, low: 60, break: null },
};
