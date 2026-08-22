<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- STATUS: the STATE block below is this file's only perishable content —   -->
<!-- do not restate it in a comment, a header or another file. This file OWNS -->
<!-- the study, its evidence, the convention it produced, and the state of    -->
<!-- APPLYING that convention. It holds no other chantier's state.            -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Study — plans that need no guard: making duplicated state structurally impossible

## 📍 STATE — the only perishable block in this file · moved 2026-08-22

- **Next:** **nothing a session can take. § *Application* is discharged, steps 1-9.** The convention
  is adopted and applied everywhere it was meant to reach: the door, the memory pointer, the harness,
  all five live plans, the ROADMAP's Status column, and both repo-level carriers of the archiving
  ritual. Step 10 (pruning the archived corpus) is **out of scope and stays out**.
- **Blocked on:** nothing.
- **Owner's call pending:** **two, neither blocking.** (1) **The lint** — his *"on diffère le lint"*
  came from an autocompletion accepted before knowing what a lint was; asked again in plain terms,
  still unanswered. Recommendation: **split it** (cheap half now, hard half after the v5.0.0 tag). →
  § *The lint, reopened*. (2) **The branch `chore/plan-discipline-points-at-the-harness`** (pushed, no
  PR), which is what deletes this repo's two stale copies of the plan-discipline doc. They still teach
  the superseded ritual. → § *Findings*, first entry.
- **A session may, alone:** apply the convention to any plan that still lacks it (a dormant plan
  waking up, a new one). **It may NOT delete the hook, the `delegates-only` door or the certificate**
  — those three retire only when the lint replaces them — and it may **not** build the lint: that is
  the pending call above.

> 🧪 **This block is the convention's own first instance.** If it ever needs a sixth key or a
> thirtieth line, that is evidence against § *The proposal*, and it belongs in § *Application*'s
> findings rather than in a wider block.

## The brief (durable — this is why the study was asked for)

**Thomas's ask, in his words**: *"est-ce qu'on ne manque pas d'une convention qui rendrait caduque
tous ces workarounds qu'on fait en permanence sur ce sujet… une solution rationnelle et efficace de
gestion des plans, de l'historique… une petite étude quoi."*

**What he was reacting to**: the accumulation of patches. Each one is defensible alone; together they
are a tell. The save-point rule, then its plural-carriers amendment, then a machine-local hook to
enforce it, then a declared door to silence the hook, then a "certificate" variant of that door.
**Five mechanisms for one problem is a design smell, not a discipline.**

**The one-sentence answer the study reached**: the leak is not the file, it is the **form** — state
and history are both written as *paragraphs*, and no mechanism can tell one paragraph from another,
which is why only detection was ever available. Give state a form of its own (a capped, fixed-key
block) and the five workarounds lose their reason to exist.

## The question

**Can duplicated state be made structurally impossible, instead of detectable after the fact?**

Every mechanism we have today is *detection*: something notices, after the copy exists, that it might
have gone stale. Nothing prevents the copy. And detection cannot judge content, so it fires on correct
files too, which is what produced the door, which is what produced the certificate.

## The evidence, already measured — do NOT re-derive

- [x] **The founding measurement (2026-08-20, Kenjaku).** One session: 8 commits, 4 of them into
      plans, and **every single one updated the plan that was open**. Meanwhile **four** repo files
      restated the same item's status (three plans plus a measurement register). Nothing was
      forgotten. **The state was COPIED**, and a copy is invisible from inside the file you have open.
- [x] **The guard over-fires on correct files (2026-08-22).** It blocked four hand-backs in one
      session over a roadmap that was right every time. That is what forced the `delegates-only` door
      into existence: a rule invented to silence a rule.
- [x] **And it under-fires too, in the same session (2026-08-22).** It named a carrier; the session
      answered "it needs nothing" from a `grep`; that was **wrong** — the file held `Nothing tagged`,
      a live status that would have gone false the day the tag landed, inside a file whose own header
      forbids reading it for status. **The guard was right and the human answer was wrong**, which is
      an argument for prevention over detection, not for a better guard.
- [x] **Plans have outgrown reading.** The archived plan is ~2 200 lines; the mode plan is ~3 000.
      **Nobody reads them; everybody greps them.** Grep cannot see a stale claim, a promise, or a
      status buried in narration. The failure above is exactly this, and it is structural: the corpus
      selected for the tool that cannot do the job.
- [x] **The known hole in the save-point rule itself** (memory `save-point-rule-sequencing-hole`): it
      fires when handing back, so it misses whatever is invented *while writing the reply*.
- [x] **Durable memory already solved a sibling problem, and its answer is a precedent**: memory holds
      **pointers and references, never state**, because a line written once outlives the step it
      describes. The plans corpus has not been given that same discipline.
- [x] **The oldest scar**: two copies of one plan, zero ticked boxes versus thirteen. Both looked
      authoritative; whichever was opened first won.

## The leading hypothesis, to be attacked rather than confirmed

A plan file mixes at least **five kinds of content with opposite lifetimes**:

