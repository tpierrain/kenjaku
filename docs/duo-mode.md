# Duo mode — two people, one brain

Two people can share one second brain: the same notes, on two computers, kept in step on their own.
There is nothing to switch on. It is simply what happens once a second person works from the same
private repository.

This page is the whole thing: what it shares, what it does not, what each person does, and who
controls access. If you read one line, read this one.

> **Sharing a brain shares what you wrote down, not what you can see in your own tools**
> (mail, messages, calendar, Drive).

---

## 1. What travels, and what does not

- **Your notes travel, both ways.** Everything written into the vault becomes common ground:
  write-ups, person pages, captures, the activity log. Ask your brain what the other person noted
  about a client and it answers from their notes, because they are yours now too.
- **Your mail does not** — not even if you grant the other person access to your mailbox. This is
  the one that surprises everybody, and it has its own section below.
- **Direct messages do not**, ever, exactly as they are invisible to the other person in the app.
  Only what you can both see in a channel is common ground.
- **Chat workspaces do not add up.** Membership is per workspace: each brain sees the workspaces its
  own account belongs to. Being in the same *company* is not being in the same workspace, and the
  difference shows up as a search that comes back empty for no visible reason.
- **A shared calendar DOES travel.** It is the one exception, and it works properly — see below.

To put something in front of the other person, the way is the way it always was: write it down.

## 2. Before anyone joins: the invite, and what it means

The owner adds the other person as a **collaborator on the brain's private repository**. That is the
only administrative gesture, and it is a real decision.

> 🔐 A brain's repository holds your notes **and the code your brain runs** (`scripts/`, `rag/`). So
> anyone you let push to it can, in principle, have code run on your machine at your next session.
> That has been true since the day you wired a remote, and it is why the repository is **private**.
> Sharing a brain is the decision to share a machine, not the decision to share a document.

## 3. Joining — about ten minutes, once

From the person joining, on their own computer:

```bash
git clone <url-of-the-private-repo>
cd <brain-folder>
node scripts/rehydrate.mjs      # rebuilds this machine's wiring
```

A clone is not a working brain yet, and that is normal: two of the files a brain runs on hold
**absolute paths belonging to one machine**, so git never carries them. `rehydrate.mjs` rebuilds them
from the templates that did travel. It works offline and overwrites nothing.

Then two things it cannot do for you:

- **Re-enter the key**, if the brain uses an API embedder (Gemini/OpenAI/…). `.env` is never
  committed. A fully local brain (`in-process` / Ollama) has nothing to re-enter.
- **Open a NEW conversation rooted in the brain folder.** Claude loads the search server and the
  hooks when a session *starts*, so an already-open session keeps running on the old wiring.

That first rooted session also **indexes the vault**: a clone carries the notes but not the index. A
first-session banner announcing an empty index is expected — let the indexing run.

## 4. The question your brain will ask, and who answers it

All a brain knows about who writes here is the name git is configured with on each computer. If one
person's two machines spell their name differently (`Thomas Pierrain` on one, `tpierrain` on the
other), that looks exactly like a second person. It cannot tell, so it does not guess:

> **"I see a second name, X. Is that someone else, or you on another machine?"**

- **"It's someone else"** → duo mode is confirmed, your brain says in one sentence what changes, and
  the question is over.
- **"It's me"** → the two spellings are recorded as one person, and nothing of yours is ever filed
  apart again.
- **Either person can answer, from either computer.** The answer is stored with your notes and
  travels, so answering on one machine answers for both.
- **Until somebody answers, it asks at every session start** — a question nobody answered would
  otherwise leave the brain filing on a guess forever.
- **Changed your mind?** Answer the other way and it corrects itself.

**And an answer given on the other machine is announced on yours.** If someone declares two names to
be one person, your brain tells you, and keeps telling you until you confirm it. That is deliberate:
declaring two people to be one is the only answer that could otherwise hide a second person's
arrival from you.

The commands, if you would rather type them than say them:

```bash
node scripts/author-identity.mjs --same-person "<name>"   # that spelling is me, on my other machine
node scripts/author-identity.mjs --different "<name>"     # that really is a second person
node scripts/author-identity.mjs --list                   # what is recorded
```

## 5. Day to day

- **The notes come to you.** While a conversation is open, each brain checks about every ninety
  seconds whether the other machine pushed anything, brings in what it finds, indexes it, and tells
  you at your next message ("2 notes from Claire arrived: …") — plus a notification on your computer
  when the notes were written by someone else.
- **Writing on the same day does not collide.** Each person gets their own dated note rather than one
  contested file.
