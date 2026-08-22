<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- This file OWNS the findings of BOTH v5.0.0 code-review passes (15 + 15), -->
<!-- their fixes, and their state. The `## 📍 STATE` block below is its only  -->
<!-- perishable content: do not restate it here, in another file, or in a     -->
<!-- resume header.                                                           -->
<!-- Owning release plan: v5-unfreezes-the-existing-fleet-action.md (item 4a),-->
<!-- which links here and restates none of this.                              -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Action plan — triaging the v5.0.0 code review

## 📍 STATE — the only perishable block in this file · moved 2026-08-22

- **Next:** **§ J, then § K, then S11/S14/S15** — § I is closed _(2026-08-22 · `ca46027`)_. Working
  hardest-hitting first, exactly as the first batch was worked. Thomas typed
  `/code-review max fc4e7bb..HEAD` on 2026-08-22; § H is discharged. The first batch (**A, B, C, D,
  F**) stays fixed, test-first, green and pushed.
  - ✅ **THE GO, in his words** _(2026-08-22)_: *"oui, en test-first, et tu me montres à la fin."* Word
    for word the first batch's GO, on the scope that was recommended with it: **I, J, K, and the cheap
    half of L (S11, S14, S15)**. **S12 and S13 are NOT in it** — they are weighed like G, and stay
    Thomas's.
- **Blocked on:** nothing.
- **Owner's call pending:** **three.** (1) **E / F11** — the French twin: translate it,
  or say so in the release note. (2) **G** — does v5 pay F12 and F13, or a follow-up? (3) **the
  delivered-prose hole** raised by § H's measurement: three delivered prose files can be gutted with
  the suite fully green (`CONNECTORS.md`, `.claude/skills/EXAMPLES.md`,
  `engine-skills/mcp-token-expired/SKILL.md`). **v5, or a follow-up?** Recommendation on record:
  **follow-up**.
  - ✅ **A fourth call is ANSWERED by the second pass, not by him** — *should
    `.claude/settings.json` also leave the nudge?* **S4 shows the file is broken on a second machine
    for a different reason**, and that reason has to be fixed either way. The nudge question rides on
    S4's fix rather than standing alone; see F1's follow-up box, which now points here.
- **A session may, alone:** **work § I, J, K and S11/S14/S15 — and nothing else here.** Not merge, tag
  or publish #76, not touch either real brain, not write under `templates/fr/**`, not spend the G work
  **nor S12/S13**. ⚠️ **Nothing may be merged or tagged until § Tracking is discharged**, unless Thomas
  ships with a named finding deferred.

## How the batch was worked — durable, this is what it cost

**The GO, in his words** _(2026-08-22)_: *"Oui, en test-first, et tu me montres à la fin."* A red test
for the right reason first, then the code, **one commit per subject**, green only, and a report at the
end. It covered categories **A, B, C, D and F** — never **E** (his product call) nor **G** (quality
work worth costing before spending).

**The blocker was decided before the batch started, shape (a)**: *"ne parler que des fichiers vraiment
tenus par toi."* F1 below carries the design, what it owed in tests, and the two rejected shapes, so
none of it is re-litigated.

**The autonomous run** _(2026-08-22, asked and granted: he went for a walk and wanted the batch worked
without him)_. Its boundaries still govern any further session here: **never**, alone, merge #76, tag,
publish, push to `main`, touch either of his two real brains, translate or delete anything under
`templates/fr/**`, or spend the G work. **The cut stays his, entirely.** On a genuine fork — two
defensible designs, or a fix that would change what the release promises — do not stop and do not
guess: work every finding that does not depend on it, write the question into this file, carry on.

**Nine commits, hardest-hitting first**: F1 + F8 (`7f0ae6a`), F2 + F9 (`d8191b5`), F3 (`e084eef`),
F4 (`a0419f6`), F5 (`1917a76`), F7 (`89621f0`), F10 (`6707eca`), F6 (`83fc9b5`), F14 + F15
(`2ce39d8`). At the close of the batch: **2 525 tests green (3 skipped), maintainer suite 56/56.**

⚠️ **The boundary learned the expensive way, at F2**, worth knowing before touching any doc here:
editing an **engine skill** (`.claude/skills/**`) makes two other guards go red, because the
fingerprint table must be regenerated **and** the French twin ported — and `templates/fr/**` is F11's,
which is Thomas's. So on this run, **prose fixes landed in the CODE's own strings, not in a skill.**

