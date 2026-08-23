# ADR 0038 — "Sacred" splits in two: inviolable, and merge-governed

- **STATUS:** ACCEPTED (2026-08-21). **Amends [`0012`](0012-engine-packaging-four-part-model.md)** (which
  itself supersedes [`0003`](0003-no-brain-capability-upgrade.md)) — the four-part model and the three
  regimes stand unchanged; what this ADR narrows is the meaning of the **never-touch** category, which
  0012 wrote as one thing and which the field has since shown to be two.
- **Scope:** Second brain (runtime) — the engine's write allowlist
  (`scripts/lib/engine-apply-plan.mjs`) and the vocabulary the plans, the report and the ADRs use for
  it. **No behaviour change in this release**: every file that was off the copy path stays off it, and
  no new delivery is opened. **No installer flow change**, no index schema change, no manifest change
  beyond the one 0012's own regimes already allow.
- **Related:** [`0003`](0003-no-brain-capability-upgrade.md) and
  [`0012`](0012-engine-packaging-four-part-model.md) (the invariant this refines);
  [`0025`](0025-update-engine-installs-missing-engine-skills-and-servers.md) (the additive skills door,
  which is the same shape one level up); plan
  [`../plans/prospective/update-regime-owns-what-it-shipped-action.md`](../plans/prospective/update-regime-owns-what-it-shipped-action.md)
  (§ S2c, and the owner's arbitration box at the top).

## Crux

One word, **sacred**, was filing three different reasons, and the flattening cost a decision.

`.env` must never be written by anything, ever. `vault/` likewise: it is the owner's notes, which is the
product's entire promise. A skill the owner wrote themselves is untouchable because nobody ever claimed
it. But `CLAUDE.md` and `.claude/settings.json` are a different animal — they are **the owner's to
author**, and that is not the same sentence as "the engine must never reach them".

The cost was concrete. Asked *"may the engine ever update your constitution?"*, every carrier in the
repo answered *"no, it is sacred"* — an answer nobody had ever decided, inherited from a word that had
been chosen to protect something else. The question had to be put to the owner explicitly (2026-08-21)
before the release could proceed, and the answer was **yes, through the merge door only**.

## Context

- 0012 named three regimes (`replace`, `merge`, `never-touch`) and a four-part model. Its **never-touch**
  row bundles Content (the vault) with Personal Extensions (what the owner authored). Both are "theirs",
  as 0012 says, but *by data* and *by authorship* — 0012 makes that distinction in prose and then hands
  the code a single list.
- The code inherited the flattening: `SACRED_FILES = ["CLAUDE.md", ".claude/settings.json", ".env"]`, one
  array, one word, three reasons.
- 0012 was also written **before the constitution split in two** (v4.0.0). Its Engine row and its Merge
  regime still say *the constitution `CLAUDE.md`*, which has not described reality since a thin, sacred
  `CLAUDE.md` began `@import`ing an engine-owned `CLAUDE.engine.md`. That staleness is corrected in 0012
  itself, in the same pass as this ADR.
- The write guard shipped just before this (plan S3) needed **the same pair** to answer the mirror
  question: *may the agent write here without asking?* It named them `OWNER_AUTHORED` and said so in its
  own docstring. Two modules had found the same boundary from opposite sides.

## Decision

**The never-touch category splits in two, and the code carries both names.**

1. **Inviolable** — `.env`, `vault/`, and every skill the manifest does not declare. No regime, no door,
   no merge, ever, whatever a manifest declares. There is no legitimate engine write to qualify, so
   nothing is qualified.
2. **Merge-governed** — `CLAUDE.md` and `.claude/settings.json`. Off the **copy** path exactly as
   before, and for a different reason: the engine may reach them **only** through a three-way merge from
   a **provable** base — never by copy, never on a conflict. On a conflict the owner's bytes stand and
   the engine reports.

**One boundary, one constant.** The merge-governed list **is** the guard's `OWNER_AUTHORED`, imported
rather than restated, and pinned by a test asserting *reference* equality: two lists that agree today are
two lists that disagree the day one of them is edited.

**A door named is not a door open.** Nothing in this release delivers either file. `CLAUDE.md` has no
ancestor machine yet — with no provable base there is no merge, only a preserve — and
`.claude/settings.json` is written **surgically** by the reconciler's hook reconcile, which stays the
right mechanism for a JSON file whose two sides both append to the same arrays. Naming the door is what
lets the follow-on chantier be discussed honestly instead of being blocked by a word.

## Consequences

- **No behaviour change, and that is deliberate.** The scrub removes exactly what it removed before;
  three tests pin it, including one whose only job is to stop the rename being read as a green light.
- **The question stops being pre-answered.** "May the engine write the constitution?" now has a place to
  be answered per file, with a mechanism attached, instead of colliding with a blanket noun.
- **The two questions stay independent.** Whether the *engine* may write `CLAUDE.md` says nothing about
  whether the *owner* may — S3's guard invites them to, on the same pair, and did not wait on this ADR.
- **What is still owed**, and named here so it is not mistaken for shipped: the **ancestor machine**
  (reconstructing a provable base for a file the engine delivered before it recorded provenance) is its
  own chantier. Until it lands, a deployed brain's `CLAUDE.md` and `CLAUDE.engine.md` are *preserved and
  reported*, never merged.
- **Assisted conflict resolution** — walking the owner through a clash rather than ending at "the engine
  wrote nothing" — is also its own chantier, with its non-negotiables already recorded in the plan (the
  LLM chooses **between** two existing texts and never authors the merged one; one atomic write; it lives
  **outside** `update-engine.mjs`, which runs non-interactively). This release ships only the pointer
  sentence.

