<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- STATUS: 🔭 PROSPECTIVE / FIELD LOG (opened 2026-07-28) — defects observed on a -->
<!-- REAL big-jump upgrade of a deployed brain (`mind-palace`, v4.0.0 → v4.3.0),    -->
<!-- captured as they happen. Feeds Gate 4 of the ROADMAP ("fleet re-layering +     -->
<!-- big-jump upgrade experience"). Nothing here is implemented yet.                -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# 🔬 Field feedback — a real deployed brain crossing three versions

## What this is

Gate 4 says the big-jump upgrade experience needs *"QA fixtures reproduced from the release tag(s)"*.
This file is the cheaper thing that came first: **an owner upgrading their own brain for real**, three
versions behind, with every rough edge written down at the moment it was met instead of reconstructed
later. Each entry states the **observation**, the **root cause** (once found), and the **fix**, so it can
graduate straight into Gate 4's plan without a second investigation.

**Subject of the run:** `~/mind-palace` — 413 notes, in-process embedder, `engineVersion.scripts` 1.7.0,
`indexSchemaVersion` 1, `source.ref` v4.0.0 → target v4.3.0.

> Not a substitute for synthetic fixtures: one machine, one embedder, one OS. It is the **evidence**
> that says which fixtures are worth building.

---

## ▶️ RESUME HERE (written 2026-07-28 before a `/clear` — read this first)

**Where we got to.** The QA run is **done and green**: `mind-palace` is on v4.3.0, 415 notes indexed,
`a98921f` + follow-ups committed. Eight field entries (F1-F8) are recorded below, each with its own
root cause and fix list. Nothing is implemented yet.

**The decision already taken with Thomas (2026-07-28): F8 ships as its own release.** It does not merely
add a feature, it **makes true a sentence v4.3.0 already published to the fleet** ("les notes tapées
directement dans Obsidian sont enfin commitées/synchronisées"). Scope agreed:

- **Headline: F8 / P1 only** (see F8 → "P1 vs P2"). P2 is **rejected**, on Thomas's call.
- **Ride along:** F1 (ships sooner = fleet stops depending on a GitHub redirect), F5 (most visible),
  F6 (small and isolated), and the **F4 ADR** (costs nothing, and without it F2/F5 get fixed wrongly).
- **Added 2026-07-28 (Thomas):** F9 + F11 (inside F8/P1, see the scope update below) and **F10**.
- **Deferred to Gate 4:** F2, F3, F7.

**The constraint that decides WHERE each fix lands — do not re-derive it.** `CLAUDE.md` and
`.claude/settings.json` are `SACRED_FILES`: never rewritten by an update, so **anything landing there
reaches new installs only, never the deployed fleet.** This directly bites F8 (the hook lives in
`settings.json` → must go through `reconcileHooks`, cf. `hooks-reconcile.mjs`, or the release delivers
nothing), F7 (must live in an engine skill, not the constitution) and F2 (logic must live inside
`status-line.mjs`, engine-owned `replace`).

**Scope update (2026-07-28, after F9-F11 — the frozen scope holds, three riders join it).** The QA
continued and produced three more entries. None reopens the agreed scope; two of them land **inside**
F8/P1 rather than beside it:

- **F9 rides for free**: same root cause as F8, no separate fix — it becomes **P1's second test case**
  (deletion, not just creation) and it pins the trigger condition (`indexed > 0 || removed > 0`).
- **F11 is one line and P1 depends on it**: campaigns fire on `.obsidian/` UI churn, so P1's trigger
  must be written knowing that. Ship it with P1.
- **F10 joins the release** _(Thomas, 2026-07-28)_. The engine drops unreadable notes and reports
  "0 error" to the owner. Small (the reporter never receives phase-1 errors), and it is the trust defect
  F7 is about, one layer down: a brain that answers confidently over an incomplete index is the failure
  mode this product cannot afford. Ships with the `scanned == indexed + skipped + errors` invariant test.

**Next step when picking this up:** write the release's action plan, then implement **F8/P1 in TDD** —
it is the most structural, and its propagation trap deserves a test that locks it.

> Everything below is the evidence. Do not re-investigate what is already written; each entry states
> observation → root cause → fix.

---

## Tracking

- [ ] **F1 — A renamed launcher repo never reaches an installed brain** *(found 2026-07-28, before the run)*
- [ ] **F2 — The brain's status line silently evicts the owner's own** *(found 2026-07-28, during the run)*
- [ ] **F3 — A 10-minute reindex reports nothing while it runs** *(found 2026-07-28, during the run)*
- [ ] **F4 — The engine holds two opposite beliefs about whether Desktop renders a status bar** *(found 2026-07-28)* — ✅ **fact SETTLED 2026-07-28: Desktop renders NO status line**; the cleanup + ADR remain to do
- [ ] **F5 — `additionalContext` is printed verbatim to the owner: backstage directives on stage** *(found 2026-07-28, first session after the restart)* — **the most user-visible defect of the batch**
- [x] ~~F-watch — the `*` dirty marker after the swap~~ **Not a defect** _(2026-07-28)_: the restart's
      auto-commit absorbed the 314 engine files as `a98921f` (73 files changed) and the marker cleared on
      its own. Recorded so nobody re-opens it.
- [ ] **F6 — `/rag` does not exist; the host suggests `/run`** *(found 2026-07-28)*
- [ ] **F7 — the brain reports an unverified outcome in the measured voice** *(found 2026-07-28)*
- [x] **v4.3.0 watcher claim: VALIDATED** _(2026-07-28 · 413→414, 4442→4499 chunks, 0 error, no manual reindex)_
- [ ] **F8 — an Obsidian note is indexed live but committed only at the next session start** *(found 2026-07-28)* — **the defect this QA was built to find**
- [ ] **F9 — a note DELETED inside Claude (via `rm`) is not committed either** *(found 2026-07-28)* — same root
      cause as F8, from *inside* a session; **no separate fix, it is F8/P1's second test case**
- [ ] **F10 — a note the indexer cannot read is dropped silently: the owner is told "0 error"** *(found 2026-07-28)* —
      three of our own channels disagree about the same run; **the one the owner sees is the optimistic one**
- [ ] **F11 — the watcher watches `.obsidian/`, which git deliberately ignores** *(found 2026-07-28)* — UI churn
      triggers full scan campaigns; **constrains how F8/P1 may trigger its commit**
- [ ] Field-log the rest of the run (entries appended below as they are met)
- [ ] Triage the log into Gate 4's canonical plan once the run is over

---

## F1 — A renamed launcher repo never reaches an installed brain

- [ ] **Fix `update-engine` so the source URL self-heals from the fetched launcher**
  - [ ] Have the launcher declare its own canonical repo URL in `engine-manifest.json` (the fetched
        `target`), so the source of truth is the launcher, not the brain's install-day memory.
  - [ ] In `scripts/update-engine.mjs:298`, carry that URL through instead of `{ ...source, ref }`,
        which today refreshes **only** the ref. Keep the recorded URL when the fetched manifest declares
        none (older launchers), so the change can never blank a working source.
  - [ ] Test the redirect-free path: a brain recording the OLD URL, a fetched manifest declaring the NEW
        one → the brain's manifest ends up on the new one, and a second run is a no-op.
  - [ ] Decide whether a brain whose recorded URL is now unreachable gets an actionable message
        (*"your brain points at a repository that no longer answers"*) rather than a raw `git clone` failure.

**Observation.** On `mind-palace`, `/update-engine` clones and queries
`https://github.com/tpierrain/second-brain-generator`, a name the repo no longer carries (it is
`tpierrain/kenjaku` since the v4.0.0 rename). The owner sees the dead name in the commands run on their
behalf.

**Root cause.** `recordSourceAndProvenance()` (`scripts/lib/engine-source.mjs:75`) stamps
`source: {repo, ref}` into the brain's `engine-manifest.json` **at install time**, from the launcher's
remote as it was that day. `update-engine.mjs:298` then writes back `source: { ...source, ref }` — the
**ref** is refreshed on every update, the **repo** never is. So a repository rename propagates to **no
already-installed brain, ever**.

**Why it still works today, and why that is not reassuring.** GitHub redirects the old name
indefinitely, for git and HTTP alike, so the clone lands correctly. But the entire update path of every
deployed brain now depends on an alias we no longer own the namespace of: the day a repository named
`tpierrain/second-brain-generator` exists again (recreation, a transferred fork), those brains fetch
**someone else's code** — or fail. This is a supply-chain-shaped defect wearing cosmetic clothes, which
is why it is written down rather than patched by hand on one machine.

**Scope.** Every brain installed before the rename. A one-line manual edit of `source.repo` fixes a
single brain; only the engine fix fixes the fleet, and it fixes them silently at their next update.

---

## F2 — The brain's status line silently evicts the owner's own

> ✅ **F4 is settled (2026-07-28) and it decides this entry.** The status line is **CLI-only**: Desktop
> renders none. So Kenjaku's line delivers **nothing** on the surface that justified it (Desktop, the
> non-dev persona) while evicting the owner's own line on the one surface where it does render — i.e.
> among precisely the people most likely to have configured one. **Composition is no longer the refined
> option, it is the obvious one**; eviction has lost its argument.

- [ ] **Decide the intent: eviction, composition, or opt-in** — pick one and say it out loud somewhere
      the owner reads.
  - [ ] Establish the fact first: `statusLine` is a **single value**, not a merged list, so the brain's
        `.claude/settings.json` wins over the owner's `~/.claude/settings.json` for the whole session.
  - [ ] If **composition** wins: run the owner's status line and append the brain's segment
        (`🧠 RAG n/n · engine vX`), reading their prior `statusLine` at install time. Both commands are
        fed the same JSON on stdin, so composing means tee-ing that stdin, not calling one from the other.
  - [ ] If **eviction** wins (defensible: index freshness is exactly what an owner must see): then at
        minimum **say so at install** when a user-level `statusLine` already exists, and document how to
        get theirs back.
  - [ ] Either way: `.claude/settings.json` is `sacred`, so whatever an owner sets by hand survives every
        update. That makes the documented workaround a genuinely durable answer, not a stopgap.

**Observation.** In `mind-palace`, the familiar personal status bar (`clepsydre`) is gone; the line reads
`main d4ad3e3* · 🧠 RAG 413/413 · engine v4.0.0`. Nothing announced the swap, so the first reading is
"something is broken".

**Root cause.** Not a bug — a collision nobody declared. The brain's `.claude/settings.json` sets
`statusLine` to `scripts/status-line.mjs`; the owner's `~/.claude/settings.json` sets it to their own
`clepsydre.mjs`. Project scope beats user scope, and the setting is replaced wholesale rather than
merged, so inside the brain the owner's status line simply does not run.

**Why it matters beyond one machine.** Anyone who has invested in a personal status line — a
population strongly overlapping with our early adopters — loses it the moment they open their brain,
with no message and no documented way back. The cost of the fix is small; the cost of the silence is
that the brain looks like it broke their setup.

---

## F3 — A 10-minute reindex reports nothing while it runs

- [ ] **Emit real progress from the indexer, rather than an animation**
  - [ ] The seam already exists and is **wired by nobody**: `onProgress` (`rag/src/lib/indexer.ts:40`,
        fired per document at `:68`) has no non-test caller. The CLI path prints one
        `[vault-rag] CLI indexing (full force)...` (`rag/src/index.ts:335`) and then goes quiet for
        the whole run.
  - [ ] Wire it in the CLI path to a **throttled** line (every N documents *or* every ~10 s, whichever
        is coarser) carrying `done/total` and an ETA extrapolated from elapsed time. Throttling is the
        whole design: one line per document over 413 documents is noise, not progress.
  - [ ] **No spinner, no carriage-return animation.** The engine writes to a pipe, not a TTY: `\r`
        redraws produce one garbled line in a log file and buy nothing. Plain append-only lines are what
        a non-TTY consumer can actually render.
  - [ ] Check what the *caller* does with those lines: `update-engine` shells out and the host collapses
        the output ("+31 lines"). Progress that is only visible after expanding is progress the owner does
        not get — so make sure the **last** line is the informative one, since that is what a collapsed
        view tends to show.

**Observation.** Asked for "a little animation to help the wait" after two and a half minutes facing a
static `Bash(node scripts/update-engine.mjs)` block. The host's own spinner ticks (`Mustering… 2m 30s`),
so the session is visibly alive — what is missing is any sign of **how far along** an 8-to-10-minute job is.

**Root cause.** Nothing is emitted during the encode. The 31 lines already visible come from around the
work (startup, model, warnings), not from the loop over the notes. So the wait is not merely
under-decorated: it is genuinely unreported.

**The distinction that decides the fix.** An animation says "not frozen" — the host already says that.
Progress says "142/413, about four minutes left", which is what turns a worrying wait into a bounded one.
Build the second; the first is already provided by someone else's UI and we do not control it.

---

## F4 — The engine holds two opposite beliefs about whether Desktop renders a status bar

> ✅ **SETTLED 2026-07-28 — the code's premise is FALSE. Claude Desktop's Code tab renders NO status
> line.** Field-verified by the owner on Desktop, in a conversation rooted in `mind-palace` (chips
> `📁 mind-palace · ⑂ main` present): the bottom of the window shows the chip row, the input field and
> the model selector, and **no status row** — where the CLI shows `🧠 RAG 413/413 · engine v4.3.0`
> permanently. Confirmed with a message sent, so "the session had not started yet" is ruled out.
> **`update-engine/SKILL.md:107` was right; the four source comments were wrong.**

- [x] **Establish the fact, once, with evidence** _(2026-07-28 · owner-verified on Desktop, see verdict above)_
  - [x] Field-verify on Claude Desktop's Code tab: is a `statusLine` command **run at all**, and is its
        output rendered anywhere? **Answer: nothing is rendered.**
  - [ ] Whichever way it lands, make the codebase say **one** thing: today
        `scripts/status-line.mjs:5` + `:116`, `scripts/lib/restart-nudge.mjs:6` and
        `scripts/session-status.mjs:7` assert Desktop **does** render it, while
        `.claude/skills/update-engine/SKILL.md:107` asserts it renders **no status bar, just the chat**,
        and three archived plans state the chat is the **only** Desktop-visible channel.
  - [ ] Re-scope the status line as an explicitly **CLI-only comfort surface**. Not a removal — the
        `🧠 RAG n/n (m⏳)` staleness counter earns its place for terminal owners — but it ends the "sole
        channel, therefore permanent and exclusive tenancy" argument, which is what F2 turns on.
  - [ ] Audit what the false premise justified, now known to reach **nobody on Desktop**:
    - [ ] the **restart nudge** (`restart-nudge.mjs` + the `onDiskGapNeeded()` detection feeding it at
          `status-line.mjs:116`). Its Desktop delivery rests **entirely** on the 🛑 MANDATORY chat rule in
          `update-engine/SKILL.md:105-115`. That rule is not a redundant belt: **it is the only harness.**
          Mark it as such where it lives, so no future cleanup trims it as duplication.
    - [ ] the **missing-Gemini-key warning** — invisible on Desktop, i.e. invisible to exactly the CASE B
          owners who need it. Needs a chat-borne equivalent or it protects nobody.
    - [ ] the **RAG staleness counter** — same: the brain's worst failure mode (answering confidently
          while ignoring recent notes) is signalled only to terminal users.
  - [ ] **Give the verdict a durable home, not a plan that gets archived.** This file's fate is to be
        triaged into Gate 4 and archived; the channel matrix must outlive it. Write the ADR
        ("the chat is the only Desktop-visible channel — what may be routed where"), and have the four
        wrong comments point at it instead of asserting on their own authority. **The whole point of F4
        is that a fact living only in comments rots and gets built upon.**

