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

## ⏳ Waiting on the owner — three arbitrations, and no loop starts before them

- [ ] **1. The quota.** What does one autonomous loop get before it stops and reports — a token
      budget, a wall-clock, a number of dispatched agents? "Until the objective is met" needs a second
      bound or it has none.
- [ ] **2. The autonomy perimeter.** Inside a loop, may the session **commit and push on a branch** on
      its own (the standing `push-as-you-go-on-branches` reflex says yes) and **open a pull request**?
      Merging stays his either way.
- [ ] **3. The granularity of the stop points.** Does he want a hand-back at each ticked box of the
      release plan, or only at the release cut, with the plan's checkboxes as the running trace?

## Tracking

- [x] **Frame the mode with the owner** — the three questions on
      `llm-wiki-vs-embedding-rag-karpathy-graphify.md` answered, the subject relocated here
      _(2026-08-19)_.
- [x] **Lift the diversion** in `ROADMAP.md` and unpause
      `update-regime-owns-what-it-shipped-action.md` _(2026-08-19)_.
- [x] **Write the delegability map, the deterministic-check rule and the stop points** — this file
      _(2026-08-19)_.
- [ ] **Get the three arbitrations above answered**, and write the answers into this section.
- [ ] **Dry-run the mode on S0bis** — the release's first unticked box, and the best-judged cargo we
      have. Slice per file, one agent per slice, mutation score as the judge.
  - [ ] Re-confirm the S0bis measurement recorded on `fix/mutation-debt-entrypoint-and-git-value`
        before slicing (28 of 32 scripts carry the guard, nine have no test sibling).
  - [ ] Write the shared `runAsEntrypoint` helper and its guard test **first**, in the main session —
        they are the judge, so they are not delegated.
  - [ ] Fan out the per-file conversions against that judge.
- [ ] **Debrief the mode after S0bis**, before applying it to S1–S5: what the fan-out actually cost,
      what it caught, what it broke. If it does not pay, say so here and go back to a single session.
- [ ] **When the release ships**: fold the surviving lessons into `maintainers/CONVENTIONS.md` (or
      kill this file), and rewrite the memory pointer to whatever becomes live next.

---

> **Sibling reading**: `maintainers/CONVENTIONS.md` (checkboxes on every step, one canonical plan =
> the repo's, green-only commits), and the standing test-first discipline. Nothing here overrides
> either — orchestration is a delivery mode, not a licence.
