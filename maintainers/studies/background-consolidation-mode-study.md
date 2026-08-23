<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- STATUS: 🔬 DESIGN STUDY (opened 2026-08-02) — no code, no track, no branch.  -->
<!-- Output of a design conversation with Thomas after his trip. It records the   -->
<!-- DECISIONS and the VERIFIED FACTS so neither is re-derived. The action plan    -->
<!-- comes later, and only after the measurement in § Open questions.              -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Study — the background consolidation mode

- **STATUS:** 🔬 Study. Nothing implemented, nothing branched.
- **Scope:** the RAG engine's process shape, a new "pulse" projection, and how the brain keeps
  itself fresh without ever making the owner wait.
- **Origin:** Thomas, 2026-08-02, in two parts: *"is the last PR too complicated, did we stack
  workarounds instead of treating the root cause?"* and *"there is a mode to invent where Kenjaku
  keeps observing what changes, in parallel, without blocking the interface."*
- **Finding of the session: those two questions have the same answer.** The complexity he smelled
  and the mode he wants are the same missing piece.

## Tracking

- [x] **S0 — The study exists in the repo and records the decisions** _(2026-08-02)_
- [x] **S1 — Land the v4.4.0 release properly** _(2026-08-02 · shipped as tag **`v4.4.0`**, PR #53 →
      `a0ea5d8`, CI 7/7)_. The version-vector defect below was fixed first (`1f5c502`: rag **1.2.0**,
      scripts **1.9.0**), and the release note deliberately does **not** publish the cadence figures —
      it describes the behaviour, so this study stays free to move the durations.
- [ ] **S2 — Measure before designing** (the one gate: § Open questions, first box)
- [ ] **S3 — Decide reader/writer separation on the measurement, not on intuition**
- [ ] **S4 — Write the action plan** (only once S2 has a number)

---

## The need, in Thomas's words

The brain must be **always available to answer**, right now, mid-meeting. That is why the standing
heuristic is *answer immediately from what you already have*. But for that to work well, something
must **keep watching what changes in the world**: meeting transcripts, ongoing topics, pending
items, and a notion of **momentum** on a subject. Today that watching happens **at question time**.
It should happen continuously, in parallel, and never make anyone wait.

## What is already true — VERIFIED, do not re-derive

Each of these was checked in the code during the session. File and line are given so nobody re-opens
the question.

- **The vault is the source of truth; the SQLite index is already a projection of it.** Disposable,
  rebuildable. This is why "delete `.cache` and reindex" always works, and why changing embedder
  loses nothing. **The read-model split already exists in this product** — it was simply never named.
- **There IS a long-lived process with a clock, and it is the `vault-rag` MCP server.** It already
  hosts chokidar, a debounced scheduler and a campaign runner that indexes *and* commits.
- **But its lifetime is the SESSION's, not the machine's.** `.mcp.json.template` declares it as
  `stdio`, so Claude spawns it as a child: close Claude and it dies; open two windows and there are
  **two** of them.
- **Only indexing is protected against concurrent instances.** `ReindexLock`
  (`rag/src/lib/reindex-lock.ts`) is a single-writer lock, pid-based, with a **30-minute** staleness
  window. It protects the index. It does not elect a holder for any other role.
- **WAL is already enabled** (`rag/src/lib/vector-store.ts:181`, `journal_mode = WAL`) — the DB layer
  is already fit for one writer plus concurrent readers.
- **No `busy_timeout` pragma was found.** Under WAL, a writer takes an exclusive lock at commit and
  `better-sqlite3` surfaces `SQLITE_BUSY` immediately instead of waiting. Invisible today because
  nothing writes concurrently; it becomes a **visible error on the question path** the day a
  collector writes.
- **There are NO worker threads anywhere in `rag/src`** (verified). Everything runs on the server's
  main thread, and `better-sqlite3` is synchronous by design.
- **The reader is itself the process's heaviest CPU consumer.** `searchSimilarIn`
  (`vector-store.ts:334-393`) selects the chunks then computes `cosineSimilarity`
  (`vector-store.ts:289`) **in JavaScript, chunk by chunk** — thousands of 768-dimension vectors per
  question, synchronously — after a model forward pass to embed the query. So this is not "a heavy
  writer disturbing a light reader": **both are heavy, on one thread.**
- **Order of magnitude to respect:** `in-process-embedder.ts` documents ~5.3 min for 264 notes. Not
  something to start casually next to a reader expected to answer in a second.
