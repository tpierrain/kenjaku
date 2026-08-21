---
name: test-first-discipline
description: "How to test, language-agnostic, for ALL code (libs, tools, helpers, algos, services): tests before code and fail-first are non-negotiable, and the mutation score is the judge, not the ritual. Default mode is design-first then test-first in small batches; classic TDD baby-steps + triangulation stay available as a tool. Also carries assertion quality (the mutation-testing lessons), how a mutation run can lie to you, and the entry-point seam rule. To load as soon as you write or modify code."
version: 2.3.0
origin: use-case-driven-harness
---

# Test-first discipline (universal)

> **The name states what SURVIVED the measurement**, not what was dropped: the test comes before the
> code, and it is seen red for the right reason first. Everything else in here is a mode, a reflex or
> a judge.
>
> **This skill replaces `tdd-discipline` (v1.1.0), and the replacement is not cosmetic.** That skill
> opened on a rule — *"one test at a time, complete red→green→refactor at each step; writing several
> tests ahead then implementing is forbidden"* — which was **measured and did not survive**. Everything
> else it carried (fail-first, the refactor step, and above all the assertion-quality reflexes below)
> was **kept verbatim**, because that is what the measurements credit.
>
> **Why the name changed rather than the clause.** What was dropped is not a ceremony inside TDD, it
> **is** TDD's own thesis: the design emerging under the pressure of one example at a time. What
> remains — specify, see it fail, implement, refactor, and let a mutation score judge — is honest work,
> but calling it TDD would be false advertising. Classic TDD did not disappear; it became **a mode**,
> described below with its criteria and its open question.
>
> **The evidence** (Kenjaku, `maintainers/mutation/RESULTS.md`), first-pass scores on **brand-new**
> files, before any review and before any survivor was killed:
>
> | Release | Mode | New files, first pass |
> |---|---|---|
> | v4.9.0 | strict baby-steps | 84.62 % and 87.74 % |
> | v4.9.1 | design-first, test-first in small batches | **91.80 %** |
>
> One release is one data point, and the v4.9.1 figure only reached 95.92–100 % **after** three
> adversarial reviews and two more mutation passes. So the claim is **not** "the relaxed mode is free".
> It is: **the step size did not carry the quality — the nets did.**
>
> ### 🛑 The low numbers you are remembering are NOT baby-steps — here is what each one is
>
> **No score in this record is low *because* the steps were small.** Every low number that gets quoted
> against baby-steps belongs to a different cause, and the cause is always **when the test was written**
> or **whether the line sits in a seam a test can reach**:
>
> | Recalled as "baby-steps scored badly" | Actually | What it really measures |
> |---|---|---|
> | **51.5 %** — `update-engine.mjs` | composition glue written **after** an already-green core | test-**after**, never step size |
> | **71.4 %** — `reconcile-brain.mjs` | a pure core wrapped in I/O and a CLI | an unreachable branch (reflex 6) |
> | **66 %**, and a flat **0 %** for months | top-level entry points no test ever imported | the entry-point seam rule |
>
> And the reverse case, from the same audit: `engine-skill-refresh.mjs` — **the one file built in strict
> baby-steps** — came out **top of its batch at 86.7 %**, needing "only assertion polish". The two
> numbers actually attached to baby-steps in this record are **84.62 %** and **87.74 %**. **There is no
> ~60 % baby-steps run. It does not exist.**
>
> **Why this table is here rather than left to be re-derived**: the misattribution has now happened
> **twice**, from both sides (the 87-vs-51 pair was long quoted in this file's own predecessor as
> evidence about step size; the owner recalled a "60 % baby-steps" figure on 2026-08-20). A number
> misfiled twice is a number that will be misfiled again — so the filing is written down, not the
> correction.

## What judges the work

**The mutation score, not the ritual.** A suite can cover 100 % of the lines and kill 0 % of the
mutants; a discipline can be followed to the letter and produce tests that assert what the code does
rather than what it should do. So the standing of any mode in this file is empirical: it holds the
floor pinned for the project, or it goes. Line coverage is not evidence.

## The three non-negotiables

They do not depend on the mode, and none of them is a matter of taste.

1. **Tests before code.** Test-after is out. Not for purity: a test written after a green
   implementation is written *by* that implementation, and describes it instead of judging it.
