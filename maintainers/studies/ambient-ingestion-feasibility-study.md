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

### C1 · The cadence is **30 minutes by default, and configurable** — not twice a day

*« deux fois par jour … je pense que c'est pas assez. Je pense que toutes les cinq minutes. »*
Then, an hour later, on hearing what the clock costs: *« les 5 minutes, t'as raison, ça va peut-être
être trop gourmand, on peut partir sur 30 minutes par défaut »*. **The default is 30 minutes** (48
probes a day). Five stays a legitimate setting for someone who wants it and has measured it.

Twice a day was never measured, it was inherited from August's digest framing. The owner wants
**freshness**, not a bulletin: something said in a mail at 09:12 should be known within the half hour,
not at the evening bulletin.

#### ⚠️ The correction that produced the 30 — two different costs were conflated, and this study is why

The owner, same message: *« j'avais aussi compris que l'aspiration ne coûtait pas trop cher en
token »*. **He understood that correctly, from this file.** § *The measured fact* says the August cost
driver *"dissolves"* — and it meant the **BUILD** cost: no OAuth app, no secret, no token store, no
refresh path. It said, and measured, **nothing at all about the RUNNING cost**, and nothing here
flagged that the sentence had a boundary. So the reassurance travelled from one cost to the other
without anyone deciding it should.

**Recorded as a lesson, not a footnote**: *the cost driver dissolves* is only ever true of the cost it
was measured against. Gate 8 exists because of this paragraph.

**What the cadence forces, and it is a design change rather than a number change.** Every look at a
source costs a `claude -p` run, because the connectors are reachable **only** through Claude (the
measured fact this whole study rests on). At 30 minutes that is **48 runs a day**, against 2 — and at
the 5 minutes first asked for, 288. A single-speed clock does not survive either figure. **The shape
becomes two-speed:**

| | Cadence | What it does | What it costs |
|---|---|---|---|
| **The probe** | every 30 min (configurable) | asks each source *"anything new since the watermark?"* and returns **counts, never content** — `is:unread` / unread counts / a `historyId` | one tiny run, a handful of tool calls, no sub-agents, no drafting |
| **The pass** | only when the probe says yes | the full fan-out already designed: sub-agents per source, capture, dedup, file, consolidate | proportional to what actually happened, not to the clock |

- **The probe holds no judgment either** — it compares a count to a watermark. The *decision* to spawn
  stays in the deterministic gatekeeper ([ADR 0009](../decisions/0009-prefer-deterministic-mechanisms.md)).
- **Configurable means a setting with a default, in the brain's config**, not a constant to edit. A
  quiet mailbox should be pollable at 5 minutes; a noisy one may want 15.
- **The cost is a GATE, not an assumption** (gate 8 below). A quiet day is 48 probes and near-zero
  passes; a busy one is 48 probes plus dozens of passes. It must be measured on the owner's real
  sources before any default is defended.
