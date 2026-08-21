<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- STATUS: ▶️ LIVE since 2026-08-21. THE canonical plan for finishing        -->
<!-- v5.0.0. It is SELF-SUFFICIENT: every decision it needs is written out     -->
<!-- below, never fetched from another file. Built in the orchestrated /loop   -->
<!-- mode described in agent-orchestrated-release-mode-action.md.              -->
<!-- Branch: feat/engine-base-unfreeze · draft PR #76 · nothing tagged.        -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Action plan — v5.0.0 unfreezes the brains that are ALREADY frozen

> ## ▶️ WHERE THIS RESUMES
>
> **RESUME AT: S7-0, the DESIGN slice.** Nothing has been built on this plan yet. Write the design
> into this file and commit it before a line of code, per the loop's own contract.
>
> **Why this plan exists, in one paragraph.** The engineering of the unfreeze release is *done* and
> sits on `feat/engine-base-unfreeze` (105 commits, S1 through S6). It was two hours from being
> published when a measurement stopped it: the release is named *"the engine owns what it shipped"*
> and it **unfreezes nobody who is already installed**. Every Kenjaku in the world today is frozen,
> and the release as built only fixes brains installed **from v5.0.0 on**. The owner's call, taken in
> conversation on 2026-08-21: **do not publish in that state.** This plan is what closes the gap, plus
> the French items found in the same conversation.

---

## 🔒 THE DECISIONS THIS PLAN INHERITS — copied here on purpose, never fetched

These are **decisions**, not statuses. A decision cannot drift, so copying it cannot create a lie;
a status drifts, which is why none is copied. **Do not open the archived plan to check any of these.**

- [x] 🎯 **`CLAUDE.md` is merge-governed, not inviolable** _(owner, 2026-08-21)_. The engine may lay
      down the output of a three-way merge from a **provable** base, never a copy, never on a conflict.
- [x] 🛑 **THE TRAP, and it is the one thing to re-read before touching the base tree**: the disk takes
      the **MERGE**, the base advances to the **CANDIDATE**. Record the merged bytes as the ancestor and
      the next update reads the file as untouched and fast-forwards straight over the edit just
      preserved. Pinned by `release-fixture-doctrine.test.mjs`, Pole C.
- [x] ✂️ **S6e is DROPPED** _(owner, 2026-08-21)_. No French `test-first-discipline` ships. Its only
      reader is Claude deciding how to test; it is reached by no user phrasing; a FR brain already
      receives the English and works. The real finding it uncovered is **S8** below.
- [x] 📐 **THE LOCALE DOCTRINE, decided in the same conversation.** A skill gets a French file if and
      only if the person **reads sentences it dictates**, or **types words the English `description`
      would not match**. Otherwise it stays English. And when only the door's NAME differs, the answer
      is an **alias**, not a translation:

      | Cas | Réponse | Forme |
      |---|---|---|
      | Another word is typed for the same door (`/univers` vs `/switch`) | **alias** | ~700-byte stub, literal routing, no rules |
      | The person READS sentences the skill dictates | **translation** | substitution, full file |
      | The only reader is Claude (`test-first-discipline`) | **nothing** | English suffices |

- [x] ⚠️ **ONE release-note claim stays forbidden whatever this plan achieves**: *the merge does not
      reach BACK*. Files the owner had **already edited before v5.0.0** can never acquire an ancestor
      (a base seeds only from bytes that still match a known delivery, and an edited file matches
      none; it cannot seed from the fetched copy either, which is *theirs*, not the ancestor). ✅ The
      true sentence: *files you edit from this version on will merge; the ones you had already changed
      keep standing untouched, with the new version beside them, and the update says so by name.*
- [x] 🔓 **The OTHER forbidden claim falls if S7 ships.** *"The doctrine layer unfreezes no
      already-deployed brain"* was true of the release as built. S7 exists to make it false. **The note
      may not be written until S7's verdict is known.**

---

## 📐 THE FACTS ALREADY MEASURED — so nobody re-derives them

- [x] **The whole fleet is frozen**: `CLAUDE.engine.md` is absent from every regime at all nine
      published tags (`v3.6.0` → `v4.9.1`), while its content grew 23 504 → 33 531 bytes. It was never
      a bug in the update path; it was a file nothing declared.
- [x] **The freeze has a face, and it is the owner's.** The behavioural rule *"Jamais de `- [ ]`
      muet"* has been in the repo's FR doctrine **since 2026-08-05** and is **absent from both real
      brains** (`mind-palace`, `autre-brain`), measured 2026-08-21. As built, v5.0.0 would leave it
      absent: no provenance → preserved and reported, never delivered.
