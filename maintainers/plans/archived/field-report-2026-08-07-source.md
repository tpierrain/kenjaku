# Runtime report — v4.6.0: the RAG MCP server never exits, plus two Windows launcher defects

**Date:** 2026-08-07 · **Engine:** v4.6.0 (`rag` 1.3.0, index schema 2)
**Environment:** Windows 11 Pro 10.0.26200 · Node 22.23.0 · npm 10.9.8 · vault of 112 notes / 849 chunks
**Related:** `second-brain-generator-windows-node20-report.md` (install-time findings, v3.4.0)

These are **runtime** findings, not install-time: the brain installed and worked, then
degraded over successive sessions until the RAG stopped loading entirely. The user-visible
symptom is the worst kind — **the session starts normally, but no `mcp__vault-rag__*` tool
exists at all**, so the brain silently has no access to its own vault.

**Defect 1 is the root cause and is not Windows-specific.** Defects 2 and 3 are Windows-only
and are what pushed an already-fragile startup over the client's 30 s handshake ceiling.

| # | Defect | Platform | Severity |
|---|---|---|---|
| 1 | `rag` server never exits when the MCP client disconnects → orphan pileup on the SQLite lock | all | **critical, self-aggravating** |
| 2 | Generated `.cmd` launchers have LF-only line endings → cmd executes fragments of words | Windows | high, latent |
| 3 | `npx tsx` resolves tsx from the npx cache (registry round-trip) → 9.8 s startup | Windows | medium |

---

## Defect 1 — the RAG server never exits when the client disconnects

### Symptom

Three connection attempts in one session, all identical
(`…\claude-cli-nodejs\Cache\<project>\mcp-logs-vault-rag\*.jsonl`):

```json
{"debug":"Starting connection with timeout of 30000ms", …}
{"debug":"Connection timeout triggered after 30120ms (limit: 30000ms)", …}
{"error":"Connection failed: MCP server \"vault-rag\" connection timed out after 30000ms", …}
```

Four consecutive sessions failed this way. A process census then showed **21 orphaned node
processes** — seven `npx` → `tsx` → node trios, accumulated from 12:00 to 18:15 on a single day.

### Root cause

`rag/src/index.ts` opens the transport (l. 361-363) and then installs a chokidar watcher
(l. 473-482), but **registers no shutdown handler anywhere**. A grep over the whole of
`rag/src` for `stdin.once` / `stdin.on` / `SIGINT` / `SIGTERM` / `onSignal` returns nothing.
The only `process.exit()` calls are the `--once` CLI path (l. 355) and the fatal catch
(l. 488-491).

So when the client gives up and closes the pipe, the process **survives** — the live watcher
keeps the event loop alive indefinitely. Worth noting for the archaeology: before the
live-watcher feature, the process would likely have exited on its own by event-loop
exhaustion. Adding liveness turned an implicit shutdown into a leak.

Each survivor keeps the **exclusive better-sqlite3 lock on `rag/.cache/vault.db`** and a
watcher on the vault. The next session's server contends for that lock, exceeds 30 s, times
out — and leaves *another* orphan behind. **The failure makes the next failure more likely**,
which is why it went from "occasionally slow" to "permanently dead" with no warning in between.

### Evidence: `local-mirror` already does this correctly, and does not leak

The decisive observation is the asymmetry **inside this same repo**. Both servers time out at
session start under the same conditions, yet all 21 orphans were `rag/src/index.ts` and
**zero** were `local-mirror/src/server.ts`.

Measured directly — start the server, close stdin after 8 s, count survivors:

```
rag          : alive before stdin close = 2 / 12s after = 2     ← leaks
local-mirror : alive before stdin close = 2 / 10s after = 0     ← exits cleanly
```

`local-mirror/src/server.ts` has exactly the wiring `rag` lacks (l. 143-171), including a
comment that already states the reasoning:

```ts
/** The real shutdown wiring: process signals, stdin EOF/close, and process.exit. */
process.stdin.once('end', handler);
process.stdin.once('close', handler);
// On a SIGNAL we must ALSO terminate: registering a SIGINT/SIGTERM listener overrides Node's
// default terminate-on-signal, so without an explicit exit here Ctrl-C / SIGTERM would merely …
hooks.onSignal('SIGINT',  …);
hooks.onSignal('SIGTERM', …);
```

### Suggested fix

Port that pattern to `rag/src/index.ts` — ideally by extracting it into a shared helper so the
two servers cannot drift again. On shutdown: stop the watcher, close the DB handle
(`closeDb()` already exists), exit.

A defensive complement worth considering: on startup, **fail fast with a clear message** if
`vault.db` is already locked, instead of blocking silently until the client's timeout. A server
that says "another instance holds the index" is debuggable; one that hangs for 30 s is not.

---

## Defect 2 — generated `.cmd` launchers have LF-only line endings

### Symptom

