<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- STATUS: 🧭 LIVING — ordering authority across the active plans.               -->
<!-- This file owns the CROSS-PLAN ORDER only. It never duplicates a plan's         -->
<!-- content (checkboxes, done/remains, commits): each plan stays the single        -->
<!-- source of truth for its own state; this is the map that says which goes first. -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# 🧭 ROADMAP — cross-plan ordering authority

**What this is.** A single place that answers *"which plan moves next, and what must ship before
what?"* when several plans are in flight at once. It is a **map + a gate-list**, deliberately thin:
pointers, not copies. Each plan below remains the **canonical** owner of its own steps, commits and
remaining work; do not restate that here (anti-context-rot). Open a plan to work it; open this file
to know the **order**.

> Sibling conventions: `maintainers/CONVENTIONS.md` (checkboxes on every step; one canonical plan =
> the repo's; plan-done = archived). Memory pointer: `fleet-upgrade-sequencing`.

---

## ▶️ DIVERSION LIFTED — the unfreeze release is LIVE again (owner, 2026-08-19)

**The framing conversation happened, and it sent the subject elsewhere than expected.** By *Graph
Engineering* the owner meant **orchestrating subagents to BUILD the next release**, not a graph inside
Kenjaku's runtime (*"c'est aucune de ces deux options"*). So:

- **`prospective/v5-unfreezes-the-existing-fleet-action.md` is the LIVE chantier** and owns v5.0.0.
  Its predecessor `archived/update-regime-owns-what-it-shipped-action.md` built S1-S6 and is closed.
- **How it gets built is itself a subject**, with its own plan and its own open arbitrations:
  `prospective/agent-orchestrated-release-mode-action.md` — the working contract (what is delegable,
  the deterministic-check rule, the human stop points, the loop quota). **Read it before dispatching
  anything to a subagent.**
- **`prospective/llm-wiki-vs-embedding-rag-karpathy-graphify.md` goes back to a WATCH note.** The
  runtime-graph question survives and is **deferred, on his explicit ask, to AFTER this release** — it
  is a study to do *with* him, not work to pick up. He also **ruled out** building this release on top
  of a knowledge graph of the codebase (too long, too little code for the payoff).

> 🛑 **Why the previous entry existed, kept because the lesson is not spent.** The 2026-08-15 diversion
> was taken in conversation and written NOWHERE. A session resuming after a `/clear` read the pointer,
> the ROADMAP and the release plan, found *"NEXT TO EXECUTE"* everywhere, and started the release the
> owner had already diverted from — until he stopped it by hand. That is exactly the failure
> `rules/plans.md` names (*a decision taken in conversation dies at the `/clear` if it only lives in
> the thread*), and the rule did not fire: the save point is **every hand-back**, not the end of a
> step. This unpause is written the same day it was decided, for the same reason.

---

## The invariant (the one order not to re-invert)

Decided with Thomas 2026-07-18, extended 2026-07-19 (universes). When juggling plans, keep this sequence:

1. 🟢 **Green** — legacy-**safe** fresh-install layering of the constitution (new engine-owned
   `CLAUDE.engine.md`; `CLAUDE.md` **stays** in `SACRED_FILES`, so deployed monolithic brains are never
   clobbered). **Must ship BEFORE the migration's *generate* step**, so the regenerated personal brain
   is born two-layer. _(The words "in the `replace` regime" stood here and never described reality: the
   engine layer shipped in **no regime at all**, which is the frozen-doctrine finding on line 222. Which
   regime it joins is **S5**'s, and it is `merge` — owned, with its design, by
   [`archived/update-regime-owns-what-it-shipped-action.md`](archived/update-regime-owns-what-it-shipped-action.md).)_
2. 🌌 **Universes** — the soft, progressively-disclosed retrieval scope (ADR 0034). A Bucket-1
   note-convention / schema change, so it **must land BEFORE the migration's *import* step**, so the
   regenerated brain is born universe-aware and the imported notes are stamped at import time.
3. 🧠 **Migration generate** — Track D of the migration plan (generate → import notes under a universe →
   layer the private capabilities). Depends on green + universes.
4. 🔴 **Fleet re-layering + big-jump upgrade experience** — retro-fit already-deployed monolithic
   brains (~v3.2.x) and build the broader upgrade UX: **(A)** completeness across a big jump,
   **(B)** "what you gained" notes (reuse the *The One With…* codenames), **(C)** pre-flight reindex
   preview said *before* upgrading. Heavy QA on fixtures reproduced from the release tag(s).
   **Deferred to AFTER the migration.**

**Why deferring 🔴 is safe:** the constitution is `sacred` and `constitutionTemplate` is frozen at
`1.0.0`, so no constitution re-layering is forced. Deferral stays safe because **nothing forces** the
fleet's upgrade in the interim.

> ✅ **Closed (2026-07-28 · `a3943e9`).** For a while this paragraph's claim that `update-engine`
> "handles the `indexSchemaVersion` 1 → 2 bump with a warning" was false: the universes commit moved the
> engine constant to `2` but never bumped the manifest, and that manifest pair is what
> `reindex-trigger.mjs` compares, so a stamped-`1` brain met the runtime stale-schema gate on its **first
> search** after upgrading instead of being told up front. The manifest now declares `2`, and a structural
> test fails if the two ever drift again. The bump was held back as "a fleet-wide reindex event": it is
> not one — the runtime gate force-re-encodes a stamped-`1` index anyway, so this only moves the moment
> from the first question to the update itself. Shipping in **v4.3.0**.

**Pulled forward (2026-07-27):** Gate **2.5** (refresh untouched engine skills) jumped ahead of the
migration. Rationale in its gate entry below; it is independent of Gate 3, so the order is reversible.

---

## Tracking (the gates, in order)

- [x] **Gate 1 — 🟢 Green: legacy-safe fresh-install layering.** _(2026-07-18 · f998259; merged 2026-07-18 · PR #37 · fc3b943)_
  - [x] Add engine-owned `CLAUDE.engine.md`, keep `CLAUDE.md` in `SACRED_FILES`
        (`scripts/lib/engine-apply-plan.mjs`); thin sacred `CLAUDE.md` `@import`s it _(EN + FR)_.
        **Refinement:** the engine layer is **structure-only, NOT yet in `replace`** — propagation
        must first be made locale-aware (a FR brain would be re-anglicized on upgrade), so it moves
        to Gate 4. Fresh installs are born two-layer; deployed monolithic brains stay untouched.
  - [x] Do-no-harm QA: locked by test — the shipped plan touches NEITHER `CLAUDE.md` NOR
        `CLAUDE.engine.md` (no clobber, no reindex, no behaviour change). Trivially safe while the
        engine layer is not propagated to deployed brains.
  - [ ] Field-verify a real fresh two-layer install (EN + FR) at Gate 3 generate time.
  - [x] **Canonical plan:** `prospective/engine-managed-file-merge-strategy.md` → §"Sequencing decision".
- [x] **Gate 2 — 🌌 Universes: soft, progressively-disclosed retrieval scope (depends on Gate 1).** _(2026-07-19 · PR #38; CI matrix 7/7 incl. Windows)_
  - [x] `universe` column + engine-injected default filter + `/switch` + progressive-disclosure gate
        (visible only at count >= 2) + `--universe` import stamp. Bucket-1 change → lands **before** the
        migration *import*.
  - [x] **Decision:** `../decisions/0034-progressive-disclosure-of-universes.md`.
  - [x] **Canonical plan:** `archived/universes-progressive-disclosure-action.md`.
  - [ ] Field-verify a fresh single-universe install is born "today" (no universe folder, no
        frontmatter key, no reminder) and that creating a 2nd universe surfaces `/switch` + the
        reminder + scoped search — at Gate 3 generate time.
- [x] **Gate 2.5 — 🔄 Refresh an UNTOUCHED engine skill (pull-forward of Gate 4A).** _(2026-07-27 · PR #47 · `163d882`; released as **v4.1.0**, "The One Where the Engine Refreshes Its Skills, but Never Yours"; CI 7/7 incl. Windows)_
  - [x] Provenance-gated refresh (sha256 base already recorded on every brain): overwrite only what is
        provably byte-identical to what the engine last delivered; a customized skill is preserved and
        reported. Lives in `reconcileBrain`, guarded on `sourceDir !== brainDir` so it fires on an
        explicit update, never at SessionStart.
  - [x] **Why it jumped the queue:** the gap is live, not theoretical (12 skill commits since v3.2.2 have
        reached nobody; `4e43e70` in v3.6.2 will never reach a v3.6.0/v3.6.1 brain), and the frozen share
        of the fleet grows with the installed base.
  - [x] **Canonical plan:** `prospective/engine-managed-file-merge-strategy.md` → §"Increment 2.5".
- [x] **Gate 2.6 — 🌌 Universes v2: per-universe profiles + lifecycle.** _(2026-07-28 · PR #49 · merge `96d0546`; released as **v4.2.0**, "The One Where Your Brain Knows Where It Is"; CI 7/7 incl. Windows)_
  - [x] Was blocked by design, not by code: its user-facing surface is the `/switch` skill, which could
        not reach the existing fleet until Gate 2.5 shipped. **Unblocked** by v4.1.0 — an untouched
        `/switch` is now refreshed on the fleet's next `/update-engine`.
  - [x] **Release split REVERSED (2026-07-27, Thomas): one release, not two.** The whole universes
        story ships together, so an owner meets the notion once. Everything stays on
        `feat/universes-v2-profiles`; **no tag before plan Step 5 is done**.
  - [x] **Half A — self-healing pointer + universe profiles: CODE-COMPLETE** _(2026-07-27, branch
        `feat/universes-v2-profiles`)_. Plan Steps 0, 2, 3, 6, 7 ticked; F1-F4 re-checked with evidence.
        The eventual tag also carries the backlog already merged past v4.1.0 (the re-synced
        `tdd-discipline` skill, the marketing corrections), which reaches nobody until it exists.
  - [x] **Half B — guarded delete + full rename** (plan Steps 4-5) _(2026-07-27, same branch)_: the
        riskiest surface, kept last on purpose. Delete refuses any non-TTY caller (no `--yes`, no
        piped stdin, no assistant answering its own prompt); rename is full and reversible, so it
        carries no such gate.
  - [x] **Fleet re-check extended to delete + rename, with evidence** _(2026-07-27)_: both scripts are
        declared by hand in the manifest and tracked (F2), the core still emits **no** deletion or
        rename copy an older fleet `/switch` could relay (F3), and `rag/` is untouched, so no
        fleet-wide reindex (F4). Rename gained a `--preflight` so nobody meets the re-embed unwarned.
  - [x] **Marketing-surface re-read done** _(2026-07-27, CONVENTIONS §10)_: it caught a `never leak`
        absolute we had just written for a scope that is deliberately soft. Verdict in the plan.
  - [x] **The two pre-tag conditions are met.** **Windows parity** _(2026-07-27 · `175e215`, CI 7/7 on
        run `30307984513`)_: the 22 red harness tests came from two path builders skipping the POSIX
        convention their own module declares. **`local-mirror` now names the universe** _(2026-07-28 ·
        `c9ab78e`, `934abc1`, `b83b6b3`)_: past the disclosure gate a first `setup_source` pulls
        nothing and hands back the choice, because getting the scope right afterwards costs a full
        re-embed. Two defects fell with it (a ghost pointer frozen into a new mirror; a success
        message naming a folder the files were not in).
  - [x] **Release cut** _(2026-07-28)_. The mutation gate ran three campaigns: 89.10 % → 89.29 %
        (killed the universe reader's untested default) → **90.44 %** on the tagged tree, after an
        audit found 11 more live mutants that were this release's own — the per-file "origin" table
        had mislabelled them, because new code lands *inside* old files. Rule recorded in
        `maintainers/mutation/RETROSPECTIVE.md` ("a file is not an increment").
  - [x] **Canonical plan:** `archived/universes-profiles-lifecycle-action.md` (archived at the tag).
- [ ] **Gate 3 — 🧠 Migration generate (depends on Gate 1 + Gate 2).**
  - [ ] **Ordering note (2026-07-27):** Gate 3 is **independent** of 2.5 / 2.6 (different surfaces, no
        shared file). It was "NEXT TO EXECUTE" before 2.5 was pulled forward. If the personal migration
        becomes the priority again, flip the order here in one line: nothing in 2.5 / 2.6 blocks it.
  - [x] **Ordering note (2026-08-02): the v4.5.0 → v4.7.0 field-findings trilogy runs FIRST — ✅ HELD,
        AND IT RAN TO FOUR RELEASES** (v4.5.0 → v4.8.0, all shipped 2026-08-03 → 2026-08-05). Gate 3 is
        now clear of it. The trilogy never blocked Gate 3 — it took precedence because it fixed
        defects a deployed brain hit **today** (a documented multi-machine path that could not work,
        an indexing failure displayed as a wait, a note answering from stale content), and migrating
        more notes into a brain whose promises did not hold yet would only have widened the gap.
        Canonical plan (now finished and archived): `archived/field-findings-2026-08-02-action.md`.
        Its one leftover is **not** in Track D: it is the head of
        `prospective/v4.9.0-mutation-debt-plan.md`.
  - [x] Track D **core**: generate brain + `/import --universe` — ✅ **done 2026-07-19** (~422 notes
        imported universe-stamped, `/switch` + scoped search verified live; the brain — `mind-palace` —
        has been the owner's daily brain ever since, replacing the ad-hoc `inqom-brain`). _(Recorded
        2026-08-15: this row lagged reality by almost a month — the owner had to correct the map.)_
  - [ ] Track D **tail — owner's call needed**: layer the private capabilities (`refresh-*` skills +
        KPI data files). Measured absent from `mind-palace` on 2026-08-15; they were classified for the
        **previous** sphere (inqom), so they may be obsolete rather than missing. Ask, don't assume.
  - [ ] Track D tail: formal canary (`node scripts/verify-rag.mjs` → exit 0) never recorded; daily use
        answers from the vault, so run it once on the owner's machine for the record, or waive it.
  - [ ] **Canonical plan:** `prospective/second-brain-migration-and-engine-upstream-action.md` → Track D.
- [ ] **Gate 4 — 🔴 Fleet re-layering + big-jump upgrade experience (deferred until after Gate 3).**
  - [ ] (A) Completeness across a big jump (frozen files: constitution + shipped user-skills).
  - [ ] (B) Benefit-framed changelog spanning the jump (*The One With…* substrate).
  - [ ] (C) Pre-flight preview: apply plan **and** reindex decision, shown before applying.
  - [ ] QA fixtures reproduced from the release **tag(s)** + synthetic personal edits; first enumerate
        the versions actually deployed.
  - [ ] **Fixture handed over by v4.4.0's Track 8 — "does the capture flow propose what the vault
        states?"** _(written 2026-07-28, ready to build)_. Seed a universe with **one** person note,
        `type: person`, whose **first line** states a title and a relationship (the shape
        `michael-aboumelhem.md` had), and **no** note for a decoy name that appears only in scattered
        mentions. Run the profile capture. **Pass** = the pre-fill proposes the note's person and
        title; **fail** = it proposes the decoy, or leaves the title unproposed while the note states
        it. Deterministic, and it locks the exact behaviour the field run got wrong — the release
        shipped the retrieval fix and its guard (`scripts/lib/switch-skill-prefill.test.mjs`), but a
        source-level guard cannot prove the flow *behaves*; only this fixture can.
  - [x] (D) **Field feedback from a real big-jump upgrade** _(opened and closed 2026-07-28)_:
        `mind-palace` v4.0.0 → v4.3.0, defects logged as met — **F1-F12**, each verified on disk.
        **Field log (evidence):** `prospective/fleet-upgrade-field-feedback.md`. Cheaper than fixtures
        and it said which fixtures are worth building.
  - [x] **(D) graduated into its own release — ✅ SHIPPED as v4.4.0** _(2026-08-02, tag `v4.4.0`
        "The One Where It Saves What You Wrote Elsewhere", PR #53 → `a0ea5d8`, CI 7/7)_:
        **[`archived/release-v4.4.0-action.md`](archived/release-v4.4.0-action.md)** owned the WORK and
        is now archived beside its published note (the field log keeps the evidence). Ten entries
        shipped — F8/P1 as the headline, plus F1, F2, F4, F5, F6, F9, F10, F11, F12 and the
        profile-prefill retrieval fix. **F3 and F7 stay in this gate**, unshipped, together with the
        fixtures F12 and the prefill defect each earned.
  - [ ] Likely graduates to its own plan ("engine upgrade experience for the deployed fleet");
        F-B7e (constitution re-layering) becomes one component of it.
  - [ ] **Canonical plan:** `prospective/engine-managed-file-merge-strategy.md` → §"Sequencing decision" (deferred half).

> Determinism note (once green exists): consider a lightweight guard that fails loud if a release
> bumps `constitutionTemplate` before green has shipped — turning this ordering invariant into an
> enforced gate rather than a written one (ADR 0009 spirit).

---

## The map — active plans

| Plan (canonical) | What it delivers | Gate | Status |
| --- | --- | --- | --- |
| `prospective/engine-managed-file-merge-strategy.md` | Propagate engine improvements into user-editable provided files (constitution + shipped skills) without clobbering edits. | 1, **2.5** & 4 | 🟢 Increment 2.5 (skills half) shipped in **v4.1.0**; the constitution half stays prospective in Gate 4. |
| `archived/universes-profiles-lifecycle-action.md` | Per-universe profiles (captured + injected), rename, guarded delete. | 2.6 | ✅ Shipped in **v4.2.0** (PR #49, 2026-07-28) — profiles + lifecycle + the mirror's universe choice, one release. Plan archived. |
| `archived/universes-progressive-disclosure-action.md` | A soft, progressively-disclosed per-universe retrieval scope over one shared vault/index (ADR 0034). | 2 | ✅ Shipped (PR #38 in v3.6.0, then write-path trilogy + `/switch` flag in v3.6.2, 2026-07-21). Plan archived; field-verify folds into Gate 3. |
| `prospective/fleet-upgrade-field-feedback.md` | Defects observed on a real deployed brain crossing three versions, captured live. | 4 | 🔬 **Run CLOSED (2026-07-28)** — F1-F12 recorded, each verified on disk. Now the **evidence**, not the work list: the fixes shipped in **v4.4.0** (`archived/release-v4.4.0-action.md`). Only F3 (silent reindex) and F7 (unverified outcome reported in the measured voice) remain here, both deferred to Gate 4 on purpose. |
| `archived/release-v4.4.0-action.md` | Turns the field log into shipped code: a commit that follows the index instead of the session, a status line that yields to the owner's, an indexer that reports what it could not read, a consolidation that cannot damage a page. | 4 | ✅ Shipped as **v4.4.0** (2026-08-02, PR #53, CI 7/7) — all ten tracks, nothing cut. Plan archived beside its published note. Still owed: the on-a-real-brain verification (needs an installed brain, which the launcher is not). |
| `archived/field-findings-2026-08-02-action.md` | 16 findings from one evening on a real brain, cut into four releases: **v4.5.0** promises kept (multi-machine clone, failure ≠ wait, disk↔index crosscheck), **v4.6.0** the vault's identity (resolve before writing, homonymy), **v4.7.0** visibility (the machine that is behind, the index promising a resume), **v4.8.0** consent that can answer *"what for?"* (the upstream check, a note that says what it was built from, a checked Slack account). | — | 🏁 **DONE, ARCHIVED (2026-08-05).** All four shipped: **v4.5.0** (tag, PR #54, merge `96f5999`), **v4.6.0** (PR #55, `c0b2b16`), **v4.7.0** (PR #57, `556f950`), **v4.8.0** (PR #58, `e0dbb7b`, CI 7/7 on the tagged commit, release published). Each note + PR body archived beside the plan; mutation numbers pinned in `mutation/RESULTS.md`, one section per release. **What leaves it**: the two structural mutation remedies the owner arbitrated into v4.9.0 → `prospective/v4.9.0-mutation-debt-plan.md`. |
| `archived/field-report-2026-08-07-rag-orphans-and-windows-launchers.md` | The RAG MCP server never exits when the client disconnects, so orphans pile up on the SQLite lock until a session silently has **no vault tools at all**; plus two Windows launcher defects (LF-only `.cmd`, `npx tsx` resolving through the registry) that pushed startup over the 30 s ceiling. | — | 🏁 **DONE, ARCHIVED** — ✅ shipped as **v4.8.1** _(2026-08-07, PR #59 · `829c2a1`, "The One Where Closing It Actually Closes It", CI 7/7 incl. three Windows cells)_. All three defects fixed. **Still owed**: the reporters (Daniel MARTIN + colleague) re-running their reproducer on the tag — needs their machines. **What it handed forward**: the live health banner (made affordable at ~0.3 s) and the `health-probe-run.mjs` / `headless-health-check.mjs` mutation debt → `prospective/v4.9.0-mutation-debt-plan.md`. Source report: `archived/field-report-2026-08-07-source.md`. |
| `archived/active-universe-follows-the-owner-action.md` | The active universe travels with its owner, and the machine that pulls a switch lands on it cleanly. | — | 🏁 **DONE, ARCHIVED (2026-08-08).** Shipped as **v4.9.0 — The One Where the Universe Travels With You** (PR #60, merge `6f8b830`, CI 8/8 green on the tagged commit, release published). Scope was arbitrated to **universes only**. Mutation numbers pinned in `mutation/RESULTS.md` § v4.9.0; note and PR body archived beside the plan. **What leaves it, so it does not die with the plan**: the *general smell* — the startup pull races EVERY hook, so wiki-health and self-heal may also read pre-pull state, and `session-status`'s bootstrap tick and the self-heal can now both spawn `reconcile-brain` at once — plus the deliberately deferred **per-machine override** (`active-universe.local`). |
| `prospective/v5-unfreezes-the-existing-fleet-action.md` | v5.0.0 stops being a release that only helps brains installed after it: an already-frozen brain proves its own ancestor from the digests of every version the engine ever published, **a file the owner had edited before the release gets its ancestor FETCHED from the tag that sha names, so it merges instead of staying frozen** (S7-5, arbitrated into v5 by the owner on 2026-08-21, after this row was first written), the FR tree stops drifting in silence (a test now names any localized file left behind by its English source), and **a file you personalized becomes a QUESTION with three offers (take the new one / keep yours / combine them) instead of a blind spot** — the owner's acceptance criterion, 2026-08-21, explicitly v5 and not v5.1. | finishes the row below | 🔴 **LIVE (2026-08-21)** — the plan owns the state; this row does not restate it. |
| `archived/update-regime-owns-what-it-shipped-action.md` | The engine updates what it shipped and only stops for what the owner really wrote: an immutable base, a real three-way merge, a write guard, an audible divergence, and the doctrine layer finally joining a regime. | supersedes 4's F-B7e | 🏁 **BUILT, ARCHIVED (2026-08-21)** — S1-S6 sit on `feat/engine-base-unfreeze` (draft PR #76), **nothing tagged**. Publication was stopped by the owner the same day: the release **as this plan built it** unfroze brains installed from v5.0.0 on and **nobody already installed**. ⚠️ **That is why it stopped, not where it stands** — S7 of `prospective/v5-unfreezes-the-existing-fleet-action.md` closed exactly that gap on 2026-08-21, and **that plan owns the state**; this row deliberately keeps no copy of it. |
| `prospective/field-finding-2026-08-08-source-first-and-frozen-doctrine.md` | A source the owner hands over (URL, path) must be read before any search tool, and the doctrine layer that says so must actually reach deployed brains. | with the unfreeze | 🟢 **OPEN (2026-08-08)** — measured, not supposed: a brain pinned at **v4.8.1** carries a `CLAUDE.engine.md` frozen at **install day**, 11.4 KB and 12 doctrine commits behind, because that file is in **no regime**. Carrier question **resolved without choosing**: no hook, the rule goes in both constitutions and the unfreeze release delivers it. |
| `prospective/field-finding-2026-08-05-silent-skill-freeze.md` | An engine skill kept as "customized" on a deployed brain that had **zero lines of the owner's** in it, frozen since install day and never mentioned again. Persist the provenance base, teach the engine to recognise its own past output so frozen brains heal themselves, and make the freeze audible. | ahead of 3 | 🟢 **OPEN (2026-08-05)** — observed live on the mind-palace during the v4.7.0 → v4.8.0 update. Evidence is **measured** (brain git history + this repo's), written in the plan's § *What was measured*; do not re-derive it. **ALL THREE of its halves are being ANSWERED by the v5 chantier** — the persisted base by the archived `update-regime-owns-what-it-shipped-action.md` (S1-S6), *recognise its own past output so frozen brains heal themselves* as **S7**, and *make the freeze audible* as **S4-3/S4-4 then S10**, which goes **past audible**: a personalized file becomes a question with three offers instead of merely being mentioned. ⚠️ **This row deliberately names NO version and NO slice for that** — it said "since S10-3" until 2026-08-22 and was outdated within a day, because S10-5 turned the offer from a sentence into something the engine can actually carry out. **`prospective/v5-unfreezes-the-existing-fleet-action.md` owns the state of all three**; this row only points at it, and keeps no copy of what remains. |
| `prospective/v4.9.0-mutation-debt-plan.md` | The two structural mutation remedies v4.8.0 deferred: a shared `runAsEntrypoint` (+ the guard test that makes it stick) and `defaultGit` as a pure value. | ahead of 3 | 🟢 **OPEN — floor RE-ARBITRATED in writing (2026-08-08): it falls due with the unfreeze release above, NOT with v4.9.0**, which shipped the universes work alone. Third due date named as such: cutting the unfreeze release without paying it is a defect, not a re-arbitration. Opened the day the deferral was taken, because the same deferral was taken at v4.5.0 and v4.6.0 and memory never brought it back. Evidence lives in `mutation/RESULTS.md` § v4.8.0; do not re-derive it. |
| `prospective/second-brain-migration-and-engine-upstream-action.md` | Migrate the pre-existing personal brain (~405 notes) + upstream the generic delta. | 3 | Tracks A/B/C DONE (PR #29/#30/#32); **Track D core LIVED since 2026-07-19** (`mind-palace` is the daily brain); two tails open (private layering = owner's call, formal canary). F post-migration. |
| `archived/hotfix-v4.9.1-universe-pointer-action.md` | The universe switch actually leaves the machine: commit+push in the `/switch` path, Stop hook that sweep-commits before pushing. Riders: auto-compact headroom (#63), ⚠️ on the connectors reminder (#65). | — | 🏁 **DONE, ARCHIVED (2026-08-15).** Shipped as **v4.9.1 — The One Where Your Context Stops Coming Back** (PR #70, merge `df5d353`, full CI matrix green on the merged commit, release published, #69/#63/#65 closed). Mutation pinned in `mutation/RESULTS.md` § v4.9.1 (three passes; the two new files at 100 %, the CLI wiring 25 % → 100 %); note archived beside the plan. **What leaves it, so it does not die with the plan**: the two pilots' verdict is written in the archived plan. **Half of the graduation is now SIGNED and DELIVERED (2026-08-15)**: the relaxed mode graduated, and the owner's call went further than the question asked — the skill was **renamed** `test-first-discipline`, because what the measurement dropped is TDD's own thesis rather than a ceremony around it. Written, translated to English with the whole harness, merged into `use-case-driven-harness` `main` (PR #1, `9f843dc`), and **verified by acceptance test in a third project**: an unbriefed session reached for it on its own and wrote its tests first. Its Kenjaku-side delivery (manifest regime + retiring `tdd-discipline` on deployed brains) rides the unfreeze release, as its S6 rider. **The adversarial-review half is no longer this row's business (2026-08-20)**: the owner deferred it *with a destination* — decided at the **S1 debrief, on S1's figures**, because S0bis ran no adversarial pass and so produced nothing to judge it on. It now lives as a box in `prospective/agent-orchestrated-release-mode-action.md`; until then, case-by-case, never a standing gate. Also on record: the stale-pointer guard **deferred with its reason**, and the sizing rule earned (fan-out pays on independent lenses, not on many look-alike survivors). ⚠️ **An UNMEASURED carve-out, challenged by the owner 2026-08-15 and not to be smuggled into any rule**: the debrief kept classic baby-steps "for genuinely unknown design / triangulable algorithms". **Nothing in this repo measures that case** — v4.9.1's design was one I could hold whole, so the run says nothing about it. The clause exempts precisely the region where no measurement exists, which is how a rule escapes falsification, and its trigger ("the design is unknown") is self-assessed by the one applying it. **Before it becomes a rule it needs its own data point**: next genuinely unknown design (an algorithm, a protocol, something whose design I cannot state in one paragraph), run it in strict baby-steps and compare **first-pass** mutation score against the spec-first numbers on comparable new files (v4.9.0: 84.62 / 87.74 %; v4.9.1: 91.80 %). The other half of the carve-out (*"when the owner wants the step-by-step narrative"*) needs no measurement: it is a **review/communication** preference, not a quality claim, and stands on that ground alone. |

> Other in-flight plans on their own branches (e.g. wiki-health axis 1, marketing page) are **not
> part of this fleet-upgrade ordering** and are tracked by their own plans + memory pointers; they
> are listed here only if/when they gain a cross-plan dependency.

### Incoming (standing inbox)

Work born **outside** this repo — field reports from deployed brains, ideas, defects — lands as
**[GitHub issues](https://github.com/tpierrain/kenjaku/issues)**, not as plan files. Check the open
issues when picking up work: an issue graduates to a plan (or to a rider on one) when it is
scheduled, and this map only lists plans. _(Added 2026-08-15: the map had no entry point for
out-of-band arrivals, so five issues filed by the owner's brain sat invisible to a pickup.)_

---

## How to use this file

- **Picking up work after a `/clear`:** read the invariant, find the **first unchecked gate**, open
  its canonical plan, and resume at that plan's first `- [ ]`.
- **Finishing a gate:** check it here **and** in its canonical plan, with _(date · commit)_. Keep the
  two in sync; if they ever disagree, the **canonical plan wins** (this file is only the order).
- **Adding a plan to the fleet order:** add one row to the map + one gate, both as pointers. Never
  paste the plan's internal steps here.
