<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- STATUS: 🔬 DESIGN STUDY (opened 2026-09-14) — no code, no branch of its own. -->
<!-- It settles ONE question this repo answered WRONG in August: can anything     -->
<!-- reach the owner's sources with no human present? It can, and it was measured.-->
<!-- The action plan comes later, and only once the gates below are closed.       -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Study — ambient ingestion: what is actually reachable without a human

- **STATUS:** 🔬 Study. Nothing implemented.
- **Scope:** how the brain stays fresh when nobody drives it. Issue
  [#119](https://github.com/tpierrain/kenjaku/issues/119), parts B and C.
- **Origin:** the owner, 2026-09-14, challenging this repo's own recorded assumption.
- **Supersedes one paragraph of** [`background-consolidation-mode-study.md`](background-consolidation-mode-study.md)
  (§ Open questions, *"Source adapters are the real cost of the project"*). That paragraph is **wrong**
  for the retained strategy, and right only for the rejected strategy 4.

## Tracking

- [x] **S0 — The study exists and records the measured fact** _(2026-09-14)_
- [x] **S1 — Gate 1 closed: the brain's hooks DO fire unattended** _(2026-09-14)_ — the pass needs no
      commit logic of its own, and the design stands unchanged
- [ ] **S2 — This study reaches `main`.** It lives on `study/ambient-ingestion-feasibility`, green on
      the Windows tripwire (the only job a branch push runs; the full matrix needs a PR or `main`).
      **Until it is merged, the door on `main` does not name it**, so a second machine resuming work
      will not find it.
- [ ] **S3 — Split issue #119 into three.** Part A (one-page briefs) depends on none of this and ships
      first; B and C wait on the gates below.
- [ ] **S4 — Close gates 2 and 3** (locked screen, connector-token expiry)
- [ ] **S5 — Write the ADR** that supersedes [`rag/docs/adr/0003`](../../rag/docs/adr/0003-no-daemon-session-trigger.md),
      arguing with August's three reasons one by one rather than around them
- [ ] **S6 — Write the action plan** (only once the gates have answers)

---

## The measured fact — and it is what makes this study necessary

**A Claude Code run with no human present sees the claude.ai connectors and successfully calls them.**
Measured 2026-09-14, macOS, Claude Code 2.1.220, from a scratch directory outside any brain:

```bash
claude -p "Call mcp__claude_ai_Google_Calendar__list_calendars, then report SUCCEEDED or FAILED." \
  --permission-mode dontAsk --output-format text \
  --allowedTools "mcp__claude_ai_Google_Calendar__list_calendars"
# → SUCCEEDED n=2
```

The same run enumerated `mcp__claude_ai_{Gmail,Google_Calendar,Google_Drive,Notion,Slack,Miro}__*`.
No prompt appeared; nobody approved anything.

Three consequences, none of them small:

1. **No new OAuth app, no new secret on the machine.** August's cost driver dissolves for anything
   routed through Claude.
2. **The write tools are in that list too** — `slack_send_message`, `Gmail__send_message`,
   `Google_Calendar__create_event`. An unattended run inherits the owner's **full** connector surface.
   **The allowlist is therefore load-bearing, not hygiene.**
3. **`--bare` silently breaks authentication.** The same command with `--bare` answers
   *"Not logged in · Please run /login"*. Whatever ships must not use it, and must read that string as
   a failure to surface, never as an empty result. (`--bare` also skips hooks, so it defeats both
   halves at once.)

## The decision — strategy 1, the owner's call, 2026-09-14

**A small local JS program in the brain, woken by the machine's clock, which wakes a service Claude
that only ever reads.** Not the cloud routine (strategy 2): *"plutôt l'option qui ne passe pas par
Anthropic"*. The vault stays on the owner's machine.

Three constraints stated with the choice, and they outrank convenience:

- **It must never block the person.** A question typed while a pass runs waits for nothing.
- **It works through sub-agents**, one per source, so no raw transcript ever lands in a context a
  human is also using.
- **It must not be able to write outwards.** No mail, no Slack message, no calendar event.
  *"C'est juste pour se rafraîchir."*

### The shape

1. **The waker is dumb and deterministic.** A JS script on a launchd interval. It reads the per-source
   watermark, decides *stale / not stale*, and either exits or spawns the pass. It holds no judgment,
   so it is a pure function plus an exit code ([ADR 0009](../decisions/0009-prefer-deterministic-mechanisms.md),
   rungs 1 and 2).
2. **The pass is a separate short-lived process** — `claude -p` in the brain folder. It is not the
   owner's session and shares nothing with it.
3. **The toolset is a closed read-only allowlist on the command line.** Every write tool is absent, so
   it cannot be reached by a mistaken instruction, a confused model, or a prompt-injected transcript.
   `--permission-mode dontAsk` makes anything outside the list **fail instead of hang**. This is the
   seam that carries the "no dangerous gesture" constraint, and it is deterministic rather than
   prose a model could misread.
4. **Fan-out to sub-agents, one per source**, reusing [`sync-sources`](../../.claude/skills/sync-sources/SKILL.md)
   unchanged: each returns a small summary, never the raw material.
5. **It files through the existing deterministic builders** — `scripts/dated-note-path.mjs`,
   `scripts/file-back-note.mjs`, `scripts/known-source.mjs` for dedup — and obeys
   [ADR 0034 §5](../decisions/0034-progressive-disclosure-of-universes.md): a source's universe is
   frozen at declaration, so a pass firing while the owner switches universe must not follow the switch.
6. **It writes a watermark per source**: last successful pass, and what it covered.
7. **Contention is already handled**: `ReindexLock` makes a pass and a session step aside instead of
   both indexing. `busy_timeout` is still unset and must be set before two processes write.

### Where the clock lives, and where the work happens

**The clock lives in no MCP server, and that is the whole point.** Three components, one of them new
to the machine:

```text
<the brain>/
├── .claude/ingest.plist      # NEW · the machine's clock. Six lines, no logic
├── scripts/ingest-tick.mjs   # NEW · the gatekeeper: is a pass warranted?
├── rag/src/index.ts          # UNCHANGED · the server that answers questions
└── vault/                    # the one meeting point
```

The gatekeeper holds no judgment and no network:

```text
on(tick)
  if a pass is already running   → exit 0
  if every source is fresh       → exit 0
  spawn the pass, detached
  exit 0                         # it returns immediately; it never waits
```

- **The pass writes files. It never calls the search server.** The running session discovers the new
  notes through the chokidar watcher it already runs. **The seam between ingestion and the brain is
  the filesystem** — the product's own doctrine: the vault is truth, the index is a projection.
- **Non-blocking is therefore structural, not a promise.** The pass is a separate OS process, so there
  is no shared queue in which a typed question could be stuck behind a harvest. This is already
  August's acceptance criterion — *the latency of a question is the same whether a pass is running or
  not* — and it becomes a test.
- **Nothing indexes while Claude is closed, deliberately.** The pass writes; the next session indexes
  at startup as it already does ([ADR 0002](../../rag/docs/adr/0002-non-blocking-mcp-startup.md) /
  [0003](../../rag/docs/adr/0003-no-daemon-session-trigger.md)). No second unattended indexer is invented.
- **`rag/src/index.ts` gains nothing.** `ReindexScheduler` and `ReindexLock` already coalesce and
  serialize; a new writer is the case they were built for.

### How far up the pipeline the pass may go — dropping raw files is NOT enough

The owner's question, 2026-09-14: *"il y a cette phase de récupération de fichiers bruts et puis cette
phase d'analyse, de consolidation que fait Kenjaku. Est-ce que celle-ci sera intégrée ?"*

**The frontier is already decided by the product, not by this study.**
[`consolidate`](../../engine-skills/consolidate/SKILL.md) declares under *Out of scope*: *"Deciding on
its own to consolidate and writing unattended (always proposed, always confirmed)"*, and
[ADR 0043](../decisions/0043-graduated-autonomy-and-plain-language.md) rates page creation a 🔴 —
*"a page is a fact the vault will answer with for years"*. Creating a person's page decides how the
vault names them from then on, and every later identity resolution resolves against it.

So the pass runs three of the four stages and stops at the fourth:

| Stage | Unattended? | What it reuses |
|---|---|---|
| 1 · Capture the deltas, dedup, file as raw | ✅ | `known-source.mjs`, `dated-note-path.mjs`, `file-back-note.mjs` |
| 2 · Detect what needs consolidating | ✅ | **`consolidate-scan.mjs` already is a deterministic scanner with an exit code** |
| 3 · Draft each merge (read-only sub-agents) | ✅ | the `consolidate` fan-out, unchanged; writes nothing durable |
| 4 · Promote a draft into a page | 🔴 **never** | the owner's yes, in one batched message |

**The drafts do not go into the vault.** August's volatile/durable rule settles it: a draft is
reconstructible from the captures, therefore a projection, therefore internal state, therefore never
committed. They live beside the cache; only the owner's yes moves one into the vault.

**What this buys, and it is the issue's actual ask**: the owner never launches consolidation and never
waits for it. It is already drafted when they arrive; only the decision is left.

### Does this violate ADR 0003 ("no daemon") and August's rejection?

**This is the argument the ADR has to make, and it must not be made by omission.**

- ADR 0003 forbids *"a permanent background process"*. A job that lives ninety seconds twice a day is
  not one, and this repo already spawns detached short-lived children (`scripts/health-probe-run.mjs`).
- August rejected *"a machine-lifetime daemon / user-level service"* for three reasons.
  **Reason 1** (corporate endpoint security flags a persistent Node process reaching out to Slack)
  weakens a lot: the network calls are made by Claude Code, already installed and already trusted on
  that machine. **Reason 3** (per-OS support cost) weakens: macOS only, at first.
  **Reason 2 does not weaken at all**, and becomes the design constraint below.

## The constraint that outranks the choice — a dead job must be loud

August, verbatim: *"a dead service says nothing, and the owner just sees stale answers with nowhere to
look. A silent degraded mode destroys more trust than a missing feature."* Nothing measured here
touches that. So these are not options:

- **Freshness is stated, always** — the last successful pass per source, not only when something broke.
- **The source-liveness control query is mandatory.** It is already specified in `sync-sources`
  § Source liveness, and a background pass is exactly the case it was written for: zero rows on a
  keyword-free control means the source is DOWN, gets its own line, and forbids every negative claim
  that depended on it.
- **"Not logged in" and an expired token are DOWN, not empty.** Measured above as a real string.
- **No pass at all is itself a signal.** If the clock never fires, nothing produces the report that
  would say so. Session start must notice *"no ingestion pass since &lt;date&gt;"* from the watermark
  file — a deterministic check, not a report the missing job was supposed to write.

## Open questions — the gates, each with what closes it

- [x] **Gate 1 — do the brain's hooks fire in an unattended run? ✅ YES, all three families.**
      _(measured 2026-09-14)_ In a throwaway git repo carrying marker hooks, without `--bare`:

      ```bash
      claude -p "Use the Write tool to create note.txt containing hello." \
        --permission-mode dontAsk --output-format text --allowedTools "Write"
      # → DONE, exit 0, note.txt written
      # → SessionStart FIRED · PostToolUse FIRED · Stop FIRED
      ```

      **So the pass needs no commit logic of its own**: `PostToolUse → auto-commit` and
      `Stop → auto-push` carry it, exactly as they do for a human session. Two consequences to design
      around rather than discover:
      - **The pass will push to the remote on its own**, twice a day, if the brain has one and
        `secondbrain.autopush` is on. Intended (it is the backup), but it must be said out loud.
      - **All nine `SessionStart` hooks fire too.** The pass therefore runs the whole startup
        machinery — the uncommitted-notes sweep, the detached health probe, the actions-log seed, the
        universe reminder — twice a day with nobody reading their output. Harmless is a *hypothesis*
        here, not a finding: check what each one does when its audience is a log nobody opens.
- [ ] **Gate 2 — does an unattended run survive a locked screen?** launchd runs in the user session and
      keychain access on a locked Mac is the classic failure. Schedule one real run, read the exit code.
- [ ] **Gate 3 — how does connector auth expire, and what does the run see when it does?** Undocumented.
      This is what turns *"the digest says DOWN"* from a sentence into the thing that saves the feature.
- [ ] **Gate 4 — `busy_timeout`**, unset today, before anything writes concurrently.
- [ ] **Gate 5 — August's measurement**, unchanged: does indexing degrade search latency enough to
      justify a reader/writer split? Independent of everything above, and still unmade.
- [ ] **Gate 6 — mail scope.** Which folders or labels are in, and what must never be filed. A product
      decision, and the most sensitive source.
- [ ] **Gate 7 — is drafting worth it unattended?** Drafts cost tokens for work that may never be read,
      and a draft ages. Alternatives: draft only the strongest candidates, or draft at session start
      rather than in the pass. Decide on use, not now.

## The rejected strategies, recorded so they are not re-proposed

- **2 · Cloud routine.** Runs on Anthropic infrastructure, clones the brain's repo, has the account's
  connectors, works with the Mac closed. **Rejected by the owner**: it clones the vault off the
  machine, in a product whose flagship option is *"everything on your machine, nothing leaves"*. It
  also needs a remote, which is opt-in today.
- **3 · In-session lease collector** (August's own decision). **Not rejected — it is the floor.** The
  brain must still close the gap when a session opens after a weekend, whatever the clock does. It
  simply does not deliver part C on its own.
- **4 · Own adapters, own credentials.** Four OAuth apps, four token stores, four refresh paths, over a
  confidential vault. Rejected, and now for a second reason: the measured fact makes it unnecessary.

## What this changes for issue #119

- **Part A (one-page briefs) is independent** of all of this and ships first, on its own.
- **Part B is feasible without new secrets**, which was not known when the issue was written. Its
  *"Decided: launchd"* line becomes *"strategy 1, pending the gates"*.
- **Part C's outbound DM is a deliberate hole in a read-only product.** The measured fact shows the
  write tool is already within reach of an unattended run, so the allowlist is what keeps the hole the
  size of one message, and part C must open it explicitly or not at all.

## How to re-check this study's premise

The central claim is re-runnable. The `claude -p` command in § The measured fact must still print
`SUCCEEDED n=<n>` on the owner's machine. The day it stops, this study's premise is gone, and strategy 4
comes back onto the table.
