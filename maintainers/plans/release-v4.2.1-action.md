# Release v4.2.1 — a brain that stopped syncing, and a banner that wouldn't say why

- **STATUS:** 🚧 IN PROGRESS — code merged-ready (PR #50, CI fully green), release not cut yet.
- **Scope:** Second brain (runtime) — startup sync + engine update persistence.
- **Branch:** `fix/pull-failure-says-why` · **PR:** <https://github.com/tpierrain/kenjaku/pull/50>

## Tracking

- [x] **The startup banner says WHY a pull failed**, instead of a dead-end "check manually"
      _(2026-07-28 · `6a2f372`)_
- [x] **An engine update commits what it wrote**, so a brain never silently stops syncing
      _(2026-07-28 · `3fa8ad5`)_
- [x] **The persistence model in SETUP tells the truth** (a third writer exists, and the owner
      sees its commit) _(2026-07-28 · `e9e854b`)_
- [x] **The two touched files are mutation-clean** (98.53 %) _(2026-07-28 · `6293770`)_
- [x] CI matrix fully green (macOS + Windows × Node 22/24/26 + installer e2e)
- [x] **The commit-if-dirty moved into the SessionStart hook** _(2026-07-28 · `78db772` + `d8991b6`)_
  - [x] Why: step 9 lives in `update-engine.mjs`, which is **not** a hook. It runs once, replacing
        itself mid-flight while the in-flight process keeps the OLD code in memory — so the update
        that *installs* the fix still leaves the repo dirty, and only the update *after* it commits.
        The very hole this release claims to close is re-opened one last time on every brain.
  - [x] Fix: `sweepThenPull` (`scripts/lib/startup-sync.mjs`) commits before the `git pull --rebase`
        in the SessionStart path. A hook is a fresh node process each time, reading the `.mjs` off
        disk → active at the **first restart after the update**, the installing update included.
  - [x] This was the remedy ADR 0011 held in reserve, so it also closes the Obsidian-edit gap that
        ADR documented as accepted. 0011 amended (gap now **closed**); **step 9 stays** — it names
        the version in an intent-bearing commit, the sweep is the belt under that suspender.
  - [x] Found on the way, and fixed: a blind sweep would **bury conflict markers** in a note and
        fake-resolve a stopped rebase. An unmerged tree is now left untouched, and the banner asks
        the human to resolve instead of advising a commit (`countUnmerged` + its banner line). The
        uncommitted-notes alert stopped accusing silent hooks: it is printed **by** a hook that just
        tried to commit, so it now names a git that refused.
  - [x] Mutation (narrowed, same blocker as the follow-up below): `startup-sync.mjs` **100 %**,
        `repo-status.mjs` **98.21 %** — sole survivor = the `pullOut ?? ""` equivalent already
        accepted. Recorded in [`../mutation/RESULTS.md`](../mutation/RESULTS.md).
- [ ] 🚧 **RESUME HERE — cut the release.** Thomas's call.
  - [ ] ⛔️ **HOLD on the merge (2026-07-28).** Thomas wants to check something first about
        **universe handling when one or more local mirrors are already installed**. Nothing to
        change here until that check is done — the branch is pushed and green-tested, it can wait.
  - [ ] merge PR #50 into `main`
  - [ ] tag + publish `v4.2.1`, title in the house style (`v4.2.1 — The One Where …`);
        draft title on the table: *The One Where the Update Cleans Up After Itself*
  - [ ] the release note carries the mutation snapshot pinned to the tag
        (CONVENTIONS §5ter): `engine-commit.mjs` **100 %**, `startup-sync.mjs` **100 %**,
        `repo-status.mjs` **98.21 %**
  - [ ] marketing-surface pass is **already done and recorded** — nothing became false,
        boards need no re-render (see PR body + `e9e854b` + `d8991b6`)
- [ ] **Unblock Thomas's own brain** (`~/mind-palace`) — he asked for nothing to be touched
      while this was in flight
  - [ ] its 3 engine files from the 2026-07-25 update are still uncommitted, so every
        startup pull has failed since; one `git add -A && git commit` clears it
  - [x] ✅ the caveat that used to sit here is **gone**: step 9 alone did not self-apply on the
        update that installs it (the running process is the OLD `update-engine.mjs`), which is
        precisely why the sweep moved into the SessionStart hook. Now the **first restart after
        the update** commits those files by itself — no hand-commit needed on any brain.
- [ ] **Archive this plan** on ship (CONVENTIONS §7) + drop the memory pointer

## Follow-up found on the way (not this release)

- [ ] `npm --prefix maintainers/mutation run mutate:scripts` **cannot run at all** any more: it
      fails its dry run because `engine-manifest-integrity.test.mjs` asks `git ls-files` and the
      Stryker sandbox copy has no `.git` → every manifest glob reads as dead. Until that test
      tolerates a repo-less checkout, the harness package can only be measured file-by-file with a
      narrowed command. Detail in [`../mutation/RESULTS.md`](../mutation/RESULTS.md) (PR 50 section).