## Prior art — why this is not NIH

_(Carried here on 2026-08-23 from the 2026-06-21 analysis this decision made obsolete, whose one durable
contribution was the survey. §6quinquies: an ADR that quietly re-derives a known standard reads as NIH.)_

**The problem is the oldest one in package management: a file the vendor owns and the operator edits.**
Three established answers exist, and this design deliberately picks the second with the third as its
fallback:

- **Merge-governed = git's 3-way merge.** `base` / `theirs` / `mine`, auto-apply the clean hunks,
  surface only the real conflicts. Feasible here for the reason it is feasible in git: we keep the
  ancestor (`.engine-base/`, the bytes the engine last *delivered*). Without that base there is no
  merge — which is precisely the argument, above, for not opening the door on `CLAUDE.md`.
- **The fallback = Debian `dpkg` conffiles / `ucf`, and RPM's `.rpmnew`.** On a conflict: keep the
  operator's file, drop the vendor's version *beside* it, and say so. Zero auto-merge risk, and the
  human decides. Ours is the three offers (*take the new one / keep mine / combine*), which is
  `dpkg`'s prompt with the combine case added.
- **The road NOT taken = a delimited managed block inside the file** (Ansible's
  `BEGIN/END ANSIBLE MANAGED BLOCK`, the same trick in `/etc/hosts` and `known_hosts`). The 2026-06-21
  analysis recommended it as the foundation: it eliminates conflicts by construction. **v5.0.0 chose a
  cleaner variant of the same insight — split the file rather than fence a region of it**:
  `CLAUDE.engine.md` is engine-owned and merge-governed, the owner's `CLAUDE.md` stays off the copy
  path entirely. Same goal (separate what the engine owns from what the owner owns), without a parser
  for markers a hand-edit can break.

## Alternatives considered

- **Leave "sacred" as one word and decide per file in the plans.** Rejected: the flattening had already
  produced a wrong answer once, in four different carriers, and a vocabulary that makes the wrong answer
  the easy one will do it again. The word is the defect.
- **Open the merge door for `CLAUDE.md` in this release.** Rejected as dishonest rather than unsafe:
  without an ancestor there is no merge to open, so the door would be named, wired, and reach nobody —
  the exact "shipping something the fleet never receives" this release exists to end.
- **A line-based merge for `.claude/settings.json`.** Rejected: it is JSON, both sides append to the same
  arrays, and the reconciler already does it structurally and idempotently. A text merge would be a
  worse mechanism wearing a more general name.
- **Two separate constants for the same pair, one per module.** Rejected: that is the drift this ADR
  exists to prevent, and it is cheap to prevent by identity.
