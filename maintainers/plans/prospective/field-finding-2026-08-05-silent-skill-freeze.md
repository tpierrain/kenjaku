# Action plan — a skill frozen as "yours" that you never touched, and nothing said so

> **The field fact (mind-palace, 2026-08-05, engine v4.7.0 → v4.8.0).** The update reported
> `local-mirror` as **customized** and dropped a `SKILL.md.new` beside it. The owner asked for the diff.
> The installed file was **byte-for-byte the engine's own skill**, at the version shipped before the
> universes work: **zero lines of his**. It had been frozen since **2026-07-19** (install day) and would
> have stayed frozen forever, because a skill flagged customized is never refreshed again and **nothing
> ever says so**. He adopted the `.new` by hand — which is the fallback working, not the defect being
> absent.
>
> **Two defects, and the second is the one this repo cares about**: a provenance base that can be wrong,
> and a **freeze that is silent and permanent**. A brain that keeps quiet about being three versions
> behind is the same failure as an index that reports a resume it never attempts.

## What was measured (do NOT re-derive it)

All of this was read off the deployed brain and this repo's history on 2026-08-05/06. It is evidence,
not analysis to redo.

- **The brain's own git history**, `~/mind-palace`:
  - `.claude/skills/local-mirror/SKILL.md` → written at **install (2026-07-19)**, then not again until
    the owner's manual adoption on **2026-08-05**.
  - `engine-skills/local-mirror/SKILL.md` → **moved ahead on 2026-07-28** (commit `a98921f`, an engine
    update of 73 files that landed under a *session-start sweep* commit, `scripts` 1.7.0 → **1.8.0**).
  - So from 2026-07-28 on, the staging copy was **one release ahead of the installed copy**.
- **`engine-manifest.json` provenance on that brain**: 15 keys, and **no key for any staged skill** —
  by design, staged skills have no recorded base (`staged-skills.mjs`).
- **The base actually used** for a staged skill is the brain's own `engine-skills/<name>/` tree, read
  by `readStagedProvenance()` (`scripts/lib/staged-skills.mjs:35`) **before** the copy step of
  `reconcileBrain` (`scripts/lib/reconcile-brain.mjs:88`). That tree is a **`replace` glob**
  (`engine-skills/**`), i.e. the engine overwrites it at **every** update.
- **`refreshVerdict`** (`scripts/lib/engine-skill-refresh.mjs:62`) then reads base ≠ installed and
  returns `preserve / customized` — the only verdict that drops a `.new`, which is why the sidecar
  appeared and why the report used the *personalized* voice.
- **The refresh mechanism (Increment 2.5) shipped in v4.1.0** (`529a481`, 2026-07-27) — i.e. **after**
  the staging tree started moving on brains in the field.
- **Exposure re-checked on that brain, after adoption**: the nine staged skills (`consolidate`,
  `file-back`, `lint`, `local-mirror`, `mcp-token-expired`, `open-note`, `rag`, `univers`, `universe`)
  are now **byte-identical** to their staging copies, no `.new` pending, and every merge skill has a
  provenance base. **Only `local-mirror` was affected there** — the others were installed *after* the
  drift window, which is exactly why they escaped.

## The mechanism, in one paragraph

The base that proves "nobody touched this skill" is not **recorded**, it is **re-derived from a tree the
engine itself overwrites**. That proxy only holds while the same process that overwrites `engine-skills/**`
also refreshes `.claude/skills/**`. It did **not** hold across the v4.1.0 boundary: the update is driven by
the brain's **installed** `update-engine.mjs`, so a pre-2.5 parent copied the staging tree with no refresh
(and, where auto-finalize re-exec'd the freshly-written reconciler, the child then read its base from a tree
the parent had **already** overwritten). From that moment the base is permanently ahead of the installed
file, every later update re-confirms "customized", and the skill is frozen **for good**. The same hazard is
still live for any brain in the field that has not yet crossed that hop.

## Tracking

- [ ] **Step 1 — Persist the base instead of re-deriving it.** A staged skill's provenance must be
      **recorded in `engine-manifest.json`**, keyed by the INSTALLED path, at the moment the engine
      actually delivers it (install-if-absent **and** refresh) — the way `reseedProvenance` already does
      for merge files. A recorded base cannot be clobbered by a `replace` copy, and the cross-version
      hand-off becomes harmless.
  - [ ] Kill the "read it before the copy" ordering constraint that `staged-skills.mjs:32` documents as a
        ⚠️ — a rule that has to be remembered is a rule that gets broken by the next caller.
  - [ ] Keep `readStagedProvenance()` as the **fallback for brains that have no recorded base yet**, not
        as the primary source.
- [ ] **Step 2 — Heal the fleet that is ALREADY frozen (this is the self-healing half).** A brain frozen
      today has no correct base left to recover from, so the engine must be able to recognise **its own
      past output**: ship, per engine-owned skill file, the fingerprints of **every version the engine has
      ever delivered** (generated at release time from this repo's git history, EOL-normalized like
      `matchesBase` already does). Installed content matching **any** of them = provably untouched →
      refresh.
  - [ ] Decide where it lives (a `knownBases` map in `engine-manifest.json`, or a sibling file) and what
        it costs in bytes — measure, do not guess.
  - [ ] It also yields the answer Step 3 needs for free: **which version** the installed copy is.
- [ ] **Step 3 — Make the freeze audible (the real subject).** A preserved skill must say **since when**
      it has been kept and **which engine version** it diverges from. The owner should never need a git
      diff to discover a months-old freeze.
  > ➡️ **OWNED ELSEWHERE — do not track progress here.** This step is being built as **S4** of
  > [`update-regime-owns-what-it-shipped-action.md`](update-regime-owns-what-it-shipped-action.md)
  > (designed 2026-08-21), which holds its state, its sub-slices and its surface decision. The
  > requirement below stays as the *statement of the need*; the boxes under it are answered there. A
  > second file restating a status is a future lie.
  - [ ] `preserve / no-provenance` currently stays **silent on purpose** (`scripts/update-engine.mjs:134`).
        Re-open that decision: "we cannot prove anything about this skill" is information the owner needs,
        not machine noise. Silence is what this whole finding is about.
  - [ ] Say it where a freeze is actually visible over time, not only in the update report the owner
        reads once (candidate surface: the existing health / session-status line).
- [ ] **Step 4 — Prove the class is closed, not just the case.** A test that reproduces the field
      trajectory end to end: install at version N, advance `engine-skills/**` without refreshing, then
      update with the current code and assert the skill is **refreshed**, not preserved — and that the
      report never uses the *personalized* voice for a file the engine itself wrote.
  - [ ] Mutate the touched files the day they are written (`CONVENTIONS.md` §5quinquies).
- [ ] **Step 5 — Re-check the deployed brain after the fix lands**, and record the result here. The
      mind-palace is currently clean (measured above), so the check is that it **stays** clean across the
      next hop, and that a deliberately frozen fixture heals.

## What this plan does NOT claim

- [ ] The `.new` sidecar is **not** the defect: it is the conffile fallback doing its job, and it is what
      let the owner recover in two minutes. Do not "fix" it away.
- [ ] Nothing here says a customized skill should ever be overwritten. The rule stands: the owner's copy
      is the owner's. The defect is calling the **engine's own bytes** the owner's, and then never
      re-examining that verdict nor mentioning it again.
