<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- Opened 2026-09-12, mid-conversation, out of two calls the owner made in   -->
<!-- the same breath: an ADR he could not get through, and a real client's     -->
<!-- name he found in a published example.                                    -->
<!--                                                                          -->
<!-- The `## 📍 STATE` block is this file's only perishable content:           -->
<!-- ≤ 20 non-empty lines (CONVENTIONS §3ter).                                -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Action plan — names nobody real, and ADRs people actually read

## 📍 STATE — the only perishable block in this file · opened 2026-09-12

- **Next:** ▶️ **rewrite ADR 0044 to the one-screen shape** that CONVENTIONS §6sexies now prescribes
  → § *Step 2*. The French short version the owner approved in chat is the model; write it **in
  English**, keep the Crux, open on two or three lived situations, one line per rejected alternative.
  **Then put ratification to him** — the ADR is still PROPOSED and he has read the short form.
- **Done and pushed** _(`71bf859`)_: the **name sweep is complete** — 308 occurrences across nine
  files, including the delivered `switch` skill, now `globex` / `aXiom` / `Axion` / `Axiom`.
  Fingerprints regenerated, 3759 tests green. **Nothing public still carries the real names**: the
  v5.3.0 release note and every issue comment were checked, both clean.
- **▶️ AWAITING ONE WORD: the `v5.3.0` TAG IS MOVED onto the rename — no `v5.3.1`, no release note**
  _(owner's call, 2026-09-12)_ → § *Step 4*, which holds the reasoning, what it buys and what it does
  not. Everything local is ready and pushed; the only step left is the forced tag push.
- **Who is exposed, measured, and narrower than first written:** `v5.3.0` is the **only** published
  version that ever carried the names (audited across all 34 tags), so brains installed **before** it
  are clean; only an install or engine update made in the hours since it shipped can carry them, in
  the `switch` skill and six `scripts/` files. `maintainers/` never reaches a brain.
- ℹ️ **Not recoverable, and he should know rather than be protected from it:** the names stay readable
  in the **commit history** of a public repo, which moving the tag does not touch and no patch release
  would have touched either → § *Step 4*. Rewriting published history is a separate, heavier decision
  and nobody has asked for it.
- **A session may, alone:** write the ADR, run the suite, commit, push, read CI. **Not:** cut a
  release, rewrite published history.

## Tracking

- [x] **Step 1 — the sweep, and the two conventions that stop it recurring**
      _(2026-09-12 · `71bf859`)_ → § *Step 1*
- [ ] **Step 2 — ADR 0044, rewritten to one screen** → § *Step 2*
- [ ] **Step 3 — put ratification of ADR 0044 to the owner** (one question, after step 2)
- [ ] **Step 4 — move the `v5.3.0` tag onto the rename, silently** → § *Step 4*
  - [x] the release note drafted for a `v5.3.1` is **deleted, not published** _(2026-09-12)_
  - [x] engine fingerprints regenerated under the name `v5.3.0` _(2026-09-12)_
  - [ ] the forced tag push, on the owner's word

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

## Step 4 — the tag moves, and nothing is announced

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

**Where it stands, and what is left.** The tag is **already moved locally**, re-created **annotated**
with the same title the series uses (`git tag -f -a`, because the original was an annotated tag and a
bare `git tag -f` had quietly demoted it to a lightweight one). Only the publish is left, and the
harness **refused it** — a forced push over a published tag is exactly the kind of thing that should
need a human word:

```bash
git push --force origin v5.3.0      # v5.3.0 → 8e8db36
```

**And the way back, should he want it**, because a forced push is only reversible if the old target is
written down somewhere a cleared context can find it:

```bash
git tag -f -a v5.3.0 100fc68 -m "v5.3.0 — The One Where It Says Which Universe It Answered From"
git push --force origin v5.3.0
```
