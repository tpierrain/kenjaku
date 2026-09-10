<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- plan-carrier-guard: delegates-only — this index names files and what kind  -->
<!-- of thing each one is. It holds no state: every file here answers for       -->
<!-- itself, and none of them is committed work. Delete this line the day a     -->
<!-- row here starts carrying status of its own.                                -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# 🔬 `maintainers/studies/` — research and observation, never committed work

**Nothing in this folder is a plan, and that distinction is the whole point of the folder existing.**

> Thomas, 2026-08-23: *« des études ce ne sont pas des plans et ne doivent pas être nommé/classifié
> comme tel »*.

He is right, and the cost of getting it wrong was measurable. `plans/prospective/` had grown to
**thirteen files**, which read as thirteen open chantiers and produced exactly that reaction — *"c'est
pas un peu beaucoup ?"*. Only four of them were plans. The other nine were studies, watches, an idea
backlog and a field log: things that are **never finished by construction**, so they can never leave a
folder whose exit condition is *done*. Filing them as plans made a four-item workload look like a
backlog nobody could face.

## What goes where

| Kind | Home | Exit condition |
| --- | --- | --- |
| **Work someone is doing**, with steps to tick | `plans/prospective/` → `plans/archived/` | it ships |
| **Work nobody is doing yet**, however real | **the GitHub tracker** | it is fixed, or closed with a reason |
| **Research, watch, analysis, field log, idea box** | **here** | none — it is refreshed, or it goes stale and is deleted |
| **A decision, with its rationale** | `maintainers/decisions/` (ADRs) | amended in place, never superseded by a sibling |

**The middle row is the one that gets skipped.** A real chantier nobody has started is not a plan: a
plan is a working document, and a document nobody works is a document nobody reads. It belongs in the
tracker, where `CONVENTIONS.md` §10bis makes every release sweep it. One was converted that way on
2026-08-23 — [#79](https://github.com/tpierrain/kenjaku/issues/79), after sitting untouched in
`prospective/` for five weeks — and a second, the migration chantier, turned out to have been **done
in the field for weeks** while its plan still tracked it as *not started*.

## What is in here

- **`background-consolidation-mode-study.md`** — 🔬 study. Should consolidation run in the background,
  and what would that even mean? Nothing implemented, nothing branched.
- **`etude-rag-local-criteres-et-veille.md`** — 🔬 study + watch, in French by choice (it is a survey
  of the field). Offer a range of RAG alternatives to suit people's privacy, budget, machine and OS.
  Feeds ADR 0007 and the embedder plan.
- **`llm-wiki-vs-embedding-rag-karpathy-graphify.md`** — 🔭 watch. Where Kenjaku sits between
  Karpathy's LLM-Wiki and graph-RAG. The framing question was answered; it went back to a watch.
- **`plan-state-single-source-study.md`** — 🔬 study that produced a convention (one owning plan, the
  `delegates-only` door, the ≤ 20-line STATE cap) and still carries **queued items that came due when
  v5.0.0 was tagged**, including one unanswered owner call about a lint on plan shape. The most
  action-shaped file here; promote it to a plan the day someone starts it.

- **`two-humans-one-brain-study.md`** — 🔬 field study (2026-09-01), deliberately generic. A brain
  owner hands a brain to a second, trusted person: what the multi-machine sync path verifiably does
  for a second *person*, a zero-code runbook (clone + provider-shared archive folder + Spotlight +
  writer-of-record mail), the owner questionnaire, and six tracker candidates.

- **`fleet-upgrade-field-feedback.md`** — 📓 field log of a real brain crossing three versions, with
  **33 observations never triaged**. The richest and least-read file in the repo: these are defects
  seen on a real machine. They should become issues or be dropped.
- **`post-v3.1.0-ux-backlog.md`** — 💡 idea box. Captured, not committed. Promote one to a real plan
  the day it is picked up.

> 🗑️ **One file was deleted rather than moved here** _(2026-08-23)_: `engine-managed-file-merge-strategy.md`,
> the 2026-06-21 analysis of how to propagate engine improvements into user-editable files. **v5.0.0
> delivered every one of its three open next-steps** — the ADR ([0038](../decisions/0038-sacred-splits-inviolable-and-merge-governed.md)),
> the legacy-migration path (the heal), and the implementation (`.engine-base/` + the three offers) —
> by a design it had not predicted: *split the file*, rather than fence a managed block inside it. Its
> twelve tracking boxes were all ticked. **Its one durable contribution, the prior-art survey, was moved
> into ADR 0038 before the deletion**, which is the only reason deleting was the right call rather than
> the fast one. Git keeps the 677 lines.
>
> **This is the exit condition for a study, applied**: a study is not archived when it is answered, it
> is **deleted** — an archive is for work that shipped, and a stale study that survives is read as
> current. What it taught goes into the ADR that owes it.
