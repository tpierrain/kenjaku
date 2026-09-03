# SETUP — Detailed installation & customization

## 1. Prerequisites

| Tool | Why | Installation |
|---|---|---|
| **Node.js ≥ 20** | Runs the RAG engine **and** the whole harness (installer + hooks are in Node, cross-OS). **Node 24/25/26 are covered since v3.1.0** — the engine's native deps (`better-sqlite3`) now declare the modern window, so you no longer need to downgrade Node. | https://nodejs.org (macOS: `brew install node` · Windows: `winget install OpenJS.NodeJS`) |
| **git** | Versioning + portability across machines | https://git-scm.com |
| **Claude Code** | The agent that queries the vault | https://claude.com/claude-code |
| **Gemini key** *(optional)* | Embeddings — **only if you choose the Gemini embedder** (see note below) | https://aistudio.google.com/apikey |

> 🧩 **The Gemini key is no longer mandatory (D1, ADR 0007).** At install time, you choose your
> **embedding engine** among 3 options, with a **recommendation tailored to your machine**:
> **1. Fully on your machine** ("Gemma inside", `in-process`) — 🟢 private + free + offline,
> **nothing to install** (recommended if ≥ 12 GB of RAM and not an Intel Mac);
> **2. Via an API** — Gemini, OpenAI, Mistral, or your own endpoint (🟡 your notes' text is sent to
> the provider; in many cases it's **not** used for training — depending on the provider & plan, pick
> the right settings: a paid tier or a "no-training" / data-controls option);
> **3. A model running locally, via Ollama** (for the most technically advanced). Only option 2-Gemini requires the key above; options
> 1 and 3 write `EMBEDDING_PROVIDER` to `.env` (see `.env.example`) and **skip the key step**.

> **Cross-OS**: macOS, Linux and Windows (cmd or PowerShell). The installer and hooks
> are in Node — no need for bash, `jq` or `sqlite3`. Node is the only runtime prerequisite.

> ⚙️ **Node via `nvm`/Homebrew? It's handled.** The Claude Desktop app launches hooks with a minimal
> PATH where a `node` installed by `nvm` or Homebrew would be unfindable (the hooks would then fail
> **silently** — auto-commit would no longer save your notes). The installer generates a
> small launcher `scripts/run-node.*` that finds `node` on its own before each hook, and **verifies
> at install time** that it succeeds — by **simulating the app's minimal PATH**, so the proof is
> real (otherwise the install fails loudly). You have nothing to configure.
> If the install **fails** this smoke-test, it means your `node` is in an **unusual** location
> (the launcher covers `/usr/bin`, `/usr/local/bin`, `/opt/homebrew/bin`, asdf, nvm,
> volta, nodenv, fnm — and on Windows nodejs, npm, Volta, `NVM_SYMLINK`). Solution: reinstall
> `node` via one of these paths (e.g. `nvm` or Homebrew), or report your case so we can add it.

> 🔒 **Privacy**: on the **free tier**, Gemini may use your content to improve its products
> (human review possible). For a **confidential** vault, enable **billing** (paid tier). On the
> Claude side, also consider disabling sharing for improvement. **Details in §9 (Data privacy).**

### 1.1 Get your Gemini key — a 2-minute affair

No need to touch the Google Cloud console: everything is done via **Google AI Studio**, in
a few clicks.

1. Open **<https://aistudio.google.com/apikey>** and sign in with a Google account.
2. Click **"Create API key"**.
3. Let AI Studio **create a project automatically** (or pick an existing one) — there's nothing
   else to configure.
4. **Copy the key** (it looks like `AIza…`).
5. Paste it into `<brain>/.env`, on the `GOOGLE_GEMINI_API_KEY=` line (never in the chat nor as a
   command argument — see guardrails §troubleshooting).

That's it: the **free tier is active immediately**, no credit card required to get started.

> 💳 **Switching to paid** (recommended for a confidential vault — see §9): in AI Studio, open
> the key and **enable billing** on its project (a Google Cloud billing account, created once). The
> cost stays in the range of a few cents (see the chart in §9).
>
> ⚠️ An API key is a **secret**: never commit it, never share it. It lives in `.env`,
> which is gitignored.

## 2. Installation

> **One launcher, one brain — two folders.** The installer runs from the **launcher** (this
> cloned repo) and **creates a separate brain folder** where it generates all your config. The
> launcher stays **read-only** and **reusable** (multiple brains from a single launcher). The name of
> the brain = `--name` (or the "Brain name" question); its location = `--dest` (default: your
> home → `~/<name>`). The installer **refuses if the target folder already exists** — it's the one that creates it.

```bash
cd kenjaku   # the cloned launcher
node installer.mjs          # interactive: asks for name, location, your name, language
```

**Launcher vs brain, at a glance** — one instruction, two folders, no link between them:

```
You give ONE instruction to Claude Code:
        │   "Install me a second brain named "second-brain" (name to be confirmed)
        │     from this generator: https://github.com/tpierrain/kenjaku"
        ▼
    📁 kenjaku/   ← the LAUNCHER (Claude clones it): read-only, reusable, never modified
        │
        │   Claude runs the installer in it  →  which CREATES a folder ELSEWHERE
        ▼
    📁 ~/second-brain/            ← YOUR second brain: a FRESH folder (files copied + git init)
        ├── CLAUDE.md          (your constitution — generated from the bootstrap stub)
        ├── vault/             (your notes)
        ├── rag/               (the search engine)
        ├── .git/              (FRESH repo, 0 remote — no link to the launcher)
        └── .mcp.json, .env …  (generated config)
        │
        │   you reopen Claude Code INSIDE the brain
        ▼
    → you ask your questions
        │
        │   (optional, whenever you want) you ask Claude, INSIDE your brain:
        │   "Push my second brain to a remote GitHub repository (for a backup)"
        ▼
    ☁️  remote repository        ← backup + multi-machine (push opt-in, see §7)
```

The script:
1. checks the prerequisites (and stops cleanly if any are missing);
2. asks you for the **brain name / location / your name / language**;
3. has you **choose your embedder** (fully-local "Gemma inside" / API key / Ollama — recommendation per your
   machine, see §1); the Gemini key will be requested **only** if you take the API key option;
4. **creates the brain folder** (`<location>/<name>`, **refused if it exists**) and **copies the
   launcher's tracked files** into it, then generates your customized files there: `CLAUDE.md` (which
   **replaces the bootstrap stub**), `.mcp.json`, `.claude/settings.json`, `.env`;
5. **initializes a git repo in the brain** (1st commit, **0 remotes** — the foundation of auto-commit);
6. offers to **wire up external sources** (optional — see §6);
7. offers to **clear the example notes** (optional — keep them for the 1st test, clear them afterwards so they don't pollute your RAG);
8. installs the engine's dependencies (`npm install`) in the brain;
9. indexes the example vault;
10. **MCP smoke-test**: verifies that Claude Code will be able to talk to the `vault-rag` server (see §8).

**Refused if the folder exists.** To never overwrite a brain, the installer **refuses** when the
target folder already exists (non-zero exit, nothing is touched). To start over: choose another
`--name`/`--dest`, or delete the folder. The **launcher** itself stays reusable indefinitely.

### Manual installation (if you prefer)
> The installer **creates the brain folder** for you (copy + generation + `git init`). Manually,
> first create an empty folder separately, then from the launcher:
1. Copy all the launcher's content into your new brain folder (excluding `.git`, `node_modules`,
   `DEVELOPING.md`).
