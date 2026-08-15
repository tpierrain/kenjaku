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

- [ ] **(a) Close the reported case in the `/switch` path**: after the pointer is written, commit and
      push it explicitly (deterministic, in `set-active-universe.mjs` or its caller). TDD baby-steps.
- [ ] **(b) Remove the class**: the Stop hook (`auto-push.mjs`) becomes **sweep-commit then push**, so
      any out-of-band engine write (today's pointer, tomorrow's whatever) leaves the machine at session
      end instead of waiting for the next session's sweep.
- [ ] **Decide (not necessarily ship): the stale-wins regression.** Should the SessionStart sweep
      refuse — or at least warn — before committing a pointer that is *behind* the remote? (Issue #69's
      closing note.) If deferred, say so here with the reason.
- [ ] **Rider #63**: raise default `CLAUDE_CODE_AUTO_COMPACT_WINDOW` to `450000` in
      `.claude/settings.json.template` + its guard test (`settings-template.test.mjs`). New brains only.
- [ ] **Rider #65**: `⚠️ ` prefix on `nativeConnectorsReminder()` (`scripts/lib/universes.mjs`) + its
      test.
- [ ] **Release tail**: mutation pass on touched files (pin numbers in `mutation/RESULTS.md`), §10
      marketing-surface re-read, release note, tag **v4.9.1**, close issues #69/#63/#65.

## Work-mode experiment (owner's ask, 2026-08-15 — decide at kickoff)

The owner wants to pilot a **subagent-orchestrated mode** on this release, to keep the main context
lean instead of `/clear`-ing every ~200k tokens. Agreed shape of the pilot (proposed, pending his go
at kickoff): the TDD core stays in the main session's hands (baby-steps are sequential by nature);
delegation applies to the **edges** — adversarial diff review (multi-agent), mutation-survivor
triage (one judge per survivor, parallel), and large reads returned as digests. Debrief after the
release; if conclusive, scale it to the unfreeze chantier's QA (fixtures × versions = natural
fan-out). Same instinct as issue #64, brain-side.

## Sequencing

Arbitrated 2026-08-15 (owner, in conversation — recorded here the same day): **this cuts first**,
then the unfreeze chantier (`update-regime-owns-what-it-shipped-action.md`) carries the doctrine
cargo (#61, #67, #64's rule half, the source-first rule) and pays the mutation debt
(`v4.9.0-mutation-debt-plan.md`). Neither waits on the other's code; the order is purely
"lived defect first".
