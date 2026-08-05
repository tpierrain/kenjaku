# v4.8.0 — The One Where It Tells You an Update Is Waiting

Before this branch, a brain could update itself but had **no idea whether there was anything to update**.
The offer was a generic *"you can run an update"*, and saying yes meant consenting to a code swap that
could not answer *"what for?"*. The prompt said so out loud, in the field: *"Je ne sais pas ce qui est
disponible en amont."* This release builds the missing half — the **detection** — and then spends the rest
of itself on the same shape elsewhere: **something asserted without ever being checked**.

**The user-facing note is the source of truth for what ships:**
[`release-v4.8.0-note.md`](maintainers/plans/archived/release-v4.8.0-note.md).

### What is in it

- **The upstream check** (`lib/engine-fetch.mjs`, `lib/upstream-cache.mjs`, `lib/engine-update-check.mjs`,
  `upstream-check-run.mjs`, `lib/semver-tag.mjs`). One `git ls-remote --tags --refs` against the **public
  repo recorded in the brain's own manifest** — the very call the real update already made, simply made
  *before* the confirmation instead of after it. Then, **only if the brain is behind**, one public GitHub
  API request per release for its title and its `What you get` prose, **quoted** rather than paraphrased:
  a generated summary on a load-bearing consent is a non-deterministic step where determinism is cheap.
  A brain that is up to date makes **no HTTP call at all**. Once per 24 h, in a detached child, failing
  soft and silent when offline.
- **Three answers, three shapes** — "nothing to install" and "I could not find out" are opposite answers,
  and the check names *which* unknown it hit: no source recorded, the source did not answer, no release
  tag published, or a brain pinned to a branch (target known, distance unknown → the target is reported
  anyway). The session-start line ends with `· up to date` or `· v4.8.0 available (1 release ahead)`.
- **A note says what it was built from** (`lib/filed-note.mjs`, `lib/ai-summary-guard.mjs`,
  `ai-summary-guard.mjs`). The builder **refuses** a note that declares no source; the stamp records the
  **weakest** tier declared, so a note quoting both a transcript and a Gemini block cannot launder the
  summary; and a `PostToolUse` notice fires on the **read path** when a document turns out to hold both
  the recap and the transcript. Silent on ordinary documents and on pure verbatims — a notice everywhere
  is a notice nobody reads.
- **The ranking rule became an order of operations.** Both constitutions already said to prefer verbatim
  over human synthesis over AI synthesis, and the defect happened anyway: a *passive* rule says how to
  rank sources, never *when* to stop and go read the raw one. Four carriers now carry a gesture, and the
  ranking bullet points at it instead of standing beside it.
- **A declared connector account is now a checked one, for Slack** (`lib/connector-accounts.mjs`,
  `set-universe-profile.mjs --check-slack`). The universe page is something the owner *typed*; the native
  MCP connectors are single-account and do **not** follow a `/switch`. So before filing anything from
  Slack, the workspace is observed and compared. Designed around **not crying wolf**: `acme.slack.com`, a
  permalink and `  ACME  ` are one workspace, and "I could not find out" exits 0 — only a genuine
  divergence is a failure.
