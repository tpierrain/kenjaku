## v4.5.0 — The One Where Silence Stops Passing for Good News

One evening on a real deployed brain produced sixteen findings, each verified against this repo's code
before being written down. Six of them ship here, and they share one shape: **two opposite things were
rendered identically**, so nobody could tell them apart. A note waiting to be indexed looked like a note
that had failed forever. A note answering from content it was last indexed with looked like a fresh one.
"My search returned nothing" came out as "nobody decided". And a clone of your backup looked like a
working brain, which it was not.

**The user-facing note is the source of truth for what ships:**
[`maintainers/plans/prospective/release-v4.5.0-note.md`](maintainers/plans/prospective/release-v4.5.0-note.md).

### What is in it

- **The multi-machine path actually works.** `scripts/rehydrate.mjs` rebuilds, offline, the two files a
  clone cannot carry (they hold this machine's absolute paths), the launchers, the health canary and
  **both** dependency trees. It shares its substitution code with the installer, because two generators
  that substitute differently produce two different brains.
- **A note the indexer would refuse is refused at write time**, by a `PreToolUse` hook running the
  engine's own parser, composing the note an Edit *would* produce before judging it. Fail-open
  everywhere else.
- **Waiting and failing are told apart** on the session banner, and a **vault ↔ index crosscheck**
  (`scripts/verify-index.mjs` + a fourth health check) names notes the two disagree about — loudly only
  for damage no reindex will clear.
- **Claim discipline** on the four surfaces that assert things about colleagues: observed apart from
  inferred, a thread's resolution rather than the question that opened it, and no silence reported as a
  fact.
- **Opening a note** is one pure rule with three documents pinned to it; ADR 0027 amended in place.
- **The session start names the active sphere and where its page is**, body left in the vault.

### The one limit worth stating explicitly

Half of the multi-machine repair is *discovery*: the constitution teaches Claude to recognise an
unwired second machine and offer the command. The constitution is an **engine-managed file**, so that
half only reaches brains whose constitution was never customized — a brain that made it its own keeps
its own copy and will not learn about the command from an update. The command itself, the docs, the
guard and the health checks reach everyone. This is the known freeze trap, and closing it is its own
release.

### Verification

- **CI 7/7** on this branch: Node 22/24/26 × macOS + Windows, plus the Windows installer end-to-end.
- Mutation snapshot pinned in the release note and detailed in
  [`maintainers/mutation/RESULTS.md`](maintainers/mutation/RESULTS.md).
- Both suites green at every commit.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
