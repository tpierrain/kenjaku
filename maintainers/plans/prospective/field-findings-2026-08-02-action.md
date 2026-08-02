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
> **✅ Steps 1 and 2 done** _(2026-08-02 · `ce4c7bf`)_ — the command is now **carried** and
> **announced**. `scripts/rehydrate.mjs` is in `replace`, both constitutions (EN + FR) teach Claude to
> spot the second-machine shape and offer it, and a new manifest guard covers **the third door onto an
> engine script** (constitution, next to hook and skill). That guard went red on **two**, not one:
> `scripts/clear-example-notes.mjs` had been named by the engine constitution since forever while
> carried by nothing — so the **v3.4.1 Windows fix to it reached nobody** who installed before that
> release. Also in `replace` now. Suites green (1071 scripts, 454 rag).
>
> **✅ Steps 3 and 4 done too** _(2026-08-02 · `262b571`, `9175d53`)_ — `SETUP.md` §7 rewritten
> (why a clone is not a working brain, the command, the two things it cannot do, the expected
> first-session "empty index"), the two §8 remedies that prescribed re-running `installer.mjs`
> repointed, both locked by doc guards. And the engine stopped failing into the void: the
> SessionStart self-heal used to read an absent `.mcp.json` as a convergence gap and promise "an
> engine update finishing in the background" **at every session start, forever**, spawning a
> reconcile that cannot create a file; it now names the rehydrate instead.
>
> **Decided in conversation, 2026-08-02 evening: FINISH v4.5.0 FIRST.** F7 fired again the same
> evening on the owner's second laptop (see F7's own entry), which was reason to consider promoting
> it ahead of v4.5.0. The owner's call: **no reordering** — v4.5.0 ships whole, F7 stays the head of
> v4.6.0 right behind it. Do not re-open this at the next session.
>
> **✅ Step 5 done — F14 IS COMPLETE** _(2026-08-02 · `e236b35`)_. The wrapper no longer frames an
> unwired machine as "RESTART REQUIRED … an update finishing in the background": it takes
> `needsRehydrate` and emits a `SETUP NEEDED` directive naming the command. Suite green
> (1077 pass, 1 skipped Windows-only).
>
> **✅ Step 6 done — F11/F12 IS COMPLETE** _(2026-08-02 · `68ea034`, `524c580`, `a52b813`)_. Both
> halves shipped: the banner tells a failure from a wait, and the write-time guard is WIRED — a
> `PreToolUse(Write|Edit)` hook running `scripts/vault-write-guard.mjs`, carried by the manifest, and
> reconciled onto brains that have no `PreToolUse` key at all. Suite green (1100 pass, 1 skipped
> Windows-only). Its P0 entry carries what was decided and what the wiring turned up (a manifest guard
> that only watched `SessionStart`); do not re-open it.
>
> **Resume here — v4.5.0, in this order.**
> 7. **F15** — a note still answering from stale content, with nothing watching it (P0).
> 8. **F16** — the lesson into `maintainers/CONVENTIONS.md` (a checker that parses differently from
>    the engine measures a fiction).
> 9. **F17 — opening a note** _(asked by the owner 2026-08-02 evening, for THIS release)_: a note
>    inside `vault/` opens in Obsidian when it is available, anything outside it in the default
>    editor. Added to v4.5.0's scope, see its P0 entry — it repairs three surfaces that disagree
>    today, one of which already promises the behaviour to the user.
> 10. **F1 — the universe banner** _(moved up from v4.7.0 the same evening, at the owner's request)_:
>    a **short synthesis** plus, in parentheses, `/switch` for the full description. Its P3 entry
>    carries the closed sub-decision and the one design knot left (the digest serves the agent and
>    the human through a single, verbatim-echoed channel).
> 11. Then the **v4.5.0 release**: bump `engineVersion.scripts` (deliberately left at `1.9.0` — the
>    apply plan is glob-driven, so delivery never needed it), PR body stating F5's known limit on the
>    constitution half (an engine-managed file only reaches brains that never customized it).
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
    - [x] **The constitution half is written** _(2026-08-02 · `ce4c7bf`)_ — EN + FR thin templates:
          the second-machine shape (no `.mcp.json` / `.claude/settings.json`, no `vault-rag`, no
          auto-commit), the command, and the closing "open a NEW conversation rooted here". It also
          says **never** to suggest re-running `installer.mjs` (it refuses an existing folder).
    - [x] **The command is CARRIED** _(2026-08-02 · `ce4c7bf`)_ — `scripts/rehydrate.mjs` added to
          `replace`, driven by a new integrity guard over **the constitution as the third door** onto
          an engine script (the two existing ones: a wired hook, a skill's instructions). The guard
          found a second, older gap: **`scripts/clear-example-notes.mjs`** is named by
          `CLAUDE.engine.md` and was carried by no regime, so its **v3.4.1 Windows fix reached nobody
          who installed before v3.4.1**. Now in `replace` too.
    - [ ] Left alone on purpose: `engineVersion.scripts` (still `1.9.0`). The apply plan is
          glob-driven, not version-gated, so delivery does not need it; the bump belongs to the
          v4.5.0 release step.
  - [x] The engine must also **fail by naming the command** instead of failing into the void.
        _(2026-08-02 · `9175d53`)_ Worse than a void, it turned out: an absent `.mcp.json` registers
        no server, so `session-self-heal.mjs` read it as a convergence gap and announced **"an engine
        update finishing in the background"** at every session start, spawning a reconcile that
        cannot create a missing file. A second machine heard that false promise forever. It now
        checks wiring FIRST (`unwiredFiles`, a pure predicate over the rehydration plan) and names
        the command; a wired brain with a real gap keeps its background heal.
    - [x] **Closed** _(2026-08-02 · `e236b35`)_ — `buildSelfHealHookOutput` used to wrap every
          emitted line in `[engine self-heal — RESTART REQUIRED] … an update finishing in the
          background`, which contradicted the rehydrate line it carried. It now takes
          `needsRehydrate` and emits a **`SETUP NEEDED`** framing that names the command instead
          (no "restart", no "update" — a red test asserts their absence), with the **same ≤260-char
          volume budget on both framings**. Wired at the call site from `sessionSelfHeal`'s own
          `needsRehydrate`. **F14 is now complete.**
  - [x] **The docs stopped lying** _(2026-08-02 · `262b571`)_ — `SETUP.md` §7 rewritten around the
        command (+ the key, the NEW rooted conversation, and the expected first-session indexing),
        the two §8 remedies pointing at `installer.mjs` repointed, and two doc guards to keep it so.
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
- [x] **F11 / F12 — an indexing failure is displayed as a wait. ✅ COMPLETE** _(2026-08-02)_. A note was written, committed, and
      **absent from the index**, i.e. invisible to search, for as long as it existed.
  - [ ] Evidence (field): `vault/inqom/briefings/2026-08-02.md` — unquoted YAML value containing `": "`
        → `bad indentation of a mapping entry (6:45)`. The status line read `435/436 … 1 pending —
        auto catch-up in the background`, which **asserts a recovery that could never happen**.
  - [ ] Root cause is **layout, not ignorance**: the engine *did* count it, on a different line
        (`Last catch-up … 1 error(s)`), away from the counter the eye is drawn to.
  - [x] **Fix A DONE** _(2026-08-02 · `68ea034`)_ — `1 failed` ≠ `1 pending`, file + cause on the
        counter's own line. The banner's RAG line left `session-status.mjs` for a pure, tested
        `ragStatusLine({ docs, scanned, lastRun })` (`scripts/lib/rag-status.mjs`) which now reads the
        engine's `last-run.json`. Decisions worth not re-deriving: the rest of the shortfall still
        reads as `pending` (a real wait must stay a wait); **no shortfall ⇒ no alarm**, so a repaired
        note silences its stale error (the run state is only rewritten by the next run, and a checker
        is judged on its false positives — F16); two failures named, the rest counted; and the
        run-state path is pinned to the engine's own constants by a guard test.
  - [x] **Fix B DONE** — **validate frontmatter at write time** with the engine's own parser and refuse
        to write. The writer emitted YAML its own indexer rejects; the note was born broken and nothing
        said so. Decision layer + wiring both shipped (below).
    - [x] **The decision layer is built and tested** _(2026-08-02 · `524c580`)_ —
          `scripts/lib/vault-write-guard.mjs`: `guardDecision({ toolName, toolInput, brainDir, parse,
          readFile })` → `{ allow }` / `{ allow: false, reason }`. It runs the **engine's own parse
          path** (gray-matter + js-yaml 4 `load`, resolved from `rag/node_modules`, tests exercise the
          real parser on the real field payload — F16), **composes the note an Edit WOULD produce**
          before judging (else the second-`updated:` gesture walks past), and upgrades js-yaml's
          `duplicated mapping key (5:1)` into the key + both lines. That scan now has **three** callers
          across two packages → their agreement is a test, no longer a comment. **Fail-open**
          everywhere else (no parser, unreadable file, missing anchor, anything outside `vault/*.md`).
    - [x] **WIRED** _(2026-08-02 · `a52b813`)_ — `scripts/vault-write-guard.mjs` (the entry script:
          hook JSON on stdin → `guardDecision` → `hookSpecificOutput.permissionDecision`), a
          `PreToolUse` / `Write|Edit` entry in `.claude/settings.json.template`, the script in the
          manifest's `replace`, and `reconcileHooks` proven to CREATE the event on a brain that has no
          `PreToolUse` key at all (every brain installed before v4.5.0) — pinned against the real
          template, so deleting the entry fails that test. Verified end to end by hand on the field
          payload: denied with the parser's own cause, the quoted note allowed, anything outside
          `vault/` untouched. The entry script always exits 0 and **fails open silently** on unusable
          stdin: a guard that throws its own stack at the owner once is a guard they disable.
    - [x] Found while wiring, worth keeping: the manifest guard that was supposed to cover "a wired
          hook script an upgrade never delivers" only ever looked at **`SessionStart`**, so this
          `PreToolUse` entry would have sailed past it. Now swept across **every** event, in two
          claims: in *some* regime (else it reaches nobody), and specifically in `replace` — with
          `auto-commit` / `auto-push` named as the deliberate `merge` exceptions (ADR 0012: the owner
          is invited to tune their commit/push policy), so a third user-editable hook has to be a
          choice rather than a copy-paste. Row added to ADR 0009's mechanism table.
    - [x] Decided while building, do not re-open: the guard **denies** rather than warns (it only
          ever fires on bytes the engine's parser has actually rejected, so the note would be
          invisible anyway), and it is scoped to `vault/**/*.md` only (a guard that creeps beyond the
          vault is a guard that gets disabled).
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

- [ ] **F17 — opening a note: three surfaces, three different answers, and a promise nobody keeps.**
      Asked by the owner (2026-08-02 evening, *"ideally with the next release"*): a note **inside
      `vault/`** should open in **Obsidian when it is available**, and any Markdown **outside the
      vault** in the **default editor**. Verified against the code before writing this down — the
      request is not a preference, it repairs a contradiction that is already on disk.
  - [ ] Evidence — the three surfaces disagree **today**:
    - [ ] `CLAUDE.engine.md:123-132` (and `templates/fr/CLAUDE.engine.md:133`): open through the OS
          opener, and *"Obsidian … is never the mechanism for opening a single note"*.
    - [ ] `engine-skills/open-note/SKILL.md:21,42,73`: **always** `open -a "Obsidian" <path>`. Also
          **macOS-only**, which breaks the cross-platform rule (ADR 0015, `DEVELOPING.md:161`) — on
          Windows and Linux that skill's one deterministic step does not run at all.
    - [ ] `scripts/lib/obsidian-health.mjs:44,50` already **promises the user**, twice, that
          registering the vault makes *"🧠 citation links open straight in it"*. Nothing in the engine
          does that: ADR 0027 routes every citation through the OS opener. The nudge sells a behaviour
          the product does not have.
  - [ ] **This is the plan's own reframe**: "a note that belongs to the vault" and "any Markdown file
        on the machine" are two different things rendered identically (one opener for both) — while the
        skill and the constitution render *the same* act two opposite ways.
  - [ ] **The trigger is already written, pure and tested**: `obsidianHealth(vaultPath).status === "ok"`
        means *installed **and** this vault registered*. That is the right condition, not "installed":
        `open -a Obsidian` on a file of an unregistered vault lands on the vault-picker / welcome screen
        (the first-launch caveat, ADR 0029 §Consequences). Anything else → OS opener, unchanged.
  - [ ] **Decided while reading the code** (challenge these before coding, not after):
    - [ ] **🧠 citations follow the same rule.** Otherwise the two gestures that open the very same
          vault note — clicking a citation, and asking *"open my note about X"* — would land in two
          different apps. It also finally makes `obsidian-health`'s existing promise true.
    - [ ] **Mechanism must be cross-platform**, so it cannot be `open -a`. Obsidian's URL scheme
          (`obsidian://open?path=<url-encoded absolute path>`) is one call on all three OSes, and we
          only ever reach it when the vault IS registered. To verify on a real machine before shipping.
    - [ ] **Deterministic, not prose.** A pure `buildOpenNoteCommand({ platform, absPath, insideVault,
          obsidianOk })` in `scripts/lib/`, TDD, next to `open-env.mjs` — the three doc surfaces then
          describe one function instead of each inventing its own rule.
  - [ ] Surfaces to change once the function exists: `CLAUDE.engine.md` + `templates/fr/CLAUDE.engine.md`
        (the §"Opening / viewing / editing a note"), `engine-skills/open-note/SKILL.md` (stop hard-coding
        macOS Obsidian), `SETUP.md:250`, and an **ADR amending 0029** (its *"Obsidian is never the
        mechanism"* line) + a note on 0027. Next free number: **0038**.
  - [ ] **Reach, stated honestly** (F5): `engine-skills/**` is in `replace` and a staged skill the owner
        never edited **is** refreshed on `update-engine` (base = the brain's own staging copy,
        `reconcile-brain.test.mjs:1189`). So this reaches an existing brain — **unless** that brain
        customized `open-note` or `CLAUDE.md`, which is exactly the freeze trap (P2, v4.6.0).

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
  - [ ] **It recurred the same evening, on the OTHER laptop** _(2026-08-02, `prepare-1-1` for Michael,
        screenshot)_: "Hossam qui deviendrait CTO Visma France (non confirmé)" — while the vault's own
        `people/hossam-laanait.md` says *"CTO Visma France (confirmé 04/06)"* and that morning's
        briefing had already ruled it *"un rappel, pas une annonce"*. Two things this proves, and they
        raise F7's priority: (a) the defect is **in the engine skill, not in a machine or a note** —
        the vault carried the right answer to both laptops and the skill read neither; (b) **correcting
        a note does not stop it**, so it will fire at every briefing / 1-1 prep until F7 ships. It also
        travels **downstream of `sync-sources`**: `prepare-1-1` consumes that fan-out, so the control
        `search_vault` has to sit where the facts are produced, not in each consumer.
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
  - [x] **Sub-decision CLOSED by the owner (2026-08-02 evening): the banner carries a SHORT synthesis
        plus, in parentheses, how to get the rest** — *"for more detail on the universe and its
        description, ask `/switch`"*. `/switch` is the right door: it already owns the profile
        (`SETUP.md:698`), even though its name says "change". So the banner states the fact, and the
        detail is **pulled on request** instead of pushed at everyone, every session.
  - [x] **The owner had asked for this before, and half of it shipped** _(2026-07-28, `2243b83`,
        `f63d8ac`, `7ec088b`)_: that pass shrank the **framing** around the universe reminder and the
        profile digest. What it did not touch is the **payload** — `renderUniverseDigest`
        (`universe-profile.mjs:103`) still quotes About / People / Topics / Connector accounts up to
        `DIGEST_MAX_LINES = 12`. That is the part that leaks 🔒 material into every screenshot.
  - [ ] **The design knot to resolve when coding this** (found while re-reading, do not discover it
        again): the digest serves **two different audiences through one channel** — the AGENT (it needs
        people/topics/accounts to reason well, ADR 0035) and the HUMAN (who needs one line). And on the
        CLI `additionalContext` is **echoed verbatim** (`2243b83`'s whole lesson), so there is no
        "inject without showing". Either the human line is all we inject and the agent reads the
        profile note on demand (RAG / direct read), or the leak stays. This is the plan's reframe once
        more: *what the agent must know* and *what the owner must read* are not the same thing.
  - [ ] Still open, and small: whether the single-universe case prints the universe **name** or
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

- [x] **F17 (opening a note in Obsidian when the note belongs to the vault) joins v4.5.0**, at the
      owner's request the same evening — *"ideally with the next release"*. It fits the release's own
      theme: a promise the product already prints and does not keep. _(2026-08-02)_

- [x] **F1 MOVES UP from v4.7.0 into v4.5.0**, same request, same evening. The owner had already asked
      for a summarised universe banner on 2026-07-28; only the framing shrank then. It also stops
      being purely "visibility": what the banner prints at every session is 🔒 vault-only material.
      **Cost, stated so the owner can still say no:** v4.5.0 was three findings, it is now five, so it
      lands later than it would have. _(2026-08-02)_

- [x] **Sequencing: three releases**, plus the freeze trap running alongside on its own track.
      _(2026-08-02)_ Rationale: the four priorities differ in risk and in audience, so bundling them
      would make one indivisible field verification where a single sticking point blocks everything.

| Release | Theme | Findings |
| --- | --- | --- |
| **v4.5.0** | promises kept | F14, F11/F12, F15, **F17**, **F1** (+ F16 into `CONVENTIONS.md`) |
| **v4.6.0** | the vault's identity | F7, F6, homonymy block, reliability/confidence block |
| **v4.7.0** | visibility | F13, F3, F10, F8, F9, F2 |
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
