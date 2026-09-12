---
name: lint
description: "Health-check the vault's wiki (Axis 1): report where it bleeds — dangling [[links]], orphan notes nobody links to, stale entity pages left behind by fresher notes, and malformed frontmatter. Runs a deterministic scanner and reads its binary report, then acts, announces or asks depending on the gesture (ADR 0043's three tiers). Triggered by '/lint', 'lint my vault', 'check my wiki health', 'what links are broken', 'où mon wiki fuit', 'vérifie la santé de mes notes'."
version: 1.2.0
---

# lint — wiki-health check ("where is my wiki bleeding?")

> The retrieval side of the brain (the RAG) is a versioned, tested engine. The **curation**
> side — keeping the wiki itself healthy: links that resolve, notes woven in, entity pages kept
> fresh — is this skill's job. It is the deterministic half of the Karpathy "LLM-Wiki compile"
> discipline (see ADR 0033): the scan is exact and fail-loud; the *judgment* of what to fix is
> yours (and the user's).

## Principle

One promise: **an honest, binary health report of the vault, then help acting on it.**
- The **scan is deterministic** (ADR 0009): pure code over the parsed notes, no LLM guessing.
- **Each fix belongs to a tier, and the tier belongs to the GESTURE, never to this skill**
  (ADR 0043). This skill spans all three: it repairs an unmistakable typo without asking, it
  announces a batch of small tidy-ups and proceeds unless stopped, and it refuses to invent a
  person's page on its own.

> ⚠️ **This replaces the old "propose first, write on yes" posture, and the replacement is
> deliberate.** That rule was right for the judgment calls and wrong for the obvious repairs — it
> is what turned a tidy-up into about five prompts in a row, in the machinery's vocabulary, for
> someone who had asked for their notes to be tidied. **What buys the change is the safety net,
> not optimism**: everything this skill writes is auto-committed, so any 🟢 or 🟡 is one
> `git revert` away in the owner's own history.

## Procedure

### 1. Run the scanner
From the brain folder:
```bash
node scripts/lint-vault.mjs
```
- Exit **0** = clean (say so plainly, do not invent problems).
- Exit **1** = issues found; the report lists them by category. Read it verbatim.
- To check a different path: `node scripts/lint-vault.mjs <vault-dir>`.

### 2. Read the report — five categories, and the first one is not like the others
- **Notes the engine cannot read** — listed FIRST, and the only finding here that costs the owner
  *answers* rather than tidiness. The note opens a frontmatter block the engine's indexer refuses,
  so it is never re-indexed: it stays searchable and answers **from its last good content**, quietly
  out of date, for as long as nobody fixes it. One was measured standing three weeks. Say it that
  way, in their words (*"this note still answers, but with what it said in August"*), never as
  *"invalid YAML"*. The usual cause is a note written by hand or through a shell command, with the
  frontmatter keys indented by a space or two.
- **Links pointing at a note that does not exist** `from → [[target]]`: a `[[link]]` whose target note is not there.
  Usually a typo, a renamed/moved note, or a note that was meant to be written and never was.
- **Notes nothing links to**: a note with **zero inbound links** (raw-capture zones `daily/`, `raw-sources/`,
  `inbox/` and `_inbox/` are already excluded — they are legitimately unlinked, and so are the
  engine's own notes, `type: engine`). An orphan is knowledge that is filed but never woven in, so
  the wiki (and the RAG's neighbourhood signal) can't reach it.
- **Pages your newer notes have moved past**: a curated entity page (`type: person|topic|company|project|concept`)
  whose `updated:` trails the freshest note that cites it by more than the threshold (default
  90 days). The world moved on; the canonical page didn't.
- **Notes missing their filing details**: a note missing a required key (`type` / `created` / `updated` /
  `tags`), so it indexes and sorts poorly. Raw-capture zones and the engine's own notes
  (`type: engine`, e.g. the RAG canary) are exempt: neither is a curated wiki node, and telling the
  owner to fix a file they are told never to touch is a complaint they can never clear.

### 3. Act, announce, or ask — one gesture at a time

**Sort every finding into its tier first, then make exactly ONE pass of each kind.** The order
matters: the silent repairs happen, the announcement covers everything else that is reversible, and
only genuine judgment calls become questions.

#### 🟢 Do it, say nothing

- **A link whose target is an unambiguous spelling of a note that exists** — `[[capacity-managment]]`
  when `topics/capacity-management.md` is right there. Deterministic, certain, revertible; asking
  buys nothing. *Unambiguous means exactly one candidate.* Two plausible targets is a 🟡.

#### 🟡 Announce them all in ONE message, then act unless stopped

Compose **one** message for the whole batch, **not one per finding**: the count first, then the list,
then the line that says silence proceeds. **Do not ask.** The owner's move is a veto — *"Say stop if
you'd rather I didn't — otherwise I'll go ahead."* Never a question mark, never "shall I?".

- **A missing `created` / `updated` the note's own content gives you** — a daily whose filename is
  the date, a note whose body opens on one. No judgment is involved; the count is what the owner
  wants to know.
- **A missing `type` / `tags`** — propose the value you would use, in the same batch. It shapes how
  the note is treated, so it is announced rather than silent.
- **A link with more than one plausible target** — name the one you would pick, in the batch.
- **A note nothing links to** — propose where to weave it in: which existing note(s) should gain a
  `[[link]]` to it, or which page it belongs under. Reversible, and a matter of taste.

#### 🔴 Ask, and say why it matters in one line before the options

- **A link pointing at a page for a person who has none.** Never create a `[[people/…]]` page to
  satisfy an incoming link. A card created that way becomes the vault's own answer to *who exists*,
  and every later resolution resolves against it — see the identity discipline in
  [`sync-sources`](../sync-sources/SKILL.md#identity-discipline). Repair the link where it was
  written, or leave it and say why: a broken link costs a click, a fabricated person is permanent.
- **A page the newer notes have moved past** → offer to refresh it from the notes that cite it (a
  Track-C consolidation gesture) and bump `updated:`. The refresh is distilled content, and content
  is a fact.
- **A note the engine cannot read** → open it, show the owner the block as it stands, and offer to
  put the keys back at the left margin. Change **nothing else**: the body is theirs, and the whole
  repair is usually the indentation. Once it is fixed the note re-indexes on its own and the finding
  disappears — say so, because a finding that clears itself is worth waiting one turn for.

> 🙋 **This last one is the open question of v5.4**, recorded in
> [`maintainers/registers/gestures.md`](https://github.com/tpierrain/kenjaku/blob/main/maintainers/registers/gestures.md):
> the repair is mechanical and it is the one finding that costs the owner *answers* rather than
> tidiness, so it has a case for 🟢. It stays 🔴 until the owner says otherwise.

#### And whatever the tier, the words

**Name what the owner has, never what the scanner calls it.** The report already does: it says
*"Links pointing at a note that does not exist"*, not *"Dangling links"*. Say a note "still answers,
but with what it said in August" rather than "invalid YAML". **Read the report's own headings back —
they are the vocabulary for this conversation.**

## Guardrails
- **The tier decides, not a blanket posture.** 🟢 acts, 🟡 announces once and proceeds unless
  stopped, 🔴 asks. What makes that safe is auto-commit, so **never** act on a write that would
  escape it.
- **One announcement, not one per finding.** Five messages in a row is the defect this release
  exists against, and it is a presentation defect before it is a tier defect.
- **Trust the exit code.** `0` means clean — do not manufacture findings to look useful. The exit
  code is unchanged (`0` clean / `1` findings): other scripts compose on it.
- **Do not run git** (the auto-commit hook persists any change, which is what buys the tiers).
- The scanner is **read-only** and **offline** (no network, no LLM): safe to run anytime.

## Out of scope
- Bulk auto-fixing the whole vault unattended. The 🟢 and 🟡 tiers are per-gesture and bounded by
  what the scan found; a blanket "fix everything" pass is still not a thing this skill does.
- Contradiction detection between a note and an entity page's stated fact (needs LLM judgment —
  a later track).
