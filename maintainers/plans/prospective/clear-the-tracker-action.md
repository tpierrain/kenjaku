<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- THE canonical plan for clearing the tracker. Opened 2026-08-23, hours    -->
<!-- after the v5.0.0 tag. It spans TWO releases by the owner's call the same -->
<!-- evening: v5.1 fixes only what an outside contributor reported, v5.2      -->
<!-- takes the rest. It also INHERITS v5.0.0's post-tag tail.                 -->
<!-- The `## 📍 STATE` block below is this file's only perishable content:    -->
<!-- do not restate it here, in another file, or in a resume header.          -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Action plan — clear the tracker, in two releases

## 📍 STATE — the only perishable block in this file · opened 2026-08-23

- **Next:** **v5.1, and nothing else.** Three issues, all reported from the field by an outside
  contributor, all one subject: [#71](https://github.com/tpierrain/kenjaku/issues/71),
  [#73](https://github.com/tpierrain/kenjaku/issues/73),
  [#74](https://github.com/tpierrain/kenjaku/issues/74) → § *v5.1*. Nothing is started.
- **Blocked on:** nothing. v5.1 is three defects with obvious tests and no design question; a session
  may open it today, test-first.
- **Owner's call pending:** **ONE, and it is about v5.2's shape** — § *THE ONE QUESTION*: should
  [#77](https://github.com/tpierrain/kenjaku/issues/77), the only open issue that can **lose a user's
  note**, really wait for v5.2, or ride along in v5.1? Recommendation inside; it does not block v5.1
  starting.
  - ⏸️ **Two inherited questions, deliberately not re-asked.** (1) Inside #78, a product question only
    he can answer: *is a brain's copy of the launcher README meant to link to the launcher's own docs
    at all?* (2) The `concurrency` group for `ci.yml` (recommendation: yes) — offered three times,
    gating nothing. **Do not offer either a fourth time**; they wait here until he raises them.
- **A session may, alone:** work **v5.1** test-first end to end, and write the macOS flake's
  instrument (§ *Inherited from v5.0.0*). **Not** tag, publish, push to `main`, write into
  `templates/fr/**`, or write into either of his two real brains.
- **One tidy-up is decided and NOT done** — § *The fold that is owed*. Five minutes of editing; it
  belongs to whoever opens v5.2's universe group.

> **The two-release split is the owner's, 2026-08-23**: *« ce serait bien de faire une petite issue
> pour bug fixer les issues remontées par Stefan ces prochains jours (une 5.1), puis de traiter les
> autres sujets en 5.2 »*. **The reason it is a good split, said out loud so nobody re-merges them**:
> the three v5.1 issues are the only ones a **person outside the project** took the trouble to report,
> and they are cheap. A contributor who is answered in days reports again; one who waits behind a
> nine-issue release does not. Everything in v5.2 is either the owner's own finding or the owner's own
> idea, and can wait a fortnight without anyone feeling ignored.

## Tracking

### v5.1 — a checker stops reporting healthy things as broken · milestone [`v5.1`](https://github.com/tpierrain/kenjaku/milestone/1)

_Reported by [@StefanPenndorf](https://github.com/StefanPenndorf), from a real vault._

- [ ] **1.** `/lint` resolves an image or attachment embed (`![[shot.png]]`) instead of calling it
      dangling — [#71](https://github.com/tpierrain/kenjaku/issues/71). The resolver only ever indexed
      `.md`, so every picture in every note reads as a dead link.
- [ ] **2.** `/lint` unescapes the alias pipe inside a table cell (`[[note\|alias]]`) before resolving
      — [#73](https://github.com/tpierrain/kenjaku/issues/73). A Markdown table forces the escape, so
      the checker looks for a filename that cannot exist.
- [ ] **3.** `/lint` stops flagging `backlog/` as an orphan zone —
      [#74](https://github.com/tpierrain/kenjaku/issues/74). The shipped constitution declares it and
      the engine writes into it: the checker is complaining about the engine's own work.
- [ ] **4. 📉 The release is measured by the number, not by the three fixes.** A real brain reports
      *"17 links point nowhere"* today, and #71 + #73 inflate that count. **A checker nobody believes
      is a checker nobody reads.** So the acceptance test is what the count says on a real vault
      afterwards, and the release note leads with that, not with three bug references.
- [ ] **5. Answer the reporter.** Each issue closed with what shipped and how it was verified
      (`CONVENTIONS.md` §10bis), and the release note names the contributor.

### v5.2 — the rest of the tracker · milestone [`v5.2`](https://github.com/tpierrain/kenjaku/milestone/2)

- [ ] **A. A note the engine writes for you is actually saved** — [#77](https://github.com/tpierrain/kenjaku/issues/77)
  - [ ] The persistence net covers the writes that `/consolidate` and `/file-back` produce, not only
        the ones a tool call made. Today the hook matches `Write|Edit`, and both skills route through
        scripts *on purpose* (conformant by construction), so their notes land on disk and nothing is
        committed while the session prints `✓ Refreshed`.
  - [ ] The brain's own stated contract in `CLAUDE.engine.md` stops being false about it.
  - [ ] 🥇 **First in v5.2, and alone if the rest slips** — it is the only open issue that can lose a
        user's work. See § *THE ONE QUESTION* before assuming it waits.

- [ ] **B. The delivered-docs link probe judges from where a file will live** — [#78](https://github.com/tpierrain/kenjaku/issues/78)
  - [ ] Resolve a shipped file's links **from its installed location**, not from where it sits in this
        repo, so `../sync-sources/SKILL.md` stops reading as broken.
  - [ ] ⏸️ Its **product half** is the owner's, and is parked in the STATE block above.

- [ ] **C. The active universe stops disagreeing with itself, silently** — [#68](https://github.com/tpierrain/kenjaku/issues/68),
      [#72](https://github.com/tpierrain/kenjaku/issues/72), [#66](https://github.com/tpierrain/kenjaku/issues/66)
  - [ ] Switching context says what it did **not** re-scope: retrieval is scoped server-side, the
        conversation window still holds everything read from the universe just left — #68
  - [ ] A day spent writing into one sphere while the pointer names another is **noticed**, rather
        than paid for only at retrieval time — #72
  - [ ] A fact that must never be re-derived wrong (the spelling of a client's name, most of all)
        reaches the session that needs it, after a `/clear` — #66
  - [ ] 🧭 **Design before code, and one ADR may come out of it.** These three are one subject seen
        from three angles, and fixing them one at a time is how three mechanisms end up disagreeing.
        Read [`harness-universe-blindspot-hardening-action.md`](harness-universe-blindspot-hardening-action.md)
        first: it already names why universe changes keep escaping green suites.

- [ ] **D. The brain acts instead of interrogating** — [#79](https://github.com/tpierrain/kenjaku/issues/79)
  - [ ] Graduated autonomy (silent / announce-then-do / genuinely ask) and plain language in every
        string the brain emits. The full model and the four steps are in the issue, carried over from
        [the archived plan](../archived/2026-08-23-restore-affordance-graduated-autonomy-action.md).

- [ ] **E. Out of both releases** — [#62](https://github.com/tpierrain/kenjaku/issues/62), the
      `/feedback` path that carries an engine-level friction upstream. **No milestone on purpose.** Its
      hard part is not the plumbing: **a friction is born inside a private vault and would travel to a
      public repository**, and the raw friction that produced #61 named a client, three colleagues and
      a slice of their business. That needs a design answer from the owner before any code, and
      nobody can size a de-identification design before it exists.

## 🎙️ THE ONE QUESTION — does the issue that can lose a note really wait for v5.2?

**#77 is the only open issue whose failure mode is silent data loss.** A note written by
`/consolidate` or `/file-back` lands on disk, the session prints `✓ Refreshed`, and nothing is
committed — so the brain's own promise (*everything I write is versioned, therefore revertible*) is
false for exactly those writes, and the user has no way to notice.

- **Leaving it in v5.2, as decided**: v5.1 stays a two-day, three-fix release with a single clean
  story to tell a contributor, and the loss window stays open for however long v5.2 takes.
- **Pulling it into v5.1**: closes the loss window sooner, and costs the clean story — #77 touches
  the engine's write path, so `CONVENTIONS.md` §10ter kicks in (a rehearsal on a copy of a real
  brain) and the *small* release stops being small.
- **Recommendation: leave it in v5.2 as he decided**, and mitigate instead: v5.1 is days, not weeks,
  and #77 is v5.2's first item rather than one of six. Only revisit this if v5.2 starts slipping past
  a week or two.

## 🧹 The fold that is owed — the universe reading list becomes part of group C

_(Decided 2026-08-23 while sorting `prospective/`; announced in [`studies/README.md`](../../studies/README.md);
**not executed**, because the session stopped there.)_

- [ ] Fold [`harness-universe-blindspot-hardening-action.md`](harness-universe-blindspot-hardening-action.md)
      (its M1 / M2 / M3) **into v5.2's group C**, then archive it as
      `archived/<date>-harness-universe-blindspot-hardening-action.md` and drop its line from
      [`ACTIVE.md`](../ACTIVE.md) § *Open, but NOT active*.
- [ ] **Why, and not just tidiness**: it is a plan nobody is working that says *why universe changes
      keep escaping green suites* — precisely the thing group C must not repeat. As a separate dormant
      plan it is read by nobody; as group C's own opening steps it is read by whoever fixes
      #68/#72/#66. Two carriers for one subject is the shape that produced the thirteen-file pile.

## 📓 33 observations on a real brain, never triaged

- [ ] [`studies/fleet-upgrade-field-feedback.md`](../../studies/fleet-upgrade-field-feedback.md) is a
      log of a real deployed brain crossing three versions. **33 of its observations have never been
      triaged** — each is either an issue worth filing or something to drop with a reason. Offered
      2026-08-23, not taken up. These are defects *seen on a machine*, which is the highest-value and
      least-read evidence in the repo.

## 🧊 Inherited from v5.0.0 — the tail that outlived its release

_(That plan is archived; these came here so it could close. They belong to no milestone.)_

- [ ] **The macOS flake gets an instrument.** Over 30 PR runs on the v5 branch: 25 green, 5 red, and
      **all five were the same test on macOS**, never Windows. It is inherited from `main`, not
      introduced, and it did not hold the tag. What is missing is not a fix but a measurement: record
      **which fail-open branch it takes** when it fails. `session-universe.mjs` deliberately kept its
      inline entrypoint spelling until after the tag precisely so this stays diagnosable.
- [ ] **The write guard, measured in the field (was S9-3).** Do its prompts become noise on a session
      that legitimately customizes an engine skill? Correct the first time, noise the tenth. Only
      living with it for a few days answers it, and the escape hatch (`/permissions`) already exists.
      **Nothing to build; something to notice.**
- [x] **The nightly mutation run on `main` fails every night, and it has TWO causes, not one**
      _(read at last 2026-09-02; unread since 2026-08-22)_. Every scheduled run still fails, back to
      2026-08-26 at least. Only `mutate · scripts` is red (`rag` and `local-mirror` pass), and it
      dies in Stryker's **initial test run, before a single mutant** — so the job has never been
      reporting a weak suite, it has been reporting an environment it cannot run in. Eight tests
      failed; the two causes split them four and four.
  - [x] **Cause 1, a truncated clone — fixed, PR [#85](https://github.com/tpierrain/kenjaku/pull/85).**
        `mutation-nightly.yml` checked out with bare `actions/checkout@v4` (shallow, no tags) while
        every `ci.yml` job running these same suites pins `fetch-depth: 0`. Four of the eight need
        real history: the QA fixtures replaying a brain from tag `v3.6.0` (EN, FR and the CRLF one)
        and `every waived sha is a real commit that is still reachable`. A hand-dispatched run on
        the fix branch confirms it: **8 failures → 4**.
  - [ ] **Cause 2, source-scanning guards versus instrumentation — DIAGNOSED, NOT FIXED, and it is
        a design call.** _Reproduced locally 2026-09-02 in a throwaway worktree off `main`, so it is
        measured and not inferred._ Four tests do not test behaviour at all, they **read the engine's
        own source text**: the byte fingerprints of a release's merge files, `every script an engine
        script SPAWNS is itself carried`, `no module composes a child-process request at the call
        site`, and the byte-dated doctrine fixture. Stryker's whole job is to **rewrite that source
        text** to inject mutants (157 files, 9 833 mutants), so those four fail under **every**
        configuration: `--inPlace` as CI runs it (4 fail), the `batch` config (3), and the committed
        sandbox config is worse (8 — it also lacks `.git`). ⚠️ Which means the note in
        `stryker.scripts.batch.config.mjs` saying *"the whole harness suite dry-runs green here"* is
        **stale**: it was true on 2026-07-28, before these guards were written.
    - [ ] **The evidence for whatever gets chosen**: skipping exactly those four by name makes the
          dry run pass in CI's own shape (verified with a throwaway probe config). So the run is
          four skips away from producing a score again.
    - [ ] **Option A, ten minutes**: skip them by name from the mutation command. Brittle — a
          renamed test silently un-skips — but the failure is loud, not silent.
    - [ ] **Option B, recommended**: each guard **detects an instrumented tree and skips itself,
          naming why**. It survives renames, and it puts the reason where a reader will look instead
          of in a CI flag. Costs four test files and their own tests, test-first.
    - [ ] Either way, dispatch the workflow by hand afterwards and read the score before the cron is
          trusted again — that was the rollout condition when this workflow was written.

## How each release is cut, when it gets there

Nothing new to invent: `CONVENTIONS.md` **§10** (re-read the marketing surface), **§10bis** (sweep the
tracker and close what the release covers — and these two are its first customers), **§10ter** (a
release that changes the update path owes one rehearsal on a copy of a real brain), **§11** (the note
is written for the non-developer first), **§7** (plan done = archived).

- **v5.1** touches `/lint` only, which is read-only over the vault: **§10ter does not apply**, and
  that is a large part of why it can ship in days.
- **v5.2** almost certainly triggers §10ter through #77, which changes what gets written into a
  brain. Budget the rehearsal rather than discover it at the tag.
