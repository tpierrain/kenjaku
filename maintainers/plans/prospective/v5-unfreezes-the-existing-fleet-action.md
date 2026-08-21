<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- STATUS: ▶️ LIVE since 2026-08-21. THE canonical plan for finishing        -->
<!-- v5.0.0. It is SELF-SUFFICIENT: every decision it needs is written out     -->
<!-- below, never fetched from another file. Built in the orchestrated /loop   -->
<!-- mode described in agent-orchestrated-release-mode-action.md.              -->
<!-- Branch: feat/engine-base-unfreeze · draft PR #76 · nothing tagged.        -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Action plan — v5.0.0 unfreezes the brains that are ALREADY frozen

> ## ✅ WITHDRAWN — the "does the heal unlock RETIREMENT?" arbitration was a FALSE ALARM
>
> _(Raised at S7-0, withdrawn 2026-08-21 when the owner asked for concrete cases and the premise was
> measured instead of assumed. Kept here as the record, because a question that looked destructive and
> turned out to be empty is worth not re-opening.)_
>
> It asked whether healing would let the update that unfreezes the doctrine also **delete** a retired
> skill. **It cannot, for two independent reasons, either of which alone closes it:**
>
> - [x] 🔒 **A retired rel can never be healed, by construction.** The candidate set comes from
>       `selectMergeFiles`, which already subtracts the manifest's `retired` tombstones. So the healed
>       map and the recorded map are **identical from retirement's point of view**, always: handing
>       either one to `decideSkillRetirement` produces the same verdict. Pinned by the S7-1 test
>       *"a RETIRED file is never healed, however well the table knows its bytes"*.
> - [x] 📐 **And the premise was wrong anyway.** `tdd-discipline` was in the `merge` regime at **all 25
>       published tags** and tombstoned only on this branch, so every deployed brain recorded a
>       provenance for it at install. **Measured on both real brains 2026-08-21**: `mind-palace`
>       (v4.9.1) and `autre-brain` (v3.5.0) each hold 15 provenance entries, and
>       `.claude/skills/tdd-discipline/SKILL.md` is one of them. Its retirement was never blocked on
>       `no-provenance`; it already resolves on the recorded sha (removed if untouched, kept and
>       reported if the owner edited it).
>
> **What survives, and it is NOT v5 work.** The 9 **staged** skills (`consolidate`, `file-back`,
> `lint`, `local-mirror`, `mcp-token-expired`, `open-note`, `rag`, `univers`, `universe`) are on the
> disk of both brains with **no provenance** and are named by no `merge` glob. The day one of them is
> retired, it will be unremovable for exactly the reason this box imagined. **None is retired today**,
> so it is a question for whoever writes that tombstone, not for this release. Its answer will be the
> same trade-off: leave an inert orphan on the disk, or widen the table to cover retired rels and let
> an update delete a file on the strength of a historical digest.
>
> ## ▶️ WHERE THIS RESUMES
>
> **RESUME AT: S7-2 — the fingerprint table and its freshness guard.** S7-0 (design) and S7-1 (the
> heal) are **done** _(2026-08-21)_. `healProvenance` exists, is green and measured at **96.43 %**;
> nothing it needs is missing except **the table itself**, which is why S7-2 is next and not S7-3.
> Read **§ S7-0** before writing the generator — in particular the two claims that decide whether it
> works at all: generate under **HEAD's** regime (not each tag's own), and carry the **FR** sources.
>
> ## 🆕 THE RELEASE GREW, and it grew on the owner's word _(2026-08-21, after S7-1)_
>
> **S10 is new v5 cargo**: a personalized file must become a **question with three offers**, never a
> blind spot. He was offered v5.1 and answered *"c'est le comportement que j'attends pour la version
> 5"*. Read the acceptance criterion in the decisions block — it is quoted, not paraphrased.
>
> **Execution order is S7 → S8 → S10 → S9.** S9 (cut, tag, publish) is LAST and its note cannot be
> written before S10's verdict, because S10 is what makes the second forbidden claim harmless.
>
> ⚠️ **Do not read this as "S7 was a detour".** S7 is what modernizes the files nobody touched, which
> is the majority of the fleet and the first half of his criterion. S10 is the second half: what to do
> about the rest. They are two halves of one sentence.
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

