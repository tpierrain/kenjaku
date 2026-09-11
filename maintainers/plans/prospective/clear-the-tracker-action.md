<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- THE canonical plan for clearing the tracker. Opened 2026-08-23, hours    -->
<!-- after the v5.0.0 tag. Its first release (the bugfix one) shipped as      -->
<!-- v5.1.3 and its step detail is ARCHIVED; what is left is the rest of the  -->
<!-- tracker. It also INHERITS v5.0.0's post-tag tail.                        -->
<!--                                                                         -->
<!-- The `## 📍 STATE` block below is this file's only perishable content:    -->
<!-- ≤ 20 non-empty lines (CONVENTIONS §3ter), measured on hand-back by       -->
<!-- ~/.claude/hooks/plan-state-size-guard.mjs. Anything that will still be   -->
<!-- true next month goes DOWN into § History, never up there. Do not restate -->
<!-- the block here, in another file, or in a resume header.                  -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Action plan — clear the tracker, in two releases

## 📍 STATE — the only perishable block in this file · opened 2026-08-23

- **Next:** ▶️ **the product proposal for the whole open tracker** → § *v5.2 — the product proposal*.
  It is a **proposal**, not a start: no code is written against any of those issues until he has read
  it _(2026-09-12, his words: « ne pas attaquer les devs pour ces tickets pour l'instant »)_.
- **Blocked on:** nothing a session can unblock.
- **Owner's call pending:** the proposal above — keep its grouping, its order and its release cut, or
  change them. Three older questions sit in § *Questions the owner owns* and are **not to be re-asked**:
  #77's release slot, #78's launcher-README link, `ci.yml`'s `concurrency` group.
- **One thing waits on him and on nobody else:** dispatch the nightly mutation workflow by hand and
  **read the score** → § *Inherited from v5.0.0*. No session may declare that rollout condition met.
- **A session may, alone:** work v5.2 test-first **once the proposal is approved**, label and
  milestone issues on GitHub _(granted 2026-09-12)_, commit, push, and read what CI returns.
  **Not:** tag, publish, merge to `main`, write into `templates/fr/**` (one carve-out, § *History*),
  or write into either of his two personal brains.
- **Already delivered by this plan:** the bugfix release → § *v5.1 — delivered*. Every lesson it left
  and every branch it closed is in § *History*: finished, therefore not here.

## Tracking

> **The two-release split is the owner's, 2026-08-23**: *« ce serait bien de faire une petite issue
> pour bug fixer les issues remontées par Stefan ces prochains jours (une 5.1), puis de traiter les
> autres sujets en 5.2 »*. **The reason it is a good split, said out loud so nobody re-merges them**:
> the v5.1 issues are the only ones **people outside the project** took the trouble to report,
> and they are cheap. A contributor who is answered in days reports again; one who waits behind a
> nine-issue release does not. Everything in v5.2 is either the owner's own finding or the owner's own
> idea, and can wait a fortnight without anyone feeling ignored.

### v5.1 — delivered as v5.1.3, and its step detail is archived

Five issues, three subjects, shipped 2026-09-11 and archived the way §7 archives anything finished:
[`archived/2026-09-12-v5.1.3-bugfix-release-delivered.md`](../archived/2026-09-12-v5.1.3-bugfix-release-delivered.md).
That file holds the whole step detail — what was measured, what was rejected, the field rehearsal, the
mutation scores — and it is **the only place** that detail lives. Do not restate any of it here.

- [x] **Delivered** — [v5.1.3 — *The One Where It Stops Crying Wolf*](https://github.com/tpierrain/kenjaku/releases/tag/v5.1.3)
      _(2026-09-11 · `23efd5f` · [PR #97](https://github.com/tpierrain/kenjaku/pull/97))_. All five
      issues closed **with their evidence**, both reporters answered, marketing surface re-read, field
      rehearsal run against the branch on a real French brain.
- [ ] **One tail is open, and it needs the reporter rather than us** — the one-call throttling test
      behind [#80](https://github.com/tpierrain/kenjaku/issues/80): a plain search run from their own
      account, before any catch-up, which settles whether the ceiling was ours to trip. Nothing here
      can run it (their account, and the report is de-identified). It changes nothing that shipped —
      the pacing was written as the fix either way — so it is **a question to put to them**, not work
      to schedule.

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
  - [ ] ⏸️ Its **product half** is the owner's → § *Questions the owner owns*.

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

> ⏸️ **ANSWERED FOR NOW, 2026-09-11: it waits.** *"À l'issue de ça, on se reposera la question
> d'inclure ou pas le bug fix de la 77."* So the recommendation below is the standing decision, and
> **this section is not to be raised again until v5.1's five issues are done**. Keep it: the moment it
> is re-opened, the trade-off is already written out.

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

- [ ] 🗂️ **And a second tidy-up, found 2026-09-12 while archiving the bugfix release**: §7 says the
      plans listing in [`maintainers/README.md`](../../README.md) is updated in the archiving change,
      and **no plan archived since 2026-08-23 is listed there** — the practice lapsed silently for
      roughly a dozen files. Deliberately **not** fixed one entry at a time tonight: a listing that is
      right for one file and wrong for twelve reads as complete. Either re-sync the whole section in
      one pass, or replace it with a link to the folder and let the filenames (date-prefixed since
      §7) be the index. **Recommendation: the second** — a hand-written mirror of a directory is a
      copy, and copies go stale, which is the very thing §3bis is about.

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
  - [x] **Cause 1, a truncated clone — fixed and ON `main` since 2026-09-06, PR
        [#89](https://github.com/tpierrain/kenjaku/pull/89)** (it superseded PR
        [#85](https://github.com/tpierrain/kenjaku/pull/85), closed).
        `mutation-nightly.yml` checked out with bare `actions/checkout@v4` (shallow, no tags) while
        every `ci.yml` job running these same suites pins `fetch-depth: 0`. Four of the eight need
        real history: the QA fixtures replaying a brain from tag `v3.6.0` (EN, FR and the CRLF one)
        and `every waived sha is a real commit that is still reachable`. A hand-dispatched run on
        the fix branch confirms it: **8 failures → 4**.
  - [x] **Cause 2, source-scanning guards versus instrumentation — FIXED** _(the owner picked
        option B, 2026-09-02; commits on the same PR)_. Four tests do not test behaviour at all,
        they **read the engine's own source text**: the byte fingerprints of a release's merge
        files, `every script an engine script SPAWNS is itself carried`, `no module composes a
        child-process request at the call site`, and the byte-dated doctrine fixture. Stryker's
        whole job is to **rewrite that source text** to inject mutants (157 files, 9 833 mutants),
        so those four failed under **every** configuration tried: `--inPlace` as CI runs it (4
        fail), the `batch` config (3), and the committed sandbox config worst of all (8 — it also
        lacks `.git`).
    - [x] **What was built**: `scripts/lib/instrumented-source.mjs` answers one question — has this
          text been rewritten by the runner — and each guard asks it about the very files it is
          about to read, standing down with a sentence that says so. Neither a false red nor a
          silent green, and it survives a rename, which a skip-by-name would not.
    - [x] **The trap it was written around, and it fired**: the detector is itself engine source,
          read by the guards it protects, so a detector matching the bare word would silence all
          four on a clean checkout with nothing to see. It matches the runner's HASHED identifiers,
          its own test pins that — and caught the module's own doc comment before the wiring
          existed.
    - [x] **Verified in CI's exact shape**: `--inPlace`, full scope, in a throwaway worktree —
          *"Initial test run succeeded … the dry-run has been completed successfully"*. The nightly
          can produce a score again.
    - [ ] **What is left, and it is the owner's**: merge PR #85, then **dispatch the workflow by
          hand and read the score** before the cron is trusted again — that was the rollout
          condition when this workflow was written, and no session should declare it met.
    - [ ] ⚠️ **A stale note to correct while nearby**: `stryker.scripts.batch.config.mjs` says
          *"the whole harness suite dry-runs green here"*. It was true on 2026-07-28, before these
          guards were written; it is now true again for a different reason, and the comment
          explains neither.

## 🙋 Questions the owner owns — asked, and NOT to be re-asked

Each of these was put to him and is waiting on nothing but him. They live here, out of the STATE
block, precisely so that a session reading STATE does not mistake them for pending work.

- **Does the issue that can lose a note ride along early?** —
  [#77](https://github.com/tpierrain/kenjaku/issues/77). Asked **twice**; his answer on 2026-09-11 was
  *« à l'issue de ça, on se reposera la question »*, and the five were done that day. The standing
  recommendation is unchanged and the trade-off is written out in § *THE ONE QUESTION*. **Do not ask a
  third time** — it is now folded into the product proposal below, where he answers it once, in
  context, along with everything else.
- **Is a brain's copy of the launcher README meant to link to the launcher's own docs at all?** —
  the product half of [#78](https://github.com/tpierrain/kenjaku/issues/78). Only he can answer it;
  the engineering half (resolve a shipped file's links from where it will be installed) does not wait
  on it.
- **Should `ci.yml` get a `concurrency` group?** — recommendation: yes. Offered **three times**,
  gating nothing. It waits here until he raises it.

## 📜 History — what this plan has closed, and what it learned

_Durable by construction: everything below is finished, or is a lesson. All of it sat in the
`## 📍 STATE` block until 2026-09-12, which is exactly how that block reached **197 lines**. Nothing
here expires, so nothing here needs re-reading at a resume._

### The state block was itself the defect, and the rule already existed

_(2026-09-12, after a re-read of that block found **six** false entries in it.)_

- **The diagnosis is not length, it is mixture.** He proposed shorter plans; the evidence refused it.
  The worst of the six (*"the note lives only in a scratchpad"*) sat **four lines** from the entry
  contradicting it, so brevity would not have saved it; two others were falsified by the **outside
  world** (a new issue opened, a question answered), which no length protects against; and the long
  passages are what **prevented** mistakes that week (the de-identification constraint, *"do not lead
  with that number"*, #95's false premise). The real cause is that the block **mixed what expires with
  what never does** — history and lessons — so it grew, and once it is long the writing habit degrades
  from *re-read and correct* to *append on top*.
- **And the written rule was already there, which is the uncomfortable part.** `CONVENTIONS` §3ter has
  said *four keys, ≤ 20 lines* since 2026-08-22, and the harness's own `plans.md` says the save point
  is a **re-read**, never an append. Both were obeyed in spirit; neither was ever **measured**. So this
  was never a missing rule — it was a rule with no machine, which is the shape that fails silently.
- **What was done about it** _(2026-09-12)_:
  - [x] A machine-local hook, `~/.claude/hooks/plan-state-size-guard.mjs`, measures every **live**
        plan's STATE block on hand-back and names the ones over cap. It **counts lines and judges no
        content**, so it cannot be wrong about prose, and costs a millisecond. Archived plans are never
        counted: a guard that shouts about frozen history becomes noise, and noise gets switched off.
        43 self-tests, each verified to fail against a deliberately broken copy.
  - [x] The cap is **§3ter's own number (20)**, not a new one. One number in the prose and in the
        machine, or the machine teaches a second rule.
  - [x] The durable half moved down here; the delivered half moved to the archive. The block went
        **197 → under 20**.
  - [x] ⚠️ **The hook is machine-local, like `plan-carrier-guard`, so it does not travel.** Same
        belt-and-braces split as everywhere else: the rule is written in `CONVENTIONS` §3ter (the
        belt, it arrives with the clone) and the hook is the braces (it runs only where installed).

### The three unmerged branches were judged and dealt with

_(Closed 2026-09-09.)_ Each needed a **different** treatment, and *"merge the three"* was a bad
recommendation the owner caught, because it was made on their **status** (unmerged) rather than on
**whether what they said was still true**. Outcome: the two-humans study **merged** with a dated note
(which also repaired #84's link to a file `main` did not have); #80's analysis **transplanted by hand**
into the release, framing left behind; the mutation branch **dropped** as superseded, its target having
been archived with v5.0.0. All three branches are deleted, remote and local.

- 🔖 **The two commits that never merged, so their text stays recoverable** (`git show <sha>`, for as
  long as the remote keeps them): `docs/v5.1-takes-the-silent-source` → **`d983fd4`** ·
  `fix/mutation-debt-entrypoint-and-git-value` → **`ec339dd`**.
- 📌 **The reusable half is the lesson** — *judge content, not status*: never recommend
  merge / keep / drop from *"unmerged"* or *"old"*. Read it, and check it against today's code.

### "v5.1" in this file is a section name, not a version

The tag *The One with the Duo Mode* took `v5.1.0` on 2026-09-06 and carried none of these issues (this
plan was parked behind that work, by the door's own ordering). The bugfix release went out as
**`v5.1.3`** on 2026-09-11. Record of the earlier tag:
[`../archived/v5.1.0-code-review-fixes-action.md`](../archived/v5.1.0-code-review-fixes-action.md).

### A headline that went false under its own children — left on the record

The STATE block's opening line read *"on a branch, and nothing is merged or tagged"* for most of
2026-09-11, and was made false by the entries **nested under it**. That is the whole reason the
always-loaded save-point rule now says the save point is a **re-read of the block from the top**, never
an append to it. Kept here on purpose: it is the cheapest illustration of the failure the cap prevents.

### The `templates/fr/**` clause contradicts the EN/FR drift guard

This plan forbids a session to write into `templates/fr/**`. That clause was breached **twice** on
2026-09-11, deliberately, and the reason is structural rather than a judgement call: four of the
localized files are watched by the EN/FR drift guard, whose criterion is **unpaired commits**. An
English-only commit on any of them turns the suite red and leaves every later commit of the release
ambiguous. So the clause as written **cannot be obeyed** on a file the guard watches without abandoning
green-only commits.

- ⚖️ **Either the clause gains a carve-out for guard-watched pairs, or the guard gains a waiver path.**
  It is a contradiction in this plan, not a rule that was ignored. Until it is resolved, the standing
  practice is: ship both halves in one commit, and say so. **The French wording is his to correct**;
  nothing else under `templates/fr/**` is touched.

### The tracker has only ever come down on evidence, never by a bulk sweep

Since this plan opened, **seven** issues closed: #90 and #92 (v5.1.2 and v5.1.1, the latter on measured
field evidence), then the five the bugfix release carried — #71, #73, #74, #80, #95 — each closed with
a comment saying what shipped and how it was checked. Everything still open is open **deliberately**:
this plan says those are not started, and *not started* is not *closeable*.

- 🧾 **What the bugfix release did NOT close was reviewed one by one** (the half of §10bis that is easy
  to skip). The only near-miss was [#83](https://github.com/tpierrain/kenjaku/issues/83) — *an absence
  claim stated as general when only the vault and the chat tool were searched* — which shares #80's
  subject and is a **different defect**: #80 is *"the source could not answer"*, #83 is *"the claim is
  broader than what was searched"*. Fixing one does not fix the other.

### #96 was filed, not worked

_(2026-09-09, his instruction.)_ [#96](https://github.com/tpierrain/kenjaku/issues/96) — a **second
machine silently misses part of an engine update**. He suspected it out loud and reading the code
confirmed it: the Layer B self-heal gate (`self-heal-detect.mjs`) asks only *"is a skill missing?"* and
*"is an MCP server missing?"*, so a release that ships **a new hook**, **a new allowlist entry** or **a
new npm dependency** never triggers a reconcile on the machine that merely pulled. Same shape as the
harness drift he hit the day before: the files travel, the wiring that makes them run does not.

### Inherited from the v5.1.0 tag

Close [#84](https://github.com/tpierrain/kenjaku/issues/84) **when a real brain has received the live
sync** — the tag alone does not prove that, which is why it was not closed on publication.

## How each release is cut, when it gets there

Nothing new to invent: `CONVENTIONS.md` **§10** (re-read the marketing surface), **§10bis** (sweep the
tracker and close what the release covers — and these two are its first customers), **§10ter** (a
release that changes the update path owes one rehearsal on a copy of a real brain), **§11** (the note
is written for the non-developer first), **§7** (plan done = archived).

- **v5.1** touches `/lint` only, which is read-only over the vault: **§10ter does not apply**, and
  that is a large part of why it can ship in days.
- **v5.2** almost certainly triggers §10ter through #77, which changes what gets written into a
  brain. Budget the rehearsal rather than discover it at the tag.
