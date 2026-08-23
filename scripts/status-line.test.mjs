import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { gitSegment, ragSegment, buildStatusLine, runStatusLine, realGit } from "./status-line.mjs";
import { GIT_MAX_BUFFER } from "./lib/engine-fetch.mjs";

// A .env that silences the key warning, so these cases assert COMPOSITION rather
// than dragging in gemini-key's own rule (a keyless embedder needs no key).
const KEYLESS_ENV = "EMBEDDING_PROVIDER=in-process\n";

const CLI = join(dirname(fileURLToPath(import.meta.url)), "status-line.mjs");
// The repo the real seam reads — the module's own `REPO`, derived the same way it is.
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// ═══════════════════════════════════════════════════════════════════════════
// status-line — the opt-in `statusLine` producer (ADR 0036). Every one of its
// segments used to be a top-level `const`, which is why the file scored 0 % at
// v4.8.0: nothing could import it without running it. Named as debt 1 in
// v4.9.0-mutation-debt-plan.md alongside session-status and upstream-check-run.
// ═══════════════════════════════════════════════════════════════════════════

// A scripted git that answers per argv and records what it was asked, so the
// three reads are asserted as a sequence rather than one at a time.
function scriptedGit(answers = {}) {
  const asked = [];
  const git = (args) => {
    asked.push(args);
    return answers[args[1]] ?? "";
  };
  return { git, asked };
}

test("gitSegment — branch, short SHA, and the three read-only reads it makes", () => {
  const { git, asked } = scriptedGit({ "--abbrev-ref": "main", "--short": "52ff284" });

  assert.equal(gitSegment(git), "⎇ main 52ff284");
  assert.deepEqual(asked, [
    ["rev-parse", "--abbrev-ref", "HEAD"],
    ["rev-parse", "--short", "HEAD"],
    ["status", "--porcelain"],
  ]);
});

test("gitSegment — a dirty tree earns the asterisk, a clean one does not", () => {
  const dirty = scriptedGit({ "--abbrev-ref": "main", "--short": "abc1234", "--porcelain": " M a.md\n" });
  assert.equal(gitSegment(dirty.git), "⎇ main abc1234*");

  const clean = scriptedGit({ "--abbrev-ref": "main", "--short": "abc1234", "--porcelain": "" });
  assert.equal(gitSegment(clean.git), "⎇ main abc1234");
});

test("gitSegment — a git that answers nothing degrades to '?', it does not print blanks", () => {
  // Every read is fail-silent by design: a status line must never break a session.
  assert.equal(gitSegment(() => ""), "⎇ ? ?");
});

// 🚨 T9 — AND FAIL-SILENT IS WHY THE CEILING MATTERS. `?` is an honest "cannot tell" for
// the branch and the sha. The asterisk has no such glyph: an empty answer to
// `status --porcelain` renders as **clean**, so a read that failed and a vault with
// nothing to commit are one and the same line.
//
// This seam was the last one left at node's DEFAULT 1 MB `maxBuffer`, running the exact
// call the release's 64 MB ceiling was introduced for. Measured on a throwaway repo:
// 20 000 modified notes → 0.88 MB and the `*` shows; **24 000 → 1.05 MB, ENOBUFS, and
// the line says the tree is clean** over 24 000 uncommitted changes.
//
// Every test above hands `gitSegment` its own scripted git, so the one thing that was
// wrong was never run — the same blind spot T7 had one finding earlier. So the default is
// asserted here, whole, through its own `execFile` seam.
test("T9 — the real git seam carries the engine's named buffer ceiling, not node's default", () => {
  const seen = [];
  const out = realGit(["status", "--porcelain"], (command, args, options) => {
    seen.push({ command, args, options });
    return "  M notes/a.md\n";
  });

  assert.equal(out, "M notes/a.md");
  assert.deepEqual(seen, [
    {
      command: "git",
      args: ["status", "--porcelain"],
      options: { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: GIT_MAX_BUFFER },
    },
  ]);
});

test("T9 — the ceiling is IMPORTED, and is the same number the other git seams use", () => {
  // F10's own closing line: "one named ceiling, imported by all four git seams — do not
  // re-inline the number." A literal here would pass the pole above and drift the day the
  // ceiling moves, which is the whole failure this guard exists against.
  const source = readFileSync(CLI, "utf8");

  assert.match(source, /import \{ GIT_MAX_BUFFER \} from "\.\/lib\/engine-fetch\.mjs";/);
  assert.equal(source.includes("maxBuffer: GIT_MAX_BUFFER"), true, "the ceiling must be used by name");
  assert.deepEqual(
    [...source.matchAll(/maxBuffer:\s*([^,\s}]+)/g)].map((m) => m[1]),
    ["GIT_MAX_BUFFER"],
    "a re-inlined number beside the named one is how the four seams drift apart",
  );
});

