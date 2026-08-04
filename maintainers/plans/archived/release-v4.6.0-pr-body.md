## v4.6.0 — The One Where It Asks Which One You Mean

Second of the trilogy that came out of one evening on a real deployed brain. v4.5.0 stopped silence from
passing for good news; this one stops the vault from **poisoning itself**. The brain was writing *about
people* without ever reading what the vault already said about them — so a bare *"Jérémy"* became a
surname that exists nowhere, a fact confirmed two months earlier was republished as news, and a page was
created for a colleague who occurs exactly once in the whole vault: in her own title.

**The user-facing note is the source of truth for what ships:**
[`maintainers/plans/archived/release-v4.6.0-note.md`](release-v4.6.0-note.md).

### What is in it

- **The defect was an order the engine shipped.** `sync-sources` said, in the same breath, *"never a
  first name alone, `[[people/jane]]` is forbidden"* and *"create the backlinks even if the target page
  doesn't exist"*. An agent obeying both had two exits: drop the link, or invent the surname. It
  invented. The rule now states the action — *no full name, no link* — in the **producer** and in the
  second write-door, `/consolidate`, which handed its own sub-agents the same forbidding pair.
- **Resolve before writing, and ask the vault whether it is even new.** The novelty check is a third
  reconcile pass in the synthesis step, the only place that can run it: the sub-agents read external
  sources and never see the vault.
- **Repairing a link is not asserting a person exists.** `/lint`'s create-the-missing-note remedy keeps
  its topic case and stops at people; `/consolidate` says a mention count is a priority signal, never
  evidence.
- **Homonymy and confidence are deterministic refusals, not advice.** Both doors that create a
  `people/` card write through one script, so `scripts/file-back-note.mjs` refuses a new person whose
  first name the vault already holds until the spec says which one (naming the homonyms it found), and
  refuses one that does not say what its identity rests on. `/refresh-note` promotes a card later,
  rewriting the field and the visible block together through the builder's own renderer.
- **The engine says which version it is**, on both session-start channels — a label that had been
  computed since v3.0.0 (first commit `aaa0f64`) and rendered nowhere since v4.4.0, when the engine
  gave the status line back to its owner.

### Choices worth reviewing

- **Required, not optional, for confidence.** Left optional, an absent marker would come to mean
  *confirmed* — silence rendered as certainty, which is this trilogy's own defect shape.
- **One vocabulary.** ✅ observed / 🟡 derived or probable / 🔴 unverified is v4.5.0's scale, reused
  verbatim and pinned by the guard: a second scale here would be a second discipline.
- **Prose is never the only carrier.** Every rule that could be shipped as a check was: this release
  met the "a rule nothing executes" failure twice before adopting that stance.
- **Reach, checked rather than assumed.** `scripts/**` and `engine-skills/**` are in `replace`,
  `sync-sources` in `merge`, so the fleet gets every carrier on `/update-engine`; the constitution is
  in no regime and reaches new installs, which is why the skill carriers were written first.

### Verification

- **CI** on this branch: Node 22/24/26 × macOS + Windows, plus the Windows installer end-to-end.
- **Mutation pass on the eight production files this release changed**, per file rather than averaged.
  Its finding is worth the reviewer's minute: `scripts/lib/doc-section.mjs` — the slicer that decides
  what every doc guard reads — had **no test of its own**, and both "return the whole document" mutants
  survived. That silently turns every sliced guard back into the flat search it was extracted to
  replace. Fixed, 14/14 dead.
- Suites green at every commit; the marketing surface re-read per §10, with its verdict recorded in the
  plan (including the boring half: the boards were re-read and deliberately not re-rendered).
- **An independent review of this branch found six defects, and all six are fixed here**, each in TDD
  with the red verified first. Two of them were **guards that had stopped watching**, which is the more
  useful half: the identity guard iterated a hand-written list of four files that never included
  `/consolidate` — so the release's headline rule read green while the other write-door still ordered
  the invention — and the F5 startup-payload audit filtered on a literal `additionalContext:`, so an
  emitter that *assigns* the key was its invisible fifth. Both now derive what they watch from the repo.
  The other four: a vault-containment check a backslash path walked straight out of (reproduced against
  a real brain, and its class swept — one sibling fixed, one shown unreachable), a `$` sequence in
  free-form prose that spliced the old confidence block into the new one, and a missing blank line that
  made a section-wide rule render as one bullet's tail in EN only.
