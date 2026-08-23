<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- THE canonical plan for finishing v5.0.0, and it is SELF-SUFFICIENT:      -->
<!-- every decision it needs is written out below, never fetched from         -->
<!-- another file. Built in the orchestrated /loop mode described in          -->
<!-- agent-orchestrated-release-mode-action.md. Branch: feat/engine-base-     -->
<!-- unfreeze, PR #76.                                                        -->
<!-- The `## 📍 STATE` block below is this file's only perishable content:    -->
<!-- do not restate it here, in another file, or in a resume header.          -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Action plan — v5.0.0 unfreezes the brains that are ALREADY frozen

## 📍 STATE — the only perishable block in this file · cut back to its cap 2026-08-23

- **Next:** **nothing engineering is left on this release, and the queue that gated it is empty.**
  The third `/code-review` pass's **T1–T15 are all paid**, plus the two convention items its cap had
  cut — [`v5-code-review-triage-action.md`](v5-code-review-triage-action.md) owns every one of them
  and this file restates none. What remains is **steps 4, 5 and 6 of § *WHAT IS YOURS, IN ORDER***
  — merge, bump, tag — and **that section is the authority**. Step 4's review instruction is spent
  (4a): the campaign is closed, so step 4 is now the merge itself and nothing else.
- **Blocked on:** **nothing a session can move.** The one open question — a fourth `/code-review`
  pass — **is answered: NO, the campaign is closed at three** (Thomas, 2026-08-23, *"on close (ça a
  déjà trop duré)"*). § *WHAT IS YOURS* step 4a records it and owns the argument. **Do not re-open
  it, do not offer a pass**; what is left is the merge, the bump and the tag, and all three are his.
- **Owner's call pending:** **ONE, and it gates nothing** — the `concurrency` group for `ci.yml`,
  offered twice on 2026-08-23 and simply not answered. § *THE ONE PIECE OF THE CAUSE STILL
  UNREPAIRED* holds the three lines, the trade-off and the recommendation (yes). Everything else is
  answered: the five decisions, the `scripts` bump, W5b, the flake not holding the tag and its
  instrument being post-tag, the review campaign closed at three passes, F11. **Do not re-ask those.**
- **A session may, alone:** re-run the rehearsal (`node maintainers/qa/field-rehearsal/rehearse.mjs`)
  against a copy, and write the macOS flake's instrument (§ *THE macOS FLAKE* owns it — post-tag, not
  a gate). **Not** merge, tag, publish, push to `main`, write into `templates/fr/**`, or write into
  either of his two real brains (a read-only COPY under the job's tmp dir is not the brain).

> ## ✅ ANSWERED BY THOMAS — all five, 2026-08-22 _(the arguments; the state is in the block above)_
>
> They were assembled as *WAITING ON THOMAS* and put to him in one pass. **Every one is now decided.**
> Each answer is recorded here **and** beside its evidence in the section that owns the argument.
>
> - [x] **1. Windows → REPAIR, (a) + (b).** (a) teach the ancestor fetch that a recorded sha may be
>       CRLF — it repairs brains **already installed**; (b) pin the line endings at delivery so it
>       cannot recur. → § *THOMAS'S CALL — the ancestor FETCH is inert on Windows*, directly below,
>       holds the design and the four tests it owes. **(d) ship-and-state-the-limit is OFF the table**,
>       so the note needs no Windows qualifier at all.
> - [x] **2. The release TITLE → `v5.0.0 — The One Where Your Edits and Its Updates Finally Merge`.**
>       His own framing, asked for twice: the title must say **the merge** (Kenjaku folds its new work
>       into your own edits at update time), not the promise or the symptom. The three earlier
>       candidates are superseded. → [`release-v5.0.0-note.md`](release-v5.0.0-note.md).
> - [x] **3. The note KEEPS ITS SEVEN bullets** — one more than `CONVENTIONS.md` §11's six, deliberately.
>       Nothing is folded, nothing is promoted from the doctrine cargo below the fold.
>       → [`release-v5.0.0-note.md`](release-v5.0.0-note.md), the arbitration box at the top.
> - [x] **4. The regimes question → (a): advance `regimes` (and `retired`) to the target's at step 7.**
>       With the write guard's widening **called out in the release note** — that was the condition
>       attached to the recommendation, and he took the recommendation. → § *THOMAS'S CALL — a brain
>       keeps its INSTALL-DAY regime list*, further down this file.
> - [x] **5. ONE review, ONE merge, NO squash, and the history is kept WHOLE.** His words: *"je ne veux
>       plus que tu squash… je veux garder tout l'historique… une code review sur l'ensemble et on merge
>       qu'une seule fois"*. Concretely: **#76 is retargeted to `main`**, reviewed as one body of work,
>       and merged with a **merge commit** (never squash, never rebase). #75 is **not** merged first and
>       **not** closed by hand — its head is an ancestor of #76's, so GitHub marks it **merged** on its
>       own when #76 lands. → § *S9-2b's materials*, and § *S9 — the release tail*.
>       - 📐 **Checked, not assumed** _(2026-08-22)_: the repo allows all three merge styles
>         (`merge`/`rebase`/`squash` all true), so **squash is reachable by a mis-click** — the button
>         has to be set to *Create a merge commit* at the moment of merging. The branch is **259 ahead
>         of `main`, 0 behind, no conflict**, so retargeting owes **no rebase** and rewrites nothing.
>
> 📦 **Ready and NOT applied**: the `engineVersion` bump (three of its four numbers dictated by the
> diff, the fourth by 25 tags of precedent) — § *S9-2b's materials*.
>
> > 🛑 **AND IT LANDS WITH THE CUT, NOT BEFORE — Thomas, 2026-08-22.** This line used to end *"so it
> > does not need deciding, only doing"*, and the session offered to apply it early. **He refused, and
> > the reason is the fleet, not tidiness**: a bumped version that is not published makes everyone
> > believe the release is out, and **a fresh install stamps itself with a version that was never
> > released** while the rest of the work is still pending on his machine.
> >
> > 📐 **Checked, so the constraint is enforceable rather than a feeling** _(2026-08-22)_: what
> > publishes a release to the fleet is the **TAG** — `releasesAhead` compares published semver tags
> > against the tag a brain was installed at, and `engineVersion` plays no part in it. There is also
> > **no release workflow** in `.github/workflows/` (only `ci` and the nightly mutation run), so
> > merging to `main` triggers no publication. **But the install side is exactly his point**: a new
> > brain is created by copying the launcher's default branch, so whatever sits on `main` is what it
> > receives, and the `engineVersion` it records is whatever the manifest there says.
> >
> > **The rule this leaves**: the bump is **not the loop's**, and it is not a pre-cut chore. It is
> > applied as part of cutting, in the same movement as the tag.
>
> 🔴 **CI was RED on `feat/engine-base-unfreeze`, and that was expected**: four Windows failures — three
> were item 1's defect, the fourth is a harness artifact (the fingerprint table regenerated from a CRLF
> checkout). Nothing else was failing, on any platform.
>
> ✅ **READ, NOT PREDICTED** _(run `32558375080` on `13ef852`)_: the **three product failures are gone
> on `windows-latest`**, and the harness artifact is not. **Four Windows failures → one.** _(The
> transient second one was W1's own new pole, whose premise guard was macOS-shaped; fixed in
> `f244290`.)_ → § *W6*, which owns the detail.
>
> ✅ **AND NOW → ZERO** _(2026-08-22, run `32564338986` on `3b6820b`, the full PR matrix 7/7)_: the last
> one was the S7-2 harness artifact, and closing it also closed a maintainer defect nobody had named —
> **a release cut from a Windows clone would have shipped a CRLF fingerprint table**. → § *W6*.
>
> ⛔ **AND "ZERO" IS NOT WHAT THE BRANCH'S CI ACTUALLY DOES — measured 2026-08-23.** That line reads a
> **single green run** as a property of the branch. Over the **last 30 PR runs: 25 green, 5 red**, and
> **all five are the same test on macOS** — never Windows, never another test. → § *THE macOS FLAKE*,
> which owns the measurement and what is still unknown. **A one-run green is not a green matrix**, and
> this is the same shape as the emptiness claims this plan already paid for twice.

