# Universes v2 — per-universe profiles + lifecycle (rename / delete)

> **Status:** ONE release for the whole gate (Thomas, 2026-07-27 — the A/B split is reversed).
> **Steps 0 through 10 are done** _(2026-07-28)_: fleet re-check, marketing pass, Windows parity
> (CI 7/7) and the `local-mirror` universe choice included. **Nothing but the tag is left.** Branch:
> `feat/universes-v2-profiles`, PR **#49** open, nothing merged or tagged.
>
> ▶️ **Resuming after a `/clear`: go to Step 11 — cut the release.** PR #49's body predates Step 10,
> so it needs the mirror half added before merging.
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
      - [x] _(done — ADR 0035 §8, 2026-07-27)_ Boundary to state explicitly in the ADR: **constitution
            vs profile.** The constitution says
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
> 📦 **REVISED 2026-07-27 (Thomas), and this supersedes the two-release split below: Gate 2.6 ships
> as ONE release.** The whole universes story travels together — profiles *and* lifecycle — so an
> owner meets the notion once, not twice. Concretely: **stay on `feat/universes-v2-profiles`**, keep
> committing there, **no tag until Step 5 is done**. The A/B vocabulary is kept below only because
> the ticked boxes reference it; read it as "the two halves of one release", not as two shipments.
> - **Half A (DONE, unreleased) = Steps 0, 2, 3, plus 6-7 scoped to it.** Self-healing pointer +
>   universe profile (note *and* SessionStart digest injection). The tag that eventually carries it
>   also carries the backlog already merged past v4.1.0 (re-synced `tdd-discipline`, marketing
>   corrections), which reaches nobody until that tag exists.
> - **Half B (in progress) = Steps 4 and 5**, delete + full rename, with their docs and ADR. The
>   riskiest surface. It still depends on Step 0's self-healing pointer, which is why that shipped
>   first *in the branch* — the ordering constraint was never about two tags.

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
- [x] **Step 3 — Universe profile: capture + inject** (conversational triggers + the SessionStart digest)
      _(2026-07-27 · commits `65afa86`, `c59e2d3`, `452f200`, `779bd73`, `006afd9`)_.
- [x] **Step 4 — Delete a universe** (guarded script + documentation) — per D3 _(2026-07-27 · commits `93f46ce`, `b216331`, and this one)_.
- [x] **Step 5 — Rename a universe** — per D4 (full rename). Last, deliberately. _(2026-07-27 · commits `c695c8e`, `c4cd386`, and this one)_.
- [x] **Step 6 — Docs + ADR update**, scoped to Release A _(2026-07-27 · commit `2081034`)_. The
      rename/delete half stays open for Release B (see the step below).
- [x] **Step 7 — Fleet / migration re-check** for Release A _(2026-07-27 · this commit)_.
- [x] **Step 8 — Release prep**: marketing-surface pass, then PR #49 _(2026-07-27)_. The tag itself
      waited on Steps 9 and 10.
- [x] **Step 9 — Windows parity** _(2026-07-27 · `175e215`; CI 7/7 on run `30307984513`)_.
- [x] **Step 10 — `local-mirror` names the universe and confirms before the first pull**
      _(2026-07-28 · commits `c9ab78e`, `934abc1`, `b83b6b3`)_. The three DEFECTs are fixed and
      pinned; the core, not the model, decides whether there is a choice to make.
- [ ] **Step 11 — Cut the release.** Everything above is done; this is the last box of Gate 2.6.
      **Thomas said go (2026-07-28): `v4.2.0`, titled *The One Where Your Brain Knows Where It Is*.**
  - [x] CI **7/7 green** on PR #49 (Node 22/24/26 × macOS + Windows, Windows installer e2e).
  - [x] PR #49 body updated with the `local-mirror` half.
  - [x] CONVENTIONS §10 marketing pass **re-run for the mirror half** _(`d1cff81`)_: `CONNECTORS.md`
        and `SETUP.md` stated the pre-universes path unconditionally; boards re-read, still true, no
        re-render (verdict recorded in that commit).
  - [ ] ⚠️ **A `local-mirror` mutation campaign was launched and Stryker runs `inPlace: true`** — the
        working tree gets INSTRUMENTED while it runs. **Never `git add -A` during it.** When it ends,
        check `git status` is clean under `local-mirror/**` (Stryker restores on exit); if it was
        killed mid-run, restore with `git checkout -- local-mirror/src`. Log:
        `<scratchpad>/mutation-local-mirror.log`.
  - [ ] Paste the measured score into the release note draft (`SCORE_PLACEHOLDER`), which is written
        and ready at `<scratchpad>/release-v4.2.0.md`. Update the `local-mirror` row of
        `maintainers/mutation/RESULTS.md` with the same number, pinned to v4.2.0.
  - [ ] Merge PR #49 → `main`, tag **`v4.2.0`**, `gh release create` with that note.
  - [ ] After the tag: archive this plan (`prospective/` → `archived/`), close Gate 2.6 in the
        ROADMAP, and prune the `kenjaku-next-work-order` memory pointer.

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