**Observation (owner, 2026-07-28).** *"Il me semble que la status line est justement ce qui n'apparaît
nulle part dans l'appli desktop."* Against a claim this file had just repeated from the code's own header.

**Evidence, and it converges against the code comments.** The official documentation
(`code.claude.com/docs/en/statusline`) never mentions Desktop or the Code tab, and frames the feature in
terminal terms **throughout**: distance from "the terminal edge", ANSI colors requiring terminal support,
`COLUMNS`/`LINES` "set to the current terminal dimensions", behaviour "on narrow terminals". Our own
`update-engine` skill states the opposite of our own code. The owner observes the absence directly. The
four source comments are the outlier, and they all trace back to one another.

**Why this is a defect and not a doc nit — the same need was solved twice.** `update-engine/SKILL.md:107`
carries a 🛑 MANDATORY rule to repeat the restart instruction **in the chat**, and its stated reason is
that the status bar does not exist on Desktop. So the restart nudge has a correct implementation (chat)
**and** a blind one (statusLine), and the blind one still justifies itself in comments that the correct
one contradicts. A false premise that survives in comments does not stay inert: it gets built on.

**The irony to keep in view when re-arguing F2.** If the premise is false, the status line is a
**CLI-only** feature: it delivers nothing on the surface that justified it (Desktop, the non-dev
persona) while evicting the owner's own status line on the one surface where it does render — i.e.
exactly among the people most likely to have configured one.

