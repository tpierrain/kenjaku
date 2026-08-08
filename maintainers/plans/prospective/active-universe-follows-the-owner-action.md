<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- STATUS: 🟢 OPEN — opened 2026-08-07. S1–S4 done (bar one open smell); S5 = cutting v4.9.0, in flight. -->
<!-- Release shape ARBITRATED 2026-08-08: universes only → cut → then the unfreeze release. -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Action plan — the active universe follows the owner, not the machine

> **RESUME HERE (state at 2026-08-08, S3 under way).** Branch `feat/active-universe-travels`, pushed,
> clean. The owner has arbitrated the release: **universes only**, then cut, then the unfreeze release
> (`update-regime-owns-what-it-shipped-action.md`).
>
> **In S3, the 🔴 ordering defect is DONE** (2026-08-08 · `97149a5`): hooks run in **parallel**, so it
> was a race and "reorder the hooks" would have been a non-fix. Shipped as a session-keyed barrier
> (`scripts/lib/startup-sync-gate.mjs`): the puller brackets its sweep+pull with a `running`/`done`
> marker, and the universe hook blocks on that flip before reading any universe state. Full harness
> suite green (1642).
>
> **The FLEET MIGRATION is also done** (2026-08-08 · `20ac23e`): it lives in `reconcileBrain`, so it
> reaches a deployed brain by update AND by self-heal. Full harness suite green (1654).
>
> **`/sync` is done too** (2026-08-08 · `435c164`): the conflict rule (the machine you sit at wins,
> `--theirs`, proven against real git) and the mid-session announcement line. Full harness suite green
> (1657). **S3 is therefore complete except one item deliberately left open, which is NOT a blocker**:
> the general smell (do wiki-health and self-heal read pre-pull state too).
>
> **S4's prose is done too** (2026-08-08 · `8341e18`), and **the version question is ARBITRATED**: the
> owner chose (2026-08-08) to **re-arbitrate the mutation-debt floor in writing** and cut **`v4.9.0`**
> with the universes work alone. That re-arbitration is **already written** — in
> `prospective/v4.9.0-mutation-debt-plan.md` (the floor moves to the unfreeze release) and carried in
> `prospective/update-regime-owns-what-it-shipped-action.md` **S0bis** (so it arrives with its release).
> Do not re-open that question.
>
> **So the ONLY thing left in this plan is to CUT THE RELEASE — which is S5 below, and it is more than
> a note plus a tag.** Re-read at the resume of 2026-08-08: the header used to say *"write the release
> note, then tag"*, and that under-described what the repo's own conventions attach to a cut. A cut is
> **four things, in this order**: the release-tail mutation pass over what the branch changed (§5ter /
> §5quinquies, whose snapshot the note must carry), the marketing-surface re-read (§10, explicitly
> *before* writing the note), the note itself (§11), then the PR → merge → tag → GitHub release.
> ⚠️ **The mutation floor that moved is NOT this pass**: what moved to the unfreeze release is v4.8.0's
> two named debts; this branch still owes the measurement of the files **it** wrote.
>
> **The three suites are confirmed green at the resume** (2026-08-08, on `7447ab5`): harness **1657**
> (1654 pass, 3 skipped), engine **515**, local-mirror **255**.
>
> Also still open, deliberately, and NOT blockers: the general smell (do wiki-health and self-heal read
> pre-pull state too), and the two stale mutation worktrees to remove.
>
> **Standing constraints**: TDD baby-steps with a failing test first, green-only commits pushed as they
> go (CONVENTIONS §5), artifacts in English (§4), CRLF care on any line-wise file edit (§9).
>
> **Done so far.** S1: the decision is recorded in ADR 0034. S3: the ordering defect is fixed (above).
> S2: the pointer is un-ignored in THIS repo, a test asks git itself that the line never comes back, and the nine prose sites now say the
> pointer is the owner's, not the machine's. **A deployed brain is still unchanged** — its own
> `.gitignore` is carried by no engine regime, which is exactly what S3 exists to fix.
>
> **Why this plan exists.** The owner (2026-08-07) found the current behaviour confusing: switching
> universe on one machine leaves the other machine in the previous scope, **silently**. The native
> MCP connectors (Slack, Notion, Gmail, Drive) are authenticated **at the account level**, so they
> already follow the owner everywhere. Half of "which context am I in" therefore travels and half
> does not — and the half that does not fails quietly, by returning the wrong retrieval scope with
> no error.

