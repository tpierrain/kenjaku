# ADR 0042 — Access belongs to the git host; the brain only decides how notes are filed

- **STATUS:** ACCEPTED (2026-09-05).
- **Scope:** Second brain (runtime) — duo mode's author registry (`author-identity.mjs`,
  `lib/author-identities.mjs`, `lib/brain-author.mjs`, `session-authors.mjs`), and the user-facing
  duo-mode documentation.
- **Related:** [`0009`](0009-prefer-deterministic-mechanisms.md) (prefer a mechanism to a convention
  — this ADR is where that preference **stops**, because the mechanism already exists elsewhere);
  [`0041`](0041-a-captured-source-carries-its-identity.md) (the capture side of duo mode);
  [`0034`](0034-progressive-disclosure-of-universes.md) (nothing surfaces until a second one exists);
  plan [`../plans/prospective/duo-v51-safeguards-action.md`](../plans/prospective/duo-v51-safeguards-action.md).

## Crux

- **Decision.** The brain implements **no access control of its own**. Who may write into a brain is
  decided by the **git host's collaborator list** on the private repository. What the brain decides,
  and all it decides, is **how notes are filed** once a name shows up in the history.
- **Which makes revocation a one-liner, and it is not ours**: to end a duo, the owner removes the
  person's access on the host. Nothing to un-declare inside the brain, no state to unwind, no way for
  a former collaborator's answer to matter afterwards.
- **Why no in-brain gate would help.** An author name is a line of git config. Anyone who can push
  can already change it, rewrite any note, hand-edit the answer registry, and — since the repository
  carries `scripts/` and `rag/` — run code on the other person's machine at their next session. **No
  mechanism inside the brain defends against someone who already has push access**, so a gate built
  there would protect nobody while looking as if it did.
- **Prior art, and it is the ordinary shape of this problem.** Every tool that lives in a git
  repository inherits the repository's access model rather than inventing one: a CI runner, a
  documentation site, a `.env`-driven service. Stronger guarantees exist and are the host's to give —
  **signed commits, branch protection, required reviews, SSO** — and they compose with this ADR
  instead of competing with it.

## Context

Duo mode (v5.1.0) lets two people share one brain by sharing one private repository. Reading the
shipped surface, the owner asked the question none of the machinery answers on its own:

> *"Comment m'assurer que c'est bien la personne à l'origine du second cerveau qui accepte ? Est-ce
> qu'on a mis suffisamment de mécanismes en place pour que la nouvelle personne ne soit pas celle qui
> dise 'c'est OK' pour se faire ajouter elle-même ?"*

The question is right, and the honest answer turned out to be: **the guarantee already exists, and it
is not in the brain.** Adding a collaborator to a private repository happens in the owner's
authenticated account on the host, with whatever second factor that account carries. Nobody adds
themselves. Until that happens, a would-be second person can neither read nor write a single note.

What the brain does hold is a **question about filing**: git author names are all it has, so one
owner whose two Macs are configured `Thomas Pierrain` and `tpierrain` is indistinguishable from a
duo. The session hook therefore asks *"someone else, or you on another machine?"* and records the
answer. It was tempting to read that question as a permission prompt. **It is not one, and this ADR
exists so that it is never re-read as one.**

## Decision

1. **The collaborator list is the fence.** The brain performs no authentication, no authorization and
   no revocation. It never asks "may this person write here?" — by the time a name appears in the
   history, the host has already answered.
2. **The registry answers are about filing, never about access.** *"Someone else"* means each
   person's day gets its own note and a shared source is not stored twice. *"It's me"* means two
   spellings are one person. Neither grants, widens or narrows anyone's ability to write.
3. **Revocation is documented as a host operation**, in the duo-mode page and in `SETUP.md` §7:
   remove the collaborator on GitHub (or the equivalent), and the duo is over. Rotating anything the
   repository exposed is the owner's ordinary hygiene, exactly as after sharing any machine.
4. **The brain must, however, make the situation VISIBLE**, since visibility is the one thing a
   filing mechanism can honestly offer:
   - a confirmed duo is told, once, **where the access came from and how to take it back**;
   - a fusion recorded on another machine is **announced on this one** until this keyboard has
     endorsed it, so a wrong *"it's the same person"* cannot silently hide a second person's arrival.
5. **No notion of "the owner" is introduced** — no first-committer privilege, no owner field in the
   registry, no answers accepted only from one name. All of it would rest on a string that whoever
   already has access can rewrite.

## Consequences

- **What we do not build, and therefore do not have to maintain**: an identity model, a permission
  model, an invitation flow, a revocation flow, an audit of who granted what. The host has all five.
- **A brain is only as private as its repository.** This is stated plainly in the user-facing docs
  rather than implied: sharing a brain is the decision to share a machine, not to share a document.
- **Trust is bounded by the invite, not by the product.** A collaborator who turns hostile is outside
  what any in-brain mechanism can address; the answer is to remove them and to treat what they saw as
  seen. Saying so is more useful than a gate that would fail quietly.
- **Attribution still matters, and it survives all of this.** Every write is committed under its
  author's name, so *who wrote what* is answerable from history — which is why the metadata for a
  future audit is being stamped now (plan step 9.4) even though the audit itself is not built.
- **If a future need genuinely requires enforcement** (a shared brain inside a company, say), the
  path is the host's: branch protection, required reviews, signed commits, SSO. This ADR does not
  close that door; it says the door is not ours to build.

## Alternatives considered

- **An "owner" recorded in the brain, whose answers alone count.** Rejected: the owner would be
  identified by a git config string, which anyone with push access can set to anything. It would
  convert a real limitation into an invisible one, which is worse than the limitation.
- **A signed answer registry (per-machine keys).** Rejected as disproportionate: it would defend the
  registry while leaving every note, script and hook in the same repository unsigned. Signing is
  meaningful at the repository level (signed commits), and that is the host's feature.
- **An in-brain "approve this person" prompt before a second name may write.** Rejected as theatre:
  the write has already happened by the time the brain sees the name, since the push is what carried
  it. The prompt would arrive after the fact and could be answered by whoever sits at any keyboard —
  including the newcomer's. What replaces it is item 4 above: **tell the owner, do not pretend to
  gate.**
