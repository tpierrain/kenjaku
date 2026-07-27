<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- STATUS: 🔭 PROSPECTIVE / ANALYSIS (2026-06-21) — design captured, not yet an  -->
<!-- ADR, NOT implemented. Provisional direction agreed; decide + write the ADR     -->
<!-- when a release actually changes the constitution (see "Why this is non-blocking"). -->
<!-- SEQUENCING DECIDED (2026-07-18): fresh-install "green" (legacy-safe) ships       -->
<!-- BEFORE the personal-brain migration; the deployed fleet's re-layering + the      -->
<!-- broader big-jump upgrade experience (completeness, what-you-gained notes,        -->
<!-- pre-flight reindex preview) + heavy QA are deferred AFTER it. See "Sequencing    -->
<!-- decision" below.                                                                 -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Propagating engine improvements into user-editable provided files (constitution + shipped skills)

## The problem (the WHAT)

A brain has files that are **both upstream-provided AND user-editable** — chiefly the **constitution
`CLAUDE.md`** and the **shipped skills** (`coach`, `prepare-1-1`, …). Today the reconciler protects them
perfectly but **at the cost of zero propagation**:

- `CLAUDE.md` and `.claude/settings.json` are `SACRED_FILES` (`scripts/lib/engine-apply-plan.mjs:32`) →
  **never written by any engine path**. So an engine improvement to the constitution **never reaches an
  existing brain** — and note: it is frozen **regardless of whether the user ever edited it** (it is not
  "edit once → frozen"; it is "frozen, period").
- Shipped skills are `installSkills` = **install-if-absent** (ADR 0025): an already-present skill (possibly
  user-edited) is left **byte-identical**, so skill bugfixes/improvements never reach a brain that has it.

The reconciliation guarantee ("only ever modify what comes from the engine, and only when absent") is
**safe by construction** (write-allowlist + sacred scrub, ADR 0012). The open question is the *other* half:
**how to deliver improvements to these files without ever clobbering the user's edits.**

## Provisional decision (agreed with Thomas 2026-06-21, to confirm + ADR after the demo)

**Option 3 as the foundation, options 2/1 as the safety net.**

- **3 — Separate engine-managed content from personal content *inside* the file** (the foundation).
  The constitution carries an **engine-managed block** (delimited, e.g. `<!-- ENGINE:BEGIN -->…<!-- ENGINE:END -->`)
  that moves back into the **`replace`** regime (always refreshed, like `rag/src`), plus **personal zones**
  that stay `sacred`. This **eliminates conflicts by construction** — no base to store, no merge algorithm,
  no conflict UX, **deterministic** (aligns with ADR 0009). It maps the file's reality: most of `CLAUDE.md`
  is engine machinery; the personalization (owner, role, language, persona) is localized. Composes with an
  **include / layered** model (`CLAUDE.md` engine-owned `@import`s a `CLAUDE.personal.md` sacred → nothing
  to merge at all). _Prior art: Ansible "BEGIN/END MANAGED BLOCK", managed blocks in `/etc/hosts` / `known_hosts`._
- **2 — 3-way merge** (the net for "the engine block was edited anyway", and for legacy migration).
  Store the **base** (the originally-provided version); at upgrade have `base` / `theirs` / `new` → auto-apply
  clean hunks, surface only real conflicts. This is what ADR 0012 already promised ("merge 3-way, hunk by
  hunk"). **Feasible here because the constitution is already template-rendered** (`constitutionTemplate`
  version in the manifest) → the base is recoverable by re-rendering the install-time template version with
  the same personalization params. _Prior art: git 3-way merge._
- **1 — Conffile fallback** (the simplest net). On conflict: **keep theirs**, drop the new version
  **alongside** (`CLAUDE.md.new`), and **tell the user**. Manual merge, zero auto-merge risk.
  _Prior art: Debian `dpkg` conffiles / `ucf`, `.rpmnew`._

Always **opt-in and non-destructive**: no silent overwrite, ever. The same logic would replace the frozen
install-if-absent behavior for shipped skills.

## Open questions / caveats (for the ADR)

