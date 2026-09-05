<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- THE canonical plan for making the harness FASTER to work in without      -->
<!-- lowering what it proves. Opened 2026-09-05 after the owner asked why a   -->
<!-- simple feature costs a night, and the branch was MEASURED rather than    -->
<!-- guessed. Starts AFTER v5.1.0 is tagged — see the constraint below, it is -->
<!-- deliberate. Owns its own state; no other file restates it.               -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Action plan — the instrument costs 81 minutes where the rule promised 3, the first pass keeps re-finding a list we already have, and the record is read at the price of the work

Opened at the owner's ask, 2026-09-05: *"j'ai l'impression que tu es beaucoup plus lent que ce que tu
pourrais être pour le même niveau de qualité … comment on pourrait, un, accélérer, et deux, faire en
sorte que tu arrêtes de faire des tests avec une mauvaise couverture et des tests de mauvaise qualité ?"*
Extended the same day, on the record-keeping side: *"je pense qu'il faut qu'on le maintienne, mais par
contre il y a peut-être des optimisations … il faut qu'on arrête d'ouvrir en permanence et de lire en
permanence des plans énormes qui sont déjà faits."* → **S3**.

## 📍 STATE — the only perishable block in this file · opened 2026-09-05

- ⏸️ **NOT STARTED, AND DELIBERATELY HELD until `v5.1.0` is tagged** _(owner's call, 2026-09-05:
  "on valide cet ordre")_. The order he validated is: **finish 9.5 with the instrument as it is**,
  then S1, then S2. Changing the runner mid-measurement would put two instruments in one release
  note's *Quality* paragraph, and the 9.5 batches left are small (~1 h) — the tooling work saves
  almost nothing by jumping the queue, and costs comparability. **S3 was added after that call**, on
  the same day and on the same terms.
- 🔧 **"THE INSTRUMENT AS IT IS" CHANGED ONCE, ON 2026-09-05, AND ONLY FOR THE BETTER** _(`ae5f61b`)_.
  The suite carried a test that failed about 1 run in 8 under load, and since every mutant re-runs the
  whole suite, an intermittent failure did not add noise to a score, it added **points**. It is gone —
  deleted with the barrier it asserted, not stabilised. **Nothing here moves because of it**: this plan
  stays held until the tag and still resumes at S1. It is recorded because S1 and S2 both reason about
  the instrument, and they now reason about a sound one. Owner of that story:
  [`duo-v51-safeguards-action.md`](duo-v51-safeguards-action.md).
- ▶️ **RESUME HERE once the tag is published: S1 below**, the targeted test command. **The three are
  independent** and may be done in any order: S1 is the speed of the instrument, S2 the quality of the
  first pass, S3 the cost of reading the record. S1 first because it pays back on the very next run.
- 🔗 **S3 has a natural moment, and it is R.4 of the v5.1 plan**: that step already archives the two
  1200-and-905-line plans right after the tag. Doing S3 then costs almost nothing extra, and R.4 is the
  step that will hit the broken-link problem S3.3 names.