- **Cursors and locks are per-machine.** `.cache/` and `rag/.cache/` are gitignored. Correct for a
  lease (a git-shared lease would be a disaster), but it means each machine re-walks its own path.

## Decisions taken (2026-08-02, with Thomas)

- [x] **The root cause is named: Kenjaku had no place that owns a lifecycle and a clock.** Every new
      need therefore had only two doors: one more `SessionStart` hook, or one more timer in the
      watcher. **Seven `SessionStart` hooks** in `settings.json.template`, and **four** distinct
      mechanisms deciding when a note is persisted, are the symptom of that one absence — not of bad
      code. The compensation vocabulary in the codebase (`self-heal`, `nudge`, `reminder`,
      `reconcile`, `retreat`) is the same symptom read from the outside.
- [x] **❌ REJECTED — a machine-lifetime daemon / user-level service.** Thomas, on install friction.
      **Record the real reasons**, because a wrong reason brings the option back in six months:
      admin rights are **not** the blocker (user-level services exist on all three OSes without
      admin). The actual killers are (1) corporate endpoint security and MDM, for which a persistent
      Node process reaching out to Slack/Notion is a textbook flag; (2) **invisibility** — a dead
      service says nothing, and the owner just sees stale answers with nowhere to look; (3) the
      per-OS support cost that follows. **A silent degraded mode destroys more trust than a missing
      feature.**
- [x] **✅ DECIDED — keep the MCP server per session, and make N instances coexist.** Thomas's own
      proposal, and it is the better one. Generalize the existing `ReindexLock` pattern into a
      **lease**: one instance holds the *collector* role, renews it, and another takes over when the
      holder dies. **Do not reuse `ReindexLock` as-is** — its 30-minute staleness is right for a full
      reindex and far too long for a collector, which wants a short TTL with renewal.
- [x] **✅ DECIDED — "machine on, Claude closed" is NOT the real need.** The real need is *not stale
      at question time*. Because collection is **cursor-based**, nothing is lost while Claude is
      closed, only **deferred**: the lease holder drains the backlog on session start, in the
      background, while questions are already being answered. The only real gap is the first minutes
      of a cold session, and it is covered by an **honest freshness stamp** rather than hidden.
- [x] **✅ DECIDED — no pay-as-you-go API for the semantic layer.** Thomas: the target audience will
      never afford it. **The constraint dissolves rather than being worked around** (see § The three
      layers): most of what was asked for needs no model at all.
- [x] **✅ DECIDED — non-blocking is the ARCHITECTURE CRITERION, not a UX polish applied afterwards.**
      Thomas: *"the most important thing is to almost never block the user."* It is what eliminates
      the dedicated consolidation turn, what makes the semantic layer lazy, and what forces ingestion
      to live somewhere other than the search service.
      **Acceptance criterion, and it is measurable:** *the latency of a question must be the same
      whether the collector is running or stopped.* That can become a test.
- [x] **✅ DECIDED — the volatile/durable rule, which settles where the pulse lives.** Derived from
      what the product already does, so it is not a matter of taste:
      > **Truth is the vault's files and the external sources. Everything else must be
      > reconstructible from them. If a datum is not reconstructible, it is not a projection, it is
      > truth, and it belongs in the vault.**
      Momentum, cursors, hot topics: reconstructible by replaying the sources → **projection →
      internal state, never committed**. A meeting summary, a decision taken, an established fact:
      **not** reconstructible → truth → **a vault note**.
      **Non-regression test that follows:** *we must be able to delete all internal state and rebuild
      it losing nothing.* The day that stops being true, a projection has started holding truth.
- [x] **This is NOT CQRS, and the word must not be imported.** Thomas asked directly. Splitting a
      reader and a writer into two processes is a **deployment and concurrency** decision
      (bulkheading); both sides keep the same schema and the same model. CQRS is a *modelling*
      decision and is independent of process count. `the-hive-pattern` (line 281) already says *"no
      CQRS by default (no golden hammer)"*. **Where the vocabulary IS legitimate: the pulse is a
      second projection** — derived, eventually consistent, shaped for a query the source answers
      badly. Nothing else in this study earns the term.

## The three layers

**The conceptual move, in one sentence: freshness stops being computed at read time (a pull, per
question) and becomes an artifact maintained at write time.**

