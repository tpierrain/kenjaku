# Plan discipline — making `/clear` free at any instant

> **What this is.** A small, portable working convention for anyone pairing with a coding agent
> (Claude Code or otherwise) on work that spans more than one session. It costs nothing to adopt,
> needs no tooling, and removes one specific and expensive failure: **losing the state of a piece of
> work because it only ever lived in the conversation.**
>
> It is written to be lifted as-is into another repo. Nothing here is specific to any project,
> language or agent product.

## The problem it solves

A long-running agent conversation accumulates state that exists **nowhere else**: what was decided
and why, what was rejected, what is next, what is blocked and on what. Then the context is cleared —
deliberately (`/clear`), or by a crash, a compaction, a new day, a colleague picking the work up.

Everything that lived only in the thread is gone. What follows is worse than the loss itself: the
agent resumes from a plausible-looking artifact, re-derives a decision that was already made,
re-explores ground already covered, or restarts on a step that shipped last week. The human notices
only after the wrong work is done.

The fix is not a bigger context window, and not "remember to save". It is a rule about **where state
is allowed to live**.

## The three rules

### 1. Checkboxes on every step, and every sub-step

Any plan / roadmap / TODO / progress document uses Markdown checkboxes `- [ ]` / `- [x]` on **each
step and each sub-step**. Never plain bullets, never text-only markers (`TODO`, `✅ DONE`) on their
own.

- A multi-step plan opens with a **`## Tracking`** section: one checkbox per step, then sub-checkboxes
  down each step as it is worked.
- A finished step is ticked `- [x]` **and** annotated _(date · commit)_. That annotation is the part
  that survives everything else.
- When opening an existing plan that has no checkboxes, restore them — don't wait to be asked.

Why checkboxes and not prose: a human can follow and tick progress **straight from the Markdown**, in
any editor or in a repository preview, without asking the agent anything. Prose describing progress
is something only the agent can update, which means it goes stale silently.

### 2. One canonical plan, and it lives in the repository

The living plan is the file **in the repo**, versioned alongside the code it describes. Any snapshot
the agent tooling keeps elsewhere (a local plans folder, a scratch file, a chat pane) is **throwaway**
the moment a plan is promoted into the repo — mark it superseded and never read it again.

> The trap that motivates this: two copies of the same plan, one with zero ticked boxes and one with
> thirteen. Both looked authoritative. Whichever gets opened first wins, and it is a coin flip.

If your agent has a persistent memory feature, keep **pointers there, not copies**: one thin line
saying *which* plan file holds the state, never a restatement of that state. A memory that is reloaded
in full every session and duplicates the plan will, past its size bound, silently bury the
instructions that actually matter under stale text.

**Pointers, not copies** — the phrase comes from Thomas Pierrain,
[*« Des pointeurs, pas des copies, banane »*](https://medium.com/@tpierrain/des-pointeurs-pas-des-copies-banane-56c9d197b80b).

### 3. The save point is EVERY handed-back turn — not the end of a step

This is the rule that does the real work, and the one most often missing.

**Before handing back** — that is, any reply that does not chain into another tool call, so **every
instant the human might clear the context** — the plan must already say what the reply is about to
say.

The test, applied before writing the reply:

> **If my reply contains "next: X", "Y remains", "resume at Z" — those sentences must already exist
> in the plan, committed.** Otherwise write them there first, and let the chat be the echo.

This covers what no checkbox says on its own:

- **What the next real step is**, when the first unticked box is *not* the right marker. Constraints,
  rejected options and evidence are checkboxes too; a step can be done bar one line of documentation;
  a check can be waiting on an environment. A plan whose header does not say what the next real step
  is has not saved its state, however many boxes are ticked.
- **A decision taken in conversation** — a trade-off, a scope call, an explicit "we are not doing X".
  It dies at the clear if it lives only in the thread, and the next session cheerfully re-opens it.
- **A blocker or an external wait**, and what it would take to lift it.

**Why this precise trigger.** "Tick the plan as you go" sounds like it already covers this. It does
not: its trigger is *"a step is finished"*. Between two steps, the state therefore lives in the last
reply — the one place a clear destroys — and the human has to remember to ask for it to be saved. The
correct trigger is not the end of a step, it is **the handed-back turn**.

**Goal: clearing is free at every instant, never only at step boundaries.**

## The resume ritual

Coming back to work after a clear, a crash, or a week away:

1. Follow the pointer to the plan file in the repo.
2. Read its **header note** and its `## Tracking`.
3. Restart **where the header says** — not at the first unticked box.
4. **Announce which step, before writing any code.**

Step 4 is not ceremony. It is the cheapest possible check that the agent and the human are resuming
the same work, and it costs one sentence.

## Adopting it

Two halves, and they belong in two different places.

**The always-on half** — rules 2 and 3 — must be live at every turn, including the turn where you
would not think to load anything. Put it in the file your agent reads at the start of every session
(`CLAUDE.md`, or its equivalent). A ready-to-paste version:

```markdown
## Plans and state

- The living plan is the file in this repo under `<your-plans-folder>/`. It is the single source of
  truth for the state of a piece of work: checkboxes on every step and sub-step, a finished step
  ticked `- [x]` with _(date · commit)_.
- **Before handing back** — any reply that does not chain into another tool call — the plan must
  already say what my reply says. If my reply contains "next: X", "Y remains" or "resume at Z",
  those sentences go into the committed plan FIRST, and the chat is only the echo. This includes
  decisions taken in conversation and blockers, which no checkbox records on its own.
- On resuming: open the plan, read its header note and its Tracking section, restart where the
  header says (NOT at the first unticked box — constraints and rejected options are checkboxes
  too), and announce which step before writing any code.
- If durable memory exists, it holds a POINTER to the plan file, never a copy of its state.
```

**The on-demand half** — rule 1, how to write and open a plan — is genuine skill material: it
triggers on a recognizable task ("write a plan", "open the plan", "resume this"). One is written and
ready to copy: [`skills/plan-discipline/SKILL.md`](skills/plan-discipline/SKILL.md) — drop the folder
into a repo's `.claude/skills/` and it activates there.

Do not put the always-on half in a skill. A skill loads when a task matches, and rule 3 has to fire
at the exact moment nothing looks like it needs loading: when the agent is about to stop and hand
back.

## What this is not

- **Not a hook, and not automation.** No tool can write the sentence "this decision was taken and
  here is why" on your behalf; that is judgment. It is a writing convention, which is why it lives in
  an instruction file rather than in a script.
- **Not project management.** The plan is a working file for two collaborators, one of whom forgets
  everything periodically. It is not a status report, and it has no audience beyond the pair.
- **Not free of discipline.** The whole thing rests on one habit — writing the state down *before*
  saying it in chat, rather than after being asked. Everything else follows from that.
