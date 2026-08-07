# Action plan — the RAG server that never leaves, and two Windows launchers that were never tested as text

> 🔴 **THIS IS THE LIVE PLAN. START HERE.**
>
> **Owner's decision (2026-08-07, Thomas): ship it as a `v4.8.1` hotfix, AHEAD of both v4.9.0 subjects**
> (`v4.9.0-mutation-debt-plan.md` and `field-finding-2026-08-05-silent-skill-freeze.md`, both of which
> stay open and untouched). Rationale, already argued below: defect 1 is critical, cross-platform and
> **self-aggravating on every deployed brain**, and the two reporters are running locally patched
> launchers that the next `/update-engine` will overwrite.
>
> **Resume at: Defect 3** (`npx tsx` → the direct `tsx/dist/cli.mjs` call). **Defect 1 is closed**:
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
- [ ] **Secondary — `MCP_TIMEOUT` headroom.** `.mcp.json.template` ships `"env": {}`. Emitting
      `"MCP_TIMEOUT": "60000"` is cheap headroom on cold starts and slow corporate machines. **Judgement
      call to make explicitly**: with Defects 1 and 3 fixed the ceiling stops being the binding
      constraint, and raising a timeout to hide a slow start is the kind of net this repo refuses. Take
      it as comfort for slow machines, or not at all.
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
  - [ ] Mutate every file touched, the day it is written (`CONVENTIONS.md` §5quinquies).

## What this report changes about how we test

- [ ] Both defects 2 and 3 are **generated-artifact** defects: the generator was tested for its
      *content* (does the launcher contain the self-heal block?) and never for the **bytes** it emits
      (line endings, encoding) nor for what those bytes **cost at runtime** (9.8 s). Our launcher tests
      assert strings; cmd.exe reads offsets.
- [ ] Defect 1 is a **lifecycle** defect: every existing rag test exercises the server's *answers*, none
      exercises its *death*. `local-mirror` has that test and did not leak. That is not luck.
