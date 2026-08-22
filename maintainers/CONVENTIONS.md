# Maintainer conventions — repo-carried, brain-safe

> **Who this is for.** You are **DEVELOPING the launcher itself** (this `kenjaku`
> repo), **not installing a brain**. These are the durable working rules for maintaining the
> generator. They are **carried in the repo** so they travel with any clone / any machine / any
> collaborator — instead of living only in one person's local `~/.claude/` (global rules + machine
> memories, which do NOT travel).
>
> **Brain-safety.** This file lives under `maintainers/`, which `scripts/lib/tracked-files.mjs`
> (`DEV_ONLY_PREFIXES`) **excludes from the install copy** — it is **never** shipped into a generated
> brain (tested in `tracked-files.test.mjs`). The pointer to it sits in the **root `CLAUDE.md`
> bootstrap stub**, which the installer **overwrites** at install (marker
> `<!-- second-brain-generator:installer-stub -->`, see `scripts/lib/claude-md.mjs`). Two independent
> barriers ⇒ none of this reaches an end user's brain.

This file is the **single entry point** for the conventions. Some already have a detailed home in the
repo (linked below); the rest are spelled out here because they previously lived only in a personal
`~/.claude/`.

## 1. Plans, roadmaps, TODOs — checkboxes on every step

> 📤 **The project-agnostic version of §1, §3 and §3bis lives in the harness**, not here:
> [`use-case-driven-harness`](https://github.com/tpierrain/use-case-driven-harness) →
> `rules/plans.md` (always-on) + `skills/plan-discipline/` (the how, and the full rationale).
> **That repo is the source for the method; this section is its application here** — change the
> method there first, then carry the consequence into this file. What stays below is deliberately
> repo-carried, so it travels with any clone. _(Was the other way round until 2026-08-20, when the
> standalone copy that used to sit in `maintainers/` moved out; `plan-discipline.md` is now just a
> pointer.)_

Any **plan / roadmap / TODO / progress-tracking** document I write or edit (first of all
`maintainers/plans/**`, but **any** file listing steps to do) MUST use Markdown **checkboxes**
`- [ ]` / `- [x]` on **every step AND every sub-step** — never plain bullets `-`, never text-only
markers (`TODO`, `✅ DONE`) alone — so progress can be **followed and ticked straight from the
Markdown** (Typora / Obsidian / the GitHub preview), with nothing to re-ask.

- A **multi-step plan** → a **"Tracking"** section at the top, **one checkbox per step**, then
  **sub-checkboxes** down each step. Reference model:
  [`plans/prospective/rag-embedder-plan-action.md`](plans/prospective/rag-embedder-plan-action.md).
- A **finished step** → tick `- [x]` **and** note _(date · commit)_: it's the memory that survives a
  `/clear`.
- **By default, when opening a plan**, restore the checkboxes if they're missing — don't wait to be
  asked.

## 2. Plan steps lead with the WHAT (capability), not the HOW

At the **first level** of a plan — section titles and the head of each step / sub-step — state the
**WHAT**: the functional capability being **added / changed / removed**, phrased in terms of what the
**brain, the installer, or the user can now do** (or what behaviour changes). The **HOW** — TDD,
baby-steps, file/seam names, the mechanics — belongs **nested underneath**, never at the headline.

Why: a human follows a plan by its **functional coherence** (the capabilities), not by its mechanics. A
first level that reads *"TDD a pure registry in `health-probe.mjs`"* hides the point; *"Detect when a
capability is functionally broken (RAG, index, embedder, MCP) and warn the user"* shows it. Leading with
the HOW, or mixing HOW into the WHAT at the top level, makes the plan unreadable to track.

- **Headline = capability / behaviour**, in user/product terms. Mechanics (test framework, file names,
  seams, the word "baby-steps") go in **indented detail** below.
- The HOW is the **default anyway** (TDD baby-steps + green-only = sections 1 and 5) — don't re-announce
  *"I'll do TDD"* on every step; spell out only what's **non-obvious** about the approach.
- Applies to plans, **Tracking** lines, ADR titles, **and how progress is narrated in chat** (lead with
  the capability changed, not "I wrote a test then made it pass").

> Thomas asked for this explicitly (2026-06-20): what matters to follow coherence is the **quoi**
> (capabilities) at the top level, the **comment** as nested detail — and to make it **emerge in the
> repo's harness**, not just a local memory. Hence this section.

## 3. One canonical plan = the repo's

The **living plan** is the one under `maintainers/plans/**` (ticked as work proceeds, opened in
Typora/Obsidian). The auto-saved snapshot under `~/.claude/plans/` is **throwaway**: the moment a plan
is promoted into the repo, mark the `~/.claude/` snapshot **⛔️ SUPERSEDED** and never open it or rely
on it again.

> Trap that motivated this: two desynced v3.3.0 plan files (0 vs 13 checkboxes), 2026-06-20. Always
> resolve to the repo copy.

## 3bis. Memory ⇄ plan: pointers, not copies (and the /clear resume)

> Named principle behind §3 + §7: Thomas Pierrain, *"Des pointeurs, pas des copies, banane"*
> (<https://medium.com/@tpierrain/des-pointeurs-pas-des-copies-banane-56c9d197b80b>).

The agent's working-memory `MEMORY.md` is **reloaded in full every session** and is **size-bounded
(~25 KB)**. Duplicating a plan's state there is not just redundant — past the bound it **silently
overflows and buries the critical instructions** under stale text. So the memory holds **pointers,
not copies**:

- **State of a chantier lives in the repo plan** (§3, the single source of truth) — checkboxes,
  commits, remains-to-do. The memory keeps **one thin pointer line**, never a copy of that state.
- **🚫 NEVER put the next step in memory. Not even once, not even "just this one".** "Next: F17",
  "what remains is X", "blocked on Y", a summary of where the work stands — **all of it belongs in
  the plan, always**, and nowhere else. This is the sharpest edge of the rule and the one that gets
  bent, because writing it in memory *feels* like saving it. It is the opposite: the plan is edited
  and committed as the work moves, so it stays true; a memory line describing the next step is
  written once and then quietly outlives the step it describes, while still being read at every
  session start with full authority. A stale pointer is a wrong instruction, not a missing one.
- **Only two kinds of entry are admissible**, and neither is state:
  - a **pointer** — which plan file holds the state, and to open it;
  - a **reference** — something that exists nowhere else and is not recoverable from the repo (a
    published URL, a durable preference, a convention with its rationale).
  Everything else is either in the plan, in the code, or in git — and therefore must **not** be
  duplicated here. Every extra line spends the same bounded budget the critical instructions need.
- **On ship, prune it** — retire the SHIPPED pointer + its index line in the archiving change (§7).
- **The only pointer this repo needs is the door.** *"On reprend"* → open
  [`plans/ACTIVE.md`](plans/ACTIVE.md). Anything in memory that ranks plans, flags one *"read this
  first"*, or carries a due date **is state wearing a pointer's clothes**.
- **`/clear` resume ritual:** a `/clear` is *free* precisely because nothing is lost in memory —
  the state is in the plan. To resume: **open [`plans/ACTIVE.md`](plans/ACTIVE.md) → follow its link
  to the active plan → read that plan's `## 📍 STATE` block → announce the step before writing any
  code.** No grep, no ROADMAP scan, no ranking of candidates. Sub-plans are legitimate and are reached
  **through** the active plan, never directly.
- **The first unticked `- [ ]` is NOT reliably the resume point**, which is why the STATE block
  outranks it. Constraints, rejected options and evidence are checkboxes too; a step can be done bar
  one line of doc; a check can be waiting on an environment.

### 3ter. State has a FORM of its own — the invariant

> 🎯 **A paragraph in a plan may not contain a fact that can become false.**

_(Adopted 2026-08-22, on a measurement of this repo's own corpus: 90 plan files, 33 654 lines, and
**84 %** of the writes to the biggest live plan moved **no checkbox at all** — the state was in the
prose the whole time. The study, its evidence and what it retires:
[`plans/prospective/plan-state-single-source-study.md`](plans/prospective/plan-state-single-source-study.md).
The convention itself is the harness's, see the banner in §1.)_

If a sentence can go false **without anyone editing it**, it is state, and state has exactly two legal
forms: a **checkbox**, or a line in the plan's **`## 📍 STATE`** block. Prose then carries only what is
true forever: rationale, evidence, what was rejected and why, how it went.

1. **Every live plan opens with the block**, immediately under its title: four keys — `Next:`,
   `Blocked on:`, `Owner's call pending:`, `A session may, alone:` — one date, **≤ 20 lines**, always
   that heading. The cap *is* the prevention: four slots have nowhere to put a narration and nowhere
   to put a second copy. It **replaces** any hand-written `WHERE THIS RESUMES` / `RESUME AT` header.
2. **A fact another system owns is linked, never asserted.** Merged, tagged, released, CI green,
   branch alive, which commit: **git and `gh` are the record.** Write `PR #76` as a link; never
   *"#76 is a draft"*, *"CI 7/7"* or *"nothing tagged"*. A ticked checkbox's _(date · commit)_
   annotation is history and stays welcome.
3. **One item, one STATE block**; every other mention is a **link**, syntactically. Hence
   [`plans/ROADMAP.md`](plans/ROADMAP.md)'s map has columns `Plan | Delivers | Depends on` and **no
   Status column**: a form with no status field cannot hold a status.

### The save point is EVERY handed-back turn — not the end of a step

**Before handing back** — that is, any reply that does not chain into another tool call, so **every
instant the human may `/clear`** — the plan's **`## 📍 STATE` block** must already say what the chat
message is about to say. The test, applied before writing the reply: **if my reply contains "next: X",
"Y remains", "resume at Z", or a decision taken in conversation, those sentences already exist in the
committed block.** Otherwise write them there first, and let the chat be the echo. Four keys and
≤ 20 lines is cheap enough to write mid-reply — that cheapness is the rule, not a bonus.

This is what no checkbox says on its own:

- **what the next real step is**, when the first unticked box is not the right marker (above);
- **a decision taken in conversation** (a trade-off, a scope call, a "we are not doing X") — it dies
  at the `/clear` if it lives only in the thread;
- **a blocker or an external wait**, and what would take to lift it.

Why the precision matters, given "tick as you go" was already written: its trigger is *"a step is
finished"*. Between two steps the state therefore lived in the last reply — the one place a `/clear`
destroys — and the human had to ask for it to be saved. The right trigger is not the end of a step,
it is **the handed-back turn**. **Goal: `/clear` is free at every instant, never only at step
boundaries.**

**And "the plan" is PLURAL — measured here, 2026-08-20.** A session made **8 commits, 4 of them into
plans**, obeyed the save point every time, and still left the corpus stale: **four** files restated
the same item's status (`agent-orchestrated-release-mode-action.md`,
`update-regime-owns-what-it-shipped-action.md`, `v4.9.0-mutation-debt-plan.md`,
`maintainers/mutation/RESULTS.md`) and each commit updated **the plan that was open**. Nothing was
forgotten: the state had been **copied**, and a copy is invisible from inside the file you have open —
§3bis's own principle broken one level up, at the corpus rather than at a single plan. So:

- **Name the carriers, do not recall them**: `git grep -l "<branch>" -- '*.md'` before handing back.
  Every file that answers must already say what the reply says, or be told in one line why it needs
  nothing.
- **One item, one OWNING plan.** A second file that restates a status is a future lie: link to the
  owner instead. Deduplicate the moment the grep shows a duplicate.
- **An orchestrated run (§12) has almost no hand-backs**: dozens of tool calls between two of them, so
  the mode rarefies the save point exactly when there is most state to record. On such a run, save at
  **each decision as it lands**.
- **Deterministic net (ADR 0009), machine-local**: `~/.claude/hooks/plan-carrier-guard.mjs` blocks the
  hand-back naming the untouched carriers. It judges **no content**. Braces; this section is the belt.

This is the **all-projects** convention; the global rule
[`use-case-driven-harness/rules/plans.md`](https://github.com/tpierrain/use-case-driven-harness)
§ "The save point is EVERY handed-back turn" carries the same, machine-wide, and **owns the method**:
change it there first, then carry the consequence here.

## 4. Artifacts in English (conversation may be in French)

**Every durable artifact** I produce or modify is written in **English** — no hidden exception:

- **Code**: identifiers, function/variable/type names, **comments**.
- **Versioned docs & Markdown**: `README`, `SETUP`, ADRs, plans/roadmaps/TODOs, skills (`SKILL.md`),
  this file.
- **Git**: commit messages, **PR titles AND bodies**, issue descriptions, branch names.
- **Logs, error messages, end-user product strings** (except deliberate product localization).

**The one exception — deliberate product localization (do NOT "fix"):** `templates/<locale>/**`
(e.g. `templates/fr/…`), content generated under `--lang fr` / another locale, per-locale demo notes /
stopwords, proper nouns, quotes, and historical records kept on purpose in another language. Rule of
thumb: **I write it** (code, doc, commit, PR) → English; **the product speaks to a user in their
language** → respect the locale. A PR or comment left in French is a **defect to fix**, not a choice.

## 5. Test-first + green-only commits

- **Test-first on all code — engine AND harness.** The test comes before the code, always, and it is
  seen **red for the right reason** before a line of implementation (fail-first is the load-bearing
  rule: it is the only mechanical guard against the tautological test). The refactor is part of the
  step. The **default mode** is design-first then test-first **in small batches**; classic **baby-steps
  + triangulation stay available as a tool** — genuinely unknown design, or when the owner wants the
  step-by-step narrative. **The judge is the mutation score, not the ritual.** The actionable
  discipline lives in the **`test-first-discipline`** skill
  (`.claude/skills/test-first-discipline/`). Operative repo rule:
  [`../DEVELOPING.md`](../DEVELOPING.md) §6. Back-ends/services use `outside-in-diamond-tdd`.
  > **Why this changed (2026-08-15, owner's call).** The rule used to forbid test-first batches.
  > v4.9.1 measured the relaxed mode: **91.80 %** first-pass mutation score on the file it wrote,
  > against **84.62 / 87.74 %** for v4.9.0's strict baby-steps. What was dropped is TDD's own thesis
  > (design emerging one example at a time), not a ceremony, hence the rename. The 87 % vs 51 % figure
  > long quoted against this compared **test-first with test-after**, never step sizes.
- **Commit only green.** Never commit a red suite. An outside-in acceptance test that is RED by design
  is marked `{ todo }` / skipped (executed + fail-first internally, but reported `todo`, not `fail`) so
  the suite stays green at `exit 0`; the flag is removed at the apply step. No history rewriting —
  green-only from here on.

## 5bis. Test the glue too — "pure I/O" is not an exemption

The 2026-06-23 mutation audit found `document-scanner` and `vault-watcher` at a **0 % mutation score**:
they had **no test at all**, waved off in their own comments as *"pure I/O glue, not unit-tested"*. That
dismissal is the bug. I/O glue still hides logic — a `.md` filter, a `.obsidian` exclusion, an
`isIgnoredPath` predicate, event wiring — and untested logic is where silent regressions live.

- **No "it's just glue" pass.** Anything with a branch, a filter, a mapping or a wiring gets a test.
  When the obstacle is a real boundary (filesystem, chokidar, network), **extract the logic behind a
  small port / DI seam** and unit-test that; cover the thin adapter itself with one deterministic test
  (e.g. "the default factory builds a live, closeable watcher" — no event-timing).
- **"Unreachable" is the diagnosis, not the exemption (broadened 2026-07).** The 2026-07 retrospective
  found the same 0 %-driver beyond plain I/O: **pure branches unreachable via the public API**
  (`aggregateHealth`'s `unknown` verdict), **top-level side-effect scripts never imported**
  (`clear-example-notes`/`auto-push`/`auto-commit`), and **composition roots** (`server.ts` boot). Same
  fix everywhere: **if a test can't reach a branch, that's a design smell** — extract a pure seam,
  inject a port, or name every wiring factory (no inline arrows) until every branch is reachable. For a
  top-level script: extract an injectable core (`runX(argv, deps)` + a `realXDeps` default) and shrink
  the entry guard to one line; keep **one subprocess integration test** to kill the entry-body mutants a
  pure import cannot.
- **Every executable entry point is tested by RUNNING it as a process (hardened 2026-08-15).** Not
  "keep one subprocess test where convenient": a module's exported functions can be green while the
  **file** does nothing, because no import-based test ever executes the composition root. v4.9.1 paid
  for this: `/switch`'s CLI wiring sat at a **25 %** mutation score while everything it called was
  above 92 %, and the subprocess test that closed it immediately found a defect nothing else could see
  — a brain reached through a **symlinked path** ran the switch **without persisting it**, a silent
  no-op on the exact promise that release existed to keep. The file ended at **100 %**.
- **Coverage ≠ verification.** A suite can show high line coverage and still kill ~0 % of mutants. The
  objective signal is the **mutation score**, not coverage. See the plan
  [`plans/prospective/mutation-testing-stryker.md`](plans/archived/mutation-testing-stryker.md).
- **Two durable guardrails back this up** (Step 4 of that plan): a deterministic **sibling-test guard**
  (`rag/src/lib/lib-coverage-guard.test.ts` fails loud if a `src/lib` module has no `*.test.ts`), and a
  targeted **non-regression re-run** (`npm --prefix maintainers/mutation run mutate:changed`).

## 5ter. Assertion quality — what the mutation retrospective taught (2026-07)

The mutation audit + hardening of all three packages (plan
[`plans/prospective/mutation-testing-stryker.md`](plans/archived/mutation-testing-stryker.md),
Step 6) found **recurring shapes** of surviving mutant. Two homes:

- **The 5 language-agnostic assertion habits** (assert the message not the fact; assert the whole
  object/call-sequence not one field; triangulate boundaries **and** operators; feed the null/absent
  twin of every `?.`/`??`/default-arg; test collections with ≥2 unsorted elements + a decoy) live in
  the **global `test-first-discipline` skill** (§ "Assertion quality") — they apply to every project.
- **The repo-specific / infra-shaped ones** are recorded **here**:

  1. **CLI/script fakes must key on the FULL command, and assert the whole call sequence.** A fake git
     keyed on `args[0]` lets every *later* arg-string mutant survive (`--get`, `@{u}..HEAD`, the commit
     `-m <message>`). Key the fake on `args.join(" ")` and `deepEqual` the full command list, message
     included. Mirror real trailing-newline output so the production `.trim()`s are pinned.
  2. **Composition roots / entry guards.** Name every wiring seam (no inline arrows Stryker can't
     observe), inject a `BootDeps`, and guard the boot behind `import.meta.url` so the module is
     import-testable. The entry guard itself is an **accepted equivalent** (runs only when the file IS
     the process) — earn it back with **one** subprocess integration test where it matters (that lone
     test is the whole gap between `auto-commit` 98 % and `auto-push` 92 %).
  3. **LLM-facing string surfaces** (MCP tool names + every tool/field description) never affect a
     return value, so behavioural tests miss them — **assert them explicitly** (drive the real
     registered surface via an in-memory `Client`/`InMemoryTransport`, assert names + non-empty
     descriptions). They steer the model; a blanked description is a silent contract regression.

**Equivalent-mutant literacy — don't chase these** (document + count as "effective 100 % on
non-equivalents"): the default-wiring of an injected port (only exercised in a real I/O run), a
`?? []`/`?? null` whose result is immediately `.map().join('')`ed back to the same string, a greedy
regex masked by a downstream `.trim()`, real-SDK/real-network construction (`new Client({auth})`),
`import.meta.url` entry guards, and `Number()`/parse that already trims. **Tooling trap:** Stryker
**inflates** the score via false timeouts (a bogus 87.5–100 % that masks the honest ~56 %) — bridle
`concurrency`/`timeout` in the config before trusting a run.

**Deterministic guard (ADR 0009 spirit).** Only one cluster is cheaply catchable mechanically — C1
(bare `throws`/`rejects`). [`scripts/lib/assert-matcher-lint.mjs`](../scripts/lib/assert-matcher-lint.mjs)
+ its `*.test.mjs` guard fail CI loud if any engine test file calls `assert.throws(…)`/`assert.rejects(…)`
with no matcher/2nd argument (dev-only, excluded from the brain copy via `DEV_ONLY_PREFIXES`). The
other clusters stay **written rules** (no cheap reliable check) — the on-demand net is
`npm --prefix maintainers/mutation run mutate:changed`.

**Publishing the score — pin it to a frozen release, not to moving `main`.** A published GitHub release
is **frozen**, so a pinned number ("rag 82.59 % at v3.4.1") stays true for that tag forever. Convention:
**every release note carries a mutation-score snapshot pinned to its tag** (the per-package aggregates
from [`maintainers/mutation/RESULTS.md`](mutation/RESULTS.md), measured against that tag's production
code). The **README** tracks moving `main`, so a static number there would rot: keep the README on a
**capability** badge (or a live dashboard badge). Cadence going forward: harden, re-measure, cut a
release, pin that release's snapshot in its notes.

## 5quater. A checker must read through the ENGINE's own eyes, or it measures a fiction

A verify / health / audit surface exists to tell the truth about the engine. The moment it walks the
vault, parses a note or hashes a file **its own way**, it stops describing the engine and starts
describing itself — and it will be believed anyway, because it looks like a measurement.

The lesson cost a first implementation of the disk↔index crosscheck (2026-08-02, on a real brain). It
called `gray-matter` with the library's defaults; `gray-matter` 4.x routes YAML through js-yaml 3's
`safeLoad`, removed in js-yaml 4, which this repo pins. Every note "failed to parse": **434 of 436
healthy notes declared broken**. The vault was fine; the checker was wrong.

- **Reuse the engine's path, don't mirror it.** Import the very functions the engine runs (`scanVault`,
  `sha256`, `parseDocument`), so a change to how the engine reads notes reaches the checker by
  construction. A mirrored constant kept "in sync by comment" drifts on the day nobody re-reads the
  comment. `rag/src/lib/index-crosscheck-scan.ts` is the shape: injected ports whose **defaults are the
  engine's own functions**. Mirroring drifts on details that decide the verdict — the brain-side
  prototype also walked the vault itself, and so would have flagged `_template.md` and `.obsidian/`,
  which `document-scanner.ts` deliberately skips.
- **Judge a checker on its FALSE POSITIVES, not only on catching the true one.** The direction of the
  error is what matters: an alarm on everything is indistinguishable from noise, so it gets ignored —
  and takes the real signal with it. Before shipping one, ask *"what does it say on a perfectly healthy
  brain, and on the ordinary transient states?"* (a note edited a second ago, a fresh clone, a reindex
  in flight). A checker that cannot stay quiet is not stricter, it is useless.
- **Same rule for anything that classifies user content** — a lint, a guard, a nudge. If it does not run
  the production parser on the real payload, it is asserting about a payload nobody has.

## 5quinquies. Mutate a NEW production file the day it is written — not at the release tail

**The rule.** When a new production file is finished — the tests are green and you are about to move on
to the next thing — mutate **that one file** before you do. One file is 1-3 minutes. Both commands run
from the repo root:

> ⚠️ **AN EXISTING FILE IS MEASURED BY ITS CHANGED LINES, NEVER WHOLE** _(2026-08-21, measured)_. The
> scope of a run is the scope of the change; the discipline's own statement of it lives in
> [`test-first-discipline`](../../use-case-driven-harness/skills/test-first-discipline/SKILL.md)
> § *When to run it, and on what*, and this section carries only the commands.
>
> ```
> # the changed hunk of an existing file — the runner passes the range straight through
> node maintainers/mutation/mutate-one.mjs "scripts/update-engine.mjs:147-160"
> ```
>
> **The numbers that made it a rule, from one iteration of the S6 block**: the two brand-new modules
> cost ~40 s and ~1 min and found **two real defects**. `update-engine.mjs` whole cost **~7 min** (396
> mutants) to find **one**, in the three lines just written; `reconcile-brain.mjs` whole cost ~7 min to
> return a survivor list **byte-identical** to the previous run. Re-run on the hunk, the same defect
> died in **44 s** (17 mutants). A third whole-file run was **killed by a 10-minute timeout** — the
> practice had stopped fitting inside the loop it is supposed to serve.
>
> The corollary is worth as much as the minutes: on a whole-file run the score moves for reasons that
> are not yours (one more equivalent over a larger denominator reads as a regression), and this repo has
> spent real time diffing survivor lists to prove it broke nothing. **On a hunk-scoped run, every
> survivor is yours.** Nothing to attribute.
>
> 🛑 **This does NOT license deferring to the tail** — see "Why the tail alone cannot work" below,
> which is unchanged. The rule is "less surface, immediately", never "later".

```
# a scripts file — the runner does the whole recipe, and refuses what it cannot measure
node maintainers/mutation/mutate-one.mjs scripts/<the-one-file>.mjs

# a rag/src/lib file — sandbox-free inPlace on the real tree is this config's own recipe
node maintainers/mutation/node_modules/@stryker-mutator/core/bin/stryker.js \
  run maintainers/mutation/stryker.rag.config.mjs --mutate "rag/src/lib/<the-one-file>.ts"
```

**Belt and braces, and the braces came first** _(2026-08-20)_.
[`mutate-one.mjs`](mutation/mutate-one.mjs) is the **braces**: it **refuses a target that is not
committed** (see below), prunes stale worktree registrations before adding one, creates and resets the
**disposable worktree** (`git reset --hard` + `git clean -qfd
-e rag/node_modules`, **never** `git checkout -- .`), symlinks `rag/node_modules`, proves
`vault-write-guard.test.mjs` reports **0 skipped** there, checks the config's tuning before the run and
the timeout share after it, discards any stale log, and **fails loudly rather than report a score it
did not measure**.

> 🛑 **COMMIT, THEN MUTATE — and the tool enforces it now** _(2026-08-22)_. The worktree is built at
> `git rev-parse HEAD`, so a pass launched over an **uncommitted** change measures the OLD bytes and
> prints `✅ Mutation score 100 %` in exactly the same words. It happened twice in one night, two hours
> apart, **with the rule already written in bold in `mutation/RESULTS.md` between the two attempts**:
> a written rule competes with an output that says ✅ either way, and the output wins. So the runner
> asks `git status --porcelain` about the **targets** (never the whole tree — editing plans while
> mutating a committed file is the normal way it is used) and stops before touching a worktree.
> **This is the general lesson, not a mutation-testing one**: when a rule has to be remembered at the
> exact moment an instrument is reassuring you, move it into the instrument. The [`mutation-testing`](skills/mutation-testing/SKILL.md) skill is the **belt**: it
holds what a script cannot — when a pass is due, how to read the survivors, when to simplify the
production instead of writing a case, and when a named equivalent is honest.

Why the worktree is not ceremony you can skip for a one-file run: `inPlace` on the real tree lets a
mutant of vault-mutating code (`clear-example-notes.mjs`, `auto-commit.mjs`) act for real, and the
sandbox alternative has no git, which `engine-manifest-integrity` needs. A suite that reports skipped
cases in the worktree is §5quater's fiction with a mutation score on top. All of that is now the
runner's job rather than yours to remember — which is the point: this section had carried the recipe
in prose since v4.8.0 and the traps kept being paid anyway.

This is an **addition, not a substitution**: the release-tail pass over everything the branch changed
stays exactly as it is (§10's sibling in the release checklist). What changes is that the tail stops
being the *first* time anyone looks.

**Why the tail alone cannot work.** The tail pass is deliberately run once the branch has **stopped
moving** — that is the right call for a *measurement* (measuring earlier buys a re-measure; v4.6.0's
RESULTS.md had to be redone after seven later commits). But it makes the pass arrive at the exact moment
when restructuring is most expensive and the release is most pressing. **A lesson that only ever arrives
after the writing can tax it; it can never teach it.** So the honest answer is not to move the tail pass
— it is to add a cheap detector that fires while the code is still soft.

**What made this a convention rather than a preference** (v4.8.0, 2026-08-05). The tail pass on that
branch scored its first batch at **65.92 %**, the worst first pass of any release, and **57 % of the
survivors were two shapes this repo had already diagnosed *and already fixed once, elsewhere*** — a real
child-process runner nothing observed (solved at v4.5.0 by turning the spawn's request into a pure value,
never propagated), and a top-level script with no test sibling (a fix designed and named at v4.5.0, then
deferred three releases running). The knowledge was complete, versioned and written down. What was
missing was a net that fires **while the file is being written**.

**What it may cost, arbitrated by Thomas** _(2026-08-21, during the v5.0.0 night)_. The rule above stays;
what was capped is its **overhead**, after a night where the write-ups and the re-runs came to rival the
feature work (74 commits, 35 of code, 12 of mutation prose; 694 lines of `RESULTS.md` against 1 448 of
production). Four limits, and they are limits on the *bookkeeping*, never on the detector:

- **One pass per feature block, not per sub-slice.** That night `update-engine.mjs` (~370 mutants,
  11 minutes) was measured **twice for one slice**. Group the block's files and run them once.
- **No confirmation re-run when the delta is predictable.** State the predicted score in the commit or
  the plan and let the next block's pass confirm it. Being right out loud is not worth 11 minutes.
- **`RESULTS.md`: one line per file.** A paragraph is earned only by a **new shape** of defect (the kind
  that becomes a durable rule), not by every slice's number.
- **No pass at all** on doc-only or wiring-only slices, nor on a large file changed by two lines — say so
  in writing, so a skip stays a choice and not an omission.

**Not negotiable, and this is why the cap is on the paperwork only**: a new pure module, anything on the
**write path** (this product overwrites files inside other people's brains, and its failure mode is
silent and permanent), and prose that IS the deliverable. That same night the detector found a flaky test
inflating every score in the release, a product defect that would have silenced future verdicts, and
three tests that tested nothing. **The instrument earns its keep; the commentary around it did not.**

Two corollaries, both earned the same day:

- **Do not answer a recurring shape with one more written reflex.** `test-first-discipline`'s assertion section
  already carries ten of them, and its own second audit noted the first six "pourtant déjà gravés" had
  not sufficed. Another line of prose is the move that was already measured as insufficient.
- **A lesson recorded as a story about the file just fixed does not generalise.** RESULTS.md entries read
  *"`rag-status.mjs` had five loose assertions"* — true, useful, and inert. Record the **constraint**
  (this section, a guard test, a numbered debt line that may only shrink), not the anecdote.

## 6. ADRs carry a `Scope:` field

Every ADR carries a `- **Scope:**` line right under `STATUS`, with an **explicit** value (never the
vague "both"): **Installer** · **Second brain (runtime)** · **Second brain (runtime) + Installer** ·
**Generator development (maintainer workflow)**. It forces the author to situate the decision on the
launcher↔brain backbone (ADR 0001). Full convention: [`README.md`](README.md) (the `decisions/`
section).

## 6bis. When a decision evolves, AMEND the existing ADR in place — don't spin off a new one

When an already-accepted decision **evolves**, **amend the existing ADR in place** (enrich the relevant
sections — Decision, Safety invariant, Consequences, Rejected alternatives) rather than spinning off a new
ADR. **Do NOT create a new ADR for each evolution.** An evolution that belongs to the **same topic** (e.g.
"what the reconciler is allowed to write") lives in that topic's ADR, not a separate one — multiplying ADRs
makes `decisions/` hard to navigate. A brand-new ADR stays the right choice only for a decision on a
**genuinely new topic**. (Origin: decision B was first split into a separate new ADR + back-pointer;
corrected to fold it into ADR 0026 in place.) **How to write the amended result: see §6ter** — amending in
place is about keeping **one ADR per topic**, NOT about leaving dated "AMENDED" scars in the prose.

## 6ter. Write each ADR for a fresh reader — explain the decision, don't justify the change of mind

An ADR is read by someone **discovering** the project, who never witnessed the deliberation. Write it as a
**single, timeless decision**: explain **why the decision is right** (the reasoning that stands on its own),
**not** the autobiography of how the thinking evolved. Drop "we first did X, then reverted", "consciously
revised", "the original §N said…", commit hashes, and "(amended date, person)" markers from the **ADR prose**
— they address someone who was present, and an unpublished ADR has no "before" for the reader.

- **Where the deliberation history lives:** the **plan** (a process doc — checkboxes, commit hashes, "X then
  revised to Y"), the **memory**, and **git history**. Not the ADR.
- **Rejected alternatives stay** — but framed timelessly ("option A was *considered* and rejected because…"),
  never as "we shipped A then undid it".
- **The one carve-out:** when the prior decision was **actually published / shipped** and readers may have
  built on it, keep a short **`supersedes X — migration: …`** note. That serves the reader; an
  in-the-same-cycle, never-published amendment does not.
- Composes with §6bis: amend in place (one ADR per topic) **and** write the result clean. (Origin: ADR 0030
  and 0026 were amended pre-publication with dated "AMENDED IN PLACE" scars; rewritten timeless once we saw
  the ADR addresses a fresh reader, not a witness.)

## 6quater. Lead every ADR with a Crux block

Every ADR opens with a short **Crux** block placed **right under the metadata** (STATUS / Scope / Related),
**before** Context: 2–4 bold-led lines giving the **decision** in one sentence, the single **key guarantee**,
and — where it applies (§6quinquies) — the **prior art** it mirrors. The crucial information must stand out
at a glance; the Context / Decision / Consequences detail stays below. **Applies to every future ADR**, not
just the ones touched when this convention was written.

> Thomas asked for this explicitly (2026-06-21): make the essential decision + its key guarantee jump out
> for a fresh reader instead of being buried in the body.

## 6quinquies. Name the prior art — say when a decision isn't NIH

When an ADR adopts an **established pattern**, **say so explicitly** and **cite the prior art** — we are not
reinventing the wheel. Name the industry standard the design mirrors, in a real *"Prior art / why this isn't
NIH"* subsection (or folded into the Crux), so "why this design is right" is obvious to a fresh reader.
Example: ADR 0026 names the **desired-state reconciliation loop** (Kubernetes controllers, GitOps Argo/Flux,
Terraform plan→apply, Chef/Puppet converge, Microsoft DSC Test/Set, Windows Installer self-healing) and
explains the SessionStart tick as its *level-triggered* tick — not a local hack. **Applies to every future
ADR.**

> Thomas asked for this explicitly (2026-06-21): an ADR that quietly re-derives a known standard reads as
> NIH; naming the prior art shows the design is deliberate and battle-tested.

## 7. Plan done = archived

The moment a plan ships, **in the same change**: `git mv` it into
[`plans/archived/`](plans/archived/) **under a date-prefixed name** — `2026-08-21-<name>.md`, the date
it closed. Never leave a shipped plan at the root; never delete it (the archive keeps the step
detail). A plan whose core shipped but that still carries an open conditional/exploratory tail goes to
`plans/prospective/`. Update the plans listing in [`README.md`](README.md), and **hand the door over**:
remove its link from [`plans/ACTIVE.md`](plans/ACTIVE.md) in the same commit.

> 📅 **Why the date prefix** _(2026-08-22, Thomas asked for an archived marker in the filename itself)_.
> A date reads as *historical record* at a glance and sorts by close date, which is what an archive is
> for. **Newly archived files only — no retro-rename of the existing ones**: it would break Markdown
> cross-links across the whole corpus to fix what the one-door rule already fixes by removing the other
> ways in.
>
> 🚫 **And the archived plan's `## 📍 STATE` block goes when it is archived** — replaced by one line
> saying which release shipped it. A block whose name means *"the only perishable thing here"* has no
> business in a file that is, by definition, finished. _(This is what produced a 40-line apology header
> in one archived plan: two live statuses were written into a file whose own first line forbids reading
> it for status.)_

**Ship ⇒ also retire the working-memory pointer (anti-context-rot).** A maintainer's running
working-memory (the agent's `MEMORY.md` index, loaded in full every session) must NOT accumulate
"✅ SHIPPED" lines — a shipped chantier's trace already lives in git + the archived plan. So, **in the
same change that archives the plan**, delete the chantier's thin memory pointer and its index line. Keep
a memory only for a **durable lesson not derivable from the code** the work produced (saved as its own
`feedback`/`reference` note), never as a delivery-status line. An active chantier keeps exactly **one
thin pointer** to its repo plan — never a copy of the plan's state.

## 8. Terminology — `reconcile` (mechanism) vs `self-heal` (runtime/user)

Use the cloud-native 2020s vocabulary consistently, so code and prose name the same thing the same way:

- **Mechanism / code → `reconcile` / "the reconciler"** (Kubernetes + GitOps + Terraform, and our own
  `reconcileMcpServers` / `reconcileHooks` / `reconcileBrain`). **Do NOT call the component "the
  converger"** — that noun is retired.
- **Runtime / user-facing → `self-heal` / "auto-réparation"** (Argo, Windows Installer, our
  `session-self-heal` hook). This is what the brain *tells the user*.
- **Precise nouns:** *desired state* (the manifest / `target`), *drift* (the gap), *idempotent*,
  *level-triggered* (the SessionStart tick), *converged* (the steady state). **Keep `converge` /
  `converged` / `convergence` as verb/state only** — they are correct and stay (~30 sites); only the
  component **noun** "the converger" was renamed to "the reconciler".
- Optional mental frame: DSC's **Test** (= `self-heal-detect` / `detectHookGap`) → **Set**
  (= `reconcileBrain`).

> Origin (2026-06-21): code said `reconcile`, prose said "converge"/"the converger" — the industry's two
> names for one thing. Locked one term per usage to keep the desired-state-reconciliation design legible.

## 9. Cross-platform parity — local green ≠ green (the CI matrix is the arbiter)

Development happens on macOS, so a **local green is a POSIX green**: Windows-only defects are invisible
locally and TDD's fail-first can't fire for them. They are logically-correct-but-environmentally-wrong
bugs — a class mutation testing and unit runs won't catch. The net is the **CI matrix** (`ci.yml` runs
Node 22/24/26 × macOS + Windows). Use it as the source of truth.

- **Never declare "done" or merge on a local green alone.** Wait for the **full CI matrix (Windows
  included) to be green.** (Origin, 2026-07-15: the mutation PR was proposed for merge on local green while
  Windows CI was red — `document-scanner` emitted vault-relative paths with `\`, silently breaking
  `frontmatter-parser`'s `startsWith("topics/")` type table and its `split("/")` filename extraction.)
- **Path reflexes, every time you touch paths / `spawn` / `fs`:**
  - No hard-coded `/` in a path or in a path assertion — build via `path.join`/`resolve`.
  - Any path that becomes an **identifier / key / URL** → normalise to **POSIX at the single source**
    (`p.split(sep).join("/")`), as `document-scanner` now does; keep the *absolute* path native (it must
    stay openable by `fs`).
  - **A fake must key exactly the way production computes its key** (`resolve(...)`), never a hard-coded
    POSIX literal — a POSIX-keyed fake silently misses subdirs on Windows (the cousin of the mutation
    finding "a fake keyed on a partial command lies"). Assert on `sep`-agnostic / normalised values.
  - Usual Windows suspects: `resolve` of a POSIX-absolute (`/x` → `D:\x`), `.cmd`/`.exe` + shell,
    `realpathSync` both sides (`/var`→`/private/var`), CRLF, drive letters, case-insensitive FS.
- **No lint for this** — legitimate `/` are everywhere (URLs, regex, comments), so a path-separator lint
  is all false positives. The **CI matrix is the deterministic net**; this section is the written reflex.
- **The net now fires DURING the work, not only at the PR** (added 2026-07-28, v4.4.0). For a long time
  this section was true in principle and useless in practice: `ci.yml` triggered on `pull_request` and
  on pushes to `main` only, while our PRs open at the **end** of a release (Track 9). So the
  "deterministic net" could not physically fire while a branch was being written — v4.4.0 reached
  **52 commits** before Windows ever spoke, and then failed on a fixture path spelled `` `/brain/${REL}` ``
  where production `join`s. That is why this class kept coming back every few releases: **not a weak
  reflex, an unwired net.** `ci.yml` now runs on `push` to **any** branch, with a single cheap
  `early-windows` job (one cell, Node 24 × windows-latest, the dependency-free harness suites, ~40 s).
  The expensive matrix stays gated to pull requests and `main`, so an ordinary push costs one short job.
  **Reflex + tripwire + arbiter**: the written reflex above, the tripwire on every push, the 7/7 matrix
  before merge.
- **🛑 …which means the commits have to BE pushed. Push as you go — no asking, no batching** (added
  2026-08-03, during v4.5.0). A tripwire wired to `push` fires exactly as often as we push, so a branch
  that accumulates green local commits without pushing has **no net at all**, however carefully the
  section above is followed. Two episodes now: v4.4.0 reached 52 commits before Windows spoke, and
  `release/v4.5.0` reached **67** — after which the very next push found **14 failures that had been red
  for weeks**. Both times the reflex was fine and the net simply never ran.
  - **The rule: on a release/feature branch, every green commit is pushed** — as part of committing, not
    as a separate decision, and without waiting to be asked. The cost is one ~40 s job; the thing it buys
    is that "green" means something.
  - **This overrides an assistant's default caution about pushing.** Claude's standing rule is to push
    only when asked, which is right for `main` and wrong here: on a branch that already has (or will
    have) its own PR, withholding the push is not prudence, it is disabling the net on purpose. Asking
    every time produces the same outcome as never pushing, because the question is easy to not answer.
  - **Scope, so this stays safe**: branches only, never a direct push to `main`; and pushing is not
    merging — the 7/7 matrix before merge (above) is untouched.

Full rationale: ADR [`0015`](decisions/0015-cross-platform-parity.md) (cross-platform parity).

## 10. Every release re-reads the marketing surface

**A release is not done when the tag is pushed. It is done when the way we present Kenjaku still tells
the truth.** Shipping a capability silently rewrites the value of sentences written months earlier: some
become false, and some become an undersell. Both are defects, and neither shows up in CI.

So, **at every release, before writing the release note**, re-read the marketing surface and answer two
questions, in this order:

1. **What did this release make FALSE, or merely imprecise?** Hunt the absolute promises first, they are
   the ones that rot: *never*, *only*, *always*, *untouched*, *sacred*, *it can only add*. A promise that
   was exactly true yesterday can become a half-truth today without a single word changing.
2. **What did this release make TRUE that we do not sell yet?** A capability nobody reads about might as
   well not exist. If it changes what a newcomer would decide, it belongs on the page, not only in the
   release note.

**The surface to re-read** (whole list, every time, it is short):

- [`../README.md`](../README.md) : the marketing page, and the densest field of absolute promises.
- [`../EN-QUOI-C-EST-DIFFERENT.md`](../EN-QUOI-C-EST-DIFFERENT.md) : the positioning / market piece.
- [`../SETUP.md`](../SETUP.md) and [`../CONNECTORS.md`](../CONNECTORS.md) : promise-bearing where they
  describe what a step does *to the user's stuff*.
- The **boards** (`docs/img/board-*.png`), through their **alt texts in the README** and their source
  copy in [`../docs/marketing-image-prompts.md`](../docs/marketing-image-prompts.md). Regenerating a
  board is expensive, so **decide explicitly**: either the copy still holds, or the prompt is corrected
  and the board re-rendered. Never leave a board asserting something the code stopped doing.
- The **release note** itself, which is the most-read marketing artifact of all. Lead it with *why this
  matters to you*, not with the mechanism.

**Record the verdict, including the boring one.** "Boards re-read, copy still accurate, no re-render" is
a result worth writing in the release's plan or PR: it is the difference between *checked* and *not
looked at*, and the next release should not have to re-derive it.

> Origin (2026-07-27, Thomas, at the v4.1.0 release): that release made the engine refresh untouched
> skills, which turned three README sentences into half-truths in one commit (*"it can only add, never
> overwrite"*, *"an upgrade touches never your notes, keys, constitution or skills"*, and a skills
> section that sold tweaking without saying what tweaking costs). None of them would have been caught by
> a test. Hence the standing pass.

## 11. A release note is written for the non-developer first

**Most Kenjaku users are not developers.** The release note is the most-read artifact we publish, so
its top must be readable by someone who will never open a terminal. The mechanism is not the news —
what they gain is.

**The shape, every time:**

1. **`What this release is about`** — the subject, before any fix. It opens on **one sentence set as a
   pull quote** (`> ###`), the single thing a reader scanning for ten seconds must leave with, then
   says in two or three short paragraphs what the product does today, what the problem costs them,
   and what this release ends. **Describe the old behaviour fairly**: if it was a deliberate
   trade-off, say so — a note that presents yesterday's design as a flaw teaches the reader to
   distrust today's.
2. **`What you get`, grouped by MOMENT** — one heading per moment the reader can situate themselves
   in (*when you update your brain*, *the rest of the time, in ordinary conversations*), each under
   one line of framing that names the moment and the command that triggers it. A flat list forces the
   reader to infer, bullet by bullet, *when* each promise applies.
3. **Every bullet stands ALONE**: an emoji, a bold claim that names its own context, then **one plain
   sentence — or one concrete example**, whichever lands. An example is worth its extra line;
   abstraction dressed as brevity is not. Seven bullets is already a lot. If one needs a paragraph,
   the paragraph belongs in *Under the hood* and the bullet keeps the outcome.
4. **`What you have to do`** — the shortest section, the command and the cost.
5. **`---`, then `Under the hood`** and everything technical: the mechanics, the ADRs, the review,
   CI, the mutation snapshot. **Nothing is cut** — depth is kept, it is *moved below the fold*, where
   the readers who want it will go and the others will not trip over it. **Field measurements live
   here**, not at the top: *"a skill frozen since install day with not one line of its owner's in
   it"* proves an internal heuristic was wrong, which convinces a maintainer and costs a
   non-developer a subtlety they never asked to hold.

**Be brief on purpose.** We are in an era where machines generate a lot of text and humans are tired
of reading it. Length is not thoroughness — the technical sections carry the thoroughness. Every
sentence above the `---` earns its place or goes.

**And the writer's shorthand is not plain language.** *"A brain the way you want it"*, *"your words
are never lost"*, *"it keeps a private copy so it can tell your words from its own"*: each is true,
compact, and leaves the reader to guess what it stands for. Name the things themselves — *the changes
you made to your second brain's capabilities*, *the improvements that follow*. The test is not
whether the sentence is short: it is whether someone who did not build this can picture what it
describes.

**The body is written UNWRAPPED**, one line per paragraph or bullet. Hard breaks at ~100 columns are
invisible once rendered and a nuisance in any editor that reflows — this file is a body to be pasted,
not source to be diffed line by line.

**Do not alarm.** State a fix without dramatizing the defect ("notes that could come out damaged,
don't" — not "notes were destroyed"), scope it to what actually happened, and **never advertise bugs
that never shipped**: findings caught by `/code-review` before merge are evidence the net works, so
frame them as the quality of what ships, not as a list of near-misses the reader should worry about.

> Origin (2026-07-28, Thomas, re-reading the v4.3.0 note): the note opened on the *breakage* and on
> the git mechanism, in dense paragraphs, and told users their brain "was quietly not syncing and
> nothing told you". Rewritten top-down for a non-dev reader, technical depth preserved under
> *Under the hood*. Complements §10, which says the note is a marketing artifact and must lead with
> *why this matters to you* — this section says how.
>
> **Rewritten 2026-08-22, on Thomas's call, from his live re-read of the v5.0.0 note.** The old shape
> (*two-sentence lead*, *one flat `What you get`*, *at most one sentence per bullet*) had been obeyed
> to the letter and still produced a top he judged *"trop cryptique … technico-technique"*. What the
> rewrite cost him was **nine successive corrections in one sitting** — the subject was missing, the
> moment was missing, the examples were missing, the promise arrived last, the shorthand said nothing
> — and every one of them is now a line above, so the next release starts where this one finished
> instead of re-deriving it. **The rule was not amended quietly**: the note deviated first, said in
> writing that it was deviating, and the convention was changed only once he arbitrated it.

## 12. Orchestrating subagents — what may be delegated, and what a wave costs

Measured on the **first real run** of the mode (S0bis, 2026-08-20: two structural mutation debts paid,
14 agents, ~1 h). Homed here rather than left in
[`plans/prospective/agent-orchestrated-release-mode-action.md`](plans/prospective/agent-orchestrated-release-mode-action.md)
because that file is scheduled to be **archived when the release ships** — and a doctrine kept in a
file with an expiry date is how the same lesson gets re-learned. The plan keeps the run's narrative;
what survived the measurement lives here.

**The two rules that made delegation safe. Neither is negotiable.**

1. **Nothing is dispatched without a machine-evaluable pass/fail.** If success can only be judged by
   reading the result, the task is not delegable — it is yours. This is what kept 14 parallel agents
   from producing 14 plausible-looking regressions.
2. **No agent writes a test.** Tests are written before the fan-out, by the session that holds the
   design. An agent that authors its own judge grades its own homework; the tautological test is the
   dominant failure mode of test-first work (see §5), and parallelism multiplies it.

**What the fan-out actually bought, and what it did not.** It paid on the twelve mechanical
conversions: same gesture, twelve files, no shared context needed. It bought **nothing** anywhere
judgement was involved — the guard test, the canary, the session-critical files, the second debt were
all kept in session, and those are precisely the parts that found the real problems. **Judgement does
not parallelize.** Delegate volume, never design.

**A wave is a shared working tree, and that is its real cost.**

- 🛑 **While agents are in flight, stage explicit paths. Never `git add -A`, `.`, `-u`, a bare
  directory, or `git commit -a`.** During S0bis this exact mistake was made **twice in one night**
  (`b4bd7a4`, then `4fdb91b`), sweeping half-finished agent work into unrelated commits. Both landed
  green *by luck*. **Deterministic net (ADR 0009)**: a `PreToolUse` hook,
  `~/.claude/hooks/wave-staging-guard.mjs`, stamps every agent dispatch and **blocks** a broad stage
  for 20 minutes afterwards. The hook is the braces, this line is the belt.
  ⚠️ **The hook is machine-local and therefore does not travel**: it lives under `~/.claude/`, not in
  this repo, so a fresh machine (or anyone else cloning Kenjaku) has the belt and no braces. Making it
  portable means homing it in `use-case-driven-harness` alongside `en-artifact-guard.mjs` — **open,
  not decided** (raised 2026-08-20, deliberately not done in the same breath as writing it).
- **A saturated machine can manufacture false reds.** A timing-sensitive test failed once during the
  run under full load and never reproduced afterwards (30 attempts). Treat an isolated red during a
  wave as *suspect* rather than as fact: re-run it alone before acting on it, and never "fix" a
  timing margin on the strength of a single loaded-machine failure.

**The run log is evidence, not a trophy.** Every claim written into a run log must be checked against
the diff before it is committed. S0bis's log credited a refactor with catching a defect the run had
never found (`main` already guarded that case); it was corrected in place, **visibly**, rather than
quietly deleted. A log that inflates refactoring into bugs-found makes the whole trace worthless, and
it is the orchestrator — not the agents — who writes it.

> Origin: Thomas, 2026-08-20, on reading the S0bis debrief — *"comment peux-tu en tenir compte pour la
> suite ?"*. The honest answer was that the lessons sat in a run log, which is where behaviour goes to
> die: the mistakes were made **while acting**, not while reading a plan. Hence a rule with a carrier
> that loads when it is needed, plus a hook for the one lesson that repeated.

## See also (operative rules already homed in the repo)

- [`../DEVELOPING.md`](../DEVELOPING.md) — manual commits, neutrality (+ the Thomas-Pierrain
  carve-out), generated files not versioned, the bootstrap-stub `CLAUDE.md`, §6 TDD, §7 the
  "one open PR of mine" resume convention (ADR 0013), §8 cross-platform parity (ADR 0015).
- [`README.md`](README.md) — what `maintainers/` is, the ADR `Scope:` convention, the
  plan-done = archived convention.
- [`skills/`](skills/) — the **maintainer skills**, which live here rather than in `.claude/skills/`
  precisely because `maintainers/` never travels to a generated brain:
  [`mutation-testing`](skills/mutation-testing/SKILL.md) (run and **read** a mutation pass — §5quinquies'
  belt, whose braces are [`mutation/mutate-one.mjs`](mutation/mutate-one.mjs)). It is loaded by being
  named here; nothing else advertises it. _(`plan-discipline` used to sit beside it and **left on
  2026-08-20**: it lives in the harness, symlinked into `~/.claude/skills/`, which is what finally
  made it loadable — under `maintainers/` it sat on a path Claude Code does not scan, so it was
  available in no session at all. See [`plan-discipline.md`](plan-discipline.md).)_
- ADR [`0009-prefer-deterministic-mechanisms.md`](decisions/0009-prefer-deterministic-mechanisms.md) —
  at equal reliability, prefer a deterministic mechanism over a probabilistic / LLM / in-memory-timer one.
- `~/.claude/hooks/wave-staging-guard.mjs` — the net under §12's staging rule (machine-local, not in
  this repo; `node wave-staging-guard.mjs --selftest` is its own suite, 20 cases).
- `~/.claude/hooks/plan-carrier-guard.mjs` — the net under §3bis's plural-carriers rule: on `Stop`, it
  names the files that mention the current branch and were not touched, and blocks the hand-back
  (machine-local too; `--selftest` = 29 cases on the pure core, `plan-carrier-guard.e2e.sh` beside it
  = 8 end-to-end payloads, and `--explain` prints its verdict for the current repo).