1. **The ledger — continuous, free, no model, structurally non-blocking.** The lease holder polls the
   wired sources every N minutes and stages raw deltas with a per-source cursor. It lives in the MCP
   process and never touches the conversation.
   **Momentum lands here**: last-signal date, density over a sliding window, direction
   (accelerating / stalling), open items — all of it computed from **timestamps**. Likewise "who is
   talking about what" (the `people/` registry and note titles are an existing entity list) and
   **structural** pendings (an unticked `- [ ]`, a calendar event with no follow-up note, a thread
   where the owner was mentioned and never replied). **Most of what Thomas asked for ships with zero
   semantics.**
   The **local in-process embedder** (already there, free, offline) adds topic clustering and
   **novelty detection** ("this theme did not exist last week") at no marginal cost.
2. **The digest — semantic, and LAZY.** No dedicated turn, ever: that is what would occupy the single
   conversational channel and make the owner wait. Instead, when a question touches a topic, the
   answer path digests the staged material **for that topic only** — small, relevant — and caches it.
   The tokens are spent inside a question that was going to be asked anyway. It self-prioritizes:
   topics that come up get digested, topics that never come up never cost anything.
3. **The question path gets SIMPLER, and this is the test of the whole thing.** Once the pulse is
   maintained, Phase 2's default fan-out can be **removed** for most questions: the answer comes from
   the vault, and the pulse is a query away. Fan-out becomes the exception ("go check now"), not the
   rule.
   > **If the background mode does not DELETE code, we got it wrong.** It must remove the default
   > fan-out, not sit beside it.

## The two blockings — and only one of them is the obvious one

- **Blocking 1, the conversation.** A session has one channel: a consolidation turn would make a
  typed question wait. **Answer: never put background work in the conversation.** Hence the lazy
  digest above. Not "trigger the turn better" — *not needing a turn*.
- **Blocking 2, the MCP server itself, and it is already there.** No worker threads, synchronous
  `better-sqlite3`, and a reader that is itself CPU-heavy. A collector writing continuously makes
  that neighbourhood permanent: a `search_vault` triggered by a question arrives on a busy thread.
  **One can build a background mode that never blocks the conversation and still get slow answers,
  because the blocking moved into the process that serves search.** This is the real trap of the
  project and it is invisible in an architecture diagram.

### If we separate: a child process, NOT a worker thread

Assessed against this codebase specifically:

- **A worker thread SHARES the pid** — and `ReindexLock` identifies its holder by `process.pid`. Main
  thread and its own worker would each conclude "that's me", and **both could index the same database
  at once, silently**. The single-writer lock would stop protecting exactly the case being
  introduced. A child process has a distinct pid, so **the lock becomes correct again for free**.
- **No `tsx` trap, no native-ABI trap.** The server runs via `npx tsx`; instantiating a `Worker` on a
  `.ts` file requires the loader inside the worker too (classic breakage, and typically the kind that
  works locally and fails elsewhere). A child process is just one more `npx tsx`. Likewise
  `better-sqlite3` is the only ABI-bound dep with self-healing rebuild logic (`native-deps.ts`) —
  a rebuild triggered from a worker is far nastier to diagnose.
- **It matches the existing grain**: the engine already spawns child processes (`auto-commit.mjs`,
  `auto-push.mjs`).
- **Memory isolation becomes an advantage.** `createEmbedder()` is memoized per module registry, so a
  worker would load its **own** ONNX pipeline — two copies of the weights on machines already sized
  "≥ 12 GB". A child can load the model and release it without ever inflating the process that serves
  questions.
- **What we lose versus a worker — shared memory — we do not use.** Both sides communicate through
  SQLite in WAL anyway. So the worker's only advantage is void here, and its costs are real.

**Honest sizing, so it is not discovered mid-flight:** this is neither "add a worker" nor "add a
process". It is **splitting the server into a reader and a writer with an explicit boundary**, and it
touches the engine's most central file.

**Design constraint that protects the test discipline:** everything in `rag/src` is built on
injection and purity (virtual clocks in the schedulers, `searchSimilarIn` DB-injectable,
`LoadExtractor` injectable to test without weights). A process boundary is neither injectable nor
virtual-clockable. **So the child must be a dumb shell**: it wires a message channel onto the same
pure functions, nothing more. All logic stays testable in-process; only the transport (a few dozen
lines) is covered by a single integration test. If the shell starts holding logic, the mutation score
becomes decorative.

## Open questions

