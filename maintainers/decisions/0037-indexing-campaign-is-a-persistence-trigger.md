# ADR 0037 — The end of an indexing campaign IS a persistence trigger (amends ADR 0011)

- **STATUS:** ACCEPTED (2026-07-28). **Amends [`0011-distinct-triggers-indexing-vs-git.md`](0011-distinct-triggers-indexing-vs-git.md)**
  on one point: its rejected alternative *"drive `git commit` from the watcher"* is **adopted, as an
  ADDITIONAL rung** — everything else in ADR 0011 stands.
- **Scope:** Second brain (runtime) only — the live watcher's campaign end
  (`rag/src/lib/campaign-run.ts`, `rag/src/lib/campaign-persist.ts`,
  `rag/src/lib/persistence-scheduler.ts`, `rag/src/index.ts`). **No hook change**, no settings change,
  no installer change, no index schema change.
- **Related:** [`0011-distinct-triggers-indexing-vs-git.md`](0011-distinct-triggers-indexing-vs-git.md)
  (the decision this amends); [`0010-debounce-auto-push-to-stop-hook.md`](0010-debounce-auto-push-to-stop-hook.md)
  (the push stays opt-in and debounced — reused verbatim, not reimplemented);
  [`0006-rag-mcp-is-stable-contract.md`](0006-rag-mcp-is-stable-contract.md) (the coupling objection,
  re-examined below); [`0009-prefer-deterministic-mechanisms.md`](0009-prefer-deterministic-mechanisms.md);
  field log [`../plans/prospective/fleet-upgrade-field-feedback.md`](../plans/prospective/fleet-upgrade-field-feedback.md)
  (F8/P1, F9, F11).

## Crux

ADR 0011 rejected driving `git commit` from the file-watcher, and it was right about the design it
was rejecting: **replacing** the hooks with the watcher. What the field then showed is that the
remaining rungs leave a real, dated hole — and that the honest fix is to **add** a rung, not to move
one.

**The defect in one line: indexing is file-driven, committing is tool-driven.** Three classes of
writer are missed by `PostToolUse Write|Edit`, all field-confirmed on 2026-07-28: the engine's own
scripts (`set-universe-profile.mjs` writing a note in Node), a note typed in Obsidian, a note deleted
with `rm`. The index then runs **ahead of git**: the brain searches, finds and cites a note that
exists on no remote and on no other machine.

**The invariant is asymmetric: `git ≥ index`, not `git = index`.** Index-ahead-of-git is serious;
git-ahead-of-index (after a pull) is benign and already repaired by the startup catch-up.
**Convergence was never what was missing** — the SessionStart sweep does converge them. What was
missing is a **bound**: *"the next time you happen to open Claude"* is not a duration, and the brain
was already telling the fleet these notes were committed.

## Decision

**The end of an indexing campaign that CHANGED something makes the vault DUE for a commit (then a
push, under the existing opt-in).** It is a **fourth rung**, added to ADR 0011's three; none of them
is removed.

- **The campaign decides WHETHER, a separate window decides WHEN.** These are two different questions
  and they want two different answers: indexing wants to be quick (search must be fresh), git wants to
  be quiet. Sharing one trigger means picking a single cadence that is wrong for one of them — and
  since the indexer's 5 s debounce is the fast one, the shared answer was a commit *and a network
  push* for every pause longer than five seconds. Half an hour of writing in Obsidian with twenty
  ordinary pauses bought twenty of each. So persistence gets its own cadence
  (`persistence-scheduler.ts`), and the campaign merely signals it.
- **That cadence is a race between two windows: 2 minutes of quiet, or 10 minutes flat.** The quiet
  window is the intent — commit once the writing has actually stopped, folding a whole session into
  one commit. The cap is what keeps the quiet window honest: it re-arms on every write, so a session
  that never pauses for two minutes would never commit at all, and the rungs that would otherwise
  cover it (`PostToolUse`, `Stop`) fire on a **Claude turn** — while the scenario this whole ADR
  exists for is Claude sitting **idle** as someone types in Obsidian. Whichever window fires first
  commits; the other is disarmed.
- **The gate is `indexed > 0 || removed > 0`**, never *"a campaign ended"*. Both halves are pinned by
  a field finding: a **deletion** runs a campaign that indexes nothing (F9 — gating on `indexed`
  alone would reproduce F9 inside its own fix), and campaigns fire on churn git cannot see (F11 —
  `.obsidian/` pane moves, now also ignored by the watcher itself).
- **It reuses the brain's own scripts** (`auto-commit.mjs` then `auto-push.mjs`) rather than
  reimplementing git. The push therefore keeps ADR 0010's gates untouched: `secondbrain.autopush`,
  a remote, an upstream, unpushed commits.
- **It is best-effort and asynchronous.** A failure reports `failed` and the live-update loop
  survives; the wait never blocks the MCP event loop, so a slow push cannot freeze search.
