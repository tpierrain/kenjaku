<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- STATUS: 🔬 FIELD STUDY (opened 2026-09-01) — no code, no track, no branch.  -->
<!-- A brain owner wants to hand one of their brains to a second, trusted human, -->
<!-- at short notice. This file records what Kenjaku VERIFIABLY does today on    -->
<!-- that path, what to do with zero code, and what the case reveals about the   -->
<!-- product. It is deliberately generic: the repo is public, and nothing about  -->
<!-- the person, their business or their timeline belongs here. Nothing here is  -->
<!-- a chantier; tracker candidates are candidates, and the owner of this repo   -->
<!-- decides which ones become issues.                                           -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Study — two humans, one brain (handing a brain to a second person)

- **STATUS:** 🔬 Field study. Nothing implemented, nothing branched. The runbook below is a
  procedure for two humans, not work tracked in this repo.
- **Scope:** Second brain (runtime) — git sync between machines, the `.md`-only index, the
  connectors' account binding — plus the product's one-brain-per-person doctrine.
- **Origin:** a field request relayed by the maintainer, 2026-09-01, stripped of anything that
  describes the requester. The shape: a brain owner runs a personal-affairs brain (a business
  side, distinct from any employer's brain). A trusted second person — think an assistant, a
  finance officer — joins them at short notice. The owner wants that person to see everything
  the brain knows, and to stay in step afterwards: calls, mail, decisions. The owner's history
  is **not** in the brain: a multi-gigabyte document archive on a cloud-synced folder (iCloud
  Drive, in the observed case) and years of mail (Gmail).
- **The owner's own two ideas, and where they land:** Notion as a shared surface (rejected:
  too much to move, and a second copy of the truth); the brain's existing git remote (kept, with
  guard rails: it is the right lever, and two people are, to git, exactly two machines).

## 1. The need, taken apart

"Give them my brain and keep them in sync" is three different problems wearing one sentence.
They have three different right tools, and conflating them is what makes Notion look like an
answer.

