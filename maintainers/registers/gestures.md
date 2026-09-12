<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- A REGISTER, not a plan: it outlives the release that opened it. Every    -->
<!-- new skill adds a gesture, and "which tier is this?" is asked again each  -->
<!-- time. Opened for v5.4; kept afterwards.                                  -->
<!--                                                                         -->
<!-- plan-carrier-guard: delegates-only — this file holds no plan state. The  -->
<!-- release's state lives in                                                 -->
<!-- plans/prospective/v5.4-stop-talking-like-a-dashboard-action.md.          -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Register — every gesture the brain makes, and its tier

**The doctrine is [ADR 0043](../decisions/0043-graduated-autonomy-and-plain-language.md)** and this
file restates none of it. Three tiers, one gate: **🟢 act silently · 🟡 announce then act unless
vetoed · 🔴 genuinely ask**, chosen by **reversibility first, then confidence**.

## What a gesture is, and what it is not

**A gesture is something the brain does TO A HUMAN**: it asks them, it announces to them, or it acts
on their stuff. It is the unit that makes this work countable — a *string* is not, because there are
3 675 lines of delivered skills and nobody can say when they have been "audited".

🛑 **An instruction to the model is NOT a gesture.** Most of a `SKILL.md` is direction, read by a
machine that needs the precise word. `frontmatter`, `fan-out`, `idempotent` are correct there and
changing them makes the brain vaguer, not plainer. **This register covers only what the brain is told
to SAY and what the engine PRINTS.**

## How to read a row

| Column | Meaning |
| --- | --- |
| **Gesture** | what the owner experiences, in their terms |
| **Where** | the file that emits it |
| **Today** | asks 🔴 / announces 🟡 / acts silently 🟢 — what it does *now* |
| **Tier** | what ADR 0043's gate says it should be |
| **Verdict** | `keep` · `change` · `word` (right tier, wrong words) · `ask him` |

- **`ask him`** is not indecision: it marks a gesture that would **stop asking**, which is a product
  call and not a design one. They are collected in § *The 🟢 list* and put to the owner **as one list,
  once**.
- A gesture is only marked **🟢 settled** when ADR 0043's own accepted table names it. Everything else
  that *looks* 🟢 is an `ask him`.

---

## 1. Session start — what the owner meets before typing a word

**The highest-frequency surface in the product.** Nothing here is requested: every row is the brain
speaking first, which is why volume alone is a defect (measured in the field, 2026-07-28: eight lines
of internal prose before the first prompt).

> 📡 **The channel fact, re-established on today's host — and it INVERTS the July diagnosis.**
> See § *The channel matrix, re-measured* at the bottom of this file. In short: **`systemMessage` is
> the owner's channel** (the CLI prints it, prefixed `SessionStart:<matcher> says:`), and
> **`additionalContext` is the agent's** (never printed; it reaches the model). Every leak below is a
> directive written into `systemMessage`, not an echo of `additionalContext`.