| # | Kind | Lifetime | Wants to be |
|---|------|----------|-------------|
| 1 | **Current state** (done / next / blocked) | **Perishable, dies every day** | Unique, tiny, one place |
| 2 | **Decisions + rationale** ("do not re-open") | Durable | Append-only |
| 3 | **Evidence, measurements** | Durable | Append-only |
| 4 | **Narration** (how it went) | Durable | Append-only |
| 5 | **Boundaries / authorizations** (what a session may do alone) | Owner-set | Unique |

Kinds 2-4 grow without bound, forever. Kind 1 must stay unique and short. **They are in the same
file**, so the perishable thing is buried in thousands of lines of the durable thing, which is why it
gets copied outward into headers, roadmaps and registers where it can be found, which is the very
duplication the guard then hunts.

> **If that holds, the convention writes itself**: separate them by construction, and make kind 1 live
> in exactly one machine-readable place that every other surface *renders* rather than *restates*.

## What a good answer must satisfy

- [ ] **It kills copies at the source**, rather than detecting them.
- [ ] **It survives a `/clear` and a fresh session** with no memory of the conversation.
- [ ] **It travels**: machine-local hooks do not, so the convention must hold on a laptop with nothing
      installed. (The current hook is machine-local, which is why the written rule is "the belt".)
- [ ] **It is cheap at the moment of writing**, or it will not be followed under load.
- [ ] **It keeps the human able to read a plan in Typora/Obsidian and tick a box by hand** — Thomas's
      standing requirement, and the reason checkboxes exist at all.
- [ ] **It does not lose the history.** Kinds 2-4 are the expensive part of the corpus.

## Directions worth costing (none is the answer yet)

- [ ] **Split by lifetime**: a tiny `STATE.md` (or front-matter block) per chantier holding only kind
      1; the plan keeps kinds 2-5 and *links*. Cheap, no tooling. Risk: two files to open.
- [ ] **Status lives where it is already true**: git and the PR are the record (merged? tagged?
      branch alive?). Plans then never assert them. Removes a whole class of future lies, including
      today's `Nothing tagged`. Risk: offline readability.
- [ ] **Transclusion / generation**: one source, other surfaces generated. Strongest guarantee,
      heaviest tooling, and generated Markdown fights hand-ticking.
- [ ] **Front-matter as contract**: every plan declares `owns:` and `delegates:` in machine-readable
      form; the guard reads THAT instead of grepping prose. Turns the door from an exception into the
      normal mechanism.
- [ ] **Shrink the unit**: archive aggressively so no live plan exceeds what a person will actually
      read. Attacks the grep-instead-of-read root cause directly.

## 1 — What the corpus actually says (measured 2026-08-22, do not re-derive)

Method: the 90 plan files under `maintainers/plans/` (20 prospective, 70 archived, **33 654 lines**),
plus 21 days of git history on the three files that are actually in flight.

| Measurement | Number |
|---|---|
| `agent-orchestrated-release-mode-action.md` | **3 079 lines / 42 640 words**, written in 21 days (`+3 378 / -299`) |
| `v5-unfreezes-the-existing-fleet-action.md` | **2 406 lines / 32 456 words**, written in 21 days (`+3 143 / -737`) |
| Share of lines that are a checkbox | **3 %** (mode plan) · **8 %** (release plan) |
| Commits touching the mode plan in 21 days | **130** — of which **109 (84 %) moved no checkbox at all** |
| Commits touching the release plan in 21 days | **77** — of which **39 (51 %) moved no checkbox** |
| `ROADMAP.md`, which declares `delegates-only` and *"pointers, not copies"* | 316 lines holding **22 commit shas, 19 PR numbers, 23 ship/status words**, touched by **41 commits in 21 days** |
| Hand-invented `WHERE THIS RESUMES` headers | **4 files** (the largest, in the triage plan, is ~80 lines) |
| The archived plan's header comment, whose subject is that the file holds no state | **40 lines** |

### The four findings, in the order they change the answer

- [x] **F-A. The checkbox layer is not where the state is.** 84 % of the writes to the biggest live
      plan move no box. Everything that actually decides what happens next — the authorization
      boundary, the *"still owed"*, the open question, the scope call — is **prose**. So the
      machine-readable layer that every mechanism reads (the guard, the human tick, the roadmap
      sync) sees a **minority** of the state changes. The `## Tracking` convention was built on the
      assumption that ticking a box *is* saving the state; the corpus says it is a third of it at best.
- [x] **F-B. Duplication is the symptom; UNFINDABILITY is the disease.** You cannot find state in
      42 640 words, so a resume header was invented to hold a copy of it at the top. You cannot find
      it across files either, so the roadmap holds another copy in prose. **The copy is not a
      discipline failure — it is the rational fix the writer chose for a real problem.** That is why
      three years of detectors cannot win: the detector fights the remedy, not the cause.
