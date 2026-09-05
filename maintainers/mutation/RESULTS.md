# Mutation testing — audit results (StrykerJS)

> **Dev-only.** This whole folder lives under `maintainers/` and is **excluded from the
> brain copy** (`scripts/lib/tracked-files.mjs` → `DEV_ONLY_PREFIXES` has `maintainers/`),
> so neither the tooling nor these results are ever deployed into a generated brain.
> See the plan: [`../plans/prospective/mutation-testing-stryker.md`](../plans/prospective/mutation-testing-stryker.md).
> For **what the survivors taught us** (recurring shapes → durable rules), see the
> retrospective: [`RETROSPECTIVE.md`](RETROSPECTIVE.md).

> 📈 **Sections are ordered newest-first (anti-chronological).** The top block is the current
> state; scroll down for the history back to the 2026-06-23 baseline.

> 🛑 **A FLAKY TEST INFLATES EVERY SCORE MEASURED WHILE IT EXISTS, and one did — between
> `de19cd9` and `211cfc5` (2026-08-20 → 2026-08-21).** The runner is Stryker's **`command`**
> runner: a mutant is killed when the suite **exits non-zero**, and a test that fails at random
> is indistinguishable from a mutant being detected. `engine-merge-git.test.mjs`'s *"nothing is
> left behind"* swept the **shared** system temp dir, so under parallel workers it saw other
> processes mid-merge.
>
> **Measured on 2026-08-21, 8 concurrent full-suite runs**: **6 of 8 failed** with that test as
> written, **0 of 8** after the fix. Every section below dated 2026-08-20 or 2026-08-21 whose
> subject runs while a merge can be in flight was therefore measured against a suite that failed
> ~75 % of the time **for reasons unrelated to the mutant**, and is **marked ⚠️ inflated** where it
> has not been re-measured. What re-measurement showed, file by file:
>
> | File | Inflated figure | Honest figure | Verdict |
> |---|---|---|---|
> | `update-engine.mjs` | 98.95 % | **97.54 %** | 4 more survivors, all pre-existing holes the noise masked |
> | `lib/engine-merge-git.mjs` | 100.00 % | **98.18 %** | 1 survivor, an equivalent — the perfect mark was not earned |
> | `lib/engine-merge-apply.mjs` | 100.00 % | **100.00 %** | unchanged |
> | `lib/engine-skill-refresh.mjs` | 100.00 % | **100.00 %** | unchanged (as re-cut at S2b-1) |
>
> **Two of the four numbers were wrong and two were not**, which is why this warning names files rather
> than casting doubt on the whole corpus. A number worth keeping is one that survived the correction.
>
> ➡️ **The durable rule**: under a `command` runner, *suite green* is the only thing the score
> means. A flaky test does not add noise to a mutation score, it adds **points** — always upward,
> never down. Treat a suite that is not deterministic under load as a broken instrument, and fix
> it before believing any number it produced.
>
> ### ⚠️ THE JUDGE ITSELF WAS FLAKY — the class RECURRED after `211cfc5`, and this time no test is flaky
>
> _(Measured at S7-5-1, 2026-08-21, on `d019d38`.)_ The box above fixed **one shared-temp-dir test**.
> The **class** it belongs to is still open, and it bit again on a file whose suite is perfectly
> deterministic on its own:
>
> | Run | Command | Score | Survivors |
> |---|---|---|---|
> | 1 | `mutate-one.mjs … engine-ancestor.mjs` | **96.97 %** | 1 |
> | 2 | the same command, same HEAD, minutes later | **93.94 %** | 2 |
> | 3 | the same, `--concurrency 1` | **93.94 %** | 2 |
>
> **The tiebreaker is not the majority, it is the hand-run**: the disputed mutant (`if (!recorded)` →
> `if (false)`) was applied to the real tree by hand and the **whole suite passed, 2210 / 0**. No test
> kills it. So run 1 was a **spurious kill**, and the serial run is the honest number.
>
> **Why it can happen with every test deterministic.** `coverageAnalysis: 'off'` + `testRunner:
> 'command'` + `inPlace: true` + `concurrency: 5` means **five full suites at once in ONE shared
> worktree**. Any test touching a path another worker also touches can fail for a reason that has
> nothing to do with the mutant, and under a `command` runner "the suite exited non-zero" IS the kill
> signal. Fixing one such test removes one occurrence; it cannot remove the arrangement that produces
> them.
>
> ➡️ **The rule this adds**: a **lone survivor, or a score that improves without a test being added,
> is not to be believed until it reproduces.** Cheap protocol, and it is what caught this one: re-run
> the file, and if the two runs disagree, decide it with `--concurrency 1` or by applying the mutant
> to the real tree by hand. Neither costs a minute on a single file.
>
> 🙋 **OWNER'S CALL, not urgent and not blocking v5.** Three options, and the trade-off is minutes
> against trust: (a) leave `concurrency: 5` and apply the protocol above per survivor — free, and the
> discipline is already written here; (b) drop the batch config to `concurrency: 1` — ~5× slower, and
> the ~30-min package run becomes impractical; (c) hunt the remaining shared-state tests one by one,
> which is what `211cfc5` did once already, with no way to know when the last one is found. **(a) is
> what this section does by default**; nothing below needs re-measuring on account of it, because the
> spurious kill was caught before its number was ever recorded.
>
> ### ⬇️ AND IT GOES THE OTHER WAY TOO — a FALSE SURVIVOR, which is the dangerous direction
>
> _(Measured at S10-2, 2026-08-21, on `36f2c5c`.)_ Both boxes above describe the judge inventing
> **kills**: the score reads too high, and the remedy is to distrust a good number. The same
> arrangement produces the mirror image, and this is the first time it was caught:
>
> | Run | Command | Score | Survivors |
> |---|---|---|---|
> | 1 | `mutate-one.mjs … engine-answers.mjs` | **78.33 %** | 13 |
> | 2 | the same command, same HEAD, same tests, minutes later | **80.00 %** | 12 |
>
> The mutant that moved is `&&` → `||` on `isEntry`. Applied to the real tree by hand, the suite goes
> **RED** — `✖ an entry with no version is NOT an answer` — 13 pass / 1 fail. **A test does kill it.**
> Run 1 reported it survived: the worker's suite must have exited **zero** for a reason unrelated to
> the mutant, most plausibly a run in which the failing test's process was not the one whose exit code
> the runner read.
>
> **Why this direction is worse, even though it costs points.** A spurious kill flatters you and you
> may never look. A false survivor sends you to **write a test for a hole that does not exist** — and
> the honest reading of "my test does not kill this" is "my test is wrong", so the natural next move is
> to *change a passing test until the number moves*. That is how a good assertion gets weakened by a
> measuring error. The protocol below is the only thing between that and a corpus quietly getting worse.
>
> ➡️ **The rule this adds, and it is now symmetric**: **no survivor is acted on until it reproduces or
> is hand-applied.** Not just the flattering numbers — *any* disagreement between two runs, in either
> direction, is the instrument talking. Hand-applying a mutant costs one command and answers it outright;
> **and a test may never be weakened to chase a survivor** — if the test is right, the number is wrong.

## Current scores (latest)

