<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- STATUS: 🔴 LIVE since 2026-08-22 — the triage of the `/code-review max`  -->
<!-- run that Thomas asked for BEFORE merging v5.0.0. 15 findings returned.   -->
<!-- NOTHING is fixed yet. This file OWNS the findings and their state; the    -->
<!-- release plan links here and restates none of it.                         -->
<!-- Owning release plan: v5-unfreezes-the-existing-fleet-action.md (item 4a). -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Action plan — triaging the v5.0.0 code review

> ## ▶️ WHERE THIS RESUMES — **THE FIXING IS RUNNING. NEXT: F3.** _(updated 2026-08-22, mid autonomous run)_
>
> **Done and pushed, test-first**: F1 + F8 (`7f0ae6a`), F2 + F9 (`d8191b5`).
> **Resume at F3** (the silent deletion), then F4, then C, then D and F.
> The order and the boundaries below are unchanged and still govern.
>
> ⚠️ **A boundary worth knowing before touching any doc**: editing an **engine skill**
> (`.claude/skills/**`) makes two other guards go red — the fingerprint table must be regenerated
> **and** the French twin ported. The second is `templates/fr/**`, which is F11's and Thomas's. So on
> this run, **prose fixes land in the CODE's own strings, not in a skill**. (Learned the expensive way
> at F2; the paragraph it cost is parked under F2 below.)
>
> ❓ **ONE QUESTION FOR THOMAS CAME OUT OF F1, and nothing is blocked on it** — it is written under F1
> below, in the *"what F1 does not settle"* box: whether `.claude/settings.json` should ALSO leave the
> nudge, the way `CLAUDE.md` just did. It is not part of the decided repair, and no other finding
> depends on it.
>
> **The review has RUN and returned 15 findings.** The merge of #76 is gated on this file. **Thomas
> answered both open questions before the clear** — do not re-ask either:
>
> - ✅ **THE BLOCKER IS DECIDED — shape (a).** *"Ne parler que des fichiers vraiment tenus par toi."*
>   The engine **re-records `.claude/settings.json`'s provenance right after it rewrites it**, and
>   **`CLAUDE.md` leaves the nudge** because an owner editing their constitution is the product working
>   as designed, not a file held back. The nudge then speaks only of what the owner genuinely kept.
>   **It is now a repair, not a decision** → F1 below carries the design and what it owes in tests.
> - ✅ **GO TO FIX, TEST-FIRST, HE READS THE RESULT AT THE END.** *"Oui, en test-first, et tu me montres
>   à la fin."* A red test for the right reason first, then the code, **one commit per subject**, and a
>   report to him when the batch is done. **The GO covers categories A, B, C, D and F.** It does **not**
>   cover **E** (the French locale regression, his product call) nor **G** (quality work whose cost is
>   worth asking about before spending it).
>
> **So the next session starts by fixing, not by triaging.** Suggested order, hardest-hitting first:
> ~~F1 (the fleet-wide false claim)~~ ✅, ~~F2 (the write that escapes the brain)~~ ✅, F3 (the silent
> deletion), then the rest of B and C, then D and F.
>
> ⚠️ **Nothing may be merged or tagged until this file's § Tracking is discharged**, or until Thomas
> explicitly ships with a named finding deferred (his call, recorded here if it happens).
>
> **Still his, and NOT unblocked by any of the above**: F11 (the French twin), the G scope call, the
> wording of the four doctrine texts (W5b, in the release plan), and the undecided rehearsal on a copy
> of a real brain.
>
> ### 🤖 AUTONOMOUS RUN AUTHORIZED — Thomas is away, and "on reprend" IS the GO
>
> _(2026-08-22, asked and granted explicitly: he is going for a walk and wants the batch worked without
> him. So a session opening on this file does **not** stop to ask whether it may start.)_
>
> **DO, without asking:** everything in categories A, B, C, D and F, test-first (a red test **for the
> right reason** first, then the code, then the refactor), **one commit per subject**, green only, and
> **push every green commit** as it lands. Tick the box here as each one closes, with _(date · commit)_.
>
> **NEVER, alone, whatever the plan seems to authorize:** merge #76, tag, publish, push anything to
> `main`, touch either of his two real brains, translate or delete anything under `templates/fr/**`
> (that is F11 and it is his), or spend the G work. **The cut stays his, entirely.**
>
> **WHEN BLOCKED on a genuine fork** (two defensible designs, or a fix that would change what the
> release promises): **do not stop and do not guess.** Do every finding that does not depend on it,
> write the question into this file where it belongs, and carry on. He answers on his return.
>
> 🛑 **The save point moves, because a long autonomous stretch has no hand-back to hang it on.** Write
> each decision into this file **as it lands** and commit it — never bank it for a report that may be
> an hour away. The plan is what he reads when he gets back; the chat may be gone.
>
> **When the batch is done**: re-run `/code-review` on the fix range if he is back to type it (it is
> his command), otherwise leave § H ticked as pending with the exact range to review, and report.

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

