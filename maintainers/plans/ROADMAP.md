<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- STATUS: 🧭 LIVING — ordering authority across the active plans.               -->
<!-- This file owns the CROSS-PLAN ORDER only. It never duplicates a plan's         -->
<!-- content (checkboxes, done/remains, commits): each plan stays the single        -->
<!-- source of truth for its own state; this is the map that says which goes first. -->
<!--                                                                            -->
<!-- plan-carrier-guard: delegates-only — the line above is a CONTRACT, and this -->
<!-- declares it to the Stop hook, which otherwise names this file at every       -->
<!-- hand-back for restating a status it structurally never holds. Delete this    -->
<!-- line the day a row here starts carrying state of its own.                    -->
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

## ▶️ What "Graph Engineering" turned out to mean (owner, 2026-08-19)

**The framing conversation happened, and it sent the subject elsewhere than expected.** By *Graph
Engineering* the owner meant **orchestrating subagents to BUILD the next release**, not a graph inside
Kenjaku's runtime (*"c'est aucune de ces deux options"*). The three ordering consequences, which is
all this file records:

- **v5.0.0 belongs to** [`prospective/v5-unfreezes-the-existing-fleet-action.md`](prospective/v5-unfreezes-the-existing-fleet-action.md).
  Its predecessor, [`archived/update-regime-owns-what-it-shipped-action.md`](archived/update-regime-owns-what-it-shipped-action.md),
  built S1-S6 and is closed.
- **How it gets built was itself a subject**, and its working contract is now **closed with the
  release it served**:
  [`archived/2026-08-23-agent-orchestrated-release-mode-action.md`](archived/2026-08-23-agent-orchestrated-release-mode-action.md).
  The living rule moved to `CONVENTIONS.md` **§12** (what is delegable, what a wave costs) — read
  that before dispatching anything to a subagent; open the archived plan only for the measurements.
- **The runtime-graph question goes back to a WATCH note**
  ([`prospective/llm-wiki-vs-embedding-rag-karpathy-graphify.md`](prospective/llm-wiki-vs-embedding-rag-karpathy-graphify.md)):
  **deferred, on his explicit ask, to AFTER this release** — a study to do *with* him, not work to
  pick up. He also **ruled out** building the release on top of a knowledge graph of the codebase (too
  long, too little code for the payoff).

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

