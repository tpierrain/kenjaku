---
name: brief-shape
description: "The shape EVERY prep-shaped note is written in: the first screen is the whole brief, the ammunition is folded underneath. Load it before writing or rewriting a 1-1 prep, a meeting prep, a difficult-conversation prep or a day briefing — anything whose frontmatter `type:` starts with `prep-` or `briefing-`. Also load it when asked to shorten, tighten or 'make it usable live' a note of that kind. It holds the rule; the skills that produce preps obey it rather than restating it."
version: 1.0.0
---

# brief-shape — the first screen IS the brief

> **The problem this removes.** Facing a person, you need the page you will speak from. What kills a
> prep is not that it lacks material: it is that the material arrives first and has to be triaged in
> the room. The shape below puts what you will say on the first screen and folds the evidence
> underneath, where it waits until it is needed.

## The shape

**Scope — decided by a prefix, never by a folder.** This shape applies to every note whose frontmatter
`type:` starts with `prep-` or `briefing-` (`prep-1-1`, `prep-meeting`, `briefing-day`, and any prep
type invented later, covered the day it is first written). A note with no `type:` is out of scope.

**The first screen is everything between the note's `#` title and the first `##` heading.** That is
the whole anchor — no magic section name, so the rule reads the same in any language, and every `##`
section below is ammunition by construction.

### Above the fold — what you will say

- **At most 7 top-level bullets**, one spoken sentence each. Flat: no nesting, no sub-headings, no
  tables, no links to go and open.
- **No bullet exceeds 220 characters.** Without that ceiling, "seven bullets" becomes seven
  paragraphs. A sentence someone actually says aloud runs 120 to 180 characters.
- **Seven is an upper bound, never a quota.** If the vault supports two solid things, the brief has
  two bullets. **A thin brief says so** — one closing line naming what is **not documented** — and it
  never pads to reach a number. Padding is the single failure that would make this whole feature lie.
- **Nothing else above the fold**: no context, no rationale, no source list, no preamble. Someone
  handed this page with thirty seconds to spare must be able to walk in on it alone.

### Below the fold — the ammunition

- **One `##` section, labelled so its status is unmistakable**: *"only if they dig, contest or ask"*.
  It is never unrolled spontaneously, in the room or in a reply.
- **Every ammunition item carries three things: its verbatim quote, its date, and its source path.**
  This is the load-bearing half of the whole shape. The point is answering a contradiction with the
  exact words and the date, on the spot, without opening anything else. An item without its quote is
  not ammunition, it is a memory of one.
- **Length is unbounded down here, deliberately.** The cap protects the first screen; it was never
  meant to shorten the evidence.

### The closing block — what the vault does not carry

End with a short block stating **what the vault supports and what it does not support**, so a negative
claim is never spoken out loud without its speaker knowing it is unsupported. This is
[`sync-sources` § Claim discipline](../sync-sources/SKILL.md) applied at the moment it costs the most:
here, the sentence is said to the person it is about, in front of them.

## The shape is checked, not merely written down

**A prep-shaped note whose first screen breaks the rules above is REFUSED at the moment it is
written** — the engine's write guard says which rule failed and by how much, and the note does not
exist until it is fixed. A rule that has to be remembered has already failed; this one does not
depend on being remembered.

What it counts, and nothing else: the bullets above the first `##`, their number and their length,
and that there is a first screen at all. It never judges what a bullet *says*, and it never looks
below the fold.

## Why the rule lives here and nowhere else

A shape restated in each skill that produces a prep is several shapes: they drift, and the one you get
depends on which door you came through. So this file holds it, and a producer skill — `prepare-1-1`
and its siblings — names it and obeys it, exactly as those skills already defer to `sync-sources` for
claim discipline rather than writing their own.

If you are producing a prep and you got here from a skill that did not mention this file, that skill
predates the shape. Follow the shape anyway: it is the rule, and the older skill is the copy.
