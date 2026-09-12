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

- **The decision:** whenever the brain **narrows what it will answer from**, the same gesture says
  **what stayed wide** — you switch to another sphere, and it tells you the conversation already on
  screen still holds what it read before. A scope change that is correct and silent is not a feature
  working, it is a claim the owner cannot check.
- **The guarantee that makes it trustworthy:** the sentence is written by the **code** that performed
  the narrowing, never composed by the model (ADR 0009). Measured, 2026-09-12: **ten hours of work went
  by under a stale pointer, every single write landing in the right place** — nothing was wrong, so
  nothing said anything. A disclosure the assistant chooses whether to make goes missing on the day it
  matters.
- **Prior art:** the principle of least astonishment, and the ordinary discipline of **showing the
  filter next to the result** — `git status` naming the branch before the diff, `kubectl` printing the
  namespace it acted in, a BI tool naming the filters behind a number. The standard is not *scope
  silently and correctly*, it is *show the scope with the answer*.

## The problem, as it is actually lived

A session runs under **four scopes that move independently**: what search returns, what the assistant
already read, which account each connected tool is signed in as, and where a new note lands.

- You switch spheres and ask a question. Search moved, **the conversation on screen did not** — so a
  fact from the sphere you just left comes back as established and uncited.
- You file notes all day and each one lands in the right folder, while the pointer has been on the
  wrong sphere since this morning. **Being right is what hides it**: a correct result has no symptom.
- You query Slack after switching, and it is still signed in as the account of the sphere you left.
  This one was already disclosed, and that reminder is the shape the rest copies.

**In every case measured the scoping was right. What was missing was the sentence.**

## The decision

1. **A gesture that narrows a scope names what it did not narrow, in one sentence, in its own output** —
   not in documentation, not on request.
2. **The core says it, the skill relays it** (ADR 0009). The code that made the change also owns *when*
   the sentence applies; a skill may never judge whether a disclosure is warranted, because judging
   needs state the model would have to infer, and that inference is what fails silently. Likewise
   anything that must be counted (how many universes exist) is asked of the core, never counted by the model.
3. **Opposite gestures may owe opposite disclosures, and that is expected, not a bug.** Leaving a sphere
   *widens* what is reachable, so it owes no residue warning; entering one changes which accounts apply,
   so it owes a connector reminder.

## Guardrails

- **Conditional, always.** A sentence printed when it cannot apply trains the reader to skip it, which
  costs the occasions when it does apply. **The condition is part of the disclosure.**
- **No disclosure is ever paid for with content.** It names *which* scope moved and *which* did not; it
  never smuggles the material itself into the session-start channel, printed before the owner types a
  word and carried into every screenshot and screen share (ADR 0035 §2 — one such transcript reached a
  third party). Where a fact must never be got wrong, the answer is a **guard at the moment it would be
  got wrong**, not a line at every session start.
- **Disclose, never silently re-scope.** The brain does not clear the conversation window or move the
  filing pointer by itself: moving a scope under the owner guesses intent, and a wrong guess is worse
  than a stale pointer they can see.

## What accepting this does NOT change

- **No code.** All of it shipped in `v5.3.0`; ratifying settles the doctrine, refusing breaks nothing
  running. The session-start surface stays **as narrow as ADR 0035 left it** — the obligations land on
  the *acting* surfaces, never on the ambient one.
- **What it costs from here on:** every core that re-points a scope grows a small reminder beside it,
  plus a test for **both** the case where it speaks and the case where it stays silent. The silence is
  half the specification.

## Rejected alternatives

- **Document the scopes and let the assistant mention them** — the ten-hour drift above *is* this
  option, observed.
- **Re-scope everything automatically instead of disclosing** — it would destroy the legitimate case of
  switching *in order to* carry something across; and see guardrail 3.
- **Warn on every gesture, unconditionally** — guardrail 1: that is how a net stops being read.
- **One generic "scopes may differ" notice** — it names nothing, so nothing can be done about it; the
  whole value is in naming *which* sphere and *which* scope.

## Amendments

- **2026-09-12 — cut from 207 lines to one screen, unchanged in substance** (CONVENTIONS §6sexies). The
  concurrency probe, the abandoned `PostToolUse` corrector and its sequence diagram moved to where work
  write-ups belong: [`plans/archived/2026-09-12-v5.3.0-universe-disclosure-delivered.md`](../plans/archived/2026-09-12-v5.3.0-universe-disclosure-delivered.md).