**Owned elsewhere, linked rather than restated**: the wording of the four doctrine texts (W5b) and the
undecided rehearsal on a copy of a real brain both belong to
[`v5-unfreezes-the-existing-fleet-action.md`](v5-unfreezes-the-existing-fleet-action.md). This file
used to carry their status; it now points, and cannot go false when they move.

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
                    - 🔀 **The second pass changed the question — read S4 (§ J) BEFORE deciding this.**
                      On a **second machine** the file is not merely "reported when the owner edits
                      it": it is reported forever, un-dismissable, because the base copy F4 gitignored
                      is never regenerated there. That is a defect to fix either way, and its fix
                      decides most of what this box was asking. **Do not answer this box on its own.**
              _(The two rejected shapes, so they are not re-litigated: (b) keep both and make them
              dismissible — more machinery, and it leaves a message still saying something arguable
              about `CLAUDE.md`; (c) restrict the nudge to files with a fetchable ancestor — cheap, but
              it silences legitimate cases he wants to see.)_
- [x] **B. Silent damage — fix test-first, no decision needed** _(2026-08-22 · d8191b5, e084eef,
      a0419f6 — all four findings closed)_
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
  - [x] **F3 — a restored skill is deleted again, silently, at session start.** ✅ _(2026-08-22 ·
        `e084eef`)_ `reconcile-brain.mjs:169`. `retireDeclaredSkills` is the engine's only subtractive
        door and was **not** gated on `sourceDir !== brainDir`, unlike all three merge families beside
        it — so it ran on the SessionStart self-heal, which is spawned detached with `stdio: "ignore"`,
        so `skillsRetired` is thrown away. Provenance entries are never pruned, so an owner who
        restored a retired skill from git history lost it again at the next session, with nothing said.
        - [x] **The gate lives INSIDE the retirement module, not at the call site** — the same choice
              `fetchAncestors` makes, for the same reason: this is the one place in the product that
              calls `rmSync` under the owner's `.claude/`, so no caller has to remember. **Do not move
              it out to the caller.**
        - [x] **An ABSENT `sourceDir` is caught by the same line.** A caller that has not said "this is
              an update" has not earned a deletion: "I cannot tell" fails towards keeping.
        - [x] The v5 retirement of `tdd-discipline` still lands — it travels on the update path, which
              is also the only path that can report it.
  - [x] **F4 — the brain's backup repo starts publishing the owner's absolute paths.** ✅ _(2026-08-22 ·
        `a0419f6`)_ `engine-base-fs.mjs:103`. `.claude/settings.json` is deliberately gitignored
        (machine-specific, absolute paths, connector permissions), but its **copy under `.engine-base/`
        was not**, and auto-commit pushes it. On a second machine the pulled base then described
        machine A.
        - [x] **A gitignore line is the whole repair, and it is enough BECAUSE `.engine-base/` is new
              in v5**: no deployed brain has ever tracked that path, so there is nothing to *untrack*,
              only something to never start tracking. _(Had the path existed in v4, this fix would have
              been insufficient — a `git rm --cached` would have been owed too.)_
        - [x] **Two doors, because a brain arrives through one or the other**: a fresh install copies
              the launcher's own `.gitignore` (which now carries the entry), and an already-deployed
              brain carries a v4 one that **no engine regime updates** → migrated, chained onto the
              universes-pointer migration that already reads and writes that file. One read, one write;
              `pointerUnignored` keeps meaning exactly what it meant.
        - [x] ⏱️ **The ordering is load-bearing**: the migration runs INSIDE the reconcile, and
              `syncBaseTree` writes the tree after it in **both** callers — so the entry exists before
              the file it protects does. **Do not hoist the migration to a caller.**
        - [x] **The two spellings are pinned against each other by a test**, not trusted to agree: a
              shipped `.gitignore` lacking the entry would leak on every new brain until its first
              update, and a differently-spelled one would append a duplicate to every brain, forever.
  - [x] **F9 — `adoptCandidate` is not atomic** ✅ **Fixed with F2, whose box owns the detail**
        _(2026-08-22 · d8191b5)_ (`engine-adopt.mjs:118`): it wrote the file and deleted the sidecar,
        *then* parsed the manifest. A manifest error exits 1, which the skill is told means "nothing
        was touched" — while the owner's file had already been overwritten and the offer destroyed.
        The manifest is now read FIRST, which is also what F2's guard needs in order to ask its third
        question: **one ordering, two findings.**