## What is true today (do not re-discover)

- **The pointer is gitignored** — `.gitignore:60-63` ignores `.vault-rag/active-universe` while its
  sibling registry `.vault-rag/universes.json` is committed on purpose.
- **The rationale was never argued, it was assumed.** The code frames the pointer as *"per-machine
  session state: which context am I in on THIS machine"* (`rag/src/lib/active-universe.ts:8-13`), by
  analogy with the genuinely machine-bound files (`.mcp.json`, `.claude/settings.json`, `.cache/`,
  `.env`). ADR 0034 never states the choice; its only nearby line goes the **other** way — *"a single
  global active-universe state file means two Desktop windows share one active universe... per-session
  state is YAGNI"* (ADR 0034, Consequences) — i.e. the universe is already accepted as **global to the
  brain**, not per window.
- **A whole bug class exists only because the two halves diverge.** The pointer is ignored while the
  registry is committed, so a rename/delete performed on machine A reaches machine B with a pointer
  naming a universe that no longer exists → the engine would filter on a ghost and return zero hits,
  silently. That is precisely why `scripts/session-universe.mjs` self-heals the pointer at session
  start (its header comment says so). Ship this plan and that divergence can no longer be produced:
  `rename-universe.mjs` rewrites pointer **and** registry, and both travel together.
- **The announcement channel already exists, and it now waits for the pull.** Past the
  progressive-disclosure gate, `session-universe.mjs` names the active universe at every session
  start. On its own that only covered the session **after** the pull — the arriving machine's first
  session announced the universe it went to sleep in (hooks run in parallel; see S3's ordering
  defect). Since `startup-sync-gate.mjs`, that hook waits for the startup pull before reading, so a
  pointer arriving by `git pull` is **not** a silent scope change even in the session that pulls it.
- **Auto-commit stages everything** (`scripts/auto-commit.mjs:56`, `git add .`), so an un-ignored
  pointer is committed by the ordinary vault persistence — no new writer to build.
- **`.gitignore` is carried by NO engine regime** (`engine-manifest.json`: `replace` / `regenerate` /
  `merge` — none matches it). A deployed brain therefore keeps its own `.gitignore`, and this change
  would **never** reach the fleet without an explicit migration. This is the non-obvious part of the
  work; see S3.

## The decision to record

**A universe is the owner's context, not the machine's.** The connectors half of that context is
account-global; the retrieval half must match it, or the brain contradicts itself across machines.
So the pointer becomes **committed state**, converging on the owner's last switch at the next pull,
and the per-machine escape hatch is deliberately **not** built (see *Deliberately deferred*).

## Tracking

- [x] **S1 — Record the decision: the active universe is owner state, and it travels.** _(2026-08-07 · `edda5af`, branch `feat/active-universe-travels`)_
  - [x] Amend **ADR 0034 in place** (CONVENTIONS §6bis — no new ADR, no "AMENDED" scar in the prose,
        §6ter: write it as one timeless decision, for a fresh reader).
  - [x] Decision §1: say that the pointer is **committed alongside the registry**, and why — the
        connector half of a context is account-global, so a machine-local retrieval scope makes the
        brain contradict itself; a single owner is in one context at a time.
  - [x] Consequences: convergence is **eventual** (at the next pull), not real-time like connectors;
        the rename/delete divergence disappears by construction (the self-heal survives as
        belt-and-braces); a switch now produces one commit, which doubles as a history of *when the
        owner changed context*.
  - [x] Alternatives considered: **per-machine override** (a gitignored `active-universe.local` that
        wins, mirroring `settings.json` / `settings.local.json`) — rejected as YAGNI until a
        dedicated-machine case is actually lived; **real-time propagation** — out of scope, git is
        the transport.
  - [x] Extra consequence written while doing it, because the ADR is where it belongs: the shipped
        `.gitignore` is carried by no engine regime, so the migration (S3) is the only route to a
        deployed brain — including the "commit an untracked pointer" part that keeps the first pull
        from hitting git's untracked-overwrite refusal.

