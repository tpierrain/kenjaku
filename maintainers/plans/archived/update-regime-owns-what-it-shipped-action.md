<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- STATUS: 🏁 DONE, ARCHIVED (2026-08-21). S1 through S6 are BUILT and sit   -->
<!-- on feat/engine-base-unfreeze (105 commits, draft PR #76). Nothing tagged. -->
<!--                                                                          -->
<!-- 🛑 DO NOT OPEN THIS FILE TO FIND OUT WHERE THE WORK STANDS. It is ~2 200  -->
<!-- lines and holds NO current state. The live plan is:                       -->
<!--   maintainers/plans/prospective/v5-unfreezes-the-existing-fleet-action.md -->
<!-- Every decision here that still binds has been COPIED into it, so that     -->
<!-- plan is self-sufficient. Open this one only to investigate HOW a shipped  -->
<!-- mechanism was designed.                                                   -->
<!--                                                                          -->
<!-- WHY IT CLOSED SHORT OF PUBLISHING: the release, AS THIS PLAN BUILT IT,    -->
<!-- unfroze brains installed from v5.0.0 on and NOBODY already installed —    -->
<!-- i.e. the entire fleet. Owner's call, 2026-08-21: do not publish in that   -->
<!-- state. Healing the frozen fleet moved to the successor plan's S7.         -->
<!--                                                                          -->
<!-- ⚠️ THAT IS HISTORY, NOT THE CURRENT STATE. S7 shipped later the same day  -->
<!-- and a brain rebuilt from v3.6.0 now RECEIVES. Do not quote the sentence   -->
<!-- above as if it still held: the successor plan owns where this stands, and -->
<!-- this header keeps no second copy of it.                                   -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

> ## ✅ RESOLVED — S6e is DROPPED (owner, 2026-08-21, in conversation)
> _(Raised by the night loop at iteration 34; answered the same day. **No French
> `test-first-discipline` ships.** The finding it uncovered — the FR tree has no owner and no
> staleness report — is carried as S8 of the successor plan. The analysis below is kept as the record
> of what the answer was based on.)_
>
> S6e says *"write `templates/fr/.claude/skills/test-first-discipline/`"*. Before writing ~25 000
> characters of French, the loop went to look at what the FR tree actually is. **Three facts it did not
> expect, all measured on the repo:**
>
> ⚠️ **The three bullets below are the ANALYSIS AS IT STOOD ON 2026-08-21, and two of their facts have
> since been overtaken — do not quote any figure from them as current.** The `sync` FR skill has been
> brought up to its English source (S8-2a), and *"no FR version at all"* has been re-read as the
> engine's own rule (a file is locale-owned only once its twin exists) rather than as a hole. Both
> belong to S8 of [`../prospective/v5-unfreezes-the-existing-fleet-action.md`](../prospective/v5-unfreezes-the-existing-fleet-action.md),
> **which owns that state; this record keeps no copy of it.**
>
> - [ ] 📉 **The FR tree is already partial and silently drifting, and S6e closes one hole of five.**
>       `switch` (shipped 2026-08-08, and it is the *universes* skill, as user-facing as it gets) and
>       `local-mirror` (2026-07-28) **have no FR version at all**. `sync` FR was last touched
>       **2026-06-10** while its EN source moved on **2026-08-08** — two months stale, and 2 391 bytes
>       against the EN's 4 258, so more than half the skill is missing. `update-engine` FR carries **6
>       commits against the EN's 13**. Nothing anywhere reports any of this.
> - [ ] 🎯 **The FR copies exist to be FOUND and to SPEAK, and this skill does neither.** What the FR
>       tree localizes is the **`description:` frontmatter** — the routing surface, so a user's French
>       phrasing matches the skill — and the prose the skill makes Claude say back. Verified on
>       `improve`: FR `description` is French, and the body is the conversation it drives.
>       `test-first-discipline` is triggered by **no user phrasing**: it loads *"as soon as you write or
>       modify code"*, and its only reader is **Claude**, deciding how to test. SETUP.md already files it
>       that way — audience column: *"Claude, when modifying the harness"*.
> - [ ] ⚖️ **So the FR file would be a translation with no reader, owned by nobody, drifting by
>       default.** The English is the source of truth (the harness owns it, `language.md` §English), it
>       was refreshed hours ago to v2.3.0, and a FR brain **already receives it and works** —
>       `resolveLocaleSource` falls back to the root file, verified in `engine-copy-select.mjs`.
>
> **The loop's recommendation, stated so the answer can be one word:** ✂️ **drop S6e from v5.0.0** and
> re-file the real finding — *the FR tree has no owner and no staleness report* — as its own item, since
> it is five skills wide and is the same defect this whole release exists to end (a copy with no
> provenance goes stale and nobody is told). **The counter-argument, stated fairly rather than
> buried**: a brain whose every other skill speaks French gains a coherence from the French version even
> if only Claude reads it, and *"the launcher ships partial French"* is a real product answer to give.
>
> - [ ] ▶️ **Thomas: one of the three.** (a) **Drop S6e** and open the FR-tree finding separately
>       _(the loop's recommendation)_; (b) **keep S6e** as specified, and the loop writes the French;
>       (c) **widen it** — S6e becomes *"the FR tree catches up"*, which is five skills and is a
>       chantier, not a slice.

> ## ✅ ANSWERED — the engine MAY write `CLAUDE.md`, and a conflict stops being a dead end
> _(owner, 2026-08-21, in conversation. **Nothing else waits on Thomas on this plan** — see the
> blocking box above, which is the one exception and postdates this line.)_
>
> **The question that was asked**: may the engine land its own updates inside a brain's `CLAUDE.md`
> (owner's edits preserved, conflicts never written and reported instead)? Or does the constitution stay
> untouchable **by policy**, with the engine's doctrine reaching brains only through `CLAUDE.engine.md`?
>
> **The answer is YES, through the merge door only** — and the owner did not accept the question's own
> framing, which is the part worth recording. Told that a conflict means *"the engine writes nothing and
> says so"*, he named it for what it is: *« ne pourrions-nous pas plutôt aider l'utilisateur à faire ce
> merge, en lui demandant ce qu'il a envie de retenir entre ça et ça »*, explicitly, pedagogically, and
> **without dumping paragraphs at someone** — a synthesis, not the diff.
>
> - [x] 🎯 **The doctrine call**: `CLAUDE.md` is **merge-governed**, not inviolable. The engine may lay
>       down the output of a three-way merge from a **provable** base, never a copy, never on a conflict.
>       That is S2c, and it is **unblocked**.
> - [x] ⚖️ **The reason the answer is "yes" and not "later"**, kept because it is the whole argument: a
>       refusal makes today's silence permanent. A `CLAUDE.md` in no regime never receives another engine
>       line, and the gap widens for years without anyone being told — which **is** the "too timid"
>       defect this chantier exists to fix, preserved rather than fixed.
> - [x] 🧱 **What "yes" actually buys, stated honestly so nobody expects more**: on **already-deployed**
>       brains, nothing yet. `CLAUDE.md` is diverged from its recorded base there (measured 2026-08-20),
>       the fleet holds **no ancestor**, and a merge with no ancestor is not a merge. What it buys is
>       **every brain installed from v5.0.0 on**, where the installer seeds the base on day one. That is
>       cheap (the door is already built) and it is why the answer ships now instead of waiting.
>
> ### ▶️ The split that was decided with it — three pieces, and only two are in this release
>
> - [x] **In the cut (S2c, as designed)**: the scrub is reformulated, `SACRED` splits in two, the ADR is
>       amended. No new machinery.
> - [ ] **In the cut, and it is new**: **the conflict report stops being a cul-de-sac.** Today's end
>       state would be *"3 files clash, I wrote nothing"*, which tells the owner about a problem and
>       hands them no door. It must name the door instead: *"3 things clash, ask me and I will walk you
>       through them"*. One sentence, one slice, sequenced after S4 — **its own slice, S2d**, so it is
>       not smuggled into S2c's ADR work.
> - [ ] 🚀 **NOT in the cut — its own chantier: assisted conflict resolution.** The owner's idea in full,
>       and the real payoff. It is deliberately deferred, on the release's own terms rather than on
>       enthusiasm: it needs the **ancestor-reconstruction machine** (which it inherits — an assisted
>       merge needs a base exactly as much as a silent one), a resumable state, a per-hunk write path and
>       a presentation layer, i.e. **a chantier, not a slice**, and cramming it would slip v5.0.0.
>       **Its non-negotiables, decided now while the reasoning is fresh** (do not re-derive them when it
>       opens):
>   - [ ] **The LLM chooses BETWEEN two existing texts; it never authors the merged text.** What lands on
>         disk is copied byte-for-byte from one side. The summary is a lede, and the real text stays one
>         word away. Otherwise the failure mode is a *summary that misrepresents a hunk and collects a
>         "yes" it never earned* — the most personal file in the product, written on a paraphrase.
>   - [ ] **Consent fatigue is the second risk, and it is worse than silence**: twelve questions produce
>         a "yes to all" nobody read, and now there is a *record of consent*. So: batch, cap, and make
>         *"leave everything alone"* a first-class answer that costs the owner no guilt.
>   - [ ] **One atomic write at the end.** An abandoned flow must leave the constitution wholly old, never
>         half-merged.
>   - [ ] **It does not live inside `update-engine.mjs`.** The update runs in a non-interactive child; the
>         conversation cannot happen there. The update still *writes or reports, never prompts* — the
>         resolution is a **separate, on-demand flow** the report points at. This is why the exclusion
>         under § *Deliberately OUT of S2* still stands, and it is now qualified there rather than
>         contradicted.

> ## ▶️ UNPAUSED — this plan is live again (owner, 2026-08-19)
>
> The Graph-Engineering framing happened and turned out to be about **how this release gets built**
> (subagent orchestration), not about Kenjaku's runtime. Everything below stayed true and owed the
> whole time; only its start date had moved, and it has now arrived.
>
> **⚠️ Read the companion plan first**:
> [`agent-orchestrated-release-mode-action.md`](agent-orchestrated-release-mode-action.md). It carries
> the working contract for this chantier — what may be dispatched to a subagent, the rule that nothing
> ships without a machine-checkable pass/fail, and the points where the owner is required. It does not
> change a single item of the cargo below.
>
> **State at resume**: one branch exists from the aborted 2026-08-15 start —
> `fix/mutation-debt-entrypoint-and-git-value` (pushed, `ec339dd`). It contains **documentation only**:
> the S0bis re-measurement, which stands and is worth keeping (28 of 32 top-level scripts carry an
> entry guard, not 20; nine have no test sibling; the two 0 % files carry no guard at all). **No
> production code was written**, so the first unticked box is still the real landmark.

# Action plan — the engine updates what it shipped, and only stops for what the owner really wrote

> **The owner's framing (2026-08-08), which is the right one and is recorded verbatim in intent:**
> *what we must never lose is the work a person did to extend their brain; everything that came from
> the engine in the first place is a product and should be updatable like one.* His observation is that
> our update regime is **too timid** for a product whose own agent edits files eagerly, and that this is
> a design problem rather than a missing feature.
>
> **This plan agrees, and makes the flaw precise.** The engine already records a merge **base** and
> never merges with it. That single fact produces every symptom we have logged.

> **Sequencing + cargo arbitrated by the owner (2026-08-15, in conversation — recorded here the same
> day):** this chantier starts **after** the small `v4.9.1` hotfix
> (`hotfix-v4.9.1-universe-pointer-action.md` — lived cross-machine defect, cuts first). And its
> release **carries the doctrine cargo** waiting in the issue tracker: **#61** (announce
> signal-triggered rituals before the silence), **#67** (the Outillage rule becomes conditional and
> self-describing), **#64's rule half** (size-guarded delegation guidance; the hook half stays in the
> backlog), alongside the already-planned source-first rule. Rationale: these are text changes to
> `CLAUDE.engine.md`, the very file this release unfreezes — shipping them inside it is the proof by
> example that the carrier works. The release also **pays the v4.9.0 mutation debt**
> (`v4.9.0-mutation-debt-plan.md`, third named due date; cutting without paying is a defect).

