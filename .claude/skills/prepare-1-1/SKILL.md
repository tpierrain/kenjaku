---
name: prepare-1-1
description: "Prepare a 1-1 with anyone, in both directions: with YOUR manager (the topics you want to raise, what has changed since last time) or with someone YOU manage (commitments made/delegated, operational topics, KPI review). Takes a name/alias, cross-references the person's profile, the last 1-1 and the delta of recent signals (via sync-sources, READ-ONLY). Meta skill: a structure that gives you ideas, to be refined to your own focus areas and KPIs (with /improve if needed)."
version: 1.0.0
---

# /prepare-1-1 — Prepare a 1-1 (meta version)

Produces a **briefing whose first screen is the whole brief** — the page you speak from at your next
1-1, with the evidence folded underneath. This is a **meta skill**:
it lays out a **structure** that gives you ideas; you then **refine** it to your own focus areas,
your KPIs and the way you run your 1-1s (edit this file, or ask `/improve` to help you).

## Parameter

A **name or alias** of a person in `$ARGUMENTS` (e.g. `/prepare-1-1 jane`). Used to find
`vault/people/<firstname-lastname>.md` (kebab-case, no accents) and the cache `vault/backlog/<name>.md`.
If no profile matches, suggest the closest profiles from `vault/people/` and stop.

## Absolute constraint

**READ-ONLY.** Never send a message, email or reaction, never post anywhere.
Produce only a local markdown file in the vault.

## Step 0 — Direction of the 1-1 (determines the output structure)

Two cases, depending on your relationship with the person (infer it from their role in `vault/people/<name>.md`;
when in doubt, ask):

- **A · 1-1 with YOUR manager** (you are the managee) → "**what I want to raise**" structure.
- **B · 1-1 with someone YOU manage** (a report, or a peer you coach) → "**follow-up + operational + KPI**"
  structure.

## Step 1 — Collection (fan-out, READ-ONLY)

In parallel ([`sync-sources`](../sync-sources/SKILL.md) architecture, ~500-token summaries):

- **Backlog cache**: `vault/backlog/<name>.md` — open / recurring actions (a point raised
  2+ times without closure is a priority).
