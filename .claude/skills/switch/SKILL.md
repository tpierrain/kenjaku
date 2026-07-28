---
name: switch
description: "Switch the ACTIVE UNIVERSE of this brain, or create a new one (ADR 0034). A universe is a soft retrieval scope (e.g. successive employers, clients, spheres): when you work one universe, searches default to its notes plus your cross-cutting ones. Use when the user wants to switch / change / set the current universe / context / scope, list their universes, or create / add a new universe / context (e.g. 'switch to the acme universe', 'change de contexte', 'crée un univers Blue Team', 'in which universe am I?', 'liste mes univers'). This is invisible until a second universe exists. Switching itself does NOT touch notes and needs no reindex — it only re-points which universe is active. It ALSO records a universe's PROFILE — what this sphere is, your role in it, the people who matter, the recurring topics, and which accounts your tools use here — so use it whenever the user accepts (or declines) to describe their context, or asks to fill in / update it (e.g. 'yes, let's describe my context', 'oui, décris mon contexte', 'update who I work with'). It also RENAMES a universe ('rename acme to Acme Corp', 'renomme cet univers'). It is also the one door to DELETING a universe — deliberately inconvenient, never offered, opened only when the user explicitly asks to delete one ('delete my acme universe', 'supprime cet univers')."
version: 1.5.0
---

# /switch — Change or create the active universe (opt-in, no reindex)

> Brain-side skill. A **universe** (ADR 0034) is a **soft, engine-enforced retrieval scope** over
> the one shared vault: while a universe is active, `search_vault` returns that universe's notes
> **plus** your cross-cutting (default) notes, and nothing from the others, unless you explicitly
> ask for "all universes". It is a **relevance** feature, never an isolation wall (a bug, Obsidian,
> git or grep can cross it, and for a private brain that is fine).
>
> ⚠️ **This is a thin conversational driver.** All the real, testable logic lives in the
> deterministic core `scripts/set-active-universe.mjs` + `scripts/lib/universes.mjs` (ADR 0009).
> This skill only **reads the current state, runs that core, and reports** — it holds no logic and
> makes no scope decision of its own (the engine reads the active pointer itself, per search).

## When to use it

Load this whenever the user wants to change context or manage universes, in plain language, any
language:

- *"switch to the acme universe"* · *"passe sur l'univers acme"* · *"change de contexte"*
- *"create a universe Blue Team"* · *"crée un univers Blue Team"* · *"add a new context"*
- *"which universe am I in?"* · *"dans quel univers je suis ?"* · *"liste mes univers"*

> 🧭 **Progressive disclosure.** Below two universes there is nothing to manage: a brain with a
> single (default) universe behaves exactly as today. Do **not** volunteer universes to a
> single-universe user. But if they explicitly ask to create one, this skill is the way in.

## Golden rules

- **No writes to notes, no reindex.** Switching only re-points the active-universe pointer under
  `<brain>/.vault-rag/`. The engine reads it live on the next search. Never offer a reindex here.
  (The two lifecycle operations below are the exceptions, and they reindex **themselves**: renaming
  a universe moves every one of its notes, deleting one removes them. Still nothing to offer.)
- **The core is the single surface.** Natural language ("create a universe X") and `/switch X`
  route to the **same** script, so there is never a diverging path (ADR 0009).
- **🔤 Two worlds, two vocabularies — and you never decide which.** Below the disclosure gate (a
  single universe, nothing ever created) the notion **does not exist for this user**: never write or
  say *universe* to them, speak of **their context, their world, this place**. The moment a second
  universe exists, the opposite holds: everything is framed as universes, because that is the word
  they now switch with. **The deterministic core tells you which world you are in** (`BELOW the
  disclosure gate` / `PAST the disclosure gate`, printed with the offer) — do **not** infer it by
  counting universes yourself (ADR 0009). File paths the core prints (`vault/universe.md`) are the
  one exception: a filename is a filename, and quoting it back is fine.
- **Creating a universe is create-and-switch** (git `switch -c` ergonomics): register the name and
  make it active in one move. The name is normalized to a safe kebab slug (e.g. "Blue Team" →
  `blue-team`); the reserved name `default` cannot be created.

## Procedure

### Fast path — `/switch <name>` or "switch to <name>"

Run, from the brain folder:
```bash
node scripts/set-active-universe.mjs "<name>"
```
- **exit 0** → **relay the core's message verbatim** (in the user's language), then remind, in one
  line, that searches now stay in that universe plus your cross-cutting notes (say *"search all
  universes"* to span them). When the switch lands in a **named** universe (not a return to the
  cross-cutting `default`), the core **already appends** a one-line reminder that the **native
  connectors** (Slack, Notion, Google, mail…) are **single-account** and do not follow the switch, so
  the user reconnects them if this universe uses different accounts. You do **not** decide when to
  show it and **never reason about it yourself** (ADR 0009): the deterministic core owns that call,
  you only surface what it prints.
- **exit 1, "unknown universe"** → the name is not registered. Show the `available:` list the core
  printed, and **offer to create it** (create-and-switch) or pick an existing one. Do not create
  silently.

