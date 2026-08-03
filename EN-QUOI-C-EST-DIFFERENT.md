# What makes it different — from the recipe you cobble together yourself and from the other "second brains" / "LLM wikis"?

> **In one sentence.** You can cobble together a "second brain" with a `CLAUDE.md` and a few
> notes — like the recipes making the rounds on social media. Here you get **the same idea, but made
> robust and automatic**: Markdown files that **you own**, semantic search that **cites its sources**,
> **cutting across** all your tools, an **à la carte engine** — and above all guardrails that make
> sure **it actually works** instead of merely *seeming* to work.

The real comparison you're after probably isn't "this project *vs* Notion AI". It's
**"this project *vs* the `CLAUDE.md` + a few notes recipe I saw going around on social media"** —
so that's where we start. Then come the things that make the approach singular — how it
**works**, the fact that it's a **generator, not a product**, the **brain** itself, its
**installation/packaging**, the **à la carte RAG** —, its **owned-up limitations**, and — right at the bottom,
for the record — a glance at the **landscape of market apps**.

---

## 1. Why it isn't "just a `CLAUDE.md` + a few notes"

It's the natural reflex of anyone who knows the tool a little: "a second brain is really just
a Markdown folder + a rules file you make Claude read, right?" Done **carelessly**,
it **looks** like it works… then it **fails silently** — the worst kind of failure, because you
don't even notice.

Robustness, here, doesn't fall from the sky:

> 🧱 **Packaged, invisible, tested hardening mechanisms — plugging, one by one, the
> holes where the cobbled-together version breaks.**

Concretely, hole by hole:

| Done "carelessly" (a `.md` + a `CLAUDE.md`) | The silent symptom | The hardening mechanism here |
|---|---|---|
| No automatic persistence | Your answers/notes are **never saved**; everything is lost | **Auto-commit hook** (+ *opt-in* push) |
| No indexing | Search **makes things up** instead of searching your notes | Automatic **incremental reindexing** of the RAG |
| A note whose header the indexer can't read | The note is **never indexed** — invisible to search — while the counter reads *"pending"*, as if it were on its way | **Refused at write time**, by the engine's own parser, + a **vault ↔ index crosscheck** that names any note the two disagree about |
| Conversation not "rooted" in the brain | Mute hooks, out-of-vault answers — *and it seems to work* | Onboarding that **forces opening in the right place** + `pwd` check |
| `node` installed via nvm, invisible to GUI hooks | Auto-commit **silently broken** | **`run-node`** wrapper that re-resolves the toolchain on every run |
| Install on a bare machine | Half-working **"Frankenstein"** state, undiagnosable | **"Fail-loud" verification** at install — proves it or fails plainly |

> 🛡️ **The through-line: fail loudly rather than pretend.** At install, a deterministic
> verification (`verify-rag`) **proves** that the demo answers *from your vault* (the
> "Mollecuisse" canary, not findable anywhere else). Until that's green, we don't tell you it's
> ready. It's the exact opposite of "it looks like it works".

### The result: almost nothing to do (the affordance)

Once setup is done (just once, ~15 min, guided), **there's nothing left for you to do**: you ask
questions, you read answers. Everything else runs on its own.

- **Backup**: every change is **committed automatically** (and **pushed** if you've wired up
  a remote repository). You never have to know git exists.
- **Indexing**: the semantic index **rebuilds itself**, incrementally, as soon as the vault
  changes.
- **Freshness**: on every question, the delta of external sources is pulled in the background.
- **You have to understand neither how it's built nor how it's organized** — not git, not MCP, not
  embeddings, not hooks.

This is **affordance** in the proper sense: the design makes the right behavior **automatic** and
**hides the complexity** instead of dumping it on you. All these guardrails are **packaged** — you
don't have to know them or assemble them; the generator sets them up for you, and usage stays "ask your
question, that's it".

