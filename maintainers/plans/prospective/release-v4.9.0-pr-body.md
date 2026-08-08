# v4.9.0 — The One Where the Universe Travels With You

A universe was half the owner's and half the machine's, and nothing said so. The native connectors
(Slack, Notion, Gmail, Drive) authenticate at the **account** level, so they already follow the owner
onto any machine. The retrieval scope did not: `.vault-rag/active-universe` was gitignored while its
sibling registry `.vault-rag/universes.json` was committed. So switching context on one machine left
the other answering from the sphere it went to sleep in — **silently**, because a wrong scope returns
results rather than an error.

**The user-facing note is the source of truth for what ships:**
[`release-v4.9.0-note.md`](maintainers/plans/prospective/release-v4.9.0-note.md).
The plan, with every decision and every rejected option:
[`active-universe-follows-the-owner-action.md`](maintainers/plans/prospective/active-universe-follows-the-owner-action.md).

### What is in it

- **The decision, recorded by amending ADR 0034 in place** (CONVENTIONS §6bis — no new ADR, no
  "AMENDED" scar): a universe is the **owner's** context, not the machine's. The pointer is committed
  alongside its registry; convergence is **eventual**, at the next pull, not real-time like the
  connectors. The old *"per-machine session state"* framing had never been argued — it was assumed by
  analogy with the genuinely machine-bound files, while ADR 0034's own nearby line went the other way.
- **A whole bug class disappears by construction.** Pointer ignored + registry committed meant a
  rename or delete on machine A reached machine B naming a universe that no longer existed → the
  engine filters on a ghost and returns zero hits, silently. Both halves now travel together. The
  self-heal survives as belt-and-braces.
- **A guard that asks git itself** (`lib/universes.test.mjs`): in a throwaway repo carrying only the
  shipped `.gitignore`, so no dev machine's global excludes can answer in its place, plus a control on
  `rag/.cache/` so a broken invocation cannot pass vacuously.
- **The fleet migration** (`lib/unignore-pointer.mjs`, wired into `reconcileBrain`). `.gitignore` is
  carried by **no** engine regime, so a deployed brain keeps its own and this change would otherwise
  reach new brains only. It lives in the reconciler rather than in the updater because that is the one
  path reaching a deployed brain on **both** routes — an update *and* a SessionStart self-heal. It
  removes the entry and the engine's own comment **only while that comment is still verbatim ours**,
  and leaves the owner's entries, notes and line endings byte for byte.
  - The *"stage the pointer if it exists untracked"* half was **verified as already guaranteed** rather
    than built: un-ignored, the pointer makes the tree dirty, and both persistence paths commit before
    anything can pull. A redundant `git add` would have been mechanism bought against a hazard the
    existing invariant already closes.
- **A race, not an ordering** (`lib/startup-sync-gate.mjs`). The session-start announcement could name
  the universe the machine woke up in while every later search already used the one that had just
  arrived — announcing one context and retrieving from another. It **looked** like hook ordering;
  checking before writing code showed Claude Code runs all matching SessionStart hooks **in parallel**,
  so reordering the array would have fixed nothing. The fix is a session-keyed barrier: the pull keeps
  one owner, brackets itself with a `running`/`done` marker keyed on the session id the harness hands
  every hook, and the reading hook blocks on the flip. Fail-open on every branch (no puller wired, no
  session id, a puller that dies before speaking → 3 s grace, a pull that never lands → 12 s ceiling).
  Proven by a **real child process** whose pointer changes under it mid-run.
- **`/sync` mid-session**: the conflict rule written once and applied everywhere — *the machine you are
  sitting at wins* — which is `git checkout --theirs`, a command that reads backwards (a rebase replays
  your commits onto origin's, so `--ours` is the **other** machine). Pinned by a test against **real
  git**, in a repo that actually conflicts, so nobody "fixes" the direction and silently hands the
  session to the other laptop. Plus one line naming the universe when it changed, silent when it did
  not — a single-context brain still never hears of the feature.
- **Nine prose surfaces** corrected to say the pointer is the owner's, and the marketing surface
  re-read (§10): nothing was made false, one undersell fixed in the README.

### Deliberately NOT built (so it is not re-litigated)

Per-machine override (`active-universe.local`, gitignored, winning over the committed pointer) — real,
but unproven for this owner; the pattern is known and cheap the day it is lived. Real-time propagation
— git is the transport. Per-window universes — already YAGNI per ADR 0034.

### Verification

- Harness **1667** (1664 pass, 3 skipped), engine **515**, local-mirror **255**.
- **Release-tail mutation pass** (§5ter / §5quinquies), scope decided on the diff — `scripts` only,
  since `rag/src` and `local-mirror/src` are **comment-only** in this branch. Numbers and the survivor
  analysis in [`RESULTS.md`](maintainers/mutation/RESULTS.md) § v4.9.0.
- Cross-platform: this branch edits a text file line-wise, so CRLF is pinned by test and the CI matrix
  is the arbiter (§9).
