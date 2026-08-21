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

## Current scores (latest)

| Package | Mutation score | As of | Detail |
|---|---|---|---|
| **rag** | **90.42 %** | 2026-07-16 (post-B2/B3) | [re-audit #2](#full-rag-re-audit-2--2026-07-16-post-b2b3-hardening) — production-only. Not re-measured package-wide since; the [v4.4.0 targeted run](#v440--the-field-fixes-release-rag--scripts--2026-07-28--2026-08-02) over the 10 files that release changed reads **93.93 %**, with its two new files at **100 %**. The [v4.5.0 run](#v450--the-silence-stops-passing-release-rag--scripts--2026-08-03) over its 6 changed files reads **94.67 %**, with the file it creates at **100 %**. The [v4.7.0 run](#v470--the-short-visibility-release-rag--scripts--2026-08-05) over the 2 files that release changed reads **94.44 %** first pass, **100 % on both** after the survivors were closed |
| **scripts** (harness) | **97.27 %** | 2026-06-23 baseline | 3 weak files since hardened to 92–100 % (no full re-audit; `lib/**` already 100 %). The three files audited on [2026-07-27](#increment-25-engine-skill-refresh--step-10--2026-07-27) are now hardened too: `update-engine.mjs` **98.49 %**, `reconcile-brain.mjs` **96.45 %**, `engine-source.mjs` **93.02 %** (every survivor killed or recorded as equivalent). The four files touched on [2026-07-28](#v430-the-harness-side-of-the-review-fixes--2026-07-28) were measured the same way, after the review fixes: `engine-commit.mjs` **100 %**, `startup-sync.mjs` **100 %**, `repo-status.mjs` **97.44 %**, `auto-commit.mjs` **98.04 %** (98.37 % together, every survivor an accepted equivalent). ⚠️ **The baseline flatters the package**: the [v4.4.0 run](#v440--the-field-fixes-release-rag--scripts--2026-07-28--2026-08-02) measured 16 files one by one and found **two at 0 %** — `session-status.mjs` and `status-line.mjs`, top-level scripts no test can import. **[Named debt](#the-two-0--files--named-debt-and-not-a-regression)**, carried by every published tag. The [v4.5.0 run](#v450--the-silence-stops-passing-release-rag--scripts--2026-08-03) measured 15 more files one by one: **seven of them end at 100 %, twelve of the fifteen at 92 % or above**, and the three `session-*` scripts confirm the same top-level tier (`session-status.mjs` still **0 %**, inherited rather than new). The [v4.6.0 run](#v460--the-vaults-identity-release-scripts-only--2026-08-03) measured the 7 files that release changed: **all seven end at 96 % or above, two at 100 %**, every remaining survivor a pre-listed equivalent. It then ran a **second pass after the review fixes** (those fixes changed production code, so the first numbers no longer covered it): 4 files re-measured, 3 of them at **96.88–100 %**, plus `lib/hooks-reconcile.mjs` — a file this release only grazes — at **78.69 %**, whose 24 remaining survivors are pre-existing and named rather than implied. The [v4.7.0 run](#v470--the-short-visibility-release-rag--scripts--2026-08-05) measured the 4 files that release wrote: **83.33 % → 97.56 %**, two of them at **100 %**, the two survivors left both pre-listed equivalents — and the low first-pass number was a **design** defect (a fail-soft written twice, so neither half was observable), not thin tests. The [v4.8.0 run](#v480--the-release-that-looks-upstream-scripts-only--2026-08-05) is the biggest targeted pass so far — **16 files**, six batches: **thirteen end at 94 % or above**, one at 100 %, and the three that do not are the **named structural debt** (two files with no test sibling at 0 %, `engine-fetch.mjs`'s real git runner at 54.05 %), whose two remedies the owner **arbitrated into v4.9.0**, then **re-arbitrated in writing** (2026-08-08) onto the unfreeze release that follows it, rather than left implied. The [v4.9.0 run](#v490--the-universes-release-scripts-only--2026-08-08) measured the 6 files that release changed: **the two files it WROTE end at 100.00 % and 95.28 %**, `update-engine.mjs` at **98.44 %** and `reconcile-brain.mjs` at **96.11 %** — and the two entrypoint-tier files it merely grazed both **rose**, `session-universe.mjs` **39.39 % → 66.18 %** and `session-status.mjs` **0.00 % → 8.67 %**, still debt 1 rather than new rot. The [v4.9.1 run](#v491--the-switch-that-leaves-the-machine-scripts-only--2026-08-15) measured the 6 files that hotfix changed, over **three passes** (production moved twice): **the two files it WROTE both end at 100.00 %**, the untested CLI wiring goes **25 % → 100 %**, and the four others land at **95.92–99.66 %** — every survivor left a named equivalent. The [S0bis run](#s0bis--the-two-structural-debts-paid-scripts-only--2026-08-20) is not a release but the **debt run itself**: it pays both structural debts this table has flagged since v4.4.0 — the two entry-guard files quoted above at **0 %** (`status-line.mjs`, `upstream-check-run.mjs`) both end at **100.00 %**, `engine-fetch.mjs` goes **54.05 % → 84.21 %**, and a new repo-wide **guard test** makes the shape unrepeatable rather than merely fixed. **The tier is now closed**: `session-status.mjs`, held back the same day as a written arbitration because it is the one file that cannot be verified by running it, was answered by the owner and paid — **8.67 % → 96.10 %** over three rounds, its red taken inside a disposable worktree and its output proved byte-identical before and after. **No `scripts/*.mjs` sits in the 0 % tier any more**, for the first time since v4.4.0 |
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
in [`../plans/prospective/agent-orchestrated-release-mode-action.md`](../plans/prospective/agent-orchestrated-release-mode-action.md),
debt statement in [`../plans/prospective/v4.9.0-mutation-debt-plan.md`](../plans/prospective/v4.9.0-mutation-debt-plan.md).
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
