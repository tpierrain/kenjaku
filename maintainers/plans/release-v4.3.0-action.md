# Release v4.3.0 — a brain that stopped syncing, an upgrade that warns, and a mirror that can move

- **STATUS:** 🚧 IN PROGRESS — all four tracks are green locally; what remains is the
  `/code-review` Thomas asked for, then the merge and the tag.
- **Scope:** Second brain (runtime) — startup sync, engine update persistence, index-schema
  honesty, and a mirror's universe placement.
- **Branch:** `fix/pull-failure-says-why` · **PR:** <https://github.com/tpierrain/kenjaku/pull/50>
- **Why v4.3.0 and not v4.2.1:** the release was scoped as a patch until the mirror **move**
  joined it. Moving a mirror to another universe is a new capability, so semver says minor.
  The three additions all answer one question the owner asked: *"a brain that already has a
  local mirror takes this version — does its content end up in the right universe?"*

## Tracking

- [x] **Track 1 — the startup sync fix** (details below, all boxes ticked)
- [x] **Track A — an upgrade that warns about the reindex it owes** (§Track A) _(`a3943e9`)_
- [x] **Track B — a mirror re-declaration cannot silently duplicate a corpus** (§Track B) _(`5259851`)_
- [x] **Track C — a mirror can be MOVED to another universe** (§Track C) _(`9acc21f` → `3ca3c31`)_
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

- [x] **Re-declaring an existing mirror into a different universe is refused, loudly**, and the
      refusal names the supported route _(2026-07-28 · `5259851`)_
  - [x] Failing test first, in `local-mirror` (outside-in: through the `setupSource` API port).
        Seen red for the right reason (`ok` was `true`), then green.
  - [x] The refusal must say what to do instead. Once Track C lands, that is the **move**; until
        then it is `remove_source cleanup: true` + `setup_source`.
  - [x] Same-universe re-declaration (a token rotation, a widened scope) must keep working —
        the refusal targets a **change of universe** only. Held to its own test (§9: a condition
        with two reasons needs a test per reason), and the mutant `if (existing)` was applied by
        hand to prove that test discriminates.
  - [x] The refusal happens **before the connector is reached**: no token, no network call.
  - [x] The skill relays it (`engine-skills/local-mirror/SKILL.md` step 4, copy in `.claude/`
        kept in sync).
  - [x] 234 pass / 0 fail in `local-mirror`, `tsc --noEmit` clean, harness suite still 982/0.

## Track C — a mirror can be MOVED to another universe

- [x] **An owner can re-file an existing mirror into another universe**, files and config and
      sidecar together, with nothing left behind _(2026-07-28 · `9acc21f`, `dc37b7e`, `3ca3c31`)_
  - [x] **Surface decided: a dedicated `move_source` tool**, not a flag on `setup_source`. Why:
        the intent is different (re-file an existing corpus vs declare a new one), the guardrails
        are different (a move re-embeds; a declaration pulls), and a move must not have to
        re-supply the token and the root page it already knows.
  - [x] Amend **ADR 0034 in place** (CONVENTIONS §6bis/§6ter): point 5 now carries the rule — the
        universe stays frozen for the sync path, one deliberate local move changes it, and
        re-declaring is refused. Written timeless, no "we first did X" scar.
  - [x] Outside-in TDD in the `local-mirror` module, one acceptance test at a time, each seen red
        first: the move relocates every produced `.md`, restamps the `universe:` frontmatter,
        follows every tracked `vaultPath` **and hash** in the sidecar, and updates the config.
  - [x] **It is LOCAL** — read, rebuild, write, delete — so no token and no network: a mirror can
        be re-filed while the source is unreachable. The `IVaultWriter` port gained `read` for it.
  - [x] A moved page is **byte-identical to what a sync would write there**, so the next refresh
        rewrites nothing (proven by a test, and by hand-mutating the rebuild with one newline).
  - [x] The corpus is never at risk: writes all land **before** any delete, and a failure rolls
        the new copies back — the mirror is left exactly as it was, config and sidecar untouched.
  - [x] A universe nobody created is **refused**, as at declaration; an undeclared mirror too.
  - [x] Moving onto the universe it already lives in is a **no-op that keeps every page** (phase 2
        would otherwise delete the file phase 1 just wrote) — guard proven by a hand-applied mutant.
  - [x] Drive it from the `local-mirror` skill (Maintenance tools + trigger phrases + version
        1.2.0), which says what it costs, never moves on its own initiative, and stays silent
        below the disclosure gate. Copy in `.claude/` kept in sync.
  - [x] Mutation-checked: `markdown.ts` **100 %**, `local-mirror.ts` **96.16 %** with the single
        survivor inside this change killed afterwards (hand-verified). Recorded in
        [`../mutation/RESULTS.md`](../mutation/RESULTS.md).
  - [x] 245 pass / 0 fail in `local-mirror`, `tsc --noEmit` clean, harness suite 982/0.