- [x] **The locale marker is safe.** `scripts/lib/demo-locale.mjs` exists on **every tag back to
      v3.2.2**, is locale-owned (excluded from the copy, with its own test), and `readBrainLocale`
      fails soft to `en`. No brain can be mislabelled, and no update can make a brain forget it is
      French.
- [x] **The FR doctrine IS delivered at install** — verified on the two real brains, both in French.
      What v5.0.0 changes is that it becomes **updatable**.
- [x] **`resolveLocaleSource` predates this branch** (used by the skill refresh at v4.9.1). v5 extends
      it to two more families through the shared carrier. An extension, not a regression.
- [x] **The one FR-tree deletion already in the branch is safe**: `decideSkillRetirement` decides on
      **provenance**, so it is blind to language.
- [x] **The FR drift, measured**: the FR doctrine lacks exactly one commit (`8341e18`, a doc precision
      on the active universe). `sync` FR is two months behind its EN source at half the size. ⚠️ This
      drift was first measured BY HAND and the measurement was **wrong** (a same-day date boundary
      mislabelled `004d208` as missing when it is present). That error is the argument for S8-2.

---

## Tracking

- [ ] **S7 — the frozen fleet is healed.** The reason the release is not published.
  - [ ] **S7-0 — THE DESIGN**, written into this file before a line of code.
  - [ ] **S7-1 — a second source of proof** for a base.
  - [ ] **S7-2 — the historical fingerprint table**, and the guard that keeps it fresh.
  - [ ] **S7-3 — the wiring**, so a real update consults it.
  - [ ] **S7-4 — the QA**: a brain rebuilt from a real tag now **RECEIVES**.
- [ ] **S8 — the French tree stops drifting in silence.**
  - [ ] **S8-1 — port `8341e18`** into `templates/fr/CLAUDE.engine.md`.
  - [ ] **S8-2 — the EN/FR drift guard**, a test.
  - [ ] **S8-3 — the FR replay QA.**
  - [ ] **S8-4 — the locale doctrine recorded** as an ADR.
- [ ] **S9 — the release tail.**
  - [ ] **S9-1 — the release note**, rewritten now that one forbidden claim may fall. Owner's tone.
  - [ ] **S9-2 — cut, tag, publish.** Owner's, always.
  - [ ] **S9-3 — the field measurement** carried to the release checklist.

---

## 🧊 S7 — the frozen fleet is healed

