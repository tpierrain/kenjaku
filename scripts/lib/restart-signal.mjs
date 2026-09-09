// ─────────────────────────────────────────────────────────────────────────────
// restart-signal.mjs — "is a restart pending?", read from disk. The two signals
// and their I/O, extracted from status-line.mjs so a SECOND channel can carry the
// nudge (ADR 0036: the status line retreats, and it was the ONLY surface that
// delivered this one). The policy itself stays in restart-nudge.mjs; here we only
// read the disk, with the reads injected so the glue is testable.
// ─────────────────────────────────────────────────────────────────────────────
import { dirname, join } from "node:path";
import { appRestartedSince } from "./claude-app-identity.mjs";
import { isRestartPending, RESTART_FLAG_REL } from "./restart-nudge.mjs";
import { detectSelfHealGap } from "./self-heal-detect.mjs";

// The sentence a human sees on opening the flag file. It used to be the whole content —
// the file's existence WAS the signal — and the three writers must still not each invent
// their own wording. It now rides in JSON, next to the one thing the flag was missing.
const FLAG_NOTE = "restart needed to finish the engine update";

/**
 * What the flag says on disk (#90). `armedByApp` is the identity of the Claude app that was
 * running when the flag was armed — the ONE thing a real quit-and-reopen invalidates and a
 * new conversation does not (measured 2026-09-08). Absent when no app could be named, which
 * is every CLI session, and which simply leaves the pre-#90 behaviour in place.
 */
function flagBody(appIdentity) {
  return `${JSON.stringify({ note: FLAG_NOTE, armedByApp: appIdentity ?? undefined }, null, 2)}\n`;
}

/**
 * The identity the flag carries, or `null`. Everything unexpected lands on `null`: prose
 * written by an engine that predates this (every brain updating into this version has one
 * on disk), a truncated write, a hand-edited file. And `null` means "nothing to compare",
 * which keeps the nudge — never "nobody armed it, so it must have restarted".
 */
function armedApp(body) {
  try {
    const parsed = JSON.parse(body);
    return parsed?.armedByApp ?? null;
  } catch {
    return null;
  }
}

/**
 * True when the brain's on-disk engine state is AHEAD of what this session loaded,
 * by either signal: the explicit `.cache/restart-needed` flag, or an engine-delivered
 * skill / MCP server present on disk but not installed. FAIL-SOFT — any read that
 * blows up yields `false`, because a phantom "⚠️ RESTART Claude" costs the owner a
 * pointless restart and teaches them to ignore the real one.
 *
 * `deriveWanted` is injected (it belongs to the self-heal), as are the two fs reads.
 *
 * `readAppIdentity` (#90) answers "which Claude app is running NOW?", and is called ONLY when a
 * flag exists — reading the process table in front of every prompt of every converged brain
 * would be a cost paid forever for an answer nothing asks for. When it names an app other
 * than the one the flag recorded, the owner really did restart, the flag is stale, and
 * `onStale` is handed it: the caller that can write erases it, so the next prompt in that
 * conversation is free again. Callers that only read pass neither, and get today's answer.
 */
export function restartPendingOnDisk({
  repo,
  deriveWanted,
  existsSync,
  readFileSync,
  readAppIdentity = () => null,
  onStale = () => {},
}) {
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

  const flagPath = join(repo, RESTART_FLAG_REL);
  const flagExists = noSignalIfItBlowsUp(() => existsSync(flagPath));
  const appRestarted =
    flagExists && noSignalIfItBlowsUp(() => appRestartedSince(armedApp(readFileSync(flagPath, "utf8")), readAppIdentity()));

  if (appRestarted) noSignalIfItBlowsUp(() => onStale(flagPath));
  return isRestartPending({ flagExists, gapNeeded, appRestarted });
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
 * The fs writes are injected so the arming is assertable without a real disk, and so is
 * `appIdentity` (#90) — the app running at the moment of arming, which is what a later
 * reader compares against to find out whether the restart it asked for actually happened.
 */
export function armRestartPending({ repo, mkdirSync, writeFileSync, appIdentity = null }) {
  try {
    const flagPath = join(repo, RESTART_FLAG_REL);
    mkdirSync(dirname(flagPath), { recursive: true });
    writeFileSync(flagPath, flagBody(appIdentity));
    return true;
  } catch {
    return false;
  }
}
