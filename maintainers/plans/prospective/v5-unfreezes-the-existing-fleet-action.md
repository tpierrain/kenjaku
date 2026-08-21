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
> ## ✅ THE SECOND FORBIDDEN CLAIM HAS FALLEN — "the merge does not reach BACK", **false as of `fa0f5be`**
>
> _(2026-08-21. The first one fell at S7-3; this is the other half of the fleet.)_ The release note was
> forbidden the obvious sentence — *"your edits are kept AND you get the update"* — because it was
> **false for one population, permanently**: files the owner had already edited before this release.
> The reasoning was sound but for one word. The ancestor cannot be seeded **from the disk**; it can be
> **fetched** from the tag the recorded sha names.
>
> **Measured on a brain built from the real `v3.6.0` tag**, with a skill the owner had tailored: their
> lines survive **and** the engine's newer content arrives, cleanly, no sidecar, nothing to arbitrate.
> The two QA tests that pinned the old limitation — one of them named *"never acquires an ancestor, and
> says so"* — are **inverted, with their old claims kept above their replacements**.
>
> ⚠️ **What is still NOT promised**, and the note must not overstate it either: a fetch is best effort.
> Offline, or on a tag that has gone, the file is preserved exactly as before and the report says so in
> one line. And two edits in the **same region** still conflict — correctly, and visibly.
>
> ## ✅ RESOLVED — "S7 UNFREEZES A FRENCH BRAIN INTO ENGLISH" WAS A **FALSE ALARM** _(2026-08-21, `a58ecf8`)_
>
> **A genuinely French brain receives the FRENCH doctrine, byte for byte** — probed on a brain rebuilt
> from the real `v3.6.0` tag before a line was changed. The claim below is kept, struck through in
> meaning rather than deleted, because the way it was wrong is the finding.
>
> **What was actually broken was the FIXTURE, not the engine.** The release-fixture tree is PARTIAL and
> carries no `scripts/lib/demo-locale.mjs`, so `readBrainLocale` fell back to `en`: Pole D built an
> **English brain holding French bytes in exactly one file**, a state no installer can produce. The heal
> then reported `locale: "fr"` — correctly, those bytes really are the fr byte-state — and that was read
> as *"the brain is French, and it received English"*. A brain is French because its **marker** says so.
>
> **And the located cause was wrong on its own terms**: the box blamed `selectMergeGovernedDoctrine` for
> pairing every rel with `sourceRel: rel`, but `applyMergeGoverned` resolves the locale one level down,
> through `resolveLocaleSource`. The pairing was never the delivery's last word.
>
> - [x] **Pole D is INVERTED and green**: a French brain (marker written from the tag's own
>       `templates/fr/` overlay, never invented) receives `templates/fr/CLAUDE.engine.md`. A second test
>       pins that the marker is really written, so this cannot drift back to measuring an English brain
>       under a French name.
> - [x] 🎯 **THE LESSON, and it is the second time in one night**: both this and `f7a00fc` were "causes
>       located" by reading code from the outside and neither survived contact with the artifact. **A
>       located cause is a hypothesis until something is run.** Cheap here — the probe took one file and
>       two minutes — and it had already reached the ROADMAP as a promise to the fleet.
> - [x] ⚠️ **What S8 is, restored**: "the FR tree stops drifting in silence", which S8-2 delivered. It
>       never became "stops being overwritten". v5 must still not ship with S8 unpaid; S8-4 remains.
>
> ## 🛑 THOMAS'S CALL — a brain keeps its INSTALL-DAY regime list, **forever**
>
> _(Found by S10-QA on 2026-08-22, on a brain rebuilt from the real `v3.6.0` tag. **Not blocking the
> next slice**: S9-1 can be written without it. Blocking only in the sense that the answer is yours.)_
>
> **The fact, measured not supposed.** An update writes back `{...local, engineVersion,
> indexSchemaVersion, source, provenance, baseRefs}` — and `regimes` is **not in that list**, so it
> comes from the brain's own manifest and is never advanced. `session-self-heal.mjs` already names it
> in a comment (*"update-engine never refreshes those, which is the whole bug"*) and works around it
> by deriving the desired state from what the engine **delivers** instead.
>
> **What it costs v5, precisely.** `CLAUDE.engine.md` is a `merge` family only **v4+ declares**. On a
> v3.6.0 brain the doctrine is still held back correctly, **is** named at update time
> (`doctrinePreserved` carries it with its `.new`), and **is** adoptable by path. But the STANDING
> surfaces never mention it: `readEngineDivergence` selects through the brain's stale globs, so the
> session nudge is silent about it, and adopting it records the answer and writes the file **without
> advancing its ancestor** — so the question comes back at the next release instead of being settled.
> The acceptance criterion holds for the update conversation; it is the between-updates half that
> misses this one file family.
>
> **Three ways out, and it is not my call because it changes what an update MAY WRITE on every
> deployed brain** (the write guard reads the very same list):
>
> - [ ] **(a) Advance `regimes` (and `retired`) to the target's at step 7.** One line. It aligns the
>       record with what the update just did — the reconcile already decides everything from `target`.
>       Widens the write guard's allowlist to whatever the new engine declares, which is the point and
>       also the risk.
> - [ ] **(b) Leave the manifest alone, and have the standing readers use the ENGINE's own regimes.**
>       A brain's `scripts/lib/**` is at HEAD after an update, so the engine can read its own list. No
>       migration, but two sources of truth for one fact.
> - [ ] **(c) Ship v5 as it is.** The doctrine is offered at every update and re-offered at the next
>       release. Honest, never silent during an update, and mildly repetitive between them.
>
> _(My recommendation if you want one: **(a)**, with the write guard's widening called out in the
> release note. But the fleet is yours.)_
>
> ## ▶️ RESUME AT: S9-2a — the release MATERIALS (mine). S9-2b, the cut itself, is HIS.
>
> **S9-2 splits the same way S9-1 did, and for the same reason**: assembling what a release needs is
> checkable work; **deciding to publish is not**. The loop takes the first and never the second.
>
> - [ ] ▶️ **NEXT — S9-2a — the materials.** The **PR body for #76** (every published release since
>       v4.5.0 has one archived beside its plan, and #76's was written when the branch still carried
>       S1-S6 alone), plus a **pre-flight sweep**: manifest integrity, the fingerprint table current at
>       v5.0.0, the locale pairing, the full suite, and the branch's state against `main`. Anything
>       that comes back red is a finding for this plan, not a thing to fix inside the tag.
> - [ ] **S9-2b — cut, tag, publish.** His, always. Carries the `engineVersion` bump and the title
>       he picks from the note's three candidates.
>
> 🔍 **Checked, so the loop does not go looking for it again**: the release's other floor — the v4.8.0
> mutation debt re-arbitrated onto this release — is **already paid on this branch** (its plan reads
> *"DELIVERED ON BRANCH 2026-08-20 — every box ticked"*, and it stays open only because it closes when
> the release SHIPS). Nothing there for the loop to do.
>
> 🛑 **And S9-3 cannot be done tonight, by construction**: it asks whether the write guard's prompts
> become noise on a session that legitimately customizes an engine skill — *correct the first time,
> noise the tenth*. Only living with the guard for a few days answers it. It belongs to the release
> checklist, not to a slice, and no amount of loop iterations replaces the days.
>
> ✅ **S9-1b — THE RELEASE NOTE IS DRAFTED** _(2026-08-22)_ —
> [`release-v5.0.0-note.md`](release-v5.0.0-note.md), beside this plan, written to `CONVENTIONS.md`
> §11 (two-sentence lead in the reader's words, six `What you get` bullets, the shortest possible
> `What you have to do`, then everything technical below the `---`). **The body is written to be
> published as-is; the VOICE is his, and so is the TITLE** — three candidates are listed at the top of
> the file for him to arbitrate, following v4.9.1's precedent where he took the one naming the symptom
> people actually lived.
>
> **Two facts the note turns on, both verified rather than assumed**: `indexSchemaVersion` is
> unchanged since `v4.9.1`, so **nothing is re-read or re-encoded** and *"What you have to do"* is one
> line; and `engineVersion` is still at v4.9.1's numbers, because **the bump is S9-2's**, his step.
>
> **What the note deliberately does NOT do** (§11's *do not alarm*): it advertises no bug that never
> shipped. S10-QA's three findings were caught before any tag and appear nowhere in it. What it does
> carry, under the fold, is the **honest limits** — same-region edits still conflict, the ancestor
> fetch needs the network and a live tag, and the install-day regime list leaves the doctrine out of
> the between-updates banner on a pre-v4 brain (the arbitration box above).

>
> ### Done, no longer the resume point: S9-1a — the marketing surface
>
> ✅ **S9-1a — THE MARKETING SURFACE NOW TELLS THE TRUTH** _(2026-08-22 · CONVENTIONS.md §10's ritual,
> run in full; verdict recorded below rather than summarised away)_. **S9-1 split on contact**, as S5c
> and S10-6 did: §10's re-read is a **factual** correction of what the repo claims, mine to make; the
> release note is his **voice**. Doing them in one slice would have buried the second under the first.
>
> **The one that was outright FALSE**, and it is the absolute promise §10 tells you to hunt first:
> `SETUP.md` swore *"an update never writes to … anything under `.claude/skills/` you customized"*.
> **S7-5 made that false on purpose**: a customized skill whose ancestor can be fetched is now MERGED,
> so the file does change — with the owner's words still in it. The promise had to change shape rather
> than be patched: **"never written to" was a freeze; "never LOST" is what survives an update.** That
> sentence is now the spine of every corrected passage, and it is the release note's lead.
>
> **Six passages corrected** (`README.md` ×4, `EN-QUOI-C-EST-DIFFERENT.md` ×1, `SETUP.md` ×2 including
> the "sacred by construction" box): every one of them sold *preserved / never overwritten*, which the
> release turns from a guarantee into an **undersell**. `SETUP.md`'s update step now describes the
> three real outcomes (merged · offered with three answers · said out loud between updates) and names
> the command behind them.
>
> **What was TRUE and sold NOWHERE** (§10's second question): **the heal** — a brain frozen since its
> install day recognising the files it was given back then and receiving improvements again — appeared
> in no user-facing document at all. Now in `README.md`'s updater bullet.
>
> **Checked and found clean, recorded so the sweep's coverage is legible**: `CONNECTORS.md`,
> `DEVELOPING.md`, `CLAUDE.md`, `CLAUDE.engine.md`, `installer.mjs` (no printed claim on this),
> `templates/**` including the FR tree, and `docs/marketing-image-prompts.md` — the boards' claims are
> about **notes and the constitution**, which stay literally untouched, so **no board asserts anything
> the code stopped doing**. That is the boring verdict §10 asks for in writing.
>
> 🧪 **No mutation pass on this slice, and the skip is deliberate**: doc-only, no production line
> changed. The nets that could still fire were checked — `README.md`, `SETUP.md` and
> `EN-QUOI-C-EST-DIFFERENT.md` are in **no regime** (so no fingerprint table to regenerate) and have
> **no `templates/fr/` twin** (so `locale-drift` has nothing to pair). Full suite green, 2334 pass.
>
> ### Where S9-1b picks up — the release note (HIS tone, not mine)
>
> The material is now assembled and needs a voice: the lead is **"your words are never lost"**;
> `CONVENTIONS.md §11` fixes the shape (two-sentence lead in the reader's words, `What you get`,
> `What you have to do`, then `---` and `Under the hood`); the three user-facing sentences of the
> divergence notice are his. **Do not advertise bugs that never shipped** — the three defects S10-QA
> found were caught before any tag and belong under the fold, if anywhere at all.
>
> ✅ **S10-QA HAS SHIPPED, and with it S10 is finished** _(2026-08-22 · `612f306`, `5c16fc2`, `ea78d42`,
> `e2036be`)_ — the owner's sentence is now an executable test over a brain rebuilt from the published
> `v3.6.0` tag, with three files edited **before** the release.
> **Running it on a real tree found three product defects** no hand-written fixture could have shown,
> each fixed test-first: an answer recorded on a brain that **cannot name its engine version** was
> written and then silently dropped on read (`UNKNOWN_REF`); a **conflict's `.new` carries `<<<<<<<`
> markers** and would have been adopted blind, pasting them into the live file *and* recording them as
> the ancestor; and a `merge` glob matches `SKILL.md.new` as happily as `SKILL.md`, so **every sidecar
> counted as a file the brain was holding back** — the engine naming its own offer to the owner as a
> divergence. Mutation: **96.15 %** over the changed hunks, then **100 %** over nine hunks Stryker had
> **silently skipped** (a bare `:79` matches no file; `mutate-one.mjs` now normalizes it). See
> `../../mutation/RESULTS.md § S10-QA`.
>
> ▶️ **NEXT: S9-1b** (the note, his tone), then S9-2 (cut/tag/publish, his) and S9-3 (the field
> measurement). **S9-1a is done** — see the top of this header.
>
> ### The road to here (S7, S8, S10-0 → S10-6b) — kept as the record, **not** the resume point
>
> **S7 AND S8 ARE BOTH COMPLETE** _(2026-08-21)_ — S7-0 → S7-5 plus S7-4's breadth, then S8-1
> `775c00a`, S8-2a, S8-2b `ab85fde` + `417e264`, S8-3 `a58ecf8`, S8-4 (ADR 0040). **The French tree no
> longer drifts in silence**: `scripts/lib/locale-drift.mjs` is green over the 16 real pairs, and its
> waiver map turned out to be load-bearing (empty it and it goes red naming `f7a00fc`, the one commit
> where **English caught up with French** and no French edit can ever pair it).
>
> **S10-0's design is WRITTEN and committed** and **S10-1 has shipped** _(2026-08-21 · `39f37bb`)_ —
> row 3 now drops the engine's version beside the owner's, so the three offers have something to offer.
> ✅ **S10-3 has shipped** _(2026-08-21 · `216d3b6`)_ — **the intermediate state is CLOSED**: the report
> names the sidecar and offers the three choices in one line, and the session nudge subtracts what the
> owner has already answered at the running ref. **S10-4 has shipped too** (`e7a1952`): a git refusal
> now VETOES an adoption instead of reporting it.
>
> ✅ **S10-5 has shipped** _(2026-08-22 · `4238e16` + `363db77`)_ — **the engine can now act on an
> answer.** `scripts/lib/engine-adopt.mjs`: safety commit → write → the base advances to the
> **CANDIDATE** → the answer is recorded at the running ref → the sidecar goes. 96.67 % over 60
> mutants, the two survivors equivalent and documented.
>
> ✅ **S10-6a has shipped** _(2026-08-22 · `087d57b` + `160d36e`)_ — **S10-6 split on contact**, as S5c
> did, and for a reason the plan had missed: S10-5 built the seam as a FUNCTION, and **a skill cannot
> call a function, only a command**. `scripts/adopt-engine-file.mjs` is that command
> (`<file> take-theirs|keep-mine|combine --from <path>`), declared in the manifest so it reaches
> deployed brains. 100 % over 60 mutants, two mutants hand-confirmed.
>
> ✅ **S10-6b has shipped, and with it S10 IS BUILT** _(2026-08-22 · `a4e7783`)_ — the skill's
> **Step 4** turns a preserved file into a conversation: what you changed and what the new version
> brings in plain words, then the three offers, then the command. **EN + `templates/fr/` twin in the
> one commit**, and the **fingerprint table regenerated at v5.0.0** (79 → 81 byte-states) — its guard
> caught that changing a `merge` file without regenerating leaves those bytes recognisable by no
> frozen brain. **Every BUILD slice is ticked, S10-0 → S10-6b**, and **S10-QA closed the gap between
> built and done** — see the top of this header.
>
> 📌 **The lead recorded here for S9-1 — SPENT, 2026-08-22.** It said the marketing surface still
> promises that a tailored file is merely *kept*, an undersell rather than a falsehood. **S9-1a's sweep
> found it was worse than that in one place** (`SETUP.md` promised a customized skill is never written
> to, which S7-5 makes false) and **thinner than that everywhere else** (six passages, plus a
> capability sold nowhere). See the S9-1a verdict at the top of this header; nothing is left waiting
> here.
>
> Read § S10-0 and build to it; it cut four slices, **S10-1 → S10-4**. Three corrections it made to the
> sketch, each measured against the code rather than reasoned about:
>
> - **Row 3's missing sidecar is confirmed, and the code states the very decision to overturn** —
>   *"littering an older brain with unexplained sidecars would be noise, not a choice."* That reasoning
>   dissolves the moment a conversation explains the sidecar.
> - **Brick 2's "pending decisions live in a file the brain re-reads" is REJECTED.** The list is
>   already derived from the disk (`engineDivergence`, S4-2) and surfaced at rest by the divergence
>   nudge (S4-4a). The only new state is the ANSWER — `rel → {decision, at: <engine ref>}` — and keying
>   it by version makes "raised once per release" fall out with no rule to write.
> - **"Take the new one" is NOT free-recoverable**, contrary to the sketch's guess: `auto-commit`
>   stages the whole tree but `engine-commit` runs **after** the update wrote, so an edit never swept
>   is overwritten and committed over in one pass. Hence S10-4, a safety commit before the only
>   destructive offer.
>
> **S10 is the owner's own acceptance criterion** _(2026-08-21, explicitly v5 cargo and not v5.1)_ and
> it RUNS BEFORE S9. What is left in the release after it is the tail, S9.
>
> 🛑 **S8-3 CLOSED A FALSE ALARM, not a defect** — read the box at the top before quoting anything about
> French brains being overwritten. A genuinely French brain always received the French doctrine; the QA
> fixture was building an English brain and calling it French. **Twice in one night a "located cause"
> did not survive being run** (this, and `f7a00fc` at S8-2a), and this one had already reached the
> ROADMAP as a promise to the fleet.
>
> **Remaining**: **S10**, then **S9**. Execution order unchanged: S7 → S8 → S10 → S9.
>
> **S8-2-0's design is WRITTEN and committed** _(2026-08-21)_ — read § S8-2-0 and build to it. The
> criterion is **unpaired commits** (commits touching EN since the FR twin's last commit that do not
> also touch the twin), measured on all 16 real pairs: it collapses 14 false positives to zero and
> names the 2 real ones, `sync` included. Two things it settled that the sketch had wrong: the obvious
> date signal fires on the **same commit**, not merely the same day; and **"no FR twin" must not be
> reported at all** — which contradicts what S8-1 wrote, for a reason `engine-copy-select.mjs` states
> outright.
>
> ✅ **The guard was RED ON ARRIVAL**, the design split it, the port came first, and it shipped green.
> The split is also what made the criterion's one flaw cheap to fix: it was found by the slice that
> used it, before a line of guard existed.
>
> ⚠️ **Read this before trusting any mutation number** (S7-5-1 paid for it): the runner is
> **NON-DETERMINISTIC at `concurrency: 5`** — same commit, two runs, 96.97 % then 93.94 %. Serial is
> the truth. The finding, its evidence and the owner's decision live in
> [`maintainers/mutation/RESULTS.md`](../../mutation/RESULTS.md) § "The judge itself was flaky".
>
> _Background, unchanged:_ **S7-5 — fetch the ancestor's bytes from the published tag.** S7-0 → S7-3 are **done**
> _(2026-08-21)_, and with them **the release's reason for existing is discharged**: measured on the
> real `v3.6.0` fixture tree, a brain recording **no provenance at all** for `CLAUDE.engine.md` now
> comes out of an update **byte-identical to what the engine ships**. The forbidden claim *"the
> doctrine layer unfreezes no already-deployed brain"* is **false as of `f3d72c4`** — S9-1 may now be
> written about it.
>
> **S7-5 is the other half of the fleet**, and the two do not overlap: S7 recognises files with **no
> recorded sha**; S7-5 serves files that **have one** and whose ancestor bytes are missing, which today
> land on `preserve/customized`. Its four design questions are **written and unanswered** — read the
> S7-5 block below before coding: best-effort and never blocking, verify the fetched bytes against the
> recorded sha before use, whether to write them into `.engine-base/`, and what an offline brain is
> told. **Answer those four in the plan first**, exactly as S7-0 and S7-2 did.
>
> ## 🆕 THE RELEASE GREW TWICE, both times on the owner's word _(2026-08-21, after S7-1)_
>
> **S10 is new v5 cargo**: a personalized file must become a **question with three offers**, never a
> blind spot. He was offered v5.1 and answered *"c'est le comportement que j'attends pour la version
> 5"*. Read the acceptance criterion in the decisions block — it is quoted, not paraphrased.
>
> **S7-5 is new v5 cargo too**: when the ancestor's bytes are missing, **fetch them from the published
> tag the recorded sha points at**. His idea, measured at **13/15** on his own two brains the same
> hour, and arbitrated INTO v5 immediately after. It is what turns *"combine the two"* from a reading
> into a real merge for every file that still has a recorded sha.
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
- [x] 🔓 **The OTHER forbidden claim HAS FALLEN.** *"The doctrine layer unfreezes no already-deployed
      brain"* was true of the release as built, and S7 existed to make it false. ✅ **Verdict known,
      2026-08-21 (`f3d72c4`)**: measured on the real `v3.6.0` fixture tree, a brain recording no
      provenance for the doctrine now ends an update **byte-identical to what the engine ships**
      (`release-fixture-doctrine.test.mjs`, Pole A, inverted with its old assertion kept beside it).
      **S9-1 may now say it** — for files nobody edited. The FIRST forbidden claim (files edited
      before v5.0.0) is untouched by this and still waits on S10.

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
  - [x] **S7-2 — the historical fingerprint table**, and the guard that keeps it fresh.
        _(2026-08-21 · `e716a33` + `9c50842` · 15 rels, 77 byte-states, 11.6 KB · 21 tests, mutation
        **94.74 %**, 2 named equivalents)_ `CLAUDE.engine.md` came out at **5 EN + 4 FR**, exactly what
        S7-0 predicted from the measurement.
  - [x] **S7-3 — the wiring**, so a real update consults it. _(2026-08-21 · `f3d72c4` + `778482c` ·
        13 tests, mutation **92.31 %** on the new module, **100 %** on both changed hunks)_
        **The frozen fleet receives**: a brain rebuilt from the real `v3.6.0` tag, recording no sha
        for the doctrine, comes out of an update byte-identical to what the engine ships.
  - [ ] **S7-5 — fetch the ancestor's bytes from a published tag** (owner's idea, measured 13/15 on
        both real brains). ✅ **IN v5, owner's call 2026-08-21.** Runs after S7-3, before S7-4.
    - [x] **S7-5-0 — THE DESIGN.** _(2026-08-21 · `HEAD`)_ The four questions answered, plus two the
          sketch missed: the self-heal must **not** fetch (the brain's remote is the owner's own repo),
          and the table needs no reverse index.
    - [x] **S7-5-1 — the pure planner**, `planAncestorFetch`. _(2026-08-21 · `1d545b2` + `d019d38` ·
          16 tests, mutation **93.94 %** on the new module, 2 survivors, **both named equivalents**)_
          Every skip is a test, because each is a way this could go wrong: planning a file that needs
          nothing buys a network call, and planning one whose `.engine-base/<rel>` already exists would
          overwrite a **fact** with a guess. ⚠️ The measurement itself misbehaved here — see the header
          note and RESULTS.md § "The judge itself was flaky".
    - [x] **S7-5-2 — the git shell**: fetch the tag, **verify against the recorded sha**, hydrate holes.
          _(2026-08-21 · `d5324a0` · 14 tests, mutation **100 %** on the new module, 42/42, **confirmed
          on a serial re-run** because a lone perfect score from a judge proved flaky is not evidence)_
          One design change, made while writing it and recorded below: **the self-heal gate moved into
          the shell.**
    - [x] **S7-5-3 — the wiring** + the one report line (attempted-and-failed only).
          _(2026-08-21 · `fa0f5be` · 3 end-to-end tests + 2 QA tests INVERTED, mutation **100 %** on the
          three changed hunks, 41/41, confirmed serially)_ **S7-5 IS COMPLETE, and the second forbidden
          claim has fallen** — see the box below.
  - [x] **S7-4 — the QA**: a brain rebuilt from a real tag now **RECEIVES**. _(2026-08-21 · `d9421c8` ·
        2 poles; no mutation pass — test-only slice, adds no production line, skip recorded)_ Headline
        was paid at S7-3; this bought the breadth: **FR**, the **scripts** family, and a **second tag**.
        ⚠️ **It reported a defect S7 had activated — and that turned out to be the FIXTURE's, not the
        engine's.** Resolved at S8-3 the same night; see the box at the top.
- [x] **S8 — the French tree stops drifting in silence.** _(2026-08-21 · S8-1 → S8-4, all four
      shipped.)_ _(It briefly read "and stops being OVERWRITTEN" — that was the false alarm above,
      withdrawn 2026-08-21.)_
  - [x] **S8-1 — port `8341e18`** into `templates/fr/CLAUDE.engine.md`. _(2026-08-21 · `775c00a`)_
  - [x] **S8-2 — the EN/FR drift guard**, a test. _(2026-08-21, all three sub-slices; box ticked 2026-08-22 — it had been left unticked while S8 itself already read "all four shipped".)_
    - [x] **S8-2-0 — the design**, measured on the 16 real pairs. _(2026-08-21)_
    - [x] **S8-2a — the port**: `435c164` into the FR `sync` skill; `f7a00fc` measured as **needing no
          port** (EN was catching up with FR), which is what forces the waiver map into S8-2b.
          _(2026-08-21)_
    - [x] **S8-2b — the guard**, shipped green over 16 pairs, with `NOT_A_PORT`.
          _(2026-08-21 · `ab85fde` + `417e264`)_
  - [x] **S8-3 — the FR replay QA**, and the defect it was filed against was the fixture's, not the
        engine's. _(2026-08-21 · `a58ecf8`)_
  - [x] **S8-4 — the locale doctrine recorded** as an ADR. _(2026-08-21 · **ADR 0040**)_
- [ ] **S10 — a personalized file becomes a QUESTION, never a blind spot.** _(Owner's acceptance
      criterion, 2026-08-21. **v5 cargo**, explicitly not v5.1. Runs BEFORE S9.)_
  - [x] **S10-0 — THE DESIGN**, written into this file before a line of code. _(2026-08-21)_ Three
        corrections to the sketch, all measured: row 3's missing sidecar is confirmed **and the code
        states the decision to overturn**; Brick 2's "file the brain re-reads" is **rejected** — the
        list is already derived from the disk by S4-2, and only the ANSWER is new state; and "take the
        new one" is **not** free-recoverable, because the update commits only after it writes.
    - [x] **S10-1 — row 3 gets its sidecar.** _(2026-08-21)_
    - [x] **S10-2 — the answers file**, `rel → {decision, at}`, keyed by engine ref. _(2026-08-21)_
    - [x] **S10-3 — the wiring**: the nudge subtracts what is answered; the report names what waits.
          _(2026-08-21 · `216d3b6`)_ — the exit from the S10-1 intermediate state.
    - [x] **S10-4 — the safety commit** before an adopted candidate overwrites an uncommitted edit.
          _(2026-08-21 · `e7a1952`)_ — a refused commit VETOES the adoption, it does not report it.
    - [x] **S10-5-0 — DESIGN: where the three offers land on disk.** _(2026-08-22)_ Cuts S10-5 + S10-6.
    - [x] **S10-5 — the adoption seam**: safety commit → write → base advances to the CANDIDATE →
          answer recorded → sidecar removed. Refuses everything if the safety commit vetoed.
          _(2026-08-22 · `4238e16` + `363db77`)_ — `scripts/lib/engine-adopt.mjs`, 96.67 % / 60 mutants.
          Mutation caught a **fleet-scale** defect the one-file fixture could not express: an adoption
          rebuilds the provenance table, so rebuilding it from nothing would wipe the **78 other**
          files' digests and raise the whole fleet at the next update. See `../../mutation/RESULTS.md § S10-5`.
    - [x] **S10-6a — the COMMAND behind the three offers.** _(2026-08-22 · `087d57b` + `160d36e`)_
          `scripts/adopt-engine-file.mjs`, manifest-declared, 100 % over 60 mutants. **Split out of
          S10-6 on contact**: a skill cannot call a function, so the prose had nothing to reach.
    - [x] **S10-6b — bricks 3-5, the conversation** (skill prose, EN + its `templates/fr/` twin in
          the same commit). _(2026-08-22 · `a4e7783`)_ Step 4 of the update-engine skill; fingerprint
          table regenerated at v5.0.0 (79 → 81 byte-states), which its own guard demanded.
  - [x] **S10-QA — the acceptance test, on a brain rebuilt from the real `v3.6.0` tag.**
        _(2026-08-22 · `612f306`, `5c16fc2`, `ea78d42`, `e2036be`)_ Three product defects found on the
        real tree and fixed test-first (a dropped answer on a brain that cannot name its version; a
        marked-up merge adoptable blind; every sidecar counted as a held-back file). 96.15 % then
        100 % — see `../../mutation/RESULTS.md § S10-QA`. **S10 is DONE.**
- [ ] ▶️ **NEXT — S9 — the release tail.** _(LAST: after S7, S8 and S10 — all three are now done.)_
  - [x] **S9-1a — CONVENTIONS §10's re-read of the marketing surface, and its corrections.**
        _(2026-08-22)_ One outright FALSE promise (`SETUP.md`: an update never writes a skill you
        customized — S7-5 makes it merge), six undersells corrected, and the **heal**, sold nowhere,
        now in `README.md`. Verdict recorded in the header, including the clean files.
  - [x] **S9-1b — the release note, DRAFTED** _(2026-08-22)_ — `release-v5.0.0-note.md` beside this
        plan, to §11's shape. Lead: **"your words are never lost"**. The body is publishable as-is;
        the **voice and the title are his** (three candidates listed in the file).
  - [ ] ▶️ **NEXT — S9-2a — the release materials.** The PR body for #76 (its own body predates
        S7/S8/S10), plus a pre-flight sweep: manifest integrity, the fingerprint table at v5.0.0, the
        locale pairing, the full suite, the branch against `main`. Mine — checkable, not a decision.
  - [ ] **S9-2b — cut, tag, publish.** Owner's, always. Carries the `engineVersion` bump, which is why
        the manifest still reads v4.9.1's numbers today, and the title he picks.
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

  #### 📐 S7-2's own design — the residual choices S7-0 left open _(written 2026-08-21, before the code)_

  S7-0 decided the table's **shape**, its **location** and **what goes in it**. Four things it did not
  decide, settled here so the code has nothing to invent:

  - [x] **Where the generator's logic lives, and why it is SPLIT.** The pure fold goes in
        `scripts/lib/engine-fingerprint-table.mjs`; the git I/O goes in
        `maintainers/fingerprints/generate-fingerprints.mjs`. The split is not taste: **CI globs
        `scripts/lib/*.test.mjs`, and globs nothing under `maintainers/qa/**`** — logic left in the
        maintainer script is logic no CI run ever executes. The pure half is **dev-only** (a
        `DEV_ONLY_PREFIXES` entry in `tracked-files.mjs`, same treatment as `assert-matcher-lint`): a
        brain reads the table, it never builds one.
        🪤 **The prefix is `scripts/lib/engine-fingerprint-table`, NOT `…/engine-fingerprint`** — the
        shorter one would also swallow `engine-fingerprints.json`, i.e. exclude from the copy the very
        artefact the release exists to deliver. Pinned by a test.
  - [x] **Which tags.** `git tag --list` filtered through `parseSemverTag`, ascending by
        `compareSemverTags`. Measured: **27 local tags, 25 semver** (`V1`/`V2` are the pre-history and
        carry no engine) — exactly the published set S7-0 measured over. No hand-maintained list.
  - [x] **How a source path becomes an installed rel.** `templates/<locale>/<rel>` → `{ rel, locale }`,
        anything else → `{ rel: path, locale: "en" }` (there is no `templates/en/`; EN *is* the root).
        The merge gate then runs on the **rel**, never on the source path — that single ordering is what
        makes `templates/fr/CLAUDE.engine.md` land under `CLAUDE.engine.md`, which is the whole of
        Correction 3.
  - [x] **The working tree is the LAST version folded in**, under the `--version` the maintainer
        passes. That is what absorbs row 2, and it makes the guard's job trivial: it re-fingerprints the
        working tree and demands membership. **First writer wins**, so `since` is the *earliest* tag
        that shipped those bytes and the release being cut only ever claims bytes nobody shipped before.
        ⚠️ When EN and FR hold **identical bytes** for one rel, one digest cannot carry two locales —
        first-wins keeps the earliest, and the `locale` field is then a report, not a fact to reason on.
  - [x] **What the guard asserts, and what it deliberately does not.** It fails when a merge-regime file
        of the working tree (either locale) has no entry under its rel — *"the table does not cover the
        release being cut"*, computed from the tree, never from the table. It does **not** verify the
        historical rows: re-reading 25 tags is a minute of CI to re-prove bytes that cannot change.
