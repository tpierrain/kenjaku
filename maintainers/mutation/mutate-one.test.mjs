// Tests for mutate-one.mjs — the ONE-file mutation runner for the `scripts`
// package (CONVENTIONS §5quinquies: mutate a new production file the day it is
// written).
//
// Every case below is a trap that has already cost a real run; the traps are
// listed in RESULTS.md § S0bis and in the plan
// ../plans/prospective/agent-orchestrated-release-mode-action.md. What is tested
// is therefore not "does it call git" but the ORDER and the SHAPE of what it
// runs, because that is where each trap lives: prune before add, reset never
// spelled `checkout -- .`, one comma-separated --mutate, the write-guard gate
// before any mutant, and a stale log discarded before the run rather than read
// after it.
//
// The Stryker and node --test fixtures are REAL output, copied from
// reports/s0bis-batch1.log and from a live `node --test` run — never produced by
// the code under test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  defaultDeps,
  parseArgs,
  planRun,
  parseTestCounts,
  parseMutationReport,
  tuningViolations,
  runMutateOne,
  USAGE,
} from "./mutate-one.mjs";

// ─────────────────────────────────────────────────────────────────────────────
// parseArgs — the CLI surface
// ─────────────────────────────────────────────────────────────────────────────

test("parseArgs — one target, and the defaults it comes with", () => {
  assert.deepEqual(parseArgs(["scripts/lint-vault.mjs"]), {
    ok: true,
    targets: ["scripts/lint-vault.mjs"],
    worktree: "kenjaku-mut-one",
    logName: "mutate-one-lint-vault.log",
    dryRun: false,
  });
});

// A LINE-SCOPED target, which is the ordinary shape since 2026-08-21: an existing file
// is measured by the lines that changed, never whole (CONVENTIONS §5quinquies). The
// range rides through to Stryker untouched — but it must NOT ride into the log's
// filename: `:` is illegal on Windows, and this repo's whole hook history is about
// paths that only worked on the machine that wrote them.
test("parseArgs — a line-scoped target keeps its range, and the log name survives Windows", () => {
  assert.deepEqual(parseArgs(["scripts/update-engine.mjs:147-160"]), {
    ok: true,
    targets: ["scripts/update-engine.mjs:147-160"],
    worktree: "kenjaku-mut-one",
    logName: "mutate-one-update-engine-147-160.log",
    dryRun: false,
  });
});

test("parseArgs — several targets keep their order, and the log is named after the first", () => {
  assert.deepEqual(
    parseArgs(["scripts/lib/repo-status.mjs", "scripts/auto-push.mjs"]),
    {
      ok: true,
      targets: ["scripts/lib/repo-status.mjs", "scripts/auto-push.mjs"],
      worktree: "kenjaku-mut-one",
      logName: "mutate-one-repo-status+1.log",
      dryRun: false,
    }
  );
});

test("parseArgs — the three options are read, wherever they sit", () => {
  assert.deepEqual(
    parseArgs(["--dry-run", "scripts/auto-push.mjs", "--worktree", "kenjaku-mut-s1", "--log", "s1-probe.log"]),
    {
      ok: true,
      targets: ["scripts/auto-push.mjs"],
      worktree: "kenjaku-mut-s1",
      logName: "s1-probe.log",
      dryRun: true,
    }
  );
});

test("parseArgs — no target is a usage error, not an empty run", () => {
  // An empty --mutate list would mutate the WHOLE package: ~1230 mutants, ~30
  // minutes, and a backgrounded command capped at 10 min — i.e. a run that dies
  // and leaves a log to be misread.
  assert.deepEqual(parseArgs([]), { ok: false, error: `no target file given\n${USAGE}` });
  assert.deepEqual(parseArgs(["--dry-run"]), { ok: false, error: `no target file given\n${USAGE}` });
});

test("parseArgs — a test sibling is refused: mutating a test measures nothing", () => {
  assert.deepEqual(parseArgs(["scripts/lib/repo-status.test.mjs"]), {
    ok: false,
    error: "scripts/lib/repo-status.test.mjs is a test file — mutate the production file it judges",
  });
});

test("parseArgs — this runner is the `scripts` package's; other packages have their own recipe", () => {
  // rag/ and local-mirror/ run through `npm --prefix maintainers/mutation run
  // mutate:rag` and need no worktree at all (RESULTS.md § Reproduce). Silently
  // running them here under the scripts config would mutate files no test covers.
  assert.deepEqual(parseArgs(["rag/src/lib/search.ts"]), {
    ok: false,
    error:
      "rag/src/lib/search.ts is outside scripts/ — use that package's own npm script " +
      "(`npm --prefix maintainers/mutation run mutate:rag` / `mutate:local-mirror`), no worktree needed",
  });
});

