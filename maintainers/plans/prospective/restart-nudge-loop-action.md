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
- **The branch is `fix/restart-nudge-escape-hatch`**, off `main`, pushed. It carries step 1 and the
  **instrument half of 2a** (`d87a7f9`), both green.
- ✅ **THE QUESTION IS ANSWERED — the owner chose direction 1** _(2026-09-07)_: the search server
  leaves a timestamped trace when it is respawned, and a trace newer than the marker means the
  restart really happened, so the nudge falls silent on its own. He chose it **knowing the unknown
  named with it** (below), which is why step 2 opens with measuring, not with wiring.
- ✅ **2a IS DONE — the measurement ran, on 2026-09-08 evening, and it answered NO** _(the three
  readings and their verdict are at the foot of 2a-ii)_. Coming back to a conversation without
  quitting **does** respawn a server and **does** stamp a fresh trace, so the trace as shipped is not
  a restart detector and **2b may not be wired on `bootedAt`/`pid` alone**. The same measurement
  handed over the fix: the **Claude app ancestor** (pid + start time) is what a new conversation
  cannot change, and it is reachable by walking up from `process.ppid`.
- **Next: 2b, and it opens with a QUESTION, not with code** _(2026-09-09)_. Reading 3 also showed
  that a new conversation runs the new engine already — which would make the nudge's own instruction
  the harder of two ways out, and could shrink the whole fix to **rewording the nudge** instead of
  teaching it to detect a restart. Settle that first (it is written at the foot of 2a-ii), then
  choose: reword, or stamp the app ancestor. Both are test-first from `main`'s discipline; neither
  needs the owner's hands again, and the throwaway brain at `~/kenjaku-throwaway` is still installed
  if another measurement is wanted.
- 🧪 **HOW 2a-ii will be measured — the owner chose a THROWAWAY brain** _(2026-09-08)_, installed
  from this branch rather than touching either of his two real brains. He gave the go-ahead and it is
  installed and **verified green** at **`~/kenjaku-throwaway`** _(2026-09-08)_ — fully-local
  `in-process` embedder, no key, no connectors, demo notes kept. It is disposable by construction:
  `rm -rf` when the measurement is read, and nothing in it is ever merged back. The first install run
  died on a **network cut** mid-download of the model weights and the installer refused to declare
  success; `scripts/verify-rag.mjs` from the brain folder finished the job (9 notes indexed, canary
  found). **Baseline already stamped**: `rag/.cache/engine-boot.json` = `2026-09-08T18:11:25.429Z`,
  pid **42352**, written by the post-flight's real spawned server — the instrument works outside its
  own test.
