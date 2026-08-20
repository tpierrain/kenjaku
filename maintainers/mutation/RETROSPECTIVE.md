# Mutation testing — retrospectives

> Two passes, a fortnight apart. **[Part I](#part-i--what-the-survivors-taught-us-step-6)** (2026-07-15,
> Step 6) diagnosed the assertion habits across `rag` / `local-mirror` / `scripts`.
> **[Part II](#part-ii--why-it-happened-again-increment-25-step-10)** (2026-07-27, Increment 2.5 Step 10)
> asks the harder question Thomas put next: *given that Part I's rules existed and were engraved, how did
> we still write four files scoring 51 % to 87 %?* Read Part II first if you want the actionable answer —
> Part I is the catalogue it builds on.
>
> 🛑 **Part III would be one line long, and it is about the instrument rather than the tests**
> (2026-08-21, S2b-1): **a flaky test does not add noise to a mutation score, it adds points.** Under
> Stryker's `command` runner a mutant is killed when the suite exits non-zero, so a test that fails at
> random is indistinguishable from a detection — and the error is **one-directional, always upward**.
> Measured on the day: **6 of 8** concurrent full-suite runs failed because one test swept the shared
> system temp dir, **0 of 8** after it was given a private one; one file's score fell from 98.95 % to
> 97.54 % once the instrument was honest, uncovering three more lines the suite had never executed.
> **Both retrospectives above ask why the tests were weak. This asks whether the number was real** —
> and the answer has to be re-established every time the suite stops being deterministic under load.
> Full account, with the sections it invalidates: [`RESULTS.md`](RESULTS.md), top warning.

---

# Part I — what the survivors taught us (Step 6)

> **Dev-only.** This whole folder lives under `maintainers/` and is **excluded from the brain copy**
> (`scripts/lib/tracked-files.mjs` → `DEV_ONLY_PREFIXES`), so none of it ever reaches a generated brain.
> Sister docs: the scores in [`RESULTS.md`](RESULTS.md); the plan
> [`../plans/prospective/mutation-testing-stryker.md`](../plans/prospective/mutation-testing-stryker.md) (Step 6).

**Why this doc exists.** The point of the whole mutation exercise was never the score — it was to name
**what was systematically weak in our tests / TDD discipline** so the same gaps stop recurring. This is the
durable trace of that diagnosis, of the rules it produced, and of where they were engraved so they act as a
net going forward.

**Method.** We read across all 14 `test(...)` hardening commits on `test/rag-mutation-hardening`
(rag 8 files, local-mirror 6, scripts 3) with three parallel readers, classifying, for every survivor that
was killed, the mutant shape and the assertion/seam that killed it. **All 6 candidate clusters were
confirmed, none refuted, plus 3 new infra-shaped clusters.**

---

## The diagnosis — recurring survivor shapes

### The 6 language-agnostic assertion habits

| # | Survivor shape (what stayed alive) | Root-cause TDD habit | The rule that would have prevented it |
|---|---|---|---|
| **C6** *(most frequent — 8/8 rag files)* | `?.` / `??` / default-arg / `&&`‑`\|\|` never broken by a test | happy-path-only inputs; the present case written, the absent one never | For every optional, write the **null/absent twin** next to the present one. |
| **C3** *(2nd)* | `>` vs `>=`, `&&` vs `\|\|`, regex `^`/`$` anchors survive | one-sided example that doesn't distinguish the operator | **Triangulate** boundaries *and* operators: the on-the-boundary (equal) case, the just-outside case, an asymmetric discriminator (`a·b ≠ b·a`, contains-but-not-a-segment, mid-line `#`). |
| **C4** *(the #1 score driver — every 0% file)* | whole branches unreachable through the public API | "it's pure glue / a top-level script — not worth a test" | **Unreachable is the diagnosis, not the exemption.** Extract a pure seam / inject a port / name every wiring factory until every branch is reachable. |
| **C2** | mutants on the *other* fields survive | asserting the one field I cared about | `deepEqual` the **whole object / the whole call sequence** (args included), not one field. |
| **C5** | `some`/`every`/`find`/sort identical on a 0–1 element or pre-sorted list | trivial collection under test | Test with **≥2 elements, deliberately unsorted, + an out-of-scope decoy**. |
| **C1** *(least frequent)* | `throw ''` survives a bare `assert.throws` | asserting the fact, not the message | **Matcher mandatory** on `throws`/`rejects` (regex/type); results carry their body; logs their exact payload. |

### The 3 new, infra-shaped clusters

1. **CLI/script fakes keyed on a PARTIAL command.** A fake `git` keyed on `args[0]` lets every *later*
   arg-string mutant survive (`--get`, `@{u}..HEAD`, the commit `-m <message>`). → key the fake on
   `args.join(" ")` and `deepEqual` the full command list; mirror real trailing-newline output so the
   production `.trim()`s are pinned.
2. **Composition roots / entry guards.** Inline boot arrows and `import.meta.url` guards. → name every
   wiring seam (no inline arrows Stryker can't observe), inject a `BootDeps`, keep the module
   import-testable. The entry guard itself is an accepted equivalent — earn it back with **one** subprocess
   integration test (that lone test is the whole gap between `auto-commit` 98% and `auto-push` 92%).
3. **LLM-facing string surfaces** (MCP tool names + every tool/field description). They never affect a
   return value, so behavioural tests miss them. → assert them explicitly (drive the real registered surface
   via an in-memory `Client`/`InMemoryTransport`; assert names + non-empty descriptions).

### Two pieces of mutation literacy (so we don't waste effort)

- **Equivalent mutants — do NOT chase them** (document + count "effective 100% on non-equivalents"): the
  default-wiring of an injected port (real-I/O-only), a `?? []`/`?? null` immediately `.map().join('')`ed
  back to the same string, a greedy regex masked by a downstream `.trim()`, real-SDK/real-network
  construction (`new Client({auth})`), `import.meta.url` guards, `Number()`/parse that already trims.
- **Tooling trap:** Stryker **inflates** the score via false timeouts (a bogus 87.5–100% masking the honest
  ~56%). Bridle `concurrency`/`timeout` in the config before trusting a run.
- **Reading trap — a file is not an increment** (found 2026-07-28, gating v4.2.0). When a release audit
  asks *"which survivors are mine?"*, the answer is **not** readable from the file list: new code lands
  **inside** files that already existed, so a file whose name predates the work can hold nothing but the
  work. Labelling `config.ts` / `markdown.ts` / the domain service "pre-existing" on that basis nearly
  shipped 11 live mutants of the release's own code as somebody else's debt. **The cheap, reliable
  read:** diff the per-file table against the **previous audit's** table — every file that scores *worse*
  is one where new, unhardened code landed — then read each survivor's own diff to see whose line it sits
  on. A per-file score is a blend of old and new code, so only the survivor's line answers the question.

> **The objective signal is the mutation score, not line coverage** — a suite can cover 100% of lines and
> kill ~0% of mutants (exactly what `document-scanner`/`vault-watcher` did at 0%).

---

## What was done — so it can't recur

Rules engraved with a **belt-and-suspenders split** (mirroring the `language.md` model), agreed with Thomas
on 2026-07-15:

- **Global (all projects)** — the 5 language-agnostic habits (C1/C2/C3/C5/C6 + reachability-as-design-smell)
  live in the **`tdd-discipline` skill**, § "Qualité des assertions — leçons du mutation testing"; the global
  `use-case-driven-harness/rules/testing.md` points to it.
- **Repo-local** — [`../CONVENTIONS.md`](../CONVENTIONS.md) **§5ter** carries the 3 infra-shaped clusters +
  the equivalent-mutant literacy + the Stryker false-timeout trap; **§5bis** ("test the glue too") was
  **broadened** to cover C4 beyond plain I/O (pure unreachable branches, top-level scripts, composition roots).
- **Deterministic guard (ADR 0009 spirit)** — only C1 is cheaply mechanical, so it got a lint:
  [`../../scripts/lib/assert-matcher-lint.mjs`](../../scripts/lib/assert-matcher-lint.mjs) + its repo-wide
  `*.test.mjs` guard **fail CI loud** if any engine test file calls `assert.throws(…)`/`assert.rejects(…)`
  with no matcher/2nd argument. Built in TDD baby-steps (paren-depth + string-aware scanner; the
  trailing-comma edge was caught fail-first); dev-only (excluded from the brain copy via `DEV_ONLY_PREFIXES`).
  The other clusters stay **written rules** (no cheap reliable check) — the on-demand net is
  `npm --prefix maintainers/mutation run mutate:changed`.

The scores that produced this diagnosis are in [`RESULTS.md`](RESULTS.md); every per-file "before → after"
and its residual equivalents are in the plan's Step 3.

---

## Changes shipped in this retrospective (the full recap)

**In this repo (`second-brain-generator`, branch `test/rag-mutation-hardening`):**

- **`scripts/lib/assert-matcher-lint.mjs`** *(new)* — the deterministic C1 guard: a paren-depth +
  string-aware scanner exposing `findLooseAssertions(source)`.
- **`scripts/lib/assert-matcher-lint.test.mjs`** *(new)* — 8 unit tests (TDD baby-steps) + a repo-wide
  guard that fails CI loud on any loose `assert.throws/rejects` across the engine test suites.
- **`scripts/lib/tracked-files.mjs`** — added `scripts/lib/assert-matcher-lint` to `DEV_ONLY_PREFIXES`
  so the guard (and its test) never ship into a generated brain.
- **`maintainers/CONVENTIONS.md`** — **§5bis** broadened ("unreachable is the diagnosis, not the
  exemption" — pure branches, top-level scripts, composition roots); **§5ter** added (the 3 infra-shaped
  clusters + equivalent-mutant literacy + the Stryker false-timeout trap + the lint).
- **`maintainers/mutation/RETROSPECTIVE.md`** *(new — this file)*.
- **`maintainers/mutation/RESULTS.md`** — pointer to this retrospective.
- **`maintainers/plans/prospective/mutation-testing-stryker.md`** — Step 6 ticked with outcome.

**In the personal harness (`use-case-driven-harness`, separate repo — French corpus):**

- **`skills/tdd-discipline/SKILL.md`** — new § "Qualité des assertions — leçons du mutation testing"
  (the 5 language-agnostic habits).
- **`rules/testing.md`** — pointer to that new section.

**Verification:** `scripts/**` suite green (560/560), including the new lint guard and `tracked-files`.
The doc changes touch only `maintainers/` (never in the rag/local-mirror packages), so no engine re-run
was needed.

---

# Part II — why it happened again (Increment 2.5, Step 10)

> **2026-07-27.** Written at Thomas's request, at the end of the Step 10 hardening, to answer the question
> the numbers raise: *Part I's rules existed, were engraved in `tdd-discipline` and in `CONVENTIONS.md`
> §5bis/§5ter, and had a CI lint. So how did we still ship four files scoring 51 % to 87 %?*

## The numbers that prompt the question

| File | Before | After | Residual |
|---|---|---|---|
| `scripts/lib/engine-skill-refresh.mjs` | 86.72 % | **100 %** | 0 |
| `scripts/update-engine.mjs` | 51.52 % | **98.49 %** | 3 equivalent |
| `scripts/lib/reconcile-brain.mjs` | 71.43 % | **~96 %** | 6 equivalent |
| `scripts/lib/engine-source.mjs` | 81.40 % | **93.02 %** | 3 equivalent |

## The headline finding: the discipline stopped at the edge of the domain logic

Rank those four by score and the ordering is not random — it tracks **how the code was written**:

- `engine-skill-refresh.mjs` (86.7 %) was built **in TDD baby-steps** during this increment. It started
  highest and needed only assertion polish.
- `engine-source.mjs` (81.4 %) is a **pure module**: small, side-effect-free, easy to drive from a test.
- `reconcile-brain.mjs` (71.4 %) is a pure core **wrapped in I/O and a CLI**.
- `update-engine.mjs` (51.5 %) is **mostly composition**: fetch, orchestrate, report, boot.

The rule that predicts the score is not "did we write tests" — all four had tests, and the suite was green
at 790 before any of this. It is: **was this line reached by a test that was written FIRST, or was it glue
added afterwards around an already-green core?** In `update-engine.mjs`, ~40 of 96 survivors sat in a single
top-level `if (isEntrypoint(…))` block; in `reconcile-brain.mjs`, ~22 sat in the CLI around it. That is
Part I's **C4** — already diagnosed, already engraved — reproduced almost verbatim, twice.

**So the honest answer to "how did this happen" is not that we lacked the rule. It is that the rule was
written as an assertion habit, and the failure is a DESIGN habit.** You cannot assert your way into a
composition root: you have to give it a seam *while writing it*. Every time the fix was the same
(`runUpdateCli(deps)` / `runReconcileCliProcess(deps)` + a `real…Deps` object + one subprocess test), and
every time the seam was cheap **after** the fact only because the logic underneath was already clean.

## Four failure shapes Part I did not have a name for

**1. The self-confirming fixture.** The no-churn test built its `settings.json` fixture with
`JSON.stringify(x, null, 2) + "\n"` — i.e. **with the same serialiser the production code writes it with**.
So "the reconciler must not rewrite a converged brain's settings" could not fail: a reconciler rewriting the
file on every run left it byte-identical. The test was green and proved nothing. Fix: make the fixture
**foreign to the writer** (4-space indent, no final newline — the shape a human editor leaves), and the
claim becomes refutable.
→ *Rule: a fixture must never be produced by the code under test. If it is, the assertion is a tautology.*

**2. The stub that cannot discriminate.** `countVaultNotes: async () => 0` returns exactly what a real
empty vault returns, and ignores its argument entirely. A reconciler calling the REAL counter, or calling
it with no brain dir at all, passed every test. Fix: stubs return values **no real implementation would
produce** (407 notes), and **record their arguments**.
→ *Rule: a double's return value must be a fingerprint. If the stub's answer is plausible for the real
thing, it proves nothing about the wiring.*

**3. The multi-reason condition never isolated.** `if (added.length > 0 || repaired.length > 0 ||
statusLineRepaired)` had three reasons to fire, and **every fixture triggered at least two of them at once**
(each broken-Windows fixture had both broken hooks and a broken statusLine). So no single term was ever the
sole cause, and dropping any one of them kept the suite green — including the one that would have left the
entire deployed Windows fleet unrepairable.
→ *Rule: a condition with N reasons needs N tests, each feeding exactly ONE reason. Sharper than "triangulate
the operator": here every operator was right and the coverage was still a lie.*

**4. Platform-conditional code, invisible on the CI's platform.** `brainDir.split("\\").join("/")` is a
**no-op on every POSIX path**, so on a macOS/Linux CI no test could distinguish it from `p => p`. The
Windows contract it encodes (issue #31: Git Bash eats a backslash in a hook command) was therefore untested
by construction, and a regression would only ever have surfaced on a user's machine. Fix: extract the
transform into a named exported helper (`toPosix`) and feed it a **Windows-shaped input** on the POSIX CI.
→ *Rule: any platform-conditional transform must be a pure named function fed foreign-platform data.
"We can't test that here" means "extract it", not "skip it".*

## The systemic finding: the audit's own success suppressed the re-check

`update-engine.mjs`, `reconcile-brain.mjs` and `engine-source.mjs` appear **nowhere** in Part I's results.
They were never measured. Yet `RESULTS.md` carried the line *"`scripts/**` is now fully hardened"* — true of
the three worst files enumerated at the time, false as a statement about the directory. Anyone (including
us, at the start of Step 10) reading that line concluded the surface was covered and that a low score would
be a **regression from this branch**. It was not; it was virgin territory wearing a "done" label.

→ *Rule: a hardening claim states the FILES it measured, never a glob. And `mutate:changed` is the trigger
that makes it self-correcting: it deliberately skips `scripts/**`, which is exactly why `scripts/**` drifted.*

## Two habits that worked, and are worth keeping

- **Hand-applying each mutant against the full suite before and after writing the test.** Cheaper than a
  Stryker run (seconds vs minutes), and it caught a real mistake here: a mutant I had recorded as *killed*
  was in fact the OTHER branch of the same ternary, still alive, because the assertion used
  `.includes(…)` instead of naming the whole list — Part I's C2, reproduced in a branch written after C2 was
  engraved. Reasoning about mutants is not verifying them.
- **Simplifying production instead of excusing the mutant.** Three guards in this branch could not change a
  single byte (`flagValue`'s length check, `?? {}` before an object spread, the sidecar-clear condition of
  the previous step). Deleting them said the same thing in less code and removed the mutants outright. The
  temptation each time was to file them under "equivalent" and move on.

## What this changes

The four new shapes above are **assertion/fixture habits** and generalise beyond this repo → they belong in
the global `tdd-discipline` skill, next to Part I's six. The two findings that are **not** assertion habits
are the important ones, and they are structural:

1. **Composition roots get their seam when they are WRITTEN, not when they are audited.** The `runXCli(deps)`
   + `realXDeps` + one-subprocess-test shape is now the default for any new entry point in this repo, not a
   remediation pattern.
2. **A hardening claim names files, never globs** — so the next reader cannot mistake unmeasured code for
   measured code.