## Cutting the release

- [x] ⚠️ **`/code-review` BEFORE the merge** — Thomas asked for it explicitly (2026-07-28), and he
      launched it. **8 findings, every one reproduced against the real code before being accepted.**
      They are the work list below.
- [ ] **Fix what the review raised** (each one TDD, red first, its own commit)
  - [x] **A move can DELETE the pages it was asked to re-file** (`local-mirror.ts` rollback). On a
        same-universe move the "landed" paths **are** the originals, so a phase-1 failure makes the
        rollback delete real notes — and the sidecar's matching hash then reports them `unchanged`
        forever. The no-op guard exists in phase 2 and is missing here. _(`f6e5772`)_
  - [x] **Phase 2 produces the half-move the design claims impossible** (`local-mirror.ts`). The old
        copies were deleted **before** the config was persisted, and an unwritable old page threw out
        of `moveSource` — so the caller never even got the reassuring `MoveResult`. Now: record the
        sidecar and the config FIRST, then best-effort deletes, and what the vault refuses to remove
        is **named in the message** as the leftover it is. The ordering is pinned by a test that
        FAILS under the old order (the builder gained `withUnwritableConfig`; the first version of
        that test passed both ways and was rewritten). _(`688ae0d`)_
  - [x] **A move races the background refresh** (`local-mirror.ts`). It now takes the same
        `syncLock` a sync takes, and refuses out loud while a refresh holds it. _(`9c41ea4`)_
  - [x] **An engine update commits conflict markers** (`engine-commit.mjs`). The rule now lives once
        in `treeState` (`repo-status.mjs`) and **all three** persistence paths read the tree through
        it — the sweep, the engine commit, and `auto-commit.mjs`, whose identical gap made SETUP's
        "nothing is committed for you" true only at session start. An update that walks away from a
        dirty tree now says so and names the resolve. _(`76d3a0a`)_
  - [x] **…and it claims "committed" when git refused** (`engine-commit.mjs`). The commit is only
        claimed when git took it; otherwise the report names the usual cause (no git identity) and
        says the files are staged and waiting. _(`cede198`)_
  - [x] **The fail-loud vault guard is blind to accented and spaced note names**
        (`repo-status.mjs`). Git quotes those paths (` M "vault/r\303\251union.md"`), so the
        `slice(3).startsWith("vault/")` test missed them. Measured on a real repo: **4 uncommitted
        notes, counted as 1.** Fixed by unquoting, and renames are read as the two paths they are
        (proven by a hand-applied mutant). _(`fd7ae79`)_
  - [ ] **A note whose body starts with `---` is written DESTROYED — at sync time**
        (`markdown.ts`). `matter.stringify` re-parses a string body, so a Notion page whose first
        block is a divider has its characters scattered into the frontmatter (`'0': r`, `'1': e`…)
        and its body emptied. **Pre-existing (v4.2.0), fixed here on purpose** (decided with Thomas,
        2026-07-28): it destroys content, it is cheap to fix, and the Track C move walks over its
        victims. Also: a missing key currently stringifies to the literal `undefined`
        (`source_url: undefined` → a dead citation), and any frontmatter key the engine does not know
        is silently dropped by the move's rebuild.
    - [ ] **⬅️ THE ONE STILL OPEN — resume here.** Reproduced with a probe against the real
          `toLocalMirrorMarkdown`: `matter.stringify(body, data)` treats a string body that starts
          with `---` as a file to PARSE, so the body's characters come back as `'0': r, '1': e, …`
          inside the frontmatter and the body is `"\n"`. Fix at the write path (build the
          frontmatter block instead of handing gray-matter a re-parseable string), then make
          `reuniverseLocalMirrorMarkdown` preserve unknown keys and refuse a note whose required
          frontmatter is missing rather than stringifying `undefined`. Byte-identity with what a
          sync writes is the constraint that must survive (there is already a test for it).
  - [x] **A guard whose name lies** (`mcp-tools.test.ts`): "exactly the **7** tools" asserted a list
        of 8. _(`84a5d87`)_
  - [ ] **After the last fix:** re-run the mutation snapshot on what changed (`repo-status.mjs`,
        `engine-commit.mjs`, `auto-commit.mjs`, `local-mirror.ts`, `markdown.ts`) and update
        [`../mutation/RESULTS.md`](../mutation/RESULTS.md) + the release-note figures below, which
        still quote the PRE-review numbers.
  - [ ] **Also update the PR #50 body**: it describes the four tracks but not the review fixes.