- [x] **F-C. "Does this file hold state?" is not answerable at declaration time — the door proves
      it.** `ROADMAP.md` was granted the door on 2026-08-22; its own contract says *delete the line
      the day a row here starts carrying state of its own*. Its 22 shas, 19 PR numbers and 41 commits
      in 21 days say that day arrived before the line was written. **This is not a bad call by
      Thomas** — it is evidence that a human declaring "I hold no state" is exactly as unreliable as
      a hook guessing it, so moving the judgment from the hook to the header bought nothing.
- [x] **F-D. The lies with a delivery date are all copies of facts another system owns.**
      `Nothing tagged`, `draft PR #76`, `CI 7/7`, `merged 96d0546`: git and `gh` answer every one of
      them in a second, and each written copy is true until a date certain and false forever after.
      The 40-line apology header in the archived plan exists solely because two such copies were
      written into a file whose own first line forbids reading it for status.

### The hypothesis: confirmed, but its centre of gravity moves

The five-kinds table stands. What the measurement changes is **why** the mix is fatal. It is not
volume (kind 1 drowning in kinds 2-4); it is that **kind 1 is written in the SAME FORM as kinds 2-4 —
a paragraph.** A paragraph cannot be distinguished from another paragraph, by a hook, by a grep, or by
a reader in a hurry. Every mechanism we built was therefore forced to guess *which* paragraphs were
perishable, from the outside: the guard guesses from a branch name, the door lets a human guess in
advance, the certificate records that someone guessed carefully. **They are three generations of the
same guess.**

> **So the leak is the FORM, not the file.** Splitting files without changing the form just moves the
> paragraphs. Give state a form that is not prose, and the guessing problem disappears rather than
> being relocated.

## 2 — The five directions, costed

Against the six criteria of § *What a good answer must satisfy*.

| Direction | Kills copies at source | Survives a `/clear` | Travels | Cheap while writing | Hand-tickable | Keeps history | Verdict |
|---|---|---|---|---|---|---|---|
| **Split by lifetime** | ✅ if the state part has a *form*, ❌ if it is just another file of prose | ✅ fixed address | ✅ pure convention | ✅ writes less | ✅ | ✅ | **ADOPT — as a capped block, not a second file** |
| **Status lives where it is already true** (git / `gh`) | ✅ for the whole F-D class | ✅ | ✅ | ✅ | n/a | ✅ | **ADOPT as rule 2** |
| **Transclusion / generation** | ✅✅ strongest | ✅ | ❌ needs tooling on every machine | ❌ | ❌ generated Markdown fights hand-ticking | ✅ | **REJECT** — it breaks the one standing requirement |
| **Front-matter contract** (`owns:` / `delegates:`) | ❌ still detection, and F-C says declaration-time judgment is unreliable | ✅ | ⚠️ needs the reader installed | ⚠️ | ✅ | ✅ | **REJECT** — it is the door promoted to a schema |
| **Shrink the unit** (archive aggressively) | ⚠️ indirect: it makes state findable again without changing the form | ✅ | ✅ | ⚠️ costs a deliberate archiving act | ✅ | ✅ | **KEEP as hygiene, not as the answer** |

Two notes the table cannot hold:

- **Why a block and not a `STATE.md`.** The separate file's only advantage — a small target for grep
  and for a reader — is obtained just as well by a **fixed heading**, and it costs the human path:
  Thomas opens one file in Typora and expects to see where it stands *and* tick a box. A convention
  that makes the human path worse will be abandoned under load.
- **Why front-matter loses to a shape lint.** A declaration says *"trust me, nothing perishable
  here"*. A shape lint **looks**. F-C is the measurement that decides between them.

## 3 — The proposal

### The invariant (one sentence, and everything else follows)

> 🎯 **A paragraph in a plan may not contain a fact that can become false.**

If a sentence can go false **without anyone editing it**, it is state, and state has exactly two legal
forms: **a checkbox**, or a line in the **`## 📍 STATE` block**. Prose then carries only what is true
forever — rationale, evidence, what was rejected and why, how it went. That is the separation by
lifetime, enforced by *form* rather than by *file*, which is what F-A/F-B say is needed.

### Rule 1 — every plan opens with a capped, fixed-key STATE block

```markdown
## 📍 STATE — the only perishable block in this file  ·  moved 2026-08-22
- **Next:** <one line: the next real step>
- **Blocked on:** <what would lift it — or "nothing">
- **Owner's call pending:** <the question, one line — or "none">
- **A session may, alone:** <the boundary — or "ask first">
```

**Four keys, one date, ≤ 20 lines, always the same heading.** The cap and the fixed keys *are* the
prevention: a form with four slots has nowhere to put a narration and nowhere to put a second copy of
anything. It **replaces the hand-invented `WHERE THIS RESUMES` header** (4 files today, up to ~80
lines, itself an unmanaged copy of state scattered through the body) by formalising it and bounding it.

### Rule 2 — a fact another system owns is linked, never asserted

Merged, tagged, released, CI status, branch alive, which commit: **git and `gh` are the record.** A
plan may write `PR #76` as a link; it may not write *"#76 is a draft"* or *"nothing tagged"*. This
deletes the entire F-D class — the only failures in the corpus that are guaranteed to happen on a
date certain, with nobody present.

