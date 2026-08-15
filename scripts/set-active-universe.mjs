#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// set-active-universe.mjs — the deterministic core of the `/switch` skill
// (ADR 0034). Reads/writes the per-machine active-universe pointer and the
// committed registry of created universes under <brain>/.vault-rag/.
//
//   node scripts/set-active-universe.mjs <name>            # switch (fast path)
//   node scripts/set-active-universe.mjs create <name>     # create-and-switch
//   node scripts/set-active-universe.mjs list | current    # inspect
//
// All logic + tests live in scripts/lib/universes.mjs (+ universe-persist.mjs
// for the commit+push of the written pointer); this file only wires the real fs
// and git and prints the result. Natural-language "create a universe X" routes
// here too, so there is ONE canonical, deterministic surface (ADR 0009).
// ─────────────────────────────────────────────────────────────────────────────
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
} from "node:fs";
import { vaultRagDir } from "./lib/universes.mjs";
import { runSwitchCliPersisted } from "./lib/universe-persist.mjs";
import { isEntrypoint } from "./lib/entrypoint.mjs";
import { buildGit, repoRoot } from "./auto-commit.mjs";
import { realSleep } from "./auto-push.mjs";

// The fs surface universes.mjs expects — readFileSync always as UTF-8 text.
export const realIo = {
  existsSync,
  readFileSync: (p) => readFileSync(p, "utf-8"),
  writeFileSync,
  mkdirSync,
};

if (isEntrypoint(import.meta.url, process.argv[1])) {
  // Persisted variant (issue #69): a pointer write commits + pushes itself —
  // written through Bash, it is invisible to the PostToolUse/Stop hook net.
  const { code, message } = runSwitchCliPersisted(realIo, vaultRagDir(), process.argv.slice(2), {
    git: buildGit(repoRoot(import.meta.url)),
    sleep: realSleep,
  });
  console.log(message);
  process.exit(code);
}
