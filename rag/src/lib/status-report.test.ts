import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildStatusReport,
  incompleteIndexWarning,
  formatWatcherLiveness,
} from "./status-report.js";
import type { RunProgress } from "./progress-report.js";
import type { SchedulerState } from "./reindex-scheduler.js";

const idle: SchedulerState = { scheduled: false, running: false, pending: false };

// ─── formatWatcherLiveness — exact strings (reflex #2: pin the whole line) ───

test("F.live — watcher inactive → exact inactive line", () => {
  assert.equal(
    formatWatcherLiveness({ active: false }),
    "Live-stream watcher: inactive.",
  );
});

test("F.live — active + explicit idle state → exact idle line", () => {
  assert.equal(
    formatWatcherLiveness({ active: true, state: idle }),
    "Live-stream watcher: active (idle).",
  );
});

test("F.live — active + NO state (null) → idle line, no throw on optional chaining", () => {
  // Pins the `state?.running` / `state?.scheduled` optional-chaining: dropping
  // the `?.` would throw a TypeError when state is null/undefined.
  assert.equal(
    formatWatcherLiveness({ active: true, state: null }),
    "Live-stream watcher: active (idle).",
  );
  assert.equal(
    formatWatcherLiveness({ active: true }),
    "Live-stream watcher: active (idle).",
  );
});

test("F.live — active + reindex scheduled (debounce) → exact scheduled line", () => {
  assert.equal(
    formatWatcherLiveness({ active: true, state: { ...idle, scheduled: true } }),
    "Live-stream watcher: active — write detected, reindex scheduled (debounce).",
  );
});

test("F.live — active + reindex in progress, no burst → exact line, NO pending suffix", () => {
  // Pins the ternary else-branch (`... : ""`): a mutant appending a suffix here
  // must change the exact string.
  assert.equal(
    formatWatcherLiveness({ active: true, state: { ...idle, running: true } }),
    "Live-stream watcher: active — reindex in progress.",
  );
});

test("F.live — active + run in progress WITH burst pending → exact line + \"(burst pending)\"", () => {
  assert.equal(
    formatWatcherLiveness({
      active: true,
      state: { scheduled: false, running: true, pending: true },
    }),
    "Live-stream watcher: active — reindex in progress (burst pending).",
  );
});

// ─── buildStatusReport — exact whole-report assertions ───

test("3.1a — complete index, gemini/default provider → exact 2-line report", () => {
  // Whole-report equality pins the "\n" join separator AND that no null line is
  // pushed when lock/progress are absent (if(lock)/if(progress) guards).
  const report = buildStatusReport({
    docCount: 42,
    scannedCount: 42,
    quotaUsed: 0,
    quotaMax: 950,
    reserve: 50,
    lock: null,
  });

  assert.equal(
    report,
    "Index up to date: 42/42 files indexed.\n" +
      "Quota: 0/950 used today, 950 remaining (reserve 50 for search).",
  );
});

// F21 repointed the expectation of this test and of `4.2` below, deliberately: with NO run
// recorded, "auto-resume on the next session" was a promise made from two numbers. Absent is
// not "nothing failed" — it is "nothing is recorded", and asking now costs one run.
test("3.1b — incomplete index → exact Y/X indexed + Z pending + the cause it can actually support", () => {
  const report = buildStatusReport({
    docCount: 30,
    scannedCount: 42,
    quotaUsed: 0,
    quotaMax: 950,
    reserve: 50,
    lock: null,
  });

  assert.equal(
    report,
    "Index incomplete: 30/42 files indexed, 12 pending — they arrived after the last scan; catching up now.\n" +
      "Quota: 0/950 used today, 950 remaining (reserve 50 for search).",
  );
});

test("3.1c — quota line: used / max / remaining + search reserve (exact)", () => {
  const report = buildStatusReport({
    docCount: 42,
    scannedCount: 42,
    quotaUsed: 200,
    quotaMax: 950,
    reserve: 50,
    lock: null,
  });

  assert.equal(
    report,
    "Index up to date: 42/42 files indexed.\n" +
      "Quota: 200/950 used today, 750 remaining (reserve 50 for search).",
  );
});

test("3.1c-bis — explicit providerId \"gemini\" → the Gemini quota line (not the local line)", () => {
  // Triangulates the `providerId === "gemini"` branch: an explicit gemini must
  // route to the quota line, distinct from the undefined (backward-compat) path.
  const report = buildStatusReport({
    docCount: 42,
    scannedCount: 42,
    quotaUsed: 200,
    quotaMax: 950,
    reserve: 50,
    lock: null,
    providerId: "gemini",
  });

  assert.equal(
    report,
    "Index up to date: 42/42 files indexed.\n" +
      "Quota: 200/950 used today, 750 remaining (reserve 50 for search).",
  );
});

