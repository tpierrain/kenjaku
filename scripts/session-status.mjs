#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// session-status.mjs — computes 2-3 startup status lines (repo + RAG) and emits
// them via the SessionStart hook's JSON `systemMessage` field, which DISPLAYS
// them DIRECTLY in the CLI terminal, without relying on Claude to copy them.
// Deterministic startup: all the computation AND the display happen here.
// NB: `systemMessage` is NOT rendered by the Code tab of Claude Desktop. Nor is
// `statusLine` — NOTHING deterministic reaches Desktop, which is why the agent's
// own chat message is the only universal channel (ADR 0036's channel matrix; this
// note used to claim statusLine covered Desktop, and it did not). The hook also
// keeps its side effect: the startup sync `git pull --rebase`.
//
// Called by the SessionStart hook (cf. .claude/settings.json).
// Cross-OS: pure Node, no bash/jq/sqlite3-CLI dependency.
//   - git via child_process
//   - .md counting via fs
//   - DB reading via better-sqlite3 (already installed in rag/node_modules);
//     degrades gracefully if the module is not loadable.
// ─────────────────────────────────────────────────────────────────────────────
import { execFileSync, spawn } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { hasGeminiKey, geminiKeyRequired } from "./lib/gemini-key.mjs";
import { repoStatusLine, countVaultUncommitted, countUnmerged } from "./lib/repo-status.mjs";
import { ragStatusLine, LAST_RUN_REL } from "./lib/rag-status.mjs";
import { sweepThenPull } from "./lib/startup-sync.mjs";
import { bootstrapSessionHooks } from "./lib/hook-bootstrap.mjs";
import { bootstrapReassuranceMessage } from "./lib/self-heal-message.mjs";
import { restartNudgeSegment } from "./lib/restart-nudge.mjs";
import { restartPendingOnDisk } from "./lib/restart-signal.mjs";
import { readStartupVersionLine } from "./lib/engine-version.mjs";
import { buildStatusHookOutput } from "./lib/status-hook-output.mjs";
import { deriveWanted } from "./session-self-heal.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..");
const VAULT = join(REPO, "vault");
const DB_PATH = join(REPO, "rag", ".cache", "vault.db");
const ENV_PATH = join(REPO, ".env");

// Runs git and returns { out, ok } without ever throwing (stderr included).
function git(args) {
  try {
    const out = execFileSync("git", args, {
      cwd: REPO,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { out: out ?? "", ok: true };
  } catch (e) {
    const out = `${e.stdout ?? ""}${e.stderr ?? ""}`;
    return { out, ok: false };
  }
}

// ─── Repo line: sweep the tree clean, THEN git pull --rebase ─────────────────
// (the pull is silent if no remote is configured — purely local usage)
// The sweep is what keeps the pull runnable: a dirty tree makes `pull --rebase`
// refuse, and the brain is dirtied by writers no Claude hook sees (an engine
// update's own files, an Obsidian edit). Being a HOOK is the point — a fresh
// node process reading the code off disk, so the fix is live at the first restart
// after the update that installs it, unlike the updater's own end-of-run commit.
const { pullOk, pullOut } = sweepThenPull({ git });
const short = git(["rev-parse", "--short", "HEAD"]).out.trim();

// Fail-loud guardrails, read AFTER the pull (which can itself leave conflicts):
// unmerged paths need a human, and vault notes still uncommitted here mean the
// sweep could not commit them. repoStatusLine turns both into priority alerts
// (cf. scripts/lib/repo-status.mjs).
const porcelain = git(["status", "--porcelain"]).out;
const uncommittedVault = countVaultUncommitted(porcelain);
const conflictedCount = countUnmerged(porcelain);
const changedCount =
  pullOk && !/already up to date|déjà à jour/i.test(pullOut)
    ? git(["diff", "--name-only", "ORIG_HEAD", "HEAD"]).out
        .split("\n")
        .filter((l) => l.trim().length > 0).length
    : 0;
const repoLine = repoStatusLine({ pullOk, pullOut, short, changedCount, uncommittedVault, conflictedCount });

// ─── RAG line: docCount (db) vs .md files on disk ────────────────────────────
function countMarkdown(dir) {
  let n = 0;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) n += countMarkdown(p);
    else if (e.isFile() && e.name.toLowerCase().endsWith(".md")) n++;
  }
  return n;
}
const scanned = countMarkdown(VAULT);

let docs = null;
if (existsSync(DB_PATH)) {
  try {
    // better-sqlite3 lives in rag/node_modules → require resolved from rag/.
    const require = createRequire(join(REPO, "rag", "package.json"));
    const Database = require("better-sqlite3");
    const db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
    docs = db.prepare("SELECT COUNT(*) AS n FROM documents").get().n;
    db.close();
  } catch {
    docs = null; // degrades: module absent, DB being written, etc.
  }
}

