<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- STATUS: the STATE block below is this file's only perishable content —   -->
<!-- do not restate it in a comment, a header or another file. This file OWNS -->
<!-- the study, its evidence, the convention it produced, and the state of    -->
<!-- APPLYING that convention. It holds no other chantier's state.            -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Study — plans that need no guard: making duplicated state structurally impossible

## 📍 STATE — the only perishable block in this file · moved 2026-08-22

- **Next:** apply the convention — § *Application*, in its order: the pilot, then the harness rule,
  then the remaining live plans and the ROADMAP.
- **Blocked on:** nothing.
- **Owner's call pending:** none. Arbitrated 2026-08-22 — *"adopte la convention, on diffère le lint"*.
- **A session may, alone:** apply rules 1-3 to any plan, and write the convention into the harness.
  **It may NOT delete the hook, the `delegates-only` door or the certificate** — those three retire
  with the lint, and the lint is deferred.

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

## Application — putting the convention in force

The study is closed; this section is the **only live work** in this file, and it owns its state
(the STATE block at the top is its resume marker).

**Order, and why.** The pilot comes before the written rule on purpose: migrating one real plan is
what would expose a wrong key or a too-tight cap, and it is cheaper to learn that before the
convention is carved into the harness than after. The ROADMAP comes last because it is the biggest
single edit and the least reversible.

- [ ] **1. Pilot — one real plan gets a STATE block, and the block's design is judged on it.**
      Target: [`v5-code-review-triage-action.md`](v5-code-review-triage-action.md) — smallest live
      plan (371 lines), and its ~80-line resume header is the workaround being replaced, so it is the
      honest test. Record what the migration cost and whether the four keys were enough.
- [ ] **2. The harness carries the convention** — `~/Dev/use-case-driven-harness`, on its own branch:
      - [ ] `rules/plans.md` (always-on): the invariant, rules 1-3, the shrunk save-point rule, and
            the hook demoted to *interim net, pending the lint*.
      - [ ] `skills/plan-discipline/SKILL.md` (on-demand): how to write, tick and resume a STATE block.
      - [ ] `skills/plan-discipline/plan-discipline.md`: the rationale + the measurement that produced
            it, so the convention travels with its evidence and is not re-litigated from scratch.
- [ ] **3. The remaining live plans get their block** — `v5-unfreezes-the-existing-fleet-action.md`,
      `agent-orchestrated-release-mode-action.md`, `field-finding-2026-08-08-source-first-and-frozen-doctrine.md`.
      Dormant prospective plans are **not** migrated: they are touched when they wake.
- [ ] **4. `ROADMAP.md` loses its Status column** (rule 3). The durable lessons currently buried in
      those cells are **kept** — they are history, and criterion 6 forbids losing them; only the
      perishable statuses go, replaced by the link to the owning plan.
- [ ] **5. Prune the archived corpus of nothing.** Explicitly out of scope, restated here because it
      is the tempting next step: 70 archived files, 33 654 lines, zero benefit.

### Findings from the application (append as they land)

_(Empty until the pilot runs. Anything the migration teaches about the convention itself goes here,
because it is evidence about § *The proposal*, not status.)_

## Scope

- **Out**: the v5.0.0 release and its findings — that is
  [`v5-code-review-triage-action.md`](v5-code-review-triage-action.md), and this study must not touch it.
- **Likely destination of the OUTPUT**: the harness (`~/Dev/use-case-driven-harness`, `rules/plans.md`
  + the `plan-discipline` skill), because the convention is global. The **evidence** lives here, in
  Kenjaku, which is why the brief does.
