// ─────────────────────────────────────────────────────────────────────────────
// tsx-invocation.mjs — where tsx lives, and how a node script asks for it.
//
// Field report 2026-08-07, defect 3. `npx tsx rag/src/<cli>.ts` looked local and
// was not: these spawns run with cwd = the BRAIN ROOT, where there is no
// node_modules at all (tsx is a devDependency of `rag/` and of `local-mirror/`).
// npx could not resolve it locally, fell back to its own cache, and paid a
// registry round-trip — 1.55 s on the maintainer's Mac, 9.8 s on the reporters'
// Windows machines, against 0.30 s for a direct call. The launchers pay that
// once per session start; this module is the same fix for the probes.
//
// It matters beyond speed: the live-health plan prices a SYNCHRONOUS per-session
// probe at the direct figure. At npx's figure the same design would add up to
// ten seconds to every session start on the very machines already timing out.
//
// The invocation is returned as a VALUE rather than spawned here — the lesson
// this repo has now paid for twice (a real child-process runner nothing
// observed). A value can be asserted on both platforms without spawning.
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync } from "node:fs";
import { join } from "node:path";

import { needsShell } from "./spawn-shell.mjs";

/** Where tsx's CLI sits inside a package, stated once. The launchers embed the same path in shell syntax. */
export const TSX_CLI_REL = "node_modules/tsx/dist/cli.mjs";

/**
 * What to spawn to run `script` (a path relative to the brain root, e.g.
 * `rag/src/health-check-cli.ts`) through tsx. Returns `{ command, args, shell }`,
 * ready to hand to spawn/spawnSync with `cwd: brainDir`.
 *
 * Prefers the tsx installed beside the script's OWN package; falls back to npx so a
 * half-installed tree still works, just slowly. `exists` and `nodeExe` are seams: the
 * default `nodeExe` is the running interpreter, which is known for certain — going back
 * through PATH would re-open the hole the launchers' PATH self-heal exists to plug.
 */
export function tsxInvocation({ brainDir, platform = process.platform, script, args = [], exists = existsSync, nodeExe = process.execPath }) {
  const pkg = script.split("/")[0];
  const cli = join(brainDir, pkg, ...TSX_CLI_REL.split("/"));
  if (exists(cli)) return { command: nodeExe, args: [cli, script, ...args], shell: false };

  // ADR 0015 / 0031: npx is a shell-wrapped `.cmd` on Windows, and spawning a `.cmd`
  // without a shell throws EINVAL since Node ≥ 18.20 (CVE-2024-27980). The direct call
  // above is a real binary and needs none of that.
  const npx = platform === "win32" ? "npx.cmd" : "npx";
  return { command: npx, args: ["tsx", script, ...args], shell: needsShell(npx, platform) };
}
