---
name: sync-sources
description: "Fan-out/fan-in architecture to pull in the DELTA of external sources (Slack, Google Drive / transcripts, Calendar, mail…) via parallel READ-ONLY sub-agents. Internal technical reference — it's the engine of Phase 2 of the main flow (question → sync sources in background) and of a possible morning briefing. Not a user command: it's your questions that trigger the pull."
version: 1.1.0
---

# Sync sources — Fan-out/fan-in architecture (internal reference)

> **This is not a user command.** This file documents the sub-agent architecture
> of **Phase 2** of the main flow (sync sources in background — see `CLAUDE.md`). You
> never trigger the pull by hand: it's the question that triggers it. Note: `/sync`
> is a **separate** command that synchronizes the git repo between machines.
>
> 🔧 **Adapt to your connectors.** The examples below reference MCP tools generically
> (`mcp__<slack>__…`, `mcp__<drive>__…`, `mcp__<calendar>__…`). Replace them with the
> real names of the connectors you've wired up (see [SETUP §6](../../../SETUP.md)). Without a wired
> connector, this skill does nothing — the RAG engine answers on its own from the vault.

## Absolute constraint

**READ-ONLY.** Never send a message, an email, or a reaction. Never post in
a channel. Produce only local markdown files in the vault.

## Sub-agent tooling — NEVER a shell to process text

The sub-agents are **LLMs**: they read and summarize **by reasoning**, not via the shell.
**Forbidden to use `python3 -c`, `python`, `node -e`, `awk`, `sed`, `jq`, `grep`, `cat`,
`head`, `tail` — or any Bash command — to parse, load, split, slice or summarize
content.** Why this is non-negotiable (especially on Claude Desktop, Code tab):

- each ad-hoc command is **unique** → it re-triggers an **authorization prompt** on every
  call (endless prompts, impossible to pre-authorize);
- some (multi-line, `#` inside an argument, redirections) are **refused for security** and
  don't even offer "Always allow" — the user *cannot* accept them.

Instead:
- **Read content** → the **`Read`** tool (a vault file; or a large tool result
  that Claude offloaded to `…/tool-results/…`: read it with `Read`, not with `python3 -c "open(...)"`).
- **Write** the raw source / the briefing → the **`Write`** / **`Edit`** tools.
- **Split** ("up to the Details section", "the first 4000 characters"…) → **in your head**,
  not in Python.

`Read`/`Write`/`Edit` are pre-authorized and silent. The shell is not and never will be
reliably so: don't use it for text manipulation.

## Why this architecture

To avoid *context rot* (quality degrades as early as ~50-70k tokens of context), we **never**
pull the sources into the main context. We orchestrate **sub-agents in parallel**:
each reads ONE source, extracts the delta from it, and returns only a **pre-digested signal (~500 tokens)**.
The main context only receives these compact summaries and does the synthesis.

```
question (or morning briefing)
    │
    ├─► N sub-agents: transcript-extractor (one per new document/transcript)
    ├─► 1 sub-agent: chat-extractor      (mentions + DMs since the last pass)
    ├─► 1 sub-agent: my-actions          (what YOU did/wrote since the last pass)
    ├─► 1 sub-agent: calendar-reader     (today's agenda) — often fast, can stay inline
    ▼
main context = final synthesis (~3-5k tokens of input)
    → vault/briefings/YYYY-MM-DD.md  (if briefing)
    → vault/actions-log.md           (append)
```

## People registry (backlinks)

For consistent `[[people/firstname-lastname]]` backlinks (no broken links), the sub-agents
rely on the cards in `vault/people/`. Shape of a link, when you have a full name: **kebab-case, no
accents** (`[[people/jane-doe]]`). The backlink may point at a page that doesn't exist yet
(*dangling links* OK); do not create the target pages.

**When you only have a first name, you have no link to write** — not a shortened one, not a completed
one. See "Identity discipline" just below: the name stays plain text. This section describes the
*shape* of a link once the person is resolved; it never asks you to produce a full name you don't have.

## Connector discipline

> **Before anything you say about the data can be true, the data has to come from the right
> organisation.** The native connectors are single-account and do **not** follow a `/switch`: after
> moving from one sphere to another, Slack is still authenticated on the workspace you left while the
> profile page on screen declares the new one. The brain then reads one organisation's messages and
> files them under another's name — with every rule below applied, correctly, to the wrong company's
> data. Nothing in the vault reveals it afterwards: the note looks right.

