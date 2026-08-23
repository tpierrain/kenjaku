#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// session-actions-log.mjs — SessionStart hook that makes the append-only activity
// ledger FIRST-CLASS (Track E). The installer seeds it for new brains; this hook is
// the ongoing maintainer bound to a real event (rung 3 of the determinism ladder,
// ADR 0009): it seeds-if-absent on every SessionStart, so an UPGRADER that never
// re-runs the installer still gains the ledger at its next session — and a brain
// whose ledger was deleted quietly regains it.
//
// Determinism ladder: the TRIGGER is a deterministic hook (this), the SEED is a pure
// write-if-absent (rung 2, `seedActionsLog` — never overwrites real history), and
// the SURFACE is an additionalContext note the agent relays in the chat (the only
// Desktop-visible channel), ONCE, on the session that first created the ledger.
//
// Contract: quiet unless it just seeded, fail-open (never throws, ALWAYS exits 0).
// Wired as a SessionStart hook AFTER session-wiki-health.mjs (cf. .claude/settings.json).
// Cross-OS: pure Node.
// ─────────────────────────────────────────────────────────────────────────────
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

import { runAsEntrypoint } from "./lib/entrypoint.mjs";
import { seedActionsLog, buildActionsLogHookOutput } from "./lib/actions-log-seed.mjs";

// Testable core: seed the ledger (injected), and signal the seeding outcome only
// when it actually wrote this session. Fail-open — a seed hiccup (odd fs, races)
// must never disturb session start.
export function sessionActionsLog({ seedLog, emit }) {
  try {
    const { seeded } = seedLog();
    if (seeded) {
      emit(true);
      return { seeded: true };
    }
  } catch {
    // swallow — fail-open; a seed hiccup must never break session start.
  }
  return { seeded: false };
}

// ── main: wire the real fs seams (deterministic glue, not unit-tested) ──
// runAsEntrypoint, never a hand-rolled argv[1] comparison: `resolve(argv[1])` is the
// path AS TYPED and `import.meta.url` is the path Node REALPATH-RESOLVED, so on any
// brain whose path holds a symlink the two differ and this whole block silently never
// ran -- no output, no error, no exit code. See lib/entrypoint.mjs.
runAsEntrypoint(import.meta.url, process.argv, () => {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const brainDir = resolve(__dirname, "..");
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC), same as sync-sources
  let seeded = false;

  sessionActionsLog({
    seedLog: () => seedActionsLog({ brainDir, today }),
    emit: (v) => (seeded = v),
  });

  const output = buildActionsLogHookOutput(seeded);
  if (output) {
    // additionalContext is the ONLY Desktop-visible channel (chat) — see buildActionsLogHookOutput.
    process.stdout.write(JSON.stringify(output) + "\n");
  }
  return 0; // fail-open: ALWAYS exit 0, never block session start
});
