---
name: open-note
description: "Open a vault note from an 'open X for me' intent. First looks for a relevant markdown in the vault (semantic + exact match) and opens it as-is if it exists; otherwise synthesizes the topic from the vault, writes a note that follows the conventions, and opens it. Triggered when the user says 'open X for me', 'open the note about X', 'ouvre-moi X'."
version: 1.1.0
---

# open-note — "open X for me"

> Default behavior of the natural command **"open <topic> for me"**.
> Goal: the user always has something to read in front of them — either the existing note,
> or a fresh synthesis created on the fly and persisted into the vault.

## Principle

One promise only: **"open X for me" never falls into the void.**
- If a vault doc is about X → open it **as-is** (do not modify it).
- If nothing covers X → **synthesize** from the vault, write a note that follows the
  conventions, and open it.

The judgment (which doc, whether to create one, where to file it) stays in the skill; the
**opening itself is deterministic and is NOT this skill's rule to invent** — it belongs to the
constitution's §"Opening / viewing / editing a note" (ADR 0027), which this skill obeys as-is.

## Procedure

### 1. Understand the target
Extract the topic from the request. Three cases:
- **Known file** (exact path, precise date, obvious note name: `daily/2026-06-12`,
  "the prep for <first-name>", "the backlog for <initiative>") → go straight to step 3
  (direct open, **no RAG**).
- **Semantic topic** ("what we know about front-end governance", "the <theme> topic") →
  step 2 (search).
- **Ambiguous** → treat as semantic, and resolve the ambiguity by surfacing the candidates.

### 2. Search the vault
- `mcp__vault-rag__search_vault` first (semantic, ~300ms, free).
- `grep`/`find` as a complement for exact matches (name, identifier, date).
- Judge the **relevance** of the best match: does this doc really cover X, or just
  mention it in passing?

### 3. If a relevant doc exists → open it as-is
Open it **exactly the way the constitution prescribes**: a note of the vault goes to Obsidian
through `obsidian://open?path=<url-encoded-abs-path>` handed to the OS opener (`open` / `start ""` /
`xdg-open`), anything else goes to the OS opener on the file itself. Do not restate or re-derive that
rule here — read it there, so the two can never disagree.
- **Do not modify it** (respect append-only for dailies, living notes for people/topics —
  never overwrite a living doc on a mere "open X for me").
- State **which** file is being opened and its **freshness** (`updated` date).
- If several docs are equally relevant: open the best one, **cite the other candidates**
  in one line (do not block on a choice).

### 4. If nothing relevant → synthesize, write, open
1. **Synthesize from the vault alone** (RAG + grep). No live source sync by default —
   "open X for me" is a quick consultation. (If the vault is clearly empty on the topic,
   **say so** rather than inventing; offer the user a source sync if they want one.)
2. **Choose folder + name** per the vault conventions (see CLAUDE.md §2 "Note format"):
   | Nature of the topic | Destination |
   |---|---|
   | Cross-cutting topic / concept | `vault/topics/<topic-kebab>.md` (default) |
   | Person | `vault/people/<first-last>.md` |
   | Decision | `vault/decisions/YYYY-MM-DD-short-title.md` |
   | Initiative | `vault/initiatives/<name>.md` |

   **Never create a `daily/` note through this flow** (append-only, handled elsewhere).
3. **Check for collision**: if the target name already exists → a doc existed after all;
   go back to step 3 and open it instead of overwriting.
4. **Write** the markdown with compliant frontmatter (`type`, `created`, `updated`, `tags`) and
   `[[…]]` backlinks to related notes. Tone: the user's own (factual, concise).
5. **Open** it, per step 3's rule (it is a vault note, so Obsidian when Obsidian holds this vault).
6. **Qualify the reliability**: make clear the note was just **created by AI synthesis** from
   the vault (≠ verbatim), so the user rereads it with a critical eye.

## Guardrails
- **Never overwrite** an existing doc on an "open X for me".
- **The opener is the constitution's, never this skill's.**
  In particular, **never** use `open -a "Obsidian" <path>`: measured, it launches the app on
  whatever was last open and ignores the file entirely. If Obsidian does not hold this vault, the
  note opens in the default Markdown editor — that is the correct outcome, not a failure to work
  around.
- **Timestamp**: run `date` in bash before writing a dated note (correct created/updated).
- Persistence (commit/push) is handled by the hook — **do not run git** yourself.

## Out of scope
- Modifying / enriching an existing doc (that is a different, explicit gesture — not the
  default of "open X for me").
- Fetching live sources (Slack/Drive): only if the user explicitly asks.