---

## F5 — `additionalContext` is printed verbatim to the owner: backstage directives on stage

> 🔗 **Sibling of F4, and F4 is now proven.** Both are the same class of bug: **we believe things about
> the host's channels that are not true**, and we build load-bearing UX on those beliefs. F4 = a channel
> we thought reached Desktop and does not (verified 2026-07-28). F5 = a channel we thought the human
> never sees, and they see all of it. Two beliefs, two directions, both wrong. The fix is one **verified,
> dated channel matrix in an ADR** — not another comment asserting on its own authority.

- [ ] **Stop writing agent-directed prose into a channel the owner reads**
  - [x] Establish the fact _(2026-07-28)_: on Claude Code **v2.1.220 / CLI**,
        `hookSpecificOutput.additionalContext` is echoed to the user verbatim, prefixed
        `SessionStart:startup says:`. **Scope: CLI only.** On Desktop the same directives produced *only*
        the agent's intended relay (see the matrix below) — so the channel behaves as designed there and
        the leak is a **terminal-side echo**, not a property of the channel.
  - [ ] Rewrite the leaking payloads so they read acceptably **to a human**, since a human reads them:
        no `Offer ONCE, in the user's language`, no `load the \`switch\` skill`, no
        `run \`node scripts/set-universe-profile.mjs --decline\``, no `PAST the disclosure gate`.
  - [ ] Reconcile with the language rule: the directive is emitted in **English** to a French-speaking
        owner. Agent-directed text in English is correct; owner-visible text is not. Once the channel is
        known to be owner-visible, this becomes a **localization** requirement, not a style nit.
  - [ ] Audit every `additionalContext` emitter for the same leak: `session-universe.mjs:145`,
        `session-wiki-health.mjs:64`, `session-self-heal.mjs:88`.
  - [ ] Watch for the **double delivery**: the agent still relays the directive as intended, so the owner
        meets the same offer twice — once as raw English backstage, once as the polished French question.
        The fix must not simply mute the agent's version, which is the good one.