- 🎯 **Three levers matter MORE than the interval, and they are what gate 8 must measure against.** A
  probe's dominant cost is not what it writes, it is what it **loads**: the system prompt plus the
  **tool schemas**, paid in full on every run. So —
  1. **A closed, minimal allowlist is a cost lever, not only a safety one.** Loading the whole
     connector surface on every probe pays for tools it will never call. The design already demands
     a closed list for safety ([§ The shape](#the-shape), point 3); it turns out to be the same
     decision twice.
  2. **The probe may run on a small model.** It holds no judgment by construction — it compares a
     count to a watermark. Reserving the capable model for the **pass** is a large saving on the leg
     that runs 48 times a day and decides nothing.
  3. **Prompt caching.** A probe's prompt and tool set are byte-identical run to run, which is the
     exact case caching was built for.
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

### C4 · What comes OUT — the half the study had never designed _(2026-09-15)_

Everything above designs the intake. **Nothing designed the output**, and the owner's answer is what
turns this from a pipe into a product. Two channels, one invariant, and a style rule that outranks
both.

#### C4.a · The push channel — a Slack DM, consented, batched, and visibly switchable off

- **Consent is asked up front**, in the brain's own words: *« je peux te notifier de temps en temps,
  en t'envoyant un message Slack ? »*. Not a setting buried in a file: a question, once, that the
  person answers.
- **Slack DM is the channel.** ⚠️ It is the deliberate hole in a read-only product, already named
  under part C ([#127](https://github.com/tpierrain/kenjaku/issues/127)): the allowlist is what keeps
  it the size of **one message to oneself**, and it must be opened explicitly or not at all.
- **Batched, not streamed.** Everything worth knowing is merged and delivered at **regular slots**,
  the owner's example being twice a day, mid-morning and mid-afternoon. A pass that finds something at
  09:12 does not send at 09:13; it waits for the slot. **This is what makes a 30-minute clock
  compatible with a person's attention**: the intake cadence and the interruption cadence are two
  different numbers, and conflating them is how ambient systems become spam.
- **Switchable off, and the person is TOLD so at the moment of consent** — *« pour que l'utilisateur
  comprenne bien que si ça le dérange ou ça le gêne, ce mécanisme est débrayable »*. The off switch
  existing is not enough; its existence is part of the offer.

#### C4.b · The interactive channel — the invariant, and the one open question

**The invariant, and it is not negotiable** _(owner, 2026-09-15)_: *« au moment où j'ai la prochaine
interaction, s'il a découvert quelque chose, il faut que je puisse en prendre connaissance »*. Whatever
the brain found, the **next** conversation surfaces it. Nothing waits for the person to think of
asking.

**What is still open, and the owner asked to iterate on it rather than settle it**: *where* in the
exchange it lands — before answering the question, or after it, in the same breath. Recorded as
[open question O1](#o1--where-the-surfacing-lands-in-an-exchange) below rather than decided here.

#### C4.c · The style rule — telegraphic, and it outranks completeness

Stated harder than anything else in the conversation (*« il faut absolument, absolument, absolument
éviter… »*), so it is recorded as a **constraint, not a preference**:

- **Write as if briefing an exec who has four seconds.** Ultra-synthetic. The mental model the owner
  gave: *« un assistant ou une assistante qui essaie de me préserver, préserver ma charge mentale et
  cognitive »*.
- **Every item declares two things: `ACTION` or `INFO`, and why it is structuring.** A notification
  that says what happened without saying what it changes is a line of noise.
- **Walls of text are the failure mode, explicitly.** *« il faut absolument éviter que mes interactions
  avec le second cerveau consistent à lire beaucoup de textes. Ça, c'est ce qui devient pénible. »*
  Volume is not thoroughness here; it is the thing that makes the product unusable.

#### C4.d · The marker — two slots, and it must be an EMOJI before it is ever an SVG

The owner, 2026-09-15: a recognisable *breaking news* mark on every ambient message so the eye learns
to spot them, **then a second mark qualifying it** action or info. *« créer un SVG spécial … pour
qu'on puisse prendre l'habitude de détecter, distinguer ces informations-là. »*

**Two slots, always in this order**: `<the brain caught something> <what it is> · <the line>`.

| Slot | Meaning | Retained |
|---|---|---|
| 1 | *this did not come from your question — the brain went and found it* | **📡** |
| 2 | what it asks of you | **⚡ ACTION** / **ℹ️ INFO** |

- **Chosen against what the product already uses**, measured rather than guessed (`engine-skills/`,
  `templates/`, `CLAUDE.engine.md`): 📡 and ⚡ appear **zero** times, ℹ️ once. **🚨 was rejected
  despite fitting the words**: it already appears **20 times** in the shipped surface, so it marks
  something else, and a marker that collides marks nothing. It is also alarmist, which the product's
  tone rule forbids.
- 📡 over 🔔 or 📣: a bell is every notification ever shipped, and a megaphone shouts. An antenna says
  *picked up*, which is exactly what happened and carries no alarm.

⚠️ **On the SVG, and this is the part that has to be said plainly: an SVG cannot render where he will
mostly read these.** The primary surface is a **chat** (Claude Code in a terminal, or Claude Desktop):
it is text, so an emoji is the only mark that exists there at all. Of the three surfaces —

| Surface | Emoji | A custom SVG |
|---|---|---|
| The conversation (terminal / Desktop) | ✅ works today | ❌ impossible, it is text |
| The batched Slack DM | ✅ works today | ⚠️ possible **only** as a workspace custom emoji: an upload, often admin-gated, and per workspace |
| A note in the vault (Obsidian, Typora) | ✅ works today | ✅ embeddable |

**So the emoji pair IS the marker, and it ships as such.** A custom SVG stays a legitimate later
nicety for Slack and for any future visual surface — never a prerequisite, because gating on it would
mean the mark is absent from the one place it is read most.

> 🔗 **This is the same doctrine as part A, arriving from the other end.** #128 made a prep's first
> screen the whole brief and wired a check that **refuses** an over-long one. C4.c asks for exactly
> that of every ambient message. **The two are one product principle**: what the brain hands a human
> is capped, and the cap is enforced rather than recommended. It is worth its own ADR (and it
> sharpens [ADR 0043](../decisions/0043-graduated-autonomy-and-plain-language.md)'s plain-language
> half, which governs *register* but says nothing about *length*).

### C5 · What earns an interruption — and the error it is allowed to make _(2026-09-15, PM2)_

#### C5.a · Silence in doubt, and doubt DEMOTES rather than discards

*« Il n'y a rien de pire que les faux positifs. Là, les gens, ils vont jeter leur second cerveau à la
poubelle s'il y a ça. »* The asymmetry is settled and it is not close: **precision over recall on the
interrupting channel.**

**But "silence" must not mean "dropped", or the fear of noise costs the feature its whole recall.**
Three output levels, and uncertainty moves an item **down one**, never off the list:

| | Level | Where it lands | What it takes |
|---|---|---|---|
| 1 | 📡 ⚡ **ACTION** | interrupts: before the answer, or the batched DM | a rule below **fires cleanly** |
| 2 | 📡 ℹ️ **INFO** | one line after the answer, or the batch | worth knowing, not worth interrupting — **and this is where every doubt lands** |
| 3 | silent | filed in the vault, findable, said nothing | everything else |

Nothing is lost at level 3 either: it is in the vault and answers a question the day it is asked.

#### C5.b · What actually earns a ⚡ — and the shape hiding in the owner's four examples

His examples, verbatim: a **production problem** (an outage); **important people** (comex, his boss)
*« qui semble s'agacer sur un sujet ou qui relance »*; **complaints or tension from the most important
client**; and people *« qui nous relancent personnellement sur un sujet sur lequel on a un peu de
retard pour leur répondre »*.

🎯 **Three of the four are defined by WHO and by REPETITION, not by what the text says.** That is the
design finding, and it is what buys the precision C5.a demands:

- **The strongest signals are relational and DETERMINISTIC.** *"This person wrote a second time on the
  same thread"* and *"they asked you something four days ago and you have not replied"* are **facts**,
  computable from his own mailbox, needing no judgment about tone. The fourth example is the purest
  form: what makes it urgent is not the message, it is **the pair — someone asked, and he went
  silent.** The brain can see both halves.
- **Tone is a booster, never a trigger.** *"Seems annoyed"* is exactly where false positives are
  manufactured. It may raise an item that a deterministic rule already flagged; it may never raise one
  on its own.
- **So the rule set, in precision order**: (1) a declared VIP writes; (2) a thread is re-raised, or a
  question to him has gone N days unanswered; (3) a declared key account expresses a complaint; (4) a
  system alert on a declared production channel. Tone only re-ranks within those.

#### C5.c · Who counts as important is DECLARED — and the product already has the drawer

A VIP list cannot be inferred without guessing, and guessing here is the false-positive engine. It has
to be stated. **And it already has a home**: a universe's **profile** records *"what this sphere is,
your role in it, the people who matter, the recurring topics"* (the `switch` skill,
[ADR 0034](../decisions/0034-progressive-disclosure-of-universes.md)).

- **No new configuration surface is invented.** The boss, the comex, the key account and the
  production channel are *people and places that matter in this sphere*, which is what that profile is
  for.
- **It is per universe, and that is correct rather than incidental**: a VIP at one employer is nobody
  at the next, and the profile already switches with the sphere.
- ⚠️ **A brain whose profile is empty must not fall back to guessing.** It says it has no VIP list and
  that ⚡ is therefore quiet, which is the honest form of C5.a.

### C6 · It ships ON, gated by a consent question _(2026-09-15, PM3)_

*« On le livre allumé, avec la question de consentement au démarrage. »* Not the owner's private tool,
not an off-by-default option nobody would find. **Every brain gets it**, and the consent question is
what makes that acceptable.

**Three things follow, and none of them is optional:**

1. 🗣️ **The consent question IS the product decision now.** Shipping on means the only thing standing
   between a fresh install and a brain reading its owner's mail is one question, so that question's
   wording carries the whole weight. It must say **what is read**, **how often**, **what it costs**,
   and **that it is switchable off** — in the plain register of
   [ADR 0043](../decisions/0043-graduated-autonomy-and-plain-language.md), not in the machinery's words.
2. 📣 **The product's headline promise gains a sentence, and that is a conversation with the owner, not
   a silent edit.** *"Everything on your machine, nothing leaves"* stays true of the **vault**; it was
   never a claim about the brain reaching **out** to read. But a reader hears it as one. README,
   SETUP and the installer's own framing must say what the brain now does on its own — the
   marketing-surface re-read the repo's conventions already require at every release.
3. 💸 **Shipping on means every installer pays the running cost by default** (gate 8, and PM4 below).
   That is no longer an experiment the owner runs on his own quota.

⚠️ **An upgrade is a different consent moment from a fresh install.** A brain already in the field
would have this switched on *by an update it did not ask for*. The engine update flow already collects
consent; this must be part of it, and must not arrive silently.

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
- [ ] **Gate 8 — what does a probe actually cost, and therefore what cadence is affordable?** _(new,
      from C1.)_ **Measure ONE probe first** — its input tokens are the whole question, since the
      schemas and system prompt are paid on every run — then multiply by the cadence rather than
      arguing about the cadence. Measure it **with the three levers applied** (minimal allowlist,
      small model, caching), because measuring a fat probe would condemn a design nobody proposed.
      Then a quiet day and a busy one on the owner's real sources. ⚠️ The owner has hit quota ceilings
      before, and **this cost is paid by whoever installs the brain**, not by the project.
- [ ] **Gate 9 — prove, by running it, that reading a mail leaves it UNREAD.** _(new, from C3.)_ Read
      one unread message through the connector, then read its labels back. The contracts say it cannot
      mark it read and the allowlist says it cannot be asked to; neither is a measurement.

## Open product questions — the PM pass of 2026-09-15

The owner asked for a product interrogation before any implementation: *« c'est quand même
suffisamment structurant pour qu'on fasse une pause quelques minutes avant de partir sur l'implem »*.
Six questions were put; they are answered here **in the order they were asked**, one at a time.

- [x] **PM1 — when it finds something and nobody is in front, what does it do?** ✅ Answered by C4:
      both channels, with a threshold. The push is a consented, batched, switchable Slack DM; the
      interactive surfacing is an invariant.
- [x] **PM2 — who decides what deserves to interrupt, and which way should it be wrong?** ✅ Answered
      by C5: precision over recall, without discarding (doubt demotes a level). The ⚡ rules are
      relational and deterministic, tone only re-ranks, and the VIP list is **declared** in the
      universe profile that already exists.
- [x] **PM3 — is this the owner's tool, or a feature every brain gets?** ✅ Answered by C6: **every
      brain, shipped ON, gated by a consent question.** Which promotes the wording of that question,
      the product's headline promise, and who pays, to first-order problems.
  - [ ] **O2 — consent to READ or consent to NOTIFY?** The owner's consent question, as he phrased it,
        asks about the Slack message: *« je peux te notifier de temps en temps, en t'envoyant un
        message Slack ? »*. **Reading the sources every 30 minutes is the bigger gesture and is not in
        it.** One question or two, and what a *no* leaves running. Open.
- [ ] **PM4 — who pays, and does the person see it?** Not yet put. Overlaps gate 8.
- [ ] **PM5 — unreviewed pages pile up: then what?** Not yet put.
- [ ] **PM6 — in two weeks, what single observable says this was worth it?** Not yet put.

### O1 — where the surfacing lands in an exchange · ✅ CLOSED 2026-09-15

The owner asked to iterate on this rather than settle it (*« en mode sparring partner »*), framing it
as **before** the answer or **after** it. The counter-proposal was that the frequent case is neither:
what was found often **changes the answer**, and is then context rather than notification.
**Accepted by the owner, 2026-09-15** — placement is decided by **relevance first, urgency second**:

1. **It changes the answer to the question just asked** → it goes **inside** the answer, neither
   before nor after. It is context, and answering without it would be answering wrong.
2. **It needs action from him and it is time-sensitive** → **one line before** the answer. Answering
   first means he reasons on a stale picture for the length of the reply.
3. **Everything else** → **one line after**, or nothing at all if it can wait for the next batched
   slot. The batch exists precisely so the interactive channel does not have to carry everything.

Plus a hard ceiling in every case, per C4.c: **at most 3 lines before the answer and 3 after**, one
item per line. Beyond that it does not grow, it **spills**: *"and 4 more, say « quoi de neuf »"*.
Announced as an intent and not vetoed. **The ceiling is counted by a check, never recommended in
prose** — the same reason #128's brief cap is a script and not a sentence: a written *"be concise"*
holds for a while and then stops, silently.

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
