# ADR 0035 — A universe profile is a note the owner owns, plus what the session is handed about it

> The filename still says *"an injected digest"*: that was true of the 2026-07-27 decision, and a
> filename every other document links to is not worth breaking to record an amendment. What is handed
> today is defined by §2 below.

- **STATUS:** ACCEPTED (2026-07-27), **AMENDED 2026-08-03** — what a session is handed is a
  **synthesis** (identity line + pointer), no longer the note's body, and it is now **behind the
  disclosure gate**. See §2 and §4 below, rewritten in place; §6bis records what field use taught.
- **Scope:** Second brain (runtime) only — a new pure core (`scripts/lib/universe-profile.mjs`), a
  CLI (`scripts/set-universe-profile.mjs`), the existing SessionStart hook
  (`scripts/session-universe.mjs`) and the `/switch` skill. **No installer change**, no index schema
  change, no change to the sacred constitution surface.
- **Related:** [`0034-progressive-disclosure-of-universes.md`](0034-progressive-disclosure-of-universes.md)
  (a universe is a soft retrieval scope; the disclosure gate);
  [`0009-prefer-deterministic-mechanisms.md`](0009-prefer-deterministic-mechanisms.md) (the questions
  are conversational, everything that is *written* is not);
  [`0029-obsidian-is-the-recommended-but-optional-vault-viewer.md`](0029-obsidian-is-the-recommended-but-optional-vault-viewer.md)
  (why the profile has to be a plain note); plan
  [`../plans/prospective/universes-profiles-lifecycle-action.md`](../plans/prospective/universes-profiles-lifecycle-action.md).

## Crux

A universe (ADR 0034) is a *scope*: the brain knows which notes belong to it and nothing else about
it. So the brain does not know that "acme" is an employer, that its owner runs engineering there,
that Zoe is the CTO, or that Slack over there means `acme.slack.com`. Those are the facts nobody
thinks to *search* for — they are the facts you need in order to phrase the search at all. The
decision: **a universe's profile is a normal Markdown note in the vault, and a short deterministic
block about it is handed to every session.** Note *and* injection, not one or the other. What that
block CONTAINS is the part field use changed (§2, §4, §6bis): it names the sphere and the page, and
the page's content is read on demand.

## Context

Retrieval only answers questions the owner knows to ask. "Prepare my 1-1 with Zoe" needs to already
know who Zoe is; "post this in Slack" needs to already know which workspace *here* means. Three
storage shapes were on the table (see Alternatives): grow the registry entries into objects, inject
without storing, or store as a note. The registry (`.vault-rag/universes.json`) is a list of slugs
and every pure function and test in `universes.mjs` assumes that; a profile living there would be
invisible to the RAG and uneditable by a human. Injection alone leaves nothing versioned, nothing
editable, nothing searchable — and contradicts the repo's oldest rule, that **everything is a note**.

The second question was *when to ask*. A profile nobody fills in is worth nothing, but a brain that
interrogates its owner is worth less than nothing. And the constraint that decides it: **the brains
that most need a profile are the ones already installed**, whose owners will never re-run an
installer.

## Decision

1. **The profile is a note.** `vault/<slug>/universe.md` for a created universe (stamped
   `universe: <slug>`), `vault/universe.md` for the default one — the same implicit-when-default rule
   as every other note (ADR 0034 §3). Explicit `type: universe` frontmatter plus `displayName`,
   `kind`, `role`, `period`; body sections for the people, the recurring topics, and **which account
   each single-account connector uses in this universe**. Versioned by git, editable in Obsidian,
   indexed by the RAG like anything else. **No leading underscore** in the filename: the scanner skips
   `_`-prefixed files, and an unindexed profile is a profile the brain cannot answer from.

