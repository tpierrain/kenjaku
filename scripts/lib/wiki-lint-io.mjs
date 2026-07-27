// ─────────────────────────────────────────────────────────────────────────────
// wiki-lint-io.mjs — the fs adapter (ADR 0009 rung 2) for the `/lint` wiki-health
// scanner. It reads a real vault into the parsed-note shape { path, frontmatter,
// body } that the pure core in wiki-lint.mjs consumes.
//
// The frontmatter reader itself lives in note-parse.mjs (pure, dependency-free)
// and is re-exported here for the callers that have always imported it from this
// module.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { listFilesRelPosix } from "./fs-walk.mjs";
import { parseNote } from "./note-parse.mjs";

// Re-exported so existing callers (and tests) keep importing it from here; the
// implementation now lives in a pure module so non-fs cores can use it too.
export { parseNote };

// Read every .md file under `vaultDir` into the parsed-note shape, path relative
// to the vault and POSIX-separated (so the pure core's basename/prefix logic is
// platform-independent).
export function readVaultNotes(vaultDir) {
  return listFilesRelPosix(vaultDir)
    .filter((rel) => rel.endsWith(".md"))
    .map((rel) => ({ path: rel, ...parseNote(readFileSync(join(vaultDir, rel), "utf8")) }));
}