2. **Fail-first — see it red for the right reason.** Before a single line of implementation, verify the
   new test fails on an **unsatisfied assertion**, not on a compilation error and not because it never
   ran. This is the load-bearing rule of this file. Under one-test-at-a-time it was one guarantee among
   several; in batch mode it is **the only mechanical guard against the tautological test**, which is
   the dominant failure mode when the author of the tests already holds the whole design. A batch is
   only a legitimate batch if **every** test in it was seen red for the right reason.
3. **Refactor is part of the step, never optional.** A step is done after the ♻️, not at the green.
   It applies **first to the implementation**: better structure, same behaviour — a refactor **never**
   changes the public contract (that is its definition). On the tests it is limited to making them
   **more readable** (names, helpers, intent), **never** to weakening an assertion or checking less. If
   a test covers poorly, that is a *new test*, not a refactor. With nothing to clean up, go through the
   step consciously and say so ("refactor: nothing to do").

## Default mode — design first, then test-first in small batches

1. **State the design.** One paragraph: the seams, the values that cross them, what is a port and what
   is pure. If it cannot be stated in a paragraph, you are in the other mode (below).
2. **Write a small batch of tests describing the intended behaviour** — a coherent slice, not the whole
   feature. Small enough that you can hold every expectation in view at once.
3. **See them ALL red, each for the right reason.** Not "the file fails to load": each one on its own
   assertion. A test that is green before the implementation exists is deleted or fixed, never kept.
4. **Implement until green, then refactor.** Same rules as above.
5. **Measure — but measure WHAT CHANGED, not what surrounds it.** A new production file gets its
   mutation run **the day it is written**, not at the release tail (a file measured late is a file
   whose survivors are found by users). An **existing** file touched by a few lines is a different
   case, and running it whole is where a mutation practice goes to die. See below.

### When to run it, and on what (the flow rule)

Mutation testing is expensive in a way line coverage is not: it re-runs the suite once per mutant. If
every iteration re-measures whole files, the feedback loop stops being usable and the practice gets
abandoned for being slow — which costs far more than the runs saved.

**The scope of a run is the scope of the change:**

- **A new file → the whole file, now.** It is small, it costs under a minute, and it is where the holes
  actually are.
- **An existing file changed by a few lines → those lines only.** Every serious mutation tool takes a
  line range (Stryker: `--mutate "path/file.js:147-160"`). Not an optimisation detail: a run scoped to
  your own hunk answers the only question you have, and answers it while the code is still in your head.
- **A release cut → one full pass** over everything the release touched, incrementally if the tool
  supports it (Stryker: `--incremental`). This is the toll you pay once, deliberately, on code that has
  stopped moving.
- **Never re-measure a large file you did not change**, and never re-measure one you changed cosmetically.

> **Measured, on a real release** (Kenjaku, 2026-08-21, one iteration): the two brand-new modules cost
> ~40 s and ~1 min and **found two real defects** in a hand-written regex. The two large pre-existing
> files cost **~7 minutes each**: one found a single real defect (a dropped list separator, in the three
> lines just written), the other returned a survivor list **byte-identical to the previous run** — seven
> minutes for zero information. Re-run scoped to the changed hunk, the same defect was caught in
> **44 seconds instead of 7 minutes**, 17 mutants instead of 396.

**The corollary that removes a whole class of confusion:** a whole-file run makes the score move for
reasons that are not yours (one more equivalent mutant over a larger denominator reads as a regression),
so you end up diffing survivor lists to prove you broke nothing. **On a hunk-scoped run, every survivor
is yours.** There is nothing to attribute and no score to explain away.

⚠️ **What this rule does NOT license: deferring everything to the end.** A hole found at the release tail
is repaired in a file you have stopped holding in your head, by someone reconstructing an intent from a
diff. The point is not "measure later", it is "measure **less surface, immediately**".

The acceptance layer stays **outside-in and first**, in every mode.

## Classic TDD (baby-steps + triangulation) — a tool, and an open question

**The mode.** One test at a time, complete red→green→refactor before the next test, and
**triangulation**: introduce generalization only when a **second** example demands it. The first test
may be satisfied by a hardcoded answer; the second, different, forces the real logic out. Generality
is discovered, not decreed.