2. **What a session is handed is a SYNTHESIS, and the body stays in the note** _(amended 2026-08-03;
   the original text is restated under §6bis, with why it did not survive contact)_.
   `renderUniverseSynthesis` returns the identity line, the note's path framed as *read it when the
   answer depends on the people, tools or scope here*, and the door to the rest (`/switch`). Nothing
   of the About / People / Topics / Connector-accounts sections rides a session. The reason is not
   volume, it is **audience**: a SessionStart hook's `additionalContext` is echoed **verbatim** by the
   CLI, so every line injected is a line printed before the owner has typed a word — in every
   screenshot, screen share and transcript. Two renderings therefore exist for one note, and which
   one is picked is pinned by a test at the composition root: `renderUniverseDigest` (the body,
   capped at `DIGEST_MAX_LINES`, naming the note when it truncates) is the **pulled** form, printed
   by `set-universe-profile.mjs --digest` when the owner asked for it — after a switch, or from the
   `/switch` menu. Both read the note **as it is on disk**, so editing the page in Obsidian changes
   what a session gets, with nothing to re-run.

3. **Two worlds, two vocabularies, decided by the core.** Below the gate the notion does not exist
   for its owner, so every word aimed at them says *their context, their world, this place*; the
   moment a second universe exists, the opposite holds, because that word is now the one they switch
   with. Which world applies is stated **by the deterministic core** (`BELOW` / `PAST the disclosure
   gate`) and obeyed by the skill: deciding requires counting universes, and counting is not the
   model's job (ADR 0009). **The one exception is the artifact itself** — the page is `universe.md`
   with `type: universe` in both worlds. Naming it `context.md` was considered and **rejected**: for
   a developer, "context" reads as the LLM context window, and a filename an owner rarely opens is a
   far smaller leak than a vocabulary collision they meet every day.

4. **The injected copy never says "universe" — and below the gate there is no injected copy at all**
   _(amended 2026-08-03)_. The block is now behind the progressive-disclosure gate: with a single
   universe there is nothing to disambiguate, so the profile earns no session space whatsoever. Past
   the gate it still talks about *the sphere this owner works in* and leaves the machinery vocabulary
   to the `[universe]` line beside it, so the two blocks stay two different subjects (ADR 0034 §2).
   **Stated cost, accepted by the owner:** a single-universe brain no longer has the ambient facts
   handed to it, and `CLAUDE.engine.md` is in no propagation regime, so a deployed one learns of the
   page only through the vault — where it is indexed, `type: universe`, like any other note.
   **Presence and payload became two questions** at that moment: the capture offer still has to know
   whether a profile exists below the gate (that is the backfill case), while nothing is injected there.

5. **The profile is offered exactly once, and "no" is permanent.** When a universe has no profile, the
   SessionStart hook emits one skippable offer. A refusal is recorded per universe in
   `.vault-rag/profile-nudges.json`, which is **committed** — unlike the active pointer, refusing is
   the owner's decision, not the machine's, so it must not come back on the laptop. A universe created
   later is a different world and is still asked. This is what makes the offer reach **already
   installed** brains, at the cost of nothing at install time.

6. **The questions are conversational; everything written is not** (ADR 0009). The `/switch` skill
   asks, in the owner's language, as one short batch of skippable questions. Every byte that lands on
   disk goes through `set-universe-profile.mjs`: the note's shape, the refusal marker, and the wording
   of what happened. The digest re-read after a switch is a **new verb** (`--digest`) rather than an
   addition to the switch message, because the profile is background *for the session* — appending it
   to a message the skill relays verbatim would echo the owner's own profile back at them.

7. **A profile is never overwritten.** The page belongs to its owner the moment it exists; a capture
   flow run twice refuses and names the page to edit instead.

8. **The boundary with the constitution.** `CLAUDE.md` says **who the owner is and how the brain
   behaves** — a sacred surface, untouched here (ADR 0034). A profile says **what this sphere is**.
   The owner's identity, tone and standing rules never move into a profile; a sphere's people,
   accounts and topics never move into the constitution. Without that line drawn, the default
   universe's profile and the constitution's owner section drift into contradicting each other.

### 6bis — What field use overturned, and what it did not _(2026-08-03)_

