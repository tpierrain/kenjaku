#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// mutate-one.mjs — mutate ONE `scripts/**` file, safely, in 1-3 minutes.
//
// This is the day-of runner CONVENTIONS §5quinquies prescribes: a new production
// file gets mutated the day it is written, not at the release tail. Everything it
// automates is a trap that has already cost a real run (RESULTS.md § S0bis):
//
//   • `git worktree prune` BEFORE `add` — a worktree that was rm -rf'd is still
//     registered, `add` refuses, the run silently never happens, and the PREVIOUS
//     log gets read as this run's result;
//   • a DISPOSABLE worktree — `inPlace` on the real tree is destructive (a
//     clear-example-notes mutant once deleted the vault's demo notes), and
//     Stryker's sandbox alternative has no `.git`, which engine-manifest-integrity
//     needs;
//   • reset with `reset --hard` + `clean -qfd -e rag/node_modules`, NEVER
//     `checkout -- .` (a mutant of auto-commit.mjs can COMMIT the instrumented
//     tree, which `checkout -- .` then faithfully restores);
//   • the `rag/node_modules` symlink, and the proof it bought something:
//     vault-write-guard.test.mjs must report 0 skipped, or the mutants face a
//     suite that cannot judge them;
//   • concurrency 5 + a 30 s timeout, or the run returns a fake 99.97 % made of
//     bogus timeouts — checked on the config before the run, and on the report
//     after it;
//   • a stale log discarded BEFORE the run, and a loud failure instead of a
//     score that was never measured.
//
// The judgement half — when to run a pass, how to read the survivors, when to
// simplify the production instead of adding a case — is the `mutation-testing`
// skill. This file is the braces; the skill is the belt.
//
//   node maintainers/mutation/mutate-one.mjs scripts/lint-vault.mjs
//   node maintainers/mutation/mutate-one.mjs scripts/a.mjs scripts/lib/b.mjs --dry-run
//
// Dev-only; `maintainers/` never ships to a generated brain.
// ─────────────────────────────────────────────────────────────────────────────
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runAsEntrypoint } from "../../scripts/lib/entrypoint.mjs";

export const USAGE =
  "usage: node maintainers/mutation/mutate-one.mjs <scripts/file.mjs> [more files…] " +
  "[--worktree <name>] [--log <name>] [--dry-run]";

const CONFIG = "maintainers/mutation/stryker.scripts.batch.config.mjs";
const STRYKER_BIN = "maintainers/mutation/node_modules/@stryker-mutator/core/bin/stryker.js";
const REPORTS = "maintainers/mutation/reports";
const WRITE_GUARD = "scripts/lib/vault-write-guard.test.mjs";
const RAG_MODULES = "rag/node_modules";
const DEFAULT_WORKTREE = "kenjaku-mut-one";

// A run whose mutants mostly TIMED OUT measured nothing: the suite was starved of
// CPU, not the mutants killed. Run #1 of the first scripts audit scored 99.97 %
// with 3564 of 3735 mutants timing out.
const MAX_TIMEOUT_SHARE = 0.25;

// ── The CLI surface ──────────────────────────────────────────────────────────

export function parseArgs(argv) {
  const targets = [];
  let worktree = DEFAULT_WORKTREE;
  let logName = null;
  let dryRun = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") dryRun = true;
    else if (arg === "--worktree") worktree = argv[++i];
    else if (arg === "--log") logName = argv[++i];
    else targets.push(arg);
  }

  if (!targets.length) return { ok: false, error: `no target file given\n${USAGE}` };

  for (const file of targets) {
    if (!file.startsWith("scripts/")) {
      return {
        ok: false,
        error:
          `${file} is outside scripts/ — use that package's own npm script ` +
          "(`npm --prefix maintainers/mutation run mutate:rag` / `mutate:local-mirror`), no worktree needed",
      };
    }
    if (file.endsWith(".test.mjs")) {
      return { ok: false, error: `${file} is a test file — mutate the production file it judges` };
    }
  }

  return { ok: true, targets, worktree, logName: logName ?? defaultLogName(targets), dryRun };
}

// mutate-one-<first file>.log, plus +N when the run carries more than one, so a
// batch never overwrites the single-file log of the same first target.
function defaultLogName(targets) {
  const stem = basename(targets[0], ".mjs");
  const extra = targets.length - 1;
  return `mutate-one-${stem}${extra ? `+${extra}` : ""}.log`;
}

// ── The plan: an ordered list of steps, each one a VALUE ─────────────────────
// The order is the contract, and a value is the only thing a test can assert —
// the same lesson that turned defaultGit's inline invocation into a value.