- [ ] merge the PR into `main` once tracks A, B and C are green (PR #50 grows to carry them, or
      each track lands as its own PR onto the same branch — decide when A is done)
  - [ ] tag + publish `v4.3.0`, title in the house style (`v4.3.0 — The One Where …`);
        draft titles on the table: *The One Where the Update Cleans Up After Itself*,
        *The One Where a Mirror Moves House*
  - [ ] the release note carries the mutation snapshot pinned to the tag
        (CONVENTIONS §5ter): `engine-commit.mjs` **100 %**, `startup-sync.mjs` **100 %**,
        `repo-status.mjs` **98.21 %**, plus whatever tracks A/B/C touch
  - [x] **the marketing-surface pass re-done for the minor scope** (CONVENTIONS §10) _(2026-07-28)_.
        It had been recorded as done for the patch scope; tracks A and C changed what an upgrade and
        a mirror promise, so the whole surface was re-read. Verdict, boring parts included:
    - [x] **Made imprecise → fixed.** `CONNECTORS.md` and `SETUP.md §(d)` both explained the
          ask-first-about-the-universe rule with *"moving a mirror afterwards re-encodes every page"*
          — which read as *there is no way back*. There is one now: both gained the **move** (local,
          no re-download, next refresh rewrites nothing, the re-encode is the whole cost) and the
          fact that re-**declaring** into another universe is **refused**, not silently duplicated.
          The `/local-mirror` verb list gained `move`.
    - [x] **Made truer → said.** `README` sold *"every change auto-committed the instant it's
          written"*, which was a half-truth for notes typed in Obsidian outside the brain (the very
          gap ADR 0011 had accepted). The SessionStart sweep closes it, so the sentence now says it:
          *"…and whatever you typed straight into Obsidian is swept in at its next start."*
    - [x] **Re-read, still true, nothing to change:** `EN-QUOI §"never a silent reindex"` (about the
          embedder swap — track A extends the same honesty to a schema bump, it does not contradict
          it) · `README` *"an upgrade touches only the engine machinery, never your notes"* and
          SETUP §10 *"Sacred by construction"* (a reindex re-embeds, and step 9 commits — neither
          writes a note) · SETUP §10 step 6 *"reindexes only if `indexSchemaVersion` changed"*, which
          track A finally makes operative rather than theoretical.
    - [x] **Boards re-read through their alt texts and their source prompts** — the only mirror copy
          is the skills board's tile (*"mirror a Notion zone locally, searchable offline"*), still
          exactly true; no board asserts anything about a mirror's universe or an update's reindex.
          **No re-render.**
  - [x] **PR #50's title and body rewritten to the v4.3.0 scope** _(2026-07-28)_: they described
        track 1 only, so the PR was advertising a patch while carrying a minor.
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
