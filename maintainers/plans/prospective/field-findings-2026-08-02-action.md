# Action plan — field findings from a real brain, 2026-08-02 (candidate scope for the next release)

> **Why this plan exists.** One evening of real use on the owner's own brain (`mind-palace`,
> 436 notes, 3 universes, `in-process` embedder), across a full `v4.3.0 → v4.4.0` engine update,
> surfaced **16 distinct findings** — from cosmetics to *a documented feature that does not work*.
> They were collected live from terminal screenshots and each one was **verified against this
> repo's code** before being written down. This file is that evidence, organised into candidate
> work.
>
> ✅ **Scope IS decided** _(2026-08-02, with the owner, see `## Decisions taken`)_: **everything below
> ships**, P0 through P3, including the freeze trap. The reframe below is accepted as **the**
> organising axis. Only the upstream-path piece (F5 defect 3) leaves this plan, into its own ADR +
> plan.
>
> **Next real step** (the Tracking boxes are not the right marker yet, the work is ordered by the
> release table in `## Decisions taken`): **v4.5.0 / F14, the rehydrate — in progress on `main`**,
> TDD, suite green (1071 pass).
>
> **The command WORKS and is committed** _(2026-08-02, `d0147bc` → `7abd2b3`)_: `node
> scripts/rehydrate.mjs`, run from a freshly cloned brain, rebuilds the two gitignored files from
> the templates that travelled in the clone, reseeds the health canary, installs **both** dependency
> trees, and ends by asking for a NEW conversation rooted in the folder (the wiring only loads at
> session start). Offline, idempotent, exits non-zero naming the command to run by hand. Underneath:
> `scripts/lib/brain-rehydrate.mjs` (`machineReplacements()`, `rehydrationPlan({ exists })`) and a
> shared `applyLaunchers()` so the installer and the rehydrate cannot wire a brain differently.
> Settled while writing it: the canary path now has ONE owner (`staged-health-note.mjs`) plus a test
> deriving it from the engine's own TS sources, so a rename in `health-check.ts` / `config.ts` fails
> here instead of seeding the note where nothing reads it; and the launchers / `run-node.*` stay out
> of the plan list on purpose (path-free, they travel through git untouched).
>
> **✅ Steps 1 and 2 done** _(2026-08-02 · `ce4c7bf`)_ — the command is now **carried** and
> **announced**. `scripts/rehydrate.mjs` is in `replace`, both constitutions (EN + FR) teach Claude to
> spot the second-machine shape and offer it, and a new manifest guard covers **the third door onto an
> engine script** (constitution, next to hook and skill). That guard went red on **two**, not one:
> `scripts/clear-example-notes.mjs` had been named by the engine constitution since forever while
> carried by nothing — so the **v3.4.1 Windows fix to it reached nobody** who installed before that
> release. Also in `replace` now. Suites green (1071 scripts, 454 rag).
>
> **✅ Steps 3 and 4 done too** _(2026-08-02 · `262b571`, `9175d53`)_ — `SETUP.md` §7 rewritten
> (why a clone is not a working brain, the command, the two things it cannot do, the expected
> first-session "empty index"), the two §8 remedies that prescribed re-running `installer.mjs`
> repointed, both locked by doc guards. And the engine stopped failing into the void: the
> SessionStart self-heal used to read an absent `.mcp.json` as a convergence gap and promise "an
> engine update finishing in the background" **at every session start, forever**, spawning a
> reconcile that cannot create a file; it now names the rehydrate instead.
>
> **Decided in conversation, 2026-08-02 evening: FINISH v4.5.0 FIRST.** F7 fired again the same
> evening on the owner's second laptop (see F7's own entry), which was reason to consider promoting
> it ahead of v4.5.0. The owner's call: **no reordering** — v4.5.0 ships whole, F7 stays the head of
> v4.6.0 right behind it. Do not re-open this at the next session.
>
> **✅ Step 5 done — F14 IS COMPLETE** _(2026-08-02 · `e236b35`)_. The wrapper no longer frames an
> unwired machine as "RESTART REQUIRED … an update finishing in the background": it takes
> `needsRehydrate` and emits a `SETUP NEEDED` directive naming the command. Suite green
> (1077 pass, 1 skipped Windows-only).
>
> **✅ Step 6 done — F11/F12 IS COMPLETE** _(2026-08-02 · `68ea034`, `524c580`, `a52b813`)_. Both
> halves shipped: the banner tells a failure from a wait, and the write-time guard is WIRED — a
> `PreToolUse(Write|Edit)` hook running `scripts/vault-write-guard.mjs`, carried by the manifest, and
> reconciled onto brains that have no `PreToolUse` key at all. Suite green (1100 pass, 1 skipped
> Windows-only). Its P0 entry carries what was decided and what the wiring turned up (a manifest guard
> that only watched `SessionStart`); do not re-open it.
>
> **✅ Step 7 done — F15 IS COMPLETE** _(2026-08-03 · `b5494d2` → `c5fae64`)_. The crosscheck ships on
> both surfaces: `node scripts/verify-index.mjs` names every note the vault and the index disagree
> about, and a fourth `notes` health check makes the permanent damage audible at session start without
> ever crying wolf on ordinary editing. Its P0 entry carries the two decisions taken while building
> (what the probe is allowed to be loud about, and why an unmeasurable crosscheck emits no check at
> all); do not re-open them. Suites green (1104 scripts + 1 skipped Windows-only, 480 rag).
>
> **✅ Step 8 done — F16 IS COMPLETE** _(2026-08-03)_ — `CONVENTIONS.md` §5quater: a checker must read
> through the engine's own eyes, and is judged on what it says about a HEALTHY brain.
>
> **✅ DECIDED (2026-08-03, by the owner): F18 ships WHOLE in v4.5.0.** A postmortem written by the
> owner's own brain after **two consecutive failing sessions** was handed to this repo and is recorded
> as **F18** in P1 (*the brain reports silence it never verified*) — the same reframe as this plan's,
> on the output surface. The staged proposal (text-only half now, structural half in v4.6.0) was put
> to the owner and **declined in favour of shipping all of it now**: §4.1 through §4.6, confidence
> markers included. **Do not re-open this**, and do not re-derive F18's evidence or its reach check —
> both are in its own entry. Cost accepted: v4.5.0 goes from five findings to six, one of them
> structural, so it lands later than it would have.
>
> **✅ Step 8bis done — F18 IS COMPLETE** _(2026-08-03 · `2b19eee`)_. The claim discipline ships on
> the four surfaces that assert things about colleagues (`sync-sources` and `prepare-1-1`, EN **and**
> FR, plus both constitutions), locked by 42 guard assertions in
> `scripts/lib/claim-discipline.test.mjs`. Its P1 entry carries what the red run taught and the two
> near-misses; do not re-derive them. Suites green (1146 scripts + 1 skipped Windows-only, 480 rag).
>
> **✅ Step 9 done — F17 IS COMPLETE** _(2026-08-03 · `618ba54` → `6ee4aee`)_. Its four decisions were
> **challenged against the code** _(2026-08-03)_ and the outcome is recorded in its P0 entry: two hold
> as-is, decision 2 is refined (the `obsidian://` URI is handed *to* the OS opener, so it stays inside
> the existing allowlist), and two new calls are taken there — **no entry script** (the reconciler
> never wires `permissions.allow`, so `node scripts/open-note.mjs` would prompt at every open on a
> deployed brain) and **ADR 0038 owns a scoped reversal of 0027** (the command changes, the rendered
> `file://` link does not). Then `scripts/lib/open-note.mjs` was built TDD and **committed green**
> _(`618ba54`)_.
>
> The mechanism was settled **on measurements, not preference**: `obsidian://open?path=` handed to the
> OS opener, because the dialog-free alternative (`open -a "Obsidian" <file>`) was run three times and
> **never opens the requested note**, cold or warm. Obsidian's trust dialog is therefore a **cost of
> the feature**, documented like the one-time "Always allow". Two things came out bigger than F17's
> original framing, both in its entry: the shipped `open-note` skill was not merely macOS-only, it was
> **wrong on macOS too**; and the planned **ADR 0038 was not written** — `CONVENTIONS.md` §6bis sends
> an evolving decision back into its own ADR, and this is ADR 0027's topic, so 0027 was amended in
> place and every reference repointed.
>
> **✅ Step 10 done — F1 IS COMPLETE** _(2026-08-03 · `9c67ea9` → `4b7b467`)_. The session start states
> which sphere is active and where its page is; the body stays in the vault. Field-verified on a
> throwaway two-universe brain: the block carries the identity line + the note path + the `/switch`
> door, the `🔒` passage never appears, and a single-universe brain prints **nothing at all** without
> reopening the capture offer. `/switch` gained the door it is now pointing at, ADR 0035 is amended in
> place (§2, §4, §6bis), and both constitutions teach the page since the gate closed the last channel
> that mentioned it. Suites green: 1177 scripts (1 skipped Windows-only), 480 rag.
>
> **✅ Step 10bis DONE — CI IS GREEN, 7/7** _(2026-08-03 · `7ea6b11`, `fc8949b`)_. Both causes fixed,
> separately, and **proven by CI rather than by reasoning**: the Windows tripwire passes in 34 s and the
> full matrix is green on all six cells plus the installer e2e (run `30819750747`). What each half turned
> out to be:
> - **The ten Windows-only failures were 100 % fixture, 0 % production.** Both `rehydrate.mjs` and
>   `verify-index.mjs` compute every path with `join` and are correct on Windows; the fakes were keyed on
>   hand-written POSIX literals, so on `D:\brains\…` they were never hit. Now keyed the way production
>   keys (`BRAIN = join(…)` + an `at()` helper, equality instead of a suffix guess). The one literal kept
>   is `BRAIN_POSIX`, because inside a **generated** file `{{PROJECT_ROOT}}` is POSIX-normalised on every
>   OS — there the literal IS the contract. **Production needed no POSIX normalisation**: checked, not
>   assumed.
> - **The four write-guard failures now RUN, they were not merely silenced.** They skip (with a stated
>   reason) when the engine's parser is unresolvable, and a **new CI step re-runs that file after
>   `npm ci`** — measured on Windows: `tests 9 / pass 9 / skipped 0`. Six cells execute them for real,
>   against zero before. The parser was never faked (F16). And because a skip nothing cashes in is just a
>   silence that reads green, **the step is pinned from the suite itself**: a last test asserts `ci.yml`
>   re-runs the file *after* `npm ci`, so deleting the step goes red instead of going quiet. Both branches
>   were exercised — 9 pass here, 4 skipped / 0 failed on a throwaway copy with no engine deps.
>
> <details><summary>The blocker as it was found, kept for the record</summary>
>
> **🛑 BLOCKER, FOUND 2026-08-03: WINDOWS IS RED — 14 failures, and they have been red for weeks.**
> The whole release had accumulated **67 commits without a single push**, so `ci.yml`'s tripwire — which
> fires on a push to any branch, and exists *precisely* to stop this (`CONVENTIONS.md` §9, written after
> v4.4.0 reached 52 commits before Windows spoke) — had never run. Branch `release/v4.5.0` is now pushed
> and **draft PR #54** is open; the tripwire went red in 34 s (1162 pass / **14 fail** / 2 skipped) and
> the full matrix is red on **all six cells**. **Fix this before the release step.** Two distinct
> causes, do not treat them as one:
> - **9 in `scripts/rehydrate.test.mjs` + 1 in the verify-index door — a real Windows defect** (these
>   ten are green on macOS), **and the exact suspect §9 names**: the fakes are keyed on **hard-coded POSIX literals**
>   (`/brains/mind-palace/.claude/settings.json`) while production computes its key with
>   `resolve`/`join`, so on Windows (`D:\brains\…`) the fake is never hit and the plan writes nothing —
>   `0 !== 1`, `[]` instead of the settings write. Same family as the v4.4.0 failure. Fix the FAKES to
>   key the way production does; check whether production itself also needs a POSIX normalisation at
>   the single source, rather than assuming it is only the test.
> - **4 in `scripts/lib/vault-write-guard.test.mjs` — NOT a Windows bug, and worse than a job-scope
>   mismatch: they have never passed in CI at all, on any OS.** Confirmed by the full matrix, which
>   fails the same four on **macOS** too (6/6 cells red, `Node 22 · macos-latest`: 1173 pass / 4 fail).
>   The cause: the guard resolves the engine's own parser (gray-matter + js-yaml) from
>   `rag/node_modules` → `parse is not a function`, and the **`Harness tests` step runs BEFORE
>   `npm ci`** — its comment even states the invariant those four broke ("pure .mjs seams, no deps to
>   install"). They pass on a developer machine only because `rag/node_modules` happens to exist there.
>   So F11/F12's guard shipped with a suite that was green **only locally**, since `524c580`.
>   Two honest fixes: move those four to the engine job (after `npm ci`), or have them **skip** when the
>   parser cannot be resolved, keeping the assertion where deps exist. **Never fake the parser** —
>   reading through the engine's own eyes is the entire point of that guard (F16).
> - **What IS confirmed green**: `Installer e2e · windows-latest` passes (1 m 5 s). The engine, type-check
>   and local-mirror steps never ran — the job dies on the harness step before reaching them, so
>   **nothing is known about them yet**. They will only speak once the four above are fixed.
>
> </details>
>
> **⏭️ THE RESUME POINT — v4.7.0, visibility. Steps 1-12 (all of v4.5.0 AND v4.6.0) are HISTORY.**
> v4.5.0 shipped 2026-08-03 (tag `v4.5.0`, PR #54, merge `96f5999`, CI 7/7) and **v4.6.0 shipped
> 2026-08-04** (tag `v4.6.0`, PR #55, merge `c0b2b16`, CI 7/7 on `7ab8f82`, release published) — see
> `## Step 11` and `## Step 12` for what they mean and where their artefacts live. **The live work is
> now `## Step 13 — v4.7.0`**, whose findings stay in the **P1/P3** entries. _(Side work done 2026-08-03
> and finished, unrelated: `maintainers/plan-discipline.md` + `maintainers/skills/plan-discipline/` — the
> plan/`/clear` convention extracted standalone to be shared outside this repo. Nothing pending there.)_
>
> **✅ v4.7.0's SCOPE IS DECIDED (2026-08-05, by the owner) AND IT IS DELIBERATELY SHORT.** It ships
> **only what that morning's field session raised** — **F20**, **F21**, **F22** — plus **PR #56**, the
> dependency pins we wrote ourselves after closing two drive-by PRs from a fork. **Everything else moves
> to v4.8.0**: F13, F3, F10, F8, F9, F2, F19 (the always-loaded instruction layer that only ever grows —
> raised and measured 2026-08-04, its numbers are in its entry, do not re-measure them) and the two
> banner defects routed from P0. Their entries stay exactly as they are; nothing is re-analysed when they
> come back. **F22's naming call is closed too: option A**, two thin aliases `universe` + `univers`.
> Read `## Step 13` for the ordered boxes; do not widen the cut.

## Step 11 — the v4.5.0 release — ✅ SHIPPED (2026-08-03, tag `v4.5.0`, PR #54, CI 7/7)

> **▶️ WHERE TO RESUME — v4.5.0 IS OUT; THIS PLAN NOW OWNS v4.6.0 AND v4.7.0.**
> Shipped 2026-08-03: merge commit `96f5999`, tag **v4.5.0**, published release, full matrix 7/7. The
> user-facing note and the PR body live in **`archived/release-v4.5.0-note.md`** and
> **`archived/release-v4.5.0-pr-body.md`**; the mutation numbers are pinned in
> `maintainers/mutation/RESULTS.md` (§ v4.5.0). **This file is NOT archived** — Steps 1-11 are history,
> and the remaining work is the rest of the trilogy: **v4.6.0, the vault's identity** (resolve before
> writing, homonymy) and **v4.7.0, visibility** (banner, offers, target version, commit messages).
> **Resume at the first unchecked box of the v4.6.0 section.**
>
> **Carried forward, deliberately, from the v4.5.0 pass** — neither is a defect of the release, both are
> named debt with an owner:
> - **One shared `runAsEntrypoint(meta, argv, fn)`**, tested once. 10+ scripts carry the identical
>   three-mutant boot guard, and it is the only thing left standing in `verify-index.mjs` (92.31 %) and
>   `rehydrate.mjs` (95.40 %). **v4.6.0 candidate.**
> - **The `session-*` tier** (`session-status.mjs` **0 %**, `session-universe.mjs` 39.39 %,
>   `session-self-heal.mjs` 36.62 %): top-level scripts no test can import. Inherited, not new — already
>   recorded at v4.4.0. Closing it is a refactor of fleet-deployed scripts, i.e. its own release.
> - **The health banner renders an `unknown` check under "found a problem"** — a defect pinned by a test
>   that names it, so nobody reads it as intended. **Was a v4.7.0 item; moved to v4.8.0 by the
>   2026-08-05 scope call** (see `## Step 13`), along with the rest of the visibility list.
>
> ⚠️ **No finding codes in any artifact.** The owner asked explicitly (2026-08-03): "F1, F2, Fx" mean
> nothing to anyone but us. They are filing labels for this plan only — the note, the PR body, the
> release and RESULTS.md name the behaviour instead.

**Title, chosen by the owner (2026-08-03): `v4.5.0 — The One Where Silence Stops Passing for Good News`.**
It carries both halves of this plan's reframe — the failures that looked like waits (F11/F12, F14, F15)
and the "I found nothing" that came out as "nothing exists" (F18). Do not re-open the title.

- [x] **Mutation testing on what this release changed** — asked for by the owner mid-release. 23 production
      files changed (8 `rag/src`, 15 `scripts`). Two real gaps found, both in NEW code, both fixed:
  - [x] **`rag`, the 6 files under `src/lib/`: 93.81 % → 94.67 %** _(2026-08-03)_.
    - [x] **`index-crosscheck-scan.ts` 70.59 % → 100 %** _(`cd66ac3`'s parent)_ — the worst of the six,
          and a file this release CREATED. All five survivors sat in `defaultScanPorts`: every existing
          test injects its own ports, so the default wiring was observed by nothing. One survivor,
          `parse: () => {}`, IS F15's failure mode (the crosscheck stops reporting damaged notes,
          permanently, suite green). The file's comment swore these defaults are the engine's own eyes
          (F16) — it was a comment, not a claim. Three tests now aim at the survivors: `parse` throws on
          the real field payload and stays quiet on a healthy note, `readFile` returns the exact UTF-8
          string (asserted whole — a loose `/Réunion/` passes on the wrong encoding), `scan` hands back
          the engine scanner's shape. 17/17 killed.
    - [x] **`health-check.ts`: the three singular-branch mutants are dead; the file reads 90.00 % at the
          tip** _(`cd66ac3`; measured in `…/v450-rag-changed.log`, the confirmation run — an earlier line
          here said 92.67 %, which no log supports, so **90.00 % is what RESULTS.md quotes**. Its 15
          remaining survivors are `catch {}` / default-init shapes that predate this release.)_ —
          `outOfStep.length === 1` was never
          exercised, so both ternaries could be dropped green: the owner would read *"1 notes … — e.g.
          `<the only note there is>`"*. One boundary test kills all three mutants.
    - [x] **Two survivors left in F15's code are recorded EQUIVALENTS, not gaps** — do not chase them:
          `if (seams.crosscheck)` → `if (true)` throws a TypeError the enclosing catch swallows into the
          same `null`; `catch { x = null }` → `catch {}` lands on the declaration's own value. Both
          behaviours ARE tested (`health-check.test.ts:451` and `:481`).
    - [x] Others, untouched and fine: `citation-renderer.ts` **100 %**, `index-crosscheck.ts` 98.77 %,
          `frontmatter-parser.ts` 97.87 %, `vector-store.ts` 92.50 %.
    - [ ] Out of the tool's scope, stated rather than implied: `rag/src/crosscheck-cli.ts` and
          `health-check-cli.ts` are **not** under `src/lib/`, so `mutate-changed.mjs` never matched them.
          Same class as the top-level `scripts/*.mjs` boot seams (named debt in RESULTS.md).
  - [ ] **`scripts`, the 15 changed files** — in a disposable worktree (`inPlace` is destructive), batched.
    - [x] **The exact recipe, so a `/clear` costs nothing.** Worktree at
          `/Users/tpierrain/Dev/kenjaku-mut-v450` (NOT the scratchpad — RESULTS.md lost two reports to a
          temp cleanup). Between batches: `git checkout --detach <HEAD of release/v4.5.0>` +
          `git clean -qfd -e rag/node_modules` — **never `git checkout -- .`** (a mutant of
          `auto-commit.mjs` can COMMIT the instrumented tree). Then, from the worktree:
          ```
          node /Users/tpierrain/Dev/kenjaku/maintainers/mutation/node_modules/@stryker-mutator/core/bin/stryker.js \
            run maintainers/mutation/stryker.scripts.batch.config.mjs --mutate "<comma-separated paths>"
          ```
    - [x] ⚠️ **`rag/node_modules` must be symlinked into the worktree first**
          (`ln -sfn /Users/tpierrain/Dev/kenjaku/rag/node_modules <wt>/rag/node_modules`), or
          `vault-write-guard.test.mjs`'s four parser assertions SKIP there and its mutants face a suite
          that cannot judge them — measuring exactly the fiction F16 is about. Verified before starting:
          9 pass / 0 skipped in the worktree. **This is new since the write-guard fix; the recipe in
          RESULTS.md predates it.**
    - [x] **Batch 1 done** _(2026-08-03, 3 min 10 s, 147 mutants, `All files` 80.27 %)_:
          `brain-rehydrate.mjs` **100 %**, `open-note.mjs` **100 %**, `staged-health-note.mjs` **100 %**,
          `rag-status.mjs` 86.79 % (7 survivors), **`verify-index.mjs` 40.54 % (22 survivors)**.
      - [x] **`verify-index.mjs` 40.54 % → 92.31 %, re-measured** _(2026-08-03 · `b6c55d3`)_. The 22
            survivors were all boot/IO wiring — `defaultRunCrosscheck` (the real spawn),
            `realVerifyIndexDeps`, the `isEntrypoint` guard — and **19 of them died to the fix that had
            just worked on `index-crosscheck-scan.ts`**, so filing them as debt would have been a habit
            rather than a measurement. What the spawn asks the OS for is a pure value and is now one:
            `buildCrosscheckInvocation` returns `{command, args, options}`, asserted **whole** on both
            platforms (win32 fed on purpose — CI runs macOS, so nothing else tells the `.cmd` branch from
            the identity) plus the called-with-nothing twin; `defaultRunCrosscheck` keeps the real
            `spawnSync` as its default and takes it as a seam only so the forwarding is assertable (the
            fake returns a shape no spawn produces); `realVerifyIndexDeps` is pinned by identity like
            `realRehydrateDeps`.
      - [ ] **The 3 that remain are the `isEntrypoint` block, and it is a PACKAGE-WIDE shape, not this
            file's debt** — `if (false)`, the empty block, and `process.argv.slice(2)` → `process.argv`
            (that last one has a real behaviour behind it: the engine CLI would receive node's own argv).
            **10+ scripts carry the identical three-mutant guard**, so the honest fix is one shared
            `runAsEntrypoint(meta, argv, fn)` tested once — a v4.6.0 candidate, deliberately NOT done
            mid-release. Record it in RESULTS.md as such, not as a verify-index gap.
      - [x] **`rag-status.mjs`'s 7 survivors: all fixed** _(2026-08-03 · `051a002`)_, and none was
            exotic. **Five were loose assertions** (§2): the separator could become `""`, the remedy
            sentence — the only part telling the owner this will NOT fix itself — could vanish, and the
            empty string where the wait used to be could become arbitrary junk, all with every
            `assert.match` still green. The three lines carrying the F11/F12 fix are now asserted whole.
            **The two others were the classic pair**: the boundary where the truncation flips (exactly
            two failures — nothing distinguished `rest > 0` from `rest >= 0`, i.e. the owner reading
            `(+0 other(s))`), and the absence (no test reached the failure lookup with `lastRun` missing,
            which is exactly a freshly rehydrated machine, F14 — its shortfall must read as the plain
            wait it is). Every mutant applied by hand before and after.
      - [x] **Re-measured: `rag-status.mjs` 86.79 % → 100.00 %** _(2026-08-03, 1 min 16 s, 53 mutants,
            0 survivors, log `maintainers/mutation/reports/v450-rag-status-recheck.log`)_. The first
            attempt was killed by the 10-min cap; the worktree was reset per the config's own warning
            before re-running, so the score is off a clean checkout.
    - [x] **Batch 1 is CLOSED**: `brain-rehydrate.mjs` 100 %, `open-note.mjs` 100 %,
          `staged-health-note.mjs` 100 %, **`rag-status.mjs` 100 %**, **`verify-index.mjs` 92.31 %**
          (only the package-wide entrypoint guard left).
    - [ ] **Batch 2 RUNNING** _(2026-08-03, launched off a clean worktree at `eab823d`)_ —
          `scripts/lib/health-probe.mjs, scripts/lib/rag-launcher.mjs, scripts/lib/universe-profile.mjs,
          scripts/lib/universe-reminder.mjs, scripts/lib/vault-write-guard.mjs`. Log:
          `maintainers/mutation/reports/v450-scripts-batch2.log`. **If a `/clear` lands here**: read that
          log, copy the per-file scores and the survivor list below, then treat each survivor the way
          batch 1 was treated (fix what a test can honestly reach; record only genuine equivalents).
    - [x] **⚠️ Batch 2 had to be SPLIT, and this is the reproducible lesson**: the five files together are
          **546 mutants ≈ 13 min**, over the 10-min background cap — and a killed run leaves Stryker's
          instrumentation in the worktree (reset before re-running, per the config's own warning).
          **One or two files per run**, ~125 mutants ≈ 6 min. Sub-batches: **2a** health-probe +
          universe-reminder, **2b** vault-write-guard, **2c** universe-profile, **2d** rag-launcher.
    - [x] **Batch 2a done** _(2026-08-03 · `c74662b`, log `…/v450-scripts-batch2a.log`)_ —
          `health-probe.mjs` **71.83 %** (20 survivors), `universe-reminder.mjs` **94.44 %** (3). Same two
          families as batch 1, so the same repair: banners checked by **fragments** (the reassurance line,
          the newline between bullets, and the whole core-⚠️ / optional-ℹ️ severity split could all be
          dropped with every `assert.match` still green), plus **branches nothing ever fed** — the canary
          gesture, the embedder's network/key gesture (the one an API user actually gets, while the suite
          only ever tested local weights), the fallback gesture for an unknown check name, a module whose
          healthy siblings must not be listed as causes, the legacy no-detail shape. Two calls worth
          keeping: `gestureForCheck`'s `detail = ""` default was **deleted rather than excused** (no call
          site omits it, so it could not change an outcome), and one new test **pins the
          `unknown`-rendered-as-broken defect** while naming it as the v4.7.0 item it is, so nobody later
          reads it as desired behaviour.
    - [x] **Batch 2b done — `vault-write-guard.mjs` 85.16 %** (19 survivors), **hardened**
          _(2026-08-03 · `4eb6478`)_. Two of the 19 said something serious: the guard resolved
          gray-matter from a path built inline, and **moving that anchor one folder up left the suite
          green** — nothing proved it runs the ENGINE's parser rather than whatever Node finds walking
          the parent chain, which is F16's fiction inside the file written to avoid it.
          `engineRequireAnchor` now names it. `editedNote` is exported (its three "cannot compose"
          reasons all end in `{allow:true}`, so nothing could tell them apart), both ends of the
          frontmatter fence are fed, and the refusal message is asserted verbatim around the parser's
          own words.
    - [x] **Batch 2c done — `universe-profile.mjs` 87.89 %** (23 survivors), **hardened**
          _(2026-08-03 · `2007d39`)_. Half of them existed because **the fs fake swallowed what it was
          handed**: `mkdirSync` recorded nothing, so "create the parent, recursively" and "create
          nothing" were the same call. The fake records now. Plus the refusal marker's bytes (sorted
          from the data, trailing newline, and what gets REBUILT from a damaged one), and the digest
          parser's hand-edited cases.
    - [x] **2b and 2c RE-MEASURED, and the candidate equivalents are CONFIRMED** _(2026-08-03, 6 min 59 s,
          319 mutants, 7 survivors, log `…/v450-scripts-2bc-recheck.log`)_ —
          **`vault-write-guard.mjs` 85.16 % → 98.45 %** (2 survivors) and
          **`universe-profile.mjs` 87.89 % → 97.37 %** (5). Every one of the 7 is on the equivalence list
          written before the run, which is what makes them equivalents rather than an excuse: in the guard,
          `toolInput?.content` (a null `toolInput` cannot reach that line — `relPath` is already non-null)
          and `typeof oldString !== "string"` → `false` (the twin term refuses the same input); in the
          profile, `parsed?.declined` and `other: []` (both paths end in the same empty array, and `other`
          is never emitted) plus the three heading-regex mutants the downstream `.trim()` neutralises.
          **Do not chase them; record them as equivalents in RESULTS.md.**
    - [x] **Batch 2d treated — `rag-launcher.mjs` 89.32 %, 11 survivors, hardened** _(2026-08-03 ·
          `4e660b1`, log `…/v450-scripts-batch2d.log`)_. The survivors were the **win32 install-script
          writer** and `applyRagLauncher`/`applyLocalMirrorLauncher` — §10 of the TDD skill exactly (a
          platform-conditioned transformation that is a no-op on the CI platform, plus IO nothing fed).
          `realInstallIo` is exported and pinned; `writeScript`/`removeScript` are exercised against a real
          tmpdir (including remove-when-already-gone), and both `apply*` have their absence twin.
    - [ ] **⚠️ Re-measure `rag-launcher.mjs`** — hardened but **not re-mutated**, so its new score is
          unknown. ~110 mutants ≈ 5 min, well inside the cap. This is the next mutation command.
    - [x] **Every hardened file re-measured, and all four came back clean** _(2026-08-03)_ —
          `rag-launcher.mjs` **100 %** (log `…/v450-rag-launcher-recheck.log`), `health-probe.mjs`
          71.83 % → **100 %** and `verify-index.mjs` **92.31 %** confirmed (log
          `…/v450-healthprobe-verifyindex-recheck.log`), `universe-reminder.mjs` 94.44 % → **100 %**
          (batch 3a). `verify-index`'s 3 remaining survivors are the shared entrypoint guard, nothing else.
    - [x] **Batch 3a done and TREATED** _(2026-08-03 · `25beef3`, log `…/v450-scripts-batch3a.log`)_ —
          `universe-reminder.mjs` **100 %**, `rehydrate.mjs` **90.80 %** (8), `vault-write-guard.mjs`
          (the top-level hook) **50.00 %** (12 + 1 timeout). Both scores sat on the same shape, and it is
          the one this release keeps meeting: **every test injects its own deps, so the REAL ones were
          observed by nothing**. Fixed rather than filed, since the same fix had just worked three times:
          the spawn options asserted **whole** (`stdio: "inherit"` is what lets the owner watch a
          multi-minute install), the rebuilt `.mcp.json` asserted to end with a newline (a JSON file
          without one is still valid JSON, so the parsed assertion could not see it), the
          write-through-missing-parents test digging **two** levels (with one, a non-recursive `mkdir`
          succeeds too), `realGuardDeps` pinned field by field, and **the hook run once as the harness
          runs it** — a real child process with the JSON on stdin, the only test that reaches the stdin
          read and the entrypoint guard. Two of those need `rag/node_modules`, so they skip in CI's
          harness step; `ci.yml` re-runs the file after `npm ci`, and **that re-run is pinned from the
          suite itself**, like its sibling in `lib/`.
    - [x] **Re-measured off `25beef3` — `rehydrate.mjs` 90.80 % → 95.40 %** (the 4 left are the shared
          entrypoint guard) **and the guard hook 50.00 % → 91.67 % → 95.83 %** after one more fix _(2026-08-03
          · `fd13999`)_. That last run **found the fix's own defect**: the skip condition asked
          `realGuardDeps.parser(...)`, i.e. the very wiring the two tests judge — mutate `parser` to return
          null and the tests **turn themselves off**. It asks the disk now. Its single remaining survivor is a
          true equivalent (`readFileSync(0, "")` returns a Buffer, and `JSON.parse` coerces it to the same
          string). Logs: `…/v450-scripts-batch3a-recheck.log`, `…/v450-guard-hook-recheck.log`.
    - [x] **Batch 3b done** — `session-self-heal.mjs, session-status.mjs, session-universe.mjs`, log
          `…/v450-scripts-batch3b.log`: `session-self-heal.mjs` **36.62 %**, `session-status.mjs` **0.00 %**,
          `session-universe.mjs` **39.39 %**. **Red by construction**:
          these are the top-level scripts no test can import. **Named, pre-existing debt, NOT a regression
          of this release** — write it that way in RESULTS.md rather than let a batch total imply rot.
  - [x] Copy the per-file scores AND the survivor list here **the moment each batch ends** — RESULTS.md's
        own rule, earned by losing two reports to a scratchpad cleanup.
  - [x] **All batches in, RESULTS.md written and the snapshot pinned in the release note** _(2026-08-03)_.
        Correction made in passing: an earlier line here claimed `health-check.ts` at 92.67 %, which no log
        supports — RESULTS.md publishes the measured **90.00 %**.
- [x] **The version vector is bumped** _(2026-08-03 · `9fb5d1a`)_ — `rag` 1.2.0 → **1.3.0**, `scripts`
      1.9.0 → **1.10.0**, `constitutionTemplate` 1.0.0 → **1.1.0** (both constitutions changed),
      `local-mirror` left at 0.3.0 (nothing in it changed — checked, not assumed), `rag/package.json` and
      its lockfile in step. `indexSchemaVersion` stays **2**: no reindex, which is what the note will
      promise. Nothing gates on this vector (only `engineVersion.rag`, as a display fallback), so what it
      buys is a new install not running v4.5.0 under a number that describes v4.4.0.
- [ ] **§10, the marketing-surface re-read.** Started, and it already found the finding of the pass:
  - [x] **`README.md:100-102` was selling a promise F14 made false.** *"a lost, stolen or dead laptop
        costs you nothing — restore your whole brain on a new machine from the backup"* — which is
        exactly what did NOT work before this release (a clone has neither `.mcp.json` nor
        `.claude/settings.json`, and nothing regenerated them). So this is not §10's usual "true but
        unsold": it was **sold and untrue**, and v4.5.0 is what makes it honest. The README never
        mentions the rehydrate; `SETUP.md` §7 does.
  - [x] **The README sentence is repaired** _(2026-08-03)_ — it now says the clone is put back to work by
        one offline command, and points at `SETUP.md` §7. The promise is honest for the first time.
  - [x] **`EN-QUOI-C-EST-DIFFERENT.md` — three changes, all of them §10's own two questions.** §1's
        hardening table (the doc's spine: "the holes where the cobbled-together version breaks, plugged
        one by one") gained the hole this release plugged — a note whose header the indexer can't read,
        never indexed while the counter reads *pending*; §4.4 ("it cites its sources") now says an
        unverified silence is reported as a silence, not promoted into a fact (F18); §5's
        backup/multi-machine line names the offline rehydrate, which is what makes it true.
  - [x] **`README.md` — two bullets added where the release actually changed the claim**: under
        *A · Grounded in truth*, silence-as-silence (F18) and the vault ↔ index crosscheck (F15); under
        *C · Self-healing*, the write-time refusal (F11/F12). These are §10 question 2 — shipped, and
        nowhere on the page.
  - [x] **`CONNECTORS.md` — re-read whole, one precision.** Nothing became false. The universe/connector
        passage now says the session line names *where* that universe's page is (F1 shipped exactly that).
  - [x] **The boards — re-read through their alt texts + `docs/marketing-image-prompts.md`. Verdict: NO
        re-render, and one drift recorded rather than silently fixed.**
    - [x] `board-anatomy` lists hooks (*auto-commit, auto-push, reconcile*) and v4.5.0 adds a fourth (the
          `PreToolUse` write guard) — but the copy never claims to be exhaustive, so it is **still
          accurate**. No re-render.
    - [x] `board-reliability` says **"34 ADRs"** and there are **37**. Measured: **this drift predates
          v4.5.0** (there were already 37 at `v4.4.0`, and this release added none), so it is not
          something the release made false. **Left as-is on purpose** — a board is expensive to re-render
          for a number. **Recommendation for the owner, at the next re-render of that board: drop the
          count** ("a written trail of every architectural decision"), because a hard number rots by
          construction, once per release, forever. Its `mutation 90–97%` claim is fine and will be
          re-checked against RESULTS.md when the pass ends.
    - [x] Every other board: re-read, copy still accurate, no re-render.
- [x] Release note written (non-dev first, §11 shape) with the pinned mutation snapshot — published, and
      archived as `archived/release-v4.5.0-note.md`.
- [x] PR body stating F5's known limit on the constitution half (an engine-managed file only reaches
      brains that never customized it) — archived as `archived/release-v4.5.0-pr-body.md`.

## Step 12 — v4.6.0, the vault's identity — 🔜 THE LIVE WORK

> **What this release is about.** v4.5.0 stopped silence from passing for good news. This one stops the
> vault from **poisoning itself**: today the brain writes *about people* into the vault without ever
> reading what the vault already says about them. Its evidence lives in the **P1** entries (F7, F6, the
> homonymy block, the reliability/confidence block) — read them there, they are not restated here.
>
> **Same carrier as F18, and that is deliberate.** What fails is what the model is *told*, and the
> telling lives in the same six files F18 just proved reach a deployed brain: the two skills
> `sync-sources` (the producer) + `prepare-1-1` (its consumer), **EN and FR**, and both constitutions.
> Reach recorded at F18 and still true: the skills are in the `merge` regime and DO reach the fleet;
> `CLAUDE.engine.md` is in no regime, so the constitution half is worth writing but must never be the
> only carrier. The guard shape is `scripts/lib/claim-discipline.test.mjs` (section-sliced doc guard) —
> reuse it, do not invent a second one.
>
> **The vocabulary is already settled — reuse it, do not mint a second scale.** F18 shipped ✅ observed /
> 🟡 derived or probable / 🔴 negative-or-behavioural-unverified, with *"safe to paste into a message to
> another human"* as the threshold that matters. v4.6.0's confidence block marks a **people note born
> from a probable resolution**; it must speak that same three-marker language (decided at F18, §4.5).
>
> **⏭️ RESUME HERE: Step 12.1, F7 — part 1 is DONE and pushed, resume at its remaining bullets.**
> Branch `release/v4.6.0`, green and pushed (1248 tests, 1247 pass, 1 skipped Windows-only; CI green on
> the version commits). Nothing is half-written on disk, no decision is pending.
>
> **What is already done on F7** _(2026-08-03 · `9790c90`)_ — and the correction that shrinks the rest:
> - **A large part of F7 had ALREADY SHIPPED with v4.5.0's claim pass.** Measured, not assumed: the
>   sub-agent prompts and `prepare-1-1` already carry *"a bare first name stays a bare first name"*,
>   *"the vault outranks the delta on anything about a person — read `vault/people/<name>.md` before
>   asserting who someone is"*, and the Hossam case verbatim. **EN and FR are in parity** — the drift I
>   went looking for is not there. Do not re-derive this; do not re-write those rules.
> - **What was genuinely missing, and now ships**: the producer's own named **`## Identity discipline`**
>   section (EN + FR `sync-sources`), and the removal of the contradiction that MANUFACTURED the field
>   defect — "People registry" ordered *"`[[people/jane]]` is forbidden"* next to *"create the backlinks
>   even if the target page doesn't exist"*, so an agent handed a bare first name had one exit: invent
>   the surname. The same pair sat in the **operative** text (the bullets handed to the sub-agents, all
>   four files); they now state the action (*"no full name, no link"*) instead of only the ban.
> - Guard: `scripts/lib/identity-discipline.test.mjs`, 12 assertions, sharing `scripts/lib/doc-section.mjs`
>   with the claim guard so the two cannot judge different documents.
>
> **✅ The novelty check is IN** _(2026-08-03)_ — F7's last rule with no carrier now has two, and the
> second one is the finding of this pass. The prose rule went into `## Identity discipline` (EN + FR):
> nothing is *new* until the vault has been asked, with the Hossam case verbatim (a *"(confirmed
> 04/06)"* card downgraded to *"(unconfirmed)"*). But a rule stated only there is a rule **nothing
> executes** — so it also went into the **operative** step, as a third numbered reconcile pass in
> `Step 3 — Synthesis`. That step is the only one that can run it: the sub-agents read external
> sources and **never see the vault**, so "this is new" is asserted in the main context or nowhere.
> The guard pins the intro count too (`Two passes` must be gone), because a promise of two passes
> above a list of three is how the third one reads as optional. 16 assertions, suite green (1251 pass,
> 1 skipped Windows-only).
>
> **✅ The constitutions carry it now** _(2026-08-03)_ — a condensed `### Identity discipline` in
> `CLAUDE.engine.md` + `templates/fr/CLAUDE.engine.md`, sitting immediately above the claim discipline
> because a name is what the claim discipline's tier 3 is mostly about. Asserted against the **same
> patterns** as the skills (the claim guard's own rule: two paraphrases of one discipline are two
> disciplines), via a `CONSTITUTIONS` block modelled on it. Reach caveat unchanged and NOT a reason to
> have skipped it: the skills are in `merge` and reach the fleet, the constitution is in no regime and
> reaches new installs only, which is why the skill carriers were written first. 24 assertions, suite
> green (1259 pass, 1 skipped Windows-only). One deliberate FR deviation: the heading uses a colon,
> not an em dash, per the French typography rule.
>
> **✅ The consumer POINTS now, and that closed Step 12.1** _(2026-08-03)_ — `prepare-1-1` (EN + FR) got
> its own `## Identity discipline` section that links the producer's **section** (not merely the file:
> it has linked `../sync-sources/SKILL.md` for the fan-out since long before this, so a bare file link
> would have gone green on prose that predates the fix). The two bullets it used to carry in its own
> words are gone: *"the vault outranks the delta…"* and *"a bare first name stays a bare first name"*
> were **true today and free to drift tomorrow**, which is the whole reason the control sits in the
> producer. What stays is what only a 1-1 knows: every person in that file is one of the two people in
> the room, so a wrong surname is said to their face. 26 assertions, suite green (1261 pass, 1 skipped
> Windows-only).
>
> **✅ Step 12.2 done — F6 IS COMPLETE** _(2026-08-03 · `de2e658`)_. The rule ships on **three**
> carriers, and the third one is the finding of this pass. The discipline gained its fourth rule
> (*a link is not a person*) in `sync-sources` EN + FR and both constitutions. But the rule had to
> land where the gesture is actually **offered**: `/lint` ordered *"Dangling → fix the target
> spelling, or CREATE THE MISSING NOTE"* with no carve-out, which IS how `stephanie-music.md` came to
> exist — so the gesture now keeps its topic case and excludes a person target. **And `/lint` hands
> off to `/consolidate`**, which proposes *"a person `[[mentioned]]` in captures but with no page
> yet"* ranked by mention count: a fabricated `[[people/…]]` cited three times reads as **signal**,
> because the count measures how often a link was written, never whether the person exists. Both
> skills **point at** the producer's section instead of paraphrasing it (two paraphrases are two
> disciplines). Reach checked, not assumed: `engine-skills/**` is in `replace` and staged skills are
> provenance-refreshed, so an untouched `/lint` and `/consolidate` reach the deployed fleet.
> 6 assertions, each red first; suite green (1268 tests, 1267 pass, 1 skipped Windows-only).
>
> **✅ Step 12.3 done — THE HOMONYMY BLOCK IS COMPLETE** _(2026-08-03 · `c0187a5` → `9b6c64c`)_. Both
> halves shipped, and the finding of the pass is where the deterministic half could sit: **both doors
> that create a `people/` card write through ONE script**, so the check is a single choke point rather
> than a caveat repeated in two skills. `scripts/file-back-note.mjs` now refuses a new `person` whose
> first name the vault already holds unless the spec carries `distinguish`, and the refusal **names
> the homonym cards it found** (root **and** every universe subtree — the same reach the resolution
> rule reads). The answer lands in the card itself, above the body, as `> **Which one** — …`.
> The prose half is the discipline's fifth rule, *say which one*, on the four carriers F7 and F6 used;
> its second half is what makes the block worth writing: a bare first name matching several cards is
> **unresolved**, so rule 2 applies (plain text, no link) instead of resolving to the nearest one.
> Reach checked, not assumed: `scripts/file-back-note.mjs`, `scripts/lib/**` and `engine-skills/**`
> are all in `replace`, `sync-sources` in `merge` — the fleet gets every carrier but the constitution.
> Suite green (1285 tests, 1284 pass, 1 skipped Windows-only).
>
> Two things worth not re-learning:
> - **`type === "person"` was never the SOLE cause in any test** — a hand-applied mutant dropping it
>   survived, because every fixture that reached the guard was already a person. Killed by filing a
>   **topic** whose slug shares that first segment (`topics/romain-rolland.md` next to
>   `people/romain-durand.md`), which is also the honest statement of the rule's scope: nothing is
>   ever resolved to a topic. Same shape as the TDD skill's §9.
> - **A doc-guard pattern that spans a wrapped line goes red for typography, not for meaning.** The FR
>   constitution lost `/non résolu/i` to a line break between the two words. Keep a guarded phrase on
>   one line when writing the carrier.
>
> **✅ Step 12.4 done — THE CONFIDENCE BLOCK IS COMPLETE** _(2026-08-03 · `e61002f` → `180e4de`)_.
> Both halves shipped, in F18's vocabulary reused verbatim (✅ observed / 🟡 derived or probable / 🔴
> unverified — the guard pins the middle marker's exact words, because a second scale here would be a
> second discipline). The deterministic half: `renderFiledNote` renders a `> **Confidence** — …` block
> above the body **and** a `confidence:` frontmatter field (F18 §4.6 — a caveat left in prose is one
> the next session absorbs as confidence), a level outside the scale and a marker with no basis are
> both refused rather than rendered leniently, and `scripts/file-back-note.mjs` **refuses a new person
> card without it**. Required rather than offered, deliberately: left optional, its absence would mean
> *confirmed*, which is silence rendered as confidence. The prose half is the discipline's sixth rule,
> *say how sure you are*, on the same four carriers as rules 4 and 5. Reach unchanged and checked:
> `scripts/**` and `engine-skills/**` in `replace`, `sync-sources` in `merge`, the constitution in no
> regime.
>
> Two things worth not re-learning:
> - **The rule needed a GESTURE, or the marker rots into the decoration it replaces.** A card marked 🟡
>   had no supported way to ever say anything else, so "re-verify before resolving against it" had
>   nowhere to record its outcome — and readers learn to ignore a marker that never changes.
>   `scripts/refresh-note.mjs` now promotes a card, rewriting the **field and the visible block
>   together** (rewriting one alone leaves the page asserting two different things about itself), through
>   the **same renderer** as the builder. Freehand was never an option: hand-editing frontmatter is what
>   put two `updated:` keys on one page and made it unreadable (F12).
> - **A `ReferenceError` is not a fail-first.** The `/refresh-note` seam test first "went red" on
>   `fakeDeps is not defined` — I had written the helper shape of a *different* test file. Re-verified by
>   hand-removing the forwarding: it then failed on the assertion, which is the only red that proves
>   anything.
>
> **✅ STEP 12.5 IS CLOSED — the six review fixes shipped and so did the release** _(v4.6.0, 2026-08-04)_.
> Nothing below is pending; it is kept because it explains what the tag contains. Done autonomously 2026-08-04, each in TDD with the red verified
> first, each its own green pushed commit: ① `e34c3ae`, ② `53b0560`, ③ `6c5a072`, ④ `9377c17` (+ the
> class sweep `41cf186`), ⑤ `f7a00fc`, ⑥ `b3cabf9`. The chosen title is now in the note's H1, in the PR
> body and in the **PR title on GitHub** (`cc0a3ae`); the live PR body was re-synced, so the surface a
> reviewer reads no longer carries the disproved number.
>
> **Two things landed AFTER the six, both worth not re-deriving:**
> - **The guard shipped with ⑤ was CRLF-blind, and Windows caught it** _(`6d3d7c8`)_. It compared
>   against `"\n\n"`; git checks these files out with CRLF, so all three Windows cells went red on
>   typography while macOS stayed green. **Third time this repo meets that shape** — the tripwire on
>   the push is what found it, which is exactly §9's purpose. Line endings are normalised before the
>   comparison now, verified against a CRLF string directly rather than through the LF checkout.
> - **The seventh review candidate is SETTLED, and the verdict is that it WAS a defect** _(`2fac4ee`)_.
>   "The promotion moves the confidence field without adding the visible block": real, and it matters
>   because every card written before v4.6.0 has no block — promoting one produced a card that says how
>   sure it is to a `grep` and nothing at all to a human in Obsidian, while every card the builder
>   writes shows the marker. The block is now written in the builder's own slot (under the H1, **after**
>   the "Which one" block — WHICH one before HOW SURE), two reds first, and both write-door skills say
>   so. **Do not re-open it as "left open".**
>
> **The tail, as it was run** — the plan's own, plus one item the fixes themselves created. All done:
> - [x] **RE-MEASURE MUTATION ON WHAT THE FIXES CHANGED — DONE** _(2026-08-04)_. RESULTS.md § v4.6.0 was measured **before**
>       these seven commits, and four production files changed since: `scripts/lib/note-refresh.mjs`,
>       `scripts/refresh-note.mjs`, `scripts/lib/hooks-reconcile.mjs`, `scripts/lib/status-hook-output.mjs`.
>       Publishing the old numbers over new lines is exactly the "a score implying coverage it does not
>       have" failure this repo refuses. Worktree `/Users/tpierrain/Dev/kenjaku-mut-v460` (reset to the
>       head, `rag/node_modules` symlinked and **verified** — 22 pass / 0 skipped). Batch 1
>       (note-refresh + refresh-note) done, log `…/v460-review-fixes-batch1.log`: **`refresh-note.mjs`
>       96.30 %** — its 2 survivors are the equivalents already on record (`readFileSync(0, "")`, the
>       argv guard) — and **`note-refresh.mjs` 89.47 %**, whose 12 of 14 survivors sat in the block
>       insertion written the same day. **Treated** _(`6ff9915`)_: four tests for the shapes a
>       hand-edited vault holds (a `# ` inside a sentence / no heading at all, a stub card ending right
>       after its title, a line of editor whitespace, an indented quotation of a homonymy block). The
>       first went red and the repair was to **delete** the no-heading special case, not patch it.
>       - [x] **Batch 2 done** _(log `…/v460-review-fixes-batch2.log`)_ — **`status-hook-output.mjs`
>             100 %**, **`note-refresh.mjs` 89.47 → 94.53 %**. Three of its seven survivors were
>             reachable, all in the SECOND walk (past the homonymy block), which had been left without
>             the assertions the first walk got. **Treated** _(`3e0d362`)_, both mutants hand-applied to
>             prove each new test kills one.
>       - [x] **The four survivors left in `note-refresh.mjs` are EQUIVALENTS** — do not chase them: the
>             two regex `$` tails (redundant without the `s` flag; the `FRONTMATTER_RE` one was already
>             on record) and the two boundary mutants on the homonymy line's own `if`, where
>             `at === lines.length` makes `.test(undefined)` coerce to the string "undefined" and miss
>             either way.
>       - [x] **Batch 3 done and TREATED** _(`5194a9e`, logs `…/v460-review-fixes-batch3.log`,
>             `…/v460-hooks-reconcile-recheck.log`)_ — `note-refresh.mjs` confirmed at **96.88 %**, and
>             **`hooks-reconcile.mjs` 77.05 → 78.69 %**, then its last two survivors on the touched line
>             killed. That file is **not this release's** (the branch grazes one line of it), so its 24
>             remaining survivors are recorded as pre-existing rather than swept in. What the run bought:
>             nothing had ever fed the repair a non-string `command`, nor placed the broken prefix
>             anywhere but at position 0 — and the fixture that tells the guard's two terms apart is a
>             non-string whose coercion LOOKS like the broken command.
>       - [x] **RESULTS.md § v4.6.0 updated** _(`75d0d5a`)_ — the second pass is its own section, and the
>             three superseded numbers in the first table are marked as NOT the ones at the tag rather
>             than left for a reader to reconcile.
> - [x] **CI green**, checked against the head SHA rather than the PR's colour: 7/7 on `1e807d6` (all six
>       fixes + the CRLF repair + the promotion) and again on `75d0d5a` (the mutation hardening + the
>       re-measure). The commits after it are documentation only; re-check the tip before tagging.
> - [x] **The release note and the PR body are finished** _(`085b225`, and the live PR body + PR title
>       are synced on GitHub)_ — the note's `Review & CI` section is written (six defects, all fixed, told
>       through the two checks that had stopped watching, no finding codes), its mutation table names the
>       78.69 % file instead of implying everything touched is ≥ 96 %, and two overclaims are repaired in
>       both artifacts (the producer/consumer reuse, and the promotion writing the visible block on cards
>       you already have).
> - [x] **✅ THE PUBLIC TAIL IS DONE — v4.6.0 IS OUT** _(2026-08-04)_. The owner was asked first, as
>       planned (it is outward-facing and effectively irreversible), and said go. What happened:
>   - [x] **CI re-checked on the tip**, against the head SHA rather than the PR's colour: **7/7 green on
>         `7ab8f82`** (Node 22/24/26 × macOS + Windows, plus the Windows installer e2e).
>   - [x] **Title re-opened by the owner and re-settled** _(2026-08-04)_ — three candidates were put up
>         (the homonymy one in place, "The One Where It Stops Making People Up", "The One Where Your
>         Notes Get the Last Word") and the owner **kept `v4.6.0 — The One Where It Asks Which One You
>         Mean`**. Nothing to resynchronise: it was already correct on the note's H1, the PR body and the
>         PR title. **Do not re-open it.**
>   - [x] `gh pr ready 55` (undraft), then merged — merge commit **`c0b2b16`** on `main`.
>   - [x] Tag **`v4.6.0`** on `c0b2b16`, pushed, and the **release is published**:
>         <https://github.com/tpierrain/kenjaku/releases/tag/v4.6.0>. Body = the note minus its H1 (the
>         title lives in the release title), the shape v4.5.0 used.
>   - [x] **Both artifacts archived** into `maintainers/plans/archived/` as `release-v4.6.0-note.md` and
>         `release-v4.6.0-pr-body.md`, next to v4.5.0's.
>   - [x] **This plan file is NOT archived**: v4.7.0 (visibility) still lives in it, and the header now
>         says so — see `## Step 13`.
>
> **HISTORY, kept because it explains the six fixes above.** The review landed 2026-08-04 with six
> findings, each verified against the code before being written down (the traversal was reproduced, not
> reasoned about). They are listed one by one, with their verification and their fix, in Step 12.5's
> checkbox *"The six findings, in the order to treat them"* — all six are now ticked there. **Do NOT
> re-run the review and do not re-verify them.**
>
> **✅ DECIDED (2026-08-04, by the owner), two calls — do not re-open either:**
> - **The traversal (③) ships INSIDE v4.6.0**, not as a follow-up. It is pre-existing, but the branch
>   touches that very function and widens what an escaped write can carry.
> - **All six are treated in TDD**, red first. For ① and ② that means **two reds each**: the defect
>   itself, *and* the guard that should have caught it and did not (`identity-discipline.test.mjs`'s
>   `SKILLS` array never iterates `consolidate`; the F5 audit filters on the literal
>   `"additionalContext:"` and so cannot see an assignment). Fixing the defect without fixing its
>   guard would leave this release repeating, a fourth time, the failure it is named after.
>
> **Then, and only then, the release tail** (title into the note H1 + PR title, undraft, merge, tag,
> publish, archive) — it is the last checkbox of Step 12.5 and is unchanged by the review.
>
> Done and pushed _(2026-08-03, `e57fc6f` → `2f16a1b`)_: the mutation pass (7 files, measured, treated
> and **re-measured** — all ≥ 96 %, two at 100 %, every survivor a pre-listed equivalent), the version
> vector, the §10 marketing re-read **with its verdict recorded**, RESULTS.md § v4.6.0, the user-facing
> note, the PR body, **draft PR #55**, and **CI green on the branch head** (Node 22/24/26 × macOS +
> Windows + the Windows installer e2e, checked against the head SHA rather than the PR's colour).
>
> **The title is settled — the owner chose `v4.6.0 — The One Where It Asks Which One You Mean`.** It
> still has to be written into the note's H1 and the PR title, which both carry a placeholder.
>
> **Nothing is half-written on disk**, the suite is green (1316 tests, 1315 pass, 1 skipped
> Windows-only), and the note already covers the `⚙️ Kenjaku engine` startup segment that Step 12.0
> left open. Still true for later: the F3 wording (v4.7.0) must share this release's vocabulary.
>
> **✅ DECIDED (2026-08-03, by the owner): 12.3 ships PROSE + A DETERMINISTIC GUARD.** The scope was
> put to the owner with three options and this is the one chosen — **do not re-open it**. Both doors
> that create a `people/` card (`/file-back` and `/consolidate`) write through **one** script,
> `scripts/file-back-note.mjs`, so the check has a single choke point. The builder **refuses** a NEW
> person card whose first name is already borne by another card until the spec says which one, and the
> refusal **names the homonyms it found** (so the writer does not have to go looking again). The two
> rejected options are recorded so they are not re-derived: prose only (*a rule nothing executes* —
> this release has met that failure twice already), and a non-blocking stderr warning (which renders a
> caught defect and an ordinary write identically — this trilogy's own defect shape).

- [x] **Step 12.0 — SHOW KENJAKU'S VERSION AT SESSION START. ✅ CODE-COMPLETE** _(2026-08-03 ·
      `22de9a2` → `807b9aa`, suite green 1236 pass / 1 skipped Windows-only)_. _(asked by the owner,
      2026-08-03: « j'aimerai que tu rajoutes la version de Kenjaku au démarrage … à la prochaine
      release »)_ Small, independent of the identity work, so it went first.
  - [x] **The label, chosen by the owner: `⚙️ Kenjaku engine v4.5.0`.** Asked because it is a real
        product decision, not a detail: the engine had **never** said the word "Kenjaku" to a generated
        brain (zero occurrences in both constitutions, every script and every skill — measured, not
        assumed), so this is the product's name entering the brain's own surface for the first time.
        The 🧠 of the mock-up became ⚙️ because 🧠 is already the RAG line's marker, and two identical
        markers in one banner is this trilogy's own defect shape.
  - [x] **Do NOT invent a version, and do not mint a second helper.** `scripts/lib/engine-version.mjs`
        already turns the brain's `engine-manifest.json` into the user-facing label (ADR 0017): the git
        **tag** the brain was installed/updated from (`source.ref`), falling back to `engineVersion.rag`,
        and **null** when nothing is usable → then no segment at all, rather than a made-up number.
  - [x] **Two labels now share ONE resolution** (`installRef`), and their difference is the point: the
        status-line label says *"engine"*, which claims nothing about which product, so it may keep its
        fallback to `engineVersion.rag`; the startup segment says *"Kenjaku engine"*, so it may only ever
        show a real install ref. **`rag` 1.3.0 has never been a Kenjaku release number** — an owner
        reading "Kenjaku engine 1.3.0" would report a version that does not exist. **No ref → no
        segment**, and naming that state out loud stays F3's job in v4.7.0.
  - [x] **Why it was invisible, and this is the actual finding**: that label's only surface was the
        **statusLine**, and ADR 0036 had the engine *retreat* from the statusLine (it was clobbering the
        owner's own). `scripts/status-line.mjs` still computes it; nothing rendered it. So the version did
        not "never exist" — it **stopped being shown** and nobody noticed. Say it that way in the note.
  - [x] **Both channels, or it is half-shipped**: `systemMessage` (CLI terminal only) **and**
        `hookSpecificOutput.additionalContext` (the ONLY channel the Code tab of Claude Desktop renders,
        via the agent's chat relay — ADR 0036's channel matrix). Shipping the CLI half alone would
        reproduce this release's own reframe: "shown" and "not shown" rendered identically to us. Both
        ride a pure seam, `scripts/lib/status-hook-output.mjs`, because `session-status.mjs` is one of
        the top-level scripts no test can import (named debt).
  - [x] **Found by field-checking it, and NOT cosmetic: a pending restart outranks the version**
        _(`807b9aa`)_. The new segment had taken the lead from the `⚠️ RESTART Claude` nudge, which holds
        it for a written reason — until the owner restarts, nothing they read comes from the engine they
        now have. And that is exactly when the claim is false: `update-engine` rewrites `source.ref` to
        the **new** tag while the **old** code is still answering (`update-engine.mjs:312`). On the CLI
        the restart line above it qualifies the version; on Desktop it would not, since the restart nudge
        does not ride `additionalContext`. So a pending restart demotes the segment **and drops its chat
        relay entirely**.
  - [x] **Field-verified on a THROWAWAY CLONE, never on this repo** — both channels carry
        `⚙️ Kenjaku engine v4.5.0`, and the launcher itself (no `source`) stays silent, which is the
        intended silence. ⚠️ **The lesson not to re-learn**: running `session-status.mjs` by hand here
        first fired its own SessionStart side effects (sweep + auto-commit of the working tree, an
        `auto: session-start sweep` commit swallowing the wiring edit — reset, nothing lost, nothing
        pushed). The memory `never-smoke-run-sessionstart-hooks` says exactly this. **Smoke-run a
        SessionStart hook in a clone, never in the repo you are working in.**
  - [x] **Delivery checked, not assumed**: `scripts/lib/**` and `scripts/session-status.mjs` are both in
        the manifest's `replace` regime, so the seam and the wiring reach the fleet on the next
        `/update-engine`; `engine-manifest.json` is in **no** regime and is rewritten by `update-engine`
        itself, so the displayed version follows updates instead of freezing at install day.
  - [ ] **Left for the release step**: the note + §10 re-read (the version is a user-visible surface), and
        deciding whether `SETUP.md` should say where the version is read from.
  - [ ] Sibling to watch, **not** to merge: **F3** (v4.7.0) separates *"no engine update available"* from
        *"the target version is simply unknown"*. That one is about the **target**; this one is about the
        **installed** version. They must share one vocabulary — settle the wording here, since this ships
        first, exactly as F18's confidence scale was settled before v4.6.0 reuses it.
- [x] **Step 12.1 — F7: resolve against the vault BEFORE writing. ✅ COMPLETE** _(2026-08-03 · `9790c90`
      → `cbd8818` → `861ec64` → this commit)_. The first move, because the exposure
      is live: it fires at every briefing and every 1-1 prep until it ships, and correcting the note does
      not stop it (proven — it recurred the same evening on the other laptop, against a vault that
      carried the right answer).
  - [x] **The mechanism is IN THE SKILL, not in the model's imagination** _(read 2026-08-03,
        `.claude/skills/sync-sources/SKILL.md:66-71`)_. Its "People registry" section says, in the same
        breath, **"never a first name alone — `[[people/jane]]` is forbidden"** *and* **"create the
        backlinks even if the target page doesn't exist"**. Handed *"Jérémy (front Candor)"*, a sub-agent
        obeying both has exactly two exits: drop the link, or **invent a surname**. It invented
        (*"Jérémy Hinard"*). So this is not a fix bolted onto a neutral rule — it **repairs a rule the
        engine ships**, which is why the fix must land here and not brain-side (patching it in a brain
        freezes that brain, F5).
  - [x] A bare first name stays **plain text, no link** — never `[[people/…]]`, never a surname supplied
        by the model. Losing a backlink is cheap; a fabricated identity is permanent and gets indexed.
  - [x] Before writing a person, **read the vault**: resolve each cited person against
        `vault/*/people/` (universe subtrees included — the skill still says `vault/people/`, check that
        path against the universes layout) and the organisation notes. Resolution is already tier-3 in
        F18's table (*"and every identity resolution"*), so this is that tier's missing procedure, not a
        new doctrine.
  - [x] A `search_vault` before calling any fact **new** — the field note republished a two-month-old
        fact as a scoop, and asserted *"Hossam, CTO Visma France (non confirmé)"* while
        `people/hossam-laanait.md` said *"confirmé 04/06"*. ✅ _(2026-08-03)_ — shipped on **two**
        surfaces, the prose rule and the third reconcile pass of `Step 3 — Synthesis`, because the
        sub-agents never see the vault. See the header note for what that split turned up.
  - [x] The control sits in the **producer** (`sync-sources`), not in each consumer: `prepare-1-1` reuses
        that fan-out, and two paraphrases are two disciplines (the rule F18 already locked by test).
  - [x] Guard: extend the `claim-discipline` family with an identity guard, EN + FR, skills + both
        constitutions. **Red first**, and check what the red run teaches — F18's first pass went green on
        prose that was already there for other reasons. ✅ _(2026-08-03)_ —
        `scripts/lib/identity-discipline.test.mjs`, 24 assertions, sharing `doc-section.mjs` with the
        claim guard. Every step was red first; what the red runs taught is in the header note.
- [x] **Step 12.2 — F6: repairing a link is not asserting a person exists. ✅ COMPLETE**
      _(2026-08-03 · `de2e658`)_. Never create a `people/` note merely to satisfy an incoming link.
      Evidence and the feedback loop are in P1; the field cost was `people/stephanie-music.md`, a
      person who occurs **once in the whole vault: in her own title**.
  - [x] The fourth rule of the identity discipline, EN + FR skills + both constitutions.
  - [x] `/lint`'s dangling remedy: the create-the-note gesture keeps its **topic** case and excludes a
        `[[people/…]]` target. This is the rule that MANUFACTURED the defect, same shape as F7's
        "People registry" — the fix repairs an order the engine ships, it does not add a caveat to a
        neutral one.
  - [x] `/consolidate`, the door `/lint` hands off to: a person candidate's mention count is a
        **priority signal, not evidence the person exists**. Resolve first, leave the page unwritten
        when the name will not resolve.
  - [x] Both skills **point** at `sync-sources#identity-discipline`; neither restates it.
- [x] **Step 12.3 — the homonymy block. ✅ COMPLETE** _(2026-08-03 · `c0187a5` → `9b6c64c`)_.
      A `people/` note only makes the resolution rule usable if it
      says **which** Romain (3 of them on the field brain, plus 3 Marie, 2 Karim, 2 Caroline, 2 Michael).
      Without it, the notes only move the ambiguity. Scope decided by the owner — see the header note.
  - [x] **The prose half** — the identity discipline's fifth rule (*say which one*), `sync-sources`
        EN + FR, plus both constitutions, in the guard family already shared with the claim discipline.
        Two sides, and the second is what makes the first usable: a card **says** what distinguishes
        this person, and a bare first name matching several cards is **unresolved** (so rule 2 applies:
        plain text, no link) rather than resolved to the nearest one.
  - [x] **The deterministic half** — `scripts/file-back-note.mjs` (+ its pure core `lib/filed-note.mjs`):
        a new `person` card whose first name is already borne by another card is refused until the spec
        carries what tells them apart; the refusal names the homonyms. Covers `/file-back` **and**
        `/consolidate`, which both write through it.
  - [x] **The two skills document the field** (`file-back`, `consolidate`), pointing at the producer's
        section rather than restating the rule — the shape F6 and F7 both landed on.
- [x] **Step 12.4 — the reliability/confidence block. ✅ COMPLETE** _(2026-08-03 · `e61002f` →
      `180e4de`)_ on any note born from a **probable** rather than confirmed resolution, in F18's
      vocabulary (see the header note above for what shipped and the two lessons).
  - [x] **The prose half** — the identity discipline's sixth rule (*say how sure you are*),
        `sync-sources` EN + FR plus both constitutions, in the guard family shared with the claim
        discipline. Two sides again: the card **says** what its identity rests on, and at read time a
        card marked 🟡 or 🔴 is a **lead, not the vault's answer** (re-verified, never inherited).
  - [x] **The deterministic half** — `scripts/lib/filed-note.mjs` renders the block **and** a
        `confidence:` frontmatter field; `scripts/file-back-note.mjs` refuses a new `person` card
        without it; a bad level or a basis-less marker is refused, never rendered leniently.
  - [x] **The promotion gesture** — `scripts/refresh-note.mjs` rewrites the field and the visible
        block together, through the builder's own renderer. Without it the marker could never change,
        which is how it would have rotted back into decoration.
  - [x] **The two skills document the field** (`file-back`, `consolidate`), the latter saying why a
        mention-count candidate is rarely `observed`.
- [ ] **Step 12.5 — the release**: mutation pass on what changed, version vector, §10 marketing re-read,
      note + PR body. Same shape as Step 11; its recipe (worktree, batch sizes, the `rag/node_modules`
      symlink) is written there and stays valid.
  - [x] **Suite green at the tip before starting** _(2026-08-03 · `c53dd5a`)_ — 1297 tests, 1296 pass,
        1 skipped Windows-only.
  - [x] **What this release changed, measured** _(`git diff --stat main...HEAD`)_: **no `rag/src` file
        at all**, so the mutation pass is `scripts` only. Eight production files —
        `file-back-note.mjs`, `refresh-note.mjs`, `session-status.mjs`, and under `lib/`
        `filed-note.mjs`, `note-refresh.mjs`, `engine-version.mjs`, `status-hook-output.mjs`,
        `doc-section.mjs`. `session-status.mjs` is the **named 0 % top-level tier** (no test can import
        it — that is exactly why `status-hook-output.mjs` exists); it is **not** mutated here, and
        RESULTS.md says so rather than leaving a silent hole.
  - [ ] **Mutation batches** (worktree `/Users/tpierrain/Dev/kenjaku-mut-v460`, `rag/node_modules`
        symlinked and **verified** — 31 pass / 0 skipped before starting, or the write-guard mutants
        face a suite that cannot judge them).
    - [x] **Batch 1 done and TREATED** _(2026-08-03 · `7879454`, log `…/v460-scripts-batch1.log`)_ —
          `filed-note.mjs` **96.00 %** (5), `file-back-note.mjs` **72.81 %** (31 + 1 timeout). Both
          families this release keeps meeting: the real deps observed by nothing (fixed by one real
          child process against a throwaway brain, which is also the only thing that reaches the stdin
          read, the recursive mkdir and the entrypoint guard) and refusal text asserted by fragments
          (now asserted whole — that text IS the product here).
    - [x] **Batch 2 done and TREATED** _(2026-08-03 · `bd6f995`, log `…/v460-scripts-batch2.log`)_ —
          `doc-section.mjs` **53.33 %** (14), `refresh-note.mjs` **68.52 %** (17 + 1 timeout),
          `note-refresh.mjs` **92.31 %** (7), `engine-version.mjs` **95.24 %** (2),
          `status-hook-output.mjs` **92.86 %** (1). **The finding: `doc-section.mjs` had no test file
          at all** — the slicer that decides what every doc guard reads, exercised only through those
          guards, against documents where a degraded slice still contained the words they look for.
          Both "return the whole document" mutants survived, which silently turns every sliced guard
          back into the flat search it was extracted to replace. It has its own tests now (14/14 dead).
    - [x] **RE-MEASURED, and all seven came back clean** _(2026-08-03 · `5b57c7e`, logs
          `…-batch1-recheck.log` + `…-batch2-recheck.log`)_ — `doc-section` 53.33 → **100 %**,
          `refresh-note` 68.52 → **96.30 %**, `file-back-note` 72.81 → **96.49 %**,
          `status-hook-output` 92.86 → **100 %**, `note-refresh` 92.31 → **97.80 %**,
          `engine-version` 95.24 → **97.62 %**, `filed-note` 96.00 → **97.60 %**. **Every survivor
          left is on the equivalence list written before the run.** Recorded in RESULTS.md § v4.6.0.
    - [x] **Equivalents, established by hand and NOT to be chased** _(each mutant applied, run, and
          reverted)_: `readFileSync(0, "")` in both CLIs (returns a Buffer, `JSON.parse` coerces it —
          already recorded at v4.5.0 for the guard hook); the slug's `^-+|-+$` quantifiers (the
          preceding `[^a-z0-9]+` collapse makes two leading hyphens unreachable — verified on six
          titles); `/\.md$/` unanchored in `firstNameSegment` (the first name is the first hyphen
          segment, and no vault path carries `.md` inside it); `typeof manifest !== "object"` (a
          truthy non-object yields null through both paths anyway); and two regex tails where `$` is
          redundant without the `s` flag (`.*$` and `([\s\S]*)$`).
    - [ ] **Still open, and NOT this release's debt**: the shared `runAsEntrypoint(meta, argv, fn)`
          (3 mutants × 10+ scripts, named at v4.5.0). Two of the three now die per file thanks to the
          child-process tests; what remains is `process.argv.slice(2)` → `process.argv`, a true
          equivalent in both CLIs here since both take their spec on **stdin** and ignore argv.
  - [x] **Version vector done** _(2026-08-03 · `e4d2110`)_ — measured first: `rag/` and
        `local-mirror/` are untouched by this branch, so only `scripts` 1.10.0 → **1.11.0** and
        `constitutionTemplate` 1.1.0 → **1.2.0**. `indexSchemaVersion` stays **2** — no reindex, which
        is what the note promises.
  - [x] **§10 marketing re-read done** _(2026-08-03 · `e4d2110`)_. **Made TRUE and now sold**: the
        brain no longer invents a colleague (README §A, next to "silence is reported as silence" —
        same defect family, identity half; §C's builder bullet; EN-QUOI's hole-by-hole table + §4.4),
        and the startup version segment (SETUP §10 answers "which version am I on", including the two
        deliberate silences). **Made FALSE: nothing** — no promise this release contradicts.
        **Found stale while re-reading**: 34 ADRs → 37, and local-mirror's mutation score quoted at
        95.6 % while RESULTS.md has read 90.4 % since v4.2.0 (an overclaim by five points, now
        corrected and framed as "each package's last package-wide audit"). **Boards: re-read through
        their alt texts, NOT re-rendered** — `board-reliability` shows "34 ADRs", a snapshot that now
        under-claims, which is not a false promise; nothing on any board asserts something the code
        stopped doing.
  - [x] **Release note drafted** _(2026-08-03 · `f507942`)_ —
        `maintainers/plans/archived/release-v4.6.0-note.md`, §11 shape, no finding codes, and it
        carries the startup version segment left over from Step 12.0. Two placeholders on purpose: the
        title, and the mutation/CI blocks (filled from measurements, not from intent).
  - [x] **PR body written and PR OPEN** _(2026-08-03 · `1eb6c7b`)_ — **draft PR #55**,
        `archived/release-v4.6.0-pr-body.md`. Its title is a placeholder on purpose (the release
        title is the owner's call, below) and must be rewritten before the merge.
  - [x] **TITLE CHOSEN BY THE OWNER** _(2026-08-03)_: **`v4.6.0 — The One Where It Asks Which One You
        Mean`**. Do not re-open it, and do not re-run the three-candidate question. It still has to be
        written into the note's H1, the PR title (currently a placeholder) and the release itself.
  - [x] **CI HAS SPOKEN — 7/7 GREEN on the branch head** _(2026-08-03 · `2f16a1b`, PR #55)_: Node
        22/24/26 × macOS + Windows, plus the Windows installer e2e, plus the tripwire. Verified against
        the head SHA, not just "the PR looks green". Every commit was pushed as it was made, so the
        67-commit silence that preceded v4.5.0's blocker never had a chance to build.
  - [x] **RESULTS.md § v4.6.0 written** _(2026-08-03 · `5b57c7e`)_ — per-file numbers, the finding,
        and every equivalent with the reason it is one.
  - [x] **✅ THE REVIEW HAS LANDED** _(2026-08-04)_ — 8 candidates, **6 findings** after verification
        and dedup. **I re-ran every one of them against the code myself: all six are REAL** (the
        traversal was reproduced, not reasoned about). Session
        `https://claude.ai/code/session_01YYtb3j4TFGN9SuP85TTZuA`; it posted **nothing to the PR**.
        The one candidate that did NOT survive: *"refreshNote promotes the confidence field without
        adding the visible block"*. Mechanically the no-op IS there (no `> **Confidence** — ` line in
        the body → the `replace` does nothing while the frontmatter field moves), but it needs a card
        that lacks the block, and no verdict backs it. **Left open, not silently dropped** — settle it
        with a test before claiming either way.
  - [x] **The six findings, in the order to treat them — ALL SIX DONE** _(2026-08-04)_. **✅ ORDER AND SCOPE APPROVED BY THE OWNER
        (2026-08-04): all six, TDD, red first, and ③ ships in THIS release.** ① and ② each need **two**
        reds: the defect, and the guard that missed it. Tick each box with its commit as it lands, so a
        `/clear` mid-sequence resumes at the first unticked one.
    - [x] **① DONE** _(2026-08-04 · `e34c3ae`)_ — the wording is the producer's own action form, and
          the guard's carrier list is now **derived from the repo**: every `SKILL.md` under the three
          skill roots that hands a fenced `prompt="""` to a sub-agent must be listed, or it goes red.
          Two reds, both verified fail-first: the coverage assertion named
          `engine-skills/consolidate/SKILL.md` before the fix, then the phrasing assertion failed on it.
          Suite green (1318 tests, 1317 pass, 1 skipped Windows-only). Original entry, kept:
          **`engine-skills/consolidate/SKILL.md:94` — the other write-door still carries the
          wording that MANUFACTURED F7.** Verified: the file still reads *"Backlinks kebab-case, no
          accents, never a first name alone."*, inside a fenced `Agent(prompt=…)` block handed
          verbatim to sub-agents, and it holds **no** *"no full name, no link"*. So a sub-agent handed
          a bare first name is still ordered to produce a `[[people/…]]` link and forbidden from the
          short form: inventing the surname stays the only exit. **This makes the PR body's claim
          false** (*"the producer, which every consumer reuses"*). The guard's own comment predicted
          this drift and its `SKILLS` array simply never iterates the file (`WRITE_DOORS` does, but
          only checks `distinguish` and the section anchor). Fix = the sync-sources phrasing + add the
          file to `SKILLS`. **This is the one that matters; it reopens the release's headline defect.**
    - [x] **② DONE** _(2026-08-04 · `53b0560`)_ — the detector is broadened (`/additionalContext\s*[:=]/`,
          still a pure textual scan, no parse), the pinned list is at **five**, and the version relay
          carries its own bound (framing **measured** at 69 chars, capped at 90) marked with the audit's
          own marker. **The emitter kept its assignment form** rather than being bent into an object
          literal: the key must be ABSENT when a brain cannot name its version, and the guard is what was
          broken. Two reds, both verified: the detector named the fifth emitter, then the coverage test
          reported it unbounded. Suite green (1319 tests, 1318 pass, 1 skipped Windows-only). Original
          entry, kept: **`scripts/lib/status-hook-output.mjs:30` — the new emitter escapes the F5 audit.**
          Verified: `grep -c "additionalContext:"` on the file returns **0**, because it assigns
          (`obj.additionalContext = …`) while the guard filters on the literal `"additionalContext:"`.
          The pinned list stays at four and goes green. No runtime leak (the payload is ~90 chars) —
          **what breaks is the guard**, exactly as its own header warns ("a guard that silently stops
          matching is worse than no guard"). Fix = object-literal form + add to the pinned list + a
          bound test carrying the `volume IS the defect (F5)` marker.
    - [x] **③ DONE** _(2026-08-04 · `6c5a072`)_ — fixed with `posix.normalize` **before** the comparison,
          not `resolve`: the Windows brain is simulated on macOS through string-level POSIX form, so
          `resolve` would have broken that test. The red was a **real child process** (the injected fakes
          key on literal strings and would have reported the escape as "does not exist" — passing for the
          wrong reason); it printed `✓ Refreshed: vault/..\outside.md` and overwrote the outside file.
          Checked, not assumed: the twin door `file-back-note.mjs` derives its path from a slug stripping
          every non-alphanumeric, so it carries no such hole. Suite green (1320 tests, 1319 pass, 1 skipped
          Windows-only). Original entry, kept: **`scripts/refresh-note.mjs:66` — vault containment
          bypassed by a backslash path, and I
          REPRODUCED it.** `join("/brain/vault", "..\\outside.md")` leaves the backslash literal on
          POSIX; `toPosix()` then turns it into `/brain/vault/../outside.md`, which **passes**
          `startsWith(vaultDir + "/")` and is resolved by `fs` to the escaped target. Read AND write.
          **Pre-existing** (the branch does not introduce it) but the branch widens the payload by
          forwarding the free-form `confidence.basis` into the written file, and the spec arrives on
          stdin from an LLM invocation — the injection surface this very release names. Fix =
          `resolve` + `relative` re-check, plus a backslash test next to the existing `../../` one.
          **Scope call for the owner: ship it here or as a follow-up.**
    - [x] **④ DONE** _(2026-08-04 · `9377c17`, plus the class sweep `41cf186`)_ — function replacement.
          The red printed the corruption in full (the ✅ block containing the old 🟡 block). Then the
          **class** was swept rather than the instance patched: `repairWin32NodePrefix` injects the
          owner's own folder path (`$` and `&` are legal in a Windows folder name) and was fixed the same
          way, red first on `my$$brain` → `my$brain`; `restampUniverse` looks identical but is **not
          reachable** (its only caller normalises the name, stripping every non-alphanumeric) — checked,
          recorded, not "fixed". Suite green (1322 tests, 1321 pass, 1 skipped Windows-only). Original
          entry, kept: **`scripts/lib/note-refresh.mjs:98` — `$` sequences in the basis corrupt the
          block.** The
          template **string** handed to `body.replace()` expands `$&`, `` $` ``, `$'`, `$$`. Narrow
          (needs those characters in prose) but silent, and it lands the page in the exact
          two-different-things state the comment four lines above swears it prevents. Fix = function
          replacement.
    - [x] **⑤ DONE** _(2026-08-04 · `f7a00fc`)_ — the blank line is in, and the rule is **guarded in both
          locales** rather than merely repaired (the two files are meant to be each other's mirror): the
          assertion was red on EN and green on FR before the fix. Original entry, kept:
          **`.claude/skills/prepare-1-1/SKILL.md:63` — a missing blank line, EN only.** Verified
          against the FR sibling, which has it. Under CommonMark the "Markers are mandatory" paragraph
          becomes a lazy continuation of the previous bullet instead of applying to the whole section.
          Cosmetic for an LLM reader, real EN/FR drift for a human one.
    - [x] **⑥ DONE** _(2026-08-04 · `b3cabf9`, synced to GitHub)_ — v4.2.0 → **v3.0.0** (with the first
          commit named), plus two corrections the fixes above made necessary: the wording rule is stated
          in the producer **and** in `/consolidate` (so the body no longer claims a reuse the second
          write-door never performed), and Verification now carries the review's six findings, guards
          first. The **live PR body was updated**, not just the file. Original entry, kept:
          **`release-v4.6.0-pr-body.md:31` — the PR body contradicts the note it points at.** The
          body still says the label *"had been computed since v4.2.0"*; commit `2f16a1b` looked this
          up in git and corrected the **note** to v3.0.0, without carrying the fix across. A
          reviewer-facing marketing surface asserting a number the author already disproved.
    - [x] **Checked at a resume, 2026-08-03**: `gh pr view 55` shows **no review and no comment** on the
          PR, so the verdict has NOT landed yet; the owner confirmed they are launching it now. **On the
          next resume, look at the PR again before asking anything** — and if it has landed, treat the
          findings before touching the tail. The release itself is assembled and needs no re-doing.
    - [x] **LAUNCHED and STILL RUNNING, 2026-08-04** — session
          `https://claude.ai/code/session_01YYtb3j4TFGN9SuP85TTZuA`. It posts **nothing to the PR**
          (`gh pr view 55` stays at 0 reviews / 0 comments), so the PR is not the place to look: the
          session page is. State when read: search done (**8 candidates**), verify in progress
          (2 confirmed / 0 refuted and climbing), dedup pending. ⚠️ **`get_page_text` on that page
          returned a stale "Révision arrêtée"** while a screenshot showed it live with a counter moving
          — **trust the screenshot**, not the text extraction.
    - [x] **The 8 candidates, recorded so the list survives a `/clear`** — **ALL EIGHT ARE NOW SETTLED**
          _(2026-08-04)_: six became findings ① to ⑥ above and are fixed; the two `note-refresh.mjs`
          `$`-sequence entries were the same defect (deduped into ④); and the ninth-hour candidate
          *"promotes the field without adding the visible block"* was settled as a **real defect** and
          fixed in `2fac4ee`. Nothing here is open. _(Original list, kept as the trail:)_
      - [x] ✅ *confirmed* — `scripts/lib/note-refresh.mjs:92` **the confidence line is corrupted when
            the basis contains `$` replacement patterns**. Read the code: line 98 passes a template
            **string** to `body.replace()`, so `$&`, `` $` ``, `$'`, `$1` in the rendered basis are
            expanded as replacement patterns. Real, narrow, and the fix is a function replacement.
      - [x] ✅ *confirmed* — `scripts/lib/status-hook-output.mjs:30` **the new `additionalContext`
            emitter bypasses the F5 audit guard**.
      - [x] ⏳ `scripts/lib/note-refresh.mjs:92` **promotes the `confidence:` field without adding the
            visible block**. Worth taking seriously even before its verdict: if the body carries no
            `> **Confidence** — ` line, the `replace` is a silent no-op, so the field moves alone —
            **exactly** what the comment above it swears cannot happen ("promoted in BOTH places at
            once", Step 12.4's own claim).
      - [x] ⏳ `scripts/lib/note-refresh.mjs:98` — `$`-sequences in the basis treated as special
            replacements (likely the same defect as the first, a dedup candidate).
      - [x] ⏳ `scripts/refresh-note.mjs:84` — vault containment check bypassed by a backslash-escaped
            path on Linux/macOS.
      - [x] ⏳ `engine-skills/consolidate/SKILL.md:50` — the sub-agent prompt still carries the
            "never a first name alone" rule (a possible F6/F7 leftover).
      - [x] ⏳ `.claude/skills/prepare-1-1/SKILL.md:62` — missing blank line before the
            "Markers are mandatory" paragraph (EN).
      - [x] ⏳ `maintainers/plans/archived/release-v4.6.0-note.md:59` — **the note and the PR body
            disagree on when the engine version label was first shipped**. A user-facing artifact
            contradiction, so it belongs to the release tail whatever the verdict.
  - [x] **The tail — DONE, in this order** _(2026-08-04)_:
    - [x] The chosen title written into the note's H1 **and** the PR title (`cc0a3ae`), then re-put to
          the owner at the tail and **kept unchanged**.
    - [x] Undrafted + merged PR #55 (merge `c0b2b16`), tagged `v4.6.0`, release published from the
          note's body.
    - [x] `release-v4.6.0-note.md` + `release-v4.6.0-pr-body.md` moved into
          `maintainers/plans/archived/`, next to v4.5.0's; merge SHA and tag recorded above.
    - [x] The plan's live work is now **v4.7.0 (visibility)** — see `## Step 13`, and the header says so.

## Step 13 — v4.7.0, the short one: this morning's field session — 🔜 THE LIVE WORK

> **What this release is about — and what it deliberately is NOT.** v4.7.0 was filed as the third leg of
> the trilogy (*everything the brain SHOWS*: banner, offers, target version, commit trail). **The owner
> cut it down on 2026-08-05: it ships ONLY what that morning's field session raised**, plus the
> dependency pins we wrote ourselves. Everything else keeps its entry and moves to **v4.8.0**. The
> trilogy framing survives — v4.7.0 is simply its short leg, not its whole one.
>
> ### ✅ THE SCOPE, DECIDED BY THE OWNER (2026-08-05). Do not re-open it, do not widen it.
>
> **In — four items, and nothing else:**
> - [x] **PR #56, the dependency pins** — ours, replacing two drive-by PRs from a fork. **✅ MERGED
>       2026-08-05** (`b414766` on `main`); `release/v4.7.0` is branched off it and pushed. Detail below;
>       do not re-derive it.
> - [ ] **F20** (`### P3`) — a machine that is behind runs the old engine all session and never says so,
>       so **F1's privacy fix silently does not apply there**. The pull is already first; the gap is that
>       the restart nudge is blind to an engine that arrived **by pull**. Its entry carries the
>       verification, the fix shape, and the owner's follow-up (inject on `UserPromptSubmit`, never
>       block; a SessionStart hook cannot abort a session): **do not re-derive any of it.**
> - [ ] **F21** (`### P3`) — the index says *19 pending, auto-resume on the next session* while the
>       watcher is idle and there is no quota to wait for. **Same root as F20** (session start is a race
>       between what arrives and what reads it), so scope them together even if they ship as two changes.
> - [ ] **F22** (`### P3`) — `/univers` is an unknown command: the command is named after the verb while
>       it owns the noun.
>   - [x] **✅ The naming call is CLOSED by the owner (2026-08-05): option A — two thin aliases at the
>         root, `universe` AND `univers`, both locales get both.** It covers the English guess as well as
>         the French one that was actually reported. Option C (renaming `/switch`) stays dominated and
>         must not be revisited: the reconciler installs skills by directory name and never removes one,
>         so on a deployed brain a rename **is** an alias plus a stale duplicate.
>
> **Out — moved to v4.8.0, entries untouched, nothing re-analysed when they come back:** F13, F3, F10,
> F8, F9, F2, F19, **and the two banner defects routed here from P0** (a cached verdict rendered with
> live authority; an `unknown` check displayed under "found a problem" — the latter is already pinned by
> a test that names it, so it cannot be read as intended behaviour, only as deferred).
>
> **Also out, and it was already named debt rather than a finding:** the shared
> `runAsEntrypoint(meta, argv, fn)` (10+ scripts carry the identical three-mutant boot guard; it is all
> that is left standing in `verify-index.mjs` 92.31 % and `rehydrate.mjs` 95.40 %), and the `session-*`
> tier (`session-status.mjs` **0 %**, `session-universe.mjs`, `session-self-heal.mjs` — top-level scripts
> no test can import, inherited since v4.4.0, a refactor of fleet-deployed scripts and therefore its own
> release).
>
> ### PR #56 — what it is, so nobody re-audits it
>
> **`chore/pin-vulnerable-transitive-deps`, CI green 7/7 on `b88ca51`.** It replaces two drive-by PRs
> from a fork (#48 fast-uri, #52 adm-zip), **both closed** with an explanation after each was applied to
> a throwaway copy and re-audited: neither closed its advisory. Ours pins both through `overrides` in
> **both** packages (`rag` carries `fast-uri` too, via its own `ajv` — that is what the drive-by PRs
> missed). Measured: `rag` 12 → 9 vulnerabilities, `local-mirror` 6 → 5. **Deliberately NOT addressed,
> and a candidate for its own pass:** the rest of the audit (`sharp`/libvips with no fix available,
> `js-yaml`, `protobufjs`, the hono chain). The PR body carries all of this.
>
> ⚠️ **No finding codes in any artifact** (the owner, 2026-08-03): "F20, F21, Fx" are filing labels for
> this plan only. The note, the PR body and the release name the behaviour instead.
>
> ### ⏭️ THE RESUME POINT — the three findings are DONE; the live work is **13.4, the release tail**
>
> **✅ F20 IS COMPLETE** _(2026-08-05 · `82f49cd`, `ee1c373`)_. Both halves shipped, and the two calls
> the entry left open are taken below; do not re-open them.
> - **Detection** — `scripts/lib/frozen-wiring.mjs` names what a session freezes at start (hooks,
>   skills, settings, the constitution, both MCP servers, the version vector) out of the pull's own
>   file list, which `session-status.mjs` already computed and threw away to keep a count. A match
>   arms `.cache/restart-needed`, so the nudge that already exists leads the banner. The flag's path
>   and body now have ONE owner (`restart-signal.mjs`), since three surfaces arm it.
> - **Delivery** — a `UserPromptSubmit` hook, `scripts/prompt-restart-nudge.mjs`, injects the
>   directive on **every prompt** while the flag is armed. It **injects, never blocks** (the event
>   can refuse a prompt outright; a wrong verdict must cost a sentence, not a locked-out owner), and
>   it is the first deterministic **Desktop** cue for a stale engine. Carried by the manifest,
>   reconciled onto brains that have no `UserPromptSubmit` key at all — i.e. every brain there is.
> - **✅ Settled: the nudge does NOT name the privacy case.** A banner that already printed the
>   profile is not un-leaked by a restart, so naming it buys the owner nothing actionable and dates
>   the copy to one release. The generic wording (ADR 0036) is what ships.
> - **✅ Settled: a brain with no remote stays silent, by construction** — no pull, no file list, no
>   arming. Pinned by a test rather than left to the reader.
> - **What the pass turned up, worth not re-learning:** the F5 emitter audit
>   (`startup-payload-guard.test.mjs`) went red on the new hook **before its bound existed** — the net
>   works. It is the **sixth** emitter and the first that is NOT a startup hook, so the channel it
>   guards is now "every prompt", not "one session start". Its bound lives with the emitter, per that
>   guard's own convention.
>
> **✅ F21 IS COMPLETE** _(2026-08-05 · `25057b0`)_. Both halves shipped, and the second one is what
> the owner actually asked for.
> - **Say which** — `rag/src/lib/index-shortfall.ts` reads the run state the SessionStart banner
>   already reads (the same `last-run` record, not a second opinion) and separates **five** states
>   that were rendered as one sentence: notes the indexer **refused** (never resolves itself), a
>   **quota wall** (does — and it keeps the resume promise, the one case it was written for), a run
>   **still in flight**, notes that simply **arrived** after the scan, and a gap a catch-up has
>   already **failed to close**.
> - **Then act** — the arrival case now schedules a catch-up through the `ReindexScheduler` that was
>   sitting idle, armed for an event that had already happened. Both surfaces do it: the startup path
>   (after the watcher exists, since it owns the scheduler) and `vault_stats` (the question IS the
>   moment — the line says "catching up now", so the ask has to happen there or the sentence would be
>   the old promise in newer words). Bounded by progress, in memory, per server process.
> - **The fifth state was found by an existing test, not by design.** `C.13` asserted the old
>   sentence for a run whose status is `running`; under the new model that would have read "they
>   arrived after the last scan" about work being done as the owner reads it. A run in flight is the
>   one wait nobody has to be told about.
> - **Three existing expectations were repointed, deliberately** (`3.1b`, `4.2`, `C.13`): they
>   encoded the promise this finding is about. The cap case gained a test of its own so the fix
>   cannot swap one wrong cause for another.
> - **Not changed, and why:** the SessionStart banner (`scripts/lib/rag-status.mjs`) still says
>   "auto catch-up in the background" for an unexplained shortfall — a sentence F21 makes **true**
>   for the first time. It cannot know about the process-local bound (it runs before the server), so
>   a permanently stalled gap is named by F15's crosscheck instead, which already exists for exactly
>   that.
>
> **✅ F22 IS COMPLETE** _(2026-08-05 · `c229cab`)_. Option A as decided: `engine-skills/universe/`
> and `engine-skills/univers/`, both locales getting both. They **point** at `switch` and explain
> nothing — the reconciler never removes a skill, so a second copy of the rules would outlive any
> repair. Delivery checked, not assumed: `engine-skills/**` is `replace`, `installStagedSkills`
> install-if-absents any new directory, and both doors run it (the installer for a fresh brain,
> the reconcile for the fleet). Guarded by `scripts/lib/skill-aliases.test.mjs` on the four things
> that break an alias silently: the folder (the CLI routes on it), the declared `name:`, the target
> still existing, and the description's cost in the always-loaded layer (F19).
>
> **Next: 13.4 — the release tail.** Start with the bookkeeping the scope cut created (three code
> comments still send a reader to v4.7.0 for work that now lands in v4.8.0), then the usual shape.
>
> Nothing is half-written on disk. `main` is at the PR #56 merge (`b414766`), and **`release/v4.7.0`
> exists and is pushed** off that commit. Work the remaining boxes below in order.
>
> - [x] **13.1 — merge PR #56 into `main`**, then branch `release/v4.7.0` off it. **✅ DONE 2026-08-05**
>       (merge `b414766`, CI was 7/7 on `b88ca51`; branch pushed and tracking).
> - [ ] **13.2 — F20 + F21 together** (one root, two changes).
>   - [x] **F20 — DONE** _(2026-08-05 · `82f49cd`, `ee1c373`)_, both halves; see the resume point above.
>   - [x] **F21 — DONE** _(2026-08-05 · `25057b0`)_, both halves; see the resume point above.
> - [x] **13.3 — F22 — DONE** _(2026-08-05 · `c229cab`)_, option A; see the resume point above.
> - [ ] **13.4 — the release tail** (§10 marketing re-read, mutation on what changed, version vector,
>       note + PR body, tag) — same shape as v4.5.0 and v4.6.0, whose tails are Steps 11 and 12.
>   - [ ] **Bookkeeping the cut created, do it on the release branch, not on `main`:** three code
>         comments still send a reader to v4.7.0 for work that now lands in **v4.8.0** —
>         `scripts/lib/engine-version.mjs:19` and `scripts/lib/engine-version.test.mjs:73` (the
>         `unknown` version state, F3) and `scripts/lib/health-probe.test.mjs:219`. A comment naming
>         the wrong release is the same class of defect this plan keeps fixing: a marker that reads as
>         a promise. Repoint them; do not touch the assertions themselves.

## The one pattern behind most of it (the reframe)

Nearly every serious finding is the same shape: **two semantically opposite things are rendered
identically**, so the user cannot tell them apart.

| Act / state A | Act / state B | Rendered as |
| --- | --- | --- |
| personalizing an engine skill | fixing an engine defect | "customized" → frozen forever (F5) |
| repairing a dangling link | asserting a person exists | create a `people/` note (F6) |
| a note waiting to be indexed | a note that failed permanently | `1 pending` (F11/F12) |
| an up-to-date indexed note | a note answering from stale content | "indexed", counter all green (F15) |
| no engine update available | target version simply unknown | a generic `/update-engine` offer (F3) |
| my search returned nothing | the thing does not exist | "nobody answered / nobody decided" (F18) |
| a thread parent (a question asked) | that thread's resolution | one quoted message (F18) |
| observed, quoted, sourced | inferred by me | the same bullet, the same bolding (F18) |
| yesterday's caveat (a debt) | today's established fact | prose in a prior briefing (F18) |

Treating that conflation as **the** root cause is what turns 16 scattered fixes into a handful of
coherent ones. This framing is the plan's main proposal and is itself open to challenge.

## Tracking

### P0 — broken promises (the product advertises it, and it does not hold)

- [ ] **F14 — the documented multi-machine path does not work.** `SETUP.md` §7 tells a second-machine
      user to `git clone`, `npm install`, re-enter the key, and says *"No need for the installer here"*.
  - [ ] Evidence: `.gitignore` excludes `.mcp.json` and `.claude/settings.json`, so a fresh clone has
        **neither** → no `vault-rag` MCP server, no hooks (no auto-commit, no auto-push, no
        SessionStart), no permission allowlist.
  - [ ] Evidence: nothing regenerates them. `scripts/lib/reconcile-brain.mjs:155` guards the `.mcp.json`
        reconcile with `existsSync(templatePath) && existsSync(brainMcpPath)`; `:191` does the same for
        `settings.json`. The reconciler is **additive on existing files only**.
  - [ ] Evidence: chicken-and-egg — the SessionStart hook that would invoke the reconciler is declared
        in the very `settings.json` that is missing.
  - [ ] Evidence: `SETUP.md` §8 troubleshooting says "MCP server doesn't appear → re-run
        `node installer.mjs`", but the installer **refuses an existing folder**. The documented escape
        hatch cannot work.
  - [x] **Code read 2026-08-02, three things the finding did not know:**
    - [x] **The material is already in the clone** (the good news, and it shrinks the fix). The
          installer copies the templates into the brain (`installer.mjs:518-520` reads them from
          `TARGET`), and `.gitignore` ignores only the *generated* `.mcp.json` / `.claude/settings.json`
          — **not** the `.template` siblings. So a second machine has both templates locally. A
          rehydrate needs **no network, no installer, no source repo**: only the local substitution.
    - [x] **Only two placeholders carry the machine**: `{{PROJECT_ROOT}}` (the `cwd` of both MCP
          servers) and `{{NODE}}` (`nodeHookCommand`, `rag-launcher.mjs:220`, the absolute path to
          `scripts/run-node.sh`). The launchers themselves are **path-free** (`rag/launch.sh` is
          invoked with a relative arg, `applyRagLauncher:230`) and travel fine. The blast radius is
          two files and two substitutions.
    - [x] **`SETUP.md` §7 also under-installs.** It says `cd rag && npm install`, but the installer
          installs **two** dependency trees (`installer.mjs:773` and `:789` — `local-mirror/` has its
          own `package.json`, 7 deps). So even after regenerating `.mcp.json`, the `local-mirror`
          server would fail to start on the second machine. Same PR.
  - [x] **Decided (2026-08-02): a rehydrate command.** It replays the installer's generation step
        **locally**: the two files from the templates already in the clone, the launchers, and **both**
        `npm install`. Offline, idempotent, no source repo. Rejected: create-if-absent in the
        reconciler (it does not stand alone — the reconciler is fired by the SessionStart hook declared
        in the very `settings.json` that is missing, so it would need this command underneath anyway);
        and removing the absolute paths (better in principle, but it depends on what Claude Code
        actually resolves and it touches every deployed brain — kept as a possible later cleanup).
  - [x] **It must SHARE the substitution code with `installer.mjs`, not re-implement it.**
        _(2026-08-02 · `ff76609` for the placeholder table, `d0147bc` for `applyLaunchers`)_ Two
        generators that substitute differently produce two different brains — the same defect shape as
        F16 (a checker that parses differently from the engine measures a fiction). Extract
        `gen()` + the `replacements` table (`installer.mjs:484-520`) into a lib both call.
  - [x] **Decided (2026-08-02): discovery = the doc AND the constitution.** `SETUP.md` §7 + the §8 row
        carry the command for a human; **and** the constitution — which travels through git — teaches
        Claude to offer the rehydrate when both files are missing, so the second machine self-repairs
        conversationally. Known limit, to state in the PR: the constitution is an engine-managed file,
        so this half only reaches brains whose constitution was not customized (F5's freeze).
    - [x] **The constitution half is written** _(2026-08-02 · `ce4c7bf`)_ — EN + FR thin templates:
          the second-machine shape (no `.mcp.json` / `.claude/settings.json`, no `vault-rag`, no
          auto-commit), the command, and the closing "open a NEW conversation rooted here". It also
          says **never** to suggest re-running `installer.mjs` (it refuses an existing folder).
    - [x] **The command is CARRIED** _(2026-08-02 · `ce4c7bf`)_ — `scripts/rehydrate.mjs` added to
          `replace`, driven by a new integrity guard over **the constitution as the third door** onto
          an engine script (the two existing ones: a wired hook, a skill's instructions). The guard
          found a second, older gap: **`scripts/clear-example-notes.mjs`** is named by
          `CLAUDE.engine.md` and was carried by no regime, so its **v3.4.1 Windows fix reached nobody
          who installed before v3.4.1**. Now in `replace` too.
    - [ ] Left alone on purpose: `engineVersion.scripts` (still `1.9.0`). The apply plan is
          glob-driven, not version-gated, so delivery does not need it; the bump belongs to the
          v4.5.0 release step.
  - [x] The engine must also **fail by naming the command** instead of failing into the void.
        _(2026-08-02 · `9175d53`)_ Worse than a void, it turned out: an absent `.mcp.json` registers
        no server, so `session-self-heal.mjs` read it as a convergence gap and announced **"an engine
        update finishing in the background"** at every session start, spawning a reconcile that
        cannot create a missing file. A second machine heard that false promise forever. It now
        checks wiring FIRST (`unwiredFiles`, a pure predicate over the rehydration plan) and names
        the command; a wired brain with a real gap keeps its background heal.
    - [x] **Closed** _(2026-08-02 · `e236b35`)_ — `buildSelfHealHookOutput` used to wrap every
          emitted line in `[engine self-heal — RESTART REQUIRED] … an update finishing in the
          background`, which contradicted the rehydrate line it carried. It now takes
          `needsRehydrate` and emits a **`SETUP NEEDED`** framing that names the command instead
          (no "restart", no "update" — a red test asserts their absence), with the **same ≤260-char
          volume budget on both framings**. Wired at the call site from `sessionSelfHeal`'s own
          `needsRehydrate`. **F14 is now complete.**
  - [x] **The docs stopped lying** _(2026-08-02 · `262b571`)_ — `SETUP.md` §7 rewritten around the
        command (+ the key, the NEW rooted conversation, and the expected first-session indexing),
        the two §8 remedies pointing at `installer.mjs` repointed, and two doc guards to keep it so.
  - [ ] **Second field run, 2026-08-02 evening — the owner rehydrated `mind-palace` BY HAND on a
        second laptop.** It worked (436/436 indexed, repo up to date), and its SessionStart banner
        proved the scope above is too narrow. Screenshot evidence, verified against the code:
    - [x] **The rehydrate must also reseed the health canary note.** _(2026-08-02 · `7f10185`)_ `vault/engine-health/` is
          gitignored and the note is seeded **only** by `installer.mjs:347` (`seedHealthNote`), so a
          rehydrated brain never has it — permanently. The banner reports it and prescribes
          "ask me to reindex your vault", which **cannot** recreate a note. Add it to the command's
          job, next to the two files, the launchers and the two `npm install`.
    - [ ] **The banner contradicted itself, by design.** It printed `index empty → ask me to reindex`
          and, three lines below, `RAG up to date — 436/436 files indexed`. `session-health.mjs`
          reports the **last known** verdict (an instant file read) and re-probes detached for the
          *next* session, so a stale verdict is rendered with the same authority as the live status
          line it contradicts, and nothing reconciles them. **This is the plan's own reframe, on a
          surface it did not list**: "measured just now" and "measured some time ago" render
          identically. Candidate: date the cached verdict, or suppress a cached check the live line
          already contradicts.
    - [ ] **An `unknown` check is rendered as a problem.** `health-check.ts:147` classes the missing
          canary as `unknown`, not `broken` — but `health-probe.mjs` `bulletsFor()` lists every
          non-`ok` check as a bullet under "⚠️ Last health-check found a problem", as soon as **one**
          sibling check is broken. "We could not tell" is displayed as "it is broken".
    - [ ] **Measured the next morning — the stale verdict is a ONE-SESSION LAG, not a frozen one.**
          `engine-health.json` was present and rewritten (870 B, same day 22:35), and the next
          session's banner carried **no health alarm at all** (437/437 indexed, repo up to date). So
          the detached re-probe does run: the contradiction was a display lag. Severity downgraded,
          the fix stays in v4.7.0.
    - [ ] **But the silence hides worse, and this is the finding that matters.** With the index
          non-empty, `index` goes `ok` and the missing canary stays `unknown` → the module is no
          longer `broken` → `formatHealthBanner` returns `null`. On that rehydrated brain the health
          check therefore **can never again prove the index answers**, and says nothing about it:
          **"verified healthy" and "could not verify" render as the same silence.** The reframe
          again, and the strongest argument yet for reseeding the canary in v4.5.0 — without it, the
          brain's own health check is decorative, permanently and invisibly.
    - [ ] **Routing (my call, open to challenge):** the canary reseed ships in **v4.5.0** (it is part
          of rehydrating, and without it the multi-machine path still ends on a false alarm); the two
          banner defects ship in **v4.7.0** with the rest of the visibility work, since they affect
          every brain, not just a rehydrated one.
  - [ ] Whatever is chosen, fix `SETUP.md` §7 **and** the §8 troubleshooting row ("re-run
        `node installer.mjs`", which cannot work) in the same PR.
- [x] **F11 / F12 — an indexing failure is displayed as a wait. ✅ COMPLETE** _(2026-08-02)_. A note was written, committed, and
      **absent from the index**, i.e. invisible to search, for as long as it existed.
  - [ ] Evidence (field): `vault/inqom/briefings/2026-08-02.md` — unquoted YAML value containing `": "`
        → `bad indentation of a mapping entry (6:45)`. The status line read `435/436 … 1 pending —
        auto catch-up in the background`, which **asserts a recovery that could never happen**.
  - [ ] Root cause is **layout, not ignorance**: the engine *did* count it, on a different line
        (`Last catch-up … 1 error(s)`), away from the counter the eye is drawn to.
  - [x] **Fix A DONE** _(2026-08-02 · `68ea034`)_ — `1 failed` ≠ `1 pending`, file + cause on the
        counter's own line. The banner's RAG line left `session-status.mjs` for a pure, tested
        `ragStatusLine({ docs, scanned, lastRun })` (`scripts/lib/rag-status.mjs`) which now reads the
        engine's `last-run.json`. Decisions worth not re-deriving: the rest of the shortfall still
        reads as `pending` (a real wait must stay a wait); **no shortfall ⇒ no alarm**, so a repaired
        note silences its stale error (the run state is only rewritten by the next run, and a checker
        is judged on its false positives — F16); two failures named, the rest counted; and the
        run-state path is pinned to the engine's own constants by a guard test.
  - [x] **Fix B DONE** — **validate frontmatter at write time** with the engine's own parser and refuse
        to write. The writer emitted YAML its own indexer rejects; the note was born broken and nothing
        said so. Decision layer + wiring both shipped (below).
    - [x] **The decision layer is built and tested** _(2026-08-02 · `524c580`)_ —
          `scripts/lib/vault-write-guard.mjs`: `guardDecision({ toolName, toolInput, brainDir, parse,
          readFile })` → `{ allow }` / `{ allow: false, reason }`. It runs the **engine's own parse
          path** (gray-matter + js-yaml 4 `load`, resolved from `rag/node_modules`, tests exercise the
          real parser on the real field payload — F16), **composes the note an Edit WOULD produce**
          before judging (else the second-`updated:` gesture walks past), and upgrades js-yaml's
          `duplicated mapping key (5:1)` into the key + both lines. That scan now has **three** callers
          across two packages → their agreement is a test, no longer a comment. **Fail-open**
          everywhere else (no parser, unreadable file, missing anchor, anything outside `vault/*.md`).
    - [x] **WIRED** _(2026-08-02 · `a52b813`)_ — `scripts/vault-write-guard.mjs` (the entry script:
          hook JSON on stdin → `guardDecision` → `hookSpecificOutput.permissionDecision`), a
          `PreToolUse` / `Write|Edit` entry in `.claude/settings.json.template`, the script in the
          manifest's `replace`, and `reconcileHooks` proven to CREATE the event on a brain that has no
          `PreToolUse` key at all (every brain installed before v4.5.0) — pinned against the real
          template, so deleting the entry fails that test. Verified end to end by hand on the field
          payload: denied with the parser's own cause, the quoted note allowed, anything outside
          `vault/` untouched. The entry script always exits 0 and **fails open silently** on unusable
          stdin: a guard that throws its own stack at the owner once is a guard they disable.
    - [x] Found while wiring, worth keeping: the manifest guard that was supposed to cover "a wired
          hook script an upgrade never delivers" only ever looked at **`SessionStart`**, so this
          `PreToolUse` entry would have sailed past it. Now swept across **every** event, in two
          claims: in *some* regime (else it reaches nobody), and specifically in `replace` — with
          `auto-commit` / `auto-push` named as the deliberate `merge` exceptions (ADR 0012: the owner
          is invited to tune their commit/push policy), so a third user-editable hook has to be a
          choice rather than a copy-paste. Row added to ADR 0009's mechanism table.
    - [x] Decided while building, do not re-open: the guard **denies** rather than warns (it only
          ever fires on bytes the engine's parser has actually rejected, so the note would be
          invisible anyway), and it is scoped to `vault/**/*.md` only (a guard that creeps beyond the
          vault is a guard that gets disabled).
- [x] **F15 — a note can keep ANSWERING from stale content, and nothing watches it.** ✅ DONE
      _(2026-08-03 · `b5494d2` → `c5fae64`)_ — both surfaces ship, and both were proven on a real
      vault (a note damaged the way the field note was: command exit 1 naming it, probe `broken`;
      the same note merely edited: command exit 1, probe silent).
  - [x] Evidence: `rag/src/lib/frontmatter-parser.ts` — *"until one of them is removed, this note
        keeps answering from the content it was last indexed with"*; asserted in
        `index-manager.test.ts:373`. A sibling scan already exists at `scripts/lib/note-refresh.mjs`
        (`duplicateFrontmatterKeys`). That sentence now has ONE owner, `STALE_ANSWER_CLAUSE`, shared
        by the parser and the crosscheck — they were printing it twice in a row otherwise.
  - [x] Why it is the worst mode: F11 fails **silently** (note absent); this one fails **plausibly**
        (note answers, with old content) while the counter reads all-green.
  - [x] Promoted into an engine command, `node scripts/verify-index.mjs` (exit 0 agree / 1 disagree,
        naming each note / 2 could not run). The brain-side `tools/index-vs-disk-crosscheck.mjs`
        (`mind-palace`, `1305ef1`) was the reference; the promoted version keeps its five modes.
  - [x] **TDD on promotion**: 16 tests on the pure diff (`rag/src/lib/index-crosscheck.ts`), 4 on the
        scan seam, 1 on `listIndexedDocsIn`, 5 on the health check, 4 on the brain-side door, 1 on the
        banner gesture. Suites green: 1104 scripts (1 skipped Windows-only), 480 rag.
  - [x] **Scope DECIDED with the owner (2026-08-03), do not re-open: the command AND the session
        probe.** A command nobody runs leaves *"nothing watches it"* exactly as true as before, so the
        light per-session probe (file/DB reads only, ADR 0030 §6 — which is precisely what a crosscheck
        needs) reports the drift on its own. Rejected: auto-repair at session start (it would add an
        automatic write where there is none today). It landed in three parts:
    - [x] **The pure diff core**, TDD, in `rag/src/lib/index-crosscheck.ts` — the five modes as one
          pure function over {what disk holds} × {what the index holds}.
    - [x] **The glue reuses the ENGINE's own scan/hash/parse** (`scanVault`, `sha256`,
          `parseDocument`) rather than mirroring them. That makes F16's lesson structural instead of a
          comment: the brain-side reference already drifted (it excluded neither `_template.md` nor
          `.obsidian`, both of which `document-scanner.ts` skips, so it would have cried wolf on them).
    - [x] **Two surfaces**: the command (in `replace`, named in both constitutions — the F14 guard
          demanded it) and a fourth `notes` check on the health contract, whose banner gesture is
          "ask me to repair that note" (a restart fixes nothing here).
  - [x] **Decided while building, do not re-open** — the probe is loud ONLY about damage no reindex
        will ever clear (frontmatter the parser refuses, a 0-chunk row an incremental run skips
        forever). Ordinary drift — a note edited in Obsidian, a pull from another machine — is
        transient and stays silent, or the banner would fire at nearly every session start and be
        muted within a week. ADR 0030 §6 had already required exactly this ("never a red broken
        banner" on a freshness signal); it now says how. The command still shows everything.
  - [x] **Also decided while building**: an unmeasurable crosscheck emits **no check at all**, never
        `unknown` — `vault-rag` is a MANDATORY module, and `gateBlockers` fails the installer
        post-flight and `verify-rag` on a mandatory `unknown`. A comparison we could not make must
        never fail an install.

- [x] **F17 — opening a note: three surfaces, three different answers, and a promise nobody keeps.**
      ✅ **DONE** _(2026-08-03 · `618ba54` → `6ee4aee`)_ — one pure rule, three surfaces pinned to it,
      the citation affordance repaired, ADR 0027 amended. Field-verified on a real registered vault.
      Suites green: 1156 scripts (1 skipped Windows-only), 480 rag.
      Asked by the owner (2026-08-02 evening, *"ideally with the next release"*): a note **inside
      `vault/`** should open in **Obsidian when it is available**, and any Markdown **outside the
      vault** in the **default editor**. Verified against the code before writing this down — the
      request is not a preference, it repairs a contradiction that is already on disk.
  - [ ] Evidence — the three surfaces disagree **today**:
    - [ ] `CLAUDE.engine.md:123-132` (and `templates/fr/CLAUDE.engine.md:133`): open through the OS
          opener, and *"Obsidian … is never the mechanism for opening a single note"*.
    - [ ] `engine-skills/open-note/SKILL.md:21,42,73`: **always** `open -a "Obsidian" <path>`. Also
          **macOS-only**, which breaks the cross-platform rule (ADR 0015, `DEVELOPING.md:161`) — on
          Windows and Linux that skill's one deterministic step does not run at all.
    - [ ] `scripts/lib/obsidian-health.mjs:44,50` already **promises the user**, twice, that
          registering the vault makes *"🧠 citation links open straight in it"*. Nothing in the engine
          does that: ADR 0027 routes every citation through the OS opener. The nudge sells a behaviour
          the product does not have.
  - [ ] **This is the plan's own reframe**: "a note that belongs to the vault" and "any Markdown file
        on the machine" are two different things rendered identically (one opener for both) — while the
        skill and the constitution render *the same* act two opposite ways.
  - [ ] **The trigger is already written, pure and tested**: `obsidianHealth(vaultPath).status === "ok"`
        means *installed **and** this vault registered*. That is the right condition, not "installed":
        `open -a Obsidian` on a file of an unregistered vault lands on the vault-picker / welcome screen
        (the first-launch caveat, ADR 0029 §Consequences). Anything else → OS opener, unchanged.
  - [ ] **Decided while reading the code** (challenge these before coding, not after):
    - [ ] **🧠 citations follow the same rule.** Otherwise the two gestures that open the very same
          vault note — clicking a citation, and asking *"open my note about X"* — would land in two
          different apps. It also finally makes `obsidian-health`'s existing promise true.
    - [ ] **Mechanism must be cross-platform**, so it cannot be `open -a`. Obsidian's URL scheme
          (`obsidian://open?path=<url-encoded absolute path>`) is one call on all three OSes, and we
          only ever reach it when the vault IS registered. To verify on a real machine before shipping.
    - [x] **Deterministic, not prose.** A pure `buildOpenNoteCommand({ platform, absPath, insideVault,
          obsidianOk })` in `scripts/lib/`, TDD, next to `open-env.mjs` — the three doc surfaces then
          describe one function instead of each inventing its own rule. **DONE** _(2026-08-03 ·
          `618ba54`)_ — `scripts/lib/open-note.mjs` + 6 tests, each term of `insideVault && obsidianOk`
          triangulated alone (the mutant dropping `obsidianOk` was applied by hand and dies), unknown
          platform → `null` (show the note inline rather than guess a command). Suite green: 1152 pass,
          1 skipped Windows-only.
  - [ ] **Re-read of the code before coding, 2026-08-03 — four decisions checked, two refined:**
    - [x] Decisions 1, 3 and 4 hold as written; nothing found that contradicts them. The one caveat on
          the trigger: `obsidianHealth` matches the registered vault by **exact string equality**
          (`obsidian-health.mjs:24`, `v.path === vaultPath`), so a symlinked / `/private`-prefixed path
          reads as *not registered* → we fall back to the OS opener. Safe degradation (today's
          behaviour), not a blocker.
    - [x] **Refinement of decision 2: the URI does not replace the opener, it is what we hand it.**
          There is no cross-platform way to *invoke* `obsidian://…` other than the OS opener itself
          (`open "obsidian://…"` / `start "" "…"` / `xdg-open "…"`). Good news, and it decides the next
          point: the command stays inside the **existing** allowlist (`Bash(open:*)`,
          `Bash(xdg-open:*)`, `Bash(start:*)`), so it costs a deployed brain nothing.
    - [x] **NEW, decided here: NO entry script.** The tempting shape — `node scripts/open-note.mjs
          <path>` — would need a new allowlist entry, and the reconciler wires **hook entries only**,
          never `permissions.allow` (`reconcile-brain.mjs:166-230`). So every open on an already
          deployed brain would raise a permission prompt: a papercut on the most frequent gesture there
          is. `buildOpenNoteCommand` therefore stays a **pure function nobody executes**, and its
          authority over the three doc surfaces comes from **doc guards** pinning them to it (the
          repo's existing pattern, as with the F14 doc guards), not from being on the call path.
    - [x] **ADR 0038 must own a scoped REVERSAL, and say so.** ADR 0027 already considered
          `obsidian://open?path=…` and **rejected** it ("ties the local-copy open to one app… a
          real-file link is the portable, no-lock-in choice"). F17 overrides that — but only for a note
          **inside `vault/`**, and only when that vault **is registered**. The rendered 🧠 link itself
          does **not** change (it stays `file://`; Desktop drops every non-`http(s)` scheme anyway, so
          emitting `obsidian://` in the markup would buy a dead click). What changes is solely the
          command Claude runs when asked to open. State that split in 0038, or the next reader will
          take it for a plain contradiction of 0027.
  - [x] **✅ FIELD-VERIFIED 2026-08-03 — the URI resolves, and it costs a confirmation dialog.** Run
        for real on the owner's `mind-palace` (a registered vault), URI built by the function itself:
        `open "obsidian://open?path=%2FUsers%2F…%2Fvault%2Fengine-health%2Fhealth-check.md"`.
    - [x] **The resolution half works.** Obsidian named back, correctly, `path
          /Users/tpierrain/mind-palace/vault/engine-health/health-check.md` **and** `file
          /engine-health/health-check.md` — so it found the right vault AND the right note from an
          absolute path alone. The vault-scoped fallback (`?vault=&file=`) is **not** needed, and
          `buildOpenNoteCommand`'s signature stands.
    - [ ] **But Obsidian gates every external link behind a trust dialog** (screenshot): *"Exécuter
          l'action depuis un lien externe ? L'action « open » est sur le point d'être exécutée."*,
          with **Annuler / Continuer** and a **"Ne plus demander pour « open »"** checkbox. So F17's
          promise would land on a modal at **every** open until the owner ticks that box once. This is
          a real cost the plan had not priced, and it is **specific to the `obsidian://` scheme**.
    - [x] **❌ The dialog-free alternative is DEAD, and it takes a shipped defect down with it.**
          `open -a "Obsidian" <path>` was run for real (screenshot) on
          `vault/topics/second-brain-retrieval-reliability.md` with Obsidian **not running**: it
          launched the app, restored the previous session (two `health-check` tabs from the URI runs)
          and **ignored the file argument entirely** — the targeted note was never opened, only
          visible in the sidebar. So the form that avoids the trust dialog **cannot aim at a note**,
          which is the whole point of the gesture.
      - [x] **Therefore the hybrid (option b) is off the table** and the URI is the only mechanism
            that works. The trust dialog is a **cost of the feature**, not a choice between two roads:
            document the one-time *"Ne plus demander"* tick, next to the existing one-time "Always
            allow" step at install.
      - [x] **And this is a NEW defect, bigger than the doc contradiction F17 was written for:**
            `engine-skills/open-note/SKILL.md` hard-codes exactly this `open -a "Obsidian" <path>` as
            its "only deterministic part" (lines 21, 42, 73). It does not do what it promises **on
            macOS either** — the skill's one guaranteed step opens the app on whatever was last open.
            So the three surfaces did not merely disagree: the one that was most specific was also
            **wrong**. Say so in ADR 0038.
      - [x] **Measured both ways: `open -a` NEVER targets the file — cold OR warm.** Three runs,
            two screenshots: Obsidian comes up on the restored session every time, the requested note
            only ever appears in the sidebar. So ADR 0038 words the shipped defect as **"never"**, not
            "only on a cold start". Cross-confirmed the same evening by the owner's own brain, which
            reported using `obsidian://open?path=` (never `open -a`) whenever he asks for Obsidian.
      - [x] **`?path=` over `?vault=&file=`, and the reason is specific to Kenjaku.** Obsidian names a
            vault after its **root folder**, and every brain this launcher generates roots its vault at
            `<brain>/vault` — so on a machine with two brains, **both vaults are literally named
            `vault`** (the owner's `obsidian.json` already lists `inqom-brain/vault` AND
            `mind-palace/vault`). `?vault=` would therefore be ambiguous **by construction** for anyone
            with a second brain, which is exactly the multi-brain case F14 just made easy. `?path=`
            has no such collision.
    - [x] **✅ DECIDED (2026-08-03, forced by the measurements, not a preference): `obsidian://open?path=`
          everywhere, and the trust dialog is documented as a one-time step.** There is no dialog-free
          road: the only alternative cannot aim at a note. So the tick goes in the docs next to the
          existing "Always allow" one-time step, framed the same calm way (SETUP.md, and the Obsidian
          nudge that already promises this behaviour).
  - [x] **The citation affordance stopped predicting the wrong app** _(2026-08-03 · `60f875f`)_.
        `rag/src/lib/citation-renderer.ts` printed *"I'll open it in your Markdown editor (Typora,
        Obsidian, …)"*, and its test **forbade** naming Obsidian — the very assumption F17 overturns.
        Every `search_vault` citation IS a vault note, so it now names both routes and which applies.
        The 🧠 link itself is untouched and stays `file://`.
  - [x] **All three surfaces changed, and pinned** _(2026-08-03 · `23ed58d`)_ — `CLAUDE.engine.md` +
        `templates/fr/CLAUDE.engine.md` (§"Opening / viewing / editing a note" rewritten as two acts),
        `engine-skills/open-note/SKILL.md` (stops inventing an opener, defers to the constitution,
        `1.0.0` → `1.1.0`), `SETUP.md` (the reading chapter, plus the one-time external-link prompt
        framed like "Always allow"). Three guards in `scripts/lib/open-note-doc.test.mjs`: the URI
        prefix is **read off the function**, no surface may prescribe `open -a "Obsidian"` unless the
        same line forbids it, and `SETUP.md` must keep the prompt documented.
  - [x] **No ADR 0038 — 0027 was amended in place instead** _(2026-08-03 · `6ee4aee`)_, and this
        overrides the plan's earlier note. `CONVENTIONS.md` §6bis: an **evolving** decision amends its
        own ADR, a new number is for a **genuinely new topic** — and "how a local note opens" is
        precisely ADR 0027's topic. 0027 now carries the destination rule, the `?path=`-over-`?vault=`
        reason, the `open -a` rejection on measurement, and (§6ter, written timelessly) its earlier
        `obsidian://` rejection restated as what it always was: a rejection about the **rendered link**,
        which still stands. 0029 keeps its own decision and stops claiming a single note is never
        Obsidian's to open. Every `ADR 0038` reference in code and docs was repointed to 0027.
  - [x] **`obsidian-health.mjs`'s promise came true by itself.** It has been telling users that
        registering the vault makes *"🧠 citation links open straight in it"*; that was false under the
        old rule and is now **exactly** what happens. No change needed — the defect was the behaviour,
        not the sentence.
  - [ ] **Reach, stated honestly** (F5): `engine-skills/**` is in `replace` and a staged skill the owner
        never edited **is** refreshed on `update-engine` (base = the brain's own staging copy,
        `reconcile-brain.test.mjs:1189`). So this reaches an existing brain — **unless** that brain
        customized `open-note` or `CLAUDE.md`, which is exactly the freeze trap (P2, v4.6.0).

### P1 — the vault poisons itself (identity)

- [ ] **F7 — `sync-sources` writes into the vault without ever reading it.** Zero `search_vault`, zero
      `people/` read before writing. Produced an **invented surname** (source said "Jérémy (front
      Candor)", a bare first name; the note asserted "Jérémy Hinard") and republished a two-month-old
      fact as a scoop.
  - [ ] Fix: before ANY write, resolve each cited person against `vault/*/people/` + `domains/
        organisation`; a first name with no surname stays a bare first name, **never** a `[[people/…]]`;
        a `search_vault` before calling any fact "new".
  - [ ] ⚠️ This fix must land **here**, not brain-side: patching `sync-sources` in a brain freezes it
        (see F5).
  - [ ] **It recurred the same evening, on the OTHER laptop** _(2026-08-02, `prepare-1-1` for Michael,
        screenshot)_: "Hossam qui deviendrait CTO Visma France (non confirmé)" — while the vault's own
        `people/hossam-laanait.md` says *"CTO Visma France (confirmé 04/06)"* and that morning's
        briefing had already ruled it *"un rappel, pas une annonce"*. Two things this proves, and they
        raise F7's priority: (a) the defect is **in the engine skill, not in a machine or a note** —
        the vault carried the right answer to both laptops and the skill read neither; (b) **correcting
        a note does not stop it**, so it will fire at every briefing / 1-1 prep until F7 ships. It also
        travels **downstream of `sync-sources`**: `prepare-1-1` consumes that fan-out, so the control
        `search_vault` has to sit where the facts are produced, not in each consumer.
- [x] **F18 — the brain reports SILENCE it never verified, and that is its most dangerous output.**
      ✅ **DONE** _(2026-08-03 · `2b19eee`)_ — all six pieces, four surfaces, 42 guard assertions.
      New evidence, **2026-08-03**: a written postmortem produced by the owner's own brain after
      **two consecutive failing sessions** on `mind-palace` — a returning-from-leave briefing
      (2026-08-02) and a targeted four-theme scan (2026-08-03). Source (pointer, not copied):
      `~/mind-palace/vault/topics/second-brain-retrieval-reliability.md`.
  - [x] **Not hallucination.** Every fact was really retrieved. All seven defects sit in the step
        between *retrieval* and *assertion*. More retrieval, a bigger window and "be more careful"
        are explicitly **not** the fix — the last one is what failed twice in two days.
  - [x] Field evidence, the class that costs a relationship: *"no reply since Thursday"* on a thread
        that had **12 replies the same day** (bug filed, analysis posted); *"nobody has decided"* on a
        customer reopening **decided and scheduled the next day**, owner + backup named; *"waiting for
        an arbitration since 22/07"* while the product lead had **answered field by field the day
        after**. The owner was one click from posting the first two to his EM channel.
  - [x] **The aggravating one**: for the third, the refutation was **inside the same tool response**
        (a later message from the author opening *"thanks for your very complete answer"*). The brain
        held the contradiction and asserted the opposite.
  - [x] Root causes, ranked: (1) **absence of evidence read as evidence of absence** — a search index
        is relevance-ranked, never state-complete, so "no result" is a property of the query, not of
        the world; (2) **thread-blindness** — the unit of meaning is the thread, the unit every tool
        returns is the message; (3) **result set mined, not reconciled**; (4) **urgency inferred from
        tone, not from state**; (5) **the brain's own prior output inherited as fact**; (6) **no
        distinction between observation and inference** in the rendering; (7) **verification effort
        not proportional to the cost of being wrong**.
  - [x] **Why it belongs in P1, next to F7.** Same producer (`sync-sources` and its consumers), same
        self-poisoning loop: a caveat written yesterday becomes a premise today, gets indexed, and is
        cited by the next session. *"A generic agent's mistake dies with the context window; a second
        brain's mistake gets a permalink."* And the owner **cannot check the work** — he delegated
        precisely the reading he did not do.
  - [x] **Verified against this repo, 2026-08-03 (three facts that decide where the fix goes):**
    - [x] **The producer says nothing about any of this.** Zero occurrence of `thread` / `replies` in
          `.claude/skills/sync-sources/SKILL.md` **or** `.claude/skills/prepare-1-1/SKILL.md`. The
          chat-extractor prompt scans "the last 24h" message by message; nothing tells it a root
          message is a question, never an answer.
    - [x] **The templates actively invite the accusation.** The briefing template's
          `## 🟡 What's expected of you` renders `Pending: [[people/x]]: [expectation]` — a
          behavioural claim about a named colleague, in the same voice and bolding as an observed
          quote. And its `## Caveats` section (the repo's **only** occurrence of the word) is exactly
          the prose that the next session inherits as fact.
    - [x] **Reach — this is the deciding fact.** On the owner's `mind-palace`,
          `.claude/skills/sync-sources/SKILL.md` and `prepare-1-1/SKILL.md` are **UNTOUCHED**
          (sha256 identical to the base recorded in the brain's own `engine-manifest.json`), and both
          are in the **`merge`** regime → **a fix posted there reaches his brain** on the next
          `/update-engine`. Whereas `CLAUDE.engine.md` is **in NO regime at all** (propagation
          deferred to Gate 3 until it is locale-aware, locked by
          `engine-apply-plan.test.mjs:163`) → a rule added **only** to the constitution reaches
          **new installs only, never a deployed brain**. So the constitution half is worth writing,
          but it must **not** be the carrier.
  - [x] **✅ SCOPE DECIDED (2026-08-03, by the owner): ALL SIX PIECES SHIP IN v4.5.0.** The staged
        split below was proposed and **declined** — the owner took the whole thing rather than the
        cheap half. So the two groupings below are now **build order inside v4.5.0**, not two
        releases. Do not re-open. Cost accepted: v4.5.0 was five findings, it is six, one structural.
    - [x] **First — the two prose rules** that kill the highest-damage class at zero structural cost,
          in `sync-sources` (+ `prepare-1-1`) **and** both constitutions.
      - [x] **Negative claims** (CR §4.1 / §4.4): default phrasing flips from *"there is no X"* to
            *"I did not find X"*; any *"no reply / nobody decided / not started / X has not done Y"*
            must **name the check that established it, or be reworded as an open question**; before
            writing, one reconciliation pass — *does anything in my own retrieved output contradict
            what I am about to assert?*
      - [x] **Threads** (CR §4.2): a chat message cited as **current state** must have its thread
            resolved where the source exposes one; `replies > 0` is a **hard block** on any
            "unanswered / unresolved / pending" wording.
      - [x] Why these two go first: the exposure is **live and continuous** — every briefing and
            every 1-1 prep can produce an accusation about a named colleague until it ships — and the
            fix is prose in a file already propagated and already untouched on the affected brain.
    - [x] **Then the structural half, same release:**
      - [x] **CR §4.5 — mark confidence in the artifact.** Generalise Session A's identity table to
            every behavioural or negative claim, and mark specifically **what is safe to paste into a
            message to another human** (the real danger threshold, not the same as "probably true").
            **Sibling, not duplicate, of v4.6.0's "reliability/confidence block"**: this one marks a
            *produced artifact* (a briefing, a 1-1 prep), that one marks a *people note born from a
            probable resolution*. They must share one vocabulary — settle it here, since this ships
            first, and have v4.6.0 reuse it rather than invent a second scale.
      - [x] **CR §4.6 (prior notes are sources, not facts)**: a prior briefing's caveated items must
            be **re-verified before propagation**; make caveats **machine-visible** (a field, not
            prose) so the next session can find them instead of absorbing them.
      - [x] **CR §4.3 (route to the connector that exposes state)**: discovery may use the cheap wide
            connector, but **anything cited must be re-resolved** through the one returning reply
            counts and permalinks. Its concrete instance is its own small finding, below.
  - [x] **A recorded capability-absence must expire (CR §4.3, worth generalising).** The vault had
        written down, as a permanent limitation, that *"the Slack connector does not expose
        permalinks"*, and had propagated that caveat into several notes. **It was false** — a wrong
        tool choice, not a platform constraint; the native connector returned permalinks on the first
        call. **The brain had written down a false constraint and was obeying it.** Engine
        implication: a capability recorded as absent needs an expiry and a re-test, never inheritance.
        Note this is the **mirror image of F10** (a recorded value frozen at capture time), so the two
        may share one mechanism — check before designing.
- [x] **F6 — repairing a link and asserting a person exists are conflated.** ✅ **DONE**
      _(2026-08-03 · `de2e658`)_ — see Step 12.2 for what shipped and where.
      `people/stephanie-music.md`
      was created 19/07 *"to resolve an incoming link"* from a mis-resolved link; "Stéphanie Music"
      occurred **once in the whole vault: in its own title** (Stéphanie Glad: 382 times).
  - [x] The feedback loop: mis-resolved link → note created to satisfy it → that note becomes the
        vault's truth about who exists → the next resolution resolves **against the fabrication**.
        It survived three weeks and would have corrupted every future resolution.
  - [x] Companion rule to F7: **never create a `people/` note merely to satisfy an incoming link.**
  - [x] **The engine ORDERED it, in two places.** `/lint` said *"Dangling → … or create the missing
        note"* with no carve-out; `/consolidate`, the skill `/lint` explicitly hands one-off mentions
        to, ranks person candidates by **mention count** — so a name F7 invented once and cited three
        times reads as signal rather than as the defect it is. Both are fixed; both point at the
        producer's section rather than carrying their own wording.
  - [x] Measured degradation before repair: banner said 28 dangling links, `/lint` reported **36** after
        one sync session, for **21** existing people notes.
- [x] **Presence is not enough — disambiguation is the precondition** ✅ **DONE** _(2026-08-03 ·
      `c0187a5` → `9b6c64c`)_ — see Step 12.3 for what shipped and where. (design advance found in the
      field, worth adopting upstream). A `people/` note only makes the resolution rule usable if it
      carries an explicit **homonymy block**: the brain had 3 Romain, 3 Marie, 2 Karim, 2 Caroline,
      2 Michael. Without it, notes only move the ambiguity.
- [x] **Conformant ≠ true.** ✅ **DONE** _(2026-08-03 · `e61002f` → `180e4de`)_ — see Step 12.4 for what
      shipped and where. A deterministic builder guarantees *form* (naming convention, green lint), not
      *substance*, so a person card now carries a reliability/confidence block saying what its identity
      rests on, and the builder refuses to write one without it.

### P2 — the freeze trap, and no path back upstream

- [ ] **F5 — `/improve` invites the patch, `/update-engine` punishes it.**
  - [ ] The mechanism itself is sound and is textbook dpkg-conffile: `engine-manifest.json` records a
        sha256 base per merge file; `scripts/lib/engine-skill-refresh.mjs` `refreshVerdict()` refreshes
        iff bytes still match, else `preserve: customized` + drop `.new` beside it (ADR 0026 §8). **Do
        not break it.**
  - [ ] Defect 1 — the cost is contracted **silently, far from where it is paid**: nothing warns at
        patch time that this skill just unsubscribed from engine updates; the owner finds out months
        later as a `.new`. Cheapest high-value fix, and consistent with ADR 0009 (deterministic over
        forgettable rule): a `PreToolUse(Edit|Write)` hook firing when a write targets an engine-owned
        skill dir, stating the trade-off **before** the edit lands.
  - [ ] Defect 2 — **no exit from the freeze**. A 3-way merge is within reach: the base hash is
        recorded and the base content is refetchable from source, so base + owner + engine is
        computable. "Frozen forever" could be "assisted merge". _(Cross-check with the existing
        `engine-managed-file-merge-strategy.md` plan before designing anything.)_
  - [ ] Defect 3 — **no path back upstream**, the deepest one. Tonight the brain produced three
        genuinely reusable things that no other brain will ever get: the deterministic people-note
        builder, the homonymy-block convention, and the disk↔index crosscheck. `/improve` can patch
        locally but cannot say *"this is an engine defect, it belongs upstream"*.
  - [ ] Root cause to model: **personalization** (freezing is correct) vs **defect fix** (freezing is
        absurd) are two different reasons to edit an engine skill. Only the first is modelled today.

### P3 — visibility, safety and ergonomics

- [ ] **F19 — the always-loaded instruction layer only ever grows, and nothing measures whether it
      still works. 🔜 v4.8.0 — deferred by the 2026-08-05 scope call, entry untouched** _(raised by the owner, 2026-08-04: « on n'arrête pas de faire
      grossir la constitution … est-ce qu'on n'est pas devenu un peu obèse, avec un impact sur le bon
      fonctionnement du second brain ? ». Measured the same day: the intuition **holds on the trend**
      and **misses on the mechanism**. The numbers below are measured, not estimated — do not
      re-derive them.)_
  - [ ] **What is actually always in context in a generated brain.** `CLAUDE.md` rendered ~6 KB +
        `CLAUDE.engine.md` **31.3 KB EN / 35.2 KB FR** (pulled in by its `@` import) + **~9.7 KB** of
        skill frontmatter descriptions + the startup banner (already bounded, see below) ≈ **51 KB for
        an FR brain, roughly 15-17k tokens, ~8 % of a 200k window**. SKILL.md **bodies** (up to 26 KB
        for `local-mirror`) load only on invocation, and `filterCopyable` keeps `maintainers/**` out of
        a brain entirely — so `CONVENTIONS.md` (36 KB), this plan (1500+ lines) and the ADRs cost a
        deployed brain **nothing**. **Capacity is NOT the problem**: say so plainly rather than letting
        the worry stand.
  - [ ] **The trend is real, and it is a one-way ratchet.** The engine constitution sat at **23 504
        bytes for eight releases** (v3.6.0 → v4.4.0), then **28 391** (v4.5.0, +21 %), then **31 280**
        (v4.6.0, +10 %) — **+33 % over this trilogy alone**. Every commit that has ever touched the
        file is `+N -0`, with a single exception (`+14 -9`): **it has never shrunk**. And since v4.5.0
        its text is pinned by **32 doc-guard assertions**, so deleting a sentence now goes red. The
        ratchet is ours, built in the last two releases.
  - [ ] **The defect is not the size, it is the missing feedback loop.** Code is judged by mutation
        score; prose is judged by doc guards that assert **presence**. Nothing measures **effect** — a
        guard proves a rule is written, never that the model behaves differently. So a release can only
        add, and can never learn that an older rule stopped earning its place. **37 imperatives**
        (`NEVER`/`ALWAYS`/`MUST`) and **133 rule lines** now compete for attention at every turn.
  - [ ] **The discipline already exists in this repo, applied to the wrong surface** —
        `universe-reminder.test.mjs` bounds the session-start payload at **500 characters**, with a
        failure message reading *"the startup payload grew back to N chars"*. 500 characters are
        watched under a microscope while 35 200 are unwatched.
  - [ ] **Candidate work, in this order. Scope NOT decided with the owner yet** — they asked for these
        measurements to be filed as a v4.7.0 candidate (2026-08-04), which is a filing decision, not an
        approval of the three items below.
    - [ ] A **size budget test on both constitutions**, pinned at today's byte count: a ratchet that
          can only go **down**, unless an explicit decision raises it. The missing net, one test.
    - [ ] A **subtraction pass** in place of the usual addition pass. Two targets already measured:
          `## Expected Claude Code behaviors` (**14.8 KB**, 11 subsections, half the file), and the
          always-loaded descriptions of `switch` (**1 550 B**) and `local-mirror` (**1 543 B**) — 3 KB
          of permanent cost for two optional features. Note the obstacle before starting: the doc
          guards make removal red by construction, so a subtraction pass edits guards and prose
          together, deliberately.
    - [ ] **The only honest test of a rule's efficacy is behavioural** — an eval run against a real
          brain. This repo has never had one. That is a project of its own, not a line item here, and
          it is what would let a later release *remove* with evidence instead of by taste.
- [x] **F1 — vault-only confidential material is printed at every SessionStart. ✅ COMPLETE**
      _(2026-08-03 · `9c67ea9` → `4b7b467`)_. The universe profile
      was dumped verbatim in the banner, including a passage explicitly tagged
      `🔒 CONFIDENTIEL, ne jamais sortir du vault`. It therefore landed in every screenshot, screen
      share and transcript. (It reached this very conversation that way.) Also ~30 lines before the
      first prompt.
  - [x] **Decided (2026-08-02): a product fix, not a documentation one.** The banner prints a
        **synthesis** of the active universe, never the verbatim profile.
  - [x] **And only when more than one universe exists.** With a single universe there is nothing to
        disambiguate, so the profile earns no banner space at all. This makes the fix consistent with
        ADR 0034's "invisible until a second universe exists" rule, instead of being only a leak fix.
  - [x] **Sub-decision CLOSED by the owner (2026-08-02 evening): the banner carries a SHORT synthesis
        plus, in parentheses, how to get the rest** — *"for more detail on the universe and its
        description, ask `/switch`"*. `/switch` is the right door: it already owns the profile
        (`SETUP.md:698`), even though its name says "change". So the banner states the fact, and the
        detail is **pulled on request** instead of pushed at everyone, every session.
  - [x] **The other half has now shipped too.** **The owner had asked for this before, and half of it
        shipped** _(2026-07-28, `2243b83`,
        `f63d8ac`, `7ec088b`)_: that pass shrank the **framing** around the universe reminder and the
        profile digest. What it did not touch is the **payload** — `renderUniverseDigest`
        (`universe-profile.mjs:103`) still quotes About / People / Topics / Connector accounts up to
        `DIGEST_MAX_LINES = 12`. That is the part that leaks 🔒 material into every screenshot.
  - [x] **The design knot, and how it was cut** _(2026-08-03: the first road — inject the human line,
        let the agent open the page on demand)_: the digest serves **two different audiences through one channel** — the AGENT (it needs
        people/topics/accounts to reason well, ADR 0035) and the HUMAN (who needs one line). And on the
        CLI `additionalContext` is **echoed verbatim** (`2243b83`'s whole lesson), so there is no
        "inject without showing". Either the human line is all we inject and the agent reads the
        profile note on demand (RAG / direct read), or the leak stays. This is the plan's reframe once
        more: *what the agent must know* and *what the owner must read* are not the same thing.
  - [x] **✅ BOTH REMAINING CHOICES CLOSED BY THE OWNER (2026-08-03). Do not re-open.** The knot is
        resolved the first way: **inject the human line, and let the agent fetch the rest.**
    - [x] **What rides every session: the identity line + a pointer, and nothing else.** Name, kind,
          role, period (all from the frontmatter the owner typed), then the profile note's path framed
          as *read it when you reason about the people, the tools or the scope here*, then
          *(ask `/switch` for the description)*. **Zero verbatim body**: no About, no People, no Topics,
          no connector accounts. Rejected: adding content-free counters ("12 people, 4 topics") — it
          buys the agent nothing it cannot see by opening the note.
    - [x] **Single-universe brains print STRICTLY NOTHING.** The `[working context]` block goes behind
          the same progressive-disclosure gate as the `[universe]` line. **Cost stated to the owner and
          accepted:** `CLAUDE.engine.md` is in **no** regime (F18), so the constitution half reaches new
          installs only — a deployed single-universe brain therefore stops receiving the ambient facts
          and gains no pointer. It keeps the RAG (the note is indexed, `type: universe`).
    - [x] **Consequences honoured** (all three, and what each one turned into):
      - [x] The **full** digest is untouched and still serves `set-universe-profile.mjs --digest`, the
            **pulled** form. `renderUniverseSynthesis` is the injected one, and **which of the two the
            hook picks is now pinned by a test at the composition root** (`readActiveProfileSynthesis`)
            — that choice is a one-word edit nobody would catch in review.
      - [x] Presence parted from payload: the hook still READS the profile below the gate (so the
            capture offer does not come back at an owner who already wrote their page) and injects
            nothing. When the universe count cannot be read at all, it injects nothing either —
            a surface echoed verbatim into screenshots fails closed.
      - [x] `/switch` gained the door: a **"📖 see the description"** entry in the no-argument menu plus
            its own section, framed as the OPPOSITE act of the post-switch refresh (there, background
            used silently; here, the owner asked to read it). Guard test pins it, and it is refutable
            (deleting the menu entry fails the suite).
    - [x] **Found while wiring, worth keeping.** The pointer's path is now stated by the CALLER, which
          located the file, instead of being read off `frontmatter.universe`: an owner hand-editing
          their page in Obsidian can drop that key, and a pointer at a note that is not there is worse
          than no pointer. Also: the identity line and the note path each got ONE owner, shared by both
          renderings, so the two can never introduce the same universe differently.
    - [x] **The gate closed the last channel that mentioned the page**, so the rule moved to where it
          costs no session bytes: **both constitutions** (EN + FR) now name `vault/universe.md` /
          `vault/<universe>/universe.md` and frame it as *open it when the answer depends on it, never
          recite it back*. Guarded on both layers. Known limit, unchanged: `CLAUDE.engine.md` is in no
          propagation regime, so that half reaches new installs only (F18's finding).
    - [x] **ADR 0035 amended in place** (§2, §4, new §6bis), per `CONVENTIONS.md` §6bis — "what a
          session is handed about a profile" is 0035's own topic, so no new number. Its 2026-07
          rejection of gating is kept **and answered**: it was sound about the agent's needs and silent
          about the owner holding a shared screen. `SETUP.md` stops promising a summary at every
          conversation.
    - [x] **Volume, measured**: the startup payload went from *(200 + up to 12 lines of profile + 126
          of framing)* to **517 chars** on the real brain used to verify it. What the budget test bounds
          is OUR prose against a representative payload; the owner's own words (display name, role,
          period) still float, exactly as the digest's did.
- [ ] **F20 — a session on a machine that is BEHIND runs the old engine and never says so, and the
      first casualty is F1's own privacy fix. ✅ IN v4.7.0 (scope call, 2026-08-05)** _(field report, owner, 2026-08-05:
      `mind-palace` opened on the Shodo Mac after being updated on the Inqom Mac the day before; the
      startup banner was the PRE-v4.5.0 one. Screenshot kept in the conversation. Verified against the
      code the same day — everything below is read, not supposed.)_
  - [ ] **The owner's first hypothesis was "we should `git pull` before printing the banner", and the
        pull IS already first** — `session-status.mjs:65` runs `sweepThenPull` (sweep the tree, then
        `git pull --rebase`) **before** any emission at `:204`. So the missing piece is not the pull.
  - [ ] **The real mechanism: the session that pulls the new engine always runs the OLD one.** Every
        SessionStart hook is a node process reading the code **on disk at that instant**, and Claude
        Code freezes `CLAUDE.md`, `settings.json`, the skills and the MCP servers at the same instant.
        Code that lands mid-start cannot retroactively change what is already running —
        `startup-sync.mjs`'s own header states this rule for the sweep ("live at the first restart
        after the update that installs it"). **The new banner is a next-session thing, by construction.**
  - [ ] **Why it is not merely cosmetic: what the stale banner PRINTED.** The offending line comes from
        the sibling hook `session-universe.mjs`, and the old version dumps the active universe's whole
        profile body — About, People, Topics, connector accounts — including the passage marked
        `🔒 CONFIDENTIEL, ne jamais sortir du vault`. **F1 shipped in v4.5.0 exactly to stop that** (see
        its entry: identity line + pointer, zero verbatim body). So a machine that is behind **silently
        keeps a privacy defect the product has already fixed**, and nothing on screen hints at it.
  - [ ] **The actual gap: the restart nudge is BLIND to an engine that arrives by pull.** Read, not
        assumed: `.cache/restart-needed` is written only by `update-engine.mjs:385` and
        `session-self-heal.mjs:199` (an update performed **on this machine**), and `.cache/` is
        gitignored (`.gitignore:73`) — correctly, it is machine-local — so machine A's flag never
        travels. The second signal, `detectSelfHealGap`, only sees a **missing skill directory** or an
        **unregistered MCP server** (`deriveWanted`, `session-self-heal.mjs:136`); a hook script or a
        skill body whose **content** changed trips neither. Hence: engine updated by pull, zero nudge.
  - [ ] **The fix shape, reusing what is already there — no new channel, no new network call.**
        `session-status.mjs:76-80` **already computes** the pulled file list
        (`git diff --name-only ORIG_HEAD HEAD`) and then throws it away to keep a count. Filter it for
        engine-managed paths (`scripts/**`, `.claude/**`, `engine-skills/**`, `CLAUDE*.md`,
        `.mcp.json.template`, `engine-manifest.json`); if the intersection is non-empty, **write the
        restart flag and lead with the existing nudge**, whose wording already says the right thing
        ("until you restart, nothing else you read is from the engine you now have", ADR 0036).
  - [ ] **Two things to settle when it is built, not before:** whether the nudge must also name the
        privacy case explicitly (a banner that already leaked is not un-leaked by a restart), and what
        a brain with **no remote** shows (the pull is a silent no-op there — it must stay silent).
  - [ ] **The owner's follow-up (2026-08-05): "shouldn't it ASK to restart, or exit, when it sees it
        was upgraded? A version check at the very start?" — the intent is right, the exit is not
        available, and the CHANNEL matters more than the force.** Recorded so the design is not
        re-derived:
    - [ ] **A SessionStart hook cannot abort a session.** It emits `systemMessage` /
          `additionalContext`; there is no deny verb (unlike `PreToolUse`). So "exit at startup" is not
          a thing this harness offers, and forcibly killing someone's session would be hostile anyway.
    - [ ] **The lever that DOES exist is `UserPromptSubmit`** — it can block a prompt outright (exit 2)
          or inject context. **Recommended: inject, do not block.** It repeats on every prompt until the
          restart happens, so it cannot be missed, and it never locks the owner out of their own brain
          on a false positive. The repo's own rule applies (`restart-signal.mjs`): a phantom restart
          costs a pointless one and teaches people to ignore the real one.
    - [ ] **And it is the only channel that reaches Desktop** (ADR 0036's matrix: `systemMessage` and
          `statusLine` are terminal-only). Today the Desktop cue is a 🛑 chat rule inside the
          `update-engine` skill, which only fires when the update ran **here** — precisely the case F20
          is NOT about. So the pull-detected nudge would give Desktop its first deterministic cue.
    - [ ] **On "a version check at the very start": prefer git to a version string.** The hook performs
          the pull itself, so it holds both ends — `ORIG_HEAD` (what this session loaded) and `HEAD`
          (what is now on disk). That is exact, needs no bookkeeping, and covers a manifest that did not
          move while files did. **The problem is bounded**: any *new* session loads whatever is on disk,
          so the only stale window is code arriving *inside* a running session.
  - [ ] **The Desktop question, answered from the repo rather than invented** — the `update-engine`
        skill already prescribes it (`.claude/skills/update-engine/SKILL.md:119-133`): **fully close
        Claude and reopen it, then come back to THIS same conversation.** Explicitly **not** a
        brand-new conversation (that is the distinct *initial-rooting* rule, for a session not yet
        rooted in the brain). Reuse that wording for the pull-detected case; do not mint a second one.
        _(Worth a field check when built: that instruction is a documented claim, not a measured one.)_
  - [ ] **Why it belongs to v4.7.0 rather than a hotfix**: it is a *visibility* finding in the exact
        sense of that release, and it is the first field report on the multi-machine path v4.5.0 opened.
- [ ] **F21 — the index reports a shortfall it never tries to close, and promises a resume it cannot
      know is coming. ✅ IN v4.7.0 (scope call, 2026-08-05)** _(same field session as F20, owner, 2026-08-05: after the
      startup pull, `vault_stats` answered « l'index n'est pas complet : 439/458 fichiers, 19 en attente
      (reprise auto à la prochaine session) », with the watcher **idle** and **local embeddings**. His
      question — « ça devrait reprendre en auto dès lors qu'il constate qu'il est en retard, non ? » —
      is the right one. Verified in the code the same day.)_
  - [ ] **The sentence is the engine's, not the agent's**: `RESUME_HINT = "auto-resume on the next
        session"` (`rag/src/lib/progress-report.ts:12`), pasted into the shortfall line by
        `incompleteIndexWarning` (`status-report.ts:65-72`). So it is a **product claim**, and it is
        made unconditionally, from two numbers (`docCount` vs `scannedCount`) and nothing else.
  - [ ] **Why it was written that way, and where the reasoning stops holding.** `index.ts:372-374` says
        it out loud: *"if the index is not complete after the run (quota wall, errors), say so
        explicitly — auto-resumes on the next session, nothing to do by hand"*. That is sound for the
        **two causes it names**, where retrying now would hit the same wall. It is false for the two it
        does not:
    - [ ] **Notes that simply arrived after the scan** — the normal multi-machine case. The session's
          `git pull` (F20) lands notes at the same instant the MCP server runs its startup `reindex`
          and only THEN arms the watcher (`index.ts:390`). Anything landing inside that window is
          neither failed nor queued: it is **unseen**, by nobody's fault, and the machinery that could
          close it (scheduler + watcher, idle, **no quota on a local embedder** — checked: the daily cap
          lives in the Gemini path, `embedder.ts:162`, not in `in-process-embedder.ts`) sits there
          waiting for an event that has already happened.
    - [ ] **Notes the indexer REFUSED** — for those, "auto-resume on the next session" is precisely the
          *failure displayed as a wait* that F11/F12 fixed **on the banner**, from the run state. That
          fix never reached this surface: the RAG's own status line still renders both as one number.
          **This is the same defect on the other channel, and it is the channel the agent quotes when
          the owner asks a question.**
  - [ ] **The fix has two halves, and the second is what the owner actually asked for.**
    - [ ] **Say which** — make the shortfall line cause-aware by reading the run state F11/F12 already
          reads (`scripts/lib/rag-status.mjs` side). **Do not mint a second cause model**: one truth
          about why notes are missing, rendered on both surfaces.
    - [ ] **Then act** — when the cause is neither a cap nor a refusal, schedule a catch-up **now**
          through the existing `ReindexScheduler`, instead of rendering a sentence about the next
          session. **Bound it by progress** (stop as soon as a run indexes nothing new) so a refused
          note cannot loop forever — that bound is exactly what tells the two causes apart at runtime.
  - [ ] **The root it shares with F20, worth stating once**: on a multi-machine brain, **session start
        is a race between what arrives and what reads it**. The pull delivers code and notes at the
        same instant the hooks and the MCP server read them. F20 is the code half, F21 the notes half.
- [ ] **F22 — the command is named after the verb, and the owner reaches for the noun.
      ✅ IN v4.7.0, option A decided (scope call, 2026-08-05)** _(field, owner, 2026-08-05: typed `/univers`, twice, got
      `Unknown command: /univers` and `Args from unknown skill: shodo`, then had to type `/switch`
      himself. His ask: an alias `/univers` → `/switch`, or failing that a message pointing at it.)_
  - [ ] **Why it happens, and it is not a typo.** `/switch` does far more than switching: it creates a
        universe, records and shows a profile, lists, renames. Someone thinking about the **thing**
        (*univers*) does not guess a command named after the **action**. The startup block does name
        `/switch`, and it still did not carry — a pointer is not a lookup.
  - [ ] **No hook can catch it**: an unknown slash command fails in the CLI, before any model turn. So
        the only mechanism is *the command existing*.
  - [ ] **Mechanism, checked in the code — two facts that shape the options.**
    - [ ] **A command IS a skill directory name** (`.claude/skills/<name>/SKILL.md`); this repo has no
          `.claude/commands/` at all. So an alias = a directory, and its cost against **F19** is only
          its **frontmatter description** (the body loads on invocation). A stub alias is deliberately
          ~2 lines: the routing for a typed `/x` is literal, so it needs no trigger prose.
    - [ ] **A FR-ONLY skill is NOT deliverable today.** The locale overlay is per-file
          (`templates/<locale>/<rel>` replaces the same `<rel>`, `engine-copy-select.mjs`), and the copy
          list is driven by manifest globs over paths that exist at the **root**. A file living only
          under `templates/fr/` is in no copy list. So "ship `/univers` to FR brains only" would need a
          new delivery mechanism — do not assume it is free.
  - [ ] **The three options, with the one that is strictly dominated marked as such.**
    - [ ] **A. Two thin aliases at the root, `universe` + `univers`** — both locales get both;
          cost = two short descriptions in the always-loaded layer. **Recommended**: cheap, reversible,
          no rename, and it covers the English guess as well as the French one.
    - [ ] **B. One alias, `universe` only** — cheapest, respects English-only command names, and
          **does not fix the case that was actually reported**.
    - [ ] **C. Rename `/switch` → `/universe`, keeping `/switch` as the alias. DOMINATED — do not
          pick it for the fleet.** The reconciler installs skills by directory name and never removes
          one, so on every deployed brain a rename **is** an alias *plus* a stale duplicate of the old
          command. Strictly worse than A.
  - [x] **✅ CLOSED by the owner (2026-08-05): option A.** Two thin aliases at the root, `universe` AND
        `univers`, both locales getting both — it covers the English guess as well as the French one that
        was actually reported. **Do not re-open the naming**, and do not drift toward C: on a deployed
        brain a rename is an alias *plus* a stale duplicate.
- [ ] **F13 — discoverability regression, directly comparable across the update.** v4.3.0 banner:
      `2 consolidation candidates (offer /consolidate) and 28 dangling links (offer /lint)`. v4.4.0:
      `1 consolidation candidates and 27 dangling links` — both offers **gone**, same line width, so
      not truncation. Cosmetic bonus: "1 consolidation candidate**s**".
- [ ] **F3 — the engine-update offer is version-blind.** The opt-in prompt states the *installed*
      version and asks "Je lance ?" **without ever naming the target version**: the owner consents
      blind to a code swap. One `git ls-remote --tags` on the recorded source fixes both halves
      ("is there an update" and "what am I installing").
- [ ] **F10 — the recorded source is frozen at install time.** The prompt showed
      `source: tpierrain/second-brain-generator` while the launcher's remote is
      `git@github.com:tpierrain/kenjaku.git` (renamed at v4.0.0). ADR 0026 states `update-engine`
      **never refreshes** `engine-manifest.json`. Works only via GitHub's rename redirect. Bounded
      (only the same account can break it) but invisible; any org transfer or second rename silently
      strands the pre-rename cohort.
- [ ] **F8 — auto-commit history is unusable as a landmark.** 8 successive commits all messaged
      `auto: vault/claude sync`, mixing people notes, briefing, backlog and PostHog. The brain worked
      around it by pointing at the backlog. Cheap fix: name the touched area
      (`auto: vault/inqom/people (21 files)`). Confirmed twice in one evening.
- [ ] **F9 — auto-commit coverage of out-of-band deletions is observed, not guaranteed.** A `rm` in
      Bash *was* caught (verified via `git log --diff-filter=D`), but the brain's own words were "ce
      qui n'était pas acquis". Pin the behaviour down (and test it) rather than relying on it.
- [ ] **F2 — "update the brain" covers only one of three axes.** Content (`sync-sources`), engine
      (`/update-engine`) and vault hygiene (`/consolidate`, `/lint`) are three distinct meanings; the
      answer named two and silently ignored the pending hygiene work the SessionStart banner had
      announced three lines above. **Note:** the desired behaviour already exists on the
      `update-engine` path (it spontaneously reports "1 consolidation candidate, 27 dangling links,
      rien d'urgent"). So this is to be **generalised, not invented**.

### Cross-cutting engineering lesson (F16) — for CONVENTIONS, not just for one fix

- [x] **A checker that parses differently from the engine measures a fiction.** ✅ DONE _(2026-08-03 ·
      `CONVENTIONS.md` §5quater)_. The field crosscheck's first version declared **434 of 436 notes
      broken** while the vault was fine: `gray-matter` 4.x routes through `yaml.safeLoad` (js-yaml 3),
      removed in 4, and the repo pins js-yaml ≥ 4.2.0.
  - [x] The lesson is the **direction** of the error: a false alarm on everything is indistinguishable
        from noise, therefore ignored. Any health/verify surface must (a) run the engine's **own**
        parsing path, and (b) be judged on false-positive behaviour, not only on catching the true
        positive.
  - [x] Landed in `maintainers/CONVENTIONS.md` §5quater, next to the mutation-testing rules — and F15
        applied it by construction the same day (the crosscheck's default ports ARE `scanVault` /
        `sha256` / `parseDocument`, and its probe half is judged on staying quiet).

## Decisions taken (2026-08-02, with the owner)

- [x] **Scope: everything ships** — P0, P1, P2 and P3, the freeze trap included. Nothing is
      deliberately deferred at finding level. _(2026-08-02)_
- [x] **The "conflated opposites" reframe is accepted as THE organising root cause.** The work is cut
      along that axis: wherever two semantically opposite acts or states render identically, separate
      them. It is not a filing convenience, it is the shape of the fix. _(2026-08-02)_
- [x] **F5 defect 3 (the path back upstream) gets its own ADR + plan**, not a release line. Reason:
      it changes the model itself (personalizing an engine skill vs. fixing an engine defect are two
      different intents, only the first is modelled) and the brain↔engine relationship. It stays in
      scope, it just does not live in this plan. _(2026-08-02)_
- [x] **F1 is a product decision**: the banner prints a **synthesis** of the active universe, and only
      when there is **more than one universe**. See the F1 entry in P3 for the sub-decision still open
      (what the synthesis contains, and the single-universe rendering). _(2026-08-02)_

- [x] **F17 (opening a note in Obsidian when the note belongs to the vault) joins v4.5.0**, at the
      owner's request the same evening — *"ideally with the next release"*. It fits the release's own
      theme: a promise the product already prints and does not keep. _(2026-08-02)_

- [x] **F18 ships WHOLE in v4.5.0** _(2026-08-03)_. The staged option (its two prose rules now, its
      structural half with F7/F6 in v4.6.0) was put to the owner **with the recommendation to stage**,
      and the owner took the whole finding instead. Reason it is not reckless: the carrier is prose in
      `merge`-regime skills that are **untouched on the affected brain**, so it reaches him; and the
      class it removes is the only one in this plan whose failure costs a relationship rather than an
      hour. **Cost stated and accepted:** v4.5.0 goes from five findings to six, one structural, so it
      lands later. Build order inside the release: F18 **first** (prose-only, blocks nothing, live
      exposure), then F17, then F1, then the release step.

- [x] **F1 MOVES UP from v4.7.0 into v4.5.0**, same request, same evening. The owner had already asked
      for a summarised universe banner on 2026-07-28; only the framing shrank then. It also stops
      being purely "visibility": what the banner prints at every session is 🔒 vault-only material.
      **Cost, stated so the owner can still say no:** v4.5.0 was three findings, it is now five, so it
      lands later than it would have. _(2026-08-02)_

- [x] **Sequencing: three releases**, plus the freeze trap running alongside on its own track.
      _(2026-08-02)_ Rationale: the four priorities differ in risk and in audience, so bundling them
      would make one indivisible field verification where a single sticking point blocks everything.

| Release | Theme | Findings |
| --- | --- | --- |
| **v4.5.0** | promises kept | **F18**, F14, F11/F12, F15, **F17**, **F1** (+ F16 into `CONVENTIONS.md`) |
| **v4.6.0** | the vault's identity | F7, F6, homonymy block, reliability/confidence block |
| **v4.7.0** | visibility | F13, F3, F10, F8, F9, F2 |
| _in parallel_ | the freeze trap | F5 defects 1+2 — defect 3 gets its own ADR + plan |

### Still owed (ordering, not scope)

- [ ] **F14's fix shape** is the only finding whose solution is still an open choice (rehydrate
      command vs. create-if-absent reconciler vs. committed machine-relative variants). It is also the
      first move of v4.5.0, being a broken documented promise with no workaround.

## Evidence trail

- Field session: owner's `mind-palace`, 2026-08-02, `v4.3.0 → v4.4.0`, 436 notes, 3 universes,
  `EMBEDDING_PROVIDER=in-process`, remote `git@github.com:tpierrain/mind-palace.git`.
- The brain's own diagnosis and remaining work live in **its** `vault/backlog/harnais.md` under
  `[observation]` (pointer, not copied here).
- Brain-side artefacts worth harvesting: `tools/index-vs-disk-crosscheck.mjs` (commit `1305ef1`),
  the deterministic people-note builder, the homonymy-block convention.
- **F18's source (2026-08-03)**: `~/mind-palace/vault/topics/second-brain-retrieval-reliability.md` —
  a postmortem the brain wrote about itself, on request, after two failing sessions. Pointer, not
  copied: F18's entry above carries everything needed to act, already verified against this repo.