- **Blocked on:** the `v5.1.0` tag (§ *Cutting the release* in
  [`duo-v51-safeguards-action.md`](duo-v51-safeguards-action.md), the owner's and only his). Nothing
  else.
- **A session may, alone**: do S1 and S2 test-first on a branch off `main`, pushing every green commit
  and **reading its CI** (rules/ci.md). **Not**: touch a measurement that is feeding an unpublished
  release note, nor weaken a test to make a number move.

## What was measured, 2026-09-05 — the evidence, so it is never re-derived

On `feat/live-remote-sync` (131 commits, 2026-09-01 22:55 → 2026-09-05):

| Measure | Value |
|---|---|
| Commits touching **no** `.mjs` / `.ts` / `.json` | **86 of 131** |
| Lines added vs `main` | production **3587**, tests **6375**, Markdown **3981** |
| Mutation campaigns recorded in `RESULTS.md` | **7**, across 13 run logs, 2026-09-02 → 2026-09-05 |
| Step 8.8's own measurement | batch A run **three** times (81 + 78 + 74 min), batch B **twice** (36 + 26 min) — **~5 h of runs** |
| One batch-A run | **487 mutants** (412 killed, 75 survived) in **81 min** at concurrency 5 |

**Why 81 minutes and not the "1-3 minutes" §5quinquies promises.** `stryker.scripts.config.mjs` uses
the `command` runner with `coverageAnalysis: 'off'`, and its command is
`node --test "scripts/*.test.mjs" "scripts/lib/*.test.mjs"` — **the entire harness suite, re-run for
every single mutant** (the log's own `Ran 1.00 tests per mutant`). 81 min × 60 × 5 workers ÷ 487
mutants ≈ **50 s of full suite per mutant**. A mutant of the author-name registry is judged by the
tests of the search engine, the installer and the sync, none of which can observe it, and all of which
will pass whatever it does.

**Why three passes and not one.** The first pass scored **84.60 %**, and its 75 survivors were the
**six shapes already catalogued in [`../../mutation/RETROSPECTIVE.md`](../../mutation/RETROSPECTIVE.md)
since 2026-07-15**: the absent case never written beside the present one (C6), a default nothing
distinguishes (C6), a constant asserted against itself (C1/C2), a wiring seam no test traverses (C4).
The run is being used as a **discovery** instrument over a list we already hold, when it should be a
**confirmation** instrument. That is what buys the second and third pass.

**Said fairly, because it is not all waste**: the same runs found the anonymous-author collision (two
unnamed writers slugging equal, filing a stranger's note into the owner's day) and the branches that
were dead code to delete. Real value. But the collision *was* C6 — the absent case, never written —
and a five-minute re-read of my own test diff would have caught it without starting a machine.

## Tracking

### S1. A mutation run judges a file with the tests that can SEE it _(the speed lever)_

- [ ] **S1.1** `mutate-one.mjs` composes the runner's command from its targets: the target's own
      `*.test.mjs` twin **plus every test file whose import graph reaches the target** (transitive, not
      just the twin). A mutant killed only by a distant test must not read as a survivor.
- [ ] **S1.2** The safety property is stated in the file and asserted by a test: **narrowing the judges
      can only lower a score, never raise it.** Removing tests removes kills; it cannot invent one. This
      is the one direction this repo's whole warning apparatus (T13, the flaky-suite box, the false-timeout
      guard) exists to protect, and the change moves *with* it.
- [ ] **S1.3** A false survivor costs analysis, not trust, and the remedy is already written: *no
      survivor is acted on until it reproduces or is hand-applied.* Nothing new to invent.
- [ ] **S1.4** Proven on a file with a known figure — re-measure one of the 8.8 targets and show the
      score is **equal or lower**, never higher, and the wall-clock a fraction. Both numbers recorded here.
- [ ] **S1.5** `CONVENTIONS.md` §5quinquies updated: its "1-3 minutes" becomes true again, and the
      reason it had stopped being true is written beside it.

### S2. The first pass lands at ~97 %, not 84 % _(the quality lever)_

- [ ] **S2.1** **A re-read of my own test diff before the commit**, catalogue in hand, per production
      symbol touched: is the absent twin written? is the boundary triangulated? is the whole object
      asserted, or one field? ≥2 elements, unsorted? a matcher on every throw? The rule exists in
      `test-first-discipline`; what is missing is **a moment where it is applied to a diff** rather than
      recalled while typing.
- [ ] **S2.2** The braces for the shapes a machine can see on a test diff: `assert.throws(` with no
      second argument; a constant asserted against itself (`assert.match(x, new RegExp(CONST))`); a
      single-element collection under a `some`/`every`/`find` test. Greppable, so a guard can say it.
- [ ] **S2.3** Judged the only way that means anything: the **first-pass** score of the next new file,
      recorded here beside 84.60 %.
- [x] **S2.0 The second measurement, taken the same day, says the same thing** _(2026-09-05 10:52,
      step 9.5 batch A, 61 min)_: **92.83 %**, 32 survivors. **Ten** are equivalents of the class
      already named; the **22 killable ones are, without exception, the catalogue** — the words of two
      new messages not pinned (emptying a whole sentence changes nothing a test sees, which 8.8 had
      already fixed for the *other* messages), and the damaged-or-absent input never fed (`entry?.` on
      an entry no test makes null, `.some` vs `.every` on a list no test gives two elements, a
      documented one-directional fallback promised in a comment and asserted nowhere). **No production
      change is needed to kill any of them.** The instrument is being paid an hour to hand back a list
      we could have written before starting.
      ↩️ **The split was 25/7 on the first skim and is 22/10 after reading each mutant against the
      code** _(corrected 2026-09-05; the earlier figures stood here for two hours)_. It changes nothing
      about S2's thesis — the killable ones are still the catalogue, entire — and it is worth the
      correction anyway, because **the skim erred towards "killable" while the careful read erred
      towards "equivalent"**, and the second is the direction that quietly lowers a bar.
- [x] **S2.0bis The confirming run, and the one lever that cost nothing** _(final figures 2026-09-06
      00:19, same two files after 8 tests: **92.83 % → 97.76 %**, **10 survivors, all equivalents**,
      effective 100 % on non-equivalents)_. The plan had **written the 10 expected equivalents down
      before launching**, so what came back was a *verdict* and not a vibe. ➡️ **A candidate for S2 that
      costs one minute, not an hour: name the survivors you expect before a re-run.** It is the
      difference between a re-run you can fail and a re-run you can only admire, it catches an escaped
      mutant *on sight* rather than by re-reading everything, and unlike S2.1/S2.2 it needs no new
      tooling and no new discipline at authoring time.
      ↩️ **Corrected 2026-09-06, and the correction makes the lever look BETTER than the first telling
      did.** This step first read *"97.98 %, 9 survivors, and the tenth turned out to be killable"*.
      That run was taken on the flaky instrument, which **manufactured** that kill: re-run with the
      flake gone, over identical code and identical tests, all ten survive and all ten are equivalents.
      So the named list did not merely confirm a re-run — **it is what made a false kill visible**, and
      it is the only reason a wrong equivalence verdict did not stay on the books. State and evidence:
      [`duo-v51-safeguards-action.md`](duo-v51-safeguards-action.md) and
      [`../../mutation/RESULTS.md`](../../mutation/RESULTS.md).

### S3. A finished plan stops being read as a plan _(the record lever)_

**The owner's call, 2026-09-05: the plan discipline is KEPT.** It was paid for with real losses and
nothing here weakens it. What is optimised is the **reading cost**: *"arrêter d'ouvrir en permanence et
de lire en permanence des plans énormes qui sont déjà faits"*.

**Measured the same day, and it says he is right**, in `maintainers/plans/prospective/` — the folder
whose name means *what is ahead*:

| Plan | Lines | Ticked / open | Finished |
|---|---|---|---|
| `live-remote-sync-action.md` | 1200 | 68 / 7 | **91 %** |
| `duo-source-identity-action.md` | 905 | 57 / 2 | **97 %** |
| `rag-embedder-plan-action.md` | 394 | 51 / 6 | **89 %** |
| `wiki-health-axis1-mechanisms-action.md` | 280 | 51 / 4 | **93 %** |
| **The four together** | **2779 of the folder's 3539 lines** | | **~92 %** |

**Four fifths of the live plan folder is history wearing a plan's clothes.**

**And the remedy already exists — it was performed by hand this very morning and it worked.** The
2105 lines of the first two were replaced, as the active plan, by
[`duo-v51-safeguards-action.md`](duo-v51-safeguards-action.md): **158 lines**, opened on the owner's own
suggestion *"est-ce que ça ne vaudrait pas le coup d'archiver le plan de tout ce que tu as déjà fait, et
de partir sur un nouveau mini-plan ?"*. So S3 invents no mechanism. It turns **one act done when the
pain got loud enough** into a **standing hygiene with a trigger**.

- [ ] **S3.1 The trigger is the FINISHED RATIO, not the size.** A 1200-line plan half open is a real
      plan and must not be archived for being big; a 1200-line plan **91 % ticked** is a record. The
      measurable line: **≥ 80 % of its checkboxes ticked → it is no longer a plan.** Size is the
      severity, never the verdict.
- [ ] **S3.2 The move is a SPLIT, not a deletion.** The handful of still-open items are lifted into a
      small successor plan; the big file goes to `../archived/` with its date and keeps the WHY. The
      proof it works is above: 158 lines replacing 2105, same day, no state lost.
- [ ] **S3.3 Archiving repoints its referrers, and that is the part that will bite.** Moving a file
      breaks every inbound link — it is **already blocking a move today** (R.4 of the v5.1 plan cannot
      archive those two plans while #86's body and ADR 0041 link them by path). So: `git grep` the
      filename, repoint every referrer **in the same commit** as the move.
- [ ] **S3.4 The braces go at RELEASE TIME, not on a hook.** A check that lists any `prospective/` file
      over ~300 lines and ≥ 80 % ticked, run with the other release gates. **Deliberately not a `Stop`
      hook**: the owner's standing latency budget (rules/ci.md, 2026-08-23 — *"on a de plus en plus de
      hooks … ça va pas le faire"*) rules out paying milliseconds on every hand-back for a question that
      only changes a few times per release.
- [ ] **S3.5bis A finished plan is also a false alarm on every hand-back.** `plan-carrier-guard`
      counts any tracked Markdown naming the branch, and it **cannot tell closed from stale** (it says
      so itself). Measured 2026-09-05: it fired **twice in one session** over the same two closed plans
      plus a PR body, each time answered "needs nothing" in one line. Archiving them removes them from
      the guard's list by construction, so S3 buys back a recurring interruption as well as the reading
      cost. **The declared door is NOT the answer here**: a plan may never declare `delegates-only`,
      which is exactly right, and is why the only honest fix is to stop the finished plan from living
      in the live folder.
- [ ] **S3.5 Judged by the reading cost at a resume**, recorded here: the number of lines a *"on
      reprend"* has to read before work starts, today versus after. The door (`ACTIVE.md`, 34 lines) plus
      the active plan's STATE block is the budget; anything else opened is the defect.

### Constraints and calls already settled — do not re-open

- [x] **Not before the tag** _(2026-09-05, owner)_ — see STATE.
- [x] **A test is never weakened to move a number** _(standing, `RESULTS.md`)_. If the test is right,
      the number is wrong.
- [x] **The plan discipline is KEPT, in full** _(2026-09-05, owner: "je pense qu'il faut qu'on le
      maintienne")_. S3 optimises what it costs to READ, never what it records. The 86-of-131 docs
      commits measured above are the symptom that opened the question, not a target to cut.
