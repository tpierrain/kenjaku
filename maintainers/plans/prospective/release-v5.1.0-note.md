# v5.1.0 — The One Where Your Two Computers Stop Drifting Apart

> **This file mirrors the release body to be published.** Written per `CONVENTIONS.md` §11:
> non-developer first, technical depth kept but moved below the `---`. Mutation figures pinned from
> the runs of 2026-09-03 (rag half, then the two `scripts/` batches).
>
> 🏷️ **The TITLE is the owner's to arbitrate**, as v4.9.1's was. Mine names what people live (two
> machines that no longer agree); the two others considered named the mechanism (*"The One Where It
> Catches Up on Its Own"*) and the arrival (*"The One Where the Other Machine Gets a Word In"*).
> Recorded here so it is decided once rather than re-litigated at the tag.
>
> ✅ **The `### What you get` heading is BARE on purpose, and it is load-bearing.** `/update-engine`
> quotes that section verbatim before asking for consent, and its parser
> (`extractWhatYouGet`) matches only a heading that ends right after those three words, then reads to
> the next heading. **v5.0.0's note wrote `### What you get, when you update your brain` and was
> therefore never quoted** — the consent prose silently fell back to the release title. This note was
> checked against the real parser: 16 lines captured, both moments included.
>
> Everything below the rule is the body verbatim.

---

### What this release is about

> ### v5.1.0 ends having to remember which computer your second brain last heard from.

Your second brain lives in a folder on your machine, and if you wired up a repository of your own it backs itself up there. That repository is also what lets you use the same brain from your laptop and from your desktop, or share it with one other person.

**Until now it caught up only when a conversation started.** That was a deliberate choice: a brain that reaches for the network in the middle of your work is a brain that can interrupt it. The cost landed elsewhere, though. Leave a window open all afternoon on one machine, write on the other, and the first one keeps answering from what it knew this morning, with nothing on screen to say it is behind.

**v5.1.0 lets an open brain keep itself up to date, quietly.** It notices what your other computer wrote, brings it in on its own, and tells you at your next message. And because two people can now write into one brain without treading on each other, the same release makes sharing a brain with a colleague something you can actually do.

### What you get

*Nothing to install and nothing to switch on: an engine update is enough, and this only ever concerns brains that have a repository of their own.*

**While a conversation is open, on either machine.**

- 🔄 **Your brain notices what the other computer wrote, and goes and gets it.** You spend the morning on your laptop, then move to your desk after lunch and leave the laptop's window open. It catches up on its own rather than waiting for you to start a fresh conversation there.
- 💬 **It tells you what arrived, at your next message.** One sentence, in your own language, before it answers you: what came in and who wrote it. Not a notification you have to go looking for.
- 🔔 **And it says so even if you are in another app.** A discreet notification from your system, once, and only when what arrived was written by someone other than you.
- ✍️ **Two notes added the same afternoon to the same daily note are both kept.** Nobody is asked and nothing is lost. What you both *rewrite* — a person's page, a topic — stops and asks you instead, on purpose: those are worth a decision.
- 🧭 **The context you are working in follows you.** If you keep several universes (a past employer, a client), switching on one computer lands the others in it too, so your notes stop contradicting the tools you have open.
- 🤫 **It stays out of your way.** It only reaches for the network when your brain has nothing half-written in it, one machine at a time, and it never interrupts what you are doing.

**When two of you use one brain.**

- 👥 **The same thing captured twice is stored once.** You and a colleague both come out of the same meeting and both ask your brain to keep it: it recognises that it already holds that source, and does not write a second copy.
- 📆 **You both keep writing on the same day without colliding.** Two people's write-ups of the same day become one note each rather than one contested file.
- 📖 **And what sharing a brain does — and does not — do is written down.** The short version: it shares what you wrote down, not what you can see. Your mail, your messages, your calendar stay yours; a shared calendar is the one thing that crosses over. [SETUP §7](https://github.com/tpierrain/kenjaku/blob/main/SETUP.md) has the honest perimeter, worth two minutes before you invite anyone in.

### What you have to do

Ask for **`/update-engine`** once, on each computer.

Nothing is re-read and nothing is re-encoded: your notes and your search index are untouched. If you have never wired up a repository of your own, this release changes nothing for you and costs you nothing.

---

### Under the hood

**Where the clock lives, and why there.** The pull runs from the search server the brain already keeps open for a session, on an interval (default 15 minutes, `REMOTE_SYNC_INTERVAL` in `.env`, `0` to disable), and it is bound to that session's lifetime through the existing shutdown seam — a loop that outlived its window would keep pulling into a brain nobody is looking at, and fight the next session for git's index lock. The tick defers entirely on a dirty tree, and a lock file makes exactly one machine's window tick per interval however many are open.

**The merge rule was narrowed, on the owner's challenge.** `merge=union` keeps both sides' lines with no marker and no question — the right resolution for a ledger nobody rewrites, the wrong one for a page two people edit. It is now scoped to the append-only zones alone (`daily/`, `raw-sources/`, `inbox/`, `actions-log.md`), with git's ordinary conflict behaviour restored on `people/`, `topics/`, `decisions/` and `meetings/`. The patterns match inside a universe as well as at the root. A merged note whose header no longer parses aborts the tick, judged by the engine's own parser.

**Source identity.** A captured source now carries a key derived from what it *is* rather than from who fetched it, so two people capturing the same meeting resolve to one note. The lookup is deterministic, the writer guard refuses a known duplicate on the deterministic path, and per-person paths keep two syntheses of one day from colliding.

**A defect the field rehearsal found, and fourteen green tests did not.** The release was rehearsed against a copy of a real brain, updated by the *old* engine so the migration ran the way the field will run it. Three windows ticking at once, two got through the gate: the lock file was created empty and filled a moment later, so a rival reading it in that window found no holder and stole a lock whose owner was mid-fetch. Microseconds wide, hit in three rounds out of four. The lock is now written elsewhere and hard-linked into place, so it appears already naming its holder. Every one of the fourteen existing tests ran in one process and injected its own liveness, so together they proved the gate's *decisions* and none of them proved its *exclusion*, which happens between operating-system processes. The new test races four real processes released by a barrier file, twelve rounds, and demands exactly one winner; it fails all twelve on the old code.

**Migration.** Brains that predate this release get the new ignore rules and the delivered `.gitattributes` at their next engine update, so nothing has to be done by hand. `indexSchemaVersion` is unmoved: no reindex is owed.

**Quality.** Mutation-tested on both halves of what this release writes: the search-server half **82.89 % → 97.37 %**, the harness half **97.22 %** and **82.14 % → 100 %** across two batches. Every survivor left is a named equivalent. The findings are in `maintainers/mutation/RESULTS.md`, newest-first — including a guard whose three riders no test ever saw apart, and the mutation runner's own refusal of a measurement it had really made. Documentation follows: ADR 0011 gained the trigger row for this clock, and the marketing surface was re-read whole (§10) — one absolute promise this release turned into a half-truth, *"you share the generator, never the brain"*, corrected where it appeared.
