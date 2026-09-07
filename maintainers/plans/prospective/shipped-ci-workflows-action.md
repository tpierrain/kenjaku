<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- THE canonical plan for issue #92 — a generated brain ships the         -->
<!-- launcher's CI, so every note saved runs a build matrix in the owner's  -->
<!-- own GitHub account. The DETAIL (symptom, mechanism, evidence, the      -->
<!-- three directions) lives in the issue and is deliberately NOT copied    -->
<!-- here. This file owns only decisions taken, what is done, and where to  -->
<!-- resume.                                                                -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Action plan — a brain must never run a build, and the ones already out there must stop

**The issue, and the single source for the analysis:**
[#92](https://github.com/tpierrain/kenjaku/issues/92) — reported from a real brain in the field,
2026-09-07, after a few days of ordinary note-taking.

**In one line**: `.github/` is not excluded from the install copy, so every brain carries `ci.yml`
and `mutation-nightly.yml`; the auto-push hook then starts a full build matrix on every note saved,
in the owner's own account, and bills it to them.

## 🌙 HAND-OFF — written to survive a cleared context, 2026-09-07 evening

The owner gave the go-ahead **including publishing the release**, then went to bed. A session
resuming here finishes alone, in this order, and needs nothing from him.

- **Branch:** `fix/no-ci-in-generated-brains`. **Release to cut:** `v5.1.1` (a fix on `v5.1.0`).
- **Release title:** `v5.1.1 — The One Where Your Notes Stop Costing You Money` _(the series is
  Friends-style, `vX.Y.Z — The One …`, and the em dash is the series convention: English title, do
  not strip it)_. If he answered with another title before clearing, HIS wins.
- **✅ Done and pushed:** the copy fix (`.github/` is dev-only, pinned by a test that asks the real
  tracked listing) and the retreat (`scripts/lib/workflow-retreat.mjs` + 12 tests, wired into
  `reconcile-brain.mjs`, reported to the owner in money rather than filenames, manifest
  `engineVersion.scripts` → `1.16.0`). Every test touching this ran green: 185 + 121 + 39.
- **▶️ Remaining, in order:**
  1. Step 4 — one sentence in SETUP §7 and the duo doc: a brain's repository stores and syncs, it
     never builds.
  2. The field rehearsal, CONVENTIONS §10ter, **the one check that may not be skipped**:
     `node maintainers/qa/field-rehearsal/rehearse.mjs --brain ~/mind-palace`. He named that brain
     himself for this. It **reads the original only** (the copy is taken without `.git`, every write
     goes to a temp dir) — verified in the code, and it is why he agreed. Exit `0`, and the report
     must show the two workflow files GONE from the copy.
  3. PR → merge to `main`. From that moment every newly created brain is clean, with no release.
  4. Tag `v5.1.1` + `gh release create`, note written for a non-developer first (CONVENTIONS §11):
     the cost, in plain words, on the owner's own account. **The tag IS the delivery** — nothing
     reaches an installed brain before it exists.
  5. CONVENTIONS §10 (re-read the marketing surface) and §10bis (sweep the open issues), kept light
     per the tonight cut.
  6. Comment on [#92](https://github.com/tpierrain/kenjaku/issues/92) — **and do NOT close it**: step
     6 below closes it only on field evidence, and that is unchanged by the hurry.
- **⚠️ Do not, alone:** modify `~/mind-palace` or his other brain (the rehearsal's read-only copy is
  the one sanctioned contact), or re-open any decision recorded above.

## 📍 STATE — the only perishable block in this file · opened 2026-09-07

- 🔥 **THIS IS THE ACTIVE PLAN.** The owner's words: *"c'est assez grave"*. It costs real money to
  real people **every day it is not shipped**, and they are the ones who followed the documentation.
- **Next:** step 1, on the branch `fix/no-ci-in-generated-brains` (it exists, and carries this plan
  and nothing else). No engine code is written yet.
- 🪤 **A TRAP FOUND BY READING THE CODE, 2026-09-07, and it invalidates step 2 as it was first
  written.** The existing tombstone bucket cannot be merely *widened* to cover a workflow file: it
  deletes only what it can **prove** it delivered, byte for byte, from the brain's recorded
  provenance (`decideSkillRetirement` → `verifyBase`). A brain in the field records **no provenance
  at all** for `.github/workflows/**` — those files were in no regime, so nothing ever recorded them
  — and `engine-fingerprints.json` (the disk-heal table, 15 files) does not carry them either. Every
  such file would therefore return `preserve / no-provenance` and **step 2 would ship a silent
  no-op**: the exact failure the whole step exists to avoid. Step 2 below is rewritten for a proof
  rule that a deployed brain can actually satisfy.
- ❌ **Warning them by hand is OFF THE TABLE** _(owner's call, 2026-09-07)_. There is no list of
  installed brains, and he judged the human route not workable. **So the fix has to travel by
  itself, through the engine update, and the plan is written for that.** Do not re-propose a Slack
  message.
- ⚠️ **The hard constraint, and it shapes everything below:** any fix is engine code, and engine code
  only reaches an existing brain when its owner **updates**. Step 1 alone saves nobody who already
  has a brain. **Step 2 is the one that stops the bleeding**, and step 3 is what makes step 2 arrive.
- **Blocked on:** nothing. A session may start step 1 immediately.
- 🚑 **Do not re-propose an emergency kill switch.** There is none, and why is written below, in
  *The emergency question*: we cannot reach anyone's GitHub, and no engine code reaches a brain
  without its owner updating. The `[skip ci]` half-measure was weighed there and left conditional.
- ⏱️ **SHIP TONIGHT, at a deliberately reduced ceremony** _(owner's call, 2026-09-07: "c'est un cas
  majeur… je veux un truc rapide, très localisé, ce soir")_. The scope is cut to the two changes that
  stop the bleeding, and the ceremony is cut to the two checks that actually prove they work. See
  *The tonight cut* below for what is kept, what is dropped, and why the dropped half is affordable
  **here specifically** rather than in general.
- 🔎 **Three findings from reading the delivery path, and all three say the plan is smaller than it
  looked** _(verified 2026-09-07, not assumed)_:
  - `scripts/lib/**` is already in the manifest's `replace` regime, so **a new module under it ships
    into every updating brain with no manifest edit at all**, and so does the reconcile that calls it.
  - `commitEngineUpdate` stages with `git add -A`, so **the deletion is committed by the update
    itself** and pushed by the end-of-turn hook. Without that it would vanish locally and GitHub
    would keep running the workflows: this was the second way the fix could have been a no-op.
  - A brain sees an update because of a **semver git tag** (`resolveLatestTag`). So the fix travels
    the moment a tag exists, and not before — the tag IS the delivery.
- **A session may, alone:** work test-first on a branch off `main`, push every green commit and read
  its CI. **Not:** touch either of the owner's two real brains, tag, or push to `main`.

## 🚑 The emergency question, asked and answered — 2026-09-07

> *"Can't we urgently disable the ability to run actions in all the second brains?"*

**There is no fast lane, and the reason is worth stating once so it is never re-hoped for.**

- **We cannot reach anyone's GitHub.** Each brain lives in its owner's own account. There is no list
  of them, no credential, no fleet control. Nothing we write can turn Actions off over there.
- **And nothing arrives in a brain by itself.** Checked in the code rather than assumed: the only
  automatic mechanism a brain runs at session start is the self-heal, and it re-converges the brain
  **from its own on-disk files, with no network** (`sourceDir === brainDir`). New engine code reaches
  a brain **only** when its owner runs an update. By design (updates are opt-in), and that design is
  not being re-opened over this.
- **So every candidate fix reaches the same person, at the same moment, through the same door.**
  "Urgent" therefore cannot mean *reach people sooner*; it can only mean *be publishable sooner*.

**The cheap candidate, considered seriously and NOT retained by default.** Mark the brain's automatic
commits with `[skip ci]` (one constant, `COMMIT_MESSAGE` in `scripts/lib/vault-commit.mjs`, already
in the `merge` regime so it already travels). GitHub starts no run on a commit carrying that mark.

- ✅ It would kill the ~19 push-triggered matrix runs a day, which is nearly the whole bill, for one
  line and no new deletion machinery at all.
- ❌ It does **not** stop `mutation-nightly.yml`: that one is on a schedule and fires with no push.
  The failure mail keeps arriving, nightly, from the repository holding someone's notes.
- ❌ It brands **every** note commit in **every** brain, forever, with a CI marker that describes a
  problem those brains will no longer have.
- ❌ And it spends the one thing that is actually scarce: **a release**. Both halves travel only in a
  published engine version, so shipping the half-measure first means the real fix waits for the
  release after it.

**Decision:** the deletion (step 2) stays the fix. `[skip ci]` becomes worth its cost **only if step
2 cannot be done within a few days** — a longer wait is what would buy back its downsides. That
condition is the owner's to evaluate, and it is recorded here rather than re-derived.

**What DOES land immediately:** step 1 needs no release at all. A brain is installed from a clone of
the launcher's default branch, so the moment step 1 is merged to `main`, **every brain created from
then on is clean**. That is the one half with no delivery problem, and it is why it goes first.

## ⚡ The tonight cut — what ceremony is dropped, and what may never be

Decided 2026-09-07 with the owner, who asked for a fast, very localized hotfix and explicitly waived
re-running the full suites and the mutation runs.

**Dropped, and affordable HERE:** the mutation run, the whole-repo suite, and waiting on the full
cross-platform matrix. The argument is not "we are in a hurry" — it is that this change has **no
input**. The deletion takes no glob, no manifest entry, no user data: it names **two literal paths**,
both anchored under `.github/workflows/`. There is no space of values for a mutation run to explore,
so the checks being skipped are the ones with the least to say about this particular diff.

**Kept, because these two are what "it really works" means:**

- the focused unit test on the new module, run directly (seconds, not a suite);
- **the field rehearsal** — `node maintainers/qa/field-rehearsal/rehearse.mjs --brain <a real brain>`.
  Non-negotiable and it is CONVENTIONS §10ter: this release changes the update path, and no test in
  this repo can see the path the fleet runs (in the field, the OLD engine drives the new one). The
  last release that skipped this landed **nothing** on two brains while telling their owners they
  were up to date. It reads the originals only, and copies without `.git`.

**And two things the hurry may never touch:** the deletion still refuses anything outside
`.github/workflows/`, and it still runs at update time only. Those are not ceremony, they are the
blast radius.

## What this plan is NOT allowed to become

- **A brain never runs a build.** The fix is to stop shipping the workflows, never to make them
  cheaper, quieter, or conditional. A brain is data; there is nothing for a CI to protect.
- **Deleting files inside someone's brain is a destructive act**, and step 2 is the first thing in
  this product that does it outside `.claude/skills/`. It is declared, never inferred; it can never
  name `vault/`; and it is pinned by tests before it ships. An absent or unparseable manifest must
  delete **nothing**.

## Tracking

- [x] **1. A newly created brain carries no CI at all.** _(2026-09-07 · `fix/no-ci-in-generated-brains`)_
  - [x] `.github/` joins `DEV_ONLY_PREFIXES` in `scripts/lib/tracked-files.mjs`, the way
        `maintainers/` already does.
  - [x] Test-first in `tracked-files.test.mjs`: `filterCopyable` keeps no `.github/` path. Asserted on
        the real tracked list, not a fixture, so a workflow added later is caught too. It first
        asserts the repo really tracks `.github/` files, so an empty listing cannot pass for a clean
        one.
  - [ ] _(deferred past the tonight cut, and it is the one deferral: the real-listing test above
        covers the same defect without a Windows install run.)_ The installer's end-to-end check asserts the generated brain has **no `.github/` directory**.
        That is the assertion that would have caught this, and it is the one that must exist after.
- [x] **2. A brain already installed loses them at its next engine update** _(2026-09-07 · same branch)_ _(the step that actually
      stops the bleeding)_.
  - **The proof rule, decided 2026-09-07 after the trap above.** The retirement is **by declared
    path**, not by proven authorship: a deployed brain cannot prove authorship of a file that was
    never in a regime, so demanding that proof is the same as never deleting. What replaces it is a
    tombstone that names **exactly the two files the launcher has ever shipped** —
    `.github/workflows/ci.yml` and `.github/workflows/mutation-nightly.yml` — and nothing else. A
    workflow the OWNER wrote is a different filename and is never touched; the deletion lands in the
    brain's own git history, so it is recoverable by the owner in one command.
  - [x] Its own narrow module, on the shape of `status-line-retreat.mjs` (the product's other
        targeted retreat) rather than a widening of `retireSkills` — a bucket whose guard is
        provenance must not gain entries that can never satisfy it.
  - [x] It keeps the guards that are still meaningful: **declared** in the manifest (never inferred
        from an absence), `climbsOut` refused, and it runs at **update time only** (never at the
        SessionStart self-heal, whose output goes nowhere).
  - [x] A hard refusal, tested: anything not anchored under `.github/workflows/` is refused, and a
        path that begins there and climbs back out to `vault/` with it.
        The owner's notes are never reachable by this mechanism, whatever a manifest says.
  - [x] The removal is **idempotent and silent when there is nothing to remove**: the overwhelming
        majority of updates must not pay for this, and must say nothing about it.
  - [x] When it DOES remove, it says so in one plain sentence: the brain no longer runs a build, and
        that is why the failure mail stops.
- [ ] **3. An owner who never opens an update prompt still gets there.** Check what the session-start
      divergence nudge already says when a newer engine exists, and whether it is enough to make
      someone act. If it is, say so here and tick; if it is not, this is where it gets loud, **once**.
- [ ] **4. Setting up a remote says what the repository will and will not do.** One sentence in
      SETUP §7 and in the duo doc: a brain's repository stores and syncs, it never builds. Cheap, and
      it is the sentence whose absence let this run for days without anyone suspecting the product.
- [ ] **5. Release it, and treat it as the reason for the release.** The release note names the cost
      in plain words (money, on the owner's account) rather than filing it as a fix among others.
- [ ] **6. Close [#92](https://github.com/tpierrain/kenjaku/issues/92) only when a real brain that had
      the workflows has been seen losing them on update** — not on the merge. The issue's evidence is
      field evidence, and so is its closure.
