---
name: test-first-discipline
description: "How to test, language-agnostic, for ALL code (libs, tools, helpers, algos, services): tests before code and fail-first are non-negotiable, and the mutation score is the judge, not the ritual. Default mode is design-first then test-first in small batches; classic TDD baby-steps + triangulation stay available as a tool. Also carries assertion quality (the mutation-testing lessons) and the entry-point seam rule. To load as soon as you write or modify code."
version: 2.0.0
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
5. **Measure.** New production file → it gets its mutation run **the day it is written**, not at the
   release tail (a file measured late is a file whose survivors are found by users).

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
> downstream `.trim()`, real-SDK construction observable only over the network) and to **distrust false
> timeouts**, which inflate the score artificially (cap `concurrency`/`timeout` before believing a run).

## Scope

This strategy **holds for all languages** and all types of code: small libs, tools, helpers, isolated
algorithms, services and applications alike. In this repo it governs **all the code** without
exception — the RAG engine (`rag/`) **as well as** the install harness (`installer.mjs` and its
helpers `scripts/lib/*.mjs`), all tested via `node --test`. Specialized variants (by framework, by
language, by architecture style — e.g. the outside-in acceptance style for back-ends) **presuppose**
it and never contradict it.
