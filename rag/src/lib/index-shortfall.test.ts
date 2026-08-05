import { test } from "node:test";
import assert from "node:assert/strict";
import { describeShortfall, CatchUpBound } from "./index-shortfall.js";
import type { RunProgress } from "./progress-report.js";

/** The engine's own record of a finished run, with only what a shortfall verdict reads varied. */
const run = (over: Partial<RunProgress> = {}): RunProgress => ({
  status: "done",
  startedAt: "2026-08-05T06:00:00Z",
  finishedAt: "2026-08-05T06:02:00Z",
  totalChunks: 100,
  doneChunks: 100,
  scanned: 441,
  indexed: 12,
  skipped: 427,
  removed: 0,
  errors: [],
  hitCap: false,
  ...over,
});

// F21 (field, 2026-08-05): `vault_stats` answered "19 pending — auto-resume on the next
// session" while the watcher was idle, the embedder was local (so there is no quota to wait
// for) and nothing had failed. The sentence was made from two numbers and nothing else, so it
// promised a recovery it could not know was coming. The run state the engine already writes
// says which of the three it is; this is the one place that reads it.
test("a complete index has no shortfall to describe", () => {
  assert.equal(describeShortfall({ docCount: 42, scannedCount: 42 }), null);
});

// A run that recorded refusals: the note is scanned, never indexed, and the next run will
// reject the same bytes the same way. This is F11/F12's cause, on the surface F11/F12 never
// reached — and it is the one the resume promise gets exactly backwards.
test("notes the indexer REFUSED are a failure, and the run named which", () => {
  assert.deepEqual(
    describeShortfall({ docCount: 439, scannedCount: 441, progress: run({ errors: ["a.md: bad frontmatter", "b.md: unreadable"] }) }),
    { remaining: 2, cause: "failures", failures: ["a.md: bad frontmatter", "b.md: unreadable"], queued: 0 },
  );
});

// The one case the original sentence was written for, and where it is TRUE: a run cut off by
// the daily cap resumes by itself, because the wall comes down at midnight. Note this run
// also has no errors — the two terms are separated on purpose (§9), so neither can be
// dropped while the suite stays green.
test("a run stopped by the quota wall is a wait, and waiting is the right answer", () => {
  assert.deepEqual(describeShortfall({ docCount: 400, scannedCount: 441, progress: run({ hitCap: true }) }), {
    remaining: 41,
    cause: "cap",
    failures: [],
    queued: 41,
  });
});

// THE field case. Nothing failed, no wall was hit, and the notes are still missing: they
// landed after the scan that produced this run — the multi-machine window where the session's
// `git pull` delivers notes while the server is already indexing. Nothing is waiting for
// anything, so nothing will happen at the next session either; the machinery that could close
// it is idle, waiting for an event that has already happened.
test("notes that simply ARRIVED after the scan are neither a failure nor a wait", () => {
  assert.deepEqual(describeShortfall({ docCount: 439, scannedCount: 458, progress: run() }), {
    remaining: 19,
    cause: "arrived",
    failures: [],
    queued: 19,
  });
});

// No run state at all — a freshly rehydrated machine, or a brain whose cache was cleared.
// Absent is not "nothing failed": it is "nothing is recorded", and the honest reading is the
// same as the field case, because that is the state where asking now costs one run.
test("no run recorded → the shortfall is read as arrived, not as a wait", () => {
  assert.equal(describeShortfall({ docCount: 439, scannedCount: 458 })?.cause, "arrived");
});

// The bound, and the reason it is not optional: "arrived" is the only cause that makes the
// engine ACT, so without a stop condition a note that is scanned but lands in no bucket at
// all (F10's shape — neither indexed, nor unchanged, nor reported) would have the server
// catching up forever. One catch-up that closes nothing is the runtime evidence that this is
// not a late arrival, whatever the run state says.
test("a catch-up that closed nothing is stalled, not something to ask for again", () => {
  assert.equal(
    describeShortfall({ docCount: 439, scannedCount: 458, progress: run(), lastCatchUpRemaining: 19 })?.cause,
    "stalled",
  );
});

test("a catch-up that closed part of the gap keeps going — progress is what buys the next one", () => {
  // The boundary: 19 → 18 is progress, 19 → 19 is not. Nothing else tells `>=` from `>`, and
  // the wrong one here either loops forever or gives up while notes are still landing.
  assert.equal(
    describeShortfall({ docCount: 440, scannedCount: 458, progress: run(), lastCatchUpRemaining: 19 })?.cause,
    "arrived",
  );
});

// Found by an existing status-report test rather than by design: a run that is STILL RUNNING
// is a genuine wait, and the only one the engine must not act on — the work is already being
// done in this process. Read from the run's own status, not from its numbers.
test("a run in progress is a wait: the catch-up is already happening", () => {
  assert.equal(
    describeShortfall({ docCount: 120, scannedCount: 211, progress: run({ status: "running" }) })?.cause,
    "running",
  );
});

// ─── The half the owner actually asked for: stop describing, ACT ─────────────
// "ça devrait reprendre en auto dès lors qu'il constate qu'il est en retard, non ?" — yes,
// and the machinery is right there: the scheduler is idle, waiting for an event that has
// already happened. This is the memory that keeps asking bounded.

test("CatchUpBound — a shortfall of notes that arrived is worth asking for", () => {
  const bound = new CatchUpBound();

  assert.equal(bound.lastCatchUpRemaining(), null, "nothing has been asked yet");
  assert.equal(bound.request(describeShortfall({ docCount: 439, scannedCount: 458, progress: run() })), true);
  assert.equal(bound.lastCatchUpRemaining(), 19, "the ask is remembered, so the next read can judge it");
});

test("CatchUpBound — a refusal, a wall, a run in flight and a complete index are never asked for", () => {
  const bound = new CatchUpBound();

  assert.deepEqual(
    [
      bound.request(describeShortfall({ docCount: 439, scannedCount: 441, progress: run({ errors: ["a.md: bad"] }) })),
      bound.request(describeShortfall({ docCount: 400, scannedCount: 441, progress: run({ hitCap: true }) })),
      bound.request(describeShortfall({ docCount: 120, scannedCount: 211, progress: run({ status: "running" }) })),
      bound.request(describeShortfall({ docCount: 42, scannedCount: 42 })),
    ],
    [false, false, false, false],
  );
  assert.equal(bound.lastCatchUpRemaining(), null, "a refused ask leaves no trace to judge later");
});

test("CatchUpBound — the second ask, on a gap that did not move, is refused (the loop is closed)", () => {
  // The two halves composed, which is the only way to see the bound actually bind: ask once,
  // let the catch-up change nothing, and read again exactly as the server does.
  const bound = new CatchUpBound();
  const read = () =>
    describeShortfall({
      docCount: 439,
      scannedCount: 458,
      progress: run(),
      lastCatchUpRemaining: bound.lastCatchUpRemaining(),
    });

  assert.equal(bound.request(read()), true);
  assert.equal(read()?.cause, "stalled");
  assert.equal(bound.request(read()), false);
});
