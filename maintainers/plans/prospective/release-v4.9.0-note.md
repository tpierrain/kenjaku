# v4.9.0 — The One Where the Universe Travels With You

> **DRAFT** — written per `CONVENTIONS.md` §11 (non-developer first, depth kept but moved below the
> `---`) and §10 (marketing surface re-read before a line of this was written). **Title arbitrated by
> the owner, 2026-08-08**, from four candidates: it keeps the product's own word (*universe*), which the
> reader who has two of them already knows, and the lead below carries the plain-words version for
> everyone else. Once published, this file is rewritten to mirror the **published body verbatim** and
> moved to `archived/`, as v4.7.0, v4.8.0 and v4.8.1 were.

**The sphere you are working in now follows you from one computer to the next.** Switch to a client, a
new employer, a side of your life on your laptop, and the machine you open next lands in that same
context on its own — instead of quietly answering you from the one you left behind weeks ago.

This only concerns you if you keep **several universes**. With a single one, nothing in this release is
visible, and nothing you have changes.

### What you get

- 🌌 **Your context travels with you.** Your connectors already did: Slack, Notion, your mail and your
  calendar are tied to *your accounts*, so they follow you onto any machine you open. Your notes did
  not — the sphere you had switched into stayed on the computer where you switched. So half of *"which
  context am I in"* travelled and half stayed put, and the half that stayed put failed **quietly**: no
  error, no warning, just answers drawn from the wrong sphere. Both halves now agree, and the switch
  reaches your other computers the next time they sync.
- 🗣️ **The machine you open tells you which context you actually landed in.** Your brain names the
  active universe when a session starts. On the machine that was *catching up*, that line could name the
  sphere the computer went to sleep in, while everything you then asked was already being answered from
  the new one — announcing one context and searching another. It now waits until the catch-up has
  finished before speaking, so the line you read is the context you are in.
- 🔄 **A switch that arrives mid-session says so.** If you are already working when your other machine's
  change reaches you, `/sync` names the context you have just moved into, in one line — and stays silent
  when nothing moved, so a single-universe brain never hears about any of this. If the same thing was
  changed in two places at once, the rule is the plain one: **the machine you are sitting at wins**.
- 🧳 **Brains that already exist get this too.** You do not have to reinstall or rebuild anything: an
  existing brain picks the change up on its next update, and your own settings are left exactly as you
  wrote them.

### What you have to do

Ask for **`/update-engine`** once.

**Nothing is re-read and nothing is re-encoded** — this release does not touch your notes or your search
index, so there is nothing to wait for.

---

### Under the hood