test("T9 — the real seam still swallows a git that throws: a status line may never break a session", () => {
  assert.equal(
    realGit(["status", "--porcelain"], () => {
      throw Object.assign(new Error("spawnSync git ENOBUFS"), { code: "ENOBUFS" });
    }),
    "",
  );
});

test("ragSegment — an empty vault says so, whatever the DB claims", () => {
  assert.equal(ragSegment(0, null), "🧠 RAG empty");
  assert.equal(ragSegment(0, 12), "🧠 RAG empty");
});

test("ragSegment — an unreadable DB is a question mark, never a count of zero", () => {
  assert.equal(ragSegment(42, null), "🧠 RAG ?");
});

test("ragSegment — notes still to index are counted in the hourglass", () => {
  assert.equal(ragSegment(10, 4), "🧠 RAG 4/10 (6⏳)");
});

test("ragSegment — fully indexed, and OVER-indexed, both drop the hourglass", () => {
  // Triangulates the `remaining <= 0` boundary: `< 0` would leave "(0⏳)"
  // hanging on a perfectly indexed vault, and a stale DB with more rows than
  // files must not print a negative backlog.
  assert.equal(ragSegment(10, 10), "🧠 RAG 10/10");
  assert.equal(ragSegment(10, 11), "🧠 RAG 11/10");
});

test("buildStatusLine — the segments, in order, separated by ' · '", () => {
  const { git } = scriptedGit({ "--abbrev-ref": "main", "--short": "52ff284" });
  const line = buildStatusLine({
    git,
    countMarkdown: () => 10,
    readDocCount: () => 10,
    readEnv: () => KEYLESS_ENV,
    readEngine: () => "⚙ v4.9.1",
    restartPending: () => false,
  });

  assert.equal(line, "⎇ main 52ff284 · 🧠 RAG 10/10 · ⚙ v4.9.1");
});

test("buildStatusLine — a pending restart LEADS the line, so it cannot be missed", () => {
  const { git } = scriptedGit({ "--abbrev-ref": "main", "--short": "52ff284" });
  const line = buildStatusLine({
    git,
    countMarkdown: () => 0,
    readDocCount: () => null,
    readEnv: () => KEYLESS_ENV,
    readEngine: () => null,
    restartPending: () => true,
  });

  assert.match(line, /^⚠️ RESTART/);
  assert.match(line, /🧠 RAG empty$/);
});

test("buildStatusLine — absent segments are dropped, not rendered as empty gaps", () => {
  const { git } = scriptedGit({ "--abbrev-ref": "main", "--short": "52ff284" });
  const line = buildStatusLine({
    git,
    countMarkdown: () => 3,
    readDocCount: () => 3,
    readEnv: () => KEYLESS_ENV,
    readEngine: () => null,
    restartPending: () => false,
  });

  assert.equal(line, "⎇ main 52ff284 · 🧠 RAG 3/3");
  assert.doesNotMatch(line, / · $/);
  assert.doesNotMatch(line, / ·  · /);
});

test("runStatusLine — writes ONE line, once, with no trailing newline", () => {
  // statusLine's contract: exactly one line on stdout. A newline of our own would
  // render as a blank second line in the terminal.
  const written = [];
  const { git } = scriptedGit({ "--abbrev-ref": "main", "--short": "52ff284" });

  runStatusLine([], {
    git,
    countMarkdown: () => 1,
    readDocCount: () => 1,
    readEnv: () => KEYLESS_ENV,
    readEngine: () => null,
    restartPending: () => false,
    write: (s) => written.push(s),
  });

  assert.deepEqual(written, ["⎇ main 52ff284 · 🧠 RAG 1/1"]);
});

// ─── The entry-point seam, asserted by running the real thing ────────────────

test("the CLI, run as a process — prints one line about THIS repo and exits 0", () => {
  // Read-only by contract (branch, short SHA, cleanliness, .md count, a readonly
  // DB open), so running it for real here is safe and is the only thing that
  // proves the tail fires.
  const run = spawnSync(process.execPath, [CLI], { encoding: "utf8", input: "{}" });

  assert.equal(run.status, 0, `the status line must never fail — stderr: ${run.stderr}`);
  assert.match(run.stdout, /⎇ /, "the git segment is always present, even degraded to '?'");
  assert.equal(run.stdout.includes("\n"), false, "exactly one line, no newline of our own");
});

test("the CLI, IMPORTED rather than run — the body must not fire on import", () => {
  const probe = `import("${pathToFileURL(CLI).href}").then(() => { console.log("|imported-and-still-alive"); });`;
  const run = spawnSync(process.execPath, ["--input-type=module", "-e", probe], { encoding: "utf8" });

  assert.equal(run.status, 0, `importing the CLI must not run it — stderr: ${run.stderr}`);
  // Nothing may precede the marker: a status line written at import would land here.
  assert.equal(run.stdout.trim(), "|imported-and-still-alive");
});
