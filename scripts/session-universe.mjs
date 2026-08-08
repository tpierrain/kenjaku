#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// session-universe.mjs — SessionStart universe reminder (ADR 0034 Step 4). On a
// real event (rung 3 of the determinism ladder, ADR 0009) it reads the universe
// state and, ONLY past the progressive-disclosure gate (>= 2 universes), surfaces
// which universe is active so the owner never silently searches the wrong scope.
//
// Below the gate it says nothing at all: a single-universe brain behaves exactly
// as today (progressive disclosure). The SURFACE is an additionalContext directive
// the agent relays in the chat (the only Desktop-visible channel).
//
// It also SELF-HEALS the pointer (universes v2, Step 0). Pointer and registry now
// travel together (both committed), so an ordinary rename/delete can no longer aim
// this machine at a universe that no longer exists; the repair stays as a fail-open
// net for a brain that arrives with the two out of step anyway (an old brain, a
// conflict resolved the wrong way) — which the engine would silently turn into
// "zero hits". The single write this hook can ever do is that repair, and it is
// always announced.
//
// Contract: quiet below the gate, fail-open (never throws, ALWAYS exits 0).
// Wired as a SessionStart hook (cf. .claude/settings.json). Hooks run in PARALLEL,
// not in the order they are declared, so this one holds itself back until the
// startup pull has landed — see the barrier in main() and startup-sync-gate.mjs.
// Cross-OS: pure Node.
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  isMultiverse,
  readRegistry,
  readActiveUniverse,
  healActiveUniversePointer,
  vaultRagDir,
} from "./lib/universes.mjs";
import {
  universeReminder,
  buildUniverseHookOutput,
  pointerHealNotice,
  profileCaptureOffer,
} from "./lib/universe-reminder.mjs";
import {
  readUniverseProfile,
  renderUniverseSynthesis,
  profileCaptureDeclined,
} from "./lib/universe-profile.mjs";
import {
  blockingSleep,
  hookSessionId,
  pullerWiredIn,
  readHookPayload,
  waitForStartupSync,
} from "./lib/startup-sync-gate.mjs";

/**
 * The profile of the universe actually in force, rendered as the SESSION-START
 * block — the identity line plus a pointer, never the note's body (F1). Null when
 * this universe has no profile yet, which is how the capture offer learns it may
 * fire. Injected fs and injected active-universe reader, so the choice of
 * rendering — the one edit that would put vault-only material back into every
 * screenshot — is pinned by a test instead of living in unreachable glue.
 */
export function readActiveProfileSynthesis(io, vaultDir, activeUniverse) {
  const universe = activeUniverse();
  const profile = readUniverseProfile(io, vaultDir, universe);
  return profile ? renderUniverseSynthesis(profile, { universe }) : null;
}

// Vault paths are built and compared in POSIX form so behaviour is identical
// across platforms (on Windows resolve() yields backslashes). Cf. file-back-note.
const toPosix = (p) => p.split("\\").join("/");

