#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// session-engine-divergence.mjs — SessionStart: where this brain stands relative
// to the engine that shipped it (plan S4-4).
//
// The field finding this closes: a file the engine holds back is announced only in
// an update report, i.e. only while an update runs. A brain frozen since install
// never sees one — so the freeze that most deserved to be spoken was the one that
// never was. This hook asks the same question at REST.
//
// Its own hook, deliberately NOT folded into the breakage banner: this is a
// legitimate steady state, not a fault, and `session-health.mjs` owns the alarm
// voice. See `engine-divergence-nudge.mjs` for the two rules that shape the prose.
//
// Contract: quiet unless there is something to say, fail-open (never throws, the
// hook ALWAYS exits 0). Cross-OS: pure Node, no spawn, no network.
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { readEngineDivergence } from "./lib/engine-base-fs.mjs";
import { runAsEntrypoint } from "./lib/entrypoint.mjs";
import { buildEngineDivergenceHookOutput, engineDivergenceNudge } from "./lib/engine-divergence-nudge.mjs";
import { installRef } from "./lib/engine-version.mjs";

// Testable core: both reads injected, so the brain root stays a string a test asserts
// on. Fail-open — `readEngineDivergence` is fail-soft about the MANIFEST only (its
// installed-files read sits outside that try), and a brain mid-install or mid-sync can
// hand us a directory that is not there yet.
export function sessionEngineDivergence({ brainDir, readDivergence, readRef, emit }) {
  try {
    const divergence = readDivergence(brainDir);
    // The version is only ever needed to phrase a sentence we may have no reason to
    // say, so the common case (nothing held back) costs one read instead of two.
    if (divergence.length === 0) return { reported: false };
    emit(engineDivergenceNudge({ divergence, ref: readRef(brainDir) }));
    return { reported: true };
  } catch {
    // swallow — fail-open; nothing about a divergence is worth a broken session start.
  }
  return { reported: false };
}

// The composition root: wires the real read-only seams. Exported so it is ordinary
// importable code rather than a body behind a guard, which is what the v4.8.0 pass
// measured at 0 % — see `entrypoint.mjs`.
export function runSessionEngineDivergence({ brainDir = resolve(dirname(fileURLToPath(import.meta.url)), "..") } = {}) {
  let nudge = null;
  sessionEngineDivergence({
    brainDir,
    readDivergence: (dir) => readEngineDivergence({ brainDir: dir }),
    readRef: (dir) => {
      const manifestPath = join(dir, "engine-manifest.json");
      return existsSync(manifestPath) ? installRef(JSON.parse(readFileSync(manifestPath, "utf8"))) : null;
    },
    emit: (msg) => (nudge = msg),
  });

  const output = buildEngineDivergenceHookOutput(nudge);
  if (output) {
    // additionalContext is the ONLY Desktop-visible channel — see the builder.
    process.stdout.write(JSON.stringify(output) + "\n");
  }
  // No numeric result: fail-open, the process falls through to its natural exit 0 and
  // a session start is never blocked by what this hook found or failed to find.
}

runAsEntrypoint(import.meta.url, process.argv, () => runSessionEngineDivergence());
