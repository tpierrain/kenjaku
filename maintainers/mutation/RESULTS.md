# Mutation testing — audit results (StrykerJS)

> **Dev-only.** This whole folder lives under `maintainers/` and is **excluded from the
> brain copy** (`scripts/lib/tracked-files.mjs` → `DEV_ONLY_PREFIXES` has `maintainers/`),
> so neither the tooling nor these results are ever deployed into a generated brain.
> See the plan: [`../plans/prospective/mutation-testing-stryker.md`](../plans/prospective/mutation-testing-stryker.md).
> For **what the survivors taught us** (recurring shapes → durable rules), see the
> retrospective: [`RETROSPECTIVE.md`](RETROSPECTIVE.md).

> 📈 **Sections are ordered newest-first (anti-chronological).** The top block is the current
> state; scroll down for the history back to the 2026-06-23 baseline.

## Current scores (latest)

| Package | Mutation score | As of | Detail |
|---|---|---|---|
| **rag** | **90.42 %** | 2026-07-16 (post-B2/B3) | [re-audit #2](#full-rag-re-audit-2--2026-07-16-post-b2b3-hardening) — production-only. Not re-measured package-wide since; the [v4.4.0 targeted run](#v440--the-field-fixes-release-rag--scripts--2026-07-28--2026-08-02) over the 10 files that release changed reads **93.93 %**, with its two new files at **100 %**. The [v4.5.0 run](#v450--the-silence-stops-passing-release-rag--scripts--2026-08-03) over its 6 changed files reads **94.67 %**, with the file it creates at **100 %** |
| **scripts** (harness) | **97.27 %** | 2026-06-23 baseline | 3 weak files since hardened to 92–100 % (no full re-audit; `lib/**` already 100 %). The three files audited on [2026-07-27](#increment-25-engine-skill-refresh--step-10--2026-07-27) are now hardened too: `update-engine.mjs` **98.49 %**, `reconcile-brain.mjs` **96.45 %**, `engine-source.mjs` **93.02 %** (every survivor killed or recorded as equivalent). The four files touched on [2026-07-28](#v430-the-harness-side-of-the-review-fixes--2026-07-28) were measured the same way, after the review fixes: `engine-commit.mjs` **100 %**, `startup-sync.mjs` **100 %**, `repo-status.mjs` **97.44 %**, `auto-commit.mjs` **98.04 %** (98.37 % together, every survivor an accepted equivalent). ⚠️ **The baseline flatters the package**: the [v4.4.0 run](#v440--the-field-fixes-release-rag--scripts--2026-07-28--2026-08-02) measured 16 files one by one and found **two at 0 %** — `session-status.mjs` and `status-line.mjs`, top-level scripts no test can import. **[Named debt](#the-two-0--files--named-debt-and-not-a-regression)**, carried by every published tag. The [v4.5.0 run](#v450--the-silence-stops-passing-release-rag--scripts--2026-08-03) measured 15 more files one by one: **seven of them end at 100 %, twelve of the fifteen at 92 % or above**, and the three `session-*` scripts confirm the same top-level tier (`session-status.mjs` still **0 %**, inherited rather than new) |
| **local-mirror** | **90.44 %** | 2026-07-28 (v4.2.0) | [re-audit](#full-local-mirror-re-audit--2026-07-28-v420) — +336 mutants since the 95.63 % below (auto-refresh growth); this release's own survivors were found and killed before tagging. The two files v4.3.0 touched were re-measured [after the review fixes](#v430-after-the-review-fixes--2026-07-28): `markdown.ts` **100 %**, `local-mirror.ts` **96.86 %**. **v4.4.0 touches no `src/**` file here — the number carries over, deliberately not re-measured** |

Pinned to the release that ships the hardened tests: **v3.4.2** (local-mirror pinned at 78.69 % there —
its tag-time snapshot; the B4 + optional-weak-tier gains below land in `main` after v3.4.2).
**local-mirror's 90.44 % is pinned to v4.2.0** — a published tag is frozen, so that number stays true
for it forever, debt table included.

## Visual overview (scores at a glance)

> Bars use a **zoomed 70 → 100 % axis** (everything is already ≥ 71 %, so a full 0–100 axis would
> flatten the differences). The exact number carries the precision; the bar carries the gestalt.

**The three engine packages:**

```
scripts       97.27 %  ██████████████████░░
rag           90.42 %  ██████████████░░░░░░
local-mirror  90.44 %  ██████████████░░░░░░
                       └──────────────────┘  70 ──────────► 100 %
```

**Distribution of the 41 re-audited production files** (rag 24 + local-mirror 17; scripts counted
separately — 97.27 %, `lib/**` all 100 %, 3 side-effect scripts at 92–100 %. ⚠️ That last figure is the
2026-06-23 photo of **three** top-level scripts; the 2026-08-02 run measured 16 of them and the
top-level tier reaches **down to 0 %** — see the [named debt](#the-two-0--files--named-debt-and-not-a-regression)):

```
🟢 100 %      ███████████  11 files   (perfect — 0 survivor)
🟢 95–99 %    ████          4 files
🟡 90–95 %    █████████     9 files
🟠 80–90 %    ███████████████  15 files
🔴 < 80 %     ██            2 files   (rag: search-degradation, reindex-scheduler)
```

### rag — by subject

```
Indexing & chunking
  document-scanner       100.00 %  ████████████████████
  vault-watcher          100.00 %  ████████████████████
  frontmatter-parser      97.62 %  ██████████████████░░
  index-manager           94.87 %  █████████████████░░░
  indexer                 94.44 %  ████████████████░░░░
  chunker                 85.88 %  ███████████░░░░░░░░░

Embedders  (⚠️ lowest tier)
  openai-compatible        84.00 %  █████████░░░░░░░░░░░
  in-process-embedder      82.61 %  ████████░░░░░░░░░░░░
  embedder                 81.98 %  ████████░░░░░░░░░░░░

Vector store & search
  vector-store            92.47 %  ███████████████░░░░░
  search-degradation      71.43 %  █░░░░░░░░░░░░░░░░░░░  🔴

Reindex & freshness
  reindex-lock            94.52 %  ████████████████░░░░
  reindex-reporter        83.64 %  █████████░░░░░░░░░░░
  index-freshness         81.13 %  ███████░░░░░░░░░░░░░
  reindex-scheduler       74.19 %  ███░░░░░░░░░░░░░░░░░  🔴

Health, status & usage
  status-report          100.00 %  ████████████████████
  usage-tracker           92.65 %  ███████████████░░░░░
  health-check            92.31 %  ███████████████░░░░░
  notify                  90.91 %  ██████████████░░░░░░
  progress-report         88.52 %  ████████████░░░░░░░░

Citations / config / version / deps
  citation-renderer      100.00 %  ████████████████████
  native-deps            100.00 %  ████████████████████
  config                  86.67 %  ███████████░░░░░░░░░
  engine-version          84.44 %  ██████████░░░░░░░░░░
```

### local-mirror — by Hive layer

> 📌 **These bars are the 2026-07-16 photo** (17 files, aggregate 95.63 %), kept as the last
> by-layer view. The package has since grown to 26 mutated files at **90.44 %** — for the current
> per-file state, read the [v4.2.0 re-audit](#full-local-mirror-re-audit--2026-07-28-v420) table below.

```
Domain
  reconcile              100.00 %  ████████████████████
  local-mirror            98.52 %  ███████████████████░

Adapters
  system-clock           100.00 %  ████████████████████
  notion-gateway          97.44 %  ██████████████████░░
  fs-config-store         93.75 %  ████████████████░░░░
  fs-vault-writer         87.50 %  ████████████░░░░░░░░
  notion-connector        85.29 %  ██████████░░░░░░░░░░
  fs-state-store          81.82 %  ████████░░░░░░░░░░░░

Lib
  markdown               100.00 %  ████████████████████
  config      (B4)       100.00 %  ████████████████████ ⭐
  fresh-env   (B4)       100.00 %  ████████████████████ ⭐
  notion-url              97.87 %  ███████████████████░
  notion-transformers     94.87 %  █████████████████░░░
  strip-volatile-urls     89.19 %  █████████████░░░░░░░
  content-hash            80.00 %  ███████░░░░░░░░░░░░░

Entry / MCP
  index                  100.00 %  ████████████████████
  server                  85.71 %  ██████████░░░░░░░░░░
```

### scripts (harness)

```
  scripts/lib/**         100.00 %  ████████████████████
  clear-example-notes    100.00 %  ████████████████████
  auto-commit             98.21 %  ███████████████████░
  auto-push               92.39 %  ███████████████░░░░░
```

**Reading it.** ⭐ B4 took local-mirror's `config.ts` + `fresh-env.ts` to 100 %, lifting the package
aggregate from 78.69 % to 95.63 %. The realistic ceiling on hardened files is **~96 %**: the remaining
survivors there are **documented equivalent mutants** (unkillable without touching prod for nothing) →
"effective 100 %" on non-equivalents. The lowest never-hardened tiers, the natural next "B5" targets,
are rag's **embedders** (~82 %) and `search-degradation` / `reindex-scheduler` / `index-freshness`, plus
local-mirror's `fs-state-store` and `content-hash`.

---

## v4.5.0 — the silence-stops-passing release (`rag` + `scripts`) — 2026-08-03

**Scope decided on the diff** (`main...release/v4.5.0`): the targeted run §5ter prescribes before a
tag, **not** a full re-audit. 23 production files changed — 8 under `rag/src`, 15 under `scripts/` —
and the two packages that own them ran.

**`local-mirror` did not run, deliberately** — this release touches no `local-mirror/src/**` file, so
its **90.44 %** from v4.2.0 carries over unchanged. Re-measuring an untouched package would move a
number with no change behind it.

### `rag` — the 6 files under `src/lib/`: **93.81 % → 94.67 %**

`citation-renderer`, `frontmatter-parser`, `health-check`, `index-crosscheck`, `index-crosscheck-scan`,
`vector-store` — `stryker.rag.config.mjs` narrowed with `--mutate` to those six. (`crosscheck-cli.ts`
and `health-check-cli.ts` are **not** under `src/lib/`, so the config never matched them: same
boot-seam class as the top-level `scripts/*.mjs`, and named as debt below rather than left implied.)

| File | First run | At the tag | |
|---|---|---|---|
| `index-crosscheck-scan.ts` | 70.59 % | **100 %** | created by this release, and the worst of the six |
| `health-check.ts` | — | **90.00 %** | its 3 singular-branch mutants killed; 15 survivors left, all pre-existing `catch {}` / default-init shapes |
| `citation-renderer.ts` | — | **100 %** | |
| `index-crosscheck.ts` | — | 98.77 % | 1 survivor, a recorded equivalent |
| `frontmatter-parser.ts` | — | 97.87 % | |
| `vector-store.ts` | — | 92.50 % | untouched by this release |

**The file this release created scored worst, and the reason is the interesting part.** All five
survivors of `index-crosscheck-scan.ts` sat in `defaultScanPorts` — every existing test injects its own
ports, so the **default wiring was observed by nothing**. One of them, `parse: () => {}`, is exactly the
failure this release exists to prevent: the vault ↔ index crosscheck stops reporting damaged notes,
permanently, with the suite green. The file's own comment swore those defaults are the engine's real
parser, scanner and reader — a comment is not a claim. Three tests now aim at the survivors (the real
parser throws on the payload found in the field and stays quiet on a healthy note; `readFile` returns
the exact UTF-8 string, asserted whole, because a loose `/Réunion/` passes on the wrong encoding; `scan`
hands back the engine scanner's shape). **17/17 killed.**

**`health-check.ts`'s singular branch was a guess.** `outOfStep.length === 1` was never exercised, so
both ternaries could be dropped green and the owner would read *"1 notes … — e.g. `<the only note there
is>`"*. One boundary test kills all three. The 15 that remain are `catch {}` bodies and default
initialisers that predate this release; two of them are **recorded equivalents, not gaps** — `if
(seams.crosscheck)` → `if (true)` throws a `TypeError` the enclosing catch swallows into the same
`null`, and `catch { x = null }` → `catch {}` lands on the declaration's own value. Both behaviours
*are* tested (`health-check.test.ts:451` and `:481`); the mutants are indistinguishable from the
original, which is the definition.

### `scripts` — the 15 changed files, in six batches

Run in a **disposable worktree** (`inPlace` is destructive) at `/Users/tpierrain/Dev/kenjaku-mut-v450`,
reset between batches. Per file, because a batch aggregate over a different subset each time is
arithmetic, not a measurement.

| File | First run | At the tag | |
|---|---|---|---|
| `lib/brain-rehydrate.mjs` | **100 %** | **100 %** | created by this release |
| `open-note.mjs` | **100 %** | **100 %** | |
| `lib/staged-health-note.mjs` | **100 %** | **100 %** | |
| `lib/rag-launcher.mjs` | 89.32 % | **100 %** | |
| `lib/health-probe.mjs` | 71.83 % | **100 %** | |
| `rag-status.mjs` | 86.79 % | **100 %** | |
| `lib/vault-write-guard.mjs` | 85.16 % | **98.45 %** | 2 survivors, both recorded equivalents |
| `lib/universe-profile.mjs` | 87.89 % | **97.37 %** | 5 survivors, all recorded equivalents |
| `lib/universe-reminder.mjs` | 94.44 % | **100 %** | |
| `verify-index.mjs` | 40.54 % | **92.31 %** | 3 survivors — the shared entrypoint guard, below |
| `rehydrate.mjs` | 90.80 % | **95.40 %** | created by this release; the 4 left are the shared entrypoint guard |
| `vault-write-guard.mjs` (the hook) | 50.00 % | **95.83 %** | created by this release; the 1 left is a recorded equivalent |

**`verify-index.mjs` at 40.54 % was the finding of the pass, and filing it as debt would have been a
habit rather than a measurement.** All 22 survivors were boot/IO wiring — the real `spawnSync`, the real
dependency object, the entrypoint guard — the shape our own conventions call *a design defect, not an
exemption*. **19 of the 22 died to the fix that had just worked on `index-crosscheck-scan.ts`**: what
the spawn asks the OS for is a pure value, so it is one now (`buildCrosscheckInvocation` returns
`{command, args, options}`, asserted **whole** on both platforms — win32 fed on purpose, since CI runs
macOS and nothing else tells the `.cmd` branch from the identity function).

**The 3 that remain are package-wide, not this file's debt.** `if (isEntrypoint(…))` → `if (false)`, its
empty block, and `process.argv.slice(2)` → `process.argv` (that last one has a real behaviour behind it:
the engine CLI would receive node's own argv). **10+ scripts carry the identical three-mutant guard**,
so the honest fix is one shared `runAsEntrypoint(meta, argv, fn)` tested once — a **v4.6.0 candidate**,
deliberately not done on the eve of a tag.

**What the other survivors were, by family** — the same two that the 2026-07 audit named, which is why
they are worth writing down again rather than merely fixing:

- **Loose assertions** (`rag-status.mjs`, `health-probe.mjs`): the separator could become `""`, the
  remedy sentence — the only part telling the owner *this will not fix itself* — could vanish, and the
  whole core-⚠️ / optional-ℹ️ severity split could be dropped, with every `assert.match` still green. The
  banner lines are asserted whole now.
- **Branches nothing ever fed**: the boundary where the truncation flips (exactly two failures — nothing
  distinguished `rest > 0` from `rest >= 0`, i.e. the owner reading `(+0 other(s))`), the failure lookup
  with `lastRun` missing (which is precisely a freshly rehydrated machine), the embedder's network/key
  gesture (the one an API user actually gets, while the suite only ever tested local weights), and the
  win32 install-script writer (a platform-conditioned transformation that is a no-op on the CI platform).

**Two survivors said something serious, and neither was a loose assertion.** In
`lib/vault-write-guard.mjs`, the guard resolved gray-matter from a path built inline, and **moving that
anchor one folder up left the suite green** — nothing proved the guard runs *the engine's* parser rather
than whatever Node finds walking the parent chain, which is the exact fiction this release's guard was
written to prevent. `engineRequireAnchor` names it now. In `lib/universe-profile.mjs`, half the survivors
existed because **the fs fake swallowed what it was handed**: `mkdirSync` recorded nothing, so "create
the parent, recursively" and "create nothing" were the same call.

**Recorded equivalents — do not chase them.** Each was written down *before* the confirming run, which is
what makes it an equivalence rather than an excuse: `toolInput?.content` and the twin term of
`typeof oldString !== "string"` (both unreachable — `relPath` is already non-null there, and the other
term refuses the same input); `parsed?.declined` and `other: []` (both paths end in the same empty array,
and `other` is never emitted); and three heading-regex mutants the downstream `.trim()` neutralises.

### The three session scripts — named debt, and not a regression

`session-status.mjs` **0.00 %** (131 mutants, none killed), `session-universe.mjs` **39.39 %**,
`session-self-heal.mjs` **36.62 %**. They are top-level scripts that **run on import**, so no test can
observe them — verified, not assumed: none has ever had a test file in this repo's history. The
**logic** they wire is covered (it lives in `scripts/lib/**`: `rag-status.mjs` 100 %, `health-probe.mjs`
100 %, `universe-reminder.mjs` 100 %, `universe-profile.mjs` 97.37 %); the **wiring** is not. This
release edits parts of them **without creating the hole** — every published tag so far carries it — and
the cure our own conventions prescribe is a refactor of fleet-deployed session scripts, which is a
release of its own rather than something to do on the eve of a tag. `session-status.mjs` was already
recorded at 0 % at [v4.4.0](#v440--the-field-fixes-release-rag--scripts--2026-07-28--2026-08-02): the
number is **inherited, not new**.

**What this release did do about that tier, on the two files it created as entry points.** Batch 3a
measured `rehydrate.mjs` at 90.80 % and the `vault-write-guard.mjs` **hook** at 50.00 %, and both sat on
the same shape as `verify-index.mjs`: every test injects its own deps, so the **real** ones — the parser
that must be *the engine's*, the stdin read, the single line the harness parses — were observed by
nothing, and a mis-wire there passes the whole suite while blocking nothing. Fixed rather than filed
(`25beef3`), each mutant hand-applied and watched red: the spawn options asserted **whole**
(`stdio: "inherit"` is what lets the owner watch a multi-minute install), the rebuilt `.mcp.json`
asserted to end with a newline (a JSON file without one is still valid JSON, so the parsed assertion
could not see it), the write-through-missing-parents test digging **two** levels (with one, a
non-recursive `mkdir` succeeds too), `realGuardDeps` pinned field by field, and **the hook run once the
way the harness runs it** — a real child process, the JSON on its stdin, the decision on its stdout,
which is the only test that reaches both the stdin read and the entrypoint guard.

Two of those assertions need `rag/node_modules`, absent in CI's harness step (whose invariant is "nothing
to install"), so they **skip** there and `ci.yml` re-runs the file after `npm ci` — and that re-run is
**pinned from the suite itself**, exactly like its sibling in `lib/`: deleting the step goes red instead
of going quiet.

**And the re-measure of that fix found the fix's own defect — a new shape, worth the name.** The skip
condition asked `realGuardDeps.parser(BRAIN_ROOT) === null`, i.e. **the very wiring the two tests exist
to judge**. Mutate `parser` to always return `null` and the condition reads "engine absent" → both tests
**turn themselves off** → the mutant survives with the suite green. It is the fixture rule (§7 of the TDD
discipline) one level up: *a test must never take its verdict — nor its right to run — from the thing it
is testing*. The condition asks the disk now (`existsSync(rag/node_modules/gray-matter)`), and the mutant
dies. Recorded because a self-disarming skip is invisible to everything except a mutation run.

### Method notes earned this time

- **A batch of five files is ~546 mutants ≈ 13 min, over the 10-min background cap** — and a killed run
  leaves Stryker's instrumentation in the worktree. **One or two files per run** (~125 mutants ≈ 6 min),
  and reset with `git reset --hard` + `git clean -fd` between batches — **never `git checkout -- .`**,
  since a mutant of `auto-commit.mjs` can commit the instrumented tree.
- **`rag/node_modules` must be symlinked into the worktree** before running, or
  `vault-write-guard.test.mjs`'s four parser assertions **skip** there and its mutants face a suite that
  cannot judge them — measuring exactly the fiction the guard is about. Verified before starting: 9 pass,
  0 skipped, in the worktree.
- **Hardening claims name the files measured.** Every score above comes from a log in
  [`reports/`](reports/) (`v450-*.log`), and every "→" is a re-run, not an estimate. One figure in the
  working plan (`health-check.ts` at 92.67 %) had no log behind it and was corrected down to the measured
  **90.00 %** rather than published.

## v4.4.0 — the field-fixes release (`rag` + `scripts`) — 2026-07-28 → 2026-08-02

**Scope decided on the diff** (`main...HEAD`, branch `feat/v4.4.0-field-fixes`): the targeted run
§5ter prescribes before a tag, **not** a full re-audit. Two packages ran.

**`local-mirror` did not run, deliberately** — this release touches no `local-mirror/src/**` file, so
its **90.44 %** from v4.2.0 carries over unchanged. A published tag is frozen; re-measuring an
untouched package would move a number without a change behind it.

### `rag` — the 10 changed files: **90.39 % → 93.93 %**

`campaign-persist`, `campaign-run`, `config`, `engine-version`, `frontmatter-parser`, `index-manager`,
`persistence-scheduler`, `progress-report`, `reindex-reporter`, `vault-watcher` — the
`stryker.rag.config.mjs` run narrowed with `--mutate` to those ten paths.

**First run: 90.39 %** (562 mutants, 54 survivors) — and **the aggregate hid the problem**. Read
per file, the weakest of the ten was `persistence-scheduler.ts`, at **76.32 %**: the file this release
*adds*. **20 of the 54 survivors sat on lines this branch wrote**; the other 34 predate it.

| File | First run | After | What moved |
|---|---|---|---|
| `persistence-scheduler.ts` | 76.32 % | **100 %** | new in this release, and the worst score of the ten |
| `campaign-run.ts` | 86.96 % | **100 %** | new in this release |
| `frontmatter-parser.ts` | 95.07 % | **97.87 %** | |
| `progress-report.ts` | 89.61 % | **93.51 %** | |
| `engine-version.ts` | 81.63 % | **83.67 %** | the one left is a recorded equivalent |

**18 of the 20 killed** _(`bebce0c`, `474d09a`)_, each mutant hand-applied and **watched red** before
the fix, then reverted; rag **454** green. **2 recorded as equivalents** (below). The confirmation
re-run over the same ten files then read **93.93 %**, and its 34 remaining survivors were checked
line by line against `git diff main...HEAD`: **nothing of this release's own is left standing.**

### `scripts` — the 16 changed files, in five batches

Run in a **disposable worktree** (`inPlace` on the real tree once wiped the demo vault), split into
five batches because the whole run is ~30 min for ~1230 mutants and a background command is capped at
10 min — a first attempt was killed at 40 %.

> **Correction to what this file said before.** The `scripts` runs of 2026-07-28 (PR 50, v4.3.0) were
> **narrowed to the covering tests**, on the grounds that `stryker.scripts.config.mjs` could not
> dry-run because `engine-manifest-integrity.test.mjs` asks `git ls-files`. That is true of the
> Stryker **sandbox**, which has no `.git` — it is **not** true of a worktree, which has one. The full
> harness command dry-runs fine there (**1033 green**). So the scores below are **not** pessimistic
> from narrowing: every mutant faced the whole suite.

Per file, worst last. No package aggregate is quoted, and that is on purpose: each batch reports its
own `All files` line over a different subset, and averaging them without the per-file mutant counts —
which went with the reports, see below — would be arithmetic, not a measurement.

| File | Score | |
|---|---|---|
| `restart-nudge.mjs`, `wiki-health-nudge.mjs` | **100 %** | |
| `auto-commit.mjs` | 98.31 % | |
| `update-engine.mjs` | 96.94 % | 1 recorded equivalent |
| `engine-source.mjs` | 94.00 % | |
| `reconcile-brain.mjs` | 93.02 % → **95.93 %** | 7 survivors left, **6 out of scope** |
| `universe-reminder.mjs` | 90.91 % | |
| `status-line-retreat.mjs` | 86.96 % | |
| `actions-log-seed.mjs` | 83.33 % | |
| `note-refresh.mjs` | 80.26 % → **98.68 %** | 1 survivor, a recorded equivalent |
| `refresh-note.mjs` | 57.41 % → **68.52 %** | read the number correctly — see below |
| `engine-fetch.mjs` | 53.52 % | pre-existing boot/IO seam |
| `restart-signal.mjs` | 37.50 % | pre-existing boot/IO seam |
| `session-self-heal.mjs` | 34.51 % | pre-existing boot/IO seam |
| **`session-status.mjs`**, **`status-line.mjs`** | **0.00 %** | named debt, own section below |

Confirmation re-run _(2026-08-02, worktree, two batches, ~7 min; logs in
`reports/confirm-batch{1,2}.log`)_: `note-refresh` **98.68 %** (75 killed / 76),
`refresh-note` **68.52 %** (36 killed + 1 t/o / 54), `reconcile-brain` **95.93 %** (164 killed + 1 t/o
/ 172).

**Read `refresh-note.mjs`'s 68.52 % correctly.** All 17 remaining survivors sit at lines **28-39**
(`realRefreshDeps`, the I/O lambda object) and **98-99** (the `isEntrypoint` boot guard). **Nothing
between 46 and 96 survives** — `runRefresh`, the whole decision logic, is fully killed. What is left
is the same *observed-by-nothing boot/IO seam* as `session-status` / `status-line`: the named debt
below, not a gap in this release's logic.

**Four mutants were live defects, not merely unwatched lines.** Worth keeping, because each was found
by the run and by nothing else:

- **A `---` rule inside the body swallowed half the page into the frontmatter** (greedy match), and a
  **CRLF** note — Windows, which is in the CI matrix, and what Obsidian writes there — was refused as
  "having no frontmatter". _(`5e21587`, 7 tests → 13.)_
- **The duplicate-key check refused a VALID page**: unanchored, `authors:` followed by two
  `  - name:` entries reads as one key declared twice, so the owner is told their page is damaged and
  has nothing to fix. Exactly what the check's own comment warns about — rag's looser twin invented a
  key called `- https` out of a list of URLs. _(`794058a`.)_
- **The no-frontmatter refusal was asserted with `/frontmatter/i`**, which also matches *"Cannot read
  properties of null (reading 'frontmatter')"* — so deleting the refusal and letting a TypeError
  escape kept the test green. _(`794058a`.)_
- **`toPosix` on Windows**: flattening `\` to nothing yields `C:brainvault`, so a refresh reports
  *"does not exist"* for a note sitting right there. _(`794058a`.)_

And two shapes already named in [`RETROSPECTIVE.md`](RETROSPECTIVE.md), met again:

- **The containment guard's trailing slash IS the guard** — without it `../vault-secrets/x.md`
  resolves outside `vault/` and passes. The "does not exist" message was matched with
  `/does not exist|file-back/i`, **an OR that let either half vanish**, including the half naming
  `file-back-note.mjs`. Both now asserted whole. _(`8458ce1`, 6 tests → 8.)_
- **One cause, one test** in `reconcile-brain.mjs`: every existing test had either OUR status line
  (retired) or a clean custom one, so the **healing** branch — the only place we ever write into
  someone else's `statusLine` — was never exercised. _(`c72e20a`, 54 → 55.)_ Its sibling survivor,
  `statusLineWasRemoved`'s `false` initialiser, is the **F7 shape inside the release that closes F7's
  siblings**: with no `settings.json.template` to read the settings pass is skipped entirely, and
  reporting `true` would have `update-engine` announce *"your own status line is back"* to an owner
  whose settings were never opened. _(`d1a9d07`.)_

### The two 0 % files — named debt, and **not** a regression

`session-status.mjs` and `status-line.mjs` scored **0.00 %**: 250 mutants, **zero killed**.

**Why the score is 0.** Both are top-level scripts that RUN on import, so nothing can import them and
no test observes them. Verified, not assumed: `git log --diff-filter=A` shows `scripts/status-line.test.mjs`
and `scripts/session-status.test.mjs` have **never existed** in this repo's history.

**What IS covered.** The **logic** these two wire is fully tested — it lives in `scripts/lib/**`,
which is at 100 %. It is the **wiring** that no test observes.

**Not created here.** This release rewrote 50 lines of one (Track 2) and 27 of the other (Track 6)
**without creating the hole**: every published tag so far carries it.

**The cure, and why it is not in this tag.** §5ter item 2 prescribes it exactly — `BootDeps` + an
`import.meta.url` guard, with the entry guard earned back by **one** subprocess test. That is a
refactor of two **fleet-deployed** scripts, and doing it on the eve of a tag is how you ship a broken
first screen. **Decided with Thomas 2026-08-02: record it as named debt and ship.** Not "we'll get to
it" — it is written here, and stated in the release note's honest bounds, so the next tag inherits a
**named** debt rather than a silent one. The BootDeps refactor is a release of its own.

The same seam accounts for `engine-fetch` (53.52 %), `restart-signal` (37.50 %),
`session-self-heal` (34.51 %) and the 17 survivors of `refresh-note`. It is now the single largest
mutation debt in the `scripts` package, and the natural next hardening pass.

### Recorded equivalents (this release)

One systematic, four local. Documented rather than chased — "effective 100 % on non-equivalents".

- ⭐ **Systematic, recorded ONCE for the whole repo: every `readFileSync(p, "utf8")` → `readFileSync(p, "")`
  survivor.** Node returns a **Buffer** for an empty encoding, and `JSON.parse` decodes it to the same
  string. Same finding on both sides (`engine-version.ts:83` in rag), and it accounts for a large share
  of the pre-existing survivors in `reconcile-brain`, `engine-fetch` and `update-engine`. **Do not
  re-derive it per file.**
- `campaign-persist.ts:30` — `typeof manifest !== "object"` is only observable with a *function*
  carrying a `.source` object, and `JSON.parse` cannot produce one.
- `note-refresh.mjs` — dropping the trailing `$` from `FRONTMATTER_RE`. `[\s\S]*` is greedy to the end
  already, so the anchor buys nothing at runtime; keeping it is documentation of intent.
- `update-engine.mjs` — `skillsPreserved = []`. **Verified equivalent, not a coverage gap**: Stryker's
  array mutant injects a *string*, the loop destructures `{ reason }` off it → `undefined !== "customized"`
  → `continue`, so nothing is observable. Proof it is the mutant and not the test: the sibling defaults
  on the same line (`installedSkills = []`, `statusLineRemoved = false`) **die** against the existing
  minimal-report test. Killing it would mean changing production to reject a shape its producer cannot emit.

### Two worktree traps, both paid for — neither was in the gotchas

1. **A mutant of `auto-commit.mjs` COMMITS the instrumented tree.** The worktree came back sitting on
   an `auto: vault/claude sync` commit of its own, so `git checkout -- .` faithfully restored
   *Stryker's instrumentation*, and every later dry run died on `SyntaxError: Identifier 'stryNS_…' has
   already been declared`. **The reset has to be `git reset --hard <sha>` + `git clean -fd`, never
   `checkout -- .`.** This is the worktree doing its job: the same mutant on the real tree would have
   committed **there**.
2. **`disableTypeChecks` must be OFF for this package.** Stryker prepends `// @ts-nocheck` to ~370
   files, and under `inPlace` that lands on the real worktree. These are plain `.mjs` with nothing to
   type-check. The CLI has no flag for it, so the batch runs use a tiny
   [`stryker.scripts.batch.config.mjs`](stryker.scripts.batch.config.mjs) that spreads the base config
   and turns it off.

Both are folded into [Gotchas learned](#gotchas-learned) so the next run meets them there.

### ⚠️ What was lost, and the rule it earns

**The Stryker HTML reports for both `scripts` runs are GONE**: both worktrees lived under the session
scratchpad, and macOS's temp cleanup emptied them (2026-08-02, `git worktree prune`). **This cost
nothing here** — the survivors were enumerated in the release plan while the reports were still open,
and that enumeration is what this section is written from.

**Rule for the next release: copy the per-file scores AND the survivor list into the plan the moment a
run ends.** A scratchpad worktree is not storage. The only surviving artefacts of these runs are the
two confirmation logs under `reports/`, because they were written outside it.

---

## Full `local-mirror` re-audit — 2026-07-28 (v4.2.0)

**Current `local-mirror` score: 90.44 %** (940 killed + 6 timeout / 1046 covered, 100 survived,
0 no-coverage). Run at `concurrency: 4`, 11 min 41 s, on the exact tree tagged **v4.2.0** (universes v2).

**How it got there, because the path matters more than the number.** Three full campaigns:

| Run | Score | What changed |
|---|---|---|
| First audit | 89.10 % | the release's code as written (114 survivors) |
| After the obvious hole | 89.29 % | the universe reader's default `readFileSync` was never exercised — every test injected a fake (`9fedd47`) |
| **Tagged** | **90.44 %** | after the audit below found **11 more live mutants that were this release's own** (`3d3a465`) |

**The audit that mattered, and the trap it sprung.** The first read of the drop against 95.63 % blamed
it entirely on unhardened auto-refresh code, on the strength of a per-**file** origin table. That table
was wrong: new code lands **inside** old files, so `lib/config.ts`, `lib/markdown.ts` and
`domain/local-mirror.ts` — all filed as "pre-existing" — had been touched by the universes work, and
their survivors were ours. Comparing the per-file scores against the 2026-07-16 table (every file that
scores *worse* has new code in it) and then reading each survivor's own diff is what surfaced them.
Recorded as a durable reading rule in [`RETROSPECTIVE.md`](RETROSPECTIVE.md) → "a file is not an
increment".

What those 11 were, and why they were worth killing rather than explaining away:

- **`lib/config.ts` 83.33 % → 100 %** (4): nothing asserted the segments of the two `.vault-rag` paths.
  A wrong path does not fail loudly — it reads as "no such file" and degrades to the default scope,
  silently freezing a new mirror into the wrong universe. That is the *exact* failure mode this release
  exists to close, left unpinned.
- **`domain/local-mirror.ts` 94.15 % → 95.82 %** (6): the `setup_source` guidance messages were
  asserted by fragments, so half a sentence could be deleted unnoticed — and `universes.join(', ')` →
  `join("")` survived, i.e. no test ever rendered the menu **with its separators** (the discipline's
  "collections ≥ 2" rule, missed). Both messages are now asserted whole.
- **`lib/markdown.ts` 83.33 % → 100 %** (1): the universe guard was only ever reached with `undefined`,
  which js-yaml drops from the frontmatter — unobservable through the acceptance tests. Pinned at the
  unit on the case that *is* observable: a blank universe is not a universe.

**The remainder of the −5.19 against 95.63 % is genuine growth**: 710 → 1046 mutants (+336), mostly
auto-refresh code (S2 inter-process lock, scheduler, boot) that never had a hardening pass.

Per-file, worst-first:

| File | Score | Survived | Whose debt, and why it is still there |
|---|---|---|---|
| `server.ts` | 50.00 % | 19 (+2 t/o) | composition root — integration-only boot lines. The one survivor near this release's wiring is the **auto-refresh** sync-lock construction, not the universe reader. |
| `auto-sync-scheduler.ts` | 70.59 % | 10 (+1 t/o) | **auto-refresh**, never hardened |
| `adapters/fs-sync-lock.ts` | 72.41 % | 24 | **auto-refresh** (S2 inter-process lock), never hardened |
| `content-hash.ts` | 80.00 % | 1 | small never-hardened leaf (unchanged since 2026-07-16) |
| `fs-state-store.ts` | 81.82 % | 4 | small never-hardened leaf (unchanged) |
| `notion-connector.ts` | 85.29 % | 5 | unchanged |
| `fs-universes.ts` | **85.71 %** | 1 | **this release — paid** (57.14 % → 85.71 %); the 1 left is a documented equivalent |
| `auto-sync-boot.ts` | 86.96 % | 3 (+1 t/o) | **auto-refresh**, never hardened |
| `fs-vault-writer.ts` | 87.50 % | 1 | unchanged |
| `strip-volatile-urls.ts` | 89.19 % | 4 | unchanged |
| `sync-interval.ts` | 92.31 % | 1 | **auto-refresh** |
| `fs-config-store.ts` | 93.75 % | 2 | unchanged |
| `notion-transformers.ts` | 94.87 % | 6 | hardened — documented equivalents |
| `lib/universe.ts` | **95.12 %** | 2 | **this release**; both **equivalent** — `JSON.parse(raw ?? '')` → any other unparseable string, and `catch { return [] }` → `catch {}`, which falls through to the same `return []` |
| `domain/local-mirror.ts` | **95.82 %** | 15 (+2 t/o) | **this release — paid** (94.15 % → 95.82 %); the 15 left sit on pre-existing lines, none on the universe code |
| `notion-url.ts` / `notion-gateway.ts` | 97.87 % / 97.44 % | 1 / 1 | hardened — documented equivalents |
| `lib/config.ts`, `lib/markdown.ts` | **100.00 %** | 0 | **this release — paid** (both 83.33 % → 100 %) |
| `index.ts`, `reconcile.ts`, `auto-sync-supervisor.ts`, `fresh-env.ts`, `system-clock.ts` | 100.00 % | 0 | full |

**What this release deliberately did NOT pay.** The auto-refresh tier (`fs-sync-lock` 72.41 %,
`auto-sync-scheduler` 70.59 %, `auto-sync-boot` 86.96 %) and `server.ts` are **dated debt from another
increment**, recorded here rather than folded into a universes release: hardening them is its own pass,
with its own audit, and mixing it in would hide which change moved the number. That is the natural
next "B5" target for this package, alongside rag's embedders. The distinction is only defensible
because the survivors were read **line by line** rather than file by file — see the trap above.

---

## Increment 2.5 (engine skill refresh) — Step 10 — 2026-07-27

The gate before merging `feat/engine-skill-refresh`. Scope = the surface the increment
touched. Run per the recipe below (disposable worktree + `--inPlace`), one file (or one
COMMA-SEPARATED `--mutate`, see the gotcha) at a time.

| File | Before | After | Note |
|---|---|---|---|
| `scripts/lib/engine-skill-refresh.mjs` | 86.72 % | **100 %** | 119/119, no equivalents _(6d6564b)_ |
| `scripts/update-engine.mjs` | 51.52 % | **98.49 %** | 196/200, 3 equivalents _(5a04fa4, a54a0b1)_ |
| `scripts/lib/engine-source.mjs` | 81.40 % | **93.02 %** | 40/43, 3 equivalents _(3790a2e)_ |
| `scripts/lib/reconcile-brain.mjs` | 71.43 % | **96.45 %** | 162 killed + 1 timeout / 169, 6 equivalents _(3900fbb, fc520b0, e0cd006, 49e1457, a369fe2, e480621)_ |

> **Decision (Thomas, 2026-07-27): both remaining files hardened IN THIS BRANCH**, to the same
> standard as `update-engine.mjs` — including the survivors this increment never wrote. The two
> narrower options (increment-only lines; increment + the composition-root seam) were put to him
> and declined. **Effective 100 % on non-equivalents** for all four files of the increment.

**`reconcile-brain.mjs` — what the 51 survivors were.** ~14 in the process-level wiring (the argv
slice, the error banner, the exit code, the entry guard), fixed the same way `update-engine.mjs` was:
extract `runReconcileCliProcess(deps)` + `realReconcileDeps`, leave the entry block as pure wiring,
spawn it once as a real process, and route the guard through the canonical `isEntrypoint` (this file
was the last hold-out hand-rolling it — bug B2). ~16 more in the CLI's own contract (missing-flag
refusal, `--platform` reaching the seams, the manifest write). ~11 in the `.mcp.json` / `settings.json`
side-channels, where two habits were the root cause: a **self-confirming fixture** (settings.json
stored with the exact serialiser production writes it with → an unconditional rewrite left it
byte-identical, so the no-churn guard could not be refuted by its own test) and **two write-reasons
never isolated** (every repair fixture had BOTH broken hooks and a broken statusLine, so neither term
of the guard was ever the sole cause). The rest were absent cases never fed: an empty `regenerate`
bucket, a single-star skill glob, a reconcile with no `local` manifest.

Three production simplifications fell out, all the same lesson: `flagValue`'s length check, `?? {}`
before an object spread, and (previous step) the sidecar-clear condition could not change a single
byte — deleting them said the same in less code and removed the mutants. One extraction, `toPosix`,
makes the win32 `{{PROJECT_ROOT}}` contract verifiable on a POSIX CI, where it was a no-op and thus
untestable by construction.

> ⚠️ **Method note that paid for itself:** each mutant was hand-applied against the full suite before
> and after writing its test, rather than reasoned about. That caught one filed as *killed* which was
> in fact the OTHER branch of the same ternary, still alive because the assertion said `.includes(…)`
> instead of naming the whole list. See [`RETROSPECTIVE.md`](RETROSPECTIVE.md) Part II for the
> root-cause analysis of why four files of one increment scored 51–87 % despite Part I's rules.

> ⚠️ **The 2026-07-15 line "`scripts/**` is now fully hardened" was never true of these
> files.** It covered the three enumerated worst files plus `scripts/lib/**` *as measured
> then*; `update-engine.mjs`, `reconcile-brain.mjs` and `engine-source.mjs` appear nowhere
> in this document before today. Their low scores are **not** a regression from this branch.

**`update-engine.mjs` — what the 96 survivors actually were.** ~40 clustered in the
top-level `if (isEntrypoint(…))` block: a composition root with no seam. Extracting
`countNewCapabilities` / `needsRestart` / `armRestartFlag` / `bareHookName` +
`runUpdateCli(deps)` + `realUpdateDeps` (the `clear-example-notes` idiom) made them
reachable. Most of the rest were `formatReport` prose: the tests pinned one line each with
a regex, leaving every other line free to mutate → replaced by **golden assertions on the
whole report** (quiet no-op / everything-on / steady state / one-capability singular), each
list carrying **two** entries so a dropped `, ` separator diverges. Two production honesty
fixes fell out of it: a manifest with no `engineVersion` reads `rag unknown` (not
`undefined`), and a rejection with no reason prints `no reason given`. The entry point is
now **spawned as a process** in a test — bug B2 was exactly a guard that silently never
fired, and nothing else can catch that.

**The 3 remaining survivors are equivalent**, recorded so nobody re-hunts them: the
`skillsPreserved = []` default mutated to `["Stryker was here"]` (its only reader
destructures `{ skill, reason }` and `continue`s on `reason !== "customized"` → identical
output), and two `readFileSync(…, "utf8") → ""` (Node hands back a **Buffer**; both values
are only `JSON.parse`d or fed to `createHash().update()` → same bytes, same digest).

**Gotcha (cost a whole run):** multiple `--mutate` flags **do not accumulate** — only the
last one applies. Use ONE comma-separated value:
`--mutate "scripts/lib/reconcile-brain.mjs,scripts/lib/engine-source.mjs"`.

---

## Full `local-mirror` re-audit — 2026-07-16 (post-B4)

**Current `local-mirror` score: 95.63 %** (675 killed + 4 timeout / 710 covered, 31 survived,
0 no-coverage). Run at `concurrency: 4` (honest timeouts). This closes the package: two effects
lifted it from the 78.69 % closer below, which was measured *before* both hardening waves had landed
as an aggregate:

- **the optional weak tier** (`local-mirror.ts` → 98.52 %, `notion-transformers.ts` → 94.87 %,
  `notion-url.ts` → 97.87 %), hardened 2026-07-15 but never re-aggregated;
- **B4** — the last two small files: `config.ts` **71.43 % → 100 %** and `fresh-env.ts`
  **62.5 % → 100 %** (see the plan's B4 for the seams/tests).

Per-file, worst-first on the remaining survivors:

| File | Score | Survived | Note |
|---|---|---|---|
| `fs-state-store.ts` | 81.82 % | 4 | never hardened (small fs adapter) |
| `notion-connector.ts` | 85.29 % | 5 | already decent |
| `server.ts` | 85.71 % | 2 (+2 t/o) | **hardened** — the entry-point guard equivalents |
| `fs-vault-writer.ts` | 87.50 % | 1 | never hardened |
| `strip-volatile-urls.ts` | 89.19 % | 4 | never hardened |
| `content-hash.ts` | 80.00 % | 1 | leaf, 5 mutants |
| `fs-config-store.ts` | 93.75 % | 2 | already decent |
| `notion-transformers.ts` | 94.87 % | 6 | **hardened** — documented equivalents |
| `notion-gateway.ts` | 97.44 % | 1 | **hardened** — `new Client({auth})` equivalent |
| `notion-url.ts` | 97.87 % | 1 | **hardened** — documented equivalent |
| `local-mirror.ts` | 98.52 % | 4 (+2 t/o) | **hardened** — documented equivalents |
| `config.ts` | **100.00 %** | 0 | **hardened B4** |
| `fresh-env.ts` | **100.00 %** | 0 | **hardened B4** |
| `index.ts` | 100.00 % | 0 | **hardened** |
| `reconcile.ts` / `markdown.ts` / `system-clock.ts` | 100.00 % | 0 | full |

The residual survivors are small never-hardened leaves (`fs-state-store`, `strip-volatile-urls`,
`content-hash`, `fs-vault-writer`) plus documented equivalents in the hardened files — all above the
80 % `high` threshold. No further tier planned.

## Full `rag` re-audit #2 — 2026-07-16 (post-B2/B3 hardening)

**Current `rag` score: 90.42 %** (1279 killed + 5 timeout / 1420 covered, 136 survived, 0 no-coverage).
Run at `concurrency: 4` (honest timeouts). Two changes lifted it from the 82.59 % closer below:

- **B2 — stopped mutating the `fake-embedder.ts` test double** (a test helper, not production code):
  the mutate set drops from 25 → 24 files (1420 vs 1436 mutants). This is a *measurement-correctness*
  fix — the 82.59 % was scoring the wrong thing for those 6 mutants.
- **B3 — hardened the 5 weak-tier files** the earlier closer flagged: `health-check` 63.25 % → 92.31 %,
  `usage-tracker` 55.88 % → 92.65 %, `citation-renderer` 45.45 % → 100 %, `reindex-lock` 75.34 % →
  94.52 %, `status-report` 78.87 % → 100 %.

Per-file, worst-first on the **remaining** survivors (24 files, `fake-embedder` excluded):

| File | Score | Survived | Tier |
|---|---|---|---|
| `search-degradation.ts` | 71.43 % | 2 | small, never hardened |
| `reindex-scheduler.ts` | 74.19 % | 8 | never hardened |
| `index-freshness.ts` | 81.13 % | 10 | never hardened |
| `embedder.ts` | 81.98 % | 20 | **hardened — residual are documented equivalents** |
| `in-process-embedder.ts` | 82.61 % | 8 | never hardened |
| `reindex-reporter.ts` | 83.64 % | 9 | never hardened |
| `openai-compatible-embedder.ts` | 84.00 % | 4 | never hardened |
| `engine-version.ts` | 84.44 % | 7 | never hardened |
| `chunker.ts` | 85.88 % | 12 | **hardened — documented equivalents** |
| `config.ts` | 86.67 % | 4 | **hardened — documented equivalents** |
| `progress-report.ts` | 88.52 % | 7 | never hardened |
| `notify.ts` | 90.91 % | 9 | already decent |
| `health-check.ts` | 92.31 % | 9 | **hardened B3 — effective 100 % (9 documented equivalents)** |
| `vector-store.ts` | 92.47 % | 11 | **hardened — documented equivalents** |
| `usage-tracker.ts` | 92.65 % | 5 | **hardened B3 — 4 equivalents + 1 accepted gap** |
| `indexer.ts` | 94.44 % | 1 | already decent |
| `reindex-lock.ts` | 94.52 % | 4 | **hardened B3 — documented equivalents** |
| `index-manager.ts` | 94.87 % | 4 | **hardened — documented equivalents** |
| `frontmatter-parser.ts` | 97.62 % | 2 | **hardened — documented equivalents** |
| `citation-renderer.ts` | 100.00 % | 0 | **hardened B3** |
| `document-scanner.ts` | 100.00 % | 0 | hardened |
| `native-deps.ts` | 100.00 % | 0 | already 100 % |
| `status-report.ts` | 100.00 % | 0 | **hardened B3** |
| `vault-watcher.ts` | 100.00 % | 0 | hardened |

**Reading it.** Of the 136 survivors, the bulk are **documented equivalent mutants** in the already-hardened
files (embedder 20, chunker 12, vector-store 11, health-check 9, index-manager 4, config 4, reindex-lock 4,
usage-tracker 4, frontmatter-parser 2 → ~70). The rest sit in files never worst-listed (`reindex-scheduler`,
`index-freshness`, the embedder adapters, `reindex-reporter`, `engine-version`, `progress-report`, `notify`) —
a possible future **B4-style** follow-up, non-blocking. Ceiling ~96 % (documented equivalents can't be killed).

## Full `rag` re-audit (closer) — 2026-07-16 [SUPERSEDED by re-audit #2 above]

> ⚠️ **SUPERSEDED** by [re-audit #2](#full-rag-re-audit-2--2026-07-16-post-b2b3-hardening). This closer
> still mutated the `fake-embedder.ts` test double and predated the B3 weak-tier hardening. Kept for
> history — do not quote 82.59 % as the current `rag` score.

After hardening all enumerated Step-2 worst-files, a full-package re-audit lifts **`rag` from
57.23 % → 82.59 %** (1177 killed + 9 timeout / 1436 covered, 250 survived, 0 no-coverage). Run at
`concurrency: 4` (honest timeouts). Per-file, worst-first on the **remaining** survivors:

| File | Score | Survived | Tier |
|---|---|---|---|
| `citation-renderer.ts` | 45.45 % | 18 | never hardened — real gaps |
| `usage-tracker.ts` | 55.88 % | 30 | never hardened — real gaps |
| `fake-embedder.ts` | 62.50 % | 6 | test helper (arguably should be excluded from mutation) |
| `health-check.ts` | 63.25 % | 43 | never hardened — **most survivors in the package** |
| `search-degradation.ts` | 71.43 % | 2 | small |
| `reindex-scheduler.ts` | 74.19 % | 8 | never hardened |
| `reindex-lock.ts` | 75.34 % | 18 | never hardened |
| `status-report.ts` | 78.87 % | 15 | never hardened |
| `index-freshness.ts` | 81.13 % | 10 | never hardened |
| `embedder.ts` | 81.98 % | 20 | **hardened — residual are documented equivalents** |
| `in-process-embedder.ts` | 82.61 % | 8 | never hardened |
| `reindex-reporter.ts` | 83.64 % | 9 | never hardened |
| `openai-compatible-embedder.ts` | 84.00 % | 4 | never hardened |
| `engine-version.ts` | 84.44 % | 7 | never hardened |
| `progress-report.ts` | 85.25 % | 9 | never hardened |
| `chunker.ts` | 85.88 % | 12 | **hardened — documented equivalents** |
| `config.ts` | 86.67 % | 4 | **hardened — documented equivalents** |
| `notify.ts` | 90.91 % | 9 | already decent |
| `vector-store.ts` | 92.47 % | 11 | **hardened — documented equivalents** |
| `indexer.ts` | 94.44 % | 1 | already decent |
| `index-manager.ts` | 94.87 % | 4 | **hardened — documented equivalents** |
| `frontmatter-parser.ts` | 97.62 % | 2 | **hardened — documented equivalents** |
| `document-scanner.ts` | 100.00 % | 0 | hardened |
| `native-deps.ts` | 100.00 % | 0 | already 100 % |
| `vault-watcher.ts` | 100.00 % | 0 | hardened |

**Reading it.** Of the 250 survivors, ~53 are the **documented equivalent mutants** in the already-hardened
files (chunker 12, embedder 20, vector-store 11, index-manager 4, config 4, frontmatter-parser 2) — those
are unkillable by definition. The remaining ~197 sit in files the Step-2 worst-first list never flagged
(they were dwarfed by the near-0 % files at baseline). Highest-leverage next targets, worst-first:
**`health-check.ts` (43), `usage-tracker.ts` (30), `citation-renderer.ts` (18), `reindex-lock.ts` (18),
`status-report.ts` (15)** — ~124 survivors across 5 files. Hardening those alone would move the package
toward ~90-93 %; the practical ceiling is ~96 % (the equivalents can't be killed, so chasing 100 % is
chasing equivalents). *(Done — see re-audit #2 above: 90.42 %.)*

## Step 3 hardening — local-mirror re-audit — 2026-07-15

> ⚠️ **SUPERSEDED** by [Full `local-mirror` re-audit — 2026-07-16 (post-B4)](#full-local-mirror-re-audit--2026-07-16-post-b4)
> (**95.63 %**). This 78.69 % snapshot predates the optional weak tier + B4 landing as an aggregate;
> it stays as the v3.4.2 tag-time record.

After hardening the three Step-2 worst-files, a full-package re-audit lifts **local-mirror
from 67.63 % → 78.69 %** (550 killed + 4 timeout / 704 covered, 150 survived). Per-file:

| Area | File | Before | After | Note |
|---|---|---|---|---|
| entry | `index.ts` | 2.2 % | **100 %** | in-memory Client drives the 7 tools end-to-end |
| entry | `server.ts` | 0 % | **85.71 %** | boot seams extracted; 2 equiv. = the entry-point guard |
| adapters | `notion-gateway.ts` | 21.1 % | **97.44 %** | seams injected; 1 equiv. = `new Client({auth})` |
| adapters | `notion-connector.ts` | — | 85.29 % | already decent |
| adapters | (fs-*, system-clock) | — | 81–100 % | already decent |
| domain | `local-mirror.ts` | — | **77.41 %** | 61 survivors — the big Domain Service, next tier |
| lib | `notion-transformers.ts` | 57.3 % | **94.87 %** | hardened 2026-07-15 (helpers exported + case-tested; 6 equiv.) |
| lib | `notion-url.ts` | — | 74.47 % | 12 survivors |
| lib | `fresh-env.ts` / `config.ts` | — | 62.5 % / 71.4 % | small |

Enumerated Step-2 worst-files (`server.ts`, `index.ts`, `notion-gateway.ts`) are **done**.
The remaining weak tier (`notion-transformers.ts` 57 %, `local-mirror.ts` 77 %, `notion-url.ts`
74 %) was not flagged in the Step-2 worst-first list; hardening it is optional follow-up.

## Step 3 hardening — scripts worst-files — 2026-07-15

The three git/vault side-effect scripts, hardened by extracting an injectable core
(git runner / cwd / spawn behind a port) and TDD-ing the glue. Measured per file in a
**fresh disposable worktree** (`--inPlace`) — never reused (a `clear-example-notes`
mutant deletes the worktree's `vault/`, so run-1 corrupts run-2's baseline).

| File | Before | After | Note |
|---|---|---|---|
| `clear-example-notes.mjs` | 28.6 % | **100 %** | 46/46, no equivalents — `runClear(argv, deps)` + `realClearDeps` |
| `auto-push.mjs` | 41.4 % | **92.39 %** | 85/92, 7 equiv. (redundant `.trim()` under `Number()` + the `import.meta.url` guard) |
| `auto-commit.mjs` | 47.5 % | **98.21 %** | 55/56, 1 equiv. (the `if (isEntryPoint(...))→if(true)` guard) |

`scripts/lib/**` was already 100 % → **`scripts/**` is now fully hardened**. Enumerated
Step-2 worst-files across all three packages are done (see the plan's Step 3).

## Baseline run — 2026-06-23 (engine at v3.4.0, commit `49e46a9`) [OLDEST]

> ⚠️ **SUPERSEDED for `rag` and `local-mirror`.** This is the *pre-hardening* photo. For the current
> `rag` score after the weak-tier hardening (B3), read **[Full `rag` re-audit #2 — 2026-07-16
> (post-B2/B3)](#full-rag-re-audit-2--2026-07-16-post-b2b3-hardening)** (**82.59 % → 90.42 %**,
> production-only). The earlier 57.23 % → 82.59 % closer is itself superseded (it still mutated the
> `fake-embedder` test double). For local-mirror see the re-audit above (67.63 % → 78.69 % → **95.63 %**
> post-B4). Do not quote the baseline numbers as the current state.

Faithful scope: every mutant re-runs the **whole package suite** (command runner, no
StrykerJS `node:test` runner). Scores are the durable test-quality signal the project lacked.

| Package | Mutation score | Killed | Timeout | **Survived** | Mutants | Read |
|---|---|---|---|---|---|---|
| **scripts** (harness) | **97.27 %** | 3612 | 21 | 102 | 3735 | excellent — `scripts/lib/**` is 100 % across the board |
| **local-mirror** | **67.63 %** | 458 | 12 | 225 | 695 | moderate |
| **rag** | **57.23 %** | 804 | 7 | 606 | 1417 | weakest — real gaps |

### Worst files (Step 3 hardening targets, worst-first)

**rag/src/lib**
- `document-scanner.ts` **0 %**, `vault-watcher.ts` **0 %** (I/O wirings, no unit test)
- `frontmatter-parser.ts` 11.9 %, `chunker.ts` 27.1 %
- `vector-store.ts` 33.8 %, `embedder.ts` 34.6 %, `index-manager.ts` 39.4 %, `config.ts` 40.0 %
- well covered (≥90 %): `indexer.ts`, `notify.ts`, `native-deps.ts`

**local-mirror/src**
- `server.ts` **0 %**, `index.ts` **2.2 %** (entry points, no unit test)
- `notion-gateway.ts` 21.1 %, `notion-transformers.ts` 57.3 %
- 100 %: `markdown.ts`, `reconcile.ts`, `system-clock.ts`

**scripts** — only 3 weak files (everything else, incl. all of `lib/**`, is 100 %):
- `clear-example-notes.mjs` **28.6 %** (30 survivors)
- `auto-push.mjs` **41.4 %** (51 survivors)
- `auto-commit.mjs` **47.5 %** (21 survivors)
- → all three are the git/vault **side-effect** scripts, hard to unit-test.

## How each package is run (and why)

| Package | Isolation | Why |
|---|---|---|
| rag | `inPlace` (real tree) | sandbox-copy breaks on `engine-version.test.ts` reading the repo-root `engine-manifest.json` + the `better-sqlite3` native module. Non-destructive: files restored after (verified git-clean). |
| local-mirror | `inPlace` (real tree) | same class; non-destructive. |
| scripts | **disposable git worktree** (`git worktree add /tmp/…`, run `inPlace` there) | ⚠️ `inPlace` on the real tree is **DESTRUCTIVE**: a `clear-example-notes` mutant deleted the real `vault/` demo notes. A worktree keeps git present (the `engine-manifest` integrity test needs it) **and** confines any deletion to `/tmp`. |

### Gotchas learned
- **Concurrency must be tuned for big suites.** The 513-test `scripts` suite at Stryker's default
  13 concurrent runners → CPU oversubscription → **mass FALSE timeouts** (a bogus 99.97 % score).
  Fixed with `concurrency: 5`, `timeoutMS: 30000`, `timeoutFactor: 4` → genuine 97.27 %.
  **`rag` hits the same trap** (the command runner re-runs the whole rag suite per mutant): hardening
  `embedder` scored a bogus **100 %** at defaults (98/111 FALSE timeouts) vs an honest **81.98 %**
  once tuned. `stryker.rag.config.mjs` now carries `concurrency: 4` / `timeoutMS: 30000` /
  `timeoutFactor: 4` — a timeout there now means a real infinite loop, not a starved runner.
- **Orphaned children.** Mutants that broke `child-cleanup` left `stub-mcp-server.mjs` fixtures
  spinning at 100 % CPU after the run. Kill leftovers: `pkill -f stub-mcp-server.mjs`.
- **Stryker only mutates files under its project root** → all configs run from the **repo root**
  (cwd), invoked via `npm --prefix maintainers/mutation run mutate:{rag,local-mirror,scripts,all}`.
- **Reset a `scripts` worktree with `git reset --hard` + `git clean -fd`, NEVER `git checkout -- .`**
  _(2026-08-02)_. A mutant of `auto-commit.mjs` **commits the instrumented tree**, so the worktree comes
  back sitting on an `auto: vault/claude sync` commit of Stryker's own instrumentation — which
  `checkout -- .` then faithfully restores, and every later dry run dies on `SyntaxError: Identifier
  'stryNS_…' has already been declared`.
- **`disableTypeChecks: false` for `scripts`** _(2026-08-02)_. Stryker otherwise prepends `// @ts-nocheck`
  to ~370 plain `.mjs` files with nothing to type-check, and under `inPlace` that lands on the real
  worktree. No CLI flag for it → [`stryker.scripts.batch.config.mjs`](stryker.scripts.batch.config.mjs)
  spreads the base config and turns it off.
- **Batch the `scripts` run** _(2026-08-02)_. ~1230 mutants ≈ 30 min, and a background command is capped
  at 10 min; `setsid` does not exist on macOS, so detaching is not the way out. Five batches of < 9 min,
  resetting the worktree between each.
- **The full harness command DOES dry-run in a worktree** _(2026-08-02, correcting the 2026-07-28
  sections below)_. `engine-manifest-integrity.test.mjs` asks `git ls-files` and only fails in the
  Stryker **sandbox**, which has no `.git`; a worktree has one (**1033 green**). Narrowing to the
  covering tests is therefore no longer required — and it made the earlier scores pessimistic, never
  inflated.
- **Copy the per-file scores AND the survivor list out of the report the moment a run ends**
  _(2026-08-02)_. Both v4.4.0 `scripts` worktrees lived under the session scratchpad, and macOS's temp
  cleanup emptied them — HTML reports included. A scratchpad worktree is not storage.

## Reproduce

```bash
# from the repo root — Stryker installed only here, never in rag/ or local-mirror/ package.json
npm --prefix maintainers/mutation run mutate:rag
npm --prefix maintainers/mutation run mutate:local-mirror
# scripts: run inside a disposable worktree (destructive otherwise)
git worktree add -d /tmp/sbg-mut-scripts
( cd /tmp/sbg-mut-scripts && node "$PWD/../../<repo>/maintainers/mutation/node_modules/@stryker-mutator/core/bin/stryker.js" \
    run "<repo>/maintainers/mutation/stryker.scripts.config.mjs" --inPlace --tempDirName .stryker-tmp )
git worktree remove /tmp/sbg-mut-scripts --force
```

Generated HTML reports + run logs land under `reports/` (git-ignored).

## PR 50 (startup pull + engine commit) — 2026-07-28

Targeted run over the two files the change owns. **98.53 % overall** —
`engine-commit.mjs` **100 %** (24/24), `repo-status.mjs` **97.73 %** (43/44).

The run had to be **narrowed to the covering tests** rather than the full harness command:
`stryker.scripts.config.mjs` cannot complete its dry run any more, because
`engine-manifest-integrity.test.mjs` asks `git ls-files` and the Stryker **sandbox copy has no
`.git`** — every manifest glob reads as dead and the test fails before a single mutant runs. Narrowing
can only make a score **pessimistic** (fewer tests available to kill a mutant), never inflate it.
Restoring the full `mutate:scripts` run needs that integrity test to tolerate a repo-less checkout.

Killed here, worth keeping as patterns:

- **A blank-line filter that could not change anything.** `countVaultUncommitted` filtered out empty
  lines before testing `slice(3).startsWith("vault/")` — but a blank line fails that test anyway. Four
  mutants lived in that dead guard. Deleting it says the same thing in less code (the "simplify the
  production rather than excuse the mutant" reflex), and takes all four with it.
- **A warning asserted by fragments.** The uncommitted-notes alert was checked with three `match`es on
  pieces of itself, so three of its clauses could be blanked with the suite still green — on the one
  line that tells a user their notes are unversioned. Now asserted whole.
- **Regex anchors need a mid-line decoy.** `/^(error|fatal|erreur)\s*:/` survived losing its `^` until
  a fixture line *mentioned* `error:` mid-sentence (a git `hint:`); the indent-tolerating `.trim()`
  survived until a fixture indented one of its diagnostic lines, as git does.
- **`\s*` after the colon was deleted, not fed.** Rather than invent a `error:no-space` fixture no git
  emits, the trailing `\s*` moved out of the regex into a `.trim()` on the extracted reason — same
  behaviour, one fewer indistinguishable mutant.

**Accepted equivalent (1).** `pullOut ?? ""` → `?? "Stryker was here!"`: any replacement string with no
`error:`/`fatal:`/`erreur :` prefix yields the same empty reason and the same fallback line, so no test
can distinguish it.

### PR 50, second increment (the SessionStart sweep) — 2026-07-28

Same narrowing, over the two files this increment owns. **98.98 % overall** —
`startup-sync.mjs` **100 %** (42/42), `repo-status.mjs` **98.21 %** (55/56), the single survivor being
the `pullOut ?? ""` equivalent already accepted above. Command used (config in a scratch file, since
the full `mutate:scripts` dry run is still blocked by `engine-manifest-integrity.test.mjs`):
`mutate: ["scripts/lib/startup-sync.mjs", "scripts/lib/repo-status.mjs"]`, command runner
`node --test scripts/lib/startup-sync.test.mjs scripts/lib/repo-status.test.mjs`.

Killed here, worth keeping as patterns:

- **Redundant regex anchors are dead code, not a coverage gap.** `/^(U.|.U|AA|DD)$/` tested against a
  `slice(0, 2)` left BOTH anchor mutants alive: on a 2-char string the anchors cannot change the
  verdict. No fixture could ever kill them, because the slice is already the anchor. Deleting them
  (the "simplify the production" reflex again) took both mutants with it — and the guarantee stays
  where it belongs, in the decoy fixture whose *path* carries the conflict codes: remove the slice and
  that test goes red.
- **`UU` is a fixture that satisfies two reasons at once.** It matches both the "U on the left" and
  "U on the right" alternative, so either could be deleted with the suite green (§9 of the discipline).
  Fed `UD` and `AU` separately, each alternative becomes singly necessary.
- **The call-order claim needs the sequence asserted, not the outcome.** "The sweep runs BEFORE the
  pull" is the whole point of the change and is invisible in any return value: only `deepEqual` on the
  fake git's full call list pins it. Dropping the sweep entirely still leaves 4 of 7 tests green — the
  3 that fail are the order test and the two real-git ones.

## v4.3.0 — the mirror move (`local-mirror`) — 2026-07-28

Targeted run over the two files this change owns.
**`lib/markdown.ts` 100 %** (8/8) · **`domain/local-mirror.ts` 96.16 %** (424 killed, 17 survived,
2 timeouts) at the last measured run.

`local-mirror.ts` is a big pre-existing file, so the file score alone says little about the new code.
What matters: of the 17 survivors, **exactly one sat inside this change** (the
`if (persisted) stateStore.save(...)` guard, line 504). It was killed afterwards by the "never synced"
test asserting `sidecarOf(name) === null`, **hand-verified** by applying `if (true)` and watching that
test go red. The other 16 predate the change (`maxLastEditedTime`, the freshness arithmetic) and are
outside its scope.

The run itself found the gaps — this is what it bought, and each is a pattern worth keeping:

- **A whole refusal branch nobody called.** `moveSource` on an undeclared mirror had no test at all:
  seven mutants lived there, including `configs.find(() => true)` and `ok: false → ok: true`. Two
  tests (a brain with mirrors, a brain with none) took all seven — and the second exists only because
  the empty-registry sentence is a *different* clause, not a shorter list (§9: one test per reason).
- **A rollback message asserted by a fragment.** The failed-move test matched the `ENOSPC` part with a
  regex, so both sentences promising the corpus is intact could be blanked with the suite green — on
  the one line that tells an owner nothing was lost. Now asserted whole (§1/§2).
- **A rollback that deleted "what it wrote" without proving it.** Seeding `landed` with a junk entry
  survived, because no test looked at what the rollback deleted. `deletedVaultFiles()` now names the
  exact list.
- **Both sides of the default-universe ternary.** `withUniverse` and `universeLabel` each had one
  branch unfed: nothing moved a mirror *to* the cross-cutting universe, and no move message named a
  real universe. Two `?` mutants died to one new test plus one added assertion (§4: feed the twin).
- **The "moved onto the universe it already lives in" no-op** was written as a guard and proven by a
  hand-applied mutant (delete unconditionally) before being trusted — the case where phase 2 would
  delete the very file phase 1 had just written.

### v4.3.0, after the review fixes — 2026-07-28

Re-measured once the eight `/code-review` findings were fixed, over the same two files.
**`lib/markdown.ts` 100 %** (22/22) · **`domain/local-mirror.ts` 96.86 %** (456 killed, 15 survived,
6 timeouts). Command:
`stryker run maintainers/mutation/stryker.local-mirror.config.mjs --mutate "local-mirror/src/lib/markdown.ts,local-mirror/src/domain/local-mirror.ts"`.

**The first re-run measured 93.50 %, not 96.86 %** — the fixes had ADDED under-asserted code, and
saying so is the point of keeping this file. `markdown.ts` fell to 95.45 % and `local-mirror.ts` to
93.50 % (32 survivors, up from 17). Four hardening steps took it back, each mutant hand-applied on
the full suite before and after:

- **Two new messages asserted by fragments.** The move's refusal-under-lock (`/refresh|syncing/i`)
  and the leftover-copy warning (`/could not be deleted|delete by hand/i`) each let every other
  clause of themselves be blanked with the suite green — including the clause naming the cost and
  the one saying what to do. Eleven mutants lived in those two sentences. Both now asserted whole,
  the refusal as a whole-result `deepEqual` (§1/§2).
- **A plural branch no fixture reached.** Only ever one leftover, so `['old copies', 'are']` and the
  `join(', ')` separator were unreachable — with one path, a separator that joined nothing reads the
  same. A two-leftover test (the realistic case: a vault that refuses one delete refuses the next)
  kills both (§5).
- **A double that could not tell a leaked lock from a returned one.** `FakeSyncLock.release()` was a
  no-op and `acquire()` recorded nothing, so BOTH `finally { release }` blocks were untestable — on a
  real brain a leaked lockfile blocks every refresh until the stale timeout, which is the very
  "brain quietly stopped syncing" failure this release exists to end. The double now holds what it
  takes (§8), and a move is followed by the refresh that proves the lock came back. Dropping the
  move's release turns 3 tests red, the sync's 20 — both were green before.
- **The rebuild's default-universe branch, fed at last.** `reuniverseLocalMirrorMarkdown` only ever
  saw `undefined`, which js-yaml drops, so stamping-blank and stripping were indistinguishable. Fed a
  blank name they diverge (§4) — the same reflex the sibling test already applied to the write path.

**Scope of what is left.** All 15 survivors sit on pre-existing lines — the `setup_source` duplicate
guard (115), the sync report's `status !== 'failed'` (153), the freshness arithmetic (349/368), the
empty-batch verdict (655) and `maxLastEditedTime`'s `>` (665). **Not one is inside the move, the
review fixes, or `markdown.ts`.**

**Timeouts are counted as kills, and only partly verified.** The two identified in the pre-hardening
run were genuine infinite loops (`if (name === 'all') return this.syncAll()` mutated to `true` makes
`sync` recurse into itself forever), so they are real kills. The six in the final run were not
individually enumerated — the clear-text reporter names survivors, not timeouts — so read that score
as 96.86 % with six kills taken on trust rather than inspected.

### v4.3.0, the harness side of the review fixes — 2026-07-28

The four `scripts/**` files this branch touched, measured together in a **disposable worktree** (the
recipe above — `inPlace` on the real tree once deleted the demo vault), against their own covering
tests. **98.37 %** overall — `engine-commit.mjs` **100 %** (20/20), `startup-sync.mjs` **100 %**
(35/35), `repo-status.mjs` **97.44 %** (76/78), `auto-commit.mjs` **98.04 %** (50/51). Narrowed for
the usual reason: `stryker.scripts.config.mjs` still cannot dry-run (`engine-manifest-integrity.test.mjs`
asks `git ls-files`), and narrowing can only make a score pessimistic.

**Nothing to harden — all three survivors are equivalents**, two of them already accepted above
(`pullOut ?? ""`, and `auto-commit`'s `if (isEntryPoint(…))` entry-point guard). The new one:

- **`stripQuotes`: `path.startsWith('"')` → `path.endsWith('"')`.** Git's porcelain either quotes a
  path at BOTH ends or at neither — a `"` anywhere in a name is itself a reason to quote — so no line
  git can emit distinguishes the two. Killing it would take a fixture git never produces (an
  unquoted path ending in `"`), which is exactly the invented-fixture trap this file warns about.