// Testable core: read the universe state (injected), build the reminder, emit it
// only past the gate. Fail-open — odd/missing state must never disturb session start.
export function sessionUniverseReminder({
  readState,
  dir,
  emit,
  healPointer = () => ({ healed: false }),
  readSynthesis = () => null,
  readDeclined = () => false,
}) {
  // Read in its OWN try: an unreadable profile must not cost the session its
  // universe reminder (and vice-versa). One broken part, one lost part.
  let synthesis = null;
  // An unreadable profile is NOT an absent one. Without this flag a broken file
  // would read as "no profile" and turn into an offer to write the page the owner
  // already has — every single session.
  let profileUnreadable = false;
  try {
    synthesis = readSynthesis(dir) ?? null;
  } catch {
    profileUnreadable = true; // fail-open; the profile is a convenience, never a blocker.
  }

  let reported = false;
  let multiverse = false;
  try {
    // Self-heal FIRST, so the reminder below describes the repaired state and not
    // the ghost scope this machine woke up in.
    const heal = pointerHealNotice(healPointer(dir));
    if (heal) emit(heal);

    const { registry, active } = readState(dir);
    // The registry is also what decides which VOCABULARY the offer may use: only
    // this hook has read it, and counting universes is not the LLM's job (ADR 0009).
    multiverse = isMultiverse(registry);
    const nudge = universeReminder({ registry, active });
    if (nudge) {
      emit(nudge);
      reported = true;
    }
  } catch {
    // swallow — fail-open; a state hiccup must never break session start.
  }

  let offer = null;
  try {
    if (!profileUnreadable) {
      offer = profileCaptureOffer({
        hasProfile: synthesis !== null,
        declined: readDeclined(dir),
        multiverse,
      });
    }
  } catch {
    // swallow — an unreadable refusal marker must not cost the session its start.
  }
  // PRESENCE and PAYLOAD are two questions (F1). The offer above needed to know
  // whether a profile exists — on a lone-universe brain especially, since that is
  // the backfill case. What gets INJECTED is a different matter: below the gate
  // there is nothing to disambiguate, so nothing rides the session at all. And if
  // the count could not be read, we inject nothing either: a surface echoed
  // verbatim into every screenshot fails closed, never open.
  return { reported, synthesis: multiverse ? synthesis : null, offer };
}

// ── main: wire the real I/O seams (deterministic glue, not unit-tested) ───────
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const io = {
    existsSync,
    readFileSync: (p) => readFileSync(p, "utf-8"),
    writeFileSync,
    mkdirSync,
  };
  const brainDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const vaultDir = `${toPosix(brainDir)}/vault`;
  const lines = [];

  // WAIT FOR THE PULL BEFORE READING A SINGLE BYTE OF UNIVERSE STATE. SessionStart
  // hooks run in parallel and the startup pull lives in session-status.mjs, so this
  // hook — a handful of file reads — normally wins that race. It would then announce
  // the universe this machine went to sleep in, and inject THAT sphere's profile,
  // while the pointer arriving milliseconds later scopes every search of the session
  // to the other one: the context of one sphere, the retrieval of another.
  // Fail-open on every branch (no puller wired, no session id, a pull that never
  // lands): we read what is on disk, exactly as the brain did before this barrier.
  waitForStartupSync({
    repo: brainDir,
    sessionId: hookSessionId(readHookPayload()),
    io,
    now: Date.now,
    sleep: blockingSleep,
    pullerWired: pullerWiredIn({ repo: brainDir, io }),
  });

  const { synthesis, offer } = sessionUniverseReminder({
    dir: vaultRagDir(brainDir),
    // The profile of the universe actually in force. Read through
    // readActiveUniverse, which VALIDATES against the registry, so a machine whose
    // pointer is a ghost injects the default universe's profile — no dependency on
    // whether the repair below has run yet.
    readSynthesis: (dir) =>
      readActiveProfileSynthesis(io, vaultDir, () => readActiveUniverse(io, dir)),
    // A refusal is remembered PER UNIVERSE: saying no to describing Acme must not
    // silence the question for a universe created later, which is a different world.
    readDeclined: (dir) => profileCaptureDeclined(io, dir, readActiveUniverse(io, dir)),
    // The only write this hook performs: repairing a pointer left aimed at a
    // universe that is gone. A healthy pointer is never rewritten.
    healPointer: (dir) => healActiveUniversePointer(io, dir),
    readState: (dir) => ({
      registry: readRegistry(io, dir),
      active: readActiveUniverse(io, dir),
    }),
    emit: (msg) => lines.push(msg),
  });

  const output = buildUniverseHookOutput({ nudge: lines.join(" ") || null, synthesis, offer });
  if (output) {
    // additionalContext is the ONLY Desktop-visible channel (chat) — see buildUniverseHookOutput.
    process.stdout.write(JSON.stringify(output) + "\n");
  }
  process.exit(0); // fail-open: ALWAYS exit 0, never block session start
}
