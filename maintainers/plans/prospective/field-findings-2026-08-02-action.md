# Action plan — field findings from a real brain, 2026-08-02 (candidate scope for the next release)

> **Why this plan exists.** One evening of real use on the owner's own brain (`mind-palace`,
> 436 notes, 3 universes, `in-process` embedder), across a full `v4.3.0 → v4.4.0` engine update,
> surfaced **16 distinct findings** — from cosmetics to *a documented feature that does not work*.
> They were collected live from terminal screenshots and each one was **verified against this
> repo's code** before being written down. This file is that evidence, organised into candidate
> work.
>
> ✅ **Scope IS decided** _(2026-08-02, with the owner, see `## Decisions taken`)_: **everything below
> ships**, P0 through P3, including the freeze trap. The reframe below is accepted as **the**
> organising axis. Only the upstream-path piece (F5 defect 3) leaves this plan, into its own ADR +
> plan.
>
> **Next real step** (the Tracking boxes are not the right marker yet, the work is ordered by the
> release table in `## Decisions taken`): **v4.5.0 / F14, the rehydrate — in progress on `main`**,
> TDD, suite green (1071 pass).
>
> **The command WORKS and is committed** _(2026-08-02, `d0147bc` → `7abd2b3`)_: `node
> scripts/rehydrate.mjs`, run from a freshly cloned brain, rebuilds the two gitignored files from
> the templates that travelled in the clone, reseeds the health canary, installs **both** dependency
> trees, and ends by asking for a NEW conversation rooted in the folder (the wiring only loads at
> session start). Offline, idempotent, exits non-zero naming the command to run by hand. Underneath:
> `scripts/lib/brain-rehydrate.mjs` (`machineReplacements()`, `rehydrationPlan({ exists })`) and a
> shared `applyLaunchers()` so the installer and the rehydrate cannot wire a brain differently.
> Settled while writing it: the canary path now has ONE owner (`staged-health-note.mjs`) plus a test
> deriving it from the engine's own TS sources, so a rename in `health-check.ts` / `config.ts` fails
> here instead of seeding the note where nothing reads it; and the launchers / `run-node.*` stay out
> of the plan list on purpose (path-free, they travel through git untouched).
>
> **Resume here — the command exists but NOTHING points at it yet.** In order:
> 1. **Carry it.** `scripts/rehydrate.mjs` is absent from `engine-manifest.json` → it reaches no brain
>    and no upgrade. Add it to `replace`. Worth a guard while there: the integrity test already proves
>    "every script a HOOK names is carried" and "every script a SKILL names is carried" — the
>    constitution is the third door, and it is the one this feature uses.
> 2. **The constitution line** (`CLAUDE.md.template`): teach Claude to offer the rehydrate when both
>    files are missing (decided above; known limit to state in the PR — F5's freeze means it only
>    reaches brains whose constitution was never customized).
> 3. **`SETUP.md` §7** (rewrite: it under-installs and says "no need for the installer") **and the §8
>    troubleshooting row** ("re-run `node installer.mjs`", which cannot work).
> 4. **The engine must fail by NAMING the command** instead of failing into the void.
>
> One thing to check when writing §7: the rehydrate deliberately does **not** index (a clone has no
> `rag/.cache`), so the first rooted session is what indexes the vault — including the just-reseeded
> canary. Say so, rather than let a first session's health banner read as a defect.

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
  - [x] **Code read 2026-08-02, three things the finding did not know:**
    - [x] **The material is already in the clone** (the good news, and it shrinks the fix). The
          installer copies the templates into the brain (`installer.mjs:518-520` reads them from
          `TARGET`), and `.gitignore` ignores only the *generated* `.mcp.json` / `.claude/settings.json`
          — **not** the `.template` siblings. So a second machine has both templates locally. A
          rehydrate needs **no network, no installer, no source repo**: only the local substitution.
    - [x] **Only two placeholders carry the machine**: `{{PROJECT_ROOT}}` (the `cwd` of both MCP
          servers) and `{{NODE}}` (`nodeHookCommand`, `rag-launcher.mjs:220`, the absolute path to
          `scripts/run-node.sh`). The launchers themselves are **path-free** (`rag/launch.sh` is
          invoked with a relative arg, `applyRagLauncher:230`) and travel fine. The blast radius is
          two files and two substitutions.
    - [x] **`SETUP.md` §7 also under-installs.** It says `cd rag && npm install`, but the installer
          installs **two** dependency trees (`installer.mjs:773` and `:789` — `local-mirror/` has its
          own `package.json`, 7 deps). So even after regenerating `.mcp.json`, the `local-mirror`
          server would fail to start on the second machine. Same PR.
  - [x] **Decided (2026-08-02): a rehydrate command.** It replays the installer's generation step
        **locally**: the two files from the templates already in the clone, the launchers, and **both**
        `npm install`. Offline, idempotent, no source repo. Rejected: create-if-absent in the
        reconciler (it does not stand alone — the reconciler is fired by the SessionStart hook declared
        in the very `settings.json` that is missing, so it would need this command underneath anyway);
        and removing the absolute paths (better in principle, but it depends on what Claude Code
        actually resolves and it touches every deployed brain — kept as a possible later cleanup).
  - [x] **It must SHARE the substitution code with `installer.mjs`, not re-implement it.**
        _(2026-08-02 · `ff76609` for the placeholder table, `d0147bc` for `applyLaunchers`)_ Two
        generators that substitute differently produce two different brains — the same defect shape as
        F16 (a checker that parses differently from the engine measures a fiction). Extract
        `gen()` + the `replacements` table (`installer.mjs:484-520`) into a lib both call.
  - [x] **Decided (2026-08-02): discovery = the doc AND the constitution.** `SETUP.md` §7 + the §8 row
        carry the command for a human; **and** the constitution — which travels through git — teaches
        Claude to offer the rehydrate when both files are missing, so the second machine self-repairs
        conversationally. Known limit, to state in the PR: the constitution is an engine-managed file,
        so this half only reaches brains whose constitution was not customized (F5's freeze).
  - [ ] The engine must also **fail by naming the command** instead of failing into the void.
  - [ ] **Second field run, 2026-08-02 evening — the owner rehydrated `mind-palace` BY HAND on a
        second laptop.** It worked (436/436 indexed, repo up to date), and its SessionStart banner
        proved the scope above is too narrow. Screenshot evidence, verified against the code:
    - [x] **The rehydrate must also reseed the health canary note.** _(2026-08-02 · `7f10185`)_ `vault/engine-health/` is
          gitignored and the note is seeded **only** by `installer.mjs:347` (`seedHealthNote`), so a
          rehydrated brain never has it — permanently. The banner reports it and prescribes
          "ask me to reindex your vault", which **cannot** recreate a note. Add it to the command's
          job, next to the two files, the launchers and the two `npm install`.
    - [ ] **The banner contradicted itself, by design.** It printed `index empty → ask me to reindex`
          and, three lines below, `RAG up to date — 436/436 files indexed`. `session-health.mjs`
          reports the **last known** verdict (an instant file read) and re-probes detached for the
          *next* session, so a stale verdict is rendered with the same authority as the live status
          line it contradicts, and nothing reconciles them. **This is the plan's own reframe, on a
          surface it did not list**: "measured just now" and "measured some time ago" render
          identically. Candidate: date the cached verdict, or suppress a cached check the live line
          already contradicts.
    - [ ] **An `unknown` check is rendered as a problem.** `health-check.ts:147` classes the missing
          canary as `unknown`, not `broken` — but `health-probe.mjs` `bulletsFor()` lists every
          non-`ok` check as a bullet under "⚠️ Last health-check found a problem", as soon as **one**
          sibling check is broken. "We could not tell" is displayed as "it is broken".
    - [ ] **Measured the next morning — the stale verdict is a ONE-SESSION LAG, not a frozen one.**
          `engine-health.json` was present and rewritten (870 B, same day 22:35), and the next
          session's banner carried **no health alarm at all** (437/437 indexed, repo up to date). So
          the detached re-probe does run: the contradiction was a display lag. Severity downgraded,
          the fix stays in v4.7.0.
    - [ ] **But the silence hides worse, and this is the finding that matters.** With the index
          non-empty, `index` goes `ok` and the missing canary stays `unknown` → the module is no
          longer `broken` → `formatHealthBanner` returns `null`. On that rehydrated brain the health
          check therefore **can never again prove the index answers**, and says nothing about it:
          **"verified healthy" and "could not verify" render as the same silence.** The reframe
          again, and the strongest argument yet for reseeding the canary in v4.5.0 — without it, the
          brain's own health check is decorative, permanently and invisibly.
    - [ ] **Routing (my call, open to challenge):** the canary reseed ships in **v4.5.0** (it is part
          of rehydrating, and without it the multi-machine path still ends on a false alarm); the two
          banner defects ship in **v4.7.0** with the rest of the visibility work, since they affect
          every brain, not just a rehydrated one.
  - [ ] Whatever is chosen, fix `SETUP.md` §7 **and** the §8 troubleshooting row ("re-run
        `node installer.mjs`", which cannot work) in the same PR.
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
  - [ ] **Decided (2026-08-02): a product fix, not a documentation one.** The banner prints a
        **synthesis** of the active universe, never the verbatim profile.
  - [ ] **And only when more than one universe exists.** With a single universe there is nothing to
        disambiguate, so the profile earns no banner space at all. This makes the fix consistent with
        ADR 0034's "invisible until a second universe exists" rule, instead of being only a leak fix.
  - [ ] Open sub-decision: what exactly a "synthesis" contains (name alone? name + role + top
        recurring topics?), and whether the single-universe case prints the universe **name** or
        strictly nothing.
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

## Decisions taken (2026-08-02, with the owner)

- [x] **Scope: everything ships** — P0, P1, P2 and P3, the freeze trap included. Nothing is
      deliberately deferred at finding level. _(2026-08-02)_
- [x] **The "conflated opposites" reframe is accepted as THE organising root cause.** The work is cut
      along that axis: wherever two semantically opposite acts or states render identically, separate
      them. It is not a filing convenience, it is the shape of the fix. _(2026-08-02)_
- [x] **F5 defect 3 (the path back upstream) gets its own ADR + plan**, not a release line. Reason:
      it changes the model itself (personalizing an engine skill vs. fixing an engine defect are two
      different intents, only the first is modelled) and the brain↔engine relationship. It stays in
      scope, it just does not live in this plan. _(2026-08-02)_
- [x] **F1 is a product decision**: the banner prints a **synthesis** of the active universe, and only
      when there is **more than one universe**. See the F1 entry in P3 for the sub-decision still open
      (what the synthesis contains, and the single-universe rendering). _(2026-08-02)_

- [x] **Sequencing: three releases**, plus the freeze trap running alongside on its own track.
      _(2026-08-02)_ Rationale: the four priorities differ in risk and in audience, so bundling them
      would make one indivisible field verification where a single sticking point blocks everything.

| Release | Theme | Findings |
| --- | --- | --- |
| **v4.5.0** | promises kept | F14, F11/F12, F15 (+ F16 into `CONVENTIONS.md`) |
| **v4.6.0** | the vault's identity | F7, F6, homonymy block, reliability/confidence block |
| **v4.7.0** | visibility | F1, F13, F3, F10, F8, F9, F2 |
| _in parallel_ | the freeze trap | F5 defects 1+2 — defect 3 gets its own ADR + plan |

### Still owed (ordering, not scope)

- [ ] **F14's fix shape** is the only finding whose solution is still an open choice (rehydrate
      command vs. create-if-absent reconciler vs. committed machine-relative variants). It is also the
      first move of v4.5.0, being a broken documented promise with no workaround.

## Evidence trail

- Field session: owner's `mind-palace`, 2026-08-02, `v4.3.0 → v4.4.0`, 436 notes, 3 universes,
  `EMBEDDING_PROVIDER=in-process`, remote `git@github.com:tpierrain/mind-palace.git`.
- The brain's own diagnosis and remaining work live in **its** `vault/backlog/harnais.md` under
  `[observation]` (pointer, not copied here).
- Brain-side artefacts worth harvesting: `tools/index-vs-disk-crosscheck.mjs` (commit `1305ef1`),
  the deterministic people-note builder, the homonymy-block convention.
