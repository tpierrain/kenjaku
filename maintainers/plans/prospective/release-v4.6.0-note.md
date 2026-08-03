# v4.6.0 — <TITLE: the owner's call, see the three candidates in the plan>

**Your brain stops inventing the people it writes about.** When a colleague comes up by first name only,
it now looks them up in *your* notes before writing a word — and when it cannot tell which one you mean,
it says so instead of picking.

### What you get

- 🙅 **No more invented surnames.** Handed a bare *"Jérémy"*, your brain used to complete the name to
  make a link work, and that invented person was then saved and searched like a real one. A first name it
  cannot resolve now stays plain text.
- 📇 **Your notes get the last word on who someone is.** Before writing about a person, it reads the page
  your vault already holds about them — so a fact you confirmed two months ago is no longer re-announced
  as news, or contradicted by today's guess.
- 🔗 **Repairing a broken link no longer conjures up a person.** Tidying your wiki could create a page for
  someone who exists nowhere else in your vault — not any more; the offer keeps its topic case and stops
  at people.
- 👥 **Three Romains? The page says which one.** A new person page has to carry what tells them apart, and
  your brain refuses to write it otherwise — naming the pages it already found. A bare first name matching
  several people counts as *unresolved*, not as the nearest match.
- 🎯 **A page says how sure it is.** Identity worked out rather than read is marked ✅ observed,
  🟡 probable or 🔴 unverified — right on the page — and can be promoted later, when you confirm it.
- ⚙️ **Your brain tells you which engine it runs.** A `⚙️ Kenjaku engine v4.6.0` line at the start of each
  session. It had been computed for months and shown nowhere.

### What you have to do

Ask for **`/update-engine`** once, then restart your session if it says so.

**This release does not re-read your notes** — nothing to wait for, nothing in your vault is modified.

---

### Under the hood

- **The defect was a rule the engine shipped, not a mood of the model.** The `sync-sources` skill ordered,
  in the same breath, *"never a first name alone, `[[people/jane]]` is forbidden"* and *"create the
  backlinks even if the target page doesn't exist"*. Handed *"Jérémy (front Candor)"*, an agent obeying
  both had exactly two exits: drop the link, or invent a surname. It invented. The fix repairs the order
  itself — *no full name, no link* — rather than adding a caveat next to it, and it lands in the
  **producer** (`sync-sources`), which every consumer already reuses: two paraphrases of one discipline
  are two disciplines that drift.
- **A rule stated only in prose is a rule nothing executes.** So each half of this release has a carrier
  that runs. *Is this really new?* became a third reconcile pass in the synthesis step — the only place
  that can run it, since the sub-agents read external sources and never see the vault. *Which one?* and
  *how sure?* became refusals in the one script both note-creating doors write through, so they cannot be
  argued with: a new person card whose first name the vault already holds is refused until the spec says
  what tells them apart, and the refusal names the homonyms it found.
- **Confidence is a field, not a flourish.** It is written into the page's header as well as the visible
  block, because a caveat left in prose is one the next session absorbs as confidence. It is **required**
  rather than offered: left optional, its absence would come to mean *confirmed*, which is silence
  rendered as certainty — this trilogy's own defect shape. And it can change: `/refresh-note` promotes a
  page through the same renderer that built it, rewriting field and block together, because a marker that
  can never move is decoration and readers learn to ignore it.
- **The same vocabulary as v4.5.0, deliberately.** ✅ observed / 🟡 probable / 🔴 unverified is the scale
  that release introduced for claims; a second scale for identity would have been a second discipline.
- **Where it reaches.** The skills and scripts that carry the rules are refreshed on any brain that did
  not tailor them, so `/update-engine` is enough. The constitution half reaches new installs, as always.
- **The version line was not missing — it had stopped being shown.** The label had been computed since
  v3.0.0, but its only surface was the status line, which the engine gave back to you in v4.4.0 rather
  than keep clobbering the one you had set. It now rides both session-start channels (terminal and the Claude Desktop Code tab). Two
  silences are on purpose: no usable tag, no line at all — rather than a number that is not a Kenjaku
  release — and a pending restart still takes the floor, because until you restart, the version you would
  read is not the one answering you.

### Mutation-score snapshot, pinned to v4.6.0

Not line coverage: every number below is what survived deliberately breaking the code and re-running
the suite. The seven files this release changed were measured one by one — no `rag` or `local-mirror`
file changed, so those packages carry over untouched rather than being re-measured for nothing.

| Package | Mutation score | What was measured |
|---|---|---|
| **scripts** (harness) | **all 7 changed files at 96 % or above, two at 100 %** | per file; every remaining survivor is a listed equivalent mutant |
| **rag** | **94.67 %** | its v4.5.0 figure — untouched by this release |
| **local-mirror** | **90.44 %** | its v4.2.0 audit — untouched by this release |

**The finding is worth stating plainly, because it is the same shape as the release itself.** The small
function that decides *which section of a document* our documentation guards read had **no test of its
own**: it was only ever exercised through those guards, on real documents where a degraded reading
still happened to contain the words they were looking for. Deliberately breaking it so that it returns
the **whole document** left every guard green — which would have quietly turned each of them back into
the loose search they were written to replace. It has its own tests now, and every injected fault dies.

**The honest bound.** `session-status.mjs` scores **0 %**: it is a top-level script that runs on import,
so no test can observe it. The logic it displays is covered — that is exactly why the version segment
was built as a separate, testable piece — but its wiring is not. That hole is **inherited, not new**,
and closing it is a release of its own rather than something to do on the eve of a tag.

A published release is frozen, so these numbers stay true for this tag forever. Full detail:
[`maintainers/mutation/RESULTS.md`](maintainers/mutation/RESULTS.md).

### Review & CI

<!-- filled once /code-review and the full matrix have spoken -->