### Rule 3 — one item, one STATE block; every other mention is a link, syntactically

Not *"prefer a link to a restatement"* as a discipline (that is today's rule, and the ROADMAP shows
what it is worth), but as the only **syntax available**: other files write
`[what it delivers](path/to/plan.md)` and stop. Concretely, the roadmap's map table loses its
**Status** column and keeps `Plan | Delivers | Depends on`. **A form with no status field cannot
carry a status.** That single deletion removes 22 shas, 19 PR numbers and 23 ship-words from a file
whose contract already said they should not be there.

### The lint — optional, content-judging, and it TRAVELS

One test in **`scripts/lib/maintainer-conventions.test.mjs`** — the repo's existing home for
conventions that must reach every clone, which is precisely what `~/.claude/hooks/` cannot do:

- every live plan has a `## 📍 STATE` block, ≤ 20 lines, with the four keys;
- **no status shape outside it**: `\b[0-9a-f]{7}\b`, `PR #\d+`, `SHIPPED|MERGED|TAGGED|nothing tagged|still owed`, in the ROADMAP's rows and in archived files;
- it judges **shape**, not branch mentions — so it **needs no door**: a file that genuinely delegates
  contains no status sentences and passes by construction, with nothing to declare and nobody to trust.

### What it retires (the five workarounds, plus the sixth nobody counted)

> ⚖️ **HALF OF THIS LIST IS GATED ON THE LINT, WHICH THOMAS DEFERRED (2026-08-22).** The hook, the
> door and the certificate were to be retired **by** the lint replacing them; with no replacement,
> removing them would leave nothing at all. **They stay, and the door's declaration on `ROADMAP.md`
> becomes honest** the moment rule 3 empties that file of statuses. The three items that depend only
> on the convention retire now. Each line below says which it is.

- [ ] **The plural-carriers amendment** → moot. One address per item; other files hold links, and a
      link cannot go stale. **Retires with the convention — in scope now.**
- [ ] **The `WHERE THIS RESUMES` headers** → become the STATE block, capped, in all 4 files.
      **Retires with the convention — in scope now.**
- [ ] **The save-point rule SURVIVES and shrinks** to one line: *before handing back, the STATE block
      must already say what your reply says.* Four keys and ≤ 20 lines is cheap enough to write
      mid-reply, which is the only thing that even partly reaches the sequencing hole.
      **Rewritten with the convention — in scope now.**
- [ ] ⏸️ **`~/.claude/hooks/plan-carrier-guard.mjs`** (machine-local, branch-grep, judges no content) →
      to be replaced by the repo-side shape lint, which judges content, travels with the clone, and
      does not over-fire on correct files. **GATED ON THE LINT — it stays installed and firing.**
- [ ] ⏸️ **The `delegates-only` door** → unnecessary once the lint judges shape. **GATED ON THE LINT.**
      Interim: rule 3 makes the `ROADMAP.md` declaration *true* instead of aspirational, which is
      strictly better than today and costs nothing.
- [ ] ⏸️ **The "certificate" variant** → dies with the door. **GATED ON THE LINT.** The 40-line header
      that justifies one stays until then.

### What it costs

**No migration of the 33 654 archived lines** — archived files are touched only to delete a door
declaration if they carry one (2 files). The convention applies to **live plans: 5 files today**.
Roughly 15 minutes each: add the block, hoist the resume header into it, strip the ROADMAP's Status
column. Afterwards the cost is **negative**: the corpus is currently absorbing ~150 lines of plan
prose per day per live plan, part of which is restating state.

### What it cannot fix — stated, not buried

- **It does not make a session NOTICE that it has state to write.** The sequencing hole (memory
  `save-point-rule-sequencing-hole`) is a trigger problem, not a storage problem. This only makes the
  write cheap enough that noticing is usually enough.
- **"Can this sentence become false?" is a judgment call.** The lint catches recognisable shapes, not
  a claim like *"nothing forces the fleet's upgrade"* — the ROADMAP paragraph that outlived both of
  its premises. A rationale resting on facts that expire stays possible; rule 2 narrows it, nothing
  closes it.
- **It does not shrink the 3 000-line plans.** Direction 5 stays worth doing on its own merits; the
  STATE block only makes size non-fatal by giving the perishable part a fixed address.
- **It is a convention, so a determined writer can still write a status paragraph.** The claim is not
  that copies become impossible — it is that the *form* no longer invites them, the *motive*
  (unfindability) is gone, and what remains is cheap to see.

## Tracking

- [x] **1. Re-read the corpus with the lifetime lens** and confirm or break the hypothesis.
      _(2026-08-22 · § 1 — confirmed, and its centre of gravity moved from **file** to **form**)_
- [x] **2. Cost each direction** against the six criteria above. _(2026-08-22 · § 2 — two adopted, two
      rejected, one kept as hygiene)_
