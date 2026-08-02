# v4.4.0 — The One Where It Saves What You Wrote Elsewhere

> **Draft of the GitHub release note** (CONVENTIONS §11), kept in the repo so it survives a `/clear`.
> Publish with `gh release create v4.4.0 --title "v4.4.0 — The One Where It Saves What You Wrote
> Elsewhere" --notes-file maintainers/plans/prospective/release-v4.4.0-note.md` — **minus this
> quote block**, which is maintainer-only. Title picked by Thomas, 2026-08-02.

**Your brain now saves what you write outside a conversation.** A note typed straight into Obsidian, one
deleted from a terminal, one written by your brain's own scripts: all of it is kept and synced like the
rest, instead of waiting for the next time you happen to open Claude. And it takes up less of your
screen while doing it — your own status line is yours again, and the first thing you see when a session
opens is written for you, not for the machine.

### What you get

- ✍️ **Nothing you write is left behind, wherever you write it.** Notes typed in Obsidian, deleted from
  a terminal, or written by your brain itself are now saved on their own. They are **searchable within
  seconds**, and **committed once your vault has been still for about two minutes** — ten at the very
  outside if you never pause.
- 🖥️ **Your own status line is back.** If you had configured one, your brain no longer takes its place.
- 👋 **The first screen speaks to you, not to the machine.** Shorter, in your language, and it explains
  itself only when you say yes.
- 📄 **Tidying up a page can no longer damage it.** `/consolidate` used to be able to leave a page in a
  state the search engine could not read — quietly. It rewrites the page properly now, and refuses
  rather than guesses.
- 🔎 **A note your brain cannot read is now reported, not passed over in silence.** If something did not
  make it into the index, the count you are shown says so, instead of answering as if it had.
- 🧩 **Three smaller ones**: `/rag` now answers instead of pointing at an unrelated command; when your
  brain pre-fills your profile it reads the notes **you** wrote about the people around you; and updates
  keep reaching you even if the project is ever renamed again.

### What you have to do

Ask for **`/update-engine`** once, then restart your session if it tells you to.

**This release does not re-read your notes** — nothing to wait for, and nothing in your vault is
modified.

---

### Under the hood

- **Indexing was file-driven, committing was tool-driven.** The auto-commit hook fires on `Write|Edit`,
  i.e. only after *Claude* writes a file, so three classes of writer were missed: the engine's own
  scripts, a note typed in Obsidian, and a note removed with `rm`. The index then ran **ahead of git** —
  the brain would find and cite a note that existed on no remote and on no other machine. The end of an
  indexing campaign that actually changed something now commits (and pushes), so the invariant is
  `git ≥ index`. Index-ahead-of-git is the serious direction; git-ahead-of-index, after a pull, was
  already repaired at session start.
- **Two windows on purpose, not one.** Search freshness and durability stopped being the same promise:
  indexing keeps its 5 s debounce, while persistence gets its own scheduler — **2 minutes of quiet, with
  a 10-minute cap** since the first write not yet saved. Writing every 30 seconds therefore commits
  **nothing** until you stop, and 30 minutes of unbroken typing yields **3** commits — one per cap,
  never one per pause. Both numbers are pinned by tests on a virtual clock. Moving a
  pane in Obsidian fires nothing at all: the watcher ignores `.obsidian`. **ADR 0037** was amended in
  place to own that timer against ADR 0009 rather than dodge it — the writers this serves emit no event,
  so a timer is not a stand-in for a better mechanism, it *is* the mechanism.
- **The status line is a retreat, and it had to remove a key to be one.** Claude Desktop renders no
  status line at all, so ours was a CLI-only surface that delivered nothing to the readers it was built
  for while evicting the line of the people most likely to have configured one. Making our script print
  nothing would not have helped — `statusLine` is a single value, not a merged list, so the owner would
  have got a **blank** line. The reconciler now removes the key, and **only the one we installed**:
  matched on provenance, so a hand-customized line is preserved untouched. That makes the reconciler's
  write additive **plus exactly one nominative removal**, which is written into **ADR 0036** and into
  the README's guardrails. `scripts/status-line.mjs` is kept as a documented opt-in.
- **The first screen was eight lines of agent protocol**, echoed verbatim to the reader, in English, on
  a product sold to non-developers. Progressive disclosure: the trigger now carries the **fact** only,
  and the detail loads with the skill at the moment you accept. Four emitters shrunk (an audit found one
  the field report had missed), 590 characters where there were roughly a thousand, with the bound
  pinned by a test in each emitter.
