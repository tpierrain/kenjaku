<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- STATUS: 🔴 LIVE — NEXT TO EXECUTE. Arbitrated by the owner 2026-08-15:    -->
<!-- this small hotfix cuts BEFORE the unfreeze chantier, because the defect   -->
<!-- is lived today on the shipped headline promise (the universe travels).    -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Action plan — the switch that stayed on the machine (v4.9.1 hotfix)

> **The defect (issue #69, measured with a timeline on a real brain, 2026-08-12):** `/switch` writes
> `.vault-rag/active-universe` through **Bash**, so neither half of the persistence net sees it —
> `auto-commit.mjs` matches only `Write|Edit`, and the Stop hook is push-only. The switch survives as
> a dirty file; close the laptop and it never leaves the machine. Worse, the SessionStart sweep on a
> second machine commits its **stale** pointer before the owner can react, so the older universe can
> silently win (the observed inqom/shodo ping-pong). This holes v4.9.0's headline promise ("the
> universe travels with you") and is the same shape as the v4.8.1 precedent: a lived, cross-machine
> defect that jumps ahead of the big subjects on the owner's call.
>
> **Riders (quick wins, owner-approved):** issue #63 (auto-compact window default 350k → 450k) and
> issue #65 (⚠️ prefix on the native-connectors reminder).

## Tracking

- [x] **(a) Close the reported case in the `/switch` path**: after the pointer is written, commit and
      push it explicitly (deterministic, in `set-active-universe.mjs` or its caller). TDD baby-steps.
      _(2026-08-15 · 7220b3a, branch `hotfix/v4.9.1-universe-pointer`)_ — new
      `scripts/lib/universe-persist.mjs`: scoped commit of `.vault-rag/` + push via the Stop hook's
      `attemptPush` (autopush opt-in respected); `runSwitchCli` reports `wrote`; loud warnings on
      commit/push failure. Test-first batch (experiment mode), suite 1683 green.
- [x] **(b) Remove the class**: the Stop hook (`auto-push.mjs`) becomes **sweep-commit then push**, so
      any out-of-band engine write (today's pointer, tomorrow's whatever) leaves the machine at session
      end instead of waiting for the next session's sweep. _(2026-08-15 · 88499d3)_ — reuses
      `attemptCommit` (same message, same unmerged-tree refusal), best-effort wrapped; the test fake
      now counts commits so `rev-list` answers like real git (kills the push-before-sweep mutant).
- [x] **Decide (not necessarily ship): the stale-wins regression.** Should the SessionStart sweep
      refuse — or at least warn — before committing a pointer that is *behind* the remote? (Issue #69's
      closing note.) If deferred, say so here with the reason. _(2026-08-15 · owner's call, in
      conversation)_ — **DEFERRED, nothing ships.** Reason: (a)+(b) remove the dirty-pointer state the
      regression needs (the switch commits+pushes itself; the Stop hook sweeps any leftover), so the
      SessionStart sweep can no longer meet a stale *uncommitted* pointer except once, on a pre-fix
      brain. The residual committed-but-behind case already fails loud: `git pull --rebase` conflicts
      on the one-line pointer file and stops for the interactive rule ("the machine you sit at wins").
      A further guard would be noise for a window that no longer exists.
- [x] **Rider #63**: raise default `CLAUDE_CODE_AUTO_COMPACT_WINDOW` to `450000` in
      `.claude/settings.json.template` + its guard test (`settings-template.test.mjs`). New brains only.
      _(2026-08-15 · 44c5482)_ — plus an amendment in ADR 0018 and a de-hardcoded maintainers index line.
- [x] **Rider #65**: `⚠️ ` prefix on `nativeConnectorsReminder()` (`scripts/lib/universes.mjs`) + its
      test. _(2026-08-15 · 3412882)_
- [ ] **Release tail**: mutation pass on touched files (pin numbers in `mutation/RESULTS.md`), §10
      marketing-surface re-read, release note, tag **v4.9.1**, close issues #69/#63/#65.
      _In flight (2026-08-15): work-mode pilot engaged — 3 adversarial review subagents on the branch
      diff (lenses: git semantics / fleet deployment via manifest regimes / test quality) + targeted
      mutation batch on the 4 touched prod files, running in disposable worktree `kenjaku-mut-v491`
      (log: `mutation/reports/v491-batch1.log`). On resume: read both results, fix what they teach,
      then pin numbers and release._
      _Fleet review landed (2026-08-15 · fixes b471e57): merge regime DOES deliver auto-push.mjs to
      the fleet (verified, engine-apply-plan carve-out) — the class-removal claim holds. Two real
      findings fixed: the Stop sweep now shouts on "failed" (SWEEP_FAILED_WARNING), and the switch
      commit is pathspec-scoped so pre-staged work stays out and stays staged. To do at tag time
      (review NIT): bump `engineVersion.scripts` in `engine-manifest.json`._
      _Correctness + test-quality reviews landed (2026-08-15 · fixes fff4ca1): mid-merge partial-commit
      refusal → calm DEFER to the Stop sweep; push gated on committed; buildGit timeout 10s; realpath
      entry guards (auto-push + the shared lib/entrypoint.mjs — the subprocess wiring test the review
      demanded immediately caught that a symlinked brain path ran /switch WITHOUT persisting). Declined
      as NIT, on record: detached-HEAD switch reports success while its commit can orphan (broken-brain
      tier, SessionStart machinery already complains there)._
      _Mutation pass 1 (on 37029b8, log `mutation/reports/v491-batch1.log`): overall 89.15 % —
      universe-persist 91.80 %, auto-push 92.55 %, universes 89.26 % (32 survivors), set-active-universe
      25 % (the untested wiring)._
      _Mutation pass 2 post-review-fixes (on fff4ca1, log `v491-batch2-postreview.log`): **97.71 %** —
      universe-persist **100 %**, entrypoint **100 %**, set-active-universe **25 → 100 %** (the
      subprocess test), auto-commit 98.31 %, auto-push 94.90 %. Of its 6 survivors, 5 are the
      documented equivalent tier (entry guards ×4, `.trim()` under Number()); the 6th
      (SWEEP_FAILED_WARNING half-blankable) is killed by 2500b52's whole-text pin. universes.mjs's 32
      survivors triaged and killed in 2500b52 (whole-result asserts, multi-word parse, corrupt
      registry, byte-pinned newline, defensive copies, idempotent create) + dead regex quantifier
      simplified out; a couple of readRegistry catch-net mutants are equivalents (ENOENT path)._
      _Item (3) DONE (2026-08-15 · 0163b55): `engineVersion.scripts` 1.13.0 → **1.13.1** (patch — this
      closes a hole in a shipped promise rather than adding a capability); rag / local-mirror /
      constitutionTemplate verified untouched, `indexSchemaVersion` stays 2. The two new files ship
      under the existing `scripts/lib/**` replace regime — nothing to add to the manifest._
      _Item (4) DONE — §10 marketing-surface re-read (2026-08-15 · 56be05f). **Verdict, including the
      boring half.** (Q1, made false or imprecise) **one** finding, fixed: SETUP §"Commit per edit, push
      once per turn" described the `Stop` hook as push-only, which is precisely what this release
      changes; its session-start-sweep bullet was re-positioned with it. (Q2, made true and unsold)
      **nothing to add** — and the notable point is *why*: v4.9.1 changes no marketing sentence because
      it **repairs two already-published ones**. README's "since v4.9.0 the universe you are working in
      follows you" and the "Nothing to save, nothing to lose / auto-committed the instant it's written"
      blurb were both half-true while the pointer stayed on the machine; the code now matches the copy,
      so the copy stands. **Boards re-read** (`board-flow` "Save & back up", `board-anatomy` hooks list,
      via their README alt texts + `marketing-image-prompts.md`): still accurate, **no re-render**.
      EN-QUOI-C-EST-DIFFERENT and CONNECTORS: nothing touched by this release. **Decided no-change, on
      record**: README's two technical bullets ("auto-push on the Stop event") are not false and adding
      the sweep there would buy mechanism at the cost of §11 brevity — SETUP is where that contract
      lives._
      **RESUME HERE after `/clear`:** (1) mutation pass 3 in the worktree `kenjaku-mut-v491` (advance
      it to 2500b52 first: `git reset --hard 2500b52 && git clean -fd`) over `scripts/lib/universes.mjs
      + scripts/auto-push.mjs` (both changed after pass 2 — universes prod regex + the warning pin),
      expect ≥ pass-2 numbers — **IN FLIGHT (2026-08-15)**: two batches, logs
      `mutation/reports/v491-batch3a-universes.log` (296 mutants) and `…-batch3b-auto-push.log`;
      `rag/node_modules` symlinked into the worktree and `vault-write-guard.test.mjs` verified at
      22 pass / 0 skipped there first; (2) pin all numbers in `mutation/RESULTS.md` (new v4.9.1 section,
      newest-first, name the equivalents); (3) ✅ done, see above; (4) ✅ done, see above; (5) **drafted**
      (2026-08-15 · e2b5cb3 — `release-v4.9.1-note.md`; two things left to the owner IN the file: the
      title, 3 candidates, and the mutation figures pass 3 pins), then release note
      (non-dev-first tone, cf. memory), merge to main, tag **v4.9.1**, close #69/#63/#65;
      (6) `git worktree remove /Users/tpierrain/Dev/kenjaku-mut-v491 --force`; (7) debrief the two
      experiments in this plan (data so far: reviews found 1 blocker-class silent-no-op (symlink
      entrypoint), 2 real defects fixed pre-tag, mutation floor HELD at 97.71 % under test-first
      small batches; inline survivor triage beat fan-out at this size)._
- [ ] **Debrief the two experiments** (work-mode pilot + process experiment below): wall-clock felt,
      mutation floor held or not, what the owner's review caught; write the verdict here, then let
      the owner decide what graduates (to the unfreeze QA, and/or to the harness TDD rule).

## Work-mode experiment (owner's ask, 2026-08-15 — decide at kickoff)

The owner wants to pilot a **subagent-orchestrated mode** on this release, to keep the main context
lean instead of `/clear`-ing every ~200k tokens. **GO given by the owner at kickoff (2026-08-15), as
proposed.** Agreed shape of the pilot: the TDD core stays in the main session's hands (baby-steps are sequential by nature);
delegation applies to the **edges** — adversarial diff review (multi-agent), mutation-survivor
triage (one judge per survivor, parallel), and large reads returned as digests. Debrief after the
release; if conclusive, scale it to the unfreeze chantier's QA (fixtures × versions = natural
fan-out). Same instinct as issue #64, brain-side.