2. In the brain: copy `.env.example` → `.env`. For the **fully-local** option, set
   `EMBEDDING_PROVIDER=in-process` (no key, no app); for the **API key** option, fill in
   `GOOGLE_GEMINI_API_KEY`; for **Ollama**, follow the `openai-compatible` block of `.env.example`.
3. Copy each `*.template` to its final file (`CLAUDE.md.template` → `CLAUDE.md`,
   `.mcp.json.template` → `.mcp.json`, `.claude/settings.json.template` → `.claude/settings.json`)
   then replace the `{{...}}` placeholders (notably `{{PROJECT_ROOT}}` = absolute path of the
   **brain** with `/` slashes, and `{{TMP_DIR}}` = the OS temp folder).
4. `git init` in the brain, then `cd rag && npm install && npm run index`.

> In practice, `node installer.mjs` does all of this for you, on every OS — prefer it.

### Non-interactive installation (flags) & Claude-driven startup

The installer accepts a **non-interactive mode**: useful for scripting the install, and it's what
enables the **Claude-assisted startup** (see README "Option A"). Claude gathers the answers
in chat, then calls **a single command**:

```bash
node installer.mjs --non-interactive --name "second-brain" --owner "Jane Doe" --lang "français"
# → creates ~/second-brain. Add --dest <parent-folder> to choose the location.
```

- **Flags**: `--name` (name of the created brain folder), `--dest` (parent folder; default = your home),
  `--owner` (your name), `--lang`. Both `--x value` **and** `--x=value` forms. Mode aliases:
  `--non-interactive`, `--yes`, `--no-input`.
- **Precedence**: CLI flag > environment variable (`SB_PROJECT_NAME`, `SB_DEST`, `SB_OWNER_NAME`,
  `SB_LANGUAGE`) > default value.
- **The Gemini key is NEVER an argument** (security: no secret on the command line). In
  non-interactive mode it is **always deferred** → fill it in afterwards in `<brain>/.env`;
  the index builds at the 1st startup of the MCP server.
