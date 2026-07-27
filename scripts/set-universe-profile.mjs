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
import { join } from "node:path";
import { spawnSync } from "node:child_process";

import {
  writeUniverseProfile,
  declineProfileCapture,
  readUniverseProfile,
  renderUniverseDigest,
} from "./lib/universe-profile.mjs";
import { readActiveUniverse, vaultRagDir } from "./lib/universes.mjs";
import { needsShell } from "./lib/spawn-shell.mjs";
import { isEntrypoint } from "./lib/entrypoint.mjs";

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
  // The refusal path reads NO stdin: it is answered by a person saying "no
  // thanks", and demanding a JSON payload to decline would be its own small
  // insult. Handled before anything else for exactly that reason.
  if (argv.includes("--decline")) {
    declineProfileCapture(deps.io, vaultRagDir(deps.cwd()), deps.activeUniverse());
    deps.log("✓ Noted — I will not ask about your context again.");
    return 0;
  }

  // Re-read the working context, for a session that has just switched sphere: the
  // digest injected at session start describes the universe it STARTED in, and a
  // stale profile is worse than none (it names the wrong people, the wrong tools).
  if (argv.includes("--digest")) {
    const profile = readUniverseProfile(deps.io, `${deps.cwd()}/vault`, deps.activeUniverse());
    if (profile) deps.log(renderUniverseDigest(profile));
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
  const vaultDir = `${deps.cwd()}/vault`;
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
    cwd: join(deps.cwd(), "rag"),
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
