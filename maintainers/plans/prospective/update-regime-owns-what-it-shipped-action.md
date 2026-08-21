<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- STATUS: ▶️ LIVE again since 2026-08-19 — the diversion was lifted after the -->
<!-- framing conversation. This is THE next chantier, and it is the one being    -->
<!-- built in the orchestrated/subagent mode described in                        -->
<!-- agent-orchestrated-release-mode-action.md. Read that plan before any        -->
<!-- delegation. See ROADMAP.md § DIVERSION LIFTED.                              -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

> ## 🛑 WAITING ON THOMAS — one arbitration, and it blocks **S2c ONLY** (raised 2026-08-20)
>
> **Nothing else waits.** S2a (the merge core) and S2b (the four engine scripts) are unblocked and are
> where the work continues; this box exists so the question is not guessed in his place.
>
> **May the engine write `CLAUDE.md`?** S2 turns the sacred scrub from *"never written"* into *"never
> written **blind**"* — a merge-governed door that can only ever lay down the output of a three-way
> merge from a **provable** base, and never on a conflict. The two files behind that door are
> `.claude/settings.json` (already engine-written today, surgically: hooks, status line) and
> **`CLAUDE.md`, the constitution — the most personal file in the product**. Opening it is a doctrine
> call, not a technical one, so it is his.
>
> - [ ] 🛑 **The question**: is the engine allowed to land its own updates inside a brain's `CLAUDE.md`
>       (owner's edits preserved, conflicts never written and reported instead)? Or does the
>       constitution stay untouchable **by policy**, with the engine's own doctrine reaching brains only
>       through `CLAUDE.engine.md` (S5's file, the layer built exactly for that)?
> - [ ] **What is already measured, so the answer is not abstract** _(2026-08-20)_: on the live brain
>       `CLAUDE.md` is **diverged from its recorded base**, so S1's seeding defers it — the fleet holds
>       **no ancestor** for it and cannot merge it today whatever the answer. An ancestor is
>       *reconstructible* (a brain keeps `CLAUDE.md.template` **and** `installer.mjs` on disk, both frozen
>       at its install version and, like `CLAUDE.engine.md`, **in no regime at all**), but that
>       reconstruction is a machine to build, not a line to flip.
> - [ ] **If the answer is "no"**: S2c shrinks to `.claude/settings.json` + the wording of the scrub, and
>       the constitution's freeze becomes a stated policy instead of an accident — which is itself worth
>       shipping, since today's silence reads as the second.
> - [ ] **If the answer is "yes"**: S2c keeps the door, and the ancestor-reconstruction machine becomes
>       its own slice (it is bigger than the merge itself).

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
> **▶️ RESUME AT: S2b-4 — the named debt, paid on the final shape.** Four `readFileSync`/argv lines in
> `update-engine.mjs` that no test walks (`:344` the `copied` readback, `:279` the local manifest, `:465`
> the recorded `source`, and `runUpdateCli`'s `argv` default), plus the `unknown()` duplication in
> `runUpdateCli`. Detailed in § S2b below. **S2c is the only part that waits on Thomas** (the box at the
> top), and nothing else does.
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

- [ ] **S1 — An immutable base per `merge` file.** Freeze the staged copy at **the version actually
      delivered to the installed file**, instead of overwriting it with the newest one. That one change
      makes the existing comparison correct and kills the silent-freeze false positive by construction.
  - [ ] The recorded `sha256` becomes what it should always have been: the **proof** that the base on
        disk is the right one, checked before any merge.
  - [ ] Decide the base's home for the files that have none today (`CLAUDE.md`, `settings.json`, the
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
    - [ ] **What makes the migration cheap, and it falls out of the same measurement**: on a brain
          where the installed file still **matches its recorded `sha256`**, that file **is** the
          engine's last delivered content — so the base tree can be seeded **from the brain itself**,
          with no fetch. 13 of 15 entries qualified on the live brain; the two that did not
          (`CLAUDE.md`, `settings.json`) seed from the fetched engine copy at the next update.
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
  - [ ] untouched → fast-forward (today's behaviour, unchanged);
  - [ ] owner's edit in a region the update does not touch → **merge**: they keep their edit **and**
        receive the update. This is the case that is common today and served worst;
  - [ ] both changed the same region → a **real conflict**, the only case that costs a human anything,
        and the only one that should produce a sidecar or a question.
  - [ ] Markdown-aware where it pays (doctrine and skills are section-structured), line-based otherwise.

  - [x] 🧭 **THE DESIGN — written before a line of test** _(2026-08-20)_.
        Written into this file rather than held in a window, because a compaction costs a session its
        reasoning and never its files. Everything below is decided unless a line says otherwise; the
        single open question is the arbitration box at the top of this plan, and it blocks **S2c only**.

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
        | 3 | no `recorded`, `I ≠ C` | `preserve` (`no-provenance`) | — | — | no |
        | 4 | untouched, `I === C` | `unchanged` | — | — | no |
        | 5 | untouched, `I ≠ C` | `refresh` (fast-forward) | `C` | — | yes |
        | 6 | edited, engine stood still | `unchanged` (`owner-edit-stands`) | — | — | no |
        | 7 | edited, engine moved, **`B` unusable** | `preserve` (`customized`) | — | `C` | no |
        | 8 | edited, engine moved, `B` usable, merge clean | `merge` | the merged bytes | — | **yes, with `C`** |
        | 9 | edited, engine moved, `B` usable, conflict | `conflict` | — (owner's copy stands) | marked merge | **no** |

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
  - [ ] **S2b — the four engine scripts stop being overwritten blind.** `auto-commit`, `auto-push`,
        `status-line`, `verify-rag` are declared `merge` and applied `replace` (`computeApplyPlan` puts
        them in `replaceScripts`) — the mirror image of the skills' bug, and the one that can destroy an
        owner's edit **today**.

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
      - [ ] **Consequence for the code**: there is **no split to make**. The bucket is not "the engine
            scripts including the self-updater", it is *"the merge-declared top-level scripts"*, and once
            those go through the merge it is **empty on every manifest that exists**. So it is renamed
            (`replaceScripts` → `mergeScripts`), it leaves `copyGlobs`, and it stays inside
            `planTouches` — the engine still writes those files, just no longer blind.
      - [ ] **Consequence for the prose**: three artefacts assert the false claim and must stop —
            `engine-apply-plan.mjs`'s header comment (lines 7–8), the test title at
            `engine-apply-plan.test.mjs:31`, and the note at `:42` ("self-update → MUST be present"),
            which is true of that **synthetic fixture** and of nothing the product ships. A comment that
            lies is a defect, exactly like a test name that lies.
      - [ ] **What must not change**: the self-update path itself. `update-engine.mjs` keeps arriving by
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
    - [ ] **S2b-4 — the named debt, paid on the final shape.** The `deliveredFileMap` line at
          `update-engine.mjs:411` that reads back every **copied** file's bytes is **never executed under
          test** (both a mutant giving it an invalid encoding AND one emptying the whole entry survive).
          That map feeds `reseedProvenance` and `syncBaseTree`, so the ancestor recorded for every
          `replace`-copied file is unproven. Detail in `RESULTS.md` § S2's report. **Deliberately last**:
          pinning it before S2b-3 would pin a `copied` list that S2b-3 then changes, so the test would be
          rewritten by the slice it was meant to guard.
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
      - [ ] **Still owed with them**: `runUpdateCli`'s "unknown"-report literal hand-rolls a second copy
            of the shape `checkUpstream`'s own `unknown()` helper already builds. The mutant is dead; the
            duplication that made it possible is not.
      - [ ] Same slice, same run's other finding: `runUpdateCli`'s "unknown" report hand-rolls a second
            copy of the shape `checkUpstream`'s `unknown()` helper already builds, which is why one of
            its fields is dead and unassertable. Reuse the helper.

    - [ ] **Deliberately OUT of S2b** — named so the slice does not grow:
      - [ ] **Semantic validation of a merged script** (running it, linting it, type-checking it). The
            gate parses; judging whether a merged `auto-commit.mjs` still *behaves* is a different
            product, and the honest answer to it is the conflict report, not a cleverer check.
      - [ ] **`scripts/lib/**`** — declared `replace`, and it stays there. It is engine internals, not
            a file an owner is invited to edit; making it merge-governed would offer a promise nobody
            asked for.
  - [ ] **S2c — the scrub is reformulated: never written *blind*.** `SACRED` splits in two, and the
        words matter because this is the invariant ADR 0003/0012 is built on:
    - [ ] **Inviolable, and it stays that way**: `.env` (secrets), `vault/` (the owner's notes — the
          product's whole promise), and every skill the manifest does **not** declare.
    - [ ] **Merge-governed**: `.claude/settings.json` and `CLAUDE.md` — writable only through a
          three-way merge from a **provable** base, never by copy, never on conflict.
    - [ ] Needs a **new ADR amending 0003/0012** (`Scope:` field per the repo's convention): the
          allowlist stays an allowlist, and a second, narrower door is added beside it.
    - [ ] 🛑 **Waits on the arbitration box at the top of this plan** — see it for what is already
          measured about `CLAUDE.md`'s missing ancestor.
    - [ ] `.claude/settings.json` is **deliberately not a text merge**: the engine already writes it
          surgically today (hook entries, status line, via `reconcileBrain`), which is the better
          mechanism for a JSON file whose two sides both append to the same arrays. S2c's job on it is
          to say so out loud, not to replace it with a line-based diff.

  - [x] **Deliberately OUT of S2** — named so no slice quietly grows:
    - [ ] **Markdown-aware merging.** Line-based only, on the measurement above (blank lines already
          give section granularity). The trigger to revisit is a **measured** conflict rate, replayed
          against real deployed-brain content — not an intuition.
    - [ ] **The 9 staged skills** (`consolidate`, `file-back`, `lint`, `local-mirror`,
          `mcp-token-expired`, `open-note`, `rag`, `univers`, `universe`) stay unmergeable: no `merge`
          glob names their installed path, so they have no provenance and S1 seeds them no base. **A
          merge with no ancestor is not a merge** — widening the manifest to bring them in is a scope
          call and belongs to the release's cargo discussion, not to S2's code.
    - [ ] **Seeding a base for a no-record file that holds the engine's exact bytes** (row 2). Cheap and
          correct, but it is S1's planner's business — noted here so it is not lost, not done here.
    - [ ] Interactive conflict resolution. An update **never** prompts: it writes, or it reports.
    - [ ] The audible divergence report (S4), the write guard (S3), `CLAUDE.engine.md`'s regime (S5).
- [ ] **S3 — Keep the owner's intent out of engine files, by construction.** A write guard on
      engine-owned paths that redirects to the layer built for it (`CLAUDE.md`, the owner's own skills)
      and asks before letting an edit land in an engine file. Precedent and shape:
      `scripts/vault-write-guard.mjs`. **This is the half that makes the whole model honest**: divergence
      stops being free and silent, so preserving it stops being the hard problem.
- [ ] **S4 — Divergence becomes audible.** A brain says, once, which engine files it is holding back and
      how far behind they are. Absorbs the silent-skill-freeze plan's third defect.
- [ ] **S5 — The doctrine layer joins a regime, as the first client of the new model.**
      `CLAUDE.engine.md` is a special case worth stating: the two-layer design means the owner's edits
      belong in `CLAUDE.md`, so a divergence in the engine layer is nearly always **an accident to
      surface**, not work to protect. Flip `engine-apply-plan.test.mjs`'s deliberate lock with its
      comment rewritten, never deleted quietly.
- [ ] **S6 — RIDER, decided 2026-08-15: deliver `test-first-discipline` and RETIRE `tdd-discipline`.**
      The skill is **already written and committed** (`.claude/skills/test-first-discipline/SKILL.md`),
      deliberately parked here rather than shipped alone, because retiring its predecessor needs
      exactly the power this release builds. Why it exists: v4.9.1 measured the relaxed mode and the
      old skill's opening rule (*one test at a time, never a test-first batch*) did not survive — and
      what was dropped is TDD's own thesis, not a ceremony, so the name had to change too (owner's
      call, both the decision and the name).
  - [ ] Add `.claude/skills/test-first-discipline/**` to the manifest's **`merge`** regime.
  - [ ] 🔎 **The inverted vendoring has to be flipped BACK, and it is already costing** _(measured
        2026-08-20)_. The two files have **diverged**: Kenjaku's copy is the 2026-08-15 rewrite
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
  - [ ] ⚠️ **Retirement is NOT automatic — verified in code on 2026-08-15**: `refreshUntouchedSkills`
        only walks skills present in the **source**, and its single `rmSync` targets `.new` sidecars.
        A skill dropped from the engine is **never visited**, so `tdd-discipline` would sit on every
        deployed brain forever, contradicting its replacement. This release must remove it
        **explicitly** — and that retirement path is itself a piece of "the update regime owns what it
        shipped", so it belongs here on the merits, not only by convenience.
  - [ ] Guard the retirement the way this release guards everything else: a brain that **customized**
        `tdd-discipline` must not have it deleted silently (preserve + say so), a brain that never
        touched it may lose it cleanly.
  - [ ] Write the `templates/fr/` version (the locale falls back to English until it exists —
        `resolveLocaleSource`, verified — so this is a quality debt, not a breakage).
  - [ ] Re-sync the **source harness** copy (`use-case-driven-harness/skills/`): the vendoring
        direction is temporarily **inverted** for this rewrite.
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
  - [ ] Align `CONVENTIONS.md` §5 ("TDD baby-steps + green-only commits") and harden §5bis with the
        **entry-point seam rule** (every executable entry point is tested by running it as a process —
        earned on v4.9.1's 25 % CLI wiring).

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
- [ ] **The fixture needs none of his files — the drift is reproducible from public tags.** Measured:
      the brain was installed **19 July** (tags of that day: `v3.6.0`, `v3.6.1`) and its own git history
      carries the engine updates it then took (`v4.5.0` → `v4.8.1`). Replaying *install at the 19-July
      tag, then update through each tag* reproduces **exactly** the state observed: skills refreshed,
      `CLAUDE.engine.md` untouched since install. Deterministic, CI-able on every commit, and free of
      one byte of personal data.
  - [ ] Home + convention already exist: `maintainers/qa/release-fixtures/<version>/` (`.claude/` +
        `engine-manifest.json`, built from tags — same shape, new use).
  - [ ] **If the drift turns out NOT to reproduce**, that is itself a finding: something in his install
        is doing the freezing, and we would have been debugging the wrong mechanism.
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
