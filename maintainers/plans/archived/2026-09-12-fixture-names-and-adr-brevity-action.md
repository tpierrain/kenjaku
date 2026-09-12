<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- Opened 2026-09-12, mid-conversation, out of two calls the owner made in   -->
<!-- the same breath: an ADR he could not get through, and a real client's     -->
<!-- name he found in a published example.                                    -->
<!--                                                                          -->
<!-- ARCHIVED 2026-09-12 — finished, so it holds no state and its `## 📍 STATE` -->
<!-- block is gone (CONVENTIONS §7). Read it for the step detail, never for   -->
<!-- where work stands: that lives in plans/ACTIVE.md and the plan it names.  -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Action plan — names nobody real, and ADRs people actually read

> **CLOSED 2026-09-12.** The name sweep shipped inside `v5.3.0` (the tag was moved onto it rather than
> announced, § *Step 4*), and **ADR 0044 is ACCEPTED**, cut from 207 lines to one screen and re-opened
> on `/switch` and a named universe before the owner would ratify it (§ *Step 2*, § *Step 3*).

## Tracking

- [x] **Step 1 — the sweep, and the two conventions that stop it recurring**
      _(2026-09-12 · `71bf859`)_ → § *Step 1*
- [x] **Step 2 — ADR 0044, rewritten to one screen** _(2026-09-12 · `3394c03`)_ → § *Step 2*
- [x] **Step 3 — ratification: ACCEPTED by the owner** _(2026-09-12)_ → § *Step 3*
- [x] **Step 4 — move the `v5.3.0` tag onto the rename, silently**
      _(2026-09-12 · tag `8a9d1eb` → `8e8db36`)_ → § *Step 4*
  - [x] the release note drafted for a `v5.3.1` is **deleted, not published** _(2026-09-12)_
  - [x] engine fingerprints regenerated under the name `v5.3.0` _(2026-09-12)_
  - [x] the forced tag push, **run by the owner himself** (the harness refuses it, and rightly)
  - [x] verified after the push: the tag's tree searched clean, the published note untouched

## Step 1 — the sweep, and why the names were there at all

**What was found.** A real client of the owner's company, plus that client's real product brand, in
**308 places across nine files**. Not a slip in one comment: one honest worked example, written once
in `declared-spellings.mjs`'s header, then **copied by every test that needed a fixture** and by the
delivered skill's documentation.

**Why it mattered more than an example usually does.** `.claude/skills/switch/SKILL.md` is delivered
into every brain the installer creates, and the example was *"this client's name keeps being spelled
wrong"* — so a public repository carried both a business relationship and an opinion about it.

**The replacement keeps every property the fixtures were testing**, which is why the diff is
mechanical and the suite needed no rework:

| Role in the fixture | Was | Now |
| --- | --- | --- |
| the sphere | a real company | `globex` |
| the resolved brand | a real product | `aXiom` |
| wrong spelling, letters differ | | `Axion` |
| wrong spelling, casing only | | `Axiom` |
| the compound matched whole | | `Axion/Globex` |
| the longer word it must NOT touch | | `axions` |

**The conventions this produced** — CONVENTIONS §6septies (fixtures name nobody real; the defect
spreads by copying, so the guard is at the first use) and §6sexies (an ADR is one screen or it is not
read). Both carry the owner's own words and the measurement.

## Step 2 — ADR 0044, rewritten to one screen

**The model is the short French version he read and approved in chat**, translated back into English
(artifacts stay English). What it must keep, and what it must drop:

- **Keep:** the Crux; the decision in one concrete sentence; the guarantee that the *code* writes the
  sentence rather than the model, with the measured ten-hour drift as its reason; the three guardrails
  (no unconditional warnings, no content in a disclosure, no automatic re-scoping); what ratifying does
  not change; one line per rejected alternative.
- **Drop into the archived v5.3 plan, or delete:** the 40-line concurrency probe write-up, the mermaid
  sequence, the `PostToolUse` design that was abandoned, and every restatement of the same point.
- ⚠️ **The sentence he specifically rejected as too abstract** — *"quand le cerveau réduit ce sur quoi
  il va répondre, il dit dans la foulée ce qu'il n'a pas réduit"*. It needs an example **in the same
  breath**, not a definition: *"you switch to another sphere, and it tells you the conversation
  already on screen still holds what it read before."*

## Step 3 — ratification

The ADR is **PROPOSED**. The code shipped in v5.3.0 and the release note says PROPOSED out loud, so
ratifying unblocks nothing and refusing breaks nothing running. He has now read the short form and
said the long one was unreadable; put the question once, after step 2, and record the answer here.

