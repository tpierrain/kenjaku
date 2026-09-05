# v5.1.0 — The One with the Duo Mode

> **This file mirrors the release body to be published.** Written per `CONVENTIONS.md` §11:
> non-developer first, technical depth kept but moved below the `---`. Mutation figures pinned from
> the runs of 2026-09-03 (rag half, then the two `scripts/` batches).
>
> 🏷️ **TITLE SETTLED BY THE OWNER** _(2026-09-03)_: **"The One with the Duo Mode"** — his own, not
> one of the candidates put to him. It is **`The One WITH…`**, and that is the point: the series here
> had drifted to `The One Where…` throughout, while the source it echoes uses `The One with…` far more
> often. Recorded so the next release knows **both forms are open**.
>
> ❌ **A reservation was raised and it was WRONG** — recorded because the reasoning is reusable. I
> objected that *"duo mode"* is our vocabulary and no user has read it, against the series' habit of
> naming what the person lives. His answer: **it is a MARKETING term for a capability that did not
> exist before**, and a feature's name is new vocabulary *by construction* — the title is how the
> name enters the language. "Name what the person lives" governs describing a **symptom**; it does not
> govern **christening** something new. Most people will never turn duo mode on, and that is fine: it
> is named for the people who will.
>
> ➡️ **The consequence, and it was work rather than a note**: if *duo mode* is the name, the release
> must actually use it. The note's lead now introduces it in those words, its `What you get` moment is
> headed *"Duo mode"*, and the marketing surface says it too — `SETUP.md` §7's subsection, EN-QUOI's
> Sharing row and the README's close. A name that appears only in a release title is not a name.
>
> 🔁 **AND THE NAME MUST LEAD, NOT TRAIL** _(2026-09-04, the owner, reading the note)_: *"c'est comme
> si on disait que le duo mode était un side effect alors que c'était ça le driver."* He is right, and
> the plan's own header proves it: #84 was surfaced by
> [`two-humans-one-brain-study.md`](../../studies/two-humans-one-brain-study.md), whose origin is a
> brain owner handing their brain to a second person, and which calls the machine-to-machine sync
> **"the whole lever"** — the means, not the end. The intro was written the other way round: the sync
> first, duo mode as an *"and it also…"* in the last paragraph. **The intro is now led by duo mode**,
> with the live catch-up presented as what making it work bought everyone. Generalisable: this is the
> same defect as the note above, one layer up. Using the name is not enough if the structure still
> reads the feature as a side effect. **A release note's order is a claim about what mattered.**
>
> The candidates it beat, kept only so they are not re-proposed: *"…Where Your Two Computers Stop Drifting Apart"*, *"…Where It Catches Up on Its Own"*,
> *"…Where the Other Machine Gets a Word In"*, *"…Where Your Brain Isn't Tied to One Machine, or One
> Person"*.
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

> ### v5.1.0 lets two people share one second brain — and keeps every machine it runs on in step by itself.

A second brain has always been one person's. The moment someone else worked in it too — an assistant, a colleague, someone joining you at short notice — the two of you wrote over each other: the same meeting captured twice, the same day's page contested, and each machine answering from whatever it last heard.

**v5.1.0 makes two people in one brain actually work, and it calls that *duo mode*.** What you both only ever add to merges on its own, and the same thing captured twice is stored once. Nobody is asked, and nothing is lost.

**Getting there meant fixing something every one of us gets for free.** To a brain, two people are simply two machines — and until now a brain caught up only when a conversation started. That was a deliberate choice: a brain that reaches for the network in the middle of your work is a brain that can interrupt it. The cost landed elsewhere, though. Leave a window open all afternoon on one machine, write on the other, and the first one keeps answering from what it knew this morning, with nothing on screen to say it is behind. **Now an open brain keeps itself up to date, quietly**: it notices what the other one wrote, brings it in on its own, and tells you at your next message.

**So this release lands twice over.** Share a brain with someone, and that is new ground. Work alone across a laptop and a desk, and you get the thing you never thought to ask for: a brain that stops trailing behind you.

### What you get

*Nothing to install and nothing to switch on: an engine update is enough, and this only ever concerns brains that have a repository of their own.*

**Duo mode — when two of you work in one brain.** Nothing to turn on: your brain notices on its own that a second name is writing here — and rather than decide what that means, it asks you.

