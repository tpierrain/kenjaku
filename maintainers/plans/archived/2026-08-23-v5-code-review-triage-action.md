<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- This file OWNS the findings of EVERY v5.0.0 code-review pass — two so far -->
<!-- (F1-F15, then S1-S15), each in its own dated section, a THIRD incoming.   -->
<!-- Their fixes and their state too. The `## 📍 STATE` block below is its only-->
<!-- perishable content: do not restate it here, in another file, or in a     -->
<!-- resume header.                                                           -->
<!-- Owning release plan: v5-unfreezes-the-existing-fleet-action.md (item 4a),-->
<!-- which links here and restates none of this.                              -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Action plan — triaging the v5.0.0 code review

## ✅ CLOSED — all 45 findings discharged, shipped in **v5.0.0** _(archived 2026-08-23)_

Three independent `/code-review` passes ran on this branch (F1-F15, S1-S15, T1-T15). **Every one of
the forty-five findings is paid**, each in its own dated section below, with its commits, its
mutation score and its lesson. The campaign was closed at three passes by Thomas on 2026-08-23
(*"on close (ça a déjà trop duré)"*), on the argument that the count held at fifteen while the
**stakes** thinned — the first pass moved the update path itself, the third mostly moved the
measuring tools.

The release these findings gated was cut and published the same day:
[`v5-unfreezes-the-existing-fleet-action.md`](../archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md)
owns the cut, and it is the only plan still open on v5.

