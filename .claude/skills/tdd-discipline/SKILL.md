---
name: tdd-discipline
description: "⛔ SUPERSEDED — DO NOT LOAD, DO NOT FOLLOW. Replaced by the `test-first-discipline` skill (2026-08-15). This file is kept ONLY so the update regime can retire it from already-deployed brains; it is not the discipline any more."
version: 1.1.0
origin: use-case-driven-harness
---

# ⛔ SUPERSEDED — see `test-first-discipline`

> **Do not follow this file.** It was replaced on **2026-08-15** by the **`test-first-discipline`**
> skill, after its opening rule (*one test at a time, never a test-first batch*) was measured on
> Kenjaku v4.9.1 and did not survive. It is kept in the tree for ONE reason: the update regime cannot
> retire a skill it already delivered (`refreshUntouchedSkills` only walks skills present in the
> source), so the release that unfreezes the engine must remove it from deployed brains explicitly.
> That step is `S6` of `maintainers/plans/prospective/update-regime-owns-what-it-shipped-action.md`.
> Everything worth keeping here was carried over verbatim into the new skill.

# TDD discipline (universal, superseded)

> Skill vendored from the `use-case-driven-harness` harness (**manual** re-sync, last done
> **2026-07-27**). Deliberately reduced to the **universal foundation**: the specialized variants
> (back-end architecture, per-language conventions) live in the source harness, outside the scope of
> this generator. **Date this line at every re-sync** — the drift is invisible otherwise, which is
> exactly how the mutation-testing lessons below sat in the source harness while this copy stayed
> two days behind.

The core TDD discipline, **language-agnostic**, which applies to **every type of code**:
small libs, simple tools, helpers, isolated algorithms as well as services and applications.
In this repo, it governs **all the code** without exception: the RAG engine (`rag/`) **as well as**
the install harness (`installer.mjs` and its helpers `scripts/lib/*.mjs`) — all tested via
`node --test`. Not just the engine.

## Baby steps, NOT test-first batch

**One test at a time.** Cycle 🔴 red → 🟢 green → ♻️ refactor **complete for each test**, before writing the next test.

- **Forbidden**: writing several tests ahead then implementing to make them all pass. That's *test-first batch*, not TDD.
- **Why**: writing tests in a batch freezes the design upfront (the API is decreed before a single line of implementation) and **kills emergent design**. In baby steps, each test pulls the strict minimum of code and the structure is discovered increment by increment.
- **In practice**: test 1 → red → smallest code that passes → refactor → test 2 → red → … Each step is the smallest one that makes the current test pass.
- **Refactor is never optional.** The step is only *done* after the ♻️. It applies **first to the implementation code**: better structure, same behaviors — a refactor **never changes the public contract** (that's its definition: behavior-preserving). On the tests, it is limited to making them **more readable** (names, helpers, intent) — **never** to weakening their assertions or making them check fewer things. If a test covers poorly, that's a *new* test, not a refactor. Even with nothing to clean up, you consciously go through the step and note it ("refactor: nothing to do"). Skipping the refactor "because it works" accumulates debt at every cycle — which is exactly what the baby-steps discipline is meant to prevent.

## Make sure the test fails first (fail-first)

Before writing a single line of implementation, **verify that the new test fails
for the right reason** (unsatisfied assertion, not an accidental compilation error
or a test that does not even run). A test that passes before you've coded proves nothing:
you have to see it 🔴 *red* first, then make it 🟢 *green*. That's the guarantee that the test
actually tests something.

## Triangulation

When the expected behavior is not obvious, you **triangulate**: you introduce
generalization in the implementation only when **at least two examples** (two tests)
demand it. The first test can be satisfied by a "hardcoded" answer; the second,
different, forces the real logic out. This avoids over-generalizing too early — generality
emerges from the examples, it is not decreed.

## Assert on behavior, never on display strings

Assertions (and test setups) must **not depend on the text** of an error
message, a log or a console output (e.g. `assert(!/PUSH ÉCHOUÉ/.test(stdout))`).

- **Why**: a message changes for a thousand reasons (refactor, i18n, punctuation) without the
  behavior moving → the test breaks wrongly, or worse passes wrongly. **The message is not the
  contract.**
- **In practice**: assert on the **real observable state/behavior**. Examples: for "the
  auto-commit hook did not push", verify that a bare repo serving as remote **received no
  commit** (`git --git-dir … rev-list --count HEAD`) rather than the absence of a failure message;
  for a decision, test a **pure function** that returns data rather than the script's log.

> **This does not contradict rule 1 below.** *What* you assert is the observable state, never the
> prose. But *when* you do assert an exception, pin it down: a bare `throws` accepts any failure,
> including one your code should never produce.

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
3. **Triangulate the bounds AND the operators.** (a direct extension of triangulation above) Add the
   case **on the boundary** (the equality value) to tell `>` from `>=`, the case **just outside**, and
   for an operator an **asymmetric discriminator** (`a·b ≠ b·a`, contains-but-not-a-segment, `#`
   mid-line vs at the start). A one-sided example distinguishes neither `>`/`>=`, nor `&&`/`||`, nor
   the regex anchors `^`/`$`.
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
> guaranteed by the indexing). Deleting it says the same thing in less code, and the mutant goes with it.
>
> **A hardening claim names the FILES measured, never a glob.** "`scripts/**` is hardened" made
> **never-measured** code pass for covered code for two weeks, and actively discouraged re-checking
> it. A false "done" costs more than a known hole.
>
> **The score follows how the code was written, not whether tests exist.** In the second audit, the
> core written in baby-steps scored 87 %, while the **composition glue written afterwards** around an
> already-green core scored 51 %. A composition root gets its seam **when it is written**, not when it
> is audited (§6): it is a **design** habit, not an assertion habit, which is exactly why knowing the
> rules is not enough.
>
> **The objective signal is the mutation score, not line coverage** (a suite can cover 100 % of the
> lines and kill 0 % of the mutants). Know also **not to chase equivalents** (mutants indistinguishable
> from the original code: the default wiring of an injected port, a `?? []` that recollapses into a
> string after `.map().join('')`, a greedy regex masked by a downstream `.trim()`, real-SDK
> construction observable only over the network) and to **distrust false timeouts**, which inflate the
> score artificially (cap `concurrency`/`timeout` before believing a run).

## Scope

This discipline **holds for all languages** and all types of code. It's the
non-negotiable foundation. The specialized variants (by framework, by language, by architecture style)
**presuppose** it without ever contradicting it.
