# v4.5.0 — The One Where Silence Stops Passing for Good News

**Your brain now tells you when it did not find something — instead of letting that silence look like an
answer.** And the backup you have been making all along finally does what it promised: a clone on a new
machine becomes a working brain again, with one command.

### What you get

- 💻 **A new machine, a stolen laptop, a second computer: one command and your brain works there.**
  Copying your repository was never quite enough — a few files that only make sense on *your* machine
  were missing, and nothing rebuilt them. Now `node scripts/rehydrate.mjs` does, offline, in one step.
- 🔎 **A note your brain could not have searched is no longer written at all.** Before saving into your
  vault, it checks the note's header with the very engine that indexes it. A note that engine would
  refuse is stopped there, with the reason, instead of being saved and quietly never found again.
- ⏳ **"Still working on it" and "this failed" stopped looking alike.** The line you read at session
  start used to count a permanent failure as something still on its way. It now names the note and the
  cause, and says plainly that this one will not fix itself.
- 🕵️ **A note that answers from an old version of itself is now caught.** It is the quietest failure
  there is: the note is found, it answers, and the content is out of date. Ask *"check my index"* any
  time, and your brain also watches for it on its own.
- 🗣️ **"I found nothing" is no longer told to you as "nobody decided".** When a search comes up empty,
  your brain says where it looked and stops — and in what it writes about people and projects, what it
  *observed* is marked apart from what it *inferred*.
- 📖 **Opening a note lands in Obsidian**, when the note lives in your vault and Obsidian knows that
  vault. Anything else opens in your usual Markdown editor, as before.

### What you have to do

Ask for **`/update-engine`** once, then restart your session if it says so.

**This release does not re-read your notes** — nothing to wait for, nothing in your vault is modified.

Two small one-time clicks, both of the "and never again" kind:

- The **first time** you ask to open a note in Obsidian, Obsidian asks whether to allow the action.
  Tick **"do not ask again"** and it is over.
- On a **second machine**, run the command above from the brain's folder, then open a **new**
  conversation rooted there.

---

### Under the hood

- **The documented multi-machine path did not work, and this is what fixes it.** `.mcp.json` and
  `.claude/settings.json` are deliberately not versioned (they hold absolute paths belonging to one
  machine), and nothing regenerated them on a clone: no search server, no hooks, no auto-commit. The
  reconciler could not help — it only ever *adds to* files that already exist, and it is fired by a hook
  declared in the very file that is missing. `scripts/rehydrate.mjs` replays the installer's generation
  step **locally**: both files from the templates that travelled in the clone, the launchers, the health
  canary, and **both** dependency trees (`local-mirror` has its own, which the old instructions omitted).
  Offline, idempotent, no launcher, no network. It **shares the substitution code with the installer** —
  two generators that substitute differently produce two different brains.
- **The engine stopped promising a repair it could not perform.** An absent `.mcp.json` registered no
  server, which the session self-heal read as a version gap: it announced "an engine update finishing in
  the background", forever, at every session start, and spawned a reconcile that cannot create a missing
  file. It now checks the wiring first and names the command instead.
- **A write-time guard, running the engine's own parser.** The note that triggered this had an unquoted
  value containing `": "` — valid to the writer, refused by the indexer, invisible to search for as long
  as it existed. The guard resolves gray-matter and js-yaml **from the engine's own dependencies** and
  composes the note an edit *would* produce before judging it, so the exact gesture that caused it (a
  second `updated:` key appended) cannot walk past. It fails **open** everywhere else: no parser, an
  unreadable file, anything outside `vault/**/*.md`. Wiring it turned up a gap in our own guard rails —
  the check that a delivered hook script actually reaches brains only ever looked at one event.
- **Vault ↔ index crosscheck, on two surfaces.** `node scripts/verify-index.mjs` names every note the
  two disagree about; a fourth health check reports the same thing at session start, but **only** for
  damage no reindex will ever clear. Ordinary drift — a note edited in Obsidian, a pull from another
  machine — stays silent, or the banner would fire at nearly every start and be muted within a week. It
  reuses the engine's own scan, hash and parse rather than mirroring them: the hand-written version this
  was promoted from had already drifted, and would have cried wolf on files the engine skips.
- **Claim discipline, where your brain writes about people.** A briefing that reports "nobody answered"
  when the search simply returned nothing is worse than no briefing. Four surfaces now separate observed
  from inferred, quote a thread's resolution rather than the question that opened it, and carry yesterday's
  caveat forward instead of promoting it to fact overnight. Locked by 42 assertions.
- **Opening a note: three surfaces used to give three different answers**, and the most specific one was
  also wrong — `open -a "Obsidian" <file>` was measured three times, cold and warm, and **never** opens
  the requested note. So the rule is one pure function now, with the three documents pinned to it by
  tests, and it uses `obsidian://open?path=` (the form that resolves; `?vault=` is ambiguous by
  construction here, since every brain names its vault folder `vault`). ADR 0027 was amended in place
  rather than contradicted by a new one: the rendered citation link is unchanged, only the command is.
- **The session start names the sphere you are in and where its page lives** — the page itself stays in
  the vault, out of a banner echoed verbatim on screen. A single-sphere brain prints nothing at all.
- **CI, and the reason this section can be trusted.** The branch had accumulated 67 commits without a
  push, so the Windows tripwire — which exists precisely to prevent that — had never run; when it did, it
  found ten Windows failures (**all fixture, zero production**: fakes keyed on hand-written POSIX
  literals where production computes with `join`) and four assertions that had **never** run in CI on any
  OS. Both fixed, and the second is pinned from the suite itself, so deleting the step goes red instead
  of going quiet. The convention now says what it had left implicit: on a branch, every green commit is
  pushed. **CI 7/7** on this tag: Node 22/24/26 × macOS + Windows, plus the Windows installer end-to-end.

### Mutation-score snapshot, pinned to v4.5.0

<!-- FILLED AT THE END OF THE MUTATION PASS — see maintainers/mutation/RESULTS.md -->

A published release is frozen, so these numbers stay true for this tag forever. Full detail:
[`maintainers/mutation/RESULTS.md`](maintainers/mutation/RESULTS.md).
