# Universes v2 — per-universe profiles + lifecycle (rename / delete)

> **Status:** DRAFT / prospective. Branch: `feat/universe-profiles-lifecycle`.
> **Follows:** ADR 0034 (universes as a soft retrieval scope) and its plan
> `universes-progressive-disclosure-action.md` (shipped). This is the next small increment on
> universes.
>
> **Handoff note (why this file exists):** it was written by Opus 4.8 at the end of an exploration
> session to carry the full context forward to Opus 5 (pointers, not copies). Opus 5: read the
> "Context carried over" section first, then resolve the three open decisions WITH Thomas, then work
> the Tracking list from the first unchecked `- [ ]`.

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

## Open decisions — RESOLVE WITH THOMAS before coding

- [ ] **D1 — Where does a universe "profile" live?**
      **Recommendation: as a Markdown note in the vault**, e.g. `vault/<slug>/_universe.md` for a
      created universe (stamped `universe: <slug>` so it surfaces when that universe is active), and
      `vault/_universe.md` for the default one. Rationale: versioned, editable in Obsidian, and
      **indexed by the RAG** so the universe description becomes retrievable grounding context.
      Structured frontmatter (`displayName`, `kind: employer|client|project|personal`, `people`,
      `role`, `period`) + free-text body. Fits "everything is a note" + "pointers not copies".
      Alternative (rejected unless Thomas prefers): grow `universes.json` entries from strings to
      objects — but that is a shape migration touching every pure fn + test, and the data would not
      be RAG-searchable. Decision needed: note-based (recommended) vs registry-based vs both.
- [ ] **D2 — Where/how are the profile questions triggered at INSTALL for the default universe?**
      Options: (a) light optional question in the installer flow (risks bloating an already heavy
      installer); (b) seed an empty/stub `_universe.md` at install and let an early-session opt-in
      nudge offer to fill it; (c) pure backfill (no install change). Recommendation: (b) or (c) to
      keep the installer lean. Decision needed.
- [ ] **D3 — Delete UX (must stay "not one-click").**
      Recommendation: NO easy `/switch delete`. Provide `scripts/delete-universe.mjs <slug>` guarded
      by an explicit confirmation (e.g. must retype the slug, or `--yes-delete <slug>`), and
      **document the procedure** in SETUP.md (or a maintainers doc). It refuses `default`, does
      `rm -rf vault/<slug>/`, prunes the registry, resets the active pointer to `default` if needed,
      then reindexes. Decision needed: script + doc only (recommended) vs a guarded skill command.

## Tracking

- [ ] **Step 0 — Resolve open decisions D1/D2/D3 with Thomas** (blocks the rest).
- [ ] **Step 1 — Universe profile: data + write core** (pure, TDD, tested).
- [ ] **Step 2 — Universe profile: capture questions (conversational triggers)**.
- [ ] **Step 3 — Rename a universe** (core + skill).
- [ ] **Step 4 — Delete a universe** (guarded script + documentation).
- [ ] **Step 5 — Docs + ADR update** (SETUP, switch SKILL.md, ADR 0034 addendum or a new ADR).
- [ ] **Step 6 — Fleet / migration note** (existing brains: profiles are opt-in backfill, no forced reindex beyond what rename/delete need).

### Step 1 — Universe profile: data + write core
- [ ] Decide the profile note path + frontmatter schema (per D1).
- [ ] Add pure functions in `scripts/lib/` (new module, e.g. `universe-profile.mjs`): build the
      profile note content from answers, resolve its path from a slug, detect "has no profile yet".
      Injected fs, no side effects in the pure layer (ADR 0009). TDD, one baby-step at a time.
- [ ] Wire a CLI entry (e.g. `scripts/set-universe-profile.mjs`) that writes the note and triggers a
      reindex so the profile becomes searchable.
- [ ] Tests first (fail-first), assertions on the whole object/content, triangulate slug edge cases.

### Step 2 — Universe profile: capture questions (conversational triggers)
- [ ] In `.claude/skills/switch/SKILL.md`: after a `create`, offer (opt-in, skippable) to capture the
      new universe's profile via a few questions, then call the Step-1 CLI. Relay deterministic core
      messages verbatim (ADR 0009 — skill holds no logic).
- [ ] Backfill path: when a universe has no profile note, the `/switch` menu can flag it and offer to
      fill it (covers Thomas' default / memory-palace case).
- [ ] Install path per D2 (only if D2 chooses an installer change).

### Step 3 — Rename a universe
- [ ] Pure core in `universes.mjs` (or a sibling): validate new slug (non-empty, not `default`, not
      already existing), compute the registry transform (remove old, add new).
- [ ] `scripts/rename-universe.mjs <old> <new>`: move `vault/<old>/` -> `vault/<new>/`, rewrite
      `universe:` frontmatter in every note under it (old -> new), update the registry, update the
      active pointer if it was `old`, then reindex. Refuse renaming `default`.
- [ ] Expose via `/switch rename <old> <new>` (+ natural language) in the skill. TDD on the core;
      the fs-moving CLI gets a focused test with injected fs.

### Step 4 — Delete a universe (guarded)
- [ ] Pure core: validate slug is a real created universe (not `default`), compute the pruned
      registry, decide whether the active pointer must fall back to `default`.
- [ ] `scripts/delete-universe.mjs <slug>` with an explicit confirmation gate (per D3): `rm -rf`
      `vault/<slug>/`, prune registry, reset pointer if needed, reindex.
- [ ] Document the procedure (per D3) — this is the "documented, not one-click" requirement.

### Step 5 — Docs + ADR
- [ ] Update `.claude/skills/switch/SKILL.md` ("What it does NOT do" currently says delete/rename are
      not built — update once they are).
- [ ] SETUP.md: "How to rename / delete a universe" + the RAG self-heal behaviour on deletion.
- [ ] ADR: either an addendum to ADR 0034 or a small new ADR for profiles + lifecycle (keep the
      `Scope:` field per repo convention).

### Step 6 — Fleet / migration
- [ ] Confirm no forced global reindex for existing brains beyond what rename/delete inherently need;
      profiles are pure opt-in backfill.

## Conventions reminder (repo rules)
- Artifacts in English (this file, code, commits, PR). TDD baby-steps, green-only commits. Deterministic
  core owns logic; skills are thin drivers (ADR 0009). Checkboxes on every step (this file). No em dashes.
- When a step is done: check `- [x]` and note _(date · commit)_.
