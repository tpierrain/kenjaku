<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- STATUS: 🔴 ACTIVE — THE plan. Opened 2026-09-14 at the owner's ask, to start   -->
<!-- implementing issue #119. It carries PART A only: the one-page brief. Parts B   -->
<!-- and C (ambient ingestion, the twice-daily digest) stay gated by the open       -->
<!-- measurements in ../studies/ambient-ingestion-feasibility-study.md.             -->
<!-- The way in is plans/ACTIVE.md; this file owns the state.                       -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Action plan — a prep's first screen is the whole brief, and a check says so

## 📍 STATE — the only perishable block in this file · opened 2026-09-14

- **Next:** S2 — the design call that unblocks everything else: **where the shape lives, and in what
  unit the cap is counted.** Write the answer into this file (§ *The shape, decided*) before any code.
- **This part now has its own issue:** [#128](https://github.com/tpierrain/kenjaku/issues/128).
  [#119](https://github.com/tpierrain/kenjaku/issues/119) is the umbrella;
  [#126](https://github.com/tpierrain/kenjaku/issues/126) and
  [#127](https://github.com/tpierrain/kenjaku/issues/127) are parts B and C, untouched by this plan.
- **Blocked on:** nothing. **Owner's call pending:** three product questions listed under
  *Questions for the owner* below. **None of them blocks S1 or S2** — each is raised when its step is
  reached, one at a time, never as a list.
- **A session may, alone:** everything up to and including a green PR. **Not:** merge, tag, publish,
  or touch parts B/C.
- **Decided in conversation (2026-09-14):** part A ships first and alone, because it depends on none
  of the ambient-ingestion gates. That was already the study's conclusion, re-confirmed when the
  owner asked to restart on #119.

## Tracking

- [x] **S1 — Part A has its own issue**, so it can close on its own _(2026-09-14)_. #119 split into
      three: **#128** (part A, this plan), **#126** (part B), **#127** (part C); each part's text
      carried across verbatim. #119 kept as the umbrella, its body reduced to the shared problem
      statement plus the three links, so no status is stated twice. _(This was the study's S3.)_
- [ ] **S2 — The shape is written down ONCE, and the cap has a decidable unit**
  - [ ] S2.0 Decide where the shared shape lives. It must be imported, not restated: `prepare-1-1`
        already does exactly this for claim discipline (*"the full rules live in one place and this
        skill obeys them rather than restating its own"*) — follow that precedent.
  - [ ] S2.1 Decide the **unit of the cap**. The issue says *5 to 7 sentences*, and sentences are not
        decidable (abbreviations, decimals, quotes). A check that disagrees with the rule it enforces
        is worse than no check. Pick a unit a script can count without judgment, and say in the plan
        why it stands in for "one screen".
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

- **2026-09-14** — Issue #119 was filed as one issue with three parts. The same day, the ambient
  ingestion study measured that an unattended run reaches the owner's connectors, settled strategy 1
  for parts B/C, and recorded that **part A is independent and ships first**. This plan is that
  sentence turned into steps. The study keeps parts B and C; it is not superseded by this file.