> ## ⏳ NEXT STEP — read this before the Tracking
>
> **Nothing waits on Thomas any more.** The S6 rider's acceptance test **ran and passed on 2026-08-15**
> (a `Diverse` session, unbriefed: it loaded `test-first-discipline` on its own and wrote its tests
> before the production file). The harness half is **done, English and pushed**
> (`use-case-driven-harness`, branch `chore/test-first-discipline`).
>
> The harness side is **fully closed**: PR #1 merged into `main` (`9f843dc`) on the owner's call, and
> the local clone put back on `main` (the `~/.claude` symlinks read that working tree).
>
> **S0bis is COMPLETE and closed** _(2026-08-20, branch `chore/s0bis-entrypoint-mutation-debt`, draft
> [PR #75](https://github.com/tpierrain/kenjaku/pull/75) — nothing merged, nothing tagged)_. Both
> v4.8.0 debts are paid, including its last open item, `session-status.mjs`, which needed the owner at
> the keyboard and was arbitrated the same day. **Nothing is left under S0bis.** Every score, and the
> state of the 0 % tier, is in
> [`RESULTS.md` § S0bis](../../mutation/RESULTS.md#s0bis--the-two-structural-debts-paid-scripts-only--2026-08-20),
> which **owns** them — this plan owns the release's state, not the measurements, and deliberately
> keeps no copy of a number.
>
> **The landmark is now S1** (an immutable base per `merge` file) — the first box of the substance
> this plan exists for. ▶️ **S1 IS UNDER WAY: THREE pure slices have landed**, all test-first and all
> at **100 % mutation** the hour they were written _(numbers owned by `RESULTS.md`, §§
> [S1's first slice](../../mutation/RESULTS.md#s1s-first-slice--libengine-basemjs-measured-the-day-it-was-written--2026-08-20),
> [S1's advance rule](../../mutation/RESULTS.md#s1s-advance-rule--planbaseadvance-same-file-same-day--2026-08-20)
> and [S1's seeding planner](../../mutation/RESULTS.md#s1s-seeding-planner--planbaseseed-same-file-same-day--2026-08-20))_:
>
> - **the base's HOME and its PROOF** _(2026-08-20 · `411d4d7` + `40743c1`)_ — `scripts/lib/engine-base.mjs`:
>   **where** a base lives (`.engine-base/<rel>`, one tree for the four families) and **whether it is
>   provable** (the recorded sha256, with `no-provenance` / `absent` / `mismatch` named apart because
>   their repairs differ);
> - **the ADVANCE rule** _(2026-08-20 · `184ce2e`)_ — `planBaseAdvance`, the sentence S1 is named after:
>   *the base moves to what was **delivered** to the installed file, never to the newest fetched
>   content.* Driven by the delivery map that already exists, so `engine-skills/**` (a `replace` target)
>   can no longer run the base ahead of a file that stood still;
> - **the SEEDING planner** _(2026-08-20 · `fb87393`)_ — `planBaseSeed`, the migration: a brain seeds its
>   own tree **from itself**, because a file still matching its recorded sha **is** the last delivery.
>   Seeds whenever the tree cannot be **proven** (so a drifted base is repaired), never when it can.
>
> - **the fs ORCHESTRATOR and its WIRING** _(2026-08-20 · `74de7e8`)_ — `scripts/lib/engine-base-fs.mjs`,
>   the only writer of `.engine-base/`, wired into **all three** writers: the installer (one call now
>   records source, provenance **and** the tree, so an install cannot ship a brain without an ancestor),
>   `update-engine.mjs` step 7, and `reconcile-brain.mjs`'s `runReconcileCli` — the LAST writer on the
>   update path, and the one that runs when the old parent performs its first upgrade. One function
>   serves both moments: **advance** to what the update delivered, then **seed** whatever the brain can
>   still prove about itself, always both, because no deployed brain holds a tree so every update is
>   also that brain's migration. ✅ **The tree's own regime is answered**: a fourth key, **`local`**,
>   beside replace/merge/regenerate — guarded twice (no delivery glob may reach into the tree; the apply
>   plan may never touch it).
>
> _(All of S1 is on `feat/engine-base-unfreeze`, draft
> [PR #76](https://github.com/tpierrain/kenjaku/pull/76), based on the S0bis branch so **#75 keeps its
> own perimeter**. Nothing merged, nothing tagged.)_
>
> ✅ **S2's DESIGN IS WRITTEN AND COMMITTED** _(2026-08-20)_ — the whole shape lives in the S2 block of
> the Tracking below: the verdict table, the merge engine's choice and its measurement, the rule that
> **the base advances to what the engine DELIVERED while the disk receives the MERGE**, the three slices
> (S2a / S2b / S2c) and what is deliberately out. Nothing of it is left in a session's window.
>
> ✅ **THE MERGE ITSELF EXISTS — S2a-1 and S2a-2 are done** _(2026-08-20)_. The pure verdict table
> (`engine-merge.mjs`, `acabcc8`, 100 % first pass) and the git seam (`engine-merge-git.mjs`, `de19cd9`
> + `ead71d0`, 75 % → 100 %). S2a was **re-cut into three** on contact (core / git seam / rewiring),
> because one slice writing a pure core, spawning git **and** rewiring the refresher is this chantier's
> own definition of mis-cut. Numbers owned by `RESULTS.md`.
>
> ⚠️ **The table was CORRECTED before it shipped** _(2026-08-20 · `8d4da37`)_ — nine rows now, not
> eight. Starting the rewiring exposed that it asked the base's **bytes** for questions the recorded
> **sha** answers, which would have frozen every skill on the fleet at its first update (the reasoning
> is in the S2 design block below, and it is worth reading before touching the table again).
>
> ✅ **THE MERGE REACHES A REAL BRAIN — S2a-3 is done** _(2026-08-20 · `d7867fd` + `2ec18a5` +
> `5dc470b`, 98 % → 100 %)_. `refreshUntouchedSkills` runs on `mergeVerdict`, reads each ancestor itself
> from `.engine-base/<rel>` (no caller signature changed), and "preserve" stops meaning "abandon" for
> the skills: the owner's edit and the engine's update both land, and only a real clash still costs
> anyone anything.
>
> ✅ **S2a IS COMPLETE — the merge works AND says so** _(2026-08-21 · `ecd8d6c`)_. `skillsMerged` and
> `conflicts` reach `formatReport`: a merge announces that the owner's edits were kept **and** the
> update landed, a failed merge says so apart, and a clash is the loudest line in the report.
>
> ✅ **S2b IS DESIGNED, and the design corrected a fact this plan had wrong** _(2026-08-21 · design
> slice, no code)_. The full block is below (§ S2b); its four sub-slices are the work queue.
>
> ✅ **S2b-1 IS DONE — the merge's journey to the disk stops belonging to the skills** _(2026-08-21 ·
> `3395e1a` + `211cfc5`)_. `engine-merge-apply.mjs` carries a verdict for **any** family of
> engine-owned file; the skills are its first client. **100 % on both files, first pass**, and the
> mutant count (113 → 86 + 28) is what proves it was a move and not a rewrite.
>
> ✅ **S2b-2 IS DONE — a merge that would not parse is never written** _(2026-08-21 · `6ba4348`)_. The
> merge's OUTPUT is parsed under the brain's own node before it reaches the disk, and only the merge's
> output; `merge-unsafe` and `merge-failed` say different things, and the report can say both.
>
> ✅ **S2b-3 IS DONE — the four engine scripts are unfrozen, in ONE commit** _(2026-08-21 · `8b90fc8`
> + `d7a6fd6` + `bc6a9f5` + `59c2275`)_. `mergeScripts` left `copyGlobs` and `engine-script-refresh.mjs`
> took over in the same commit, so the branch never held a state where nobody delivered them. The report
> says *file*, and the `merge-unsafe` sentence S2b-2 pinned as a known lie is now true. **100 % on the
> new module** (16 mutants), the carrier **still 100 %** (106), and `engine-apply-plan.mjs` — the
> write-allowlist, never measured before — went **78 % → 92 %** with three real safety holes closed.
>
> ✅ **S2b-4 IS DONE — and with it, S2b** _(2026-08-21 · `1d1bc3c` + `ca41b10`)_. The debt this sub-slice
> was reserved for was **not a coverage hole**: step 7's readback of every copied file's bytes fed two
> consumers that both discard them, so the line was deleted rather than tested. The `argv` default died
> to a test, `unknown()` moved into `engine-update-check.mjs`, and the last two survivors are **named
> equivalents**. `update-engine.mjs` ends S2b at **98.65 %** (293 killed, 4 survived, all equivalent).
>
> ✅ **S3 IS DESIGNED** _(2026-08-21 · design slice, no code)_. The full block is below (§ S3), and it
> found three things a green test would not have: the guard sees **only what Claude writes** (a
> `PreToolUse` hook sees tool calls, so the owner's editor and the engine's own `fs` writes are both
> invisible — and that is why it needs no self-exemption); **the regimes alone give the wrong verdict**,
> because `CLAUDE.md` and `.claude/settings.json` are `merge`-regime files the guard exists to redirect
> people **to**; and adding the hook next to `vault-write-guard` in the same matcher group **would never
> reach a deployed brain** (`reconcileHooks` identifies a group by its *first* script).
>
> ✅ **S3-0 IS DONE — the `"ask"` dialect is real** _(2026-08-21)_, read out of the shipped client's own
> binary rather than recalled: `allow | deny | ask | defer`, an unknown value **throws**, the reason
> reaches the permission layer on `ask` too, and combining hooks is **most-restrictive-wins** — which
> also settles, for free, that the new guard cannot weaken `vault-write-guard` beside it.
>
> ✅ **S3-1 IS DONE — the guard decides** _(2026-08-21 · `4bf5efa` + `b82569e`, **98.89 %**)_. The
> three-way verdict is built and measured: the owner's surface passes in silence, engine internals ask
> with the price named per regime, and `.engine-base/**` is denied on the path rather than on the
> manifest. Its mutation run's real finding was about the **prose**: the four sentences an owner reads
> are the deliverable, and sampling them with `assert.match` left most of each one unjudged.
>
> ✅ **S3-2 IS DONE — the guard reaches a brain** _(2026-08-21 · `cf55c2a` + `3493533`, **88 %**, all
> three survivors equivalents)_. Its own `PreToolUse` group in the template (two tests now make packing
> it beside `vault-write-guard` go red instead of silently delivering nothing), the entry script in the
> `replace` regime, and a red test that changed the code: the manifest read has its own `catch`, because
> the outer catch-all would have disarmed the `.engine-base` deny through the very file it protects.
>
> ✅ **S3 IS COMPLETE** _(2026-08-21 · S3-0 → S3-3)_. The guard decides, reaches a brain, and ADR 0012
> now carries the boundary read backwards (§5) rather than a new ADR splitting one topic in two. **One
> item is deliberately left open and it is not code**: whether the prompt becomes noise on a session that
> legitimately customizes an engine skill. That can only be answered by living with the guard, so it is
> carried to the release checklist.
>
> ✅ **S4 IS DESIGNED** _(2026-08-21 · design slice, no code)_. The full block is below (§ S4), and the
> design changed the shape of the slice twice. **"Which files" costs nothing** (a `merge` file whose disk
> digest differs from its recorded provenance *is* one the engine is holding back — exact and offline),
> but **"how far behind" has no source at all**: the base tree holds the last-delivered bytes and nothing
> holds the version they came from, so a `baseRefs: { rel: ref }` map joins the manifest beside
> `provenance`. And **the obvious surface is disqualified by [ADR 0036](../../decisions/0036-deterministic-channels-differ-by-surface.md)**:
> `statusLine` is opt-in *and* renders nothing in Desktop's Code tab, where a SessionStart `systemMessage`
> is dropped too — so the notice rides `additionalContext`, which is also the right shape for a fact that
> must be stated and never nagged.
>
> **▶️ RESUME AT: the release TAIL — S6e is BLOCKED on the scope call at the top of this file, and it
> is the only thing left in S6** _(2026-08-21)_. Do **not** start writing the French: the loop looked at
> the FR tree before writing it, found the slice may not be worth doing at all, and put the arbitration
> where it belongs. **Everything else in S1–S6 is done**, and the v4.9.0 mutation debt is **already
> paid** (delivered on branch with S0bis — its own plan says so and owns the argument).
>
> ✅ **THE REPLAY FIXTURE IS DONE** _(2026-08-21 · design `5c62423`, code `9ffddfa`)_ — § *The QA
> instrument* owns it. Three poles over one brain rebuilt from the `v3.6.0` tag, and the only variable
> between them is **the ancestor**: no provenance → preserved and **reported**; the ancestor an
> installer of this release records → **refreshed**; the owner's own rule written into the file →
> **merged**, their line and the update both landing. Each pole was seen red by an inverted probe
> before being kept.
>
> ### 🏁 SO WHAT REMAINS ON THIS RELEASE, and it is short
>
> **The engineering is done.** S1, S2, S3, S4, S5 and S6 (bar S6e) have shipped; the v4.9.0 mutation
> debt was paid with S0bis; the acceptance test exists. A mechanical sweep of every unticked leaf in
> this file returns **design boxes, exclusion boxes, and four real items — all four of which are
> Thomas's**:
>
> - [ ] 🛑 **The S6e scope call** — the blocking box at the top of this file. One word.
> - [ ] 🗣️ **The release note, and the three user-facing sentences at § S4-3** — tone is his at release
>       time (`release-notes-tone`). **TWO claims must not be overstated, and both are now pinned by a
>       test rather than by anyone's memory:**
>   - [x] ⚠️ ~~**The doctrine layer unfreezes no already-deployed brain.**~~ **THIS CONSTRAINT IS DEAD
>         — do not carry it into the release note.** It was true of the release **as this plan built
>         it**, and S7 of the successor plan made it false on 2026-08-21 (`f3d72c4`): a brain rebuilt
>         from the real `v3.6.0` tag, recording no sha for the doctrine, now comes out of an update
>         byte-identical to what the engine ships. The acceptance test that pinned the old claim was
>         **inverted, with its reason**, in `release-fixture-doctrine.test.mjs`. What the note may
>         claim, and the wording is the successor plan's to settle, is bounded by the row below.
>   - [ ] ⚠️ **The merge does not reach BACK** _(found 2026-08-21 while checking what the note could
>         claim · `19a6842`)_. The obvious sentence — *"your edits are kept AND you get the update"* —
>         is **false for one population, permanently**: files the owner had **already edited before
>         this release**. A merge needs an ancestor; a base can only be seeded from bytes that still
>         match their recorded sha, and an edited file does not. It cannot be seeded from the fetched
>         copy either — that is *theirs*, not the ancestor, so merging against it would silently
>         discard everything shipped between the install and now. **The behaviour is right**; a
>         comment in `engine-base.mjs` claiming those files would self-heal *"at their next delivery"*
>         was the only thing wrong, and it is fixed. ✅ **The true sentence**: *files you edit from
>         this version on will merge; the ones you had already changed keep standing untouched, with
>         the new version beside them, and the update says so by name.*
>         ✅ **"PERMANENTLY" IS NOW FALSE, and S7-5 SHIPPED** _(2026-08-21 · `fa0f5be`)_. The
>         reasoning above had exactly one hole: the ancestor cannot be seeded **from the disk**, but it
>         can be **FETCHED** from the tag the recorded sha names. Measured on a brain built from the
>         real `v3.6.0` tag — the owner's lines survive and the update lands, in the same pass — and the
>         two QA tests that pinned the old limitation are inverted. **The successor plan owns what the
>         note may now claim and this row keeps no copy**:
>         [`../prospective/v5-unfreezes-the-existing-fleet-action.md`](../prospective/v5-unfreezes-the-existing-fleet-action.md).
>         Flagged here only so nobody quotes "permanently" out of an archive.
> - [ ] ✂️ **Cutting, tagging and publishing** — his, always (§ *Where the owner is required*).
> - [ ] 🔬 **The one S3 item that is a field measurement, not code** (§ S3, and it says so there):
>       whether the write guard's prompt becomes noise on a session that legitimately customizes an
>       engine skill. Only living with the guard answers it; it is carried to the release checklist.
>
> _(**Carrier debt: paid for S1 and S4** _(2026-08-21 · `d6b2565`, and this commit)_. Both were closed
> the same way — a read-only subagent re-verifying every design and exclusion box **against the code**,
> never against this plan's own prose — and the two audits did not agree: S1's found **two false
> claims** (struck in place, with the reason), S4's found **nineteen out of nineteen true**. That
> asymmetry is the point: the audit is what makes a tick mean something, so passing it is not evidence
> that the next section will.
>
> **Still `- [ ]`: S2 and S6, and each for one named reason** — S2 keeps one child open on purpose (the
> row-2 seeding deferral, a decision that is not verifiable in code because it is about what was *not*
> built), and S6 waits on the S6e scope call at the top of this file. Verified mechanically after every
> pass: **no unticked parent has all its children ticked**, and no unticked leaf is an implementation
> task.)_
>
> 🧹 _**Known carrier debt, named rather than left to be re-discovered** (2026-08-21): the top-level
> **S1, S2 and S4** boxes are still `- [ ]` while this header says complete. Every remaining unticked
> child under them is a **design box or a `🚫 deliberately OUT` box** that was honoured but never
> ticked — the convention here is that constraints and exclusions are checkboxes too. Ticking them by
> inference from a summary is how a plan starts lying in the other direction, so they are left for
> whoever verifies them against S2a-3 / S4-4a / S4-4b's own reports. Four parents whose children were
> **all** already ticked were fixed this iteration, checked mechanically rather than by eye._
>
> _(If he answers **keep it**: the source to translate is `.claude/skills/test-first-discipline/SKILL.md`
> at **v2.3.0**, refreshed 2026-08-21, not the v2.0.0 text. And it is a **locale deliverable** —
> `language.md`'s own carve-out — so it is written in French on purpose and must never be "corrected"
> back to English.)_
>
> **S6b, S6c AND S6d are done, committed and pushed** (`b2329c2`, `15f3f4d`, `f46a42d`, `4c6a942`,
> `c65e5f4`): the retirement is declared in the shipped manifest, wired, guarded and reported, both
> launcher copies of `tdd-discipline` are gone, and the shipped `test-first-discipline` has caught up
> with its owner — **v2.0.0 → v2.3.0, byte-for-byte** (S6d's box owns what was dropped and why, and
> the third version's missing number, fixed upstream as harness `e9e8b40`).
>
> 🆕 **A RULE CHANGED MID-BLOCK, and it governs every remaining slice** _(Thomas, 2026-08-21)_:
> mutation is now scoped to the **changed lines** of an existing file
> (`mutate-one.mjs "scripts/x.mjs:147-160"`), whole-file only for a **new** file. The loop's own
> instruction in the mode plan (§ THE OVERNIGHT LOOP) is already rewritten, so a resumed session picks
> up the new rule and not the one that timed out.
>
> ✅ **S2c AND S2d ARE DONE.** S2c _(`856ad24`, 92.73 %)_: `SACRED` splits into *inviolable* and
> *merge-governed*, the merge-governed half **is** S3's `OWNER_AUTHORED` pinned by identity, and **ADR
> 0038** records it and amends 0012. Behaviour byte-for-byte unchanged — a door named is not a door
> open. S2d _(`c1ec660`, 99.44 %)_: the clash block ends by offering the walkthrough, once, without
> promising the flow that does not exist yet.
>
> ✅ **S5 IS COMPLETE** — `a51df22` (allowlist, 91.07 %), `74c273d` (family, 100 %), `4340240` (wiring
> + report), `b3aefa3` (**the manifest line and the lock**). The doctrine layer is declared, delivered,
> reported, and a FR brain gets the FR file. ⚠️ **Read the finding before writing the release note**:
> S5 unfreezes **no already-deployed brain** — with no provenance there is no ancestor, so the file is
> *reported*, not delivered, until the ancestor machine lands. New installs are correct from day one,
> and old brains stop being **silent**. That is the true claim; "the freeze is over" is not.
> ⚠️ **S5's design box was WRONG and is corrected in place** — "one manifest line" delivers **nothing**,
> because `computeApplyPlan` splits `merge` by shape and the doctrine layer is neither a script nor a
> skill. S5 is therefore **three slices**, listed at the end of the S5 block; the manifest line comes
> **last**, with the lock flip, or the manifest would promise a delivery no code performs. Nothing of
> the regime decision changed: it is still **`merge`**, and every other design box stands.
> ⚠️ **Read the design's central finding before writing the release note**: S5 unfreezes **no
> already-deployed brain** — with no provenance there is no ancestor, so the file is *reported*, not
> delivered, until the ancestor machine lands. New installs are correct from day one. Full block below, § S5.
>
> _(S4 is COMPLETE — S4-4a/b/c closed 2026-08-21 · `ea9a4c1`, `9dc9d5d`, `a3f4e2b` + two kill rounds:
> the brain says where it stands at rest, in one sentence, wired last on SessionStart, and the scan
> behind it stopped reading the owner's vault — **flat ~0.25 ms at 0, 2 000 or 8 000 notes**, where the
> walk alone cost 18.5 ms at 8 000. Numbers owned by `RESULTS.md`. **S2c and S2d** are queued after S5.)_
>
> _(S4-1, S4-2 and S4-3 were closed earlier the same day; their numbers, and everything each slice
> found, are in the S4 block below and in `RESULTS.md`. Nothing under S4 is outstanding.)_
>
> **S2c is UNBLOCKED** _(2026-08-21 — the box at the top is answered:
> yes, the engine may write `CLAUDE.md` through the merge door)_, and it amends ADR 0012, whose §5 is now
> in place. It is followed by a new **S2d** (the conflict report names its door instead of being a
> cul-de-sac); both are queued **after** S4, and neither waits on anyone.
>
> ⚠️ **What S4-4 must NOT re-derive**: `since: null` means *unknown*, and it stays unknown — the sentence
> is "no record", never a version. Neither the report nor the session surface may fill the gap from
> `source.ref`: the version the brain runs today is not the version the file is behind, and that is the
> exact confusion `baseRefs` was added to end. **The prose IS the deliverable** (S3's lesson, measured):
> assert the sentences whole, or the clauses in between go unjudged.
>

> ✅ **Measured while wiring it, do not re-derive** _(2026-08-20)_: the tree is **invisible** to the RAG
> (the indexer walks `vault/` only, and `.engine-base/` is its sibling at the brain root), to
> `lint-vault.mjs` and to `consolidate-scan.mjs` (same, they default to `vault/`); it **is** swept by
> `auto-commit.mjs`'s `git add .` with no `.gitignore` entry, which is the versioning the owner asked
> for; and it does **not** trip `vault-write-guard.mjs` (which judges `vault/` paths only). No
> collateral to pay anywhere.
>
> ✅ **The tree IS VERSIONED in the brain's own git repo** _(owner, 2026-08-20)_ — the auto-commit hook
> sweeps it like everything else, no `.gitignore` entry. **The argument that decided it**: a brain is
> synchronised across machines (the `/sync` skill). An ignored base would simply not travel, so the
> second machine would hold none — every `merge` file would read `no-provenance` there, and the unfreeze
> this whole chantier exists for would never happen on that machine. The cost is a few dozen KB and some
> noise in the history; the `.` prefix already keeps the folder out of Obsidian's and Finder's way. Do
> not re-open.
>
> ✅ **THE FORK IS NOW SIGNED, not merely inclined** _(owner, 2026-08-20: "oui, `.engine-base/` à la
> racine me va")_. The re-ask the plan had reserved was made once the first test showed the concrete
> shape (`.engine-base/CLAUDE.md`, `.engine-base/scripts/auto-commit.mjs`,
> `.engine-base/.claude/skills/coach/SKILL.md`), and the answer confirmed the leaning: **one tree, at
> the brain's root, beside the notes**. Nothing on this step needs the owner any more, and **the fs
> orchestrator is unblocked** — it was the only slice the open question held. Do not re-open it.
>
> ⏸️ **S1 was SCOUTED and its one blocking decision TAKEN** _(2026-08-20)_: the
> base lives in a single **`.engine-base/`** (owner's call, "la seconde a priori"). Its ground truth is
> measured on the deployed brains and written into its box — `merge` is **four** behaviours, not one,
> three of the four have **no base at all**, and `CLAUDE.engine.md` has **no regime at all**, which is
> why a fully-up-to-date brain is still 10 KB of doctrine behind. Do **not** re-measure any of it. ✅ **The slice that came before it is DONE**
> _(2026-08-20)_ — the `mutation-testing` pair (script + skill), so **S1 is the live work now**. Its
> record, and the working mode that governs how S1 may be dispatched, stay in
> [`agent-orchestrated-release-mode-action.md`](agent-orchestrated-release-mode-action.md) § Tracking;
> read that plan's header first, it is still the landmark for the chantier. One thing is still open on S6 and does not block it: its **Kenjaku-side
> delivery** (manifest `merge` regime, the explicit retirement of `tdd-discipline`, the
> `templates/fr/` version, `CONVENTIONS.md` §5) is release work, and it needs the power S1-S5 build —
> it belongs in the cut, not before it.
>
> A resume should still **surface S6 first**, because it is **blocked on a human** and would otherwise
> sit unnoticed; then take **S1** if Thomas is not at the keyboard.
>
> ## 🔢 THE VERSION NUMBER — **v5.0.0, SIGNED by the owner** (2026-08-20, in conversation: *"oui, on
> part sur la 5.0.0"*). Do not re-litigate it.
>
> This release is **v5.0.0**, the first major since the rename. The reason is the **promise, not the
> diff**, and the owner's own framing is the one retained: what breaks is *the behaviour towards the
> Constitution, and how a brain is updated from now on*. Argument, counter-argument and the three
> obligations a major carries: § *Why this release is a MAJOR* below — read it at cut time rather than
> re-deriving it. **Checked, not assumed**: the number costs the fleet **nothing**
> (`pickLatestSemverTag` compares numerically, **no major gate**, so `update-engine` and the "N
> releases ahead" line cross 4 → 5 like any other tag — `scripts/lib/semver-tag.mjs`).
>
> **This plan OWNS the number.** No other file states it — `RESULTS.md` and
> `v4.9.0-mutation-debt-plan.md` deliberately say *"the unfreeze release"* and stay true whatever
> happens; the ROADMAP row links here. Do not spread it: at cut time, one file to read.

## The four categories we actually have (measured 2026-08-08)

| Regime | What it does | Files |
|---|---|---|
| `replace` | overwritten blind at every update | `rag/src/**`, `scripts/**`, `scripts/lib/**`, `engine-skills/**`, the two templates… (41 globs) |
| `regenerate` | rebuilt from this machine | the 6 launchers |
| `merge` | **compared** to a provenance sha; equal → refreshed, different → **preserved forever** + `.new` sidecar | `CLAUDE.md`, `.claude/settings.json`, 10 user-facing skills, 4 scripts |
| **(none)** | **never updated, and nobody decided that** | **`CLAUDE.engine.md`**, `.gitignore` |

- [x] **The fourth category is an omission, not a policy.** It is what froze a v4.8.1 brain's doctrine
      at install day (evidence in `field-finding-2026-08-08-source-first-and-frozen-doctrine.md`) and
      what makes the `.gitignore` migration necessary in `active-universe-follows-the-owner-action.md`.
      Two live plans, one missing category.

## The design flaw, in one sentence

**`merge` owns a merge base and only ever uses it for an equality test.** With a base you can only
compare, there are exactly two possible outcomes — clobber the owner, or abandon the file — and we
chose *abandon*: permanently (a diverged file is never reconsidered), and silently (nothing ever says
"this file is 12 releases behind"). **"Preserve" was implemented as "give up".**

Three consequences, each already logged as its own field finding:

- [x] **A false positive freezes forever.** `field-finding-2026-08-05-silent-skill-freeze.md`: a skill
      with **zero lines of the owner's** was flagged customized and frozen since install. Mechanism,
      now nameable: the staging tree `engine-skills/**` is in `replace`, so **the base moves ahead at
      every update while the installed file stands still**. A base that moves is not a base; the
      comparison it feeds cannot be right.
- [x] **The owner keeps a hand-rolled patch instead of the real fix.** v4.8.1's own release note tells
      Windows owners to *drop the hand-patched launcher* someone gave them — that patch, on a `merge`
      file, would have frozen it. The agent patches an engine defect on the owner's behalf; the engine
      fixes it properly two releases later; the brain that was helped is the one that never receives it.
- [x] **The axis is wrong for this product.** Ownership is decided by **mutation**, in a product whose
      own agent edits files as a matter of course (and whose `/improve` skill actively invites it). So
      "modified = yours" mostly catches **Claude's past edits**, not the owner's deliberate work. The
      right axis is **origin**, plus a way to keep the owner's intent out of engine files in the first
      place.

## What makes the fix affordable (measured, do not re-derive)

- **Provenance is a `sha256:` string, not content** (15 entries on the deployed brain), so it can
  *verify* a base but cannot *be* one.
- **A pristine base already exists on every brain**: `engine-skills/<name>/` holds the engine's own copy
  beside the installed one (verified: after the owner's manual adoption, staged and installed are
  byte-identical). The mechanism is built — it is only **clobbered at each update** and used for `===`.
- **Locale-aware delivery is solved and in production since v4.1.0** (`resolveLocaleSource` +
  `readBrainLocale`), which was the stated reason the doctrine layer was frozen in ROADMAP Gate 1.

## Why this release is a MAJOR — the argument, and its counter-argument

> **Status: SIGNED — this release is `v5.0.0`** (owner, 2026-08-20). The header note carries the
> decision; this section carries the reasoning, so it is not re-derived at cut time, when the pressure
> is highest.

**The owner's framing, 2026-08-20, and it is sharper than the first draft of this section**: *"le
breaking change, c'est sur le comportement qu'on a vis-à-vis de la Constitution, et sur comment on met
à jour le second cerveau désormais."* Not the feature list — **the update model itself**, whose most
visible face is the constitution. Three facts back it, read in the code rather than recalled:

- **The sacred perimeter shrinks.** `engine-apply-plan.mjs` declares untouchable, whatever the manifest
  says: `CLAUDE.md`, `.claude/settings.json`, `.env`, and two whole **trees**, `.claude/skills/` and
  `vault/`. That tree is why more than half of an installed brain's skills have never received
  anything — they are not badly configured, they are **inside a perimeter declared sacred**. This
  release moves part of that boundary.
- **The ownership axis is replaced.** From *"you modified it, so it is yours"* — which mostly catches
  **Claude's own past edits**, in a product whose agent edits files for a living — to *origin decides
  who owns it, and a real merge delivers both sides*. Everything else in this plan is a consequence.
- **A test that says NEVER becomes a test that says HOW.** The lock in `engine-apply-plan.test.mjs`
  spells out its own reason: do not propagate `CLAUDE.engine.md` until delivery is locale-aware, *"else
  a FR brain is re-anglicized on upgrade"*. **That reason expired** — locale-aware delivery has been in
  production since v4.1.0. S5 flips it with the comment rewritten, never deleted quietly.

**Where the line is drawn, and it is not negotiable**: what the owner writes stays the owner's.
`CLAUDE.md`, `.env` and `vault/` remain sacred — the **two-layer design exists precisely so the engine
never needs to write in their constitution**: it owns `CLAUDE.engine.md`, they own `CLAUDE.md`. A
release that touched the personal layer would spend a promise we could not make twice. `settings.json`
is the one genuinely open case (it grows with every "always allow"), and it is S3's business.

⚠️ **Two populations, and the release note must not address them as one**: two-layer brains get their
doctrine unfrozen; **monolithic brains** (pre-layering, ~v3.2.x line) simply lack `CLAUDE.engine.md`
and **stay frozen** — retro-fitting them is *fleet re-layering*, a different subject with its own
carrier (`engine-managed-file-merge-strategy.md`, ROADMAP item 4). Not in this cut.

And on machines that already run, three things happen that no 4.x did:

- **engine files start moving again.** The staged skills (more than half of an installed brain's
  skills), the four `merge` scripts, and `CLAUDE.engine.md` — which is in no regime **at all** — enter
  one. Better outcomes, but files the owner never saw change will change.
- **the brain starts pushing back.** S3's write guard asks before an edit lands in an engine file: a
  new, visible interaction in daily use, not an internal detail.
- **something shipped goes away.** S6 retires `tdd-discipline` from deployed brains — the first
  deliberate **removal** from a brain the engine had already furnished.

Plus a **one-time migration**: `.engine-base/` is seeded inside the owner's folder at the first update
(13 of 15 entries from the brain itself, 2 from the fetched copy). A new tree appears in a directory
the owner considers theirs. That alone is a major-shaped event.

**The counter-argument, and it is honest**: strictly, semver majors mark a **broken** contract, and
nothing here breaks — every owner edit is preserved *better* than before, so this could be read as a
large minor (`v4.10.0`). **Why it loses**: the contract that changes is *"the engine leaves your files
alone"*, and the version number is the only signal in the series that says **read before you update**.
This is the first release that will write into files an owner may have edited by hand. Precedent is
consistent, too: `v4.0.0 — The One Where It Becomes Kenjaku` was a **meaning** shift, not a breakage.

**What calling it 5.0.0 obliges** (all of it belongs to the cut, none of it to S1):

- a release note with a plain *"what changes for you, and what you have to do"* — non-devs first, no
  alarm (`CONVENTIONS.md` §11);
- the QA instrument exercised **across the boundary**: an update **4.x → 5.0.0** replayed on the frozen
  `mind-palace` fixture, not only same-major updates;
- a stated answer to *"and if it goes wrong?"* — what the owner does to get their file back.

**What it does NOT oblige**: any code change. The version is a git tag (ADR 0017); the number is a
message to owners, never a protection. What protects them is S2's real merge, S3's guard and S4's
audible divergence.

## Tracking

- [x] **S0 — ✅ SEQUENCED 2026-08-08 by the owner**: the small universes release ships and is cut
      **first**, then **this becomes the next release, and it is the imposing one**. It supersedes
      Gate 4's F-B7e in scope, **absorbs `field-finding-2026-08-05-silent-skill-freeze.md`** as a
      symptom rather than fixing it separately, and **carries the source-first rule**
      (`field-finding-2026-08-08-source-first-and-frozen-doctrine.md`) as its demonstration: the
      release whose subject is *the doctrine finally arrives* is where new doctrine should arrive.
      Nothing here starts before the universes release is cut.
- [x] **S0bis — INHERITED FLOOR: the v4.8.0 mutation debt is due WITH this release** _(owner,
      2026-08-08)_ — **PAID IN FULL 2026-08-20**, branch `chore/s0bis-entrypoint-mutation-debt`
      (draft PR #75, nothing merged or tagged).
      It was the declared floor of v4.9.0; the owner re-arbitrated it in writing onto this
      release when v4.9.0 was scoped to universes alone. It is carried here so it arrives with its
      release instead of relying on someone re-opening the other file.
  - [x] Pay both debts from `prospective/v4.9.0-mutation-debt-plan.md` (Debt 1: a shared
        `runAsEntrypoint` + the guard test whose allowlist may only shrink; Debt 2: `defaultGit` as a
        pure value), then re-measure and close the loop in `maintainers/mutation/RESULTS.md`
        _(2026-08-20 — both paid, ceilings **32/26 → 13/9**; the scores are in `RESULTS.md` § S0bis)_.
  - [x] `session-status.mjs` — the last entry-guard file, and the only one that **cannot be verified by
        running it** (executing it sweeps and auto-commits the working tree). Held as an arbitration
        rather than done blind, **answered by the owner the same day** ("yes, now, at the keyboard")
        and paid over three measured rounds. What made it judgeable was a **disposable git worktree**,
        where a sweep-and-commit is harmless — so the red was taken for real and the output proved
        byte-identical before and after _(2026-08-20 · scores in `RESULTS.md` § S0bis)_.
  - [x] ⚠️ **This is the third due date for the same debt** (v4.5.0, v4.6.0, then v4.9.0). Cutting this
        release without paying it is a **defect**, not a candidate for a second re-arbitration.

- [x] **S1 — An immutable base per `merge` file.** Freeze the staged copy at **the version actually
      delivered to the installed file**, instead of overwriting it with the newest one. That one change
      makes the existing comparison correct and kills the silent-freeze false positive by construction.
      _(COMPLETE — every child box below was verified against the CODE by the carrier audit of
      2026-08-21, not against this plan's own prose; one of them turned out FALSE and is struck in
      place rather than quietly deleted.)_
  - [x] The recorded `sha256` becomes what it should always have been: the **proof** that the base on
        disk is the right one, checked before any merge.
  - [x] Decide the base's home for the files that have none today (`CLAUDE.md`, `settings.json`, the
        four scripts): generalize the `engine-skills/` idea, or a single `.engine-base/` tree. Cost is
        a few dozen KB.
  - [x] **GROUND TRUTH, measured on the deployed brains 2026-08-20 — do not re-derive it.** Read on
        `~/mind-palace` (engine `scripts` 1.13.1), cross-checked on `~/autre-brain` (1.7.0) and
        `~/legacy-brain` (1.1.0). `merge` is **not one behaviour, it is four**, and only one of them is
        the mechanism this step was written about:
    - [x] **The 9-10 declared `merge` skills** — provenance-gated refresh, `.new` sidecar when the
          owner customized. This is the mechanism that works, and the only one a base serves today.
    - [x] **The 9 STAGED skills** (`consolidate`, `file-back`, `lint`, `local-mirror`,
          `mcp-token-expired`, `open-note`, `rag`, `univers`, `universe`) — installed under
          `.claude/skills/<name>/`, a path **no `merge` glob names**, so `provenance[rel]` is
          **undefined** and `refreshVerdict` returns `preserve: no-provenance` **every single time**:
          never refreshed, and **not even offered** a `.new` sidecar (that branch is reserved for
          `customized`). **More than half of an installed brain's skills are outside the update regime
          entirely.** On the brains read they are still byte-identical to their staged source, so the
          freeze has not yet *shown*, but nothing can ever lift it.
    - [x] **`CLAUDE.md` and `.claude/settings.json`** — not "preserved by a comparison": **SACRED**
          in `engine-apply-plan.mjs` (`SACRED_FILES`), scrubbed out of the write allowlist whatever the
          manifest says. Both are **diverged from their recorded base on the live brain** (expected:
          the constitution is personalized then edited, the allowlist grows with every "always allow").
          These are the two carriers of the frozen doctrine, and **a base alone will not unfreeze
          them** — it takes S2's merge *and* a decision to stop treating them as untouchable.
    - [x] **The 4 `merge` scripts** (`auto-commit`, `auto-push`, `status-line`, `verify-rag`) — the
          opposite failure: `computeApplyPlan` puts them in `replaceScripts`, so they are **overwritten
          blind**. Declared `merge`, applied `replace`. On the brains read they all still match their
          base, so no owner edit has been destroyed yet — but nothing prevents it.
  - [x] 🛑 **THE FORK — ANSWERED 2026-08-20: a single `.engine-base/`**, the recommended option
        _(owner, in conversation: "la seconde a priori" — a leaning, not a signature; he may revisit it
        when the first test makes the shape concrete, and that is the moment to re-ask, not before)_.
    - [x] ✅ **RE-ASKED AND SIGNED the same day**, once `baseRelPath`'s tests showed the literal paths:
          *"oui, `.engine-base/` à la racine me va"*. The leaning became a decision, the tree sits at the
          **brain's root beside the notes** (not hidden under `.claude/`), and the fs orchestrator is
          unblocked. **Do not re-open.**
        The rejected option was generalizing `engine-skills/` (one staging tree per family). **The
        reason to keep**: the problem is not skills — three of the four families have **no base at
        all**, and `engine-skills/` cannot host `CLAUDE.md` or `settings.json` without becoming a
        second thing. One tree, one mechanism, one answer for the files that have none.
  - [x] **The case that made the decision concrete, measured 2026-08-20 — the best demonstration this
        chantier has, and it is worth quoting in the release note.** `~/mind-palace` is installed at
        **`v4.9.1`, engine `scripts` 1.13.1**, i.e. the newest published code. Its doctrine layer is
        **26 KB against the launcher's 36 KB**: four sections missing, one of them the *discipline
        d'affirmation* (a negative claim about a person must name its check or become a question),
        which landed **2026-08-03** and has shipped in **every tag since v4.5.0**. The brain's
        `CLAUDE.md` line 13 is `@CLAUDE.engine.md`, so that layer loads at **every session** — the rule
        written to stop the brain from repeating an accusation about a colleague simply never arrived.
    - [x] **Why it never arrived**: `CLAUDE.engine.md` is in **no regime at all** in
          `engine-manifest.json`. Not `replace`, not `merge`, not `regenerate`. The fourth category
          above, *"never updated, and nobody decided that"* — an omission, not a policy.
    - [x] **And why the base is the unlock**: with no ancestor, the only way to deliver those four
          sections is a blind overwrite of a file that sits beside a personalized constitution, which
          nobody dares do — so nothing ships. With `.engine-base/` we know what was last delivered, so
          the sections can land **without touching** what the owner wrote next to them.
    - [x] **What makes the migration cheap, and it falls out of the same measurement**: on a brain
          where the installed file still **matches its recorded `sha256`**, that file **is** the
          engine's last delivered content — so the base tree can be seeded **from the brain itself**,
          with no fetch. 13 of 15 entries qualified on the live brain.
      - [x] ⚠️ **The last clause of this box was FALSE and is struck** _(caught 2026-08-21 by the
            carrier audit, same defect as the code comment fixed in `19a6842`)_. It read: *"the two
            that did not (`CLAUDE.md`, `settings.json`) seed from the fetched engine copy at the next
            update."* ~~They do not.~~ **There is no such path**: a preserved customization is never
            *delivered* (row 7 returns no `deliver`), so `planBaseAdvance` never moves its base; and
            seeding from the fetched copy would seed *theirs*, not the ancestor, silently discarding
            everything shipped in between. **The behaviour is right, the sentence was not.** Those two
            files stay preserved with the new version beside them, and the `deferred` list names them
            with the reason. Pinned by `release-fixture-refresh.test.mjs`.
  - [x] **The base's HOME and its PROOF are built** _(2026-08-20 · `411d4d7` + `40743c1`)_ —
        `scripts/lib/engine-base.mjs`, pure and fs-free: `baseRelPath` (one `.engine-base/` tree, a
        deliberately unconditional prefix, no per-family case) and `verifyBase`, which turns the
        recorded sha256 into the **proof checked before any merge** and names its three failures apart
        because their repairs differ — `no-provenance` (never entered the regime: the 9 staged skills,
        `CLAUDE.engine.md`), `absent` (incomplete tree, re-seed), `mismatch` (the tree drifted; feeding
        those bytes to a three-way merge would silently pick the **wrong ancestor**, which is the
        failure this tree exists to make impossible). 8 cases red on their assertions first, **100 %
        mutation**, and the run earned its keep: the survivor it found was the raw-vs-normalized half
        of the proof, i.e. **a real Windows case the suite had no example of** (a brain that
        fingerprints CRLF bytes at install records a CRLF sha). ♻️ `normalizeEol` had a second copy in
        `engine-skill-refresh.mjs`; one definition now, since both answer the same question about the
        same sha.
  - [x] **The ADVANCE rule, the sentence this step is named after** _(2026-08-20 · `184ce2e`)_ — a pure
        `planBaseAdvance`: the base moves to what was **delivered** to the installed file, never to the
        newest fetched content. Driven by the delivery map that already exists (`installedFileMap` +
        `refreshedFileMap`), not by the source tree — that substitution *is* the false positive
        (`engine-skills/**` sits in `replace`, so the base would run ahead while the installed file
        stands still). 6 cases red on their assertions first, **100 % mutation, no survivor**
        _(number owned by [`RESULTS.md` § S1's advance rule](../../mutation/RESULTS.md#s1s-advance-rule--planbaseadvance-same-file-same-day--2026-08-20))_.
    - [x] **Decided while building it, worth keeping**: an entry leaves with its path, its bytes **and**
          its sha in **one object**. The tree and the record can then never be advanced apart — that
          drift is exactly what `verifyBase` would report as a `mismatch`, and the orchestrator has
          nothing left to recompute. The digest is taken over the delivered bytes **as they are** (like
          `buildProvenance` at install), or a Windows brain would flip its recorded sha at its first
          update for content nobody touched.
    - [x] **A file the update did NOT deliver is absent from the map, so its base stands.** That is what
          makes "preserve" finally keep an ancestor worth merging from — the input S2's three-way needs.
  - [x] **The seeding planner** _(2026-08-20 · `fb87393`)_ — `planBaseSeed`, on the measurement above:
        installed content matching its recorded sha **is** the engine's last delivered content → seed
        the tree from the brain itself, no fetch (13 of 15 entries qualified on the live brain). The
        other two seed from the fetched copy at the next update, through the advance rule. 9 cases red
        on their assertions first, **100 % mutation, no survivor** _(number owned by
        [`RESULTS.md` § S1's seeding planner](../../mutation/RESULTS.md#s1s-seeding-planner--planbaseseed-same-file-same-day--2026-08-20))_.
    - [x] **Decided while building it**: the rule is **not** "seed when absent" but *"seed whenever the
          tree cannot be PROVEN"*, so a base that drifted is repaired by the same pass — and a base that
          is present **and** provable is left strictly alone. That last guard is load-bearing: this runs
          at **every** update, and re-seeding a correct ancestor from a file the owner has edited since
          is the one way the migration could destroy exactly what it exists to protect.
    - [x] **No second definition of the proof**: "would these bytes make a provable base?" *is* the
          seeding question, so `verifyBase` is asked of the **installed** file, and only its three
          refusals are renamed to what they mean on that side — `customized` (waits for a delivery),
          `no-provenance` (waits for a regime), `not-installed` (waits for nothing).
    - [x] **Candidates are the recorded entries UNION what the brain holds**, so a file the owner
          DELETED is named rather than invisible — a planner walking only the disk would report nothing
          about it at all. Feeds S4's audible divergence.
  - [x] **The fs orchestrator + the wiring** _(2026-08-20 · `74de7e8`)_ — `engine-base-fs.mjs`, the
        single writer of the tree, wired at install and in **both** update writers. 12 cases red on
        their assertions first (a skeleton module, so the red was never a loading error), plus one
        wiring test per writer. **75 % → 95 %** on the mutation run, 2 named survivors _(number owned by
        [`RESULTS.md` § S1's fs orchestrator](../../mutation/RESULTS.md#s1s-fs-orchestrator--engine-base-fsmjs-the-first-slice-that-touches-the-disk--2026-08-20))_ —
        the first pass under 100 % of this chantier, and it found a real hole: the digests the advance
        computes were load-bearing in the production and inert in every test.
    - [x] **One function for both moments**, not two: `syncBaseTree` advances what was delivered, then
          seeds what the brain can still prove. Running the seed on **every** pass is what makes the
          fleet's migration happen at all — including on a self-heal that delivers nothing.
    - [x] **The advance lands BEFORE the seed, and its digests are folded into the record the seed
          reads.** Otherwise a file just advanced would look unprovable and be seeded a second time,
          from an installed file that may already have moved on.
    - [x] **One fact, one owner**: this module writes bytes, `reseedProvenance` writes shas, and a test
          asserts the tree it wrote is **provable** against the record its neighbour wrote — the
          `mismatch` that would otherwise surface only later, as a three-way merge picking the wrong
          ancestor.
    - [x] 🛑 **The tree's regime is ANSWERED: `local`**, a fourth key beside replace/merge/regenerate.
          `replace` would overwrite the ancestor with the newest fetched content (this release's bug,
          one level up), `merge` would ask a three-way merge to merge its own input, `regenerate`
          describes what a launcher rebuilds. Guarded twice: no delivery glob may reach a
          `.engine-base/…` path, and `computeApplyPlan` may never touch one. A `local` glob must also
          match **no tracked source file** — it names what a brain produces, never what the launcher
          ships.
- [ ] **S2 — A real three-way merge, so "preserve" stops meaning "abandon".**
  - [x] untouched → fast-forward (today's behaviour, unchanged);
  - [x] owner's edit in a region the update does not touch → **merge**: they keep their edit **and**
        receive the update. This is the case that is common today and served worst;
  - [x] both changed the same region → a **real conflict**, the only case that costs a human anything,
        and the only one that should produce a sidecar or a question. ⚠️ **The "only one" no longer
        holds** _(2026-08-21)_: rows 3 and 7 emit sidecars too, and **S10 turns a sidecar into an
        actual question** — the owner's acceptance criterion for v5. Owned by
        `../prospective/v5-unfreezes-the-existing-fleet-action.md`; left visible, since what this line
        got right is that a conflict is the case that costs a human something.
  - [x] ~~Markdown-aware where it pays (doctrine and skills are section-structured), line-based
        otherwise.~~ ⛔ **DROPPED, and this line contradicted its own section until the carrier audit
        caught it** _(2026-08-21)_. S2's exclusion list already says *"Markdown-aware merging.
        Line-based only, on the measurement above"* — the exclusion is later and it won; what shipped
        is `git merge-file` and nothing else (`engine-merge-git.mjs`, no section logic anywhere).
        Left visible rather than deleted: a reader landing here would otherwise have believed the
        merge understands Markdown, which is exactly the kind of promise a plan should not make in
        two places and answer differently.

  - [x] 🧭 **THE DESIGN — written before a line of test** _(2026-08-20)_.
        Written into this file rather than held in a window, because a compaction costs a session its
        reasoning and never its files. Everything below is decided unless a line says otherwise; the
        one arbitration it deferred (may the engine write `CLAUDE.md`?) was **answered 2026-08-21** — see the
        box at the top. Nothing in this design is open any more.

  - [x] **The sentence S2 is named after — and the trap inside it.**
        **The disk receives the MERGE; the base advances to the CANDIDATE.** The two are *different
        bytes*, and S1's plumbing calls both "delivered", so this is where S2 could silently destroy
        exactly what it exists to protect:
    - [x] If the base were advanced to the **merged** file, then at the next update `ours` and `base`
          would be identical, the file would read **untouched**, and the fast-forward would **clobber
          the owner's edit** — the very outcome this chantier exists to end, reintroduced by the fix.
    - [x] So `deliveredFileMap`'s definition sharpens from *"the bytes written"* to **"the engine
          content this pass brought the file up to"**. It carries the **candidate** for a merged file,
          and a **conflicted file is absent from it** (the engine delivered nothing, so its base must
          stand — S1 already made "absent from the map" mean exactly that).
    - [x] Consequence to state out loud: after a clean merge the file reads `customized` at the next
          update, **and that is correct** — the owner's edit is still there, on top of a newer ancestor.
    - [x] The invariant to pin with a test, since it is the one that kills brains silently:
          `provenance[rel] === sha(base bytes) === sha(candidate)` for every merged file. S1 already
          asserts tree-and-record agreement; S2 extends it to the merge path.

  - [x] **The merge engine: `git merge-file`, behind one seam.** _(revisable when the first test makes
        it concrete, the way `.engine-base/` was — but decided now, not left open.)_
    - [x] **Why not hand-rolled diff3**: it would be the highest-risk code of the chantier (a subtle
          bug destroys an owner's work), for an algorithm that is already solved.
    - [x] **Why git is legitimate here**: a brain **is** a git repository (the installer runs
          `git init`, the auto-commit hook runs `git` at every session), so this adds no dependency —
          and `scripts/` ships as plain files with no install step, so an npm dependency was never an
          option. Bonus: the conflict markers are the ones people already recognise.
    - [x] **Measured on 2026-08-20, git 2.52.0** — `git merge-file -p --diff3 -L … ours base theirs`
          writes the result to stdout and **exits with the conflict count** (0 = clean). Verified clean
          on a Markdown case where the owner edits one paragraph and the engine appends a section;
          verified conflicting when the two edits sit on **adjacent lines with no blank line between**.
          That adjacency rule is diff3's, not git's — a hand-rolled implementation would conflict there
          too — and on section-structured Markdown the blank lines give exactly the granularity wanted.
    - [x] **The `-L` labels are user-facing text**: `your version` / `engine base` / `engine <version>`.
          Wording is Thomas's call at release time (`release-notes-tone`), not a blocker for the code.

  - [x] 🛑 **THE TABLE WAS WRONG ON ITS FIRST WRITING, and S2a-3 caught it before it shipped**
        _(2026-08-20)_. The original eight rows asked **every** question of the base's BYTES. But
        `reconcileBrain` — which runs the skill refresh — happens at
        [`update-engine.mjs:285`](../../../scripts/update-engine.mjs), and `syncBaseTree` only at
        **line 340**: on the first update of any brain installed before S1, **the tree does not exist
        yet when the refresh runs**. Every skill would have fallen to `preserve` — *including untouched
        ones that must fast-forward* — so **the engine would have stopped refreshing skills across the
        whole fleet, on the very release that exists to unfreeze them.**
    - [x] **The fix is a separation, not a patch**: the base's **bytes** are needed only to MERGE. The
          recorded **sha** alone answers the two questions that come first — *did the owner touch it?*
          and *did the engine ship anything new?* So a brain with no tree degrades exactly to today's
          behaviour (fast-forward when untouched, preserve + `.new` when customized) instead of
          freezing, and it gains the merge at its **second** update, once the tree exists.
    - [x] **One predicate answers all three questions**, so there is no second definition to keep in
          step: `verifyBase({ recorded, baseContent: X })` asked of the installed file, of the
          candidate, and of the base itself. `planBaseSeed` already uses it that way.

  - [x] **The verdict table — the test list for S2a, nine rows.** Inputs: `I` = installed bytes,
        `C` = the candidate the update would deliver, `recorded` = the provenance sha, `B` = the base
        tree's bytes (which may not exist). "untouched" = `I` matches `recorded`; "engine stood still" =
        `C` matches `recorded`. All comparisons EOL-normalised, as `refreshVerdict` already did.

        | # | state | verdict | writes to the file | sidecar | in `deliveredFileMap` |
        |---|---|---|---|---|---|
        | 1 | `I` absent | `absent-install` | `C` | — | yes |
        | 2 | no `recorded`, `I === C` | `unchanged` (`no-base`) | — | — | no |
        | 3 | no `recorded`, `I ≠ C` | `preserve` (`no-provenance`) | — | ⚠️ **now `C`** — see below | no |
        | 4 | untouched, `I === C` | `unchanged` | — | — | no |
        | 5 | untouched, `I ≠ C` | `refresh` (fast-forward) | `C` | — | yes |
        | 6 | edited, engine stood still | `unchanged` (`owner-edit-stands`) | — | — | no |
        | 7 | edited, engine moved, **`B` unusable** | `preserve` (`customized`) | — | `C` | no |
        | 8 | edited, engine moved, `B` usable, merge clean | `merge` | the merged bytes | — | **yes, with `C`** |
        | 9 | edited, engine moved, `B` usable, conflict | `conflict` | — (owner's copy stands) | marked merge | **no** |

    > ⚠️ **ROW 3 HAS MOVED SINCE THIS PLAN WAS ARCHIVED — 2026-08-21, S10-1 of
    > [`../prospective/v5-unfreezes-the-existing-fleet-action.md`](../prospective/v5-unfreezes-the-existing-fleet-action.md),
    > which OWNS that behaviour now.** A `no-provenance` preserve emits the candidate as a **sidecar**,
    > where this table says it emits none. The reasoning written here was sound and its premise stopped
    > holding: the table's *"no sidecar"* rested on there being nothing useful to say about a file
    > nobody can prove, and S10 gives it something to say — the sidecar is what the next conversation
    > can ASK the owner about. **This row is left standing as the record of what was built**; do not
    > hand-synchronise it further, and do not read it as current behaviour. Everything else in the
    > table is unchanged.

    - [x] **Row 7 is the fleet's first update, and it is today's behaviour exactly** — preserve the
          owner's file, offer the engine's version beside it. It is the row that makes this release
          safe to ship to brains that have never held an ancestor.

    - [x] **Rows 2 and 6 are defects being fixed, not new behaviour.** Today `refreshVerdict` returns
          `preserve: no-provenance` **before** testing equality (row 2: a brain outside the regime
          holding the engine's exact bytes is reported "preserved"), and returns `preserve: customized`
          with a `.new` sidecar whenever the owner edited — **even when the engine shipped nothing new**
          (row 6), dropping a sidecar byte-identical to the base at every single update. Pure noise,
          removed by construction.
    - [x] **Row 9 never writes the installed file.** A conflict is the one case that costs a human
          anything, and the engine's answer to it is to keep its hands off and say so.
    - [x] **`.new` narrows its meaning, and gains value**: from *"you customized this"* to **"this one
          needs your hand"**, and its content stops being the bare candidate — it becomes the
          **conflict-marked three-way merge**, so everything that could be merged already is and only
          the clashing region is left to decide. Nothing loads a `.new`, so markers are harmless there.
    - [x] **Fast paths must agree with the merge.** Rows 4, 5 and 6 are what a real three-way merge
          would return anyway; keeping them explicit is an optimisation, so each one is triangulated
          against the merge's own output rather than trusted.

  - [x] **Module boundaries** (so the mutation score keeps meaning something):
    - [x] `scripts/lib/engine-merge.mjs` — **pure**: the table above, plus the merge *decision*. Takes
          the merge function as an argument. This is the file the mutation run judges.
    - [x] `scripts/lib/engine-merge-git.mjs` — the **only** impure part: temp files + `spawnSync`, exit
          code → `{ clean, merged, conflicts }`. One seam, one owner, mirroring how `engine-base.mjs`
          and `engine-base-fs.mjs` already split.
    - [x] `refreshVerdict` is **superseded by `mergeVerdict`** and its tests move with it — not kept
          side by side. Its home also stops being `engine-skill-refresh.mjs`: the verdict now serves
          skills **and** scripts (S2b) and later the constitution, so it is no longer a skill's business.

  - [ ] **S2a — the merge core and its first client (the skills).** Cut into three on contact, because
        one slice that writes a pure core, spawns git **and** rewires the refresher is a mis-cut slice
        by this chantier's own rule:
    - [x] **S2a-1 — the verdict table, pure** _(2026-08-20 · `acabcc8`)_ — `scripts/lib/engine-merge.mjs`.
          Eleven cases red on their assertions first (a skeleton module, so the red was never a loading
          error), **100 % mutation, 47 killed, no survivor** _(number owned by
          [`RESULTS.md` § S2's merge core](../../mutation/RESULTS.md#s2s-merge-core--engine-mergemjs-the-verdict-table--2026-08-20))_.
      - [x] **Decided while building it, and it is the part a later reader must not undo**: a verdict
            carries **`write`** and **`deliver`** as two separate fields. They differ on exactly one
            row, so folding them back into one would look like a simplification and would be the
            clobber-the-owner bug returning by the front door.
      - [x] The merge arrives as an **injected function** — the module stays pure, git stays next door,
            and the mutation score keeps judging the decision instead of a subprocess.
    - [x] **S2a-2 — the git seam** _(2026-08-20 · `de19cd9` + `ead71d0`)_ — `engine-merge-git.mjs`.
          13 cases red on their assertions first, against **real git** (a subprocess contract proven by
          a stub proves nothing). **75 % → 100 %** on the mutation run _(number owned by
          [`RESULTS.md` § S2's git seam](../../mutation/RESULTS.md#s2s-git-seam--engine-merge-gitmjs-the-merges-one-impure-half--2026-08-20))_.
      - [x] **The request is a VALUE** (`buildMergeFileInvocation`, CONVENTIONS.md §5ter) — the
            discipline suite caught it being composed inline, and the rule earned its keep on the
            spot: the **argument order is the ours/theirs contract**, and as a value it is asserted
            whole instead of being read back out of marker lines.
      - [x] **All three sides are normalised to LF before they reach git.** Left as they are, a Windows
            brain holding its file in CRLF sees every line changed on both sides: every merge a total
            conflict, the whole fleet handed sidecars for whitespace.
      - [x] **A git that cannot run THROWS**, never returns a conflict. A false conflict tells the owner
            they have work to do **and** holds the base back, so the file would quietly leave the update
            regime. ⚠️ **S2a-3 owes the other half**: catch it and degrade to `preserve`, so one
            hiccup on one skill cannot take down a whole update.
    - [x] **S2a-3 — the skills rewired onto it** _(2026-08-20 · `d7867fd` + `2ec18a5` + `5dc470b`)_ —
          `refreshUntouchedSkills` drops `refreshVerdict` for `mergeVerdict`. **The merge now reaches a
          real brain**: the owner's edit and the engine's update both land, and only a real clash still
          costs anyone anything. 10 cases, real fs and **real git**, **98 % → 100 %** _(number owned by
          [`RESULTS.md` § S2's rewiring](../../mutation/RESULTS.md#s2s-rewiring--engine-skill-refreshmjs-where-the-merge-reaches-a-real-brain--2026-08-20))_.
      - [x] **The ancestor is read by this module itself**, from `.engine-base/<rel>` — it already holds
            `brainDir` and already reads the disk, so **no caller signature changed**. A brain with no
            tree reads `null`, which is `verifyBase`'s `absent`, and the verdict degrades to today's
            behaviour.
      - [x] **The trap is pinned at its only real call site**: `refreshedFileMap` carries `deliver`, and
            a conflicted file is absent from it.
      - [x] **A throw from the git seam costs ONE skill its merge**, not the whole update: the owner's
            file is never the casualty of a broken tool. Reason `merge-failed`, sidecar offered.
      - [x] `refreshVerdict` is **gone**, not kept beside its replacement; its cases live in
            `engine-merge.test.mjs` as the table's own rows.
    - [x] **S2a-3b — the report says it out loud** _(2026-08-21 · `ecd8d6c`)_ — `skillsMerged` and
          `conflicts` were produced and then dropped: `reconcileBrain` destructured three fields and
          returned three. Three sentences now, saying different things on purpose (the merge is the
          news; `merge-failed` is said apart, because *"could not be merged this time"* is not *"there
          was nothing to merge from"*; the clash is the loudest and the last, being the only one that
          asks the owner for anything). **98.95 %** on the whole file, 3 pre-existing survivors, none in
          this slice's code _(named in
          [`RESULTS.md` § S2's report](../../mutation/RESULTS.md#s2s-report--update-enginemjs-where-the-merge-stops-being-silent--2026-08-21))_.
      - [x] **A merged skill arms the restart nudge**, exactly as a refreshed one does: the file the
            next session loads is not the file this one loaded. Left out, the whole merge path would
            take effect at some later restart nobody asked for.
      - [x] The *"everything-on update prints every optional line"* test did not know the two new ones.
            **A test name that lies is a defect**, so it carries them now.
      - [ ] ⚠️ **Wording**: these three sentences are user-facing. The tone is Thomas's at release time
            (`release-notes-tone`); what is committed is factual and neutral, not final.
  - [x] **S2b — the four engine scripts stop being overwritten blind** _(complete 2026-08-21, S2b-1 →
        S2b-4: `3395e1a` · `211cfc5` · `6ba4348` · `8b90fc8` · `1d1bc3c`)_. `auto-commit`, `auto-push`,
        `status-line`, `verify-rag` were declared `merge` and applied `replace` (`computeApplyPlan` put
        them in `replaceScripts`) — the mirror image of the skills' bug, and the one that could destroy an
        owner's edit **today**. It no longer can: they are delivered by the merge, their output is parsed
        before it is written, and the report says which of the three things happened to each.

    - [x] 🧭 **THE DESIGN — written before a line of test** _(2026-08-21)_. Same reason as S2a's: a
          design held in a window dies at the next compaction, and S2a proved that a re-readable
          paragraph is what catches the defect a green test never would.

    - [x] 🛑 **THE FIRST THING THE DESIGN FOUND IS THAT THIS PLAN WAS WRONG.** Every earlier note here
          (and the header comment of `engine-apply-plan.mjs`, and the title of its test) warned that
          `update-engine.mjs` **matches `ENGINE_SCRIPT` and must keep replacing itself**. It does match
          the regex — but the regex is applied to `regimes.merge`, and **`scripts/update-engine.mjs` has
          never been declared `merge`**. Swept: **all 48 revisions of `engine-manifest.json`, zero**
          declare it there; it sits in `regimes.replace` (line 23), so it reaches a brain through
          `overwrite`, and the shipped `replaceScripts` bucket has always held **exactly the four
          scripts** — the four this slice removes from it.
      - [x] **Consequence for the code**: there is **no split to make**. The bucket is not "the engine
            scripts including the self-updater", it is *"the merge-declared top-level scripts"*, and once
            those go through the merge it is **empty on every manifest that exists**. So it is renamed
            (`replaceScripts` → `mergeScripts`), it leaves `copyGlobs`, and it stays inside
            `planTouches` — the engine still writes those files, just no longer blind.
      - [x] **Consequence for the prose**: three artefacts assert the false claim and must stop —
            `engine-apply-plan.mjs`'s header comment (lines 7–8), the test title at
            `engine-apply-plan.test.mjs:31`, and the note at `:42` ("self-update → MUST be present"),
            which is true of that **synthetic fixture** and of nothing the product ships. A comment that
            lies is a defect, exactly like a test name that lies.
      - [x] **What must not change**: the self-update path itself. `update-engine.mjs` keeps arriving by
            copy through `overwrite`, and `planTouches(shippedPlan, "scripts/update-engine.mjs")` stays
            true — pinned already by `engine-apply-plan.test.mjs:148`.

    - [x] ⚠️ **The risk that is NEW here, and that the skills never carried: these four files are
          EXECUTED.** `auto-commit.mjs` runs at every Stop hook, `status-line.mjs` at every prompt. A
          broken `SKILL.md` degrades an answer; a broken `auto-commit.mjs` **silently stops committing
          the brain**, which is the product's whole promise. Row 9 already forbids writing on a conflict,
          so markers can never land — but a *clean* line-based merge of two valid edits can still produce
          bytes that parse to nothing valid, and those bytes **exist nowhere but that one machine**: no
          engine test ever ran them.
      - [x] **Decision — the merge output is syntax-gated before it is written**, and only the merge
            output. A fast-forward (row 5) writes the engine's own candidate, which the suite already
            tested; the gate exists for bytes the engine has never seen. A failed gate degrades to
            `preserve` with reason `merge-unsafe` and the sidecar — the owner's working script stands.
      - [x] **The alternative was named and rejected**: accept the risk, on the grounds that today's
            behaviour destroys the edit outright and is therefore worse. It is worse in one way and
            better in another — today's overwrite always leaves a **working** script — and "we made your
            brain stop saving itself" is not a trade this chantier gets to make silently.
      - [x] **Measured 2026-08-21, node v25.6.0** (the repo requires `>=22`): `node --check
            --input-type=module -` reads the candidate **on stdin** and exits `0` clean / `1` on a parse
            failure — verified on conflict markers, on a truncated function, and on a duplicate `export
            const`. No temp file, so the gate is simpler than `mergeWithGit`. ⚠️ **Its honest limit**: it
            catches SYNTAX, not sense — `require("fs")` inside an `.mjs` passes. And per CONVENTIONS.md
            §5ter the request is a **value** (`buildSyntaxCheckInvocation`), handed to a thin runner, in
            its own impure module beside `engine-merge-git.mjs`.
      - [x] **A gate that cannot run degrades like a git that cannot run** — `preserve`, never a false
            "unsafe" and never a write. That is what makes the node-version question non-fatal by
            construction rather than by measurement.

    - [x] **Module boundaries** (so each mutation run keeps judging one thing):
      - [x] `scripts/lib/engine-merge-apply.mjs` — **new, group-agnostic**: the per-file loop that
            `refreshUntouchedSkills` holds today (read candidate → read installed → read ancestor →
            `mergeVerdict` → clear the stale sidecar → write → record `deliver` → drop the sidecar →
            classify). It takes the (installed ← source) **pairs**, a `groupOf(rel)` for the report, and
            the optional `verifyWrite` gate. Skills and scripts then differ only in what they hand it.
      - [x] `scripts/lib/engine-script-check.mjs` — the syntax gate's one impure half.
      - [x] **The report entries' key becomes `name`, not `skill`.** Three clients are coming (skills,
            scripts, and the constitution at S2c) and in two of them `skill` is simply false. Blast
            radius measured: `formatReport`'s two loops (`update-engine.mjs:160` and `:171`) and the
            fixtures that feed them. `skillsRefreshed` / `skillsMerged` stay arrays of plain strings.
      - [x] **The self-heal guard is unchanged and shared**: `sourceDir === brainDir` returns an empty
            report. Today `copyInto` skips a self-copy, so the four scripts are untouched at self-heal;
            with the merge behind the same guard they stay untouched. No behaviour moves.
      - [x] **The locale resolution stays in the shared core**, where it is a no-op for the four scripts
            (the only locale-owned engine file is `scripts/lib/demo-locale.mjs`, which is `replace` and
            not top-level). One code path beats one branch.

    - [x] **S2b-1 — the refresher generalises, no behaviour change** _(2026-08-21 · `3395e1a` +
          `211cfc5`)_ — `engine-merge-apply.mjs` extracted, `refreshUntouchedSkills` reduced to which
          files are eligible and how they are grouped, `skill` → `name` through `formatReport` and its
          fixtures. **100 % on both files, first pass, no survivor** _(numbers owned by
          [`RESULTS.md` § S2b's extraction](../../mutation/RESULTS.md#s2bs-extraction--engine-merge-applymjs-the-merges-journey-to-the-disk--2026-08-21))_.
      - [x] **The proof it changed nothing is the mutant COUNT.** S2a-3 measured 113 mutants in
            `engine-skill-refresh.mjs`; the same code now measures **86 + 28 = 114** across the two
            files. Moved code conserves its mutants — copied code would have inflated the total, lost
            code would have shrunk it. One number, and it answers *"is this a refactor?"* without
            reading a diff. Six of the ten skill tests also stayed green untouched.
      - [x] **The rename found a test it had already weakened**: a
            `.filter((p) => p.skill === "switch")` that, left alone, would have gone on passing against
            `[]` for ever. A predicate on a renamed field does not fail, it goes quiet.
      - [x] **Two defects the extraction laid bare, fixed rather than left**: the header of
            `engine-skill-refresh.mjs` still claimed a *"PURE decision core, no fs, no side effects"*
            (untrue since S2a-3), and `mergeWithGit` had become the default of `merge` in **two**
            modules at once — the `gitBin` lesson, one owner per default.
      - [x] 🛑 **A flaky test was not just blocking a measurement, it had been INFLATING the corpus**
            _(`211cfc5`)_: the merge's *"nothing is left behind"* sweep read the **shared** system temp
            dir, so it saw every other process mid-merge. Under Stryker's **`command`** runner a mutant
            is killed when the suite exits non-zero, so a random failure is indistinguishable from a
            detection, and **the error only ever goes upward**. Measured: **6 of 8** concurrent suite
            runs failed with the old test, **0 of 8** with the fix.
        - [x] `update-engine.mjs` re-measured **98.95 % → 97.54 %**; the four extra survivors are not a
              regression but holes the noise was masking — **three more `readFileSync` encoding mutants,
              i.e. three more lines the suite walks past**, now folded into S2b-4's debt below.
        - [x] **Four files re-measured, two figures wrong and two not.** This slice's own two came back
              **identical** (100 % / 100 %), so S2b-1's numbers were not bought with noise; but S2a-2's
              git seam fell **100 % → 98.18 %** — the module that carried the flaky test is the one its
              own noise flattered into an unearned perfect mark. Its single survivor is an equivalent,
              named rather than fake-killed (`force: true` on the cleanup `rmSync`: unobservable from
              the suite, load-bearing against an external temp sweeper). Every affected section of
              `RESULTS.md` carries the mark.
        - [x] `mergeWithGit` takes its temp root as a seam now; the test hands it a private one and
              asserts it EMPTY first, so a passing sweep means the merges cleaned up rather than that
              the directory was never theirs.
    - [x] **S2b-2 — the syntax gate** _(2026-08-21 · `6ba4348`)_ — `engine-script-check.mjs` against a
          **real** `node --check --input-type=module -`, plus the carrier's `verifyWrite` seam and the
          `merge-unsafe` degradation. Skills pass no gate, so they are untouched, and that default is
          asserted rather than assumed. **100 % on both files, first pass, no survivor** _(numbers owned
          by [`RESULTS.md` § S2b's syntax gate](../../mutation/RESULTS.md#s2bs-syntax-gate--engine-script-checkmjs-on-bytes-that-exist-nowhere-else--2026-08-21))_ —
          and the carrier went **86 → 106 mutants** for four lines of gate, every one of them killed.
      - [x] **The exit-code contract was measured, not assumed**: `0` parses, `1` does not, and
            **every other code means node itself is unhappy** (an unknown flag exits `9`). Read as a
            verdict a `9` would condemn a good file for ever, so anything outside `{0, 1}` **throws** —
            the same shape, and the same reason, as the git seam's failures.
      - [x] **`merge-unsafe` and `merge-failed` stay separate.** One says the merged file would not have
            parsed; the other says the tool could not answer. Folded together, the engine accuses the
            owner of breaking something it has no evidence they broke, and sends them hunting through a
            file that is fine.
      - [x] **The report gained its sentence in the SAME slice**: a verdict nobody can hear is a defect,
            and shipping the gate without one would have S2b-3 preserving an owner's script in silence.
            ⚠️ That sentence still says *"skill"* — a **known lie, pinned as a failing expectation**
            until S2b-3 gives the scripts their own wording.
      - [x] **The gate runs under the brain's OWN node** (`process.execPath`), not whatever is first on
            `PATH`: a brain on an older interpreter would otherwise be told its files are fine by a
            parser it never runs.
      - [x] **A test filter caught being too loose, again**: a bare `startsWith("   • ")` also matches
            the standard report's furniture. Same defect as the one S2a-3b already paid for — the
            sibling test's predicate is the one to copy.
    - [x] **S2b-3 — the switch, and it was ONE commit** _(2026-08-21 · `8b90fc8`, then three test-only
          commits paying what its mutation runs found)_. The bucket renamed and left `copyGlobs`,
          `engine-script-refresh.mjs` was wired into `reconcileBrain`, and the report gained its
          sentences — **all in the same commit**, so the branch never held a state in which the four
          scripts were delivered by nobody. **100 % first pass on the new module** _(numbers owned by
          [`RESULTS.md` § S2b's switch](../../mutation/RESULTS.md#s2bs-switch--the-four-engine-scripts-leave-the-copy-bucket--2026-08-21))_.
      - [x] The report sentences are the skills' three, said about a file instead of a skill —
            **factored into one helper parameterised by the noun**, because the promise is one promise.
            The conflict sentence names no noun, so both families share it whole, and **every** conflict
            lands last rather than beside its own family. Wording is Thomas's at release time
            (`release-notes-tone`), like S2a-3b's.
      - [x] ⚠️ **The regression the slice nearly shipped in silence: the swapped-file COUNT.** The four
            scripts used to arrive in `copied`, so a brain nobody customized would have read *"4 fewer
            engine file(s) swapped"* while exactly as many files changed. `scriptsRefreshed` folds into
            the count and arms `needsRestart` — a fast-forwarded script needs no line of its own, it has
            always been a swapped engine file.
      - [x] **The restart BANNER was asking its own question**, a near-copy of `needsRestart`
            (`copied || regenerated || skillsRefreshed`) that **had already drifted**: a merged skill
            armed the persistent nudge and printed no banner. S2b-3 would have drifted it further, so the
            banner now asks `needsRestart` itself. Two questions with one meaning is one of them going
            stale.
      - [x] 🛑 **Three fixtures declared `scripts/update-engine.mjs` under `merge`** — the same false
            fact the design caught in this plan, still alive in `reconcile-brain.test.mjs`,
            `restart-convergence.test.mjs` and `update-engine.test.mjs`. Corrected at the source rather
            than worked around; the self-updater now sits in `replace` in every fixture, as it does on
            every shipped manifest.
      - [x] **A fixture that recorded a provenance base for ONE engine script out of four.** Harmless
            while they were copied blind; since the switch it made the gate test assert a fast-forward
            the merge is right to refuse (verdict row 3). A real brain is fingerprinted over the whole
            `merge` regime at install **and re-seeded at every update** — the four scripts were in
            `copied`, so they were in `deliveredFileMap` — so **a script with no recorded base is a state
            the fleet does not hold**. Verified before changing the fixture rather than assumed.
      - [x] **`restart-convergence.test.mjs` keeps `mergeScripts` in its copy list, deliberately**: that
            function simulates the **v3.1.0 orchestrator's own code**, which copied the four scripts
            blind. A comment says so, or the next reader "fixes" it into agreement with the new
            reconciler and the migration test stops modelling the migration.
      - [x] **What the bucket is FOR, now that it copies nothing**: `planTouches`, the never-touch
            oracle. The engine still writes those four files, it just no longer writes them blind — so
            they must stay inside the allowlist, and `computeApplyPlan` still emits them.
      - [x] 🛑 **The write-allowlist had never been mutation-measured** — `engine-apply-plan.mjs`, the
            one pure function standing between a fetched manifest and an owner's files, came back at
            **78 %**. Three of the eleven survivors were real safety holes, and they are paid rather than
            noted: both anchors of `ENGINE_SCRIPT` (without `^`, helper code shipped inside a staged
            skill becomes an engine script; without `$`, so does the engine's own `.new` sidecar), the
            leading anchor of `ENGINE_SKILL` (**`installSkills` is the one bucket the scrub does not
            filter**, so a manifest declaring `vault/.claude/skills/smuggled/**` would have the engine
            install-if-absent into the owner's vault), a manifest with **no `regimes` at all**, and the
            sacred TREES named bare (`.claude/skills`) or claimed wholesale (`vault/**`). **78 % → 92 %**,
            the four remaining survivors named equivalents in `RESULTS.md`.
    - [x] **S2b-4 — the named debt, paid on the final shape** _(2026-08-21 · `1d1bc3c`, 98.65 %)_. The
          `deliveredFileMap` line at `update-engine.mjs:411` read back every **copied** file's bytes, and
          two mutants survived it (an invalid encoding AND one emptying the whole entry). That map feeds
          `reseedProvenance` and `syncBaseTree`. **Deliberately last**: pinning it before S2b-3 would pin
          a `copied` list that S2b-3 then changes, so the test would be rewritten by the slice it was
          meant to guard.
      - [x] 🛑 **The diagnosis this plan carried was WRONG, and the slice's first job was to correct it.**
            "Never executed under test" did not follow from the survivors. `readFileSync(p, "")` returns a
            **Buffer** (the empty encoding is falsy, so `assertEncoding` accepts it) and `JSON.parse`
            decodes it identically — the encoding mutant is an **equivalent**, on that line and on every
            other. Measured instead of argued: a `throw` on the same line turns **18 tests red**. The line
            was on the suite's hot path all along.
      - [x] ✅ **Paid by DELETION, not by a test** — and that was the honest fix. The real defect was the
            *other* mutant, `copied.map((rel) => [])`: emptying the entries changes nothing, because both
            consumers filter their candidates through the `merge` regime and a `replace`-copied file
            reaches neither. The pass had a job until S2b-3 (the four scripts were in `copied`, and this
            is how their base advanced), and `runReconcileCli` — the last writer on the update path —
            never did it at all. **A line whose effect no test can see is sometimes a line nothing should
            see.**
      - [x] `runUpdateCli`'s `argv = process.argv.slice(2)` default: killed by a test that calls it with
            no arguments.
      - [x] **Ends at 98.65 %** (293 killed, **4 survived, all equivalents**): two `readFileSync(…,
            "utf8") → ""`, and two `preserved = ["Stryker was here"]` defaults that `PRESERVED_ASIDE`
            silently skips — a garbage default is inert **by construction** there, which is the property
            that block was written to have.
      - [x] **The debt grew by three when the instrument was fixed** _(2026-08-21)_ — same shape, same
            cause, so they are paid together: `:279` (the local manifest read on the update path) and
            `:465` (the brain's recorded `source`) were two more `readFileSync(…, "utf8")` mutants that
            survive an invalid encoding, and `runUpdateCli`'s `argv = process.argv.slice(2)` default is
            exercised by no test that omits `argv`.
      - [x] ✅ **And S2b-3 paid two of them in passing, without setting out to** _(2026-08-21,
            98.34 %)_. `:465` and the `releases: []` duplication both died to the fixtures that slice
            tightened. **What is left is three lines** in the file that carries the whole update:
            `:339` (the local manifest read), `:411` (the `copied` readback) and the `argv` default —
            plus the `skillsPreserved` equivalent, which is named rather than killed.
      - [x] **The duplication that made a dead field possible** _(2026-08-21)_: `runUpdateCli`'s
            "unknown"-report literal hand-rolled a second copy of the shape `checkUpstream`'s own
            `unknown()` helper already builds. Extracted as `unknownUpstream()` in
            `lib/engine-update-check.mjs`; both call sites now go through it, so the shape has one author.
            *(This item was written into the plan twice, in two adjacent bullets saying the same thing —
            deduplicated here rather than ticked twice.)*

    - [x] **Deliberately OUT of S2b** — named so the slice does not grow:
      - [x] **Semantic validation of a merged script** (running it, linting it, type-checking it). The
            gate parses; judging whether a merged `auto-commit.mjs` still *behaves* is a different
            product, and the honest answer to it is the conflict report, not a cleverer check.
      - [x] **`scripts/lib/**`** — declared `replace`, and it stays there. It is engine internals, not
            a file an owner is invited to edit; making it merge-governed would offer a promise nobody
            asked for.
  - [x] **S2c — the scrub is reformulated: never written *blind*.** ✅ _(2026-08-21 · `856ad24`,
        mutation **92.73 %**, 4 survivors all previously-characterised equivalents)_ `SACRED` splits in
        two, and the words matter because this is the invariant ADR 0003/0012 is built on:
    - [x] **Inviolable, and it stays that way**: `.env` (secrets), `vault/` (the owner's notes — the
          product's whole promise), and every skill the manifest does **not** declare.
    - [x] **Merge-governed**: `.claude/settings.json` and `CLAUDE.md` — writable only through a
          three-way merge from a **provable** base, never by copy, never on conflict. **It IS S3's
          `OWNER_AUTHORED`, imported**, and a test pins the two by REFERENCE — two lists that agree
          today disagree the day one is edited.
    - [x] **ADR 0038**, amending 0012 (`Scope:` field, and an entry in `maintainers/README.md`'s ADR
          list). 0012's own two stale lines — written before the constitution split in two, still
          calling `CLAUDE.md` *the* engine-provided constitution — are corrected in the same pass, as
          this plan said whichever slice landed first would do.
    - [x] ⚠️ **A door named is not a door open**, and one test exists whose only job is to stop the
          rename being read as a green light. Behaviour is byte-for-byte unchanged: nothing in this
          release delivers either file.
    - [x] ✅ **UNBLOCKED 2026-08-21** — the arbitration box at the top is answered: **yes**, the
          constitution is merge-governed. Read that box before writing the ADR, it carries the argument
          (and the honest limit: no deployed brain can merge `CLAUDE.md` yet, for want of an ancestor).
    - [x] `.claude/settings.json` is **deliberately not a text merge**: the engine already writes it
          surgically today (hook entries, status line, via `reconcileBrain`), which is the better
          mechanism for a JSON file whose two sides both append to the same arrays. S2c's job on it is
          to say so out loud, not to replace it with a line-based diff.

  - [x] **S2d — the conflict report names its door** ✅ _(2026-08-21 · `c1ec660`, mutation **99.44 %**,
        all 13 new mutants killed)_. A conflict ended at *"yours is untouched, a merged copy is at
        &lt;path&gt;"*: true, and a cul-de-sac. It now ends at *"ask me and I'll walk you through them"*.
    - [x] It is **prose, therefore the deliverable** (S3's measured lesson) — the sentence is asserted
          as a **literal**, never sampled and never re-imported from the module: `out.includes(CONST)`
          passes just as happily when `CONST` is emptied.
    - [x] It does not promise a flow that does not exist: the offer is what the brain can do **today**
          (read both sides, say in words what each changed), not the assisted walkthrough.
    - [x] **ONCE for the whole block**, counting every family, and **nothing at all** when there is no
          clash. Repeated under each one it would be the consent fatigue the follow-on chantier's own
          non-negotiables forbid; printed under every clean update it would mean nothing by the third.
    - [x] **Not alarmist**: their version stands and their brain works, so the register is *"nothing is
          urgent"*, not a call to action (§11 tone).
    - [x] ⚠️ **The whole-report golden test is where the ORDER got pinned** — the three focused tests
          were green on wording while the placement was still unjudged.

  - [x] **Deliberately OUT of S2** — named so no slice quietly grows:
    - [x] **Markdown-aware merging.** Line-based only, on the measurement above (blank lines already
          give section granularity). The trigger to revisit is a **measured** conflict rate, replayed
          against real deployed-brain content — not an intuition.
    - [x] **The 9 staged skills** (`consolidate`, `file-back`, `lint`, `local-mirror`,
          `mcp-token-expired`, `open-note`, `rag`, `univers`, `universe`) stay unmergeable: no `merge`
          glob names their installed path, so they have no provenance and S1 seeds them no base. **A
          merge with no ancestor is not a merge** — widening the manifest to bring them in is a scope
          call and belongs to the release's cargo discussion, not to S2's code.
    - [x] **Seeding a base for a no-record file that holds the engine's exact bytes** (row 2). Cheap and
          correct, but it is S1's planner's business — noted here so it is not lost, not done here.
          ✅ **CLOSED elsewhere, 2026-08-21**: absorbed by **S7** of
          [`../prospective/v5-unfreezes-the-existing-fleet-action.md`](../prospective/v5-unfreezes-the-existing-fleet-action.md)
          — row 2 is the special case where the version recognized is the one being delivered, so the
          historical fingerprint table answers it with no code of its own. Ticked here so this archive
          stops advertising an open exclusion it no longer owns; **the design and its test case live
          there**, not in this file.
    - [x] Interactive conflict resolution. An update **never** prompts: it writes, or it reports. ⚠️
          **Qualified, not contradicted, by the owner's 2026-08-21 answer** (box at the top): assisted
          resolution IS coming, as its own chantier, but it lives **outside** `update-engine.mjs` — the
          update runs in a non-interactive child where no conversation can happen. What S2 excludes is
          prompting *from the update*; what the follow-on chantier adds is a separate on-demand flow the
          report points at. **S2d**, in this release, is only that pointer sentence.
    - [x] The audible divergence report (S4), the write guard (S3), `CLAUDE.engine.md`'s regime (S5).
- [x] **S3 — Keep the owner's intent out of engine files, by construction** _(complete 2026-08-21, S3-0 →
      S3-3: `177c572` · `4bf5efa` · `b82569e` · `cf55c2a` · `3493533`)_. **One thing is deliberately left
      open and it is not code**: the UX measurement below, which needs a real brain and a few days, not a
      test. A write guard on
      engine-owned paths that redirects to the layer built for it (`CLAUDE.md`, the owner's own skills)
      and asks before letting an edit land in an engine file. Precedent and shape:
      `scripts/vault-write-guard.mjs`. **This is the half that makes the whole model honest**: divergence
      stops being free and silent, so preserving it stops being the hard problem.

  - [x] 🧭 **THE DESIGN — written before a line of test** _(2026-08-21)_. Same reason as S2a's and
        S2b's, and both paid for themselves: the design is where the plan's own wrong facts surface.
        This one found **three**, listed as they come.

  - [x] 🛑 **WHAT THIS GUARD CAN AND CANNOT SEE — say it before promising anything.** A `PreToolUse`
        hook only ever sees **tool calls**. So the guard governs **what Claude writes**, and nothing
        else. It does **not** see the owner editing `scripts/auto-commit.mjs` in VS Code or Obsidian,
        and it does **not** see the engine's own writes (`update-engine`, `reconcileBrain` and the
        merge all write through `fs`, never through a tool) — which is also why it needs **no
        self-exemption**, a carve-out that would otherwise be the first thing to get wrong. The slice's
        title has to shrink to what the mechanism delivers: **an agent no longer diverges a brain from
        its engine without the owner being asked.** The rest of the promise is S4's (divergence becomes
        audible) and the merge's (divergence survives an update).

  - [x] 🎯 **THE VERDICT IS THREE-WAY, and the regimes ALONE cannot produce it** — the design's first
        finding, and the one that would have shipped a wrong guard. The obvious rule ("engine-owned ⇒
        ask") reads the manifest and lands on `CLAUDE.md` and `.claude/settings.json`, which are in the
        **`merge`** regime — i.e. the guard would interrupt the owner on the two files it exists to
        **redirect them to**. Regime is the wrong axis. The axis is *who the file was written for*:
    - [x] **`allow`, silently — the owner's surface.** Everything in **no regime at all** (the vault,
          `.env`, a skill the owner wrote) falls out for free, plus exactly **two** engine-owned
          exceptions: **`CLAUDE.md`** and **`.claude/settings.json`**. Those two are engine-owned *and*
          owner-authored; being asked before writing them would be the guard fighting the product.
    - [x] **`ask`, with the price named — engine internals under a regime.** `scripts/**`, `rag/**`,
          `local-mirror/**`, `shared/**`, `engine-skills/**`, the launchers, and the engine skills under
          `.claude/skills/`. The sentence differs by regime because **the price differs**: under
          `merge`, *"your edit will be kept, and every future update will three-way-merge this file
          forever"*; under `replace` / `regenerate`, *"the next update overwrites this, without a word"*.
          That second sentence is the whole point of the slice.
    - [x] **`deny` — `.engine-base/**`, and only it.** The recorded ancestor is the one write with **no
          correct version**: editing it does not diverge the brain, it **forges the provenance**, turning
          a real divergence into a fast-forward that destroys the owner's edit at the next update, in
          silence, with the base itself as the evidence that nothing was wrong. Same doctrine as
          `vault-write-guard`: **deny is reserved for the write that cannot be meant.**
    - [x] ⚖️ **`replace` is `ask`, not `deny`, and that is a decision.** An edit there is *always* lost,
          so denying it is tempting — and wrong: an owner unbreaking their own brain right now has a
          legitimate reason the guard cannot see. **The guard's job is to make the cost visible at the
          moment of the gesture, never to make the choice.**

  - [x] 🔗 **The two-file exception is S2c's list, read from the other side** — so it is **one constant,
        not two**. S2c splits `SACRED` into *inviolable* and *merge-governed*, and the merge-governed
        half is exactly `CLAUDE.md` + `.claude/settings.json`. S3 needs the same pair to answer *"may
        the AGENT write this without asking?"*; S2c needs it to answer *"may the ENGINE write this at
        all?"*. Two directions of one boundary. **S3 defines the constant and S2c reuses it** — and
        because the two questions are independent, **S3 does not wait on the arbitration**: whichever
        way Thomas answers *"may the engine write `CLAUDE.md`"*, the owner may.

  - [x] 🪤 **THE WIRING TRAP, found by reading `hooks-reconcile.mjs` and worth the whole design slice.**
        The reflex is to add the new hook as a second entry inside the existing
        `PreToolUse` / `Write|Edit` group next to `vault-write-guard`. **It would never reach a single
        deployed brain.** `reconcileHooks` identifies a template group by
        `(group.hooks ?? []).map(hookScript).find(Boolean)` — its **first** script — and skips the group
        when that script is already wired. The group's first script would be `vault-write-guard.mjs`,
        present in every brain since v4.5, so the group is skipped whole and the second hook is silently
        dropped. **The guard must be its OWN group**: a second `{ matcher: "Write|Edit", hooks: [ … ] }`
        object in the `PreToolUse` array.
    - [x] 📌 **And that is a latent defect in the reconciler, not just an S3 inconvenience**: *a template
          hook group can only ever deliver its FIRST script.* S3 works **with** the constraint (one
          script per group, which is also how every existing group is shaped) and records the finding
          here rather than widening the reconciler mid-slice. Cost of getting it wrong: nothing throws,
          nothing is reported, the feature simply does not exist on the fleet.
    - [x] ✅ **Delivery is otherwise free, and this is the good news**: `reconcileHooks` compares a brain
          against **`.claude/settings.json.template`**, which is in the `replace` regime. Adding the
          group to the template is therefore the entire distribution mechanism — every existing brain
          self-heals the hook in at its next update or SessionStart (ADR 0026), with **no migration to
          write**.

  - [x] 🧱 **The shape, per CONVENTIONS §5ter and the entry-point seam rule** — a straight copy of the
        precedent's split, because it is the shape the fleet already runs:
    - [x] **S3-1 — `scripts/lib/engine-write-guard.mjs`, pure** _(2026-08-21 · `4bf5efa` + `b82569e`,
          **90 % → 98.89 %**, 24 tests, suite 1994 pass / 0 fail)_. `guardDecision({ toolName, filePath,
          brainDir, manifest })` → `{ decision: "allow" | "ask" | "deny", reason }`, the three-way verdict
          exactly as designed. Glob matching reuses `globToRegExp` from `lib/glob-match.mjs` (the same
          primitive `selectMergeFiles` and `computeApplyPlan` answer with) — **no second glob dialect in
          the product**. Measured by
          [`RESULTS.md` § S3's write guard](../../mutation/RESULTS.md#s3s-write-guard--the-pure-verdict-and-prose-as-a-deliverable--2026-08-21).
      - [x] **The regime lookup order is fixed, and it is not the manifest's key order**: `local`,
            `replace`, `regenerate`, `merge`. A path can be claimed twice (`scripts/lib/**` under
            `replace` while one file inside it is named under `merge`), and the owner must be told the
            **worst** that can happen to their edit, not whichever glob was declared first.
      - [x] 🎯 **The mutation run's verdict was about the PROSE, and it was right.** Six of nine first-pass
            survivors emptied one clause each out of the reason strings while every `assert.match` stayed
            green. Those four sentences are what an owner reads before deciding whether to diverge their
            brain — **they are the deliverable** — so they are pinned whole now, and changing one costs a
            deliberate test edit.
      - [x] ⚠️ **A DEFAULT PARAMETER IN A TEST HELPER SUBSTITUTES THE VALUE UNDER TEST.**
            `decide = (rel, manifest = MANIFEST)`, looped over `[null, undefined, {}, …]` to prove
            fail-open, re-injected the real manifest on the `undefined` pass and asserted the opposite of
            its own title. Third variant of this shape on this branch. Fixed with a second, default-free
            helper.
      - [x] **The one survivor is a named equivalent** (`regimes[regime] ?? ["Stryker was here"]` builds
            a glob matching only that literal), same family as the ones already listed in `RESULTS.md`.
    - [x] **S3-2 — `scripts/engine-write-guard.mjs`, the entry and its wiring** _(2026-08-21 · `cf55c2a`
          + `3493533`, **88 %**, 3 survivors all equivalents, suite 2008 pass / 0 fail)_. Stdin JSON,
          `runAsEntrypoint`, `emit`, **always exit 0**, and tested by **running it as a process** — twice:
          once for an `ask` on stdout, once proving a write it does not judge prints **nothing** (an
          empty stdout is the silent path; a payload saying "allow" would not be).
      - [x] 🪤 **The trap was stepped around, and TWO tests now make stepping into it loud.** The guard
            has its **own** `PreToolUse` group in `.claude/settings.json.template`. One test pins
            `reconcileHooks`'s output for a pre-v4.5 brain — both groups created, both named in
            `hooksAdded` — and one refuses **any** template group wiring more than one script. Pack the
            two guards together and both go red instead of the feature silently not existing.
      - [x] 🔴 **A test went red for the right reason and changed the production code.** The manifest read
            now has its **own** `catch` inside `runGuard`: routed to the outer catch-all, an unreadable
            manifest would abort the whole verdict — **including the `.engine-base` deny**, i.e. the one
            refusal that must survive the file it protects. Written after the test for it failed, not
            before.
      - [x] 📉 **The score went DOWN when the code got better, and that is correct.** A first-pass
            survivor was the `catch` body emptied, and it survived because it was **dead**: `manifest` is
            initialised to `null`, so a throwing read never completed the assignment. Deleting it
            (S2b-4's answer again) removed a mutant from the denominator without removing a kill:
            23/26 → 22/25. **A mutation score is a ratio, and simplifying prod moves both ends.**
    - [x] **FAIL-OPEN, with one anchored exception** — built and asserted end to end. No manifest, an
          unreadable one, an unexpected payload → allow. The `.engine-base/**` deny is anchored on the
          **path prefix**, not on the manifest, so it survives a manifest the guard could not read.
    - [x] Both files joined the manifest's **`replace`** regime — and the repo's existing manifest-integrity
          guards *required* it before the suite would go green, which is the belt working unprompted.
      - [x] ✅ **The launcher is unaffected, verified rather than assumed**: this repo has no tracked
            `.claude/settings.json` (it is `.gitignore`d, only the template is tracked), so no maintainer
            editing engine files here meets the prompt. Out by construction, exactly as the design said.

  - [x] 🔍 **S3-0 — the `"ask"` dialect is REAL, and the check paid for a second answer**
        _(2026-08-21)_. `vault-write-guard` only ever emits `"deny"`, so nothing in this repo proved the
        harness honours anything else, and no unit test can. Read out of the **shipped client's own
        binary** (`claude 2.1.220`, `strings` on `bin/claude.exe`) rather than from memory or docs:
    - [x] **The contract, verbatim from the client's hook documentation**: `permissionDecision` —
          *"allow", "deny", or "ask" (PreToolUse only)*, with `permissionDecisionReason` beside it. The
          dispatcher's own `default:` branch **throws** `Unknown hook permissionDecision type: … Valid
          types are: allow, deny, ask, defer`. So `"ask"` is supported **and** the guard must never emit
          anything outside that set: a typo there is not ignored, it breaks the hook.
    - [x] **The reason survives**: `hookPermissionDecisionReason = e.hookSpecificOutput
          .permissionDecisionReason` (with the legacy top-level `e.reason` accepted too), attached
          whenever a behaviour was decided — so the sentence reaches the permission layer on `ask`, not
          only on `deny`.
    - [x] 🎁 **The unasked-for answer, and it settles a question the design had left open:
          MOST-RESTRICTIVE WINS.** Combining several hooks' verdicts reads
          `case "ask": if (B !== "deny" && B !== "defer") B = "ask"`. A `deny` from any hook therefore
          beats an `ask` from another, and neither can weaken the other. **The new guard sitting beside
          `vault-write-guard` is safe in both directions** — which the design had flagged as *"to verify
          in the field, not to assume"*.
    - [x] `"defer"` exists but is **print-mode only** (*"returned permissionDecision=defer in
          interactive mode; ignoring"*). Not ours.
    - [x] ⚠️ **The honest limit of this check**: it proves what the client *installed here* does. A brain
          runs whatever Claude Code its owner has. That is not a reason to hedge the design — `"ask"` is
          in the documented set, and the fail-open doctrine already covers a client that refuses it.

  - [ ] ⚠️ **THE ONE S3 ITEM STILL OPEN, and it is a field measurement, not code**: the engine skills are
        in `merge`, so a session that legitimately customizes `coach` or `improve` meets the prompt. That
        is *correct* the first time and noise the tenth. **Measure it on the real brain before adding any
        cleverness** — the escape hatch already exists (`/permissions`) and costs the owner one gesture.
        Nothing downstream waits on this: it can only be answered by living with the guard for a few days
        once this release is on a brain, so it is carried to the **release checklist**, not to a slice.

  - [x] 📜 **S3-3 — ADR 0012 AMENDED, no new ADR opened** _(2026-08-21)_. CONVENTIONS §6bis: one ADR per
        topic. 0012 owns the write boundary between launcher and brain and stated only the engine→brain
        direction (the structural write-allowlist); it now carries **§5, the same boundary read
        backwards**. A new `0038` would have split one topic in two, and S2c amends this same ADR next.
    - [x] Written **timeless** (§6ter): no dates, no hashes, no "we first did X" — the reader discovering
          the project gets one decision, not its autobiography.
    - [x] **Crux line added** (§6quater) and **prior art named** (§6quinquies): a **protected-path gate**
          (CODEOWNERS, pre-commit protected paths) — the file is not locked, the change is made
          deliberate. It sits beside the ADR's existing dpkg/rpm *managed-file-set* framing, which is the
          same family read the other way.
    - [x] **Three rejected alternatives recorded**, because each was a real fork: refusing every engine
          write instead of asking (an owner unbreaking their brain has a reason the guard cannot see);
          deriving the verdict from the regimes (it lands on `CLAUDE.md`); and making the base read-only
          on disk (it would block the engine, which rewrites the base at every upgrade, and would not
          survive a clone or a sync to a second machine).
    - [x] `maintainers/README.md`'s ADR index updated in the same pass — the index is a **summary**, so a
          new decision section that never reaches it is a decision nobody browsing will find.

  - [x] 🚫 **Deliberately OUT of S3**, named so the slice does not grow: guarding the **launcher** repo
        (maintainers edit engine files all day; the guard reaches brains only through
        `settings.json.template`, which the launcher never applies to itself — it is out by
        construction, not by exemption); guarding non-tool writes (`Bash` heredocs, an external editor);
        and **reporting** existing divergence, which is S4 and needs the base tree, not a hook.
- [x] **S4 — Divergence becomes audible.** A brain says, once, which engine files it is holding back and
      how far behind they are. Absorbs the silent-skill-freeze plan's third defect. _(complete 2026-08-21
      — every design and exclusion box below **re-verified against the code**, not against this plan's own
      prose, and all nineteen held. The contrast with S1, whose same audit found two false claims, is the
      argument for the audit and not for trusting the sections that pass it.)_

  - [x] 🧭 **THE DESIGN — written before a line of test** _(2026-08-21)_. Third time, and the two before
        it both found a defect a green test could not have. This one found four, plus the fact that the
        obvious surface is disqualified by an ADR.

  - [x] 🔗 **This slice OWNS the third defect of
        [`field-finding-2026-08-05-silent-skill-freeze.md`](field-finding-2026-08-05-silent-skill-freeze.md)**
        (*"Step 3 — make the freeze audible (the real subject)"*). That plan states the requirement and
        this one holds the state: a preserved file must say **since when** it has been kept and **which
        engine version** it diverges from, and it must say it *where a freeze is visible over time*, not
        only in an update report the owner reads once. Its Step 2 (`knownBases`, healing an
        already-frozen fleet) is **not** absorbed — see the exclusions.

  - [x] 🎯 **THE FINDING THAT SHAPES THE SLICE: "which" is free, "how far behind" is not recorded
        anywhere.**
    - [x] **WHICH files are held back needs no new state and no network.** A `merge`-regime file whose
          disk digest differs from `provenance[rel]` is, by definition, one the owner edited and the
          engine is holding back — the same question row 7 of the verdict table answers at update time,
          asked at rest. Exact, offline, two file reads plus ~20 digests.
    - [x] **HOW FAR BEHIND has no source today.** The base tree holds the last-delivered *bytes*; nothing
          holds the *version* they came from. Saying "three releases behind" would be inventing a number.
    - [x] ➡️ **So record it, in the one place that already carries per-brain engine state**: a
          `baseRefs: { rel: ref }` map in `engine-manifest.json`, beside `provenance`, written by the same
          pass that advances the base. It means one unambiguous thing — *the last engine version whose
          bytes this file actually received* — so it needs **no state machine**, unlike a "first became
          held back" stamp that would have to know when to stop moving. Additive and absent-tolerant: an
          older brain simply says "since your install" and loses nothing.
    - [x] **Then the sentence is concrete and offline**: *"your `coach` skill still carries your edits —
          it last received an engine version at v4.7.0, and this brain now runs v5.0.0."* No release
          count, no fetch: **name the two versions and let the owner read the distance.** A count would
          need the release list, i.e. a network call, for a number the two versions already convey.

  - [x] 🛑 **THE SURFACE IS DECIDED BY [ADR 0036](../../decisions/0036-deterministic-channels-differ-by-surface.md)'s
        CHANNEL MATRIX, NOT BY REFLEX** — and the reflex answer is wrong twice over:
    - [x] **`statusLine` is disqualified.** It is **opt-in since v4.4.0** (ADR 0036 — the brain no longer
          installs it), *and* the Code tab renders **nothing** for it. A divergence notice there would
          reach almost no one, and no one at all on Desktop.
    - [x] **A SessionStart `systemMessage` is dropped by the Code tab too.** The banner shape every other
          health hook uses is CLI-only.
    - [x] ✅ **So the notice rides `additionalContext`** (the agent's own context → it reaches the chat,
          the only channel that renders on both surfaces), **with `systemMessage` kept beside it** for the
          CLI, exactly as `session-self-heal.mjs` already documents. And this is not a workaround: it is
          the *right* shape for this fact, see the nagging rule below.

  - [x] ⚖️ **A HELD-BACK FILE IS A LEGITIMATE STEADY STATE, so S4 must state and never nag.** The owner
        may keep their fork for years; a banner repeating it every session is a banner they learn to
        skip, and the alarm voice is reserved for breakage (`session-health.mjs`) — mixing the two is the
        failure `session-obsidian-hint.mjs` was split out to avoid. Riding `additionalContext` answers
        this exactly: **the agent holds the fact every session and mentions it when it matters**, which is
        the "says, once" the plan asked for, without a marker file recording what has already been said.

  - [x] 🔇 **THE SILENCE TO RE-OPEN IS A REAL LINE, and it is findable**: `PRESERVED_ASIDE` in
        `update-engine.mjs` has no `no-provenance` key, so `preservedAndMergedLines` hits
        `aside === undefined` and **`continue`s** — a preserved file the engine cannot prove anything
        about produces no line at all. That is the deliberate silence the field finding names, and S4 is
        where it is re-opened: *"we cannot prove anything about this file"* is information the owner
        needs. *(It is also why a mutation survivor on that block is equivalent: a garbage default is
        swallowed by the very guard this slice is about to change.)*

  - [x] 🧱 **The sub-slices**, smallest reviewable units, each test-first:
    - [x] **S4-1 — `baseRefs` is recorded when the base advances.** _(2026-08-21 · `df983c7`)_
          `reseedBaseRefs` sits beside `reseedProvenance` in `engine-source.mjs`, under the **same merge
          regime gate** (a `replace` file is overwritten whole and carries no base, so a ref on it would
          describe nothing), and is called by the **same three writers** as the digest: install stamps
          every merge file at the version being installed, `update-engine` step 7 stamps what it
          re-delivered at the ref it just pulled, and the reconcile child does the same from the brain's
          own `source.ref` — because on the first update carrying this feature the parent runs the OLD
          code, so the child is the last writer that can save the migrating brains.
      - [x] **No usable ref records NOTHING**, never `null`. An absent entry already means *unknown*;
            a recorded `null` would make an unknown look like an answer, and every reader downstream
            would have to learn that it is not one. That case is a test before it is a line of code.
      - [x] **Absent-tolerant on read**: an older brain with no `baseRefs` key at all starts one on its
            next update rather than crashing, and a file the update passed by **keeps its older ref**,
            which is the entire point of the map.
      - [x] **Measured** — `lib/engine-source.mjs` **93.02 % → 96.61 %** on the first pass, no kill round
            needed, both survivors pre-listed equivalents. The two wiring sites are covered by tests that
            assert the **whole** map after a real update; not re-measured file-wide, and
            [said so in writing](../../mutation/RESULTS.md#s4-1--the-base-learns-which-version-delivered-it--2026-08-21)
            rather than left as an implied omission.
    - [x] **S4-2 — the pure divergence module.** _(2026-08-21 · `f247db3` + `d315525`)_
          `engineDivergence({ manifest, installedFileMap })` in its own file, returning
          `{ rel, reason, since }` **sorted by path**. Pure and offline: the manifest is the record, the
          disk is the disk, and no release count is computed (that needs a fetch for a number the two
          version names already convey).
      - [x] **It asks `verifyBase` the seeding question of the INSTALLED file** rather than defining
            "unchanged" a second time — so the EOL normalization comes with it, without which every
            Windows brain would be told it is holding back every engine file. The answer's vocabulary is
            `engine-base.mjs`'s own (`customized` / `no-provenance`), now exported: a file the seeder
            defers and a file the report names must be the same file.
      - [x] **Candidates are what is on DISK, never the union with the record** — the one deliberate
            asymmetry with `planBaseSeed`. A recorded file the owner deleted is not held back, it is on
            its way back at the next install-if-absent. Pinned by a test, not left implicit.
      - [x] **Measured** — **78.95 % → 94.74 %**, the single survivor an equivalent the production
            comment had already predicted. **Two of the four first-pass survivors were the TESTS'**: a
            sort fixture that mirrored its own expectation (so a no-op comparator passed by reversing
            the array) and an unread manifest never fed. Both
            [written up](../../mutation/RESULTS.md#s4-2--the-divergence-module-and-two-survivors-that-were-the-tests--2026-08-21),
            the first as a durable rule about testing orderings.
    - [x] **S4-3 — the update report.** _(2026-08-21 · `d171e90`)_ Both silences ended, code committed
          and pushed, **full suite green (2031 pass, 0 fail)**.
      - [x] **The `no-provenance` silence is re-opened.** It gets its OWN sentence, not an entry in
            `PRESERVED_ASIDE`, because that map's sentence opens with *"your customized"* — the one claim
            this verdict cannot make, and the false claim that once sent an owner diffing a file nobody
            had edited. It names no sidecar: that verdict writes none. ⚠️ **Superseded 2026-08-21 by
            S10-1** (see the row-3 note under the verdict table): the verdict now DOES write one, and
            the sentence names it. The owning plan is `../prospective/v5-unfreezes-the-existing-fleet-action.md`.
      - [x] **The standing recap** — `where your brain stands now, running <ref>: N engine file(s) this
            update leaves alone`, each with the version it last received. Deliberately a RECAP that
            **repeats** a file named above rather than subtracting it: the subtraction needs a join
            between skill names and paths that nothing records, and the recap carries what the event
            lines cannot (the versions).
      - [x] **Read LAST, off the brain as it now is** (`readEngineDivergence` in `engine-base-fs.mjs`) —
            the finalize child rewrites the manifest after step 7, so a divergence computed earlier
            would describe a brain that existed halfway through the update. Fail-soft like steps 8 and 9.
      - [x] **Measured, first pass: `scripts/update-engine.mjs` at 98.50 %** _(329 killed, 5 survived,
            on `d171e90`)_ — up from the honest pre-slice **97.54 %**.
      - [x] **One survivor was masking two more, and deleting it was the fix** _(2026-08-21 ·
            `69b17c9`)_. The `aside === undefined → continue` guard existed for `no-provenance`, which
            now has its own sentence, so nothing the producer can emit reaches it. Worse than dead:
            what it would do to a verdict reason added later is **drop the line in silence**, the very
            defect this slice ends. With it gone, the two `skillsPreserved = []` / `scriptsPreserved =
            []` default mutants reach the prose and fail the byte-for-byte tests instead of being
            swallowed on the way out. The two left are the `readFileSync(…, "utf8") → ""` equivalents.
      - [x] **Confirmed after the deletion: `scripts/update-engine.mjs` at 99.40 %** — 329 killed, 2
            survived, both the `readFileSync(…, "utf8")` equivalents. Same kill count as before the
            deletion: the ratio improved by removing code, not by adding tests.
      - [x] **`lib/engine-base-fs.mjs`, never measured before, 89.58 % → 95.65 %** _(`2fbd811` +
            `c11c684`)_. **Three of its five survivors were the fail-soft this slice had just written
            and never fed**: no test handed `readEngineDivergence` an unreadable manifest, which is
            exactly the branch that keeps a recorded, successful update from becoming a thrown error.
            Fed with both shapes; the `seeded` sort was killed by a fixture where the directory walk
            disagrees with path order (mutant **hand-applied** to confirm the test judges it); and the
            early `return []` was deleted, because the pure module already answers "nothing to say" for
            a null manifest. **Third fail-soft written twice in this release** — the rule is now in
            [`RESULTS.md`](../../mutation/RESULTS.md#s4-3--the-report-stops-being-silent-and-a-guard-that-would-have-re-silenced-it--2026-08-21).
    - [x] **S4-4 — the session surface.** `additionalContext` + `systemMessage`, in its own soft hook
          rather than folded into the breakage banner. **Measure the added SessionStart latency** before
          shipping it: the contract for these hooks is zero-ish, and this one is file reads and digests
          with no spawn and no network — but "should be fast" is not a measurement.
      - [x] 🧭 **Cut in two, on S3's own precedent** (*the guard decides* / *the guard reaches a brain*),
            because one slice that writes prose, spawns a hook, edits the template AND the manifest is
            this chantier's own definition of mis-cut:
        - [x] **S4-4a — the surface decides what to say.** _(2026-08-21 · `ea9a4c1`)_ The pure nudge +
              the entry script, **full suite green (2053 pass, 0 fail)**. Two defects were found by
              things other than its own tests, and both are worth keeping:
          - [x] 🔇 **The F5 guard condemned the prose before it shipped, and the design box above was
                wrong.** That box said "cap at 5 named files" on the reasoning that `additionalContext`
                only ever speaks to the **agent**, which then picks its moment. It does not:
                `startup-payload-guard.test.mjs` carries the field measurement that the **CLI echoes it
                VERBATIM to the owner**, prefixed `SessionStart:startup says:`, before they have typed a
                word. So the draft was ~990 characters of file paths at every session start — **the exact
                banner S4 forbids, arriving through the channel that looked innocent**. Shipped instead:
                **one sentence, one file named with its clause, the rest a count**, and the payload
                length asserted (520, with the launcher's real **490** written into the test as the
                measurement rather than a guessed ceiling).
          - [x] 🔌 **Running it as a process found a dead channel.** `systemMessage` was nested **inside**
                `hookSpecificOutput`, where the client does not read it: valid JSON, silent CLI, and a
                test asserting the same wrong shape it had been written against. `deepEqual` on the
                **whole** envelope is what turns that into a red test — sampling the keys would not have.
                ➡️ The entry-point seam rule earned its keep again: no unit test on this module could
                have caught it.
          - [x] 🪜 **Two ratchets fired and both were right**, so they were obeyed rather than raised: the
                entry uses the canonical `runAsEntrypoint` tail (not a hand-rolled guard copied from an
                older hook), and the F5 audit's pinned emitter list learns its eighth entry.
          - [x] 📏 **Measured, first pass: `engine-divergence-nudge.mjs` at 100 %** (46 killed, 0
                survived). The entry script and the one-word export on `engine-version.mjs` got **no
                pass** — wiring and a keyword — and the skip is
                [said in writing](../../mutation/RESULTS.md#s4-4a--the-session-surface-and-a-defect-no-mutant-could-have-found--2026-08-21),
                where the run's real lesson also lives: **the dead channel above was invisible to
                mutation by construction**, because the tests and the code agreed with each other and it
                was the *client* that disagreed.
          - [x] 🔗 **The move landed as designed**: `DIVERGENCE_LINE` + the closing sentence left
                `update-engine.mjs` for the shared lib, and that file's byte-for-byte prose tests are
                **untouched and green** — which is the proof it was a move. `installRef` is exported from
                `engine-version.mjs` for the same one-owner reason.
        - [x] **S4-4b — the surface reaches a brain.** _(2026-08-21 · `9dc9d5d`)_ Its own SessionStart
              group in `.claude/settings.json.template` (**wired LAST**: breakage, a pending restart and
              the version/update line all outrank a file the owner chose to keep), its explicit
              `replace` line in the manifest, both driven by red tests. ✅ **S3-2's trap needed no new
              test**: the guard it left behind scans **every group of every event** for a second script,
              so it covered this hook for free — a lesson that became repo-wide instead of per-hook.
          - [x] ⏱️ **THE LATENCY IS MEASURED, and the measurement contradicted the design box above.**
                Median of 12 runs each: a bare node process **30 ms**, the hook **50 ms** → **~20 ms of
                its own work** on the launcher's tree. Against a 20 000 ms hook timeout that is nothing,
                **but the shape is wrong**: the design box called this *"two file reads plus ~20
                digests"*, and it is in fact a **full recursive walk of the whole brain**
                (`readInstalledMergeFiles` → `listFilesRelPosix(brainDir)`), then a filter.
          - [x] 📉 **How it scales, measured rather than feared**: the walk is ~2.3 µs per file —
                **3.7 ms / 500 notes, 7.3 ms / 2 000, 18.5 ms / 8 000**. So the hook's cost follows the
                size of the owner's VAULT, and a large brain pays tens of milliseconds at every single
                session start.
          - [x] 🎯 **And it is entirely avoidable — the walk reads what it can never need.** Checked
                against the manifest: **not one `merge` glob reaches into `vault/`** (they are
                `CLAUDE.md`, `.claude/settings.json`, nine `.claude/skills/*/**`, four `scripts/*.mjs`).
                The hook walks every note the owner has ever written in order to look at files that are
                never among them.
          - [x] 🚫 **No mutation pass, and the skip is said in writing**: S4-4b changed two JSON files
                and added two tests. Wiring-only, per CONVENTIONS.md 5quinquies — there is no new
                behaviour for a mutant to survive in.
          - [x] ⚖️ **Shipped anyway, deliberately, and the reason is written here rather than left to
                look like an oversight**: it is an inefficiency, not a defect — the surface is correct,
                fail-open and far inside its timeout. The fix touches `readInstalledMergeFiles`, which
                the **update path** shares, so it earns its own slice with its own tests rather than
                riding a delivery slice.
        - [x] **S4-4c — the walk stops reading the vault.** _(2026-08-21 · `a3f4e2b`)_ `globRoots` lives
              in `glob-match.mjs`, the module that already owns the glob dialect, and returns each
              glob's leading run of wildcard-free segments. **Full suite green (2068 pass, 0 fail).**
          - [x] 📊 **The judge the plan set was met**: the scan is **flat at ~0.25 ms** whether the vault
                holds **0, 2 000 or 8 000 notes** — it no longer tracks note count at all, where the walk
                alone cost **18.5 ms** at 8 000. The hook's own work went **20 ms → 10 ms** on the
                launcher's tree (same 12× median method as the measurement that opened the slice).
          - [x] ✅ **The shared caller was the risk and it was answered with a test, not an argument**:
                the equivalence against a full walk is pinned **on a real disk**, and asserted **whole**
                so that "both return nothing" cannot pass for agreement. Every existing
                `syncBaseTree` / update-report test stayed green untouched.
          - [x] 🔬 **The behavioural proof is a vault the process cannot enter** (`chmod 000`): the old
                shape throws `EACCES`, the new one never looks. Skipped on Windows and as root, where it
                would prove nothing. _(Its own trap, worth keeping: the permission is restored in a
                `finally`, not a `t.after` — `brain()` registers its `rmSync` first and after-hooks run
                in registration order, so the cleanup would hit a directory it still cannot enter and
                fail on `ENOTEMPTY` with the assertion green.)_
          - [x] 🧭 **Two answers kept deliberately apart**, because conflating them is the bug this would
                otherwise have been: `[]` means **walk nothing** (no globs, so nothing can match) and
                `[""]` means **walk everything** (a glob starts with a wildcard, so there is no prefix
                and honesty costs a full walk). Subsumption is on **segment boundaries** —
                `.claude/skills` may never swallow `.claude/skillsets`.
          - [x] 📏 **Measured, and the run earned its keep three times over**: `glob-match.mjs` 94 % →
                **100 %** (and with **eight fewer mutants** — the ratio rose by deleting code),
                `engine-base-fs.mjs` 91.80 % → **94.74 %**, three survivors left, all named equivalents.
                **Not one of the six survivors was a missing test**: two globs rooting at the same
                directory were returned twice (that subtree walked twice, the slice's own waste
                reintroduced), a manifest that parses with no `regimes` would have **thrown** through a
                fail-soft, and one branch was dead because `join(brainDir, "")` is `brainDir`. Full
                write-up, and the lesson about survivors whose value dies in a downstream filter, in
                [`RESULTS.md`](../../mutation/RESULTS.md#s4-4c--the-walk-that-read-the-vault-and-three-survivors-that-were-three-real-defects--2026-08-21).
          - [x] ⚠️ **A test was wrong before the code was** — the one case where fail-first did not run
                first, and it is recorded rather than smoothed over: the implementation was written in
                the same breath as the tests, and the single red that came back was a **fixture stating
                the wrong expectation** (`scripts/*.mjs` roots at `scripts`, which subsumes the two
                named files beside it). No harm done here, and the mutation pass is what stood in for
                the missing red — but the slip is the interesting part, not the fix.
      - [x] 🧱 **The module split** follows the house shape every other session hook uses
            (`session-wiki-health.mjs` is the reference): a pure builder in `scripts/lib/`, an entry
            script whose `main` is declared deterministic glue and is not unit-tested, seams injected so
            the brain root is a plain string a test asserts on and never a temp dir.
      - [x] 🔗 **The per-file clause is MOVED, not copied.** `DIVERGENCE_LINE` currently lives private
            inside `update-engine.mjs`, and the session surface needs the exact same three sentences.
            Two copies of one sentence in two surfaces is a future divergence, so the map moves to the
            shared lib and the update report imports it. **The proof it was a move**: `update-engine`'s
            prose tests assert byte-for-byte and must stay green untouched, and its mutant count must
            drop by what the lib gains (S2b-1's method).
      - [x] ✂️ **What each surface keeps as its own**: the *framing* sentence. The update report says
            "where your brain stands now, running `<ref>`: N files this update leaves alone" (it speaks
            about a pass that just ran); the session surface speaks at rest and must not imply an update
            happened. Same clauses, different sentence around them.
      - [x] 🔢 **The ref comes from `engine-version.mjs`'s `installRef`, exported for the purpose** —
            it already calls itself *"the one reader of which engine point was this brain installed
            from, shared, so the two labels can never disagree"*. A second reader here would be the
            third. **And it stays a separate fact from `since`**: naming the version the brain runs is
            legitimate; filling an unknown `since` from it is the exact confusion `baseRefs` ended.
      - [x] 🔇 ~~**CAPPED at 5 named files**~~ — ⚠️ **this box was WRONG and the guard said so**; see
            S4-4a's finding below. The count stays exact and complete, but **one** file is named, not
            five, because the channel is echoed verbatim to the owner rather than held by the agent.
            The full list stays where it is already free: the update report.
      - [x] 🛟 **Fail-open, and it needs its OWN guard**: `readEngineDivergence` is fail-soft about an
            unreadable *manifest* only — `readInstalledMergeFiles` sits outside its `try`, so a brainDir
            that does not exist throws. On the update path that cannot happen; on a hook it can. The
            entry core catches, and a test hands it a thrower _(third time this release a fail-soft is
            written; the rule that it is not written without a test that feeds it is in `RESULTS.md`)_.

  - [x] 🚫 **Deliberately OUT of S4**, named so the slice does not grow:
    - [x] **Healing an already-frozen fleet** (the field finding's Step 2: ship every historical
          fingerprint so the engine recognises its own past output). S1's base tree makes it unnecessary
          for brains installed from this release on, and it is a release-time generation pipeline, not a
          report.
    - [x] **Counting releases** between the two versions. It needs the release list, i.e. a network call,
          for a distance the two version numbers already state.
    - [x] **Offering to adopt the newer version** from the notice. An update writes or reports; it never
          prompts (S2's own exclusion), and the same rule holds for a report.
- [x] **S5 — The doctrine layer joins a regime, as the first client of the new model.** _(complete
      2026-08-21 — `a51df22`, `74c273d`, `4340240`, `b3aefa3`; the header note carries what it does and
      does NOT unfreeze, and that caveat belongs in the release note.)_
      `CLAUDE.engine.md` is a special case worth stating: the two-layer design means the owner's edits
      belong in `CLAUDE.md`, so a divergence in the engine layer is nearly always **an accident to
      surface**, not work to protect. Flip `engine-apply-plan.test.mjs`'s deliberate lock with its
      comment rewritten, never deleted quietly.

  - [x] 🧭 **THE DESIGN — written before a line of code** _(2026-08-21, design slice)_. Same reason as
        S2's, S3's and S4's, and it paid the same way: **every claim below was checked in the code**,
        because the last two design boxes were written from memory and both were wrong.

  - [x] 🔴 **CORRECTION OF THIS VERY DESIGN, found by the code on the first line of S5's implementation**
        _(2026-08-21)_. The box below said *"ONE manifest line"* and it is **not false, it is
        insufficient**: on its own that line delivers **nothing at all**. `computeApplyPlan`
        (`engine-apply-plan.mjs:67-75`) does not carry `merge` as one bucket — it splits it through two
        **regexes**, `mergeScripts` (`^scripts/[^/]+\.mjs$`) and `installSkills`
        (`^\.claude/skills/[^/]+/`). `CLAUDE.engine.md` matches neither, so it would land in **no bucket**,
        `planTouches` would stay `false`, and the lock the slice exists to flip **would not even go red**.
        _(That is also why `.claude/settings.json` — `merge` since forever — reaches a brain through a
        hand-wired side channel in `reconcile-brain.mjs`, and `CLAUDE.md` reaches it not at all.)_
    - [x] **What it costs**: a **third merge family**, and the shape is already proven twice.
          `applyMergeGoverned` (`engine-merge-apply.mjs:29`) is family-agnostic and already locale-aware;
          `engine-script-refresh.mjs` is the 60-line template to copy. So the work is reuse, **no new
          decision** — the regime stays `merge`, every other box below stands.
    - [x] **The lesson, third instance**: the mode plan already carries *"grep the guards before writing a
          design box about a channel, not after"*. It was written after S4-4 and **not applied to S5's own
          box one iteration later** — because the box checked `verifyBase`, `planBaseSeed`,
          `resolveLocaleSource` and `SACRED_FILES`, and never checked the one function whose name is in
          the slice's own title. **Checking four things is what made the fifth feel checked.**

  - [x] 🎯 **THE REGIME IS `merge`, NOT `replace`** — and the argument is short. `replace` clobbers, and
        this whole release exists because *"what we must never lose is the work a person did"*. On the
        overwhelming case (a file nobody touched, since the product tells them not to) a three-way merge
        from a provable base is **byte-identical to a replace**, so the honest default costs nothing. On
        the rare edited file it **preserves and reports**, which is exactly "an accident to surface"
        rather than one to destroy. _(Three live plans named three different targets — `replace`,
        `merge`, replace-with-a-report. This box settles it; the other two are to be replaced by a link,
        not re-argued.)_

  - [x] ✅ **THE GATE-1 DEFERRAL IS EXPIRED, AND IT WAS VERIFIED RATHER THAN RECALLED.** The lock's own
        comment says propagation waits until the engine layer is *"locale-aware, or a FR brain would be
        re-anglicized on upgrade"*. That is **already true on the merge path**: `engine-merge-apply.mjs`
        reads the brain's locale (`readBrainLocale`, :47) and resolves `templates/<locale>/<rel>` for
        every file it delivers (`resolveLocaleSource`, :65). An FR brain gets the FR engine layer through
        the same code that already serves it the FR skills. **Choosing `merge` is therefore also what
        makes the locale answer free** — a `replace` would have had to grow one.

  - [x] 🛑 **THE FINDING, AND IT MUST REACH THE RELEASE NOTES: S5 ALONE UNFREEZES NOT ONE DEPLOYED
        BRAIN.** Traced through the code rather than assumed, and it is the opposite of what the slice's
        one-line description implies:
    - [x] The file was in **no regime**, so no `provenance` entry exists → `verifyBase` returns
          **`no-provenance`** (`engine-base.mjs:48`).
    - [x] `planBaseSeed` **defers** a no-provenance file, it does not seed it (`engine-base.mjs:95-101`)
          — deliberately, and rightly: seeding unproven bytes would record **the owner's** file as the
          engine's last delivery, and a later merge would then take "theirs" and destroy an edit in
          silence. That is the mirror image of the silent skill freeze.
    - [x] So the merge has **no ancestor**, the verdict preserves, and the report names it.
    - [x] ➡️ **What S5 actually delivers**: every brain installed from this release on is correct from
          day one, and every already-deployed brain **stops being silent** — S4's report and session
          surface now name the file and say *"no record of what the engine delivered there"*. The
          taxonomy's fourth category (*"never updated, and nobody decided that"*) becomes a **decided,
          reported** state. That is worth shipping. **Claiming the freeze is over would be false.**

  - [x] 🔗 **ONE ancestor machine now unblocks BOTH constitutions** — deduplicated here rather than
        tracked twice. S2c needs it for `CLAUDE.md`, S5 needs it for `CLAUDE.engine.md`, and it is the
        same follow-on chantier named in the box at the top of this plan. **The engine layer is its
        EASIER half**, worth recording while it is fresh: it ships **verbatim per locale with no
        per-brain rendering** (a test forbids `{{tokens}}` in it), so its historical fingerprints are
        computable **at release time** — the field finding's "known bases" step. `CLAUDE.md` has no such
        shortcut: its ancestor must be re-rendered from a template plus the install answers.

  - [x] 🪤 **The lock flip, precisely** — `scripts/lib/engine-apply-plan.test.mjs:224-240`. The comment
        is **rewritten, never deleted**: a test that said NEVER becomes a test that says HOW, and the
        record of why it once said never is the valuable half. ⚠️ **Two errors to fix in the same pass**:
        it says the work is deferred to **Gate 3** twice (:226, :231) where every other carrier says
        **Gate 4** (ROADMAP's Gate 3 is *Migration generate*) — so a reader chasing the deferral has been
        sent to the wrong gate since Gate 1.
    - [x] **`SACRED_FILES` does NOT need changing** (`engine-apply-plan.mjs:46`): `CLAUDE.engine.md` was
          never in it. The lock has always been enforced by **omission from the manifest**, and that test
          is the only thing that would have gone red. Worth knowing before touching the scrub by reflex.

  - [x] 📎 **ONE manifest line, not two.** `templates/fr/CLAUDE.engine.md` must **not** get its own entry:
        the manifest names the **destination** rel, and the locale source is resolved at delivery time
        (`templates/**` is excluded from the blind copy by `localeOwnedPaths`). A second line would be a
        second owner for one fact.

  - [x] 🔔 **A free behaviour change to NAME rather than discover**: S3's write guard returns `null` for
        a path in no regime (`engine-write-guard.mjs`, `regimeOf`), so it is **silent** on
        `CLAUDE.engine.md` today. The moment the file has a regime, the guard starts **asking** before an
        agent writes there, with the merge price named — which is the correct redirect (*your edits belong
        in `CLAUDE.md`*), and is exactly the kind of new prompt that belongs in the release notes instead
        of surprising someone.

  - [x] 📄 **The file's own sentence stays as it is, and the reasoning is recorded so it is not re-opened.**
        `CLAUDE.engine.md:5` promises *"refreshed by upgrades"* (echoed in `CLAUDE.md.template:11` and
        `README.md:309`) — a sentence that has been **false since it was written**. S5 makes it
        structurally true, and false in fact for already-deployed brains until the ancestor machine lands.
        **Decision: do not hedge it.** A brain that is behind is now **told so by name**, every session,
        with the version it last received — which is a better answer to a legacy brain than a weaker
        promise made to everyone. _(The counter, stated because it is real: for a few months the doctrine
        will keep saying "refreshed" to brains where it is not. The report is what makes that survivable,
        and if the ancestor machine slips, this box is where to come back and narrow the sentence.)_

  - [x] 🚫 **Deliberately OUT of S5**: **monolithic brains (~v3.2.x) that have no `CLAUDE.engine.md` at
        all.** They do not have the two-layer split, so there is nothing for a regime to refresh;
        retro-fitting them is its own migration and is already excluded above. And **ADR 0012's staleness**
        (:52, :77 still call `CLAUDE.md` *the* engine-provided constitution, written before the split) is
        **one amendment shared with S2c** — whichever lands first writes it, the second links to it.

  - [x] 🧱 **THE SLICES, in the only order that keeps every step green** _(split 2026-08-21, imposed by the
        correction box above)_. The manifest line comes **last** on purpose: until a family can carry the
        file, declaring it `merge` would be a manifest that promises a delivery no code performs.
    - [x] **S5a — the write-allowlist learns a third merge family.** ✅ _(2026-08-21 · `a51df22`)_
          `computeApplyPlan` grows `mergeDoctrine`, and `planTouches` counts it. The shipped plan stayed
          **unchanged** while the manifest is silent, so the lock stayed green through this slice, as
          designed. **Mutation 91.07 %** (51 killed, 5 survived) — measured here rather than at the end
          of the block because this file is the write allowlist and S5b/S5c do not touch it again. All
          five survivors are provable equivalents: the four `RESULTS.md` already named, plus the new
          bucket's own `?? ["Stryker was here"]`, discarded by the `.filter()` on the very next call.
          **The predicate is anchored at both ends and a test pins why**: one dot separates the engine's
          constitution from the owner's.
    - [x] **S5b — `engine-doctrine-refresh.mjs`, the family on the shared carrier.** ✅
          _(2026-08-21 · `74c273d`, **mutation 100 %**, 10 killed, 0 survived)_ 40 lines, because
          everything shared is shared. Deliberately thinner than its twin: **no syntax gate** (prose
          parses as nothing and runs as nothing; a gate would downgrade every merge to `merge-unsafe`
          and re-freeze the layer), `groupOf: (rel) => rel`. **The predicate is IMPORTED** from
          `engine-apply-plan.mjs` rather than re-declared — `ENGINE_SCRIPT` exists twice with a comment
          warning the two must agree, and one owner removes the warning instead of restating it.
      - [x] **Three tests now carry claims the release note will make**, so they are named here: a brain
            with **no provenance** keeps its constitution (preserved, reported, no sidecar, nothing
            delivered — that is the whole deployed fleet) ⚠️ *"no sidecar" superseded by S10-1,
            2026-08-21 — the preserve stands, the sidecar is now written beside it*; a brain already holding the right bytes
            appears on **no list at all** (or every future update shows a phantom forever); and a **FR
            brain receives `templates/fr/CLAUDE.engine.md`** from one manifest entry — the Gate-1 lock's
            condition is now a passing test rather than a reading of the code.
    - [x] **S5c — the delivery becomes real.** ✅ _(2026-08-21)_ Split in two on contact, because the
          report surface turned out to be four call sites in `update-engine.mjs` and not one:
      - [x] **S5c-1 — the wiring and the report.** ✅ _(`4340240`)_ `reconcile-brain.mjs` calls the family beside the
            scripts and folds its delivered map into the ONE map that re-seeds provenance; the four
            lists travel to `formatReport`, which folds them into the **"file"** family — same noun as
            a script, because a constitution is also a path the owner opens, and a third noun for one
            file is machinery for no gain. `needsRestart` gains both of its shapes: `CLAUDE.md`
            **@imports** the engine layer at conversation start, so doctrine that moved under a running
            session is exactly what the restart nudge is for. **Changes nothing for anyone while the
            manifest stays silent** — which is what makes it a safe slice.
        - [x] ✅ **Verified rather than assumed, before writing**: S4-3 already built the sentence this
              needs. `unprovableLine` says *"no record of the version the engine last delivered there,
              so we cannot tell your edits from ours"* and deliberately does NOT open with "your
              customized" — the one claim a `no-provenance` preserve cannot make. Its own comment
              already names the constitution as a future client. **Every deployed brain will emit that
              line for this file at every update**, so it had to be the true sentence, not the
              flattering one.
      - [x] **S5c-2 — the delivery goes live.** ✅ _(`b3aefa3`)_ The manifest line, and the lock flipped
            with its comment **rewritten** (and Gate 3 → Gate 4). It went red on the rewrite and green
            on the line, in that order. **Nothing else in the suite broke** (2 089 passing before and
            after), which is the evidence no other carrier had quietly come to depend on this file
            being in no regime at all.
        - [x] ✅ **The installer needs NO change, verified**: `recordSourceAndProvenance` builds
              provenance over `selectMergeFiles(manifest, <files in the brain>)`, so the one manifest
              line makes a fresh install record the file's fingerprint AND seed `.engine-base/` for it.
              A FR brain fingerprints the FR bytes it actually received. And nothing else delivers the
              file today — `copyGlobs` is `plan.overwrite` alone — so there is no double delivery.
      - [x] 📊 **Mutation, decided in writing rather than by reflex** ✅ _(2026-08-21)_: ONE pass at the
            END of S5c, on `reconcile-brain.mjs` (**96.30 %**) and `update-engine.mjs` (**99.41 %**).
            Both are on the WRITE PATH, so the rule's "large file changed by a few lines → skip" does
            **not** license a skip here; but measuring after each half would have re-judged ~470 mutants
            of untouched code for nothing. **No survivor is in the new lines.** The reconciler's score
            went DOWN (96.74 → 96.30) and it is not a regression: six survivors are the previous run's,
            line-shifted, and the extra one is `readFileSync(p, "")` — which does **not** throw, it
            returns a Buffer `JSON.parse` coerces, so the whole shape is a provable equivalent and the
            one that used to die was dying by accident. Numbers and the reasoning: `RESULTS.md`.
- [ ] **S6 — RIDER, decided 2026-08-15: deliver `test-first-discipline` and RETIRE `tdd-discipline`.**
      The skill is **already written and committed** (`.claude/skills/test-first-discipline/SKILL.md`),
      deliberately parked here rather than shipped alone, because retiring its predecessor needs
      exactly the power this release builds. Why it exists: v4.9.1 measured the relaxed mode and the
      old skill's opening rule (*one test at a time, never a test-first batch*) did not survive — and
      what was dropped is TDD's own thesis, not a ceremony, so the name had to change too (owner's
      call, both the decision and the name).
  - [x] 🧭 **THE DESIGN — written before a line of code** _(2026-08-21, design slice)_. Every claim
        below was read off the code, not recalled. The retirement is the undesigned half; everything
        else in S6 is mechanical once it exists.

    - [x] 🛑 **A REMOVAL IS DECLARED, NEVER INFERRED.** The tempting shape is "a skill in the brain that
          the TARGET manifest no longer declares is retired" — no new vocabulary, derived for free. It
          is refused: a truncated, stale or hand-broken manifest would then read as *"retire
          everything"*, and this whole repo is built on the opposite reflex (`computeApplyPlan` answers
          *"you may write nothing"* to a manifest it cannot read). **A delete is the most destructive
          write there is, so it must be the most explicitly named.** The manifest grows a
          **`retired: []` tombstone list**, a sibling of `regimes` — it does not say how a shipped file
          is updated, it says the engine **no longer ships it**.
    - [x] **It still reaches `computeApplyPlan`**, as its own `retireSkills` bucket counted by
          `planTouches`: a delete is a touch, and the never-touch oracle every guard test asks must not
          answer "we never write there" about a path we erase. **Unscrubbed, like `installSkills`** —
          the sacred `.claude/skills/` tree would otherwise empty it — so the pattern's own anchor is
          again its only defence, exactly as `ENGINE_SKILL`'s comment already records.
    - [x] 🔒 **Provenance-guarded, on ADR 0036's shape** (`status-line-retreat.mjs`, the engine's ONLY
          existing removal): remove the directory **only** if every file under it matches its recorded
          fingerprint **and** it holds no file the engine never delivered. Any doubt — no record, an
          edit, one extra file the owner dropped in — **preserves and says so**. The cost asymmetry is
          the argument, and it is the same one 0036 wrote down: a leftover skill is cosmetic, deleting
          someone's work is not.
    - [x] ⏱️ **Order: retire BEFORE the skills refresh**, or the engine spends an update carefully
          three-way-merging a skill it is about to delete.
    - [x] ✅ **No reinstall fight — verified, and it was the trap worth checking first.**
          `session-self-heal.mjs`'s `deriveWanted` builds the desired state from
          `computeApplyPlan(manifest).installSkills` read off the brain's **own, just-updated**
          manifest. So a skill dropped from `merge` is not wanted and self-heal will not put it back at
          the next session. ⚠️ **That only holds because the two edits are ONE manifest change**: drop
          the `merge` entry *and* add the tombstone. Doing only the second would have the update delete
          the directory and the next SessionStart restore it, forever.
    - [x] 🪦 **Tombstones accumulate, and pruning one early is a silent regression.** A brain upgrading
          from v4.x months from now must still hear that the skill is gone; the entry is what tells it.
          There is no expiry mechanism and this design deliberately adds none — the list is short, and
          the day it is not, the fix is a cohort decision, not a cleanup reflex.
    - [x] 🧹 **The launcher must stop SHIPPING it in the same breath**: delete
          `.claude/skills/tdd-discipline/` **and** `templates/fr/.claude/skills/tdd-discipline/`
          _(both present, checked)_. A source that still carries what the manifest calls retired would
          re-deliver it to every fresh install.
    - [x] 📄 **ADR 0039, amending [`0025`](../../decisions/0025-update-engine-installs-missing-engine-skills-and-servers.md)**:
          the additive engine surface gains **exactly one** subtractive door, declared and
          provenance-guarded. 0025 is install-if-absent by construction, so this is an amendment, not
          an implementation detail of it.
    - [x] 🗣️ **What the owner is told**, and it is not "a glob was removed": a skill that went says so
          by name with its replacement (*"the `tdd-discipline` skill has been retired — its successor
          `test-first-discipline` is installed"*); one that stayed says why, and that the engine no
          longer maintains it. Prose, therefore asserted whole.
    - [x] 🚫 **Deliberately OUT**: any general uninstall feature; removing anything that is not a
          declared, retired **skill directory**; and any removal of a file the owner may have authored.
          One door, one shape, named in one list.

  - [ ] 🧱 **THE SLICES** _(2026-08-21)_:
    - [x] **S6b — the retirement machinery** _(2026-08-21, `b2329c2`)_. `retireSkills` reads a
          `retired` list that is a **sibling of `regimes`**, filtered by `ENGINE_SKILL` and
          **unscrubbed** (the skills tree is inviolable, so a scrub would empty it silently) — and
          `planTouches` counts it, because a delete is a touch. A hostile fixture hands it `vault/**`,
          `.env`, `CLAUDE.md` and a bare `.claude/skills/**`, and one entry survives.
          `skill-retirement.mjs` decides **remove / preserve / absent** for one directory, asking
          `verifyBase` rather than comparing bytes — which is what forgives the LF→CRLF rewrite git
          performs by itself on a Windows clone. **Three** verdicts, not two: an absent directory is
          not a rescue. Mutation: **100 %** on the new module (26/26), 91.67 % on `engine-apply-plan`
          — five survivors, all pre-characterised equivalents, none in the new lines (see
          [RESULTS.md](../../mutation/RESULTS.md)). 2109 tests, 0 fail.
    - [x] **S6c — the delivery becomes real** _(2026-08-21, `15f3f4d` + `f46a42d` + `4c6a942`)_.
          `skill-retirement-fs.mjs` (the thin I/O), called FIRST of the skill steps with the brain's
          OWN provenance; the report's two sentences; the manifest's one change (drop the `merge`
          entry, add the tombstone, add `test-first-discipline`); both launcher copies deleted;
          SETUP.md's tooling table; **ADR 0039**.
      - [x] 🔴 **TWO restore paths the design never enumerated, found by the ORDER test failing** —
            and neither by reasoning about it. The reconcile's own **install-if-absent** puts the
            just-deleted directory back **in the same pass**; then the **skills refresh's
            absent-install** does it again, because it selects from the manifest and not from the
            plan. Fixed at the two right levels: a tombstone beats a regime in `computeApplyPlan`
            (`installSkills` subtracts it), and `selectMergeFiles` subtracts it outright — the
            chokepoint every consumer of the merge regime goes through. That second one also stops
            the base tree seeding an ancestor for a file nobody ships. **The test earned this by
            asserting `existsSync(...) === false` instead of trusting the report**, which was
            cheerfully correct both times.
      - [x] 🗣️ **The successor is NOT named in the message, and that is a design amendment.** § S6's
            box wanted *"its successor `test-first-discipline` is installed"*. The manifest carries
            no successor link, and inventing one in the report layer would have the report assert a
            relationship nobody declared. What ships instead: the retired skill by name with the
            reason it was safe to remove, and the successor visible on the same report's install
            line. Adding a `replacedBy` key is a manifest convention to buy the day a second
            retirement needs it, not on the first.
      - [x] 🔇→🔊 **Two sentences for the preserve, not one.** "You had changed it" is a claim, and
            on a brain with no record it is a false one — the exact shape S4-3 was written to end.
            The no-provenance wording says what we do not know, and a test asserts the accusation is
            absent from it.
    - [x] **S6d — refresh Kenjaku's copy of the skill from the harness** _(2026-08-21, `c65e5f4` ·
          harness `e9e8b40`)_. **v2.0.0 → v2.3.0, byte-for-byte**, the `origin:` frontmatter key the
          only deliberate delta and `diff` run to prove there is no second one. The bulk read went to
          a **subagent** as the mode requires: two files, ~41 000 characters, and what came back into
          this window was a verdict plus one quoted passage.
      - [x] 🔢 **The gap was THREE versions, and the third one had no number** — found by looking, not
            by trusting the plan. `24ce6cb` upstream added a whole rule (*the scope of a mutation run
            is the scope of the change*) and left `version: 2.2.0` standing, so two different
            byte-streams answered to the same version. That is only bookkeeping upstream; **here it is
            the defect this release exists to remove**, since the skill ships under the `merge` regime
            and the version key is what a merge reasons with. Fixed **at the source** (harness
            `e9e8b40`, bump to **2.3.0**, version line only — extending the `description:` routing
            surface is authoring, and belongs to its owner), then vendored.
      - [x] ✂️ **One Kenjaku-only sentence deliberately DROPPED, and it is worth the line.** The Scope
            section's inventory — *"in this repo it governs all the code — the RAG engine (`rag/`) as
            well as the install harness (`installer.mjs` and its helpers `scripts/lib/*.mjs`)"* —
            exists nowhere upstream. It was dropped anyway: upstream says the same thing generically
            (*"every line, the glue and the entry points included"*), and the inventory named
            **`installer.mjs`, a file no brain holds**. The shipped artefact was orienting brain owners
            around the launcher's layout, not their own.
      - [x] 🚫 **No mutation pass — doc-only slice, and the skip is said out loud** per the loop's own
            rule. No production line changed; suite green, **2131 tests, 0 fail**. `RESULTS.md` gets
            nothing because there is no measurement to file.
    - [ ] 🛑 **S6e — `templates/fr/.claude/skills/test-first-discipline/`** — **BLOCKED on a scope
          call, and the box for it is at the top of this file.** The rider called it *"the slice that
          may honestly slip"*; looking at the FR tree before writing it found something better than a
          slip — the tree is **partial and drifting** (`switch` and `local-mirror` have no FR version
          at all, `sync` FR is two months behind its source), and this particular skill is read by
          **Claude**, not by the owner, so a French copy has no reader. The evidence, the three
          options and the loop's recommendation are in the blocking box; nothing is decided here.
          _(Unchanged and still true: `resolveLocaleSource` falls back to English, verified, so a FR
          brain works today. Quality debt, never breakage.)_

  - [x] Add `.claude/skills/test-first-discipline/**` to the manifest's **`merge`** regime. _(shipped
        with S6c's one manifest change, 2026-08-21 — verified present in `engine-manifest.json`.)_
  - [x] 🔎 **The inverted vendoring has been flipped BACK** — ✅ **closed by S6d above**
        _(2026-08-21, `c65e5f4`)_, which owns what was copied, what was dropped and why. The
        diagnosis is kept below because it is what earned the slice; **the gap turned out to be three
        versions, not two**. _(Measured 2026-08-20.)_ The two files had **diverged**: Kenjaku's copy was the 2026-08-15 rewrite
        (frontmatter `origin: use-case-driven-harness`, wording about *"this repo"*, `rag/`,
        `installer.mjs`), while the harness source has moved on since. **The harness is the owner
        again** — Kenjaku's copy is the shipped artefact, not the source. ⚠️ It is the **only** copy of
        this doctrine that reaches end users, so a hand edit here widens the gap while looking like
        closing it: the refresh is this rider's job. **No longer waiting — the payload exists**: the
        harness's [T8](../../../../use-case-driven-harness/docs/plans/harness-consolidation-action.md)
        landed upstream on 2026-08-20 (`29abfa8`, skill **v2.1.0**, the section *"A mutation run LIES
        to you"*), and **T10 the same day** (`78b3536`, skill **v2.2.0**: the table filing the low
        mutation numbers to their real cause, so they stop being blamed on step size). It must reach
        the brains **through this path**, not by copy-paste, so the gap this rider has to close is now
        **two versions wide** and fully described upstream.
  - [x] ⚠️ **Retirement is NOT automatic — verified in code on 2026-08-15**: `refreshUntouchedSkills`
        only walks skills present in the **source**, and its single `rmSync` targets `.new` sidecars.
        A skill dropped from the engine is **never visited**, so `tdd-discipline` would sit on every
        deployed brain forever, contradicting its replacement. This release must remove it
        **explicitly** — and that retirement path is itself a piece of "the update regime owns what it
        shipped", so it belongs here on the merits, not only by convenience.
        ✅ **Answered by S6b + S6c** _(2026-08-21)_ — the explicit removal path exists, is declared in
        the manifest and is guarded; those two slices own the detail.
  - [x] Guard the retirement the way this release guards everything else: a brain that **customized**
        `tdd-discipline` must not have it deleted silently (preserve + say so), a brain that never
        touched it may lose it cleanly. ✅ **Done by S6b** (`skill-retirement.mjs` decides
        remove / preserve / **absent**, asking `verifyBase` rather than comparing bytes) **and S6c**
        (the report's two sentences, the no-provenance one deliberately accusing nobody).
  - [ ] Write the `templates/fr/` version → **this is S6e**, and S6e above is the box that tracks it.
        Kept as a pointer, not a second status _(the locale falls back to English until it exists —
        `resolveLocaleSource`, verified — so this is a quality debt, not a breakage)_.
  - [x] Re-sync the **source harness** copy (`use-case-driven-harness/skills/`): the vendoring
        direction was temporarily **inverted** for this rewrite, and is now **flipped back** — every
        sub-box below is done, and the last upstream touch is `e9e8b40` (2026-08-21, the version the
        scope rule had shipped without).
        **⚠️ THE HARNESS HALF IS THE ONE THAT CHANGES MY BEHAVIOUR, and the owner said GO on
        2026-08-15 ("everything in English").** Without it the new skill is Kenjaku-only and
        `rules/testing.md` — always loaded, every project — keeps pointing at `tdd-discipline`, so
        the old ritual stays the default everywhere. Exact checklist, in `~/Dev/use-case-driven-harness`
        (branch `chore/test-first-discipline`, since committing on its `main` is not done):
    - [x] `git mv skills/tdd-discipline skills/test-first-discipline` + the new content (English). _(2026-08-15 · harness `5d08fb9`, branch `chore/test-first-discipline`)_
    - [x] _(2026-08-15 · same commit)_ `rules/testing.md` **rewritten in English**, pointing at `test-first-discipline`, with the
          baby-steps enumeration replaced by the three non-negotiables. This file is THE switch.
    - [x] `bootstrap.sh` (the symlink list) + `README.md` + `CLAUDE.md` references. _(2026-08-15)_
    - [x] _(2026-08-15)_ `skills/outside-in-diamond-tdd/SKILL.md` and `rules/dotnet-conventions.md`: both named
          `tdd-discipline` as the discipline they specialize.
    - [x] _(2026-08-15, verified resolving)_ The **installed symlink**: `~/.claude/skills/tdd-discipline` → replaced by
          `test-first-discipline` (it is a symlink into the harness, so the rename breaks it).
    - [x] **The rest of the harness spoke FRENCH; the owner asked for English (2026-08-15).** Done on a
          fresh session as planned, in four commits on `chore/test-first-discipline`, now **pushed**
          (`61b4e3e` rules · `c2eee7c` skills · `ff10c49` docs+bootstrap · `a31cb39` .gitignore).
          Everything is English: the seven `rules/*.md`, both remaining skills **including their
          `description:` frontmatter** (the routing surface, the half that decides whether a skill
          loads at all), `README.md`, `CLAUDE.md`, and `bootstrap.sh` — comments **and** its on-screen
          output, which `language.md` counts as end-user-facing. `bash -n` clean and `--check` replays
          identically.
      - [x] `rules/style-typographie.md` → **renamed** `style-typography.md` (the last French
            filename; `rules/` is symlinked as a whole directory, so no basename pointed at it).
      - [x] Kept non-English on purpose, both under `language.md`'s own carve-out: the *« Des
            pointeurs, pas des copies, banane »* article title in `plans.md`, and the French sample
            forms in `inclusive-writing.md` — those forms **are** its subject matter.
      - [x] Three staleness defects fixed in passing, none of them translation: `outside-in-diamond`'s
            inner loop still ordered *« toujours en baby-steps, un test à la fois »* (the exact rule
            retired on 2026-08-15); the README listed `rules/` as four files when it holds eight;
            `bootstrap.sh` said "ces 3 blocs" over four mappings. `dotnet-conventions.md` also called
            Diverse "ma propre librairie" **in a file written in Claude's first person** — it is
            Thomas's library, and it now says so.
      - [x] **`docs/archive/PLAN.md` translated too** _(2026-08-15 · harness `50861b2`)_, after the
            owner approved. It was flagged as "leave it, its value is being the record of what ran";
            **that argument was wrong and was withdrawn**: git keeps the French original forever, so
            translating **moves** the record instead of destroying it. Added an `ARCHIVED` banner (the
            file opens with *"This plan is your mission. Execute it end to end"*, addressed to a Claude
            instance) and ticked P1-P3 + 1-8, which the journal had asserted since 2026-05-31 while
            every box stood empty — `plans.md`'s own defect, in the harness's own archive. Left
            deliberately un-modernized: it still names `skills/hexagonal-dotnet`, the `tdd-diamond`
            agent and a clone at `~/dev` (lowercase) — that last one being **the origin of the inode
            bug below**.
      - [x] **The `bootstrap.sh --check` wart is fixed, test-first** _(2026-08-15 · harness `8fda08f`)_.
            It compared the symlink target as a **literal string**, so links spelled `~/dev/…` were
            declared *"points elsewhere"* against a repo resolved at `~/Dev/…` — and that branch
            `return`s, so a healthy install reported four warnings and did nothing. Safe behaviour,
            lying report: once the dry-run cries wolf, a genuinely broken link is indistinguishable
            from the noise. Now `[[ -ef ]]` (device + inode), so any equivalent spelling counts.
        - [x] **`test/bootstrap-check.sh` is this repo's first mechanical net**, and it exists because
              `CLAUDE.md` rule 4 (*never break bootstrap.sh's idempotence*) had **nothing enforcing
              it**. It drives the script **as a process** against a fake `$HOME` — the entry-point seam
              rule, and the seam was already there since the script reads `$HOME`. Three cases: exact
              path, equivalent path via an alias symlink, genuinely foreign target. **Red on case 2
              only, before the fix.** The third case is load-bearing: without it, *"always report
              fine"* passes the other two. Wired into `CLAUDE.md` rule 4 + the README, because a net
              nobody knows to run is not a net.
    - [x] **✅ MERGED INTO `main` 2026-08-15 — PR
          [tpierrain/use-case-driven-harness#1](https://github.com/tpierrain/use-case-driven-harness/pull/1),
          merge commit `9f843dc`.** The owner asked whether anything had been pushed at all: it had,
          but with **no PR and `main` untouched** (`ls-remote` against the real remote, not the tracking
          ref), so the repo's landing page showed no trace of the seven commits. He called it — open
          and merge. The local clone was **switched back to `main` and fast-forwarded**, which matters
          beyond tidiness: `~/.claude/rules` and `~/.claude/skills` are symlinks **into this working
          tree**, so leaving it parked on a feature branch would have served every project on this
          machine from an unmerged branch. Verified after: `~/.claude/skills/` holds
          `test-first-discipline` and no `tdd-discipline`, `~/.claude/rules/testing.md` opens on
          *"Testing — test-first, always"*.
    - [x] **✅ DONE 2026-08-15 — acceptance test, not an assumption.**
          **It needed Thomas at the keyboard**: a fresh session in another project, which is exactly
          what a session inside Kenjaku cannot fake. **The protocol below was written FOR HIM, and must
          never be shown to the session under test** — a briefed session loads the right skill because
          it was told to, which measures nothing. Do not paste it, do not summarize it, do not
          announce that a test is running. **It ran unbriefed in `Diverse` and passed on both halves;
          the constraint held to the end — the verdict was read from mtimes and from the session's own
          plan file, never by asking it what it had done.**
      - [x] **The static wiring is already verified, so the remaining test is purely behavioural**
            _(2026-08-15)_: `~/.claude/skills/` holds `test-first-discipline` + `outside-in-diamond-tdd`
            and **no `tdd-discipline` at all**; `~/.claude/rules` symlinks into the harness. The
            surviving `tdd-discipline` tombstone lives **only** in Kenjaku's own `.claude/skills/`,
            which is precisely why the test has to run elsewhere.
      - [x] **The protocol** (5 minutes, no Kenjaku involved) — **ran and PASSED 2026-08-15**:
        - [x] 1. Open a session in **any project that is neither Kenjaku nor the harness**.
              _(2026-08-15 · ran in `Diverse`, branch `fix/11-defer-seed-logging-and-per-instance-logger`)_
        - [x] 2. Ask for **ordinary code work** in the normal way: *"add function X"*, *"fix this bug"*.
              **Never say** test, TDD, test-first, discipline, or the name of any skill. The whole
              question is what it reaches for **unprompted**. _(2026-08-15 · the ask was a logging fix
              for issue 11, plus its release framing; nothing about testing.)_
        - [x] 3. **PASS** = it loads **`test-first-discipline`** (a visible Skill call) **and** writes
              the test before the code. **BOTH HALVES OBSERVED, 2026-08-15.**
              **The skill**: the session announced *"Je charge d'abord ma discipline de test"* and a
              visible `Skill(test-first-discipline)` → *Successfully loaded skill* followed, **before
              touching any code**, with no `tdd-discipline` anywhere. Routing beyond the harness is
              proven: `rules/testing.md`, always loaded, carries a fresh session to the new skill.
              **The order**, read from the working tree rather than taken on trust (the session was
              never asked, which would have briefed it): `Diverse.Tests/Utils/LogSpy.cs` 17:02:28 →
              its two stubs 17:02:34 → `Diverse.Tests/FuzzerLoggingShould.cs` 17:04:30 → **then**
              `Diverse/Fuzzer.cs` 17:04:35. Tests first, production after.
        - [x] 4. **FAIL**, any one of these: it loads `tdd-discipline` (it should no longer exist
              anywhere outside Kenjaku); it writes production code first; or it announces *one test at
              a time / baby-steps* as the standing rule — the retired ritual resurfacing means a
              carrier somewhere still teaches it. **None of the three fired.**
        - [x] 5. Report the outcome here. On FAIL, the useful evidence is **which** skill it named and
              **what it said about step size** — that names the guilty carrier without re-deriving.
              **PASS, and the step-size evidence is the strong part.** Its own plan
              (`Diverse/maintainers/plans/issue-11-fuzzer-log-xunit.md`) is the relaxed mode exactly as
              the new skill defines it: a design stated first, then a **batch** T1→T15 each carrying
              **the reason it must go red** (*"🔴 4 lines logged in the ctor"*, *"red for the right
              reason"*), then implement → 🟢. Not one occurrence of *baby-steps* or *one test at a time*.
              The skill's assertion-quality habits show up unprompted too: a matcher **and** a message
              check on every `Throws<>`, `ContainsExactly` over a whole sequence, T8/T9 paired to pin
              the resolution order, a `CallCount` proving the user's sink was really called.
      - [x] **Weak evidence already in hand, worth recording so it is not mistaken for the test**:
            during the translation pass the edited skills' descriptions were re-read **live** by the
            running session (the harness symlinks resolve). That proves the *symlinks* carry, not that
            a **fresh session in another project** routes to `test-first-discipline`. Still owed.
  - [x] Align `CONVENTIONS.md` §5 ("TDD baby-steps + green-only commits") and harden §5bis with the
        **entry-point seam rule** (every executable entry point is tested by running it as a process —
        earned on v4.9.1's 25 % CLI wiring). ✅ **Both are done and were verified in the file, not
        recalled** _(2026-08-21)_: §5 is titled *"Test-first + green-only commits"* and carries the
        batch rule with the measured argument for it; §5bis's third bullet is the entry-point seam
        rule, hardened 2026-08-15, with the 25 % → 100 % figure and the symlink defect it found.

## The owner's second worry, and it is a different failure (2026-08-08)

> *"Since I moved my own second brain from my homemade one to Kenjaku, a lot of things work less well.
> Either the setup is fragile and our updates never land, or we have a real quality problem: layer upon
> layer added to the doctrine files, and the effectiveness is gone."*

**Measured, both halves are true, and they form a loop.**

- [x] **The delivery half is confirmed** — his ambient doctrine is the one written on **19 July**, while
      he believes he runs v4.8.1. Everything learned since (identity discipline, claim discipline,
      source ordering, backlogs) reached his **skills** and never his constitution.
- [x] **The dilution half is real and has a slope.** `CLAUDE.engine.md` (EN), read **in full at every
      session**: **20 737 bytes on 2026-07-18 → 33 451 on 2026-08-05, +61 % in eighteen days**, about
      **10 KB added on 3 August alone** (the field-findings trilogy). FR today: **37 614**. Nobody chose
      that growth; it is the emergent result of one reflex — *a field finding becomes another paragraph
      in the constitution*.
- [x] **The loop**: the paragraph is added (its cost is paid by fresh installs, forever, at every
      session), it never reaches deployed brains (no benefit), the same defect recurs in the field, so
      another paragraph is added. **This repo already knows this shape**: it is `plans.md`'s own rule
      about `MEMORY.md` and context rot, applied to memory and never to the constitution the launcher
      ships.
- [x] **A third factor was proposed and then WITHDRAWN on measurement — recorded because the mistake is
      instructive.** First claim: *his personal layer was never tailored* (`CLAUDE.md`: 2 commits, both
      from install day), so he compares a brain built around him with a generic one. **False, and the
      owner caught it**: personalization moved to the universes. Measured: `vault/shodo/universe.md`
      **14 063 bytes** and `vault/inqom/universe.md` **3 788** — 18 KB of real context (his rhythm,
      people, topics, connector accounts, the Slack channels and Notion references that matter), even
      carrying its own *"reliability of this page"* section. **The tailoring was done, in the place the
      product now says to do it.** The defect was measuring a file instead of a function.
  - [ ] **What genuinely remains for the personal layer is narrower, and the axis is not
        personal-vs-generic**: `universe.md` is **fetched on demand and scoped to one sphere** (the
        engine states it plainly: *"read it, it is never read to you"* — a session start at most names
        the page), while `CLAUDE.md` is the **only thing always in context, across every universe**:
        tone, the privacy non-negotiables, standing preferences about how the owner wants to be answered
        and challenged. If he has nothing he wants true in **every** sphere, that layer legitimately
        stays thin and there is no gap to close. Do not manufacture one.
  - [x] **The trap he did NOT fall into, worth keeping as a rule**: a behavioural instruction written
        into `universe.md` applies only when that page happens to be retrieved, so it fires
        intermittently and looks like the brain "forgetting". Checked on his: it is descriptive, with
        one or two incidental occurrences of *toujours / jamais*. **Standing behaviour belongs in the
        always-loaded layer; context belongs in the universe page.** That distinction is currently
        written nowhere a user reads.

- [ ] **What follows from it, to arbitrate with S0.**
  - [ ] **A budget on always-loaded doctrine**, enforced like `MEMORY.md`'s: a test that fails when the
        engine layer crosses a ceiling. Not to forbid growth, but to force the arbitration *what comes
        out* instead of letting it be free.
  - [ ] **Change the default home of a finding.** Ranked, cheapest-for-the-session first: a
        deterministic guard (hook / test) > a skill loaded on demand > the always-on constitution. ADR
        0009 already prefers the deterministic mechanism; nobody applied it to **prose volume**. The
        constitution should be the last resort, because it taxes every session forever.
  - [ ] **Measure adherence, stop asserting it.** Every `*-discipline.test.mjs` asserts the rule is
        **present in a file**, never that a brain **follows** it — the same proxy class as
        *"112/112 files indexed"* standing in for *"your brain can read your notes"*. The instrument is
        half-built: `scripts/run-eval.mjs` already scores **retrieval** with a Claude judge over the
        real MCP server; an adherence eval is the same harness with a different question.
  - [ ] **Invite the tailoring.** A first-week prompt to write the personal layer would close more of
        this owner's gap than any engine change listed above.

## The QA instrument — decided 2026-08-08, do not re-open

> Offered: hand-unfreeze `mind-palace` today, as an experiment separating the two failure halves.
> **The owner refused, and he is right**: it is the only deployed brain he has, therefore the only place
> where a structural change to Kenjaku can be observed on a real installation. Hand-patching it is the
> thing this repo tells its own users not to do (v4.8.1's note: *drop the hand-patched launcher*), and it
> is the reaper-instead-of-the-fix shape the previous plan already refused.

- [x] **`mind-palace` is NOT touched.** Its frozen state is evidence, and it becomes the **acceptance
      test** of S1-S5: the doctrine must arrive there **through the mechanism**, or the mechanism does
      not work. The owner keeps a degraded ambient doctrine until then — a real cost, and the reason
      this plan should not sit in a queue.
- [x] **But a live brain is a SINGLE-USE test**, which is the argument the refusal did not need but has:
      the moment anything unfreezes it — hand or mechanism — the frozen state is consumed, permanently.
      One observation, non-reproducible, and a bug in the mechanism burns the only sample. So a
      replayable fixture is **not optional**, whichever way the live brain is used.
- [x] **The fixture needs none of his files — the drift is reproducible from public tags.** Measured:
      the brain was installed **19 July** (tags of that day: `v3.6.0`, `v3.6.1`) and its own git history
      carries the engine updates it then took (`v4.5.0` → `v4.8.1`). Replaying *install at the 19-July
      tag, then update through each tag* reproduces **exactly** the state observed: skills refreshed,
      `CLAUDE.engine.md` untouched since install. Deterministic, CI-able on every commit, and free of
      one byte of personal data.
  - [x] Home + convention already exist: `maintainers/qa/release-fixtures/<version>/` (`.claude/` +
        `engine-manifest.json`, built from tags — same shape, new use).
  - [x] **If the drift turns out NOT to reproduce**, that is itself a finding: something in his install
        is doing the freezing, and we would have been debugging the wrong mechanism. ✅ **Answered
        before a line of test was written, and the answer is the good one**: the drift is not only
        reproducible, it is **over-determined** — see the design below, box 2. Nothing in his install
        is doing anything; the file was in no regime at any tag.

  - [x] 🎨 **THE DESIGN — written before the code, per the loop's own rule** _(2026-08-21, design
        slice, no code)_. Reading the ground first changed the slice three times, so each finding is a
        box rather than a paragraph.

    - [x] 📏 **1. The measurement the fixture exists to defend, and it is bigger than "some drift".**
          `CLAUDE.engine.md` was **23 504 bytes** at the cohort's install tag (`v3.6.0` / `v3.6.1`, and
          the two are byte-identical on this file) and is **33 531** at HEAD: **+10 027 bytes over 12
          commits**, `git diff --stat` = **120 insertions / 13 deletions**. The FR file, which is the
          one the owner's own brain reads, went **26 223 → 37 614 = +11 391**. _(That second figure is
          the one already written into `engine-doctrine-refresh.mjs`'s header and into the field
          finding — same measurement, FR file. Both are **≈ +43 %**. Neither supersedes the other and
          the numbers must not be quoted without the file they belong to.)_

    - [x] 🧨 **2. THE FINDING THAT RESHAPES THE SLICE: the freeze has a one-line mechanical cause, and
          it is not a bug in the update path.** Measured across **nine published tags** — `v3.6.0`,
          `v3.6.1`, `v4.0.0`, `v4.5.0`, `v4.6.0`, `v4.7.0`, `v4.8.0`, `v4.8.1`, `v4.9.1` — the
          manifest's `merge` list holds **15 entries at every single one of them**, and
          `CLAUDE.engine.md` is **ABSENT FROM EVERY REGIME AT EVERY TAG**. Not `merge`, not `replace`,
          not `regenerate`. **No update could ever have carried it, because nothing declared it as
          anything.** ➡️ The plan's own worry — *"if the drift does NOT reproduce, something in his
          install is doing the freezing"* — is answered: nothing in his install is doing anything.
          ⚠️ **This changes what the fixture is FOR.** It is not an investigation into a mysterious
          drift; it is the **regression net on a cause we now understand exactly**, and its real job is
          to pin the two end states apart.

    - [x] 🪝 **3. So the fixture is ONE HOP, not the tag chain — and that is a saving, not a
          shortcut.** The plan said *"install at the 19-July tag, then update through each tag"*. Box 2
          disqualifies it: what decides the outcome at every hop is (a) whether the brain's manifest
          lists the file under a regime and (b) whether provenance records an ancestor — and the answer
          to (a) is **identical and negative at all nine tags**. Replaying the chain costs one git
          worktree and one fixture tree per tag to learn what `v3.6.0 → HEAD` establishes in one run.
          **If a future question genuinely depends on an intermediate state, the chain comes back for
          that question** — it is not being ruled out on principle, it is being left unbuilt because
          nothing currently asks for it.

    - [x] 🎯 **4. WHAT IS ASSERTED — two poles, and the contrast between them IS the deliverable.**
          The temptation is to assert *"the doctrine finally arrives"*. **That assertion would be false
          for the old cohort and would make the release note lie**, which is the exact failure S5's
          header already warns about. So:
      - [x] **Pole A — the OLD cohort (`v3.6.0` fixture, no provenance for the file).** After an update
            to HEAD: `CLAUDE.engine.md` on disk is **still byte-identical to the v3.6.0 bytes**, and
            the report **names it** — `doctrinePreserved`, with the no-provenance wording S6c's box
            already pinned as accusing nobody. ✅ *A brain that was silent becomes a brain that says
            what it is holding back.* That, and only that, is what v5.0.0 buys the fleet.
      - [x] **Pole B — the NEW cohort (installed from v5.0.0, base seeded on day one).** After an
            update: the file is **byte-identical to the source**, and the report says so through
            `doctrineMerged` / `doctrineRefreshed`. There is no v5.0.0 tag to build this from, so the
            brain is built at HEAD and its base tree is written by **the production seeder**
            (`engine-base-fs.mjs`, the only writer of `.engine-base/`) — never hand-rolled, for exactly
            the reason the existing QA imports the production `fingerprint` rather than re-deriving it.
      - [x] 🔴 **The fail-first shape, stated so it cannot be skipped**: Pole A must be seen red by
            **swapping its expected verdict** (assert `doctrineRefreshed` instead of
            `doctrinePreserved`) before it is written green — otherwise it is a test that passes because
            nothing happens, which is the one shape a frozen file always satisfies.

    - [x] 🏗️ **5. Where it lives, and how little of it is new.** The instrument **already exists**:
          `scripts/lib/release-fixture-refresh.test.mjs` builds a brain from `maintainers/qa/release-
          fixtures/<tag>/`, synthesizes provenance with the production `fingerprint`, plants the sacred
          trio and runs a **real `reconcileBrain`** with the I/O seams stubbed (no network, no npm, no
          reindex). What is missing is only: the fixture does not carry `CLAUDE.engine.md`, and
          `skillFilesOf` is a hard-coded two-tag map.
      - [x] `brainAtRelease` + `seams` + `updateFrom` are **extracted to
            `maintainers/qa/release-fixtures/brain-at-release.mjs`** and imported by both suites.
            Dev-only prefix, so it never reaches a brain — the same argument the fixtures themselves
            already run on. Duplicating them into a second suite is how the two QA files start
            disagreeing about what a brain at a release looks like.
      - [x] The doctrine QA is **its own file**, `scripts/lib/release-fixture-doctrine.test.mjs`, on the
            existing file's own precedent: that one is the QA of the **skill** refresh, and its header
            argues a separate suite per question rather than one growing file.

    - [x] 🚫 **Deliberately OUT, named so the slice does not grow**: the tag **chain** (box 3); any
          **network, `npm install` or reindex** (already stubbed seams); a **full installer replay** —
          this fixture drives `reconcileBrain`, and the installer's own path is covered elsewhere; any
          assertion on the doctrine's **prose** beyond byte identity; and the **FR file** — the locale
          is a second axis, it is where the owner's own +11 391 bytes live, and it is worth its own
          test rather than a flag on this one. **Named, not forgotten.**

    - [x] ⚖️ **The judge, and the mutation call.** Judge: `node --test
          scripts/lib/release-fixture-doctrine.test.mjs`, binary, plus the full suite green. **No
          mutation pass is due**: this slice adds a **test suite and a test helper**, no production
          line. The helper extraction is a **move** — the proof it was a move is that
          `release-fixture-refresh.test.mjs`'s four existing tests stay green **untouched**. Per the
          mode's map this is 🟢 delegable once the tests exist; the tests themselves are written here,
          never by the agent that will be judged by them.
- [x] **Never copy the brain into this repo.** `tpierrain/kenjaku` is **public**; his `CLAUDE.md` carries
      his name, and `settings.json` / `.mcp.json` carry this machine's absolute paths. What is captured
      here is **measurements**, not files — see the § above, which is the acceptance target.

## The counter-argument, kept because it is the real constraint

"Everything engine-born is updatable like a product" is right **as an ownership rule** and wrong **as an
overwrite rule**: an owner who deliberately tailored an engine skill did real work, and `/improve`
exists to encourage exactly that. Replacing it blind is precisely the trust breach the owner named. The
three-way merge is what lets both statements be true at once — the engine keeps shipping, the person
keeps their work, and a human is asked only when the two genuinely collide.

> Links: `field-finding-2026-08-05-silent-skill-freeze.md` (symptom 1, folds in here),
> `field-finding-2026-08-08-source-first-and-frozen-doctrine.md` (symptom 2, and the measurement),
> `engine-managed-file-merge-strategy.md` (Gate 4's F-B7e, which this supersedes in scope),
> `scripts/lib/engine-skill-refresh.mjs`, `scripts/lib/staged-skills.mjs`, `scripts/vault-write-guard.mjs`.
