#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// rehydrate.mjs — run FROM the brain folder on a SECOND machine, right after
// `git clone`, to rebuild everything the install generates but git cannot carry
// (F14): the two files baking an absolute path, the health canary note, and the
// two dependency trees.
//
// Offline and idempotent: the `.template` siblings already travel in the clone, so
// there is nothing to fetch and no source repo to point at. A brain that needs
// nothing is left strictly untouched.
//
//   node scripts/rehydrate.mjs
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

import { CANARY_NOTE, machineReplacements, rehydrationPlan } from "./lib/brain-rehydrate.mjs";
import { rerecordEngineWrite } from "./lib/engine-base-fs.mjs";
import { applyLaunchers, buildRagInstallInvocation } from "./lib/rag-launcher.mjs";
import { needsShell } from "./lib/spawn-shell.mjs";
import { seedHealthNote } from "./lib/staged-health-note.mjs";
import { runAsEntrypoint } from "./lib/entrypoint.mjs";

// The real wiring for runRehydrate — every side effect of the command, named so the
// glue itself stays under test (a mis-wire here would pass every behaviour test).
export const realRehydrateDeps = {
  cwd: () => process.cwd(),
  platform: process.platform,
  tmpDir: () => tmpdir(),
  exists: (path) => existsSync(path),
  readFile: (path) => readFileSync(path, "utf8"),
  writeFile: (path, content) => {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  },
  seedHealthNote,
  rerecordEngineWrite,
  installInvocation: buildRagInstallInvocation,
  spawnSync,
  log: (line) => console.log(line),
  error: (line) => console.error(line),
};

// Deletes nothing, overwrites nothing: only what is MISSING gets rebuilt.
// Returns the process exit code; every side effect comes through `deps`.
export function runRehydrate(argv, deps = realRehydrateDeps) {
  const root = deps.cwd();
  const missing = rehydrationPlan({ exists: (relPath) => deps.exists(join(root, relPath)) });

  if (missing.length === 0) {
    deps.log("Nothing to do — this brain is already wired for this machine.");
    return 0;
  }

  const replacements = machineReplacements({
    brainDir: root,
    platform: deps.platform,
    tmpDir: deps.tmpDir(),
  });

  if (missing.includes(".mcp.json")) {
    const rendered = substitute(deps.readFile(join(root, ".mcp.json.template")), replacements);
    const mcp = applyLaunchers(JSON.parse(rendered), deps.platform);
    deps.writeFile(join(root, ".mcp.json"), JSON.stringify(mcp, null, 2) + "\n");
    deps.log("✓ regenerated .mcp.json");
  }

  if (missing.includes(".claude/settings.json")) {
    const template = deps.readFile(join(root, ".claude", "settings.json.template"));
    deps.writeFile(join(root, ".claude", "settings.json"), substitute(template, replacements));
    deps.log("✓ regenerated .claude/settings.json");

    // 🚨 THE ENGINE JUST WROTE ONE OF ITS OWN MERGE FILES (S4 of the second review pass).
    // This file bakes an absolute path, so it is gitignored and rebuilt here — while the
    // manifest recording its digest is TRACKED and travelled in the clone. Without this
    // line the second machine holds its own bytes against machine A's sha and is told, at
    // every session start and un-dismissably, that it is holding the file back.
    //
    // Same act as the installer's, through the same door, and for the same one-sentence
    // rule: a file the ENGINE wrote must never read as a file the OWNER is holding back.
    // It also lays down `.engine-base/.claude/settings.json` — the ancestor THIS machine
    // holds, which is what the divergence report then judges against.
    //
    // Gated on the WRITE, never run unconditionally: a rehydrate that only rebuilt a
    // dependency tree has written no engine file, and re-recording there would hand an
    // amnesty to whatever the owner had edited before the clone.
    deps.rerecordEngineWrite({ brainDir: root, rels: [".claude/settings.json"] });
  }

  if (missing.includes(CANARY_NOTE)) {
    deps.seedHealthNote({ sourceDir: root, brainDir: root });
    deps.log(`✓ reseeded ${CANARY_NOTE}`);
  }

  if (missing.includes("rag/node_modules")) {
    // Native binding (better-sqlite3): built through the launcher's own self-heal
    // PATH, so it is moulded for the Node that will later load it (ADR 0021-A).
    const invocation = deps.installInvocation(deps.platform, join(root, "rag"));
    if (!installTree(deps, root, "rag", invocation)) return 1;
  }

  if (missing.includes("local-mirror/node_modules")) {
    // Pure JS server: no native binding, so no self-heal build — a plain install.
    // npm.cmd needs a shell since Node ≥ 18.20 (CVE-2024-27980) or EINVAL; no-op POSIX (ADR 0031).
    const NPM = deps.platform === "win32" ? "npm.cmd" : "npm";
    if (!installTree(deps, root, "local-mirror", { command: NPM, args: ["install", "--silent"] }))
      return 1;
  }

  // The one step no file can carry: Claude freezes its working directory, its MCP
  // servers and its hooks when a session STARTS, so the freshly rebuilt wiring only
  // exists for a conversation opened after this point.
  deps.log("");
  deps.log(
    "→ Now open a NEW conversation rooted in this folder: the MCP servers and the hooks are loaded when a session starts, so an already-open one still runs on the old wiring.",
  );

  return 0;
}

// One dependency tree, installed and reported the way a second machine needs to
// hear it: on failure, the exact command to run by hand — never a silent stop.
// Returns whether it succeeded. `cleanup` removes the temp win32 install script,
// pass or fail (absent / a no-op everywhere else).
function installTree(deps, root, dirName, { command, args, cleanup = () => {} }) {
  const { status } = deps.spawnSync(command, args, {
    cwd: join(root, dirName),
    stdio: "inherit",
    shell: needsShell(command, deps.platform),
  });
  cleanup();
  if (status !== 0) {
    deps.error(`✗ npm install failed in ${dirName}/ — run it by hand:  cd ${dirName} && npm install`);
    return false;
  }
  deps.log(`✓ installed the ${dirName}/ dependencies`);
  return true;
}

function substitute(content, replacements) {
  let out = content;
  for (const [k, v] of Object.entries(replacements)) out = out.split(k).join(v);
  return out;
}

runAsEntrypoint(import.meta.url, process.argv, runRehydrate);