### Step 3 — Universe profile: capture + inject _(DONE 2026-07-27)_
- [x] **Inject** the digest via `scripts/session-universe.mjs` (a `replace` glob, so it reaches the
      fleet). Read in its OWN try/catch: an unreadable profile must not cost the session its universe
      reminder, nor the reverse.
      **Deviation, deliberate:** the digest is **NOT** behind the progressive-disclosure gate. A
      single-universe brain is the common case AND the one D2 offers a profile to; gating the digest
      would make the capture pointless for almost everyone who ever fills one in. What the gate really
      protects is the **word** "universe", so the injected copy never says it — verified end to end on a
      single-universe brain.
- [x] **On switch**, via a new `--digest` verb rather than an addition to the switch message: the
      profile is background for the session, and appending it to a message the skill relays *verbatim*
      would echo the owner's own profile back at them. Quiet + exit 0 when there is no profile (the
      common case must never look like a broken step). F3 honoured: a **new verb**, no existing verb's
      semantics or format touched.
- [x] After a `create`, offer (opt-in, skippable) to capture the new universe's profile, then call the
      Step-2 CLI. In the `/switch` skill, right after the `create` branch.
- [x] Backfill path: `profileCaptureOffer()` + the `.vault-rag/profile-nudges.json` marker
      (**committed**, unlike the active pointer: refusing is the owner's decision, not the machine's, so
      it must not come back on the laptop — while a universe created later still gets asked).
      `--decline` records it deterministically and reads no stdin.
- [x] The offer **routes both answers to a deterministic surface** (ADR 0009). Left to improvise, a
      session would hand-write a note of the wrong shape and forget the refusal by the next session. A
      test pins the offer's skill reference to a heading that actually exists — rename it and the
      directive would still fire, still lead nowhere, and nothing else would notice.
- [x] Install path per D2 → **nothing to do**: D2 chose "first session / on demand, installer
      untouched", and the SessionStart offer covers a fresh install exactly like an old brain. Recorded
      here so the box is not re-opened as an oversight.
- [x] Drafted the actual questions, in the `/switch` skill: displayName, kind, role, period, about,
      people, **topics** (new — `renderUniverseProfile`/`renderUniverseDigest` had no place to put them),
      and which accounts each native connector uses here. Asked as ONE short batch, every one skippable.
- [x] **THE dichotomy, enforced by the core (Thomas, 2026-07-27 — the release-blocking review).** A
      first pass only protected the *injected* channel; the CLI prose and the skill still spoke
      "universe" to a mono-universe owner, who has never met the notion. Now `profileCaptureOffer`
      takes `multiverse` and states which world applies (`BELOW` / `PAST the disclosure gate`), the
      hook feeds it from the registry, and the skill has it as a golden rule. **The model never
      decides**: deciding means counting universes (ADR 0009).
      **Arbitrated and closed: the ARTIFACT keeps the word** — `universe.md`, `type: universe`, in
      both worlds. `context.md` was rejected by Thomas: "context" collides with the LLM context
      window for any developer, and the page is rarely opened. The file paths the CLI prints are
      therefore fine to quote back.
- [x] **The offer follows you into a universe** (Thomas' own case: universes created before profiles
      existed). A `--digest` after a switch emits `[ask the owner]` when that universe has none, and
      is silent once declined. The session-start offer only ever covers the universe you *start* in,
      so without this door a sphere you rarely open is never asked about at all.
- [x] **D1 bonus, satisfied in effect:** the switch reminder stays the generic instruction, and the
      digest that now follows a switch carries the actual accounts (`Connector accounts: Slack:
      acme.slack.com.`). Naming them in the reminder *too* would only duplicate it.
- [x] Also hardened while here: the digest reads a **hand-edited** profile the way its owner leaves it
      (trailing spaces after a heading, `*` bullets as readily as `-`). Mutants hand-applied and killed:
      the heading `.trim()`, the bullet character class, the Topics section, the `if (profile)` guard.

