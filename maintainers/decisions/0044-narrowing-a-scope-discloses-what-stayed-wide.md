# ADR 0044 — Narrowing a scope discloses, in the same breath, what stayed wide

- **STATUS:** ACCEPTED (2026-09-12) — ratified by the owner once it fitted on one screen.
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

- **The decision, in one sentence:** switching universe **moves the search and nothing else**, so the
  brain names, at that moment, the two things that stayed as they were: **the conversation you have on
  screen, and the accounts your connected tools are signed in as.**
- **What that looks like:** you switch to `globex`. From now on search only reads `globex` notes — and
  the brain says, right there: the conversation on screen still holds everything read before the
  switch, and Slack is still signed in with the same account as a minute ago.
- **Why saying it is the feature:** a switch that works and says nothing looks exactly like a switch
  that moved everything. You could not tell the two apart, and you would find out from an answer built
  on notes you thought you had left behind.
- **The guarantee that makes it trustworthy:** the sentence comes from the **program**, never from the
  assistant (ADR 0009). Measured, 2026-09-12: **ten hours of work went by with the wrong universe
  active, every note filed in the right place, and nothing said a word.** Nothing was broken, so
  nothing spoke up — which is precisely why the sentence cannot be left to anyone's judgement.
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

1. **A command that makes the brain search only part of your notes says so in its own answer, and
   names what it left alone** — the conversation on screen, the connected accounts, where new notes
   get filed. In that answer: not in the documentation, and not only if you think to ask.
2. **The program writes that sentence, not the assistant** (ADR 0009). An assistant deciding each time
   whether the sentence is warranted is an assistant that stays silent on the day it matters, because
   deciding means guessing at things it was told once, hours ago. Anything that has to be counted (how
   many universes exist) is counted by the program too; the assistant only repeats it.
3. **Going in and coming out do not owe the same sentence.** Coming out of `globex` puts *all* your
   notes back within reach, so there is nothing to warn about. Going into `globex` changes which Slack
   or Notion account gets used, and that has to be said.

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

- **2026-09-12 — the Crux and the Decision rewritten in plain words, wording only.** The owner, having
  already ratified it: *"c'est incompréhensible"*. What went: *narrows a scope*, *the core says it and
  the skill relays it*, *disclosure*, *the cross-cutting view*. What replaced it: searching only part
  of your notes, the program rather than the assistant, saying it. **Not one claim changed**, which is
  why ACCEPTED still stands — and the third rewrite of this same page is the measurement behind
  CONVENTIONS §6sexies: shortening a decision does not make it readable, naming ordinary things does.
- **2026-09-12 — cut from 207 lines to one screen, unchanged in substance** (CONVENTIONS §6sexies). The
  concurrency probe, the abandoned `PostToolUse` corrector and its sequence diagram moved to where work
  write-ups belong: [`plans/archived/2026-09-12-v5.3.0-universe-disclosure-delivered.md`](../plans/archived/2026-09-12-v5.3.0-universe-disclosure-delivered.md).
