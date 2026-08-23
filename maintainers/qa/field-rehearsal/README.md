# Field rehearsal — run the release the way the field will run it

**One command, before every release that changes the update path:**

```bash
node maintainers/qa/field-rehearsal/rehearse.mjs --brain ~/some-brain
```

It exits `0` when the trial passed, `1` when the owner's territory moved or the update
itself failed. Run it once per brain you can lay hands on, ideally at different installed
versions (the older the brain, the more the release has to catch up).

## What it proves that nothing else in the repo can

In the field, **the old engine performs the update**: the `scripts/update-engine.mjs`
already installed in the brain fetches the new release and hands off to it. Every test
here — unit, integration, release fixtures — calls **HEAD's** code. So the handoff itself
is structurally invisible to the suite: a release can be perfect from HEAD's point of view
and still converge nothing when an older engine is the one driving.

That is not hypothetical. On **2026-08-22** this harness found that v5's first update
landed **nothing** on either of the two brains it was rehearsed against, while telling
their owner they were up to date: the auto-finalize child was reading the brain's own
stale manifest as its target, so the doctrine was never in a family it could deliver. The
fix is in `scripts/lib/reconcile-brain.mjs`, pinned by a unit test — and this file exists
so the next release is put through the same trial rather than trusting that pin alone.

## What it does

1. Bare-clones **this working repo** into the work directory and force-tags the release
   (`--tag`, default `v5.0.0`) onto the current `HEAD` — so the trial fetches the code
   under review, never the published one.
2. Copies the brain **without its `.git`** (so the copy has no remote and can never push
   home), `git init`s it, and repoints `engine-manifest.json` `source.repo` at the mirror.
3. Prints the **STATE before**.
4. Imports the **copy's own** `update-engine.mjs` and runs it. `npm` is stubbed for this
   run only (`npm install` / `npm run reindex` are network and model work; the trial is
   about what the update *writes into the brain*). Everything else is the real engine.
5. Prints the **report the owner would read**, then the **STATE after**.
6. Diffs the **owner's territory** against the pre-update commit.

## How to read the three sections

- **STATE before / after.** `merge families`, `doctrine among them`, `retired`, `baseRefs`,
  the doctrine's line count and `.engine-base` entries. An unfreeze that worked moves
  every one of them; a frozen brain shows `doctrine among them: false` and
  `.engine-base entries: 0` on *both* sides.
- **The report the owner would read.** The trap the 2026-08-22 defect fell into: the
  report said `✅ Engine updated` while the state had not moved. Read it **against** the
  states, never on its own.
- **The owner's territory.** `vault/`, `CLAUDE.md`, `.claude/settings.json`,
  `settings.local.json`, `.env` — staged against the pre-update commit, so it reads the
  same whether the update committed its work or left it in the working tree. This one
  outranks the other two: an update that delivers the whole release and edits one byte of
  a note has still failed.

## Guardrails

- 🔒 **The originals are only ever read.** The copy is taken without `.git`; every write
  goes to `--work` (default: a folder under the system temp dir).
- 🧪 Rehearsing against a real brain is what gives the trial its value — a real brain has
  hand-edits, an old install date and a full vault, which no fixture reproduces. Nothing
  read from it is ever written into a tracked file: **findings go in the abstract**, per
  the guardrails in [`../README.md`](../README.md).