1. **A declared account is a claim, never an observation.** The `## Connector accounts` section of a
   universe profile is hand-typed by its owner. It tells you which workspace this sphere is *meant*
   to use; it says nothing about where the connector actually is right now.
2. **The observation is the sub-agent's, the check is yours.** The sub-agents read external sources
   and never see the vault, so they cannot compare anything — exactly like the novelty check. The
   chat sub-agent **returns the workspace it was on**; the main context is the only step holding both
   that and the profile, so it is the one that checks.
3. **Do not compare the two strings yourself — run the check.** `acme.slack.com`,
   `https://acme.slack.com/archives/…` and `acme` are one workspace, and an alarm raised on a
   correctly connected brain teaches its owner to stop reading the check:
   ```bash
   node scripts/set-universe-profile.mjs --check-slack "<workspace the sub-agent reported>"
   ```
   It answers in one line and **exits non-zero only on a divergence**. Its four answers are four
   different situations: matching, diverging, *"I could not find out"*, and *"this universe declares
   no Slack account"*. Relay the one you got; never round the last three up to the first.
4. **A divergence is a hard block on filing.** Do not write the fetched material into the vault, and
   do not answer from it as if it were this sphere's. Say which workspace the connector is on, name
   the one the universe declares, and stop there — reconnecting Slack is the owner's move, not yours.
5. **The connectors nobody can interrogate stay unverified, and say so.** Slack is the only tool this
   check covers, on purpose: it is where the mistake costs the most and the one that answers cleanly.
   Notion, Drive, mail and the rest are **declared and unverified** — usable, but never presented as
   confirmed, and never quietly promoted to "checked" because Slack passed.

## Identity discipline

> **Read the vault before you write about the people in it.** A briefing once turned the source's
> *"Jérémy (front Candor)"* into *"Jérémy Hinard"* — a surname that exists nowhere but in that note.
> The next resolution then resolves against the fabrication.

1. **Resolve before you write.** Before naming a person in a note, read what the vault already says
   about them: the `people/` cards (the active universe's **and** the root's cross-cutting ones) and
   the organisation notes. The vault outranks both your memory of this session and the source's
   shorthand.
2. **Never invent the missing half of an identity.** A first name with no surname **stays a first
   name**: write it as plain text, never as `[[people/…]]`, and never complete it with a surname the
   source did not give you. *"Jérémy (front Candor)"* is written *"Jérémy (front Candor)"*. Losing a
   backlink costs a click; a fabricated identity is permanent, gets indexed, and becomes what the
   next resolution resolves against.
3. **Ask the vault before you call anything new.** A fact is only *new* relative to what the vault
   already holds, so run a `search_vault` on it before presenting it as news — and read what comes
   back. A briefing once republished a two-month-old fact as a scoop, and wrote *"Hossam, who would
   become CTO Visma France (unconfirmed)"* while `people/hossam-laanait.md` already said *"CTO Visma
   France (confirmed 04/06)"* — a dated record downgraded into a rumour. The vault's answer wins;
   if you contradict it, say so and say on what.
4. **A link is not a person.** Never create a `people/` card merely to satisfy an incoming
   `[[people/…]]` link. A dangling link is a defect of the *link*: repair it where it was written —
   fix the spelling, point it at the card that does exist, or drop it. Creating the target instead
   promotes a mis-resolution into the vault's own answer to *who exists*, and the next resolution
   then resolves against it. `people/stephanie-music.md` was born exactly that way, from one
   mis-resolved link; that name occurs once in the whole vault — in its own title. A card is written
   when someone confirms the person, never to make a link report go green.
5. **Say which one.** A first name is rarely unique: the vault this discipline was written for held
   three Romain, three Marie, two Karim, two Caroline and two Michael. So a `people/` card carries a
   **homonymy block** — one line under the title saying what tells this person apart from everyone
   the vault knows by that first name (their role, their organisation, and the other cards by name).
   Without it the card resolves nothing; it moves the ambiguity one hop, into the vault. The builder
   enforces it: `scripts/file-back-note.mjs` refuses a new person whose first name the vault already
   holds unless the spec carries `distinguish`, and its refusal names the homonyms it found. The
   read-time half is what makes the block worth writing: when a bare first name matches several
   cards and nothing in the source tells them apart, that name is **unresolved** — rule 2 applies
   (plain text, no link). Never resolve to the nearest one, and never to the one you saw last.