**The decision.** A universe is the **owner's** context, not the machine's — recorded by amending
[ADR 0034](https://github.com/tpierrain/kenjaku/blob/main/maintainers/decisions/0034-progressive-disclosure-of-universes.md)
in place rather than spinning off
a new ADR (CONVENTIONS §6bis). The active-universe pointer (`.vault-rag/active-universe`) is now
**committed alongside its sibling registry** (`.vault-rag/universes.json`), which was already committed.
Convergence is **eventual** — at the next pull — not real-time like the connectors; git is the transport
and making it instant would need a channel the brain does not have.

The old framing (*"per-machine session state"*) had never actually been argued: it was assumed by
analogy with the genuinely machine-bound files (`.mcp.json`, `.claude/settings.json`, `.env`, the
caches), while ADR 0034's own nearby line went the other way. A whole bug class existed only because the
two halves diverged: a rename or a delete performed on one machine reached the other with a pointer
naming a universe that no longer existed, and the engine would filter on a ghost and return zero hits,
silently. That divergence can no longer be produced. The self-heal that repaired it survives as
belt-and-braces, for a pointer that outlives its universe by some other route.

**Reaching brains that already exist.** `.gitignore` is carried by **no** engine regime (`replace` /
`regenerate` / `merge` — none matches it), so a deployed brain keeps its own and this change would never
have reached anybody without an explicit migration. That migration lives in `reconcileBrain`, not in the
updater alone: the reconciler is the one path that reaches a deployed brain on **both** routes — an
update *and* a session-start self-heal. It removes the entry and the engine's own comment beside it when
that comment is still verbatim ours (a comment arguing *"never commit it"* next to a committed pointer is
worse than none), and leaves the owner's own entries, notes and line endings byte for byte.

**A race, not an ordering.** The session-start announcement problem looked like hooks running in the
wrong order. Checking before writing any code showed the opposite: Claude Code runs all matching
SessionStart hooks **in parallel**, so reordering them would have fixed nothing, and the defect was a
race — the announcement is a handful of file reads, the catch-up is a network round-trip, so the stale
read won nearly every time without ever being guaranteed to. The fix is a **session-keyed barrier**
(`scripts/lib/startup-sync-gate.mjs`): the pull keeps one owner, which brackets it with a
`running` / `done` marker keyed on the session id the harness hands every hook, and the reading hook
blocks on that flip. Fail-open on every branch (no puller wired, no session id, a puller that dies before
speaking → 3 s grace, a pull that never lands → 12 s ceiling): read what is on disk, exactly as before.
Proven end-to-end by a real child process whose pointer changes under it mid-run.

**The conflict direction is verified, not reasoned.** *"The machine you are sitting at wins"* is
`git checkout --theirs`, which reads backwards — a rebase replays your commits onto origin's, so `--ours`
is the **other** machine. That is pinned by a test against **real git**, in a repo that actually
conflicts, so nobody "fixes" the direction and silently hands the session to the other laptop.

**Still deliberately not built**, so it is not re-litigated: a per-machine override
(`active-universe.local`, gitignored, winning over the committed pointer) for the dedicated-machine case
— real, but unproven for this owner, and cheap to add the day it is actually lived.

**Marketing surface (§10).** Re-read whole. Nothing this release made false: no page ever claimed the
universe was per-machine — that framing lived only in code comments, which this branch corrected. One
undersell found and fixed: the README's universes bullet was silent on machines. Boards re-read, copy
still accurate, no re-render.

**Tests.** Harness 1667, engine 515, local-mirror 255 — all green, and the full CI matrix with them
(Node 22 / 24 / 26 on macOS and Windows, plus the Windows tripwire and the Windows installer e2e).
Cross-platform parity is CI's call (§9), and it earned its keep on this branch: the test that proves the
conflict direction against real git was reading the *runner's* line endings rather than git's answer, so
it went red on Windows and green everywhere else. Its throwaway repo now pins its own line-ending
config. Nothing in a brain was affected — every reader of the pointer trims it, and a test pins that.

**Mutation snapshot** (pinned to this tag, per §5ter). The release-tail pass measured the **6
production files this branch changed**, all under `scripts/` — the other changed files are comment-only.
The two files this release **wrote** end at **100.00 %** (`lib/unignore-pointer.mjs`) and **95.28 %**
(`lib/startup-sync-gate.mjs`); `update-engine.mjs` **98.44 %**, `lib/reconcile-brain.mjs` **96.11 %**.
The two entrypoint-tier scripts it merely grazed both **rose** — `session-universe.mjs` 39.39 % →
**66.18 %**, `session-status.mjs` 0.00 % → **8.67 %** — and remain the named structural debt below,
not new rot. Detail, survivors and listed equivalents: `maintainers/mutation/RESULTS.md` § v4.9.0.

The first pass on the two new files scored 87.74 % and 84.62 %, and its 21 survivors were **contracts
nothing read** rather than thin assertions — among them a constant only ever recomputed from itself, and
the prose this migration writes into someone else's `.gitignore`, which could have been blanked entirely
with the suite still green. All 21 are now killed or named.

**The debt this release does not pay, said out loud.** v4.8.0 left two named structural debts (a shared
`runAsEntrypoint` plus the guard test that makes it stick, and `defaultGit` turned into a pure value).
Their floor was **re-arbitrated in writing** to the next release rather than honoured here, with its
terms recorded in the plan that owns them. The next release cutting without paying it would be a defect,
not a third re-arbitration.
