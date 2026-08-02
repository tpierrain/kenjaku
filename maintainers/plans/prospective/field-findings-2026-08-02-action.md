# Action plan — field findings from a real brain, 2026-08-02 (candidate scope for the next release)

> **Why this plan exists.** One evening of real use on the owner's own brain (`mind-palace`,
> 436 notes, 3 universes, `in-process` embedder), across a full `v4.3.0 → v4.4.0` engine update,
> surfaced **16 distinct findings** — from cosmetics to *a documented feature that does not work*.
> They were collected live from terminal screenshots and each one was **verified against this
> repo's code** before being written down. This file is that evidence, organised into candidate
> work.
>
> ⚠️ **Scope is NOT decided.** The owner asked to analyse and cut the release scope **together**,
> after a `/clear`. Nothing here is committed to a version. Priorities below are a *proposal*.

## The one pattern behind most of it (the reframe)

Nearly every serious finding is the same shape: **two semantically opposite things are rendered
identically**, so the user cannot tell them apart.

| Act / state A | Act / state B | Rendered as |
| --- | --- | --- |
| personalizing an engine skill | fixing an engine defect | "customized" → frozen forever (F5) |
| repairing a dangling link | asserting a person exists | create a `people/` note (F6) |
| a note waiting to be indexed | a note that failed permanently | `1 pending` (F11/F12) |
| an up-to-date indexed note | a note answering from stale content | "indexed", counter all green (F15) |
| no engine update available | target version simply unknown | a generic `/update-engine` offer (F3) |

Treating that conflation as **the** root cause is what turns 16 scattered fixes into a handful of
coherent ones. This framing is the plan's main proposal and is itself open to challenge.

## Tracking

### P0 — broken promises (the product advertises it, and it does not hold)

- [ ] **F14 — the documented multi-machine path does not work.** `SETUP.md` §7 tells a second-machine
      user to `git clone`, `npm install`, re-enter the key, and says *"No need for the installer here"*.
  - [ ] Evidence: `.gitignore` excludes `.mcp.json` and `.claude/settings.json`, so a fresh clone has
        **neither** → no `vault-rag` MCP server, no hooks (no auto-commit, no auto-push, no
        SessionStart), no permission allowlist.
  - [ ] Evidence: nothing regenerates them. `scripts/lib/reconcile-brain.mjs:155` guards the `.mcp.json`
        reconcile with `existsSync(templatePath) && existsSync(brainMcpPath)`; `:191` does the same for
        `settings.json`. The reconciler is **additive on existing files only**.
  - [ ] Evidence: chicken-and-egg — the SessionStart hook that would invoke the reconciler is declared
        in the very `settings.json` that is missing.
  - [ ] Evidence: `SETUP.md` §8 troubleshooting says "MCP server doesn't appear → re-run
        `node installer.mjs`", but the installer **refuses an existing folder**. The documented escape
        hatch cannot work.
  - [ ] Decide the fix: a `rehydrate`/`bootstrap` command that generates both files from the shipped
        `.mcp.json.template` / `.claude/settings.json.template` (substituting `{{PROJECT_ROOT}}`), vs.
        letting the reconciler create-if-absent, vs. committing machine-relative variants.
  - [ ] Whatever is chosen, fix `SETUP.md` §7 **and** the §8 troubleshooting row in the same PR.
- [ ] **F11 / F12 — an indexing failure is displayed as a wait.** A note was written, committed, and
      **absent from the index**, i.e. invisible to search, for as long as it existed.
  - [ ] Evidence (field): `vault/inqom/briefings/2026-08-02.md` — unquoted YAML value containing `": "`
        → `bad indentation of a mapping entry (6:45)`. The status line read `435/436 … 1 pending —
        auto catch-up in the background`, which **asserts a recovery that could never happen**.
  - [ ] Root cause is **layout, not ignorance**: the engine *did* count it, on a different line
        (`Last catch-up … 1 error(s)`), away from the counter the eye is drawn to.
  - [ ] Fix A: `1 failed` ≠ `1 pending`; put **file + cause on the same line as the counter**.
  - [ ] Fix B: **validate frontmatter at write time** with the engine's own parser and refuse to write.
        The writer currently emits YAML its own indexer rejects; the note is born broken and nothing says so.