**After a successful switch, refresh your working context** — the profile injected when this
conversation started describes the universe you were in *then*, and stale context names the wrong
people and the wrong tools:

```bash
node scripts/set-universe-profile.mjs --digest
```

It prints **one of two blocks**, or nothing at all. Read the marker, they want opposite things:

- `[working context]` → **background for you**, never a message for the user. Use it silently (who
  someone is, which account to reach for); do **not** read it back to them.
- `[ask the owner]` → the profile **offer** for the universe you just landed in, which has none. Act
  on it: answer whatever the user was doing first, then make the offer in a line or two, in their
  language. It appears **once** per universe — accept and it is written, decline and it is recorded.
- **nothing** → that universe has a profile, or its offer was already declined. Not an error.

### No-argument menu — `/switch` alone

1. Read the state (no writes):
   ```bash
   node scripts/set-active-universe.mjs current   # the active universe
   node scripts/set-active-universe.mjs list      # all universes, * marks the active one
   ```
2. Present the menu in chat: **remind** the current universe, **list** the available ones, and offer
   - **switch** to one of them → fast path above,
   - **➕ create a new universe** (create-and-switch) → `create` below,
   - **✖️ cancel** (stay put) → do nothing.

### Create a new universe — "create a universe <name>"

Run:
```bash
node scripts/set-active-universe.mjs create "<name>"
```
- **exit 0** → **relay the core's message verbatim** (in the user's language). When this create is the
  one that crosses the brain from one to two universes, the core **already appends** the one-time
  onboarding line ("You now have two universes. Searches stay in the active one plus your cross-cutting
  notes; say 'search all universes' to span them. New notes will file under `vault/<slug>/`."). You do
  **not** decide when to show it and **never count universes yourself** (ADR 0009): the deterministic
  core (`openedGate`) owns that call, you only surface what it prints.
- **exit 1** → relay the reason as-is (`reserved` = `default` is not creatable; `empty` = the name
  had no usable characters), and ask for another name.

Then, **once**, offer to describe the universe just created (see below). Offer, never insist: a
universe with no profile works exactly like one with a profile, only with less context.

### Describe a universe — its profile (optional, skippable)

A universe's **profile** is a normal note (`vault/<slug>/universe.md`, or `vault/universe.md` for
the cross-cutting default) recording what this sphere **is**: an employer, a client, a personal
space, who is in it, what it is about, which accounts its tools use. A short digest of it is
injected at session start, because the ambient facts of a sphere are needed exactly when nobody
thinks to search for them.

**When to offer it:** right after a `create` (above); when a `--digest` after a switch prints an
`[ask the owner]` block; when the session's start-of-conversation context says this brain has no
profile yet; or whenever the user asks to describe / update their context. **Never twice in one
session, never after a refusal.** Offer *after* dealing with what the user actually asked — an offer
that interrupts their real question is not an offer, it is an interruption.

**Before asking anything, READ what the vault already says.** The vault has a shape — typed notes —
and the answers to several of these questions are usually already written in it, by the owner, in
their own words. Query that **structured source**, never a similarity ranking: a ranking returns
what looks related, a typed listing returns **the roster**, and proposing a person the vault never
recorded is exactly how this flow once named the wrong CTO while the right one sat in a note.

1. **`list_documents` with `type: person`** → the exhaustive roster. Keep the notes under the
   universe's folder (`vault/<slug>/…`) plus the owner's cross-cutting ones at the root; the path
   carries the scope.
