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
> [`v5-unfreezes-the-existing-fleet-action.md`](v5-unfreezes-the-existing-fleet-action.md);
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
>    [`v5-unfreezes-the-existing-fleet-action.md`](v5-unfreezes-the-existing-fleet-action.md) —
>    **open it and start where ITS header says**; this list deliberately restates none of that (a second
>    copy of a status is a future lie). What belongs to the **mode** is this: the release is what has to
>    produce the **contrast** the deferred adversarial-review question needs (one slice reviewed
>    adversarially, one not), and it is **still unproduced** — ⚠️ **twelve iterations in, the
>    mechanical-only verdict has cost the mode its own subject.** Slice after slice has been design +
>    test-first + a measured refactor, i.e. exactly the class the verdict keeps in session, so nothing has
>    ever been dispatched to debrief. _(S7-2, 2026-08-21, unchanged: the bulk reads went to two Explore
>    agents — seven modules plus the repo's test conventions — while design, tests and implementation all
>    stayed in session. Same shape, one more iteration.)_ **This is now a finding, not a delay**: if a whole release can be
>    built without one dispatchable slice, the honest conclusion may be that the contrast cannot be
>    produced by waiting for one, and the question has to be re-framed (e.g. dispatch the adversarial
>    REVIEW of a slice built in session, which the verdict does allow).
>
> ## 📉 A RULE THAT EXISTS, IS WRITTEN, AND STILL DID NOT FIRE _(S7-2, 2026-08-21)_
>
> The mutation runner measures **`HEAD`**, never the working tree. `maintainers/skills/mutation-testing/SKILL.md`
> says so in bold. `RESULTS.md` § S7-1 recorded it **one slice earlier**. S7-2 walked into it anyway,
> and in a worse form than the one on record: S7-1's write-up said an uncommitted file reports
> `NaN %`, which sounds self-announcing — here the file was committed and only the **fix** was not, so
> the run returned a perfectly plausible **83.33 %** with a survivor list quoting lines that had just
> been deleted.
>
> **The finding is not "add a rule".** Three carriers already held it. The finding is that a
> **maintainer skill loads only when something invokes it**, and a loop iteration that runs
> `mutate-one.mjs` from muscle memory invokes nothing. Two candidate nets, neither built yet and both
> the owner's call: make `mutate-one.mjs` itself **refuse (or loudly warn) when the working tree is
> dirty** — deterministic, at the exact moment of the mistake, no skill to remember — or have the loop
> prompt name the skill. **The first is braces, the second is belt**; the first is the one that
> travels.
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
> - **STOPPING the loop is in the session's hands, cleaning is not.** ⚠️ **AMENDED 2026-08-21, owner's
>   explicit instruction: *"idéalement je ne veux pas que tu t'arrêtes."*** Stopping is therefore **no
>   longer the answer to a full window** — it is the LAST resort, not the honest reflex. Read in order:
>   - **The default is to CONTINUE.** Every iteration ends by re-arming the wake-up. A compaction is
>     not an ending: the plan is written so the next iteration restarts from it, and that is exactly
>     what makes riding on legitimate here where it would be pretending elsewhere.
>   - 🪤 **FORGETTING to re-arm IS stopping, silently — and it has already happened.** Iteration 41
>     ended without a `ScheduleWakeup`, so the night ended by omission, not by decision. There is no
>     warning for this. **Re-arming is the last action of every iteration**, and skipping it is a
>     decision that must be stated out loud, never a thing that just occurs.
>   - **The one legitimate reason to stop**: work is coming out **WRONG** — not "the window feels
>     full", not "this slice deserves better". Measured wrong: a test that will not go green, a
>     verdict that contradicts the plan, an edit landing in the wrong file. Then stop, write **why**
>     into the plan, and say so. A quota that runs out or a session the owner closes are not this;
>     they need no decision at all.
>   - **What actually buys the night is DELEGATION, not stopping.** Bulk reads to subagents, and the
>     implementation of any slice whose tests already exist. Measured on iteration 41: four Explore
>     agents covered seven modules, a fixture suite and a 2 200-line archived plan for ~2 500 words
>     of main-window cost, and the implementation itself never touched this window at all.
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
> Open maintainers/plans/prospective/v5-unfreezes-the-existing-fleet-action.md and read its
> header (WHERE THIS RESUMES / RESUME AT). Do the ONE slice it names, and only that one.
>
> A DESIGN slice has no tests and no mutation score: it is finished when the design is WRITTEN
> INTO THE PLAN and committed -- the shape, the cases it must answer, what is deliberately out.
> Do not start coding it in the same iteration.
>
> A CODE slice is test-first: see the tests fail on their assertions before any production code.
> Then the full suite green (node --test "scripts/*.test.mjs" "scripts/lib/*.test.mjs"), then
> COMMIT. Never commit red.
>
> MEASURE ONCE PER BLOCK, NOT PER SLICE (Thomas, 2026-08-21 -- CONVENTIONS.md 5quinquies), AND
> MEASURE THE CHANGE, NOT THE FILE (Thomas, 2026-08-21, second call, on iteration 32's figures).
> Mutation is due when a BLOCK of slices is finished. The SCOPE of each run is the scope of the
> change:
>   - a NEW file -> whole, now:  node maintainers/mutation/mutate-one.mjs scripts/<new>.mjs
>   - an EXISTING file changed by a few lines -> THOSE LINES ONLY, never the whole file:
>     node maintainers/mutation/mutate-one.mjs "scripts/<file>.mjs:147-160"
>     (verified: 44 s / 17 mutants instead of 7 min / 396, same defect caught. A whole-file
>     re-run of reconcile-brain returned a survivor list byte-identical to the previous one --
>     7 minutes for zero information -- and a third one was killed by the 10-minute cap.)
>   - the release tail keeps its full pass, unchanged.
> This is NOT a licence to defer to the tail: "less surface, IMMEDIATELY".
> No confirmation re-run when you can predict the delta -- write the prediction down instead.
> RESULTS.md gets ONE LINE per file; a paragraph only for a NEW shape of defect. No pass at all
> on a doc-only or wiring-only slice -- but say the skip in writing. Still mandatory, whatever the
> hurry: a new pure module, anything on the WRITE PATH, and prose that is the deliverable --
> scoped to the lines you wrote when the file already existed.
> BONUS worth as much as the minutes: on a hunk-scoped run EVERY SURVIVOR IS YOURS. No score
> drift to attribute, no survivor list to diff against last time.
>
> Either way: tick the carriers -- the owning plan, RESULTS.md for any number, this mode plan if
> the mode learned something -- commit and push on feat/engine-base-unfreeze. If the slice needs
> a decision that is Thomas's, write it as a blocking box at the top of the plan and move to the
> next slice that does not need him. Bulk reads go to a subagent, and so does the IMPLEMENTATION
> of a mechanical slice once its tests exist -- that is what makes the night last, since the
> window never empties between iterations.
>
> Then END THE ITERATION -- one slice per iteration, never two -- and RE-ARM the loop so it
> restarts you from the plan. "End the iteration" is NOT "stop the loop": the owner's standing
> instruction (2026-08-21) is do not stop. Re-arming is the LAST action of every iteration, and
> forgetting it ends the night silently -- that is how iteration 41 ended. Stop only if the work
> is coming out measurably WRONG, and then write why into the plan.
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
> [`v5-unfreezes-the-existing-fleet-action.md`](v5-unfreezes-the-existing-fleet-action.md), which
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

- 🧰 **2026-08-22 (doctrine cargo 2/3, #67) — a rule that states a LOCAL constraint as UNIVERSAL does
  not merely misinform: it manufactures work for the person it was meant to serve.** `b2bb910`.
  *"Never Bash to probe the vault"* rested on a premise true of one surface in one permission mode. In
  a real session in auto mode, with the native `Grep` absent and the harness itself saying to fall
  back, the brain read its own constitution as self-contradictory and **filed a friction item asking
  its owner to arbitrate** — a rule that lives in the engine layer, which owners are told not to edit.
  Engine-induced noise in a user's backlog, plus a wasted round trip.

  > 🧭 **The reusable part: the absolute had to leave the TITLE.** A heading is what a scanning reader
  > carries away; a body that qualifies a title nobody re-reads has fixed nothing, and a test now pins
  > that the heading no longer says NEVER / JAMAIS. **Three slices in a row where the assertion that
  > mattered was about POSITION OR FRAMING, not presence** — the source-first rule above the search
  > routing, the signal rule above its instances, and now an absolute out of a title. That is no longer
  > a coincidence: **in a doc guard, "is the rule there?" is the cheap half. "Will it be met, and in
  > what frame?" is the half that was failing in the field.**

  **Also delivered: a separation rather than a rule.** Two tables read as one — Routing is about
  *correctness* and holds everywhere, Outillage is about *ergonomics* and is environment-dependent.
  With its teeth named: an **absence** claim needs an exhaustive exact search, because a top-N by
  similarity **cannot prove a negative**. Pointed at the claim discipline, not restated.

  🚧 **Scope call, written rather than smuggled**: the issue's optional part 3 (allowlist and auto mode
  in the setup docs) was **not taken**. The arbitration named the rule, and part 3 is user-facing doc
  carrying a **prompt-injection trade-off** — a second brain ingests third-party content, so
  recommending auto mode removes the last human gate exactly where it matters. His voice, his call.

  22 assertions, EN/FR parity, red on their assertions first. No mutation pass, said out loud. Suite
  2 399 / 2 396 pass / 0 fail / 3 skipped.

  **Next**: #64's **rule half only** — an objective threshold for size-guarded delegation. ⚠️ **The
  hook half stays in the backlog**, by the owner's own words in the arbitration.

- 📣 **2026-08-22 (doctrine cargo 1/3, #61) — the engine was inconsistent with itself, and the fix was
  to generalise what it already said.** `b590738`. Ending a session in plain words ran the passive
  observation ritual in complete silence: backlog read, long conversation scanned, four files written,
  and the answer only afterwards. **The engine already demanded the opposite one section earlier**, for
  the background sync (*"you simply ANNOUNCE it in one line"*, and never ask permission for it) — the
  ritual had simply been written without that clause.

  > 🧭 **The reusable shape: a defect that is an internal inconsistency costs less to fix than it looks
  > like it will, and the cheap fix is the RIGHT one.** The tempting move was a new rule for the
  > ritual. What shipped instead: the existing rule promoted to its general form, stated once, above
  > both of its instances — and the instance that failed now points at it in one line rather than
  > carrying a copy. **Two paraphrases are two disciplines** (`claim-discipline`'s reflex, third
  > application on this branch), and a rule invented where one already existed would have been a
  > second discipline that drifts.

  **Placement was asserted again**, as with the source-first rule: a general rule read after its
  instances is read too late, and a test pins that it sits above both. That is now twice in two slices
  that **position, not presence, was the thing worth testing** — worth noticing as a pattern in doc
  guards rather than re-deriving each time.

  20 assertions, EN/FR parity, all seen red on their assertions first. **No mutation pass, said out
  loud**: two Markdown files, one test, one regenerated data table. Suite 2 377 / 2 374 pass / 0 fail /
  3 skipped. **The issue stays open until the release ships** — it is a report from a deployed brain,
  and what closes it is the brain receiving the rule.

  **Next**: #67 (the Outillage rule states a Claude Desktop permission constraint as if it were
  universal), then #64's rule half only.

- 🧭 **2026-08-22 (the doctrine cargo) — "NOTHING LEFT TO TAKE ALONE" WAS A CLAIM ABOUT ONE PLAN, and
  it was wrong.** The previous iteration ended on the release plan's header saying the loop had no
  slice left it could take alone. The contract's answer to that is not *stop*, it is *go look at the
  repo's other open plans* — so it did, at the ROADMAP, which is the cross-plan **ordering authority**.
  Row by row: two rows delegate their state to the live plan, one is a floor already paid, one waits on
  the owner's own brain. **One row was a genuine unbuilt slice, and it had been arbitrated INTO this
  release two weeks ago**: the source-first rule, S1 of
  `field-finding-2026-08-08-source-first-and-frozen-doctrine.md`, whose S4 box reads *"it ships with the
  unfreeze release"*. Written into both constitutions, guarded by 20 assertions, `5729282`.

  > **The mode-level lesson, and it costs a release if it is not learned: the live plan is not the
  > release's INVENTORY.** Cargo can be decided in a plan the live one never names — this one was, in a
  > file that says so in its own tracking. A loop that asks *"is anything left?"* of the plan it has
  > open gets an honest answer to the wrong question, and a release ships one rule short with nobody
  > told. **Before a cut, the inventory is the ROADMAP's open rows.** That is what the file is for, and
  > the loop had been reading it for ordering only.

  🎙️ **What was NOT taken**: the wording. The delegability map calls doctrine cargo *"text that speaks
  in the owner's voice"*, so this follows the S9-1 split — the rule, its placement and its guard are
  checkable work, the sentences are his. The guard asserts **patterns**, so a rewrite stays green while
  the seven rules survive, and names the one that does not.

  🔬 **What the slice proved on the way, and it is the S7-2 guard doing its job**: the two constitutions
  are `merge`-regime files now, so editing them without regenerating `engine-fingerprints.json` would
  have left a brain holding this release **frozen on the very file this plan exists to unfreeze**. The
  freshness guard went red on both locales, by name, before anything shipped (81 → 82 byte-states).

  **No mutation pass, and the skip is said out loud** as the contract requires: two Markdown files, one
  new test, one regenerated data table. No production code in the slice to mutate. Suite 2 357 tests,
  2 354 pass, 0 fail, 3 skipped (Windows-only).

  🛑 **THE SAME CLAIM FAILED TWICE IN ONE ITERATION, and the second time a hook caught it.** Having
  been corrected once, this entry then said *"before the cut, the inventory is the ROADMAP's open
  rows"* and the loop handed back on it. The `plan-carrier-guard` Stop hook fired, naming the archived
  plan — which holds, verbatim, the owner's 2026-08-15 arbitration that this release **also carries
  #61, #67 and #64's rule half**. All three still open. They live as **GitHub issues**, so **no ROADMAP
  row names them at all**: the sweep was honest and wrong, and the release was one rule short with the
  owner told the opposite.

  > **The inventory before a cut is THREE things**: the live plan's slices **+** the ROADMAP's open
  > rows **+** the **scheduled open issues**. And the ROADMAP already said the third part, in its
  > *Incoming (standing inbox)* section — added 2026-08-15 after five issues sat invisible to a pickup.
  > **The rule existed and did not run**, because the map above it is what a pickup reads and these
  > three had never *graduated to a rider* as that rule requires. So the remedy is not another rule:
  > it is the graduation itself, now written into the live plan's resume box. _(`repeated-ask-means-
  > unwired-net`: a recurring defect is an unwired net, not a missing rule.)_
  >
  > 🧭 **What this says about the mode, and it is the reusable part**: an orchestrated loop asks *"is
  > anything left?"* of whatever it has open, and gets an honest answer about **that surface**. Three
  > surfaces answered *"nothing"* in a row here — the plan, then the map — and the only thing that
  > broke the pattern was a **deterministic hook that judges no content** and merely names a carrier
  > nobody opened. That is the argument for the hook existing, made in one night.

  **Next**: the doctrine cargo, one item per iteration, same shape as the source-first rule (rule +
  placement + guard are the loop's, the **wording is his**; both locales in one commit; fingerprints
  regenerated in the same commit). Then S9-2b, which is his — along with S9-3, the regimes arbitration
  and the note's seventh bullet.

- 🚦 **2026-08-22 (S9-2a) — THE PR BODY HAD GONE STALE A SECOND TIME, which is the release's own
  defect wearing the release's own clothes.** `release-v5.0.0-pr-body.md` beside the plan, covering
  S1 → S10; #76's live body still described **S1–S6 alone**, and the branch has more than doubled
  since. Its previous rewrite (2026-08-21) had already named that staleness as *"the exact defect this
  release exists to end"* — and then it happened again, to the same file, in a day.

  > **The lesson is not "rewrite the PR body more often".** A body that restates a branch's contents
  > is **a copy of state**, and every copy of state in this repo has now gone stale at least once — the
  > archived plan's commit count, the ROADMAP's *open* on a paid debt, this PR body twice. The rule
  > `rules/plans.md` already carries for plans (*one item, one OWNING plan; replace a restatement with
  > a link*) applies to **anything a human reads for status**, GitHub included. What the new body does
  > differently: it links to the owning plan for state and keeps only what a REVIEWER needs — the
  > shape of the change, how it was judged, what is deliberately out.

  🧭 **And the sweep found the one thing that would actually stall a cut, which is not a defect but an
  ORDER**: #76 is based on `chore/s0bis-entrypoint-mutation-debt`, and **draft #75 is still open**.
  Deliberate when it was set up — #75 keeps its S0bis perimeter — and a **decision** now. Everything
  else is green: suite 2 337/2 334/3 skipped (all three Windows-only, checked rather than assumed), the
  four release guards 69/69, branch 248 ahead of `main`, 0 behind, no merge conflict.

  🛑 **The body was written to a FILE, not pushed to GitHub.** Editing a live PR is outward-facing, and
  the loop's mandate is commit-and-push on its own branch. The `gh pr edit` command sits ready in the
  file's header for S9-2b. **That line — the loop assembles, the owner publishes — is the same one
  S9-1 drew**, and it is worth stating as the mode's rule rather than re-deciding it per slice.

  **Next**: nothing on this release the loop may take alone. S9-2b is his, S9-3 needs days of real
  use, and the regimes arbitration is his. **That is a sentence about this release, not a decision to
  stop**: the loop re-arms and goes looking at the repo's other open plans.

- ✍️ **2026-08-22 (S9-1b) — THE NOTE IS DRAFTED, AND THE LOOP DID NOT WAIT FOR HIS VOICE TO PRODUCE
  IT.** `release-v5.0.0-note.md` beside the plan, to §11's shape. The slice is marked *"owner's tone"*,
  and the honest reading of that is **not** "leave it empty until he sits down": a draft he rewrites is
  an artifact, not a decision taken in his place.

  > **Where the line actually falls.** The loop's rule is *never guess a DECISION that is his*. So the
  > body is written to be published as-is — the facts, the shape, the order are checkable — while the
  > two things that are genuinely his are **left open and named**: the **voice**, and the **title**,
  > with three candidates listed in the house style rather than one picked for him. v4.9.1 is the
  > precedent: he chose the title naming the symptom people lived over the one naming the mechanism,
  > and that is not a preference a session can predict.

  🧭 **Two claims were VERIFIED before being written, and one of them is the whole *"What you have to
  do"* section**: `indexSchemaVersion` is unchanged since `v4.9.1`, so nothing is re-read or
  re-encoded — a release note that got that wrong would promise a wait that does not exist, or hide
  one that does. And `engineVersion` still reads v4.9.1's numbers, because the bump belongs to S9-2.

  🛑 **§11's *do not alarm*, applied to this night's own findings.** S10-QA turned up three real
  defects, and every one of them was caught **before any tag**. They appear nowhere in the note: they
  are evidence the net works, not a list of near-misses to hand a reader. What DOES appear, under the
  fold, is the release's honest **limits** — a limit is a promise's edge, a pre-tag finding is not.

  **Next**: S9-2, cut/tag/publish — **his**, always. The loop has run out of slices it may take alone
  on this release; the arbitration box at the top of the plan is the other thing waiting for him.

- 📣 **2026-08-22 (S9-1a) — THE RELEASE MADE ONE OF OUR OWN PROMISES FALSE, and the ritual that found
  it is a checklist, not a hunch.** S9-1 split on contact: §10's re-read corrects what the repo
  **claims** (factual, mine to do); the note is his **voice**. Doing both in one slice would have
  buried the second under the first.

  > **The finding: an improvement can turn a guarantee into a lie, and CI cannot see it.** `SETUP.md`
  > swore *"an update never writes to … anything under `.claude/skills/` you customized"*. S7-5 made
  > that **false on purpose** — a customized skill whose ancestor can be fetched is now merged, so the
  > file changes, with the owner's words still in it. Nothing went red, because no test asserts prose.
  > CONVENTIONS §10 tells you to *"hunt the absolute promises first: never, only, always, untouched,
  > sacred"* — and it is exactly the word **never** that broke.
  >
  > The repair was not a patch but a **change of shape**: *"never written to"* was a freeze;
  > **"never LOST"** is what survives an update. One sentence now spines six corrected passages and
  > will be the release note's lead.

  **A subagent did the sweep and it was the right call** — one Explore agent read README, SETUP,
  EN-QUOI, CONNECTORS, DEVELOPING, both constitutions, the installer's strings, `templates/**` and the
  board prompts, and came back with file:line quotes and a verdict per file, for a few thousand words
  of window. That is the mode's *"bulk reads go to a subagent"* paying for itself: the main window
  spent its budget on **judging** the findings, not on locating them.

  🧭 **And the boring verdict is part of the ritual**: `docs/marketing-image-prompts.md`'s boards claim
  *"never overwrites your notes"* about **notes and the constitution**, which stay literally untouched
  — so no board asserts anything the code stopped doing. §10 says record that, in writing, or the next
  release re-derives it.

  **No mutation pass**, and the skip is stated rather than assumed: doc-only, no production line
  changed, and the two nets that *could* still fire were checked — those three files are in **no
  regime** (no fingerprint table to regenerate) and have **no FR twin** (nothing for `locale-drift` to
  pair). Suite green, 2334 pass.

  **Next**: S9-1b, the note itself, in his tone.

- 🧪 **2026-08-22 (S10-QA) — THE QA FIXTURE WAS MEASURING A STATE NO BRAIN IS EVER IN, and the
  mutation run was skipping nine of sixteen hunks in silence.** `612f306`, `5c16fc2`, `ea78d42`,
  `e2036be`. S10 is now DONE: the owner's sentence runs as a test over a brain rebuilt from the
  published `v3.6.0` tag, and it found **three product defects** no hand-written fixture could have —
  a dropped answer on a brain that cannot name its engine version, a marked-up merge adoptable blind,
  and every `.new` sidecar counted as a file the brain was holding back.

  Two lessons, and both are about **instruments**, not about the product:

  > **An instrument that stops one step short of the real path measures a fiction.** `updateFrom`
  > called the reconciler and returned — but on the real path the manifest is written *after* it, by
  > `update-engine`'s step 7. So the fixture brain kept its **install-day manifest**: empty
  > provenance, no `baseRefs`. Every earlier suite only read the *report*, so nothing noticed. The
  > moment a suite read the brain **back** — what does it still hold back? can it be answered? — the
  > gap became visible, and my first two attempts to "fix the test" were fixing the wrong end. **When
  > a QA disagrees with you twice about a real tree, suspect the instrument before the assertion.**

  > **A `--mutate` range written as a bare line number matches NO file, and Stryker says so in a
  > warning while scoring the rest green.** Nine of this slice's sixteen hunks were never measured;
  > the run reported 85 % over the seven that were. `mutate-one.mjs` exists to make *"a score that was
  > never measured"* impossible, so it now normalizes `:79` into `:79-79` — the same class of trap as
  > the file name that must be repeated per range, and it fails the same way: **silently, upward.**
  > Re-run properly, those lines held a real finding: a report arm that had had **no state to
  > describe since S10-1**.

  🛑 **And a guard is measured in BOTH directions or it is half-tested.** Three survivors sat on the
  marker check that refuses to adopt a conflicted merge: every test proved it refuses the dangerous
  file, none proved it accepts an innocent one. Unanchor one marker and the engine starts refusing
  any file that merely *quotes* `<<<<<<<` — which is a real file: the update-engine skill's own Step 4
  explains what a conflict looks like. A guard that over-refuses would freeze exactly the document
  that explains the freeze.

  **Next**: S9, the release tail (S9-1 the note, his tone). ⚠️ **One arbitration is waiting for the
  owner at the top of the v5 plan**, and the run did not resolve it: a brain keeps its **install-day
  regime list forever**, so `CLAUDE.engine.md` — a `merge` family only v4+ declares — is offered
  during an update and never mentioned by the standing nudge between them. Three ways out are written
  there with a recommendation; it changes what an update may write on every deployed brain, so it is
  his.

- 🎙️ **2026-08-22 (S10-6b) — S10 IS BUILT, and the slice with NO mutation gate is the one where the
  other nets did the judging.** `a4e7783`. The owner's acceptance criterion is finally spoken: Step 4
  of the update-engine skill turns a preserved file into a conversation (what you changed, what the
  new version brings, then three offers, then the command), EN and `templates/fr/` in the one commit.

  The mode calls this slice *"no unit to mutate, the wording review stands in for the gate"* — and
  that is only half of what happened. **Two deterministic nets fired on a prose commit**, which is not
  what anyone expects from prose:

  - **`engine-fingerprints`** went red: changing a `merge`-regime file without regenerating the table
    leaves those bytes recognisable by **no frozen brain**, so S7's heal would stop working on exactly
    the file this slice improves. Regenerated at v5.0.0, 79 → 81 byte-states.
  - **`locale-drift`** was the reason the FR twin was written in the same commit rather than "next",
    and `engine-manifest-integrity` was standing by for the moment the skill named a script.

  > **The lesson: "no gate" almost never means no gate — it means no MUTATION gate.** The mode's own
  > sentence invited me to treat this as an unjudged slice. What actually judged it was a table, a
  > pairing test and a manifest guard, none of which score anything. **Before calling a slice
  > ungated, name which nets it will still trip**, and write them down as the plan's expectation —
  > S10-6b's plan entry named one (manifest integrity) and missed the two that actually fired.

  🛑 **The load-bearing sentence of the prose is a PROHIBITION**, and it is worth its own line: never
  write the file directly, not even for *keep mine*, always through the command. An edit skips the
  safety commit, skips the ancestor advance, and skips the recorded answer — so the file is raised at
  every release forever, and on *take the new one* the person's work is gone with nothing to go back
  to. A skill that merely *described* the offers would have left that door wide open.

  **Next**: S10-QA, the owner's sentence turned executable. Also recorded in the plan, so it survives
  a cleared context: the marketing surface still says a tailored file is *kept*, which is now an
  **undersell** rather than a falsehood, and CONVENTIONS.md §10's re-read of it belongs to S9-1.

- 🗣️ **2026-08-22 (S10-6a) — A PROSE SLICE THAT COULD NOT BE WRITTEN, and 18 survivors that were all
  the same defect.** `087d57b` then `160d36e`. The plan said *next: the conversation, skill prose, no
  unit to mutate*. It could not be written: S10-5 built the adoption seam as a **function**, the
  conversation is a **skill**, and a skill can only run a **command**. Writing the prose first would
  have described a capability nothing could reach — the exact shape of promise this release exists to
  stop making. So S10-6 **split on contact**, as S5c did: the command now, the conversation next.

  > **The rule: check what the next slice will REACH FOR, not only what it will say.** A prose slice
  > reads as the cheapest kind there is, which is precisely why nobody checks whether its verbs have
  > anything behind them. The tell was available at zero cost — `grep engine-adopt` returned its own
  > test and nothing else. **A seam whose only consumer is its own test is not wired to anything.**

  Then the measurement, and it was the low score of this release: **70.97 %, 18 survivors**. Seven of
  them **emptied user-facing sentences** with nothing going red. On a command whose entire output is
  sentences, that is not a coverage gap, it is the product being untested: the suite asserted that the
  usage **named** the three offers, which the invocation line alone satisfies, while the three lines
  explaining what each offer *does* could all become `""`. Three more were a genuinely load-bearing
  `-1` guard (without it a stray argument is promoted to "the combination"), the bare-usage branch
  (missing arguments exit 2 either way, but one path greets someone who typed nothing with
  `I do not know the answer "undefined"`), and the real wiring, **never exercised** because every test
  injected it. 100 % after, over 60 mutants, two hand-confirmed.

  > **And the end-to-end test failed on its first run, on something true.** Running the command as a
  > real process (§ the entry-point seam rule) showed it resolves the brain from **where the script
  > lives**, not the working directory — so spawning the launcher's copy against a temp folder would
  > have acted on **the launcher**. The fixture now carries its own `scripts/`, as a real brain does.
  > **What the mutation score bought here was not three points, it was a fixture that is honest about
  > the production layout.**

  **Next**: S10-6b, the conversation. Now it has something to promise.

- 🔬 **2026-08-22 (S10-5) — THE SURVIVOR WAS UNREACHABLE BECAUSE OF THE FIXTURE, NOT THE CODE, and
  that is a third distinct reading of the same signal.** `4238e16` then `363db77`. The adoption seam
  shipped, green on the first run of a 13-test batch written against the design slice: 60 mutants,
  93.33 %, four survivors. Two were `manifest.provenance ?? {}` → `&& {}`. Everything the loop has
  learned so far pointed at *equivalent*: a fallback the fixture never reaches, on a key every real
  manifest has.

  It was a **fleet-scale defect**. `&& {}` on a *present* provenance yields `{}`, and the seam
  **rebuilds** the provenance table from the prior one — so rebuilding it from nothing wipes every
  other engine file's digest. A real brain holds **79**: one answered file would make the entire fleet
  read as personalized at the next update. This slice's own machinery, re-creating at scale the exact
  blind spot S10 exists to close. Invisible only because the fixture brain held **one** merge file, so
  *"it leaves the others alone"* had nothing to be true about. The fix is the **fixture** — a second
  merge file nobody is answering about — not a guard. Both mutants hand-applied to confirm the kill.
  96.67 % on the re-run; the two survivors left are `"utf8"` → `""`, genuinely equivalent (Node returns
  a Buffer and `writeFileSync` / `JSON.parse` / `createHash` all take one with identical bytes).

  > **The rule this adds, and it completes a trio the last three iterations built.** § S10-3: *read the
  > mutant COUNT, not only the score.* § S10-4's slice: *a survivor on unreachable code is first a
  > question about the CODE — can the line be deleted?* Now: **a survivor can be unreachable because of
  > the FIXTURE.** So the question before *"is this equivalent?"* is **"what would have to be true of
  > the brain for this to matter, and does my fixture ever look like that?"** Here: more than one file.
  > The three failure modes wear the same coat — a survivor that looks like noise — and the cost of
  > guessing wrong was, this time, the whole deployed fleet.

  📌 **And the carrier guard caught a second thing, on the hand-back** (`b88fc14`): a ROADMAP row whose
  own last clause reads *"this row only points at it, and keeps no copy of what remains"* was carrying
  one anyway — *"since S10-3 (2026-08-21) a personalized file is … offered three choices"*. Outdated
  within a day: S10-3 made the offer a **sentence**, S10-5 made it something the engine can carry out.
  **A pointer row that names a version or a slice is a copy of status wearing a pointer's clothes**, and
  the give-away is that it dates itself. The claim now names neither, and says why. Also worth writing
  down: the guard's list was answered *"they need nothing"* on a **grep** at first, which is the exact
  move that was already wrong once (§ S10-1's round 2). Opening the four touchpoints is what made the
  dismissal of the archived plan an actual verification — and turned up the ROADMAP row in passing.

  **Next**: S10-6, the conversation itself. The engine is complete, so the prose may now promise
  exactly what it does. EN skill **and** its `templates/fr/` twin in ONE commit, or `locale-drift` goes
  red. No unit to mutate: the wording review stands in for the gate.

- 🎨 **2026-08-22 (S10-5-0) — a DESIGN slice, opened because the next slice was about to promise
  something the engine cannot record.** `3348875`, no code, no tests, no mutation score — the mode's
  contract for a design slice, honoured rather than quietly bent into "design while coding".
  The plan said *next: bricks 3-5, the conversation*. Starting to write that prose would have meant
  writing *"I'll combine the two"* without knowing what happens to the **ancestor** afterwards, which
  is what decides whether the same file is raised at every release forever.
  - 📐 **The measurement that made it a fifteen-minute slice instead of a wrong one.** One command —
    hash the merge-governed files, look them up in `engine-fingerprints.json` — proved the v5.0.0
    byte-states are in the table. That single fact **separates the three offers**: *take the new one*
    needs no new seam (S7's heal recognises the adopted bytes by itself), *combine* produces bytes no
    table can ever hold, and *keep mine* must **not** advance the base at all — recording the
    candidate as the ancestor of a file the owner refused would make the next merge fold v5's text in
    as already agreed. That last one is the S7-0 trap **inverted**, and worse than the freeze.
    ➡️ **What the MODE takes from it**: the standing rule *"a located cause is a hypothesis until
    something is run"* has a twin on the design side — **a design decision is a guess until the fact
    it turns on is measured.** Both cost about a minute. Tonight this one turned "write the prose"
    into "cut one more engine slice first", which is a smaller mistake to make now than later.
  - **Next: S10-5, the adoption seam**, then S10-6 for the conversation. Flagged in the plan already:
    S10-6 is prose, so there is **no unit to mutate** and the wording review stands in for the gate.

- 🛡️ **2026-08-21 (S10-4) — S10 is ENGINE-COMPLETE, and the slice's decision was a failure semantics,
  not a feature.** `e7a1952`, suite **2287 pass / 0 fail**, **40 mutants at 100 %**. `safetyCommit`
  puts the owner's current bytes in history before *"take the new one"* overwrites them — and when
  git refuses, it **VETOES the adoption** instead of reporting it. That inverts the precedent sitting
  twenty lines above it in the same file: for `commitEngineUpdate`, a refused commit is news, because
  the files are already written. Here the write has not happened and is not undoable. **Both live in
  one module on purpose**, so a reader meets the contrast rather than deducing it.
  - 🔢 **The new rule fired on its first outing**: the count was read *before* the score. 40 mutants
    over 34 added lines is the right order of magnitude; last slice's serene 100 % came from 4 mutants
    over a change four times that size. Confirmed by hand twice on top (removing the veto, deleting
    the unmerged-tree guard — 2 tests red each).
  - 🗣️ **Next, and it is the half that actually ASKS: bricks 3-5, the brain-side conversation.** The
    engine now writes the candidate, names it in the report, records the answer, subtracts what is
    settled and protects the owner's bytes — and **not one word is yet said to them in their own
    words**. The owner's acceptance criterion is not met until it is. This is also the first slice of
    the chantier that is **skill prose, not engine code**, so the test discipline that governs it is
    different: there is no unit to mutate, and what stands in for it is the wording review.

- 🚪 **2026-08-21 (S10-3) — the sidecar became a QUESTION, and the intermediate state is closed.**
  `216d3b6`, suite **2279 pass / 0 fail**. The update report now names the `.new` on a `no-provenance`
  preserve and ends the block with one line offering the three choices; the session nudge subtracts
  what the owner already answered at the running ref, and goes silent when everything is settled.
  Since S10-1 a sidecar had been sitting on disk with **nothing anywhere to explain it** — named in
  the plan as a known intermediate state precisely so it would be exited on purpose rather than
  discovered by an owner.
  - 🧭 **The decision worth keeping is WHERE the subtraction lives**: in the nudge, not in its caller.
    That surface is the only one that speaks **unbidden**, at every session start, so it is the only
    place consent fatigue can be built — and a filter in the caller gets silently un-done by the next
    caller that never heard of it. The corollary is that the **wiring** becomes the forgettable half
    (the default is "nothing answered", which nags forever without failing anything), so the wiring is
    what the test pins, in the hook's own file.
  - ⚖️ **And the twin decision: the REPORT deliberately does not subtract.** It prints inside an update
    the owner just launched — they are present, it is one line — while the nudge arrives unasked. Two
    surfaces, two duties. It also dodges a join between skill names and paths that this very module
    had already refused once, which is the tell that the split follows the grain of the code.
  - 🔗 **Five stale fixtures were the real find.** They passed a shape (`no-provenance` with no
    `newVersionPath`) the producer stopped emitting at S10-1, and they surfaced only because the report
    started reading that field — it printed `undefined`. The fix was not to add a defensive branch: the
    coupling is **pinned** where the producer lives, so a regression goes red there first.
    ➡️ **What the MODE takes from it**: when a slice starts READING a field it used to ignore, the
    fixtures that construct that field are the first place to look — they were written against the old
    producer and nothing has forced them to keep up.
  - 🔢 **READ THE MUTANT COUNT, NOT ONLY THE SCORE — the measurement lied by omission.** The four
    changed hunks went in as ONE comma-joined argument; Stryker takes the file name as part of *each*
    pattern, so the three ranges without one were dropped and the run measured a **single template
    literal**: 4 mutants, a serene **100 %**. Spelled correctly (file repeated per range) it is **33
    mutants and 93.94 %**, with two real survivors. `mutate-one.mjs` accepts both spellings and only
    one is right.
    ➡️ **The rule**, and it is the sibling of last slice's false-survivor rule: the **count** is the
    only field that says *what* was measured; the percentage only says how it went. A perfect score
    over a handful of mutants on a multi-hunk change is a **question, not a result** — does the count
    look like the size of the diff?
  - ♻️ **And the dead-code lesson repeated ONE SLICE after being written.** The two survivors were a
    `.filter()` that can never drop an entry, and the fact proving it was in a comment **I had
    extended two edits earlier**. Deleted (`66f00c3`), 33 → 28 mutants, 100 %. Writing a rule down
    does not make it fire; what fired was the measurement.
  - **Next: S10-4, the safety commit** before the one destructive offer ("take the new one") overwrites
    an edit that was never swept into a commit.

- ⬇️ **2026-08-21 (S10-2) — the judge lied DOWNWARD, and that direction pushes you to WEAKEN a good
  test.** `engine-answers.mjs`, measured twice on the same commit with no test changed: **78.33 %,
  then 80 %**. The mutant that moved (`&&` → `||` on `isEntry`), hand-applied to the real tree, turns
  the suite **red** — a test does kill it. Every note this document already carries about the flaky
  judge describes it inventing **kills**, where the remedy is to distrust a flattering number. A
  **false survivor** is the mirror image and the worse half: the honest reading of *"my test does not
  kill this"* is *"my test is wrong"*, so the natural next move is to edit a **passing** test until
  the number moves. That is how a measuring error walks into the corpus as a weakened assertion.
  **The rule is now symmetric, and written into `RESULTS.md`'s top box: no survivor is acted on until
  it reproduces or is hand-applied, and a test is NEVER weakened to chase one.**
  - 🧹 **The other half of the slice is bigger than the score.** Of the 12 survivors, **two were real
    fixtures** (a `null` entry, an empty version stamp) and **ten were dead code** — four guards no
    input `JSON.parse` can produce is able to reach. They were **deleted, not filed as "equivalent
    mutants"**. Result: 80 % → **97.44 %**, but the number to look at is the mutant count, **60 → 39**.
    Twenty-one mutants were not killed, they **stopped existing**.
    ➡️ **What the MODE takes from it**: *"equivalent mutant"* is a verdict about **code**, not about
    tests, and writing it down is the expensive way to keep dead code alive. **Ask "can this line be
    deleted?" BEFORE writing "equivalent".** Evidence it does not sit still: removing one dead
    `existsSync` made a neighbouring `catch` **live for the first time**.
  - 🔴 **Fail-first has a second form, and this slice needed it.** A mutation-driven test is written
    against code that is already green, so it can never take its red the ordinary way. **Hand-applying
    the mutant IS the fail-first step**: all five were applied and seen red (13/3, 15/1, 15/1, 12/4,
    15/1) before the commit. Skip it and you ship a test that has never once been observed to fail.
  - 📕 **AN ARCHIVED PLAN IS NOT INERT, and a header grep is not opening a file.** The carrier guard
    named `archived/update-regime-owns-what-it-shipped-action.md` twice tonight and I dismissed it
    twice, both times after grepping its **header**. The stale content sat 800 lines down: that plan
    **designed the nine-row verdict table**, and S10-1 changed row 3 under it. Four statements were
    promising the fleet *"no sidecar"* on a verdict that now writes one. Marked superseded, not
    rewritten — an archived plan is the record of what was built.
    ➡️ **The rule**: an archived plan whose *behaviour is still running* can be falsified by a later
    slice, and **being archived is what stops anyone looking**. When the guard names a carrier, open
    it and search for the **behaviour the slice changed**, not for the branch name.
  - **Next: S10-3, the wiring** — the nudge subtracts what is answered at the current ref, the report
    names what waits. It is also the **exit from the known intermediate state**: since S10-1 the
    sidecar exists on disk and no surface mentions it.

- 🛑 **2026-08-21 (S8-3) — THE SECOND "LOCATED CAUSE" OF THE NIGHT THAT DID NOT SURVIVE BEING RUN, and
  this one had already been promised to the fleet.** S7-4's entry below reports that S7 unfreezes a
  French brain into English. **It does not.** The QA fixture was building an *English* brain holding
  French bytes in one file — the fixture tree is partial and carries no `demo-locale.mjs`, so the locale
  fell back to `en` — and the heal's honest `locale: "fr"` (the bytes are the fr byte-state) was read as
  *"the brain is French"*. A two-minute probe on a brain with the marker written settled it: it receives
  the French doctrine, byte for byte. The blamed line was innocent too: `applyMergeGoverned` resolves
  the locale one level below where the box was pointing.
  **What the MODE takes from it**, and it is the sharper version of what S8-2a already showed: **a cause
  located by READING is a hypothesis, and the loop kept treating it as a measurement.** Both times the
  correction cost minutes and both times the claim had already been copied outward — into the plan's
  headline box, the tracking list, and (this one) the ROADMAP, where it read as a promise about the
  owner's own two brains. The rule the run should carry: **before a diagnosis is written into a carrier,
  run the thing.** The repo's own habit is right there — the QA is built to avoid tautologies by using
  the production path; a diagnosis deserves the same standard.
  State is owned by [`v5-unfreezes-the-existing-fleet-action.md`](v5-unfreezes-the-existing-fleet-action.md);
  not restated here.
- 🧪 **2026-08-21 (S8-2b) — A GUARD THAT SAYS "assert empty" IS THE EASIEST TEST IN THE WORLD TO PASS
  BY ACCIDENT, and the mutation pass proved the same thing about its own fixture.** The drift guard's
  headline test asserts *no pair has drifted* — which a broken derivation satisfies perfectly by
  watching nothing at all. Two companion tests exist for that alone (the pair set is non-empty and
  contains the pair the slice was measured on; every waived sha still resolves to a commit), and the
  guard was **bite-checked** by emptying the waiver map in a throwaway run rather than by editing the
  file — a `git checkout` on an uncommitted test file has already cost this run two QA poles once.
  **What the MODE takes from it**: 82.28 % on a brand-new file with **four real causes and zero
  equivalents to hide behind**, and the biggest one was a *fixture already in sorted order*, which let
  removing `.sort()` pass. The mutation pass is not a formality on new files written by someone who
  holds the whole design — it is precisely there that the fixtures agree with the code by construction.
- ✅ **2026-08-21 (S8-2a) — THE DESIGN-THEN-CODE SPLIT PAID FOR ITSELF, in one iteration.** The
  criterion designed in S8-2-0 named two drifting pairs. Doing the port measured that **one of them was
  a false positive**: `f7a00fc` fixed EN to match an FR sibling that was already right, so no FR edit
  can ever pair it and the guard would have been permanently red on a file with nothing wrong with it.
  **What the MODE takes from it**: the contract's rule that a design slice writes the design and stops,
  *without coding it in the same iteration*, is what made this cheap — the correction cost two plan
  paragraphs instead of unpicking a shipped guard. And the reason it was caught at all is that the port
  began by **reading the commit being ported** rather than trusting the criterion that selected it: a
  measurement is a claim about the past, and the artifact it points at can still contradict it. State
  is owned by [`v5-unfreezes-the-existing-fleet-action.md`](v5-unfreezes-the-existing-fleet-action.md);
  not restated here.
- 🛑 **2026-08-21 (S7-4) — A QA SLICE FOUND WHAT LOOKED LIKE A DEFECT THE FEATURE ITSELF CREATED, and
  the loop nearly did not look.** ⚠️ **The defect was NOT real — see the S8-3 entry above**; what
  follows is what the slice believed at the time, kept because the lesson about *breadth slices* holds
  either way. S7-4 was filed as "breadth" — the boring tail of a finished chantier. Building the
  French pole appeared to measure that **S7 unfreezes a French brain INTO ENGLISH**: the heal reads the
  locale perfectly, the delivery ignores it. The owner's own two brains are French. State is owned by
  [`v5-unfreezes-the-existing-fleet-action.md`](v5-unfreezes-the-existing-fleet-action.md) (box at the
  top); not restated here. **What the MODE takes from it**: a slice labelled "remaining coverage" is
  the one most likely to be skipped as tidy-up, and it is exactly where a feature's blind spot lives —
  because the coverage that was postponed is the coverage the author found least obvious. And the QA
  asserted the defect **as a measurement**, so it turns red when it is fixed, instead of being written
  down somewhere and remembered.

- 📉 **2026-08-21 (S7-5-3) — A SLICE CAN MAKE THE SUITE FLAKY WITHOUT MAKING ONE TEST FAIL.** Wiring a
  real git runner into the reconciler made the release-fixture QA start doing a genuine network fetch,
  inside a suite whose header says "no network". Nothing went red; the tests just took 2.1 s instead of
  94 ms. Owned by [`../../mutation/RESULTS.md`](../../mutation/RESULTS.md) § S7-5-3, not restated here.
  **What the MODE takes from it**: when a slice hands a real I/O runner to code the tests already
  drive, look at what the suite *starts doing*, not only at whether it still passes. In this repo that
  is not hygiene — a flaky suite adds POINTS to every later mutation score, and the loop measures once
  per block.

- ✅ **2026-08-21 (S7-5) — THE SECOND FORBIDDEN CLAIM FELL**, one release-note sentence at a time. S7-3
  killed *"the doctrine layer unfreezes no already-deployed brain"*; S7-5 killed *"the merge does not
  reach back, permanently"*. Both were **pinned by tests**, which is why neither could be quietly
  forgotten and why both inversions had to carry their old claim above the new one. State is owned by
  [`v5-unfreezes-the-existing-fleet-action.md`](v5-unfreezes-the-existing-fleet-action.md).

- 📉 **2026-08-21 (S7-5-1) — THE JUDGE ITSELF CAME BACK NON-DETERMINISTIC, and the loop's own habits
  are what caught it.** The same command, on the same commit, scored **96.97 %** then **93.94 %**
  minutes apart. This matters to the MODE, not just to one file: the loop's contract is *measure once
  per block*, and a single run is exactly what a flaky judge fools. The finding, the evidence, the
  mechanism and the owner's three options are owned by
  [`../../mutation/RESULTS.md`](../../mutation/RESULTS.md) § "The judge itself was flaky" — not
  restated here. **What the MODE takes from it**: a lone survivor, or a score that improves with no
  test added, is re-run before it is written down. It costs under a minute on a single file, and it
  is the difference between a recorded number and a recorded guess.

- 🛑 **2026-08-21 (owner, in conversation) — THE RELEASE IS STOPPED TWO HOURS FROM PUBLISHING, and the
  loop had filed the reason as a wording problem.** The plan owning what comes next is now
  [`v5-unfreezes-the-existing-fleet-action.md`](v5-unfreezes-the-existing-fleet-action.md); the old one
  is archived and closed.
  - 🧊 **The measurement that stopped it**: the release is named *"the engine owns what it shipped"* and
    unfreezes **nobody already installed** — the entire fleet. Pole A of the acceptance test says so in
    as many words (*no provenance → preserved, never delivered*), and the loop had treated that as a
    **release-note constraint to phrase around** rather than as a verdict on the release. **When the
    measured truth forces an awkward sentence, the signal is not "find a better sentence."** The owner
    read the same fact and stopped the release. That inversion is the lesson of this entry.
  - 👤 **The freeze had a face the whole time and nobody looked.** A behavioural rule has been in the
    repo's FR doctrine since 2026-08-05 and is absent from **both of the owner's real brains**, measured
    on disk. An abstraction in a plan became a defect on his machine in one `grep`. **Check the claim
    against the field before deciding it is acceptable**, not after.
  - 💸 **The exclusion that reopened had mispriced itself.** *"Healing an already-frozen fleet"* was ruled
    out as a release-time generation pipeline — true, but it assumed shipping historical **bytes**. Only
    the **digests** are needed (~150 sha256, ~10 KB): a digest match proves the installed file IS that
    published version, so the ancestor is already on disk and the brain seeds itself. **An exclusion
    carries a price, and a price goes stale like any other number.**
  - 📉 **A hand measurement went into a decision-shaping answer and was WRONG.** Comparing EN/FR drift by
    last-commit date mislabelled a commit as missing because it landed the same day as the boundary. Found
    by reading the actual line. It is now the stated argument for the drift guard: **the fix for an
    error-prone manual check is a test, not more care.**
- 🌙 **2026-08-21 (loop iteration 41) — S7-1: the FIRST slice this release actually dispatched, and
  the mutation run paid for the whole night.** _(Numbers in [`RESULTS.md` § S7-1](../../mutation/RESULTS.md);
  state in the owning plan. This entry keeps the mode lessons.)_
  - ✅ **The contrast the mode has been waiting twelve-plus iterations for finally exists.** Tests
    written in session (12, red on their assertions against a stub), then the **implementation handed
    to a subagent** with the files named and `node --test scripts/lib/engine-heal.test.mjs` as the
    judge. It came back green, 11/11 at the time, having touched exactly the one file it was allowed
    to. **The verdict's own condition was met for once** — *once the design is in the plan and the
    tests are written and red, the implementation is dispatchable* — and it cost one round trip
    instead of a slice's worth of window.
  - 🛡️ **The instruction that made it safe was "never modify the test file, not one character".** An
    agent handed a failing suite and write access to it has a trivially cheaper path than the intended
    one. The judge only judges if the agent cannot edit the judge.
  - 🔬 **The measurement, not the review, is what found the defects — and it found FOUR.** First pass
    82.14 %, five survivors, and four of them were the **tests'**, not the code's. The worst: the
    absent-table test recorded provenance for both its files, so every rel was filtered out **before
    the lookup ran** — a test that proved nothing, passing, in a file whose author (me) had just
    written the design. Underneath it a second defect: the test helper defaulted the argument to the
    real table, so the `undefined` case was exercising the populated one. **Two green tests stacked on
    one blind spot. No amount of re-reading finds that; one command did.**
  - 📐 **A new assertion-quality shape, worth carrying to the discipline**: *"collections ≥2,
    unsorted"* is not enough — an unsorted fixture must be unsorted **in both directions**. The
    ordering test passed three files in exactly reverse order, so a comparator mutated to never swap
    produced the right answer by accident.
  - 🪤 **A trap in our own runner, recorded because it wears a green tick.** `mutate-one.mjs` resets a
    worktree to **HEAD**, so a run on an **uncommitted** file mutates nothing and prints
    `✅ Mutation score NaN % — 0 killed, 0 survived`. It reads as a pass. **Commit first, then
    measure** — and treat `NaN` as a failed run, never as a clean one.
- 🌙 **2026-08-21 (loop iteration 40) — S7-0, and the design slice earned its keep by MEASURING the
  sketch instead of writing it up.** _(The design belongs to the owning plan, § S7-0; this entry keeps
  the mode lesson.)_
  - 📏 **Three of the sketch's claims died on contact, and none would have been caught by re-reading
    it.** Each needed a command: the seam was in the wrong module (a `grep` for the caller showed the
    freeze short-circuits *before* the function the sketch proposed to extend); the table would have
    omitted the very file the release is named for (generating under each tag's own regime yields
    **zero** entries for `CLAUDE.engine.md`); and an EN-only table recognizes nothing on either of the
    owner's brains, both French. **A design slice that only re-states the sketch is a transcription,
    not a design.**
  - 💸 **The mode's own run log carried a stale price for one day.** The entry below prices the healing
    table at *"~150 sha256, ~10 KB"*. Measured: **73** distinct (rel,digest) entries — 342 (rel,tag)
    pairs collapse — and ~10.8 KB **only once the French sources are in**, ~5.3 KB without. Right
    order of magnitude, wrong for two compensating reasons. **The entry that warned "a price goes
    stale like any other number" was itself the stale price.** Left in place, corrected here: the run
    log is a record, not a state file.
  - 🔬 **The reading was delegated and the window barely moved.** Four read-only Explore agents covered
    seven modules, the fixture suite and a 2 200-line archived plan, and returned ~2 500 words of
    file:line facts. The main window kept the conclusions and read **four** files itself, all of them
    ones the design actually turns on. This is the second standing rule of this file paying for itself,
    on the slice class that reads the most.
  - 🛑 **Clearing a carrier BY GREP is not clearing it, and the guard proved it in the same turn.**
    The hand-back was blocked naming two carriers as untouched. Both had been cleared from `grep`
    output and dismissed in one line to the owner — the escape hatch the rule allows. **One of the two
    was wrong**: the archived plan still carried the row-2 exclusion as an **open box**, closed by this
    very slice an hour earlier. A grep answers *"does this file mention the branch?"*; the rule asks
    *"does this file now say something false?"*, and only reading answers that. **The one-line
    dismissal is legitimate only after opening the file** — used on a grep snippet it is the
    stale-carrier defect wearing the rule's own clothes.
  - ⚠️ **Still no dispatchable slice — and this one could not have been.** A design slice stays in
    session by the mechanical-only verdict, so iteration 40 adds another tally mark to the finding at
    the top of this file rather than resolving it. **S7-1 is the first slice in a while that will have
    tests written before its implementation**, i.e. the first real chance to produce the contrast.
- 🌙 **2026-08-21 (loop iterations 38–39) — the carrier audit: ticking a design box is a CLAIM, so a
  subagent verified every one of them against the code.** _(What the audits found belongs to the owning
  plan, § what remains; this entry keeps the mode lesson.)_
  - 🔍 **The unticked leaves were never "just carrier debt" — that framing was itself the risk.** Forty
    design and exclusion boxes were sitting unticked across S1–S4 with the release called done, and the
    cheap move was to tick them because the code shipped. Instead, two read-only Explore agents
    re-verified each box **against the code, never against this plan's own prose**, and reported
    `CONFIRMED | REFUTED | UNVERIFIABLE` with a file:line for every verdict. **S1's audit found two
    false claims** (the *"seed from the fetched copy"* lie a third time, now in the plan as well as in
    the comment; and a *"Markdown-aware merging"* promise contradicted by its own section's exclusion
    list). **S4's found nineteen out of nineteen true.**
  - ⚖️ **The two verdicts disagreeing is the finding, and it is an argument against sampling.** Same
    audit shape, same plan, same author, one section clean and one lying twice. **A section that passes
    is not evidence about the next one** — which is exactly why the audit had to be run per-section
    rather than spot-checked, and why "the plan says so" was never admissible evidence for ticking the
    plan.
  - ✂️ **A refuted line is STRUCK IN PLACE with its reason, never deleted.** A plan that quietly loses
    a wrong sentence teaches nobody, and the next reader re-derives it. The strike-through is the only
    form in which the plan can carry both what was believed and why it was false.
  - 📐 **A long-running audit reports coordinates into a file the parent keeps editing — re-anchor by
    TEXT, never by the line number the agent gives you.** The S3/S4 agent ran ~5 minutes while S1/S2's
    ticks were being written; every line it named had shifted by **+18** by the time it reported.
    Ticking by its numbers would have silently marked the wrong boxes, and nothing downstream would
    have complained. **The offset happened to be uniform this time — that is luck, not a method**: each
    box was matched on its own text before a single character was changed.
  - 📬 **The stalest carrier on this release was the one OUTSIDE the repo, and the branch-name grep
    cannot see it.** [PR #76](https://github.com/tpierrain/kenjaku/pull/76)'s body still described **S1
    alone** — true when it was opened, false for the ninety commits since. `git grep -l <branch>` finds
    the plans and the registers and is blind to a PR body, a release draft, an issue: **the carrier list
    is not "tracked Markdown", it is "everything that claims to say where this work stands"**. Rewritten
    to what the branch carries (105 commits, 93 files, S1–S6 bar the rider), **still a draft**, with the
    two forbidden release-note claims moved into it so a reviewer meets them before writing the note.
    The staleness is named in the body rather than quietly overwritten — it is this release's own defect,
    committed by its own author.
- 🌙 **2026-08-21 (loop iteration 37) — writing the release note's CONSTRAINTS found a comment that
  lied.** _(The finding belongs to the owning plan, § what remains; this entry keeps the mode lesson.)_
  - 🗣️ **The most productive thing left, once the engineering is done, was asking what the release
    note is ALLOWED to say.** Not drafting it — the tone is Thomas's and the mode says so. Just: which
    sentences are true? That question walked into `planBaseSeed` and found a comment asserting that an
    owner's already-edited files *"seed from the fetched copy at their next delivery"*. **No such path
    exists**, and the obvious release-note sentence built on it would have been false for a whole
    population, permanently. **A release note is a claim-checking exercise, and it can be run before
    anyone writes a word of it.**
  - ✅ **The behaviour was right and only the prose was wrong — which is the rarer and better outcome,
    and it has to be said as loudly as a bug would be.** Seeding a customization's base from the
    fetched copy would merge against `theirs` and silently discard everything shipped in between. The
    temptation on finding a comment/code disagreement is to "fix" the code; here the code was the one
    telling the truth.
  - 🟢🔴 **A test that goes green on its first run has proved nothing when it asserts an ABSENCE.**
    "No ancestor is seeded" is satisfied by any brain where nothing happens at all. Probed by
    un-editing the skill — the bytes become provable, the base gets seeded, **1 fail**. This is the
    same reflex the fixture's design pinned one iteration earlier, and it caught something both times.
- 🌙 **2026-08-21 (loop iteration 36) — the acceptance test, and two things only a red test knew.**
  _(What shipped belongs to the owning plan, § The QA instrument; this entry keeps only what the MODE
  learned.)_
  - 🔴 **The design was right about WHAT to assert and wrong about WHERE, twice — and both were found
    by an assertion failing, not by re-reading.** (1) The base advance is **not** `reconcileBrain`'s:
    `runReconcileCli` is the last writer on the update path and does it after the report. (2) Poles B
    and C stayed red until the brain held the **current manifest** — because a brain's own manifest is
    what declares the doctrine, which is the mechanical form of the very claim the release note has to
    make. **A design slice buys the shape; it does not buy the seams.** Both were an hour of reading
    away and neither was found that way.
  - ✂️ **The design's own probe list earned its keep, and it grew one pole.** The design pinned "see
    Pole A red by swapping its verdict" — done, plus two more (a cohort with no provenance, a cohort
    with no base tree): **1, 2 and 2 failures**. And Pole C (the owner who *edited* the file) was added
    on contact, because B alone proves delivery to someone who changed nothing — the easy half of a
    release whose whole claim is *"preserve stops meaning abandon"*.
  - 📉 **The mechanical checkbox audit paid a second time, and this time it produced a CONCLUSION.**
    Two scripts — unticked parents whose children are all done, and unticked **leaves** — swept a
    2 200-line plan and returned the honest state of the release: every remaining leaf is a design
    box, an exclusion box, or one of **four items that are all Thomas's**. *"The engineering is done"*
    is a claim worth being able to check rather than feel, and it took twelve lines of JavaScript.
- 🌙 **2026-08-21 (loop iteration 35) — a design slice, and the ground answering a question the plan
  had filed as a risk.** _(The design itself belongs to the owning plan, § The QA instrument; this
  entry keeps only what the MODE learned.)_
  - 🧭 **"Read the ground before writing the slice" is now two for two, and it paid differently this
    time.** Iteration 34 it killed a slice. Here it **shrank one and sharpened it**: nine `git show`
    on published manifests established that `CLAUDE.engine.md` was in no regime at any tag, which
    deleted the tag-chain replay (one worktree and one fixture tree per tag) and turned the fixture
    from an investigation into a regression net. **The plan had filed that very question as a risk to
    discover by running the fixture** (*"if the drift does NOT reproduce, that is itself a finding"*).
    It cost nine commands to answer **before** building the thing that was supposed to answer it.
  - 🏗️ **The instrument already existed, and reading the code first is what found it.** The first
    reflex was "design a replay harness"; `release-fixture-refresh.test.mjs` already builds a brain
    from a tag's bytes, seeds provenance with the **production** fingerprint and runs a real
    `reconcileBrain` with stubbed seams. The slice went from *build* to *extract the builder and add
    one suite*. **A design slice's first duty is to find out that most of it is already written.**
  - 🔴 **A design slice can still pin its own fail-first, and this one had to.** The dangerous shape
    here is a test that passes because **nothing happens** — a frozen file satisfies "unchanged"
    forever. So the design names the mutation to run by hand: swap the expected verdict before writing
    it green. Written into the plan rather than trusted to the implementing iteration, because that
    iteration may be a subagent.
- 🌙 **2026-08-21 (loop iteration 34) — the slice that was worth NOT doing, and a checkbox audit that
  is a script.** _(The arbitration itself is a blocking box at the top of the owning plan; this entry
  keeps only what the MODE learned.)_
  - 🛑 **The loop's most useful output this iteration was a question, not a commit.** S6e was named,
    unblocked and perfectly doable: translate one skill into French. **Twenty minutes of looking before
    writing found that it may not be worth writing at all** — the FR tree is missing two other skills
    entirely and one FR copy is two months behind its source, and this particular skill's only reader
    is Claude. **The autonomy rule paid in the direction nobody designs for**: it is written to stop the
    loop guessing on a decision that is Thomas's, and what it actually stopped was the loop **doing
    honest work on a slice whose premise had rotted**. A night loop's real failure mode is not a wrong
    commit; it is eight hours of correct work on the wrong thing.
  - 🔎 **Look at the ground before writing the slice, even when the slice is unambiguous.** The three
    facts that killed it — the two missing FR skills, `sync` FR at 2 months' drift, the `description:`
    frontmatter being the *routing* surface — cost **four shell commands**. None of them is in any plan.
    A slice specified months ago describes a repo that no longer exists.
  - 🤖 **A checkbox audit is a SCRIPT, and it should always have been one.** *"Which parent box is
    unticked while every one of its children is ticked?"* is mechanical, and a 12-line parser answered
    it over a 2 100-line plan in one run — **four stale parents**, none of which repeated reading had
    caught. This is the delegation rule's own logic applied one level lower: **before dispatching a
    reader, ask whether the question has a machine that answers it.** ⚠️ And its edge, respected here:
    the script proves *all children ticked*; it cannot prove a **leaf** is done. Those were ticked only
    after reading the target file, and the ones needing inference were **left unticked and named** in
    the owning plan's header rather than swept.
  - 🚧 **`wave-staging-guard` fired, and it was right for the wrong reason — worth one line, not a
    fix.** `git add maintainers/plans/prospective/` was blocked because a subagent had been dispatched
    13 minutes earlier. The stage was in fact safe: that agent was **read-only** (`Explore`), so it
    could not have left a half-finished file anywhere. The guard keys on *"a subagent was dispatched"*,
    not on *"a subagent that can WRITE was dispatched"*, and it has no way to know — the distinction
    lives in the agent type. **Left alone deliberately**: the guard costs one `git status` and a named
    stage, the mistake it exists to prevent was made **twice** in one run, and a guard that reasons
    about which agents are dangerous is a guard that can be wrong in the expensive direction. Filed
    here so the next person to be annoyed by it finds the reasoning instead of re-deriving it.
- 🌙 **2026-08-21 (loop iteration 33) — S6d, and the read that never touched this window.**
  _(What shipped belongs to the owning plan, § S6d; this entry keeps only what the MODE learned.)_
  - 📚 **The second rule paid, cleanly and for the first time on a slice that was ABOUT reading.**
    Two skill files, **~41 000 characters**, compared in full by a subagent; what came back into this
    window was a one-line verdict, one quoted passage and eight bullets. The files themselves were
    never in here. That is the whole of the rule *delegate the READING too*, and the slice would have
    spent ~12k of window doing it in place.
  - ⚖️ **A delegated read has no pass/fail, and that does not break the delegation rule — it marks its
    edge.** The subagent returned `LOCAL_CONTENT_FOUND`, which sounds like a verdict and is not one:
    the local passage it found was **still** the right thing to drop, because only the session knew
    where the artefact lands (a brain holds no `installer.mjs`). **A read returns EVIDENCE, and the
    session judges it**; the *"nothing is dispatched without a machine-evaluable judge"* rule governs
    dispatched **work**, not dispatched reading. Worth stating, because the two look alike from the
    orchestrator's seat.
  - 🔢 **The plan was stale about its own subject, and looking is what caught it.** It said the copy
    was two versions behind; it was **three**, and the third had shipped upstream **with no version
    number at all**. The repair went **to the source** (harness `e9e8b40`) rather than into the copy —
    on a vendored file, fixing the artefact is how a fork starts.
  - 🪞 **Thirteenth iteration, and the contrast is still unproduced** (see § RESUME HERE, item 4). This
    one could not have produced it either: a doc-only copy-forward has no implementation to dispatch.
    The finding recorded there is holding — the release keeps generating slices the mechanical-only
    verdict correctly keeps in session.
- 🌙 **2026-08-21 (loop iteration 32) — S6c, and the test that was right when I was not.**
  _(What shipped belongs to the owning plan, § S6c; this entry keeps only what the MODE learned.)_
  - 🎯 **The opener paid a third time, and then the TEST found what the opener could not.** The first
    tool call went at "what would UNDO this removal?" and cleared two candidates by reading code
    (`session-self-heal`'s desired state, a staged `engine-skills/` copy). Both answers were right.
    **Two more restore paths existed and no amount of reading found them** — the reconcile's own
    install-if-absent, and then the skills refresh's absent-install, each putting the just-deleted
    directory back **in the same pass**. What found them was one assertion: the order test checked
    `existsSync(...) === false` on the disk instead of trusting the report, and the report was
    cheerfully correct both times. **The opener finds what you can think to look for; the disk
    assertion finds what you cannot.** Neither replaces the other.
  - ✂️ **A slice that was too big, split at a green line rather than rushed.** S6c was five moves.
    They went out as three commits — machinery+wiring, the manifest switch, then the mutation
    follow-up — each green, each reviewable alone. The manifest commit is eight lines and is the one
    that changes what a deployed brain does; burying it inside a 400-line diff would have made the
    only dangerous change the hardest one to see.
  - ⏱️ **THE MODE CHANGES: mutation is scoped to the CHANGE, not to the file** _(owner's call,
    2026-08-21, on this iteration's figures)_. Thomas challenged the cost of measuring "a bit all the
    time", and the block's own numbers backed him: the value was entirely in the **new** files (~40 s
    and ~1 min, **two real defects**) while the cost was entirely in re-measuring **large files that
    had barely moved** (~7 min each; `reconcile-brain` returned a survivor list **byte-identical** to
    the previous run, and a third whole-file run was **killed by the 10-minute cap**). New file →
    whole, now. Existing file → **its changed lines only** (`--mutate "path:147-160"`, verified
    end-to-end here: 44 s and 17 mutants instead of 7 min and 396, same defect caught). Release tail
    → unchanged. **Not** a licence to defer: "less surface, immediately". Written into the three
    carriers (the harness's `test-first-discipline`, CONVENTIONS §5quinquies, the local
    `mutation-testing` skill) rather than restated here.
  - 🗣️ **A design line that could not be honoured, amended in the open.** § S6 promised the report
    would name the retired skill *"with its successor"*. The manifest carries no successor link, so
    the report would have had to assert a relationship nobody declared. Written into the plan as an
    amendment with what ships instead — not quietly dropped, and not faked.

- 🌙 **2026-08-21 (loop iteration 31) — S6b, the only door that erases** (`b2329c2`, 100 % on the new
  module). _(What was built belongs to the owning plan, § S6b; this entry keeps only what the MODE
  learned.)_
  - 🎯 **The opener again aimed at what would INVALIDATE the design, and again it paid** — one grep,
    not a review. The design said "remove only what matches its recorded fingerprint", and the
    question worth the first tool call was *"matches HOW?"*: a naive byte comparison would leave the
    entire Windows fleet holding a retired skill forever, because git rewrites LF→CRLF on clone and
    the sha was taken on the delivered bytes. The answer was already in the repo (`verifyBase` tries
    the normalized form second), so the slice's job was **to reuse it rather than to write a
    comparison** — and the test that pins it is the one a byte-comparison author would never write.
  - 📉 **A falling score that is not a regression, for the THIRD time this release** — 92.73 → 91.67 %
    on `engine-apply-plan.mjs`. The rule earned last week held again: **diff the survivor lists, never
    the scores.** All five are two shapes already characterised in RESULTS.md, and the new bucket's
    `?? ["Stryker was here"]` is discarded by its own `.filter()` — the row for S5a had *predicted*
    this exact arithmetic for the previous new bucket.
  - 🛑 **What I did NOT write down is the part worth keeping.** One mutant that survived at S2c is
    dead in this run, and the reproduction showed it is not killed by this file's own tests — so a
    sibling in the batch covers it and I cannot name which. It went into RESULTS.md as *not
    attributed*. A tempting sentence ("and S6b's tests fixed it") would have cost nothing today and
    would be a fabrication in the corpus forever.

- 🌙 **2026-08-21 (loop iteration 30) — S6's DESIGN, and the trap that was worth checking first.** A
  design slice: no code, and the design is committed before any is written. _(The design itself belongs
  to the owning plan, § S6; this entry keeps only what the MODE learned.)_
  - 🎯 **The opener aimed at the trap, not at the feature, and that is the sharper version of it.** The
    obvious first question was *"is there a removal path?"* — the plan had already answered it. The
    question actually worth the first tool call was **"what would UNDO the removal?"**, and it had a
    real answer: `session-self-heal`'s `deriveWanted` rebuilds the desired state from the manifest at
    every session start, so a retirement that deleted the directory without also dropping the `merge`
    entry would be undone at the next restart, forever, in silence. **On a destructive feature, ask
    what reverses it before asking how to do it.**
  - 🚫 **The elegant derivation was refused, in writing, so it is not re-invented.** "A skill the target
    manifest no longer declares is retired" needs no new vocabulary and is free — and turns any
    truncated or stale manifest into a fleet-wide deletion. The repo's own reflex is the opposite
    (an unreadable manifest allows *nothing*), so **the most destructive write gets the most explicit
    declaration**, not the cleverest inference. Recording the rejected option is half the design.
  - ♻️ **A new capability is cheapest when it copies a shape the repo already paid for.** The
    provenance-guarded removal, the cost-asymmetry rule ("a leftover is cosmetic, deleting someone's
    work is not") and even the wording all come from ADR 0036's status-line retreat. The design box's
    job was to NAME that precedent, so S6b is a transposition rather than an invention.

- 🌙 **2026-08-21 (loop iteration 29) — S2d, one sentence, 99.44 %.** `c1ec660` · the clash block stops
  being a cul-de-sac. _(Engineering: owning plan, § S2d.)_
  - 🎯 **Prose asserted as a LITERAL kills every mutant of itself.** All 13 new mutants died — the
    count-aware ternary, the empty-block guard, every string fragment — because the test spells the
    whole line out instead of importing the constant it is judging. `out.includes(THE_CONSTANT)` passes
    just as happily when the constant is emptied: on prose **the assertion IS the specification**, and
    the mutation score is what proves the difference rather than the intention.
  - 📐 **A focused prose test judges the WORDS; only a whole-output golden judges the POSITION.** The
    three new tests were green on wording while the line's placement in the report was still unjudged —
    it was the pre-existing whole-report test that failed and pinned where the offer sits (under its
    own clash, before the hooks news). **Prose needs both, and the golden is the half that is easy to
    skip because it looks like duplication.**
  - 🔍 **A filter that catches NOTHING is as dangerous as one that catches the furniture** (the lesson
    already in this file, mirrored). My first attempt filtered on `trimStart().startsWith("⚠️")` for a
    line that begins `   • ⚠️` — it matched zero lines. It failed loudly only because the expectation
    was a non-empty array; asserted the other way round it would have passed vacuously forever.

- 🌙 **2026-08-21 (loop iteration 28) — S2c, a slice whose deliverable is an ADR.** `856ad24` · the
  sacred scrub splits in two, 92.73 % mutation, no new survivor. _(Engineering: owning plan, § S2c.)_
  - 🔤 **The measured cost of a word doing three jobs, and it is worth carrying to other repos.** One
    noun, *sacred*, covered "never, ever" (`.env`, the vault), "the owner's to author" (`CLAUDE.md`)
    and "nobody claimed it" (a custom skill). The flattening did not just blur a distinction, it
    **answered a question nobody had decided**: four carriers said the engine may never write the
    constitution, an answer inherited from a word chosen to protect something else, and the owner had
    to be asked explicitly before the release could move. **When a decision keeps feeling
    pre-answered, suspect the vocabulary before the reasoning.**
  - 🚪 **A refactor whose behaviour is byte-for-byte unchanged still needs a test, and it is not the
    behaviour one.** What the split adds is a *claim* — one boundary, one constant — so the test that
    demanded the code asserts the two lists by **reference**, not by contents. And a second test exists
    purely to stop the new name being read as a green light ("merge-governed" ≠ "delivered"). **A
    rename that changes no behaviour is where a silent semantic drift is cheapest to ship.**
  - 🔎 **How to find the carriers of a NEW artifact: grep for its PREDECESSOR.** An ADR has no back-link
    yet, so `git grep` on its own number returns nothing and the sweep looks clean. Grepping `0037`
    surfaced `maintainers/README.md`'s ADR list — a carrier that would otherwise have gone stale on day
    one. Generalises to any numbered or dated artifact.

- 🌙 **2026-08-21 (loop iteration 27) — S5c, the release's headline line, and a slice that split twice.**
  `4340240` + `b3aefa3` · the doctrine layer is declared, delivered and reported. _(Engineering: owning
  plan, § S5c.)_
  - ✂️ **A slice that splits on contact is not a slice that was estimated wrong.** S5c was one box; the
    report surface turned out to be **four call sites** in `update-engine.mjs` (destructure, count,
    family sentences, conflicts) plus the reconciler. Split into S5c-1 (wiring, changes nothing while
    the manifest is silent) and S5c-2 (three lines that switch it on), **each landing green on its
    own**. The property worth keeping: **the first half is safe to leave overnight**, because a family
    nothing declares is a family nothing calls.
  - 🗣️ **The opener found the sentence, not a bug, and that was the higher-value use of it.** The
    load-bearing unverified claim here was not "does it work" but *"what words will every deployed
    brain read, at every update, forever?"* S4-3 had already built the honest one and had already
    refused "your customized" — the claim a `no-provenance` preserve cannot make. **At fleet volume,
    picking the flattering sentence is a lie repeated a million times**, so the wording deserved the
    same verification as the code, before writing rather than after.
  - 🔓 **Flipping a deliberate lock is a rewrite, never a delete.** The test that said NEVER now says
    HOW, and the old reason stays readable above the new one — including the two "Gate 3" references
    that had been sending readers to the wrong gate since Gate 1. **A lock lifted without its history
    is indistinguishable from a lock someone deleted to make a test pass.**
  - 📉 **A mutation score that DROPS is not a regression until you diff the survivors.** 96.74 → 96.30
    on the reconciler, and the honest answer took one command: six of the seven are the previous run's,
    line-shifted; the seventh is `readFileSync(p, "")`, which **does not throw — it returns a Buffer
    that `JSON.parse` coerces**. Four mutants of that shape, all provable equivalents, and the one that
    used to die was dying by accident. **Compare survivor lists, not scores** — the score moves with
    the denominator and with luck.

- 🌙 **2026-08-21 (loop iteration 26) — S5b, and how to get honest red on a module that does not exist
  yet.** `74c273d` · the doctrine family, 100 % mutation, 10 killed. _(Engineering: owning plan, § S5b.)_
  - ✅ **The new opener paid a second time, by saying "go ahead".** The iteration again spent its first
    tool call on the design's most load-bearing unverified claim — here, whether the merge globs are
    anchored, since an unanchored one would have selected the locale twin as its own delivery. They
    are. **Recording the confirmations matters as much as the refutations**: a rule that only ever
    appears in the log when it catches something reads as pure cost, and gets dropped.
  - 🔴 **A brand-new module's batch fails on `ERR_MODULE_NOT_FOUND`, and that is NOT fail-first.** It
    is the loading error the discipline explicitly rules out — it proves the import path, nothing about
    the assertions. The fix is a **skeleton committed to nothing**: the real export names returning
    empty results, which turned one loading error into **8 assertion failures and 3 passes**. The 3
    passes are themselves the finding: they were the negative-space tests (*"is skipped"*, *"is not
    reported at all"*, *"writes nothing"*), all vacuously green against a module that does nothing.
    **A test that passes against a skeleton is a test only mutation can vouch for** — noted, and it
    came back 100 %.
  - 📐 **A duplicated safety predicate was refused rather than inherited.** The twin family declares its
    own copy of the apply plan's regex with a comment warning that "the two must agree, or a file would
    be delivered twice or not at all". Copying that shape would have copied the warning. The predicate
    is exported once and imported, and a test asserts the allowlist and the delivery name the same
    file. **When the model being copied documents its own weakness, the weakness is the part to drop.**

- 🌙 **2026-08-21 (loop iteration 25) — S5a, and the design box that its own first line refuted.**
  `a51df22` · the write allowlist grows a third merge family (`mergeDoctrine`), 91.07 % mutation, all
  five survivors provable equivalents. _(The engineering belongs to the owning plan, § S5; this entry
  keeps only what the MODE learned.)_
  - 🔴 **A design box written one iteration earlier, under the brand-new rule "read the code for every
    claim", was still wrong — and the rule is not what failed.** The box checked four things
    (`verifyBase`, `planBaseSeed`, `resolveLocaleSource`, `SACRED_FILES`) and never checked
    `computeApplyPlan`, whose name is in the slice's own title. Its conclusion, *"ONE manifest line"*,
    would have delivered **nothing**: `merge` is split by shape through two regexes and the doctrine
    layer matches neither. **The sharpened rule: checking four things is what makes the fifth feel
    checked.** Before writing "add X to regime R", open the function that CONSUMES R and follow the
    entry to a write — the manifest is a declaration, never a delivery.
  - ✅ **The correction cost one slice split, not one wasted slice**, and that is the mode working. The
    finding landed on the first tool call of the implementation, before a line of code, because the
    iteration opened by asking the one question the box had not answered (*does a `merge` file go
    through the merge, or through the blind copy?*). **Opening a code slice with the design's most
    load-bearing unverified claim is cheap and pays immediately** — it is now the standing opener.
  - 📐 **A design proved wrong is amended IN PLACE, dated, with the lesson beside it** — never quietly
    rewritten. The wrong box stays readable above the correction: what it got right (the regime) is
    still the decision, and the record of why "one line" felt sufficient is the half worth keeping.
  - 📊 **The mutation call, made in writing rather than by reflex**: the block (S5a/b/c) is not
    finished, but `engine-apply-plan.mjs` **is** — it is the write allowlist and no later slice touches
    it. So it was measured now, once, on the file rather than on the block. *"Once per block"* means
    once per file's block of changes, not once per calendar sprint.

- 🌙 **2026-08-21 (loop iteration 24) — S5's DESIGN, and a slice whose one-line description was
  backwards.** A design slice: no code, and the design is committed before any is written. _(The design
  itself belongs to the owning plan, § S5; this entry keeps only what the MODE learned.)_
  - ➡️ **The design box read the CODE for every claim, and that is now the standing rule** — two boxes
    in a row had been written from memory and both were wrong. This one checked four things and **two
    came back against the plan's own summary**: the locale blocker everyone kept deferring to "Gate 4"
    is **already met** in the merge carrier, and the slice as described (*"the doctrine layer joins a
    regime"*) **unfreezes no deployed brain at all**, because a file with no provenance gets no
    ancestor. A one-line slice description is a hypothesis, not a spec.
  - 🧹 **Four carriers said four different things about one decision**, and the design pass is where that
    surfaced: two live plans named different target regimes, the ROADMAP's invariant asserted a regime
    the file **never had**, and a production test comment pointed readers at the wrong gate. All four
    were replaced by a **link** to the owning plan rather than re-synchronised — the carrier rule
    applied to a decision instead of a status.
  - 💡 **A subagent was the right tool for exactly this**: "who already speaks about `CLAUDE.engine.md`,
    and do they contradict each other?" is a bulk read whose whole value is one paragraph of
    contradictions. It came back with the four above, none of which a session holding the plan in its
    window would have noticed.

- 🌙 **2026-08-21 (loop iteration 23) — S4-4c closes S4, and six survivors were six defects.** The
  optimization the previous iteration's measurement demanded: the merge scan stopped reading the owner's
  vault, and is now **flat at ~0.25 ms** from 0 to 8 000 notes. _(Numbers and the full write-up:
  [`RESULTS.md`](../../mutation/RESULTS.md#s4-4c--the-walk-that-read-the-vault-and-three-survivors-that-were-three-real-defects--2026-08-21).)_
  - ➡️ **For the mode, the strongest data point yet on what mutation is FOR**: six survivors across two
    files, and **not one was a missing test**. Each named a defect or a dead line — a duplicated walk
    root, a throw through a fail-soft, a branch that repeated the line under it. **Chasing the score
    would have documented three equivalents and shipped all three defects.**
  - 🔍 **The reading technique worth keeping**: three of the six were reachable only because a value was
    **swallowed downstream** (an early `return []` feeding a list about to be filtered). The right move
    was not to accept an equivalent, it was to **stop discarding the observation**. A survivor whose
    value dies in a later filter is telling you the code is shaped so nothing can see it.
  - ⚠️ **Fail-first did NOT run first on this slice, and it is recorded rather than smoothed over**: the
    implementation was written in the same breath as the tests. The single red that came back was a
    **fixture asserting the wrong thing**, and the mutation pass is what stood in for the missing red.
    It worked here; the honest reading is that the loop's speed is quietly eating the one rule that is
    hardest to notice missing.

- 🌙 **2026-08-21 (loop iteration 22) — S4-4b, and a measurement that was worth the asking.** The plan
  had written *"measure the added SessionStart latency: 'should be fast' is not a measurement"*, and
  that instruction paid: the hook is fine on time (~20 ms of its own work) and **wrong on shape** — it
  walks the owner's entire vault to look at files no `merge` glob can ever name. _(Numbers and the
  follow-on slice: the owning plan's S4-4 block.)_
  - ➡️ **For the mode**: the useful measurement was the one the plan **demanded in advance**, written
    into a design box while nobody was in a hurry. Asked at the end of the slice, "is it fast enough?"
    answers yes and stops; asked as a required step, it produced a number, then a scaling curve, then a
    grep that found the waste. **A required measurement is a question that cannot be satisfied by a
    reassuring answer.**
  - ⚠️ **Second design box wrong in two iterations** (this one said "two file reads plus ~20 digests";
    the previous said "cap at 5 named files"). Both were written from memory about code and channels
    that were a `grep` away. The design-before-code rule is holding; what is not holding is **checking
    the claim inside the box** — and both times the repo already held the answer.

- 🌙 **2026-08-21 (loop iteration 21, second half) — S4-4a, and a 100 % score that proved nothing about
  the defect.** _(Numbers in [`RESULTS.md`](../../mutation/RESULTS.md#s4-4a--the-session-surface-and-a-defect-no-mutant-could-have-found--2026-08-21);
  the slice's state in the owning plan.)_ Two defects were caught this iteration and **neither was
  caught by the tests I wrote**: a repo guard condemned the prose before it shipped, and running the
  entry as a process found a channel that emitted nothing.
  - ➡️ **For the mode, and it is a sharp one**: the module scored **100 % first pass** while shipping a
    dead output channel. The tests and the code agreed; the **client** disagreed. So a mutation score
    answers *"do the tests pin this code?"* and never *"does this code speak the protocol?"* — and the
    mode's own judge rule (*nothing is dispatched without a pass/fail a machine can evaluate*) inherits
    the hole: **a subagent handed "make the score 100 %" would have returned exactly this**, confidently.
    For anything whose reader is outside the repo, the machine-checkable judge has to include the
    run-it-as-a-process check, not just the score.
  - ⚠️ **The standing repo guards did more useful work this iteration than the plan's own design box
    did.** The box said "cap at 5 named files"; the F5 payload guard held the field measurement that
    made that wrong. Design written from memory loses to a guard holding a measurement — **grep the
    guards before writing a design box about a channel**, not after.

- 🌙 **2026-08-21 (loop iteration 21) — THE BLOCKING-BOX MECHANISM WAS EXERCISED FOR REAL, and it paid.**
  The owner walked in mid-loop and asked about the one question parked at the top of the owning plan
  (*may the engine write `CLAUDE.md`?*). It was answerable in one exchange **because it had been written
  down as a box weeks of slices earlier**, with its measured facts attached — nothing had to be
  re-derived, and the loop had lost nothing waiting. _(The answer itself is the owning plan's, and this
  file deliberately keeps no copy: [`v5-unfreezes-the-existing-fleet-action.md`](v5-unfreezes-the-existing-fleet-action.md),
  box at the top.)_
  - ➡️ **For the mode, and it is the finding**: the box's value is not that it *defers* a question, it
    is that it **keeps the question answerable by someone who was not in the window**. The owner had no
    context, read three bullets, and decided — *and rejected the framing of the question itself*, which
    is precisely the class of answer a subagent can never produce and a session should never guess.
  - ⚠️ **What it cost to answer well**: the honest reply was not the two options the box offered. It
    took a third shape (assisted resolution), a size estimate, and an explicit **split between what ships
    and what defers**. A box that offers only its own two branches invites a session to pick one; the
    owner's answer arrived *outside* both. **Write boxes with the branches you see, and expect to be
    told the list was short.**

- 🌙 **2026-08-21 (night, loop iteration 20) — S4-3: the report says where the brain STANDS.** Commit
  `d171e90`, suite green (2031 pass). ⏳ **Its mutation number is the one thing outstanding** — the run on
  `scripts/update-engine.mjs` outlived a 10-minute window (~370 mutants) and the owning plan's header
  says how to finish it. Recorded as owed rather than skipped.
  - 🔇 **A REFUSED CLAIM HAD BEEN IMPLEMENTED AS A REFUSED SENTENCE, and that is the whole field
    defect.** `no-provenance` said "we cannot prove this file is customized", which was correct, and the
    code expressed it by printing nothing at all. So a brain frozen since install stayed silent on every
    update, forever. The fix is not new data: it is one sentence saying the thing we DO know.
    ➡️ **For the mode**: when a design note says *"stays silent by design"*, read it as a decision that
    can expire. Silence is a defensible answer to "what can we claim?" and never a defensible answer to
    "what does the owner need to know?".
  - 🔁 **Choosing REPETITION over a fragile join was the right call, and it took writing the join to see
    it.** Scoping the recap to "files this update did not name" needs a mapping from skill NAMES to file
    paths that nothing records. Framing the block as a recap instead — it repeats a file named above,
    and carries the versions the event lines cannot — removed the whole problem.
    ➡️ **For the mode**: when a filter needs data the system does not keep, ask whether the filter is the
    requirement or just the first shape it was written in.
  - 🕳️ **THE FAIL-SOFT I HAD JUST WRITTEN WAS THE LARGEST HOLE IN THE SLICE, and I did not feel it.**
    `readEngineDivergence`'s catch had no test: it could be emptied, its return could be garbage, and
    the suite stayed green. Writing a fail-soft feels like *adding* safety, which is precisely why it
    escapes the test-first reflex — there is no failing behaviour pulling it into existence.
    ➡️ **For the mode**: a `catch` written in the same breath as the code it protects is unfed by
    default. Feed it in the same slice, or the measurement will find it and you will have shipped a
    branch nobody has ever executed.
  - ♻️ **Three times in one release, a mutant survived because a fail-soft was written TWICE.** Here the
    early `return []` said what the pure module already answers for a null manifest. The rule that fell
    out: when a mutant survives inside a fail-soft, ask *"who else already handles this?"* before writing
    a test for it. Two answers to one question is a second thing to keep true.
  - 🧪 **A fixture told the truth the assertion did not expect.** The gate brain really does hold two
    merge files it can prove nothing about, so the end-to-end test came back with three entries where
    one was expected. The test was wrong, not the code — and the wording had to change with it: the
    header said *"kept at your own version"* about files we explicitly cannot attribute.
    ➡️ **For the mode**: a surprising fixture result is evidence before it is a failure. Read what it
    says about the domain before adjusting either side.
- 🌙 **2026-08-21 (night, loop iteration 19) — S4-2: the module that names what a brain holds back.**
  Commits `f247db3` (the module) and `d315525` (the tests it deserved), `lib/engine-divergence.mjs`
  **78.95 % → 94.74 %**, one survivor left and it is the equivalent the production comment predicted.
  - 🪞 **TWO OF THE FOUR SURVIVORS WERE THE TESTS', AND ONE OF THEM IS A NEW SHAPE.** The sort fixture
    listed its three files in exactly the **reverse** of the expected output — so a comparator mutated to
    `(true ? -1 : 1)`, i.e. no comparison at all, reversed the array and produced the right answer by
    accident. The test proved the array had been flipped, not ordered.
    ➡️ **For the mode**: never build a test input by applying a symmetry of the expectation (a reversal,
    a negation, a swap). A fixture that is the mirror of its answer can be satisfied by an operation
    that is not the one under test. For orderings: ≥3 elements in a **rotation**.
  - 🔁 **The mutation run is worth doing even when the file looks obviously right.** This module is 20
    lines, pure, and every one of its behaviours had a test written before it — and it still came in at
    **78.95 %**. Nothing was missing from the *list* of cases; two cases were being *checked wrongly*.
    A mutation score is the only instrument in this repo that can tell those apart.
  - ♻️ **Reusing an existing verdict beat re-deriving it, and the vocabulary came with it.** "Is this
    file still what we delivered?" is `verifyBase` asked of the installed bytes — already written,
    already EOL-normalized. Writing a fresh comparison would have re-introduced the Windows false
    positive (every CRLF checkout reported as holding back every file) in a module whose whole job is
    to tell the owner something true.
    ➡️ **For the mode**: when a slice needs a judgement the codebase already makes elsewhere, spend the
    read. The second implementation of a verdict is where the fleet-wide false positive lives.
- 🌙 **2026-08-21 (night, loop iteration 18) — S4-1: the base learns which version delivered it.**
  Commit `df983c7`, `lib/engine-source.mjs` **93.02 % → 96.61 %** on the **first pass, with no kill round
  needed** — the first slice of this release where the number was right before anything was fixed.
  - 📐 **The design slice paid for itself in one iteration.** Iteration 17 wrote the shape (a
    `baseRefs: { rel: ref }` map, one meaning per entry, absent when unknown); this one wrote nine tests
    against it and every one of them described a case the design had already named. Nothing was
    discovered while coding, which is what a design slice is *for* — and is the strongest evidence so far
    that the "a design slice has no tests and no mutation score" rule is buying something.
    ➡️ **For the mode**: the payoff of designing first is not visible in the design iteration. It shows up
    as the *next* iteration having no surprises, and that is where it should be recorded.
  - 🕳️ **A default parameter hid the very case the slice existed for — again, and in the same shape.**
    `enrichManifest(manifest, { source, provenance })` gained a third field, and a `baseRefs = {}`
    default would have made "a brain with no ref records nothing" indistinguishable from "a brain that
    records an empty map". The identical trap cost a wrong test two iterations ago (S3-1's
    `decide` helper re-injecting the real manifest for the `undefined` case). It was avoided here because
    it was *remembered*, not because anything catches it.
    ➡️ **For the mode**: a default value in a test helper or a destructured signature is a silent
    substitution. When the absent case IS the requirement, the parameter must have no default.
  - ⚖️ **A number that rises while the file grows deserves the same scrutiny as one that falls.** The
    honest reason is that the new function is total and every branch is fed, including the absent-`ref`
    one; the temptation is to read 96.61 % as a verdict on the whole file, when 2 of its 59 mutants are
    pre-listed equivalents this slice never touched. Recorded with both survivors named.
  - 🔗 **Two wiring sites were deliberately not re-measured, and the choice is written down.**
    `update-engine.mjs` and `reconcile-brain.mjs` gained one call each; re-pricing ~370 mutants for two
    lines buys no information, and both are covered by tests asserting the **whole** map after a real
    update. Named in `RESULTS.md` rather than silently skipped — an unmeasured file that nobody mentions
    reads, later, exactly like one that was measured.
- 🌙 **2026-08-21 (night, loop iteration 17) — S4 is DESIGNED (no code, no number).** Third design slice
  of this release, and like the two before it, it changed the shape of the work before any of it was
  written. `RESULTS.md` gets nothing: there is no mutation score for a paragraph.
  - 🚫 **THE OBVIOUS SURFACE WAS DISQUALIFIED BY AN ADR THE SLICE HAD NO REASON TO OPEN.** "Make
    divergence audible" points straight at the status line. [ADR 0036](../../decisions/0036-deterministic-channels-differ-by-surface.md)
    holds a **channel matrix** saying `statusLine` renders **nothing** in Desktop's Code tab and has been
    **opt-in since v4.4.0** — and that a SessionStart `systemMessage`, the shape every health hook uses,
    is dropped there too. The notice rides `additionalContext` instead.
    ➡️ **For the mode**: *before choosing a surface, read the ADR about surfaces.* A design that picks a
    channel from habit is a feature that ships to the CLI only, and the field would have reported it as
    "it never told me" months later.
  - 📐 **Half of a two-part promise had no source, and the design is where that is cheap to find.** "Which
    files are held back" costs nothing — a `merge` file whose disk digest differs from its recorded
    provenance IS one the engine is holding back, exact and offline. "How far behind" has **no source at
    all**: the base tree holds the last-delivered bytes and nothing holds the version they came from.
    Discovered as a missing field rather than as a wrong number, which is the difference between adding
    `baseRefs` calmly now and inventing a release count later.
    ➡️ **For the mode**: read a two-clause requirement as two requirements. The second clause is where the
    missing data hides, because the first one is what made the feature sound easy.
  - 🔇 **The "deliberate silence" the field finding complained about turned out to be one findable line.**
    `PRESERVED_ASIDE` has no `no-provenance` key, so the report's loop hits `aside === undefined` and
    `continue`s. Two years of "nothing ever says so" is a missing map entry — and the same guard is why a
    mutation survivor there was correctly named equivalent two iterations ago.
  - 🔗 **Two plans claimed this work, and the duplicate was cut at the moment it appeared.** The
    silent-skill-freeze field finding states the requirement (its Step 3); this release builds it. Rather
    than let both track it, that step now carries a one-line pointer here and nothing else.
    ➡️ **For the mode**: the deduplication rule is cheapest **when the second carrier is first noticed**,
    not at the next hand-back sweep.
- 🌙 **2026-08-21 (night, loop iteration 16) — S3-3, and with it S3: the doctrine, in the ADR that
  already owned the topic.** No code, no number: ADR 0012 gains §5, the write boundary read backwards,
  plus a Crux line, two consequences, three rejected alternatives, and the index entry in
  `maintainers/README.md`. Suite **2009 pass / 0 fail** (docs only).
  - 🗂️ **The convention did the deciding, and that is what a convention is for.** The reflex was a new
    ADR `0038` for "a guard on agent writes". CONVENTIONS §6bis says one ADR per topic, and 0012 already
    owns the launcher↔brain write boundary — it merely stated one direction of it. A second ADR would
    have made `decisions/` harder to browse and left two half-answers where the question is one.
    ➡️ **For the mode**: before opening a numbered artefact, ask which existing one already owns the
    *question*, not which one mentions the same words.
  - 🧾 **The index is a surface, and a section that never reaches it is not published.**
    `maintainers/README.md` carries a paragraph per ADR; amending 0012 without touching it would leave
    the new half of the boundary invisible to anyone browsing decisions rather than grepping them.
    Updated in the same commit, deliberately, not as a chore.
  - 📌 **S3 closes with one item open ON PURPOSE, and saying so is the point.** Whether the prompt turns
    into noise on a session that legitimately customizes an engine skill cannot be answered by a test or
    by argument — only by living with the guard for a few days. It is carried to the **release
    checklist** rather than left as a half-ticked slice, so nothing downstream appears to be waiting on
    it.
    ➡️ **For the mode**: "done bar a field measurement" is a legitimate end state. What is not legitimate
    is leaving it as an unticked box that reads like unfinished code.
- 🌙 **2026-08-21 (night, loop iteration 15) — S3-2: the guard reaches a brain.** Commits `cf55c2a` and
  `3493533`. Pushed, suite **2008 pass / 0 fail**, the entry at **88 %** with all three survivors
  equivalents.
  - 🎯 **The design slice paid, two iterations later, in the currency it promised.** Iteration 13 read
    `reconcileHooks` and found that a template group is identified by its FIRST script. This slice wired
    the guard into its own group because of that, and — the part worth logging — turned the finding into
    **two tests**: the reconcile output for a pre-v4.5 brain, both groups named, and a structural refusal
    of any template group wiring more than one script.
    ➡️ **For the mode**: a design finding that stays prose protects only the person who read it. The
    finding is finished when a test would go red for the mistake it describes.
  - 🔴 **A red test changed the production code, which is the whole point of writing it first.** The
    manifest read had been routed to the entry's outer catch-all — and that catch swallows the *whole*
    verdict, including the `.engine-base` deny, i.e. the one refusal that must survive an unreadable
    manifest. The test asserting "the base is still refused, manifest or no manifest" failed, and the
    fix was a second, narrower `catch`. **Written test-after, this hole ships**: the code looked right,
    and every other test was green.
  - 📉 **The mutation score went DOWN when the code got better, and the number was right.** A survivor
    was the `catch` body emptied — dead, because `manifest` is initialised to `null` and a throwing read
    never completes the assignment. Deleting it removed a mutant from the denominator without removing a
    kill: 23/26 → 22/25, i.e. 88.46 % → 88.00 %.
    ➡️ **For the mode**: a score is a ratio, so simplifying production moves BOTH ends of it. A slice
    that deletes dead code and reports a lower number has not regressed — read the survivor list, not
    the percentage.
  - 🧱 **The repo's own guards demanded the manifest entry before the suite would go green.** Adding a
    hook to the template with no `replace` declaration is the "brain runs what an upgrade never sends"
    bug class, and `engine-manifest-integrity.test.mjs` has covered it under **every** hook event since
    someone anticipated exactly this. Nothing to remember, and nothing that could be forgotten.
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