## Process experiment (owner VALIDATED, 2026-08-15): test-first small batches, not strict baby-steps

This release also pilots a **relaxation of the TDD discipline**, validated by the owner in
conversation on 2026-08-15. His framing: TDD was his means to make design emerge; for a generative
agent that can hold a whole design at once, strict one-test-at-a-time baby-steps may cost more than
it earns. The counter-evidence on record: the second mutation audit measured baby-steps core at 87 %
vs after-the-fact glue at 51 % — so "no quality loss" is a claim to demonstrate, not assume. Hence a
deal that swaps **process discipline for outcome measurement**:

1. **The judge is the mutation score, not the ritual.** The release's mutation pass must hold the
   floor pinned in `mutation/RESULTS.md` (§ v4.9.0 is the baseline). If the new mode drops it, the
   experiment has answered and the discipline comes back.
2. **The mode: design first, then test-first in small batches, fail-first kept.** Sketch the design,
   write a small batch of tests describing intended behaviour, see them **all red for the right
   reason**, implement, green, refactor. **Fail-first is non-negotiable** — it is the mechanical
   guard against tautological tests (the agent's #1 failure mode, asserting what the code does
   rather than what it should do). Test-after remains out. The outside-in acceptance layer stays
   first in all cases.
3. **Strict baby-steps stays available on criteria**: genuinely unknown design, tricky algorithms
   where triangulation earns its keep, or when the owner wants the step-by-step narrative for
   review. A tool to reach for, no longer a standing ritual.

The global `tdd-discipline` skill stays **untouched** until this experiment renders its verdict
(this plan is release-scoped; amending the harness rule is the owner's signature, made AFTER the
debrief, not before).

## Sequencing

Arbitrated 2026-08-15 (owner, in conversation — recorded here the same day): **this cuts first**,
then the unfreeze chantier (`update-regime-owns-what-it-shipped-action.md`) carries the doctrine
cargo (#61, #67, #64's rule half, the source-first rule) and pays the mutation debt
(`v4.9.0-mutation-debt-plan.md`). Neither waits on the other's code; the order is purely
"lived defect first".
