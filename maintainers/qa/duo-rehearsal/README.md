# Duo rehearsal — two people, two machines, one repository

**One command, before shipping anything that touches duo mode:**

```bash
node maintainers/qa/duo-rehearsal/rehearse.mjs
```

It exits `0` when every claim held, `1` otherwise, and a failure prints what it saw rather
than merely that it failed. Add `--keep` to leave the scratch brain on disk and poke at it.

Nothing here can reach a real brain: the scratch brain is built from this repo's own
`scripts/` and `.gitattributes` inside a temporary directory, and the only remote it ever
has is a bare repo created beside it.

## What it proves that nothing else in the repo can

Every piece of duo mode is tested on its own — the key composer, the lookup, the writer
guard, the dated-note rule, the merge scope. What none of them can observe is the thing
that actually has to work:

> **the key one machine WRITES is the key the other machine COMPOSES** — days later, from
> different raw fields handed back by a different connector, in a different timezone, with
> a display name on one side and a bare address on the other, after travelling through a
> git merge.

That agreement is the whole feature, and it lives **between** the parts rather than inside
any of them. A unit test proves each end of it against a fixture; only two real clones
prove the two ends against each other.

## What it walks through

1. **A fresh source is not held**, and the check answers so — from the brain folder, as a
   process, the way a skill runs it.
2. **The same mail, met by the other person**, spelled the way another connector spells it
   → *already held*, naming the note to open, saying **read and enrich** rather than discard.
3. **The writer refuses it too.** A model that ignored the check must still be unable to
   store the duplicate: the guard sits where the loss would actually happen.
4. **An unrelated source still goes through** — the check must not become a wall.
5. **Both write on the same day** → Claire is given a file of her own, and told whose note
   the base name already is.
6. **What merges on its own, and what stops and asks**: two appends to one daily note
   rebase with no human and keep both lines; two edits to one person card conflict, name
   the file exactly as the sync tick reads it, and leave a clean tree after the abort —
   with **one** `updated:` line, which is the corruption the narrowed merge rule removes.

## One thing it makes visible, and it is worth remembering

Step 5 only works because the daily note carries an **`author:`** in its frontmatter. The
entry point says so in its own output (*"stamp that `author:`"*), and a note that claims
nobody falls back to the shared file — which is today's behaviour, not a breakage. But it
does mean **the suffix mechanism is only as live as the caller that stamps the field**. The
rehearsal stamps it by hand; in the field, the skill that writes dailies is what must.