test("3.1d — lock present → exact \"reindex in progress (PID …)\" third line", () => {
  const report = buildStatusReport({
    docCount: 42,
    scannedCount: 42,
    quotaUsed: 0,
    quotaMax: 950,
    reserve: 50,
    lock: { pid: 12345, acquiredAt: "2026-05-31T11:59:00Z" },
  });

  assert.equal(
    report,
    "Index up to date: 42/42 files indexed.\n" +
      "Quota: 0/950 used today, 950 remaining (reserve 50 for search).\n" +
      "Reindex in progress (PID 12345).",
  );
});

test("3.1d — no lock → no mention of reindex in progress", () => {
  const report = buildStatusReport({
    docCount: 42,
    scannedCount: 42,
    quotaUsed: 0,
    quotaMax: 950,
    reserve: 50,
    lock: null,
  });

  assert.doesNotMatch(report, /reindex in progress/i);
});

// ─── incompleteIndexWarning (leaf) ───

test("4.2 — incompleteIndexWarning: incomplete index → the cause, not a resume it cannot know", () => {
  assert.equal(
    incompleteIndexWarning({ docCount: 30, scannedCount: 42 }),
    "Index incomplete: 30/42 files indexed, 12 pending — they arrived after the last scan; catching up now.",
  );
});

test("4.2 — incompleteIndexWarning: a wall IS a wait, and keeps the resume promise it earns", () => {
  // The one case the original sentence was written for. It has to keep saying it, or F21's
  // fix would have swapped one wrong cause for another.
  assert.equal(
    incompleteIndexWarning({
      docCount: 30,
      scannedCount: 42,
      progress: finishedRun({ hitCap: true, scanned: 42 }),
    }),
    "Index incomplete: 30/42 files indexed, 12 pending — auto-resume on the next session.",
  );
});

test("4.2 — incompleteIndexWarning: complete index → null (nothing to surface)", () => {
  assert.equal(incompleteIndexWarning({ docCount: 42, scannedCount: 42 }), null);
});

// ─── progress line — the `now ?? startedAt` fallback drives rate/ETA ───

test("C.13 — progress running with `now` → exact 3-line report (now, not startedAt, drives ETA)", () => {
  const progress: RunProgress = {
    status: "running",
    startedAt: "2026-05-31T18:00:00Z",
    totalChunks: 660,
    doneChunks: 120,
    scanned: 211,
    indexed: 18,
    skipped: 50,
    removed: 0,
    errors: [],
    hitCap: false,
  };

  const report = buildStatusReport({
    docCount: 120,
    scannedCount: 211,
    quotaUsed: 200,
    quotaMax: 950,
    reserve: 50,
    lock: null,
    progress,
    now: "2026-05-31T18:01:00Z", // 1 min after startedAt → rate 120/min, ETA 5 min
  });

  // Using startedAt instead of `now` (the `?? → &&` mutant) would zero the
  // elapsed time → "~0/min, ETA unknown".
  assert.equal(
    report,
    // F21: the run is `status: "running"`, so the shortfall is being closed as it is read —
    // the one wait nobody has to be told to wait for.
    "Index incomplete: 120/211 files indexed, 91 pending — a catch-up is running right now.\n" +
      "Quota: 200/950 used today, 750 remaining (reserve 50 for search).\n" +
      "Catch-up in progress: 120/660 chunks (18 %), ~120/min, ETA ~5 min, 0 error(s).",
  );
});

test("C.13 — progress running with `now` OMITTED → falls back to startedAt (elapsed 0 → ETA unknown)", () => {
  // Triangulates the other side of `now ?? progress.startedAt`: with no `now`,
  // the fallback to startedAt gives zero elapsed → rate 0 → ETA unknown.
  const progress: RunProgress = {
    status: "running",
    startedAt: "2026-05-31T18:00:00Z",
    totalChunks: 660,
    doneChunks: 120,
    scanned: 211,
    indexed: 18,
    skipped: 50,
    removed: 0,
    errors: [],
    hitCap: false,
  };

  const report = buildStatusReport({
    docCount: 120,
    scannedCount: 211,
    quotaUsed: 200,
    quotaMax: 950,
    reserve: 50,
    lock: null,
    progress,
    // now omitted
  });

  assert.match(report, /Catch-up in progress: 120\/660 chunks \(18 %\), ~0\/min, ETA unknown, 0 error\(s\)\./);
});

test("C.13 — no progress → no Catch-up section", () => {
  const report = buildStatusReport({
    docCount: 42,
    scannedCount: 42,
    quotaUsed: 0,
    quotaMax: 950,
    reserve: 50,
    lock: null,
  });

  assert.doesNotMatch(report, /catch-up/i);
});

// ─── embedding line per provider — exact, triangulated across all 3 branches ───

test("3.1e — in-process embedder (transformers-js) → exact local line, NO Gemini quota", () => {
  const report = buildStatusReport({
    docCount: 7,
    scannedCount: 7,
    quotaUsed: 0,
    quotaMax: 7600,
    reserve: 50,
    lock: null,
    providerId: "transformers-js",
  });

  assert.equal(
    report,
    "Index up to date: 7/7 files indexed.\n" +
      "Local embeddings (in-process): unlimited, offline — no API quota.",
  );
});