- **It runs only in an INSTALLED brain**, decided by the manifest's install-time `provenance`. Running
  the engine from the launcher (a maintainer's dev session) must never sweep the generator's working
  tree into an `auto:` commit. Fails closed.

## Why ADR 0011's four costs no longer decide it

Each is re-examined against *adding* a rung rather than *replacing* the hooks:

1. **"It would couple git persistence to the RAG's failure domain."** This was the strongest argument
   and it still holds — for a design that **moves** persistence into the MCP. Here the `PostToolUse`
   hook and the `SessionStart` sweep are **untouched**: if the MCP fails to boot, notes are committed
   exactly as they are today. The new rung can only ever **add** commits. Eggs, baskets: we added a
   basket.
2. **"The watcher is dumb about *why*; the hook is not."** True in principle, **already false in our
   code**: `auto-commit.mjs` writes a fixed `auto: vault/claude sync` for every edit. There is no
   intent-bearing message to lose. Where intent *is* carried (the updater's own
   `engine: update to vX.Y.Z`), that writer still owns its commit — ADR 0011's "whoever writes owns
   the durability of that write" is unchanged.
3. **"It re-introduces a timer into the commit path"** — mid-write commits, bundled edits. This one we
   accept rather than dissolve, and it is worth saying plainly, because ADR 0009 prefers real events
   to timers and this rung is a timer. The reason the preference does not decide it here: **there is
   no event to prefer.** ADR 0009's rule earns its keep where an exact event exists and a timer would
   be a lazy stand-in for it (`Stop` instead of polling, ADR 0010). The writers this rung exists for
   — Obsidian, `rm`, an engine script — emit no event at all; a filesystem write is the only signal,
   and "the writing has stopped" is not observable, only inferable from silence. A timer is not the
   approximation of a better mechanism here, it **is** the mechanism. So we make it an honest one: the
   quiet window is the inference, and the cap is the admission that the inference can fail.
   As for bundling, that is what `git add .` already does on every rung. The mid-write window is real
   and bounded the same way it always was: the commit fires *after* the campaign that read those
   files, so a file too fresh to be committed was also too fresh to be indexed — and the next write
   starts another campaign.
4. **"It amplifies the multi-window race."** Real, and benign in practice: N brain windows = N
   watchers, and a racing `git commit` either finds a **clean tree** (the other window won — no-op by
   `treeState`) or loses the `index.lock` and reports `failed`, best-effort, to be caught by the next
   campaign or the session sweep. Nothing is lost; a commit is at worst deferred.

## Consequences

- **The bound we can now state honestly, and it is two different numbers.** Three layers (index →
  local git → remote). A note becomes **searchable within seconds** of you stopping typing, and
  **committed within a couple of minutes** — at the latest ten, if you never stop. Both hold only
  *while your brain is open*, and `secondbrain.autopush` stays opt-in, off by default. The release
  note says exactly this instead of implying continuous backup, and it must not let the seconds figure
  stand for both: search freshness and durability are no longer the same promise.
- **The gap ADR 0011 documented is narrowed, not closed.** An Obsidian edit with **no** Claude session
  open still waits for the next session's sweep: no session, no MCP, no watcher. ADR 0011's own
  analysis of that ("`chokidar` only half-closes it") remains exactly right.
- **Committing with no session at all stays REJECTED** (Thomas, 2026-07-28). It needs something
  running outside any session — a LaunchAgent, a cron, a git hook — *"trop de choses et un côté
  immersif qui ne va pas plaire aux gens"*, on a product whose pitch is that nothing leaves the
  machine. Same conclusion as ADR 0011's "always-on daemon", reached again, on product grounds.
- **The agent-side plaster was refused, and the refusal is the point.** During the QA the brain
  offered to *"keep the reflex of checking `git status` at end of session"*, and the offer was accepted
  within one exchange — the product had made "yes" cheaper than the diagnosis. It is not
  deterministic, it would land in one brain's sacred `CLAUDE.md` and reach nobody in the fleet, and it
  would have **hidden the defect from the QA that found it**.
- **ADR 0011's review question survives, refined.** No longer *"retrieval → watcher, persistence →
  hook"* but: **"which writers does this trigger see, and what is the bound on how long a note stays
  unsaved?"**

## Alternatives considered

- **A new Claude hook instead of the watcher (rejected).** A hook is session- and tool-shaped, which
  **is** the defect. It would also land in the sacred `settings.json`, so it would reach new installs
  and **nobody** in the deployed fleet; `rag/**` is engine-owned `replace` and reaches everyone.
- **Move persistence into the MCP wholesale (rejected).** ADR 0011's cost #1, undiminished.
- **Gate on "a campaign ended" (rejected).** Fires on churn git cannot see, and with `autopush` on it
  would carry that to the network. Harmless today only *by accident* (`.obsidian/` is gitignored).
- **Commit without pushing, ever (rejected).** The push gates already exist and are already opt-in;
  re-deciding them here would fork ADR 0010 for no reason.
- **One shared cadence for indexing and persistence (rejected).** Whichever value you pick is wrong
  for one of the two: fast enough for search means a network push per pause, slow enough for git means
  a stale index. The two questions are separate, so they get separate windows.
- **A quiet window with no cap (rejected).** Simpler by a dozen lines, and it silently does nothing
  for the one user it was built for: someone deep in a writing session, who is exactly the person
  least likely to pause for two minutes.
- **Telling a sync "the batch is done" so it commits at once, instead of waiting out a quiet window
  (deferred, not rejected).** The right shape — a bulk import knows when it has finished, and should
  not be inferred about. It needs an explicit end-of-batch signal on the `reindex` MCP tool, which
  today indexes without persisting, plus the two skills that drive it. That is a new capability with
  its own contract, not a cadence tweak, so it is its own decision.