> ## 🔴 THE CI WAS RED FOR THREE HOURS AND NOBODY LOOKED _(2026-08-23, closed the same evening)_
>
> _(Not a code-review finding, and not v5's promise — but it happened ON this branch, in the hours
> before the merge, and it is the reason the tag was not cut tonight. The durable half is
> `CONVENTIONS.md` §9, which now carries both bullets; this box keeps the incident.)_
>
> **What went wrong, in the order it went wrong:**
>
> - [x] 🪟 **A fixture spelled a path with `/` where Windows uses `\`** — `dir.split("/").pop()` on a
>       `C:\…\Temp\…` tmpdir returns the WHOLE path, so `join(dir, "..", that)` pointed at a directory
>       that cannot exist. Red on every Windows cell from 14:38 UTC. **The tripwire caught it on the
>       first push**, in 54 seconds, exactly as §9 designed it to. → `3ce9574`.
> - [x] 🧊 **Then a second defect turned the red into a THREE-HOUR OUTAGE** — `awaitStartupSync` read
>       the test process's own stdin (`readFileSync(0)`). Under `node --test` that is a pipe with no
>       writer: POSIX answers EAGAIN, **Windows never answers at all**. One runner held **2 h 46 min**;
>       with no `timeout-minutes` on any job but one, GitHub's **6-hour** default applied, so 24
>       commits' worth of jobs queued behind it while every surface said *"in progress"*. → `6799e69`.
> - [x] 🕰️ **The ceilings, which is what makes the next one cheap** — every job now carries a
>       `timeout-minutes` sized at a few times its measured green, and every suite a per-test ceiling
>       **strictly tighter** than the job's, so a hang **names its test** instead of dying mute.
>       Loosened on Thomas's call from 60 s to 4 min per test _(a timeout that fires on a busy GitHub
>       is a false red, and a false red is how a real one stops being read)_. → `ae6ad2d`.
> - [x] 🪞 **And a guard of ours went red for a true reason it had no business asserting** — the vault
>       write-guard's self-guard matched the whole CI command line to check a claim about that line's
>       POSITION, so adding a flag refuted it on all seven cells. Matched on the path now, and checked
>       in **both** directions rather than assumed. → `b301eda`.
>
> ### 🛑 THE ACTUAL FAILURE, and it is mine, not the tooling's
>
> **Twenty-odd commits were pushed and not one was read.** §9's standing rule said *push every green
> commit so the tripwire is not disabled* — it made the net fire and never made anyone look at it.
> **Thomas found it from the GitHub UI**, three hours in: *"ça fait au moins 10 builds qui sont
> queued"*, then *"tout est rouge depuis 15h30"*. The human was the monitoring.
>
> - **A push whose result is never read is worse than no push**: it manufactures the appearance of a
>   net. Strictly worse than §9's earlier 52- and 67-commit episodes, where nobody believed otherwise.
> - **NO HOOK, and that is a decision, not an omission** _(Thomas, 2026-08-23)_: *"j'ai peur que ça
>   alourdisse vraiment la latence… on a de plus en plus de hooks"*. So the written rule is the **only**
>   net here — `CONVENTIONS.md` §9 and the always-loaded `rules/ci.md`. No braces behind the belt.
>
> ### 🟡 THE ONE PIECE OF THE CAUSE STILL UNREPAIRED — **offered twice, not yet answered**
>
> **`ci.yml` has no `concurrency` group**, so a new commit supersedes nothing: each one stacks another
> set of jobs behind whatever is already queued. That is what turned one hung job into **48 runs** on
> 2026-08-23, and what made 46 hand-cancellations (plus three more later) necessary. Three lines fix
> it — `concurrency: {group: ci-${{ github.ref }}, cancel-in-progress: true}`.
>
> - **Put to Thomas twice on 2026-08-23; he answered the other questions and not this one.** Not a
>   refusal, just an unanswered offer — so it is written here rather than left in a chat that clears.
> - **The recommendation is YES.** The tripwire's value is per-commit signal on the LATEST commit;
>   superseded runs buy nothing and starve the runner pool.
> - **The trade-off, stated so the answer is informed**: intermediate commits stop getting their own
>   Windows verdict. Given the tripwire exists to speak while a branch is being written, and the branch
>   is what gets merged, that is a cost worth paying — but it IS a cost, and the call is his.
> - **A session may not do this unasked**: it changes the CI's behaviour for every future branch.
>
> ✅ **Closed**: the full 7/7 matrix is green on `b301eda` **and on `9a7a336`**, macOS and Windows, in
> ~2 minutes each. The whole 13:40 → 14:50 wall of red was the Windows path bug (three Windows cells,
> every run); the 18:28 wall was the CI-guard flag; **since the fixes, the only red left anywhere is
> the macOS flake**, which struck `ae6ad2d` and `9a7a336` and cleared on a re-run of that single cell.
> → § *THE macOS FLAKE* owns it, and Thomas already ruled it does not hold the tag.
>
> ## 🎲 THE macOS FLAKE — **one test reddens ~1 CI run in 6, and the cause is NOT known**
>
> _(Measured 2026-08-23, while the third `/code-review` pass was running. Recorded with its cause still
> open **on purpose**: this plan's own doctrine is that a located cause is a hypothesis until something
> is run, and four hypotheses were run and killed. Nothing was changed on the strength of a guess.)_
>
> **The fact.** `scripts/session-universe.test.mjs:334` — *"the universe hook waits for the startup
> pull, and announces the universe that ARRIVED"* — fails on **`macos-latest` only**, on **Node 22 and
> Node 26 alike**, in **5 of the branch's last 30 PR runs**. Every failure is byte-identical: the hook
> printed `Active universe: 'acme'` (the pre-pull value) where the test demands `'blue-team'` (the one
> the simulated pull landed). **The hook did not wait.** Runs: `32623233706`, `32623082342`,
> `32623045541`, `32603217332`, `32602441587`.
>
> - [x] 🟢 **AND IT IS NOT THIS RELEASE'S DOING — checked, not assumed.** The five failures above ran
>       on `4cc2ace` … `d850ede` (2026-08-22 22:26 → 2026-08-23 06:33 UTC), and on **every one of those
>       commits** `session-universe.mjs`, `session-universe.test.mjs` and `lib/startup-sync-gate.mjs`
>       were byte-identical to `main`. v5 neither introduces the flake nor touches the barrier at the
>       moment it was measured. It is inherited, and it is already on every brain in the fleet.
>       - > 🛑 **CORRECTION, 2026-08-23 evening — this bullet said "`git diff main...HEAD` … is empty",
>         > in the PRESENT TENSE, and that sentence was ALREADY FALSE when it was written.**
>         > `session-universe.mjs` had diverged at **09:40 that morning** (`779637e`, the symlink
>         > entrypoint fix), and `lib/startup-sync-gate.mjs` diverged at 16:56 (`dd9e1d5`, T11's second
>         > caller). Re-run that diff today and it comes back **+8/−3 and +39/−0** — a future session
>         > checking the claim as written would find it refuted and could throw out a verdict that is
>         > actually sound.
>         >
>         > **The verdict survives because the EVIDENCE was never the diff at HEAD — it was the diff at
>         > the commits that failed**, and that is now what the bullet says. The lesson is the shape:
>         > *"X is identical to main"* is a claim about a moving target, and a plan is read for weeks.
>         > **Anchor a factual claim to the commit it was measured on, or it decays into a lie on its
>         > own**, with nobody editing it. Same family as the stale proposal box further down, and as
>         > § *FOUR LESSONS*' restated decisions — the third instance on this branch alone.
>         >
>         > 🔎 **Three more observations, and one of them is the cleanest evidence yet.** The same test
>         > reddened on `f92dcbe` (Node 24), `ae6ad2d` (Node 26) and `9a7a336` (Node 22) — three
>         > different Node versions, all macOS, all with the divergences present. Then **the single
>         > failing cell of `9a7a336` was re-run on its own and PASSED**, the other six untouched and
>         > green: same commit, same code, opposite verdict. That is the tightest demonstration on file
>         > that this is a flake and not a defect of the branch.
>         > - ⚠️ **But the RATE looks worse than the ~1-in-6 above, and the honest word is "looks".**
>         >   Two of the three PR runs on fixed code flaked. Three runs is not a sample, and the two
>         >   figures were taken under different runner load — so **do not overwrite the 5-in-30 with
>         >   this**, and do not reassure with it either. What it does change: obtaining a fully green
>         >   matrix now costs a re-run more often than the earlier figure suggested.
>         > - The **"post-tag instrument" below is now the ONLY way to settle the cause**, because the
>         >   identical-to-main argument is spent.
>         >
>         > 🔬 **AND IT IS ALWAYS THIS ONE TEST — a CENSUS, not an impression** _(2026-08-23, on
>         > Thomas's question "est-ce toujours le même test ?")_. Every macOS cell that ever went red
>         > on this branch was enumerated and its log read. **Every single readable one is this test**,
>         > with one exception that proves the method: `6799e69`, where all six matrix cells failed on
>         > the CI-guard flag defect — deterministic, mine, and fixed in `b301eda`. The older runs whose
>         > logs GitHub has since expired were read at the time and recorded above as this same test.
>         > - **Seen on Node 22, 24 AND 26** — so it is not a Node-version effect, which one more
>         >   hypothesis need not be spent on.
>         > - **Never once on Windows**, across every run in the census.
>         > - **No second flake exists on this branch.** That is worth as much as the identification:
>         >   it means a red macOS cell can be triaged by name, and any OTHER failing test is real.
> - [x] 🔬 **NOT REPRODUCED HERE, and the attempt was not casual** _(~200 runs, all green)_: the test
>       alone **25×**; the **full suite 8×**; an instrumented copy of the hook outside the repo, made
>       to confess the gate's own return value, **12×** (`status: "done"` every time, `waitedMs` 201-232
>       against a 250 ms flip); and a **sweep of the flip delay** (0/10/25/40/60/100/150 ms) — the gate
>       released on `done` in every single case, so no window exists on this machine.
> - [x] 🪦 **Four hypotheses run and KILLED**, so the next session does not re-run them: `readFileSync(0)`
>       throwing `EAGAIN` on a not-yet-written pipe (360 spawns, 0 failures); the same with the parent's
>       event loop **frozen** right after `.end()` so the payload cannot flush (100 spawns, 0); the
>       grace/ceiling deadlines firing early (they cannot — both are far longer than the test's 250 ms,
>       and either would yield `blue-team`, not `acme`); and a torn read of the pointer (that would
>       announce the **default** universe, not `acme`).
> - **What that leaves, stated as the open question it is**: the only gate returns that release before
>       the flip are `not-expected` (settings unreadable → no puller) and `unknown-session` (stdin
>       payload unreadable → no key). **Both are fail-open branches, and both are unproven here.** The
>       decisive instrument is a test that **records which branch it took** when it fails, so the next
>       red run is read instead of reasoned.
>       - [x] ✅ **POST-TAG, and that is now DECIDED rather than merely deferred** _(Thomas,
>             2026-08-23, "ok pour après")_. Offered with its cost when the flake was displayed to him:
>             an hour, on a file deliberately frozen until the tag, changing none of the decisions
>             already taken. He took *after*. **Do not open it before the tag, and do not re-offer it.**
>       - 🆕 **AND THE STDIN-WRITE RACE MOVES BACK UP THE LIST, on evidence this branch produced by
>             accident.** `unknown-session` is reached when the payload is unreadable, and the harness
>             hands it over with `child.stdin.end(payload)` **immediately after `spawn`** — if the hook
>             reads fd 0 before that write lands, it gets nothing, concludes it has no session key,
>             does not wait, and announces `acme`. **Which is the observed symptom, exactly.**
>             - ⚠️ **This hypothesis is on the KILLED list above** (360 spawns, 0 failures) and it stays
>               there: not reproduced is not refuted, and 360 spawns on an idle laptop says little
>               about a loaded CI runner. **Do not record it as the cause.**
>             - **What is new is its PRIOR, not its proof.** On 2026-08-23 this very seam — a hook
>               reading `readFileSync(0)` off a pipe — cost three hours of CI, because on Windows the
>               same read never returns at all (§ *THE CI WAS RED FOR THREE HOURS*). A seam already
>               measured as environment-fragile in one direction is a better suspect for being
>               environment-fragile in the other. **The instrument settles it; this note only says
>               where to point it first.**
>
> **Why it matters even though it is not v5's**: the barrier exists because announcing one sphere while
> retrieving from another is a real field defect (the 2026-08-08 ordering defect). If the fail-open is
> reachable in the field and not only in the harness, that defect is intermittently back. **Nobody has
> observed it in the field**, and this measurement does not show that it can happen there — it shows
> the harness can reach it.
>
> **And the cheaper harm is certain**: at 1 red run in 6, CI stops being a tripwire. A red on this
> branch is now ambiguous, which is exactly what a release's last week must not have.
>
> ### ✅ THOMAS'S CALL — **this flake does NOT hold the v5.0.0 tag** _(2026-08-23)_
>
> Asked whether a known ~17 % red CI, **inherited from `main` and not introduced here**, should gate the
> release, he answered no: *"d'accord pour ne pas conditionner la sortie de la V5 à la correction de la
> CI qui échoue une fois tous les… à cause de flaky tests."* The recommendation above was taken as
> given, on its three stated grounds — the code is `main`'s, the failure mode is a fail-open back to the
> pre-barrier behaviour, and nothing has been observed in the field.
>
> **What that does and does not license**, so the next session does not read it too widely:
>
> - The tag ships with this red **known and written down**, not with it hidden. A red macOS run on THIS
>   test is expected; a red anywhere else is still a stop.
> - **The flake keeps its own item, straight after the tag** — CI being an ambiguous signal is a real
>   cost, and the decision buys time, not absolution.
> - **The instrument is still owed** (the test that records which fail-open branch it took). Its hold
>   was *"a review is reading the branch"*, and that hold is spent. It is post-tag work, and it is what
>   turns the next red from a thing to reason about into a thing to read.
>
> ## 🚨 THE REHEARSAL — **the first update to v5 does not unfreeze anything, and says it is up to date**
>
> _(2026-08-23. Run on a **copy** of `mind-palace` (v4.9.1, French), against a local mirror of this
> repository **tagged `v5.0.0`** at the branch's HEAD — because what reaches the fleet is the TAG.
> Nothing in the trial can reach an original: the copy is made **without `.git`**, so it has no remote
> and no push is even expressible; every path is under the job's tmp dir. `npm install` / `npm run
> index` are stubbed by a shim on `PATH` — they are network and model work, and this trial is about
> what the update WRITES INTO THE BRAIN. Everything else in the run is the real engine.)_
>
> **What was measured, in order, on a pristine copy:**
>
> - [x] 🔴 **After ONE `/update-engine`, the brain is NOT unfrozen.** `CLAUDE.engine.md` is still the
>       **334-line** file it has held since v3.6.0 (the release delivers 548). `regimes` still has its
>       three install-day keys and its 15-entry `merge` list, **without `CLAUDE.engine.md`**. `retired`
>       is still absent, so `tdd-discipline` is **still on disk**. `baseRefs` is still `{}`.
> - [x] 🔴 **And every surface says everything is fine.** `/update-engine --check` answers *"Your brain
>       runs v5.0.0. ✅ That is the latest release — there is nothing to install."* The session nudge
>       names **one** file (`.claude/settings.json`) and never mentions the doctrine. The SessionStart
>       self-heal detects **no gap** and changes nothing. **Nothing anywhere asks for a second run.**
> - [x] ✅ **A SECOND `/update-engine` does the whole thing, perfectly.** `doctrineRefreshed:
>       ["CLAUDE.engine.md"]`, `healed: [{rel: CLAUDE.engine.md, since: "v3.6.0", locale: "fr"}]`,
>       `skillsRetired: ["tdd-discipline"]`, `baseRefs: {CLAUDE.engine.md: "v5.0.0"}`, regimes advanced
>       to four keys / 16 entries — and the delivered doctrine is **byte-identical to
>       `templates/fr/CLAUDE.engine.md` at HEAD**. The mechanism is right. Its **first** run is not.
>
> **THE CAUSE, read rather than reasoned.** The update that carries this feature is performed by the
> brain's **OLD** engine: every deployed brain runs a `update-engine.mjs` that predates v5. That old
> step 7 writes back `{...local, engineVersion, indexSchemaVersion, source, provenance, baseRefs}` and
> **not `regimes`** — the very defect W3 was decided against, one level up. The auto-finalize child
> that follows *is* new code, and it is the release's only chance to repair this on the first pass —
> but it loads **the brain's own manifest as both target and local** (`reconcile-brain.mjs`, the CLI
> entry), so it reconciles against the **stale** family list and cannot see the doctrine either.
>
> **Why no test caught it.** Every QA pole calls **HEAD's** `reconcileBrain` directly. That models the
> second update, not the first. The one thing the whole fleet will actually run — *old parent, new
> child* — had no test at all. _(Same family as the FR false alarm and the hand-rolled lookup: the
> instrument was measuring a state no brain is ever in.)_
>
> **THE FIX, and why it is engineering rather than a call.** The child is spawned with `--sourceDir`,
> and that directory holds the release's own `engine-manifest.json`. Advancing the brain's `regimes`
> and `retired` from it, **before** the child reconciles, is exactly what W3 decided (Thomas, answer 4)
> — applied at the one place that runs on a deployed brain's first update. It is a no-op for the
> self-heal path, where `sourceDir === brainDir` and the two manifests are the same file. Nothing else
> moves: the version stamps and the index schema are the parent's, already written.
>
> - [x] ✅ **BUILT, AND THE SAME REHEARSAL NOW PASSES ON ONE UPDATE** _(2026-08-23 · `81dc6eb`)_. On the
>       copy of `mind-palace`, after a single `/update-engine`: the doctrine goes **334 → 549 lines and
>       is byte-identical to `templates/fr/CLAUDE.engine.md` at HEAD**, `regimes` gains its fourth key
>       and its 16th entry, `retired` arrives and `tdd-discipline` is removed, `baseRefs` records the
>       doctrine at `v5.0.0`. **The owner's territory is untouched**, checked file by file against the
>       original: `CLAUDE.md`, `.env`, `.mcp.json` and the **whole 588-note vault** are byte-identical;
>       `.claude/settings.json` differs by exactly the two hook entries this release wires.
> - [x] ✅ **AND THE OLDER BRAIN TOO** _(same run, `autre-brain`, v3.5.0 — three minor versions further
>       back, index schema 1 → 2)_: same unfreeze on the first update, plus 4 skills installed and 5
>       hooks wired. Vault, constitution and `.env` byte-identical.
> - [x] 🔊 **AND IT SAYS SO NOW** _(`7cc94bc`)_. The recap an owner reads on that update is printed by
>       their OLD engine, which cannot describe any of this — so the catch-up was landing in total
>       silence. The child writes one line, in the owner's terms, naming what arrived and what went. It
>       is refused to a self-heal, which is the pole that matters: a converged brain must not be told
>       daily about an update that happened once.
> - [x] 🧪 **AND THE TRIAL ITSELF IS NOW A COMMAND** _(2026-08-23 · `9f69cbd`)_ —
>       `node maintainers/qa/field-rehearsal/rehearse.mjs --brain <path>`, with a README that says what
>       it proves and how to read its three sections. It was a scaffold in a temp folder; the defect it
>       found is a **class** (old parent, new child) that every release changing the update path can
>       reproduce, so the instrument had to outlive the session. It exits non-zero if the update fails
>       **or** if the owner's territory moved. Re-run green on copies of both real brains.
>       - 📌 **This is the answer to *"la campagne de QA est-elle suffisante ?"***: it was not — the
>         suites all call HEAD's code, and the fleet never does. It is now, for this class.
> - [x] 🧬 **The catch-up line's WORDS are pinned** _(2026-08-23 · `6a65425`)_. A scoped mutation run on
>       the CLI came back at **66 %**, and all but three survivors sat in that one sentence: every clause
>       deletable with the suite green, the whole retired-skill half unreached. Nine poles now assert it
>       whole (arrivals, retirements, both joined, the silences) — plus the guard that writes an advance
>       down when the pass **delivers nothing**, which no test had made load-bearing.
> - [x] 🔁 **RE-RUN GREEN AFTER THE WHOLE TRIAGE** _(2026-08-23 · at `d579972`)_. Its last green was at
>       `2cb7d68`, and the third review pass has since changed the update path itself — the ancestor
>       fetch, the report the owner reads, the reconcile that forwards them. So the trial was re-run on
>       fresh copies of **both** real brains: **exit 0 both times**, doctrine 334 → 549 lines, `retired`
>       arriving, `baseRefs` recorded, and **the owner's territory byte-identical** on each. The report
>       printed is the post-T14 one, and on a run where the network answers it says nothing about a
>       network — which is the whole point of T14.
>

> ## 🛑 THOMAS'S CALL — **the ancestor FETCH is inert on Windows. The heal is FINE.**
>
> _(Found 2026-08-22 by reading the CI the pre-flight had never looked at. **This bears on the
> release's headline promise**, so it is at the very top.)_
>
> > ### ⛔ CORRECTION, 2026-08-22 — this box said "the heal does not recognise CRLF", and that was WRONG
> >
> > **The heal works on a Windows brain.** Measured by calling `healProvenance` itself on three merge
> > files: **CRLF content heals 3/3, byte-identically to LF**, and an owner's edit still heals **0/3**,
> > so nothing is weakened. `engine-heal.mjs:32` has normalised since S7-1 — `raw in versions ? raw :
> > fingerprint(normalizeEol(content))` — and its own comment names the Windows checkout as the reason.
> >
> > 🧭 **How the wrong verdict was reached, because the method is the lesson.** Yesterday's probe asked
> > *"is this CRLF digest a key of the table?"* — it **re-implemented the lookup by hand** instead of
> > calling the function that performs it, and the hand-rolled copy omitted the one line that matters.
> > **A reproduction of a seam is not the seam.** It is the same family as testing against a double's
> > behaviour rather than the real collaborator's: the measurement was real, deterministic, repeatable
> > and *about the wrong thing*, which is exactly the shape a wrong answer needs to survive review.
> >
> > 🪝 **And it was the `plan-carrier-guard` hook that broke it open**, by naming the archived plan as a
> > carrier this session kept not opening. That plan records `normalizeEol` being **deduplicated across
> > two modules at S1**, plus the merge normalising all three sides, plus `verifyBase` forgiving the
> > LF→CRLF rewrite. **S1–S6 had a CRLF discipline, written down, and the diagnosis never consulted it.**
> > A hook that judges no content found a factual error, purely by insisting a file be opened.
>
> **What is PROVEN, on this repo's real content and not by reasoning:**
>
> - [x] ✅ **THE HEAL IS NOT AFFECTED** — see the correction above. `healProvenance` normalises the
>       installed content before the lookup, so a brain whose files are CRLF heals exactly like an LF
>       one. The release's *"a frozen brain starts receiving again"* stands on Windows.
> - [x] 🚨 **THE ANCESTOR FETCH IS — and this is a ONE-LINE asymmetry, read not guessed.**
>       `planAncestorFetch` resolves the tag with a **direct lookup by the recorded sha**
>       (`engine-ancestor.mjs:59`: `table?.files?.[rel]?.[recorded]`), with **no EOL forgiveness on the
>       key**. A Windows brain records a **CRLF digest** at install (deliberately — S1 chose to digest
>       delivered bytes *as they are*, so an update does not flip a sha for content nobody touched), and
>       no table row is CRLF. The lookup misses, the plan is empty, **no fetch is attempted at all** —
>       which is precisely CI's `actual: []`.
>       - 🔍 **The asymmetry, stated exactly**: `verifyBase` forgives CRLF **content** measured against
>         an LF **record** (`engine-base.mjs:69` normalises `baseContent`). Nothing forgives the mirror
>         case, an LF **candidate** against a CRLF **record** — and that is the only case a Windows
>         brain ever presents.
> - [x] **The S7-2 freshness guard's Windows red is a HARNESS artifact, not the product.** It
>       regenerates the table from the runner's **working tree**, which is CRLF there, so the digests
>       cannot match a table generated on LF. ⚠️ **The real risk it hides is worth naming**: a
>       maintainer cutting a release **from a Windows checkout would generate a CRLF table**. Nobody has
>       done that, and nothing prevents it.
> - [x] **The updater's clone does not pin line endings** — `buildCloneArgs` is
>       `clone --depth 1 --branch <ref> --single-branch`, with no `-c core.autocrlf=false`. Git for
>       Windows defaults `core.autocrlf` to **true**, and `.gitattributes` covers only `*.cmd` / `*.sh`.
>
> - [x] **CI names it, on the Windows runner** _(2026-08-22, once `fetch-depth: 0` cleared the noise
>       that had been hiding it)_: *"a skill edited BEFORE this release now ACQUIRES its ancestor,
>       fetched from the tag"* fails with **`actual: []`**, and two more QA poles fall with it (the
>       clean merge and the clash that should yield a marked sidecar) — all three need the ancestor the
>       first one never fetched.
>
> **So ONE of the two fallen-forbidden claims is at risk, not both.** *"An old brain receives"* holds
> everywhere. *"The merge reaches back"* is the one that goes quiet on Windows: a Windows owner who
> edited a skill before this release gets **`preserve/customized` + a `.new` sidecar** — the old
> behaviour, correct and visible, but not the promise.
>
> - [x] ✅ **REPAIRED ON THE BRANCH** _(2026-08-22 · W1 · `65a6080`)_. Both claims now hold on both
>       platforms in the suite. **The proof on a real Windows image is W6's, and it is still owed.**
>
> - [x] 📥 **AND A REAL WINDOWS INSTALL DOES HOLD CRLF — read, not reasoned** _(2026-08-22)_. The
>       yesterday's caveat was *"the CI is a fixture; nobody has read a real Windows brain's bytes"*.
>       The install path answers it without one: `installer.mjs` lists the launcher's tracked files
>       (`git ls-files`) and then **`copyFileSync`s each one from the launcher's WORKING TREE**
>       (`installer.mjs:309`) — a byte-verbatim copy, no encoding pass, no normalisation. **A brain's
>       engine bytes are therefore exactly its launcher checkout's bytes.** Git for Windows defaults
>       `core.autocrlf` to **true**, so a launcher cloned on Windows has a CRLF working tree, and the
>       brain is CRLF **from install day**.
>
> **What is STILL not proven, and must not be written as if it were**: it rests on the **user's own git
> config at clone time**, which nobody can read remotely. A Windows user who had set
> `core.autocrlf=false` (or `input`) has an LF brain and is unaffected. So the population is *"Windows
> brains installed with the default git config"* — almost certainly all of them, not provably all
> of them.
>
> **Why it is not mine to fix**: every way out changes what ships or what an update writes.
>
> - [x] ✅ **(a) IS BUILT** _(2026-08-22 · `65a6080` + `13ef852` · W1)_. The four named tests went red on
>       their assertions first, plus 19 more; full suite **2 446 / 2 443 pass / 0 fail / 3 skipped**.
>       **Still owed by W6, and it is not a formality**: green on a real `windows-latest` runner, read
>       from the run. A macOS pass **synthesises** the CRLF; it does not observe it.
> - [x] **(a) Teach the fetch path that a recorded sha may be CRLF.** ⚠️ **Corrected 2026-08-22, second
>       pass: this is TWO seams, not the one line the previous version of this box promised.** Measured
>       by calling both: `planAncestorFetch` yields **0 plan entries** for a CRLF-recorded sha (1 for
>       LF), **and** `verifyBase` refuses the tag's LF blob against a CRLF record — so fixing only the
>       lookup would produce a plan whose every entry the write-side then rejects. **The design is
>       written out below**; it is still the cheapest option and still fixes brains already installed.
>       - 🧭 **Why "one line" was wrong, twice in a row on the same subject**: both times the shortcut
>         came from **reasoning about a seam instead of running it**. The asymmetry was named correctly
>         (*content forgiven, key not*) and then treated as the whole story, when the write-side check
>         is a third place the same question is asked. **Naming a defect precisely is not the same as
>         having enumerated where it lives.**
>       - [x] 📏 **Its one stated risk is now MEASURED, and it is ZERO** _(2026-08-22)_. The risk was
>             *"two byte-states collapse to one answer"*. Re-folding all **25 published tags + the
>             working tree** and digesting each state a second time after LF-normalisation:
>             **82 raw byte-states → 82 normalised, 0 lost**, 0 collapses spanning versions (so
>             `baseRefs` stays unambiguous), 0 spanning locales (so no EN/FR flip can read as
>             untouched). The reason is structural, not luck: every row is folded from a **git blob**,
>             and the object store holds LF — **0 of the 82 carried CRLF at any ref**. Option (a)
>             therefore costs nothing it was feared to cost. _(It remains yours: what it changes is
>             what the engine calls "untouched", and that is a fleet-wide semantic.)_
> - [x] ✅ **(b) Pin the delivery — BUILT as W2** _(2026-08-22 · `dd08024`)_. `-c core.autocrlf=false` on
>       the clone, **and the installer's copy delivering what the object store holds** (which is not a
>       flag: the installer clones nothing). Makes future deliveries stable; does **nothing** for a
>       brain already installed with CRLF — that is W1's half, and it is built too. → § *W2* in the work
>       order for what each seam turned out to be.
> - [ ] **(c) `* text=auto eol=lf` in `.gitattributes`.** Repo-wide and blunt: it rewrites Windows
>       working trees and sits next to the launcher's deliberately opposite `*.cmd eol=crlf` rule — the
>       file's own comment warns that one rule wrongly applied to both families is the trap.
> - [ ] **(d) Ship as is and state the limit**: on Windows, a file you edited before this release is
>       preserved with its `.new` sidecar instead of merged. **Much cheaper than it looked yesterday** —
>       the headline promise (a frozen brain receives again) is untouched, so this costs one honest line
>       in *Honest limits*, not a qualifier on the lead.
>
> _(My recommendation if you want one: **(a) + (b)**, and (a) is now a much smaller thing than this box
> first said — one lookup learning what its neighbours already know, not a new fleet-wide semantic.
> Still yours: it changes what an update may write on a deployed brain.)_
>
> ### 📐 The DESIGN for (a) — written before any code, per the loop's own rule
>
> _(Design slice, 2026-08-22. Not built in the same iteration on purpose. **By the mode plan's written
> list of what needs the owner** — cutting, note tone, scope arbitration, merging, anything destructive
> — **this is none of them**: it repairs a defect in code this branch already carries and has never
> published. Building it is the loop's; the box stays here because it was raised as yours and you may
> still want (d) instead.)_
>
> **The constraint that rules out the obvious fixes.** A digest cannot be un-digested: given a CRLF
> `recorded`, nothing derives the LF row it corresponds to. So neither *"normalise the key"* (there is
> nothing to normalise) nor *"record normalised shas at install"* (that flips every deployed Windows
> brain's record, which S1 deliberately refused) is available.
>
> **The shape, on the MISS path only — so an LF brain executes not one extra instruction.**
>
> - [x] When `table.files[rel][recorded]` misses, do **not** give up: the rel's rows are few (2–11 in
>       this table, 82 over 15 files). For each candidate row, the fetch already knows the tag and the
>       source path, so it can obtain the blob and test `fingerprint(crlfify(blob)) === recorded`. The
>       row that answers **is** the recorded version, proved by the same membership argument S7 rests
>       on — never derived from the installed bytes.
>       - 📐 **ONE REFINEMENT the design did not name, and it is where the work went** _(built
>         2026-08-22)_. The planner is **pure** and holds no git, so it cannot be the thing that tests
>         a blob. It therefore stops **resolving** on a miss and starts **NOMINATING**: it returns
>         `{ rel, recorded, candidates: [{ tag, sourcePath }] }`, and the walk lives in the fetch,
>         which is the half that already spawns git. A hit still returns `{ rel, tag, sourcePath,
>         recorded }` — **two shapes on purpose**, so the LF fleet's argv and call count are provably
>         byte-for-byte what they were, rather than merely believed to be.
> - [x] The variant that matched is then carried to the write: `verifyBase` is asked about the **CRLF**
>       form, and the CRLF bytes are what land in `.engine-base/`. That is not a concession, it is
>       correct — the base must be **what was delivered to that brain**, and CRLF is what was delivered.
>       - 🛑 **And `verifyBase` turned out to be the WRONG function to ask** _(found by writing the
>         test, not by reading the code)_. It **forgives** EOL to answer a yes/no, so on the candidate
>         path it would say *"usable"* without saying **which byte-state** matched — and the answer here
>         has to BE bytes. Hence `recordedVariant` beside it in `engine-base.mjs`: deliberately
>         unforgiving, it returns the byte-state it has **proved**, or null. A test pins the difference
>         on the very input where the two disagree.
> - [x] **Cost, stated**: up to N `git show` on a miss, N ≤ 11, and only on a brain that has the defect.
>       No table change, no manifest change, no recorded sha rewritten. _(Confirmed as built: one fetch
>       per DISTINCT tag, memoised across entries, and the walk stops at the row that answers.)_
>
> **What must go red first** (the tests this design owes, before a line of it exists):
>
> - [x] A CRLF-recorded hole yields a plan entry naming the right tag — the pole CI fails on today.
>       _(Named as **candidates** rather than one tag, per the refinement above.)_
> - [x] Its ancestor is written, and the merge that follows keeps the owner's lines **and** lands the
>       update, on a brain rebuilt from a real tag. Same assertion as the LF pole, different EOL.
>       `brainAtRelease` gained an `eol: "crlf"` option that CRLF-ifies the fixture **before** the
>       provenance is computed, which is the defect's own ordering. 🛑 **The pole asserts its own
>       premise** — that the record really is the CRLF digest and really is absent from the table — so
>       it cannot pass as an LF brain wearing a Windows name, which is exactly how the FR pole measured
>       the wrong thing for a day.
> - [x] **An owner's genuine edit still fetches nothing**, in both EOL forms. The whole risk of this
>       change is loosening the proof, so the negative pole is the one that must be triangulated.
>       Three of them: a candidate list nothing can prove writes **not one byte** and reports `failed`;
>       the same with a tag whose blob is already CRLF (so `crlfify` cannot become a way for any CRLF
>       blob to pass); and an **untouched** Windows brain plans nothing at all.
> - [x] An LF brain's plan and its fetch count are **unchanged** — the miss path never runs for it.
>       Asserted twice: the hit entry carries no `candidates` key, and every pre-existing argv test
>       passes untouched.
> - [x] 🧪 **Mutation, scoped to the changed lines** (never the whole file — CONVENTIONS §5quinquies):
>       `engine-base.mjs:56-86` **100 %** (23 killed), `engine-ancestor.mjs:55-90` **100 %** (10),
>       `engine-ancestor-fetch.mjs:60-112` **96.67 %** → **100 %** with the one test the survivor
>       demanded (`13ef852`). → `mutation/RESULTS.md`.
>       - 🧭 **The trap this run walked into first, worth more than the score**: `mutate-one.mjs`
>         resets its worktree to **`git rev-parse HEAD`**, so a pass run over an **uncommitted** change
>         measures the code that is still committed. The first run returned a clean **100 %** for lines
>         that did not exist yet. Same family as yesterday's hand-rolled lookup: real, deterministic,
>         repeatable and **about the wrong thing**. **Commit, then mutate** — the order is not a
>         preference.
>
> **Deliberately NOT in this design**: pinning the clone with `-c core.autocrlf=false` (that is option
> (b), it is future-only, and it is a separate decision), and anything touching `.gitattributes`.
>
> ~~⚠️ **The release note needs ONE honest line, not the qualifier this box first demanded.**~~
> ✅ **AND IT GOES AWAY — (a) WAS TAKEN AND IS BUILT** _(2026-08-22 · W1)_. The line this box was about
> to make the note owe — *"on Windows, your edits survive and the new version waits beside them"* —
> **is no longer true and must NOT be written**. Both promises now hold on both platforms: the heal
> was never affected, and the ancestor fetch reaches a CRLF-recorded brain.
>
> ✅ **AND W6 HAS NOW CONFIRMED IT ON A REAL WINDOWS RUNNER** _(2026-08-22, run `32558375080`)_: the
> three QA poles that carried this promise are green on `windows-latest`. The claim above is safe to
> write into the note. → § *W6* for what is still red there (the harness artifact, not the product).

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
> - [x] ✅ **(a) Advance `regimes` (and `retired`) to the target's at step 7. CHOSEN AND BUILT**
>       _(2026-08-22 · `df09f17` + `ea85b07`, W3)_. It aligns the record with what the update just did —
>       the reconcile already decides everything from `target`. Widens the write guard's allowlist to
>       whatever the new engine declares, which is the point and also the risk, **and the release note
>       now says so out loud** — twice: once as what was built, once under *honest limits*, because the
>       owner of an old brain will feel it as "it started asking me about files it used to let through".
>       - 🛑 **"One line" was right about the change and wrong about the SHAPE.** It is one line at the
>         call site, and the thing it calls has to exist: the result is **spread** over the manifest,
>         where an `undefined` value does not defer to what `{...local}` put there — it overwrites it,
>         and `JSON.stringify` then drops the key. An engine that shipped without declaring its regimes
>         would leave every updated brain with **no regime list at all**, and the write guard recognises
>         no engine file without one. Hence `advanceRegimes`, its `??` fallback, and a test that names
>         that failure rather than the happy path.
>       - 📐 **What the v3.6.0 fixture proves, and neither half is hypothetical**: the doctrine family
>         arrives, and `.claude/skills/tdd-discipline/**` — which v3.6.0 lists under `merge`, knowing no
>         `retired` key at all — is **finally recognised as retired**, so the brain stops seeding a base
>         for a skill nobody ships.
>       - ⚠️ **`engineMcpServers` is NOT advanced, and that is deliberate**: answer 4 named `regimes`
>         and `retired`. `session-self-heal.mjs` derives its wanted servers from the delivered
>         `.mcp.json.template` and is unaffected — its comment, which said "update-engine never
>         refreshes those", is now corrected to say which half stopped being true. Widening it further
>         would be a new decision, not this one.
> - [ ] **(b) Leave the manifest alone, and have the standing readers use the ENGINE's own regimes.**
>       A brain's `scripts/lib/**` is at HEAD after an update, so the engine can read its own list. No
>       migration, but two sources of truth for one fact.
> - [ ] **(c) Ship v5 as it is.** The doctrine is offered at every update and re-offered at the next
>       release. Honest, never silent during an update, and mildly repetitive between them.
>
> _(My recommendation if you want one: **(a)**, with the write guard's widening called out in the
> release note. But the fleet is yours.)_
>
> ## 🧭 FOUR LESSONS THIS RELEASE PAID FOR — durable, and none of them is a status
>
> _(This is what four generations of `RESUME AT` headers were really carrying. The headers themselves
> are gone: the STATE block at the top of the file is the resume marker now, and it is the only one.)_
>
> - 🛑 **A closed list is not an emptied inventory.** This plan announced an empty queue **twice** and
>   was wrong both times, because it read its own slice list instead of looking. An emptiness claim is
>   made against **three surfaces** — this file's slices, the ROADMAP's open rows, and the scheduled
>   open issues — or it is not made.
> - 🔀 **The findings are the triage plan's, and only its.**
>   [`v5-code-review-triage-action.md`](v5-code-review-triage-action.md) answers how many are fixed,
>   which is next, and what the blocker was decided to be. **This plan restates none of it**: a count
>   copied here is a count that goes stale the next time a finding closes.
> - 🗣️ **A question is not an item in a list of steps.** Asked what remained, an earlier session
>   answered with six ordered steps and buried the only actual decision inside step 5. His reply:
>   *"je ne comprends pas ce que tu attends de moi"*. That is why the STATE block has a key of its own
>   for the owner's calls, and why the cut below is announced in **one line** rather than recited.
> - 🪤 **A STATE line about someone else's decision is wrong in BOTH directions, and it cost him twice.**
>   The `Owner's call pending:` key here carried F11 — which belongs to § E of
>   [`v5-code-review-triage-action.md`](v5-code-review-triage-action.md), not to this file. One version
>   said the whole French twin was untranslated (it is 548 lines of French against the English 549);
>   the next advertised as pending a decision that section had already answered. **Both were
>   corrections he had to make.** A decision is restated as a **link**, never as a summary — a summary
>   is a copy, and a copy of a decision goes stale in exactly the two ways this one did.
> - 🧰 **A rule restated a third time should become a gate.** `mutate-one.mjs` scoring uncommitted work
>   was met twice in one night, two hours apart, with the rule against it written in bold both times →
>   it now **refuses** an uncommitted target _(2026-08-22 · `ced15a0`)_. Detail:
>   [`mutation/RESULTS.md`](../../mutation/RESULTS.md).
>
> _(Related work in another repo, linked rather than restated: the harness now carries the plan-state
> convention this file obeys —
> [`harness-consolidation-action.md`](https://github.com/tpierrain/use-case-driven-harness/blob/main/docs/plans/harness-consolidation-action.md).
> It was never part of this cut.)_
>
> ### 🎙️ WHAT IS YOURS, IN ORDER — the whole cut, on one screen _(2026-08-22)_
>
> _(Assembled here so it survives a cleared context: each line links the section that argues it. The
> sections stay the authority; this is the order, not a second copy of the reasoning.)_
>
> - [x] ✅ **1. Retarget #76 to `main` + new body and title — DONE** _(2026-08-22, on Thomas's GO, with
>       him)_. #76 is now **based on `main`**, still draft, MERGEABLE, 278 files. Title applied:
>       *"v5.0.0 — the engine owns what it shipped, and stops leaving old brains behind"* (the RELEASE
>       title is a separate choice and is unchanged). #75 is untouched: its head is an ancestor, so
>       GitHub marks it merged on its own when #76 lands.
>       - 🛑 **The prepared body was itself stale, and applying it unread would have republished the
>         very defect this release ends.** It still said *"its base is `chore/s0bis…`, on purpose"* and
>         counted **212 commits / 166 files against that base**. Four passages were corrected before
>         sending: the base paragraph, the counts (now **326 commits, 278 files, +46 278 / −1 686
>         against `main`, 0 behind**), the "merge order" open question (settled: retargeted, one merge
>         commit, squash reachable by a mis-click), and the `scripts` bump, which the body still
>         described as undecided a day after he arbitrated it. **A prepared artifact ages exactly like
>         a live one** — the third surface of this release to prove it.
>       - 📖 **And the body now tells a reviewer where to look**, since half the diff is not code: 139
>         files / 27 113 insertions are the maintainers' plans; the code perimeter is **79 source files
>         (+6 957 / −533)** plus **44 test files (+11 498)**, and the operational risk sits in the files
>         that write into installed brains (`scripts/lib/engine-*.mjs`, `reconcile-brain.mjs`).
> - [x] ✅ **2. W5b — the WORDING of the four doctrine texts: ARBITRATED, they ship AS WRITTEN**
>       _(2026-08-22, his words: "les 4 me vont")_. The four sections of `CLAUDE.engine.md` — the
>       signal announcement (#61), the source-first level 1, the sub-agent threshold (#64's rule half)
>       and the conditional tooling rule (#67) — were shown to him **verbatim, in full, one by one**,
>       each with the field defect it exists for. **He changed no word.** → § *W5b*.
>       - 📐 **What that spares, and it is why the arbitration was put before the review**: a wording
>         change to `CLAUDE.engine.md` is never prose alone — it drags the **FR twin** (locale-drift
>         guard) and a **fingerprint-table regeneration** (measured 2026-08-22, § H of the triage
>         plan). Approving as-is means **no mechanical work lands after the review**, which was the
>         whole risk of doing it the other way round.
> - [x] ✅ **3. The release note — DONE, re-read WITH Thomas line by line** _(2026-08-22 evening)_.
>       Title unchanged (**`v5.0.0 — The One Where Your Edits and Its Updates Finally Merge`**), same
>       seven bullets. What changed is the top, on nine successive corrections of his: an opening
>       section *What this release is about* led by a pull quote, the bullets **grouped by moment**
>       (update / ordinary conversation), a concrete example in each, the old freeze described as the
>       **deliberate protection it was**, the field measurement pushed back under the fold, and the
>       body unwrapped. **`CONVENTIONS.md` §11 was rewritten to carry all of it** (`a95f7f4`), so the
>       next note starts here instead of re-deriving it. → [`release-v5.0.0-note.md`](release-v5.0.0-note.md).
>       **Nothing is owed on this file** unless he wants another pass; it is ready to paste.
> - [ ] **4. ONE review, ONE merge, NO squash.** The repo allows all three merge styles, so **squash is
>       reachable by a mis-click** — the button must read *Create a merge commit* at the moment of
>       merging. History kept whole.
>       - 🔍 **4a — A TOOLED `/code-review` RUNS FIRST, and this is Thomas's call of 2026-08-22.** His
>         reason is the one that matters: *"pour une fois en plus on a tout programmé en mode loop"* —
>         this release was built by orchestrated subagents overnight, and **nothing outside the loop has
>         ever read the code**. Checked rather than recalled: **v3.2.1, v3.2.2, v3.3.0, v4.3.0 and
>         v4.4.0 each ran one before the merge**, and each found real defects (8 findings on v3.3.0, 6
>         on v4.4.0). **v5 would be the first release to skip it, and it is the largest.** The cloud
>         `ultra` attempt refused the branch on size; the local command has no such limit.
>       - 🔪 **Run it in THREE PASSES, by descending operational risk** — not in one shot on
>         `main...HEAD`, where 27 113 lines of plans would drown 7 000 lines of code:
>         **(A)** the unfreeze engine, `scripts/lib/engine-*.mjs` + `reconcile-brain.mjs`, i.e. the code
>         that **writes into brains that are already installed**; **(B)** the install and update path,
>         `installer.mjs`, the `update-engine` skill, `engine-manifest.json` and the release-cutting
>         tool; **(C)** the rest (other scripts, FR/EN templates, CI).
>       - 🧪 **Findings are fixed TEST-FIRST and the review is re-run on the fix**, as v3.3.0 did.
>       - 🔴 **IT RAN, on the WHOLE branch at `max` effort, and it came back with 15 findings**
>         _(2026-08-22, ~37 min)_. The three-pass slicing was not needed: it read the 7 257-line
>         production diff and the 16 260-line test diff in one go. **The findings and their triage are
>         in [`v5-code-review-triage-action.md`](v5-code-review-triage-action.md)** — that file owns
>         them, this one links to it and restates nothing. **One blocker, two silent-damage defects,
>         one locale regression that the release note does not mention.**
>       - 🛑 **And the honest limitation, recorded rather than glossed**: its ten parallel finder agents
>         never returned, so one reader performed all ten angles sequentially. The recall of this pass
>         is one reader's, which is an argument for the re-run after the fixes, not against the run.
>       - 📌 **This also answers, in the field, the question the mode plan deferred**: whether work built
>         by a subagent fan-out owes an independent review before it counts as finished. →
>         [`agent-orchestrated-release-mode-action.md`](agent-orchestrated-release-mode-action.md).
>       - [x] ✅ **THE CAMPAIGN IS CLOSED AT THREE PASSES — Thomas, 2026-08-23**, *"on close (ça a déjà
>         trop duré)"*. The instruction above ("re-run on the fix") **is satisfied and spent**: three
>         independent reads ran, the second on the first's repairs and the third on the second's, and
>         all 45 findings are discharged in the triage plan. A fourth was offered with its argument and
>         **declined**. The recommendation put to him was *close*, and the evidence behind it is the
>         mode plan's: the count held at 15 while the **stakes** thinned — this pass's fifteen were
>         mostly the measuring tools, the test corpus and the plans' own discipline, where the first
>         pass moved the update path itself. **No session may re-open this**, offer a pass, or read the
>         flat count as a reason to. _(He is the only one who could launch one anyway: `/code-review`
>         is user-triggered and billed.)_
> - [ ] **5. The `engineVersion` bump, IN THE SAME MOVEMENT AS THE TAG** — never before it (a bumped
>       version that is not published makes a fresh install stamp itself with a version that was never
>       released). `rag` and `local-mirror` **unchanged** (0 files moved), `constitutionTemplate`
>       **1.3.0 → 1.4.0**, `scripts` **1.13.1 → 1.14.0**. → § *S9-2b's materials* for the table and the
>       25-tag precedent.
>       - ✅ **All four numbers are settled**: three are dictated by the diff, and the fourth,
>         `scripts`, was **arbitrated by Thomas at `1.14.0`** on 2026-08-22 (the larger jump, à la
>         `v3.6.0`, was offered and declined). Nothing left to decide here, only to apply.
> - [ ] **6. Tag, publish.** What reaches the fleet is the **TAG** (`releasesAhead` compares published
>       semver tags); merging to `main` publishes nothing, there is no release workflow.
>
> **Not part of the cut, on purpose**: **#61, #67 and #64 stay OPEN** — what closes them is a brain
> *receiving* the rule, not the branch carrying it.
>
> ### ✅ DONE — a rehearsal on a COPY of a real brain, before the tag
>
> _(Offered 2026-08-22 when Thomas asked how to take the least operational risk. **It was built and
> run**: § *THE REHEARSAL* at the top of this file owns what it found, what it now is, and its green
> re-runs on copies of both brains. This box keeps only the ARGUMENT for it, which is durable.)_
>
> > 🛑 **This box said "PROPOSED, NOT DECIDED — he has not ruled on it" for a full day after the
> > rehearsal had run, found a release-blocking defect, been fixed and turned into a command.** Two
> > sections of the SAME file, one describing the thing as an open question and the other as delivered.
> > It is the exact failure `CONVENTIONS.md` §3bis names, in its second form: not a stale copy in
> > another file, but **a stale copy a few hundred lines from the live one**. A session reads STATE and
> > the section it is working, never the whole file — so a wrong status can sit in plain sight for as
> > long as nobody scrolls. The fix is not vigilance: it is that **a proposal is deleted or converted
> > the moment it is acted on**, in the same commit as the act.
>
> The most expensive net for a release that rewrites files inside brains people already use is **not** a
> code review: it is **replaying the real update on a copy of one of the owner's two real brains** (copy
> the folder, run the update against this branch, read what it did to the merge files). Everything
> measured on those brains so far was **read-only**, and the acceptance test S10-QA runs on fixtures. A
> rehearsal is the only trial that exercises the path the fleet will live, on content nobody authored
> for the test. **On a COPY**: nothing in this proposal touches an original.
>
> **W6's two bullets, both now closed:**
>
> - [x] ✅ **The S7-2 fingerprint freshness guard, the last Windows red. FIXED AND READ GREEN**
>       _(2026-08-22 · `3b6820b` the fix + `87e9be1` the mutation survivor's pole)_. It was never a
>       stale table: the guard **read the working tree**, git for Windows checks that tree out as CRLF,
>       and it compared those bytes to a table folded from LF blobs → all 23 merge rels at once.
>       - 🛑 **And the defect underneath was the CUTTING TOOL's, which is the half worth having.** The
>             generator folds the release being cut off the disk — the one tree not yet in git's object
>             store — so **cutting from a Windows clone would have written a CRLF table**: rows that
>             recognise bytes no brain holds, in an artefact that looks perfectly normal, leaving the
>             fleet frozen. Nothing prevented it. `deliveredSources` now folds what the installer
>             **writes** (`deliversAsLf`, the copy path's own oracle), and **both** the generator and
>             the guard go through it, so a wrong table and a green guard cannot coexist.
>       - 📐 **Checked, not assumed**: regenerating the table on macOS yields a **byte-identical**
>             artefact — a no-op where the checkout is LF, the fix where it is not. Test-first, the two
>             CRLF poles red on their assertions first; seven poles in all (the four EOL verdicts, both
>             locales read at their own source path, the regime gate, and the missing-map throw).
>             Scoped mutation **100 %**.
>       - 🪟 ✅ **READ ON GITHUB, NOT PREDICTED** _(run `32564338986` on `3b6820b`)_: the full PR matrix
>             is **7/7 green**, `windows-latest` on Node 22, 24 **and** 26, plus `Installer e2e ·
>             windows-latest`. The run before it (`32563919034` on `b279144`) was red on all three
>             Windows cells with this one assertion, macOS green. **Zero Windows reds remain.**
>       - 🛑 **The first mutation pass measured NOTHING, and the tool made it look like a 100 %.**
>             `mutate-one.mjs` builds its worktree at **HEAD**, so with the work still uncommitted it
>             mutated the OLD file and scored 8 killed over lines that were someone else's code. Caught
>             by reading the reset sha in its own output. Re-run after committing: 80 %, one survivor,
>             then 100 %. **Committing first is not hygiene here, it is what makes the score real** —
>             the same class of "a score that was never measured" the runner exists to prevent
>             (`e2036be`, the bare line number), on a path it does not guard.
> - [ ] **The three skipped tests.** The suite reports **3 skipped, all Windows-only**. Read what they
>       skip and say **in writing** whether any of them is part of what W1/W2 are supposed to prove. A
>       green suite with an unread skip list is not the full claim.
>
> ⚠️ **Do not "take the next entry" past W4.** The queue's remaining entries are the owner's, and a loop
> that helps itself to them is the failure this plan has already recorded twice on other surfaces.
>
> ✅ **W2's Windows proof is IN, read not predicted** _(2026-08-22, run `32560532878` on `dacbf59`,
> job `Installer e2e · windows-latest`)_: **"316 delivered text files are LF — the copy path holds on
> Windows"**, and the positive control with it, *"run-node.cmd is still CRLF"*. The count floor did
> its job: 316 is not "found nothing to look at".
>
> - [x] 🛑 **And the proof was missing its own PREMISE, which is W1's lesson one level up** _(`9b5fbec`)_.
>       The step's green only means something if **that checkout is CRLF** — written as a *comment*
>       above the step, i.e. reasoning. Flip `core.autocrlf` on a future runner image and every
>       assertion keeps passing while the normalisation is a no-op: a vacuous green looks exactly like
>       a real one. The premise is now **measured in the same job** (`git ls-files --eol` must report
>       `w/crlf`) and fails loudly naming the vacuity. **A proof carries its premise, or it is not one.**
>
> ✅ **THAT READ IS DONE** _(2026-08-22, run `32562505730` on `1f1a57e`)_: the premise guard printed
> **`the launcher checkout IS CRLF here (… w/crlf …)`**, then the 316 LF files and the positive
> control. **W2 is closed on Windows, premise included.** And the run says one more thing worth
> recording: **exactly one Windows red remains, still the S7-2 harness artifact** — W3 changed the QA
> harness, so this is the check that it introduced no Windows regression, rather than an assumption
> that it could not have.
>
> **Both of W2's opening reads were DONE** _(2026-08-22, run `32558912124`, the full PR matrix on
> `621d1cb`)_:
>
> - [x] **The reshaped premise guard is GREEN on Windows.** W1's new pole no longer appears in any
>       failure list, on Node 22, 24 or 26. → § *W6*.
> - [x] **Exactly ONE Windows red remains, and it is the harness artifact** — *"the table covers every
>       merge file of the release being cut, in every locale"*, 23 rels unrecognised. **Not the
>       product.** macOS is green on all three Node versions, and so is `Installer e2e · windows-latest`.
>       Do not fold it into W2: W2 is the **delivery** pin, this is the **release-cutting tool**.
>
> - [x] ✅ **W1 — S7-6, the CRLF ancestor fetch (answer 1, half a). BUILT** _(2026-08-22 · `65a6080`
>       fix + `13ef852` the mutation survivor's test)_. Test-first, the four named poles red on their
>       assertions before a line of code, 22 tests in all. Suite **2 446 / 2 443 pass / 0 fail / 3
>       skipped**; scoped mutation 100 % on all three seams. → § *The DESIGN for (a)*, whose boxes now
>       carry what the build changed about it.
>       - 🛑 **THREE seams, not two**, and the second correction in this box's history came from the
>         same cause as the first: `verifyBase` was the wrong function to ask on the candidate path
>         because it **forgives** EOL, and the answer there has to BE bytes. Found by writing the test,
>         not by reading the code. **Naming a defect precisely is still not having enumerated where it
>         lives** — third time on this subject, and each time the missing seam appeared the moment
>         something was RUN.
>       - [x] 🪟 ✅ **W6 HAS SAID SO, for W1's part** _(2026-08-22, run `32558375080` read on
>         `13ef852`)_: the three QA poles are **green on `windows-latest`**. W6 itself stays open —
>         one Windows red remains, the harness artifact, and it is a separate bullet there.
> - [x] ✅ **W2 — pin the line endings at delivery (answer 1, half b). BUILT** _(2026-08-22 · `dd08024`
>       + `a5b8c2a` + the boundary test)_. Test-first; full suite **2 460 / 0 fail**.
>       - [x] **The updater's clone: `-c core.autocrlf=false` on `buildCloneArgs`** — the one flag the
>             plan promised. **Mutation 100 %** (9 killed). It pins `core.autocrlf` and nothing else,
>             deliberately: an explicit `eol=` attribute is a **different mechanism and it wins**, so
>             `.gitattributes`' `*.cmd text eol=crlf` still yields the CRLF batch files Windows needs.
>             A test asserts the argv carries exactly one `-c` and never touches `core.eol`.
>       - [x] 🛑 **The installer was NOT a flag, and this line used to say it was.** The installer
>             **clones nothing** — it copies the launcher's WORKING TREE. So the fix is to deliver what
>             the **object store** holds: `git ls-files --eol` reports per file the form the index holds
>             and the `.gitattributes` verdict, and `deliversAsLf` normalises exactly the files git
>             stores as LF. **Git answers on the launcher's own rules; nothing guesses from a file
>             extension.** Mutation **92.59 %**, 2 named equivalents _(→ `mutation/RESULTS.md`)_.
>       - [x] 📏 **Measured before designing, and it is what made the slice small** _(2026-08-22)_: the
>             launcher tracks **840 `i/lf`, 30 `i/-text`, 2 `i/none`, and NOT ONE file with an `eol=`
>             attribute**. `.gitattributes`' `*.cmd` / `*.sh` rules exist for the launchers a **brain
>             generates**, not for anything copied — the file's own comment says so. The guard for
>             `eol=crlf` is still written and tested, because the day one is tracked the failure is a
>             Windows user's launcher.
>       - [x] 🏃 **Run as a PROCESS, not merely imported** (the entry-point seam rule): a real install
>             into a temp dir delivered **247 engine files with zero CR**, the PNG **byte-identical**,
>             and the generated `run-node.cmd` still CRLF — that one is written by `buildNodeRunnerCmd`
>             and never copied, which is precisely why the copy loop must not be what protects it.
>       - [x] ✅ 🪟 **Its Windows proof is IN, and a macOS run could not have given it** _(2026-08-22,
>             run `32560532878`, job `Installer e2e · windows-latest`)_: **"316 delivered text files are
>             LF — the copy path holds on Windows"**, plus the positive control *"run-node.cmd is still
>             CRLF"*. The floor on the count is what makes 316 mean something rather than *"found
>             nothing to look at"*.
>             - [x] ✅ **Its premise is measured too, and IT HAS NOW RUN** _(2026-08-22, run
>                   `32562505730` on `1f1a57e`)_: **`the launcher checkout IS CRLF here (i/lf w/crlf
>                   attr/ scripts/lib/engine-base.mjs)`**. The proof and its premise are both read from
>                   a real runner, so W2 is closed on the platform it was built for. —
>                   `git ls-files --eol` must report `w/crlf` in that same job, or the step fails
>                   naming the vacuity. Without it, a runner image that flips `core.autocrlf` turns the
>                   whole proof into a no-op that still reports green.
>       - 🧪 **No mutation on `installer.mjs`'s five wiring lines, and the skip is stated**: it sits
>             **outside `scripts/`**, which `mutate-one.mjs` refuses by construction — a pre-existing
>             structural limit, not a choice made here. What it wires is pure and measured; what it does
>             is covered by running the installer, which is what the entry-point rule asks for anyway.
> - [x] ✅ **W3 — regimes → (a) (answer 4). BUILT, note clause included** _(2026-08-22 · `df09f17`
>       the change + `ea85b07` the survivor's test)_. Test-first: four unit poles red on their own
>       assertions behind an explicit stub, then the outside-in pole on the real v3.6.0 fixture red on
>       `deepEqual(regimes)`. Suite **2 474 / 0 fail / 3 skipped**. Scoped mutation **100 % on the
>       changed lines** — `engine-source.mjs` 89.47 % → **94.74 %** with all four survivors on
>       `advanceRegimes` killed, and `update-engine.mjs:686-690` **100 %**; the four survivors left in
>       the file are pre-existing and named. → § *THOMAS'S CALL — a brain keeps its INSTALL-DAY regime
>       list*, whose option (a) box now carries what the build changed about it.
>       - [x] **The note clause is written, and it replaced a lie rather than being added beside one.**
>             The note's *honest limits* still said *"a brain keeps its install-day list of which files
>             the engine manages"* — **W3 made that sentence false**, so the bullet became the widening
>             itself: after updating, the write guard asks about files it used to let through. The
>             *what was built* half states the advance in the owner's terms.
>       - [x] **The QA harness calls `advanceRegimes` instead of mirroring step 7.** Its comment used
>             to explain that it kept the install-day list **because the engine did** — a fidelity the
>             QA depended on. It must reproduce the field, not a preference, and a hand-copied mirror is
>             a fixture that lies the next time step 7 moves.
> - [x] ✅ **W4 — the note is RE-READ end to end and current** _(2026-08-22)_. Title, seven bullets and
>       W3's clause were already in; the re-read was for what the Windows repair had made stale, and it
>       found three things rather than the "nothing" the tick would have claimed:
>       - [x] **The note's own header still said the regimes line was *"not written yet"*.** W3 wrote
>             it. A draft box that describes the draft is exactly the copy that rots first.
>       - [x] **The suite figures were two releases of work old** — `2 423 / 2 420` → **`2 474 / 2 471`,
>             3 skipped**, re-counted rather than incremented.
>       - [x] **`Quality` said nothing about Windows, and that was the omission that mattered.** The
>             headline promise was **silently false there** on a suite green on a Mac, which is Thomas's
>             W6 argument in one sentence and belongs in the note, not only in a plan. Added with what
>             makes it trustworthy: the check **fails rather than passing quietly** when the machine
>             cannot reproduce the condition.
>       - 📐 **What was checked and did NOT move**: the heal table's **82 byte-states** (counted from
>             `engine-fingerprints.json`, not recalled) and the retirement of `tdd-discipline` with
>             `test-first-discipline` beside it (read from the shipped manifest).
> - [ ] **W5 — HIS, not the loop's**: retarget #76 to `main`, one review over the whole branch, **one
>       merge commit, never a squash**, then cut / tag / publish. → answer 5, and § *S9-2b's materials*.
> - [x] ✅ **W5b — ARBITRATED 2026-08-22: the four texts ship AS WRITTEN, not one word changed.** His
>       verdict, after being shown all four verbatim with the field defect each one exists for:
>       *"les 4 me vont"*. Four text changes to `CLAUDE.engine.md` (#61, #67, #64's rule half, and the
>       source-first rule), **written, placed and guarded** — the mechanism was the loop's, the
>       sentences were his. **The guards assert patterns, not prose**, so this was never something the
>       suite could have settled for him. → the doctrine-cargo block further down,
>       and [`field-finding-2026-08-08-source-first-and-frozen-doctrine.md`](field-finding-2026-08-08-source-first-and-frozen-doctrine.md)
>       for the fourth.
>       - 🛑 **Why it is written here at all**: the five-question round of 2026-08-22 closed the
>         § *WAITING ON THOMAS* list, and the session then said out loud *"nothing on this release is
>         blocked on him any more"*. **That was false**, and the `plan-carrier-guard` hook is what broke
>         it open — by naming a carrier the session had not opened, whose own header had said for a day
>         that the wording was his. **A list that closes is not the same as an inventory that empties**,
>         which is the exact lesson this plan already recorded twice, on other surfaces.
>
> > ### 🪟 W6 — ✅ **DISCHARGED** _(2026-08-22)_ — the standing proof Thomas asked for: real Windows, on GitHub CI, at the END
> >
> > His words, 2026-08-22: *"j'aimerais que tu t'assures avec des vrais tests concrets sur Windows, sur
> > GitHub, à la fin, sur la CI"*. **This is an acceptance condition on the release, not a slice**: the
> > Windows repair is not done because tests pass on a Mac.
> >
> > ✅ **It is met: run `32564444179` on `87e9be1`, the full PR matrix 7/7** — `windows-latest` on Node
> > 22, 24 and 26 plus the installer e2e, **zero failures**, and the skip list read on both platforms
> > rather than counted on one. Every box below is ticked; what remains on this release is the owner's.
> >
> > - [x] 📐 **The runner already exists, checked rather than assumed** _(2026-08-22)_.
> >       `.github/workflows/ci.yml` runs **`windows-latest` twice**: a *Windows tripwire · harness* job
> >       on every branch push, and the full `macos-latest` × `windows-latest` matrix on pull requests.
> >       **So nothing has to be built to get a real Windows image** — the question is only whether the
> >       tests we point at it genuinely exercise the CRLF path.
> > - [x] ✅ **W1 IS PROVED ON A REAL WINDOWS RUNNER — read, not predicted** _(2026-08-22, run
> >       `32558375080`, `Node 24 · windows-latest`, on `13ef852`)_. The three QA poles that were the
> >       defect are **green there**: *"a skill edited BEFORE this release now ACQUIRES its ancestor"*
> >       ✔ 846 ms, *"a customized skill now MERGES"* ✔ 1 467 ms, and the FR/clash pole with them. **The
> >       Windows red went from four failures to two**, and neither remaining one is the product.
> >       - 🧭 **Why the LF pole is the real Windows proof, and this is the part worth keeping.** On a
> >         Windows runner git checks the fixture out as **CRLF**, so the brain records a CRLF digest
> >         and the table holds LF rows — the pole *"edited BEFORE this release"* therefore takes the
> >         **candidate path** without asking to. **The platform builds the defect for free**; no
> >         fixture had to arrange it.
> > - [x] 🪟 **AND W6 CAUGHT SOMETHING A MAC NEVER COULD, first time out** _(2026-08-22)_. The new
> >       Windows QA pole itself failed there, on its own **premise guard**: it read `notEqual(crlf
> >       digest, lf digest)`, which is true on macOS and **false on Windows**, where the checkout is
> >       already CRLF so `crlfify` is a no-op and the two digests are one. Reshaped to assert the
> >       **bytes** (`/\r\n/` in the brain) instead of a difference between two spellings.
> >       - 🛑 **The lesson, and it is exactly Thomas's argument for W6**: a guard written on the
> >         platform that does not have the defect can be **green for a reason that does not exist**
> >         elsewhere. The test was correct about the product and wrong about the world.
> >       - [x] ✅ **The reshaped guard is GREEN ON WINDOWS** _(2026-08-22, run `32558912124`, the full
> >         PR matrix on `621d1cb`, Node 22 / 24 / 26)_. **W1 is now proved end to end on the platform**:
> >         its own pole and the three it repairs.
> > - [x] ✅ **THE LAST WINDOWS RED IS CLOSED, and it was not the bug it looked like** _(2026-08-22 ·
> >       `3b6820b` + `87e9be1`)_. The guard failed with **23 rels unrecognised** — every `merge` file at
> >       once, the signature of a whole-tree EOL difference — because it **read the working tree**,
> >       which git checks out as CRLF there. The table was fine; the reading was wrong.
> >       - 🛑 **What that red was really pointing at is a MAINTAINER's defect, not a test's**: the
> >             release-cutting tool folds the release being cut off the same disk, so **a release cut
> >             from a Windows clone would have shipped a CRLF fingerprint table** — every row a digest
> >             no brain can hold, and the fleet stays frozen with nothing to see. Both the generator
> >             and the guard now fold through `deliveredSources`, i.e. through `deliversAsLf`, the
> >             installer's own copy oracle. → the box at the top of this file holds the detail.
> >       - 🪟 ✅ **Read on GitHub, not predicted** _(run `32564338986` on `3b6820b`)_: **7/7, the full
> >             PR matrix**, Windows on Node 22/24/26 and the installer e2e. The run on the parent
> >             commit (`32563919034`) was red on all three Windows cells with exactly this assertion.
> >             **And re-read on the head that actually carries the code** _(run `32564444179` on
> >             `87e9be1`, the mutation follow-up)_: **7/7 again**. A green read on a commit that is no
> >             longer the head proves the fix, not the branch.
> > - [x] **Verify on GitHub, by reading the run** — not by predicting it from a local pass. The branch
> >       is pushed at every slice, so the tripwire reports on each push; the full matrix needs the PR.
> >       _(Done throughout W1..W6; the closing read is `32564338986`, 7/7.)_
> > - [x] ✅ **A green Windows suite is NOT yet the full claim — THE SKIP LIST IS NOW READ** _(2026-08-22,
> >       from the logs of run `32564444179`, jobs `Node 24 · windows-latest` and `Node 24 ·
> >       macos-latest`)_. **No test in the harness suite skips on both platforms**, and that is the
> >       claim worth having — it was assumed, and it is now measured.
> >       - 🛑 **"3 skipped, all Windows-only" was the LOCAL number, and it was wrong twice over.** On a
> >             developer Mac with `rag/node_modules` already installed the suite says **3**; the macOS
> >             runner says **9** and the Windows runner says **11**. The figure this plan repeated came
> >             from the one machine that has the fewest.
> >       - ✅ **The three that skip locally RUN AND PASS on `windows-latest`** — read, not inferred:
> >             *"rag/launch.cmd is parsed cleanly by cmd.exe, byte offsets and all"* ✔ 6 925 ms,
> >             *"local-mirror/launch.cmd …"* ✔ 214 ms, *"win32 hook command actually runs the script
> >             under Git Bash AND PowerShell"* ✔ 2 797 ms. They are the platform mirror of the four
> >             POSIX launcher tests that skip on Windows, not a hole.
> >       - ✅ **The six *"engine parser absent"* skips are re-run IN THE SAME JOB**, by the dedicated
> >             `Vault write-guard tests` step that runs after `npm ci` — **32 tests / 0 skipped on both
> >             platforms**, read on each. That step exists precisely because those four assertions once
> >             skipped everywhere for 67 commits, and the suite pins it from the inside.
> >       - ✅ **The eleventh is `readInstalledMergeFiles — the owner's notes are NOT read, proved by
> >             making them unreadable`**: POSIX permissions and a non-root user, so it runs on macOS.
> >       - 🎯 **AND THE ANSWER TO THE QUESTION ASKED: none of them belongs to W1 or W2 — but the
> >             near-miss is the part worth writing.** The two `.cmd` byte-offset tests look exactly like
> >             W2's subject (CRLF, Windows, cmd.exe re-seeking mid-token — the v4.8.1 field report that
> >             `deliversAsLf`'s `eol=crlf` carve-out names). **They are not.** `git ls-files` tracks
> >             **not one `.cmd` file**: all six launchers are in the `regenerate` regime, produced by
> >             `rag-launcher.mjs` at install, and the copy path W2 pins never touches them. So W2's
> >             carve-out guards a case that **does not exist in the launcher today** — which is what
> >             W2 measured when it found no `eol=` attribute anywhere — and these tests guard the
> >             GENERATOR's output bytes. **Neighbours in subject, disjoint in mechanism.** W1's seams
> >             have no skipped test at all.
> >       - 📐 **Checked while there, because it would have been a real defect**: the Windows e2e's
> >             positive control (*"run-node.cmd is still CRLF"*) also watches a **generated** file, so
> >             it cannot fail from an over-reaching copy. That is not a flaw — it is a control on the
> >             **detector** (`-match "\r"`), which is exactly what its own comment claims it is, and the
> >             copy path is proved by the 316-file assertion above it.
>
> **Why the loop may take W1 through W4**, checked against the mode plan's written list rather than
> felt: cutting, release-note tone, scope arbitration, merging and destructive acts need the owner.
> **Repairing a defect in unreleased code this branch already carries is none of those** — and option
> (d), *ship and state the limit*, which would have made W1 moot, was **explicitly rejected**.
>
> **After it: S9-2b — cut, tag, publish. HIS.** _(the doctrine cargo is COMPLETE, 2026-08-22)_
>
> ✅ **All three doctrine items are delivered** — #61 `b590738`, #67 `b2bb910`, #64's rule half
> `8ff14cf` — plus the source-first rule `5729282` that the same sweep uncovered. **Four text changes
> to `CLAUDE.engine.md`, the very file this release unfreezes**, which is what the owner's 2026-08-15
> arbitration was after: shipping them inside it is the proof by example that the carrier works.
>
> 🚦 **What is left is his, and this time the claim is checked against all three surfaces**: this
> plan's slices (S9-2b, S9-3), the ROADMAP's open rows, **and the scheduled open issues** — the third
> surface being the one that was missed, twice, before a hook named it.
>
> - **#61, #67 and #64 stay OPEN**: they are reports from deployed brains, and what closes them is a
>   brain **receiving** the rule, not the branch carrying it. Closing them at merge would be the same
>   *"delivered to a branch"* error the source-first plan's header warns about.
> - **Deferred with their reasons, not forgotten**: #64's `PreToolUse(Read)` hook (his arbitration —
>   and a test now asserts the rule does not announce it), and #67's optional part 3 (allowlist and
>   auto permission mode in the setup docs — user-facing text carrying a prompt-injection trade-off).
>
> 🛑 **Found 2026-08-22 by the `plan-carrier-guard` Stop hook**, which named the archived plan as a
> carrier the session had not opened. That plan holds the arbitration verbatim _(owner, 2026-08-15)_:
> this release **carries the doctrine cargo waiting in the issue tracker** — **#61**, **#67**, **#64's
> rule half** — ***alongside*** the already-planned source-first rule. **All three are still OPEN.** The
> loop built the fourth and reported the release complete bar the owner's steps. It was not.
>
> - [x] ✅ **#61 — announce a signal-triggered ritual before running it** _(2026-08-22 · `b590738`)_.
>       Ending a session triggered the *Observation passive* ritual, which ran silently: several seconds
>       of unexplained pause at the moment an immediate answer was expected. The work was useful, the
>       silence was not. **Stated once and generally** (`### Announce before acting on a signal`,
>       `### Annonce avant d'agir sur un signal`), **placed above BOTH its instances** — a general rule
>       read after them is read too late — and the ritual that caused it now carries a one-line announce
>       that **points at** the rule instead of restating it. 20 assertions in
>       `scripts/lib/signal-announce-discipline.test.mjs`.
>       - 🧭 **Why it added no new concept, and that was the reporter's own argument**: the engine
>         already demanded exactly this one section earlier, for the background sync (*"you simply
>         ANNOUNCE it in one line"*). The ritual was written without the clause. **An internal
>         inconsistency, not a missing feature** — so the fix generalises the rule that was already
>         there rather than inventing a second one.
>       - 🚫 **Not a hook, deliberately**: a hook cannot write the sentence. The issue says so, and it
>         is the same family as this repo's other writing conventions.
>       - **The issue stays OPEN until the release ships** — it is a report from a deployed brain, and
>         what closes it is the brain receiving the rule, not the branch carrying it.
> - [x] ✅ **#67 — the Outillage rule becomes conditional and self-describing** _(2026-08-22 · `b2bb910`)_.
>       *"Never Bash to probe the vault"* rested on a rationale true of one surface in one permission
>       mode. The rule now names **both** — surface and mode — and states the fallback: **a native tool
>       unavailable means the Bash equivalent is EXPECTED, not a defect, and there is nothing to report
>       about it.** 22 assertions in `scripts/lib/tooling-rule-conditional.test.mjs`.
>       - 🚨 **What the absolute actually cost, and it is the part worth keeping**: a session in auto
>         mode, with the native `Grep` absent, read its own constitution as self-contradictory and
>         **filed a friction item asking its owner to arbitrate** — an arbitration that was never
>         theirs, since the rule lives in the engine layer owners are told not to edit. **A rule that
>         states a local constraint as universal does not merely misinform: it manufactures work for
>         the person it was meant to serve.**
>       - 🧭 **The absolute had to leave the TITLE, not just the body**, and a test pins that. The
>         heading is what a scanning reader carries away; a body qualifying a title nobody re-reads has
>         fixed nothing. **Third slice in a row where placement or framing, not presence, was the
>         assertion that mattered.**
>       - **Second half: a separation, not a rule.** Two tables read as one — **Routing** is about
>         *correctness* and holds in every environment, **Outillage** is about *ergonomics* and is
>         environment-dependent. Reading the `❌ grep` cell as *"never run an exact search"* collides
>         head-on with Routing. It has teeth: an **absence** claim can only rest on an exhaustive exact
>         search, since a top-N by similarity **cannot prove a negative** — pointed at the *Claim
>         discipline* rather than restated.
>       - [ ] 🚧 **NOT taken, deliberately — the issue's optional part 3**: offering the two real
>             prompt-fatigue remedies in the setup docs (a read-only allowlist; auto mode as an
>             *informed* choice). Two reasons: the arbitration named *"the rule becomes conditional and
>             self-describing"*, and part 3 is **user-facing documentation carrying a security
>             trade-off** — a second brain ingests third-party content, which is the prompt-injection
>             surface, so recommending auto mode removes the last human gate exactly where it matters.
>             The issue spells that caveat out; it is a doc slice with your voice on it, not this one.
>       - **The issue stays OPEN until the release ships**, same reason as #61.
> - [x] ✅ **#64's RULE half only** — size-guarded delegation with an **objective threshold**
>       _(2026-08-22 · `8ff14cf`)_. Consultation reads go to a sub-agent past **~1 500 lines or ~60 KB**,
>       whichever comes first. 24 assertions in `scripts/lib/delegation-threshold.test.mjs`.
>       - 🧭 **The guidance was not missing, it was ADVISORY** — *"a large document"*, *"reasonable
>         size"*, no number. **A rule with no number is remembered when there is room to spare and
>         forgotten when there is not**, because judging *"large"* costs attention a loaded context no
>         longer has. That is why the fix is a threshold and not another paragraph.
>       - 🛑 **A number is only safe to state with its exceptions in the same breath**, and a test pins
>         that they FOLLOW it rather than living elsewhere: a file about to be **edited** is read
>         directly whatever its size (a mechanism, not a preference — `Edit` requires a prior `Read` in
>         this context), and so is content to be quoted **verbatim**. That is the issue's own non-goal.
>       - **Part 3 delivered too**, as a rule since nothing can read intent: loading a big skill for
>         three facts is the same disease, and it was the actual trigger in the observed session.
>       - [ ] ⚠️ **The hook half stays in the backlog**, by the owner's own words — and the guard
>             **asserts its absence** (`doesNotMatch(/PreToolUse/)`). A doc guard is exactly where
>             undecided scope quietly becomes shipped scope, so the line is held by a test rather than
>             by memory.
>       - **The issue stays OPEN**: two of its four acceptance criteria are met, the hook is deferred,
>         and the fourth (*existing brains pick this up through a regular update*) is what the release
>         itself delivers.
>
> **Why they belong here and not in a later release**, in the arbitration's own words: they are text
> changes to `CLAUDE.engine.md`, *the very file this release unfreezes* — shipping them inside it is
> the proof by example that the carrier works.
>
> 🎙️ **The same split as the source-first rule**: the rule, its placement and its guard are the loop's;
> the **wording speaks in the owner's voice** and is his to arbitrate. Each lands in **both**
> constitutions in one commit (`locale-drift` sees to that), and each needs
> `engine-fingerprints.json` regenerated in the same commit — the S7-2 guard will say so if it is
> forgotten.
>
> ## S9-2b's materials — assembled, waiting on him
>
> ✅ **S9-2a — THE MATERIALS ARE READY** _(2026-08-22)_. **S9-2 split the way S9-1 did**: assembling
> what a release needs is checkable work; deciding to publish is not.
>
> **The PR body** — [`release-v5.0.0-pr-body.md`](release-v5.0.0-pr-body.md), beside this plan.
> #76's live body still describes **S1–S6 alone** and has been wrong since 2026-08-21 — the branch has
> since more than doubled. The new one covers S1 → S10, both fallen forbidden claims, how it was
> judged, and the two things to settle before a cut. **Written to a file rather than pushed**: editing
> a live PR is outward-facing and the loop does not take those alone. To apply it, from the repo root:
>
> ```bash
> sed '1,/^---$/d' maintainers/plans/prospective/release-v5.0.0-pr-body.md > /tmp/pr76.md
> gh pr edit 76 --title "v5.0.0 — the engine owns what it shipped, and stops leaving old brains behind" --body-file /tmp/pr76.md
> ```
>
> **The `engineVersion` bump — DERIVED, not applied** _(2026-08-22)_. It sat in the pre-flight as
> *"S9-2b's, his"*, and half of it turned out not to be a decision at all: **three of the four numbers
> are dictated by the diff, and the fourth is settled by 25 tags of precedent.** Assembling it is the
> same split S9-2a made — what a release needs is checkable, deciding to publish is not — so it is
> written here and **nothing is applied**: the manifest still reads v4.9.1's numbers.
>
> | component | at v4.9.1 | changed since | → | why |
> |---|---|---|---|---|
> | `rag` | `1.4.0` | **0 files** | **`1.4.0`** | not a call: nothing under `rag/` moved |
> | `local-mirror` | `0.3.0` | **0 files** | **`0.3.0`** | not a call: nothing under `local-mirror/` moved |
> | `constitutionTemplate` | `1.3.0` | 2 files, +214 / −20 | **`1.4.0`** | purely additive doctrine; the same minor step v4.5.0, v4.6.0 and v4.8.0 each took for the same reason |
> | `scripts` | `1.13.1` | 122 files, +17 346 / −797 | **`1.14.0`** | **25 new modules, 3 new entry points, 0 deletions, 0 renames** — nothing that worked stops working |
>
> - [x] 📐 **The precedent that removes the taste from the last row.** The vector was read at **all 25
>       published tags**: it has **NEVER used a major bump**, on any component, ever. Sharper still,
>       **`v4.0.0` moved not one of the four** — rag, mirror, constitution and scripts were byte-equal
>       to `v3.6.2`. **A Kenjaku major release implies nothing about this vector**; it tracks what
>       changed *inside a component*, and the release number is a separate story told elsewhere. So
>       `scripts → 2.0.0` would be a first in the project's history, for a change that removes nothing.
> - [x] 🎙️ **ANSWERED BY THOMAS — `scripts` goes `1.13.1 → 1.14.0`** _(2026-08-22, asked alone and
>       answered "ok pour ta reco")_. `v3.6.0` moved `scripts` **1.1.0 → 1.7.0**, six minors in one
>       release, so the vector *has* been used to signal scale; the larger jump was offered and **not**
>       taken. The table above stands as written. **The question is closed** — the number is no longer
>       a decision, only a value to apply with the tag (step 5 of the cut).
> - 🚫 **`indexSchemaVersion` stays `2`, and that is not a bump anyone may take**: it is the promise
>       *"nothing is re-read and nothing is re-encoded"* in the release note. Moving it would re-index
>       every deployed brain.
>
> **The pre-flight sweep — everything green, and two findings that are not red but are ORDER:**
>
> 🛑 **AND IT WAS STILL A LOCAL-ONLY SWEEP, twice.** Both runs read `node --test` on this machine and
> **never looked at CI** — which had been **red for the whole visible window** (dozens of runs, since
> 2026-08-21 22:32). A pre-flight that certifies a cut while the tripwire is red is worse than no
> pre-flight: it is a green light nobody earned. **Diagnosed 2026-08-22**, two independent causes, and
> the second is the serious one:
>
> - [x] **Shallow checkout — FIXED AND CONFIRMED BY CI** _(`86d8fad`)_. `actions/checkout@v4` defaults
>       to depth 1, no tags: `locale-drift` could not resolve a waived sha (`fatal: ambiguous argument
>       'f7a00fc'`) and the release fixtures could not rebuild brains from published tags (`fatal:
>       invalid object name 'v3.6.0'`). With `fetch-depth: 0`, **all of those failures are gone from the
>       next run** — the waived-sha test and both FR fixture poles now pass on Windows. The installer-e2e
>       job is left shallow on purpose: it runs the installer and touches no history.
>       🧭 **And clearing it is what made the real defect legible**: four failures had been hiding under
>       nine. A red light with two unrelated causes reads as one broken thing, which is part of why it
>       went unread for a day.
> - [x] 🛑 ~~**CRLF: the heal recognises nothing on Windows.**~~ **Wrong twice over, and both corrections
>       are recorded in the box at the top**: the heal was never affected, and the seam that was — the
>       ancestor FETCH — is **repaired by W1** _(2026-08-22 · `65a6080`)_. What is left is reading a
>       real Windows run (W6), not writing code.
>
> 🧭 **The rule this earns, beside "a pre-flight is a timestamp": a pre-flight that only reads the
> LOCAL suite is measuring the machine that wrote the code.** The tripwire exists because the local
> run cannot see the other platform — and it caught a real product defect the moment someone read it.
>
> ⏱️ **RE-RUN 2026-08-22 after the doctrine cargo landed** _(4 commits into `CLAUDE.engine.md`, both
> locales, the fingerprint table regenerated each time)_. **A pre-flight recorded once and never
> re-run is a copy of state** — the defect this release exists against — so the numbers below are a
> **timestamp, not a guarantee**, and the sweep is owed again at the cut. Superseded figures are kept
> beside the current ones rather than overwritten, so the drift is legible.
>
> - [x] Full suite **2 423 tests, 2 420 pass, 0 fail, 3 skipped** _(was 2 337/2 334 at S9-2a)_ — and the
>       three skips were checked, not assumed: all Windows-only (`cmd.exe` cannot parse a batch file on
>       macOS).
> - [x] The four release guards run clean on their own: **69 pass / 0 fail** across the fingerprint
>       table, `locale-drift`, manifest integrity and entry-point discipline. So the table IS current at
>       v5.0.0, the FR pairs ARE paired, every script a skill names IS carried and tracked.
>       🧭 **The count did not move, and that is right rather than suspicious**: those guards assert
>       *cases* (every merge file covered, every FR pair paired), not one case per edit — four more
>       edits to two already-covered files add no case. What would have moved it is a NEW file.
> - [x] **The table's shape, checked rather than trusted**: `generatedAt v5.0.0`, **15 files, 82
>       byte-states, 9 of them at v5.0.0**. The four doctrine commits each regenerated it, and the S7-2
>       freshness guard went red first on every one of them — the net fired four times out of four.
> - [x] Branch vs `main`: **259 ahead, 0 behind** _(was 248)_, and `git merge-tree` finds **no
>       conflict**. No rebase is owed. Against **#76's own base** (`chore/s0bis-entrypoint-mutation-debt`):
>       **205 commits, 165 files, +25 658 / −1 542**.
> - [x] **`indexSchemaVersion` is still `2`**, unchanged since v4.9.1 — which is what makes the release
>       note's *"nothing is re-read and nothing is re-encoded"* true. Checked, because that sentence is
>       a promise to every deployed brain.
> - [ ] 🛑 **THE MERGE ORDER IS UNSETTLED, and it is the one thing that would stall a cut.** #76's base
>       is `chore/s0bis-entrypoint-mutation-debt`, and **draft PR #75 is still OPEN**. Either #75 lands
>       first, or #76 is retargeted to `main`. Deliberate when it was set up (so #75 kept its S0bis
>       perimeter); it is a decision now, and it is his.
> - [ ] **The `engineVersion` bump is now DERIVED, ARBITRATED and waiting to be applied**, not an open
>       question: the four numbers and what dictates each are in the table under § *S9-2b's materials*
>       above, and the only one that was ever a call was answered there on 2026-08-22. No copy here on
>       purpose — the manifest still reads v4.9.1's.
>
> 🚦 **After this, the loop has nothing left it may take alone on this release.** S9-2b is his, S9-3
> needs days of real use, and the arbitration above is his. That is a sentence about THIS release, not
> an instruction to stop.
>
> ⚠️ **And it was wrong within the hour** _(2026-08-22, `5729282`)_. The loop took the sentence
> literally — *on this release* — and went looking at the repo's other open plans, which is what the
> mode's contract tells it to do. It found **an unbuilt slice that had been arbitrated INTO this very
> release** two weeks earlier: the **source-first rule**, S1 of
> [`field-finding-2026-08-08-source-first-and-frozen-doctrine.md`](field-finding-2026-08-08-source-first-and-frozen-doctrine.md),
> whose own S4 box reads *"it ships with the unfreeze release"*. It is now written into both
> constitutions and guarded, and it appears in the PR body and the release note.
>
> **The lesson is not that the sentence was sloppy, it is that THIS PLAN IS NOT THE RELEASE'S
> INVENTORY.** A release's cargo can be decided in a plan this one never names. *"Nothing left"*,
> asserted from inside one plan, is only ever a claim about that plan. That plan still owns its own
> state; this box keeps no copy of it.
>
> 🛑 **And the ROADMAP was not the inventory either — the same claim failed twice in one iteration.**
> Having been caught once, the loop said *"before the cut, the inventory is the ROADMAP's open rows"*
> and handed back on it. The Stop hook then named the archived plan, which holds **three more doctrine
> items the owner arbitrated into this release** — and they live as **GitHub issues**, so **no ROADMAP
> row names them at all**. They are now the resume point at the top of this file.
>
> **The inventory is: this plan's slices + the ROADMAP's open rows + the SCHEDULED OPEN ISSUES.** The
> ROADMAP already says so, in its *Incoming (standing inbox)* section — *"check the open issues when
> picking up work; an issue graduates to a rider on a plan when it is scheduled"* — a section added on
> 2026-08-15 for this exact failure, when five issues sat invisible to a pickup. **The rule existed and
> did not run**: the map above it is what a pickup reads, and these three had been scheduled for a week
> without ever graduating to a rider. Writing them into this plan's resume box **is** that graduation.
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
> line; and `engineVersion` is still at v4.9.1's numbers, because applying the bump is S9-2b's, his
> step. _(Its four values are now derived — § S9-2b's materials owns them; nothing is copied here.)_
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
  - [x] ✅ **S7-6 — the CRLF ancestor fetch (= W1).** _(2026-08-22 · `65a6080` + `13ef852` · 22 tests,
        scoped mutation 100 % on all three seams)_ On a miss the planner **nominates** the rel's rows
        instead of giving up, and the fetch proves which one is the record by digesting its CRLF form,
        then writes that form — the base must hold **what was delivered to that brain**. An LF brain
        takes the hit path unchanged. § *The DESIGN for (a)* owns the detail and what the build changed
        about it; nothing is copied here.
        - [ ] 🪟 **W6 still owes the proof on a real `windows-latest` run.** On macOS the CRLF is
              synthesised by the fixture, so a local pass is not the acceptance condition Thomas set.
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
  - [x] **S9-2a — the release materials.** _(2026-08-22)_ `release-v5.0.0-pr-body.md` beside this plan
        (#76's live body still describes S1-S6 alone), plus a pre-flight sweep: suite 2 337/2 334, the
        four release guards 69/69, branch 248 ahead of `main` and 0 behind with no merge conflict.
  - [ ] ▶️ **NEXT — S9-2b — cut, tag, publish.** Owner's, always. Carries **applying** the
        `engineVersion` bump (its four values are derived and waiting — § *S9-2b's materials*), the
        title he picks, and **the merge-order decision**: #76 is based on the S0bis branch and draft
        PR #75 is still open, so either #75 lands first or #76 is retargeted to `main`.
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
  - [x] **S7-5-3 — the wiring + the one report line** _(2026-08-21 · `fa0f5be`)_. 🔍 **This box was
        found UNTICKED on 2026-08-22, while migrating this plan to the STATE-block convention, and it
        was ticked only after checking the code rather than the plan**: `reconcile-brain.mjs:43/144`
        calls `fetchAncestors` with no caller-side gate (S7-5-2's rule honoured — the guard stayed
        inside the shell), and `update-engine.mjs:383` carries the *"could not reach the update
        server"* line, pinned by two tests including its silent case.
        🎯 **This is the convention's own thesis caught in the act**: the box said one thing, four
        prose headers said another, and the code said a third. A resume header that has to be
        re-written every session is a header nobody re-reads to the bottom.
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
- [x] **S9-2a — the release materials** _(2026-08-22)_: the PR body for #76 rewritten to cover S1 → S10
      ([`release-v5.0.0-pr-body.md`](release-v5.0.0-pr-body.md), with the `gh pr edit` command in the
      header — the loop writes the file, it does not edit a live PR), plus a green pre-flight sweep.
  - [x] **The sweep's one non-green finding is an ORDER, not a defect**: #76's base is the S0bis branch
        and draft PR #75 is still open. Either #75 lands first, or #76 is retargeted to `main`.
- [ ] ▶️ **NEXT — S9-2b — cut, tag, publish.** The owner's, always. **Deciding to publish is not
      delegable**, and that is the line the S9-1 / S9-2 splits both draw.
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