- [x] **3. Write the proposal**: one recommended convention, its migration cost, what it retires
      (which of the five mechanisms disappear), and what it cannot fix. _(2026-08-22 · § 3)_
- [x] **4. Hand to Thomas for arbitration.** _(2026-08-22)_ → **ADOPTED, LINT DEFERRED.** His words:
      *"adopte la convention, on diffère le lint."* The invariant and rules 1-3 are in force from
      today; the shape lint is not built. **What that gates is written in § *What it retires***: the
      hook, the door and the certificate were to be retired *by* the lint, so they stay until it
      exists. Do not remove them "for consistency with the convention" — that would leave no net at
      all, which is worse than the over-firing it replaces.

## Application — the work order

The study is closed; this section is the **only live work** in this file. **Both halves are
ADOPTED** — the STATE block (*"adopte la convention"*) and the entry point (*"1. oui"*, 2026-08-22).
Everything below is authorized: **a session executes it without asking again.**

**Order, and why.** The door came first, before this order was even written, so that the very next
*"on reprends"* would land through the new convention instead of the old memory pointer. The harness
comes next because a convention nobody is instructed to follow is inert. The ROADMAP's Status column
comes last: biggest edit, least reversible.

- [x] **1. The door exists** _(2026-08-22 · `maintainers/plans/ACTIVE.md`)_. Links and a date, no
      status, capped at 30 lines. Two sections: the active plan, and *"open but NOT active"* — the
      second holds **links only**, so it cannot go false when the ball changes hands.
- [x] **2. Memory reduced to a pointer** _(2026-08-22)_. `kenjaku-next-work-order.md` went from ~40
      lines ranking eight plans (with a *"read this first"*, a *"do not open that one"* and a due
      date, i.e. state, which `rules/plans.md` forbids) to one instruction: open `ACTIVE.md`. The
      `MEMORY.md` index line follows it.
- [x] **3. `ROADMAP.md` stops being a door** _(2026-08-22)_. Its *"How to use this file"* told a
      post-clear session to hunt the first unchecked gate; it now sends them to `ACTIVE.md` and keeps
      cross-plan **order** only. _(Its Status column is a separate, bigger job: step 7.)_
