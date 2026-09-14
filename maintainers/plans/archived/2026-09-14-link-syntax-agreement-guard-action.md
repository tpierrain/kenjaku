<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- STATUS: ✅ DONE — merged into main on 2026-09-14 as `516de5b` (PR #125).        -->
<!-- Archived history: nothing here is live, and no session resumes from this file.  -->
<!-- The way in stays plans/ACTIVE.md. Opened 2026-09-14 straight after v5.5.1, at   -->
<!-- the owner's ask: build the net that would have caught #121 on its first day.    -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Action plan — the two files that both decide what a link is must agree, and a test says so

## 📍 STATE — closed 2026-09-14 · nothing here is perishable any more

- **Delivered**, merged as [PR #125](https://github.com/tpierrain/kenjaku/pull/125) / `516de5b`,
  green on the whole matrix (macOS and Windows × Node 22/24/26, Windows installer end-to-end).
- It **needed no production change**: the only non-test edits are the two comments of S2. It carries
  no release of its own and ships with the next one.
- **Decided in conversation (2026-09-14):** do it now rather than file it, "tant que le sujet est
  chaud". The merge itself was the owner's call, given the same day.

## Tracking

- [x] **S1 — A test that fails when the two definitions of "a link" drift apart** _(2026-09-14)_
  - [x] S1.0 Decide where it lives: beside the guard (`declared-spellings.test.mjs`) or in a file of
        its own named for the agreement. It asserts across two modules, so its own file is likely.
        → **its own file**, `scripts/lib/link-syntax-agreement.test.mjs`: it imports from both
        modules, and the per-form cases the guard alone owns stay where they are.
  - [x] S1.1 The test, red first: take a body holding **one of each form `extractWikiLinks`
        recognises** — bare, `|alias`, `#heading`, the escaped `\|` of a table cell, and one inside
        code — run `applyDeclaredSpellings` over it with entries that match those targets, and assert
        `extractWikiLinks(before)` equals `extractWikiLinks(after)`. Red is proved by removing the
        `[[…]]` entry from `PROTECTED`, not by inventing a mutant.
        → **red for the right reason**: with the entry commented out, all four link forms came back
        as `aXiom-migration`, an address no note has.
  - [x] S1.2 Green, with no production change. → confirmed: the only edits outside the new test file
        are the two comments of S2.
  - [x] S1.3 **The in-code form carries its own assertion, and that was a finding of the writing.**
        `extractWikiLinks` drops links inside code, so for that one form the agreement is silent by
        construction: both sides see nothing, and a rewrite there would pass. It is asserted
        literally instead (the bytes survive), and the case is the one that stayed green under the
        red proof — as it should, since the code spans protect it, not the `[[…]]` entry.
- [x] **S2 — Say in the code WHY the test exists**, one short comment at each end (the guard's
      `PROTECTED`, and `extractWikiLinks`), naming the other side. The defect was two files holding
      two partial models of the same thing; the comment is what makes the pair visible from either.
      _(2026-09-14)_
- [x] **S3 — A green PR**, full matrix (it touches `scripts/`, so nothing is path-ignored).
      _(2026-09-14 · `c7293d5`)_ → [PR #125](https://github.com/tpierrain/kenjaku/pull/125), all
      checks pass on macOS and Windows across Node 22/24/26, installer end-to-end included. The
      Windows tripwire skipped, which is its normal answer when the harness files are untouched.
- [x] **S4 — Merge**, then archive this plan and clear the door. Owner's call, not a session's.
      _(2026-09-14 · `516de5b`, squashed onto `main`, branch deleted)_

## Why this test, and what it pays for — do NOT re-derive it after a `/clear`

Established on 2026-09-14 while shipping `v5.5.1`, by reading the history rather than recalling it:

- **The list of never-rewrite spans has not changed since the commit that created it** (`71bbbcf`,
  2026-09-12, issue #66). The hole was there from the first line: not a regression, an omission at
  birth.
- **It was written from Markdown's syntax, not from this product's own note format.** It protects
  `](target)` and `<autolink>`; it missed `[[…]]` — the one link syntax `CLAUDE.engine.md` **tells**
  notes to use (§ *Reference other notes with `[[relative/path/without-extension]]`*).
- **The tell is a copy.** `scripts/lib/wiki-lint.mjs` already held `extractWikiLinks`, a production
  function that knows `[[…]]` is a link, aliases, anchors and the escaped `\|` included — and whose
  `stripCode` carries the **same two regexes** (fenced and inline code) that `PROTECTED` respells.
  Two components, two partial models of "what is not prose", only one of them right.
- **Every net we own is blind to this class, by construction.** Tests assert the entries that exist;
  a mutation pass mutates the code that exists and can never demand a missing line; CI runs both.
  There is also **no design record** — no ADR, no plan — so the question *"is this list complete?"*
  had no place to be asked. The only surviving rationale is a code comment that reads like a complete
  answer.
- **So the net has to be an agreement between the two files, not another enumeration.** A test per
  protected span can only ever prove what someone already thought of. A test that says *the guard
  never changes what a note points at* fails the day either file learns a link form the other has
  not — which is the actual failure that shipped.