- [x] 🎯 **THE RELEASE'S ACCEPTANCE CRITERION, stated by the owner 2026-08-21 and binding on v5.0.0.**
      *"Quelle que soit la version installée au préalable, je veux qu'un update modernise tous les
      skills, les compétences, les comportements qui font partie de Kenjaku à la base. À l'exception de
      ce qui aura été personnalisé. Et dans ce cas-là, je veux que Kenjaku analyse la situation et
      propose un choix simple, lisible pour un utilisateur qui n'est pas informaticien."* The three
      offers, in his words: **take the new Kenjaku version**, **keep yours as it stands**, or **combine
      the two** so the improvement lands without losing what you added.
      🛑 **And the sentence that judges the release**: *"je ne veux plus de fichiers éclipsés ou
      d'angles morts sur les fichiers sous prétexte qu'ils ont été modifiés."* **"It was modified" may
      never again be a reason to do nothing and say nothing.** This is **S10**, and it is v5 cargo, not
      a follow-on: asked whether it could ship as v5.1, the owner answered *"c'est le comportement que
      j'attends pour la version 5"*.

- [x] ⚠️ **The claim that WAS forbidden, and the exact condition under which it falls.** *The merge
      does not reach BACK*: files the owner had **already edited before v5.0.0** can never acquire an
      ancestor (a base seeds only from bytes that still match a known delivery, and an edited file
      matches none; it cannot seed from the fetched copy either, which is *theirs*, not the ancestor).
      **That remains true of the MECHANICAL merge and S7 does not change it.** ✅ **But S10 makes the
      user-facing claim true anyway**, because a three-way merge is not the only way to combine two
      texts: the brain **is** a Claude session, and what the engine cannot merge for lack of an
      ancestor, a reading can. The honest sentence once S10 ships: *whatever you had changed, the
      update shows you what moved and lets you choose; nothing is decided behind your back and nothing
      is left in limbo.*
      ⚠️ **Measured, and worse than the plan described it until 2026-08-21**: in the no-ancestor case
      the engine drops **no copy beside the file at all** (`applyMergeGoverned` gives a
      `no-provenance` preserve no sidecar). The owner gets one sentence saying we cannot tell their
      edits from ours, and nothing else. **That is the deepest of the blind spots S10 closes.**
- [x] 🔓 **The OTHER forbidden claim falls if S7 ships.** *"The doctrine layer unfreezes no
      already-deployed brain"* was true of the release as built. S7 exists to make it false. **The note
      may not be written until S7's verdict is known.**

---

## 📐 THE FACTS ALREADY MEASURED — so nobody re-derives them

- [x] **The whole fleet is frozen**: `CLAUDE.engine.md` is absent from every regime at all **fifteen**
      published tags that carry it (`v3.6.0` → `v4.9.1`), while its content grew 23 504 → 33 531 bytes.
      It was never a bug in the update path; it was a file nothing declared.
      ⚠️ _This line said **nine** tags until 2026-08-21; re-measured at S7-0, it is **fifteen** (five
      distinct byte-states). The byte figures were right. Corrected here rather than left to be
      re-derived: the tag count is what S7's table is generated over._
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
  - [x] **S7-0 — THE DESIGN**, written into this file before a line of code. _(2026-08-21 · `HEAD`)_
        Three corrections to the sketch: the seam is the `recorded` **input**, not `verifyBase`; the
        table is generated under **HEAD's** regime or it misses `CLAUDE.engine.md`; it must carry the
        **FR** sources or it heals neither of the owner's brains. **Row-2 seeding is absorbed.**
  - [x] **S7-1 — the heal**: `healProvenance`, a new pure module. Nothing existing changed.
        _(2026-08-21 · `3908b7f` + `924b0d9` · 12 tests, mutation **96.43 %**, 1 named equivalent)_
  - [ ] **S7-2 — the historical fingerprint table**, and the guard that keeps it fresh.
  - [ ] **S7-3 — the wiring**, so a real update consults it.
  - [ ] **S7-5 — fetch the ancestor's bytes from a published tag** (owner's idea, measured 13/15 on
        both real brains). ⚠️ **Scope not arbitrated — ask before building.**
  - [ ] **S7-4 — the QA**: a brain rebuilt from a real tag now **RECEIVES**.
