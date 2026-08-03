// Rehydrating a brain on a SECOND machine (F14).
//
// `.mcp.json` and `.claude/settings.json` bake an absolute path, so they are
// gitignored and never travel. Their `.template` siblings do travel, so a fresh
// clone can regenerate them offline — it only has to know THIS machine.
import { toPosix } from "./reconcile-brain.mjs";
import { nodeHookCommand } from "./rag-launcher.mjs";
import { VAULT_NOTE as CANARY_NOTE } from "./staged-health-note.mjs";

export { CANARY_NOTE };

// Everything the install generates that CANNOT travel through git, in the order a
// rehydrate must restore it: the two files baking an absolute path, the health
// canary note (its folder is gitignored, and it is seeded by the installer alone —
// without it a brain's health check can never prove its index answers), then the
// two dependency trees the installer builds.
const UNTRAVELLABLE = [
  ".mcp.json",
  ".claude/settings.json",
  CANARY_NOTE,
  "rag/node_modules",
  "local-mirror/node_modules",
];

// The two files that make a machine WIRED: they name the MCP servers and the hooks,
// and they are the only ones baking an absolute path. Miss them and nothing engine-side
// runs, so nothing engine-side can self-repair — only the owner can, by running the
// command. Every other untravellable artifact heals on its own (the launcher rebuilds a
// dependency tree, the reconcile re-seeds), so it must not be read as an unwired machine.
const MACHINE_WIRING = [".mcp.json", ".claude/settings.json"];

// What this brain is missing, on THIS machine. Pure: `exists(relPath)` is the only
// I/O, injected by the caller.
export function rehydrationPlan({ exists }) {
  return UNTRAVELLABLE.filter((relPath) => !exists(relPath));
}

// Which of those missing artifacts mean "this machine was never wired" (subset of a
// `rehydrationPlan`, order preserved). Empty = whatever is missing, something else fixes.
export function unwiredFiles(missing) {
  return MACHINE_WIRING.filter((relPath) => missing.includes(relPath));
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
