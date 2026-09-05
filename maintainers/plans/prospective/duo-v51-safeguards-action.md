<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- THE canonical plan for what is still OPEN on v5.1.0. Opened 2026-09-05,  -->
<!-- deliberately SMALL: the two plans that carried this release to here are  -->
<!-- ~2100 lines between them, all of it closed, and re-opening them at every -->
<!-- resume spends context on history. This file owns the live state; they    -->
<!-- keep the reasoning. Branch: `feat/live-remote-sync`.                     -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Action plan — what a duo owes the person whose brain it is, then the release is cut

Opened at the owner's suggestion, 2026-09-05: *"est-ce que ça ne vaudrait pas le coup d'archiver le
plan de tout ce que tu as déjà fait, et de partir sur un nouveau mini-plan ?"* Yes, and this is it.

## 📍 STATE — the only perishable block in this file · opened 2026-09-05

- ✅ **9.0 THROUGH 9.4 ARE DONE, GREEN AND PUSHED, CI READ AND GREEN ON EVERY COMMIT** _(2026-09-05)_
  — the whole suite (3157 tests) and the duo rehearsal (16/16) pass on each. **ONLY 9.5 REMAINS.**
- ✅ **9.5 BATCH A HAS RUN** _(2026-09-05 10:52, 61 min, log
  `reports/mutate-one-author-identities+1.log`)_: **92.83 %**, 414 killed, **32 survived**, 0 timeout.
  Per file: `author-identities.mjs` **95.28 %** (10 survivors), `brain-author.mjs` **90.60 %** (22).
  Step 8.8 had left these two at 98.66 % and 98.90 %, so **the drop is step 9's own new code**, which
  is what a hunk-scoped reading would have said too.
- ✅ **BATCH A'S SURVIVORS ARE ANSWERED IN TESTS, GREEN** _(2026-09-05, 8 new tests, whole suite
  3165 pass / 0 fail / 3 pre-existing skips)_. **The final split, after reading each mutant against
  the code, is 22 killable and 10 equivalent** — not the 25/7 of the first skim: the three optional
  chainings inside `brain-author`'s `spellingsOf` (255:16, 255:47, 255:73) are unreachable, because
  `unendorsedFusions` only ever returns entries whose `aka` is a non-empty array, and `194:47` is
  unreachable for the same reason at both its call sites. **They are equivalents, and the honest
  simplification is to DELETE those guards** — not done here, deliberately: it changes production on a
  held release for three mutants. Left as a named candidate for the next pass.
- ▶️ **RESUME HERE: the confirming re-run of batch A IS RUNNING** _(2026-09-05, launched **11:01**, on
  `b06991d`, ~61 min → **verdict expected ~12:02**; the "~11:35" written here first was the writing
  time, not the launch, and reading it as a launch makes a healthy run look overdue by half an hour —
  **check `ps` before concluding a run died**)_. **Its verdict is a FILE this time, not a lost terminal**:
  `maintainers/mutation/reports/v510-95-batch-a2.stdout.log` holds the runner's own ✅/❌ line and the
  per-file scores; the raw Stryker output is `reports/mutate-one-author-identities+1.log` beside it.
  Read the stdout file first. **If it is absent or truncated, the run did not finish** — re-run
  `node maintainers/mutation/mutate-one.mjs scripts/lib/author-identities.mjs
  scripts/lib/brain-author.mjs`, and give it the machine to itself.
  **Expect 10 survivors, all of them the named equivalents below.** Anything else is a mutant the new
  tests did not reach: read it, do not wave it through.
