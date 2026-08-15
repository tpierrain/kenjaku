# v4.9.1 — release note (draft)

> Draft for the GitHub release body, written per `CONVENTIONS.md` §11: non-developer first, technical
> depth kept but moved below the `---`. The mutation figures are **pinned** (pass 3, 2026-08-15).
> **One thing is still the owner's call**: the title — three candidates below.

**Title candidates** (the series uses *"The One Where…"*):

1. **v4.9.1 — The One Where the Switch Actually Leaves** ⭐ (says what was wrong, in the user's terms)
2. v4.9.1 — The One Where It Really Does Travel
3. v4.9.1 — The One Where Your Context Stops Coming Back

---

**If you keep several universes, the context you switch into now actually leaves the computer you
switched it on.** v4.9.0 said it would follow you; in practice it was saved on that machine and never
sent anywhere, so the computer you opened next stayed in the sphere you had left.

Nothing was ever lost or damaged — your notes, your universes and your history were never in question.
What could be wrong was *which* sphere your brain answered from.

### What you get

- 🌌 **The switch travels for real.** Switch to a client on your laptop, close it, open your desktop
  tomorrow: it lands in that same context. Until now the switch was written on the laptop and stayed
  there, so the other machine kept answering from the sphere you had moved out of — quietly, since
  answering from the wrong sphere looks exactly like answering.
- 🔙 **The context you left can no longer come back on its own.** When both machines had something to
  say about it, the one that was *catching up* could save its own out-of-date context first and win. If
  you ever saw yourself pushed back into a previous sphere without touching anything, that was it.
- 💾 **Whatever your brain writes for itself now leaves with the rest.** Files your brain writes on its
  own are not things you or Claude *edited*, so nothing was watching them. At the end of every turn your
  brain now saves whatever is still unsaved before backing it up — so it is a whole family of small
  things that stops staying behind on one machine, not just this one.
- 🧵 **New brains hold more of a long conversation before compressing it.** The window before your brain
  has to summarise what was said grows by roughly a third. This one applies to **brains installed from
  now on**; an existing brain keeps the setting you already have, deliberately — it is yours.

### What you have to do

Ask for **`/update-engine`** once.

**Nothing is re-read and nothing is re-encoded**: this release does not touch your notes or your search
index, so there is nothing to wait for.

---

### Under the hood

**The mechanism.** `/switch` writes the active-universe pointer (`.vault-rag/active-universe`) through a
shell command, so it fires no `Write|Edit` event — and both halves of the persistence net were listening
for exactly that: `auto-commit.mjs` matches `Write|Edit` only, and the `Stop` hook was push-only. The
switch therefore survived as a dirty file until the *next* session's start-up sweep, which is also why a
second machine could commit its own stale pointer first (issue #69, measured on a real brain with a
timeline).

Two fixes, one for the case and one for the class:

1. **The switch persists itself** (`scripts/lib/universe-persist.mjs`): after the pointer is written it
   is committed — **pathspec-scoped** to `.vault-rag/`, so anything you had staged stays staged and
   stays yours — and pushed through the same opt-in path as every other push. Failure is loud, not
   assumed.
2. **The `Stop` hook became sweep-then-push** (`scripts/auto-push.mjs`): the turn's last hand now commits
   whatever is dirty before pushing. That removes the class — today's pointer, tomorrow's whatever —
   rather than the one reported instance. A sweep that fails says so; an unmerged tree is deferred to the
   session-start banner that already owns that alarm.

**Deliberately not shipped.** A guard refusing to commit a pointer that is *behind* the remote was
considered and deferred, in writing: the two fixes above remove the dirty-pointer window it would have
protected, and the remaining case (committed but behind) already stops loudly on a rebase conflict,
where the standing rule applies — the machine you are sitting at wins.

**The two riders.** `CLAUDE_CODE_AUTO_COMPACT_WINDOW` default 350k → 450k in the settings template
(ADR 0018 amended in place, per CONVENTIONS §6bis; new brains only — an installed brain's settings are
merged, never overwritten). And the native-connectors reminder now carries a `⚠️` so it reads as the
caution it is. *(Issues #63 and #65.)*

**How this reaches you.** `scripts/lib/**` is a `replace` regime and `scripts/auto-push.mjs` a `merge`
one, so `/update-engine` delivers both — verified against the manifest rather than assumed. Engine
version vector: `scripts` 1.13.0 → **1.13.1**.

**The quality of what ships.** Three independent adversarial reviews ran on the branch (git semantics,
fleet deployment through the update regimes, test quality) before anything was tagged; what they raised
was fixed on the branch. The most useful of them demanded a test that runs the real `/switch` entry
point in a subprocess — which immediately showed that a brain reached through a symlinked path would run
the switch *without* persisting it. That is the net doing its job.

**Mutation snapshot** (targeted run over the six production files this release changed, three passes —
one per time production moved; `maintainers/mutation/RESULTS.md` § v4.9.1): **the two files this release
wrote both end at 100 %**, the CLI wiring that no test imported goes **25 % → 100 %**, and the four
others land between **95.92 % and 99.66 %**. Every survivor left is a named equivalent — the entry-point
guard, a `.trim()` no git output can distinguish, and one optional chain whose `catch` already returns
the same value.

Closes #69, #63, #65.