🔗 **The one finding that was NOT taken now has a home outside this file**: the ~24 candidate dead
links across delivered docs, and the product question inside it, are
[issue #78](https://github.com/tpierrain/kenjaku/issues/78). It was lifted out **before** this plan
was archived, on purpose — an open finding buried in a closed plan is how a real defect disappears.

_(Everything below is the historical record of the three passes. Do not read it for status.)_

## 🔭 FOUND ON THE WAY AND **NOT** TAKEN — open, each with what it would cost

_(Lifted out of the `## 📍 STATE` block on 2026-08-23, when that block was cut back to its cap. These
were living **only** there, which is how a real finding becomes invisible: STATE is read at every
resume and rewritten at every one too. They are not statuses — they are findings with an open
question, and they belong in prose until someone answers them.)_

- 🔗 **~24 candidate dead links across 41 delivered files**, found by the probe written for the
  delivered-prose guard. `README.md` alone links a dozen times into `maintainers/` and to
  `EN-QUOI-C-EST-DIFFERENT.md`, both dev-only, so **every owner who follows them lands nowhere**.
  _(The one certain instance, `CONNECTORS.md`'s two links into `maintainers/`, was fixed in
  `156ce8e`.)_
  - ⚠️ **Most of the rest are FALSE POSITIVES of a naive resolver**, and that is the whole reason it
    was not simply fixed: `engine-skills/<x>/SKILL.md` is installed at `.claude/skills/<x>/`, so its
    `../sync-sources/SKILL.md` is right in a brain and wrong in the launcher tree. A guard for this
    class needs **install-location awareness**.
  - ❓ **And the README half is a product question, not an engineering one**: is a brain's copy of the
    launcher README meant to link to the launcher's own docs? **That one is Thomas's.**
  - **Cost if it is wanted**: the resolver is ~20 lines; the README decision is one sentence from him.
  It is a **new finding**, not one of the fifteen, which is why it was not folded into the queue.

## How the batch was worked — durable, this is what it cost

**The GO, in his words** _(2026-08-22)_: *"Oui, en test-first, et tu me montres à la fin."* A red test
for the right reason first, then the code, **one commit per subject**, green only, and a report at the
end. It covered categories **A, B, C, D and F** — never **E** (his product call) nor **G** (quality
work worth costing before spending).

**The blocker was decided before the batch started, shape (a)**: *"ne parler que des fichiers vraiment
tenus par toi."* F1 below carries the design, what it owed in tests, and the two rejected shapes, so
none of it is re-litigated.

**The scope was WIDENED TWICE, and the record is kept here so it is never re-litigated** _(moved out
of the STATE block on 2026-08-23)_. The first offer was narrow — *"no loop, S11 + S15 + the report"*.
It became *"je veux que tu en fasses le maximum (tout ce qu'on a identifié comme à faire)"* the same
evening _(2026-08-22)_, then *"j'aimerais que tout soit fait pour pouvoir shipper la release"*
_(2026-08-23)_. Both are **spent**: the work they bought is done.

> 🛑 **AND "THE MAXIMUM" NEVER LIFTED THE PROHIBITIONS.** They are unchanged and absolute: do not
> merge, tag or publish [#76](https://github.com/tpierrain/kenjaku/pull/76), do not write into either
> of his two real brains, do not write under `templates/fr/**`. **A GO on engineering is not a GO on
> the release**, and the STATE block restates only the prohibitions, never this paragraph.
>
> 🔄 **One line of that box WAS overtaken and is retired here**: it also forbade running the rehearsal
> on a copy of a real brain — written when the rehearsal was an idea nobody had asked for. He then
> asked, in as many words, to make sure the QA campaign was enough and that v5 would not turn out to
> touch no existing brain, which is that trial and nothing else. It ran on **copies** (no `.git`, so
> no remote and no push is even expressible) and it found the release-stopping defect. The originals
> stay untouchable, and the rehearsal is the release plan's, § *THE REHEARSAL*.

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
[`v5-unfreezes-the-existing-fleet-action.md`](../archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md). This file
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
- [x] **E. Product / locale — ANSWERED BY THOMAS** _(2026-08-23 · remedy (b), no translation)_
  - [x] **F11 — a French brain loses a localized skill and receives an English one.**
        `engine-manifest.json:75`. The branch deletes the French `tdd-discipline` twin;
        `test-first-discipline` ships **English only**. So on a French brain the localized skill is
        retired (provably, by sha) and the English one installed in its place. `locale-drift.mjs` needs
        a twin to **exist** to report drift, so CI is blind to a twin that was **deleted**. Either
        translate it, or say so in the release note. **The note currently says nothing.**
        - 🚧 **WHY A SESSION MAY NOT JUST TRANSLATE IT, asked and answered 2026-08-22.** The boundary
              reads "never, alone, translate anything under `templates/fr/**`", and the reason was
              nowhere in this file — it had to be reconstructed from three places, which is how a rule
              becomes folklore. It is **not** a ban on writing French: this very release wrote FR twins
              (S8-1, S10-6b), as **ports of prose already agreed in English, in the same commit**.
              Three things make F11 different, and all three are the owner's:
              - **The finding offers TWO remedies and picking one decides what v5 delivers** to French
                brains. That is a product call, not an engineering one.
              - **This Markdown IS behaviour** (§ H's 📐 box, his own words). 350 lines of unreviewed
                French doctrine would not sit in a doc — a French brain would **obey** them.
              - **A twin is a standing commitment, not a task.** Once it exists, `locale-drift` pairs
                the two forever and every future edit owes both. Taking that on is his to take.
        - 📊 **WHAT IT ACTUALLY COSTS A FRENCH OWNER — measured, 2026-08-22, and it is close to
              nothing.** He asked the only question that matters ("c'est quoi l'impact pour lui ?")
              and the answer was nowhere on record. Three facts, read off the repo:
              - **The skill is in `regimes.merge`, so it does ship into brains** — but a skill loads
                **only when a task matches its description**, and this one's is *"as soon as you write
                or modify code"*. A brain used for notes never loads it. **The affected population is
                owners who ask their brain to write code, in French.**
              - **For them, the brain still works.** It reads English natively. What is lost is
                comfort: an English document sitting among their French ones if they open it.
              - 🔄 **And the deleted French text was v1.1.0, whose opening rule was
                *"baby steps, PAS test-first batch"* — the exact rule this release retired because it
                was measured and did not survive.** So the French owner is not losing something good.
                They are losing an **obsolete** text that made their brain work less well, and
                receiving the correct one in English.
              ✅ **Therefore: remedy (b), the release note, is not the cheap half — it is the right
              answer**, and a translation would be a comfort feature, not a repair. Recorded so the
              next session does not re-open this as an unresolved product call.
              🛡️ **The counterweight, stated so the decision is honest**: nothing merges without him,
              so a translation would wait in #76 like everything else. The real risk is not a bad
              merge, it is **him merging 350 lines of French he did not read**.
              ✅ **CONFIRMED BY THOMAS, 2026-08-23, and this is the last word**: *"ça n'est pas
              nécessaire de traduire la skill sur le tdd qu'on remplace par une autre stratégie"*.
              He was asked twice more after the ✅ above was written, because the STATE block still
              advertised the call as pending (see it, and the trap that fixes it, up there). **The
              measured impact above is settled evidence, not an argument to re-run at him.**
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
- [x] **G. Quality, non-blocking — v5 PAYS THEM** _(2026-08-23, under "le maximum" · F12 `27d9ce9`; F13 measured and declined, see below)_
  - [x] **F12 — `stripComments` is not regex-aware** _(2026-08-23 · `27d9ce9` — and it was not theoretical: THIRTEEN files in this repo's own `scripts/**` left the scanner stuck inside a phantom string, one of them production code delivered into every brain)_ (`entrypoint-discipline.mjs:141`): a `//` inside a
        regex literal blanks the rest of the line, so the entry-point guard can miss a hand-rolled
        guard and its ceilings can be satisfied by a file that still hand-rolls one.
  - [x] **F13 — four full read-and-sha256 passes per update** over every engine-owned file
        (`engine-base-fs.mjs:64`), despite the module's own "Read ONCE, used TWICE" comment, plus a
        fifth at **every** session start. Thread the already-read `installedFileMap` through.
        - 🔬 **MEASURED, THEN DECLINED — 2026-08-23.** On a **copy of a real brain** (682 notes,
          v5.0.0): the merge regime resolves to **16 files**; one full read pass is **1.65 ms**, one
          sha256 pass over them **0.62 ms**. So the four passes cost **~7 ms of an update that spends
          tens of seconds in `npm install` and a reindex**, and the session-start pass costs **1.7 ms**.
          The walk was already narrowed to the globs' roots at S4-4c, which is where the cost that
          mattered (reading the owner's whole vault) actually was.
        - 🛑 **What threading would buy, against what it would risk.** The reads are NOT redundant:
          the update **writes merge files between them** (three refresh families, plus the in-place
          settings write), and `readEngineDivergence`'s own comment states the requirement — it must
          read the brain **as it now is**, because a report computed from an earlier pass describes a
          brain that existed halfway through the update. Threading a map through those points buys
          ~5 ms and makes a **stale divergence report** reachable by refactor: the brain telling an
          owner they are holding back a file the engine had just rewritten, which is F1 — the defect
          this release exists to remove — arriving by the back door.
        - ✅ **The "Read ONCE, used TWICE" comment is not the lie it reads as.** It is scoped to its
          own two lines (`reconcile-brain.mjs:145`): the heal and the ancestor fetch share one read,
          and they do. Nothing there claims the update reads once overall.
        - 🎚️ **Reversible in one sentence from Thomas**, and this is the only reason it is not simply
          closed: the numbers say no, but the call to spend 5 ms of engineering risk is his. Nothing
          else in the queue depends on it.
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
        [`agent-orchestrated-release-mode-action.md`](2026-08-23-agent-orchestrated-release-mode-action.md) —
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
- [x] **J. Second pass — wrong on the deployed fleet, or wrong to the owner** _(2026-08-22 · `f716066` S4, `d17896c` S5, `94272e9` S6, `e27ed4a` S7+S8+S14)_
  - [x] **S4 — F4's gitignore line stops the leak and starts a permanent divergence on the SECOND
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
  - [x] **S5 — F7's swallow leans on a surface that swallows the same failure.**
        `scripts/update-engine.mjs:806`. F7 made step 10 fail-soft on the argument that *"the nudge is a
        standing surface, a line omitted once comes back on its own"* (§ C). But
        `session-engine-divergence.mjs:51` catches the identical throw and returns
        `{ reported: false }`. So a merge file left unreadable (a sync client, a restored backup, a bad
        umask) is omitted by the update recap **and** by the session banner, with no diagnostic on
        either path — and nothing distinguishes *"nothing held back"* from *"could not look"*.
        **F7's own premise is what fails here**, which is why this is J and not L.
  - [x] **S6 — F9's reordering turned a designed refusal into a stack trace.**
        `scripts/lib/engine-adopt.mjs:116`. Before F9, a brain with a missing or mid-edit
        `engine-manifest.json`, asked about a file with **no `.new` beside it**, returned
        `{ adopted: false, blocked: "no-candidate" }` — a sentence. Now the manifest is parsed FIRST
        (which F2's third question needs), it throws, and `adopt-engine-file.mjs:142` has no
        `try/catch`. Keep the ordering, wrap the read, map the failure to a named `blocked` reason —
        `BLOCKED_LINE` having no fallback (§ B) means the new reason cannot ship without its sentence.
  - [x] **S7 — an install that wires a connector hands the owner a brand-new brain with a dirty tree.**
        `installer.mjs:711`. The brain's only `git add -A` + `git commit` runs at **662-667**; the
        connector merge and `rerecordEngineWrite` run at **694/711**, and there is no second commit in
        the file. So right after printing *"local git repo ready (install commit)"*, `git status` shows
        a modified `engine-manifest.json` the owner cannot explain. It self-heals at the first
        SessionStart sweep — **the defect is the first impression**, on a product whose whole promise
        is that it commits for you.
  - [x] **S8 — the installer announces a record that may not have happened.** `installer.mjs:712`
        prints *"engine provenance re-recorded"* unconditionally, while `rerecordEngineWrite` returns
        **the rels it actually recorded** and returns `[]` when the path is absent or outside
        `regimes.merge` — writing nothing. `engine-base-fs.mjs` documents that return as existing *"so
        a caller can say what it did"*, and the only caller drops it. **This is the shape the repo's own
        `CLAUDE.md` guardrail forbids in one word: "Don't pretend".** Fix is one line —
        `const recorded = …; if (recorded.length) ok(…)`.
- [x] **K. Second pass — two holes left in F2's containment guard** _(2026-08-22 · `e6c4deb` — one commit, one guard)_
  - [x] **S9 — the exact string `".."` is its own canonical form.** `engine-adopt.mjs:98`. `rel = ".."`
        → `relative(brainDir, join(brainDir, ".."))` is `".."`, so `canonical !== rel` is false,
        `startsWith("../")` is false, `isAbsolute("..")` is false: **all three questions pass**, and the
        only thing still refusing it is `selectMergeFiles`. That last line is not load-bearing by
        design — `advanceRegimes` imports whatever globs the FETCHED engine declares, and
        `globToRegExp("**")` compiles to `^.*$`, which matches `".."`. **One leading-wildcard merge glob
        in a future manifest re-opens the escape F2 was written to close.** Fix:
        `canonical === ".." || canonical.startsWith("../")`.
  - [x] **S10 — the guard is lexical, so a symlink walks straight through it.**
        `engine-adopt.mjs:96`. `relative()` and `join()` never touch the filesystem. An owner who
        symlinks `.claude/skills/coach` at a shared folder outside the brain — a documented way to share
        skills between brains — gives `.claude/skills/coach/SKILL.md` a spelling that is canonical,
        lexically inside, and matched by `.claude/skills/**`; `writeFileSync` then follows the link and
        writes **outside the brain**. The module's stated contract is *"DOES IT STAY IN THE BRAIN?"*,
        and only `realpathSync` can answer that. _(Weigh the cost: it adds I/O to a pure module, and
        F2's design deliberately asks its questions before touching disk. The honest fix may be to
        realpath **once**, at the point where the write is already committed to.)_
### How the SECOND batch was worked, and the four calls it made on its own

Same GO, same shape as the first: red for the right reason, then the code, **one commit per subject**,
green only. **Six commits**: § I (`ca46027`), S4 (`f716066`), S5 (`d17896c`), S6 (`94272e9`),
S7+S8+S14 (`e27ed4a`), § K (`e6c4deb`). Four decisions were taken inside these fixes that no finding
dictated — written here so they are not re-derived or quietly reversed:

1. **§ I — the guard is OWNERSHIP, and it is asked before the dry-run return.** Three findings, one
   check: a directory that already exists may be reset only if `git worktree list --porcelain` names
   it. The dry run now refuses too, breaking with the neighbouring committed-targets gate (which stays
   out of dry runs because it protects a SCORE). **Why**: the dry run is literally how S1 was found —
   a plan that prints `git reset --hard /Users/dev/Kenjaku` has already taught the reader it is fine.
2. **S4 — the ancestor a machine HOLDS outranks the digest the shared manifest REMEMBERS.** The
   obvious fix (re-record on rehydrate) is only half, and alone it is not a fix: machine B's sha
   travels back through the tracked manifest and machine A starts making the same false claim. So the
   report asks `.engine-base/<rel>` first, and falls back to the digest where the brain holds no
   ancestor. **What this deliberately does NOT answer**: whether `.claude/settings.json` should leave
   the nudge the way `CLAUDE.md` did — still Thomas's, and now a narrower question, about the machine
   that really did edit the file.
3. **S5 — the fix is per FILE, and one sentence is deliberately left unsaid.** `readInstalledMerge
   Files` takes an OPT-IN collector (a seeder that quietly skipped a file it could not read would
   record an ancestor for a brain it never saw), the update recap names the files in a line of its
   own, and the session hook takes the collector but **discards it**. 📌 **RESIDUAL, named rather
   than smuggled in**: that hook's voice is *"a file the engine leaves alone is a choice, not a
   problem"*, and an unreadable file is neither. Saying it belongs to the **health banner**, which
   owns the alarm voice. Worth doing; not this batch.
4. **S10 — scoped to the adoption door on purpose.** Engine writes elsewhere follow symlinks just the
   same, and that is consistent rather than sloppy: their rels come from the **manifest**, this one
   from the **conversation**, which is the whole reason F2's guard exists. **Named consequence**: an
   owner who symlinks a skill folder out of the brain cannot adopt through it. The day an engine write
   takes an untrusted rel, the check belongs lower.

- [x] **L. Second pass — prose, tests and altitude — ALL FOUR PAID** _(2026-08-22/23, under "le maximum" · S11 `84c8d07`, S15 `229cc4c` `eff040c` `1cac9b8`, S13 `659c598`, S12 `45fc4d7` `2cd9484`)_
  - [x] **S11 — `(s)` survived F14 in six lines of the same report.** _(2026-08-22 · `84c8d07`, behind one `plural.mjs` that four modules now share)_ `update-engine.mjs:429, 432, 438,
        446, 517, 520` still render `skill(s)`, `server(s)`, `hook(s)`, `command(s)` — each with a
        known-length array in hand. F14's own words were that `(s)` is *"the hedge of a sentence that
        does not know what it is describing"*, and it introduced `countOf`. **The half-fix is louder
        than the original defect**: the owner now reads *"new engine skill(s) installed: coach"* three
        lines under *"1 engine file swapped"*. ⚠️ Line 429 is **pinned by a test** that enshrines the
        hedge — the test moves with the fix.
  - [x] **S12 — 🧭 G-CLASS, worth costing before spending. `INVITED_EDITS` answers in CODE a question
        the manifest answers everywhere else.** `engine-divergence.mjs:48` is a hardcoded
        `new Set(["CLAUDE.md"])`, while regimes (`replace`/`regenerate`/`merge`/`local`) plus `retired`
        are declared per release in `engine-manifest.json` and advanced onto older brains by
        `advanceRegimes` — precisely so an old brain and a new engine agree about file families. An
        `invited` regime would need no code change and no release to answer F1's follow-up. **Weigh
        against**: a new regime is a fleet-wide vocabulary change on a release already large.
  - [x] **S13 — 🧭 G-CLASS. `reconciledFileMap` is a hand-maintained special case.** _(2026-08-23 · `659c598`)_
        `reconcile-brain.mjs:339/381`. F1's invariant is general — *a file the ENGINE wrote must never
        read as a file the OWNER is holding back* — but it is enforced by one manual assignment beside
        one `writeFileSync`, then threaded by hand through `runReconcileCli` (575) and `updateEngine`
        (704). The next in-place write (the diff's own comment anticipates one) must remember all
        three, and missing any one silently recreates F1 for that file. **A recording write helper
        owning both the write and the map makes forgetting impossible.**
  - [x] **S14 — two of F8's four source-text assertions _(2026-08-22 · `e27ed4a`, with S7/S8 — the very commit their brittleness would have blocked)_  pin whitespace, in a repo whose convention is
        heavy inline commenting.** `scripts/installer-connector-provenance.test.mjs:414`. The regexes
        require `rerecordEngineWrite(` to be the FIRST line after the `if` brace, and forbid any line
        between `applyConnectorFiles(...)` and `connectorsTouchedSettings = true`. **Adding one
        explanatory comment — the norm everywhere else in `installer.mjs` — turns the suite red with a
        message about a missing guard that is still there.** The third test (index ordering) already
        proves the load-bearing claim without the brittleness.
  - [x] **S15 — two edge cases break `ignoreBaseSettings`' own "touch nothing else" contract.** _(2026-08-22 · `229cc4c` `eff040c` `1cac9b8`)_
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
[`agent-orchestrated-release-mode-action.md`](2026-08-23-agent-orchestrated-release-mode-action.md) and not
restated here**: the same figure came back on the *repairs* (15), two of them inside the guard the
batch had just written. The lesson, and the tool limitation measured twice, live there.

## Third pass — `/code-review max` (whole branch), 2026-08-23

**How it was run**: typed by Thomas after a context clear, no range — which is the whole branch
(`main...HEAD`), the same invocation as the first pass. **51 min.** Findings are numbered **T1…T15**
so they collide with neither F1–F15 nor S1–S15.

**And the fan-out came back this time**, which the two earlier passes never got: **10 finder angles ×
8 candidates, deduped, then 15 verifier agents**, one per surviving candidate. → the mode plan's
standing warning (*"do not commission a third pass expecting fan-out"*) is **overtaken by this run**
and its § *The adversarial-review fan-out as standing QA* owns the correction.

**Four candidates were REFUTED by the verifiers and dropped** — recorded so they are not re-found: the
"discarded" `healedProvenance` (the self-heal child persists it), the un-liftable tombstone (`retired:
[]` does lift it, ADR 0039), the removal of `plan.replaceScripts` from `copyGlobs` (the documented
point of the slice), and the missing French `test-first-discipline` (the owner's S6e decision).

> ⚠️ **NOT INDEPENDENTLY RE-CHECKED YET.** The two earlier passes were re-verified by the session
> before a line was written, and that caught real false positives. **This section is the reviewer's
> word until each item carries its own 📐.** Verify before fixing, and fix test-first, red first.

### 📍 Third-pass tracking

- [x] ✅ **T1 — six of eight SessionStart hooks are DISARMED on a symlinked brain path — PAID**
      _(2026-08-23 · `779637e`)_. Confirmed independently before fixing, then reproduced **as a
      process** on the real hook. Seven scripts moved to `runAsEntrypoint`; the two spellings left are
      non-canonical but correct (`import-brain.mjs` realpaths both sides, `update-engine.mjs` calls the
      canonical predicate), so the old count went 9 → 2 rather than to 0 — and a **new** guard,
      `findSymlinkBlindGuards`, holds the correctness half at **0, forever**. Suites 2 602 / 66.
      **The original wording is kept below, because how the old guard lied is the lesson.**
      (`session-self-heal.mjs:186` and five siblings). They still gate on
      `resolve(process.argv[1]) === fileURLToPath(import.meta.url)`, the predicate this very branch
      replaced with `realpathSync` in `lib/entrypoint.mjs` — Node realpath-resolves the main module, so
      the guard is false and the hook **silently does nothing**. `installer.mjs:293` builds the brain
      path with `resolve()`, never `realpathSync`, so a symlinked home, an aliased volume, `/tmp`, an
      iCloud/Dropbox path all reach it. Only `session-status.mjs` and `session-engine-divergence.mjs`
      use `runAsEntrypoint`. **Tracked today only as `HAND_ROLLED_CEILING = 9`, whose failure message
      is about testability, never about the hooks being dead.** _(Highest fleet impact of the pass.)_
- [x] ✅ **T2 — the Stop hook dies at load on a brain that customized `auto-push.mjs` — PAID**
      _(2026-08-23 · `814be9a` + `6e0181c` `566ba35`)_. **Confirmed independently before fixing, and
      reproduced as a PROCESS on the REAL `v4.9.1:scripts/auto-push.mjs`**: exit 1, `SyntaxError: does
      not provide an export named 'isEntryPoint'`, while `node --check` passed on the same file — the
      two blindnesses the finding named, both observed rather than reasoned.
      - 📏 **The population is exact, and it is measured, not estimated.** Over the **25 published
            tags**, `auto-push.mjs` imports from `auto-commit.mjs` at **v4.9.1 and nowhere else** — so
            the brains at risk are those on the LATEST release whose auto-push they had tuned. It is
            also the only cross-import between merge-regime scripts in the repo's whole history.
      - **Three things landed, and the third is the one that matters.** (1) `isEntryPoint` is published
            again, **delegating** to the canonical predicate — one behaviour, two names — so those old
            callers also inherit the realpath fix T1 paid for and never shipped with. (2)
            `attemptCommit`/`COMMIT_MESSAGE` moved to `lib/vault-commit.mjs` and are re-exported from
            auto-commit for the fleet: `scripts/lib/**` is one `replace` glob, delivered whole and
            never preserved, so **the coupling is gone in BOTH directions**. (3) A repo-wide guard,
            `engine-script-coupling.mjs`, holds the CLASS at zero — no `merge`-regime script may import
            another one — **seen red naming `scripts/auto-push.mjs:17 imports ./auto-commit.mjs`**,
            which is the defect itself.
      - 🧪 **Mutation 90.91 % → 100 %** on the new scanner (`21-40`), three survivors, all three real
            boundaries the tests had guessed. ⚠️ **And one hunk the instrument CANNOT reach**: a
            `merge`-regime file is instrumented by Stryker, which changes its bytes and turns the S7-2
            freshness guard red in the dry run, so the whole batch measures nothing. It refused loudly
            rather than scoring the rest. → [`mutation/RESULTS.md`](../../mutation/RESULTS.md) § T2.
      - 🧭 **The compat alias is a THIRD spelling of the entry predicate, and it is NAMED, not
            counted**: `HAND_ROLLED_CEILING` stays at 2 and a shrink-only `LEGACY_ALIAS_EXEMPT` carries
            it, because counting a compatibility surface as the defect is how a ceiling starts lying.
      - **The original wording is kept below, because the shape T1 warned about held again**: the two
            defences that should have caught it were both green while the hook was dead.
      (`auto-commit.mjs:81`). This branch drops the exported `isEntryPoint`; `auto-push.mjs` is a
      **separate** merge-regime file refreshed independently (`groupOf: rel => rel`), so a preserved
      customized copy still imports it → `SyntaxError`, **the whole backup/publish path dead at every
      Stop**. The family's defences are blind twice: `node --check` passes on the broken consumer, and
      `verifyWrite` only inspects the file being written, never the preserved sibling.
- [x] ✅ **T3 — ONE unreadable merge file aborts the WHOLE reconcile, silently and forever — PAID**
      _(2026-08-23 · `ab1751d` + `6219f6f`)_. **Confirmed independently before fixing, and reproduced
      as a PROCESS on the real CLI**: exit 1, `EACCES` on stderr, and the engine file still at its old
      content — no copy, no retirement, no launcher regen, no manifest. The same process now exits 0
      and the new bytes reach the brain.
      - **It was TWO seams, not the one line the finding names**, and reading the code was not what
            said so — the test did. Fixing only `:147` moved the throw to `syncBaseTree` at the very
            **last** line that writes, which aborts the same converge a few hundred lines later. Both
            reads now take the opt-in collector. _(Third time on this branch that "one line" was wrong
            about a seam and a run corrected it: W1's ancestor fetch, T2's coupling, this.)_
      - **What set-aside costs, stated exactly**: the FILE and only the file. Absent from the installed
            map, it is a candidate for neither the heal nor the ancestor fetch (both select on its
            keys), so nothing is ever recorded about bytes nobody read. In `syncBaseTree` it is
            dropped from the candidates rather than left to `planBaseSeed`, which would defer it as
            `not-installed` — a sentence about a deleted file, said about a file that is right there.
      - **The collector stays OPT-IN in both places**, which is S5's rule kept rather than bent: a
            caller that does not ask to be told still gets the throw, so no future seeder can go
            silent by forgetting a parameter. Two poles pin that, one per module.
      - 🔊 **The alarm voice was already owned and needed nothing new**: the health probe says a file
            the filesystem refused out loud (`engineFilesVerdict`, S5). What was missing is that the
            other fifteen files went on being denied their update because of one. The report now
            carries the names so no surface has to infer them from a gap.
      - 🧪 **Mutation 95 % → 100 %** on the changed lines, 15 mutants, **reproduced twice** per the
            lone-survivor protocol. The single survivor was a `?? []` **no input could reach**, and
            the honest reply was to delete it rather than write a test around it. →
            [`mutation/RESULTS.md`](../../mutation/RESULTS.md) § T3.
      - 📋 **A SIBLING, NAMED RATHER THAN QUIETLY WIDENED INTO**: `update-engine.mjs:769` calls
            `syncBaseTree` with no collector too, at step 7. Its throw is a different animal — it
            happens **after** the manifest is written and in the owner's own terminal, so it prints
            *"the brain was NOT changed past this point"* over an update that WAS recorded, and skips
            auto-finalize. Loud and wrong rather than silent and wrong. **Not taken here**: it is the
            parent's path, it needs its own pole, and T3 is about the child. Cost if wanted: the same
            one line plus one test.
- [x] ✅ **T4 — `CLAUDE.md` is nominated for an ancestor fetch on EVERY update, forever — PAID**
      _(2026-08-23 · `09e0506`)_. **Confirmed independently before fixing, on the REAL shipped table
      and the REAL shipped manifest**: one plan entry, five candidates, **ten git subprocesses on a
      flawless network**, `hydrated: []`, `failed: ["CLAUDE.md"]`. The same measurement now reads
      **zero and zero**. Every number the finding gave was exact.
      - **The carve-out is by REGIME, not by name**, and that choice is the fix's whole quality:
            `invited` means *"the owner is expected to have made this theirs"*, which is the same fact
            that makes an ancestor unfindable — and unlike *"no row can name it"*, it cannot become
            untrue by regenerating a table. `CLAUDE.engine.md` is one dot away and is still fetched
            for, with a pole of its own, because a prefix match would have silenced the very file this
            release exists to unfreeze while every other assertion stayed green.
      - 🧭 **THE GUARDING TEST WAS THE FINDING, more than the code was.** It asserted *"no published
            byte can name its tag"* against a fixture holding **no `CLAUDE.md` rows**, while the
            shipped table holds five. **A test whose premise is supplied by its own fixture proves the
            fixture** — the same family as the FR false alarm and the hand-rolled lookup, met a third
            time on this branch. Its replacement runs against a fixture that HAS the rows, and a new
            pole in `engine-fingerprints.test.mjs` pins the premise on the **shipped** table, so the
            two can never drift back into agreeing with each other.
      - **The deployed-fleet fallback travels with it**: `invited` is this release's own invention, so
            the brains that would spend ten subprocesses per update are exactly the ones whose
            manifest cannot name the family. `invitedEdits` moved to `engine-source.mjs` beside
            `selectMergeFiles` — two readers now, with nothing else in common, and one spelling is
            what keeps the second from forgetting the fallback.
      - 🧪 **Mutation 100 %** on the changed lines, 8 mutants, reproduced twice. ⚠️ **The FIRST run of
            this pass measured the fix not at all and said ✅**: the range was typed `:34-52` and the
            guard sits on line **53**, one past the end. Caught by reading the per-file breakdown —
            `engine-ancestor.mjs` contributed zero mutants and was silently absent. **That is T13 in
            the wild, third trigger.** → [`mutation/RESULTS.md`](../../mutation/RESULTS.md) § T4.
      - **T14 is HALF-DISCHARGED as a side effect, and only half.** The false *"the update server was
            unreachable"* line no longer appears for `CLAUDE.md`, which is what made it fire on every
            update of every brain. The conflation itself is untouched and still T14's to pay.
- [x] ✅ **T5 — `adoptCandidate` leaves the brain HALF-APPLIED and the skill says "nothing was
      touched" — PAID** _(2026-08-23 · `21aefbf`)_. **Confirmed independently, and reproduced as a
      PROCESS through the real CLI** on a brain with one **gitignored** merge file at mode 000 — the
      shape `.claude/settings.json` is in on every machine: exit **1** with an EACCES stack trace,
      while the brain held the owner's file **overwritten**, their offer **destroyed**, the manifest
      **rewritten** and the answer **not recorded**. The same command now exits **0** with its
      designed sentence, and the answer is recorded.
      - **Why it was permanent, which the finding did not spell out**: the missing half is the
            ANSWER. Without it the session nudge goes on offering a file that was already adopted,
            every session, while the agent has been told to say nothing happened. The fix lands the
            answer; the base seed, the only thing still owed, is re-attempted free at every update.
      - 🧭 **The gitignored detail is not a fixture convenience, it is the realistic vector.** The
            first reproduction failed to reach the defect: `chmod 000` on a TRACKED file shows up as
            a mode change, so the safety commit refused first and the brain was left correctly
            untouched. The files this can actually happen to are the ones git does not watch — which
            is exactly `.claude/settings.json`, gitignored on every brain because it bakes an
            absolute path.
      - 🧪 **Mutation 100 %**, 4 mutants, reproduced twice, file named in the per-file breakdown (T4's
            lesson applied). **The first shape scored 100 % while hiding an unkillable mutant**:
            `unreadable: []` thrown away is indistinguishable from `["Stryker was here"]` thrown
            away. **Returning** it as `{ adopted: true, unreadable }` gave the value a reader, and the
            deepEqual poles kill it on sight. → [`mutation/RESULTS.md`](../../mutation/RESULTS.md) § T5.
      - 📐 **What is NOT fixed, and it is deliberate**: a throw from any OTHER late step still exits 1
            under a skill that reads 1 as *"nothing was touched"*. Making that honest means a new
            exit-code or a partial-success sentence, which is a **product** decision about what the
            owner is told — not a session's to invent mid-queue. The one thrower the finding named is
            gone; the class is named here with its cost.
- [x] ✅ **T6 — an editor backup makes a PERMANENT, un-dismissable session-start nudge — PAID**
      _(2026-08-23 · `1604d3e` + `67682ad`)_. **Confirmed independently before fixing**: three junk
      files beside a perfectly untouched skill → **three** `no-provenance` lines, the dismissal
      refused with `no-candidate`, no answer file written, and the same three lines again on the next
      read. Now **zero**, and the untouched skill is still there.
      - **Fixed at the SOURCE, not in the report**, and the sidecar filter's own sentence is why:
            *"the glob cannot tell them apart… counting it makes the brain claim to hold back a file
            it has never held."* Nothing downstream should ever have been asked about a file the
            engine cannot deliver — not the heal, not the ancestor fetch, not the base seed.
      - 🛑 **A NAMED LIST IS INCOMPLETE BY CONSTRUCTION, and that is only acceptable because of WHICH
            WAY IT FAILS**: a missing pattern leaves the status quo (one more line), a greedy one
            **silences a real held-back engine file** — the exact defect the whole divergence surface
            exists to prevent. So the greedy direction is not left to judgement: a pole runs every rel
            this release actually ships under a `merge` glob, **both locales**, through the filter and
            demands that none be caught. Add a pattern that eats a real file and it goes red on the
            same commit.
      - 🧪 **Mutation 35 % → 100 %** (26 mutants, reproduced twice). **All thirteen survivors were the
            same anchor**, and the anchor IS the safety argument: every `$`, and the four OS patterns'
            `^` arm, could be deleted with the suite green. The negative that existed tested names
            that *start* with those letters — a case no anchor is load-bearing for. **Same family as
            T2's coupling scanner, two days apart: a matcher passing every case written for it while
            guessing where a match may start and end.** →
            [`mutation/RESULTS.md`](../../mutation/RESULTS.md) § T6.
      - 📐 **The un-dismissability itself was NOT changed, deliberately.** A genuine engine file with
            no provenance and no sidecar still cannot be dismissed — and it should not be: that nudge
            is legitimate and ends when the engine heals or delivers. What was wrong was the
            population, and the population is what moved.
- [x] ✅ **T7 — the new EN/FR drift guard measures NOTHING off the repo root, and stays green — PAID**
      _(2026-08-23 · `00caad7` + `977cdb8`)_. **Confirmed independently before fixing**, as a process
      and from three directories: 16 pairs everywhere, **1 drift from the root, 0 from `scripts/`**,
      and the twin's last commit coming back **empty** so the window collapses to `..HEAD`. Suite
      20/20 green from both. After: **the same 1 drift and the same sha from the root, from
      `scripts/`, and from a temp dir outside any repository.**
      - **The guard roots ITSELF, and the repository is deliberately not a parameter.** Its one job is
            to judge *this* repo's `templates/` tree, so it derives the root from its own source
            location and prepends `-C`. A caller cannot forget what it is never asked for. The repo
            had already written the remedy down for another caller, **and the reason it hides**:
            *"a missing `-C` is invisible from a return value, since the command still succeeds, just
            in the wrong directory"* (RESULTS.md § S7-5).
      - 🛑 **EVERY UNIT IN THAT FILE INJECTS ITS OWN `git`, SO THE ONE THING THAT WAS WRONG WAS NEVER
            RUN.** Nine tests plus an anti-vacuity companion, all green, all exercising a fake. **This
            is the entry-point seam rule applied to a DEFAULT**: a parameter with a real-world default
            has two implementations, and the suite was testing the other one. So the new pole runs the
            module **as a process**, from a temp dir in no repository at all, and asserts a sha only
            this repository can produce — it fails one way unrooted, another way misrooted.
      - 📐 **The collapse is no longer allowed to be quiet, and that is a second, deliberate change.**
            An empty last-commit made the window empty and the pair read as *in sync*. A twin comes
            from a tracked listing, so no commit means the question was asked where it could not be
            answered. **Unmeasured is not unchanged** — it throws now, which is the same argument
            `defaultLog` already made in prose for refusing the `{ok:false}` convention.
      - 🧪 **Mutation 90 % → 100 %** (10 mutants, reproduced twice). The lone survivor was **half the
            refusal's sentence**: the pole matched on the twin's path, so *"the pair would read as in
            sync without being measured"* could be emptied. Asserted whole now →
            [`mutation/RESULTS.md`](../../mutation/RESULTS.md) § T7.
- [x] ✅ **T8 — "update or self-heal?" is spelled THREE ways, and the two raw ones guard an `rmSync`
      and a fetch — PAID** _(2026-08-23 · `85c2167` + `2013d0d`)_. **Confirmed independently before
      fixing, on a throwaway fixture and never near anything real**: same brain, three spellings.
      `<brainDir>` keeps the skill; `<brainDir>/` and `<brainDir>/.` **erase it** and send the
      `git fetch` out at the owner's private vault remote. After: all three keep it, and no git.
      - 🚨 **THE REPORT SAYING SO GOES NOWHERE.** On the self-heal path the child is spawned detached
            with `stdio: "ignore"`, so `skillsRetired: ["tdd-discipline"]` is written to a stream
            nobody reads. The owner learns their skill is gone by missing it.
      - **One question, one spelling, in one module** (`update-mode.mjs`). Not tidiness: the rule
            survived only in the copy that happened to be correct, and `engine-merge-apply` — the one
            that normalized — had **no test saying so**, so swapping its guard for a raw comparison
            left its whole file green. It has one now.
      - 🛑 **AND A SCANNER BESIDE THE ANSWER, which paid for itself before the fix was green.** The
            finding named three doors; the repo-wide test's first red listed **four**. The extra one
            is the catch-up line, which a misspelled self-heal would print at a converged brain
            **every morning**. A raw `sourceDir === brainDir` reads exactly like the safe version —
            that is how it passed review twice — and a machine does not have that problem. Same shape
            and same argument as `engine-script-coupling.mjs` (T2's remedy).
      - 📐 **Every door is poled on BOTH sides of the boundary**: a spelling that names the brain
            refrains, *and* a launcher path that merely starts with the brain's still acts. Without
            the second half the fix buys silence instead of safety.
      - 🧪 **Mutation 82.61 % → 100 %** (23 mutants on the module, 18 on the four call sites, each
            reproduced twice, all four doors named in the breakdown). Two survivors were the same
            `\s*`: every fixture had exactly one space, so neither `sourceDir===brainDir` nor a
            formatter-wrapped comparison was covered → [`mutation/RESULTS.md`](../../mutation/RESULTS.md) § T8.
- [x] ✅ **T9 — the status line shows a CLEAN tree over an unversioned vault — PAID**
      _(2026-08-23 · `c3f26bd` + `175eb6b`)_. **Confirmed independently before fixing**, on a
      throwaway git repo of tracked, modified notes: **20 000 → 0.88 MB of porcelain and the `*`
      shows; 24 000 → 1.05 MB, `ENOBUFS`, and the line reports a clean tree** over 24 000 uncommitted
      changes. After: the `*` is back at 24 000. _(The reviewer's 15 000–25 000 bracket holds; the
      exact threshold is a function of note-name length.)_
      - 🛑 **WHY IT WAS SILENT, and it is worth carrying**: `?` is an honest "cannot tell" for the
            branch and the sha. **The dirty flag has no such glyph** — an empty answer renders as
            *clean*, so a read that failed and a vault with nothing to commit are the same line. That
            is why the ceiling had to be the fix rather than a wider catch.
      - 📐 **A "cannot tell" glyph for the asterisk was NOT invented.** What the owner sees is a
            product decision, and the queue is not the place to make one — same call as T5's sibling.
            Named here so it is a choice on record rather than an omission.
      - **Same blind spot as T7, one finding later**: every existing test hands `gitSegment` its own
            scripted git, so the only git that ships was never run by anything. The seam is now
            exported with an `execFile` parameter and its invocation asserted **whole**.
      - 🚧 **NO MUTATION SCORE, and it cannot have one.** `status-line.mjs` is `merge`-regime, and
            **T2 already named this exact limitation**: instrumenting the file changes its bytes, the
            fingerprint freshness guard hashes those bytes, and the dry run dies before the first
            mutant. What stands in: the whole-invocation assertion, a pole on each branch of the
            try/catch, and a source-level pole verified **by hand** to be the only one that catches a
            re-inlined `64 * 1024 * 1024` → [`mutation/RESULTS.md`](../../mutation/RESULTS.md) § T9.
      - ⚠️ **And a pole that reads its own source must SUBTRACT, never count** — counting is red under
            in-place instrumentation on its own account. A second reason the file could not be
            measured, this one self-inflicted, and now gone.
      - 📎 `status-line.mjs` being `merge`-regime also means the **fingerprint table was regenerated**
            for v5.0.0 in the same commit, the branch's own precedent from T2.
- [x] **T10 — install-if-absent copies the ENGLISH bytes into a French brain**
      (`reconcile-brain.mjs:224`). `copyInto(sourceDir, brainDir, rel)` never goes through
      `resolveLocaleSource`. **The sharp end is documentary**: ADR 0040 grants this door a locale-blind
      exemption on the written premise that it *"copies the resolved source"* — which the code
      contradicts, while the same ADR promises a new localized artefact is covered the moment its twin
      exists. Latent this release; the next localized skill arrives in English, silently.
      _(2026-08-23 · `8977248` the fix + `3df9f15` the mutation poles.)_
      - 🔎 **THREE doors, not one.** The finding named `reconcile-brain`'s merge-skill install.
        `installStagedSkills` and `seedHealthNote` had the identical defect, found by running the FR
        case against them rather than by re-reading them. All three now resolve through rule 3's own
        function; `copyInto` gained a source rel distinct from its destination rel, which is where the
        resolution had nowhere to live before.
      - 🔒 **`findDeliveryCopies` + a repo-wide census** now pins every `copyFileSync` in the engine
        and the installer against a table of verdicts (`locale-resolved` / `not-an-engine-delivery`
        with its reason). A fourth door, or a door that stops calling the resolver, fails the suite.
      - 📐 **Scoped mutation 100 %** (58 killed, 0 survived, 0 timeout), and **all four requested files
        appeared in the per-file breakdown** — the manual version of the check T13 exists to automate.
        First pass was 94.83 %: two survivors were the census losing its own last line when a file ends
        without a newline, the third deleted the staged install's directory test, which no fixture had
        ever exercised.
      - 📎 **ADR 0040 corrected in the same movement**, so the code and the decision say one thing: the
        install/retire doors **decide** locale-blind and **deliver** locale-resolved, and its
        `Scope:` no longer claims "No behaviour change" for doors this changes.
- [x] **T11 — the new divergence hook reads state the startup pull is changing, with no barrier**
      (`session-engine-divergence.mjs:32`). `session-universe.mjs` is the **only** non-test caller of
      `waitForStartupSync`, and this hook reads the manifest, every merge file and `.engine-base/` —
      all tracked files that travel with the pull, while the self-heal child rewrites the manifest
      whole in the same window. A mid-write manifest parses as `null` and the hook goes silent. **Fix
      is one line.** _(See also § THE macOS FLAKE in the release plan: the barrier itself is separately
      suspect, and that is `main`'s, not this pass's.)_
      _(2026-08-23 · `dd9e1d5` the fix + `4e62652` the entry-point pole · scoped mutation **100 %**.)_
      - 🏠 **"One line" was right about the CALL and wrong about the DESIGN.** Writing it inline would
        have made two copies of a five-argument wiring that all has to agree — a wrong `repo` waits on
        another brain's marker, a forgotten `pullerWired` taxes every pre-barrier brain at every
        session start, and either one reads exactly like success. `awaitStartupSync` is now the one
        spelling, in `startup-sync-gate.mjs` beside the gate it wires.
      - 🔎 **AND TWO MORE HOOKS RACE THE PULL** — asked of the neighbours rather than of the finding:
        - **`session-self-heal.mjs`** reads `engine-manifest.json` (`deriveWanted`) to decide whether
          to spawn the converge child. A mid-write manifest throws, its outer try swallows, and the
          self-heal silently does nothing that session. **The sharp one**, and the reason it is not
          fixed here: it is the hook that spawns a background converge, a barrier changes WHEN that
          decision is taken, and the finding named neither it nor that risk. It is also **benign by
          construction** — it re-runs at every session start, so a skipped session costs one session.
        - **`session-wiki-health.mjs`** reads the vault, whose notes travel with the pull. Same class,
          lowest stakes: a nudge about notes the pull had just fixed.
        - **Not affected**: `session-health.mjs` (reads gitignored `.cache/`), `session-obsidian-hint.mjs`
          (vault path + Obsidian's own config, outside the brain), `session-actions-log.mjs` (no
          tracked read). Listed so the next session does not re-derive the census.
        - 📌 **Recommendation: post-tag**, in one piece with `session-universe.mjs`'s adoption of the
          helper and with the macOS flake instrument — all three touch the same barrier, and two of
          them touch files that must stay byte-identical to `main` until the tag is cut.
- [x] **T12 — a tombstone with `..` blinds the never-touch oracle** (`engine-apply-plan.mjs:139`).
      _(2026-08-23 · `21b7397` the fix + `97796a1` the pole · scoped mutation **95.92 %**; the two
      remaining survivors are equivalent — every caller of `declared` follows it with a shape filter —
      and that is recorded in the code rather than papered over with a test that could not reach past
      it.)_
      - 🔒 `climbsOut` refuses any entry with a `.` or `..` SEGMENT, at the allowlist's construction,
        on every bucket. Segments and not characters, so `.claude/skills/my..skill/**` stays a skill.
        Split on both separators, because `path.win32.join` treats `\` as one.
      - 💡 **The lone `.` is not about escaping**, and the mutation run is what made that clear: it
        climbs nowhere, but it is a SECOND SPELLING of a path this module compares as a string, so a
        `.`-spelled tombstone would be honoured by the retirement and ignored by the install-if-absent
        a few lines later — the skill deleted and put straight back in one pass.
      - 📎 The comment claiming a single defence is **corrected in place**: that sentence is what the
        finding was really about, and the hostile-manifest test's intent is now true.
      `retireSkills` is exempted from the sacred-tree scrub and its stated *"ONLY defence"*,
      `/^\.claude\/skills\/[^/]+\//`, accepts `..`. `planTouches(plan, 'vault/notes/a.md')` returns
      **false** for a plan that just named the vault. **The `rmSync` is not reachable** (provenance
      keys cannot match), but the update reads the whole escaped tree into memory and prints a bogus
      owner-facing retirement line. The comment's claim, restated in the plan and in the hostile-
      manifest test's intent, is false.
- [x] ✅ **T13 — a mutation run that measured NOTHING printed a green tick and exited 0 — PAID**
      _(2026-08-23 · `658c348` the gates + `da1fe2e` the poles + `3eec3cc` a dead branch removed +
      `74fb898`/`d48d2c5` the colour strip)_. **Confirmed independently before fixing, and not by
      reading the source**: both halves were reproduced **through `runMutateOne` itself**, printing
      `✅ Mutation score NaN % — 0 killed, 0 survived, 0 timeout` and returning **0**. Every clause of
      the finding was exact, including `thresholds.break: null`, which is what lets Stryker exit 0
      with nothing measured. Scoped mutation **97.80 %**, the two survivors equivalent and **proved so
      over all 98 kept logs** rather than argued. → [`mutation/RESULTS.md`](../../mutation/RESULTS.md)
      § T13, which owns the numbers.
      - 🔍 **The finding named ONE of the two ways this function says nothing** — the fourth
        under-reporting on this branch, and the shape T10 taught. Beside the total that is `n/a`,
        a **single TARGET** that produces no mutants is not listed with a zero, it is **absent**, and
        the score belongs to whatever else was in the batch. That is the half already met in the wild
        (T4's first run), so the gate refuses on both and names the target.
      - 📊 **The queue's own question is ANSWERED, and the answer is that the T1–T12 numbers stand**:
        97 of the 98 kept logs carry a real score, the 98th has no table at all. **One** kept log is
        the second defect in the wild — nine hunks asked for, two files measured — and its row's scope
        is narrower than its heading. Recorded, not smoothed over.
      - 🌳 **The table had to be read as the TREE it is** for the target census to mean anything:
        Stryker prints a directory as its own row and its files indented beneath, so a trimmed cell
        makes `scripts/lib/engine-write-guard.mjs` and `scripts/engine-write-guard.mjs` — both of
        which exist here, as do three more such pairs — the same row.
      - 🧪 **Three runner FIXTURES were the defect too**: they asked for `scripts/lint-vault.mjs` while
        their table named four other files — a test whose premise made it a run that could never
        happen, which is the family of the FR false alarm, the hand-rolled lookup and T4's guarding
        test. **The gate went red on its own suite first**, which is how they were found.
- [x] ✅ **T14 — every brain is told the update server was unreachable, on a flawless network — PAID**
      _(2026-08-23 · `49fa874` the two verdicts + `9e431a4` the instrument · scoped mutation
      **100.00 %** on both, 71 mutants, 0 survivors)_. **Confirmed independently before fixing**, and
      reproduced through the **real formatter** on a git answering `ok` to both commands: the owner
      read *"could not reach the update server … the next update will try again"* over a fetch that
      had reached it twice. **Both halves false**, and the second one permanently — the retry repeats
      the run word for word.
      - **The shape of the fix**: two channels, kept apart all the way to the screen, because the
        sentence asserts a **cause**. `unreachable` = a tag that never came down (retryable, and the
        only shape the old sentence was ever true of); `unmatched` = git answered and nothing
        published is this brain's original (a settled verdict, said in its own words, no retry
        advertised). A rel that mixes both inside one candidate walk is `unreachable` — the candidate
        the network hid may have been the right row, so the verdict fails towards the one the owner
        can act on.
      - 🔍 **The finding named TWO states and there are THREE** — the under-reporting shape, for the
        fifth time on this branch. A `git show` that refuses is neither of its two: the tag came down,
        so no network failed, and the path is simply not at it. It joins `unmatched`, which is the
        half that promises nothing.
      - 🚨 **AND MEASURING IT BROKE THE INSTRUMENT OPEN.** The scoped run announced
        **`✅ Mutation score null %` over a table reading 100.00 on every row**: T13's colour strip had
        been applied to `parseTestCounts` and not to `parseMutationReport`, one function below, and
        `null` is precisely the tell T13 had just installed for *"this run measured nothing"*. Dropping
        the `NO_COLOR=1` workaround T13 made unnecessary is what exposed it. **The census was one
        function short** — T10's lesson again, and this time about the tool that judges everyone
        else's tests. One home for the rule now (`withoutColour`), both parsers reading it, pinned in
        two SGR spellings and on the per-file breakdown the "measured nothing" gate reads.
        → [`mutation/RESULTS.md`](../../mutation/RESULTS.md) § T14 and the tail of § T13.
- [x] ✅ **T15 — an explicitly typed `--dry-run` is swallowed and the run goes LIVE — PAID**
      _(2026-08-23 · `0286481` · scoped mutation **100.00 %**, 49 killed, 0 survivors, 2 timeouts)_.
      **Confirmed independently, and reproduced through the real CLI as a process**: `--worktree
      --dry-run` printed the plan for a live Stryker run on a worktree named `--dry-run`. It now
      refuses with exit 2 before spawning anything, and the legitimate `--worktree kenjaku-mut-one
      --dry-run` is untouched.
      - 🧭 **Why two earlier passes hardened these exact two arguments and neither saw it** — the most
        useful thing in the item. F6 checked the worktree name's SHAPE and S2 the log name's, and
        `isPlainName` allows `-` because `kenjaku-mut-one` needs it. Both were asking *"what does this
        value look like?"*; the question here is **"was that ever a value?"** A guard cannot find a
        defect it is not asking about, however many times it is pointed at the same line.
      - **Written once for BOTH options**, not for the one the finding named: F6 fixed `--worktree`
        and S2 had to come back for `--log`, on this very seam. The error is also raised **before**
        the shape guards, which would have described `--dry-run` as a badly-shaped folder name when
        what actually happened is that a flag went missing.

### Cut by the reviewer's 15-item cap — recorded so they are not lost

- **Confirmed but latent**: `engine-write-guard.mjs:57` `rel.startsWith("..")` fail-open (no engine
  regime names such a path); `adopt-engine-file.mjs:132` `Object.prototype` keys passing the
  unknown-decision guard; dev-only modules shipping to brains with dangling imports (inert — the
  delivered suite is already red on `main`).
- **Quality**: duplicated `buildGitInvocation` / `countMarkdown` / `ENGINE_SCRIPT` / `BASE_TREE`
  spellings; two Node boots per Write/Edit; an uncached `globToRegExp`.
- [x] ✅ 🇫🇷 **CONVENTION — French `why:` strings in four new `scripts/lib/*.test.mjs` — PAID**
      _(2026-08-23)_. They surfaced in test names and assertion messages, against the
      English-artifacts rule this repo states about itself. **The four files were right and the count
      was not: 32, not 28** — the under-reporting shape a sixth time, and the reason the census was
      re-run rather than trusted.
      - **What was translated and what was NOT.** Each of the four files holds an EN list and its FR
        twin, so every French `why:` had an English sibling three lines up: the fix is that sibling's
        wording. **The `pattern` regexes stay French** — they are the assertion's subject — and so do
        the quoted doctrine fragments inside the new English prose (« gros document », « d'abord »),
        under the quotes carve-out.
      - 🔍 **And the neighbours were run, not re-read**: a scan of all six new discipline files for
        French in comments, test names and assertion messages comes back **empty**. Suite 2 705.
      - 📌 **NOT done, deliberately, and it is not a decision anyone owes**: five OTHER
        `scripts/lib/*.test.mjs` carry the same French `why:` strings — `backlog-discipline`,
        `claim-discipline`, `identity-discipline`, `source-discipline`, `update-consent-discipline`.
        They are **byte-identical to `main`** and have shipped in published tags, so they are
        inherited rather than this release's, exactly like the macOS flake. **Post-tag chore**, named
        here so it is not rediscovered as news.
      - 📐 **Also not done**: folding each file's twin lists into one `{ why, en, fr }` table. It
        would delete the duplicated prose, and it is a design change to four test files while a
        review is reading the branch — and the two locales must stay independently editable.
- [x] ✅ 📏 **CONVENTION — the live plans' `## 📍 STATE` blocks exceed the ≤ 20-line cap — PAID**
      _(2026-08-23)_. **All five are now under it: 15 / 16 / 18 / 19 / 19.**
      - 📐 **THE MEASURE WAS CHECKED FIRST, and it was the finding's weakest part.** Reported
        26/69/122/230/**1431**; measured honestly — the next heading at any depth, blockquoted or
        not — **16 / 22 / 60 / 278 / 82**. The 1431 is an artifact of counting to the next `^## `
        through sections that live in `>` blockquotes. **One of the five was already compliant**, and
        **the worst offender was not the one the finding named**: the triage plan itself, at 278.
      - 🏛️ **What 278 lines actually were**: a bullet per closed finding, the whole second pass's
        queue, stale suite counts, and — three lines apart — *"the report is delivered"* and *"he has
        not had the report"*. **That contradiction is the cost the cap exists to prevent.**
      - 📤 **Nothing that lived only in a block was deleted; it was MOVED.** The ~24 candidate dead
        links across the delivered surface (with its product question) now has § *FOUND ON THE WAY
        AND NOT TAKEN*; the twice-widened scope and the prohibitions it never lifted sit beside the
        GO that granted them; the fan-out's three figures moved to the section that owns them; the
        lesson about a restated decision joined the release plan's § *FOUR LESSONS*.
      - 🔗 **And it fed the open question it is evidence for**: the cap was **applied everywhere and
        held nowhere** for three weeks, unnoticed by anything but a review — which is exactly what
        the *cheap half* of the plan lint would count. Recorded in
        [`plan-state-single-source-study.md`](../../studies/plan-state-single-source-study.md) § *QUEUED FOR AFTER
        THE v5.0.0 TAG*, whose owner's call it is. **Not built: he asked for it after the tag.**