The original §2 read: *"a capped digest is injected… this block rides in every session"*, and the
original §4 defended **not** gating it, on the ground that a single-universe brain is the common case
and the one most likely to fill a profile in. Both were reasoned from the **agent's** needs alone. One
evening on a real brain supplied the missing half: the owner's profile contained a passage tagged
*"🔒 CONFIDENTIEL, ne jamais sortir du vault"*, and it was printed at every session start — therefore
in every screenshot, screen share and transcript, including one that reached a third party. The
finding is recorded as F1 of the 2026-08-02 field plan.

The knot, worth stating because it is not obvious: the digest served **two audiences through one
channel**. The agent needs people, topics and accounts to reason well; the owner needs one line. And
`additionalContext` is echoed **verbatim** by the CLI, so *"inject without showing"* does not exist.
Only two roads led out — inject the human's line and let the agent open the page on demand, or keep
the leak. The first was taken.

What did **not** change: the profile is still a note (§1), the vocabulary rule is still decided by the
deterministic core (§3), the offer is still once-and-permanent (§5), writes still go through the CLI
(§6), and the constitution boundary (§8) is untouched. This is an amendment to *what a session is
handed*, not a reversal of the decision.

## Consequences

- **No index schema change and no forced reindex.** A profile is a note, not a column: existing brains
  pick this up as pure opt-in backfill. Writing one triggers the ordinary incremental reindex, and
  `--no-reindex` exists for tests.
- **The profile is searchable like any note**, so neither rendering is the only access to those facts.
  That is what makes §2 affordable: a session handed only a pointer can still reach everything the
  page holds, by opening it or by asking.
- **`/lint` had to learn about it.** The profile is a legitimately link-less page, so it joins the
  orphan exclusions (`ENGINE_STATE_NOTES`) instead of showing up as vault debt forever.
- **The digest reads a hand-edited page.** Because the owner edits it in Obsidian, the parser tolerates
  what a human leaves behind (trailing spaces after a heading, `*` bullets as readily as `-`). A
  section silently dropped over one invisible character would look like the profile was being ignored.
- **The offer follows the owner into a universe.** Landing in a sphere with no profile emits it once,
  because that is when the owner is standing in it. Without that door, a universe they rarely start a
  session in would never be asked about at all — precisely the case of a brain that grew universes
  before profiles existed.
- **Everything is fail-open.** An unreadable profile costs the session that block and nothing else —
  not its universe reminder, and never its start.
- **Lifecycle is deliberately not decided here.** Renaming and deleting a universe (which must move the
  profile with the subtree) are a separate, riskier surface and get their own decision.

## Alternatives considered

- **Registry entries grow from strings to objects (rejected).** A shape migration across every pure
  function and test in `universes.mjs`, for data that would still be invisible to the RAG and
  un-editable by a human.
- **Injection with no note (rejected).** Nothing versioned, nothing editable, nothing searchable —
  and it contradicts "everything is a note", which is the reason Obsidian works over this vault at all.
- **Name the page `context.md` / `type: context` (rejected, Thomas 2026-07-27).** It would remove
  the last leak of the word below the gate, but "context" collides head-on with the LLM *context
  window* for any developer — and the page is one an owner opens rarely, if ever. A rare, inert leak
  beats a daily ambiguity.
- **Ask at install (rejected, D2).** It only ever helps *future* installs — precisely the brains that
  need it least — and adds weight to an already heavy installer. The variant that asks at install
  *using the word "universe"* also frontally contradicts progressive disclosure.
- **Gate the digest behind the disclosure threshold (rejected in 2026-07, ADOPTED 2026-08-03).** The
  rejection was sound about *withholding the profile from the single-universe majority* — and wrong
  about what was being withheld, because it priced the block as pure benefit to the agent and never
  as a cost paid by the owner on a screen-shared terminal. With the body out of the block (§2), what
  the gate now withholds is one identity line and a path, not the profile itself: the note stays
  searchable, and the owner keeps every way of reading it. See §6bis.
- **Append the digest to the switch message (rejected).** Simpler wiring, but the skill relays that
  message verbatim, so the owner would be read their own profile after every switch.
