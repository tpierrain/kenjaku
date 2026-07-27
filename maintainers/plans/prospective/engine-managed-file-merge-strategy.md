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

> **Status:** ✅ SHIPPED in **v4.1.0** _(2026-07-27 · PR #47 · `163d882`)_ — "The One Where the Engine
> Refreshes Its Skills, but Never Yours". Owns the *skills* half of Gate 4(A) only; the constitution
> half (`CLAUDE.engine.md` propagation) stays in Gate 4, which is why this plan stays prospective.
> **Why it jumped the queue:** the propagation gap is no longer theoretical, and the fleet is growing.
> **Still open here, on purpose:** Step 6's exit condition (retire the pre-v3.3.0 bottle once that
> cohort has shrunk) and the §Side-finding decision on `indexSchemaVersion` — both deliberately out of
> this increment's scope, neither blocking the release.

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
- [x] **Step 8.5 — `/code-review` of the whole increment BEFORE going further** (asked by Thomas,
      2026-07-27, to run right after his `/clear`). Nothing else moves until its findings are triaged:
      a review is worth most while the branch is still open and the design fresh, not after Step 10
      has polished the tests around whatever it would have flagged. **Ran 2026-07-27** (ultrareview,
      27 files / +2558 −48): **2 findings, both `nit`, both verified real, both fixed now.**
  - [x] Scope: the branch diff `feat/engine-skill-refresh` vs `main` — the refresh core, its wiring in
        the reconciler, both manifest re-seed paths, the postinstall bottle, the report prose, and the
        release-tag QA suite.
  - [x] Triage each finding into: fix now (before Step 9), fold into Step 10's mutation pass, or
        record as deliberate. **Answer every one of them in this plan** — an unanswered review finding
        is exactly the kind of thing a `/clear` erases.
  - [x] **F1 (nit) — ADR 0026 still announced "the two narrow, nominative carve-outs below" while this
        increment added a third** (the skill-content exception, joining vault + settings). The STATUS
        line at the top had been updated to "three" in the same amend, the invariant intro had not, so
        the ADR disagreed with itself. **Verdict: FIX NOW.** _(2026-07-27)_ One word, plus a
        **`Subtree-complete`** bullet added to the §8 enforced-tests list to record what F2 locked.
        Amend-in-place (CONVENTIONS §6bis) only pays off if the amended doc reads as one coherent whole.
  - [x] **F2 (nit) — the `absent-install` verdict was silently dropped by the I/O wrapper.**
        `refreshUntouchedSkills` dispatched on `refresh` and `preserve` only, so the verdict its own
        docstring promises ("nothing on disk → deliver it") produced no write, no report, no provenance.
        Combined with install-if-absent deciding at the **skill-DIR** level (`reconcile-brain.mjs` step
        2.bis: dir exists → `continue`), a file a release adds **under an already-installed skill**
        (`.claude/skills/coach/references/…`, well within the `**` merge glob) would reach **no**
        deployed brain, ever: this increment's own core/skill drift, one level deeper.
        **Verdict: FIX NOW** _(2026-07-27)_ — TDD, two red-first tests then a one-line branch: the
        `absent-install` verdict now writes down the same path as `refresh` and folds the file into
        `refreshedFileMap`, so **both** manifest re-seed paths give it a base and it stays refreshable
        at the next update (the T1 sibling, third door). Fixed now rather than deferred because the code
        contradicted its own documented contract, and the fix is smaller than the note explaining it.
  - [x] **Correction to the review, recorded so it is not re-derived:** F2 claimed "coach has a
        `references/` folder in HEAD already". **It does not** — all 9 merge skills and all 6 staged
        ones ship a lone `SKILL.md` (`find` on the branch); the `references/radical-candor.md` it saw is
        a **test fixture** in `engine-skill-refresh.test.mjs`. So F2's field impact was **zero today**,
        strictly latent, which is why `nit` was the right severity: it was fixed for the first release
        that adds a sub-file, not for a brain in the wild.
