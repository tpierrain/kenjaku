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
//     score that was never measured — which includes the run that measured
//     NOTHING (`n/a`, 0 mutants, and a green tick until 2026-08-23) and the
//     TARGET that contributed nothing: a file with no mutants is not listed with
//     a zero, it is absent from the table, and the score belongs to its
//     neighbours;
//   • and the two arguments that are PATHS, not labels: `--worktree` selects the
//     directory `git reset --hard` lands in, `--log` the file `rmSync` deletes.
//     A run may only reset a directory git calls a worktree OF THIS REPO — names
//     are not evidence, on a filesystem that ignores case and beside a repo that
//     may have siblings.
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

// 🚨 `file.mjs:79` MEASURES NOTHING. Stryker's `--mutate` wants a RANGE: given a bare
// line number it logs `Glob pattern "…:79" did not result in any files` and scores the
// rest of the batch as if that line had been measured. Met on S10-QA, where nine of
// sixteen hunks were skipped that way and the run reported 85 % over the seven that
// were — a score that was never measured, which is the one failure this script exists to
// make impossible. Normalized rather than refused: `79` and `79-79` mean the same thing
// to the person typing it, and the tool is the one that knows Stryker's spelling.
function normalizeRange(target) {
  return target.replace(/:(\d+)$/, ":$1-$1");
}

// A single name — no directory, in the strictest reading: no separator in EITHER slash (a
// guard that knows one separator teaches the next reader the wrong lesson, and `node:path`
// on win32 honours both), and never `.` or `..` — both are legal spellings under a
// character class that only asks about letters and punctuation, and both resolve to
// somewhere that already holds something.
//
// ONE predicate for BOTH path-shaped arguments, deliberately: `--worktree` and `--log`
// each land on a path this tool then destroys (`git reset --hard` there, `rmSync` on the
// log), and two spellings of one limit are two behaviours to keep in step forever.
//
// `+` is in the class for the LOG side alone — `defaultLogName` spells a multi-target run
// `…+2.log` — and it is granted to both rather than forking the predicate: a `+` in a
// directory name separates nothing and escapes nowhere, which is the only question this
// guard is asking.
function isPlainName(name) {
  return /^[A-Za-z0-9._+-]+$/.test(name) && name !== "." && name !== "..";
}

// 🚨 T15 — AN OPTION'S VALUE IS NEVER ANOTHER OPTION. `--worktree` and `--log` take
// whatever follows them, so `--worktree --dry-run` used to mean "a worktree named
// `--dry-run`, and NO dry run": the person who typed `--dry-run` — the one being
// careful — got a real Stryker run, a real score, exit 0 and a stray directory beside
// the repo. No shape guard can catch that, because `-` is legal inside
// `kenjaku-mut-one`; the question is not what the value looks like, it is whether the
// thing after the option was ever a value at all.
//
// A LEADING dash is the whole rule. `undefined` is deliberately NOT an option here —
// nothing followed at all, which is a different mistake with its own sentence below.
const isOption = (value) => value !== undefined && value.startsWith("-");

