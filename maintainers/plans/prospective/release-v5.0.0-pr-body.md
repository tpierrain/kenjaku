# PR #76 body — v5.0.0 (S9-2a, ready to apply)

> 🚧 **This file IS the body.** Everything below the first `---` is what
> `gh pr edit 76 --body-file …` should send. It is written here rather than pushed straight to GitHub
> because editing a live PR is an outward-facing action and the loop does not take those alone. **The
> command is in the plan, ready for S9-2b.**
>
> **Suggested title** (the current one, *"v5.0.0 — the engine owns what it shipped (S1–S6, bar the FR
> rider)"*, has been wrong since 2026-08-21): **`v5.0.0 — the engine owns what it shipped, and stops
> leaving old brains behind`**. The RELEASE title is a separate choice with its own three candidates,
> in `release-v5.0.0-note.md`.

---

> **Draft, deliberately.** Nothing here is merged, tagged or published. This is the reviewable diff the
> overnight loop was asked to leave behind. Its base is `chore/s0bis-entrypoint-mutation-debt` on
> purpose, so draft PR #75 keeps its S0bis perimeter instead of swallowing the release.
>
> ⚠️ **This body has been rewritten TWICE, and both times for the same reason.** On 2026-08-21 it still
> described S1 alone, ninety commits after that stopped being true. It is rewritten again on 2026-08-22
> because the branch has since grown S7, S8, S10 and the release tail — more than doubling it. **That
> staleness is the exact defect this release exists to end** — a copy of a state, drifting silently,
> with nobody told — so it is named here rather than quietly overwritten.

## What the branch carries

**196 commits, 161 files, +24 530 / −1 508** against this PR's base. Slices **S1 through S10**, the
**doctrine cargo** it carries for a neighbouring plan, plus the release tail's first half. The owning plan is
[`v5-unfreezes-the-existing-fleet-action.md`](maintainers/plans/prospective/v5-unfreezes-the-existing-fleet-action.md)
— its predecessor, which built S1–S6, is archived beside it and holds no current state. The working
contract and the run log are in
[`agent-orchestrated-release-mode-action.md`](maintainers/plans/prospective/agent-orchestrated-release-mode-action.md).

## The problem, in one paragraph

`provenance` has always recorded a base's *digest* and never kept its *bytes*. That leaves an update
exactly one thing to do with a base — an equality test — hence two outcomes: clobber the owner, or
abandon the file. The engine chose abandon, **permanently and silently**. `CLAUDE.engine.md` made it
measurable: across the nine published tags `v3.6.0` → `v4.9.1` the file is **absent from every regime**,
while its content grew 23 504 → 33 531 bytes. The freeze was never a bug in the update path; it was a
file nothing declared.

## The slices

**S1 — an immutable base per `merge` file.** `.engine-base/<rel>`, written by one function serving both
moments: **advance** to what the update *delivered* (never to what it *fetched*), then **seed** whatever
the brain can still prove about itself. Wired into all three writers, including
`reconcile-brain.mjs`'s `runReconcileCli` — the last writer on the update path, and the one that runs
when a brain on the old code performs its first upgrade. The tree got its own fourth regime, `local`,
because leaving that answer blank is precisely why the doctrine layer reached nobody.

**S2 — a real three-way merge, so "preserve" stops meaning "abandon".** A nine-row verdict table
(`engine-merge.mjs`) over one shared I/O carrier (`engine-merge-apply.mjs`) serving all three merge
families. The trap the header exists to make unmissable: **the disk takes the MERGE, the base advances
to the CANDIDATE** — record the merged bytes as the ancestor and the next update fast-forwards straight
over the edit just preserved. A merge that would not parse is never written; a conflict is reported and
names its door instead of being a cul-de-sac. S2b took the four engine scripts out of the copy bucket;
S2c made `CLAUDE.md` merge-governed rather than inviolable (owner's call, recorded in the plan).

**S3 — the owner's intent stays out of engine files, by construction.** A `PreToolUse` write guard that
tells an owner what editing an engine file costs, before they do it. ADR 0012 amended rather than a new
ADR opened. It reaches brains through `settings.json.template` only, so the launcher is out by
construction, not by exemption.

**S4 — divergence becomes audible.** A brain says which engine files it is holding back and how far
behind they are. "Which" was free; "how far behind" had **no source at all**, so a `baseRefs: {rel: ref}`
map joined the manifest beside `provenance`. The surface is decided by
[ADR 0036](maintainers/decisions/0036-deterministic-channels-differ-by-surface.md)'s channel matrix and
not by reflex: `statusLine` is opt-in *and* renders nothing in Desktop's Code tab, where a SessionStart
`systemMessage` is dropped too — so the notice rides `additionalContext`, which is also the right shape
for a fact that must be **stated and never nagged**.

**S5 — the doctrine layer joins a regime**, as the first client of the new model.

**S6 — `tdd-discipline` is retired and `test-first-discipline` ships**, with the two paths that put a
skill back, and the one door that erases.

**S7 — the frozen fleet heals itself.** S1–S6 fixed the mechanism for brains installed *from this
release on*; S7 is what makes the release worth anything to the ones already out there. A brain proves
its own installed bytes by **membership in a table of every byte-state the engine ever published**
(`engine-fingerprints.json`, 81 states at v5.0.0, regenerated by a maintainer script and guarded by a
test that goes red the moment a `merge`-regime file changes without it). A file whose bytes are in the
table has, by definition, never been edited — so a brain that recorded no provenance recovers one, and
stops being frozen. **S7-5 goes one step further**: when a digest *is* recorded but its bytes are not,
the ancestor is **fetched from the published tag that digest names**, so a genuinely edited file reaches
the merge path instead of the preserve path. Best effort by design — offline or on a vanished tag, the
file is preserved exactly as before and the report says so in one line.

**S8 — the French tree stops drifting in silence.** `locale-drift.mjs` goes red when an English file
moves without its `templates/fr/` twin in a paired commit; green over the 16 real pairs, with a waiver
map that turned out to be load-bearing (empty it and it names `f7a00fc`, the one commit where English
caught up with French and no French edit can ever pair it). ADR 0040 records the doctrine. **This is
what S6e became** — see *What is NOT in here*.

**S10 — a file you personalized becomes a QUESTION, not a blind spot.** The owner's acceptance
criterion for this release, and the half no mechanism above delivers on its own: a preserved file now
carries the engine's version beside it (`<file>.new`), the update report **names that path**, the
`update-engine` skill turns it into a conversation in plain words, and a real command carries out the
answer — `node scripts/adopt-engine-file.mjs <file> take-theirs|keep-mine|combine --from <path>`. The
answer is recorded **against the engine version it was given at** (`.engine-answers.json`), so a new
release re-opens the question with no timer and no rule. Three invariants earned their own guards: the
owner's current bytes are committed to the brain's history *before* an adoption writes (so *take the new
one* is undoable), *keep mine* must **not** advance the ancestor (or the next merge would fold in the
version they refused), and a conflicted `.new` — which carries `<<<<<<<` markers, not a clean candidate
— is **refused** rather than pasted into the live file and recorded as its ancestor.

**The doctrine cargo — text changes to the very file this release unfreezes.** Deliberately **not**
numbered as slices: they were arbitrated in (owner, 2026-08-15) from a neighbouring plan and the issue
tracker, and only *ride* here. Shipping them inside `CLAUDE.engine.md` is the proof by example that the
carrier works. Each lands in both locales in one commit, with the fingerprint table regenerated beside
it, and each is held by its own doc guard with EN/FR parity.

**#61 — announce before acting on a signal.** Ending a session in plain words ran the passive
observation ritual in complete silence: backlog read, long conversation scanned, four files written,
and the answer only afterwards. **An internal inconsistency rather than a missing feature** — the
engine already demanded exactly this one section earlier, for the background sync — so the fix
generalises the rule that existed instead of inventing a second one, states it **above both of its
instances**, and has the ritual that failed point at it in one line.

**The source-first rule — the routing doctrine gains a level 1 it never had.** The routing table had rows for
semantic, exact and structural retrieval and **none at all for a source the owner hands over** — the
2026-08-08 field case, where an article's URL sat in the first message, was never opened, and the answer
compared that article against a reconstruction of itself. Both constitutions now open their routing
section with a `Level 1` block, and the block is placed **above** the search routing because a rule
about reading order that is itself read last reproduces the order that failed —
`source-first-discipline.test.mjs` pins the rules, the EN/FR parity, the table row's position and the
block's. Its corollary **points at** the existing claim discipline rather than restating it. It rides
this release rather than the next one for the obvious reason: it is doctrine, and doctrine is exactly
what the fleet stopped receiving. Owned by
[`field-finding-2026-08-08-source-first-and-frozen-doctrine.md`](maintainers/plans/prospective/field-finding-2026-08-08-source-first-and-frozen-doctrine.md).

## 🛑 The two claims the release note was FORBIDDEN — both have now fallen

They are kept here, with what made each false, because they were pinned by tests and the tests were
inverted rather than deleted.

1. ~~**The doctrine layer unfreezes no already-deployed brain.**~~ **False as of S7.** Old brains no
   longer merely stop being *silent*: a brain rebuilt from the real `v3.6.0` tag now **receives**. The
   acceptance test that pinned the old limitation was inverted, its old claim kept above its
   replacement.
2. ~~**The merge does not reach BACK.**~~ **False as of S7-5 (`fa0f5be`).** The reasoning was sound but
   for one word: an ancestor cannot be seeded **from the disk**, but it can be **fetched** from the tag
   the recorded digest names. Measured on a brain built from `v3.6.0` with a tailored skill: their lines
   survive *and* the engine's newer content arrives, cleanly, no sidecar. ⚠️ What is still **not**
   promised, and the note does not overstate it: the fetch is best effort, and two edits in the **same
   region** still conflict — correctly, and visibly.

## How it was judged

- Suite **2 337 tests — 2 334 pass / 0 fail / 3 skipped** (the three are Windows-only:
  `cmd.exe` cannot parse a batch file on macOS).
- **Test-first throughout**, with the reds taken on assertions rather than on loading errors. The one
  slice where fail-first did not run first is recorded as such in the plan rather than smoothed over.
- **Mutation measured per block, on the change and not the file** — every number and every named
  survivor is in [`maintainers/mutation/RESULTS.md`](maintainers/mutation/RESULTS.md). Representative
  rows: `lib/engine-merge.mjs` 100 %, `lib/engine-merge-apply.mjs` 100 %, `lib/engine-base.mjs` 100 %,
  `lib/engine-doctrine-refresh.mjs` 100 %, `lib/engine-skill-refresh.mjs` 100 %,
  `lib/engine-write-guard.mjs` 98.89 %, `update-engine.mjs` 99.44 % whole-file with 100 % on the changed
  hunk; and for the S10 block, `lib/engine-adopt.mjs` 96.67 %, `adopt-engine-file.mjs` 100 % over 60
  mutants, then **96.15 % → 100 %** over S10-QA's changed hunks.
- **Acceptance tests over brains rebuilt from real published tags**, not from fixtures this repo
  invented. `release-fixture-doctrine.test.mjs` (S7): three poles whose only variable is the ancestor.
  `release-fixture-adoption.test.mjs` (S10-QA): five poles over a `v3.6.0` brain with three files edited
  **before** the release — preserved-and-offered, a clash that yields a marked merge and is refused, the
  offer answered and the question closed, and the answer **re-opening when the engine moves**.
- **S10-QA found three product defects that no hand-written fixture could have shown**, each fixed
  test-first: an answer recorded on a brain that cannot name its engine version was written and then
  silently dropped on read; a conflicted `.new` was adoptable blind; and a `merge` glob matched
  `SKILL.md.new` as happily as `SKILL.md`, so every sidecar counted as a file the brain was holding back
  — the engine naming its own offer as a divergence. None of them ever shipped.
- **Every design and exclusion box in the plan re-verified against the code** by read-only agents, not
  against the plan's own prose. S4's audit: 19/19 true. S1's: **two false claims**, struck in place with
  their reason. That asymmetry is why the audit is run per-section instead of sampled.
- **The marketing surface was re-read before the note was written** (CONVENTIONS §10, S9-1a): one
  outright false promise found and repaired — `SETUP.md` swore an update never writes to a skill you
  customized, which S7-5 makes false on purpose — plus six undersells, and one capability (the heal)
  that appeared in no user-facing document at all.

## What is NOT in here

- **S6e — the French `test-first-discipline`** is **dropped** (owner's call, 2026-08-21). Going to write
  it surfaced the real finding — *the FR tree has no owner and no staleness report* — which became **S8**
  and shipped.
- **One field measurement**, carried to the release checklist: whether the S3 write guard's prompt
  becomes noise on a session that legitimately customizes an engine skill. Only living with it answers
  that.
- **The release note's voice and title, the cut, the tag and the publish.** The owner's, always. The
  note itself is drafted to CONVENTIONS §11 and waiting beside the plan
  ([`release-v5.0.0-note.md`](maintainers/plans/prospective/release-v5.0.0-note.md)), with three title
  candidates rather than one picked for him.

## ⚠️ Two things to settle before this can be cut

1. **One arbitration, written at the top of the plan.** A brain keeps its **install-day list of which
   files the engine manages**, forever — an update never advances `regimes`. Consequence, measured: the
   engine half of the constitution, a `merge` family only v4+ declares, is offered *during* an update on
   a pre-v4 brain but never named by the between-updates banner. Three ways out are written down with a
   recommendation; it changes what an update may write on every deployed brain, so it is not the loop's
   call.
2. **The merge order.** This PR's base is `chore/s0bis-entrypoint-mutation-debt`, and **draft PR #75 is
   still open**. Either #75 lands first, or this PR is retargeted to `main` — as it stands, the branch is
   248 commits ahead of `main`, 0 behind, and `git merge-tree` reports no conflict.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01FQohjQbznWkuM8ppf2ieQ7
