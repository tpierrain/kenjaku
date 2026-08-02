// Rehydrating a brain on a SECOND machine (F14).
//
// `.mcp.json` and `.claude/settings.json` bake an absolute path, so they are
// gitignored and never travel. Their `.template` siblings do travel, so a fresh
// clone can regenerate them offline — it only has to know THIS machine.
import { toPosix } from "./reconcile-brain.mjs";
import { nodeHookCommand } from "./rag-launcher.mjs";

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