6. **Say how sure you are.** Conformant is not true. The builder hands every card the same clean
   frontmatter and the same green `/lint`, so a name read off an org chart and a name inferred from a
   nickname come out looking identical — and the vault then reads both as its own answer to who
   exists. So a `people/` card carries a **confidence block**: what this identity rests on, in the
   scale the claim discipline already uses below (✅ observed · 🟡 derived or probable · 🔴 unverified),
   never a second one. The builder enforces it: `scripts/file-back-note.mjs` refuses a new person card
   until the spec carries `confidence` — a level and the **basis** it rests on (the source, its date,
   the card it matched). Answer it honestly rather than reaching for the level that unblocks the
   write: `unverified`, written down, costs nothing and is exactly what the next pass needs to know.
   And the read-time half, which is what makes the block worth writing: a card marked 🟡 or 🔴 is a
   **lead, not the vault's answer** — re-verify it before resolving anything against it, and never
   let it become established merely because it has been written down for a while. That is the claim
   discipline's *"yesterday's caveat is a debt"*, applied to the vault's own cards.

## Claim discipline

> **The dangerous output of a second brain is not the fact it invents, it is the SILENCE it
> reports.** Two real failures, one day apart: *"no reply since Thursday"* about a thread that had
> **12 replies that same day** (a bug filed, an analysis posted), and *"nobody has decided"* about a
> reopening that had been **decided and scheduled**, owner and backup named. Both were one click from
> being posted to the owner's team. Neither was a hallucination — every fact was really retrieved.
> The defect lives entirely in the step between **retrieving** and **asserting**.

A search index returns what is **relevant**, never what is **complete**. So when nothing comes back,
that is a property of your query, not a property of the world. Three tiers, three different bars:

| Tier | What it is | The bar to clear |
|---|---|---|
| **Observed** | quoted content + source + date + link | nothing beyond the citation |
| **Derived** | an aggregation, a timeline, a comparison | traceable to observations you listed |
| **Negative or behavioural** | "no reply", "nobody decided", "not started", "X hasn't done Y" — **and every identity resolution** | **name the check that established it, or don't write it** |

The third tier is the whole game: a negative claim about a person is an **accusation**, and it is
exactly the phrasing a briefing pulls toward.

1. **Flip the default phrasing.** Write *"I did not find X"* — never *"there is no X"*. It costs one
   word and removes the entire accusation class.
2. **A negative claim names its verification, or becomes an open question.** *"I did not find a
   follow-up — does anyone have context?"* instead of *"nobody followed up"*.
3. **The thread is the unit of state; the message is only the unit the tools return.** A root message
   is the moment a question was **asked**, never its resolution. Resolve the thread before citing any
   chat message as **current state**.
4. **A reply count above zero is a hard block.** With replies present and the thread unread, you may
   not write "unanswered", "pending", "unresolved" or "still waiting" about that message. At all.
5. **Cite through the connector that exposes state.** Discovery may use the cheap wide one; anything
   you actually cite is re-resolved through the one returning **reply counts and permalinks**.
6. **Reconcile before you write.** One pass over your own retrieved output: *does anything in it
   contradict what I am about to assert?* The worst of the two failures held its own refutation in
   the very same tool response — a later message from the author opening *"thanks for your very
   complete answer"* — and asserted the opposite anyway.
7. **Urgency is a property of state, not of tone.** "Urgent", "blocking", "by the 1st" are words
   inside a message; one that *sounds* urgent and is already handled is not urgent. Ranking by tone
   needs no thread, ranking by state does.
8. **Scale the effort to the cost of being wrong.** Being wrong about a shipped module costs nothing;
   being wrong about *"P resigned"* or *"team T never answered"* costs a relationship. Spend the
   diligence where a mistake is expensive, not evenly.

### Mark it in the artifact, not only in your head

The reader must see **at a glance** which lines are safe to repeat out loud. Mark every claim of the
second and third tier:

| Marker | Meaning | Safe to paste into a message to another human? |
|---|---|---|
| ✅ | observed — quoted and sourced | yes, as-is |
| 🟡 | derived or probable | only with the inference said out loud |
| 🔴 | negative or behavioural, unverified | **never** — reword it as a question first |

*"Probably true"* and *"safe to send to the person concerned"* are **not** the same threshold, and
the second is the one that matters.

### Yesterday's caveat is a debt, never today's premise

A prior briefing is a **source**, not a fact — including your own. This is the failure mode specific
to a *persistent* brain: it indexes its own uncertainty and reads it back as confidence. One of the
two failing sessions opened by inheriting the previous day's caveat (*"no signal on e-invoicing, this
silence is itself worth probing"*) — which was false; there were at least four signals. Before
reusing anything from a prior briefing, **re-verify what it flagged as unverified**; never propagate
it as established.

