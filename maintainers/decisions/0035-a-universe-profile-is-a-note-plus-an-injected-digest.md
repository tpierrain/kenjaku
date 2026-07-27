# ADR 0035 — A universe profile is a note the owner owns, plus a digest the session is handed

- **STATUS:** ACCEPTED (2026-07-27).
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
decision: **a universe's profile is a normal Markdown note in the vault, and a short capped digest of
it is handed to every session deterministically.** Note *and* injection, not one or the other.

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

2. **A capped digest is injected, and the cap lives in the pure function.** `renderUniverseDigest`
   truncates at `DIGEST_MAX_LINES` and *names the note* when it does, so a session knows its context
   is partial instead of acting on a profile it thinks is complete. This block rides in **every**
   session: an over-long digest is a cost the caller cannot see, so the cap is not left to the
   caller's goodwill. The digest is built from the note **as it is on disk**, so editing the page in
   Obsidian changes what is injected, with nothing to re-run.

3. **The injected copy never says "universe".** The digest is *not* behind the progressive-disclosure
   gate, deliberately: a single-universe brain is the common case and the one most likely to fill a
   profile in, so gating the digest would make the capture pointless for nearly everyone who uses it.
   What the gate protects is the **word**, not the feature — so the injected block talks about *the
   sphere this owner works in*, and a brain with one universe never meets the machinery (ADR 0034 §2).

4. **The profile is offered exactly once, and "no" is permanent.** When a universe has no profile, the
   SessionStart hook emits one skippable offer. A refusal is recorded per universe in
   `.vault-rag/profile-nudges.json`, which is **committed** — unlike the active pointer, refusing is
   the owner's decision, not the machine's, so it must not come back on the laptop. A universe created
   later is a different world and is still asked. This is what makes the offer reach **already
   installed** brains, at the cost of nothing at install time.

5. **The questions are conversational; everything written is not** (ADR 0009). The `/switch` skill
   asks, in the owner's language, as one short batch of skippable questions. Every byte that lands on
   disk goes through `set-universe-profile.mjs`: the note's shape, the refusal marker, and the wording
   of what happened. The digest re-read after a switch is a **new verb** (`--digest`) rather than an
   addition to the switch message, because the profile is background *for the session* — appending it
   to a message the skill relays verbatim would echo the owner's own profile back at them.

6. **A profile is never overwritten.** The page belongs to its owner the moment it exists; a capture
   flow run twice refuses and names the page to edit instead.

7. **The boundary with the constitution.** `CLAUDE.md` says **who the owner is and how the brain
   behaves** — a sacred surface, untouched here (ADR 0034). A profile says **what this sphere is**.
   The owner's identity, tone and standing rules never move into a profile; a sphere's people,
   accounts and topics never move into the constitution. Without that line drawn, the default
   universe's profile and the constitution's owner section drift into contradicting each other.

## Consequences

- **No index schema change and no forced reindex.** A profile is a note, not a column: existing brains
  pick this up as pure opt-in backfill. Writing one triggers the ordinary incremental reindex, and
  `--no-reindex` exists for tests.
- **The profile is searchable like any note**, so the capped digest is a *fast path*, never the only
  access to those facts. Anything truncated remains findable by asking.
- **`/lint` had to learn about it.** The profile is a legitimately link-less page, so it joins the
  orphan exclusions (`ENGINE_STATE_NOTES`) instead of showing up as vault debt forever.
- **The digest reads a hand-edited page.** Because the owner edits it in Obsidian, the parser tolerates
  what a human leaves behind (trailing spaces after a heading, `*` bullets as readily as `-`). A
  section silently dropped over one invisible character would look like the profile was being ignored.
- **Everything is fail-open.** An unreadable profile costs the session its digest and nothing else —
  not its universe reminder, and never its start.
- **Lifecycle is deliberately not decided here.** Renaming and deleting a universe (which must move the
  profile with the subtree) are a separate, riskier surface and get their own decision.

## Alternatives considered

- **Registry entries grow from strings to objects (rejected).** A shape migration across every pure
  function and test in `universes.mjs`, for data that would still be invisible to the RAG and
  un-editable by a human.
- **Injection with no note (rejected).** Nothing versioned, nothing editable, nothing searchable —
  and it contradicts "everything is a note", which is the reason Obsidian works over this vault at all.
- **Ask at install (rejected, D2).** It only ever helps *future* installs — precisely the brains that
  need it least — and adds weight to an already heavy installer. The variant that asks at install
  *using the word "universe"* also frontally contradicts progressive disclosure.
- **Gate the digest behind the disclosure threshold (rejected).** Correct-looking and useless: it
  would withhold the profile from the single-universe majority, i.e. from almost every owner who ever
  fills one in. Gating the vocabulary instead achieves the same protection at no cost.
- **Append the digest to the switch message (rejected).** Simpler wiring, but the skill relays that
  message verbatim, so the owner would be read their own profile after every switch.
