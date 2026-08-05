# v4.8.0 — The One Where It Tells You an Update Is Waiting

**Your brain now knows when a newer version of itself exists — and tells you what it is for.** Until
today it could update itself, but it had no idea whether there was anything to update: the offer was a
generic *"you can run an update"*, and saying yes meant consenting to a code swap that could not answer
*"what for?"*. Now the version you would be installing, and the human summary of what it brings, are on
screen **before** you decide.

The rest of this release is the same idea applied to what your brain tells you elsewhere: a checker that
stops complaining about healthy things, a connector that is *checked* instead of merely declared, and
notes that say what they were actually built from.

### What you get

- 🔔 **It tells you an update is waiting — and what it contains.** Your session-start line now ends with
  `· up to date` or `· v4.8.0 available (1 release ahead)`. Ask to update and it names the target version
  and **quotes, from the release note itself, what you would gain** — never a summary it wrote itself.
  If it could not find out (no network, the source did not answer), it says *that*, and never *"you're up
  to date"*: those are opposite answers and only one of them is good news. Already on the latest? It
  says so and stops, instead of reinstalling the same code and charging you a restart for it.
- 🔎 **What that look-up is, and what it is not.** Once a day, in the background, your brain asks the
  engine's **public** repository one question: *"which versions have been published?"* — nothing more. It
  does **not** add a git remote to your brain, does **not** push or send anything anywhere, and has
  **nothing to do with your own backup repository**, which stays yours and untouched. Nothing from your
  notes ever leaves. Nothing is downloaded or installed either: finding out and updating remain two
  separate steps, and the second one still waits for your yes. Offline, it stays quiet and your session
  carries on. (Details, including the one lever that turns it off, in SETUP §10.)
- 🧾 **Your notes say what they were built from.** An AI-written meeting recap is not the meeting. Every
  note your brain files now records its source on a four-tier scale — verbatim, a conversation, a human
  summary, an AI summary — and a note that rests on an automatic summary **says so when it is cited**.
  When a document holds both the recap and the actual transcript, the transcript is read **first**, and
  a search-result snippet is never treated as a source: the document gets opened. A summary's own
  mistakes stop quietly becoming facts in your vault.
- 💬 **A connector you *declared* is now one it *checked* — for Slack.** Your universe page may say this
  sphere uses the Acme workspace; that is something you typed. Before filing anything from Slack, your
  brain now asks Slack **which workspace it is actually on**. Match → it carries on. Different → it
  **stops and tells you**, instead of filing one organisation's material under another's name, which is
  what happened silently when a connector stayed authenticated on the sphere you just left.
- 🧹 **`/lint` stops crying wolf.** It reported your raw captures as orphan notes when your inbox folder
  is named `_inbox`, and it complained, every single pass, about a frontmatter defect in one of the
  engine's **own** files — the one file you are told never to touch. Both are gone. A checklist that
  reports healthy things is one you learn to stop reading, and the real problems go with it.
- 🌌 **Small ones**: `/universe` and `/univers` already worked as of the last release; this one keeps
  them and adds nothing you have to learn.

### What you have to do

Ask for **`/update-engine`** once, then restart your session if it says so.

**This release does not re-read your notes** — nothing to wait for, nothing in your vault is modified.

One thing to expect if you have tailored your own `/file-back` skill: your brain will now refuse to file
a note that does not say what it was built from, and the refusal names the field and the four tiers.

---

### Under the hood

- **The target was knowable all along.** The check is one `git ls-remote --tags` — the very call the real
  update already makes — and its output carries every intermediate tag. The call was simply being made
  *after* the confirmation instead of before it. Everything richer is layered on top and degrades into
  the layer below, never into a blank: versions, then each release's title, then its `What you get`
  prose, **quoted** rather than paraphrased, because a generated summary on a load-bearing consent is a
  non-deterministic step where determinism is cheap.
- **"Nothing to install" and "I could not find out" are opposite answers**, and this release is largely
  about not rendering them identically. The check has three states and each unknown says *which* unknown
  it is: no source recorded, the source did not answer, the source publishes no release tag, or a brain
  pinned to a branch rather than a release — where the target is known but the distance is not, so the
  target is reported anyway.
- **The source header is a builder output, not a field you are asked to remember.** The failing session
  that started this never *chose* the AI summary over the transcript — it never met a moment where the
  question was asked. So the note builder refuses a note that declares no source, the stamp records the
  **weakest** tier declared (a note quoting both a transcript and a Gemini block cannot launder the
  summary), and a notice fires on the read path itself, when a document turns out to hold both. That
  notice stays silent on ordinary documents and on pure verbatims — a notice everywhere is a notice
  nobody reads.
- **The rule already existed, and the defect happened anyway.** Both constitutions already said to rank
  verbatim above human synthesis above AI synthesis. It is a *passive* rule: it says how to rank
  sources, never *when* to stop and go read the raw one. It is an order of operations now, with a
  gesture in each rule, and the ranking bullet points at it instead of standing beside it — two rules
  about one thing, one of which never fires, is how a reader learns which one to obey.
- **The Slack check is designed around not crying wolf.** `acme.slack.com`, a message permalink and
  `  ACME  ` are one workspace; a false divergence would send someone to reconnect a connector that is
  perfectly fine. Hence a normaliser, and an explicit *"do not compare the two strings yourself"* in
  both languages. It exits non-zero **only** on a genuine divergence; "I could not find out" and "this
  sphere declares no Slack account" are answers, not failures.
- **The two `/lint` defects were one defect with two spellings.** The list of what counts as a capture
  zone existed **twice** — in the lint and, under another name, in `/consolidate`. Fixing only the lint
  would have stopped the false orphans while leaving every note in an `_inbox/` invisible to
  consolidation: the same defect, moved one surface over, and harder to see because nothing complains
  about it. And the engine-file exemption is keyed on the note's **type**, never on its folder — a
  folder-keyed rule would have handed anyone a silent opt-out of the whole lint by choosing where to
  save.