- [x] **S2 — The active universe travels with the brain (and cannot be re-ignored by accident).** _(2026-08-07 · `5cc247c` + `c44f5e1`)_
  - [x] Remove the `.vault-rag/active-universe` entry from `.gitignore`; keep a short comment saying
        the pointer is committed **on purpose** (owner state), so nobody restores the line "to be
        consistent with the caches". _(the comment now says nothing under `.vault-rag/` is ignored,
        and names the test that enforces it)_
  - [x] **Deterministic guard**: a test asserting the pointer is **not** ignored by the shipped
        `.gitignore` — the twin of the existing "the cache file sits under `.cache/`, which every
        brain gitignores" test (`scripts/lib/upstream-cache.test.mjs:187`). Fail-loud if the line
        ever comes back. _(`scripts/lib/universes.test.mjs`, last test: asks **git itself** in a
        throwaway repo carrying only the shipped file — no dev machine's global excludes can answer
        in its place — plus a control on `rag/.cache/` so a broken invocation cannot pass vacuously)_
  - [x] Correct every comment/test that asserts the old semantics in prose: `rag/src/lib/active-universe.ts`,
        `rag/src/lib/active-universe.test.ts`, `scripts/lib/universes.mjs` (~L60),
        `scripts/lib/universes.test.mjs` (~L423), `scripts/session-universe.mjs` (header),
        `local-mirror/src/adapters/fs-universes.ts`, `local-mirror/src/lib/config.ts`,
        `local-mirror/src/test/fs-universes.test.ts`, `local-mirror/src/test/universes.test.ts`.
  - [x] Verify **progressive disclosure is untouched**: below the gate no pointer file is written at
        all (only `/switch`, create, rename and delete write it), so a single-universe brain commits
        nothing new and behaves exactly as today. _(the only other writer is the self-heal, and a
        test already pins that it creates no pointer on a brain that never had one)_
  - [x] Full suites green: harness 1624, engine 515, local-mirror 255.

