# ADR 0036 — Deterministic channels differ by surface, and the chat is the only universal one

- **STATUS:** ACCEPTED (2026-07-28).
- **Scope:** Second brain (runtime) only — the startup hooks' output channels
  (`scripts/session-status.mjs`, `scripts/session-universe.mjs`, `scripts/session-wiki-health.mjs`,
  `scripts/session-self-heal.mjs`), the retirement of the engine-installed `statusLine`
  (`.claude/settings.json.template`, `scripts/lib/status-line-retreat.mjs`,
  `scripts/lib/reconcile-brain.mjs`) and the restart nudge's delivery
  (`scripts/lib/restart-signal.mjs`). **No installer flow change**, no index schema change, no
  change to the sacred constitution surface.
- **Related:** [`0005-support-desktop-code-tab.md`](0005-support-desktop-code-tab.md) (Desktop is a
  first-class surface, which is exactly why its channel gaps matter);
  [`0009-prefer-deterministic-mechanisms.md`](0009-prefer-deterministic-mechanisms.md) (a
  deterministic channel is worth more than an instruction to the agent — this ADR bounds *where*
  that holds); [`0015-cross-platform-parity.md`](0015-cross-platform-parity.md) (same shape, one
  layer down: what the host gives us is not uniform); field log
  [`../plans/prospective/fleet-upgrade-field-feedback.md`](../plans/prospective/fleet-upgrade-field-feedback.md)
  (F2, F4, F5).

## Crux

Four source comments asserted that Claude Desktop's Code tab renders a `statusLine`, while our own
`update-engine` skill asserted the opposite — and the code had been built on the comments for two
releases. **Neither claim was ever verified until F4.** The verification says the skill was right.

The decision: **record the channel matrix as a decision, retire the engine-installed status line, and
treat the agent's own chat message as the only channel that reaches every surface.**

## Context — the matrix, field-verified

Claude Code v2.1.220, the same brain, the same session boundary, checked on both surfaces:

| Channel | CLI (terminal) | Desktop — Code tab |
| --- | --- | --- |
| `statusLine` | ✅ rendered, persistent | ❌ **nothing** |
| SessionStart `systemMessage` | ✅ displayed | ❌ dropped |
| SessionStart `additionalContext` | ⚠️ **echoed verbatim to the user** | ✅ agent-only, as designed |
| The agent's chat text | ✅ | ✅ **the only channel reaching both** |

**Nothing in this table was inferable from the documentation**, which never mentions Desktop and is
framed entirely in terminal terms. It was obtained by looking at two screens.

Two consequences fall straight out of it, and both are defects we shipped:

- **`statusLine` was a CLI-only surface sold to ourselves as the Desktop one.** It was introduced
  precisely because `systemMessage` does not reach Desktop (v3.3.0, ship-blocker A2). It never reached
  Desktop either. Meanwhile `statusLine` is a **single value, not a merged list**, so ours **evicted
  the line of every owner who had configured one** — on the one surface where it does render, i.e.
  among precisely the people most likely to have configured one (F2).
- **`additionalContext` is not backstage on the CLI.** It is echoed verbatim, prefixed
  `SessionStart:startup says:` — so eight lines of agent-directed English protocol were the first
  thing an owner met, before typing a word, on a product sold to non-developers (F5).

## Decision

1. **The channel matrix above is a recorded fact, dated and field-verified.** Comments no longer get
   to assert it on their own authority: the surviving ones point here. *A fact that lives only in
   comments rots, and gets built upon.*

2. **The engine stops occupying `statusLine`.** New installs no longer set it. Deployed brains have
   the key **removed** by the reconciler, because making our script print nothing would still leave
   the owner a **blank** line — the key itself is what evicts theirs.

3. **The removal is provenance-guarded, and it is the whole discipline.** We remove the key only when
   its command names our own `scripts/status-line.mjs`. Anything the owner wrote by hand survives; an
   unrecognised command is **kept**, because a cosmetic leftover of ours is cheap and deleting their
   configuration is not. Same rule as `engine-skill-refresh.mjs`: overwrite only what we delivered.

4. **This makes the reconciler's write to the sacred `settings.json` no longer purely additive** —
   additive **plus exactly one nominative removal**. That is a real weakening of an invariant, so it
   is named here rather than discovered later in the code.

5. **`scripts/status-line.mjs` is KEPT as a documented opt-in**, not deleted. It works, it is
   delivered like any engine script, and an owner who wants the brain's line back only has to point
   their own `statusLine.command` at it. Deleting it would remove a real (if niche) CLI feature and
   buy nothing.

6. **Anything an owner MUST see belongs in the agent's chat message.** The 🛑 MANDATORY restart rule
   in the `update-engine` skill is therefore **not** a redundant belt to be trimmed as duplication: on
   Desktop it is the *sole* delivery, and always was. It is marked as such where it lives.

7. **`additionalContext` carries the FACT, never the protocol.** What is echoed must be small enough
   to be harmless when echoed; the how-to belongs in the skill the agent loads once it needs it.

## Consequences

- **The restart nudge needed a new home before anything could be removed.** It was surfaced *only* by
  `status-line.mjs`; `session-status.mjs` never imported it. It now leads that hook's
  `systemMessage`, from the same two on-disk signals (`scripts/lib/restart-signal.mjs`, extracted and
  unit-tested on the way). Rerouted **first**, removed **after**.
- **On Desktop, the nudge has no deterministic channel at all** — and that is not a regression, it
  never had one. The chat rule is it. Said plainly rather than papered over.
- **An owner of a deployed brain sees a change they did not ask for**, so the update reports it as
  what they gain: *"your own status line is back"*. A silent change to something they look at reads
  as a bug, not as a gift.
- **The Windows `statusLine` prefix repair (issue #31) becomes moot for our own line** — a broken line
  of ours is not worth healing, it is worth giving back. The repair path survives for a line that is
  not ours.
- **A converged brain that never had a status line is still left byte-identical.** The retreat is not
  a reason to write, so no `auto:` churn follows an update.
- **The gap generalises: the deterministic-mechanisms rule (ADR 0009) is bounded by the surface.** A
  deterministic channel beats an instruction to the agent *only where the host renders it*. Where it
  does not, an instruction to the agent is not the weaker option — it is the only one.

## Alternatives considered

- **Make `status-line.mjs` print nothing (rejected).** The owner would get a blank line instead of
  theirs: `statusLine` is one value, and the brain's `settings.json` keeps winning for the session.
  It looks like a retreat and is a downgrade.
- **Merge with the owner's line (rejected).** There is nothing to merge with: the host exposes one
  command, not a list, and we cannot run theirs on their behalf without inheriting their shell.
- **Keep it and only warn at install (rejected).** It puts the burden on the owner for a surface that
  delivers nothing on Desktop, and does nothing at all for the deployed fleet — which is where the
  eviction is already happening.
- **Delete `status-line.mjs` outright (rejected).** It is working code with a real CLI use; keeping it
  as opt-in costs a file nobody runs.
