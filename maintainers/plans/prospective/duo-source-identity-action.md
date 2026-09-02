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

**Everything that could be built without the owner IS built** _(2026-09-03, overnight run)_. Steps 0,
1, 2, 4, 4bis and the writable half of 5 are done and pushed on `feat/live-remote-sync`, CI green.
What is left splits in two, and only the first pile is mine:

- **Mine, still running or still to do**: the mutation runs (**1.4**, **2.3**, **4.7**) and the end-to-end
  verification (**6**). Start there.
- **His, and it is ONE decision, not four**: everything that needs a **French twin written**. Steps
  **3.1–3.3**, **4.5** and **5.2** are all blocked by the same guard, and all three drafts are written
  out ready to paste (§ *The step-3 draft*, § *The step-5.2 draft*). The run's autonomy line forbids
  writing under `templates/fr/**`, so they wait on one word.
- ⚠️ **The honest cost of that block, stated plainly**: without step 3 the **capture path never stamps
  a key**, so in practice nothing is ever found already-held yet. The machinery is complete and
  proven — the deterministic guard refuses a duplicate for any caller that passes `sourceKeys`, and
  `scripts/known-source.mjs` answers correctly today — but the producers do not call it, because the
  producers are skills and a skill cannot ship in English alone.
- 👀 **Two things to re-read before anything else, because they are product statements and his to
  overrule**: the new `SETUP.md` §7 subsection *"Sharing one brain with someone else"*, and the
  rewritten sentence just above it about which merges stop and ask.