- [x] **C. Wrong to the owner, or wrong under load — fix test-first** _(2026-08-22 · 1917a76, 89621f0,
      6707eca — F5, F7, F10; F8 was taken by F1)_
  - [x] **F5 — the ownership oracle answers wrongly on `?` and on spaces.** ✅ _(2026-08-22 ·
        `1917a76`)_ `glob-match.mjs:12`. `?` was left unescaped (it became a regex quantifier: `a?.md`
        matched `a.md`, not `ab.md`) and the `**` placeholder was a **space**, so a literal space was
        eaten (`my notes/**` matched `myXXnotes/x`). This function decides `selectMergeFiles`,
        `regimeOf` (the write guard), `planTouches` and `computeApplyPlan` — and `advanceRegimes`, new
        in this release, which imports whatever globs the **fetched** engine declares.
        - [x] **One cause behind both, and it is the fix**: the body was built in successive passes
              over its own OUTPUT. Now **one alternation**, `**` offered before `*`, so no intermediate
              form exists to misread. **Do not reintroduce a placeholder pass** — that is exactly the
              shape that produced the space bug.
        - [x] **`?` → `[^/]`** (one character, never crossing a directory), not a literal. Chosen
              because `globRoots` has always counted `?` as a wildcard: had it stayed literal, a glob
              spelled with one would have forced the whole-tree walk `globRoots` exists to avoid. A
              test now pins the two halves of the file together — every path a glob matches must live
              under one of that glob's own roots.
        - [x] **Nothing changes for the fleet today**: no shipped glob contains either character (68
              in the manifest, checked). What changes is what the next glob author gets.
  - [x] **F7 — a successful update can report itself as failed.** ✅ _(2026-08-22 · `89621f0`)_
        `update-engine.mjs:764`. `readEngineDivergence`'s file reads sit outside its try/catch, and it
        runs *after* the merge, the manifest rewrite and the commit — so one unreadable file at that
        instant printed `❌ update-engine failed — the brain was NOT changed`, which is false, and
        invites a re-run of a completed update.
        - [x] **Guarded at the CALL SITE, not inside `readEngineDivergence`.** The function stays
              honest for callers that want to know — the session surface makes its own, already
              deliberate, fail-open choice — and the invariant lives where it is stated: **past step 7,
              nothing rejects**, which is also why steps 8 and 9 beside it are fail-soft.
        - [x] **Nothing is lost by staying quiet**: the divergence nudge is a STANDING surface,
              re-read at every session start, so a line omitted once comes back on its own.
        - [x] **The test pins the TOCTOU, not the symptom** — the file is readable for every step that
              WRITES and unreadable for the step that merely DESCRIBES (a new late hook in the test
              harness, `onFinalize`). It asserts the update completed *before* asserting the report
              degraded: a test that only checked "no throw" would pass on an update that never ran.
  - [x] **F8 — a brand-new install is born diverged.** ✅ **Fixed with F1, whose box owns the detail**
        (A. above) _(2026-08-22 · 7f0ae6a)_. `installer.mjs:639`. Provenance and the base tree were
        recorded **before** the connectors step merges permissions into `settings.json`, so any
        interactive install with a connector ended with a file that mismatches its own recorded sha,
        and F1's nudge fired on a brain minutes old. Taken by the *re-record after the merge* branch.
  - [x] **F10 — the ancestor fetch inherits Node's 1 MB `maxBuffer`.** ✅ _(2026-08-22 · `6707eca`)_
        `engine-fetch.mjs:130`. The sibling seam `engine-merge-git.mjs:60` set 64 MB with a comment
        naming this exact hazard. It silently degraded to "the update server could not be reached" when
        the server did answer. `generate-fingerprints.mjs:43` had no try/catch at all, so the same blob
        aborted a release cut.
        - [x] **Overflowing `maxBuffer` does not truncate** — node kills the child and the call THROWS,
              so the failure always arrives wearing the wrong clothes. That is the whole finding: not
              lost bytes, a lost *diagnosis*.
        - [x] **A THIRD site, found beside the two the review named**: `session-status.mjs` is an
              independent spelling of the same request, and its queries GROW with the vault —
              `git status --porcelain` is one line per dirty file, so a fresh clone or a bulk import
              reaches 1 MB around **25 000 notes**, and the banner then calls a healthy repository
              broken.
        - [x] **One named ceiling, `GIT_MAX_BUFFER`, imported by all four git seams.** Two spellings of
              a limit are two behaviours to keep in step forever. **Do not re-inline the number.**
        - [x] 🛑 **The generator stays UNTESTED by construction, and that is its own declared
              contract** (`process.exitCode = main(...)` runs on import; every decision it makes lives
              in the pure module CI does test). It gained the missing `catch`, which re-throws while
              naming the call. Verified by running it: the usage path is intact and writes nothing.