### Step 4 — Delete a universe (guarded)
- [x] Pure core: validate slug is a real created universe (not `default`), compute the pruned
      registry, decide whether the active pointer must fall back to `default`.
      _(2026-07-27 · this commit)_ → `planUniverseDeletion(io, dir, rawName)` in
      `scripts/lib/universes.mjs`: **it decides, it never acts**. Three refusals are distinct on
      purpose (`empty` / `reserved` / `unknown`), because "the default scope does not exist" would be
      a lie about the one scope that always does. `available` lists only the **deletable** universes
      (the registry), not `listAllUniverses()`. `resetPointer` reads through the *validated* pointer.
      Six mutants hand-applied and killed (each guard dropped, the prune inverted, `resetPointer`
      inverted, `available` leaking the default).
- [x] `scripts/delete-universe.mjs <slug>` with an explicit confirmation gate (per D3): print the note
      count first, retype-the-slug confirmation, `rm -rf vault/<slug>/`, prune registry, reset pointer if
      needed, reindex. **Declared in `engine-manifest.json`** (cf. F2) and git-tracked, so the integrity
      test sees it. _(2026-07-27 · commit `b216331`)_
  - [x] The TTY refusal is the **first** thing the flow does, before the plan is even computed:
        `isInteractive()` demands a terminal on **both** ends, since a piped stdin is exactly the shape
        an assistant would use to answer on the owner's behalf. **Verified for real**, not only in
        tests: `echo "blue" | node scripts/delete-universe.mjs blue` exits 1 and touches nothing.
  - [x] **Deviation, minor and deliberate:** the flow is `async`. The confirmation needs a real prompt,
        and the repo already owns one pattern for that (`readline/promises`, as in `installer.mjs`);
        a hand-rolled sync read on fd 0 would have been a second, worse one.
  - [x] **Deviation, honest:** the failed-reindex branch was written in the same green step as the
        reindex call itself (mirrored from `set-universe-profile.mjs`) rather than driven by its own
        red. Its test came right after and does hold — recorded so the baby-step is not claimed
        cleaner than it was.
  - [x] Eleven mutants hand-applied and killed. **Two survived the first pass** and each earned a
        test: an answer merely *containing* the slug ("yes delete blue") passed a `.includes` gate,
        and the note count printed *after* the question was invisible until a shared timeline made
        "shown before asked" an assertable fact. A third (dropping `.trim()`) dies on the retyped
        answer with its trailing newline.
- [x] Document the procedure (per D3), **including the git recovery command**. This is the "documented,
      not one-click" requirement. _(2026-07-27 · this commit)_ → SETUP **§5.2**, warning first, plus the
      two-command `git log --diff-filter=D` / `git checkout <commit>~1` recovery, and the reason the
      script refuses to run when Claude tries to run it for the owner.
- [x] Make the procedure discoverable from `/switch` without making it easy (cf. D3 sub-checkbox).
      _(2026-07-27 · this commit)_ → a section that **opens with the rule** (never mentioned, suggested
      or offered anywhere else; the skill hands the command over and does not run it), skill
      `version: 1.2.0 → 1.3.0`, and the frontmatter `description` extended with the explicit-ask
      triggers only — without them the skill would not even load when someone asks to delete, which is
      "undiscoverable", not "not offered". **The deterministic core still emits no deletion copy at
      all** (F3): nothing in `runSwitchCli` mentions it, so the fleet's older `/switch` cannot relay it.
      The stale "it does **not** delete a universe" bullet is now the rename one.

### Step 5 — Rename a universe (scope per D4)
- [x] Pure core `planUniverseRename`: it validates its SOURCE through the same gate as deletion
      (`refuseUnlessCreated`, extracted in the refactor step — the two had drifted into half-consistent
      copies), and its TARGET on its own terms: `empty`, `reserved` (renaming INTO `default` would make
      the registry entry vanish while the folder stayed on disk) and `exists` (that is a *merge*, whose
      questions a rename cannot answer). Six mutants killed.