export function planRun({ repoRoot, worktreePath, sha, targets, logPath, strykerBin, worktreeExists, ragLinkExists }) {
  const steps = [{ step: "prune", command: "git", args: ["worktree", "prune"], cwd: repoRoot }];

  if (worktreeExists) {
    steps.push(
      { step: "reset", command: "git", args: ["reset", "--hard", sha], cwd: worktreePath },
      { step: "clean", command: "git", args: ["clean", "-qfd", "-e", RAG_MODULES], cwd: worktreePath }
    );
  } else {
    steps.push({
      step: "add-worktree",
      command: "git",
      args: ["worktree", "add", "--detach", worktreePath, sha],
      cwd: repoRoot,
    });
  }

  if (!ragLinkExists) {
    steps.push({
      step: "link-rag-node-modules",
      from: join(repoRoot, RAG_MODULES),
      to: join(worktreePath, RAG_MODULES),
    });
  }

  steps.push(
    { step: "verify-write-guard", command: "node", args: ["--test", WRITE_GUARD], cwd: worktreePath },
    { step: "discard-stale-log", path: logPath },
    {
      step: "mutate",
      command: "node",
      // ONE comma-separated list: a repeated --mutate keeps only the last value,
      // and the files it dropped read as measured in the log all the same.
      args: [strykerBin, "run", CONFIG, "--mutate", targets.join(",")],
      cwd: worktreePath,
    }
  );

  return steps;
}

// ── The config the run is about to use ───────────────────────────────────────

export function tuningViolations(config) {
  const violations = [];
  if (config.inPlace !== true) {
    violations.push(
      `inPlace is ${config.inPlace} — the sandbox has no .git, so engine-manifest-integrity dies before the first mutant`
    );
  }
  if (config.disableTypeChecks !== false) {
    violations.push(
      `disableTypeChecks is ${config.disableTypeChecks} — @ts-nocheck would be prepended to ~370 files of the worktree`
    );
  }
  if (config.concurrency > 5) {
    violations.push(
      `concurrency is ${config.concurrency}, must be at most 5 (higher oversubscribes the CPU and manufactures false timeouts)`
    );
  }
  if (config.timeoutMS < 30000) {
    violations.push(
      `timeoutMS is ${config.timeoutMS}, must be at least 30000 (a shorter timeout counts slow runs as killed mutants)`
    );
  }
  return violations;
}

// ── Reading what the two runs said ───────────────────────────────────────────

// node --test's summary, or null when there is none: a run that crashed before
// reporting must never read as "nothing skipped".
export function parseTestCounts(output) {
  const count = (label) => {
    const found = output.match(new RegExp(`^\\s*ℹ ${label} (\\d+)$`, "m"));
    return found ? Number(found[1]) : null;
  };
  const [pass, fail, skipped] = [count("pass"), count("fail"), count("skipped")];
  if (pass === null || fail === null || skipped === null) return null;
  return { pass, fail, skipped };
}

// Stryker's clear-text table. Returns null when there is no table — a killed or
// crashed run has no score, and that is not a zero.
export function parseMutationReport(log) {
  const rows = log
    .split("\n")
    .map((line) => line.split("|").map((cell) => cell.trim()))
    .filter((cells) => cells.length >= 8);

  const all = rows.find((cells) => cells[0] === "All files");
  if (!all) return null;

  const [score, killed, timeout, survived] = [Number(all[1]), Number(all[3]), Number(all[4]), Number(all[5])];
  const total = killed + timeout + survived;
  const timeoutShare = total ? timeout / total : 0;

  return {
    score,
    killed,
    timeout,
    survived,
    files: rows
      .filter((cells) => cells[0].endsWith(".mjs") || cells[0].endsWith(".ts"))
      .map((cells) => ({
        file: cells[0],
        score: Number(cells[1]),
        survived: Number(cells[5]),
        timeout: Number(cells[4]),
      })),
    timeoutShare,
    trustworthy: timeoutShare <= MAX_TIMEOUT_SHARE,
  };
}

// ── The run itself ───────────────────────────────────────────────────────────