- [ ] **S7-0 — THE DESIGN.** _(the loop's contract: a design slice ships a written design and stops.)_
      The shape below is the sketch that justified reopening the release. **It is not the design.**
      S7-0's job is to check every claim in it against the code and write what survives.

  - [ ] 💡 **The idea, in three lines.** If an installed file's digest matches **any version the engine
        ever published**, then that file **is** that version, untouched. So the ancestor's bytes are
        already on the disk; only the **proof** was missing. The brain seeds itself, exactly as S1's
        migration already does for files that have a recorded provenance.
  - [ ] 📦 **We ship digests, not bytes.** ~15 merge-regime files × ~10 tags = ~150 sha256, about 10 KB.
        The exclusion this reopens (*"a release-time generation pipeline, not a report"*) was right
        about the pipeline and wrong about the cost: it assumed shipping historical **content**.
  - [ ] 🔑 **THE CRUX, and the one place the contract really changes.** `planBaseSeed` deliberately
        carries **no sha** today: *"the record already exists and already matches, and a second writer
        for one fact is drift."* For a healed file **there is no record**. So the seed must now write
        the provenance too. Get this wrong and the file seeds a base nothing can prove, which is the
        `mismatch` state, i.e. worse than the freeze.
  - [ ] ⚖️ **What it heals and what it does not.** Heals: every brain whose engine files are untouched
        (the majority, including the owner's two). Does not heal: files the owner edited, whose digest
        matches nothing. Those stay preserved **and reported** — and that is the forbidden claim n°2
        above, which S7 does **not** change.
  - [ ] 🚨 **The risk to design against, not to discover later**: this table must be **regenerated at
        every release** or it goes stale, which is this repo's signature defect committed one level up.
        Generation is scripted and guarded by a test, never done by hand.
  - [ ] ❓ **Questions S7-0 must answer in writing**: which files the table covers (all `merge`, or
        only those with a real freeze history?); where it lives (`engine-manifest.json` or a sibling —
        the manifest is read at every update, so 10 KB there is a cost to state); what a match against
        an OLD version implies for `baseRefs` (we learn the version too, for free, so does S4's
        divergence notice become accurate for the healed fleet?); and whether a healed file must be
        **reported** on the update that heals it, or land silently.

- [ ] **S7-1 — a second source of proof.** `verifyBase` / `planBaseSeed` accept a known historical
      digest beside the recorded provenance. Pure, test-first, and the seed now carries its sha.
- [ ] **S7-2 — the historical fingerprint table**, generated from the published tags by a maintainer
      script, plus the test that fails when the table does not cover the release being cut.
- [ ] **S7-3 — the wiring**: the seed pass consults the table, on all three writers, as S1 did.
- [ ] **S7-4 — the QA, and it is the acceptance test of this plan.** Extend
      `release-fixture-doctrine.test.mjs`: a brain rebuilt from `v3.6.0` with **no provenance at all**
      must now **RECEIVE** the doctrine. Today the same suite asserts the opposite (Pole A: preserved,
      `no-provenance`). **That inversion is the deliverable** — the old assertion is rewritten with its
      reason, never deleted quietly, because it recorded a truth that this plan is removing.

---

## 🇫🇷 S8 — the French tree stops drifting in silence

- [ ] **S8-1 — port `8341e18`** into `templates/fr/CLAUDE.engine.md`: the precision that the active
      universe is committed, so it follows the owner between machines (ADR 0034). One paragraph.
- [ ] **S8-2 — the EN/FR drift guard.** A test that fails when a `templates/fr/<rel>` pair has fallen
      behind its English source. It judges **no translation quality**: it makes the omission impossible
      not to see, exactly like the plan-carrier guard. **The argument for it is on the record**: the
      same drift was measured by hand in conversation and the measurement was wrong.
      - [ ] Decide the criterion in writing before coding: last-commit dates are the cheap signal but
            they misfire on same-day commits (that is precisely the error made). A commit-count or
            last-common-ancestor comparison may be the honest one. **Design first.**
      - [ ] It must name `sync` FR (two months, half the file) on its first run, or it does not work.
- [ ] **S8-3 — the FR replay QA.** A pole in the release fixtures for a **French** brain: it must
      receive the FR doctrine, not the English one, through a real update. Today one unit test covers
      this (`engine-doctrine-refresh.test.mjs`); nothing covers it end to end.
- [ ] **S8-4 — the locale doctrine recorded as an ADR** (the three-row table in the decisions block
      above). Check first whether an existing ADR owns localization: CONVENTIONS §6bis says one ADR per
      topic, and S3 amended 0012 rather than opening 0038 for exactly this reason.

---

## 🏁 S9 — the release tail

- [ ] **S9-1 — the release note.** Owner's tone (`release-notes-tone`: written for non-devs first,
      never alarmist). **Blocked until S7's verdict is known**, because one of its two forbidden claims
      falls if S7 ships. The three user-facing sentences of the divergence notice are his too.
- [ ] **S9-2 — cut, tag, publish.** The owner's, always.
- [ ] **S9-3 — the field measurement**, carried to the release checklist rather than to a slice: do the
      write guard's prompts become noise on a session that legitimately customizes an engine skill?
      Correct the first time, noise the tenth. Only living with the guard for a few days answers it,
      and the escape hatch (`/permissions`) already exists.

---

## 🚫 Deliberately OUT of this plan

- [ ] **Recording the LANGUAGE beside `baseRefs`**, so a locale flip is reported instead of performed.
      Real, and designed in conversation, but **no bug requires it**: the only FR-tree change shipping
      is the safe retirement. It protects against a future removal of a translation. Its own chantier.
- [ ] **Row-2 seeding** (a base for a no-record file holding the engine's exact bytes). Inherited
      exclusion from S2. ⚠️ **Re-read it during S7-0**: S7 is close enough to this that the two may in
      fact be the same slice, and shipping them apart would be building one mechanism twice.
- [ ] **The always-loaded constitution's growth.** Measured and parked, not v5 work: `CLAUDE.engine.md`
      grew **+61 % in eighteen days** (20 737 → 33 451 bytes), read in full at every session, because
      one reflex sends every field finding into the constitution. What follows (a budget enforced by a
      test; changing a finding's default home to a deterministic guard or an on-demand skill before the
      always-on layer) is a chantier to arbitrate with the owner. **Do not start it here.**

---

## 📜 History — do NOT open this by default

Everything that shipped on this branch (S1 through S6: the base tree, the three-way merge, the write
guard, the divergence notice, the doctrine layer, the skill retirement) was built under a previous
plan, now **archived and closed**. Its design record lives at
`maintainers/plans/archived/update-regime-owns-what-it-shipped-action.md`.

**You do not need it to work this plan**, and it is ~2 200 lines: opening it costs context and returns
nothing actionable. Every decision it holds that still binds has been copied above. Open it only when
investigating **how a shipped mechanism was designed** — never to find out where the work stands.
