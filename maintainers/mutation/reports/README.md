# Mutation run logs — the evidence behind `RESULTS.md`

One file per Stryker batch. [`../RESULTS.md`](../RESULTS.md) cites them by name in each section's
**Reproduce** line, so they are versioned rather than left on whoever's laptop ran them.

**Why they ship, when the scores are already written up next door.** A score is a conclusion; these
are the observations. The bulk of each file is the **survivor list with the exact diff** — file, line,
column, the original expression and the mutant that lived:

```
[Survived] MethodExpression
scripts/lib/engine-fetch.mjs:56:18
-   return m ? m[1].trim() : null;
+   return m ? m[1] : null;
```

That list is the raw material of [`../RETROSPECTIVE.md`](../RETROSPECTIVE.md), and re-deriving one
costs a **13-minute re-run** on the exact commit — assuming you still have it. Versioning them makes
"which mutants survived here?" a `git` lookup instead of a rebuild.

**Normalized before committing** (2026-08-20, the run that started shipping them): ANSI colour codes
stripped, and the `Mutation testing NN% (elapsed…)` progress lines dropped. Both are pure noise in a
diff — the progress lines are wall-clock-dependent, so they would change on every run while saying
nothing. Nothing else is touched: the header, the survivor list and the score table are verbatim.

**What deliberately does NOT ship**: the generated HTML dashboards (`mutation-*.html`, ~1 MB each).
Unreadable in a diff and fully regenerable from the run. They stay in `.gitignore`.

> This whole folder is under `maintainers/`, which
> [`../../../scripts/lib/tracked-files.mjs`](../../../scripts/lib/tracked-files.mjs) excludes from the
> brain copy (`DEV_ONLY_PREFIXES`). Generated brains carry none of it.
