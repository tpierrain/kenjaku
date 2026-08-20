<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- STATUS: ▶️ LIVE again since 2026-08-19 — the diversion was lifted after the -->
<!-- framing conversation. This is THE next chantier, and it is the one being    -->
<!-- built in the orchestrated/subagent mode described in                        -->
<!-- agent-orchestrated-release-mode-action.md. Read that plan before any        -->
<!-- delegation. See ROADMAP.md § DIVERSION LIFTED.                              -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

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
> this plan exists for. ▶️ **S1 IS UNDER WAY: its first production slice landed** _(2026-08-20 ·
> `411d4d7` + `40743c1`)_ — `scripts/lib/engine-base.mjs`, pure, carrying the two facts nothing else
> owns: **where** a base lives (`.engine-base/<rel>`, one tree for the four families) and **whether it
> is provable** (the recorded sha256 becomes the proof, with `no-provenance` / `absent` / `mismatch`
> named apart because their repairs differ). Test-first, 8 cases red on their assertions first,
> **100 % mutation score** the same hour _(number owned by
> [`RESULTS.md` § S1's first slice](../../mutation/RESULTS.md#s1s-first-slice--libengine-basemjs-measured-the-day-it-was-written--2026-08-20))_.
>
> **▶️ RESUME AT: the base's ADVANCE rule** — the sentence S1 is actually named after, and the only one
> that kills the false positive: *the base moves to what was **delivered** to the installed file, never
> to the newest fetched content.* A pure `planBaseAdvance` driven by the delivery map
> (`refreshUntouchedSkills`'s `refreshedFileMap`, the shape that already exists), then the seeding
> planner (installed matches its recorded sha → seed from the brain itself, the cheap migration), then
> the fs orchestrator and its wiring at install and at update. ⚠️ **One question for the owner is now
> RIPE, and it is the only thing on this step that needs him**: the fork below was *"une inclination,
> pas une signature"* and the plan reserved the re-ask for the moment the first test made the shape
> concrete. That moment is now — `.engine-base/CLAUDE.md`, `.engine-base/scripts/auto-commit.mjs`,
> `.engine-base/.claude/skills/coach/SKILL.md`. It does **not** block the advance rule, which is
> home-agnostic.
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
  - [ ] **NEXT — the ADVANCE rule, the sentence this step is named after.** A pure `planBaseAdvance`:
        the base moves to what was **delivered** to the installed file, never to the newest fetched
        content. Drive it from the delivery map that already exists (`refreshedFileMap`), not from the
        source tree — that substitution *is* the false positive (`engine-skills/**` sits in `replace`,
        so today the base runs ahead while the installed file stands still).
  - [ ] **Then the seeding planner**, on the measurement above: installed content matching its recorded
        sha **is** the engine's last delivered content → seed the tree from the brain itself, no fetch
        (13 of 15 entries qualified on the live brain). The other two seed from the fetched copy at the
        next update.
  - [ ] **Then the fs orchestrator + the wiring**: write `.engine-base/` at install
        (`recordSourceAndProvenance`) and at update (beside `reseedProvenance`), and decide what regime
        the tree itself answers to (it must never be a `replace` target — that would recreate the bug
        one level up).
- [ ] **S2 — A real three-way merge, so "preserve" stops meaning "abandon".**
  - [ ] untouched → fast-forward (today's behaviour, unchanged);
  - [ ] owner's edit in a region the update does not touch → **merge**: they keep their edit **and**
        receive the update. This is the case that is common today and served worst;
  - [ ] both changed the same region → a **real conflict**, the only case that costs a human anything,
        and the only one that should produce a sidecar or a question.
  - [ ] Markdown-aware where it pays (doctrine and skills are section-structured), line-based otherwise.
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
        to you"*). It must reach the brains **through this path**, not by copy-paste, so the gap this
        rider has to close is now one version wider and fully described upstream.
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