> ⚠️ **BOTH HALVES OF THAT ARGUMENT HAVE EXPIRED** _(noted 2026-08-22, found by the `plan-carrier-guard`
> hook)_. **The number was never re-read**: `constitutionTemplate` left `1.0.0` at **v4.5.0** and reads
> `1.3.0` today, having moved again at v4.6.0 and v4.8.0. And the premise underneath it is what the
> unfreeze release exists to end: `CLAUDE.engine.md` **joins the `merge` regime**, so from v5.0.0 a
> deployed brain *does* receive doctrine — *"nothing forces the fleet's upgrade"* stops being the
> reason 🔴 is safe. **This paragraph has been patched around twice without being re-read** (the
> `replace`-regime correction sits ten lines above it, the `indexSchemaVersion` correction just below),
> which is how a rationale outlives every fact it rests on.
>
> 🚫 **Deliberately NOT rewritten here**: whether 🔴 stays deferred once brains receive again is a scope
> call, and it is the owner's. What is fixed is the *reason* on offer, which was false. The release's
> own state lives in
> [`prospective/v5-unfreezes-the-existing-fleet-action.md`](prospective/v5-unfreezes-the-existing-fleet-action.md);
> this note keeps no copy of it.

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
        `archived/2026-08-23-v4.9.0-mutation-debt-plan.md`.
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
>
> ✅ **The invariant is SATISFIED, checked 2026-08-22 rather than assumed.** Green shipped on
> **2026-07-18** (Gate 1, `f998259`, PR #37 → `fc3b943`), so a release may bump `constitutionTemplate`.
> Checked because v5.0.0's derived vector does exactly that (`1.3.0 → 1.4.0`), and this line is the
> only place the ordering rule is written down. **The guard it proposes was never built** — the
> invariant is still held by prose, which is why it had to be re-read by hand to clear a bump.

---

## The map — plans in flight

**Three columns, and no Status column, on purpose** _(2026-08-22)_: a form with no status field cannot
hold a status. Each plan's own `## 📍 STATE` block answers where it stands; this table answers only
*what it delivers* and *what must come first*. What the old Status column was really carrying — debts
still owed, and lessons that outlived their release — is in § *Kept from the old Status column* below.
**Shipped plans have left this table**: they live under `archived/`, and their folder says so.

| Plan (canonical) | What it delivers | Depends on |
| --- | --- | --- |
| [`prospective/v5-unfreezes-the-existing-fleet-action.md`](prospective/v5-unfreezes-the-existing-fleet-action.md) | v5.0.0 stops being a release that only helps brains installed after it: an already-frozen brain proves its own ancestor from the digests of every version the engine ever published; **a file the owner had edited before the release gets its ancestor FETCHED from the tag that sha names, so it merges instead of staying frozen**; the FR tree stops drifting in silence (a test names any localized file left behind by its English source); and **a file you personalized becomes a QUESTION with three offers — take the new one / keep yours / combine them — instead of a blind spot** (the owner's acceptance criterion, explicitly v5 and not v5.1). | Finishes what [`archived/update-regime-owns-what-it-shipped-action.md`](archived/update-regime-owns-what-it-shipped-action.md) built (S1-S6). Supersedes Gate 4's F-B7e. |
| [`prospective/engine-managed-file-merge-strategy.md`](prospective/engine-managed-file-merge-strategy.md) | Propagate engine improvements into user-editable provided files (constitution + shipped skills) without clobbering edits. Two halves: the **skills** half (increment 2.5) and the **constitution** half. | Gates 1, 2.5 and 4. The constitution half is Gate 4's. |
| [`prospective/fleet-upgrade-field-feedback.md`](prospective/fleet-upgrade-field-feedback.md) | Defects observed on a real deployed brain crossing three versions, captured live (F1-F12, each verified on disk). It is **evidence, not a work list** — it said which fixtures are worth building. | Gate 4. F3 (silent reindex) and F7 (an unverified outcome reported in the measured voice) stay here on purpose. |
| [`prospective/second-brain-migration-and-engine-upstream-action.md`](prospective/second-brain-migration-and-engine-upstream-action.md) | Migrate the pre-existing personal brain (~405 notes) + upstream the generic delta. | Gate 3. Track D's core has been the owner's daily brain since 2026-07-19; its two tails are in § *Still owed*. |

> Other in-flight plans on their own branches (e.g. wiki-health axis 1, marketing page) are **not
> part of this fleet-upgrade ordering** and are tracked by their own plans + memory pointers; they
> are listed here only if/when they gain a cross-plan dependency.

### 🗂️ Off-ordering, but alive — the plans the map above deliberately does not order

**Why this list exists** _(2026-08-22)_. The clause immediately above is right that these are not part
of the fleet-upgrade ordering. Its second carrier, though, **is empty**: `MEMORY.md` is size-bounded
and gets pruned as chantiers ship, so *"tracked by their own plans + memory pointers"* now delegates to
pointers that no longer exist. Measured: **no memory entry names any plan below**, and
`restore-affordance-graduated-autonomy-action.md` still opens with *"North-star, always-loaded pointer:
memory `brain-graduated-autonomy-affordance`"* — **an entry that is gone**. Net result: two entirely
unstarted action plans, with concrete unblocked work, were named by **nothing a pickup reads**.

**Not promoted to map rows on purpose** — they have no cross-plan dependency, and inventing one would
corrupt the ordering this file exists to protect. What they needed was to be *nameable*, not ordered.
**And deliberately not put back into memory either**: `rules/plans.md` forbids state there, and every
surplus line spends the budget the critical instructions need. A repo file is the right carrier.

**Third column is *what it is waiting for*, not a status** — a boundary or a precondition, both of
which stay true until someone lifts them. These plans hold no `## 📍 STATE` block yet: they get one
when they wake.

| Plan (canonical) | What it is | What it waits for |
| --- | --- | --- |
| [`prospective/harness-universe-blindspot-hardening-action.md`](prospective/harness-universe-blindspot-hardening-action.md) | The answer to *"why did universes break six components that every green suite missed?"* — a non-default fixture everywhere, one vault-path seam, a cross-cutting-contract gate. | Nothing for M1: a non-default fixture is mechanical and needs no arbitration. M2 needs an **ADR**. |
| [`prospective/restore-affordance-graduated-autonomy-action.md`](prospective/restore-affordance-graduated-autonomy-action.md) | Restore *"things happen on their own"* after `/lint` + `/consolidate` turned the brain into a wall of jargon-laden prompts. | Its step 1 is *"agree the model (ADR)"* — a design call, **the owner's**, so nothing below it can start. ⚠️ Its header still names a memory pointer that no longer exists; see above. |
| [`prospective/wiki-health-axis1-mechanisms-action.md`](prospective/wiki-health-axis1-mechanisms-action.md) | `/lint`, `/file-back`, `/consolidate`, contradiction flagging, the activity ledger, the SessionStart trigger. Tracks A→F were proven on the real 405-note vault. | Its two remaining pieces are **owner-side**: a cross-cutting retrieval measurement, and the formal private import. |
| [`prospective/rag-embedder-plan-action.md`](prospective/rag-embedder-plan-action.md) | Swappable 3-adapter embedder + adaptive install. Its core has been in production since 2026-06-09. | Its steps 6-7 are **conditional on a quality ceiling that was never observed** — parked, not pending. Nothing to pick up unless that ceiling shows up. |
| [`prospective/post-v3.1.0-ux-backlog.md`](prospective/post-v3.1.0-ux-backlog.md) | Captured UX ideas, explicitly **not committed work**. | A scope call: promote one to an `*-action.md` when it is picked up. |
| [`prospective/background-consolidation-mode-study.md`](prospective/background-consolidation-mode-study.md) | Design study: the RAG's process shape, a "pulse" projection, keeping the brain fresh without making the owner wait. | The measurement it names. The action plan comes after, never before. |
| [`prospective/etude-rag-local-criteres-et-veille.md`](prospective/etude-rag-local-criteres-et-veille.md) | Watch note: offering a range of RAG alternatives per person's constraints. | Nothing decided; it is a watch. |
| [`prospective/plan-state-single-source-study.md`](prospective/plan-state-single-source-study.md) | Makes duplicated plan state structurally impossible (a capped STATE block per plan) and gives the corpus **one door**, [`ACTIVE.md`](ACTIVE.md), instead of eight. It is what deleted this file's own role as an entry point, and its own Status column. | Its plan owns that; this row keeps no copy, by construction now. |
| [`prospective/llm-wiki-vs-embedding-rag-karpathy-graphify.md`](prospective/llm-wiki-vs-embedding-rag-karpathy-graphify.md) | The runtime-graph question. | The owner deferred it to **after** the unfreeze release: a study to do *with* him, not work to pick up. |

## 📚 Kept from the old Status column — append-only

_(2026-08-22. For months this file's map carried a **Status** column: 22 commit shas, 19 PR numbers
and 23 ship-words, in a file whose own header says it holds no state. Rule 3 of the plan-state
convention deleted the column — a form with no status field cannot hold a status. But the column had
become the only carrier for a handful of things that were **not** statuses, and criterion 6 of the
study forbids losing them. They are here, and nothing below can go false on its own.)_

### Still owed, and by whom

- **v4.4.0's on-a-real-brain verification.** The release shipped; the verification needs an **installed
  brain**, which the launcher is not. Nobody has run it. →
  [`archived/release-v4.4.0-action.md`](archived/release-v4.4.0-action.md).
- **v4.8.1's reporters re-running their reproducer on the tag.** Daniel MARTIN and a colleague found
  the RAG-orphan defect; confirming the fix needs **their** machines, so it cannot be closed from
  here. → [`archived/field-report-2026-08-07-rag-orphans-and-windows-launchers.md`](archived/field-report-2026-08-07-rag-orphans-and-windows-launchers.md).
- **Track D's two tails** (Gate 3): layering the private capabilities — measured absent from
  `mind-palace`, but they were classified for the **previous** sphere, so they may be obsolete rather
  than missing, and that is the owner's call — and the formal canary (`node scripts/verify-rag.mjs`
  → exit 0), never recorded on his machine. **Ask, do not assume.**

### Lessons that outlived the release that paid for them

- 🧭 **v4.9.0's "general smell", named so it would not die with its plan.** The startup pull **races
  every hook**, so wiki-health and self-heal may also read pre-pull state; and `session-status`'s
  bootstrap tick and the self-heal can both spawn `reconcile-brain` at once. Also deliberately
  deferred there: a **per-machine override**, `active-universe.local`.
- ⚠️ **An UNMEASURED carve-out that must not be smuggled into any rule** _(challenged by the owner,
  2026-08-15)_. The v4.9.1 debrief kept classic baby-steps *"for genuinely unknown design /
  triangulable algorithms"* — and **nothing in this repo measures that case**: v4.9.1's design was one
  that could be held whole, so the run says nothing about it. The clause exempts precisely the region
  where no measurement exists, which is how a rule escapes falsification, and its trigger (*"the
  design is unknown"*) is self-assessed by whoever applies it. **Before it becomes a rule it needs its
  own data point**: on the next genuinely unknown design — an algorithm, a protocol, something whose
  design cannot be stated in one paragraph — run it in strict baby-steps and compare the **first-pass**
  mutation score against the spec-first numbers on comparable new files (v4.9.0: 84.62 / 87.74 %;
  v4.9.1: 91.80 %). _(The carve-out's other half, *"when the owner wants the step-by-step narrative"*,
  needs no measurement: it is a review preference, not a quality claim, and stands on that ground.)_
- 📏 **Fan-out pays on independent lenses, not on many look-alike survivors** — the sizing rule earned
  at v4.9.1.
- 🧮 **"A file is not an increment."** v4.2.0's per-file origin table mislabelled 11 live mutants as
  someone else's, because new code lands *inside* old files. Recorded at its authority,
  `maintainers/mutation/RETROSPECTIVE.md`.
- 🗺️ **A row here lagged reality by almost a month, and the owner had to correct the map** (Track D's
  core, 2026-08-15). That is the founding argument for this file holding no state at all.

### Incoming (standing inbox)

Work born **outside** this repo — field reports from deployed brains, ideas, defects — lands as
**[GitHub issues](https://github.com/tpierrain/kenjaku/issues)**, not as plan files. Check the open
issues when picking up work: an issue graduates to a plan (or to a rider on one) when it is
scheduled, and this map only lists plans. _(Added 2026-08-15: the map had no entry point for
out-of-band arrivals, so five issues filed by the owner's brain sat invisible to a pickup.)_

> 🛑 **The rule above existed and did not run — measured 2026-08-22.** A loop swept the map's rows,
> found no slice left, and reported the v5 release complete bar the owner's steps. **Three doctrine
> issues (#61, #67, #64's rule half) had been arbitrated INTO that release a week earlier and had never
> graduated to a rider**, so no row named them and the sweep was honest and wrong. Scheduling an issue
> and not writing it into a plan leaves it visible only to whoever remembers it.
>
> **So the inventory before a cut is three things, not one**: the live plan's slices **+** the open
> rows here **+** the **scheduled** open issues. That rule now lives beside the plan that has to obey
> it — [`prospective/v5-unfreezes-the-existing-fleet-action.md`](prospective/v5-unfreezes-the-existing-fleet-action.md)
> § *FOUR LESSONS* — and this note keeps no copy of what it found.

---

## How to use this file

> 🚪 **THIS FILE IS NOT THE DOOR — since 2026-08-22 it never answers *"where do I resume?"***
> That question has exactly one address: **[`ACTIVE.md`](ACTIVE.md)**. This file owns **cross-plan
> order** and nothing else. _(Thomas's convention: one way in at instant T. Rationale and the rest of
> the migration: [`prospective/plan-state-single-source-study.md`](prospective/plan-state-single-source-study.md).)_

- **Picking up work after a `/clear`:** open [`ACTIVE.md`](ACTIVE.md). Do **not** hunt for the first
  unchecked gate here — a gate is an ordering fact, not a resume point, and reading it as one is how
  a session once restarted a release the owner had already diverted from.
- **Finishing a gate:** check it here **and** in its canonical plan, with _(date · commit)_. Keep the
  two in sync; if they ever disagree, the **canonical plan wins** (this file is only the order).
- **Adding a plan to the fleet order:** add one row to the map + one gate, both as pointers. Never
  paste the plan's internal steps here.
