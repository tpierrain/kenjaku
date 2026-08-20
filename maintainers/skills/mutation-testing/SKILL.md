---
name: mutation-testing
description: "Run and READ a mutation pass on this repo (StrykerJS): when a pass is due, which runner to use for which package, how to batch it, and how to judge the survivors — kill, simplify the production, or name an honest equivalent. Use when about to mutate a file, when a run has just produced survivors, when a score has to be written up, or when a run behaves oddly (a stale log, a suspiciously high score, a worktree that refuses to be created). Maintainer skill: it never travels to a generated brain."
---

# Mutation testing, on this repo

The mutation score is **the judge of the tests**, not a ceremony (`test-first-discipline`). This skill
is the **judgement** half of that: when a pass is due, how to read what it gives back, and what to
write down. The **mechanics** are the other half and they are a script —
[`maintainers/mutation/mutate-one.mjs`](../../mutation/mutate-one.mjs) — because every mechanical trap
below has already cost a real run at least once, and a written reflex was measured as insufficient
(CONVENTIONS §5quinquies).

> **Not here**: how to write a killing assertion. That is `test-first-discipline` (a matcher on every
> `throws`, assert the whole object, triangulate bounds, collections ≥2 unsorted, a double's answer as
> a fingerprint). This skill starts once the run has produced a number.
>
> **Nor the portable version of the traps below.** Since 2026-08-20, `test-first-discipline` §*"A
> mutation run LIES to you"* carries the five ways any run hands back a number that measures nothing,
> and the survivor triage that precedes writing a test — tool- and language-agnostic. **This file owns
> the local answer**: which command, which worktree, which package. Read the doctrine there, run it
> here.

## 1. When a pass is due

- **The day a production file is finished** — one file, 1-3 minutes, before moving on. This is the
  rule that exists because a lesson arriving only at the release tail can tax the writing but can
  never teach it (CONVENTIONS §5quinquies).
- **At the release tail**, over everything the branch changed versus `main`. This one is the
  *measurement* that gets written up, and it is deliberately run once the branch has stopped moving.
- **Again, whenever production moved afterwards.** A review that changes production code invalidates
  the number that preceded it: **a score is only true of the code it ran on.** v4.9.1 needed three
  passes for that reason, and said so in its write-up.

## 2. How to run it

**`scripts/**` — always through the runner:**

```bash
node maintainers/mutation/mutate-one.mjs scripts/<file>.mjs          # one file
node maintainers/mutation/mutate-one.mjs scripts/a.mjs scripts/lib/b.mjs
node maintainers/mutation/mutate-one.mjs scripts/<file>.mjs --dry-run  # print the plan, run nothing
```

It prunes stale worktree registrations, creates or resets the disposable worktree, symlinks
`rag/node_modules`, proves the write-guard suite reports **0 skipped** there, discards any stale log,
runs Stryker, and refuses a score it did not really measure. Its log lands in
`maintainers/mutation/reports/` — in the **real** repo, so it outlives the worktree.

**`rag/**` and `local-mirror/**` — their own npm scripts, no worktree needed:**

```bash
npm --prefix maintainers/mutation run mutate:rag
npm --prefix maintainers/mutation run mutate:local-mirror
```

**A whole branch's diff:** `node maintainers/mutation/mutate-changed.mjs [baseRef]` — it reports
`scripts/**` changes but does not run them, on purpose; feed those to `mutate-one.mjs`.

### When the runner refuses

Each refusal is a real failure mode, not a formality:

| It says | It means |
|---|---|
| `<file> is outside scripts/` | Wrong package — use that package's npm script above. |
| `<file> is a test file` | Mutating a test measures nothing; mutate the production file it judges. |
| `stryker.scripts.batch.config.mjs has drifted` | `concurrency`/`timeoutMS`/`inPlace`/`disableTypeChecks` moved. Fix the config, don't bypass the check: this is exactly how a run returns a **fake 99.97 %**. |
| `vault-write-guard.test.mjs reports N skipped` | The `rag/node_modules` symlink did not survive. The mutants would face a suite that cannot judge them — a fiction with a score on top. |
| `N of M mutants TIMED OUT` | The machine was starved, not the mutants killed. Re-run with nothing else running. |
| `Stryker failed and measured nothing` | Read the log. There is **no number** from this run — do not reach for the previous one. |