- [x] Full rename (D4-b): `scripts/rename-universe.mjs <old> <new>` moves `vault/<old>/`, re-stamps
      every note under it, rewrites the registry, carries the pointer along **only** if you were
      standing there, then reindexes. **Declared in `engine-manifest.json`** (F2). Eight mutants killed,
      and it was **run for real** on a throwaway brain (folder, both notes, registry and pointer checked
      on disk) — the Step-2 lesson applied, not merely quoted.
  - [x] `restampUniverse` (new, in `stamp-universe.mjs`) is deliberately the **opposite** of
        `stampUniverse`: stamping protects an explicit scope, renaming must overwrite it. It also
        stamps a note that declares none — the Obsidian-typed note, which would otherwise survive the
        rename unscoped and fall back to the cross-cutting scope.
  - [x] **No TTY gate here, deliberately** (unlike delete): a rename loses nothing and is undone by
        renaming back. `never-surface-destructive-paths` is about destruction, and applying it to a
        reversible operation would be cargo-culting the ritual instead of the reason.
        **Re-confirmed by Thomas, 2026-07-27**, once the alternative was laid out plainly: Claude may
        run the rename itself after the owner says yes. The ceremony would be paid at **every**
        rename, by people who own no terminal, to protect against a few minutes of unwanted compute
        that renaming back undoes. Delete earns its TTY because there it is the notes that go.
  - [x] **Informed consent, not a gate: `--preflight`** _(2026-07-27 · this commit)_. Asked for by
        Thomas at the re-check. A rename is reversible, so the point is not to protect the notes but
        the **person**: the re-embed can keep a machine busy for minutes, and someone who was not told
        reads that as a hung brain. `node scripts/rename-universe.mjs --preflight <old> <new>` prints
        the note count, what moves, whether they keep standing there, and the re-encode cost —
        **touching nothing** — and the refusals fire there too, before anyone waits. The wording lives
        in the core (ADR 0009), not in chat prose, so every session says the same thing. Confirmed for
        real on a throwaway brain (exit 0 and nothing on disk changed; `exists` still refuses).
        Two mutants hand-applied and killed: counting the notes at the NEW path (reads 0), and
        dropping the short-circuit so the preflight renames for real.
- [x] TDD on the core; the fs-moving CLI has its own tests with injected fs.

### Step 6 — Docs + ADR _(Release A DONE 2026-07-27; the lifecycle half belongs to Release B)_
- [x] Updated the `/switch` surface: the profile questions, the post-switch `--digest` refresh, and the
      `--decline` path. **F3 honoured** — verbs ADDED (`--digest`, `--decline`), not one existing verb's
      semantics or message format touched. Skill `version: 1.0.0 → 1.1.0`, and its frontmatter
      `description` now carries the "describe my context" triggers, or an owner accepting the offer
      would never load the skill that owns the questions.
- [x] **ADR 0035** — `0035-a-universe-profile-is-a-note-plus-an-injected-digest.md`, with the `Scope:`
      field, cross-linked from ADR 0034's `Related:`. States the **constitution vs profile boundary**
      D1 asked for, and records the digest-not-behind-the-gate reasoning (the gate protects the *word*,
      not the feature).
- [x] SETUP.md **§5.1** ("Telling your brain about your context") + the glossary entry, and a README
      bullet — the user-facing half of Release A. Anchor checked, not assumed.
- [x] **The delete half** _(2026-07-27 · commit `8a48271`)_: SETUP **§5.2** (what it costs, the
      retype-the-name gate, the TTY refusal, the git recovery commands) + the `/switch` section that
      leads with the never-offer rule, and the stale "it does **not** delete a universe" bullet under
      "What it does NOT do" replaced by the rename one.
- [x] **The rename preflight** _(2026-07-27 · this commit)_: the `/switch` rename section is now a
      **two-step flow** (preflight → relay → confirm → run), SETUP §5.2 says the brain tells you the
      cost and waits for your go, the Golden rule "no reindex" gains its explicit lifecycle exception,
      and the frontmatter `description`'s "does NOT touch notes and needs no reindex" is scoped to
      **switching** (it was stated of the whole skill, which rename made false). Skill
      `version: 1.4.0 → 1.5.0`.
- [x] **The rename half** _(2026-07-27 · this commit)_: SETUP **§5.2** (delete became §5.3), naming
      the re-embed cost as compute-not-data and the cross-machine self-heal; `/switch` gains a rename
      section and the triggers in its `description`; skill `version: 1.3.0 → 1.4.0`. The "What it does
      NOT do" bullet is now about **merging**, which really is refused.

