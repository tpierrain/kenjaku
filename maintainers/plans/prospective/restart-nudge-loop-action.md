<!-- ════════════════════════════════════════════════════════════════════════ -->
<!-- THE canonical plan for issue #90 — the restart nudge that cannot be     -->
<!-- obeyed out of. Opened 2026-09-07 at the owner's ask, from his own real  -->
<!-- brain. The DETAIL lives in the issue and is deliberately NOT copied     -->
<!-- here: symptom, mechanism, evidence and three candidate directions are   -->
<!-- all written there. This file owns only what the issue cannot hold —     -->
<!-- decisions taken, what is done, and where to resume.                     -->
<!-- ════════════════════════════════════════════════════════════════════════ -->

# Action plan — the restart nudge loops forever, and obeying it is what keeps it alive

**The issue, and the single source for the analysis:**
[#90](https://github.com/tpierrain/kenjaku/issues/90) — written from the owner's real brain,
engine v5.1.0, macOS, Claude Desktop.

**In one line**: the nudge tells the owner to quit Claude and come back to **the same conversation**;
resuming a conversation runs no `SessionStart`, and `SessionStart` is the only place that erases the
marker. So the instruction guarantees its own repetition, on every prompt, unbounded.

## 📍 STATE — the only perishable block in this file · opened 2026-09-07

- 🔥 **THIS IS THE ACTIVE PLAN, and the owner is BLOCKED BY IT in real use** _(2026-09-07: "j'ai un
  mini bug qui est très pénible à fixer … on fait le bug fix ASAP")_. Speed matters more here than on
  anything else open.
- **The branch is `fix/restart-nudge-escape-hatch`**, off `main`, pushed. It carries step 1 only.
- ✅ **THE QUESTION IS ANSWERED — the owner chose direction 1** _(2026-09-07)_: the search server
  leaves a timestamped trace when it is respawned, and a trace newer than the marker means the
  restart really happened, so the nudge falls silent on its own. He chose it **knowing the unknown
  named with it** (below), which is why step 2 opens with measuring, not with wiring.
- **Next:** step 2a, the instrument. Nothing decides on the boot trace until a real restart on a real
  machine has been watched writing it. **Do not skip to 2b.**
- ⚠️ **PAUSED, and it LOST THE DOOR** _(2026-09-07)_: [#92](https://github.com/tpierrain/kenjaku/issues/92)
  took the active slot the same day, because it bills real money to real owners every day it is not
  shipped. This plan is intact and resumes at 2a; its branch is pushed and green. Nothing here was
  abandoned, it was outranked.
- **Decided while doing step 1** _(2026-09-07)_: the escape hatch is **conditional in prose**, not
  gated on a delivery counter. "Has the owner already restarted?" is answered by the conversation,
  which the model reads and `.cache/` cannot; a counter would call five messages typed *before* a
  legitimate restart a repeat, and send that owner back to work on the old engine. The emitted-length
  ceiling was raised **360 → 440** once, deliberately, to pay for those sentences.
- 🙋 **THE ONE QUESTION, and it is the owner's** — the issue lists three directions and deliberately
  decides none:
  1. **Give the marker an identity** the app restart necessarily invalidates (a boot marker the MCP
     server writes when it is respawned; newer than `restart-needed` → the restart happened → clear
     and stay silent). The only one that actually *fixes* the loop.
  2. **Let the repeating surface disarm** (`prompt-restart-nudge.mjs` is the only code that runs on
     every message).
  3. **State the escape hatch in the directive itself** after the first repeat.
  - **Recommendation: 1 as the fix, 3 as the belt** — 3 is minutes of work and rescues an owner who is
    stuck *today*, whatever 1 ends up being; 1 is the only one that makes the nudge honest. 2 is a
    mitigation that leaves the false alarm in place.
- **Blocked on:** nothing technical. A session may work 3 test-first immediately; 1 wants his call
  first because it touches what the MCP server writes.
- **A session may, alone:** work test-first on a branch off `main`, push every green commit and read
  its CI. **Not:** touch either of his two real brains, tag, or push to `main`.

## Tracking

- [x] **1. The escape hatch in the directive** _(the belt — smallest thing that unblocks a human)_
      _(2026-09-07 · `596fa20`)_. The message now names the manual way out (`.cache/restart-needed`),
      **after** the restart instruction and conditioned on the owner having already restarted — so it
      never silences a nudge that is still true. Shipped as written, with two departures from the line
      above, both recorded in STATE: no delivery counter (the condition is prose), and the "one NEW
      conversation also clears it" half was dropped — the same message forbids opening a new
      conversation two sentences earlier, and one paragraph cannot say both.
- [ ] **2. The real fix — the nudge falls silent once the restart has really happened**
      _(direction 1, the owner's call, 2026-09-07)_.
  - [ ] **2a. The instrument, and it decides NOTHING.** The search server stamps a boot trace under
        `.cache/` when it is respawned. Write-only: no verdict reads it yet, so shipping it cannot
        silence a nudge that is still true. Then a real restart is watched, on a real machine, and
        the two timestamps are read back.
  - [ ] **2b. The verdict, wired only on what 2a measured.** A boot trace newer than the marker means
        the app really restarted → stay silent. Fail towards the nudge: an unreadable or missing
        trace keeps today's behaviour exactly.
  - 🙋 **The unknown 2a exists to answer, and it is the whole reason 2b waits**: does coming back to a
        conversation **without quitting the app** also respawn the search server? If it does, the
        trace would say "restarted" when nothing restarted, and 2b would silence a true nudge — the
        false alarm traded for a silent one, which is the worse of the two.
  - **Why the field evidence already points this way**: #90 shows a full quit + reopen where no
        SessionStart ran, in a conversation whose search tools still worked. Something was respawned
        that the session-start path never saw. That gap is exactly what the trace makes visible.
- [ ] **3. The regression test that would have caught this**: a resumed conversation, marker present,
      no `SessionStart` — the nudge must not repeat forever.
- [ ] **4. Close [#90](https://github.com/tpierrain/kenjaku/issues/90) only when a real brain has
      stopped looping**, not on the merge. The issue's own evidence is field evidence.