- [ ] **Legacy migration is the hard part.** Existing brains have a **monolithic** `CLAUDE.md` with personal
  edits scattered anywhere — the `ENGINE:BEGIN/END` boundary cannot be inferred retroactively without risk
  of capturing a personal edit inside the engine block. Option 3 needs a migration story (likely lean on the
  2/1 net for the first jump, or introduce the boundary only on fresh installs + a guided one-time migration).
  _(Sequencing + safety framing decided 2026-07-18, see "Sequencing decision": fresh installs get the
  boundary; deployed monoliths stay sacred/untouched and are re-layered later via an opt-in, QA'd upgrade,
  never inferred blindly. The retro-fit split algorithm itself still to design.)_
- [ ] **Editing an engine *instruction*** (not just adding one's own) — prose doesn't override like CSS;
  decide whether that's supported (probably via the personal zone / overrides, or accepted as out-of-scope).
- [ ] **Where the base lives** for option 2 (store the rendered base, or the template version + params to
  re-render). Keep it engine-owned, read-only to the user.
- [ ] **`engine-manifest.json` itself** is currently in **no regime** — confirm it is engine-owned (it should
  travel in `replace`) and never user-edited (the "read-only little paper" Thomas described).
- [ ] **Skills** follow the same model (managed vs user-authored; user-authored already fully safe via the
  `SACRED_TREES` `.claude/skills/` rule).

## Why this is non-blocking today

Upgrading an **already-configured** brain (edited constitution, custom skills) is **safe right now**, for three
independent reasons — so this enhancement is not required to ship any current release:

1. **No release has ever changed the constitution.** `constitutionTemplate` has been `1.0.0` across every
   version (rag 1.1.0 → 1.1.5) → there is literally nothing to propagate yet.
2. **The reconciler never clobbers user-edited files** — `CLAUDE.md` is `SACRED`, custom skills live under
   the `.claude/skills/` sacred tree, the vault and `.env` are sacred (write-allowlist, ADR 0012).
3. **A stale constitution cannot break the engine** — it is instructions for Claude, not code the engine
   executes; the RAG / MCP / hooks work regardless of its content.

This enhancement becomes relevant only the day a release *does* change the constitution (a `constitutionTemplate`
bump). Until then, the current install-if-absent / sacred behavior is the correct, safe default.

## Sequencing decision (2026-07-18) — after the personal-brain migration; broaden to the fleet's upgrade experience

> **Cross-plan order:** this section is Gate 1 (green) and Gate 4 (fleet re-layering) of
> [`../ROADMAP.md`](../ROADMAP.md), the ordering authority. This plan owns the *how*; the ROADMAP owns
> the *order relative to the migration*.

**Decision.** Build the *legacy re-layering* (retro-fitting existing monolithic brains) **after** the personal
second-brain migration (`second-brain-migration-and-engine-upstream-action.md`, Track D). Ship **only** the
*legacy-safe fresh-install layering* **before** that migration's generate step, so the regenerated personal
brain is born two-layer. This surfaced while realising the concern is broader than the constitution merge: it
is the **whole upgrade experience for the brains already deployed in the field** from an earlier Kenjaku
release (the pre-layering, monolithic-constitution line, ~v3.2.x).

- [x] **Fresh-install layering ("green") is a prerequisite of the migration's generate step, and must be
      legacy-SAFE by construction.** _(2026-07-18 · f998259)_ Did **not** remove `CLAUDE.md` from `SACRED_FILES`
      (`scripts/lib/engine-apply-plan.mjs:32`): that would expose every deployed monolithic brain to a clobber
      on its next update. Instead **added a new engine-owned constitution layer file** `CLAUDE.engine.md`
      (generic, token-free) that a fresh, thin, sacred `CLAUDE.md` `@import`s — **EN and `templates/fr/` both**.
      Deployed monolithic brains keep their sacred `CLAUDE.md` untouched (they simply lack the new file).
      **Refinement vs the original sketch — `CLAUDE.engine.md` is NOT put in `replace` yet.** Putting it in
      `replace` would refresh it verbatim from the (English) repo on every upgrade → a **French** brain would
      be **re-anglicized**. So green ships the *structure* only (fresh installs born two-layer, legacy-safe);
      the actual **propagation** of the engine layer to brains is folded into Gate 4, which must first make it
      **locale-aware**. The shipped apply-plan therefore touches neither `CLAUDE.md` nor `CLAUDE.engine.md`.
  - [x] **Green-time "do-no-harm" QA:** _(2026-07-18 · f998259)_ locked by a test on the shipped manifest —
        the plan touches NEITHER `CLAUDE.md` NOR `CLAUDE.engine.md` (no clobber, no reindex, no behaviour
        change). Trivially safe while the engine layer is not yet propagated to deployed brains.
  - [ ] Field-verify a real fresh two-layer install (EN + FR) when Gate 3 generates the personal brain.
- [ ] **The heavy re-layering QA is safely deferred to AFTER the migration.** The deployed fleet is safe in the
      interim, for the reasons in "Why this is non-blocking": sacred `CLAUDE.md`, `constitutionTemplate` frozen
      at `1.0.0`, a stale constitution cannot break the engine. Nothing forces their upgrade.
- [ ] **The deferred chantier is the fleet's UPGRADE EXPERIENCE, not only the constitution merge.** Scope:
  - [ ] **(A) Completeness across a big jump.** `update-engine` is **state-convergent** (fetch the latest ref,
        apply the current manifest's regimes → one jump converges to target; the manifest + reconciler are
        present since before v3.2.1), so no intermediate versions are replayed. The remaining completeness gap
        is exactly the **frozen** files: the constitution (this plan) and the shipped user-skills under
        `.claude/skills/` (`coach`, `prepare-1-1`, … install-if-absent). Close them the same way.
        **Now explicitly owns the engine-layer propagation deferred from Gate 1:** move `CLAUDE.engine.md`
        into a refreshed regime **locale-aware** (a FR brain must receive the FR engine layer, never the EN
        one), so an upgrade actually delivers constitution improvements without re-anglicizing localized brains.
  - [ ] **(B) Tell the user what they gained.** A human, benefit-framed changelog spanning the jump (from the
        brain's recorded ref to target), surfaced at upgrade. Reuse the "The One With…" release codenames as the
        substrate; suited to non-technical owners.
  - [ ] **(C) Pre-flight preview (say it BEFORE upgrading).** A dry-run that computes the apply plan **and the
        reindex decision** (recorded vs target `indexSchemaVersion`) and shows it before applying: what lands,
        and whether notes will be re-encoded + the rough cost. Today `update-engine` reports reindex only
        *after* (`scripts/update-engine.mjs:15`, `runReindex` IFF the schema moved); expose it *ahead*.
  - [ ] **Grounded reindex fact (CORRECTED 2026-07-27, was stale).** `indexSchemaVersion` was `1`
        continuously from 2026-06-14 until the **universes** commit `3d85060` (v3.6.0), which moved the
        **engine constant** to `2` (`rag/src/lib/vector-store.ts:63`). The **manifest was never bumped**
        (still `1`), so `update-engine` today triggers neither a reindex nor a warning, and a stamped-`1`
        brain instead hits the runtime stale-schema gate on its first search. See §"Side-finding" below:
        this is exactly the case (C) was meant to make honest, and it is now live, not hypothetical.
  - [ ] **QA fixtures:** reproduce legacy brains from the release **tag(s)** (checkout the deployed version, run
        the installer) + **synthetic** personal edits to exercise the nasty boundary cases. Never use real
        deployed brains' private content. First step: **enumerate the versions actually deployed** so QA covers
        the real span.
- [ ] **This deferred chantier likely graduates to its own plan** ("engine upgrade experience for the deployed
      fleet") when picked up; F-B7e (constitution re-layering) becomes one component of it.

> Cross-ref: the reciprocal prerequisite note lives in the migration plan's Track D.

## Increment 2.5 (decided 2026-07-27) — refresh an UNTOUCHED engine skill, pulled forward from Gate 4(A)

> **Status:** 🟠 NEXT TO EXECUTE (ROADMAP Gate 2.5). Owns the *skills* half of Gate 4(A) only; the
> constitution half (`CLAUDE.engine.md` propagation) stays in Gate 4.
> **Why it jumped the queue:** the propagation gap is no longer theoretical, and the fleet is growing.

### The trigger (evidence, 2026-07-27)

The gap this plan describes is **already biting, in the field, on shipped releases**:

- **12 commits** have touched `.claude/skills/**` since `v3.2.2`. **None** of them reached a brain that
  already had the skill.
- Concretely: `4e43e70` (shipped in **v3.6.2**) added 22 lines to `.claude/skills/switch/SKILL.md` (the
  single-account native-connectors reminder). A brain installed at **v3.6.0 / v3.6.1 will never receive
  it**, even after `/update-engine`, because its skill directory exists. Meanwhile the matching
  deterministic core (`scripts/lib/universes.mjs`, a `replace` glob) **is** refreshed → a live
  **core/skill drift**.
- The installed base is growing (public communication started), so the share of the fleet frozen on old
  skills grows monotonically. Every skill improvement shipped before this increment is invisible to it.

### The decision

**Refresh an engine skill if, and only if, we can PROVE nobody touched it.** The proof already exists on
every deployed brain: the installer records a **sha256 provenance base per `merge` file** in
`engine-manifest.json` (`installer.mjs` / `engine-source.mjs`, `fingerprint()`), and `reseedProvenance()`
refreshes it after each update.

- **Hash matches the recorded base** → the file is byte-identical to what the engine last delivered →
  **overwrite it**. This is the overwhelming majority of users.
- **Hash differs** → the owner customized it (the documented `prepare-1-1` "refine to your own KPIs" case)
  → **touch nothing**, drop the new version alongside (`SKILL.md.new`, option 1 "conffile fallback" above)
  and **say so**.

This does not weaken ADR 0012's write-allowlist: we only ever overwrite a file we can prove is untouched,
which is strictly safer than what `update-engine` already does daily on `rag/src/**`.

### Where it lives, and why one pass is enough

The home is **`reconcileBrain`** (it already does the install-if-absent of engine skills), behind an
explicit guard:

- [ ] **Guard: `sourceDir !== brainDir`.** The reconciler has three callers and they do not share a
      contract:
  - **`auto-finalize`** (ADR 0026 Layer A, `scripts/update-engine.mjs` step 8) re-execs the
    **freshly-written** reconciler in a child process with the **fetched** `sourceDir`
    (`scripts/lib/auto-finalize.mjs:28`) → new skill content is available → **refresh here**.
  - **SessionStart self-heal** passes `sourceDir === brainDir` (`scripts/session-self-heal.mjs:161`,
    local converge, no network) → no new content, and no user asked for anything → **never refresh**.
  - The parent `update-engine` process itself runs the OLD code; it does not matter, because
    auto-finalize re-runs the NEW reconciler from disk.
- [ ] **Rule to hold, stated once:** *a skill is only ever overwritten during an update the owner
      explicitly asked for, never silently at session start.* ADR 0026's "additive" invariant keeps
      holding exactly where it matters.
- [ ] **Convergence is ONE pass** for every brain at **v3.3.0+**, because auto-finalize already
      "collaps[es] the historical 2-cycle into a single invocation". No second `/update-engine`.
- [ ] **Pre-v3.3.0 tail** (no auto-finalize in their installed orchestrator): decide whether to carry
      them with the proven **message-in-a-bottle** vector (`rag/postinstall-restart-notice.mjs`, commit
      `2ce1556`) — the old orchestrator always runs `npm install` with `stdio:"inherit"`, and npm runs the
      **new** `postinstall` already on disk, so new code executes under the old orchestrator on the FIRST
      update. ADR 0025 already documents this cohort as "heals on its next update", so a 2-cycle fallback
      is an acceptable answer too. **Decide, do not drift.**

### The two real traps (neither is about the delivery mechanism)

- [ ] **T1 — Provenance re-seed, or the feature silently dies after one use.** After refreshing a file we
      MUST rewrite its provenance entry. Otherwise, at the next update, the refreshed file no longer
      matches the recorded base, gets classified "user-modified", and is **never refreshed again**. Today
      `reseedProvenance` only covers the `copied` bucket (`scripts/update-engine.mjs` step 7); refreshed
      skills must be folded in. **A test must lock this** (refresh twice in a row, second run is a clean
      no-op, not a "user-modified" verdict).
- [ ] **T2 — Locale, or we re-anglicize French brains.** 8 of 9 shipped skills have a French source under
      `templates/fr/.claude/skills/<name>/SKILL.md`. Refreshing from the repo root would replace a FR
      brain's skills with EN ones. This is the exact trap that kept `CLAUDE.engine.md` out of `replace`
      (see the Gate 1 refinement above). The machinery exists but points the other way:
      `engine-copy-select.mjs` **excludes** locale-owned paths from the copy; here we must instead
      **resolve the source per locale**. The brain records its locale (`scripts/lib/demo-locale.mjs`).
      `switch` and `local-mirror` have no FR source today: decide whether that is a gap to fix or a
      deliberate EN-only surface.

### Tracking

- [x] **Step 1 — Pure core: the refresh verdict** (TDD, injected fs, no side effects). Given the installed
      file, the recorded provenance base and the candidate new content → `refresh` / `preserve` /
      `absent-install`. Triangulate: no base recorded (pre-provenance brain), base recorded but file
      missing, identical content already (no-op), CRLF/LF drift. _(2026-07-27 · `scripts/lib/engine-skill-refresh.mjs`)_
  - [x] Two refinements the tests pulled out, worth carrying into Step 5's prose: `preserve` carries a
        **reason** (`customized` vs `no-provenance`) so a pre-provenance brain is never reported as a
        customizer, and a 4th verdict **`unchanged`** keeps a converged brain byte-identical (no
        auto-commit churn).
  - [x] **CRLF decision:** line endings are not authorship. A file matching the base *modulo* EOLs counts
        as untouched (else the whole Windows fleet freezes as "customized"), and a CRLF copy of the
        candidate is `unchanged`, not a rewrite-to-LF at every update.
- [x] **Step 2 — Locale-aware source resolution** (T2). Pure function: brain locale + skill name +
      source tree → the file to deliver. Test EN and FR, and the no-FR-source case.
      _(2026-07-27 · `resolveLocaleSource` in `engine-copy-select.mjs` + `brain-locale.mjs`)_
  - [x] The brain's locale is read from **its own** `scripts/lib/demo-locale.mjs` marker
        (`readBrainLocale`), not from the tree the code runs from — the marker is locale-owned (F2), so
        an update never overwrites it and it stays truthful for the brain's lifetime. No marker → `en`,
        never a crash.
  - [x] **`switch` / `local-mirror` have no FR source: resolved as "fall back to the root", not a gap to
        block on.** The root is exactly what a FR brain received at install, so refreshing from it is a
        same-language update. Writing the FR versions stays a content task, independent of this increment.
  - [x] **Finding — the STAGED skills have no provenance base at all:** the manifest's `merge` regime
        lists 9 skills, and provenance is recorded for `merge` files only. A staged skill is never
        fingerprinted → `preserve: no-provenance` forever.
    - [x] **It is not just `local-mirror`: 6 skills** are staged (`consolidate`, `file-back`, `lint`,
          `local-mirror`, `mcp-token-expired`, `open-note`). The drift is already on disk: `engine-skills/**`
          is `replace`, so every brain's SOURCE copy is updated at each update while the INSTALLED copy
          under `.claude/skills/` stays frozen.
    - [x] **Why it was never done (not an oversight):** the sacred scrub strips `.claude/skills/` from
          `replace` (it is what protects the owner's skills), so a skill bound for EXISTING brains cannot
          be delivered by copy. Hence the 2026-06-21 relocation to the non-sacred `engine-skills/<name>/`
          + install-if-absent (ADR 0026 amendment). Provenance follows `merge`, so staged skills got none —
          invisible until something started refreshing skills at all.
    - [x] **DECIDED (2026-07-27, Thomas): treat the staged 6 exactly like the other 9.**
    - [x] **How, without touching the manifest:** the brain's OWN `engine-skills/<name>/` copy, read
          BEFORE the update overwrites it, is byte-for-byte what the engine last delivered — i.e. a free,
          retroactive provenance base for the whole deployed fleet (install-if-absent copied that very
          subtree). Captured ahead of the copy step, `engine-skills/<name>/**` mapped to
          `.claude/skills/<name>/**`, and the existing verdict applies unchanged.
          _(2026-07-27 · `readStagedProvenance` + `refreshableSkillPairs`)_
      - [x] **Self-maintaining, so nothing to re-seed:** `engine-skills/**` is a `replace` glob, so the
            copy step refreshes the staging tree at every update — the base for the NEXT update writes
            itself. `reseedProvenance` filters to `merge` files and ignores these paths: correct as is.
      - [x] The read-before-copy ordering is **locked by the refresh test**, not by a comment: read it
            one line later and the base is the NEW content, every staged skill reads "customized", and
            the test fails loudly (mutation-checked).
- [x] **Step 3 — Wire into `reconcileBrain`** behind the `sourceDir !== brainDir` guard. Assert by test
      that a SessionStart-shaped call (`sourceDir === brainDir`) refreshes **nothing**.
      _(2026-07-27 · `refreshUntouchedSkills` in `engine-skill-refresh.mjs`, step 2.bis-refresh)_
  - [x] Runs AFTER install-if-absent, so a brand-new skill dir is installed once and then reads as
        `unchanged` — the two passes compose instead of fighting.
  - [x] Scope locked by the selector: `merge`-declared files **under `.claude/skills/`** only. The
        constitution and the engine-owned scripts (also `merge`) stay out — Gate 4 keeps the
        constitution half.
  - [x] Reported per SKILL (`skillsRefreshed`, `skillsPreserved: [{skill, reason}]`), not per file.
  - [x] Self-heal test proves the guard is observable: a customized skill is neither rewritten NOR
        reported at session start (no nagging), while the same fixture under an explicit update reports
        it preserved.
- [x] **Step 4 — Provenance re-seed for refreshed files** (T1), with the refresh-twice test.
      _(2026-07-27 · `runReconcileCli` + `update-engine.mjs` step 7)_
  - [x] **BOTH writers had to be covered, not one:** the auto-finalize child (`runReconcileCli`) is the
        last writer of the manifest on the update path, and on the FIRST update carrying this feature
        the parent still runs the OLD code, so the refresh happens there. It now re-seeds and persists.
  - [x] The parent's step 7 folds `refreshedFileMap` into `deliveredFileMap`. It rebuilds the manifest
        from the `local` copy read BEFORE the reconcile, so without this it would silently overwrite the
        child's re-seed with the stale base.
  - [x] Locked by the refresh-twice test: the second run reports **neither** a refresh **nor** a
        `customized` preserve.
- [x] **Step 5 — Report what happened**, in the `update-engine` summary: which skills were refreshed,
      which were **preserved because customized** (naming the `.new` file). Deterministic prose (ADR 0009),
      unit-tested, relayed verbatim by the skill. _(2026-07-27 · `formatReport` + `refreshUntouchedSkills`)_
  - [x] **The `.new` sidecar is now actually written** (it was decided in §The decision but no code
        dropped it): on `preserve: customized` only. `no-provenance` gets **no** sidecar and **no**
        report line — we cannot prove anything there, and littering an older brain with 9 unexplained
        `.new` files would be noise, not a choice offered to the owner.
  - [x] **A stale `.new` is cleared** on any other verdict: once the owner adopted the new version (or
        we refreshed the file ourselves), a surviving sidecar keeps claiming "something newer awaits".
  - [x] **A refresh-only update still raises the restart banner** (report + the CLI's persistent restart
        flag): a refreshed skill is loaded at session start, so THIS conversation still runs the old
        text. Counted as a *change*, never as a *new capability* (no counter, no "run once more").
        The steady-state line now says "your engine was updated on disk" (true for a skill too).
  - [x] The `update-engine` skill relays both lines (EN + `templates/fr`), and its "genuine no-op"
        carve-out now includes "no skill brought up to date" — else a refresh-only update would
        wrongly skip the restart banner.
- [x] **Step 6 — Pre-v3.3.0 tail: DECIDED (2026-07-27) → the message-in-a-bottle (option A).** Carry the
      cohort with `rag/postinstall-restart-notice.mjs`'s proven vector so a pre-v3.3.0 brain converges on
      its FIRST `/update-engine`, not its second. _(2026-07-27 · `4279fd4` code + `438606d` skill rule)_
  - [x] **Why A and not the documented 2-cycle (Thomas, explicitly):** today it is simply the better user
        experience, and the goal right now is **market share** — widening the installed base. A newcomer
        on an old engine must not silently keep frozen skills until they happen to update twice.
  - [ ] **Exit condition (do not let this become mystery debt):** the bottle is a *transitional* vector.
        When the pre-v3.3.0 cohort has shrunk, delete it and fall back to option B (2-cycle, already
        documented by ADR 0025). Whoever removes it should find this line, not archaeology.
  - [x] Fail-soft is not optional here: the bottle runs inside `npm install`: a throw would abort the
        install and break the update. Same discipline as the existing restart notice (never throws,
        swallowed by the CLI wrapper). _(inherited: the new banner rides the same try/caught `main()`)_
  - [x] **Design settled BEFORE coding (2026-07-27) — the bottle PRINTS a directive, it does not
        refresh.** Making the postinstall run the refresh itself looks obvious and does not survive
        contact with the facts:
    - [x] **It has no source to refresh FROM.** The merge skills' new content exists only in the
          orchestrator's temp clone, whose path the postinstall never learns; and the manifest still
          records the OLD `source.ref` at that moment (step 7 writes it AFTER `npm install`), so
          re-fetching from it would pull the version being replaced.
    - [x] **The staged base is already gone.** `engine-skills/**` is a `replace` glob copied BEFORE
          `npm install`, so by postinstall time the staging tree holds the NEW content. Comparing
          against it would call every outdated-but-untouched skill "customized" and litter the brain
          with `.new` files: the exact opposite of the promise.
    - [x] **A reconcile inside `npm install` recurses.** `reconcileBrain` runs `npm install` itself →
          postinstall → reconcile → … Any refresh-from-the-bottle needs a re-entrancy guard that the
          print-only vector does not.
    - [x] **Therefore:** the bottle prints a directive addressed to the AGENT ("this brain ran a
          pre-auto-finalize orchestrator — run `node scripts/update-engine.mjs` once more, now"),
          exactly like `restartNoticeBanner()` does today, and the `update-engine` skill carries the
          matching rule (EN + `templates/fr`, incl. **why it cannot loop**: the first pass records the
          new versions, so the second postinstall is silent). The user still asks ONCE and ends up
          converged in the same interaction, with zero new execution path inside npm.
    - [x] **Cohort signal (deterministic, no guessing):** auto-finalize shipped in **v3.3.0**, whose
          manifest records `engineVersion.scripts: "1.1.0"` (`7105a7a`, released by `423d7e4`). At
          postinstall time the manifest still holds the brain's OLD versions, so
          `recorded scripts < 1.1.0` ⇒ the orchestrator that is running has no auto-finalize. Same
          read-the-stale-manifest trick the restart notice already relies on.
      - [x] **Two refinements the tests pulled out.** (a) An **absent or unparsable** `scripts` version
            counts as *older* than the floor — a manifest without the key predates it, and one extra
            converging update is cheaper than a permanently frozen skill set. (b) The cohort test is
            **conjoined with the update-in-flight signal** (`recorded rag !== package rag`), because the
            SessionStart self-heal runs `npm install` too: without it, every session start on an old
            brain would nag the owner to update.
    - [x] Testable halves, as for the restart notice: a pure `shouldFinishRefresh({...})` predicate +
          a pure banner; the I/O `main()` stays thin glue.
      - [x] **Side-fix — the bottle's suite was running in NO CI job:** the harness step globs
            `scripts/**` and rag's `npm test` globs `src/lib/*.test.ts`, so `rag/*.test.mjs` fell
            between the two. Added to the harness step (dependency-free `.mjs` seams belong there).
      - [x] The three cohorts were also smoke-run through the real `main()` on fixture brain layouts
            (old scripts → both banners; modern → restart only; converged → silence).
- [x] **Step 7 — ADR:** amend **0026** (the reconciler gains a conditional, provenance-gated overwrite,
      scoped to explicit updates) and cross-note **0025** (its "out of scope, belongs to a future 3-way
      merge" consequence is now partially closed). Keep the `Scope:` field per `CONVENTIONS.md`.
      _(2026-07-27 · `2e49008`)_
  - [x] Amended **in place** per `CONVENTIONS.md` §6bis (same topic: what the reconciler may write) and
        written **timelessly** per §6ter — no "amended" scars, no autobiography. Landed as Decision §8 +
        a third nominative carve-out in the safety invariant, with the Crux guarantee corrected (it
        claimed the reconciler only ever *adds*) and the STATUS line moved from two exceptions to three.
  - [x] Rejected alternatives recorded so nobody re-litigates them: version/date instead of hash,
        refreshing at SessionStart, refreshing from the root regardless of locale, 3-way-merging prose,
        making the bottle refresh instead of print, and leaving the old cohort on the 2-cycle.
- [x] **Step 8 — QA on fixtures** reproduced from real release tags (v3.2.2 / v3.6.0 / v3.6.2), with
      synthetic personal edits. Never use real deployed brains' content. Verify the `4e43e70` case
      end-to-end: a v3.6.0 fixture must end up with the v3.6.2 `switch` skill.
      _(2026-07-27 · `c2590ae` · `scripts/lib/release-fixture-refresh.test.mjs`)_
  - [x] **Automated, not a one-off session:** the fixtures are the tags' own bytes, captured with
        `git show <tag>:<path>` into `maintainers/qa/release-fixtures/<tag>/` (under `maintainers/`,
        so no brain ever carries QA payload), and the **source is this repository at HEAD** — the
        assertions are about released content. `v3.6.2` needed no fixture: `switch/SKILL.md` is
        byte-identical from v3.6.2 to HEAD, so "ends up at HEAD" *is* "ends up at v3.6.2".
  - [x] **Found a real defect, and fixed it (`c2590ae`): a skill delivered by install-if-absent got
        NO provenance base**, so it read `no-provenance` at every later update and was frozen the day
        it arrived — the freeze this increment removes, re-entering by the other door. It bit exactly
        the cohort we are serving: a v3.2.2 brain receiving `switch` would never have received a
        later improvement to it. Both manifest writers on the update path now re-seed it.
  - [x] Two test-side lessons worth keeping: use the **production** `fingerprint` / `reseedProvenance`
        in a fixture test (a hand-rolled sha256 silently disagreed with the manifest's `sha256:` prefix
        and turned every untouched skill into "customized"), and simulate the update path with the same
        helpers it uses, or the QA proves something the product never does.
- [ ] **Step 9 — Docs:** SETUP / the `update-engine` skill wording ("your customized skills are never
      overwritten; you are told when a newer version is available"). Includes the stale claim in
      `.claude/skills/update-engine/SKILL.md` §What it touches — "any engine skill you already have" is
      no longer in the untouched column (an *untouched* one is now refreshed; a *customized* one is not).
- [ ] **Step 10 — Mutation testing on the impacted surface, LAST, right before the merge** (asked by
      Thomas, 2026-07-27). The objective signal for this increment is the mutation score, not line
      coverage: the whole feature is a decision tree (`refreshVerdict`), a guard (`sourceDir !==
      brainDir`), a re-seed and prose branches — precisely where a surviving mutant means a brain
      silently loses its customization or never gets refreshed again.
  - [ ] Scope: `scripts/lib/engine-skill-refresh.mjs`, the refresh block of `scripts/lib/reconcile-brain.mjs`,
        `reseedProvenance` + step 7 of `scripts/update-engine.mjs`, and `formatReport`'s new branches.
  - [ ] Kill every surviving mutant with a test (or record why it is equivalent). Watch specifically:
        the `reason` discrimination (`customized` vs `no-provenance`), the EOL normalization, the
        `.new` write/clear conditions, and the guard's equality.

### Side-finding (2026-07-27) — the schema-bump warning was never wired

Independent of the above, found while auditing the fleet path. **Do NOT fix it inside increment 2.5**
(bumping the manifest triggers a fleet-wide reindex; keep that as its own deliberate change).

- `rag/src/lib/vector-store.ts:63` has `INDEX_SCHEMA_VERSION = 2` (moved by the universes commit
  `3d85060`), but `engine-manifest.json` still declares `"indexSchemaVersion": 1`.
- `scripts/lib/reindex-trigger.mjs:15` compares those two manifests → `update-engine` **neither reindexes
  nor warns**, contrary to what ADR 0034's Consequences and the ROADMAP invariant both claim.
- **Not a corruption, and not silent:** brains whose index was stamped `1` (i.e. indexed under v3.0.0 →
  v3.5.x) get `staleSchemaMessage()` on their **first search** after upgrading, and the forced full
  re-encode restamps correctly. An index predating schema versioning (stamp `null`) is grandfathered.
  The SQLite side is clean too: `applySchema` adds `documents.universe` out of band with
  `NOT NULL DEFAULT 'default'`, so an old index never errors.
- [ ] Decide: bump the manifest to `2` (proactive, one fleet-wide reindex, honest warning up front) vs
      leave the runtime gate to handle it (status quo, surprise at first search). Then align ADR 0034's
      Consequences and the ROADMAP invariant with whatever is true.

## Next steps (post-demo)

- [ ] Promote this analysis into a dedicated **ADR** (lead with a Crux; name the prior art — §6quater/§6quinquies
  of `CONVENTIONS.md`); amend ADR 0012 in place if it changes the merge-regime mechanics.
- [ ] Decide the legacy-migration path (the gating caveat above).
- [ ] Plan + TDD the implementation as its own change, **not** under release pressure.
