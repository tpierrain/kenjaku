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
> 🆕 **STILL OWED TO THIS NOTE, and it is not a decision but a WRITE** _(2026-08-22)_: the regimes call
> came back as **(a)**, *with the write guard's widening called out in the release note* — that clause
> was part of the recommendation he took, so the note owes one honest line saying an update may now
> refresh a brain's list of engine-managed files. Not written yet.
>
> **Numbers not yet real**: `engineVersion` and the tag are S9-2's, the owner's step. Every figure
> below the fold is measured and current; nothing here waits on a re-run.
>
> Everything after this note is the body verbatim.

---

If you ever tailored one of your brain's ready-made skills, it quietly stopped receiving improvements
the moment you did, and nothing ever told you. **From this release your words are never lost**: what
shipped since either arrives around your edits, or your brain asks you which version you want.

### What you get

- ✍️ **A file you made your own stops being a dead end.** Your brain keeps a private copy of exactly
  what it gave you last time, so it can tell your words from its own. Where the two do not collide,
  both survive: your edits stay, and what shipped since arrives around them.
- 🙋 **When it cannot do that, it asks you — with three real answers.** In plain words: take the new
  version, keep yours, or combine the two. Say which, and it carries it out. Your current version is
  saved to your brain's history first, so *"take the new one"* can always be undone.
- 🧊 **A brain frozen since the day it was installed starts receiving again.** It can now recognise the
  files it was originally given, even with no record of them, so improvements shipped since your
  install finally reach you. This is the whole point of the release: it is the brains installed
  *before* it that gain the most.
- 📣 **It tells you what it is holding back, and since when — between updates, not only during one.**
  A file kept as you wrote it is named, with the version it is behind, until you answer. Answering
  settles it until the next release.
- 📖 **The rules your brain works by can finally be updated.** The half of its constitution that
  belongs to the engine was frozen at install day on every existing brain; it now travels like
  everything else, without touching a word of the half that is yours.
- 🛡️ **It stops drifting from the engine without you knowing.** When something is about to change one
  of the engine's own files during ordinary work, you are asked first, once, instead of finding out
  months later that your brain no longer matches what it ships.
- 🔗 **Hand it a link or a file, and it reads that before it searches anything.** A URL or a path in
  your message is the subject, not decoration — so you stop getting a confident answer built on what
  your brain *remembered* of an article it never opened.

### What you have to do

Ask for **`/update-engine`** once.

**Nothing is re-read and nothing is re-encoded**: your notes and your search index are untouched, so
there is nothing to wait for. If the update asks you about a file you tailored, answering takes one
sentence, and *"keep mine"* is a complete answer.

---

### Under the hood

**The defect this closes, in one paragraph.** An engine file was refreshed only when its recorded
fingerprint proved it untouched. The moment an owner edited one, that proof failed forever: the file
was preserved, the update said nothing, and every later update re-confirmed the freeze in silence. On
a brain measured in the field, a skill with **zero lines of the owner's in it** had been frozen since
install day. Two populations were affected, and they needed different answers — brains that never
recorded a proof at all, and brains whose owner had genuinely edited the file.

**What was built**

- **An immutable base** (`.engine-base/`): the bytes the engine last *delivered* to each file it
  manages, kept in the brain and proved by the digest already recorded. Comparison had only ever left
  two outcomes — clobber the owner, or abandon the file — and the engine had chosen abandon.
- **A real three-way merge**, with a nine-row verdict table: refresh, preserve, merge, conflict, and
  the reasons that separate them. The base advances to what the engine **delivered**, never to what
  was written — the rule that keeps a merged file from reading as untouched at the next update.
- **A write guard**: an engine-owned file cannot be changed during ordinary work without an explicit
  confirmation, which is what stops a brain from drifting silently between updates.
- **An audible divergence**: the standing report of which engine files a brain is holding back, and
  since which engine version each of them last received bytes.
- **Your brain's list of what the engine manages now moves with the engine.** Until this release a
  brain kept, for its whole life, the list it was installed with. A family the engine only started
  managing later was offered during an update and then invisible to everything between two updates,
  and a skill the engine had retired went on being treated as engine-managed. An update now brings
  that list up to date. It is also what widens the write guard: it reads the same list, so it will ask
  about files it used to let through, and stop asking about the ones the engine no longer ships.
