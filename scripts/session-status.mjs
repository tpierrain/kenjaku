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
//
// ─── Why the body is a FUNCTION and not top-level code (debt 1, v4.8.0) ──────
// This whole file used to run at import: ~190 top-level, side-effecting lines
// that no test could reach, which is why it scored 8.67 % (mutation/RESULTS.md
// § v4.9.0) and 0.00 % before that, on every published tag since v4.4.0. It was
// also the ONE file of the three that could not simply be run to check the work:
// importing it swept and auto-committed the importer's own working tree.
// The body now sits behind `runAsEntrypoint`, and every side effect it has —
// git, the disk, the detached children, stdout — arrives through `deps`. The
// output's equivalence before/after the move was proved by running the real hook
// in a disposable git worktree, where a sweep-and-commit is harmless.
// ─────────────────────────────────────────────────────────────────────────────
import { execFileSync, spawn } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, readdirSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { hasGeminiKey, geminiKeyRequired } from "./lib/gemini-key.mjs";
import { repoStatusLine, countVaultUncommitted, countUnmerged } from "./lib/repo-status.mjs";
import { ragStatusLine, LAST_RUN_REL } from "./lib/rag-status.mjs";
import { sweepThenPull } from "./lib/startup-sync.mjs";
import { hookSessionId, markSyncDone, markSyncRunning, readHookPayload } from "./lib/startup-sync-gate.mjs";
import { bootstrapSessionHooks } from "./lib/hook-bootstrap.mjs";
import { bootstrapReassuranceMessage } from "./lib/self-heal-message.mjs";
import { restartNudgeSegment } from "./lib/restart-nudge.mjs";
import { restartPendingOnDisk, armRestartPending } from "./lib/restart-signal.mjs";
import { pulledPaths, frozenWiringIn } from "./lib/frozen-wiring.mjs";
import { readStartupVersionLine } from "./lib/engine-version.mjs";
import { UPSTREAM_CACHE_REL, shouldReprobe } from "./lib/upstream-cache.mjs";
import { buildStatusHookOutput } from "./lib/status-hook-output.mjs";
import { runAsEntrypoint } from "./lib/entrypoint.mjs";
import { deriveWanted } from "./session-self-heal.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..");

// ─── The three child processes, built as VALUES before anything runs them ────
// Debt 2's shape (CONVENTIONS.md §5ter, first paid at v4.5.0): a request composed
// AT the call site is a request no test can assert — which is where defaultGit's
// 21 survivors lived. Here it also unblocks the measurement itself: this file is
// scanned by `lib/entrypoint-discipline.mjs`, and a mutation run INSTRUMENTS the
// source that scanner reads, so an inline literal flips the guard's own verdict
// mid-run. A named value is stable under instrumentation as well as assertable.

