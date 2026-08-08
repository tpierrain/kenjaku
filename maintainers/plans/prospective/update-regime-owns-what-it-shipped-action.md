<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- STATUS: 🟢 OPEN — 2026-08-08. Design finding raised by the owner. The     -->
<!-- sequencing (does this precede the small universes release?) is HIS call   -->
<!-- and is the first unchecked box.                                          -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Action plan — the engine updates what it shipped, and only stops for what the owner really wrote

> **The owner's framing (2026-08-08), which is the right one and is recorded verbatim in intent:**
> *what we must never lose is the work a person did to extend their brain; everything that came from
> the engine in the first place is a product and should be updatable like one.* His observation is that
> our update regime is **too timid** for a product whose own agent edits files eagerly, and that this is
> a design problem rather than a missing feature.
>
> **This plan agrees, and makes the flaw precise.** The engine already records a merge **base** and
> never merges with it. That single fact produces every symptom we have logged.

## The four categories we actually have (measured 2026-08-08)

| Regime | What it does | Files |
|---|---|---|
| `replace` | overwritten blind at every update | `rag/src/**`, `scripts/**`, `scripts/lib/**`, `engine-skills/**`, the two templates… (41 globs) |
| `regenerate` | rebuilt from this machine | the 6 launchers |
| `merge` | **compared** to a provenance sha; equal → refreshed, different → **preserved forever** + `.new` sidecar | `CLAUDE.md`, `.claude/settings.json`, 10 user-facing skills, 4 scripts |
| **(none)** | **never updated, and nobody decided that** | **`CLAUDE.engine.md`**, `.gitignore` |

- [x] **The fourth category is an omission, not a policy.** It is what froze a v4.8.1 brain's doctrine
      at install day (evidence in `field-finding-2026-08-08-source-first-and-frozen-doctrine.md`) and
      what makes the `.gitignore` migration necessary in `active-universe-follows-the-owner-action.md`.
      Two live plans, one missing category.

## The design flaw, in one sentence

**`merge` owns a merge base and only ever uses it for an equality test.** With a base you can only
compare, there are exactly two possible outcomes — clobber the owner, or abandon the file — and we
chose *abandon*: permanently (a diverged file is never reconsidered), and silently (nothing ever says
"this file is 12 releases behind"). **"Preserve" was implemented as "give up".**

Three consequences, each already logged as its own field finding:

- [x] **A false positive freezes forever.** `field-finding-2026-08-05-silent-skill-freeze.md`: a skill
      with **zero lines of the owner's** was flagged customized and frozen since install. Mechanism,
      now nameable: the staging tree `engine-skills/**` is in `replace`, so **the base moves ahead at
      every update while the installed file stands still**. A base that moves is not a base; the
      comparison it feeds cannot be right.
- [x] **The owner keeps a hand-rolled patch instead of the real fix.** v4.8.1's own release note tells
      Windows owners to *drop the hand-patched launcher* someone gave them — that patch, on a `merge`
      file, would have frozen it. The agent patches an engine defect on the owner's behalf; the engine
      fixes it properly two releases later; the brain that was helped is the one that never receives it.
- [x] **The axis is wrong for this product.** Ownership is decided by **mutation**, in a product whose
      own agent edits files as a matter of course (and whose `/improve` skill actively invites it). So
      "modified = yours" mostly catches **Claude's past edits**, not the owner's deliberate work. The
      right axis is **origin**, plus a way to keep the owner's intent out of engine files in the first
      place.

## What makes the fix affordable (measured, do not re-derive)

- **Provenance is a `sha256:` string, not content** (15 entries on the deployed brain), so it can
  *verify* a base but cannot *be* one.
- **A pristine base already exists on every brain**: `engine-skills/<name>/` holds the engine's own copy
  beside the installed one (verified: after the owner's manual adoption, staged and installed are
  byte-identical). The mechanism is built — it is only **clobbered at each update** and used for `===`.
- **Locale-aware delivery is solved and in production since v4.1.0** (`resolveLocaleSource` +
  `readBrainLocale`), which was the stated reason the doctrine layer was frozen in ROADMAP Gate 1.

## Tracking

- [ ] **S0 — 🛑 SEQUENCING, owner's call, blocks everything below.** Does this precede the small
      universes release, ride after it, or replace Gate 4's F-B7e outright? Recommendation on record:
      **ship the small release** (its migration is unrelated and 90 % done), then make **this** the next
      real subject rather than a Gate 4 line, and **fold `field-finding-2026-08-05-silent-skill-freeze.md`
      into it as a symptom** rather than fixing it separately.