### Batching, when the run is bigger than one file

A backgrounded command is capped at ~10 minutes and the whole `scripts` package is ~30. Split by
file list, **one `--mutate` list per batch**, and let the runner reset the worktree between them.
Name each log after its batch (`--log <name>.log`) so no batch overwrites another's evidence.

## 3. Reading the survivors

A first-pass survivor is **information about the tests**, and it sorts into three families. Only the
third is a missing case:

1. **A real adapter layer judged by nothing.** Every test drove the code through doubles, so the real
   git call or the real DB read was never executed at all — a mutant could empty either one whole.
   The fix is a **seam**: make the invocation a value (`buildGitInvocation(args) → {command, args,
   options}`) and assert it whole, then prove the real edge with the one call safe enough to make
   (`git --version`, reading a database that is not there).
2. **A double that ignores its arguments.** A fake `readFileSync(p)` that drops the encoding lets
   every call site lose its `"utf8"` with the suite still green — six survivors once lived in that
   one omission. *A double's answer has to be a fingerprint of what it was asked, or it certifies
   nothing.*
3. **Genuinely missing cases** — the failure branch, the absent file, the second reason that shares a
   sentence with the first.

### The reflex that beats writing a case: simplify the production

Whenever it applies, this is the better answer. A guard that cannot change any outcome is **dead
code, not a coverage gap** — and its mutants are unkillable by construction:

- an `existsSync` check in front of a `try/catch` that already answers for the absent file (two
  branches, four mutants, no behaviour of its own);
- a regex anchor made redundant by a `slice(0, 2)` already doing the anchoring;
- a blank-line filter in front of a test that blank lines fail anyway.

Delete it, keep the reason as a comment, and the mutants go with it. Five of one round's sixteen
survivors were killed this way.

### When "equivalent" is honest, and when it is rounding up

A named equivalent is a **claim that no test could ever distinguish the mutant**, and it must be
written with the reason, not the label. Honest ones look like: the fallback string whose replacement
yields the same empty reason; the `pulled: []` branch whose count is rendered only on a branch that
is unreachable exactly when `[]` is taken; the entry-guard mutant in a hook module that its test
imports rather than spawns. If the reason needs a paragraph of hedging, it is a gap.

### One trap that is about the code being mutated, not the runner

**Mutating a file that a source scanner reads breaks the dry run.** Stryker instruments in place, so
the literals a scanner looks for get rewritten under it (`entrypoint-discipline.mjs` scanning
`session-status.mjs` is the case that cost a round). Pay it rather than work around it: turn the
scanned construct into a **named value**, which is stable under instrumentation *and* assertable.

## 4. Where the numbers go

- **`maintainers/mutation/RESULTS.md` is the measurement register** — every score, per file, with the
  survivors left and why. A **dated past-tense measurement** (*"2026-08-20 — 54.05 % → 84.21 %"*) is a
  record and stays true forever; a **present-tense claim** about current state rots and belongs only
  in the file that owns it.
- **`maintainers/mutation/RETROSPECTIVE.md`** keeps the **design** lessons mined from survivors — the
  shapes that keep coming back, not the anecdote of the file just fixed.
- **The logs** stay in `maintainers/mutation/reports/`, never in a worktree or a scratchpad: both
  `scripts` worktrees of v4.4.0 lived under the session scratchpad and macOS's temp cleanup took the
  HTML reports with them.
- **A lesson recorded as a story about one file does not generalise.** Record the **constraint** — a
  guard test, a numbered ceiling that may only shrink — not *"`rag-status.mjs` had five loose
  assertions"*.

## 5. Sibling reading

- `test-first-discipline` — how to write the assertion that kills the mutant.
- `maintainers/CONVENTIONS.md` §5quater / §5quinquies / §10 — the standing rules this skill serves.
- `maintainers/mutation/RESULTS.md` § S0bis — the run every trap above was paid for on.
