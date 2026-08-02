<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- STATUS: 🚧 ACTION PLAN (opened 2026-07-28) — the release that turns the      -->
<!-- `mind-palace` field log (F1-F12) into shipped code. Nothing implemented yet. -->
<!-- Evidence lives in `prospective/fleet-upgrade-field-feedback.md`; this file   -->
<!-- owns the WORK. Do not re-investigate the entries — they were verified on disk.-->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Release v4.4.0 — a note is saved as you write it, and your own status line survives

- **STATUS:** 🚧 In flight. All ten tracks are code-complete; **Track 9 (cut the release) is the only
  one left**, and inside it the mutation snapshot is the box being written up.
- **Scope:** Second brain (runtime) + Installer — the commit trigger, the status line, the indexer's
  error reporting, the consolidation writer, the update source, the startup screen, an engine skill.
- **Branch:** currently `docs/fleet-upgrade-field-feedback` (documentation-shaped). Cut
  `feat/v4.4.0-field-fixes` when the first code commit lands.
- **Why v4.4.0 and not v4.3.1:** two new capabilities, not repairs of v4.3.0's own code — a commit
  that follows the index instead of the session, and a status line that yields to the owner's. Semver
  says minor.

## ▶️ START HERE

**NEXT STEP, as of 2026-08-02 — write the RELEASE NOTE.** Everything upstream of it in Track 9 is
done and ticked: the code review and its six fixes, the cut line (nothing is cut), CI 7/7, the
**mutation snapshot written into `maintainers/mutation/RESULTS.md`** _(`5a66510`)_, and the
marketing-surface pass. **Do not re-measure, do not re-review, do not re-read the marketing surfaces.**
What the release note owes, beyond the usual §11 shape, is **three lines that are already decided and
must not be re-litigated**:

1. **the two numbers, never one** (searchable in seconds · committed within ~2 min, 10 at the outside);
2. **one honest line on the named debt** — two boot scripts no test can observe (0 % mutation), a hole
   every published tag already carries, with its cure scheduled as a release of its own;
