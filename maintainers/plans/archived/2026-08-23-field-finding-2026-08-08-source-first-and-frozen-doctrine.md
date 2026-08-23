<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- This file OWNS the 2026-08-08 field finding (a handed-over source read as -->
<!-- ambience), the doctrine that answers it, and the state of getting that    -->
<!-- doctrine to the fleet. The `## 📍 STATE` block below is its only          -->
<!-- perishable content: do not restate it here or in another file.           -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Action plan — the source the owner hands you comes first, and the doctrine that says so must actually arrive

## ✅ CLOSED — shipped in **v5.0.0**, and *received* _(archived 2026-08-23)_

**This plan wrote its own closing condition, and that condition was met.** It read: *"closes when
v5.0.0 reaches the fleet, because the whole finding is a rule written where the fleet never receives
it"*. v5.0.0 was tagged on 2026-08-23; the same evening the owner's `mind-palace` was updated from
v4.9.1 and its `CLAUDE.engine.md` went 334 → 548 lines, carrying the `Niveau 1` block. The rule is on
a real brain, not on a branch — which is the only form of *done* this particular finding accepts.

The wording (W5b) was arbitrated as written, and the release note carries its line.

🔁 **One thing is deliberately NOT closed here, and was handed on rather than dropped**: the *field
re-test* — the same brain, the same kind of prompt, now that it runs a v5 engine. It sits with the
other post-tag observations in
[`v5-unfreezes-the-existing-fleet-action.md`](../prospective/v5-unfreezes-the-existing-fleet-action.md),
the one plan still open on this release.

_(Everything below is the historical record of the finding and its design. Do not read it for status.)_

> ## 🎙️ Why the wording is HIS, and the guard is not
>
> The delegability map calls the doctrine cargo *"text that speaks in the owner's voice"*, so this
> follows the S9-1 split: the rule, its **placement** and its guard are checkable work; the sentences
> are his. **The guard asserts patterns, not prose** — he can rewrite every sentence and it stays
> green as long as the seven rules are still recognisable, and when one is not, the test names which.
>
> 🧭 **Two design calls, made here rather than left implicit:**
>
> - **The block sits ABOVE the vault's search routing, and a test pins that.** A rule about reading
>   order that is itself read last reproduces the order that failed. Same reflex as F18's markers-rule
>   guard: presence was not enough, position is the rule.
> - **The corollary POINTS at the existing Claim discipline** instead of restating it, which is what
>   S1's third checkbox asked for. Two paraphrases are two disciplines.
>
> ### 🪝 The lesson this file's header paid for, kept now that the header is gone
>
> _(Until 2026-08-22 this plan opened with **six stacked boxes**, each added as the release moved, each
> re-asserting the same single fact: the wording is still his. That accretion is the workaround the
> STATE block replaces — but the reason they were written is durable, so it is kept here in one place.)_
>
> **The recurring false step, met four times on this release:** an emptying queue gets reported as
> *"nothing is blocked on him any more"*. It was said after the five arbitrations came back, after W6
> was discharged, after the code review returned, and again after the fixing run — and it was **false
> every time**, because W5b was never in any of those lists. **A closed list is not an emptied
> inventory**, and an empty *engineering* queue is precisely the moment this file is most likely to be
> skipped and most load-bearing.
>
> **What caught it was the `plan-carrier-guard` hook**, by naming this file as a carrier the session
> kept not opening. It judges no content; it only made the omission impossible to not see. The
> omission was a **false claim about the owner's own backlog** — the most expensive kind, because he
> is the one person who cannot check it by reading the code.

