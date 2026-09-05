<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- THE canonical plan for what is still OPEN on v5.1.0. Opened 2026-09-05,  -->
<!-- deliberately SMALL: the two plans that carried this release to here are  -->
<!-- ~2100 lines between them, all of it closed, and re-opening them at every -->
<!-- resume spends context on history. This file owns the live state; they    -->
<!-- keep the reasoning. Branch: `feat/live-remote-sync`.                     -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Action plan — what a duo owes the person whose brain it is, then the release is cut

Opened at the owner's suggestion, 2026-09-05: *"est-ce que ça ne vaudrait pas le coup d'archiver le
plan de tout ce que tu as déjà fait, et de partir sur un nouveau mini-plan ?"* Yes, and this is it.

## 📍 STATE — the only perishable block in this file · opened 2026-09-05

- ✅ **9.0 THROUGH 9.4 ARE DONE, GREEN AND PUSHED, CI READ AND GREEN ON EVERY COMMIT** _(2026-09-05)_
  — the whole suite (3157 tests) and the duo rehearsal (16/16) pass on each. **ONLY 9.5 REMAINS.**
- ✅ **9.5 BATCH A HAS RUN** _(2026-09-05 10:52, 61 min, log
  `reports/mutate-one-author-identities+1.log`)_: **92.83 %**, 414 killed, **32 survived**, 0 timeout.
  Per file: `author-identities.mjs` **95.28 %** (10 survivors), `brain-author.mjs` **90.60 %** (22).
  Step 8.8 had left these two at 98.66 % and 98.90 %, so **the drop is step 9's own new code**, which
  is what a hunk-scoped reading would have said too.
- ✅ **BATCH A'S SURVIVORS ARE ANSWERED IN TESTS, GREEN** _(2026-09-05, 8 new tests, whole suite
  3165 pass / 0 fail / 3 pre-existing skips)_. **The final split, after reading each mutant against
  the code, is 22 killable and 10 equivalent** — not the 25/7 of the first skim: the three optional
  chainings inside `brain-author`'s `spellingsOf` (255:16, 255:47, 255:73) are unreachable, because
  `unendorsedFusions` only ever returns entries whose `aka` is a non-empty array, and `194:47` is
  unreachable for the same reason at both its call sites. **They are equivalents, and the honest
  simplification is to DELETE those guards** — not done here, deliberately: it changes production on a
  held release for three mutants. Left as a named candidate for the next pass.
- ✅ **BATCH A IS CONFIRMED AND CLOSED: 92.83 % → 97.98 %** _(2026-09-05 12:02, 61 min, on `b06991d`;
  437 killed, **9 survived**, 0 timeout. `author-identities.mjs` **98.11 %**, `brain-author.mjs`
  **97.86 %**)_. **The check the plan asked for passed**: 10 equivalents were named in writing before
  the run, nine came back, and **all nine are on that list** — no mutant escaped the new tests. The
  tenth, `brain-author` **70:56**, was **killed**: it had been filed as an equivalent and that reading
  was wrong. Recorded in `RESULTS.md` with the durable point (naming the expected survivors before the
  re-run is what makes the re-run a check that can fail).
- 🧳 **BATCH B's FIRST ATTEMPT SURVIVED THE TRIP AND IS STILL WORTHLESS — the runner said so itself**
  _(launched 12:03, returned **14:47** instead of ~13:05, because the laptop travelled in a bag in
  between)_. Verdict: **`❌ 58 of 163 mutants TIMED OUT (36 %) — the 96.32 % is starved CPU, not killed
  mutants`**. **Do not quote that 96.32 % anywhere.** Two things worth keeping from it:
  - **The prediction written here — "assume the run died, relaunch it" — was wrong**, and wrong in the
    comfortable direction: the process was alive the whole time. A sleeping machine does not kill a
    mutation run, it **starves** it, and a starved run comes back looking like a result. The check is
    never *"is the process still there"*: it is the runner's own ✅/❌ line, plus the wall-clock against
    the expected duration.
  - **This is exactly why `mutate-one.mjs` fails a run on its timeout ratio** rather than printing a
    score. Without that guard, 96.32 % goes into the register and nobody ever finds out.