### A capability recorded as absent must be re-tested

That same vault had recorded, as a permanent limitation, that *"the Slack connector does not expose
permalinks"*, propagated it into several notes, and obeyed it. It was false — a wrong tool choice,
not a platform constraint; the native connector returned permalinks on the first call. **The brain
had written down a false constraint and was obeying it.** Treat a recorded absence as a measurement
with an expiry: re-test it before letting it shape an answer, and correct the note when the tool
turns out to do it after all.

## Procedure

### Step 1 — Source discovery (main context)

> **Native tools only** (see constitution, "Tooling" section). To probe the state of the
> vault before the fan-out — `vault/briefings/` folders, `vault/people/` cards, presence of
> `vault/actions-log.md` — use **`Glob`** and **`Read`**, **never** a compound Bash like
> `cd … && mkdir -p … && ls … && test -f …` (prompted every time, and refused outright because
> `cd`+write). `Write` creates the parent folders at write time: no prior `mkdir`.

In parallel, spot what's **new since the last pass** (delta):

- **Recent transcripts / documents**: search your Drive for docs modified since
  yesterday (or the last working day), e.g. `mcp__<drive>__search(query="modifiedTime > 'YYYY-MM-DD…'")`.
  Collect the `id` + titles: each becomes a transcript-extractor sub-agent.
- **Today's agenda**: `mcp__<calendar>__list_events` (fast, can stay in the main context).

### Step 2 — Sub-agent fan-out (IN PARALLEL, a single message)

Launch all the sub-agents in **a single block of parallel calls**. Each writes its raw
source to the vault and **returns a ~500-token-max summary**.

#### "transcript-extractor" sub-agent (one per document)

```
Agent(
  description="Extract transcript <slug>",
  prompt="""
You are a meeting-transcript extraction agent. READ-ONLY.

TASK:
1. Read the document <DOC_ID> via your Drive connector (mcp__<drive>__read_file).
2. Save the raw content to vault/raw-sources/transcripts/YYYY-MM-DD-<slug>.md
   with this frontmatter:
   ---
   type: transcript
   source: <connector>
   meeting: "<title>"
   date: YYYY-MM-DD
   captured: <today's date>
   ---
3. Return a structured summary (~500 tokens max):

## Signals — <title>
### My commitments       # what YOU promised
- …
### Expectations of me    # what's expected of you
- …
### To escalate           # 🔧 up your hierarchy / to your peers — adapt to your org
- …
### To share              # 🔧 to your team / your contacts — adapt to your org
- …
### Backlinks
- People: [[people/firstname-lastname]]
- Topics: [[topics/topic-name]]
- Source: [[raw-sources/transcripts/YYYY-MM-DD-slug]]

RULES:
- Do NOT invent information absent from the transcript.
- A transcript records what was SAID in one meeting — never the current state of what it
  discusses. So no "nobody decided" / "still not started" / "X hasn't done Y" out of a
  transcript: write "I did not find a decision in this transcript", and mark it 🔴 (🟡
  inferred, ✅ observed and quoted) so the main context knows it is not safe to repeat.
- A bare first name stays a bare first name. Never resolve it into a full identity — that is a
  claim about who someone IS, and it has already attributed a resignation to the wrong person.
- Create the backlinks even if the target page doesn't exist.
- Backlinks via vault/people/ (kebab-case, no accents). No full name, no link: the name stays plain text.
- NEVER a shell (python3 -c, node -e, awk, sed, jq, grep, cat…) to read/load/split the
  content: if you must re-read a file (vault or offloaded result .../tool-results/...), use
  the Read tool; splitting and summarizing are done by reasoning, not on the command line.
"""
)
```

#### "chat-extractor" sub-agent (Slack/Teams/… if wired)

