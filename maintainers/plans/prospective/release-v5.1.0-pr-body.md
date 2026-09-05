# PR body — v5.1.0 (step 8.2quater)

> 📤 **SENT** — this is the body of [#86](https://github.com/tpierrain/kenjaku/pull/86), opened
> 2026-09-03 from `feat/live-remote-sync` into `main`. Everything below the first `---` is what was sent. It
> is written here as well as on GitHub so the record of what a reviewer was told survives the PR, and
> so a re-open or an edit starts from the text rather than from memory.
>
> **The RELEASE title is a separate choice**, with its three candidates in
> [`release-v5.1.0-note.md`](release-v5.1.0-note.md); this is the PR title only.

---

## What this branch is

**Two features, one release**, on the owner's decision of 2026-09-02 that they ship together.

1. **Two people on one brain stop storing the same thing twice — *duo mode*, and it is the driver** (the sub-plan, landed in `415cd7c`). A captured source carries an identity derived from what it *is* rather than from who fetched it, the writer guard refuses a known duplicate on the deterministic path, and per-person paths keep two syntheses of one day from colliding. It is implicit: git's own author names say a second name writes here, and the brain raises it rather than offering a switch. **And raising it means ASKING, not asserting** (step 8, the reason the owner held the release): author names are all a brain has, so one owner whose two Macs say `Thomas Pierrain` and `tpierrain` is the same evidence as two colleagues. A brain may *file* on a guess — a file in an unexpected place is visible and reversible — but it may not *assert* one, so the once-in-a-lifetime sentence became a question asked at every session start until it is answered either way. The answer lands in `.vault-rag/authors.json`, committed and pushed like the universe pointer beside it, because the question is about the *other* machine. Everything that compares two names — the note paths, the arrival banner, the session line — now resolves through that one registry.
2. **A brain open on two machines stays in step on its own** ([#84](https://github.com/tpierrain/kenjaku/issues/84)) — the lever the above needed, and everyone gets it. Until now a brain caught up only when a conversation started — a deliberate choice, since a brain that reaches for the network mid-work can interrupt it. The cost landed elsewhere: a window left open all afternoon kept answering from what it knew that morning. A clock inside the search server now pulls on an interval, only on a clean tree, one machine's window at a time, and the arrival is announced to the person at their next message (plus a native banner when someone else wrote it).

## How to review it

The branch is best read **in the order the plan built it**, and each step's own reasoning is in
[`maintainers/plans/prospective/live-remote-sync-action.md`](maintainers/plans/prospective/live-remote-sync-action.md)
— the merge rule, then the gate, then the clock, then the announcement, then the doctrine, then the
field rehearsal. The two things most worth a reviewer's eye:

- **The merge rule, narrowed on the owner's challenge** (`.gitattributes`). `merge=union` is a
  concatenation, not a merge: right for a ledger nobody rewrites, wrong for a page two people edit.
  It is now scoped to the append-only zones alone, with git's ordinary conflict behaviour restored on
  `people/`, `topics/`, `decisions/`, `meetings/`. The patterns match inside a universe as well as at
  the root.
- **The gate** (`scripts/lib/remote-sync.mjs`), which decides whether a machine ticks at all. It is
  the piece a defect would hurt most, and it is the piece the field rehearsal broke — see below.

## The defect the rehearsal found, and why fourteen green tests did not

The release was rehearsed against a **copy of a real brain**, updated by the **old** engine so the
migration ran the way the field will run it. Three windows ticking at once, and **two got through the
gate** — the second dying on the git lock the first held. The lock file was created empty and filled
a moment later, so a rival reading it in that window found no holder, concluded the holder was dead,
and stole a lock whose owner was mid-fetch. Microseconds wide, hit in **three rounds out of four**.
The lock is now written elsewhere and hard-linked into place, so it appears already naming its holder;
a filesystem without hard links falls back to the previous behaviour.

**Why the existing tests could not see it.** All fourteen ran in **one process** and injected their
own liveness, so together they proved the gate's *decisions* and none of them proved its *exclusion*,
which happens between operating-system processes. The new test races **four real processes** released
together by a barrier file, twelve rounds, and demands exactly one winner. It fails **all twelve** on
the old code. (Its own first version was wrong too, caught by the Windows check: spawning four
processes takes hundreds of milliseconds and unevenly, so on a loaded machine the first child had
acquired, slept and exited before the last had started — and a rival reclaiming a dead holder's lock
is the gate working. The barrier plus an injected `isAlive` is what turned the weather into the
subject.)

## Quality evidence

- **Mutation-tested on every half of what this release writes**, because a per-step target list is a
  plan artefact and the release is the **union** of them: the search-server half **82.89 % → 97.37 %**,
  the harness half **97.22 %** (batch A) and **82.14 % → 100 %** (batch B), and the duo-mode question
  the release was held for — **84.60 % → 98.92 %** on the three files it adds, **92.02 % → 95.45 %** on
  the ranges it changed elsewhere. Every survivor left is a named equivalent, in three classes.
  Findings in `maintainers/mutation/RESULTS.md`, newest-first.
- **Five findings worth a reviewer's minute**, all recorded there: a guard whose three riders no test
  ever saw apart (the arrivals-only case is the migration that reaches a brain predating the feature —
  the rehearsal proved it, no unit did); a type check that judged a `Buffer` it should have stood down
  on; the mutation runner itself **refusing a measurement it had really made**, fixed first; *"are
  these two spellings the same human?"* found written **three different ways**, one of which crashed on
  a `author:` field a human had typed a number into; and the live sync's registry wiring, exercised by
  **nothing** because every tick test injects its own — its only visible effect being a desktop banner
  no test may raise.
- **And half of that step's first-pass survivors were answered by DELETING production**, not by adding
  tests: fail-open written twice (a probe in front of a `try/catch` that already answered the same
  way), defaults both branches overwrite, and the re-validation of lists their reader had already
  normalised. The register says which, and why each was unreachable.
- **The marketing surface was re-read whole** (CONVENTIONS §10). One absolute promise this release
  turns into a half-truth — *"you share the generator, **never** the brain"* — corrected in the README
  and in EN-QUOI; two undersells added; the boards deliberately **not** re-rendered, with the
  reasoning written down and marked as the owner's to overrule.
- **Doctrine and docs**: ADR 0011 gained the trigger row for this clock (no new ADR), `SETUP.md` §7
  gained the interval, what merges by itself, what stops to ask, and the *"Sharing one brain with
  someone else"* perimeter.

## Migration and cost to existing brains

Brains that predate this release receive the new ignore rules and the delivered `.gitattributes` at
their next engine update — nothing to do by hand. **`indexSchemaVersion` is unmoved: no reindex is
owed.** `engineVersion` moves to `rag` **1.5.0** / `scripts` **1.15.0**, in the same movement as the
tag rather than a day earlier.

## What is deliberately NOT in this PR

- **Two measurements only the owner's own machines can make**: whether `git` can authenticate without
  stopping to ask for a passphrase (7.5), and how many `vault-rag` servers live when several
  conversations are open on one brain (the second half of 7.4). A red there is a follow-up fix, not a
  reason to withhold the release.
- **Two product statements flagged for his review** in `SETUP.md` §7, shipped in the branch and his to
  overrule.
- **The release title**, which is his to arbitrate among the three candidates in the note.

## The numbers, which age

**86 commits, 98 files, +14 123 / −122** against `main`, measured 2026-09-03. A count is a copy of
state; to refresh rather than trust it: `git diff --shortstat main...HEAD`.

**Merged as a merge commit, never squashed** — every release on this repo lands that way
(`git log --first-parent main`), and the tag goes on `main` once it does.
