<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- THE canonical plan for live sync between machines (issue #84). Opened      -->
<!-- 2026-09-01. The `## 📍 STATE` block below is this file's only perishable  -->
<!-- content: do not restate it here, in another file, or in a resume header.  -->
<!-- Read top to bottom: state, then the tracking in working order, then the   -->
<!-- reference sections the tracking points into.                              -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Action plan — a brain open on two machines stays in step, and says what arrived

Tracker: [#84](https://github.com/tpierrain/kenjaku/issues/84). Background and the field case
that surfaced it: [`../../studies/two-humans-one-brain-study.md`](../../studies/two-humans-one-brain-study.md)
(candidate 4). Branch: `feat/live-remote-sync`.

## 📍 STATE — the only perishable block in this file · opened 2026-09-01

**Steps 1 to 7 are done, green and pushed** (CI read on each): the merge rule, the tick, the gate,
the entry point driven **as a process** on a real repo with a local remote, the clock in the search
server with its knob and its shutdown, the announcement that reaches the conversation at the owner's
next message, the banner for notes written by someone else, the doctrine and docs that say so, and
the rehearsal against a copy of a real brain.

> ✅ **THE OWNER'S GO IS GIVEN, AND THE NUMBER IS `v5.1.0`** _(2026-09-03, in conversation)_. His
> words: *"ok pour v5.1.0, go pour la release"*. So 8.3's "owner's call" is answered — **the tag is
> `v5.1.0`**, which is also the number the fingerprint table already carries (8.2ter therefore needs
> no re-run unless something else changes it) and the number the field rehearsal used.
>
> 🔬 **BUT 3.7 COMES FIRST, and it is a hole this plan never had a box for** _(found 2026-09-03, on
> the owner's question "is there mutation testing left?")_. Step 3 wrote the clock **inside the search
> server** — `rag/src/lib/remote-sync-scheduler.ts` (119 new lines), `remote-sync-interval.ts`, the
> shutdown seam and the wiring in `index.ts` — and **2.7 measured only the `scripts/` half**, six
> files, because that is what its own target list named. The rag half of this release has therefore
> **never been mutation-measured**, and CONVENTIONS §5quinquies asks for it the day the file is
> written. A mutation run changes production code often enough (measured four times on this branch
> alone) that doing it after the release note would invalidate the note. So: **3.7, then 8.1**.
>
> ▶️ **RESUME AT 3.7** (the mutation run: the rag half first, then the `scripts/` files changed since
> their own last run), **then 8.1** (marketing-surface re-read), 8.2, 8.2bis, 8.2ter, 8.2quater, 8.3,
> 8.4, 8.5 in that order. _(An earlier version of this block said "resume at 8.1"; 3.7 was found
> after it was written and comes first — corrected 2026-09-03, before any of it ran.)_
> **Nothing else blocks the cut.** His two measurements (7.5, and the server count of 7.4) stay open
> and do NOT gate the tag: they verify the feature on his own two machines, which no headless run
> can do, and a red there is a follow-up fix, not a reason to withhold the release.
>
> ✅ **THE SUB-PLAN IS NOT IN THE WAY EITHER.** The second feature this release carries — the duo-mode
> sub-plan [`duo-source-identity-action.md`](duo-source-identity-action.md) — **landed in full on
> 2026-09-03** (`415cd7c`), so it no longer blocks anything; open it only for that feature's own
> detail. Its own files **were** mutation-measured as they were written (`RESULTS.md`, the
> `source-key`/`brain-author`/`dated-note-path` batches), which is why 3.7's target list does not name
> them. Everything else outstanding is the owner's: two measurements only his machines can make
> (7.5, and the server count of 7.4), the product statements flagged for his review, and the tag.

- ✅ **2.7 is DONE** _(2026-09-02)_. Two passes over the six files this chantier writes: **86.17 %
  → 95.98 %**, and the gate — the piece that decides whether a machine ticks at all — **67.74 % →
  83.53 %**, whose fourteen remaining survivors are every one an equivalent. The table, the four
  defects the first pass actually found, and the reasoning behind the one gap deliberately left
  (an `fs` call failing with something other than `EEXIST`, which would cost a seam on the gate's
  hottest path) are recorded in `maintainers/mutation/RESULTS.md`, newest-first. **The gate was then
  re-measured, because step 7's fix rewrote it**: 83.53 % → 66.67 % (the fix added a branch no test
  reached) → **83.84 %** once that branch got the tests it deserved. Same file, same register.
- ✅ **STEP 7 RAN, and it earned its keep** _(2026-09-02 afternoon, the owner's go-ahead, commits
  `771403a` + `5f3dcf2`, CI green including the Windows tripwire)_. The rehearsal was driven against
  a copy of `~/mind-palace`, with the release tagged `v5.1.0` so the update was the one the field
  will perform, and a bare repository created in the work directory as the remote — never his.
  7.1 to 7.4 pass; what each proved is ticked at step 7.
  - 🐞 **It found a real defect, which is the whole reason this step exists.** Three windows ticking
    at once, and **two got through the gate** — the second dying on the git lock the first was
    holding. The cause was an ordering, not a decision: the lock file was created empty and filled a
    moment later, so a rival reading it in that window found no holder, concluded the holder was
    dead, and stole a lock whose owner was mid-fetch. Microseconds wide, and hit in **three rounds
    out of four**. The lock is now written elsewhere and hard-linked into place, so it appears
    already naming its holder; a filesystem without hard links falls back to today's behaviour.
  - 🔍 **Why fourteen green tests never saw it, and the rule that comes out of it.** Every one of
    them runs in ONE process and injects its own liveness, so together they prove the gate's
    DECISIONS and none of them prove its EXCLUSION — which happens between operating-system
    processes. The new test races four real processes, released together by a barrier file, twelve
    rounds, and demands exactly one winner. It fails **all twelve** rounds on the old code.
  - ⚠️ **And the first version of that test was itself wrong, caught by the Windows check.** Spawning
    four processes takes hundreds of milliseconds and unevenly: on a loaded machine the first child
    had acquired, slept and exited before the last had started, and a rival reclaiming a dead
    holder's lock is the gate working. The barrier plus an injected `isAlive` is what turned the
    weather into the subject.

- ⏸️ **WHAT IS LEFT OF STEP 7 IS HIS, and only his** — 7.5, the SSH check on the two real machines
  (unknown 5: can `git` authenticate without stopping to ask for a passphrase), and the half of 7.4
  that needs Claude Desktop rather than three tick processes: **how many `vault-rag` servers live
  when several conversations are open on one brain** (unknown 4, from 0.4). The exclusion those
  servers rely on is now proved; the count is not, and no headless run can measure it.
- 🔕 **A rule this chantier bought, the hard way** _(2026-09-02, `73a2379`, then `a04011a`)_. The
  mutation run raised REAL desktop banners on the owner's machine — one per arrival test, once per
  mutant — and **he is the one who noticed**. The suite runs the real entry point, which ends in a
  real native notification. Fixed on both halves (the process fixture passes the engine's quiet
  switch; `realTickDeps` takes the spawn as a seam, so the wiring is asserted on the request rather
  than on the screen), and the durable half is carved in `CONVENTIONS.md` §5ter as its own numbered
  rule: **anything that can surface outside the process is injected in tests, never merely switched
  off** — a switch is one mutant away from being on.
- 📄 **A documentation gap, WRITTEN and awaiting review — no longer available work**
  _(surfaced 2026-09-02, preparing a client briefing)_. Asked what a new owner must do about
  **Gmail, Drive, iCloud and Spotlight**, the repo answers cleanly for two and **says nothing at all
  about the other two**: there is no iCloud connector and no mention of one, and Spotlight appears
  nowhere outside marketing prose. Neither absence is wrong; both are **undocumented**, which is what
  makes a newcomer ask. The work, if it is wanted: a short subsection in `SETUP.md` §6 saying plainly
  that iCloud has no connector today (with the two practicable routes — import notes once through
  `/import`, or keep living documents on Drive) and that Spotlight is neither used nor to be
  configured, with one line on why the vault's own search is a different tool. ✍️ **WRITTEN, and
  awaiting his review** _(2026-09-02, `9e1117c`)_ — `SETUP.md` §6(e). He picked "write a proposal
  alone" over doing it together, so the draft is a draft: **both are product statements and neither
  is settled until he has read it.** It says a bit more than the plan asked, and each addition is a
  claim he may want to strike: that Apple Notes is a separate problem because it is not files at
  all, and that the brain must not live inside iCloud Drive (a file syncer and git fighting over one
  repository, when §7's private remote exists for that).
- 🧹 **This branch also carries work that is NOT #84's, and it is deliberate** _(2026-09-02)_. The
  nightly mutation measurement had been failing unread since 2026-08-22; it was read, diagnosed and
  fixed here, then **cherry-picked onto its own branch as [PR #85](https://github.com/tpierrain/kenjaku/pull/85)**
  so it can ship without waiting for this chantier. The commits therefore exist on **both** branches
  with identical content — whichever merges second will find them already applied. State for that
  work belongs to [`clear-the-tracker-action.md`](clear-the-tracker-action.md), not here.
- **3.6** (the `engineVersion` bump) trails deliberately, moved to step 8 — see there for why.
  The POC is closed: the `FileChanged` hook runs code but cannot speak to the conversation, so the
  immediate display falls back to the native banner (5.2) and the next-message announcement (4);
  5.1 is dropped.
- **Three things step 2.4 changed that were not in the plan** _(2026-09-02, all test-first,
  each with its own commit)_:
  1. **Arrivals are read from `ORIG_HEAD..@{u}`, not `ORIG_HEAD..HEAD`.** A rebase replays the
     machine's own unpushed commits with new SHAs, so the trace announced the person at the
     keyboard as the author of what had just arrived. The upstream ref does not move during a
     rebase, so that range names the incoming commits and nothing else _(commit `546ead4`)_.
  2. **The ignore line has to reach ALREADY-DEPLOYED brains**, and `.gitignore` is carried by no
     engine regime. Untracked and unignored, the trace makes the tree dirty → the next tick
     defers → the feature silently does nothing on the very brains that just received it, while
     the sweep commits the trace and publishes one machine's arrivals to the other. Delivered
     the way the two migrations before it were: surgically, inside `reconcileBrain`, on the
     update **and** the self-heal path.
  3. **`lib/gitignore-entry.mjs`** now owns the "does this line already cover that path?"
     decision, once. `ignore-base-settings.mjs` (F4) delegates to it and keeps its own suite as
     the non-regression proof; a third hand-written copy of that matcher was the drift
     CONVENTIONS §5quater warns about.
- **Blocked on:** nothing. Unknown 4 (server count across Desktop conversations) is measured
  at 7.4; the per-machine lock (2.3) is built regardless.
- 🔜 **THE RELEASE GREW BY A CHANTIER — his call, against the recommendation, and the measurement
  backs him** _(2026-09-02)_. Two people on one brain can digest the same source twice, and
  `merge=union` keeps both silently where a conflict used to show. The sentence hides **three**
  defects: the same raw capture stored twice, the same day's synthesis written twice, and the same
  fact restated in a curated page (that third one is doctrine only, forever). His design call —
  **duo mode is a delegation, both instances hold the same powers, no division of duties** — struck
  out the cheap doctrine answer, leaving identity as the only mechanism that can stop a double.
  **His decision: the per-person paths AND the duplicate recognition both ship with this release.**
  The recommendation had been the paths alone; he judged duo mode unusable without the rest.
  - ✅ **The Gmail frontier is measured** (§ *What the measurement returned*): the connector
    **cannot** read a delegated mailbox — no tool takes a mailbox argument, so this is structural,
    not an assumption — and a universal mail identifier both **exists** and is an **exact, working
    lookup key** (`rfc822msgid:` returned precisely the one message). Still unmeasured, and now
    harmless: whether a forward preserves it.
  - 🟢 **The design changed under the measurement**: the key is **sender + timestamp + subject**,
    free in the cheapest formats and identical across copies whatever the transport — not the RFC
    `Message-Id`, whose only access path is a full raw-message fetch, i.e. exactly what the fan-out
    exists to keep out of context. The red risk is downgraded: no fuzzy matching, so nothing can
    silently drop a real mail.
  - 🗝️ **The identity is PER SOURCE TYPE, and mail is the hard case, not the model** (§ *Slack and
    Calendar measured too*). Slack keys on `channel_id + ts` and Calendar on the event id, both free
    and **shared by construction** — one object on one server, not two copies. Only mail needs the
    composite. Calendar even reads **across accounts** (`calendarId` takes an email address), which
    is what delegation failed to be for mail.
  - ▶️ **The chantier has its own plan now**:
    [`duo-source-identity-action.md`](duo-source-identity-action.md) _(opened 2026-09-02)_. It is a
    **sub-plan reached through this one**, it owns its own state, and **it blocks step 8**. It was
    written to be run autonomously overnight from a cleared context, and it carries the two design
    calls taken without him. The release number is still the owner's, and it now covers two
    features, not one.
  Shaping, risks and the measurement live in § Why no duo mode → *"But two people on one brain CAN
  digest the same source twice"* and its subsections; this line restates none of it.
  decision 3; which tag it is gets settled at step 8 against the v5.1 promise in
  [`clear-the-tracker-action.md`](clear-the-tracker-action.md)).
- **A session may, alone:** run steps 0 to 7 test-first end to end, on this branch, pushing
  every green commit and reading its CI — **and, since 2026-09-02, every step of the sub-plan
  [`duo-source-identity-action.md`](duo-source-identity-action.md)**, which now stands between this
  plan and its step 8. **A French twin is written WITH its English source, in the same commit** —
  that is what the drift guard asks, and the old "never write under `templates/fr/**`" clause was a
  boundary copied from another plan's one-off case (lifted 2026-09-03). Not: tag, publish, push to
  `main`, or write into either of the owner's real brains.

## Tracking

### 0. The POC settles the unknowns of the immediate display (before any engine code)

Throwaway folder in the session scratchpad (`poc-filechanged/`), nothing in Kenjaku, nothing in
a real brain.

- [x] **0.1** The `FileChanged` matcher _(2026-09-01, POC on the maintainer's Mac)_: dots,
      dashes, underscores and `|` all match (`remote_arrivals`, `remote-arrivals.json`,
      `arrivals|other` each fired); **only files at the project root fire** (the same names
      under `.cache/` fired nothing); stdin carries `session_id`, `transcript_path`, `cwd`,
      `hook_event_name`, the absolute `file_path` and `event: "change"`. Consequence: the trace
      is `remote-arrivals.json` at the brain root, gitignored (2.6 adjusts the ignore rule).
- [x] **0.2** The display — **negative** _(2026-09-01, CLI v2.1.220, owner at the keyboard)_:
      the hook ran four times, yet nothing showed on screen while idle, nothing reached Claude
      at the next turn (no witness word), and the session transcript holds no entry at all
      between the two turns. Tried both output shapes (`hookSpecificOutput.additionalContext`,
      then top-level `additionalContext` + `systemMessage` + `continue`). Verdict: on this
      version `FileChanged` is a way to *run code* when a file lands, never a way to *tell*
      the human or Claude anything. Desktop not tried: same engine, and nothing left to gain.
- [x] **0.3** The OS banner from a Node child with no terminal: `osascript … display
      notification` returns ok and the banner shows _(2026-09-01, on the maintainer's Mac)_.
- [ ] **0.4** Several Desktop conversations on one brain: how many `vault-rag` servers live,
      and whether background conversations keep theirs alive after minutes. **Moved to 7.4**
      (measured on the rehearsal copy); the per-machine lock (2.3) is built either way.
- [x] **0.5** `git ls-remote` from a child with no terminal and prompts forbidden
      (`GIT_TERMINAL_PROMPT=0`, `GIT_ASKPASS` inert, `ssh -o BatchMode=yes`): answers in 1 s
      _(2026-09-01, the maintainer's machine; the target machines are checked at step 7)_.
- [x] **0.6** Verdict _(2026-09-01)_: trace `remote-arrivals.json` at the brain root
      (gitignored); no client displays anything while idle; **5.1 dropped**, the immediate
      signal is the native banner (5.2) and the announcement lands at the next message (4).
      No new hook entry, so the update path is unchanged; the rehearsal (7) stays anyway.

### 1. Two people appending to the same note no longer conflict

- [x] **1.1** _(2026-09-01)_ Failing test first: a real temp repo with a local remote, two clones appending to
      the same `vault/daily/*.md`, the second rebase leaves **no markers and both lines**
      (`core.autocrlf false` pinned for Windows CI).
- [x] **1.2** _(2026-09-01)_ `.gitattributes` gains `vault/**/*.md merge=union` (see § A).
- [x] **1.3** _(2026-09-01)_ `.gitattributes` enters the `replace` regime of `engine-manifest.json` so an engine
      update delivers it to existing brains (decision 4); the manifest-integrity tests still pass.
- [x] **1.4** _(2026-09-02)_ The frontmatter check after a merge (§ A, the honest limit): a merged note whose
      header no longer parses makes the tick abort. Pinned twice — against a fake `checkNote`
      in 2.1, and through the entry on a real repo where both sides retitle the same note and
      `union` leaves two `title:` lines, judged by the ENGINE's own parser (2.4).

### 2. The brain pulls the remote on its own while a window is open

- [x] **2.1** _(2026-09-01)_ Failing tests first, `scripts/lib/remote-sync.test.mjs`: fake `git` keyed on the
      **whole command**, call sequence pinned by `deepEqual` (CONVENTIONS §5ter). Cases: no
      remote / no upstream → nothing; dirty tree → deferred, nothing run; rebase in progress or
      `index.lock` present → nothing; probe equal → silence, no file written; behind → rebase,
      arrivals trace with files and authors, then push script invoked; conflict → `rebase
      --abort`, blocked trace, tree intact; merged header invalid → abort; lock held → yield.
- [x] **2.2** _(2026-09-01)_ `scripts/lib/remote-sync.mjs`: the pure tick (§ B), `git` injected as
      `(args) → {out, ok}` like `startup-sync.mjs`; reuses `treeState` from `repo-status.mjs`,
      the rebase-in-progress probe from `universe-persist.mjs`, `shouldPush` from
      `git-push.mjs`; writes the trace as an atomic rename.
- [x] **2.3** _(2026-09-01, `remote-sync-gate.mjs` + 8 tests)_ The per-machine lock `.cache/remote-sync.lock` (`{pid, lastTickAt}`, `O_EXCL`
      creation, dead or stale holder reclaimed after 10 min): one effective clock per machine
      whatever the window count (§ Risks 1). Tested with two fake holders.
- [x] **2.4** _(2026-09-02, `85b859e` — 25 tests)_ `scripts/remote-sync.mjs`: the thin entry, **run as a process** in
      `scripts/remote-sync.test.mjs` (CONVENTIONS §5bis) on a real temp repo + local remote,
      including the real `union` case of 1.1 through the entry point; git env for the child:
      `GIT_TERMINAL_PROMPT=0`, inert askpass, SSH batch mode, 20 s kill timeout per command.
      Two departures from the design above, both forced by a repo guard and both improvements:
      the child-process request is composed as a **value** (`buildGitInvocation`, §5ter debt 2,
      so the kill timeout and the closed doors are asserted rather than trusted), and the gate's
      minimum gap **follows `REMOTE_SYNC_INTERVAL`** instead of the 90 s constant — a gate of
      90 s against a configured clock of 30 s would silently drop two ticks out of three.
- [x] **2.5** _(2026-09-02, `85b859e`)_ The entry is added to the `replace` list of `engine-manifest.json` (a top-level
      script is listed file by file; `scripts/lib/**` travels by glob).
- [x] **2.6** _(2026-09-02, `85b859e`)_ `.gitignore`: the lock and last-tick marker live under `.cache/` (already ignored);
      the trace `remote-arrivals.json` sits at the brain ROOT (POC 0.1) and needs its own ignore
      line, proven by the process-level test (a tick leaves `git status` clean). **Plus the half
      the plan had missed**: `.gitignore` reaches no deployed brain by regime, so the line is
      also delivered by a surgical migration inside `reconcileBrain` (update **and** self-heal),
      through the new `lib/gitignore-entry.mjs` — see the STATE block for why it is not optional.
- [x] **2.7** _(2026-09-02, `6b5bbd9` + the recheck)_ Mutation run on the new files the day they are written
      (`maintainers/mutation`, commit then mutate); one line each in `RESULTS.md`. Targets:
      `scripts/remote-sync.mjs`, `scripts/lib/remote-sync.mjs`, `scripts/lib/remote-sync-gate.mjs`,
      `scripts/lib/gitignore-entry.mjs`, and — written after this line was first drafted —
      `scripts/lib/remote-arrivals.mjs` and `scripts/lib/os-banner.mjs`. Six files, one batch.

### 3. The clock lives in the search server, bounded to the session

- [x] **3.1** _(2026-09-02, 14 tests)_ Failing tests first, `rag/src/lib/remote-sync-scheduler.test.ts`: injected timer
      and clock, fixed interval with ±10 % jitter, one tick in flight (the next waits), re-armed
      in `finally` after a failure, stopped on shutdown, `0` disables.
- [x] **3.2** _(2026-09-02)_ `rag/src/lib/remote-sync-scheduler.ts` (§ C), same shape as
      `local-mirror/src/auto-sync-scheduler.ts`.
- [x] **3.3** _(2026-09-02)_ `rag/src/lib/remote-sync-interval.ts`: `REMOTE_SYNC_INTERVAL` parser (`/^\d+$/`,
      `0` = off, malformed → default 90), on the model of `local-mirror/src/lib/sync-interval.ts`.
- [x] **3.4** _(2026-09-02)_ Wired in `rag/src/index.ts` only when `persistenceApplies(manifest)` (never on the
      generator), through the existing `buildScriptRunner`; the tick is an async child, a search
      never waits on it. **Plus the half the plan had not named**: the shutdown. The clock now
      has its own seam in `vaultShutdownPlan` (`stopRemoteSync`), and a background loop that
      refuses to stop no longer takes the other one down with it — a clock outliving its window
      would keep pulling into a brain nobody is looking at, and fight the next session for
      `.git/index.lock` from a process with no window at all.
- [x] **3.5** _(2026-09-02)_ `.env.example` documents the variable, commented out, under ADVANCED / OPTIONAL
      (reaches new installs only: the default lives in code). `indexSchemaVersion` untouched.
- [ ] **3.7** **Mutation run on the rag half of this release** — the box step 3 never had, added
      2026-09-03 before the cut. Config: `maintainers/mutation/stryker.rag.config.mjs`, one line per
      file in `RESULTS.md`, newest-first. Targets, in this order (biggest new surface first):
      `rag/src/lib/remote-sync-scheduler.ts` (new, 119 lines), `rag/src/lib/remote-sync-interval.ts`
      (new), `rag/src/lib/shutdown-plan.ts` (the `stopRemoteSync` seam), `rag/src/index.ts` (the
      wiring), and `rag/src/lib/frontmatter-parser.ts` + `rag/src/lib/campaign-persist.ts`, both of
      which this branch changed **after** their last measurement (97.87 % / 2026-08).
      **And the `scripts/` files changed since their own last run**, which 2.7 and 4.7 did not
      cover: `scripts/lib/filed-note.mjs` (+32, the `sources` composition), `scripts/lib/
      actions-log-seed.mjs`, `scripts/prompt-restart-nudge.mjs` (+49), `scripts/lib/
      instrumented-source.mjs` (+54), `scripts/lib/ignore-base-settings.mjs`,
      `scripts/lib/reconcile-brain.mjs`, `scripts/lib/wiki-lint.mjs`.
      ⚠️ **Expect it to change production code**: it did on all four earlier passes of this branch,
      which is why it comes before the release note rather than after.
- [ ] **3.6** ~~`engineVersion.rag` and `engineVersion.scripts` bumped in the manifest~~ →
      **moved to step 8, on the owner's own rule** _(2026-09-02)_. Commit `32a6ec4`: *"a bumped
      version that is not published makes a fresh install stamp itself with a version that was
      never released"*. The bump lands **in the same movement as the tag**, not a day earlier.
      The table it will apply: `rag` 1.4.0 → 1.5.0 (a new scheduler and its knob),
      `scripts` 1.14.0 → 1.15.0 (a new entry point and two new lib modules),
      `rag/package.json` `version` in step with `engineVersion.rag`, `local-mirror` and
      `constitutionTemplate` unmoved, `indexSchemaVersion` unmoved (no reindex is owed).

### 4. At the next message, the brain says what arrived, or guides the merge itself

- [x] **4.1** _(2026-09-02)_ Failing tests first in `scripts/prompt-restart-nudge.test.mjs`: arrivals → a
      directive to Claude (≤ 360 chars, files and authors, "say it in one sentence, then
      answer"); blocked → the merge-guidance directive (§ D); nothing new → nothing emitted;
      `announcedAt` written once; no `git`, no network in the hook. Plus: a restart pending
      **and** an arrival ride in ONE payload (`additionalContext` is a string, not a list),
      blocker first; and a stamp that cannot be written still lets the announcement out.
- [x] **4.2** _(2026-09-02, 18 tests)_ `scripts/lib/remote-arrivals.mjs`: pure reader and formatter of the trace, using
      `plural.mjs` for agreement (no hand-rolled `(s)`). It also became the **one owner of the
      trace's bytes** — `buildTrace` moved here out of the entry point, because the writer and
      the reader are two top-level scripts and those may not import each other. Two truths the
      formatter refuses to blur: a pulled engine file is never called a note, and a list that
      would overflow the budget gives up its names one at a time rather than truncate the
      instruction.
- [x] **4.3** _(2026-09-02)_ `scripts/prompt-restart-nudge.mjs` reads the trace after the restart flag and emits
      the directive in the same `hookSpecificOutput.additionalContext` channel.

### 5. The arrival shows at once, and a banner reaches the person even in another app

- [x] **5.1** ~~`FileChanged` hook entry for an immediate `systemMessage`~~ **dropped**
      _(2026-09-01, POC 0.2: the event cannot speak to the conversation)_. No new hook entry;
      the immediate signal is 5.2 alone.
- [x] **5.2** _(2026-09-02, `scripts/lib/os-banner.mjs` + 13 tests)_ The native banner from the tick (§ D bis 2): macOS `osascript`, Windows
      PowerShell toast, otherwise nothing; only when an incoming author differs from the local
      `git config user.name`; at most one per tick; `REMOTE_SYNC_BANNER=0` disables (and so do
      `CI` and the engine's existing `SBG_NO_NOTIFY`). Tested through an injected notifier, and
      documented in `.env.example` beside the interval. It is a SECOND implementation of "raise
      an OS notification" (`rag/src/lib/notify.ts` is the first) and could not be otherwise: the
      scripts are plain `.mjs` and cannot import the TypeScript package, nor it them. The
      escaping rules are deliberately identical and each is pinned by its own test.

### 6. The doctrine and the docs say it

- [x] **6.1** _(2026-09-02)_ ADR 0011 amended in place (CONVENTIONS §6bis): a fifth row in its trigger table
      ("remote pull: the server's clock, on an interval, only on a clean tree"), prior art named
      (ADR 0032 for the timer and lock, ADR 0037 for the persistence path). No ADR 0041. Written
      timeless (§6ter — no dated "AMENDED" scar), and the section it gained answers the question
      the table alone would leave open: **why a timer is admissible here and nowhere else** — the
      event happens on another machine, so nothing local can observe it.
- [x] **6.2** _(2026-09-02)_ `SETUP.md` §7: the sentence "during a session, `/sync` brings in the other
      machine's changes" rewritten (a new "While you work" subsection: what it does, what it says,
      the two `.env` knobs, and that `/sync` remains for whoever prefers to do it by hand); the
      trust note (§ Risks 5) added without drama — *"the same decision as sharing a machine, not
      the one as sharing a document"*.
- [x] **6.3** _(2026-09-02)_ `README.md`: one bullet in the persistence narrative ("and it catches up
      mid-session"), plus one clause in the determinism ladder, which claimed *"real event
      triggers, not timers"* and now names its single exception rather than being quietly false.
      **§10 verdict on the boards: the copy still holds, no re-render.** Neither board claims a
      brain syncs only at session start: `board-flow` describes the answer→catch-up→amend→save
      loop (unchanged), and `board-anatomy` lists the hooks (auto-commit, auto-push, reconcile) —
      and this feature adds no hook, since 5.1 was dropped.
- [x] **6.4** _(2026-09-02, verified untouched)_ `.claude/skills/sync/SKILL.md` **not modified** (stays the manual door and the
      assisted resolution; it needed no edit at all, so its French twin needed none either).

### 7. Rehearsal on a copy of a real brain (the update is driven by the OLD engine)

> ✅ **Ran 2026-09-02, on the owner's explicit go-ahead**, against a copy of `~/mind-palace`. What it
> found, and the fix that came out of it, are in the STATE block.

- [x] **7.1** _(2026-09-02)_ `node maintainers/qa/field-rehearsal/rehearse.mjs --brain ~/mind-palace --tag v5.1.0`
      — the tag matters: with the brain already installed at `v5.0.0`, rehearsing against `v5.0.0`
      measures an update to the version it is already on. Exit 0. `source.ref` moved `v5.0.0` →
      `v5.1.0`, **471 engine files swapped**, and the owner's territory came back **byte-identical**.
      Verified on the copy afterwards, piece by piece: `vault/**/*.md merge=union` present in
      `.gitattributes`, the five new `scripts/lib/` modules and the `remote-sync.mjs` entry point
      delivered, the `rag` scheduler and its knob delivered, and — the one that had to be checked
      because no engine regime carries it — **`remote-arrivals.json` present in the copy's
      `.gitignore`**, which is 2.4's surgical migration reaching a brain that predates it.
      The "hook entry reconciled" this step used to promise is moot: 5.1 was dropped, so the release
      adds no hook entry at all.
> 🛑 **THE REMOTE FOR 7.2 TO 7.4 IS A BARE REPOSITORY IN A TEMP DIR, NEVER THE OWNER'S OWN**
> _(2026-09-02, his question, and he was right to ask it)_. 7.1 is harmless by construction: the copy
> is taken without `.git`, so it has no remote and a push home is not expressible. **7.2 to 7.4 are
> not**, because a sync test is made of pushes and pulls, and it therefore needs a remote to exist.
> Point either clone at `git@github.com:tpierrain/mind-palace.git` and the test's own commits land in
> his real repository and reach his other machine at its next pull — the exact accident he named. So
> the remote is created by the test, `git init --bare` under the work directory, and the two clones
> are clones **of that**. What this does not prove is the one thing his remote would have: that `git`
> can authenticate over SSH without asking for a passphrase. That is unknown 5, it is 7.5, and it
> belongs on his machines with him present either way.

- [x] **7.2** _(2026-09-02)_ A note pushed from the second clone (authored by someone else) arrives on
      the first tick: outcome `arrived`, the trace naming the file and the author, the note on disk,
      the tree clean. The announcement then reaches the conversation — the hook emits
      *"📥 The brain synchronised on its own: 1 note from … arrived since the last message…"* — and
      **only once**: the next message carries nothing, `announcedAt` having been stamped. The
      immediate display is 5.2's banner, which was deliberately switched off for this run
      (`REMOTE_SYNC_BANNER=0`) rather than raised on the owner's screen: §5ter's rule, and the
      wiring is asserted on the request in the suite.
- [x] **7.3** _(2026-09-02)_ Both clones append to the same note without knowing about each other; the
      tick rebases and the **union merge keeps both lines, in order, with no markers and no human**.
      Two runs of it: one with push off — the tick correctly kept its work local, `secondbrain.autopush`
      being opt-in — and one with push on, where the merged note went back to the remote and the
      second machine picked it up on an ordinary pull. **Two machines converge, unattended.**
      ⚠️ One behaviour worth knowing, and it is by design: a tick whose probe finds the remote equal
      returns `up-to-date` and pushes nothing, so a local commit made while nothing was arriving
      waits for the Stop hook's auto-push. The tick pushes what it REBASED, not everything pending.
- [x] **7.4** _(2026-09-02)_ Three tick processes released at once on the copy: **one `arrived`, two
      `gated`**, the note landing exactly once, and no `index.lock` left behind — five rounds out of
      five. It took the fix above to read that way: before it, three rounds in four had a second
      window through the gate, dying on the first one's git lock.
      - [ ] The half no headless run can do: **how many `vault-rag` servers actually live** with
            several Desktop conversations open on one brain (unknown 4, from 0.4), and whether a
            background conversation keeps its own alive. The lock is proved; the count is not.
- [ ] **7.5** Unknown 5 re-checked on the target machines' SSH setup (step 0.5 covered only the
      maintainer's). **His, and only his** — it asks whether `git` can authenticate on those two
      machines without stopping to ask for a passphrase.

### 8. Release

> ▶️ **UNBLOCKED since 2026-09-03 (`415cd7c`): the sub-plan has landed in full.** By the owner's
> decision of 2026-09-02 this release ships **two** features, not one: live sync, and the duo-mode
> duplication work of [`duo-source-identity-action.md`](duo-source-identity-action.md). Its
> § *What is deliberately NOT in this plan* is the honest perimeter to describe at 8.2, and its STATE
> block holds that plan's detail — the only place that does.
>
> **This is where work resumes.** What is left below is the release itself, plus the two measurements
> only the owner's own machines can make (7.5, and the server count of 7.4) and the product
> statements that are his to overrule.

- [ ] **8.1** Marketing-surface re-read (CONVENTIONS §10): README, EN-QUOI-C-EST-DIFFERENT,
      SETUP, CONNECTORS, boards; verdicts recorded here.
- [ ] **8.2** Release note (§11): brief, non-alarmist, "What you get" grouped by moment, with the
      `### What you get` heading the `--check` prose is parsed from.
- [ ] **8.2bis** The `engineVersion` bump, applied here and not before (the table is at 3.6):
      a version that is bumped but unpublished makes a fresh install stamp itself with a
      version that never existed (`32a6ec4`).
- [ ] **8.2ter** **Re-run the fingerprint generator with the tag actually being cut**:
      `node maintainers/fingerprints/generate-fingerprints.mjs --version <tag>`. It was already run
      at `415cd7c` and stamped **`v5.1.0`**, because that commit ships the branch's first
      merge-regime bytes and the freshness guard stays red until the table recognises them. **If the
      tag is not `v5.1.0`, the table names a version that was never published** — the exact defect
      8.2bis exists against, one file over.
- [ ] **8.2quater** The PR into `main`, opened from `feat/live-remote-sync` and titled for the
      release (body in English, §11's register). **Every release on this repo lands as a merge
      commit on `main`** (`git log --first-parent main`), never a tag on a branch — so this is the
      step 8.3 tags. The merge itself is the owner's click unless he says otherwise.
- [ ] **8.3** Tag **`v5.1.0`** (settled 2026-09-03, see STATE) **on `main` once the PR is merged**,
      `git push --tags`, published release.
- [ ] **8.4** Tracker sweep (§10bis): #84 closed when a real brain **receives** the feature;
      say what was not closed.
- [ ] **8.5** This plan archived as `plans/archived/2026-09-0X-live-remote-sync.md`, STATE
      replaced by the CLOSED block, `ACTIVE.md` re-pointed, studies README untouched.

### 9. Decisions taken (all seven at plan approval, 2026-09-01)

- [x] **9.1** A `FEAT:` issue opens the chantier → [#84](https://github.com/tpierrain/kenjaku/issues/84)
      _(2026-09-01)_.
- [x] **9.2** `ACTIVE.md` re-pointed to this plan; the v5.1 lint work resumes after
      _(2026-09-01, this commit)_.
- [x] **9.3** The feature ships alone under the next tag (number settled at 8.3).
- [x] **9.4** `.gitattributes` enters the `replace` regime (1.3).
- [x] **9.5** Default interval 90 s, fixed, with jitter; progressive back-off when idle stays
      out of v1 (§ Risks 2.3).
- [x] **9.6** The `FileChanged` hook for immediate display, with the rehearsal it imposes (5.1,
      7); the banner alone if the POC's unknown 2 fails → **unknown 2 failed, banner alone**
      _(2026-09-01)_.
- [x] **9.7** The native banner on by default, only for another author's notes, disableable (5.2).
- [x] **9.8** No "duo mode" to declare: the remote is the declaration (§ Why no duo mode).
      **Re-put by the owner on 2026-09-02 for the duplication work, and confirmed with what it owes
      in exchange** — the reasoning and the announcement it buys live in the sub-plan, at
      [`duo-source-identity-action.md`](duo-source-identity-action.md) § *The owner's call: duo mode
      is implicit*.

## What the two people will see

- One writes a note; the other has a window open elsewhere: **within one interval** the other
  copy has the note, indexed, and the arrival is displayed at once; at the next message the
  brain says "2 notes from Claire arrived: daily/…, people/…" and answers. Nobody did anything.
- Both append to the same daily note the same afternoon: **it merges by itself**, both
  contributions stay, nobody is asked.
- When a merge needs a hand, **nobody types a command**. At the next message the brain speaks
  first: "While you were writing, your copy synchronised with Claire's. You both changed the
  same file; here are the two versions, I keep both unless you say otherwise." It asks a
  question only when the two versions genuinely contradict, with a default.
- Arrivals are named by their author, never by a machine (git author name of the other side).
- Nothing runs when no window is open: no daemon (ADR 0003).

## Why this does not bend the product

- Multi-machine is an existing feature (clone + `rehydrate`, the startup pull, `/sync`). One
  person with two open Macs has exactly the same gap. This completes it; it invents no
  "duo mode" and no multi-user concept (ADR 0034's doctrine stands).
- The mould exists in the search server: since ADR 0037 it commits and pushes on a quiet window
  by running `auto-commit.mjs` then `auto-push.mjs` as child processes
  (`rag/src/lib/campaign-persist.ts`, `persistence-scheduler.ts`). Git stays in `scripts/`; the
  server is only the clock. The pull follows the same path.
- The next-message announcement exists for another purpose: the `UserPromptSubmit` hook reads a
  local flag and injects a short directive, no git, no network. It gets a second thing to read.

## Design, brick by brick

### A. Automatic merge of notes: one native git line

- `.gitattributes`: `vault/**/*.md merge=union`. The built-in `union` driver resolves a
  conflicting hunk by **keeping both sides**, no markers, no per-machine configuration, during
  a rebase as during a merge. It is the "keep both" the `/sync` skill recommends by hand, applied
  on its own.
- Covers: two people appending to the same daily note, the same actions log, the same person
  note. By far the most frequent case.
- The honest limit: if both sides change the **same header line** (frontmatter), `union` keeps
  both lines and a duplicate key can make the note unreadable to the indexer. Parade: after a
  merge the tick re-reads the touched notes with the same header check as `vault-write-guard`;
  a note that fails makes the tick abort (`git rebase --abort`, local state intact) and the human
  is guided at the next message. If the field shows the case, the next step is a Kenjaku merge
  driver (header: local wins; body: union). Not for v1.
- Out of `union` on purpose: everything that is not a vault note (`CLAUDE.md`, `.vault-rag/*`,
  scripts). There a conflict stays a conflict, and the brain asks.
- `.vault-rag/active-universe` keeps its rule ("the machine you sit at wins"): outside `union`,
  a conflict on it blocks, and `/sync` applies the rule as today.

### B. The tick: a pure script, an injected git runner

Sequence of one tick (`scripts/lib/remote-sync.mjs`):

1. no remote, or no upstream → nothing;
2. dirty tree → **deferred**: the existing persistence commits first on its quiet window (never
   a commit of a half-written file, ADR 0011's cost 3 stands); rebase in progress or
   `.git/index.lock` present → nothing;
3. probe: `git ls-remote --heads origin <branch>`; SHA equal to `@{u}` → **total silence**, no
   trace, no sentence (a "nothing new" every 90 s is the alarm fatigue CONVENTIONS §5quater
   forbids);
4. `git fetch` then `git rebase @{u}`; success → files arrived (`diff --name-only ORIG_HEAD
   HEAD`), authors (`log --format=%an ORIG_HEAD..HEAD`), header check of merged notes (A);
   failure or failed check → conflict list (`diff --name-only --diff-filter=U`) then `git rebase
   --abort`;
5. trace `.cache/remote_arrivals` (name and place per 0.6; gitignored, per machine):
   `{ arrivedAt, files[], authors[], blocked: { files[] } | null, announcedAt | null }`,
   **accumulated** until announced, written by atomic rename;
6. then push through the existing path (`auto-push.mjs` as a child, under its
   `secondbrain.autopush` opt-in), so the other side receives at its next tick.

### C. The clock: in the search server, session-scoped

- `rag/src/lib/remote-sync-scheduler.ts`: fixed interval (default **90 s**, ±10 % jitter),
  injected timer and clock, one tick in flight, re-armed in `finally`, stopped on shutdown (no
  clock outlives the session). Same shape as `local-mirror/src/auto-sync-scheduler.ts`.
- Armed in `rag/src/index.ts` **only if** `persistenceApplies(manifest)`, through the
  `buildScriptRunner` that already runs the persistence scripts.
- `REMOTE_SYNC_INTERVAL` (seconds, `0` = off), a parser that never crashes boot.
- No index schema bump.

### D. The announcement: the next-message hook reads the trace

- `scripts/prompt-restart-nudge.mjs` emits a **directive to Claude** (`additionalContext`,
  ≤ 360 chars), never a sentence for the human:
  - arrivals: "N notes from <author> arrived since the last message: a, b, c (+k). Say it in one
    sentence, then answer. Re-read a note before editing it.";
  - merge to guide: "The sync found a conflict on <files>. Before answering: explain in plain
    words that both copies changed the same file, load the `sync` skill, redo the merge, keep
    both contributions by default, and ask only if the two versions contradict."
  - then `announcedAt` is written. Nothing to say → nothing emitted (existing rule).
- Three levels, quietest first: (1) vault notes: `union` merges, the brain only reports the
  arrival; (2) a note whose header duplicated: the brain repairs it itself (local value kept)
  and says so; (3) a non-vault file in conflict: the brain explains, proposes "keep both" or
  "keep yours", and asks for a confirmation.

### D bis. Better than "at the next message": what Claude Code allows (checked 2026-09-01)

1. **Displayed at once, without anyone speaking**: the `FileChanged` hook event fires
   **asynchronously while Claude is idle** when a watched file changes on disk. The tick writes
   its trace → the hook fires within the second → it returns a `systemMessage` ("📥 2 notes from
   Claire arrived: …", shown in the transcript) **and** the `additionalContext` for the next
   turn. It does not start a turn on its own (Claude speaks only when spoken to), but the person
   **sees** the arrival. Cost: one more hook entry in `settings.json.template`, hence step 7.
   Verified at the POC: matcher syntax and location (0.1), Desktop rendering of `systemMessage`
   (0.2; the docs say "any platform", ADR 0036 said "CLI only" at the time).
2. **A native banner** on top: the tick calls the OS notification (`osascript` on macOS, a
   PowerShell toast on Windows) when notes **from another person** arrive (git author differs
   from the local one: one's own notes from one's other Mac stay silent). Visible even when
   Claude's window is not in front; no role for Claude. At most one per tick, never for
   "nothing new". `REMOTE_SYNC_BANNER=0` disables.
3. **Making Claude react on its own**: MCP *channels* (a server pushing events into the
   session, Claude acting on them unprompted) exist but in **research preview**: an
   Anthropic-curated allowlist, a launch flag to confirm at every start
   (`--dangerously-load-development-channels`), Desktop undocumented. Not for v1 nor for a
   non-developer. Watch: the day a Kenjaku channel can be admitted, it is the perfect version
   of this brick.

Retained: 1 + 2 in v1, 3 on watch. The next-message reading stays the net when the
`FileChanged` hook did not run (window opened before the update, platform without it).

### E. Doctrine and docs

See steps 6.x. ADR 0011 amended in place, no new ADR; SETUP §7 and README updated; `/sync`
skill unchanged.

## Risks and side effects of the clock (reviewed 2026-09-01)

### 1. Several conversations on one machine = several clocks

- **Fact**: each Claude Code conversation starts its own MCP servers (one `vault-rag` per
  conversation). In Claude Desktop a background conversation most probably keeps its
  processes alive: five conversations = five servers = five clocks on one repo. ADR 0011's cost
  4, and it is real. Measured at 0.4.
- **Protection: one effective clock per machine.** A shared lock file `.cache/remote-sync.lock`
  (gitignored) carries `{ pid, lastTickAt }`. A tick runs only if the holder is dead or the last
  tick is older than one interval; otherwise it yields silently. Five windows or one: **one
  probe per 90 s per machine**. Dead or stale holder (> 10 min) reclaimed, as for the mirror
  (ADR 0032). Lock taken by atomic `O_EXCL` creation; the loser yields. Dedicated test.

### 2. "Hammering GitHub"

- **Fact**: `git fetch` is not a REST API call (whose limit is 5,000 per hour); it is git
  traffic over SSH or HTTPS, not metered the same way and with no published ceiling. Abuse
  detection targets volumes of another order.
- **Order of magnitude with protection 1**: 40 operations per hour per machine while a window
  is open; two machines: 80 per hour. Auto-push adds at most one per turn, already there.
- **Protections, in order**: (1) **probe before pulling**: `ls-remote --heads` asks only the ref
  list (a few hundred bytes); `fetch` + `rebase` run only when the remote SHA differs; an empty
  tick costs one SSH handshake; (2) **jitter** ±10 % so two machines do not hit in cadence;
  (3) **progressive back-off when idle** (the reserve knob, out of v1): after 30 min without an
  arrival the interval doubles up to 5 min, back to 90 s at the first arrival. Out of v1 because
  the first arrival of the day would wait up to 5 min and the measured cost does not justify it.

### 3. The network absent, slow, or asking for a password

- **Offline**: `ls-remote` fails → silence, next tick, no retry storm.
- **A `git` waiting for input** (SSH key with an unloaded passphrase, HTTPS without a credential
  helper) would hang forever in a child. Protection: `GIT_TERMINAL_PROMPT=0`, inert
  `GIT_ASKPASS`, `ssh -o BatchMode=yes`, 20 s kill timeout per command. A killed `git` = a missed
  tick, never a hang. `auto-push.mjs` (Stop hook, 30 s) has the same exposure today: checked on
  the target machines at 7.5.
- **Never on the server's thread**: the tick is an async child, like persistence; a search
  never waits on a fetch.

### 4. Git working while someone else works

- **An auto-commit at the same instant** (PostToolUse after a Claude write) → `index.lock`
  collision. Protection: the tick yields if `index.lock` exists and pulls only on a clean tree.
- **A rebase changing a note Claude just read**: the next `Edit` is refused by Claude Code
  ("file changed since read") and Claude re-reads. Healthy; the directive says "re-read before
  editing".
- **A guided merge in progress** (`/sync`, interrupted rebase): the tick detects `REBASE_HEAD`
  and yields.
- **The rebase rewrites unpushed local commits** (new SHAs). Nothing in the engine keeps a local
  SHA as a reference (to confirm by grep at 2.2: `.engine-base` provenance, restart flag, sync
  markers: all by content or path).
- **After a pull the watcher indexes the arrivals** → a campaign → persistence wakes 2 min later,
  finds a clean tree, commits nothing. A harmless no-op, checked in the logs at 7.4.

### 5. What a shared clone implies, clock or not

- A brain's repo contains **the engine** (`scripts/`, `rag/`): whoever can push to it can have
  code run on the other machine at the next session. True today with `/sync`; the clock only
  shortens the delay. The trust boundary is the private repo's collaborator list. Said in SETUP
  §7 without drama (6.2).
- `union` applies only to vault `.md`; a built-in merge driver executes nothing.

### 6. Battery, CPU, Windows

- A Node child of a few tens of milliseconds every 90 s: negligible.
- Windows: lock and trace by `path.join`, banner by PowerShell or nothing, `git.exe` without a
  shell wrapper (ADR 0017). The `FileChanged` hook exists on both systems.

## Why no "duo mode" to declare

- **The declaration already exists: the remote.** Without one (the install default) the clock
  does nothing, not even a network call. Wiring a remote (SETUP §7) is the gesture "this brain
  lives in more than one place"; live sync turns on under the same criterion as auto-push
  (`hasRemote && hasUpstream`). A second machine or a colleague: indistinct, on purpose.
- **Idle cost**: one probe per 90 s while a window is open, silent. The back-off knob exists
  (§ Risks 2.3) if the field asks.
- **What stays declared is human**: the "who is at the keyboard" paragraph of the constitution,
  written by the owner. Announcement names come from each side's git author name.
- **Off switch**: `REMOTE_SYNC_INTERVAL=0`.

### But two people on one brain CAN digest the same source twice, and this release removes the alarm

Raised by the owner, 2026-09-02, about the field case the study describes: an owner and their
assistant, two clones of one private repo, and — because the study's own §5/Q5 recommends a
forwarding filter so the assistant's connector sees the owner's mail — **the same email reachable
from both Claude accounts**. Checked in the code the same day:

- **No source carries an identity, and nothing records what has been digested.** `source_url` is
  written by exactly one producer, the Notion local mirror (`local-mirror/src/lib/markdown.ts`),
  which is idempotent because a page always rewrites its own file. Everything `sync-sources`
  writes — briefings, `actions-log.md`, `people/`, `topics/`, `raw-sources/` — carries permalinks
  **in prose** and no machine-readable id, and there is no ledger of "already seen". So a second
  brain cannot know a mail, a Slack thread or a Notion page was already distilled, and no later
  pass can detect that it was. The index has a `source_url` column and the citation renderer reads
  it for any note (`rag/src/lib/citation-renderer.ts`): the field exists engine-side and is simply
  never written outside mirrors.
- **What this chantier changes is the ALARM, not the duplication.** Before `merge=union` (1.2), two
  people filing the same day hit a conflict on `briefings/YYYY-MM-DD.md` and a human saw it. With
  union both texts are kept, no marker, no question — the right rule for an append-only ledger, and
  the reason a doubled digest now lands silently. `.gitattributes` is in the `replace` regime (1.3),
  so this reaches already-deployed brains at their next engine update.
- **What limits it today, and how much — the first read of this was too soft.** There is **no mail
  sub-agent** in the fan-out (the procedure has transcripts, chat, my-actions, calendar; mail is only
  in the skill's description) and no scheduler, so nothing hoovers a mailbox on its own: the trigger
  is always a question. That was written up as *"opportunistic, not systematic"*, and the owner
  pushed back on 2026-09-02 — **rightly**. Two people who share a brain share it **because they work
  the same dossiers**: an assistant exists to handle the owner's affairs. Overlapping questions are
  the normal case, not bad luck. The rate is question-driven, the collision is expected.
  The skill's novelty check already asks the main context to search the vault before presenting
  something as news; it works on subject matter, not on source identity, and it is prose.
- **The cheap fix removes the cause: one writer of record per source.** Two people sharing a brain
  name, per connector-fed source, whose brain distils it; the other reads the notes. For the field
  case that is the owner for mail — Gmail delegation still lets the assistant *read* the mailbox as
  a human. A paragraph in SETUP §7 and in the constitution template, no code. Candidate 6 of the
  study is the same idea, unpicked.
- **The proper fix is a chantier, not a pre-release patch**: a source identity in the frontmatter of
  anything written from an external source, checked against the vault before writing. The writer is
  an LLM, so it stays doctrine unless a deterministic refusal enforces it (the `file-back-note.mjs`
  shape). Not #84's, and not the release's. Shaped and costed below, because the owner read it as a
  release prerequisite and asked what it would take.

#### Shaping the source-identity chantier — asked for on 2026-09-02, and it splits in three

**"The same thing lands twice" is three defects wearing one sentence**, and they need three
different mechanisms. Conflating them is what makes source identity look like the whole answer.

| What doubles | Why | What actually fixes it | Cost |
| --- | --- | --- | --- |
| **A. The same raw capture** — one mail, one thread, one doc, stored by both brains | nothing records what has been digested | source identity in frontmatter + a lookup before writing | a chantier |
| **B. The same day's synthesis** — both write `briefings/YYYY-MM-DD.md`, union concatenates | the path is keyed by DAY, not by author | per-person paths for the per-day aggregates | one or two sessions, deterministic |
| **C. The same fact restated** inside `people/x.md` or `topics/y.md`, in two wordings | two writers, one curated page | nothing mechanical: the novelty check and `/consolidate`, both prose | doctrine only |

**B is the one that makes a duo vault look broken, and it is the cheap one.** Two briefings for one
day concatenated into one file, silently, is the shape a first duo would meet in its first week. The
identity it needs already exists and is already read (`git config --get user.name`,
`remote-sync.mjs:153`), and the channel to hand it to a session exists and is proven
(`additionalContext` at SessionStart, `session-universe.mjs`). It is study candidate 1, and it needs
no LLM discipline whatsoever: a different path cannot collide.

**C is honest doctrine and will stay so.** No machine tells "the same fact in other words" from "a
second, genuinely new fact" without a judgment call, and a wrong call here deletes real content.

**What A would take, step by step** (comparable in size to #84 itself, ADR included):

1. **An ADR: what a source identity IS.** Which sources have one, how it is spelled, what a note
   carries when its source has none, and whether it reuses `source_url` or gets its own key.
2. **The lookup** — a deterministic `known-source` script, one line of output, non-zero on a hit,
   in the exact shape the skill already calls for Slack (`set-universe-profile.mjs --check-slack`):
   pre-authorized, greppable, testable. **It must scan the notes, not the index**: a note that
   arrived by git seconds ago is not indexed yet, and an index-backed check would answer
   "never seen" precisely in the duo case it exists for.
3. **The writer guard** — `file-back-note.mjs` refuses a spec whose source identity the vault
   already holds, reusing the homonym-refusal shape it already carries.
4. **The producers** — `sync-sources` stamps the identity and runs the check before capturing.
   Prose, asserted the way the other disciplines are (`claim-discipline.test.mjs`,
   `connector-discipline.test.mjs`).
5. **Compatibility** — every note written before this has no identity, and "no identity" must read
   as *unknown*, never as *seen*; the linter must accept the new key.
6. **A rehearsal on two clones**, in step 7's shape, because nothing else proves it.

**The risks, worst first:**

- 🟠 ~~🔴~~ **The identity does not survive a forward** — *written before the measurement, and
  **downgraded** by it_. The fear was that a forwarded mail, being a different message to the
  connector, could only be matched by a fuzzy content fingerprint, which can silently drop a real
  mail. The measurement found a better key: **sender + timestamp + subject**, free in the cheapest
  formats, identical across every copy whatever the transport, and exact rather than fuzzy when all
  three must match. What remains is that **the Gmail-internal id is useless across mailboxes** (so
  the key must be the composite, never `id`), and that the forwarding behaviour of `Message-Id` is
  still unmeasured — which now costs nothing, since the design no longer leans on it.
- 🟠 **Enforcement is partial by construction.** A guard covers the deterministic write path; the
  LLM can always reach for `Write`. The guarantee is "usually", and a dedup one believes in but that
  leaks is worse than none, because it stops being checked.
- 🟠 **Failing direction.** The check must only ever *say* "already held" and leave the skip visible.
  A silent skip trades a duplicate for a loss, and a loss cannot be noticed from inside the vault.
- 🟡 **It touches the hottest doctrine surfaces**: a 553-line skill of hard-won prose and the
  linter's zone lists, whose universe blind spots already have a plan of their own
  (`harness-universe-blindspot-hardening-action.md`).
- 🟡 **B changes the vault's shape for every brain, not only duo ones** — old briefings stay at the
  old path, so type detection, the linter zones and consolidation must accept both spellings.
- 🟡 **The release slips** by a chantier the size of #84 if A is made a prerequisite.

**First recommendation, and the owner killed half of it the same day: B and the doctrine paragraph
are the prerequisites, A is not.** B removes the structural collision deterministically, the
paragraph looked like the only thing that works for forwarded mail, and A is a real chantier that
would not have covered the case it was asked for. If A is taken, it gets its own plan file; this
section is the shaping, not the plan.

#### 🛑 The owner's design call, and it strikes out the doctrine fix _(2026-09-02, his words)_

> *"c'est une mécanique de délégation dans laquelle la personne, la DAF, doit être capable de faire
> tout ce que le client lui peut faire habituellement avec son second cerveau… Je ne veux pas de
> répartition de travail, elle elle fait ci et lui il fait ça. Les deux mêmes marges de manœuvre et
> action pour les deux instances du même second cerveau, mais pilotées, activées, consultées par des
> personnes différentes."*

**Duo mode is a DELEGATION, not a split.** Both instances hold the same powers over the same
information; only the human at the keyboard differs. Three consequences, and they are load-bearing:

- ❌ **"One writer of record per source" is rejected.** It is a division of duties by definition, and
  a division of duties is exactly what this call forbids. The cheap doctrine fix is off the table,
  and with it the answer that covered mail-by-forward. **Dedup by identity is therefore no longer
  the nice-to-have half: it is the only mechanism left that can stop a double.**
- ✅ **Per-person paths (B) survive the call, and it is worth saying why**, because they look like a
  split and are not: nobody is assigned a subject, a source or a duty. Each person's own writing
  simply lands in their own file instead of two texts colliding in one, and either of them still
  does everything. B is also needed **whatever else gets built**: two people asking the same question
  each produce a synthesis, and no source identity can dedup two syntheses.
- 🟡 **"The same fact restated in a curated page" (C) gets worse under symmetry**, and stays
  doctrine-only. Two brains with identical remits will touch the same person and topic pages.

#### The frontier this opens, and it is a FACT to verify, not a preference _(2026-09-02)_

The owner's words: *"peut-être elles arrivent par des moyens différents, si c'est la délégation
Gmail, mais je ne sais pas comment ça marche."* **The transport is not indifferent — it decides
whether a machine key exists at all**, which is precisely why it cannot be left unverified:

| Transport | What the second brain sees | Can a machine dedup? |
| --- | --- | --- |
| **Gmail delegation** | the **same** message in the **same** mailbox, same Gmail id | ✅ trivially — if the connector can see a delegated mailbox at all |
| **Forwarding filter** | a **copy** in her own mailbox, **new id** | ❌ not by id; only a fuzzy fingerprint, which can drop a real mail |
| **The owner's Google account bound to her Claude** | the same mailbox, same ids | ✅ — but her own mailbox disappears from her brain (one Google account per Claude account) |

**Two facts were unverified and both were cheap to settle**, and everything downstream hangs on them:
whether the Claude Gmail connector reads a **delegated** mailbox (the study assumed not: the Gmail
API does not expose delegated mailboxes for consumer accounts, so *"delegation serves the human, not
the brain"*), and whether a **forwarded** copy still carries the original RFC `Message-ID` **and
whether the connector exposes it**. Measured below, on his go-ahead.

#### What the measurement returned _(2026-09-02, on the owner's own mailbox, two impersonal notification mails)_

- ✅ **The connector CANNOT read a delegated mailbox, and this is now structural, not assumed.**
  Every Gmail tool is documented against *"the authenticated user's Gmail account"* and **not one of
  them takes a parameter naming another mailbox**. There is no argument to pass. The study's
  assumption is upgraded to a certainty: **delegation serves the human, never their brain.**
- ✅ **A universal identifier exists and the connector exposes it.** `messageFormat: RAW` returns the
  full RFC headers, `Message-Id` among them, and it is set by the **sender's** server before any
  recipient exists (`<620fdd77-…@noota.io>`, `<20260602161932.…@mail.notion.so>`). Every copy of one
  mail therefore starts life carrying the same string.
- ✅ **And it is an exact, working lookup key.** `rfc822msgid:<the id>` returned **exactly the one
  message** it should, nothing else. So "have I already seen this mail?" is answerable, cheaply, by
  a query rather than by reasoning over content.
- ❓ **Whether a Gmail auto-forward preserves it is STILL NOT MEASURED, and the reason matters.**
  The owner's mailbox turned out to hold **no forwarded mail to test on**: it receives two domains
  (`@visma.com`, `@inqom.com`) and each message shows a single `Delivered-To` naming its own original
  recipient, with no `X-Forwarded-For` chain. That is **one mailbox with two addresses, not a
  forward**. Standard practice (RFC 5322) is that a resent message keeps its `Message-ID` and adds
  `Resent-Message-ID`, so the expectation is strong — but the repo's own rule cuts both ways: a
  recorded absence is a measurement with an expiry, and so is a recorded permission. **Settling it
  needs a real forwarding filter and one test mail**, on the field setup rather than here.
- 🟢 **A finding that changes the design and lowers the risk: the key should NOT be the `Message-Id`.**
  Reading it costs a **RAW fetch of the whole MIME message** — the 105 KB mails in that mailbox are
  exactly what the fan-out architecture exists to keep out of context. Whereas **sender address +
  send timestamp + subject** come back in the *cheapest* formats (`MINIMAL`, `METADATA_ONLY`), for
  free, and are identical across every copy **whatever the transport**, forward included. Requiring
  all three to match exactly is **not fuzzy matching**: two distinct mails sharing one sender, one
  timestamp to the second and one subject is a negligible event. So: **composite natural key as the
  primary, `Message-Id` used only when already in hand.** This downgrades the red risk above — the
  chantier no longer depends on the unmeasured forwarding behaviour, and no longer needs a
  fingerprint that could silently drop a real mail.

#### Slack and Calendar measured too — and both are EASIER than mail _(2026-09-02, the owner asked)_

Same method, same mailbox-owner's own accounts, on his go-ahead. **Mail turns out to be the hard
case, not the representative one**, and that is worth knowing before the identity scheme is designed
around it.

- ✅ **Slack is the easy case, and it has no transport problem at all.** Channels carry
  **workspace-global** ids (`C0CEQ4R5E`, `C6T6MLBHN` — the same string in every member's client) and
  a message is keyed by its `ts` within its channel (the connector's own `message_ts`, `oldest`,
  `latest` all speak that language). **There is ONE message on ONE server**: two people do not hold
  two copies, they read the same object. So `channel_id + ts` is an exact shared key, free in every
  response, and it is already what a Slack permalink encodes — which `sync-sources` § *Source
  discipline* already insists on keeping.
- ✅ **Calendar is nearly as easy: the event id is the SAME for every attendee.** The listing returns
  `id: 0e61bh4mqcqvk3b9fd7jevibmi`, and the event's own `htmlLink` carries `eid=` = base64 of
  **`<eventId> <calendarId>`** — decoded on a real event, `0e61bh4mqcqvk3b9fd7jevibmi
  thomas.pierrain@visma.com`. The **event id is the shared half, the calendar id the per-person
  half**: two attendees looking at one meeting hold the same event id. Free in the ordinary listing,
  no expensive fetch.
  - ⚠️ **Recurring events need the INSTANCE, not the series.** The connector returns
    `pgtmb1knn969ftm8i3sd01ojiq_20260903T073000Z` plus a separate `recurringEventId`. Both brains
    digesting "the daily of 3 September" agree; one keying on the series and the other on the
    occurrence would not. The scheme must say which, once.
- 🟢 **An asymmetry with Gmail that is worth exploiting: Calendar CAN be read across accounts.**
  `list_events` / `get_event` take a **`calendarId` (an email address)**, where no Gmail tool takes a
  mailbox at all. So if the owner shares their calendar, the assistant's brain reads **the owner's
  own events** — literally the same objects, same ids — and the symmetry the owner demands is met
  with no copying and nothing to dedup. **Calendar sharing is to the calendar what delegation failed
  to be for mail.**
- 🕳️ **Two real holes, and neither is a duplication problem — they are gaps in the duo promise.**
  A **DM** to the owner is invisible to the assistant unless she is in it, and Slack memberships are
  **per workspace** (`team_id`): on different workspaces there is no shared message to dedup, and no
  shared message to read either. Both belong in the doctrine paragraph, not in the identity scheme.

**What this settles for the design: the identity is PER SOURCE TYPE, and the ADR owes a table.**

| Source | Key | Cost | Shared across the two people? |
| --- | --- | --- | --- |
| **Slack** | `channel_id` + `ts` | free | ✅ by construction — one message, one server |
| **Calendar** | event `id` (instance, not series) | free | ✅ same id for every attendee |
| **Notion mirror** | `source_url` | free | ✅ already shipped, already idempotent |
| **Drive** | file `id` | free | ✅ same file id for every reader |
| **Mail** | sender + timestamp + subject | free | ✅ whatever the transport; the Gmail id is per-mailbox and unusable |

**Mail is the only row needing a composite**, because it is the only source where each person holds
their **own copy** of the object rather than a view onto one. Designing the whole scheme from the
mail case would have imported that awkwardness into four sources that do not have it.
- **Assessment: does not block step 8.** ⏸️ **Owner's call** — whether the doctrine paragraph ships
  with this release, and whether the source-identity item is filed as an issue.

## Not in scope

- No strict real time: the grain is the interval; the guided merge waits for the person to speak.
- No daemon; no automatic merge outside vault notes; Claude does not start a conversation on
  its own (channels would, in research preview only).
- No permission model inside a brain (ADR 0034: the fence is the repo), no hosted multi-user
  service, no per-person daily notes (a candidate of the study, not this chantier).

## Verification, end to end

- Green suite: `node --test --test-timeout=240000 "scripts/*.test.mjs" "scripts/lib/*.test.mjs"
  "rag/*.test.mjs"`, plus `npm test` and `tsc --noEmit` in `rag/`.
- Mutation on the new files the day they are written; results in `maintainers/mutation/RESULTS.md`.
- The rehearsal of step 7 on a copy of a real brain is the acceptance test: one note pushed from
  a second clone is displayed within one interval and announced at the next message, and two
  appends to one daily note merge without a human.
- Every push read on CI (`gh run list --branch feat/live-remote-sync`).