3. **a release-note line for each of Tracks 1 and 4-8** (each track's box says which).

After the note: 3-4 `v4.4.0 — The One Where …` codenames for **Thomas to pick**, then merge/tag/publish,
then archive the plan. The **Verification** section stays owed and needs a real installed brain — it is
not a blocker for the note, only for calling those boxes done.

**All the code is written, Track 10 included. The next track is Track 9 — cutting the release**
_(as of 2026-07-28)_. Tracks 1-8 are code-complete _(`8d2e2c4`)_; Track 10 shipped the push cadence
and amended ADR 0037 in place. Track 1 stays unticked in `## Tracking` for what it still owes, and it is **not code**: its
release-note copy is due at **Track 9**, and its remaining check needs an **installed brain**, which the
launcher deliberately is not. Tracks 4, 5, 6, 7 and 8 owe a release-note line each, also at Track 9.
**Do not reopen the implementation of Tracks 1-8.**

**✅ The `/code-review` is DONE and its six findings are all fixed** _(2026-07-28 · `7a88257`,
`eab28bd`, `c9ecf87`, `481ab88`, `5cd0bbb`, `e3ce3b2`)_. Every finding was reproduced on disk first,
then fixed in TDD red-first, one commit each; both suites are green (**rag 441**, **scripts 1033**).
The detail — what each defect was, and what killed it — is in Track 9's first box. **Do not re-run the
review and do not re-derive those six.**

**The cut line is DECIDED: nothing is cut.** All of Tracks 1-8 ship. No finding lived in Tracks 5-8,
so cutting them would have dropped working code without removing a single defect.

**✅ ANSWERED AND SHIPPED as Track 10 — the push cadence on the watcher path.** _(kept below because
the four locks are the analysis, and they are still the reference; the decision itself is closed.)_
Raised by Thomas 2026-07-28,
**not found by the code review**, and it is the last thing blocking the release note. He asked what
stops a commit/reindex storm while someone types in Obsidian: *"on passe notre temps à écrire des
mots, à faire une mini pause, à continuer"*.

**The four locks, each verified in code — do not re-derive this analysis:**

1. **The watcher ignores `.obsidian`** (`rag/src/lib/vault-watcher.ts:21`, `IGNORED_SEGMENTS`). Moving
   a pane rewrites `workspace.json`; watching it bought a full-vault scan per gesture and would fire a
   commit on a change git cannot even see.
2. **`ReindexScheduler.notify` is a RE-ARMING 5 s debounce** (`reindex-scheduler.ts:58-65`,
   `DEFAULT_DEBOUNCE_MS = 5000`): each write **clears** the pending timer and sets a new one. So writes
   closer together than 5 s trigger **nothing at all** — the countdown only starts once typing really
   stops. **This is the lock that answers Thomas's question**, and it means there is no per-keystroke
   and no per-save storm.
3. **Indexing is incremental by sha256** (`index-manager.ts:36`, `shouldSkip`): only the note whose
   content actually changed is re-embedded, the rest are `skipped`. The expensive half is bounded to
   one note per campaign.
4. **Persistence is gated on `indexed > 0 || removed > 0`**, and `git add .` folds a whole burst into
   **ONE** commit. A campaign that changed nothing commits nothing.

**The honest bound, to be stated in the release note and not glossed over:** a pause **longer** than
5 s does start a campaign. Half an hour of writing with 20 real pauses is up to 20 `auto:` commits.
Cheap locally (one note re-embedded, one local commit) and merely chatty in `git log`.

**The gap is the PUSH, not the commit.** Every campaign that changed something also runs
`auto-push.mjs`, so with `secondbrain.autopush` on, **a pause longer than 5 s means a network push**.
`scripts/auto-commit.mjs:5-7` records that the push was deliberately moved to the Stop hook precisely
to avoid *"a network push per edit + its blocking retry pause"* (and that retry is a **blocking 3 s**
`Atomics.wait`). Track 1 partly reintroduces that on the watcher path. The "a note is safe within
seconds" promise only needs the **commit**; the push does not have to share its cadence.

**▶️ WHERE THE DISCUSSION LANDED (2026-07-28, and it moved past the a/b/c options above).** Thomas
proposed **2 minutes** instead of 5 s, then sharpened it into a better axis: *distinguish the time to
commit/push/index for* **(1) files ingested by a SYNC** *(no debounce wanted there)* *from* **(2) files
created or edited BY HAND in the vault**. That distinction is right, and the code says why:

- **There is no notion of provenance today.** chokidar sees a write; a bulk mirror sync and a person
  typing go down the **exact same** path — one 5 s debounce governing both indexing AND persistence.
- **A sync cannot even announce itself.** `engine-skills/local-mirror/SKILL.md:314` documents that
  freshly-synced pages are "not searchable **yet**: the FileWatcher reindexes a moment after files hit
  disk" — the sync **waits for the watcher** instead of saying "batch done".
- **The explicit door exists but is half-wired:** the `reindex` MCP tool (`rag/src/index.ts:176`) calls
  `reindexFn` directly — it indexes and **never persists**. Only the watcher path runs
  `runCatchUpCampaign`. So the one entry point that KNOWS a batch is complete is also the one that
  cannot commit it.

**Careful — "no debounce for a sync" must not mean "a campaign per file".** A sync lands in waves; with
the debounce removed it would fire a campaign per wave, which is worse, not better. What is actually
wanted is an **explicit end-of-batch signal**, which is a different mechanism from a shorter timer.

**The target design, in three cases:**

1. **Sync / import** → the skill calls an explicit "batch complete" that both indexes AND persists →
   **one** index pass, **one** commit, **one** push, immediately, no waiting.
2. **Hand-written note** → keep a **short** debounce (~5 s) for **indexing**, so search stays fresh —
   that part already works and must not be sacrificed — and give **persistence** its own longer quiet
   window (**Thomas's 2 minutes**), so commits and pushes stop tracking every pause.
3. **Engine scripts writing a note** → same as case 2 (they are indistinguishable from a human write,
   and that is fine).

- [x] **DECIDED (Thomas, 2026-07-28) — case 2 ships in v4.4.0, case 1 is v4.5.0.** Persistence gets
      its own ~2-minute quiet window on the watcher path; indexing keeps its 5 s debounce untouched.
      The sync fast-path (an explicit "batch complete" that indexes AND persists) is a new capability,
      changes the `reindex` tool's contract and two skills, and is a **clean v4.5.0**. → **Track 10**.
      **Do not re-open this**, and do not let case 1 creep into this release.
      - **Thomas also unfroze the release title**: it is *not* validated yet, so the copy follows the
        behaviour, never the reverse. The "saved while you write it" angle survives (the **indexing**
        is still seconds); what the note must state honestly is the **commit/push** number we land on.
  - [x] **DECIDED (Thomas, 2026-07-28) — YES, a cap, at 10 minutes.** The window re-arms exactly
        like the 5 s one (`ReindexScheduler.notify`, `reindex-scheduler.ts:58-65`), so a writing
        session that never goes 2 minutes without a keystroke commits **nothing** until it finally
        pauses. Not a data-loss risk (the file is on disk and indexed within 5 s), but the net that
        used to cover it is thinner than it looks: the PostToolUse/Stop hooks only fire on a **Claude
        turn**, and the watcher's whole point is the case where Claude is **idle** while someone types
        in Obsidian. A **maximum wait** bounds that exposure for ~15 lines and its tests. Since the
        title is unfrozen, this was a pure behaviour call, not a copy constraint.
        **Landed contract: commit at the earlier of (a) 2 minutes of silence, (b) 10 minutes since the
        first write not yet persisted.** A 30-minute session with no real pause commits 3 times
        instead of 0.

**What the split does and does NOT touch — established while answering Thomas, do not re-derive.** It
only governs the **watcher** path, i.e. writes made **outside** a Claude turn (Obsidian, `rm`, engine
scripts, a mirror sync). Writes made **by Claude** are unchanged: `auto-commit.mjs` still commits on
every `Write|Edit` via PostToolUse, `auto-push.mjs` still pushes once per turn via Stop
(`scripts/auto-commit.mjs:1-8`). So the split can only ever make the **watcher** quieter, never the
in-session path slower.

**✅ PR #53 is open and CI is GREEN, 7/7** — https://github.com/tpierrain/kenjaku/pull/53, run
`30388758449` _(2026-07-28)_: Node 22/24/26 × macOS + Windows, plus the Windows installer e2e.

**✅ The recurring Windows-path defect now has a MACHINE, not a promise** _(2026-07-28 · `ci.yml`,
`CONVENTIONS.md` §9)_. Thomas asked how to stop it coming back every 3-4 releases despite repeated
requests. Root cause found, and it is not a weak reflex: §9 already described this exact bug ("a fake
must key exactly the way production computes its key, never a hard-coded POSIX literal") and named the
CI matrix as the deterministic net — but `ci.yml` triggered on `pull_request` and pushes to `main`
**only**, and our PRs open at Track 9, i.e. at the END. **The net was unwired for the entire duration
of the work.** Fixed: `push` on any branch + a cheap `early-windows` tripwire (one cell, Node 24 ×
windows-latest, harness suites only). **Measured: 53 s, and the matrix + installer e2e correctly
skipped** (run `30390100299`). Today's defect would have gone red at commit `84e4038`, 49 commits
earlier. Approved by Thomas. **Do not "improve" this into a path lint — §9 rejected that deliberately
as all-false-positives, and the tripwire attacks the cause instead.**

**The first CI run was RED, and the rule earned its keep.** `restart-signal.test.mjs` (new in this
branch, Track 2 · `84e4038`) spelled its fixture path as `` `/brain/${RESTART_FLAG_REL}` `` while
`restartPendingOnDisk` **joins** it — so on Windows the lookup was `\brain\.cache\restart-needed` and
never matched. Four Windows jobs failed on a suite that had been green on macOS all along. Fixed in
`b4b627d` by building the fixture with `join`. **Lesson, already written in CONVENTIONS §9 and now
paid for: CI is the arbiter, never a local green** — and the branch had gone 52 commits without ever
being pushed, so nothing could tell us.

**What remains, in order:** the **mutation snapshot**, the **marketing-surface pass** (Track 10 left
it two specific claims to re-read — see its last box), then the **release note**. The push-cadence
question that was blocking is **answered and shipped**.

**⚠️ TWO THINGS ADDED TO TRACK 9 on 2026-08-02, both from a design conversation with Thomas
(recorded in `background-consolidation-mode-study.md` — read it there, do not re-derive):**

1. **A DEFECT: the engine version vector was never bumped.** `engine-manifest.json` on this branch
   still carries `engineVersion.scripts` = **1.8.0** and `engineVersion.rag` = **1.1.5**, identical to
   `main`, while the branch changes ~5400 lines under `scripts/**` and `rag/src/**` (its only manifest
   change is adding `canonicalRepo`). So a new install would run v4.4.0 code under a version that does
   not describe it, **and** a deployed brain already on `scripts 1.8.0` would get no signal that
   anything changed. **Bump before the merge.** Reminder of why it is not optional: **in this product
   merging IS shipping** — the launcher repo is the artifact, so anyone installing from `main` gets
   `main`. Merge and release are one event.
2. **Do NOT publish Track 10's numbers as a contract.** The release note must not state "2 minutes of
   silence, 10-minute cap": the background-consolidation study will move that cadence, and we would be
   publishing two contradictory timing promises one release apart. Describe the **behaviour** instead
   ("your notes are committed on their own, shortly after you stop writing"). The honest bound stays
   worth stating; the mechanism does not.

**And the release SHIPS — the "treat it as a POC" option was weighed and rejected** (Thomas floated
it, 2026-08-02). Seven of the ten tracks have no relationship to the background study; cherry-picking
81 commits over 74 files months later costs more than merging, for zero new value; and Tracks 1/10 are
a **foundation** for that study, not an obstacle. The reasoning is in the study's last section.

**▶️ IN FLIGHT — the mutation snapshot** _(2026-07-28)_. Its scope is **settled in Track 9's box**
(10 rag files, 16 `scripts/**` files in a disposable worktree, local-mirror untouched so its 90.44 %
carries over) — read it there, do not re-derive it from the diff. The runs are slow and must not
overlap; a `/clear` mid-run costs only the run, not the decision.

**✅ THE MUTATION WORK IS FINISHED — measured, swept, and re-measured. Do not launch Stryker again.**
rag **93.93 %**; scripts measured in five batches, then the four in-scope files swept and a
**confirmation re-run** done _(2026-08-02)_: `note-refresh` **80.26 → 98.68 %**, `reconcile-brain`
**93.02 → 95.93 %**, `refresh-note` **57.41 → 68.52 %** (all 17 remaining survivors are its I/O
lambda object and its boot guard — `runRefresh` itself is fully killed). Harness **1048 green**.
The batch config is now **committed** at `maintainers/mutation/stryker.scripts.batch.config.mjs`
(it used to live in a scratchpad, which is how the first run's reports were lost).

**▶️ THE NEXT STEP IS `RESULTS.md`, and it is pure write-up — no measurement left.** Fold in: the
per-file scores above, the **two new worktree traps** (the `auto-commit` mutant that COMMITS the
instrumented tree → reset with `git reset --hard` + `git clean -fd`, never `checkout -- .`; and
`disableTypeChecks: false`), the **0 % boot-script debt** in its own section, and the systematic
`readFileSync(p, "utf8")` equivalent recorded ONCE. Then: **bump `engineVersion`** (the defect
below), the release note, codenames, merge + tag.

**✅ DECIDED 2026-08-02 — the two 0 % boot scripts ship as NAMED DEBT.** `session-status.mjs` and
`status-line.mjs` score 0 % because they run on import, so no test can observe them; the hole predates
every published tag and this release did not widen it. Thomas chose **(a) name it and ship**: write it
into `RESULTS.md` and state it once, honestly, in the release note. The `BootDeps` refactor §5ter
prescribes is **a release of its own** — not done on the eve of a tag on two fleet-deployed scripts.
**Do not re-open it here.**

**The release TITLE is NOT frozen** — Thomas said so explicitly (2026-07-28) when the cadence change
came up: *the copy follows the behaviour, never the reverse*. The "saved while you write it" angle he
picked survives, because the **indexing** stays at 5 s; what the note must state honestly is the
**commit/push** number Track 10 lands on. Working title, to confirm against the `The One Where …`
series: `v4.4.0 — The One Where a Note Is Saved While You Write It`.

**One decision is waiting on Thomas, and it does not block Track 9.** Track 7 shipped `rag` as the
**only** new slash command; `/index` and `/reindex` route there in plain language rather than each
costing a staged directory (a description loaded in every session). The reasoning is written in
Track 7 and reversing it is one commit. If he wants the aliases, do it there — do not re-derive it.

The QA is **closed**. Do not re-run it, do not re-read `mind-palace`, do not re-investigate any entry:
each one in the field log states observation → root cause → fix, and **every one was verified on disk**.
The two decisions that were pending are **answered** (below). Resume at the first unticked box in
`## Tracking` and announce which track before writing code.

**The three answers from Thomas, 2026-07-28** — they are the reason this plan exists in this shape:

- **F12 ships in full** (a deterministic front-matter writer, not just an alarm) → **Track 4**.
- **The pre-fill ships in its "retrieval" form** (query `type: person` notes) → **Track 8**.
- **The status line RETREATS** — Kenjaku stops occupying it so the owner's own line runs again. This
  **pulls F2 forward out of Gate 4**, where the frozen scope had left it → **Track 2**.

**The headline is Track 1, and it is not a feature.** v4.3.0 already told the fleet that notes typed
straight into Obsidian are *"enfin commitées/synchronisées"*. They are indexed within seconds and
committed only at the **next session start**. This release **makes true a sentence we already
published**.

**The constraint that decides WHERE each fix lands — do not re-derive it.** `CLAUDE.md` and
`.claude/settings.json` are `SACRED_FILES` (`scripts/lib/engine-apply-plan.mjs:32`): never rewritten by
an update, so **anything landing there reaches new installs only, never the deployed fleet**. What does
reach the fleet: anything matching `ENGINE_SCRIPT` (`engine-apply-plan.mjs:20` — `scripts/*.mjs`,
including `status-line.mjs`), plus `scripts/lib/**`, `rag/**` and the engine skills.

---

## Tracking

- [x] **Track 0 — This plan exists in the repo, and the pointers agree with it** _(2026-07-28)_
- [ ] **Track 1 — A note is saved while you are still writing it** *(headline — F8/P1, F9, F11)*
      — **code complete and green** _(2026-07-28 · `9f45561`, `f274a01`, `97652d7`)_; what is left is
      the **release-note copy** (the honest bound, the refused plaster) and the **real-brain check**.
- [x] **Track 2 — Your own status line survives opening your brain** *(F2, F4, ADR 0036)*
      _(2026-07-28 · `84e4038`, `65202ba`, `44cdd24`)_ — code, ADR and copy done; the on-a-real-brain
      check stays owed in the Verification section.
- [x] **Track 3 — A note the engine cannot read is reported, not swallowed** *(F10)* _(2026-07-28 · `631b0ae`)_
- [x] **Track 4 — Consolidating a page can no longer damage it** *(F12)* _(2026-07-28 · `541028b`,
      `6e0101b`)_ — writer **and** reader shipped; only the **release-note line** is owed, at Track 9.
- [x] **Track 5 — An installed brain follows the launcher when it moves** *(F1)* _(2026-07-28 ·
      `2eb6fad`, `25b0335`)_ — code green; only the **release-note line** is owed, at Track 9.
- [x] **Track 6 — The first screen speaks to you, not to the machine** *(F5)* _(2026-07-28 · `2243b83`,
      `43f25dc`, `f63d8ac`, `7ec088b`)_ — four emitters shrunk (the audit found one the field log had
      missed), a guard added; only the **release-note line** is owed, at Track 9.
- [x] **Track 7 — `/rag` answers instead of suggesting `/run`** *(F6)* _(2026-07-28 · `3b8c0a6`)_ —
      skill + guard test + SETUP row; only the **release-note line** is owed, at Track 9. The alias
      sweep is decided **in the track** (`rag` alone gets a directory) — re-open it only to overrule.
- [x] **Track 8 — The profile pre-fill reads the notes you wrote** *(retrieval)* _(2026-07-28 · `8d2e2c4`)_ —
      skill + guard test + the Gate 4 fixture written out; only the **release-note line** is owed, at
      Track 9. **Source-level guard only**: the behaviour itself is Gate 4's fixture to run.
- [x] **Track 10 — Commits stop tracking every pause** *(the push-cadence decision)* _(2026-07-28 ·
      `aeda895`, `d828af6`, `c023ac3`)_ — persistence has its own window (2 min quiet, 10 min cap); indexing keeps
      its 5 s debounce. ADR 0037 amended in place. Only the **release-note line** is owed, at Track 9.
- [ ] **Track 9 — Cut the release**

> **Cut line, if the release grows too long.** Tracks 1-4 **are** the release. Tracks 5-8 are mutually
> independent and each can be dropped to a follow-up without touching the others. Decide at the
> `/code-review` step, on the real diff — **not before**.

---

## Track 1 — A note is saved while you are still writing it *(F8/P1, F9, F11)*

**The defect in one line: indexing is file-driven, committing is tool-driven.**
`.claude/settings.json.template:52-62` wires `auto-commit.mjs` to `PostToolUse` with matcher
`Write|Edit`, so it fires only after *Claude* writes a file. Three classes of writer are missed, all
field-confirmed on 2026-07-28:

1. **the engine's own script** (`set-universe-profile.mjs` wrote `vault/inqom/universe.md` in Node) —
   the **primary** case, because an owner meets it without doing anything unusual;
2. a note typed **outside Claude**, in Obsidian (F8);
3. a note **deleted** via `rm`/Bash from inside a session (F9).

The index then runs **ahead of git**: the brain searches, finds and cites a note that exists on no
remote and on no other machine. Two consequences the "delayed, not lost" framing understates — machine
B disagrees with machine A about what the brain knows, and a disk failure takes a note the owner has
evidence is safe *precisely because it answers questions*.

**The invariant is asymmetric: `git ≥ index`, not `git = index`.** Index-ahead-of-git is serious;
git-ahead-of-index (after a pull) is benign and already repaired by the startup catch-up. **Convergence
is not what is missing** — they do converge, at the next session start. What is missing is a **bound**:
*"the next time you happen to open Claude"* is not a duration.

- [x] **Trigger: the end of an indexing campaign that CHANGED something → commit (+ push).**
      _(2026-07-28 · `9f45561`, `f274a01`, `97652d7`)_ Design agreed with Thomas. The campaign is
      already debounced, so this yields **one commit per burst**, at the moment the engine already
      knows its own result.
  - [x] Gate on **`indexed > 0 || removed > 0`**, never on *"a campaign ended"*. Both halves are pinned
        by a field finding:
    - [x] **F9** — a deletion runs a campaign that indexes **nothing** (`last-run.json`:
          `indexed:0, removed:1`). Gating on `indexed` alone reproduces F9 **inside its own fix**.
    - [x] **F11** — campaigns also fire on `.obsidian/` UI churn. Gating on "a campaign ended" fires
          the commit when the owner moves a pane. Harmless today only **by accident** (`.obsidian/` is
          gitignored, so `git add .` finds nothing) — and `autopush` would carry it to the network.
  - [x] Implement it **watcher-side** (`rag/**` is engine-owned `replace`, so it reaches the fleet), not
        as a new hook. A hook is session/tool-shaped, which **is** the defect.
  - [x] **Reuse, do not reimplement git**: spawn `scripts/auto-commit.mjs` then `scripts/auto-push.mjs`.
        `auto-push.mjs` already gates on `secondbrain.autopush` + remote + upstream + unpushed count
        (`scripts/lib/git-push.mjs:7`), and `auto-commit.mjs:51` already does `git add .`.
  - [x] **No settings change was needed** _(2026-07-28)_ — so `reconcileHooks` was never touched, and
        the fix reaches deployed brains through `rag/**` alone. Had one been needed it would have gone
        through `scripts/lib/hooks-reconcile.mjs:53-73` (add-only, dedup by script identity), never a
        hand-edit of the sacred `settings.json`.
  - [x] **A guard the plan had not foreseen: the launcher is not a brain** _(2026-07-28 · `f274a01`)_.
        Run the engine from the generator (a maintainer's `npm run dev`) and this would have swept the
        launcher's working tree into an `auto:` commit. `persistenceApplies` reads the manifest's
        `provenance`, stamped at install (`scripts/lib/engine-source.mjs`) and absent from the
        launcher's own. **Fails closed** on an unreadable manifest.
  - [x] **Deliberately watcher-only** _(2026-07-28)_: the startup catch-up and the `reindex` tool are
        NOT wired to persistence. The session-start sweep already covers the first, and a session's
        own writes go through the `Write|Edit` hook. One trigger, one commit per burst.
- [x] **`.obsidian` joins the watcher's ignore list** *(F11)* _(2026-07-28 · `a138ee4`)_.
      Red seen for the right reason (`false !== true`), plus the boundary decoy so a note *about*
      Obsidian stays a note. 12/12 green in `vault-watcher.test.ts`.
- [x] **The pure decider exists and is triangulated** _(2026-07-28)_:
      `rag/src/lib/campaign-persist.ts` → `shouldPersistCampaign({indexed, removed})`. Three baby-steps,
      each red-then-green: indexed alone, **removed alone (F9)**, and the `0/0` boundary that separates
      `> 0` from `>= 0` and locks F11.
- [x] **The orchestration around it** _(2026-07-28 · `9f45561`)_: `persistCampaign` runs commit **then**
      push behind an injectable `runScript`. **Asynchronous on purpose** — a push waits on the network
      (and on `auto-push.mjs`'s own blocking retry) inside the MCP server, where a synchronous wait
      would freeze every search for its duration. Best-effort like every other persistence path: a
      failure reports `"failed"` instead of taking down the live-update loop, and the `await` that makes
      an async rejection catchable is pinned by its own test (hand-mutated, mutant killed).
      `buildScriptRunner` keeps the child's output **buffered, never inherited** — the MCP server's
      stdio IS the protocol channel.
- [x] **TDD, red first** (`tdd-discipline`), four cases — three field-proven writers plus the regression
      _(2026-07-28 · `97652d7`)_. The `index.ts` seam was untested glue, so the campaign's body moved to
      `rag/src/lib/campaign-run.ts` (the repo's own rule: *test the glue too*); index.ts now only hands
      it the real seams. The four cases live there, against in-memory fakes:
  - [x] a file written by the **engine's own script** → committed;
  - [x] a note created **outside Claude** → committed;
  - [x] a note **deleted** via `rm` → committed *(the decider already proves `removed > 0` is in the gate)*;
  - [x] a `.obsidian/workspace.json` churn campaign → **no commit** *(F11's lock, both layers)*.
  - [x] Bonus, from the extraction: the `✅ catch-up done` trace line is now pinned by a test instead of
        by nothing, and the launcher path (`persist: null`) has its own case.
- [x] **No loop risk — verified 2026-07-28.** The watcher watches `VAULT_DIR` only and `.cache` is
      deliberately outside it; a commit writes to `.git/`. It cannot wake itself. Recorded so nobody
      re-opens it.
- [x] **The reverse direction already holds.** After a pull, files land on disk and the watcher (or the
      startup catch-up) indexes them. Nothing to build.
- [x] **A second thing the plan had not foreseen: this contradicts ADR 0011** _(2026-07-28 · `44cdd24`)_.
      *"Drive `git commit` from the watcher"* is listed there under **Rejected alternatives**. It owed an
      explicit amendment, not a silent contradiction → **ADR 0037**, which re-examines the four costs one
      by one. The decisive one (coupling git to the RAG's failure domain) applies to a design that
      **moves** persistence into the MCP; here the hooks stay, so the new rung can only **add** commits.
      And the intent-bearing commit message ADR 0011 feared losing was never implemented —
      `auto-commit.mjs` writes a fixed line. ADR 0011's status and its rejected-alternatives entry now
      carry the amendment.
- [ ] **The release note owes an honest bound.** P2 — committing while Claude is never open — was
      **rejected** by Thomas: it needs something running outside any session (LaunchAgent, cron, git
      hook), *"trop de choses et un côté immersif qui ne va pas plaire aux gens"*, on a product whose
      pitch is that nothing leaves the machine. So the guarantee is **"your notes are saved as you write
      them, as long as your brain is open"**. Three layers (index → local git → remote); this release
      guarantees the first two within a session, and `secondbrain.autopush` stays opt-in, off by default.
      **Say it plainly instead of implying continuous backup.**
- [ ] **Refuse the agent-side plaster, and say why in the release.** During the QA the brain offered to
      *"keep the reflex of checking `git status` at end of session"* — and **the offer was accepted
      within one exchange**, which is the finding itself: the product made "yes" cheaper than the
      diagnosis. It must not be taken: it is not deterministic; it would land in one brain's sacred
      `CLAUDE.md` and reach **nobody** in the fleet; and **it would hide the defect from the QA that
      found it**. Keep the good half — the instinct is `repo-status.mjs:107` (alerting when vault notes
      survive the sweep), and **this track makes the plaster unnecessary**.

---

## Track 2 — Your own status line survives opening your brain *(F2, F4, ADR 0036)*

**Decision (Thomas, 2026-07-28): RETREAT.** F4 settled — owner-verified on Desktop — that **Claude
Desktop's Code tab renders no status line at all**. So ours is a **CLI-only** surface: it delivers
nothing on the surface that justified it (Desktop, the non-dev persona) while **evicting the owner's own
line** on the one surface where it does render, i.e. among precisely the people most likely to have
configured one. Eviction has lost its argument.

> ⚠️ **The trap, and it is the whole difficulty of this track.** Making `status-line.mjs` print nothing
> does **not** give the owner their line back. `statusLine` is a **single value, not a merged list**, so
> the brain's `.claude/settings.json` still wins for the whole session and the owner gets a **blank
> line**. And that file is sacred, so an update cannot simply rewrite it. **The retreat has to remove
> the key, in a deployed brain, through the reconciler.**

- [x] **Reroute what would otherwise be lost — BEFORE removing anything.** _(2026-07-28 · `84e4038`)_
  - [x] **The restart nudge is the only genuine loss** _(2026-07-28 · `84e4038`)_. Confirmed on disk:
        surfaced *only* by `status-line.mjs`; `session-status.mjs` never imported it. It now **leads**
        that hook's `systemMessage`, from the same two inputs. The two on-disk reads left status-line for
        `scripts/lib/restart-signal.mjs` — shared, and unit-tested including the **fail-soft** case: a
        phantom nudge costs a pointless restart and teaches the owner to ignore the real one.
  - [x] **Already covered — verified, nothing to build.** The Gemini-key warning
        (`session-status.mjs:124-137`) and the RAG staleness counter (`:76-122`) are already duplicated
        there in prose.
  - [x] Keep the 🛑 MANDATORY chat rule and **mark it as the only harness** _(2026-07-28 · `65202ba`)_ —
        an explicit ⚠️ warns a future cleanup not to read it as duplication. The stale F-B7c paragraph
        below it, which still credited the status line, now names the SessionStart message instead.
- [x] **New installs: stop setting it** _(2026-07-28 · `65202ba`)_. The `statusLine` block is gone from
      `.claude/settings.json.template`; a brain with no `statusLine` never acquires one, still pinned by
      the two existing reconcile tests.
- [x] **Deployed fleet: remove the key we installed, and only that one.** _(2026-07-28 · `65202ba`)_
  - [x] Extended at that exact seam — the only write to `statusLine` inside a sacred `settings.json`.
        The pure decision lives in `scripts/lib/status-line-retreat.mjs`.
  - [x] **Provenance guard, non-negotiable** — matched on the script name, so a moved brain and a
        Windows `cmd /c …run-node.cmd` wrapper both still read as ours, while anything unrecognised is
        **kept**: a cosmetic leftover of ours is cheap, deleting their configuration is not.
  - [x] ⚠️ **The reconciler's write is no longer purely additive**, and its section comment now says so:
        additive **plus exactly one nominative removal**. The update reports it as what the owner gains —
        *"your own status line is back: the brain no longer occupies it"*.
  - [x] Tests: engine-installed → **removed**; hand-customized → **preserved**; none → **byte-identical**.
        Plus the two pre-existing win32 tests, **rewritten**: they pinned the prefix repair of our own
        status line, which the retreat makes moot — a broken line of ours is not worth healing, it is
        worth giving back.
- [x] **Fate of `scripts/status-line.mjs`: KEPT as a documented opt-in** _(2026-07-28 · ADR 0036 §5)_.
      It works, it ships like any engine script, and an owner who wants it back only points their own
      `statusLine.command` at it. Its header says so, in the first lines anyone opening it reads.
- [x] **ADR 0036 — the channel matrix** _(2026-07-28 · `44cdd24`)_ —
      `decisions/0036-deterministic-channels-differ-by-surface.md`, `Scope: Second brain (runtime)`.
      This is the point of F4: **a fact living only in comments rots and gets built upon.** Four source
      comments asserted Desktop renders a status line (`status-line.mjs:4-6` and `:116-118`,
      `restart-nudge.mjs:6`, `session-status.mjs:7-9`) while our own skill asserted the opposite. Carry
      the field-verified table (Claude Code v2.1.220, same brain, same session boundary):

      | Channel | CLI (terminal) | Desktop — Code tab |
      | --- | --- | --- |
      | `statusLine` | ✅ rendered, persistent | ❌ **nothing** |
      | SessionStart `systemMessage` | ✅ displayed | ❌ dropped |
      | SessionStart `additionalContext` | ⚠️ **echoed verbatim to the user** | ✅ agent-only, as designed |
      | The agent's chat text | ✅ | ✅ **the only channel reaching both** |

  - [x] The three consequences are stated: the **chat is the only universal channel**;
        `additionalContext` is **not backstage on the CLI**; and **nothing here is inferable from the
        documentation**. Plus one the plan had not asked for: the deterministic-mechanisms rule
        (ADR 0009) is **bounded by the surface** — where the host renders nothing, an instruction to
        the agent is not the weaker option, it is the only one.
  - [x] The surviving comments **point at the ADR** _(2026-07-28 · `65202ba`)_: the three that asserted
        the opposite (`status-line.mjs` header and its nudge block, `session-status.mjs`'s NB,
        `restart-nudge.mjs`'s header) now name the matrix and say plainly which channel reaches what.
  - [x] Listed in `maintainers/README.md`'s `decisions/` section, one bullet ending in `**Scope: …**` —
        alongside a second one for ADR 0037. **Drift found on the way, recorded not hidden:** that list
        had stopped at ADR 0022, so **0023-0035 are unlisted**; the README now says the directory is the
        authoritative index until someone backfills it.

---

## Track 3 — A note the engine cannot read is reported, not swallowed *(F10)*

**The worst failure mode this product has, in its quietest form**: not a wrong answer, a **confident
answer over an incomplete index**. Three of our own channels disagreed about the same run, and the one
the owner sees is the optimistic one — `watcher.log` said `1 errors`, `last-run.json` said `"errors":[]`,
and the brain told the owner *"0 erreur, index à jour"*. The brain was **faithful to what it was given**.

- [x] **Root cause, exact and readable in three lines** _(2026-07-28)_ — confirmed on disk, unchanged. `reporter.start()` **resets** `errors: []`
      (`rag/src/lib/reindex-reporter.ts:54`) and runs **after phase 1**
      (`rag/src/lib/index-manager.ts:260`, inside `runIndexingPhase`). `reporter.finish()` then merges
      **only** `runResult.errors`, the phase-**2** errors (`:271`). Phase-1 read errors are pushed to
      `result.errors` (`:201`) and **never handed to the reporter** — so `last-run.json`, `last-run.md`
      and `vault_stats`, i.e. everything the owner and the agent can see, under-report.
- [x] **Fixed by seeding** `reporter.start({errors})` _(2026-07-28 · `631b0ae`)_ rather than looping on
      `recordError()`: one write instead of N, and `finish()` already appends phase 2's on top of
      whatever `start()` seeded, so the merge order needed no change.
- [x] **The invariant SHIPPED, not just as a test** _(2026-07-28 · `631b0ae`)_: `unaccountedNotes()`
      runs on every completed run and the warning rides on the line everyone reads (`last-run.md`,
      hence the agent). Both QA numbers are pinned as tests (`414 ≠ 0 + 413` → 1 lost;
      `415 = 2 + 413` → 0). **One exemption, deliberate**: a run cut off by a quota wall — its notes
      are not lost, they resume, and a detector that cries wolf on every capped run is one nobody reads.
- [x] **Not reproduced on `mind-palace`** (no access to that brain from here) — and it turned out not to
      be needed: a completed run now **names** its errors instead of only counting them, which is the
      thing the QA lacked. Knowing "1 errors" without knowing *which note* is what cost it an afternoon.

---

## Track 4 — Consolidating a page can no longer damage it *(F12)*

**Decision (Thomas, 2026-07-28): ships in full, not the minimal alarm.** It is our own code silently
damaging the owner's notes, and the damage is invisible because F10 hides it.

**The chain, verified on disk.** Consolidation appended a **second `updated:` key** to
`vault/inqom/topics/crise-kandor-clemence.md` (invalid YAML) → the indexer's re-read failed on every
campaign since → **F10 swallowed the error** → the note stayed searchable and **confidently out of
date**, its newest section absent from `chunks`. Four defects chained, none of them audible.

- [x] **Fix the writer, not the file.** `engine-skills/consolidate/SKILL.md:113` instructs the agent to
      *"append a dated section … and bump the page's `updated:`"* — freehand, with no deterministic
      writer and no validation. The skill already delegates **creation** to a script; only the
      **refresh** is freehand.
  - [x] **Done** _(2026-07-28 · `541028b`)_: `scripts/lib/note-refresh.mjs` (pure) + `scripts/refresh-note.mjs`
        (the CLI twin of `file-back-note.mjs`). It rewrites front-matter **by key**, and REFUSES rather
        than guesses: a page that does not exist (refreshing never creates), a path escaping `vault/`,
        a file with no front-matter, and a page **already damaged** — named, never appended to.
  - [x] The skill pipes to it _(2026-07-28 · `541028b`)_ and carries the four-defect chain as the
        reason, so nobody re-opens the prose version.
- [x] **Validate front-matter at the seam that already reads every note** _(2026-07-28 · `6e0101b`)_.
      A duplicate key is the difference between a defect that announces itself and one that does not.
  - [x] **The check runs only once the YAML has ALREADY failed** — js-yaml refuses a duplicated key on
        its own, so this can never turn a note the parser accepts into an error. It **upgrades a
        message, it adds no verdict**: `duplicated mapping key (6:1)` becomes the key, both line
        numbers, and the consequence (*the note keeps answering from the content it was last indexed
        with*). Anything the scan does not recognise keeps its original `YAMLException`.
  - [x] Each boundary of the scan is pinned by a test, and every one was **verified by hand-applying
        the mutant**: top-level unindented keys only (two `updated:` lines inside a block scalar are
        prose), it stops at the closing delimiter, and it declines a note with **no** front-matter (a
        hand-written note may open on `key: value` prose and carry a `---` rule further down). That
        last branch is unreachable through `parseDocument`, so `findDuplicateKey` is an exported pure
        seam rather than an exempted branch.
  - [x] **The index seam reports `err.message`, not `${err}`**: an owner reading `last-run.json` gains
        nothing from the class name, and a diagnosis written for them reads worse for it.
- [x] **The exact shape that occurred is a test** _(2026-07-28)_: two `updated:` keys, three lines apart.
- [ ] **The irony belongs in the release note, stated calmly** (CONVENTIONS §11 — fix without
      dramatizing): consolidation exists so fresh captures become findable on the page that owns them,
      and here **the act of consolidating made its own output unfindable**. **Owed at Track 9**, with
      Track 1's copy — the code of this track is done.

---

## Track 5 — An installed brain follows the launcher when it moves *(F1)*

- [x] **Root cause.** `recordSourceAndProvenance()` (`scripts/lib/engine-source.mjs:75`) stamps
      `source: {repo, ref}` into the brain's `engine-manifest.json` **at install time**;
      `scripts/update-engine.mjs:298` writes back `source: { ...source, ref }` — the **ref** is refreshed
      on every update, the **repo never is**. A repository rename propagates to **no already-installed
      brain, ever**. Every brain installed before the v4.0.0 rename still clones
      `tpierrain/second-brain-generator`.
- [x] Have the launcher declare its own canonical repo URL in `engine-manifest.json` (the **fetched**
      target), so the source of truth is the launcher, not the brain's install-day memory.
      _(2026-07-28 · `2eb6fad`)_ — new top-level key **`canonicalRepo`**, deliberately NOT `source`:
      the committed launcher manifest must keep pinning **no `source` at all**, a guard that exists to
      catch a leaked QA repoint (`engine-manifest-integrity.test.mjs`). Its sibling guard now fails
      loud if `canonicalRepo` goes missing, blank, or non-https — an `ssh://` / `git@` form would
      exclude every machine without a deploy key, and a local path would be that same QA leak.
- [x] Carry that URL through at `update-engine.mjs:298`. **Keep the recorded URL when the fetched
      manifest declares none** (older launchers), so the change can never blank a working source.
      _(2026-07-28 · `2eb6fad`)_ — pure decider `resolveSourceRepo({recorded, declared})`
      (`scripts/lib/engine-source.mjs`), triangulated in three baby-steps: declared wins, absent keeps
      the recorded one, and the blank/padded twin (a blank declaration declares nothing; a padded URL
      is adopted trimmed, since a URL with a stray newline is not clone-able).
- [x] Test the redirect-free path: a brain recording the OLD URL + a fetched manifest declaring the NEW
      one → the brain ends up on the new one, and a second run is a **no-op**. _(2026-07-28 · `2eb6fad`)_
      Two gates in `update-engine.test.mjs`. The first pins what the fix does **not** claim: the first
      update still travels the old name (the new one is only knowable from the manifest it is about to
      fetch), so **exactly one hop** still rides the redirect — the second run resolves the tag AND
      clones on the new name. The second gate is the older-launcher half.
- [x] Decide whether an unreachable recorded URL earns an actionable message (*"your brain points at a
      repository that no longer answers"*) rather than a raw `git clone` failure. **Decided: yes, in its
      cheap form** _(2026-07-28 · `25b0335`)_ — the message now names the address, says **the address
      did not answer** (one sentence that stays true for both a moved project and a train with no
      signal — no classifying of git's stderr, which would be fragile), and names `source.repo` in
      `engine-manifest.json`. **No detection logic was added**, on purpose.
- [x] **The one case the launcher's declaration cannot repair, and why it needs no code**
      _(2026-07-28)_. A brain whose recorded URL is **already unusable** never gets far enough to read
      what the launcher declares (the fetch dies first). That is exactly the hand-edit the message
      above now points at. Concretely it is the maintainer wrinkle: installing from an **SSH** clone
      bakes `git@github.com:…` into the brain, so that brain updates only on a machine with keys —
      until its first successful update adopts the https canonical URL. A user installing over https
      (the documented path) never meets it, so the installer side was **left alone**.
- [ ] **Why it is not cosmetic.** GitHub's redirect makes it work today, which is not reassuring: the
      entire update path of every deployed brain depends on an alias in a namespace **we no longer own**.
      The day a repository named `tpierrain/second-brain-generator` exists again — recreation, a
      transferred fork — those brains fetch **someone else's code**, or fail. A supply-chain-shaped
      defect in cosmetic clothes.

---

## Track 6 — The first screen speaks to you, not to the machine *(F5)*

`hookSpecificOutput.additionalContext` is **echoed verbatim to the CLI user**, prefixed
`SessionStart:startup says:`. So eight lines of agent-directed English protocol — a skill name, a CLI
command with a flag, `Offer ONCE, in the user's language`, `PAST the disclosure gate` — are the **first
thing an owner meets**, before typing a word, on a product sold to non-developers, in a language that is
not theirs. Thomas, on that screen: *"bcp trop verbeux je trouve pour les gens"*.

- [x] **Progressive disclosure — Thomas's design** _(2026-07-28 · `2243b83`)_. Split the payload by the
      moment it becomes useful:
  - [x] **Upfront (the trigger)**: the **fact** only, small enough to be harmless even when echoed —
        which universe is active, that it has no profile, that an offer is due once, in the user's
        language. **Nothing about how to run it.**
  - [x] **On acceptance (the detail)**: the seven questions, the skill section, the write command, the
        decline command. **The agent already loads the `switch` skill at that point**, which is where
        all of it lives.
- [x] **This deletes a duplication, it does not move it** _(2026-07-28 · `2243b83`)_. The trigger recited
      the question themes **and** said to load the skill whose `Describe a universe — its profile`
      section holds the canonical seven (`.claude/skills/switch/SKILL.md:134-147`). That redundancy was
      the bulk of the eight lines.
  - [x] **The deletion needed a guard the old design did not** _(2026-07-28)_. The offer no longer names
        the section or the decline command, so both now depend on the `switch` skill still owning them —
        including the word `declines` in its **description**, which is what routes a refusal there at
        all. `session-universe.test.mjs` asserts all three: lose one and an accepted offer writes a note
        of the wrong shape, while a refusal is never recorded and a one-shot offer becomes nagging.
- [x] **Field-validated, and it is the argument for the whole decision** _(2026-07-28)_. Given only the
      fact, the agent closed a real answer with **exactly the sentence Thomas described** — unprompted,
      last, in French, in one line, with both ways out named. **It composes the offer well from the fact
      alone**; the upfront detail buys nothing.
- [x] **Audit the emitters — there are FOUR, not three** _(2026-07-28 · `43f25dc`, `f63d8ac`)_. The field
      log named `session-universe.mjs`, `session-wiki-health.mjs`, `session-self-heal.mjs`; the audit
      also found **`scripts/lib/actions-log-seed.mjs`**, which nobody had counted. All four now say the
      fact and stop.
  - [x] **The housekeeping line stopped showing the owner our own directive verb** — `2 consolidation
        candidates (offer /consolidate)`. That parenthesis rode the **clean `systemMessage` channel**
        too, so it reached them twice over. The line states counts; the wrapper names the commands.
  - [x] **The restart warning stays LOUD** — a half-applied update must never pass for live. It lost the
        stage direction around an already owner-readable sentence, not its urgency.
- [x] **Target: what the owner meets at startup** _(2026-07-28)_. Roughly **1000 characters of English
      protocol → 590**, fact plus one sentence of direction per block. The honest bound: the echo itself
      is the **host's** behaviour and not ours to remove, so the last prefixed lines stay. What we own is
      how much they say, and the `systemMessage` line (`🧠 RAG up to date`) still lands clean.
- [x] **Defence in depth — and it is now a guard, not a habit** _(2026-07-28 · `f63d8ac`)_. Each emitter
      bounds its own payload in its own test, since only that test knows what the block is for. What no
      such test can notice is a **fifth** emitter appearing — so `scripts/lib/startup-payload-guard.test.mjs`
      **finds** the emitters instead of being told about them, and fails the suite on one that arrives
      without a bound. The leak scales with the hooks we add; the guard scales with them too.
- [x] **The double delivery is intact** _(2026-07-28)_. Every block still DIRECTS the agent (`tell them
      once, in their language`), so the polished relay — the good one — is untouched. Only the backstage
      copy shrank.
- [x] **It reaches the deployed fleet** _(2026-07-28)_: everything landed in `scripts/*.mjs` and
      `scripts/lib/**`, both engine-owned `replace`. No `settings.json` change, so nothing here is
      new-installs-only.

---

## Track 7 — `/rag` answers instead of suggesting `/run` *(F6)*

- [ ] Observed: the owner typed `/rag` and got `Unknown command: /rag. Did you mean /run?`. Plain
      language worked fine, so nothing is broken — an **affordance is missing at the exact word an owner
      of a RAG-backed brain reaches for first**. Worse than absence: the nearest-match points at `/run`,
      an unrelated built-in, so a curious owner lands somewhere with nothing to do with their index.
- [x] Cheapest fix that fits the product: a thin `rag` skill reporting what the natural-language path
      already produces — files/chunks, watcher liveness, embedder identity, engine + schema versions.
      **The surface exists; only its name is missing.** _(2026-07-28 · `3b8c0a6`)_ — the skill ROUTES
      to `vault_stats` / `health_check` / `reindex` and derives nothing itself; a figure it computed
      would be a second source of truth free to drift (F7, one layer down). Guarded by
      `scripts/lib/rag-skill.test.mjs`.
- [x] **It reaches the deployed fleet** _(2026-07-28)_: shipped staged at `engine-skills/rag/`, a
      `replace` glob (ADR 0026) — the sacred scrub forbids writing under `.claude/skills/`, so staging
      is the only path that reaches both a fresh install (`installer.mjs:340`) and an upgrader
      (`reconcile-brain.mjs:119`). No new manifest entry needed: `engine-skills/**` already covers it.
- [x] Sweep the neighbouring guesses (`/status`, `/index`, `/reindex`) and decide which are worth
      aliasing. **A name nobody guesses is a feature nobody finds.** _(2026-07-28 · `3b8c0a6`)_
      → **Decision: `rag` is the only directory, hence the only new slash command.**
      - `/status` **cannot be claimed** — it is Claude Code's own built-in; the skill says so, and
        plain words route here instead.
      - `/index` and `/reindex` route here **through the description**, not through a directory of
        their own: a slash alias costs a whole SKILL.md whose description is loaded into **every**
        session, and what failed in the field was the *destination* (`/run`), not the plural.
      - ↩️ **Cheap to reverse** if Thomas disagrees: one staged directory per alias, one commit.

---

## Track 8 — The profile pre-fill reads the notes you wrote *(retrieval)*

**Decision (Thomas, 2026-07-28): the retrieval fix.** The capture flow pre-filled five of seven answers
— excellent ergonomics, and the owner engaged *more* because of it — but it got the **CTO wrong** and
stated it in the same voice as the five correct answers, with nothing marking it as a guess. The drafted
reply was *"c'est bon pour tout, sauf mon rôle"*: **one keystroke from blanket acceptance.**

**Root cause, verified on disk: it never read the person notes.** The vault was neither ambiguous nor
stale. `vault/inqom/people/michael-aboumelhem.md` is tagged `cto`, updated `2026-07-19`, and its **first
two lines** answer both things the pre-fill got wrong — including the owner's own title, which the agent
had explicitly declined to guess (*"je ne veux pas l'inventer"*) **while it sat in the note about his own
manager**. There is **no person note for the name it proposed at all**.

- [x] **The fix is retrieval, not phrasing.** When pre-filling `people` and `role`, query the
      **structured source** — notes with `type: person` (and `type: universe`) scoped to the universe —
      instead of synthesising from whatever a similarity search surfaces. **The vault has a shape; the
      pre-fill ignored it and paid for it.** Write it into `.claude/skills/switch/SKILL.md`'s
      `Describe a universe — its profile` section. _(2026-07-28 · `8d2e2c4`)_ — a **Before asking**
      block: `list_documents` by `type: person`, the universe note, then `get_document` on what
      matters; the path prefix carries the universe scope (`list_documents` takes no scope argument).
- [x] **Specify the pre-fill itself while there — it is currently luck.** Nothing in `SKILL.md:134-147`
      asks for it, so another vault, another day, the same flow yields seven bare questions and the
      owner meets exactly the wall he fears. Rule: **research first, propose answers, ask for
      corrections**, with the two disciplines this run demonstrated spontaneously — **never invent**, and
      **show an unknown as an explicit blank** rather than a plausible guess. _(2026-07-28 · `8d2e2c4`)_
- [x] **Do not conclude "drop the pre-fill".** It turned seven questions into a one-line reply. Its cost
      is concentrated in the one interaction that costs nothing: **agreeing**. _(kept)_
- [x] Keep the skill's copy saying that accepting a pre-fill records the agent's **inferences** as the
      owner's **stated facts**, in a note injected as ambient truth at every session start. Consented
      and repairable, but worth saying. _(2026-07-28 · `8d2e2c4`)_ — the copy did **not** exist yet, so
      it was written, not kept.
- [x] **Keep the batch.** The alternative is seven round-trips, which the skill already rejects as an
      interrogation (`SKILL.md:136`, *"Do not interrogate"*). If it still reads long, the lever is
      **question 5's triple ask** (*"Qui manque ? Qui est de trop ? lesquels sont tes managés vs tes
      pairs ?"*), not the number of questions. _(2026-07-28 · `8d2e2c4`)_ — kept and **pinned by a
      guard**, because "propose then correct" invites walking the owner through values one at a time,
      which is the interrogation rebuilt. Q5 itself was left alone: with a roster proposed, it already
      becomes a correction ask.
- [x] Hand a fixture to Gate 4: *"the vault states X in a `type: person` note — does the capture flow
      propose X?"* Cheap, deterministic, and it locks the behaviour this run got wrong.
      _(2026-07-28 · `8d2e2c4`)_ — **written out in full** in `ROADMAP.md` under Gate 4 (seed shape,
      decoy, pass/fail), so the gate builds it instead of re-deriving it.

> **What the guard does NOT prove.** `scripts/lib/switch-skill-prefill.test.mjs` pins the SOURCE (the
> skill still names the structured query, the consent copy, the batch). Only Gate 4's fixture can show
> the flow **behaves**. Do not report this track as behaviourally verified.

> **Deliberately NOT in this track** (Thomas chose the retrieval form): arbitrating by date when
> pre-filling, citing each proposed value's source note, and marking inference apart from reading. They
> repair a *guess*; here there was no need to guess at all. Keep them in the field log for Gate 4.

---

## Track 10 — Commits stop tracking every pause

**Why**: today one 5 s re-arming debounce governs **both** indexing and persistence, so on the watcher
path every pause longer than 5 s costs a commit **and a network push** (with `auto-push.mjs`'s blocking
3 s retry). Half an hour of writing in Obsidian with 20 real pauses = up to 20 of each. The four locks
in START HERE are real, but they bound the **indexing**, not the push. Decided with Thomas 2026-07-28.

**Scope**: the **watcher** path only. Claude's own writes keep committing per `Write|Edit` (PostToolUse)
and pushing per turn (Stop). This track can only make the watcher quieter.

- [x] **CAP settled** _(2026-07-28, Thomas)_: quiet window **2 min**, hard cap **10 min** since the
      first write not yet persisted. Whichever comes first.
- [x] **The two timers are split.** New `rag/src/lib/persistence-scheduler.ts`; `ReindexScheduler` is
      **untouched**, so search freshness is unchanged. A second class rather than a flag: the two
      windows race, and that logic has no business inside the indexer's debounce.
- [x] **TDD, red first**, five tests on a virtual clock (the sibling's fake fires everything at once,
      which cannot tell a 2-minute window from a 10-minute one, so this one honours durations).
- [x] **The behaviour is pinned**: writing every 30 s commits **0** times, not 13 (the red run said
      13); the cap fires at exactly 10 min and gives **3** commits over 30 min of unbroken writing;
      an idle vault commits nothing and leaves **no timer armed**; a write during a slow push
      coalesces into one rerun instead of contending for `.git/index.lock`.
  - [x] **The one test that passed first try was mutation-checked by hand** (drop the cap-timer clear
        in `disarm()` → 2 tests go red). A guard that has never been seen to fail is not a guard.
- [x] **The campaign hands off instead of running git.** `requestPersist` is **required**, not
      optional, so the composition root cannot silently forget it — the compiler asked for the wiring.
      `persistCampaign` → `persistVaultNow` (the gate moved up to the campaign; what is left is the
      named seam where the scripts actually run, tracing what it did).
- [x] **Both suites green + CI spoke on the push** _(run `30391966991`, 1 m 11 s)_: rag **447**,
      harness **1042**, local-mirror **257**.
- [x] **ADR 0037 amended in place** (CONVENTIONS §6bis/§6ter, written clean for a fresh reader):
      whether-vs-when, the two windows, and cost #3 rewritten to **own the timer** against ADR 0009
      rather than dodge it — the writers this rung serves emit no event, so a timer is not a stand-in
      for a better mechanism, it is the mechanism. ADR 0011's header and `maintainers/README.md`
      follow. The sync fast-path is recorded there as **deferred, not rejected**.
- [ ] **Release-note line**, owed at Track 9, stating **two numbers, not one**: searchable in seconds,
      committed within a couple of minutes (ten at the outside). ⚠️ **Do not let the seconds figure
      stand for both** — search freshness and durability stopped being the same promise.
- [ ] ⚠️ **For the marketing pass at Track 9** — this track makes two published claims imprecise:
      (a) `README.md:368` *"only the delta is re-embedded, **within seconds** of an edit"* stays true
      for indexing, but the reliability board (`README.md:325`, `docs/marketing-image-prompts.md:140`)
      sells **"real event triggers, not timers"**, and persistence is now deliberately a timer;
      (b) `SETUP.md:164` describes the push as *"debounced, once per turn"* — still true of the hook
      path, no longer the whole story now the watcher pushes on its own window.

---

## Track 9 — Cut the release

- [x] ⚠️ **`/code-review` BEFORE the merge.** Reproduce each finding against real code before accepting
      it; fix each in TDD, red first, its own commit. _(2026-07-28 · run on `main...HEAD`, 66 files)_
      **Six findings, ALL SIX reproduced on disk — none is a false positive, and none is caught by the
      existing 1029 + 436 green tests.** Every one lands in code THIS release adds (Tracks 1, 3, 4), so
      **none of them can be dropped by moving the cut line.** Fix list, in severity order:
  - [x] **R1 (HIGH) — the launcher guard fails OPEN.** `rag/src/lib/campaign-persist.ts:23`
        (`persistenceApplies`) gates on `"provenance" in manifest`, but the **committed launcher
        manifest carries `"provenance": {}`** (verified). So the guard returns **true on the launcher**,
        which has a real `vault/`. A maintainer running the engine from the generator gets their
        in-progress working tree swept into `auto: vault/claude sync` + pushed. The test at
        `campaign-persist.test.ts:117` **asserts that exact launcher shape returns true**, under a
        comment claiming the launcher "carries no provenance" — the test pins the bug.
        **Fix: gate on `source`**, which `engine-manifest-integrity.test.mjs:117` guarantees the
        launcher pins NOT, and `enrichManifest` stamps at install. _(2026-07-28 · `7a88257`)_ — keyed on `source`; the test now reads the REAL committed manifest, and all four hand-applied mutants die.
  - [x] **R2 (HIGH) — `scripts/refresh-note.mjs` reaches no brain, but the skill calling it does.**
        The new entry point is in **no manifest regime**, and `computeApplyPlan` is a strict
        write-allowlist → `update-engine` never copies it. `engine-skills/**` IS `replace`, so every
        brain upgrading to v4.4.0 gets `consolidate/SKILL.md:118`'s **mandatory** `| node
        scripts/refresh-note.mjs` and a `Cannot find module` on every refresh, with the old freehand
        prose deleted. Its helper `scripts/lib/note-refresh.mjs` ships (`scripts/lib/**`), which masks it.
        **Fix: declare it, + a guard test on the real invariant** — *every top-level script a delivered
        skill invokes must itself be declared*. (Blunter "every script is declared" is wrong: 3 others
        are undeclared **on purpose** — `clear-example-notes`, `pick-folder`, `run-eval` are
        install-time/maintainer-only and no delivered skill calls them.) _(2026-07-28 · `eab28bd`)_ — declared, plus the invariant guard; `computeApplyPlan` now carries it.
  - [x] **R3 (MED) — an unbounded `git push` can freeze live indexing for the whole session.**
        `buildScriptRunner` passes `{ cwd }` only to `promisify(execFile)` — **no `timeout`** — and
        `ReindexScheduler.trigger` holds `running = true` for the entire await. A hung push (unreachable
        remote, credential helper waiting) never resolves → every later vault write only sets `pending`
        → **nothing is indexed again until the MCP server restarts**. Before this release the campaign
        body was bounded local work. **Fix: bound the child.** _(2026-07-28 · `c9ecf87`)_ — `PERSIST_TIMEOUT_MS = 120_000`; on expiry the child is killed and the next campaign retries.
  - [x] **R4 (MED) — a duplicate-key error naming a key that does not exist.** `findDuplicateKey`'s
        `^([^\s:#][^:]*):` also matches an **unindented block-sequence item whose value holds a colon**.
        Reproduced: `links:` / `- https://a.com` / `- https://b.com` → `{key: "- https", first: 3,
        second: 4}`. When gray-matter failed for an unrelated reason, the owner is told
        `damaged front-matter key "- https": declared twice` and pointed at **two valid lines**. The
        sibling `scripts/lib/note-refresh.mjs:32` uses `^([A-Za-z0-9_-]+):` and is immune — **the two
        disagree**. Fix: converge on the strict one. _(2026-07-28 · `481ab88`)_ — converged on the strict class, tie documented in BOTH files.
  - [x] **R5 (LOW) — a valid-JSON `null` spec crashes with a stack trace.** `spec.path ?? ""`
        (`scripts/refresh-note.mjs:56`) sits **outside** the `JSON.parse` try/catch. Reproduced:
        `echo null | node scripts/refresh-note.mjs` → `TypeError: Cannot read properties of null`,
        breaking the skill's stated contract ("Exit 1 = refused, and it says why"). _(2026-07-28 · `5cd0bbb`)_ — shape validated once, before any use; live repro now exits 1 with a sentence.
  - [x] **R6 (LOW) — `"persisted"` is not evidence that anything was committed.** `attemptCommit`
        returns `"committed"` unconditionally after `add`/`commit` (`buildGit` swallows every git
        error into `{ok:false}`, which nobody reads) and `auto-push.mjs` always exits 0. So
        `persistCampaign` can only ever say `"failed"` if the **child fails to spawn**. An
        `.git/index.lock` contention with the PostToolUse hook → nothing committed, yet the watcher
        traces `💾 vault persistence: persisted`. **In a repo whose rule is "don't pretend", the log
        pretends.** _(2026-07-28 · `e3ce3b2`)_ — `attemptCommit` reads git's verdict; the result is `"ran"` and the trace says `commit + push ran`.
  - [x] **Clean bill on the rest of the diff** (checked, not assumed): `reindex-reporter` error seeding
        is appended not overwritten; `unaccountedNotes` reaches `vault_stats` via `status-report.ts:57`;
        the `statusLine` retreat is provenance-guarded and byte-identically idempotent;
        `resolveSourceRepo` no-ops on blank; `writeLastRunMarkdown` writes into `CACHE_DIR`, so the new
        commit trigger **cannot feed itself**.
- [x] **Cut line DECIDED — nothing is cut, Tracks 1-8 all ship** _(2026-07-28, on the real diff)_.
      The review found no reason to cut. Tracks 5-8 are each small, green and independent, and **no
      finding lived in them** — R1/R3/R6 are Track 1, R2/R5 are Track 4's tooling, R4 is Track 3.
      Cutting would have dropped working code without removing a single defect.
- [x] **CI is the arbiter, never a local green** (CONVENTIONS §9): 7/7 — Node 22/24/26 × macOS + Windows,
      plus the Windows installer e2e. _(2026-07-28 · PR #53, run `30388758449`, all green)_ — the
      first run was **red on all four Windows jobs** (a fixture path built by hand instead of joined,
      `b4b627d`); see START HERE for what that cost and why the rule exists.
- [x] **Mutation snapshot pinned to the tag** (CONVENTIONS §5ter), recorded in
      `maintainers/mutation/RESULTS.md` _(2026-08-02 · `5a66510`)_ — measured, killed, and now
      **written down**: the v4.4.0 section carries the rag before/after table, the 16 scripts per file,
      the 0 % named debt in its own section, the two worktree traps (also folded into the file's
      Gotchas), the `readFileSync("utf8")` equivalent recorded **once for the repo**, the correction
      that a worktree dry-runs the FULL harness command (so the old narrowing was never needed), and
      local-mirror carried over rather than re-measured. **What it still owes is the release note's
      own lines**, tracked in the release-note box below — do not re-open the measurement.
      Baseline at v4.3.0:
      scripts **97.27 %**, local-mirror **90.44 %**, rag **90.42 %**.
      **Scope decided on the diff** (`main...HEAD`), the usual targeted run, not a full re-audit:
  - [x] **rag** — the 10 changed `rag/src/lib/**` prod files: `campaign-persist`, `campaign-run`,
        `config`, `engine-version`, `frontmatter-parser`, `index-manager`, `persistence-scheduler`,
        `progress-report`, `reindex-reporter`, `vault-watcher`. Command: the `stryker.rag.config.mjs`
        run narrowed with `--mutate "<the 10 paths>"`.
        **First run: 90.39 %** _(562 mutants, 54 survivors)_ — and the honest read is that the number
        hid the problem. **`persistence-scheduler.ts`, the file this release ADDS, came out at 76.32 %**,
        the weakest of the ten. **20 of the 54 survivors sat on lines this branch wrote**; the other 34
        are pre-existing and named in `RESULTS.md`.
    - [x] **18 of the 20 killed** _(2026-07-28 · `bebce0c`, `474d09a`)_, each hand-applied and watched
          red before the fix, then reverted. rag **454** green.
    - [x] **2 recorded as equivalents, with the reason**: `campaign-persist.ts:30`
          (`typeof manifest !== "object"` is only observable with a *function* carrying a `.source`
          object — `JSON.parse` cannot produce one) and `engine-version.ts:83` (dropping the `"utf-8"`
          encoding hands `JSON.parse` a Buffer it decodes to the same string). Neither is killable
          without a fixture the real domain never produces.
    - [x] **Confirmation re-run** of the same 10 files _(2026-07-28)_: **90.39 % → 93.93 %**, and the
          two files this release adds are now **100 %** — `persistence-scheduler.ts` (was 76.32 %) and
          `campaign-run.ts` (was 86.96 %). `frontmatter-parser` 95.07 → **97.87 %**, `progress-report`
          89.61 → **93.51 %**, `engine-version` 81.63 → **83.67 %**. The 34 remaining survivors are
          pre-existing lines plus the two recorded equivalents — **verified line by line**, nothing of
          this release's own is left standing.
  - [x] **scripts** — the 16 changed `scripts/**` prod files, in a **disposable worktree**
        (`inPlace` on the real tree once wiped the demo vault; recipe in RESULTS.md).
        **Good news, correcting RESULTS.md**: the FULL harness command dry-runs fine in a worktree
        (**1033 green**) — `engine-manifest-integrity.test.mjs` only broke in the *sandbox*, which has
        no `.git`. So this run is **not narrowed**, and its score is not pessimistic. Fold that back
        into `RESULTS.md` when writing the snapshot.
    - [x] **Run it in BATCHES of < 9 min.** ⚠️ Learned twice on 2026-07-28: the whole run is ~30 min
          for ~1230 mutants, and a background command is **capped at 10 min** — the first attempt was
          killed at 40 %. `setsid` does not exist on macOS, so detaching is not the way out.
          Driver: `scratchpad/run-batch.sh <name> "<comma-separated files>"`, which **resets the
          worktree first** (a killed run leaves Stryker's `@ts-nocheck` behind and the next dry run
          dies on it — that exact failure cost a restart).
          Batches: **A** `update-engine` · **B** `reconcile-brain` · **C** `session-status`,
          `session-self-heal`, `status-line` · **D** `universe-reminder`, `engine-fetch`,
          `engine-source`, `refresh-note`, `auto-commit`, `note-refresh` · **E** `actions-log-seed`,
          `wiki-health-nudge`, `restart-signal`, `restart-nudge`, `status-line-retreat`.
    - [x] ⚠️ **Two worktree traps, both paid for on 2026-07-28 — write them into `RESULTS.md`, they
          are new and neither is in the existing gotchas.** _(2026-08-02 · `5a66510`: both in the
          v4.4.0 section AND in the file's `Gotchas learned`, where the next run will meet them.)_
      - [x] **A mutant of `auto-commit.mjs` COMMITS the instrumented tree.** The worktree came back
            sitting on an `auto: vault/claude sync` commit of its own, so `git checkout -- .`
            faithfully restored *Stryker's instrumentation* and every later dry run died on
            `SyntaxError: Identifier 'stryNS_…' has already been declared`. The reset has to be
            `git reset --hard <sha>` + `git clean -fd`, never `checkout -- .`. This is the worktree
            doing its job — the same mutant on the real tree would have committed **there**.
      - [x] **`disableTypeChecks` must be OFF for this package.** Stryker prepends `// @ts-nocheck`
            to ~370 files, and under `inPlace` that lands on the real worktree. These are plain
            `.mjs` with nothing to type-check. The CLI has no flag for it, so the batch run uses a
            tiny `stryker.scripts.batch.config.mjs` that spreads the base config and turns it off.
    - [x] ✅ **CONFIRMATION RE-RUN DONE** _(2026-08-02, worktree, two batches, ~7 min total)_.
          The three files whose survivors were ours moved:
          `note-refresh.mjs` **80.26 → 98.68 %** (1 survivor, a recorded equivalent) ·
          `reconcile-brain.mjs` **93.02 → 95.93 %** (7 survivors, **6 out of scope**) ·
          `refresh-note.mjs` **57.41 → 68.52 %**.
          **Read `refresh-note`'s number correctly, and say so in `RESULTS.md`:** all 17 remaining
          survivors sit at lines **28-39** (`realRefreshDeps`, the I/O lambda object) and **98-99**
          (the `isEntrypoint` boot guard). **Nothing between 46 and 96 survives** — `runRefresh`,
          the whole decision logic, is fully killed. What is left is the same *observed-by-nothing
          boot/IO seam* as `session-status` / `status-line`, i.e. **the named debt**, not a gap in
          this release's logic. Logs: `maintainers/mutation/reports/confirm-batch{1,2}.log`.
    - [x] **Measured, all five batches** _(2026-07-28/29)_. Per file, worst last:
          `auto-commit` **98.31 %** · `update-engine` **96.94 %** · `engine-source` **94.00 %** ·
          `reconcile-brain` **93.02 %** · `universe-reminder` **90.91 %** ·
          `status-line-retreat` **86.96 %** · `actions-log-seed` **83.33 %** ·
          `note-refresh` **80.26 %** · `refresh-note` **57.41 %** · `engine-fetch` **53.52 %** ·
          `restart-signal` **37.50 %** · `session-self-heal` **34.51 %** ·
          **`session-status` 0.00 %** · **`status-line` 0.00 %**.
          At **100 %**: `restart-nudge`, `wiki-health-nudge`.
    - [x] ⚠️ **THE FINDING, and it is not a regression — verified, not assumed.**
          `session-status.mjs` and `status-line.mjs` scored **0 %**: 250 mutants, **zero killed**.
          Both are top-level scripts that RUN on import, so nothing can import them and no test
          observes them — `git log --diff-filter=A` shows `scripts/status-line.test.mjs` and
          `scripts/session-status.test.mjs` have **never existed** in this repo's history. The
          **logic** they wire is fully tested (it lives in `scripts/lib/**`); the **wiring** is not.
          This release rewrote 50 lines of one (Track 2) and 27 of the other (Track 6) **without
          creating the hole** — every published tag so far carries it.
          CONVENTIONS §5ter item 2 prescribes the cure (`BootDeps` + an `import.meta.url` guard,
          earned back with one subprocess test), but that is a refactor of two **fleet-deployed**
          scripts on the eve of a tag.
          **✅ DECIDED with Thomas 2026-08-02 — option (a): record it as NAMED DEBT and ship.** Not
          "we'll get to it": the hole is written into `RESULTS.md` (its own section, with the reason
          the score is 0 and the cure §5ter prescribes) and stated in the release note's honest
          bounds, so the next tag inherits a named debt rather than a silent one. **The BootDeps
          refactor is a release of its own**, deliberately NOT done on the eve of a tag on two
          fleet-deployed scripts. **Do not re-open this** — re-raise it only when planning that
          refactor.
      - [x] Write the 0 % debt into `RESULTS.md` (own section: why 0, what is actually covered in
            `scripts/lib/**`, the §5ter cure, and that every published tag carries it).
            _(2026-08-02 · `5a66510`)_ — plus a ⚠️ on the `Current scores` row, because the 97.27 %
            baseline had no way to show it, and the section names the whole boot/IO tier
            (`engine-fetch`, `restart-signal`, `session-self-heal`, `refresh-note`'s 17) as the
            package's largest remaining debt.
      - [ ] Carry one honest line about it into the release note (Track 9's release-note box).
    - [x] Same discipline as rag: cross-reference every survivor against the lines
          `git diff main...HEAD` actually adds, kill what is ours, name what is not.
          ⚠️ **The Stryker HTML reports are GONE** — both run worktrees lived under the session
          scratchpad and macOS's temp cleanup emptied them (2026-08-02, `git worktree prune`).
          **This cost nothing**, because the survivors were enumerated in this box while the
          reports were open; that enumeration is now the record. **Lesson for the next release:
          copy the per-file scores AND the survivor list into the plan the moment a run ends** — a
          scratchpad worktree is not storage.
      - [x] **In scope and worth killing** (this release's own code) — **DONE 2026-08-02**, every
            mutant hand-applied and watched red before being reverted, each file its own commit:
        - [x] `note-refresh.mjs` — the front-matter regex (3), the duplicate-key refusal message,
              `if (!today) throw`, the `updated:` finder, the body-trim. _(`5e21587`)_ **Two were
              real defects, not just unwatched lines**: a `---` rule in the body swallowed half the
              page into the frontmatter under a greedy match, and a **CRLF** note (Windows, which is
              in the CI matrix, and Obsidian writes CRLF there) was refused as "having no
              frontmatter". The `^updated:` anchor turned out to protect a page carrying
              `last_updated:` from having the WRONG key overwritten. 7 tests → 13.
        - [x] `refresh-note.mjs` — the **vault-containment refusal** and the "does not exist"
              message. _(`8458ce1`)_ The containment guard's trailing slash is the whole guard:
              without it `../vault-secrets/x.md` resolves outside `vault/` and passes. The
              does-not-exist message was matched with `/does not exist|file-back/i`, an **OR that
              let either half vanish** — including the half naming `file-back-note.mjs`. Both now
              asserted whole. 6 tests → 8.
        - [x] `reconcile-brain.mjs` — the four on Track 2's retreat wiring. _(`c72e20a`)_ **One
              cause, one test**: every existing test had either OUR line (retired) or a clean
              custom one, so the **healing** branch — the only place we ever write into someone
              else's `statusLine` — was never exercised, and with the hooks converged that repair is
              the ONLY reason to write. Two passes: converge, then the owner sets THEIR line with
              the `cmd /c` prefix the pre-fix installer taught them. 54 tests → 55.
        - [x] `update-engine.mjs` — `skillsPreserved = []`. **NOT a coverage gap: a genuine
              EQUIVALENT, verified by hand.** Stryker's array mutant injects a *string*, the loop
              destructures `{ reason }` off it → `undefined !== "customized"` → `continue`, so
              nothing is observable. Proof it is the mutant and not the test: the sibling defaults
              on the same line (`installedSkills = []`, `statusLineRemoved = false`) **die** against
              the existing minimal-report test. Killing it would mean changing production to reject
              a shape the producer cannot emit. **Record it, do not chase it.**
      - [x] **The confirmation run's OWN survivors, swept the same way** _(2026-08-02 · `794058a`,
            `d1a9d07`)_ — and two of them were **live defects**, not merely unwatched lines:
        - [x] **The duplicate-key check refused a VALID page.** Unanchored, `authors:` followed by
              two `  - name:` list entries reads as one key declared twice → the page is named as
              damaged and the owner has nothing to fix. Exactly what the check's own comment warns
              about (rag's looser twin invented `- https` out of a list of URLs).
        - [x] **The no-frontmatter refusal was asserted with `/frontmatter/i`** — which also matches
              *"Cannot read properties of null (reading 'frontmatter')"*, so deleting the refusal and
              letting a TypeError escape kept the test green. Now asserted whole.
        - [x] Four narrower kills: frontmatter that does not open the file is not frontmatter; a stub
              with no body and no trailing newline is still a living page; a blank or `#` line inside
              frontmatter declares no key; a section arriving with trailing blank lines is
              normalised. Plus `toPosix` on Windows — flattening `\` to nothing yields
              `C:brainvault`, so a refresh reports *"does not exist"* for a note sitting right there.
        - [x] `reconcile-brain`'s one in-scope survivor: `statusLineWasRemoved`'s `false`
              initialiser. With no `settings.json.template` to read, the settings pass is skipped
              entirely — reporting `true` would have `update-engine` announce *"your own status line
              is back"* to an owner whose settings were never opened. **The F7 shape, inside the
              release that closes F7's siblings.**
      - [x] **Recorded EQUIVALENT (note-refresh's last survivor)**: dropping the trailing `$` from
            `FRONTMATTER_RE`. `[\s\S]*` is greedy to the end already, so the anchor buys nothing at
            runtime; keeping it is documentation of intent, not behaviour.
      - [x] **A systematic equivalent to record ONCE, not per file** _(2026-08-02 · `5a66510`, its own
            ⭐ bullet in the equivalents list, flagged "do not re-derive it per file")_: every
            `readFileSync(p, "utf8")` → `readFileSync(p, "")` survivor. Node returns a **Buffer** for
            an empty encoding and `JSON.parse` decodes it to the same string. Same finding as
            `engine-version.ts:83` on the rag side; it accounts for a large share of the
            pre-existing survivors in `reconcile-brain`, `engine-fetch` and `update-engine`.
  - [x] **local-mirror** — ⛔️ **nothing to run**: this release touches no `local-mirror/src/**` file.
        Its **90.44 %** carries over from v4.2.0 unchanged; say so rather than re-measuring.
        _(2026-08-02 · `5a66510` — written as such in both the `Current scores` row and the v4.4.0
        section: an untouched package must not get a new number.)_
  - [x] Kill every survivor that sits **inside this release's own code**, or record it as an accepted
        equivalent with the reason. Pre-existing survivors stay out of scope, but name them.
        _(2026-08-02 — done on both sides; the five equivalents are listed in `RESULTS.md`.)_
  - [x] ⚠️ **The two runs must not overlap** — the CPU oversubscription gotcha turns genuine kills
        into false timeouts and inflates the score. One package at a time. _(Honoured: rag first,
        then the scripts batches, sequentially in a worktree.)_
- [x] **Marketing-surface pass** (CONVENTIONS §10) _(2026-07-28 · `17fb75f`; re-verified on disk
      2026-08-02 — `SETUP.md:163-175` states the two numbers as two, the reliability prompt reads
      "commits on a quiet window, pushes once per turn", and both claims Track 10 flagged are settled)_,
      **before** writing the release note, in this order:
      *what did this release make false, or merely imprecise?* (hunt the absolutes — *never*, *only*,
      *always*, *untouched*, *sacred*, *it can only add*), then *what did it make true that we do not
      sell yet?*
  - [x] Re-read `README.md`, `EN-QUOI-C-EST-DIFFERENT.md`, `SETUP.md`, `CONNECTORS.md`, and the boards
        through their README alt texts + `docs/marketing-image-prompts.md`. _(2026-07-28)_
  - [x] ⚠️ **Two claims this release moves specifically**: (a) v4.3.0's sentence about Obsidian notes
        being committed — **Track 1 makes it true**, say so; (b) anything asserting the reconciler
        *only adds* and *never removes* — **Track 2 makes that imprecise**. **Both fixed.**
  - [x] **The verdict, surface by surface** _(2026-07-28)_:
    - [x] **`SETUP.md` held the one genuinely stale sentence**, and it was the release's own subject:
          the session-start sweep was described as what catches "notes you typed **directly in
          Obsidian** (Claude never saw them, so no hook fired)". That is what Track 1 removes. Rewritten:
          the watcher now carries those notes, and the sweep is reframed as the backstop for what is
          written **with the brain closed** — which stays true, because the watcher lives inside a
          Claude session (P2 was rejected). The two numbers are stated as two, never as one.
    - [x] **`README.md`, three edits.** The hooks bullet said automation "fires on real events" and
          listed only the three hooks; a note written outside Claude has no such event, so the watcher
          is named there. The reconciler's "one narrow exception" is **two** now — Track 2 REMOVES a
          key, so "only adds" needed the provenance clause, not a louder absolute. And the guardrails
          line gained "only ever touches files it can prove are its own".
    - [x] **The reliability board: prompt updated, image NOT re-rendered** — a deliberate call, and
          the reason it is written down. `docs/marketing-image-prompts.md` sold "debounced reindex &
          auto-push (once per turn)"; the push is no longer once-per-turn on the watcher path. The
          prompt now reads "commits on a quiet window, pushes once per turn" so the **next** render is
          right, while the **alt text is left alone on purpose**: it describes the PNG that is actually
          on the page, and rewriting it would make the description outrun the image.
          ⚠️ **"real event triggers, not timers" was re-read and KEPT**: the trigger is still a real
          file landing on disk — only the moment the batch closes is a window — and the same sentence
          already conceded "debounced reindex". Flagged as imprecise by Track 10, judged defensible
          here; **re-open it if the next render is commissioned anyway.**
    - [x] **The boring verdicts, worth writing**: `EN-QUOI-C-EST-DIFFERENT.md` needs nothing — "every
          change is committed automatically" only became **more** true. `CONNECTORS.md` is untouched by
          this release. No absolute broken in either.
- [ ] **Release note** (CONVENTIONS §11, English): a two-sentence lead saying what the reader gains, in
      their words; `What you get` (≤ 6 emoji bullets); `What you have to do` (the command and the cost);
      then `---` and `Under the hood` with everything technical — nothing cut, moved below the fold.
      **Do not alarm**: state each fix without dramatizing the defect, and never advertise a bug that
      never shipped.
- [ ] Draft 3-4 `v4.4.0 — The One Where …` codenames; **Thomas picks**.
- [ ] Merge, tag, publish; rewrite the PR title and body to the release scope.
- [ ] **Archive this plan on ship** (CONVENTIONS §7), refresh the memory **pointer** (not a copy), and
      update `ROADMAP.md` Gate 4 (D) + the field log's Tracking with what shipped.
      **F3 and F7 stay deferred to Gate 4** — frozen scope, unchanged.

---

## Verification — watched on a real brain, not merely green

The QA that produced this plan held one standard: **every entry verified on disk, never taken from the
brain's own account.** The fixes owe the same.

- [ ] **Track 1, on a real brain**, three writers, `git log` checked after each: a note typed in
      Obsidian; `rm` of a note from inside a session; a run of `set-universe-profile.mjs`. Then move an
      Obsidian pane and confirm **no** commit fires. **Still owed** — it needs an installed brain with a
      live watcher, which the launcher deliberately is not (`persistenceApplies` refuses it).
  - [x] **The process-level half is proven** _(2026-07-28, disposable repo, not a real brain)_: a
        brain-shaped git repo holding the real `scripts/`, with a note that was **never in git** →
        `persistCampaign` through the REAL runner (real `node`, real `git`, real `auto-commit.mjs` +
        `auto-push.mjs`) → the success result (**named `persisted` at the time of the run; renamed
        `"ran"` by R6**, which is the honest claim), the note committed as `auto: vault/claude sync`,
        working tree clean. Push correctly **skipped**: no remote, `autopush` unset. Pointed at a non-existent brain
        it returns `failed` and **exits 0** — the failure path does not throw. What this does NOT cover,
        and why the box above stays open: the chokidar → debounce → campaign chain on a live vault.
- [ ] **Track 2**: open a CLI session in a brain and confirm the owner's own status line is back; run
      `update-engine` on a brain whose `statusLine` was hand-customized and confirm it is **preserved**;
      confirm the restart nudge still reaches the owner after an update that needs one.
- [ ] **Track 3**: plant a note with broken front-matter, run a campaign, confirm `watcher.log`,
      `last-run.json` and `vault_stats` now **agree**, and that the arithmetic invariant fails loudly.
- [ ] **Track 4**: run `/consolidate` on a page and diff its front-matter — one `updated:` key, in place.
- [ ] **Track 6**: open a CLI session and read the first screen as a non-developer would. **Still owed,
      and it needs a real brain** — the payloads only appear on a vault with a universe, a missing
      profile and pending housekeeping. What IS pinned without one: the exact rendered screen (590 chars
      against roughly 1000), asserted by the length bounds in each emitter's test.
- [ ] **Track 8**: on a universe holding a `type: person` note tagged `cto`, run the capture flow and
      check it proposes that person.

---

## Out of scope, deliberately

- [ ] **F3** — a 10-minute reindex reports nothing while it runs. **Deferred to Gate 4.**
- [ ] **F7** — the brain reports an unverified outcome in the measured voice. **Deferred to Gate 4.**
      Note that **Track 3 is F7's engine-side half**: an agent cannot be disciplined into surfacing a
      number the engine never wrote down.
- [x] **P2** — committing while Claude is never open. ❌ **REJECTED** (Thomas, 2026-07-28): it needs a
      daemon outside any session, *"trop de choses et un côté immersif qui ne va pas plaire aux gens"*.

## ⏸️ Parked until after this release — the two drive-by dependency PRs

Raised 2026-07-29 (Thomas asked why three PRs were open), then **parked by Thomas: "on verra ça à mon
retour"** (he is travelling). **No decision was taken, nothing was closed, nothing was pushed.** PR #53
is this release and is the only legitimate one of the three.

- [ ] **#52 — `adm-zip` in `rag/`, from an external contributor. The fix does not work.** `adm-zip` is
      transitive only, pulled by `onnxruntime-node`, which pins `^0.5.16`. Adding `adm-zip: ^0.6.0` as a
      **direct** dependency of `rag/package.json` does not remove the vulnerable copy — the PR's own
      lockfile diff **adds** a nested `node_modules/onnxruntime-node/node_modules/adm-zip@0.5.18`. Net
      effect: one unused direct dependency, and the flagged version still on disk. **Recommendation:
      close with a polite explanation.**
- [ ] **#48 — `fast-uri` in `local-mirror/`, same contributor, same anti-pattern, milder.** `fast-uri`
      comes from `ajv` (`^3.0.1`), and 3.1.3 satisfies that range, so the hoisted copy genuinely moves;
      but `npm update fast-uri` did the job without touching the manifest. Its base is **stale**: it
      would put the lock's `version` field back to `0.2.0` while `main` is at `0.3.0`.
      **Recommendation: close, same reason.**
- [ ] **Then do the real pass, in its own PR, after v4.4.0 has shipped** — each PR addresses one
      advisory out of many: `npm audit` reports **12** vulnerabilities in `rag/` (including
      sharp/libvips, **no fix available**) and **5** in `local-mirror/` (js-yaml, hono…). Do not fold
      this into the release branch.