| Problem | What it really is | Right tool | Who is the writer |
| --- | --- | --- | --- |
| **A. The notes** the newcomer must read and add to | a shared, versioned Markdown vault | **git**, which the brain already drives | both humans |
| **B. The archive** (gigabytes on a cloud folder) | a document store too big and too binary for git or the index | **the folder itself**, shared by the cloud provider, searched by Spotlight, opened on demand | nobody: it is a read-only past |
| **C. The mailbox** (the owner's, past and future) | an account-bound source the connector can only read as its owner | **the owner's brain, as writer of record**, distilling mail into notes that then travel by git | the owner (or their brain, unattended) |

Everything below follows from that split.

## 2. What Kenjaku verifiably does today (facts, not hopes)

Each line was checked in the code on 2026-09-01. A second person hits every one of them.

- **One brain per person is the stated doctrine, and there is no multi-user mechanism.** *"We
  share the generator, not the brain"* ([`EN-QUOI-C-EST-DIFFERENT.md:119`](../../EN-QUOI-C-EST-DIFFERENT.md)).
  No ADR, skill or setting knows about a second human, a guest, or read-only access. The only
  multi-user thought in the corpus is a per-person Notion OAuth deferred to a hypothetical
  hosted service ([archived PRD §permissions](../plans/archived/prd-golden-source-sync.md)).
- **Universes are a relevance scope, never a wall.** ADR 0034 forbids describing them as
  isolation: *"a bug, a future skill, Obsidian, git or grep can cross it"*
  ([0034 §crux](../decisions/0034-progressive-disclosure-of-universes.md)). So a universe cannot
  fence off "what the newcomer may see". The fence is the repo boundary, nothing finer.
- **Multi-machine sync exists and is the whole lever.** Commit on every write
  (`scripts/auto-commit.mjs`), push once per turn on the `Stop` hook **only if**
  `secondbrain.autopush` is `true` (`scripts/lib/git-push.mjs`), sweep-then-`pull --rebase` at
  every session start (`scripts/lib/startup-sync.mjs`), and `/sync` mid-session with an
  interactive merge/abort on conflict (`.claude/skills/sync/SKILL.md`). A second machine is a
  clone plus `node scripts/rehydrate.mjs` plus its own `.env` ([SETUP §7](../../SETUP.md)).
- **The index does not travel and rebuilds itself.** `rag/.cache/` is gitignored; the first
  rooted session indexes the clone, and the file watcher indexes pulled notes within seconds.
  Nothing to do on that front for a second person.
- **The index reads `.md` only, from one root.** `rag/src/lib/document-scanner.ts` keeps
  `*.md` and nothing else. No PDF, docx or xlsx extraction anywhere in the engine. `VAULT_DIR`
  can point at an absolute external path, but `BRAIN_ROOT` cannot follow it, so relocating the
  vault into a cloud folder would index it and silently stop committing it.
- **No size guard, no attachment policy, no LFS.** `git add .` takes whatever is in `vault/`.
  A multi-gigabyte folder dropped in the vault would be committed, pushed until GitHub refuses
  it (100 MB per file, and a repo of several GB is out of policy), and still invisible to search.
- **Connectors are bound to the Claude account at the keyboard.** Gmail, Calendar, Drive are
  native connectors: the newcomer's Claude sees *their* accounts, never the owner's.
  `sync-sources` is read-only, writes to `vault/briefings/`, `vault/actions-log.md`,
  `vault/people/`, `vault/topics/`, and fires only when a question is asked. There is no
  scheduler, no daemon, no morning job.
- **Local mirrors are Notion-only** (`local-mirror/src/domain/types.ts`: `type: 'notion'` is a
  literal). The port/adapter shape would take a folder adapter; none exists.
- **`/import` copies any file, indexes only Markdown** (`scripts/lib/import-vault.mjs`). A PDF
  imported into the vault is committed and never searchable.
- **The committed pointer `.vault-rag/active-universe` follows a pull.** With two people
  switching universes, each keeps their own only *at conflict time*; a clean pull moves the other
  person's pointer silently (the drift already filed as
  [#72](https://github.com/tpierrain/kenjaku/issues/72)). Harmless if that brain has a single
  universe, which a personal-affairs brain most likely has.

## 3. Problem A — the notes: one repo, two clones, and the three places they collide

**Chosen: the newcomer clones the same private repo.** To git and to Kenjaku a second person is
a second machine, and that path is built, documented and exercised. The alternatives lose on
every axis: a second brain of their own with a mirror of the owner's (the mirror is Notion-only,
and the newcomer needs to *write*); a Notion export (a second truth, and the volume the owner
already refused); a shared folder without git (no history, no conflict detection, and the
auto-commit hook would fight it).

**What "in sync" means with this mechanism, said plainly.** Every conversation the newcomer
opens starts with everything the owner has written since their last one, and vice versa: the
pull is at session start. During a long session, `/sync` fetches the other person's work on
demand. Each side pushes at the end of each of its turns. The lag is therefore "one
conversation", not "real time", and for someone working from notes rather than from a live
feed that is the right grain. A push that loses a race (both pushed in the same minute) is
retried at the next turn, after the next session's pull has rebased it; nothing is lost, it
just arrives one turn later.

**Where two humans actually collide** (verified against what the constitution writes):

1. **The daily note.** `vault/daily/YYYY-MM-DD.md` is per *day*, not per person. Both writing on
   the same day means both append to the same file, and the rebase conflicts. Vault content is
   append-only by nature, so the `/sync` skill's "keep both" is always the right resolution, but
   the newcomer will meet that dialog in their first week. Cheap mitigation: each entry starts
   with the author's initials, so "keep both" never needs a human to sort out who said what.
   Real fix: per-person daily notes (see §6).
2. **`vault/actions-log.md`**, the append-only ledger `sync-sources` writes. Same shape, same
   mitigation, same real fix.
3. **The constitution says "the owner".** The committed `CLAUDE.md` is written for one person
   and names them. The newcomer's sessions will address them as the owner unless the
   constitution says who sits at the keyboard. Cheap mitigation: a short section in the
   owner-editable part of `CLAUDE.md` stating that this brain serves two people, naming both
   roles, and telling the session to read `git config user.name` to know which one is present.
   That is a paragraph, not a feature.

**The part nobody will think of on day one: git history is shared too.** The newcomer receives
every commit ever made in that brain, including notes the owner deleted. If anything in the
past of that repo is not for them, the clean move is a **fresh repo initialised from a snapshot
of the current tree**, with no history, and the owner's machine re-pointed at it. Ten minutes,
and it is the only moment this is cheap. It is the first question to settle (§7, Q1).

**Access mechanics, for completeness.** Private GitHub repo, the newcomer's account added as
collaborator. Their own Claude account with Claude Code. Their own embedder: `in-process` if
their machine has the RAM and is not an Intel Mac (nothing leaves their computer), otherwise a
key of their own, never the owner's, in their own `.env`. They run
`git config secondbrain.autopush true` in the clone or their notes never leave their machine.

## 4. Problem B — the archive: share the folder, never the repo

**Chosen: the folder stays on the cloud drive and is shared by the provider to the newcomer.**
iCloud Drive folder sharing (Drive, Dropbox and OneDrive have the same gesture) gives them the
same tree, kept in step by the provider, on their machine. Git never sees it, and should not:
the repo would blow past GitHub's limits, the index would not read a single page of it, and
every clone would drag gigabytes behind it.

**How the brain then uses it, with zero code.**

- **Discovery by content: Spotlight already indexes that folder**, including the text of PDFs,
  Word and Excel files. `mdfind -onlyin "<path to the shared folder>" "<terms>"` returns the
  matching files; the session then opens the right one with `Read`, which handles PDFs. A
  five-line "how to search the archive" paragraph in the owner-editable constitution is all the
  wiring needed. Two conditions: Spotlight must be allowed to index that location (System
  Settings › Siri & Spotlight), and the files must be **downloaded, not evicted**. iCloud's
  *Optimize Mac Storage* silently replaces cold files by placeholders, whose content Spotlight
  cannot see, so *Keep Downloaded* on that folder (or the optimisation switched off) is part of
  the setup on both Macs. A few gigabytes are nothing on a modern disk.
- **Discovery by name: a catalogue note in the vault.** A one-off script walking the shared
  folder and writing one Markdown note per top-level subfolder (path, file name, size, date)
  gives the RAG a searchable map of the archive: "the 2023 accounts of company X" finds the
  file even when the wording inside it differs. The catalogue is small, committed, and
  regenerated when the archive changes. It is the poor man's index, and it is enough to start.
- **What this does not cover, honestly.** Scanned PDFs without a text layer are invisible to
  Spotlight (OCR is a later step). And Spotlight is macOS: on Windows the cloud client syncs the
  folder but there is no `mdfind`; the catalogue note still works, content search does not.
  That is the first fact to check about the newcomer's machine (§7, Q3).

**Later, the proper version** (§6): a local-folder adapter for the mirror server, extracting
text from documents into derived notes under a gitignored subfolder of the vault, so each
machine indexes the archive locally and nothing heavy ever enters git.

## 5. Problem C — the mailbox: the owner's brain is the writer of record

**Chosen: mail enters the shared notes through the owner, not through the newcomer's
connector.** The owner's mailbox is the owner's account; the newcomer's Claude cannot read it
and should not try. What the newcomer needs is not the inbox, it is what the inbox *changes*: a
decision, a deadline, a counterparty's answer. That is exactly what `sync-sources` already
distils into briefings, people and topic notes when the owner asks their brain a question, and
those notes reach the newcomer by git like any other.

Three practical consequences:

- **The owner has to ask their brain questions for the flow to exist.** There is no scheduled
  pull; the delta arrives when the owner works. A habit as small as "one question every morning
  in that brain" is the whole synchronisation mechanism until a scheduler exists (§6).
- **For the human side of the newcomer's job, Gmail delegation is the right tool**, not the
  brain: Google's own "grant access to your account" (Settings › Accounts and Import) lets them
  read, search, send from and archive the owner's mailbox from their own Gmail, with no password
  shared, revocable at any time by the owner. Verified on Google's help page (2026-09-01):
  available on a personal `@gmail.com` account (up to ten delegates), the owner must verify
  their identity first, the invitation lasts a week, and it can take **up to 24 hours** to take
  effect, so it is a before-day-one step. A delegate does not see Drive-hosted attachments.
  Whether the Claude Gmail connector can see a delegated mailbox is **unverified** in Anthropic's
  docs, and the Gmail API does not expose delegated mailboxes for consumer accounts: assume not,
  and do not build on it. Delegation serves the human, not the brain.
- **Future mail flows to the newcomer's own account, so that *their* connector sees it:** a
  Gmail filter forwarding the relevant correspondents (or everything) to their address. Native,
  reversible by deleting the filter, future mail only, and the newcomer then holds a copy. This
  is the mechanism that lets the newcomer's *brain* read the owner's mail, and the recommended
  one (§7, Q5).
- **Considered and not recommended: binding the owner's Google account to the newcomer's
  Claude.** The owner could type their own credentials on the newcomer's consent screen, and
  revoke from their Google "third-party access" page. It reads the owner's whole mailbox, past
  included, but the connector reads **one** Google account per Claude account (the newcomer's
  own mailbox then disappears from their brain), and Anthropic documents no such pattern. Keep
  it as the fallback if the past mail ever has to enter the newcomer's brain.

**The mail history is left where it is.** Years of mail are neither a day-one job nor a good
first target: the retrieval that matters is the archive folder, and the connector already
searches the owner's past mail live when they ask. If a durable import is ever wanted, Google
Takeout gives an mbox that can be turned into one note per thread and dropped in the
gitignored derived folder of §6. Not before the two easy wins above have been used for a month.

## 6. What the case reveals about the product (candidates for the tracker, not commitments)

Kenjaku's doctrine is one brain per person, and this study does not contest it: what the case
shows is that the *machine* boundary and the *person* boundary are the same boundary in git,
and that the cost of a second person is a handful of collisions the product could remove one
by one. Each line below is the middle row of the studies README: real work nobody is doing.
The owner of this repo decides which ones become issues.

1. **Per-person append-only files.** Daily notes and the actions log keyed by person as well as
   by day (`vault/daily/YYYY-MM-DD.md` becomes two files, or two sections the merge never
   crosses). Removes the only structural conflict two humans produce.
2. **Who is at the keyboard.** A brain that knows its members (a short registry, `git config
   user.name` as the identity, the name injected at session start like the universe is) so the
   constitution stops assuming a single owner. The paragraph proposed in §3 is the manual
   version of this.
3. **A local-folder adapter for the mirror server**, with document text extraction (PDF, docx,
   xlsx, OCR later) into derived notes under a gitignored `vault/mirrors/<name>/` so the RAG
   searches an archive no clone ever carries. The port/adapter shape is already there; only the
   Notion literal stands in the way. This is the feature a multi-gigabyte folder is asking for.
4. **In-session pull on the local-mirror timer's pattern** (ADR 0032: session-scoped, never a
   daemon). Turns "in sync at the next conversation" into "in sync within minutes" for two
   people working the same afternoon.
