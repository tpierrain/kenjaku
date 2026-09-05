# ADR 0041 — A captured source carries its identity, and the vault is the ledger

- **STATUS:** ACCEPTED (2026-09-02).
- **Scope:** Second brain (runtime) — the capture path (`sync-sources`, `file-back-note.mjs`), the
  frontmatter vocabulary, the `/lint` linter and the index's frontmatter parser.
- **Related:** [`0009`](0009-prefer-deterministic-mechanisms.md) (the rungs: correctness in a pure function, a
  deterministic entry point above it); [`0023`](0023-canonicalize-volatile-presigned-urls-before-hashing.md)
  (canonicalize before you compare — the same rule, applied to a different volatile string);
  [`0022`](0022-golden-source-sync-separate-file-writing-mcp.md) (the Notion mirror, which already
  keys a note on its source and is idempotent because of it);
  [`0034`](0034-progressive-disclosure-of-universes.md) (nothing surfaces until a second one exists);
  plan [`../plans/prospective/duo-source-identity-action.md`](../plans/prospective/duo-source-identity-action.md).

## Crux

- **Decision.** Every note written from an external source records **which sources it was built
  from**, as a list of normalized keys in its frontmatter (`sources`). Before capturing a source, the
  brain asks the vault whether any note already lists that key.
- **Key guarantee.** The check can only ever *say* **"already held"**. It never deletes, never
  overwrites, and never silently skips: a duplicate is a nuisance, a silent loss is unnoticeable from
  inside the vault, so the mechanism is built to fail towards the nuisance.
- **The ledger is the vault itself.** There is no "already seen" database to seed, drift or corrupt —
  the question *"has anyone digested this?"* is answered by *"does any note list it?"*.
- **Prior art — this is content-addressing applied to captures**, the same idea as a package
  lockfile's integrity hash, an email client's `Message-ID` threading, or Git naming a blob by its
  content. Closer to home, the Notion mirror (ADR 0022) has always been idempotent for exactly this
  reason: one page, one file, rewritten in place. This ADR generalizes what that mirror already does
  to the sources that have no mirror.

## Context

A brain can live on two machines and, since it can live on two machines, it can be driven by two
people: an owner and someone acting for them, two clones of one private repository. Both hold the
same powers over the same information — that is the point, and it is not a division of duties.

Two people working the same dossiers ask overlapping questions, and the fan-out that answers them
captures what it reads. Nothing in the vault recorded **what had already been read**:

- Everything the capture path writes — briefings, the actions ledger, `people/`, `topics/`,
  `raw-sources/` — carries its permalinks **in prose**, and prose is not a lookup key.
- `source_url` exists in the index and is read by the citation renderer, but exactly one producer
  ever writes it: the Notion mirror.
- So a second brain cannot know that a mail, a Slack thread or a document was already distilled, and
  no later pass can detect that it was.

Notes also merge without a human in the append-only zones, which is right for a ledger and means a
doubled digest lands **silently** where it used to raise a conflict a person would see. Removing the
alarm is only defensible if the cause is removed too.

## Decision

### 1. A source key is a normalized, comma-free, colon-free token

A key is its **source type**, then its identifying fields, joined by `|`:

```
slack|C0CEQ4R5E|1725283200.001200
mail|thomas.pierrain@example.com|20260902T161932Z|your-invoice-is-ready
```

Each field is normalized before it is joined, and every character outside `[A-Za-z0-9_.@+-]` becomes
a single `-`. The result carries no comma, no colon, no bracket and no space, so a key is safe in a
YAML **inline** list, safe as **one** shell argument, and greppable with a plain `grep`.
Canonicalizing before comparing is the same rule ADR 0023 applies to presigned URLs: two spellings of
one thing must reduce to one string, or the comparison measures the spelling.

**Two normalizations, pulling in opposite directions on purpose:**