- 🛑🛑 **~~STOP — THE INSTRUMENT IS BROKEN~~ — RESOLVED by removing the wait, kept for the WHY**
  _(2026-09-05 14:49, found because batch B's relaunch died in 1 min instead of running an hour)_.
  Stryker refused to start: **`There were failed tests in the initial test run`** — one test red out of
  3163, `session-universe.test.mjs:334`, *"the universe hook waits for the startup pull, and announces
  the universe that ARRIVED"*. Expected `blue-team`, got `acme`.
  - **It is not a flaky test to stabilise. The hook really does skip its barrier**, and a focused probe
    says exactly when. Handing the hook its payload on stdin **immediately** → barrier holds, announces
    `blue-team` (343 ms). Handing it **200 ms late** → announces `acme` in 258 ms. **500 ms late** →
    `acme` in 171 ms. It never waits at all: `readHookPayload` does `readFileSync(0)`, gets nothing
    because the payload has not landed yet, and `catch { return "" }` turns that into *"no session id"*
    — which `waitForStartupSync` reads as `unknown-session` and returns from instantly.
  - **Fail-open was chosen deliberately** (`startup-sync-gate.test.mjs:385`, *"an unreadable fd 0 is
    silence, never a thrown hook"*) and it is right for *run by hand at a terminal*. The hole is that
    **"the pipe has no data YET" is indistinguishable from "there is no payload"**, and the two deserve
    opposite answers.
  - **Both sides of the barrier read that same stdin**: `session-status.mjs:240` (the puller, which
    stamps the marker with the session id) and `session-universe.mjs:166` (the waiter). An empty read on
    **either** defeats the barrier.
  - **In production this is the exact defect the barrier exists to prevent**: announce the universe this
    machine went to sleep in, while every search of the session is scoped to the one that just arrived —
    one sphere's context, another's retrieval. Rare (it needs the harness's write to lose a race against
    a `node` boot), silent, and intermittent.
- ⚠️ **THEREFORE BATCH A's 97.98 % IS SUSPECT AND MUST BE RE-RUN.** Measured 2026-09-05, **8 concurrent
  full-suite runs: 1 failed** on this test. Every mutant re-runs the **whole** suite
  (`stryker.scripts.config.mjs`: `node --test "scripts/*.test.mjs" "scripts/lib/*.test.mjs"`,
  concurrency 5), and a mutant is killed when the suite **exits non-zero** — so an intermittent failure
  does not add noise, it adds **points**. This is the register's own durable rule, and the second time
  it has bitten: *"treat a suite that is not deterministic under load as a broken instrument, and fix it
  before believing any number it produced"*. Batch A's 92.83 % first pass is under the same doubt.
- 🔥 **A LAPTOP RAN AT 100 % FOR NINE HOURS, AND IT WAS OURS** _(2026-09-05 22:24, found by the owner
  from the symptom: *"mon mac était bouillant … dans mon sac à dos"*)_. **Fixed, `e34cbb8`.** The
  tick-gate race test (`remote-sync-gate.test.mjs`) starts four children that **spin** on `existsSync`
  until a `go` file appears. Interrupting a mutation run kills the parent, the file never appears, and
  each child burns a core **forever**. **60 were found alive**, in batches matching each interrupted
  run, the oldest at 9 h 30. The spin now carries a 30 s deadline and exits 2, a code no assertion
  accepts.
  - ↩️ **This rewrites an earlier entry below**: batch B's *"58 of 163 mutants timed out"* was blamed on
    the travelling laptop. **The likelier cause is these spinners**, which were eating the machine at
    the time. The lesson stands and gets sharper: a starved run looks like a result, and **`ps` is the
    first thing to look at when a run is slow** — not just for the runner, for what else is alive.
  - 🧹 **Before any measurement: check for orphans.** `ps aux | grep input-type=module`. A run started
    on a machine already at load 200 measures nothing.
- ✅✅ **THE OWNER'S CALL IS IN AND IT IS SHIPPED, 2026-09-05: *"enlève l'attente"*** _(green: whole
  suite 3180 pass / 0 fail / 3 pre-existing skips, duo rehearsal 16/16)_. All three halves landed in
  one commit, because shipping only the first would LOSE the information instead of delaying it:
  1. ✅ **The wait is gone.** `session-universe.mjs` no longer imports the gate at all: it announces
     what is on disk at once, and reads no stdin, so nothing about it can block a session start.
  2. ✅ **The correction rides the next message.** `universeArrivalDirective` (in
     `lib/remote-arrivals.mjs`) fires when `.vault-rag/active-universe` is among the arrived files,
     reads the pointer **through the validated reader** (an orphan pointer names the default scope,
     not a ghost), and **leads** the message. The pointer is also **lifted out of the file list**, or
     it would have been announced as *"1 other file"*, which tells the owner nothing.
  3. ✅ **The flake is gone with the barrier.** The old test is **deleted, not skipped**, and replaced
     by its opposite, **twice**: with the pull still *running* the hook must answer promptly, once
     with the payload handed over instantly (the case where the barrier really held — this one failed
     red before the change, at the 8 s kill) and once with a stdin nobody ever writes (which would
     catch any future "repair" that blocks on fd 0). **9.5 is unblocked.**
- ❓ **THE ONE THING THAT IS THE OWNER'S TO ANSWER, AND NOTHING IS BLOCKED ON IT.** A **second waiter**
  exists and was never part of his question: `session-engine-divergence.mjs:63` (`awaitStartupSync`,
  now the last caller of the barrier). Same shape, same tension with ADR 0028 — but the failure mode is
  different, and that is why it is not decided by analogy: a stale read there announces a **false**
  *"your engine is behind"* rather than a stale universe. Keep its wait, or remove it the same way?
  Recorded in the code itself (`startup-sync-gate.mjs`, both ⚠️ blocks) so the next reader meets the
  question where the wait is.
- 🛑🛑 **THE FIX WAS REVERTED, AND WHAT REPLACES IT IS A QUESTION FOR THE OWNER** _(2026-09-05,
  `162ec93`)_. Both repairs of the stdin race break something that outranks the race, and the
  constraint they break is **already written down**: **ADR 0028** — *"the check must **never slow
  session start**"*, plus his words today, *"ça doit démarrer vite, ça doit répondre vite … si on se
  trompe parce qu'on n'a pas d'informations fraîches, on se corrige une à deux minutes après, mais sans
  bloquer"*.
  - **`tty.isatty(0)`** asks the terminal question correctly and leaves fd 0 **blocking** — and a
    blocking read of a pipe nobody writes to waits for a close that may never come. **Measured: the
    suite went from ~50 s to over 10 minutes**, because tests spawn these hooks without writing their
    stdin. In production that shape is a **hung session start**, far worse than a stale announcement.
  - **Unblocking fd 0 deliberately + polling a 200 ms budget** stays fast and **still misses the
    payload** (probe: 200 ms late → stale universe announced anyway).
- ❗ **~~THE REAL SUBJECT IS THE BARRIER ITSELF~~ — ANSWERED AND SHIPPED, kept for the reasoning.**
  The call above is the answer to this block: announce-then-correct won. `waitForStartupSync`
  makes the universe hook **wait for the git pull to finish** before it reads which universe is active:
  grace 3 s, **ceiling 12 s**. That is a session start that blocks on the network, shipped in this
  release, and it is in direct tension with ADR 0028. **The race is only what happens when that wait is
  accidentally skipped** — fixing the race makes the blocking MORE reliable, which is the wrong
  direction if the wait should not exist.
  - **The alternative the ADR already models** (it is how the health check works): announce what is on
    disk **instantly**, let the pull land in the background, and **correct at the next message** — the
    live-sync announcement channel this release built is exactly that. Cost: for a few seconds the
    announced universe can be yesterday's. Benefit: no session start ever waits on a network call.
  - ✅ **His call, made the same day: drop it for announce-then-correct.** Shipped — see the block
    above. What is left of this question is the divergence hook alone.
  - 🧪 **A measurement he asked for and we do not have**: whether Claude **Desktop** hands the hook its
    payload the same way the CLI does. If Desktop is slower to write fd 0, the race is not rare there,
    it is the normal case. A probe hook that records what it received would answer it in one session —
    **not wired anywhere yet**, and it must not be installed into either of his real brains.
- ✅ **~~THE FLAKE IS BACK~~ — THE FLAKY TEST NO LONGER EXISTS.** It failed about 1 run in 8 under load
  (3 of 5 run alone on a busy machine) because it asserted the barrier held, and the barrier is gone.
  **Deleted, not stabilised and not skipped.** The instrument is sound again, so **the mutation batches
  can resume** — and batch A's 97.98 %, measured while that test could fail, is still the number to
  re-run first.
- 🗂️ **NOTHING WAS LOST IN THE REVERT.** The mechanism, both rejected repairs and their measurements
  live where the next reader meets them: a **characterisation test** pinning today's behaviour as the
  known limit, a note beside the racing process-level test, and a warning in `readHookPayload` itself
  saying not to "fix" this without reading ADR 0028 first.
- 📉 **~~THE DEFECT IS FIXED~~ — superseded by the two blocks above, kept for the reasoning**
  _(2026-09-05, `045bd3f`, the owner's call:
  *"corriger le vrai défaut"* rather than stabilising the test)_. The cause was one property read:
  `readHookPayload` asked *"is fd 0 a terminal?"* through `process.stdin.isTTY`, and **reading that
  property builds the stdin stream, which switches fd 0 to non-blocking**. `readFileSync(0)` then
  throws EAGAIN until the harness writes, and EAGAIN was caught and returned as `""`. **The guard
  against hanging at a terminal was what broke reading from a pipe.**
  - **The fix**: `tty.isatty(0)` answers the same question without touching the descriptor's mode; and
    because a later import could rebuild that stream out of our sight, EAGAIN now means *"nothing there
    YET"* and is worth a bounded 2 s wait. A genuine EOF (an empty read, `/dev/null`) still answers
    instantly, so nothing pays for the belt.
  - **Proof, before → after**, hook spawned with its payload handed over late: `500 ms` → announced
    `acme` in 171 ms, never waiting → now `blue-team`, and it still holds at `1000 ms`. Under load,
    **1 red in 8 concurrent full-suite runs → 0 in 8**.
  - **The test that would have caught it now exists**: the old process-level test handed the payload
    over the instant it spawned, so it only ever proved the barrier holds when the hook **wins** that
    race, and nothing promises it does. The new one hands it over late.
- ▶️ **THE NEXT WORK IS 9.5, AND IT STARTS WITH BATCH A, ON THE CURRENT CODE.** _(The 15:29 relaunch
  named below ran against the stdin repair that was afterwards **reverted**, so whatever it returned is
  about code nobody has: it is not the measurement, and the run has to be redone from today's HEAD.)_
  Before launching anything: `ps aux | grep input-type=module` for orphans, then **one run at a time**.
  **Batch A first, not B**:
  its 97.98 % is the number under doubt, and it is the one already quoted in `RESULTS.md`. Then B
  (`session-authors.mjs` + `author-identity.mjs`), then C (the ranges 9.4 changed in
  `lib/filed-note.mjs` 216 and `file-back-note.mjs` 102, 142). One at a time.
  ⚠️ **Read its survivors against the code, one by one, before calling any of them equivalent** — the
  batch above just proved that verdict can be wrong. **Note `session-authors.mjs` carries 2 known
  equivalents from 8.8** (it read 92.59 % there, hunk-scoped 44-109); this run is **whole-file**, so it
  is not the same measurement and the numbers are not comparable line for line.
- ▶️ **THEN, the last batch**: the ranges 9.4 changed in `scripts/lib/filed-note.mjs` (216) and
  `scripts/file-back-note.mjs` (102, 142). One run at a time, always.
- 📖 **The 32 first-pass survivors, and the reading that split them 22 killable / 10 equivalent, now
  live in `RESULTS.md`** — they were kept here only until the re-run could be checked against them,
  and it has been. Not copied back: a list that has done its job is history, and history belongs in
  the register.
- 📌 **STILL OWED WHEN ALL THREE BATCHES ARE IN**: the figures join the release note's *Quality*
  paragraph **and #86's body on GitHub**, as 8.8's did — the PR body's file copy and GitHub's own copy
  are edited in the same breath, then GitHub's is re-read to confirm.
- ⚠️ **Always one run at a time**: two at once starve each other and return a meaningless score.
- 📎 **This batch is evidence for the OTHER plan** —
  [`harness-speed-and-test-quality-action.md`](harness-speed-and-test-quality-action.md) § S2: a first
  pass at 92.83 % whose 25 killable survivors are, without exception, the shapes catalogued since
  2026-07-15 (the absent twin, the collection under 2 elements, the boundary, the constant asserted
  against itself). Recorded there rather than re-derived.
- ▶️ **THE WORK IS STEP 9 BELOW, four items, all in v5.1 on his explicit call** _(2026-09-05)_. They
  answer the question he put after reading the duo surface: **what guarantees the person asked is the
  one whose brain it is**, and that the newcomer is not the one answering *"yes, that's fine"*?
- 🛑 **THE RELEASE IS HELD until those four land** — his call, the second hold on this release. Then
  § *Cutting the release* below, which is **his and only his**.
- ✅ **EVERYTHING ELSE ON THIS RELEASE IS DONE, GREEN AND PUSHED**, CI read on each commit: the live
  sync between machines (#84), duo mode itself, the question that replaced the assertion, the
  mutation measurements (**98.92 %** on the three files step 8 wrote, **95.45 %** on what it changed
  elsewhere), the release note, the PR body, and the doc corrections of 2026-09-05.
- **Blocked on:** nothing.
- 📇 **THE FOUR OTHER FILES THAT NAME THIS BRANCH, AND WHY EACH NEEDS NOTHING** _(checked 2026-09-05
  by opening them, not by grepping)_. The carrier guard names them at every hand-back on this branch;
  it judges no content, so the answer has to be written once rather than re-derived each time:
  - [`live-remote-sync-action.md`](live-remote-sync-action.md) and
    [`duo-source-identity-action.md`](duo-source-identity-action.md) — **both say, in their own STATE
    block, that they are CLOSED and that the live state moved here.** They are records. They stop
    being carriers at R.4, which archives them.
  - [`harness-speed-and-test-quality-action.md`](harness-speed-and-test-quality-action.md) — owns its
    own state and it is **current**: held until the tag, resuming at S1, and the order the owner
    validated is *finish 9.5 with the instrument as it is, then S1*. Which is exactly what is
    happening.
  - [`release-v5.1.0-pr-body.md`](release-v5.1.0-pr-body.md) — a **frozen copy of what #86 was told**,
    which is its whole point. It owes an edit only when the PR body itself is edited on GitHub, and
    the next such edit is already named above: 9.5's figures, alongside the release note's.
- **A session may, alone**: run step 9 test-first on `feat/live-remote-sync`, **pushing every green
  commit and READING its CI** (rules/ci.md). Mutation-score every new production file the day it is
  written (CONVENTIONS §5quinquies). **Writing a French twin is part of editing an English file that
  has one** — never one without the other, in the same commit. **Not**: tag, publish, push to `main`,
  merge #86, or write into either of the owner's real brains.
- 🔁 **The save point moves** on a long autonomous stretch (rules/plans.md): write each decision into
  this file as it lands and commit it, rather than banking it for a hand-back hours away.

## Tracking

### 9. What a duo owes the person whose brain it is _(2026-09-05, his ask)_

**The answer to his question, and it is mostly already true**: the consent is the **collaborator
invite on the private repository**, which lives in the owner's authenticated account and cannot be
self-granted. Nothing typed inside a brain grants access, and the registry answers decide **how notes
are filed**, never **who may write**. Verified in the code, not recalled: `distinct` is a list of
NAMES, so the newcomer answering about the owner's name does **not** silence the owner's own question
about theirs (`unplacedAuthors` filters per name, by slug).

**One hole is real, and 9.1 closes it.** `fuseAuthors` is convergent **on purpose** (answering on
either machine settles it), so a wrong *"it's the same person"* recorded on the newcomer's machine
resolves both names to one canonical → `everyone()` counts one person → the owner's machine emits
**nothing at all**: no question, no reminder, no arrival banner. It grants nothing; it **hides the
arrival**, which is precisely the scenario he described.

**What is deliberately NOT built, written here so it is not re-argued**: a notion of *"the owner"*
that only accepts their answers. The name is a line of git config, and anyone who can push can
already change it, rewrite any note, and hand-edit `authors.json`. **No in-brain mechanism defends
against someone who already has push access** — the invite list is the fence, and signed commits or
branch protection are the git host's job, not this brain's.

- [x] **9.0** _(2026-09-05, his ask on reading the paragraph above: "je rajoute une ADR qui dit ça")_
      [`../../decisions/0042-access-belongs-to-the-git-host-the-brain-only-files.md`](../../decisions/0042-access-belongs-to-the-git-host-the-brain-only-files.md)
      — access is the host's, the brain only files; ending a duo is removing the collaborator; and the
      three gates we will **not** build, each with why it would protect nobody. Listed in
      `maintainers/README.md` (where **0041 was missing too**, and is now listed beside it).
- [x] **9.1** _(A, 2026-09-05, green + rehearsal 16/16)_ **A fusion recorded elsewhere is announced here, until this keyboard has endorsed
      it.** Registry entries gain a `by:` list of the people who recorded or endorsed the fusion;
      `--same-person` appends the local person. The session hook says, once per machine that has not
      endorsed: *"on another machine, X and Y were declared to be the same person. If that is right,
      confirm; if not, split them"*, with both commands. Endorsing is answering the ordinary way, so
      **no per-machine marker is invented** — the memory stays the answer itself, and it travels.
      ⚠️ **An entry with no recorder is treated as endorsed**: a brain that fused names before this
      shipped must not start nagging about its own past.
      **What the build actually found, and it is the half that mattered** — the notice offers
      `--different "<them>"` to disagree, and **that command did nothing** in this direction: a fusion
      recorded on the other machine is filed under THEIR name with mine as the alias, and `markDistinct`
      deliberately left alone the entry a name is the canonical of. So the correction changed nothing and
      the notice would have repeated forever. `markDistinct` now takes **who is disagreeing** and lifts
      them out of the other person's entry. **Grandfathering means never touching it**: re-answering a
      fusion that records nobody stays a no-op, or every such brain would write and commit a file nobody
      asked about. The field is `confirmedBy`, the notice names **both halves** (`Claire Dubois = Thomas
      Pierrain`), and it is compared by **raw** name so the fusion under review cannot vouch for itself.
- [x] **9.2** _(B, 2026-09-05)_ **`duoConfirmedNotice` names where the access came from, and how to take it
      back.** Today it explains what changes in the filing; it must also say, in the person's
      language, that the other person can write here **because they were added to the repository**,
      and that removing them there is what ends it. An alert, not a permission — and it reaches the
      owner by construction, `distinct` being per name. _(Shipped in the same commit as 9.1: one
      sentence, after what changes — "they can write here because they were added to this brain's
      repository, and removing them there is what ends it — this brain grants no access of its own".)_
- [x] **9.3** _(2026-09-05)_ **A page of its own for duo mode** _(his call: "je pense que c'est une page dédiée au
      mode duo")_, in English, in the repo: the steps for both people, the Q&A, the perimeter, the
      mail detail in full (delegation asks for no password, what it does and does not reach, the two
      arrangements that work), and the security section above. `SETUP.md` §7 keeps a short summary
      and points at it rather than growing a manual inside a setup guide. The French one-pager he is
      sending privately is the draft it is translated from; it stays out of the repo.
- [x] **9.4** _(2026-09-05)_ **Attribution metadata laid NOW, audit built later** _(his call: "setup les infos, les
      métadonnées … avant que les gens commencent")_. Today `author:` is stamped only when the writer
      follows what `dated-note-path.mjs` prints, and **no skill or constitution line asks for it
      anywhere else**, so a future audit would be archaeology in git history. So: every note this
      brain writes carries `author:` in its frontmatter, said in the constitution and in the skills
      that write notes (**both locales, same commit**). **The RAW local name is stamped, never the
      canonical one**: a fusion is an opinion that can be wrong and is reversible, while a stamped
      name is a fact about who typed — resolution belongs at read time, where it already lives
      (`canonicalAuthor`). **Forward-only**, no backfill: git history answers for the past, and
      rewriting every existing note would be a large diff for a small gain _(his to overrule)_. The
      audit / export-by-person use case is **explicitly not built**, and the page from 9.3 says so.
      **What landed**: `renderFiledNote` stamps `author:` (absent when the machine has no git name —
      ABSENT means unknown, never "nobody"), `file-back-note.mjs` reads it from git rather than
      accepting it from the caller (a note's author is a fact about the machine, not something a model
      is told), and the constitution + the briefing frontmatter say it in **both locales**. The
      fingerprint table was regenerated for the four doc files, which is what the release gate asks.

- [x] **9.4bis** _(2026-09-05)_ **The wait comes out of the session start, and the correction ships with
      it** _(his call, "enlève l'attente")_. Not part of the four safeguards: it is the blocker that
      stood in front of 9.5. `session-universe.mjs` announces the active universe from disk **at once**
      — no barrier, no stdin read, nothing that can hold a session start on the network (ADR 0028) —
      and `universeArrivalDirective` takes it back at the owner's next message when the pointer really
      arrived, naming the universe now in force and **leading** the message. The pointer no longer
      counts as *"1 other file"*. The test that proved the barrier held is **deleted** (it was also the
      1-in-8 flake that made every mutation score unreliable) and replaced by two that prove the
      opposite, one per way in: the payload handed over instantly, and a stdin nobody ever writes.
      ⚠️ **One thing is left for the owner, and it blocks nothing**: `session-engine-divergence.mjs`
      still waits. See the ❓ entry in STATE.

- [ ] **9.5** **Measure what step 9 changed** (CONVENTIONS §5quinquies), once 9.3 and 9.4 have landed,
      the way 8.8 did it: the changed ranges of `author-identities.mjs`, `brain-author.mjs`,
      `session-authors.mjs` and `author-identity.mjs`, **one run at a time** (two at once starved each
      other and returned a meaningless score), findings into `maintainers/mutation/RESULTS.md`.

### Cutting the release — the owner's, and only his

- [ ] **R.1** Merge [#86](https://github.com/tpierrain/kenjaku/pull/86), titled **"v5.1.0 — The One
      with the Duo Mode"**.
- [ ] **R.2** Tag `v5.1.0` **on `main`**, `git push --tags`, publish the release with the body of
      [`release-v5.1.0-note.md`](release-v5.1.0-note.md).
- [ ] **R.3** Tracker sweep: close [#84](https://github.com/tpierrain/kenjaku/issues/84) when a real
      brain has received the feature.
- [ ] **R.4** **Then, and only then, archive the two big plans** —
      [`live-remote-sync-action.md`](live-remote-sync-action.md) and
      [`duo-source-identity-action.md`](duo-source-identity-action.md) — into `../archived/` with
      today's date, and this file with them. **Not before**: #86's body links the first by path and
      ADR 0041 links the second, and both links must stay alive while the PR is open.
      📌 **Read [`harness-speed-and-test-quality-action.md`](harness-speed-and-test-quality-action.md)
      § S3 before doing this** _(2026-09-05, the owner's ask on how we work)_: it turns this one-off
      archiving into a standing hygiene, and its **S3.3 is exactly the broken-link problem** the
      sentence above describes. Doing both here costs almost nothing extra.

### Also outstanding, and neither gates the tag

- [ ] **X.1** Two measurements only the owner's own machines can make: whether `git` can authenticate
      without stopping for a passphrase, and how many `vault-rag` servers live when several
      conversations are open on one brain.
- [ ] **X.2** A broken link to settle after the release: `live-remote-sync-action.md`'s header points
      at `../../studies/two-humans-one-brain-study.md`, which lives only on the unmerged branch
      `docs/study-two-humans-one-brain`. Merge that branch, or repoint the link.

## Where the reasoning lives — open these only when you need the WHY

Both are closed and hold no live state. They are long on purpose: they are the record.

- [`live-remote-sync-action.md`](live-remote-sync-action.md) — the live sync between machines (#84):
  the merge rule, the tick, the gate, the announcement, the risks, the field rehearsal, and why duo
  mode needed it.
- [`duo-source-identity-action.md`](duo-source-identity-action.md) — duo mode itself: source
  identity (ADR 0041), per-person dated notes, the narrowed merge rule, the owner's call that duo
  mode is implicit, and step 8's *a brain may file on a guess, it may not assert one*.
