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

## 📍 STATE — the only perishable block in this file · opened 2026-09-07

- 🔥 **THIS IS THE ACTIVE PLAN.** The owner's words: *"c'est assez grave"*. It costs real money to
  real people **every day it is not shipped**, and they are the ones who followed the documentation.
- **Next:** step 1. Nothing is started, no code is written, no branch exists yet.
- ❌ **Warning them by hand is OFF THE TABLE** _(owner's call, 2026-09-07)_. There is no list of
  installed brains, and he judged the human route not workable. **So the fix has to travel by
  itself, through the engine update, and the plan is written for that.** Do not re-propose a Slack
  message.
- ⚠️ **The hard constraint, and it shapes everything below:** any fix is engine code, and engine code
  only reaches an existing brain when its owner **updates**. Step 1 alone saves nobody who already
  has a brain. **Step 2 is the one that stops the bleeding**, and step 3 is what makes step 2 arrive.
- **Blocked on:** nothing. A session may start step 1 immediately.
- **A session may, alone:** work test-first on a branch off `main`, push every green commit and read
  its CI. **Not:** touch either of the owner's two real brains, tag, or push to `main`.

## What this plan is NOT allowed to become

- **A brain never runs a build.** The fix is to stop shipping the workflows, never to make them
  cheaper, quieter, or conditional. A brain is data; there is nothing for a CI to protect.
- **Deleting files inside someone's brain is a destructive act**, and step 2 is the first thing in
  this product that does it outside `.claude/skills/`. It is declared, never inferred; it can never
  name `vault/`; and it is pinned by tests before it ships. An absent or unparseable manifest must
  delete **nothing**.

## Tracking

- [ ] **1. A newly created brain carries no CI at all.**
  - [ ] `.github/` joins `DEV_ONLY_PREFIXES` in `scripts/lib/tracked-files.mjs`, the way
        `maintainers/` already does.
  - [ ] Test-first in `tracked-files.test.mjs`: `filterCopyable` keeps no `.github/` path. Assert on
        the real tracked list, not a fixture, so a workflow added later is caught too.
  - [ ] The installer's end-to-end check asserts the generated brain has **no `.github/` directory**.
        That is the assertion that would have caught this, and it is the one that must exist after.
- [ ] **2. A brain already installed loses them at its next engine update** _(the step that actually
      stops the bleeding)_.
  - [ ] Today the update has exactly ONE subtractive bucket, `retireSkills` in
        `scripts/lib/engine-apply-plan.mjs`, and it is scoped to `.claude/skills/`. Widen the
        tombstone so it can retire a **shipped file outside the skills tree**, keeping every guard
        that bucket already earned (declared in the manifest, never inferred from an absence,
        `climbsOut` refused).
  - [ ] A hard refusal, tested: a tombstone that names anything under `vault/` is rejected, loudly.
        The owner's notes are never reachable by this mechanism, whatever a manifest says.
  - [ ] `engine-manifest.json` declares `.github/workflows/**` retired.
  - [ ] The removal is **idempotent and silent when there is nothing to remove**: the overwhelming
        majority of updates must not pay for this, and must say nothing about it.
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
