<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- THE canonical plan for the duo-mode duplication work. Opened 2026-09-02.  -->
<!-- A SUB-PLAN of live-remote-sync-action.md (#84): it blocks that plan's     -->
<!-- step 8, and is reached THROUGH it, never directly from ACTIVE.md.        -->
<!-- The `## 📍 STATE` block below is this file's only perishable content:     -->
<!-- do not restate it here, in the parent plan, or in a resume header.       -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Action plan — two people on one brain stop storing the same thing twice

Parent plan: [`live-remote-sync-action.md`](live-remote-sync-action.md) (#84) — its
§ *Why no duo mode* holds **all** the analysis, the measurements and the risks this plan executes;
none of it is copied here. Branch: `feat/live-remote-sync` (same branch: this ships **with** #84, by
the owner's decision).

## 📍 STATE — the only perishable block in this file · opened 2026-09-02

**EVERY STEP THIS PLAN ORIGINALLY CARRIED IS DONE** _(2026-09-03, `415cd7c`)_. The French-twin block
is lifted: the owner gave the go-ahead, both twins were written in the same commit, and steps
3.1–3.3, 4.4, 4.5 and 5.2 landed with it. **But the plan reopened on 2026-09-04 with one more step,
below, and the release is held until it lands.**

- 🛑 **THE RELEASE IS HELD ON THIS PLAN AGAIN, BY THE OWNER** _(2026-09-04)_: *"On ne publie pas la
  release tant qu'on n'a pas amélioré le mode Duo."* The parent plan's `## 📍 STATE` holds the hold
  itself and the evidence behind it; **what this plan owns is the doctrine being refined and the work
  that refines it**, below.
- ▶️ **STEP 8 — THE ANNOUNCEMENT BECOMES A QUESTION** _(opened 2026-09-04, the work resumes here; 6
  and 7 were already taken by the original run, so this is 8)_.
  **The defect:** `brain-author.mjs` compares git author names and nothing else, so one person whose
  two Macs say `Thomas Pierrain` and `tpierrain` is read as two people — announced as *"a second
  person now writes here"* to someone who is alone, and their daily notes split one file per machine.
  `dated-note-path.mjs`'s header promises the opposite (*"even one with two Macs"*), and nothing
  enforces that promise. **The shape, agreed with him in conversation:** detection stays automatic,
  the once-in-a-brain's-life announcement becomes *"I see a second name, X. Is that someone else, or
  you on another machine?"*, and the answer is remembered so *"it's me"* fuses the two names and no
  suffix is ever written. Test-first, and the sub-steps get written here before any code.
  **▶️ 8.1 THROUGH 8.7 ARE DONE, GREEN AND PUSHED (CI read on each), AND THE FEATURE IS WHOLE**
  _(2026-09-04 night)_: the registry on disk, the question that replaces the assertion, the entry
  point that records either answer and pushes it, the filing and the banner both resolving through
  it, and the loop proved end to end as processes — the hook asks, the answer is recorded, the hook
  goes silent. **8.9 is written too** (SETUP §7, the release note's duo block, the PR body on GitHub;
  the note re-checked against the real `extractWhatYouGet`: 17 lines captured, both moments in).
  **▶️ WHAT IS LEFT HERE IS 8.8, the mutation measurement**, then the note's Quality paragraph gains
  its figures, then the parent plan's 8.3 (the tag) is the owner's.
- ✅ **THE CI WAS READ ON RESUMING** _(2026-09-04, 23:31 push)_: the checks for `9246e12` **and** for
  the plan commit after it both **passed**. Nothing red is outstanding, so a failure appearing from
  here belongs to the work below (`rules/ci.md`).
- ⚖️ **WHICH REFINES HIS 2026-09-03 CALL WITHOUT REVERSING IT.** *Implicit* stays: there is still no
  switch to flip, and his reasoning for that is untouched — **a switch protects only whoever thought
  to flip it, which is never the duo about to have its notes doubled.** What changes is what
  implicitness owes back. It already owed a sentence; it turns out it owes a **question**, because the
  sentence it was saying can be false. A brain may file things on a guess; it may not *assert* the
  guess.
- ▶️ **For anything about the RELEASE itself: whatever the parent plan's own `## 📍 STATE` block
  names.** What stands between the branch and a tag lives there, not here — including its order,
  which this file deliberately does not restate. _(It used to say "step 8"; the parent then found an
  earlier step of its own, and a named step here is a status copy by another route — corrected
  2026-09-03.)_
- **What the last commit changed, and why it was the one that mattered**: the mechanism was built and
  **nothing called it** — the capture path stamped no key, so nothing was ever found already-held.
  The producers are skills, a skill may not ship in English alone, so the feature could not exist
  until both locales said the same thing. They now do, guarded rule by rule (36 red, then 67 green).
- ✅ **The tag is `v5.1.0`, settled by the owner on 2026-09-03** — which is exactly what
  `scripts/lib/engine-fingerprints.json` was stamped with in that commit, so nothing has to be
  regenerated on that account (parent plan, 8.2ter).
- 👀 **Still his, and still not answered**: two product statements written during the run — the new
  `SETUP.md` §7 subsection *"Sharing one brain with someone else"*, and the rewritten sentence just
  above it about which merges stop and ask. They are shipped in the branch; his to overrule.
- 🕰️ **Where the ban that blocked this came from, since he asked and no file said** _(2026-09-03)_.
  Not an instruction of his: it was written by a session on 2026-08-22 into the v5 triage plan's
  autonomous-run boundary list, for **one** concrete item (a 350-line French doctrine twin whose fate
  was a product call), then **copied forward** into this plan and its parent as a generic clause,
  where its reason no longer applied. A copied boundary outlives the case that justified it — the
  same failure mode as a copied status, and the same fix: it is not restated anywhere any more.
- 🏷️ **AND IT NOW HAS A PUBLIC NAME, which is his too** _(2026-09-03)_. *"Duo mode"* stops being our
  internal shorthand for this plan and becomes the **product's marketing name**: v5.1.0 is titled
  **"The One with the Duo Mode"**, and the name is carried through the release note, `SETUP.md` §7,
  the README and EN-QUOI. His reasoning, against my objection that no user had read those words: **a
  feature's name is unfamiliar by construction, and the release is what puts it into the language** —
  *name what the person lives* governs describing a symptom, not christening something new. Written
  into CONVENTIONS §11 so it is not re-argued. **Consequence for this plan: the words *duo mode* here
  are now the same words the product says**, not a working label to be translated at publication.
- ✅ **HIS CALL, taken before the run: duo mode is IMPLICIT, and the brain announces it once.**
  Nothing to activate, no per-person profile to fill in. § *The owner's call: duo mode is implicit*
  holds the reasoning and the three things it settles. ⚠️ **Still true, but no longer the whole
  rule** — step 6 above turns that one announcement into a question, for the reason recorded there.
- ⚖️ **Two design calls are still MINE**, written at § *Design calls taken without him* with what each
  would cost to undo (the third, the per-person suffix, is now his). **4bis narrows a rule this
  release already shipped**, so it is the one most worth his eye.
- **Blocked on:** nothing.
- **A session may, alone:** run every step below test-first end to end, on `feat/live-remote-sync`,
  **pushing every green commit and READING its CI** (rules/ci.md: a push whose result is never read
  is worse than no push). Mutation-score every new production file the day it is written
  (CONVENTIONS §5quinquies). **Writing a French twin is part of editing an English file that has
  one** — never one without the other, in the same commit, which is exactly what the drift guard
  asks. **Not**: tag, publish, push to `main`, write into either of the owner's real brains, or
  touch his Gmail/Slack/Calendar again — the measurements are done and recorded.
- 🔁 **The save point moves**, because an autonomous run has no hand-back to hang it on
  (rules/plans.md): **write each decision into this file as it lands and commit it**, do not bank it
  for a hand-back that may be hours away.

## Tracking

### 0. The ADR — what a source identity IS, decided once

- [x] **0.1** _(2026-09-02)_ `maintainers/decisions/0041-a-captured-source-carries-its-identity.md`, with the
      `Scope:` field (§6), the Crux block first (§6quater), and the prior art named (§6quinquies:
      this is content-addressing applied to captures; the Notion mirror already does it). Prior art
      named twice over: the lockfile / `Message-ID` / git-blob family in the Crux, and **ADR 0023**
      (canonicalize before you compare) as the in-repo precedent for normalizing a volatile string
      before it is used as an identity.
- [x] **0.2** _(2026-09-02)_ The ADR carries **the key table** — reproduced from the parent plan's measurement, one
      row per source type, and the rule that **an absent key means UNKNOWN, never "already seen"**
      (§ 3, with the reason: every note in every existing vault is in that state).
- [x] **0.3** _(2026-09-02)_ It states the **two fields and their two jobs**: `sources` (a **LIST** of normalized
      keys, machine, what dedup reads) and `source_url` (human, clickable, what the citation
      renderer already reads — `rag/src/lib/citation-renderer.ts`). A note may carry one, both, or
      neither. **A list, not a single key — see § A note has SOURCES, plural.**
- [x] **0.4** _(2026-09-02)_ It states the **failing direction**: the check may only ever SAY "already held" and
      leave the skip visible. A silent skip trades a duplicate for a loss, and a loss cannot be
      noticed from inside the vault.
- [x] **0.5** _(2026-09-02)_ It states what "already held" **means for the second brain**, which is not "discard":
      **do not re-capture, go read what the vault already wrote from that source** — and enrich that
      note if the second person's question needs something the first did not extract. That is the
      whole value of sharing a brain, and it is the opposite of throwing work away.
- [x] **0.6** _(2026-09-02)_ It records the **partial-digestion edge**: a Slack thread digested at 8 messages and
      met again at 20 has the same thread id and different content. So a thread is keyed by its
      **messages**, not by the thread, or the record says how far it went. A recorded "already seen"
      is a measurement with an expiry, like every other one in this repo.

> 🔤 **The ADR settled one thing the plan had not, and it is load-bearing: the SPELLING of a key.**
> `type|field|field`, each field normalized to `[a-z0-9._@+-]`, everything else collapsed to `-`.
> That is not cosmetics — it makes a key safe in a YAML **inline** list (the only list shape the
> brain's own dependency-free frontmatter reader parses), safe as **one** shell argument, and
> greppable. It is why no key may contain a comma or a colon, and why a calendar or mail timestamp is
> written in the basic ISO form (`20260902T161932Z`).
>
> ⚠️ **And one homonym to keep straight**: a *filing spec* already has a `sources` field, and it means
> something else entirely (the tier of material the note rests on — verbatim, human synthesis, AI
> synthesis). The machine identity therefore travels through a spec as **`sourceKeys`** and lands in
> the note's frontmatter as **`sources`**. The two never meet in one field.

### 1. The lookup — "do I already hold this source?", deterministically

- [x] **1.1** _(2026-09-02, 13 tests)_ `scripts/lib/source-key.mjs`: the pure, I/O-free core (ADR 0009 rung 1) — normalize a
      raw source descriptor into a key, one function per source type, plus the mail composite
      (sender + ISO timestamp + subject, each normalized). Tests first.
      **One design point the plan had not named, and it is the negative pole of the whole chantier:**
      an **opaque identifier keeps its case** while **human text loses it**. Folding a Drive or Notion
      id invents a collision between two different documents — a false "already held", which is the
      silent loss ADR 0041 §5 forbids; keeping the case of a subject line invents a miss, which is
      merely a duplicate. The two rules point in opposite directions because the two failures do.
- [x] **1.2** _(2026-09-02, 10 tests)_ `scripts/known-source.mjs`: the entry point. Reads a key on argv and answers **"does
      ANY note list this source?"** — it **scans the vault's note frontmatter** (never the index: a
      note that arrived by git seconds ago is not indexed yet, and an index-backed check would
      answer "never seen" precisely in the duo case it exists for), prints one line, **exits
      non-zero on a hit**. Same shape as the check the skill already
      calls for Slack (`set-universe-profile.mjs --check-slack`): pre-authorized, greppable.
      **Three exit codes, not two, and that is a change from the plan** — see the note below.
      Listed in `engine-manifest.json`'s `replace` regime, like every other top-level entry point,
      so a deployed brain receives it at its next engine update.
- [x] **1.3** _(2026-09-02)_ Tested **as a process** (rules/testing.md entry-point seam rule), not only through its
      imported functions: a real temp brain, a note inside a universe subtree, a human subject with
      spaces and punctuation surviving the command line, and a brain with no vault at all.
- [x] **1.4** _(2026-09-03, 80.17 % → 98.60 %)_ Mutation run on both new files, results appended to `maintainers/mutation/RESULTS.md`
      newest-first.
      **Half the first pass's survivors were a design smell, not thin tests** — the field table named
      each normalizer with a *string*, so a dispatch had to turn the label back into behaviour and a
      typo could change it silently; the presence check ran twice; two `.trim()` calls were already
      dead. Putting the **function** in the table deleted five survivors and the dispatch with them.
      The genuine gaps were all one shape: a key that would come out **different on the other
      person's machine**. `known-source.mjs` ends at **100 %**.

> 🚦 **The exit codes are THREE, and the third one is the safety of the whole chantier.**
> `0` not held (or could not find out) → capture · `1` already held → go and read the note it names ·
> `2` **the question itself is broken** (unknown source type, missing field, malformed key). The plan
> said "non-zero on a hit", and a caller that tested only *non-zero* would let a **typo in its own
> arguments cancel a real capture** — a silent loss, which is exactly the direction ADR 0041 §5
> forbids. So a broken question is loud, on stderr, with its own code; an *answer* always goes to
> stdout. Same reason an unreadable vault answers `0` and says "could not find out": failing towards
> a duplicate is failing towards something greppable.
>
> 🔎 **A stray observation, his to act on or ignore**: the plan calls this shape "pre-authorized", on
> the model of `set-universe-profile.mjs --check-slack`. In fact **no engine script is in the shipped
> permission allowlist today** — `.claude/settings.json.template` allows `node --import tsx --test`
> and nothing else of the kind, so every one of these checks asks the owner once. Nothing was changed
> here: adding this one script and not its eight siblings would be arbitrary, and the permission list
> is the owner's surface.

### 2. The writer guard — the deterministic path cannot write a known duplicate

- [x] **2.1** _(2026-09-02)_ `scripts/file-back-note.mjs` refuses a spec whose sources the vault already
      holds, reusing the homonym-refusal shape it already carries (exit 1, name the note that
      already holds it). Test first, including the "no key at all" case, which must pass.
      **The spec field is `sourceKeys` and it takes DESCRIPTORS, not keys** — the raw fields a
      connector handed back — because composing the key is the deterministic side's job (ADR 0009);
      `renderFiledNote` hands the composed keys back so the question and the stamp cannot disagree.
- [x] **2.2** _(2026-09-02)_ The refusal message names the existing note's path, so the caller can cite it rather
      than re-capture it — and says to **read and enrich** it, which is what ADR 0041 §6 means by
      "already held". An unreadable vault does **not** block the write: failing towards a greppable
      duplicate, never towards an invisible loss.
- [x] **2.3** _(2026-09-03, 97.89 %)_ Mutation run on the changed file.
      Measured in the step-4 batch (one worktree, one run). Its five remaining survivors are every
      one an equivalent, named in `RESULTS.md` rather than implied. The pass also found that three
      assertions on the refusal were weaker than they read — `/read|enrich/i` passes on the word
      "al**read**y", so the rule it claimed to pin was never asserted — and that the REAL vault
      reader had no test at all: every other one injects the notes, so all of them would pass with
      a reader looking one folder too high, which in the field means the guard silently never fires.

### 3. The producers — the identity gets written, and checked before capture

- [x] **3.1** _(2026-09-03, `415cd7c`)_ `.claude/skills/sync-sources/SKILL.md`: stamp `sources` on everything written from an
      external source (one entry for a capture, **as many as it drew on** for a synthesis), and run
      the check **before** capturing. Prose, asserted the way the other
      disciplines are (`claim-discipline.test.mjs`, `connector-discipline.test.mjs` are the models).
      **Applied where the writing happens, not only where the rule is stated**: both capturing
      sub-agents run the check, a capture stamps its one key, and the briefing's `sources:` becomes
      the machine list (the human list stays in the body, as backlinks).
- [x] **3.2** _(2026-09-03, `415cd7c`)_ The key table lands in the skill too, in the terms a sub-agent can apply, with the
      cheap-format rule for mail: sender + timestamp + subject come back in `MINIMAL` /
      `METADATA_ONLY`, so **never fetch a raw message just to get an identity**.
- [x] **3.3** _(2026-09-03, `415cd7c`)_ `templates/fr/.claude/skills/sync-sources/SKILL.md` — the French twin, written in the
      SAME commit as its English source. ⚠️ Deliberate product localization (rules/language.md):
      translated, not anglicized, and every rule the guard asserts is asserted in French too.

> ✅ **THE BLOCK IS LIFTED, and what it was is worth keeping** _(2026-09-03, the owner's go-ahead)_.
> `scripts/lib/locale-drift.test.mjs` fails the suite the moment a commit touches an English file that
> has a `templates/fr/` twin without touching the twin — and `.claude/skills/sync-sources/SKILL.md`
> has one. **That guard was never the blocker**: it does not forbid the work, it requires both halves
> in one commit, which is what happened. The blocker was a *boundary line copied into this plan* —
> "do not write under `templates/fr/**`" — traced back on 2026-09-03 to the v5 triage plan of
> 2026-08-22, where it covered one specific product call and nothing else.
>
> The three ways out, and why the honest one turned out to be a question rather than a workaround:
>
> - **Write the French twin too** — the right answer, and it needed the owner's word because the plan
>   said so. Taken, once he gave it: an explicit instruction outranks my reading of what it was for,
>   and asking is how a copied instruction gets re-examined instead of quietly ignored.
> - **Waive the commit in `NOT_A_PORT`** — that map exists for commits which *cannot* be ported (an
>   English fix bringing English up to French's standard), and its own header calls a waiver "a claim
>   someone must be able to check". "I will port it later" is not one. Not taken.
> - **Draft it, do not apply it, and make it a one-word decision.** Taken overnight, and the drafts
>   below are what got applied verbatim — kept here as the record of what was pasted.
>
> ⚠️ **What it cost while it stood**: steps 1, 2 and 4 build the mechanism, and step 3 is what makes
> anything *call* it. Until 3.1 landed, `sync-sources` stamped no key, so nothing was ever found
> already-held and the writer guard had nothing to compare. **The deterministic half was real either
> way** — `file-back-note.mjs` refuses a duplicate for any caller that passes `sourceKeys` — but the
> capture path was unchanged. It was the one unticked box that changed what the release *does*,
> rather than what it says.
- [x] **3.4** _(2026-09-02)_ The linter accepts `sources` (`scripts/lib/wiki-lint.mjs`), and the frontmatter
      parser exposes it (`rag/src/lib/frontmatter-parser.ts`) the way `sourceUrl` already is.
      **The linter needed no change** — it checks that required keys are PRESENT and is indifferent
      to any others — so what landed there is a **non-regression assertion**, not a fix: it pins the
      indifference, so a future required-key list cannot start complaining about a field the engine
      itself writes (the permanent, unclearable complaint §5quater forbids). The parser half was a
      real change, test-first: a lone key needs no list to be one source, and a note written before
      this decision exposes an **empty** list, which reads as UNKNOWN and never as "drew on nothing".

### 4. Per-person paths — two syntheses of one day stop colliding

- [x] **4.1** _(2026-09-02, 12 tests)_ `scripts/lib/dated-note-path.mjs`: pure core. Given the date, the author and what the
      vault already holds, answer where today's `briefings/` or `daily/` note goes. **Rule:** the
      base name (`daily/2026-09-02.md`) belongs to whoever writes first; a *different* author
      writing the same day gets `daily/2026-09-02-<author-slug>.md`. A solo brain therefore **never
      sees a suffix** — see § *Design calls taken without him*.
- [x] **4.2** _(2026-09-02)_ The author identity comes from `git config --get user.name`, already read by
      `scripts/lib/remote-sync.mjs:153` — reuse it, do not re-invent a second notion of "who".
      **Done by extraction, not by copying**: `scripts/lib/brain-author.mjs` now owns that question,
      and the live sync's banner reads it from there, so the name that decides where a note lands and
      the name that decides whether to raise a banner can never disagree.
- [x] **4.3** _(2026-09-02, `scripts/session-authors.mjs`, 9 + 18 tests)_ The identity reaches the session through `additionalContext` at SessionStart, the
      proven channel (`scripts/session-universe.mjs` is the model). One line, silent when the brain
      has one author. **A new hook entry, and that is affordable here**: `reconcileHooks` adds a
      missing engine hook to a DEPLOYED brain's `settings.json` additively (ADR 0026), so the fleet
      gets it at its next update — which is why #84 could avoid one and this can have one.
- [x] **4.3bis** _(2026-09-02)_ **The announcement that pays for the implicitness** (§ *The owner's call*): the
      **first** time a second author is seen writing in this brain, the brain says so **once**, in
      plain words, and offers (without requiring) to describe who is who. Never repeated: the "said
      it" marker lives beside the other per-machine markers under `.cache/`, so a brain that already
      knows stays silent forever. **Authors are read from git history, not from a list somebody
      maintains** — no new record of who people are, and nothing to keep in step.
- [x] **4.3ter** _(2026-09-02)_ The offer points at the surface that already exists for describing people (the
      universe profile, ADR 0035), and **nothing in steps 1 to 4 may depend on that description**:
      declining it must change no behaviour whatsoever.
- [x] **4.4** _(2026-09-02 for the seed, 2026-09-03 `415cd7c` for the appending half)_ `actions-log.md` **stays one file** — union merge is exactly right for a flat
      append-only ledger — but each appended line carries its author, so "keep both" is readable
      without a human sorting out who said what (the study's own cheap mitigation).
      **The documented format now carries `· <who>`**, in the seed (`actions-log-seed.mjs`) and with
      the reason beside it. **The APPENDING half rode with step 3 and landed with it**: nothing
      deterministic appends to that ledger — `sync-sources` does, in prose — so the skill (both
      locales) now documents the name field and where the name comes from. The seed reaches new
      brains only, deliberately: `vault/actions-log.md` is the owner's file and the engine never
      rewrites it.
- [x] **4.5** _(2026-09-03, `415cd7c`)_ `sync-sources` and the daily-note
      convention updated to call 4.1 rather than compose a path by hand: step 4 now asks
      `node scripts/dated-note-path.mjs --folder briefings --date …` for the path and writes where it
      says, in both locales. **It was already reachable before that**: the SessionStart hook of 4.3
      tells every session, on any brain with two authors, to take a dated note's path from that same
      script — a channel that needs no twinned file.
- [x] **4.6** _(2026-09-02, `suffixed-dated-note-compat.test.mjs` + a rag test)_ Compatibility: **old unsuffixed notes keep working** — type detection by prefix
      (`TYPE_BY_PREFIX`), the linter's zone lists and the consolidation capture zones all match on
      the folder, not the file name, so a suffix changes nothing for them. **Assert that**, do not
      assume it: the universe blind spot in those very lists has its own hardening plan.
      **Asserted from the outside, in one file, on names built by the rule itself** so the test
      cannot drift from what is actually written: type detection (a per-person daily is still a
      daily, at the root and inside a universe), the linter (no orphan, no frontmatter complaint —
      a permanent unclearable complaint is §5quater's own failure mode), and the consolidation
      gesture (both suffixed notes are read as captures and their mentions still become candidates).
      Plus the negative pole: the suffix grants **nothing** — a curated page named like a day is
      still held to every rule.
- [x] **4.7** _(2026-09-03, 80.00 % → 98.03 % over the batch)_ Mutation run on the new file.
      Four files, not one: the two pure cores end at **100 %**, the session hook at **95.35 %**, the
      entry point at **98.75 %** from **66.67 %**.
      **The low number was concentrated in the refusals**: six error paths shared one test that
      checked `exit 2` and nothing else, so each could say whatever it liked while "passing" — and
      each has a different fix for the caller, which is the only reason the message exists.
      **Two seams had never been reached**, both of the kind that fail silently in the field: the
      git wiring (only ever exercised with an injected name, so nothing observed that it roots git
      on the brain — a git command run in the wrong place does not fail, it answers about somewhere
      else), and the marker's `mkdir` (the fixture had no `.cache/` yet, while every brain the sync
      has ticked in does — where a non-recursive mkdir throws, the marker is never written, and the
      sentence said "once" is said at every session start forever).

> 🚨 **THE F5 GUARD CAUGHT THIS FEATURE WHILE IT WAS BEING WRITTEN, which is what it exists for**
> _(2026-09-02)_. `startup-payload-guard.test.mjs` censuses every module that writes into
> `additionalContext` — the block echoed VERBATIM to a CLI owner, prefixed `SessionStart:startup
> says:`, **before they have typed a word** — and refuses a new one that carries no length bound. My
> draft named every author of the brain and explained the whole rule: **~900 characters** at every
> session start, on the exact reasoning the guard's own header records as having failed twice before
> ("additionalContext only ever speaks to the agent" — it does not).
> **Shipped instead**: three names then a count, and one clause saying what to call rather than
> composing a path. 228 + 248 characters, bounded by their own tests. Ninth emitter, registered.

### 4bis. Narrow the automatic merge to the zones that can actually take it

The owner challenged the merge rule itself on 2026-09-02, and he is right: `merge=union` is
currently scoped to **`vault/**/*.md`**, i.e. to every note including the curated ones, and union is
**not a merge — it is a concatenation**. It keeps both sides' lines with no marker and no question.
That is the correct resolution for a ledger nobody rewrites, and the wrong one for a page two people
edit. The repo already owns the vocabulary for that split: `RAW_CAPTURE_ZONES` in
`scripts/lib/wiki-lint.mjs` versus the curated entity types beside it.

- [x] **4bis.1** _(2026-09-03)_ `.gitattributes`: `merge=union` **only** on the append-only zones (`daily/`,
      `raw-sources/`, `inbox/`, `_inbox/`, `actions-log.md`), and **the default conflict behaviour
      restored everywhere else** in the vault — `people/`, `topics/`, `decisions/`, `meetings/` and
      the rest. Patterns must match **inside a universe too** (`acme/daily/…`), the blind spot those
      very zone lists already have a hardening plan for.
      **Five patterns of the shape `vault/**/<zone>/**/*.md`**: `**/` matches zero or more
      directories, so one line covers the root and every universe subtree. The file is under the
      manifest's `replace` regime, so the narrowing reaches every deployed brain at its next engine
      update — it is not a rule that only new brains get.
- [x] **4bis.2** _(2026-09-03)_ The zone list exists in **one** place, not two: `.gitattributes` and
      `wiki-lint.mjs` must be asserted to agree rather than trusted to, the way the `.gitignore`
      migration and `reconcile-brain.mjs` already are (CONVENTIONS §5quater — a third hand-written
      copy of a rule is the drift that convention warns about).
      **`RAW_CAPTURE_ZONES` is now exported**, and the test reads the union rules back out of
      `.gitattributes` and asserts the two sets are equal — so a zone added on one side and not the
      other fails the suite instead of shipping half a rule.
- [x] **4bis.3** _(2026-09-03)_ Non-regression on #84's own promise: two appends to one **daily** note still merge
      with no human (`scripts/lib/notes-union-merge.test.mjs` is the existing proof — extend it, do
      not weaken it), and two edits to one **person card** now produce a real conflict.
      **Extended, not weakened**: the file went from 3 tests to 17, driving real git. Every zone is
      exercised at both depths (root and universe), from the linter's list rather than a hand-typed
      one. The one existing test that had to move is the universe case, which used to prove its
      point on `acme/people/claire.md` — a curated page, which is now precisely the thing that must
      NOT merge; it proves the same point on `acme/daily/…` and the curated pair became the new
      negative pole.
- [x] **4bis.4** _(2026-09-03)_ A conflict on a curated page is **not a failure**: the machinery already exists and
      is built (parent plan, step 4) — `rebase --abort`, the files named in the trace, and the brain
      guides the merge at the next message. Assert that a curated-page conflict reaches that path.
      **Asserted by the command, not by narration**: the test runs the very
      `git diff --name-only --diff-filter=U` of `remote-sync.mjs`'s conflict branch on a real
      conflicted curated page and pins its exact output, then aborts and checks the tree is intact.
      The path itself stays unit-tested against a fake git; what was missing was the proof that real
      git hands it what it expects.
- [x] **4bis.5** _(2026-09-03)_ The frontmatter corruption this removes is worth recording in the ADR: two edits to
      one `updated:` line under union produce **two `updated:` keys** and a note the indexer
      refuses. Today that is caught after the fact (the tick re-checks the header and undoes the
      rebase); narrowing the rule means curated notes never reach that state at all.
      **Recorded in ADR 0011** (amended in place, §6bis — #84 owns no ADR of its own), with the
      sentence the decision turns on: *a conflict is a question asked of a human; a concatenation is
      an answer invented for them, and only one of the two can be wrong without anyone noticing.*
- [x] **4bis.6** _(2026-09-03, not planned, found while grepping the carriers)_ `SETUP.md` §7 told the
      owner a merge only needs a hand for "the same line changed two ways, a file that is not a
      note" — **true when the rule covered every note, false the moment it stopped**. Rewritten in
      plain words: keep-both applies where you only ever ADD; anything you REWRITE stops and asks.
      No French twin exists for `SETUP.md`, so this one was free to fix.
      **The other carriers were checked and need nothing**, which is worth recording so the release's
      §10 re-read does not have to re-derive it: `README.md` promises exactly *"two notes added the
      same afternoon to the same daily note merge by themselves"* — a daily note, i.e. a zone the
      narrowed rule still covers, so the sentence stays true word for word. The other `merge` hits in
      `README.md` and `EN-QUOI-C-EST-DIFFERENT.md` are about the **engine skill** merge, a different
      mechanism entirely.
- [ ] **4bis.7** ➡️ **For the release note (parent plan 8.2), do not let this one slip.** The
      narrowing is the only change in this chantier that a brain already in the field will *feel*:
      a curated page two machines edited used to merge silently and now **stops and asks**. That is
      the fix, not a regression, and the note should say so in that order — *"a page you rewrote on
      two machines now asks you which version wins, instead of quietly keeping both halves"*. Left
      unticked deliberately: it belongs to the release, and the release is the owner's.

### 5. The doctrine — what duo mode does and does NOT cover

Not a division of duties: the owner struck that out (parent plan, § *The owner's design call*).
This is the honest statement of the perimeter.

- [x] **5.1** _(2026-09-03, `SETUP.md` §7 → "Sharing one brain with someone else")_ A subsection saying plainly that two people on one brain each keep
      their own notes; that **Gmail delegation lets the person read the mailbox but never their
      brain** (structural — no Gmail tool takes a mailbox argument); that **sharing a calendar DOES
      reach the other brain** (it takes a calendar address) and is the recommended path there; that
      a **direct message** to one person is invisible to the other; and that Slack membership is
      **per workspace**. `SETUP.md` has **no French twin**, so this half was free to write.
      Framed around the one sentence worth remembering: *sharing a brain shares what you wrote down,
      not what you can see.*
- [x] **5.2** _(2026-09-03, `415cd7c`)_ Applied with step 3, in the same commit, as predicted. The
      constitution's owner-editable part is `CLAUDE.md.template`, which **is** a watched locale pair
      (`templates/fr/CLAUDE.md.template` exists), exactly like `CLAUDE.engine.md` — so the section
      *"If you share this brain with someone else"* landed in both, right after `## Tone`, and is
      asserted rule by rule beside the source-identity guard. It reaches **new installs only**
      (the template is in no update regime): a deployed brain's constitution is the owner's file.
- [x] **5.3** _(2026-09-03)_ ⚠️ **Product statements — proposals until he has read them** (same standing as
      `SETUP.md` §6(e), still awaiting his review). Write them; do not treat them as settled.
      **Written and flagged, not settled**: the §7 subsection is on disk and shipped in the branch;
      it is the first thing to re-read in the morning, and the wording is his to overrule.

### 6. Verification, end to end

- [x] **6.1** _(2026-09-03: 2978 pass / 0 fail, rag 534 pass / 0 fail, tsc clean)_ Green suite: `node --test --test-timeout=240000 "scripts/*.test.mjs"
      "scripts/lib/*.test.mjs" "rag/*.test.mjs"`, plus `npm test` and `tsc --noEmit` in `rag/`.
- [x] **6.2** _(2026-09-03, 16 claims held, 0 failed)_ A **two-clone rehearsal** in step 7's shape (parent plan): two clones of a scratch
      brain, two different `user.name`s, both capturing the *same* fabricated source → the second
      is refused and cites the first; both writing the same day → two files, no collision.
      **On a scratch brain built here, never on either of the owner's real brains.**
      **Kept as a repeatable harness**, on the model of the field rehearsal beside it:
      `maintainers/qa/duo-rehearsal/rehearse.mjs` (+ its README). It proves the one thing no unit
      test can — that **the key one machine writes is the key the other machine composes**, days
      later, from different raw fields, in another timezone, after a git merge. That agreement lives
      *between* the parts; each part's own tests prove its end against a fixture.
      It also walks the narrowed merge rule end to end: two appends to one daily keep both lines,
      two edits to one person card conflict, name the file exactly as the sync tick reads it, and
      leave **one** `updated:` line after the abort.
      ⚠️ **And it made one thing visible that no box had stated**: step 5 only works because the
      daily note carries an `author:` in its frontmatter. The entry point says so in its own output,
      and a note claiming nobody falls back to the shared file (today's behaviour, not a breakage) —
      but **the suffix mechanism is only as live as the caller that stamps the field**, and that
      caller is the skill blocked with step 3. Recorded in the rehearsal's README.
- [x] **6.3** _(2026-09-03, every one)_ Every push read on CI (`gh run list --branch feat/live-remote-sync`).
      Ten pushes over the run, each read before the next commit; no red at any point.

### 7. Hand-back

- [x] **7.1** _(2026-09-03)_ This STATE block says where it stopped, in the terms of § *Design calls taken without
      him*, before the last commit of the run.
- [x] **7.2** _(2026-09-03, twice: at the hand-back, then at the unblocking)_ The parent plan's step 8 is unblocked (or says precisely what still blocks it).
      At the hand-back it was **not** unblocked, and the blocker was one sentence long: the three
      skill/constitution edits needed their French twins. **Since `415cd7c` it IS unblocked** — the
      twins are written, and the parent's step-8 header says so and points here rather than
      restating any status.

### 8. The announcement becomes a QUESTION — one person with two Macs is not a duo _(opened 2026-09-04, the release is held on this)_

> **Read § *The owner's call* below first**: this step does not reverse it, it pays what it left owing.
> Detection stays automatic and there is still no switch. What changes is that a brain may **file** on
> a guess but may not **assert** one, and the guess it was asserting can be false.

> 🧭 **THE DESIGN, settled before any code was written** _(2026-09-04, session 2)_. Four calls, each
> taken alone, each cheap to reverse, and each written here because the sub-steps below read as
> mechanical once they are known:
>
> 1. **The memory that stops the question is the ANSWER, and the per-machine marker is DELETED.**
>    Today `.cache/second-author-announced` stamps "said" the instant the sentence is emitted. Turn
>    the sentence into a question and that marker becomes the defect: a question asked once, ignored
>    once, and **never asked again** leaves the false positive standing for the life of the brain —
>    which is precisely what the release is held on. So the question repeats at session start until it
>    is answered, and what silences it is `.vault-rag/authors.json`, which **travels**: answering on
>    one Mac answers for both. The marker's suppression role is not replaced, it is removed.
> 2. **A refusal is an answer too, so the file records BOTH.** `{ identities: [{name, aka}],
>    distinct: [name] }`. Without `distinct`, a real duo — who answer *"no, that is my colleague"* —
>    would be asked the same question at every session forever, and the honest answer would be the one
>    the design punishes. Compared by slug, stored in the spelling the human used.
> 3. **The one-time explanation moves to the moment it becomes true.** Today's sentence explains duo
>    mode (*"each person's day gets its own note…"*) on a guess. It is now printed by the recording
>    entry point itself, when the human confirms a real second person — deterministic, said exactly
>    once, and **no marker is needed to remember it** because the event that triggers it happens once
>    by construction. A fused identity gets no duo-mode explanation at all, because nothing about
>    their brain has changed.
> 4. **The native banner is in scope, and it was NOT in the step as written.** `remote-sync.mjs`
>    raises an OS notification when an arriving author `!==` the local `user.name` — a raw string
>    compare, so an owner's second Mac pops a desktop banner about their own notes. Same defect, same
>    root, one line from the same registry: it is 8.6bis below rather than a follow-up nobody files.

- [x] **8.1** _(2026-09-04)_ Amend § *The owner's call* with the refinement and its trigger, so the
      section that settled "implicit" is not read alone. _(Doc only, no code.)_ ✍️ Written as a
      subsection **under** the call rather than an edit inside it: the call is the owner's words and
      stays legible as such, and the refinement carries the sentence that generalises — **a brain may
      FILE on a guess, it may not ASSERT one.**
- [x] **8.2** _(2026-09-04, `brain-author.mjs`)_ **The pure rule, test-first**: `brain-author.mjs` learned an
      **identity registry** — `[{ name, aka: [...] }]`, spellings the owner has confirmed are one
      person. New `canonicalAuthor(name, identities)`; `distinctAuthors`, `authorsReminder` and
      `secondAuthorAnnouncement` all resolve through it before comparing slugs, so `Thomas Pierrain`
      + `tpierrain` collapse to one and the reminder names the spelling that was kept. **Seen red
      first**: 6 failures on their assertions (not on a missing export — a stub carried the load),
      then 34/34 green, and the whole scripts suite green at 3021. Fail-open is pinned by its own
      test over eleven malformed shapes, and the converse too: a real second person is still counted,
      announced and named. **It resolves nothing on its own** — the registry only remembers an answer
      already given, which is 8.4's and 8.5's job to obtain.
- [x] **8.3** _(2026-09-04, `author-identities.mjs` + 26 tests)_ **The storage that TRAVELS**:
      `.vault-rag/authors.json`, beside `universes.json` — the
      precedent for brain state that must reach the other machine (a fused identity is a fact about
      the world, true on every Mac; answering once must be enough). Read tolerant of absence and of
      corruption, same contract as every session-hook seam. New `scripts/lib/author-identities.mjs`:
      `readAuthorsState` / `writeAuthorsState` over the injected fs of `universes.mjs`, plus the two
      pure edits `fuseAuthors(state, canonical, alias)` and `markDistinct(state, name)`.
      **Idempotent and convergent by construction**: fusing merges into whichever entry already knows
      either spelling, so the same answer given twice — or given on the other Mac first — lands on one
      entry, never two rival ones.
      ✅ **Written test-first** (a stub carried the load, so the 25 reds were assertions and not a
      missing export), and two things came out of the writing that the design had not named:
      **a half-damaged file keeps its good half** — the two lists are validated separately, so a
      mangled `distinct` costs the refusals and not the fusions — and **`markDistinct` UNDOES a wrong
      fusion**, dropping the name from whoever had swallowed it. Without that, a human who answered
      *"it's me"* about a colleague could say so and be ignored by the filing rule, which is the same
      class of unfixable-wrong-answer the step exists against. The 26th test is a fixture correction
      kept as its own case: `thomas.pierrain` and `Thomas Pierrain` are ALREADY one name here, because
      a slug is what this brain compares.
- [x] **8.4** _(2026-09-04, `brain-author.mjs` + `session-authors.mjs`, 40 + 13 tests)_ **The
      announcement becomes the question**: `secondAuthorAnnouncement` stops asserting
      *"a second person now writes here"* and asks *"I see a second name, X — someone else, or you on
      another machine?"*. Until answered, filing keeps today's protective behaviour (a real duo that
      never answers is still protected), and the question is asked at session start, **before** the
      day's first note, so the false-positive case never gets a split note at all. **Renamed
      `secondAuthorQuestion`**, because a caller reading `…Announcement` would be reading a lie about
      what it now returns.
      ✅ **Done, and the per-machine marker is gone with it** — `.cache/second-author-announced` and
      its `markAnnounced` seam are deleted, so **this hook now writes nothing at all** (its own test
      says so: a session start that dirties the tree makes the next sync tick defer). Two things the
      writing added to the design: the question **names at most three** unplaced names and counts the
      rest, like the line above it — five is a brain handed round a team, and a roll call is not a
      question anybody answers — and **a registry that cannot be read costs only the answers**, not
      the notice, because unreadable answers must read as *not answered yet*. The prose duo mode owed
      is not lost: it moved into `duoConfirmedNotice`, which 8.5 prints at the moment the answer makes
      it true.
- [x] **8.5** _(2026-09-04, `author-identity.mjs` + 19 tests, 8.7 inside)_ **The way the answer is
      recorded**: an entry point the agent calls (`--same-person` /
      `--different`), which writes `authors.json` and commits + pushes it **scoped**, reusing the
      universe switch's own machinery (`universe-persist.mjs`) rather than a second one. That reuse
      needs one refactor: the commit is scoped to `.vault-rag` but its MESSAGE is hard-coded to a
      universe switch, so the message becomes a parameter and `commitUniverseState` keeps its own by
      delegating.
      ✅ **Done, refactor included** (`commitVaultRagState` / `persistVaultRagChange`, two tests of
      their own; the switch delegates and its whole suite is untouched). Four things worth keeping:
      **a re-answer writes nothing at all** — the same answer twice leaves the disk alone, because
      writing anyway dirties the tree and makes the next sync tick defer, for nothing; **the answer
      is written BEFORE it is committed**, pinned on one shared timeline of fs and git events, since
      neither fake can see that order alone and a commit that runs first commits the PREVIOUS answer;
      **a commit or push that cannot happen is said out loud and the exit code stays 0** — the answer
      IS on disk, and what the human must hear is that it has not reached the other machine; and the
      commit stays **scoped**, proved on a real repository with a STAGED draft that survives untouched
      (the v4.9.1 review finding, one entry point over).
      ✅ **8.7 landed with it**: the entry point is driven **as a process** on a real git repository,
      and the loop is closed end to end — the hook asks, the answer is recorded, **the hook goes
      silent**. That last test is the release's held defect, closed; neither half proves it alone.
      📝 **One observation, and it is the owner's to settle, not a defect**: like `dated-note-path.mjs`
      and `known-source.mjs` before it, this entry point is **not in the brain's allowlist**, so
      recording an answer costs one permission click. Consistent with its siblings, so nothing was
      changed here — but the three of them are the same question, once.
- [x] **8.6** _(2026-09-04)_ **Filing follows the answer**: `dated-note-path.mjs` resolves the author through the
      registry, so a fused name never yields a suffix. Its header comment's promise (*"even one with
      two Macs"*) becomes true instead of hopeful.
      ✅ Done in the pure rule **and** in the entry point, and the entry point gained one thing the
      step had not asked for: **the `author:` it tells the note to stamp is now the CANONICAL
      spelling**. The stamp is what tomorrow's resolution reads back, so stamping whichever Mac wrote
      would leave every note claiming a machine instead of a person, and the fusion would have to be
      re-applied on every read forever.
- [x] **8.6bis** _(2026-09-04)_ **And so does the banner** (design call 4 above): the tick's native notification
      compares an arriving author to the local `user.name` with `!==`, so a fused owner is popped a
      desktop banner about their own notes. Resolve both sides through the registry and compare
      slugs — the same comparison the rest of the module already makes.
      ✅ Done through a new `isSamePerson(a, b, identities)` — **the** name comparison for the whole
      brain, so the banner, the note paths and the session line can never disagree about a human.
      ⚠️ **And the wiring is what nearly escaped**: every tick test injects its own seam, so adding
      `identities` to the tick left the REAL `realTickDeps` never reading the registry — the suite
      stayed green while the feature did nothing in a real brain. Exactly the shape `RESULTS.md` T7
      names. Caught by adding the key to the deps-shape assertion FIRST and watching it go red.
      Two cases the writing added: **case alone was never two people** (the old `!==` bannered on
      `paul` vs `Paul`), and an unreadable registry costs the fusion, never the tick.
- [x] **8.7** _(2026-09-04, with 8.5)_ **The entry point is tested as a PROCESS**, not only through its imported functions
      (`test-first-discipline`, the entry-point seam rule).
- [ ] **8.8** **Mutation-measured** like the rest of this release, results in `maintainers/mutation/RESULTS.md`, newest-first.
- [ ] **8.9** **The surface says it**: `SETUP.md` §7 and the release note's duo-mode block describe the
      question, not a silent detection. If the note changes, **re-check it against the real
      `extractWhatYouGet` parser** (the constraint is CONVENTIONS §11).
- [ ] **8.10** Then, and only then, the parent plan's 8.3 is unblocked and the release can be cut.

## 🛑 The owner's call: duo mode is implicit, and the brain announces it once _(2026-09-02, before the run)_

He put the question himself, and it is the right one to have asked before any of this was built: should
duo mode be **declared** — a switch people turn on, with a profile per person, so the brain can label
who does what — or should the brain simply **record who is at the keyboard** without asking anyone?

**His answer: implicit, and announced.** Nothing to activate, no profile to fill in for the mechanisms
to work. What made the call:

- **Most of this chantier does not need to know who anyone is.** The duplicate check asks *"does the
  vault already hold this source?"*, never *"who digested it"*. Steps 1, 2, 3 and 4bis are entirely
  person-agnostic; only the per-day paths (4) and the announcement (4.3bis) read an identity at all.
- **Reading it is not collecting it.** The name comes from `git config --get user.name`, which git
  already writes into **every commit this brain makes**, and which the live sync already speaks aloud
  ("1 note from Claire arrived"). Nothing new is recorded, and no list of people is maintained.
- **A switch protects whoever thought to flip it**, which is never the duo about to have its notes
  doubled. A protection that must be foreseen before the problem is not a protection.
- **It stays invisible for one person.** The per-day suffix appears only when a *second* name writes
  the same day, so a solo owner — even with two Macs and a remote — sees no change at all. Same
  doctrine as universes (ADR 0034): nothing surfaces until a second one exists.

**What implicitness owes in exchange, and it is not a switch: a sentence.** A brain that quietly starts
filing things differently is opaque. So the first time a second author is seen, the brain says it once,
in plain words, and offers to describe who is who — an offer that activates nothing and may be declined
with no consequence (4.3bis, 4.3ter). Transparency is the price of the implicitness, and it is paid in
one sentence rather than in a setting everyone must understand at install time.

### ⚖️ The refinement — a sentence is not enough, because the sentence can be FALSE _(2026-09-04, step 8)_

> Read this WITH the call above, never instead of it. **Nothing here reverses it**: detection stays
> automatic, there is still no switch, and *"a switch protects only whoever thought to flip it"* is as
> true as it was.

What the call did not foresee is that the brain **cannot know** whether it faces two people. It compares
git author names, so one owner whose two Macs are configured `Thomas Pierrain` and `tpierrain` is read
as a duo: told *"a second person now writes here"* while they are alone, and their days split one file
per machine. The owner put the question himself on 2026-09-04 and held the release on the answer.

**So the price of implicitness goes up by exactly one word: the sentence becomes a QUESTION.**
*"I see a second name, X. Is that someone else, or you on another machine?"* — and the answer is
remembered, in a file that travels, so answering once on one Mac is answering for both.

The line that generalises, and it is the reusable half: **a brain may FILE on a guess; it may not
ASSERT one.** Filing on a guess costs a file in an unexpected place, which is visible and reversible.
Asserting a guess costs the human's trust in everything else the brain says — and for a product whose
whole asset is trust, an alarming false statement is worse than a missing feature.

This **confirms and extends** the parent plan's decision 9.8 (*"no duo mode to declare: the remote is
the declaration"*), which was taken about the live sync alone: it now covers the duplication work too.
It also settles what had been my own first design call, the per-person suffix appearing only on
collision — that is his call now, not mine.

## A note has SOURCES, plural — and that is what makes his simple model work

The owner's model, in his words _(2026-09-02)_: *"à partir du moment où dans le vault j'ai déjà
traité un document source, quand je le traite pour la deuxième fois à partir de l'autre personne, ça
discarde"*. **That is exactly right, and it is the whole design** — with one shape correction he
half-saw himself when he asked whether a synthesis can rest on several sources.

**It can, and the brain writes two different kinds of note:**

- **A capture** — a transcript, a mail stored, a Slack thread saved under `raw-sources/`. **One
  source, one note.** His rule applies verbatim, and it is what the Notion mirror already does: one
  page, one file, rewritten in place, idempotent for free.
- **A synthesis** — a briefing, a `people/` card, a `topics/` page. **Made from N sources, and each
  source feeds N notes.** Many-to-many. A single `source_key` field on the note is therefore the
  wrong shape: such a note does not *have* a source, it *drew on* several.

**The fix keeps his rule and changes only the field**: `sources` is a **list**. A capture lists one
entry, a synthesis lists what it drew on. And the question dedup actually asks is about the
**source**, never about the note — *"has this Slack message been digested by anyone?"* — which is
answered by *"does any note list it?"*. Scanning the notes, so **no separate ledger to seed, drift
or corrupt** (the same statelessness `consolidation-candidates.mjs` argues for in its own header).

**And "already digested" must not mean "discard".** The second brain does not throw the work away:
it **goes and reads what the first one wrote from that source**, answers from it, and enriches that
note if its own question needs something the first pass did not extract. Reuse, not deletion —
which is the point of sharing a brain in the first place, and which keeps the failing direction of
0.4 intact.

## Design calls taken without him

Taken to keep the overnight run moving, cheap to reverse, his to confirm. **The first is no longer
mine — he confirmed it before the run** (§ *The owner's call*); it is kept here because the reasoning
that produced it is still the reasoning that defends it.

1. ✅ **HIS, since 2026-09-02.** **The per-person suffix appears only on collision, not always.** The alternative considered was
   suffixing every dated note in any brain that has a remote — the criterion the live sync already
   uses to decide a brain "lives in more than one place" (decision 9.8). Rejected because a great
   many solo owners wire a remote purely for **backup**, and they would get uglier file names for
   nothing. The chosen rule degrades to today's behaviour in the only racy case (both authors
   creating the day's first note at the same instant on two machines → union merge, exactly as
   now). **Cost to reverse:** the rule lives in one pure function (4.1); changing it is changing
   that function and its tests.
2. **Narrowing `merge=union` rather than removing or keeping it** (4bis). Keeping it vault-wide
   silently collages curated pages; removing it altogether breaks #84's own promise that two appends
   to one daily note merge with no human. The middle is the zone split the linter already draws.
   **The trade-off to be honest about:** more situations will now ask a human to arbitrate, and in
   duo mode with symmetric roles two people will touch the same `people/` card. A prompt is
   nonetheless better than a card that quietly says a thing and its opposite, and the guided-merge
   path is already built. **Cost to reverse:** one line of `.gitattributes` and its tests.
3. **`actions-log.md` stays a single shared file.** Union merge is the right resolution for a flat
   append-only ledger, and per-person ledgers would make "what did we do about X?" a two-file grep.
   The duplicate risk there is one repeated line, visible and greppable — not a merged document
   that contradicts itself. **Cost to reverse:** a path change in one place plus the seed
   (`scripts/lib/actions-log-seed.mjs`).

## What is deliberately NOT in this plan

- **The same fact restated in two wordings** inside a `people/` or `topics/` page. No machine tells
  that from a genuinely new fact without a judgment call, and a wrong call deletes real content.
  It stays with the novelty check and `/consolidate` — doctrine, forever.
- **A permission model inside a brain** (ADR 0034: the fence is the repo).
- **Verifying whether a Gmail forward preserves the original `Message-ID`.** Measured as
  unnecessary: the mail key is the composite, which survives any transport. Settling it would need
  a real forwarding filter and a test mail on the field setup — not here, and not needed.

## The step-3 draft — ✅ APPLIED 2026-09-03 (`415cd7c`), kept as the record of what was pasted

It sat here while the boundary line stood; it is now in the skill, in both locales, in one commit
touching `.claude/skills/sync-sources/SKILL.md` AND `templates/fr/.claude/skills/sync-sources/SKILL.md`,
with the `source-identity` slice added to `scripts/lib/source-discipline.test.mjs` on the model of the
section already there (same `docSection` slicing, one `pattern` per rule, EN and FR).
**One thing the draft could not predict**: three guarded phrases had to be re-wrapped in the prose,
because a sentence that breaks across a line makes its guard red for typography rather than for
meaning — the failure the source-discipline guard already records having met three times.

The section goes **immediately after `## Source discipline`**, before `## Identity discipline`.

```markdown
## Source identity — do not digest the same source twice

> **Two people can share one brain, and then the same mail, the same thread, the same document is
> reachable from both.** Nothing in a note used to record WHICH object it was built from — permalinks
> live in prose, and prose is not a lookup key — so the second brain could not know the first had
> already read it. Since notes in the append-only zones now merge without asking anyone, a doubled
> digest lands silently. This is the rule that removes the cause rather than the alarm (ADR 0041).

1. **Before you capture anything from a connector, ask the vault whether it already holds it.**
   One command, from the brain folder, with the connector's own raw fields — never a key you spelled
   yourself:

   ```bash
   node scripts/known-source.mjs --type slack --channel C0CEQ4R5E --ts 1725283200.001200
   node scripts/known-source.mjs --type mail --from "Billing <b@example.com>" \
        --date 2026-09-02T16:19:32Z --subject "Your invoice is ready"
   ```

   **Three exit codes, and the third is not a hit**: `0` not held (or it could not find out) → capture ·
   `1` already held → the line names the note · `2` the question itself is broken. Never treat
   "non-zero" as "already held": a typo in your own arguments would then cancel a real capture.

2. **"Already held" means GO AND READ IT, never "drop the question".** Open the note the check named,
   answer from it, and **enrich it** if what you were asked needs something the first pass did not
   extract. That is the whole value of sharing a brain. Discarding the work is the one reading of this
   rule that makes the brain worse.

3. **Stamp what you drew on.** Every note written from an external source carries `sources:` in its
   frontmatter — an inline list of normalized keys. **A capture lists one** (one mail, one thread, one
   document, one note). **A synthesis lists as many as it drew on** (a briefing, a person card, a
   topic page): such a note does not *have* a source, it *drew on* several. `file-back-note.mjs`
   composes the keys for you from `"sourceKeys": [{ "type": …, … }]` — descriptors, not strings.

4. **The key table, one row per source, and every value below is free in the ordinary response:**

   | Source | What identifies it | Where you already have it |
   |---|---|---|
   | Slack | the channel id + the message `ts` | every message response; it is what a permalink encodes |
   | Calendar | the event id **of the instance**, never the series | the ordinary listing (a recurring event returns both — take the instance) |
   | Drive | the file id | the search result |
   | Notion | the page id | the mirror already keys on it |
   | Mail | the **sender address + the sent timestamp + the subject** | `MINIMAL` / `METADATA_ONLY` |

   🛑 **Never fetch a raw message just to get an identity.** The RFC `Message-Id` would need a full
   MIME fetch — a hundred kilobytes into your context for one header, which is exactly what this
   fan-out exists to prevent. The three cheap fields are identical across every copy of a mail,
   whatever the transport, and requiring all three to match is exact, not fuzzy.

5. **No key is UNKNOWN, never "already seen".** A conversation, a document a human read to you, a
   source with no row above: write no `sources` key at all rather than a made-up one. Every note
   written before this rule is in that state, and a brain that read "no key" as "seen" would believe
   it had already digested the world.

6. **The identity is never a reason to say less.** If the check says held and your question needs
   more than the held note says, say so and go further. This rule removes duplicate STORAGE, not
   duplicate thinking.
```

And in `### Step 2 — Sub-agent fan-out`, one line in the transcript-extractor and chat-extractor
prompts: *"Before storing anything, run the source-identity check (see § Source identity). If it says
already held, return the note it names instead of re-capturing."*

And in `### Step 4 — Writing the briefing`, the template's `sources:` line becomes the **normalized
keys** of what the briefing drew on. ⚠️ **That field already exists there with a different meaning**
(a prose list, `["[[raw-sources/…]]", "chat (24h)", "calendar (day)"]`); it becomes the machine list,
and the human list stays in the body where a reader already finds it. **Old briefings are safe**: a
prose entry can never equal a normalized key, so it can never produce a false "already held".

## The step-5.2 draft — ✅ APPLIED 2026-09-03 (`415cd7c`), in the same commit as step 3

`CLAUDE.md.template` has a French twin (`templates/fr/CLAUDE.md.template`), so it is a watched locale
pair: touching the English alone makes the drift guard red, and the run's autonomy line forbids
writing under `templates/fr/**`. **So this is not a second decision** — whoever applies the step-3
draft applies this one, in the same commit shape (EN + FR twin together).

Where it goes: in the **owner-editable** part, as a short section right after `## Tone` — it is a
statement about the brain's perimeter, not about routing, so it belongs beside the personal settings
rather than in the engine layer.

```markdown
## If you share this brain with someone else

- **What you share is the notes, not the tools.** Their brain reads their mail, their messages,
  their calendar — never yours, and there is no setting that changes that. What crosses is what one
  of you wrote down.
- **The calendar is the exception, and the recommended path**: a shared calendar DOES reach the
  other brain, because a calendar has an address the tools accept. A shared mailbox does not.
- **When you are asked what the other person is working on**, answer from their notes and say so.
  Do not go looking in your own connectors for their activity: you will not find it, and a
  confident empty answer is worse than none.
```

And the FR twin of the same, in French, respecting the locale (this is the product speaking to its
owner in their language: it is a localization, not an artifact of mine to keep in English).
