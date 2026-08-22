#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// session-self-heal.mjs — SessionStart self-heal (ADR 0026, Layer B). A brain that
// received engine code but never finished converging (e.g. update-engine's
// auto-finalize was interrupted) heals itself silently at the next session start.
//
// Contract (asserted by session-self-heal.test.mjs):
//   • TRUE no-op when converged — the steady state spawns NOTHING and emits NOTHING
//     (fast: just a manifest read + a few existence checks via the pure gate);
//   • heals in the BACKGROUND when a gap exists — re-execs the reconcile CLI as a
//     detached child so the hook never blocks session start, and emits ONE loud line;
//   • fail-open — any error is logged loudly and swallowed; the function NEVER throws
//     and the hook ALWAYS exits 0 (a broken self-heal must never block a session).
//
// Local converge ONLY: no network, no fetch (sourceDir === brainDir). The reconcile
// child uses the brain's own (already-on-disk) manifest as both target and local, so
// it never reindexes — it just installs the missing skills + registers the missing MCP.
//
// Wired as a SessionStart hook BEFORE session-status.mjs (cf. .claude/settings.json).
// Cross-OS: pure Node, no bash/jq dependency.
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

import { detectSelfHealGap } from "./lib/self-heal-detect.mjs";
import { computeApplyPlan } from "./lib/engine-apply-plan.mjs";
import { RESTART_FLAG_REL } from "./lib/restart-nudge.mjs";
import { armRestartPending } from "./lib/restart-signal.mjs";
import { rehydrationPlan, unwiredFiles } from "./lib/brain-rehydrate.mjs";

export async function sessionSelfHeal({
  brainDir,
  readWanted,
  skillDirExists,
  mcpServerRegistered,
  spawnReconcile,
  emit,
  setRestartPending = () => {},
  missingWiring = () => [],
}) {
  try {
    // F14 — before anything else: is this machine WIRED at all? An absent `.mcp.json`
    // registers no server, so the gate below would read a convergence gap and this hook
    // would promise a background heal that CANNOT land (the reconcile only edits files
    // that already exist). A clone is not a half-finished update: it needs one command,
    // run by the owner, and the only useful thing to do here is name it.
    const unwired = missingWiring();
    if (unwired.length > 0) {
      // The file names stay (they are what support asks for), but the explanation is in plain
      // words: "gitignored" and "absolute paths" are our vocabulary, and this message lands at the
      // exact moment the owner is already unsure whether they broke something.
      emit(
        `⚠️ This computer isn't set up for your brain yet (missing ${unwired.join(" and ")}) — ` +
          `a copy never carries those settings, because they point to folders on this particular ` +
          `machine. From this folder, run:  node scripts/rehydrate.mjs  — then open a NEW ` +
          `conversation here. Your notes are untouched.`,
      );
      return { healed: false, needsRehydrate: true, missingWiring: unwired };
    }

    const { wantedSkillDirs, wantedServerIds } = readWanted();
    const gap = detectSelfHealGap({ wantedSkillDirs, wantedServerIds, skillDirExists, mcpServerRegistered });
    if (!gap.needed) {
      // F-B7d (A2): a fresh, converged session HAS loaded the on-disk engine state, so any
      // restart nudge left by a previous session is now stale → clear it. This is what makes
      // the persistent statusLine nudge disappear exactly when the user has actually restarted.
      setRestartPending(false);
      return { healed: false };
    }

    // F-B7d (A2): a background reconcile is about to converge the brain, but THIS session
    // already loaded the pre-reconcile config → on-disk will be ahead of what's loaded.
    // Mark a restart as PENDING so the persistent statusLine nudges the Desktop user (whose
    // systemMessage we are about to emit is dropped by the Code tab). Cleared by the next
    // fresh, converged session start (the branch just above).
    setRestartPending(true);

    const parts = [
      gap.missingSkills.length ? `skills: ${gap.missingSkills.map((d) => d.split("/").pop()).join(", ")}` : null,
      gap.missingServers.length ? `MCP: ${gap.missingServers.join(", ")}` : null,
    ].filter(Boolean);
    // Calm sentence, one shouted gesture (Thomas, 2026-08-07). The owner is not a developer and
    // skims this banner; the single thing they must not skim past is the restart, so THAT is in
    // capitals and nothing else is. A wall of shouting on a pending update — which is routine and
    // harmless — is how people learn to ignore the banner that one day matters.
    emit(
      `⚠️ An update to your brain is finishing in the background (${parts.join("; ")}). ` +
        `PLEASE CLOSE CLAUDE AND REOPEN IT once this is done — until then, your brain ` +
        `can't use what the update added. Your notes are untouched.`,
    );
    spawnReconcile({ brainDir });
    return { healed: true, ...gap };
  } catch (e) {
    const error = e?.message ?? String(e);
    // Keeps its ⚠️ deliberately (Thomas, 2026-08-07). This catch wraps the WHOLE detection, so
    // when it fires nothing is reconciled and a missing skill or MCP server stays missing in
    // silence — the very failure family this engine exists to refuse. "Non-blocking" describes
    // the session start, not the consequence. The raw error stays ours (it rides `result.error`);
    // what the owner gets is what it means for them, and one gesture.
    emit(
      `⚠️ I couldn't check whether your brain is fully set up this time. Your notes are ` +
        `untouched, and I'll check again next session — if something seems missing, close ` +
        `Claude and reopen it.`,
    );
    return { healed: false, error };
  }
}

