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

- **Next:** step 7 — the rehearsal on a COPY of a real brain, driven by the old engine
  (`maintainers/qa/field-rehearsal/rehearse.mjs`). It is the acceptance test of the whole
  chantier, and the first place any of this meets a brain that was not built by a fixture.
  Steps 1 to 6 are done and green: the merge rule, the tick, the gate, the entry point driven
  **as a process** on a real repo with a local remote, the clock in the search server with its
  knob and its shutdown, the announcement that reaches the conversation at the owner's next
  message, the banner for notes written by someone else, and the doctrine and docs that say so.
- ⏸️ **Step 7 is ON HOLD at the owner's request** _(2026-09-02 morning)_. He needs his own brain for
  something important today, and does not want a trial running beside it. **Nothing may be launched
  against any brain of his until he says go**, the rehearsal included. Worth having written down for
  whoever resumes: the fear he named — merges landing on his other machine — is not reachable from
  here — **but only once the remote question is settled, and it was not**. He pushed back on exactly
  that: a sync test is made of pushes and pulls, so it needs a remote, and pointing one at his own
  would land the test's commits in his repository and on his other machine. The answer, now written
  into step 7 where it is load-bearing: the remote is a bare repository created in the work
  directory, never his. With that, the copy still has nothing that reaches him, and the feature is
  not released either, so no brain of his is running it. Say that when he asks, do not act on it.
- 🚧 **And even with his go, step 7 needs a permission this session does not have** _(2026-09-02)_.
  An unattended session
  cannot launch the rehearsal: the sandbox refuses any command that reaches a brain folder under
  the owner's home, in either spelling tried. Nothing about the harness is at fault — it only ever
  **reads** the original (`.git`, `node_modules` and `.cache` are skipped, so the copy has no
  remote and a push home is not expressible), and every write lands in a temp dir. **What lifts
  it:** the owner runs the one line himself, or approves it once. The brain to aim at is
  `~/mind-palace` — it is the one with a remote and two machines, and its installed engine
  (`scripts` 1.14.0) is exactly the version the fleet would update **from**:
  `node maintainers/qa/field-rehearsal/rehearse.mjs --brain ~/mind-palace`. Steps 7.2 to 7.4 run
  on the copy that command produces, so they are behind the same door; 7.5 needs the second
  machine and is his either way.
- 🔕 **The mutation run was raising REAL desktop banners on the owner's machine, and he is the one
  who noticed** _(2026-09-02, `73a2379`)_. The suite runs the real entry point, which ends in a real
  native notification; one suite run raises a handful, and a mutation run raises one per mutant.
  Fixed on both halves — the process fixture passes the engine's quiet switch, and `realTickDeps`
  now takes the spawn as a seam so the wiring is asserted on the request rather than on the screen.
  The durable half is carved in `CONVENTIONS.md` §5ter as its own numbered rule: **anything that can
  surface outside the process is injected in tests, never merely switched off** — a switch is one
  mutant away from being on. ⚠️ **The recheck run was killed for this and must be started again**;
  the 86.17 % below is still the last honest number.
- **2.7, first pass measured: 86.17 %** over the six files of this chantier _(2026-09-02,
  `maintainers/mutation/reports/sync-84-batchA.log`)_ — `gitignore-entry` 100 %, `remote-sync`
  92.44 %, the entry 91.98 %, `os-banner` 88.35 %, `remote-arrivals` 79.87 %, and the **gate at
  67.74 %**, which is the piece that decides whether a machine ticks at all. Survivors closed and
  pushed as `6b5bbd9` (CI green); a recheck run is measuring the new score, into
  `reports/sync-84-recheck.log`. **What remains of 2.7 once it lands**: one line per file in
  `maintainers/mutation/RESULTS.md`, newest-first, with the accepted equivalents named rather than
  implied. Two survivors are known to be unkillable without a seam nobody should add — an
  `openSync` error that is not `EEXIST`, and the staging file a failed trace write leaves behind —
  and they belong in that line as equivalents, not as silence.
- **3.6** (the `engineVersion` bump) trails deliberately, moved to step 8 — see there for why.
  The POC is closed: the `FileChanged`
  hook runs code but cannot speak to the conversation, so the immediate display falls back to
  the native banner (5.2) and the next-message announcement (4); 5.1 is dropped.
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
- **Owner's call pending:** the release number (the feature ships alone under the next tag,
  decision 3; which tag it is gets settled at step 8 against the v5.1 promise in
  [`clear-the-tracker-action.md`](clear-the-tracker-action.md)).
- **A session may, alone:** run steps 0 to 7 test-first end to end, on this branch, pushing
  every green commit and reading its CI. Not: tag, publish, push to `main`, write into
  `templates/fr/**`, or write into either of the owner's real brains.

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
- [ ] **2.7** Mutation run on the new files the day they are written
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
      assisted resolution; no French twin to write, and the active plan forbids a session from
      writing `templates/fr/**` alone).

### 7. Rehearsal on a copy of a real brain (the update is driven by the OLD engine)

> 🚧 **The whole of step 7 waits on the owner** — an unattended session is not allowed to reach a
> brain folder under his home, and 7.2 to 7.4 run on the copy 7.1 produces. See the STATE block for
> what lifts it and why the harness itself is safe.

- [ ] **7.1** `node maintainers/qa/field-rehearsal/rehearse.mjs --brain ~/mind-palace`
      (CONVENTIONS §10ter): update lands, hook entry reconciled, restart, one tick observed.
      That brain, and not another: it is the one with a remote and two machines, and its installed
      engine is the version the fleet would update **from**.
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

- [ ] **7.2** A note pushed from a second clone arrives within one interval, is indexed, is
      displayed at once (5.1) and announced at the next message (4).
- [ ] **7.3** Two clones append to the same daily note: union merge, no human.
- [ ] **7.4** Three Desktop conversations open on the copy: one effective clock (lock), no
      `index.lock` collision, the persistence no-op after a pull is harmless in the logs.
- [ ] **7.5** Unknown 5 re-checked on the target machines' SSH setup (step 0.5 covered only the
      maintainer's).

### 8. Release

- [ ] **8.1** Marketing-surface re-read (CONVENTIONS §10): README, EN-QUOI-C-EST-DIFFERENT,
      SETUP, CONNECTORS, boards; verdicts recorded here.
- [ ] **8.2** Release note (§11): brief, non-alarmist, "What you get" grouped by moment, with the
      `### What you get` heading the `--check` prose is parsed from.
- [ ] **8.2bis** The `engineVersion` bump, applied here and not before (the table is at 3.6):
      a version that is bumped but unpublished makes a fresh install stamp itself with a
      version that never existed (`32a6ec4`).
- [ ] **8.3** Tag (number: owner's call, see STATE), `git push --tags`, published release.
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