- [x] **A. The blocker — DECIDED by Thomas, now a repair to build test-first** _(2026-08-22 · 7f0ae6a)_
  - [x] **F1 — the session nudge will tell every owner, forever, that `.claude/settings.json` and
        `CLAUDE.md` are "yours", and they cannot silence it.**
        `scripts/lib/engine-divergence.mjs:47`. Both files are in `regimes.merge`.
        `reconcile-brain.mjs:357` rewrites `settings.json` whenever a hook entry is added, and **this
        release adds two** (`engine-write-guard`, `session-engine-divergence`), so the file stops
        matching its recorded provenance **on the update itself**, on every brain. `CLAUDE.md` is worse
        by design: the product *tells* owners to edit it. `engineDivergence` then reports both as held
        back at **every session start**, and `adoptCandidate` refuses to dismiss them (`no-candidate`:
        no refresh family ever writes a `.new` sidecar for them). **This is the consent fatigue the
        nudge's own header says it exists to prevent.**
        - [x] ✅ **DECIDED 2026-08-22 — shape (a), Thomas's words: *"ne parler que des fichiers
              vraiment tenus par toi"*.** Two halves, and both are owed tests:
              - [x] **The engine re-records `.claude/settings.json`'s provenance right after it
                    rewrites it.** _(2026-08-22 · 7f0ae6a)_ The rewrite is `reconcile-brain.mjs` step
                    2.quinquies; the file is in `regimes.merge`, so nothing else re-seeds it. A brain
                    the engine just touched must not read as a brain the owner touched. **Fail-first
                    pole, seen red**: a brain that receives a new hook entry reports **no** held-back
                    file afterwards.
                    _Shape, so it is not re-derived_: `reconcileBrain` returns **`reconciledFileMap`**
                    (the bytes it wrote, `{}` when it wrote none) and the **two** manifest writers on
                    the path fold it in — `runReconcileCli` (the last writer, self-heal + finalize) and
                    `update-engine` step 7. Both are needed: by the time the finalize child runs, the
                    hooks are already wired, so its own reconcile writes nothing and would record
                    nothing. **Gated on the write**, and a second test pins why: a blanket re-seed
                    would grant an amnesty to the owner's own edits, which is the opposite defect.
              - [x] **`CLAUDE.md` leaves the nudge.** _(2026-08-22 · 7f0ae6a)_ Editing one's own
                    constitution is the product working as designed, so naming it "held back" is a
                    false claim, not a helpful one. ⚠️ **Scoped to the NUDGE only** — `CLAUDE.md` stays
                    a `merge` file and the update-time merge behaviour is untouched. **Fail-first pole,
                    seen red**: an owner-edited `CLAUDE.md` is absent from the report while an
                    owner-edited engine skill is still present in it.
                    _Shape_: `INVITED_EDITS` in `engine-divergence.mjs`, filtered **before** the verdict
                    so it covers `no-provenance` too — which is the branch the whole deployed fleet is
                    in for that file. A **name**, not a shape: `CLAUDE.engine.md` is the engine's half
                    and is still reported (pinned by a test, one dot apart).
              - [x] **F8 travels with this** — a fresh install with a connector is born diverged for the
                    exact same reason, so the same re-recording has to cover the installer's ordering.
                    _(2026-08-22 · 7f0ae6a)_ New door: **`rerecordEngineWrite`** in `engine-base-fs.mjs`
                    (merge-regime-gated, existence-gated, writes nothing when it records nothing),
                    called after the connectors step and only when a connector actually merged.
              - [ ] ❓ **WHAT F1 DOES NOT SETTLE — FOR THOMAS, and nothing is blocked on it.**
                    `.claude/settings.json` is now truthful about the ENGINE's writes. It is still
                    reported when the **owner** edits it — and `SETUP.md` §"community MCP" tells them
                    to (add `mcp__<server>__<tool>` by hand). That is the same argument that just took
                    `CLAUDE.md` out of the report, on a file that is **also** un-adoptable
                    (`no-candidate` forever, no refresh family writes a `.new` beside it). **The
                    counter-argument, which is why this was not decided alone**: the allowlist is what
                    the engine's write guard reasons about, and an owner who widens it may well want to
                    be told the engine no longer recognises the file. Two defensible designs → his
                    call. _(One thing to check before deciding, and it changes the answer: if Claude
                    Code's "Always allow" writes into `settings.local.json` — which no regime names —
                    then the everyday case never fires this and only a deliberate hand-edit does, which
                    is a much weaker reason to go silent. **Not verified here**, and the repo's only
                    two mentions of that file are in an ADR and an archived plan, neither of them
                    evidence.)_
              _(The two rejected shapes, so they are not re-litigated: (b) keep both and make them
              dismissible — more machinery, and it leaves a message still saying something arguable
              about `CLAUDE.md`; (c) restrict the nudge to files with a fetchable ancestor — cheap, but
              it silences legitimate cases he wants to see.)_
