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

**Step 0 is DONE — ADR 0041 is written** _(2026-09-02)_. The next thing is **step 1, the lookup**:
`scripts/lib/source-key.mjs` (pure) then `scripts/known-source.mjs` (the entry, tested as a process).
The analysis was already done and measured (parent plan); what is missing is code.

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

- [ ] **3.1** `.claude/skills/sync-sources/SKILL.md`: stamp `sources` on everything written from an
      external source (one entry for a capture, **as many as it drew on** for a synthesis), and run
      the check **before** capturing. Prose, asserted the way the other
      disciplines are (`claim-discipline.test.mjs`, `connector-discipline.test.mjs` are the models).
- [ ] **3.2** The key table lands in the skill too, in the terms a sub-agent can apply, with the
      cheap-format rule for mail: sender + timestamp + subject come back in `MINIMAL` /
      `METADATA_ONLY`, so **never fetch a raw message just to get an identity**.
- [ ] **3.3** `templates/fr/.claude/skills/sync-sources/SKILL.md` — the French twin. ⚠️ Deliberate
      product localization (rules/language.md): translated, not anglicized. **Owner-only per the
      autonomy line above: leave this box UNTICKED, note beside it that the English twin is ready,
      and DO NOT write it.**
- [ ] **3.4** The linter accepts `sources` (`scripts/lib/wiki-lint.mjs`), and the frontmatter
      parser exposes it (`rag/src/lib/frontmatter-parser.ts`) the way `sourceUrl` already is.

### 4. Per-person paths — two syntheses of one day stop colliding

- [ ] **4.1** `scripts/lib/dated-note-path.mjs`: pure core. Given the date, the author and what the
      vault already holds, answer where today's `briefings/` or `daily/` note goes. **Rule:** the
      base name (`daily/2026-09-02.md`) belongs to whoever writes first; a *different* author
      writing the same day gets `daily/2026-09-02-<author-slug>.md`. A solo brain therefore **never
      sees a suffix** — see § *Design calls taken without him*.
- [ ] **4.2** The author identity comes from `git config --get user.name`, already read by
      `scripts/lib/remote-sync.mjs:153` — reuse it, do not re-invent a second notion of "who".
- [ ] **4.3** The identity reaches the session through `additionalContext` at SessionStart, the
      proven channel (`scripts/session-universe.mjs` is the model). One line, silent when the brain
      has one author.
- [ ] **4.3bis** **The announcement that pays for the implicitness** (§ *The owner's call*): the
      **first** time a second author is seen writing in this brain, the brain says so **once**, in
      plain words, and offers (without requiring) to describe who is who. Never repeated: the "said
      it" marker lives beside the other per-machine markers under `.cache/`, so a brain that already
      knows stays silent forever. **Authors are read from git history, not from a list somebody
      maintains** — no new record of who people are, and nothing to keep in step.
- [ ] **4.3ter** The offer points at the surface that already exists for describing people (the
      universe profile, ADR 0035), and **nothing in steps 1 to 4 may depend on that description**:
      declining it must change no behaviour whatsoever.
- [ ] **4.4** `actions-log.md` **stays one file** — union merge is exactly right for a flat
      append-only ledger — but each appended line carries its author, so "keep both" is readable
      without a human sorting out who said what (the study's own cheap mitigation).
- [ ] **4.5** `sync-sources` and the daily-note convention updated to call 4.1 rather than compose a
      path by hand.
- [ ] **4.6** Compatibility: **old unsuffixed notes keep working** — type detection by prefix
      (`TYPE_BY_PREFIX`), the linter's zone lists and the consolidation capture zones all match on
      the folder, not the file name, so a suffix changes nothing for them. **Assert that**, do not
      assume it: the universe blind spot in those very lists has its own hardening plan.
- [ ] **4.7** Mutation run on the new file.

### 4bis. Narrow the automatic merge to the zones that can actually take it

The owner challenged the merge rule itself on 2026-09-02, and he is right: `merge=union` is
currently scoped to **`vault/**/*.md`**, i.e. to every note including the curated ones, and union is
**not a merge — it is a concatenation**. It keeps both sides' lines with no marker and no question.
That is the correct resolution for a ledger nobody rewrites, and the wrong one for a page two people
edit. The repo already owns the vocabulary for that split: `RAW_CAPTURE_ZONES` in
`scripts/lib/wiki-lint.mjs` versus the curated entity types beside it.

- [ ] **4bis.1** `.gitattributes`: `merge=union` **only** on the append-only zones (`daily/`,
      `raw-sources/`, `inbox/`, `_inbox/`, `actions-log.md`), and **the default conflict behaviour
      restored everywhere else** in the vault — `people/`, `topics/`, `decisions/`, `meetings/` and
      the rest. Patterns must match **inside a universe too** (`acme/daily/…`), the blind spot those
      very zone lists already have a hardening plan for.
- [ ] **4bis.2** The zone list exists in **one** place, not two: `.gitattributes` and
      `wiki-lint.mjs` must be asserted to agree rather than trusted to, the way the `.gitignore`
      migration and `reconcile-brain.mjs` already are (CONVENTIONS §5quater — a third hand-written
      copy of a rule is the drift that convention warns about).
- [ ] **4bis.3** Non-regression on #84's own promise: two appends to one **daily** note still merge
      with no human (`scripts/lib/notes-union-merge.test.mjs` is the existing proof — extend it, do
      not weaken it), and two edits to one **person card** now produce a real conflict.
- [ ] **4bis.4** A conflict on a curated page is **not a failure**: the machinery already exists and
      is built (parent plan, step 4) — `rebase --abort`, the files named in the trace, and the brain
      guides the merge at the next message. Assert that a curated-page conflict reaches that path.
- [ ] **4bis.5** The frontmatter corruption this removes is worth recording in the ADR: two edits to
      one `updated:` line under union produce **two `updated:` keys** and a note the indexer
      refuses. Today that is caught after the fact (the tick re-checks the header and undoes the
      rebase); narrowing the rule means curated notes never reach that state at all.

### 5. The doctrine — what duo mode does and does NOT cover

Not a division of duties: the owner struck that out (parent plan, § *The owner's design call*).
This is the honest statement of the perimeter.

- [ ] **5.1** `SETUP.md` §7: a subsection saying plainly that two people on one brain each keep
      their own notes; that **Gmail delegation lets the person read the mailbox but never their
      brain** (structural — no Gmail tool takes a mailbox argument); that **sharing a calendar DOES
      reach the other brain** (it takes a calendar address) and is the recommended path there; that
      a **direct message** to one person is invisible to the other; and that Slack membership is
      **per workspace**.
- [ ] **5.2** The same, three lines, in the constitution template's owner-editable part.
- [ ] **5.3** ⚠️ **Product statements — proposals until he has read them** (same standing as
      `SETUP.md` §6(e), still awaiting his review). Write them; do not treat them as settled.

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