- **No link to the launcher, by construction.** The installer **creates a fresh folder**, copies
  the tracked files into it (never the launcher's `.git`), then runs `git init` + 1st commit in it. The brain
  therefore has **no remote** — nothing to detach, no git surgery. The launcher is never modified.
- **No leak possible: push is opt-in.** Pushing happens **only if you have explicitly enabled**
  `git config secondbrain.autopush true` (set by the "remote repo" step below). By default **off**
  → even a stray remote never receives your notes.
- **Commit per edit, push once per turn.** Each file change is committed locally and instantly
  (the `Write|Edit` hook). The actual **push is debounced**: it runs **once per turn**, at the end
  (the `Stop` hook), pushing all the turn's commits in one go — instead of a network push per edit.
  **That end-of-turn pass first commits anything still uncommitted**, then pushes: a file one of your
  brain's own scripts wrote is not something Claude *edited*, so no `Write|Edit` hook saw it — it
  leaves with the rest of the turn instead of lingering on this machine until the next session.
  A failed push is non-blocking: your commits stay local and the **next turn catches up**. For
  syncing changes made on *another* machine mid-session, use the `/sync` skill.
- **A note you write yourself is committed too, without waiting for Claude.** Type a note straight
  into Obsidian, delete one from a terminal, or let one of your brain's own scripts write one: Claude
  saw none of it, so no `Write|Edit` hook fires. Your brain's live watcher notices anyway. The note is
  **searchable within seconds**, and it is **committed once your vault has been still for about two
  minutes** — or after **ten minutes** if you simply never pause. Two different numbers on purpose:
  search wants to be fresh immediately, while git is better off folding a whole writing session into
  one commit than following every pause you take. This works **while a Claude session is open** (the
  watcher lives there); write with your brain closed and the sweep below still catches it.
- **An engine update commits its own files too.** `/update-engine` rewrites versioned engine files,
  which are not edits Claude made — so no `Write|Edit` hook fires for them. The update therefore
  commits them itself, at the end of its run: you will see one `engine: update to <version>` commit
  appear in your history. It is **local only** (push stays opt-in, as above). Without it those files
  would sit uncommitted, and the startup `git pull --rebase` refuses to run on a dirty repo — your
  brain would quietly stop syncing between machines.
- **And a sweep at every session start, to catch what the others miss.** Before its startup
  `git pull --rebase`, your brain commits anything still uncommitted: notes you wrote **with your brain
  closed**, so neither hook nor watcher was there to see them, or engine files left behind by a session
  that never reached its end-of-turn pass (a crash, a window closed mid-run). You
  will see an `auto: session-start sweep …` commit when that happens. It is **local only**, and it is
  what keeps your sync from silently blocking. **One exception, on purpose:** if git stopped on a
  **conflict** (the same note changed on two machines), nothing is committed for you — the startup
  banner asks you to open the file, keep what you want, then run `git rebase --continue`.
- **Remote repo: decided afterwards, never imposed.** The install creates no remote. You can wire
  one up whenever you want (see §7) — remembering to enable `secondbrain.autopush`. In assisted
  startup, Claude will **offer** to create one (backup + multi-machine) — answering no is risk-free.

> ⚠️ In non-interactive mode, the **connectors** (§6) and **example-notes purge** steps are
> skipped (they stay interactive) — you'll do them by hand or by re-running the installer **toward
> a new brain**.

## 3. First test

> ⚠️ **API key option only: fill in your Gemini key in `.env` BEFORE this first startup.**
> The `vault-rag` MCP server is launched once when Claude Code opens: if it starts without a key
> while you're on the Gemini option, the RAG won't be able to respond. (At startup, the status hook
> **warns you** if the key is missing.) In **fully-local** or **Ollama**, **no key**: skip this point.

```bash
cd <location>/<name>   # the brain folder created by the installer (e.g. ~/second-brain)
claude
```
Then: *"At the outfit that helps folks quit overworking, which worker got publicly honored for
having loafed the most of anyone — and at what percentage?"*
Claude should answer **Pélagie de Mollecuisse, winner of the Inertia Trophy with a DNR of
98.7%**, citing `[[decisions/2025-11-20-inertia-trophy]]`. This is a three-stage
**canary**: the subject is **invented** (the company "Flemmr") → Claude has no answer in memory,
it is *forced* to query the vault (**routing**); the fact is unfindable elsewhere (**provenance**
— not the Internet; if it says it doesn't know the company, the RAG is down); and the question shares
**no words** with the notes (everything is *described* via synonyms) — so retrieving "Mollecuisse"
also proves search **by meaning**, not a grep.

> 🔎 **Deterministic verdict (recommended after pasting the key).** Rather than judging the answer
> by eye, run from the brain folder:
> ```bash
> node scripts/verify-rag.mjs
> ```
> It (re)indexes and **asserts** that the demo surfaces "Mollecuisse". `exit 0` = RAG OK; `exit 1` = explicit
> failure (no false green).

> **Key added afterwards?** If you launched Claude Code without the key, paste it into `.env` then
> **ask your question again**: the server re-reads `.env` on the fly and takes it into account — no need
> to reconnect. If it ever resists, reconnect the MCP server with `/mcp` (in Claude Code) or
> restart Claude Code.

> If Claude doesn't "see" the RAG server: check that `.mcp.json` exists and points to the right
> path, accept the MCP server when Claude Code starts, and — *in the API key option* — that
> `.env` contains the key.

## 4. The RAG engine in brief

- Splits each `.md` into **chunks** (one per `#`/`##`/`###` section).
- Embeds each chunk with the chosen embedder (in-process **EmbeddingGemma** by default, or
  `gemini-embedding-001` in the key option, or Ollama) → vector stored in `rag/.cache/vault.db` (SQLite).
- A search embeds the question and surfaces the closest chunks by similarity.
- **Incremental**: only modified files (content hash) are re-indexed. At MCP server startup, a background reindex catches up on the new content without blocking searches.
- **Quota guardrails**: `MAX_EMBED_REQUESTS_PER_DAY` cap + `QUERY_RESERVE` reserve (searches are never blocked by indexing). Overridable in `.env`.
- Forced rebuild: `cd rag && npm run reindex`. Tests: `cd rag && npm test`.

Exposed MCP tools: `search_vault`, `get_document`, `list_documents`, `vault_stats`, `reindex`.

## 🪨 Reading & editing your notes (Obsidian for your notes, your default editor for the rest)

Your vault is a plain set of `.md` files, so it works without any extra app. When you ask Claude to
**"open my note about X"**, it opens the **real file** — never a copy pasted into the chat — so you can
read it and **edit it in place**, and your edit is picked up.

**Where it opens depends on which file it is**, because *a note of your brain* and *any Markdown file on
your machine* are not the same thing:

- **A note of your vault** opens in **Obsidian**, when Obsidian is installed and this vault is
  registered in it (the installer can do that registration for you). That's the app built for these
  notes: links, backlinks, graph.
- **Anything else** — a Markdown file outside the vault, or no Obsidian on this vault — opens in **your
  default Markdown editor** (Typora, VS Code, whatever you've set). No app is forced, no lock-in.

> 🔐 **The very first time, Obsidian will ask you to confirm.** It shows *"Execute the action from an
> external link?"* — that is Obsidian being careful about links coming from outside itself, and it is
> **expected**, not a warning about your brain. Tick **"Don't ask again"** and it never comes back. It's
> the same shape as the one-time "Always allow" clicks on your connectors: a handful of seconds, once.

**Obsidian stays optional.** Without it, every note still opens in your default editor and nothing is
lost. With it — **[Obsidian](https://obsidian.md)** is free — you also get a full graph view,
`[[wikilinks]]` and backlinks over those very same files, which is what makes *exploring* the whole
brain pleasant rather than opening one note at a time.

> ⚠️ **First-launch step (Obsidian only).** On a brand-new Obsidian the first launch lands on a
> **welcome / vault-picker screen**. If the installer didn't register the vault, open Obsidian yourself,
> click **"Open folder as vault"** and pick your brain's folder — a one-time step; the vault then stays
> registered for good.

Obsidian is **recommended, never required**, and it's never *needed* to open a single note — that always
goes through your default editor (or, if no editor opens, Claude shows the note inline as usual).

## 5. Customizing your harness

| File | What to do |
|---|---|
| `CLAUDE.md` | Adapt the sections marked 🔧: privacy, vault folders, sources, tone. It's *your* constitution. |
| `vault/` | Delete the example notes, put in your own. Keep the naming conventions. |
| `.claude/skills/` | Add your skills (see `EXAMPLES.md`). `/improve` helps you evolve them. |

### 5.1 Telling your brain about your context (optional, 2 minutes)

Your brain knows your **notes**. It does not know that you run engineering at Acme, that Zoe is the
CTO there, or that "Slack" for you means `acme.slack.com`. Those are exactly the facts nobody thinks
to *search* for, because you need them to phrase the search in the first place.

So, early on, your brain **offers once** to ask you a handful of questions: what this place is, your
role, since when, the people who matter, the subjects that keep coming back, and which accounts your
tools use. Every question is skippable, and **"no thanks" is permanent** — it will not come back at
you session after session.

What it writes is a **normal note** (`vault/universe.md`), which means:

- you can **edit it any time** in Obsidian or your editor, and the change takes effect immediately —
  nothing to re-run;
- it is **versioned** with the rest of your vault, and **searchable** like any other note;
- it is **never overwritten** — once the page exists, it is yours.

Your brain **opens that page when your question depends on it** — who someone is, which account a
tool uses here. What it does *not* do is print the page at you: what you wrote there stays in the
vault, and never lands in a screenshot or a screen share just because a conversation started. To
fill it in later, to read it back, or to change your mind, just ask ("describe my context", "show me
my context").

> If you use several **universes** (see `/switch` below), each one gets its **own** page: the people
> and the accounts of one sphere never leak into another's answers.

### 5.2 Renaming a universe

Names age: a client becomes an employer, a project gets its real name. Just ask — *"rename my acme
universe to Acme Corp"* — and your brain runs it for you. Nothing is lost, and renaming it back undoes
it, so there is nothing to be careful about here.

It is a **full** rename: the folder `vault/acme/` becomes `vault/acme-corp/`, every note inside is
re-labelled, and you stay in that universe under its new name — so the new name is true in Obsidian
and in git too, not only in your brain's list. The one cost: because every file moved, your brain
re-reads and re-encodes that universe's notes (a few minutes if it is a big one; it is compute, not
data).

**Your brain tells you all that before it does any of it**, and waits for your go: how many notes are
about to move, and that re-encoding them for search will keep the machine busy — seconds on a small
universe, a few minutes on a large one. Nothing has happened yet at that point, so you can say no, or
pick another name if it tells you the one you asked for is taken.

Two things it will refuse: renaming onto a name you already use (that would be *merging* two
universes, a different question), and renaming your cross-cutting scope, which has no folder of its
own.

> 💻 **On another machine**, the new name arrives with your next `git pull` — and so does the universe
> you are working in (see §7). Nothing to do: your brain names the universe it is in when the session
> starts. If that other machine somehow arrives pointing at a universe that no longer exists, it puts
> you back on solid ground on its own, with a one-line notice.

### 5.3 Deleting a universe — the one operation you run yourself

You will most likely never need this. It is written down so that the day you do (a client you no
longer work with, a sphere that turned out to be one too many), you find a procedure rather than
improvise one.

**Deleting a universe deletes its notes.** So, deliberately, your brain will never offer it, never
suggest it, and never do it for you — it will only hand you the command when you explicitly ask to
delete a universe. **You** run it, in **your** terminal, from your brain folder:

```bash
node scripts/delete-universe.mjs "<name>"
```

It tells you how many notes are about to go, then asks you to **retype the name** to confirm —
anything else cancels and nothing is touched. Only then does it remove `vault/<name>/`, drop the
universe from your list, put you back in your cross-cutting scope if you were standing in the one you
deleted, and re-index. Your cross-cutting (default) scope cannot be deleted; it is where every note
that belongs to no particular sphere lives.

The script **refuses to run** if it is not talking to a real terminal — including when Claude tries
to run it for you. That is on purpose: a confirmation someone else can type on your behalf is not a
confirmation.

**And it is undoable.** Your vault is a git repository that has been committing your notes all along,
so the notes are still in its history. To bring a deleted universe back, find the commit that removed
it, then restore the folder from just before it:

```bash
git log --diff-filter=D -- vault/<name>/     # the commit that deleted it
git checkout <commit>~1 -- vault/<name>/     # bring the notes back
```

Then tell your brain to re-index (or run `cd rag && npm run reindex`), and re-create the universe with
`/switch` if you want to work in it again.

## 6. External connectors (optional)

The generator only provides the RAG engine. To also query your other sources
(Drive, Notion, Slack, Calendar…), three paths — choose based on your comfort level.

### Menu — which connector for which need

Some **ideas** to get started (adapt to your tools). "claude.ai native" = enable on the
account side (Settings → Connectors), nothing to write in `.mcp.json`; "community MCP" = a
server you wire up in `.mcp.json`. Full, detailed catalog: [CONNECTORS.md](CONNECTORS.md).

| Need | Recommended connector | How to wire it up |
|---|---|---|
| **Notes / wikis** | Notion | Community MCP `@notionhq/notion-mcp-server`, or **native** claude.ai connector |
| **Mail** | Gmail | **Native** claude.ai connector |
| **Calendar** | Google Calendar | **Native** claude.ai connector |
| **Files / documents** | Google Drive | Community MCP (`@modelcontextprotocol/server-gdrive`, `@isaacphi/mcp-gdrive`…), or **native** claude.ai |
| **Team chat** | Slack | **Native** claude.ai connector |
| **Meeting transcripts** (Meet) | **Google Calendar + Google Drive** | Not a separate product: the recording/transcript link is often in the **invitation** (Calendar) and the transcript doc lands on the **Drive**. Wire up both. |

> 💡 Meeting transcripts are **not** a dedicated connector: they're documents
> produced by Meet/Gemini. You catch them via the **Calendar** (link in the event) and the
> **Drive** (the transcript doc). No need for a third-party meeting-bot MCP to get started.

### (a) The installer wizard — *recommended*

During `node installer.mjs`, the **5/9 "Wire up external sources"** step offers you a
small catalog. For each **MCP** connector you accept, the script automatically merges
its server block into `.mcp.json` **and** its permissions into `.claude/settings.json`, then
shows you the reminder of credentials to fill in. It's **idempotent**: re-running the installer never
creates a duplicate. All that's left is to put your real credentials in place of the `<…>` placeholders.

### (b) By hand — *if you prefer to control everything*

Add the MCP server yourself in `.mcp.json` (adapt the command/credentials for each server):

```jsonc
{
  "mcpServers": {
    "vault-rag": { "...": "already there" },

    // Google Drive (transcripts, docs) — e.g. community package
    "gdrive": {
      "command": "npx",
      "args": ["-y", "@isaacphi/mcp-gdrive"],
      "env": { "GDRIVE_CREDS_DIR": "/path/to/credentials" }
    }
    // Slack, Notion, Gmail, Calendar: add the MCP server of your choice here.
  }
}
```

Then remember to:
- document in `CLAUDE.md` (§ 4) **which tool for what**;
- add the corresponding permissions in `.claude/settings.json` (`mcp__<server>__<tool>`);
- enable the server on the Claude Code side at startup.

### (c) claude.ai native connectors — *≠ `.mcp.json`*

Slack, Gmail, Calendar, Notion also exist as **native connectors** on the claude.ai account
side. These **are not wired up in `.mcp.json`**: enable them from the *Connectors* of your
account (Settings → Connectors). The wizard (a) reminds you of this for these sources and writes nothing
for them.

### (d) Local mirrors — *mirror* a Notion zone into your vault

Distinct from the search connectors above: a **local mirror** keeps a chosen **Notion** zone mirrored
into `vault/mirrors/<name>/` as Markdown, so the RAG indexes and **cites** it like any other
note (see the **Local mirrors** section of [CONNECTORS.md](CONNECTORS.md)).
The **`local-mirror`** MCP server ships with every brain; drive it with the **`/local-mirror`
skill** (*"set up a local mirror of a Notion zone"*). Create a Notion integration
(<https://www.notion.so/my-integrations>), **share it on the root page** of the zone, put its token in
`.env` under a name of your choice (e.g. `NOTION_TOKEN_PASC=secret_…`), and pass **that env-var name**
to the skill — **the token never travels through the chat**. The skill tests the scope, does the first
sync, and explains each step. **If you have several universes**, it first asks which one the mirror
belongs to (the one you are working in is proposed, and a cross-cutting mirror is one word away) and
pulls nothing until you answer — its pages then live in `vault/<universe>/mirrors/<name>/`. Getting
that right afterwards would re-encode the whole mirror, which is why it asks before, not after.

**Filed in the wrong universe anyway? Move it** — *"move my product mirror into my Acme universe"*.
The mirror is re-filed **locally**: its pages, its config and its sync state travel together, nothing
is re-downloaded from Notion (it works even with the source unreachable), and the next refresh
rewrites nothing. The re-encode is the whole cost, and your brain says so before doing it. Note that
re-**declaring** the same mirror into another universe is **refused** rather than performed: it would
write a second copy while leaving the first one on disk, indexed and frozen. The move is the route.

Once a mirror is declared, it also **refreshes itself in the background** while a brain window is open:
the `local-mirror` server checks freshness on a timer and re-syncs only the mirrors that fell behind, no
question needed. The cadence is set by **`LOCAL_MIRROR_SYNC_INTERVAL`** in `.env` (seconds, **default 300**
= 5 min; **`0` disables** the background timer and falls back to the question-time refresh only). It ticks
only while a window is open (it is not a 24/7 daemon).

### (e) Two things people expect to find here and will not — iCloud, and Spotlight

Neither is an oversight, and neither needs configuring. They are named here because their
absence is the kind that makes a newcomer hunt for a setting that does not exist.

**iCloud — there is no connector, and there are two routes that work.** Nothing in this
brain reads iCloud, and nothing is planned:

- **Notes you already have as files** (Markdown sitting in iCloud Drive): bring them in
  **once**, with the **`/import` skill** (§11) — point it at the folder, it copies, never
  overwrites, and reindexes. After that they are ordinary notes in your vault, versioned
  with everything else.
- **Documents that keep changing** (a spec you edit every week): leave them where they
  live and reach them through a connector — **Google Drive** is the wired path (see the
  menu above). A one-off import of a moving document only ever captures the version it had
  that day.
- **Apple Notes is a different thing again**: it is not a folder of files, so `/import` has
  nothing to point at. Exporting from it is a manual step on Apple's side, and once the
  notes are Markdown on disk the first route applies.
- ⚠️ **Do not put the brain itself inside iCloud Drive.** It is a git repository, and a file
  syncer and git are two systems trying to own the same files: the way to have one brain on
  two machines is a **private git remote** (§7), which is built for exactly that and
  survives conflicts instead of duplicating files.

**Spotlight — not used, nothing to configure, and it is not the same tool.** Your vault is
plain Markdown, so macOS will happily index it and you can keep using Spotlight to *open a
file whose name you remember*. Your brain never consults it. Searching your vault goes
through the RAG engine (§4), which answers a **question** with the passages that mean the
same thing — not the files that contain the same words — and **cites the notes it used**.
Two different jobs: one finds a document, the other answers with your own material.

## 7. Backup & multi-machine portability (remote repo)

Set up a private git remote, **then enable push** (without it, auto-commit stays local — it's
the opt-in guardrail that prevents any leak by default):
```bash
git remote add origin <url-of-your-private-repo>
git push -u origin main
git config secondbrain.autopush true   # ← enables the hook's automatic push
```
The brain will then push **once per turn** (the `Stop` hook), bundling that turn's commits; a failed
push is non-blocking and retried at the next turn.

### On the second machine — clone, then **rehydrate**

A clone is **not** a working brain yet, and that is normal: two of the files your brain runs on
(`.mcp.json` and `.claude/settings.json`) hold **absolute paths belonging to one machine**, so they
are deliberately gitignored and git never carries them. Without them there is no `vault-rag` search
server, no hooks (no auto-commit, no auto-push) and no permission allowlist. One command rebuilds
them, from the `.template` files that *did* travel in the clone:

```bash
git clone <url-of-your-private-repo>
cd <your-brain-folder>
node scripts/rehydrate.mjs      # ← rebuilds this machine's wiring
```

It regenerates both files, re-seeds the health note, and installs **both** dependency trees
(`rag/` *and* `local-mirror/` — two `package.json`, a `cd rag && npm install` alone leaves the
local-mirror server unable to start). It works **offline**, it overwrites nothing, and running it on
an already-wired brain simply prints "nothing to do".

Then two things it cannot do for you:

- **Your key, if your brain uses an API embedder** (Gemini/OpenAI/…): `.env` is never committed, so
  re-enter it on this machine. A 100 % local brain (`in-process` / Ollama) has nothing to re-enter.
- **Open a NEW conversation rooted in the brain folder.** Claude loads the MCP servers and the hooks
  when a session *starts*, so a session already open keeps running on the old (absent) wiring.

That first rooted session is also what **indexes the vault** — a clone carries your notes but not the
index (`rag/.cache` is local). So a first-session banner announcing an empty index is expected, not a
defect: let the indexing run.

### While you work — the two brains keep themselves in step

Once a remote is wired, your brain **checks on its own** whether the other machine pushed anything,
about every minute and a half, for as long as a window is open. What it finds, it brings in and
indexes; then it tells you at your **next message** ("2 notes from Claire arrived: …"), and shows a
small notification on your computer when the notes were written by **someone else** — so you see it
even if Claude's window is behind another app. Nothing runs when no window is open, and nothing is
downloaded when nothing changed: the check asks the remote for one reference and stops there.

Two notes appended the same afternoon, on both machines, to the **same** daily note **merge on their
own** — both contributions kept, nobody asked anything. That automatic keep-both applies to the
places you only ever **add** to: your daily notes, your inbox, imported raw sources, the activity
log. Elsewhere — a person's page, a topic, anything you **rewrite** rather than append to — two
different versions **stop and ask you**, deliberately: keeping both halves of a page two people
rewrote would leave it saying two contradictory things, and nobody would ever notice. When a merge
needs a hand, your brain says so at your next message and walks you through it; the `/sync` skill is
still there if you would rather do it yourself, at your moment.

> Both knobs live in `.env` and neither is required: `REMOTE_SYNC_INTERVAL` (seconds, `0` turns the
> automatic check off and leaves you the session-start catch-up and `/sync`) and `REMOTE_SYNC_BANNER`
> (`0` keeps the sync and drops the notification).

> 🔐 **What sharing one repository means, plainly.** A brain's repository holds your notes **and the
> code your brain runs** (`scripts/`, `rag/`). So anyone you let push to it can, in principle, have
> code run on your machine at your next session. That has been true since the day you wired a remote,
> and it is why the repository is **private**: the fence is its collaborator list. Sharing a brain
> with a colleague is a real decision — the same one as sharing a machine, not the one as sharing a
> document.

> 🧭 **The universe you are working in travels too** (if you use several — see §5). Switch context on
> one computer and the others land in it at their next sync, and say which one they are in when the
> session starts. Your connectors (Slack, Notion, Gmail, Drive) already follow you that way, being
> tied to your account, so your notes now match instead of contradicting them. Two computers, one
> context. If both switch before syncing, the one you are sitting at keeps its own, and your next
> switch settles it.

> ⚠️ **Never** commit `.env` (gitignored). On a new machine, re-enter the key.

### Duo mode — sharing one brain with someone else, what it does and what it does not

The same remote repository that keeps your two computers in step can keep **two people** in step.
That is **duo mode**: nothing to switch on, it is what the brain does once a second person pulls from
the same repository.
Nothing extra to install and nothing to configure: you add them to the private repository, and their
brain and yours pull from the same place. Here is the honest perimeter, because the part people
expect and do not get is the part that costs a day.

**What you now share: the notes.** Everything written into the vault travels both ways — captures,
person pages, meeting write-ups, the activity log. Ask your brain what the other person wrote about
a client and it answers from their notes, because they are yours now too.

**What you do NOT share: each other's tools.** A brain reads *your* mail, *your* messages, *your*
calendar, through the connectors signed in as you. Their brain does the same with theirs. So:

- **Giving someone access to your mailbox does not give their brain access to it.** Gmail
  delegation lets a person open your mailbox in *their own* Gmail window and read it with their own
  eyes. It stops there: the tools a brain uses have no way to name a mailbox other than the one
  they are signed in as. This is not a setting anyone can turn on.
- **Sharing a calendar DOES reach the other brain**, and it is the one place where this works
  properly. A calendar has an address, and the tools take one, so once you share yours, their brain
  can read your meetings the way it reads their own. If you want one thing to be shared
  automatically, make it the calendar.
- **A direct message is invisible to the other brain**, always — the same way it is invisible to you
  in the app. Only what both of you can see in a channel is common ground.
- **Chat workspaces do not add up.** Membership is per workspace: a brain sees the workspaces its
  own account belongs to. Being in the same *company* is not the same as being in the same
  workspace, and the difference shows up as a search that comes back empty for no visible reason.

**And you both keep writing.** Two people writing on the same day get one dated note each rather
than one contested file, and the places you only ever add to (daily notes, inbox, the activity log)
merge on their own. What you both **rewrite** — a person's page, a topic — stops and asks, on
purpose (see just above).

> 💡 In one sentence: **sharing a brain shares what you wrote down, not what you can see.** The way
> to put something in front of the other person is the way it always was — write it down.

## 8. Troubleshooting

| Symptom | Probable cause | Remedy |
|---|---|---|
| `npm install` fails in `rag/` | Node too old (or, before v3.1.0, too new) | Node ≥ 20 (`node -v`); Node 24/25/26 are supported since v3.1.0. The installer now preflights this and tells you what to switch to (nvm/volta). |
| `npm install` fails on **`better-sqlite3`** (Windows) | Native module without a prebuild for your Node version | Use an **LTS version** of Node (prebuilds available), or install the build tools: `npm install --global windows-build-tools` (old) or the *Visual Studio Build Tools* ("Desktop development with C++"). Then `cd rag && npm install`. |
| RAG fails at startup with **`NODE_MODULE_VERSION` mismatch** / "compiled against a different Node.js version" / `ERR_DLOPEN_FAILED` | **Native-dep ABI skew** — `better-sqlite3` was built under one Node, then loaded by another (only happens on a machine with several Node versions, e.g. after switching Node). | **Self-heals since v3.1.0**: the engine detects the skew and runs **one automatic `npm rebuild better-sqlite3`** under the current Node on the next start, then retries — no action needed (the first start after a Node change just takes a few seconds longer). To force it manually: `cd rag && npm rebuild better-sqlite3`. |
| Empty searches | Index not built / no key | `cd rag && npm run index` after setting the key |
| An answer quotes a note but with **outdated content**, or a note you know exists is **never found** | The note is on disk, but the index no longer matches it — typically frontmatter that broke after it was indexed, so every re-read is refused while the old version keeps answering | From the brain folder: `node scripts/verify-index.mjs`. It compares your notes with the index and **names** the ones they disagree about, read-only. Fix the frontmatter it points at (your brain can do it for you) — a restart or a reindex will not clear that one. |
| `RESOURCE_EXHAUSTED` / 429 | Today's Gemini quota reached | auto-resume at reset (Pacific midnight), or raise `MAX_EMBED_REQUESTS_PER_DAY` |
| RAG status "unavailable" at startup | RAG engine not yet installed / DB being written | `cd rag && npm install`; the status recovers once the index is built |
| The MCP server doesn't appear | `.mcp.json` missing (typically a **freshly cloned** brain — the file is gitignored) or its paths point at another machine | From the brain folder: `node scripts/rehydrate.mjs`, then **open a new conversation** rooted there and accept the server in Claude Code. *(Not the installer: it refuses an existing folder, by design.)* |
| **MCP smoke-test ❌** at the end of installation ("MCP connection KO") | `rag/` not installed, `.mcp.json` poorly generated, or `npx`/`tsx` unavailable | Your brain folder exists now, so the repair runs **from inside it**, not from the installer (which refuses an existing folder): `node scripts/rehydrate.mjs` reinstalls the dependency trees and rebuilds any missing wiring. Check that `.mcp.json` points at the launcher — `rag/launch.sh` (macOS/Linux) or `rag\launch.cmd` (Windows) — with the brain folder as `cwd`. Manual test, from the brain folder: `/bin/sh rag/launch.sh` (or `cmd /c rag\launch.cmd`) should start without crashing (the Gemini key is **not** required for this test). |
| Memory feels tight with several brains open in **Claude Desktop** | Each open brain keeps **one warm search engine** in RAM (the MCP server lives with the parent session, not your typing) | Close the brain conversations you're not using — each open brain conversation holds one warm embedder in RAM. |

## 9. Data privacy

Your vault may contain **professional / confidential** material. Two services may see your content —
and in both cases, the right plan/settings keep it from being **used for training**.

### Claude (the reasoning)

Claude Code reads your vault to respond.
- **API, Team, Enterprise**: by default, your data is **not used** to train the models.
- **Consumer** (claude.ai Free/Pro/Max): go to **Settings → Privacy** and **disable**
  the use of your conversations for model improvement.

### The embedder (the RAG / embeddings)

> This sub-section only concerns the **API key option (Gemini)**. In **fully-local** ("Gemma
> inside") or **Ollama**, **nothing leaves**: the text of your notes never leaves your machine, and
> there is no key, no cost, no provider caveat.

In the **Gemini** option, the engine sends the **text of your notes** (and of your queries) to the Gemini API
to compute the **embeddings** — that's all: Gemini never "responds", and the vectors are
stored **locally** (`rag/.cache`).
- **Free tier**: ⚠️ Google **may use this content to improve its products**, and a
  **human review** is possible. To be avoided for confidential material.
- **Paid tier** (billing enabled on your key / Google project): Google commits to **not**
  using your content for training, with no human review. **This is the gesture that puts your
  data out of reach.**

**And it costs almost nothing** (`gemini-embedding-001`, order of magnitude ~$0.15 / million
indexed tokens):

| What you index | Approximate cost (one-shot) |
|---|---|
| ~1,000 notes (≈ 500 words each) | **~€0.10** (about ten cents) |
| ~10,000 notes | **~€1** |
| Your **queries** (a few dozen tokens) | **negligible** — tens of thousands of questions for ~1 cent |

> The index is **incremental**: only **modified** notes are re-embedded → the recurring cost
> is near zero. Bottom line: for the price of a coffee (over a whole year), you take your data out of
> the training scope.

### 100% local — **shipped** (recommended default)

So that **nothing** leaves your machine, the **fully-local** embedder is **shipped and recommended by
default** (D1, ADR 0007): `InProcessEmbedder` runs **EmbeddingGemma** *in-process* (via
Transformers.js, no key, no app to install — `EMBEDDING_PROVIDER=in-process` in `.env`). Measured at
**90%** on the eval-set (= Ollama, > Gemini 80%). Recommended from **12 GB of RAM** (excluding Intel Mac;
OS peak ~4 GB during indexing, `EMBED_BATCH=4`). **Ollama** variant (`EMBEDDING_PROVIDER=ollama`) for
Intel Mac or a specific model. The engine stays modular (`Embedder` SPI port): switching options
re-encodes in a few minutes, **without losing a single note**.

> Anthropic's and Google's terms **evolve**: check them at the time you read this (Anthropic
> Privacy Center · *Gemini API Additional Terms of Service*).

## 10. Keeping your engine up to date (`update-engine`)

Your brain ships with a built-in, **opt-in** updater for its **engine** — the RAG search code
(`rag/src`), the launchers, and the engine-owned scripts (`scripts/`). It **never** touches your
notes, `.env`, `CLAUDE.md`, `.claude/settings.json`, your own skills or any engine skill you
tailored: it only writes files that `engine-manifest.json` declares Engine-owned.

> 🗺️ **`engine-manifest.json` is the readable map.** It lists *what counts as the engine* and records a
> `source: { repo, ref }` — the launcher's git URL and the exact tag/commit your engine was built from.
> That's where a newer engine is pulled from. You **don't** re-run the installer to upgrade, and you
> **don't** start over from a fresh launcher folder: the updater lives **inside** your brain
> (`scripts/update-engine.mjs` + `scripts/lib/**`, both carried by every brain — so the updater can
> even update **itself**).

### Which version am I on?

Your brain **says so at the start of every session**: a `⚙️ Kenjaku engine v4.7.0` segment in the
opening banner, on the command line as well as in the Code tab of Claude Desktop. It reads the tag your
engine was installed or last updated from (`source.ref` in `engine-manifest.json`), so it follows your
updates instead of freezing at install day. Two silences are deliberate: when the manifest carries no
usable tag the segment simply **doesn't appear** (rather than showing a number that isn't a Kenjaku
release), and when a restart is pending the restart nudge takes the floor — until you restart, the
version you'd read isn't the one answering you. `/rag` repeats the engine version at any time.

**And it says whether that version is the latest**, right on the same line: `· up to date (checked
2026-08-05)`, or `· v4.8.0 available (1 release ahead) — ask me to update your engine`. When it could
not find out — no network, a source that didn't answer — it says **that**, and never *"you're up to
date"*: those are opposite answers, and only one of them is good news. The look-up runs in the
background (once a day at most), so your session start never waits on it.

> 🔎 **What that daily look-up is — and, more importantly, what it is NOT.** It is **one anonymous
> request a day** to the engine's public repository — the address written in your own
> `engine-manifest.json` (`source.repo`) — asking a single question: *"which versions have been
> published?"* (`git ls-remote --tags`). Then, **only if your brain turns out to be behind**, a **single**
> request to GitHub's public release list, to read the title and the `What you get` section of the
> releases you are missing — so the offer can tell you what it is for. **A brain that is already up to
> date makes no HTTP call at all**, and a brain hosted anywhere but GitHub simply stops at the versions.
>
> What it is **not**: it does **not** add a git remote to your brain, does **not** push or send anything
> anywhere, and has **nothing to do with your own backup repository** (§7) — that one stays yours, and
> stays untouched. **Nothing of your notes, your vault or your usage ever leaves.** Nothing is
> downloaded or installed either: finding out and updating are two separate steps, and the second one
> still waits for your yes. Offline, the check simply fails quietly and your session carries on.
>
> There is **no switch to turn it off** — deliberately, and documented here rather than hidden: knowing
> that a fix exists is part of the engine being trustworthy. If you would rather it never looked, remove
> `source.repo` from your `engine-manifest.json`; your brain will then say it has no source to check, and
> updating becomes a manual affair.

### To trigger it — just ask, in plain conversation

> *"Update your engine."* · *"Is there a newer version of your engine?"* · *"Upgrade the brain's
> search engine."*

**It finds out before it asks you anything.** A read-only check names the version you would be
installing, how many releases you are behind, and — quoted from each release note — what you'd
actually gain. Nothing is downloaded or changed at that point; you decide with the answer in front of
you. If you are already on the latest release, it says so and stops there, instead of reinstalling the
same code and charging you a restart for it.

Then, and only if you say yes, it runs the update and reports what changed: **new version · files
swapped · skills brought up to date (and those left as you tailored them) · whether a reindex ran ·
"your files were untouched".**
Because the engine is **observable** (it knows its own version), the brain may also **proactively
offer** the update.

### What it does, step by step

1. **Shallow-clones** the pinned `source` into a **temporary** directory (discarded at the end).
2. Reads the **target** `engine-manifest.json` → the new `engineVersion` + `indexSchemaVersion`.
3. Computes a **write-allowlist** plan: overwrite the `replace` bucket (`rag/src`, etc.),
   **regenerate** the `.sh`/`.cmd` launchers, replace the engine-owned scripts (including the updater
   itself).
4. **Brings the engine skills you never edited up to date.** Your brain records a fingerprint of every
   skill file the engine delivered, so it can *prove* which ones you never touched: those are refreshed
   to the newer version, and improvements shipped since your install finally reach you. **A skill you
   tailored is never LOST** — and since v5.0.0 that is a stronger promise than "never touched", because
   it now has three possible outcomes instead of one dead end:
   - **Merged.** Your brain keeps the exact bytes it delivered to that file last time, so it can tell
     your edits from the engine's. Where the two do not collide, both survive: your words stay, and
     what shipped since arrives around them. Nothing to do, nothing to arbitrate.
   - **Offered.** Where the two touch the same lines, or where nothing can be proved about that file's
     history, **your version stands byte-for-byte** and the engine's newer one is dropped **beside** it
     as `<skill>/SKILL.md.new`. The update report names the file *and* that path, and your brain raises
     it in conversation with three real answers: take the new one, keep yours, or combine them. Say
     which, and it carries it out — your current version is committed to your brain's history first, so
     "take the new one" can always be undone.
   - **Said out loud, between updates too.** A file it is holding back is named in the session banner,
     with the version it is behind, until you answer. Answering settles it until the *next* release.

   *(The technical door, if you ever want it by hand: `node scripts/adopt-engine-file.mjs <file>
   take-theirs|keep-mine|combine --from <path>`. Ask in plain words instead — the skill drives it.)*
5. Runs `npm install` in `rag/` — this installs the engine's **dependencies locally**; it does **not**
   pull your brain from any registry (self-hosted, ADR 0001).
6. **Reindexes only if** `indexSchemaVersion` changed (a few minutes); otherwise your index is left
   as-is.
7. Records the new `engineVersion` + `source.ref` and re-seeds the provenance fingerprints, so what it
   just delivered stays refreshable at the update after that.

### Prerequisites & guarantees

- **Prereqs** (same as install): **git**, **npm**, and a **network** connection to reach the recorded
  `source`.
- **Fails loud, never half-applies.** If a step fails, it stops with a clear error (non-zero exit) and
  leaves your brain working as before.
- **Sacred by construction.** An update never writes to your `vault/` notes, `.env`, `CLAUDE.md` or
  `.claude/settings.json`. This is enforced mechanically — the plan is a **write-allowlist** driven by
  `engine-manifest.json`, plus a defense-in-depth scrub of those paths (never an `rsync --delete` of
  the folder). **A skill you customized is protected differently, and the difference matters**: it is
  off the copy path entirely — nothing is ever *pasted over* it — but the engine may reach it through a
  **merge from the exact version it delivered to you last time**, which is how your edits and the newer
  content end up in the same file. It can never do that from a version it cannot prove, and never on a
  collision: there, your file is untouched and you are asked. *"Never written to" was the old promise
  and it was a freeze; "never lost" is the one that survives an update.*

> 🛠️ **Run it yourself** (technical, optional). From the brain folder:
> ```bash
> node scripts/update-engine.mjs --check   # read-only: what is upstream, and what it contains
> node scripts/update-engine.mjs           # the update itself
> ```
> Same deterministic core the skill drives. `--check` writes nothing and always exits `0` (including
> when it could not find out — that's an answer, not a failure); the update exits non-zero on failure.
> (Day to day you don't need either — just ask your brain.)

## 11. Importing a previous brain's notes (`import`)

> 🆕 **New in v3.1.0.** If you had a second brain **before v3.0.0**, it has no built-in updater — the
> way to v3 is to **install a fresh 3.1.0 brain and import your old notes into it.** The `import` skill
> makes that a safe conversation instead of a manual copy-paste.

### The flow

1. **Install a fresh brain** (§2) — it's a 3.1.0 brain, shipping the `import` skill.
2. **Open a NEW conversation rooted in the new brain** (§2 hand-off — Desktop folder chip, or `cd … &&
   claude`). The import must run *inside* the new brain.
3. **Ask in plain words:** *"importe mes anciennes notes depuis `<chemin>`"* / *"import my old second
   brain from `<path>`"*. The skill shows a **plan** (no writes), you **confirm**, it copies, then
   re-indexes.

### What travels — and what never does

- **Travels:** your notes (`.md`) and their **attachments**, with **subfolders + accented names
  preserved**.
- **Never travels:** the old **engine** (`rag/`, launchers, scripts), the source's `.git` / `.claude` /
  `.obsidian` / dotfiles, and **demo/example notes** (`tags: [exemple]`).
- **Never overwrites:** a note whose name already exists in your new vault is **skipped and reported**,
  never clobbered.

> ⚠️ **The footgun:** point the import at your **old brain folder** (or its `vault/`) — it copies the
> *vault content only*. Don't hand-copy the whole old folder into the new brain.

### Caveats

- **First re-index** on a large vault takes a few minutes (the notes are encoded — nothing is lost).
- **Constitution not merged (v1):** a personalised old `CLAUDE.md` is **not** auto-merged — fold wanted
  bits in by hand.
- **`.env` / connectors** belong to the new brain (set at install); re-wire any old keys/connectors here.

> 🛠️ **Run it yourself** (technical, optional). From the new brain folder:
> ```bash
> node scripts/import-brain.mjs "<source>"          # prints the plan, writes nothing
> node scripts/import-brain.mjs "<source>" --apply   # copies, never overwriting
> npm run index --prefix rag                          # make the imported notes searchable
> ```
> Deterministic core (`scripts/import-brain.mjs` + `scripts/lib/import-vault.mjs`); exits non-zero on
> failure. (Day to day you don't need this — just ask your brain.)

## 12. Under the hood — components, skills & vocabulary

*For the curious and the technical. You don't need any of this to use your brain — the README's visual
"reliability, determinism, robustness" catalog is the conceptual tour; this is the component reference.*

### What's in the box

| Element | Role | Status |
|---|---|---|
| **`rag/`** | RAG engine (TypeScript MCP server): chunking, embeddings **à la carte** (local / API key / Ollama), semantic search, quota guardrails | ✅ ready to use |
| **`local-mirror/`** | **Optional** second MCP server. Point it at a **Notion** zone; it keeps a **fully-synchronized local copy** in your vault so the RAG searches & **cites** it offline. Driven by `/local-mirror`. *Built as a **fallback** for teams with **no golden-source RAG** in reach; a pragmatic alternative, **not a target**.* | ⚙️ optional |
| **`vault/`** | Your Markdown content (example notes included) | 🔧 to fill in |
| **`CLAUDE.md`** | The rules Claude follows (4-phase flow, conventions, posture) | 🌱 bootstrap stub in the launcher → the installer **generates** a personalized version **in the brain**, then to be tailored |
| **`.claude/skills/`** | Shipped skills (see below) + ideas for other skills | 🔧 to flesh out |
| **`.claude/settings.json`** | Hooks (auto-commit, startup status) + permissions | ✅ generated |
| **`scripts/*.mjs`** | Cross-OS Node hooks: repo + RAG state at startup, auto-commit | ✅ ready |
| **`installer.mjs`** | Installer: **creates the brain folder** from the launcher (macOS / Linux / Windows) | ✅ |

### The skills you call

Everyday capabilities, invoked in plain words (the `/name` is the explicit form):

| Skill | What it does |
|---|---|
| **`/coach`** | **"In-your-face" coach**, a sparring partner wired to your vault, *Radical Candor* spirit (caring AND brutally honest): it challenges your decisions, names your blind spots. *Self-coaching only.* |
| **`/prepare-1-1`** | Prepares a 1-1 **both ways**: with **your manager** or with someone **you manage** (tracking commitments, KPI review). Cross-references the person's profile + last 1-1 + recent signals. |
| **`/improve`** | Evolves your harness: reads the frictions, proposes and applies the useful improvements. |
| **`/local-mirror`** | Plugs your brain onto a **local mirror** — a live zone of an internal tool (**Notion** today) that gets **mirrored into your vault** as Markdown, so the RAG searches and **cites** it. Declare one, then sync / refresh / inspect it. *The central RAG you don't have yet — but local, right now.* |
| **`/switch`** | Switches the **active universe** (a soft retrieval scope), lists your universes, or creates a new one. Also records **what a universe is** (your role there, its people, its topics, which accounts your tools use — see §5.1). Invisible until you have a second universe. Renaming one is a normal request (§5.2); deleting one is never offered and is a command **you** run yourself (§5.3). |
| **`/import`** | Imports the notes of a **previous** brain into this one (safe plan → confirm → copy → re-index). See §11. |
| **`/rag`** | Tells you where your **search index** is at: how many notes and passages are indexed, whether the live watcher is running (a note saved in Obsidian is searchable within seconds), which embedder you're on, and the engine version. Re-indexes on demand — though day to day you never have to. |
| **`/update-engine`** | Upgrades your brain's **engine** (search code, launchers, engine scripts), opt-in, **never touching your notes**. See §10. |
| **`/sync`** | Syncs your repo between machines — useful mostly if you have **several laptops**. Rarely needed day to day. |

**Wiki-health skills (keep your knowledge tidy).** Engine-managed skills that watch the vault for decay
and always **propose** fixes you confirm (never a silent rewrite):

| Skill | What it does |
|---|---|
| **`/lint`** | **Health-checks the wiki**: reports dangling `[[links]]`, orphan notes nobody links to, stale entity pages, and malformed frontmatter. The diagnosis — you decide what to fix. |
| **`/consolidate`** | Promotes **raw captures** (recent meetings, daily notes, transcripts) into durable **entity / topic pages** — creating or enriching the higher-order wiki page. |
| **`/file-back`** | After a substantive exchange, **proposes distilling the answer** into a durable note (topic / decision / person / meeting), with a suggested target page. |
| **`/open-note`** | Opens a vault note from an *"open X for me"* intent (semantic + exact match) in Obsidian; if none exists, it synthesizes the topic. |
| **`/mcp-token-expired`** | Helper: what to do when a native claude.ai connector (Slack, Calendar, Notion, Drive, Gmail) returns an **auth error** — how to re-authenticate. |

### The internal tooling (you don't call it)

| Element | Role | What triggers it |
|---|---|---|
| **`sync-sources`** | Pulls the **delta** of external sources in parallel **read-only** sub-agents — the engine behind Phase 2. 🔧 to wire to your connectors. | **your questions** (never you) |
| **auto-commit hook** | **Commits** your vault on every change (and **pushes** it if you've enabled a remote repository — *opt-in*, off by default). This is what means a **non-technical** profile **never has to know git**: everything is versioned on its own, locally, nothing gets lost. | automatic |
| **`test-first-discipline`** | Vendored test-first discipline — used to develop *the harness itself*. Replaces `tdd-discipline`, which the engine has retired: if your brain still holds an untouched copy, an update removes it and says so. | Claude, when modifying the harness |

The rest is **not shipped**: those are **skill ideas** to let emerge as you need them, detailed in
[`.claude/skills/EXAMPLES.md`](.claude/skills/EXAMPLES.md) — e.g. `briefing-journee` (morning briefing),
`briefing` (recap after an absence), `prepare-meeting`, `weekly-review`.

> **Skill ≠ connector.** Slack, Drive, Notion, Calendar are **connectors** (data sources), not skills.
> You wire them up in the installer (§6). A *skill* is a procedure that leverages these sources.

### The vocabulary in 30 seconds

<details>
<summary>Unfold the mini-glossary</summary>

- **Vault** — the folder where your notes live (in Markdown).
- **RAG / semantic search** — the tech that finds a note by the *meaning* of your question, not by
  exact keywords.
- **Embeddings** — the translation of a text into numbers, to compare *meanings* with each other.
- **Skill** — a procedure you trigger (e.g. "prepare my 1-1").
- **Connector** — a hookup to one of your sources (Slack, Drive, Notion…). Two forms: **native**
  (enabled in your Claude account settings) or **MCP** (a server declared in `.mcp.json`).
- **Harness** — the set of rules (`CLAUDE.md`) + skills that you personalize.
- **Hook** — an automatic action triggered by an event (e.g. save on every change).
- **Installer** — the program that sets everything up for you.
- **Repo / git** — the versioned place where everything is stored and backed up.
- **Universe** — a soft retrieval scope (a past employer, a client, a sphere); see `/switch`.
- **Profile** — the note describing what a universe *is* (role, people, topics, accounts); see §5.1.

</details>
