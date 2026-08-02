// Rehydrating a brain on a SECOND machine (F14).
//
// `.mcp.json` and `.claude/settings.json` bake an absolute path, so they are
// gitignored and never travel. Their `.template` siblings do travel, so a fresh
// clone can regenerate them offline — it only has to know THIS machine.
import { toPosix } from "./reconcile-brain.mjs";
import { nodeHookCommand } from "./rag-launcher.mjs";

// Everything the install generates that CANNOT travel through git, in the order a
// rehydrate must restore it: the two files baking an absolute path, the health
// canary note (its folder is gitignored, and it is seeded by the installer alone —
// without it a brain's health check can never prove its index answers), then the
// two dependency trees the installer builds.
const UNTRAVELLABLE = [
  ".mcp.json",
  ".claude/settings.json",
  "vault/engine-health/health-check.md",
  "rag/node_modules",
  "local-mirror/node_modules",
];

// What this brain is missing, on THIS machine. Pure: `exists(relPath)` is the only
// I/O, injected by the caller.
export function rehydrationPlan({ exists }) {
  return UNTRAVELLABLE.filter((relPath) => !exists(relPath));
}

// The placeholders that describe the MACHINE, and therefore the only ones a
// rehydrate has to resolve. The installer's own table (`installer.mjs`) adds the
// ones describing the OWNER — those are baked into files that DO survive a clone.
export function machineReplacements({ brainDir, platform, tmpDir }) {
  const projectRoot = toPosix(brainDir);
  return {
    "{{PROJECT_ROOT}}": projectRoot,
    "{{NODE}}": nodeHookCommand(platform, projectRoot),
    "{{TMP_DIR}}": toPosix(tmpDir),
  };
}