- [ ] **B. Silent damage — fix test-first, no decision needed**
  - [x] **F2 — `adoptCandidate` writes outside the brain.** _(2026-08-22 · d8191b5, **with F9** — one
        fix, see below)_ `engine-adopt.mjs:79/110`. `rel` arrives from the conversation
        (`update-engine/SKILL.md:224`), and `join(brainDir, rel)` with `../` escapes. Inside the brain
        it is just as unguarded: **any path with a `.new` beside it**, including `.env`, `vault/**`
        and `.engine-base/**` — the last being the exact path the write guard denies the agent,
        because forging it destroys the owner's edit at the next update.
        - [x] **THREE questions, not the two the finding proposed, and the third is the one that
              matters.** The suggested fix (containment + `selectMergeFiles`) leaves a hole a test
              found: `.claude/skills/../../notes.md` lands on `notes.md`, which is **inside** the
              brain, and still MATCHES `.claude/skills/**` — `**` compiles to `.*`, which crosses `/`.
              So the guard first requires the rel to BE the canonical brain-relative POSIX spelling of
              the file it names (which also disposes of an absolute path, silently re-rooted by
              `join`, and of a win32 spelling no manifest glob uses), THEN that it stays inside, THEN
              that a merge regime names it. **Do not collapse them back into two.**
        - [x] One new blocked reason, `not-adoptable`, with its own sentence in
              `adopt-engine-file.mjs` — written for the AGENT that got the path wrong as much as for
              the owner. `BLOCKED_LINE` has no fallback by design, so a reason without a sentence is a
              crash in a test, never a lie in production.
        - [ ] 📝 **ONE PARAGRAPH LEFT UNWRITTEN, and it is not a decision — it is a boundary.** The
              matching note in `update-engine/SKILL.md`'s exit-code list (*"this exit 1 is yours, not
              theirs: pass the file exactly as the report named it"*) was written, then **removed
              again**: touching an engine skill obliges regenerating the fingerprint table **and**
              porting the French twin, and `templates/fr/**` is F11's, which is Thomas's. Worth
              re-adding in the same breath as F11. _(Cost of finding out: one red commit, amended.)_
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
  - [x] **F9 — `adoptCandidate` is not atomic** ✅ **Fixed with F2, whose box owns the detail**
        _(2026-08-22 · d8191b5)_ (`engine-adopt.mjs:118`): it wrote the file and deleted the sidecar,
        *then* parsed the manifest. A manifest error exits 1, which the skill is told means "nothing
        was touched" — while the owner's file had already been overwritten and the offer destroyed.
        The manifest is now read FIRST, which is also what F2's guard needs in order to ask its third
        question: **one ordering, two findings.**
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
  - [x] **F8 — a brand-new install is born diverged.** ✅ **Fixed with F1, whose box owns the detail**
        (A. above) _(2026-08-22 · 7f0ae6a)_. `installer.mjs:639`. Provenance and the base tree were
        recorded **before** the connectors step merges permissions into `settings.json`, so any
        interactive install with a connector ended with a file that mismatches its own recorded sha,
        and F1's nudge fired on a brain minutes old. Taken by the *re-record after the merge* branch.
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
