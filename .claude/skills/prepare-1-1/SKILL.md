---
name: prepare-1-1
description: "Prepare a 1-1 with anyone, in both directions: with YOUR manager (the topics you want to raise, what has changed since last time) or with someone YOU manage (commitments made/delegated, operational topics, KPI review). Takes a name/alias, cross-references the person's profile, the last 1-1 and the delta of recent signals (via sync-sources, READ-ONLY). Meta skill: a structure that gives you ideas, to be refined to your own focus areas and KPIs (with /improve if needed)."
version: 1.0.0
---

# /prepare-1-1 — Prepare a 1-1 (meta version)

Produces a **briefing** scannable in 2 minutes before your next 1-1. This is a **meta skill**:
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

## Step 2 — Writing the briefing

Write to `vault/prep-1-1/YYYY-MM-DD-prep-1-1-<name>.md` (date of the next 1-1; create the folder
if needed), according to the case detected in step 0.

### Case A — 1-1 with your manager (you carry the topics)

```markdown
# Prep 1-1 — [First name] (my manager) — [date]

## What I want to raise (Top 3)
The topics not to miss, by impact. For each: where we stand, what I expect from them
(decision, support, info, unblocking).
1. **[Title]** — [1-line context] → I expect: [decision / support / arbitration]

## Since last time
What has moved and is worth reporting or sharing (progress, risks, signals). Enough to have
"something to chew on" instead of arriving empty-handed.

## Questions / requests
What I want to clarify or obtain (priorities, resources, feedback on me).

## My commitments in progress
What I had committed to do — status kept / in progress / at risk.
```

### Case B — 1-1 with someone you manage (follow-up + operational + KPI)

```markdown
# Prep 1-1 — [First name] — [date]

## Commitment follow-up
- **What the other person committed to do** (since the last 1-1): status kept / in progress / not done.
- **What I want to delegate to them** (new delegations, responsibilities).
(Draws on the backlog `vault/backlog/<name>.md`, sorted by age.)

## Important operational topics
The 2-3 hot topics in the scope to address, with the concrete question to ask.

## KPI review            # 🔧 TO REFINE: define YOUR metrics here
Collection + review of the metrics that matter for you. Possible examples (replace with your
own): DORA (lead time, deployment frequency, MTTR, change-fail rate), quality, delivery,
satisfaction, capacity… For each KPI: value / trend / question to dig into.
| KPI | Value / trend | Question |
|---|---|---|
| [your KPI] | [↑/↓/→] | [what you want to understand] |

## Weak signals
Tensions, frustrations, overload, dodged topics — with tact, no beating around the bush. (Omit if nothing.)

## Recurring focus areas          # 🔧 TO REFINE: the 3-5 themes you track with each report
| Focus area | Detected signal | Default question |
|---|---|---|
| [your focus area] | [signal or "none"] | [question] |

## Checklist (before/during the 1-1)
- [ ] …
```

In both cases, end with a collapsible **"Full context"** block (summary of the last 1-1,
decisions, follow-up actions `| # | Action | Who | When | Status |`, verbatims, messaging/email/meeting
activity with links, source quality).

## Step 3 — Update the backlog
In `vault/backlog/<name>.md`: **add** the new actions, **check off** those with proof
of completion, **update** the `updated:` date. Append-only on facts already recorded.

## Writing rules
- English, direct and ultra-concise tone; bullet lists rather than paragraphs.
- Do not make things up; flag a partial or low-quality source.
- No empty section — omit it (except "KPI review" and "Recurring focus areas" in case B, to keep
  as a reminder even when empty, since these are the sections you must make your own).
- Never a bare URL: `[text](url)`. Backlinks `[[people/firstname-lastname]]` — no full name, no link: the name stays plain text.

## Refining this skill (that's the point of a meta skill)
The structure above is a **starting point**. Make it yours: replace the example KPIs with
your own, add/remove recurring focus areas, adjust the sections to the type of 1-1 you run.
You can do it by hand (edit this file) or ask **`/improve`** to assist you.

## Success criterion
In < 2 minutes of reading, you know what to address, why, with which opening question — and,
on the manager side, where the commitments and the KPIs that matter stand.