// F11/F12: the shortfall alone cannot tell a queued note from a REFUSED one, and the
// engine already knows which is which — it records the file and the cause in the last
// run's state. Read it here so the counter and its explanation share one line.
// Fail-soft: an unreadable/corrupt run state just means "nothing recorded" (a wait).
let lastRun = null;
try {
  const lastRunPath = join(REPO, LAST_RUN_REL);
  if (existsSync(lastRunPath)) lastRun = JSON.parse(readFileSync(lastRunPath, "utf8"));
} catch {
  lastRun = null;
}
const ragLine = ragStatusLine({ docs, scanned, lastRun });

// ─── Gemini key line: flag if it's missing (the RAG can't answer) ────────────
// Read on every startup: if the user launched Claude Code BEFORE pasting their
// key, we flag it and remind them they just need to paste it then re-ask their
// question (the server re-reads .env on the fly — no need to reconnect).
// We only alert IF the chosen embedder needs a Gemini key: an in-process vault
// ("Gemma inside") or one on an OpenAI-compatible endpoint needs none.
let keyLine = null;
const envContent = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, "utf8") : null;
if (geminiKeyRequired(envContent) && !hasGeminiKey(envContent)) {
  keyLine =
    "⚠️ Gemini key missing from .env → the RAG can't answer. Paste it into " +
    ".env (GOOGLE_GEMINI_API_KEY=…) then re-ask your question (the server re-reads " +
    "it on its own). If it persists, reconnect the MCP (/mcp) or restart Claude Code.";
}

// ─── Bootstrap tick (ADR 0026): the one-time pre-3.2 → v3.3.0 hook wiring ─────
// session-status is the ONLY SessionStart hook a pre-3.2 brain has wired, so it is the
// anchor that wires the v3.3.0 runtime trio (self-heal / health / obsidian-hint). It
// detects the drift (settings.json vs the now-current template), and — only if a gap
// exists — spawns the detached reconcile ONCE + emits one belt line (localized via the
// brain's BRAIN_LOCALE). Converged → no-op, no spawn. Fail-soft: a broken bootstrap NEVER
// blocks session start. The same reconcile CLI the self-heal spawns; sourceDir === brainDir
// (local converge, no fetch).
let bootstrapLine = null;
try {
  const settingsPath = join(REPO, ".claude", "settings.json");
  const templatePath = join(REPO, ".claude", "settings.json.template");
  if (existsSync(settingsPath) && existsSync(templatePath)) {
    const brainHooks = JSON.parse(readFileSync(settingsPath, "utf8")).hooks ?? {};
    const templateHooks = JSON.parse(readFileSync(templatePath, "utf8")).hooks ?? {};
    const reconcileCli = join(__dirname, "lib", "reconcile-brain.mjs");
    const r = bootstrapSessionHooks({
      brainHooks,
      templateHooks,
      brainDir: REPO,
      message: bootstrapReassuranceMessage(),
      spawnReconcile: ({ brainDir }) => {
        const child = spawn(
          process.execPath,
          [reconcileCli, "--brainDir", brainDir, "--sourceDir", brainDir, "--platform", process.platform],
          // detached + unref → outlives the hook; windowsHide → no console flash (ADR 0015).
          { detached: true, stdio: "ignore", windowsHide: true },
        );
        child.unref();
      },
      emit: (msg) => (bootstrapLine = msg),
    });
    void r;
  }
} catch {
  bootstrapLine = null; // fail-soft: never block session start over a bootstrap hiccup
}

// ─── Restart nudge (ADR 0036): the channel of last resort on the CLI ─────────
// It used to be surfaced ONLY by the status line, which this release retires — so
// it moves here, from the SAME two on-disk signals (the `.cache/restart-needed`
// flag and an engine-delivered skill/MCP not yet installed). It LEADS the message:
// until the owner restarts, nothing else they read is from the engine they now have.
// On Desktop, where `systemMessage` is dropped, the 🛑 MANDATORY chat rule in the
// update-engine skill remains the delivery — as it always was.
const restartLine = restartNudgeSegment(
  restartPendingOnDisk({ repo: REPO, deriveWanted, existsSync, readFileSync }),
);

// ─── Engine version: which Kenjaku this brain runs, read OFFLINE from the ────
// manifest (ADR 0017). It had a surface — the status line — which ADR 0036
// retired, so it silently stopped being shown; the owner asked for it back at
// startup (2026-08-03). Fail-silent: no manifest / no install ref → no segment.
const versionLine = readStartupVersionLine({
  manifestPath: join(REPO, "engine-manifest.json"),
  existsSync,
  readFileSync,
});

// ─── Emission: systemMessage displays in the terminal, additionalContext is ──
// the only channel that reaches Desktop (the agent relays it in the chat).
process.stdout.write(
  JSON.stringify(
    buildStatusHookOutput({
      versionLine,
      statusLines: [restartLine, bootstrapLine, keyLine, repoLine, ragLine],
    }),
  ) + "\n"
);