- [x] **D. Maintainer-side, destructive — fix test-first** _(2026-08-22 · 83fc9b5)_
  - [x] **F6 — `mutate-one.mjs --worktree kenjaku` targets the real repository** ✅ _(2026-08-22 ·
        `83fc9b5`)_ and then ran `git reset --hard` + `git clean -qfd` in it, destroying every
        uncommitted and untracked file. `mutate-one.mjs:299`: the worktree name is joined onto the
        repo's **parent**. The module header stated this hazard as the reason the tool uses a
        disposable worktree; nothing enforced it. Same hole for `--worktree ..` and a bare trailing
        `--worktree`.
        - [x] **Two guards, each where its knowledge is.** `parseArgs` demands a single folder name
              (both separators, and `.`/`..` named explicitly — a character class that asks about
              letters and punctuation says yes to both). The repo-identity check lives beside
              `repoRoot`, because no check on the NAME can see that `kenjaku` is this repository.
        - [x] **It compares PATHS, not names**, so the ordinary worktree beside the repo is untouched;
              and its test pins the **silence** — not one git call is made — rather than the message.
        - [x] **Ordering**: after the target check, so `--worktree <target>` (the option eating its
              value) keeps reporting the missing target rather than a strange-looking name.
        - [ ] 📌 **RESIDUAL, deliberately not taken here — a SIBLING checkout is still reachable.**
              `--worktree some-other-repo` passes both guards, and the reset lands in that other
              project. Closing it needs a new I/O dep (is this path a *linked* worktree of this repo?)
              plus a change to the test harness, which is beyond the finding as written. **Worth doing
              before the next mutation campaign; the three shapes the review named are closed.**
- [ ] **E. Product / locale — needs Thomas's call**
  - [ ] **F11 — a French brain loses a localized skill and receives an English one.**
        `engine-manifest.json:75`. The branch deletes the French `tdd-discipline` twin;
        `test-first-discipline` ships **English only**. So on a French brain the localized skill is
        retired (provably, by sha) and the English one installed in its place. `locale-drift.mjs` needs
        a twin to **exist** to report drift, so CI is blind to a twin that was **deleted**. Either
        translate it, or say so in the release note. **The note currently says nothing.**
- [x] **F. Prose the owner reads — cheap, fix** _(2026-08-22 · 2ce39d8 — one commit, one subject)_
  - [x] **F14 — `2 engine file(s)`** (`update-engine.mjs:242`): the count is known at render time, so
        the parenthesised plural is never needed. Every other line in this release picks the word.
        - [x] **Fixed across ALL FOUR of the report's counts, not only the line the review quoted** —
              one report, one voice: "3 engine files swapped" two lines above "3 engine file(s) this
              update leaves alone" would have been worse than either. Zero takes the plural.
        - [x] **The pronouns move with the count** ("updates for it" / "for them"), or the fix just
              displaces the tell one clause to the right.
        - [ ] 📌 **RESIDUAL, deliberately out of scope**: `file(s)` also lives in `repo-status.mjs`
              (the session banner) and `locale-drift.mjs` (a maintainer tool). Different surfaces, own
              tests, not this report's voice. Cheap whenever someone is next in those files.
  - [x] **F15 — `"coach" and "sync" and "improve"`** (`update-engine.mjs:191`): three merged skills is
        ordinary on the first v5 run of a customized brain. Comma-plus-"and".
        - [x] **Why it survived**: not one test exercised any arity above TWO, where `join(" and ")`
              happens to be correct. Both the three-item case and the two-item boundary (no comma) are
              pinned now.
- [ ] **G. Quality, non-blocking — decide whether v5 pays them or a follow-up does**
  - [ ] **F12 — `stripComments` is not regex-aware** (`entrypoint-discipline.mjs:141`): a `//` inside a
        regex literal blanks the rest of the line, so the entry-point guard can miss a hand-rolled
        guard and its ceilings can be satisfied by a file that still hand-rolls one.
  - [ ] **F13 — four full read-and-sha256 passes per update** over every engine-owned file
        (`engine-base-fs.mjs:64`), despite the module's own "Read ONCE, used TWICE" comment, plus a
        fifth at **every** session start. Thread the already-read `installedFileMap` through.