### Step 7 — Fleet / migration
- [x] **F1-F4 re-check EXTENDED to delete + rename, with evidence, 2026-07-27** _(this commit)_:
  - [x] **F1** (the surface reaches the fleet) — `.claude/skills/switch/**` is a `replace` entry
        (`engine-manifest.json:64`), so an *untouched* `/switch` is refreshed with the rename and
        delete sections at the next `/update-engine`; a tailored one keeps its version and gets a
        `.new` sidecar. Nothing else in this half is user-facing except SETUP/README, which are
        engine-owned docs.
  - [x] **F2** (a new top-level script must be declared BY HAND) — `scripts/delete-universe.mjs` and
        `scripts/rename-universe.mjs` are both in the `replace` list (`engine-manifest.json:25-26`)
        **and** git-tracked (`git ls-files` confirms; the integrity test only sees a tracked file).
        Their new dependency `scripts/lib/stamp-universe.mjs` rides the `scripts/lib/**` glob. No
        other new top-level script in this half.
  - [x] **F3** (old skill + new core) — **still zero deletion copy in `runSwitchCli`**, re-read
        end to end: its verbs are `current`/`list`/`menu`/`create`/`switch` and their message shapes
        are byte-identical to `main`, so a fleet `/switch` predating this release relays exactly what
        it relayed before. Deletion and rename live in their **own** scripts, which no old skill
        knows how to call. The only string in the core containing the word *deleted* is
        `pointerHealNotice` (`universe-reminder.mjs:39`), and it is a **report of a repair already
        made**, not an offer of a path: it names no command and rides the SessionStart hook's own
        output, which no skill relays. Bonus, verified by reading `parseSwitchArgs`: an old skill
        handed `delete acme` would route it to `switch` and answer `unknown universe 'delete acme'` —
        a refusal, not an action.
  - [x] **F4** (no schema bump) — `git diff main...HEAD -- rag/` is still **empty**: this half does
        not touch the engine at all, so no fleet-wide reindex. The re-embed a rename costs is
        **local to the renamed universe** and follows from paths changing, not from a schema version:
        `index-manager.ts:177` looks the stored hash up **by `relativePath`**, so a moved note is a
        new document; and the re-stamped frontmatter changes the content hash anyway.
  - [x] **Permissions: no allowlist entry**, as expected. `rename-universe.mjs` is confirmed on first
        run exactly like `set-active-universe.mjs` (`.claude/settings.json.template` allows no
        `node scripts/…`) — a write that asks is the behaviour we want. `delete-universe.mjs` needs
        none by construction: the owner runs it in their own terminal, so Claude never invokes it.
  - [x] **Reindex duration, confirmed rather than assumed** (Thomas asked): with the in-process
        embedder the measured sweep behind `EMBED_BATCH` (`in-process-embedder.ts:17-24`) is
        **264 notes ≈ 5.3 min** at batch 4. So "seconds on a small universe, a few minutes on a large
        one" is a measurement, not a hedge — and it is why the rename now has a `--preflight`.
- [x] **F1-F4 re-checked for Release A, with evidence, 2026-07-27:**
  - [x] **F1** (skills reach the fleet) — `.claude/skills/switch/**` is a `replace` entry, so an
        *untouched* `/switch` is refreshed; a tailored one keeps its version and gets a `.new` sidecar.
        A brain predating the universes hook still converges: `reconcile-brain.mjs` reconciles
        SessionStart entries **additively** from `settings.json.template`, so `session-universe.mjs`
        gets wired at the next restart.
  - [x] **F2** (a new top-level script must be declared BY HAND) — `scripts/set-universe-profile.mjs`
        is in the `replace` list AND git-tracked (the integrity test only sees it once tracked). No
        other new top-level script in Release A.
  - [x] **F3** (old skill + new core) — nothing but new verbs. The one core message that changed shape
        is the SessionStart hook's own output, which no skill relays.
  - [x] **F4** (no schema bump) — `git diff main -- rag/` is **empty**: Release A does not touch the
        engine at all. Profiles are pure opt-in backfill; writing one triggers only the ordinary
        incremental reindex.
  - [x] **New committed state file, deliberately:** `.vault-rag/profile-nudges.json` is NOT gitignored
        (only `.vault-rag/active-universe` is). A refusal is the owner's decision, not the machine's.
  - [x] **Permissions:** no allowlist entry added — `set-universe-profile.mjs` is confirmed on first
        run exactly like `set-active-universe.mjs`. A write that asks is the behaviour we want.