2. **`get_document`** on the ones that matter → the opening lines of a person note usually carry
   the title and the relationship. This is where `people` comes from, and very often `role` (the
   owner's own title is frequently stated in the note about their manager).
3. **`get_document` on the universe note** (`type: universe`, `vault/<slug>/universe.md`) when one
   exists — a re-description starts from what is already recorded, not from zero.
4. **`search_vault` is a complement, never the source of a proposed fact.** Use it to find a note,
   then read the note. What gets proposed is what was **read**.

**Then propose, and ask for corrections** — do not open with seven bare questions. Show the values
you found, in the same batch, so the owner answers by correcting rather than by composing. Two
disciplines make this safe, and they are not optional:

- **Never invent.** A value nobody wrote does not get proposed. Retrieval feeds this flow; inference
  does not.
- **An unknown is an explicit blank**, never a plausible guess. `role: (I did not find it — what is
  your title here?)` is a better answer than a title that reads exactly like the four correct ones.

Say what accepting costs, once, plainly: **accepting a proposed batch records it as the owner's own
facts**, in a note whose digest is injected at every session start. It is consented and it stays
correctable (it is a plain note), but a one-word "yes" is the cheapest interaction there is — so the
weight of it has to be visible before it is given, not discovered later.

**The questions.** Ask them as ONE short batch, in the user's language, and say up front that
every one of them is skippable and that the page stays editable afterwards (it is a plain note).
Do not interrogate: if they answer three out of seven, write those three.

1. **What is this place, in a few words?** → `displayName` (+ `kind`: employer, client, project,
   personal, community…)
2. **What do you do there?** → `role`
3. **Since when?** → `period`
4. **In a sentence or two, what is it?** → `about`
5. **Who are the people who matter here?** (name + who they are) → `people`
6. **What subjects keep coming back?** → `topics`
7. **Which accounts do your tools use here?** (Slack workspace, Notion workspace, mail address…) →
   `connectors`. This is the one that turns a switch reminder from a generic warning into
   *"reconnect Slack to acme.slack.com"* — worth asking even when the rest is skipped.

**Then write it** — the note's shape is the core's job, never yours (ADR 0009). From the brain
folder, pass the answers as JSON on stdin:

```bash
echo '{"universe":"acme","displayName":"Acme Corp","kind":"employer","role":"Head of Engineering","period":"since 2024","about":"Industrial widgets, two engineering teams.","people":["Zoe (CTO)","Alice (PM)"],"topics":["platform migration","hiring"],"connectors":[{"tool":"Slack","account":"acme.slack.com"}]}' \
  | node scripts/set-universe-profile.mjs
```

- Omit `universe` to describe the **active** one. Omit any key the user skipped — a key written
  empty reads as a fact ("nobody", "no role").
- **exit 0** → relay the core's messages verbatim (it names the note and confirms the re-index).
- **exit 1, "already exists"** → a profile is **never** overwritten: relay the message, which names
  the page to edit directly (in Obsidian, or ask to open it).

**If the user declines**, record it so they are never asked again — and say so plainly:

```bash
node scripts/set-universe-profile.mjs --decline
```

### Rename a universe — "rename acme to Acme Corp"

A **full** rename (ADR 0034 / decision D4): the folder moves, every note under it is re-stamped, the
registry entry changes name, and the user keeps standing where they were. Unlike deletion, this
loses nothing and is undone by renaming back — so you may run it yourself, **once they have said yes
to what it costs**.

**Step 1 — say what will happen, and let them answer.** Never rename on the strength of the request
alone: the re-embed can keep their machine busy for minutes, and someone who was not told will think
their brain hung. The wording is the core's, not yours — this changes nothing on disk:

```bash
node scripts/rename-universe.mjs --preflight "<old>" "<new>"
```

- **exit 0** → relay that message in their language (it names the note count, what moves, and that
  the whole universe gets re-encoded for search: seconds on a small universe, a few minutes on a
  large one). Then **ask them to confirm**. Nothing is lost either way — it is compute, not data.
- **exit 1** → relay the refusal and stop. Nothing has run.

**Step 2 — only after they confirm**, run the real thing:

```bash
node scripts/rename-universe.mjs "<old>" "<new>"
```

- **exit 0** → relay the core's message verbatim.
- **exit 1** → relay the reason as-is: `exists` (that name is taken — merging two universes is a
  different operation), `reserved` (the cross-cutting default is neither renameable nor a valid
  target), `unknown` / `empty`. A `reindex failed` here means the rename **did** happen on disk and
  only the index is behind: relay the `cd rag && npm run reindex` it prints.

> 💻 **On another machine**, the pointer is per-machine and gitignored while the registry is
> committed, so a pull lands the new name with a pointer still naming the old one. That machine
> **heals itself** at its next session start and says so in one line — nothing to do.

### Delete a universe — ONLY when the user explicitly asks for it

> 🛑 **Read this rule before the procedure.** Deleting a universe erases its notes. It is therefore
> **never** mentioned, suggested, offered, hinted at or listed anywhere else: not in a switch, not in
> a create, not in the menu, not in a trailing *"you can also…"*. Someone moving between two spheres
> must never be one half-read line away from losing one. The **only** door is the user saying, in so
> many words, that they want to delete a universe. Discoverable on demand, invisible otherwise.

> 🛑 **You hand over the command. You do NOT run it.** Print it and let the user run it **themselves,
> in their own terminal**. If you ran it and typed the confirmation yourself, the gate would guard
> nothing — which is why the script **refuses to run at all** without an interactive terminal (no
> `--yes`, no piped stdin). Do not try to work around that refusal; it is the feature.

When, and only when, the user asks to delete a universe, tell them what it costs and give them this:

```bash
node scripts/delete-universe.mjs "<name>"
```

Say, in their language, what will happen when they run it: it prints how many notes are about to go,
asks them to **retype the name** to confirm (anything else cancels), then deletes `vault/<name>/`,
removes it from the registry, puts them back in their cross-cutting scope if they were standing in
that universe, and re-indexes. The cross-cutting (default) scope cannot be deleted.

And tell them the part that makes this survivable: **git still has the notes.** The auto-commit hook
has been versioning the vault all along, so a deletion is undoable, and the script prints the exact
two commands (`git log --diff-filter=D -- vault/<name>/`, then
`git checkout <commit>~1 -- vault/<name>/`). Say it *before* they run it, not after.

## What it does NOT do

- It does **not** move or re-stamp existing notes (that is `/import --universe` at import time, or a
  future one-shot re-stamp). Switching is only about *where new work and default searches point*.
- It does **not** merge two universes. Renaming onto an existing name is refused: which notes win and
  whose profile survives are questions a rename cannot answer for you.
