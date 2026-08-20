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
import { runAsEntrypoint } from "./lib/entrypoint.mjs";
import { treeState } from "./lib/repo-status.mjs";

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

export const COMMIT_MESSAGE = "auto: vault/claude sync";

// Commit-only vault persistence: if the tree is dirty, stage everything and
// commit (never pushes — the Stop hook does that once per turn). Returns
// "committed" | "clean" | "conflicted" | "failed". `git` is the injected runner.
// NEVER throws: `buildGit` maps a git that blew up to `{ok: false}`, and this reads
// it rather than assuming success. Best-effort still, but it says which.
//
// "committed" is a CLAIM, so it is only made when git accepted both halves. It used
// to be returned unconditionally, which turned an `.git/index.lock` contention with
// the PostToolUse hook into a silent non-commit reported as a success — the one
// failure mode a second brain must never paper over.
//
// "conflicted" is the one case where persistence steps aside: this hook fires on
// every write, conflict-resolution writes included, and `add .` on an unmerged tree
// stages the `<<<<<<<` markers AND fake-resolves the rebase. The rule is shared
// (`treeState`) with the session-start sweep and the engine update, so all three
// persistence paths refuse the same tree.
export function attemptCommit({ git }) {
  const state = treeState(git(["status", "--porcelain"]).out);
  if (state !== "dirty") return state;
  if (!git(["add", "."]).ok) return "failed";
  if (!git(["commit", "-m", COMMIT_MESSAGE]).ok) return "failed";
  return "committed";
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
// same idea as the shared one but with the arguments the other way round, and
// re-exported to auto-push.mjs. Two spellings of "am I the entry point?" are two
// behaviours to keep in step forever, so it is gone: the realpath lesson it had
// learned lives in lib/entrypoint.mjs, tested once.
export function runAutoCommitHook() {
  attemptCommit({ git: buildGit(repoRoot(import.meta.url)) });
}

runAsEntrypoint(import.meta.url, process.argv, runAutoCommitHook);
