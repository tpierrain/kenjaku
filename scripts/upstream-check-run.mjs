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
// session start. (probeUpstream swallows its own failures, so there is nothing to
// catch here — a crashed probe leaves the previous verdict standing.)
// ─────────────────────────────────────────────────────────────────────────────

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { runAsEntrypoint } from "./lib/entrypoint.mjs";
import { probeUpstream } from "./lib/upstream-cache.mjs";

// The brain this probe runs against: the `--brainDir` flag when one is given WITH
// a value, otherwise the folder the script sits in. A trailing `--brainDir` with
// nothing after it falls back rather than probing `undefined`, which would write
// the verdict cache to a garbage path.
export function resolveBrainDir(argv, fallback) {
  const flag = argv.indexOf("--brainDir");
  return flag !== -1 && argv[flag + 1] ? argv[flag + 1] : fallback;
}

export const realUpstreamCheckDeps = {
  probe: probeUpstream,
  defaultBrainDir: () => resolve(dirname(fileURLToPath(import.meta.url)), ".."),
};

// Always 0 — see the header. Awaits the probe so the process cannot exit
// mid-write and leave the next session start reading a stale verdict.
export async function runUpstreamCheck(argv, deps = realUpstreamCheckDeps) {
  await deps.probe({ brainDir: resolveBrainDir(argv, deps.defaultBrainDir()) });
  return 0;
}

runAsEntrypoint(import.meta.url, process.argv, runUpstreamCheck);
