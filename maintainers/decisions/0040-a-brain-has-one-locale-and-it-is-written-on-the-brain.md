# ADR 0040 — A brain has ONE locale, it is written on the brain, and delivery resolves it at the source

- **STATUS:** ACCEPTED (2026-08-21).
- **Scope:** Second brain (runtime) — the update path (`update-engine` → `reconcileBrain` → the three
  merge-governed families), the three install-if-absent doors, and the launcher's `templates/<locale>/`
  tree. Mostly this ADR writes down rules the code has enforced since v4.9.1 and that v5.0.0 extends to
  two more file families. It also fixes the shape so the next localized artefact needs no decision at all.
  - ⚠️ **It said "No behaviour change" until 2026-08-23, and that was true of the merge-governed
    families only.** The install-if-absent doors were delivering the root bytes to every locale, so
    bringing them under rule 3 (T10) IS a behaviour change — small, and in the direction this ADR
    always claimed. Recorded rather than quietly deleted: the false reassurance is the reason nobody
    went and checked those three doors when this was written.
- **Related:** [`0012`](0012-engine-packaging-four-part-model.md) (what the engine owns and copies);
  [`0038`](0038-sacred-splits-inviolable-and-merge-governed.md) (the merge-governed families this
  applies to); [`0025`](0025-update-engine-installs-missing-engine-skills-and-servers.md) and
  [`0039`](0039-engine-retires-a-skill-declared-and-provenance-guarded.md) (the install/retire doors,
  whose DECISION is locale-blind by design while their DELIVERY is resolved — see Consequences); plan
  [`../plans/archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md`](../plans/archived/2026-08-23-v5-unfreezes-the-existing-fleet-action.md)
  (§ S8).

## Crux

The product ships in more than one language, and three separate questions kept being answered
independently, each time from scratch: *which files are localized*, *what language is a given brain*,
and *which source does an update read for it*. Answer any of them differently from the others and a
French brain quietly becomes an English one — or worse, a half-English one.