// ⛔ Build the SessionStart hook output (Thomas's Desktop QA, 2026-06-21). Claude Desktop's Code
// tab renders NEITHER a statusLine NOR `systemMessage` — the ONLY Desktop-visible channel is the
// CHAT. A SessionStart hook's `hookSpecificOutput.additionalContext` IS injected into the agent's
// context, so the agent relays it into the chat. So the restart nudge MUST ride additionalContext,
// phrased as a DIRECTIVE the agent surfaces to the user (not raw user prose Desktop would drop).
// `systemMessage` is kept too — harmless on Desktop (dropped), useful on the CLI (shown).
// F14: the framing must follow the line it CARRIES. An unwired machine is not a half-applied
// update — nothing is converging in the background and no restart heals it; a command has to be
// run first. Framing both alike was this plan's own defect shape (two opposite states, rendered
// identically), on the last surface still doing it.
export function buildSelfHealHookOutput(lines, { needsRehydrate = false } = {}) {
  if (!lines || lines.length === 0) return null;
  const detail = lines.join("\n");
  const framing = needsRehydrate
    ? `[engine self-heal — SETUP NEEDED] Tell the user NOW, in their language, loudly ` +
      `(emoji + a heading): this machine is not wired for their brain yet, and the command ` +
      `below is what wires it — they run it themselves, from this folder. Relay:\n`
    : `[engine self-heal — RESTART REQUIRED] Tell the user NOW, in their language, loudly ` +
      `(emoji + a heading): they must FULLY restart Claude (close it, reopen, resume here) for ` +
      `an update finishing in the background. Never imply it is already live. Relay:\n`;
  return {
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: `${framing}${detail}`,
    },
    systemMessage: detail,
  };
}

// "<…>/local-mirror/**" → "<…>/local-mirror" (mirror reconcile-brain's skill-dir derivation).
function skillGlobToDir(glob) {
  return glob.replace(/\/\*\*?$/, "");
}

// Derive the engine's DESIRED-STATE from the files it DELIVERS to this brain (F-B7 2g),
// proven by restart-convergence.test.mjs. NEVER the recorded `engineMcpServers`/manifest
// regimes alone.
//
// ⚠️ THIS COMMENT USED TO SAY "update-engine never refreshes those, which is the whole bug",
// and half of it stopped being true at W3: step 7 now advances `regimes` and `retired` to
// the engine's. `engineMcpServers` is still never advanced, so the sentence holds for the
// half that matters here. And the derivation is not made redundant by W3 either — it must
// hold for a brain that has NOT updated yet, and the staged `engine-skills/` half is in no
// regime at all:
//   • wanted skills  = engine merge skills (computeApplyPlan, for v3.3.0+ skills) ∪ the
//                      staged `engine-skills/<name>/` dirs (upgrader-bound skills the
//                      sacred scrub forbids delivering under `.claude/skills/`);
//   • wanted servers = keys of the delivered `.mcp.json.template` (the local-mirror
//                      server arrives here once pass-1 lays the template on disk).
export function deriveWanted(brainDir) {
  const manifest = JSON.parse(readFileSync(join(brainDir, "engine-manifest.json"), "utf8"));
  const mergeSkillDirs = computeApplyPlan(manifest).installSkills.map(skillGlobToDir);

  const stagingDir = join(brainDir, "engine-skills");
  const stagedSkillDirs = existsSync(stagingDir)
    ? readdirSync(stagingDir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => `.claude/skills/${e.name}`)
    : [];

  const templatePath = join(brainDir, ".mcp.json.template");
  const wantedServerIds = existsSync(templatePath)
    ? Object.keys(JSON.parse(readFileSync(templatePath, "utf8")).mcpServers ?? {})
    : [];

  return {
    wantedSkillDirs: [...new Set([...mergeSkillDirs, ...stagedSkillDirs])],
    wantedServerIds,
  };
}