5. **A size guard before commit.** Refuse, or at least warn on, a file above a threshold in
   `vault/` so a well-meaning drag-and-drop of an archive never reaches a push GitHub rejects.
   Cheap, and it protects single-person brains just as much.
6. **A "writer of record" note in the constitution templates**: when a connector is bound to
   one member's account, that member's brain distils it for the others. Doctrine, not code.

Two things are deliberately **not** on that list: a permission model inside a brain (ADR 0034
already says the fence is the repo, and this case confirms it: what the newcomer must not see
must not be in that repo), and a hosted multi-user service (the archived PRD's horizon, and far
beyond what a second person needs on day one).

## 7. The questions only the owner can answer, before day one

Written in the shape the *grilling* skill produces (a numbered frontier, each question with its
recommended answer). In the observed case the owner is not available for a session, so a proxy
answers from what they know and asks the owner only what they cannot infer.

1. **Is everything in that brain's past for the newcomer?** The clone carries the full history,
   deleted notes included. *Recommended:* if in doubt, a fresh repo from a snapshot of today's
   tree, no history; ten minutes now, impossible later.
2. **Does the newcomer write, or only read?** Everything above assumes they write (their own
   notes, their own briefings). *Recommended:* they write; a read-only newcomer is a reader of
   documents, and for that the provider's folder sharing alone would do.