### Step 8 — Release (CONVENTIONS §10 marketing-surface pass, then the tag)
- [x] **Marketing surface re-read, 2026-07-27, verdict recorded** _(this commit)_:
  - [x] **What this release made FALSE or imprecise** — one hit, and it was ours: the README's new
        profile bullet promised *"one sphere's people **never leak** into another's answers"*. A
        universe is a **soft** scope by design (ADR 0034, not an isolation wall) and the owner can say
        "search all universes", so the absolute was writing a cheque the design refuses to cash.
        Rewritten as *"stay out of another's answers, unless you ask to search across them"*. Exactly
        the class of rot §10 was written for, caught in the release it was born in.
  - [x] **What this release made TRUE that we did not sell** — **renaming**. Now one clause in the
        README universes bullet (it renames everywhere, and says what it costs first) plus the SETUP
        §5.2 link. **Deleting stays deliberately unsold** (D3): a capability we do not advertise is
        the point, not an oversight, and this line is here so no future release "fixes" it.
  - [x] **CONNECTORS.md** — the profile records *which account a sphere uses*, which made the
        single-account caveat worth stating where connectors are actually documented: a connector is
        wired once for the whole brain and does **not** follow a universe switch. It was only ever said
        at switch time, by the reminder.
  - [x] **EN-QUOI-C-EST-DIFFERENT.md — no change, deliberately.** Re-read whole: no absolute broken.
        *"Safe by construction: the brain takes no action on your tools"* still holds (universes act on
        the owner's own vault, never on a connected tool), and *"yours, in an open format"* is
        reinforced, since a profile is a plain note. Universes are absent from that piece, which is a
        pre-existing editorial choice, not something this release changed.
  - [x] **Boards — re-read through their README alt texts and `docs/marketing-image-prompts.md`, copy
        still accurate, NO re-render.** The `switch` tile ("flip between contexts: jobs, clients,
        spheres") is now an undersell of a bigger skill, not a falsehood; board-connect's "read-only,
        never changes your sources" and board-privacy's "your notes never move" both scope to
        connectors and to swapping the embedder, neither of which this release touches.
- [ ] Tag + GitHub release (title in the `The One Where…` series), carrying the backlog merged past
      v4.1.0 (the re-synced `tdd-discipline` skill, the marketing corrections). **BLOCKED by Steps 9
      and 10 below.** Proposed, not yet agreed with Thomas: `v4.2.0` (additive, `rag/` untouched, so
      `rag/package.json` stays at 1.1.5 as it did between v4.0.0 and v4.1.0), titled
      *"The One Where Your Brain Learns Where It Is"*.
  - PR **#49** is open with the release body already written. **Nothing is merged or tagged.**
  - Unrelated and deliberately left alone: PR **#48** (external, a `fast-uri` CVE bump) touches
    `rag/`, so letting it ride this release would invalidate the "engine untouched, no fleet-wide
    reindex" claim. Handle it separately, after the tag.

### Step 9 — Windows parity: 22 tests are RED on CI (blocks the tag)

> 🛑 **Found by CI on PR #49, 2026-07-27.** macOS is green on Node 22/24/26 and the Windows installer
> e2e passes, but the **three Windows harness jobs fail**. Nothing in Gate 2.6 ever ran on Windows.
> The F1-F4 re-check did not catch this and could not: it audits **distribution** (does the code reach
> the fleet), not **parity** (does it work once there). DEVELOPING §8 makes parity a release gate.

- [x] **Root cause, already identified — do not re-investigate.** `scripts/lib/universes.mjs` declares
      a POSIX-normalisation convention in its own header (L16-18, `toPosix`) and `vaultRagDir` (L92)
      applies it. **`registryPath` (L181) and `activeUniversePath` (L186) do not**: they return a raw
      `join()`, which on Windows yields `.vault-rag\universes.json`. So every registry read misses,
      `readRegistry` returns `[]`, and the failures cascade from there (the tell in the log is
      `Deletable universes: .`, an empty list where `acme` was seeded).
- [x] **Fix applied, and it was BROADER than the two builders** _(2026-07-27 · this commit)_. The two
      builders now apply `toPosix`, as planned. But the same class of break lived in the three CLIs
      too: each rebuilt paths from `deps.cwd()`, which is `C:\brain` on Windows, so `${cwd}/vault/...`
      and `join(cwd, "rag")` leaked a backslash the registry fix alone would not have caught. Each CLI
      now **normalises the root ONCE** (`const root = toPosix(deps.cwd())`) and builds every path from
      it, which let `node:path`'s `join` go away entirely in all three. Fixing the builders was
      preferred over patching the tests, per the reasoning below: the production paths were
      mixed-separator on Windows, which fs tolerates and every string comparison does not.
- [x] Whole suite re-run: **955 pass / 0 fail** on macOS. No test needed re-keying — the literal
      `"/brain/.vault-rag/…"` fake-fs keys are what the fixed builders now produce on Windows too.
- [x] **Verified the Windows half locally rather than trusting the push.** macOS `join` emits `/`, so
      it can never see this: the suites were re-run under a **loader that redirects `node:path` to
      `path.win32`** (throwaway, in the scratchpad, not committed). Before: the 22 known failures.
      After: **the four affected suites are green**. The only residual failures under that simulation
      are its own artefacts (tests touching the REAL macOS filesystem through a win32 `resolve`), and
      they were never among the 22.
- [x] **Loop closed — the guardrail is a backslashed ROOT, not a POSIX assertion.** The reason nothing
      but CI could see this: every test fed the code a POSIX cwd, so `join` never had a backslash to
      leak. A test asserting "the builders return POSIX" would have stayed green on macOS and proved
      nothing. What is red-on-macOS-before / green-after is handing the code a **Windows-shaped root**
      (`C:\brain`) and asserting the paths that come out. Four such tests now exist: one pure
      (`universes.test.mjs`, both builders) and one per CLI (delete / rename / profile, covering the
      folder move, the note re-stamp and the reindex cwd).
- [x] **Green on all three Windows jobs** _(2026-07-27 · run `30307984513` on `175e215`)_: 7/7,
      Node 22/24/26 on windows-latest and macos-latest plus the Windows installer e2e. The local
      win32 simulation and the real thing agreed.

### Step 10 — `local-mirror`: name the universe, and confirm before the first pull

> 🎯 **Thomas' request, 2026-07-27**, added to this release deliberately: it is the same story
> (universes), and an owner should meet it once.
>
> ✅ **DONE (2026-07-28 · commits `c9ab78e`, `934abc1`, `b83b6b3`).** The core owns the refusal, both
> defects in the package are fixed, the skill no longer documents the pre-universes layout, and the
> three defects' regressions are pinned. 228 tests green in `local-mirror` (+3 brain-side guards),
> typecheck clean. **Nothing else stands between this branch and the tag.**

- [x] **The ask, verbatim in intent:** when declaring a **Notion zone** as a local mirror, the brain
      must (a) **remind which universe is active**, and **only if several exist** (the ADR 0034
      progressive-disclosure gate — a single-universe owner must not meet the word), and (b) **ask for
      confirmation before the FIRST full pull** of the zone's docs into the vault. The reason is
      economic, and it is the same one that gave rename its preflight: moving mirrored docs into
      another universe afterwards costs a full re-embed of the whole mirror, so the cheap moment to
      get the scope right is **before** the first pull, not after.

- [x] **DECIDED (Thomas, 2026-07-27): a mirror is ALWAYS attached to a universe** — the default one
      when that is all there is, one of the existing ones otherwise. This is stronger and cleaner than
      the (a)/(b) fork drafted below: attachment is an **invariant**, not a special case. It maps
      exactly onto ADR 0034, where the default universe **is** the vault root, so "attached to
      default" and "lands at `vault/mirrors/<name>/`" are the same sentence. Nothing changes for a
      single-universe owner, and there is no migration.
  - [x] **Past the gate, the owner CHOOSES** (Thomas, 2026-07-27): the confirmation proposes the
        **active** universe pre-selected and lets them name another, including an explicit
        **cross-cutting (default)** for something like a company-wide wiki. Confirm-only was the
        alternative and was rejected: it makes a cross-cutting mirror require a `/switch` to default
        first, which nobody would guess.

- [x] ~~Decide FIRST — where does a mirror land when a universe is active?~~ **The question was
      already answered BY THE CODE, and the drafted premise was wrong** (verified 2026-07-27, before
      writing anything). The claim "today it is `vault/mirrors/<name>/`, cross-cutting always" was
      read off `local-mirror/SKILL.md`, **not** off the implementation. The chosen behaviour is
      already shipped in the `local-mirror` server:
  - `local-mirror.ts:87` — `setupSource` **freezes** the active universe into the config at
    declaration time, with the reason stated in the code: never re-read on the hot sync path, so a
    background tick firing while the owner `/switch`es cannot scatter one mirror across universes.
  - `local-mirror.ts:489` (`vaultPathFor`) — a scoped mirror lands under `<universe>/<target_dir>/`,
    a default one keeps the historical root path.
  - `configFromRequest` (`:503`) stamps `universe` **only** when non-default, exactly as notes carry
    `universe:` only outside the default scope.
  - ⇒ **The remaining work is the user-facing half plus two defects**, NOT the path contract.

- [x] **DEFECT 1 (found while verifying, fix it here): the success message names a folder the files
      are not in.** `local-mirror.ts:125` says ``Files live under ${config.target_dir}/``, which is
      `mirrors/<name>/` — the **universe prefix is missing**. For a scoped mirror the files are in
      `<universe>/mirrors/<name>/`. Use the same path builder the writer uses (`vaultPathFor`), so
      the message cannot drift from reality again.
      _(2026-07-28 · `c9ab78e`)_ Fixed by extracting `vaultDirFor(config)` — the FOLDER, universe
      prefix included — and routing both `vaultPathFor` and the message through it, so the sentence
      and the writer cannot disagree by construction.
- [x] **DEFECT 2: the skill documents the pre-universe layout, unconditionally**, on
      `engine-skills/local-mirror/SKILL.md` lines **11, 93, 176, 277, 292** (`vault/mirrors/<name>/`).
      This is what misled this very plan, so it will mislead the next session too. Line 277 (the
      "look before declaring absence" instruction) and 292 (the exclusion-zone table) are the two that
      actually change behaviour when wrong.
      _(2026-07-28 · `934abc1`)_ All five corrected, `version:` bumped to 1.1.0, and the onboarding
      flow gained the two-call step. **Pinned by two guards** in `scripts/lib/local-mirror-skill.test.mjs`
      (the scoped path, and `awaitingUniverse` + the never-say-the-word rule): a doc defect that
      already misled one plan deserved a red suite, not a careful edit.
- [x] **DEFECT 3 (same class as Step 0, in the OTHER package): local-mirror does not validate the
      active pointer against the registry.** `adapters/fs-active-universe.ts` trims the pointer and
      trusts it, so a pointer left naming a deleted/renamed universe freezes a **ghost** universe into
      a brand-new mirror: its notes land under `vault/<ghost>/mirrors/…` and are filtered out of every
      search, silently. Step 0 fixed exactly this on the brain side (`resolveActiveUniverse` against
      the registry). Reading the registry is needed for the choice above anyway, so resolve through it
      here too rather than leaving the hole open in the package that writes the most files.
      _(2026-07-28 · `c9ab78e`)_ The adapter became `fs-universes.ts`: it reads the registry FIRST,
      then resolves the pointer through it (`lib/universe.ts` → `parseUniverseRegistry`,
      `resolveActiveUniverse`), and every read failure degrades to the default scope rather than
      breaking a declaration. The SPI dep is now ONE snapshot (`universes(): { active, registry }`)
      so the active universe and the list validating it can never disagree.

- [x] **The gate is the core's decision, never the model's** (ADR 0009, and the two-vocabulary rule
      already built in `universe-reminder.mjs` → `profileCaptureOffer`): whatever emits the reminder
      must decide *below vs past the gate* deterministically and hand the skill the wording. Reuse
      `isMultiverse` / the existing vocabulary switch rather than growing a second one.
      _(2026-07-28)_ `isMultiverse` / `listAllUniverses` are re-declared in `local-mirror/src/lib/universe.ts`
      with the same semantics and a lock-step comment — the two packages cannot import across the
      language boundary, exactly as `DEFAULT_UNIVERSE` already was. **No second vocabulary**: the
      skill is told *whether* there was a choice, never asked to count.
  - [x] **Proposed shape for the confirmation, so it is core-enforced rather than honour-system:**
        past the gate, `setup_source` called **without** an explicit `universe` does **not pull** — it
        returns the deterministic preflight text (where it would land, the universes available, the
        re-embed cost of moving later). The pull happens on the second call, which now carries the
        universe. Below the gate, one call, no `universe`, and the word never appears. This makes "no
        pull before the message exists" a property of the core, and needs no `confirmed: true` flag
        (a flag the model can set itself would guard nothing, cf. D3's TTY reasoning).
        _(2026-07-28)_ Shipped as drafted, **plus a machine-readable half**: the result carries
        `awaitingUniverse: { active, universes }` next to the prose, so the driver reads a field
        instead of parsing a sentence. **Deviation, deliberate:** the preflight names the *active*
        universe as the pre-selection but does NOT pre-commit to it — the owner may answer
        `default` for a cross-cutting source, per the DECIDED box above.
  - [x] Validate a requested universe **against the registry** in the core: an unknown name is a
        refusal that lists the real ones, never a silently-created folder.
- [x] **First pull only, not refreshes.** A refresh must stay a one-liner; re-confirming it every time
      is how a useful confirmation becomes noise people click through. _(2026-07-28 · `b83b6b3`)_
      Pinned by a test: the universe is frozen in the config and `sync` never reads the universe
      state at all, so a refresh cannot ask.
- [x] Fleet constraints apply as ever: **F2** if this adds a top-level script (declare it by hand in
      `engine-manifest.json`), **F3** add verbs only, and the `local-mirror` skill's own `version:`
      bump so an untouched copy is refreshed on the fleet.
      _(2026-07-28)_ **F2 nothing to declare**: every new file is under `local-mirror/src/**`, already
      a `replace` glob. **F3 respected**: no new tool and no removed one, a single OPTIONAL argument
      added to `setup_source` (an old driver that omits it gets the preflight, which is the safe
      side). **Skill bumped** 1.0.0 → 1.1.0.
- [x] TDD as usual: pure core first, then the thin driver. The package is a back-end (MCP server), so
      it follows the Outside-in Diamond skill and its existing `src/test/` conventions (`builder.ts`,
      one behaviour per file). _(2026-07-28)_ Followed, including moving the two pre-existing universe
      tests out of `setup-source.test.ts` into `setup-source-universe.test.ts`, where the behaviour
      now lives. Hand mutation-check done (`b83b6b3`): two real gaps closed, one equivalent mutant
      answered in the code.

## Conventions reminder (repo rules)
- Artifacts in English (this file, code, commits, PR). TDD baby-steps, green-only commits. Deterministic
  core owns logic; skills are thin drivers (ADR 0009). Checkboxes on every step (this file). No em dashes.
- When a step is done: check `- [x]` and note _(date · commit)_.
