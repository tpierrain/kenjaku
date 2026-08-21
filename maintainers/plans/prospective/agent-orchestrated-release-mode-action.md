<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- STATUS: 🟢 IN FORCE since 2026-08-20 — the working CONTRACT for building    -->
<!-- the unfreeze release with subagents. The three arbitrations are APPROVED,   -->
<!-- S0bis ran under it, and the mode was DEBRIEFED the same day: kept for       -->
<!-- S1–S5, MECHANICAL ONLY. Read § Tracking's debrief box before delegating.    -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Working contract — building the unfreeze release with orchestrated subagents

> ## ⏳ WHERE THIS RESUMES — read before the Tracking
>
> **S0BIS IS COMPLETE** _(2026-08-20)_ — `session-status.mjs`, its last blocking arbitration, was
> answered "yes, now" by the owner and paid. Everything is on
> `chore/s0bis-entrypoint-mutation-debt`, pushed, under draft
> [PR #75](https://github.com/tpierrain/kenjaku/pull/75) — **nothing merged, nothing tagged**.
> _(Who owns what, so no copy has to be trusted: the **release's state** is
> [`update-regime-owns-what-it-shipped-action.md`](update-regime-owns-what-it-shipped-action.md);
> every **measured number** is
> [`RESULTS.md` § S0bis](../../mutation/RESULTS.md#s0bis--the-two-structural-debts-paid-scripts-only--2026-08-20);
> this file owns only the **working mode** and the run log below.)_
>
> ## ▶️ RESUME HERE — the next slices, in order
>
> 1. ~~**The stale-plan net**~~ — **DONE 2026-08-20**, all three builds (owner's call: *"les deux, le
>    hook d'abord"*). The hook `~/.claude/hooks/plan-carrier-guard.mjs` is written, tested (29 + 8
>    cases) and wired; the rule speaks of **carriers, plural** at its source in
>    `use-case-driven-harness` (`abecb38`); the corpus is deduplicated behind a written ownership split
>    (`maintainers/README.md`). **Do not re-open it. Two tails are the owner's, not work to pick up**:
>    propagating the rule to the **public extract / published page** (outward-facing), and the unmerged
>    doctrine branch `chore/plan-discipline-points-at-the-harness` (no PR). ⚠️ The hook loads at
>    **session start**, so it never watched the session that wrote it.
> 2. ~~**The `mutation-testing` pair**~~ — **DONE 2026-08-20** (`59a4ec4` the script, `9126179` the
>    skill, `0f43037` the hardening). Both halves shipped: `mutate-one.mjs` (the braces) and
>    `maintainers/skills/mutation-testing/SKILL.md` (the belt), plus a config that measures the runner
>    itself — **80.95 % → 99.11 %**, 3 named equivalents left. Numbers in
>    [`RESULTS.md` § The day-of runner](../../mutation/RESULTS.md#the-day-of-runner-and-its-first-two-runs--2026-08-20).
>    **Do not re-open.** One tail is recorded there, not here: `scripts/lint-vault.mjs` measured
>    **70.00 %** on the tool's first real use, its 3 survivors all in its composition root — remaining
>    entry-tier debt, held by the S0bis ceilings.
> 3. ~~**Deduplicate the plan corpus**~~ — done with slice 1 above, same day.
> 4. ▶️ **The release is being built under the mechanical-only verdict.** Its state, its slice queue and
>    its resume marker live in
>    [`update-regime-owns-what-it-shipped-action.md`](update-regime-owns-what-it-shipped-action.md) —
>    **open it and start where ITS header says**; this list deliberately restates none of that (a second
>    copy of a status is a future lie). What belongs to the **mode** is this: the release is what has to
>    produce the **contrast** the deferred adversarial-review question needs (one slice reviewed
>    adversarially, one not), and it is **still unproduced** — ⚠️ **twelve iterations in, the
>    mechanical-only verdict has cost the mode its own subject.** Slice after slice has been design +
>    test-first + a measured refactor, i.e. exactly the class the verdict keeps in session, so nothing has
>    ever been dispatched to debrief. **This is now a finding, not a delay**: if a whole release can be
>    built without one dispatchable slice, the honest conclusion may be that the contrast cannot be
>    produced by waiting for one, and the question has to be re-framed (e.g. dispatch the adversarial
>    REVIEW of a slice built in session, which the verdict does allow).
>
> ## 🌙 THE OVERNIGHT LOOP — framed by the owner 2026-08-20, before a `/clear`
>
> He asked to let the session work through the night *"en pleine autonomie"*, and asked the right
> question with it: how to keep it from rotting its context. **Three answers, all his, do not re-ask:**
>
> - **Scope: as far as the quota takes it.** S1's last slice, then S2, then S3/S4 if it keeps moving.
>   Any decision that is his becomes a **blocking box at the top of the owning plan**, and the loop moves
>   to the next slice that does not need him — it never guesses in his place.
> - **Branch: `feat/engine-base-unfreeze`**, cut from `chore/s0bis-entrypoint-mutation-debt` at `a730d20`
>   and pushed. The old name stopped describing what it carried, and draft PR #75 must keep its S0bis
>   perimeter rather than swallow the release.
> - **Mechanism: `/loop` with no interval** (self-paced), with the prompt below.
>
> 🛑 **The loop CANNOT refresh its own window, and a rule that assumes otherwise is a lie**
> _(owner caught this on the night's first iteration, 2026-08-20)_. The session had written that it
> would "start S2 on a fresh window": there is **no mechanism for that**. A session can neither `/clear`
> itself, nor trigger a compaction, nor refuse one — auto-compaction fires on its own, at its own
> threshold. The only levers that actually exist:
>
> - **STOPPING the loop is in the session's hands, cleaning is not.** So the honest form of "this slice
>   deserves a fresh window" is: **stop the loop**, leave the plan pointing at the next step, and let the
>   owner restart. Riding on and hoping is the failure mode; asking for a clear the session cannot
>   perform is the *pretending* version of it.
> - **Write the DESIGN into the plan before writing the code.** What survives a compaction is a file,
>   never the reasoning held in the window. A design slice whose design is already committed costs, at
>   worst, the tranche in flight. This is the one preparation that makes a compaction cheap instead of
>   expensive, and it is now the standing rule for every design-bearing slice (S2 first).
>
> **Why this shape beats one long session, stated honestly.** `/loop` does **not** clear the window
> between iterations, and nothing does. What it buys is that **every iteration can be restarted from the
> plan alone** — so a compaction, a crash or a `/clear` costs at most the slice in flight, never the
> chantier. The window is protected by the two standing rules of this file, not by care: **delegate the
> READING to subagents** (a bulk read never touches the main window), and **nothing is dispatched
> without a pass/fail a machine can evaluate**.
>
> **The prompt to paste** (it is written here so it survives the `/clear` that follows it):
>
> ```
> Open maintainers/plans/prospective/update-regime-owns-what-it-shipped-action.md and read its
> header (WHERE THIS RESUMES / RESUME AT). Do the ONE slice it names, and only that one.
>
> A DESIGN slice has no tests and no mutation score: it is finished when the design is WRITTEN
> INTO THE PLAN and committed -- the shape, the cases it must answer, what is deliberately out.
> Do not start coding it in the same iteration.
>
> A CODE slice is test-first: see the tests fail on their assertions before any production code.
> Then the full suite green (node --test "scripts/*.test.mjs" "scripts/lib/*.test.mjs"), then
> COMMIT, then measure mutation on HEAD (node maintainers/mutation/mutate-one.mjs <file>) and
> kill the survivors. Never commit red.
>
> Either way: tick the carriers -- the owning plan, RESULTS.md for any number, this mode plan if
> the mode learned something -- commit and push on feat/engine-base-unfreeze. If the slice needs
> a decision that is Thomas's, write it as a blocking box at the top of the plan and move to the
> next slice that does not need him. Bulk reads go to a subagent, and so does the IMPLEMENTATION
> of a mechanical slice once its tests exist -- that is what makes the night last, since the
> window never empties between iterations. Then stop, so the loop can restart you from the plan.
> ```
>
> ⚠️ **What one `/clear` actually buys, measured on the night of 2026-08-20.** One fresh window, not a
> whole night: `/loop` never empties it, so the same ceiling returns. The lever that makes the night
> last is **not** the clear, it is **how much of each slice is spent in this window**. S1's fs
> orchestrator cost ~20k of window for one slice because design + tests + implementation all stayed in
> session. The mechanical-only verdict allows the third of those to leave: **once the design is in the
> plan and the tests are written and red, the implementation is dispatchable**, and that is the
> difference between one more slice and several.

> **Decided, do not re-ask**: the subagent mode is kept but **mechanical only**; the
> adversarial-review question is deferred to the **S1 debrief**, on S1's figures. **And the release's
> version number was settled and signed on 2026-08-20** — the release plan states it and owns the
> argument; this file deliberately keeps no copy. Do not re-open that question either.

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

- 🌙 **2026-08-21 (night, loop iteration 14) — S3-0 (the field check) and S3-1 (the pure verdict).**
  Commits `177c572`, `4bf5efa`, `b82569e`. Pushed, suite **1994 pass / 0 fail**, the new module
  **90 % → 98.89 %** with its single survivor a named equivalent.
  - 🔍 **The contract check answered a question nobody asked it.** S3-0 only had to prove the harness
    honours `permissionDecision: "ask"` — read out of the shipped client's own binary rather than
    recalled. The same read also produced `case "ask": if (B !== "deny" && B !== "defer") B = "ask"`,
    i.e. **most-restrictive-wins**, which settles the design's parked question about two hooks in one
    matcher, and the `default:` branch that **throws** on any other value, which turns the emitted set
    into a test.
    ➡️ **For the mode**: reading the artefact beats asking the model, and it pays interest — a
    recollection answers exactly the question asked, a source answers the neighbouring ones too.
  - 🖋️ **The mutation run judged the PROSE, and it was right.** Six of nine first-pass survivors emptied
    one clause each out of the guard's four sentences while every `assert.match` stayed green. The
    tests sampled a phrase; the mutants deleted what was between the samples.
    ➡️ **For the mode**: when the prose IS the deliverable (a report line, a permission reason, an
    error message), pin it **whole**. `assert.match` is for a fact inside a string, never for a string
    that is itself the product. A wording change should cost a deliberate test edit.
  - 🕳️ **A DEFAULT PARAMETER IN A TEST HELPER SUBSTITUTES THE VALUE UNDER TEST, IN SILENCE.**
    `decide = (rel, manifest = MANIFEST)`, looped over `[null, undefined, {}, …]` to prove the guard
    fails open when it cannot read the manifest: the `undefined` pass re-injected the **real** manifest
    and asserted the opposite of the test's own title. Caught only because the production behaviour
    happened to differ; had it agreed, it would have shipped green and vacuous.
    ➡️ **For the mode**: this is the **third variant** on this branch of *the test passed because it
    never asked the question* (after the absent optional-chained fixture field, and the fixture holding
    one provenance base out of four). The family is now nameable: **anything that can supply a value in
    the test's place — a default parameter, optional chaining, a partial fixture — can also supply it
    for the case you meant to isolate.**
- 🌙 **2026-08-21 (night, loop iteration 13) — S3 is DESIGNED (no code, no number).** A design slice, so
  `RESULTS.md` gets nothing: there is no mutation score for a paragraph, and the loop's own rule says a
  design slice ends when the design is committed. Three findings, and **not one of them is the kind a
  green test reports**.
  - 🪤 **The wiring would have been a silent no-op, and only reading the reconciler said so.** The
    reflex is to add the new `PreToolUse` hook beside `vault-write-guard` in the same matcher group.
    `reconcileHooks` identifies a template group by its **first** script and skips the group when that
    script is already wired — so the second hook would have reached **zero** deployed brains. Nothing
    throws, nothing is reported, the feature simply does not exist on the fleet.
    ➡️ **For the mode**: before adding an entry to a config the engine RECONCILES, read the reconciler's
    identity function. "Is it in the template?" is not the question; "what does the delivery code use as
    the key?" is.
  - 🎯 **Reusing an existing classification for a new question gave the WRONG answer.** "Engine-owned ⇒
    ask" reads the manifest's regimes and lands on `CLAUDE.md` and `.claude/settings.json`, both
    `merge` — i.e. the guard would interrupt the owner on the two files it exists to redirect them
    **to**. The regime says *how the engine updates a file*; the guard needed *who the file was written
    for*. Two axes that agree almost everywhere, and the exceptions are the whole product.
    ➡️ **For the mode**: an existing taxonomy is the cheapest thing to reach for and the easiest place
    to be wrong. Name the question the taxonomy actually answers before borrowing it.
  - 🔍 **The slice opens on a check no test can perform.** Its whole UX rests on the harness honouring
    `permissionDecision: "ask"` and showing the reason to the **human** — a contract with the tool that
    runs us, unprovable from inside a unit test. It is scheduled as **S3-0, first and cheap**, ahead of
    any code.
    ➡️ **For the mode**: when a design depends on someone else's contract, the fail-first rule has a
    sibling — **verify the contract before writing the test that assumes it**, or the whole slice is
    green against a fiction.
- 🌙 **2026-08-21 (night, loop iteration 12) — S2b-4, and with it S2b: the named debt paid by DELETING
  the line it was routed to test.** Commits `1d1bc3c` (the deletion + the `argv` default + `unknown()`
  extracted) and `ca41b10` (the mutation instrument). Pushed, suite **1970 pass / 0 fail**,
  `update-engine.mjs` **98.34 % → 98.65 %** with **all four remaining survivors named equivalents**.
  - 🧨 **A SURVIVING MUTANT IS NOT EVIDENCE OF AN UNCOVERED LINE.** This plan and `RESULTS.md` had both
    written "three lines that never run under test" from three `readFileSync(…, "utf8") → ""`
    survivors. False: `""` is falsy, so Node's `assertEncoding` accepts it and hands back a **Buffer**,
    which `JSON.parse` and `createHash` consume identically. A survivor says *no test can see this
    mutation*, and that is satisfied by "nothing runs it" **and** by "everything runs it and nothing
    depends on it".
    ➡️ **For the mode**: the two are separated by one command — put a `throw` on the line and count the
    red tests. Here: **18**. Do that BEFORE writing the word "uncovered" into a carrier.
  - 🗄️ **The corpus already knew, and a newer section re-derived the wrong answer anyway.**
    `RESULTS.md` records this exact equivalence in **four** earlier places, the oldest weeks old. The
    register grew past the point where writing something down means it will be read.
    ➡️ **For the mode**: before diagnosing a survivor, `grep` the register for its SHAPE
    (`readFileSync(.*"")`), not for the file it is in. A register that is only ever appended to is a
    diary, not a memory.
  - 🗑️ **The fix for a line whose effect no test can see is sometimes to prove nothing should see it.**
    Both consumers of `deliveredFileMap` filter their candidates through the `merge` regime, so a
    `replace`-copied file's bytes reached neither — and `runReconcileCli`, the last writer on the update
    path, never did the readback at all. The mutant that actually proved it was the neighbour
    (`copied.map(rel => [])`), not the encoding one. **The line was true work until S2b-3 moved the four
    scripts out of `copied`**: the slice that made it dead is the slice that was scheduled to test it.
  - ⏱️ **A precondition read before the step that invalidates it is not a precondition.** Three mutation
    runs aborted with "check the `rag/node_modules` symlink". `planRun` asked whether the link existed
    **at plan-build time**, then emitted a `git clean` that removes it (the `-e` guard does not cover a
    symlink), then skipped the link step it had decided it did not need. It **alternated**: the run that
    found no link made one and passed, leaving one for the next run to skip and fail on.
    ➡️ **For the mode**: an intermittent failure that alternates cleanly is a state machine, not flake.
    Fixed by making the link step unconditional and ordering it AFTER the clean — a plan that describes
    an end state does not get to consult the start state.
- 🌙 **2026-08-21 (night, loop iteration 11) — S2b-3: the four engine scripts leave the copy bucket.**
  Commit `8b90fc8` (the switch, deliberately indivisible), then `d7a6fd6`, `bc6a9f5`, `59c2275`,
  `739b7e0` paying what its mutation runs found. Pushed, suite **1968 pass / 0 fail**. New module
  **100 %** (16), the carrier **still 100 %** (106) on its second client, `update-engine.mjs`
  **96.69 % → 98.34 %**, and the never-measured write-allowlist **78 % → 92 %**.
  - 🔍 **A slice's real find was in a file it only grazed.** `engine-apply-plan.mjs` is the pure
    function standing between a fetched manifest and an owner's files, and **it had never been
    mutation-measured** — 78 %, with three reachable safety holes (a staged skill's helper code reading
    as an engine script, the engine's own `.new` sidecar doing the same, and
    `vault/.claude/skills/smuggled/**` reading as an installable skill because `installSkills` is the
    one bucket the scrub does not filter).
    ➡️ **For the mode**: when a slice changes what a file MEANS, measure it even if the diff is a
    rename. The rename was three lines; the audit it triggered was the slice's most valuable hour.
  - 🎯 **The same blind spot, twice in one slice, in two different files**: both anchors of an
    identical regex survived in the new module and in the allowlist. **A test that only ever feeds
    paths failing in the MIDDLE of a pattern never pays for its ends** — and both ends turned out to
    guard something real.
  - 🕳️ **A fixture key left OUT makes its test vacuous, and the test still passes.** `needsRestart` is
    an OR over six lists; its don't-cry-wolf fixture named three. A missing key reads
    `undefined?.length > 0` — false *whatever the comparison says* — so `length >= 0` sailed past three
    disjuncts, one older than this branch. Optional chaining turns an absent fixture field into a
    silently unjudged branch.
  - 📉 **The regression this slice nearly shipped was a NUMBER, not a behaviour.** The four scripts left
    `copied`, so a brain nobody customized would have read *"4 fewer engine file(s) swapped"* while
    exactly as many files changed. Nothing broke; the report would simply have started under-counting.
    ➡️ **For the mode**: when work moves out of a bucket, ask what COUNTED that bucket.
  - 🧬 **A near-copy of a predicate had already drifted before this slice touched it.** The restart
    banner asked `copied || regenerated || skillsRefreshed`, a hand-written echo of `needsRestart` that
    had silently fallen behind it (a merged skill armed the nudge and printed no banner). It now asks
    `needsRestart` itself. **Two questions with one meaning is one of them going stale** — and the
    drift is invisible until something moves.
  - 🧾 **The false fact from iteration 10 was still alive in three fixtures.** `update-engine.mjs` under
    `merge` — corrected in the plan, the comment and one test title last night, and still sitting in
    `reconcile-brain.test.mjs`, `restart-convergence.test.mjs` and `update-engine.test.mjs`.
    ➡️ **For the mode**: correcting a claim means grepping for its EVIDENCE, not just its wording. A
    fixture is the quietest place a wrong belief hides, because it is never read as an assertion.
  - 🧪 **A fixture that was harmless became a lie the moment the behaviour changed**: one provenance
    base recorded out of four engine scripts. Fine while they were copied blind; since the switch it
    would have asserted a fast-forward the merge is right to refuse. **Verified against the real fleet
    shape before editing it** (the scripts were in `copied`, so they were re-seeded at every update) —
    a fixture is changed by proving what the field holds, never by making the test go green.
- 🌙 **2026-08-21 (night, loop iteration 10) — S2b-2: a merge that would not parse is never written.**
  Commit `6ba4348`, pushed, suite **1945 pass / 0 fail**, **100 % on both files, first pass, no
  survivor** (the carrier went 86 → 106 mutants for four lines of gate, all killed).
  - 📚 **A lesson written down is a lesson that names the inputs for you next time.** This module is
    impure — it spawns — and it scored 100 % on its first pass, where the two earlier impure ones
    landed near 75 %. Nothing about it is easier: **S2a-2's lesson had already been paid**, so the
    failure shapes went into the batch from the start (a runner that cannot spawn, a null status met
    *alone* so it cannot hide behind the `error` guard, a status outside `{0, 1}`). The refined rule
    from iteration 9 predicted this, and it held.
  - 🧭 **A slice can inherit a risk from what its files ARE, not from what it does to them.** S2a merged
    documents; S2b merges files the brain **executes**. Nothing in the merge changed — the danger came
    from the destination. Worth asking of every slice that reuses a mechanism on a new kind of file.
  - 📐 **The subprocess contract was measured before it was relied on**, the same way `git merge-file`
    was at S2a-2: `0` parses, `1` does not, `9` means node itself is unhappy. That last one is why
    *"non-zero means broken"* would have been a bug — read as a verdict it condemns a good file for
    ever. **A binary-looking exit code is rarely binary**, and the cost of checking was one shell loop.
  - 🗣️ **Two failure reasons that could have been one, kept apart.** `merge-unsafe` (the merged bytes
    would not parse) and `merge-failed` (the tool could not answer) are the same *outcome* and
    different *news*. Merging them would have the engine accuse the owner of breaking something it has
    no evidence they broke. Third time this chantier has made that call, and it keeps paying.
  - 🔇 **A verdict with no sentence is a defect, so the sentence shipped in the same slice** — and the
    part of it that is still wrong (it says *"skill"* about a script) is **pinned as an expectation**
    rather than left as a note. A known lie that fails a test is a deadline; a known lie in a comment
    is a wish.
  - 🪤 **The same too-loose test filter as two iterations ago**: `startsWith("   • ")` also matches the
    report's furniture. The sibling test already had the right predicate.
    ➡️ **For the mode**: when a new test asserts on the same output as an existing one, **copy its
    filter** rather than writing a fresh one. A filter is a claim about the subject, and rewriting it
    re-opens a question already answered.
- 🌙 **2026-08-21 (night, loop iteration 9) — S2b-1: the merge's journey to the disk stops belonging
  to the skills.** Commits `3395e1a` + `211cfc5`, pushed, suite **1927 pass / 0 fail**, **100 % on both
  files, first pass, no survivor**.
  - 📏 **A refactor can be AUDITED by its mutant count, and that is worth keeping.** 113 mutants before
    the extraction, **86 + 28 = 114** after, across the two files. Moved code conserves its mutants;
    copied code inflates the total and lost code shrinks it. One number, and it answers *"is this
    really a refactor?"* without reading a diff or trusting a commit message.
    ➡️ **For the mode**: when a slice claims *"no behaviour change"*, that claim is measurable. Measure it.
  - 🔇 **A rename does not break a predicate, it silences one.** `skill` → `name` turned a
    `.filter((p) => p.skill === "switch")` into a filter that matches nothing — and its assertion
    expected `[]`, so it would have gone on passing for ever. The **failing** siblings are what led to
    it; a rename sweep that only chases red misses exactly the assertions that went quiet.
  - 🛑 **THE FINDING OF THE NIGHT, and it is about the judge itself: a flaky test does not add noise to
    a mutation score, it adds POINTS.** The runner is Stryker's **`command`** runner — a mutant is
    killed when the suite **exits non-zero** — so a test that fails at random is indistinguishable from
    a mutant being detected, and the error only ever goes **upward**.
    - **Measured, not inferred**: with the old sweep, **6 of 8** concurrent full-suite runs failed; with
      the fix, **0 of 8**. The blocked measurement was only the visible half — the same test had been
      *inflating* every score measured since it was written (`de19cd9`, 2026-08-20).
    - **What it cost**: `update-engine.mjs` re-measured **98.95 % → 97.54 %**. The four extra survivors
      are not a regression, they are holes the noise had been masking — three more `readFileSync`
      encoding mutants, i.e. **three more lines the suite walks past**, now joined to S2b-4's debt.
    - **Four files re-measured, two figures were wrong and two were not**: `update-engine.mjs`
      98.95 → **97.54 %**, `engine-merge-git.mjs` 100 → **98.18 %** (the module that carried the flaky
      test is the one its own noise flattered into an unearned perfect mark), while
      `engine-merge-apply.mjs` and `engine-skill-refresh.mjs` both came back **unchanged at 100 %**.
      Naming which numbers survived the correction is the point; a blanket "everything is suspect"
      would be as useless as the inflation.
    ➡️ **For the mode**: a test that depends on what else is running fails first under the tool that runs
    the most things at once, and this repo's earliest detector of that is the mutation runner. **Treat a
    suite that is not deterministic under load as a broken instrument** and re-measure what it judged,
    rather than filing the flake as tooling noise. Every affected section of `RESULTS.md` now carries
    the mark, including the ones not worth re-running.
  - ✍️ **One test in the new batch could not be red first**, and it is written down as such rather than
    dressed up: *"self-heal writes nothing"* is a contract a skeleton satisfies by doing nothing. What
    judges it is the mutation run, and that is said in `RESULTS.md` where the number lives.
- 🌙 **2026-08-21 (night, loop iteration 8) — S2b is DESIGNED, and the design found the plan lying.**
  A **design slice**: no test, no mutation score, and it is finished because the design is written into
  the owning plan and committed (§ S2b there). Cut into four sub-slices; S2b-1 is next.
  - 🛑 **The plan had warned, in four places, about a danger that does not exist.** *"`update-engine.mjs`
    matches the same `ENGINE_SCRIPT` regex and must keep replacing itself"* — it matches, but the regex
    is applied to `regimes.merge`, and a sweep of **all 48 revisions of `engine-manifest.json` found
    zero** that declare it there. The bucket S2b empties has always held exactly the four scripts, so
    there is **no split to make**, only a rename and a removal.
    ➡️ **For the mode**: the warning had been copied from a **code comment** (`engine-apply-plan.mjs:7`)
    into a plan, into a test title, into a fixture note. **A comment is not a measurement**, and copying
    one four times does not make it one. Cost to check: a two-line `git show` loop over 48 revisions.
  - 🛡️ **A slice can inherit a risk its predecessor did not carry.** S2a merged **skills**; S2b merges
    files the brain **executes** at every session (this plan already singles `status-line.mjs` out for
    that reason, § Step 0's warning). A clean line-based merge can produce bytes that parse to nothing —
    bytes that **exist nowhere but that one machine**. Hence a syntax gate on the merge output only, and
    a degradation to `preserve` when it fails. Measured, not assumed: `node --check --input-type=module -`
    reads stdin and exits 1 on conflict markers, on a truncated function, on a duplicate `export const`.
  - 🔗 **The sub-slice cut is driven by what must never exist in a commit**, not by size: S2b-3 wires
    the bucket and the refresh **in one commit**, because splitting them would leave a commit in which
    the four scripts are delivered by nobody.
- 🌙 **2026-08-21 (night, loop iteration 7) — S2a is COMPLETE: the merge works and says so.** Commit
  `ecd8d6c`, pushed, suite **1918 pass / 0 fail**, `update-engine.mjs` at **98.95 %** with 3 survivors,
  **none of them in this slice's code**.
  - 🧭 **Measuring a whole FILE, not a diff, is what made that sentence sayable.** The run judged 285
    mutants; the new report block killed every one of its own, and the three survivors are pre-existing.
    Two are equivalent mutants (named as such rather than fake-killed — contorting a test to pin an
    unobservable is how a suite starts lying); **one is a real gap in this chantier's own subject** and
    was **routed to S2b**, which reworks that exact path. *Kill the survivors* does not mean *kill them
    here*: it means none stays anonymous.
  - 🪞 **A test whose name had stopped being true.** *"prints every optional line, in order, byte for
    byte"* did not know the two lines this slice added. A test name that lies is a defect, not a
    cosmetic — it is the assertion the next author will trust instead of reading.
- 🌙 **2026-08-20 (night, loop iteration 6) — S2a-3: "preserve" stops meaning "abandon".** Commits
  `d7867fd` + `2ec18a5` + `5dc470b`, pushed, suite **1914 pass / 0 fail**, mutation **98 % → 100 %**
  (numbers in `RESULTS.md`). The merge reaches a real brain: an owner's edit and the engine's update
  both land, through real git, on real files. **This is the sentence the whole release was written to
  be able to say.**
  - 🔎 **A survivor named the failure an owner could not have recovered from.** The per-skill dedup was,
    as far as the tests could tell, keyed on *"have I said anything yet"* rather than *"have I said
    THIS"*. Mutated that way it **silences every conflict after the first** — they resolve one file and
    never learn the rest exist. The rule had been asserted since increment 2.5 on **one** list, and this
    slice added two more that could each lose it alone.
    ➡️ **For the mode**: when a slice adds a list beside an existing one, the existing one's invariants
    do not travel. Re-ask them of the newcomer, or the mutation run will.
  - ⏱️ **A contract with no observable output still has one.** "A merge that changes nothing must not
    rewrite the file" cannot be seen in the bytes, so the assertion moved to the **mtime**. Worth
    keeping as a reflex: *no-op* contracts are not untestable, they are testable somewhere other than
    the content.
- 🌙 **2026-08-20 (night, loop iteration 5) — the wiring caught the DESIGN wrong, before it shipped.**
  Commit `8d4da37`, pushed, suite **1915 pass / 0 fail**, mutation still **100 %** (57 mutants now).
  No rewiring landed: the iteration was spent on the defect the rewiring exposed, which was the right
  trade.
  - 🛑 **The defect, stated plainly**: the verdict table asked the base's BYTES for every question, and
    `reconcileBrain` runs the skill refresh at `update-engine.mjs:285` while `syncBaseTree` only lays
    the tree down at `:340`. On the first update of every brain installed before S1 there is **no
    ancestor on disk yet** — so every skill, *including untouched ones that must fast-forward*, would
    have fallen to `preserve`. **The engine would have stopped refreshing skills across the whole
    fleet, on the release that exists to unfreeze them.**
  - ⚠️ **A 100 % mutation score did not see it, and could not.** Both passes were clean: every mutant
    died against a table that was internally consistent and **wrong at its only real call site**. *A
    mutation score judges the tests against the code, never the code against the world.* Recorded in
    `RESULTS.md` beside the number so the number is not read as more than it is.
  - ➡️ **What this changes for the mode**: writing the design into the plan first is what made the
    defect **findable** (it is a paragraph, re-readable against the call order) rather than a wrong
    intuition buried in a window. But a design is only validated by **contact with its caller** — so a
    design-bearing slice is not finished when its own tests are green, it is finished when something
    downstream has tried to use it. Pull the wiring forward rather than saving it for last.
- 🌙 **2026-08-20 (night, loop iteration 4) — S2a-2 landed: the merge actually merges.** Commits
  `de19cd9` + `ead71d0`, pushed, suite **1912 pass / 0 fail**, mutation **75 % → 100 %** (numbers in
  `RESULTS.md`). The merge itself now exists end to end: a pure decision and a git seam.
  - 📉 **The 100 % / 75 % split repeated itself, one slice apart, on the same fault line.** S1 measured
    it once (three pure planners at 100 %, the fs orchestrator at 75 %); S2 has now reproduced it
    exactly (pure table 100 %, git seam 75 %). **Twice is a rule, not a coincidence**, and the honest
    statement of it is in `RESULTS.md`: a pure module's inputs are all visible in its signature, so a
    batch written from a design covers them; an impure one has inputs the author never names — a status
    code, a stderr, an `error` field — and a batch reaches only the ones it thought of.
    ➡️ **What this changes for the mode**: on an impure slice, plan the survivor-paying round **into**
    the slice instead of hoping for a first-pass 100 %. It is not a failure of care, it is the shape.
  - 🧱 **An architectural discipline test caught the production code, and it was right.** The suite
    refused a `spawnSync` composed at the call site (CONVENTIONS.md §5ter). The fix improved the design
    rather than appeasing a linter: the **argument order IS the ours/theirs contract**, and as a value
    it is asserted whole instead of being inferred from conflict markers.
- 🌙 **2026-08-20 (night, loop iteration 3) — S2a-1 landed: the verdict table, pure, 100 % on its
  first pass.** Commit `acabcc8`, pushed, suite **1899 pass / 0 fail**, mutation **47 killed / 0
  survived** (number in `RESULTS.md`). Eleven cases red on their assertions first, against a skeleton
  module so the red was never a loading error.
  - ✂️ **The slice re-cut itself on contact, and that is the rule working.** The plan named S2a as
    "core + first client"; writing a pure core, spawning git and rewiring the refresher in one go is
    exactly the >3-files shape this file calls **mis-cut**. Split into S2a-1 / S2a-2 / S2a-3 and written
    back into the owning plan before any code was committed.
  - 🔁 **A design written the iteration before paid for itself immediately.** The eleven test cases are
    the plan's own eight rows plus three triangulations — so the batch could not be a retelling of an
    implementation that did not exist yet. **This is the mechanism behind the 100 %**, not care: the
    fail mode of a big test-first batch is describing the code you already hold, and a committed design
    is what removes the code from the author's hands.
  - **Nothing was dispatched this iteration**: the reading was already in the window from iteration 2,
    and the slice is a design-bearing one, which the mechanical-only verdict keeps in session.
- 🌙 **2026-08-20 (night, loop iteration 2) — S2's DESIGN is written and committed. No code, on
  purpose.** The heaviest design of the chantier now lives in the owning plan (verdict table, merge
  engine, module boundaries, three slices, what is out) instead of in a window that a compaction would
  empty. **Next: S2a**, the merge core, test-first — the eight rows of the table are its test list.
  - **One arbitration raised, and it blocks one slice out of three.** *May the engine write
    `CLAUDE.md`?* Written as a blocking box at the top of the owning plan; S2a and S2b do not wait on
    it, so the loop keeps moving — which is the perimeter rule doing exactly its job.
  - **What was dispatched: the reading, again.** One `Explore` subagent returned the ordered update
    path, the manifest's four regimes verbatim, where the `.new` sidecar is written and where the
    report is printed. `update-engine.mjs` (485 lines) and the manifest never entered this window; the
    four modules the design actually reasons about (~420 lines, all small) were read here, where the
    design was being made. **The split held: bulk out, substance in.**
  - 🔬 **A design slice can still be MEASURED, and this one was**: `git merge-file -p --diff3` was run
    on real fixtures before being chosen — clean on the paragraph-vs-appended-section case, conflicting
    on adjacent lines. Three commands, and the design stopped being an opinion. **The lesson for the
    mode**: "no tests and no mutation score" is not "no evidence" — a design slice's cheapest guard is
    a five-minute experiment on the mechanism it is about to commit to.
- 🌙 **2026-08-20 (night, loop iteration 1) — S1's LAST slice landed: the base tree exists on disk.**
  Commit `74de7e8`, pushed on `feat/engine-base-unfreeze`, suite **1883 pass / 0 fail**. The slice was
  kept **in session**, correctly: it is the one that decides the tree's own regime (a design call), and
  the mechanical-only verdict keeps deciding in session.
  - **What WAS dispatched: the reading, twice.** Two `Explore` subagents returned (a) the exact call
    sites, signatures and DI seams of the four wiring points and (b) the answer to "does anything else
    in the engine see a new dotted directory at the brain root?" — the RAG indexer, the two vault
    scanners, auto-commit, `.gitignore`, the write guard. Neither file entered this window; both
    answers are now written into the owning plan. **This is the second rule working as designed.**
  - 📉 **The first slice of this chantier to score under 100 % on its first pass: 75 %, paid to 95 %**
    (`63598d7`), 2 named survivors. Numbers in `RESULTS.md`. **The lesson is about the mode, not the
    file**: the three PURE planners each scored 100 % first pass, and the moment the same design met a
    filesystem the same tests stopped being sufficient. *Pure code flatters a test batch.*
  - 📬 **Draft [PR #76](https://github.com/tpierrain/kenjaku/pull/76)**, based on
    `chore/s0bis-entrypoint-mutation-debt` so **#75 keeps its S0bis perimeter**. Nothing merged, nothing
    tagged — the perimeter's "a reviewable diff to wake up to", paid.
  - ⏹️ **The loop STOPPED itself here, deliberately, and this is the rule above being applied for the
    first time.** S1 was closed (code, mutation, numbers, plans, PR), and the next slice is **S2, the
    heaviest design work of the chantier**, on a window already past the ~170k hand-back ceiling. Since
    a session cannot clear itself, the ceiling can only be honoured by stopping. **S2 must therefore
    begin by writing its DESIGN into the plan**, before a line of test.
  - 🪤 **The `git add -A` guard fired, and it was right to.** Two subagents had been dispatched nine
    minutes earlier; the staging was redone file by file. The hook is doing exactly the job the S0bis
    run's two sweeps paid for.
- ✅ **2026-08-20 — `session-status.mjs`: 8.67 % → 96.10 %. S0BIS IS COMPLETE, and the 0 % tier is
  closed for the first time since v4.4.0.** Three measured rounds — **70.89 % → 90.12 % → 96.10 %** —
  commits a72755b, cbd01c0, e458cb6, 72912c3. Log `reports/s0bis-session-status.log`, full write-up
  in `RESULTS.md` § S0bis. **6 survivors left, all named equivalents**, not rounding.
  - **What the first pass exposed was the TESTS, not the file.** 46 survivors in three families: a
    real adapter layer judged by nothing (every case drove the hook through doubles, so `realGit` and
    the DB read were never executed at all), **doubles that ignored their arguments** (the fake fs
    took `(p)` and dropped the rest, so six `readFileSync(p, "utf8")` mutants could drop the encoding
    unseen), and genuine missing cases. The middle one is the lesson to carry: **a double's answer
    has to be a fingerprint of what it was asked, or it certifies nothing.**
  - **Five of the second round's survivors died by SIMPLIFYING the production**, not by another test:
    two reads guarded themselves with `existsSync` **and** a `try/catch`, which is the catch written
    twice, and both catch bodies re-assigned `null` to something already `null`.
  - **Nothing merged, nothing tagged.** The branch is pushed under draft PR #75, as the contract says.
- 🛠️ **2026-08-20 — `session-status.mjs` is converted, and the measurement found a trap in the
  MEASURING, not in the code.** Commits a72755b and cbd01c0, branch pushed, PR #75 still draft.
  - **The red was taken where it is safe.** In a disposable worktree, importing the unconverted file
    ran the whole SessionStart hook — pull, markers, detached child, banner on stdout. That is the
    defect, demonstrated rather than argued, and it is why this file could never be seen red in the
    working tree. The body then moved into `runSessionStatus(argv, deps)` behind the shared tail
    **without restructuring**, and the real hook was run as a process before and after: **output
    byte-identical, tree untouched**. The new sibling pins the composition through injected seams
    only — no real git, no real disk, no real child.
  - 🪤 **The trap, and it is new: a mutation run over a file that a SOURCE SCANNER reads breaks its
    own dry run.** Stryker instruments in place, so the literals `lib/entrypoint-discipline.mjs`
    scans for are rewritten under it; `session-status.mjs` stopped reading as an inline-invocation
    offender, and the shrink-only allowlist assertion went red — correctly, on a file that was still
    an offender when clean. **Anyone mutating a file named in one of those allowlists will hit this.**
  - **Paid rather than worked around**: the git call and the two detached children became named
    values (`buildGitInvocation`, `buildReconcileInvocation`, `buildUpstreamProbeInvocation`), each
    asserted whole, and the file **left `INLINE_INVOCATION_EXEMPT`**. A named value is stable under
    instrumentation as well as assertable.
  - ⚠️ **One self-inflicted hole, caught and closed**: the first commit bound the injected `spawn` to
    `spawnChild`, which hid both spawn calls from the scanner's token list. **A rename must not be
    able to buy silence from a guard.**
  - Ceiling **14 → 13**, `session-status.mjs` leaves the no-sibling allowlist, suite **1813 → 1839**.
- 🧭 **2026-08-20 — the debrief happened, and the three open questions are now two decisions and one
  dated deferral.** Owner's calls, in conversation, recorded here the moment they were taken:
  - **The mode is kept for S1–S5, mechanical only.** Dispatch needs a machine-evaluable pass/fail
    **and** no design judgement; everything that decides stays in session. This ratifies what S0bis
    measured rather than widening the bet — see the debrief box in § Tracking for the full wording.
  - **`session-status.mjs`: yes, now.** The arbitration is answered with the owner at the keyboard,
    on the fourth time this debt has come due. The recipe below stands as written.
  - **The adversarial-review fan-out is deferred to the S1 debrief, with a destination and a
    condition** — S0bis ran no adversarial pass, so there is nothing to judge it on; S1 must produce
    one slice reviewed that way and one not. Deferring without those two is how it comes back
    undecided a third time.
- ❓ **2026-08-20 — an unreproduced flake in `session-universe.test.mjs`, reported by an agent and
  NOT diagnosed. Written down so the next person does not burn the same hour.** The tier-1 agent that
  converted `set-active-universe.mjs` saw the race test — *"the universe hook waits for the startup
  pull"* — fail once **inside a full-suite run** while the fan-out was saturating the machine, then
  pass alone and on a clean re-run.
  - **I could not reproduce it: 20 solo runs and 10 full-suite runs, all green.** So it is rare, and
    load is the only correlate we have.
  - **The obvious explanation is WRONG, and that is the useful part.** The test gives the child a
    250 ms head start before flipping the pointer, which reads like a too-tight wall-clock margin —
    but it writes the marker as `phase: "running"` **before** spawning, so the barrier sees its own
    session immediately and gets the **full 12 s ceiling** (`WAIT_MS` in `lib/startup-sync-gate.mjs`),
    not the 3 s grace. 250 ms against 12 s is not a tight race. Do not "fix" it by raising the sleep.
  - **The one mechanism left standing, unverified**: the test rewrites the marker file
    (`.cache/startup-sync.json`) *while* the child polls it every 50 ms, so a loaded machine could
    hand the reader a **torn read** of a file mid-rewrite. That is a real cross-process hazard the
    test itself creates. Confirming it means instrumenting `readMarker`, not re-running the suite.
  - **Not touched**: out of S0bis scope, and a timing test is exactly the thing not to change blind at
    the end of an autonomous run. It is a **debrief input**: if the flake is load-induced, the
    orchestration mode manufactures its own false reds, and that is a cost of the mode, not of the test.
- ✅ **2026-08-20 — S0BIS IS DONE. Both v4.8.0 debts are paid and measured; one arbitration is left
  standing, in writing.** Branch `chore/s0bis-entrypoint-mutation-debt`, draft PR, nothing merged and
  nothing tagged. **14 agents used of the ~25 the contract allows.**
  - **The numbers** (`RESULTS.md` § S0bis, worktree `kenjaku-mut-s0bis`, logs `reports/s0bis-batch{1,2}.log`):
    `lib/entrypoint.mjs` **100.00 %**, `status-line.mjs` **0 % → 100.00 %**, `upstream-check-run.mjs`
    **0 % → 100.00 %**, `lib/engine-fetch.mjs` **54.05 % → 84.21 %**, and the new guard
    `lib/entrypoint-discipline.mjs` **71.82 % → 81.44 %** after one hardening round.
  - **Suite 1723 → 1813 pass / 0 fail. Ceilings 32/26 → 14/9.** Fifteen of the twenty-six guarded
    files converted.
  - **What the mode actually bought, judged honestly.** The 12-file tier-1 fan-out is where it paid:
    twelve mechanical conversions, each with a machine-evaluable pass/fail, none of which needed my
    context. Where it did **not** pay is everything with judgement in it — the judge, the canary, the
    three tier-3 files, Debt 2 — all kept in session, all of them the parts that found real defects.
    **The rule that made it safe is the one to keep**: nothing was dispatched without a deterministic
    check, and no agent wrote a test.
  - **The two orchestration mistakes are recorded above, both the same mistake twice**: `git add -A`
    and then `git add scripts/` while a wave was in flight, sweeping unfinished agent work into a
    docs commit. Both happened to be green, verified after the fact — by luck, not by design. **Stage
    explicit paths while a wave runs.** This is the single most important line for the debrief.
  - **What the guard proved on day one**: switched on before the conversions, it went red on exactly
    one production file — `engine-fetch.mjs`, the Debt-2 file. The debt did not have to be
    remembered; it was reported. That is the difference between a fix and a ratchet.
  - **What is left, and it is named rather than implied**: `session-status.mjs` (the arbitration
    below), and the guard's own **81.44 %**, which is under the repo norm (~94 %) — its 54 survivors
    live in the hand-rolled comment/quote state machine. Both are written into `RESULTS.md` § S0bis
    as follow-ups, not rounded away.
  - **Draft [PR #75](https://github.com/tpierrain/kenjaku/pull/75) is open** (e0f740c). _(Written at
    the close of the run: "next, and both need the owner — the mode debrief, and `session-status.mjs`".
    **Both were done the same day**; this line is kept as the run's own record, and § Tracking is where
    the state lives. A run log is history: never resume from one.)_
- 🛑 **2026-08-20 — ARBITRATION, taken and NOT resolved autonomously: `session-status.mjs` is left
  for a session with the owner at the keyboard.** It is the third and largest of the named 0 % files
  (measured **8.67 %** at v4.9.0, up from a flat 0.00 % carried since v4.4.0 — `RESULTS.md` § v4.9.0),
  so leaving it is leaving the head of the debt. The reason it is nonetheless the right call:
  - **It has no `.test.mjs` sibling**, so there is no existing net to catch a mistake.
  - **Its whole body is top-level and side-effecting**: `sweepThenPull` runs a real `git pull`,
    `markSyncRunning`/`markSyncDone` write marker files, `armRestartPending` writes, and it spawns
    detached children. ~190 of its 265 lines are that body.
  - **It cannot be executed to check the work.** It is the SessionStart hook of every generated brain;
    running it here sweeps and auto-commits the working tree. So the usual proof — run the CLI before
    and after, see the behaviour unchanged — is unavailable, and a wrong guard is felt by every user
    at their next session start rather than by a red test.
  - The logic is already delegated to tested `lib/*` modules; what is top-level is composition and I/O
    wiring, which is exactly the part with no net.
  - **The safe recipe for next time, so this is not re-derived**: wrap the body into
    `export function runSessionStatus(argv, deps)` behind the shared tail **without restructuring**,
    then prove the guard by running the import probe **inside a disposable git worktree**, where a
    sweep-and-commit is harmless, and by asserting the working tree is untouched afterwards. Only then
    split the composition into pure pieces.
  - Everything else in S0bis was completed around it, per the owner's standing instruction to write a
    blocking arbitration down and keep the other slices moving.
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
    test authorship rather than a refactor.
    - ❌ **CORRECTION (2026-08-20, re-read on the diff)**: this entry first claimed the extraction
      *"caught a real defect: a trailing `--brainDir` with no value resolved to `undefined`"*. **That
      is false.** `main` already guarded it (`flag !== -1 && process.argv[flag + 1]`); the fallback
      was correct before the run and is unchanged after it. What the extraction did was make that
      branch **reachable by a test** and **state the intent in a comment** — worth doing, and not a
      bug fix. Left visible rather than quietly deleted: a run log that claims a defect it did not
      find is exactly the kind of inflation this file exists to prevent.
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
- [x] **Run the mode on S0bis** — the release's first unticked box, and the best-judged cargo we have.
      _(2026-08-20 — **COMPLETE**, draft [PR #75](https://github.com/tpierrain/kenjaku/pull/75).
      `session-status.mjs`, the last item under it, was arbitrated and paid the same day: 8.67 % →
      **96.10 %**. Nothing merged, nothing tagged.)_
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
    - [x] **Tier 3 — the two remaining 0 %-scored files**: `status-line.mjs`, `session-status.mjs`.
          Never fanned out: they run at EVERY session start. _(2026-08-20 — both done.)_
      - [x] `status-line.mjs` _(2026-08-20 · eb8b0fb — **0 % → 100.00 %**)_.
      - [x] 🛑 `session-status.mjs` — **arbitration ANSWERED 2026-08-20 (yes, now, owner at the
            keyboard), and DONE the same day** _(a72755b + cbd01c0)_. The three reasons it was
            blocking held throughout and shaped the work: no test sibling, ~190 side-effecting
            top-level lines, and no way to verify it by running it here. The recipe worked exactly as
            written — the disposable worktree is what restored fail-first on a file that had none.
        - [x] Debt 2 paid on this file too, unplanned: its three child processes are values now, and
              it leaves `INLINE_INVOCATION_EXEMPT` _(cbd01c0)_. Not scope creep — the mutation run
              could not even dry-run without it (see the Run log's trap).
    - [x] The duplicate predicate: fold `auto-commit.mjs`'s `isEntryPoint` (reversed arguments,
          re-exported to `auto-push.mjs`) into the shared tail. Kept in session — the two files are
          coupled, and `auto-commit` runs on every single edit _(2026-08-20 · bc2a8bf)_.
    - [~] Remaining inline guards (`session-*.mjs`, `health-probe-run.mjs`, `set-active-universe.mjs`,
          `import-brain.mjs`, `update-engine.mjs`) — fat bodies, recorded as remaining debt if the run
          ends before them. _(2026-08-20 — `set-active-universe.mjs` done (4fdb91b); the rest are the
          **recorded remaining debt**, held by the ceilings at **14 / 9**, down from 32 / 26.)_
  - [x] **Step 4 — Debt 2**: `defaultGit` split into a pure invocation builder plus a thin runner,
        asserted whole, self-exempting comment deleted _(2026-08-20 · a3faa2a — brought forward, since
        the new guard went red on it the moment it was switched on)_. No `win32` case to feed: git is a
        real executable on Windows too, so the invocation is byte-identical everywhere — that absence
        is asserted as the design, in a comment, rather than faked with a vacuous test.
  - [x] **Step 5 — the batched mutation gate** in a disposable worktree over the touched files; numbers
        into `maintainers/mutation/RESULTS.md`, plus the line in its § v4.8.0 naming the release that
        paid each debt _(2026-08-20 — two batches in `kenjaku-mut-s0bis`, logs
        `reports/s0bis-batch{1,2}.log`, written up as `RESULTS.md` § S0bis; the v4.8.0 debt section
        now carries a ✅ callout naming what paid it)_.
  - [x] Tick the matching boxes in `v4.9.0-mutation-debt-plan.md` and the S0bis box in
        `update-regime-owns-what-it-shipped-action.md` _(2026-08-20)_ — including moving that plan's
        landmark off S0bis and onto **S1**, so the next resume does not restart on delivered work.
  - [x] Push the branch and open a **draft** PR. Nothing merged, nothing tagged _(2026-08-20 · e0f740c
        — [PR #75](https://github.com/tpierrain/kenjaku/pull/75), draft)_.
- [x] **Debrief the mode after S0bis** — done _(2026-08-20, owner's call in conversation)_: what the
      fan-out cost, caught and broke is the S0bis run-log entry above; the verdict on it is here.
  - [x] **VERDICT — the mode is kept for S1–S5, but MECHANICAL ONLY.** A slice is dispatchable when
        it has a machine-evaluable pass/fail **and** no design judgement in it: repetitive
        conversions, bulk reference reads, wide codebase sweeps. **Everything that decides stays in
        session** — the design, the judge, the canary, anything session-critical, anything whose
        failure is felt by a user rather than by a red test. This is exactly the split that paid on
        S0bis (12 mechanical conversions cost no context; every real defect was found in the parts
        kept in session), so the verdict ratifies the measurement instead of widening the bet.
  - [x] **What the mode is NOT allowed to buy**: no agent writes a test, and no slice is dispatched
        because it is merely large. Size is not the criterion — judgement is. _(Already `CONVENTIONS.md`
        §12; restated here because this box is where the verdict lives.)_
  - [ ] **The costs kept on the ledger, not waved away**: the mode manufactures its own false reds
        under load (the unreproduced flake above), and the two staging mistakes were the same mistake
        twice. The staging one now has a deterministic net; the false-reds one does not, and a red
        seen during a saturated fan-out is to be re-run solo before it is believed.
- [~] **Run the mode on S1** — the first slice of substance, and the first test of the mechanical-only
      verdict on work that is *not* a repetitive conversion.
  - [x] **Slice 1 — the base's home and its proof: KEPT IN SESSION, and that was the verdict working**
        _(2026-08-20 · `411d4d7` + `40743c1`)_. Nothing here was dispatchable: the design decides what
        `merge` will mean afterwards, and the tests are the judge every later slice will be measured
        against — the two things the verdict names first. The day-of runner then judged it
        mechanically (**100 %**), which is the shape to keep: **the human keeps the judgement, the
        machine keeps the score.**
  - [ ] **Where a fan-out becomes legitimate on S1**, and it is not yet: once the advance rule and the
        seeding planner have their tests written **in session**, seeding the base tree across the
        families is repetitive work against a written judge. That is also the slice to run
        **adversarially reviewed**, to produce the contrast the deferred question needs.
- [x] **DONE — plans go stale because their state is COPIED, not because the rule is forgotten.**
      _(Owner asked "pourquoi tu n'arrêtes pas d'oublier de mettre à jour le plan ? il y a un truc qui
      ne va pas dans mon harnais", 2026-08-20. His call on the fix: **"les deux, le hook d'abord"**.)_
      **All three builds landed 2026-08-20.** Two tails are left and both are the **owner's**: the
      outward-facing propagation (Build 2), and the unmerged doctrine branch (Build 3).
  - [x] **The measurement, taken before answering, so this is not a feeling.** Four files name the
        branch `chore/s0bis-entrypoint-mutation-debt` (this plan, the chantier plan, the debt plan,
        `RESULTS.md`); eight mention `session-status`. The session made **8 commits, 4 of which wrote
        to plans** — and each one updated *the plan that was open*, never its siblings. **The rule
        fires; what it cannot reach is the duplicates.**
  - [x] **Three causes, and only the third is about me.** (a) One work item's status is restated in
        four repo files with no link between them, so every change needs 3-4 hand-synchronised edits
        and nothing checks. (b) The rule is written in the **singular** — `plans.md` says "*the* plan
        must already say…", and `CONVENTIONS.md` §3's "one canonical plan" is about repo-vs-tooling
        snapshot, **not** about a status copied across four repo files. It has literally nothing to
        say about this case. (c) The save point is "every handed-back turn", and this session chained
        ~60 tool calls between two hand-backs: **the autonomous mode rarefies the trigger exactly
        when there is most state to record.** That is an interaction between two harness parts, new
        since 2026-08-19, and it will get worse in S1–S5, not better.
  - [x] **Why prose cannot be the answer, in the repo's own words**: everything that stopped
        recurring here got a mechanical guard (the entry-guard shape → a guard test with shrink-only
        allowlists; `git add -A` mid-wave → `wave-staging-guard.mjs`). Plan staleness has only prose,
        and §5quinquies says outright that answering a recurring shape with one more written reflex
        is the move already measured as insufficient.
  - [x] **Build (1): the hook that NAMES THE CARRIERS** _(2026-08-20 —
        `~/.claude/hooks/plan-carrier-guard.mjs`, wired into `~/.claude/settings.json` on `SessionStart`
        + `Stop`)_. On hand-back it greps the **tracked Markdown** for the current branch (widened from
        `plans/` + `ROADMAP.md`: the fourth carrier measured was `maintainers/mutation/RESULTS.md`,
        which that narrower glob would have missed), subtracts what the session touched since the sha
        it started on, and **blocks the hand-back** with *"4 files name this branch, you touched 2"*.
        It judges **no content**.
    - [x] **Test-first**: 29 self-test cases on the pure core, seen **red for the right reason** (14/29
          on stubs, assertion failures) before a line of implementation, then 29/29 green. Plus 8
          end-to-end payloads against a throwaway repo (`plan-carrier-guard.e2e.sh`, beside the hook):
          stamping, the warning, suppression, `stop_hook_active`, every carrier touched, `main`,
          outside a repo, malformed payload.
    - [x] **Two design calls, taken and not to be re-opened**: it **blocks** (exit 2) because a `Stop`
          hook that exits 0 is invisible to Claude, and the fix is cheap; and it stays silent once
          warned until HEAD or the carrier list changes, so judging *"this one needs nothing"* is
          allowed to end the matter instead of looping.
    - [x] Named in `CONVENTIONS.md` § See also and § 3bis. **Machine-local, it does not travel** —
          accepted, same as `wave-staging-guard.mjs`. ⚠️ It loads at **session start**, so it does not
          watch the session that wrote it.
  - [x] **Build (2): fix the rule at its source** _(2026-08-20 · `use-case-driven-harness@abecb38`,
        pushed on `chore/harness-consolidation`)_. `rules/plans.md` gains § *"The plan is PLURAL"*;
        `skills/plan-discipline/SKILL.md` gains the actionable line; `plan-discipline.md` gains § 3.bis
        (the measurement, the three causes, why prose alone could not be the whole answer). Tracked
        there as **T7** of `docs/plans/harness-consolidation-action.md`, which **owns** it.
    - [x] Kenjaku's own § 3bis restates it rather than linking — deliberate, and it is T6's standing
          arbitration: `CONVENTIONS.md` exists so the rules **travel with a clone**, and a pointer to
          another repo does not travel.
    - [ ] **Left to the owner, deliberately**: the public extract `plan-memory-test-harness` and the
          published page still carry the singular version. Both are **outward-facing**, and the fate of
          that repo is a question already open in the harness plan's header. Do not propagate alone.
  - [x] **Build (3): deduplicate the corpus** _(2026-08-20)_ — one item, one **owning** plan; the
        others LINK instead of restating a status. Attack the cause, not the symptom. Sequenced after
        the hook on purpose: the hook's `--explain` named the four carriers rather than guessing them.
    - [x] **The ownership split, decided and written into `maintainers/README.md`** so it outlives this
          plan: *the release's state* → `update-regime-owns-what-it-shipped-action.md`; *every measured
          number* → `mutation/RESULTS.md`; *the working mode and its run log* → this file; *why a debt
          exists and when its due date moved* → `v4.9.0-mutation-debt-plan.md`.
    - [x] **The criterion used, and it is sharper than "remove the duplicates"**: a **present-tense
          claim** about current state (*"nothing sits in the 0 % tier any more"*, *"12 survivors left"*)
          rots and must live with its owner; a **dated past-tense measurement** inside a ticked box
          (*"2026-08-20 — 54.05 % → 84.21 %"*) is a record and stays true forever. Only the first kind
          was replaced by a link, so no evidence was stripped in the name of tidiness.
    - [x] Applied to the three non-owning carriers: the debt plan's header now states what it owns and
          points for the rest; the chantier plan keeps the release's state and drops the copied scores;
          this file's header points at both.
    - [x] **One stale sentence found and fixed by doing this**, which is the whole point: the S0bis run
          log still read *"next, and both need the owner: the mode debrief, and `session-status.mjs`"*
          — both done the same day. Kept as the run's own record, marked as history.
    - [x] **Six broken relative links repaired** on the way (plans moved to `archived/` without their
          referrers following, in `maintainers/README.md` and `CONVENTIONS.md`) — the same disease one
          level down: a pointer nobody re-checked.
    - [ ] ⚠️ **Not merged, and it matters here**: `chore/plan-discipline-points-at-the-harness`
          (`0001ba9`, pushed, **no PR**) rewrites `CONVENTIONS.md` §1's banner and guts
          `maintainers/plan-discipline.md`. On **this** branch those files still describe the old
          shape, so §3bis was worded to be true either way. **Two branches touching the same doctrine
          is the next duplication to close** — merge order is the owner's call.
- [x] ✅ **DONE 2026-08-20 — the `mutation-testing` pair: a SCRIPT *and* a skill** _(owner asked for it 2026-08-20,
      mid-run: "on découvre toujours un peu les mêmes choses avec Stryker … est-ce que ça ne vaudrait
      pas le coup de se faire une skill ?")_. **Scheduled right after `session-status.mjs`**,
      deliberately: the traps are fresh and checkable against the run that just happened.
  - [x] 🟢 **THE ARBITRATION BELOW IS ANSWERED — 2026-08-20, owner: "script + skill".** Do **not**
        re-open it, and do not write the skill alone. Build **both**:
        `maintainers/mutation/mutate-one.mjs` for the mechanics (the braces) and
        `maintainers/skills/mutation-testing/SKILL.md` for the judgement (the belt). The reasoning he
        endorsed is §5quinquies': answering a recurring shape with one more written reflex is the move
        already measured as insufficient.
  - [x] **The script** _(2026-08-20 · `59a4ec4`, hardened in `0f43037`)_ —
        [`maintainers/mutation/mutate-one.mjs`](../../mutation/mutate-one.mjs), test-first: 30 cases
        seen red for the right reason on stubs first, 38 after the hardening round. Every trap listed
        below is now a step in an ordered **plan of values**, so the ORDER itself is asserted rather
        than described. Three decisions taken while building it, none of which need re-opening:
    - [x] **The worktree is a SIBLING of the repo and is REUSED** (`../kenjaku-mut-one`), never a
          scratchpad path: both v4.4.0 worktrees lived under the session scratchpad and macOS's temp
          cleanup took their reports. It is reset, never removed — the runner offers no teardown.
    - [x] **The log is written into the REAL repo**, not the worktree, and discarded **before** the
          run rather than after: a stale log is the most convincing way to be told a number that was
          never measured.
    - [x] **The tuning is checked twice**: on the config before the run (concurrency ≤ 5, timeout
          ≥ 30 s, `inPlace`, `disableTypeChecks`) and on the report after it (a run whose mutants
          mostly timed out is REFUSED, not reported). The fake 99.97 % cannot come back silently.
    - [x] **The runner is measured by its own rule** _(`0f43037`)_ — `stryker.maintainers.config.mjs`,
          **80.95 % → 99.11 %**, 3 named equivalents. It runs in the sandbox and **skips the two
          `^entry point` cases**: they spawn the real file, so a mutant flipping `dryRun` would run
          `git worktree add` for real from inside a test.
    - [x] **Wired into CI on macOS only** — the suite would otherwise run in **no job at all**
          (nothing under `maintainers/` was ever tested by CI). Windows is excluded deliberately: it
          is a maintainer's machine tool with POSIX path fixtures.
  - [x] ~~**START HERE — the script first**~~ _(kept for the trap list it carries)_. What it had to
        make unrepeatable, each trap having cost a real run: `git worktree prune` before re-adding a worktree that was `rm -rf`'d
        (otherwise `add` refuses, the run silently never happens, and a STALE log gets read as the
        result), the disposable worktree itself (`inPlace` on the real tree once wiped the vault's demo
        notes), the `rag/node_modules` symlink the worktree needs, verifying
        `vault-write-guard.test.mjs` reports **0 skipped**, concurrency 5 + 30 s timeout (or the run
        returns a **fake 99.97 %** made of bogus timeouts), `disableTypeChecks: false`, and a **loud
        failure** instead of a stale log. Read `mutate-changed.mjs` first — it is the existing sibling
        and sets the shape (repo-root resolution, the Stryker bin path, `--mutate` as ONE
        comma-separated list).
  - [x] **The diagnosis, so the skill is not written against the wrong problem.** What we keep
        re-deriving is **not** assertion quality — that already lives in `test-first-discipline` and
        it works. It is **how to OPERATE Stryker on this repo**, and it is scattered across three
        carriers that are only read once opened: comments inside the config files, `RESULTS.md`
        § Reproduce, and `RETROSPECTIVE.md`. Same carrier defect §12 fixed for orchestration: the
        knowledge is read when a file is opened, while the mistakes are made **while acting**.
    - [x] ⬆️ **Half of that diagnosis has since gone upstream, and it must not come back here**
          _(2026-08-20 · `use-case-driven-harness@29abfa8`, T8)_. `test-first-discipline` v2.1.0 now
          carries the **portable** half — the five ways any run reports a number it did not measure,
          and the survivor triage that comes before writing a test. What stays local is the **local
          answer**: which command, which worktree, which package. Do not restate the five traps in
          `maintainers/skills/mutation-testing/SKILL.md`; it links to them.
  - [x] 🛑 **The refinement that was put to him, and that he took** _(kept for its reasoning; the
        decision is the green box above)_. `CONVENTIONS.md` **§5quinquies already carries part of this recipe**
        (the worktree, the reset incantation, the symlink, the two commands) — so the skill would not
        fill a void, it would consolidate. And that same section ends with the corollary that argues
        against it: *"do not answer a recurring shape with one more written reflex"*, because the
        prose move was already measured as insufficient. **The stronger answer is a SPLIT**: a
        **script** (`maintainers/mutation/mutate-one.mjs`) that makes the mechanical traps
        unrepeatable — prune, worktree, symlink, verify `vault-write-guard.test.mjs` reports 0
        skipped, run, normalise the log, print the score, fail loudly instead of leaving a stale log
        to be misread — plus a **skill** for what a script cannot hold: when to run a pass, how to
        read the survivors, when to simplify the production instead of writing a case, and when to
        name an equivalent. **The script is the braces, the skill is the belt** — the same shape
        `language.md` uses. Note it is MORE work than the skill alone, hence the owner's call.
        _(Where it lives is already settled: `maintainers/skills/`, precedent `plan-discipline`,
        because `maintainers/` is excluded from install while `.claude/skills/` ships to every
        generated brain — a maintainer skill must never travel there. It gets loaded by being named
        from `CONVENTIONS.md`, which `CLAUDE.md`'s maintainer note points at.)_
  - [x] **The six operational traps it must carry**, every one of which has already cost a real run:
        the sandbox has no `.git` so the manifest-integrity test dies before the first mutant (hence
        `inPlace`); `inPlace` on the real tree is destructive (a mutant once wiped the vault's demo
        notes), hence the **disposable worktree**; reset between batches with `git reset --hard` +
        `git clean -fd` and **never** `git checkout -- .`; concurrency 5 + a 30 s timeout, or the run
        returns a **fake 99.97 %** made of bogus timeouts; `disableTypeChecks: false`, or `@ts-nocheck`
        lands on the worktree; and the new one — **mutating a file that a source scanner reads breaks
        the dry run**, because instrumentation rewrites the literals under the scanner.
  - [x] Plus, from the `session-status` rounds: **how to read the survivors** — the three families
        (a real adapter layer judged by nothing, doubles that ignore their arguments, genuine missing
        cases), the **simplify-the-production-instead** reflex, and what makes a **named equivalent**
        honest rather than a rounding-up. Written up with real numbers in `RESULTS.md` § S0bis.
  - [x] Plus the two that cost time this very session and are pure operations: `git worktree prune`
        before re-adding a worktree that was `rm -rf`'d (otherwise `add` refuses and the run silently
        never happens, leaving a STALE log to be misread as the result), and the `rag/node_modules`
        symlink the worktree needs.
  - [x] **The split with the existing carriers, so nothing is duplicated**: the skill owns the
        **how-to** (when to run a pass, the worktree recipe, batching, the traps, where results go);
        `RESULTS.md` stays the **measurement register**; `RETROSPECTIVE.md` keeps the **design
        lessons** mined from survivors.
- [ ] **The adversarial-review fan-out as standing QA — DEFERRED WITH ITS DESTINATION, not left
      hanging** _(owner, 2026-08-20)_. The question came out of v4.9.1 (its verdict is in
      `archived/hotfix-v4.9.1-universe-pointer-action.md`) and asked whether every slice must pass a
      multi-agent adversarial review before it counts as finished. **Not answered now, deliberately:
      S0bis produced no figure on it** — it ran no adversarial pass, so answering today would be
      taste, not measurement. **Decided at the S1 debrief, with S1's figures.** Until then it stays
      case-by-case (sensitive code, rewrites), never a standing gate.
  - [ ] What S1 has to produce for this to be answerable: at least one slice reviewed adversarially
        and one not, with what each caught. Without that contrast the next debrief re-deals the same
        undecided question.
- [~] **When the release ships**: fold the surviving lessons into `maintainers/CONVENTIONS.md` (or
      kill this file), and rewrite the memory pointer to whatever becomes live next.
  - [x] **Folded EARLY, on purpose** _(2026-08-20 — `CONVENTIONS.md` **§12**)_: the two delegation
        rules, "judgement does not parallelize", the staging rule, the false-reds warning, and the
        run-log-is-evidence rule. **Why not wait for the ship date, as this box said**: this file is
        scheduled to be archived at that date, so its doctrine had an expiry — and "we will do it when
        the release ships" is the exact mechanism that slipped the mutation debt three times. The
        lessons were also in the worst possible carrier: a run log, read when opened, while the
        mistakes happen **while acting**.
  - [x] **The one lesson that repeated got a deterministic net, not a sentence** _(2026-08-20)_:
        `~/.claude/hooks/wave-staging-guard.mjs` stamps every agent dispatch and **blocks** a broad
        `git add` for 20 min afterwards. 20 self-test cases, five end-to-end payloads verified.
        Machine-local, so it is named in `CONVENTIONS.md` § See also rather than versioned here.
  - [ ] What is deliberately NOT folded yet, because it is still a question and not a rule: the
        unreproduced flake, and the adversarial-review question below.
  - [ ] **Ready to fold once S1 confirms it**: the mechanical-only verdict above. It is a rule now,
        but it is one release old — fold it into `CONVENTIONS.md` §12 when S1 has run under it, so
        what travels is a measured rule rather than a fresh opinion.

---

> **Sibling reading**: `maintainers/CONVENTIONS.md` (checkboxes on every step, one canonical plan =
> the repo's, green-only commits), and the standing test-first discipline. Nothing here overrides
> either — orchestration is a delivery mode, not a licence.