- **The consolidation chain, four defects deep.** Consolidation appended a **second `updated:` key** to
  a page, which made its YAML invalid, which made every later re-read of that page fail, which was then
  swallowed — so the note stayed searchable and confidently out of date. The writer is now a
  deterministic script (`scripts/refresh-note.mjs`) that rewrites front-matter **by key** and refuses
  rather than guesses: a page that does not exist, a path escaping the vault, a file with no
  front-matter, a page already damaged. And the reader half — the parser — reports what it cannot read.
- **The silence itself was the bug.** `reporter.start()` reset the error list and ran after phase 1, so
  phase-1 read errors reached `last-run.json`, `last-run.md` and `vault_stats` — everything you and the
  agent can see — as **zero**. Seeded now, with an arithmetic invariant (`unaccountedNotes`) that runs on
  every completed run and fails **loudly** on the line everyone reads.
- **A brain installed before the rename cloned the old repository forever.** The install stamped
  `source.repo` once and only the *ref* was ever refreshed. The launcher now declares its own
  `canonicalRepo` and updates carry it through, keeping the recorded URL when an older launcher declares
  none — so this can never blank a working source.
- **`/rag` is a thin skill that routes** to `vault_stats` / `health_check` / `reindex` and derives
  nothing itself: a figure it computed would be a second source of truth, free to drift. `/status` stays
  Claude Code's own; `/index` and `/reindex` route here by description rather than by name.
- **The profile pre-fill now reads the structured source** — notes with `type: person` scoped to your
  universe — instead of synthesising from whatever a similarity search surfaced. It had proposed a
  wrong CTO in the same confident voice as five correct answers, while the right one sat in a note
  tagged `cto` in the vault.
- **A `/code-review` ran before the merge and raised six findings; all six are fixed**, each reproduced
  on disk first and killed with a failing test, one commit each — the guarantees above are the ones that
  actually ship. The most useful of them was a guard that failed **open** on the launcher, and a log line
  that said `persisted` without ever reading git's verdict: in a repo whose rule is *don't pretend*, the
  log pretended.
- **CI 7/7** on this tag: Node 22/24/26 on macOS and Windows, plus the Windows installer end-to-end.

### Mutation-score snapshot, pinned to v4.4.0

| Package | Mutation score | Measured |
| --- | --- | --- |
| **rag** | **90.42 %** | 2026-07-16 re-audit, package-level. The **10 files this release changed** were re-measured on this tag: **93.93 %**, with the two files it *adds* at **100 %** (`persistence-scheduler.ts` was the weakest of the ten at 76.32 % before hardening) |
| **scripts** (harness) | **97.27 %** | 2026-06-23 baseline. The **16 files this release changed** were measured one by one — `auto-commit.mjs` 98.31 %, `update-engine.mjs` 96.94 %, `reconcile-brain.mjs` 95.93 %, `note-refresh.mjs` 98.68 % — **and two scored 0 %**, see below |
| **local-mirror** | **90.44 %** | v4.2.0 re-audit, untouched by this release and deliberately not re-measured |

**The honest bound, and it is not a regression.** `session-status.mjs` and `status-line.mjs` score
**0 %**: 250 mutants, none killed. They are top-level scripts that run on import, so no test can observe
them — verified, not assumed: neither has ever had a test file in this repo's history. The **logic** they
wire is fully covered (it lives in `scripts/lib/**`, at 100 %); the **wiring** is not. This release
rewrote parts of both **without creating the hole** — every published tag so far carries it — and the
cure our own conventions prescribe is a refactor of two fleet-deployed scripts, which is a release of its
own rather than something to do on the eve of a tag. Recorded as **named debt**, so the next tag inherits
a named one rather than a silent one.

Three of the surviving mutants turned out to be **live defects**, not merely unwatched lines: a page
whose body contained a `---` rule had half of it swallowed into its metadata; a note written on Windows
(CRLF, which is what Obsidian writes there) was refused as having no front-matter; and the duplicate-key
check called a perfectly valid page damaged. All three are fixed, each with the mutant watched red
first — none of them had ever shipped.

A published release is frozen, so these numbers stay true for this tag forever. Full detail:
[`maintainers/mutation/RESULTS.md`](maintainers/mutation/RESULTS.md).
