#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// upstream-check-run.mjs — the DETACHED upstream child (F3's sibling). Spawned by
// session-status.mjs at SessionStart when the verdict on disk is missing, stale or
// about an engine this brain no longer runs. It asks upstream once (a read-only
// `git ls-remote`, no clone, no auth) and writes the verdict the NEXT session start
// reads in a single file read — so session start never waits on a network call.
//
// Same shape and the same reason as health-probe-run.mjs (ADR 0028). All the logic
// lives in `lib/upstream-cache.mjs`; this file is the entry wiring, and it exits 0
// whatever happens: a background probe that fails must be silent, not a broken
// session start.
// ─────────────────────────────────────────────────────────────────────────────

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { isEntrypoint } from "./lib/entrypoint.mjs";
import { probeUpstream } from "./lib/upstream-cache.mjs";

if (isEntrypoint(import.meta.url, process.argv[1])) {
  const flag = process.argv.indexOf("--brainDir");
  const brainDir =
    flag !== -1 && process.argv[flag + 1]
      ? process.argv[flag + 1]
      : resolve(dirname(fileURLToPath(import.meta.url)), "..");
  await probeUpstream({ brainDir });
  process.exit(0);
}
