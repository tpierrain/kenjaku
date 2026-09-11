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

// Every NON-note file under `vaultDir` — the screenshot pasted into a meeting note,
// the PDF dropped beside a decision — path relative to the vault and POSIX-separated,
// exactly like readVaultNotes. Paths only: nothing here is read or parsed, because the
// only question asked of an attachment is "does it exist under this spelling?" (#71).
//
// It is deliberately the complement of readVaultNotes rather than a list of known
// image extensions: an allow-list would have to guess at `.excalidraw`, `.canvas`,
// `.webp` and whatever Obsidian supports next, and every miss is a permanent false
// "dangling link" nobody can clear. The pair partitions the vault, which the sibling
// test pins.
export function readVaultAttachments(vaultDir) {
  return listFilesRelPosix(vaultDir).filter((rel) => !rel.endsWith(".md"));
}
