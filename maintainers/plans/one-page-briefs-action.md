<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- STATUS: 🔴 ACTIVE — THE plan. Opened 2026-09-14 at the owner's ask, to start   -->
<!-- implementing issue #119. It carries PART A only: the one-page brief. Parts B   -->
<!-- and C (ambient ingestion, the twice-daily digest) stay gated by the open       -->
<!-- measurements in ../studies/ambient-ingestion-feasibility-study.md.             -->
<!-- The way in is plans/ACTIVE.md; this file owns the state.                       -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Action plan — a prep's first screen is the whole brief, and a check says so

## 📍 STATE — the only perishable block in this file · opened 2026-09-14

- **⚠️ THE WORK IS ON A BRANCH, NOT ON `main`:** `feat/one-page-brief-shape`. Check it out before
  reading anything else — `main`'s copy of this plan is behind on purpose.
- **Next: nothing but the owner's reading.** S1 to S6 are done: **PR
  [#129](https://github.com/tpierrain/kenjaku/pull/129) is open and green on the full matrix**, and
  the mutation gate is paid on both files the branch writes. Start at § *To validate at the owner's
  return* — seven calls taken alone, each with what reversing it costs.
- **Blocked on:** nothing, and no question is left. **All three owner's calls are answered**
  (2026-09-14): Q1 the cap BLOCKS the write, Q2 the scope is a `type:` prefix, Q3 the cap is an upper
  bound and a thin brief says so. Read them below before re-raising any of them.
- **Working autonomously** from 2026-09-14 evening, at the owner's explicit go-ahead. Stop at a green
  PR: **never merge, tag or publish.** On any judgment call, **decide and record — do not stop**; see
  § *To validate at the owner's return*.
- **This part's issue:** [#128](https://github.com/tpierrain/kenjaku/issues/128).
  [#119](https://github.com/tpierrain/kenjaku/issues/119) is the umbrella;
  [#126](https://github.com/tpierrain/kenjaku/issues/126) / [#127](https://github.com/tpierrain/kenjaku/issues/127)
  are parts B and C, untouched by this plan.
- **A session may, alone:** everything up to and including a green PR. **Not:** merge, tag, publish,
  or touch parts B/C.

## Tracking

- [x] **S1 — Part A has its own issue**, so it can close on its own _(2026-09-14)_. #119 split into
      three: **#128** (part A, this plan), **#126** (part B), **#127** (part C); each part's text
      carried across verbatim. #119 kept as the umbrella, its body reduced to the shared problem
      statement plus the three links, so no status is stated twice. _(This was the study's S3.)_
- [x] **S2 — The shape is written down ONCE, and the cap has a decidable unit** _(2026-09-14)_ —
      both answers are in § *The shape, decided* below, and they are what S3–S5 implement.
  - [x] S2.0 Where the shared shape lives — **a new engine skill**, `engine-skills/brief-shape/`,
        which `prepare-1-1` defers to by link the way it already defers to `sync-sources § Claim
        discipline`. The reason it cannot be a section of `prepare-1-1` is measured, not stylistic:
        see *Why a new skill and not a section* below.
  - [x] S2.1 The unit of the cap — **top-level bullets in the brief section, at most 7, each at most
        220 characters**. Two counts a script makes without judgment, standing in for "5 to 7
        sentences, one screen". **Upper bound only** — the floor of 5 was dropped by Q3, because a
        check that fails a short brief is padding pressure wired in. Rationale below.
- [x] **S3 — The brief is produced in that shape** _(2026-09-14)_, by `prepare-1-1` in **both**
      locales: it names `brief-shape` and obeys it instead of restating it (no number is spelled
      twice), and its two output templates are re-cut — the spoken bullets between the `#` title and
      the first `##`, everything else under one `## Ammunition — only if they dig, contest or ask`
      with its verbatim quotes, dates and source paths, closing on what the vault does **not**
      support. The templates now emit `type: prep-1-1` frontmatter, without which S4's check would
      select nothing (H3).
  - [x] S3.1 The engine's fingerprint table is regenerated, which is what the branch's red CI was
        about: a staged skill no row can place makes every brain holding it read as edited. Cut for
        `v5.6.0` (H4).
  - [x] S3.2 **The tail of a merge-regime skill is left alone** — measured, not guessed. Rewriting
        its last section conflicted with the QA brain that appends its own KPIs at the end of the
        file, so the owner got a `.new` sidecar instead of the update. The sentence moved into the
        body and the last section is byte-identical again. See § *Constraints carried over*.
- [x] **S4 — A deterministic check fails when the first screen is over the cap** _(2026-09-14)_ —
      `scripts/lib/brief-shape.mjs`, pure, no I/O, 24 tests red before green. It counts four things
      and judges no prose: the bullets above the first `##`, their length once wrapping is folded
      back, that there IS a first screen (H5), and that nothing but bullets sits above the fold
      (H6). Every message names its rule **and the distance**, because its reader is the model that
      has to fix the note in one pass.
  - [x] S4.1 🪟 **It reads a note written on Windows the same way** — and that was a real defect,
        not a precaution. JavaScript counts `\r` as a line terminator, so splitting on `"\n"` alone
        left every line ending in one, `/(.*)$/` could not reach past it, and **no bullet matched its
        own marker**: a perfectly shaped prep refused on one platform, its every bullet named as
        prose. Found by asserting the two endings give the **same verdict**, never by reasoning; the
        Windows tripwire is what pointed at the class, on the doc guard next door.
- [x] **S5 — The check fires at the moment a prep is WRITTEN** _(2026-09-14)_ — asked by
      `guardDecision` in `scripts/lib/vault-write-guard.mjs`, right after the frontmatter verdict
      and never before (the selector reads the frontmatter, so on a note the parser refuses there is
      nothing to select on). The hook wiring needed no change: it already runs on every `Write` and
      `Edit`. An Edit is judged on the note it **would** produce, so "one more thing worth saying"
      is refused like a long note written in one go.
- [x] **S6 — A green PR** _(2026-09-14)_ — [#129](https://github.com/tpierrain/kenjaku/pull/129),
      green on the full matrix (it touches `scripts/`, so nothing was path-ignored).
  - [x] S6.1 **The mutation gate, on what the BRANCH wrote** — both production files, from
        `git diff --name-only origin/main...HEAD` rather than from the last commit, which is the way
        that gate was mis-paid on v5.5. **98.86 %** over four passes (`brief-shape.mjs` 98.73 %, the
        write guard's changed range 100 %), two named equivalents left. The full read, and what the
        first pass's 71.84 % was actually about, is in `maintainers/mutation/RESULTS.md`.

## The shape, decided (S2) — S3, S4 and S5 implement this and re-open none of it

### Where it lives — a new engine skill, `brief-shape`

The shape is written **once**, in a new skill staged at `engine-skills/brief-shape/SKILL.md` and
declared in `engine-manifest.json`. `prepare-1-1` names it and obeys it, in both locales, exactly the
way it already says of claim discipline: *"the full rules live in one place and this skill obeys them
rather than restating its own"*.

**Why a new skill and not a section of `prepare-1-1` — this is the load-bearing half.** A skill this
repo already ships is **never overwritten on an existing brain**: engine updates install skills
*if absent* and preserve the one that is there (`engine-apply-plan.mjs` § `installSkills`, ADR 0025,
proven by `staged-skills.test.mjs`'s *preserve-present* case). So text added inside `prepare-1-1`
reaches **fresh installs only**, and every brain already in the field keeps the old file. A **new**
skill directory is the one carrier that does reach an upgrader.

Two consequences that must be honoured when S3 is written, or the shape ships to nobody:

- **The new skill's `description:` has to trigger on its own**, on the words a prep is asked for
  (prep, brief, 1-1, meeting, difficult conversation, day briefing). On an upgraded brain the old
  `prepare-1-1` will not link to it, so the description is the only thing that loads it.
- **Both locales, from line one.** `templates/fr/` gets its own copy. The claim-discipline fix nearly
  shipped EN-only because `.claude` is hidden and did not show in a directory listing — that near-miss
  is recorded in `claim-discipline.test.mjs` and must not be repeated here.

### The unit of the cap — bullets and characters, never sentences

The issue asks for **5 to 7 sentences**. A sentence is not decidable (abbreviations, decimals, quoted
speech, ellipses), and a check that disagrees with the rule it enforces is worse than no check. So the
shape itself is made countable:

> **The brief section is a flat list of at most 7 top-level bullets, one spoken sentence each, no
> nesting, no sub-headings. No bullet exceeds 220 characters. Fewer than 5 is allowed and carries
> one line naming what the vault does not document** (Q3) **— the shape never pads to reach a
> number.**

- **Why bullets stand in for sentences**: the rule is not "prose of a certain length", it is *the
  handful of things you are going to say*. One bullet = one thing said. A script counts `^- ` at the
  top level of one section with no judgment at all.
- **Why the 220-character ceiling exists**: without it, "7 bullets" is gamed by seven paragraphs. A
  sentence a person actually says aloud runs 120 to 180 characters; 220 leaves room without letting a
  bullet become a section.
- **Why the pair stands in for "one screen"**: worst case 7 × 220 = 1 540 characters ≈ 20 wrapped
  lines at 80 columns, plus a heading. That fits a laptop Markdown reader with no scrolling, which is
  the only property the owner actually cares about while facing someone.
- **What is NOT counted**: everything below the brief section. Ammunition is unbounded by design — the
  cap exists to protect the first screen, not to shorten the evidence underneath it.

### Where the brief section starts and stops — decided 2026-09-14, while writing S3

The check needs an anchor, and the plan had not named one. **The brief is everything between the
note's `#` title and its first `##` heading.** Nothing else.

- **It needs no canonical heading name**, so it is the same rule in English and in French. A magic
  heading would have to be spelled twice and would drift, which is the failure this whole issue is
  about.
- **It matches what the owner actually experiences**: the first screen is what you see before the
  first section break, which is exactly where the eye stops.
- **It makes the ammunition's home automatic**: every `##` section below is ammunition, unbounded,
  and the check never looks at it.

## To validate at the owner's return — hypotheses taken alone, never blocked on

**The rule, his call, 2026-09-14** _(« je préfère que tu choisisses une hypothèse de travail et que tu
me la fasses valider à mon retour … si je ne suis pas d'accord, tu reviendras sur ce point en
particulier »)_. While he is away, a judgment call is **not** a stopping point. Pick, keep going,
record here. Stopping spends the whole stretch waiting for an answer that arrives in the morning
anyway; deciding spends it building, and a wrong guess re-opens **one line**, not a night.

**Every entry carries what reversing it COSTS.** That field is what makes the heuristic safe: a cheap
call needs no hesitation, and an expensive one is the one to shape until it is cheap. He reads this
list, not the diff.

| # | Hypothesis taken | What was rejected | Cost to reverse |
| --- | --- | --- | --- |
| H1 | The brief section is anchored between the `#` title and the first `##` — no named heading | A canonical heading (`## Brief`), which would have to be spelled once per locale and would drift | **Cheap.** One constant in the check plus one line in each skill; no note already written becomes invalid |
| H2 | `prepare-1-1`'s two output templates are re-cut so the bullets sit above the first `##`, and the KPI table, weak signals and focus areas move below the fold as ammunition | Leaving the templates as they are and letting the shape apply only to new prep types | **Medium.** It is prose in two skills, so reverting is a revert; but a prep already written in the old shape keeps working, nothing breaks in the field |
| H3 | The templates emit `type: prep-1-1` frontmatter, so a prep the engine writes is a prep the check can see | Selecting preps by their folder or their filename, which Q2 already rejected | **Cheap.** Four lines of template prose; a prep already written without it is simply out of scope, exactly as it is today |
| H5 | A prep must carry **at least one** bullet above the fold. Not a floor on length (Q3 stands): a floor on the first screen EXISTING | Counting only the upper bounds — under which the old output shape (a title, then straight into `## What I want to raise`) passes every rule, and the check is blind to the exact defect it exists for | **Cheap.** One rule and its two tests. Nothing a correct prep can trip on: the thin brief still has its "not documented" bullet |
| H6 | Above the fold, **bullets and nothing else** — a preamble, a sub-heading or a table is refused | Capping bullets only, which "seven bullets under a page of context" honours to the letter | **Cheap to delete** (one rule, two tests), and it is the rule most likely to refuse something reasonable — so: markdown's lazy continuation is a wrap, not a violation, and the refusal quotes the line it means |
| H7 | The fold is a `##` heading **exactly**, so a `###` above it is prose and is told so | Treating any heading deeper than the title as the fold, which would silently end the brief at a sub-heading and hide the page underneath from the cap | **Cheap.** One comparison in the check; no note already written changes meaning, since a prep with a `###` first screen is refused either way, only the message differs |
| H4 | The fingerprint table is cut for **`v5.6.0`** — a new skill and a new capability read as a minor release | Guessing `v5.5.2`, or leaving the table stale until the release | **Cheap, and it is the documented release step anyway.** Wrong number → re-run `node maintainers/fingerprints/generate-fingerprints.mjs --version <the real tag>` before cutting. Leaving it stale was NOT an option: it is what made this branch's CI red |

## Questions for the owner — raised one at a time, when its step is reached

- [x] **Q1 (at S4) — does going over the cap BLOCK the write, or warn?** **Answered by the owner,
      2026-09-14: it BLOCKS.** The over-long note never exists; the cost of the refusal is paid by the
      brain, which is told why and rewrites shorter, not by the owner, who only ever sees the correct
      result. Chosen over warning (a warning is read once and then ignored, and in six months the preps
      are long again — today's situation) and over a per-note escape hatch (an escape becomes the
      habit, and it would have to be written and tested).
      **What this binds for S4/S5**: the guard exits non-zero and its message must say **which** rule
      failed and **by how much**, because its reader is the model that has to fix it in one pass.
- [x] **Q2 (at S3) — which notes count as prep-shaped?** **Answered by the owner, 2026-09-14: a
      PREFIX rule on frontmatter `type:` — every `prep-*` and every `briefing-*`.** So `prep-1-1`
      (the one that exists in the field today) is covered, and a prep type invented later is covered
      the day it is written, with no edit to the check. Chosen over "1-1 preps only" (each new kind
      would have to be remembered, which is the very defect this issue is about) and over a closed
      list of four types (three of which have never been produced).
      **What this binds for S3/S4**: the check's selector is the `type:` prefix, nothing else — never
      the folder, never the filename, never a heading. A note with no `type:` is out of scope.
- [x] **Q3 (at S3) — what does the first screen do when the vault is thin?** **Answered by the owner,
      2026-09-14: fewer lines, and the page SAYS so.** The cap of 7 stands; the floor of 5 is
      dropped. Two solid things to say means two bullets, plus one line naming what is not
      documented. Chosen over filling the page with open questions (the line between a useful
      question and polite padding is invisible, and it would drift unseen) and over refusing to
      produce a brief below a threshold (two true lines beat nothing, minutes before a meeting).
      **What this binds for S2.1/S4**: the cap is an **upper bound only** — a check that fails a
      short brief would be the padding pressure itself, wired in.

## Why this part first, and why it is cheap

- **The capability is not missing — the RULE is.** A prep note written in the field on 2026-09-13
  already had exactly the right shape. It does not reproduce because the shape is written nowhere,
  so the owner asks for it again every session. That is a one-place-to-fix defect.
- **It depends on none of the open gates.** Parts B and C wait on measurements that are not made
  (a locked screen, connector-token expiry, index contention). Part A waits on nothing.
- **The pain it removes is live, not hypothetical.** Facing a person, the owner needs the page they
  will speak from; today the ammunition comes first and gets triaged in the room.

## Constraints carried over, not to be re-derived

- **Every ammunition item keeps its verbatim quote, its date and its source path.** This is the
  load-bearing half: the point is answering a contradiction with the exact words, in the room,
  without opening anything else.
- **The closing block says what the vault does NOT support**, so a negative claim is never spoken
  without knowing it is unsupported. This is `sync-sources` § Claim discipline applied at the moment
  it costs the most, and the prep skill already defers to it rather than restating it.
- **A rule that has to be remembered has already failed** — hence S4/S5. The shape without the check
  is exactly today's situation.
- **The LAST section of a skill an owner may customize is not free to rewrite** _(measured at S3,
  2026-09-14)_. Owners append at the end of a file; an engine change to those same last lines has no
  trailing context to merge against, so the three-way merge conflicts and the update arrives as a
  `.new` sidecar the owner has to arbitrate. The QA brain built from the real v3.6.0 tag says so out
  loud, and it is the promise the release makes: *your edits survive AND the update lands*. So a
  change belongs in the body, and the tail stays byte-identical.

## 📜 History

- **2026-09-14** — Part A ships first and alone, because it depends on none of the ambient-ingestion
  gates. Already the study's conclusion, re-confirmed in conversation when the owner asked to restart
  on #119.
- **2026-09-14** — Issue #119 was filed as one issue with three parts. The same day, the ambient
  ingestion study measured that an unattended run reaches the owner's connectors, settled strategy 1
  for parts B/C, and recorded that **part A is independent and ships first**. This plan is that
  sentence turned into steps. The study keeps parts B and C; it is not superseded by this file.
