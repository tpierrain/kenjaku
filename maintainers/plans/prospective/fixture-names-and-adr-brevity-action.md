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
- **⚠️ HIS CALL, and it is the only open question:** the names are fixed on `main`, but a brain
  installed before today still carries the old ones in its `switch` skill until an engine update
  reaches it. **That needs a `v5.3.1`, and cutting it is not granted** — the v5.3.0 grant was by name
  and is spent. Ask; do not assume.
- ℹ️ **Not recoverable, and he should know rather than be protected from it:** the names stay in the
  git history and inside the published `v5.3.0` tag. Rewriting published history is a separate,
  heavier decision and nobody has asked for it.
- **A session may, alone:** write the ADR, run the suite, commit, push, read CI. **Not:** cut a
  release, rewrite published history.

## Tracking

- [x] **Step 1 — the sweep, and the two conventions that stop it recurring**
      _(2026-09-12 · `71bf859`)_ → § *Step 1*
- [ ] **Step 2 — ADR 0044, rewritten to one screen** → § *Step 2*
- [ ] **Step 3 — put ratification of ADR 0044 to the owner** (one question, after step 2)
- [ ] **Step 4 — ask whether a `v5.3.1` carries the renamed skill to installed brains**

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
