## What this release is about

> ### Your second brain was reporting problems you did not have, and staying quiet about one you did. This release fixes both ends.

Your brain checks your notes for you. It looks for links that point nowhere, and for notes that nothing
links to, so that a vault which grows to hundreds of notes does not quietly fall apart.

That check was too suspicious. A screenshot you pasted into a note, a link written inside a table, the
notes your brain keeps for its own work: it flagged all three as broken or abandoned, and none of them
were. A list of alarms that are mostly false is a list you stop reading, and the day you stop reading
it is the day a real broken link can hide in it.

At the other end, the same brain was too trusting. When it searches your mail, your chat or your
calendar and the connection is down, what comes back is not an error message, it is an empty result.
Your brain read that emptiness as good news and told you there was nothing new. *Nothing new* and
*nothing reachable* look identical from the inside, and only one of them is worth knowing.

There is a third, smaller and constant: when your brain wrote a note for you, it cut your paragraphs
into lines at a width nobody had asked for.

Two of these were reported by people running real vaults who took the time to write up what they saw:
thank you to [@StefanPenndorf](https://github.com/StefanPenndorf), and to the reader who reported the
silent source.

## What you get

**When your brain checks your notes**

- 🖼️ **A pasted image stops counting as a broken link.** Screenshots, PDFs, anything you dropped into a
  note: they are part of your vault, and the check now knows it.
- 📊 **A link written inside a table is read as a link.** It was being misread at the first `|`, so a
  perfectly good link to *Acme | Q3 review* was reported as pointing nowhere.
- 🗂️ **The notes your brain keeps for its own work stop being listed as abandoned.** Meeting prep,
  briefings, one-to-one notes, its backlog: it wrote them, it uses them, and you were being asked to
  clean up after it.

**In ordinary conversations**

- 🔌 **A source that cannot answer now says so.** Before telling you there is nothing new in your mail
  or your chat, your brain runs one small check that it knows must come back with something. If that
  one comes back empty too, the connection is the problem, and you are told that instead of being
  told all is quiet.
- 📝 **Your paragraphs keep the shape you gave them.** When your brain writes a note, it stops cutting
  your sentences into lines at a width nobody asked for. A paragraph stays one paragraph, whatever its
  length, and your lists, tables and code stay exactly as they were.

**In your brain's own instructions**

- 🧹 **A rule you may have written yourself is now built in.** If your `CLAUDE.md` carries a line
  telling Claude not to break lines inside a paragraph, you can delete it: the engine holds that rule
  now, for every brain.

## What you have to do

Ask your brain to update its engine (`/update-engine`), say yes, then restart Claude once. Your notes,
your keys, your constitution and the skills you tailored are left alone, as always.

---

## Under the hood

**The checker's three false alarms, and what they had in common.** All three came from the same
resolver treating "a thing a link can point at" as "a Markdown note".

- **#71 — attachments.** `buildResolver` was built from the note list alone, so every `![[screenshot.png]]`
  resolved to nothing. `readVaultAttachments` is deliberately the *complement* of `readVaultNotes`
  (everything not ending in `.md`) rather than an extension allow-list, which would have gone stale on
  the first format nobody thought of.
- **#73 — escaped delimiters.** A wiki link splits on `|` (alias) and `#` (heading), but Obsidian lets
  both be escaped. `\|` inside a link target was being treated as the alias separator, truncating the
  target to something that existed nowhere.
- **#74 — the engine's own work zones.** `meetings/`, `briefings/`, `prep-1-1/`, `coaching/` and
  `backlog/` are written by the engine for the engine. They are not orphans; they were never meant to
  be linked from a person's own notes.

**The fix for #71 was live on a second surface nobody had looked at.** Chasing a surviving mutant on
`buildResolver`'s default argument found `consolidation-candidates.mjs` calling it with one argument:
the same bug, proposing *"create a page for `screenshot.png`"* in the session-start nudge. Worse, the
line after it read frontmatter off whatever came back, so an attachment reaching it threw a
`TypeError` **inside a fail-open hook** — which would have made the entire nudge vanish silently
rather than fail loudly. Both are fixed, and the attachment list is now read once and handed to both
scans, because giving it to one and not the other only moves the false positive.

**Measured on a real 663-note vault, and the measurement is honest about itself.** Orphans went
**87 → 85**; dangling links went **18 → 18**. That vault holds zero attachment embeds and zero escaped
pipes (verified by grep, not assumed), so two of the three fixes could not possibly have moved a
number there — they were reported from a different vault, and both are proven instead by running the
checker as a process against a tree built to each issue's own repro steps.

**#80 ships doctrine, not code, and the design call is the whole content.** A control query is only
worth anything if it (1) goes through **the same route that answered empty** — in the field report the
*read* route worked throughout, so a control on it would have cheerfully reported "healthy" about a
dead search route, (2) carries **no keywords**, so a genuine absence of matches cannot be mistaken for
a failure, and (3) is built so that **zero is impossible on a live account**. The `sync-sources` skill
now carries one named control per shipped connector, an explicit escape hatch for connectors that can
only offer a weaker one, and the consequence: a DOWN verdict raises an alert and **disables every
negative claim that depended on that source**, never cached, with a paced fan-out. Guarded by
`lib/source-liveness-discipline.test.mjs` across four surfaces (both constitutions, both skills).

**#95 needed a tool before it could be a rule.** The issue assumed `scripts/unwrap-markdown.mjs`
already shipped with the engine; it did not. Writing the rule without it would have had the
constitution point at a command no brain has. The rewriter is pure and its every predicate is a
*refusal* to join: frontmatter, fenced blocks, tables, headings, horizontal rules, HTML, list items,
blockquote prefixes and both spellings of an explicit hard break are all left exactly where they are.
The default is to leave a line alone. A repair pass over an existing vault is available as
`node scripts/unwrap-markdown.mjs [--check] <file|dir>`, with `--check` exiting non-zero so it can gate.
Run against a real brain installed in June and never touched since, it reported **9 of its 30 notes**
as carrying breaks nobody asked for — which is how common this was.

**Rehearsed on a real brain before the tag (§10ter).** A brain installed 2026-06-18 at v3.4.0, in
French, was copied and updated to this release: 504 engine files swapped, `engineVersion.scripts` at
1.18.0, and **the owner's vault and hand-edited files came back byte-identical**. The new script was
checked *running* inside that updated copy rather than trusted from the report, and its French
constitution came out byte-identical to `templates/fr/CLAUDE.engine.md`, both new rules included.

**Test quality.** Mutation score on the two new files: `lib/unwrap-markdown.mjs` **98.36 %** (81.45 %
on the first pass — 16 further tests were written to pin the boundaries each survivor exposed; the two
remaining survivors are equivalent by construction), `unwrap-markdown.mjs` **100 %**. One of those
tests exists only because a mutation that **deleted** a path separator instead of converting it
survived every local run: on macOS `join()` never produces a backslash, so the conversion is dead code
here and would have printed `vaultpeoplejane-doe.md` on Windows (CONVENTIONS §9 — a local green is a
POSIX green).

**Verified.** All 7 matrix cells (Node 22/24/26 × macOS/Windows) plus the Windows installer
end-to-end, on [PR #97](https://github.com/tpierrain/kenjaku/pull/97).

Closes #71, #73, #74, #80, #95.
