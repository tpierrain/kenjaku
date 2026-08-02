---
name: rag
description: "Reports the state of your brain's search index — the RAG: how many notes and chunks are indexed, whether the live watcher is running, which embedder is in use, and the engine + index-schema versions. Re-indexes on demand too. The front door for the words owners reach for: '/rag', plus 'index status', 'is my index up to date', 'how many notes are indexed', 'reindex my vault', 'où en est mon index', 'combien de notes sont indexées', 'réindexe mes notes'. ('/status' is the host's own built-in and never reaches here — ask in plain words instead.)"
version: 1.0.0
---

# rag — the front door to your index

> The engine already knows all of this. This skill exists for one reason: **it wears the name
> people reach for.** An owner of a RAG-backed brain types `/rag` before anything else, and until
> this skill existed the host answered *"Unknown command: /rag. Did you mean /run?"* — pointing at
> an unrelated built-in. Nothing was broken; the **door had no sign on it**.

## Principle

**Report the status, never compute it.** Every number below comes from a tool the `vault-rag`
server already exposes. This skill routes and translates — it does not derive, estimate, or infer.
A figure that no tool returned does not get said (the repo's *don't pretend* rule, turned inward).

## Procedure

### 1. "Where is my index at?" → `vault_stats`
Call the **`vault_stats`** tool of the `vault-rag` MCP server and relay what it returns. It already
carries everything the question is about:

- **Documents / chunks** indexed, and the breakdown by note type.
- **Watcher liveness** — whether the live-update watcher is running, and what it last did.
- **Embedder identity** — which engine vectorizes the notes (fully-local, Ollama, or an API), plus
  the daily quota **when the provider has one** (an API); a local embedder has none, and none is
  displayed.
- **Engine + index-schema versions**, and whether the index was built against the running one.

Then say it in the owner's words, briefly. The useful translation, not a gloss of every line:

- **Documents** = your notes. **Chunks** = the passages they were cut into; search works on those,
  so a rising chunk count on a stable document count simply means notes grew.
- **The watcher running** = a note saved in Obsidian is searchable **within seconds**, with nothing
  to run by hand. If it is **not** running, say so plainly and offer step 3.
- **A stale index** (embedder changed, or schema moved) = search is gated until a re-index; the
  engine says so itself and offers the re-index. Relay the offer, do not pre-empt it.

### 2. "Is it actually working?" → `health_check`
When the ask is about *trust* rather than *volume* ("is my brain OK?", "est-ce que ça marche ?"),
call **`health_check`**. It is lightweight, **never re-indexes**, and returns a binary verdict:
the canary note is found from the vault, the index is queryable, the embedder loads. Relay the
verdict as-is — including a failing one.

### 3. "Re-index" → the `reindex` tool
Call **`reindex`**. It is **incremental by default**: it re-reads only what changed, and reports
files scanned / indexed / skipped / removed, plus any errors. Relay those numbers verbatim.

- **A full rebuild (`force: true`) only when the owner asks for one**, or when the engine itself
  asked for it (a changed embedder or a moved index schema). It re-embeds every note: minutes, and
  on an API embedder it spends quota. Say that cost **before** running it.
- **Day to day, re-indexing is not a chore the owner owes.** The watcher does it. If someone asks
  for a re-index out of doubt, run it — then tell them it was not needed, so they stop wondering.

## Guardrails

- **Never a number nobody measured.** No "it must have indexed", no rounded-up count. If a tool
  did not return it, the honest answer is *"I did not check that"* — and then check it.
- **If the `vault-rag` server is unreachable**, say exactly that (the tools are absent), rather
  than reporting a healthy-looking status from memory. Suggest re-opening the conversation from the
  brain folder, or `/mcp`.
- **This skill reads.** It re-indexes on request; it never edits, moves or deletes a note.
- **The neighbouring words.** `/rag` is the door. `/status` belongs to the host (Claude Code's own
  built-in) and cannot be claimed — plain words get here instead. `/index` and `/reindex` are not
  separate commands either: the description above routes them here in plain language.
