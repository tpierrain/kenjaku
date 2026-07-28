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
      — **code complete and green** _(2026-07-28 · `9f45561`, `f274a01`, `97652d7`)_; what is left is
      the **release-note copy** (the honest bound, the refused plaster) and the **real-brain check**.
- [x] **Track 2 — Your own status line survives opening your brain** *(F2, F4, ADR 0036)*
      _(2026-07-28 · `84e4038`, `65202ba`, `44cdd24`)_ — code, ADR and copy done; the on-a-real-brain
      check stays owed in the Verification section.
- [x] **Track 3 — A note the engine cannot read is reported, not swallowed** *(F10)* _(2026-07-28 · `631b0ae`)_
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

- [x] **Trigger: the end of an indexing campaign that CHANGED something → commit (+ push).**
      _(2026-07-28 · `9f45561`, `f274a01`, `97652d7`)_ Design agreed with Thomas. The campaign is
      already debounced, so this yields **one commit per burst**, at the moment the engine already
      knows its own result.
  - [x] Gate on **`indexed > 0 || removed > 0`**, never on *"a campaign ended"*. Both halves are pinned
        by a field finding:
    - [x] **F9** — a deletion runs a campaign that indexes **nothing** (`last-run.json`:
          `indexed:0, removed:1`). Gating on `indexed` alone reproduces F9 **inside its own fix**.
    - [x] **F11** — campaigns also fire on `.obsidian/` UI churn. Gating on "a campaign ended" fires
          the commit when the owner moves a pane. Harmless today only **by accident** (`.obsidian/` is
          gitignored, so `git add .` finds nothing) — and `autopush` would carry it to the network.
  - [x] Implement it **watcher-side** (`rag/**` is engine-owned `replace`, so it reaches the fleet), not
        as a new hook. A hook is session/tool-shaped, which **is** the defect.
  - [x] **Reuse, do not reimplement git**: spawn `scripts/auto-commit.mjs` then `scripts/auto-push.mjs`.
        `auto-push.mjs` already gates on `secondbrain.autopush` + remote + upstream + unpushed count
        (`scripts/lib/git-push.mjs:7`), and `auto-commit.mjs:51` already does `git add .`.
  - [x] **No settings change was needed** _(2026-07-28)_ — so `reconcileHooks` was never touched, and
        the fix reaches deployed brains through `rag/**` alone. Had one been needed it would have gone
        through `scripts/lib/hooks-reconcile.mjs:53-73` (add-only, dedup by script identity), never a
        hand-edit of the sacred `settings.json`.
  - [x] **A guard the plan had not foreseen: the launcher is not a brain** _(2026-07-28 · `f274a01`)_.
        Run the engine from the generator (a maintainer's `npm run dev`) and this would have swept the
        launcher's working tree into an `auto:` commit. `persistenceApplies` reads the manifest's
        `provenance`, stamped at install (`scripts/lib/engine-source.mjs`) and absent from the
        launcher's own. **Fails closed** on an unreadable manifest.
  - [x] **Deliberately watcher-only** _(2026-07-28)_: the startup catch-up and the `reindex` tool are
        NOT wired to persistence. The session-start sweep already covers the first, and a session's
        own writes go through the `Write|Edit` hook. One trigger, one commit per burst.
- [x] **`.obsidian` joins the watcher's ignore list** *(F11)* _(2026-07-28 · `a138ee4`)_.
      Red seen for the right reason (`false !== true`), plus the boundary decoy so a note *about*
      Obsidian stays a note. 12/12 green in `vault-watcher.test.ts`.
- [x] **The pure decider exists and is triangulated** _(2026-07-28)_:
      `rag/src/lib/campaign-persist.ts` → `shouldPersistCampaign({indexed, removed})`. Three baby-steps,
      each red-then-green: indexed alone, **removed alone (F9)**, and the `0/0` boundary that separates
      `> 0` from `>= 0` and locks F11.
- [x] **The orchestration around it** _(2026-07-28 · `9f45561`)_: `persistCampaign` runs commit **then**
      push behind an injectable `runScript`. **Asynchronous on purpose** — a push waits on the network
      (and on `auto-push.mjs`'s own blocking retry) inside the MCP server, where a synchronous wait
      would freeze every search for its duration. Best-effort like every other persistence path: a
      failure reports `"failed"` instead of taking down the live-update loop, and the `await` that makes
      an async rejection catchable is pinned by its own test (hand-mutated, mutant killed).
      `buildScriptRunner` keeps the child's output **buffered, never inherited** — the MCP server's
      stdio IS the protocol channel.
- [x] **TDD, red first** (`tdd-discipline`), four cases — three field-proven writers plus the regression
      _(2026-07-28 · `97652d7`)_. The `index.ts` seam was untested glue, so the campaign's body moved to
      `rag/src/lib/campaign-run.ts` (the repo's own rule: *test the glue too*); index.ts now only hands
      it the real seams. The four cases live there, against in-memory fakes:
  - [x] a file written by the **engine's own script** → committed;
  - [x] a note created **outside Claude** → committed;
  - [x] a note **deleted** via `rm` → committed *(the decider already proves `removed > 0` is in the gate)*;
  - [x] a `.obsidian/workspace.json` churn campaign → **no commit** *(F11's lock, both layers)*.
  - [x] Bonus, from the extraction: the `✅ catch-up done` trace line is now pinned by a test instead of
        by nothing, and the launcher path (`persist: null`) has its own case.
- [x] **No loop risk — verified 2026-07-28.** The watcher watches `VAULT_DIR` only and `.cache` is
      deliberately outside it; a commit writes to `.git/`. It cannot wake itself. Recorded so nobody
      re-opens it.
- [x] **The reverse direction already holds.** After a pull, files land on disk and the watcher (or the
      startup catch-up) indexes them. Nothing to build.
- [x] **A second thing the plan had not foreseen: this contradicts ADR 0011** _(2026-07-28 · `44cdd24`)_.
      *"Drive `git commit` from the watcher"* is listed there under **Rejected alternatives**. It owed an
      explicit amendment, not a silent contradiction → **ADR 0037**, which re-examines the four costs one
      by one. The decisive one (coupling git to the RAG's failure domain) applies to a design that
      **moves** persistence into the MCP; here the hooks stay, so the new rung can only **add** commits.
      And the intent-bearing commit message ADR 0011 feared losing was never implemented —
      `auto-commit.mjs` writes a fixed line. ADR 0011's status and its rejected-alternatives entry now
      carry the amendment.
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

- [x] **Reroute what would otherwise be lost — BEFORE removing anything.** _(2026-07-28 · `84e4038`)_
  - [x] **The restart nudge is the only genuine loss** _(2026-07-28 · `84e4038`)_. Confirmed on disk:
        surfaced *only* by `status-line.mjs`; `session-status.mjs` never imported it. It now **leads**
        that hook's `systemMessage`, from the same two inputs. The two on-disk reads left status-line for
        `scripts/lib/restart-signal.mjs` — shared, and unit-tested including the **fail-soft** case: a
        phantom nudge costs a pointless restart and teaches the owner to ignore the real one.
  - [x] **Already covered — verified, nothing to build.** The Gemini-key warning
        (`session-status.mjs:124-137`) and the RAG staleness counter (`:76-122`) are already duplicated
        there in prose.
  - [x] Keep the 🛑 MANDATORY chat rule and **mark it as the only harness** _(2026-07-28 · `65202ba`)_ —
        an explicit ⚠️ warns a future cleanup not to read it as duplication. The stale F-B7c paragraph
        below it, which still credited the status line, now names the SessionStart message instead.
- [x] **New installs: stop setting it** _(2026-07-28 · `65202ba`)_. The `statusLine` block is gone from
      `.claude/settings.json.template`; a brain with no `statusLine` never acquires one, still pinned by
      the two existing reconcile tests.
- [x] **Deployed fleet: remove the key we installed, and only that one.** _(2026-07-28 · `65202ba`)_
  - [x] Extended at that exact seam — the only write to `statusLine` inside a sacred `settings.json`.
        The pure decision lives in `scripts/lib/status-line-retreat.mjs`.
  - [x] **Provenance guard, non-negotiable** — matched on the script name, so a moved brain and a
        Windows `cmd /c …run-node.cmd` wrapper both still read as ours, while anything unrecognised is
        **kept**: a cosmetic leftover of ours is cheap, deleting their configuration is not.
  - [x] ⚠️ **The reconciler's write is no longer purely additive**, and its section comment now says so:
        additive **plus exactly one nominative removal**. The update reports it as what the owner gains —
        *"your own status line is back: the brain no longer occupies it"*.
  - [x] Tests: engine-installed → **removed**; hand-customized → **preserved**; none → **byte-identical**.
        Plus the two pre-existing win32 tests, **rewritten**: they pinned the prefix repair of our own
        status line, which the retreat makes moot — a broken line of ours is not worth healing, it is
        worth giving back.
- [x] **Fate of `scripts/status-line.mjs`: KEPT as a documented opt-in** _(2026-07-28 · ADR 0036 §5)_.
      It works, it ships like any engine script, and an owner who wants it back only points their own
      `statusLine.command` at it. Its header says so, in the first lines anyone opening it reads.
- [x] **ADR 0036 — the channel matrix** _(2026-07-28 · `44cdd24`)_ —
      `decisions/0036-deterministic-channels-differ-by-surface.md`, `Scope: Second brain (runtime)`.
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

  - [x] The three consequences are stated: the **chat is the only universal channel**;
        `additionalContext` is **not backstage on the CLI**; and **nothing here is inferable from the
        documentation**. Plus one the plan had not asked for: the deterministic-mechanisms rule
        (ADR 0009) is **bounded by the surface** — where the host renders nothing, an instruction to
        the agent is not the weaker option, it is the only one.
  - [x] The surviving comments **point at the ADR** _(2026-07-28 · `65202ba`)_: the three that asserted
        the opposite (`status-line.mjs` header and its nudge block, `session-status.mjs`'s NB,
        `restart-nudge.mjs`'s header) now name the matrix and say plainly which channel reaches what.
  - [x] Listed in `maintainers/README.md`'s `decisions/` section, one bullet ending in `**Scope: …**` —
        alongside a second one for ADR 0037. **Drift found on the way, recorded not hidden:** that list
        had stopped at ADR 0022, so **0023-0035 are unlisted**; the README now says the directory is the
        authoritative index until someone backfills it.

---

## Track 3 — A note the engine cannot read is reported, not swallowed *(F10)*

**The worst failure mode this product has, in its quietest form**: not a wrong answer, a **confident
answer over an incomplete index**. Three of our own channels disagreed about the same run, and the one
the owner sees is the optimistic one — `watcher.log` said `1 errors`, `last-run.json` said `"errors":[]`,
and the brain told the owner *"0 erreur, index à jour"*. The brain was **faithful to what it was given**.

- [x] **Root cause, exact and readable in three lines** _(2026-07-28)_ — confirmed on disk, unchanged. `reporter.start()` **resets** `errors: []`
      (`rag/src/lib/reindex-reporter.ts:54`) and runs **after phase 1**
      (`rag/src/lib/index-manager.ts:260`, inside `runIndexingPhase`). `reporter.finish()` then merges
      **only** `runResult.errors`, the phase-**2** errors (`:271`). Phase-1 read errors are pushed to
      `result.errors` (`:201`) and **never handed to the reporter** — so `last-run.json`, `last-run.md`
      and `vault_stats`, i.e. everything the owner and the agent can see, under-report.
- [x] **Fixed by seeding** `reporter.start({errors})` _(2026-07-28 · `631b0ae`)_ rather than looping on
      `recordError()`: one write instead of N, and `finish()` already appends phase 2's on top of
      whatever `start()` seeded, so the merge order needed no change.
- [x] **The invariant SHIPPED, not just as a test** _(2026-07-28 · `631b0ae`)_: `unaccountedNotes()`
      runs on every completed run and the warning rides on the line everyone reads (`last-run.md`,
      hence the agent). Both QA numbers are pinned as tests (`414 ≠ 0 + 413` → 1 lost;
      `415 = 2 + 413` → 0). **One exemption, deliberate**: a run cut off by a quota wall — its notes
      are not lost, they resume, and a detector that cries wolf on every capped run is one nobody reads.
- [x] **Not reproduced on `mind-palace`** (no access to that brain from here) — and it turned out not to
      be needed: a completed run now **names** its errors instead of only counting them, which is the
      thing the QA lacked. Knowing "1 errors" without knowing *which note* is what cost it an afternoon.

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
      Obsidian pane and confirm **no** commit fires. **Still owed** — it needs an installed brain with a
      live watcher, which the launcher deliberately is not (`persistenceApplies` refuses it).
  - [x] **The process-level half is proven** _(2026-07-28, disposable repo, not a real brain)_: a
        brain-shaped git repo holding the real `scripts/`, with a note that was **never in git** →
        `persistCampaign` through the REAL runner (real `node`, real `git`, real `auto-commit.mjs` +
        `auto-push.mjs`) → `persisted`, the note committed as `auto: vault/claude sync`, working tree
        clean. Push correctly **skipped**: no remote, `autopush` unset. Pointed at a non-existent brain
        it returns `failed` and **exits 0** — the failure path does not throw. What this does NOT cover,
        and why the box above stays open: the chokidar → debounce → campaign chain on a live vault.
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
