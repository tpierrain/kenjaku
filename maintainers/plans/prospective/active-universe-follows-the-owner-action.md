<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- STATUS: 🟢 OPEN — opened 2026-08-07. S1 done (decision recorded), S2 next.  -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Action plan — the active universe follows the owner, not the machine

> **Next real step: S2** (un-ignore the pointer + its anti-regression guard + the nine prose sites that
> still assert the old semantics). S1 is done: the decision is recorded in ADR 0034. No code has moved
> yet — nothing outside `maintainers/` has been touched.
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
- **The announcement channel already exists.** Past the progressive-disclosure gate,
  `session-universe.mjs` names the active universe at every session start. So a pointer arriving by
  `git pull` is **not** a silent scope change: the next session says which universe it is in, in one
  line.
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

- [ ] **S2 — The active universe travels with the brain (and cannot be re-ignored by accident).**
  - [ ] Remove the `.vault-rag/active-universe` entry from `.gitignore`; keep a short comment saying
        the pointer is committed **on purpose** (owner state), so nobody restores the line "to be
        consistent with the caches".
  - [ ] **Deterministic guard**: a test asserting the pointer is **not** ignored by the shipped
        `.gitignore` — the twin of the existing "the cache file sits under `.cache/`, which every
        brain gitignores" test (`scripts/lib/upstream-cache.test.mjs:187`). Fail-loud if the line
        ever comes back.
  - [ ] Correct every comment/test that asserts the old semantics in prose: `rag/src/lib/active-universe.ts`,
        `rag/src/lib/active-universe.test.ts`, `scripts/lib/universes.mjs` (~L60),
        `scripts/lib/universes.test.mjs` (~L423), `scripts/session-universe.mjs` (header),
        `local-mirror/src/adapters/fs-universes.ts`, `local-mirror/src/lib/config.ts`,
        `local-mirror/src/test/fs-universes.test.ts`, `local-mirror/src/test/universes.test.ts`.
  - [ ] Verify **progressive disclosure is untouched**: below the gate no pointer file is written at
        all (only `/switch`, create, rename and delete write it), so a single-universe brain commits
        nothing new and behaves exactly as today.

- [ ] **S3 — A brain that pulls a switch made elsewhere lands on it cleanly (fleet + conflicts).**
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
