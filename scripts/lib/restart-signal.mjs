// ─────────────────────────────────────────────────────────────────────────────
// restart-signal.mjs — "is a restart pending?", read from disk. The two signals
// and their I/O, extracted from status-line.mjs so a SECOND channel can carry the
// nudge (ADR 0036: the status line retreats, and it was the ONLY surface that
// delivered this one). The policy itself stays in restart-nudge.mjs; here we only
// read the disk, with the reads injected so the glue is testable.
// ─────────────────────────────────────────────────────────────────────────────
import { dirname, join } from "node:path";
import { isRestartPending, RESTART_FLAG_REL } from "./restart-nudge.mjs";
import { detectSelfHealGap } from "./self-heal-detect.mjs";

// What the flag file says. Read by nobody — its existence IS the signal — but a human
// who opens it deserves a sentence, and the three writers must not each invent one.
const FLAG_BODY = "restart needed to finish the engine update\n";

/**
 * True when the brain's on-disk engine state is AHEAD of what this session loaded,
 * by either signal: the explicit `.cache/restart-needed` flag, or an engine-delivered
 * skill / MCP server present on disk but not installed. FAIL-SOFT — any read that
 * blows up yields `false`, because a phantom "⚠️ RESTART Claude" costs the owner a
 * pointless restart and teaches them to ignore the real one.
 *
 * `deriveWanted` is injected (it belongs to the self-heal), as are the two fs reads.
 */
export function restartPendingOnDisk({ repo, deriveWanted, existsSync, readFileSync }) {
  const gapNeeded = noSignalIfItBlowsUp(() => {
    const { wantedSkillDirs, wantedServerIds } = deriveWanted(repo);
    const mcpPath = join(repo, ".mcp.json");
    const registered = existsSync(mcpPath)
      ? new Set(Object.keys(JSON.parse(readFileSync(mcpPath, "utf8")).mcpServers ?? {}))
      : new Set();
    return detectSelfHealGap({
      wantedSkillDirs,
      wantedServerIds,
      skillDirExists: (dir) => existsSync(join(repo, dir)),
      mcpServerRegistered: (id) => registered.has(id),
    }).needed;
  });

  const flagExists = noSignalIfItBlowsUp(() => existsSync(join(repo, RESTART_FLAG_REL)));

  return isRestartPending({ flagExists, gapNeeded });
}

// The fail-soft above, with ONE owner. Written twice (an initializer AND a catch per signal)
// it was unobservable both times: each half silently covered for the other, so neither could
// be shown to work. Here the fallback is stated once and a test can hold it.
function noSignalIfItBlowsUp(read) {
  try {
    return read();
  } catch {
    return false;
  }
}

/**
 * Arm the "a restart is pending" flag under the brain's gitignored `.cache/`. Returns
 * whether it was actually written. FAIL-SOFT — a write that blows up yields `false` and
 * never breaks the hook it runs on: the nudge is a convenience, never a blocker.
 *
 * The fs writes are injected so the arming is assertable without a real disk.
 */
export function armRestartPending({ repo, mkdirSync, writeFileSync }) {
  try {
    const flagPath = join(repo, RESTART_FLAG_REL);
    mkdirSync(dirname(flagPath), { recursive: true });
    writeFileSync(flagPath, FLAG_BODY);
    return true;
  } catch {
    return false;
  }
}
