<!-- THE DOOR — it answers ONE question: where does work resume? Links and a date -->
<!-- only, never a status: every plan owns its own state and this file copies none. -->
<!-- Under 30 lines, forever. Why: ../studies/plan-state-single-source-study.md   -->

# ▶️ ACTIVE — the one way in

**"On reprend" means: open the plan below, read its `## 📍 STATE` block, announce the step, work.**
No memory lookup, no ROADMAP scan, no grep. Sub-plans are reached **through** it, never directly.

## The active plan

- **Subject:** the restart nudge loops forever, because the instruction it gives is the one thing
  that prevents its own marker from clearing ([#90](https://github.com/tpierrain/kenjaku/issues/90)).
- **Plan:** [`prospective/restart-nudge-loop-action.md`](prospective/restart-nudge-loop-action.md)
- **Active since:** 2026-09-07 night — **restored, not newly chosen**: it was the active plan that
  morning, the CI hotfix pre-empted it, and that hotfix shipped as
  [v5.1.1](https://github.com/tpierrain/kenjaku/releases/tag/v5.1.1). It resumes at its **step 2b**.
- ⚠️ **Read that plan FROM ITS BRANCH — `git checkout fix/restart-nudge-escape-hatch`.** The copy on
  `main` predates the day's work and still says nothing is started; the branch's copy carries the
  owner's answer (direction 1) and the real next step. The branch also holds step 1 and the instrument half of
  step 2a, green and **unmerged on purpose**: merging it was never part of the night's go-ahead.

## Open, but NOT active

Links only — each one's own `## 📍 STATE` block says whose it is and where it stands.

- [`prospective/shipped-ci-workflows-action.md`](prospective/shipped-ci-workflows-action.md) —
  **shipped as v5.1.1**; what is left there is a wait, not work (#92 closes on field evidence).
- [`prospective/harness-speed-and-test-quality-action.md`](prospective/harness-speed-and-test-quality-action.md)
  — **its speed half is done and shipped**; the quality and record halves are where it resumes.
- [`prospective/clear-the-tracker-action.md`](prospective/clear-the-tracker-action.md) — **was active
  until 2026-09-06**; nothing in it was started, so nothing is in flight.
- [`../studies/plan-state-single-source-study.md`](../studies/plan-state-single-source-study.md) —
  its queued items come due now that the tag is cut.
- [`prospective/harness-universe-blindspot-hardening-action.md`](prospective/harness-universe-blindspot-hardening-action.md)
  — read before the tracker sweep's universe group.

> **Why this file exists** (Thomas, 2026-08-22): *"un plan, on est censé avoir qu'un seul plan actif à
> l'instant T… et ça c'est pour que le 'on reprend' fonctionne."* Answering one *"on reprends"* that
> morning cost **eight files opened** before any work began.
