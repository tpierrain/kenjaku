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

**Nothing is built yet. Step 0 is the ADR, and it is the first thing to do.** The analysis is done
and measured (parent plan); what is missing is code.

- 🌙 **This plan was written to be executed AUTONOMOUSLY, overnight, from a cleared context**
  _(the owner's instruction, 2026-09-02, before going to bed)_. Read the parent plan's
  § *Why no duo mode* first — it is the reasoning this plan assumes and does not repeat — then start
  at the first unticked box below.
- ⚖️ **Two design calls are MINE, taken to keep moving, and both are cheap to reverse.** They are
  written at § *Design calls taken without him* with what each would cost to undo. He reviews them
  when he wakes; neither blocks the work.
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

- [ ] **0.1** `maintainers/decisions/0041-a-captured-source-carries-its-identity.md`, with the
      `Scope:` field (§6), the Crux block first (§6quater), and the prior art named (§6quinquies:
      this is content-addressing applied to captures; the Notion mirror already does it).
- [ ] **0.2** The ADR carries **the key table** — reproduced from the parent plan's measurement, one
      row per source type, and the rule that **an absent key means UNKNOWN, never "already seen"**.
- [ ] **0.3** It states the **two fields and their two jobs**: `source_key` (normalized, machine,
      the dedup key) and `source_url` (human, clickable, what the citation renderer already reads —
      `rag/src/lib/citation-renderer.ts`). A note may carry one, both, or neither.
- [ ] **0.4** It states the **failing direction**: the check may only ever SAY "already held" and
      leave the skip visible. A silent skip trades a duplicate for a loss, and a loss cannot be
      noticed from inside the vault.

### 1. The lookup — "do I already hold this source?", deterministically

- [ ] **1.1** `scripts/lib/source-key.mjs`: the pure, I/O-free core (ADR 0009 rung 1) — normalize a
      raw source descriptor into a `source_key`, one function per source type, plus the mail
      composite (sender + ISO timestamp + subject, each normalized). Tests first.
- [ ] **1.2** `scripts/known-source.mjs`: the entry point. Reads a key on argv, **scans the vault's
      note frontmatter** (never the index — a note that arrived by git seconds ago is not indexed
      yet, and an index-backed check would answer "never seen" precisely in the duo case it exists
      for), prints one line, **exits non-zero on a hit**. Same shape as the check the skill already
      calls for Slack (`set-universe-profile.mjs --check-slack`): pre-authorized, greppable.
- [ ] **1.3** Tested **as a process** (rules/testing.md entry-point seam rule), not only through its
      imported functions.
- [ ] **1.4** Mutation run on both new files, results appended to `maintainers/mutation/RESULTS.md`
      newest-first.

### 2. The writer guard — the deterministic path cannot write a known duplicate

- [ ] **2.1** `scripts/file-back-note.mjs` refuses a spec whose `source_key` the vault already
      holds, reusing the homonym-refusal shape it already carries (exit 1, name the note that
      already holds it). Test first, including the "no key at all" case, which must pass.
- [ ] **2.2** The refusal message names the existing note's path, so the caller can cite it rather
      than re-capture it.
- [ ] **2.3** Mutation run on the changed file.

### 3. The producers — the identity gets written, and checked before capture

- [ ] **3.1** `.claude/skills/sync-sources/SKILL.md`: stamp `source_key` on everything captured from
      an external source, and run the check **before** capturing. Prose, asserted the way the other
      disciplines are (`claim-discipline.test.mjs`, `connector-discipline.test.mjs` are the models).
- [ ] **3.2** The key table lands in the skill too, in the terms a sub-agent can apply, with the
      cheap-format rule for mail: sender + timestamp + subject come back in `MINIMAL` /
      `METADATA_ONLY`, so **never fetch a raw message just to get an identity**.
- [ ] **3.3** `templates/fr/.claude/skills/sync-sources/SKILL.md` — the French twin. ⚠️ Deliberate
      product localization (rules/language.md): translated, not anglicized. **Owner-only per the
      autonomy line above → leave a ticked-off note here and DO NOT write it.**
- [ ] **3.4** The linter accepts `source_key` (`scripts/lib/wiki-lint.mjs`), and the frontmatter
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

## Design calls taken without him

Both taken to keep the overnight run moving, both cheap to reverse, both his to confirm.

1. **The per-person suffix appears only on collision, not always.** The alternative considered was
   suffixing every dated note in any brain that has a remote — the criterion the live sync already
   uses to decide a brain "lives in more than one place" (decision 9.8). Rejected because a great
   many solo owners wire a remote purely for **backup**, and they would get uglier file names for
   nothing. The chosen rule degrades to today's behaviour in the only racy case (both authors
   creating the day's first note at the same instant on two machines → union merge, exactly as
   now). **Cost to reverse:** the rule lives in one pure function (4.1); changing it is changing
   that function and its tests.
2. **`actions-log.md` stays a single shared file.** Union merge is the right resolution for a flat
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