3. **What is the newcomer's machine?** Mac or Windows, RAM, Intel or Apple silicon. Decides the
   embedder (local versus key) and whether content search of the archive works on day one.
   *Recommended:* a Mac with 16 GB, `in-process`, nothing leaves their computer.
4. **Which Claude account, paid by whom?** The newcomer needs Claude Code under an account of
   their own. *Recommended:* an account in the business's name, so the access can be revoked
   without touching the owner's.
5. **How does the newcomer's brain reach the owner's mail?** Delegation lets the human read
   the owner's mailbox; only forwarding puts mail where the newcomer's own connector can see
   it. *Recommended:* forwarding filter plus delegation, both native and reversible; binding the
   owner's account to the newcomer's Claude stays the fallback (§5).
6. **Is the brain single-universe?** If the owner uses universes in that brain, switching on
   one machine moves the other person's pointer at the next pull. *Recommended:* keep that brain
   to one universe; a separate brain per sphere already does the job universes would.
7. **Who owns the archive catalogue?** Someone regenerates it when the shared folder changes.
   *Recommended:* the newcomer, monthly.
8. **What must never leave the two machines?** Names the constraint on the embedder and on any
   later forwarding. *Recommended:* answer it in one sentence and write it at the top of the
   constitution's owner section.

**Round 1, closed on 2026-09-01 by the proxy:** the recommended answer was taken on all eight
questions (whole history shared, the newcomer writes, a capable Mac with the in-process
embedder, an account revocable without touching the owner's, forwarding plus delegation, one
universe, the newcomer keeps the catalogue, nothing leaves the two machines). Round 2 is the
frontier those answers opened: does the newcomer already hold a Google address (delegation on
a personal account and the connector both need one); which mail is forwarded, everything or a
list of correspondents; and who performs the day-one setup on the newcomer's machine.