- [ ] **S8 — the French tree stops drifting in silence.**
  - [ ] **S8-1 — port `8341e18`** into `templates/fr/CLAUDE.engine.md`.
  - [ ] **S8-2 — the EN/FR drift guard**, a test.
  - [ ] **S8-3 — the FR replay QA.**
  - [ ] **S8-4 — the locale doctrine recorded** as an ADR.
- [ ] **S10 — a personalized file becomes a QUESTION, never a blind spot.** _(Owner's acceptance
      criterion, 2026-08-21. **v5 cargo**, explicitly not v5.1. Runs BEFORE S9.)_
  - [ ] **S10-0 — THE DESIGN**, written into this file before a line of code.
  - [ ] **S10-1 → S10-n — the slices**, cut by S10-0.
  - [ ] **S10-QA** — a file edited before v5.0.0 comes out of an update with a real choice offered.
- [ ] **S9 — the release tail.** _(LAST: after S7, S8 and S10.)_
  - [ ] **S9-1 — the release note.** Owner's tone. **Both** of the old forbidden claims are now in
        play: one falls if S7 ships, the other if S10 does. **Not writable until both verdicts exist.**
  - [ ] **S9-2 — cut, tag, publish.** Owner's, always.
  - [ ] **S9-3 — the field measurement** carried to the release checklist.

---

## 🧊 S7 — the frozen fleet is healed