// ── main: wire the real I/O seams (deterministic glue, not unit-tested) ───────
// The reconcile runs DETACHED in the background (its npm install / launcher regen
// can outlast the hook timeout) so session start never blocks. The brain converges
// from its OWN on-disk code (sourceDir === brainDir) → no network, no reindex.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const brainDir = resolve(__dirname, "..");
  const reconcileCli = join(__dirname, "lib", "reconcile-brain.mjs");
  const lines = [];

  sessionSelfHeal({
    brainDir,
    // Desired-state from the files the engine DELIVERS, never the frozen manifest
    // (F-B7 2g): wanted skills = engine merge skills ∪ staged `engine-skills/`;
    // wanted MCP servers = keys of the delivered `.mcp.json.template`.
    readWanted: () => deriveWanted(brainDir),
    // F14: the two files a machine bakes its own paths into. Absent → this is a clone
    // nobody has rehydrated yet, not a brain mid-update.
    missingWiring: () =>
      unwiredFiles(rehydrationPlan({ exists: (rel) => existsSync(join(brainDir, rel)) })),
    skillDirExists: (dir) => existsSync(join(brainDir, dir)),
    mcpServerRegistered: (() => {
      const mcpPath = join(brainDir, ".mcp.json");
      const ids = existsSync(mcpPath)
        ? new Set(Object.keys(JSON.parse(readFileSync(mcpPath, "utf8")).mcpServers ?? {}))
        : new Set();
      return (id) => ids.has(id);
    })(),
    spawnReconcile: ({ brainDir: dir }) => {
      const child = spawn(
        process.execPath,
        [reconcileCli, "--brainDir", dir, "--sourceDir", dir, "--platform", process.platform],
        // detached + unref → survives the hook process; windowsHide → no console flash on Windows.
        { detached: true, stdio: "ignore", windowsHide: true },
      );
      child.unref();
    },
    // A2: persist the "restart pending" flag under the gitignored .cache/ so the statusLine
    // (status-line.mjs) can show the Desktop-visible nudge. Fail-soft: a flag-write hiccup
    // must never break self-heal, so swallow errors (the systemMessage line still ships).
    setRestartPending: (pending) => {
      // Arming goes through restart-signal.mjs — the one owner of the flag's path and body,
      // now that three surfaces write it (this self-heal, the updater, and the pull detection
      // of F20). Clearing stays here: it is this hook's own job, and only its own.
      if (pending) {
        armRestartPending({ repo: brainDir, mkdirSync, writeFileSync });
        return;
      }
      try {
        rmSync(join(brainDir, RESTART_FLAG_REL), { force: true });
      } catch {
        /* fail-soft: the nudge is a convenience, never a blocker */
      }
    },
    emit: (msg) => lines.push(msg),
  })
    .then((result) => {
      // F14: the wrapper's directive follows the payload — an unwired machine gets "run this",
      // never "restart for an update finishing in the background".
      const output = buildSelfHealHookOutput(lines, { needsRehydrate: result?.needsRehydrate === true });
      if (output) {
        // additionalContext is the ONLY Desktop-visible channel (chat) — see buildSelfHealHookOutput.
        process.stdout.write(JSON.stringify(output) + "\n");
      }
      process.exit(0); // fail-open: ALWAYS exit 0, never block session start
    })
    .catch(() => process.exit(0));
}
