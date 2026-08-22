<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- STATUS: 🔴 LIVE since 2026-08-22 — the triage of the `/code-review max`  -->
<!-- run that Thomas asked for BEFORE merging v5.0.0. 15 findings returned.   -->
<!-- NOTHING is fixed yet. This file OWNS the findings and their state; the    -->
<!-- release plan links here and restates none of it.                         -->
<!-- Owning release plan: v5-unfreezes-the-existing-fleet-action.md (item 4a). -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Action plan — triaging the v5.0.0 code review

> ## ▶️ WHERE THIS RESUMES
>
> **The review has RUN and returned 15 findings. Not one is fixed.** The merge of #76 is now gated on
> this file: Thomas asked for the review precisely because the whole release was built by orchestrated
> subagents overnight, and it found real defects in code the loop had declared finished, green and
> mutation-scored.
>
> - **One finding is a BLOCKER and needs Thomas's design call** (F1). It fires on **every brain in the
>   fleet, caused by this very release**, tells the owner something provably false at every session
>   start, and **cannot be dismissed** through the mechanism S10 built for dismissing it.
> - **Two more are silent-damage defects** (F2 path escape, F3 silent skill deletion at self-heal).
> - The rest are fix-then-verify, no decision needed.
> - ⚠️ **Nothing may be merged or tagged until this file's § Tracking is discharged**, or until Thomas
>   explicitly ships with a named finding deferred (his call, recorded here if it happens).

## 🧾 How this review was run, and its ONE honest limitation

`/code-review max` on the whole branch (`main...HEAD`), 2026-08-22, ~37 min. Perimeter it actually
read: **7 257 lines of production diff** and **16 260 lines of test diff**, plus the CI workflow, the
settings template and `.gitignore`.

> 🛑 **The ten parallel finder agents never returned**, so the reviewing agent performed all ten angles
> **itself, sequentially**. It says so plainly, which is why it is written here. **What this costs**:
> the diversity of ten independent readings was not obtained, so the recall of this pass is *one*
> reader's, not ten. **A second pass after the fixes is therefore worth more than usual** — and that
> re-run is already the discipline (`v3.3.0` re-ran its review on the fix branch and the second pass
> surfaced a refinement the first had missed).

**What it verified rather than argued**: findings 1 through 6 were reproduced **by executing the real
modules against throwaway fixtures under `/tmp`**, no repo state touched. The rest are read-verified
with the offending lines quoted. **Independently re-checked by this session before writing this file**:
F1's premise (`.claude/settings.json` IS in `regimes.merge`, and `reconcile-brain.mjs` step 2.quinquies
rewrites its hook entries) and F2's (`adoptCandidate` joins `rel` onto `brainDir` with no containment
test). The full suite (2 472 tests) and the maintainer suite (50) **both pass**, so no existing net
catches any of this.

## Tracking

- [ ] **A. The blocker — needs Thomas's call before it can be fixed**
  - [ ] **F1 — the session nudge will tell every owner, forever, that `.claude/settings.json` and
        `CLAUDE.md` are "yours", and they cannot silence it.**
        `scripts/lib/engine-divergence.mjs:47`. Both files are in `regimes.merge`.
        `reconcile-brain.mjs:357` rewrites `settings.json` whenever a hook entry is added, and **this
        release adds two** (`engine-write-guard`, `session-engine-divergence`), so the file stops
        matching its recorded provenance **on the update itself**, on every brain. `CLAUDE.md` is worse
        by design: the product *tells* owners to edit it. `engineDivergence` then reports both as held
        back at **every session start**, and `adoptCandidate` refuses to dismiss them (`no-candidate`:
        no refresh family ever writes a `.new` sidecar for them). **This is the consent fatigue the
        nudge's own header says it exists to prevent.**
        - [ ] **The call is Thomas's because it is a product decision, not a repair.** The plausible
              shapes: (a) re-record `settings.json`'s provenance after the engine rewrites it, and
              exclude owner-authored files like `CLAUDE.md` from the nudge; (b) keep them in the report
              but make them dismissible; (c) narrow the nudge to files that have a real ancestor.
              **Do not pick one alone** — it changes what the release's headline feature says out loud.
- [ ] **B. Silent damage — fix test-first, no decision needed**
  - [ ] **F2 — `adoptCandidate` writes outside the brain.** `engine-adopt.mjs:79/110`. `rel` arrives
        from the conversation (`update-engine/SKILL.md:224`), and `join(brainDir, rel)` with `../`
        escapes. Inside the brain it is just as unguarded: **any path with a `.new` beside it**,
        including `.env`, `vault/**` and `.engine-base/**` — the last being the exact path the write
        guard denies the agent, because forging it destroys the owner's edit at the next update.
        **Fix**: reject a `rel` whose `relative(brainDir, join(brainDir, rel))` escapes, and require
        `selectMergeFiles(manifest, [rel])` to be non-empty.
  - [ ] **F3 — a restored skill is deleted again, silently, at session start.**
        `reconcile-brain.mjs:169`. `retireDeclaredSkills` is the engine's only subtractive door and is
        **not** gated on `sourceDir !== brainDir`, unlike all three merge families beside it — so it
        runs on the SessionStart self-heal, which is spawned detached with `stdio: "ignore"`, so
        `skillsRetired` is thrown away. Provenance entries are never pruned, so an owner who restores a
        retired skill from git history loses it again at the next session, with nothing said.
  - [ ] **F4 — the brain's backup repo starts publishing the owner's absolute paths.**
        `engine-base-fs.mjs:103`. `.claude/settings.json` is deliberately gitignored (machine-specific,
        absolute paths, connector permissions), but its **copy under `.engine-base/` is not**, and
        auto-commit pushes it. On a second machine the pulled base then describes machine A.
  - [ ] **F9 — `adoptCandidate` is not atomic** (`engine-adopt.mjs:118`): it writes the file and deletes
        the sidecar, *then* parses the manifest. A manifest error exits 1, which the skill is told means
        "nothing was touched" — while the owner's file has already been overwritten and the offer
        destroyed. Read the manifest before the first write.
