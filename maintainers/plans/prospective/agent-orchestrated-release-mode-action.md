<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- STATUS: 🟠 PROPOSED 2026-08-19 — the working CONTRACT for building the      -->
<!-- unfreeze release with subagents. The map and the rules below are written;   -->
<!-- the three arbitrations in § Waiting on the owner are NOT, and no autonomous -->
<!-- loop starts before they are answered.                                       -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Working contract — building the unfreeze release with orchestrated subagents

> **This plan owns HOW, not WHAT.** The what is
> [`update-regime-owns-what-it-shipped-action.md`](update-regime-owns-what-it-shipped-action.md), which
> is unchanged and remains the single source of the release's own state. This file exists so the
> *working mode* is written down instead of living in a conversation, and so a session resuming after
> a `/clear` knows what it may dispatch and what it may not.

## Why this exists — the owner's intent, in his words (2026-08-19)

*"Être un peu moins derrière toi et te laisser bosser, mais de manière efficace"* — no more standing
behind the session pressing buttons and clearing the context. Concretely he asked for:

- work **cut into very small tasks dispatched to subagents**;
- **loop engineering** where it fits: a fixed objective, and the session keeps working until the
  objective is met **or the quota is spent**;
- his own presence reduced to **framing the loops and the operating mode**, then relative autonomy
  **without generating context rot**.