- 🙋 **It asks instead of assuming, because it cannot tell.** Your two computers may spell your name slightly differently, and from the inside that looks exactly like a colleague. So your brain puts the question to you once — *someone else, or you on another machine?* — and remembers your answer on both computers. Say it is you, and nothing of yours is ever filed apart.
- 👥 **The same thing captured twice is stored once.** You and a colleague both come out of the same meeting and both ask your brain to keep it: it recognises that it already holds that source, and does not write a second copy.
- 📆 **You both keep writing on the same day without colliding.** Two people's write-ups of the same day become one note each rather than one contested file.
- 📖 **And what sharing a brain does — and does not — do is written down.** The short version: it shares what you wrote down, not what you can see in your own tools. Your mail, your messages, your calendar stay yours; a shared calendar is the one thing that crosses over. [SETUP §7](https://github.com/tpierrain/kenjaku/blob/main/SETUP.md) has the honest perimeter, worth two minutes before you invite anyone in.

**And underneath it, for everyone: while a conversation is open, on either machine.**

- 🔄 **Your brain notices what the other computer wrote, and goes and gets it.** You spend the morning on your laptop, then move to your desk after lunch and leave the laptop's window open. It catches up on its own rather than waiting for you to start a fresh conversation there.
- 💬 **It tells you what arrived, at your next message.** One sentence, in your own language, before it answers you: what came in and who wrote it. Not a notification you have to go looking for.
- 🔔 **And it says so even if you are in another app.** A discreet notification from your system, once, and only when what arrived was written by someone other than you.
- ✍️ **Two notes added the same afternoon to the same daily note are both kept.** Nobody is asked and nothing is lost. What you both *rewrite* — a person's page, a topic — stops and asks you instead, on purpose: those are worth a decision.
- 🧭 **The context you are working in follows you.** If you keep several universes (a past employer, a client), switching on one computer lands the others in it too, so your notes stop contradicting the tools you have open.
- 🤫 **It stays out of your way.** It only reaches for the network when your brain has nothing half-written in it, one machine at a time, and it never interrupts what you are doing.

### What you have to do

Ask for **`/update-engine`** once, on each computer.

Nothing is re-read and nothing is re-encoded: your notes and your search index are untouched. If you have never wired up a repository of your own, this release changes nothing for you and costs you nothing.

---

### Under the hood

**Where the clock lives, and why there.** The pull runs from the search server the brain already keeps open for a session, on an interval (default 15 minutes, `REMOTE_SYNC_INTERVAL` in `.env`, `0` to disable), and it is bound to that session's lifetime through the existing shutdown seam — a loop that outlived its window would keep pulling into a brain nobody is looking at, and fight the next session for git's index lock. The tick defers entirely on a dirty tree, and a lock file makes exactly one machine's window tick per interval however many are open.

**The merge rule was narrowed, on the owner's challenge.** `merge=union` keeps both sides' lines with no marker and no question — the right resolution for a ledger nobody rewrites, the wrong one for a page two people edit. It is now scoped to the append-only zones alone (`daily/`, `raw-sources/`, `inbox/`, `actions-log.md`), with git's ordinary conflict behaviour restored on `people/`, `topics/`, `decisions/` and `meetings/`. The patterns match inside a universe as well as at the root. A merged note whose header no longer parses aborts the tick, judged by the engine's own parser.

**Source identity.** A captured source now carries a key derived from what it *is* rather than from who fetched it, so two people capturing the same meeting resolve to one note. The lookup is deterministic, the writer guard refuses a known duplicate on the deterministic path, and per-person paths keep two syntheses of one day from colliding.

**Who is a second person, and who is a second machine.** All a brain has to go on is the author name git is configured with, so one owner whose two computers say `Thomas Pierrain` and `tpierrain` is the same evidence as two colleagues. It may *file* on a guess — a file in an unexpected place is visible and reversible — but it may not *assert* one, so the sentence this used to be is now a question, asked at the start of every session until it is answered either way. The answer lands in `.vault-rag/authors.json`, committed and pushed like the universe pointer beside it: the question is about the *other* machine, so an answer that stayed local is one that machine would ask for again. Everything that compares two names — the note paths, the arrival notification, the session line — resolves through that one registry.

**A defect the field rehearsal found, and fourteen green tests did not.** The release was rehearsed against a copy of a real brain, updated by the *old* engine so the migration ran the way the field will run it. Three windows ticking at once, two got through the gate: the lock file was created empty and filled a moment later, so a rival reading it in that window found no holder and stole a lock whose owner was mid-fetch. Microseconds wide, hit in three rounds out of four. The lock is now written elsewhere and hard-linked into place, so it appears already naming its holder. Every one of the fourteen existing tests ran in one process and injected its own liveness, so together they proved the gate's *decisions* and none of them proved its *exclusion*, which happens between operating-system processes. The new test races four real processes released by a barrier file, twelve rounds, and demands exactly one winner; it fails all twelve on the old code.

**Migration.** Brains that predate this release get the new ignore rules and the delivered `.gitattributes` at their next engine update, so nothing has to be done by hand. `indexSchemaVersion` is unmoved: no reindex is owed.

**Quality.** Mutation-tested on every half of what this release writes: the search-server half **82.89 % → 97.37 %**, the harness half **97.22 %** and **82.14 % → 100 %** across two batches, and the duo-mode question — the part the release was held for — **84.60 % → 98.92 %** on the three files it adds, **92.02 % → 95.45 %** on what it changed elsewhere. Every survivor left is a named equivalent. The findings are in `maintainers/mutation/RESULTS.md`, newest-first — including a guard whose three riders no test ever saw apart, and the mutation runner's own refusal of a measurement it had really made. Documentation follows: ADR 0011 gained the trigger row for this clock, and the marketing surface was re-read whole (§10) — one absolute promise this release turned into a half-truth, *"you share the generator, never the brain"*, corrected where it appeared.