- **An opaque identifier keeps its case.** Drive and Notion identifiers are case-sensitive; folding
  them would invent a collision between two genuinely different documents, and a collision is a false
  "already held" — the one direction § 5 forbids.
- **Human text loses its case, its accents and its punctuation** (a subject line reduces exactly as a
  title does when it becomes a filename). Keeping them would invent a miss between two spellings of
  one subject, and a check that never matches is indistinguishable from a check nobody wired up.

An instant is written in the **basic** ISO 8601 form, `20260902T161932Z` — basic rather than extended
because the extended form carries colons, and a colon is what would make the key unsafe in the very
list it is written into.

Normalization is **the deterministic side's job, never the model's** (ADR 0009): a caller hands over
the raw fields it read from a connector, and the code composes the key.

### 2. The key table — one row per source type

| Source | Key | Cost to obtain | Shared between two people? |
|---|---|---|---|
| **Slack** | `slack\|<channel_id>\|<message ts>` | free, in every response | ✅ by construction — one message on one server, not two copies |
| **Calendar** | `calendar\|<event id of the INSTANCE>` | free, in the ordinary listing | ✅ the same event id for every attendee |
| **Drive** | `drive\|<file id>` | free | ✅ the same file id for every reader |
| **Notion** | `notion\|<page id>` | free | ✅ already shipped, already idempotent (ADR 0022) |
| **Mail** | `mail\|<sender address>\|<sent timestamp>\|<subject>` | free in the cheapest message formats | ✅ whatever the transport |
| **A conversation, a thought, a document read by a human** | *none* | — | — |

Three things this table settles, each of which was a real design fork:

- **A recurring calendar event is keyed by its INSTANCE, not by its series.** Two brains digesting
  "the daily meeting of 3 September" must produce the same key; one keying the occurrence and the
  other the series would not.
- **Mail is the only composite, and it is composite for a reason.** It is the only source where each
  person holds their **own copy** of the object rather than a view onto one shared object. A
  provider-internal message id is per-mailbox and therefore useless across two accounts; the RFC
  `Message-ID` is universal but costs a fetch of the entire raw message, which is precisely what a
  fan-out architecture exists to keep out of context. Sender + sent timestamp + subject come back in
  the cheapest metadata formats, for free, and are identical across copies. Requiring **all three** to
  match is not fuzzy matching: two distinct mails sharing one sender, one timestamp to the second and
  one subject is a negligible event.
- **A hand-forwarded mail is a different message, and the scheme says so.** A forwarding *filter*
  resends the message with its subject and its sent date intact, so the key holds. A person clicking
  "forward" writes a new subject at a new time: that is a new object, it gets a different key, and the
  brain treats it as **unknown** rather than pretending to recognize it. Guessing here is the one
  behaviour that could drop a real mail.

### 3. An absent key means UNKNOWN, never "already seen"

A source type with no row above has no key. A note written before this decision has no `sources`
field. In both cases the answer to *"do I already hold this?"* is **"I do not know"**, and the brain
captures. Every note in every existing vault is in that state, so the opposite default would make a
brain believe it had already digested the whole world.

### 4. Two fields, two jobs, and a note may carry one, both or neither

| Field | Audience | Job |
|---|---|---|
| `sources` | machine | a **list** of normalized keys. What the duplicate check reads. |
| `source_url` | human | a clickable link. What the citation renderer already reads. |

`sources` is a **list**, not a single key, because the brain writes two different kinds of note:

- **A capture** — a stored mail, a saved thread, a transcript. **One source, one note.** This is the
  case the Notion mirror has always handled, and the list holds a single entry.
- **A synthesis** — a briefing, a person card, a topic page. **Made from N sources, and each source
  feeds N notes.** Such a note does not *have* a source; it *drew on* several. A single-valued field
  would force the writer to pick one and lose the rest.

The question the check actually asks is about the **source**, never about the note: *"has this
message been digested by anyone?"* — answered by *"does any note list it?"*. Which is why the vault is
the ledger and there is no second store to keep in step.

