---
name: sync
description: "Synchronizes the git repo between machines mid-session. Commits local changes, pulls --rebase from origin, handles conflicts interactively (the active universe has a standing rule: the machine you sit at wins), announces a context that arrived with the pull, and pushes."
version: 1.1.0
---

# /sync — Cross-machine repo synchronization

> User command. Useful when working on several machines (personal / work laptop)
> and you want to pull in changes pushed from the other without leaving the session.

## When to use it

- When you've worked on another machine and want to pull the changes in here.
- Mid-session, without having to quit and relaunch Claude Code.
- Complements the `SessionStart` hook (which pulls at startup) for mid-session cases.

> ℹ️ Requires a **configured git remote** (`origin`). For purely local use, this skill is useless.

## Procedure

### Step 1 — Local state
```bash
git status --porcelain
```
**Clean** → go to step 3. **Dirty** → step 2.

### Step 2 — Commit local changes
```bash
git add .
git commit -m "auto: vault/claude sync"
```
Creates a safe restore point before the rebase.

### Step 3 — Fetch and rebase
```bash
node scripts/set-active-universe.mjs current   # remember it: step 5 compares
git fetch origin
git rebase origin/$(git branch --show-current)
```
**Success** → summary + step 5. **Conflict** → step 4.

> Read the active universe **before** rebasing. The pull can carry a context switch made
> on the owner's other machine (it is committed state — ADR 0034), and step 5 can only
> say so by comparing. At session start the same thing is handled deterministically by a
> hook; mid-session, this skill is the only channel.

### Step 4 — Conflict handling
1. List the conflicting files: `git diff --name-only --diff-filter=U`
2. Show the diff of each with context.
3. Ask the user:
   > **Conflict on N file(s).** Options:
   > - **merge**: I resolve and we continue the rebase
   > - **abort**: `git rebase --abort` — back to the previous state (the local commit is safe)
4. If **merge**: resolve intelligently (vault content = often append-only → keep both versions), `git add` the resolved files, `git rebase --continue`.
5. If **abort**: `git rebase --abort`, report that the local commit is intact, stop.

#### The one file with a standing rule — `.vault-rag/active-universe`

It holds which universe (context) the owner is working in. It is a **single value**, so
"keep both" is meaningless, and improvising here silently changes the scope of every
search for the rest of the session. The rule, decided once:

> **The machine you are sitting at wins.** Keep this machine's current value; the owner's
> next `/switch` propagates it everywhere.

```bash
git checkout --theirs -- .vault-rag/active-universe && git add .vault-rag/active-universe
```

⚠️ **`--theirs` is correct, and it is the counter-intuitive one.** A rebase replays YOUR
commits on top of origin's, so during the conflict `--ours` is **origin** (the other
machine) and `--theirs` is **this machine's** commit being replayed. Do not "fix" this
to `--ours`: that hands the session to the other laptop's context, which is exactly what
the rule refuses. Resolve it, then `git rebase --continue`, and let step 5 announce it.

### Step 5 — Push and summary
```bash
git push
node scripts/set-active-universe.mjs current   # compare with what step 3 read
```
Show: local commit yes/no, files pulled in from the other machine, push status.

**If the universe changed**, say it in ONE line, first, in the owner's language — a scope
change nobody announces is the failure this whole feature exists to remove:

> You are now in your **`<name>`** universe (it followed you from your other computer).
> Searches are scoped to it plus your cross-cutting notes.

If it did not change, say nothing about universes: a single-context brain must never hear
about the feature at all (progressive disclosure, ADR 0034).

## Edge cases
- **Nothing to sync**: repo clean + up to date → "Nothing to synchronize (commit abc1234)."
- **Network unavailable**: `git fetch` fails → report, local changes intact.
- **Complex conflict** (binaries, restructuring): recommend a manual resolution.
