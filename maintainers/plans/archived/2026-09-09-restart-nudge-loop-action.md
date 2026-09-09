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

## ✅ SHIPPED — [v5.1.2](https://github.com/tpierrain/kenjaku/releases/tag/v5.1.2), 2026-09-09

Merged as [#94](https://github.com/tpierrain/kenjaku/pull/94) (`5b16101`), tagged
`v5.1.2 — The One Where the Restart Nudge Finally Shuts Up`, note published. The field rehearsal in
Claude Desktop passed (the four readings below), and the update-path rehearsal (§10ter) ran on copies
of two real brains installed at **v3.4.0** and **v5.1.1**: both converged to v5.1.2, both reported
owner territory **byte-identical**. The QA brain was deleted at the owner's ask.

**Still owed, and it is the one thing this plan does not close:**
[#90](https://github.com/tpierrain/kenjaku/issues/90) stays open until the fix has run on a real
owner's brain. Its evidence is field evidence, and a rehearsal brain, however faithful, is not the
field.

## 📍 STATE (historical — the plan closed on 2026-09-09)

- 🔥 **THIS IS THE ACTIVE PLAN, and the owner is BLOCKED BY IT in real use** _(2026-09-07: "j'ai un
  mini bug qui est très pénible à fixer … on fait le bug fix ASAP")_. Speed matters more here than on
  anything else open.
- **The branch is `fix/restart-nudge-escape-hatch`**, off `main`, pushed, and it carries the whole
  fix in **PR [#94](https://github.com/tpierrain/kenjaku/pull/94)** — **no longer a draft since
  2026-09-09**, because the two things that kept it one are settled: the field rehearsal passed and
  the write-only instrument is gone.
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
- ✅ **2b'S QUESTION IS ANSWERED — the owner chose "teach the nudge to recognise a real restart"**
  _(2026-09-09)_, over the cheap reword. **Why the reword lost, and it is worth keeping**: telling
  the owner to open a NEW conversation does clear the marker by itself, but on Desktop a new
  conversation must be re-rooted on the brain folder, and that is the trap the install stub already
  shouts about. It would trade a nudge that loops for a brain that does not load. The wording
  therefore stays as it is, and the code learns to shut up.
- 🔎 **AND THE CHOSEN FIX IS SMALLER THAN THE ROUTE 2a TOOK — the marker stamps the app, and the
  search server is not involved at all** _(2026-09-09, decided while designing 2b)_. 2a's instrument
  asked the *search server* to leave a trace, then hoped a verdict could compare two files. But the
  hook that repeats the nudge (`prompt-restart-nudge.mjs`) runs inside the conversation process,
  whose ancestor **is** the Claude app — so it can read the app's identity **itself**, with no trace
  and no second file. So: `armRestartPending` records the app identity **into the marker** at the
  moment it arms, and `restartPendingOnDisk` compares it with today's. Different app → the restart
  really happened → silence. This also fixes the loop without any `SessionStart`, which is the whole
  point (#90: resuming a conversation runs none).
- ✅ **2b IS DONE AND GREEN** _(2026-09-09 · `2617505` the identity, `1bb815b` the wiring)_. The whole
  suite passes (3267 tests). A detail the real process table handed over while the tests were being
  written, and it nearly went the other way: the per-conversation process lives at
  `…/claude-code/<version>/claude.app/Contents/MacOS/claude`, which differs from the APP's path
  **only by case** — so the match is case-sensitive and additionally refuses anything under
  `/claude-code/`. Matching it would have called every new conversation a restart, which is exactly
  the silent failure 2a was run to avoid.
- ✅ **STEP 3 IS DONE TOO — the fix is complete, and it is code-green** _(2026-09-09)_: the loop's own
  sequence, replayed through the hook's entry function against a real brain folder.
- ✅ **THE REHEARSAL RAN, AND IT IS CONCLUSIVE** _(2026-09-09, the owner at the keyboard, on
  `~/kenjaku-qa`)_. The four readings, and they leave no other explanation:
  1. Armed from inside the Desktop conversation → the marker recorded app pid **`75093`**, started
     `Wed Sep 9 09:20:39 2026`. The script confirmed an app was named, so the verdict had something
     to compare.
  2. An ordinary message, no restart yet → **the nudge fired**, leading the reply. The
     counter-check: without it the rest would prove nothing.
  3. ⌘Q, reopen, back to **that same conversation** → **the nudge is silent**, and the reply is an
     ordinary one.
  4. Read from the launcher-rooted CLI: `75093` is **dead**, the app now running is **`97906`**
     (started `11:58:50`), and `.cache/restart-needed` is **gone from disk**.
  - 🔒 **And no `SessionStart` can be credited with it**: he returned to the SAME conversation, which
    runs none — that is #90's entire mechanism. The only code that could have erased that marker is
    the corrected `UserPromptSubmit` hook. The loop is dead at the exact spot it used to restart.
  - 🗑️ **2a's instrument is therefore removed** _(`7d8980b`)_: the fix that shipped never reads it,
    and a file every owner's server writes on every boot for no reader is dead weight. RAG suite
    green (539), scripts suite green (3268).
- **What is left, and it is a decision, not work** _(2026-09-09)_: the PR is out of draft and ready.
  A session may not merge it or tag — that is the owner's. **#90 itself stays open until the fix has
  run on one of his two REAL brains**, because its evidence is field evidence and `~/kenjaku-qa` is a
  rehearsal brain, however faithful.
- 🧹 **`~/kenjaku-qa` is still on disk, deliberately.** Disposable by construction and safe to remove
  once he wants it gone; it is not deleted by a session unasked.
  - It was installed fresh from this branch (`85e9b79`), fully-local `in-process` embedder,
    post-flight green. ⚠️ `~/kenjaku-throwaway` from 2026-09-08 lives on the **other** Mac, which is
    why a new one was built rather than reused — a lesson in itself for the next rehearsal.
  - 🔑 **The one thing to remember if this is ever replayed: the marker MUST be armed from inside the
    Desktop conversation**, never from a terminal. A terminal has no Claude app above it, so the
    marker records nobody, the verdict has nothing to compare, and the rehearsal proves nothing
    **while looking like a failure**. `~/kenjaku-qa/scripts/qa-arm-restart.mjs` (throwaway,
    brain-side only) arms it through the real `armRestartPending` and says out loud which of the two
    happened — it was checked from a terminal first, where it correctly refuses to claim an app.
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
- [x] **2. The real fix — the nudge falls silent once the restart has really happened**
      _(direction 1, the owner's call, 2026-09-07)_.
  - [x] **2a. The instrument, and it decided NOTHING** _(done 2026-09-08; the instrument itself was REMOVED on 2026-09-09 · `7d8980b`, once the fix it pointed to turned out not to need it)_. The search server stamps a boot trace under
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
  - [x] **2b. The verdict — the marker remembers which app armed it** _(the owner's call,
        2026-09-09)_. `armRestartPending` stamps the Claude app's identity into the marker; every
        reader compares it with the app running now. A **different** app is the only thing that means
        "the owner really restarted" → stay silent. **Fail towards the nudge, everywhere**: no
        identity in the marker, none resolvable now, an unparseable file, a platform where the app
        cannot be named — every one of those keeps today's behaviour exactly. The silent failure is
        the one that costs, and it is the one this arrangement makes unreachable.
    - [x] **2b-i. The pure decider** _(2026-09-09 · `2617505`)_. Given the identity the marker carries and the identity of the
          app running now, is the nudge still owed? Both halves compared, pid **and** start time (a
          pid alone is recycled), by string equality so nothing has to parse a date.
    - [x] **2b-ii. Reading the real ancestry** _(2026-09-09 · `2617505`)_. Walk up from `process.ppid` through the full process
          table (`ps -Ao pid=,ppid=,lstart=,command=`) and return the first ancestor that is the
          **app bundle** — matched on `Claude.app/Contents/MacOS/`, never on a command called
          `claude`, because the per-conversation CLI process is called exactly that and it changes on
          a new conversation. Null when nothing matches, which is every CLI session and every
          platform the match does not cover.
    - [x] **2b-iii. The wiring, at both ends** _(2026-09-09 · `1bb815b`)_. The three arming sites go through
          `armRestartPending` and the three readers through `restartPendingOnDisk`, so the change
          lands in one file for each. ⚠️ Only the **flag** half of the verdict may be neutralised:
          `gapNeeded` is a genuine, present convergence gap and a restart never invalidates it.
    - [x] **2b-iv. And the marker is erased once the verdict has said "restarted".** Otherwise every
          later prompt in that conversation pays a process-table read for an answer that cannot
          change. The prompt hook already writes (the arrivals stamp), so it is the one that clears.
  - 🗑️ **What becomes of 2a's instrument** _(`rag/src/lib/boot-trace.ts`, `d87a7f9`)_. The chosen fix
        does not read it, and nothing else does either. **Recommendation: remove it before this
        merges** — it made the measurement possible and it has been paid for, but shipping a file
        every owner's server writes on every boot, that no verdict consults, is dead weight in an
        engine. To settle at merge time, not now.
  - **Why the field evidence already points this way**: #90 shows a full quit + reopen where no
        SessionStart ran, in a conversation whose search tools still worked. Something was respawned
        that the session-start path never saw. That gap is exactly what the trace makes visible.
- [x] **3. The regression test that would have caught this** _(2026-09-09 · the lived sequence, through the hook's own entry function, on a real brain folder: marker armed, app restarted, no SessionStart, two prompts, silence)_: a resumed conversation, marker present,
      no `SessionStart` — the nudge must not repeat forever.
- [ ] **4. Close [#90](https://github.com/tpierrain/kenjaku/issues/90) only when a real brain has
      stopped looping**, not on the merge. The issue's own evidence is field evidence.
