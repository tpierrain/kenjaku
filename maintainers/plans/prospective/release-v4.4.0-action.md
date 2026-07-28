<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- STATUS: 🚧 ACTION PLAN (opened 2026-07-28) — the release that turns the      -->
<!-- `mind-palace` field log (F1-F12) into shipped code. Nothing implemented yet. -->
<!-- Evidence lives in `prospective/fleet-upgrade-field-feedback.md`; this file   -->
<!-- owns the WORK. Do not re-investigate the entries — they were verified on disk.-->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Release v4.4.0 — a note is saved as you write it, and your own status line survives

- **STATUS:** 🚧 Not started. Plan written 2026-07-28, scope settled with Thomas the same day.
- **Scope:** Second brain (runtime) + Installer — the commit trigger, the status line, the indexer's
  error reporting, the consolidation writer, the update source, the startup screen, an engine skill.
- **Branch:** currently `docs/fleet-upgrade-field-feedback` (documentation-shaped). Cut
  `feat/v4.4.0-field-fixes` when the first code commit lands.
- **Why v4.4.0 and not v4.3.1:** two new capabilities, not repairs of v4.3.0's own code — a commit
  that follows the index instead of the session, and a status line that yields to the owner's. Semver
  says minor.

## ▶️ START HERE

The QA is **closed**. Do not re-run it, do not re-read `mind-palace`, do not re-investigate any entry:
each one in the field log states observation → root cause → fix, and **every one was verified on disk**.
The two decisions that were pending are **answered** (below). Resume at the first unticked box in
`## Tracking` and announce which track before writing code.

**The three answers from Thomas, 2026-07-28** — they are the reason this plan exists in this shape:

- **F12 ships in full** (a deterministic front-matter writer, not just an alarm) → **Track 4**.
- **The pre-fill ships in its "retrieval" form** (query `type: person` notes) → **Track 8**.
- **The status line RETREATS** — Kenjaku stops occupying it so the owner's own line runs again. This
  **pulls F2 forward out of Gate 4**, where the frozen scope had left it → **Track 2**.

**The headline is Track 1, and it is not a feature.** v4.3.0 already told the fleet that notes typed
straight into Obsidian are *"enfin commitées/synchronisées"*. They are indexed within seconds and
committed only at the **next session start**. This release **makes true a sentence we already
published**.

**The constraint that decides WHERE each fix lands — do not re-derive it.** `CLAUDE.md` and
`.claude/settings.json` are `SACRED_FILES` (`scripts/lib/engine-apply-plan.mjs:32`): never rewritten by
an update, so **anything landing there reaches new installs only, never the deployed fleet**. What does
reach the fleet: anything matching `ENGINE_SCRIPT` (`engine-apply-plan.mjs:20` — `scripts/*.mjs`,
including `status-line.mjs`), plus `scripts/lib/**`, `rag/**` and the engine skills.

---

## Tracking

- [x] **Track 0 — This plan exists in the repo, and the pointers agree with it** _(2026-07-28)_
- [ ] **Track 1 — A note is saved while you are still writing it** *(headline — F8/P1, F9, F11)*
- [ ] **Track 2 — Your own status line survives opening your brain** *(F2, F4, ADR 0036)*
- [ ] **Track 3 — A note the engine cannot read is reported, not swallowed** *(F10)*
- [ ] **Track 4 — Consolidating a page can no longer damage it** *(F12)*
- [ ] **Track 5 — An installed brain follows the launcher when it moves** *(F1)*
- [ ] **Track 6 — The first screen speaks to you, not to the machine** *(F5)*
- [ ] **Track 7 — `/rag` answers instead of suggesting `/run`** *(F6)*
- [ ] **Track 8 — The profile pre-fill reads the notes you wrote** *(retrieval)*
- [ ] **Track 9 — Cut the release**

