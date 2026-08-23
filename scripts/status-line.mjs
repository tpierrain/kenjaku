#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// status-line.mjs — produces ONE status line for Claude Code's `statusLine`.
//
// ⚠️ OPT-IN SINCE v4.4.0 — THE BRAIN NO LONGER INSTALLS THIS (ADR 0036). It is
// kept, working and delivered, for an owner who WANTS it: point your own
// `statusLine.command` at this script. What changed is that we stopped occupying
// a surface that is the owner's, for a gain that turned out to be CLI-only:
// `statusLine` is rendered in the terminal and NOT in Claude Desktop's Code tab
// (field-verified, F4 — see ADR 0036's channel matrix), while it is a SINGLE
// value, so ours evicted the line of every owner who had configured one.
//
// statusLine contract: reads a session JSON on stdin (ignored here), writes ONE
// line to stdout. Re-run continuously → must stay FAST, READ-ONLY and
// IDEMPOTENT: never a `git pull`, never a write (that's the role of the
// SessionStart hook, run once at startup).
//
// Cross-OS: pure Node, no bash/jq/sqlite3-CLI dependency.
//   - git via child_process (read-only: branch, short SHA, cleanliness)
//   - .md counting via fs
//   - RAG DB reading via better-sqlite3 (in rag/node_modules); degrades
//     gracefully if the module/DB is not loadable.
//
// Every segment below used to be a top-level `const`, so IMPORTING this module
// ran it and printed a line. That is why it scored 0 % at v4.8.0 — debt 1 of
// v4.9.0-mutation-debt-plan.md. The segments are pure functions now and the I/O
// went behind a `deps` port; the line itself is unchanged.
// ─────────────────────────────────────────────────────────────────────────────
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { geminiKeyWarning } from "./lib/gemini-key.mjs";
import { GIT_MAX_BUFFER } from "./lib/engine-fetch.mjs";
import { formatEngineVersion } from "./lib/engine-version.mjs";
import { restartNudgeSegment } from "./lib/restart-nudge.mjs";
import { restartPendingOnDisk } from "./lib/restart-signal.mjs";
import { runAsEntrypoint } from "./lib/entrypoint.mjs";
import { deriveWanted } from "./session-self-heal.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..");
const VAULT = join(REPO, "vault");
const DB_PATH = join(REPO, "rag", ".cache", "vault.db");
const ENV_PATH = join(REPO, ".env");
const MANIFEST_PATH = join(REPO, "engine-manifest.json");

// ─── Git segment: branch + short SHA + "uncommitted changes" marker ──────────
// Every read is fail-silent: a git that answers nothing degrades to "?" rather
// than printing a blank, because a status line must never break a session.
export function gitSegment(git) {
  const branch = git(["rev-parse", "--abbrev-ref", "HEAD"]) || "?";
  const short = git(["rev-parse", "--short", "HEAD"]) || "?";
  const dirty = git(["status", "--porcelain"]).length > 0 ? "*" : "";
  return `⎇ ${branch} ${short}${dirty}`;
}

// ─── RAG segment: docCount (db) vs .md files on disk ─────────────────────────
// An unreadable DB is a question mark, never a count of zero — "nothing indexed"
// and "cannot tell" mean very different things to whoever reads the line.
export function ragSegment(scanned, docs) {
  if (scanned === 0) return "🧠 RAG empty";
  if (docs === null) return "🧠 RAG ?";
  const remaining = scanned - docs;
  return remaining <= 0 ? `🧠 RAG ${docs}/${scanned}` : `🧠 RAG ${docs}/${scanned} (${remaining}⏳)`;
}

// A single line, segments separated by "·" — the restart nudge LEADS (unmissable),
// and absent segments are dropped rather than rendered as empty gaps.
export function buildStatusLine({
  git,
  countMarkdown,
  readDocCount,
  readEnv,
  readEngine,
  restartPending,
}) {
  return [
    restartNudgeSegment(restartPending()),
    gitSegment(git),
    ragSegment(countMarkdown(), readDocCount()),
    readEngine(),
    geminiKeyWarning(readEnv()),
  ]
    .filter(Boolean)
    .join(" · ");
}

