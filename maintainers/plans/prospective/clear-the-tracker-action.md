<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- THE canonical plan for clearing the tracker. Opened 2026-08-23, hours    -->
<!-- after the v5.0.0 tag. It spans TWO releases by the owner's call the same -->
<!-- evening: v5.1 fixes only what an outside contributor reported, v5.2      -->
<!-- takes the rest. It also INHERITS v5.0.0's post-tag tail.                 -->
<!-- The `## 📍 STATE` block below is this file's only perishable content:    -->
<!-- do not restate it here, in another file, or in a resume header.          -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Action plan — clear the tracker, in two releases

## 📍 STATE — the only perishable block in this file · opened 2026-08-23

- 🧭 **THREE BRANCHES CARRY WORK THAT NEVER REACHED `main`, AND ONE OF THEM IS LINKED FROM AN OPEN
  ISSUE** _(2026-09-09, found while deleting the merged branches at the owner's ask)_. The 14 merged
  branches are gone, remote and local. The **three that remain are unmerged, have no PR, and each
  holds content absent from `main`**:
  - `docs/study-two-humans-one-brain` — **`maintainers/studies/two-humans-one-brain-study.md` (311
    lines) exists nowhere on `main`**, yet [#84](https://github.com/tpierrain/kenjaku/issues/84) cites
    it by path as its background ("candidate 4"). **The issue points at a file the repo does not
    have.** Same family as [#78](https://github.com/tpierrain/kenjaku/issues/78).
  - `docs/v5.1-takes-the-silent-source` — 64 lines into **this very plan**, about a second outside
    report on silence. Whatever it says was never folded in here.
  - `fix/mutation-debt-entrypoint-and-git-value` — 18 lines into `v4.9.0-mutation-debt-plan.md`,
    re-measuring the entrypoint debt as *larger than filed*.
  - ⚠️ **"Merge the three" was a bad recommendation, and the owner is the one who caught it**
    _(2026-09-09: «is this documentation correct? Is it aligned with the thing or not? Because
    otherwise, there's no interest?»)_. It was made **without reading the content** — on the fact that
    the branches were unmerged, not on whether what they say is still true. Read, they turn out to
    need **three different treatments**:
    - **The study → merge, with a dated note.** Its facts were checked against the code on 2026-09-01
      and nearly all still hold. **Two drifted, and only two**: live sync shipped as v5.1.0 five days
      later, so §2's *"multi-machine sync is a clone plus rehydrate"* bullet is out of date, and §6's
      **candidate 4 is now DONE, not a candidate**. Merging repairs #84's dangling link at the same
      time.
    - **`silent-source` → transplant by hand, do NOT merge.** Its analysis of
      [#80](https://github.com/tpierrain/kenjaku/issues/80) exists **nowhere in `main`** — no plan in
      this repo mentions #80 at all — and it carries a constraint that would be lost with it: the
      report was **de-identified at the owner's ask** (it named a person, a company and mailbox
      content), so nothing identifying may reach the issue, the plan or a release note. It also names
      the one design call (a known-positive control query per connector, so *empty* stops looking like
      *down*) and a French-twin trap. But its **framing is stale** — it plans a "v5.1" that shipped as
      something else entirely — and this file has moved on by **9 commits** since. Lift the #80
      section into the current plan; do not let the merge fight over the STATE block.
    - **`mutation-debt` → drop the branch, salvage two lines.** Its target,
      `prospective/v4.9.0-mutation-debt-plan.md`, was **archived with v5.0.0**, so merging resurrects a
      deleted file at a dead path. And its headline number has decayed: of the **9** scripts it named
      as having no test sibling, **3 now have one** (`session-status`, `status-line`,
      `upstream-check-run`). What survives is the remaining **6** (`import-brain`, `open-env`,
      `pick-folder`, `run-eval`, `update-engine`, `verify-rag`) and its real finding — *the debt is not
      the predicate, it is that the body inside the guard cannot be imported*.
  - ✅ **DONE — the owner said go, 2026-09-09, and the three-way treatment was applied in full.** The
    study is **merged** with a dated header note; #80's analysis is **transplanted** into the Tracking
    section below; the mutation branch is **classified as superseded** in the plan that owns that debt.
    All three branches are now **deleted**, remote and local.
    - 🔖 **The two commits that were never merged, recorded so their original text stays recoverable**
      (`git show <sha>` works for as long as the remote keeps them):
      `docs/v5.1-takes-the-silent-source` → **`d983fd4`** · `fix/mutation-debt-entrypoint-and-git-value`
      → **`ec339dd`**. Nothing in either is lost from `main`: what survived was carried over by hand,
      and what did not is named above with the reason.
- 🆕 **A NEW ISSUE LANDED THE SAME EVENING, AND IT IS NOT SCHEDULED** _(2026-09-09)_:
  [#96](https://github.com/tpierrain/kenjaku/issues/96) — a **second machine silently misses part of
  an engine update**. The owner suspected it out loud, and reading the code confirmed it: the Layer B
  self-heal gate (`self-heal-detect.mjs`) asks only *"is a skill missing?"* and *"is an MCP server
  missing?"*, so a release that ships **a new hook**, **a new allowlist entry** or **a new npm
  dependency** never triggers a reconcile on the machine that merely pulled. He asked for it to be
  **filed, not worked**. It is the same shape as the harness drift he hit the day before: the files
  travel, the wiring that makes them run does not.
- 📉 **THE TRACKER IS AT 17 OPEN ISSUES, not 18** _(2026-09-09, on the owner's ask to close what
  deserved closing; 16, plus #96 above)_. Two came off, **both on evidence and neither by this plan's
  sweep**:
  [#90](https://github.com/tpierrain/kenjaku/issues/90) (restart nudge, v5.1.2) and
  [#92](https://github.com/tpierrain/kenjaku/issues/92) (brains shipping the launcher's CI, v5.1.1) —
  the latter closed on measured field evidence from `~/mind-palace`. **Zero PRs were open.** Every
  other issue was left open deliberately: this plan says they are not started, and *not started* is
  not *closeable*. The sweep proper is still entirely ahead.
- 🏷️ **THE NAME "v5.1" IN THIS FILE NO LONGER MATCHES THE RELEASE THAT WENT OUT** _(2026-09-06)_.
  **v5.1.0 was cut today** — *The One with the Duo Mode*, two people on one brain and two machines
  staying in step — and it carried **none** of the three issues below. That is not a slip: this plan
  was deliberately parked behind that work, by the door's own ordering. So read every *"v5.1"* here
  as **"the next bugfix release"**, whose number (`v5.1.1`? folded into `v5.2`?) is the owner's call
  and is **not** being asked of him again — the three issues are ready to work whatever it ends up
  being called. Record of the tag:
  [`../archived/v5.1.0-code-review-fixes-action.md`](../archived/v5.1.0-code-review-fixes-action.md).
- **Next:** **v5.1's five issues, and nothing else** _(2026-09-09: #80 joined when its analysis was
  recovered from an abandoned branch; 2026-09-11: #95 joined at the owner's ask)_. **Three** subjects,
  and the third is the only one not reported from outside: the checker that cries wolf
  ([#71](https://github.com/tpierrain/kenjaku/issues/71),
  [#73](https://github.com/tpierrain/kenjaku/issues/73),
  [#74](https://github.com/tpierrain/kenjaku/issues/74)), a source that goes quiet without saying so
  ([#80](https://github.com/tpierrain/kenjaku/issues/80)), and a no-hard-wrap rule that guards files
  but not the text copied out of the chat
  ([#95](https://github.com/tpierrain/kenjaku/issues/95)) → § *v5.1*. The milestone on GitHub carries
  all five and stays **bug-fix only**: the owner's call when he added #95, *"#95 décrit un bug plus
  qu'une nouvelle feature"*.
- ▶️ **WORK IS UNDERWAY, autonomously, since 2026-09-11** — he said go and left. Order: **#95 first,
  then the rest of the release.** Branch `fix/v5.1-bugfixes`. Per this file's own permissions a
  session may work it test-first end to end and push the branch, but may **not** tag, publish, merge
  to `main`, write into `templates/fr/**`, or touch either of his real brains.
  - [x] **#95 — the no-hard-wrap rule** _(`c50d5ad`, `13f3f31`)_. The net it names had to be built
        first: it existed only inside his brain, never in this repo.
  - [x] **#71 / #73 / #74 — the checker that cries wolf** _(`d797707`)_.
  - [ ] **#80 — a silent source**. In progress; it is the only one of the five carrying a design call.
  - [ ] **Step 8 — answer the reporters, and the release note.** Not startable until the tag's number
        is his call.
- 🎙️ **ONE QUESTION IS EXPLICITLY DEFERRED, NOT PENDING** _(2026-09-11, his words)_: whether
  [#77](https://github.com/tpierrain/kenjaku/issues/77) rides along in v5.1. **"À l'issue de ça, on se
  reposera la question."** So § *THE ONE QUESTION* is answered for now — **not in this release** — and
  is re-opened only once the five above are done. Do not raise it before then.
- **Blocked on:** nothing. The three `/lint` defects have obvious tests and no design question. #80
  needs **one** design call, named in its own step (what a known-positive control query looks like per
  connector), and nothing else. A session may open the release today, test-first.
- **Owner's call pending:** **NONE right now.** The one that was pending — § *THE ONE QUESTION*,
  should [#77](https://github.com/tpierrain/kenjaku/issues/77) ride along in v5.1? — he **deferred on
  2026-09-11**: not in this release, re-asked once the five are done. See the deferral entry above.
  - ⏸️ **Two inherited questions, deliberately not re-asked.** (1) Inside #78, a product question only
    he can answer: *is a brain's copy of the launcher README meant to link to the launcher's own docs
    at all?* (2) The `concurrency` group for `ci.yml` (recommendation: yes) — offered three times,
    gating nothing. **Do not offer either a fourth time**; they wait here until he raises them.
- 🎯 **INHERITED FROM THE v5.1.0 TAG, and it is this plan's now** _(2026-09-06)_: close
  [#84](https://github.com/tpierrain/kenjaku/issues/84) **when a real brain has received the live
  sync** — the tag alone does not prove that, which is why it was not closed on publication.
- **A session may, alone:** work **v5.1** test-first end to end, and write the macOS flake's
  instrument (§ *Inherited from v5.0.0*). **Not** tag, publish, push to `main`, write into
  `templates/fr/**`, or write into either of his two real brains.
- **One tidy-up is decided and NOT done** — § *The fold that is owed*. Five minutes of editing; it
  belongs to whoever opens v5.2's universe group.
- 🙋 **ONE THING WAITS ON THE OWNER AND ON NOBODY ELSE** _(2026-09-02; the merge half is now done,
  2026-09-06)_: **dispatch the nightly mutation workflow by hand and READ the score.** Both causes of
  its fortnight of red are fixed and verified in CI's own shape (§ *Inherited from v5.0.0*), and the
  truncated-clone fix is **on `main` since 2026-09-06** — carried by
  [PR #89](https://github.com/tpierrain/kenjaku/pull/89) (merged, `ae8671a`), **not** by
  [PR #85](https://github.com/tpierrain/kenjaku/pull/85), which was **closed as superseded**: five of
  its seven commits had already landed through v5.1.0, so it was five days behind `main` and a rebase
  would have replayed present work. What remains is only the reading: "dispatch and read before
  trusting the cron" is the rollout condition that workflow was written with, and no session may
  declare it met. The cron of **7 September** is the first that can produce a score; a red one that
  morning is a NEW cause, not this one.

> **The two-release split is the owner's, 2026-08-23**: *« ce serait bien de faire une petite issue
> pour bug fixer les issues remontées par Stefan ces prochains jours (une 5.1), puis de traiter les
> autres sujets en 5.2 »*. **The reason it is a good split, said out loud so nobody re-merges them**:
> the v5.1 issues are the only ones **people outside the project** took the trouble to report,
> and they are cheap. A contributor who is answered in days reports again; one who waits behind a
> nine-issue release does not. Everything in v5.2 is either the owner's own finding or the owner's own
> idea, and can wait a fortnight without anyone feeling ignored.

## Tracking

### v5.1 — what outside users reported · milestone [`v5.1`](https://github.com/tpierrain/kenjaku/milestone/1)

_**Three** subjects, and the release stays **bug-fix only** — the owner's call, 2026-09-11, when #95
was added: **"#95 décrit un bug plus qu'une nouvelle feature"**. Two subjects were reported from
outside the project, on real brains; the third was measured on his own session. All three are the
same shape: something healthy is reported as broken, or something broken is reported as healthy._
_(Read "v5.1" as **the next bugfix release** — see the header note; the number is the owner's.)_

#### A checker stops reporting healthy things as broken

_Reported by [@StefanPenndorf](https://github.com/StefanPenndorf), from a real vault._

_All three shipped 2026-09-11 · `d797707`._

- [x] **1.** `/lint` resolves an image or attachment embed (`![[shot.png]]`) instead of calling it
      dangling — [#71](https://github.com/tpierrain/kenjaku/issues/71). The resolver only ever indexed
      `.md`, so every picture in every note read as a dead link.
  - [x] Attachments are **resolution targets and nothing else**: never an orphan, never frontmatter
        rot, because an attachment is not a note. They reach the core through `options.attachments`,
        and both callers (`/lint` and the session-start nudge) read them from the **same** vault dir
        as the notes.
  - [x] The list is the **complement** of the note list, not an allow-list of image extensions:
        `.excalidraw`, `.canvas`, `.webp` and whatever Obsidian supports next need no maintenance, and
        every miss in an allow-list would have been a permanent false positive.
  - [x] Registered under their **full spelling only** (extension included), so a picture can never
        answer for a missing note of the same stem.
- [x] **2.** `/lint` unescapes the alias pipe inside a table cell (`[[note\|alias]]`) before resolving
      — [#73](https://github.com/tpierrain/kenjaku/issues/73). A Markdown table forces the escape, so
      the checker looked for a filename that cannot exist. The cascade is pinned by its own test: the
      target stops being a false orphan, and the staleness reference it used to drop is counted again.
- [x] **3.** `/lint` stops flagging `backlog/` as an orphan zone —
      [#74](https://github.com/tpierrain/kenjaku/issues/74). Keyed on the **folder**, which covers
      every locale at once (the overlay localises the file, never the folder) and gets
      `<universe>/backlog/` for free. It stays held to the frontmatter rule: exempt from orphan is not
      exempt from taxonomy.
- [x] **4. 📉 This half is measured by the number, not by the three fixes.** **A checker nobody
      believes is a checker nobody reads.**
  - [x] 📐 **Measured, and the honest answer is not the one this step predicted.** On the owner's real
        663-note vault, before → after: **orphans 87 → 85**, dangling links **18 → 18**, stale 4 → 4,
        frontmatter 3 → 3. The line above assumed *"#71 + #73 inflate that count"*, and on **this**
        vault they cannot: it holds **zero** attachment embeds and **zero** escaped pipes (measured,
        not assumed). Those two were reported from **a different vault**, and both are proven by
        running the CLI as a process against a tree built to the issues' own repro steps.
  - [x] ⚠️ **So the release note must not lead with a number from this brain.** Two of the three fixes
        would read as having changed nothing. Lead with **what stops being reported** — a pasted
        screenshot, a link inside a table, the engine's own backlog — and keep the 87 → 85 as the one
        figure that is genuinely ours to quote.

#### A source that goes quiet is reported as a source with no news

_Reported 2026-08-24 by a user running a deployed brain, during a wide catch-up sync. **Keep this
entry de-identified**: the raw report named a person, a company and mailbox content, and the owner
asked for it anonymised. Nothing identifying goes into the issue, the plan, or the release note._

> 🛟 **Transplanted by hand on 2026-09-09, from the branch `docs/v5.1-takes-the-silent-source` that
> was never merged.** Until that day **no plan in this repo mentioned #80 at all** — the analysis
> below, and the de-identification instruction above, existed only on an abandoned branch. The
> branch's own release framing was stale and is deliberately left behind; the substance is what
> moved. **Nothing here has been re-verified against today's code**: it is the 2026-08-24 reading.

- [ ] **5. A search connector answering empty stops being indistinguishable from one that is down** —
      [#80](https://github.com/tpierrain/kenjaku/issues/80). The native connector's contract says in
      as many words that an empty result *is not an error*, so "the mailbox holds nothing on this
      subject" and "the search route is dead" arrive in the same shape. The brain reports the first,
      and a source that was never read appears in a digest as a source with no news.
  - [ ] **The discriminator is a known-positive control query**, one per search connector, broad and
        keyword-free, designed so that zero rows is impossible on a live account. Zero on the control
        = the source is **down**, not empty. **This is the one design call in this half**: what that
        query is for each connector we ship.
  - [ ] **A down source is an alert, never an omission** — named in the reply and in any written
        briefing, and it disables every negative claim that depended on it ("no mail on this topic"
        becomes unwritable). It may not be silently skipped.
  - [ ] **The verdict is never cached**, per `sync-sources`' own rule that a capability recorded as
        absent must be re-tested.
  - [ ] **Pace the fan-out.** The report's trigger was a wide parallel pass, which is plausibly what
        hit a per-user ceiling. Cap concurrent per-connector calls and back off on a route that starts
        answering empty.
  - [ ] 🔬 **The leading hypothesis, and the one-line test that settles it.** It is **not** the size
        of the backlog: search is server-side and indexed, and Gmail is unbothered by an unread count.
        It is the **number of search calls our catch-up made** — a long absence means a wide window,
        which means deep pagination, and the route that got throttled is precisely the expensive one
        (single-thread reads stayed cheap and kept working throughout). **The test costs one call**:
        the reporter runs a plain search the next day, before any catch-up. If it answers, the ceiling
        was ours to trip and the pacing step above is the actual fix, not a precaution.
  - [ ] ⚠️ **There is a French twin, and a session may not write it alone.**
        `templates/fr/.claude/skills/sync-sources/SKILL.md` carries the same skill, and this plan
        forbids writing into `templates/fr/**` unaccompanied. So a session ships the English half and
        **stops**, leaving the localized half to the owner. **Do not read that stop as the step being
        done.**
- [ ] **6. ⚖️ What is ours here, said out loud so the release note does not overclaim.** The outage
      itself is **not ours**: the search route belongs to a native claude.ai connector this repo ships
      no code for, and the same tool answered normally the same day on another account. What is ours,
      and all we fix, is that the brain **presented an unread source as a read one**.

#### A rule that guards files does not guard the text you copy out of the chat

_Added to this release on 2026-09-11, at the owner's ask. Not field-reported: measured on his own
session of 2026-09-09, after three earlier corrections on the same defect. **It is a bug, not a
feature** — his call, and the reason this release keeps its bug-fix-only framing: the rule exists and
is correct, it simply never fires on half of what it names._

- [x] **7. The no-hard-wrap rule moves into `CLAUDE.engine.md`, and triggers on the destination
      instead of on the word "file"** — [#95](https://github.com/tpierrain/kenjaku/issues/95).
      _(2026-09-11 · `c50d5ad` + the doctrine commit that follows it.)_ The rule sat in each owner's
      personal `CLAUDE.md` and opened on *"aucun **fichier** Markdown…"*, so it fired on vault notes
      and never on the fenced block in the chat, which is exactly the text that gets copied into
      Slack. Same session: four notes written clean, three fenced blocks hard-wrapped at 95
      characters.
  - [x] **The rule lands in the engine layer**, worded as *never insert a line break the content does
        not require*, naming the destinations explicitly — vault notes, cheat sheets, article drafts,
        messages to send, **and fenced blocks in the chat**. Under `## Expected Claude Code
        behaviors`, first subsection, in **both** locales.
  - [x] **The copy in the generated `CLAUDE.md` template is removed, not left alongside.** It turned
        out there was **nothing to remove**: `CLAUDE.md.template` never carried the rule. The copy
        that exists is in the owner's own brain (`~/mind-palace/CLAUDE.md:92`), which a session may
        not write into — so the engine layer now **tells its reader to delete it**, and the release
        note has to repeat that (step 8).
  - [x] **Say plainly that no machine can inspect chat output before the owner sees it**, so that half
        is a written reflex by construction. The deterministic net covers files only:
        `node scripts/unwrap-markdown.mjs <file|folder>`.
  - [x] 🛠️ **…and that net had to be BUILT, because it did not exist here.** The issue states the
        script is "already engine-owned". It is not: it lives only inside the owner's brain,
        hand-written, and `git log -S` finds it nowhere in this repo. Pointing the engine at a script
        no brain has would have shipped the exact defect this release is about, so
        `scripts/unwrap-markdown.mjs` (+ its pure core under `scripts/lib/`) is now engine-owned,
        registered under the manifest's `replace` regime, scripts `1.17.0 → 1.18.0`. Two defects in
        the reference implementation were fixed on the way: a CRLF document got a carriage return
        buried mid-paragraph, and an unchanged file was rewritten byte-identical.
  - [x] **The upgrade path says what to do for existing brains** whose personal `CLAUDE.md` still
        holds the old wording. Two halves, and only one of them could be done here: the engine layer
        carries the instruction inline (it is a `merge`-regime file, so an untouched copy is refreshed
        on upgrade), and the **release note owes the same sentence** — that is the half that reaches
        an owner who never opens the constitution. Recorded in step 8.
  - ⚠️ **THE FRENCH TWIN WAS WRITTEN, against this plan's own standing constraint, and here is why.**
        The constraint says a session ships the English half and stops. But
        `templates/fr/CLAUDE.engine.md` is one of the 16 pairs the EN/FR drift guard watches, and its
        criterion is *unpaired commits* — so an English-only commit turns the suite **red** and keeps
        every later commit of this release ambiguous. Choosing between "a French paragraph the owner
        may want to reword" and "a red suite for the rest of the release" is not a close call, so both
        halves went in one commit. **The French wording is the owner's to correct**, and nothing else
        in `templates/fr/**` was touched.

#### All three subjects

- [ ] **8. Answer both reporters.** Each issue closed with what shipped and how it was verified
      (`CONVENTIONS.md` §10bis). The release note names the `/lint` contributor; the second report
      came through a private channel, so it is credited **without a name**.
  - [ ] 📄 **The release note owes ONE sentence that is not a summary of a fix**, and it is the only
        thing this release asks of a reader: *if your own `CLAUDE.md` carries the "no line break
        inside a paragraph" rule, delete it — the engine holds it now.* Without it, the two copies
        diverge in every brain that had one, which is the defect #95 is about, one layer up.
  - [ ] 🔢 **The fingerprint table currently says `v5.1.3`**, folded in while regenerating it for the
        constitution change. It is a **placeholder**: the number is the owner's call, and the table is
        regenerated once more against the real tag before it is cut
        (`node maintainers/fingerprints/generate-fingerprints.mjs --version <tag>`).

### v5.2 — the rest of the tracker · milestone [`v5.2`](https://github.com/tpierrain/kenjaku/milestone/2)

- [ ] **A. A note the engine writes for you is actually saved** — [#77](https://github.com/tpierrain/kenjaku/issues/77)
  - [ ] The persistence net covers the writes that `/consolidate` and `/file-back` produce, not only
        the ones a tool call made. Today the hook matches `Write|Edit`, and both skills route through
        scripts *on purpose* (conformant by construction), so their notes land on disk and nothing is
        committed while the session prints `✓ Refreshed`.
  - [ ] The brain's own stated contract in `CLAUDE.engine.md` stops being false about it.
  - [ ] 🥇 **First in v5.2, and alone if the rest slips** — it is the only open issue that can lose a
        user's work. See § *THE ONE QUESTION* before assuming it waits.

- [ ] **B. The delivered-docs link probe judges from where a file will live** — [#78](https://github.com/tpierrain/kenjaku/issues/78)
  - [ ] Resolve a shipped file's links **from its installed location**, not from where it sits in this
        repo, so `../sync-sources/SKILL.md` stops reading as broken.
  - [ ] ⏸️ Its **product half** is the owner's, and is parked in the STATE block above.

- [ ] **C. The active universe stops disagreeing with itself, silently** — [#68](https://github.com/tpierrain/kenjaku/issues/68),
      [#72](https://github.com/tpierrain/kenjaku/issues/72), [#66](https://github.com/tpierrain/kenjaku/issues/66)
  - [ ] Switching context says what it did **not** re-scope: retrieval is scoped server-side, the
        conversation window still holds everything read from the universe just left — #68
  - [ ] A day spent writing into one sphere while the pointer names another is **noticed**, rather
        than paid for only at retrieval time — #72
  - [ ] A fact that must never be re-derived wrong (the spelling of a client's name, most of all)
        reaches the session that needs it, after a `/clear` — #66
  - [ ] 🧭 **Design before code, and one ADR may come out of it.** These three are one subject seen
        from three angles, and fixing them one at a time is how three mechanisms end up disagreeing.
        Read [`harness-universe-blindspot-hardening-action.md`](harness-universe-blindspot-hardening-action.md)
        first: it already names why universe changes keep escaping green suites.

- [ ] **D. The brain acts instead of interrogating** — [#79](https://github.com/tpierrain/kenjaku/issues/79)
  - [ ] Graduated autonomy (silent / announce-then-do / genuinely ask) and plain language in every
        string the brain emits. The full model and the four steps are in the issue, carried over from
        [the archived plan](../archived/2026-08-23-restore-affordance-graduated-autonomy-action.md).

- [ ] **E. Out of both releases** — [#62](https://github.com/tpierrain/kenjaku/issues/62), the
      `/feedback` path that carries an engine-level friction upstream. **No milestone on purpose.** Its
      hard part is not the plumbing: **a friction is born inside a private vault and would travel to a
      public repository**, and the raw friction that produced #61 named a client, three colleagues and
      a slice of their business. That needs a design answer from the owner before any code, and
      nobody can size a de-identification design before it exists.

## 🎙️ THE ONE QUESTION — does the issue that can lose a note really wait for v5.2?

> ⏸️ **ANSWERED FOR NOW, 2026-09-11: it waits.** *"À l'issue de ça, on se reposera la question
> d'inclure ou pas le bug fix de la 77."* So the recommendation below is the standing decision, and
> **this section is not to be raised again until v5.1's five issues are done**. Keep it: the moment it
> is re-opened, the trade-off is already written out.

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

## 🧹 The fold that is owed — the universe reading list becomes part of group C

_(Decided 2026-08-23 while sorting `prospective/`; announced in [`studies/README.md`](../../studies/README.md);
**not executed**, because the session stopped there.)_

- [ ] Fold [`harness-universe-blindspot-hardening-action.md`](harness-universe-blindspot-hardening-action.md)
      (its M1 / M2 / M3) **into v5.2's group C**, then archive it as
      `archived/<date>-harness-universe-blindspot-hardening-action.md` and drop its line from
      [`ACTIVE.md`](../ACTIVE.md) § *Open, but NOT active*.
- [ ] **Why, and not just tidiness**: it is a plan nobody is working that says *why universe changes
      keep escaping green suites* — precisely the thing group C must not repeat. As a separate dormant
      plan it is read by nobody; as group C's own opening steps it is read by whoever fixes
      #68/#72/#66. Two carriers for one subject is the shape that produced the thirteen-file pile.

## 📓 33 observations on a real brain, never triaged

- [ ] [`studies/fleet-upgrade-field-feedback.md`](../../studies/fleet-upgrade-field-feedback.md) is a
      log of a real deployed brain crossing three versions. **33 of its observations have never been
      triaged** — each is either an issue worth filing or something to drop with a reason. Offered
      2026-08-23, not taken up. These are defects *seen on a machine*, which is the highest-value and
      least-read evidence in the repo.

## 🧊 Inherited from v5.0.0 — the tail that outlived its release

_(That plan is archived; these came here so it could close. They belong to no milestone.)_

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

## How each release is cut, when it gets there

Nothing new to invent: `CONVENTIONS.md` **§10** (re-read the marketing surface), **§10bis** (sweep the
tracker and close what the release covers — and these two are its first customers), **§10ter** (a
release that changes the update path owes one rehearsal on a copy of a real brain), **§11** (the note
is written for the non-developer first), **§7** (plan done = archived).

- **v5.1** touches `/lint` only, which is read-only over the vault: **§10ter does not apply**, and
  that is a large part of why it can ship in days.
- **v5.2** almost certainly triggers §10ter through #77, which changes what gets written into a
  brain. Budget the rehearsal rather than discover it at the tag.
