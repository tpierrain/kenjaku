---
name: plan-discipline
description: "Write, open, resume or tick a plan / roadmap / TODO so its state survives a cleared context. Use when asked to write or draft a plan, open or re-open an existing plan, resume work after a /clear or a break ('we're resuming', 'where were we', 'on reprend'), tick off a finished step, or record a decision or blocker so it is not lost. Also use when a plan is found with plain bullets instead of checkboxes, or when about to hand back with work still in flight."
---

# Plan discipline

Keep the state of a piece of work **outside the conversation**, so clearing the context costs
nothing. Full rationale and the shareable version: [`plan-discipline.md`](../../plan-discipline.md).

## The one thing to get right

**The plan is the truth; the chat is the echo.** Anything said in a reply about *where the work
stands* must already be in the committed plan when the reply is written — not after being asked.

## Writing a plan

1. **A `## Tracking` section at the top**, one checkbox per step, then sub-checkboxes down each step
   as it is worked. Checkboxes `- [ ]` / `- [x]` on **every** step and sub-step — never plain
   bullets, never text-only markers (`TODO`, `✅ DONE`) alone.
2. **Lead each step with the WHAT** — the capability added, changed or removed, phrased as what the
   user or the system can now do. The HOW (tests, refactors, file names) goes in the sub-steps.
3. **A header note above the Tracking**, in prose, saying **what the next real step is**. This is the
   resume marker, and it outranks the checkboxes (see below).
4. Constraints, rejected options and evidence are **also** checkboxes — tick them when established,
   so a returning reader can see what is settled.

## Ticking a finished step

- `- [x]` **plus** _(date · commit)_. The annotation is what survives everything else.
- Record **what was decided while building it**, especially anything that was *not* obvious before
  starting, with a short "do not re-open" if the decision was expensive to reach.
- Update the **header note** to the new next step. A ticked box with a stale header is a plan that
  lies.

## Opening or resuming a plan

1. Read the **header note** and the `## Tracking`.
2. Restart **where the header says** — **not** at the first unticked `- [ ]`. Constraints and
   rejected options are checkboxes too; a step can be done bar one line of doc; a check can be
   waiting on an environment.
3. **Announce which step before writing any code.** One sentence — the cheapest check that both
   sides are resuming the same work.
4. If the plan has no checkboxes, **restore them** without waiting to be asked.

## Before handing back — the save-point check

Run this before writing any reply that does not chain into another tool call, because that is when
the human may clear:

> **Does my reply contain "next: X", "Y remains", or "resume at Z"?**
> Then those sentences must already exist in the committed plan. If not, write them there first.

Three things no checkbox records on its own, and all three die at a clear:

- **the next real step**, when the first unticked box is not the right marker;
- **a decision taken in conversation** — a trade-off, a scope call, an explicit "we are not doing X";
- **a blocker or external wait**, and what would lift it.

## One canonical plan

The living plan is the file **in the repo**. Any snapshot the tooling keeps elsewhere is throwaway
the moment a plan is promoted there — mark it superseded and never read it again.

> The trap behind this rule: two copies of one plan, zero ticked boxes versus thirteen. Both looked
> authoritative; whichever is opened first wins.

### Durable memory holds no state — ever

**Never write the next step into memory.** "Next: X", "what remains", "blocked on Y", any summary of
where the work stands: that is the plan's job, always. Writing it into memory *feels* like saving it
and is the opposite — the plan is edited and committed as the work moves, so it stays true, while a
memory line is written once and then outlives the step it describes, still read at every session
start with full authority. **A stale memory line is a wrong instruction, not a missing one.**

Only two kinds of entry are admissible, and neither is state:

- a **pointer** — which plan file holds the state, and to go open it;
- a **reference** — something recoverable nowhere else: a published URL, a durable preference, a
  convention with its rationale.

Everything else is already in the plan, the code or the history. Memory is reloaded in full at every
session start and is size-bounded: each surplus line spends the budget the critical instructions
need, and pushes them out silently.

## Scope note

This skill is the **on-demand** half of the discipline. The always-on half — the save-point check
above, and pointers-not-copies — belongs in the file the agent reads at **every** session start
(`CLAUDE.md` or equivalent), because it must fire at the exact moment nothing looks like it needs
loading. A ready-to-paste block is in [`plan-discipline.md`](../../plan-discipline.md).

## Installing this skill elsewhere

It lives under `maintainers/` so it never ships into a generated brain. To use it in another repo,
copy the folder to that repo's `.claude/skills/plan-discipline/`, and paste the always-on block into
that repo's `CLAUDE.md`.