**When to reach for it.** Two situations, and they do not have the same standing:

- **When you want the step-by-step narrative** (a reviewer following along, a teaching context,
  pairing). This one needs no evidence: it is a **communication** value, not a quality claim, and it
  stands on that ground alone.
- **When the design is genuinely unknown** — an algorithm, a protocol, something you cannot state in
  one paragraph. ⚠️ **This is an OPEN QUESTION, not an established rule, and it must not be quoted as
  one.** Nothing measures it: the release that produced the table above had a design that fit in a
  single head, so it says nothing about this case. Worse, the clause exempts **exactly** the region
  where no measurement exists — which is how a rule escapes falsification — and its trigger ("the
  design is unknown") is **self-assessed by whoever applies it**.
  **What would settle it**: at the next genuinely unknown design, run it in strict baby-steps and
  compare the **first-pass** mutation score against the numbers above. Until then, treat it as a
  reasonable default inherited from the literature, and say so when you invoke it.

> **Triangulation itself is not demoted.** What lost its standing is triangulation as a *design
> discovery* move. As a way of *pinning behaviour* it is mandatory in every mode — see reflex 3 below,
> which is the same technique applied to bounds and operators.

## Every entry point is tested by running it for real

A module's exported functions can be green while the **file** does nothing. Import-based tests never
execute the composition root, so the wiring — the argument parsing, the entry guard, the process exit
code, the path resolution — is judged by nothing.

**So: every executable entry point gets at least one test that runs it as a process** (spawn the real
command, assert the observable effect and the exit code), not one that imports its functions.

> Earned, not theorised (Kenjaku v4.9.1): the CLI wiring of `/switch` sat at a **25 %** mutation score
> while everything it called was at 92 %+, because no test imported it. The subprocess test that closed
> it immediately found a defect no in-process test could see: a brain reached through a **symlinked
> path** ran the switch **without persisting it** — a silent no-op on the exact promise the release
> existed to keep. The file went to **100 %**.

## Assert on behavior, never on display strings

Assertions (and test setups) must **not depend on the text** of an error message, a log or a console
output (e.g. `assert(!/PUSH FAILED/.test(stdout))`).

- **Why**: a message changes for a thousand reasons (refactor, i18n, punctuation) without the behavior
  moving → the test breaks wrongly, or worse passes wrongly. **The message is not the contract.**
- **In practice**: assert on the **real observable state/behavior**. Examples: for "the auto-commit
  hook did not push", verify that a bare repo serving as remote **received no commit**
  (`git --git-dir … rev-list --count HEAD`) rather than the absence of a failure message; for a
  decision, test a **pure function** that returns data rather than the script's log.

> **This does not contradict rule 1 below.** *What* you assert is the observable state, never the
> prose. But *when* you do assert an exception, pin it down: a bare `throws` accepts any failure,
> including one your code should never produce. Same for a **user-facing warning whose absence is the
> defect**: there, the whole text is the contract, and it is pinned whole — a message asserted by
> fragments can be half-blanked with the suite still green.

## Assertion quality — lessons from mutation testing

A mutation audit (2026-07, three packages) showed that **green** tests were letting mutants survive:
the behavior was "covered" but the **assertions were too loose**. Six reflexes, to apply
systematically, each of which would have **prevented** the survivor:

1. **Assert the message, not the mere fact.** `throws`/`rejects` **always** with a matcher (regex or
   type), never bare; an `ok` result with its body; a log with its exact payload. A bare
   `assert.throws(() => f())` survives a `throw ''`: the 2nd argument **is not optional**.
2. **Assert the whole object / the whole sequence, not one field.** `deepEqual` on the **complete**
   returned object and on the **complete** call list (arguments included). Checking a single field
   leaves the mutants on every other field alive.
3. **Triangulate the bounds AND the operators.** Add the case **on the boundary** (the equality value)
   to tell `>` from `>=`, the case **just outside**, and for an operator an **asymmetric discriminator**
   (`a·b ≠ b·a`, contains-but-not-a-segment, `#` mid-line vs at the start). A one-sided example
   distinguishes neither `>`/`>=`, nor `&&`/`||`, nor the regex anchors `^`/`$`.
4. **Feed the absent/null case next to the present one.** For every `?.`, `??`, default argument, or
   `&&`/`||` short-circuit: write the **twin** test with the null/absent/omitted input. The happy path
   alone leaves the absence branch alive. (The audit's most frequent cluster.)
5. **Collections with ≥2 elements, unsorted, with a decoy.** `some`/`every`/`find`/sorting/`length`
   are **indistinguishable** on 0-1 element or on an already-sorted list. Two deliberately unsorted
   elements plus one out-of-scope intruder make the mutants diverge (and catch the off-by-last).
6. **A branch the tests cannot reach is a design defect, not an exemption.** If a test **cannot**
   reach a branch (logic behind I/O, a non-exported function, a top-level side-effect script, a
   composition root), extract a **pure seam** / inject a **port** / **name** every wiring factory until
   every branch is reachable. This is the #1 driver of 0 % scores. "Pure glue, not testable" is never
   an excuse — it is the diagnosis.

A **second audit** (2026-07-27, four files of a single increment) showed that those six reflexes,
already engraved, were not enough. Four more shapes, named by none of the six:

7. **A fixture must NEVER be produced by the code it tests.** A fixture serialized with the **same
   function** as production makes the assertion tautological: "do not rewrite this file" and "rewrite
   it identically" become indistinguishable, the test is green and proves nothing. Build the fixture
   **some other way** (different indentation, no trailing newline, the shape a human would leave by
   hand) so the claim becomes **refutable**.
8. **A double's return value must be a fingerprint.** A stub returning `0`, `""` or `[]` returns
   exactly what a real implementation would return in the nominal case: nothing then proves the
   wiring (the code could call the real component, or call it with no argument, and everything would
   stay green). Return a value **no real implementation would produce**, and **record the arguments
   received**.
9. **A condition with N reasons needs N tests, one per reason ALONE.** If every fixture triggers two
   terms at once, no term is ever the sole cause: you can delete one and the suite stays green.
   Distinct from operator triangulation (§3): there, every operator can be right and the coverage
   still lie.
10. **A platform-conditioned transformation must be a named pure function, fed data from the OTHER
    platform.** Inlined, it is a no-op on the CI platform: no test can tell it apart from the
    identity, and the regression only shows up on users' machines. "Not testable here" means "to be
    extracted", never "to be skipped".

> **Verifying a mutant is not reasoning about it.** Apply the mutant **by hand** to the full suite (a
> few seconds) before AND after writing the test: that is how the second audit caught a mutant filed
> as "killed" which was in fact the **other branch** of the same ternary, still alive because the
> assertion said `.includes(…)` instead of naming the whole list (§2).

> **Simplify the production code rather than excusing the mutant.** Before filing a survivor as
> "equivalent", ask whether it is pointing at **code that cannot change anything** (a redundant guard,
> a `?? {}` in front of an object spread that already tolerates `undefined`, a bound already
> guaranteed by the indexing). Deleting it says the same thing in less code, and the mutant goes with
> it. The counter-case is real too: an optional chain whose `catch` already returns the same value is
> an **equivalent worth keeping**, because deleting it would send a normal input through an exception
> path. Record which one you decided, and why.
>
> **A hardening claim names the FILES measured, never a glob.** "`scripts/**` is hardened" made
> **never-measured** code pass for covered code for two weeks, and actively discouraged re-checking
> it. A false "done" costs more than a known hole.
>
> **The score follows WHEN the tests were written, not the size of the steps.** In the second audit,
> a core written test-first scored 87 % while the **composition glue written afterwards**, around an
> already-green core, scored 51 %. That gap is **test-first versus test-after** — it was long quoted as
> evidence for one-test-at-a-time, which it never was. What it really says is §6 one level up: a
> composition root gets its seam **when it is written**, not when it is audited. A **design** habit,
> not an assertion habit, which is exactly why knowing the rules is not enough.
>
> **The objective signal is the mutation score, not line coverage.** Know also **not to chase
> equivalents** (mutants indistinguishable from the original code: the default wiring of an injected
> port, a `?? []` that recollapses into a string after `.map().join('')`, a greedy regex masked by a
> downstream `.trim()`, real-SDK construction observable only over the network) — and to distrust the
> **run** before believing its number, which is the whole of the next section.

## A mutation run LIES to you — audit the run before reading the score

Everything above is judged by a mutation score, which makes the run itself the one measurement nobody
audits. **Five ways a run hands you a number that measures nothing.** Each one cost a real run; none
is tool- or language-specific, and none of them looks like a failure while it happens — that is the
point.

1. **A stale report, read as this pass's result.** The command died before writing anything, and the
   report file from the **previous** pass is still exactly where it was. You read a number that
   describes code you have since changed. → Prove the report was produced *by this run* before reading
   it: delete it first, or compare its timestamp against the run's start. Never both trust a file and
   let something else be responsible for refreshing it.
2. **A suite that silently skips in the run environment.** A dependency missing under the runner, a
   guard that self-disables outside the normal harness, a filter that matches nothing: the mutants
   face **a judge that judges nothing**, and a score is printed on top of it. → Pin the number of
   tests **actually executed** inside the mutation run against the number a normal run executes. A
   mutation run whose test count you did not check is not a measurement.
3. **A run killed mid-way.** No table is produced, and the *absence* of a score gets read as a zero,
   or — worse, via trap 1 — as the previous number. → An interrupted run has **no score**. Report "no
   result" and why; never a number, not even a pessimistic one.
4. **A suite that really touches the disk, run in place.** Mutants exist to make destructive paths
   fire, so a suite that writes for real, run over your **working tree** instead of a throwaway
   checkout, destroys for real — silently, while you watch a progress bar. → Mutate a disposable copy,
   never the tree you are working in, and make every writing test write inside a temp directory it
   created itself.
5. **False timeouts from CPU oversubscription.** A timed-out mutant is scored as killed, so a
   saturated machine **inflates** the score, and inflates it more the slower the machine is. → Cap
   concurrency so the machine is not oversubscribed, and re-run any file whose timeout count moves
   between two runs: a score that depends on the load is not a property of the tests.

> **Why this section exists, in one sentence**: *the worst failure of a measuring tool is not being
> wrong, it is being **confidently precise about nothing**.* A number that is obviously wrong gets
> argued with; a precise number nobody suspects gets **built on**.

### Triage a survivor before writing a test for it

A first-pass survivor belongs to one of three families, and **only the third is about missing tests**:

- **an adapter or composition layer judged by nothing** — the answer is a **seam** (reflex 6), not an
  assertion. Writing an assertion here produces a test that is green for the wrong reason and leaves
  the hole exactly where it was;
- **a double that ignores its arguments** — the test exists and would stay green against a component
  called with nothing at all. The answer is the **double** (reflex 8), not another test;
- **a genuinely missing case** — the only family where "write the test" is the answer (reflexes 1–5,
  7, 9, 10).

The three reflexes are each engraved above; what is easy to skip is **asking which family you are in
first**. Do that before writing a line.

### When the operating recipe keeps costing you, it becomes a command

This file's own doctrine, applied to measurement: a rule breached repeatedly earns a **dumber, more
reliable carrier**, not a better-worded paragraph. The five traps are all *operating* errors — none of
them is fixed by knowing about them, because each one strikes precisely when attention is elsewhere.
So the endpoint of this section is not the section: it is **a command that refuses to report what it
did not measure**, one that fails loudly instead of printing a number when the report is stale, the
suite skipped, or the run dead.

> Earned, not theorised (Kenjaku, 2026-08-20): that runner was built after the traps had been paid for
> individually, and its first act was to measure **itself**. The implementation is project-specific and
> stays in that repo, with the operational half of the recipe. What travels is the move: **once the
> same operating trap has bitten you twice, stop writing it down and make it unrepresentable.**

## Scope

This discipline **holds for all languages** and all types of code: small libs, simple tools, helpers,
isolated algorithms, services and applications alike. It is the non-negotiable foundation, and it
governs **every** line of production code, the glue and the entry points included — never only the
"interesting" core.

**Specialized variants presuppose it and never contradict it.** For back-ends, APIs, workers and
services (notably with The Hive), the `outside-in-diamond-tdd` skill specializes it: coarse-grained
acceptance tests driven by the left-hand adapter, a Builder returning the Domain Service, In-Proc
Adapters inside the perimeter. Per-language conventions (e.g. the .NET stack: xUnit, NFluent,
NSubstitute, Diverse) sit on top of it in the same way.
