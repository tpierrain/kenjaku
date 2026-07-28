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

**Credit where due, and it is the counter-example to F7.** Asked "tout est commit ?", the brain **ran
`git status` and listed the untracked files** before answering, distinguished what it had produced from
what it had not, and asked for a green light before touching anything. That is the standard F7 asks for,
demonstrated in the same session — so the fix for F7 is about making it reliable, not about teaching it.

---

## F9 — *(next entry: appended during the run)*