> 🧬 **"Organized for you" is part of the DNA.** The *"nor how it's organized"* isn't a detail
> being hidden: it's a **deliberate stance**. You don't have to design a tree structure, nor wonder
> "where does this note go?". The brain starts from **sound conventions** (dated notes, *people* /
> *topics* / *decisions* cards, frontmatter, `[[wikilink]]` links) then **proposes and evolves the
> structure best suited to the needs *you* express**: you say what you want to track (your
> teams, your product decisions, a client domain…), it infers and maintains the organization. That's
> the *use case driven* spirit — the structure **emerges from your usage**, it's neither imposed on you
> up front, nor left on your shoulders.

> 📌 *Founding episode/decision:* the founding anecdote (Richard's bare machine, the
> "Frankenstein" state) and the "trust Claude + fail loudly" reversal are in ADR
> [`0005`](maintainers/decisions/0005-support-desktop-code-tab.md).

---

## 2. How it works: "answer right away, verify afterwards"

Where many tools make you **wait** for a search to finish, here the stance is
**experience first** — the web's *stale-while-revalidate* pattern applied to your memory:

```
Question
   │
   ▼  PHASE 1 — Immediate answer from the vault (semantic search)
   ├──▶ PHASE 2 — (optional) Sync external sources in the background
   ▼  PHASE 3 — Amend the answer if something new is found
   ▼  PHASE 4 — Persistence: everything is saved in the vault + auto-commit
```

- **Semantic search** (RAG): it finds a note **by meaning**, even worded differently —
  not by exact keywords. You can query in French notes written in English.
- **Delta, in the background**: on every question it pulls only **what's new** from the sources, and
  re-verifies while you read — freshness keeps up without penalizing speed.
- **Engine = standard MCP server.** The RAG is an **MCP** server (an **open** protocol), not a
  black box coupled to a vendor. The vault (pure Markdown) and the engine (MCP) are **already
  agnostic** — which keeps the multi-client door open at low cost.

---

## 3. The fundamental difference: a *generator*, not a product

It's the pivot that explains everything else.

