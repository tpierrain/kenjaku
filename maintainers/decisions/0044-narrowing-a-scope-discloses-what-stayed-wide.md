# ADR 0044 — Narrowing a scope discloses, in the same breath, what stayed wide

- **STATUS:** PROPOSED (2026-09-12) — drafted for the owner to accept or amend.
- **Scope:** Second brain (runtime) — the deterministic cores that re-point a scope, and the delivered
  skills that relay what they print. **No installer flow change**, no index schema change.
- **Related:** [`0034-progressive-disclosure-of-universes.md`](0034-progressive-disclosure-of-universes.md)
  (a universe is a soft retrieval scope, and the disclosure gate that protects the word);
  [`0035-a-universe-profile-is-a-note-plus-an-injected-digest.md`](0035-a-universe-profile-is-a-note-plus-an-injected-digest.md)
  (what a session may be handed, and the leak that decided it);
  [`0009-prefer-deterministic-mechanisms.md`](0009-prefer-deterministic-mechanisms.md) (the core
  decides and the skill relays — the mechanism this ADR relies on);
  [`0036-deterministic-channels-differ-by-surface.md`](0036-deterministic-channels-differ-by-surface.md)
  (a disclosure the owner's surface never receives is not a disclosure);
  [`0043-graduated-autonomy-and-plain-language.md`](0043-graduated-autonomy-and-plain-language.md)
  (the register every one of these sentences is written in). Issues
  [#68](https://github.com/tpierrain/kenjaku/issues/68), [#72](https://github.com/tpierrain/kenjaku/issues/72),
  [#82](https://github.com/tpierrain/kenjaku/issues/82), [#66](https://github.com/tpierrain/kenjaku/issues/66).

## Crux

- **The decision:** whenever the brain **narrows what it will answer from**, the same gesture names
  **what stayed wide**. A scope change that is correct and silent is not a feature working, it is a
  claim the owner cannot check.
- **The guarantee that makes it trustworthy:** the sentence is emitted by the **deterministic core**
  that performed the narrowing, never composed by the model (ADR 0009). A disclosure the assistant
  decides whether to make is a disclosure that goes missing on the day it matters.
- **The four scopes, and they move independently:** *retrieval* (what search returns), *the
  conversation window* (what the assistant already read), *the live connectors* (which account each
  tool is authenticated as), and *the filing path* (where a new note lands). Every defect this ADR
  answers is one of them moving while another did not.
- **Prior art:** the **principle of least astonishment**, and operationally the ordinary discipline of
  **showing the filter next to the result** — a BI tool naming the filters behind a number, a search
  UI showing its active facets, `git status` naming the branch before the diff, `kubectl` printing the
  namespace it acted in. The industry standard is not *scope silently and correctly*; it is *show the
  scope with the answer*. Nothing here is invented.

## Context

Universes are a **soft retrieval scope** (ADR 0034): the active pointer decides which notes a search
returns, and the design is deliberately additive and invisible until a second universe exists. What
experience added is that the pointer is only **one** of several scopes a session runs under, and the
others do not follow it:

- `/switch` re-points retrieval server-side and **cannot** re-scope the assistant's own conversation
  window, which still holds everything read in the sphere just left. The answer then *looks* scoped
  and is not, and the assistant can restate an out-of-scope fact as established and uncited.
- The single-account native connectors (Slack, Notion, Google, mail) do not follow a switch either.
  This one was already disclosed, deterministically, and that reminder is the shape the rest copies.
- Filing is decided by reading the note's content, and it is usually **right** — which is exactly what
  hides a drift: a note that lands in the correct folder produces no symptom, so a pointer can be
  stale against a whole day's work and nothing looks wrong.
- And a scope that is correct the whole time still has to be **said**. A report that names everything
  that did *not* change, while omitting the one scope in play, reads as an omission, not as discretion.

The common failure is not incorrect scoping. In every case measured, the scoping was **right**. What
was missing was the sentence.

## Decision

1. **A gesture that narrows a scope names what it did not narrow, in one sentence, at the moment it
   narrows.** Not in documentation, not on request: in the output of the gesture.

2. **The core says it; the skill relays it** (ADR 0009). The sentence is built by the deterministic
   function that performed the change, which also owns **when** it applies. A skill is forbidden from
   deciding whether a disclosure is warranted, because deciding requires state the model would have to
   infer — and the inference is what fails silently.

3. **Conditions are reasoned per scope, and opposite conditions are expected.** Two disclosures about
   two different scopes may fire on opposite gestures. Leaving the cross-cutting scope *widens* what is
   reachable, so it owes no residue disclosure; entering a named sphere *changes which accounts apply*,
   so it owes a connector one. An apparent asymmetry between two reminders is a sign they are about
   different scopes, and it is asserted in both directions rather than explained in a comment.

4. **Unconditional disclosure is a defect, not extra safety.** A sentence printed when it cannot apply
   trains the reader to skip it, which costs the occasions when it does apply. The condition is part of
   the disclosure.

5. **A state that is not yet disclosed is asked of the core, never counted by the model.** Where the
   decision depends on counting (how many universes exist, which side of the progressive-disclosure
   gate a brain stands on), the core exposes it as a value the skill can only relay.

6. **A disclosure must reach the surface the owner is actually on** (ADR 0036). A channel that the
   owner's client drops carries no disclosure, whatever the code prints.

## Safety invariant

**No disclosure is paid for with content.** A scope disclosure names *which* scope moved and *which*
did not; it never solves the problem by injecting the material itself into a channel the owner's screen
echoes. ADR 0035 §2 settles that trade for the session-start channel and this ADR does not re-open it:
`additionalContext` is printed verbatim before the owner types a word, in every screenshot, screen
share and transcript, and one such transcript reached a third party. **Where a fact genuinely must not
be re-derived wrong, the answer is a guard at the moment it would be got wrong, not a line printed at
every session start.** Disclosure is about the *shape* of the answer, never a licence to widen what
rides the ambient channel.

## How a write-time correction sequences with indexing and committing

The safety invariant above sends a must-never-be-wrong fact to **a guard at the write** rather than to
the session-start channel. That guard **corrects and reports afterwards; it never asks** — ADR 0043's
announce-then-act tier — because the case it exists for is a brain sent off to prepare eight meetings,
where a question waiting for an answer is a halt, and a halt is worse than a misspelling.

### The measurement that decided it — hooks on one event run CONCURRENTLY

This section used to plan for a corrector sitting on `PostToolUse`, beside `auto-commit`, and said the
host's ordering had to be **measured before this was built, not assumed**. It was measured, on
2026-09-12, against Claude Code 2.1.220 on macOS, with two probe hooks that log a monotonic clock,
busy-wait 700 ms and report what the file contains at each end. **The answer is concurrently**, and it
is the answer that changes the design:

- Their 700 ms busy phases **overlapped**: the observer finished still seeing the *uncorrected* bytes
  while the corrector was mid-flight. Start times were µs to ms apart, in two separate processes.
- **Both shapes behave the same** — two commands inside one `matcher` group, or two `matcher` groups on
  the same event. There is no sequential shape to reach for.
- **Declaration order decides nothing**: the corrector was declared first and started second, in both
  shapes. So *"order the lines in `settings.json.template`"* was never an available lever, and a test
  pinning that order would have pinned a coincidence.

So a `PostToolUse` corrector cannot guarantee that `auto-commit` commits corrected bytes, and the
undo would sometimes be one commit and sometimes two — decided by a race, which is the one thing an
undo instruction may not be.

### What replaces it — correct the tool INPUT, before the bytes exist

The same probes established that a `PreToolUse(Write|Edit)` hook may **rewrite the tool input** and
have the host apply the rewritten version: emitting `hookSpecificOutput.updatedInput` made the note
land already corrected, and the `PostToolUse` observer — `auto-commit`'s own seat — never saw anything
but the corrected content. Two further properties were measured because the design leans on them:

- **It works without claiming a permission decision.** `updatedInput` alone is honoured, so the guard
  never has to emit `permissionDecision: "allow"` — which would have auto-approved *every* write it
  touched, including ones the owner's own rules would have stopped. **Correcting must not grant.**
- **It works on `Edit`, not only `Write`**: the rewrite lands on `new_string`, so a correction applies
  to an existing note being amended exactly as to one being born.
- **A concurrent REFUSAL still wins.** The brain already runs a `PreToolUse(Write|Edit)` hook that
  denies a note the indexer could not read (F11/F12), and it now runs beside one that rewrites the
  input. Measured on the same host: with both answering the same call, the write does not happen. So
  adding a corrector cannot silently disarm the guard next door — which is the one regression this
  arrangement could have shipped without anybody noticing.

```mermaid
sequenceDiagram
    autonumber
    actor Owner
    participant Brain as Brain (the agent)
    participant Guard as Guard<br/>(PreToolUse hook)
    participant Host as Host (Claude Code)
    participant Commit as auto-commit<br/>(PostToolUse hook)
    participant Rag as Watcher + indexer<br/>(search server)

    Owner->>Brain: "prepare my eight meetings"
    Brain->>Guard: Write/Edit — the wrong spelling is still<br/>in the tool INPUT, nothing on disk yet
    Guard->>Guard: replaces the declared wrong spelling<br/>in the input, records the correction
    Guard-->>Host: updatedInput (no permission decision)
    Host->>Host: applies the CORRECTED input — one write
    Note over Rag: T0 — the only write there is:<br/>5 s debounce armed on correct bytes
    Host->>Commit: (PostToolUse) commits — it can only<br/>ever see the corrected file
    Note over Rag: T0+5 s — indexes the<br/>corrected content, once
    Brain-->>Owner: result + one batched sentence:<br/>"I corrected the spelling; say so and I undo it"
```

**What this buys, and it is why the concurrency finding was good news:** the file is written **once**,
so there is no second write to race, no debounce to re-arm, no window in which a search returns the
wrong spelling, and no commit that can capture a version the owner never approved. The three-process
ordering problem is not solved, it is **deleted** — the two remaining processes cannot disagree,
because only one version of the bytes ever existed.

**The backstop, kept for any correction that must ever land after the fact**: the incremental index
diffs on a `sha256` of the file's raw content, never a timestamp, so a file whose bytes changed is
re-indexed, always. **No permanent divergence between disk and index is representable** — that
property stands whatever the write path, and it is what makes a post-hoc repair safe if one is ever
needed.

**What the correction costs instead, stated because it is the new trade-off:** the model believes it
wrote what it submitted. The bytes are right and the writer's recollection is not, which is precisely
why the report back is not optional decoration — it is the only thing that closes the gap, and why it
must survive the model forgetting to mention it.

**What the corrector never rewrites**, because falsifying a record is a worse defect than the one being
repaired: fenced and inline code, link targets, and **quoted material**. A wrong spelling inside
*"Marie wrote: …"* is what Marie wrote; there the guard reports and leaves the bytes alone.

## Consequences

- Every core that re-points a scope grows a small pure reminder beside it, and a test asserting **both**
  the case where it speaks and the case where it stays silent. The silence is half the specification.
- Skills get shorter, not longer: they relay strings instead of reasoning about when to warn.
- The four scopes become nameable in review. *"Which scopes does this gesture move, and which does it
  leave?"* is a question a reviewer can ask of any new command, and it is the review question this ADR
  exists to make askable.
- A session-start surface stays **as narrow as ADR 0035 left it**. This ADR adds obligations to the
  *acting* surfaces, not to the ambient one.

## Rejected alternatives

- **Document the scopes and rely on the assistant to mention them.** Considered and rejected: the
  assistant has no reason to compare a path it just chose against a pointer it was told about once, at
  the top of a conversation that may be hours old. This is the determinism argument of ADR 0009,
  observed rather than assumed — ten hours of work went by under a stale pointer with every write
  correct.
- **Re-scope everything automatically instead of disclosing.** Rejected for the conversation window
  (clearing it would destroy the legitimate case of switching *in order to* carry something across) and
  for the filing path (auto-switching the pointer from one file's location guesses intent, and a wrong
  auto-switch moves the scope under the owner without asking, which is worse than a stale pointer).
- **Warn on every gesture, unconditionally.** Rejected as point 4: it is how a net stops being read.
- **One generic "scopes may differ" notice.** Rejected: it names nothing, so it cannot be acted on.
  The value of these sentences is entirely in naming *which* sphere and *which* scope.