- [ ] **S7-3 — the wiring**: `reconcileBrain` computes the heal once and hands it to the three refresh
      families and to `reseedProvenance`; the report gains its one line. The installer is **not**
      touched. ⚠️ **Nor is `update-engine.mjs`'s update PATH** — S7-0's claim, and it holds — but
      `formatReport` lives in that file, so the **report line** lands there. The claim was always
      scoped to the write path; this tracking line over-generalized it, corrected 2026-08-21.

  #### 📐 S7-3's own design — five residual choices, one of them load-bearing _(written 2026-08-21, before the code)_

  - [x] 🚨 **THE ONE THAT WOULD HAVE SILENTLY BROKEN THE DESIGN'S OWN PROMISE.** S7-0 says *"a self-heal
        heals too… a `reconcile`-only run on a frozen brain still records the proof, so the NEXT update
        merges"*. The manifest write it relies on is guarded: `reconcile-brain.mjs:475`,
        `if (Object.keys(delivered).length > 0)`. **A self-heal on a frozen brain delivers nothing** —
        the three refresh families are all gated on `sourceDir !== brainDir` — so the heal would be
        computed, used for that run, and then **thrown away unwritten**. The condition has to widen to
        *"delivered something OR healed something"*, or the clause is false and nothing says so.
  - [x] **Where the installed bytes come from: `readInstalledMergeFiles`, which ALREADY EXISTS.**
        `healProvenance` needs an `installedFileMap`, and the naive `listFilesRelPosix(brainDir)` would
        walk the owner's whole vault on every SessionStart self-heal to look at ~15 files.
        ⚠️ **This slice first designed a table-bounded candidate set to avoid that, and it was
        redundant**: `engine-base-fs.mjs:64` solved the same problem better at **S4-4c** — it walks the
        merge globs' **roots**, not the brain (measured there at 18.5 ms for 8 000 notes, and pinned by
        a test against a full walk on a real disk). Corrected here rather than left as a second
        spelling of one idea: **reuse it, invent nothing.** The lesson is the cheap one — before
        designing an optimisation, grep for the last person who needed it.
  - [x] **How the heal reaches `reseedProvenance`, which lives in ANOTHER function.** S7-0 says
        "computed once at the top of `reconcileBrain`" and "handed to `reseedProvenance` (`:460`)", but
        that call is in `runReconcileCli`. So the report carries it: `healedProvenance`, `healedBaseRefs`
        and `healed` come back with the rest, and the CLI uses them as `priorProvenance` and merges the
        learned refs **under** the recorded ones (`{...healed, ...recorded}` — recorded always wins, per
        S7-0's answer on `baseRefs`).
  - [x] **`retireDeclaredSkills` keeps the RECORDED map** (`:116`), not the healed one. The withdrawn
        arbitration at the top of this file measured why: the two maps are identical from retirement's
        point of view, always. Passing the healed one would be a change with no effect and one more thing
        to reason about the day someone reads it.
  - [x] **Reading the table is FAIL-SOFT, and its order is `sourceDir` then `brainDir`.** The source's
        copy is the freshest; the brain's own is what a self-heal has. Missing, unreadable or corrupt →
        `null`, which `healProvenance` already survives (pinned at S7-1). **An update must never die
        because a data file was unreadable.**
  - [x] **The report line says what is TRUE, not what was drafted.** S7-0 sketched *"N engine files
        recognized from vX"*. There is no single vX: each healed file carries the `since` of the tag its
        bytes first appeared at, and those differ per file. So the line names the **range** when it is a
        range — earliest, and `to <latest>` only when they differ — ordered by `compareSemverTags`, never
        lexically (`v3.10.0` sorts before `v3.2.0` as a string). It sits with the skill/retire **events**
        and before the preserved+merged family lines, because its whole point is that files which would
        have been listed as *"preserved, we cannot tell"* no longer are.
- [ ] **S7-5 — FETCH the ancestor's bytes from a published tag.** _(The owner's idea, 2026-08-21:
      *"est-ce que l'update ne peut pas aller lire dans GitHub, récupérer le fichier de la version de
      l'utilisateur pour s'en servir d'origine?"* — **measured the same hour and it works.**)_
      ✅ **IN v5 — owner's call, 2026-08-21**, taken on the measurement below. **Do not re-open the
      scope question.** Order: **after S7-3** (the wiring), **before S7-4** (the QA), so the QA covers
      the recognised files and the fetched ones in one pass.

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
  - [x] ❓ **What its design must settle** — the four questions, ANSWERED _(2026-08-21, before any code)_.

  #### 📐 S7-5-0 — THE DESIGN _(written 2026-08-21; design slice, no code in the same iteration)_

  **The population, named exactly.** It is **row 7 of `mergeVerdict`** and nothing else
  (`engine-merge.mjs:86-88`): `recorded` exists, the installed bytes differ from it, and
  `verifyBase` answers `absent` because `.engine-base/<rel>` is not there. Today that is
  `preserve/customized` + a `.new` sidecar. Files where installed **matches** `recorded` never reach it
  (rows 4-5 deliver with no ancestor at all), and files with **no** `recorded` are S7's business, not
  this slice's. **The two populations do not overlap and neither subsumes the other.**

  - [x] 🎯 **Q1 — best effort, never blocking. YES, and the worst case is TODAY'S BEHAVIOUR.**
        `defaultGit` already returns `{out, ok}` instead of throwing (`engine-fetch.mjs:118`). No bytes
        → the file falls through to row 7 exactly as it does now. **This slice can therefore regress
        nothing**, which is the strongest argument for shipping it inside v5 rather than after.
  - [x] 🔒 **Q2 — verify against the recorded sha BEFORE WRITING, not merely before merging.** Free, and
        the placement is the whole point: `verifyBase` downstream would already reject bad bytes, but by
        then they would be **persisted in `.engine-base/` as a false ancestor**, and a false ancestor is
        exactly how an update clobbers an owner's edit. So the check happens at the fetch site —
        `fingerprint(fetched) === recorded`, or the EOL-normalised form, the same double test
        `verifyBase:50` makes — and the downstream one becomes a second, independent opinion. **Belt and
        braces, both free.**
  - [x] 💾 **Q3 — YES, into `.engine-base/`, and that choice buys ZERO downstream change.** The ancestor
        is read in exactly one place (`engine-merge-apply.mjs:73-74`, straight off the disk, no seam).
        Two ways in: widen that read, or **hydrate the hole upstream and let it find the bytes**. The
        second wins for the same reason S7-3's did — `writeBaseEntries` is already the single writer of
        that tree, the three refresh families keep their signatures, and the fetch then happens **once
        ever** (the next update reads a local file). ⚠️ **Only fill HOLES**: an existing
        `.engine-base/<rel>` is the real recorded ancestor and is never overwritten.
  - [x] 🗣️ **Q4 — told, but ONLY when a fetch was attempted and FAILED**, and phrased so it cannot
        alarm. A brain that never needed one must hear nothing. A brain that tried and could not reach
        the server is in a state that is **indistinguishable from the old behaviour**, and silence would
        make a retryable situation look permanent: *"could not reach the update server to recover the
        original of N file(s) — they are preserved as usual, and the next update will try again."*

  #### 🆕 Two things the reading found that the sketch did not anticipate

  - [x] 🚨 **THE SELF-HEAL MUST NOT FETCH, and this is a safety rule, not an optimisation.** On a
        SessionStart self-heal `sourceDir === brainDir`, and the brain dir **is** a git repo — the
        OWNER'S vault repo, whose remote is their own backup, not the engine's. Running
        `git fetch origin tag …` there would point engine machinery at a personal repository.
        `applyMergeGoverned` already returns early on `sourceDir === brainDir`
        (`engine-merge-apply.mjs:45`), so there is nothing to gain either. **Gate the fetch on
        `sourceDir !== brainDir`, like the three refresh families.**
  - [x] ♻️ **The table needs NO reverse index — it is already keyed the right way.**
        `table.files[rel][recordedSha]` → `{ since, locale }` is a direct lookup: the tag AND the
        locale, which is what says whether to read `<rel>` or `templates/<locale>/<rel>` at that tag.
        `manifest.baseRefs[rel]` gives a tag too, but no locale, so it is the **cross-check, not the
        source**. (Merge files always ship at their own rel or its locale twin — a staged skill, which
        ships elsewhere, is by construction never a merge file.)

  #### 🔧 The shape, decided

  - [x] **A pure planner + a git shell**, the S7-1/S7-3 pattern:
        `planAncestorFetch({ manifest, provenance, installedFileMap, baseContentMap, table })` →
        `[{ rel, tag, sourcePath, recorded }]`, and an I/O half that fetches, **verifies**, and hands
        `{ baseRel, content }` entries to `writeBaseEntries`.
  - [x] **In the existing clone, not a new one.** `fetchSource` leaves a real working tree with an
        `origin` remote (`git clone --depth 1 --branch <ref> --single-branch`), and `update-engine`
        never removes it — `auto-finalize` re-passes the same dir to the child. So:
        `git -C <sourceDir> fetch --depth 1 origin tag <tag>` then `git -C <sourceDir> show <tag>:<path>`.
        ⚠️ **`-C <dir>` is mandatory**: `buildGitInvocation` sets no `cwd` (`engine-fetch.mjs:110`), so a
        bare `git fetch` would run in the process's own directory. And the explicit `tag <tag>` refspec
        is required, because `--single-branch` narrowed `remote.origin.fetch` to the cloned ref.
  - [x] **One fetch per DISTINCT tag**, then N cheap `git show`. The measurement says brains concentrate
        on a handful of versions, and the population is files that are BOTH edited AND outdated.
  - [x] **Order inside `reconcileBrain`: heal FIRST, then fetch.** A healed file has
        `recorded === installed` and needs no ancestor at all, so healing first is what keeps the fetch
        list minimal. Both sit together, before the refresh families.

  - [x] **S7-5-1 shipped to that design, unchanged** _(2026-08-21 · `1d545b2` + `d019d38`)_. The design
        held: the direct lookup `table.files[rel][recorded]` → `{since, locale}` needed no reverse
        index, and the locale came back from the same lookup as the tag, which is what sends a French
        brain to `templates/fr/<rel>` at that tag.
  - [x] **S7-5-2 shipped to that design, with ONE deliberate change** _(2026-08-21 · `d5324a0`)_.
        The design said *"gate the fetch on `sourceDir !== brainDir`, like the three refresh families"*,
        which put the guard in the **caller**. It is now **inside `fetchAncestors`**, at the only place
        that spawns git. Why the move: the three refresh families each gate themselves for a *behaviour*
        reason, whereas this one is a **safety** rule — a fetch in the brain dir points engine machinery
        at the owner's personal backup repository. A safety rule that every future caller must remember
        is a safety rule with a deadline. It is also what lets the report stay quiet: the shell returns
        an **empty `failed`** on a self-heal, so "attempted and failed" needs no second condition
        upstream. ⚠️ **S7-5-3 must therefore NOT re-add the gate.**
  - [x] **Also shipped, and NOT in the design**: a second refusal to overwrite an existing
        `.engine-base/<rel>`, inside the shell. The planner already excludes those; this one exists
        because overwriting a real ancestor is the module's one irreversible act, and the guard belongs
        beside the write, not only in the code that decides.
  - [ ] ▶️ **NEXT: S7-5-3, the wiring + the one report line** — the header's RESUME AT block lists the
        four points it must hit.
  - [ ] 💡 **The tail nobody should promise yet**: `CLAUDE.md` and `settings.json` could in principle be
        RECONSTRUCTED from their `.template` at the right tag plus the substitutions. **Not measured, not
        promised** — the substitution inputs must be recoverable byte-exactly, and they may not be.

- [ ] **S7-4 — the QA.** ⚠️ **Its headline deliverable is ALREADY PAID** _(S7-3, 2026-08-21)_: the
      Pole A inversion could not be deferred, because S7-3 turned that test red and nothing is ever
      committed red. It is inverted, with the assertion it replaces written out above it, and it passes
      on the real `v3.6.0` fixture tree. **What is left for S7-4** is the breadth this did not buy: the
      **FR** side (both of the owner's real brains are French and no fixture is), a **second tag hop**,
      and the **skills / scripts** families rather than the doctrine alone. Original wording kept:
      Extend
      `release-fixture-doctrine.test.mjs`: a brain rebuilt from `v3.6.0` with **no provenance at all**
      must now **RECEIVE** the doctrine. Today the same suite asserts the opposite (Pole A: preserved,
      `no-provenance`). **That inversion is the deliverable** — the old assertion is rewritten with its
      reason, never deleted quietly, because it recorded a truth that this plan is removing.

---

## 🇫🇷 S8 — the French tree stops drifting in silence

- [x] **S8-1 — port `8341e18`** into `templates/fr/CLAUDE.engine.md`: the precision that the active
      universe is committed, so it follows the owner between machines (ADR 0034). One paragraph.
      _(2026-08-21 · `775c00a` · doc-only slice, no mutation pass, skip recorded)_
      - [x] 🔎 **Measured while porting: the FR tree has a counterpart for only ONE of that commit's
            three files.** There is no `templates/fr/.claude/skills/switch/` and no
            `templates/fr/SETUP.md` at all, so the port is genuinely one paragraph.
            ❌ **What this row concluded from that was WRONG, and S8-2-0 corrects it**: it said the
            drift guard must treat "no FR twin" as a case of its own. It must not report it at all — a
            rel is locale-owned **iff** a twin exists (`engine-copy-select.mjs:20`), so no twin means
            the product did not localize the file. Kept here because the wrong inference is instructive:
            it was drawn from the outside, and one look at the code settled it.
      - [x] 🎯 **The S7-2 freshness guard bit, on a slice unrelated to it.** Editing the FR doctrine
            changed its bytes, so the shipped table stopped describing the release being cut; the guard
            failed by name, with the regenerate command in its message. Table regenerated: **one row
            added** (the new FR state at v5.0.0), 78 distinct states over 25 tags. **The coupling needs
            no written rule** — any edit to a merge-regime file invalidates the table, and the guard
            says so at the moment it matters.
- [x] **S8-2 — the EN/FR drift guard.** _(2026-08-21 · S8-2-0, S8-2a, S8-2b `ab85fde` + `417e264`;
      box ticked 2026-08-22, found unticked during S10-6b's carrier pass.)_ A test that fails when a
      `templates/fr/<rel>` pair has fallen behind its English source. It judges **no translation quality**: it makes the omission impossible
      not to see, exactly like the plan-carrier guard. **The argument for it is on the record**: the
      same drift was measured by hand in conversation and the measurement was wrong.

  #### 📐 S8-2-0 — THE DESIGN _(written 2026-08-21; design slice, no code in the same iteration)_

  Every number below was **measured on the 16 real pairs**, not reasoned about.

  - [x] ✅ **THE CRITERION: unpaired commits.** For each pair, count the commits touching `<rel>` since
        the FR twin's own last commit **that do not also touch `templates/fr/<rel>`**. Greater than
        zero is drift. No dates, no thresholds, no arithmetic on timestamps.
  - [x] ❌ **AND HERE IS WHY THE OBVIOUS SIGNAL IS WRONG, quantified.** "Commits on EN since the FR
        twin's timestamp" reads **1 for a perfectly-synchronised pair**, because the pair was updated
        in **one shared commit** and that commit falls inside its own window. Measured: **14 of 16
        pairs scored 1** and every one of them was in sync. Subtracting the commits that touched BOTH
        sides collapses those 14 to **0** and leaves exactly **2** real hits. This is the same-day
        misfire the plan warned about, and it is worse than "same day": it fires on the same COMMIT.
  - [x] 🎯 **The acceptance case passes.** `sync` FR is named, via `435c164`. It is **61 lines against
        96** — and that whole gap is **ONE** unpaired commit.
  - [x] 🗣️ **Which is exactly why the guard must print SUBJECTS, not a count.** A count cannot carry
        magnitude: `sync` and `prepare-1-1` both score 1, and one is a third of the file while the
        other is a one-line review fix. Output per drifting pair: the rel, then each unpaired commit as
        `<short-sha> <subject>`. A human reads the subject and knows the size; a number tells them
        nothing and trains them to ignore it.
  - [x] 📋 **The pair set is DERIVED, never listed.** A rel is locale-owned **iff it appears under
        `templates/<locale>/`** — the engine's own rule, and `engine-copy-select.mjs:20` says so in as
        many words: *"with no list to maintain here."* The guard reuses it and inherits new pairs for
        free.
  - [x] ❌ **CORRECTION to what S8-1 wrote one iteration ago.** S8-1 recorded that "no FR twin at all"
        (`switch`, `SETUP.md`) must read differently from "twin behind". **It must not be reported at
        all.** By the rule above, no twin means *the product did not localize this file* — not an
        omission. Reporting it would flood the output with every English file forever, and a guard that
        cries wolf is a guard that gets skipped. **Localizing a file is decided by creating its twin**,
        and the guard starts watching it from that moment. (Found by reading `engine-copy-select.mjs`
        rather than by assuming; the S8-1 note was written from the outside.)
  - [x] ⚠️ **Two limitations, stated rather than discovered later.** A **rename** resets the window and
        makes the guard under-report (`--follow` is available per-pair and is deliberately not used in
        v1: it has its own heuristics, and an under-reporting guard is honest while a mis-attributing
        one is not). And a twin **created later** than the EN file is assumed current at creation —
        which is what creating it means.
  - [x] 🛑 **SEQUENCING, and it is a real consequence: the guard is RED ON ARRIVAL.** Two pairs drift
        today, and nothing is ever committed red. So S8-2 **splits**, and the port comes first:
    - [x] **S8-2a — port the drifting commits into FR** _(2026-08-21 · this commit)_. **Only ONE of the
          two was a port.** `435c164` is ported into `templates/fr/.claude/skills/sync/SKILL.md`: the
          standing rule for `.vault-rag/active-universe` (the machine you sit at wins, and `--theirs` is
          the counter-intuitive command that means it), the read of the active universe on both sides of
          the rebase, and the one-line announcement when it changed. In French, tutoiement and inclusive
          forms like the rest of the FR tree; the fingerprint table was regenerated (the S7-2 guard fired
          on cue, and 78 byte-states became 79).
    - [x] 🎯 **`f7a00fc` needs NO port, and finding that out is the most valuable thing this slice
          produced** _(2026-08-21)_. Its own commit message says it: *"EN only, verified against the FR
          sibling **which had it right**"*. It adds a blank line so CommonMark stops folding a paragraph
          into the preceding list item, and **`templates/fr/…/prepare-1-1/SKILL.md:66` already has that
          blank line.** The FR is not behind; **the EN caught up with the FR**.
    - [ ] 🛠️ **CONSEQUENCE FOR S8-2b — the criterion has a false-positive class, measured on the very
          next slice after it was designed.** "Unpaired commit" cannot see DIRECTION: a commit that
          brings EN up to FR's standard is unpaired forever, because the correct FR edit is *no edit*.
          Left alone, `prepare-1-1` is a permanent red the port can never clear, and a guard nobody can
          get to green is a guard that gets deleted. **The fix, decided here**: alongside the commits
          that touched both sides, the guard subtracts a `NOT_A_PORT` map of `sha → one-line reason`,
          **living in the guard's own test file** — so adding a waiver is a reviewed code change carrying
          its justification, not a config line. First and only entry: `f7a00fc`. ⚠️ **The risk, named
          rather than discovered**: a waiver list is how a guard dies. The message must therefore print
          BOTH ways to clear a hit (port it, or waive it *with a reason*), and a growing map is a signal
          to re-examine the criterion, not to keep typing.
    - [x] **S8-2b — the guard itself** _(2026-08-21 · `ab85fde` + `417e264`)_. `scripts/lib/locale-drift.mjs`
          + its test. **It lands green over the 16 pairs**, and the waiver was load-bearing exactly as
          predicted: with `NOT_A_PORT` emptied it goes red naming `f7a00fc` and nothing else. Two tests
          stop it passing vacuously (the derived pair set is non-empty and contains the pair this was
          measured on; every waived sha still resolves to a commit) — the failure mode of every
          "assert empty" test.
      - [x] 🧪 **Mutation: 82.28 % first pass on a new file, and all four causes were real** — no
            equivalents hiding as excuses. An absent payload never fed to `parseCommits`; a pair fixture
            **already in sorted order**, so removing `.sort()` entirely still passed (five mutants at
            once); no `^` anchor asserted, so `docs/templates/fr/x.md` could silently join the watched
            set; and `describeDrift` asserted by fragments, which let every *other* line be emptied
            unnoticed — and that message **is** the feature. Two equivalents are NAMED in the source
            (`$` after a greedy `.+`; `<` vs `<=` on paths that are never equal).
            **Landed at 98.73 %** _(82.28 → 97.47 → 98.73, `3625dee`)_, the single survivor being the
            named `<` / `<=` equivalent. The second pass paid for a rule worth carrying: the standing
            advice is *collections of at least two, unsorted*, but **on a comparator two is not
            enough** — with two entries, reversing the list and sorting it give the same answer, so a
            comparator ignoring both its arguments survives. It takes three. Full detail in
            `mutation/RESULTS.md` § S8-2b.
      - [x] 🧱 **The repo's own entrypoint-discipline guard caught the git seam** and was right: the
            invocation is now `engine-fetch`'s `buildGitInvocation`, not a second spelling of "ask git".
            The seam deliberately **throws** where `defaultGit` returns `{ok:false}` — that convention
            here would turn a broken git call into "no drift found", the exact silence this guard exists
            to break.
      - [x] ⚠️ The fingerprint table needed no regeneration: this slice touched no `merge`-regime file.
- [x] **S8-3 — the FR delivery, and its replay QA.** _(2026-08-21 · `a58ecf8`)_ A pole in the release
      fixtures for a **French** brain: it receives the FR doctrine, not the English one, through a real
      update. **There was no engine fix to make** — the delivery already resolved the locale, and the
      defect was in the fixture, which built an English brain and called it French. Full account in the
      box at the top of this file. What shipped: `brainAtRelease` takes a `locale` and writes the
      marker from the tag's own overlay, Pole D is inverted and green, and a second test pins that the
      marker is really written.
- [x] **S8-4 — the locale doctrine recorded as an ADR.** _(2026-08-21 · **ADR 0040**, indexed in
      `maintainers/README.md`)_ Checked first, as the item required: **no existing ADR owns
      localization** (0012 owns packaging, 0038 the merge-governed boundary, 0025/0039 the install and
      retire doors — all four locale-blind by design), so this is a new number rather than an amendment.
      The three rules are deliberately about three *different* things: which files are localized (a
      twin exists — derived, never listed), what language a brain is (`demo-locale.mjs`, **on that
      brain**, and nothing else), and which source an update reads (`resolveLocaleSource`, once, in the
      shared carrier). **The corollary is the one this night paid for**: a `locale` reported by the
      fingerprint lookup describes THE BYTES it matched, never the brain — the two agree on a healthy
      brain and that agreement is a consequence, not a definition. No behaviour change; it writes down
      what the code has enforced since v4.9.1. No mutation pass: documentation only, skip recorded.

---

## 🗣️ S10 — a personalized file becomes a QUESTION, never a blind spot

> **Numbered S10, but it runs BEFORE S9.** Execution order is **S7 → S8 → S10 → S9**; the number is an
> identifier, not a rank, and renumbering a live plan breaks every reference already written down.
>
> **Owner's criterion, 2026-08-21** (in the decisions block above): an update modernizes everything
> except what the person customized, and for those it **asks**, in words a non-technical person reads
> without help. Three offers: **take the new one**, **keep mine**, **combine them**.

#### 📐 S10-0 — THE DESIGN _(written 2026-08-21; design slice, no code in the same iteration)_

Every claim below was **checked against the code**, not reasoned about — the night has now cost two
false alarms to diagnoses written from reading (`f7a00fc`, and the FR-overwrite box at the top).

- [x] ✅ **The sketch's Brick 1 is CONFIRMED, and the code states the decision it must overturn.**
      `mergeVerdict` row 3 returns `{verdict: "preserve", reason: "no-provenance"}` with **no
      `sidecar`**, and `engine-merge-apply.mjs` says why in as many words: *"littering an older brain
      with unexplained sidecars would be noise, not a choice."* **That reasoning is exactly what S10
      dissolves**: the sidecar stops being unexplained the moment a conversation explains it. The old
      decision was right for a world with no question; it is wrong for this one.
- [x] 🎯 **AND THIS IS PRECISELY THE PERSONALIZED-FILE CASE, after S7 as before it.** S7 heals by
      recognising bytes in a table of published states, and S7-5 fetches an ancestor for a **recorded**
      sha. A file the owner EDITED matches no published state and has no record, so both walk past it
      and it lands on row 3. **S7 shrank row 3 to almost exactly the set S10 exists for**, which is why
      these two slices belong to the same release.
- [x] 🛑 **THE BIGGEST CORRECTION TO THE SKETCH — Brick 2 asks for a mechanism THAT ALREADY EXISTS,
      and the sketch's version of it would be worse.** `engine-divergence-nudge.mjs` (S4-4a) already
      says this fact **at rest**, at every session start: one line, first file named, count exact,
      *"Nothing to do: a file the engine leaves alone is a choice, not a problem."* The sketch proposed
      *"the pending decisions live in a file the brain re-reads"*. **They must not.** The LIST is
      DERIVED from the disk by `engineDivergence` (S4-2) and cannot go stale; a stored list of pending
      files is a second copy of a fact the disk already answers, and this plan has spent the night
      deleting exactly that shape.
- [x] 📌 **So the ONLY genuinely new state is the ANSWER, and it is small.** What the disk cannot
      derive is *"the owner has already been asked about this file, and said keep mine."* Without it
      the question repeats forever, which is the consent fatigue the whole feature must avoid.
      **Shape**: `rel → { decision, at: <engine ref> }`, keyed by the **engine version the answer was
      given against**.
  - [x] 🎁 **Keying by version answers a question the sketch asked separately and could not settle**:
        *"what happens if the person never answers — silently forever, or once per release?"* It falls
        out. A new version means a new candidate, so the answer no longer covers it and the file is
        raised **once more, once per release** — no rule to write, no timer, nothing to tune.
  - [x] 📂 **Where it lives: beside `.engine-base/`, not in the manifest.** The manifest is
        engine-owned and rewritten by every update; this is a fact about the OWNER. `.engine-base/` is
        the precedent — brain-side, written by the engine, committed by `add -A`, so **it travels to
        the other machine**, which matters because the owner may well answer there.
- [x] 🚨 **"TAKE THE NEW ONE" IS THE ONLY DESTRUCTIVE OFFER, and it is not free-recoverable today.**
      Measured: the brain's `auto-commit` stages `git add .` (the whole tree, engine files included),
      and `engine-commit.mjs` commits **after** the update has written. So an edit that was already
      committed is recoverable from git history — but an edit made outside a session and never swept
      is **overwritten and then committed over**, in one pass, with no trace. **Decision: "take the new
      one" makes a safety commit BEFORE it writes**, and says so in one clause. The offer that destroys
      is the one that has to earn it.
- [x] 🤝 **"Combine" records its ancestor exactly like the mechanical merge, and this is `S7-0`'s trap
      verified rather than assumed.** Row 8 is `{write: merged, deliver: candidate}`, and
      `engine-merge-apply.mjs` comments that `deliveredFileMap` feeds `reseedProvenance` and
      `syncBaseTree` — *"recording the merged file as the ancestor would make it read untouched at the
      next update."* A combination follows the same split: **the disk takes the combination, the base
      advances to the CANDIDATE.** No new rule; the existing one already covers it.
- [x] ❌ **The three offers do NOT apply to `.claude/settings.json` in v5, and the reason is not
      "it merges differently".** ADR 0038 named it merge-governed, and its own index entry records
      that **nothing in this release delivers it**. With no candidate there is no offer to make.
      Asking about a file the engine is not updating would be a question with no answer that changes
      anything — the definition of a nag.
- [x] 🗣️ **Bricks 3, 4 and 5 stand as sketched** and are the brain-side skill's, not the engine's:
      plain words, no conflict markers, no paths as the headline; "combine" works with NO ancestor
      because Claude reads both versions (which is *why* it cannot live in `update-engine.mjs`); and
      grouping with *"take all the new ones / keep all mine / let's go through them"* so twelve files
      are not twelve questions.
- [x] 🧭 **The architectural move is unchanged and now has its seam**: `update-engine.mjs` still never
      prompts. It **prepares** — drops the sidecar, leaves the file untouched — and the divergence
      nudge already carries the fact to the next conversation. What S10 adds to the engine is a
      sidecar and an answers file; everything that talks is brain-side.

**The slices this cuts** (S10-1 → S10-4), smallest shippable first, each green on its own:

- [x] **S10-1 — row 3 gets its sidecar.** _(2026-08-21)_ `mergeVerdict` returns `sidecar: candidate`
      for `no-provenance`; `preserved` gains the `newVersionPath` it already carried for row 7; the two
      comments that forbade it are **kept and corrected**, because the reasoning was sound and it is
      the premise that stopped holding.
  - [x] 🎯 **Seven downstream tests asserted the old behaviour**, each inverted deliberately with its
        old claim kept above it. **Two got STRONGER, not weaker**: a stale sidecar from an earlier
        update is now asserted to be **replaced by the current candidate** rather than merely deleted
        (the unconditional clear was untested against a re-drop), and a brain already holding the
        candidate is still offered nothing — the part the old rule was genuinely right about, which
        survives one row up at `unchanged/no-base`.
  - [x] ⚠️ **KNOWN INTERMEDIATE STATE, named so it is not discovered later**: between S10-1 and S10-3
        the sidecar exists on disk and **no surface mentions it**. `unprovableLine` says nothing false
        — it simply does not know about it yet — and the divergence nudge's `no-provenance` clause
        makes no claim either. This is exactly the "unexplained `.new`" the old rule warned about, and
        **S10-3 is its exit**. It cannot reach the fleet: S9 (cut, tag, publish) runs after S10.
  - [x] 🧪 **Mutation 100 % on the changed hunk** (`:64-71`, 8 mutants), plus a hand-applied bite-check
        on the mutant that matters: deleting `sidecar: candidate` turns **9 tests red**. ⚠️ The serial
        confirmation § S7-5-2 asks of a perfect score was **deliberately not run** — `mutate-one.mjs`
        has no `--concurrency` flag and the alternative is editing a shared config whose forgotten
        revert no guard would catch. Recorded as such in `mutation/RESULTS.md` § S10-1.
- [x] **S10-2 — the answers file.** _(2026-08-21)_ `scripts/lib/engine-answers.mjs`:
      `rel → {decision, at: <engine ref>}` in `.engine-answers.json`, named once like `BASE_PREFIX`
      so no caller grows a second convention. The version-keyed re-raise falls out of the lookup, as
      designed — no timer, no rule.
  - [x] 🧭 **It FAILS TOWARD ASKING**, and that is a decision, not a detail: unreadable file,
        malformed JSON, an entry with no version, all count as **not answered**, and a bad entry drops
        on its own without taking its siblings with it. Re-asking is a mild annoyance; silently
        swallowing the question is the defect S10 removes.
  - [x] 🛡️ **The "it travels to the other machine" claim is MEASURED, not asserted in prose.** It
        rests entirely on git tracking the file, so a test pins that the **shipped `.gitignore` does
        not ignore it** (checked empirically first, in a throwaway repo). One line added there would
        strand every answer on one laptop, and the only symptom would be settled questions coming
        back — a defect with no error message.
  - [x] 📊 **Measured: 80 % first pass → 97.44 %** (`62025ec`), and the score is the small half of it.
        Of 12 survivors, **2 were real gaps** (a `null` entry, an empty `at`) and **10 were dead
        code** — four guards no input `JSON.parse` can produce is able to reach. Deleting them dropped
        the mutant count **60 → 39**: twenty-one mutants stopped existing rather than being killed.
        The single survivor left is a verified equivalent (`readFileSync(…, "")` returns a Buffer,
        which `JSON.parse` coerces as UTF-8). Detail: `mutation/RESULTS.md` § S10-2.
  - [x] ⬇️ **The judge was caught lying DOWNWARD for the first time** — same HEAD, same tests, two
        runs: 78.33 % then 80 %. The disputed mutant, hand-applied, turns the suite **red**. Every
        earlier note in `RESULTS.md` described the runner inventing *kills*; this one invents a
        *survivor*, which is worse — it sends you to weaken a passing test to chase a hole that is
        not there. **New standing rule, written into `RESULTS.md`'s top box: a test is never weakened
        to chase a survivor, and no survivor is acted on until it reproduces or is hand-applied.**
- [x] **S10-3 — the wiring.** _(2026-08-21 · `216d3b6`)_ The divergence nudge subtracts answered files
      at the current ref, and the update report names both the sidecar and what is awaiting an answer.
      No new surface: two existing ones taught the subtraction. **This is the EXIT from the known
      intermediate state** named under S10-1 — since then a sidecar sat on disk with nothing anywhere
      to explain it.
  - [x] 🚪 **The offer, and it is the owner's acceptance criterion in one sentence**: *"ask me about
        those N files and I'll offer, for each one, to take the new version, keep yours, or combine the
        two."* It borrows all three of `walkthroughOffer`'s non-negotiables — **once** per report
        whatever the families, no alarm, and it promises only what exists **today**. A preserve with no
        candidate (a retired skill) is offered nothing: a question whose answer changes nothing is the
        definition of a nag.
  - [x] 🚨 **The subtraction lives in the NUDGE, not in its caller** — the decision of the slice. That
        surface is the only one that speaks **unbidden**, at every session start, so it is the only
        place consent fatigue can be built; a filter in the caller would be reinstated by the next
        caller that never heard of it. `answers` defaults to *"nothing answered"* (the literal state of
        the whole fleet), so the forgettable half is the **wiring** — pinned in the hook's own test,
        because a caller that never read the file would nag forever in silence.
  - [x] 🧭 **The report deliberately does NOT subtract, and the reason is not laziness.** It prints
        inside an update the owner just launched — they are present, it is one line — while the nudge
        arrives unasked. And reaching a `rel` from the report would mean joining skill NAMES to paths:
        the exact join `divergenceLines` already refused once. Two surfaces, two different duties.
  - [x] 🔁 **Two comments corrected rather than deleted, same shape as S10-1's**: *"pointing at a
        `.new` would be the report inventing a file"* was sound and its **premise** died at S10-1.
        Silence is now what invents something. What survives untouched and is asserted harder: the
        line still never says *"customized"* — admitting we cannot tell whose bytes those are and
        pointing at the version that awaits are not in tension.
  - [x] 🔗 **The "read the path unconditionally" rule now covers `no-provenance` too, and it is PINNED
        rather than assumed**: `engine-merge-apply.test.mjs` asserts the whole `preserved` entry for a
        brain with no recorded sha, so a producer that stopped writing the sidecar goes red **before**
        the report can print `undefined` at an owner. Five stale fixtures were passing a shape the
        producer stopped emitting at S10-1 — they are what surfaced this.
  - [x] 🛑 **The measurement caught its own instrument first**: the four changed hunks were passed as
        ONE comma-joined argument, and Stryker silently mutated only the first — **4 mutants, a serene
        100 %**. Spelled correctly (the file repeated per range) it is **33 mutants and 93.94 %**.
        ➡️ **Read the mutant COUNT, not only the score**: the count is the only field that says what
        was measured. Written into `RESULTS.md` § S10-3.
  - [x] 🧹 **And the two real survivors were dead code, one slice after S10-2 taught exactly that.**
        The offer's `.filter(newVersionPath !== undefined)` can never drop an entry: **all five
        `preserve` outcomes carry a sidecar**, which is the fact `preservedAndMergedLines` already
        relies on three functions up — I extended that very comment two edits before contradicting it.
        A retired skill is excluded **structurally** (its own array, never passed here), not by a
        filter. Deleted, not documented (`66f00c3`), and the test whose title claimed more than it
        measured was renamed with it.
- [x] **S10-4 — the safety commit.** _(2026-08-21 · `e7a1952`)_ `safetyCommit({ git, rel })` in
      `engine-commit.mjs`, returning `{ outcome, proceed }`.
  - [x] 🚨 **The decision of the slice is the FAILURE SEMANTICS, and it inverts this module's own
        precedent.** In `commitEngineUpdate`, twenty lines up, a refused commit is **news**: the files
        are already on disk and the report names the cause. Here it is a **VETO**, because the write
        has not happened yet and it is not undoable. Both live in one file **on purpose**, so a reader
        meets the contrast instead of deducing it.
  - [x] 🧭 **`proceed` is ONE field, and it is the only thing a caller may branch on.** The rule
        *"which outcomes are safe"* lives in the module — the same discipline as S10-3's subtraction —
        so a second caller cannot invent a looser one. `outcome` is for the sentence and the log,
        never for the decision.
  - [x] 🔇 **Every veto has a sentence the owner can read** (`ADOPTION_BLOCKED_LINE`): what was NOT
        done, why, and the one thing that lifts it. A veto nobody can read is a file that silently did
        not change — the blind spot S10 exists to close, wearing a different coat.
  - [x] ⚠️ **What it CANNOT do is written into it rather than implied**: it has no idea when the caller
        writes, so it cannot enforce *"before"*. It can only refuse to say `proceed`.
  - [x] 🪪 **`add -A`, never the one file.** The owner's edit to the file being adopted is the obvious
        casualty; the note they wrote in the same minute is the quiet one, and this commit exists to
        make the whole moment before the overwrite recoverable.
- [ ] ⚠️ **Bricks 3-5 (the conversation itself) are brain-side skill content**, not engine code, and
      are cut with S10-3 rather than before it: the skill can only speak about a record that exists.

### 🎨 S10-5-0 — DESIGN: where the three offers LAND ON DISK _(2026-08-22, design slice — no code)_

**Why this slice is a design and not the prose.** Bricks 3-5 are skill wording, and the wording was
about to promise something the engine cannot yet record. Writing *"I'll combine the two"* is easy;
what happens to the **ancestor** afterwards decides whether the same question comes back at every
release forever. `S7-0`'s trap, one more time, and this is where it gets answered rather than met.

- [x] 📐 **MEASURED FIRST, not reasoned from reading** _(2026-08-22)_ — the night's standing lesson.
      The v5.0.0 bytes of merge-governed files **are** present in `scripts/lib/engine-fingerprints.json`
      (checked on `CLAUDE.md` and `CLAUDE.engine.md`, EOL-normalised sha256, found). That single fact
      is what separates the three offers below, and it was one command rather than a paragraph of
      plausible reasoning.
- [x] 🎯 **The rule, one line, and it covers all three offers**: **the disk takes what the OWNER
      chose; the base advances to the CANDIDATE only when the owner accepted the candidate's content.**

| Offer | What lands on disk | The base (`.engine-base/`) | Why |
|---|---|---|---|
| **keep mine** | nothing — their file stands | **must NOT advance** | Recording the candidate as the ancestor of a file they refused would make the next merge treat v5's text as the agreed common origin, and silently fold it in. That is the S7-0 trap **inverted**, and it is worse than the freeze it replaces. |
| **take the new one** | the candidate | advances to the candidate | Their bytes become a published byte-state. |
| **combine** | the combination | advances to the **candidate**, never to the combination | `engine-merge-apply.mjs`'s own rule for row 8, word for word: recording the merged file as the ancestor would make it read *untouched* at the next update. |

- [x] 🕳️ **THE GAP THE MEASUREMENT FOUND, and it only bites ONE of the three.** *Take the new one*
      needs no new engine seam at all: the adopted bytes are a published byte-state, so **S7's heal
      recognises them at the next update** and records the base by itself. **Combine does not** — a
      combination is in no table, ever, so without an explicit record it stays unprovable and the
      **same file is raised again at every release**. The answers file hides the nag for one version;
      it does not fix the cause.
- [x] ⚖️ **Decision: adoption records the ancestor ITSELF, for both writing offers, rather than
      leaning on the heal for one and inventing something else for the other.** Two reasons. (1) One
      rule beats two: *"the base advances to the candidate"* is already written for row 8, and a
      second path that reaches the same state a cycle later, by a different mechanism, is a divergence
      waiting to happen. (2) Leaning on the heal leaves a **visible wart** — until the next update the
      report still calls an adopted file *held back*, which is a surface saying the opposite of what
      the owner just did.
- [x] 🧹 **Adoption removes the sidecar.** A `.new` is a promise that a newer version awaits; once the
      choice is made it is a claim about a decision already taken. (The engine also replaces a stale
      one at the next update — S10-1 — but that is a repair, not a reason to leave litter.)
- [x] 🚦 **The safety commit (S10-4) gates the two WRITING offers only.** *Keep mine* writes nothing to
      the file, so there is nothing to lose and nothing to earn.

**The slices this cuts** — two, in this order, because the prose may only promise what exists:

- [x] **S10-5 — the adoption seam** (engine code): one function that takes a `rel` and a decision,
      runs the safety commit, writes the chosen bytes, **advances the base to the candidate**, records
      the answer, and removes the sidecar. Refuses to do any of it if `safetyCommit` says
      `proceed: false`. `syncBaseTree({ deliveredFileMap })` is the existing mechanism — this is
      wiring, not a new concept. _(2026-08-22 · `4238e16` + `363db77`)_
  - **Shipped as designed**, `scripts/lib/engine-adopt.mjs`: `planAdoption` is the rule, pure, wearing
    `mergeVerdict`'s own `{write, deliver}` because it IS row 8's rule with a human in place of
    `git merge-file`; `adoptCandidate` is the wiring. **Two refusals leave the brain exactly as it
    was and record NO answer** — a vetoed safety commit, and a missing sidecar (`no-candidate`,
    reachable in ordinary life when the offer was already taken).
  - 🛑 **What the design did not foresee, and mutation did**: the seam **rebuilds** the provenance
    table, so it can also FORGET it. The one-file fixture made that unreachable; a real brain has 79.
    Fixed in the fixture, not by a guard. Full write-up: `../../mutation/RESULTS.md § S10-5`.
- [x] **S10-6a — the COMMAND, split out of S10-6 on contact.** _(2026-08-22 · `087d57b` + `160d36e`)_
      The plan cut S10-6 as prose. It could not be written: the seam is a **function**, the
      conversation is a **skill**, and a skill can only run a **command**. Writing the prose first
      would have described a capability nothing could reach — the exact shape of promise this release
      exists to stop making. `node scripts/adopt-engine-file.mjs <file> take-theirs|keep-mine|combine
      --from <path>`, manifest-declared, exit `0` applied / `1` refused-and-untouched / `2` bad call.
- [x] **S10-6b — bricks 3-5, the conversation** (skill prose, EN **and** its `templates/fr/` twin in
      the SAME commit, or `locale-drift` goes red) _(2026-08-22 · `a4e7783`)_: what the person changed and what the new version
      brings, in plain words, **no jargon, no conflict markers, no paths as the headline**; the three
      offers; "combine" read by Claude from both versions when there is no ancestor; and the grouping
      that keeps twelve files from becoming twelve questions.
  - ⚠️ **No unit to mutate**: this slice is prose. What stands in for the mutation gate is the
    wording review (`CONVENTIONS.md` §10-11 register rules), plus the structural tests the skill
    already has (manifest regime, drift pair).

  > 📎 **THE SKETCH BELOW IS THE INPUT, NOT THE PLAN.** It is what the conversation produced, kept
  > because § S10-0 above is a set of corrections and a correction is unreadable without what it
  > corrects. **Where the two disagree, S10-0 wins** — notably on Brick 2, whose "pending decisions
  > live in a file the brain re-reads" is precisely what the design rejects.

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

- [x] **S10-1 → S10-n — the slices, CUT** _(2026-08-21, by S10-0)_ — they are **S10-1 → S10-4**, listed
      at the end of § S10-0 above. Four, not "n": the design collapsed the sketch's pending-decisions
      record into an answers file, because the list itself is already derived from the disk.
- [x] **S10-QA — the acceptance test, and it is the owner's sentence turned executable.**
      _(2026-08-22 · `612f306`, `5c16fc2`, `ea78d42`, `e2036be`)_ A brain rebuilt from the real
      `v3.6.0` tag, with three files **edited before v5.0.0**, comes out of an update with a real
      choice offered and **nothing silently left behind** —
      `scripts/lib/release-fixture-adoption.test.mjs`, five poles, beside S7-4's.
  - [x] **Three product defects, found on the real tree and fixed test-first.** An answer recorded on
        a brain that **cannot name its engine version** was written and silently dropped on read
        (`UNKNOWN_REF`); a **conflict's `.new` carries `<<<<<<<` markers** and was adoptable blind,
        which would have pasted them into the live file *and* recorded them as the ancestor; a `merge`
        glob matches `SKILL.md.new`, so **every sidecar counted as a held-back file** — the engine
        naming its own offer as a divergence.
  - [x] **And one in the QA instrument itself**: `updateFrom` stopped at the reconcile, leaving the
        brain on its **install-day manifest** — a state no brain is ever in after a real update. It
        now performs the manifest write that always follows in the field, including what that write
        does **not** advance (`regimes` — see the arbitration box in the header).
  - [x] **Measured**: 96.15 % over the changed hunks, then 100 % over nine hunks Stryker had
        **silently skipped**. `../../mutation/RESULTS.md § S10-QA`.

---

## 🏁 S9 — the release tail

- [x] **S9-1a — the marketing surface re-read (CONVENTIONS §10) and its corrections.** _(2026-08-22)_
      **Split on contact from S9-1**: §10's re-read corrects what the repo CLAIMS (factual, mine); the
      note is his VOICE. The full verdict, including the files that needed nothing, is in the header —
      it is not restated here.
  - [x] **The absolute promise that rotted**, exactly what §10 says to hunt first: `SETUP.md` swore an
        update never writes to a skill you customized. S7-5 makes a customized skill MERGE, so the file
        does change, with the owner's words still in it. **"Never written to" was a freeze; "never
        LOST" is the promise that survives an update** — and it is the note's lead.
  - [x] **Six passages corrected** across `README.md`, `EN-QUOI-C-EST-DIFFERENT.md` and `SETUP.md`; the
        **heal**, which appeared in no user-facing document at all, is now in the updater bullet.
- [x] **S9-1b — the release note, DRAFTED** _(2026-08-22)_ — [`release-v5.0.0-note.md`](release-v5.0.0-note.md),
      to `CONVENTIONS.md` §11's shape. **Both old forbidden claims have fallen** — S7 made *"unfreezes
      nobody already installed"* false, S10 made *"the merge does not reach back"* irrelevant to the
      user — so the note says plainly what it could not say before.
  - [x] **Written to be published as-is; the VOICE and the TITLE are his.** Three title candidates are
        listed at the top of the file, per v4.9.1's precedent (he took the one naming the symptom
        people lived, over the one naming the mechanism).
  - [x] **§11's *do not alarm* honoured**: S10-QA's three findings were caught before any tag and
        appear nowhere in the note. The honest LIMITS do appear, below the fold — same-region edits
        still conflict, the ancestor fetch needs the network and a live tag, and the install-day
        regime list keeps the doctrine out of the between-updates banner on a pre-v4 brain.
  - [x] **Verified, not assumed**: `indexSchemaVersion` is unchanged since `v4.9.1`, so nothing is
        re-read or re-encoded and *"What you have to do"* is one line.
- [ ] ▶️ **NEXT — S9-2a — the release materials** (the PR body for #76 + a pre-flight sweep). Mine:
      assembling what a release needs is checkable work.
- [ ] **S9-2b — cut, tag, publish.** The owner's, always. **Deciding to publish is not delegable**, and
      that is the line the S9-1 / S9-2 splits both draw.
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
