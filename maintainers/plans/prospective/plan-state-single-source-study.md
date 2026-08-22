<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- STATUS: 🟢 OPEN (2026-08-22) — a STUDY Thomas asked for, not a build.    -->
<!-- Nothing here is authorized to change a rule, a hook or a skill yet: the  -->
<!-- deliverable is a reasoned proposal he arbitrates. This file OWNS the     -->
<!-- brief and the evidence; it holds no other chantier's state.              -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Study — plans that need no guard: making duplicated state structurally impossible

> ## ▶️ WHERE THIS RESUMES — **NOTHING HAS BEEN STUDIED YET. START AT § The question.**
> _(written 2026-08-22, immediately before a `/clear`, so the request survives it.)_
>
> **Thomas's ask, in his words**: *"est-ce qu'on ne manque pas d'une convention qui rendrait caduque
> tous ces workarounds qu'on fait en permanence sur ce sujet… une solution rationnelle et efficace de
> gestion des plans, de l'historique… une petite étude quoi."*
>
> **What he is reacting to**: the accumulation of patches. Each one is defensible alone; together they
> are a tell. The save-point rule, then its plural-carriers amendment, then a machine-local hook to
> enforce it, then a declared door to silence the hook, then (today) a "certificate" variant of that
> door. **Five mechanisms for one problem is a design smell, not a discipline.**
>
> ⚠️ **This is a STUDY. Do not refactor the plan corpus, do not edit `rules/plans.md`, do not touch
> the hook.** Produce a proposal with its trade-offs; he decides. The evidence below is already
> gathered: **do not re-derive it**, spend the effort on the answer.

## The question

**Can duplicated state be made structurally impossible, instead of detectable after the fact?**

Every mechanism we have today is *detection*: something notices, after the copy exists, that it might
have gone stale. Nothing prevents the copy. And detection cannot judge content, so it fires on correct
files too, which is what produced the door, which is what produced the certificate.

## The evidence, already measured — do NOT re-derive

- [x] **The founding measurement (2026-08-20, Kenjaku).** One session: 8 commits, 4 of them into
      plans, and **every single one updated the plan that was open**. Meanwhile **four** repo files
      restated the same item's status (three plans plus a measurement register). Nothing was
      forgotten. **The state was COPIED**, and a copy is invisible from inside the file you have open.
- [x] **The guard over-fires on correct files (2026-08-22).** It blocked four hand-backs in one
      session over a roadmap that was right every time. That is what forced the `delegates-only` door
      into existence: a rule invented to silence a rule.
- [x] **And it under-fires too, in the same session (2026-08-22).** It named a carrier; the session
      answered "it needs nothing" from a `grep`; that was **wrong** — the file held `Nothing tagged`,
      a live status that would have gone false the day the tag landed, inside a file whose own header
      forbids reading it for status. **The guard was right and the human answer was wrong**, which is
      an argument for prevention over detection, not for a better guard.
- [x] **Plans have outgrown reading.** The archived plan is ~2 200 lines; the mode plan is ~3 000.
      **Nobody reads them; everybody greps them.** Grep cannot see a stale claim, a promise, or a
      status buried in narration. The failure above is exactly this, and it is structural: the corpus
      selected for the tool that cannot do the job.
- [x] **The known hole in the save-point rule itself** (memory `save-point-rule-sequencing-hole`): it
      fires when handing back, so it misses whatever is invented *while writing the reply*.
- [x] **Durable memory already solved a sibling problem, and its answer is a precedent**: memory holds
      **pointers and references, never state**, because a line written once outlives the step it
      describes. The plans corpus has not been given that same discipline.
- [x] **The oldest scar**: two copies of one plan, zero ticked boxes versus thirteen. Both looked
      authoritative; whichever was opened first won.

## The leading hypothesis, to be attacked rather than confirmed

A plan file mixes at least **five kinds of content with opposite lifetimes**:

| # | Kind | Lifetime | Wants to be |
|---|------|----------|-------------|
| 1 | **Current state** (done / next / blocked) | **Perishable, dies every day** | Unique, tiny, one place |
| 2 | **Decisions + rationale** ("do not re-open") | Durable | Append-only |
| 3 | **Evidence, measurements** | Durable | Append-only |
| 4 | **Narration** (how it went) | Durable | Append-only |
| 5 | **Boundaries / authorizations** (what a session may do alone) | Owner-set | Unique |

Kinds 2-4 grow without bound, forever. Kind 1 must stay unique and short. **They are in the same
file**, so the perishable thing is buried in thousands of lines of the durable thing, which is why it
gets copied outward into headers, roadmaps and registers where it can be found, which is the very
duplication the guard then hunts.

> **If that holds, the convention writes itself**: separate them by construction, and make kind 1 live
> in exactly one machine-readable place that every other surface *renders* rather than *restates*.

## What a good answer must satisfy

- [ ] **It kills copies at the source**, rather than detecting them.
- [ ] **It survives a `/clear` and a fresh session** with no memory of the conversation.
- [ ] **It travels**: machine-local hooks do not, so the convention must hold on a laptop with nothing
      installed. (The current hook is machine-local, which is why the written rule is "the belt".)
- [ ] **It is cheap at the moment of writing**, or it will not be followed under load.
- [ ] **It keeps the human able to read a plan in Typora/Obsidian and tick a box by hand** — Thomas's
      standing requirement, and the reason checkboxes exist at all.
- [ ] **It does not lose the history.** Kinds 2-4 are the expensive part of the corpus.

## Directions worth costing (none is the answer yet)

- [ ] **Split by lifetime**: a tiny `STATE.md` (or front-matter block) per chantier holding only kind
      1; the plan keeps kinds 2-5 and *links*. Cheap, no tooling. Risk: two files to open.
- [ ] **Status lives where it is already true**: git and the PR are the record (merged? tagged?
      branch alive?). Plans then never assert them. Removes a whole class of future lies, including
      today's `Nothing tagged`. Risk: offline readability.
- [ ] **Transclusion / generation**: one source, other surfaces generated. Strongest guarantee,
      heaviest tooling, and generated Markdown fights hand-ticking.
- [ ] **Front-matter as contract**: every plan declares `owns:` and `delegates:` in machine-readable
      form; the guard reads THAT instead of grepping prose. Turns the door from an exception into the
      normal mechanism.
- [ ] **Shrink the unit**: archive aggressively so no live plan exceeds what a person will actually
      read. Attacks the grep-instead-of-read root cause directly.

## Tracking

- [ ] **1. Re-read the corpus with the lifetime lens** and confirm or break the hypothesis.
- [ ] **2. Cost each direction** against the six criteria above.
- [ ] **3. Write the proposal**: one recommended convention, its migration cost, what it retires
      (which of the five mechanisms disappear), and what it cannot fix.
- [ ] **4. Hand to Thomas for arbitration.** ⛔ Nothing is applied without his GO.

## Scope

- **Out**: the v5.0.0 release and its findings — that is
  [`v5-code-review-triage-action.md`](v5-code-review-triage-action.md), and this study must not touch it.
- **Likely destination of the OUTPUT**: the harness (`~/Dev/use-case-driven-harness`, `rules/plans.md`
  + the `plan-discipline` skill), because the convention is global. The **evidence** lives here, in
  Kenjaku, which is why the brief does.