- [x] **Step 9 — Docs:** SETUP / the `update-engine` skill wording ("your customized skills are never
      overwritten; you are told when a newer version is available"). Includes the stale claim in
      `.claude/skills/update-engine/SKILL.md` §What it touches — "any engine skill you already have" is
      no longer in the untouched column (an *untouched* one is now refreshed; a *customized* one is not).
      _(2026-07-27)_
  - [x] **`.claude/skills/update-engine/SKILL.md`** — the §What-it-touches row was the load-bearing lie
        and is now split in two: *engine skills you never edited* move to the **Updated** column, *any
        engine skill you tailored* stays in the **NEVER touched** one, with its `.new` sidecar named.
        Header promise and the Step-1 confirmation script realigned (the refresh is stated as a
        **benefit** the user is about to get, not a risk), frontmatter description included: it is what
        the harness reads to decide whether to load the skill at all, so a stale one mis-routes.
  - [x] **`templates/fr/.claude/skills/update-engine/SKILL.md`** — same three edits, written in French
        (deliberate product localization, never anglicized). The FR table was **two ADRs behind**, not
        just one: it still lacked the ADR 0025 install-if-absent rows (missing skills / missing MCP
        servers), so a French brain's table is realigned with the EN one in the same pass rather than
        left half-true. Also fixed "identiques **au** octet près" → "à l'octet près".
  - [x] **`SETUP.md` §10** — the refresh gets its own numbered step in "What it does, step by step"
        (the list jumped straight from the write-allowlist to `npm install`), phrased around the
        *proof*: the brain fingerprints what it delivered, so it can prove what you never touched.
        The "never touches" sentence and the one-line report summary now name the tailored-skill case
        too, and step 7 says why provenance is re-seeded (it keeps the delivery refreshable next time).
  - [x] **Left alone on purpose:** SETUP §"Sacred by construction" already said "anything under
        `.claude/skills/` **you customized**" — accurate as written, so it is not re-touched.
- [x] **Step 10 — Mutation testing on the impacted surface, LAST, right before the merge** (asked by
      Thomas, 2026-07-27). The objective signal for this increment is the mutation score, not line
      coverage: the whole feature is a decision tree (`refreshVerdict`), a guard (`sourceDir !==
      brainDir`), a re-seed and prose branches — precisely where a surviving mutant means a brain
      silently loses its customization or never gets refreshed again.
  - [x] Scope: `scripts/lib/engine-skill-refresh.mjs`, the refresh block of `scripts/lib/reconcile-brain.mjs`,
        `reseedProvenance` + step 7 of `scripts/update-engine.mjs`, and `formatReport`'s new branches.
  - [x] Kill every surviving mutant with a test (or record why it is equivalent). Watch specifically:
        the `reason` discrimination (`customized` vs `no-provenance`), the EOL normalization, the
        `.new` write/clear conditions, and the guard's equality.
  - [x] **HOW TO RUN IT (re-derived the hard way 2026-07-27, do not lose this).** `mutate:changed`
        covers **only** `rag/` + `local-mirror` TS: our surface is `scripts/**`, which it deliberately
        skips. And the `stryker.scripts.config.mjs` default (`inPlace: false`, sandbox) **cannot work
        here**: the sandbox copy has no `.git`, so `engine-manifest-integrity` fails the DRY RUN and
        Stryker aborts before mutating anything. The working recipe is the one in `RESULTS.md`: a
        **disposable git worktree** + `--inPlace` (git present, deletions confined). Also: the HTML
        report's embedded literal is **JS, not JSON** (it splits `</script>` into `"<"+"script>"`),
        so parse it with `new Function`, never `JSON.parse`. First run: `npm install` in
        `maintainers/mutation/` (node_modules is not committed).
  - [x] **`scripts/lib/engine-skill-refresh.mjs` → 100 %** (119/119, no equivalent left to excuse),
        from **86.72 % / 17 survivors**. _(2026-07-27 · `6d6564b`)_ What the survivors actually were:
    - [x] **`preserve: no-provenance` had no I/O-level test at all** (only the pure verdict), so its
          report shape, its "writes no `.new`" rule and its stale-sidecar clearing were all unpinned —
          the last one being a claim ADR 0026 §8 explicitly makes. One test, three mutants.
    - [x] **Report speaks in SKILLS, refresh works in FILES.** No test had two files in one skill, so
          the per-skill dedup was invisible on both lists. Now covered both ways, asserting that
          reporting once still drops a `.new` **per file**. (Reachable only thanks to Step 8.5's F2.)
    - [x] **The staged-prefix guard was inert before this branch** (a loose file directly under
          `engine-skills/` is not a skill): with the verdict dropped it changed nothing. Now that an
          absent file is delivered, an unguarded prefix would write into the owner's skills root.
    - [x] **A base recorded on CRLF bytes** (Windows clone with autocrlf) matches only the RAW
          comparison. The drift case was covered; its mirror image was not.
    - [x] **The 5 sidecar-guard survivors were redundancy, NOT a test gap** — and are recorded here
          because the temptation to write them off as "equivalent" was the wrong call. `preserve:
          customized` rewrites the `.new` immediately after, so guarding the clear on the verdict
          cannot change a byte. Clearing **unconditionally** says the same in less code and the
          mutants vanish. Only production change of this step; suite green at 790.
  - [x] **`scripts/update-engine.mjs` → 98.49 %** (196/200, 3 equivalents), from **51.52 % / 96
        survivors**. _(2026-07-27 · `5a04fa4` seam + goldens, `a54a0b1` the last 20)_ **DECISION
        (Thomas, 2026-07-27): harden it IN THIS BRANCH**, not as a follow-up. The proposal to fix only
        this increment's own lines and defer the rest was **rejected** — do not re-propose it.
    - [x] **Qualified before acting: this is NOT a regression from this branch.** `update-engine.mjs`
          appears **nowhere** in `RESULTS.md`: it was never hardened. The "`scripts/**` is now fully
          hardened" line covered only the three enumerated worst files (`clear-example-notes`,
          `auto-push`, `auto-commit`) plus `scripts/lib/**`. So the baseline assumption written one
          bullet above is **wrong for this file** — corrected here so nobody re-derives it.
    - [x] **(a) This increment's own lines.** `L88 if (skillsRefreshed.length > 0)`: the `true` and
          `>= 0` mutants live, so nothing asserts that an EMPTY list writes **no** line. `L289`: this
          branch added the `report.skillsRefreshed?.length > 0` term to the restart-flag condition, and
          it sits inside the untested `if (isEntryPoint)` block. **Both covered by (c)+(d) below** —
          the empty-list case by the "quiet no-op" golden, `L289` by `needsRestart`'s own tests.
    - [x] **(b) Dead branch, not a missing test.** `L100`'s `newVersionPath ? … : ""` else-branch is
          **unreachable by construction**: `refreshUntouchedSkills` only ever emits `reason ===
          "customized"` **with** a `newVersionPath`, and `formatReport` `continue`s on every other
          reason. Delete the ternary rather than test-cover a state the producer cannot emit
          (mutation lesson #6: an unreachable branch is a design defect, not an exemption). **Deleted.**
    - [x] **(c) The composition root has no seam.** The whole top-level `if (isEntryPoint)` block
          (`L278-302`: newCaps arithmetic, the restart-flag write, the stdout/stderr paths) is
          **untested**, which is why ~40 of the 96 survivors cluster there. Extract testable seams
          (at least `needsRestart(report)` and the newCaps computation) instead of leaving it inert.
          **Done, and further than asked:** `countNewCapabilities`, `needsRestart`, `armRestartFlag`,
          `bareHookName`, plus `runUpdateCli(deps)` + `realUpdateDeps` (the `clear-example-notes`
          idiom) — the entry block is now pure wiring, and its guard is the canonical `isEntrypoint`
          (Windows paths / spaces, bug B2). `realUpdateDeps` gets its own test: a CLI wired to the
          wrong folder or a swallowing stream would otherwise run flawlessly against nothing. And the
          entry point is finally **spawned as a process** — safe because the committed manifest pins no
          `source` (integrity-tested), so it fails before it can fetch or write.
    - [x] **(d) The older prose branches** of `formatReport` (`L47-L143`: hook-name stripping regexes,
          the singular/plural `capability/capabilities` pair, the restart banner text, the
          "your notes were left untouched" line). Pre-existing, now in scope by the decision above.
          **Pinned by 4 golden assertions on the WHOLE report** (quiet no-op / everything-on / steady
          state / one-capability singular) rather than line-by-line regexes, each list carrying **two**
          entries so a dropped `, ` separator diverges. The anchored hook-name stripping became
          `bareHookName`, tested with the mid-path and mid-name decoys the anchors exist for.
    - [x] **Two honesty fixes the mutants surfaced** (not just tests): a target manifest with no
          `engineVersion` now reads `rag unknown` instead of `rag undefined` — it is printed **after**
          the update is done and recorded, so crashing or lying there is the worst option — and a
          rejection with no reason prints `no reason given` instead of leaving a ❌ over an empty line.
    - [x] **The 3 survivors left are EQUIVALENT, recorded so nobody re-hunts them.** (1) the
          `skillsPreserved = []` default mutated to `["Stryker was here"]`: its only use destructures
          `{ skill, reason }` and `continue`s on `reason !== "customized"`, so a string element yields
          undefined props and the exact same output. (2)+(3) `readFileSync(…, "utf8")` mutated to `""`:
          Node hands back a **Buffer**, and both values are only ever `JSON.parse`d or fed to
          `createHash().update()` — same bytes, same digest, no observable difference.
  - [x] **`reconcile-brain.mjs` + `engine-source.mjs`: MEASURED** _(2026-07-27)_ — `--mutate` flags **do
        not accumulate, only the last one applies**; ONE comma-separated value is the fix:
        `--mutate "scripts/lib/reconcile-brain.mjs,scripts/lib/engine-source.mjs"`.
        **`reconcile-brain.mjs` 69.14 % (54 survivors)** · **`engine-source.mjs` 81.40 % (8)**. Neither
        was ever audited before (same correction as `update-engine.mjs` above).
  - [x] Record the run in `maintainers/mutation/RESULTS.md` (before/after table, per CONVENTIONS §5bis),
        including the honest note that `update-engine.mjs` had never been audited before. _(2026-07-27)_
  - [x] **✅ ANSWERED (Thomas, 2026-07-27): HARDEN BOTH FILES FULLY, IN THIS BRANCH** — same standard
        as `update-engine.mjs`, i.e. take `reconcile-brain.mjs` and `engine-source.mjs` to ~100 %
        (every survivor killed or recorded as equivalent), **including the pre-existing ones this
        increment never wrote**. The two narrower options (increment-only lines; increment + the
        composition-root seam) were **put to him and declined** — do not re-propose either. The
        survivor map below is the work list, not a menu:
    - [x] **EXACT SURVIVOR MAP re-measured on `31ed87c`** _(2026-07-27, 4 min 28 s)_ —
          `engine-source.mjs` **81.40 %** (8) · `reconcile-brain.mjs` **71.43 %** (50 + 1 timeout).
          Recipe: disposable worktree + `--inPlace` + ONE comma-separated `--mutate`; the console
          output is truncated by the `| tail -N` in the recipe, so read the **HTML report** instead
          (`new Function`, never `JSON.parse` — the embedded literal is JS).
    - [x] **`engine-source.mjs` — 5 killable, 3 equivalent.** `L27` optional chaining ×2 (no `merge`
          regime / no manifest at all → must select nothing, never throw) · `L45` ×2 (`.trim()`
          dropped → a whitespace-only remote must still read as *no* remote; `?? ""` → a git fact
          with no `repo` key at all) · `L88` the manifest's trailing newline. Equivalent: `L27`'s
          `[] → ["Stryker was here"]` (a matcher for a glob no real path can equal) and the two
          `readFileSync(…, "utf8") → ""` (Node hands back a Buffer; both values are only `JSON.parse`d
          or `createHash().update()`-ed — same bytes, same digest, as already recorded for
          `update-engine.mjs`).
    - [x] **`reconcile-brain.mjs` — in scope by the increment's own rationale.** `L98` the
          `/\/\*\*?$/` skill-glob regex ×2 (anchor + optional `?`) · `L101` the `installedFileMap`
          read (Buffer-equivalent) · `L131` `local?.provenance` (a reconcile called with no `local`).
    - [x] **`reconcile-brain.mjs` — pre-existing, now in scope by the decision above.**
          **(i) `L145-199` MCP + hooks (~13):** `brainDir.split("\\")` ×2 (nothing asserts the
          SUBSTITUTED `{{PROJECT_ROOT}}` ever reaches the written files) · the `.mcp.json` / settings
          trailing newlines · `L194`'s 5 (the write guard: no test isolates *only* a statusLine
          repair, nor *only* a hook repair, and the converged fixture is already canonically
          formatted so an unconditional write changes no byte, cf. the `>= 0` survivors) · `L196` ·
          `L199`'s `["statusLine"]`. **(ii) `L220-242` (~6):** an EMPTY `regenerate` bucket is never
          exercised · `reindexReason`'s two string literals are never asserted by value · the
          `countVaultNotes({ brainDir })` argument is never observed (every stub ignores it and
          returns 0 — make the stub return a distinctive count). **(iii) `L269-317` the composition
          root (~22):** `flagValue`'s guard/arithmetic, the `--platform` fallback (`??` → `&&` must
          be caught by passing `--platform win32` and asserting it reaches `regenerateLaunchers`),
          the missing-flag throw + its message, `seams.x ?? default` (a stub returning a distinctive
          value discriminates), the `delivered.length > 0` write guard, the manifest newline, and the
          whole entry block.
    - [x] **The fix for (iii) is the KNOWN-GOOD pattern, not invention:** extract the entry block's
          body into an exported `runReconcileCliProcess(deps)` + `realReconcileDeps`, exactly as
          `runUpdateCli(deps)` / `realUpdateDeps` took `update-engine.mjs` from 51 % to 98 %. It makes
          the `catch` unit-testable (`throw null` / a bare string / an `Error`) and leaves the entry
          block as pure wiring, spawned once as a real process. **Also swap the hand-rolled
          `resolve(process.argv[1]) === fileURLToPath(import.meta.url)` guard for the canonical
          `isEntrypoint` helper** — every other script already uses it (bug B2); `reconcile-brain.mjs`
          is the last hold-out.
    - [x] **Finding, mid-flight, do NOT re-derive.** Emptying the `L100-101` copy loop leaves the
          whole suite GREEN, because Step 8.5's F2 gave the refresh pass an `absent-install` verdict
          that re-delivers the same bytes one block later. The two paths overlap; what still differs
          is the **headline** (`installedSkills` = a NEW capability, counted for the restart banner,
          vs `skillsRefreshed` = "brought up to date"). A first assertion on that contract is committed
          (`reconcile-brain.test.mjs`, test 1) but it **does not kill the mutant yet** — verified by
          hand: unmutated, 2.bis writes the file first, so the refresh sees it on disk with no base and
          returns `preserve: no-provenance`, leaving `skillsRefreshed` empty in BOTH worlds. The
          discriminator has to be something else (the probe used: `/tmp/probe.mjs` pattern — call
          `reconcileBrain` directly and print `installedSkills` / `skillsRefreshed` / `skillsPreserved`).
  - [x] Re-run the two files after hardening and update the RESULTS.md row (it currently says
        "not yet hardened" — an honest line that must stop being true or stay true on purpose).
  - [x] **AT THE VERY END — the ROOT-CAUSE retrospective (asked by Thomas, 2026-07-27): HOW did we
        come to write tests that score this badly, and what changes in the harness's TDD practice?**
        Not a summary of the survivors (RESULTS.md already holds those), but the *upstream* question:
        which habits produced them. Raw material is now abundant and concrete — four files audited in
        one branch (86.72 / 51.52 / 69.14 / 81.40 %) with the survivor causes written down per file.
        Look for the recurring shapes: one-regex-per-line assertions instead of goldens on the whole
        output, composition roots left with no seam (the ~40 + ~22 clusters), branches tested through
        the pure core but never at I/O level, mirror-image cases never triangulated (CRLF), and the
        "equivalent mutant" reflex used to excuse redundancy. Land it in
        `maintainers/mutation/RETROSPECTIVE.md` **and** feed whatever generalizes back into the
        `tdd-discipline` skill (§"Qualité des assertions"), so the lesson reaches every future project
        and not just this repo.
