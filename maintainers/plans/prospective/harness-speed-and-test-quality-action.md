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

- 🚦 **THIS IS THE ACTIVE PLAN SINCE 2026-09-06** _(owner: "ok pour suivre ta reco")_. It took the door
  from [`clear-the-tracker-action.md`](clear-the-tracker-action.md), which is paused with nothing in
  flight. The arbitration he validated: the release note has made a re-measurement public, so it is
  owed either way, and running it on the 81-minute instrument pays twice the exact bill this plan
  exists to remove. **Resume at S1.4**, and the first move is the cheap number below (the narrowed
  subset's standalone time), not another 80-minute run.
- ✅ **S1.1 → S1.3 HAVE LANDED** _(2026-09-06, `2876954`, 115 tests green in the mutation workspace)_.
  `judges.mjs` works out who can observe a target — imports transitively **plus plain string mentions**,
  because the entry-point rule tests every executable by SPAWNING it and such a test is invisible to an
  import graph — grown to a fixed point, and the list reaches Stryker through the environment (its CLI
  has no flag for the runner's command). On this repo: **203 test files down to 37-50**. It never
  narrows to nothing: an unobservable or mistyped target falls back to the whole suite and says why.
- ❌🔁 **THE "19-MINUTE ANOMALY" NEVER EXISTED — IT WAS TWO DIFFERENT JOBS COMPARED AS ONE**
  _(2026-09-07, and everything below it that reasons about a slowdown is WRONG; kept, struck through,
  because the mistake is the lesson)_. The run finished: **357 mutants, 42 min 39, 98.04 %** (350
  killed, 7 survived, **0 timeout**). The `3 min 46` it was being measured against is the run of
  **19 mutants** — the three line ranges step 9.4 had changed (`filed-note.mjs:208-216`,
  `file-back-note.mjs:99-102` and `:139-142`), as `RESULTS.md` § *Batch C* says in full. **Naming the
  two files without their ranges is a twenty-fold bigger job**, and this plan wrote them that way.
  - **What the numbers actually say, and they say S1 WORKS**: 42 min 39 over 357 mutants at
    concurrency 5 is **35.8 s per mutant**. The whole-suite instrument costs **49.9 s per mutant**
    (batch A: 487 mutants in 81 min). That is **28 % cheaper**, which is the 25 % the standalone
    suites predicted (12.9 s → 9.6 s) and not a point more. **The instrument behaves exactly as the
    cheap measurement said it would.**
  - 🪞 **The lesson, and it is the one worth keeping**: a baseline is a pair — a duration AND the job
    it measured. Quoted without its job, `3 min 46` invited three hours of hunting for a defect that
    was not there, and produced a confident, committed, WRONG mechanism (the lockstep story below).
    **The tell was available the whole time and never checked: the mutant count.** 19 against 357.
  - 🔍 **THE SEVEN SURVIVORS, READ AGAINST THE CODE BEFORE THE COMPARISON RUN FINISHES** — named here
    so the second run is a *verdict* and not a vibe (the one-minute lever S2.0bis found). **Four are
    provable equivalents, and the proof is a line that runs EARLIER in the same function**:
    - `filed-note.mjs:37` (twice, `^-+` → `^-` and `-+$` → `-$`). The line above collapses every run of
      non-alphanumerics into **one** hyphen, so two consecutive hyphens cannot exist by the time the
      trim runs. Equivalent, and only by reading the previous statement.
    - `filed-note.mjs:257` (`/\.md$/` → `/\.md/`). The anchor is free because card paths are
      **slugified**: a `.` cannot survive slugification, so `.md` can only occur at the end.
    - `file-back-note.mjs:193` (`split(/\s+/)` → `split(/\s/)`). `.trim()` runs first and only `[0]` is
      taken, so the empty strings the mutant creates sit after the element that is read.
    - ⚠️ **The three that are NOT equivalents, and none needs a production change**:
      `filed-note.mjs:114` (`>` → `>=`) is reachable only when **two tiers absent from the declared
      ranking** meet — `indexOf` returns -1 for both, and the two versions then disagree; the honest
      answer is probably a guard on an undeclared tier rather than a test of it. The other two are the
      **composition root**, `"utf-8"` → `""` at `file-back-note.mjs:85` and `:88` — a wiring seam no
      test traverses, and `:88` is the **stdin** read whose test was deliberately deleted for hanging
      on Windows. Recorded, not silently accepted.
    - ↩️ **CORRECTED WITHIN THE HOUR, AND THE CORRECTION IS THE INTERESTING PART.** This entry first
      claimed `:85` *"replays a bug this repo already shipped, and no test was ever added"* — read off
      the line's own comment, which does describe a real field defect (a Buffer has no `.trim()`, and
      it threw on any brain past one universe). **That claim was wrong, and one `grep` one level down
      is what settled it.** `readRawActiveUniverse` (`scripts/lib/universes.mjs:259`) reads
      `String(io.readFileSync(path)).trim()` — **the defence was put in the READER**, deliberately,
      with its own comment saying callers pass no encoding. So the `"utf-8"` at the composition root is
      belt-and-braces, and deleting it changes nothing: **a true equivalent**. Same verdict for `:88`:
      `JSON.parse` coerces its argument, so a Buffer parses exactly like a string.
      - 🪞 **Twice in one night, the same failure shape**: a confident conclusion drawn from what a
        line *says about itself* instead of from what the surrounding code *does* — first the baseline
        quoted without its job, now a comment quoted without its reader. **The survivor analysis is
        only worth what the one-level-down read is worth**, and that read costs seconds.
      - ✅ **So the tally is better than first written**: of 7 survivors, **6 are provable equivalents**
        and the seventh (`filed-note.mjs:114`) needs two undeclared tiers to be reachable at all —
        effectively **100 % on non-equivalents**, and no production change owed.
    - 📊 **The shape of the count is the whole S2 argument again**: 357 mutants, 7 survivors, **4 of
      them provable equivalents by reading one line up**, and **zero** requiring a production change.
  - 📌 **So S1.4 IS STILL NOT PROVEN, for the honest reason and not the invented one.** The score
    98.04 % has nothing comparable to sit beside: the published 100 % is those 19 hunk mutants, on
    code the review has since changed. The proof needs **the same targets measured both ways on this
    commit** — whole files, narrowed and un-narrowed — and the un-narrowed half is the run to do next.
- ⚠️ ~~**S1.4 IS NOT DONE, AND THE FIRST ATTEMPT MUST NOT BE QUOTED.**~~ A proving run was launched on
  batch C (`scripts/lib/filed-note.mjs` + `scripts/file-back-note.mjs`, baseline **3 min 46** on
  2026-09-06 01:07, log `reports/s1-proof-batch-c.log`) **while two full test-suite runs were competing
  for the same CPU** — which is exactly the condition this repo has already measured as manufacturing
  false timeouts and starved scores. **Its wall-clock is meaningless and its score is suspect.**
  - **Redo it properly**: one run, nothing else running, and compare against the baseline above. The
    score must come back **equal or lower**, never higher (S1.2's property).
  - 🚨 **AND THE FIRST ATTEMPT DID NOT MERELY GET A BAD NUMBER — IT NEVER FINISHED.** It was stopped
    at **19 min 18** on a batch whose baseline is **3 min 46**, with no score. Two competing suite runs
    (~12 s each) do not explain a 5x. **Something else is going on, and it must be understood before S1
    is called done** — a narrowing that makes a run slower is worse than no narrowing.
  - 🔁 ~~**REPRODUCED, 2026-09-07, ON AN IDLE MACHINE — so the competing suites were never the cause.**~~
    ⛔ **VOID — there was nothing to reproduce.** See the entry above: the run being called slow was
    357 mutants and the baseline was 19. What survives of the paragraphs below is ONE observation,
    true and beside the point: the five workers really do execute the same test file at the same
    instant (5 copies of `remote-sync.test.mjs`, sampled three times). It explains no slowdown,
    because there was none. Struck through rather than deleted — a confident wrong mechanism, written
    from real `ps` output, is exactly the shape a later session would re-derive.
    Same batch, same tool, nothing else running, launched 06:50:43: **past 15 minutes and still going**,
    against a 3 min 46 baseline. This time it is being left to finish, because a run killed at 19
    minutes is what made the first attempt prove nothing.
    - 🧩 **And the arithmetic says the test command cannot be the culprit.** The narrowed set is a
      SUBSET of the whole suite, so its total work is smaller by construction — standalone, 9.6 s
      against 12.9 s. No uniform slowdown can make the smaller set take longer. **So the cost is not
      in what the tests do, it is in how the run is driven.**
    - 🔬 **THE MECHANISM, WATCHED LIVE AND SAMPLED THREE TIMES RUNNING — THE FIVE WORKERS MARCH IN
      LOCKSTEP.** `ps` during the run shows 5 copies of `scripts/remote-sync.test.mjs`, 4 of
      `scripts/lib/notes-union-merge.test.mjs` and 4 of `scripts/author-identity.test.mjs` executing
      **at the same instant**, 36 node processes, load 29 on 14 cores. Individual test files that take
      under 9.6 s for the whole set when alone are taking **12 to 24 s each** in there.
      - **Why narrowing made it worse, and it is not a paradox.** Stryker runs 5 workers, each
        executing the *same* sorted list from the same start. The tests that dominate are the ones
        that spawn real `git` and real processes, and they contend **superlinearly** — disk, process
        spawn, locks — so N simultaneous copies cost far more than N times one. With 204 files those
        heavy tests are diluted: each worker has 13 files in flight, mostly cheap, and the heavy ones
        drift apart. With 50 files the same 13 slots are mostly heavy, so ~13 heavy processes collide
        instead of ~5. **The cheap tests were acting as a desynchroniser**, and the narrowing deleted
        them.
      - ➡️ **So S1's lever was aimed one level too high.** What costs is not which tests run, it is
        **5 concurrent copies of the same spawn-heavy tests**. The candidates to measure next, in
        order of expected payback: (a) drop `concurrency` for spawn-heavy batches and see the wall
        clock *fall*; (b) make the heavy tests cheap or isolate their contention; (c) only then think
        about the list of judges.
      - ⚠️ **And the narrowing is still worth keeping** — the safety property is what it buys, not the
        speed: judges that cannot observe a target manufacture no kills. But **S1.5 must not be
        written as if a speed promise had been kept.**
  - ✅ **One suspicion CHECKED and cleared, so nobody re-checks it**: the judge set really is a subset
    of what the whole suite runs (50 judges for batch C, **0 outside** `scripts/*.test.mjs` +
    `scripts/lib/*.test.mjs`). So the slowness is not "we run tests the suite never ran".
  - [ ] **BUT the subset property holds by ACCIDENT, not by construction**, and that is a hole to
    close: `readSources` walks `scripts/` **recursively** while the fallback command globs only two
    levels. The day a test file lands in a deeper directory, the judges stop being a subset and S1.2's
    safety property is silently false. **Pin it with a test** that asserts every judge matches the
    fallback's own globs.
  - **A number worth having first, and it is cheap**: the whole suite standalone takes **~12 s**. At
    concurrency 5 that predicts ~19 min for a 487-mutant batch, not the 81 min measured — so part of
    the bill is **CPU oversubscription** (each worker's `node --test` forks per file, ~28 processes
    seen at once), not only the breadth of the suite. Measure the narrowed subset's standalone time
    before concluding what S1 bought.
  - 📏 **TAKEN, 2026-09-07, and it is the number that reframes S1.** In the very worktree Stryker
    uses, machine otherwise idle, two runs each: **whole suite 12.94 / 12.92 s**, **narrowed to batch
    C's 50 judges 9.65 / 9.64 s**. So cutting **204 test files down to 50** buys **25 %** of the wall
    clock, not an order of magnitude.
    - **What that means, and it is not "S1 failed"**: the suite's cost is **not proportional to the
      number of test files**. It sits in a handful of heavy ones — the tests that SPAWN a process,
      exactly the judges the name-matching edge is right to keep (a spawned entry point is invisible
      to an import graph, and dropping it manufactures a false survivor). **Counting files was the
      wrong proxy for counting seconds**, all along.
    - ➡️ **So the speed lever is one level down**: what costs is `node --test` **forking a process per
      file**, 5 Stryker workers deep, on a 14-core machine. The lever worth measuring next is not a
      shorter list, it is **the per-mutant process bill** — one runner process reusing a loaded suite
      rather than 50 fresh ones. Recorded here rather than acted on: S1.4 must first say whether the
      narrowing is even sound, and the 19-minute anomaly is still unexplained.
- 🎯 **THE RE-MEASUREMENT THIS PLAN PREDICTED IS NOW ACTUALLY DUE** _(2026-09-06)_. The bullet below
  argued S1 pays for itself because the code review would change already-measured files. § 1 of
  [`v5.1.0-code-review-fixes-action.md`](../archived/v5.1.0-code-review-fixes-action.md) **is now done**, and it
  changed **four files that all carry a published figure** in `RESULTS.md`: `lib/filed-note.mjs`,
  `lib/remote-sync.mjs`, `lib/remote-arrivals.mjs` and `dated-note-path.mjs`. Sharpest of all,
  **`filed-note.mjs:216` is the exact line a survivor was recorded on** (RESULTS.md, batch C, scored
  100 %) — the `author:` stamp, which now goes through `yamlScalar`.
  - **`lib/yaml-scalar.mjs` is BRAND NEW and has never been measured at all.**
  - 📣 **AND THE RELEASE NOTE NOW SAYS THIS OUT LOUD, WHICH TURNS IT INTO A PROMISE** _(2026-09-06,
    the § 1bis documentation pass, `64e898f`)_. Its *Quality* paragraph keeps every figure and adds
    the sentence that keeps it honest: **measured 3 September, on the code as it then stood**, before
    a review that changed four of the files those runs covered — *the score of the work, not of the
    exact bytes the tag ships* — with the reason no re-measurement was run (the instrument changed
    mid-release and **S1.4 is still open**). So the debt is public now: when S1.4 lands and the five
    files are re-measured behind the faster instrument, `RESULTS.md` is not the only carrier to
    update — the published note has told readers a figure is owed. Add `lib/source-key.mjs` to the
    list above: the § 1 fix changed it too.
  - ⛔ **Not now, and it is the owner's call, not a session's**: he asked for no mutation run before
    S1 landed (*"j'aimerais éviter de passer toute la journée à faire du mutation testing"*), and the
    honest order is **S1.4 first** — redo the proving run properly, get a real figure, and only then
    re-measure these five behind the faster instrument. Re-measuring on the 81-minute instrument is
    exactly the bill S1 exists to avoid paying twice.
- [ ] **S1.5 — `CONVENTIONS.md` §5quinquies still says "1-3 minutes"**, and it is still not true.
  Update it once S1.4 has a real figure to put there.
- ▶️ ~~**S1 IS UNHELD AND IS THE NEXT THING TO DO, BEFORE THE TAG**~~ _(the decision, kept)_ _(2026-09-06, the owner's ask:
  *"est-ce que les modifications là ne seraient pas pertinentes à faire avant le truc qu'on avait dit
  qu'on ferait après la release ? … c'est quoi l'arbitrage le plus intéressant"*)_. **The hold expired
  on its own terms** rather than being overridden: the condition was *finish 9.5 with the instrument
  as it is*, and 9.5 closed at 02:42 this morning. What changed the arithmetic is the code review —
  [`v5.1.0-code-review-fixes-action.md`](../archived/v5.1.0-code-review-fixes-action.md) § 1 opens six fixes in files that
  are **already measured**, so their published figures stop describing the shipped code and a
  re-measurement is owed **either way**. On the instrument as it stands that is ~80 min a batch,
  twice; behind S1 it is minutes. **S1 pays for itself inside this release instead of after it.**
  - **Why it cannot flatter the release**: S1.2's property is one-directional — narrowing the judges
    removes kills, it cannot invent one, so a score can only come back **equal or lower**.
  - **And it ships to nobody**: `mutate-one.mjs` is a maintainer tool, absent from the product
    surface, so this adds no risk to what v5.1.0 hands a user.
  - **The one honest cost, accepted**: the release note's *Quality* paragraph will describe two
    instruments. It gets written as such, with the old figure and the new one side by side (S1.4
    already asks for exactly that pair).
  - **S2 and S3 stay held until the tag**, unchanged — with one free exception: **S2.1 is a re-read,
    not a run**, so it is applied to the § 1 fixes' own test diff as they are written.
- ⏸️ ~~**NOT STARTED, AND DELIBERATELY HELD until `v5.1.0` is tagged**~~ _(owner's call, 2026-09-05:
  "on valide cet ordre" — **superseded 2026-09-06, see above**)_. The order he validated is: **finish
  9.5 with the instrument as it is**, then S1, then S2. Changing the runner mid-measurement would put
  two instruments in one release note's *Quality* paragraph, and the 9.5 batches left are small (~1 h)
  — the tooling work saves almost nothing by jumping the queue, and costs comparability. **S3 was
  added after that call**, on the same day and on the same terms. _(Kept, not deleted: the reasoning
  is still right, and it is the measure of what had to change for the conclusion to move.)_
  - ⏳ **The tag moved further out on 2026-09-06**, and nothing here changes because of it: the
    `/code-review max` found blockers that must be answered before `v5.1.0` is cut. The list and the
    go/no-go belong to [`v5.1.0-code-review-fixes-action.md`](../archived/v5.1.0-code-review-fixes-action.md);
    this plan still resumes at S1 — **but now BEFORE the tag, see the entry above**.
- 🔧 **"THE INSTRUMENT AS IT IS" CHANGED ONCE, ON 2026-09-05, AND ONLY FOR THE BETTER** _(`ae5f61b`)_.
  The suite carried a test that failed about 1 run in 8 under load, and since every mutant re-runs the
  whole suite, an intermittent failure did not add noise to a score, it added **points**. It is gone —
  deleted with the barrier it asserted, not stabilised. **Nothing here moves because of it**: this plan
  stays held until the tag and still resumes at S1. It is recorded because S1 and S2 both reason about
  the instrument, and they now reason about a sound one. Owner of that story:
  [`../archived/duo-v51-safeguards-action.md`](../archived/duo-v51-safeguards-action.md).
  - ➕ **And a second time on 2026-09-06, same shape, same conclusion** (step 9.6 there): three tests
    that pinned a session-start wait were deleted and two clock-measured process-level ones took their
    place. **Nothing here moves because of it either** — this plan is still held until the tag, still
    resumes at S1. Recorded because the suite S1 will speed up is now three tests lighter, and because
    the owner's words that day are a **standing rule S1 and S2 both inherit**: *"on enlève cette attente
    qui pénalise tout le monde pour quelques rares cas"*.
- ▶️ **RESUME AT S1 BELOW**, the targeted test command — **now, before the tag** (first bullet). **The
  three are independent** and may be done in any order: S1 is the speed of the instrument, S2 the
  quality of the first pass, S3 the cost of reading the record. S1 goes first because it pays back on
  the very next run, and the next run is this release's.
- 🔗 **S3 has a natural moment, and it is § 3.4 of** [`v5.1.0-code-review-fixes-action.md`](../archived/v5.1.0-code-review-fixes-action.md):
  that step already archives the two 1200-and-905-line plans right after the tag. Doing S3 then costs
  almost nothing extra, and 3.4 is the step that will hit the broken-link problem S3.3 names.
  **A first instalment was paid early**, on 2026-09-06 and on the owner's ask: the 158-line v5.1 plan
  was split and archived the moment its work was done, which is S3.1's trigger applied by hand.
- **Blocked on:** nothing, for S1. **S2 and S3 stay blocked on the `v5.1.0` tag** (§ 3 of
  [`v5.1.0-code-review-fixes-action.md`](../archived/v5.1.0-code-review-fixes-action.md), the owner's and only his).
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

- [x] **Not before the tag** _(2026-09-05, owner)_ — see STATE.
- [x] **A test is never weakened to move a number** _(standing, `RESULTS.md`)_. If the test is right,
      the number is wrong.
- [x] **The plan discipline is KEPT, in full** _(2026-09-05, owner: "je pense qu'il faut qu'on le
      maintienne")_. S3 optimises what it costs to READ, never what it records. The 86-of-131 docs
      commits measured above are the symptom that opened the question, not a target to cut.