- **The doctrine layer joins a regime**: `CLAUDE.engine.md` is delivered like everything else, while
  the owner's own `CLAUDE.md` stays off the copy path entirely.
- **Subtractive delivery**: a skill the engine no longer ships is retired **by name, with its
  successor named beside it** — this release retires `tdd-discipline` and installs
  `test-first-discipline`. A tailored version of a retired skill is kept, never deleted.
- **The heal**: a brain proves its own installed bytes by membership in a table of every byte-state
  the engine ever published (82 of them at this release). A file that matches one has, by definition,
  never been edited — so a brain with no recorded proof recovers one and stops being frozen.
- **The ancestor fetch**: when a file's digest is recorded but its bytes are not, the engine fetches
  that exact version from the published tag the digest names, so a genuinely edited file can be
  *merged* instead of abandoned. Best effort by design: offline, or on a tag that has gone, the file
  is preserved exactly as before and the report says so in one line.
- **The three offers**: a preserved file now carries the engine's version beside it, the update names
  that path, the `update-engine` skill turns it into a conversation, and a command carries out the
  answer (`node scripts/adopt-engine-file.mjs <file> take-theirs|keep-mine|combine --from <path>`).
  An answer is recorded **against the engine version it was given at**, so a new release re-opens the
  question with no timer and no rule.
- **A locale drift guard**: the French tree can no longer fall behind its English source without a
  test naming the file and the commit that left it behind.
- **A level 1 in the routing doctrine**: the routing table had rows for semantic, exact and structural
  retrieval and none at all for *a source the owner handed over*. It now opens with one, in both
  languages, above the search routing rather than below it — and a guard holds the rule, its wording
  and its position. It rides this release for a reason: it is doctrine, and doctrine is exactly what
  the fleet stopped receiving.
- **Your brain runs out of room later**: when it opens something big just to see what is in it, it now
  sends a helper to read it and bring back the gist, past a stated size rather than by feel. Files it is
  actually editing, or quoting word for word, it still reads itself. In practice: fewer conversations
  that hit their limit and reset in the middle of your work.
- **A rule that stopped arguing with itself**: one of the engine's own tool rules stated a constraint
  that is true of the desktop app in its default mode as if it were true everywhere. A brain running
  elsewhere hit the contradiction and asked *its owner* to settle a rule the owner is told not to edit.
  It now says which surface it is talking about, and that falling back is expected rather than a defect
  worth reporting.
- **No more silent rituals**: when something your brain does was triggered by a *signal* rather than
  by a request — you ending a session, a question whose answer may have moved — it says so in one line
  before doing it, instead of leaving you in front of an unexplained pause. The engine already
  required this for its background source sync; the rule is now general, and stated above both places
  that use it.

**Honest limits, stated rather than discovered**

- Two edits in the **same region** of a file still conflict. That is correct, and it is visible: the
  file is left exactly as the owner wrote it, and the marked-up merge sits beside it for a walkthrough
  rather than being installed.
- The ancestor fetch needs the network and a tag that still exists. Neither is assumed.
- Updating **widens what your brain asks you about**, and that is the intended effect of the list
  advancing (see *What was built*). The families the engine manages have grown since the older
  releases, so on an old brain the write guard will start asking before an ordinary edit touches a file
  it used to let through — the engine half of the constitution, most of all. Nothing is written without
  you; the change is in how often you are asked, and it settles as soon as your brain is up to date.

**Quality**

- Full suite green: **2 423 tests, 2 420 passing, 3 skipped, none failing**. Mutation is measured per
  block and scoped to the change, with
  every survivor either killed or documented as equivalent — figures in `maintainers/mutation/RESULTS.md`.
- The release's acceptance test runs against **brains rebuilt from real published tags** (`v3.2.2`,
  `v3.6.0`), with files edited *before* this release, so the promises above are checked on real
  released content rather than on a fixture written by someone who already knew the answer.
- Findings caught before the tag stayed before the tag. Nothing in this list shipped to anyone.
