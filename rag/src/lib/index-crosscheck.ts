// ═══════════════════════════════════════════════════════════════════════════
// index-crosscheck.ts — the PURE diff between what the vault holds on disk and what
// the index actually holds (F15). It does NOT trust the engine's own counters: those
// count what a run *attempted*, and the worst failure mode is invisible to them.
//
// WHY (field session, 2026-08-02). A note was written, committed, and kept ANSWERING
// — from the content it was last indexed with. Its frontmatter had been damaged since,
// so every re-read failed; the note stayed in the index, plausible and out of date,
// while the counters read all-green. `frontmatter-parser.ts` even documents the outcome
// verbatim ("this note keeps answering from the content it was last indexed with") and
// nothing watched for it. A brain that is partly broken while looking healthy is worse
// than one that is loudly broken.
//
// The five modes, and why each is silent today:
//   • stale            — indexed, answering, from OLD content (hash drift). The sneakiest:
//                        a perfect 436/436 count cannot see it. THE reason this file exists.
//   • unreadable       — the engine's parser refuses the note, so no re-read can ever land.
//   • missingFromIndex — on disk, committed, and unfindable by search. Nothing announces it.
//   • emptyInIndex     — counted as a document, contributing no retrievable chunk.
//   • goneFromDisk     — residue of a delete/rename. Free to detect, so we do.
//
// Pure & deterministic (ADR 0009): the I/O — walking the vault, hashing, parsing, reading
// SQLite — lives in the caller, and MUST be the engine's own (`scanVault`, `sha256`,
// `parseDocument`). A verifier that scans or parses differently from the engine does not
// verify the engine, it measures a fiction: the brain-side prototype reported 434 of 436
// notes as broken because it called gray-matter with different options.
// ═══════════════════════════════════════════════════════════════════════════

export interface DiskNote {
  path: string;
  hash: string;
  /** The message the ENGINE's own parser gave on this note, when it refused it. */
  parseError?: string | null;
}

export interface IndexedDoc {
  path: string;
  hash: string;
  chunks: number;
}

export interface CrosscheckReport {
  stale: string[];
  goneFromDisk: string[];
  missingFromIndex: string[];
  emptyInIndex: string[];
  unreadable: Array<{ path: string; reason: string }>;
}

export function crosscheckIndex(input: {
  disk: DiskNote[];
  indexed: IndexedDoc[];
}): CrosscheckReport {
  const diskHash = new Map(input.disk.map((note) => [note.path, note.hash]));
  const stale = input.indexed
    .filter((doc) => diskHash.has(doc.path) && diskHash.get(doc.path) !== doc.hash)
    .map((doc) => doc.path);
  const goneFromDisk = input.indexed
    .filter((doc) => !diskHash.has(doc.path))
    .map((doc) => doc.path);
  const indexedPaths = new Set(input.indexed.map((doc) => doc.path));
  const missingFromIndex = input.disk
    .filter((note) => !indexedPaths.has(note.path))
    .map((note) => note.path);
  const emptyInIndex = input.indexed
    .filter((doc) => doc.chunks === 0)
    .map((doc) => doc.path);
  const unreadable = input.disk
    .filter((note) => note.parseError)
    .map((note) => ({ path: note.path, reason: note.parseError as string }));
  return { stale, goneFromDisk, missingFromIndex, emptyInIndex, unreadable };
}
