# ADR 0039 — The engine may retire a skill: declared, and provenance-guarded

- **STATUS:** ACCEPTED (2026-08-21). **Amends [`0025`](0025-update-engine-installs-missing-engine-skills-and-servers.md)**,
  whose door is install-**if-absent** and therefore additive by construction. That property was never
  argued for; it was a consequence of the only mechanism there was. This ADR opens exactly one
  subtractive door beside it, and fixes its shape so it cannot widen later.
- **Scope:** Second brain (runtime) — the update path (`update-engine` → `reconcileBrain`) and the
  manifest, which gains a **`retired`** key as a sibling of `regimes`. **Behaviour change on deployed
  brains**: an untouched copy of a retired skill is deleted. No installer flow change, no index schema
  change. The first (and, at this writing, only) tombstone is `.claude/skills/tdd-discipline/**`.
- **Related:** [`0025`](0025-update-engine-installs-missing-engine-skills-and-servers.md) (the additive
  skills door this amends); [`0036`](0036-deterministic-channels-differ-by-surface.md) (the status-line
  retreat — the engine's only previous removal, and the shape copied here);
  [`0012`](0012-engine-packaging-four-part-model.md) and
  [`0038`](0038-sacred-splits-inviolable-and-merge-governed.md) (the write allowlist a delete now has to
  pass through); plan
  [`../plans/prospective/update-regime-owns-what-it-shipped-action.md`](../plans/prospective/update-regime-owns-what-it-shipped-action.md)
  (§ S6).

## Crux

The engine could ship a skill and could refresh it. It could not stop shipping one.

So a skill the product had moved on from sat on every deployed brain forever, still loaded at every
session start, still shaping how the agent worked — and the owner had no way of knowing it had been
superseded. `tdd-discipline` is the case that forced the question: it was measured, its opening rule did
not survive the measurement, and its successor `test-first-discipline` was written. Delivering the
successor without retiring the predecessor leaves every brain holding two doctrines that contradict each
other on the one rule that mattered.

## Context

- **The engine's surface is additive by construction, not by decision.** 0025's mechanism is
  install-if-absent at the skill-directory level; there has simply never been a code path that removes
  anything under `.claude/`. The invariant everyone quotes is a description of the tooling, not a
  promise anyone made.
- **There is exactly one precedent, and it is a good one.** ADR 0036's status-line retreat removes the
  engine's own `statusLine` entry from `settings.json` — nominatively, guarded by provenance, with an
  explicit rule that *when unsure, do NOT remove*. It has been in the field without incident, and its
  shape is what this ADR generalises to a skill directory.
- **The cost is wildly asymmetric.** A leftover skill is cosmetic: it clutters, it may mislead, nothing
  is lost. Deleting a directory the owner had put work into is unrecoverable from their point of view
  (the brain is a git repo, but "it is in the reflog" is not an answer you give someone who has just
  lost their notes on a Tuesday).

## Decision

**One door, one shape.** The engine may remove a skill directory, and only that, when both hold:

1. **It is DECLARED.** The target manifest carries a `retired: []` list — a sibling of `regimes`, not a
   regime — naming the skill by glob. A removal is never *inferred*.
2. **It is PROVABLE.** Every file under the directory matches its recorded provenance fingerprint, and
   the directory holds no file the engine never delivered. Any doubt — no record, an edit, one extra
   file the owner dropped in — **preserves the whole directory and says so, naming the file that
   blocked it**.

**Why declared and not inferred.** The tempting rule is "a skill in the brain that the target manifest
no longer declares is retired": no new vocabulary, derived for free. It is refused, because a truncated,
stale or hand-broken manifest would then read as *"retire everything"* — and this repo's whole reflex is
the opposite one (`computeApplyPlan` answers *"you may write nothing"* to a manifest it cannot read). A
delete is the most destructive write there is, so it must be the most explicitly named.

**A tombstone beats a regime.** Where a manifest both declares a skill `merge` and retires it,
the tombstone wins: `computeApplyPlan` subtracts it from `installSkills`, and `selectMergeFiles`
subtracts it from the merge regime outright. This is not defensive decoration — it was **measured**. The
reconcile's install-if-absent, and then the skills refresh's absent-install, each put a just-deleted
directory straight back **in the same pass**. A file the engine no longer ships is not a file it merges.

**What the owner is told**, and it is not "a glob was removed":

- removed → the skill is named, with the reason it was safe to remove (their copy held none of their own
  edits);
- kept → the skill is named with the file that blocked it, in **two different sentences** depending on
  whether the owner really edited it or the brain simply has no record. The second case is the fleet's
  default state, and telling those owners "you had changed it" would be a false claim of exactly the
  kind ADR 0036's sibling work (S4-3) was written to end.

**Tombstones are never pruned early.** A brain upgrading from v4.x months from now must still hear that
the skill is gone. There is no expiry mechanism and this ADR deliberately adds none; the day the list is
long enough to hurt, that is a cohort decision, not a cleanup reflex.

## Consequences

- The manifest grows one key. Every manifest shipped before this release lacks it, and reads as "retire
  nothing" — the only safe default.
- The launcher must stop shipping what it retires, in the same change: `.claude/skills/tdd-discipline/`
  and `templates/fr/.claude/skills/tdd-discipline/` are deleted here. A source that still carried them
  would re-deliver them to every fresh install.
- Dropping the `merge` entry and adding the tombstone are **ONE** manifest change. Doing only the second
  would have the update delete the directory and the next SessionStart's self-heal restore it, forever —
  `session-self-heal` rebuilds its desired state from the brain's own manifest.
- Most brains will hear nothing: a brain that never had the skill is `absent`, which is neither a
  deletion nor a rescue and appears in neither list.
- **A brain with no provenance keeps the skill**, and that is the fleet's standing state until the
  ancestor machine exists. This ADR does not make the retirement universal; it makes it *safe*, and
  loud enough that the owner can finish it by hand.

## Alternatives considered

- **Infer the retirement from the manifest's silence.** Refused above: it turns a parse failure into a
  fleet-wide delete.
- **A general uninstall feature** (any path, any regime). Refused: the argument for this door is the
  provenance guard plus the narrowness of what it can name. A door that can remove any declared path is
  a different decision, with a different blast radius, and nobody has needed it.
- **Ship the successor and leave the predecessor.** The status quo, and the reason this release exists:
  two contradictory doctrines loaded at every session start, with nothing telling the owner which one
  the product still stands behind.
- **Deprecate in place** (leave the files, mark them obsolete in their own front matter). Rejected: the
  skill is loaded by the agent, not read by the owner, so a notice inside it changes the behaviour of
  nothing. The only way a retired skill stops shaping a session is to stop being there.