- **Last 1-1**: the note in `vault/meetings/` (or via your Calendar connector) — transcript read
  by an isolated sub-agent (never raw transcript in the main context). Also note the
  **next** 1-1 (date of the output file; otherwise today's date).
- **Delta since the last 1-1**: messaging, email, shared meetings — depending on your connectors.

## Claim discipline

**The full rules live in one place — [`sync-sources` § Claim discipline](../sync-sources/SKILL.md#claim-discipline)
— and this skill obeys them rather than restating its own.** Two paraphrases are two disciplines; the
control belongs where the facts are produced, and this skill consumes that fan-out.

Read them there. What makes a 1-1 prep the **worst** place to break them:

- **You are about to say these lines to the person they are about.** A briefing that is wrong gets
  corrected later; a 1-1 prep that is wrong gets spoken aloud, to their face.
- **"Not done" is a behavioural claim.** The commitment-follow-up section below invites `status kept /
  in progress / not done` — the third one is an accusation unless you name the check that established
  it. Write *"I did not find a trace of X"* and mark it 🔴, or ask it as an open question.
- **The thread, again.** Before writing that someone never replied, never delivered, never started:
  open the thread. A root message is the moment a question was **asked**. A reply count above zero
  with the thread unread blocks the words "unanswered", "pending", "still waiting".
- **An absence carries its scope in the same sentence, and mail is in scope.** *"I found no trace of
  it in your notes or the chat tool; I did not search your mail"* — never a bare *"no trace"*. The
  commitments a 1-1 turns on are exactly the ones that travel by mail, and an absence stated wider
  than the search behind it is how a true statement gets dropped from a conversation.
- **Reconcile first.** Does anything you retrieved contradict what you are about to write? This skill
  produced the field defect that proves it: it announced a role change as *"unconfirmed"* while the
  vault's own `people/` note recorded it **confirmed two months earlier**.

Markers are mandatory here too: ✅ observed and quoted · 🟡 inferred · 🔴 unverified negative or
behavioural — and 🔴 is **never** safe to say out loud in the meeting.

## Identity discipline

**Same arrangement, same reason — [`sync-sources` § Identity discipline](../sync-sources/SKILL.md#identity-discipline)
holds the rules; this skill obeys them.** Resolve against the vault before writing a person, never
invent the missing half of a name, and ask the vault before calling anything new. Read them there.

A 1-1 prep is where getting this wrong costs the most: every person in the file is **one of the two
people in the room**. Getting their surname, their title or their reporting line wrong is not a
broken backlink here — it is said to their face, or to their manager's.

## The shape of the output

**The shape lives in one place — [`brief-shape`](../brief-shape/SKILL.md) — and this skill obeys it
rather than restating its own.** Load it before writing a line. Same arrangement as claim discipline
above, same reason: a shape paraphrased here is a second shape, and two shapes drift apart.

What it binds for a 1-1 prep, which is where it matters most:

- **The first screen IS the brief** — the handful of things you are actually going to say, as flat
  bullets, between the note's `#` title and its first `##` heading. It is the page you speak from
  with the person sitting in front of you, and it has to work alone.
- **Everything below the first `##` is ammunition**, opened only if they dig, contest or ask, every
  item carrying its verbatim quote, its date and its source path. In this room, a claim you cannot
  quote is a claim you do not make.
- **A thin vault produces a short brief that says so.** The cap is an upper bound with no floor
  under it; nothing is ever padded to fill the page. The numbers live in `brief-shape`, not here.
- **The two templates below are already cut to that shape.** What used to sit at the top (the Top 3
  section, the KPI table, the weak signals, the focus areas) is ammunition, and it moved below the
  fold — not because it stopped mattering, but because it is read after the meeting starts, not
  before you walk in.

**What "done" looks like**: handed the page thirty seconds before you walk in, you could hold the
meeting from the first screen alone, without scrolling once.

## Step 2 — Writing the briefing

Write to `vault/prep-1-1/YYYY-MM-DD-prep-1-1-<name>.md` (date of the next 1-1; create the folder
if needed), according to the case detected in step 0.

**The frontmatter carries `type: prep-1-1`**, and that is not decoration: the shape applies to every
note whose `type:` starts with `prep-`, so a prep that omits it is a prep nothing checks.

### Case A — 1-1 with your manager (you carry the topics)

```markdown
---
type: prep-1-1
created: YYYY-MM-DD
author: <the name `git config --get user.name` gives on THIS machine>
tags: [prep, 1-1]
---

# Prep 1-1 — [First name] (my manager) — [date]

- **[Topic to raise]** — [where it stands, one clause] → I expect: [decision / support / arbitration]
- **[Topic to raise]** — [where it stands] → I expect: […]
- **[What has moved since last time]** — the one thing worth reporting, not the list of everything.
- **[What I want to clarify or obtain]** — priority, resource, feedback on me.
- **[My commitment in progress]** — kept / in progress / at risk.
- 🔴 **Not documented:** [what the vault does not carry on these topics]. *(This bullet only when
  it is true — it replaces padding, it never adds to it.)*

## Ammunition — only if they dig, contest or ask

### [Topic] — the evidence
- ✅ "[the exact words]" — [YYYY-MM-DD] — `[vault/…md, or the link to the source]`

### My commitments, in detail
Status per commitment, each with what establishes it.

### Full context
Summary of the last 1-1, decisions, follow-up actions `| # | Action | Who | When | Status |`,
verbatims, messaging/email/meeting activity with links, source quality.

### What the vault does NOT support
What could not be verified, and where it was looked for (notes, chat tool, mail…), so a negative is
never spoken out loud without knowing it is unsupported.
```

### Case B — 1-1 with someone you manage (follow-up + operational + KPI)

```markdown
---
type: prep-1-1
created: YYYY-MM-DD
author: <the name `git config --get user.name` gives on THIS machine>
tags: [prep, 1-1]
---

# Prep 1-1 — [First name] — [date]

- **[Commitment to follow up]** — [where it stands] → ask: [the opening question]
- **[What I want to delegate]** — [the responsibility] → ask: [how they see it]
- **[Hot operational topic]** — [one clause] → ask: [the concrete question]
- **[KPI that moved]** — [value, trend] → ask: [what I want to understand]
- **[Weak signal]** — [tension, overload, dodged topic], to raise with tact.
- 🔴 **Not documented:** [what the vault does not carry]. *(Only when it is true.)*

## Ammunition — only if they dig, contest or ask

### Commitment follow-up
- **[Action]** — kept / in progress / 🔴 no trace found *(say where you looked)* — ✅ "[the exact
  words of the commitment]" — [YYYY-MM-DD] — `[source]`
(Draws on the backlog `vault/backlog/<name>.md`, sorted by age.)

### KPI review            # 🔧 TO REFINE: define YOUR metrics here
Collection + review of the metrics that matter for you. Possible examples (replace with your
own): DORA (lead time, deployment frequency, MTTR, change-fail rate), quality, delivery,
satisfaction, capacity… For each KPI: value / trend / question to dig into.
| KPI | Value / trend | Question |
|---|---|---|
| [your KPI] | [↑/↓/→] | [what you want to understand] |

### Weak signals
Tensions, frustrations, overload, dodged topics — with tact, no beating around the bush, each with
the observation that produced it.

### Recurring focus areas          # 🔧 TO REFINE: the 3-5 themes you track with each report
| Focus area | Detected signal | Default question |
|---|---|---|
| [your focus area] | [signal or "none"] | [question] |

### Full context
Summary of the last 1-1, decisions, follow-up actions `| # | Action | Who | When | Status |`,
verbatims, messaging/email/meeting activity with links, source quality.

### What the vault does NOT support
What could not be verified, and where it was looked for (notes, chat tool, mail…), so a negative is
never spoken out loud without knowing it is unsupported.
```

## Step 3 — Update the backlog
In `vault/backlog/<name>.md`: **add** the new actions, **check off** those with proof
of completion, **update** the `updated:` date. Append-only on facts already recorded.

## Writing rules
- English, direct and ultra-concise tone; bullet lists rather than paragraphs.
- Do not make things up; flag a partial or low-quality source.
- **Above the first `##`: bullets and nothing else** — no sub-heading, no table, no link to go and
  open. A table on the first screen is a table you read instead of looking at the person.
- No empty section — omit it (except "KPI review" and "Recurring focus areas" in case B, to keep
  as a reminder even when empty, since these are the sections you must make your own). An omitted
  ammunition section costs nothing; an omitted first-screen bullet is one thing less to say, and
  that is correct when the vault does not support it.
- Never a bare URL: `[text](url)`. Backlinks `[[people/firstname-lastname]]` — no full name, no link: the name stays plain text.

## Refining this skill (that's the point of a meta skill)
The structure above is a **starting point**. Make it yours: replace the example KPIs with
your own, add/remove recurring focus areas, adjust the sections to the type of 1-1 you run.
You can do it by hand (edit this file) or ask **`/improve`** to assist you.

## Success criterion
In < 2 minutes of reading, you know what to address, why, with which opening question — and,
on the manager side, where the commitments and the KPIs that matter stand.
