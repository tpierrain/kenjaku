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
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { runAsEntrypoint } from "./lib/entrypoint.mjs";
import { shouldPush } from "./lib/git-push.mjs";
import { DEFAULT_INTERVAL_MS, TRACE_REL, runTick } from "./lib/remote-sync.mjs";
import { openTickGate } from "./lib/remote-sync-gate.mjs";
import { engineParser, frontmatterVerdict } from "./lib/vault-write-guard.mjs";

/** A git that stopped to ask a question is killed at this point, and the tick is missed. */
export const GIT_TIMEOUT_MS = 20_000;

/** Where the per-machine gate and the atomic-rename staging area live (gitignored). */
export const CACHE_DIR = ".cache";

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
 * The trace the announcement path reads, at the brain ROOT (a watcher only sees root
 * files, POC 0.1) and gitignored. Written by ATOMIC RENAME so a reader never catches
 * half a file: the staging copy is made under `.cache/`, which keeps the brain root
 * free of a stray `.tmp` a crash could leave behind — and the rename stays on one
 * filesystem, since both live inside the brain.
 */
export function buildTrace(brainDir) {
  const path = join(brainDir, TRACE_REL);
  const staging = join(brainDir, CACHE_DIR, `${TRACE_REL}.tmp`);
  return {
    read() {
      try {
        return JSON.parse(readFileSync(path, "utf8"));
      } catch {
        // Absent, or damaged: both mean "nothing to carry over". A corrupt trace must
        // not be the reason a brain stops syncing.
        return null;
      }
    },
    write(trace) {
      mkdirSync(dirname(staging), { recursive: true });
      writeFileSync(staging, `${JSON.stringify(trace, null, 2)}\n`, "utf8");
      try {
        renameSync(staging, path);
      } catch (error) {
        rmSync(staging, { force: true });
        throw error;
      }
    },
  };
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
 * The banner is step 5.2's; until then the tick has somewhere to send it. Named
 * rather than an inline arrow so the wiring is observable (CONVENTIONS §5ter 2).
 */
export function noNotifier() {}

/** Every port of `runTick`, bound to the brain this module sits in. */
export function realTickDeps(metaUrl, env = process.env) {
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
    notify: noNotifier,
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
