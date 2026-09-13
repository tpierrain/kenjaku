# ADR 0045 — An important question is a control you click, not a sentence you can scroll past

> **The rule is wider than the case it was measured on.** It is named after the engine update because
> that is where it cost someone a version they thought they had. It covers every question that decides
> the life of a brain: installing it, where the text of your notes goes, updating its engine, whether
> it is backed up anywhere but this laptop.

- **STATUS:** ACCEPTED (2026-09-13) — ratified by the owner, asked as a clickable question.
- **Scope:** Second brain (runtime) + Installer — the delivered skills that ask a lifecycle question,
  and the install conversation the bootstrap `CLAUDE.md` drives. **No index schema change**, and no
  change to *which* gestures require consent.
- **Related:** [`0043`](0043-graduated-autonomy-and-plain-language.md) (the three tiers, and the
  register every question is written in; its point 7 named this control for one tier of runtime
  strings, and this ADR generalises it), [`0009`](0009-prefer-deterministic-mechanisms.md) (the
  program decides that a question is due; the control is only how it reaches the person),
  [`0036`](0036-deterministic-channels-differ-by-surface.md) (a control a surface cannot render must
  degrade to prose), issue [#98](https://github.com/tpierrain/kenjaku/issues/98) (the field case).

## Crux

- **The decision, in one sentence:** every question that decides the life of the brain is asked with
  the host's **clickable question** (`AskUserQuestion` in Claude Code and the Claude desktop app),
  with the options spelled out — never as a sentence at the end of a long message.
- **What it buys:** someone in a hurry **cannot answer by scrolling**. The options are the only way
  forward, so a decision that has to be taken gets taken, by them, knowingly.
- **What it costs them:** one click, on the handful of moments that deserve to stop them. Guardrail 1
  is what keeps that handful small.
- **The guarantee that keeps it honest:** the control changes **how** a question is asked, never
  **whether** the answer is required. An unanswered question stays unanswered and nothing runs.
- **Prior art:** the forced choice every installer and package manager already makes you face (`apt`
  on a config file you edited, an OS update's *Install tonight / Remind me*), and GOV.UK's
  *one thing per page* question pattern. The counterweight is prior art too: **warning habituation**,
  a dialog shown often enough is answered without being read — which is exactly why this is reserved
  for the questions that deserve to interrupt.

## The problem, as it is actually lived

1. **Your engine has a newer version waiting.** The brain must quote the release notes in full for
   your consent to mean anything, so the only actionable sentence — *shall I run it?* — ends up at the
   bottom of a long message. You scroll, you see the word "update", you assume it happened. **It never
   ran.** (Measured in the field, on a real brain owner, #98.)
2. **You install your brain between two meetings.** One of the questions decides whether the text of
   your notes stays on your machine or is sent to an API. Written as three paragraphs, it reads like an
   explanation, and an explanation gets skimmed: you end up with a default **nobody chose**.
3. **The end of the install asks whether you want a copy elsewhere**, so your brain is backed up. That
   line arrives in the same message as the big *open a new conversation* banner. You do the banner. Six
   months later your notes exist on one laptop and nowhere else.

**None of these is a wording defect** — those messages are already written in plain words, which is
what ADR 0043 asked for. The defect is the *shape*: prose can be scrolled past, a control cannot. And
the person it fails is precisely the one who is busy, which is most people, most days.

## The decision

1. **A question that decides the life of the brain is asked with the host's question control**, one
   question at a time, each option labelled in ordinary words. Those questions are: **installing a
   brain** and every choice made during it (its name, where it lives, and above all **where the text of
   your notes goes**), **updating the engine** and each per-file choice inside it, **wiring up or
   removing a backup**, **importing another brain's notes**, and **any choice the brain cannot undo for
   you afterwards**.
2. **Each option says the consequence, not the mechanism** — *"nothing leaves your machine"*, not
   *"in-process embedder"*. Where one option suits most people, it comes **first and says it is the
   recommendation** (ADR 0043 §5).
3. **The question is the whole reply, not its last line.** Everything needed to decide — the release
   notes, what sending your notes to an API means — comes **before** it, and the control itself carries
   no information that exists nowhere else.
4. **The program decides a question is due; the control is only how it reaches the person**
   (ADR 0009). Nothing to install ⇒ nothing is asked: a question with one real answer is noise.
5. **Where the surface offers no such control, the prose question stays the fallback**, with the same
   options in the same order (ADR 0036).

## Guardrails

- **Only the questions that deserve to stop you.** The 🟢 and 🟡 gestures of ADR 0043 grow no buttons:
  a control raised twenty times is clicked unread, and then it protects nothing. Widening this list is
  a decision, not a convenience.
- **A destructive gesture keeps its typed confirmation.** A button is far easier to hit by accident
  than a name is to type, so deleting a universe, or anything that removes notes, stays armed by the
  person **typing the thing's own name**. This ADR makes choices harder to miss; it must never make
  destruction easier to reach.
- **Consent is not lowered anywhere.** Nothing that was confirmed becomes automatic because it is now
  one click away.
- **"Other" stays reachable.** The options are the common paths, never a cage: free text is how someone
  tells us the case we did not foresee (their own company endpoint, a path of their own).

## What accepting this does NOT change

- **No code today.** The engine update already asks this way, and
  [`scripts/lib/clickable-consent-discipline.test.mjs`](../../scripts/lib/clickable-consent-discipline.test.mjs)
  holds it there, in both locales.
- **What it costs from here on:** the install conversation and the skills that ask a lifecycle question
  are audited one question at a time, and that guard widens from *"the update asks this way"* to *"each
  of these asks this way"*. **Work this ADR opens and does not do.**
- **Not one gesture changes tier.** Which gestures require an answer is ADR 0043's decision and stands
  untouched.

## Rejected alternatives

- **Leave it as point 7 of ADR 0043** — that point covers one tier of *runtime* strings and its ADR
  explicitly excludes the install conversation, where two of the three situations above happen. And a
  rule reachable only from inside another decision is the buried-sentence failure this ADR exists to cure.
- **Make every question a control** — habituation: the twentieth click is not a decision.
- **Shorten the messages instead** — the release notes must be quoted in full for consent to be
  informed (ADR 0009), so shortening trades one defect for another.
- **Ask everything up front in a settings file** — it asks people to decide abstractly what they could
  not decide concretely in the moment; ADR 0043 rejected the per-skill variant of the same idea.
- **Wait for a control every host agrees on** — the prose fallback already covers the hosts that have none.
