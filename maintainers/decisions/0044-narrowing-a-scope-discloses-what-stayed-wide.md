# ADR 0044 — Narrowing a scope discloses, in the same breath, what stayed wide

- **STATUS:** PROPOSED (2026-09-12) — drafted for the owner to accept or amend.
- **Scope:** Second brain (runtime) — the deterministic cores that re-point a scope, and the delivered
  skills that relay what they print. **No installer flow change**, no index schema change.
- **Related:** [`0034`](0034-progressive-disclosure-of-universes.md) (a universe is a soft retrieval
  scope), [`0035`](0035-a-universe-profile-is-a-note-plus-an-injected-digest.md) (what a session may be
  handed, and the leak that decided it), [`0009`](0009-prefer-deterministic-mechanisms.md) (the core
  decides, the skill relays), [`0036`](0036-deterministic-channels-differ-by-surface.md) (a disclosure
  the owner's surface never receives is not a disclosure), [`0043`](0043-graduated-autonomy-and-plain-language.md)
  (the register these sentences are written in). Issues [#68](https://github.com/tpierrain/kenjaku/issues/68),
  [#72](https://github.com/tpierrain/kenjaku/issues/72), [#82](https://github.com/tpierrain/kenjaku/issues/82),
  [#66](https://github.com/tpierrain/kenjaku/issues/66).

## Crux

- **The decision, concretely:** you run `/switch` to your `globex` universe. From that moment search
  only looks in `globex`'s notes — and **the same message tells you what did NOT change with it**:
  the conversation already on screen still holds everything it read in the universe you just left, so
  the next answer can still draw on it.
- **The rule this is an instance of:** whenever the brain **stops searching all of something and
  searches only part of it**, the gesture that did the narrowing names, in the same breath, what
  stayed wide. Narrowing correctly and saying nothing is not a feature working: it is a claim the
  owner has no way to check.
- **The guarantee that makes it trustworthy:** the sentence is written by the **code** that performed
  the narrowing, never composed by the model (ADR 0009). Measured, 2026-09-12: **ten hours of work went
  by under a stale pointer, every single write landing in the right place** — nothing was wrong, so
  nothing said anything. A disclosure the assistant chooses whether to make goes missing on the day it
  matters.
- **Prior art:** the principle of least astonishment, and the ordinary discipline of **showing the
  filter next to the result** — `git status` naming the branch before the diff, `kubectl` printing the
  namespace it acted in, a BI tool naming the filters behind a number. The standard is not *filter
  silently and correctly*, it is *show the filter next to the answer*.

## The problem, as it is actually lived

**Four things decide what a session works on, and `/switch` moves only the first of them:** which
notes search looks in, what the assistant has already read in this conversation, which account each
connected tool (Slack, Notion, Google, mail) is signed in as, and which folder a new note is filed
into. So three of the four stay where they were, and each one has its own way of going wrong.

- You switch to `globex` and ask a question. Search moved; **the conversation on screen did not**, so
  a fact read in the previous universe comes back in the answer as established, and with no source.
- You take notes all day and every one is filed in the right folder — while the active universe has
  been the wrong one since this morning. **Being right is what hides it**: a correct result has no
  symptom, so nothing ever looks wrong.
- You ask about Slack after switching, and Slack is still signed in as the account of the universe you
  left. This one was already announced, and that announcement is the shape the other two copy.

**In every case measured the scoping was right. What was missing was the sentence.**

## The decision

1. **A command that narrows what the brain works on names what it did NOT narrow, in one sentence, in
   its own output** — not in the documentation, not on request.
2. **The core says it, the skill relays it** (ADR 0009). The code that made the change also owns *when*
   the sentence applies; a skill may never judge whether a disclosure is warranted, because judging
   needs state the model would have to infer, and that inference is what fails silently. Likewise
   anything that must be counted (how many universes exist) is asked of the core, never counted by the model.
3. **Opposite commands may owe opposite sentences, and that is expected, not a bug.** Leaving `globex`
   for the cross-cutting view *widens* what search reaches, so it owes no warning about leftovers;
   entering `globex` changes which accounts apply, so it owes the reminder about the connectors.

## Guardrails

- **Conditional, always.** A sentence printed when it cannot apply trains the reader to skip it, which
  costs the occasions when it does apply. **The condition is part of the disclosure.**
- **No disclosure is ever paid for with content.** It names *what* moved and *what* did not; it
  never smuggles the material itself into the session-start channel, printed before the owner types a
  word and carried into every screenshot and screen share (ADR 0035 §2 — one such transcript reached a
  third party). Where a fact must never be got wrong, the answer is a **guard at the moment it would be
  got wrong**, not a line at every session start.
- **Say it, never silently re-point it.** The brain does not wipe the conversation, nor change which
  universe new notes are filed into, on its own: moving one of the four under the owner is guessing at
  their intent, and a wrong guess is worse than a stale setting they can see and fix.

## What accepting this does NOT change

- **No code.** All of it shipped in `v5.3.0`; ratifying settles the doctrine, refusing breaks nothing
  running. The session-start surface stays **as narrow as ADR 0035 left it** — the obligations land on
  the *acting* surfaces, never on the ambient one.
- **What it costs from here on:** every core that re-points a scope grows a small reminder beside it,
  plus a test for **both** the case where it speaks and the case where it stays silent. The silence is
  half the specification.

## Rejected alternatives

- **Document the four, and let the assistant mention them when relevant** — the ten-hour drift above
  *is* this option, observed.
- **Re-point all four automatically instead of saying anything** — it would destroy the legitimate case
  of switching *in order to* carry something from one universe into another; and see guardrail 3.
- **Warn on every command, unconditionally** — guardrail 1: that is how a net stops being read.
- **One generic "things may not all have followed" notice** — it names nothing, so nothing can be done
  about it. The whole value is in naming *which* universe, and *which* of the four did not follow.

## Amendments

- **2026-09-12 — cut from 207 lines to one screen, unchanged in substance** (CONVENTIONS §6sexies). The
  concurrency probe, the abandoned `PostToolUse` corrector and its sequence diagram moved to where work
  write-ups belong: [`plans/archived/2026-09-12-v5.3.0-universe-disclosure-delivered.md`](../plans/archived/2026-09-12-v5.3.0-universe-disclosure-delivered.md).
