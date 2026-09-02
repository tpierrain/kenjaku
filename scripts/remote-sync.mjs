#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// remote-sync.mjs — the entry point of the live sync between machines (plan #84,
// step 2.4). ONE tick: the search server's clock runs it as a child while a
// window is open, exactly as it already runs auto-commit.mjs and auto-push.mjs
// on its quiet window (ADR 0037).
//
// Everything it decides lives in lib/remote-sync.mjs — this file is a
// COMPOSITION ROOT and nothing else: it binds the ports of `runTick` to the
// real machine, prints the outcome in one word, and always exits 0.
//
// The bindings that are not obvious, and why they are what they are:
//
//   • the brain root comes from THIS module's location, never from the cwd —
//     a hook (or a server child) inherits whatever directory it was started in,
//     and auto-commit.mjs learned that lesson first;
//   • the git environment forbids every prompt: a `git` that stops to ask for an
//     SSH passphrase or an HTTPS password would hang forever in a child nobody
//     is watching. `GIT_TERMINAL_PROMPT=0`, an askpass that answers nothing, SSH
//     in batch mode, and a 20 s kill per command: a killed git is a MISSED TICK,
//     which the next tick repairs, and never a hung process;
//   • the push goes through `shouldPush` + `git push` IN-PROCESS. Running
//     auto-push.mjs as a child would be a top-level script importing another
//     top-level script across engine versions — the T2 trap named in
//     auto-push.mjs itself, where a PRESERVED older sibling breaks the link;
//   • the header check reads through the ENGINE's own parser (CONVENTIONS
//     §5quater): a checker that parses notes its own way measures a fiction. When
//     the engine's dependencies cannot be resolved (a clone nobody rehydrated),
//     it says "ok" — unknown is not broken, and a tick must not stop syncing
//     because it cannot judge;
//   • the notifier is a NAMED no-op until step 5.2 fills it with the OS banner.
// ─────────────────────────────────────────────────────────────────────────────
import { execFileSync, spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { runAsEntrypoint } from "./lib/entrypoint.mjs";
// The trace is READ by the announcement hook and WRITTEN here, so it belongs to neither:
// two top-level scripts may not import each other (the cross-version trap), and one shared
// lib module is how they agree on the same bytes.
import { buildTrace, CACHE_DIR } from "./lib/remote-arrivals.mjs";
import { buildNotifier } from "./lib/os-banner.mjs";
import { shouldPush } from "./lib/git-push.mjs";
import { DEFAULT_INTERVAL_MS, runTick } from "./lib/remote-sync.mjs";
import { openTickGate } from "./lib/remote-sync-gate.mjs";
import { engineParser, frontmatterVerdict } from "./lib/vault-write-guard.mjs";

/** A git that stopped to ask a question is killed at this point, and the tick is missed. */
export const GIT_TIMEOUT_MS = 20_000;

/**
 * The environment every child `git` runs under. It INHERITS (a git with no PATH
 * finds no ssh, and a brain on Windows needs its whole environment) and then closes
 * the three doors through which git can ask a human something.
 */
export function gitEnv(env) {
  return {
    ...env,
    GIT_TERMINAL_PROMPT: "0",
    // `echo` answers an empty credential, which git treats as a refusal. A GUI askpass
    // inherited from the desktop session would otherwise pop a window on a machine
    // whose owner is not in front of it.
    GIT_ASKPASS: "echo",
    GIT_SSH_COMMAND: "ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new",
  };
}

/**
 * The child-process request, as a VALUE (CONVENTIONS §5ter, debt 2): a request composed
 * at the call site is a request no test can assert, and here the request IS most of the
 * safety — the working directory, the kill timeout and the no-prompt environment.
 */
export function buildGitInvocation({ repo, args, env = process.env }) {
  return {
    command: "git",
    args,
    options: {
      cwd: repo,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: GIT_TIMEOUT_MS,
      env: gitEnv(env),
    },
  };
}

/** The real git runner bound to `repo`: (args) → {out, ok}, and it never throws. */
export function buildGit(repo, execFile = execFileSync) {
  return (args) => {
    const request = buildGitInvocation({ repo, args });
    try {
      const out = execFile(request.command, request.args, request.options);
      return { out: out ?? "", ok: true };
    } catch (e) {
      return { out: `${e.stdout ?? ""}${e.stderr ?? ""}`, ok: false };
    }
  };
}

/** The brain root, derived from THIS module's location (one level up from scripts/). */
export function brainRoot(metaUrl) {
  return resolve(dirname(fileURLToPath(metaUrl)), "..");
}

/**
 * How long a window waits before ticking again on a machine another window already
 * served. It must FOLLOW the configured interval: a gate of 90 s against a clock of
 * 30 s would silently drop two ticks out of three. Anything that is not a positive
 * whole number of seconds — absent, malformed, or the `0` that turns the clock off
 * upstream — falls back to the default, and never crashes the tick.
 */
export function minGapMsFrom(env) {
  const raw = (env?.REMOTE_SYNC_INTERVAL ?? "").trim();
  if (!/^\d+$/.test(raw)) return DEFAULT_INTERVAL_MS;
  const seconds = Number(raw);
  return seconds > 0 ? seconds * 1000 : DEFAULT_INTERVAL_MS;
}

/** Is git holding the index right now (an auto-commit mid-flight)? */
export function buildIndexLockPresent(brainDir) {
  return () => existsSync(join(brainDir, ".git", "index.lock"));
}

/**
 * Does a merged note still parse the way the INDEXER parses it? `parse` defaults to
 * the engine's own parser, resolved from the engine's own dependencies; `null` means
 * "we cannot judge", and an unverifiable note is not a broken one. A note the merge
 * DELETED cannot be read either, and is not a damaged note.
 */
export function buildCheckNote({ brainDir, parse = engineParser({ brainDir }), read = readFileSync }) {
  return (rel) => {
    if (parse === null) return { ok: true };
    let raw;
    try {
      raw = read(join(brainDir, rel), "utf8");
    } catch {
      return { ok: true };
    }
    return frontmatterVerdict({ raw, parse });
  };
}

/**
 * The push, in-process, under the SAME opt-in as the Stop hook: without
 * `secondbrain.autopush`, a brain stays local and this tick only ever pulls.
 * Returns "pushed" | "skipped" | "failed" — never throws, never retries (the next
 * tick is the retry).
 */
export function buildPush({ git }) {
  return () => {
    const hasRemote = git(["remote"]).out.trim().length > 0;
    const autopush = git(["config", "--get", "secondbrain.autopush"]).out.trim() === "true";
    const hasUpstream = git(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"]).ok;
    const unpushedCount = hasUpstream ? Number(git(["rev-list", "--count", "@{u}..HEAD"]).out.trim()) || 0 : 0;
    if (!shouldPush({ hasRemote, autopush, hasUpstream, unpushedCount })) return "skipped";
    return git(["push"]).ok ? "pushed" : "failed";
  };
}

/**
 * Every port of `runTick`, bound to the brain this module sits in.
 *
 * `spawnChild` is a seam, and it is not decoration: the notifier it feeds raises a NATIVE
 * desktop banner, so any test that exercises this wiring against the real `spawn` puts a
 * popup on the screen of whoever is running it — a thousand of them under a mutation run,
 * where breaking the switch that silences it is precisely what the mutants do.
 */
export function realTickDeps(metaUrl, env = process.env, spawnChild = spawn) {
  const brainDir = brainRoot(metaUrl);
  const git = buildGit(brainDir);
  const trace = buildTrace(brainDir);
  return {
    git,
    gate: openTickGate({ dir: join(brainDir, CACHE_DIR), minGapMs: minGapMsFrom(env) }),
    indexLockPresent: buildIndexLockPresent(brainDir),
    readTrace: trace.read,
    writeTrace: trace.write,
    checkNote: buildCheckNote({ brainDir }),
    push: buildPush({ git }),
    notify: buildNotifier({ platform: process.platform, env, spawn: spawnChild }),
    now: () => new Date(),
  };
}

export const realWrite = (s) => process.stdout.write(s);

/**
 * The tick, and its one word of output. The outcome is PRINTED rather than turned
 * into an exit code: this runs as a child of the search server, where a non-zero
 * exit reads as "the sync is broken" while "up-to-date", "gated" and
 * "deferred-dirty" are the everyday healthy answers. Always 0, like every hook.
 */
export function runRemoteSync({ deps, write = realWrite }) {
  write(`${runTick(deps)}\n`);
  return 0;
}

// ── CLI entry (the tick the search server's clock runs) ──────────────────────
runAsEntrypoint(import.meta.url, process.argv, () => runRemoteSync({ deps: realTickDeps(import.meta.url) }));
