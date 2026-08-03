# ADR 0027 — A local note opens via a Claude-invoked opener: Obsidian for the vault, the default editor for everything else

- **STATUS:** ✅ ACCEPTED (2026-06-20).
- **Scope:** Second brain (runtime) — every gesture that opens ONE local note: the deterministic
  `search_vault` citation block the engine renders for every answer, and the ad-hoc "open my note about X".
- **Related:**
  [`0006-rag-mcp-is-stable-contract.md`](0006-rag-mcp-is-stable-contract.md) (the citation block is part of
  the `search_vault` engine-owned output),
  [`0029-obsidian-is-the-recommended-but-optional-vault-viewer.md`](0029-obsidian-is-the-recommended-but-optional-vault-viewer.md)
  (Obsidian is recommended, never required; **this** ADR owns what opens a single note),
  [`0015-cross-platform-parity.md`](0015-cross-platform-parity.md) (why the mechanism may not be a
  macOS-only command),
  [`0001-launcher-vs-brain.md`](0001-launcher-vs-brain.md) (the launcher↔brain axis the Scope sits on).

## Context

Each `search_vault` result renders a 🧠 *local copy* link to the note's real file in the vault and, for a
mirror note, a 🔗 *Notion source* link (`https://…`). On the surface both look equivalent: two clickable links.

They are not, in the brain's primary client. **Claude Desktop routes only `http(s)` clicks; it silently
drops any other scheme** — a custom scheme like `obsidian://`, but `file://` too. So the 🔗 Notion link works,
while a local link that *looks* clickable does nothing — a dead click with no feedback. A user who clicks it
and gets nothing concludes "local citations are broken", when the note is right there and openable.

So the local link can never be *relied on* as a click in the primary client; that is a property of the
client, not something the citation markup can fix. Whatever scheme we emit, the load-bearing way to open a
local note has to be something else.

And there is a second question hiding behind "open the note": **which app**. Two things that look alike are
not the same. A **note of the vault** is part of the brain: it has `[[wikilinks]]`, backlinks and neighbours,
and the app built to read it that way is Obsidian — the one this project already recommends as the vault
browser and offers to register at install. **Any other Markdown file** on the machine has none of that, and
forcing it into a vault-shaped app would be lock-in for nothing. Rendering both through a single opener
answers the easy half of the question and silently gets the other half wrong.

## Decision

**Render the local link as a real-file `file://<absolute>` URL, and make the block self-explanatory so a
dropped click is no longer a trap.** Concretely, each citation carries a plain-text affordance:

```
🧠 local copy · 🔗 Notion source
`vault/notes/foo.md`
_Ask me to "open citation 2" and I'll open it in your Markdown editor (Typora, Obsidian, …)._
```

- The 🧠 link is a **real-file `file://` URL** — not an app-specific custom scheme. Where a client routes the
  click, the OS opens the note in whatever the user has set as their **default Markdown editor** (Typora,
  Obsidian, VS Code, …): editor-agnostic, editable, no lock-in to one app.
- The 🔗 `https` link stays — it already works everywhere.
- The relative `vault/…` path stays visible as plain text (grep-/copy-friendly).
- The **affordance** is the load-bearing addition: the user asks Claude to "open citation N", and Claude
  opens the note via the **allowlisted opener** (`open` / `xdg-open` / `start` on the file path), which hands
  it to the OS default editor. The number matches the citation heading, so "open citation 2" is unambiguous.

The opener path is already field-proven and allowlisted; this ADR commits to **routing the open through
Claude rather than relying on a chat click** (the click is unreliable in the primary client; a human-invoked
tool call is not), and to a **real-file link rather than an app-specific scheme** (so the rendered markup
stays portable, and a client that does route it opens the plain file).

### Where that open lands: two acts, two destinations

**A note that belongs to the vault opens in Obsidian when Obsidian holds that vault; everything else opens in
the OS default Markdown editor.** One pure function owns the rule — `buildOpenNoteCommand({ platform,
absPath, insideVault, obsidianOk })` in `scripts/lib/open-note.mjs` — and the constitution, the `open-note`
skill and `SETUP.md` are pinned to it by guards, so the three surfaces state one rule rather than three.

