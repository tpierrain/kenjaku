<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- THE canonical plan for clearing the tracker. Opened 2026-08-23, hours    -->
<!-- after the v5.0.0 tag. Its first release (the bugfix one) shipped as      -->
<!-- v5.1.3 and its step detail is ARCHIVED; what is left is the rest of the  -->
<!-- tracker. It also INHERITS v5.0.0's post-tag tail.                        -->
<!--                                                                         -->
<!-- The `## 📍 STATE` block below is this file's only perishable content:    -->
<!-- ≤ 20 non-empty lines (CONVENTIONS §3ter), measured on hand-back by       -->
<!-- ~/.claude/hooks/plan-state-size-guard.mjs. Anything that will still be   -->
<!-- true next month goes DOWN into § History, never up there. Do not restate -->
<!-- the block here, in another file, or in a resume header.                  -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Action plan — clear the tracker, in two releases

## 📍 STATE — the only perishable block in this file · opened 2026-08-23

- **Next:** ▶️ **`v5.3`**, and its design is now WRITTEN in its own plan —
  [`v5.3-universe-disclosure-action.md`](v5.3-universe-disclosure-action.md) _(2026-09-12)_. **Resume
  from that file's `## 📍 STATE`**, not from § *Group 2*, which owns only the grouping he approved.
  **How far it has got lives there and only there** — a sentence about progress written here is a
  copy, and a copy goes stale (this one did, within a day).