| Gesture | Where | Today | Tier | Verdict |
| --- | --- | --- | --- | --- |
| The brain says it is ready: repo, search index, key, version | `status-hook-output.mjs` | 🟡 | 🟡 | keep |
| A restart is pending, so nothing you read comes from the engine you now have | `restart-nudge.mjs` | 🟡 | 🟡 | keep |
| Notes the engine cannot read, and the tidy-up counts | `wiki-health-nudge.mjs` | 🟡 | 🟡 | **word** |
| Which universe is active, of how many | `universe-reminder.mjs` | 🟡 | 🟡 | keep |
| The universe this machine worked in is gone, so the scope fell back | `universe-reminder.mjs` | 🟡 | 🟡 | keep |
| What this sphere is (the owner's own profile, recited back at them) | `universe-reminder.mjs` | 🟡 | 🟢 | **change** — it is *ambient background*, and the directive beside it says "do not recite it" while the CLI recites it verbatim |
| An offer to describe your context, once | `universe-reminder.mjs` | 🟡 | 🟡 | **change** — the owner reads the *instruction to offer*, vocabulary rule included, instead of the offer |
| The engine is leaving N of your files alone | `engine-divergence-nudge.mjs` | 🟡 | 🟡 | keep |
| An activity ledger was created in your vault | `actions-log-seed.mjs` | 🟡 | 🟡 | **word** |
| More than one person writes here | `brain-author.mjs` | 🟡 | 🟡 | **change** — the owner reads a directive with a shell command in it |
| Is that someone else, or you on another machine? | `brain-author.mjs` | 🔴 | 🔴 | **change** — same leak; the question is right, its delivery is not |
| Two names were declared the same person elsewhere — is that right? | `brain-author.mjs` | 🔴 | 🔴 | **change** — same leak |
| Obsidian is installed but does not hold this vault | `session-obsidian-hint.mjs` | 🟡 | 🟡 | keep |
| A capability is broken (search, index, embedder, MCP) | `session-health.mjs` | 🟡 | 🟡 | keep |
| The brain repaired its own wiring | `session-self-heal.mjs` | 🟡 | 🟡 | keep |

**Count: 15 gestures · 4 change · 2 word · 9 keep.**

## 2. First launch — the wiring ritual

| Gesture | Where | Today | Tier | Verdict |
| --- | --- | --- | --- | --- |
| Shall we check your brain is really wired to your notes? | `CLAUDE.engine.md` | 🔴 | 🔴 | keep — it is an *offer* and it retires itself |
| Shall I remove the ~5 fictional example notes? | `CLAUDE.engine.md` | 🔴 | 🔴 | keep — a deletion is never 🟢, whatever the net |

**Count: 2 gestures · 0 change.**

## 3. `/lint` — the skill that produced the complaint

**All five categories were built on the old binary posture** (*propose first, write on yes*), so the
tier is the same for all five today and the doctrine says it should not be.

| Gesture | Where | Today | Tier | Verdict |
| --- | --- | --- | --- | --- |
| Repair a link whose target is an unambiguous spelling of a note that exists | `lint/SKILL.md` | 🔴 | **🟢 settled** (ADR table) | **change** |
| Repair a link whose target is ambiguous, or points at nothing recognisable | `lint/SKILL.md` | 🔴 | 🟡 | **change** — propose the candidates in the batch |
| Create the missing note a `[[people/…]]` link points at | `lint/SKILL.md` | 🔴 | 🔴 | keep — a card created to satisfy a link becomes the vault's answer to *who exists* |
| Stamp a missing `created` / `updated` read from the note's own content | `lint/SKILL.md` | 🔴 | **🟢 settled** (ADR table), announced in the batch | **change** |
| Fill a missing `type` / `tags` | `lint/SKILL.md` | 🔴 | 🟡 | **change** — it shapes how the note is treated, so it is proposed, not silent |
| Propose where to weave in a note nothing links to | `lint/SKILL.md` | 🔴 | 🟡 | **change** |
| Refresh an entity page the world has moved past | `lint/SKILL.md` | 🔴 | 🔴 | keep — the refresh is distilled content, and content is a fact |
| Put the frontmatter keys back at the left margin on a note the engine cannot read | `lint/SKILL.md` | 🔴 | 🟢? | **ask him** |
| The report's own headings (`Dangling links`, `Orphans`, `Frontmatter issues`) | `wiki-lint.mjs` | — | — | **word** — written for whoever built the scanner |

**Count: 9 gestures · 5 change · 1 word · 2 keep · 1 ask him.**

## 4. `/consolidate` — mostly 🔴, and correctly so

**A 🔴 is not a failure of the doctrine.** Creating a page shapes how the vault names things, and a
contradiction is never adjudicated by the brain. The win here is **batching and wording**, not silence.

| Gesture | Where | Today | Tier | Verdict |
| --- | --- | --- | --- | --- |
| Create a page for a person mentioned but never filed | `consolidate/SKILL.md` | 🔴 | 🔴 | keep |
| Create a topic page | `consolidate/SKILL.md` | 🔴 | 🔴 | keep |
| Fold fresher captures into a page that already exists | `consolidate/SKILL.md` | 🔴 | 🔴 | keep |
| A capture that contradicts what a page states | `consolidate/SKILL.md` | 🔴 | 🔴 | keep |
| **One prompt per candidate, in a row** | `consolidate/SKILL.md` | 🔴 ×N | 🔴 ×1 | **change** — this is the measured complaint, and it is a presentation defect before it is a tier defect |
| Say what was left for later | `consolidate/SKILL.md` | 🟡 | 🟡 | keep |

**Count: 6 gestures · 1 change · 5 keep.**

## 5. `/file-back`

| Gesture | Where | Today | Tier | Verdict |
| --- | --- | --- | --- | --- |
| Offer to keep a hard-won answer as a note | `file-back/SKILL.md` | 🔴 | 🔴 | keep |
| Ask before writing the note it drafted | `file-back/SKILL.md` | 🔴 | 🔴 | keep |

**Count: 2 gestures · 0 change.**

## 6. `/switch` — universes

| Gesture | Where | Today | Tier | Verdict |
| --- | --- | --- | --- | --- |
| Offer, once, to describe the sphere you work in | `switch/SKILL.md` | 🔴 | 🔴 | keep |
| Offer a fresh conversation when the one on screen holds a lot from the sphere just left | `switch/SKILL.md` | 🟡 | 🟡 | keep |
| Create a universe the name does not match | `switch/SKILL.md` | 🔴 | 🔴 | keep |
| Delete a universe | `switch/SKILL.md` | 🔴 + retype the name | 🔴 | keep — reachable only on an explicit ask |
| Confirm a full re-index (minutes of compute, no data at risk) | `switch/SKILL.md` | 🔴 | 🟡? | **ask him** |
| Repair a spelling the owner declared, without stopping to ask | `switch/SKILL.md` | 🟢 | 🟢 | keep — already the doctrine, shipped before it had a name |

**Count: 6 gestures · 0 change · 1 ask him.**

## 7. `/update-engine`

| Gesture | Where | Today | Tier | Verdict |
| --- | --- | --- | --- | --- |
| Shall I run the update? | `update-engine/SKILL.md` | 🔴 clickable | 🔴 | keep |
| Per file you customised: take the new one / keep mine / combine | `update-engine/SKILL.md` | 🔴 clickable, grouped | 🔴 | keep |
| An update is waiting — install now / remind me / no thanks | `update-engine/SKILL.md` | 🔴 clickable | 🔴 | keep |
| Quote the release's `What you get`, verbatim | `update-engine/SKILL.md` | 🟡 | 🟡 | keep |

**Count: 4 gestures · 0 change.** *(All four shipped in v5.2.0 and v5.3.0, written under this doctrine.)*

## 8. `/import`, `/local-mirror`, `/sync`, `/rag`, `/improve`, `/open-note`

| Gesture | Where | Today | Tier | Verdict |
| --- | --- | --- | --- | --- |
| Where is the brain you want to bring over? | `import/SKILL.md` | 🔴 | 🔴 | keep |
| Here is what would be copied — shall I? | `import/SKILL.md` | 🔴 | 🔴 | keep |
| Should this land in its own sphere? | `import/SKILL.md` | 🔴 | 🔴 | keep |
| A local copy, or a live read? (only when genuinely ambiguous) | `local-mirror/SKILL.md` | 🔴 one line | 🔴 | keep |
| Gather a source's declaration, and confirm the key's name | `local-mirror/SKILL.md` | 🔴 | 🔴 | keep |
| "I answer from the local copy now, and check the source in the background" | `local-mirror/SKILL.md` | 🟡 | 🟡 | keep — the 🟡 tier, shipped before it had a name |
| Move a mirror into another sphere | `local-mirror/SKILL.md` | 🔴 | 🔴 | keep |
| A pull conflicted — which version wins? | `sync/SKILL.md` | 🔴 | 🔴 | keep |
| Say a context arrived with the pull | `sync/SKILL.md` | 🟡 | 🟡 | keep |
| Offer to re-index when the live watcher is not running | `rag/SKILL.md` | 🔴 | 🟡? | **ask him** |
| Propose the improvements worth making to the harness | `improve/SKILL.md` | 🔴 | 🔴 | keep |
| Open the real file rather than pasting its text | `open-note/SKILL.md` | 🟢 | 🟢 | keep |
| Fetch a live source while opening a note | `open-note/SKILL.md` | 🔴 | 🔴 | keep |

**Count: 13 gestures · 0 change · 1 ask him.**

## 9. The rituals in the constitution

| Gesture | Where | Today | Tier | Verdict |
| --- | --- | --- | --- | --- |
| Check external sources in the background, and say so in one line | `CLAUDE.engine.md` | 🟡 | 🟡 | keep — **the reference implementation of the 🟡 tier** |
| Scan the session for frictions before closing, and say so first | `CLAUDE.engine.md` | 🟡 | 🟡 | keep |
| "Monday last, or Monday next?" | `CLAUDE.engine.md` | 🔴 | 🔴 | keep — a date guessed wrong is written down |
| Create a file outside the defined structure | `CLAUDE.engine.md` | 🔴 | 🔴 | keep |
| Commit everything the session wrote | `CLAUDE.engine.md` + hook | 🟢 | 🟢 | keep — **this is what buys every 🟢 and 🟡 above** |

**Count: 5 gestures · 0 change.**

---

## The totals — this is what gives v5.4 a bottom

| | Gestures | change | word | ask him | keep |
| --- | --- | --- | --- | --- | --- |
| Session start | 15 | 4 | 2 | 0 | 9 |
| First launch | 2 | 0 | 0 | 0 | 2 |
| `/lint` | 9 | 5 | 1 | 1 | 2 |
| `/consolidate` | 6 | 1 | 0 | 0 | 5 |
| `/file-back` | 2 | 0 | 0 | 0 | 2 |
| `/switch` | 6 | 0 | 0 | 1 | 5 |
| `/update-engine` | 4 | 0 | 0 | 0 | 4 |
| The other six skills | 13 | 0 | 0 | 1 | 12 |
| The constitution's rituals | 5 | 0 | 0 | 0 | 5 |
| **Total** | **62** | **10** | **3** | **3** | **46** |

> 🎯 **62 gestures, 13 change, 3 wait on the owner, 46 are already right.** That is the number the
> parent plan said did not exist. **Three quarters of the product is already at the tier the doctrine
> would give it** — which is the honest reading of *"the magic was traded for a dashboard"*: the
> defect is concentrated, not diffuse. Ten of the thirteen live in two places, the **startup screen**
> and **`/lint`**, and those are exactly the two surfaces the field complaint named.

## The 🟢 list — the one question for the owner, asked once

**Some gestures stop asking, and that is the entire point of the 🟢 tier.** It is also exactly the
change an owner could experience as *"it did something without me"*. ADR 0043 answers it in principle
— auto-commit makes every 🟢 one `git revert` away — but **which gestures specifically go silent is a
product call.**

**Settled by ADR 0043's own accepted table, so they are not on this list**: repairing a link whose
target is an unambiguous spelling of an existing note, and stamping a missing date read from the
note's own content.

**These three are new, and they are his:**

1. **Put the frontmatter keys back at the left margin on a note the engine cannot read.** Today it
   asks. The repair is mechanical (the keys are indented by a space or two), it touches nothing else
   in the note, and it is the one finding that costs the owner *answers* rather than tidiness — the
   note keeps answering searches from what it said weeks ago until someone fixes it.
   **Recommendation: 🟢, announced in the batch.** The risk if it is wrong: an edit to the owner's own
   note, one `git revert` away.
2. **Re-index after a universe is created or deleted.** Today it asks for a confirmation. It costs
   minutes of compute and risks no data at all. **Recommendation: 🟡** — announce it and let them stop
   it, rather than make them authorise a wait.
3. **Re-index when the live watcher is not running.** Same shape as 2. **Recommendation: 🟡.**

**If he says no to all three, the release loses nothing**: the thirteen changes above stand on their
own, and these three simply stay where they are.

---

## The channel matrix, re-measured *(2026-09-12, Claude Code v2.1.220, macOS)*

**This table replaces the one in [`studies/fleet-upgrade-field-feedback.md`](../studies/fleet-upgrade-field-feedback.md)
§ F5, whose third row is wrong.** It is measured, not inferred, and each cell says how.

| Channel | The CLI shows it | The agent receives it |
| --- | --- | --- |
| SessionStart `systemMessage` | ✅ **yes**, prefixed `SessionStart:<matcher> says:` on its FIRST line only | ❌ **no** |
| SessionStart `additionalContext` | ❌ **no** | ✅ **yes** |
| The agent's own chat text | ✅ | — |

**How each cell was established:**

- **The display half, from the host's own renderer.** The shipped CLI turns a hook's `systemMessage`
  into an attachment typed `hook_system_message`, and renders exactly one shape for it:
  `<hookName> says: <content>`. Its `additionalContext` goes into the session's context array and is
  never wrapped into anything displayable. No other code path produces `says:`.
- **The agent half, from a probe.** A throwaway folder with a SessionStart hook emitting a distinct
  word on each channel, then one headless question asking which words arrived. **Only the
  `additionalContext` word came back.**

### Why the July diagnosis inverted the two, and what that cost

The field capture was read as *"`additionalContext` is echoed verbatim"*, and a root-cause note said
`session-universe.mjs` *"emits no `systemMessage` at all"*. Both halves are wrong, and the error is
worth keeping because it is the same class of bug F5 itself is about:

- **`session-universe.mjs` does not build its own payload** — `buildUniverseHookOutput` does, and at
  that very commit it emitted `systemMessage: [nudge, digest, offer].join("\n")`. The file that was
  read was not the file that decides.
- **The one line without a prefix was read as a second channel.** `🧠 RAG up to date — 414/414 files
  indexed.` sat unprefixed under a prefixed line, and that looked like proof of two channels
  rendering differently. It is one multi-line `systemMessage`: the prefix lands on the first line and
  the rest follow bare.

**What it cost is nothing yet, and that is luck.** The fix v4.4.0 shipped — *shrink the payload, put
the fact in `systemMessage` and the directive in `additionalContext`* — is the right fix under either
diagnosis, so it worked. But four emitters kept routing directives into `systemMessage` afterwards,
because the diagnosis said that channel was the safe one. **A right fix built on a wrong reason does
not generalise**, and here the proof is that it did not.