- [ ] **MEASURE FIRST — this is the gate, and it costs a day instead of a week.** Instrument
      `search_vault` latency during an indexing campaign, on a real vault. **If degradation is small**,
      cooperative slicing (the collector works in small batches and yields) is enough and the whole
      reader/writer architecture is avoided. **If it is large**, that number justifies the split and
      becomes the acceptance criterion above. **Do not design further before this number exists.**
- [ ] **Whether ONNX inference yields the event loop.** It goes through a native module that *may*
      release it. **Measurable, not deducible** — do not assume either way.
- [ ] **Per-source deduplication becomes a design constraint, not a comfort.** Since cursors are
      per-machine (`.cache/` is gitignored), a multi-machine owner re-walks each path. Harmless **if
      and only if** ingestion is idempotent, deduplicated by source message id. **Decide this now,
      not after.**
- [ ] **Source adapters are the real cost of the project.** Claude's own connectors (Slack, Drive,
      Calendar via claude.ai) live on Claude's side and are **not reachable from the MCP server**. The
      collector needs its own adapters with their own credentials. The pattern exists — `local-mirror`
      already does exactly this for Notion — but it is **work per connector**, and it is what will
      dominate the schedule. Do not underestimate it.
- [ ] **`busy_timeout`** must be set consciously before anything writes concurrently (see § verified
      facts).

## Relationship to v4.4.0 — it ships, and Thomas corrected me on why

Thomas floated treating PR #53 as a POC to cherry-pick from later. **Recommendation: no.**

- **7 of the 10 tracks have no relationship whatsoever to this study** (status line, swallowed
  unreadable note, consolidation damaging a page, brain following a moved launcher, first screen,
  `/rag`, profile pre-fill). They are **field fixes** from `fleet-upgrade-field-feedback.md`, i.e.
  defects real owners are hitting now.
- **Cherry-picking 81 commits over 74 files in three months costs more than merging today**, for zero
  new value — and "we'll pick it up later" branches are seldom picked up. The verification (CI green
  7/7, code review with its six findings fixed, mutation snapshot) has a **shelf life**: it holds for
  today's `main`.
- **Tracks 1 and 10 are not throwaway either.** `PersistenceScheduler`'s separation of index cadence
  from persist cadence is **precisely** what a collector needs, and its coalescing is **precisely** the
  protection against `.git/index.lock` contention a background writer requires. It is a foundation,
  not an obstacle. And Track 1 makes true a sentence **v4.3.0 already published**.
- **The one real risk is the PUBLISHED NUMBER, not the code.** Do **not** state "2 minutes of silence,
  10-minute cap" as a contract in the release note: this study will move that cadence. Describe the
  behaviour instead ("your notes are committed on their own, shortly after you stop writing"). One
  paragraph, and we keep the freedom.
  > ✅ **HONOURED 2026-08-02.** The published note carries a plain-language `How it works now` section
  > (write → searchable within seconds → saving waits until you stop, and happens anyway if you never
  > do) plus an explicit *"the exact delays are not a promise"*. No figure is published. `SETUP.md`
  > keeps the two numbers on purpose: it is versioned and travels with the engine, so the release that
  > moves the cadence updates it — a published release note is frozen forever.

### ⚠️ Defect found while discussing this — fix it BEFORE the merge

**Thomas's correction: in this product, merging IS shipping.** The launcher repo *is* the artifact —
anyone installing from `main` gets whatever is on `main`. The "merge now, decide the release note
later" nuance was **wrong** and is withdrawn: merge and release are one event, so Track 9 is the gate,
not paperwork.

And it surfaced a real gap: `engine-manifest.json` carries the engine version vector, and on the
branch **`engineVersion.scripts` is still `1.8.0` and `engineVersion.rag` still `1.1.5`** — identical
to `main` — while the branch changes ~5400 lines under `scripts/**` and `rag/src/**`. The only
manifest change on the branch is the addition of `canonicalRepo`.

Consequence in both directions: a new install would carry v4.4.0 code with a version that does not
describe it, **and** a deployed brain already on `scripts 1.8.0` gets no signal that anything changed.
**The version vector stops describing reality.** The bump belongs in Track 9, before the merge.

> ✅ **CLOSED 2026-08-02** — bumped in `1f5c502` before the merge: rag **1.2.0**, scripts **1.9.0**,
> with `rag/package.json` and its lockfile in step. `indexSchemaVersion` stayed **2**, so v4.4.0 does
> not reindex.
