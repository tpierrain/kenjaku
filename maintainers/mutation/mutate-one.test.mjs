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
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
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
  assert.deepEqual(planRun({ ...PLAN_INPUT, worktreeExists: false, ragLinkExists: false }), [
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
  const steps = planRun({ ...PLAN_INPUT, worktreeExists: true, ragLinkExists: true });

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
  // An existing link is left alone rather than re-created.
  assert.deepEqual(steps.map((s) => s.step), [
    "prune",
    "reset",
    "clean",
    "verify-write-guard",
    "discard-stale-log",
    "mutate",
  ]);
});

test("planRun — --mutate takes ONE comma-separated list, never a repeated flag", () => {
  // A repeated --mutate keeps only the LAST value: the other files would be
  // silently unmeasured while the log still reads as a successful run.
  const steps = planRun({
    ...PLAN_INPUT,
    targets: ["scripts/auto-push.mjs", "scripts/lib/repo-status.mjs"],
    worktreeExists: true,
    ragLinkExists: true,
  });
  const mutate = steps.find((s) => s.step === "mutate");

  assert.deepEqual(mutate.args.slice(-2), ["--mutate", "scripts/auto-push.mjs,scripts/lib/repo-status.mjs"]);
  assert.equal(mutate.args.filter((a) => a === "--mutate").length, 1);
});

test("planRun — the bin is the REAL repo's, the config is the worktree's own copy", () => {
  // The worktree has no node_modules (git-ignored), so Stryker is reached by
  // absolute path into the real repo; the config is read from the worktree, whose
  // cwd is also Stryker's project root.
  const mutate = planRun({ ...PLAN_INPUT, worktreeExists: true, ragLinkExists: true })
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
function harness({ results = {}, worktreeExists = true, ragLinkExists = true, config = SOUND_CONFIG } = {}) {
  const calls = [];
  const out = [];
  return {
    calls,
    out,
    deps: {
      repoRoot: "/Users/dev/kenjaku",
      sha: "bd9277d1c0ffee0000000000000000000000beef",
      config,
      exists: (path) => {
        calls.push({ fn: "exists", path });
        if (path.endsWith("rag/node_modules")) return ragLinkExists;
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
  assert.deepEqual(h.calls.filter((c) => c.fn === "removeFile"), [
    { fn: "removeFile", path: "/Users/dev/kenjaku/maintainers/mutation/reports/mutate-one-lint-vault.log" },
  ]);
  assert.deepEqual(h.calls.filter((c) => c.fn === "writeFile"), [
    {
      fn: "writeFile",
      path: "/Users/dev/kenjaku/maintainers/mutation/reports/mutate-one-lint-vault.log",
      bytes: STRYKER_TAIL.length,
    },
  ]);
  assert.match(h.out.join("\n"), /81\.57/);
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
  assert.match(h.out.join("\n"), /22 skipped/);
  assert.match(h.out.join("\n"), /rag\/node_modules/);
});

test("runMutateOne — a write-guard run that says nothing at all is refused too", () => {
  const h = harness({ results: { [GUARD_KEY]: { code: 1, output: "Cannot find module\n" } } });

  const code = runMutateOne(["scripts/lint-vault.mjs"], h.deps);

  assert.equal(code, 1);
  assert.equal(h.calls.some((c) => c.fn === "run" && c.args.includes("--mutate")), false);
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
  assert.equal(h.calls.some((c) => c.fn === "writeFile"), true);
  assert.doesNotMatch(h.out.join("\n"), /Mutation score/);
  assert.match(h.out.join("\n"), /failed/i);
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
  assert.match(h.out.join("\n"), /3564 of 3735 mutants TIMED OUT \(95 %\)/);
  // The number is still shown — it is evidence of the failure — but never as a result.
  assert.doesNotMatch(h.out.join("\n"), /✅/);
});

test("runMutateOne — a drifted config stops the run before it costs 15 minutes", () => {
  const h = harness({ config: { ...SOUND_CONFIG, concurrency: 13 } });

  const code = runMutateOne(["scripts/lint-vault.mjs"], h.deps);

  assert.equal(code, 1);
  assert.equal(h.calls.some((c) => c.fn === "run"), false);
  assert.match(h.out.join("\n"), /concurrency is 13/);
});

test("runMutateOne — --dry-run prints the plan and runs nothing", () => {
  const h = harness();

  const code = runMutateOne(["--dry-run", "scripts/lint-vault.mjs"], h.deps);

  assert.equal(code, 0);
  assert.deepEqual(h.calls.filter((c) => c.fn === "run" || c.fn === "removeFile" || c.fn === "symlink"), []);
  assert.match(h.out.join("\n"), /worktree prune/);
  assert.match(h.out.join("\n"), /--mutate scripts\/lint-vault\.mjs/);
});

test("runMutateOne — a usage error prints the usage and never touches the repo", () => {
  const h = harness();

  const code = runMutateOne([], h.deps);

  assert.equal(code, 2);
  assert.deepEqual(h.calls, []);
  assert.match(h.out.join("\n"), /no target file given/);
});

// ─────────────────────────────────────────────────────────────────────────────
// The entry point, run as a PROCESS (the entry-point seam rule). --dry-run
// touches nothing, so the real composition root — repo root, HEAD sha, the real
// batch config — is exercised for real.
// ─────────────────────────────────────────────────────────────────────────────

const HERE = dirname(fileURLToPath(import.meta.url));
const SELF = join(HERE, "mutate-one.mjs");
const spawnSelf = (...args) => spawnSync(process.execPath, [SELF, ...args], { encoding: "utf8" });

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
    ragLinkExists: false,
    results: { [GUARD_KEY]: { code: 0, output: NODE_TEST_TAIL }, [MUTATE_KEY()]: { code: 0, output: STRYKER_TAIL } },
  });

  const code = runMutateOne(["scripts/lint-vault.mjs"], h.deps);

  assert.equal(code, 0);
  assert.deepEqual(h.calls.filter((c) => c.fn === "symlink"), [
    { fn: "symlink", from: "/Users/dev/kenjaku/rag/node_modules", to: "/Users/dev/kenjaku-mut-one/rag/node_modules" },
  ]);
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