- **What you only ever add to merges by itself**: daily notes, inbox, imported raw sources, the
  activity log.
- **What you rewrite stops and asks**: a person's page, a topic. Keeping both halves of a page two
  people rewrote would leave it saying two contradictory things, and nobody would notice. Your brain
  says so at your next message and walks you through it; the `/sync` skill is there if you would
  rather do it yourself.
- **The same source captured twice is stored once.** If the other person already filed a mail or a
  meeting, your brain says so and offers to enrich the existing note instead of writing a second one.

## 6. Mail, in full — the part people expect and do not get

**Gmail delegation asks for no password.** In Gmail's settings the owner adds the other person as a
*delegate*; they then open the mailbox from **their own** Google account (the account switcher, top
right), reading, filing and replying "on behalf of". No credentials change hands. That is the right
way to delegate, and there is no need to look for another.

**But what delegation grants is their eyes, not their brain.** The tools a brain reads mail with read
**the mailbox of the account they are signed in as**, and have no field for naming another one. Not a
permission to tick, not a setting anyone can turn on, not something that opens up if you insist — the
button does not exist.

**This is exactly why a shared calendar does travel**: the calendar tools take a **calendar address**,
which is a field mail has no equivalent of. Share yours and the other brain reads your meetings the
way it reads its own. If you want one thing to be shared automatically, make it the calendar.

**And no, the answer is not to hand over your password.** Technically the only way a brain could read
another mailbox is to be signed in **as** that account. That is not delegation, it is account
sharing: it defeats two-factor authentication, most companies forbid it outright, and everything the
brain read, wrote or sent would carry the owner's identity, with no way left to tell who did what.

**What does work, in order of simplicity:**

1. **Read it with your eyes, then write the note.** The delegate reads the mailbox in Gmail and asks
   their brain to keep what matters. The note is written, and a note travels. No setup at all.
2. **Make the message land in their own mailbox.** An auto-forward rule on the senders or subjects
   that concern the work, or a shared address both accounts receive. Their brain then sees it like
   any other of their mail.
3. **Share the calendar**, which crosses over without a detour.

## 7. Who controls access — and how a duo ends

**The brain implements no access control at all, deliberately** (see
[ADR 0042](../maintainers/decisions/0042-access-belongs-to-the-git-host-the-brain-only-files.md)).

- **Who may write is the repository's collaborator list**, on GitHub or wherever the brain is hosted.
  It lives in the owner's authenticated account, with whatever second factor that account carries.
  **Nobody adds themselves.** Until the owner adds them, a would-be second person can neither read
  nor write a single note.
- **Ending a duo is removing that access.** There is nothing to un-declare inside the brain, no state
  to unwind, and no answer a former collaborator gave that matters afterwards.
- **The question in §4 is about filing, never about permission.** Answering it grants nobody
  anything: it decides whether two days become two notes or one.
- **No in-brain gate would help.** An author name is a line of git config; anyone who can push can
  already change it, rewrite any note, and run code on the other machine. A gate built inside the
  brain would protect nobody while looking as if it did.
- **Stronger guarantees exist, and they are the host's**: signed commits, branch protection, required
  reviews, SSO. They compose with everything above.

## 8. Questions people actually ask

**Can I see what the other person did?** Yes, through the repository's history: every note is
committed under its author's name, so who wrote what, when, and what exactly changed is on record.
Today that is history to read, not a command in the brain — see §9.

**Can I keep their notes separate from mine?** No. The vault is common by design; the only separation
is that each person's dated notes are their own.

**They left the project. What now?** Remove their access on the host. What they already read, they
read — treat it as seen, exactly as after sharing any machine.

**Can we be three?** Nothing forbids it, and nothing is built for it either: the question in §4 is
asked for each new name, and the dated notes stay one per person. Beyond a small number of people,
this is not what the product is for.

**Does the other person's brain answer with my notes?** Yes — that is the point. Their brain reads
the same vault.

**Can I stop sharing one particular note?** Not selectively. The vault travels whole. If something
must not be shared, it does not belong in a shared brain.

## 9. Auditing who wrote what — what exists, and what does not

**What exists today**: every write is committed under its author's name, so the repository's history
answers "what did this person write, and when" precisely, note by note. Since v5.1.0 the notes a
brain writes also carry an `author:` field of their own, so the answer no longer depends on
history alone.

**What is not built**: any command that gathers, exports or isolates one person's contributions. The
metadata is being laid deliberately so this can be built later — it is not a promise that it exists
now.
