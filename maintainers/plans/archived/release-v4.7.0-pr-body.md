## v4.7.0 — The One Where It Knows You Haven't Restarted Yet

The short leg of the trilogy, and the only one whose scope was cut rather than grown: it ships **what one
morning's field session raised**, plus the dependency pins we wrote ourselves. Everything else moves to
v4.8.0 with its analysis intact.

Two of the three findings are the **same root on two clocks**: a session start is a race between what
arrives and what reads it, and in both races the reassuring sentence won. Newer engine code lands after the
session froze its wiring → the whole conversation is answered by the old code, silently. Notes land after
the scan that counted them → *"pending, they'll catch up next session"*, while nothing was scheduled and
the watcher sat idle.

**The user-facing note is the source of truth for what ships:**
[`release-v4.7.0-note.md`](release-v4.7.0-note.md).

### What is in it

- **A machine that is behind now says so** — detected from the startup pull's **own file list**, which the
  session already computed and threw away to keep a count. `lib/frozen-wiring.mjs` names which of those
  paths a session freezes at start (hooks, skills, settings, the constitution, both MCP servers, the
  version vector); a match arms the flag the existing nudge already reads. A pull that brought only notes
  arms nothing; a brain with no remote is silent by construction, pinned by a test.
- **The nudge reaches Desktop, and repeats** — a `UserPromptSubmit` hook injecting the directive on every
  prompt while the flag is armed. It **injects, never blocks**: that event can refuse a prompt outright,
  and a wrong verdict must cost a sentence, not a locked-out owner. It is the first deterministic Desktop
  cue for a stale engine.
- **The shortfall model** (`rag/src/lib/index-shortfall.ts`) reads the run record the banner already reads
  — one source, not a second opinion — and separates **five** states that were rendered as one sentence:
  refused notes, a quota wall, a run in flight, notes that arrived after the scan, and a catch-up that has
  already failed.
- **And it acts on the one it can fix**: the arrival case schedules a catch-up through the
  `ReindexScheduler` that was sitting idle, armed for an event that had already happened. Both surfaces do
  it — startup (which owns the scheduler) and `vault_stats` (where the sentence "catching up now" is
  printed, so the ask has to happen there or it is the old promise in newer words). Bounded by progress,
  in memory, per server process.
- **`/universe` and `/univers`** — two thin aliases at the root, both locales getting both. They **point**
  at `switch` and explain nothing: the reconciler never removes a skill, so a second copy of the rules
  would outlive any repair. Guarded on the four things that break an alias silently (the folder the CLI
  routes on, the declared `name:`, the target still existing, and the description's cost in the
  always-loaded layer).
- **PR #56, already merged into `main`** — the dependency pins, ours, replacing two drive-by PRs from a
  fork (#48, #52). Both were applied to a throwaway copy and re-audited: **neither closed its advisory**,
  because `rag` pulls `fast-uri` through its own `ajv` too. Ours pins both through `overrides` in both
  packages: `rag` 12 → 9, `local-mirror` 6 → 5. The rest of the audit is named in the PR body rather than
  quietly left.

### Choices worth reviewing

- **The nudge does not name the privacy case.** A banner that already printed a profile is not un-leaked by
  a restart, so naming it buys nothing actionable and dates the copy to one release.
- **The SessionStart banner was deliberately left alone.** It still says "auto catch-up in the background"
  for an unexplained shortfall — a sentence this release makes **true** for the first time. It cannot know
  about the process-local bound (it runs before the server), so a permanently stalled gap is named by the
  vault↔index crosscheck that already exists for exactly that.
- **Three existing expectations were repointed, deliberately** (`3.1b`, `4.2`, `C.13`): they encoded the
  promise this finding is about. The cap case gained a test of its own so the fix cannot swap one wrong
  cause for another.
- **Option A for the aliases, not a rename of `/switch`.** On a deployed brain a rename **is** an alias
  plus a stale duplicate, since the reconciler installs skills by directory name and never removes one.

### Verification

- **Mutation, both halves, per file rather than averaged.** `rag`: **94.44 % → 100 %** on the two files
  changed. `scripts`: **83.33 % → 97.56 %** on the four written. The `scripts` number is the one worth a
  reviewer's minute — it was a **design** defect, not thin tests: `lib/restart-signal.mjs` wrote its
  fail-soft **twice per signal** (an initializer *and* a `catch`), so each half silently covered for the
  other and neither could be shown to work. Stated once, it became testable. `lib/frozen-wiring.mjs` had
  only ever been fed CRLF, so a splitter that knew only CRLF passed — on Unix the whole stdout would have
  come back as one path and the machine that is behind would have gone silent everywhere *but* Windows.
  Detail: [`maintainers/mutation/RESULTS.md`](../../mutation/RESULTS.md) § v4.7.0.
- **§10, the marketing re-read: nothing became false.** Two things became **true** and are now sold — the
  stale-engine cue, and "always catches up", which was partly unearned until this release (the arrival case
  never caught up). Boards re-read through their alt texts, **not** re-rendered.
- **CI**: the full matrix — Node 22/24/26 × macOS + Windows, plus the Windows installer end-to-end.