**Observation.** First screen of the first session after the update, before the owner typed anything:

> `SessionStart:startup says: Active universe: 'inqom' (of 3: default, inqom, shodo).`
> `Your brain does not know your context yet … This brain is PAST the disclosure gate: say`
> `` `universe` plainly … Offer ONCE, in the user's language … If they decline, run ``
> `` `node scripts/set-universe-profile.mjs --decline` so they are never asked again. ``

and, right after it, `6 consolidation candidates (offer /consolidate) and 28 dangling links (offer /lint)`.

**Root cause.** `scripts/session-universe.mjs:141-146` writes **only**
`hookSpecificOutput.additionalContext` — it emits no `systemMessage` at all — and its text nonetheless
appeared on screen word for word. So the host renders that channel to the user. Our comments call it
"the ONLY Desktop-visible channel (chat)" precisely because we designed it as agent-only plumbing whose
*effects* the user would see, never its text.

**Why it matters more than its size suggests.** This is the **first thing an owner sees** in the session
that is supposed to prove the update worked. Kenjaku sells a brain that speaks plain language to
non-developers, and it opens by showing them the strings we pull: internal vocabulary, a skill name, a
CLI command with a flag. It reads like a leaked prompt, because it is one. For the target persona
(Head of Engineering, PM, consultant) the effect is not "quirky", it is a loss of trust in a product
that just spent ten minutes reindexing their notes.

---

## 📡 The channel matrix — verified 2026-07-28, the ADR's payload

Both F4 and F5 exist because this table was never established, only assumed, in comments that then
disagreed with each other. It is now field-verified end to end on **Claude Code v2.1.220**, CLI and
Desktop Code tab, same brain (`mind-palace`), same session boundary. **This is what goes in the ADR.**

| Channel | CLI (terminal) | Desktop — Code tab |
| --- | --- | --- |
| `statusLine` | ✅ rendered, persistent | ❌ **nothing** (F4) |
| SessionStart `systemMessage` | ✅ displayed | ❌ dropped |
| SessionStart `additionalContext` | ⚠️ **echoed verbatim** to the user (F5) | ✅ agent-only, as designed |
| The agent's chat text | ✅ | ✅ **the only channel that reaches both** |

Three consequences that must survive this file:

1. **The chat is the only universal channel.** Anything an owner MUST see (restart required, key missing,
   a stale index) belongs in the agent's message. Every other channel is a per-surface bonus.
2. **`additionalContext` is not backstage on the CLI.** Anything routed there must read acceptably to a
   human, in their language — it is a directive *and* a user-facing string on one of the two surfaces.
3. **Nothing here is inferable from the documentation**, which never mentions Desktop and is framed
   entirely in terminal terms. Hence: verify, date, record. Do not re-derive.

---

## ✅ End-to-end validation of the upgrade *(2026-07-28, Desktop, post-restart)*

Recorded because a green `exit 0` is not proof that a brain works. Asked a real question
(*"qu'ai-je dit au dernier EM avant de partir en vacances ?"*) in a Desktop conversation rooted in the
brain. Observed, in order: the universe banner rendered as **intended French prose**, `vault-rag` search,
`2026-07-10.md` read, a substantive answer, and a **citation with a working link** to
`prep-day/2026-07-10.md` plus a Slack permalink. The optional housekeeping (6 `/consolidate` candidates,
28 `/lint` dangling links) and the universe-profile offer landed **last, in one discreet parenthetical**,
in the owner's language, explicitly skippable.

So: the 413-note reindex is **verified from the vault, not merely reported**, and the v4.2.0 universe
surface behaves on Desktop exactly as designed. **The design is right; F5 is a CLI echo defect on top of
a sound design** — worth stating plainly so the fix stays narrow and nobody re-opens the design.

