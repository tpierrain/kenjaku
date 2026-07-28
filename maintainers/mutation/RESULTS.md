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
| **rag** | **90.42 %** | 2026-07-16 (post-B2/B3) | [re-audit #2](#full-rag-re-audit-2--2026-07-16-post-b2b3-hardening) — production-only |
| **scripts** (harness) | **97.27 %** | 2026-06-23 baseline | 3 weak files since hardened to 92–100 % (no full re-audit; `lib/**` already 100 %). The three files audited on [2026-07-27](#increment-25-engine-skill-refresh--step-10--2026-07-27) are now hardened too: `update-engine.mjs` **98.49 %**, `reconcile-brain.mjs` **96.45 %**, `engine-source.mjs` **93.02 %** (every survivor killed or recorded as equivalent). The two files touched on [2026-07-28](#pr-50-startup-pull--engine-commit--2026-07-28) were measured the same way: `engine-commit.mjs` **100 %**, `repo-status.mjs` **97.73 %** |
| **local-mirror** | **90.44 %** | 2026-07-28 (v4.2.0) | [re-audit](#full-local-mirror-re-audit--2026-07-28-v420) — +336 mutants since the 95.63 % below (auto-refresh growth); this release's own survivors were found and killed before tagging. The two files v4.3.0 touched were re-measured [after the review fixes](#v430-after-the-review-fixes--2026-07-28): `markdown.ts` **100 %**, `local-mirror.ts` **96.86 %** |

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
separately — 97.27 %, `lib/**` all 100 %, 3 side-effect scripts at 92–100 %):

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