```
Agent(
  description="Chat 24h scan",
  prompt="""
You are a team-messaging collection agent. READ-ONLY.

TASK: scan the last 24h (or since the last pass) for relevant signals:
1. Direct mentions of you and DMs from key people.
2. A few priority channels (🔧 to be defined according to your org — last 15-30 messages).

EXTRACT a structured summary (~500 tokens max), grouped by THEME (not by channel):

## Chat signals (24h)
### My commitments
### Expectations of me
### To escalate        # 🔧 adapt
### To share           # 🔧 adapt
### Alerts             # incidents, escalations, emergencies

THREADS — READ THIS TWICE, it is where this agent has failed in the field:
- The unit of meaning is the THREAD; the unit your search returns is the MESSAGE. A root
  message is the moment a question was ASKED, never its resolution. Field failure: "no reply
  since Thursday" reported about a thread that had 12 replies the same day, bug filed and
  analysis posted.
- Before reporting ANY message as current state — and always before the words "unanswered",
  "pending", "unresolved", "still waiting", "nobody replied" — OPEN ITS THREAD.
- A reply count above zero with the thread unread is a HARD BLOCK on all of those words.
- If your connector does not expose reply counts, say so in your return; do not read its
  silence as "no replies".
- Rank by STATE, not by tone: a message that sounds urgent and is already handled is not urgent.

NEGATIVE CLAIMS:
- Write "I did not find X", never "there is no X". A negative claim names the check that
  established it, or it is reworded as an open question.
- Mark every negative or behavioural claim 🔴 in your return so the main context knows it is
  NOT safe to paste into a message to a human. ✅ = observed and quoted, 🟡 = inferred.
- Before returning, re-read your own findings: does anything you retrieved CONTRADICT what you
  are about to assert? (A real failure asserted "no answer" while the same result set held a
  later message thanking the author for a complete answer.)

WHICH WORKSPACE YOU WERE ON — return this, it is not optional:
- End your return with one line: `WORKSPACE: <what you actually saw>` — a permalink host
  (https://<workspace>.slack.com/...), the workspace/team field, whatever your results carry.
- If nothing in your results names it, return `WORKSPACE: unknown`. Never guess it from the
  channel names or from what the conversation is about.
- You cannot check it yourself: you never see the vault. The main context compares it against
  what this universe declares — the connector is single-account and does NOT follow a switch,
  so it may be authenticated on a completely different organisation.

RULES:
- Ignore pure conversational noise (hello/thanks/emoji) and bots/notifications.
- Backlinks via vault/people/ (kebab-case, no accents). No full name, no link: the name stays plain text.
- NEVER a shell (python3 -c, node -e, awk, sed, jq, grep, cat…) to read/load/split the
  content: if you must re-read a file (vault or offloaded result .../tool-results/...), use
  the Read tool; splitting and summarizing are done by reasoning, not on the command line.
"""
)
```

#### "my-actions" sub-agent (what YOU did)

```
Agent(
  description="My actions since the last pass",
  prompt="""
You are a collection agent for YOUR actions. READ-ONLY.

TASK: find the messages/decisions issued BY YOU since <LAST_PASS_DATE>, and keep only
the significant ACTIONS (announcements, decisions, framing, sign-offs, escalations).
IGNORE: "ok", "thanks", "I'll look", reactions, logistics.

EXTRACT (~500 tokens max), one line per action:
- [YYYY-MM-DD] <short action> — #channel [[people/main-recipient]]

RULES:
- EACH action = ONE distinct message (do not merge).
- Read the content before summarizing (don't guess from the channel).
- Max ~15 actions; beyond that, keep the most structuring ones.
- NEVER a shell (python3 -c, node -e, awk, sed, jq, grep, cat…) to read/load/split the
  content: if you must re-read a file (vault or offloaded result .../tool-results/...), use
  the Read tool; splitting and summarizing are done by reasoning, not on the command line.
"""
)
```

### Step 3 — Synthesis (main context)

The main context receives the compact summaries from all the sub-agents + the agenda
(~3-5k tokens). **Sort and cross-reference**: the same topic seen in a transcript AND in the chat = strong
signal. This is also where we decide whether the delta **amends the answer in progress** (Phase 3 of the flow).

**Reconcile before writing a single line** (see *Claim discipline* above). The returns are a corpus
to be made internally consistent, **not** a bag of quotes to support a synthesis you have already
decided on. Four passes, all cheap:

1. **Does anything I retrieved contradict what I am about to assert?** A contradiction in your own
   material outranks the claim, always.
2. **Every 🔴 line either gets verified now, or is reworded as an open question.** A 🔴 that reaches
   the briefing unchanged is the one the owner pastes into a channel.
3. **Anything I am about to present as new, and every person I am about to name, gets a
   `search_vault` first.** You are the only step that holds both the delta and the vault — the
   sub-agents read external sources and never see it. What comes back outranks the delta's framing
   (see *Identity discipline* above): it is how a two-month-old fact stops being republished as a
   scoop, and how a *"(confirmed 04/06)"* card stops being downgraded to *"(unconfirmed)"*.

