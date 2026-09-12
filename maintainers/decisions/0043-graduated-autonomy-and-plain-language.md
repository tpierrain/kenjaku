# ADR 0043 — Graduated autonomy: three tiers gated on reversibility, and plain language in every string

- **STATUS:** ACCEPTED (2026-09-12).
- **Scope:** Second brain (runtime) — the doctrine the brain reads
  (`CLAUDE.engine.md` and its French twin) and, through it, the design of every delivered skill and
  hook that talks to a human. **No installer flow change**, no index schema change, no change to the
  sacred constitution surface.
- **Related:** [`0009-prefer-deterministic-mechanisms.md`](0009-prefer-deterministic-mechanisms.md)
  (a deterministic gesture is exactly the one that needs no question — this ADR names the tier that
  follows from it); [`0036-deterministic-channels-differ-by-surface.md`](0036-deterministic-channels-differ-by-surface.md)
  (what the brain must be *seen* to say has one universal channel, the chat message — which is why a
  question buried in it is a real failure mode); [`0026-brain-self-converges-via-idempotent-reconciler.md`](0026-brain-self-converges-via-idempotent-reconciler.md)
  (converging without asking is the silent tier already shipped); issue
  [#79](https://github.com/tpierrain/kenjaku/issues/79) (the observation), issue
  [#98](https://github.com/tpierrain/kenjaku/issues/98) (the first string this doctrine governs).

## Crux

- **The decision:** replace the binary posture — *read-only runs on its own, every write is
  confirmed* — with **three tiers of autonomy**, chosen by one gate: **how reversible the gesture is,
  and how confident the brain is**. 🟢 act silently · 🟡 announce in one batched message, then act
  unless vetoed · 🔴 genuinely ask, in plain language, saying why it matters.
- **The guarantee that makes it safe:** everything the brain writes is **auto-committed**, so every
  🟢 and 🟡 gesture is one `git revert` away. Autonomy is bought by the safety net, not by optimism.
- **The second half, inseparable from the first:** whatever tier a string belongs to, it is written
  for a **non-technical reader** — no tool jargon, and every reply says out loud whether it asks
  something. A 🔴 asked in jargon is not a question, it is a wall.
- **Prior art:** levels of automation (Sheridan & Verplank 1978; SAE J3016) — automation is a
  spectrum chosen by the cost of being wrong, not a switch. `terraform plan → apply`, `git push
  --dry-run`, `apt -s`: the 🟡 shape, already standard. **Undo over confirm** (Nielsen's
  error-prevention heuristic, Gmail's *Undo Send*), and the warning-habituation literature that says
  why: a dialog shown often enough is answered without being read. Plain-language standards
  (plainlanguage.gov, the GOV.UK content style guide) for the wording half.

## Context — what the brain became, measured

The second brain's original promise is that **things happen on their own**. Two shipped features,
both good, took it away one prompt at a time: `/lint` diagnoses four classes of wiki damage and
proposes a fix for each; `/consolidate` scans captures and proposes a page per candidate. Both were
built on the standing posture — *propose first, write on yes* — and both are right to write nothing
unasked.

The result, in one real session, was **about five subset-picker prompts in a row**, and the owner's
verdict: *"I don't understand the subject or the options."* The prompts spoke of orphans, dangling
links, frontmatter and raw-dump zones — the vocabulary of the machinery, to someone who wanted their
notes tidied. **The magic was traded for a dashboard.**

Two distinct defects live inside that sentence, and separating them is what makes this decision
actionable:

1. **The posture is binary where the world is not.** Fixing an unambiguous typo in a link whose
   target obviously exists, and merging two people who might be the same person, are both "writes" —
   so both were confirmed. One of them never needed a human.
2. **The words are the machinery's, not the reader's.** Even a question that genuinely deserves
   asking fails if the person cannot tell what is being asked or what it costs them.

The same shape reached the field from the other end. `/update-engine` collects consent in the **last
line of a long message** it is required to quote in full — so the better the release notes, the
further the only actionable sentence is pushed off screen. **A brain owner believed the upgrade had
run.** It never had. That is not a missing confirmation: it is a confirmation nobody could see, which
is what a 🔴 looks like when its presentation is an afterthought.

## Decision

1. **Three tiers, and every gesture the brain can make belongs to exactly one.**

   - **🟢 Silent auto** — deterministic, reversible, and the brain is sure. Do it; do not ask, do not
     announce. *Examples: repair a link whose target is an unambiguous spelling of an existing note;
     stamp a missing date read from the note's own content; exclude structural noise from a health
     report.*
   - **🟡 Announce, then act** — reversible, but a human would want to know it happened. **One
     batched message** naming the N gestures, then act unless the user says stop. *Examples: the
     background source sync; the end-of-session ritual; adding the missing frontmatter keys on twelve
     notes.*
   - **🔴 Genuinely ask** — a judgment call, or something the brain cannot cheaply undo. *Examples:
     merge two maybe-different people; create a page that shapes the taxonomy; resolve a
     contradiction between a page and a fresher capture; run the engine update.*

2. **The gate is reversibility × confidence, in that order.** Irreversible ⇒ 🔴, whatever the
   confidence. Reversible and certain ⇒ 🟢. Reversible and uncertain ⇒ 🟡 if the uncertainty is about
   *taste*, 🔴 if it is about *facts* — an uncertain fact written into the vault becomes what the
   vault knows, and every later answer resolves against it.

3. **Auto-commit is what buys the autonomy, and it is named as such.** Every write the brain makes is
   committed, so a 🟢 or 🟡 gesture is recoverable by `git revert` with the owner's own history as the
   record. **A gesture that escapes the auto-commit net cannot be 🟢** — which is exactly why issue
   [#77](https://github.com/tpierrain/kenjaku/issues/77), where a script-written note lands on disk
   and is never committed, is a defect in this doctrine's foundation and not merely in a hook's
   matcher.

4. **🟡 replaces a cascade with a summary — that is the whole cure.** Five prompts answered one by one
   is five interruptions; the same five announced in one message is one. The user's move is a
   **veto**, not an authorisation: silence means proceed, and that asymmetry is the point.

5. **Every string a human reads is written for a non-technical reader.** No tool jargon (`orphan`,
   `frontmatter`, `fan-out`, `dangling`) in a user-facing sentence; name the thing and what it costs
   them instead. A 🔴 states **why it matters** in one line before the options.

6. **Every reply says whether it asks something.** Either *nothing to decide*, or **the single
   question**, alone, with what each option costs and a recommendation. An ambiguous report reads as
   a hidden request, and makes the reader hunt a long message for the ask.

7. **Where the host offers a dedicated question control, a 🔴 uses it.** A clickable question is a
   visible control; a sentence at the end of a long message is text to spot. **The prose question
   stays as the fallback** where the host has none — the same way the engine already handles a
   missing native tool. This changes how consent is collected, never whether it is required: an
   unanswered question stays unanswered and nothing runs.

8. **This governs every NEW user-facing string from now on.** The doctrine ships with v5.2 precisely
   because that release emits new strings; the **audit of the existing ones is a separate, larger
   piece of work** (v5.4) and no part of it is claimed here.

## The tiers, tried against the strings that produced them

A doctrine ratified before the audit risks being theoretical, so it was written against the real
sample: the prompts the owner actually faced, and the two questions of #98. If the tiers could not
classify these, they were not ready.

| The real prompt | Tier | Why |
| --- | --- | --- |
| `/lint` — a link whose target is an unambiguous spelling of an existing note | 🟢 | Deterministic, certain, revertible. Asking buys nothing. |
| `/lint` — the missing `created` / `updated` keys, the date readable from the note | 🟢, announced in the 🟡 batch when there are several | No judgment is involved; the count is what the owner wants to know. |
| `/lint` — an orphan note: where should it be woven in? | 🟡 | Reversible and a matter of taste. Propose the N links in one message; act unless vetoed. |
| `/lint` — a dangling `[[people/…]]` target | 🔴 | Creating the card would become the vault's own answer to *who exists*. Not reversible in effect. |
| `/consolidate` — create a page for a person mentioned but never filed | 🔴 | Shapes the taxonomy; identity is a fact, and an uncertain fact becomes what the vault knows. |
| `/consolidate` — a capture contradicting a stated fact | 🔴 | The brain flags conflicts; it never adjudicates them. |
| `/update-engine` — "shall I run the update?" | 🔴, **clickable** | Consent is required by decision; the defect was that it could not be seen. |
| `/update-engine` — per customised file: take the new one / keep mine / combine | 🔴, **clickable**, and grouped when several are pending | Three named branches map one-for-one onto options; prose made them a paragraph. |

Two things the table settles that prose would have left open: the **same feature holds gestures of
different tiers** (`/lint` spans all three), so the tier belongs to the gesture and never to the
skill; and **a 🔴 is not a failure of the doctrine** — half the sample stays 🔴, and correctly. The
goal was never fewer questions, it was that every question deserves to be there and can be understood.

## Consequences

- **The standing "propose first, write on yes" guardrail in `/lint` and `/consolidate` is no longer
  the whole truth.** It remains exactly right for their 🔴 gestures and becomes wrong for their 🟢
  ones. Those skills are reclassified gesture by gesture — work this ADR opens and does not do.
- **`Announce before acting on a signal` is revealed to be the 🟡 tier**, written before the tiers
  existed. It is not restated: it names itself as that tier and defers to the model, because two
  paraphrases of one rule are two disciplines that will drift.
- **A silent-data-loss defect becomes a foundation defect.** Auto-commit is the premise of tiers 🟢
  and 🟡; a write path that escapes it (#77) removes the safety net the autonomy was bought with.
- **No deterministic guard can judge whether a sentence is plain.** A doc guard
  (`scripts/lib/autonomy-discipline.test.mjs`) holds that the rules are present, together, above the
  instance that applies them, and in both locales — never that a given string is well written. That
  half is a writing convention by construction, which is why it is stated here at length rather than
  delegated to a script.
- **Both locales move together.** `CLAUDE.engine.md` is a `merge`-regime file, so the French twin
  ships in the same commit or a brain holding those bytes stays frozen.

## Alternatives considered

- **Keep the binary posture and only fix the wording (rejected).** It addresses the jargon and leaves
  the interruption count untouched — and the count is what the owner reported first. A politely
  worded wall is still a wall.
- **Make everything silent and rely on `git revert` (rejected).** Reversibility is necessary, not
  sufficient: a person card created on a guess is revertible in bytes and not in consequence, because
  intervening answers already resolved against it. And an owner who must audit history to learn what
  their brain did has been given work, not autonomy.
- **A per-skill setting — "how autonomous should `/lint` be?" (rejected).** It asks the owner to
  answer, once and abstractly, a question they could not answer concretely in the moment; and it puts
  the tier on the skill, when the sample above shows one skill spanning all three tiers.
- **Two separate decisions, one for autonomy and one for plain language (rejected).** They are one
  defect seen twice: the tiers decide *whether* a sentence reaches the owner, the wording decides
  whether it lands. Split, each is carried without the other — and a 🔴 in jargon is precisely what
  was measured in the field.
