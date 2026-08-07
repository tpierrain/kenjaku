# Action plan — the RAG server that never leaves, and two Windows launchers that were never tested as text

> 🔴 **THIS IS THE LIVE PLAN. START HERE.**
>
> **Owner's decision (2026-08-07, Thomas): ship it as a `v4.8.1` hotfix, AHEAD of both v4.9.0 subjects**
> (`v4.9.0-mutation-debt-plan.md` and `field-finding-2026-08-05-silent-skill-freeze.md`, both of which
> stay open and untouched). Rationale, already argued below: defect 1 is critical, cross-platform and
> **self-aggravating on every deployed brain**, and the two reporters are running locally patched
> launchers that the next `/update-engine` will overwrite.
>
> **Resume at: watch the Windows CI cell on PR #59**, then work the release tail. **All three
> defects are code-complete** (1: shutdown + lifecycle test · 3: launchers + health probes ·
> 2: CRLF + `.gitattributes` + an execution test). What is left is not new code:
>
> 1. ~~Windows CI~~ — **done**: 7/7 green, and the `.cmd` tests were checked to have *run* there,
>    not skipped (run 31205865890).
> 2. ~~MCP_TIMEOUT~~ — **decided by Thomas: ship nothing.** See its box; do not re-propose it.
> 3. ~~Mutation pass~~ — **done** on all five harness files (three at 100 %, two lifted; see the
>    verification box for the table and for what was deliberately left to the v4.9.0 mutation-debt
>    plan). The worktree `/Users/tpierrain/Dev/kenjaku-mut-v481` is **kept on purpose** so the §10
>    release-tail pass does not have to rebuild it.
> 4. **Release note** in the non-devs-first voice (§11), saying plainly what the symptom was: *your
>    brain could not reach its own notes, and said nothing.* **← THE NEXT ACTUAL STEP.**
> 5. **Ask the two reporters to re-run their own reproducer** on the tagged build (see the
>    verification box). This is the only remaining item that needs someone else's machine.
>
> Note that Defect 3 also **unblocked** the live-health section (its synchronous banner is now
> affordable) — that is a v4.9.0 subject, not this hotfix, unless Thomas decides otherwise.
>
> The wording review is now **fully CLOSED**: items 2, 3, 4 and 5 are
> shipped; item 1 keeps the "RAG" vocabulary (Thomas declined de-jargoning it) and its one remaining
> open string — `up to date` — was arbitrated on 2026-08-07 in favour of *claim only what was
> measured* (`🧠 RAG — 112/112 files indexed.`). Nothing left to ask there.
>
> **Defect 3** (`npx tsx` → the direct `tsx/dist/cli.mjs` call). **Defect 1 is closed**:
> the shutdown, the committed lifecycle test that proves the process dies, and the last open question
> — "fail fast on a locked index" — which was **dropped on evidence, not on scope**: measured, it
> would fire on nothing and would break parallel Desktop + CLI sessions, which work today. Read that
> box before reviving the idea.
> **Defect 3 matters more than the report thought**: the lock mechanism it proposed does not survive
> measurement, which leaves `npx`'s 9.8 s startup as the thing that actually blows the client's 30 s
> ceiling. See the ⚠️ box under Defect 1.
> Branch **`hotfix/v4.8.1-rag-server-shutdown`**, **PR #59** — the resumption anchor
> (DEVELOPING.md §7), whose body mirrors what is left.
> Do **not** re-diagnose and do **not** re-read the source report: the fix sites were already named
> from a verification pass against HEAD, and the ones that are done are ticked with their commit.
>
> **The order to work in** (defect 1 alone justifies the release; 2 and 3 ride along because they touch
> the same startup path): **1 → 3 → 2**. Defect 3 removes the `npx` wrapper, which shortens the process
> chain defect 1's shutdown has to cover, so doing it before 2 keeps the launcher edited once.
>
> **Standing constraints for this release**: TDD baby-steps with a failing test first (the lifecycle test
> `rag` never had); green-only commits, pushed as they go; `CONVENTIONS.md` §9 (Windows tripwire) and
> §5quinquies (mutate what you write, the day you write it); a release note in the non-devs-first voice
> (§11) that says plainly what the symptom was — *your brain could not reach its own notes, and said
> nothing*.

> **Source.** A runtime report from two Windows colleagues of Thomas's, on **v4.6.0** (`rag` 1.3.0,
> index schema 2, Windows 11, Node 22.23.0, a 112-note vault). Original kept as evidence beside this
> plan (`archived/field-report-2026-08-07-source.md`). It is unusually good: symptoms, root cause read
> in our own source, a measured control experiment, and a reproducer.
>
> **The symptom is our cardinal sin.** The session starts normally and **no `mcp__vault-rag__*` tool
> exists at all** — the brain silently has no access to its own vault. Not an error, not a warning:
> an absence. Same family as "an index that promises a resume it never attempts".
>
> **Verified against HEAD (v4.8.0) on 2026-08-07, not taken on trust.** All three defects are still
> live. Defect 1 is **not Windows-specific** and affects every platform, including the maintainer's own
> Mac.