/** The read-only git call this hook makes, cwd included. */
export function buildGitInvocation(args, cwd) {
  return {
    command: "git",
    args,
    options: { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  };
}

// detached + unref → outlives the hook; windowsHide → no console flash (ADR 0015).
// Shared by both detached children below, so the two can never drift apart.
const DETACHED = { detached: true, stdio: "ignore", windowsHide: true };

/** The one-time bootstrap reconcile (ADR 0026): sourceDir === brainDir, no fetch. */
export function buildReconcileInvocation({ execPath, reconcileCli, brainDir, platform }) {
  return {
    command: execPath,
    args: [reconcileCli, "--brainDir", brainDir, "--sourceDir", brainDir, "--platform", platform],
    options: DETACHED,
  };
}

/** The throttled "is a newer engine out?" probe (ADR 0028), refreshed for NEXT time. */
export function buildUpstreamProbeInvocation({ execPath, probeCli, brainDir }) {
  return {
    command: execPath,
    args: [probeCli, "--brainDir", brainDir],
    options: DETACHED,
  };
}

/**
 * Runs a built git invocation and NEVER throws: a failed git is data here, not an
 * exception — the banner's whole job is to report it. On failure both streams are
 * concatenated, because git says "why" on stderr and "what" on stdout, and the
 * caller (`repoStatusLine`) reads the reason out of the pair.
 * `execFile` is injected so this can be judged without spawning anything.
 */
export function runGitInvocation({ command, args, options }, execFile) {
  try {
    const out = execFile(command, args, options);
    return { out: out ?? "", ok: true };
  } catch (e) {
    const out = `${e.stdout ?? ""}${e.stderr ?? ""}`;
    return { out, ok: false };
  }
}

function realGit(args) {
  return runGitInvocation(buildGitInvocation(args, REPO), execFileSync);
}

// The one query the status banner asks of the index. Named so the SQL is a value
// a test can hold, rather than a literal only a live database could contradict.
export const DOC_COUNT_SQL = "SELECT COUNT(*) AS n FROM documents";

/**
 * The indexed-document count, or null when it cannot be read — which is NOT the
 * same as zero and must never be rendered as one (cf. lib/rag-status.mjs).
 * READ-ONLY and `fileMustExist`: this runs while the indexer may be writing, and
 * a status line has no business creating or altering the vault's database.
 */
export function readDocCountFrom(dbPath, { existsSync, openDatabase }) {
  if (!existsSync(dbPath)) return null;
  try {
    const db = openDatabase(dbPath, { readonly: true, fileMustExist: true });
    const n = db.prepare(DOC_COUNT_SQL).get().n;
    db.close();
    return n;
  } catch {
    return null; // degrades: module absent, DB being written, etc.
  }
}

// better-sqlite3 lives in rag/node_modules → require resolved from rag/.
function realOpenDatabase(dbPath, options) {
  const require = createRequire(join(REPO, "rag", "package.json"));
  const Database = require("better-sqlite3");
  return new Database(dbPath, options);
}

// How many .md files are on disk under `dir`, recursively. `readdir` is passed in
// rather than closed over so the scan is assertable without a real vault; a
// directory that cannot be read counts as zero — a status line must never fail
// over a permission it does not need.
export function countMarkdown(dir, readdir) {
  let n = 0;
  let entries;
  try {
    entries = readdir(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) n += countMarkdown(p, readdir);
    else if (e.isFile() && e.name.toLowerCase().endsWith(".md")) n++;
  }
  return n;
}

function realReadDocCount(dbPath) {
  return readDocCountFrom(dbPath, { existsSync, openDatabase: realOpenDatabase });
}

// Every seam the hook touches outside its own process, in one place. The default
// value of `runSessionStatus`'s second argument — so the CLI keeps behaving
// exactly as it did, and a test never has to.
export const realSessionStatusDeps = {
  repo: REPO,
  scriptsDir: __dirname,
  git: realGit,
  spawn,
  execPath: process.execPath,
  platform: process.platform,
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  readHookPayload,
  readDocCount: realReadDocCount,
  deriveWanted,
  now: Date.now,
  write: (text) => process.stdout.write(text),
};

// Returns nothing on purpose: the hook's whole output is the line it writes, and
// the process ends by itself. A non-numeric result is what keeps the shared tail
// from calling process.exit — a SessionStart hook that exits non-zero is one that
// blocks a session start, which this file must never do.
export function runSessionStatus(argv, deps = realSessionStatusDeps) {
  const {
    repo,
    scriptsDir,
    git,
    spawn,
    execPath,
    platform,
    existsSync,
    readFileSync,
    writeFileSync,
    mkdirSync,
    readdirSync,
    readHookPayload,
    readDocCount,
    deriveWanted,
    now,
    write,
  } = deps;
  const VAULT = join(repo, "vault");
  const DB_PATH = join(repo, "rag", ".cache", "vault.db");
  const ENV_PATH = join(repo, ".env");

  // ─── Repo line: sweep the tree clean, THEN git pull --rebase ───────────────
  // (the pull is silent if no remote is configured — purely local usage)
  // The sweep is what keeps the pull runnable: a dirty tree makes `pull --rebase`
  // refuse, and the brain is dirtied by writers no Claude hook sees (an engine
  // update's own files, an Obsidian edit). Being a HOOK is the point — a fresh
  // node process reading the code off disk, so the fix is live at the first restart
  // after the update that installs it, unlike the updater's own end-of-run commit.
  //
  // This hook OWNS the pull, and SessionStart hooks run in PARALLEL (Claude Code's
  // hooks reference: "all matching hooks run in parallel"). So the pull races every
  // other hook, including those that read state it can change — the active-universe
  // pointer first among them, now that it travels between machines. Bracketing the
  // pull with a session-keyed marker is what lets such a hook WAIT for it instead of
  // announcing the scope this machine happened to wake up in. Fail-soft throughout:
  // no hook payload on stdin (run by hand) means no id, no marker, and readers simply
  // carry on as they did before this gate existed.
  const sessionId = hookSessionId(readHookPayload());
  const markerIo = { existsSync, readFileSync: (p) => readFileSync(p, "utf8"), writeFileSync, mkdirSync };
  markSyncRunning({ repo, sessionId, io: markerIo, now });
  const { pullOk, pullOut } = sweepThenPull({ git });
  markSyncDone({ repo, sessionId, io: markerIo, now });
  const short = git(["rev-parse", "--short", "HEAD"]).out.trim();

  // Fail-loud guardrails, read AFTER the pull (which can itself leave conflicts):
  // unmerged paths need a human, and vault notes still uncommitted here mean the
  // sweep could not commit them. repoStatusLine turns both into priority alerts
  // (cf. scripts/lib/repo-status.mjs).
  const porcelain = git(["status", "--porcelain"]).out;
  const uncommittedVault = countVaultUncommitted(porcelain);
  const conflictedCount = countUnmerged(porcelain);
  const pulled =
    pullOk && !/already up to date|déjà à jour/i.test(pullOut)
      ? pulledPaths(git(["diff", "--name-only", "ORIG_HEAD", "HEAD"]).out)
      : [];
  const changedCount = pulled.length;

  // F20: the pull that just ran can land the ENGINE itself — the case of a second machine,
  // updated elsewhere yesterday. Every hook, skill, MCP server and CLAUDE.md this session
  // uses was frozen a few milliseconds ago, so the code that just arrived will not answer a
  // single question today, and until now nothing said so: `.cache/restart-needed` is written
  // only by an update that ran HERE, and it is gitignored, so machine A's flag never travels.
  // The pull's own file list is the missing signal — arm the flag, and the nudge below (read
  // from disk, a few lines further) leads the banner as it already does for the other causes.
  // A brain with no remote pulls nothing, so this stays silent there, by construction.
  if (frozenWiringIn(pulled).length > 0) {
    armRestartPending({ repo, mkdirSync, writeFileSync });
  }
  const repoLine = repoStatusLine({ pullOk, pullOut, short, changedCount, uncommittedVault, conflictedCount });

  // ─── RAG line: docCount (db) vs .md files on disk ──────────────────────────
  const scanned = countMarkdown(VAULT, readdirSync);
  const docs = readDocCount(DB_PATH);

  // F11/F12: the shortfall alone cannot tell a queued note from a REFUSED one, and the
  // engine already knows which is which — it records the file and the cause in the last
  // run's state. Read it here so the counter and its explanation share one line.
  // Fail-soft: an unreadable/corrupt run state just means "nothing recorded" (a wait).
  // No `existsSync` guard on purpose — an absent file throws on read and lands in the
  // same branch, so the guard was a second spelling of the catch, and both a missing
  // file and a corrupt one deserve exactly this answer.
  let lastRun = null;
  try {
    lastRun = JSON.parse(readFileSync(join(repo, LAST_RUN_REL), "utf8"));
  } catch {
    // nothing recorded — `lastRun` is already null, and must stay so.
  }
  const ragLine = ragStatusLine({ docs, scanned, lastRun });

  // ─── Gemini key line: flag if it's missing (the RAG can't answer) ──────────
  // Read on every startup: if the user launched Claude Code BEFORE pasting their
  // key, we flag it and remind them they just need to paste it then re-ask their
  // question (the server re-reads .env on the fly — no need to reconnect).
  // We only alert IF the chosen embedder needs a Gemini key: an in-process vault
  // ("Gemma inside") or one on an OpenAI-compatible endpoint needs none.
  let keyLine = null;
  const envContent = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, "utf8") : null;
  if (geminiKeyRequired(envContent) && !hasGeminiKey(envContent)) {
    // Plain words for a gesture the owner can actually perform (Thomas, 2026-08-07). The literal
    // `GOOGLE_GEMINI_API_KEY` stays — it is the text they have to type; `/mcp` and "reconnect the
    // MCP" go, because that is our vocabulary and not theirs. Closing on "your notes are untouched"
    // is what turns a scary line into an informative one.
    keyLine =
      "⚠️ Your brain needs its Gemini key before it can search your notes. Ask me to open " +
      "your .env file, paste the key after GOOGLE_GEMINI_API_KEY=, save it, and ask your " +
      "question again — it picks the key up on its own. Your notes themselves are untouched.";
  }

  // ─── Bootstrap tick (ADR 0026): the one-time pre-3.2 → v3.3.0 hook wiring ───
  // session-status is the ONLY SessionStart hook a pre-3.2 brain has wired, so it is the
  // anchor that wires the v3.3.0 runtime trio (self-heal / health / obsidian-hint). It
  // detects the drift (settings.json vs the now-current template), and — only if a gap
  // exists — spawns the detached reconcile ONCE + emits one belt line (localized via the
  // brain's BRAIN_LOCALE). Converged → no-op, no spawn. Fail-soft: a broken bootstrap NEVER
  // blocks session start. The same reconcile CLI the self-heal spawns; sourceDir === brainDir
  // (local converge, no fetch).
  // Same shape as the run state above: either file missing throws on read and lands in
  // the catch, which is the identical outcome an `existsSync` pair would have produced —
  // so the pair is not written twice.
  let bootstrapLine = null;
  try {
    const brainHooks = JSON.parse(readFileSync(join(repo, ".claude", "settings.json"), "utf8")).hooks ?? {};
    const templateHooks =
      JSON.parse(readFileSync(join(repo, ".claude", "settings.json.template"), "utf8")).hooks ?? {};
    const reconcileCli = join(scriptsDir, "lib", "reconcile-brain.mjs");
    bootstrapSessionHooks({
      brainHooks,
      templateHooks,
      brainDir: repo,
      message: bootstrapReassuranceMessage(),
      spawnReconcile: ({ brainDir }) => {
        const call = buildReconcileInvocation({ execPath, reconcileCli, brainDir, platform });
        spawn(call.command, call.args, call.options).unref();
      },
      emit: (msg) => (bootstrapLine = msg),
    });
  } catch {
    // fail-soft: never block session start over a bootstrap hiccup. Nothing was emitted
    // when we get here (the emit happens after the reads), so the line stays null.
  }

  // ─── Restart nudge (ADR 0036): the channel of last resort on the CLI ───────
  // It used to be surfaced ONLY by the status line, which this release retires — so
  // it moves here, from the SAME two on-disk signals (the `.cache/restart-needed`
  // flag and an engine-delivered skill/MCP not yet installed). It LEADS the message:
  // until the owner restarts, nothing else they read is from the engine they now have.
  // On Desktop, where `systemMessage` is dropped, the 🛑 MANDATORY chat rule in the
  // update-engine skill remains the delivery — as it always was.
  const restartLine = restartNudgeSegment(
    restartPendingOnDisk({ repo, deriveWanted, existsSync, readFileSync }),
  );

  // ─── Engine version: which Kenjaku this brain runs, read OFFLINE from the ──
  // manifest (ADR 0017). It had a surface — the status line — which ADR 0036
  // retired, so it silently stopped being shown; the owner asked for it back at
  // startup (2026-08-03). Fail-silent: no manifest / no install ref → no segment.
  // F3: the line now also says what is UPSTREAM, from the verdict a previous
  // session's detached child wrote — still a single file read, still zero latency.
  const manifestPath = join(repo, "engine-manifest.json");
  const upstreamPath = join(repo, UPSTREAM_CACHE_REL);
  const versionLine = readStartupVersionLine({ manifestPath, upstreamPath, existsSync, readFileSync });

  // ...and refreshes that verdict for NEXT time, in a detached child (ADR 0028's
  // shape): the network call must never sit between the owner and their session.
  // Throttled by `shouldReprobe` — once a day, or whenever the verdict on disk is
  // about an engine this brain no longer runs.
  try {
    const readJson = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null);
    if (shouldReprobe({
      cached: readJson(upstreamPath),
      installedRef: readJson(manifestPath)?.source?.ref ?? null,
      now: now(),
    })) {
      const call = buildUpstreamProbeInvocation({
        execPath,
        probeCli: join(scriptsDir, "upstream-check-run.mjs"),
        brainDir: repo,
      });
      spawn(call.command, call.args, call.options).unref();
    }
  } catch {
    // fail-soft: a session start is never blocked by an update check.
  }

  // ─── Emission: systemMessage displays in the terminal, additionalContext is ─
  // the only channel that reaches Desktop (the agent relays it in the chat).
  write(
    JSON.stringify(
      buildStatusHookOutput({
        leadLine: restartLine,
        versionLine,
        statusLines: [bootstrapLine, keyLine, repoLine, ragLine],
      }),
    ) + "\n"
  );
}

runAsEntrypoint(import.meta.url, process.argv, runSessionStatus);