- [x] **Step 11 — Marketing-surface pass, AFTER the release** _(2026-07-27, asked by Thomas at v4.1.0)_.
      This increment is what created the standing rule, now `CONVENTIONS.md` §10: every release re-reads
      how Kenjaku is presented, hunting both what the release made **false** and what it made **true but
      unsold**. Verdicts below, including the boring ones (per §10, "not looked at" and "checked, nothing
      to do" must be distinguishable).
  - [x] **`README.md`, 3 promises broken by this very increment.** (a) *"It can only **add**, never
        overwrite … your notes, keys, constitution and skills stay untouched"* was exactly true the day
        before and is a half-truth now: rewritten around the **proof** (a file is refreshed only when its
        fingerprint shows you never edited it), with ADR 0026 added to the citation list. (b) *"an upgrade
        touches … never your notes, keys, constitution or skills"* → "nor any skill **you've made your
        own**". (c) the skills section sold tweaking without saying what tweaking **costs**: a tailored
        skill stops receiving engine improvements, which is a fair trade only if it is stated.
  - [x] **The gain, sold where a newcomer reads it**, not only in the release note: the self-upgrade
        bullet now says the ready-made skills come along too, and `EN-QUOI` §"Evolution" contrasts
        vendor-forced updates with "only when you ask, and never on what you tailored".
  - [x] **Boards: re-read, NOT re-rendered — deliberately.** `board-reliability` says "never overwrites
        your **notes**" and `board-anatomy` says `CLAUDE.md` is "never touched by upgrades" while
        `CLAUDE.engine.md` is "refreshed by upgrades": all three still true after this increment, and the
        `Skills` tile carries no promise at all. So no prompt edit and no re-render, which is a *result*,
        not an omission (re-rendering a board is expensive; §10 asks for the explicit decision).
  - [x] **`SETUP.md` needed nothing here** — Step 9 already rewrote §10 as part of the increment itself.

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
