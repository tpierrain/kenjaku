<!-- ════════════════════════════════════════════════════════════════════════════════════════════ -->
<!-- P-MERGE PROPOSAL. This is NOT the live README. It is the annotated skeleton of the future         -->
<!-- README.md, produced for 12c/12d review. Each section carries a SOURCE / TARGET annotation so the -->
<!-- provenance and the length budget are visible. Approve here, then execute the real rewrite in 12d.-->
<!-- ════════════════════════════════════════════════════════════════════════════════════════════ -->

# Future `README.md`: annotated skeleton (P-MERGE proposal)

**Principle: one claim, one owner.** README owns the shop window + the install CTA + a handful of
non-delegable practical blocks. Everything deep is *pointed at*, never re-copied. Target for the whole
file: **~300 to 340 lines** (today's README is 798; MARKETING is 400).

**Source tags used below:**

- `[M]` = comes from `MARKETING.md` (the arc + the boards).
- `[R]` = comes from the current `README.md` (kept, often compressed).
- `[R→SETUP]` = lives in README today, **moves down to `SETUP.md`**; README keeps a one-line pointer.
- `[R→CONNECTORS]` = moves to `CONNECTORS.md`; README keeps a compact table + pointer.
- `[LINK]` = pointer only (EN-QUOI / ADRs / skills self-document).

---

## Proposed order (why -> what -> CTA -> vision -> tech)

> Rationale: the R5/R7 arc warms a cold, non-tech reader first (why -> what's in it for me), **then**
> the install CTA lands while they're convinced, **before** the heavy tech. The nav chip up top still
> jumps straight to install for the impatient.

### 1. Hero
<!-- SOURCE: [M] hero + [R] logo & badges · TARGET ~10 lines · STAYS. -->

```markdown
# Kenjaku — your second brain &nbsp;<img src="docs/img/rag-inside.svg" alt="RAG inside" height="34" valign="middle">

## Never miss what matters, and never drown in the rest.

### 🧠 *Just ask. Sit down and relax.* — your second brain handles the rest.

*By Thomas Pierrain (VP Tech at shodo)*
```

### 2. Badges (5, verbatim from today's README)
<!-- SOURCE: [R] · TARGET ~6 lines · STAYS. Anchors must be re-pointed to the new section slugs (see §Anchors). -->

```markdown
[![Latest release](…)](…/releases/latest)
[![Privacy: local by default](…)](#privacy-à-la-carte)
[![Runs on macOS and Windows](…)](#-install-your-brain-in-one-paste)
[![Engine: self-upgradable since v3.0.0](…)](#keeping-your-brain-up-to-date)
[![Mutation tested with Stryker](…)](…/maintainers/mutation)
```

### 3. Hero board + one-line promise + nav chips
<!-- SOURCE: [M] board-hero + promise · [R] nav chips · TARGET ~8 lines · STAYS. -->

```markdown
<img src="docs/img/board-hero.png" alt="…" width="100%">

**Ask it like a personal assistant, no dev skills required, and pull up any decision or piece of info
in seconds, always with the sources.** *In Claude Desktop or on the command line, your call.*

**[🧠 What's a second brain?](#what-is-a-second-brain) · [🚀 Install yours now](#-install-your-brain-in-one-paste) · [📖 View the articles](#the-article-series)**

<sub>🧠 *Why "Kenjaku"? …Jujutsu Kaisen wink; repo stays `second-brain-generator`.*</sub>
```

### 4. Two worked dialogues (the anti-bullshit anchor)
<!-- SOURCE: [R] billing + MEDDIC 🧑/🧠 examples · TARGET ~14 lines · STAYS.
     These beat MARKETING's icebreaker on R5 concreteness; keep them, they show the product answering with sources. -->

### 5. Why you need it
<!-- SOURCE: [M] act 1 · TARGET ~10 lines · STAYS. icebreaker quotes + the ache. -->

### 6. What it does for you (never forget · never let anyone down · never drown)
<!-- SOURCE: [M] · TARGET ~26 lines · STAYS. the 3 win-boards + board-affordance + the all-audience note. -->

### 7. How a question flows
<!-- SOURCE: [M] · TARGET ~10 lines · STAYS. board-flow + stale-while-revalidate + the auto-save/backup blockquote. -->

### 8. What it is, and what it is not
<!-- SOURCE: [M] · TARGET ~10 lines · STAYS. the honest scope table. Detail -> [LINK] EN-QUOI §7. -->

### 9. More than search, an extensible platform of skills
<!-- SOURCE: [M] board-skills · TARGET ~8 lines · STAYS. Each skill self-documents via its SKILL.md [LINK]. -->

### 10. How it compares
<!-- SOURCE: [M] · TARGET ~28 lines · STAYS. vs bare LLM + vs Karpathy wiki + side-by-side matrix (3 boards + 1 matrix). -->

### 11. Privacy, à la carte
<!-- SOURCE: [M] board-privacy + table · TARGET ~16 lines · STAYS (summary).
     The training-controls / consumer-plan-uncheck / provider detail -> [R→SETUP] SETUP §9 (README keeps 1 pointer line). -->

### 12. 🚀 Install your brain in one paste  ← THE CTA, PROMOTED HIGH
<!-- SOURCE: [R] condensed · TARGET ~44 lines · STAYS but COMPRESSED. Non-delegable: the paste command must be IN the README. -->

```markdown
**Your only hands-on move:** open Claude and paste this one sentence (adapt the name & URL).

    Install me a second brain named "second-brain" (name to be confirmed) from this generator:
    https://github.com/tpierrain/second-brain-generator

Claude does everything else: clones the launcher, asks a few questions in chat, runs the installer,
builds your brain and proves it works.
```

Keep IN README (compressed):
- **What you need** (Claude Code, Node >= 20, git), 3 lines. `[R]`
- **The one privacy choice at install** (1 line + jump to §11). `[R]`
- **The #1 Desktop trap** (open your brain in a NEW conversation via the folder chip): a **compact**
  callout + the 2 screenshots, then *"full walk-through in SETUP"*. `[R]` (compressed from ~40 to ~12 lines)

Delegate to SETUP `[R→SETUP]`:
- full step-by-step install, the 3 moves, launcher-vs-brain ASCII, key-in-`.env` detail, remote/backup.

### 13. Keeping your brain fresh: universes · engine updates · importing an old brain
<!-- SOURCE: [R] · TARGET ~18 lines · COMPRESS to one short paragraph each + a pointer.
     - Universes: 3 lines + [LINK] skill `switch`.
     - Engine self-upgrade: 3 lines (ask, confirm, notes untouched) + [R→SETUP] SETUP §10.
     - Import a pre-v3 brain: 3 lines + [LINK] skill `import`.
     Today these are 3 full sections (~90 lines); they become 3 short paragraphs. -->

---
<!-- ── THE HINGE -> ACT 3 (for the technically curious) ── -->

### 14. Battle-tested, because it has to be effortless
<!-- SOURCE: [M] hinge · TARGET ~8 lines · STAYS. -->

### 15. What Kenjaku is, as software (more than Markdown)
<!-- SOURCE: [M] board-anatomy + component list · TARGET ~24 lines · STAYS. -->

### 16. What's in the box: reliability, determinism, robustness
<!-- SOURCE: [M] board-determinism + board-reliability + catalog A–F · TARGET ~40 lines · STAYS.
     This SUPERSEDES the old README "Under the hood" tables (what's in the box / internal tooling): those move to [R→SETUP]. -->

### 17. Reliability, measured
<!-- SOURCE: [M] · TARGET ~8 lines · STAYS. eval-set 90% + mutation 90–97%. -->

### 18. And how it's built (one stable port, swappable adapters)
<!-- SOURCE: [M] board-hexagon SVG · TARGET ~10 lines · STAYS. -->

### 19. Your brain isn't tethered to this repo
<!-- SOURCE: [M] board-generator (moved here in 12b-bis) · TARGET ~16 lines · STAYS. -->

### 20. Wiring up your sources (connectors)
<!-- SOURCE: [R→CONNECTORS] · TARGET ~14 lines · COMPRESS. native vs MCP in 2 lines + a compact table + pointer to CONNECTORS.md.
     Today ~40 lines; the full menu already lives in CONNECTORS.md, so README keeps only the starter table. -->

### 21. The article series
<!-- SOURCE: [R] · TARGET ~8 lines · STAYS. the 4 ordered Medium links (credibility). -->

### 22. Going further
<!-- SOURCE: [M] · TARGET ~8 lines · STAYS. links: EN-QUOI · SETUP · CONNECTORS · ADRs · Medium. -->

### 23. License
<!-- SOURCE: [R] · TARGET ~8 lines · STAYS. Apache-2.0 + attribution terms (legal, conventional at README bottom). -->

---

## What DROPS out of README at merge (moves down, README points instead)

<!-- These are the old-README blocks that become SETUP/CONNECTORS-owned. README keeps at most a pointer line. -->

- Full install step-by-step, the 3 moves, launcher-vs-brain ASCII diagram -> **SETUP** (README: compact CTA only).
- Backing up / multi-machine detail -> **SETUP §7**.
- Engine-update how-to (mental model, engine-manifest, sacred files, npm/git/network) -> **SETUP §10**.
- Import-old-brain how-to (safety, universes stamping, manual follow-ups) -> **SETUP** + skill `import`.
- Privacy training-controls detail (Claude plans, Gemini free-tier caveat) -> **SETUP §9**.
- "Under the hood" tables (what's in the box / skills you call / internal tooling), the 4-phase ASCII,
  the vocabulary glossary -> **SETUP** (the visual A–F catalog + boards replace them in README).
- Full connectors menu, transcripts note, wizard detail -> **CONNECTORS.md**.
- Notes for Claude Desktop users (warm engine / RAM) -> **SETUP** troubleshooting.
- OKF roadmap note, ROC provenance -> **EN-QUOI** (differentiator prose).

## What DIES (de-dup)

- **`MARKETING.md` as a separate file**: its content becomes the README (via `git mv` or a rewrite +
  delete). Keeping both is the exact divergence debt 12c kills. A `MARKETING.md` -> `README.md` redirect
  note can be left in git history only.

## Anchors to preserve or re-point (badges + external links depend on them)

<!-- Breaking these silently would 404 the badges and any shared deep-link. Re-point at merge. -->

| Old anchor (README main) | Fate |
|---|---|
| `#ready-to-try-it` | -> `#-install-your-brain-in-one-paste` (keep an `<a id="ready-to-try-it">` alias) |
| `#and-the-privacy-of-my-data` | -> `#privacy-à-la-carte` (alias) |
| `#keeping-your-brain-up-to-date-its-engine` | -> `#keeping-your-brain-fresh…` (alias) |
| `#how-do-i-choose-my-semantic-search-my-rag` | -> `#privacy-à-la-carte` or a SETUP anchor (alias) |
| `#what-is-a-second-brain` | nav chip: keep or re-point to §5/§6 |
| `#the-article-series` | unchanged (§21) |
| `#under-the-hood` | -> `#whats-in-the-box…` (alias) |
| `#one-brain-several-universes-optional` | -> §13 (alias) |
| `#wiring-up-your-sources-connectors` | unchanged-ish (§20) |

> Practical rule: at merge, keep an invisible `<a id="old-slug"></a>` alias next to each renamed
> section so existing badges and shared links never 404. Cheap insurance.

## Rough length budget

| Zone | Sections | ~lines |
|---|---|---|
| Hero + nav + dialogues | 1–4 | ~40 |
| Act 1 (why -> what -> compare -> privacy) | 5–11 | ~110 |
| Install CTA (compressed) | 12–13 | ~62 |
| Hinge + tech zone | 14–19 | ~110 |
| Connectors + articles + going-further + license | 20–23 | ~40 |
| **Total** | | **~360** (trim to ~320 in pass 2) |
