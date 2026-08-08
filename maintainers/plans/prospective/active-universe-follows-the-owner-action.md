<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- STATUS: 🟢 OPEN — opened 2026-08-07. S1 + S2 done; S3 in flight (ordering defect fixed, fleet migration next). -->
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
> **Next real step: the FLEET MIGRATION** — strip the ignore line from a deployed brain's own
> `.gitignore`, and stage an untracked pointer so the first pull cannot hit git's untracked-overwrite
> refusal. Then the conflict rule taught to `/sync`, then its mid-session announcement line, then S4
> (docs). One S3 item stays deliberately open and is NOT a blocker: the general smell (do wiki-health
> and self-heal read pre-pull state too).
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
  - [ ] **One-shot, idempotent migration for deployed brains**, run by the engine update: if the
        brain's `.gitignore` still carries the pointer line, remove **that line only** (never rewrite
        the file — owners add their own entries), and announce it in one line.
  - [ ] **The migration must also stage the pointer if it exists untracked.** Otherwise the first
        pull that brings another machine's pointer fails hard with git's *"untracked working tree
        file would be overwritten"* — a dead end for a non-developer. Committing it locally turns
        that into an ordinary one-line conflict.
  - [ ] Tests for the migration: line present → removed; line absent → no-op; the owner's own ignore
        entries preserved byte-for-byte; running it twice changes nothing.
  - [ ] **Conflict rule, written once and applied everywhere**: when the pointer conflicts on a
        `pull --rebase`, **the machine you are sitting at wins** (its current value is kept), and the
        next switch propagates. Teach it to `/sync` (`.claude/skills/sync/SKILL.md`) so the
        resolution is not improvised.
  - [ ] `/sync` **says it out loud**: if the pull changed the pointer, name the universe now active,
        in one line. Session start already covers the session-boundary case; this covers mid-session.

- [ ] **S4 — The docs say the universe follows you.**
  - [ ] `.claude/skills/switch/SKILL.md` — the *"On another machine"* note (~L261) currently explains
        the divergence + the self-heal. Rewrite it as: your universe follows you, it arrives with the
        next pull, and your brain names it at session start.
  - [ ] `SETUP.md` §5.2 (the rename note ~L336) and §7 (backup & multi-machine) — add the one-liner:
        the active universe is part of what travels.
  - [ ] `CLAUDE.engine.md` (~L193) — the engine-side sentence describing the pointer's provenance.
  - [ ] Release note (CONVENTIONS §11 — written for the non-developer first): *"switch context on one
        laptop, your other one picks it up"*, never a paragraph about a gitignore line.

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
- [ ] **Still to decide at cut time: the version number, and with it a debt.** A behaviour change on the
      fleet reads as a **minor** (`v4.9.0`). But `prospective/v4.9.0-mutation-debt-plan.md` declares
      itself the **floor of v4.9.0**, opened precisely because the same deferral was already taken twice
      and memory never brought it back. Either that floor is honoured here, or the deferral is
      **re-arbitrated in writing** in that plan and the number is chosen deliberately. Letting it slip
      unnamed is the third occurrence of a failure this repo has already documented.
- [x] **Riders considered and declined** (so they are not re-proposed blind): the **live health banner**
      (v4.8.1's hand-off) changes what **every** session start prints and deserves its own note; the
      **silent skill freeze** is a provenance change, and it now folds into the unfreeze release as a
      symptom rather than being fixed alone.
- [ ] Housekeeping that can ride with anything: two stale mutation worktrees are still on disk
      (`kenjaku-mut-v450`, `kenjaku-mut-v460`) — `git worktree remove` them.

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
