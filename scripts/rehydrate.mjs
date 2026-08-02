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
import { join } from "node:path";

import { CANARY_NOTE, machineReplacements, rehydrationPlan } from "./lib/brain-rehydrate.mjs";
import { applyLaunchers } from "./lib/rag-launcher.mjs";

// Deletes nothing, overwrites nothing: only what is MISSING gets rebuilt.
// Returns the process exit code; every side effect comes through `deps`.
export function runRehydrate(argv, deps) {
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
  }

  if (missing.includes(CANARY_NOTE)) {
    deps.seedHealthNote({ sourceDir: root, brainDir: root });
    deps.log(`✓ reseeded ${CANARY_NOTE}`);
  }

  return 0;
}

function substitute(content, replacements) {
  let out = content;
  for (const [k, v] of Object.entries(replacements)) out = out.split(k).join(v);
  return out;
}