## 8. The day-one runbook (a procedure for two humans, not a chantier of this repo)

Before day one, on the owner's side: answer §7; if Q1 says "not everything", re-initialise the
repo from a snapshot; add the two constitution paragraphs (who is at the keyboard, how to
search the archive); run the catalogue script once; share the cloud folder to the newcomer;
set *Keep Downloaded* on it; invite the newcomer's GitHub account to the private repo; grant
Gmail delegation (up to 24 hours to take effect) and create the forwarding filter.

On day one, on the newcomer's side, in this order: accept the shared folder and let it
download; clone the repo, `node scripts/rehydrate.mjs`, their `.env`;
`git config secondbrain.autopush true`; open a new conversation rooted in the brain and let the
first index run; ask the brain the question they actually have. The first answer that cites one
of the owner's notes and opens one PDF from the archive is the acceptance test.

## 9. On using the "grilling" skill to frame this

The skill (Matt Pocock, `skills/productivity/grilling`) interviews the person in rounds:
number every question whose prerequisites are settled, give a recommended answer with each,
wait, recompute the frontier, dispatch sub-agents for facts instead of asking, stop when the
frontier is empty and shared understanding is confirmed.

**It fits this need, with two adjustments.** It fits because the request arrived as one sentence
hiding three problems and eight decisions, and a frontier of numbered questions with
recommendations is exactly the artefact that closes such a brief without a meeting. And its
"send agents for facts, ask humans only for decisions" rule is the discipline §2 applied. The
two adjustments: **the person who holds the answers may not be the person in the chair**, so
the skill's live rounds become a written frontier (§7) that a proxy answers, asking the owner
only the one or two questions the proxy cannot settle; and the frontier must be **bounded**
(two rounds, then decide), because the deadline is a date, and a skill whose stop condition is
"shared understanding" has no clock. Used that way, it is the right first half-hour of any
brief like this one, and its output is the section above.
