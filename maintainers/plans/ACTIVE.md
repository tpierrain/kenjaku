<!-- THE DOOR — it answers ONE question: where does work resume? Links and a date -->
<!-- only, never a status: every plan owns its own state and this file copies none. -->
<!-- Under 30 lines, forever. Why: ../studies/plan-state-single-source-study.md   -->

# ▶️ ACTIVE — the one way in

**"On reprend" means: open the plan below, read its `## 📍 STATE` block, announce the step, work.**
No memory lookup, no ROADMAP scan, no grep. Sub-plans are reached **through** it, never directly.

## The active plan

- **Subject:** names nobody real, and ADRs people actually read. Opened out of two calls the owner
  made in one breath on 2026-09-12; its own `## 📍 STATE` says what is left.
- **Plan:** [`prospective/fixture-names-and-adr-brevity-action.md`](prospective/fixture-names-and-adr-brevity-action.md)
- **Active since:** 2026-09-12. It **pre-empted** the tracker plan, which stays open and next in line.

## The plan it pre-empted, and the one to go back to

- **Subject:** clear the tracker. The sweep is done and the whole of it is now planned into three
  named releases; the plan's own `## 📍 STATE` says which one is being built.
- **Plan:** [`prospective/clear-the-tracker-action.md`](prospective/clear-the-tracker-action.md)
- **Active since:** 2026-09-09 — **restored, not newly chosen**, and by the same pattern as last
  time: it held the slot until 2026-09-06, the restart-nudge bug pre-empted it, and that bug shipped
  as [v5.1.2](https://github.com/tpierrain/kenjaku/releases/tag/v5.1.2). **How far it has got lives in
  its own `## 📍 STATE`, never here** — a sentence about progress written in this file is a copy, and
  the copy went stale exactly once: on 2026-09-11 this line still read *"nothing in it was ever
  started"* on the day all five of v5.1's issues were fixed, pushed and green. That is the whole
  reason the header says *links and a date only, never a status*.
  **The owner may of course put something else here instead.**

## Open, but NOT active

Links only — each one's own `## 📍 STATE` block says whose it is and where it stands.

- [`archived/2026-09-09-restart-nudge-loop-action.md`](archived/2026-09-09-restart-nudge-loop-action.md)
  — **shipped as v5.1.2**, and [#90](https://github.com/tpierrain/kenjaku/issues/90) is now closed.
  Worth reading for **how** it closed: a keyword, not the rule this plan wrote.
- [`prospective/shipped-ci-workflows-action.md`](prospective/shipped-ci-workflows-action.md) —
  **shipped as v5.1.1**, and [#92](https://github.com/tpierrain/kenjaku/issues/92) is now closed on
  measured field evidence. Only its optional step 3 (the nudge) is left.
- [`prospective/harness-speed-and-test-quality-action.md`](prospective/harness-speed-and-test-quality-action.md)
  — **its speed half is done and shipped**; the quality and record halves are where it resumes.
- [`../studies/plan-state-single-source-study.md`](../studies/plan-state-single-source-study.md) —
  its queued items come due now that the tag is cut.

> **Why this file exists** (Thomas, 2026-08-22): *"un plan, on est censé avoir qu'un seul plan actif à
> l'instant T… et ça c'est pour que le 'on reprend' fonctionne."* Answering one *"on reprends"* that
> morning cost **eight files opened** before any work began.