| Package | Mutation score | As of | Detail |
|---|---|---|---|
| **rag** | **90.42 %** | 2026-07-16 (post-B2/B3) | [re-audit #2](#full-rag-re-audit-2--2026-07-16-post-b2b3-hardening) — production-only. Not re-measured package-wide since; the [v4.4.0 targeted run](#v440--the-field-fixes-release-rag--scripts--2026-07-28--2026-08-02) over the 10 files that release changed reads **93.93 %**, with its two new files at **100 %**. The [v4.5.0 run](#v450--the-silence-stops-passing-release-rag--scripts--2026-08-03) over its 6 changed files reads **94.67 %**, with the file it creates at **100 %**. The [v4.7.0 run](#v470--the-short-visibility-release-rag--scripts--2026-08-05) over the 2 files that release changed reads **94.44 %** first pass, **100 % on both** after the survivors were closed |
| **scripts** (harness) | **97.27 %** | 2026-06-23 baseline | 3 weak files since hardened to 92–100 % (no full re-audit; `lib/**` already 100 %). The three files audited on [2026-07-27](#increment-25-engine-skill-refresh--step-10--2026-07-27) are now hardened too: `update-engine.mjs` **98.49 %**, `reconcile-brain.mjs` **96.45 %**, `engine-source.mjs` **93.02 %** (every survivor killed or recorded as equivalent). The four files touched on [2026-07-28](#v430-the-harness-side-of-the-review-fixes--2026-07-28) were measured the same way, after the review fixes: `engine-commit.mjs` **100 %**, `startup-sync.mjs` **100 %**, `repo-status.mjs` **97.44 %**, `auto-commit.mjs` **98.04 %** (98.37 % together, every survivor an accepted equivalent). ⚠️ **The baseline flatters the package**: the [v4.4.0 run](#v440--the-field-fixes-release-rag--scripts--2026-07-28--2026-08-02) measured 16 files one by one and found **two at 0 %** — `session-status.mjs` and `status-line.mjs`, top-level scripts no test can import. **[Named debt](#the-two-0--files--named-debt-and-not-a-regression)**, carried by every published tag. The [v4.5.0 run](#v450--the-silence-stops-passing-release-rag--scripts--2026-08-03) measured 15 more files one by one: **seven of them end at 100 %, twelve of the fifteen at 92 % or above**, and the three `session-*` scripts confirm the same top-level tier (`session-status.mjs` still **0 %**, inherited rather than new). The [v4.6.0 run](#v460--the-vaults-identity-release-scripts-only--2026-08-03) measured the 7 files that release changed: **all seven end at 96 % or above, two at 100 %**, every remaining survivor a pre-listed equivalent. It then ran a **second pass after the review fixes** (those fixes changed production code, so the first numbers no longer covered it): 4 files re-measured, 3 of them at **96.88–100 %**, plus `lib/hooks-reconcile.mjs` — a file this release only grazes — at **78.69 %**, whose 24 remaining survivors are pre-existing and named rather than implied. The [v4.7.0 run](#v470--the-short-visibility-release-rag--scripts--2026-08-05) measured the 4 files that release wrote: **83.33 % → 97.56 %**, two of them at **100 %**, the two survivors left both pre-listed equivalents — and the low first-pass number was a **design** defect (a fail-soft written twice, so neither half was observable), not thin tests. The [v4.8.0 run](#v480--the-release-that-looks-upstream-scripts-only--2026-08-05) is the biggest targeted pass so far — **16 files**, six batches: **thirteen end at 94 % or above**, one at 100 %, and the three that do not are the **named structural debt** (two files with no test sibling at 0 %, `engine-fetch.mjs`'s real git runner at 54.05 %), whose two remedies the owner **arbitrated into v4.9.0**, then **re-arbitrated in writing** (2026-08-08) onto the unfreeze release that follows it, rather than left implied. The [v4.9.0 run](#v490--the-universes-release-scripts-only--2026-08-08) measured the 6 files that release changed: **the two files it WROTE end at 100.00 % and 95.28 %**, `update-engine.mjs` at **98.44 %** and `reconcile-brain.mjs` at **96.11 %** — and the two entrypoint-tier files it merely grazed both **rose**, `session-universe.mjs` **39.39 % → 66.18 %** and `session-status.mjs` **0.00 % → 8.67 %**, still debt 1 rather than new rot. The [v4.9.1 run](#v491--the-switch-that-leaves-the-machine-scripts-only--2026-08-15) measured the 6 files that hotfix changed, over **three passes** (production moved twice): **the two files it WROTE both end at 100.00 %**, the untested CLI wiring goes **25 % → 100 %**, and the four others land at **95.92–99.66 %** — every survivor left a named equivalent. The [S0bis run](#s0bis--the-two-structural-debts-paid-scripts-only--2026-08-20) is not a release but the **debt run itself**: it pays both structural debts this table has flagged since v4.4.0 — the two entry-guard files quoted above at **0 %** (`status-line.mjs`, `upstream-check-run.mjs`) both end at **100.00 %**, `engine-fetch.mjs` goes **54.05 % → 84.21 %**, and a new repo-wide **guard test** makes the shape unrepeatable rather than merely fixed. **The tier is now closed**: `session-status.mjs`, held back the same day as a written arbitration because it is the one file that cannot be verified by running it, was answered by the owner and paid — **8.67 % → 96.10 %** over three rounds, its red taken inside a disposable worktree and its output proved byte-identical before and after. **No `scripts/*.mjs` sits in the 0 % tier any more**, for the first time since v4.4.0. The [v5.1.0 duo run](#84-duo--the-announcement-became-a-question-and-half-its-survivors-were-code-to-delete--2026-09-05) — the step the owner **held the release** on — measured the three files it writes at **84.60 % → 98.92 %** and the ranges it changed elsewhere at **92.02 % → 95.45 %**, with **fourteen** survivors left, every one of them a named equivalent of three classes. Half the first pass's survivors were answered by **deleting** production rather than adding tests: fail-open written twice, defaults nothing defaults to, re-validation of lists their reader had already normalised |
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

## #84 duo — the announcement became a question, and half its survivors were code to DELETE — 2026-09-05

State owned by
[`../plans/prospective/duo-source-identity-action.md`](../plans/prospective/duo-source-identity-action.md)
(step 8.8). The release was **held by the owner** on this step: a brain that reads who writes from git
author names alone told an owner with two Macs that *"a second person now writes here"*, and split
their day into one file per machine. The fix makes the announcement a **question**, remembered in a
registry that travels. This is that step's measurement.

Two batches, through `mutate-one.mjs` in a disposable worktree — **whole** for the three files step 8
creates, **hunk-scoped** for the ranges it changed in files that already had a measurement. Logs:
`reports/v510-duo-batch-a.log` (first pass), `v510-duo-batch-a3.log` (final),
`v510-duo-batch-b.log`, `v510-duo-batch-b2.log`.

| File (scope) | First pass | After | Survivors left |
|---|---|---|---|
| `lib/author-identities.mjs` (new, whole) | 82.18 % | **98.66 %** | 2, both equivalents |
| `lib/brain-author.mjs` (whole) | 91.94 % | **98.90 %** | 2, both equivalents |
| `author-identity.mjs` (new, whole) | 77.17 % | **99.24 %** | 1, an equivalent |
| **Batch A** | 84.60 % | **98.92 %** | 457 killed, 5 survived of 462 |
| `lib/universe-persist.mjs` (46-93) | **100.00 %** | — | 0 |
| `session-authors.mjs` (44-109) | 92.59 % | 92.59 % | 2, both equivalents |
| `lib/dated-note-path.mjs` (45-80) | 92.11 % | **100.00 %** | 0 |
| `lib/remote-sync.mjs` (150-176) | 80.00 % | 84.62 % | 2, both equivalents |
| `dated-note-path.mjs` (45-137) | 93.33 % | 94.59 % | 4, all equivalents |
| `remote-sync.mjs` (180-195) | 55.56 % | **88.89 %** | 1, an equivalent |
| **Batch B** | 92.02 % | **95.45 %** | 189 killed (2 by timeout), 9 survived of 198 |

### 🛑 The instrument first: two runs at once is not a slow measurement, it is no measurement

Both batches were started **together** on a 14-core machine, on the reasoning that 5 test runners each
would fit. They do not: every mutant runs the whole suite, the two runs starved each other, and batch
A came back with **456 of its 461 mutants TIMED OUT**. Had the runner not refused it, the arithmetic
would have read as a **100 %** — the exact T13 shape, one release later, caught this time by the
instrument's own timeout guard rather than by a human.

➡️ **The rule this adds**: a mutation run has the machine to itself. Sequential batches, always — the
wall-clock saved by overlapping them is the wall-clock of a result nobody may use.

### The finding that cost the most: one comparison, written three different ways

"Are these two spellings the same human?" existed in **three** places by the end of step 8 — the
arrival banner, the session line, and the note paths, the last one spelled
`base.author == null ? null : slugSafe(canonicalAuthor(base.author, identities) ?? "")`. The mutants
found all three, in the same shape each time: a `?? ""` placeholder whose survival says *nothing
distinguishes this default from any other string*.

It is worse than a duplicate. A placeholder makes two **anonymous** callers slug identically, so
`nobody === nobody` comes back **true** — which files a stranger's note into the owner's day and
silences the banner that would have shown it. The three collapse into one exported `personSlug`, which
asks the type instead of defaulting: not a name → `null`, and null matches nothing.

And the shared version answers a case the copy **crashed** on. A vault is a folder of text files a
human edits, so `author:` in a note's frontmatter can come back as a number, a date or a list; the old
expression called `slugSafe` on it and threw, inside the one command that tells the agent where to
write. Seen failing against the expression it replaces, then green.

### The wiring the whole suite was blind to — the T7 shape, twice in one step

`realTickDeps` builds the live sync's seams, and **every** tick test injects its own `identities`. So
the code that reads the real `.vault-rag/authors.json` was exercised by nothing, while its only
visible effect is a **native desktop banner a test may not raise** (thousands of popups under a
mutation run). Three mutants sat there untroubled: the reader returning `undefined`, the file access
replaced by `{}`, the whole thunk replaced by `() => undefined`.

It is now driven directly against a brain the test owns — answered, and unanswered — and both mutants
were hand-applied and seen to die. The same shape had already been caught **during** step 8 by adding
the key to the deps-shape assertion first; this is its other half.

### The split that made the number move: half the survivors were code to DELETE

Of the 75 survivors in the first pass, a large share were not missing tests at all. They were branches
no test could ever reach, and the honest answer is to remove them:

- a `existsSync` probe in front of a `try/catch` that already answers *"no file"* identically —
  fail-open written **twice**, so neither copy is observable;
- the optional chaining **inside** that same `try`;
- a null-slug filter on lookups no null slug reaches;
- the re-validation of two lists their reader has already normalised (`readAuthorsState` is now
  documented as the single normalisation point, and nothing downstream re-checks);
- two initialisers both branches overwrite — *a default nothing defaults to*, which the file next door
  already had a comment about;
- and a commit message composed **before** the refusal that guarantees its inputs, which needed a
  fallback for a canonical name that cannot exist.

### The words themselves, pinned — because asserting a constant against itself proves nothing

The question a duo meets at session start, the usage, both refusals and the two travel warnings were
all asserted with `assert.match(output, new RegExp(THE_CONSTANT))` — which passes whatever the constant
says, including nothing. They are now pinned **word for word**, and the healthy path asserts the
**absence** of every warning: a command that warns about a commit that succeeded is a command nobody
believes.

### The fourteen that stand, and why every one of them is an equivalent

Five in batch A, nine in batch B, and they fall into **three classes** — none of which a test could
separate without testing the mutant itself:

- **The `[]` fallback filled with a name** (`entrySlugs`, `markDistinct`'s alias list,
  `canonicalAuthor`'s, the confirmed-people set, the tick's identities, the entry point's identities
  and its notes) — mutated into `["Stryker was here"]`. Each fires only on a registry or a vault
  damaged by hand, and its one element is a **string every consumer already skips**: an entry with no
  readable name, or a note with no `path`. Only a collision with that exact literal could tell the two
  apart. The emptied `catch {}` mutants are the same finding from the other side — the fallback and
  the declaration now agree, so removing the assignment leaves `undefined`, which every consumer
  treats exactly like an empty list.
- **`readFileSync(p, "")`** in place of `"utf-8"`, in all three places the registry is read. Node does
  **not** throw on an empty encoding — it returns a **Buffer**, and `JSON.parse` accepts one. Checked
  by hand rather than assumed; the neighbouring finding in this register is a type check that judged a
  `Buffer` it should have stood down on.
- **A throw whose message nothing reads**: `throw new Error("no git history")` inside the session
  hook, caught two lines later by the block that keeps session start fail-open. The message is there
  for a human reading the source, and no surface can observe it.

## #84 — the `scripts/` files this branch changed after their own last run — 2026-09-03

State owned by
[`../plans/prospective/live-remote-sync-action.md`](../plans/prospective/live-remote-sync-action.md)
(step 3.7b). Run through `mutate-one.mjs` in a disposable worktree — hunk-scoped for the files that
already had a measurement, whole for the one this branch creates — in **two batches**, so neither
exceeds the runner's window. Logs: `reports/v510-scripts-batch-a.log`,
`reports/v510-scripts-batch-b.log`, `reports/v510-scripts-batch-b-recheck.log`.

Same reason as the section below: step 2.7 measured six files, and these seven were changed
**after** their own last run. The release is the union of the target lists, not the last one.

| File (scope) | First pass | After | Survivors left |
|---|---|---|---|
| `lib/filed-note.mjs` (6 hunks) | **100.00 %** | — | 0 |
| `lib/instrumented-source.mjs` (new, whole) | 80.95 % | **94.12 %** | 1, an equivalent |
| **Batch A** | 90.00 %* | **97.22 %** | 35 killed, 1 survived of 36 |
| `lib/ignore-base-settings.mjs` (47) | **100.00 %** | — | 0 |
| `lib/wiki-lint.mjs` (99) | **100.00 %** | — | 0 |
| `prompt-restart-nudge.mjs` (41-42, 64-74, 82-88) | 93.33 % | **100.00 %** | 0 |
| `lib/reconcile-brain.mjs` (501-502) | 33.33 % | **100.00 %** | 0 |
| **Batch B** | 82.14 % | **100.00 %** | 28 killed, 0 survived of 28 |

\* **Batch A's first-pass total is recomputed, not read off a log**: the runner reuses one log name
per batch, so the re-measurement overwrote it. 36 of 40 mutants, from the two file scores this plan
recorded at the time (19 + 21 mutants, 4 survivors). The per-file numbers are the measured ones; only
the batch line is arithmetic, and it is marked rather than passed off as a reading.

⛔ **`lib/actions-log-seed.mjs` was dropped from the targets, and it is not an omission.** Its whole
change is prose inside a template literal (the ledger's format line gains a `· <who>` field):
**zero mutants**. This register's own doctrine covers it — a file with no mutants is absent from the
table, not listed with a zero, and the score belongs to its neighbours.

### The finding that cost the most: a guard whose riders are never seen apart

`reconcile-brain.mjs` opened at **33.33 %** — four survivors on **one line**, and all four were the
same hole. The line is `if (unignored.changed || ignored.changed || arrivals.changed) write(…)`:
three migrations of the owner's `.gitignore` that share one read and one write. `|| → &&`,
`if (true)`, and dropping two of the three riders **all passed**, because **every existing test hands
the reconciler a brain where several riders have work at once**. The guard was never observed
deciding anything.

The case that mattered most was the missing one: **only the arrivals trace still to ignore** — which
is exactly a brain that predates the live sync receiving the line, the migration the plan calls
load-bearing. The field rehearsal proved it end-to-end on a copy of a real brain; **no unit did**.

➡️ **A condition with N riders needs N tests in which exactly one rider is true**, and the shape to
recognise is a fixture where the riders always travel together. A "converged" test is the other half:
it must prove **nothing was written**, and identical bytes cannot — a rewrite of the same text reads
the same. Pinning the file's mtime is what kills `if (true)`, and what it protects is real: this file
is the owner's, and every needless rewrite of it is a line in their `git status`.

### The behaviour call: a type check that judged what it should have stood down on

`isInstrumented` type-checked its argument and answered *no* to anything that was not a string. So a
caller who forgot the encoding handed it a **Buffer** and had its instrumented bytes **judged** —
the exact false verdict this module exists to prevent. It coerces now, and fails towards standing
down. The one survivor left is its fallback's *content* (`source ?? ""` → `source ?? "…"`): only the
absence of null is observable, so the value is unobservable by construction — an equivalent.

### And a separator nothing asserted

`prompt-restart-nudge.mjs` joins the restart blocker and the arrivals announcement into one payload
with a blank line between them; `join("\n\n") → join("")` survived. The tests pinned that both ride
in **one** string and that the blocker comes first, never that they stay **two paragraphs** — welded,
they reach Claude as a single run-on instruction. Ordering and separation are two claims, and only
one of them was written down.

### 🛠️ The runner itself refused a measurement it had really made — the mirror of T13

Found before batch B could be believed, fixed first (`97b8279`, 88 cases green). Stryker prints **one
row per FILE** however many ranges it is handed; the guard consumed **one row per TARGET**, so five
of six hunks of one file read as *"contributed no mutants at all"* — over 19 honestly-killed mutants
at 100 %. This is T13 pointing the other way: a **refusal nobody can trust gets bypassed within a
day**, which costs exactly what a green that lies costs. A guard that cannot be trusted is not a
conservative guard, it is a disabled one.

## #84 — the half the target list never named: the clock inside the search server — 2026-09-03

State owned by
[`../plans/prospective/live-remote-sync-action.md`](../plans/prospective/live-remote-sync-action.md)
(step 3.7 — a box added the day of the cut, because step 3 never had one). Config:
`stryker.rag.config.mjs`. Logs: `reports/v510-rag-changed.log`, then
`reports/v510-rag-changed-recheck.log`.

➡️ **Why this run exists at all, and it is the transferable part.** Step 2.7 measured **six files**
and read as "this chantier is mutation-tested". It was: the six files **its own target list named** —
all under `scripts/`. Meanwhile step 3 had written the clock in the **other** package (119 new lines
of scheduler, a new knob, a shutdown seam), and **no list named those**, so the run that looked like
the chantier's measurement had never touched them. **A per-step target list is a plan artefact, and
the release is measured by the union of them, not by the last one that ran.** The check that would
have caught it costs one command: `git diff --name-only main...HEAD` against what `RESULTS.md`
records.

| File (scope) | First pass | After | Survivors left |
|---|---|---|---|
| `lib/campaign-persist.ts` (48-55) | **0.00 %** | **100.00 %** | 0 |
| `lib/frontmatter-parser.ts` (21-26, 149-155) | 75.00 % | **100.00 %** | 0 |
| `lib/shutdown-plan.ts` (whole, 20 of 46 lines changed) | 80.00 % | **100.00 %** | 0 |
| `lib/remote-sync-scheduler.ts` (new, whole) | 86.11 % | **97.22 %** | 1, an equivalent |
| `lib/remote-sync-interval.ts` (new, whole) | 92.31 % | **92.31 %** | 1, an equivalent |
| **Batch** | **82.89 %** | **97.37 %** | 70 killed, 4 timeout, 2 survived of 76 |

### The one finding worth carrying: fifteen tests, and none of them ran the code that ships

The scheduler's five survivors were **four defaults in one constructor** —
`opts.log ?? console.error`, `opts.random ?? Math.random`, `opts.setTimer ?? setTimeout`,
`opts.clearTimer ?? clearTimeout` — plus a dead initializer. Its suite is a good one: a virtual
clock that honours each duration, a `clearTimer` double that **refuses a missing handle**, jitter
triangulated at three rolls. And that is exactly the problem: **every one of the fifteen tests hands
the scheduler its own timer, so the four implementations the server actually runs were executed by
nothing.** Each mutant emptied one of them to `() => undefined` with the suite green.

This is the **same finding as T7** (`lib/locale-drift.mjs`, one release earlier), on a different
package and a different collaborator, which is what promotes it from an anecdote to a shape:

➡️ **A parameter with a real-world default has TWO implementations, and a suite that always injects
the other one certifies nothing about the one in production.** The question to ask of any seam:
*when every test passes its own version of a collaborator, who runs the one that ships?*

Three tests answer it here, and each is deliberately narrow: the real `setTimeout` fires a tick and
the real `clearTimeout` cancels the pending one; the real `Math.random` produces a **finite** delay
inside the ±10 % band (a roll that answers nothing makes the delay `NaN`, which `setTimeout` treats
as **zero** — the configured cadence silently dropped, with nothing on screen to say so); and a
failed tick with no log injected reaches **stderr**, failing being the normal case for this loop.

⚠️ **The timeouts went 1 → 4, and they are honest kills of the strongest kind.** The real-timer test
keeps a live timer chain in the process, so a mutant that defeats `stop()` no longer merely
mis-counts — **the test process never exits**, which is precisely the defect the shutdown seam exists
against (a clock outliving its window keeps pulling into a brain nobody is looking at). 4 of 76 is
well under the 25 % share that means a starved runner rather than a detected mutant.

### The other three, in one line each

- **`REMOTE_SYNC_SCRIPT` could be emptied to `""`** — a constant the clock spawns by name, checked
  by nothing. This is the quietest failure the server has: the child exits non-zero, the tick reports
  `failed`, and the brain simply never catches up. Now checked against the two things that must agree
  with it — the file this repo ships (`statSync(...).isFile()`, because `existsSync("scripts/")` is
  **true** for the emptied name) and the manifest regime that carries it to a brain predating the
  feature.
- **The shutdown trace was matched on the error text only**, so the label naming *which* loop refused
  could be emptied with the suite green — and the label is the half that tells "the watcher is
  wedged" from "the clock is still pulling into this brain". Asserted whole.
- **A `sources` key had never been fed padding or a blank entry**, though a YAML block list and a
  hand-edited note both produce them, and a key is compared for **equality** against the one the
  capture path stamped. One case (`'  drive|1A2b  '`, `'   '`, `''` → one key) killed all four
  survivors in that hunk.

### The two survivors, named with their reason

- **`if (!trimmed) return DEFAULT` → `if (false)`** (`remote-sync-interval.ts`). Equivalent, and not
  dead code: the regex below it rejects `""` and answers the default anyway, so no test can
  distinguish the two — but the guard is what **narrows the type** from `string | undefined` for
  that regex. Removing it costs a `?? ""` whose own literal is an equivalent one line down, so the
  trade is one unkillable mutant for another, in a shape that would then differ from
  `local-mirror/src/lib/sync-interval.ts`, its twin one package over. Left as it is, deliberately.
- **`private stopped = false` → `= true`** (`remote-sync-scheduler.ts`). Equivalent: `start()` is the
  only door into the loop and sets the field itself before anything reads it, so the initial value is
  unobservable. It exists for `strict`'s property initialisation, and the sibling scheduler carries
  the same two statements for the same reason.

## #84 duo — per-person paths and the writer guard: the refusals nobody had read — 2026-09-03

State owned by
[`../plans/prospective/duo-source-identity-action.md`](../plans/prospective/duo-source-identity-action.md)
(steps 2.3 / 4.7). The four files step 4 wrote, plus the one step 2 changed. Two passes.
Log: `reports/mutate-one-dated-note-path+4.log`.

| File | First pass | After | Survivors left |
|---|---|---|---|
| `lib/brain-author.mjs` | **82.80 %** | **100.00 %** | 0 |
| `lib/dated-note-path.mjs` | **97.87 %** | **100.00 %** | 0 |
| `dated-note-path.mjs` (entry) | **66.67 %** | **98.75 %** | 1 equivalent, 2 timeout |
| `session-authors.mjs` | **79.55 %** | **95.35 %** | 2, both equivalents |
| `file-back-note.mjs` | not measured since it changed | **97.89 %** | 3, all equivalents |
| **Together** | **80.00 %** | **98.03 %** | 396 killed, 8 survived, 2 timeout |

_(`file-back-note.mjs` was re-measured on its own after the dead-initializer fix below: **96.50 % → 97.89 %**, `reports/mutate-one-file-back-note.log`. The batch figure above is the one before that fix, kept because it is what the batch measured.)_

**The 66.67 % was concentrated in one place: the REFUSALS.** Six of the entry point's error
paths shared a single test that checked `exit 2` and nothing else — so `--date` with nothing
after it, a lost quote around a folder name, a date that is not a day, and a missing flag all
"passed" the same assertion while saying whatever they liked. Each has a **different fix for
the caller**, which is the whole reason the message exists.

➡️ **A loop over broken inputs asserting only the exit code is a test of the code, not of the
tool.** Assert what each refusal SAYS, or the messages are unowned prose.

**Two seams had never been reached at all**, and both are the kind that fail silently in the
field rather than loudly in a suite:

- the path tool's **git wiring** was only ever exercised with an injected name, so nothing
  observed that it roots git on the brain (`-C <dir>`) rather than on the process's directory —
  and a git command run in the wrong place does not fail, it answers about **somewhere else**;
- the session hook's **marker**: the fixture's `.cache/` did not exist yet, so a non-recursive
  `mkdir` passed. Every brain the sync has ever ticked in already has that folder, where the
  same call throws, the marker is never written, and the sentence said "once" is said at every
  session start forever.

**Two pieces of production went with the survivors**, and both are the same shape as the
source-identity pass: `let x = []` that both branches overwrite is a **default that is really
dead code**, and it masks whether the `catch` still runs (the two mutants cover for each other,
so both survive). Plus a redundant second `return 0` in a fail-open catch.

**What is left is equivalents**, listed rather than implied: two encoding arguments replaced by
`""` (the family already recorded for #84 — Node accepts it and the buffer stringifies), a
`catch` assigning `[]` to a variable nothing distinguishes it by, `split(/\s+/)[0]` after a
`.trim()` (only a leading run could differ, and trim removed it), and two swallowed messages in
the hook's fail-open path.

## #84 duo — the source identity, and half the survivors were a design smell — 2026-09-03

State owned by
[`../plans/prospective/duo-source-identity-action.md`](../plans/prospective/duo-source-identity-action.md)
(steps 1.4 / 2.3). Two new files, measured whole the day they were written, then again after their
survivors were closed. Log: `reports/mutate-one-source-key+1.log`.

| File | First pass | After | Survivors left |
|---|---|---|---|
| `lib/source-key.mjs` | **82.39 %** | **98.04 %** | 3, of which 1 equivalent |
| `known-source.mjs` | **73.77 %** | **100.00 %** | 0 |
| **Together** | **80.17 %** | **98.60 %** | 209 killed, 3 survived, 2 timeout |

**The reusable lesson is that half of the first pass's survivors were not thin tests — they were
production carrying risk it did not need to carry.** The field table named each field's normalizer
with a **string** (`["channel", "id"]`), so a dispatch chain had to turn the label back into
behaviour; five `StringLiteral` mutants emptied a label and survived, because a label nothing checks
is a label a typo can silently change. Putting the **function** in the table deleted the labels, the
dispatch and the five survivors at once. Two more came from a presence check that ran **twice**, once
before normalization and once after — and only the second can be right, since a value that reduces to
nothing is missing whether or not it arrived empty. Two more from `.trim()` calls that were already
dead: whitespace is unsafe, so it becomes a hyphen and is stripped at the edge anyway.

➡️ **When a survivor sits on a string that names behaviour, or on a check the code performs twice,
reach for the production first.** A test written to kill it would be pinning a fact the design should
not have had.

The rest were genuine gaps, and every one of them is a key that would come out **different on the
other person's machine** — which is the one failure this whole chantier exists to prevent: an unsafe
RUN inside an id (one hyphen, not one per character), the hyphens a source really spelled, a
subject's accents, a long number that merely *ends* in thirteen digits (an unanchored epoch match
would key a real mail at a wrong instant), and a descriptor with no type at all.

Two assertions were also **right for the wrong reason**, which the score cannot see but the survivor
list points straight at: `isSourceKey` handed an ARRAY answered true (a regular expression
stringifies its argument), and a check written `assert.match(log, /read/i)` passed on the word
"al**read**y" — so the rule *"already held means go and READ it"* was never actually asserted.

**What is left**: one equivalent (`/\.\d+Z$/` losing its anchor — `toISOString` produces exactly one
`.mmmZ`, and nothing can precede it) and two timeouts on the entry point, which the `command` runner
counts as kills.

## #84 — the gate, re-measured after the field rehearsal changed it — 2026-09-02

The rehearsal on a copy of a real brain found a race in `lib/remote-sync-gate.mjs` (three windows
ticking, two through the gate), so the file below moved after the batch measured it. Re-measured
because the rule is that a file is judged the day it is written, and this one was written twice.

| Pass | Score | Killed / survived | What changed |
|---|---|---|---|
| Before the fix (2.7's recheck) | **83.53 %** | 14 survivors | the batch figure below |
| After the fix, before new tests | **66.67 %** | 66 / 33 | the fix added a whole branch the suite never reached |
| After the tests that branch deserved | **83.84 %** | 83 / 16 | back above the baseline, on a bigger file |

**The 66.67 % is the interesting number, and it is exactly what the instrument is for.** The fix
publishes the lock by writing it elsewhere and hard-linking it into place, with a fallback to the
old exclusive-create for filesystems without hard links. **Nineteen of the thirty-three survivors
sat in that fallback** — code no ordinary run reaches, because `link` answers on every filesystem
this project runs on. A green suite said nothing about it; the score named it in one line.

What closed them, and the shape is worth reusing: the fallback became an **export**, tested on its
own (it creates AND fills, refuses a taken name without overwriting the holder's record, and lets a
real failure through instead of reporting it as a lock somebody else holds), and `link` became an
**injected seam** so the fallback itself is exercised — with the injected link **counted**, or the
test would pass just as well with no fallback at all. Plus one property nobody had pinned: the
staging copy does not survive the tick, which is litter in every brain's `.cache/` otherwise.

The sixteen left are the same three shapes as before (an encoding argument replaced by `""`, an
emptied `catch { return null }`, an `fs` call failing with something other than `EEXIST`), plus one
new pair that is equivalent by construction: mutating `if (error.code === "EEXIST") return false`
in the atomic route sends the call into `exclusiveCreate`, which meets the same taken name and
answers `false` too. Same outcome, two ways.

## #84 — live sync between machines, the six files it writes — 2026-09-02

State owned by
[`../plans/prospective/live-remote-sync-action.md`](../plans/prospective/live-remote-sync-action.md)
(step 2.7). New files → measured whole, in one batch, twice: once the day they were written, once
after their survivors were closed. Logs: `reports/sync-84-batchA.log`, `reports/sync-84-recheck.log`.

| File | First pass | After | Survivors left | Read |
|---|---|---|---|---|
| `lib/gitignore-entry.mjs` | **100 %** | **100 %** | 0 | nothing to say, and it is the smallest |
| `remote-sync.mjs` (the entry) | 91.98 % | **99.00 %** | 2 | both `Number()`/`?? ""` already-trimming equivalents |
| `lib/remote-sync.mjs` (the tick) | 92.44 % | **98.32 %** | 2 | a `?? ""` with no slash in it, and `/\s+/`→`/\s/` before `[0]` |
| `lib/os-banner.mjs` | 88.35 % | **97.92 %** | 2 | one `?? ""` equivalent; the other closed in this pass |
| `lib/remote-arrivals.mjs` | 79.87 % | **94.97 %** | 8 + 1 timeout | the budget-loop bounds and the staging-file cleanup, below |
| `lib/remote-sync-gate.mjs` | **67.74 %** | **83.53 %** | 14 | every one an equivalent — read the next paragraph before believing the number |
| **Batch** | **86.17 %** | **95.98 %** | 28 of 697 | 668 killed, 1 timeout |

**The gate's 83.53 % is an effective 100 % on non-equivalents, and that claim is spent carefully.**
Its fourteen survivors are three shapes, none of them a thin test: (a) an encoding argument replaced
by `""`, which Node accepts on write and answers with a Buffer on read, so `JSON.parse` coerces it
back — *measured*, not assumed; (b) a `catch { return null }` emptied to return `undefined`, which
every caller treats identically (`!record`, and `at - undefined` is NaN, which no comparison passes);
(c) **the one real gap, and it is a cost decision**: an `openSync`/`rmSync` failing with something
that is not `EEXIST`. Producing that deterministically on both POSIX and Windows means either a
filesystem trick whose error code differs per platform, or an injected `fs` — a seam on the hottest
path of the gate, to observe a branch that only fires when the disk itself misbehaves. Not worth it.
The same class covers `remote-arrivals`' staging-file cleanup, which needs `writeFileSync` to fail.

### What the first pass actually bought — the part worth keeping

The score moved because **four defects were found, not because assertions were widened**:

1. **`Date.parse` answers NaN on a timestamp carrying a trailing newline.** The gate's `.trim()` on
   its last-tick marker was therefore load-bearing, and nothing said so. Removed, the marker reads
   as **absent** — and every window on the machine ticks at once, which is the exact failure the
   gate exists to prevent. Same shape one file over: git prints `\r\n` wherever `core.autocrlf` is
   on, so an untrimmed path matches no note on disk.
2. **The real liveness probe was measured by nothing.** Every test injected its own `isAlive`, so
   the one that runs on the fleet had no coverage at all. Now exercised against this very process,
   against a pid that does not exist, and against one we may not signal — **`EPERM` means alive**,
   which a bare `catch → false` gets backwards.
3. **`isNote` existed three times**, spelled identically in three files. Three chances to drift.
   One copy now, exported where the announcement lives.
4. **The banner's decision sat inside a catch-all**, where a guard that stopped working produced
   the same silence as a guard that worked. It is a pure function now, and the `try` covers only
   the spawn — the shape that also killed the last remaining killable survivor in the recheck.

### 🔕 And the one that was not in the code at all

The run **raised real desktop notifications on the maintainer's machine**, one per arrival test,
once per mutant — for two hours, until he reported them. The suite runs the real entry point, and
that entry point ends in a native banner. A single suite run raises a handful and nobody notices; a
mutation run runs the suite once per mutant, which is what made it visible. **Mutation testing found
a defect in the tests by being what it is**, before it ever reported a number.

The durable half is now rule 3 of [`../CONVENTIONS.md`](../CONVENTIONS.md) §5ter: **anything that can
surface outside the process is injected in tests, never merely switched off** — a switch is one
mutant away from being on. And a second flake surfaced in the same hour, worth recording beside it: a
test asserting `indexLockPresent()` on **this repo's** working copy went red because a stale
`.git/index.lock` was lying around after an interrupted command. A test that fails on the weather is
worse than no test; it now runs against a directory it owns.

---

## T15 — the careful invocation was the live one — 2026-08-23

`0286481`. State owned by
[`../plans/archived/2026-08-23-v5-code-review-triage-action.md`](../plans/archived/2026-08-23-v5-code-review-triage-action.md).
EXISTING file changed → measured **on THOSE LINES ONLY**: `--mutate
"maintainers/mutation/mutate-one.mjs:109-146"` through the maintainers config.
**49 killed, 0 survived, 2 timeouts (3.9 %, well under the 25 % tell) → 100.00 %.**

**Reproduced through the real CLI as a process** before a line changed: `--worktree` and `--log` took
`argv[++i]` whatever it was, so `mutate-one.mjs <target> --worktree --dry-run` meant *"a worktree
named `--dry-run`, and no dry run"* — a real Stryker run, a real score, exit 0, and a stray directory
beside the repo, **for the person who was being careful**.

🧭 **Why two earlier passes hardened these exact two arguments and neither saw it.** F6 checked the
worktree name's SHAPE, S2 checked the log name's, and `isPlainName` allows `-` because
`kenjaku-mut-one` needs it. Both were answering *"what does this value look like?"*, and the question
here is **"was that ever a value?"** A guard cannot find a defect it is not asking about, however
many times it is pointed at the same line.

---

## T14 — one word for two kinds of bad news, and the honest one was crying wolf — 2026-08-23

`49fa874` (the two verdicts) + `9e431a4` (the instrument that could not read its own 100). State owned
by [`../plans/archived/2026-08-23-v5-code-review-triage-action.md`](../plans/archived/2026-08-23-v5-code-review-triage-action.md).
EXISTING files changed → measured **on THOSE LINES ONLY**.
**Reproduce**: `node maintainers/mutation/mutate-one.mjs "scripts/lib/engine-ancestor-fetch.mjs:53-144"
"scripts/update-engine.mjs:404-417" "scripts/lib/plural.mjs:36-38" --log t14-ancestor-verdicts.log`,
and for the runner half `--mutate "maintainers/mutation/mutate-one.mjs:339-346,…:369-369"` through the
maintainers config.

| Run | Mutants | Score | Survivors |
|---|---|---|---|
| the two verdicts, three files (`49fa874`) | 66 | **100.00 %** | 0 |
| the colour strip in the runner (`9e431a4`) | 5 | **100.00 %** | 0 |

**The defect, reproduced through the real formatter before a line was changed**: a git that answers
`ok` to both the fetch and the show, handing back bytes that are not this brain's original, produced
*"could not reach the update server … the next update will try again"*. Both halves false, and the
second one permanently: the retry repeats the run word for word. Two channels now — `unreachable`
(a tag that never came down, retryable) and `unmatched` (git answered, nothing published matches) —
kept apart all the way to the owner's screen, because the sentence asserts a **cause**.

🎯 **AND THE RUN THAT MEASURED IT FOUND THE INSTRUMENT'S OWN BLIND SPOT** — see the box at the end of
§ T13 above. `parseMutationReport` announced **`✅ Mutation score null %` over a table reading 100.00**,
because T13's colour strip had been applied to one of this file's two parsers. The 66/0 above was read
off the table by hand first, then re-read by the fixed parser and by a fresh `mutate-one` run printing
`✅ Mutation score 100 %` as a process. **A score is only as good as the thing that prints it**, which
is the whole argument of the section below.

---

## T13 — the instrument printed ✅ over a run that had measured NOTHING — 2026-08-23

`658c348` (the two gates) + `da1fe2e` (the survivors' poles) + `3eec3cc` (a dead disjunct removed) +
`74fb898` + `d48d2c5` (the colour strip). State owned by
[`../plans/archived/2026-08-23-v5-code-review-triage-action.md`](../plans/archived/2026-08-23-v5-code-review-triage-action.md).
EXISTING file changed in five places → measured **on THOSE LINES ONLY**.
**Reproduce**: `npm --prefix maintainers/mutation run mutate:maintainers` scoped with
`--mutate "maintainers/mutation/mutate-one.mjs:354-357,…:361-416,…:438-452,…:617-632,…:636-645"` for
the gates, and `…:330-345` for the colour strip. Logs are the run's own, under the job's tmp dir.

**Every number on this page came through `parseMutationReport`, and it had two ways of saying
nothing while looking like a result.** Both were reproduced through `runMutateOne` itself before a
line was changed, never argued from the source:

- **Nothing measured at all.** With zero mutants Stryker still prints its table, with `n/a` in the
  score column (`clear-text-score-table.js`: `isNaN(score) ? 'n/a' : score.toFixed(2)`) and three
  zeroes in the counts — and this repo's configs set `thresholds.break` to null, so it **exits 0**.
  `Number("n/a")` is NaN, `total ? timeout / total : 0` is 0, both gates missed, and the run
  announced `✅ Mutation score NaN % — 0 killed, 0 survived, 0 timeout`.
- **A TARGET measured nothing.** A file that produces no mutants is not listed with a zero, it is
  **absent**, and the score belongs to whatever else was in the batch. This is T4's first run, one
  day earlier: a range typed `:34-52` over a guard sitting on line 53 measured `engine-ancestor.mjs`
  not at all and printed 100 %.

| Run | Mutants | Score | Survivors |
|---|---|---|---|
| first pass (`658c348`) | 96 | 91.67 % | 8 |
| after the two poles (`da1fe2e`) | 96 | 96.88 % | 3 |
| after the dead disjunct went (`3eec3cc`) | 84 | 97.62 % | 2, both equivalent |
| final, the whole changed set (`d48d2c5`) | 91 | **97.80 %** | 2, both equivalent |
| the colour strip alone (`d48d2c5`) | 22 | **100.00 %** | 0 |

**The two equivalents are PROVED, and proved by measurement rather than by argument** — replayed over
**all 98 real Stryker logs this repo has kept**:

- `cells.length >= 8` → `> 8`: **0 logs disagree**. Every table row Stryker emits has nine cells; the
  only eight-cell line in the whole corpus is the blank `| % Mutation score |` header, whose name is
  empty, which the tree walk drops on the next row either way.
- `const dirs = []` seeded with a value: **0 logs disagree**. A file row at depth 1 slices nothing off
  the stack, and a deeper one is always preceded by the depth-1 directory row that truncates it.

🧭 **The survivor that was DELETED rather than tested**, which is the shape T11 met two days ago:
`path === reported` in the target census had never once been the reason a target matched. `parseArgs`
refuses every target outside `scripts/`, and Stryker's table drops the prefix its files share, so a
reported path is always a strict tail. The comment carries the reason now; the branch does not.

🔦 **And the corpus was AUDITED rather than trusted, because the queue's own question was "how much
are the T1–T12 numbers worth?"** Answer, measured: **97 of the 98 kept logs carry a real score**, the
98th has no table at all (a crashed run, which the tool already refuses). **No score on this page came
from a run that measured nothing.**

⚠️ **But one kept log IS the second defect, in the wild, and it is recorded rather than smoothed
over.** `reports/mutate-one-adopt-engine-file-136-136+8.log` (2026-08-22, the S10-6 row *"after
deleting the dead arm — 13 mutants, 100.00 %"*): the run named **nine** hunks and its breakdown holds
**two files**, `engine-answers.mjs` and `engine-merge-apply.mjs`. The thirteen mutants were really
killed, so the number is not false — but its **scope is narrower than the row's heading**, and
nothing in the run said so. That is exactly the line the gate now prints instead.

📌 **The papercut that travelled with it.** `parseTestCounts` was ANSI-blind: under any environment
asking for colour, node --test wraps its summary (`\x1b[34mℹ pass 22\x1b[39m`), both anchors match
nothing, and the write-guard gate aborts a **perfectly green** run with *"did not report a result"*.
It failed loudly, which is the right direction, and the workaround was `NO_COLOR=1 FORCE_COLOR=0` on
every invocation — a thing to remember, so a thing to forget. Stripped now, for any SGR spelling: the
first pass scored 75 % with both survivors in the parameter-list group, since nothing had fed it
`\x1b[1;34m` or the bare reset `\x1b[m`.

🛑 **AND THE FIX ABOVE WAS ONE FUNCTION SHORT — found the next day, by the first run that took it at
its word** _(2026-08-23 · T14's own measurement · `parseMutationReport`)_. Dropping the workaround is
what exposed it: `parseMutationReport` reads the SAME terminal output and was never taught the same
lesson, so Stryker's two colourised score columns (`|\x1b[32m 100.00 \x1b[39m|`) reached `Number()`
as NaN. The killed and survived counts kept reading — those columns are not coloured — so the run
announced **`✅ Mutation score null %` over a table whose every row said 100.00**. Worse than
cosmetic: `null` is precisely the tell T13 had just installed for *"this run measured nothing"*, and
here it fired on a **perfect** score, in a runner whose whole job is to make an unmeasured run
impossible to miss. **This is T10's lesson for the fifth time on this branch** — the call site a
finding names is a sample, not the census. The rule now has ONE home (`withoutColour`), read by both
parsers, and the colourised table is pinned against the plain one in two SGR spellings.

---

## T9 — a fix in the file the instrument CANNOT reach, for the second time — 2026-08-23

`c3f26bd` (the fix) + `175eb6b` (the pole that read its own source). State owned by
[`../plans/archived/2026-08-23-v5-code-review-triage-action.md`](../plans/archived/2026-08-23-v5-code-review-triage-action.md).

🚧 **NO SCORE, AND THAT IS THE HONEST ANSWER.** `scripts/status-line.mjs` is **`merge`-regime**, and
T2's box below already named the consequence: Stryker instruments the file it mutates, the S7-2
freshness guard hashes exactly those bytes, and the dry run goes red before the first mutant. **Any
pass targeting `auto-commit`, `auto-push`, `status-line` or `verify-rag` fails this way.** The tool
refused loudly and scored nothing rather than scoring the rest, which is its charter.

**What stands in for the score**, and it is the shape RESULTS.md § S7-5 prescribes for exactly this
class of defect: *"a missing option is invisible from a return value, since the command still
succeeds"*. So the invocation is asserted **whole** — command, argv and the entire options object,
`maxBuffer` included — through an `execFile` seam, and both branches of the try/catch have a pole
(an `ENOBUFS` throw must still answer `""`, because a status line may never break a session).

**And a second pole that a value assertion cannot replace.** Re-inline the ceiling as
`64 * 1024 * 1024` and the whole-invocation pole stays **green**: it is the same number. Verified by
hand — only the source-level pole goes red, which is what makes F10's closing line
(*"one named ceiling, imported by all four git seams — do not re-inline the number"*) enforceable
rather than aspirational.

⚠️ **A POLE THAT READS ITS OWN SOURCE MUST SUBTRACT, NEVER COUNT.** The first version demanded exactly
one `maxBuffer:` in the file. Under in-place instrumentation every expression is emitted twice, so it
was red in the dry run on its own account — a self-inflicted second reason the file could not be
measured, on top of the structural one. Written as *"no `maxBuffer:` is anything other than the
imported name"*, it says the same thing and survives its own tooling.

---

## T8 — one question, four doors, and the scanner found the fourth — 2026-08-23

`85c2167` (the fix) + `2013d0d` (the scanner's whitespace). State owned by
[`../plans/archived/2026-08-23-v5-code-review-triage-action.md`](../plans/archived/2026-08-23-v5-code-review-triage-action.md).
Scoped to the **new module** and to the **four changed guard lines**.

| File (lines) | First pass | After | Survivors |
|---|---|---|---|
| `update-mode.mjs:33-55` (the predicate + its scanner) | **82.61 %** — 4 survived | **100 %** — 23 killed | 0 |
| the four guard call sites (`skill-retirement-fs`, `engine-ancestor-fetch`, `engine-merge-apply`, `reconcile-brain`) | **100 %** | **100 %** — 18 killed | 0 |

**Reproduce**: `FORCE_COLOR=0 NO_COLOR=1 node maintainers/mutation/mutate-one.mjs
scripts/lib/update-mode.mjs:33-55`, then the same with `scripts/lib/skill-retirement-fs.mjs:46-48
scripts/lib/engine-ancestor-fetch.mjs:53-53 scripts/lib/engine-merge-apply.mjs:49-49
scripts/lib/reconcile-brain.mjs:748-748`. Twice each: **100 %, 23 and 18 mutants, both times**, and
all four doors are named in the second breakdown. Logs [`t8`](reports/t8) / [`t8-confirm`](reports/t8-confirm)
and [`t8-doors`](reports/t8-doors) / [`t8-doors-confirm`](reports/t8-doors-confirm).

**THE SCANNER PAID FOR ITSELF BEFORE THE FIX WAS EVEN GREEN.** The finding named three places asking
*"update or self-heal?"*; the repo-wide test's first red listed **four**, and the extra one was
`announceWhatTheOldRecapCannot` — a misspelled self-heal would tell a converged brain it was catching
up every single morning. A hand-audit of a phrase is exactly what missed it twice already: a raw
`sourceDir === brainDir` reads identically to the safe version, which is how it got through review,
and a machine does not have that problem.

**Two of the four survivors were the same quantifier**, `\s*` narrowed to `\s` on either side of the
operator. Every fixture had exactly one space — and neither `sourceDir===brainDir` nor a comparison a
formatter has wrapped across a line is hypothetical. **A scanner a line break defeats is one nobody
can rely on**, and nothing said otherwise. The third was the filter that makes the
`(sourceDir|brainDir)` alternation safe on both sides: no pole said `brainDir === brainDir` is a
tautology rather than a defect.

➡️ **And every door was poled on BOTH sides of the boundary**: a spelling that names the brain
refrains, *and* a launcher path that merely starts with the brain's still acts. Without the second
half the fix buys silence instead of safety — the same shape T6's stray-artifact filter needed, six
findings earlier.

---

## T7 — a guard that measured nothing, and the units that could not see it — 2026-08-23

`00caad7` (the fix) + `977cdb8` (the refusal's message). State owned by
[`../plans/archived/2026-08-23-v5-code-review-triage-action.md`](../plans/archived/2026-08-23-v5-code-review-triage-action.md).
Scoped to the **changed lines only**.

| File (lines) | First pass | After | Survivors |
|---|---|---|---|
| `locale-drift.mjs:37`, `:69`, `:120-126` | **90 %** — 1 survived | **100 %** — 10 killed | 0 |

**Reproduce**: `FORCE_COLOR=0 NO_COLOR=1 node maintainers/mutation/mutate-one.mjs
scripts/lib/locale-drift.mjs:37-37 scripts/lib/locale-drift.mjs:69-69
scripts/lib/locale-drift.mjs:120-126`. Twice: **100 % both times, 10 mutants both times**, and the
file is named in the per-file breakdown. Logs [`t7`](reports/t7) and [`t7-confirm`](reports/t7-confirm).

**EVERY UNIT IN THAT FILE INJECTS ITS OWN `git`, SO THE ONE THING THAT WAS WRONG WAS NEVER RUN.** The
seam is excellent for what it tests — the criterion, the parsing, the pairing — and it is precisely
why nine tests and an anti-vacuity companion all stayed green while the guard, run from `scripts/`,
reported **0 drifts** where the root reported 1. The defect lived in the default the seam replaces.
So the pole runs the module **as a process** from a temp dir, in no repository at all, and asserts a
sha only this repository can produce: it fails one way if the invocation is unrooted (git refuses
outright) and another if it is rooted somewhere else.

➡️ **This is the entry-point seam rule applied to a DEFAULT, not to an entry point.** A parameter with
a real-world default has two implementations, and the tests were all exercising the other one. The
transferable question: *when every test passes its own version of a collaborator, who runs the one
that ships?*

**And the survivor was half a sentence.** The refusal message's second clause — *"the pair would read
as in sync without being measured"* — could be emptied with the suite green, because the pole matched
on the twin's path. Named alone, "cannot place X" reads like a missing file rather than a void
measurement, which is the whole distinction the throw exists to draw. Asserted whole now, for the
reason `describeDrift`'s own pole already gave one screen up: **this message is the feature.**

---

## T6 — thirteen anchors nobody had tested, on a filter whose ONLY safety is its anchors — 2026-08-23

`1604d3e` (the fix) + `67682ad` (the survivors' poles). State owned by
[`../plans/archived/2026-08-23-v5-code-review-triage-action.md`](../plans/archived/2026-08-23-v5-code-review-triage-action.md).

| File (range) | First pass | After | Survivors |
|---|---|---|---|
| `engine-base.mjs:73-91` (`STRAY_ARTIFACT_PATTERNS`) | **35 %** — 13 survived | **100 %** — 26 killed | 0 |
| `engine-base-fs.mjs:87` (the filter's one call site) | **100 %** | **100 %** | 0 |

**Reproduce**: `FORCE_COLOR=0 NO_COLOR=1 node maintainers/mutation/mutate-one.mjs
scripts/lib/engine-base.mjs:73-91 scripts/lib/engine-base-fs.mjs:87-87`. Twice after the fix: **100 %
both times, 26 mutants both times**, both files named in the breakdown. Logs:
[`t6-survivors`](reports/t6-survivors) (the 35 % first pass, and the thirteen names are the point),
then [`t6`](reports/t6) and [`t6-confirm`](reports/t6-confirm).

**ALL THIRTEEN SURVIVORS WERE THE SAME ANCHOR, AND THE ANCHOR IS THE WHOLE SAFETY ARGUMENT.** The
filter silences files the engine never delivered, so its one forbidden failure is eating a real one —
and the only thing standing between the two is that every pattern is anchored at the END of a name
(`.bak` as a suffix is junk, `bak.md` is somebody's skill). Stryker deleted every `$`, and the four
OS patterns' `(^|\/)` → `(\/)`, **with the suite green**.

The negative that existed tested names that **start** with those letters — a case no anchor is
load-bearing for. What kills them is the pair the anchors actually separate: a name that **contains**
an ending without ending in it (`SKILL.md.bak.md`, `notes~2.md`, `.DS_Store.md`), and a dropping at
the brain's **root**, where Finder and Explorer really leave theirs and where only the `^` arm can
reach.

➡️ **Same family as T2's coupling scanner, two days apart**: a matcher passed every case written for
it while being a guess about **where a match may start and end**. When a fix's safety rests on a
boundary, the boundary is the thing to triangulate — the happy path proves nothing about it.

---

## T5 — the collector past the point of no return — 2026-08-23

`21aefbf`. State owned by
[`../plans/archived/2026-08-23-v5-code-review-triage-action.md`](../plans/archived/2026-08-23-v5-code-review-triage-action.md).
Scoped to the **changed lines only** (`engine-adopt.mjs:222`, `:257`, `:272`).

| File (lines) | Score | Survivors |
|---|---|---|
| `engine-adopt.mjs` (the collector, its call, its return) | **100 %** | 0 |

**Reproduce**: `FORCE_COLOR=0 NO_COLOR=1 node maintainers/mutation/mutate-one.mjs
scripts/lib/engine-adopt.mjs:222-222 scripts/lib/engine-adopt.mjs:257-257
scripts/lib/engine-adopt.mjs:272-272`. Twice: **100 % both times, 4 mutants both times**, and the file
is named in the per-file breakdown — the check T4's near-miss earned.

**RETURNING the collector is what made it measurable, and that is the transferable half.** The first
shape passed `unreadable: []` and threw the array away. It was correct and **unkillable**: the
`ArrayDeclaration` mutant (`[]` → `["Stryker was here"]`) only adds a name nothing else ever reads, so
no input distinguishes them — the very shape T3 deleted a day earlier. Returning it as
`{ adopted: true, unreadable }` makes the same value observable, and the deepEqual poles kill the
mutant on sight. **A value nobody reads cannot be tested; the fix is usually to give it a reader, not
a test.**

---

## T4 — the invited carve-out, and a RANGE that measured nothing without saying so — 2026-08-23

`09e0506`. State owned by
[`../plans/archived/2026-08-23-v5-code-review-triage-action.md`](../plans/archived/2026-08-23-v5-code-review-triage-action.md).
Scoped to the **changed lines only**.

| File (range) | Score | Survivors |
|---|---|---|
| `engine-ancestor.mjs:34-53` (the `invited` skip) | **100 %** | 0 |
| `engine-source.mjs:56-60` (`invitedEdits` + its fleet fallback) | **100 %** | 0 |

**Reproduce**: `FORCE_COLOR=0 NO_COLOR=1 node maintainers/mutation/mutate-one.mjs
scripts/lib/engine-ancestor.mjs:34-53 scripts/lib/engine-source.mjs:56-60`. Run twice per the
lone-survivor protocol: **100 % both times, 8 mutants both times.**

🚧 **AND THE FIRST RUN OF THIS PASS MEASURED THE FIX NOT AT ALL — caught by reading the per-file
breakdown, not by anything the tool said.** The range was typed `:34-52` and the guard being tested
sits on line **53**, one line past the end (a fifteen-line comment block stands between the function's
head and its first statement). The run reported **✅ 100 % — 6 killed** and listed **only
`engine-source.mjs`**: `engine-ancestor.mjs` contributed zero mutants and was silently absent from the
table. Widening to `:34-53` brought it to 8 mutants and named both files.

➡️ **This is T13 in the wild** (*"a mutation run that measured NOTHING prints a green tick and exits
0"*), on its third trigger — a range landing entirely on comments, which the finding notes produces
**no warning at all**. The cheap discipline until T13 is paid: **read the per-file breakdown, and
distrust any run whose file list is shorter than the file list you asked for.**

---

## T3 — the collector on the writer path, and a fallback nothing could reach — 2026-08-23

`ab1751d` (the fix) + `6219f6f` (the survivor's removal). State owned by
[`../plans/archived/2026-08-23-v5-code-review-triage-action.md`](../plans/archived/2026-08-23-v5-code-review-triage-action.md).
Scoped to the **changed lines only**, never the files.

| File (ranges) | First pass | After | Survivors |
|---|---|---|---|
| `engine-base-fs.mjs:138-148` | **90.91 %** — 10 killed, 1 survived | **100 %** — 6 killed | 0 |
| `reconcile-brain.mjs:161-166` + `:574-580` + `:713-721` | **100 %** — 9 killed | **100 %** — 9 killed | 0 |

**Reproduce**: `FORCE_COLOR=0 NO_COLOR=1 node maintainers/mutation/mutate-one.mjs
scripts/lib/engine-base-fs.mjs:138-148 scripts/lib/reconcile-brain.mjs:161-166
scripts/lib/reconcile-brain.mjs:574-580 scripts/lib/reconcile-brain.mjs:713-721`. Run twice, per the
lone-survivor protocol at the top of this file: **100 % both times, 15 mutants both times.**

**The one survivor was the guard the fix did not need**, and it is a shape worth naming beside the
`?? ["Stryker was here"]` family above: `new Set(unreadable ?? [])` mutated to
`new Set(unreadable ?? ["Stryker was here"])`, and **no input can kill it** — the only caller that
reaches that line with a null collector is one for which nothing was set aside, so the fallback's
contents can never change an answer. `new Set(null)` is already the empty set, so the honest reply was
to delete the fallback rather than write a test around it. **The mutant count fell 20 → 15 with the
guard**, which is the tell: five of the twenty mutants lived in a branch that had no behaviour behind
it.

---

## T2 — the coupling guard, and a file the instrument CANNOT reach — 2026-08-23

`814be9a` (the fix) + `6e0181c` `566ba35` (the survivors' poles). State owned by
[`../plans/archived/2026-08-23-v5-code-review-triage-action.md`](../plans/archived/2026-08-23-v5-code-review-triage-action.md).
NEW module → measured **on its lines only**.

| File (range) | First pass | After | Survivors |
|---|---|---|---|
| `scripts/lib/engine-script-coupling.mjs:21-40` (`findSiblingImports`) | **90.91 %** — 20 killed, 2 survived | **100 %** — 22 killed | 0 |

**Reproduce**: `node maintainers/mutation/mutate-one.mjs "scripts/lib/engine-script-coupling.mjs:21-40"`.

**All three survivors were boundaries, and all three were guesses** — the scanner passed every case
written for it while being quietly wrong about where a match may start and end: the `^` alternative (a
specifier context opening the file, i.e. a dynamic `import()` on line 1), `\s+` vs `\s` (one space
between `from` and its specifier in every fixture, so trimming ONE character was indistinguishable),
and the trailing `$` (which turns *"the context immediately precedes the specifier"* into *"it appears
somewhere above it"* — the false positive being the ordinary shape of every module in this repo).

🚧 **AND ONE HUNK OF THIS FIX COULD NOT BE MEASURED AT ALL — named rather than silently dropped.**
`scripts/auto-commit.mjs:77-79`, the `isEntryPoint` compatibility alias, is in a **`merge`-regime**
file. Stryker instruments the file it mutates, so its bytes change — and the S7-2 freshness guard
(*"the table covers every merge file of the release being cut"*) hashes exactly those bytes and goes
red in the dry run. The whole batch then measures nothing. **The tool refused loudly rather than
scoring the rest**, which is the behaviour its charter promises, so this is a limitation to know about,
not a defect to fix: **any pass targeting one of the four merge-regime scripts (`auto-commit`,
`auto-push`, `status-line`, `verify-rag`) will fail this way.** What stands in for it: the alias is
three lines delegating to `isEntrypoint`, and its two tests assert `true` and `false` by strict
equality on both branches, so the block mutant (`{}` → `undefined`) is killed by either one.

---

## W6 — the CRLF cut, and the SAME instrument lie two hours after it was written down — 2026-08-22

`3b6820b` (the fix) + `87e9be1` (the survivor's pole). State owned by
[`../plans/archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md`](../plans/archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md).
NEW function in an existing file → measured **on those lines only**.

| File (range) | First pass | After | Survivors |
|---|---|---|---|
| `scripts/lib/engine-fingerprint-table.mjs:75-88` (`deliveredSources`) | **80 %** — 4 killed, 1 survived | **100 %** — 4 killed | 0 |

**Reproduce**: `node maintainers/mutation/mutate-one.mjs "scripts/lib/engine-fingerprint-table.mjs:75-88"`.

🛑 **AND THE PASS BEFORE THOSE TWO MEASURED NOTHING — the W1 box below is the same finding, written
two hours earlier, by the same session.** The first run over the uncommitted change reported
`✅ 100 % — 8 killed` for lines that were still `buildFingerprintTable`'s. **The rule "COMMIT, THEN
MUTATE" existed, in this file, in bold, and did not fire.** What caught it the second time was not the
rule: it was **reading the reset sha the runner prints** (`git reset --hard b279144…`) and noticing it
was the parent commit. A written rule competes with an output that says `✅` either way, and the output
wins.

➡️ **So the remedy is not a third restatement.** `mutate-one.mjs`'s own header charter is *"a loud
failure instead of a score that was never measured"*, and it already refuses a stale log, a starved
timeout share and a skipping write-guard. **A dirty working tree on a TARGETED file is exactly that
class and is not guarded** — it is the one precondition the tool can check for free (`git status
--porcelain -- <targets>`) and the only one that has now been met twice in one night.

✅ **BUILT** _(2026-08-22 · `ced15a0` + the survivors' poles)_ — see § *The gate that makes this box
historical*, below. **The rule stops being something to remember.**

---

## The gate that makes the box above historical — 2026-08-22

`ced15a0`. The refusal `mutate-one.mjs` never made: **a target that is not committed stops the run**,
because the worktree is built at HEAD and a pass over an uncommitted change scores the old bytes and
prints `✅` in the same words.

| File (range) | First pass | After | Survivors |
|---|---|---|---|
| `maintainers/mutation/mutate-one.mjs` (`targetPaths`, `uncommittedTargets`, the gate) | **93.94 %** — 31 killed, 2 survived | **100 %** — 33 killed | 0 |

**Reproduce**: `npm --prefix maintainers/mutation run mutate:maintainers` scoped with
`--mutate "maintainers/mutation/mutate-one.mjs:191-193,…:200-205,…:320-338"`. _(This file is under
`maintainers/`, so `mutate-one` refuses to mutate itself — it is the `scripts` package's runner. The
maintainers config is the one that measures it.)_

🧭 **Neither survivor asked for more code, and both are shapes this corpus has met before:**

- `line.length > 3` → `>= 3`. git cannot emit an entry with an empty path, so the boundary looked
  decorative. **Killed by feeding the shape it excludes** (`"M  "`), not by rewording the condition —
  the same answer W3's four survivors got. The alternative considered and rejected: rewriting the
  filter as a regex, the way `parseLsFilesEolZ` did for its `indexOf` survivors. Here it would only
  have moved the unkillable boundary into a `.+` nobody feeds either.
- `command: "git"` → `command: ""`. It survived because the assertion read `args` alone. **The test
  file's own header says a double that ignores its arguments certifies nothing** — the assertion was
  committing that error one level up. The whole call is asserted now, `cwd` included: the same
  question asked from another directory answers about another tree.

⚠️ **What it does NOT guard, deliberately**: `--dry-run` still runs nothing, this gate included. The
gate protects a **score**, and a dry run produces none; a dry run that shells out is not a dry run.

**The one real survivor**: `eolByPath?.[…]` → `eolByPath[…]`. No caller omits the map, so the optional
chain was unkillable — and the fix was to **delete it**, not to cover it. The two failures are not
symmetric: a crash stops a release being cut, a silent verbatim fold **ships a CRLF table that reads as
normal** and leaves the fleet frozen. A pole now pins the throw, so re-adding the guard goes red instead
of going quiet. Same shape as W2's six survivors — the run asked for LESS code, and was right.

---

## W3 — the regime list advances, and the survivors were all the absent case — 2026-08-22

`df09f17` (the slice) + `ea85b07` (the survivors' test). State owned by
[`../plans/archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md`](../plans/archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md).
EXISTING files changed by a few lines → measured **on THOSE LINES ONLY**.

| File (range) | First pass | After | Survivors |
|---|---|---|---|
| `scripts/lib/engine-source.mjs` (`advanceRegimes`, :134-135) | 89.47 % — 8 survived, **4 of them mine** | **94.74 %** | **0 on the changed lines** |
| `scripts/update-engine.mjs:686-690` (the step-7 wiring) | **100 %** — 1 killed | — | 0 |

**Reproduce**: `node maintainers/mutation/mutate-one.mjs scripts/lib/engine-source.mjs` and
`node maintainers/mutation/mutate-one.mjs "scripts/update-engine.mjs:686-690"`.

🧭 **ALL FOUR OF MY SURVIVORS WERE THE SAME MISSING CASE**: `target?.` → `target.` and `local?.` →
`local.`, on both fields. Every existing pole passed `{}` for each side, which never dereferences
nothing. Killed by **feeding the absent case**, not by an assertion reverse-engineered from the code —
and the case is real: `advanceRegimes` runs at step 7, *after* the reconcile has converged the files on
disk, so a throw there does not lose the regimes, it aborts the manifest write and leaves a brain whose
**files are at HEAD and whose manifest is at install day**. Nothing downstream expects that pair.

⚠️ **The four survivors LEFT are pre-existing and named, not silently inherited**: two
`ArrayDeclaration` mutants on `selectMergeFiles`' empty-list defaults (`:34-35`) and two `StringLiteral`
mutants on `readFileSync(…, "utf8")` (`:147`, `:151`). Out of this change's scope, recorded so the next
pass does not re-discover them as new.

---

## W2 — pinning the delivery, and six survivors that asked for LESS code — 2026-08-22

`dd08024` (the slice) + `a5b8c2a` (the simplification) + the boundary test. State owned by
[`../plans/archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md`](../plans/archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md).
EXISTING files changed by a few lines → measured **on THOSE LINES ONLY**.

| File (range) | First pass | After | Survivors |
|---|---|---|---|
| `scripts/lib/engine-fetch.mjs:36-49` (`buildCloneArgs`) | **100 %** — 9 killed | — | 0 |
| `scripts/lib/tracked-files.mjs:31-73` (the EOL parse + verdict) | **83.78 %** — 6 survived | **92.59 %** | 2, both named equivalents |

**Reproduce**: `node maintainers/mutation/mutate-one.mjs "scripts/lib/tracked-files.mjs:31-73"`.

🧭 **THREE OF THE SIX SURVIVORS WERE ONE MESSAGE: there was too much code.** They were all `indexOf`
comparisons — `tab <= 0`, and the `attrAt < 0 ? "" : …` ternary twice — whose false branch **no output
git produces can reach**. Unkillable, and *load-bearing-looking*, which is the worse half: a reader
budgets attention for a guard that guards nothing. The remedy was the one this document keeps
recommending and sessions keep skipping — **simplify the production instead of inventing a fixture**:
the record format is now stated once as a pattern that either matches or does not, and the arithmetic
went away with its half-states.

**And the simplification produced a rule worth asserting**, which is how you tell it from mere
deletion: *a record it cannot FULLY read is SKIPPED, never half-read.* A half-parsed record becomes an
entry keyed by a real path carrying a wrong verdict, and the installer then delivers that file in the
wrong form; skipping means byte-verbatim, which is what it always did.

**The two genuine gaps**, both closed:

- **Every `eol=crlf` fixture had it LAST**, so the trailing boundary was only ever satisfied by
  end-of-string and `(\s|$)` could lose its `\s` unnoticed. A file can carry several attributes, and
  the one protecting a Windows launcher must not depend on being written last.
- **Both boundaries from the other side** (`eol=crlfx`, `noeol=crlf`), so the guard cannot decay into a
  substring test and deny a file its LF delivery over a coincidence of spelling.

**The two that remain are equivalents, and each is PROVED rather than asserted:**

- `(.*)$` → `(.*)`: `.` does not match a newline and `.*` is greedy, so the anchor changes nothing
  unless the **fields** part contains a newline. It cannot — git emits the fields, then one tab, then
  the path, and the split takes the **first** tab.
- `tab < 0` → `tab <= 0`: a record starting with a tab yields empty fields, the pattern refuses them,
  and the record is skipped either way. **That equivalence is a CONSEQUENCE of the simplification** —
  the edge the comparison used to guard is now covered by the pattern.

🧪 **`installer.mjs`'s five wiring lines are NOT measured, and the skip is stated rather than passed
over**: it sits outside `scripts/`, which `mutate-one.mjs` refuses by construction — a pre-existing
structural limit, not a choice made here. What it wires is pure and measured above; what it *does* is
covered by **running the installer as a process**, which the entry-point seam rule demands anyway
(247 engine files delivered with zero CR, the PNG byte-identical, the generated `run-node.cmd` still
CRLF).

---

## W1 (S7-6) — the CRLF ancestor fetch, and a pass that measured the code it had NOT written — 2026-08-22

`65a6080` (the fix) + `13ef852` (the survivor's test). State owned by
[`../plans/archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md`](../plans/archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md).
EXISTING files changed by a few lines → measured **on THOSE LINES ONLY**.

| File (range) | Score | Survivors |
|---|---|---|
| `scripts/lib/engine-base.mjs:56-86` (`crlfify`, `recordedVariant`) | **100 %** — 23 killed | 0 |
| `scripts/lib/engine-ancestor.mjs:55-90` (the miss path) | **100 %** — 10 killed | 0 |
| `scripts/lib/engine-ancestor-fetch.mjs:60-112` (the candidate walk) | **96.67 %** → **100 %** | 1, killed |

**Reproduce**: `node maintainers/mutation/mutate-one.mjs "scripts/lib/engine-base.mjs:56-86"` (and the
two ranges above).

🛑 **THE FINDING IS NOT THE SCORE, IT IS THE FIRST RUN.** A pass was launched over the change **before
it was committed** and returned a clean **100 %, 32 killed** — for lines that did not exist in the tree
it measured. `mutate-one.mjs` builds its worktree with `git worktree add --detach <path> <sha>` where
`sha = git rev-parse HEAD`, then `reset --hard` + `clean -qfd`: **it measures HEAD, never the working
tree.** That is correct and deliberate (a mutant of `auto-commit.mjs` must not be able to commit the
instrumented tree), and it is invisible from the output — the run says `✅ Mutation score 100 %` in the
same words either way.

➡️ **The rule: COMMIT, THEN MUTATE.** Not a preference, a precondition. And the family it belongs to is
the one this branch keeps meeting: yesterday a probe **re-implemented a lookup by hand** instead of
calling it and produced a confident wrong verdict; this is the same shape one layer out — a
measurement that was real, deterministic, repeatable and **about the wrong thing**. A green light for
code you have not committed reads exactly like a green light for code you have.

**The one real survivor**, in the shared loop: `if (!shown.ok) continue;` → `if (false) continue;`. It
survived because a failed `git show` hands back an error message, which the verification below refuses
anyway — so the guard looked decorative on every input the suite had. It is not, and the fix was a test
that states a **rule** rather than covering a branch: *bytes that arrive WITH a failure are not bytes —
`ok` is the authority.* Feed the double real content with a non-zero status and the mutant hydrates a
base from it, which is the single write this module exists to prevent. Asserted on both shapes (hit and
candidate walk), since they share the line, and **verified by applying the exact mutant by hand**: that
test fails, and only that test.

➡️ **A confirmation re-run was deliberately NOT bought** (§5quinquies: no re-run when the delta is
predictable, write the prediction instead). Hand-applying the mutant is stronger evidence than a second
two-minute pass: it observes the kill directly rather than inferring it from an aggregate.

---

## S10-QA — the acceptance test, and the guard that refused too much — 2026-08-22

`612f306`, `5c16fc2`, `ea78d42`. State owned by
[`../plans/archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md`](../plans/archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md).
EXISTING files changed by a few lines → measured **on THOSE LINES ONLY** (16 hunks across six files).
**Reproduce**: each run's full `mutate-one.mjs` invocation is quoted in its log header — logs
[`s10-qa-hunks`](reports/s10-qa-hunks) and [`s10-qa-single-lines`](reports/s10-qa-single-lines).

| Run | Mutants | Score | Survivors |
|---|---|---|---|
| first pass (`612f306`) | 54 | 85.19 % | 8 |
| after the three fixes (`5c16fc2`) | **52** | **96.15 %** | 2, both equivalent |
| the nine SKIPPED lines, re-run | 17 | 88.24 % | 2, same defect |
| after deleting the dead arm (`ea78d42`) | **13** | **100.00 %** | 0 |

Per file after the fixes: `engine-answers.mjs` 100 %, `engine-base.mjs` 100 %, `adopt-engine-file.mjs`
100 %, `engine-merge-apply.mjs` 100 %, `engine-adopt.mjs` 95.83 %, `engine-base-fs.mjs` 85.71 %.

### 🚨 A `--mutate` RANGE WRITTEN AS A BARE LINE NUMBER MEASURES NOTHING, AND SAYS SO IN A WARNING

`scripts/lib/engine-adopt.mjs:79` matches **no file**. Stryker logs
`Glob pattern "…:79" did not result in any files` and carries on to a green score over everything
else — so **nine of this slice's sixteen hunks were never measured**, and the first table row above
was computed on the seven that were. Single lines have to be written `79-79`.

This sits beside the flag's other trap, already documented at the top of this file: the file name must
be **repeated per range** (`f.mjs:1-5 f.mjs:9-12`, never `f.mjs:1-5,9-12`). Both fail the same way —
**silently, upward**. Re-run properly, the nine lines held one real defect (below) and now score 100 %.

### 🛑 THE FINDING: A SAFETY GUARD IS MEASURED IN BOTH DIRECTIONS, OR IT IS HALF-TESTED

Three survivors sat on `isMarkedMerge`, the guard that refuses to adopt a marked-up merge: the two
`^` anchors and the `&&`. Every test aimed at it proved it **refuses the dangerous file**, and not one
proved it **accepts an innocent one**. Unanchor the opening marker, or turn the `&&` into `||`, and
the engine starts refusing any file that so much as quotes `<<<<<<<` in prose — which is a real file:
`update-engine`'s own Step 4 explains what a conflict looks like. A guard that over-refuses freezes
exactly the document that explains the freeze, and no test would have noticed.

Two tests now pin it from the other side, one per anchor: a candidate whose *closing* marker starts a
line and whose opening one does not, and the mirror. Both adopt cleanly.

### A branch no input could reach, deleted rather than asserted

`(write !== undefined || deliver !== undefined)` — two survivors, and both said the same thing:
`planAdoption` returns `write` and `deliver` **together or neither**, so the `||` had an arm nothing
could exercise. Asked of the plan as a whole (`Object.keys(plan).length > 0`) it is one expression, it
means what it always meant, and a reader can check it without opening `planAdoption`. Same lesson as
S10-6a's `parseFrom`: **a mutant you can delete beats a mutant you assert.**

### The eighth: a true half-sentence

The CLI's marked-merge line could lose its middle clause and still read as true — *"your version and
the engine's changed the same lines"* — while dropping the only fact the owner acts on: that what sits
beside the file is a **marked-up merge of both**, not a version to install. S10-6a's finding, one
release later, on the sentence that finding did not cover.

### And what the nine unmeasured lines were hiding: a report arm with no state to describe

`preserved.push(sidecar === undefined ? {name, reason} : {name, reason, newVersionPath})` — both its
mutants survived, because **nothing produces a preserve without a sidecar**. Rows 3 and 7 of
`mergeVerdict` both set `sidecar: candidate`, and so do this module's own `merge-failed` /
`merge-unsafe` degradations. The `no-provenance` row was that arm's only home until **S10-1 gave it an
offer** — the arm outlived its state by one slice, and only a hunk-scoped run over a line nobody had
otherwise touched would ever have said so. Deleted, not asserted.

### The two survivors that stay (documented equivalent)

- `readFileSync(sidecar, "utf8")` → `""`. Node treats the empty encoding as none and returns a
  **Buffer**; measured, the Buffer writes the same bytes and hashes to the same sha256, so the file,
  the ancestor and the manifest are byte-identical either way. Nothing observable to assert.
- `regimes.merge ?? []` → `?? ["Stryker was here"]`. The fallback feeds `globRoots`, and a root that
  does not exist on disk is filtered before it can select anything. Pre-existing on that line.

---

## S10-6a — the command, and 18 survivors that were all the SAME defect — 2026-08-22

`087d57b` then `160d36e`. State owned by
[`../plans/archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md`](../plans/archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md).
NEW file → measured **whole**.
**Reproduce**: `node maintainers/mutation/mutate-one.mjs scripts/adopt-engine-file.mjs` — log
[`s10-6a-cli`](reports/s10-6a-cli).

| Run | Mutants | Score | Survivors |
|---|---|---|---|
| first pass (`087d57b`) | 62 | 70.97 % | 18 |
| after the four fixes (`160d36e`) | **60** | **100.00 %** | 0 |

**The mutant count fell by two** and that is the honest direction: `parseFrom` lost its wrapper object,
so two of its mutants stopped existing rather than being killed. **A mutant you can delete beats a
mutant you assert.**

### 🛑 THE FINDING: ON A COMMAND, THE SENTENCES *ARE* THE PRODUCT

Seven survivors emptied user-facing prose with nothing going red — the three usage lines that explain
what each offer **does**, the whole *keep mine* and *combine* confirmations, and the half of the
no-candidate line carrying the two innocent explanations. The tests asserted that the usage **named**
the three offers, which the invocation line alone already satisfies.

This file's entire output is sentences. A test suite that lets them all be emptied is measuring the
control flow of a thing whose job is to speak. Each is now asserted on **what it must say**: that the
overwritten version was saved, that the engine will stop asking until the next release, that the
recorded ancestor is the **engine's** version, and that nothing is broken.

### Three more, each a different failure mode

| Survivor | What it actually was |
|---|---|
| `at === -1` → `false` / `+1` | **Load-bearing.** Without it `rest[at + 1]` reads `rest[0]`, so a stray argument is promoted to "the combination" and the owner is told a file they never named could not be read. Both spellings exit 2; only one is actionable. |
| `if (!rel \|\| !decision)` → `false` / `&&` | Missing arguments also reach the unknown-decision branch and exit 2 there — so the **code** cannot tell them apart, but it greets someone who typed nothing with `I do not know the answer "undefined"`. Asserted as **exactly** the usage. |
| `realDeps().adopt` → `() => undefined` | The wiring was **never exercised**: every other test injects `adopt`, so all of them would pass if the real deps handed the seam an empty object. |

### The end-to-end test failed on its first run, on something true

Closing the `realDeps` hole meant running the command **as a process against a git-backed brain**
(the § *entry-point seam* rule). It went red immediately: the command resolves the brain it acts on
from **where the script lives**, not from the working directory — so spawning the launcher's own copy
against a temp folder would have acted on **the launcher**. The fixture now carries its own
`scripts/`, as a real brain does. The mutation score bought a fixture that is honest about the
production layout, which is worth more here than the three points it also bought.

**Confirmed by hand, twice**, per § S7-5-2:

| Mutant applied to the real tree | Result |
|---|---|
| the `-1` guard removed (`return rest[at + 1]`) | **1 test red** |
| the real wiring drops its git runner | **1 test red** |

## S10-5 — the adoption seam, and the survivor that was a FLEET-SCALE defect — 2026-08-22

`4238e16` then `363db77`. State owned by
[`../plans/archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md`](../plans/archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md).
NEW file → measured **whole**.
**Reproduce**: `node maintainers/mutation/mutate-one.mjs scripts/lib/engine-adopt.mjs` — log
[`s10-5-adopt`](reports/s10-5-adopt).

| Run | Mutants | Score | Survivors |
|---|---|---|---|
| first pass (`4238e16`) | 60 | 93.33 % | 4 |
| after the added assertion (`363db77`) | 60 | **96.67 %** | 2, both equivalent |

**Count checked before the score**, per the rule § S10-3 added: 60 mutants over ~70 lines carrying
five string comparisons, two throws and four guards is the right order of magnitude.

### 🛑 THE FINDING: THE SURVIVOR WAS INVISIBLE BECAUSE THE FIXTURE HELD ONE FILE

Two survivors were `manifest.provenance ?? {}` → `&& {}` (and the same on `baseRefs`). Both look like
noise on a guard whose fallback the fixture never reaches. They are not. `&& {}` on a *present*
provenance yields `{}`, and an adoption **rebuilds the provenance table from the prior one** — so
rebuilding it from nothing wipes every other engine file's digest. A real brain has **79** of them:
one answered file would make the entire fleet read as personalized at the next update, i.e. this
slice's own machinery re-creating, at scale, the blind spot S10 exists to close.

The defect was unreachable by construction: the fixture brain held **one** merge file, so "keeps the
others" had nothing to be true about. The fix is the fixture, not a guard — a second merge file
nobody is answering about, and an assertion that its digest and its baseRef come out untouched.
**Hand-applied both mutants** to confirm the kill (1 test red each) rather than trusting the re-run.

> **The lesson, one turn after the previous two.** § S10-3 said *read the count, not only the score*;
> § S10-4's slice said *a survivor on unreachable code is first a question about the code*. This adds
> the third: **a survivor can be unreachable because of the FIXTURE, not the code.** The question to
> ask before "is this equivalent?" is **"what would have to be true of the brain for this to matter,
> and does my fixture ever look like that?"** — here, having more than one file.

### The two remaining survivors are equivalent, and the reason is Node, not the tests

`readFileSync(p, "utf8")` → `readFileSync(p, "")` at both read sites. An empty encoding does not
throw: Node returns a **Buffer**. And every consumer downstream takes a Buffer with identical bytes
— `writeFileSync` writes them unchanged, `JSON.parse` coerces via `toString()`, `createHash().update()`
hashes the same bytes. Behaviour is byte-for-byte identical, so there is nothing to assert that would
not be an assertion about Node.

Per § S10-2's rule (*"equivalent" is a verdict about the CODE — can the line be deleted?*): no.
Dropping the argument entirely also yields a Buffer, so the mutant would stay equivalent, and `"utf8"`
is what tells a reader these are text files. **Kept, documented, not chased.**

## S10-4 — the safety commit, 40 mutants, and a count that finally matches the diff — 2026-08-21

`e7a1952`. State owned by
[`../plans/archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md`](../plans/archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md).
NEW code inside an EXISTING file → **hunk-scoped** (`:76-109`).
**Reproduce**: `node maintainers/mutation/mutate-one.mjs scripts/lib/engine-commit.mjs:76-109` — log
[`s10-4-safety`](reports/s10-4-safety).

| Mutants | Score | Survivors |
|---|---|---|
| **40** | **100.00 %** | 0 |

**The count was checked before the score**, which is the rule § S10-3 just added: 40 mutants over 34
added lines carrying two sentence maps, three comparisons and two ternaries is the right order of
magnitude. Last slice's serene 100 % came from 4 mutants over a change four times that size.

**Confirmed by hand, twice**, per § S7-5-2 — a perfect score nobody has tried to break is a claim:

| Mutant applied to the real tree | Result |
|---|---|
| `refused` returns `proceed: true` (the veto removed) | **2 tests red** |
| the `conflicted` guard deleted (an unmerged tree gets `add -A`) | **2 tests red** |

Both are the slice's reason for existing: the first would let an irreversible overwrite happen with
the owner's bytes nowhere in history, the second would bury `<<<<<<<` markers in what it stages.

## S10-3 — the wiring, and a 100 % that measured a QUARTER of the change — 2026-08-21

`216d3b6`. State owned by
[`../plans/archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md`](../plans/archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md).
Three EXISTING files changed by a few lines each → **hunk-scoped**, per the mode's rule.
**Reproduce**: see the per-row commands below — logs [`s10-3-nudge`](reports/s10-3-nudge),
[`s10-3-session`](reports/s10-3-session), [`s10-3-report2`](reports/s10-3-report2), [`s10-3-report3`](reports/s10-3-report3).

### 🛑 THE FINDING: `--mutate` SILENTLY DROPPED THREE HUNKS OUT OF FOUR

The report surface was first measured with **one** argument carrying four ranges:

```
node maintainers/mutation/mutate-one.mjs "scripts/update-engine.mjs:149-152,196-200,289-299,450-455"
```

It returned **100 %, 4 killed, 0 survived** — and it had instrumented **4 mutants**. The file name
belongs to *each* pattern in Stryker's comma-separated list, so `196-200` (no file) is not a pattern
it can use; the run silently measured `149-152` alone, a single template literal. **Three quarters of
the change was never mutated, and the output said nothing was wrong** — `mutate-one.mjs` passes
`targets.join(",")` straight through, so both spellings are accepted and only one is right.

The correct spelling repeats the file, as separate arguments:

```
node maintainers/mutation/mutate-one.mjs scripts/update-engine.mjs:149-152 scripts/update-engine.mjs:196-200 …
```

➡️ **The rule this adds, and it is the sibling of tonight's false-survivor rule**: **read the mutant
COUNT, not only the score.** A perfect score over a handful of mutants on a multi-hunk change is not
a result, it is a question. The count is the only field that says *what was measured*; the percentage
only says how it went. Cheap check, and it is the one that caught this: does the count look like the
size of the diff?

### The three hunks, measured

| Surface | Hunks | Mutants | Score | Survivors |
|---|---|---|---|---|
| `lib/engine-divergence-nudge.mjs` | `:68-75` | 12 | **100.00 %** | 0 |
| `session-engine-divergence.mjs` | `:32-49` | 11 | **100.00 %** | 0 |
| `update-engine.mjs` | `:149-152` ⚠️ *the invalid run* | 4 | ~~100.00 %~~ | 0 |
| `update-engine.mjs` | four hunks, spelled correctly | **33** | **93.94 %** | **2** |
| `update-engine.mjs` | the same, after `66f00c3` | **28** | **100.00 %** | 0 |

### The two survivors were DEAD CODE — one slice after S10-2 taught exactly that

Both landed on the offer's guard, `preserved.filter(({ newVersionPath }) => newVersionPath !== undefined)`.
Nothing can make it drop an entry: **all five `preserve` outcomes carry a sidecar** (`no-provenance`
since S10-1, plus `customized`, `merge-failed`, `merge-unsafe`) — which is the very fact
`preservedAndMergedLines` relies on to read that path unconditionally, three functions up. That
comment had been *extended by me two edits before I wrote the filter that contradicts it*.

The comment defending the filter named the wrong family, too: a retired skill genuinely has no newer
version, and it is excluded **structurally** — it travels in `skillsRetirePreserved`, an array this
function is never handed. The test asserting it was passing for a reason its title did not describe.

Deleted rather than filed as equivalent, per § S10-2's rule. **33 → 28 mutants**: five stopped
existing, and the remaining 28 all die.

**Every perfect score here was confirmed rather than trusted**, per § S7-5-2 — two hand-applied
mutants on the real tree: deleting the nudge's `answers` filter (i.e. reinstating the nag) turns
**3 tests red** across two files, and deleting the report's `answerOfferLines` call turns **4** red.
A 100 % nobody has tried to break is a claim, not a measurement.

## S10-2 — the answers file, and 21 mutants that stopped existing — 2026-08-21

**Subject**: `scripts/lib/engine-answers.mjs`, NEW file → measured **whole**, per the mode's rule.
**Commits**: `36f2c5c` (the file), `62025ec` (the two fixtures + the four dead branches).
**Reproduce**: `node maintainers/mutation/mutate-one.mjs scripts/lib/engine-answers.mjs` — logs
[`mutate-one-engine-answers.log`](reports/mutate-one-engine-answers.log) (run 1),
[`engine-answers-run2`](reports/engine-answers-run2), [`engine-answers-run3`](reports/engine-answers-run3).

| Run | HEAD | Mutants | Score | Survivors |
|---|---|---|---|---|
| 1 | `36f2c5c` | 60 | **78.33 %** | 13 |
| 2 | `36f2c5c` — *identical tree, no test changed* | 60 | **80.00 %** | 12 |
| 3 | `62025ec` | **39** | **97.44 %** | **1** |

Runs 1 and 2 are the **false survivor** written up in the top box; the honest first-pass reading of
this file is 80 %, and even that is one disputed mutant away from 78.33 %.

### The 12 survivors split in two, and only one half was a testing failure

**Two were real gaps** — states a hand-edited `.engine-answers.json` genuinely reaches, and no test fed
either: a **`null` entry** (`typeof null === "object"`, so the read walked into `.at` on it) and
**`at: ""`** (an empty stamp must not count as an answer, nor match a caller passing `""` as a ref).
Both fixtures added.

**Ten were dead code, and that is the finding.** They clustered on four guards, and every one of them
was unreachable *over the domain the function actually has* — whatever `JSON.parse` can return:

| Guard | Why no mutant could die on it |
|---|---|
| `typeof entry === "object" && entry !== null && …` | subsumed by the `.at` check that follows — a string's `.at` is a *function*, a number's is `undefined` |
| `content ?? ""` | `JSON.parse(undefined)` throws exactly like `JSON.parse("")` |
| `typeof parsed !== "object" \|\| … \|\| Array.isArray(parsed)` | a primitive or an array yields no entry `isEntry` accepts; only `null` cannot be walked at all |
| `existsSync(path)` in `readAnswers` | a missing file throws into the same `catch` as an unreadable one |

They were **deleted, not documented as equivalents**. The score moved 80 % → 97.44 %, but the number
is the small half of it: **the mutant count fell from 60 to 39**. Twenty-one mutants did not get
killed, they **stopped existing**, because the code they lived in stopped existing.

➡️ **The rule this adds.** *"Equivalent mutant"* is a verdict about **code**, not about tests, and
writing it down is the expensive way to keep dead code. A guard no input can reach is dead whatever
its intent was; the intent belongs in the test's assertion (this file still asserts that an array and
a string yield no answers) and in a comment, **not in a branch nothing can take**. First ask *can this
line be deleted*, and only then write "equivalent" — the run that follows is shorter, faster and says
something true. Removing `existsSync` even made a `catch` **live for the first time**: dead code does
not sit still, it shelters more of itself.

**The one remaining survivor is a true equivalent**: `readFileSync(…, "utf8")` → `readFileSync(…, "")`.
Verified by hand — an empty encoding returns a **Buffer**, and `JSON.parse` coerces a Buffer as UTF-8,
so the two paths agree byte for byte. Left as is; the explicit `"utf8"` says what is meant.

**Fail-first, on a file whose production code was already green**: each of the five mutants the new
fixtures target was **hand-applied and seen red** before the commit (13/3, 15/1, 15/1, 12/4, 15/1).
A mutation-driven test cannot get its red from the ordinary route — the code it exercises is already
written — so hand-applying the mutant *is* the fail-first step, and skipping it leaves a test that has
never once been observed to fail.

## S10-1 — row 3's sidecar, and seven tests that had to be inverted on purpose — 2026-08-21

`39f37bb`. State owned by
[`../plans/archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md`](../plans/archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md).
**Reproduce**: `node maintainers/mutation/mutate-one.mjs "scripts/lib/engine-merge.mjs:64-71"` — log
[`mutate-one-engine-merge-64-71.log`](reports/mutate-one-engine-merge-64-71.log).

| File | Scope | Score | Survivors |
|---|---|---|---|
| `scripts/lib/engine-merge.mjs` | the changed hunk, `:64-71` | **100 %** (8 killed) | 0 |

⚠️ **ONE RUN, at the default concurrency — the full serial confirmation § S7-5-2 asks of a perfect
score was NOT performed, and here is why, so nobody reads a protocol into this that was not followed.**
`mutate-one.mjs` has no `--concurrency` flag; going serial means editing the shared
`stryker.scripts.config.mjs` and reverting it, and a forgotten revert is invisible (`tuningViolations`
accepts anything ≤ 5, so no guard would catch a config left at 1). Instead the **second** protocol this
document already names was used: **the load-bearing mutant was applied by hand.** Deleting
`sidecar: candidate` turns **9 tests red** across three suites, and the working tree was restored and
verified clean against HEAD afterwards. That does not re-prove the other 7 mutants; it proves the one
the slice exists for, deterministically, which is more than a second flaky run would have.

**A behaviour change measures its blast radius in inverted tests, not in mutants.** The hunk is two
lines and the mutation pass on it is trivially perfect; what actually cost the slice its care is that
**seven downstream tests asserted the old rule**, one of them in its very name (*"…preserved WITHOUT a
.new"*). Each was inverted deliberately, with the claim it used to make kept above it — a batch
find-and-replace would have produced the same green with none of the record.

**Two of the seven came out STRONGER, and that is the part worth repeating.** The old assertions were
`existsSync(...) === false`, which is the weakest shape a test can have: it passes when the file is
absent for the *right* reason and equally when the whole code path never ran. Replacing them with
`readFileSync(...) === candidate` pins something the suite had never checked — that the unconditional
`rmSync` of a stale sidecar is followed by a re-drop of the CURRENT one, so a leftover claim from an
earlier update can never survive as itself. **An inversion is an opportunity to upgrade an assertion,
because you are already reading it.**

---

## S8-2b — the drift guard, and a fixture that agreed with the code by construction — 2026-08-21

`ab85fde` → `417e264` → `3625dee`. State owned by
[`../plans/archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md`](../plans/archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md).
**Reproduce**: `node maintainers/mutation/mutate-one.mjs scripts/lib/locale-drift.mjs` — log
[`mutate-one-locale-drift.log`](reports/mutate-one-locale-drift.log).

| File | First pass | After the assertion fixes | After the comparator fixture | Survivors |
|---|---|---|---|---|
| `scripts/lib/locale-drift.mjs` (new) | **82.28 %** (14 survived) | **97.47 %** (2 survived) | **98.73 %** (77 killed, 1 timeout) | 1 named equivalent |

**No confirmation re-run was owed here**, and the reason is worth stating rather than assumed: the rule
in § S7-5-2 fires on *a score that improves without a test being added*, which is the signature of the
flaky judge. Every jump above was bought with tests committed in the same step, so each number has a
cause on disk.

**Four causes, and not one of them was an equivalent to hide behind.** Worth listing because three are
about the TESTS, not the code, and they are the shapes that recur:

1. **An ABSENT payload never fed.** `parseCommits(out)` guards with `?? ""` and nothing ever passed
   `undefined`, so the guard could have been anything at all.
2. **A fixture already in sorted order** — the big one. It let **`.sort()` be deleted outright**, plus
   four more mutants on the comparator: five at once. The pair list was written in the order the
   assertion expected, which is the most natural way to write it and the one that measures nothing.
3. **No anchor asserted on the regex.** Without `^`, `docs/templates/fr/x.md` silently joins the
   watched set and reports drift against a file it has nothing to do with. The mutant found a real
   hole in the derivation's contract, not a stylistic preference.
4. **A message asserted by fragments.** `assert.match` on one line lets every OTHER line be emptied
   without a test noticing — and for a guard, **the message IS the feature**: the subjects (a count
   cannot carry magnitude) and both ways to clear a hit (a guard that only says "port it" gets deleted
   the day a hit is legitimately unportable). Asserted whole now.

**Then the second pass found a survivor that LOOKED equivalent and was not**, which is the entry worth
keeping. `.sort((a, b) => (true ? -1 : 1))` — a comparator ignoring both arguments — survived against a
**two-element** fixture, because with two entries **reversing the list and sorting it produce the same
answer**. The fix is a third locale, ordered so the reverse (`de, fr, es`) is not the sorted answer
(`de, es, fr`). ⚠️ **The general rule this pays for**: the standing advice is *collections of at least
two, unsorted*; on a comparator, two is not enough — it takes **three**.

**The one survivor kept** is named in the source: `<` vs `<=`, on tracked paths that are never equal.

---

## S7-5-3 — the wiring, and a NETWORK CALL that nearly entered the suite — 2026-08-21

`fa0f5be`. State owned by
[`../plans/archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md`](../plans/archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md).

| Hunk | Score | Survivors |
|---|---|---|
| `scripts/lib/reconcile-brain.mjs:112-148` | **100 %** (7 killed) | 0 |
| `scripts/update-engine.mjs:297-315` | **100 %** (30 killed) | 0 |
| `scripts/lib/engine-heal-fs.mjs:55-71` | **100 %** (4 killed) | 0 |

41 of 41, and **confirmed on a serial re-run** — same protocol as § S7-5-2, same reason.

**The finding is not in the numbers, it is in what the wiring did to the SUITE.** Handing
`reconcileBrain` a real git runner made the release-fixture QA start doing a genuine
`git fetch origin tag v3.6.0` — inside a suite whose own header says *"the I/O seams are injected — no
network"*. Nothing failed. The tests passed, took **2.1 s each instead of 94 ms**, and would have gone
on passing until the day a CI runner had no route to the network.

**Why that is a mutation-testing finding and not merely a slow test.** This document's top box already
records the rule: under a `command` runner a suite that exits non-zero **IS** the kill signal, so a
test that fails at random does not add noise to a score, it adds **points**. A network-dependent suite
is a flaky suite with a delay fuse. It would have inflated every score measured afterwards, and the
inflation would have looked exactly like good work.

The fix is a seam, not a skip: `localTagGit` answers `fetch` with `ok` and no round-trip — the tags are
already in the very repository the QA uses as its source — and forwards everything else, including the
`git show <tag>:<path>` that produces the ancestor's real bytes, to real git. The QA still reads real
released content, which is its entire reason to exist.

➡️ **The rule this adds**: when a slice hands a real I/O runner to code a test suite already drives,
**check what the suite starts doing**, not just whether it still passes. A test that silently acquires
a network dependency reports success in exactly the same way as one that did not.

---

## S7-5-2 — the git shell, and the first perfect score this document CHECKED — 2026-08-21

`d5324a0`. State owned by
[`../plans/archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md`](../plans/archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md).

| File | First pass | Confirmation | Survivors |
|---|---|---|---|
| `scripts/lib/engine-ancestor-fetch.mjs` (new) | **100 %** (42 killed) | **100 %** on a serial re-run | 0 |

**The confirmation is the point, not the number.** The rule written one section above — *a score that
arrives without a test being added is re-run before it is written down* — was applied to its own
author's work the same night. A lone 100 % from an instrument just proved non-deterministic is not
evidence, and the box at the top of this file already records a **100 % that was really 98.18 %**.
Three minutes at `--concurrency 1` is what turns a claim into a measurement. **42 of 42, twice.**

**Why the score came out clean on the first pass**, which is worth naming because it is repeatable and
not luck: the module's whole risk is an argv it builds and a refusal it makes, and **both were
asserted as values**. The git invocation is compared **whole** (`["-C", dir, "fetch", "--depth", "1",
"origin", "tag", tag]`) rather than sampled — a missing `-C` is invisible from a return value, since
the command still succeeds, just in the wrong directory. And every failure mode got its own test
rather than one shared "it fails gracefully": fetch fails, show fails, bytes hash elsewhere, tag
already local, source is the brain. There were no survivors because there was nowhere for one to hide,
not because the mutants were weak.

---

## S7-5-1 — the planner, and a survivor that was worth KEEPING — 2026-08-21

`1d545b2` (the slice) + `d019d38` (the kills). State owned by
[`../plans/archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md`](../plans/archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md).

| File | First pass | After the kills | Survivors |
|---|---|---|---|
| `scripts/lib/engine-ancestor.mjs` (new) | **90.91 %** (30 killed, 3 survived) | **93.94 %** | 2, both named equivalents |

The measurement misbehaved on this file and the account of it is in the box at the top of this
document, § "The judge itself was flaky" — it is the reason the honest figure here is 93.94 % and not
the 96.97 % a run produced.

**The one real gap** was the middle link of an optional chain: `table?.files?.[rel]?.[recorded]`
survived losing its second `?.` because no test handed the planner a table that was **present but
empty**. Not hypothetical — a fingerprints file holding `{}` parses fine, and `undefined[rel]` throws
inside an update, on a brain, at the moment the owner can help least. Each `?.` in a chain guards a
different absence, and a test per link is the only thing that says so.

**A NEW SHAPE, and it cuts against this document's own favourite lesson.** Two sections above
(§ S7-2, § S7-3) the right answer to a survivor was to **delete the line** — dead code is a mutant
nest. The `!recorded` guard here looks identical from the report and is **not the same animal**: it is
**reached** on real input, merely **redundant**, because both ways out below it also return null
(`matchesRecord` forgives an absent record, and the table lookup then misses on an `undefined` key).
It was **kept**, with the equivalence named in the code. The distinction worth carrying:

- **Dead** — the branch cannot be entered. Delete it: it is untestable by construction and every
  future reader will mistake it for a live case.
- **Redundant** — the branch is entered, and something further down would have caught the case
  anyway. Keep it if it answers the reader's question at the line where they ask it. Leaning on two
  distant behaviours to skip a file is precisely how a later refactor changes this one by accident.

The report cannot tell the two apart; only reading the flow can. **A survivor is a question, not a
verdict** — sometimes the honest answer is a comment, not a test and not a deletion.

---

## S7-3 — the wiring, and a fallback that could not fire — 2026-08-21

`f3d72c4` (the slice) + `778482c` (the kills). State owned by
[`../plans/archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md`](../plans/archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md).

| File | First pass | After the kills | Survivors |
|---|---|---|---|
| `scripts/lib/engine-heal-fs.mjs` (new) | **92.31 %** (12 killed, 1 survived) | — | 1, a named equivalent |
| `scripts/lib/reconcile-brain.mjs` (2 hunks) | 95.24 % (1 survived) | **100 %** | 0 |
| `scripts/update-engine.mjs:272-296` (hunk) | 86.96 % (3 survived) | **100 %** | 0 |

**Four survivors, three causes, and the hunk scoping earned its keep**: every one of them was written
this slice, with no score drift to attribute and no survivor list to diff against last time.

- **A fallback that cannot fire, again** (`report.healed ?? []`). The report comes from
  `reconcileBrain` three lines above, which always returns the array. Deleted, not documented — the
  same call S7-2 made on its dead comparator branch, one file over. **Two slices running, the same
  shape**: this repo's tests are strong enough that the surviving mutants are mostly hiding in code
  that cannot run. That is worth saying plainly, because the reflex when a mutant survives is to write
  a test, and twice now the right answer was to delete a line.
- **A fail-soft that was documented and never fed.** `formatReport` skips a version string it cannot
  parse — the comment said so, no test did. Two now do: a mixed list (the bad tag loses its place in
  the range, the file keeps its place in the count) and an all-bad list (the count stands, the range
  goes vague). A report is the last thing that may fail an update that already succeeded.

The one named equivalent: `readFileSync(path, "utf8")` → `readFileSync(path, "")`. Measured rather
than assumed — an empty encoding returns a **Buffer**, and `JSON.parse(buffer)` stringifies it as
UTF-8. Byte-for-byte the same answer.

## S7-2 — the fingerprint table, and the runner's HEAD trap wearing a PLAUSIBLE score — 2026-08-21

`e716a33` (the slice) + `9c50842` (the kills). State owned by
[`../plans/archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md`](../plans/archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md).

| File | First pass | After the kills | Survivors |
|---|---|---|---|
| `scripts/lib/engine-fingerprint-table.mjs` (new) | 85.71 % (36 killed, 6 survived) | **94.74 %** (36 / 2) | 2, both named equivalents |
| `scripts/lib/tracked-files.mjs:49-57` (hunk) | **100 %** (1 / 0) | — | 0 |

**Six survivors, two causes, and one of them was DEAD CODE hiding four mutants.** The comparator
carried a third branch for the tie (`a > b ? 1 : 0`), unreachable by construction — both sort keys come
from unique paths. Deleting it killed four mutants at once; documenting it would have killed none. The
lesson generalises past this file: **an unreachable branch is not a named equivalent, it is a mutant
nest** — name the equivalent only when the *operator* is unfalsifiable, not when the *branch* is dead.
The other cause was real: the `^` anchor of the locale regex was unpinned, and without it a demo note
under `vault/templates/fr/` files itself under someone else's rel — a **wrong** row, which is the
clobber risk this table is designed against, not merely a missing one.

⚠️ **The runner's HEAD trap again, one slice later, and this time it did NOT print NaN.** S7-1 recorded
it as *"an uncommitted file mutates nothing and reports `NaN %`"*, which reads as self-announcing. It is
not. Here the **file** was committed and only the **fix** was uncommitted, so the run came back
`✅ 83.33 %, 7 survivors` — a plausible number, complete with a survivor list quoting source lines that
no longer existed. Nothing about the output says "this is the previous commit". The tell was the
*content*: survivors quoting code just deleted. **The rule is unchanged and now measured twice: commit
green, then measure.** And the skill already said so (`maintainers/skills/mutation-testing/SKILL.md`,
"It measures HEAD, never your working tree") — the defect was not a missing rule, it was a rule nothing
loaded.

## S7-1 — the heal, and a test that never reached the thing it was testing — 2026-08-21

`3908b7f` (the slice) + `924b0d9` (the kills). State owned by
[`../plans/archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md`](../plans/archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md).

| File | First pass | After the kills | Survivors |
|---|---|---|---|
| `scripts/lib/engine-heal.mjs` | 82.14 % (23 killed, 5 survived) | **96.43 %** (27 / 1) | 1, a named equivalent |

**Four of the five survivors were the tests', and two defects were stacked in one case.** The
absent-table test recorded provenance for **both** its files, so every rel was filtered out before the
lookup ran: the test that exists to prove an absent table is harmless never reached the table. Three
mutants said so at once. Underneath it, the test file's own `heal` helper defaults `table` to the
**real** table, so the `undefined` iteration was silently exercising the populated one — the omitted
argument now gets a direct call, and `null` is covered (a failed read yields null; a parameter default
only fires on `undefined`).

**A NEW SHAPE, worth the paragraph: a fixture that was unsorted in only one direction.** The ordering
test passed its three files in **exactly reverse** order, so a comparator mutated to *never swap*
produced the right answer by accident and survived. "Collections ≥2, unsorted" is not enough — the
input must be unsorted **in both directions**, or reversal and sorting are indistinguishable. Reordered,
the mutant dies.

⚠️ **And a trap in the runner itself, recorded because it printed a green tick.** `mutate-one.mjs`
resets a worktree to **HEAD**, so a run on an **uncommitted** file mutates nothing and reports
`✅ Mutation score NaN % — 0 killed, 0 survived`. A NaN score wearing a ✅ reads as a pass. **Commit
first, then measure.**

## S4-4c — the walk that read the vault, and three survivors that were three real defects — 2026-08-21

`a3f4e2b` + the two kill rounds. State owned by
[`../plans/prospective/update-regime-owns-what-it-shipped-action.md`](../plans/prospective/update-regime-owns-what-it-shipped-action.md).

| File | First pass | After the kills | Survivors |
|---|---|---|---|
| `scripts/lib/glob-match.mjs` | 94 % (47 killed, 3 survived) | **100 %** (42 killed) | none |
| `scripts/lib/engine-base-fs.mjs` | 91.80 % (56 / 5) | **94.74 %** (54 / 3) | 3, all named equivalents |

**Read the two numbers honestly.** `glob-match` reached 100 % with **eight fewer mutants than it
started with** — the ratio improved by **deleting code**, not by adding tests (the same shape as S4-3).
And `engine-base-fs` ends **below** its pre-slice 95.65 %: the slice added ~11 mutants to a 46-mutant
file, so a single new equivalent moves the ratio down. Both survivor sets are equivalents; what matters
is what the runs *found*, and it was not coverage.

**Not one of the six survivors was a missing test. Every one named a defect or a dead line.**

- **Two globs rooting at the same directory were returned TWICE** (`.claude/skills/coach/**` and
  `.claude/skills/coach/*.md`). The caller walks each root, so that subtree would be read twice — the
  exact waste the slice exists to remove. Three survivors pointed at it together, because `globRoots`
  carried **two** guards against a root eliminating itself (an index check and an equality check), each
  making the other unreachable, and no fixture had ever produced two equal roots. **The fix deleted
  both**: deduplicate first, and `root.startsWith(root + "/")` is false for free.
- **A manifest that parses but declares no `regimes` would have thrown.** `{}` is valid JSON and
  `readEngineDivergence` parses whatever is on disk, so the throw was reachable — and it escapes that
  function's own `try`, meaning a truncated manifest would have taken down the very report the
  fail-soft exists to keep alive. `selectMergeFiles` had always been defensive about this shape; the
  new call site was not.
- **A branch that said what the next line already said.** `root === "" → walk everything` was dead:
  `join(brainDir, "")` **is** `brainDir`, which is a directory, so the general path already did it. The
  mutant that broke its condition changed no behaviour, which is the signature.

➡️ **The durable lesson, and it is about how to read a survivor.** Three of these were reachable only
because a value was **swallowed downstream**: the absent-root guard returned `[]` into a list
`selectMergeFiles` was about to filter, so no input could tell an empty list from a bogus one. The fix
was not to document an equivalent — it was to **stop discarding the observation**, by filtering absence
instead of returning-as-empty. A survivor whose value dies in a later filter is usually telling you the
code is shaped so nothing can see it, not that the mutant is harmless.

**The three left, all named equivalents**: `?? []` → `?? ["Stryker was here"]` (the same absent
`regimes.merge` that fires the `??` also makes `selectMergeFiles` match nothing, so no root can matter);
`byPath`'s `<` → `<=` (a rel appears at most once, so the equal case is unreachable — pre-existing); and
`readFileSync(…, "utf8")` → `""` (pre-existing, documented in S4-3).

---

## S4-4a — the session surface, and a defect no mutant could have found — 2026-08-21

`ea9a4c1`. State owned by
[`../plans/prospective/update-regime-owns-what-it-shipped-action.md`](../plans/prospective/update-regime-owns-what-it-shipped-action.md).

| File | First pass | Survivors |
|---|---|---|
| `scripts/lib/engine-divergence-nudge.mjs` | **100 %** (46 killed) | none |

**No pass on `scripts/session-engine-divergence.mjs`** (the entry) or on `engine-version.mjs` (one
line: an existing function exported): wiring and a keyword, and the rule says say the skip in writing.

⚠️ **The new shape of defect, and the reason it is written up despite a 100 % score: mutation could not
have found it.** The hook emitted `systemMessage` **nested inside** `hookSpecificOutput`, where the
client does not read it — valid JSON, a silent CLI channel, and a unit test asserting the same wrong
shape it had been written against. **Every mutant of that object still died**, because the tests and the
code agreed with each other; what disagreed was the *client*. It surfaced from **running the entry as a
process** and reading the JSON, which is the entry-point seam rule paying for itself a second time.

➡️ **The durable lesson**: a mutation score judges whether the tests pin the code, never whether the
code speaks the protocol. For any output whose reader is **outside this repo** (a hook envelope, a JSON
contract, a CLI's stdout), the run-it-as-a-process check is not a formality on top of a good score — it
is the only thing measuring the half the score cannot see.

*(The prose itself was cut from ~990 characters to one sentence **before** the run, on the F5 startup-payload
guard's evidence — see the plan. A smaller deliverable is a smaller surface, and part of why 46 mutants
died first pass.)*

---

## S4-3 — the report stops being silent, and a guard that would have re-silenced it — 2026-08-21

The prose slice: `d171e90` re-opens the `no-provenance` silence and adds the standing recap, `69b17c9`
deletes what the measurement condemned. State owned by
[`../plans/prospective/update-regime-owns-what-it-shipped-action.md`](../plans/prospective/update-regime-owns-what-it-shipped-action.md).

| File | Before | First pass | After the kills | Survivors |
|---|---|---|---|---|
| `scripts/update-engine.mjs` | 97.54 % _(honest, post-flake)_ | **98.50 %** — 329 killed, 5 survived | **99.40 %** — 329 killed, 2 survived | 2, both the `readFileSync(…, "utf8") → ""` equivalents |
| `lib/engine-base-fs.mjs` | never measured | **89.58 %** — 43 killed, 5 survived | **95.65 %** — 44 killed, 2 survived | 2: the `byPath` `<=` (no equal case) + the same `"utf8"` equivalent |

🎯 **ONE SURVIVOR WAS MASKING TWO MORE, AND THE FIX WAS TO DELETE IT.** `if (aside === undefined)
continue;` guarded the preserve loop against a reason absent from `PRESERVED_ASIDE`. It existed for
`no-provenance` — which this very slice gave a sentence of its own, so **nothing the producer can emit
reaches it any more**. And what it would do to a verdict reason added *later* is drop the line without a
word: the exact defect the slice was written to end, rebuilt as a safety net.

With the guard gone, the two `skillsPreserved = []` / `scriptsPreserved = []` **default-value mutants
die too**. Mutated to `["Stryker was here"]`, they destructure a string into `{name, reason}` of
`undefined`, which used to hit the guard and vanish; now they reach the prose and fail the byte-for-byte
report tests. Three mutants, one deletion, and 329 kills held while the denominator dropped from 334 to
331.

➡️ **The durable rule**: a fail-soft branch is a mutation-survivor *factory* AND a blindfold. It absorbs
the mutants of everything upstream of it, so a healthy score above it means nothing. When the reachable
set shrinks to zero — here, because the case it protected got a real answer — delete it in the same
slice, or the next reader inherits a guard that quietly eats the next feature.

⚖️ **Note the shape of the numbers**: 329 killed before and 329 killed after. **A ratio improved by
deleting code, not by adding tests** — the same effect S3 recorded in the other direction (a score
*falling* because dead code left the denominator). Neither movement is a verdict on the tests; the kill
count is.

🕳️ **`engine-base-fs.mjs`: three of its five survivors were the fail-soft I had just written and never
fed.** `readEngineDivergence`'s catch could be emptied, its `return []` could return garbage, and its
read could lose its encoding, all with the suite green — because **no test ever handed it an unreadable
manifest**. It is precisely the branch that keeps a successful, already-recorded update from being
turned into a thrown error by a file nobody can parse. Fed now, with both shapes (absent, and present
but not JSON).

♻️ **And the third one, once fed, turned out to be a fact stated twice.** Emptying the catch *still*
changed no test: `engineDivergence` already answers "nothing to say" for a null manifest, and a brain
with no readable regimes selects no files to read either. So the early `return []` went the way of the
two before it. **Third time this release** a mutant survived because a fail-soft was written in two
places — after S2b-4's read-back pass and S3-2's `manifest = null` catch.

➡️ **The durable rule, now earned three times**: when a mutant survives inside a fail-soft, ask *"who
else already handles this?"* before writing a test for it. Two answers to one question is not
redundancy: it is a second thing to keep true, and the measurement is the only instrument that finds it.

📐 **One survivor was killed by a fixture, not by a new assertion**: the `seeded` list's `.sort()` is
unobservable for ordinary paths, because the directory walk lists each folder sorted. It takes a
collision to see it — `coach` sorts before `coach.md` among directory entries, while `coach.md` sorts
before `coach/SKILL.md` as a whole path. The mutant was **hand-applied** to confirm the new test judges
it, per the method note this file has carried since 2026-07-27.

---

## S4-2 — the divergence module, and two survivors that were the TESTS' — 2026-08-21

One new pure module (`f247db3`), then a test-hardening pass on top of it (`d315525`):
`engineDivergence({ manifest, installedFileMap })` returns the merge files a brain is holding back, each
with the version that last reached it. State owned by
[`../plans/prospective/update-regime-owns-what-it-shipped-action.md`](../plans/prospective/update-regime-owns-what-it-shipped-action.md).

| File | First pass | After the kills | Survivors |
|---|---|---|---|
| `lib/engine-divergence.mjs` (new) | **78.95 %** — 15 killed, 4 survived | **94.74 %** — 18 killed, 1 survived | 1, the equivalent the code comment predicted |

🪞 **A SORT TEST WHOSE INPUT IS THE MIRROR OF ITS EXPECTATION PROVES THE ARRAY WAS FLIPPED, NOT
ORDERED.** The comparator mutated to `(true ? -1 : 1)` — i.e. no comparison at all — **survived**, and
the reason is worth carrying: the fixture listed its three files in exactly the reverse of the expected
output, and a comparator that always answers "a before b" *reverses* the array under V8's sort. The
mutant produced the right answer by accident. Fixed by making the input a **rotation**: neither sorted
nor mirrored, so only a real ordering satisfies it.

➡️ **The durable rule**: when testing an ordering, never build the input by reversing the expectation.
Use ≥3 elements in a rotation — the cheapest input a "no-op comparator" cannot satisfy by luck. This
generalizes past sorts: any fixture that is a *symmetry* of its expectation can be satisfied by an
operation that is not the one under test.

🕳️ **The other two named an input the module will meet in production and no test fed: a manifest the
brain could not read.** `manifest?.provenance` and `manifest?.baseRefs` both survived their `?.` being
removed, because every fixture passed a real manifest. That is not a defensive flourish to delete — S3-2
established the idiom (a failed manifest read yields `null` and the pass keeps going) and S4-4's session
hook will run in exactly that world. So the case was **fed** rather than the guard removed, and fed
**with files on disk**, or the test would pass vacuously against a version that throws.

✅ **The one survivor left is an equivalent the production comment had already predicted**: `a.rel <
b.rel` mutated to `<=`, unreachable because a rel appears at most once in the list — the same reasoning
`syncBaseTree`'s comparator carries, now confirmed by measurement on a second file rather than reasoned
about twice.

---

## S4-1 — the base learns which version delivered it — 2026-08-21

One slice, one commit (`df983c7`): `baseRefs: { relPath: ref }` beside `provenance`, written by the
same three writers (install, `update-engine` step 7, and the reconcile child as the last writer on
the update path). State owned by
[`../plans/prospective/update-regime-owns-what-it-shipped-action.md`](../plans/prospective/update-regime-owns-what-it-shipped-action.md).

| File | Before (2026-07-27) | This slice | Survivors |
|---|---|---|---|
| `lib/engine-source.mjs` | 93.02 % — 40/43 | **96.61 %** — 57 killed, 2 survived | 2, **both pre-listed equivalents** |

**Measured on the first pass, with no kill round needed** — which is the claim worth checking rather
than celebrating. The two survivors are both families this file already carries elsewhere: the
`?? [] → ["Stryker was here"]` default in `selectMergeFiles` (a glob matching one literal string no
brain-relative path can equal, so the selection is empty either way), and `readFileSync(…, "utf8") → ""`
(an empty encoding is falsy, so the read returns a Buffer and every consumer here treats it identically
— see [Recorded equivalents](#recorded-equivalents-this-release)).

⚖️ **The score rose 3.6 points while the file GREW**, which is the opposite of the usual dilution: the
new function is small, total, and has no branch that is not fed — including the one that matters, `ref`
absent. That case exists because the alternative was to record `null`, and a `null` ref is an unknown
wearing the costume of an answer. It is a test before it is a line of code.

🔗 **The two wiring sites were not measured file-wide.** `update-engine.mjs` (97.54 % honest, above)
and `lib/reconcile-brain.mjs` gained a call each, both covered by tests that assert the **whole**
`baseRefs` map after a real update — a stray key or a missing one fails them. Measuring those two files
again for two lines would re-price ~370 mutants for no new information; the slice's own logic lives in
`engine-source.mjs`, and that is what was measured. **Named, so it is a choice and not an omission.**

---

## S3's write guard — the pure verdict, and prose as a deliverable — 2026-08-21

S3's two code slices (`4bf5efa` + `b82569e` for the decision, `cf55c2a` + `3493533` for the wiring):
`engine-write-guard.mjs` decides, for one tool call, whether an agent may write an engine file, and the
entry script beside it is the hook the harness actually runs. State owned by
[`../plans/prospective/update-regime-owns-what-it-shipped-action.md`](../plans/prospective/update-regime-owns-what-it-shipped-action.md).

| File | First pass | After the kills | Survivors |
|---|---|---|---|
| `lib/engine-write-guard.mjs` (new) | **90.00 %** — 81 killed, 9 survived | **98.89 %** — 89 killed, 1 survived | 1, a named equivalent |
| `engine-write-guard.mjs` (new, the entry) | **88.46 %** — 23 killed, 3 survived | **88.00 %** — 22 killed, 3 survived | 3, **all equivalents** |

📉 **The entry's score went DOWN when the code got better, and that is the number behaving correctly.**
One first-pass survivor was the `catch` body emptied — it survived because it *was* dead: `manifest` is
initialised to `null`, so a read that throws never completed the assignment and the `manifest = null`
inside the catch could not be seen to fire. Deleting it (S2b-4's answer, applied again) removed one
mutant from the denominator without removing a kill, so 23/26 became 22/25. **A mutation score is a
ratio, and simplifying prod moves both ends of it** — the file is strictly better and reads 0.46 points
worse. The three left are equivalents: two `readFileSync(…, "utf8") → ""` (the family listed elsewhere
in this file), and `input.tool_input?.file_path` losing its `?.`, which throws into the fail-open
catch-all and produces the same silence. That last one has a test anyway, earned on the behaviour
rather than on the mutant: the day the catch-all is narrowed, a malformed payload must fail open *there*.

🎯 **Six of the nine survivors emptied one clause each out of the reason strings, and every
`assert.match` stayed green.** The tests sampled the sentences — the file name, the word *kept*, the
word *overwrite* — and the mutants deleted the clauses in between. That is the correct verdict on the
tests: **when the prose IS the deliverable, matching a phrase leaves most of it unjudged.** These four
sentences are the entire product of the slice (they are what an owner reads before deciding whether to
diverge their brain), so they are now asserted **whole**, and changing one costs a deliberate test edit
— the same rule the update report's wording already lives under.

🕳️ **The other two named a case no test could reach, and the cause was in the TEST HELPER.**
`brainRelative` guards `rel === ""`, i.e. the write target being the brain directory itself
(`relative(dir, dir)` is the empty string, and it passes both the `..` and the `isAbsolute` checks).
Nothing fed it. Pinned directly.

> ⚠️ **A DEFAULT PARAMETER IN A TEST HELPER SUBSTITUTES THE VALUE UNDER TEST, IN SILENCE.** Found while
> the suite was still red: `decide = (rel, manifest = MANIFEST) => …`, used in a loop over
> `[null, undefined, {}, { regimes: {} }]` to prove the guard fails open on an unreadable manifest. The
> `undefined` iteration re-injected the **real** manifest and asserted the opposite of what it claimed.
> **Third variant of the same shape this branch has now met** (after the absent optional-chained fixture
> field, and the fixture that recorded one provenance base out of four): *the test passed because it
> never asked the question.* The fix is a second, default-free helper, named for what it is.

The one survivor is an equivalent of the family already listed in this file: `regimes[regime] ?? []`
becoming `?? ["Stryker was here"]` builds a glob matching only that literal, which no brain-relative
path is.

---

## S2b's switch — the four engine scripts leave the copy bucket — 2026-08-21

Third slice of S2b, and the one that changes what a brain receives: `auto-commit`, `auto-push`,
`status-line` and `verify-rag` stop being overwritten blind. **One commit** (`8b90fc8`) — split in two,
the branch would hold a state in which nobody delivers them. State owned by
[`../plans/prospective/update-regime-owns-what-it-shipped-action.md`](../plans/prospective/update-regime-owns-what-it-shipped-action.md).

| File | First pass | After the fixes | Survivors |
|---|---|---|---|
| `lib/engine-script-refresh.mjs` (new) | **87.50 %** — 14 killed, 2 survived | **100.00 %** — 16 killed | none |
| `lib/engine-merge-apply.mjs` (the carrier, re-measured) | — | **100.00 %** — 106 killed, **unchanged** | none |
| `lib/engine-apply-plan.mjs` (**never measured before**) | **78.00 %** — 39 killed, 11 survived | **92.00 %** — 46 killed, 4 survived | 4, all equivalents |
| `update-engine.mjs` | **96.69 %** — 292 killed, 10 survived | **98.34 %** — 297 killed, 5 survived | 5, 4 of them named debt |
| `lib/reconcile-brain.mjs` | **96.74 %** — 177 killed + 1 t/o, 6 survived | — | 6, all pre-existing |
| `update-engine.mjs` — **after S2b-4** (`1d1bc3c`) | — | **98.65 %** — 293 killed, 4 survived | 4, all equivalents |
| `lib/engine-apply-plan.mjs` — **after S5a** (the `mergeDoctrine` family) | 92.00 % | **91.07 %** — 51 killed, 5 survived | 5, all equivalents: the same 4 as above **plus** the third `?? ["Stryker was here"]`, on the new bucket and discarded by the same `.filter()`. The dip is arithmetic, not a regression — one more provable equivalent over a larger denominator. |
| `lib/engine-doctrine-refresh.mjs` (**new**, S5b) | — | **100 %** — 10 killed, 0 survived | 0. A third family that is 40 lines because everything shared is shared; the batch was written against the twin's, minus the syntax gate and plus the no-provenance case the release note depends on. |
| `lib/reconcile-brain.mjs` — **after S5c** (the doctrine wiring) | 96.74 % | **96.30 %** — 181 killed + 1 t/o, 7 survived | 7, **none in the new lines**. Six are the same shapes as the previous run, line-shifted. The seventh is new only in the sense that its neighbour already survived: `JSON.parse(readFileSync(p, ""))`. **An empty encoding does not throw — it returns a Buffer, and `JSON.parse` coerces it** — so every mutant of that shape is a provable equivalent, and the one that used to die was dying by accident. Worth knowing before anyone hunts the "regression". |
| `lib/engine-apply-plan.mjs` — **after S2c** (the sacred split) | 91.07 % | **92.73 %** — 51 killed, 4 survived | 4, all already-characterised equivalents (three `?? []`, one `stem` regex), **none new and none in the new lines**. Same killed count as S5a over a smaller mutant set: the split replaced a literal array with a spread of two named ones, so a mutant stopped existing rather than starting to die. A rise that is bookkeeping, exactly like S5a's fall. |
| `update-engine.mjs` — **after S2d** (the clash block's door) | 99.41 % | **99.44 %** — 352 killed, 2 survived | 2, the same `readFileSync(p, "")` equivalents, line-shifted. **All 13 new mutants died** — the count-aware ternary, the empty-block guard and every string literal of the sentence. That is what asserting the whole line as a LITERAL buys on prose: there is no fragment left for a mutant to hide behind. |
| `update-engine.mjs` — **after S5c** (the doctrine in the report) | 98.65 % | **99.41 %** — 339 killed, 2 survived | 2, **none in the new lines**, and both the `readFileSync(p, "")` equivalent characterised on the row above. The report surface was four call sites and every one of them is now pinned by a test that names the words the owner reads. |
| `lib/skill-retirement.mjs` (**new**, S6b — the only subtractive door) | — | **100 %** — 26 killed, 0 survived | 0. Nothing here is shared with a sibling — it is the first module in the product that decides a DELETE — so every row was triangulated: proven bytes, a CRLF rewrite, an edit, an unrecorded file, no provenance at all, two blockers unsorted, and the empty directory. The verdict word and the reason word are both asserted, which is what kills the mutants that swap `preserve` for `remove`. |
| `lib/skill-retirement-fs.mjs` (**new**, S6c — the thin I/O, the only `rmSync` under `.claude/`) | **90 %** — 27 killed, 3 survived | **96.67 %** — 29 killed, 1 survived | 1, and it is documented **in the code** so the next run does not re-litigate it: `rmSync(abs, {recursive: true, force: true})`. `force` is unkillable — we only reach that line when the listing found files — and it is kept anyway, for the one case no test can stage: the owner deleting the folder in their file manager between the listing and the `rmSync`. The two that died were **real**: a tombstone is written BY HAND, so both anchors of `/\/\*\*?$/` matter (without `?`, a `/*` entry retires nothing; without `$`, an interior `/**` is stripped and the path deleted is one nobody declared). |
| `lib/engine-source.mjs` — **after S6c** (the tombstone subtraction) | — | **94.12 %** — 64 killed, 4 survived | 4, **all provable equivalents**, one of them mine and of a shape this table already names twice: `retired ?? ["Stryker was here"]` compiles to a glob that matches no path, so nothing is subtracted either way. The other three are the sibling `merge ?? []` and two `readFileSync(p, "")` Buffer coercions. |
| `lib/engine-apply-plan.mjs` — **after S6c** (a tombstone beats a regime) | 91.67 % | **93.65 %** — 59 killed, 4 survived | 4, none new: the two `stem` regex anchors and two `?? []` equivalents. The `installSkills` subtraction added behaviour AND killed mutants. |
| `lib/reconcile-brain.mjs` — **after S6c** (the retirement wired in) | 96.30 % | **96.34 %** — 183 killed + 1 t/o, 7 survived | 7, and the list is **byte-identical to the previous run's**. Which is the finding: seven minutes of CPU for zero information, and it is what turned the flow rule below into a convention. |
| `update-engine.mjs` — **after S6c** (the retirement's prose) | 99.44 % | **99.24 %** whole → **100 % on the hunk** | Whole-file: 3 survived, 1 of them NEW and real — `edited.join(", ")` → `join("")`, invisible because the test named a single edited file. Fixed (two names, one unprovable), then **re-measured on the changed lines alone**: `"scripts/update-engine.mjs:147-160"`, **17 mutants, 44 seconds, 100 %**. Against 396 mutants and 7+ minutes for the same answer. |

> ### 🔑 The flow rule this block earned (2026-08-21) — measure the CHANGE, not what surrounds it
>
> The four rows above are one experiment. **The value sat entirely in the new files and in the lines
> just written**; the cost sat entirely in re-measuring large files that had barely moved.
> `reconcile-brain.mjs` returned a survivor list identical to the previous run's, and a third whole-file
> run was **killed by the 10-minute cap** — the practice had stopped fitting inside the loop it serves.
>
> So: **a new file is measured whole, the day it is written. An existing file is measured by its changed
> lines** (`--mutate "path:147-160"`, which the runner passes straight through). The release tail keeps
> its full pass, unchanged. This is *not* "defer to the end": a hole found at the tail is repaired in a
> file nobody is holding in their head any more.
>
> The corollary is worth as much as the minutes: **on a hunk-scoped run every survivor is yours.** No
> score drift to explain, no survivor list to diff against last time — two things this very table has
> had to do three times in this release alone.
>
> Written up where it is durable:
> [`test-first-discipline`](../../../use-case-driven-harness/skills/test-first-discipline/SKILL.md)
> § *When to run it, and on what*; commands in CONVENTIONS §5quinquies; how to read a run in the
> [`mutation-testing`](../skills/mutation-testing/SKILL.md) skill § 1.
| `lib/engine-apply-plan.mjs` — **after S6b** (the `retireSkills` bucket) | 92.73 % | **91.67 %** — 55 killed, 5 survived | 5, **none in the new lines** and all of two already-characterised shapes: two `stem` regex anchors and three `?? ["Stryker was here"]` discarded by their own `.filter()` — the third being S6b's own, exactly as S5a's row predicted for the previous new bucket. The fall is the same arithmetic: one more provable equivalent over five more mutants. ⚠️ One mutant that survived at S2c (`installSkills`'s `?? []`) is dead in this run and **the kill is not attributed** — it is not killed by this file's own tests, so a sibling in the batch covers it. Recorded rather than claimed, because the shape is a known equivalent and "we fixed it" would be a fabrication. |

🛑 **The write-allowlist had never been measured, and it is the one pure function standing between a
fetched manifest and an owner's files.** `engine-apply-plan.mjs` came back at **78 %**. Three of the
eleven survivors were reachable safety holes, not style:

- **Both anchors of `ENGINE_SCRIPT` were free.** Without `^`, helper code shipped inside a staged skill
  (`engine-skills/local-mirror/scripts/helper.mjs`) reads as a merge-governed engine script and leaves
  the skill that owns it. Without `$`, so does the engine's **own `.new` sidecar** — the owner would be
  handed a merge of a merge. Neither path is sacred, so nothing downstream would have caught them.
- **The leading anchor of `ENGINE_SKILL` is `installSkills`'s only defence**, because that is the one
  bucket `computeApplyPlan` does not scrub (a declared skill is exactly what the additive install path
  is for). A manifest declaring `vault/.claude/skills/smuggled/**` read as an engine skill.
- **A manifest with no `regimes` at all** — an older one, a truncated one, an unreadable fetch — had
  never been fed to it. An allowlist's answer there must be *"you may write nothing"*.
- **The sacred scrub had only ever been shown a file INSIDE a sacred tree.** Named bare
  (`.claude/skills`) or claimed wholesale (`vault/**`), the tree hangs on re-appending one `"/"` and on
  the glob stem being stripped to nothing.

The four survivors left are equivalents: two `?? ["Stryker was here"]` defaults that the very next
`.filter()` discards, and two `stem()` regex variants (`/\/\*\*$/` and the unanchored `/\/\*\*?/`) whose
only discriminators are globs no manifest can meaningfully carry (`CLAUDE.md/*`) — every realistic entry
lands on the same side of `isSacred` either way.

⚠️ **A report key left OUT of a fixture is a disjunct that fixture never judged.** `needsRestart` is an
OR over six lists and its don't-cry-wolf test named three. A missing key reads `undefined?.length > 0` —
false **whatever the comparison says** — so `length >= 0` sailed straight past three disjuncts, one of
them older than this branch. The shape generalises: *an optional-chained field absent from the fixture
makes its whole test vacuous, and the test still passes.* Fixed by naming every list, empty, which is
also the shape a real converged reconcile hands back.

- ✅ **The new module scored 87.5 % first pass, and both survivors were the same anchors** the
  allowlist's own regex lost. Same pattern, same blind spot, measured twice in one slice: **a test that
  only ever feeds paths failing in the MIDDLE of a pattern never pays for its ends.**
- ✅ **The carrier came back at 100 % with 106 mutants, unchanged**, on its second client. That is the
  extraction's claim being re-earned rather than assumed: a carrier that needed edits to serve family
  number two would have moved its own numbers.
- ✅ **`reconcile-brain.mjs` gained no survivor** (96.11 % → **96.74 %**) despite gaining a whole wiring
  step. Its six are the pre-existing `readFileSync(…, "utf8")` family (**equivalent**, see S2b-4 below)
  and the `gitignore` write guard.

### S2b-4 — the debt this whole sub-slice existed to pay, paid by deleting the line

Fourth and last slice of S2b (`1d1bc3c`), and it wrote **no test for the line it was routed to fix**: it
removed the line. Step 7 read every `replace`-copied file's bytes back off the disk to build
`deliveredFileMap`, and **both** of that map's consumers filter their candidates through the `merge`
regime — so a copied file's bytes reached neither. The read had a job right up until S2b-3 (the four
engine scripts were in `copied`, and this readback is how their base advanced), and `runReconcileCli`,
the last writer on the update path, never did it at all. **The mutant that proved it was not the
encoding one but its neighbour**, `copied.map((rel) => [])`, which empties the entries outright and
still survived: nothing downstream can see the difference between the right bytes and no bytes.

> 🧭 **The lesson for the whole register: a surviving mutant is not evidence of an uncovered line.** It
> says *no test can see this mutation* — which is satisfied both by "nothing runs it" and by "everything
> runs it and nothing depends on it". Distinguishing them is one command: put a `throw` on the line and
> count the red tests. Here it was **18**, on the hottest path in the suite. § S2's report had recorded
> the opposite ("three more lines that never run under test"), corrected in place above.

| File | After S2b-4 (`1d1bc3c`) | Survivors |
|---|---|---|
| `update-engine.mjs` | **98.65 %** — 293 killed, 4 survived, 0 t/o | 4, **all equivalents** |

The four are named, and none is debt:

- **Two `readFileSync(…, "utf8") → ""`** (`:339` the local manifest, `:541` the brain's `source`). `""`
  is falsy, so Node's `assertEncoding` accepts it and returns a **Buffer**; `JSON.parse` stringifies it
  identically. Nothing a test can assert on differs. *(This is the third time this file has re-derived
  that fact — twice correctly, once not.)*
- **Two `preserved = ["Stryker was here"]` defaults** (`skillsPreserved`, `scriptsPreserved`). The
  default IS exercised — the sibling mutant on `skillsMerged` dies to the same fixtures — but every
  entry passes through `PRESERVED_ASIDE[reason]`, and an entry with no `reason` is `continue`d. A
  garbage default is **silent by construction**, which is exactly the property that block was written
  to have. Killing it would mean asserting on a report shape production cannot produce.

`runUpdateCli`'s `argv = process.argv.slice(2)` default, the fifth survivor of the previous run, was
killed by a test calling it with no arguments.

---

## S2b's syntax gate — `engine-script-check.mjs`, on bytes that exist nowhere else — 2026-08-21

Second slice of S2b: the merge's output is parsed before it is written, because S2b's four files are
**executed** at every session. State owned by
[`../plans/prospective/update-regime-owns-what-it-shipped-action.md`](../plans/prospective/update-regime-owns-what-it-shipped-action.md).

| File | First pass | Survivors |
|---|---|---|
| `lib/engine-script-check.mjs` | **100.00 %** — 26 killed, 0 survived | none |
| `lib/engine-merge-apply.mjs` (the gate's wiring) | **100.00 %** — 106 killed, 0 survived | none |

The carrier went **86 → 106 mutants**: twenty new ones for a gate that is four lines, and all twenty
killed. That ratio is the point of measuring the whole file — a branch this small is exactly the kind
a diff-shaped review waves through, and it is the branch standing between a merged `auto-commit.mjs`
and a brain that quietly stops saving itself.

✅ **The refined rule from S2b-1 held, and this is the run that confirms it.** This module is impure by
construction — it spawns a subprocess — and it scored **100 % on its first pass**, where S1's fs
orchestrator and S2a-2's git seam both landed near 75 %. The difference is not purity: **S2a-2's
lesson had already been paid**, so the failure shapes were enumerated in the batch from the start (a
runner that cannot spawn, a null status met *alone* so it cannot hide behind the `error` guard, and a
status outside `{0, 1}`). *A first pass measures how well the inputs were named* — and a lesson written
down is a lesson that names them for you the next time.

- 🧭 **The exit-code contract was measured before being relied on.** `0` parses, `1` does not, and an
  unknown flag exits `9`. Treating "non-zero" as "broken" would have condemned a good file for ever the
  day node itself complained, so anything outside `{0, 1}` throws. **A binary-looking exit code is
  rarely binary**, and the cost of finding out was one shell loop.
- ⚠️ **Three tests in the batch pass against a skeleton returning a constant `false`** (the "does not
  parse" cases). They are not weak: their *positive* twins sit beside them and are red against the same
  skeleton, so the pair is what discriminates. A negative contract asserted alone is the shape to
  distrust.

---

## S2b's extraction — `engine-merge-apply.mjs`, the merge's journey to the disk — 2026-08-21

First slice of S2b: `refreshUntouchedSkills`'s inner loop becomes a carrier that knows nothing about
the kind of file it carries, so the engine scripts (S2b-3) and the constitution (S2c) can use the same
journey. State owned by
[`../plans/prospective/update-regime-owns-what-it-shipped-action.md`](../plans/prospective/update-regime-owns-what-it-shipped-action.md).

| File | First pass | Re-measured after the flaky-test fix (`211cfc5`) | Survivors |
|---|---|---|---|
| `lib/engine-merge-apply.mjs` | **100.00 %** — 86 killed, 0 survived | **100.00 %** — 86 killed, **unchanged** | none |
| `lib/engine-skill-refresh.mjs` (what is left of it) | **100.00 %** — 28 killed, 0 survived | **100.00 %** — 28 killed, **unchanged** | none |

✅ **Both first passes landed inside the flaky window** (see the warning at the top of this file), so
both were **re-measured after the fix and came back identical**. That matters more than the score: it
says these two numbers were not bought with noise, and it is the reason the correction above can name
`update-engine.mjs` specifically instead of casting doubt on everything.

**The mutant count is the extraction's own audit.** S2a-3 measured 113 mutants in
`engine-skill-refresh.mjs`; the same code now measures **86 + 28 = 114** across the two files. Code
that MOVED conserves its mutants; code that was copied would have inflated the total, and code that
was lost would have shrunk it. One number, and it answers "is this a refactor?" without reading a diff.

⚠️ **This run breaks the pattern this file has been recording, and the break is the lesson.** Twice now
(S1's fs orchestrator, S2's git seam) an **impure** module scored ~75 % on its first pass while every
**pure** one scored 100 %, and the stated reason was that a pure module's inputs are all visible in its
signature. `engine-merge-apply.mjs` is as impure as they come — `readFileSync`, `writeFileSync`,
`rmSync`, `mkdirSync` — and it scored **100 % first pass**. What actually separates the two cases is
not purity: it is whether the author had **already been forced to name every input**. This code arrived
with its tests already written against it, at a call site that had already paid for three survivors.
So the rule to keep is the narrower one: *a first pass measures how well the inputs were named, and
impurity is merely the most common way to leave one unnamed.*

The nine verdict rows are not re-litigated here (`engine-merge.mjs` owns them) and the skills' end-to-end
proof stays in `engine-skill-refresh.test.mjs`. What the new file's own tests pin is what only it
decides: the grouping, the (installed ← source) pairing, the self-heal guard, and the four ways bytes do
or do not reach the disk.

- ⚠️ **One test in that batch could not be red before the code existed**, and it is written down rather
  than dressed up: *"sourceDir === brainDir writes nothing and reports nothing"* is a contract a
  skeleton satisfies by doing nothing. It is the mutation run that judges it — drop the guard and the
  brain reads itself as its own candidate, landing `preserve: customized` in the report and overwriting
  the stale sidecar with the owner's own bytes. Both assertions catch that; neither would if they only
  counted files.

---

## S2's report — `update-engine.mjs`, where the merge stops being silent — 2026-08-21

Fourth slice of S2 (S2a-3b): `skillsMerged` and `conflicts` travel from the refresher to the sentence
the owner reads. State owned by
[`../plans/prospective/update-regime-owns-what-it-shipped-action.md`](../plans/prospective/update-regime-owns-what-it-shipped-action.md).

| File | Score | Survivors |
|---|---|---|
| `update-engine.mjs` | ~~**98.95 %** — 282 killed, 3 survived~~ ⚠️ **inflated, see below** | ~~3~~ |
| `update-engine.mjs` — **re-measured 2026-08-21 on `211cfc5`** | **97.54 %** — 278 killed, 7 survived | 7, all **pre-existing**, none in this slice's code |
| `update-engine.mjs` — **after S2b-3** (`739b7e0`) | **98.34 %** — 297 killed, 5 survived | 5 — see [§ S2b's switch](#s2bs-switch--the-four-engine-scripts-leave-the-copy-bucket--2026-08-21) |
| `update-engine.mjs` — **after S2b-4** (`1d1bc3c`) | **98.65 %** — 293 killed, 4 survived | 4, **all equivalents** — the debt is closed |

✅ **S2b-3 paid two of the seven while passing through**, without setting out to: `:465` (the brain's
recorded `source`) and `releases: []` both died to the fixtures that slice tightened. **S2b-4 closed the
rest**: `runUpdateCli`'s `argv` default died to a test, the `copied` readback died with the line itself,
and the two remaining encoding mutants turned out to be **equivalents, not lines** (see the correction
box below). The line numbers moved with each slice; the shapes did not.

🛑 **The first figure was measured against a suite that failed ~75 % of the time for reasons unrelated
to the mutant** (the flaky temp-dir sweep — see the warning at the top of this file; under the
`command` runner every such failure reads as a kill). The re-measurement after the fix is the real one,
and the four extra survivors are **not a regression**: they are holes the noise had been masking. Three
of them are `readFileSync(…, "utf8")` mutants that survive an invalid encoding, and the fourth is
`runUpdateCli`'s `argv = process.argv.slice(2)` default, which no test exercises by omitting `argv`
(**paid at S2b-4**).

**None of the seven is in the lines this slice added**, and saying so is the point of measuring a whole
file rather than a diff: the run judged 285 mutants and the new report block killed every one of its
own.

> 🛑 **CORRECTED 2026-08-21 (S2b-4). The sentence that used to stand here — "three more lines that
> never run under test" — was WRONG, and this file already held the right answer.** A
> `readFileSync(…, "utf8") → ""` mutant proves nothing about coverage: `""` is FALSY, so Node's
> `assertEncoding` waves it through and hands back a **Buffer**, and every consumer here (`JSON.parse`,
> `createHash().update()`, `writeFileSync`) treats that Buffer exactly as it treats the string. The
> mutants are **equivalent**. Measured rather than argued: replacing the same line with a `throw`
> turned **18 tests red**, so it is not merely covered, it is on the hot path of the whole suite.
> ➡️ The same fact was already recorded, correctly, in at least **four** earlier places —
> [§ Listed equivalents (do not chase)](#listed-equivalents-do-not-chase) and
> [§ Recorded equivalents (this release)](#recorded-equivalents-this-release) among them — and
> re-derived wrongly here. **A survivor is not evidence of an uncovered line** — and a corpus that
> already knows something still has to be *read* to know it.

- 🔴 **A real gap, and it is in this chantier's own subject.** The `deliveredFileMap` construction read
  every **copied** file's bytes back off the disk — and the mutant that proves it is the OTHER one on
  that line, `copied.map((rel) => [])`, which empties the entries outright and still survives. That map
  feeds `reseedProvenance` **and** `syncBaseTree`. **Routed to S2b**, which reworks exactly that path
  when the four engine scripts leave `replaceScripts`. ➡️ **Narrowed 2026-08-21 by S2b's design to the
  sub-slice `S2b-4`, deliberately LAST**: the four scripts leaving the copy bucket changes what `copied`
  contains, so a test pinned before that switch would be rewritten by the very slice it was meant to
  guard. ✅ **PAID at S2b-4 (`1d1bc3c`) — by DELETION, not by a test.** Both consumers filter their
  candidates through the `merge` regime, so a `replace`-copied file reached neither; the pass was read
  and discarded. It had a job until S2b-3 (the four scripts were in `copied`, and this is how their base
  advanced), and `runReconcileCli` — the last writer on the update path — never did it at all. **The
  fix for a line whose effect no test can see is sometimes to establish that nothing should see it.**
- ⚪ **An equivalent mutant, kept as such.** The `skillsPreserved = []` default survives being given a
  junk array: only its *iterability* is observable (a string entry destructures to `undefined` fields
  and is skipped by the same filter that skips `no-provenance`). The default is load-bearing — without
  it a report omitting the key would throw — but its value cannot be asserted. Contorting a test to
  pin an unobservable is how a suite starts lying.
- ⚪ **An equivalent mutant that names a duplication.** `releases: []` in `runUpdateCli`'s "unknown"
  report is never read: `formatUpdateCheck` ignores the field on that branch. The survivor is the
  symptom; the defect is that this literal **hand-rolls a second copy** of the report shape
  `checkUpstream`'s own `unknown()` helper already builds. Cleanup named, not improvised at the end of
  another slice.

---

## S2's rewiring — `engine-skill-refresh.mjs`, where the merge reaches a real brain — 2026-08-20

Third slice of S2: the refresher drops its own verdict for `mergeVerdict` and carries the result to
disk. State owned by
[`../plans/prospective/update-regime-owns-what-it-shipped-action.md`](../plans/prospective/update-regime-owns-what-it-shipped-action.md).

| File | First pass | After the survivors were paid | Survivors left |
|---|---|---|---|
| `lib/engine-skill-refresh.mjs` | **98.23 %** — 111 killed, 2 survived | **100.00 %** — 113 killed, 0 survived | none |

⚠️ **Both figures were measured inside the flaky window** (see the warning at the top of this file), so
the 100 % is an upper bound rather than a fact. What this slice's code became was re-measured at S2b-1
after the fix — the entry to read for a trustworthy number on this file is
[§ S2b's extraction](#s2bs-extraction--engine-merge-applymjs-the-merges-journey-to-the-disk--2026-08-21).
The **survivors named below stand regardless**: a mutant that survived a noisy suite would have survived
a quiet one too, since the noise only ever adds kills.

**Three survivors across two rounds, and each named a hole worth more than the score.**

- **The dedup was keyed on the wrong question.** `noteOnce` survived being mutated to *"have I said
  anything yet"* instead of *"have I said THIS"* — because no test ever had two **different** skills on
  the same list. Mutated that way it **silences every conflict after the first**, which is the one
  failure an owner cannot recover from: they resolve one file and never learn the rest exist. The rule
  had been asserted on `skillsRefreshed` since increment 2.5 and on nothing else, so the two lists this
  slice adds could each lose it alone.
- **A merge that changes nothing was free to rewrite the file.** Identical bytes cannot tell a write
  from a skipped one, so the assertion had to move to the **mtime**: a brain auto-commits at every
  session, and rewriting a converged file would leave a trail of empty *"updated coach"* commits for
  merges that changed nothing.

**What the batch got right first time is the trap it was written against**: `refreshedFileMap` carries
the verdict's `deliver` — what the **engine** delivered — never the merged bytes. That map feeds
`reseedProvenance` and `syncBaseTree`, so recording the merge as the ancestor would make the file read
untouched at the next update, and the fast-forward would clobber the edit just preserved. Asserted as
a whole object on the merge row, where the two differ.

---

## S2's git seam — `engine-merge-git.mjs`, the merge's one impure half — 2026-08-20

Second slice of S2, and impure by design: the three texts handed to `git merge-file -p --diff3`. State
owned by [`../plans/prospective/update-regime-owns-what-it-shipped-action.md`](../plans/prospective/update-regime-owns-what-it-shipped-action.md).

| File | First pass | After the survivors were paid | Survivors left |
|---|---|---|---|
| `lib/engine-merge-git.mjs` | **75.00 %** — 42 killed, 14 survived | ~~**100.00 %** — 55 killed~~ ⚠️ inflated | ~~none~~ |
| `lib/engine-merge-git.mjs` — **re-measured 2026-08-21 on `211cfc5`** | — | **98.18 %** — 54 killed, 1 survived | 1, an equivalent |

⚠️ **This is the file that carried the flaky test**, and its 100 % was measured with that test in
place (see the warning at the top). Re-measured after the fix: **98.18 %**. The irony is worth
recording rather than hiding — the module whose test was inflating the corpus's scores is the one
whose own score the inflation flattered into a perfect mark it had not earned.

- ⚪ **The one survivor, and it is an equivalent kept as such.** `rmSync(dir, { recursive: true, force:
  true })` in the cleanup `finally` survives `force: false`. Under test the two are indistinguishable:
  `mkdtempSync` runs **before** the `try`, so reaching the `finally` at all means the directory exists,
  and `force` only ever suppresses `ENOENT`. It is **not** noise to delete, though: it guards the case
  no test can stage — an external temp sweeper removing the directory mid-merge — where `force: false`
  would throw **from a `finally`** and replace a completed merge with an exception. Load-bearing in the
  world, unobservable from the suite. Contorting a test to pin it is how a suite starts lying.

**The same 100 % / 75 % split as S1, on the same fault line, one slice apart.** The pure verdict table
scored 100 % on its first pass; the moment the identical design met a subprocess, the tests stopped
being sufficient. Twice now, and it is no longer a coincidence to file under care: **a pure module's
inputs are all visible in its signature, so a batch written from a design covers them; an impure one
has inputs the author never names — a status code, a stderr, an `error` field — and a test batch
reaches only the ones it happened to think of.**

**Fourteen survivors, one hole.** A missing binary sets **both** `error` **and** a null status, so the
single failure test covered two guards at once and each was free to vanish behind the other. Every
guard is now met alone, through an injected runner — and only there: the merges themselves stay on real
git, because a subprocess contract proven by a stub proves nothing.

- **The boundary was asserted from one side only.** `status >= 128` survived becoming `>`. Triangulated
  now: **127 is still a conflict COUNT** (treating it as a crash would hand the owner a preserved file
  for a merge that worked), **128 and up is git refusing to run**.
- **The failure message was never read.** Three survivors lived inside it (`throw new Error("")`, the
  `?? ""` fallback, the `.trim()`). It is asserted whole now, because it is the diagnosis an owner
  sends back: git pads its stderr with a newline, and a message carrying that padding reads as a
  truncated sentence.
- **One survivor died by simplifying the production**, as on `session-status.mjs` and
  `engine-base-fs.mjs` before it: `buildMergeFileInvocation` carried its own `gitBin` default, which no
  call site can reach since `mergeWithGit` always passes one. An unreachable branch is a survivor by
  construction, not a missing test.

---

## S2's merge core — `engine-merge.mjs`, the verdict table — 2026-08-20

**First production slice of S2**, and pure again on purpose: the decision that finally uses the bytes
S1 put on disk. The merge itself arrives as an injected function, so what this run judges is the
*decision*, not git. State owned by
[`../plans/prospective/update-regime-owns-what-it-shipped-action.md`](../plans/prospective/update-regime-owns-what-it-shipped-action.md).

| File | First pass | After the table was corrected | Survivors left |
|---|---|---|---|
| `lib/engine-merge.mjs` | **100.00 %** — 47 killed, 0 survived | **100.00 %** — 57 killed, 0 survived | none |

⚠️ **And a 100 % that was measuring the wrong thing — worth more than the score.** Both passes are
clean, yet the design under the first one carried a defect that would have **frozen every skill on the
fleet**: it asked the base's BYTES for questions the recorded sha answers, and `reconcileBrain` runs the
skill refresh *before* `syncBaseTree` lays the tree down. Every mutant died against a table that was
internally consistent and wrong at its only real call site. **A mutation score judges the tests against
the code, never the code against the world** — what caught this was wiring the module to its caller,
three commits later. Filed here beside the number so the number is not read as more than it is.

**Why a first pass at 100 % is credible here rather than flattering.** The pattern measured on S1
stands: pure code flatters a test batch, and this slice is pure. What kept the batch honest is that the
table was written into the plan *before* any test, so the eleven cases are the design's own rows and
not a retelling of the implementation. Two assertions carry more than their weight:

- **`write` and `deliver` are asserted as one whole object, on every row.** They differ on exactly one
  (a clean merge writes the merged bytes, delivers the candidate), so an implementation that delivered
  the merge would pass any test checking only what lands on disk — and would silently reintroduce the
  clobber this chantier exists to end, one update later.
- **The merge double's result is a sentinel string no other input can produce**, and its call is
  asserted as `{base, ours, theirs}` by name. The ours/theirs inversion is a three-way merge's silent
  catastrophe: swapped, the merge still returns a plausible file in which the engine wins every hunk the
  owner touched. Only the roles, asserted by name, catch that.

---

## S1's fs orchestrator — `engine-base-fs.mjs`, the first slice that touches the disk — 2026-08-20

**Fourth and last production slice of S1**, and the first that is not pure: the thin I/O that carries
the three planners to disk, plus its wiring into the installer and both update writers. State owned by
[`../plans/prospective/update-regime-owns-what-it-shipped-action.md`](../plans/prospective/update-regime-owns-what-it-shipped-action.md).

| File | First pass | After the survivors were paid | Survivors left |
|---|---|---|---|
| `lib/engine-base-fs.mjs` | **75.00 %** — 33 killed, 11 survived | **95.00 %** — 38 killed, 2 survived | 2, both named below |

**The first pass under 100 % of this chantier, and the run earned its keep twice.** The three pure
planners had all scored 100 % on their first pass; the moment the same design met a filesystem, the
tests stopped being sufficient — which is the honest reading, not a regression in care.

- **The advance's own digests were load-bearing in the production and inert in every test.**
  `syncBaseTree` folds the shas it just computed into the record its seeding pass reads. Every case had
  handed in a provenance that *already* described the delivery, so the fold changed nothing and a mutant
  emptying it survived. The case that kills it hands in the record **as it stood before the re-seed**,
  and pins the contract that fold exists for: **a file just advanced is never reported back as the
  owner's customization.** That is precisely the false positive this release exists to remove, so the
  hole was in the middle of the subject.
- **An ordering guarantee asserted only on inputs that were already ordered.** Ten of the eleven
  survivors were the three `.sort()` calls and the comparator: every fixture happened to be in path
  order, so removing the sort changed nothing. Both maps of the new case are written in **reverse** path
  order.
- **One survivor died by simplifying the production**, as on `session-status.mjs` before it: the
  comparator spelled out an equal case (`? 0`) that no input can reach, since a rel appears once. An
  unreachable branch is a survivor by construction, not a missing test.

**The 2 left, named rather than implied:**

1. `a.rel <= b.rel` for `a.rel < b.rel` — **a true equivalent**: the two differ only on equal paths, and
   a path appears at most once in the list being sorted.
2. Dropping `.sort()` on the **`seeded`** list — **not killable without controlling the filesystem's
   own order.** Seeds come out in the order `readInstalledMergeFiles` returns, i.e. the order
   `readdirSync` walked the brain, which is neither sorted nor guaranteed across platforms. A test
   proving the sort would have to assume a walk order it cannot fix, so it would be a test about macOS,
   not about this code. Recorded here instead. *(The same guarantee IS proven for `advanced` and
   `deferred`, whose pre-sort order comes from the caller's maps.)*

**Reproduce**: `node maintainers/mutation/mutate-one.mjs scripts/lib/engine-base-fs.mjs`.

---

## S1's seeding planner — `planBaseSeed`, same file, same day — 2026-08-20

**Third production slice of the unfreeze chantier** (the migration: a brain seeds its own base tree
from itself, with nothing to fetch). Same branch, same file; state owned by
[`../plans/prospective/update-regime-owns-what-it-shipped-action.md`](../plans/prospective/update-regime-owns-what-it-shipped-action.md).

| File | First pass | Survivors left |
|---|---|---|
| `lib/engine-base.mjs` *(+ `planBaseSeed`)* | **100.00 %** — 57 killed, 0 survived | 0 |

**No survivor, first pass again** — 19 mutants more than the 38 the file carried before the function.
Measured **on `HEAD`, after the green commit**, per the stop sign now in the skill.

What paid for it: the cases that pin a *state* rather than a happy path — a base already present and
provable (left alone), a base that drifted (re-seeded), a recorded file the owner deleted (named, not
skipped), and a file delivered empty. Three of those four are unreachable from the nominal case, and
the "already provable" one is the guard that keeps this migration from overwriting a correct ancestor
with a file the owner has edited since.

**Reproduce**: `node maintainers/mutation/mutate-one.mjs scripts/lib/engine-base.mjs`.

---

## S1's advance rule — `planBaseAdvance`, same file, same day — 2026-08-20

**Still not a release: the second production slice of the unfreeze chantier** (the base moves to what
was *delivered*, never to what was fetched). Same branch, same file as the section below; the step's
state is owned by
[`../plans/prospective/update-regime-owns-what-it-shipped-action.md`](../plans/prospective/update-regime-owns-what-it-shipped-action.md).

| File | First pass | Survivors left |
|---|---|---|
| `lib/engine-base.mjs` *(+ `planBaseAdvance`)* | **100.00 %** — 38 killed, 0 survived | 0 |

**No survivor, first pass** — 3 mutants more than the 35 the file carried before the function, all
killed. The cases that earned it are the two a green suite would not have needed: a file delivered
**empty** (the falsy-content skip, invisible to every other case) and a `replace`-regime path in the
delivery map (the false positive S1 exists to kill).

> ⚠️ **The runner measures `HEAD`, not the working tree — and it will happily hand you a green score
> about code you have not written yet.** Measured live the same day: the first run on this slice
> returned **100 %, 35 killed** while `planBaseAdvance` sat uncommitted; `mutate-one.mjs` resets its
> disposable worktree to `git rev-parse HEAD`, so the number was the *previous* commit's, re-measured.
> Nothing in the output says so. **Commit green, then measure** — the reflex is now written into
> [`../skills/mutation-testing/SKILL.md`](../skills/mutation-testing/SKILL.md) §2.

**Reproduce**: `node maintainers/mutation/mutate-one.mjs scripts/lib/engine-base.mjs` (log
[`reports/mutate-one-engine-base.log`](reports/mutate-one-engine-base.log) — one log per file, so this
run overwrote the one below; the numbers, not the log, are the record).

---

## S1's first slice — `lib/engine-base.mjs`, measured the day it was written — 2026-08-20

**Not a release: the first production file of the unfreeze chantier** (the immutable base per `merge`
file). Same branch as S0bis below; the step's own state is owned by
[`../plans/prospective/update-regime-owns-what-it-shipped-action.md`](../plans/prospective/update-regime-owns-what-it-shipped-action.md),
this section owns only the number.

| File | First pass | After the survivor | Survivors left |
|---|---|---|---|
| `lib/engine-base.mjs` *(new)* | 97.14 % | **100.00 %** | 0 |

**This is the day-of runner's first use on the work it was built for**, one commit after it shipped:
the file was mutated the same hour it was written, not at the release tail, and the whole round cost
two runs of ~70 s.

**The single first-pass survivor was worth the run, and it was NOT an equivalent.** Stryker dropped the
raw `fingerprint(baseContent) === recorded` half of the base's proof, keeping only the EOL-normalized
one — green, because normalizing LF content is the identity. The case it silently gave up is real and
Windows-only: a brain installed on Windows fingerprints whatever it copied, so **the recorded sha
itself can be taken over CRLF bytes**, and there the normalized comparison hashes LF and misses. The
two terms serve **opposite halves of the fleet**, and the suite had a case for one half only —
reflex 9 (a condition with N reasons needs N tests, one per reason alone). Mutant applied by hand
before and after the new case, per the skill.

**Reproduce**: `node maintainers/mutation/mutate-one.mjs scripts/lib/engine-base.mjs` (log
[`reports/mutate-one-engine-base.log`](reports/mutate-one-engine-base.log)).

---

## The day-of runner, and its first two runs — 2026-08-20

**Not a release either: the tooling.** Same branch as S0bis below. §5quinquies had carried the
one-file recipe **in prose** since v4.8.0 and the traps kept being paid anyway, so the recipe became a
script — [`mutate-one.mjs`](mutate-one.mjs) — with the [`mutation-testing`](../skills/mutation-testing/SKILL.md)
skill beside it for the judgement half.

| Run | Score | Survivors left |
|---|---|---|
| `mutate-one.mjs` **on itself**, first pass | 80.95 % | 64 |
| `mutate-one.mjs` **on itself**, after one hardening round | **99.11 %** | 3, all named below |
| `scripts/lint-vault.mjs` *(the S0bis canary, never measured until now)* | **70.00 %** | 3 |

**The tool's own 64 first-pass survivors sorted into the three families the skill names**, which is
the first evidence that those families generalise beyond `session-status.mjs`: ~30 in the composition
root (every case drove the run through doubles, so `run`, `symlink`, `writeFile` and `say` could each
be emptied whole with the suite green), ~25 message literals blanked to `""` on output that is the
run's only account of itself, and the rest genuine missing cases — a git step failing mid-plan, a
write-guard exiting non-zero while printing a clean summary, a Stryker threshold break that prints a
perfect table and exits non-zero.

**The 3 survivors left are equivalents, named rather than rounded up:**

- `cells.length >= 8` → `> 8` — a Stryker clear-text row always splits into **9** cells, so no log can
  distinguish the two bounds.
- `encoding: "utf8"` → `""` — the captured output is built in a template string, which coerces a
  Buffer to exactly the same text.
- the entry tail `runAsEntrypoint(…)` — killed only by the two `^entry point` cases that
  [`stryker.maintainers.config.mjs`](stryker.maintainers.config.mjs) deliberately **skips**: they spawn
  the real file, so a mutant flipping `dryRun` to false would run `git worktree add` for real from
  inside a test. Excluding tests can only make a score pessimistic, never inflate it.

**What the first real run found, on its first use** — `scripts/lint-vault.mjs`, the S0bis canary,
converted and ticked but whose score was never recorded: **70.00 %**, and all 3 survivors sit in its
**composition root** (`realLintDeps.cwd`, `realLintDeps.error`, and `toPosix`'s `"/"`). Family 1
again, on a file everyone considered done. **Recorded as remaining entry-tier debt, not fixed here**:
it belongs to the S0bis ceilings, not to the tooling slice.

**Reproduce**: `npm --prefix maintainers/mutation run mutate:maintainers` (logs
[`reports/mutate-one-self.log`](reports/mutate-one-self.log)) and
`node maintainers/mutation/mutate-one.mjs scripts/lint-vault.mjs` (log
[`reports/mutate-one-lint-vault.log`](reports/mutate-one-lint-vault.log)).

---

## S0bis — the two structural debts, paid (`scripts` only) — 2026-08-20

**Not a release: the debt run itself.** Branch `chore/s0bis-entrypoint-mutation-debt`, working contract
in [`../plans/archived/2026-08-23-agent-orchestrated-release-mode-action.md`](../plans/archived/2026-08-23-agent-orchestrated-release-mode-action.md),
debt statement in [`../plans/archived/2026-08-23-v4.9.0-mutation-debt-plan.md`](../plans/archived/2026-08-23-v4.9.0-mutation-debt-plan.md).
It exists to pay the **two named structural debts** the [v4.8.0 run](#v480--the-release-that-looks-upstream-scripts-only--2026-08-05)
recorded and every published tag has carried since: the **entry-guard tier** (top-level scripts whose
whole body no test can import, hence 0 %) and **`defaultGit`'s inline invocation** (54.05 %).

| File | Before | After | Survivors left |
|---|---|---|---|
| `lib/entrypoint.mjs` *(the shared tail)* | — | **100.00 %** | 0 |
| `status-line.mjs` | **0.00 %** *(v4.8.0)* | **100.00 %** | 0 |
| `upstream-check-run.mjs` | **0.00 %** *(v4.8.0)* | **100.00 %** | 0 |
| `lib/engine-fetch.mjs` | **54.05 %** *(v4.8.0)* | **84.21 %** | 12 |
| `lib/entrypoint-discipline.mjs` *(new — the guard)* | — | 71.82 % → **81.44 %** | 54 |
| `session-status.mjs` | **8.67 %** *(v4.9.0)*, 0.00 % since v4.4.0 | 70.89 % → 90.12 % → **96.10 %** | 6 |

**Both 0 % files end at 100 %** — the tier v4.4.0 named and four releases carried is no longer a tier
of its own for them. The mechanism is the one settled at v4.5.0 and never propagated until now: one
shared `runAsEntrypoint(metaUrl, argv, fn)`, tested once, with each script's body passed in as an
**importable function**. What used to be unreachable code became ordinary code, and ordinary code is
measurable. `upstream-check-run.mjs` needed **15 mutants' worth** of tests to get there; the 0 % was
never a hard problem, only an unreachable one.

**Debt 2 is paid the same way it was solved at v4.5.0**: `defaultGit`'s request became a pure value
(`buildGitInvocation(args) → {command, args, options}`, asserted whole), and the comment in which the
code **documented its own exemption** — *"Used by the core's CLI wiring, never by the unit tests"* — was
deleted with the fix. 54.05 % → **84.21 %**; the 12 survivors left are in the file's other functions,
not in the runner.

**What is genuinely new here is the guard, and it earned its keep on day one.** `lib/entrypoint-discipline.mjs`
+ its repo-wide test go red on a hand-rolled entry guard, on a top-level script with no test sibling,
and on a child process **built and executed in the same call**. Switched on before the conversions
started, it went red on exactly one production file: `engine-fetch.mjs` — the Debt-2 file. The debt did
not have to be remembered; it was **reported**. Two ratchets carry the rest: descending numeric
**ceilings** for the entry-guard shape (fan-out-safe — parallel agents never touch the guard test) and
**named allowlists** for the rest, where shrink-only is *enforced* rather than promised: an exemption
that is no longer an offender **turns the suite red until it is deleted**.

**Counted, not estimated: 26 files carried the shape, not the 20 the debt plan assumed** — 16 via
`isEntrypoint`, 7 inline, 2 via `auto-commit.mjs`'s duplicate `isEntryPoint`, and 1 via a *third*
spelling nobody had recorded (`import-brain.mjs`'s `isMain()`). Fifteen are converted; the ceilings
stand at **14 / 9**, down from 32 / 26.

### `session-status.mjs` — 8.67 % → 96.10 %, and how a file you may not run gets a net

Held back from the batches above as a **blocking arbitration**, then answered by the owner the same
day ("yes, now, with me at the keyboard") and paid. It is the head of the entry-guard debt: **0.00 %
on every published tag from v4.4.0**, 8.67 % at v4.9.0, and the one file of the tier that **cannot be
verified by running it** — executing it sweeps and auto-commits the importer's own working tree.

**The disposable worktree is what restored fail-first**, and that is the transferable part. Inside a
throwaway checkout a sweep-and-commit is harmless, so the red could be taken for real: importing the
unconverted file ran the whole SessionStart hook — pull, markers, detached child, banner on stdout.
The body then moved into `runSessionStatus(argv, deps)` behind the shared tail **without
restructuring**, and the real hook was run as a process **before and after**: output byte-identical,
tree untouched. Three measured rounds followed: **70.89 % → 90.12 % → 96.10 %**.

**The 46 first-pass survivors sorted into three families, and only one was about missing cases:**

1. **The real adapter layer, judged by nothing.** Every case drove the hook through doubles, so
   `realGit` and the DB read were never executed at all — a mutant could empty either one whole. Both
   became injected functions with their own tests (`runGitInvocation`, `readDocCountFrom`), and the
   two seams that still need the real world are proved by the one call safe enough to make:
   `git --version`, and a `readDocCount` of a database that is not there.
2. **Doubles that ignored their arguments.** The fake fs took `(p)` and dropped the rest, so every
   `readFileSync(p, "utf8")` could lose its encoding — handing a Buffer to code that string-matches
   it — with the suite still green. **Six survivors lived in that one omission.** The fakes now assert
   their second argument. *A double's answer has to be a fingerprint of what it was asked, or it
   certifies nothing.*
3. **Genuine missing cases**: a failed pull (which must never be asked what it changed — `ORIG_HEAD`
   means nothing then), a pull that landed and reports its count, a last-run that recorded a refused
   note, a converged brain that spawns nothing, a manifest with no `source` block, and the Gemini key
   line asserted **whole** instead of by its first sentence — three literals, of which two could be
   blanked unseen, on the line that tells an owner why their brain cannot answer.

**Five of the second round's 16 survivors were killed by SIMPLIFYING the production**, which is the
better answer whenever it applies: the run-state read and the bootstrap read each guarded themselves
with `existsSync` **and** a `try/catch`. An absent file throws on read and lands in the same branch, so
the guard was a second spelling of the catch — two branches, four mutants, no behaviour of its own.
Both catch bodies then re-assigned `null` to a variable that was already `null`. Deleted, reasons kept
as comments.

**The 6 survivors left are named equivalents, not rounding:**

- `realOpenDatabase` and its two path literals (3) — only a real `better-sqlite3` load exercises them,
  and any wrong path throws into the catch that already answers `null`. Same answer, either way.
- `markerIo.readFileSync` (2) — the marker **writer** never reads; only the gate's reader does, at a
  different call site with its own tests.
- `pulled: []` (1) — `changedCount` is rendered only on the "📥 Repo updated" branch, which is
  unreachable exactly when the `[]` branch is taken.

🪤 **A trap this run uncovered, and the next person will hit it too: mutating a file that a SOURCE
SCANNER reads breaks the dry run.** Stryker instruments in place, so the literals
`lib/entrypoint-discipline.mjs` scans for are rewritten under it; `session-status.mjs` stopped reading
as an inline-invocation offender and the shrink-only allowlist assertion went red — correctly, on a
file that was still an offender when clean. **Paid rather than worked around**: its git call and its
two detached children became named values (`buildGitInvocation`, `buildReconcileInvocation`,
`buildUpstreamProbeInvocation`), and the file left `INLINE_INVOCATION_EXEMPT`. A named value is stable
under instrumentation as well as assertable. *(Caught alongside it: binding the injected `spawn` to
`spawnChild` hid both spawn calls from the scanner's token list. A rename must not be able to buy
silence from a guard.)*

**Reproduce**: `--mutate "scripts/session-status.mjs"`, worktree `kenjaku-mut-sessionstatus`, log
[`reports/s0bis-session-status.log`](reports/s0bis-session-status.log) (the third and final round).

**One thing this run deliberately did NOT do**, written down rather than left implied:

- **`lib/entrypoint-discipline.mjs`'s own 81.44 % is below the repo norm** (~94 %). One hardening round
  took it 71.82 % → 81.44 %; the 54 survivors left are in the hand-rolled comment/quote state machine,
  where a large share are boundary equivalents. Named as the top follow-up rather than rounded up: a
  guard that judges the repo should be measured at least as strictly as what it judges.

**Reproduce**: batch recipe of §"Reproduce" below, worktree `kenjaku-mut-s0bis`, logs
[`reports/s0bis-batch1.log`](reports/s0bis-batch1.log),
[`reports/s0bis-batch2.log`](reports/s0bis-batch2.log).

---

## v4.9.1 — the switch that leaves the machine (`scripts` only) — 2026-08-15

**Scope decided on the diff** (`main...hotfix/v4.9.1-universe-pointer`), the targeted run §5ter
prescribes before a tag: **6 production files, all under `scripts/`** — two of them written by this
release. `rag/**` and `local-mirror/**` are untouched by this hotfix, so those packages' numbers carry
over, deliberately not re-measured. Run in the disposable worktree `kenjaku-mut-v491`, with
`rag/node_modules` symlinked in and `vault-write-guard.test.mjs` verified there first (**22 pass,
0 skipped**): mutants facing a suite that cannot judge them is §5quater's fiction with a score on top.

**Three passes, because production moved twice.** Pass 1 measured what was first written; pass 2 came
after the three adversarial reviews changed production code (so pass 1 no longer covered it); pass 3
re-measured the two files that changed again afterwards. A number is only true of the code it ran on.

| File | Pass 1 (37029b8) | Pass 2 (fff4ca1) | Pass 3 (2500b52) | Survivors left |
|---|---|---|---|---|
| `lib/universe-persist.mjs` *(new)* | 91.80 % | **100.00 %** | — | 0 |
| `lib/entrypoint.mjs` | — | **100.00 %** | — | 0 |
| `set-active-universe.mjs` | 25.00 % | **100.00 %** | — | 0 |
| `lib/universes.mjs` | 89.26 % | — | **99.66 %** | 1, equivalent |
| `auto-push.mjs` | 92.55 % | 94.90 % | **95.92 %** | 4, all equivalent |
| `auto-commit.mjs` | — | **98.31 %** | — | 1, entry-guard tier |

**The two files this release WROTE both end at 100 %**, and the one that started at **25 %** —
`set-active-universe.mjs`, the CLI wiring nothing imported — ends at **100 %**. That jump is the whole
lesson of the release, and it was not paid by more assertions: it was paid by a test the **test-quality
review demanded**, one that runs the real entry point **in a subprocess**. It immediately found that a
brain reached through a **symlinked path** ran `/switch` *without persisting it* — a silent no-op no
in-process test could see, on the exact promise this hotfix exists to keep.

**Every survivor left is a named equivalent**, not a gap:

- **`auto-push.mjs` ×3 + `auto-commit.mjs` ×1 — the entry guard.** `if (isEntryPoint(process.argv[1],
  import.meta.url))` mutated to `true` / `false` / emptied. A hook module imported by its test is by
  definition not the entry point; the composition root beneath it is exercised by the subprocess test,
  which runs the *file*, not the import. Same tier already accepted for every other hook.
- **`auto-push.mjs` ×1 — `.trim()` under `Number()`.** `Number(git([...]).out.trim())` → without the
  `.trim()`: `Number(" 2\n")` is `2`, and `Number("")` and `Number(" \n")` are both falsy through the
  `|| 0`. No git output can distinguish them.
- **`lib/universes.mjs` ×1 — `parsed?.universes` → `parsed.universes`.** `JSON.parse("null")` is legal,
  so the mutant throws where the original reads `undefined` — but the `catch` around it returns the
  **same `[]`**, and nothing else observes the difference. Considered and declined: deleting the `?.`
  would kill the mutant (the "simplify production rather than excuse the mutant" reflex) at the cost of
  making a *normal* input travel through an exception path. The optional chain states the intent; the
  catch is the net for the rest.

**What pass 3 changed, and why it was not optional.** Both files it re-measured had moved *after* pass 2:
`universes.mjs` had its 32 survivors killed and a dead regex quantifier simplified out (89.26 % →
**99.66 %**), and `auto-push.mjs` gained a whole-text pin on `SWEEP_FAILED_WARNING` — the warning that
tells a user some changes stayed uncommitted — which took the last half-blankable mutant with it
(94.90 % → **95.92 %**). Re-running only the changed files is §5ter applied twice in one release.

**Reproduce**: batch recipe of §"Reproduce" below, worktree `kenjaku-mut-v491`, logs
[`reports/v491-batch1.log`](reports/v491-batch1.log),
[`reports/v491-batch2-postreview.log`](reports/v491-batch2-postreview.log),
[`reports/v491-batch3a-universes.log`](reports/v491-batch3a-universes.log),
[`reports/v491-batch3b-auto-push.log`](reports/v491-batch3b-auto-push.log).

---

## v4.9.0 — the universes release (`scripts` only) — 2026-08-08

**Scope decided on the diff** (`main...feat/active-universe-travels`), the targeted run §5ter prescribes
before a tag: **6 production files, all under `scripts/`**. `rag/src/lib/active-universe.ts`,
`scripts/lib/universes.mjs` and `local-mirror/src/{adapters/fs-universes.ts,lib/config.ts}` are in the
diff but **comment-only** — verified line by line, not assumed — so no behaviour moved in them and their
packages' numbers carry over untouched. Run in the disposable worktree `kenjaku-mut-v490`, with
`vault-write-guard.test.mjs` confirmed at **0 skipped** there first: mutants facing a suite that cannot
judge them is §5quater's fiction with a mutation score on top.

| File | First pass | After this pass | |
|---|---|---|---|
| `lib/unignore-pointer.mjs` | 84.62 % | **100.00 %** | 0 survivors |
| `update-engine.mjs` | 97.27 % | **98.44 %** | 4, all pre-existing real-I/O tier |
| `lib/reconcile-brain.mjs` | **96.11 %** | *not hardened* | 7, pre-existing (96.45 % at 2026-07-27) |
| `lib/startup-sync-gate.mjs` | 87.74 % | **95.28 %** | 5, all listed equivalents (below) |
| `session-universe.mjs` | **66.18 %** | *not hardened* | 23, entrypoint tier — **was 39.39 %** (v4.5.0) |
| `session-status.mjs` | **8.67 %** | *not hardened* | 137, **the** named debt — **was 0.00 %** since v4.4.0 |

**The two files this release wrote both end at 95 % or above, one of them at 100 %.** The two low
numbers are **debt 1**, and **both went up**: `session-universe.mjs` from **39.39 %** to **66.18 %**,
`session-status.mjs` from a flat **0.00 %** — carried by every published tag since v4.4.0 — to **8.67 %**.
Every one of their survivors sits in the entrypoint tier (the `import.meta.url` guard and the composition
root beneath it) or is an injected-port default. This branch grazing those two files is what makes them
**measurable**, not what makes them low; reading the totals without that split is how a named, arbitrated
debt gets to look like a regression.

### What the survivors said — the constraint, not the anecdote

The first pass found **21 survivors on two brand-new files**, and they were not thin assertions. They
were **contracts nothing read**:

1. **A constant only ever recomputed from itself is not asserted.** Every test built its path *from*
   `SYNC_MARKER_REL`, so the marker could have left `.cache/` — the one dir every brain gitignores, i.e.
   the thing that keeps a per-session marker out of the owner's history — with the suite still green.
   Assert such a constant **as a literal**, once.
2. **A fake that swallows a call lets every option of it drift** (§5ter cluster 1, met again): the fake
   fs's `mkdirSync` ignored its arguments, so `{ recursive: true }` was unobserved. Record the call,
   `deepEqual` it whole.
3. **Prose we write into someone ELSE's file is a payload, not a message.** The migration's replacement
   comment could be blanked entirely and pass, because the test asserted the *old* line was gone rather
   than what took its place. Assert the whole resulting file.
4. **A reader shown only tidy input is not exercised.** The settings reader had only ever seen one hook
   per entry, no null slots, the puller always first — which is why `some`-vs-`every` and **both**
   optional chains survived together.
5. **A "dented input" test can shield the very mutant it was written for.** Adding a `null` entry to
   kill the optional chaining made `(null?.hooks ?? []).every(…)` **vacuously true**, so `some`→`every`
   survived a second time. Split it: one case with **no empty collection anywhere** for the quantifier,
   one for the null shapes.
6. **The default wiring of an injected port needs one test that does NOT inject it.** The TTY guard —
   what keeps a hand-run hook off the keyboard — was only ever driven through the stub.

### Listed equivalents (do not chase)

- `startup-sync-gate.mjs`: `readFileSync(0, "utf8")` — an injected port's default, only exercised in a
  real I/O run; the two `?? []` array defaults in `pullerIsWired`, whose replacement array is immediately
  `.some`-ed back to the same `false`; `hook?.command ?? "…"`, whose fallback fails `.includes(PULLER_SCRIPT)`
  either way; and `readMarker`'s `catch { return null }` → `catch {}`, since `undefined` and `null` are
  indistinguishable through the `marker?.sessionId` that consumes it.
- `update-engine.mjs`: three `readFileSync(path, "utf8")` on real-I/O paths and `process.argv.slice(2)`
  as a default argument — the pre-existing tier, unchanged by this release.
- `reconcile-brain.mjs`: `if (changed) writeFileSync(gitignorePath, text)` → `if (true)`. The migration's
  own contract — *unchanged input returns the SAME string*, pinned by its own test — makes the written
  bytes identical, so the only difference is a redundant write. Kept as `if (changed)` because a
  needless rewrite still costs an mtime on every self-heal.

---

## v4.8.0 — the release that looks upstream (`scripts` only) — 2026-08-05

**Scope decided on the diff** (`main...release/v4.8.0`), the targeted run §5ter prescribes before a tag:
**16 production files, all under `scripts/`**. Neither `rag/src` nor `local-mirror/src` has a single
changed file (measured with `git diff --name-only`, not assumed), so those two packages did not run and
their numbers carry over untouched. Six batches in the disposable worktree `kenjaku-mut-v480`, then
**every hardened file re-measured** — a hardened-but-unmeasured file has an unknown score, which is the
same silence this release is about.

| File | First run | After this pass | |
|---|---|---|---|
| `lib/consolidation-candidates.mjs` | 94.57 % | **100.00 %** | 0 survivors |
| `lib/connector-accounts.mjs` | 89.72 % | **98.26 %** | 2 survivors, both listed equivalents |
| `lib/universe-profile.mjs` | 97.37 % | **97.89 %** | 4, all listed equivalents |
| `lib/filed-note.mjs` | 94.12 % | **97.83 %** | 4, all listed equivalents |
| `update-engine.mjs` | 93.20 % | **97.60 %** | 6, all listed equivalents |
| `lib/engine-update-check.mjs` | 86.07 % | **97.03 %** | measured twice (96.04 %, then the line-start fix) |
| `lib/ai-summary-guard.mjs` | **58.41 %** | **96.33 %** | the finding of this pass — see below |
| `lib/wiki-lint.mjs` | 88.50 % | **96.31 %** | 8 left, 7 equivalents + 1 false survivor (below) |
| `lib/upstream-cache.mjs` | 87.23 % | **95.74 %** | 2, both listed equivalents |
| `lib/engine-version.mjs` | 91.07 % | **95.54 %** | 5, all listed equivalents |
| `lib/semver-tag.mjs` | 84.09 % | **95.45 %** | 2, both listed equivalents |
| `set-universe-profile.mjs` | 80.00 % | **94.00 %** | 6 left, all in the entrypoint tier (debt 1) |
| `ai-summary-guard.mjs` | 84.00 % | **88.00 %** | a hook entrypoint; its timeout is a kill, not a gap |
| `lib/engine-fetch.mjs` | **54.05 %** | *not hardened* | 21 of its 34 survivors are `defaultGit` (debt 2) |
| `upstream-check-run.mjs` | **0.00 %** | *not hardened* | no `.test.mjs` sibling at all (debt 1) |
| `session-status.mjs` | **0.00 %** | *not hardened* | **inherited** debt, named since v4.4.0 (debt 1) |

**Thirteen of the sixteen end at 94 % or above, one at 100 %.** The three that do not are **not this
release's rot**: they are the two structural debts below, one of which (`session-status.mjs`) has been
carried by every published tag since v4.4.0 and is measured here only because this branch grazed it.
Reading the batch totals without that split is how a known, named, arbitrated debt gets to look like a
regression.

### The two remedies this release deliberately did NOT build (owner's arbitration, 2026-08-05)

> ✅ **Both were paid on 2026-08-20 by the [S0bis run](#s0bis--the-two-structural-debts-paid-scripts-only--2026-08-20)**,
> branch `chore/s0bis-entrypoint-mutation-debt`: **debt 1** ships the shared `runAsEntrypoint` **and**
> the guard test that makes it stick (`status-line.mjs` and `upstream-check-run.mjs`, the two 0 % files
> here, both end at **100.00 %**), and **debt 2** turns `defaultGit`'s invocation into a pure value
> (**54.05 % → 84.21 %**). `session-status.mjs` is the one piece left, held back as a written
> arbitration rather than converted blind — it cannot be verified by running it.

Recorded here as **numbered debt**, not as a story about one file, because that is the form that
survives: both were designed and named at v4.5.0, scheduled for v4.6.0, and never came back. They are
the head of the v4.9.0 plan.

1. **A shared `runAsEntrypoint(meta, argv, fn)`, tested once — plus the guard test that makes it stick.**
   Every top-level `scripts/*.mjs` ends with an `isEntrypoint(import.meta.url, process.argv[1])` block no
   test can import, and the ones with no `.test.mjs` sibling at all sit at **0 %**. **20 files carry the
   shape.** The guard test that goes red when a top-level script has no sibling — and when a module
   builds *and* executes a child process in the same function — carries an **allowlist that may only
   shrink**.
2. **`defaultGit` turned into a pure value.** `engine-fetch.mjs:104-109` is the real git runner, and 21
   mutants live in it. The identical shape was solved at v4.5.0 in `verify-index.mjs` — the spawn's
   request became a value (`buildCrosscheckInvocation` → `{command, args, options}`, asserted whole,
   win32 fed on purpose) and killed 19 survivors. It was never propagated, and the code **documents its
   own exemption** (*"Used by the core's CLI wiring, never by the unit tests"*), which is precisely what
   `tdd-discipline` rule 6 forbids.

The **third** remedy was adopted and shipped in this release instead: `CONVENTIONS.md` **§5quinquies** —
a new production file is mutated the **day it is written**, not at the release tail. The tail pass stays
exactly as it is; what changes is that the tail stops being the *first* time anyone looks. That rule is
the direct answer to the two files above landing at 84-87 % on their first pass.

### The finding: 28 of 47 survivors sat in four regexes, and an unanchored one is not a wider net

`lib/ai-summary-guard.mjs` decides whether a document you are reading holds **both** an AI recap and the
actual transcript. **Both anchors of every one of its four detection regexes could be dropped green** —
and an unanchored heading match is not a more generous net, it is a **different** one: it fires on any
line that merely *contains* the word, so the notice sends its reader "to the Transcription section" of a
document whose whole point is that the transcript was never kept. Fed now from the shapes real exports
have: the heading through its cosmetic noise, Markdown speaker turns **including the French space before
the colon**, an hour-long meeting's `hh:mm:ss` headers, and the **three false positives** an unanchored
turn shape produces (an actions list with bold owners, a chapter index, timestamps cited in prose).

Three production changes came out of it, all of them **dead code the mutants exposed**: a third Gemini
signature that matched nothing the general pattern did not already match (deleted, its subsumption
pinned by a test), two `spec.sources` branches the guard above them made unreachable, and a
`typeof toolName === "string"` that reads as belt-and-braces and is not — the regex coerces whatever it
is given, so an array payload stringifies straight back into a match.

### The second family, met in every batch: the ABSENT case and the SECOND element

- **`wiki-lint.mjs`** — the "freshest citation" contest was never fed a contest: one citation, in one
  order, none undated. Four mutants could keep the **oldest** date, or let an undated capture erase a
  real one and **silently clear a page's staleness**. A presence check reaching for `.length` reported a
  note whose YAML dates parse as `Date` objects as missing **every** key. Two pieces of **dead code**
  went with them: the resolver's second, `.md`-stripped lookup (every suffix is already registered in
  both spellings) and `isUnderZone`'s `firstSlash !== -1` guard, refuted one line above by the same
  string.
- **`connector-accounts.mjs`** — a declaration is read off a **hand-edited** page, so `- Slack : acme `
  and a list where Slack is not the first bullet are the field shapes; nothing fed either. One
  production change: a universe that declares no Slack **and** observed nothing was offering `- Slack: `
  to paste into the profile — a claim about a tool made out of thin air, by the check whose whole job is
  to stop those.
- **`set-universe-profile.mjs`** — fifteen of its twenty survivors sat in `realProfileDeps` / `realIo`,
  which every flow test replaces. The seams that decide what the **deployed** script reads and writes
  were observed by nothing: the fs port could stop returning text, `today()` could hand back a full ISO
  timestamp (a lint violation in the frontmatter of the very page the engine writes), and `error` could
  print to **stdout**, where a divergence goes quiet. Same lesson as v4.6.0's two CLIs, on a third file.
- **`semver-tag.mjs`** — the ordering was only ever read in the direction where a **sum** and a
  **difference** agree (`patch + patch` passes `4.7.1 > 4.7.0` exactly as `patch - patch` does). The
  other direction is the one that decides whether a brain is told it is behind.
- **`upstream-cache.mjs`** — making the cache folder must be **idempotent**: this probe runs once a day
  forever, on a folder that exists after the first time, inside a function that catches everything. A
  non-idempotent `mkdir` would freeze the verdict at day one, silently.
- **`update-engine.mjs`** and **`engine-update-check.mjs`** (batches 2a/2b) — 20 of 28 survivors sat in
  the two regexes of `extractWhatYouGet`, i.e. in the code deciding **which prose the owner reads before
  consenting to a code swap**; and the conflicted / refused-commit blocks were matched by a fragment, so
  the three lines carrying the **remedy** could each be blanked green.

### ⚠️ One measurement anomaly, proven twice, and it is the tool's — not the suite's

`wiki-lint.mjs:194` — the `freshest && updated` → `freshest || updated` mutant is reported **Survived**
by Stryker. Applied by hand, it **fails the suite** (`exit 1`), both before and after this pass's
hardening; re-run targeted on that line range, it survives again. So the mutant Stryker *activates* is
not the one its reporter *prints*. The consequence is worth stating in the direction it runs: the
published score here is **conservative, never flattering** — and it is why every survivor in batches 5
and 6 was re-applied by hand and the suite watched go red before a test was written for it.

### Equivalents, established by hand (applied, run, reverted) and NOT to be chased

- `readFileSync(path, "")` — returns a Buffer, `JSON.parse` and the fingerprint coerce it identically.
  The family recorded since v4.5.0; it recurs in `engine-version.mjs`, `update-engine.mjs` and
  `upstream-cache.mjs`.
- Both `?? "<junk>"` fallbacks in `semver-tag.mjs` — junk parses as no version, exactly like the empty
  string; and `tags ?? ["Stryker was here"]` yields nothing parseable, so the result is `null` either way.
- `wiki-lint.mjs`: `Date.parse(when) >=` (equal dates re-set the same value), `if (true && daysBetween(…))`
  (an absent date yields `NaN`, and `NaN > staleDays` is already false), the four `stripCode` replacement
  mutants (only the replacement's **length** differs, and every input that could show it produces a bogus
  target either way), and `/\.md$/ → /\.md/` in `register` (a vault path carries `.md` once).
- `connector-accounts.mjs`: both `slackWorkspace` regex anchors — a workspace name cannot contain a
  second `://`, and `.trim()` has already removed the trailing newline that `$` would guard.
- `universe-profile.mjs`: `parsed?.declined` (dropping it throws into the same `catch` that already
  returns `[]`), the `other: []` bucket (a deliberate **sink** — nothing reads it, which is the point),
  and both `## ` heading-regex mutants (the capture is `.trim()`-ed on the next line).
- `engine-update-check.mjs`: the two `tags ?? []` fallbacks, `repo ?? "<junk>"` and `body ?? "<junk>"`
  (all guarded above), the `target:` ternary (the last element of `ahead` **is** `latest`), and
  `---\S*$` (it differs only on three dashes glued to a single space-free word with nothing after it).
- `ai-summary-guard.mjs`: the two `input?.tool_*` optional chains — dropping them throws, and the
  **fail-open catch already makes throwing and not-throwing the same observable**; plus `Array.isArray`
  in the payload walker (`Object.values` of an array yields the same items) and `(text.match(re) ?? [x])`
  (a one-element fallback can never reach `MIN_TURNS = 3`).
- `update-engine.mjs`: `skillsPreserved = []` → junk (the loop filters on `reason === "customized"`),
  `releases: []` in the unreadable-manifest fallback (the `unknown` state returns before releases are
  rendered), and `argv = process.argv` (it feeds only an `includes("--check")`, which `argv[0..1]` cannot
  satisfy).

**Reproduce**: the batch recipe of §"Reproduce" below, worktree `kenjaku-mut-v480`, logs under
`reports/v480-batch{1,2a,2b,3,4,5,6}-*.log` and the re-measures `reports/v480-recheck-{a..f}-*.log`.
`rag/node_modules` must be symlinked into the worktree and `vault-write-guard.test.mjs` verified at
**22 pass / 0 skipped** before each run — a pass measured against a suite that cannot judge it is
§5quater's fiction with a mutation score on top.

---

## v4.7.0 — the short visibility release (`rag` + `scripts`) — 2026-08-05

**Scope decided on the diff** (`main...release/v4.7.0`), the targeted run §5ter prescribes before a tag.
`local-mirror/src` is untouched by this branch (measured, not assumed) — its number carries over. Both
halves were run in the disposable worktree `kenjaku-mut-v470`, then **re-measured off the fixes**, because
a hardened-but-unmeasured file has an unknown score.

| Half | First run | After the pass | |
|---|---|---|---|
| `rag/src/lib` — `index-shortfall.ts`, `status-report.ts` | **94.44 %** | **100 % / 100 %** | 9 survivors, all in code written the same day; 0 left |
| `scripts` — `lib/frozen-wiring.mjs`, `lib/restart-nudge.mjs`, `lib/restart-signal.mjs`, `prompt-restart-nudge.mjs` | **83.33 %** | **97.56 %** | 14 survivors → 2, both accepted equivalents |

**The `rag` half** (logs `reports/v470-rag-changed.log`, then `…-recheck.log`) found two familiar
families — an absent case nothing fed (a shortfall whose failures ARE the whole gap, so nothing was
pending) and a truncation nothing exercised (three refusals against a bound of two). The ninth survivor
was **simplified away rather than excused**: `!== null && !== undefined` reads as two reasons while only
ever meaning *"a number was recorded"*, and nothing could tell the halves apart → `typeof asked ===
"number"`. `rag/src/index.ts` is out of the tool's scope (not under `src/lib/`) — the same class as the
top-level scripts, already named debt.

**The `scripts` half** (logs `reports/v470-scripts-changed.log`) found one **design** defect, and it is
the reason the file sat at 58.33 %:

- **`lib/restart-signal.mjs` 58.33 % → 95.45 %.** The fail-soft was written **twice per signal** — an
  initializer *and* a `catch` — so each half silently covered for the other and **neither could be shown
  to work** (4 survivors on that redundancy alone). Stated once now, in a named `noSignalIfItBlowsUp`,
  where a test can hold it. Two cases were then missing outright: a brain whose `.mcp.json` registers
  exactly what the engine delivered (the converged case that proves both probes are really read), and
  one that registers something else (the gap a forgotten `utf8` would have turned into silence). The
  fake now reads the way node's `fs` reads — unknown encoding throws, absent file throws — so a read
  that passes by luck fails in the test instead.
- **`lib/frozen-wiring.mjs` 92.86 % → 100 %.** `pulledPaths` had only ever been fed **CRLF**, so a split
  that knows only CRLF passed: on Unix it would have returned the whole stdout as one path, matching no
  prefix, and the machine that is behind would have gone silent everywhere **but** Windows — the mirror
  image of this repo's usual Windows bug. LF-only case added, with a blank-but-not-empty line.
- **`lib/restart-nudge.mjs` 93.33 % → 100 %.** The directive's reason clause (*"a session loads its
  hooks, skills and servers only at start"*) and its *"open your reply"* instruction could both be
  deleted with every assertion still green. Both are load-bearing: a restart asked with no reason reads
  as a glitch, and one appended after the answer gets buried on a channel whose point is that it repeats.

**The two survivors left, both pre-listed equivalents** (§5ter's don't-chase list):

- `prompt-restart-nudge.mjs:55` — the `isEntrypoint(import.meta.url, …)` boot guard (94.12 %). The
  three-mutant family 10+ scripts carry; already **named debt with an owner** (the shared
  `runAsEntrypoint`, deferred to v4.8.0).
- `restart-signal.mjs:51` — `catch { return false; }` → `catch {}`. The value is normalised downstream
  by `isRestartPending`'s `Boolean(…)`, so `undefined` and `false` are indistinguishable at the only
  boundary that exists. Killing it would take a consumer written for the test.

---

## v4.6.0 — the vault's-identity release (`scripts` only) — 2026-08-03

**Scope decided on the diff** (`main...release/v4.6.0`), the targeted run §5ter prescribes before a tag.
**No `rag/src` or `local-mirror/src` file changed at all** — this release ships prose carriers (skills,
constitutions) and harness scripts — so those two packages did not run, and their numbers carry over
untouched. Eight production files under `scripts/`, measured one by one in two batches, then **every
hardened file re-measured**: a hardened-but-unmeasured file has an unknown score, which is the same
silence this trilogy is about.

| File | First run | After this pass | |
|---|---|---|---|
| `lib/doc-section.mjs` | **53.33 %** | **100 %** | the finding of this pass — see below; 14/14 killed |
| `refresh-note.mjs` | 68.52 % | **96.30 %** | 2 survivors, both pre-listed equivalents |
| `file-back-note.mjs` | 72.81 % | **96.49 %** | 4 survivors, all pre-listed equivalents |
| `lib/status-hook-output.mjs` | 92.86 % | **100 %** | |
| `lib/note-refresh.mjs` | 92.31 % | **97.80 %** | 2 survivors, both pre-listed equivalents |
| `lib/engine-version.mjs` | 95.24 % | **97.62 %** | 1 survivor, a pre-listed equivalent |
| `lib/filed-note.mjs` | 96.00 % | **97.60 %** | 3 survivors, all pre-listed equivalents |
| `session-status.mjs` | **not measured** | — | the named 0 % top-level tier (below) |

**Every survivor left in the seven files is on the equivalence list written BEFORE the re-run** — which
is what makes them equivalents rather than an excuse. Aggregates for this pass: **97.07 %** over batch
1's two files (239 mutants), **97.84 %** over batch 2's five (231 mutants).

⚠️ **Three of those numbers are NOT the ones at the tag** — `refresh-note.mjs`, `lib/note-refresh.mjs`
and `lib/status-hook-output.mjs` were changed again by the review fixes and re-measured; see **the
second pass** below, which is what the tag ships.

**The finding: `lib/doc-section.mjs` had no test file at all.** It is the slicer that decides **what**
every doc guard reads — the claim discipline's and the identity discipline's alike — and it was
exercised only *through* those guards, against real documents where a degraded slice still happened to
contain the words they look for. Both "return the whole document" mutants survived. A slicer that
quietly returns everything turns every sliced guard back into the **flat search it was extracted to
replace**, and the failure that motivated the extraction (a rule passing on prose that was already
there for other reasons) comes back with the suite green. This is §5quater one level up: not a checker
parsing differently from the engine, but a checker reading a different **span** than it claims. It has
its own tests now — exact slices asserted whole — and **14/14 mutants are dead**.

**The second family is the one v4.5.0 met four times: every test injects its own deps, so the REAL
ones are observed by nothing.** Both CLIs here (`file-back-note.mjs`, `refresh-note.mjs`) could have
read no stdin, created no folders and logged nothing with the suite green. Each now runs as a **real
child process** against a throwaway brain — the only test that reaches the stdin read, the recursive
`mkdir`, the existence check, the exit code and the entrypoint guard at once.

**And the refusals were asserted by fragments, while that text IS the product here**: the sentence
saying what a *basis* is, the one saying a card that does not say WHICH one only moves the ambiguity,
and the one naming what to do instead of overwriting could each vanish with every `assert.match` still
green. Asserted whole now.

**Equivalents, established by hand (applied, run, reverted) and NOT to be chased:**

- `readFileSync(0, "")` in both CLIs — returns a Buffer, `JSON.parse` coerces it to the same string.
  Already recorded at v4.5.0 for the guard hook; confirmed identical here.
- The slug's `^-+|-+$` quantifiers — the preceding `[^a-z0-9]+` collapses any run into **one** hyphen,
  so two leading hyphens are unreachable (verified on six titles).
- `/\.md$/` unanchored in `firstNameSegment` — the first name is the first hyphen segment, and no vault
  path carries `.md` inside it.
- `split(/\s+/)` → `/\s/` on a **trimmed** title — index 0 is the same either way once leading
  whitespace is gone.
- `readFileSync(p, "utf-8")` → `""` on the universe pointer — equivalent *because* the reader was
  hardened to accept a Buffer (`String(...)`), which is the defence, not an accident.
- `typeof manifest !== "object"` → `false` — a truthy non-object yields `null` through both paths.
- Two regex tails where `$` is redundant without the `s` flag (`.*$`, `([\s\S]*)$`).

**The honest bound, unchanged and inherited.** `session-status.mjs` is a top-level script that runs on
import, so no test can observe it: it stays at **0 %** and was not measured here. The logic it displays
is covered — that is precisely why `lib/status-hook-output.mjs` exists — but the wiring is not. Closing
it is a refactor of fleet-deployed session scripts, i.e. its own release. Same for the shared
`runAsEntrypoint(meta, argv, fn)` named at v4.5.0: two of its three mutants now die per file thanks to
the child-process tests, and what remains (`process.argv.slice(2)` → `process.argv`) is a true
equivalent in both CLIs here, since both take their spec on **stdin** and ignore argv entirely.

### The second pass — after the review fixes, because the first numbers no longer covered the code

An independent review of the branch found six defects, all fixed before the tag ([the plan's Step
12.5](../plans/archived/field-findings-2026-08-02-action.md)). Those fixes **changed production
code after the table above was measured**, so four files were re-measured rather than left publishing a
score earned by earlier lines. That is the whole rule here: a number that predates the code it
describes is the same silence this trilogy is about.

| File | After the fixes | Treated | At the tag | |
|---|---|---|---|---|
| `refresh-note.mjs` | **96.30 %** | — | **96.30 %** | 2 survivors, both already on the equivalence list |
| `lib/status-hook-output.mjs` | **100 %** | — | **100 %** | |
| `lib/note-refresh.mjs` | 89.47 % | yes | **96.88 %** | 4 survivors, all equivalents (below) |
| `lib/hooks-reconcile.mjs` | 77.05 % | yes | **78.69 %**, then the last two on the touched line killed | 24 survivors left, **all pre-existing** (below) |

**`lib/note-refresh.mjs` — twelve of its fourteen survivors sat in the confidence-block insertion
written the same day, and they all said one thing: only the tidy card was ever fed to it.** Four tests
for the shapes a hand-edited Obsidian vault actually holds — a `# ` inside a sentence and no heading at
all, a stub card that ends right after its title (where the walk steps off the end), a line of editor
whitespace where a blank line is meant, and an indented quotation of someone else's homonymy block. The
first went red, and the honest repair was to **delete the no-heading special case** rather than patch
it: `findIndex` returns `-1`, so the walk starts at the top on its own and keeps the blank line the body
opens with instead of doubling it. A second round then found the **second walk** — the one past the
homonymy block — still carrying none of the assertions the first had earned; both of its boundary
mutants were applied by hand to prove each new test kills one.

**`lib/hooks-reconcile.mjs` is NOT this release's file**, and its 78.69 % is not a regression: the
branch touches exactly one line in it (the `$`-expansion sweep). What the run did buy is the four
survivors inside the **touched function**, and they are worth the entry:

- **Nothing ever passed a `command` that is not a string**, so every mutant deleting the `typeof` guard
  survived. `settings.json` is hand-edited by owners; a hook entry whose command is missing — or
  written as a JSON array — is an ordinary shape, and without the guard it reaches `.replace` and
  throws a TypeError at session start, on the path whose job is to REPAIR a brain.
- **The fixture that matters is a non-string whose coercion LOOKS like the broken command.** With only
  harmless non-strings, `typeof command !== "string"` and `!BROKEN.test(command)` agree on every input
  and either term can be deleted with the suite green. That one value tells them apart, and it killed
  the last two survivors (hand-applied, both confirmed).
- **The `^` anchor was never observed either** — no test placed the broken prefix anywhere but at
  position 0, and that anchor is what keeps the repair off a USER hook that merely mentions the engine
  launcher further along.

The remaining 24 survivors live elsewhere in that file (`learnNodePrefix`'s regex and its `?? []`
defaults, `reconcileHooks`' append arithmetic), **predate this release and are untouched by it** —
named here rather than swept in under a review fix, and rather than left implied by a package aggregate.

**Equivalents from this second pass, added to the list above:** the `CONFIDENCE_BLOCK` regex `$` tail
(same class as the two already recorded — redundant without the `s` flag), and the two boundary mutants
on the homonymy line's own `if`, where `at === lines.length` makes `.test(undefined)` coerce to the
string `"undefined"` and miss either way.

**Reproduce**: same recipe as v4.5.0 below (worktree at `/Users/tpierrain/Dev/kenjaku-mut-v460`, the
`rag/node_modules` symlink **verified** before starting — 31 pass / 0 skipped for the first pass, 22 for
the second — one or two files per run). Logs: `reports/v460-scripts-batch1.log`, `…-batch2.log`,
`…-batch1-recheck.log`, `…-batch2-recheck.log`, and for the second pass
`…-review-fixes-batch1.log`, `…-batch2.log`, `…-batch3.log`, `v460-hooks-reconcile-recheck.log`.

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

### v5.0.0 — the auto-finalize CLI, and the sentence it prints — 2026-08-23

Scoped to `scripts/lib/reconcile-brain.mjs:563-600` + `:640-705` (the child's entry and the
catch-up announcement), measured with `maintainers/mutation/mutate-one.mjs`. Two runs, because the
first one is the finding:

**66.25 % — 52 killed, 27 survived** (at `9f69cbd`). **All but three survivors sat in one sentence**:
the line the child prints on a first update, which is the only trace the catch-up leaves an owner.
Every clause could be deleted with the suite green — the count, the names, the sort, the join — and
the entire retired-skill half was unreached by any pole. The tests around it proved the line was
EMITTED and read not one word of it.

**98.75 % — 78 killed, 1 survived, 1 timeout** (at `4cc2ace`) after nine poles: the sentence asserted
whole, one per branch (one file / several / unsorted; one retirement / several, verb included; both
joined; a report predating `skillsRetired`; silence when nothing moved; silence on a self-heal that
DID converge). Plus the guard that writes an advance down when the pass **delivers nothing** — a
release can bury a skill a brain never had, and the tombstone still has to reach disk.

**Two lessons worth more than the score.**

- **A prefix match let an invented retirement through.** `report.skillsRetired ?? []` mutated to
  `?? ["Stryker was here"]` survived a pole that asserted the line's opening clause with
  `assert.match(/^🔓 Catching up: your brain just received 1 engine file/)`. The mutant leaves that
  clause exactly where it is and APPENDS a retirement that never happened. The fallback's own value
  is part of the contract; asserting a prefix is asserting the half a mutant does not touch.
- **The one survivor left is an equivalent**, and it is the familiar shape:
  `readFileSync(manifestPath, "utf8")` → `readFileSync(manifestPath, "")`. `JSON.parse` accepts what
  comes back either way, so no input distinguishes them. Killing it would take a fixture asserting on
  the encoding argument rather than on behaviour.

**Reading the report needs `FORCE_COLOR=0 NO_COLOR=1`**: `parseTestCounts` cannot read ANSI-coloured
`node --test` output, and a session that exports `FORCE_COLOR` makes `mutate-one.mjs` refuse to start.

## v5.0.0 — the invited list, and the sentence the health banner says — 2026-08-23

Scoped to `scripts/lib/engine-divergence.mjs:60-130` (S12, the `invited` family read from the
manifest) + `scripts/health-probe-run.mjs:61-95` (S5's residual, `engineFilesVerdict`), measured at
`2cd9484`.

**98.31 % — 58 killed, 1 survived, 0 timeout.** Per file: `health-probe-run.mjs` **100 %**,
`engine-divergence.mjs` **97.56 %**.

**The one survivor is an equivalent, and the code already says why**:
`held.sort((a, b) => (a.rel < b.rel ? -1 : 1))` → `<=`. A `rel` appears at most once in the list, so
no input can produce the equal case; the comparator's own comment states that, and spelling out an
equal branch would add a line no test could reach for a reason other than coverage.

**What the run bought, before it was run.** An earlier spelling read the invited list INSIDE the
loop (`manifest?.regimes?.invited ?? FALLBACK` per file). Hoisting it out was not a tidy-up: inside
the loop the optional chaining could never fire — the loop only runs when `regimes.merge` named
something, so a manifest with no `regimes` never reaches it — and two structural mutants therefore
had nowhere to die. **An unreachable safety net is a mutant nest, not a safety net.**