> **The field fact (2026-08-08, `mind-palace` on v4.8.1, i.e. fully up to date).** The owner asked for
> an article completing one of his Medium posts, **with the URL in the message**. The brain never opened
> it. It produced a full analysis of what was "missing" from that post — including a table of what was
> already published — from a reconstruction of it. Asked afterwards to mention his tool *Clepsydre*, it
> ran a **semantic** search (wrong instrument for a proper noun), found nothing, and asserted two
> falsehoods in a row: *"not in the vault"* and *"your articles never name it"*. **Clepsydre was in the
> addendum of the very article whose link had been handed over in the first message.**
>
> **Three defects, one root.** A designated source was treated as ambience instead of as the statement
> of the task. The other two (wrong search instrument, silence reported as absence) had no opportunity
> to do harm until that first one happened.
>
> **Why it is worth engine work, in the owner's own frame**: the failure is *silent and credible* (a
> structured, comparative, serious-looking answer built on nothing), and it is a fresh instance of his
> own thesis — the slide from *"I did not find"* to *"it does not exist"* is what turns weak retrieval
> into confident invention.

## What was measured on 2026-08-08 (do NOT re-derive it)

Read off this repo and off the deployed brain. It is evidence, not analysis to redo.

- **The rule itself is genuinely new.** The routing table (`CLAUDE.engine.md` § *Routing — which tool
  for what*) has rows for semantic, exact and structural retrieval, and **no row for a source the owner
  hands over**. The nearest neighbour, `1b5eb56` (*"the rule stops ranking sources and starts ordering
  the reading"*), is about verbatim versus AI summary, not about an URL in the prompt.
- **Its corollary already shipped, and is not new at all.** The **Claim discipline** (F18) carries
  *"I did not find X", never "there is no X"* and lives, asserted by `scripts/lib/claim-discipline.test.mjs`,
  in **four** places: the EN and FR constitutions **and** the `sync-sources` / `prepare-1-1` skills.
  That test's own header already records why both carriers are needed.
- **🔴 The deployed brain never received the constitution half, and it is up to date.**
  `~/mind-palace` pins `source.ref` **v4.8.1** (the latest tag). Its `.claude/skills/sync-sources/` and
  `prepare-1-1/` **do** carry the claim discipline, so the `merge` regime works. But its
  `CLAUDE.engine.md` is dated **19 July 21:02 — install day**, and contains **zero** occurrences of the
  claim discipline in either language. **12 commits** have touched that file since install (identity
  discipline, backlogs, source ordering, universes wording…) and **none of them ever arrived.**
  - **The brain is FRENCH, so the reference is `templates/fr/CLAUDE.engine.md`** — a first pass of this
    plan compared it against the EN root file and understated the gap. Measured against the right
    source: **26 223 bytes on the brain against 37 614 shipped today = 11 391 bytes, +43 %, never
    delivered.** The locale trap is the same one `claim-discipline.test.mjs` records at its `SKILLS`
    list; it is worth meeting only once.
- **Why: `CLAUDE.engine.md` is in NO regime** (`replace` / `regenerate` / `merge` — only `CLAUDE.md` is,
  under `merge`). A rule written there today reaches **fresh installs only**. `engine-apply-plan.test.mjs`
  even goes red if someone wires it into `replace`, on purpose (ROADMAP Gate 1).
- **The reason that lock was taken has since been lifted, and nobody came back.** Gate 1 deferred it
  because propagation "must first be made locale-aware (a FR brain would be re-anglicized on upgrade)".
  That is **solved and in production since v4.1.0**: `resolveLocaleSource()`
  (`scripts/lib/engine-copy-select.mjs:33`) picks `templates/<locale>/<rel>` over the root file, and
  `engine-skill-refresh.mjs:90` already calls it with `readBrainLocale(brainDir)`. The blocker is gone;
  the thing it blocked was never revisited. _(Same shape as the memory `repeated-ask-means-unwired-net`.)_
- **The hook surface is available and already used**: `UserPromptSubmit` is wired in
  `.claude/settings.json.template` (currently `prompt-restart-nudge.mjs`), and both `scripts/**` and the
  settings template are in `replace` — so a hook **does** reach a deployed brain at the next
  `/update-engine`.

## The finding behind the finding

The owner's failing session was run by a brain whose **ambient doctrine is frozen at install day**,
while every other engine surface (skills, scripts, servers) had been updated eight times. Writing a new
rule into that layer, and stopping there, would reproduce the exact defect this repo just spent a
release on: **shipping something the fleet never receives**, silently.

## Tracking

- [x] **S1 — The rule, written where doctrine belongs (EN + FR), with a guard on the model of the claim discipline.** _(2026-08-22 · `5729282`)_
  - [x] A **level-1 row** in the routing table of both `CLAUDE.engine.md` and
        `templates/fr/CLAUDE.engine.md`: *source designated by the owner (URL, path, screenshot,
        attachment)* → `WebFetch` / `Read`, **before any search**. **And a test on the row's
        POSITION**: a table whose first row is the semantic search teaches, to whoever scans instead of
        reading, the exact order the prose just forbade.
  - [x] The **priority order** stated once, in prose: (1) what the owner hands over, (2) exact search
        (`Grep` / `Glob`), (3) semantic search (`search_vault`), (4) the web. Plus the *prerequisite*
        clause: when the task is defined **relative to** that source ("complete this article", "fix this
        file", "like in that repo"), the source **is** the specification. **Level 2 carries the second
        field defect explicitly** — a **proper noun** is spellable, so it goes to exact search; a
        semantic search on one returns nothing, quietly.
  - [x] Point the corollary at the **existing** Claim discipline rather than paraphrasing it — two
        paraphrases are two disciplines (`claim-discipline.test.mjs` already enforces that reflex for
        `prepare-1-1`). Add only what is new: *have I exhausted level 1 before concluding anything
        negative?*
  - [x] **Guard test** modelled on `claim-discipline.test.mjs` (same `docSection` slicing, same EN/FR
        parity, one entry per rule naming the field defect it prevents), extended to whichever carrier
        S2 chooses. → `scripts/lib/source-first-discipline.test.mjs`, **20 assertions, all seen red on
        their assertions first**. Carrier: the two constitutions, which is what S2 settled.
  - [x] **The fingerprint table was regenerated in the same commit** (81 → 82 byte-states), and that is
        not housekeeping: `CLAUDE.engine.md` is a `merge` file now, so bytes no row recognises leave a
        brain holding this release **frozen on the very file this plan exists to unfreeze**. The S7-2
        freshness guard caught it — it went red on both locales before the regeneration.
  - [ ] 🎙️ **The wording is the owner's** (delegability map: *doctrine cargo speaks in his voice*). The
        guard asserts **patterns**, so a rewrite stays green as long as the seven rules survive.
  - [ ] **No mutation pass, and the skip is deliberate**: the slice is two Markdown files, a new test
        and a regenerated data table. There is no production code in it to mutate.
- [x] **S2 — ✅ RESOLVED 2026-08-08 by the owner's sequencing, without having to choose.** The unfreeze
      becomes **the very next release** (`update-regime-owns-what-it-shipped-action.md`), so the rule
      goes where doctrine belongs — S1 above, one paragraph in both constitutions plus its guard test —
      and **that release delivers it to the fleet**. **The hook is NOT built** (option A below): it
      would be mechanism bought to bridge a gap that is about to close, which is the very reflex this
      repo has just diagnosed. The options are kept below as the record of what was weighed, not as
      work.
- [ ] ~~**S2 — the carrier.**~~ _(kept for the reasoning; superseded by the box above)_
  - [ ] **Option A — a `UserPromptSubmit` hook.** Regex-detect URLs and file paths in the prompt and
        re-inject them as `additionalContext`: *"sources the owner designated, to open before
        answering: …"*, annotated for local paths with *exists / not found* (which also kills the
        "I searched and therefore it does not exist" half). Deterministic, non-blocking, precedent
        already wired. **Reaches the fleet at the next `/update-engine`.** Honest limit, to be written
        into the file itself: it fires **before** execution, so it makes the source **salient**, it
        never proves it was read. A reinforced reminder, not a constraint.
        - [ ] If taken: it must **never** read file contents into the context (a prompt naming `.env`
              would inject secrets). Names and existence only.
  - [x] ➡️ **OPTION B WAS TAKEN, and it is no longer this file's to track** _(2026-08-21)_. It is **S5**
        of [`update-regime-owns-what-it-shipped-action.md`](update-regime-owns-what-it-shipped-action.md),
        which owns the decision and its design. Two things that plan settled, recorded here **as a
        pointer only** because the sketch below now under-describes the answer: the regime is **`merge`**,
        and — read straight from the code rather than from this file's hopeful "since v4.1.0" — the merge
        carrier is **already locale-aware**. ⚠️ **And one correction the sketch below gets wrong**: B does
        **not** "land 12 commits of doctrine on every deployed brain at once". A brain with no provenance
        for the file gets no ancestor, so it is **reported, not delivered**, until the ancestor machine
        exists. See S5's design box.
  - [ ] **Option B — unfreeze the constitution layer for the fleet.** Deliver `CLAUDE.engine.md`
        locale-aware, reusing the **provenance-gated refresh already proven on skills** (overwrite only
        what is byte-identical to what the engine last delivered; a hand-edited layer is preserved and
        reported). This is the **cure**: it would land 12 commits of doctrine on every deployed brain at
        once, including the claim discipline that would have prevented half of this very case.
        - [ ] **It is Gate 4 work being pulled forward** (`engine-managed-file-merge-strategy.md`,
              F-B7e), and it inherits the open **silent skill freeze** defect
              (`field-finding-2026-08-05-silent-skill-freeze.md`): a wrong provenance base freezes a
              file as "yours" forever, silently. Deciding B without deciding that plan is deciding to
              ship the same trap on a bigger file.
        - [ ] The `engine-apply-plan.test.mjs` guard must be **flipped deliberately**, with its comment
              rewritten to say why the lock is lifted (the locale blocker is gone since v4.1.0), never
              deleted quietly.
  - [ ] **Recorded so it is not re-argued**: A and B are not exclusive, and A alone leaves the doctrine
        frozen for everyone. The minimal honest package is **S1 + A**; the one that actually fixes the
        class is **S1 + B**.
- [x] **S4 — Release shape: ✅ DECIDED 2026-08-08 — it does NOT ride with the universes release.** The
      owner scoped that one to universes only. This finding ships with the **unfreeze release**, which
      is the coherent home: that release's whole subject is *the doctrine finally arrives*, so the new
      doctrine rule arriving with it is the demonstration, not a bundle.
  - [x] Release note per §11: what the owner gains is *"when you hand your brain a link or a file, it
        reads it before answering"* — never a paragraph about regimes and manifests. **Drafted
        2026-08-22** in [`release-v5.0.0-note.md`](2026-08-23-release-v5.0.0-note.md), in those words. ⚠️ It makes
        a **seventh** `What you get` bullet where §11 allows six: written in rather than dropped
        silently, with the cut flagged at the top of that file as the owner's.

## Deliberately out of scope (recorded so it is not re-litigated)

- [ ] **Making the hook verify the read.** A `UserPromptSubmit` hook cannot; a `PreToolUse` gate that
      blocks searches until the designated source was fetched would fire on every prompt containing a
      URL, including the ones where reading it is not the task. Not built.
- [ ] **Fetching the designated source automatically** (network in a hook): latency on every prompt,
      and it sends the owner's URL somewhere before they asked for it. No.

> Links: `scripts/lib/claim-discipline.test.mjs` (the pattern to copy, and its reach note),
> `scripts/lib/engine-copy-select.mjs` + `scripts/lib/brain-locale.mjs` (why option B is reuse, not new
> machinery), `engine-apply-plan.test.mjs` (the deliberate lock), ROADMAP Gate 1 and Gate 4.