## Tracking

- [ ] **Defect 1 — the RAG server never exits when the client disconnects. CRITICAL, self-aggravating.**
  - [x] **Fixed and pushed** _(2026-08-07 · e363ac4 shared helper, dbf4dc5 local-mirror, e4299ba rag)_.
        Proven by hand against a throwaway vault, both trees, same probe (wait for
        `Live-update watcher active`, close stdin, count): **main = alive at 10 s, killed** ·
        **branch = exit 0, 8 ms after the pipe closes**. That probe has since become the committed
        test in the next box.
  - [x] **The lifecycle test `rag` never had is committed** _(2026-08-07 · 3318fc7)_ —
        `rag/src/test/server-lifecycle.test.ts`. The throwaway probe is gone: the repo carries the
        real thing now, so read it there rather than re-deriving it here. It spawns the actual server
        (`VAULT_DIR`/`CACHE_DIR` on temp dirs, `SBG_ENV_PATH` at a nonexistent file → no key, no
        embedder, 0 notes), waits for `Live-update watcher active`, closes stdin, asserts a clean
        `exit 0`. **Checked both ways before committing**: wiring disarmed → SIGKILLed as an orphan
        at 20 s; wiring in place → **exit 0 in 247 ms**.
    - [x] **Where it runs, decided**: a new `rag/src/test/` (the `local-mirror` convention), kept
          out of the `src/lib/*` unit suite because it spawns a process. It joins `npm test`, so it
          runs on **every CI cell — macOS *and* Windows, Node 22/24/26** — i.e. the platform the leak
          was reported on.
    - [x] **The glob was the trap, so it is now guarded**: `npm test` did not cover `src/test/`, and
          a test that runs nowhere asserts nothing (this repo has paid that bill twice: `rag/*.test.mjs`,
          and the write-guard suite green-on-one-machine for 67 commits). `lib-coverage-guard.test.ts`
          now checks the `package.json` glob against the directories actually holding tests — adding
          one goes **red** instead of going quiet.
  - [ ] **Decisions taken while fixing** (recorded so they are not re-litigated):
        (a) the shared helper lives in a NEW top-level **`shared/`** package-less folder, imported by
        both servers by relative path — both `tsconfig.json` drop `"rootDir": "src"` (nothing consumes
        `dist/`, `tsx` runs the sources), `shared/**` is added to the manifest's `replace` regime **so
        an updating brain actually receives it**, and it rides with the rag suite + rag mutation config
        (100 % — 24/24 mutants killed);
        (b) **stdin EOF now exits explicitly for BOTH servers**, `local-mirror` included, replacing its
        "natural EOF winds down on its own" behaviour. Relying on an idle event loop is precisely the
        implicit contract that broke here, and it was never a property `local-mirror` had either — only
        of how little it happened to hold open;
        (c) `local-mirror`'s own `installShutdown` is **deleted**, not kept in sync: it now supplies
        only WHAT to release (`shutdownPlanFor`), never WHEN.
  - [ ] **Confirmed at HEAD.** `rag/src/index.ts` opens the transport (`server.connect`, l. 386-387)
        and later starts the live vault watcher (`startVaultWatcher`, `rag/src/lib/vault-watcher.ts`).
        A grep over `rag/src` for `stdin.once` / `stdin.on` / `SIGINT` / `SIGTERM` / `onSignal` returns
        **nothing**: the only `process.exit()` calls are the `--once` path (l. 380) and the fatal catch
        (l. 524). When the client closes the pipe, the live watcher keeps the event loop alive and the
        process **survives**.
  - [ ] **The archaeology matters** (the reporters spotted it): before the live-watcher feature the
        process would have exited by event-loop exhaustion. **Adding liveness turned an implicit
        shutdown into a leak** — nothing was removed, so nothing looked like a regression.
  - [ ] **Why it degrades instead of failing.** The field facts stand: **21 orphaned node processes**
        over one day (12:00 → 18:15), four consecutive dead sessions, each failure making the next
        likelier — "occasionally slow" to "permanently dead" with no warning in between.
  - [ ] **⚠️ But the MECHANISM the report proposed does not survive measurement, and we repeated it.**
        The report said each survivor keeps an exclusive lock on `vault.db`, so the next session
        contends for it and blows the client's 30 s handshake ceiling. Measured on 2026-08-07 (see the
        dropped fail-fast box): the index is **WAL**, the transport opens **before** any indexing —
        already true in **v4.6.0**, their own version — and a server starting against a **held write
        lock** still handshakes in **291 ms**. The startup path never waits on that lock.
        **The reading that fits the evidence**: the orphans starve the machine (21 live node
        processes, each with a watcher and, on an in-process embedder, model weights in RAM), and what
        actually blows the 30 s ceiling is what runs **before our code does** — `npx`'s resolution
        with its registry round-trip, **9.8 s warm on an idle machine** by their own measurement.
        Which **promotes Defect 3 from "aggravator" to proximate cause**, and leaves Defect 1 as the
        root cause it always was: the leak is what makes the machine slow enough for `npx` to lose.
        _(Not provable from here — it needs their machines. It is the reason to ask them to re-time
        `npx` versus the direct call on the tagged build, which the verification box already does.)_
  - [ ] **The control experiment is what makes this airtight**: both servers time out under the same
        conditions, yet all 21 orphans were `rag`, **zero** were `local-mirror`. Measured — start,
        close stdin after 8 s, count survivors: `rag` 2 → 2 (leaks), `local-mirror` 2 → 0 (exits).
  - [x] **The fix already exists in this repo**, in `local-mirror/src/server.ts:136-176`
        (`installShutdown` + `realShutdownHooks`, injectable seams, unit-tested in
        `local-mirror/src/test/server-boot.test.ts`), comment included on why a SIGINT/SIGTERM listener
        must **also** exit. **Extract it into a shared helper** rather than copy it: the two servers
        drifting apart is the whole reason we are here.
  - [x] rag's shutdown has one more job than local-mirror's: **stop the watcher, then `closeDb()`**
        (`rag/src/lib/vector-store.ts:497`, already exists), then exit. Releasing the lock is the half
        that stops the pile-up. _(Done: `rag/src/lib/shutdown-plan.ts` — and it closes the index even
        when the watcher throws, since the lock is released by dying, not by tidying up well.)_
  - [x] **Fail fast on a locked index — DROPPED, and not for scope reasons: it has no premise.**
        _(2026-08-07, measured, Thomas asked what it would actually do)_ The index runs in
        **WAL** (`vector-store.ts:181`) and the MCP transport is opened **before** any indexing — in
        v4.6.0 too, so this is not something we fixed since. Measured on this branch:
        - a server starting **while another process holds a real `BEGIN IMMEDIATE` write lock**
          handshakes in **291 ms** and arms its watcher. The startup path never asks for the lock, so
          a fail-fast check on it would fire on **nothing**;
        - **two servers on the same vault and the same cache** both come up (~300 ms), both arm, both
          exit 0. Refusing to start on "someone else holds the index" would **break a case that works
          today** — Claude Desktop and the CLI on the same brain (see the next box);
        - only a concurrent **write** collides: it waits ~5 s (better-sqlite3's default busy timeout,
          we set none) and then raises `SQLITE_BUSY`. That is a **visible indexing error**, not a
          silent hang, and it is not the startup path.
        Also worth knowing before anyone revives the idea: **SQLite never names the holder** — you get
        `SQLITE_BUSY`, never a PID. A message could only say *"someone else"*. Naming (and a fortiori
        killing) needs a PID we wrote ourselves, which is what `ReindexLock` already does for the
        reindex (pid + acquiredAt + `isAlive` + 30-min stale reclaim). Killing on the user's behalf is
        the **reaper the plan already refuses**, two boxes down.
  - [ ] **Parallel sessions (Desktop + CLI on one brain) are a supported case, and now a clean one.**
        Measured above: they coexist. Before the fix each one also left a survivor behind; with the
        shutdown wired, each server dies with its own session. Nothing to build here — recorded so the
        next person does not "protect" the index and break it.
  - [ ] **Do NOT ship the reaper instead of the fix.** The report itself pre-empts it: reaping orphans
        from `session-self-heal.mjs` is *"a net, not a fix — with Defect 1 corrected it should become
        unnecessary, and shipping the net instead would just hide the leak."* Their words, and they are
        right.