test("3.1f — OpenAI-compatible embedder → exact endpoint line (no offline promise)", () => {
  const report = buildStatusReport({
    docCount: 7,
    scannedCount: 7,
    quotaUsed: 0,
    quotaMax: 7600,
    reserve: 50,
    lock: null,
    providerId: "openai-compatible",
  });

  assert.equal(
    report,
    "Index up to date: 7/7 files indexed.\n" +
      "Embeddings via OpenAI-compatible endpoint: no Gemini quota tracked.",
  );
});

test("3.1g — any other provider → exact generic \"Embeddings via <id>\" fallback line", () => {
  // Triangulates the third branch of localEmbeddingLine: a provider that is
  // neither transformers-js nor openai-compatible names itself verbatim.
  const report = buildStatusReport({
    docCount: 7,
    scannedCount: 7,
    quotaUsed: 0,
    quotaMax: 7600,
    reserve: 50,
    lock: null,
    providerId: "mistral-embed",
  });

  assert.equal(
    report,
    "Index up to date: 7/7 files indexed.\n" +
      "Embeddings via mistral-embed: no Gemini quota tracked.",
  );
});

// ─── F21: the shortfall line stops promising a resume it cannot know is coming ───
// It was made from two numbers and nothing else, so `vault_stats` answered "19 pending —
// auto-resume on the next session" with the watcher idle, a local embedder (no quota to wait
// for) and nothing failed. The cause model is `describeShortfall`, read from the run state
// the engine already writes — the SAME state the SessionStart banner reads (F11/F12), not a
// second opinion.
const finishedRun = (over: Partial<RunProgress> = {}): RunProgress => ({
  status: "done",
  startedAt: "2026-08-05T06:00:00Z",
  finishedAt: "2026-08-05T06:02:00Z",
  totalChunks: 100,
  doneChunks: 100,
  scanned: 458,
  indexed: 12,
  skipped: 427,
  removed: 0,
  errors: [],
  hitCap: false,
  ...over,
});

test("F21 — notes the indexer refused are named, and the line says it will NOT fix itself", () => {
  assert.equal(
    incompleteIndexWarning({
      docCount: 439,
      scannedCount: 441,
      progress: finishedRun({ errors: ["a.md: bad frontmatter"] }),
    }),
    "Index incomplete: 439/441 files indexed, 1 failed, 1 pending — a.md: bad frontmatter. " +
      "This will NOT resolve on its own: repair the note (or ask me to), then reindex.",
  );
});

test("F21 — notes that arrived after the scan are caught up NOW, not promised to a next session", () => {
  assert.equal(
    incompleteIndexWarning({ docCount: 439, scannedCount: 458, progress: finishedRun() }),
    "Index incomplete: 439/458 files indexed, 19 pending — they arrived after the last scan; catching up now.",
  );
});

test("F21 — a run still in flight is the one wait that needs no explaining", () => {
  assert.equal(
    incompleteIndexWarning({ docCount: 120, scannedCount: 211, progress: finishedRun({ status: "running" }) }),
    "Index incomplete: 120/211 files indexed, 91 pending — a catch-up is running right now.",
  );
});

test("F21 — a catch-up that closed nothing stops promising, and names the tool that can look", () => {
  // The bound, on the surface: the engine has already asked once and the gap did not move, so
  // repeating "catching up now" would be the same false promise in a newer coat.
  assert.equal(
    incompleteIndexWarning({
      docCount: 439,
      scannedCount: 458,
      progress: finishedRun(),
      lastCatchUpRemaining: 19,
    }),
    "Index incomplete: 439/458 files indexed, 19 pending — a catch-up just ran and closed none of them. " +
      "This will NOT resolve on its own: run `node scripts/verify-index.mjs` to see which notes disagree.",
  );
});

test("F21 — when the failures ARE the whole shortfall, nothing is described as pending", () => {
  // The boundary the `, N pending` suffix turns on: two missing notes, two refusals, so
  // there is no queue at all. Without it, a reader is told to wait for zero notes.
  assert.equal(
    incompleteIndexWarning({
      docCount: 439,
      scannedCount: 441,
      progress: finishedRun({ errors: ["a.md: bad frontmatter", "b.md: unreadable"] }),
    }),
    "Index incomplete: 439/441 files indexed, 2 failed — a.md: bad frontmatter; b.md: unreadable. " +
      "This will NOT resolve on its own: repair the note (or ask me to), then reindex.",
  );
});

test("F21 — a long list of refusals is truncated, and says how many it is not showing", () => {
  // Three failures against a bound of two: the only fixture that tells the truncation from
  // the whole list, the separator from nothing, and `+N other(s)` from silence.
  assert.equal(
    incompleteIndexWarning({
      docCount: 438,
      scannedCount: 441,
      progress: finishedRun({ errors: ["a.md: bad", "b.md: worse", "c.md: worst"] }),
    }),
    "Index incomplete: 438/441 files indexed, 3 failed — a.md: bad; b.md: worse (+1 other(s)). " +
      "This will NOT resolve on its own: repair the note (or ask me to), then reindex.",
  );
});
