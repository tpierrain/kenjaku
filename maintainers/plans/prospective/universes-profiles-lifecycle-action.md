# Universes v2 — per-universe profiles + lifecycle (rename / delete)

> **Status:** IN PROGRESS (Release A, Step 3 — Steps 0 and 2 done). Branch: `feat/universes-v2-profiles`.
> **Follows:** ADR 0034 (universes as a soft retrieval scope) and its plan
> `universes-progressive-disclosure-action.md` (shipped). This is the next small increment on
> universes.
>
> **Handoff note (why this file exists):** written by Opus 4.8 at the end of an exploration session to
> carry context forward across a model switch (pointers, not copies).
>
> ✅ **UNBLOCKED (2026-07-27) — this is ROADMAP Gate 2.6, and it is NEXT TO EXECUTE.** It depended on
> Gate 2.5 (`engine-managed-file-merge-strategy.md` → §"Increment 2.5"), **shipped in v4.1.0**. The
> blocker was F1 below: this plan's user-facing surface is the `/switch` skill, and an already-installed
> skill used to be **never** updated, so shipping this first would have delivered the feature to nobody
> but fresh installs. An untouched `/switch` is now refreshed on the fleet's next `/update-engine`, so
> the constraint is lifted. Read F1 as history, not as a gate.
>
> 📦 **This gate's release also carries a backlog of already-merged content** that missed the v4.1.0 tag
> and reaches nobody until then (`update-engine` resolves the **highest semver tag**, never `main`, cf.
> `engine-fetch.mjs` → `pickLatestSemverTag`): the re-synced `tdd-discipline` skill (EN + FR, the
> mutation-testing lessons) and the post-release marketing corrections. **Decided with Thomas
> (2026-07-27): do NOT cut a doc-only v4.1.1 for them, let them ride with this release.**

## Goal (Thomas' request, verbatim intent)

1. Kenjaku should **ask a few questions about each universe** to learn what it is (a "profile").
   Triggers wanted:
   - at the very first **install**, for the **default** universe;
   - when **creating** a universe (`/switch create ...`);
   - as a **backfill** when a universe already exists but has no info yet (e.g. Thomas' current
     memory palace / the default universe today).
2. Ability to **rename** a universe.
3. Ability to **delete** a universe, but deletion must be **dangerous / not one-click**: a
   **documented** procedure somewhere, not an easy skill command.
4. Answered already (see below): does deleting a universe folder make the RAG update? Yes, on the
   next reindex.

## Context carried over (from the exploration — do not re-discover)

### Current universe data model (ADR 0034, already shipped)
- A universe is a **soft, engine-enforced retrieval scope** over ONE shared vault + ONE shared index.
  Not an isolation wall.
- **Active pointer (per-machine, gitignored):** `.vault-rag/active-universe` (plain text, one line).
  Absent/blank reads as `default`.
- **Registry (committed):** `.vault-rag/universes.json` = `{ "universes": ["slug-a", "slug-b"] }`.
  **Names only, today.** The implicit `default` is never stored (its absence IS "default").
- **File layout:** default universe lives at the **vault root** (`daily/`, `topics/`, ...); a created
  universe lives in its own subtree `vault/<slug>/daily/`, `vault/<slug>/topics/`, ...
- **Frontmatter:** notes carry `universe: <slug>` **only when non-default** (absence = default).
- **DB:** `documents.universe TEXT NOT NULL DEFAULT 'default'` (schema v2). Search applies
  `WHERE d.universe = <active> OR d.universe = 'default'` unless `allUniverses=true`.
- **Progressive disclosure gate:** the feature stays invisible until a **2nd** universe exists
  (registry length >= 1). Below the gate, the brain behaves exactly as a single-universe brain.

### Key source locations
- Skill: `.claude/skills/switch/SKILL.md` (thin conversational driver).
- Deterministic core: `scripts/lib/universes.mjs` (pure logic + injected fs, tested in
  `scripts/lib/universes.test.mjs`) and CLI `scripts/set-active-universe.mjs`.
- Engine scope: `rag/src/lib/vector-store.ts` (`searchSimilarIn`, and `removeDeletedDocs` ~L456-475).
- Frontmatter: `rag/src/lib/frontmatter-parser.ts` (extracts `universe`).
- Scanner: `rag/src/lib/document-scanner.ts` (walks whole vault; excludes `.obsidian/` and exactly
  `_template.md`). NB: a `_universe.md` file would NOT be excluded, so it would be indexed.