- [ ] **Defect 2 — generated `.cmd` launchers are LF-only. Windows, high, latent.**
  - [x] **Fixed and pushed** _(2026-08-07 · see git log)_. Every `.cmd` we emit now goes through one
        `asCmdFile()` in `scripts/lib/rag-launcher.mjs` — `buildRagInstallInvocation` included, so the
        one file that already knew is part of the family instead of a lonely exception. The `→` is
        gone from the `local-mirror` REM.
    - [x] **Three nets, because a generator-side assertion alone was not enough**:
          (a) a test on the **emitted bytes** (no lone LF in any `.cmd`), plus its mirror asserting
          the `.sh` side stays **LF** — sh dies on a trailing CR, so the two families need opposite
          things and that is precisely how one rule gets wrongly applied to both;
          (b) **`.gitattributes`**, tracked so the installer's `git ls-files` copy carries it into
          every brain. **This was a genuine hole, found while fixing**: the brain **commits its own**
          launchers and `rehydrate.mjs` does **not** regenerate them on a second machine — it only
          rewires `.mcp.json`. So a clone onto a second Windows machine gets whatever `core.autocrlf`
          decides, and the defect returns **with the generator's test still green**;
          (c) **`scripts/launcher-exec.test.mjs`** — the test the report asks for: it **executes** the
          real generated launcher against a stub tsx CLI that reports the path it was handed.
          `.sh` everywhere, `.cmd` on the Windows cell (§9's tripwire is what makes that non-optional).
    - [x] **That execution test earned itself on its first run**: it caught the POSIX launcher passing
          a **cwd-relative** path where Windows passed an absolute one. Both branches of both platforms
          are anchored on the launcher's own directory now (`CDPATH= cd -- "$(dirname -- "$0")" && pwd`
          / `%~dp0`), which removes the last cwd assumption — the same assumption that made
          `npx tsx rag/src/index.ts` look local when it was not.
    - [x] **Proven where it actually broke** _(2026-08-07 · CI run 31205865890, PR #59, 7/7 green)_.
          Not merely "the build passed": the Windows job log was read to check the `.cmd` tests
          **ran** rather than skipped — `ok 119` / `ok 120`, real `cmd.exe` executing the real
          generated launchers, on **Node 22, 24 and 26 × windows-latest**. This repo has twice paid
          for a test that ran nowhere, so a green tick is not accepted as evidence on its own.
          _(The `Windows tripwire · harness` job shows as skipped: by design it is `push`-only, since
          the full matrix already covers it on a `pull_request`. Nothing to chase.)_
  - [ ] **Confirmed at HEAD**: `buildCmdLauncher`, `buildNodeRunnerCmd` and `buildLocalMirrorCmdLauncher`
        (`scripts/lib/rag-launcher.mjs`) are template literals with plain `\n`. cmd.exe reads batch files
        **by byte offset**, re-seeking as it goes; with LF-only endings the accounting drifts and cmd
        resumes **mid-token** — the field stderr shows `REM` being executed as `'M'`, plus `'lf-heal'`
        and `'epends'`, fragments of comment words.
  - [ ] **It is length-dependent, so it stays dormant.** The one-line `npx tsx …` file never fired it;
        adding a multi-line `if ( … ) else ( … )` did. The same patch broke `local-mirror` and spared
        `rag` purely because the two files differ in length.
  - [ ] **The lesson already existed ten lines away and never travelled**: `buildRagInstallInvocation`
        writes its win32 script with explicit `\r\n` (l. 171) — someone learned this the hard way for
        the install script and the launchers never got it. Fix the family, not the file.
  - [ ] **Keep generated `.cmd` comments ASCII-only.** `buildLocalMirrorCmdLauncher` currently emits a
        `→` inside a `REM` line (l. 115): cmd reads it as CP1252 and it adds noise to an already fragile
        parse. (This is a **generated-artifact** constraint, not a prose-style rule: it does not touch
        our English prose conventions.)
  - [ ] **Lock it with a test, or it comes back**: our own editing tools write LF, so a hand-applied
        CRLF fix is trivially undone. A generator-side assertion on the emitted `.cmd` bytes is what
        makes it stick — same reflex as the Windows tripwire (`CONVENTIONS.md` §9).
- [ ] **Defect 3 — `npx tsx` resolves tsx from the npx cache, not from `node_modules`. Windows, medium.**
  - [x] **The four launchers are fixed and pushed** _(2026-08-07 · see git log)_. One shared pair,
        `tsxRunSh` / `tsxRunCmd` in `scripts/lib/rag-launcher.mjs`, is now the single way any launcher
        starts tsx — `rag` and `local-mirror`, POSIX and Windows, all four routed through it, with a
        test that fails if any one of them keeps a bare `npx tsx` or drops the fallback. Fixing them
        one at a time is the drift this report is made of.
    - [x] **POSIX gets the same treatment — decided, and it was not a close call.** The resolution
          path is identical everywhere, the live-health section depends on the direct call being
          cheap **on the maintainer's Mac too**, and a one-sided fix is exactly how the two launchers
          drifted apart in the first place.
    - [x] **Measured here before believing the string tests** (the report's own lesson: our launcher
          tests assert strings, cmd.exe reads offsets). The generated `launch.sh` was written into
          `rag/` and `local-mirror/` and **actually run** the way `.mcp.json` invokes it
          (`/bin/sh <dir>/launch.sh`, cwd = brain root, vault and cache on temp dirs, no `.env`):
          both reach `running on stdio` and both **exit 0 when stdin closes** — defect 1's fix still
          holds through the new invocation. Three warm runs, time to that line:
          **592-810 ms via `npx` versus 278-283 ms direct**. Smaller than Windows' 9.8 s → 2.8 s,
          because this Mac's npx cache never had to reach the registry; the ratio is the floor, not
          the ceiling.
    - [x] **The OTHER `npx tsx` spawns are done too** _(2026-08-07 · see git log)_ — the health
          probe (`headless-health-check.mjs`) and its OS notification (`health-probe-run.mjs`).
          Both are **values now**, built by a new `scripts/lib/tsx-invocation.mjs`, not spawns
          composed in place: a real child-process runner nothing observes is the shape
          `CONVENTIONS.md` §5quinquies names as already-paid-for twice. Measured here, three runs
          each, identical JSON out: **538-577 ms via npx versus 219 ms direct**. Six tests go red if
          the direct call is lost.
          **This is what unblocks the live-health section below** — its synchronous banner is priced
          at the direct call, and at npx's price the same design would *worsen* the bug this release
          fixes.
          _(Left alone on purpose: `scripts/verify-index.mjs` and `scripts/run-eval.mjs` are
          maintainer paths, not session startup. Same reflex, no urgency.)_
  - [ ] **Confirmed at HEAD**: the launchers end with `npx tsx rag/src/index.ts`, and
        `.mcp.json.template` sets `cwd` to `{{PROJECT_ROOT}}` — but `tsx` is a devDependency of **`rag/`**,
        and there is no root `node_modules`. npx cannot resolve it locally and falls back to its own
        cache **with a registry round-trip**.
  - [ ] **Measured, warm cache** — time to `[vault-rag] MCP server running on stdio`:
        `npx tsx …` **9.8 s** (local-mirror: timed out) vs
        `node "%~dp0node_modules\tsx\dist\cli.mjs"` **2.8 s** / **2.6 s**. Against a 30 s ceiling that is
        3× headroom versus 10× — and the 3× vanishes entirely under lock contention. This is what pushed
        an already-fragile startup over the edge; it is an **aggravator**, not the root cause.
  - [ ] Their shape, with `%~dp0` anchoring on the script's own directory and npx kept as a fallback:
        `if exist "%~dp0node_modules\tsx\dist\cli.mjs" (node "%~dp0node_modules\tsx\dist\cli.mjs" "%~dp0src\index.ts") else (npx tsx rag/src/index.ts)`
  - [ ] **Side benefit that matters for Defect 1**: it removes the `npx` wrapper process — the layer
        that survived when the `tsx` child was killed. Shorter chain, less to orphan.
  - [ ] Decide whether the POSIX launchers get the same treatment. The defect was measured on Windows,
        but the resolution path is the same everywhere; a one-sided fix is how the two launchers drifted
        in the first place.
- [x] **Secondary — `MCP_TIMEOUT` headroom. DECIDED: ship nothing.** _(2026-08-07, Thomas)_
      `.mcp.json.template` keeps `"env": {}`. With defects 1 and 3 fixed, startup is ~2.8 s on the
      reporters' machines against a 30 s ceiling and the servers no longer pile up, so the ceiling
      has stopped being the binding constraint. Raising it now would cost the only signal we ever
      had: **the timeout blowing is what told us anything was wrong at all.** A silent slow creep
      with a 60 s ceiling would simply take longer to surface.
      Do not re-propose it as "cheap comfort" — the argument was heard and declined. If a genuinely
      slow corporate machine shows up with a measurement, that is a new premise and a new decision.
- [ ] **Release shape — decide, then say it out loud.** Defect 1 is critical, cross-platform, and
      **self-aggravating on every already-deployed brain**; the two reporters are running locally
      patched launchers that **`/update-engine` will overwrite**, reintroducing the problem. That argues
      for a **v4.8.1 hotfix** ahead of the v4.9.0 subjects (the mutation debt, the silent skill freeze)
      rather than folding it into a feature release.
- [ ] **Verification, on real Windows and not only in CI.** The reproducer is in the source report:
      (1) start the server, close stdin, count survivors — expected 0; (2) add a multi-line
      `if ( … ) else ( … )` block to a generated launcher and run it; (3) time `npx tsx` versus the
      direct `tsx/dist/cli.mjs` call. Ask the two reporters to re-run (1) and (2) on the tagged build:
      they have the machines, the vault, and they already know what right looks like.
  - [x] **Mutation pass done on every harness file the branch touched** _(2026-08-07 · worktree
        `/Users/tpierrain/Dev/kenjaku-mut-v481`, symlinked `rag/node_modules`, `vault-write-guard`
        verified at **0 skipped** so the mutants faced a suite that could judge them)_:
        | file | score | note |
        |---|---|---|
        | `scripts/lib/rag-launcher.mjs` | **100 %** (117/117) | |
        | `scripts/lib/tsx-invocation.mjs` (new) | **100 %** (19/19) | |
        | `scripts/lib/rag-status.mjs` | **100 %** (53/53) | |
        | `scripts/lib/headless-health-check.mjs` | 50 % → **63.27 %** | remainder pre-existing |
        | `scripts/health-probe-run.mjs` | 32.53 % → **38.10 %** | remainder pre-existing |
    - [x] **The pass earned its keep on code written an hour earlier.** It found that the spawn
          requests were **half** values: command and args were returned, the **options object was
          still composed inside the runner** where no test could see it — and the options are the
          load-bearing half (`cwd` makes the relative script path resolve at all; `SBG_NO_NOTIFY`
          stops a per-session probe toasting every session; `detached` is what lets the warning
          outlive the child that raised it). Fixed and pinned; that is what moved both scores.
    - [ ] **What is left is NOT this release's, and saying so plainly**: the survivors that remain
          are `callHeadlessHealthCheck`'s literals and, above all, the whole
          `if (process.argv[1] === …)` **main block** of `health-probe-run.mjs` — which its own header
          already calls *"deterministic glue, not unit-tested"*. That is precisely §5quinquies's
          named shape (*a top-level script with no test sibling*, a fix designed at v4.5.0 and never
          propagated). Extracting a testable `main()` is a real piece of work, not a hotfix item →
          **hand it to `v4.9.0-mutation-debt-plan.md`**, do not smuggle it in here.
    - [ ] **Still owed**: `git worktree remove /Users/tpierrain/Dev/kenjaku-mut-v481` once the
          release-tail §10 pass is done (it is kept for now precisely so the tail does not have to
          rebuild it).

## What this report changes about how we test

- [ ] Both defects 2 and 3 are **generated-artifact** defects: the generator was tested for its
      *content* (does the launcher contain the self-heal block?) and never for the **bytes** it emits
      (line endings, encoding) nor for what those bytes **cost at runtime** (9.8 s). Our launcher tests
      assert strings; cmd.exe reads offsets.
- [ ] Defect 1 is a **lifecycle** defect: every existing rag test exercises the server's *answers*, none
      exercises its *death*. `local-mirror` has that test and did not leak. That is not luck.

## Startup wording, reviewed for non-technical owners (asked by Thomas, 2026-08-07)

> Thomas's worry, verbatim in intent: *do not leave people with a brain that says "I can't work"
> without telling them what to do, and without a way out.* The review below is of the **seven
> SessionStart hooks** actually wired in `.claude/settings.json.template`, in order:
> self-heal → health → obsidian-hint → wiki-health → universe → actions-log → status.
> **Reference tone: `CONVENTIONS.md` §11** (non-devs first, never alarmist).

- [ ] **⚠️ A — the green line that lies. This is a defect, not wording, and it is our own cardinal sin.**
      `session-status.mjs` reads `rag/.cache/vault.db` **directly** (l. 115-126) and never checks that
      the `vault-rag` server is reachable. So in the exact field scenario — server never started, no
      `mcp__vault-rag__*` tool in the session — the owner is greeted with
      `🧠 RAG up to date — 112/112 files indexed.` Green, reassuring, and wrong: the brain cannot read
      a single one of those notes. The health banner does catch it, but from the **previous** session's
      cached verdict, so the first broken session says nothing (`session-health.mjs`: instant read of
      the cache + a detached re-probe that refreshes for **next** time — a deliberate zero-latency
      trade, but a real one-session blind spot).
  - [ ] Two ways out, to choose: **(i)** the line only claims what it actually knows (describe the
        index on disk, never pronounce the brain healthy), a wording change that fits this hotfix; or
        **(ii)** a real reachability check at session start, which is bigger than a hotfix and belongs
        with the v4.9.0 silent-freeze subject. (i) is honest immediately; (ii) is the actual cure.
- [ ] **B — "RAG" is jargon, on the line shown at EVERY session start.** `🧠 RAG: …`
      (`scripts/lib/rag-status.mjs`) means nothing to a non-technical owner. Say what it is: their
      notes, and whether they are searchable.
- [ ] **C — terminal commands handed to people who do not use a terminal.** `cd rag && npm run reindex`
      (empty-vault line), `/mcp`, `node scripts/rehydrate.mjs`. The brain can do the first one itself,
      so the gesture is *"ask me to reindex"* — the shape the health banner already uses
      (`gestureForCheck`). Keep a literal command only where the owner genuinely must run it.
- [ ] **D — jargon in the alarming lines**: `.env`, `GOOGLE_GEMINI_API_KEY`, `MCP`, `gitignored`,
      "this machine's absolute paths". These land in the messages the owner reads when something is
      already wrong, i.e. the worst moment to make them feel out of their depth.
- [ ] **E — an alarm on something harmless.** `⚠️ Brain self-heal skipped (non-blocking): {error}`
      shows a warning triangle plus a raw error string for a condition we ourselves call
      non-blocking. Either it matters (then say what it means for them) or it does not (then it is not
      a ⚠️ and probably not shown at all).
- [ ] **F — shouty capitals**: `ACTION NEEDED`, `CAN'T`, `will NOT resolve`. The information is right
      and worth keeping; the volume is not. §11 asks for calm and plain, and a restart is not an
      emergency.
- [x] **The model to align on already exists in the repo**: `formatHealthBanner` — name the cause,
      give one gesture in plain words, and close with *"Your notes themselves are untouched."* That
      last clause is the whole difference between informing someone and frightening them.

### Live health, not a cached verdict (Thomas, 2026-08-07) — and the correction I owed him

> Thomas's principle, and it is the right one: **a health STATUS must be live.** A stale index is a
> data-freshness question; a stale *verdict on whether the brain works* is a different kind of claim,
> and reporting it from a file is not acceptable.

- [x] **First, two corrections to what I told him** _(measured / read, 2026-08-07)_:
      **(a) the banner never affirms health.** `formatHealthBanner` returns `null` when nothing is
      broken, so a stale-healthy cache produces **silence**, not a false green. The failure mode is a
      *missed warning*, not a lie.
      **(b) a fresh break IS signalled in the current session**, out of band: the detached probe runs
      at every session start and **OS-notifies on a newly-broken capability** (`health-probe-run.mjs`),
      within seconds. What is one session late is the **chat banner**, not the detection.
      So the "one session in the dark" I described was overstated. The genuinely misleading surface is
      **finding A** — and note that A is **already live**; it simply measures the wrong thing (the
      index file on disk, never whether the server answers). Making things "live" does not fix A;
      measuring the right thing does.
- [ ] **Then the real trade, with numbers.** The probe is deliberately detached because it costs a
      process spawn: `npx tsx rag/src/health-check-cli.ts --depth light` (read-only, no server boot,
      no ONNX). Measured on the maintainer's Mac, warm: **1.55 s via `npx`** versus **0.30 s calling
      `tsx/dist/cli.mjs` directly**. On the reporters' Windows machines `npx` measured **9.8 s**.
  - [ ] **Which means the sequencing is forced, and the two subjects converge: fix Defect 3 first.**
        Making the banner live *today* would add ~1.5 s to every session start here and up to ~10 s on
        the very Windows machines already blowing the client's 30 s ceiling — i.e. it would worsen the
        bug this release exists to fix. Fix Defect 3 (direct `tsx`, no registry round-trip) and the
        live probe costs ~0.3 s, which is affordable at every session start.
  - [ ] **Then, and only then**: run the probe **synchronously** and render the fresh verdict, keeping
        the detached write for the cache. Fail-open stays non-negotiable (a probe that errors or
        overruns must never block a session start — render nothing and let the notification carry it).

### Proposed before / after, string by string (for Thomas's arbitration, 2026-08-07)

> Every "before" below is the **exact current string**, with its source. Two rules applied
> throughout: keep a literal command **only** where the owner genuinely has to type it, and close a
> worrying message with the reassurance the health banner already uses (*their notes are untouched*).

- [x] **1. `rag-status.mjs` — the RAG vocabulary is KEPT. Thomas's call, 2026-08-07: "laisse le
      wording actuel qui parle de RAG."** Do not re-propose de-jargoning it.
      **The honesty half is now ARBITRATED too** _(2026-08-07, Thomas: "ne revendiquer que le
      mesuré")_ — it was a separate question from the word "RAG", and it is settled: the healthy line
      **drops the verdict and keeps the count**. Only that one string changes; every other string in
      this item stays as proposed below.
      - healthy · before: `🧠 RAG up to date — 112/112 files indexed.`
        · after: `🧠 RAG — 112/112 files indexed.`
        **Why**: "up to date" reads as a verdict on the whole brain, which this line cannot know (it
        reads the index file, never the server). The "after" claims only what it measured — the count
        it actually read. *Mitigation, not cure — the cure is the liveness check, see the live-health
        section.*
      - unreadable · before: `🧠 RAG: status unavailable (server starting up, or engine not installed).`
        · after: `🧠 I couldn't read your notes' index just now — it may still be starting up. Ask me to check your brain if this keeps happening.`
      - empty · before: `🧠 RAG: empty vault — add Markdown notes in vault/ then run 'cd rag && npm run reindex'.`
        · after: `🧠 No notes yet. Add Markdown files in vault/, then ask me to index them.`
      - pending · before: `🧠 RAG: 100/112 files indexed, 12 pending — auto catch-up in the background.`
        · after: `🧠 Your notes: 100 of 112 ready to search, 12 still being prepared in the background.`
      - failed · before: `🧠 RAG: 100/112 files indexed, 2 failed, 10 pending — <errors>. This will NOT resolve on its own: repair the note (or ask me to), then reindex.`
        · after: `🧠 Your notes: 100 of 112 ready to search — 10 still being prepared, and 2 I couldn't read (<errors>). Those 2 won't sort themselves out: ask me to repair them.`
- [x] **2. `session-status.mjs` — the missing Gemini key. DONE** _(2026-08-07 · see git log)_
      before: `⚠️ Gemini key missing from .env → the RAG can't answer. Paste it into .env (GOOGLE_GEMINI_API_KEY=…) then re-ask your question (the server re-reads it on its own). If it persists, reconnect the MCP (/mcp) or restart Claude Code.`
      after: `⚠️ Your brain needs its Gemini key before it can search your notes. Ask me to open your .env file, paste the key after GOOGLE_GEMINI_API_KEY=, save it, and ask your question again — it picks the key up on its own. Your notes themselves are untouched.`
      `GOOGLE_GEMINI_API_KEY` stays: it is the literal text they must type. `/mcp` and "reconnect the
      MCP" go: that is our vocabulary, not theirs, and "ask me to open your .env" is a gesture they
      can actually perform.
- [x] **3. `session-self-heal.mjs` — an update waiting for a restart. DONE** _(2026-08-07)_, with
      Thomas's amendment: the gesture is **SHOUTED** (`PLEASE CLOSE CLAUDE AND REOPEN IT`) so owners
      do not skim past it, and nothing else is. The test now pins both halves — the capitals verbatim,
      and a `doesNotMatch` forbidding shouting anywhere else in the line.
      before: `⚠️ ACTION NEEDED — finishing an engine update in the background (skills: …; MCP: …). Until you RESTART Claude (close it and reopen) once this completes, your brain CAN'T use these new capabilities. Restart, then come back here.`
      after: `⚠️ An update to your brain is finishing in the background (…). Please close Claude and reopen it once — until then your brain can't use what the update added. Your notes are untouched.`
      Same instruction, same urgency, without three shouted words. A restart is not an emergency.
- [x] **4. `session-self-heal.mjs` — this machine is not set up. DONE** _(2026-08-07)_, file names kept.
      before: `⚠️ This machine isn't wired for your brain yet — missing <files> (gitignored: they hold this machine's absolute paths, so a clone never has them). From this folder, run:  node scripts/rehydrate.mjs  — then open a NEW conversation rooted here (servers and hooks are loaded when a session starts).`
      after: `⚠️ This computer isn't set up for your brain yet — a copy never carries the settings, because they point to folders on this particular machine. From this folder, run:  node scripts/rehydrate.mjs  — then open a NEW conversation here. Your notes are untouched.`
      The command stays (they really must run it). "gitignored" and "absolute paths" go.
- [x] **5. `session-self-heal.mjs` — the failure I wrongly called harmless. DONE** _(2026-08-07)_
      **Thomas challenged the premise and was right.** The `catch` wraps the WHOLE detection
      (`missingWiring` → `readWanted` → `detectSelfHealGap` → `spawnReconcile`), so when it fires
      **nothing is reconciled** — `session-self-heal.test.mjs` ("fail-open") asserts exactly that:
      `spawned.length === 0`. "Non-blocking" means *does not block session start*, NOT *no
      consequence*: a missing skill or MCP server stays missing, silently, which is this release's own
      bug family. So "show nothing" was the wrong answer and is withdrawn.
      **New proposal, to arbitrate**: say what it means for them and what to do —
      `ℹ️ I couldn't check whether your brain is fully set up this time. Your notes are untouched, and I'll check again next session — if something seems missing, close Claude and reopen it.`
      **Thomas's call: it keeps the ⚠️** — it can hide a real gap, and that outweighs the fact that it
      retries by itself next session. Shipped with that wording; the raw error no longer reaches the
      owner (it survives on `result.error`, and a test forbids it in the emitted line).
      before: `⚠️ Brain self-heal skipped (non-blocking): <raw error text>`
      after: **show nothing.** We call it non-blocking ourselves; a warning triangle plus a raw error
      string, for something that changes nothing for the owner, teaches them to fear the banner. Keep
      it as a log line for us. *(If it must stay visible: `ℹ️ A routine self-check didn't run this
      time — nothing is broken, it will retry next session.`)*
- [x] **Test impact — and one correction**: there is **no `session-status.test.mjs`** (that script is
      unpinned glue, so item 2's new string is asserted nowhere; worth knowing before editing it
      again). `session-self-heal.test.mjs` did pin items 3 and 4, and was updated first, red before
      green. Full harness suite after the change: **1596 green**.