The reference is his own article, *What if `/clear` was no longer our job?*
(<https://medium.com/@tpierrain/what-if-clear-was-no-longer-our-job-16fe571ae206>).
⚠️ **It could not be read** on 2026-08-19 — Medium returns **403** to WebFetch and to a browser
user-agent, and the Chrome extension did not answer. This plan is written from his chat words, not
from the article. Do not burn turns re-fetching it; ask him to paste it if its detail is needed.

**Ruled out, do not re-propose** _(owner, same day)_: building this release on top of a **knowledge
graph of the codebase**. Too slow to stand up, and the codebase is too small to repay it. Measured
2026-08-19: **61 top-level `scripts/*.mjs`**, **~11 300 non-test lines** across `rag/src` + `scripts`
— a volume an agent reads directly.

## The one rule that makes delegation safe

> 🛑 **Nothing is dispatched to a subagent without a pass/fail a machine can evaluate.**

A subagent cannot ask the owner a question. Without a judge it returns work that is confident and
wrong, and the orchestrating session has no cheap way to notice. So the delegation criterion is **not
task size** — it is *"can this be judged without a human?"*. In this repo the judges already exist:
the harness test suite, the mutation score (`maintainers/mutation/`), `scripts/verify-rag.mjs`, and
the QA release fixtures. A task with none of them attached is a task the main session keeps.

Corollary, and it is the expensive half: **the tests come first and they are written before the
fan-out**, never by the parallel agents themselves. An agent that writes both the test and the code it
judges will produce a tautological pair. This is the standing test-first discipline, and orchestration
makes breaking it cheaper, so it has to be said out loud here.

## The second rule, learned the hard way the same day: delegate the READING too

Subagents are not only for *doing*, they are for **reading on the main session's behalf**. A subagent
has its own context window; whatever it swallows never touches this one, and it returns a paragraph
instead of a library.

**The demonstration, by failure, 2026-08-19.** Answering the owner's model-choice question, the main
session invoked the `claude-api` skill directly. Measured on disk right after: **64 Markdown files,
779 501 characters ≈ ~195 000 tokens** (the largest single file, `shared/model-migration.md`, is
174 614 characters on its own). On top of ~87k already in the window that lands near the ~350k
auto-compact budget, and the session **auto-compacted mid-turn**, opaquely. The content was right; the
*place* was wrong. A `claude-code-guide` subagent would have absorbed all of it and returned two
paragraphs.

- [ ] **Reflex to apply for the whole chantier**: any bulk reference read (a large skill bundle, a
      wide codebase sweep, a doc set) goes to a subagent, and the main session keeps the conclusion.
- [ ] Note for the ROADMAP-level lesson: the status line is a **lagging** indicator (it renders
      between turns), so a single oversized tool result can cross the threshold with no warning. Do
      not rely on watching the percentage.

## The delegability map (assessment given in chat 2026-08-19)

| Cargo | Mode | Judge |
|---|---|---|
| **S0bis** — the inherited mutation debt | 🟢 **The ideal loop.** Mechanical, sliceable file by file across the ~28 scripts carrying the entry-guard shape. | Mutation score up, suite green |
| **QA release fixtures** | 🟢 Highly delegable, one agent per published tag. | Install replays, binary outcome |
| **S1–S5** — base, three-way merge, write guard, audible divergence, `CLAUDE.engine.md`'s regime | 🟠 **ONE design, not five.** Fan out the **implementation slices against tests already written**, never the design. | The tests written first |
| **S6 rider** — skill delivery/retirement | 🟠 Mechanical, but **sequences after S1–S3** (its retirement guard depends on the regime work). | Its acceptance test |
| **Doctrine cargo** (#61, #67, #64's rule half, source-first) | 🔴 Not delegable. Text that speaks in the owner's voice. | Him |

Why S1–S5 must not be fanned out as design: five agents designing five halves of one merge model
return five incompatible models, and reconciling them costs more than designing once. The parallelism
lives one level down, in implementation.

## Where the owner is required, quota or no quota

- [ ] Cutting, tagging and publishing a release.
- [ ] The tone of release notes and any user-facing text (`release-notes-tone`).
- [ ] Any scope arbitration — adding to or dropping from the release cargo.
- [ ] Merging pull requests.
- [ ] Anything destructive (`never-surface-destructive-paths` — the human types the guard).

## Model choice for this mode (recorded 2026-08-19)

- [x] **Stay on Opus 5** for the orchestrating session. Reasons, from the current model reference:
      it is **half the price** of Fable 5 ($5/$25 vs $10/$50 per MTok), which is the whole difference
      on a quota-bounded loop; Fable 5 is tuned for very long single turns (minutes), a poor tempo for
      framing loops interactively; and Opus 5 already **leans into subagent delegation** (the
      documented advice is to *cap* it, not encourage it), which is exactly the behaviour wanted here.
- [x] **Subagents run at low/medium effort** — the documented guidance for simple and mechanical tasks,
      and it is where the token budget is actually spent.
- [ ] **Trigger for reconsidering**: one genuinely hard, isolated design decision (the three-way merge
      engine is the candidate). Fable 5 one-shot for that, then back.

## ✅ The three arbitrations — APPROVED by the owner 2026-08-20

> **The binding constraint, stated by the owner 2026-08-19**: *"faudrait qu'on arrive à trouver un truc
> qui tienne en 200 000 tokens max par tentative … j'ai pas envie qu'on génère du code un peu merdique
> à cause du contexte rot."* Everything below is derived from it. And: **baby steps**, explicitly asked
> for.

- [ ] **1. The quota — a CONTEXT ceiling, not a spend.** The question is not *how much may be spent*,
      it is *how large one unit of work may grow*. Therefore:
  - [ ] One dispatched agent = one slice, with its files **named in the prompt** (never "go find
        them") and its judge command supplied. A slice needing more than ~3 files read is **mis-cut**:
        re-cut it rather than let it grow.
  - [ ] The orchestrating session **delegates all bulk reading** (see the rule above) and hands back at
        **~170k** rather than riding into auto-compaction, which is the very degradation being avoided.
  - [ ] Loop mode is what makes this structural rather than vigilant: **each agent starts on a fresh
        context**, so the 200k ceiling holds by construction.
  - [ ] The run stops at whichever comes first: **objective met**, **~25 agents dispatched**, or a
        **blocking arbitration**.
- [ ] **2. The autonomy perimeter.**
  - [ ] **Allowed unasked**: create a branch, commit green-only, push as it goes, open a **draft** pull
        request so the owner wakes to a reviewable diff.
  - [ ] **Never**: merge, tag, publish, write to `main`, anything destructive, any scope change.
  - [ ] **On hitting an arbitration**: stop that slice, write the question in this file, keep the other
        slices moving.
- [ ] **3. The granularity of the stop points.** No hand-back per box. **The plan is the running
      trace**: each slice ticks its box with _(date · commit)_, and a **Run log** section records what
      the last agent did and what comes next. The owner reads the plan, not the thread. Hand back only
      on objective reached, quota spent, or blocking arbitration.

## 🛑 The test discipline in force — read this before writing a line

> **Confirmed with the owner 2026-08-20, because the wording below could be misread.** The slicing
> discipline (small slices, a canary before any fan-out) is about **DELIVERY GRANULARITY**. It is
> **not** a licence to revert to classic TDD baby-steps and triangulation, which were retired on
> 2026-08-15 after being measured.

The mode in force is **design-first, then test-first in coherent batches**:

- [ ] State the design, then write a **coherent batch of tests** for it — not one test at a time.
- [ ] See them **all red for the RIGHT reason** (an unsatisfied assertion, never a loading error).
      This is the load-bearing rule and it is not optional.
- [ ] Implement, then **refactor as part of the step** — never optional, never weakening an assertion.
- [ ] **The judge is the mutation score, not the ritual.** Assertion quality applies: a matcher on
      every throw/reject, assert the whole object or sequence, triangulate bounds and operators, feed
      the absent case, collections ≥2 unsorted, a fixture never produced by the code it tests.
- [ ] Classic baby-steps + triangulation stay **available as a tool** for a genuinely unknown design;
      they are not the standing ritual. On S0bis the design is known (settled at v4.5.0), so batches.

## The slicing shape of the first run (S0bis) — delivery granularity, not TDD steps

This is where the real risk sits: a wrong judge, fanned out, is a wrong diff in thirty files.

- [ ] **The judge first, NOT delegated**: the shared `runAsEntrypoint` helper and its guard test,
      written in the orchestrating session under the discipline above.
- [ ] **One canary file** converted against that judge, verified end to end. If the judge is wrong it
      is wrong on **one** file.
- [ ] **Only then the fan-out**: one agent per remaining file, judged by the suite.
- [ ] **Debt 2 (`engine-fetch.mjs`'s `defaultGit`) is a separate slice**, mirroring the v4.5.0
      `buildCrosscheckInvocation` shape rather than inventing a second one.

## Reconnaissance for S0bis — established 2026-08-20, DO NOT re-derive

Scope approved by the owner the same day: **all of S0bis, Debt 2 included.**

- `isEntrypoint(metaUrl, argv1)` lives in `scripts/lib/entrypoint.mjs`. **No `runAsEntrypoint`-style
  wrapper exists** — confirmed absent, so it is genuinely new code.
- ~30 top-level `scripts/*.mjs` carry an entry guard in **two spellings**: ~16 via `isEntrypoint`,
  ~14 via an inline `resolve(process.argv[1]) === fileURLToPath(import.meta.url)` comparison.
- **A duplicate predicate exists**: `scripts/auto-commit.mjs` defines its own `isEntryPoint(argv1,
  metaUrl)` — different casing, **reversed argument order** — re-exported and reused by
  `auto-push.mjs`. Fold it into the shared helper.
- The three 0 %-scored files: `upstream-check-run.mjs` is guarded; `session-status.mjs` and
  `status-line.mjs` carry **no guard at all**, their whole body runs at import, which is exactly why
  no test can reach them.
- **Guard-test precedent to mirror**: `scripts/lib/assert-matcher-lint.test.mjs` — walks `SCAN_ROOTS`,
  asserts `deepEqual(offenders, [])`, allowlist as `const EXEMPT = new Set([SELF])`. Same shape, plus
  the **shrink-only** discipline the debt plan requires.
- **Debt 2's model to mirror**: `buildCrosscheckInvocation` in `scripts/verify-index.mjs` returns a
  pure `{command, args, options}` consumed by a thin `defaultRunCrosscheck`. Apply the same split to
  `defaultGit` in `scripts/lib/engine-fetch.mjs` (~line 100), and **delete its self-exempting
  comment** (*"Used by the core's CLI wiring, never by the unit tests"*).
- **Test command** (there is no root `package.json`):
  `node --test "scripts/*.test.mjs" "scripts/lib/*.test.mjs" "rag/*.test.mjs"`.
- **Mutation is NOT a per-slice judge.** `maintainers/mutation/mutate-changed.mjs` deliberately skips
  `scripts/**` and defers to a manual Stryker run in a disposable worktree
  (`stryker.scripts.batch.config.mjs`, `--mutate "<file>"`). So: **suite = per-slice judge, mutation =
  one batched gate at the end of the run.**

⚠️ **The counts above disagree with what this repo previously recorded** (28 of 32 guarded, nine
without a test sibling). Neither figure is trusted: **step 0 is a deterministic re-count written down
here**, which is what `v4.9.0-mutation-debt-plan.md` demanded anyway.

**The three tiers the fan-out follows** (produced by that inventory):
1. **Thin guards** (`process.exit(fn(argv))` and friends) — fully mechanical, one agent per file.
2. **Guards with inline argv parsing** — one agent per file; the parsing moves into a tested pure
   function first.
3. **Fat guards** (`session-universe.mjs` and kin, ~50 lines of I/O wiring inside the guard) — **never
   fanned out**, handled in the orchestrating session, because the body must be extracted before it
   can be passed as `fn`. **If a design choice is genuinely ambiguous, do not guess: write the question
   in the § Run log below, skip that slice, keep the others moving.**

⚠️ `session-status.mjs` and `status-line.mjs` run at **every session start**. A mistake there is felt
immediately, so they are handled in the orchestrating session, never fanned out, and their existing
behaviour is asserted **before** it is moved.

## Step 0 — the deterministic inventory (measured 2026-08-20, `chore/s0bis-entrypoint-mutation-debt`)

Counted by static text analysis over the 32 top-level `scripts/*.mjs`. **These numbers replace every
earlier estimate** (the plan's own "~30 files / ~16 + ~14" and the repo's "28 of 32 guarded").

| Guard spelling | Count | Files |
|---|---|---|
| `isEntrypoint(meta, argv1)` — the shared helper | **16** | ai-summary-guard, clear-example-notes, consolidate-scan, delete-universe, file-back-note, lint-vault, prompt-restart-nudge, refresh-note, rehydrate, rename-universe, set-active-universe, set-universe-profile, update-engine, upstream-check-run, vault-write-guard, verify-index |
| `isEntryPoint(argv1, meta)` — the **duplicate** predicate, reversed args | **2** | auto-commit (defines it), auto-push (imports it) |
| `isMain()` — a **third** local spelling, previously unrecorded | **1** | import-brain |
| inline `resolve(argv[1]) === fileURLToPath(import.meta.url)` | **7** | health-probe-run, session-actions-log, session-obsidian-hint, session-self-heal, session-universe, session-wiki-health |
| **no guard at all** — the whole body runs at import | **6** | open-env, pick-folder, run-eval, session-status, status-line, verify-rag |
| **Total** | **32** | 26 guarded, 6 unguarded |

- **Three spellings, not two.** `import-brain.mjs`'s `isMain()` is a third hand-rolled predicate the
  reconnaissance had not seen. It folds into the shared helper with the other two.
- **Nine files have NO `.test.mjs` sibling** — which confirms the repo's earlier figure, and it is the
  expensive half: import-brain, open-env, pick-folder, run-eval, session-status, status-line,
  update-engine, upstream-check-run, verify-rag.
- **Guard body size** splits cleanly into the three tiers: **16 files at 3 lines** (thin,
  `process.exit(fn(argv))`), **6 files at 9–35 lines** (inline argv parsing), **4 files at 52–64 lines
  or unguarded-and-session-critical** (fat).
- Baseline suite before any change: **1723 pass / 0 fail / 3 skipped**.

## The design, settled in session before any fan-out (2026-08-20)

**`runAsEntrypoint(metaUrl, argv, fn, { exit })`** in `scripts/lib/entrypoint.mjs`:

- returns `false` and does nothing when the module is not the entry point;
- otherwise calls `fn(argv.slice(2))` — so the per-script body becomes an **exported, importable
  function** and stops being 0 %-scored dead weight;
- **exits only on a numeric result** (`process.exit(code)`), injectable as `exit`. A non-numeric
  result exits nothing — that is what keeps `auto-commit.mjs`'s fall-through behaviour identical;
- **awaits a thenable result** before exiting, which is what `delete-universe` and `update-engine` need.

**The guard test** `scripts/lib/entrypoint-discipline.test.mjs` carries three checks over the
top-level `scripts/*.mjs`:

1. no `.test.mjs` sibling → red;
2. a **hand-rolled entry guard** (any of the three spellings, or an inline comparison) instead of
   `runAsEntrypoint` → red;
3. a module that **builds and executes a child process in the same call** → red. Mechanical rule: a
   child-process runner (`spawn`/`spawnSync`/`execFile`/`execFileSync`/`execSync`) called with an
   **inline array literal for `args` or an inline object literal for `options`**. That is exactly the
   Debt-2 shape (`defaultGit`), and exactly what `buildCrosscheckInvocation` passes by returning the
   request as a value.

**The shrink-only mechanic, made mechanical rather than written.** The allowlist is seeded with
today's offenders, and a second assertion states that **every exempt entry must still BE an
offender** — so an exemption that has been paid off turns the suite **red** until it is deleted. A
list that can only go stale is a list that shrinks by itself.

> **The anti-tautology protocol for the fan-out, decided in session 2026-08-20.** The contract forbids
> an agent writing both the test and the code it judges. A guard conversion is a **pure refactor**, so
> the rule becomes mechanically checkable and every dispatched prompt carries it as a hard gate:
> *the new test must be GREEN against the STILL-UNCONVERTED file*. A test that only passes after the
> refactor is a wrong test, not a caught bug — and the agent is told to fix its test, never the module.
> That inverts the tautology risk: the test cannot have been written by the implementation, because it
> had to pass before the implementation existed.
>
> **What each converted file gains**: a process-level test that **importing** the module fires nothing
> (safe for every CLI, and it is the only thing that proves the body is no longer top-level), plus —
> only where a genuinely harmless invocation exists (a usage error, no writes, no git, no network) — a
> test that running it as a process still exits as it did. Agents are told to skip the second rather
> than invent a side-effecting invocation.
>
> **Ceiling ownership**: agents never touch `entrypoint-discipline.test.mjs`. The orchestrating session
> lowers the ceilings between waves. That is what lets several agents convert several files at once
> without contending on a single shared file.

> **Granularity call taken in session, not a scope change** _(2026-08-20)_: the nine files with no
> test sibling are **seeded into the allowlist** rather than all fixed in this run. The debt plan asks
> for a guard test *"whose allowlist may only shrink"*, not for an empty allowlist on day one. This
> run shrinks it wherever the conversion makes the body importable; whatever survives is recorded
> here as remaining debt with its file names, so it cannot go quiet.

## 📓 Run log — the running trace (the owner reads THIS, not the thread)

Newest entry first. Each entry: what was done, what it proved, what comes next. Any blocking
arbitration goes here as a question, and the run continues on other slices.

- **2026-08-20 — two of the three 0 %-scored files are paid, and the duplicate predicate is gone.**
  Commits eb8b0fb and bc2a8bf. Suite **1796 pass / 0 fail**. Ceilings **15/10**.
  - `status-line.mjs`: every segment was a top-level `const`, so **importing it printed a status
    line**. Its "importing fires nothing" test was **red against the old file** — the only new test in
    this run that was, and the proof the defect was real rather than theoretical. The line itself is
    unchanged, asserted by running the real CLI against this repo before and after.
  - `auto-commit.mjs` / `auto-push.mjs`: the second predicate (`isEntryPoint`, reversed arguments,
    re-exported) is deleted, its four tests with it. **Kept in session, not fanned out**: two coupled
    files, and one of them is the hook that fires on every edit.
  - The scanner learned a rule while doing it: a predicate named only in a **comment** is not a
    hand-rolled guard. Without that, a file cannot explain the debt it used to carry without being
    counted as still carrying it, and the ceiling could never reach zero.
  - ⚠️ **A deliberate exception to fail-first, recorded rather than hidden**: `session-status.mjs`
    cannot have its "importing fires nothing" test seen red first. Seeing it red means **importing the
    module**, and this module is a SessionStart hook that sweeps the working tree and auto-commits it.
    Its pure extractions get the normal treatment; that one test is written after the guard exists.
- **2026-08-20 — tier 1 is done: 12 CLIs converted by 12 agents, plus `upstream-check-run` in
  session.** Commits 62246c6 and bb21a36. Suite **1786 pass / 0 fail** (baseline was 1723). Ceilings
  32/26 → **18/12**, and the sibling allowlist lost its first entry.
  - **The fan-out's real risk was the arguments, not the tail.** Four of the twelve needed an arrow
    rather than a direct pass: two whose body takes `deps` first (a direct pass would have handed it
    the argument array), and two whose deps are **required and built at invocation time** (hoisting
    that call out of the arrow would have reinstated the very import-time side effect being removed).
    All four came back right, and each was flagged in its own prompt — the prompts were **not** a
    single template, they named the specific trap per file.
  - `upstream-check-run.mjs` was kept in session because it needed a **new test sibling**, i.e. new
    test authorship rather than a refactor. Its extraction immediately caught a real defect: a
    trailing `--brainDir` with no value resolved to `undefined`, which would have written the verdict
    cache to a garbage path.
  - ⚠️ **Orchestration lesson, learned by making the mistake**: `git add -A` while agents are in
    flight swept three files of half-finished agent work into a docs commit (b4bd7a4). It happened to
    be green — verified after the fact in a throwaway worktree — but only by luck. **While a wave is
    running, stage explicit paths, never `-A`.** This belongs in the mode debrief.
  - **Next: the two remaining 0 %-scored files** (`status-line.mjs`, `session-status.mjs`, both
    session-critical, both kept in session), then the duplicate `isEntryPoint` predicate shared by
    `auto-commit.mjs` / `auto-push.mjs`, then the batched mutation gate.
- **2026-08-20 — steps 1, 2 and 4 landed; the fan-out has started.** Three commits, branch pushed:
  - `runAsEntrypoint` + 9 unit tests (5b17338). Its exit contract is deliberately narrow so the
    fall-through bodies keep behaving exactly as they do.
  - The repo-wide guard + **Debt 2 paid** (a3faa2a). Turning the guard on named exactly one file the
    allowlist deliberately does not carry — `engine-fetch.mjs`'s `defaultGit` — so step 4 came forward
    to keep the commit green. Its request is now a value mirroring `buildCrosscheckInvocation`, and the
    comment that documented its own exemption is deleted.
  - The **canary** (480dcd7): `lint-vault.mjs` converted end to end, its behaviour asserted by running
    the CLI as a process **before** it moved, and that net then **checked for being discriminating** —
    pointed at a tail that can never fire, it goes red. Ceilings 32/26 → 31/25.
  - Suite: **1760 pass / 0 fail** (from 1723 at baseline).
  - **Next: wave 1 of the fan-out** (clear-example-notes, consolidate-scan, vault-write-guard), then
    the rest of tier 1.
- **2026-08-20 — step 0 done, on branch `chore/s0bis-entrypoint-mutation-debt`.** The inventory is
  measured and written above; it corrects three earlier figures (32 files not ~30, **26** guarded not
  28, and a **third** guard spelling nobody had recorded — `import-brain.mjs`'s `isMain()`). The
  design of `runAsEntrypoint` and of the guard test is settled in session, as the contract requires,
  before anything is fanned out. Baseline suite: 1723 pass / 0 fail. **Next: step 1, the judge.**
- **2026-08-20 — mode framed, contract approved, run not yet started.** The three parameters are
  approved (above), the scope is all of S0bis including Debt 2, the reconnaissance is recorded, and
  the test discipline was re-confirmed as **design-first / test-first in batches**, not TDD
  baby-steps. **Next: step 0, the deterministic inventory**, then the judge, then the canary.

## Tracking

- [x] **Frame the mode with the owner** — the three questions on
      `llm-wiki-vs-embedding-rag-karpathy-graphify.md` answered, the subject relocated here
      _(2026-08-19)_.
- [x] **Lift the diversion** in `ROADMAP.md` and unpause
      `update-regime-owns-what-it-shipped-action.md` _(2026-08-19)_.
- [x] **Write the delegability map, the deterministic-check rule and the stop points** — this file
      _(2026-08-19)_.
- [x] **Get the three arbitrations answered** _(2026-08-20)_ — approved as proposed; scope set to all
      of S0bis, Debt 2 included; test discipline re-confirmed as batches, not baby-steps.
- [ ] **Run the mode on S0bis** — the release's first unticked box, and the best-judged cargo we have.
  - [x] **Step 0 — deterministic inventory**: per top-level `scripts/*.mjs`, guard present and which
        spelling, test sibling present, guard body line count. **Written above** _(2026-08-20 ·
        branch `chore/s0bis-entrypoint-mutation-debt`)_.
  - [x] **Step 1 — the judge, not delegated**: the guard test and `runAsEntrypoint(meta, argv, fn)` in
        `scripts/lib/entrypoint.mjs`, under the discipline above. Allowlist may only SHRINK
        _(2026-08-20 · 5b17338 + a3faa2a)_.
  - [x] **Step 2 — one canary file**, a thin guard, converted end to end and verified
        _(2026-08-20 · 480dcd7 — `lint-vault.mjs`, and the net proved discriminating)_.
  - [~] **Step 3 — fan out by tier** (1 and 2 delegated, 3 kept in session).
    - [x] **Tier 1 — thin guards**: 12 files, one agent each _(2026-08-20 · 62246c6)_.
    - [x] `upstream-check-run.mjs` — kept in session (new test sibling = new test authorship)
          _(2026-08-20 · bb21a36)_.
    - [ ] **Tier 3 — the two remaining 0 %-scored files**: `status-line.mjs`, `session-status.mjs`.
          Never fanned out: they run at EVERY session start.
    - [ ] The duplicate predicate: fold `auto-commit.mjs`'s `isEntryPoint` (reversed arguments,
          re-exported to `auto-push.mjs`) into the shared tail. Kept in session — the two files are
          coupled, and `auto-commit` runs on every single edit.
    - [ ] Remaining inline guards (`session-*.mjs`, `health-probe-run.mjs`, `set-active-universe.mjs`,
          `import-brain.mjs`, `update-engine.mjs`) — fat bodies, recorded as remaining debt if the run
          ends before them.
  - [x] **Step 4 — Debt 2**: `defaultGit` split into a pure invocation builder plus a thin runner,
        asserted whole, self-exempting comment deleted _(2026-08-20 · a3faa2a — brought forward, since
        the new guard went red on it the moment it was switched on)_. No `win32` case to feed: git is a
        real executable on Windows too, so the invocation is byte-identical everywhere — that absence
        is asserted as the design, in a comment, rather than faked with a vacuous test.
  - [ ] **Step 5 — the batched mutation gate** in a disposable worktree over the touched files; numbers
        into `maintainers/mutation/RESULTS.md`, plus the line in its § v4.8.0 naming the release that
        paid each debt.
  - [ ] Tick the matching boxes in `v4.9.0-mutation-debt-plan.md` and the S0bis box in
        `update-regime-owns-what-it-shipped-action.md`.
  - [ ] Push the branch and open a **draft** PR. Nothing merged, nothing tagged.
- [ ] **Debrief the mode after S0bis**, before applying it to S1–S5: what the fan-out actually cost,
      what it caught, what it broke. If it does not pay, say so here and go back to a single session.
- [ ] **When the release ships**: fold the surviving lessons into `maintainers/CONVENTIONS.md` (or
      kill this file), and rewrite the memory pointer to whatever becomes live next.

---

> **Sibling reading**: `maintainers/CONVENTIONS.md` (checkboxes on every step, one canonical plan =
> the repo's, green-only commits), and the standing test-first discipline. Nothing here overrides
> either — orchestration is a delivery mode, not a licence.
