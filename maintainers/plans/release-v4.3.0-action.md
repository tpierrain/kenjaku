# Release v4.3.0 — a brain that stopped syncing, an upgrade that warns, and a mirror that can move

- **STATUS:** 🚧 IN PROGRESS — track 1 (the sync fix) is merged-ready (PR #50, CI fully green);
  tracks A/B/C opened 2026-07-28 and not started.
- **Scope:** Second brain (runtime) — startup sync, engine update persistence, index-schema
  honesty, and a mirror's universe placement.
- **Branch:** `fix/pull-failure-says-why` · **PR:** <https://github.com/tpierrain/kenjaku/pull/50>
- **Why v4.3.0 and not v4.2.1:** the release was scoped as a patch until the mirror **move**
  joined it. Moving a mirror to another universe is a new capability, so semver says minor.
  The three additions all answer one question the owner asked: *"a brain that already has a
  local mirror takes this version — does its content end up in the right universe?"*

## Tracking

- [x] **Track 1 — the startup sync fix** (details below, all boxes ticked)
- [ ] **Track A — an upgrade that warns about the reindex it owes** (§Track A)
- [ ] **Track B — a mirror re-declaration cannot silently duplicate a corpus** (§Track B)
- [ ] **Track C — a mirror can be MOVED to another universe** (§Track C)
- [ ] **Cut the release** (§Cutting the release)

## Track 1 — the startup sync fix (shipped into the branch)

- [x] **The startup banner says WHY a pull failed**, instead of a dead-end "check manually"
      _(2026-07-28 · `6a2f372`)_
- [x] **An engine update commits what it wrote**, so a brain never silently stops syncing
      _(2026-07-28 · `3fa8ad5`)_
- [x] **The persistence model in SETUP tells the truth** (a third writer exists, and the owner
      sees its commit) _(2026-07-28 · `e9e854b`)_
- [x] **The two touched files are mutation-clean** (98.53 %) _(2026-07-28 · `6293770`)_
- [x] CI matrix fully green (macOS + Windows × Node 22/24/26 + installer e2e)
- [x] **The commit-if-dirty moved into the SessionStart hook** _(2026-07-28 · `78db772` + `d8991b6`)_
  - [x] Why: step 9 lives in `update-engine.mjs`, which is **not** a hook. It runs once, replacing
        itself mid-flight while the in-flight process keeps the OLD code in memory — so the update
        that *installs* the fix still leaves the repo dirty, and only the update *after* it commits.
        The very hole this release claims to close is re-opened one last time on every brain.
  - [x] Fix: `sweepThenPull` (`scripts/lib/startup-sync.mjs`) commits before the `git pull --rebase`
        in the SessionStart path. A hook is a fresh node process each time, reading the `.mjs` off
        disk → active at the **first restart after the update**, the installing update included.
  - [x] This was the remedy ADR 0011 held in reserve, so it also closes the Obsidian-edit gap that
        ADR documented as accepted. 0011 amended (gap now **closed**); **step 9 stays** — it names
        the version in an intent-bearing commit, the sweep is the belt under that suspender.
  - [x] Found on the way, and fixed: a blind sweep would **bury conflict markers** in a note and
        fake-resolve a stopped rebase. An unmerged tree is now left untouched, and the banner asks
        the human to resolve instead of advising a commit (`countUnmerged` + its banner line). The
        uncommitted-notes alert stopped accusing silent hooks: it is printed **by** a hook that just
        tried to commit, so it now names a git that refused.
  - [x] Mutation (narrowed, same blocker as the follow-up below): `startup-sync.mjs` **100 %**,
        `repo-status.mjs` **98.21 %** — sole survivor = the `pullOut ?? ""` equivalent already
        accepted. Recorded in [`../mutation/RESULTS.md`](../mutation/RESULTS.md).
- [x] ✅ **The hold is lifted (2026-07-28).** The question that held the merge — *what happens to
      an already-installed local mirror on a brain that takes the universe-aware version* — was
      answered by reading the code and inspecting `~/mind-palace` (read-only). Findings below;
      they became tracks A, B and C, which now ship in the same release.

## What the universes × local-mirror check found (2026-07-28)

- **On `~/mind-palace` the question is moot: it has no mirror.** No `local-mirror.config.json`,
  no `.local-mirror/` sidecar, no `vault/mirrors/`; `NOTION_TOKEN_PASC` and
  `LOCAL_MIRROR_SYNC_INTERVAL` are commented out in its `.env`. The MCP server is wired in
  `.mcp.json`, but no source was ever declared. It does carry **two created universes**
  (`inqom`, `shodo`, active `inqom`) and a `vault/inqom/` subtree. Engine: `rag 1.1.5`,
  `local-mirror 0.2.0`, `scripts 1.7.0` (launcher: `1.8.0`). Its `.vault-rag/index.db` is
  **0 bytes**, so its index is empty anyway.
- **A pre-existing mirror is never relocated, and that is by design.** `universe` is optional in
  the mirror config (`local-mirror/src/domain/types.ts:32-37`): absent means the default universe,
  which lands at the vault root (`vault/mirrors/<name>/`). The mirror keeps syncing to the same
  folder and its notes index as `default`. Nothing breaks: the default scope is OR'd into every
  search (ADR 0034 §1), so the corpus stays reachable from every universe.
- **But "reachable everywhere" is the wrong shape for an employer's Notion.** It stays
  cross-cutting instead of being scoped, so it dilutes every other universe's results. That is the
  "badly filed" case the owner asked about, and there is **no move path**: the universe is frozen
  at declaration (`local-mirror/src/domain/local-mirror.ts:90` — *moving a mirror afterwards costs
  a full re-embed*), and the move was never written. → **Track C.**
- **The natural workaround silently duplicates the corpus.** Re-calling `setup_source` with the
  same name and a universe replaces the config (`fs-config-store.ts:24-30`, upsert by name) and
  the next sync writes under `vault/<universe>/mirrors/<name>/` — while deletion reconciliation
  only removes pages that left the **Notion** perimeter (`pagesToDelete` compares ids), so the old
  files stay on disk, indexed, frozen forever. → **Track B.**
- **The upgrade itself has a separate, already-recorded hole.** `INDEX_SCHEMA_VERSION = 2`
  (`rag/src/lib/vector-store.ts:63`, moved by the universes commit `3d85060`) but
  `engine-manifest.json` still declares `"indexSchemaVersion": 1`, and that manifest pair is what
  `reindex-trigger.mjs:15` compares → `update-engine` neither reindexes nor warns; the owner
  discovers it at their **first search** after upgrading. → **Track A.**

## Track A — an upgrade that warns about the reindex it owes

- [x] **An engine update announces the reindex a schema bump forces**, instead of letting the
      first search discover it _(2026-07-28 · `a3943e9`)_
  - [x] The decision that was left open (`prospective/engine-managed-file-merge-strategy.md`
        §Side-finding) is settled here: **bump the manifest**. The argument that settles it is that
        bumping **adds no reindex** — a stamped-`1` brain is force-reindexed either way by the
        runtime gate (`index.ts:90` → `reindexForce`). It only moves the moment from "at the first
        question, as a refusal to answer" to "during the update, announced". Same cost, honest.
  - [x] Failing test first: an integrity test that reads `engine-manifest.json` and the RAG's
        `INDEX_SCHEMA_VERSION` and **fails when they diverge** — the guard whose absence let this
        drift for a whole release. Seen red for the right reason (`1 !== 2`), then green.
  - [x] Then bump `engine-manifest.json` to `"indexSchemaVersion": 2`. **No new code**: the honest
        line (`update-engine.mjs:95-99`, *"reindexed — the index format changed"*) was already
        written and tested; it simply never fired while the two manifests agreed.
  - [x] Align the prose that claimed this already worked: ADR 0034 §Consequences, the ROADMAP
        correction paragraph (now ✅ Closed), and the §Side-finding decision box in
        `prospective/engine-managed-file-merge-strategy.md`.
  - [x] Mutation-check: **nothing to measure** — the change is one manifest value plus one test;
        no production branch was added. Recorded rather than run, per CONVENTIONS §5ter's rule
        that a hardening claim names what was measured.
  - [x] Harness suite green: 982 pass / 0 fail / 1 skipped (Windows-only).

## Track B — a mirror re-declaration cannot silently duplicate a corpus

- [ ] **Re-declaring an existing mirror into a different universe is refused, loudly**, and the
      refusal names the supported route
  - [ ] Failing test first, in `local-mirror` (outside-in: through the `setupSource` API port).
  - [ ] The refusal must say what to do instead. Once Track C lands, that is the **move**; until
        then it is `remove_source cleanup: true` + `setup_source`.
  - [ ] Same-universe re-declaration (a token rotation, a widened scope) must keep working —
        the refusal targets a **change of universe** only.

## Track C — a mirror can be MOVED to another universe

- [ ] **An owner can re-file an existing mirror into another universe**, files and config and
      sidecar together, with nothing left behind
  - [ ] Decide the surface before coding: a dedicated MCP tool (`move_source`) vs a flag on
        `setup_source`. Write the choice into the plan with its reason.
  - [ ] Amend **ADR 0034 in place** (CONVENTIONS §6bis/§6ter): the universe is still frozen at
        declaration for the **sync** path, but a deliberate move now exists; say what it costs
        (a full re-embed of that mirror's notes) and why that price is acceptable when it is
        asked for explicitly.
  - [ ] Outside-in TDD in the `local-mirror` module: the move relocates every produced `.md`,
        rewrites the `universe:` frontmatter, updates each tracked `vaultPath` in the state
        sidecar, updates the config, and removes the now-empty old folder.
  - [ ] The corpus is never at risk: a failed move must leave the mirror consistent (either the
        old placement or the new one, never half of each).
  - [ ] Drive it from the `local-mirror` skill in the owner's own words, and keep the
        progressive-disclosure gate: below two universes the word never appears.
  - [ ] Mutation-check the touched files.

## Cutting the release

- [ ] merge the PR into `main` once tracks A, B and C are green (PR #50 grows to carry them, or
      each track lands as its own PR onto the same branch — decide when A is done)
  - [ ] tag + publish `v4.3.0`, title in the house style (`v4.3.0 — The One Where …`);
        draft titles on the table: *The One Where the Update Cleans Up After Itself*,
        *The One Where a Mirror Moves House*
  - [ ] the release note carries the mutation snapshot pinned to the tag
        (CONVENTIONS §5ter): `engine-commit.mjs` **100 %**, `startup-sync.mjs` **100 %**,
        `repo-status.mjs` **98.21 %**, plus whatever tracks A/B/C touch
  - [ ] **the marketing-surface pass must be re-done** (CONVENTIONS §10): it was recorded as done
        for the patch scope, but tracks A and C change what an upgrade and a mirror promise —
        re-read before tagging
- [ ] **Unblock Thomas's own brain** (`~/mind-palace`) — he asked for nothing to be touched
      while this was in flight
  - [ ] its 3 engine files from the 2026-07-25 update are still uncommitted, so every
        startup pull has failed since; one `git add -A && git commit` clears it
  - [x] ✅ the caveat that used to sit here is **gone**: step 9 alone did not self-apply on the
        update that installs it (the running process is the OLD `update-engine.mjs`), which is
        precisely why the sweep moved into the SessionStart hook. Now the **first restart after
        the update** commits those files by itself — no hand-commit needed on any brain.
- [ ] **Archive this plan** on ship (CONVENTIONS §7) + drop the memory pointer

## Follow-up found on the way (not this release)

- [ ] `npm --prefix maintainers/mutation run mutate:scripts` **cannot run at all** any more: it
      fails its dry run because `engine-manifest-integrity.test.mjs` asks `git ls-files` and the
      Stryker sandbox copy has no `.git` → every manifest glob reads as dead. Until that test
      tolerates a repo-less checkout, the harness package can only be measured file-by-file with a
      narrowed command. Detail in [`../mutation/RESULTS.md`](../mutation/RESULTS.md) (PR 50 section).