- [ ] **S3 — A brain that pulls a switch made elsewhere lands on it cleanly (fleet + conflicts).**
  - [x] **🔴 ORDERING DEFECT — found by the owner's question (2026-08-08), and this branch is what makes
        it reachable. Must be fixed inside S3, not filed elsewhere.** _(fixed 2026-08-08 · `97149a5`)_
        Measured: the SessionStart hooks
        run **universe 5th (`session-universe.mjs`) and status 7th (`session-status.mjs`)**, and the
        **pull lives in status** (`sweepThenPull`). Meanwhile the server reads the pointer **per query**,
        not at boot (`rag/src/index.ts:136`). So on the second machine's first session after a switch
        made elsewhere:
        1. the universe hook reads the **stale** pointer, announces the **old** universe **and injects
           the old universe's profile synthesis** (its people, topics, connector accounts);
        2. the pull then lands the **new** pointer;
        3. every `search_vault` for the rest of that session silently scopes to the **new** universe.
        The session therefore runs with **the context of one sphere and the retrieval of another**, and
        the single line meant to make the change non-silent **announces the wrong one**.
    - [x] **It invalidates a claim written above in this plan** (*"a pointer arriving by `git pull` is
          not a silent scope change: the next session says which universe it is in"*): true only for the
          session **after** the pull. The session **in which** the pull happens is precisely the arriving
          machine's first one, i.e. the entire use case. _(paragraph corrected in *What is true today*;
          the claim now holds because the hook waits for the pull)_
    - [x] **Not a production bug today** — the pointer is gitignored, so it never travels and the
          ordering is harmless. **S2 makes it reachable**, which is why it is this branch's to fix.
    - [x] **🧭 CORRECTION, verified 2026-08-08 before writing a line of code: SessionStart hooks do NOT
          run in declared order — they run in PARALLEL.** The Claude Code hooks reference says it
          plainly: *"All matching hooks run in parallel."* So the "5th vs 7th" measured above is the
          **declaration** order in `.claude/settings.json.template`, not an execution order, and
          **reordering that array fixes nothing.** The defect is in fact *worse* than first described: it
          is a **race**, not a sequence. The universe hook is a handful of file reads and the pull is a
          network round-trip, so the stale read wins nearly every time — but nothing guarantees it (the
          announcement is non-deterministic), and two hooks touching the same repo can additionally
          collide on git's `index.lock`.
    - [x] Fix — the reading hook **waits for the pull**. Shipped as a **session-keyed barrier**
          (`scripts/lib/startup-sync-gate.mjs`), simpler than the single-flight lock first sketched: the
          pull keeps ONE owner (`session-status.mjs`, which is also the hook that reports it), and it
          brackets `sweepThenPull` with a `running` / `done` marker under `.cache/`, keyed on the session
          id the harness hands every hook on stdin. `session-universe.mjs` blocks on that flip before
          reading a byte of universe state. No lock, no second puller, no contention on git's
          `index.lock` — the two roles never both pull. Fail-open on every branch (no puller wired, no
          session id, a puller that dies before speaking → 3 s grace, a pull that never lands → 12 s
          ceiling): read what is on disk, exactly as before. Proven end-to-end by a **real child
          process** whose pointer changes under it mid-run (`scripts/session-universe.test.mjs`,
          verified red without the barrier).
    - [x] **Plus a correction line if the pull changed the pointer** — MOOT at session start, and
          deliberately not built: the barrier means the announcement is already the post-pull truth, so
          a "correction" would correct a line nobody was ever shown. The **mid-session** `/sync` case is
          untouched and still owed (its own bullet below).
    - [ ] **The general smell, still open**: the pull races **every** other hook, so **any** hook can
          read pre-pull state. The universe pointer is the case that bit; the barrier is now a reusable
          `waitForStartupSync` any hook can call. Still to check before assuming they are fine:
          **wiki-health** (reads the vault the pull can change) and **self-heal** — the latter with a
          second question, since it and `session-status`'s bootstrap tick BOTH detect a wiring gap and
          BOTH spawn `reconcile-brain`, which parallel execution means can now happen at once.
          Found while correcting a test that claimed `settings.json` could order hook execution.
  - [x] **One-shot, idempotent migration for deployed brains** _(2026-08-08 · `20ac23e`)_ — it lives in
        `reconcileBrain` (`scripts/lib/unignore-pointer.mjs`), not in `update-engine` alone: the
        reconciler is the one path that reaches a deployed brain on BOTH routes (an update AND a
        SessionStart self-heal). It removes the entry, plus the engine's own comment when that comment
        is still verbatim ours — a comment arguing "never commit it" beside a committed pointer is
        worse than none — and leaves the owner's entries, notes and line endings byte for byte. The
        update report announces it as what they gain (their context follows them between computers),
        never as a gitignore edit.
  - [x] **The migration must also stage the pointer if it exists untracked** — VERIFIED as already
        guaranteed, so no `git add` was written. Un-ignored, the pointer makes the tree dirty
        (`treeState` counts untracked as dirty), and both persistence paths commit before anything can
        pull: the update's own `commitEngineUpdate` (`add -A`), and the session-start sweep, which
        sweeps BEFORE `git pull --rebase` in the same process (`sweepThenPull`). So git's *"untracked
        working tree file would be overwritten"* dead end is unreachable on the engine's own pulls.
        _(Recorded rather than built: a redundant `git add` would have been mechanism bought against a
        hazard the existing invariant already closes.)_
  - [x] Tests for the migration: line present → removed; line absent → no-op; the owner's own ignore
        entries preserved byte-for-byte; running it twice changes nothing. _(plus: a look-alike entry
        the owner invented is never touched, a duplicated entry goes too, CRLF stays CRLF, and at the
        reconciler level a brain with no `.gitignore` never gets one invented.)_
  - [x] **Conflict rule, written once and applied everywhere** _(2026-08-08 · `435c164`)_: the machine
        you are sitting at wins, taught to `/sync` with its command. ⚠️ That command is
        `git checkout --theirs`, which reads backwards: a rebase replays YOUR commits onto origin's, so
        `--ours` is the OTHER machine. **Verified against real git** in a repo that actually conflicts
        (`scripts/lib/sync-skill-discipline.test.mjs`), so nobody "fixes" the direction and silently
        hands the session to the other laptop.
  - [x] `/sync` **says it out loud** _(2026-08-08 · `435c164`)_: it reads the active universe on BOTH
        sides of the rebase and names it in one line when it changed — silent when it did not, so a
        single-context brain still never hears of the feature.