That is not hypothetical. It was **reported as measured** on 2026-08-21 (*"S7 unfreezes a French brain
into English"*), written into a plan's headline box, its tracking list and the ROADMAP, and it was
**wrong**. The QA fixture had built an English brain holding French bytes in a single file, and the
heal's honest `locale: "fr"` — a statement about *those bytes* — was read as a statement about *the
brain*. Nothing in the repo said, in one place, which of those two things decides a brain's language.
This ADR is that place.

## Context

- **There is no `templates/en/`. English IS the root.** `CLAUDE.engine.md` is the English constitution;
  `templates/fr/CLAUDE.engine.md` is its French twin. This is not an accident of history to be tidied
  up: it makes "no twin" mean something useful (below).
- **A rel is locale-owned iff a twin exists.** `engine-copy-select.mjs` derives it from the source tree
  and says so in as many words: *"with no list to maintain here."* A new localized artefact is covered
  the moment someone creates its twin — no registry, no decision, no ADR amendment.
- **The brain already carries its own answer.** `scripts/lib/demo-locale.mjs` exports `BRAIN_LOCALE`;
  the installer's fr overlay replaces that file. It exists on **every tag back to v3.2.2**, and it is
  itself locale-owned, so an update never overwrites it — the marker stays truthful for the brain's
  whole life.
- **`resolveLocaleSource` predates v5** (the skill refresh has used it since v4.9.1). v5 extends it to
  the doctrine and the engine scripts through the shared carrier, `applyMergeGoverned`. An extension,
  not a new mechanism.
- **A brain's bytes are not its language.** The S7 fingerprint table recognises a file by MEMBERSHIP in
  the set of every byte-state the engine ever published, and 4 of the 9 states it holds for
  `CLAUDE.engine.md` are French. A lookup therefore reports a locale *for those bytes*. That is a
  different fact from the brain's own, and the confusion between them is what produced the false alarm
  above.

## Decision

**Three rules, and they are deliberately about three different things.**

| # | Question | The answer, and where it lives |
|---|---|---|
| 1 | **Which files are localized?** | Those with a `templates/<locale>/<rel>` twin in the SOURCE. Derived, never listed (`localeOwnedPaths`, `engine-copy-select.mjs`). English is the root: no twin means *the product did not localize this file*, which is a statement, not an omission. |
| 2 | **What language is THIS brain?** | What `scripts/lib/demo-locale.mjs` says on **that brain** (`readBrainLocale`), and nothing else. Not its content, not its bytes, not what a lookup reports about them. Unreadable or absent → `en`, failing soft. |
| 3 | **Which source does an update read?** | `resolveLocaleSource({ rel, locale, sourceFiles })`, called **once**, inside `applyMergeGoverned`, for every merge-governed family. It resolves at the SOURCE and writes at the **rel**: `templates/fr/CLAUDE.engine.md` lands at `CLAUDE.engine.md`. |

**And one corollary, which is the rule the false alarm cost us**: a `locale` field reported by the
fingerprint lookup describes **the bytes it matched**, never the brain. The two agree on a healthy
brain and that agreement is a consequence, not a definition. Anything that needs to know a brain's
language asks rule 2.

**The FR tree is guarded, not trusted.** `scripts/lib/locale-drift.mjs` fails when a twin has fallen
behind its English source, naming the unpaired commits with their subjects. It judges no translation
quality. Its waiver map (`NOT_A_PORT`) exists because the criterion cannot see direction: a commit that
brings English up to French's standard is unpaired forever, since the correct French edit is *no edit*.

## Consequences

- **Adding a locale is adding a directory.** `templates/es/` and the rels under it become locale-owned,
  drift-guarded and correctly delivered without touching this ADR or any list. The one thing a new
  locale needs is its `demo-locale.mjs` overlay, or rule 2 answers `en` for every brain that installs it.
- **The fingerprint table must carry every locale**, or it heals nobody who runs the product in French.
  This is already asserted: the S7-2 freshness guard computes what a release ships **from the working
  tree, both locales**, and fails when a row is missing.
- **The install and retire doors decide locale-blind, and DELIVER locale-resolved.** Those are two
  different halves and this bullet used to run them together, which is how the code came to contradict
  it. **The DECISION is blind**: `decideSkillRetirement` decides on **provenance**, so it cannot care
  what language the bytes are in, and install-if-absent decides on the skill DIRECTORY's presence,
  which is one path whatever the locale. **The DELIVERY is not**: whatever those doors write goes
  through rule 3, exactly like every merge-governed family, and for the same reason.
  - 🚨 **Measured 2026-08-23** (T10, third v5.0.0 review pass): the code did the first half and not the
    second. **Three doors** — `reconcileBrain`'s merge-skill install-if-absent, `installStagedSkills`
    and `seedHealthNote` — each copied the ROOT rel into a French brain, and each kept it there for
    good, since install-if-absent never fires twice on a directory that now exists. The finding named
    one of the three; the other two turned up by running the case against them. This bullet's old
    wording (*"install-if-absent copies the resolved source"*) was the promise the code broke, so it
    is the sentence that had to become precise rather than the one to soften.
- **The doors are counted by a machine, not by a reading.** A locale-blind copy is invisible in review
  because it reads exactly like the correct one — a hand-audit is what had already failed here. So
  `findDeliveryCopies` (`engine-copy-select.mjs`, beside rule 3's own resolver) censuses every
  `copyFileSync` call across the engine and the installer, and one repo-wide test pins the set against
  a table of verdicts: `locale-resolved`, or `not-an-engine-delivery` with the reason written beside
  it. **A fourth door fails the suite until someone judges it**, and a door that stops calling the
  resolver fails it too. The exemptions today are the owner's Obsidian config backup, the vault import
  of the owner's own notes, and the installer — which applies `templates/<locale>/` as a whole-tree
  overlay, i.e. rule 3 performed wholesale, and which writes the locale marker it could not read.
- **A QA fixture is a brain only if it declares a locale.** The release fixtures build partial trees, so
  `brainAtRelease` takes an explicit `locale` and writes the marker from the tag's own overlay. A test
  pins that it is really written — otherwise a pole named "the French fleet" measures an English brain,
  which is exactly what happened.
- **A locale-owned file is never overwritten by an update**, which is what makes the marker durable —
  and also means a stale `templates/fr/` file stays stale on every French brain until someone ports it.
  Hence the drift guard, and hence its being a test rather than a report nobody reads.

## Alternatives considered

- **A `locale` field in `engine-manifest.json`.** Rejected: it would be a second answer to rule 2, and
  the manifest is rewritten by updates while `demo-locale.mjs` is not. Two markers is how they disagree.
- **Infer the brain's language from its content** (e.g. the doctrine's bytes, via the fingerprint
  table). Rejected — this is precisely the inference that produced the false alarm. It is also wrong in
  the ordinary case: an owner who edits their constitution makes its bytes unrecognisable without
  changing what language they installed in.
- **A maintained list of localized paths.** Rejected: `engine-copy-select.mjs` already derives it, and a
  list is one more thing to forget when a twin is added. The derivation is the same one the copy uses,
  so the delivery and the guard cannot disagree.
- **Fall back to `fr` when a French artefact is detected.** Rejected: it makes delivery depend on
  content, so a single French file could flip a brain's whole language. Rule 2 is a single value that
  the installer writes and nothing else touches.
