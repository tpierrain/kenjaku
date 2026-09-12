<!-- plan-carrier-guard: delegates-only — this folder holds the BODY of published release   -->
<!-- notes and nothing else. It owns no plan state: where a release stands is the active    -->
<!-- plan's job, and this index only says what each file is.                                -->

# Release note bodies, as published

One file per release, named after its tag, holding the **exact Markdown that was published** to
GitHub Releases.

**Why they live here rather than only on GitHub.** `CONVENTIONS.md` §11 requires running the real
parser (`extractWhatYouGet`) over the drafted body **before** publishing — which means the body exists
as a file first. Keeping that file turns a step that used to happen in a temporary directory into
something the next release can read, diff and learn from. It also means a note drafted and verified in
one session survives into the next one, which a scratchpad does not.

**Not a second source of truth.** The published release is authoritative; if the two ever disagree,
GitHub wins and the file is corrected. Nothing reads these files at runtime — `maintainers/` never
reaches a generated brain.

| File | Release |
|---|---|
| [`v5.2.0.md`](v5.2.0.md) | `v5.2.0 — The One Where Done Really Means Done` |