- 📖 **What the 22 killable ones were, kept because the re-run must be checked against it.** Ten are
  equivalents of the class 8.8 named (an `[]` fallback filled with `["Stryker was here"]`, whose one
  element every consumer skips: `author-identities` 52:89, 194:47, 228:76, 262:57; `brain-author`
  70:56, 172:43, 231:56, 255:16, 255:47, 255:73). The other 22 needed **no production change at all**,
  only tests. Two families:
  - **The words of the two new messages are not pinned** (7 mutants: `brain-author` 239:62, 241 ×4,
    245 ×2, 249:5). Emptying a whole sentence of `fusionElsewhereQuestion`, or dropping the `" = "`
    that makes *"Claire Dubois = Thomas Pierrain"* readable, changes nothing any test can see. **This
    is the exact defect 8.8 fixed for the other messages** and step 9 re-introduced with its own new
    sentences: pin them word for word, and assert the `+N` overflow at its boundary.
  - **The damaged / absent input is never fed** (18 mutants: every `entry?.` → `entry.`, the
    `slug === null` guard, `.some` → `.every`, `mine !== null`, the `spellingsOf` filter,
    `theirSpelling`'s `find`). Concretely missing: a registry entry that is `null`; an entry whose
    `aka` holds a number or punctuation-only string; **two** endorsers where one is me (`.some` vs
    `.every` only diverge at ≥2); `markDistinct` called without `me` (its documented one-directional
    fallback is promised in a comment and asserted nowhere); and a fusion whose **canonical name is
    mine**, where the command must name the OTHER spelling.
- ▶️ Then, **one run at a time** (two at once starve each other and return a meaningless score):
  `scripts/session-authors.mjs scripts/author-identity.mjs`, then the
  ranges 9.4 changed in `scripts/lib/filed-note.mjs` (216) and `scripts/file-back-note.mjs` (102, 142).
  Findings into `maintainers/mutation/RESULTS.md`, newest-first; the figures then join the release
  note's *Quality* paragraph and #86's body, as 8.8's did.
- 📎 **This batch is evidence for the OTHER plan** —
  [`harness-speed-and-test-quality-action.md`](harness-speed-and-test-quality-action.md) § S2: a first
  pass at 92.83 % whose 25 killable survivors are, without exception, the shapes catalogued since
  2026-07-15 (the absent twin, the collection under 2 elements, the boundary, the constant asserted
  against itself). Recorded there rather than re-derived.
- ▶️ **THE WORK IS STEP 9 BELOW, four items, all in v5.1 on his explicit call** _(2026-09-05)_. They
  answer the question he put after reading the duo surface: **what guarantees the person asked is the
  one whose brain it is**, and that the newcomer is not the one answering *"yes, that's fine"*?
- 🛑 **THE RELEASE IS HELD until those four land** — his call, the second hold on this release. Then
  § *Cutting the release* below, which is **his and only his**.
- ✅ **EVERYTHING ELSE ON THIS RELEASE IS DONE, GREEN AND PUSHED**, CI read on each commit: the live
  sync between machines (#84), duo mode itself, the question that replaced the assertion, the
  mutation measurements (**98.92 %** on the three files step 8 wrote, **95.45 %** on what it changed
  elsewhere), the release note, the PR body, and the doc corrections of 2026-09-05.
- **Blocked on:** nothing.
- **A session may, alone**: run step 9 test-first on `feat/live-remote-sync`, **pushing every green
  commit and READING its CI** (rules/ci.md). Mutation-score every new production file the day it is
  written (CONVENTIONS §5quinquies). **Writing a French twin is part of editing an English file that
  has one** — never one without the other, in the same commit. **Not**: tag, publish, push to `main`,
  merge #86, or write into either of the owner's real brains.
- 🔁 **The save point moves** on a long autonomous stretch (rules/plans.md): write each decision into
  this file as it lands and commit it, rather than banking it for a hand-back hours away.

## Tracking

### 9. What a duo owes the person whose brain it is _(2026-09-05, his ask)_

**The answer to his question, and it is mostly already true**: the consent is the **collaborator
invite on the private repository**, which lives in the owner's authenticated account and cannot be
self-granted. Nothing typed inside a brain grants access, and the registry answers decide **how notes
are filed**, never **who may write**. Verified in the code, not recalled: `distinct` is a list of
NAMES, so the newcomer answering about the owner's name does **not** silence the owner's own question
about theirs (`unplacedAuthors` filters per name, by slug).

**One hole is real, and 9.1 closes it.** `fuseAuthors` is convergent **on purpose** (answering on
either machine settles it), so a wrong *"it's the same person"* recorded on the newcomer's machine
resolves both names to one canonical → `everyone()` counts one person → the owner's machine emits
**nothing at all**: no question, no reminder, no arrival banner. It grants nothing; it **hides the
arrival**, which is precisely the scenario he described.

**What is deliberately NOT built, written here so it is not re-argued**: a notion of *"the owner"*
that only accepts their answers. The name is a line of git config, and anyone who can push can
already change it, rewrite any note, and hand-edit `authors.json`. **No in-brain mechanism defends
against someone who already has push access** — the invite list is the fence, and signed commits or
branch protection are the git host's job, not this brain's.

- [x] **9.0** _(2026-09-05, his ask on reading the paragraph above: "je rajoute une ADR qui dit ça")_
      [`../../decisions/0042-access-belongs-to-the-git-host-the-brain-only-files.md`](../../decisions/0042-access-belongs-to-the-git-host-the-brain-only-files.md)
      — access is the host's, the brain only files; ending a duo is removing the collaborator; and the
      three gates we will **not** build, each with why it would protect nobody. Listed in
      `maintainers/README.md` (where **0041 was missing too**, and is now listed beside it).
- [x] **9.1** _(A, 2026-09-05, green + rehearsal 16/16)_ **A fusion recorded elsewhere is announced here, until this keyboard has endorsed
      it.** Registry entries gain a `by:` list of the people who recorded or endorsed the fusion;
      `--same-person` appends the local person. The session hook says, once per machine that has not
      endorsed: *"on another machine, X and Y were declared to be the same person. If that is right,
      confirm; if not, split them"*, with both commands. Endorsing is answering the ordinary way, so
      **no per-machine marker is invented** — the memory stays the answer itself, and it travels.
      ⚠️ **An entry with no recorder is treated as endorsed**: a brain that fused names before this
      shipped must not start nagging about its own past.
      **What the build actually found, and it is the half that mattered** — the notice offers
      `--different "<them>"` to disagree, and **that command did nothing** in this direction: a fusion
      recorded on the other machine is filed under THEIR name with mine as the alias, and `markDistinct`
      deliberately left alone the entry a name is the canonical of. So the correction changed nothing and
      the notice would have repeated forever. `markDistinct` now takes **who is disagreeing** and lifts
      them out of the other person's entry. **Grandfathering means never touching it**: re-answering a
      fusion that records nobody stays a no-op, or every such brain would write and commit a file nobody
      asked about. The field is `confirmedBy`, the notice names **both halves** (`Claire Dubois = Thomas
      Pierrain`), and it is compared by **raw** name so the fusion under review cannot vouch for itself.
- [x] **9.2** _(B, 2026-09-05)_ **`duoConfirmedNotice` names where the access came from, and how to take it
      back.** Today it explains what changes in the filing; it must also say, in the person's
      language, that the other person can write here **because they were added to the repository**,
      and that removing them there is what ends it. An alert, not a permission — and it reaches the
      owner by construction, `distinct` being per name. _(Shipped in the same commit as 9.1: one
      sentence, after what changes — "they can write here because they were added to this brain's
      repository, and removing them there is what ends it — this brain grants no access of its own".)_
- [x] **9.3** _(2026-09-05)_ **A page of its own for duo mode** _(his call: "je pense que c'est une page dédiée au
      mode duo")_, in English, in the repo: the steps for both people, the Q&A, the perimeter, the
      mail detail in full (delegation asks for no password, what it does and does not reach, the two
      arrangements that work), and the security section above. `SETUP.md` §7 keeps a short summary
      and points at it rather than growing a manual inside a setup guide. The French one-pager he is
      sending privately is the draft it is translated from; it stays out of the repo.
- [x] **9.4** _(2026-09-05)_ **Attribution metadata laid NOW, audit built later** _(his call: "setup les infos, les
      métadonnées … avant que les gens commencent")_. Today `author:` is stamped only when the writer
      follows what `dated-note-path.mjs` prints, and **no skill or constitution line asks for it
      anywhere else**, so a future audit would be archaeology in git history. So: every note this
      brain writes carries `author:` in its frontmatter, said in the constitution and in the skills
      that write notes (**both locales, same commit**). **The RAW local name is stamped, never the
      canonical one**: a fusion is an opinion that can be wrong and is reversible, while a stamped
      name is a fact about who typed — resolution belongs at read time, where it already lives
      (`canonicalAuthor`). **Forward-only**, no backfill: git history answers for the past, and
      rewriting every existing note would be a large diff for a small gain _(his to overrule)_. The
      audit / export-by-person use case is **explicitly not built**, and the page from 9.3 says so.
      **What landed**: `renderFiledNote` stamps `author:` (absent when the machine has no git name —
      ABSENT means unknown, never "nobody"), `file-back-note.mjs` reads it from git rather than
      accepting it from the caller (a note's author is a fact about the machine, not something a model
      is told), and the constitution + the briefing frontmatter say it in **both locales**. The
      fingerprint table was regenerated for the four doc files, which is what the release gate asks.

- [ ] **9.5** **Measure what step 9 changed** (CONVENTIONS §5quinquies), once 9.3 and 9.4 have landed,
      the way 8.8 did it: the changed ranges of `author-identities.mjs`, `brain-author.mjs`,
      `session-authors.mjs` and `author-identity.mjs`, **one run at a time** (two at once starved each
      other and returned a meaningless score), findings into `maintainers/mutation/RESULTS.md`.

### Cutting the release — the owner's, and only his

- [ ] **R.1** Merge [#86](https://github.com/tpierrain/kenjaku/pull/86), titled **"v5.1.0 — The One
      with the Duo Mode"**.
- [ ] **R.2** Tag `v5.1.0` **on `main`**, `git push --tags`, publish the release with the body of
      [`release-v5.1.0-note.md`](release-v5.1.0-note.md).
- [ ] **R.3** Tracker sweep: close [#84](https://github.com/tpierrain/kenjaku/issues/84) when a real
      brain has received the feature.
- [ ] **R.4** **Then, and only then, archive the two big plans** —
      [`live-remote-sync-action.md`](live-remote-sync-action.md) and
      [`duo-source-identity-action.md`](duo-source-identity-action.md) — into `../archived/` with
      today's date, and this file with them. **Not before**: #86's body links the first by path and
      ADR 0041 links the second, and both links must stay alive while the PR is open.
      📌 **Read [`harness-speed-and-test-quality-action.md`](harness-speed-and-test-quality-action.md)
      § S3 before doing this** _(2026-09-05, the owner's ask on how we work)_: it turns this one-off
      archiving into a standing hygiene, and its **S3.3 is exactly the broken-link problem** the
      sentence above describes. Doing both here costs almost nothing extra.

### Also outstanding, and neither gates the tag

- [ ] **X.1** Two measurements only the owner's own machines can make: whether `git` can authenticate
      without stopping for a passphrase, and how many `vault-rag` servers live when several
      conversations are open on one brain.
- [ ] **X.2** A broken link to settle after the release: `live-remote-sync-action.md`'s header points
      at `../../studies/two-humans-one-brain-study.md`, which lives only on the unmerged branch
      `docs/study-two-humans-one-brain`. Merge that branch, or repoint the link.

## Where the reasoning lives — open these only when you need the WHY

Both are closed and hold no live state. They are long on purpose: they are the record.

- [`live-remote-sync-action.md`](live-remote-sync-action.md) — the live sync between machines (#84):
  the merge rule, the tick, the gate, the announcement, the risks, the field rehearsal, and why duo
  mode needed it.
- [`duo-source-identity-action.md`](duo-source-identity-action.md) — duo mode itself: source
  identity (ADR 0041), per-person dated notes, the narrowed merge rule, the owner's call that duo
  mode is implicit, and step 8's *a brain may file on a guess, it may not assert one*.