> **Cut line, if the release grows too long.** Tracks 1-4 **are** the release. Tracks 5-8 are mutually
> independent and each can be dropped to a follow-up without touching the others. Decide at the
> `/code-review` step, on the real diff — **not before**.

---

## Track 1 — A note is saved while you are still writing it *(F8/P1, F9, F11)*

**The defect in one line: indexing is file-driven, committing is tool-driven.**
`.claude/settings.json.template:52-62` wires `auto-commit.mjs` to `PostToolUse` with matcher
`Write|Edit`, so it fires only after *Claude* writes a file. Three classes of writer are missed, all
field-confirmed on 2026-07-28:

1. **the engine's own script** (`set-universe-profile.mjs` wrote `vault/inqom/universe.md` in Node) —
   the **primary** case, because an owner meets it without doing anything unusual;
2. a note typed **outside Claude**, in Obsidian (F8);
3. a note **deleted** via `rm`/Bash from inside a session (F9).

The index then runs **ahead of git**: the brain searches, finds and cites a note that exists on no
remote and on no other machine. Two consequences the "delayed, not lost" framing understates — machine
B disagrees with machine A about what the brain knows, and a disk failure takes a note the owner has
evidence is safe *precisely because it answers questions*.

**The invariant is asymmetric: `git ≥ index`, not `git = index`.** Index-ahead-of-git is serious;
git-ahead-of-index (after a pull) is benign and already repaired by the startup catch-up. **Convergence
is not what is missing** — they do converge, at the next session start. What is missing is a **bound**:
*"the next time you happen to open Claude"* is not a duration.

- [ ] **Trigger: the end of an indexing campaign that CHANGED something → commit (+ push).**
      Design agreed with Thomas. The campaign is already debounced, so this yields **one commit per
      burst**, at the moment the engine already knows its own result.
  - [ ] Gate on **`indexed > 0 || removed > 0`**, never on *"a campaign ended"*. Both halves are pinned
        by a field finding:
    - [ ] **F9** — a deletion runs a campaign that indexes **nothing** (`last-run.json`:
          `indexed:0, removed:1`). Gating on `indexed` alone reproduces F9 **inside its own fix**.
    - [ ] **F11** — campaigns also fire on `.obsidian/` UI churn. Gating on "a campaign ended" fires
          the commit when the owner moves a pane. Harmless today only **by accident** (`.obsidian/` is
          gitignored, so `git add .` finds nothing) — and `autopush` would carry it to the network.
  - [ ] Implement it **watcher-side** (`rag/**` is engine-owned `replace`, so it reaches the fleet), not
        as a new hook. A hook is session/tool-shaped, which **is** the defect.
  - [ ] **Reuse, do not reimplement git**: spawn `scripts/auto-commit.mjs` then `scripts/auto-push.mjs`.
        `auto-push.mjs` already gates on `secondbrain.autopush` + remote + upstream + unpushed count
        (`scripts/lib/git-push.mjs:7`), and `auto-commit.mjs:51` already does `git add .`.
  - [ ] If a settings change turns out to be needed after all, it **must** go through `reconcileHooks`
        (`scripts/lib/hooks-reconcile.mjs:53-73` — add-only, dedup by script identity), never a
        hand-edit of the sacred `settings.json`, or the release delivers nothing to deployed brains.
- [x] **`.obsidian` joins the watcher's ignore list** *(F11)* _(2026-07-28 · `a138ee4`)_.
      Red seen for the right reason (`false !== true`), plus the boundary decoy so a note *about*
      Obsidian stays a note. 12/12 green in `vault-watcher.test.ts`.
- [x] **The pure decider exists and is triangulated** _(2026-07-28)_:
      `rag/src/lib/campaign-persist.ts` → `shouldPersistCampaign({indexed, removed})`. Three baby-steps,
      each red-then-green: indexed alone, **removed alone (F9)**, and the `0/0` boundary that separates
      `> 0` from `>= 0` and locks F11. **Still to do: wire it into `index.ts`'s campaign end and spawn
      `auto-commit.mjs` + `auto-push.mjs` behind an injectable seam.**