A useful second brain is **personal**: what serves a Head of Engineering, a PM or a
researcher has nothing in common. A single product for everyone would be bland for each. So this repo
delivers you **not a brain** — it delivers you **the machinery** (the search engine) **+ a method**
(Thomas Pierrain's *use case driven* approach). You start from a **seed**, and you grow it
by using it: your notes, your rules (`CLAUDE.md`), your skills.

| | Classic "second brain" tools | This approach |
|---|---|---|
| **What's delivered** | A finished product, identical for everyone | A **generator** that produces **your** instance |
| **Customization** | Settings in a closed UI | **Your constitution** (`CLAUDE.md`) + **your skills**, in the clear, editable |
| **Sharing** | Shared accounts/spaces | We share the **generator**, not the brain: everyone has their own |

> 📌 *Underlying decisions:* [`maintainers/decisions/0001`](maintainers/decisions/0001-launcher-vs-brain.md)
> (reusable launcher vs brain created elsewhere) and
> [`0002`](maintainers/decisions/0002-in-house-installer-vs-plugin.md) (home-grown installer rather
> than a plugin).

---

## 4. The brain itself: 4 properties the others don't all have

1. **It's yours, in an open format.** The substrate isn't a proprietary database: it's a
   folder of **Markdown** files linked by `[[wikilinks]]`, **Obsidian-compatible**, in
   **your private git repo**. You're **not a tenant** of a SaaS — you're the owner, and you can
   read/edit/export everything without the tool. **Zero lock-in.**
2. **It remembers.** It's not a memoryless "chat with your docs": every answer, every
   new piece of info is **persisted** in the vault and **committed automatically** (git). The memory
   **grows** with every question — and a non-technical profile **never has to know git**.
3. **It's cross-cutting.** Not walled off to a single tool: Slack **+** Drive **+** mail **+** meeting
   transcripts **+** your notes, in one place, via **connectors** (native claude.ai or MCP).
4. **It cites its sources, and stays grounded.** Every answer traces back to the originating
   note/message, with its date. The demo **proves** it with a canary (a made-up fact, "Mollecuisse / Flemmr",
   not findable outside the vault): if the right answer comes out, it means the brain genuinely queried
   **your** data and not the Internet. And when a search comes back empty, it tells you **"I found
   nothing"** — never *"nobody decided"*: a silence it has not verified is reported as a silence, not
   promoted into a fact.

And a rare stance: **safe by construction.** The brain **takes no action** on your
tools — it **reads and answers**, period. Nothing goes out in your name. (Action capabilities can be
added later, **deliberately and under your control**, never by default.)

---

## 5. Installation & packaging: self-sufficient, no upstream dependency

| | Usual approach | Here |
|---|---|---|
| **Distribution** | Plugin/marketplace, or a SaaS account to create | **Home-grown installer** driven **in chat** by Claude: "ask me questions, I'll install myself" — designed **non-tech** |
| **What gets created** | A space at the vendor's | An **owned git repository**, with its custom-generated `CLAUDE.md` constitution |
| **Upstream dependency** | The app can change/break/shut down under you | **None**: the brain is **self-sufficient**, works **offline forever**, as generated |
| **Evolution** | Update forced by the vendor | **Local iteration**: you add/modify your own skills, in your brain. Engine improvements reach you **only when you ask for an update**, and only on the skills you never edited: anything you tailored is preserved, never overwritten |

The **launcher** (this repo) is **reusable and never modified**: it **creates elsewhere** a fresh
brain folder (copies the files + `git init`, **0 remotes**), so **no link** to the launcher,
by construction. Backup/multi-machine = wire up **your** remote repository, **opt-in** (nothing is
pushed until you ask for it). On a **second machine**, cloning that repository is not quite enough —
the files that carry the machine's own paths are deliberately not versioned — so one **offline**
command rebuilds them locally (`node scripts/rehydrate.mjs`): nothing is fetched from here, and the
launcher is not needed again.

> 📌 *Underlying decisions:* [`0002`](maintainers/decisions/0002-in-house-installer-vs-plugin.md)
> (home-grown vs plugin), [`0003`](maintainers/decisions/0003-no-brain-capability-upgrade.md)
> (self-sufficiency rather than upstream upgradability).

---

## 6. The "à la carte" RAG: you pick your engine according to **your** constraints

It's arguably the most structuring differentiator — and the least common elsewhere. Most
tools **impose** a search engine on you (often a single cloud API). Here, the RAG engine
is designed as a **hexagon**: its **MCP** surface (the `search_vault`, `get_document`… tools)
is a **stable contract** the whole harness depends on, while the **embedding engine, the
vector store and the chunking are interchangeable adapters** (`Embedder` SPI port).

Consequence: **you pick your embedding engine at install time**, according to your needs (privacy,
budget, machine power, OS) — **without breaking** either your notes or your skills (changing options
re-encodes in a few minutes, no note lost). **Three options shipped**, from the most private to
the most lightweight:

| Embedding option | For whom | Stack |
|---|---|---|
| **Everything on your machine** ("Gemma inside", recommended default ≥ 12 GB RAM, excluding Mac Intel) | Non-dev, free, **private**, nothing to install | `InProcessEmbedder` — **EmbeddingGemma** via Transformers.js, **in-process** (zero app, zero key) |
| **With an API key** (recommended on a small machine / Mac Intel) | Wants zero machine load, accepts cloud + key | `OpenAiCompatibleEmbedder` or native **Gemini** — configurable key + URL (OpenAI, Azure, **enterprise endpoint**…) |
| **Local via Ollama** *(advanced)* | Wants fully-local on Mac Intel or a specific model | OpenAI-compatible adapter pointed at `localhost:11434` (**separate app** to install) |

> ✅ **Shipped (2026-06-09).** It's no longer an ambition: the installer **poses the choice** (option C of
> ADR 0007) and the **recommendation adapts to the machine** (in-process if ≥ 12 GB & not Mac Intel,
> otherwise key). Measured: the in-process "Gemma inside" scores **90%** (= Ollama, > Gemini 80%) on
> the eval-set. The architecture (stable MCP contract + SPI port) is what makes the swap **safe**:
> index identity stamp + explicit confirmation, never a silent reindex. See
> ADR [`0007`](maintainers/decisions/0007-three-embedder-adapters-privacy-scale.md)
> (decision + addendum D1) and [`0006`](maintainers/decisions/0006-rag-mcp-is-stable-contract.md).
>
> 🔭 **Still at the ambition stage** (not shipped): the opt-in **"big machine"** profile (heavy
> embedder such as Qwen3, reranking, possibly GraphRAG/LightRAG — cf. ADR
> [`0008`](maintainers/decisions/0008-lightrag-graph-rag-deferred.md)).

