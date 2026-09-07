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
- **Next:** the owner answers **the one question** below. Until he does, nothing more can be built:
  step 2 IS the question, and step 3's regression test can only pass once step 2's mechanism exists.
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
- [ ] **2. The real fix — a marker with an identity** _(pending the owner's call, see STATE)_.
- [ ] **3. The regression test that would have caught this**: a resumed conversation, marker present,
      no `SessionStart` — the nudge must not repeat forever.
- [ ] **4. Close [#90](https://github.com/tpierrain/kenjaku/issues/90) only when a real brain has
      stopped looping**, not on the merge. The issue's own evidence is field evidence.