Patching `rag/launch.cmd` produced this on stderr — note these are **fragments of words** from
the `REM` comment lines, being executed as commands:

```
'lf-heal' n'est pas reconnu en tant que commande interne ou externe…
'epends' n'est pas reconnu…
'M' n'est pas reconnu…
```

### Root cause

Both generated launchers are LF-only:

```
rag/launch.cmd          -> crlf=0  lf_only=20
local-mirror/launch.cmd -> crlf=0  lf_only=15
```

cmd.exe reads batch files by **byte offset**, re-seeking as it goes. With LF-only endings the
offset accounting drifts and cmd resumes mid-token — hence `REM` → `'M'`.

What makes this genuinely nasty is that **it is length-dependent, so it stays dormant**. The
original one-line `npx tsx …` file never triggered it. The moment anyone adds a multi-line
`if ( … ) else ( … )` block, it fires — and the same patch applied to both launchers broke
`local-mirror` while `rag` happened to survive, purely because the files differ in length.
The failure then surfaces at MCP startup, which is about the least observable place possible.

### Suggested fix

Write generated `.cmd` files with **CRLF**. Two secondary points for whoever does that sweep:

- Keep generated `.cmd` comments **ASCII-only** — em dashes and ellipses in `REM` lines are read
  as CP1252 by cmd and add noise to an already fragile parse.
- Note that editing tools (including Claude Code's own `Edit`/`Write`) write LF, so a CRLF fix
  applied by hand is easily undone later. A generator-side test asserting CRLF on emitted `.cmd`
  files would make it stick.

---

## Defect 3 — `npx tsx` resolves tsx from the npx cache, not from `node_modules`

### Root cause

`rag/launch.cmd` ended with `npx tsx rag/src/index.ts`, and `.mcp.json` sets
`cwd` to the **repo root**. But `tsx` is a devDependency of **`rag/`**, not of the root — there
is no root `node_modules`. So npx cannot resolve it locally and falls back to its own cache
with a registry round-trip:

```
"…\npm\bin\npx-cli.js" tsx rag/src/index.ts
"node" "…\npm-cache\_npx\fd45a72a545557e9\node_modules\.bin\..\tsx\dist\cli.mjs" rag/src/index.ts
node --require …\_npx\fd45a72a545557e9\node_modules\tsx\dist\preflight.cjs
```

### Measured impact

Time to `[vault-rag] MCP server running on stdio`, warm cache:

| launcher | rag | local-mirror |
|---|---|---|
| `npx tsx …` | **9.8 s** | (timed out) |
| `node "%~dp0node_modules\tsx\dist\cli.mjs" …` | **2.8 s** | **2.6 s** |

Against a 30 s ceiling, 9.8 s leaves roughly 3× headroom — which disappears entirely under lock
contention. 2.8 s leaves ~10×.

### Suggested fix

```cmd
if exist "%~dp0node_modules\tsx\dist\cli.mjs" (node "%~dp0node_modules\tsx\dist\cli.mjs" "%~dp0src\index.ts") else (npx tsx rag/src/index.ts)
```

`%~dp0` anchors resolution on the script's own directory rather than the caller's cwd, and npx
remains as a fallback. A side benefit that matters for Defect 1: **it removes the `npx` wrapper
process**. That wrapper was the layer that survived when the `tsx` child was killed, so dropping
it shortens the chain that can be orphaned.

---

## Secondary hardening worth considering

- The generator could emit `"MCP_TIMEOUT": "60000"` in the `env` block of the `settings.json` it
  writes. Cheap headroom on cold starts and slow corporate machines.
- `scripts/session-self-heal.mjs` already runs at every session start and already knows the brain
  directory — a natural place to reap orphaned server processes. **But this is a net, not a fix:**
  with Defect 1 corrected it should become unnecessary, and shipping the net instead of the fix
  would just hide the leak.

---

## Reproducer

```
# 1. Orphan leak (all platforms)
#    Start the RAG server, close its stdin, count survivors.
#    Expected for an MCP stdio server: 0. Actual: the process stays alive forever.

# 2. LF-only .cmd (Windows)
#    Add any multi-line "if ( … ) else ( … )" block to a generated launcher
#    and run it: cmd executes fragments of REM comment words.

# 3. Slow start (Windows)
#    Time "npx tsx rag/src/index.ts" from the repo root vs calling
#    rag/node_modules/tsx/dist/cli.mjs directly.
```

---

## Local mitigations applied on this machine (2026-08-07)

Defects 2 and 3 are patched locally, and the 21 orphans were killed. **Both patched files are
engine-generated, so `/update-engine` will overwrite them** and reintroduce the problem — which
is the reason for this report. Defect 1 is untouched locally: it belongs upstream.

After the fixes, `vault-rag` reconnects in ~3 s and `health_check` returns
`{"status":"ok"}` with canary found, index intact (849 rows), embedder ready.
