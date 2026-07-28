import { test } from "node:test";
import assert from "node:assert/strict";
import {
  chunksPerMinute,
  etaMinutes,
  formatProgressReport,
  formatLastRunMarkdown,
  unaccountedNotes,
  type RunProgress,
} from "./progress-report.js";

test("C.1 — throughput: 120 chunks in 2 min → 60 chunks/min", () => {
  const rate = chunksPerMinute({
    doneChunks: 120,
    startedAt: "2026-05-31T12:00:00Z",
    now: "2026-05-31T12:02:00Z",
  });

  assert.equal(rate, 60);
});

test("C.1 — throughput: 0 elapsed time → 0 (no division by zero)", () => {
  const rate = chunksPerMinute({
    doneChunks: 5,
    startedAt: "2026-05-31T12:00:00Z",
    now: "2026-05-31T12:00:00Z",
  });

  assert.equal(rate, 0);
});

test("C.2 — ETA: 540 chunks remaining at 60/min → 9 min", () => {
  const eta = etaMinutes({ totalChunks: 660, doneChunks: 120, ratePerMin: 60 });

  assert.equal(eta, 9);
});

test("C.2 — ETA: zero throughput → null (no estimate, no Infinity)", () => {
  const eta = etaMinutes({ totalChunks: 660, doneChunks: 120, ratePerMin: 0 });

  assert.equal(eta, null);
});

test("C.3 — running: catch-up in progress with %, throughput, ETA, errors, duration", () => {
  const state: RunProgress = {
    status: "running",
    startedAt: "2026-05-31T12:00:00Z",
    totalChunks: 660,
    doneChunks: 120,
    scanned: 211,
    indexed: 0,
    skipped: 0,
    removed: 0,
    errors: [],
    hitCap: false,
  };

  const report = formatProgressReport(state, "2026-05-31T12:02:00Z");

  assert.match(report, /in progress/i);
  assert.match(report, /120\s*\/\s*660/); // chunks done / total
  assert.match(report, /18\s*%/); // 120/660
  assert.match(report, /60\s*\/\s*min/); // 120 in 2 min
  assert.match(report, /ETA\s*~?\s*9\s*min/i); // 540 remaining at 60/min
  assert.match(report, /0\s*error/i);
});

test("C.4 — done: last catch-up completed, duration, docs indexed, errors", () => {
  const state: RunProgress = {
    status: "done",
    startedAt: "2026-05-31T12:00:00Z",
    finishedAt: "2026-05-31T12:08:00Z",
    totalChunks: 660,
    doneChunks: 660,
    scanned: 211,
    indexed: 108,
    skipped: 103,
    removed: 0,
    errors: [],
    hitCap: false,
  };

  const report = formatProgressReport(state, "2026-05-31T12:10:00Z");

  assert.match(report, /complet/i);
  assert.match(report, /8\s*min/); // 12:08 - 12:00
  assert.match(report, /108\s*doc/i);
  assert.match(report, /0\s*error/i);
  assert.doesNotMatch(report, /in progress/i);
});

test("C.5 — incomplete / hitCap: quota wall, chunks remaining, auto-resume", () => {
  const state: RunProgress = {
    status: "incomplete",
    startedAt: "2026-05-31T12:00:00Z",
    finishedAt: "2026-05-31T12:05:00Z",
    totalChunks: 660,
    doneChunks: 480,
    scanned: 211,
    indexed: 80,
    skipped: 103,
    removed: 0,
    errors: [],
    hitCap: true,
  };

  const report = formatProgressReport(state, "2026-05-31T12:10:00Z");

  assert.match(report, /incomplete/i);
  assert.match(report, /quota/i); // quota wall
  assert.match(report, /180\s*chunks?\s*remaining/i); // 660 - 480
  assert.match(report, /resume/i);
});

test("C.5 — errors listed but truncated (3 max + count of the rest)", () => {
  const state: RunProgress = {
    status: "incomplete",
    startedAt: "2026-05-31T12:00:00Z",
    finishedAt: "2026-05-31T12:05:00Z",
    totalChunks: 660,
    doneChunks: 480,
    scanned: 211,
    indexed: 80,
    skipped: 103,
    removed: 0,
    errors: ["err-A", "err-B", "err-C", "err-D", "err-E"],
    hitCap: true,
  };

  const report = formatProgressReport(state, "2026-05-31T12:10:00Z");

  assert.match(report, /err-A/);
  assert.match(report, /err-B/);
  assert.match(report, /err-C/);
  assert.doesNotMatch(report, /err-D/); // truncated beyond 3
  assert.match(report, /2\s*other/i); // 5 - 3 remaining
});