export function parseArgs(argv) {
  const targets = [];
  let worktree = DEFAULT_WORKTREE;
  let logName = null;
  let dryRun = false;
  // The FIRST one, so the message points at the typo rather than at its last consequence.
  let swallowed = null;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") dryRun = true;
    else if (arg === "--worktree" || arg === "--log") {
      const value = argv[++i];
      // Written once for BOTH, rather than for the one a finding happened to name: F6
      // hardened `--worktree` and S2 had to come back for `--log`, on the very same
      // question. `i` has already moved past the swallowed option, so it is not read a
      // second time as a target either.
      if (isOption(value)) swallowed ??= { option: arg, value };
      else if (arg === "--worktree") worktree = value;
      else logName = value;
    } else targets.push(normalizeRange(arg));
  }

  if (!targets.length) return { ok: false, error: `no target file given\n${USAGE}` };

  // Before the shape guards below, and that ordering is the point: they would report
  // `--worktree "--dry-run" must be a single folder name`, which describes the value as
  // if it had been meant as one. What actually happened is that a flag went missing.
  if (swallowed) {
    return {
      ok: false,
      error:
        `${swallowed.option} needs a name, and "${swallowed.value}" is another option — it was swallowed, ` +
        "so whatever you meant by it will NOT happen (a --dry-run eaten this way is a REAL Stryker run)\n" +
        USAGE,
    };
  }

  // 🚨 THE WORKTREE NAME IS AN ARGUMENT TO `git reset --hard` (F6 of the v5.0.0 review).
  // It is joined onto the repo's PARENT, and the run that follows ends with
  // `git reset --hard <sha>` and `git clean -qfd` inside whatever that lands on. So it
  // is not a label: it selects the one directory this tool is allowed to destroy.
  //
  // Checked AFTER the target check on purpose — a missing target is the more basic
  // complaint, and `--worktree <target>` (the option eating its value) must keep
  // reporting the missing target rather than a strange-looking name.
  if (worktree === undefined) return { ok: false, error: `--worktree needs a name\n${USAGE}` };
  if (logName === undefined) return { ok: false, error: `--log needs a name\n${USAGE}` };
  if (!isPlainName(worktree)) {
    return {
      ok: false,
      error:
        `--worktree "${worktree}" must be a single folder name (letters, digits, . _ + -): the worktree is ` +
        "created BESIDE this repo, and the run ends with `git reset --hard` and `git clean -qfd` inside it",
    };
  }

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

  // 🚨 THE LOG NAME IS AN ARGUMENT TO `rmSync` (S2, second pass of the v5.0.0 review).
  // The plan discards a stale log BEFORE the run and writes the Stryker output over that
  // same path, so a name carrying `..` deletes and then overwrites a file outside the
  // reports directory. F6 hardened `--worktree` and left this one, which is the sibling
  // that actually calls the delete.
  //
  // Checked on the RESOLVED name, never on the option: with no `--log`, the name is
  // DERIVED from the target, and the line range rides into it verbatim
  // (`scripts/x.mjs:../../y` — `normalizeRange` only rewrites a bare trailing number). A
  // guard on the option alone would leave that door open. AFTER the target loop, so a
  // bogus target keeps reporting the more basic complaint.
  const resolvedLog = logName ?? defaultLogName(targets);
  if (!isPlainName(resolvedLog)) {
    return {
      ok: false,
      error:
        `log name "${resolvedLog}" must be a single file name (letters, digits, . _ + -): it is created ` +
        `under ${REPORTS}/, and a stale log at that path is DELETED before the run`,
    };
  }

  return { ok: true, targets, worktree, logName: resolvedLog, dryRun };
}

// mutate-one-<first file>.log, plus +N when the run carries more than one, so a
// batch never overwrites the single-file log of the same first target.
// A target may carry a LINE RANGE (`scripts/x.mjs:147-160`), which is the ordinary shape
// since the scope-the-change rule: the range rides through to Stryker untouched, but it
// must not ride into a filename. `:` is illegal on Windows, and `.mjs` in the middle of a
// log name reads as a source file. Both are stripped here, and the range is KEPT — two
// runs on two hunks of one file are two measurements and must not overwrite each other.
function defaultLogName(targets) {
  const [path, range] = targets[0].split(":");
  const stem = basename(path, ".mjs") + (range ? `-${range}` : "");
  const extra = targets.length - 1;
  return `mutate-one-${stem}${extra ? `+${extra}` : ""}.log`;
}

// ── Which directories is this run ALLOWED to reset? ──────────────────────────
//
// 🚨 S1/S3 (second pass of the v5.0.0 review). F6 refused the one name that resolves to
// the repository — by comparing STRINGS, on filesystems that do not: `--worktree Kenjaku`
// is a different string and the same directory on macOS and on Windows. And a second
// CLONE beside the repo (`kenjaku-2`) was never in question at all, though its
// uncommitted work dies exactly the same way.
//
// A case-insensitive comparison would fix one filesystem and lie on the next, and no
// check on the NAME can tell a sibling checkout from a worktree. The property is
// OWNERSHIP: git knows which directories are worktrees of this repository, and this run
// may reset those and nothing else.
//
// `git worktree list --porcelain` emits one record per worktree, blank-line separated,
// each opening with `worktree <path>` — and the MAIN worktree first, which is the
// repository itself and the one directory this tool must never reset. Dropped here rather
// than remembered by the caller.
export function linkedWorktrees(porcelain) {
  const paths = porcelain
    .split("\n")
    .filter((line) => line.startsWith("worktree "))
    .map((line) => line.slice("worktree ".length).trim());
  return paths.slice(1);
}

