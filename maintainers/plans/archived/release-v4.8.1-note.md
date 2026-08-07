# v4.8.1 — The One Where Closing It Actually Closes It

> Draft of the GitHub release body. Written per `CONVENTIONS.md` §11: non-developer first, depth kept
> but moved below the `---`. Archive this file to `maintainers/plans/archived/` once the release is cut.

**Your brain could quietly lose the ability to read its own notes, and this release stops that.** When a
session ended, the part of your brain that searches your notes did not always stop with it; the leftovers
piled up until a later session could not start its search at all — and it did not say so, it simply
answered without ever looking in your vault.

Your notes were never at risk: nothing was written, changed or lost. What was lost was the *reading* of
them, and the fact that nothing told you is the part we consider the real defect.

### What you get

- 🧠 **Your brain lets go of your notes when you close it.** The search engine now stops with the session
  that started it, instead of staying behind and holding your index open. That is what made the problem
  grow on its own: each leftover made the next start slower, until one of them ran out of time and the
  session came up with no access to your vault at all — silently, because an absence looks like nothing.
- ⚡ **Sessions start about three times faster.** Your brain was fetching its own runner over the network
  at every start, instead of using the copy sitting in its own folder. Measured on the machines where
  this was reported: **9.8 s down to 2.8 s**. That margin is also what had been standing between a slow
  start and a start that never finished.
- 🪟 **Two Windows launchers that had never really been read by Windows.** The small start-up files your
  brain generates were written with the wrong kind of line break. Windows reads those files by counting
  bytes, so it lost its place mid-word and tried to run fragments of our own comments. They are written
  correctly now, and a test makes Windows actually run them at every change rather than just look at them.
- 💬 **Start-up messages you can act on without being a developer.** The lines you see when something
  needs your attention no longer talk about `.env`, MCP servers, or things being "gitignored", and they no
  longer hand you terminal commands for gestures your brain can perform itself. Each one now names what
  happened, gives one thing to do in plain words, and ends by reminding you that your notes are untouched.
- 🟢 **The reassuring green line no longer promises more than it checked.** It used to say your notes were
  *up to date*, which reads as *everything works* — while all it had done was look at a file on disk. In
  the exact failure above, it cheerfully reported a healthy index for a brain that could not read a single
  note. It now states only what it measured: how many of your notes are indexed.

### What you have to do

Ask for **`/update-engine`** once, then close and reopen Claude when it tells you to.

**Your notes are not re-read and not modified** — nothing to wait for, nothing changes in your vault.

If you are on Windows and someone gave you a hand-patched start-up file, you can drop it: this release
carries the real fix, and the update would have overwritten the patch anyway.

### Thanks

**This release exists because of Daniel MARTIN.** He hit the failure on Windows, then did the work nobody
owes anyone: he reproduced it, read our source to find the cause, ran a control experiment, and sent the
whole thing over. Every fix above starts from his report. Thank you, Daniel.

---

### Where this came from

Daniel MARTIN and a colleague, both running Kenjaku on Windows, sent in a report with symptoms, a root
cause read in our own source, a measured control experiment, and a reproducer. Nothing here was found by
us noticing. It is worth saying plainly, because the failure mode was designed to be unnoticeable — and
because the one number that turned out to matter most was measured on their machines, not ours.

### Under the hood

- **Nothing was removed, so nothing looked like a regression.** Before the live vault watcher existed, the
  server exited on its own once there was nothing left to do. Adding liveness gave the event loop a reason
  to stay alive forever — so an *implicit* shutdown became a leak, with no line of code deleted and no test
  turning red. Both servers now exit explicitly on stdin EOF, from one shared module: `local-mirror` keeps
  saying *what* to release, and no longer decides *when*.
- **The control experiment is what made the diagnosis airtight**, and it also names the cause of the whole
  class. Both servers time out under the same conditions, yet all 21 orphans observed in one day were the
  vault server and **zero** were `local-mirror`. `local-mirror` had a test for its own death; the vault
  server had none. Every test it did have exercised its *answers*. That test now exists, spawns the real
  process, and runs on every CI cell including the Windows ones.
- **We repeated the report's mechanism, and measurement did not support it.** The report proposed that each
  survivor holds an exclusive lock on the index, so the next session contends for it and blows the client's
  30-second ceiling. Measured: the index runs in WAL mode, the connection is opened *before* any indexing,
  and a server starting against a genuinely held write lock still completes its handshake in **291 ms**.
  Two servers on the same vault both come up and both exit cleanly — which matters, because Claude Desktop
  and the CLI on the same brain is a supported case, and "protecting" the index would have broken it. The
  reading that fits the evidence: the orphans starve the machine, and what actually overruns the ceiling is
  what runs *before* our code does. Hence the second fix, which was filed as a mere aggravator and turned
  out to be the proximate cause.
- **A design was blocked on that, and is now affordable.** Reporting whether your brain is *working* — as
  opposed to how fresh its index is — should be measured live, not read from last session's cached verdict.
  It was priced out at a network round-trip per session start. At the direct call's cost it is about
  0.3 s, so it becomes a real option for a coming release rather than a trade nobody could take.
- **Line endings, fixed as a family rather than as a file.** The install script had learned this lesson
  years ago, alone, ten lines from the launchers that never got it. Every generated `.cmd` now goes through
  one function, with a test on the emitted *bytes* — and its mirror asserting the `.sh` side stays as it is,
  since a stray carriage return kills a shell script just as surely. A `.gitattributes` travels into every
  brain, because the brain commits its own launchers and a clone onto a second machine would otherwise
  quietly undo the fix with every test still green.
- **The test that runs the launcher caught something on its first run**, which is the argument for having
  it: the POSIX launcher was resolving its own path relative to wherever it was started from, while the
  Windows one was absolute. Both are anchored on the launcher's own folder now — the same assumption, in
  its last hiding place.
- **The wording review had one finding that was not wording.** The green start-up line reads the index file
  directly and never asks whether the server answers, so it could report a perfectly healthy index for a
  brain with no access to its vault. The phrasing change above is a mitigation; the cure is the liveness
  check named two points up. Saying which is which, in the release note, is the point.
- **One proposal was withdrawn because the owner challenged its premise and was right.** A failing
  self-check was going to be silenced as harmless. It is not: the failure wraps the whole detection, so
  when it fires nothing is reconciled and a missing skill or server stays missing — which is this very
  release's bug family. It keeps its warning, in words that say what it means for you, without the raw
  error text.

### Measured, not asserted

The files this release changed went through a mutation pass: code deliberately broken, one change at a
time, to check the tests notice. The launcher generator, the new runner-resolution module and the
start-up status line all end at **100 %**.

The pass earned its keep on code written an hour earlier. Two start-up requests had been turned into
inspectable values — except for their *options*, still assembled where no test could see them. Those
options were the load-bearing half: one of them is what lets a health warning outlive the check that
raised it. Fixed and pinned.

What remains uncovered in two probe files is older than this branch and is named rather than dressed up:
one of them is a top-level script with no test sibling, a shape this project diagnosed a while ago and has
not yet propagated the fix for. It is scheduled, not forgotten.

A published release is frozen, so these numbers stay true for this tag forever.

### Verification

CI green 7/7, including three Windows cells (Node 22, 24 and 26) where the launcher tests were checked to
have actually *run* rather than skipped — this project has twice paid for a test that ran nowhere. The two
reporters are asked to re-run their own reproducer on this tag, on the machines where it happened.