- 🔭 **THE SUBJECT IS CLAUDE DESKTOP, THE OBSERVER IS A CLI WINDOW ON THE LAUNCHER** _(2026-09-08,
  the owner's refinement, and it is better than the protocol as first written)_. He uses his brains
  from **Desktop**, which is also where #90 was lived, so Desktop is what must be restarted. A CLI
  session rooted in the **launcher** is a different working directory, so it spawns no server for the
  throwaway brain and **cannot pollute the trace** — it just reads the file between his steps. He
  therefore types nothing technical, and no window of his has to be closed but Desktop itself.
- ▶️ **THE DOOR IS BACK — and this plan holds the active slot again** _(2026-09-07 night)_.
  [#92](https://github.com/tpierrain/kenjaku/issues/92) took the slot the same day, because it billed
  real money to real owners every day it was not shipped; it shipped as
  [v5.1.1](https://github.com/tpierrain/kenjaku/releases/tag/v5.1.1), and `ACTIVE.md` on `main` now
  points here. Nothing here was abandoned, it was outranked, and the outranking is over.
- 🌿 **This branch carries the live plan, and `main` carries a stale copy of it.** `main`'s door says
  so out loud. It resolves the day this branch merges; until then, **read and write the plan here**.
  `main` was merged in on 2026-09-07 night so the branch is current and stays mergeable.
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
    - [x] **2a-i. The instrument itself** _(2026-09-08 · `d87a7f9`)_. `rag/src/lib/boot-trace.ts`
          stamps `rag/.cache/engine-boot.json` (an ISO instant **and the pid**) when the server
          starts serving — never in CLI mode, because a reindex is not an app start and
          `update-engine`, the installer and a refresh all take that path. Proven by spawning the
          REAL server and reading the trace back (entry-point rule), not through a seam. The pid is
          load-bearing: it is what separates "respawned" from "rewritten by the same process", which
          IS the unknown below.
    - [x] **2a-ii. The watched restart** _(2026-09-08 evening · measured; the verdict is at the foot
          of this step)_. Run on the throwaway brain, in **Claude Desktop**: the owner acted, and a
          launcher-rooted CLI window read `rag/.cache/engine-boot.json` between his steps. (1) A **new** Desktop conversation rooted on `~/kenjaku-throwaway`, one
          message typed → read the pid; (2) **fully quit Desktop** (⌘Q, not the window), reopen, come
          back to **that same conversation**, type a message → read again; (3) then, WITHOUT quitting,
          a **new** conversation on the same brain, one message → read a third time. Reading 2 with a
          **new pid** is what makes 2b possible at all; reading 3 with a new pid too is the answer
          that would make a trace-based verdict UNSAFE. **Both landed, and reading 3 is the unsafe
          one** — see the verdict below.
          - Reading 0 (post-flight, install): `18:11:25.429Z` · pid `42352`.
          - Reading 1 (a new Desktop conversation on the throwaway brain): `18:14:55.473Z` ·
            pid `42711`, **alive** — so opening a conversation spawns a server of its own, and
            the post-flight's was not reused. This is the reference the next two compare against.
          - Reading 2 (⌘Q on Desktop, reopen, **same** conversation): `18:16:47.252Z` · pid `43079`,
            and **42711 is dead**. ✅ **A real app restart does respawn the server and does stamp a
            new trace** — the thing 2b needs in order to exist at all.
          - 🔎 **Free evidence taken at reading 2 — the ancestry.** The server's process chain is
            `Claude.app` (pid `42902`, started `18:16:39Z`) → `disclaimer` → `claude` (the
            per-conversation process) → `tsx` → the server. So the **app's own process** is visible
            from the server, and it is the one thing a new conversation cannot change. If reading 3
            shows a fresh server pid under that **same** app pid, the trace can still tell the two
            apart — by stamping the app ancestor's identity, not only its own pid.
          - Reading 3 (**no quit**, a brand-new Desktop conversation on the same brain):
            `18:20:06.384Z` · pid `43452` — a fresh trace, under the **same** app pid `42902`
            (started `18:16:39Z`, unchanged). And `43079`, reading 2's server, is **still alive**:
            a new conversation does not replace the previous server, it **adds** one, and the last
            one to boot is the one that owns the file.
          - 🛑 **VERDICT — the trace as it stands is NOT a restart detector**, and 2b may not be wired
            on it as written. A new conversation stamps a trace indistinguishable from a real restart,
            so a verdict reading only `bootedAt`/`pid` would call "restarted" something that never
            restarted. This is the unsafe answer the step existed to catch, and it was worth catching.
          - ✅ **AND THE MEASUREMENT ALREADY CARRIES ITS OWN FIX.** Across the three readings the
            **app process** is the discriminator, and the only one: it changed at reading 2 (a real
            ⌘Q → new app pid) and held at reading 3 (new conversation → same app pid `42902`). So the
            trace must stamp **the Claude app ancestor's identity** (its pid *and* its start time —
            a pid alone is recycled), walking up from `process.ppid` past the per-conversation
            `claude` process. "The app that spawned me is not the app that was running when the marker
            was written" is a true restart, and nothing else is.
          - 🔔 **A second finding, and it may matter more than the fix**: a **new conversation spawns
            its own server**, i.e. it already runs the NEW engine code without quitting anything. If
            that holds, the nudge's own instruction ("quit the app and come back to this
            conversation") is not merely self-perpetuating, it is **the harder of two ways out** —
            and opening a new conversation also runs `SessionStart`, which is what clears the marker.
            To be checked before 2b is designed: it could shrink the fix to rewording the nudge.
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