**Put to him on 2026-09-12**, the one-screen version being on disk (`3394c03`). His answer goes here,
and ACCEPTED means exactly two edits: the STATUS line of the ADR, and this checkbox.

- **His answer, 2026-09-12: ACCEPTED.** « ok je ratifie, passe-la en ACCEPTED », given after he read the
  one-screen version and had its opening rewritten once more — see below. STATUS flipped in the ADR.

**What ratification actually cost, and it is the lesson of this plan:** the short version was not
enough. Read tired, its first sentence was still *"whenever the brain narrows what it will answer
from… you switch to another sphere"*, and his answer was « c'est beaucoup trop abstrait. Sphere c'est
quoi ? c'est les univers ? ». Two defects in one line: **a word the product does not use** (it is
*universe*), and **a description of nothing anybody can picture**. The crux now opens on `/switch`, on
`globex` by name, and on what the same message must say did *not* move. **Brevity was necessary and
not sufficient** — CONVENTIONS §6sexies asks for lived situations for exactly this reason, and a
one-screen ADR can still be unreadable in its first three lines.

## Step 4 — the tag moves, and nothing is announced

**Who is exposed, audited rather than assumed, and narrower than the first draft of this plan said.**
`v5.3.0` is the **only** published version that ever carried the names: all 34 tags were searched, from
`V1` on, and every other one is clean. The names were born and buried inside a single day. So brains
installed **before** `v5.3.0` are clean, and only an install or an engine update made in the hours
since it shipped can carry them, through the **seven files that really reach a brain** (the delivered
`switch` documentation, plus six under `scripts/`). `maintainers/` is excluded from every install by
construction, so the plans, the mutation register and the release notes never travelled.

**The owner's call, 2026-09-12**, taken after a drafted `v5.3.1` note was shown to be the problem
rather than the fix: « il ne faudrait pas que dans la release note on mentionne ces noms-là parce que
ça va donner curiosité aux gens », then « vaut mieux patcher la version 5.3.0 en déplaçant un peu le
tag ». So: **`v5.3.0` is re-pointed at the rename, the published note is left exactly as it is, and no
`v5.3.1` exists.** The release is two hours old, it is a weekend, and the realistic install count in
that window is zero.

**What it buys.** Every install and every engine update from now on gets clean bytes, with no note, no
mention and nothing for anyone to be curious about. A `v5.3.1` would have had to *say something* on the
most-read artifact we publish, and the only honest thing it could say points straight at what was
removed.

**What it does NOT buy, and he was told plainly:** the names stay readable in the **commit history** of
a public repository — `71bbbcf`, `b981d60`, `f8c45ba` and their diffs. Moving the tag changes the
snapshot, never the history, and **a `v5.3.1` would not have changed it either**. Rewriting published
history is a separate, heavier decision and nobody has asked for it.

**The two costs, both accepted:**

- **A brain installed inside the window is left behind, silently.** It reports `v5.3.0`, the update
  check tells it it is up to date, and it keeps the old example until `v5.4` reaches it. A `v5.3.1`
  would have gone and offered the fix; a moved tag cannot. Accepted because the population is almost
  certainly empty.
- **GitHub's tarball for a tag name is cached**, so a fresh install in the minutes right after the
  push can still receive the old bytes. It settles on its own.

**Why the fingerprint table survives the move.** `generate-fingerprints.mjs` was run **before** the tag
moved, so it folded both byte-states of `.claude/skills/switch/SKILL.md` under `since: v5.3.0` — the
one a window brain holds and the one the moved tag delivers. Neither reads as a hand-edited engine
file. That property lasts until the next release regenerates the table with the tag already moved.

**Done, 2026-09-12.** `v5.3.0` is tag object `8a9d1eb` on commit `8e8db36`, re-created **annotated**
with the same title the series uses (`git tag -f -a`: the original was annotated and a bare `git tag -f`
had quietly demoted it to a lightweight tag). Verified after the push: the tag's tree searched clean,
and the published note untouched.

🔒 **The forced push itself was run by the owner, not by a session, and that is now known to be the
only way.** The harness's classifier **refuses `git push --force` over a published tag even with the
owner's explicit yes in the conversation** — a chat answer is not a permission rule. So a plan that
ends in a forced push must hand the command over rather than plan to run it:

```bash
git push --force origin v5.3.0      # what he ran; v5.3.0 → 8e8db36
```

**And the way back, should he want it**, because a forced push is only reversible if the old target is
written down somewhere a cleared context can find it:

```bash
git tag -f -a v5.3.0 100fc68 -m "v5.3.0 — The One Where It Says Which Universe It Answered From"
git push --force origin v5.3.0
```
