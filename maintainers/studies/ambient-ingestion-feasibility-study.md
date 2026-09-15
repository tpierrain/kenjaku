<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- STATUS: 🔬 DESIGN STUDY (opened 2026-09-14) — no code, no branch of its own. -->
<!-- It settles ONE question this repo answered WRONG in August: can anything     -->
<!-- reach the owner's sources with no human present? It can, and it was measured.-->
<!-- The action plan comes later, and only once the gates below are closed.       -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Study — ambient ingestion: what is actually reachable without a human

- **STATUS:** 🔬 Study. Nothing implemented.
- **Scope:** how the brain stays fresh when nobody drives it. Parts B and C of the
  [#119](https://github.com/tpierrain/kenjaku/issues/119) umbrella, split out on 2026-09-14 into
  [#126](https://github.com/tpierrain/kenjaku/issues/126) (ambient ingestion) and
  [#127](https://github.com/tpierrain/kenjaku/issues/127) (the twice-daily digest).
- **Origin:** the owner, 2026-09-14, challenging this repo's own recorded assumption.
- **Supersedes one paragraph of** [`background-consolidation-mode-study.md`](background-consolidation-mode-study.md)
  (§ Open questions, *"Source adapters are the real cost of the project"*). That paragraph is **wrong**
  for the retained strategy, and right only for the rejected strategy 4.

## Tracking

- [x] **S0 — The study exists and records the measured fact** _(2026-09-14)_
- [x] **S1 — Gate 1 closed: the brain's hooks DO fire unattended** _(2026-09-14)_ — the pass needs no
      commit logic of its own, and the design stands unchanged
- [x] **S2 — This study reaches `main`** _(2026-09-14 · `1f6dc49`, PR #122)_, so a second machine
      resuming work finds it in the clone.
- [x] **S3 — Split issue #119 into three** _(2026-09-14)_ — part A is **#128** (owned by
      [`../plans/one-page-briefs-action.md`](../plans/one-page-briefs-action.md)), part B is **#126**
      and part C is **#127**, both of which this study still gates. #119 is now the umbrella only.
- [x] **S3bis — The owner re-decided three parameters** _(2026-09-15)_ — cadence, the page frontier,
      and mail's read semantics. See § *The owner's calls of 2026-09-15*; they override the matching
      lines of § *The decision* and add gates 8 and 9.
- [ ] **S4 — Close the blocking gates**: 2 and 3 (locked screen, token expiry), and now **4, 5 and 8**,
      promoted or created by the 5-minute cadence. Gate 6 (mail scope) is the owner's, gate 9 is a
      single cheap run.
- [ ] **S5 — Write the ADRs.** Two, not one: the one that supersedes
      [`rag/docs/adr/0003`](../../rag/docs/adr/0003-no-daemon-session-trigger.md) arguing with August's
      three reasons one by one, **and** the amendment to
      [`0043`](../decisions/0043-graduated-autonomy-and-plain-language.md) that moves unattended page
      creation off 🔴 (C2), with `consolidate`'s *Out of scope* updated in the same change.
- [ ] **S6 — Write the action plan** (only once the blocking gates have answers)

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

> ⚠️ **Three of this section's parameters were re-decided by the owner on 2026-09-15** — the cadence
> (5 minutes, not twice a day), the frontier (pages ARE written, with a status), and the mail's read
> semantics. They are in § *The owner's calls of 2026-09-15* below, and they **override** the
> matching lines here. The strategy itself, and the three constraints under it, are unchanged.

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
| 4 · Promote a draft into a page | ⚠️ **REVISED by C2** _(2026-09-15)_: the page IS written, carrying a not-yet-reviewed status. Was 🔴 never | the `consolidate` writers, plus the status the RAG must honour |

**The drafts do not go into the vault.** August's volatile/durable rule settles it: a draft is
reconstructible from the captures, therefore a projection, therefore internal state, therefore never
committed. They live beside the cache; only the owner's yes moves one into the vault.

**What this buys, and it is the issue's actual ask**: the owner never launches consolidation and never
waits for it. It is already drafted when they arrive; only the decision is left.

### Does this violate ADR 0003 ("no daemon") and August's rejection?

**This is the argument the ADR has to make, and it must not be made by omission.**

- ADR 0003 forbids *"a permanent background process"*. A job that lives ninety seconds and then exits
  is not one, and this repo already spawns detached short-lived children (`scripts/health-probe-run.mjs`).
  ⚠️ **C1's 5-minute cadence makes this argument harder, and the ADR must not dodge it**: 288 short
  children a day walks and quacks much more like a daemon than two did. The honest form of the argument
  is *no resident process, no open socket, no state held between ticks* — each tick is a fresh process
  that exits, and the machine's own clock is the only thing that persists.
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

## The owner's calls of 2026-09-15 — they override the parameters above

Read on the green part-A PR, and they change the shape of part B rather than its strategy.

### C1 · The cadence is **5 minutes by default, and configurable** — not twice a day

*« deux fois par jour … je pense que c'est pas assez. Je pense que toutes les cinq minutes. »*

Twice a day was never measured, it was inherited from August's digest framing. The owner wants
**freshness**, not a bulletin: something said in a mail at 09:12 should be known by 09:17.

**What this forces, and it is a design change, not a number change.** Every look at a source costs a
`claude -p` run, because the connectors are reachable **only** through Claude (that is the measured
fact this whole study rests on). At 5 minutes that is **288 runs a day**, against 2. A single-speed
clock therefore does not survive its own cadence. **The shape becomes two-speed:**

| | Cadence | What it does | What it costs |
|---|---|---|---|
| **The probe** | every 5 min (configurable) | asks each source *"anything new since the watermark?"* and returns **counts, never content** — `is:unread` / unread counts / a `historyId` | one tiny run, a handful of tool calls, no sub-agents, no drafting |
| **The pass** | only when the probe says yes | the full fan-out already designed: sub-agents per source, capture, dedup, file, consolidate | proportional to what actually happened, not to the clock |

- **The probe holds no judgment either** — it compares a count to a watermark. The *decision* to spawn
  stays in the deterministic gatekeeper ([ADR 0009](../decisions/0009-prefer-deterministic-mechanisms.md)).
- **Configurable means a setting with a default, in the brain's config**, not a constant to edit. A
  quiet mailbox should be pollable at 5 minutes; a noisy one may want 15.
- **The cost is a GATE, not an assumption** (new gate 8 below). A quiet day is 288 probes and near-zero
  passes; a busy one is 288 probes plus dozens of passes. That has to be measured on the owner's real
  sources before the default is defended, and it is the one thing that could push the default off 5
  minutes.
- ⚠️ **It also promotes two gates from "nice to measure" to BLOCKING**: `busy_timeout` (gate 4) and the
  indexing-latency question (gate 5). Writing twice a day never contends; writing every few minutes,
  while the owner is typing a question, is the exact case both were written for.

### C2 · Pages ARE written unattended, carrying a **status**, and we iterate on use

*« je pense qu'il faut que les pages soient écrites. Il y a peut-être une question de statut qui n'est
pas encore revue … j'aimerais qu'on itère un peu avant pour voir les usages. Et surtout l'impact sur
les utilisateurs. »*

This moves stage 4 of the table above from 🔴 *never* to written-with-a-status. **It is a deliberate
amendment of [ADR 0043](../decisions/0043-graduated-autonomy-and-plain-language.md)**, which rates
page creation 🔴 — *"a page is a fact the vault will answer with for years"* — and of
[`consolidate`](../../engine-skills/consolidate/SKILL.md)'s own *Out of scope*. Both must be updated
in the same change, or the doctrine and the behaviour disagree.

**And 0043's own argument supports the amendment, which is why it is an amendment and not a
contradiction.** The ADR buys autonomy with a safety net: *"everything the brain writes is
auto-committed, so every 🟢 and 🟡 gesture is one `git revert` away"*. A page written by the pass is
auto-committed like any other write, so it is **more reversible than the ADR credited it**. What made
it 🔴 was not the write, it was the **fact becoming authoritative**. So the status is what carries the
whole decision:

- **A page the owner has not reviewed is marked as such in its frontmatter**, and the mark is
  load-bearing rather than decorative.
- **The RAG must honour it**: an unreviewed page is citable, and it is cited **as unreviewed**. A
  status the search layer ignores is decoration, and decoration is exactly how a provisional fact
  becomes a permanent one.
- **Identity resolution is the sharp edge.** Creating a person's page decides how the vault names them
  from then on, and every later resolution resolves against it. An unreviewed person-page must not
  silently become the canonical spelling.
- **Iterate on use, explicitly.** The owner asked for this to be tried and watched, not settled on
  paper. So it ships with the status, and the question *"which page types may be written unattended"*
  stays open **on evidence**, not on argument.

### C3 · Mail is read **without being marked read** — and that is the user's gesture, not the brain's

*« il faut aller les lire sans les marquer comme lus … c'est moi qui le marquerai dans mon client de
mail classique. »* The workflow he described: the pass reads everything, spots what must be done or is
urgent, tells him, and **he** opens the mail himself if he wants it.

**Feasible, and the guarantee is structural rather than a promise** _(read off the connector's tool
contracts, 2026-09-15)_:

- **Reading does not mark read.** `Gmail__search_threads`, `Gmail__get_thread` and `Gmail__get_message`
  are read RPCs and change no label. Marking read is a **different tool** —
  `Gmail__update_message_labels`, removing the `UNREAD` label — and an explicit call.
- **So it is the allowlist that carries it**, exactly like every other write: `update_message_labels`,
  `label_message`, `trash_*`, `mark_*_spam` are simply **absent**, and `--permission-mode dontAsk`
  makes a stray attempt **fail** instead of hang. The pass cannot mark a mail read even if instructed
  to.
- **"Send me back to that mail" needs a link, so the capture keeps the message id.** A Gmail message is
  reachable by its id, and searchable by `rfc822msgid:`. A capture that names a mail without a way back
  to it forces him to search his own inbox, which is the friction the feature exists to remove.
- ⚠️ **Verified from the contracts, NOT measured** (new gate 9). One real run on one unread mail, then
  read the label back: it must still be `UNREAD`. Cheap, and it is the kind of claim that must not be
  believed on documentation alone.

### What these calls do NOT answer

**Mail scope is still open** (gate 6). C3 settles *how* mail is read; it says nothing about **which**
mail is in, and what must never be filed. That remains the owner's call and the most sensitive one.

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
      - **The pass will push to the remote on its own**, at every pass, if the brain has one and
        `secondbrain.autopush` is on. Intended (it is the backup), but it must be said out loud — and
        under C1's cadence the existing push debounce is what stops it becoming a push storm.
      - **All nine `SessionStart` hooks fire too.** The pass therefore runs the whole startup
        machinery — the uncommitted-notes sweep, the detached health probe, the actions-log seed, the
        universe reminder — with nobody reading their output. Harmless is a *hypothesis* here, not a
        finding: check what each one does when its audience is a log nobody opens. ⚠️ **C1 multiplies
        this by 144**: nine hooks per pass, potentially every 5 minutes, is no longer a footnote — it
        is part of gate 8's cost, and a reason the cheap **probe** must not be a full brain session.
- [ ] **Gate 2 — does an unattended run survive a locked screen?** launchd runs in the user session and
      keychain access on a locked Mac is the classic failure. Schedule one real run, read the exit code.
- [ ] **Gate 3 — how does connector auth expire, and what does the run see when it does?** Undocumented.
      This is what turns *"the digest says DOWN"* from a sentence into the thing that saves the feature.
- [ ] 🔴 **Gate 4 — `busy_timeout`**, unset today, before anything writes concurrently. **Promoted to
      BLOCKING by C1**: at 5 minutes the pass writes while the owner is typing, which is the exact
      contention this was filed against. At twice a day it was nearly theoretical.
- [ ] 🔴 **Gate 5 — August's measurement**, unchanged in substance: does indexing degrade search
      latency enough to justify a reader/writer split? **Promoted to BLOCKING by C1** for the same
      reason — the question stops being "does a rare reindex hurt" and becomes "does a reindex every
      few minutes hurt the answer the owner is waiting for".
- [ ] **Gate 6 — mail scope.** Which folders or labels are in, and what must never be filed. A product
      decision, and the most sensitive source. **Still open after C3**, which answered only *how* mail
      is read, never *which* mail.
- [x] **Gate 7 — is drafting worth it unattended? ✅ ANSWERED by C2, 2026-09-15: yes, and further —
      the page is written**, carrying a not-yet-reviewed status, and the question of which page types
      may be written unattended is settled **on observed use**, not on paper. The token cost of work
      that may never be read is folded into gate 8.
- [ ] **Gate 8 — what does the 5-minute cadence actually cost?** _(new, from C1.)_ 288 probes a day
      plus one pass per real delta, on the owner's real sources. Measure a quiet day and a busy one
      before the default is defended. It is the one finding that could move the default off 5 minutes,
      and the owner has hit quota ceilings before.
- [ ] **Gate 9 — prove, by running it, that reading a mail leaves it UNREAD.** _(new, from C3.)_ Read
      one unread message through the connector, then read its labels back. The contracts say it cannot
      mark it read and the allowlist says it cannot be asked to; neither is a measurement.

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

## What this changes for the #119 umbrella

- **Part A (one-page briefs, #128) is independent** of all of this and was **built** first. It left
  this study on 2026-09-14 and is now [`../plans/one-page-briefs-action.md`](../plans/one-page-briefs-action.md).
  **It does not RELEASE on its own** (owner, 2026-09-15): part B is the bulk of the release, and A's
  green PR waits for it. *Independent to build* and *shippable alone* are not the same sentence, and
  this study said only the first.
- **Part B (#126) is feasible without new secrets**, which was not known when the issue was written. Its
  *"Decided: launchd"* line becomes *"strategy 1, pending the gates"*.
- **Part C (#127)'s outbound DM is a deliberate hole in a read-only product.** The measured fact shows the
  write tool is already within reach of an unattended run, so the allowlist is what keeps the hole the
  size of one message, and part C must open it explicitly or not at all.

## How to re-check this study's premise

The central claim is re-runnable. The `claude -p` command in § The measured fact must still print
`SUCCEEDED n=<n>` on the owner's machine. The day it stops, this study's premise is gone, and strategy 4
comes back onto the table.
