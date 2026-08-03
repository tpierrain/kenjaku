import { readFile } from "fs/promises";
import { scanVault, type ScannedFile } from "./document-scanner.js";
import { parseDocument } from "./frontmatter-parser.js";
import { crosscheckIndex, type CrosscheckReport, type DiskNote } from "./index-crosscheck.js";
import { sha256 } from "./index-manager.js";
import { listIndexedDocs } from "./vector-store.js";

/**
 * The disk half of the crosscheck, behind injected ports (F15).
 *
 * ⚠️ The defaults MUST stay the engine's own scan / hash / parse, and this is not a
 * style preference: a verifier that walks or parses differently from the engine does
 * not verify the engine, it measures a fiction. The brain-side prototype called
 * gray-matter with its own options and reported 434 of 436 healthy notes as broken —
 * a false alarm on everything, which is indistinguishable from noise and gets ignored.
 * It also walked the vault itself, so it flagged `_template.md` and `.obsidian/`, which
 * `document-scanner.ts` deliberately skips.
 */
export interface CrosscheckScanPorts {
  scan: () => Promise<ScannedFile[]>;
  readFile: (absolutePath: string) => Promise<string>;
  /** The engine's parser. Throws exactly when the indexer would refuse the note. */
  parse: (raw: string, relativePath: string) => void;
}

export async function collectDiskNotes(ports: CrosscheckScanPorts): Promise<DiskNote[]> {
  const files = await ports.scan();
  const notes: DiskNote[] = [];
  for (const file of files) {
    let raw: string;
    try {
      raw = await ports.readFile(file.absolutePath);
    } catch (err) {
      // Dropping it here would be the worse lie: the note WOULD be on disk, and its
      // index row would then read as residue from a delete. Keep it, with no hash (so
      // it shows as out of step) and the OS reason.
      notes.push({
        path: file.relativePath,
        hash: "",
        parseError: err instanceof Error ? err.message : String(err),
      });
      continue;
    }
    let parseError: string | null = null;
    try {
      ports.parse(raw, file.relativePath);
    } catch (err) {
      // The message alone, like the indexer's own error path: the class name in front
      // of a diagnosis written for the owner only makes it read worse.
      parseError = err instanceof Error ? err.message : String(err);
    }
    notes.push({ path: file.relativePath, hash: sha256(raw), parseError });
  }
  return notes;
}

/**
 * The engine's OWN eyes, and the reason the defaults live here rather than in each
 * caller: the command and the session probe must never be able to disagree about what
 * the vault holds. `scanVault` skips `_template.md` and `.obsidian/` exactly as the
 * indexer does; `parseDocument` throws exactly when the indexer refuses a note.
 */
export const defaultScanPorts: CrosscheckScanPorts = {
  scan: () => scanVault(),
  readFile: (absolutePath) => readFile(absolutePath, "utf-8"),
  parse: (raw, relativePath) => {
    parseDocument(raw, relativePath);
  },
};

/** One crosscheck: what the vault holds on disk, against what the index really holds. */
export async function runCrosscheck(
  ports: CrosscheckScanPorts = defaultScanPorts,
  listIndexed: () => Array<{ path: string; hash: string; chunks: number }> = listIndexedDocs,
): Promise<CrosscheckReport> {
  return crosscheckIndex({ disk: await collectDiskNotes(ports), indexed: listIndexed() });
}