**Second validation, same session — the self-converging loop, on Desktop.** A follow-up question reached
*past* the vault: the brain pulled a Google Doc transcript through a connector, synthesised the 1-1
(topics, unplanned subjects, actions per person), cited its source, and then **noticed its own gap** —
the transcript is absent from the vault and `people/jeremy-hinard.md` says as much ("pas de transcript de
ce 1-1"). It **proposed two writes** (import the transcript to `raw-sources/transcripts/…`, correct the
person's note) and **asked before performing either**, saying so explicitly.

That exercises, on the surface where none of our other channels reach, three invariants at once: the
fan-in from external sources, the vault-vs-source gap detection, and **writes stay confirmed**. Worth
recording as evidence, because "the brain proposes rather than acts" is a promise the constitution makes
to every owner and it is rarely observed under field conditions.

- [x] **Follow-through: PASSED** _(2026-07-28)_. The owner accepted; a sub-agent wrote the transcript
      (1886 lines / 88 Ko) to `raw-sources/transcripts/2026-07-10-1-1-jeremy-thomas.md`, and **the live
      watcher picked it up with no manual reindex and no prompting**: `413 → 414` files, `4442 → 4499`
      chunks, 1 doc indexed, 0 error, still 100 % local, no quota. **The v4.3.0 headline claim is
      validated on a file written outside the main agent.** The stricter variant (a note typed directly
      in Obsidian, no Claude write at all) is still worth running.

---

## F6 — The owner reaches for `/rag` and the product answers "did you mean /run?"

- [ ] **Give the RAG a front door under the name people actually reach for**
  - [ ] Observed: the owner typed `/rag`, got `Unknown command: /rag. Did you mean /run?` — and had to
        fall back to plain language (`rag ?`), which worked fine. So nothing is broken; an **affordance
        is missing** at the exact word an owner of a RAG-backed brain will try first.
  - [ ] Worse than absence: the host's nearest-match suggests **`/run`**, an unrelated built-in. A
        curious owner who follows the suggestion lands somewhere that has nothing to do with their index.
  - [ ] Cheapest fix that fits the product: a thin `rag` skill reporting the same status the natural-
        language path already produces (files/chunks, watcher liveness, embedder identity, engine +
        schema versions) — the surface exists, only its name is missing.
  - [ ] While there, sweep the other words an owner would guess for the same thing (`/status`,
        `/index`, `/reindex`) and decide which are worth aliasing. **A name nobody guesses is a feature
        nobody finds.**

---

## F7 — The brain reports an outcome it did not check ("l'auto-commit a dû enregistrer les deux")

- [ ] **Verify, or say you did not** — never presume in the reporting voice
  - [ ] Observed, closing an otherwise excellent recap: *"L'auto-commit du hook **a dû** enregistrer les
        deux."* A presumption, delivered in the same register as the three facts above it, which were
        genuinely measured (414/414, 4499 chunks, 0 error).
  - [ ] The check is one read-only command away (`git log --oneline -2`, or the status the brain already
        knows how to produce). There is no reason to guess here.
  - [ ] This is the repo's own **"don't pretend"** rule (`CLAUDE.md` step 3 guardrails, `CONVENTIONS.md`)
        turned inward: it currently governs the **installer's** reporting, and the same standard should
        govern the **brain's**. An owner cannot tell a measured claim from a plausible one when both are
        stated in the same voice.
  - [ ] Land it where it will actually bind behaviour (the constitution / the relevant skill), not as a
        comment. **Being right by luck is indistinguishable from being right, until the day it isn't** —
        and auto-commit silently failing is precisely a failure mode this brain is supposed to catch.
  - [x] **"The day it isn't" arrived — same QA run, ~20 minutes later** _(2026-07-28, see F9)_. Asked to
        delete a note, the brain volunteered *"rien à committer, il était non suivi (jamais entré dans
        l'historique)"*. **Both halves false**: the note had been committed by the session-start sweep,
        and its deletion was sitting uncommitted — with the host's own `+0 −1` chip contradicting it on
        the same screen. It surfaced **only because Thomas asked "tout est commit ?"**, which is not a
        control we can ship.
  - [ ] Note what this sharpens: the rule is not "check before reporting" in general — the very same
        brain, one question later, ran `git status`, corrected itself out loud and flagged what it could
        not verify. **The failure is specifically in the VOLUNTEERED recap**, where nobody asked and so
        nobody checks. That is where the rule has to bite.
  - [ ] And it is not only the agent: **F10 is the same defect one layer down**, in the engine, where
        the reported "0 error" is not a presumption but a number the engine computed wrong. An agent
        cannot be disciplined into surfacing what it was never given.

---

## F8 — An Obsidian note is indexed live but committed only at the NEXT session start

> The one defect this QA was designed to find. v4.3.0's headline claim holds **by half**: the note is
> searchable within seconds and untracked by git for as long as the owner does not restart a session.

- [ ] **Make the commit as file-driven as the indexing already is**
  - [ ] Root cause, exactly: `auto-commit.mjs:51` runs `git add .` — it would happily stage the note.
        The problem is **when it runs**: `.claude/settings.json` wires it to `PostToolUse` with matcher
        `Write|Edit`, so it fires **only after Claude writes a file**. A note created in Obsidian
        produces no tool call, so the hook never runs.
  - [ ] **The asymmetry is the finding.** The very same disk event that the RAG watcher catches live
        (and it does — `413 → 415`, indexed, universe `default`) triggers no commit. Indexing is
        file-driven; committing is session-driven. One of the two is wrong, and it is not the watcher.
  - [ ] Honest severity: **delayed, not lost.** `sweepThenPull` (`startup-sync.mjs`, called from
        `session-status.mjs:58`) commits everything at SessionStart, and `repo-status.mjs:107` already
        alerts when vault notes survive the sweep. So the note lands at the next session.
  - [ ] But the window is real and it is the promise we sell: an owner writing in Obsidian for a week
        without opening Claude has **nothing committed and nothing pushed** for that week — no backup,
        and nothing on their second machine. "Backup" and "usable from several machines" are exactly
        what the remote is offered for (CLAUDE.md step 4 §2).
  - [ ] Cheapest candidate fix: also trigger the sweep on a **conversation-level** hook
        (`UserPromptSubmit` / `Stop`) so any outside-written note is swept within one exchange instead of
        one session. Cost is one `git status --porcelain` on a hook that already exists and no-ops on a
        clean tree (`attemptCommit` reads the tree state first).
  - [ ] Decide whether to go further and let the **watcher itself** request the commit. More faithful to
        the promise, but it crosses a process boundary (the MCP server) into git-write territory — weigh
        against the confirm-before-write posture before committing to it.
  - [ ] Whatever ships: the release note for v4.3.0 says notes typed in Obsidian are "enfin
        commitées/synchronisées". **Either the behaviour matches that sentence or the sentence changes.**

**Field evidence (2026-07-28).** Note created in Obsidian at `vault/daily/Test de nouvelle note débile.md`.
Index: `415/415`, 4501 chunks, 1 doc indexed, 0 error — the watcher caught it. Git: `?? vault/daily/`,
untracked, while the three preceding `auto:` commits (last `59e1690`) captured only Claude-produced
writes. Verified independently on disk and by the brain itself.

**The sharper consequence, confirmed 2026-07-28: the index runs AHEAD of git.** `vault_stats` reports
`415/415`, `daily: 1`, and the brain states it plainly — *"le RAG l'a déjà indexé (il embedde tout ce
qu'il voit dans `vault/`, même non commité), mais côté git il reste non suivi"*. So the brain will
**search, find and cite a note that exists on no remote and on no other machine**. Two consequences the
"delayed, not lost" framing understates:

- **Machine B disagrees with machine A about what the brain knows.** Not a stale index — a *different*
  one. The multi-machine story assumes git is the transport, and the index quietly bypasses it.
- **A disk failure loses a note the brain was actively citing**, which is the worst possible shape for
  this defect: the owner has evidence the note is safely "in the brain" precisely because it answers
  questions from it.

The right invariant to state in the fix: **anything the index knows, git must know too**, and the gap
between the two must be bounded by an exchange, not by a session.

### The invariant is ASYMMETRIC — `git ≥ index`, not `git = index`

The two directions of divergence do not cost the same, and stating equality would over-correct the
harmless one:

- **Index ahead of git** (what was observed): machines silently disagree, and a disk failure takes a
  note the brain was citing. **Serious.**
- **Git ahead of index** (after a pull): a momentarily incomplete search, which the startup catch-up
  already repairs on its own ("0 doc en retard"). **Benign, and already handled.**

**Convergence is not what is missing** — they *do* converge, at the next session start. What is missing
is a **bound**: "the next time you happen to open Claude" is not a duration. The fix owes a stated bound,
not a convergence goal.

**Rejected: making indexing wait for the commit.** It would make alignment true by construction, and it
**couples two failure modes that are independent today**: a missing git identity or a conflict would then
also break search. Today git can jam and the brain still answers, which is a property worth keeping.
Correct direction is the mirror: keep indexing eager, make the **commit as eager as the indexing**,
driven by the same disk event.

### P1 vs P2 — two problems that were fused, and only P1 ships

Established 2026-07-28, and it **corrects an earlier framing in this very file**: the "a week writing in
Obsidian without opening Claude" scenario does **not** produce an index ahead of git. The watcher lives
in the MCP server, which lives and dies with the session — no session, no watcher, no campaign, **so
nothing runs at all** and both lag *together*, then both catch up at the next start.

- **P1 — index ahead of git, WITHIN a session.** What was actually measured. Engine-side, bounded,
  testable, no product decision. **This is what ships.**
  - [ ] **Design agreed with Thomas: end of an indexing campaign → commit (+ push).** The campaign is
        already debounced, so this yields **one commit per burst**, not one per file, at the moment the
        engine already knows its own result ("1 doc indexé, 0 erreur").
  - [ ] **Trigger on `indexed > 0 || removed > 0`, never on "a campaign ended"** — the two field
        findings that pin this down, both 2026-07-28:
    - [ ] **F9**: a deletion runs a campaign that indexes **nothing** (`last-run.json`:
          `indexed:0, removed:1`). Gate on `indexed` alone and deletions stay uncommitted — the exact
          hole F9 documents, shipped inside its own fix.
    - [ ] **F11**: campaigns also fire on `.obsidian/` UI churn, which indexes nothing and changes
          nothing git can see. Gate on "a campaign ended" and the hook fires on pane moves — harmless
          today only because `.obsidian/` is gitignored, i.e. **by accident**, and `autopush` would
          carry it to the network.
  - [x] **No loop risk — verified 2026-07-28**: the watcher watches `VAULT_DIR` only and `.cache` is
        deliberately outside it (`rag/src/index.ts`), while a commit writes to `.git/`. It cannot wake
        itself.
  - [x] **The reverse direction already holds**: after a pull, files land on disk and the watcher (or the
        startup catch-up) indexes them. Nothing to build there.
  - [ ] Reuse `auto-push.mjs` rather than reimplementing a push; it already gates on
        `secondbrain.autopush` + remote + upstream + unpushed count (`git-push.mjs:7`).
  - [ ] Remember the `sacred` trap: the trigger must reach **deployed** brains, so it goes through
        `reconcileHooks`, not through a hand-edit of `.claude/settings.json`.
- **P2 — nothing is committed or pushed at all while Claude is never opened.** ❌ **REJECTED
  (Thomas, 2026-07-28).** It would require something running **outside** any session (LaunchAgent, cron,
  git hook): *"P2 implique trop de choses et un côté immersif qui ne va pas plaire aux gens"* — a
  background daemon on someone's machine is a real commitment, operationally and privacy-wise, on a
  product whose pitch is that nothing leaves the machine.
  - [ ] Consequence the release note **must** own rather than hide: the guaranteed bound is *"your notes
        are backed up the next time you open your brain"*. Say it plainly instead of implying continuous
        backup. There are three layers (index → local git → remote) and this release guarantees the first
        two, within a session; `secondbrain.autopush` is opt-in and **off by default** for the fleet.

**Credit where due, and it is the counter-example to F7.** Asked "tout est commit ?", the brain **ran
`git status` and listed the untracked files** before answering, distinguished what it had produced from
what it had not, and asked for a green light before touching anything. That is the standard F7 asks for,
demonstrated in the same session — so the fix for F7 is about making it reliable, not about teaching it.

---

## F9 — A note DELETED inside Claude is not committed: the hook is tool-shaped, not file-shaped

> **F8's mirror image, and it closes the argument.** F8 = a file written *outside* Claude is not
> committed. F9 = a file removed *inside* Claude is not committed either. The common cause is not
> "outside Claude" at all — it is that auto-commit keys on **which tool ran**, while the vault changes
> on **disk events**. Same asymmetry as F8, one layer deeper: **indexing is file-driven, committing is
> tool-driven.**

- [ ] **No separate fix — F9 is F8/P1's second test case.** The campaign-end trigger designed for P1
      catches this one too (the deletion *did* run a campaign, see the evidence). What F9 changes is the
      **test list**, not the design: a fix tested only on creation would ship with this hole open.
  - [ ] The P1 test must cover **deletion**, not only creation: `last-run.json` reports `removed: 1`
        distinctly from `indexed`, so the trigger must fire on `indexed > 0 **|| removed > 0**`.
        Gating on `indexed` alone — the obvious reading of "end of an indexing campaign" — would
        reproduce F9 exactly.
  - [ ] Cover the `rm`-via-Bash path explicitly, since it is what the field hit, and it is not exotic:
        deleting a note is a normal request an owner makes in plain language.

**Observation (2026-07-28, Desktop).** Owner: *"tu peux supprimer aussi le fichier que j'ai rajouté
aujourd'hui dans daily"*. The brain read the note first (good), deleted it, then reported:

> *"**Git** : rien à committer, il était **non suivi** (jamais entré dans l'historique)."*

**Both halves are false**, and the host's own diff chip said so on the same screen: `+0 −1`.

**Verified on disk, read-only (2026-07-28).**

- The note **was** tracked: added by `13246bd auto: session-start sweep (outside-Claude edits or engine
  writes)` — i.e. **F8's own catch-up did its job**, and that is precisely what made the later claim wrong.
- The deletion is **pending, uncommitted**: `git status` → ` D vault/daily/Test de nouvelle note débile.md`;
  `git diff --stat HEAD` → `1 file changed, 1 deletion(-)`. That single line **is** the `+0 −1` chip.

**Root cause (same line of settings as F8).** `.claude/settings.json.template:52-62` wires
`auto-commit.mjs` to `PostToolUse` with matcher `Write|Edit`. A deletion goes through **Bash/`rm`** →
no match → the hook never runs. `auto-commit.mjs:51` would have staged it happily (`git add .`); it is
never asked to.

**And the rescue the brain hoped for does not exist.** It said *"normalement il rattrape ça à l'arrêt de
la session (Stop), mais je ne peux pas le vérifier dans ce tour"*. The `Stop` hook
(`settings.json.template:136-146`) runs **`auto-push.mjs`, which is push-only** — its own header states
it: *"auto-commit.mjs (PostToolUse) stays commit-only"* (`auto-push.mjs:6`). With nothing committed,
there is nothing to push. **The deletion waits for the next SessionStart sweep**, exactly like F8.

**Index ahead of git again — this time on a deletion, within a session.** Index: 414 documents / 4501
chunks (queried read-only in `rag/.cache/vault.db`), the note gone. Git: still holding it. **P1's exact
scenario, second instance, opposite direction.**

### The aftermath, and it is the trap P1 must not fall into *(2026-07-28, same session)*

Asked *"est-ce que tu penses bien à tout push à chaque fois ?"*, the brain committed + pushed the
deletion (`74383b4`, `cf08685..74383b4`), **verified the wiring instead of asserting it** (`remote`
present, `secondbrain.autopush = true`), gave the right practical answer, and then **offered to carry
the defect itself**:

> *"Si tu veux, je peux garder le réflexe de vérifier `git status` en fin de session pour attraper ces
> cas-là avant que tu aies à le demander. Tu veux que je le fasse systématiquement ?"*

- [ ] **Refuse that shape of fix, and say why in the release.** It is a **structural engine defect
      offered an agent-side plaster.** Three reasons it must not be taken:
  - [ ] It is not deterministic. Everything F9 documents comes from a hook being *guaranteed* to run;
        an agent habit is guaranteed by nothing, least of all across `/clear` and new sessions.
  - [ ] It would land in **one brain's** memory or constitution, i.e. reach **nobody** in the fleet
        (`CLAUDE.md` is `SACRED_FILES`, cf. the constraint at the top of this file).
  - [ ] **It would hide the defect from the very QA that found it.** A brain that self-heals in the
        chat stops producing the evidence, and F9 becomes unobservable rather than fixed.
- [ ] **But keep the good half.** The instinct is right, only the layer is wrong: what the brain is
      reaching for is exactly `repo-status.mjs:107` (alerting when vault notes survive the sweep).
      **P1 makes the plaster unnecessary**; the release note should be able to say the owner no longer
      has to think about it, which is the actual promise.

**One factual slip, same message, F7 family.** *"le push est géré par le **hook d'auto-commit**"* and
*"le hook fait `add + commit + push` tout seul"*. It does not: `auto-commit.mjs:5` states
**"COMMIT-ONLY: it never pushes"**, and the push is a separate `Stop` hook debounced to once per turn
(`auto-push.mjs`). The **conclusion** was right (created/edited notes are pushed) and the wiring **was**
verified, so this is not F7's silent-presumption shape. It is the milder one: a correct outcome
explained by a mechanism nobody checked. Worth recording because F9's whole subtlety lives in the
distinction between those two hooks, and the brain flattened it.

**Credit, and it is the F7 pattern in its good form.** Asked *"tout est commit ?"*, the brain ran
`git status`, found the `D`, **corrected its own earlier claim out loud** (*"le fichier de test avait
finalement été commité par le hook pendant la session … d'où le `D` maintenant"*), named the root cause
correctly (`rm` vs the Write|Edit matcher), **flagged the one thing it could not check as unchecked**,
and asked before committing. The gap is not judgement — it is that the first answer was volunteered
without the `git status` the second one ran. See F7.

---

## F10 — A note the indexer cannot read is dropped silently, and the owner is told "0 error"

> **The worst failure mode this brain has**, in its quietest form: not a wrong answer, a **confident
> answer over an incomplete index**. F7 is the agent presuming; F10 is the **engine** presuming, and it
> is more serious because no amount of agent discipline can surface a number the engine never wrote down.

- [ ] **Make phase-1 errors reach the same place phase-2 errors reach**
  - [ ] Root cause, exact and readable in three lines: `reporter.start()` **resets** `errors: []`
        (`rag/src/lib/reindex-reporter.ts:54`) and it runs **after phase 1**
        (`index-manager.ts:260`, inside `runIndexingPhase`). `reporter.finish()` then merges **only**
        `runResult.errors` — the phase-**2** errors (`index-manager.ts:271`). Phase-1 read errors are
        pushed to `result.errors` (`index-manager.ts:201`) and **never handed to the reporter**.
  - [ ] Consequence: `last-run.json` / `last-run.md` / `vault_stats` — everything the owner and the
        agent can see — under-report. An **unreadable or unparseable note is scanned, dropped, and
        counted nowhere**. Only the returned object knows, and only `watcher.log` prints it.
  - [ ] Fix direction: hand phase-1 errors to the reporter (either `reporter.start({errors})` seeded
        rather than reset, or a `recordError()` per read failure — the method already exists at
        `reindex-reporter.ts:67` and has **no caller on this path**).
  - [ ] Guard it with the arithmetic the owner can check: `scanned == indexed + skipped + errors`.
        In the field run it reads `414 == 0 + 413 + ?` → the missing 1 is the defect, and an invariant
        test on that sum would have caught it without any knowledge of the code.
  - [ ] Identify what actually failed in `mind-palace` (reproduce with a CLI reindex and print the
        error strings). **Not needed to establish the defect** — but a real file has been failing on
        every campaign of this QA and nobody knows which.

**Field evidence — three channels, one run, two answers (2026-07-28).**

| Channel | What it said about the 13:45:45 campaign |
| --- | --- |
| `watcher.log` (`index.ts:421-423`) | `✅ catch-up done: 0 indexed, 413 unchanged, **1 errors**` |
| `last-run.json` (same `finishedAt`, to the millisecond) | `"errors":[]`, `scanned:414, skipped:413, indexed:0, removed:1` |
| The brain, to the owner | *"Watcher actif (idle), **0 erreur**, index à jour."* |

The brain was **faithful to what it was given** — `vault_stats` reads the reporter's state. The engine
handed it a clean bill of health for a run that had an error. And the same `1 errors` appears in the
**preceding** campaign (13:44:45), so this is a standing condition of that vault, not a one-off blip.

**Not a data-loss report, and worth saying so plainly.** The index is currently complete: 414 `.md` on
disk = 414 `documents` rows, and **0 orphan chunks** (`chunks LEFT JOIN documents ON doc_path` → 0; the
FK is `ON DELETE CASCADE`). So nothing is missing *today* — which is exactly why this must be fixed on
the mechanism rather than on the symptom: **the day a note does fail, the brain will say "index à jour"
and answer without it.**

**Bonus, settled while here — the 4501-chunks coincidence is real.** The brain explained an unchanged
chunk count after a deletion by *"tes 4 pages consolidées ont été réindexées en parallèle"*. Narrated in
the measured voice without checking (F7's shape, third instance in two screens) — but **verified true**:
no orphan chunk remains from the deleted note. Recorded so nobody re-opens it as a leak.

---

## F11 — The watcher watches `.obsidian/`, which git deliberately ignores

- [ ] **Make the watcher's filter agree with the one git already has**
  - [ ] `IGNORED_SEGMENTS = [".cache", ".git", "node_modules"]` (`rag/src/lib/vault-watcher.ts:16`) —
        **`.obsidian` is absent**, while `.gitignore:34` has excluded `vault/.obsidian/` from day one.
        Two filters expressing the same intent ("this is UI state, not notes"), and only one knows it.
  - [ ] Field evidence: `📝 write detected: .obsidian/graph.json` ×3 and `.obsidian/workspace.json`,
        which then triggered a full catch-up campaign (`0 indexed, 413 unchanged`). Obsidian rewrites
        `workspace.json` on ordinary UI gestures — **an owner with Obsidian open pays a 414-file scan
        for moving a pane.**
  - [ ] Add `.obsidian` to the ignored segments. One line, and the anti-loop reasoning in the comment
        above it (`vault-watcher.ts:11-14`) already establishes the principle — it just stopped one
        directory short.

**Why it lands in the release even though it is cosmetic on its own: it constrains F8/P1.** P1's design
is *"end of an indexing campaign → commit (+ push)"*. Campaigns fire on `.obsidian` churn, so the
trigger must **not** be "a campaign ended" but "a campaign **changed something**"
(`indexed > 0 || removed > 0`). Today that saves us by accident: `.obsidian/` is gitignored, so
`git add .` finds nothing and `attemptCommit` no-ops on a clean tree. **Accidental safety is the thing
this file exists to convert into deliberate safety** — and with `secondbrain.autopush` on, the same
trigger reaches the network.

---

## F12 — *(next entry: appended during the run)*