test("C.14 — last-run.md: markdown title + report line", () => {
  const state: RunProgress = {
    status: "done",
    startedAt: "2026-05-31T12:00:00Z",
    finishedAt: "2026-05-31T12:08:00Z",
    totalChunks: 660,
    doneChunks: 660,
    scanned: 211,
    indexed: 108,
    skipped: 103,
    removed: 0,
    errors: [],
    hitCap: false,
  };

  const md = formatLastRunMarkdown(state, "2026-05-31T12:10:00Z");

  assert.match(md, /^#\s/m); // a markdown title
  assert.match(md, /108\s*doc/i); // the run summary
  assert.match(md, /complet/i);
});

// F10's detector. It was validated in BOTH directions on real data during the QA:
// the broken run read `414 ≠ 0 + 413`, the repaired one `415 = 2 + 413`. Every note
// the scan found must end up in exactly one bucket — indexed, skipped, or errored —
// so a run whose numbers do not add up has lost notes silently, whatever the cause.
test("unaccountedNotes: a complete run whose numbers add up reports nothing", () => {
  assert.equal(
    unaccountedNotes({ scanned: 415, indexed: 2, skipped: 413, errors: 0, hitCap: false }),
    0,
  );
});

test("unaccountedNotes: the exact shape of the F10 incident — one note vanished", () => {
  // The broken run: 414 scanned, 413 skipped, 0 indexed, and the one read error
  // erased before it reached last-run.json.
  assert.equal(
    unaccountedNotes({ scanned: 414, indexed: 0, skipped: 413, errors: 0, hitCap: false }),
    1,
  );
});

test("unaccountedNotes: the same run, once the error is reported, adds up again", () => {
  assert.equal(
    unaccountedNotes({ scanned: 414, indexed: 0, skipped: 413, errors: 1, hitCap: false }),
    0,
  );
});

test("unaccountedNotes: a run cut off by the quota wall is NOT an accounting failure", () => {
  // Legitimately incomplete: hundreds of notes are neither indexed nor errored, they
  // are simply not done yet and resume on the next run. Counting them as lost would
  // cry wolf on every capped run — and a detector that cries wolf gets ignored.
  assert.equal(
    unaccountedNotes({ scanned: 900, indexed: 12, skipped: 100, errors: 1, hitCap: true }),
    0,
  );
});

test("formatProgressReport: a completed run that lost notes says so, instead of reading as a success", () => {
  // The line the brain reads before telling its owner "index à jour". With the same
  // numbers and no warning, three of our own channels disagreed and the owner was
  // shown the optimistic one.
  const out = formatProgressReport(
    {
      status: "done",
      startedAt: "2026-07-28T12:00:00Z",
      finishedAt: "2026-07-28T12:01:00Z",
      totalChunks: 4,
      doneChunks: 4,
      scanned: 414,
      indexed: 0,
      skipped: 413,
      removed: 0,
      errors: [],
      hitCap: false,
    },
    "2026-07-28T12:01:00Z",
  );
  assert.match(out, /1 note/);
  assert.match(out, /incomplete/i);
});

test("formatProgressReport: a completed run that adds up stays quiet about accounting", () => {
  const out = formatProgressReport(
    {
      status: "done",
      startedAt: "2026-07-28T12:00:00Z",
      finishedAt: "2026-07-28T12:01:00Z",
      totalChunks: 4,
      doneChunks: 4,
      scanned: 415,
      indexed: 2,
      skipped: 413,
      removed: 0,
      errors: [],
      hitCap: false,
    },
    "2026-07-28T12:01:00Z",
  );
  assert.doesNotMatch(out, /incomplete/i);
});

test("formatProgressReport: a completed run NAMES its errors, it does not just count them", () => {
  // Counting alone is what the QA met: "1 errors" with no way to know which note.
  // The incomplete report already named them; the completed one did not.
  const out = formatProgressReport(
    {
      status: "done",
      startedAt: "2026-07-28T12:00:00Z",
      finishedAt: "2026-07-28T12:01:00Z",
      totalChunks: 4,
      doneChunks: 4,
      scanned: 414,
      indexed: 0,
      skipped: 413,
      removed: 0,
      errors: ["Read error: topics/crise.md: duplicate key 'updated'"],
      hitCap: false,
    },
    "2026-07-28T12:01:00Z",
  );
  assert.match(out, /topics\/crise\.md/);
  assert.match(out, /duplicate key/);
});