export function runMutateOne(argv, deps) {
  const { repoRoot, sha, config, exists, run, symlink, removeFile, writeFile, say } = deps;

  const parsed = parseArgs(argv);
  if (!parsed.ok) {
    say(parsed.error);
    return 2;
  }

  const violations = tuningViolations(config);
  if (violations.length) {
    say(`❌ ${CONFIG} has drifted — refusing to run:`);
    for (const violation of violations) say(`   • ${violation}`);
    return 1;
  }

  const worktreePath = join(dirname(repoRoot), parsed.worktree);
  const logPath = join(repoRoot, REPORTS, parsed.logName);
  const steps = planRun({
    repoRoot,
    worktreePath,
    sha,
    targets: parsed.targets,
    logPath,
    strykerBin: join(repoRoot, STRYKER_BIN),
    worktreeExists: exists(worktreePath),
    ragLinkExists: exists(join(worktreePath, RAG_MODULES)),
  });

  if (parsed.dryRun) {
    say(`▶ plan for ${parsed.targets.join(", ")} (worktree ${worktreePath}):`);
    for (const step of steps) say(`   ${renderStep(step)}`);
    return 0;
  }

  for (const step of steps) {
    // EVERY step announces itself, processes and the two file operations alike:
    // this output is the run's account of itself, and a symlink that happened
    // silently reads exactly like a symlink that never happened.
    say(`▶ ${renderStep(step)}`);

    if (step.step === "link-rag-node-modules") {
      symlink(step.from, step.to);
      continue;
    }
    if (step.step === "discard-stale-log") {
      // Before the run, never after: a log left over from a previous run is the
      // most convincing way to be told a number that was never measured.
      removeFile(step.path);
      continue;
    }

    const result = run(step);

    if (step.step === "verify-write-guard") {
      const counts = parseTestCounts(result.output);
      if (result.code !== 0 || !counts) {
        say(`❌ ${WRITE_GUARD} did not report a result in ${worktreePath} — the worktree is not usable:`);
        say(result.output.trimEnd());
        return 1;
      }
      if (counts.skipped > 0 || counts.fail > 0) {
        say(
          `❌ ${WRITE_GUARD} reports ${counts.skipped} skipped and ${counts.fail} failed in the worktree — ` +
            `mutants would face a suite that cannot judge them. Check the ${RAG_MODULES} symlink.`
        );
        return 1;
      }
      say(`   ✓ write guard: ${counts.pass} pass, 0 skipped`);
      continue;
    }

    if (step.step === "mutate") {
      writeFile(logPath, result.output);
      const report = parseMutationReport(result.output);
      if (result.code !== 0 || !report) {
        say(`❌ Stryker failed and measured nothing — full output in ${logPath}`);
        return 1;
      }
      if (!report.trustworthy) {
        say(
          `❌ ${report.timeout} of ${report.killed + report.timeout + report.survived} mutants TIMED OUT ` +
            `(${Math.round(report.timeoutShare * 100)} %) — the ${report.score} % is starved CPU, not killed mutants. ` +
            `Re-run with nothing else running. Full output in ${logPath}`
        );
        return 1;
      }
      say(`✅ Mutation score ${report.score} % — ${report.killed} killed, ${report.survived} survived, ${report.timeout} timeout`);
      for (const file of report.files) {
        say(`   ${file.file}: ${file.score} % (${file.survived} survived, ${file.timeout} timeout)`);
      }
      say(`   log: ${logPath}`);
      continue;
    }

    if (result.code !== 0) {
      say(`❌ \`${renderStep(step)}\` failed:`);
      say(result.output.trimEnd());
      return 1;
    }
  }

  return 0;
}

function renderStep(step) {
  if (step.step === "link-rag-node-modules") return `symlink ${step.from} → ${step.to}`;
  if (step.step === "discard-stale-log") return `discard stale log ${step.path}`;
  return `${step.command} ${step.args.join(" ")}   (in ${step.cwd})`;
}

// ── The composition root ─────────────────────────────────────────────────────

export async function defaultDeps() {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
  return {
    repoRoot,
    sha: execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).trim(),
    config: (await import("./stryker.scripts.batch.config.mjs")).default,
    exists: (path) => existsSync(path),
    // Buffered rather than streamed: a one-file run is 1-3 minutes, and the whole
    // output has to be captured to be written to the log and parsed for a score.
    run: ({ command, args, cwd }) => {
      const done = spawnSync(command, args, { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
      return { code: done.status ?? 1, output: `${done.stdout ?? ""}${done.stderr ?? ""}` };
    },
    symlink: (from, to) => symlinkSync(from, to, "dir"),
    removeFile: (path) => rmSync(path, { force: true }),
    writeFile: (path, body) => writeFileSync(path, body),
    say: (line) => console.log(line),
  };
}

runAsEntrypoint(import.meta.url, process.argv, async (argv) => runMutateOne(argv, await defaultDeps()));