test("parseArgs — an option that eats its value cannot swallow the target", () => {
  assert.deepEqual(parseArgs(["--worktree", "scripts/auto-push.mjs"]), {
    ok: false,
    error: `no target file given\n${USAGE}`,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// planRun — the ordered steps, asserted WHOLE
//
// The order IS the contract (RESULTS.md: a call-order claim is invisible in any
// return value — only the full sequence pins it), so these assert the entire
// list rather than the presence of a step.
// ─────────────────────────────────────────────────────────────────────────────

const PLAN_INPUT = {
  repoRoot: "/Users/dev/kenjaku",
  worktreePath: "/Users/dev/kenjaku-mut-one",
  sha: "bd9277d1c0ffee0000000000000000000000beef",
  targets: ["scripts/lint-vault.mjs"],
  logPath: "/Users/dev/kenjaku/maintainers/mutation/reports/mutate-one-lint-vault.log",
  strykerBin: "/Users/dev/kenjaku/maintainers/mutation/node_modules/@stryker-mutator/core/bin/stryker.js",
};

test("planRun — a worktree that does not exist yet: prune, THEN add", () => {
  assert.deepEqual(planRun({ ...PLAN_INPUT, worktreeExists: false }), [
    // `git worktree prune` FIRST, always: a worktree that was rm -rf'd is still
    // registered, `add` refuses, and the run silently never happens — leaving the
    // PREVIOUS log to be read as this run's result.
    { step: "prune", command: "git", args: ["worktree", "prune"], cwd: "/Users/dev/kenjaku" },
    {
      step: "add-worktree",
      command: "git",
      args: ["worktree", "add", "--detach", "/Users/dev/kenjaku-mut-one", "bd9277d1c0ffee0000000000000000000000beef"],
      cwd: "/Users/dev/kenjaku",
    },
    {
      step: "link-rag-node-modules",
      from: "/Users/dev/kenjaku/rag/node_modules",
      to: "/Users/dev/kenjaku-mut-one/rag/node_modules",
    },
    {
      step: "verify-write-guard",
      command: "node",
      args: ["--test", "scripts/lib/vault-write-guard.test.mjs"],
      cwd: "/Users/dev/kenjaku-mut-one",
    },
    { step: "discard-stale-log", path: PLAN_INPUT.logPath },
    {
      step: "mutate",
      command: "node",
      args: [
        PLAN_INPUT.strykerBin,
        "run",
        "maintainers/mutation/stryker.scripts.batch.config.mjs",
        "--mutate",
        "scripts/lint-vault.mjs",
      ],
      cwd: "/Users/dev/kenjaku-mut-one",
    },
  ]);
});

test("planRun — an existing worktree is RESET, and never with `checkout -- .`", () => {
  const steps = planRun({ ...PLAN_INPUT, worktreeExists: true });

  assert.deepEqual(steps.slice(0, 3), [
    { step: "prune", command: "git", args: ["worktree", "prune"], cwd: "/Users/dev/kenjaku" },
    {
      step: "reset",
      command: "git",
      args: ["reset", "--hard", "bd9277d1c0ffee0000000000000000000000beef"],
      cwd: "/Users/dev/kenjaku-mut-one",
    },
    // -e rag/node_modules: the symlink is the one thing the clean must spare, or
    // every run pays for it again.
    {
      step: "clean",
      command: "git",
      args: ["clean", "-qfd", "-e", "rag/node_modules"],
      cwd: "/Users/dev/kenjaku-mut-one",
    },
  ]);
  // A killed run leaves Stryker's instrumentation behind and a mutant of
  // auto-commit.mjs can COMMIT it; `checkout -- .` then faithfully restores the
  // instrumented tree and every later dry run dies on `stryNS_ already declared`.
  assert.equal(JSON.stringify(steps).includes("checkout"), false);
  // 🛑 The link is re-made even though it EXISTED when the plan was built. The plan
  // asked its question before running the step that changes the answer: `git clean`
  // removes the symlink despite the `-e`, so a plan that skipped the link on
  // `ragLinkExists: true` produced a worktree with no `rag/node_modules` — and the
  // preflight then refused the run. **It alternated**, which is what hid it: the run
  // that found no link made one and passed, leaving one for the next run to skip and
  // fail on. Measured 2026-08-21: three aborted runs in one session, on alternate
  // invocations. An idempotent step costs one syscall; a stale precondition costs a run.
  assert.deepEqual(steps.map((s) => s.step), [
    "prune",
    "reset",
    "clean",
    "link-rag-node-modules",
    "verify-write-guard",
    "discard-stale-log",
    "mutate",
  ]);
  // ...and it is ordered AFTER the clean, which is the whole point.
  assert.ok(
    steps.findIndex((s) => s.step === "link-rag-node-modules") > steps.findIndex((s) => s.step === "clean"),
    "linking before the clean is linking into a directory the clean is about to empty",
  );
});

test("planRun — --mutate takes ONE comma-separated list, never a repeated flag", () => {
  // A repeated --mutate keeps only the LAST value: the other files would be
  // silently unmeasured while the log still reads as a successful run.
  const steps = planRun({
    ...PLAN_INPUT,
    targets: ["scripts/auto-push.mjs", "scripts/lib/repo-status.mjs"],
    worktreeExists: true,
  });
  const mutate = steps.find((s) => s.step === "mutate");

  assert.deepEqual(mutate.args.slice(-2), ["--mutate", "scripts/auto-push.mjs,scripts/lib/repo-status.mjs"]);
  assert.equal(mutate.args.filter((a) => a === "--mutate").length, 1);
});

test("planRun — the bin is the REAL repo's, the config is the worktree's own copy", () => {
  // The worktree has no node_modules (git-ignored), so Stryker is reached by
  // absolute path into the real repo; the config is read from the worktree, whose
  // cwd is also Stryker's project root.
  const mutate = planRun({ ...PLAN_INPUT, worktreeExists: true })
    .find((s) => s.step === "mutate");

  assert.equal(mutate.args[0], PLAN_INPUT.strykerBin);
  assert.equal(mutate.args[2], "maintainers/mutation/stryker.scripts.batch.config.mjs");
  assert.equal(mutate.cwd, "/Users/dev/kenjaku-mut-one");
});

// ─────────────────────────────────────────────────────────────────────────────
// tuningViolations — the config the run is about to use
// ─────────────────────────────────────────────────────────────────────────────

const SOUND_CONFIG = { inPlace: true, disableTypeChecks: false, concurrency: 5, timeoutMS: 30000 };

test("tuningViolations — the batch config as it stands is sound", () => {
  assert.deepEqual(tuningViolations(SOUND_CONFIG), []);
});

test("tuningViolations — each drift is named, and they accumulate", () => {
  // Stryker's default 13 runners re-run the 513-test suite at once → CPU
  // oversubscription → mass FALSE timeouts (run #1: 3564/3735 bogus timeouts, a
  // fake 99.97 % score).
  assert.deepEqual(tuningViolations({ ...SOUND_CONFIG, concurrency: 13 }), [
    "concurrency is 13, must be at most 5 (higher oversubscribes the CPU and manufactures false timeouts)",
  ]);
  assert.deepEqual(tuningViolations({ ...SOUND_CONFIG, timeoutMS: 7000 }), [
    "timeoutMS is 7000, must be at least 30000 (a shorter timeout counts slow runs as killed mutants)",
  ]);
  assert.deepEqual(tuningViolations({ ...SOUND_CONFIG, inPlace: false }), [
    "inPlace is false — the sandbox has no .git, so engine-manifest-integrity dies before the first mutant",
  ]);
  assert.deepEqual(tuningViolations({ ...SOUND_CONFIG, disableTypeChecks: true }), [
    "disableTypeChecks is true — @ts-nocheck would be prepended to ~370 files of the worktree",
  ]);
  assert.deepEqual(tuningViolations({ inPlace: false, disableTypeChecks: true, concurrency: 13, timeoutMS: 7000 }).length, 4);
});

// ─────────────────────────────────────────────────────────────────────────────
// parseTestCounts — the write-guard gate
// ─────────────────────────────────────────────────────────────────────────────

const NODE_TEST_TAIL = `✔ guardDecision — a call with no path is let through (0.034625ms)
ℹ tests 22
ℹ suites 0
ℹ pass 22
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 95.132666
`;

test("parseTestCounts — reads the real reporter's summary", () => {
  assert.deepEqual(parseTestCounts(NODE_TEST_TAIL), { pass: 22, fail: 0, skipped: 0 });
});

test("parseTestCounts — a skipped case is reported, not rounded to zero", () => {
  // vault-write-guard.test.mjs SKIPS itself when rag/node_modules is missing.
  // Mutants then face a suite that cannot judge them — §5quater's fiction with a
  // mutation score on top.
  assert.deepEqual(parseTestCounts(NODE_TEST_TAIL.replace("skipped 0", "skipped 22").replace("pass 22", "pass 0")), {
    pass: 0,
    fail: 0,
    skipped: 22,
  });
});

test("parseTestCounts — output with no summary at all is null, never a green guess", () => {
  assert.equal(parseTestCounts("Error: Cannot find module 'node:test'\n"), null);
  assert.equal(parseTestCounts(""), null);
});

test("parseTestCounts — a summary cut short is null too, whichever line is missing", () => {
  // A run killed mid-print leaves a PARTIAL summary. Each of the three counts is
  // singly necessary: without a case per missing line, two thirds of the guard
  // could be deleted with the suite green.
  const without = (label) => NODE_TEST_TAIL.split("\n").filter((l) => !l.includes(`ℹ ${label} `)).join("\n");

  assert.equal(parseTestCounts(without("pass")), null);
  assert.equal(parseTestCounts(without("fail")), null);
  assert.equal(parseTestCounts(without("skipped")), null);
});

// ─────────────────────────────────────────────────────────────────────────────
// parseMutationReport — the score, and the timeout tell
// ─────────────────────────────────────────────────────────────────────────────

const STRYKER_TAIL = `Ran 0.93 tests per mutant on average.
----------------------------|------------------|----------|-----------|------------|----------|----------|
                            | % Mutation score |          |           |            |          |          |
File                        |  total | covered | # killed | # timeout | # survived | # no cov | # errors |
----------------------------|--------|---------|----------|-----------|------------|----------|----------|
All files                   |  81.57 |   81.57 |      331 |        32 |         82 |        0 |        0 |
 lib                        |  74.45 |   74.45 |      207 |        32 |         82 |        0 |        0 |
  entrypoint-discipline.mjs |  71.82 |   71.82 |      181 |        28 |         82 |        0 |        0 |
  entrypoint.mjs            | 100.00 |  100.00 |       26 |         4 |          0 |        0 |        0 |
 status-line.mjs            | 100.00 |  100.00 |      109 |         0 |          0 |        0 |        0 |
 upstream-check-run.mjs     | 100.00 |  100.00 |       15 |         0 |          0 |        0 |        0 |
----------------------------|--------|---------|----------|-----------|------------|----------|----------|
00:52:13 (53593) INFO MutationTestExecutor Done in 14 minutes and 34 seconds.
`;

test("parseMutationReport — the overall row and every file row, whole", () => {
  assert.deepEqual(parseMutationReport(STRYKER_TAIL), {
    score: 81.57,
    killed: 331,
    timeout: 32,
    survived: 82,
    files: [
      { file: "entrypoint-discipline.mjs", score: 71.82, survived: 82, timeout: 28 },
      { file: "entrypoint.mjs", score: 100, survived: 0, timeout: 4 },
      { file: "status-line.mjs", score: 100, survived: 0, timeout: 0 },
      { file: "upstream-check-run.mjs", score: 100, survived: 0, timeout: 0 },
    ],
    timeoutShare: 32 / (331 + 32 + 82),
    trustworthy: true,
  });
});

test("parseMutationReport — a run made of bogus timeouts is NOT trustworthy", () => {
  // Run #1 of the very first scripts audit: 3564 timeouts out of 3735 mutants
  // returned a fake 99.97 %. The score alone cannot tell you that; the timeout
  // share can.
  const fake = STRYKER_TAIL.replace(
    "All files                   |  81.57 |   81.57 |      331 |        32 |         82 |        0 |        0 |",
    "All files                   |  99.97 |   99.97 |      170 |      3564 |          1 |        0 |        0 |"
  );
  const report = parseMutationReport(fake);

  assert.equal(report.score, 99.97);
  assert.equal(report.trustworthy, false);
  assert.ok(report.timeoutShare > 0.9, `timeoutShare was ${report.timeoutShare}`);
});

test("parseMutationReport — a `.ts` package's table reads the same way", () => {
  // rag/ and local-mirror/ are TypeScript: their rows must be recognised as file
  // rows too, or a run of theirs reports an overall score and no files.
  const tsTable = `----------------|------------------|----------|-----------|------------|----------|----------|
File            |  total | covered | # killed | # timeout | # survived | # no cov | # errors |
----------------|--------|---------|----------|-----------|------------|----------|----------|
All files       |  96.00 |   96.00 |       48 |         0 |          2 |        0 |        0 |
 markdown.ts    | 100.00 |  100.00 |        8 |         0 |          0 |        0 |        0 |
 search.ts      |  94.00 |   94.00 |       40 |         0 |          2 |        0 |        0 |
`;

  assert.deepEqual(parseMutationReport(tsTable).files, [
    { file: "markdown.ts", score: 100, survived: 0, timeout: 0 },
    { file: "search.ts", score: 94, survived: 2, timeout: 0 },
  ]);
});

test("parseMutationReport — a filename OUTSIDE the table is not a file row", () => {
  // Stryker prints every survivor's location above the table, one bare path per
  // line. Without the table-row filter those lines read as files with a NaN score.
  const withSurvivors = `[Survived] StringLiteral\nscripts/lint-vault.mjs\n${STRYKER_TAIL}`;

  assert.deepEqual(
    parseMutationReport(withSurvivors).files.map((f) => f.file),
    ["entrypoint-discipline.mjs", "entrypoint.mjs", "status-line.mjs", "upstream-check-run.mjs"]
  );
});

test("parseMutationReport — the trust boundary is inclusive: a quarter of timeouts still counts", () => {
  // 25 % exactly is the last trustworthy run; one mutant more and it is not.
  const atBoundary = STRYKER_TAIL.replace(
    "All files                   |  81.57 |   81.57 |      331 |        32 |         82 |        0 |        0 |",
    "All files                   |  81.57 |   81.57 |      285 |       100 |         15 |        0 |        0 |"
  );
  const over = STRYKER_TAIL.replace(
    "All files                   |  81.57 |   81.57 |      331 |        32 |         82 |        0 |        0 |",
    "All files                   |  81.57 |   81.57 |      284 |       101 |         15 |        0 |        0 |"
  );

  assert.equal(parseMutationReport(atBoundary).timeoutShare, 0.25);
  assert.equal(parseMutationReport(atBoundary).trustworthy, true);
  assert.equal(parseMutationReport(over).trustworthy, false);
});

test("parseMutationReport — no table means no result, and that is not a zero", () => {
  // A crashed or killed run leaves output with no table. Returning null is what
  // makes the caller fail loudly instead of reporting a score it did not measure.
  assert.equal(parseMutationReport("00:52:13 INFO Stryker An error occurred\n"), null);
});

// ─────────────────────────────────────────────────────────────────────────────
// runMutateOne — the orchestration, with every effect injected
// ─────────────────────────────────────────────────────────────────────────────

// A fake whose answers are a FINGERPRINT of what it was asked (RESULTS.md
// § S0bis, family 2: a double that ignores its arguments certifies nothing).
function harness({ results = {}, worktreeExists = true, config = SOUND_CONFIG } = {}) {
  const calls = [];
  const out = [];
  return {
    calls,
    out,
    deps: {
      repoRoot: "/Users/dev/kenjaku",
      sha: "bd9277d1c0ffee0000000000000000000000beef",
      config,
      // The rag link is no longer ASKED about — the plan makes it unconditionally
      // (its precondition was invalidated by the very step that preceded it), so the
      // only question left is whether the worktree is there.
      exists: (path) => {
        calls.push({ fn: "exists", path });
        return worktreeExists;
      },
      run: ({ command, args, cwd }) => {
        calls.push({ fn: "run", command, args, cwd });
        return results[args.join(" ")] ?? { code: 0, output: "" };
      },
      symlink: (from, to) => calls.push({ fn: "symlink", from, to }),
      removeFile: (path) => calls.push({ fn: "removeFile", path }),
      writeFile: (path, body) => calls.push({ fn: "writeFile", path, bytes: body.length }),
      say: (line) => out.push(line),
    },
  };
}

const GUARD_KEY = "--test scripts/lib/vault-write-guard.test.mjs";
const MUTATE_KEY = (t = "scripts/lint-vault.mjs") =>
  `/Users/dev/kenjaku/maintainers/mutation/node_modules/@stryker-mutator/core/bin/stryker.js run maintainers/mutation/stryker.scripts.batch.config.mjs --mutate ${t}`;

test("runMutateOne — the happy path runs every step, writes the log, and reports the score", () => {
  const h = harness({
    results: {
      [GUARD_KEY]: { code: 0, output: NODE_TEST_TAIL },
      [MUTATE_KEY()]: { code: 0, output: STRYKER_TAIL },
    },
  });

  const code = runMutateOne(["scripts/lint-vault.mjs"], h.deps);

  assert.equal(code, 0);
  assert.deepEqual(
    h.calls.filter((c) => c.fn === "run").map((c) => c.args.join(" ")),
    ["worktree prune", "reset --hard bd9277d1c0ffee0000000000000000000000beef", "clean -qfd -e rag/node_modules", GUARD_KEY, MUTATE_KEY()]
  );
  // Two removals, and the ORDER matters: the link's path is cleared before the symlink
  // is made (the step is unconditional now, so it meets an existing link), and the
  // stale log goes before the mutants run, never after.
  assert.deepEqual(h.calls.filter((c) => c.fn === "removeFile"), [
    { fn: "removeFile", path: "/Users/dev/kenjaku-mut-one/rag/node_modules" },
    { fn: "removeFile", path: "/Users/dev/kenjaku/maintainers/mutation/reports/mutate-one-lint-vault.log" },
  ]);
  assert.deepEqual(h.calls.filter((c) => c.fn === "symlink"), [
    { fn: "symlink", from: "/Users/dev/kenjaku/rag/node_modules", to: "/Users/dev/kenjaku-mut-one/rag/node_modules" },
  ]);
  assert.deepEqual(h.calls.filter((c) => c.fn === "writeFile"), [
    {
      fn: "writeFile",
      path: "/Users/dev/kenjaku/maintainers/mutation/reports/mutate-one-lint-vault.log",
      bytes: STRYKER_TAIL.length,
    },
  ]);
  // The account of the run, asserted WHOLE: this output is the only thing a
  // human reads, and a clause blanked here is a clause nobody notices missing.
  assert.deepEqual(h.out, [
    "▶ git worktree prune   (in /Users/dev/kenjaku)",
    "▶ git reset --hard bd9277d1c0ffee0000000000000000000000beef   (in /Users/dev/kenjaku-mut-one)",
    "▶ git clean -qfd -e rag/node_modules   (in /Users/dev/kenjaku-mut-one)",
    "▶ symlink /Users/dev/kenjaku/rag/node_modules → /Users/dev/kenjaku-mut-one/rag/node_modules",
    "▶ node --test scripts/lib/vault-write-guard.test.mjs   (in /Users/dev/kenjaku-mut-one)",
    "   ✓ write guard: 22 pass, 0 skipped",
    "▶ discard stale log /Users/dev/kenjaku/maintainers/mutation/reports/mutate-one-lint-vault.log",
    `▶ node ${MUTATE_KEY()}   (in /Users/dev/kenjaku-mut-one)`,
    "✅ Mutation score 81.57 % — 331 killed, 82 survived, 32 timeout",
    "   entrypoint-discipline.mjs: 71.82 % (82 survived, 28 timeout)",
    "   entrypoint.mjs: 100 % (0 survived, 4 timeout)",
    "   status-line.mjs: 100 % (0 survived, 0 timeout)",
    "   upstream-check-run.mjs: 100 % (0 survived, 0 timeout)",
    "   log: /Users/dev/kenjaku/maintainers/mutation/reports/mutate-one-lint-vault.log",
  ]);
});

test("runMutateOne — a git step that fails stops the run there, with git's own words", () => {
  // `worktree add` refusing (the pruned-registration trap, when prune did not
  // cure it) must not fall through to a mutation run over a tree that is not
  // there. Nothing checked this: the whole `if (result.code !== 0)` tail could be
  // deleted with the suite green.
  const h = harness({
    worktreeExists: false,
    results: {
      "worktree add --detach /Users/dev/kenjaku-mut-one bd9277d1c0ffee0000000000000000000000beef": {
        code: 128,
        output: "fatal: '/Users/dev/kenjaku-mut-one' already exists\n",
      },
    },
  });

  const code = runMutateOne(["scripts/lint-vault.mjs"], h.deps);

  assert.equal(code, 1);
  assert.deepEqual(h.calls.filter((c) => c.fn === "run").map((c) => c.args[0]), ["worktree", "worktree"]);
  assert.deepEqual(h.out.slice(-2), [
    "❌ `git worktree add --detach /Users/dev/kenjaku-mut-one bd9277d1c0ffee0000000000000000000000beef   (in /Users/dev/kenjaku)` failed:",
    "fatal: '/Users/dev/kenjaku-mut-one' already exists",
  ]);
});

test("runMutateOne — the write-guard gate reads BOTH the exit code and the counts", () => {
  // Two independent reasons to refuse, each needing its own case: a run that
  // exits non-zero while still printing a clean summary (a crash after the
  // summary), and a run that exits 0 while reporting failures.
  const crashed = harness({
    results: { [GUARD_KEY]: { code: 1, output: NODE_TEST_TAIL } },
  });
  const failing = harness({
    results: { [GUARD_KEY]: { code: 0, output: NODE_TEST_TAIL.replace("fail 0", "fail 1") } },
  });

  assert.equal(runMutateOne(["scripts/lint-vault.mjs"], crashed.deps), 1);
  assert.equal(runMutateOne(["scripts/lint-vault.mjs"], failing.deps), 1);
  assert.equal(crashed.calls.some((c) => c.fn === "run" && c.args.includes("--mutate")), false);
  assert.equal(failing.calls.some((c) => c.fn === "run" && c.args.includes("--mutate")), false);
  assert.deepEqual(failing.out.slice(-1), [
    "❌ scripts/lib/vault-write-guard.test.mjs reports 0 skipped and 1 failed in the worktree — " +
      "mutants would face a suite that cannot judge them. Check the rag/node_modules symlink.",
  ]);
});

test("runMutateOne — Stryker exiting non-zero is a failure EVEN with a full table", () => {
  // A threshold break prints a perfectly good table and exits non-zero. Reading
  // the table and announcing a score would turn a failed run into a green one.
  const h = harness({
    results: {
      [GUARD_KEY]: { code: 0, output: NODE_TEST_TAIL },
      [MUTATE_KEY()]: { code: 1, output: STRYKER_TAIL },
    },
  });

  const code = runMutateOne(["scripts/lint-vault.mjs"], h.deps);

  assert.equal(code, 1);
  assert.deepEqual(h.out.slice(-1), [
    "❌ Stryker failed and measured nothing — full output in /Users/dev/kenjaku/maintainers/mutation/reports/mutate-one-lint-vault.log",
  ]);
});

test("runMutateOne — a skipped write-guard aborts BEFORE a single mutant runs", () => {
  const h = harness({
    results: {
      [GUARD_KEY]: { code: 0, output: NODE_TEST_TAIL.replace("skipped 0", "skipped 22") },
      [MUTATE_KEY()]: { code: 0, output: STRYKER_TAIL },
    },
  });

  const code = runMutateOne(["scripts/lint-vault.mjs"], h.deps);

  assert.equal(code, 1);
  assert.equal(h.calls.some((c) => c.fn === "run" && c.args.includes("--mutate")), false);
  assert.deepEqual(h.out.slice(-1), [
    "❌ scripts/lib/vault-write-guard.test.mjs reports 22 skipped and 0 failed in the worktree — " +
      "mutants would face a suite that cannot judge them. Check the rag/node_modules symlink.",
  ]);
});

test("runMutateOne — a write-guard run that says nothing at all is refused too", () => {
  const h = harness({ results: { [GUARD_KEY]: { code: 1, output: "Cannot find module\n" } } });

  const code = runMutateOne(["scripts/lint-vault.mjs"], h.deps);

  assert.equal(code, 1);
  assert.equal(h.calls.some((c) => c.fn === "run" && c.args.includes("--mutate")), false);
  assert.deepEqual(h.out.slice(-2), [
    "❌ scripts/lib/vault-write-guard.test.mjs did not report a result in /Users/dev/kenjaku-mut-one — the worktree is not usable:",
    "Cannot find module",
  ]);
});

test("runMutateOne — a failed Stryker run fails LOUDLY, and no score is claimed", () => {
  const h = harness({
    results: {
      [GUARD_KEY]: { code: 0, output: NODE_TEST_TAIL },
      [MUTATE_KEY()]: { code: 1, output: "00:52:13 INFO Stryker An error occurred\n" },
    },
  });

  const code = runMutateOne(["scripts/lint-vault.mjs"], h.deps);

  assert.equal(code, 1);
  // The output IS written: it is the diagnosis. What must not happen is a score.
  assert.deepEqual(h.calls.filter((c) => c.fn === "writeFile").map((c) => c.path), [
    "/Users/dev/kenjaku/maintainers/mutation/reports/mutate-one-lint-vault.log",
  ]);
  assert.deepEqual(h.out.slice(-1), [
    "❌ Stryker failed and measured nothing — full output in /Users/dev/kenjaku/maintainers/mutation/reports/mutate-one-lint-vault.log",
  ]);
});

test("runMutateOne — a run whose score is made of timeouts is reported as untrustworthy", () => {
  const fake = STRYKER_TAIL.replace(
    "All files                   |  81.57 |   81.57 |      331 |        32 |         82 |        0 |        0 |",
    "All files                   |  99.97 |   99.97 |      170 |      3564 |          1 |        0 |        0 |"
  );
  const h = harness({
    results: { [GUARD_KEY]: { code: 0, output: NODE_TEST_TAIL }, [MUTATE_KEY()]: { code: 0, output: fake } },
  });

  const code = runMutateOne(["scripts/lint-vault.mjs"], h.deps);

  assert.equal(code, 1);
  // The number is still shown — it is evidence of the failure — but never as a result.
  assert.deepEqual(h.out.slice(-1), [
    "❌ 3564 of 3735 mutants TIMED OUT (95 %) — the 99.97 % is starved CPU, not killed mutants. " +
      "Re-run with nothing else running. Full output in /Users/dev/kenjaku/maintainers/mutation/reports/mutate-one-lint-vault.log",
  ]);
  assert.equal(h.out.some((line) => line.includes("✅")), false);
});

test("runMutateOne — a drifted config stops the run before it costs 15 minutes", () => {
  const h = harness({ config: { ...SOUND_CONFIG, concurrency: 13 } });

  const code = runMutateOne(["scripts/lint-vault.mjs"], h.deps);

  assert.equal(code, 1);
  assert.equal(h.calls.some((c) => c.fn === "run"), false);
  assert.deepEqual(h.out, [
    "❌ maintainers/mutation/stryker.scripts.batch.config.mjs has drifted — refusing to run:",
    "   • concurrency is 13, must be at most 5 (higher oversubscribes the CPU and manufactures false timeouts)",
  ]);
});

test("runMutateOne — --dry-run prints the plan, whole, and runs nothing", () => {
  const h = harness();

  const code = runMutateOne(["--dry-run", "scripts/a.mjs", "scripts/lib/b.mjs"], h.deps);

  assert.equal(code, 0);
  assert.deepEqual(h.calls.filter((c) => c.fn === "run" || c.fn === "removeFile" || c.fn === "symlink"), []);
  assert.deepEqual(h.out, [
    "▶ plan for scripts/a.mjs, scripts/lib/b.mjs (worktree /Users/dev/kenjaku-mut-one):",
    "   git worktree prune   (in /Users/dev/kenjaku)",
    "   git reset --hard bd9277d1c0ffee0000000000000000000000beef   (in /Users/dev/kenjaku-mut-one)",
    "   git clean -qfd -e rag/node_modules   (in /Users/dev/kenjaku-mut-one)",
    "   symlink /Users/dev/kenjaku/rag/node_modules → /Users/dev/kenjaku-mut-one/rag/node_modules",
    "   node --test scripts/lib/vault-write-guard.test.mjs   (in /Users/dev/kenjaku-mut-one)",
    "   discard stale log /Users/dev/kenjaku/maintainers/mutation/reports/mutate-one-a+1.log",
    `   node ${MUTATE_KEY("scripts/a.mjs,scripts/lib/b.mjs")}   (in /Users/dev/kenjaku-mut-one)`,
  ]);
});

test("runMutateOne — a usage error prints the usage and never touches the repo", () => {
  const h = harness();

  const code = runMutateOne([], h.deps);

  assert.equal(code, 2);
  assert.deepEqual(h.calls, []);
  // Spelled out rather than interpolated from USAGE: a fixture produced by the
  // code under test cannot fail when that code is wrong.
  assert.deepEqual(h.out, [
    "no target file given\n" +
      "usage: node maintainers/mutation/mutate-one.mjs <scripts/file.mjs> [more files…] " +
      "[--worktree <name>] [--log <name>] [--dry-run]",
  ]);
  assert.equal(h.out[0].endsWith(USAGE), true);
});

// ─────────────────────────────────────────────────────────────────────────────
// The entry point, run as a PROCESS (the entry-point seam rule). --dry-run
// touches nothing, so the real composition root — repo root, HEAD sha, the real
// batch config — is exercised for real.
// ─────────────────────────────────────────────────────────────────────────────

const HERE = dirname(fileURLToPath(import.meta.url));
const SELF = join(HERE, "mutate-one.mjs");
const spawnSelf = (...args) => spawnSync(process.execPath, [SELF, ...args], { encoding: "utf8" });

// The composition root, seam by seam, against the REAL primitives. Without this
// the whole adapter layer is judged by nothing: every case above drives the run
// through doubles, so `run`, `symlink`, `writeFile` and friends could each be
// emptied whole with the suite green. Everything it writes goes to a throwaway
// directory; the only real-world call it makes is read-only.
test("defaultDeps — every seam is wired to the real primitive it names", async () => {
  const deps = await defaultDeps();
  const dir = mkdtempSync(join(tmpdir(), "mutate-one-"));

  try {
    assert.equal(deps.repoRoot, resolve(HERE, "../.."));
    assert.match(deps.sha, /^[0-9a-f]{40}$/);
    // The config really is the batch one, read from disk rather than described here.
    assert.equal(deps.config.inPlace, true);
    assert.equal(deps.config.concurrency, 5);

    assert.equal(deps.exists(SELF), true);
    assert.equal(deps.exists(join(dir, "nothing-here")), false);

    // run — a real child process: its exit code, and BOTH its streams.
    assert.deepEqual(
      deps.run({
        command: process.execPath,
        args: ["-e", "process.stdout.write('out');process.stderr.write('err')"],
        cwd: dir,
      }),
      { code: 0, output: "outerr" }
    );
    assert.deepEqual(deps.run({ command: process.execPath, args: ["-e", "process.exit(3)"], cwd: dir }), {
      code: 3,
      output: "",
    });
    // The child really runs in the cwd it was given — the steps' `cwd` is the
    // difference between mutating the worktree and mutating the real tree.
    assert.deepEqual(
      deps.run({ command: process.execPath, args: ["-e", "process.stdout.write(process.cwd())"], cwd: dir }),
      { code: 0, output: realpathSync(dir) }
    );
    // A Stryker log is hundreds of KB: a buffer sized in bytes rather than MB
    // truncates the run's own evidence, and the score with it.
    const long = "x".repeat(200_000);
    assert.deepEqual(
      deps.run({ command: process.execPath, args: ["-e", `process.stdout.write("x".repeat(200000))`], cwd: dir }),
      { code: 0, output: long }
    );
    // A command that cannot even be spawned has no status and no streams — it
    // must not read as a successful run with empty output.
    assert.deepEqual(deps.run({ command: "kenjaku-no-such-binary", args: [], cwd: dir }), { code: 1, output: "" });

    const log = join(dir, "run.log");
    deps.writeFile(log, "measured\n");
    assert.equal(readFileSync(log, "utf8"), "measured\n");
    deps.removeFile(log);
    assert.equal(existsSync(log), false);
    deps.removeFile(log); // discarding a log that is not there is not an error

    deps.symlink(HERE, join(dir, "link"));
    assert.equal(existsSync(join(dir, "link", "mutate-one.mjs")), true);

    const said = [];
    const realLog = console.log;
    console.log = (line) => said.push(line);
    try {
      deps.say("hello");
    } finally {
      console.log = realLog;
    }
    assert.deepEqual(said, ["hello"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("entry point — `--dry-run` prints a plan built from the REAL repo and config", () => {
  const { status, stdout, stderr } = spawnSelf("--dry-run", "scripts/lint-vault.mjs");

  assert.equal(status, 0, stderr);
  assert.match(stdout, /worktree prune/);
  assert.match(stdout, /stryker\.scripts\.batch\.config\.mjs/);
  assert.match(stdout, /--mutate scripts\/lint-vault\.mjs/);
  // The real HEAD sha, resolved by the composition root rather than passed in.
  assert.match(stdout, /reset --hard [0-9a-f]{40}|worktree add --detach \S+ [0-9a-f]{40}/);
});

test("entry point — no argument exits 2 with the usage, and runs nothing", () => {
  const { status, stdout } = spawnSelf();

  assert.equal(status, 2);
  assert.match(stdout, /no target file given/);
  assert.match(stdout, /mutate-one\.mjs/);
});

test("runMutateOne — a missing worktree is created, and the rag link with it", () => {
  const h = harness({
    worktreeExists: false,
    results: { [GUARD_KEY]: { code: 0, output: NODE_TEST_TAIL }, [MUTATE_KEY()]: { code: 0, output: STRYKER_TAIL } },
  });

  const code = runMutateOne(["scripts/lint-vault.mjs"], h.deps);

  assert.equal(code, 0);
  assert.deepEqual(h.calls.filter((c) => c.fn === "symlink"), [
    { fn: "symlink", from: "/Users/dev/kenjaku/rag/node_modules", to: "/Users/dev/kenjaku-mut-one/rag/node_modules" },
  ]);
  // Both silent steps say so: the first real run printed a log in which the
  // symlink and the discarded log were INVISIBLE, which reads as "it never
  // linked anything" on the one output anybody keeps.
  assert.match(h.out.join("\n"), /symlink \/Users\/dev\/kenjaku\/rag\/node_modules → \/Users\/dev\/kenjaku-mut-one\/rag\/node_modules/);
  assert.match(h.out.join("\n"), /discard stale log \/Users\/dev\/kenjaku\/maintainers\/mutation\/reports\/mutate-one-lint-vault\.log/);
  assert.deepEqual(
    h.calls.filter((c) => c.fn === "run").map((c) => c.args.slice(0, 3).join(" ")),
    [
      "worktree prune",
      "worktree add --detach",
      "--test scripts/lib/vault-write-guard.test.mjs",
      "/Users/dev/kenjaku/maintainers/mutation/node_modules/@stryker-mutator/core/bin/stryker.js run maintainers/mutation/stryker.scripts.batch.config.mjs",
    ]
  );
});
