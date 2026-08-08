<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- STATUS: 🟢 OPEN — 2026-08-08. The rule is one paragraph; its DELIVERY is  -->
<!-- the work. S2's carrier is the owner's arbitration and nothing starts      -->
<!-- before it, because the two options are not the same release.              -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Action plan — the source the owner hands you comes first, and the doctrine that says so must actually arrive

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
  `CLAUDE.engine.md` is dated **19 July 21:02 — install day**, weighs **26 223 bytes** against this
  repo's **33 451**, and contains **zero** occurrences of *"I did not find"*. **12 commits** have
  touched that file since install (identity discipline, backlogs, source ordering, universes wording…)
  and **none of them ever arrived.**
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

- [ ] **S1 — The rule, written where doctrine belongs (EN + FR), with a guard on the model of the claim discipline.**
  - [ ] A **level-1 row** in the routing table of both `CLAUDE.engine.md` and
        `templates/fr/CLAUDE.engine.md`: *source designated by the owner (URL, path, screenshot,
        attachment)* → `WebFetch` / `Read`, **before any search**.
  - [ ] The **priority order** stated once, in prose: (1) what the owner hands over, (2) exact search
        (`Grep` / `Glob`), (3) semantic search (`search_vault`), (4) the web. Plus the *prerequisite*
        clause: when the task is defined **relative to** that source ("complete this article", "fix this
        file", "like in that repo"), the source **is** the specification.
  - [ ] Point the corollary at the **existing** Claim discipline rather than paraphrasing it — two
        paraphrases are two disciplines (`claim-discipline.test.mjs` already enforces that reflex for
        `prepare-1-1`). Add only what is new: *have I exhausted level 1 before concluding anything
        negative?*
  - [ ] **Guard test** modelled on `claim-discipline.test.mjs` (same `docSection` slicing, same EN/FR
        parity, one entry per rule naming the field defect it prevents), extended to whichever carrier
        S2 chooses.
- [ ] **S2 — 🛑 THE CARRIER. Owner's arbitration required before any code; the two options are not the
      same release.**
  - [ ] **Option A — a `UserPromptSubmit` hook.** Regex-detect URLs and file paths in the prompt and
        re-inject them as `additionalContext`: *"sources the owner designated, to open before
        answering: …"*, annotated for local paths with *exists / not found* (which also kills the
        "I searched and therefore it does not exist" half). Deterministic, non-blocking, precedent
        already wired. **Reaches the fleet at the next `/update-engine`.** Honest limit, to be written
        into the file itself: it fires **before** execution, so it makes the source **salient**, it
        never proves it was read. A reinforced reminder, not a constraint.
        - [ ] If taken: it must **never** read file contents into the context (a prompt naming `.env`
              would inject secrets). Names and existence only.
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
- [ ] **S4 — Release shape.** The owner wants this in the **next small version**, i.e. riding with
      `active-universe-follows-the-owner-action.md`. Note the convergence, which is a real release
      story rather than a bundle: both halves are *something the engine ships that the fleet never
      receives* (a `.gitignore` line there, the doctrine here).
  - [ ] Release note per §11: what the owner gains is *"when you hand your brain a link or a file, it
        reads it before answering"* — never a paragraph about regimes and manifests.

## Deliberately out of scope (recorded so it is not re-litigated)

- [ ] **Making the hook verify the read.** A `UserPromptSubmit` hook cannot; a `PreToolUse` gate that
      blocks searches until the designated source was fetched would fire on every prompt containing a
      URL, including the ones where reading it is not the task. Not built.
- [ ] **Fetching the designated source automatically** (network in a hook): latency on every prompt,
      and it sends the owner's URL somewhere before they asked for it. No.

> Links: `scripts/lib/claim-discipline.test.mjs` (the pattern to copy, and its reach note),
> `scripts/lib/engine-copy-select.mjs` + `scripts/lib/brain-locale.mjs` (why option B is reuse, not new
> machinery), `engine-apply-plan.test.mjs` (the deliberate lock), ROADMAP Gate 1 and Gate 4.
