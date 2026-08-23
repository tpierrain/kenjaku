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
  targetPaths,
  uncommittedTargets,
  unmeasuredTargets,
  runMutateOne,
  linkedWorktrees,
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

// 🚨 THE TRAP THIS CLOSES, met for real on S10-QA: Stryker's `--mutate` accepts
// `file.mjs:79-79` and REJECTS `file.mjs:79` — it logs "did not result in any files" and
// carries on to a green score over whatever else was in the batch. Nine of that slice's
// sixteen hunks were measured by nobody, and the run said 85 % as if they had been.
// A score that was never measured is exactly what this script exists to make impossible,
// so the single line is normalized here rather than left to be spotted in a warning.
test("parseArgs — a SINGLE line is normalized into a range, because Stryker silently ignores a bare one", () => {
  assert.deepEqual(parseArgs(["scripts/update-engine.mjs:147"]), {
    ok: true,
    targets: ["scripts/update-engine.mjs:147-147"],
    worktree: "kenjaku-mut-one",
    logName: "mutate-one-update-engine-147-147.log",
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
// F6 (v5.0.0 code review) — THE WORKTREE NAME IS AN ARGUMENT TO `git reset --hard`.
//
// The name is joined onto the repo's PARENT, and the run that follows ends with
// `git reset --hard <sha>` and `git clean -qfd` inside whatever that lands on. So the
// argument is not a label: it selects the directory this tool is allowed to destroy.
// Anything that is not a single folder name beside the repo is refused before a single
// git call is made.
// ─────────────────────────────────────────────────────────────────────────────

// Spelled out rather than interpolated from the module, for the reason the usage test
// below gives: a fixture produced by the code under test cannot fail when that code is
// wrong. The sentence has to name the destruction, because that is what the reader is
// being protected from.
const badWorktree = (name) =>
  `--worktree "${name}" must be a single folder name (letters, digits, . _ + -): the worktree is ` +
  "created BESIDE this repo, and the run ends with `git reset --hard` and `git clean -qfd` inside it";

test("parseArgs — `--worktree ..` is refused: it names the repo's own parent", () => {
  assert.deepEqual(parseArgs(["scripts/lint-vault.mjs", "--worktree", ".."]), {
    ok: false,
    error: badWorktree(".."),
  });
  // `.` lands on the parent's own directory just as surely, and both survive a
  // character-class check that only asks about letters and punctuation.
  assert.equal(parseArgs(["scripts/lint-vault.mjs", "--worktree", "."]).ok, false);
});

test("parseArgs — a worktree name carrying a path is refused, in either slash", () => {
  assert.deepEqual(parseArgs(["scripts/lint-vault.mjs", "--worktree", "../../etc"]), {
    ok: false,
    error: badWorktree("../../etc"),
  });
  assert.deepEqual(parseArgs(["scripts/lint-vault.mjs", "--worktree", "sub/dir"]), {
    ok: false,
    error: badWorktree("sub/dir"),
  });
  // 🪟 A backslash is a separator on Windows, where this tool is not run — but a guard
  // that only knows one separator is a guard that teaches the wrong lesson to the next
  // reader, and `node:path` on win32 would honour it.
  assert.deepEqual(parseArgs(["scripts/lint-vault.mjs", "--worktree", "sub\\dir"]), {
    ok: false,
    error: badWorktree("sub\\dir"),
  });
});

// A trailing `--worktree` with nothing after it used to reach `join(parent, undefined)`,
// which throws a TypeError from deep inside node:path — a stack trace where a usage line
// belongs, on a tool whose next step is destructive.
test("parseArgs — a bare trailing `--worktree` is a usage error, not a TypeError", () => {
  assert.deepEqual(parseArgs(["scripts/lint-vault.mjs", "--worktree"]), {
    ok: false,
    error:
      "--worktree needs a name\n" +
      "usage: node maintainers/mutation/mutate-one.mjs <scripts/file.mjs> [more files…] " +
      "[--worktree <name>] [--log <name>] [--dry-run]",
  });
});

test("parseArgs — an ordinary worktree name still passes, punctuation included", () => {
  assert.equal(parseArgs(["scripts/lint-vault.mjs", "--worktree", "kenjaku-mut_s1.2"]).worktree, "kenjaku-mut_s1.2");
});

// 🚨 S2 (second pass of the v5.0.0 review) — `--log` IS THE ONE THAT CALLS THE DELETE.
//
// F6 hardened `--worktree` and left its sibling untouched, although the log name is the
// argument that actually reaches `rmSync`: the plan discards a stale log BEFORE the run,
// and then writes the Stryker output over that same path. An unchecked value escapes
// `maintainers/mutation/reports/` the moment it contains `..`.
const badLogError = (name) =>
  `log name "${name}" must be a single file name (letters, digits, . _ + -): it is created under ` +
  "maintainers/mutation/reports/, and a stale log at that path is DELETED before the run";

test("parseArgs — a `--log` name that climbs out of the reports directory is refused", () => {
  assert.deepEqual(parseArgs(["scripts/lint-vault.mjs", "--log", "../../../../.zshrc"]), {
    ok: false,
    error: badLogError("../../../../.zshrc"),
  });
  assert.deepEqual(parseArgs(["scripts/lint-vault.mjs", "--log", "sub/dir.log"]), {
    ok: false,
    error: badLogError("sub/dir.log"),
  });
  assert.deepEqual(parseArgs(["scripts/lint-vault.mjs", "--log", "sub\\dir.log"]), {
    ok: false,
    error: badLogError("sub\\dir.log"),
  });
});

// The second door onto the same `rmSync`, and the one a check on `--log` alone would
// leave open: with no `--log`, the name is DERIVED from the target — and the line range
// rides into it verbatim. `normalizeRange` only rewrites a bare trailing number, so
// anything else after the colon is carried through untouched. So the guard is on the
// RESOLVED name, whatever door it came through.
test("parseArgs — a target whose line range forges a path is refused by the same guard", () => {
  assert.deepEqual(parseArgs(["scripts/lint-vault.mjs:../../../../.zshrc"]), {
    ok: false,
    error: badLogError("mutate-one-lint-vault-../../../../.zshrc.log"),
  });
});

// The sibling of the bare trailing `--worktree`: `logName` starts as `null` and is
// resolved with `??`, so an option eating nothing used to fall back to the default log
// name in silence — a run whose output lands somewhere the caller did not ask for.
test("parseArgs — a bare trailing `--log` is a usage error, not a silent default", () => {
  assert.deepEqual(parseArgs(["scripts/lint-vault.mjs", "--log"]), {
    ok: false,
    error:
      "--log needs a name\n" +
      "usage: node maintainers/mutation/mutate-one.mjs <scripts/file.mjs> [more files…] " +
      "[--worktree <name>] [--log <name>] [--dry-run]",
  });
});

test("parseArgs — the ordinary derived log name, range included, still passes", () => {
  assert.equal(parseArgs(["scripts/lint-vault.mjs:75-88"]).logName, "mutate-one-lint-vault-75-88.log");
  assert.equal(parseArgs(["scripts/lint-vault.mjs:79"]).logName, "mutate-one-lint-vault-79-79.log");
});

// ─────────────────────────────────────────────────────────────────────────────
// linkedWorktrees — who is this run ALLOWED to reset?
// ─────────────────────────────────────────────────────────────────────────────

// Real `git worktree list --porcelain` output, copied from this repo: a blank line
// between records, and the MAIN worktree first. That first record is the repository
// itself — the one directory this tool must never reset — so it is dropped here rather
// than remembered by the caller.
const PORCELAIN = [
  "worktree /Users/dev/kenjaku",
  "HEAD bd9277d1c0ffee0000000000000000000000beef",
  "branch refs/heads/main",
  "",
  "worktree /Users/dev/kenjaku-mut-one",
  "HEAD bd9277d1c0ffee0000000000000000000000beef",
  "detached",
  "",
].join("\n");

test("linkedWorktrees — the main worktree is dropped, the linked ones are kept in order", () => {
  assert.deepEqual(
    linkedWorktrees(`${PORCELAIN}worktree /Users/dev/kenjaku-mut-two\nHEAD abc\ndetached\n\n`),
    ["/Users/dev/kenjaku-mut-one", "/Users/dev/kenjaku-mut-two"],
  );
});

test("linkedWorktrees — a repo with no linked worktree at all yields nothing to reset", () => {
  assert.deepEqual(
    linkedWorktrees("worktree /Users/dev/kenjaku\nHEAD abc\nbranch refs/heads/main\n\n"),
    [],
  );
  // Not `[""]`, and not a crash: an empty listing is what a failed read looks like
  // after `.split`, and it must mean "nothing is adoptable", never "everything is".
  assert.deepEqual(linkedWorktrees(""), []);
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

test("parseTestCounts — a COLOURISED summary reads exactly like a plain one", () => {
  // Real bytes, from `FORCE_COLOR=3 node --test`: every summary line is wrapped,
  // `\x1b[34mℹ pass 1\x1b[39m`. Both anchors then match nothing, all three counts
  // read null, and the runner aborts a perfectly green write-guard run with "did
  // not report a result". Loud and wrong is the right direction and still an hour
  // lost, with a workaround (`NO_COLOR=1`) that has to be remembered.
  const coloured = NODE_TEST_TAIL.split("\n")
    .map((line) => (line.startsWith("ℹ") ? `\x1b[34m${line}\x1b[39m` : line))
    .join("\n");

  assert.deepEqual(parseTestCounts(coloured), { pass: 22, fail: 0, skipped: 0 });
});

test("parseTestCounts — ANY colour sequence, not the two spellings node uses today", () => {
  // `\x1b[1;34m` (a parameter list) and `\x1b[m` (the bare reset) are as legal as
  // the `\x1b[34m` above, and both are one reporter change away. A stripper that
  // knows only the shape it was written against is the same bet that was just lost.
  const exotic = NODE_TEST_TAIL.split("\n")
    .map((line) => (line.startsWith("ℹ") ? `\x1b[1;34m${line}\x1b[m` : line))
    .join("\n");

  assert.deepEqual(parseTestCounts(exotic), { pass: 22, fail: 0, skipped: 0 });
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

// Stryker wraps its two SCORE columns in colour whenever the terminal takes it:
// `|\x1b[32m 100.00 \x1b[39m|`. Nothing else in the table is coloured, which is why the
// killed/survived counts kept reading and only the score went missing.
const colourScores = (table, open = "\x1b[32m", close = "\x1b[39m") =>
  table
    .split("\n")
    .map((line) => {
      const cells = line.split("|");
      if (cells.length < 8) return line;
      return cells.map((cell, i) => (i === 1 || i === 2 ? `${open}${cell}${close}` : cell)).join("|");
    })
    .join("\n");

test("parseMutationReport — a COLOURISED table reads exactly like a plain one", () => {
  // 🛑 Found while measuring T14's own fix: 66 killed, 0 survived, and the runner
  // announced `✅ Mutation score null %` over a table whose every row said 100.00.
  // `Number("\x1b[32m 100.00 \x1b[39m")` is NaN, and T13 had just turned NaN into null —
  // so the tell for "this run measured nothing" now also fires on a perfect score.
  //
  // T13 stripped the colour out of the OTHER parser in this file and stopped there. The
  // census was one function short, which is T10's lesson for the fifth time on this
  // branch: the call site a finding names is a sample, not the census.
  assert.deepEqual(parseMutationReport(colourScores(STRYKER_TAIL)), parseMutationReport(STRYKER_TAIL));
  // Pinned as a VALUE too, not only as an agreement: two identical nulls would satisfy
  // the line above while measuring nothing at all.
  assert.equal(parseMutationReport(colourScores(STRYKER_TAIL)).score, 81.57);
  assert.deepEqual(
    parseMutationReport(colourScores(STRYKER_TAIL)).files.map((f) => f.score),
    [71.82, 100, 100, 100],
    "and the per-file breakdown too — it is what the `measured nothing` gate reads",
  );
});

test("parseMutationReport — ANY colour sequence, not the one spelling Stryker uses today", () => {
  // The same triangulation `parseTestCounts` carries one section up, and for the same
  // reason: a stripper that knows a single shape is the bet this file has now lost twice.
  assert.equal(parseMutationReport(colourScores(STRYKER_TAIL, "\x1b[1;32m", "\x1b[m")).score, 81.57);
});

test("parseMutationReport — the overall row and every file row, whole", () => {
  assert.deepEqual(parseMutationReport(STRYKER_TAIL), {
    score: 81.57,
    killed: 331,
    timeout: 32,
    survived: 82,
    // The mutants this run actually produced — the number the two gates below read,
    // and the one the timeout message used to recompute at its call site.
    total: 445,
    files: [
      { file: "entrypoint-discipline.mjs", path: "lib/entrypoint-discipline.mjs", score: 71.82, survived: 82, timeout: 28 },
      { file: "entrypoint.mjs", path: "lib/entrypoint.mjs", score: 100, survived: 0, timeout: 4 },
      { file: "status-line.mjs", path: "status-line.mjs", score: 100, survived: 0, timeout: 0 },
      { file: "upstream-check-run.mjs", path: "upstream-check-run.mjs", score: 100, survived: 0, timeout: 0 },
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
    { file: "markdown.ts", path: "markdown.ts", score: 100, survived: 0, timeout: 0 },
    { file: "search.ts", path: "search.ts", score: 94, survived: 2, timeout: 0 },
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

// A run that generated ZERO mutants still prints a table, and its score cells read
// `n/a` — Stryker's own rendering of a NaN score (clear-text-score-table.js:
// `isNaN(score) ? 'n/a' : score.toFixed(2)`). `thresholds.break` is null in this
// repo's config, so Stryker exits 0 and the whole thing reads as a good run.
const EMPTY_TABLE = `----------------|------------------|----------|-----------|------------|----------|----------|
File            |  total | covered | # killed | # timeout | # survived | # no cov | # errors |
----------------|--------|---------|----------|-----------|------------|----------|----------|
All files       |    n/a |     n/a |        0 |         0 |          0 |        0 |        0 |
----------------|--------|---------|----------|-----------|------------|----------|----------|
`;

test("parseMutationReport — a run that measured NOTHING has no score, and `n/a` is not a number", () => {
  // T13. `Number("n/a")` is NaN, and NaN travelled the whole way to the screen:
  // `✅ Mutation score NaN % — 0 killed, 0 survived, 0 timeout`, exit 0. A null is
  // a fact the gate one door down can read; NaN is a number that fails every test
  // it is put to, silently.
  assert.deepEqual(parseMutationReport(EMPTY_TABLE), {
    score: null,
    killed: 0,
    timeout: 0,
    survived: 0,
    total: 0,
    files: [],
    timeoutShare: 0,
    // Vacuously: nothing timed out because nothing ran. The emptiness is refused
    // by its own gate, never by this one.
    trustworthy: true,
  });
});

// Stryker's table is a TREE: a directory is a row of its own, and its files are
// indented one space further beneath it. Real shape, read off reports/confirm-batch1.log
// (` lib` then `  note-refresh.mjs`, beside a bare ` refresh-note.mjs`), with one
// more level so the arithmetic that rebuilds a path has something to be wrong about.
const NESTED_TABLE = `--------------------|------------------|----------|-----------|------------|----------|----------|
File                |  total | covered | # killed | # timeout | # survived | # no cov | # errors |
--------------------|--------|---------|----------|-----------|------------|----------|----------|
All files           |  90.00 |   90.00 |       27 |         0 |          3 |        0 |        0 |
 lib                |  85.00 |   85.00 |       17 |         0 |          3 |        0 |        0 |
  sub               |  80.00 |   80.00 |        8 |         0 |          2 |        0 |        0 |
   deep.mjs         |  80.00 |   80.00 |        8 |         0 |          2 |        0 |        0 |
  shallow.mjs       |  90.00 |   90.00 |        9 |         0 |          1 |        0 |        0 |
 root.mjs           | 100.00 |  100.00 |       10 |         0 |          0 |        0 |        0 |
--------------------|--------|---------|----------|-----------|------------|----------|----------|
`;

test("parseMutationReport — a line that merely SAYS the table's words is not the table", () => {
  // Hostile rather than observed, and that is the point: a Stryker log is thousands
  // of lines of mutant diffs, stack traces and test names, and the ONLY thing
  // keeping any of them out of the table is the cell count. Both intruders below
  // wear a shape the rest of the parse would honour — one is the totals row's own
  // words, the other an indented path ending in `.mjs`.
  const noisy = `All files\n    scripts/lib/engine-source.mjs\n${STRYKER_TAIL}`;
  const report = parseMutationReport(noisy);

  assert.equal(report.killed, 331);
  assert.deepEqual(
    report.files.map((file) => file.path),
    ["lib/entrypoint-discipline.mjs", "lib/entrypoint.mjs", "status-line.mjs", "upstream-check-run.mjs"]
  );
});

test("parseMutationReport — a file row carries WHERE it lives, and a basename is not an identity", () => {
  // `engine-write-guard.mjs` exists BOTH at `scripts/` and at `scripts/lib/` in this
  // repo (so do vault-write-guard, ai-summary-guard and open-env), so a breakdown
  // read by name alone lets one of the two answer for the other. The indent is the
  // only thing in the table that tells them apart.
  assert.deepEqual(parseMutationReport(NESTED_TABLE).files, [
    { file: "deep.mjs", path: "lib/sub/deep.mjs", score: 80, survived: 2, timeout: 0 },
    { file: "shallow.mjs", path: "lib/shallow.mjs", score: 90, survived: 1, timeout: 0 },
    { file: "root.mjs", path: "root.mjs", score: 100, survived: 0, timeout: 0 },
  ]);
});

// ─────────────────────────────────────────────────────────────────────────────
// unmeasuredTargets — the file list you asked for, against the one you got
// ─────────────────────────────────────────────────────────────────────────────

// The two rows a run of `scripts/engine-write-guard.mjs` + `scripts/lib/engine-write-guard.mjs`
// produces: same name, two directories, and the table's paths relative to the root
// the two of them share.
const TWINS = parseMutationReport(`--------------------------|------------------|----------|-----------|------------|----------|----------|
File                      |  total | covered | # killed | # timeout | # survived | # no cov | # errors |
--------------------------|--------|---------|----------|-----------|------------|----------|----------|
All files                 |  90.00 |   90.00 |       18 |         0 |          2 |        0 |        0 |
 lib                      | 100.00 |  100.00 |       10 |         0 |          0 |        0 |        0 |
  engine-write-guard.mjs  | 100.00 |  100.00 |       10 |         0 |          0 |        0 |        0 |
 engine-write-guard.mjs   |  80.00 |   80.00 |        8 |         0 |          2 |        0 |        0 |
--------------------------|--------|---------|----------|-----------|------------|----------|----------|
`).files;

test("unmeasuredTargets — every target the breakdown names is measured, and the answer is empty", () => {
  assert.deepEqual(
    unmeasuredTargets(["scripts/status-line.mjs", "scripts/lib/entrypoint.mjs"], parseMutationReport(STRYKER_TAIL).files),
    []
  );
});

test("unmeasuredTargets — a target absent from the breakdown is NAMED, with its range stripped", () => {
  // T4's first run, 2026-08-23, in the wild: the range was typed `:34-52` and the
  // guard sat on line 53, so `engine-ancestor.mjs` contributed zero mutants and was
  // silently absent from the table while the batch's other file scored 100 %.
  assert.deepEqual(
    unmeasuredTargets(
      ["scripts/status-line.mjs", "scripts/lib/engine-ancestor.mjs:34-52"],
      parseMutationReport(STRYKER_TAIL).files
    ),
    ["scripts/lib/engine-ancestor.mjs"]
  );
});

test("unmeasuredTargets — two files of the same NAME are told apart by their directory", () => {
  assert.deepEqual(unmeasuredTargets(["scripts/engine-write-guard.mjs", "scripts/lib/engine-write-guard.mjs"], TWINS), []);

  // And the half that matters: with only the `lib` one measured, the other is named
  // — a suffix match on the bare basename would have let the `lib` row answer for it.
  assert.deepEqual(
    unmeasuredTargets(
      ["scripts/engine-write-guard.mjs", "scripts/lib/engine-write-guard.mjs"],
      TWINS.filter((file) => file.path.startsWith("lib/"))
    ),
    ["scripts/engine-write-guard.mjs"]
  );
});

test("unmeasuredTargets — the answer does not depend on the ORDER the table listed the rows in", () => {
  // The most specific row wins, and that must be a property of the function rather
  // than of Stryker's habit of printing directories before files. Reversed, a
  // first-match-wins reading hands `lib/engine-write-guard.mjs`'s target the bare
  // row, and then reports the file that WAS measured as missing.
  assert.deepEqual(
    unmeasuredTargets(["scripts/lib/engine-write-guard.mjs", "scripts/engine-write-guard.mjs"], TWINS),
    []
  );
  assert.deepEqual(
    unmeasuredTargets(["scripts/lib/engine-write-guard.mjs", "scripts/engine-write-guard.mjs"], [...TWINS].reverse()),
    []
  );
});

test("unmeasuredTargets — ONE row answers for ONE target: a single row cannot certify two", () => {
  // When a single file has mutants, the table's root collapses onto its directory
  // and the row is a bare `engine-write-guard.mjs`, which is a legal suffix of both
  // targets. Consuming the row is what stops it certifying the file that was never
  // measured. The order is not the point — one of the two is named, whichever.
  const lonely = [{ file: "engine-write-guard.mjs", path: "engine-write-guard.mjs", score: 100, survived: 0, timeout: 0 }];

  assert.deepEqual(unmeasuredTargets(["scripts/engine-write-guard.mjs", "scripts/lib/engine-write-guard.mjs"], lonely), [
    "scripts/lib/engine-write-guard.mjs",
  ]);
});

test("unmeasuredTargets — a table with no file rows at all names every target", () => {
  // The zero-mutant run: `n/a`, no rows, and every target unmeasured. Its own gate
  // speaks first in the runner, but this function must not go quiet here.
  assert.deepEqual(unmeasuredTargets(["scripts/a.mjs", "scripts/lib/b.mjs:1-9"], parseMutationReport(EMPTY_TABLE).files), [
    "scripts/a.mjs",
    "scripts/lib/b.mjs",
  ]);
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
        // The registry this repo really has: itself, plus the default worktree. A run
        // is allowed to reset the second and never the first (S1/S3), so the double
        // has to answer this one for real or every existing case below would refuse.
        if (args.join(" ") === WORKTREE_LIST_KEY) return { code: 0, output: PORCELAIN };
        return results[args.join(" ")] ?? { code: 0, output: "" };
      },
      symlink: (from, to) => calls.push({ fn: "symlink", from, to }),
      removeFile: (path) => calls.push({ fn: "removeFile", path }),
      writeFile: (path, body) => calls.push({ fn: "writeFile", path, bytes: body.length }),
      say: (line) => out.push(line),
    },
  };
}

const WORKTREE_LIST_KEY = "worktree list --porcelain";
const GUARD_KEY = "--test scripts/lib/vault-write-guard.test.mjs";
const MUTATE_KEY = (t = "scripts/lint-vault.mjs") =>
  `/Users/dev/kenjaku/maintainers/mutation/node_modules/@stryker-mutator/core/bin/stryker.js run maintainers/mutation/stryker.scripts.batch.config.mjs --mutate ${t}`;

// The target is `scripts/status-line.mjs` and NOT the `lint-vault.mjs` of the cases
// above, for one reason: STRYKER_TAIL is a real captured table, it names status-line
// and it does not name lint-vault. A fixture asking for a file its own table never
// mentions is the T13 defect wearing a green tick — and since 2026-08-23 the runner
// refuses exactly that, so the fixture had to become a run that could really happen.
test("runMutateOne — the happy path runs every step, writes the log, and reports the score", () => {
  const h = harness({
    results: {
      [GUARD_KEY]: { code: 0, output: NODE_TEST_TAIL },
      [MUTATE_KEY("scripts/status-line.mjs")]: { code: 0, output: STRYKER_TAIL },
    },
  });

  const code = runMutateOne(["scripts/status-line.mjs"], h.deps);

  assert.equal(code, 0);
  assert.deepEqual(
    h.calls.filter((c) => c.fn === "run").map((c) => c.args.join(" ")),
    // Two questions before a single git command CHANGES anything, and in this order:
    // may this run touch that directory at all (S1/S3 — a `reset --hard` in the wrong
    // place is worse than a score that was never measured), then are the targets
    // committed. Both are read-only; everything after them is not.
    [
      WORKTREE_LIST_KEY,
      STATUS_KEY("scripts/status-line.mjs"),
      "worktree prune",
      "reset --hard bd9277d1c0ffee0000000000000000000000beef",
      "clean -qfd -e rag/node_modules",
      GUARD_KEY,
      MUTATE_KEY("scripts/status-line.mjs"),
    ]
  );
  // Two removals, and the ORDER matters: the link's path is cleared before the symlink
  // is made (the step is unconditional now, so it meets an existing link), and the
  // stale log goes before the mutants run, never after.
  assert.deepEqual(h.calls.filter((c) => c.fn === "removeFile"), [
    { fn: "removeFile", path: "/Users/dev/kenjaku-mut-one/rag/node_modules" },
    { fn: "removeFile", path: "/Users/dev/kenjaku/maintainers/mutation/reports/mutate-one-status-line.log" },
  ]);
  assert.deepEqual(h.calls.filter((c) => c.fn === "symlink"), [
    { fn: "symlink", from: "/Users/dev/kenjaku/rag/node_modules", to: "/Users/dev/kenjaku-mut-one/rag/node_modules" },
  ]);
  assert.deepEqual(h.calls.filter((c) => c.fn === "writeFile"), [
    {
      fn: "writeFile",
      path: "/Users/dev/kenjaku/maintainers/mutation/reports/mutate-one-status-line.log",
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
    "▶ discard stale log /Users/dev/kenjaku/maintainers/mutation/reports/mutate-one-status-line.log",
    `▶ node ${MUTATE_KEY("scripts/status-line.mjs")}   (in /Users/dev/kenjaku-mut-one)`,
    "✅ Mutation score 81.57 % — 331 killed, 82 survived, 32 timeout",
    // The breakdown prints Stryker's own labels, so it can be laid beside the log
    // it came from. Where a file LIVES is the gate's business, not the reader's.
    "   entrypoint-discipline.mjs: 71.82 % (82 survived, 28 timeout)",
    "   entrypoint.mjs: 100 % (0 survived, 4 timeout)",
    "   status-line.mjs: 100 % (0 survived, 0 timeout)",
    "   upstream-check-run.mjs: 100 % (0 survived, 0 timeout)",
    "   log: /Users/dev/kenjaku/maintainers/mutation/reports/mutate-one-status-line.log",
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
  // "status" first: the gate proves the target is committed before any worktree exists.
  assert.deepEqual(h.calls.filter((c) => c.fn === "run").map((c) => c.args[0]), ["status", "worktree", "worktree"]);
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

test("runMutateOne — a run that measured NOTHING is refused, and no ✅ is printed", () => {
  // T13, third pass of the v5.0.0 review. Reproduced through this very function
  // before a line was changed: `✅ Mutation score NaN % — 0 killed, 0 survived, 0
  // timeout`, exit 0. Every mutation number this repo records as evidence comes
  // through here, and this file's own charter is "a loud failure instead of a score
  // that was never measured".
  const h = harness({
    results: {
      [GUARD_KEY]: { code: 0, output: NODE_TEST_TAIL },
      [MUTATE_KEY("scripts/lint-vault.mjs:900-999")]: { code: 0, output: EMPTY_TABLE },
    },
  });

  const code = runMutateOne(["scripts/lint-vault.mjs:900-999"], h.deps);

  assert.equal(code, 1);
  // The output is still written — it is the diagnosis, and the log is where the
  // reader finds Stryker's own `did not result in any files` line, if there was one.
  assert.deepEqual(h.calls.filter((c) => c.fn === "writeFile").map((c) => c.path), [
    "/Users/dev/kenjaku/maintainers/mutation/reports/mutate-one-lint-vault-900-999.log",
  ]);
  assert.deepEqual(h.out.slice(-1), [
    "❌ Stryker ran and measured NOTHING — 0 mutants, so its score is `n/a` and not a number. A mistyped " +
      "path, a line range past the end of the file, or a range landing entirely on comments each produce " +
      "exactly this, and none of them says so. Full output in " +
      "/Users/dev/kenjaku/maintainers/mutation/reports/mutate-one-lint-vault-900-999.log",
  ]);
  assert.equal(h.out.some((line) => line.includes("✅")), false);
});

test("runMutateOne — a TARGET that contributed no mutants is refused, BY NAME", () => {
  // The same defect one degree less total, and the one met in the wild on
  // 2026-08-23 (T4's first run): the batch scores 81.57 % over the files that DID
  // produce mutants, and the file the range missed is simply not in the table.
  // Reading the per-file breakdown by hand is what caught it; this is that read.
  const targets = ["scripts/status-line.mjs", "scripts/lib/engine-ancestor.mjs:34-52"];
  const h = harness({
    results: {
      [GUARD_KEY]: { code: 0, output: NODE_TEST_TAIL },
      [MUTATE_KEY(targets.join(","))]: { code: 0, output: STRYKER_TAIL },
    },
  });

  const code = runMutateOne(targets, h.deps);

  assert.equal(code, 1);
  assert.deepEqual(h.out.slice(-3), [
    "❌ 81.57 % was measured over the OTHER files — these TARGETS contributed no mutants at all:",
    "   scripts/lib/engine-ancestor.mjs",
    "   A line range past the end of the file, or one landing entirely on comments, measures nothing and " +
      "says nothing. Full output in /Users/dev/kenjaku/maintainers/mutation/reports/mutate-one-status-line+1.log",
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
  // A dry run CHANGES nothing — no file removed, no link made, and the one git call it
  // does make is the read-only ownership question. It is asked here on purpose: a dry
  // run whose whole job is to show the plan must not print `git reset --hard` over a
  // directory the real run would refuse, or the plan itself teaches the hazard.
  assert.deepEqual(h.calls.filter((c) => c.fn === "removeFile" || c.fn === "symlink"), []);
  assert.deepEqual(h.calls.filter((c) => c.fn === "run").map((c) => c.args.join(" ")), [WORKTREE_LIST_KEY]);
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

// ─────────────────────────────────────────────────────────────────────────────
// The UNCOMMITTED-TARGET gate — the trap that cost two runs on 2026-08-22.
//
// The worktree is built at `git rev-parse HEAD`, deliberately (a mutant of
// auto-commit.mjs must not be able to commit the instrumented tree). So a pass
// launched over an UNCOMMITTED change measures the old file and prints `✅` in
// exactly the same words. It happened at W1, the rule "COMMIT, THEN MUTATE" was
// written in RESULTS.md in bold the same night, and it happened again at W6 two
// hours later — because a written rule competes with an output that says ✅, and
// the output wins.
//
// Scoped to the TARGETS, never to the tree: editing plans while mutating a
// committed .mjs is the normal way this tool is used, and a whole-tree check
// would refuse every real run.
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_KEY = (...paths) => `status --porcelain -- ${paths.join(" ")}`;

test("targetPaths — the line range is stripped, because git status takes a path", () => {
  assert.deepEqual(
    targetPaths(["scripts/lib/a.mjs:75-88", "scripts/b.mjs", "scripts/lib/c.mjs:12-12"]),
    ["scripts/lib/a.mjs", "scripts/b.mjs", "scripts/lib/c.mjs"],
  );
});

test("uncommittedTargets — a modified file is reported with git's own two status columns", () => {
  assert.deepEqual(uncommittedTargets(" M scripts/lib/a.mjs\n"), [
    { status: " M", path: "scripts/lib/a.mjs" },
  ]);
});

test("uncommittedTargets — a file that was never committed at all is reported too", () => {
  // The worst case of the family: at HEAD the file does not exist, so Stryker
  // matches no file and scores the rest of the batch as if it had.
  assert.deepEqual(uncommittedTargets("?? scripts/lib/brand-new.mjs\n"), [
    { status: "??", path: "scripts/lib/brand-new.mjs" },
  ]);
});

test("uncommittedTargets — STAGED is still not committed, and both entries come back in order", () => {
  assert.deepEqual(uncommittedTargets("M  scripts/a.mjs\n M scripts/b.mjs\n"), [
    { status: "M ", path: "scripts/a.mjs" },
    { status: " M", path: "scripts/b.mjs" },
  ]);
});

test("uncommittedTargets — a clean pathspec says nothing, and that is an empty list", () => {
  assert.deepEqual(uncommittedTargets(""), []);
  assert.deepEqual(uncommittedTargets("\n"), []);
});

test("uncommittedTargets — two status columns and NO path is not an entry", () => {
  // Demanded by the mutation run (`length > 3` → `>= 3` survived). git cannot emit
  // an entry with an empty path, so the boundary looked decorative — and the way to
  // kill it is to feed the shape it excludes, not to reword the condition. An entry
  // with no path would be refused as `   ` in the message: a run stopped by a file
  // whose name nobody can read is worse than the run it was protecting.
  assert.deepEqual(uncommittedTargets("M  \n"), []);
});

test("runMutateOne — an uncommitted TARGET is refused before the worktree is touched", () => {
  const h = harness({
    results: { [STATUS_KEY("scripts/lib/a.mjs")]: { code: 0, output: " M scripts/lib/a.mjs\n" } },
  });

  const code = runMutateOne(["scripts/lib/a.mjs:75-88"], h.deps);

  assert.equal(code, 1);
  // The ONLY thing it ran is the question itself: no prune, no worktree, no mutants.
  // Asserted WHOLE — command and cwd included. The mutation run killed a `command:
  // "git"` → `command: ""` mutant only once this stopped reading the args alone, and
  // the cwd is load-bearing in its own right: the same question asked from another
  // directory answers about another tree.
  assert.deepEqual(h.calls.filter((c) => c.fn === "run"), [
    {
      fn: "run",
      command: "git",
      args: ["worktree", "list", "--porcelain"],
      cwd: "/Users/dev/kenjaku",
    },
    {
      fn: "run",
      command: "git",
      args: ["status", "--porcelain", "--", "scripts/lib/a.mjs"],
      cwd: "/Users/dev/kenjaku",
    },
  ]);
  assert.deepEqual(h.out, [
    "❌ the worktree is built at HEAD, and these TARGETS are not committed:",
    "    M scripts/lib/a.mjs",
    "   A run now would score the OLD bytes and say ✅ in the same words. Commit, then mutate.",
  ]);
});

test("runMutateOne — the question is asked about the TARGETS only, ranges stripped", () => {
  // A whole-tree check would refuse every real run: editing plans while mutating a
  // committed file is how this tool is used.
  // Both targets are files STRYKER_TAIL really names, and one of them lives in
  // `lib/` — the run ends at 0, so it has to be a run that could really happen.
  const h = harness({
    results: {
      [STATUS_KEY("scripts/status-line.mjs", "scripts/lib/entrypoint.mjs")]: { code: 0, output: "" },
      [GUARD_KEY]: { code: 0, output: NODE_TEST_TAIL },
      [MUTATE_KEY("scripts/status-line.mjs:1-9,scripts/lib/entrypoint.mjs")]: { code: 0, output: STRYKER_TAIL },
    },
  });

  const code = runMutateOne(["scripts/status-line.mjs:1-9", "scripts/lib/entrypoint.mjs"], h.deps);

  assert.equal(code, 0);
  // [1], not [0]: the ownership question is asked first and knows nothing of targets.
  assert.equal(
    h.calls.filter((c) => c.fn === "run")[1].args.join(" "),
    STATUS_KEY("scripts/status-line.mjs", "scripts/lib/entrypoint.mjs")
  );
});

test("runMutateOne — a git status that FAILS is refused, never read as clean", () => {
  // Empty output means "clean" and a crashed git also produces empty output. The
  // one that must not happen is a run proceeding because the question went wrong.
  const h = harness({
    results: {
      [STATUS_KEY("scripts/lib/a.mjs")]: { code: 128, output: "fatal: not a git repository\n" },
    },
  });

  const code = runMutateOne(["scripts/lib/a.mjs"], h.deps);

  assert.equal(code, 1);
  assert.deepEqual(h.out, [
    "❌ could not check whether the targets are committed — refusing to measure a tree I cannot name:",
    "fatal: not a git repository",
  ]);
});

test("runMutateOne — --dry-run does not ask THIS gate: an uncommitted target still prints its plan", () => {
  // Deliberate, and the line the two gates are told apart on: this one protects a
  // SCORE, and a dry run produces none. The ownership gate protects a DIRECTORY, and a
  // dry run that shows `git reset --hard` over the wrong one has already made the
  // hazard look routine — so that one is asked, and only that one.
  const h = harness({
    results: { [STATUS_KEY("scripts/a.mjs")]: { code: 0, output: " M scripts/a.mjs\n" } },
  });

  const code = runMutateOne(["--dry-run", "scripts/a.mjs"], h.deps);

  assert.equal(code, 0);
  assert.deepEqual(h.calls.filter((c) => c.fn === "run").map((c) => c.args.join(" ")), [WORKTREE_LIST_KEY]);
});

// 🚨 F6 (v5.0.0 code review) — THE ONE THAT DESTROYS UNCOMMITTED WORK.
//
// A worktree name is a legal single folder name and still names the repository itself:
// `--worktree kenjaku`, from `/Users/dev/kenjaku`, resolves to `/Users/dev/kenjaku`.
// The steps that follow are `git reset --hard <sha>` and `git clean -qfd` — run there,
// they discard every uncommitted change and every untracked file in the real checkout.
// It is one tab-completion away from the intended `kenjaku-mut-one`.
//
// The character check cannot see this: only the repo's own location can, so the guard
// lives where `repoRoot` does. What the test pins is not the message but the SILENCE —
// nothing ran.
test("runMutateOne — a worktree that resolves to the repository ITSELF is refused before anything runs", () => {
  const h = harness();

  const code = runMutateOne(["scripts/lint-vault.mjs", "--worktree", "kenjaku"], h.deps);

  assert.equal(code, 2);
  assert.equal(
    h.calls.some((c) => c.fn === "run"),
    false,
    "not one git call — `git reset --hard` here would discard the maintainer's working tree",
  );
  assert.deepEqual(h.out, [
    "❌ --worktree kenjaku resolves to /Users/dev/kenjaku, which IS this repository — refusing: " +
      "this run ends with `git reset --hard` and `git clean -qfd` in the worktree, and everything " +
      "uncommitted here would be gone.",
  ]);
});

// 🚨 S1 (second pass) — THE SAME DESTRUCTION, THROUGH A GUARD THAT SAYS YES.
//
// The check above compares STRINGS. macOS and Windows do not: `--worktree Kenjaku`,
// from `/Users/dev/kenjaku`, is a different string and the SAME directory. `existsSync`
// then says the folder is there, so the plan skips `git worktree add` and goes straight
// to `git reset --hard` + `git clean -qfd` inside the real checkout — the exact outcome
// F6 was written to prevent, one shift key away from the name F6's own comment quotes.
//
// The answer is not a case-insensitive comparison (that fixes one filesystem and lies on
// the next) but OWNERSHIP: git is asked which directories are worktrees OF THIS REPO, and
// nothing else may be reset. That single question also closes S3 below.
test("runMutateOne — a worktree name that differs from the repo only in CASE is refused", () => {
  const h = harness();

  const code = runMutateOne(["scripts/lint-vault.mjs", "--worktree", "Kenjaku"], h.deps);

  assert.equal(code, 2);
  assert.deepEqual(
    h.calls.filter((c) => c.fn === "run").map((c) => c.args.join(" ")),
    [WORKTREE_LIST_KEY],
    "the only git call is the read-only listing that earns the right to reset — nothing mutating ran",
  );
  assert.deepEqual(h.out, [
    "❌ --worktree Kenjaku resolves to /Users/dev/Kenjaku, which already exists and is NOT a worktree " +
      "of this repository — refusing: this run ends with `git reset --hard` and `git clean -qfd` there. " +
      "Worktrees of this repository: /Users/dev/kenjaku-mut-one",
  ]);
});

// 🚨 S3 (second pass) — recorded as F6's residual, and it is the same guard's job.
// A second CLONE of this repo beside it is one tab-completion away, passes every check
// on the NAME, and its uncommitted work dies the same way. It is not in this repo's
// worktree registry, so the ownership question refuses it without knowing what it is.
test("runMutateOne — a pre-existing SIBLING checkout is refused: this repo does not own it", () => {
  const h = harness();

  const code = runMutateOne(["scripts/lint-vault.mjs", "--worktree", "kenjaku-2"], h.deps);

  assert.equal(code, 2);
  assert.equal(
    h.calls.some((c) => c.fn === "run" && c.args.join(" ") !== WORKTREE_LIST_KEY),
    false,
    "not one mutating git call — `git reset --hard` here would discard another project's work",
  );
  assert.match(h.out[0], /^❌ --worktree kenjaku-2 resolves to \/Users\/dev\/kenjaku-2, which already exists/);
});

// A directory that does NOT exist is not a hazard: `git worktree add` creates it, and
// creating is the act that makes it ours. So the ownership question is asked only of a
// directory that is already there — and asking it is what tells the two apart.
test("runMutateOne — an unknown name that does not exist yet is created, not refused", () => {
  const h = harness({ worktreeExists: false });

  const code = runMutateOne(["--dry-run", "scripts/lint-vault.mjs", "--worktree", "kenjaku-mut-fresh"], h.deps);

  assert.equal(code, 0);
  assert.equal(
    h.calls.some((c) => c.fn === "run"),
    false,
    "nothing to ask git about: the directory is not there, so there is nothing to protect",
  );
  assert.equal(h.out[1], "   git worktree prune   (in /Users/dev/kenjaku)");
});

// Fails towards refusing, like the uncommitted-targets gate one door over: a registry
// this run cannot read is not an empty registry, and "I cannot tell" must never be the
// answer that authorises `git reset --hard`.
test("runMutateOne — a worktree registry that cannot be read stops the run", () => {
  const h = harness();
  const deps = {
    ...h.deps,
    run: (invocation) => {
      h.calls.push({ fn: "run", ...invocation });
      if (invocation.args.join(" ") === WORKTREE_LIST_KEY) return { code: 128, output: "fatal: not a git repository\n" };
      return { code: 0, output: "" };
    },
  };

  const code = runMutateOne(["scripts/lint-vault.mjs"], deps);

  assert.equal(code, 2);
  assert.deepEqual(
    h.calls.filter((c) => c.fn === "run").map((c) => c.args.join(" ")),
    [WORKTREE_LIST_KEY],
  );
  assert.deepEqual(h.out, [
    "❌ could not list this repository's worktrees — refusing to reset a directory I cannot prove is mine:",
    "fatal: not a git repository",
  ]);
});

// The sibling of the above, and the reason the guard compares PATHS rather than names:
// the ordinary name must still reach the plan, from the very same repoRoot.
test("runMutateOne — the ordinary worktree beside the repo is untouched by the guard", () => {
  const h = harness();

  const code = runMutateOne(["--dry-run", "scripts/lint-vault.mjs", "--worktree", "kenjaku-mut-one"], h.deps);

  assert.equal(code, 0);
  assert.equal(h.out[0], "▶ plan for scripts/lint-vault.mjs (worktree /Users/dev/kenjaku-mut-one):");
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
    results: {
      [GUARD_KEY]: { code: 0, output: NODE_TEST_TAIL },
      // status-line, like the happy path and for the same reason: it is a file
      // STRYKER_TAIL really names, and this case asserts a run that ends at 0.
      [MUTATE_KEY("scripts/status-line.mjs")]: { code: 0, output: STRYKER_TAIL },
    },
  });

  const code = runMutateOne(["scripts/status-line.mjs"], h.deps);

  assert.equal(code, 0);
  assert.deepEqual(h.calls.filter((c) => c.fn === "symlink"), [
    { fn: "symlink", from: "/Users/dev/kenjaku/rag/node_modules", to: "/Users/dev/kenjaku-mut-one/rag/node_modules" },
  ]);
  // Both silent steps say so: the first real run printed a log in which the
  // symlink and the discarded log were INVISIBLE, which reads as "it never
  // linked anything" on the one output anybody keeps.
  assert.match(h.out.join("\n"), /symlink \/Users\/dev\/kenjaku\/rag\/node_modules → \/Users\/dev\/kenjaku-mut-one\/rag\/node_modules/);
  assert.match(h.out.join("\n"), /discard stale log \/Users\/dev\/kenjaku\/maintainers\/mutation\/reports\/mutate-one-status-line\.log/);
  assert.deepEqual(
    h.calls.filter((c) => c.fn === "run").map((c) => c.args.slice(0, 3).join(" ")),
    [
      "status --porcelain --",
      "worktree prune",
      "worktree add --detach",
      "--test scripts/lib/vault-write-guard.test.mjs",
      "/Users/dev/kenjaku/maintainers/mutation/node_modules/@stryker-mutator/core/bin/stryker.js run maintainers/mutation/stryker.scripts.batch.config.mjs",
    ]
  );
});
