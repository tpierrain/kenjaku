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

- **Next:** ▶️ **resume at S2**, the quality lever. S2.1 (the re-read of one's own test diff, catalogue
  in hand) and S2.2 (the greppable shapes) are unstarted; S2.0 and S2.0bis already say what they buy.
  **S3 is untouched** and its trigger is written. The three levers are independent and may be taken in
  any order.
- ✅ **S1 is done and merged** — [PR #91](https://github.com/tpierrain/kenjaku/pull/91) — **and S1.5
  with it**: `CONVENTIONS` §5quinquies has carried the measured per-mutant figure since 2026-09-07, so
  the *"1-3 minutes"* it is ticked against is gone. What the runs proved is in § *What S1 proved*.
- 💸 **One debt is public and still unpaid** → § *The re-measurement that was promised in public*.
- **Blocked on:** nothing. **Owner's call pending:** nothing.
- **A session may, alone:** take S2 and S3 test-first on a branch off `main`, push every green commit
  and **read its CI**. **Not:** weaken a test to make a number move, nor touch a measurement that is
  feeding an unpublished release note.
- ⏸️ **This is not the active plan.** The door ([`ACTIVE.md`](../ACTIVE.md)) says which one is.

## 💸 The re-measurement that was promised in public

**The v5.1.0 release note says, in as many words, that a figure is owed** _(2026-09-06, the §1bis
documentation pass, `64e898f`)_. Its *Quality* paragraph keeps every figure and adds the sentence that
keeps it honest: **measured 3 September, on the code as it then stood** — before a review that changed
four of the files those runs covered — *the score of the work, not of the exact bytes the tag ships*.

- **What is owed**: re-measure, behind the now-faster instrument, the files the code review changed
  and that carry a **published** figure in [`../../mutation/RESULTS.md`](../../mutation/RESULTS.md) —
  `lib/filed-note.mjs`, `lib/remote-sync.mjs`, `lib/remote-arrivals.mjs`, `dated-note-path.mjs`,
  `lib/source-key.mjs` — plus **`lib/yaml-scalar.mjs`, which is brand new and has never been measured
  at all**. Sharpest of all: `filed-note.mjs:216` is the exact line a survivor was recorded on (batch
  C, scored 100 %), the `author:` stamp, which now goes through `yamlScalar`.
- **Two carriers, not one.** `RESULTS.md` is the record, and the **published note has told readers a
  figure is owed** — so the debt is only paid when both say the same thing.
- **Why it waited, and the reason has now expired.** The owner asked for no mutation run before S1
  landed (*« j'aimerais éviter de passer toute la journée à faire du mutation testing »*), and the
  honest order was S1.4 first. S1.4 landed on 2026-09-07. Re-measuring on the old 81-minute instrument
  was exactly the bill S1 existed to avoid paying twice; that bill is now a third of what it was.

## 📜 What S1 proved — durable, and none of it expires

_All of this sat in the `## 📍 STATE` block until 2026-09-12, which is how that block reached **241**
non-empty lines against §3ter's cap of 20. Nothing here is perishable: it is a measurement log and the
lessons it produced._

### The narrowing works, and the proof is a pair of runs

**S1.1 → S1.3 landed** _(2026-09-06, `2876954`, 115 tests green in the mutation workspace)_.
`judges.mjs` works out who can observe a target — imports transitively **plus plain string mentions**,
because the entry-point rule tests every executable by SPAWNING it and such a test is invisible to an
import graph — grown to a fixed point, and the list reaches Stryker through the environment (its CLI
has no flag for the runner's command). On this repo: **203 test files down to 37-50**. It never narrows
to nothing: an unobservable or mistyped target falls back to the whole suite and says why.

**S1.4 — the pair was run, same targets, same commit, both instruments** _(2026-09-07, machine idle,
one after the other)_:

| | Narrowed (50 judges) | Whole suite (204) |
|---|---|---|
| Wall clock | **42 min 39** | **1 h 03 min 43** |
| Mutants | 357 | 357 |
| Score | **98.04 %** | **98.04 %** |
| Killed / survived / timeout | 350 / 7 / 0 | 350 / 7 / 0 |
| Survivors | the same seven lines | the same seven lines |

**A third of the wall clock for a byte-identical verdict.** The safety property is not merely respected
(equal or lower) — on this pair the narrowing lost **nothing at all**: same score, same survivor list,
line for line. Per mutant, 35.8 s against 53.5 s. Logs:
`../../mutation/reports/s1-proof-batch-c.log` and `-unnarrowed.log`.

**And the subset property now holds by construction rather than by accident** _(closed 2026-09-07)_.
`runsInWholeSuite` derives the baseline's own globs from `WHOLE_SUITE`, and an observer outside them
**refuses the narrowing** rather than being silently dropped; the `../` fixture that pinned the deep
judge was moved off it. Before that, `readSources` walked `scripts/` recursively while the fallback
command globbed only two levels — so the day a test file landed in a deeper directory, the judges would
have stopped being a subset and S1.2's safety property would have been silently false.

### The "19-minute anomaly" never existed — it was two different jobs compared as one

_(2026-09-07. Kept in full because the mistake is the lesson.)_ A run was called catastrophically slow
against a **3 min 46** baseline. The run finished: **357 mutants, 42 min 39, 98.04 %**. The baseline it
was being measured against is the run of **19 mutants** — the three line ranges step 9.4 had changed
(`filed-note.mjs:208-216`, `file-back-note.mjs:99-102` and `:139-142`), as `RESULTS.md` § *Batch C*
says in full. **Naming the two files without their ranges is a twenty-fold bigger job**, and this plan
wrote them that way.

- **What the numbers actually said, and they said S1 WORKS**: 42 min 39 over 357 mutants at
  concurrency 5 is **35.8 s per mutant**, against **49.9 s** for the whole-suite instrument (batch A:
  487 mutants in 81 min). **28 % cheaper**, which is the 25 % the standalone suites predicted
  (12.9 s → 9.6 s) and not a point more.
- 🪞 **The lesson**: **a baseline is a pair — a duration AND the job it measured.** Quoted without its
  job, `3 min 46` invited three hours of hunting for a defect that was not there, and produced a
  confident, committed, **wrong** mechanism. **The tell was available the whole time and never
  checked: the mutant count.** 19 against 357.
- ⛔ **The wrong mechanism, kept struck through rather than deleted.** ~~*The five Stryker workers march
  in lockstep, so narrowing made the run slower by concentrating the spawn-heavy tests*~~ — written
  from real `ps` output (5 copies of `remote-sync.test.mjs` executing at the same instant, 36 node
  processes, load 29 on 14 cores) and **explaining a slowdown that did not exist**. One observation in
  it is true and beside the point: the workers do execute the same test file at the same instant. It is
  kept because a confident wrong mechanism, written from real evidence, is exactly the shape a later
  session would re-derive.

### The seven survivors, and the read that costs seconds

Named before the comparison run finished, so the second run was a **verdict** rather than a vibe.
**Six of the seven are provable equivalents**, and the proof is nearly always a line that runs
**earlier in the same function**:

- `filed-note.mjs:37` (twice, `^-+` → `^-` and `-+$` → `-$`). The line above collapses every run of
  non-alphanumerics into **one** hyphen, so two consecutive hyphens cannot exist by the time the trim
  runs. Equivalent, and only by reading the previous statement.
- `filed-note.mjs:257` (`/\.md$/` → `/\.md/`). The anchor is free because card paths are
  **slugified**: a `.` cannot survive slugification, so `.md` can only occur at the end.
- `file-back-note.mjs:193` (`split(/\s+/)` → `split(/\s/)`). `.trim()` runs first and only `[0]` is
  taken, so the empty strings the mutant creates sit after the element that is read.
- `file-back-note.mjs:85` and `:88`, the composition root's `"utf-8"` → `""`. **This entry first
  claimed the opposite**, read off the line's own comment, which does describe a real field defect (a
  Buffer has no `.trim()`, and it threw on any brain past one universe). **One `grep` one level down
  settled it**: `readRawActiveUniverse` (`scripts/lib/universes.mjs:259`) reads
  `String(io.readFileSync(path)).trim()` — **the defence was put in the READER**, deliberately, with
  its own comment saying callers pass no encoding. So the encoding at the composition root is
  belt-and-braces and deleting it changes nothing. Same verdict for `:88`: `JSON.parse` coerces its
  argument, so a Buffer parses exactly like a string.
- The seventh, `filed-note.mjs:114` (`>` → `>=`), is **not** an equivalent but is reachable only when
  **two tiers absent from the declared ranking** meet — `indexOf` returns -1 for both, and the two
  versions then disagree. The honest answer is probably a guard on an undeclared tier rather than a
  test of it. **No production change is owed.**

> 🪞 **Twice in one night, the same failure shape**: a confident conclusion drawn from what a line
> *says about itself* instead of from what the surrounding code *does* — first the baseline quoted
> without its job, then a comment quoted without its reader. **The survivor analysis is only worth what
> the one-level-down read is worth**, and that read costs seconds.

### Counting files was the wrong proxy for counting seconds

**Measured 2026-09-07** in the very worktree Stryker uses, machine otherwise idle, two runs each:
**whole suite 12.94 / 12.92 s**, **narrowed to batch C's 50 judges 9.65 / 9.64 s**. So cutting **204
test files down to 50** buys **25 %** of the wall clock, not an order of magnitude.

- **The suite's cost is not proportional to the number of test files.** It sits in a handful of heavy
  ones — the tests that SPAWN a process, exactly the judges the name-matching edge is right to keep (a
  spawned entry point is invisible to an import graph, and dropping it manufactures a false survivor).
- ➡️ **So the next speed lever is one level down**: what costs is `node --test` **forking a process per
  file**, five Stryker workers deep, on a 14-core machine. The thing worth measuring next is not a
  shorter list, it is **the per-mutant process bill** — one runner process reusing a loaded suite
  rather than 50 fresh ones. Recorded rather than acted on.
- ✅ **One suspicion checked and cleared, so nobody re-checks it**: the judge set really is a subset of
  what the whole suite runs (50 judges for batch C, **0 outside** `scripts/*.test.mjs` +
  `scripts/lib/*.test.mjs`). The cost was never *"we run tests the suite never ran"*.

### The instrument changed twice while this plan was held, and both times for the better

- **2026-09-05, `ae5f61b`.** The suite carried a test that failed about 1 run in 8 under load, and
  since every mutant re-runs the whole suite, an intermittent failure did not add noise to a score, it
  added **points**. It is gone — deleted with the barrier it asserted, not stabilised. Owner of that
  story: [`../archived/duo-v51-safeguards-action.md`](../archived/duo-v51-safeguards-action.md).
- **2026-09-06**, same shape, same conclusion: three tests that pinned a session-start wait were
  deleted and two clock-measured process-level ones took their place. The owner's words that day are a
  **standing rule S1 and S2 both inherit**: *« on enlève cette attente qui pénalise tout le monde pour
  quelques rares cas »*.

### S3 has a natural moment, and a first instalment was already paid

S3's trigger is the archiving pass that follows a tag — the step that hits the broken-link problem S3.3
names. **A first instalment was paid early**, on 2026-09-06 and at the owner's ask: the 158-line v5.1
plan was split and archived the moment its work was done, which is S3.1's trigger applied by hand.
_(2026-09-12: the same trigger fired again, by hand again, on `clear-the-tracker-action.md` — which is
the third time a human has done what S3 exists to automate.)_


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

- [x] **S1.1** `mutate-one.mjs` composes the runner's command from its targets: the target's own
      `*.test.mjs` twin **plus every test file whose import graph reaches the target** (transitive, not
      just the twin). A mutant killed only by a distant test must not read as a survivor.
      _(2026-09-06 · `2876954` — plus the name edge, for the tests that SPAWN a script and import nothing)_
- [x] **S1.2** The safety property is stated in the file and asserted by a test: **narrowing the judges
      can only lower a score, never raise it.** Removing tests removes kills; it cannot invent one. This
      is the one direction this repo's whole warning apparatus (T13, the flaky-suite box, the false-timeout
      guard) exists to protect, and the change moves *with* it. _(2026-09-06 · `2876954`; **the hole in
      it closed 2026-09-07** — the subset was asserted against the corpus, which is walked recursively,
      not against the two levels the baseline command globs)_
- [x] **S1.3** A false survivor costs analysis, not trust, and the remedy is already written: *no
      survivor is acted on until it reproduces or is hand-applied.* Nothing new to invent.
      _(2026-09-06 · `2876954`)_
- [x] **S1.4** Proven on a file with a known figure — re-measure one of the 8.8 targets and show the
      score is **equal or lower**, never higher, and the wall-clock a fraction. Both numbers recorded here.
      _(2026-09-07 — the PAIR, same targets and same commit: 42 min 39 against 1 h 03 min 43, and the
      **same** 98.04 % with the **same** seven survivors. The table and the logs are in
      § *What S1 proved*.)_
- [x] **S1.5** `CONVENTIONS.md` §5quinquies updated: its "1-3 minutes" becomes true again, and the
      reason it had stopped being true is written beside it. _(2026-09-07 — it did not become true
      again, it was **replaced by the right unit**: ~36 s per mutant, so the cost of a run is its
      mutant count. `mutate-one.mjs`'s own header carried the same stale promise and now says the
      same thing.)_

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
      [`../archived/duo-v51-safeguards-action.md`](../archived/duo-v51-safeguards-action.md) and
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
[`../archived/duo-v51-safeguards-action.md`](../archived/duo-v51-safeguards-action.md): **158 lines**, opened on the owner's own
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

- [x] **Not before the tag** _(2026-09-05, owner: "on valide cet ordre")_ — **that hold has expired on
      its own terms**: `v5.1.0` was cut on 2026-09-06, and three releases have shipped since. It is
      recorded here rather than deleted because the reasoning was right (changing the runner
      mid-measurement would have put two instruments in one release note's *Quality* paragraph), and
      because S1 was later pulled forward **before** the tag on the owner's own arbitration, once the
      code review made a re-measurement owed either way.
- [x] **A test is never weakened to move a number** _(standing, `RESULTS.md`)_. If the test is right,
      the number is wrong.
- [x] **The plan discipline is KEPT, in full** _(2026-09-05, owner: "je pense qu'il faut qu'on le
      maintienne")_. S3 optimises what it costs to READ, never what it records. The 86-of-131 docs
      commits measured above are the symptom that opened the question, not a target to cut.
