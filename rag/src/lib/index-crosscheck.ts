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

import { STALE_ANSWER_CLAUSE } from "./frontmatter-parser.js";

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

/**
 * The findings the engine CANNOT clear on its own — the only ones a per-session probe
 * is allowed to be loud about (ADR 0028: never cry wolf).
 *
 * Most of the report is transient BY DESIGN: a note edited in Obsidian since the last
 * session, or pulled from another machine, is drifted or absent for a few seconds until
 * the watcher re-indexes it. A probe that shouted at those would fire at nearly every
 * session start, and would be muted within a week — taking the real signal with it.
 * A note whose frontmatter the parser REFUSES is the opposite: every re-read fails the
 * same way, forever, so no reindex will ever clear it. That one deserves the alarm — and
 * its reason names the F15 shape out loud, because "damaged frontmatter" reads like a
 * cosmetic defect while the note goes on answering, plausibly, from old content.
 */
export function permanentFindings(
  report: CrosscheckReport
): Array<{ path: string; reason: string }> {
  const stale = new Set(report.stale);
  const missing = new Set(report.missingFromIndex);
  const unreadable = report.unreadable.map((entry) => {
    // The two halves of the same defect, and they read to the user in opposite ways:
    // one answers with old content, the other cannot be found at all.
    const consequence = entry.reason.includes(STALE_ANSWER_CLAUSE)
      ? // The parser already spelled the consequence out (the duplicate-key message
        // does); repeating it behind its own words helps nobody.
        null
      : stale.has(entry.path)
        ? "this note keeps ANSWERING from the content it was last indexed with"
        : missing.has(entry.path)
          ? "this note is absent from the index, so search cannot find it at all"
          : null;
    return {
      path: entry.path,
      reason: consequence ? `${entry.reason} — until it is fixed, ${consequence}` : entry.reason,
    };
  });
  // A 0-chunk row never heals by itself either: its content is unchanged, so the
  // incremental diff (shouldSkip) skips it on every later run — forever unsearchable.
  const empty = report.emptyInIndex.map((path) => ({
    path,
    reason:
      "indexed but holding no chunk — it is counted as a note and retrievable by nothing, " +
      "and an unchanged note is skipped by every later reindex",
  }));
  return [...unreadable, ...empty];
}

/** The report as human-readable lines — clean first, because that is the common case. */
export function reportLines(report: CrosscheckReport): string[] {
  const affected = affectedNotes(report);
  if (affected.length === 0) {
    return ["✓ The index holds exactly what the vault holds."];
  }
  const lines = [
    `✗ ${affected.length} note${affected.length === 1 ? " is" : "s are"} out of step with ` +
      `the index — this brain is not answering from all of them.`,
  ];
  const section = (label: string, why: string, items: string[]) => {
    if (items.length === 0) return;
    lines.push("", `${label} (${items.length}) — ${why}:`);
    for (const item of items) lines.push(`  ${item}`);
  };
  // Worst first: a note that ANSWERS from old content is the one a reader would never
  // suspect, so it must not sit below the modes that at least fail visibly.
  section(
    "Answering from STALE content",
    "indexed, still answering, from what it held before",
    report.stale
  );
  section(
    "Frontmatter the engine REFUSES",
    "no re-read can land until it is fixed",
    report.unreadable.map((entry) => `${entry.path} — ${entry.reason}`)
  );
  section(
    "On disk but ABSENT from the index",
    "committed, and unfindable by search",
    report.missingFromIndex
  );
  section(
    "Indexed but holding NO chunk",
    "counted as a note, retrievable by nothing",
    report.emptyInIndex
  );
  section(
    "In the index but GONE from disk",
    "residue of a delete or a rename",
    report.goneFromDisk
  );
  return lines;
}

/**
 * The DISTINCT notes the report is about, sorted — one note hit by two modes at once
 * (the canonical F15 case: damaged frontmatter AND still answering from old content)
 * is one note out of step, not two. This is what a headline count must be built on:
 * summing the buckets would inflate the very case the check exists for.
 */
export function affectedNotes(report: CrosscheckReport): string[] {
  return [
    ...new Set([
      ...report.stale,
      ...report.goneFromDisk,
      ...report.missingFromIndex,
      ...report.emptyInIndex,
      ...report.unreadable.map((entry) => entry.path),
    ]),
  ].sort();
}