- [ ] **C. Wrong to the owner, or wrong under load — fix test-first**
  - [ ] **F5 — the ownership oracle answers wrongly on `?` and on spaces.** `glob-match.mjs:12`. `?` is
        left unescaped (it becomes a regex quantifier: `a?.md` matches `a.md`, not `ab.md`) and the `**`
        placeholder is a **space**, so a literal space is eaten (`my notes/**` matches `myXXnotes/x`).
        This function decides `selectMergeFiles`, `regimeOf` (the write guard), `planTouches` and
        `computeApplyPlan` — and `advanceRegimes`, new in this release, now imports whatever globs the
        **fetched** engine declares.
  - [ ] **F7 — a successful update can report itself as failed.** `update-engine.mjs:764`.
        `readEngineDivergence`'s file reads sit outside its try/catch, and it runs *after* the merge,
        the manifest rewrite and the commit — so one unreadable file at that instant prints
        `❌ update-engine failed — the brain was NOT changed`, which is false, and invites a re-run.
  - [ ] **F8 — a brand-new install is born diverged.** `installer.mjs:639`. Provenance and the base tree
        are recorded **before** the connectors step merges permissions into `settings.json`, so any
        interactive install with a connector ends with a file that mismatches its own recorded sha, and
        F1's nudge fires on a brain minutes old. Record after step 5, or re-record after the merge.
  - [ ] **F10 — the ancestor fetch inherits Node's 1 MB `maxBuffer`.** `engine-fetch.mjs:130`. The
        sibling seam `engine-merge-git.mjs:60` sets 64 MB with a comment naming this exact hazard.
        Latent today (merge files are ~40 KB), and it silently degrades to "the update server could not
        be reached" when it did answer. `generate-fingerprints.mjs:43` has no try/catch at all, so the
        same blob aborts a release cut.
- [ ] **D. Maintainer-side, destructive — fix test-first**
  - [ ] **F6 — `mutate-one.mjs --worktree kenjaku` targets the real repository** and then runs
        `git reset --hard` + `git clean -qfd` in it, destroying every uncommitted and untracked file.
        `mutate-one.mjs:299`: the worktree name is joined onto the repo's **parent**. The module header
        states this hazard as the reason the tool uses a disposable worktree; nothing enforces it. Same
        hole for `--worktree ..` and a bare trailing `--worktree`.
- [ ] **E. Product / locale — needs Thomas's call**
  - [ ] **F11 — a French brain loses a localized skill and receives an English one.**
        `engine-manifest.json:75`. The branch deletes the French `tdd-discipline` twin;
        `test-first-discipline` ships **English only**. So on a French brain the localized skill is
        retired (provably, by sha) and the English one installed in its place. `locale-drift.mjs` needs
        a twin to **exist** to report drift, so CI is blind to a twin that was **deleted**. Either
        translate it, or say so in the release note. **The note currently says nothing.**
- [ ] **F. Prose the owner reads — cheap, fix**
  - [ ] **F14 — `2 engine file(s)`** (`update-engine.mjs:242`): the count is known at render time, so
        the parenthesised plural is never needed. Every other line in this release picks the word.
  - [ ] **F15 — `"coach" and "sync" and "improve"`** (`update-engine.mjs:191`): three merged skills is
        ordinary on the first v5 run of a customized brain. Comma-plus-"and".
- [ ] **G. Quality, non-blocking — decide whether v5 pays them or a follow-up does**
  - [ ] **F12 — `stripComments` is not regex-aware** (`entrypoint-discipline.mjs:141`): a `//` inside a
        regex literal blanks the rest of the line, so the entry-point guard can miss a hand-rolled
        guard and its ceilings can be satisfied by a file that still hand-rolls one.
  - [ ] **F13 — four full read-and-sha256 passes per update** over every engine-owned file
        (`engine-base-fs.mjs:64`), despite the module's own "Read ONCE, used TWICE" comment, plus a
        fifth at **every** session start. Thread the already-read `installedFileMap` through.
- [ ] **H. After the fixes**
  - [ ] Re-run `/code-review` on the fix range (the `v3.3.0` discipline: the second pass caught what the
        first missed), and report the figure back to
        [`agent-orchestrated-release-mode-action.md`](agent-orchestrated-release-mode-action.md) —
        which owes a verdict on whether fan-out-built work needs an independent review to count as
        finished. **This run already answers it in the affirmative, with numbers.**

## What this says about the mode, recorded now rather than at the debrief

The loop declared this release finished: every slice green, Windows 7/7 on real CI, mutation scores
measured, an empty queue announced three times. **An independent read of the same code found a
fleet-wide defect in the release's own headline feature, a path escape, and a silent deletion.** None
of them is exotic; all three are the kind a second pair of eyes catches and an author's own tests
cannot, because the tests encode the author's model of the problem.

The mode's own deferred question was whether a slice built by a fan-out owes an adversarial review
before it counts as finished. **The answer arrived from the field, and it is yes.**
