<!-- DRAFT, written 2026-08-05 while the owner was away. NOT published, no tag, no PR.
     Before it ships: (1) the owner reads it, (2) the CI claim at the bottom is checked against the
     commit actually being tagged — it is written in the past tense and is not true yet, (3) this
     comment and the `.draft` in the filename go away, and the file moves to `plans/archived/`. -->

# v4.7.0 — The One Where It Admits It's Behind

**Your brain stops answering as if it were up to date when it isn't.** When newer code has landed but the
conversation you are in still runs the old one, it says so. When notes are waiting to be indexed, it says
*which kind* of waiting — and the ordinary kind is now caught up on the spot instead of being promised for
next time.

### What you get

- 🛑 **It tells you when it is running yesterday's engine.** A conversation loads its wiring once, when it
  opens. So if an update lands while you are working — typically when you open your brain on a **second
  machine** and it pulls the version you installed on the first — everything you asked afterwards was
  answered by the *old* code, silently, for the whole session. Your brain now says so, and keeps saying so
  until you close and reopen. It works in the terminal **and** in the Desktop app, which had no such cue at
  all.
- ⏳ **"A few notes pending" now says what kind of pending.** One sentence used to cover five very different
  situations — and it always promised the same happy ending. Now they are told apart: notes your brain
  **refused** (a header it cannot read: those need a fix and will never resolve themselves), a **daily
  quota** reached (that one really does resume on its own), an indexing run **still going** as you read,
  notes that simply **arrived** after the last look, and a catch-up that has already **tried and failed**.
- ⚡ **And the ordinary case is fixed right away.** Notes that just arrived used to be promised a catch-up
  "next session" while nothing was actually scheduled. They are now indexed **on the spot** — when your
  brain starts, and again the moment you ask about the state of your index.
- 🌌 **`/universe` and `/univers` now work.** The command that switches between your spheres is called
  `/switch`, so typing the noun — in English or in French — answered *"unknown command"*. Both now take you
  straight there.

### What you have to do

Ask for **`/update-engine`** once, then restart your session if it says so.

**This release does not re-read your notes** — nothing to wait for, nothing in your vault is modified.

---

### Under the hood

- **Both defects are the same one, on two clocks.** A session start is a race between what arrives and what
  reads it. The engine's own code, and your notes, can both land *after* the moment that decided what to
  say about them — and in both cases what got printed was the reassuring version. The fix is the same shape
  twice: read the state that actually exists at the moment of speaking, and separate the cases the old
  sentence had merged.
- **The stale-engine detection reuses evidence that was already computed and thrown away.** Your brain
  pulls at session start and counted the files it received, only to discard the list. That list is exactly
  the evidence needed: it now names which of those files a session freezes at start — hooks, skills,
  settings, the constitution, both local servers, the version stamp — and arms the existing restart nudge
  when any of them moved. A pull that brought only notes stays silent, because notes need no restart. A
  brain with no remote pulls nothing and is silent by construction, which is pinned by a test rather than
  left to the reader.
- **The nudge injects, it never blocks.** It rides the one channel that reaches Desktop and repeats on
  every message. That channel *can* refuse a message outright; it deliberately does not. A wrong verdict
  must cost you one sentence, never lock you out of your own brain.
- **It does not mention privacy, on purpose.** A session that already printed something it should not have
  is not un-printed by a restart, so naming that case would buy you nothing you can act on. The wording
  stays the general one.
- **The shortfall model reads the same record the banner reads**, not a second opinion — one source, five
  outcomes. The fifth state was found by an *existing* test rather than by design: it asserted the old
  sentence for a run that was still going, which under the new model would have said "they arrived after
  the last scan" about work being done as you read it. A run in flight is the one wait nobody needs to be
  told about.
- **The catch-up is asked for where the promise is made.** Both at startup and at the moment you ask about
  the index — because that line now says "catching up now", and a sentence like that has to be true where
  it is printed, or it is the old promise in newer words.
- **The two new commands explain nothing.** They point at `/switch` and stop there. An engine update never
  removes a skill from your brain, so a second copy of the rules would outlive any later correction — one
  page of rules, two doors onto it.
- **Dependencies: two known advisories closed, ours rather than a drive-by.** Two outside pull requests
  proposed pinning a vulnerable transitive dependency each; both were applied to a throwaway copy and
  re-audited, and **neither actually closed its advisory** — they missed that the search engine pulls the
  same package through a second path. Ours pins both, in both packages: 12 → 9 and 6 → 5 reported
  vulnerabilities. The rest of the audit (a native image library with no fix available, among others) is
  named rather than quietly left, and is its own pass.

### Measured, not asserted

The four files this release wrote in the harness went through a mutation pass — code deliberately broken to
check the tests notice. The first run scored **83.33 %**, and the reason was worth the trip: the
"if anything goes wrong, stay quiet" fallback was written **twice** in the same function, so each copy
silently covered for the other and **neither could be shown to work**. Stated once, it became testable.
Two whole cases were missing besides. After the fixes: **97.56 %**, two of the four files at 100 %, and the
two surviving mutants are the documented kind that no honest test can kill.

The search-engine side scored **94.44 %** first pass and **100 %** after its nine survivors were closed —
one of them by deleting a condition that read as two reasons while only ever meaning one thing.

A published release is frozen, so these numbers stay true for this tag forever. Full detail:
[`maintainers/mutation/RESULTS.md`](maintainers/mutation/RESULTS.md).

### CI

The full matrix — Node 22, 24 and 26 on macOS and Windows, plus the Windows install end-to-end — green on
the commit being tagged, checked against that commit rather than against the colour of a page.