- [x] **4. The harness carries the convention** _(2026-08-22 · `~/Dev/use-case-driven-harness`,
      branch `chore/plan-state-convention`, pushed, PR not opened — `3939c40`, `52e47cf`, `c2fb656`)_
      - [x] `rules/plans.md` (112 → 132 lines): **the door** (*"on reprend" → `ACTIVE.md`*), **the
            invariant** and **rules 1-3**; the save-point rule shrank to *"the STATE block must
            already say what the reply says"*; the hook, its door and the certificate **demoted to
            *interim net, pending the shape lint*** under a heading that says *do NOT remove it*.
      - [x] `skills/plan-discipline/SKILL.md`: resuming is door-then-block; writing a plan starts
            with the block; ticking a step updates `Next:` in the same edit; **handing the door over**
            is an edit and a commit, with the trap named (no status in `ACTIVE.md`, in either list).
      - [x] `skills/plan-discipline/plan-discipline.md`: the rationale **and both measurements**
            (2026-08-20 carriers-plural, 2026-08-22 the corpus table), plus a paste-ready always-on
            block for a repo with no rules layer.
      - [x] **Dogfooded there, unasked but authorized** _(*"applying the convention to any plan"*)_:
            the harness's own live plan had a **~44-line prose header** — the exact workaround being
            replaced, opening on a merge status git owns. Migrated to a STATE block; the repo got its
            own `docs/plans/ACTIVE.md`. **Why it was not deferred**: a repo that publishes the
            convention while its own plan breaks it is how a shareable surface starts lying.
      - [x] `bash test/bootstrap-check.sh` green (the repo's only mechanical net).
- [x] **5. Pilot the STATE block on one real plan** _(2026-08-22 · 371 → 332 lines; the ~80-line
      resume header and the 8-line STATUS comment became a **14-line** STATE block plus a durable
      § *How the batch was worked*)_. **What the pilot proved, and it is the finding that matters**:
      the four keys held everything the header held, and the ~65 lines that did not fit were **not
      state** — they were the GO, the run's boundaries and the nine commits, i.e. narration that had
      been stapled to the top of the file *because that was where it could be found*. F-B, confirmed
      on a real migration. Rule 3 applied at the same time: W5b and the rehearsal on a copy of a real
      brain became links to the release plan that owns them.
      The file: [`v5-code-review-triage-action.md`](v5-code-review-triage-action.md).
- [x] **6. The remaining live plans get their block** _(2026-08-22)_ —
      `v5-unfreezes-the-existing-fleet-action.md` (2 406 → 2 378), `field-finding-2026-08-08-…`
      (257 → 215), `agent-orchestrated-release-mode-action.md` (3 079 → 3 040). **All five live plans
      now carry a `## 📍 STATE` block**, and no live plan carries a hand-written resume header any
      more. Dormant prospective plans are **not** migrated: they get theirs when they wake, and
      archived files are not touched at all.
      - [x] **The pattern, seen three times and worth stating**: the headers were **stacked, not
            edited**. Each session added a box rather than correcting the one above, so the field-
            finding plan opened with **six** boxes asserting the same single fact, and the mode plan
            with four generations of *"start here instead"*. Nobody was lazy — **editing a paragraph
            you did not write, inside a file you cannot hold in your head, is genuinely riskier than
            appending one.** A four-key block has nowhere to append, which is the whole mechanism.
      - [x] **Three dangling section pointers were the migration's own cost**, and all three were
            found by grep and fixed: the `/loop` prompt told a session to read a header that no longer
            exists (it now says `ACTIVE.md` → the STATE block), and two cross-references pointed at
            deleted sections. **A convention that deletes headers owes that grep**, every time.
- [x] **7. `ROADMAP.md` loses its Status column** _(2026-08-22)_. Columns are now
      `Plan | What it delivers | Depends on`. Every sha and PR number that survives sits inside a
      **ticked checkbox annotation** _(date · commit)_, which is history and true forever — the map's
      own cells hold none.
      - [x] **The durable lessons were rescued into § *Kept from the old Status column*** — three
            debts still owed and by whom (v4.4.0's on-a-real-brain check, v4.8.1's reporters, Track
            D's two tails), v4.9.0's "general smell", the **unmeasured baby-steps carve-out** with the
            numbers a future data point must beat, the fan-out sizing rule, and *"a file is not an
            increment"*. Criterion 6 says none of that may be lost, and none of it was.
      - [x] **Shipped plans left the map entirely.** Eight rows for `archived/` plans were carrying
            the biggest status cells in the file — one ran to ~450 words. **The folder name already
            says they shipped**, so the row was pure restatement.
      - [x] **The second table's Status column became *"What it waits for"*** — a boundary or a
            precondition, both true until someone lifts them. That is where *"needs an ADR, the
            owner's"* belongs; *"UNSTARTED"* was the part that could go false unattended.
      - [x] **The `plan-carrier-guard: delegates-only` declaration STAYS, and is now true.** It was
            aspirational when Thomas granted it (finding F-C: the file held 22 shas that day). Rule 3
            is what made the header honest rather than the header making the file honest.
- [x] **8. Newly archived plans get a date prefix** _(2026-08-22)_ — `archived/2026-08-21-<name>.md`.
      Written into **both** carriers of the archiving ritual: `CONVENTIONS.md` §7 and
      `maintainers/README.md`'s *definition of done*. **No retro-rename of the 70 existing files** —
      that would break cross-links corpus-wide to fix what step 1 already fixes by removing the other
      doors.
      ⚠️ **This one is a judgment call, not a clear instruction**: Thomas asked for an archived
      marker in filenames himself, then answered *"1. oui"* to a question whose second half was this.
      Taken as a yes because he raised it; **it is one convention line to delete if he meant
      otherwise** _(two, now: `CONVENTIONS.md` §7 and `README.md`)_.
      - [x] **Two things were added while writing it, because the ritual was incomplete without
            them.** (a) Archiving now **hands the door over** — remove the plan's link from
            `ACTIVE.md` in the same commit, or the door points at a finished file. (b) **An archived
            plan drops its `## 📍 STATE` block** for one line naming the release that shipped it: a
            block whose heading means *"the only perishable thing here"* has no business in a file
            that is finished, and that is exactly what produced the 40-line apology header the study
            measured.
- [x] **9. The convention reached the two repo-level carriers it needed** _(2026-08-22, not in the
      original order, found by grepping for what still described the OLD discipline)_.
      `maintainers/CONVENTIONS.md` — which exists so the rules **travel with a clone** — still taught
      *"follow the pointer → read the header note and the `## Tracking`"*. It now carries the door in
      §3bis and a new **§3ter** with the invariant and rules 1-3; `maintainers/README.md` names the
      door and the STATE block where it describes `plans/`. **This is the plural-carriers rule paying
      for itself**: step 4 named the harness and only the harness, and two files in this repo were
      teaching the superseded ritual.
- [ ] **10. Prune the archived corpus of nothing.** Out of scope, written down because it is the
      tempting next step: 70 files, 33 654 lines, zero benefit.

### Decisions already taken — do NOT re-litigate

- [x] **One DOOR, not one file.** Thomas's rule is *one active plan at instant T*; the nuance the
      corpus forced is that sub-plans stay legitimate (the triage plan gated a merge and carried a
      whole autonomous run; folding it into a 2 406-line plan would have buried it). **What must be
      unique is the way in.**
- [x] **`ACTIVE.md` holds links, never a status** — including in its *"open but not active"* list.
      A file that names who the ball is with would go false the day the ball moves.
- [x] **Rejected: an `ACTIVE-` filename prefix** instead of a pointer file. It makes `ls` the index
      and needs no extra file, but every hand-over breaks the Markdown cross-links the corpus is full
      of, and churns git for a fact that changes weekly.
- [x] **The hook, the `delegates-only` door and the certificate STAY** until the lint exists. They
      are not "inconsistent with the convention", they are its interim net.

### Findings from the application (append as they land)

- [x] **The lint has a false-positive problem the proposal understated** _(found 2026-08-22, while
      preparing the pilot, before writing a line of it)_. Migrating the triage plan means writing
      **nine commit shas** into a history section — legitimately: they are what the batch cost, they
      are true forever, and they are exactly the shape the lint was to flag. **So the lint cannot be
      a blanket "no shas outside the STATE block"**: it needs a scope (which files) and an exemption
      (a marked history section), and that is the expensive half of it. This is a real argument for
      not building it in a hurry, and it is the reason the split option below exists at all.
- [x] **The migration found a lie the corpus had been carrying for a day** _(2026-08-22, migrating the
      release plan at step 6)_. `S7-5-3` sat **unticked** while its code was shipped, wired and
      double-tested — `fa0f5be`, checked on disk. Three surfaces disagreed at once: the checkbox said
      *to do*, four stacked prose headers said *the queue is empty*, and the code said *done*. **This
      is F-A caught in the act**, and it is the sharpest evidence in the whole study: the box is not
      where the state is, so the box goes stale while everyone reads the prose that buried it. Nobody
      was careless — the file had simply grown past the point where anyone re-reads it to the bottom.
- [x] 😐 **The door was born over its own cap, and nobody noticed for a day** _(found 2026-08-22 when
      handing it over)_. `ACTIVE.md` says *"keep it under 30 lines, forever"* in its own header and
      was created at **34**. Trimmed to 28. **The lesson is not "be careful"** — it is that a cap
      written in prose is a cap nothing measures, which is precisely the argument for the cheap half
      of the lint (*every live plan has a STATE block, four keys, ≤ 20 lines*). A rule this convention
      states about itself was broken by the convention's own first artifact.
- [ ] ⚠️ **Two files in THIS repo still teach the superseded ritual, and the fix already exists on a
      branch nobody merged** _(found 2026-08-22 by grepping for *"header note"* after step 9)_.
      `maintainers/plan-discipline.md` (163 lines) and `maintainers/skills/plan-discipline/SKILL.md`
      (97 lines) are the **pre-consolidation copies** of the harness's method: they say *"read its
      header note and its `## Tracking`"*, know nothing of the door or the STATE block, and one of
      them is a full 163-line duplicate of a document the harness now owns. **Their removal is
      already written**, on `chore/plan-discipline-points-at-the-harness` (deletes the skill folder,
      reduces the doc to a pointer) — **pushed, never opened as a PR, and recorded as the owner's, not
      work to pick up**. 🚫 **Deliberately NOT fixed here**: editing them would duplicate that
      branch's work and conflict with it, and rewriting them in place would recreate the very copy the
      consolidation deleted. **What is needed is a decision about that branch, not an edit.** → it is
      the harness plan's *Owner's call pending*.
- [x] **The convention has two outward-facing copies, and step 4 just made them stale** _(found
      2026-08-22, while doing step 4)_. The public extract `plan-memory-test-harness` and the
      published page both carry the **pre-2026-08-22** discipline (singular carriers, no door, no
      STATE block). **This study does not own that** — the harness plan does, and it is already an
      unanswered owner's call there:
      [`harness-consolidation-action.md`](https://github.com/tpierrain/use-case-driven-harness/blob/main/docs/plans/harness-consolidation-action.md),
      *Owner's call pending*. Written here as a **link, not a status** (rule 3), so this file cannot
      go false the day he answers.

## The ENTRY POINT — Thomas's own convention, and the half this study missed

_(proposed by him 2026-08-22, in conversation, **not yet decided**. Written here the moment it was
said, because the study's own § 1 says an idea that lives only in a thread dies at the next clear.)_

**His words**: *"chaque plan s'appelle du nom de la feature, c'est pratique mais il n'y a ni index ni
machin… un plan, on est censé avoir qu'un seul plan actif à l'instant T… ça ne veut pas dire qu'on ne
peut pas l'enrichir en cours de route… et ça c'est pour que le 'on reprend' fonctionne… au lieu de
truffer la mémoire de tout un tas de trucs… plus de conventions, moins de recherches intempestives et
contre-productives."*

### Why this is not the same problem, and why it is the one that hurts

The study answered **"how do we stop state being copied between files?"** — a *staleness* problem, and
its fix is the STATE block. Thomas is asking **"which file do I open, and why must anyone work that
out?"** — an *entry point* problem, and the STATE block does nothing for it. **It is the upstream
half**, and it is the one he actually experiences.

**Measured on this very session** (2026-08-22): answering *"on reprends"* took **eight files opened
before any work began** — the memory pointer, then four plan headers, then the ROADMAP, then an
archived header. Not one of those reads was wasted *given today's rules*; every one of them was a
search that a convention could have made unnecessary.

**And the memory pointer is a live rule violation, which his instinct caught.**
`kenjaku-next-work-order.md` is ~40 lines that rank eight plans, flag one *"🔴 READ THIS ONE FIRST"*,
warn *"do not open that one"*, and carry a study's due date. `rules/plans.md` says memory holds
**pointers and references, never state** — that file is a roadmap in a pointer's clothing, reloaded
with full authority at every session start, and it has been wrong before.

### The rule, and the one nuance it needs

> **At instant T there is exactly ONE way in.** *"On reprend"* means: open it, read its STATE block,
> announce the step, work. No memory lookup, no roadmap scan, no grep.

The nuance, from this session's own evidence: **one entry point, not necessarily one file.** The
triage plan was a legitimate second file — it gated the merge and carried a whole autonomous run, and
folding it into a 2 406-line release plan would have buried it. What must be unique is **the door**,
not the room count. So: sub-plans are allowed, and they are reachable **only through the active
plan**, never through memory and never through the ROADMAP.

### The mechanism, costed

- [ ] **`maintainers/plans/ACTIVE.md` — one file, at a path that never changes.** Three lines: the
      subject in plain words, the link to the active plan, the date it became active. *"On reprend"*
      is then a single deterministic read. `git log ACTIVE.md` gives, for free, the history of what
      was active when — something no current file can answer.
- [ ] **The memory pointer shrinks to one line** and stops holding state: *"on reprend → open
      `maintainers/plans/ACTIVE.md`"*. That is a pointer in the sense the rules actually mean.
- [ ] **The ROADMAP stops being a door.** It keeps ordering (which it owns) and loses its role as an
      index of where to resume, which it was never able to hold correctly anyway.
- [ ] **Rejected: renaming the active plan** (an `ACTIVE-` prefix instead of a pointer file). It makes
      `ls` the index and needs no extra file, but every rename breaks the Markdown cross-links the
      corpus is full of, and it churns git for a fact that changes weekly.

### On the archived marker in the filename — his second idea, and where I disagree

He asks that a filename say *archived*, at the same time as the move into `archived/`. The instinct is
right and the evidence supports it: the archived plan grew a **40-line header** shouting *"DO NOT OPEN
THIS FILE TO FIND OUT WHERE THE WORK STANDS"*, which is what a file writes when it keeps being opened
by mistake.

**But the mistake has a cause, and the marker treats the symptom.** Files in `archived/` get opened by
accident because there are **many doors** — memory, the ROADMAP, a grep, a link from another plan. The
entry-point rule removes the doors: if the only way in is `ACTIVE.md` → the active plan → its own
links, nobody lands in `archived/` by accident, and that 40-line header can shrink to a line.

- [ ] **If he wants the marker anyway** (his call, and it is cheap): date-prefix **newly** archived
      files only — `archived/2026-08-21-update-regime-owns-what-it-shipped.md`. A date in a name reads
      as *historical record* at a glance and sorts by close date. **No retro-rename of the 70 existing
      files**: it would break cross-links across the corpus to fix a problem the entry-point rule
      already removes.

## The lint, reopened

**Why it is back.** Thomas accepted an autocompleted *"on diffère le lint"* without knowing what a
lint is, and asked for the stakes in plain terms. The convention is **not** in question; only its
enforcement is.

**What the deferral actually costs, stated plainly** — and the proposal buried it: the hook, the door
and the certificate were to be retired **by** the lint. With no lint, they stay, so the outcome of
*"adopt the convention, defer the lint"* is **five mechanisms plus a convention**. That is an
addition, not the removal the study was asked to deliver. It is defensible as a temporary state; it
is not defensible as the end state, and nothing in the corpus would have said so out loud.

- [ ] **Option A — build it all now.** Retires the hook, the door and the certificate immediately.
      Costs ~1h of tooling while the v5.0.0 cut waits, and pays it straight into the hard half whose
      difficulty the finding above just measured.
- [ ] **Option B — defer it all.** Cheapest today. Leaves six mechanisms and no trigger to fix that,
      which is how the previous four workarounds each became permanent.
- [ ] **Option C — split it (RECOMMENDED).**
      - **Cheap half, now**: *every live plan has a `## 📍 STATE` block, four keys, ≤ 20 lines.* ~20
        lines of test, no judgment, no false positive possible, and it keeps the convention alive on
        the days neither of us is thinking about it.
      - **Hard half, later, with a NAMED trigger (after the v5.0.0 tag)**: detecting a status written
        in prose where it does not belong. It is the half that retires the hook and the door, it is
        the half the finding above says needs care, and two or three weeks of the convention running
        will say which status shapes actually recur — which is the data the detector needs and does
        not have today.
      - **Until the hard half exists, the hook and the door STAY, and this file says so** rather than
        letting "we adopted the convention" be read as "the workarounds are gone".

## Scope

- **Out**: the v5.0.0 release and its findings — that is
  [`v5-code-review-triage-action.md`](v5-code-review-triage-action.md), and this study must not touch it.
- **Likely destination of the OUTPUT**: the harness (`~/Dev/use-case-driven-harness`, `rules/plans.md`
  + the `plan-discipline` skill), because the convention is global. The **evidence** lives here, in
  Kenjaku, which is why the brief does.