- [ ] **S1 — An immutable base per `merge` file.** Freeze the staged copy at **the version actually
      delivered to the installed file**, instead of overwriting it with the newest one. That one change
      makes the existing comparison correct and kills the silent-freeze false positive by construction.
  - [ ] The recorded `sha256` becomes what it should always have been: the **proof** that the base on
        disk is the right one, checked before any merge.
  - [ ] Decide the base's home for the files that have none today (`CLAUDE.md`, `settings.json`, the
        four scripts): generalize the `engine-skills/` idea, or a single `.engine-base/` tree. Cost is
        a few dozen KB.
- [ ] **S2 — A real three-way merge, so "preserve" stops meaning "abandon".**
  - [ ] untouched → fast-forward (today's behaviour, unchanged);
  - [ ] owner's edit in a region the update does not touch → **merge**: they keep their edit **and**
        receive the update. This is the case that is common today and served worst;
  - [ ] both changed the same region → a **real conflict**, the only case that costs a human anything,
        and the only one that should produce a sidecar or a question.
  - [ ] Markdown-aware where it pays (doctrine and skills are section-structured), line-based otherwise.
- [ ] **S3 — Keep the owner's intent out of engine files, by construction.** A write guard on
      engine-owned paths that redirects to the layer built for it (`CLAUDE.md`, the owner's own skills)
      and asks before letting an edit land in an engine file. Precedent and shape:
      `scripts/vault-write-guard.mjs`. **This is the half that makes the whole model honest**: divergence
      stops being free and silent, so preserving it stops being the hard problem.
- [ ] **S4 — Divergence becomes audible.** A brain says, once, which engine files it is holding back and
      how far behind they are. Absorbs the silent-skill-freeze plan's third defect.
- [ ] **S5 — The doctrine layer joins a regime, as the first client of the new model.**
      `CLAUDE.engine.md` is a special case worth stating: the two-layer design means the owner's edits
      belong in `CLAUDE.md`, so a divergence in the engine layer is nearly always **an accident to
      surface**, not work to protect. Flip `engine-apply-plan.test.mjs`'s deliberate lock with its
      comment rewritten, never deleted quietly.

## The owner's second worry, and it is a different failure (2026-08-08)

> *"Since I moved my own second brain from my homemade one to Kenjaku, a lot of things work less well.
> Either the setup is fragile and our updates never land, or we have a real quality problem: layer upon
> layer added to the doctrine files, and the effectiveness is gone."*

**Measured, both halves are true, and they form a loop.**

- [x] **The delivery half is confirmed** — his ambient doctrine is the one written on **19 July**, while
      he believes he runs v4.8.1. Everything learned since (identity discipline, claim discipline,
      source ordering, backlogs) reached his **skills** and never his constitution.
- [x] **The dilution half is real and has a slope.** `CLAUDE.engine.md` (EN), read **in full at every
      session**: **20 737 bytes on 2026-07-18 → 33 451 on 2026-08-05, +61 % in eighteen days**, about
      **10 KB added on 3 August alone** (the field-findings trilogy). FR today: **37 614**. Nobody chose
      that growth; it is the emergent result of one reflex — *a field finding becomes another paragraph
      in the constitution*.
- [x] **The loop**: the paragraph is added (its cost is paid by fresh installs, forever, at every
      session), it never reaches deployed brains (no benefit), the same defect recurs in the field, so
      another paragraph is added. **This repo already knows this shape**: it is `plans.md`'s own rule
      about `MEMORY.md` and context rot, applied to memory and never to the constitution the launcher
      ships.
- [x] **A third factor was proposed and then WITHDRAWN on measurement — recorded because the mistake is
      instructive.** First claim: *his personal layer was never tailored* (`CLAUDE.md`: 2 commits, both
      from install day), so he compares a brain built around him with a generic one. **False, and the
      owner caught it**: personalization moved to the universes. Measured: `vault/shodo/universe.md`
      **14 063 bytes** and `vault/inqom/universe.md` **3 788** — 18 KB of real context (his rhythm,
      people, topics, connector accounts, the Slack channels and Notion references that matter), even
      carrying its own *"reliability of this page"* section. **The tailoring was done, in the place the
      product now says to do it.** The defect was measuring a file instead of a function.
  - [ ] **What genuinely remains for the personal layer is narrower, and the axis is not
        personal-vs-generic**: `universe.md` is **fetched on demand and scoped to one sphere** (the
        engine states it plainly: *"read it, it is never read to you"* — a session start at most names
        the page), while `CLAUDE.md` is the **only thing always in context, across every universe**:
        tone, the privacy non-negotiables, standing preferences about how the owner wants to be answered
        and challenged. If he has nothing he wants true in **every** sphere, that layer legitimately
        stays thin and there is no gap to close. Do not manufacture one.
  - [x] **The trap he did NOT fall into, worth keeping as a rule**: a behavioural instruction written
        into `universe.md` applies only when that page happens to be retrieved, so it fires
        intermittently and looks like the brain "forgetting". Checked on his: it is descriptive, with
        one or two incidental occurrences of *toujours / jamais*. **Standing behaviour belongs in the
        always-loaded layer; context belongs in the universe page.** That distinction is currently
        written nowhere a user reads.

- [ ] **What follows from it, to arbitrate with S0.**
  - [ ] **A budget on always-loaded doctrine**, enforced like `MEMORY.md`'s: a test that fails when the
        engine layer crosses a ceiling. Not to forbid growth, but to force the arbitration *what comes
        out* instead of letting it be free.
  - [ ] **Change the default home of a finding.** Ranked, cheapest-for-the-session first: a
        deterministic guard (hook / test) > a skill loaded on demand > the always-on constitution. ADR
        0009 already prefers the deterministic mechanism; nobody applied it to **prose volume**. The
        constitution should be the last resort, because it taxes every session forever.
  - [ ] **Measure adherence, stop asserting it.** Every `*-discipline.test.mjs` asserts the rule is
        **present in a file**, never that a brain **follows** it — the same proxy class as
        *"112/112 files indexed"* standing in for *"your brain can read your notes"*. The instrument is
        half-built: `scripts/run-eval.mjs` already scores **retrieval** with a Claude judge over the
        real MCP server; an adherence eval is the same harness with a different question.
  - [ ] **Invite the tailoring.** A first-week prompt to write the personal layer would close more of
        this owner's gap than any engine change listed above.

## The QA instrument — decided 2026-08-08, do not re-open

> Offered: hand-unfreeze `mind-palace` today, as an experiment separating the two failure halves.
> **The owner refused, and he is right**: it is the only deployed brain he has, therefore the only place
> where a structural change to Kenjaku can be observed on a real installation. Hand-patching it is the
> thing this repo tells its own users not to do (v4.8.1's note: *drop the hand-patched launcher*), and it
> is the reaper-instead-of-the-fix shape the previous plan already refused.

- [x] **`mind-palace` is NOT touched.** Its frozen state is evidence, and it becomes the **acceptance
      test** of S1-S5: the doctrine must arrive there **through the mechanism**, or the mechanism does
      not work. The owner keeps a degraded ambient doctrine until then — a real cost, and the reason
      this plan should not sit in a queue.
- [x] **But a live brain is a SINGLE-USE test**, which is the argument the refusal did not need but has:
      the moment anything unfreezes it — hand or mechanism — the frozen state is consumed, permanently.
      One observation, non-reproducible, and a bug in the mechanism burns the only sample. So a
      replayable fixture is **not optional**, whichever way the live brain is used.
- [ ] **The fixture needs none of his files — the drift is reproducible from public tags.** Measured:
      the brain was installed **19 July** (tags of that day: `v3.6.0`, `v3.6.1`) and its own git history
      carries the engine updates it then took (`v4.5.0` → `v4.8.1`). Replaying *install at the 19-July
      tag, then update through each tag* reproduces **exactly** the state observed: skills refreshed,
      `CLAUDE.engine.md` untouched since install. Deterministic, CI-able on every commit, and free of
      one byte of personal data.
  - [ ] Home + convention already exist: `maintainers/qa/release-fixtures/<version>/` (`.claude/` +
        `engine-manifest.json`, built from tags — same shape, new use).
  - [ ] **If the drift turns out NOT to reproduce**, that is itself a finding: something in his install
        is doing the freezing, and we would have been debugging the wrong mechanism.
- [x] **Never copy the brain into this repo.** `tpierrain/kenjaku` is **public**; his `CLAUDE.md` carries
      his name, and `settings.json` / `.mcp.json` carry this machine's absolute paths. What is captured
      here is **measurements**, not files — see the § above, which is the acceptance target.

## The counter-argument, kept because it is the real constraint

"Everything engine-born is updatable like a product" is right **as an ownership rule** and wrong **as an
overwrite rule**: an owner who deliberately tailored an engine skill did real work, and `/improve`
exists to encourage exactly that. Replacing it blind is precisely the trust breach the owner named. The
three-way merge is what lets both statements be true at once — the engine keeps shipping, the person
keeps their work, and a human is asked only when the two genuinely collide.

> Links: `field-finding-2026-08-05-silent-skill-freeze.md` (symptom 1, folds in here),
> `field-finding-2026-08-08-source-first-and-frozen-doctrine.md` (symptom 2, and the measurement),
> `engine-managed-file-merge-strategy.md` (Gate 4's F-B7e, which this supersedes in scope),
> `scripts/lib/engine-skill-refresh.mjs`, `scripts/lib/staged-skills.mjs`, `scripts/vault-write-guard.mjs`.