- 🌙 **This plan was written to be executed AUTONOMOUSLY, overnight, from a cleared context**
  _(the owner's instruction, 2026-09-02, before going to bed)_. Read the parent plan's
  § *Why no duo mode* first — it is the reasoning this plan assumes and does not repeat — then start
  at the first unticked box below.
- ✅ **HIS CALL, taken before the run: duo mode is IMPLICIT, and the brain announces it once.**
  Nothing to activate, no per-person profile to fill in. § *The owner's call: duo mode is implicit*
  holds the reasoning and the three things it settles.
- ⚖️ **Two design calls are still MINE**, written at § *Design calls taken without him* with what each
  would cost to undo (the third, the per-person suffix, is now his). **4bis narrows a rule this
  release already shipped**, so it is the one most worth his eye.
- **Blocked on:** nothing.
- **A session may, alone:** run every step below test-first end to end, on `feat/live-remote-sync`,
  **pushing every green commit and READING its CI** (rules/ci.md: a push whose result is never read
  is worse than no push). Mutation-score every new production file the day it is written
  (CONVENTIONS §5quinquies). **Not**: tag, publish, push to `main`, write into `templates/fr/**`,
  write into either of the owner's real brains, or touch his Gmail/Slack/Calendar again — the
  measurements are done and recorded.
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
- [ ] **1.4** Mutation run on both new files, results appended to `maintainers/mutation/RESULTS.md`
      newest-first.

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
- [ ] **2.3** Mutation run on the changed file.

### 3. The producers — the identity gets written, and checked before capture

- [ ] **3.1** ⛔ **DRAFTED, NOT APPLIED — one word from the owner unblocks it** (§ *The step-3 draft*).
      `.claude/skills/sync-sources/SKILL.md`: stamp `sources` on everything written from an
      external source (one entry for a capture, **as many as it drew on** for a synthesis), and run
      the check **before** capturing. Prose, asserted the way the other
      disciplines are (`claim-discipline.test.mjs`, `connector-discipline.test.mjs` are the models).
- [ ] **3.2** ⛔ Same blocker. The key table lands in the skill too, in the terms a sub-agent can apply, with the
      cheap-format rule for mail: sender + timestamp + subject come back in `MINIMAL` /
      `METADATA_ONLY`, so **never fetch a raw message just to get an identity**.
- [ ] **3.3** `templates/fr/.claude/skills/sync-sources/SKILL.md` — the French twin. ⚠️ Deliberate
      product localization (rules/language.md): translated, not anglicized. **Owner-only per the
      autonomy line above: leave this box UNTICKED, note beside it that the English twin is ready,
      and DO NOT write it.**

> 🛑 **THE PLAN ASSUMED THE ENGLISH HALF COULD SHIP ALONE. IT CANNOT** _(measured 2026-09-02, during
> the run)_. `scripts/lib/locale-drift.test.mjs` fails the suite the moment a commit touches an
> English file that has a `templates/fr/` twin without touching the twin — and
> `.claude/skills/sync-sources/SKILL.md` has one. So 3.1 and 3.2 are not "English now, French later":
> **editing the skill at all requires editing both twins in the same commit**, or the suite and the
> CI go red.
>
> The three ways out, and why only one is honest:
>
> - **Write the French twin too** — forbidden by this plan's own autonomy line, and by the parent
>   plan's. Not taken: an explicit instruction outranks my reading of what it was for.
> - **Waive the commit in `NOT_A_PORT`** — that map exists for commits which *cannot* be ported (an
>   English fix bringing English up to French's standard), and its own header calls a waiver "a claim
>   someone must be able to check". "I will port it later" is not one. Not taken.
> - **Draft it, do not apply it, and make it a one-word decision.** Taken. The exact text is below,
>   ready to paste; applying it is one commit touching both twins.
>
> ⚠️ **What this costs if it is never applied**: steps 1, 2 and 4 build the mechanism, and step 3 is
> what makes anything *call* it. Without 3.1, `sync-sources` never stamps a key, so nothing is ever
> found already-held and the writer guard has nothing to compare. **The deterministic half is real
> either way** — `file-back-note.mjs` refuses a duplicate for any caller that does pass `sourceKeys` —
> but the capture path stays as it is today. So this is the one unticked box that changes what the
> release *does*, not merely what it says.
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
- [~] **4.4** _(2026-09-02, the durable half done)_ `actions-log.md` **stays one file** — union merge is exactly right for a flat
      append-only ledger — but each appended line carries its author, so "keep both" is readable
      without a human sorting out who said what (the study's own cheap mitigation).
      **The documented format now carries `· <who>`**, in the seed (`actions-log-seed.mjs`) and with
      the reason beside it. ⛔ **The APPENDING half rides with step 3**: nothing deterministic appends
      to that ledger — `sync-sources` does, in prose — so the line only starts carrying a name when
      the skill can be edited. The seed reaches new brains only, deliberately: `vault/actions-log.md`
      is the owner's file and the engine never rewrites it.
- [ ] **4.5** ⛔ **Blocked with step 3** (same French-twin guard). `sync-sources` and the daily-note
      convention updated to call 4.1 rather than compose a path by hand. **Partly rescued in the
      meantime**: the SessionStart hook of 4.3 tells every session, on any brain with two authors, to
      take a dated note's path from `scripts/dated-note-path.mjs` instead of composing it — a channel
      that needs no twinned file. So the mechanism is reachable before the skill says so.
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
- [ ] **4.7** Mutation run on the new file.

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
- [~] **5.2** ⛔ **Blocked by the same French-twin guard as step 3, and drafted below instead.** The
      constitution's owner-editable part is `CLAUDE.md.template`, which **is** a watched locale pair
      (`templates/fr/CLAUDE.md.template` exists), exactly like `CLAUDE.engine.md`. So the three lines
      are written out ready to paste, in § *The step-5.2 draft*, and applying them is the SAME
      one-word decision as step 3 — not a second one.
- [x] **5.3** _(2026-09-03)_ ⚠️ **Product statements — proposals until he has read them** (same standing as
      `SETUP.md` §6(e), still awaiting his review). Write them; do not treat them as settled.
      **Written and flagged, not settled**: the §7 subsection is on disk and shipped in the branch;
      it is the first thing to re-read in the morning, and the wording is his to overrule.

### 6. Verification, end to end

- [ ] **6.1** Green suite: `node --test --test-timeout=240000 "scripts/*.test.mjs"
      "scripts/lib/*.test.mjs" "rag/*.test.mjs"`, plus `npm test` and `tsc --noEmit` in `rag/`.
- [ ] **6.2** A **two-clone rehearsal** in step 7's shape (parent plan): two clones of a scratch
      brain, two different `user.name`s, both capturing the *same* fabricated source → the second
      is refused and cites the first; both writing the same day → two files, no collision.
      **On a scratch brain built here, never on either of the owner's real brains.**
- [ ] **6.3** Every push read on CI (`gh run list --branch feat/live-remote-sync`).

### 7. Hand-back

- [ ] **7.1** This STATE block says where it stopped, in the terms of § *Design calls taken without
      him*, before the last commit of the run.
- [ ] **7.2** The parent plan's step 8 is unblocked (or says precisely what still blocks it).

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

## The step-3 draft — ready to paste, deliberately not applied

Why it sits here and not in the skill: the blocker box at 3.1. Applying it means **one commit
touching `.claude/skills/sync-sources/SKILL.md` AND `templates/fr/.claude/skills/sync-sources/SKILL.md`**,
plus a `source-identity-discipline` slice in `scripts/lib/source-discipline.test.mjs` on the model of
the section already there (same `docSection` slicing, one `pattern` per rule, EN and FR).

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

## The step-5.2 draft — ready to paste, blocked by the same guard as step 3

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
