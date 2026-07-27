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
// It also SELF-HEALS the pointer (universes v2, Step 0): the pointer is per-machine
// and gitignored while the registry is committed, so pulling a rename/delete made on
// another machine leaves this one aimed at a universe that no longer exists — which
// the engine would silently turn into "zero hits". The single write this hook can
// ever do is that repair, and it is always announced.
//
// Contract: quiet below the gate, fail-open (never throws, ALWAYS exits 0).
// Wired as a SessionStart hook AFTER session-self-heal.mjs (cf. .claude/settings.json).
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
  renderUniverseDigest,
  profileCaptureDeclined,
} from "./lib/universe-profile.mjs";

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
  readDigest = () => null,
  readDeclined = () => false,
}) {
  // Read in its OWN try: an unreadable profile must not cost the session its
  // universe reminder (and vice-versa). One broken part, one lost part.
  let digest = null;
  // An unreadable profile is NOT an absent one. Without this flag a broken file
  // would read as "no profile" and turn into an offer to write the page the owner
  // already has — every single session.
  let profileUnreadable = false;
  try {
    digest = readDigest(dir) ?? null;
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
        hasProfile: digest !== null,
        declined: readDeclined(dir),
        multiverse,
      });
    }
  } catch {
    // swallow — an unreadable refusal marker must not cost the session its start.
  }
  return { reported, digest, offer };
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

  const { digest, offer } = sessionUniverseReminder({
    dir: vaultRagDir(brainDir),
    // The profile of the universe actually in force. Read through
    // readActiveUniverse, which VALIDATES against the registry, so a machine whose
    // pointer is a ghost injects the default universe's profile — no dependency on
    // whether the repair below has run yet.
    readDigest: (dir) => {
      const profile = readUniverseProfile(io, vaultDir, readActiveUniverse(io, dir));
      return profile ? renderUniverseDigest(profile) : null;
    },
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

  const output = buildUniverseHookOutput({ nudge: lines.join(" ") || null, digest, offer });
  if (output) {
    // additionalContext is the ONLY Desktop-visible channel (chat) — see buildUniverseHookOutput.
    process.stdout.write(JSON.stringify(output) + "\n");
  }
  process.exit(0); // fail-open: ALWAYS exit 0, never block session start
}