// ── The plan: an ordered list of steps, each one a VALUE ─────────────────────
// The order is the contract, and a value is the only thing a test can assert —
// the same lesson that turned defaultGit's inline invocation into a value.

export function planRun({ repoRoot, worktreePath, sha, targets, logPath, strykerBin, worktreeExists }) {
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

  // 🛑 UNCONDITIONAL, and AFTER the clean. This step used to be skipped when the link
  // already existed — a precondition read before the very step that invalidates it:
  // `git clean` removes the symlink despite the `-e`, so the plan skipped the link and
  // the preflight then refused the run for having no `rag/node_modules`. It ALTERNATED,
  // which is what hid it for so long: the run that found no link made one and passed,
  // leaving one for the next run to skip and fail on. Idempotent now (the executor
  // clears the path first), which costs one syscall and can never cost a run.
  steps.push({
    step: "link-rag-node-modules",
    from: join(repoRoot, RAG_MODULES),
    to: join(worktreePath, RAG_MODULES),
  });

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

// ── Are the targets actually IN the tree we are about to measure? ────────────
//
// 🚨 THE TRAP THIS CLOSES, met TWICE on 2026-08-22, two hours apart. The worktree
// is built at `git rev-parse HEAD` — deliberate, and stated in this file's header
// — so a pass launched over an UNCOMMITTED change measures the OLD bytes and
// prints `✅ Mutation score 100 %` in exactly the same words. At W1 it scored 32
// mutants of code that had not been written; at W6, 8 mutants of a function the
// change had replaced. Between the two, the rule *"COMMIT, THEN MUTATE"* was
// written into RESULTS.md in bold, and it did not fire: a written rule competes
// with an output that says ✅ either way, and the output wins.
//
// So it joins the other refusals this script already makes (a stale log, a
// starved timeout share, a write-guard that skips) — its own charter is *"a loud
// failure instead of a score that was never measured"*, and this was the one
// precondition it never checked.
//
// SCOPED TO THE TARGETS, never to the tree: editing plans while mutating a
// committed `.mjs` is how this tool is used every single run, and a whole-tree
// check would refuse all of them and be disabled within a day.

// `scripts/lib/a.mjs:75-88` → `scripts/lib/a.mjs`. The range is Stryker's business;
// git wants a pathspec.
export function targetPaths(targets) {
  return targets.map((target) => target.split(":")[0]);
}

// `git status --porcelain` emits, per entry, TWO status columns, a space, then the
// path. Both columns are kept and shown: ` M` (edited), `M ` (staged, still not in
// HEAD) and `??` (never committed — the worst of the family, since at HEAD the file
// does not exist and Stryker matches nothing at all) are three different stories,
// and the person reading the refusal is the one who has to tell them apart.
export function uncommittedTargets(porcelain) {
  return porcelain
    .split("\n")
    .filter((line) => line.length > 3)
    .map((line) => ({ status: line.slice(0, 2), path: line.slice(3) }));
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

// 🚨 COLOUR IS NOT CONTENT, and this is the ONE place that says so. Both readers below
// parse a terminal's output, and both were blinded by the same escape sequences —
// `node --test` wraps its summary lines, Stryker wraps its two score columns. T13 fixed
// the first and stopped there, so the second went on failing for one more day: it
// returned `null` over a table reading 100.00, and `null` is now the tell for a run that
// measured NOTHING. Two copies of this rule is how the second one gets forgotten.
//
// ANY colour sequence, not the spellings these two tools happen to use today: a
// parameter list (`\x1b[1;34m`) and the bare reset (`\x1b[m`) are just as legal, and a
// stripper written against one shape is the bet this file has now lost twice. Spelled
// `\x1b` rather than the raw byte, which is invisible to whoever reads this next.
const withoutColour = (text) => text.replace(/\x1b\[[\d;]*m/g, "");

// node --test's summary, or null when there is none: a run that crashed before
// reporting must never read as "nothing skipped".
export function parseTestCounts(output) {
  // Colour costs both anchors below their match, and a green run then reads as a run
  // that reported nothing.
  const plain = withoutColour(output);
  const count = (label) => {
    const found = plain.match(new RegExp(`^\\s*ℹ ${label} (\\d+)$`, "m"));
    return found ? Number(found[1]) : null;
  };
  const [pass, fail, skipped] = [count("pass"), count("fail"), count("skipped")];
  if (pass === null || fail === null || skipped === null) return null;
  return { pass, fail, skipped };
}

// `n/a`, never NaN. Stryker prints `n/a` in the score column when there is no score
// to print — `isNaN(score) ? 'n/a' : score.toFixed(2)`, and the score is NaN exactly
// when the run produced ZERO mutants. `Number("n/a")` is NaN, and NaN is a number
// that fails every test it is put to WITHOUT failing loudly: it printed
// `✅ Mutation score NaN %` and exited 0 (T13). A null is a fact a gate can read.
function scoreOrNull(cell) {
  const value = Number(cell);
  return Number.isFinite(value) ? value : null;
}

// Stryker's clear-text table. Returns null when there is no table — a killed or
// crashed run has no score, and that is not a zero.
export function parseMutationReport(log) {
  const rows = withoutColour(log)
    .split("\n")
    .map((line) => line.split("|"))
    .filter((cells) => cells.length >= 8)
    // The first cell's INDENT is kept, because the table is a TREE: a directory is a
    // row of its own and its files are indented one space further beneath it. Trimmed
    // away, `scripts/lib/engine-write-guard.mjs` and `scripts/engine-write-guard.mjs`
    // — both of which exist here — become the same row.
    .map((cells) => ({
      indent: cells[0].length - cells[0].trimStart().length,
      cells: cells.map((cell) => cell.trim()),
    }));

  const all = rows.find((row) => row.cells[0] === "All files");
  if (!all) return null;

  const [killed, timeout, survived] = [Number(all.cells[3]), Number(all.cells[4]), Number(all.cells[5])];
  const total = killed + timeout + survived;
  const timeoutShare = total ? timeout / total : 0;

  // Everything the tree walk needs is the indent: `All files`, the header and the
  // rules sit at zero and are not part of it; a directory at depth d occupies slot
  // d-1 and drops everything deeper; a file at depth d hangs under the d-1 dirs above it.
  const dirs = [];
  const files = [];
  for (const { indent, cells } of rows) {
    if (indent === 0) continue;
    const name = cells[0];
    if (name.endsWith(".mjs") || name.endsWith(".ts")) {
      files.push({
        // Stryker's own label, printed back verbatim so the breakdown can be laid
        // beside the log it came from; `path` is where that file actually lives.
        file: name,
        path: [...dirs.slice(0, indent - 1), name].join("/"),
        score: scoreOrNull(cells[1]),
        survived: Number(cells[5]),
        timeout: Number(cells[4]),
      });
    } else {
      dirs.length = indent - 1;
      dirs.push(name);
    }
  }

  return {
    score: scoreOrNull(all.cells[1]),
    killed,
    timeout,
    survived,
    total,
    files,
    timeoutShare,
    trustworthy: timeoutShare <= MAX_TIMEOUT_SHARE,
  };
}

// ── Did the run measure the files it was ASKED for? ──────────────────────────
//
// 🚨 T13, and it was met in the wild before it was reported: a file that produces
// no mutants is not listed with a zero, it is ABSENT — and the score belongs to
// whatever else was in the batch. On 2026-08-23 a range typed `:34-52` over a guard
// sitting on line 53 measured `engine-ancestor.mjs` NOT AT ALL, and the run printed
// `✅ Mutation score 100 %`. It was caught by reading the per-file breakdown by
// hand, every run, which is a discipline and therefore already failing.
//
// Matching is by PATH SUFFIX and never by name: the table's paths are relative to
// whatever root the measured files happen to share, and four basenames exist twice
// in `scripts/`. The LONGEST match wins, so `scripts/lib/x.mjs` takes the `lib/x.mjs`
// row and leaves the bare `x.mjs` row to `scripts/x.mjs`; and a row answers for ONE
// target, so a single row can never certify two files at once.
//
// A STRICT tail, and an equality case would be dead code: `parseArgs` refuses every
// target outside `scripts/`, and Stryker's table drops the prefix its files share,
// so a reported path can never be the whole target. Measured, not assumed — the
// disjunct `path === reported` survived a mutation run, having never once been the
// reason a target matched.
export function unmeasuredTargets(targets, files) {
  const available = files.map((file) => file.path);
  const missing = [];

  // 🚨 ONE FILE, HOWEVER MANY HUNKS. Stryker prints one row per FILE whatever the
  // number of ranges it was handed, so a batch naming six hunks of one file must
  // consume ONE row, not six — otherwise five of them look unmeasured and the run is
  // refused over a measurement it really made (met 2026-09-03, #84 step 3.7: five
  // hunks named as contributing nothing, over 19 honestly-killed mutants at 100 %).
  // That refusal is the exact mirror of T13's false green, and costs the same: a
  // guard nobody can trust gets bypassed within a day.
  //
  // It does NOT weaken "one row cannot certify two": that rule is about two distinct
  // FILES, and two hunks of one file are one file. `Set` keeps the first spelling and
  // its order, which is the one the refusal message names.
  for (const path of new Set(targetPaths(targets))) {
    const [match] = available
      .filter((reported) => path.endsWith(`/${reported}`))
      .sort((left, right) => right.length - left.length);

    if (match === undefined) missing.push(path);
    else available.splice(available.indexOf(match), 1);
  }

  return missing;
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

  // 🚨 The half of F6 the character check cannot see: `--worktree kenjaku`, from
  // `/Users/dev/kenjaku`, is a perfectly well-formed folder name that resolves to the
  // REPOSITORY ITSELF — one tab-completion away from the intended `kenjaku-mut-one`.
  // The steps below would then run `git reset --hard` and `git clean -qfd` in the real
  // checkout, discarding every uncommitted change and every untracked file.
  //
  // The guard lives here rather than in `parseArgs` because only this side knows where
  // the repo is, and it compares PATHS rather than names so the ordinary case beside the
  // repo is untouched.
  if (worktreePath === repoRoot) {
    say(
      `❌ --worktree ${parsed.worktree} resolves to ${worktreePath}, which IS this repository — refusing: ` +
        "this run ends with `git reset --hard` and `git clean -qfd` in the worktree, and everything " +
        "uncommitted here would be gone.",
    );
    return 2;
  }

  // 🚨 S1/S3 — and it is the check that actually holds, the one above being its
  // fast, specific special case. A directory that is ALREADY THERE is about to be
  // `git reset --hard`-ed, so this run has to prove it owns it (see `linkedWorktrees`).
  // A directory that is NOT there is created by `git worktree add`, and creating it is
  // what makes it ours — so nothing is asked, and nothing is at risk.
  //
  // BEFORE the committed-targets gate and before the dry run: preventing destruction
  // outranks preventing a meaningless score, and a dry run that PRINTS `git reset --hard
  // /Users/dev/Kenjaku` has already told the reader it is a fine idea.
  const worktreeExists = exists(worktreePath);
  if (worktreeExists) {
    const listed = run({ command: "git", args: ["worktree", "list", "--porcelain"], cwd: repoRoot });
    // Fails towards refusing, like the committed-targets gate one door over: a registry
    // this run cannot read is not an empty registry, and "I cannot tell" must never be
    // the answer that authorises `git reset --hard`.
    if (listed.code !== 0) {
      say("❌ could not list this repository's worktrees — refusing to reset a directory I cannot prove is mine:");
      say(listed.output.trimEnd());
      return 2;
    }
    const linked = linkedWorktrees(listed.output);
    if (!linked.includes(worktreePath)) {
      say(
        `❌ --worktree ${parsed.worktree} resolves to ${worktreePath}, which already exists and is NOT a ` +
          "worktree of this repository — refusing: this run ends with `git reset --hard` and " +
          `\`git clean -qfd\` there. Worktrees of this repository: ${linked.join(", ") || "(none)"}`,
      );
      return 2;
    }
  }

  const logPath = join(repoRoot, REPORTS, parsed.logName);
  const steps = planRun({
    repoRoot,
    worktreePath,
    sha,
    targets: parsed.targets,
    logPath,
    strykerBin: join(repoRoot, STRYKER_BIN),
    // The same answer the ownership guard just acted on — asked ONCE. Two reads of a
    // directory that a guard has decided about is a precondition read after its own
    // check, which is the shape that produced the rag-link alternation above.
    worktreeExists,
  });

  if (parsed.dryRun) {
    say(`▶ plan for ${parsed.targets.join(", ")} (worktree ${worktreePath}):`);
    for (const step of steps) say(`   ${renderStep(step)}`);
    return 0;
  }

  // AFTER the dry-run return, on purpose: the gate protects a SCORE, and a dry run
  // produces none. "--dry-run runs nothing" is a contract worth keeping literally
  // true — a dry run that shells out is not a dry run.
  const status = run({
    command: "git",
    args: ["status", "--porcelain", "--", ...targetPaths(parsed.targets)],
    cwd: repoRoot,
  });
  if (status.code !== 0) {
    // Empty output means "clean", and a crashed git also produces empty output. The
    // one thing that must not happen is a run proceeding because the question failed.
    say("❌ could not check whether the targets are committed — refusing to measure a tree I cannot name:");
    say(status.output.trimEnd());
    return 1;
  }
  const uncommitted = uncommittedTargets(status.output);
  if (uncommitted.length) {
    say("❌ the worktree is built at HEAD, and these TARGETS are not committed:");
    for (const { status: state, path } of uncommitted) say(`   ${state} ${path}`);
    say("   A run now would score the OLD bytes and say ✅ in the same words. Commit, then mutate.");
    return 1;
  }

  for (const step of steps) {
    // EVERY step announces itself, processes and the two file operations alike:
    // this output is the run's account of itself, and a symlink that happened
    // silently reads exactly like a symlink that never happened.
    say(`▶ ${renderStep(step)}`);

    if (step.step === "link-rag-node-modules") {
      // Clear first: the step is unconditional (see `planRun`), so it must survive
      // meeting a link the clean happened to spare. `removeFile` is `force`, so an
      // absent path is not an error.
      removeFile(step.to);
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
      // BEFORE the timeout share and before the score: a run with no mutants has a
      // vacuous timeout share (0 of 0) and a score that is not a number, so this is
      // the first question worth asking of a table at all.
      if (report.total === 0) {
        say(
          "❌ Stryker ran and measured NOTHING — 0 mutants, so its score is `n/a` and not a number. A mistyped " +
            "path, a line range past the end of the file, or a range landing entirely on comments each produce " +
            `exactly this, and none of them says so. Full output in ${logPath}`
        );
        return 1;
      }
      if (!report.trustworthy) {
        say(
          `❌ ${report.timeout} of ${report.total} mutants TIMED OUT ` +
            `(${Math.round(report.timeoutShare * 100)} %) — the ${report.score} % is starved CPU, not killed mutants. ` +
            `Re-run with nothing else running. Full output in ${logPath}`
        );
        return 1;
      }
      // AFTER the timeout gate: a starved run's per-file rows are as unreliable as
      // its total, and naming a missing target there would be a second complaint
      // about a run that has already failed for a bigger reason.
      const unmeasured = unmeasuredTargets(parsed.targets, report.files);
      if (unmeasured.length) {
        say(`❌ ${report.score} % was measured over the OTHER files — these TARGETS contributed no mutants at all:`);
        for (const path of unmeasured) say(`   ${path}`);
        say(
          "   A line range past the end of the file, or one landing entirely on comments, measures nothing and " +
            `says nothing. Full output in ${logPath}`
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
