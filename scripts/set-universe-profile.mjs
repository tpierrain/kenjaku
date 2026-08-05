#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// set-universe-profile.mjs — run FROM the brain folder to record what a universe
// IS (universes v2, decision D1): an employer, a client, a personal sphere, who
// is in it, which accounts its connectors use.
//
// The `/switch` skill gathers the answers conversationally; THIS is what writes
// them, so the note's shape and the wording of what happened stay deterministic
// (ADR 0009) instead of being improvised per session. It never overwrites an
// existing profile: that page belongs to its owner, who edits it in Obsidian.
//
//   echo '<json answers>' | node scripts/set-universe-profile.mjs
//   echo '<json answers>' | node scripts/set-universe-profile.mjs --no-reindex
//   node scripts/set-universe-profile.mjs --decline     # never ask me again
//   node scripts/set-universe-profile.mjs --digest      # the working context, after a switch
//
// Answers: { universe?, displayName, kind?, role?, period?, about?, people?[],
// topics?[], connectors?[{tool, account}] }. Without `universe`, the ACTIVE one is used.
// Exits 0 when written (or when the refusal is recorded), 1 when the profile
// already exists or on error.
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

import {
  writeUniverseProfile,
  declineProfileCapture,
  profileCaptureDeclined,
  readUniverseProfile,
  renderUniverseDigest,
  profileConnectorEntries,
  universeProfilePath,
} from "./lib/universe-profile.mjs";
import { checkSlackAccount } from "./lib/connector-accounts.mjs";
import { readActiveUniverse, vaultRagDir, readRegistry, isMultiverse } from "./lib/universes.mjs";
import { profileCaptureOffer } from "./lib/universe-reminder.mjs";
import { needsShell } from "./lib/spawn-shell.mjs";
import { isEntrypoint } from "./lib/entrypoint.mjs";

// Windows hands cwd() back as C:\brain, and a backslash survives into every path
// built from it — which fs tolerates but string comparisons do not. Normalising
// the ROOT once means every path below is POSIX by construction. Cf. installer
// toPosix / document-scanner / universes.mjs.
const toPosix = (p) => p.split("\\").join("/");

// Real wiring — every side effect behind a port so the flow stays unit-testable.
// The fs surface the cores expect — readFileSync always as UTF-8 TEXT (the raw
// Buffer form is what made the pointer read throw in the field).
const realIo = {
  existsSync,
  readFileSync: (p) => readFileSync(p, "utf-8"),
  writeFileSync,
  mkdirSync,
};

export const realProfileDeps = {
  cwd: () => process.cwd(),
  today: () => new Date().toISOString().slice(0, 10),
  activeUniverse: () => readActiveUniverse(realIo, vaultRagDir(process.cwd())),
  readInput: () => readFileSync(0, "utf8"),
  io: realIo,
  spawnSync,
  platform: process.platform,
  log: (...a) => console.log(...a),
  error: (...a) => console.error(...a),
};

/** Reads the answers, writes the profile note. Returns the process exit code. */
export function runSetUniverseProfile(argv, deps = realProfileDeps) {
  const root = toPosix(deps.cwd());

  // The refusal path reads NO stdin: it is answered by a person saying "no
  // thanks", and demanding a JSON payload to decline would be its own small
  // insult. Handled before anything else for exactly that reason.
  if (argv.includes("--decline")) {
    declineProfileCapture(deps.io, vaultRagDir(root), deps.activeUniverse());
    deps.log("✓ Noted — I will not ask about your context again.");
    return 0;
  }

  // Re-read the working context, for a session that has just switched sphere: the
  // digest injected at session start describes the universe it STARTED in, and a
  // stale profile is worse than none (it names the wrong people, the wrong tools).
  if (argv.includes("--digest")) {
    const dir = vaultRagDir(root);
    const universe = deps.activeUniverse();
    const profile = readUniverseProfile(deps.io, `${root}/vault`, universe);
    if (profile) {
      deps.log(`[working context]\n${renderUniverseDigest(profile)}`);
      return 0;
    }
    // No profile HERE: landing in a sphere the brain knows nothing about is the
    // moment to ask, because you are standing in it. Without this, a universe you
    // rarely start a session in is never asked about at all — the exact case of a
    // brain that grew universes before profiles existed.
    const offer = profileCaptureOffer({
      hasProfile: false,
      declined: profileCaptureDeclined(deps.io, dir, universe),
      multiverse: isMultiverse(readRegistry(deps.io, dir)),
    });
    // Two different markers, because the two blocks want opposite things: one is
    // background to use silently, the other is a question to actually ask.
    if (offer) deps.log(`[ask the owner]\n${offer}`);
    return 0;
  }

  // A DECLARED connector account is not a VERIFIED one (14.6). Only the model can
  // ask Slack which workspace it is on, so it observes and hands the answer here:
  // the comparison, and the wording of the verdict, stay deterministic (ADR 0009).
  const checkFlag = argv.indexOf("--check-slack");
  if (checkFlag !== -1) {
    const observed = argv[checkFlag + 1];
    const universe = deps.activeUniverse();
    const profile = readUniverseProfile(deps.io, `${root}/vault`, universe);
    const verdict = checkSlackAccount({
      entries: profile === null ? null : profileConnectorEntries(profile),
      observed,
      profilePath: `vault/${universeProfilePath(universe)}`,
    });
    if (verdict.status === "diverging") {
      deps.error(`✗ ${verdict.line}`);
      return 1;
    }
    // Exit 0 on "matching" AND on "could not find out", deliberately (14.2's call):
    // a non-zero would make the skill report a failed check where the honest
    // sentence is "I could not find out". The MARKER carries the difference.
    deps.log(`${verdict.status === "matching" ? "✓" : "?"} ${verdict.line}`);
    return 0;
  }

  let answers;
  try {
    answers = JSON.parse(deps.readInput());
  } catch (err) {
    deps.error(`✗ Invalid JSON answers on stdin: ${err.message}`);
    return 1;
  }

  const universe = answers.universe ?? deps.activeUniverse();
  const vaultDir = `${root}/vault`;
  const res = writeUniverseProfile(deps.io, vaultDir, {
    ...answers,
    universe,
    today: deps.today(),
  });

  if (!res.ok) {
    deps.error(
      `✗ vault/${res.path} already exists — a profile is never overwritten. ` +
        `Edit that page directly (it is a normal note, editable in Obsidian).`,
    );
    return 1;
  }

  deps.log(`✓ Profile written: vault/${res.path}`);
  if (argv.includes("--no-reindex")) return 0;

  // A profile the index has not seen is a page the brain cannot answer FROM —
  // most of the point of storing it as a note rather than as registry metadata.
  const NPM = deps.platform === "win32" ? "npm.cmd" : "npm";
  const r = deps.spawnSync(NPM, ["run", "--silent", "reindex"], {
    cwd: `${root}/rag`,
    stdio: "inherit",
    // npm.cmd needs a shell since Node >= 18.20 (CVE-2024-27980) or EINVAL; no-op POSIX (ADR 0031).
    shell: needsShell(NPM, deps.platform),
  });
  if (r.status !== 0) {
    deps.error("✗ re-index failed — run it by hand:  cd rag && npm run reindex");
    return 1;
  }
  deps.log("✓ RAG re-indexed — the profile is searchable.");
  return 0;
}

if (isEntrypoint(import.meta.url, process.argv[1])) {
  process.exit(runSetUniverseProfile(process.argv.slice(2)));
}
