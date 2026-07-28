// ─────────────────────────────────────────────────────────────────────────────
// restart-signal.mjs — "is a restart pending?", read from disk. The two signals
// and their I/O, extracted from status-line.mjs so a SECOND channel can carry the
// nudge (ADR 0036: the status line retreats, and it was the ONLY surface that
// delivered this one). The policy itself stays in restart-nudge.mjs; here we only
// read the disk, with the reads injected so the glue is testable.
// ─────────────────────────────────────────────────────────────────────────────
import { join } from "node:path";
import { isRestartPending, RESTART_FLAG_REL } from "./restart-nudge.mjs";
import { detectSelfHealGap } from "./self-heal-detect.mjs";

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
  let gapNeeded = false;
  try {
    const { wantedSkillDirs, wantedServerIds } = deriveWanted(repo);
    const mcpPath = join(repo, ".mcp.json");
    const registered = existsSync(mcpPath)
      ? new Set(Object.keys(JSON.parse(readFileSync(mcpPath, "utf8")).mcpServers ?? {}))
      : new Set();
    gapNeeded = detectSelfHealGap({
      wantedSkillDirs,
      wantedServerIds,
      skillDirExists: (dir) => existsSync(join(repo, dir)),
      mcpServerRegistered: (id) => registered.has(id),
    }).needed;
  } catch {
    gapNeeded = false;
  }

  let flagExists = false;
  try {
    flagExists = existsSync(join(repo, RESTART_FLAG_REL));
  } catch {
    flagExists = false;
  }

  return isRestartPending({ flagExists, gapNeeded });
}
