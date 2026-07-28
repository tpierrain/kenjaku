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
- [ ] **Cut the release** — Thomas's call, deliberately left undone
  - [ ] merge PR #50 into `main`
  - [ ] tag + publish `v4.2.1`, title in the house style (`v4.2.1 — The One Where …`);
        draft title on the table: *The One Where the Update Cleans Up After Itself*
  - [ ] the release note carries the mutation snapshot pinned to the tag
        (CONVENTIONS §5ter): `engine-commit.mjs` **100 %**, `repo-status.mjs` **97.73 %**
  - [ ] marketing-surface pass is **already done and recorded** — nothing became false,
        boards need no re-render (see PR body + `e9e854b`)
- [ ] **Unblock Thomas's own brain** (`~/mind-palace`) — he asked for nothing to be touched
      while this was in flight
  - [ ] its 3 engine files from the 2026-07-25 update are still uncommitted, so every
        startup pull has failed since; one `git add -A && git commit` clears it
  - [ ] ⚠️ the fix does **not** self-apply on the update that installs it: the running
        process is the OLD `update-engine.mjs`, so step 9 only starts committing from the
        NEXT update onward. The startup banner will, however, immediately say why the pull
        is blocked — and the ordinary auto-commit sweeps the files as soon as a note is written.
- [ ] **Archive this plan** on ship (CONVENTIONS §7) + drop the memory pointer

## Follow-up found on the way (not this release)

- [ ] `npm --prefix maintainers/mutation run mutate:scripts` **cannot run at all** any more: it
      fails its dry run because `engine-manifest-integrity.test.mjs` asks `git ls-files` and the
      Stryker sandbox copy has no `.git` → every manifest glob reads as dead. Until that test
      tolerates a repo-less checkout, the harness package can only be measured file-by-file with a
      narrowed command. Detail in [`../mutation/RESULTS.md`](../mutation/RESULTS.md) (PR 50 section).