- **The mechanism is Obsidian's URL scheme, handed to the same OS opener:**
  `open "obsidian://open?path=<url-encoded absolute path>"` on macOS, `start "" "…"` on Windows,
  `xdg-open "…"` on Linux. A URI cannot be invoked cross-platform any other way, and routing it through the
  opener keeps the gesture inside the permission allowlist every brain already carries — no new permission,
  therefore no prompt on a deployed brain.
- **`?path=`, never `?vault=&file=`.** Obsidian names a vault after its root folder, and every brain this
  launcher generates roots its vault at `<brain>/vault`. A user with two brains would therefore have two
  vaults both named `vault`: the vault-scoped form is ambiguous **by construction** here. An absolute path is
  not, and Obsidian resolves the owning vault from it on its own.
- **"Holds that vault" means installed AND this vault registered** — `obsidianHealth(vaultPath).status ===
  "ok"`. Merely installed is not enough: the URI on a file of an unregistered vault lands on the vault picker,
  which is a silently wrong result rather than a failure.
- **Unknown platform yields no command at all**, and the caller shows the note inline. A guessed opener is
  worse than an honest fallback.

### Why not the alternatives

- **Emit the `obsidian://` scheme in the rendered 🧠 link.** Rejected, and it is worth separating from the
  decision above: what opens a vault note is the **command Claude runs**, not the markup. Desktop drops every
  non-`http(s)` scheme, so an `obsidian://` destination would buy a dead click and nothing else, while a
  `file://` destination at least works in the clients that do route it. The link stays a real-file URL.
- **Open a vault note with `open -a "Obsidian" <path>`.** The obvious macOS shortcut, and it does not work:
  measured on a real machine, cold and warm, it launches Obsidian on its restored session and **ignores the
  file argument** — the requested note never opens. It is also macOS-only, which alone would disqualify it
  under ADR 0015. The URL scheme is the only form that actually aims at a note.
- **Route everything through the OS default editor, vault note included.** Simpler to state, and it is the
  half-right answer that hides the whole problem: it renders "a note of my brain" and "some Markdown file"
  identically, and it makes the vault registration this project offers at install buy the user nothing.
- **Drop the local link, keep only `https`.** Loses the local-copy open entirely (CLI/terminal clients DO
  route `file://`), and a mirror note's local copy is often what the user wants over the live Notion page
  (offline, the exact indexed text).
- **Have Claude auto-open every cited note.** Noisy and presumptuous — most answers cite several notes the
  user never wants to open. Opening is on demand, by citation number.

## Consequences

- The citation block is **self-explanatory**: a user who can't click reads how to open the note. No more
  silent dead click.
- **A vault note lands in Obsidian, and every other Markdown file in the user's own editor.** Obsidian stays
  optional: without it, or without this vault registered in it, every note still opens in the default editor,
  and Claude can always surface the note inline as a last resort. Nothing is lost by not installing it.
- **Obsidian asks the user to confirm the first external-link open.** It is Obsidian being careful about
  links coming from outside itself, not a signal about the brain, and one **"Don't ask again"** tick retires
  it for good. This is a genuine cost of the URL scheme, accepted because the alternative that avoids it
  cannot open the requested note at all; `SETUP.md` states it up front, framed like the one-time
  "Always allow" clicks on connectors, so nobody meets an unexplained modal.
- **The affordance sentence names both destinations.** Every cited note is by definition a vault note, so a
  sentence promising "your Markdown editor" would mispredict the app for every user who has registered their
  vault — and one promising Obsidian would mispredict it for everyone who has not.
- The change lives in the engine-owned renderer (`rag/src/lib/citation-renderer.ts`), so it reaches **every**
  brain through `/update-engine`, not just new installs.
- The block is one line longer per citation — accepted: the clarity it buys (no dead-click trap) outweighs the
  added height.