- [x] **S7-0 — THE DESIGN.** _(2026-08-21 · this commit — the loop's contract: a design slice ships a
      written design and stops. No mutation pass: doc-only slice, skip recorded per CONVENTIONS
      §5quinquies.)_ The sketch that justified reopening the release has been checked claim by claim
      against the code and against the 25 published tags. **The idea survived. Three of its claims did
      not**, and one of them decides whether the release heals the file it is named for.

  - [x] 💡 **The idea, unchanged and confirmed.** If an installed file's digest matches **any version
        the engine ever published**, then that file **is** that version, untouched. The ancestor's
        bytes are already on the disk; only the **proof** was missing.

  #### ❌ Correction 1 — THE SEAM MOVED. `verifyBase` and `planBaseSeed` are not touched.

  The sketch put the second source of proof inside `verifyBase`. **It would have healed nothing on the
  merge path**: `mergeVerdict` short-circuits on `!recorded` at `scripts/lib/engine-merge.mjs:59` and
  returns `preserve/no-provenance` **before `verifyBase` is ever called** (`:30`, `:71`, `:86` are all
  downstream of that guard). Teaching `verifyBase` a new source would have left row 3 — the freeze
  itself — exactly where it is.

  The seam is one level up: **the `recorded` INPUT**. Reconstruct it, and rows 4-6 of the existing
  table do the right thing untouched — and they do it **without the base tree**, which the S2a
  correction at `engine-merge.mjs:48-53` already established on purpose. So:

  - [x] **One new pure function**, `healProvenance({ manifest, provenance, installedFileMap, table })`
        → the same map, plus an entry for every merge-regime file whose installed bytes are recognized
        in the table. It returns `fingerprint(installed)` — **recognized, never invented**: the proof
        is membership in the table, and the sha is only the form the rest of the engine reads it in.
  - [x] **Computed ONCE, at the top of `reconcileBrain`**, and passed down in place of
        `local?.provenance` at the three refresh call sites (`reconcile-brain.mjs:193`, `:212`, and the
        skills' equivalent), and as `priorProvenance` to `reseedProvenance` (`:460`) so it **persists in
        the single manifest write that already happens** (`:476`).
  - [x] **`verifyBase`, `mergeVerdict`, `planBaseSeed`, `planBaseAdvance`: unchanged.** `syncBaseTree`
        receives the reseeded map (`:487`) and therefore inherits the heal for free — `planBaseSeed`
        finds a `recorded` that matches the installed bytes and seeds `.engine-base/<rel>` exactly as it
        does for a brain with real provenance. **That is the whole point of doing it at the input.**

  - [x] 🔑 **What the sketch called THE CRUX is answered, and it was a real problem.** *"The seed must
        now write the provenance too"* — it cannot, where it stands. In **all three writers** the
        manifest is written to disk **before** `syncBaseTree` runs (`update-engine.mjs:587` then `:596`;
        `reconcile-brain.mjs:476` then `:487`; `engine-source.mjs:139` then `engine-base-fs.mjs:153`).
        A sha discovered by the seed would arrive after its own record was written, and the module's
        stated invariant (*"this module writes bytes, `reseedProvenance` writes shas"*,
        `engine-base-fs.mjs:92-95`) would need a second writer. **Computing the heal before the manifest
        write removes the problem instead of solving it**: one fact, one owner, one write.
  - [x] **`update-engine.mjs` needs no change.** Its parent pass writes an un-healed manifest at `:587`;
        the auto-finalize **child** re-runs `reconcileBrain`, re-reads the manifest from disk, heals,
        and is the **last writer** on the path. The heal therefore lands **within a single
        `update-engine` invocation** — not one update late.
  - [x] **A self-heal heals too.** The three refresh families are guarded on `sourceDir !== brainDir`,
        but the seed pass is not (`reconcile-brain.mjs:481-487`): a `reconcile`-only run on a frozen
        brain still records the proof, so the *next* update merges. Free, and worth a test.

  #### ❌ Correction 2 — GENERATE THE TABLE UNDER **HEAD's** REGIME, OR IT HEALS EVERYTHING EXCEPT THE POINT

  Measured 2026-08-21 over all **25** published tags (`v3.0.0` → `v4.9.1`):

  | Selection rule | rels | distinct (rel,digest) | `CLAUDE.engine.md` covered? |
  |---|---|---|---|
  | Each tag's **own** `merge` regime | 15 | 51 | **NO — zero entries** |
  | **HEAD's** `merge` regime, applied to each tag's tree | 14 | 52 | **yes — 5 versions, from `v3.6.0`** |

  `CLAUDE.engine.md` was in **no regime at any published tag** — that *is* the freeze this release
  exists to end. A generator that asks each tag *"what did you call merge?"* therefore reproduces the
  freeze in the healing table itself. **The generator asks the release being cut**, and applies its
  regime (minus its tombstones, `selectMergeFiles`) to the historical trees. Same cost, opposite result.

  #### ❌ Correction 3 — WITHOUT THE FRENCH SOURCES, THE HEAL MISSES BOTH OF THE OWNER'S OWN BRAINS

  A brain installed in French holds the bytes of `templates/fr/<rel>`, not of `<rel>`
  (`resolveLocaleSource`, `engine-copy-select.mjs:33`). Both real brains are French (see § facts). An
  EN-only table recognizes **nothing** on them. So each rel carries the digests of **every locale
  source that ever shipped for it**, and the entry records which:

  | Table | rels | distinct digests | pretty JSON | minified |
  |---|---|---|---|---|
  | EN only | 14 | 52 | 5 346 B | 4 767 B |
  | **EN + FR (retained)** | **14** | **73** | **10 834 B** | **8 116 B** |

  `CLAUDE.engine.md` alone: **5 EN + 4 FR**. The sketch's *"~150 sha256, about 10 KB"* was two claims,
  both wrong and in opposite directions: **73** entries, not 150 (342 (rel,tag) pairs collapse to 73
  distinct byte-states), and ~10.8 KB **is** the honest figure only once French is in.

  #### 📦 The shape, decided

  ```jsonc
  // scripts/lib/engine-fingerprints.json — generated, never hand-edited
  { "generatedAt": "v5.0.0",
    "files": {
      "CLAUDE.engine.md": {
        "sha256:…": { "since": "v3.6.0", "locale": "en" },
        "sha256:…": { "since": "v3.6.0", "locale": "fr" }
      }
    } }
  ```

  Keyed by the **installed** rel (what the brain holds), never by the source path — the lookup knows
  nothing of locale, it only reports one. `since` is the **earliest** tag that shipped those bytes.

  #### ❓ The six questions, answered in writing

  - [x] **Which files?** Every file under **HEAD's `merge` regime minus its `retired` tombstones**, at
        every published tag, in every locale. Not *"only those with a real freeze history"*: that
        criterion needs a measurement that goes stale, and it saves ~5 KB. Retirement is honored **at
        generation** (HEAD's tombstones) and again **at lookup** (`selectMergeFiles` already subtracts
        them), so a retired file can never be healed into existence.
  - [x] **Where does it live?** `scripts/lib/engine-fingerprints.json` — **not** in
        `engine-manifest.json`. The manifest is parsed on **every session start** (the
        `session-engine-divergence` hook → `engine-base-fs.mjs:137`) and on **every status-line render**
        (`status-line.mjs:46,139`), and it is a `FROZEN_FILES` entry in no regime: 10 KB there is a tax
        on a hot path forever, paid to serve one code path that runs on updates only. `scripts/lib/**`
        is already a `replace` glob, so the sibling is **delivered by the existing copy path with no new
        wiring**, and it is read **lazily, at heal time only** — from `sourceDir` when there is one (the
        freshest table), falling back to the brain's own copy for a self-heal.
  - [x] **What does an OLD match imply for `baseRefs`?** We learn the version for free, so the heal
        writes `baseRefs[rel] = <the matched tag's `since`>` **when the entry is absent, never over one
        already recorded**. But state the honest size of the win: a file that heals *and* is delivered
        in the same pass is re-stamped by `reseedBaseRefs` with the new ref anyway, and a file that
        stays held back is a file the owner **edited** — which by definition matched nothing and did not
        heal. So the learned tag survives on exactly one population: files healed and left **unchanged**
        (row 4). It costs one line and makes the transitional state honest. **S4's notice must not be
        redesigned around it.**
  - [x] **Reported, or silent?** **Reported**, one aggregated line, once: *"N engine files recognized
        from vX — this brain can now receive updates for them."* S4's whole thesis is that the engine
        says what it did; a silent change of ancestry is the class of defect this chantier exists to
        end. It cannot become a phantom (the failure mode `engine-merge.mjs:60-63` warns about): after
        the first heal the provenance is recorded, so there is nothing left to recognize.
  - [x] **Row-2 seeding — same slice?** **Yes, absorbed.** Row 2 is the special case where the version
        recognized happens to be the one being delivered. Once the table covers the release being cut,
        row 2 needs no code of its own. The archived exclusion (*"cheap and correct, but it is S1's
        planner's business"*, `update-regime-owns-what-it-shipped-action.md:1225-1226`) is **closed by
        S7**, not re-opened — S7-1 carries a row-2 case in its tests so the absorption is pinned.
  - [x] **Line endings.** The lookup asks the table for `fingerprint(installed)` **and** for
        `fingerprint(normalizeEol(installed))`, exactly as `verifyBase:50` forgives them. Without it a
        Windows checkout stays frozen after the release that unfreezes everyone else.

  #### ⚖️ What S7 CANNOT heal — by construction, not by omission

  - [x] **The personalized files: `CLAUDE.md` and `.claude/settings.json`.** They are **generated per
        brain** at install (`installer.mjs:514` from `CLAUDE.md.template`; settings from
        `.claude/settings.json.template`, a `replace` file). No two brains hold the same bytes, so no
        shipped digest can ever match. `.claude/settings.json` has **no historical repo file at all** —
        it appears in the measurement as an empty glob. **This is coherent, not a gap**: the constitution
        was split into a personalized half and an engine-owned half precisely so the engine could own
        one of them. **S7 heals exactly the engine-owned set — the set the split created.**
  - [x] **The `test-first-discipline` skill has no history under that name** (it shipped as
        `tdd-discipline`, now tombstoned). A frozen brain holds no such directory, so row 1
        (`absent-install` → deliver) already covers it. No heal needed, none possible.
  - [x] **Files the owner edited.** Their digest matches nothing. Preserved **and reported**, unchanged
        — this is forbidden claim n°2 in the decisions block, which S7 does **not** touch.

  - [x] 🚨 **The risk designed against.** The table goes stale the first release nobody regenerates it,
        which is this repo's signature defect committed one level up. Generation is a maintainer script;
        **S7-2's test fails when the table does not cover the release being cut** — computed from the
        working tree, never from the table itself. And the asymmetric risk is named: a **wrong** entry
        makes an edited file read as untouched and **clobbers the owner**. That is why the match is an
        exact digest against a shipped byte-state, keyed by rel, and never a heuristic.

- [x] **S7-1 — the heal itself.** _(2026-08-21 · `3908b7f` + `924b0d9`)_ `scripts/lib/engine-heal.mjs`,
      pure, table injected as data. **Nothing in `engine-base.mjs` or `engine-merge.mjs` changed** —
      the design's central claim, now demonstrated rather than argued. Every case the design listed is
      pinned, plus two the mutation run demanded: a merge file **absent from the table** (passed over,
      not crashed on) and a `null` table (a failed read yields null, and a default only fires on
      `undefined`). 12 tests, suite green, mutation **96.43 %** with one named equivalent.
  - [x] **The contract, as built** — `healProvenance({ manifest, provenance, installedFileMap, table })`
        → `{ provenance, baseRefs, healed }`. `provenance` is the input **plus** what was recognized
        (never a fresh map); `baseRefs` carries **only** the learned entries, for the caller to merge
        **under** any recorded one; `healed` is `[{ rel, since, locale }]`, sorted by path, for the
        report. **S7-3 wires exactly this** — no further shape decision is open.
  - [x] ⚠️ **What the measurement taught, and it is a rule not a detail**: an unsorted fixture must be
        unsorted **in both directions**. The ordering test passed its files in exactly reverse order,
        so a comparator that never swaps was indistinguishable from one that sorts. Written up in
        [`RESULTS.md` § S7-1](../../mutation/RESULTS.md).
- [ ] **S7-2 — the historical fingerprint table**, generated by a maintainer script under **HEAD's
      regime**, both locales, plus the guard test that fails when the table does not cover the release
      being cut.
- [ ] **S7-3 — the wiring**: `reconcileBrain` computes the heal once and hands it to the three refresh
      families and to `reseedProvenance`; the report gains its one line. `update-engine.mjs` and the
      installer are **not** touched.
- [ ] **S7-5 — FETCH the ancestor's bytes from a published tag.** _(The owner's idea, 2026-08-21:
      *"est-ce que l'update ne peut pas aller lire dans GitHub, récupérer le fichier de la version de
      l'utilisateur pour s'en servir d'origine?"* — **measured the same hour and it works.**)_
      ⚠️ **SCOPE NOT ARBITRATED**: written down because it is measured and valuable, not because it was
      decided. Ask before building it.

  - [x] 📐 **The measurement, on the owner's two real brains.** **13 of 15** recorded provenance shas
        resolve to a file in a published tag. `mind-palace` (v4.9.1) and `autre-brain` (v3.5.0) give the
        same 13/15. **The 2 that never resolve are `CLAUDE.md` and `.claude/settings.json`** — generated
        per brain from a template, so no published byte can ever match. Same carve-out as § *What S7
        cannot heal*, reached independently.
  - [x] 🎯 **It covers a population S7 does NOT, and the two are complementary.**
        | | has a recorded sha? | has the ancestor's BYTES? | who fixes it |
        |---|---|---|---|
        | `CLAUDE.engine.md` on any deployed brain | **no** | no | **S7-1/2/3** (recognise the bytes) |
        | a merge file the owner EDITED before v5 | **yes** | **no** (`.engine-base/` absent — verified on both brains) | **S7-5** (fetch the bytes) |
        Today the second row lands on `preserve/customized`: the recorded sha proves the file moved, and
        without the ancestor's bytes there is nothing to merge FROM. That is the case this slice ends.
  - [x] ♻️ **It makes S7-2's table pay for itself twice.** To fetch the right bytes you must know WHICH
        tag the recorded sha came from, and `sha → {tag, locale}` is exactly what the table already is.
        **One artefact, two uses**: recognising unrecorded files (S7) and locating recorded ones (S7-5).
  - [x] 💰 **The cost, measured**: the update clones `--depth 1 --single-branch --branch <ref>`
        (`engine-fetch.mjs:24`), so old tags are **not** already on disk. Each distinct ancestor version
        needs one extra shallow `git fetch` of that tag. The measurement says brains concentrate on a
        handful of versions, and the fetch is only needed for files that are BOTH edited and outdated,
        so it is rare by construction — the owner's own framing: *"dans les cas rares où on ne l'a pas
        sous la main"*.
  - [ ] ❓ **What its design must settle**: it is **best effort and never blocking** (a failed fetch
        falls back to S10's offer, an update must not die because a tag was unreachable); whether the
        fetched bytes are **verified against the recorded sha before use** (they must be — that check is
        what makes this safe, and it is free); whether they are **written into `.engine-base/`** so the
        fetch happens once and never again (almost certainly yes, and it is the migration S1 describes);
        and whether an offline brain is told why it got the degraded path.
  - [ ] 💡 **The tail nobody should promise yet**: `CLAUDE.md` and `settings.json` could in principle be
        RECONSTRUCTED from their `.template` at the right tag plus the substitutions. **Not measured, not
        promised** — the substitution inputs must be recoverable byte-exactly, and they may not be.

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

## 🗣️ S10 — a personalized file becomes a QUESTION, never a blind spot

> **Numbered S10, but it runs BEFORE S9.** Execution order is **S7 → S8 → S10 → S9**; the number is an
> identifier, not a rank, and renumbering a live plan breaks every reference already written down.
>
> **Owner's criterion, 2026-08-21** (in the decisions block above): an update modernizes everything
> except what the person customized, and for those it **asks**, in words a non-technical person reads
> without help. Three offers: **take the new one**, **keep mine**, **combine them**.

- [ ] **S10-0 — THE DESIGN**, written into this file before a line of code, per the loop's contract.
      The sketch below is what the conversation produced; S10-0 checks it against the code and writes
      what survives. Questions it must answer are named at the end.

  - [ ] 🧭 **The one architectural move, and it was already decided.** `update-engine.mjs` **still
        never prompts** — that decision stands (archived plan: *"an update never prompts: it writes,
        or it reports"*, qualified by the owner on 2026-08-21 with *assisted resolution lives OUTSIDE
        `update-engine.mjs`*). So the engine's job changes from **taking** the decision to **preparing**
        it: it emits a decision file, touches nothing it cannot prove, and the **next conversation**
        with the brain is what asks the question and applies the answer.
  - [ ] 📦 **Brick 1 — the engine stops throwing the choice away.** Today a `no-provenance` preserve
        gets **no sidecar**, so the new version is not even on the disk to compare against. Every
        personalized file must leave the update with: the file untouched, **the candidate available**,
        and an entry in a pending-decisions record.
  - [ ] ⏳ **Brick 2 — the pending state SURVIVES the session.** This is the brick that decides whether
        S10 works. If the question is only asked in the update's output, it dies with the scrollback
        and the file is a blind spot again, which is the exact defect being closed. The pending
        decisions live in a file the brain re-reads, and the session raises them until they are
        answered. ⚠️ **A question that must be re-asked at every session start is consent fatigue** —
        the report's own `walkthroughOffer` already carries that non-negotiable (*"it does not
        repeat"*). Cadence is a design question, not a coding one: answer it here.
  - [ ] 🗣️ **Brick 3 — the conversation asks, in plain words.** The brain-side `update-engine` skill
        reads the pending record and says, per file, what the person changed and what the new version
        brings. **No jargon, no conflict markers, no paths as the headline.** Then the three offers.
  - [ ] 🤝 **Brick 4 — "combine" must work EVEN WITH NO ANCESTOR, and that is the whole point.** With
        an ancestor, the mechanical three-way merge already does it. Without one, **Claude reads both
        versions and proposes the combination** — that is why this cannot live in `update-engine.mjs`,
        and why the release can now promise something the merge engine alone could not deliver.
  - [ ] 🚦 **Brick 5 — no consent fatigue.** Twelve customized files must not become twelve questions.
        Group them, offer *"take all the new ones / keep all mine / let's go through them"*, and keep
        the per-file conversation for the ones the person asks about.
  - [ ] ❓ **What S10-0 must answer in writing**: where the pending record lives and what it holds
        (enough to act on later without re-running the update?); when the session raises it and how
        often, without repeating; what happens if the person never answers (the file stays theirs,
        forever, silently? or is it raised once per release?); whether **"take the new one"** keeps a
        recoverable copy of what it replaces (the brain is a git repo with auto-commit, so possibly
        yes for free — verify, do not assume); how a combined file's **ancestor** is recorded
        afterwards, which is `S7-0`'s trap all over again (**the disk takes the combination, the base
        advances to the CANDIDATE**); and whether the three offers apply to `.claude/settings.json`,
        which is generated per brain and merges differently from prose.

- [ ] **S10-1 → S10-n — the slices**, cut by S10-0. Not enumerated here on purpose: cutting them
      before the design is written is how a plan grows slices nobody can judge.
- [ ] **S10-QA — the acceptance test, and it is the owner's sentence turned executable.** A brain
      rebuilt from a real tag, with a file **edited before v5.0.0**, must come out of an update with a
      real choice offered and **nothing silently left behind**. Extends the release fixtures beside
      S7-4's pole.

---

## 🏁 S9 — the release tail

- [ ] **S9-1 — the release note.** Owner's tone (`release-notes-tone`: written for non-devs first,
      never alarmist). **Blocked until BOTH S7's and S10's verdicts are known**: the release had two
      forbidden claims, and each is now the subject of a slice — S7 makes *"unfreezes nobody already
      installed"* false, S10 makes *"the merge does not reach back"* irrelevant to the user, which is
      the only sense in which it was ever a release-note problem. The three user-facing sentences of
      the divergence notice are his too.
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
- [x] ~~**Row-2 seeding**~~ (a base for a no-record file holding the engine's exact bytes) — **NO
      LONGER OUT: absorbed by S7** _(S7-0, 2026-08-21)_. It is the special case where the version
      recognized is the one being delivered, so the table answers it with no code of its own. The
      inherited exclusion is **closed**, not re-opened, and S7-1 carries a row-2 test case so the
      absorption is pinned rather than assumed.
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