4. **The `WORKSPACE:` line the chat sub-agent returned gets checked, before any of it is written.**
   Run `node scripts/set-universe-profile.mjs --check-slack "<that workspace>"` (see *Connector
   discipline* above). You are the only step that holds both the sub-agent's observation and the
   profile that declares what this sphere should be using. **A divergence stops the write**: the
   material belongs to another organisation, and it is a cross-universe leak nothing downstream can
   detect — the note will look perfectly well-formed.

A sub-agent that reported it could not see reply counts has told you its silence is **unmeasured** —
carry that through to the briefing rather than rounding it to "nothing happened".

### Step 4 — Writing the briefing (if morning briefing)

Write to `vault/briefings/YYYY-MM-DD.md`:

```markdown
---
type: briefing
date: YYYY-MM-DD
architecture: fan-out/fan-in
sources: ["[[raw-sources/transcripts/...]]", "chat (24h)", "calendar (day)"]
unverified: true          # true as long as one caveat below is unticked — see Caveats
tags: [briefing]
---

# Briefing — YYYY-MM-DD

## What you did since the last briefing
- [YYYY-MM-DD] [action] — #channel [[people/recipient]]

## Your commitments (what you promised)
- **[commitment]** — context, source [[raw-sources/...]]

## What's expected of you
- Deadline today: [what falls due, and the message that says so]
- ✅ [[people/firstname-lastname]] asked for X on [date] — thread resolved, still open
- 🔴 I did not find a reply from [[people/firstname-lastname]] on X — **thread not read**, do not
  repeat this out loud; ask instead: "where are we on X?"

## To escalate / To share   # 🔧 sections to adapt to your organization

## Today's agenda
| Time | Meeting | Preparation |
|---|---|---|
| HH:MM | **[meeting]** | [context/action] |

## Caveats — DEBTS, not facts. Re-verify before reusing; never inherit as established.
- [ ] 🔴 [what is unverified] — the check that would settle it: [name it]
- [ ] 🟡 [what was inferred rather than observed, and from what]
```

**Read that last section carefully, it is not decoration.** These are the lines a future session
will find and, if they are prose, silently promote into premises — that is exactly how the second
failure began. So: one **checkbox** per debt (machine-visible, grep-able, tickable when settled) and
`unverified: true` in the frontmatter for as long as one is unticked. Drop the key when they are all
settled, and only then.

Markers are **mandatory** on every claim about a person: ✅ observed and quoted · 🟡 inferred ·
🔴 negative or behavioural and unverified — **never** safe to paste into a message to a human.
(Note they are markers of *confidence*, not of priority: don't recycle them as a colour code for
urgency, or the one signal that protects a relationship gets lost in decoration.)

No empty section — omit it. Each signal cites its source (brackets or backlink).

### Step 5 — Append to `vault/actions-log.md`

The ledger is a **first-class, seeded artifact**: it is created at install and re-seeded (if ever
missing) on session start by the `session-actions-log` hook, so it normally already exists — just
**append** one flat, *grep-able* line per action below its header (still create it if it is somehow
absent):

```markdown
## [YYYY-MM-DD] <action> — #channel [[people/recipient]]
```

**Append-only**: never rewrite the existing lines or the seeded header. Usage: "what did I do on
X?" → `grep -i "X" vault/actions-log.md` then enrich via the referenced briefings.

## Re-run mode (same day)

If `vault/briefings/YYYY-MM-DD.md` already exists: re-read it, re-scan the sources, and only add
a `## 🔄 Update HH:MM` section at the top if there's something new. Otherwise show
"Nothing new" without modifying the file.

**Re-reading a briefing is reading a SOURCE, not collecting facts** — the same applies to yesterday's
briefing, and to any note this brain wrote about itself. Its unticked caveats are **debts you have
now inherited**: settle them or carry them forward as debts, and tick a box only when a check
actually cleared it. A caveat that silently loses its checkbox has been laundered into a fact.

## Backlink conventions

| Context | Syntax |
|---|---|
| Person | `[[people/firstname-lastname]]` (kebab-case, no accents) |
| Transcript | `[[raw-sources/transcripts/YYYY-MM-DD-slug]]` |
| Topic | `[[topics/topic-name]]` |
| Prior briefing | `[[briefings/YYYY-MM-DD]]` |

## Success criterion

In < 1 minute of reading, you know (a) what you have to do today and (b) what you have to
push toward others — zero important signal lost since the last pass.
