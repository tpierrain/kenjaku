# v5.0.0 — The One Where Your Edits and Its Updates Finally Merge

> 🚧 **DRAFT — S9-1b. The body below is written to be published as-is.** Written per
> `CONVENTIONS.md` §11 (non-developer first, technical depth kept and moved below the `---`) and §10
> (the marketing surface was re-read first, in S9-1a).
>
> ✅ **TITLE — DECIDED BY THOMAS, 2026-08-22.** `The One Where Your Edits and Its Updates Finally
> Merge`. **His framing, asked for twice and it is the correction that matters**: the title must name
> **the merge itself** — Kenjaku folds its new work into your own edits at update time — not the
> promise (*your words are never lost*) nor the symptom (*it stops leaving you behind*) nor what you
> see (*it finally asks*). Those three candidates were mine and are **superseded**; they are not kept
> here, because a list of rejected titles beside a decided one is an invitation to re-open it.
>
> ✅ **SEVEN BULLETS, and that is DECIDED too** _(Thomas, 2026-08-22)_. `What you get` carries **seven**
> where §11 allows six, deliberately: nothing is folded, and nothing is promoted from the doctrine
> cargo that sits below the fold. **The question is closed, not open** — it had been put as *"which six
> of the ten things this release gives a user get said out loud"*, and the answer is *"the seven that
> are written, as they are"*.
>
> - The seventh (🔗 *hand it a link or a file*) rode in with the source-first rule, a different subject
>   on the same release. Keeping it is the point: dropping it silently would be the very *"nobody was
>   told"* defect this release exists against.
> - The doctrine cargo stays **below the fold** — no more silent rituals (#61), a rule that stopped
>   arguing with itself (#67), conversations that run out of room later (#64). Not a verdict that they
>   matter less; a judgement to hold §11's shape.
>
> ✅ **THE LAST OWED WRITE IS DONE** _(2026-08-22, W3)_: the regimes call came back as **(a)**, *with
> the write guard's widening called out in the release note*. It is written **twice** — as what was
> built, in the owner's terms, and under *honest limits* as the widening they will feel. It replaced a
> sentence rather than joining one: the limits section still said *"a brain keeps its install-day list
> of which files the engine manages"*, and W3 made that false.
>
> ✅ **RE-READ END TO END against what W1/W2/W3 actually shipped** _(2026-08-22, W4)_. Three things had
> gone stale and are fixed: this box, the suite figures, and the quality section's silence about
> Windows. The `82` byte-states and the retirement of `tdd-discipline` were **re-verified against the
> table and the manifest**, not assumed.
>
> 🗣️ **`What you get` REWRITTEN FOR A NON-DEVELOPER, on Thomas's re-read** _(2026-08-22)_. His verdict
> on the previous pass: *"trop cryptique … des mots simples et des exemples concrets"*. The seven
> bullets, their order and their subjects are unchanged; what changed is that each one now **names a
> situation the reader recognises** (two questions added to the 1-1 skill, a brain installed in June,
> a pasted URL) instead of describing the mechanism in the abstract — "keeps a private copy so it can
> tell your words from its own" is true and says nothing to someone who will never open a terminal.
>
> - 🧷 **Every bullet must stand ALONE, and the first one did not** _(his second pass, same day)_. It
>   opened *"what you wrote yourself no longer freezes the file"* — which never says **we are talking
>   about an update**. A reader who lands on that line, and not on the lead above it, cannot tell what
>   moment is being described. The claim now names it: *whatever you changed in the past no longer
>   stops that file from being updated*.
> - 🕰️ **GROUPED BY MOMENT, because a promise with no "when" is not a promise** _(his third pass, same
>   day: *"il faut expliquer dans quel cas … regrouper ces puces-là par moment ou use case"*)_. The
>   seven bullets were a flat list, so nothing said which of them happen **while your brain updates**
>   and which happen **in ordinary conversation** — the reader had to infer the moment from each
>   sentence. Now: *What you get, when you update your brain* (4 bullets) and *And what changes the
>   rest of the time, in ordinary conversations* (3), each under one line of plain framing. **Still
>   the same seven bullets**, unchanged in subject and order within their group, so the decision above
>   stands; §11's single `What you get` heading became two, deliberately.
>   - The lead gained its missing premise too: *Kenjaku keeps improving, and your brain picks up those
>     improvements when you ask it to update.* Everything below depends on that sentence and it was
>     never written.
> - 🚪 **AN OPENING SECTION, `What this release is about`** _(his fourth pass, same day)_. Two sentences
>   were not enough to state the subject: what this release exists for is a **problem people live
>   with**, and the note went straight to the fixes. It now says, before anything else, what a second
>   brain ships with, what happens the day you tailor a piece of it, and what v5.0.0 ends. The field
>   measurement (a skill frozen since install day with **not one line of its owner's in it**) moves up
>   with it — it is the proof the problem is real, and it was buried under the fold. §11's *two-sentence
>   lead* becomes this section, on the owner's explicit ask.
> - ↩️ **The body is written UNWRAPPED, one line per paragraph or bullet** _(his ask, same day)_. Hard
>   line breaks at ~100 columns are invisible once rendered and a nuisance in every editor that
>   reflows; the file is a body to be pasted, not source to be diffed line by line.
>
> - ⚖️ **This deliberately spends §11's brevity budget**: the rule says *"at most one sentence"* per
>   bullet, and a concrete example does not fit in one. The example is what makes the bullet land, so
>   it wins here — **but the rule was not rewritten on my own initiative**; §11 still reads "one
>   sentence", and whether it should say *"one sentence, or one concrete example"* is the owner's
>   call, raised with him the same day.
>
> **Numbers not yet real**: `engineVersion` and the tag are S9-2's, the owner's step. Every figure
> below the fold is measured and current; nothing here waits on a re-run.
>
> Everything after this note is the body verbatim.

---

### What this release is about

Your second brain arrives with ready-made pieces: the skills you call on, the rules it works by, the way it searches your notes. Kenjaku keeps improving them, and your brain picks those improvements up when you ask it to update. Sooner or later, though, you tailor one of those pieces yourself, because your brain is yours: a question added here, a sentence rewritten there.

**Until this release, that small gesture quietly cost you every future update of that file.** Your brain could no longer tell your words from its own, so it played it safe and left the file alone, for good. Kenjaku went on improving, other brains went on receiving it, and yours kept your version alone, without ever mentioning it. Measured on a real brain in the field: a ready-made skill frozen since install day, with **not one line of its owner's in it**.

**v5.0.0 ends the choice between a brain the way you want it and a brain that is up to date.** From now on your words are never lost: what shipped since either arrives around your edits, or your brain asks you which version you want.

### What you get, when you update your brain

*You ask for an update (once, see below); here is what changes in that moment.*

- ✍️ **Whatever you changed in your brain in the past no longer stops that file from being updated.** Say you added two questions of your own to the ready-made skill that prepares your 1-1s: from that day on, that file never received another improvement from Kenjaku's updates, ever. Now, when your brain updates itself, it remembers exactly what it handed you last time, so it can tell your words from its own — your two questions stay, and everything improved since arrives around them.
- 🙋 **When your words and the new version collide, it asks you rather than choosing.** Three answers, in plain language: keep mine, take the new one, or combine the two. Whichever you say, it does it — and it puts your current version safely aside first, so *"take the new one"* can always be undone.
- 🧊 **A brain installed months ago starts receiving again.** If yours has been running since, say, June, some of its files have had nothing from Kenjaku's updates since that day, and nothing ever said so. It can now recognise the files it was given on day one, even with no record of them, so the improvements shipped since finally reach it. This is the point of the release: the brains installed *before* it are the ones that gain the most.
- 📖 **The rulebook your brain follows can finally be updated.** Half of it is yours (who you are, how you like to be answered), half belongs to the engine (how it searches, when it asks before writing). The engine's half was stuck at install day on every existing brain; it now updates like everything else, without a word of your half being touched.

### And what changes the rest of the time, in ordinary conversations

*No update running, no command to type: this is your brain on an ordinary day.*

- 📣 **It tells you what it is keeping as you wrote it, and how far behind that leaves you.** Something like: *"I am still using your version of the 1-1 preparation; mine has moved on twice since."* Said between two updates, not only while one is running, until you answer.
- 🛡️ **It asks before changing one of its own files.** Ask it mid-conversation to adjust the way it searches, and it now says so out loud: *"that is one of my own files — do you confirm?"* One question, once, instead of discovering months later that your brain no longer matches what it ships.
- 🔗 **Hand it a link or a file, and it reads that first.** Paste a URL and ask what it makes of it: it opens the page before searching anything else, instead of answering from what it vaguely recalls of an article it never read.

### What you have to do

Ask for **`/update-engine`** once.

**Nothing is re-read and nothing is re-encoded**: your notes and your search index are untouched, so there is nothing to wait for. If the update asks you about a file you tailored, answering takes one sentence, and *"keep mine"* is a complete answer.

---

### Under the hood

**The defect this closes, in one paragraph.** An engine file was refreshed only when its recorded fingerprint proved it untouched. The moment an owner edited one, that proof failed forever: the file was preserved, the update said nothing, and every later update re-confirmed the freeze in silence. On a brain measured in the field, a skill with **zero lines of the owner's in it** had been frozen since install day. Two populations were affected, and they needed different answers — brains that never recorded a proof at all, and brains whose owner had genuinely edited the file.

**What was built**

- **An immutable base** (`.engine-base/`): the bytes the engine last *delivered* to each file it manages, kept in the brain and proved by the digest already recorded. Comparison had only ever left two outcomes — clobber the owner, or abandon the file — and the engine had chosen abandon.
- **A real three-way merge**, with a nine-row verdict table: refresh, preserve, merge, conflict, and the reasons that separate them. The base advances to what the engine **delivered**, never to what was written — the rule that keeps a merged file from reading as untouched at the next update.
- **A write guard**: an engine-owned file cannot be changed during ordinary work without an explicit confirmation, which is what stops a brain from drifting silently between updates.
- **An audible divergence**: the standing report of which engine files a brain is holding back, and since which engine version each of them last received bytes.
- **Your brain's list of what the engine manages now moves with the engine.** Until this release a brain kept, for its whole life, the list it was installed with. A family the engine only started managing later was offered during an update and then invisible to everything between two updates, and a skill the engine had retired went on being treated as engine-managed. An update now brings that list up to date. It is also what widens the write guard: it reads the same list, so it will ask about files it used to let through, and stop asking about the ones the engine no longer ships.
- **The doctrine layer joins a regime**: `CLAUDE.engine.md` is delivered like everything else, while the owner's own `CLAUDE.md` stays off the copy path entirely.
- **Subtractive delivery**: a skill the engine no longer ships is retired **by name, with its successor named beside it** — this release retires `tdd-discipline` and installs `test-first-discipline`. A tailored version of a retired skill is kept, never deleted.
- **The heal**: a brain proves its own installed bytes by membership in a table of every byte-state the engine ever published (82 of them at this release). A file that matches one has, by definition, never been edited — so a brain with no recorded proof recovers one and stops being frozen.
- **The ancestor fetch**: when a file's digest is recorded but its bytes are not, the engine fetches that exact version from the published tag the digest names, so a genuinely edited file can be *merged* instead of abandoned. Best effort by design: offline, or on a tag that has gone, the file is preserved exactly as before and the report says so in one line.
- **The three offers**: a preserved file now carries the engine's version beside it, the update names that path, the `update-engine` skill turns it into a conversation, and a command carries out the answer (`node scripts/adopt-engine-file.mjs <file> take-theirs|keep-mine|combine --from <path>`). An answer is recorded **against the engine version it was given at**, so a new release re-opens the question with no timer and no rule.
- **A locale drift guard**: the French tree can no longer fall behind its English source without a test naming the file and the commit that left it behind.
- **A level 1 in the routing doctrine**: the routing table had rows for semantic, exact and structural retrieval and none at all for *a source the owner handed over*. It now opens with one, in both languages, above the search routing rather than below it — and a guard holds the rule, its wording and its position. It rides this release for a reason: it is doctrine, and doctrine is exactly what the fleet stopped receiving.
- **Your brain runs out of room later**: when it opens something big just to see what is in it, it now sends a helper to read it and bring back the gist, past a stated size rather than by feel. Files it is actually editing, or quoting word for word, it still reads itself. In practice: fewer conversations that hit their limit and reset in the middle of your work.
- **A rule that stopped arguing with itself**: one of the engine's own tool rules stated a constraint that is true of the desktop app in its default mode as if it were true everywhere. A brain running elsewhere hit the contradiction and asked *its owner* to settle a rule the owner is told not to edit. It now says which surface it is talking about, and that falling back is expected rather than a defect worth reporting.
- **No more silent rituals**: when something your brain does was triggered by a *signal* rather than by a request — you ending a session, a question whose answer may have moved — it says so in one line before doing it, instead of leaving you in front of an unexplained pause. The engine already required this for its background source sync; the rule is now general, and stated above both places that use it.

**Honest limits, stated rather than discovered**

- Two edits in the **same region** of a file still conflict. That is correct, and it is visible: the file is left exactly as the owner wrote it, and the marked-up merge sits beside it for a walkthrough rather than being installed.
- The ancestor fetch needs the network and a tag that still exists. Neither is assumed.
- Updating **widens what your brain asks you about**, and that is the intended effect of the list advancing (see *What was built*). The families the engine manages have grown since the older releases, so on an old brain the write guard will start asking before an ordinary edit touches a file it used to let through — the engine half of the constitution, most of all. Nothing is written without you; the change is in how often you are asked, and it settles as soon as your brain is up to date.

**Quality**

- Full suite green: **2 474 tests, 2 471 passing, 3 skipped, none failing**. Mutation is measured per block and scoped to the change, with every survivor either killed or documented as equivalent — figures in `maintainers/mutation/RESULTS.md`.
- The release's acceptance test runs against **brains rebuilt from real published tags** (`v3.2.2`, `v3.6.0`), with files edited *before* this release, so the promises above are checked on real released content rather than on a fixture written by someone who already knew the answer.
- **And it runs on Windows, not only on a Mac.** That is not a formality here. A Windows brain records its files in a different byte-form from the day it is installed, and the headline promise — *a file you tailored is merged rather than abandoned* — was **silently false there**, on a suite that was green on a Mac. It is repaired, delivery is pinned so it cannot come back on a new install, and both are proved on a real Windows machine in CI. The check that proves them **fails rather than passing quietly** if the machine it lands on cannot reproduce the condition it is testing for.
- Findings caught before the tag stayed before the tag. Nothing in this list shipped to anyone.