- **`/lint` stopped crying wolf twice** — an `_inbox/` capture zone the list did not know (six false
  orphans per pass on the owner's own brain) and a frontmatter complaint about an engine-owned file the
  owner is told never to touch. The capture-zone list existed **twice**, under two names; fixing only the
  lint would have left every `_inbox/` note invisible to `/consolidate` — the same defect moved one
  surface over, and harder to see because nothing complains about it.
- **A backlog is checked before it is shown.** The rule existed and its trigger was drawn in the wrong
  place: keyed on *"on each ingestion of external data"* rather than on **displaying** an unchecked
  action, so a plain recall from the vault fired nothing. Same shape as the source-ranking rule above.

### Choices worth reviewing

- **The daily check ships with no off switch**, deliberately (owner's call): documented rather than
  configurable. `SETUP.md` §10 says what it is and, at length, **what it is not** — no remote added,
  nothing pushed, the owner's own backup repo untouched, nothing from the vault leaving. The one lever
  that does exist (removing `source.repo`) is named rather than hidden.
- **The consent prose is quoted, never summarised** — including the risk that a release note with no
  `What you get` section degrades to titles, then to versions, then to a bare "an update exists". Each
  layer falls into the one below it, never into a blank.
- **ADR 0027 was amended in place rather than superseded** by a new ADR, and every reference repointed:
  the `open-note` decision evolved, and `CONVENTIONS.md` §6bis sends an evolving decision back into its
  own ADR.
- **`EN-QUOI` §5 and §7 were made honest**: they sold *"Upstream dependency: none"* and *"frozen at its
  install version"*. A brain that looks upstream once a day needs those sentences qualified — it looks; it
  never pulls, pushes, or adds a remote.

### Measured, not asserted

The largest targeted pass this project has run: **16 production files** (the whole `main...HEAD` diff —
nothing under `rag/src` or `local-mirror/src` changed, measured not assumed), six batches in a disposable
worktree, **every hardened file re-measured**. Full detail and the equivalence lists:
[`RESULTS.md` § v4.8.0](maintainers/mutation/RESULTS.md).

**Thirteen of the sixteen end at 94 % or above, one at 100 %.** Highlights:
`lib/consolidation-candidates.mjs` **100 %**, `lib/connector-accounts.mjs` 89.72 → **98.26 %**,
`update-engine.mjs` 93.20 → **97.60 %**, `lib/engine-update-check.mjs` 86.07 → **97.03 %**,
`lib/ai-summary-guard.mjs` **58.41 → 96.33 %**, `lib/wiki-lint.mjs` 88.50 → **96.31 %**,
`set-universe-profile.mjs` 80.00 → **94.00 %**.

- **The finding — 28 of 47 survivors sat in four regexes**, and **both anchors of every one** could be
  dropped green. An unanchored heading match is not a wider net, it is a **different** one: it fires on
  any line that merely *mentions* the transcript, so the notice points its reader at a "Transcription
  section" of a document whose whole point is that the transcript was never kept. Three pieces of **dead
  code** came out with it (a subsumed Gemini signature, two unreachable `spec.sources` branches, and a
  `typeof === "string"` that reads as belt-and-braces and is not).
- **The recurring family everywhere else: the absent case and the second element** — the freshest-citation
  contest was never fed a contest, a presence check reaching for `.length` reported YAML `Date` values as
  missing keys, and `realProfileDeps` / `realIo` (the seams every flow test replaces) were observed by
  nothing at all.
- **Three files are NOT hardened, and they are named as debt rather than implied**:
  `upstream-check-run.mjs` **0 %** and `session-status.mjs` **0 %** (the latter inherited, carried by
  every tag since v4.4.0 — written that way so the batch totals cannot read as rot this release caused)
  and `lib/engine-fetch.mjs` **54.05 %**, whose 21 `defaultGit` mutants are the shape v4.5.0 already
  solved once in `verify-index.mjs` and never propagated. Both remedies were **arbitrated to v4.9.0** by
  the owner, with the risk stated out loud: it is the same locally-right deferral as v4.5.0 and v4.6.0.
  The **third** remedy shipped here instead — `CONVENTIONS.md` §5quinquies, a new production file is
  mutated the **day it is written**, which is the direct answer to this release's two new lib files
  landing at 84-87 % on their first pass.
- **One measurement anomaly, proven twice, and it is the tool's**: `wiki-lint.mjs:194`'s
  `freshest && updated → ||` mutant is reported *Survived* but **fails the suite when applied by hand**,
  before and after hardening; targeted re-runs reproduce it. The mutant Stryker activates is not the one
  its reporter prints. Stated in the direction it runs: the published score is **conservative, never
  flattering** — and it is why every batch-5/6 survivor was re-applied by hand before a test was written.

### CI

The full matrix — Node 22, 24 and 26 on macOS and Windows, plus the Windows install end-to-end — green on
the commit being tagged, checked against that commit rather than against the colour of a page.