- **Blocked on:** nothing — v5.3 can start today. **TWO things wait on him:** (a) **what the nightly
  mutation run is FOR**, a product call, now that the biggest package provably cannot fit in six hours
  → § *Inherited from v5.0.0*; (b) **the French wording shipped in v5.2.0** (ADR 0043's doctrine, the
  update skill's prompts) — live in the fleet, his to correct at leisure, gating nothing.
- Two older questions sit in § *Questions the owner owns*, **not to be re-asked** (#78's
  launcher-README link, `ci.yml`'s `concurrency`). Grouping, order and the three titles are decided.
- **A session may, alone:** work the active release test-first end to end on a branch, **label**
  issues, commit, push, and read what CI returns. **PREPARING v5.3 UNATTENDED was granted 2026-09-12**
  (« faire un clear et te laisser travailler en autonomie pour préparer la prochaine release ») — so a
  cleared session picks this up without asking. **Not:** write into `templates/fr/**` (one carve-out,
  § *History*) or into either of his two personal brains. ⚠️ **Cutting a release was granted ONCE**, by
  name, on 2026-09-12 (« vas y cut la release ») — **for v5.2.0 only**. Preparing ≠ cutting: ask again
  before tagging v5.3. ℹ️ A **plan-only push no longer starts CI** (his call, same day) — no run to
  read, and not a breakage. **No CI verdict is outstanding** — § *History*.
- **Already delivered:** v5.1.3 and v5.2.0, both archived — § *Group 1*, § *v5.1*. Lessons: § *History*.

## Tracking

> **The two-release split is the owner's, 2026-08-23**: *« ce serait bien de faire une petite issue
> pour bug fixer les issues remontées par Stefan ces prochains jours (une 5.1), puis de traiter les
> autres sujets en 5.2 »*. **The reason it is a good split, said out loud so nobody re-merges them**:
> the v5.1 issues are the only ones **people outside the project** took the trouble to report,
> and they are cheap. A contributor who is answered in days reports again; one who waits behind a
> nine-issue release does not. Everything in v5.2 is either the owner's own finding or the owner's own
> idea, and can wait a fortnight without anyone feeling ignored.

### v5.1 — delivered as v5.1.3, and its step detail is archived

Five issues, three subjects, shipped 2026-09-11 and archived the way §7 archives anything finished:
[`archived/2026-09-12-v5.1.3-bugfix-release-delivered.md`](../archived/2026-09-12-v5.1.3-bugfix-release-delivered.md).
That file holds the whole step detail — what was measured, what was rejected, the field rehearsal, the
mutation scores — and it is **the only place** that detail lives. Do not restate any of it here.

- [x] **Delivered** — [v5.1.3 — *The One Where It Stops Crying Wolf*](https://github.com/tpierrain/kenjaku/releases/tag/v5.1.3)
      _(2026-09-11 · `23efd5f` · [PR #97](https://github.com/tpierrain/kenjaku/pull/97))_. All five
      issues closed **with their evidence**, both reporters answered, marketing surface re-read, field
      rehearsal run against the branch on a real French brain.
- [ ] **One tail is open, and it needs the reporter rather than us** — the one-call throttling test
      behind [#80](https://github.com/tpierrain/kenjaku/issues/80): a plain search run from their own
      account, before any catch-up, which settles whether the ceiling was ours to trip. Nothing here
      can run it (their account, and the report is de-identified). It changes nothing that shipped —
      the pacing was written as the fix either way — so it is **a question to put to them**, not work
      to schedule.

### ✅ THE APPROVED PLAN — three releases, their order, and their titles

> **APPROVED BY THE OWNER, 2026-09-12** _(« ok nickel. On part sur cet ordre »)_, after he challenged
> the ordering himself — *« pourquoi ne pas faire le 3 en 1er ? »* — and the challenge **changed the
> plan**. What follows is no longer a proposal: it is the decided order, and a session may work it.

#### The order he validated, and the one thing that moved

**His challenge was half right, and the half that was right is now step 0.** Group 3 (the brain asks
less and speaks plainly) contains **two very different things**, and the proposal below had wrongly
treated them as one:

1. **a DECISION** — how the brain speaks, and when it may act instead of asking. Hours of writing, no
   code. It is what **governs every new string** the next releases will emit, and v5.2 emits two of
   them (#98's clickable question, #68's disclosure sentence). Doing it last would have manufactured
   debt in the exact dimension it exists to clean.
2. **the WIDE CLEAN-UP** of every existing string and prompt, in two locales. Weeks, and **no
   announceable end** — which is why it may not stand in front of a defect that silently loses a
   user's note.

**So the order is:** ① the decision, written as an ADR · ② **v5.2**, the five fixes · ③ **v5.3**, the
spheres · ④ **v5.4**, the wide clean-up. The decision **ships inside v5.2** rather than as a release
of its own: a release is how it reaches a brain, and there would be nothing else on the tin.

- 📌 **HIS STANDING INSTRUCTION, and it outranks any later re-ranking:**
  [#98](https://github.com/tpierrain/kenjaku/issues/98) **is in the next release, whatever happens**
  _(« je voudrais que l'issue 98 soit intégrée asap dans la prochaine release, quoi qu'il arrive »)_.
  It is also the cheapest of the five, so it may be taken **first** of them.

#### The three titles, settled 2026-09-12

The series convention holds: English, Friends-style `vX.Y.Z — The One …`, and **the em dash stays**
(it is a titling convention, never a mistake to fix).

| Release | Title, as agreed |
|---|---|
| **v5.2** | `v5.2 — The One Where Done Really Means Done` |
| **v5.3** | `v5.3 — The One Where It Says Which Universe It Answered From` |
| **v5.4** | `v5.4 — The One Where It Stops Talking Like a Dashboard` |

- **v5.3's title is HIS pick from three**, not the one this plan recommended _(« pour la 5.3 je
  préfère "The One Where It Says Which Universe It Answered From" »)_. Recorded so nobody
  re-optimises it: the other two candidates were *"…Stops Answering From the Wrong Universe"* and
  *"…the Universe Stops Drifting Without You"*.
- **v5.4's title is his own phrase** given back to him: the brain traded the magic for a dashboard.

#### Why three releases and not one — the reasoning, kept

**Grouping.** The thirteen fall into **three groups and a residue**, and the grouping is not by
component: it is by **what a user loses**. Two of the groups are the same defect wearing different
clothes — *the brain reports success it has not achieved* — and they differ in **what** it is wrong
about: what it **did** (group 1), and **where it is** (group 2).

**Urgency.** Only group 1 is urgent, and inside it exactly one issue can destroy something a person
cannot get back. Group 2 is damaging but recoverable. Group 3 is not a defect at all.

**One release or several? Several, and for the same reason the last split worked.** A release is the
unit in which a user can say *"ah, that is what changed"*. Thirteen issues in one release is a
changelog nobody reads and a rehearsal nobody can scope; three releases each have **one sentence** on
the tin. And the tail is cheap: v5.1.1, v5.1.2 and v5.1.3 all shipped within days of each other, so
the cost of cutting a release here is small and measured.

| | Theme, in one sentence | Issues | When |
|---|---|---|---|
| **v5.2** | *The brain stops reporting work it has not done.* | #77, #96, #81, #98, #83 | ✅ **shipped 2026-09-12** |
| **v5.3** | *You always know which sphere you are standing in.* | #72, #68, #66, #82, + **#100, #101** (riders) | **next**, design-first |
| **v5.4+** | *The brain asks less and speaks plainly.* | #79 | a chantier, not a release |
| — | Neither: #84 is now closed on evidence, two still wait on him | #62, #78's product half | see below |

**Grouping.** The thirteen fall into **three groups and a residue**, and the grouping is not by
component: it is by **what a user loses**. Two of the groups are the same defect wearing different
clothes — *the brain reports success it has not achieved* — and they differ in **what** it is wrong
about: what it **did** (group 1), and **where it is** (group 2).

**Urgency.** Only group 1 is urgent, and inside it exactly one issue can destroy something a person
cannot get back. Group 2 is damaging but recoverable. Group 3 is not a defect at all.

**One release or several? Several, and for the same reason the last split worked.** A release is the
unit in which a user can say *"ah, that is what changed"*. Thirteen issues in one release is a
changelog nobody reads and a rehearsal nobody can scope; three releases each have **one sentence** on
the tin. And the tail is cheap: v5.1.1, v5.1.2 and v5.1.3 all shipped within days of each other, so
the cost of cutting a release here is small and measured.

| | Theme, in one sentence | Issues | When |
|---|---|---|---|
| **v5.2** | *The brain stops reporting work it has not done.* | #77, #96, #81, #98, #83 | ✅ **shipped 2026-09-12** |
| **v5.3** | *You always know which sphere you are standing in.* | #72, #68, #66, #82, + **#100, #101** (riders) | **next**, design-first |
| **v5.4+** | *The brain asks less and speaks plainly.* | #79 | a chantier, not a release |
| — | Neither: #84 is now closed on evidence, two still wait on him | #62, #78's product half | see below |

#### Group 1 → `v5.2 — The One Where Done Really Means Done` — ✅ DELIVERED

- [x] **Shipped 2026-09-12** as
      [v5.2.0](https://github.com/tpierrain/kenjaku/releases/tag/v5.2.0) _(`11d3dba` ·
      [PR #99](https://github.com/tpierrain/kenjaku/pull/99))_. **The whole step detail is archived**
      and is the only place it lives:
      [`archived/2026-09-12-v5.2.0-done-means-done-delivered.md`](../archived/2026-09-12-v5.2.0-done-means-done-delivered.md).
      Do not restate any of it here.
- [x] Six issues closed with their evidence (#77, #81, #83, #96, #98, and #84 on the rehearsal), one
      commented rather than closed (#79: its decision shipped as ADR 0043, its sweep is v5.4).

#### Group 2 → `v5.3 — The One Where It Says Which Universe It Answered From`

> 📐 **Its step detail lives in its own plan, and that is the only place it lives**:
> [`v5.3-universe-disclosure-action.md`](v5.3-universe-disclosure-action.md) _(opened and designed
> 2026-09-12)_. Same split as v5.1.3 and v5.2.0 before it. **Do not restate its steps here** — what
> stays below is the grouping and the reasoning he approved, which is this plan's to own. The release
> plan also carries **ADR 0044** to ratify, and it absorbed the universe blind-spot plan (§ *The fold*).

**Why these four are one release and not four fixes.** They are one subject seen from four angles, and
fixing them one at a time is how four mechanisms end up disagreeing with each other. All four are
about the same gap: **the brain scopes one thing and leaves another unscoped, without saying so.**

- [ ] **1. A day spent in one sphere while the pointer names another is NOTICED** —
      [#72](https://github.com/tpierrain/kenjaku/issues/72). Measured: ten hours, fourteen notes filed
      correctly under one universe while retrieval served another, and **eight meeting preparations
      built on a corpus amputated of its most relevant half**. The writes were right, the pointer was
      right, and they disagreed in silence. *(This is the most damaging of the four, and it is the
      reason group 2 is not merely polish.)*
- [ ] **2. Switching says what it did NOT re-scope** —
      [#68](https://github.com/tpierrain/kenjaku/issues/68). Retrieval is scoped server-side; the
      conversation window still holds everything read from the sphere just left, so **the answer looks
      scoped and is not.** The issue's own first item is a single sentence of output and the issue says
      *"if only one thing ships from this issue, it should be this"* — **so ship that sentence early,
      even before the rest of the group is designed.**
- [ ] **3. A fact that must never be re-derived wrong survives a `/clear`** —
      [#66](https://github.com/tpierrain/kenjaku/issues/66). The spelling of a client's name, most of
      all. Today the workaround is to put it in the global `CLAUDE.md`, which leaks a per-sphere fact
      into every sphere — **the exact leak universes exist to prevent.**
- [ ] **4. `/sync` names the active sphere whenever there is more than one** —
      [#82](https://github.com/tpierrain/kenjaku/issues/82). The condition is wrong today: it announces
      only when the pull *changed* it, so a brain with three universes gets a full git report and not a
      word about the one piece of state a sync can actually carry. **The cheapest item of the four**,
      and it belongs here rather than in v5.2 because it is the same disclosure rule.
- [ ] **5. 🎁 RIDER, and it is not about spheres — an available update must be impossible to miss** —
      [#100](https://github.com/tpierrain/kenjaku/issues/100), filed and slotted here **on his explicit
      call, 2026-09-12** (« cette nouvelle issue je veux que tu la glisses dans la prochaine
      release »). Today a waiting release is one grey suffix on the session-start version line, and the
      owners who most need it — Claude Desktop, one endless auto-compacted conversation — see it
      **exactly once**, at the top of a conversation they can no longer scroll to. The issue asks for a
      three-option offer (`Install now` / `Remind me later` / `No thanks`) delivered through the
      per-prompt channel, with a reminder ladder he specified himself: 24 h after *later*; and after a
      *no*, +3 days, +5 days, +3 weeks, +2 months, then silence for that version.
  - [ ] 🔗 **It is the proactive half of [#98](https://github.com/tpierrain/kenjaku/issues/98)**, which
        shipped in v5.2.0: #98 fixed how consent is *collected* once the owner asks; this fixes how the
        owner learns there is anything to ask about. Same `AskUserQuestion` shape, same prose fallback.
  - [x] ✅ **The release title question is ANSWERED, 2026-09-12** _(« on garde le titre, tu peux y
        aller »)_. `The One Where It Says Which Universe It Answered From` **stays**, and the two riders
        get **their own paragraph** in the release note rather than a renamed release. Do not re-open
        this: the title is his pick from three, and a release note has room for a second subject.
- [ ] **6. 🎁 SECOND RIDER, same subject, same call — say how long an update takes** —
      [#101](https://github.com/tpierrain/kenjaku/issues/101), filed 2026-09-12 minutes after #100 and
      from a **real run**: he ran `/update-engine` on his own brain, confirmed #98's clickable buttons
      work, and named what is still missing. The consent message describes everything the update does
      and never says it is over in about a minute; the **only** number it carries today is the scary
      one (*"a few minutes"*, the reindex case). An unknown cost is postponed, and postponing is what
      leaves a fleet several releases behind.
  - [ ] 📏 **The figure is MEASURED, never estimated at the keyboard** — the §10ter field rehearsal this
        release runs anyway is where it comes from, and it is written down there. If it is not "under a
        minute", the sentence says what it really is.
  - [ ] 🔗 **One sentence, two places, identical wording**: `/update-engine`'s consent question, and
        #100's proactive offer. They are the two moments a person decides whether they have the time.
- [x] 🧭 **DONE 2026-09-12 — designed before code, and the ADR is named.** The design of all six items
      lives in [`v5.3-universe-disclosure-action.md`](v5.3-universe-disclosure-action.md), the ADR it
      proposes is **0044** (*a mechanism that narrows a scope states what it did not narrow*), and the
      blind-spot plan was folded in rather than left as a second dormant carrier — § *The fold*. It was
      read first, as this step asked, and **two of the issues' premises did not survive that read**
      (§ *History* of the release plan).

#### Group 3 → `v5.4 — The One Where It Stops Talking Like a Dashboard`

> ✂️ **SPLIT, 2026-09-12, and the split is the whole point.** Its **decision half is now step 0 of
> v5.2** (above). What stays here is the **wide clean-up**: the audit of every existing interaction
> point and every string, in two locales. That half is weeks with no announceable end, which is why
> it may not stand in front of a defect that silently loses a note.

- [ ] **The brain interrogates instead of acting** — [#79](https://github.com/tpierrain/kenjaku/issues/79).
      Graduated autonomy (silent / announce-then-do / genuinely ask) plus plain language in every string
      the brain emits. **It is not a bug and it must not be squeezed into a bugfix release**: step 1 is
      *ratify the model as an ADR*, and steps 2–4 are an audit and a reclassification of every
      interaction point the product has.
  - [ ] 🎯 **Why it still deserves a slot rather than the bottom of the list**: it is the only item on
        the tracker that is about **what the product feels like** — his own words were that the magic
        was traded for a dashboard. Groups 1 and 2 stop the brain lying; this one is why anyone wants
        it in the first place.
  - [ ] 🔗 **It also absorbs half of [#62](https://github.com/tpierrain/kenjaku/issues/62)** (plain
        language) and **should be designed after v5.3**, because #98's clickable question and #68's
        one-sentence disclosure are two live experiments in exactly the register this ADR has to fix.

#### Neither group: what is NOT in any release, and why

- ✅ **[#84](https://github.com/tpierrain/kenjaku/issues/84) — CLOSED 2026-09-12, on evidence rather
  than on a tag.** It had no work left: live sync shipped with `v5.1.0`, and the issue stayed open
  because a tag does not prove a **real brain received it**. v5.2's §10ter rehearsal ran against a real
  brain reporting `installed at v5.1.2`, which is that proof. **The pattern is the keeper**: writing a
  closing condition down in advance turned a wait into something that cost nothing.
- **[#62](https://github.com/tpierrain/kenjaku/issues/62) — blocked on a design answer, not on effort.**
  A friction is born inside a private vault and would travel to a **public** repository; the raw
  friction behind #61 named a client, three colleagues and a slice of their business. **The scrubbing
  is the feature**, and nobody can size a de-identification design before it exists. It stays out of
  every milestone until he decides what scrubbing means.
- **[#78](https://github.com/tpierrain/kenjaku/issues/78) — split it, and ship the half that is not
  blocked.** The engineering half (resolve a delivered file's links **from its installed location**) is
  ~20 lines plus tests and is blocked on nothing; the product half is one sentence from him
  (§ *Questions the owner owns*). **Recommendation: carry the resolver in v5.3** as a small rider —
  it is the same shape as v5.3's own subject, a checker that judges from the wrong vantage point.

#### The three things this proposal is deliberately NOT doing

- **Not one big release.** Thirteen issues make a changelog nobody reads, and §10ter's rehearsal
  becomes unscopeable when a release touches the write path, the update path and the universe pointer
  at once.
- **Not ordering by age.** #62 and #66 are the oldest and neither leads. Ordering by **what a user
  loses** is what put #77 first and left #79 for later — the same lesson as *judge content, not
  status* (§ *History*).
- **Not closing anything to make the count look better.** Every one of the thirteen was read tonight,
  and the two that are not scheduled say what would unblock them.

#### 🏷️ What this proposal put ON the tracker, and what it deliberately did not

Every one of the thirteen now carries its **type** (`bug` / `enhancement`, taken from its own title),
its **theme** (`silent failure`, `universes`, `what the brain claims`), and a **`proposed: …` label**
naming the release this proposal suggests. That is all: the labels say *proposed*, so nothing on the
tracker pretends to be a decision he has taken.

- ⚠️ **The `v5.2` MILESTONE still holds the OLD grouping** — #79, #78, #68, #72, #66 and #77 — and it
  is deliberately left alone. Milestones are how a release is actually cut, which makes them his, not a
  session's. **The labels and the milestone therefore disagree on purpose right now**, and the way to
  settle it is one pass over the milestone the moment he approves (or amends) the grouping above.
- **One type label was corrected rather than added**: #83 was filed as an `enhancement`, and its own
  title and body describe a **bug** — a true, sourced statement deleted from a message to an executive
  on the strength of a claim broader than its search.

## 🎙️ ✅ SETTLED — the trade-off pattern for *"should this one ride along?"*

> ✅ **CLOSED, 2026-09-12, by the proposal above and not by a third asking.** The bugfix release
> shipped without #77 (as he decided), and the proposal makes **v5.2 the very next release with #77
> leading it** — so the waiting is over without anyone re-opening the trade-off. **Do not put this
> question to him again.** It is kept because the trade-off below is the reasoning any future
> *"should this one ride along?"* should be argued with.
>
> _(Previously: "answered for now, 2026-09-11 — it waits", on his words « à l'issue de ça, on se
> reposera la question d'inclure ou pas le bug fix de la 77 ».)_

**#77 is the only open issue whose failure mode is silent data loss.** A note written by
`/consolidate` or `/file-back` lands on disk, the session prints `✓ Refreshed`, and nothing is
committed — so the brain's own promise (*everything I write is versioned, therefore revertible*) is
false for exactly those writes, and the user has no way to notice.

- **Leaving it in v5.2, as decided**: v5.1 stays a two-day, three-fix release with a single clean
  story to tell a contributor, and the loss window stays open for however long v5.2 takes.
- **Pulling it into v5.1**: closes the loss window sooner, and costs the clean story — #77 touches
  the engine's write path, so `CONVENTIONS.md` §10ter kicks in (a rehearsal on a copy of a real
  brain) and the *small* release stops being small.
- **Recommendation: leave it in v5.2 as he decided**, and mitigate instead: v5.1 is days, not weeks,
  and #77 is v5.2's first item rather than one of six. Only revisit this if v5.2 starts slipping past
  a week or two.

## 🧹 The fold that is owed — the universe reading list becomes part of the v5.3 group

_(Decided 2026-08-23 while sorting `prospective/`; announced in [`studies/README.md`](../../studies/README.md);
**not executed**, because the session stopped there. Re-aimed 2026-09-12: the group it folds into is
now **v5.3, group 2** of the proposal above — same three issues, plus #82.)_

- [x] **DONE 2026-09-12** — folded into
      [`v5.3-universe-disclosure-action.md`](v5.3-universe-disclosure-action.md)
      § *What the blind-spot plan contributed*, archived as
      [`archived/2026-09-12-harness-universe-blindspot-hardening-folded.md`](../archived/2026-09-12-harness-universe-blindspot-hardening-folded.md),
      and its line dropped from [`ACTIVE.md`](../ACTIVE.md). **M1 did not survive as a milestone**: it
      became a named-universe fixture inside each of that release's steps, which is where it can
      actually be enforced. **M2 became step 3**, where #72's guard is the second caller that finally
      justifies the shared vault-path codec. **M3 is still owed** and is tracked there.
- [x] **Why, and not just tidiness**: it is a plan nobody is working that says *why universe changes
      keep escaping green suites* — precisely the thing that group must not repeat. As a separate
      dormant plan it is read by nobody; as the group's own opening steps it is read by whoever fixes
      #68/#72/#66/#82. Two carriers for one subject is the shape that produced the thirteen-file pile.

- [ ] 🗂️ **And a second tidy-up, found 2026-09-12 while archiving the bugfix release**: §7 says the
      plans listing in [`maintainers/README.md`](../../README.md) is updated in the archiving change,
      and **no plan archived since 2026-08-23 is listed there** — the practice lapsed silently for
      roughly a dozen files. Deliberately **not** fixed one entry at a time tonight: a listing that is
      right for one file and wrong for twelve reads as complete. Either re-sync the whole section in
      one pass, or replace it with a link to the folder and let the filenames (date-prefixed since
      §7) be the index. **Recommendation: the second** — a hand-written mirror of a directory is a
      copy, and copies go stale, which is the very thing §3bis is about.

## 📓 33 observations on a real brain, never triaged

- [ ] [`studies/fleet-upgrade-field-feedback.md`](../../studies/fleet-upgrade-field-feedback.md) is a
      log of a real deployed brain crossing three versions. **33 of its observations have never been
      triaged** — each is either an issue worth filing or something to drop with a reason. Offered
      2026-08-23, not taken up. These are defects *seen on a machine*, which is the highest-value and
      least-read evidence in the repo.

## 🧊 Inherited from v5.0.0 — the tail that outlived its release

_(That plan is archived; these came here so it could close. They belong to no milestone.)_

### 🌙 THE NIGHTLY MUTATION RUN WAS READ AT LAST — and the two old causes are fixed, so these are NEW

_(Read 2026-09-12, off the five scheduled runs of 7 → 11 September, which is the window this plan
itself named: **"the cron of 7 September is the first that can produce a score; a red one that morning
is a NEW cause, not this one."** It was red all five mornings, and it is a new cause — two of them.)_

**The old diagnosis is retired by the evidence**: the job no longer dies in Stryker's initial test run.
It now gets past it and **mutates for hours**, so the truncated clone and the source-scanning guards
really were the whole of the old problem. What is happening now is different, identical on all five
nights, and it needs **no hand dispatch to see** — the cron already answers it:

| Job | Every night, five nights running |
|---|---|
| `mutate · rag` | ✅ **succeeds**, in ~1 h 45 |
| `mutate · local-mirror` | ❌ dies at **~23 minutes**, at roughly 349 of 1181 mutants |
| `mutate · scripts` | ❌ runs **exactly 6 h 00** and is cancelled by its own `timeout-minutes: 360` |

- [ ] 🧮 **`scripts` cannot fit, and that is arithmetic rather than a bug.** It is the package the
      speed work measured at **~36 s per mutant** locally at concurrency 5; the nightly runs at
      **concurrency 2 on a 4-vCPU runner**, over a package whose last full count was **9 833 mutants**.
      No timeout raise fixes that — 6 h is already the ceiling GitHub gives a job by default. **The
      honest options are to narrow what the nightly measures** (changed files, or one package a night)
      **or to stop scheduling the whole package** and keep §5quinquies' per-file discipline as the real
      instrument. This is a product call about what the nightly is *for*, and it is the owner's.
- [ ] 🔌 **`local-mirror` is killed, not timed out.** Its log ends *"The runner has received a shutdown
      signal"* with **no error of its own** and the progress counter frozen for the last ~30 seconds —
      the shape of a machine that ran out of memory or was reclaimed, not of a failing test. Same
      minute mark every night, which is too regular for bad luck. **Worth one look at the memory the
      Stryker workspace holds** before anything else is changed.
- 🙅 **What this retires**: *"dispatch the workflow by hand and read the score before trusting the
      cron"* was the rollout condition, and it is **satisfied by reading, not by dispatching** — five
      crons produced the reading, and a hand dispatch would only reproduce it at the same cost. The
      score itself is still unknown for `scripts`, and now for a reason that is understood.

- [ ] **The macOS flake gets an instrument.** Over 30 PR runs on the v5 branch: 25 green, 5 red, and
      **all five were the same test on macOS**, never Windows. It is inherited from `main`, not
      introduced, and it did not hold the tag. What is missing is not a fix but a measurement: record
      **which fail-open branch it takes** when it fails. `session-universe.mjs` deliberately kept its
      inline entrypoint spelling until after the tag precisely so this stays diagnosable.
- [ ] **The write guard, measured in the field (was S9-3).** Do its prompts become noise on a session
      that legitimately customizes an engine skill? Correct the first time, noise the tenth. Only
      living with it for a few days answers it, and the escape hatch (`/permissions`) already exists.
      **Nothing to build; something to notice.**
- [x] **The nightly mutation run on `main` fails every night, and it has TWO causes, not one**
      _(read at last 2026-09-02; unread since 2026-08-22)_. Every scheduled run still fails, back to
      2026-08-26 at least. Only `mutate · scripts` is red (`rag` and `local-mirror` pass), and it
      dies in Stryker's **initial test run, before a single mutant** — so the job has never been
      reporting a weak suite, it has been reporting an environment it cannot run in. Eight tests
      failed; the two causes split them four and four.
  - [x] **Cause 1, a truncated clone — fixed and ON `main` since 2026-09-06, PR
        [#89](https://github.com/tpierrain/kenjaku/pull/89)** (it superseded PR
        [#85](https://github.com/tpierrain/kenjaku/pull/85), closed).
        `mutation-nightly.yml` checked out with bare `actions/checkout@v4` (shallow, no tags) while
        every `ci.yml` job running these same suites pins `fetch-depth: 0`. Four of the eight need
        real history: the QA fixtures replaying a brain from tag `v3.6.0` (EN, FR and the CRLF one)
        and `every waived sha is a real commit that is still reachable`. A hand-dispatched run on
        the fix branch confirms it: **8 failures → 4**.
  - [x] **Cause 2, source-scanning guards versus instrumentation — FIXED** _(the owner picked
        option B, 2026-09-02; commits on the same PR)_. Four tests do not test behaviour at all,
        they **read the engine's own source text**: the byte fingerprints of a release's merge
        files, `every script an engine script SPAWNS is itself carried`, `no module composes a
        child-process request at the call site`, and the byte-dated doctrine fixture. Stryker's
        whole job is to **rewrite that source text** to inject mutants (157 files, 9 833 mutants),
        so those four failed under **every** configuration tried: `--inPlace` as CI runs it (4
        fail), the `batch` config (3), and the committed sandbox config worst of all (8 — it also
        lacks `.git`).
    - [x] **What was built**: `scripts/lib/instrumented-source.mjs` answers one question — has this
          text been rewritten by the runner — and each guard asks it about the very files it is
          about to read, standing down with a sentence that says so. Neither a false red nor a
          silent green, and it survives a rename, which a skip-by-name would not.
    - [x] **The trap it was written around, and it fired**: the detector is itself engine source,
          read by the guards it protects, so a detector matching the bare word would silence all
          four on a clean checkout with nothing to see. It matches the runner's HASHED identifiers,
          its own test pins that — and caught the module's own doc comment before the wiring
          existed.
    - [x] **Verified in CI's exact shape**: `--inPlace`, full scope, in a throwaway worktree —
          *"Initial test run succeeded … the dry-run has been completed successfully"*. The nightly
          can produce a score again.
    - [ ] **What is left, and it is the owner's**: merge PR #85, then **dispatch the workflow by
          hand and read the score** before the cron is trusted again — that was the rollout
          condition when this workflow was written, and no session should declare it met.
    - [ ] ⚠️ **A stale note to correct while nearby**: `stryker.scripts.batch.config.mjs` says
          *"the whole harness suite dry-runs green here"*. It was true on 2026-07-28, before these
          guards were written; it is now true again for a different reason, and the comment
          explains neither.

## 🙋 Questions the owner owns — asked, and NOT to be re-asked

Each of these was put to him and is waiting on nothing but him. They live here, out of the STATE
block, precisely so that a session reading STATE does not mistake them for pending work.

- ✅ **CLOSED — "does the issue that can lose a note ride along early?"** —
  [#77](https://github.com/tpierrain/kenjaku/issues/77). Asked **twice**; his answer on 2026-09-11 was
  *« à l'issue de ça, on se reposera la question »*. It is **answered by the proposal rather than by a
  third asking**: v5.2 is the next release and #77 leads it, so the wait cost nothing. The trade-off
  stays written out in § *SETTLED — the trade-off pattern* as the pattern for the next *"should this ride along?"*.
- **Is a brain's copy of the launcher README meant to link to the launcher's own docs at all?** —
  the product half of [#78](https://github.com/tpierrain/kenjaku/issues/78). Only he can answer it;
  the engineering half (resolve a shipped file's links from where it will be installed) does not wait
  on it.
- **Should `ci.yml` get a `concurrency` group?** — recommendation: yes. Offered **three times**,
  gating nothing. It waits here until he raises it.

## 📜 History — what this plan has closed, and what it learned

_Durable by construction: everything below is finished, or is a lesson. All of it sat in the
`## 📍 STATE` block until 2026-09-12, which is exactly how that block reached **197 lines**. Nothing
here expires, so nothing here needs re-reading at a resume._

### CI stopped running on plan-only commits, and the filter is guarded

_(2026-09-12, and it came out of a plain question: « c'est long, comment ça se fait ? »)_

- **What he was waiting on.** Three commits in a row, all Markdown, all plans. Each started **seven
  parallel checks** (the whole suite on three Node versions × macOS and Windows, plus the end-to-end
  install on Windows) and each made him wait on the slowest cell: **3 to 4½ minutes of Windows**, for
  files no test reads. The save-point rule produced the commits; `ci.md` made me read every result.
- **His rule, and it is now in the harness** (`rules/ci.md`, § *The suite judges the implementation*):
  the suite runs on **implementation**; it does **not** run on **record-keeping** (plans, issues); and
  **documentation is neither** — a doc change can change the behaviour the product *announces*, so it
  is a conversation with him, never a silent addition to the filter.
- **`maintainers/plans/**` is excused, and nothing else is.** A `paths-ignore` disables a net in
  silence — green, faster, and no line anywhere says a suite stopped running — so the list is **parsed
  by a test** (`scripts/lib/ci-path-filter.test.mjs`) that goes red the day it covers anything else.
  Written test-first: the guard was red on an assertion, not on a loading error, before the workflow
  changed. `templates/**` is the product and `maintainers/decisions/**` feeds the doctrine guards;
  neither will ever be in that list.
- ⚠️ **The consequence to remember at a resume**: after a plan-only push there is **no run to read**,
  and that is the design rather than a broken workflow.
- ✅ **And the guard's own Windows bug is fixed and PROVEN green** _(2026-09-12 · `2ed8a66` · CI run
  [34688317258](https://github.com/tpierrain/kenjaku/actions/runs/34688317258), 3 min 30, every check
  passing — read on the resume of the same day)_. The guard read the workflow file with a POSIX-only
  line split, so on Windows it saw **one single line**, found no `paths-ignore` entry in it, and
  reported the cheerful conclusion that the filter *"filters nothing"* — a net that judged itself
  green while measuring nothing. **The lesson is the one this whole section is about**: the guard that
  watches a silent net was itself silently blind, and only the cross-platform run could say so.

### The state block was itself the defect, and the rule already existed

_(2026-09-12, after a re-read of that block found **six** false entries in it.)_

- **The diagnosis is not length, it is mixture.** He proposed shorter plans; the evidence refused it.
  The worst of the six (*"the note lives only in a scratchpad"*) sat **four lines** from the entry
  contradicting it, so brevity would not have saved it; two others were falsified by the **outside
  world** (a new issue opened, a question answered), which no length protects against; and the long
  passages are what **prevented** mistakes that week (the de-identification constraint, *"do not lead
  with that number"*, #95's false premise). The real cause is that the block **mixed what expires with
  what never does** — history and lessons — so it grew, and once it is long the writing habit degrades
  from *re-read and correct* to *append on top*.
- **And the written rule was already there, which is the uncomfortable part.** `CONVENTIONS` §3ter has
  said *four keys, ≤ 20 lines* since 2026-08-22, and the harness's own `plans.md` says the save point
  is a **re-read**, never an append. Both were obeyed in spirit; neither was ever **measured**. So this
  was never a missing rule — it was a rule with no machine, which is the shape that fails silently.
- **What was done about it** _(2026-09-12)_:
  - [x] A machine-local hook, `~/.claude/hooks/plan-state-size-guard.mjs`, measures every **live**
        plan's STATE block on hand-back and names the ones over cap. It **counts lines and judges no
        content**, so it cannot be wrong about prose, and costs a millisecond. Archived plans are never
        counted: a guard that shouts about frozen history becomes noise, and noise gets switched off.
        43 self-tests, each verified to fail against a deliberately broken copy.
  - [x] The cap is **§3ter's own number (20)**, not a new one. One number in the prose and in the
        machine, or the machine teaches a second rule.
  - [x] The durable half moved down here; the delivered half moved to the archive. The block went
        **197 → under 20**.
  - [x] ⚠️ **The hook is machine-local, like `plan-carrier-guard`, so it does not travel.** Same
        belt-and-braces split as everywhere else: the rule is written in `CONVENTIONS` §3ter (the
        belt, it arrives with the clone) and the hook is the braces (it runs only where installed).

### The three unmerged branches were judged and dealt with

_(Closed 2026-09-09.)_ Each needed a **different** treatment, and *"merge the three"* was a bad
recommendation the owner caught, because it was made on their **status** (unmerged) rather than on
**whether what they said was still true**. Outcome: the two-humans study **merged** with a dated note
(which also repaired #84's link to a file `main` did not have); #80's analysis **transplanted by hand**
into the release, framing left behind; the mutation branch **dropped** as superseded, its target having
been archived with v5.0.0. All three branches are deleted, remote and local.

- 🔖 **The two commits that never merged, so their text stays recoverable** (`git show <sha>`, for as
  long as the remote keeps them): `docs/v5.1-takes-the-silent-source` → **`d983fd4`** ·
  `fix/mutation-debt-entrypoint-and-git-value` → **`ec339dd`**.
- 📌 **The reusable half is the lesson** — *judge content, not status*: never recommend
  merge / keep / drop from *"unmerged"* or *"old"*. Read it, and check it against today's code.

### "v5.1" in this file is a section name, not a version

The tag *The One with the Duo Mode* took `v5.1.0` on 2026-09-06 and carried none of these issues (this
plan was parked behind that work, by the door's own ordering). The bugfix release went out as
**`v5.1.3`** on 2026-09-11. Record of the earlier tag:
[`../archived/v5.1.0-code-review-fixes-action.md`](../archived/v5.1.0-code-review-fixes-action.md).

### A headline that went false under its own children — left on the record

The STATE block's opening line read *"on a branch, and nothing is merged or tagged"* for most of
2026-09-11, and was made false by the entries **nested under it**. That is the whole reason the
always-loaded save-point rule now says the save point is a **re-read of the block from the top**, never
an append to it. Kept here on purpose: it is the cheapest illustration of the failure the cap prevents.

### The `templates/fr/**` clause contradicts the EN/FR drift guard

This plan forbids a session to write into `templates/fr/**`. That clause was breached **twice** on
2026-09-11, deliberately, and the reason is structural rather than a judgement call: four of the
localized files are watched by the EN/FR drift guard, whose criterion is **unpaired commits**. An
English-only commit on any of them turns the suite red and leaves every later commit of the release
ambiguous. So the clause as written **cannot be obeyed** on a file the guard watches without abandoning
green-only commits.

- ⚖️ **Either the clause gains a carve-out for guard-watched pairs, or the guard gains a waiver path.**
  It is a contradiction in this plan, not a rule that was ignored. Until it is resolved, the standing
  practice is: ship both halves in one commit, and say so. **The French wording is his to correct**;
  nothing else under `templates/fr/**` is touched.

### The tracker has only ever come down on evidence, never by a bulk sweep

Since this plan opened, **seven** issues closed: #90 and #92 (v5.1.2 and v5.1.1, the latter on measured
field evidence), then the five the bugfix release carried — #71, #73, #74, #80, #95 — each closed with
a comment saying what shipped and how it was checked. Everything still open is open **deliberately**:
this plan says those are not started, and *not started* is not *closeable*.

- 🧾 **What the bugfix release did NOT close was reviewed one by one** (the half of §10bis that is easy
  to skip). The only near-miss was [#83](https://github.com/tpierrain/kenjaku/issues/83) — *an absence
  claim stated as general when only the vault and the chat tool were searched* — which shares #80's
  subject and is a **different defect**: #80 is *"the source could not answer"*, #83 is *"the claim is
  broader than what was searched"*. Fixing one does not fix the other.

### #96 was filed, not worked

_(2026-09-09, his instruction.)_ [#96](https://github.com/tpierrain/kenjaku/issues/96) — a **second
machine silently misses part of an engine update**. He suspected it out loud and reading the code
confirmed it: the Layer B self-heal gate (`self-heal-detect.mjs`) asks only *"is a skill missing?"* and
*"is an MCP server missing?"*, so a release that ships **a new hook**, **a new allowlist entry** or **a
new npm dependency** never triggers a reconcile on the machine that merely pulled. Same shape as the
harness drift he hit the day before: the files travel, the wiring that makes them run does not.

### Inherited from the v5.1.0 tag — ✅ discharged

[#84](https://github.com/tpierrain/kenjaku/issues/84) waited on one thing only: a real brain receiving
the live sync. **Closed 2026-09-12** out of v5.2's §10ter rehearsal — see § *Neither group*.

## How each release is cut, when it gets there

Nothing new to invent: `CONVENTIONS.md` **§10** (re-read the marketing surface), **§10bis** (sweep the
tracker and close what the release covers — and these two are its first customers), **§10ter** (a
release that changes the update path owes one rehearsal on a copy of a real brain), **§11** (the note
is written for the non-developer first), **§7** (plan done = archived).

- **v5.1** touches `/lint` only, which is read-only over the vault: **§10ter does not apply**, and
  that is a large part of why it can ship in days.
- **v5.2** almost certainly triggers §10ter through #77, which changes what gets written into a
  brain. Budget the rehearsal rather than discover it at the tag.
