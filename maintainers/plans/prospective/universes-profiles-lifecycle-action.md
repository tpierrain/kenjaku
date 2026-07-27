# Universes v2 — per-universe profiles + lifecycle (rename / delete)

> **Status:** DRAFT / prospective. Branch: `feat/universe-profiles-lifecycle`.
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

- [ ] **F1 — A skill already installed is NEVER updated.** By design (ADR 0025/0026), install-if-absent
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
- [ ] **D2 — Where/how are the profile questions triggered at INSTALL for the default universe?**
      **STILL OPEN.** Reframed 2026-07-27: as originally worded this decision **contradicts ADR 0034**.
      At install there is exactly ONE universe, and progressive disclosure says the word "universe" must
      stay **invisible** until a second one exists. The *value* Thomas wants (the brain knows his context
      from day one) is legitimate; only the label is wrong.
      - **(a) First session / on demand (recommended).** Installer untouched. One skippable offer in an
        early session, plus the command any time. Needs a **"do not ask again" marker**, else the nudge
        returns every session. Also the only option that reaches **existing** brains.
      - **(b) At install, phrased as "your context", never "universe".** Keeps day-one value and respects
        ADR 0034, but adds questions to an already heavy installer and only ever helps **future** installs.
      - **(c) At install, phrased as "universe".** Rejected: frontally contradicts progressive disclosure.
- [ ] **D3 — Delete UX (must stay "not one-click"). Near-settled, confirm the last point.**
      NO easy `/switch delete`. Provide `scripts/delete-universe.mjs <slug>` (add it to the manifest, cf.
      F2) refusing `default`, requiring the slug to be retyped, **printing how many notes will go before
      confirming**, then: `rm -rf vault/<slug>/`, prune the registry, reset the pointer if needed, reindex.
      Document the procedure in SETUP.md, **including the git recovery command** (the deletion is
      committed, so git is the undo).
      - [ ] Confirm the 2026-07-27 addition: `/switch` (or its successor surface) must **know the
            procedure exists** and point at it when asked to delete, so nobody improvises a raw `rm -rf`
            and orphans the registry. "Hidden" must not mean "undiscoverable".
- [ ] **D4 — Rename scope (NEW, opened 2026-07-27). Decision needed.**
      Rename is the **riskiest** item of this plan for the **rarest** use (you name a client once): it
      moves the whole subtree, rewrites `universe:` frontmatter in **every** note under it, re-embeds the
      universe (paths change), produces a large git diff, and is exposed to the orphan-pointer bug (Step 0).
      - **(a) Display name + slug-only-while-empty (recommended).** Renaming changes the profile's
        `displayName`; the slug (folder) only moves while the universe has no notes yet. Zero frontmatter
        rewrite, zero re-embedding, tiny diff. Cost: the folder keeps its old name in Obsidian.
      - **(b) Full rename.** Visually coherent, at the cost above.
      - **(c) Defer rename entirely**, ship profile + delete first.

## Tracking

> Order revised 2026-07-27. **Prerequisite: ROADMAP Gate 2.5 is green** (see the blocked note at the
> top). Then work from the first unchecked box below.

- [x] **Step -1 — Design review + fleet audit** _(2026-07-27 · this commit)_ → §"Design review",
      §"Fleet constraints", D1 resolved, D4 opened.
- [ ] **Step 0 — Self-heal the active-universe pointer** (prerequisite of Steps 3 and 4, small, testable).
  - [ ] Pure core: a pointer naming a universe absent from the registry is invalid → fall back to
        `default`. TDD, injected fs.
  - [ ] Surface it through `session-self-heal.mjs` (already a SessionStart hook): repair, **say it in one
        line**, fail-open, always exit 0. Never silently wrong, never blocking.
  - [ ] Test the cross-machine scenario from §"Design review" (committed registry vs gitignored pointer).
- [ ] **Step 1 — Resolve the remaining decisions D2 / D3-confirm / D4 with Thomas** (blocks Steps 3-5,
      not Step 2).
- [ ] **Step 2 — Universe profile: data + write core** (pure, TDD, tested).
- [ ] **Step 3 — Universe profile: capture + inject** (conversational triggers + the SessionStart digest).
- [ ] **Step 4 — Delete a universe** (guarded script + documentation) — per D3.
- [ ] **Step 5 — Rename a universe** — per D4, scope depends on that decision. Last, deliberately.
- [ ] **Step 6 — Docs + ADR update** (SETUP, the `/switch` surface, ADR 0034 addendum or a new ADR).
- [ ] **Step 7 — Fleet / migration note** (profiles are opt-in backfill; re-check F1-F4 before shipping).

### Step 2 — Universe profile: data + write core
- [ ] Profile note path + frontmatter schema per **D1 (resolved)**: `vault/<slug>/universe.md` (and
      `vault/universe.md` for default), explicit `type: universe`. **No leading underscore**, and add the
      path to `wiki-lint.mjs`'s orphan exclusions (see §"Design review" for why both are required).
- [ ] Add pure functions in `scripts/lib/` (new module, e.g. `universe-profile.mjs`): build the
      profile note content from answers, resolve its path from a slug, detect "has no profile yet".
      Injected fs, no side effects in the pure layer (ADR 0009). TDD, one baby-step at a time.
- [ ] The **digest renderer** is part of this core, not an afterthought: profile → the short block that
      gets injected. Enforce the length cap **in the pure function**, with a test.
- [ ] Wire a CLI entry (e.g. `scripts/set-universe-profile.mjs`) that writes the note and triggers a
      reindex so the profile becomes searchable. **Declare it in `engine-manifest.json`** (cf. F2).
- [ ] Tests first (fail-first), assertions on the whole object/content, triangulate slug edge cases.

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