- [ ] **TDD, red first** (`tdd-discipline`), four cases — three field-proven writers plus the regression.
      The decider's half is done; these are the **wiring** cases, at the `index.ts` seam:
  - [ ] a file written by the **engine's own script** → committed;
  - [ ] a note created **outside Claude** → committed;
  - [ ] a note **deleted** via `rm` → committed *(the decider already proves `removed > 0` is in the gate)*;
  - [ ] a `.obsidian/workspace.json` churn campaign → **no commit** *(F11's lock, both layers)*.
- [x] **No loop risk — verified 2026-07-28.** The watcher watches `VAULT_DIR` only and `.cache` is
      deliberately outside it; a commit writes to `.git/`. It cannot wake itself. Recorded so nobody
      re-opens it.
- [x] **The reverse direction already holds.** After a pull, files land on disk and the watcher (or the
      startup catch-up) indexes them. Nothing to build.
- [ ] **The release note owes an honest bound.** P2 — committing while Claude is never open — was
      **rejected** by Thomas: it needs something running outside any session (LaunchAgent, cron, git
      hook), *"trop de choses et un côté immersif qui ne va pas plaire aux gens"*, on a product whose
      pitch is that nothing leaves the machine. So the guarantee is **"your notes are saved as you write
      them, as long as your brain is open"**. Three layers (index → local git → remote); this release
      guarantees the first two within a session, and `secondbrain.autopush` stays opt-in, off by default.
      **Say it plainly instead of implying continuous backup.**
- [ ] **Refuse the agent-side plaster, and say why in the release.** During the QA the brain offered to
      *"keep the reflex of checking `git status` at end of session"* — and **the offer was accepted
      within one exchange**, which is the finding itself: the product made "yes" cheaper than the
      diagnosis. It must not be taken: it is not deterministic; it would land in one brain's sacred
      `CLAUDE.md` and reach **nobody** in the fleet; and **it would hide the defect from the QA that
      found it**. Keep the good half — the instinct is `repo-status.mjs:107` (alerting when vault notes
      survive the sweep), and **this track makes the plaster unnecessary**.

---

## Track 2 — Your own status line survives opening your brain *(F2, F4, ADR 0036)*

**Decision (Thomas, 2026-07-28): RETREAT.** F4 settled — owner-verified on Desktop — that **Claude
Desktop's Code tab renders no status line at all**. So ours is a **CLI-only** surface: it delivers
nothing on the surface that justified it (Desktop, the non-dev persona) while **evicting the owner's own
line** on the one surface where it does render, i.e. among precisely the people most likely to have
configured one. Eviction has lost its argument.

> ⚠️ **The trap, and it is the whole difficulty of this track.** Making `status-line.mjs` print nothing
> does **not** give the owner their line back. `statusLine` is a **single value, not a merged list**, so
> the brain's `.claude/settings.json` still wins for the whole session and the owner gets a **blank
> line**. And that file is sacred, so an update cannot simply rewrite it. **The retreat has to remove
> the key, in a deployed brain, through the reconciler.**

- [ ] **Reroute what would otherwise be lost — BEFORE removing anything.**
  - [ ] **The restart nudge is the only genuine loss.** `scripts/lib/restart-nudge.mjs` is surfaced
        *only* by `status-line.mjs:116-142`; `scripts/session-status.mjs` never imports it. Emit it from
        `session-status.mjs`'s `systemMessage` (it already joins its lines at `:177-184`), from the same
        two inputs: the `.cache/restart-needed` flag and `onDiskGapNeeded()`.
  - [x] **Already covered — verified, nothing to build.** The Gemini-key warning
        (`session-status.mjs:124-137`) and the RAG staleness counter (`:76-122`) are already duplicated
        there in prose.
  - [ ] Keep the 🛑 MANDATORY chat rule at `.claude/skills/update-engine/SKILL.md:105-115` and **mark it
        as the only harness**, not as a redundant belt — so no future cleanup trims it as duplication.
        On Desktop it is, and always was, the sole delivery of the restart instruction.
- [ ] **New installs: stop setting it.** Remove the `statusLine` block from
      `.claude/settings.json.template:46-50`. A brain with no `statusLine` never acquires one — pinned
      by `scripts/lib/reconcile-brain.test.mjs:627` and `:726`.
- [ ] **Deployed fleet: remove the key we installed, and only that one.**
  - [ ] Extend `scripts/lib/reconcile-brain.mjs:200-209`, today the **only** write to `statusLine`
        inside a sacred `settings.json` (the Windows prefix repair via `repairWin32NodePrefix`).
  - [ ] **Provenance guard, non-negotiable**: remove the key **only** when its `command` points at our
        own `scripts/status-line.mjs`. Anything the owner set by hand is left untouched. Same discipline
        as `scripts/lib/engine-skill-refresh.mjs` — overwrite only what is byte-identical to what the
        engine delivered.
  - [ ] ⚠️ **This makes the reconciler's write no longer purely additive.** Its section comment
        (`reconcile-brain.mjs:165-180`) currently says it is. Update it, and **report the removal in the
        update's output** — the owner should read something like *"your own status line is back"*.
  - [ ] Tests: engine-installed `statusLine` → **removed**; hand-customized → **preserved**; brain with
        none → **unchanged, byte-identical** (the converged-brain guarantee at `:204`).
- [ ] **Decide the fate of `scripts/status-line.mjs`** — deleted with its now-unused seams, or kept as a
      documented opt-in. Decide **once**, in the ADR, and say it where an owner reads it.
- [ ] **ADR 0036 — the channel matrix** *(next free number; `Scope: Second brain (runtime)`)*.
      This is the point of F4: **a fact living only in comments rots and gets built upon.** Four source
      comments asserted Desktop renders a status line (`status-line.mjs:4-6` and `:116-118`,
      `restart-nudge.mjs:6`, `session-status.mjs:7-9`) while our own skill asserted the opposite. Carry
      the field-verified table (Claude Code v2.1.220, same brain, same session boundary):

      | Channel | CLI (terminal) | Desktop — Code tab |
      | --- | --- | --- |
      | `statusLine` | ✅ rendered, persistent | ❌ **nothing** |
      | SessionStart `systemMessage` | ✅ displayed | ❌ dropped |
      | SessionStart `additionalContext` | ⚠️ **echoed verbatim to the user** | ✅ agent-only, as designed |
      | The agent's chat text | ✅ | ✅ **the only channel reaching both** |

  - [ ] State the three consequences: the **chat is the only universal channel**, so anything an owner
        MUST see belongs in the agent's message; `additionalContext` is **not backstage on the CLI**;
        and **nothing here is inferable from the documentation**, which never mentions Desktop and is
        framed entirely in terminal terms. Verify, date, record — do not re-derive.
  - [ ] Have the surviving comments **point at the ADR** instead of asserting on their own authority.
  - [ ] List it in `maintainers/README.md`'s `decisions/` section, one bullet ending in `**Scope: …**`.

---

## Track 3 — A note the engine cannot read is reported, not swallowed *(F10)*

**The worst failure mode this product has, in its quietest form**: not a wrong answer, a **confident
answer over an incomplete index**. Three of our own channels disagreed about the same run, and the one
the owner sees is the optimistic one — `watcher.log` said `1 errors`, `last-run.json` said `"errors":[]`,
and the brain told the owner *"0 erreur, index à jour"*. The brain was **faithful to what it was given**.

- [ ] **Root cause, exact and readable in three lines.** `reporter.start()` **resets** `errors: []`
      (`rag/src/lib/reindex-reporter.ts:54`) and runs **after phase 1**
      (`rag/src/lib/index-manager.ts:260`, inside `runIndexingPhase`). `reporter.finish()` then merges
      **only** `runResult.errors`, the phase-**2** errors (`:271`). Phase-1 read errors are pushed to
      `result.errors` (`:201`) and **never handed to the reporter** — so `last-run.json`, `last-run.md`
      and `vault_stats`, i.e. everything the owner and the agent can see, under-report.
- [ ] **Fix**: hand phase-1 errors to the reporter — seed `reporter.start({errors})` instead of
      resetting, or call `recordError()` per read failure. **That method already exists**
      (`reindex-reporter.ts:67`) and has **no caller on this path**.
- [ ] **Ship the invariant test: `scanned == indexed + skipped + errors`.** Not a nice-to-have — it was
      **validated in both directions on real data** during the QA: the broken run read
      `414 ≠ 0 + 413`, the repaired one `415 = 2 + 413`. It detects the incident **from the numbers
      alone, with no knowledge of the cause**.
- [ ] Optional, and explicitly not required to establish the defect: reproduce with a CLI reindex and
      print the error strings, to name what was failing in `mind-palace` all afternoon.

---

## Track 4 — Consolidating a page can no longer damage it *(F12)*

**Decision (Thomas, 2026-07-28): ships in full, not the minimal alarm.** It is our own code silently
damaging the owner's notes, and the damage is invisible because F10 hides it.

**The chain, verified on disk.** Consolidation appended a **second `updated:` key** to
`vault/inqom/topics/crise-kandor-clemence.md` (invalid YAML) → the indexer's re-read failed on every
campaign since → **F10 swallowed the error** → the note stayed searchable and **confidently out of
date**, its newest section absent from `chunks`. Four defects chained, none of them audible.

- [ ] **Fix the writer, not the file.** `engine-skills/consolidate/SKILL.md:113` instructs the agent to
      *"append a dated section … and bump the page's `updated:`"* — freehand, with no deterministic
      writer and no validation. The skill already delegates **creation** to a script; only the
      **refresh** is freehand.
  - [ ] Give the refresh path a core that rewrites front-matter **by key**, so *"bump `updated:`"*
        cannot become *"add a second `updated:`"* — the same treatment every other durable write gets
        (ADR 0009).
  - [ ] Point the skill at that script instead of describing the edit in prose.
- [ ] **Validate front-matter at the seam that already reads every note.** A duplicate key is a one-line
      check, and it is the difference between a defect that announces itself and one that does not.
- [ ] Test the exact shape that occurred: two `updated:` keys, three lines apart (lines 5 and 7).
- [ ] **The irony belongs in the release note, stated calmly** (CONVENTIONS §11 — fix without
      dramatizing): consolidation exists so fresh captures become findable on the page that owns them,
      and here **the act of consolidating made its own output unfindable**.

---

## Track 5 — An installed brain follows the launcher when it moves *(F1)*

- [ ] **Root cause.** `recordSourceAndProvenance()` (`scripts/lib/engine-source.mjs:75`) stamps
      `source: {repo, ref}` into the brain's `engine-manifest.json` **at install time**;
      `scripts/update-engine.mjs:298` writes back `source: { ...source, ref }` — the **ref** is refreshed
      on every update, the **repo never is**. A repository rename propagates to **no already-installed
      brain, ever**. Every brain installed before the v4.0.0 rename still clones
      `tpierrain/second-brain-generator`.
- [ ] Have the launcher declare its own canonical repo URL in `engine-manifest.json` (the **fetched**
      target), so the source of truth is the launcher, not the brain's install-day memory.
- [ ] Carry that URL through at `update-engine.mjs:298`. **Keep the recorded URL when the fetched
      manifest declares none** (older launchers), so the change can never blank a working source.
- [ ] Test the redirect-free path: a brain recording the OLD URL + a fetched manifest declaring the NEW
      one → the brain ends up on the new one, and a second run is a **no-op**.
- [ ] Decide whether an unreachable recorded URL earns an actionable message (*"your brain points at a
      repository that no longer answers"*) rather than a raw `git clone` failure.
- [ ] **Why it is not cosmetic.** GitHub's redirect makes it work today, which is not reassuring: the
      entire update path of every deployed brain depends on an alias in a namespace **we no longer own**.
      The day a repository named `tpierrain/second-brain-generator` exists again — recreation, a
      transferred fork — those brains fetch **someone else's code**, or fail. A supply-chain-shaped
      defect in cosmetic clothes.

---

## Track 6 — The first screen speaks to you, not to the machine *(F5)*

`hookSpecificOutput.additionalContext` is **echoed verbatim to the CLI user**, prefixed
`SessionStart:startup says:`. So eight lines of agent-directed English protocol — a skill name, a CLI
command with a flag, `Offer ONCE, in the user's language`, `PAST the disclosure gate` — are the **first
thing an owner meets**, before typing a word, on a product sold to non-developers, in a language that is
not theirs. Thomas, on that screen: *"bcp trop verbeux je trouve pour les gens"*.

- [ ] **Progressive disclosure — Thomas's design.** Split the payload by the moment it becomes useful:
  - [ ] **Upfront (the trigger)**: the **fact** only, small enough to be harmless even when echoed —
        which universe is active, that it has no profile, that an offer is due once, in the user's
        language. **Nothing about how to run it.**
  - [ ] **On acceptance (the detail)**: the seven questions, the skill section, the write command, the
        decline command. **The agent already loads the `switch` skill at that point**, which is where
        all of it lives.
- [ ] **This deletes a duplication, it does not move it.** The trigger currently recites the question
      themes **and** says to load the skill whose `Describe a universe — its profile` section holds the
      canonical seven (`.claude/skills/switch/SKILL.md:134-147`). That redundancy is the bulk of the
      eight lines.
- [x] **Field-validated, and it is the argument for the whole decision** _(2026-07-28)_. Given only the
      fact, the agent closed a real answer with **exactly the sentence Thomas described** — unprompted,
      last, in French, in one line, with both ways out named. **It composes the offer well from the fact
      alone**; the upfront detail buys nothing.
- [ ] **Audit all three emitters** — each hook's `additionalContext` gets its own prefix, so **the leak
      scales with the number of hooks we add**: `scripts/session-universe.mjs:141-146`,
      `scripts/session-wiki-health.mjs:64`, `scripts/session-self-heal.mjs:88`. The middle one shows the
      owner the directive verb itself: `(offer /consolidate)`, `(offer /lint)`.
- [ ] **Target: one line that says the brain is ready** — which the `systemMessage` line already does,
      cleanly and without a prefix. Everything else is either plumbing that must stop being echoed, or
      an offer the agent should make **in its own words, in the flow of the conversation**.
- [ ] **Defence in depth, which is why this is worth doing even after the echo is fixed.** A one-line
      trigger that leaks is survivable; eight lines of protocol is not. The host's behaviour is not ours
      to control — nothing in the matrix was inferable from the docs.
- [ ] **Watch the double delivery**: the agent still relays the offer as intended, so the owner meets it
      twice — raw English backstage, then polished French. **The fix must not mute the agent's version,
      which is the good one.**

---

## Track 7 — `/rag` answers instead of suggesting `/run` *(F6)*

- [ ] Observed: the owner typed `/rag` and got `Unknown command: /rag. Did you mean /run?`. Plain
      language worked fine, so nothing is broken — an **affordance is missing at the exact word an owner
      of a RAG-backed brain reaches for first**. Worse than absence: the nearest-match points at `/run`,
      an unrelated built-in, so a curious owner lands somewhere with nothing to do with their index.
- [ ] Cheapest fix that fits the product: a thin `rag` skill reporting what the natural-language path
      already produces — files/chunks, watcher liveness, embedder identity, engine + schema versions.
      **The surface exists; only its name is missing.**
- [ ] Sweep the neighbouring guesses (`/status`, `/index`, `/reindex`) and decide which are worth
      aliasing. **A name nobody guesses is a feature nobody finds.**

---

## Track 8 — The profile pre-fill reads the notes you wrote *(retrieval)*

**Decision (Thomas, 2026-07-28): the retrieval fix.** The capture flow pre-filled five of seven answers
— excellent ergonomics, and the owner engaged *more* because of it — but it got the **CTO wrong** and
stated it in the same voice as the five correct answers, with nothing marking it as a guess. The drafted
reply was *"c'est bon pour tout, sauf mon rôle"*: **one keystroke from blanket acceptance.**

**Root cause, verified on disk: it never read the person notes.** The vault was neither ambiguous nor
stale. `vault/inqom/people/michael-aboumelhem.md` is tagged `cto`, updated `2026-07-19`, and its **first
two lines** answer both things the pre-fill got wrong — including the owner's own title, which the agent
had explicitly declined to guess (*"je ne veux pas l'inventer"*) **while it sat in the note about his own
manager**. There is **no person note for the name it proposed at all**.

- [ ] **The fix is retrieval, not phrasing.** When pre-filling `people` and `role`, query the
      **structured source** — notes with `type: person` (and `type: universe`) scoped to the universe —
      instead of synthesising from whatever a similarity search surfaces. **The vault has a shape; the
      pre-fill ignored it and paid for it.** Write it into `.claude/skills/switch/SKILL.md`'s
      `Describe a universe — its profile` section.
- [ ] **Specify the pre-fill itself while there — it is currently luck.** Nothing in `SKILL.md:134-147`
      asks for it, so another vault, another day, the same flow yields seven bare questions and the
      owner meets exactly the wall he fears. Rule: **research first, propose answers, ask for
      corrections**, with the two disciplines this run demonstrated spontaneously — **never invent**, and
      **show an unknown as an explicit blank** rather than a plausible guess.
- [ ] **Do not conclude "drop the pre-fill".** It turned seven questions into a one-line reply. Its cost
      is concentrated in the one interaction that costs nothing: **agreeing**.
- [ ] Keep the skill's copy saying that accepting a pre-fill records the agent's **inferences** as the
      owner's **stated facts**, in a note injected as ambient truth at every session start. Consented
      and repairable, but worth saying.
- [ ] **Keep the batch.** The alternative is seven round-trips, which the skill already rejects as an
      interrogation (`SKILL.md:136`, *"Do not interrogate"*). If it still reads long, the lever is
      **question 5's triple ask** (*"Qui manque ? Qui est de trop ? lesquels sont tes managés vs tes
      pairs ?"*), not the number of questions.
- [ ] Hand a fixture to Gate 4: *"the vault states X in a `type: person` note — does the capture flow
      propose X?"* Cheap, deterministic, and it locks the behaviour this run got wrong.

> **Deliberately NOT in this track** (Thomas chose the retrieval form): arbitrating by date when
> pre-filling, citing each proposed value's source note, and marking inference apart from reading. They
> repair a *guess*; here there was no need to guess at all. Keep them in the field log for Gate 4.

---

## Track 9 — Cut the release

- [ ] ⚠️ **`/code-review` BEFORE the merge.** Reproduce each finding against real code before accepting
      it; fix each in TDD, red first, its own commit.
- [ ] **Decide the cut line here**, on the real diff: Tracks 1-4 ship; any of 5-8 may become a follow-up.
- [ ] **CI is the arbiter, never a local green** (CONVENTIONS §9): 7/7 — Node 22/24/26 × macOS + Windows,
      plus the Windows installer e2e.
- [ ] **Mutation snapshot pinned to the tag** (CONVENTIONS §5ter), recorded in
      `maintainers/mutation/RESULTS.md` and carried in the release note. Baseline at v4.3.0:
      scripts **97.27 %**, local-mirror **90.44 %**, rag **90.42 %**.
- [ ] **Marketing-surface pass** (CONVENTIONS §10), **before** writing the release note, in this order:
      *what did this release make false, or merely imprecise?* (hunt the absolutes — *never*, *only*,
      *always*, *untouched*, *sacred*, *it can only add*), then *what did it make true that we do not
      sell yet?*
  - [ ] Re-read `README.md`, `EN-QUOI-C-EST-DIFFERENT.md`, `SETUP.md`, `CONNECTORS.md`, and the boards
        through their README alt texts + `docs/marketing-image-prompts.md`.
  - [ ] ⚠️ **Two claims this release moves specifically**: (a) v4.3.0's sentence about Obsidian notes
        being committed — **Track 1 makes it true**, say so; (b) anything asserting the reconciler
        *only adds* and *never removes* — **Track 2 makes that imprecise**.
  - [ ] **Record the verdict, including the boring one** ("boards re-read, copy still accurate, no
        re-render" is a result worth writing).
- [ ] **Release note** (CONVENTIONS §11, English): a two-sentence lead saying what the reader gains, in
      their words; `What you get` (≤ 6 emoji bullets); `What you have to do` (the command and the cost);
      then `---` and `Under the hood` with everything technical — nothing cut, moved below the fold.
      **Do not alarm**: state each fix without dramatizing the defect, and never advertise a bug that
      never shipped.
- [ ] Draft 3-4 `v4.4.0 — The One Where …` codenames; **Thomas picks**.
- [ ] Merge, tag, publish; rewrite the PR title and body to the release scope.
- [ ] **Archive this plan on ship** (CONVENTIONS §7), refresh the memory **pointer** (not a copy), and
      update `ROADMAP.md` Gate 4 (D) + the field log's Tracking with what shipped.
      **F3 and F7 stay deferred to Gate 4** — frozen scope, unchanged.

---

## Verification — watched on a real brain, not merely green

The QA that produced this plan held one standard: **every entry verified on disk, never taken from the
brain's own account.** The fixes owe the same.

- [ ] **Track 1, on a real brain**, three writers, `git log` checked after each: a note typed in
      Obsidian; `rm` of a note from inside a session; a run of `set-universe-profile.mjs`. Then move an
      Obsidian pane and confirm **no** commit fires.
- [ ] **Track 2**: open a CLI session in a brain and confirm the owner's own status line is back; run
      `update-engine` on a brain whose `statusLine` was hand-customized and confirm it is **preserved**;
      confirm the restart nudge still reaches the owner after an update that needs one.
- [ ] **Track 3**: plant a note with broken front-matter, run a campaign, confirm `watcher.log`,
      `last-run.json` and `vault_stats` now **agree**, and that the arithmetic invariant fails loudly.
- [ ] **Track 4**: run `/consolidate` on a page and diff its front-matter — one `updated:` key, in place.
- [ ] **Track 6**: open a CLI session and read the first screen as a non-developer would.
- [ ] **Track 8**: on a universe holding a `type: person` note tagged `cto`, run the capture flow and
      check it proposes that person.

---

## Out of scope, deliberately

- [ ] **F3** — a 10-minute reindex reports nothing while it runs. **Deferred to Gate 4.**
- [ ] **F7** — the brain reports an unverified outcome in the measured voice. **Deferred to Gate 4.**
      Note that **Track 3 is F7's engine-side half**: an agent cannot be disciplined into surfacing a
      number the engine never wrote down.
- [x] **P2** — committing while Claude is never open. ❌ **REJECTED** (Thomas, 2026-07-28): it needs a
      daemon outside any session, *"trop de choses et un côté immersif qui ne va pas plaire aux gens"*.