- [x] **H. After the fixes — his command to type, never a session's** _(2026-08-22 · run, 15 findings
      → § I–L)_
  - [x] 🎯 **Re-run `/code-review` on the fix range. THE EXACT RANGE: `fc4e7bb..HEAD` on
        `feat/engine-base-unfreeze`.** ✅ **Typed by Thomas, 2026-08-22, `/code-review max`, ~38 min.**
        - 🛑 **The ten finder agents did not return, AGAIN** — the same limitation as the first pass,
          in the same shape: the reviewing agent ran all ten angles itself, sequentially, and said so.
          **Twice is not bad luck**: on this repo's diff size, the fan-out half of `/code-review max`
          does not complete, and what is actually being bought is **one careful sequential read**. Worth
          knowing before commissioning a third pass and expecting ten readings.
        - 📊 **The figure, which is what the mode plan was owed: 15 again.** An independent read of
          *repairs* found as many findings as the read of the original code — **two of them in the very
          module the first batch had just hardened** (F6's guard), and one reproduced on Thomas's own
          machine within a minute. The `v3.3.0` discipline's claim (a second pass earns its keep) is
          not merely confirmed, it is understated.
        - 📐 **Nothing SHIPPED has changed since the batch closed — and the check that proves it is
          not the one written here first** _(2026-08-22, corrected the same hour by Thomas)_.
          🛑 **The wrong check was `git diff --name-only 2ce39d8..HEAD | grep -v '\.md$'`**, i.e.
          *"ignore the Markdown"*. **In this product Markdown IS behaviour**: `CLAUDE.engine.md`,
          `.claude/skills/**` and `templates/fr/**` are prose the engine ships into brains and that
          the brain then obeys. A rule that excludes `.md` is blind to the exact class of change
          this release exists to deliver. **His objection, verbatim**: *"le contenu markdown ça va
          changer le comportement du second brain"*.
          ✅ **The right check is "was any DELIVERED file touched?", and it has a machine answer**:
          `scripts/lib/tracked-files.mjs` decides what enters a brain — `DEV_ONLY_PREFIXES` excludes
          `maintainers/`, `DEV_ONLY_FILES` excludes `DEVELOPING.md`. Everything committed since
          `2ce39d8` falls in one of those two, **read on disk, not recalled**, so the delivered
          surface is byte-identical to the moment the batch closed and this re-run's job is
          unchanged. **Re-derive it that way, never by file extension.**
        - ✅ **His second question — what actually guards shipped prose? ANSWERED BY MEASUREMENT,
          2026-08-22.** The question was *"tu veux dire qu'on n'a aucun test qui peut devenir faux à
          cause de changements de comportements ?"*. It was **not** answered from memory: nine
          mutations were applied to delivered Markdown on disk, the 2 525-test suite run against each,
          and the file restored. **He was right in substance and wrong in the strongest form**, and
          the three findings are worth more than the yes/no:

          1. **A real family of doc guards exists, and it reads the SHIPPED bytes, not a fixture.**
             ~10 test files (`source-first-discipline`, `claim-discipline`, `source-discipline`,
             `backlog-discipline`, `delegation-threshold`, `signal-announce-discipline`,
             `tooling-rule-conditional`, `identity-discipline`, `connector-discipline`,
             `update-consent-discipline`, `constitution-layering`, `constitution-mirror-citations`)
             build `REPO_ROOT` from `import.meta.url` and `readFileSync` the real
             `CLAUDE.md.template` + `CLAUDE.engine.md` **union**, and the FR twins, and the real
             `SKILL.md`s. **They guard more than presence**: renaming the `### Level 1 — a source you
             are handed comes before any search` heading turned **10 tests red**; moving the
             `WebFetch` row below the `search_vault` row in the routing table turned **2 red**.
             Section **placement and table row order** — i.e. the reading order that actually caused
             the 2026-08-08 field defect — are asserted, not just keywords.
          2. **🛑 But not one of them can see MEANING, and that is his point standing.** The level-1
             rule was inverted in place — *"is not ambience: it is the statement of the task"* →
             *"is usually just ambience, not the statement of"* — leaving **every asserted keyword
             where it was**. **Zero doc guards fired.** The only red was
             `engine-fingerprints.test.mjs` → *"the table covers every merge file of the release being
             cut, in every locale"*, which fires on the **bytes**, not on the sense. A doctrine
             sentence can be reversed and the suite has nothing doctrinal to say about it.
          3. **The fingerprint table is an accidental second net, and it is the load-bearing one.**
             Any byte change to a **`merge`-regime** delivered file (`CLAUDE.engine.md`, `CLAUDE.md`,
             the eight `.claude/skills/**` under merge) makes the suite red until the table is
             regenerated. It **judges nothing** — but it makes a prose change **impossible to ship
             unnoticed**, which is a review trigger, and answers the literal question with *no, the
             suite is not silent*.
          4. **⚠️ The genuine hole is the surface OUTSIDE the merge regime.** Gutting each of these
             down to one line left **2 525 tests green, 0 fail**: `CONNECTORS.md` (in **no regime at
             all**), `.claude/skills/EXAMPLES.md`, `engine-skills/mcp-token-expired/SKILL.md`. They
             are delivered prose the brain obeys, with **neither a doc guard nor a byte tripwire**.
             (`engine-skills/**` is `replace`, so the fingerprint table does not cover it; some of it
             is incidentally guarded — gutting `engine-skills/universe/SKILL.md` did turn 3 red.)

          **What this does NOT license**: it is not an argument for a new guard on this release. It is
          the honest shape of the net, so the cut is taken knowing it. Related and consistent:
          **W5b's guards assert patterns, not prose** — same limit, same reason.
        - 🧾 **The plans in the diff do not drown the code**: the first pass read `main...HEAD` with
          **27 113 lines of plans** in it and still found 15 findings in 7 257 lines of production
          diff. No need to slice the range by hand.
  - [x] Re-run `/code-review` on the fix range (the `v3.3.0` discipline: the second pass caught what the
        first missed), and report the figure back to
        [`agent-orchestrated-release-mode-action.md`](agent-orchestrated-release-mode-action.md) —
        which owes a verdict on whether fan-out-built work needs an independent review to count as
        finished. **This run already answers it in the affirmative, with numbers.** _(2026-08-22 —
        figure reported: 15.)_

## Second pass — `/code-review max fc4e7bb..HEAD`, 2026-08-22

**How it was run, and its one honest limitation**: same as the first pass, and for the same reason —
the ten parallel finder agents never returned, so one agent performed all ten angles sequentially. It
ran the full suite before reporting: **2 569 tests pass, 0 fail, 3 skipped**, so **every finding below
is one no existing test catches**. Findings are numbered **S1…S15** so they never collide with F1–F15.

**Independently re-checked by this session before writing this section** (not taken on the reviewer's
word): **S1** reproduced by running the real tool in `--dry-run` — `--worktree Kenjaku` from
`/Users/tpierrain/Dev/kenjaku` plans `git reset --hard` and `git clean -qfd` in
`/Users/tpierrain/Dev/Kenjaku`, which on this case-insensitive filesystem **is this repository**;
**S2** read at `mutate-one.mjs:91/129/345` — the `--log` value is never validated between the argv
and `join(repoRoot, REPORTS, …)`; **S7** read at `installer.mjs:662-667` vs `711` — one `git commit`
in the whole file, and it runs 45 lines before the re-record; **S15(a)** by inspection — an empty
`.gitignore` takes `separator = eol` and then appends `eol` again.

- [x] **I. Second pass — DESTRUCTIVE, maintainer-side: the F6 family, reopened from three new angles**
      _(2026-08-22 · `ca46027` — one commit, one subject: the two arguments that are PATHS. The
      highest-severity group of this pass; none of it reaches an owner's brain, all of it reaches
      Thomas's working tree)_
  - [x] ✅ **ONE guard closes all three, and it is not the one any of the findings proposed.** The
        reviewer's own framing was the useful one: the property is **OWNERSHIP, not name shape**. A
        directory that ALREADY EXISTS may be reset only if `git worktree list --porcelain` names it
        (main worktree dropped — it is the repository); a directory that does **not** exist is created
        by `git worktree add`, and **creating it is what makes it ours**, so nothing is asked and
        nothing is at risk. **Do not replace this with a case-insensitive comparison** — that fixes one
        filesystem and lies on the next.
        - [x] **An unreadable registry REFUSES**, like the committed-targets gate one door over: "I
              cannot tell" must never be the answer that authorises `git reset --hard`.
        - [x] ⏱️ **Asked BEFORE the dry-run return, and that is a deliberate break with the neighbouring
              gate.** `--dry-run` still changes nothing (the question is read-only), but it now refuses
              — because a dry run that prints `git reset --hard /Users/dev/Kenjaku` as its plan has
              already taught the reader the hazard is routine. **That is literally how S1 was found.**
              The committed-targets gate stays out of dry runs: it protects a SCORE, and a dry run
              produces none.
        - [x] **Verified against the real machine, not only through doubles**: both hazards exit 2 from
              the real CLI, and the ordinary worktree still plans.
  - [x] **S1 — the F6 guard is case-sensitive, and the filesystem is not.**
        `maintainers/mutation/mutate-one.mjs:337`. `worktreePath === repoRoot` compares STRINGS, so
        `--worktree Kenjaku` is a different string, `existsSync` says the folder is there (so
        `git worktree add` is skipped), and the run ends with `git reset --hard` + `git clean -qfd`
        **inside the real checkout** — the exact outcome F6 exists to prevent, one shift key away from
        the name F6's own comment quotes. The `uncommittedTargets` gate cannot save it: it inspects
        only the named target files, deliberately, so every uncommitted plan edit and every untracked
        file dies. **macOS and Windows both, i.e. Thomas's machine.** _Fix shape: compare resolved
        real paths, or refuse any path whose `git rev-parse --show-toplevel` is this repo — the second
        also closes S3._
  - [x] **S2 — `--log` is the unguarded sibling of `--worktree`, and it is the one that calls the
        delete.** `mutate-one.mjs:345`. The value goes from argv straight into
        `join(repoRoot, REPORTS, logName)` with no shape check, and `planRun` then emits
        `discard-stale-log` → `rmSync(path, { force: true })` (line 481), followed by `writeFile` of
        the Stryker output. `--log ../../../../.zshrc` normalises outside the repo: **deleted, then
        overwritten.** F6 hardened one of the two path-shaped arguments; this is the other one.
  - [x] **S3 — a SIBLING checkout is still reachable.** Already on record as F6's deliberate residual
        (§ D), and **independently re-raised by the second pass**, which is the argument for promoting
        it out of "residual": `--worktree kenjaku-2` passes every guard, and a second clone's
        uncommitted work is reset. The reviewer's framing is the useful one — **the property is
        OWNERSHIP, not name shape**: refuse any path this run did not create, or that `git worktree
        list` does not name. That single check closes S1, S3, and the class.
- [ ] **J. Second pass — wrong on the deployed fleet, or wrong to the owner**
  - [ ] **S4 — F4's gitignore line stops the leak and starts a permanent divergence on the SECOND
        machine.** `scripts/lib/ignore-base-settings.mjs:26`. `.claude/settings.json` is gitignored and
        regenerated per machine (`brain-rehydrate.mjs`, `UNTRAVELLABLE`), but **its provenance sha
        travels inside the tracked manifest**. With the base copy now ignored too, machine B pulls a
        sha describing machine A's bytes and **no base bytes at all**: rehydrate regenerates the file
        (machine B's absolute paths) and never calls `rerecordEngineWrite`, and `planBaseSeed` cannot
        seed a base because the regenerated bytes will never match machine A's sha. Result on every
        second machine, forever: `.claude/settings.json` reported at **every session start** with no
        `.new` to dismiss, and every update preserving it as `no-provenance` with a sidecar instead of
        merging. `brain-rehydrate.mjs`'s own comment (*"the reconcile re-seeds"*) is false for exactly
        this file. ⚠️ **This is also the answer to F1's follow-up question** — see § A.
  - [ ] **S5 — F7's swallow leans on a surface that swallows the same failure.**
        `scripts/update-engine.mjs:806`. F7 made step 10 fail-soft on the argument that *"the nudge is a
        standing surface, a line omitted once comes back on its own"* (§ C). But
        `session-engine-divergence.mjs:51` catches the identical throw and returns
        `{ reported: false }`. So a merge file left unreadable (a sync client, a restored backup, a bad
        umask) is omitted by the update recap **and** by the session banner, with no diagnostic on
        either path — and nothing distinguishes *"nothing held back"* from *"could not look"*.
        **F7's own premise is what fails here**, which is why this is J and not L.
  - [ ] **S6 — F9's reordering turned a designed refusal into a stack trace.**
        `scripts/lib/engine-adopt.mjs:116`. Before F9, a brain with a missing or mid-edit
        `engine-manifest.json`, asked about a file with **no `.new` beside it**, returned
        `{ adopted: false, blocked: "no-candidate" }` — a sentence. Now the manifest is parsed FIRST
        (which F2's third question needs), it throws, and `adopt-engine-file.mjs:142` has no
        `try/catch`. Keep the ordering, wrap the read, map the failure to a named `blocked` reason —
        `BLOCKED_LINE` having no fallback (§ B) means the new reason cannot ship without its sentence.
  - [ ] **S7 — an install that wires a connector hands the owner a brand-new brain with a dirty tree.**
        `installer.mjs:711`. The brain's only `git add -A` + `git commit` runs at **662-667**; the
        connector merge and `rerecordEngineWrite` run at **694/711**, and there is no second commit in
        the file. So right after printing *"local git repo ready (install commit)"*, `git status` shows
        a modified `engine-manifest.json` the owner cannot explain. It self-heals at the first
        SessionStart sweep — **the defect is the first impression**, on a product whose whole promise
        is that it commits for you.
  - [ ] **S8 — the installer announces a record that may not have happened.** `installer.mjs:712`
        prints *"engine provenance re-recorded"* unconditionally, while `rerecordEngineWrite` returns
        **the rels it actually recorded** and returns `[]` when the path is absent or outside
        `regimes.merge` — writing nothing. `engine-base-fs.mjs` documents that return as existing *"so
        a caller can say what it did"*, and the only caller drops it. **This is the shape the repo's own
        `CLAUDE.md` guardrail forbids in one word: "Don't pretend".** Fix is one line —
        `const recorded = …; if (recorded.length) ok(…)`.
- [ ] **K. Second pass — two holes left in F2's containment guard**
  - [ ] **S9 — the exact string `".."` is its own canonical form.** `engine-adopt.mjs:98`. `rel = ".."`
        → `relative(brainDir, join(brainDir, ".."))` is `".."`, so `canonical !== rel` is false,
        `startsWith("../")` is false, `isAbsolute("..")` is false: **all three questions pass**, and the
        only thing still refusing it is `selectMergeFiles`. That last line is not load-bearing by
        design — `advanceRegimes` imports whatever globs the FETCHED engine declares, and
        `globToRegExp("**")` compiles to `^.*$`, which matches `".."`. **One leading-wildcard merge glob
        in a future manifest re-opens the escape F2 was written to close.** Fix:
        `canonical === ".." || canonical.startsWith("../")`.
  - [ ] **S10 — the guard is lexical, so a symlink walks straight through it.**
        `engine-adopt.mjs:96`. `relative()` and `join()` never touch the filesystem. An owner who
        symlinks `.claude/skills/coach` at a shared folder outside the brain — a documented way to share
        skills between brains — gives `.claude/skills/coach/SKILL.md` a spelling that is canonical,
        lexically inside, and matched by `.claude/skills/**`; `writeFileSync` then follows the link and
        writes **outside the brain**. The module's stated contract is *"DOES IT STAY IN THE BRAIN?"*,
        and only `realpathSync` can answer that. _(Weigh the cost: it adds I/O to a pure module, and
        F2's design deliberately asks its questions before touching disk. The honest fix may be to
        realpath **once**, at the point where the write is already committed to.)_
- [ ] **L. Second pass — prose, tests and altitude (non-blocking; the cheap half is worth taking with
      the rest, the two design ones are G-class)**
  - [ ] **S11 — `(s)` survived F14 in six lines of the same report.** `update-engine.mjs:429, 432, 438,
        446, 517, 520` still render `skill(s)`, `server(s)`, `hook(s)`, `command(s)` — each with a
        known-length array in hand. F14's own words were that `(s)` is *"the hedge of a sentence that
        does not know what it is describing"*, and it introduced `countOf`. **The half-fix is louder
        than the original defect**: the owner now reads *"new engine skill(s) installed: coach"* three
        lines under *"1 engine file swapped"*. ⚠️ Line 429 is **pinned by a test** that enshrines the
        hedge — the test moves with the fix.
  - [ ] **S12 — 🧭 G-CLASS, worth costing before spending. `INVITED_EDITS` answers in CODE a question
        the manifest answers everywhere else.** `engine-divergence.mjs:48` is a hardcoded
        `new Set(["CLAUDE.md"])`, while regimes (`replace`/`regenerate`/`merge`/`local`) plus `retired`
        are declared per release in `engine-manifest.json` and advanced onto older brains by
        `advanceRegimes` — precisely so an old brain and a new engine agree about file families. An
        `invited` regime would need no code change and no release to answer F1's follow-up. **Weigh
        against**: a new regime is a fleet-wide vocabulary change on a release already large.
  - [ ] **S13 — 🧭 G-CLASS. `reconciledFileMap` is a hand-maintained special case.**
        `reconcile-brain.mjs:339/381`. F1's invariant is general — *a file the ENGINE wrote must never
        read as a file the OWNER is holding back* — but it is enforced by one manual assignment beside
        one `writeFileSync`, then threaded by hand through `runReconcileCli` (575) and `updateEngine`
        (704). The next in-place write (the diff's own comment anticipates one) must remember all
        three, and missing any one silently recreates F1 for that file. **A recording write helper
        owning both the write and the map makes forgetting impossible.**
  - [ ] **S14 — two of F8's four source-text assertions pin whitespace, in a repo whose convention is
        heavy inline commenting.** `scripts/installer-connector-provenance.test.mjs:414`. The regexes
        require `rerecordEngineWrite(` to be the FIRST line after the `if` brace, and forbid any line
        between `applyConnectorFiles(...)` and `connectorsTouchedSettings = true`. **Adding one
        explanatory comment — the norm everywhere else in `installer.mjs` — turns the suite red with a
        message about a missing guard that is still there.** The third test (index ordering) already
        proves the load-bearing claim without the brittleness.
  - [ ] **S15 — two edge cases break `ignoreBaseSettings`' own "touch nothing else" contract.**
        `ignore-base-settings.mjs:52`. **(a)** on an empty `.gitignore`, `endsWith("\n")` is false so
        `separator = eol`, and `eol` is appended again — the owner's file gains **two leading blank
        lines** they never wrote. **(b)** `isEntry` matches only the exact path, so a brain whose
        `.gitignore` already says `.engine-base/` — the broader, equally correct entry a maintainer
        would naturally write — **gets the narrow line appended anyway**, and the idempotence test
        cannot see it because it only ever feeds back the exact spelling.

## What this says about the mode, recorded now rather than at the debrief

The loop declared this release finished: every slice green, Windows 7/7 on real CI, mutation scores
measured, an empty queue announced three times. **An independent read of the same code found a
fleet-wide defect in the release's own headline feature, a path escape, and a silent deletion.** None
of them is exotic; all three are the kind a second pair of eyes catches and an author's own tests
cannot, because the tests encode the author's model of the problem.

The mode's own deferred question was whether a slice built by a fan-out owes an adversarial review
before it counts as finished. **The answer arrived from the field, and it is yes.**

**What the SECOND pass added to that, owned by
[`agent-orchestrated-release-mode-action.md`](agent-orchestrated-release-mode-action.md) and not
restated here**: the same figure came back on the *repairs* (15), two of them inside the guard the
batch had just written. The lesson, and the tool limitation measured twice, live there.
