# ADR 0011 — Indexing and git auto-save use distinct triggers (don't unify on the file-watcher)

- **STATUS:** ACCEPTED (2026-06-14), **AMENDED on one point by
  [`0037-indexing-campaign-is-a-persistence-trigger.md`](0037-indexing-campaign-is-a-persistence-trigger.md)
  (2026-07-28)**: the rejected alternative below — *drive `git commit` from the watcher* — is now
  ADOPTED as an **additional** rung (the end of an indexing campaign that changed something commits),
  because the field showed three writers the hooks never see. Everything else here stands: no rung is
  removed, and ADR 0037 re-examines each of the four costs listed under *"Why not unify on `chokidar`"*.
- **Scope:** Second brain (runtime) — the generated brain's two background mechanisms (indexing + git persistence) in daily use.
- **Related:** [`0006-rag-mcp-is-stable-contract.md`](0006-rag-mcp-is-stable-contract.md)
  (the RAG/MCP hexagon's job is **retrieval**, not version control — this ADR keeps git *out* of it),
  [`0009-prefer-deterministic-mechanisms.md`](0009-prefer-deterministic-mechanisms.md)
  (which already lists `auto-commit.mjs` and `reindex-scheduler.ts` as **two distinct rungs** — this
  ADR *names* that split as a decision), [`0010-debounce-auto-push-to-stop-hook.md`](0010-debounce-auto-push-to-stop-hook.md)
  (same "the **event** is the debounce, not a daemon-timer" reasoning).

## Crux

- **Decision:** indexing is driven by the file-watcher, git persistence by the Claude hooks — and any
  **engine-owned writer** (the updater) commits **its own** writes rather than waiting for those hooks.
- **Key guarantee:** persistence never shares the RAG's failure domain, and **no code path leaves the
  brain's repo dirty** — a dirty tree blocks the startup `git pull --rebase`, which silently costs the
  user their sync.
- **Prior art:** `etckeeper` (Debian/Ubuntu) commits `/etc` into git around each package-manager run,
  precisely so an update never leaves the versioned tree dirty. Step 9 of the updater is the same move.

## Context

The generated brain runs **two** background mechanisms that both react to "a note changed", but for
**different reasons** and on **different triggers**:

| Concern | Trigger | Lives in | Sees the edits of… |
|---|---|---|---|
| **Indexing (RAG)** | **`chokidar`** file-watcher (`vault-watcher.ts` → `ReindexScheduler`, 5 s debounce, incremental sha256) | the **MCP server process** (long-lived, but **only while a brain conversation is open**) | **everyone** on the filesystem: Claude, Obsidian, a manual editor, a sync tool |
| **Git auto-save** | the Claude **`PostToolUse Write\|Edit`** hook (`auto-commit.mjs`) + the **`Stop`** hook (`auto-push.mjs`) | the **Claude client** | **only Claude** (its `Write`/`Edit` tools) |
| **Engine writes** | the **updater itself**, at the end of an update (`update-engine.mjs` step 9) | the **update run** | **only its own** writes (engine-owned, versioned files) |
| **Catch-all sweep** | the **`SessionStart`** hook, *before* the startup pull (`startup-sync.mjs`) | the **Claude client** | **anything** left dirty by anyone — including the update that installed this very sweep |

A natural "DRY" question arises: *`chokidar` already watches the whole filesystem — why not **also**
drive `git commit` from it, instead of from a Claude hook that only sees Claude's own edits?* The
apparent win is real but narrow: the watcher would catch **non-Claude edits** (typically **Obsidian**,
the recommended viewer, or a manual edit) that the `PostToolUse` hook **silently misses** today,
leaving them uncommitted until Claude's next edit.

This ADR records why we **keep the two triggers separate** anyway.

## Decision

**Indexing and git auto-save stay on two distinct triggers. We do NOT move `git commit` into the
`chokidar` watcher.**

- **`chokidar` drives indexing only.** Its 5 s debounce + coalescing is an *asset* for re-embedding
  (don't re-encode mid-write, bundle a write-burst into one incremental pass).
- **Claude hooks drive git** (`PostToolUse` → commit per edit; `Stop` → push once per turn, per
  ADR 0010). Event-exact, serialized per conversation, with tool context available on stdin.
- **An engine-owned writer commits its own writes** (see below). Never pushes — push stays opt-in
  (`secondbrain.autopush`, ADR 0010).
- **A `SessionStart` sweep is the catch-all**, run *before* the startup pull: whatever the two rules
  above missed is committed at the conversation boundary (see "The gap … is now closed").

The shared thing between the two is only **change *detection*** — and we already have it in **two
valid, orthogonal places** (the hook for Claude edits, the sha256 hash for the index). Merging the
*triggers* to "reuse `chokidar`" would be reuse for reuse's sake: it buys little and breaks three
things (below).

### Why not unify on `chokidar` — the costs

1. **It would couple git persistence to the RAG engine — and, worse, share its failure domain
   (against ADR 0006's separation).** Design-wise, the `vault-rag` MCP server's contract is
   **retrieval**; embedding `git commit` in its watcher gives it a second, unrelated responsibility
   (version control). But the sharper point is **resilience / availability — don't put all eggs in one
   basket**: if the backup lived *inside* the MCP, **any** MCP problem (fails to boot on a bare PATH,
   crashes, an ONNX hiccup) would take the **save** down with it. In the Claude hooks, notes keep being
   committed **independently of the RAG server's health**. For a **trust artifact**, the silently
   **unsaved note is the worst failure there is** (ADR 0009's founding context) — persistence must
   **survive a degraded RAG, not share its fate**.
2. **The watcher is "dumb" about *why*; the hook is not.** `chokidar` sees only a **filesystem diff**
   ("a file changed") — it has no idea of the **intent** behind the edit, so its commit message can
   only be generic. The Claude hook, by contrast, capitalizes on the **LLM + tool context** (which
   file, which tool, the surrounding conversation) to write an **intent-bearing, guiding commit
   message**. Driving commits from Claude makes each commit *more useful* — an **explained** history,
   not just a snapshot.
3. **It would re-introduce a timer/coalescing into the *commit* path (against ADR 0009).** Good for
   indexing, bad for commits: a commit could fire **mid-write** (partial file — you'd need
   `awaitWriteFinish`) and would **bundle logically-distinct edits** into one vague commit. This is the
   timer + driftable-bundling that ADR 0010 deliberately *avoided* for the push.
4. **It would amplify the multi-window race.** N brain windows = N MCP processes = **N `chokidar`
   watchers** all attempting `git commit` on the same repo → lock contention + racing commits. The
   `PostToolUse` hook is naturally serialized per conversation. *(See the open multi-window question;
   pushing git writes into the watcher makes it worse, not better.)*

### A writer that is not Claude owns its own commit

The Claude hooks cover **Claude's** edits, by construction. The engine also writes to the brain on its
own account — an update rewrites versioned, engine-owned files (the manifest, `scripts/lib/**`, the
launchers, whatever the reconciler converges). Those writes are **not** Claude `Write`/`Edit` calls, so
**no hook ever fires for them**.

Left to the hooks, they wait for the user's next note edit — which may be days away, or never for
someone who only ever *reads* their brain. And an uncommitted tree is not a cosmetic state: the
SessionStart `git pull --rebase` **refuses to run** on one, so a multi-machine brain silently stops
syncing at every start until a human commits by hand.

So the rule generalizes: **whoever writes owns the durability of that write.** The updater commits at
the very end of its run — after the auto-finalize pass, which writes too — and the invariant it holds
is *an update never leaves the repo dirty*. It is **fail-soft** (a git hiccup must not fail an update
that already landed) and it **never pushes**.

This is not a special case bolted onto the updater: it is what keeps the two-trigger split above from
having a hole in the middle. Any future engine-owned writer that runs outside a Claude tool call
inherits the same obligation.

## The gap (non-Claude edits) is now closed — by a `SessionStart` sweep

The separation left one **honestly-acknowledged gap**: an edit made **outside Claude** (Obsidian /
manual editor) does **not** trigger `auto-commit` and sat uncommitted until Claude's next edit.

- **For the maintainer**, this gap **did not bite** (edits go almost always through Claude).
- **For an end user** of a generated brain, it *can* — they may edit notes directly in Obsidian.
- **And `chokidar` would only half-close it anyway**: the watcher lives in the MCP process, which runs
  **only while a brain conversation is open**. An Obsidian edit with **no Claude session** open → no
  watcher running → no commit either. So the unification doesn't even buy the full coverage it seems to.

What finally forced the remedy was **not** the Obsidian case but the updater's own blind spot:
**step 9 cannot fix the update that installs it.** `update-engine.mjs` rewrites itself mid-run while
the in-flight process keeps the OLD code in memory — so the very update that delivers the
commit-at-the-end still ends dirty, and only the *next* one behaves. A **hook** has no such problem:
it is a fresh node process that reads the `.mjs` off disk on every start, so it is live at the **first
restart after the update**, that update included.

So the remedy this ADR held in reserve is now **shipped** — an **event-bound deterministic sweep**,
not a daemon-timer (same shape as the `Stop`-event push of ADR 0010 — the *event* is the debounce):

- [x] a `git add -A && commit-if-dirty` sweep on a **conversation-boundary event**: `SessionStart`,
      **before** the `git pull --rebase` it exists to unblock (`scripts/lib/startup-sync.mjs`,
      called by `session-status.mjs`) — catches Obsidian/manual edits **and** any engine writer that
      missed its own commit, **without** a timer and **without** touching the MCP;
- [x] **best-effort** (never blocks the start), reusing the `repo-status`/git seams already
      unit-tested for `session-status.mjs` and `auto-push.mjs`;
- [x] with **one thing it must never do**: sweep a tree git left **unmerged**. `add -A && commit` on a
      stopped rebase would bury `<<<<<<<` markers inside a note *and* fake-resolve the rebase, so a
      conflicted tree is left strictly untouched and the banner asks the **human** to resolve it
      (`countUnmerged`, `repo-status.mjs`) — never "commit by hand", which is the one advice that
      would do the damage.

**Step 9 stays** even so: an update that commits its own writes gives an **intent-bearing** commit
naming the version (`engine: update to v4.2.1`), right when the writes happen, instead of a generic
sweep at the next start. The sweep is the **belt** under that suspender — the level-triggered
guarantee that no path, known or future, can leave the repo dirty for long.

The theoretical "catch Obsidian edits even with **no** Claude session" would require an **always-on OS
daemon** (launchd/cron) or a **git-side hook** — heavier, against the "zero daemon" simplicity, and
**out of scope**.

## Consequences

- **Each mechanism keeps the trigger it's good at.** Indexing gets `chokidar`'s coalescing; git gets
  the event-exact, per-conversation-serialized, tool-aware Claude hooks. The review question becomes
  explicit: *"is this change about retrieval (→ MCP/watcher) or about persistence (→ a git hook)?"*.
- **The RAG↔git boundary stays clean** (reinforces ADR 0006): a bug on one side can't silently break
  the other — note persistence and retrieval fail in **independent domains**.
- **The non-Claude-edit gap is closed, not just documented** — by the `SessionStart` sweep, on the
  deterministic event-bound shape this ADR had held in reserve.
- **A dirty tree stays a real signal, so the startup banner must explain it.** Since no engine path
  leaves the repo dirty on purpose, a blocked pull now means something the user needs to read:
  `repo-status.mjs` therefore surfaces git's own reason (locale included) instead of a bare
  "check manually".
- **What the banner accuses had to change with the sweep.** "Uncommitted notes → the auto-commit
  didn't run (silent hooks?)" no longer holds: the line is printed **by** a hook that just tried to
  commit them. Reaching that line now means git **refused** the commit (a missing identity, most
  often), so the banner says that, and points at git's own reason.
- **A self-installing fix must live in a hook, not in the updater.** `update-engine.mjs` replaces
  itself mid-run; a hook is re-read from disk every start. Any future fix that must apply to the
  update *carrying* it inherits this constraint.

## Rejected alternatives

- **Unify on `chokidar` (drive `git commit` from the watcher)** — the three costs above (timer in the
  commit path / RAG↔git coupling / amplified multi-window race), for a coverage win that the watcher's
  own lifecycle only **half** delivers. Refused. **⚠️ Amended by ADR 0037 (2026-07-28):** refused as a
  *replacement* — which is what this ADR was weighing — but ADOPTED as an *addition*. The coupling
  cost was the decisive one, and it only applies to a design that moves persistence into the MCP; with
  the hooks left in place, the new rung can only add commits, never remove one.
- **An always-on OS daemon or a git-side hook** (to commit even with no Claude session) — would close
  the gap fully, but adds an always-running process against the "zero daemon" simplicity and the
  non-dev bare-machine target. Deferred / out of scope.
- **Pretend there is no gap** — dishonest; the gap is real for users who edit in Obsidian. We document
  it and keep the event-sweep remedy ready instead.
