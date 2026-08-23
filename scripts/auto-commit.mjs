#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// auto-commit.mjs — deterministic vault persistence. Called by the PostToolUse
// hook (Write|Edit): commits on every file modification — hence the "auto: …"
// commits. COMMIT-ONLY: it never pushes. The push is debounced to once per turn
// by the Stop hook (scripts/auto-push.mjs), so N edits = N local commits + 1
// push (avoids a network push per edit + its blocking retry pause).
//
// Cross-OS: pure Node, no shell dependency. The repo root is derived from the
// script location (not the hook's cwd).
// ─────────────────────────────────────────────────────────────────────────────
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isEntrypoint, runAsEntrypoint } from "./lib/entrypoint.mjs";
import { attemptCommit, COMMIT_MESSAGE } from "./lib/vault-commit.mjs";

// Re-exported, not re-implemented: `attemptCommit` and `COMMIT_MESSAGE` moved to
// lib/vault-commit.mjs (see its header for why), and this module keeps publishing
// them because a PRESERVED older auto-push.mjs imports them from here by name.
export { attemptCommit, COMMIT_MESSAGE };

// Builds the real git runner bound to `repo`. `execFile` is injected (default:
// execFileSync) so the ok/failure mapping is unit-testable without a real git.
export function buildGit(repo, execFile = execFileSync) {
  return (args) => {
    try {
      const out = execFile("git", args, {
        cwd: repo,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        // A hung git maps to a plain {ok:false} instead of stalling the hook
        // indefinitely (review, v4.9.1); same guard as auto-push's buildGit.
        timeout: 10000,
      });
      return { out: out ?? "", ok: true };
    } catch (e) {
      return { out: `${e.stdout ?? ""}${e.stderr ?? ""}`, ok: false };
    }
  };
}

// Repo root derived from THIS module's location (one level up from scripts/),
// not the hook's cwd. `metaUrl` is injected so it is testable.
export function repoRoot(metaUrl) {
  return resolve(dirname(fileURLToPath(metaUrl)), "..");
}

// ── CLI entry (the actual PostToolUse hook) ──────────────────────────────────
// Behind the shared tail, so importing this module in tests does NOT run it.
// Commit-only; the push moved to the Stop hook (auto-push.mjs). It returns
// nothing on purpose: the work is fully synchronous (execFileSync) and Node
// exits 0 on its own, so the tail must not call process.exit for it.
//
// This file used to carry its OWN entry predicate — `isEntryPoint(argv1, meta)`,
// same idea as the shared one but with the arguments the other way round. Two
// spellings of "am I the entry point?" are two behaviours to keep in step forever,
// so the IMPLEMENTATION is gone: the realpath lesson it had learned lives in
// lib/entrypoint.mjs, tested once. Only the NAME survives, just below.
export function runAutoCommitHook() {
  attemptCommit({ git: buildGit(repoRoot(import.meta.url)) });
}

runAsEntrypoint(import.meta.url, process.argv, runAutoCommitHook);

// ── The v4.9.1 name, kept for a PRESERVED sibling (T2, third v5.0.0 review) ──
// Deleting the export was not a tidy-up, it was a fleet-wide outage: `auto-push.mjs`
// is a SEPARATE `merge`-regime file, refreshed independently, so an owner who tuned
// theirs keeps v4.9.1's opening line — `import { attemptCommit, isEntryPoint } from
// "./auto-commit.mjs"` — against this engine's auto-commit. A missing named export
// is a LINK error: the Stop hook dies before its first statement, taking the sweep,
// the push and the whole backup path with it, at every turn, in silence.
//
// It DELEGATES — one behaviour, two names — so those old callers also inherit the
// realpath fix they never shipped with. It goes the day no supported brain can hold
// a v4.9.1 auto-push.mjs, and not before.
export function isEntryPoint(argv1, metaUrl) {
  return isEntrypoint(metaUrl, argv1);
}