// Runs git read-only and returns the output (empty string on failure).
//
// `execFile` is a seam, and exported, for the reason T9 measured: every test above hands
// `gitSegment` its own scripted git, so this — the only git that ever ships — was never
// run by anything. The options are the whole contract here and they are invisible from a
// return value.
export function realGit(args, execFile = execFileSync) {
  try {
    return execFile("git", args, {
      cwd: REPO,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      // 🚨 T9 — THE LAST GIT SEAM STILL ON NODE'S 1 MB DEFAULT, and it runs
      // `status --porcelain`, the exact call this ceiling was introduced for (F10).
      // Overflow throws `ENOBUFS`, the catch below answers `""`, and `""` is the same
      // answer as "nothing to commit" — so the line reports a CLEAN TREE over a vault
      // full of unsaved work. Measured on a throwaway repo: 20 000 modified notes →
      // 0.88 MB and the `*` shows; 24 000 → 1.05 MB and it vanishes.
      //
      // Imported, never re-inlined: F10's own closing line was "one named ceiling,
      // imported by all four git seams — do not re-inline the number", and this was the
      // fourth seam it was talking about.
      maxBuffer: GIT_MAX_BUFFER,
    }).trim();
  } catch {
    return "";
  }
}

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

// Degrades to null: module absent, DB mid-write, schema not there yet.
function readDocCount() {
  if (!existsSync(DB_PATH)) return null;
  try {
    const require = createRequire(join(REPO, "rag", "package.json"));
    const Database = require("better-sqlite3");
    const db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
    const n = db.prepare("SELECT COUNT(*) AS n FROM documents").get().n;
    db.close();
    return n;
  } catch {
    return null;
  }
}

// The brain's pinned version, read OFFLINE from the manifest (ADR 0017). Pure
// file read — fail-silent: no manifest / unparseable → no segment. The "update
// available" suffix is DEFERRED (read from a cache later).
function readEngine() {
  if (!existsSync(MANIFEST_PATH)) return null;
  try {
    return formatEngineVersion(JSON.parse(readFileSync(MANIFEST_PATH, "utf8")));
  } catch {
    return null;
  }
}

// Restart nudge (A2, F-B7d): "⚠️ RESTART Claude", PERSISTENT because statusLine
// re-runs continuously and reads THIS file fresh each time — so the new version
// runs even inside a stale session, the moment an update delivers it. It reaches
// the TERMINAL only: this surface is not rendered on Desktop (ADR 0036's channel
// matrix — the header's older claim was wrong, F4). Pending iff EITHER signal
// holds: an on-disk GAP (an engine-delivered skill/MCP not yet installed), which
// is what fires in the SAME session after a silent update with no fresh session;
// or the explicit FLAG (self-heal / a new core wrote it for converged-but-not-
// loaded). Both reads are fail-soft: a hiccup must never break or freeze the line.
// The reads themselves live in lib/restart-signal.mjs — shared, and unit-tested —
// since session-status.mjs now carries the same nudge on the CLI (ADR 0036).
function restartPending() {
  return restartPendingOnDisk({ repo: REPO, deriveWanted, existsSync, readFileSync });
}

export const realStatusLineDeps = {
  git: realGit,
  countMarkdown: () => countMarkdown(VAULT),
  readDocCount,
  readEnv: () => (existsSync(ENV_PATH) ? readFileSync(ENV_PATH, "utf8") : null),
  readEngine,
  restartPending,
  write: (line) => process.stdout.write(line),
};

// Returns nothing on purpose: statusLine reads stdout and the process ends by
// itself, exactly as before. A non-numeric result is what keeps the shared tail
// from calling process.exit.
export function runStatusLine(argv, deps = realStatusLineDeps) {
  deps.write(buildStatusLine(deps));
}

runAsEntrypoint(import.meta.url, process.argv, runStatusLine);