- Filing: `scripts/file-back-note.mjs` reads active universe, stamps frontmatter, files under
  `vault/<slug>/...`.
- Reindex triggers: MCP server startup auto-reindex + live watcher on every vault write + manual
  `cd rag && npm run reindex` (`rag/src/index.ts`).

### The RAG-deletion answer (Thomas asked this directly)
- `removeDeletedDocs()` deletes every indexed doc whose path is no longer on disk (chunks +
  documents), no tombstones. So `rm -rf vault/<slug>/` + reindex = clean index.
- BUT: (a) it only happens on the next reindex event, not at the instant of `rm`; (b) the registry
  entry and the active pointer are NOT self-healing (orphan risk). => a real `delete-universe` script
  must also prune the registry, reset the pointer, and trigger a reindex.

## Design review (2026-07-27, Opus 5) — what changed

The plan was reviewed against the actual code before any implementation. Four corrections, kept here so
they are not re-derived:

- [x] **The plan optimized the wrong axis on D1.** It asked *where the profile is stored* but never *who
      reads it, and when*. A profile is **ambient** context ("here you are Head of Eng, your people are X
      and Y"). Indexed-only, it surfaces on *"what is Acme?"* and **not** on *"prepare my 1-1 with
      Jean-Kevin"*, i.e. precisely when it was needed. → **D1 resolved below: note AND deterministic
      injection.** The channel already exists (`scripts/session-universe.mjs` emits `additionalContext`
      past the gate) and is refreshed on the fleet (a `replace` glob).
- [x] **`_universe.md` is a bad name and would be flagged by the brain's own linter.** (a) The `_`
      prefix means "not a note" here: `document-scanner.ts:32` excludes `_template.md` **by name**.
      (b) A vault-root note matches no `TYPE_BY_PREFIX` entry (`frontmatter-parser.ts:25`) → `type:
      "other"`. (c) `wiki-lint.mjs` would flag it **orphan forever** (nothing links to it, and the root
      is in no exclusion zone) and **frontmatter-incomplete** (`type/created/updated/tags` required,
      `wiki-lint.mjs:101`). (d) Giving it `type: topic` to dodge (b) makes it an *entity page* subject
      to the **90-day stale rule**. → Use `universe.md` (no underscore) with an **explicit `type:
      universe`** in frontmatter (`detectType` prefers `fm.type`, so the folder problem disappears),
      plus **one orphan-exclusion line** in `wiki-lint.mjs`. Non-entity type → no stale rule.
- [x] **A latent bug class that rename/delete would make reachable: the orphan active pointer.**
      Neither reader validates the pointer against the registry (`scripts/lib/universes.mjs:203`,
      `rag/src/lib/active-universe.ts:26`). The pointer is **per-machine and gitignored**; the registry
      is **committed**. So: rename `acme` → `acme-corp` on machine A, commit, pull on machine B whose
      pointer still says `acme` → the engine filters `WHERE universe='acme'` → **zero hits from that
      universe, silently, with no error**. Same after a delete. → **Step 0 below is now a prerequisite
      of Steps 3 and 4**, not an afterthought.
- [x] **The "dangerous delete" framing was miscalibrated.** The vault is a git repo with auto-commit, so
      `rm -rf vault/<slug>` + commit is **recoverable by git**. The real risks are: deleting the wrong
      thing, leaving index/registry/pointer inconsistent, and dangling `[[links]]` from surviving default
      notes (which `lint-vault` will report, and that is healthy). Also: the failure mode of "hidden and
      documented only" is that someone improvises `rm -rf` by hand and orphans the registry. → Keep the
      guarded script + doc, but `/switch` must **know it exists** and point at the procedure.

## Fleet constraints (2026-07-27) — verified against the update path, do not re-derive

Nothing in this plan can break an installed brain (the vault is in `SACRED_TREES`, so `update-engine`
can never write a note; the universes v1 SQLite migration is already handled out of band by
`applySchema`). The real risks are all **"the feature never arrives"**:

- [x] **F1 — RESOLVED by v4.1.0 (2026-07-27): an untouched engine skill IS now refreshed.** Kept below
      as the reason this plan waited, not as a live constraint. An owner who *tailored* `/switch` still
      keeps their version (they get a `.new` sidecar), so F3's add-verbs-only rule below survives F1 and
      is now the binding one. Historical statement follows.
      **A skill already installed is NEVER updated.** By design (ADR 0025/0026), install-if-absent
      at the **directory** level in all three paths (`engine-apply-plan.mjs:60`, `staged-skills.mjs:29`,
      the SessionStart self-heal). So enriching `.claude/skills/switch/SKILL.md` reaches **no existing
      brain**, while the core (`scripts/lib/**`, a `replace` glob) **is** refreshed → core/skill drift.
      **→ This is why the plan is blocked on ROADMAP Gate 2.5.** Once 2.5 ships, the answer is simply
      "enrich `/switch`", and the workaround considered here (ship a new skill name via `engine-skills/`
      staging, which IS delivered because absent) becomes unnecessary.
- [ ] **F2 — A new top-level script must be added to `engine-manifest.json` by hand.** The `replace`
      list enumerates `scripts/*.mjs` **one by one**; only `scripts/lib/**` is a glob. A forgotten
      `scripts/delete-universe.mjs` would reach nobody, and **no test catches it**
      (`engine-manifest-integrity.test.mjs` guards the reverse direction plus SessionStart hooks).
      Add a checkbox per new script, and consider extending that guard.
- [ ] **F3 — Core/skill compatibility contract.** The core is refreshed on the fleet while the OLD
      `switch/SKILL.md` stays in place and **relays the core's output verbatim**. So: **add verbs only**;
      never change the semantics or the message format of an existing verb. Otherwise an old skill relays
      incoherent text.
- [ ] **F4 — No index schema bump.** A profile is a note, not a column. Keep it that way: bumping
      `indexSchemaVersion` would force a fleet-wide reindex. (Unrelated pre-existing side-finding about
      that field: see `engine-managed-file-merge-strategy.md` → §"Side-finding".)

## Open decisions

- [x] **D1 — Where does a universe "profile" live? RESOLVED 2026-07-27 (Thomas): note + injection.**
      A Markdown note in the vault, **and** a short digest injected deterministically.
      - **Storage:** `vault/<slug>/universe.md` for a created universe (stamped `universe: <slug>`),
        `vault/universe.md` for the default one. Explicit `type: universe` frontmatter, plus
        `displayName`, `kind: employer|client|project|personal`, `role`, `period`, `people`, and the
        accounts each native connector uses in this universe. Free-text body. Versioned, editable in
        Obsidian, indexed by the RAG.
      - **Consumption:** a **short digest** (hard cap, target 10-15 lines) injected at SessionStart and
        on `/switch`, through the existing `session-universe.mjs` channel, past the progressive-disclosure
        gate. The cap is a design constraint, not a nicety: this rides in every session.
      - **Rejected:** growing `universes.json` entries from strings to objects (shape migration across
        every pure fn + test, and not RAG-searchable); and injection-only with no note (not editable,
        not versioned, against "everything is a note").
      - [ ] Bonus unlocked by this: `nativeConnectorsReminder` (`universes.mjs:155`) currently emits a
            **generic** line. With a profile it can name the actual accounts ("acme uses the acme Slack
            workspace"). Cheap, and it makes the reminder actionable.
      - [ ] Boundary to state explicitly in the ADR: **constitution vs profile.** The constitution says
            who the owner is and how the brain behaves (sacred surface, untouched per ADR 0034); the
            profile says what **this sphere** is. Without that line, the default universe's profile and
            the `CLAUDE.md` owner section will drift and contradict each other.
- [x] **D2 — Profile questions for the default universe: RESOLVED 2026-07-27 (Thomas) → (a) first
      session / on demand.** The installer stays **untouched**. One skippable offer in an early session,
      plus the command available any time, with a **"do not ask again" marker** (else the nudge returns
      every session). Decisive argument: it is the only option that also reaches **already-installed**
      brains, Thomas' own included. The word "universe" stays invisible below the progressive-disclosure
      gate (ADR 0034): the offer talks about *your context*, not about universes.
      - **Rejected:** (b) asking at install, phrased as "your context" (adds weight to an already heavy
        installer and only ever helps future installs); (c) asking at install phrased as "universe"
        (frontally contradicts progressive disclosure).
- [x] **D3 — Delete UX: RESOLVED 2026-07-27 (Thomas), and the constraint is STRONGER than drafted.**
      Yes, the procedure exists, deterministic and documented, and yes `/switch` knows about it. But
      **it must never be surfaced, suggested, or made convenient.** Thomas' framing: someone who lets
      themselves be guided and reads messages halfway must **never** end up deleting a universe when all
      they wanted was to move from one to another. The threat model is the fat-finger, not the attacker.
      Binding rules, all three verifiable at review time:
      - [x] **Not a word in the normal flow.** Not in `list`, not in `switch`, not in `create`, not in a
            trailing "you can also…". The **deterministic core must never emit deletion copy either**,
            otherwise the fleet's old `/switch` relays it verbatim (cf. F3).
      - [x] **One door: explicit intent.** The procedure is disclosed **only** when the person asks to
            delete a universe. Discoverable on demand, invisible otherwise. "Hidden" must not mean
            "undiscoverable", but "discoverable" must not mean "offered".
      - [x] **The human types the guard, not Claude.** The skill hands over the command; it does **not**
            run it. If Claude runs the script and answers its own retype-the-slug prompt, the gate guards
            nothing. → `delete-universe.mjs` must **refuse to run without an interactive TTY** (no
            `--yes`, no piped stdin), so the guarantee is deterministic rather than resting on model
            restraint (ADR 0009 spirit). Design this into Step 4, do not bolt it on.
      - Durable beyond this repo: recorded as the `never-surface-destructive-paths` preference.
- [x] **D4 — Rename scope: RESOLVED 2026-07-27 (Thomas) → (b) FULL rename.** Cost accepted knowingly
      after the trade-off was laid out: moving `vault/<old>/` to `vault/<new>/`, rewriting `universe:`
      frontmatter in **every** note under it, re-embedding the whole universe (paths change, so the index
      treats them as new documents), and a large git diff. In exchange, the rename is coherent
      **everywhere**, Obsidian included, instead of leaving a stale folder name behind.
      - **Rejected:** (a) displayName + slug-only-while-empty (cheap, but the folder keeps its old name);
        (c) deferring rename entirely.
      - **Consequence:** full rename is exactly the cross-machine scenario that produces an orphan
        pointer (committed registry vs gitignored pointer), so **Step 0 is a hard prerequisite**, not a
        nicety. It ships first, in Release A, before rename exists at all.

## Tracking

> Order revised 2026-07-27. Its prerequisite (ROADMAP Gate 2.5) **is green since v4.1.0**, so work
> from the first unchecked box **below**.
>
> ⚠️ **THIS list is the work list.** The unchecked boxes under §"Fleet constraints" (F2-F4) and
> §"Open decisions" are **guardrails and questions**, not steps to tick in order: F2-F4 are honoured
> *while* doing the steps and re-checked at Step 7, and the decisions are resolved by Step 1. Resuming
> after a `/clear` means the first unchecked box **in this section**, never the first one in the file.
>
> 🌱 **Start from a FRESH branch off `main`.** The old `feat/universe-profiles-lifecycle` held nothing
> unique (the plan itself reached `main` through PR #47) and was deleted on 2026-07-27, so nobody
> branches from a point 39 commits behind. Branch in use since 2026-07-27:
> **`feat/universes-v2-profiles`**.
>
> 📦 **Gate 2.6 ships as TWO releases (decided with Thomas, 2026-07-27).** Do not try to land it all at
> once.
> - **Release A (in progress) = Steps 0, 2, 3, plus 6-7 scoped to what A ships.** Self-healing pointer
>   + universe profile (note *and* SessionStart digest injection). This is where the felt value is. It
>   also carries the backlog already merged past the v4.1.0 tag (re-synced `tdd-discipline`, marketing
>   corrections), which reaches nobody until a new tag exists.
> - **Release B (after) = Steps 4 and 5**, delete + full rename, with their docs and ADR. The riskiest
>   surface, isolated on purpose, and it depends on Step 0 having shipped in A.

- [x] **Step -1 — Design review + fleet audit** _(2026-07-27 · commit `3de46cb` and earlier)_ →
      §"Design review", §"Fleet constraints", D1 resolved, D4 opened.
- [x] **Step 0 — Self-heal the active-universe pointer** (prerequisite of Steps 3 and 4, small, testable)
      _(2026-07-27 · commits `0a505c9`, `8d0084d`)_.
  - [x] Pure core: a pointer naming a universe absent from the registry is invalid → fall back to
        `default`. TDD, injected fs. → `resolveActiveUniverse()`, and `readActiveUniverse()` now resolves
        through it, so NO caller (filing a note, `/switch current`, the reminder) can act on a ghost.
        `readRawActiveUniverse()` keeps the unvalidated read the heal needs to see the orphan.
  - [x] Surface it: repair, **say it in one line**, fail-open, always exit 0.
        **Deviation from the drafted wording, deliberate:** it went into `session-universe.mjs`, NOT
        `session-self-heal.mjs`. That hook's only output channel is hard-wired to the engine-update
        `RESTART REQUIRED` directive, so routing a pointer repair through it would announce a restart
        nobody needs and merge two unrelated responsibilities. `session-universe.mjs` is the universes
        hook, already reads registry + pointer, and is equally a `replace` entry in the manifest (F2
        checked: no new top-level script, nothing to declare). The notice is **not** gated by progressive
        disclosure (it can only fire on a brain that had universes; silence there would be the bug).
  - [x] Test the cross-machine scenario from §"Design review" (committed registry vs gitignored pointer):
        `universes.test.mjs` → *"cross-machine: a universe renamed elsewhere heals here…"*, including
        idempotence on the next session.
  - [x] **Deliberate non-goal, recorded so it is not re-derived:** the engine-side reader
        (`rag/src/lib/active-universe.ts`) was left unvalidated. It re-reads the file on every search, so
        once the hook has repaired it the engine is correct. The only residual window is a session that
        was ALREADY open when the rename was pulled; it closes at the next session start. Validating in TS
        too would duplicate the rule across two languages for that window alone.
  - [x] Mutation-checked by hand (not merely reasoned): heal-always-writes, never-report-the-repair,
        notice-gated-behind-the-reminder and never-heal all die. One surviving mutant
        (`listAllUniverses(registry).includes` → `registry.includes`) was **equivalent** and answered by
        simplifying the production code, per the tdd-discipline rule.
- [x] **Step 1 — Resolve the remaining decisions D2 / D3-confirm / D4 with Thomas** _(2026-07-27 · this
      commit)_. **D2** → first session / on demand, installer untouched. **D3** → confirmed *and
      hardened*: never surfaced, explicit intent only, human types the guard (TTY-only script). **D4** →
      full rename, cost accepted. Rationale in §"Open decisions". Steps 3, 4 and 5 are unblocked.
- [x] **Step 2 — Universe profile: data + write core** (pure, TDD, tested)
      _(2026-07-27 · commits `9fa064a`, `383e0a2`, `48a74b1`)_.
- [ ] **Step 3 — Universe profile: capture + inject** (conversational triggers + the SessionStart digest).
- [ ] **Step 4 — Delete a universe** (guarded script + documentation) — per D3.
- [ ] **Step 5 — Rename a universe** — per D4, scope depends on that decision. Last, deliberately.
- [ ] **Step 6 — Docs + ADR update** (SETUP, the `/switch` surface, ADR 0034 addendum or a new ADR).
- [ ] **Step 7 — Fleet / migration note** (profiles are opt-in backfill; re-check F1-F4 before shipping).

### Step 2 — Universe profile: data + write core _(DONE 2026-07-27)_
- [x] Profile note path + frontmatter schema per **D1 (resolved)**: `vault/<slug>/universe.md` (and
      `vault/universe.md` for default), explicit `type: universe`. **No leading underscore**, and the
      path added to `wiki-lint.mjs`'s orphan exclusions (new `ENGINE_STATE_NOTES` list; `isUnderZone`
      already matches both layouts, root and `<universe>/`).
- [x] Pure functions in `scripts/lib/universe-profile.mjs`: `universeProfilePath`,
      `renderUniverseProfile`, `readUniverseProfile` (quiet `null` = "no profile yet", the D2 backfill
      signal), `writeUniverseProfile` (**refuses to overwrite**, like filing back a note).
- [x] The **digest renderer** with the cap enforced IN the pure function (`renderUniverseDigest`,
      `DIGEST_MAX_LINES = 12`), truncation naming the note. Boundary tested (`<=` vs `<`) and
      mutation-checked.
- [x] CLI `scripts/set-universe-profile.mjs` (JSON answers on stdin, `--no-reindex` for tests), writes
      then reindexes. **Declared in `engine-manifest.json`** (F2 honoured; note the integrity test only
      catches it once the file is git-TRACKED).
- [x] Tests first, whole-content assertions against hand-written fixtures, `throws` with matchers.
- [x] **Side-fix, pre-existing and shipped-broken:** the active-pointer reader called `.trim()` on what
      `readFileSync` returned, and both real call sites passed the **Buffer** form (no encoding). It threw
      on ANY brain with a pointer file, i.e. on every multi-universe brain — `file-back-note.mjs` included
      (filing back while in a named universe crashed). Invisible to the suite because every fake returns
      strings. Found by running the CLI for real on a throwaway brain. Fixed at the source (`String(...)`)
      and at both call sites. **Lesson worth keeping: a fake that is kinder than reality hides a whole
      class of bugs; run the real thing once per increment.**
- [x] Also extracted `parseNote` into a pure `scripts/lib/note-parse.mjs` (re-exported by
      `wiki-lint-io.mjs`) so a pure core stops importing an fs adapter to read a note.

### Step 3 — Universe profile: capture + inject
- [ ] **Inject** the digest via `scripts/session-universe.mjs` (already a `replace` glob, so it reaches
      the fleet) and on switch, past the progressive-disclosure gate. Fail-open, never blocking.
- [ ] After a `create`, offer (opt-in, skippable) to capture the new universe's profile via a few
      questions, then call the Step-2 CLI. Relay deterministic core messages verbatim (ADR 0009).
- [ ] Backfill path: when a universe has no profile note, flag it once and offer to fill it (covers
      Thomas' default / memory-palace case). **Needs a "do not ask again" marker** (cf. D2).
- [ ] Install path per D2, only if D2 picks an installer change.
- [ ] Draft the actual questions (the plan never did): displayName, kind, role, period, key people, key
      topics, **and which accounts each native connector uses here** (feeds the D1 bonus).

### Step 4 — Delete a universe (guarded)
- [ ] Pure core: validate slug is a real created universe (not `default`), compute the pruned
      registry, decide whether the active pointer must fall back to `default`.
- [ ] `scripts/delete-universe.mjs <slug>` with an explicit confirmation gate (per D3): print the note
      count first, retype-the-slug confirmation, `rm -rf vault/<slug>/`, prune registry, reset pointer if
      needed, reindex. **Declare it in `engine-manifest.json`** (cf. F2).
- [ ] Document the procedure (per D3), **including the git recovery command**. This is the "documented,
      not one-click" requirement.
- [ ] Make the procedure discoverable from `/switch` without making it easy (cf. D3 sub-checkbox).

### Step 5 — Rename a universe (scope per D4)
- [ ] Pure core: validate new name/slug (non-empty, not `default`, not already existing), compute the
      registry transform.
- [ ] Implement the scope D4 selected. If (b) full rename: move `vault/<old>/` to `vault/<new>/`, rewrite
      `universe:` frontmatter in every note under it, update the registry, update the active pointer if it
      was `old`, then reindex. Refuse renaming `default`. **Declare the script in the manifest** (cf. F2).
- [ ] TDD on the core; the fs-moving CLI gets a focused test with injected fs.

### Step 6 — Docs + ADR
- [ ] Update the `/switch` surface ("What it does NOT do" currently says delete/rename are not built).
      Respect **F3**: add verbs, never change existing verbs' semantics or message format.
- [ ] SETUP.md: "How to rename / delete a universe" + the RAG self-heal behaviour on deletion.
- [ ] ADR: either an addendum to ADR 0034 or a small new ADR for profiles + lifecycle (keep the
      `Scope:` field per repo convention). State the **constitution vs profile boundary** (cf. D1).

### Step 7 — Fleet / migration
- [ ] Re-check **F1-F4** before shipping. Confirm no forced global reindex for existing brains beyond
      what delete/rename inherently need; profiles are pure opt-in backfill.

## Conventions reminder (repo rules)
- Artifacts in English (this file, code, commits, PR). TDD baby-steps, green-only commits. Deterministic
  core owns logic; skills are thin drivers (ADR 0009). Checkboxes on every step (this file). No em dashes.
- When a step is done: check `- [x]` and note _(date · commit)_.
