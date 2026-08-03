// ─────────────────────────────────────────────────────────────────────────────
// rag-status.mjs — decides the "RAG" line of the SessionStart banner from facts
// already collected (no I/O here → testable): the DB's document count, the .md
// files on disk, and the last catch-up run's persisted state (`last-run.json`).
//
// F11/F12 — why the last run's errors belong on THIS line. A note the indexer
// refuses (unparseable frontmatter) is scanned, never indexed, and lands in the
// shortfall — which this banner used to render as `N pending — auto catch-up in
// the background`, asserting a recovery that CANNOT happen: the next run rejects
// the same bytes the same way. The engine did know the file and the cause; it
// wrote them to `last-run.json`, i.e. away from the counter the eye is drawn to.
// Waiting and failing are two opposite states, and they were rendered identically.
// ─────────────────────────────────────────────────────────────────────────────

// Where the engine persists the last catch-up run (FileProgressStorage, `CACHE_DIR`).
// Brain-relative, and pinned to the engine's own constants by a guard test (F16: a
// surface that re-derives the engine's paths measures a fiction the day one moves).
export const LAST_RUN_REL = "rag/.cache/last-run.json";

// The failures worth naming, truncated (2 max + a count of the rest): the banner is
// read at a glance, and a wall of stack-like strings is skipped like noise.
function describeFailures(errors, max = 2) {
  const shown = errors.slice(0, max).join("; ");
  const rest = errors.length - max;
  return rest > 0 ? `${shown} (+${rest} other(s))` : shown;
}

export function ragStatusLine({ docs, scanned, lastRun }) {
  if (scanned === 0) {
    return "🧠 RAG: empty vault — add Markdown notes in vault/ then run 'cd rag && npm run reindex'.";
  }
  // `docs === null` = we could not read the DB (module absent, DB being written). That is
  // NOT "nothing is indexed", and it must never be rendered as a count.
  if (docs === null) {
    return "🧠 RAG: status unavailable (server starting up, or engine not installed).";
  }

  const failures = lastRun?.errors ?? [];
  const remaining = scanned - docs;

  // A shortfall the last run already EXPLAINED. Reported only while the shortfall
  // lasts: once the note is repaired and indexed, the stale error must not keep
  // alarming (the run state is only rewritten by the next run).
  if (remaining > 0 && failures.length > 0) {
    // The rest of the shortfall IS genuinely queued — say so on the same line rather
    // than let one broken note silence the wait, or the wait hide the broken note.
    const queued = Math.max(0, remaining - failures.length);
    const waiting = queued > 0 ? `, ${queued} pending` : "";
    return (
      `🧠 RAG: ${docs}/${scanned} files indexed, ${failures.length} failed${waiting} — ` +
      `${describeFailures(failures)}. This will NOT resolve on its own: repair the note ` +
      `(or ask me to), then reindex.`
    );
  }

  // A shortfall nothing explains: genuinely queued work the background catch-up picks up.
  if (remaining > 0) {
    return `🧠 RAG: ${docs}/${scanned} files indexed, ${remaining} pending — auto catch-up in the background.`;
  }

  return `🧠 RAG up to date — ${docs}/${scanned} files indexed.`;
}
