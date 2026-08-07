# Action plan — the RAG server that never leaves, and two Windows launchers that were never tested as text

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
  - [ ] **Confirmed at HEAD.** `rag/src/index.ts` opens the transport (`server.connect`, l. 386-387)
        and later starts the live vault watcher (`startVaultWatcher`, `rag/src/lib/vault-watcher.ts`).
        A grep over `rag/src` for `stdin.once` / `stdin.on` / `SIGINT` / `SIGTERM` / `onSignal` returns
        **nothing**: the only `process.exit()` calls are the `--once` path (l. 380) and the fatal catch
        (l. 524). When the client closes the pipe, the live watcher keeps the event loop alive and the
        process **survives**.
  - [ ] **The archaeology matters** (the reporters spotted it): before the live-watcher feature the
        process would have exited by event-loop exhaustion. **Adding liveness turned an implicit
        shutdown into a leak** — nothing was removed, so nothing looked like a regression.
  - [ ] **Why it degrades instead of failing**: each survivor keeps the exclusive better-sqlite3 lock on
        `rag/.cache/vault.db`. The next session contends for it, exceeds the client's 30 s handshake
        ceiling, times out, **and leaves another orphan**. Measured in the field: **21 orphaned node
        processes** accumulated over one day (12:00 → 18:15), four consecutive dead sessions. The
        failure makes the next failure more likely, which is why it went from "occasionally slow" to
        "permanently dead" with no warning in between.
  - [ ] **The control experiment is what makes this airtight**: both servers time out under the same
        conditions, yet all 21 orphans were `rag`, **zero** were `local-mirror`. Measured — start,
        close stdin after 8 s, count survivors: `rag` 2 → 2 (leaks), `local-mirror` 2 → 0 (exits).
  - [ ] **The fix already exists in this repo**, in `local-mirror/src/server.ts:136-176`
        (`installShutdown` + `realShutdownHooks`, injectable seams, unit-tested in
        `local-mirror/src/test/server-boot.test.ts`), comment included on why a SIGINT/SIGTERM listener
        must **also** exit. **Extract it into a shared helper** rather than copy it: the two servers
        drifting apart is the whole reason we are here.
  - [ ] rag's shutdown has one more job than local-mirror's: **stop the watcher, then `closeDb()`**
        (`rag/src/lib/vector-store.ts:497`, already exists), then exit. Releasing the lock is the half
        that stops the pile-up.
  - [ ] **Fail fast on a locked index** (their defensive complement, and it fits our doctrine): if
        `vault.db` is already locked at startup, say *"another instance holds the index"* instead of
        blocking silently until the client's timeout. A server that says why is debuggable; one that
        hangs for 30 s is not.
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