- [ ] **F15 — a note can keep ANSWERING from stale content, and nothing watches it.**
  - [ ] Evidence: `rag/src/lib/frontmatter-parser.ts:117` — *"until one of them is removed, this note
        keeps answering from the content it was last indexed with"*; asserted in
        `index-manager.test.ts:373`. A sibling scan already exists at `scripts/lib/note-refresh.mjs`
        (`duplicateFrontmatterKeys`).
  - [ ] Why it is the worst mode: F11 fails **silently** (note absent); this one fails **plausibly**
        (note answers, with old content) while the counter reads all-green.
  - [ ] Promote a disk↔index crosscheck into an engine command. Reference implementation, written and
        field-proven brain-side: `tools/index-vs-disk-crosscheck.mjs` in `mind-palace` (commit `1305ef1`)
        — 4 failure modes: unparseable frontmatter, on disk but not indexed, indexed but not on disk,
        `sha256(file) ≠ stored hash`, plus indexed-with-0-chunks. Exit codes 0/1/2.
  - [ ] **TDD on promotion** (owner's standing rule): the brain-side script has no tests. The pure diff
        logic is the test subject when it lands here.

### P1 — the vault poisons itself (identity)

- [ ] **F7 — `sync-sources` writes into the vault without ever reading it.** Zero `search_vault`, zero
      `people/` read before writing. Produced an **invented surname** (source said "Jérémy (front
      Candor)", a bare first name; the note asserted "Jérémy Hinard") and republished a two-month-old
      fact as a scoop.
  - [ ] Fix: before ANY write, resolve each cited person against `vault/*/people/` + `domains/
        organisation`; a first name with no surname stays a bare first name, **never** a `[[people/…]]`;
        a `search_vault` before calling any fact "new".
  - [ ] ⚠️ This fix must land **here**, not brain-side: patching `sync-sources` in a brain freezes it
        (see F5).
- [ ] **F6 — repairing a link and asserting a person exists are conflated.** `people/stephanie-music.md`
      was created 19/07 *"to resolve an incoming link"* from a mis-resolved link; "Stéphanie Music"
      occurred **once in the whole vault: in its own title** (Stéphanie Glad: 382 times).
  - [ ] The feedback loop: mis-resolved link → note created to satisfy it → that note becomes the
        vault's truth about who exists → the next resolution resolves **against the fabrication**.
        It survived three weeks and would have corrupted every future resolution.
  - [ ] Companion rule to F7: **never create a `people/` note merely to satisfy an incoming link.**
  - [ ] Measured degradation before repair: banner said 28 dangling links, `/lint` reported **36** after
        one sync session, for **21** existing people notes.
- [ ] **Presence is not enough — disambiguation is the precondition** (design advance found in the
      field, worth adopting upstream). A `people/` note only makes the resolution rule usable if it
      carries an explicit **homonymy block**: the brain had 3 Romain, 3 Marie, 2 Karim, 2 Caroline,
      2 Michael. Without it, notes only move the ambiguity.
- [ ] **Conformant ≠ true.** A deterministic builder guarantees *form* (naming convention, green lint),
      not *substance*. Consider requiring a reliability/confidence block on any note born from a
      **probable** rather than confirmed resolution.

### P2 — the freeze trap, and no path back upstream

- [ ] **F5 — `/improve` invites the patch, `/update-engine` punishes it.**
  - [ ] The mechanism itself is sound and is textbook dpkg-conffile: `engine-manifest.json` records a
        sha256 base per merge file; `scripts/lib/engine-skill-refresh.mjs` `refreshVerdict()` refreshes
        iff bytes still match, else `preserve: customized` + drop `.new` beside it (ADR 0026 §8). **Do
        not break it.**
  - [ ] Defect 1 — the cost is contracted **silently, far from where it is paid**: nothing warns at
        patch time that this skill just unsubscribed from engine updates; the owner finds out months
        later as a `.new`. Cheapest high-value fix, and consistent with ADR 0009 (deterministic over
        forgettable rule): a `PreToolUse(Edit|Write)` hook firing when a write targets an engine-owned
        skill dir, stating the trade-off **before** the edit lands.
  - [ ] Defect 2 — **no exit from the freeze**. A 3-way merge is within reach: the base hash is
        recorded and the base content is refetchable from source, so base + owner + engine is
        computable. "Frozen forever" could be "assisted merge". _(Cross-check with the existing
        `engine-managed-file-merge-strategy.md` plan before designing anything.)_
  - [ ] Defect 3 — **no path back upstream**, the deepest one. Tonight the brain produced three
        genuinely reusable things that no other brain will ever get: the deterministic people-note
        builder, the homonymy-block convention, and the disk↔index crosscheck. `/improve` can patch
        locally but cannot say *"this is an engine defect, it belongs upstream"*.
  - [ ] Root cause to model: **personalization** (freezing is correct) vs **defect fix** (freezing is
        absurd) are two different reasons to edit an engine skill. Only the first is modelled today.

### P3 — visibility, safety and ergonomics

- [ ] **F1 — vault-only confidential material is printed at every SessionStart.** The universe profile
      is dumped verbatim in the banner, including a passage explicitly tagged
      `🔒 CONFIDENTIEL, ne jamais sortir du vault`. It therefore lands in every screenshot, screen
      share and transcript. (It reached this very conversation that way.) Also ~30 lines before the
      first prompt.
- [ ] **F13 — discoverability regression, directly comparable across the update.** v4.3.0 banner:
      `2 consolidation candidates (offer /consolidate) and 28 dangling links (offer /lint)`. v4.4.0:
      `1 consolidation candidates and 27 dangling links` — both offers **gone**, same line width, so
      not truncation. Cosmetic bonus: "1 consolidation candidate**s**".
- [ ] **F3 — the engine-update offer is version-blind.** The opt-in prompt states the *installed*
      version and asks "Je lance ?" **without ever naming the target version**: the owner consents
      blind to a code swap. One `git ls-remote --tags` on the recorded source fixes both halves
      ("is there an update" and "what am I installing").
- [ ] **F10 — the recorded source is frozen at install time.** The prompt showed
      `source: tpierrain/second-brain-generator` while the launcher's remote is
      `git@github.com:tpierrain/kenjaku.git` (renamed at v4.0.0). ADR 0026 states `update-engine`
      **never refreshes** `engine-manifest.json`. Works only via GitHub's rename redirect. Bounded
      (only the same account can break it) but invisible; any org transfer or second rename silently
      strands the pre-rename cohort.
- [ ] **F8 — auto-commit history is unusable as a landmark.** 8 successive commits all messaged
      `auto: vault/claude sync`, mixing people notes, briefing, backlog and PostHog. The brain worked
      around it by pointing at the backlog. Cheap fix: name the touched area
      (`auto: vault/inqom/people (21 files)`). Confirmed twice in one evening.
- [ ] **F9 — auto-commit coverage of out-of-band deletions is observed, not guaranteed.** A `rm` in
      Bash *was* caught (verified via `git log --diff-filter=D`), but the brain's own words were "ce
      qui n'était pas acquis". Pin the behaviour down (and test it) rather than relying on it.
- [ ] **F2 — "update the brain" covers only one of three axes.** Content (`sync-sources`), engine
      (`/update-engine`) and vault hygiene (`/consolidate`, `/lint`) are three distinct meanings; the
      answer named two and silently ignored the pending hygiene work the SessionStart banner had
      announced three lines above. **Note:** the desired behaviour already exists on the
      `update-engine` path (it spontaneously reports "1 consolidation candidate, 27 dangling links,
      rien d'urgent"). So this is to be **generalised, not invented**.

### Cross-cutting engineering lesson (F16) — for CONVENTIONS, not just for one fix

- [ ] **A checker that parses differently from the engine measures a fiction.** The field crosscheck's
      first version declared **434 of 436 notes broken** while the vault was fine: `gray-matter` 4.x
      routes through `yaml.safeLoad` (js-yaml 3), removed in 4, and the repo pins js-yaml ≥ 4.2.0.
  - [ ] The lesson is the **direction** of the error: a false alarm on everything is indistinguishable
        from noise, therefore ignored. Any health/verify surface must (a) run the engine's **own**
        parsing path, and (b) be judged on false-positive behaviour, not only on catching the true
        positive.
  - [ ] Candidate: add this to `maintainers/CONVENTIONS.md` next to the mutation-testing rules.

## Decisions owed (to take WITH the owner, after the `/clear`)

- [ ] Which of P0/P1/P2 enters the next release, and what is deliberately deferred.
- [ ] Whether the "conflated opposites" reframe is accepted as **the** organising root cause.
- [ ] F5 defect 3 (path back upstream) is the largest piece of design here and may deserve its own
      ADR + plan rather than a release line.
- [ ] Whether F1 (confidential in the banner) is a product decision (truncate/summarise the profile)
      or a documentation one.

## Evidence trail

- Field session: owner's `mind-palace`, 2026-08-02, `v4.3.0 → v4.4.0`, 436 notes, 3 universes,
  `EMBEDDING_PROVIDER=in-process`, remote `git@github.com:tpierrain/mind-palace.git`.
- The brain's own diagnosis and remaining work live in **its** `vault/backlog/harnais.md` under
  `[observation]` (pointer, not copied here).
- Brain-side artefacts worth harvesting: `tools/index-vs-disk-crosscheck.mjs` (commit `1305ef1`),
  the deterministic people-note builder, the homonymy-block convention.