- [ ] **S4 — The docs say the universe follows you.** _(prose done 2026-08-08 · `8341e18`; only the
      release note is left, and it belongs to the cut)_
  - [x] `.claude/skills/switch/SKILL.md` — the *"On another machine"* note now says the universe
        follows you and is named at session start; the self-heal stays as the net it now is.
  - [x] `SETUP.md` §5.2 (the rename note) and §7 (backup & multi-machine) — §7 carries the plain-words
        version: your connectors already follow you, and now your notes agree.
  - [x] `CLAUDE.engine.md` — the pointer is described as committed, following the owner (ADR 0034).
  - [ ] Release note (CONVENTIONS §11 — written for the non-developer first): *"switch context on one
        laptop, your other one picks it up"*, never a paragraph about a gitignore line. **Its home is
        S5**, with the rest of the cut.

- [ ] **S5 — Cut `v4.9.0`.** _(opened 2026-08-08 at the resume, because the header said "note + tag" and
      the repo's conventions attach more than that to a cut — written here so the next `/clear` inherits
      the real checklist rather than the short version.)_
  - [x] **Confirming green run of the three suites** _(2026-08-08, on `7447ab5`)_: harness **1657**
        (1654 pass, 3 skipped), engine **515**, local-mirror **255**.
  - [x] **Release-tail mutation pass (§5ter + §5quinquies), `scripts` only — DONE 2026-08-08.** The branch's diff decides
        the scope, and it reads: **new** — `lib/startup-sync-gate.mjs`, `lib/unignore-pointer.mjs`;
        **changed** — `lib/reconcile-brain.mjs`, `session-universe.mjs`, `session-status.mjs`,
        `update-engine.mjs`. **Deliberately out of scope, verified file by file rather than assumed**:
        `scripts/lib/universes.mjs`, `rag/src/lib/active-universe.ts`,
        `local-mirror/src/{adapters/fs-universes.ts,lib/config.ts}` are **comment-only** in this diff —
        no production behaviour changed, so no number moves and re-measuring would buy nothing.
        `session-status.mjs` is expected at **0 %** (the named top-level-script debt, inherited, whose
        remedy is Debt 1 of the unfreeze release) — record it as inherited, never as new.
    - [x] **Worktree ready** _(2026-08-08)_: `../kenjaku-mut-v490`, detached at the branch head, with
          `rag/node_modules` symlinked in. `vault-write-guard.test.mjs` reports **0 skipped** there, so
          the mutants face a suite that can actually judge them. The two stale worktrees the plan owed
          (`kenjaku-mut-v450`, `kenjaku-mut-v460`) were removed first — inspected before forcing, and
          they held nothing but leftovers (a modified `package-lock.json`, a `node_modules` symlink).
    - [ ] **Batches.** Batch 1 = the two NEW libs (`lib/startup-sync-gate.mjs`,
          `lib/unignore-pointer.mjs`). Then batch 2 = `lib/reconcile-brain.mjs`, batch 3 = the three
          top-level scripts. Reset the worktree between batches with `git reset --hard` +
          `git clean -qfd -e rag/node_modules`, **never** `git checkout -- .` (Stryker instrumentation
          can otherwise be restored faithfully and poison every later run).
    - [x] **Batch 1, first pass** _(2026-08-08)_: `startup-sync-gate.mjs` **87.74 %**,
          `unignore-pointer.mjs` **84.62 %** — 21 survivors, and they were **not noise**.
          ⚠️ **Operational lesson, worth more than the numbers**: the run was piped through `tail -60`,
          which threw away 12 of the 21 survivors and cost a full 4m39s re-run. **Redirect a Stryker run
          to a file** (`> …/mut-batchN.log 2>&1`), never pipe it to `tail`.
    - [x] **`unignore-pointer.mjs` hardened** _(2026-08-08 · `96a4050`)_ — four real gaps, each now a
          test that fails on its mutant: nothing asserted the replacement comment the migration **writes
          into someone else's file** (blanking it passed), nothing put the engine's block at index 0
          (the `>= 0` boundary), nothing gave the owner three comment lines of their own above the
          pointer (so *"is this prose still ours?"* was never actually read), and the CRLF case never
          exercised the line we put back. The `\r` strip in `bare()` went too: `.trim()` already handles
          it, so it was dead code — and dead code is a mutant nothing can kill. Harness **1661**.
    - [x] **`startup-sync-gate.mjs` hardened** _(2026-08-08 · `e116f43`)_ — **8 of its 11 survivors were
          real**, and they all said the same thing: the barrier's own contract was never read.
          `SYNC_MARKER_REL` was only ever **recomputed from the constant** by the tests, so the marker
          could have moved out of `.cache/` — the one dir every brain gitignores — with the suite still
          green; it is now asserted as a literal. The fake fs **swallowed `mkdirSync`**, leaving
          *"recursively"* unobserved. The settings reader was only ever shown **tidy** settings (one
          hook per entry, no null slots, the puller always first), which is exactly why `some`-vs-`every`
          and **both** optional chains survived — now one dented-settings test covers the three. And the
          **TTY guard**, the thing that keeps a hand-run hook off the keyboard, was only exercised
          through the stub the tests inject; the default wiring is now driven for real.
    - [x] **3 named equivalents on that file, not chased** (§5ter's own list): the `"utf8"` encoding in
          `readFileSync(0, …)`, which is the default wiring of an injected port and only runs in a real
          I/O run; and the two `?? []` array defaults in `pullerIsWired`, whose replacement array is
          immediately `.some`-ed back to the same `false`.
    - [x] **Re-measured, all six files** _(2026-08-08)_ — a hardened-but-unmeasured file has an unknown
          score, so nothing here is inferred:
          `unignore-pointer.mjs` **84.62 → 98.00 %**, `startup-sync-gate.mjs` **87.74 → 94.34 %**,
          `lib/reconcile-brain.mjs` **96.11 %**, `update-engine.mjs` **97.27 %**,
          `session-universe.mjs` **66.18 %**, `session-status.mjs` **8.67 %**.
    - [x] **The two low numbers are the NAMED debt, and both went UP — say it that way or it reads as a
          regression.** `session-universe.mjs` was **39.39 %** at v4.5.0 and is **66.18 %** here; every
          one of its 23 survivors sits in the entrypoint tier (the `import.meta.url` guard at L140 and
          the composition root under it) or is an injected-port default. `session-status.mjs` was
          **0.00 %** from v4.4.0 through v4.8.0 and is **8.67 %** here. Both are **Debt 1** of the
          unfreeze release (a shared `runAsEntrypoint` + the guard test), whose floor was re-arbitrated
          in writing; this release grazing them is what makes them measurable, not what makes them low.
    - [x] **Three more real survivors closed after the re-measure** _(2026-08-08 · `5f1ee56`)_, each still
          this branch's own code: an owner who **partly** rewrote our comment (`every` vs `some` decides
          whether the migration then deletes the sentences they wrote); the puller-detection test whose
          null entry made *"all my hooks match"* **vacuously true**, shielding the very mutant it was
          meant to catch (split in two — one where every entry has two hooks and none is empty); and the
          update report's **second** line, the one saying WHERE your context follows you to, which could
          be blanked with the matcher on the first line still green. Harness **1667**.
    - [x] **Final re-measure** _(2026-08-08)_ of the three files whose tests changed:
          `unignore-pointer.mjs` **100.00 %** (0 survivors), `startup-sync-gate.mjs` **95.28 %** (5 left,
          all listed equivalents), `update-engine.mjs` **98.44 %** (4 left, pre-existing real-I/O tier).
    - [x] **`RESULTS.md` § v4.9.0 written** _(2026-08-08)_ — the table, the debt split said out loud, the
          six lessons recorded as **constraints** rather than as a story about one file (§5quinquies's
          own corollary), and the listed equivalents so the next release does not re-chase them. The
          *Current scores* `scripts` row now points at it.
    - [x] **Snapshot carried into the note** (§5ter: every release note pins its own numbers).
    - [ ] Record the run in `maintainers/mutation/RESULTS.md` as a `v4.9.0` section + the *Current
          scores* line, survivors either killed or **named** as equivalents (§5ter: the constraint, not
          the anecdote).
  - [x] **Marketing-surface re-read (§10) — done 2026-08-08, before a line of the note was written.**
        Whole surface re-read: `README.md`, `EN-QUOI-C-EST-DIFFERENT.md`, `SETUP.md`, `CONNECTORS.md`,
        and the boards through their README alt texts + `docs/marketing-image-prompts.md`.
    - [x] **Q1 — what did this release make false or imprecise? Nothing.** The absolutes were hunted
          where they live (anything promising a machine-bound scope) and **no marketing surface ever
          claimed the universe was per-machine** — that framing only ever existed in code comments,
          which S2 already corrected. `CONNECTORS.md`'s *"a connector is wired once, for the whole
          brain … switching universe re-scopes your notes, not your live connectors"* is not merely
          still true, it is **more** coherent now: it was describing exactly the divergence this
          release removes. `SETUP.md` §5.2 and §7 were already rewritten in S4. The multi-machine
          paragraph in `EN-QUOI-C-EST-DIFFERENT.md` (*"the files that carry the machine's own paths
          are deliberately not versioned"*) stays true — the pointer was never one of those files, it
          was ignored for a reason that was assumed rather than argued.
    - [x] **Q2 — what did it make true that we do not sell yet? One thing, and it was the headline.**
          The README's universes bullet was silent on machines, so a newcomer reading the page could
          not learn that their context travels. Fixed in place: the bullet now carries *"Since v4.9.0
          the universe you are working in follows you"*, in the `Since vX` idiom the surrounding
          bullets already use, and it names **why** it matters (the connectors were always account-wide;
          the notes now agree with them instead of contradicting them).
    - [x] **Boards: re-read, copy still accurate, NO re-render** — the boring verdict, written down on
          purpose (§10). None of `board-hero`, `board-affordance` or `board-privacy` asserts anything
          about universes or about a scope belonging to one computer, so none of them stopped being
          true. Recorded so the next release does not re-derive it.
  - [x] **Note DRAFTED (§11)** _(2026-08-08)_ — `prospective/release-v4.9.0-note.md`, which is where the
        series is drafted; it moves to `archived/` at publish time, rewritten to mirror the **published
        body verbatim** (that is how v4.8.1's file traced). Four bullets, deliberately: the context that
        travels, the arriving machine that names the right one, `/sync` speaking mid-session, and
        existing brains getting it by update. The lead says up front that a single-universe brain sees
        nothing, so nobody reads a feature they do not have.
    - [ ] **Mutation snapshot still to be filled into it** from the tail pass (§5ter) — the note carries
          a placeholder line rather than a number invented ahead of the measurement.
    - [x] **Title — ✅ ARBITRATED by the owner, 2026-08-08**: **`v4.9.0 — The One Where the Universe
          Travels With You`**, chosen from four candidates (*Your Context Follows You* · *Your Other
          Laptop Catches Up* · *It Knows Which Chapter You're In* · the one picked). Do not re-open it;
          it keeps the product's own word, and the lead carries the plain-words version underneath.
  - [x] **PR opened** _(2026-08-08)_: <https://github.com/tpierrain/kenjaku/pull/60>, body from
        `prospective/release-v4.9.0-pr-body.md`. It was the only open PR of mine (DEVELOPING §7).
  - [x] **The CI matrix caught one, and this is why it runs before the tag** _(2026-08-08 · `fe33d3a`)_.
        macOS green, **Windows red on all three Node versions**: `core.autocrlf` defaults to true there,
        so git rewrote the checked-out pointer and the rebase-direction proof read `acme\r\n` — a red
        saying nothing about `--theirs`, on the one test whose whole job is to stop a future reader
        "fixing" that flag to `--ours`. The throwaway repo now **pins `core.autocrlf=false`** rather than
        inheriting the machine's; pinned rather than absorbed by a looser assertion, because the exact
        bytes **are** the claim. Reproduced red locally with a machine-level `autocrlf=true`, green with
        the pin. **This branch had never seen CI before** (no PR, and §9 says local green ≠ green).
    - [x] **Checked, not assumed: the pointer itself is fine in the field.** Both readers `.trim()`
          (`rag/src/lib/active-universe.ts`, `scripts/lib/universes.mjs`) and a test already pins it, so
          a CRLF pointer arriving on a Windows machine resolves normally. **No `.gitattributes` rule was
          added for it** — that would be mechanism bought against a hazard the readers already close,
          which is the reflex this very plan diagnosed twice.
    - [x] Swept the other tests that build throwaway git repos (`engine-commit`, `startup-sync`,
          `universes`, `auto-commit`): none compares file bytes the way this one does.
  - [x] **CI GREEN on the fix** _(2026-08-08)_: the whole matrix passes — Node 22 / 24 / 26 on both
        macos-latest and windows-latest, plus the Windows tripwire and the Windows installer e2e.
  - [ ] **⏸️ STOPS HERE FOR THE OWNER.** Merging, tagging `v4.9.0` and publishing the GitHub release are
        outward-facing and effectively irreversible: **do not do them unasked**. The next session's job
        is to report CI and ask, not to ship. Everything else in this plan is done.
    - [ ] After the merge: tag `v4.9.0` on `main`, then `gh release create` with the note body.
  - [ ] **After the tag**: archive this plan (`maintainers/README.md`: plan done = archived), tick the
        ROADMAP, and rewrite the memory pointer to name whatever becomes live next (the unfreeze plan).

## Release shape — ✅ ARBITRATED by the owner, 2026-08-08

> *"Ok pour faire une petite version centrée sur les univers (avec le suivi du contexte cross machine +
> le correctif que tu viens de me décrire), puis on cut la release, et on partira ensuite sur la release
> plus imposante sur le dégel."*

- [x] **Scope: universes ONLY.** S3 (fleet migration + conflicts + the ordering defect) → S4 (docs) →
      cut the release. Nothing else rides along.
- [x] **The source-first rider MOVES OUT**, and the sequencing is what dissolves its open question. Its
      carrier arbitration (a `UserPromptSubmit` hook versus unfreezing the doctrine layer) only existed
      because the unfreeze was far away. It is now **the very next release**, so the rule goes where
      doctrine belongs — one paragraph in both constitutions plus its guard test — and **the unfreeze
      release delivers it**. **Do not build the hook**: it would be mechanism bought to bridge a gap
      that is about to close, in a repo that has just diagnosed exactly that reflex.
      → carried by `field-finding-2026-08-08-source-first-and-frozen-doctrine.md`, shipped with
      `update-regime-owns-what-it-shipped-action.md`.
- [x] **The version number, and with it a debt — ✅ ARBITRATED 2026-08-08.** The release is **`v4.9.0`**
      (a behaviour change on the fleet is a minor), and the mutation-debt **floor was re-arbitrated in
      writing** rather than honoured here: it now falls due with the **unfreeze release**, recorded in
      `v4.9.0-mutation-debt-plan.md` (the 🔁 RE-ARBITRATION block, with its terms) and carried as
      **S0bis** in `update-regime-owns-what-it-shipped-action.md`. Third due date named as such: cutting
      the unfreeze release without paying it is a defect, not a re-arbitration.
- [x] **Riders considered and declined** (so they are not re-proposed blind): the **live health banner**
      (v4.8.1's hand-off) changes what **every** session start prints and deserves its own note; the
      **silent skill freeze** is a provenance change, and it now folds into the unfreeze release as a
      symptom rather than being fixed alone.
- [x] Housekeeping, done at the cut _(2026-08-08)_: the two stale mutation worktrees
      (`kenjaku-mut-v450`, `kenjaku-mut-v460`) are gone, replaced by the one this release's tail pass
      runs in (`kenjaku-mut-v490`).

## Deliberately deferred (recorded so it is not re-litigated)

- [ ] **Per-machine override** (`active-universe.local`, gitignored, wins over the committed pointer)
      — the dedicated-machine case (work laptop = one universe, personal Mac = another). Real, but
      unproven for this owner; the pattern is known and cheap to add the day it is lived. **Not built
      now.**
- [ ] **Real-time propagation.** Git is the transport, so convergence happens at the next pull. Making
      it instant would need a channel the brain does not have. Out of scope.
- [ ] **Per-window / per-session universes.** Already declared YAGNI by ADR 0034; unchanged here.

## The COMMENT (how)

- Order: **S1 → S2 → S3 → S4**. S1 is the record, S2 is a two-line change plus its guard, S3 is where
  the actual engineering is (the fleet migration and the conflict path), S4 closes the surfaces.
- TDD baby-steps, green-only commits (CONVENTIONS §5); artifacts in English (§4). The migration is a
  script with branches → it gets tests, not a "just glue" pass (§5bis).
- Cross-platform: the migration edits a text file line-wise — mind CRLF (§9, the CI matrix is the
  arbiter).
- Keep the pointer self-heal even though this change makes its trigger nearly unreachable: an old
  brain can still arrive with a stale pointer, and a fail-open repair costs nothing.

> Links: [ADR 0034](../../decisions/0034-progressive-disclosure-of-universes.md) (universes),
> `engine-manifest.json` (why `.gitignore` reaches no deployed brain by itself),
> `scripts/session-universe.mjs` (the announcement + self-heal channel), `scripts/auto-commit.mjs`
> (what stages the pointer once it is un-ignored).