---

## 7. What it is **not** (the owned-up limitations)

Honesty is part of the approach:

- **It's not "100% private" end-to-end.** The RAG (embeddings + index + search) is
  **entirely local by default** (the "Gemma inside" option), but the LLM that **reasons and answers
  is still Claude** (cloud). We don't oversell: the on-device piece is the search, not the generation.
- **It's not zero-install or zero-skill to get started.** Daily **usage** requires
  no skill; **installation** (once, ~15 min) assumes git + Node (and an API key
  *only* if you choose the key option — the fully-local option doesn't ask for one) — guided step by step,
  verified by the installer.
- **It's not (yet) multi-AI.** It's **Claude-only** for now (the driving layer:
  hooks, skills, constitution). The vault and the engine stay agnostic so as not to close the
  door — but cross-platform isn't shipped.
- **It's not a synced fleet.** No central update pushed onto the generated brains:
  each is frozen at its install version and **evolves locally**. It's a choice
  (self-sufficiency), not an oversight.

---

## 8. So, who is it for — and when to prefer something else?

**This approach shines if** you want to **own** your memory (open format, your repo), want it
**cross-cutting** across all your tools, **sourced** and **persistent**, and want to **shape** it
to your usage (even if it means touching the install a little, once).

**A classic SaaS will probably be simpler if** you want turnkey collaborative zero-install,
ownership/open format are indifferent to you, and the scope of a single tool
is enough for you.

---

## 9. For the record — and compared to the market apps?

*(The "product *vs* product" comparison isn't the heart of the matter — it's mainly the cobbled-together
recipe from §1 that people hesitate to replace. We keep it here, to situate things.)*

"Second brain" / "LLM wiki" covers, loosely, very different families of tools:

| Family | Typical examples | The model |
|---|---|---|
| **AI note apps (SaaS)** | Notion AI, Mem, Reflect, Tana… | Your notes live **at the vendor's**; the AI answers from **that single tool**. |
| **Local "chat with your notes"** | Obsidian + plugins (Smart Connections…), Logseq, AnythingLLM, Khoj… | You ask questions to a folder of notes; scope = **that folder**, often a wiring to configure yourself. |
| **"Knowledge" GPTs/Projects** | Custom GPT, Claude Projects, NotebookLM… | You **upload** docs into a space; handy, but **walled off** and hosted at the vendor's. |
| **A tool's AI search** | Slack search, Glean, Google Workspace AI… | Excellent **within a tool's scope** (or a suite's), but not **your** cross-cutting memory. |

Three recurring limits bring them together: they're **single-tool** (or single-suite), your data
is **at a third party's in a closed format**, and they **don't accumulate** a memory that follows you and
cites its sources verifiably — precisely the three points this approach takes
the opposite way.

---

### Going further

- [README](README.md) — the full tour (installation, under the hood, connectors).
- [SETUP.md](SETUP.md) — step-by-step, privacy, remote repository, troubleshooting.
- [`maintainers/decisions/`](maintainers/decisions/) — the ADRs (the *why* of each stance).
- Thomas Pierrain's article series (links at the bottom of the README).
