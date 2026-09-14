<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- STATUS: 🔴 ACTIVE — THE plan. Opened 2026-09-14 at the owner's ask, to start   -->
<!-- implementing issue #119. It carries PART A only: the one-page brief. Parts B   -->
<!-- and C (ambient ingestion, the twice-daily digest) stay gated by the open       -->
<!-- measurements in ../studies/ambient-ingestion-feasibility-study.md.             -->
<!-- The way in is plans/ACTIVE.md; this file owns the state.                       -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Action plan — a prep's first screen is the whole brief, and a check says so

## 📍 STATE — the only perishable block in this file · opened 2026-09-14

- **Next:** S3 — write the `brief-shape` skill (both locales) and make `prepare-1-1` defer to it.
  The design it implements is settled in § *The shape, decided*; do not re-open it.
- **Blocked on:** **Q2**, the owner's call, and it is the one thing S3 cannot start without — which
  notes count as prep-shaped, i.e. which `type:` values the shape and the check apply to. Q3 is due at
  the same step; Q1 waits until S4.
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
  - [x] S2.1 The unit of the cap — **top-level bullets in the brief section, 5 to 7, each at most
        220 characters**. Two counts a script makes without judgment, standing in for "5 to 7
        sentences, one screen". Rationale below.
- [ ] **S3 — The brief is produced in that shape**, by `prepare-1-1` and by every prep-shaped
      artifact: first screen usable alone, ammunition folded underneath and labelled *only if they
      dig*, every ammunition item carrying its verbatim quote, its date and its source path, and a
      closing block naming what the vault supports and what it does not.
- [ ] **S4 — A deterministic check fails when the first screen is over the cap**, test-first: the
      pure core in `scripts/lib/` (ADR 0009 rung 1, no I/O), red before green.
- [ ] **S5 — The check fires at the moment a prep is WRITTEN**, not at a lint somebody remembers to
      run. The seam already exists: `scripts/vault-write-guard.mjs`, wired as a hook in
      `.claude/settings.json.template`, is where a note the engine would refuse is already stopped.
- [ ] **S6 — A green PR**, full matrix (it touches `scripts/`, so nothing is path-ignored).

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

> **The brief section is a flat list of 5 to 7 top-level bullets, one spoken sentence each, no
> nesting, no sub-headings. No bullet exceeds 220 characters.**

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

## Questions for the owner — raised one at a time, when its step is reached

- [ ] **Q1 (at S4) — does going over the cap BLOCK the write, or warn?** The issue's wording is
      *"a deterministic check fails"*, which reads as blocking. Blocking is also the only version that
      cannot be ignored. Against it: a prep is written mid-conversation, and a refused write costs a
      retry at the worst moment.
- [ ] **Q2 (at S3) — which notes count as prep-shaped?** Frontmatter `type:` is the decidable answer
      (`prep-1-1` already exists in the field). The issue's scope is wider: meeting preps,
      difficult-conversation preps, day briefings. Each needs a type before the check can find it.
- [ ] **Q3 (at S3) — what does the first screen do when the vault is thin?** Five sentences of
      substance may not exist. Padding to reach the shape is the one failure that would make this
      feature lie, so the empty case needs its own answer.

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

## 📜 History

- **2026-09-14** — Part A ships first and alone, because it depends on none of the ambient-ingestion
  gates. Already the study's conclusion, re-confirmed in conversation when the owner asked to restart
  on #119.
- **2026-09-14** — Issue #119 was filed as one issue with three parts. The same day, the ambient
  ingestion study measured that an unattended run reaches the owner's connectors, settled strategy 1
  for parts B/C, and recorded that **part A is independent and ships first**. This plan is that
  sentence turned into steps. The study keeps parts B and C; it is not superseded by this file.