### 5. The failing direction: it may only ever SAY "already held"

The check reports; it never acts. A hit names **the note that already holds the source**, and the
skip is visible in what the brain says. It is forbidden to delete, to overwrite, or to drop a capture
silently.

The asymmetry is not a preference. A duplicate is visible, greppable and removable by anyone reading
the vault. A capture silently skipped because of a wrong match is **invisible from inside the vault**:
nothing there says it is missing. So the mechanism is built to occasionally do too much rather than
occasionally do too little.

### 6. "Already held" does not mean "discard" — it means "go and read it"

This is the half that makes sharing a brain worth anything. When the vault already holds a source, the
second brain does not throw its work away: it **opens the note the first pass wrote**, answers from it,
and **enriches that note** if its own question needs something the first pass did not extract.

Reuse, not deletion. The alternative — capturing again, in a second file, in different words — is the
duplication this ADR exists to remove; and discarding the question is not an improvement on it.

### 7. A recorded "already seen" is a measurement with an expiry

A conversation digested at eight messages and met again at twenty has the **same** thread identity and
**different** content. The rule that follows: a **thread is keyed by its messages**, not by the
thread, so more messages are simply more keys, none of which is held yet. Where only a container id is
available, the record must say **how far it went**, and a check against it means "up to there", not
"forever".

This is the repo's standing rule about recorded absences and recorded permissions applied to a
recorded reading: what a measurement proves, it proves at the moment it was taken.

## Consequences

- **The linter and the index accept `sources`.** A note carrying it is not in violation, and the
  frontmatter parser exposes it beside `sourceUrl`, so a later mechanism (retrieval, citation,
  consolidation) can read it without re-parsing the file.
- **The deterministic write path is guarded; the model's is not.** `file-back-note.mjs` refuses a
  spec whose sources the vault already holds, which is enforcement. The model can always reach for a
  raw file write, which is not. The guarantee is therefore **"usually"**, and saying so is part of the
  decision: a dedup that is believed to be total but leaks is worse than one known to be partial,
  because it stops being checked.
- **The check reads the NOTES, never the index.** A note that arrived over git seconds ago is not
  indexed yet — and that is precisely the duo case the check exists for. An index-backed check would
  answer "never seen" exactly when it matters most.
- **Nothing surfaces for a lone owner.** A brain with one author writes keys, finds no hits, and
  behaves as it always did. Same doctrine as universes (ADR 0034).
- **A key is a promise about spelling.** Anything that composes one by hand instead of calling the
  normalizer will produce keys that never match, and a check that never matches is indistinguishable
  from a check that is not wired at all.

## Alternatives considered

- **A ledger file recording what has been digested.** Rejected: it is a second source of truth to
  seed, migrate, merge and repair, and in a duo it would be the very file two machines fight over.
  The notes already are the ledger, and scanning them cannot go out of step with them.
- **Keying mail on the RFC `Message-ID`.** Universal and exact, but its only access path is a fetch
  of the entire raw message — tens or hundreds of kilobytes per mail, for one header. Kept as an
  opportunistic *additional* key when it is already in hand, never as the primary one.
- **Keying mail on a content fingerprint** (a hash of the body, or a fuzzy similarity). Rejected: it
  is the only design here that can produce a **false positive**, and a false positive is exactly the
  silent loss § 5 forbids.
- **One writer of record per source** — naming, per source, whose brain digests it. Cheap, needs no
  code, and rejected on a product ground: it is a division of duties, and duo mode is a delegation in
  which both instances hold the same powers.
- **Deduplicating the same fact restated in two wordings** inside a curated page. Deliberately out of
  scope, and permanently so: no machine tells a restatement from a genuinely new fact without a
  judgement call, and a wrong call there deletes real content. That one stays with the novelty check
  and the consolidation gesture.
