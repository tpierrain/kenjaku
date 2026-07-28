import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { rmSync, existsSync, writeFileSync } from "node:fs";
import {
  ReindexReporter,
  FileProgressStorage,
  type ProgressStorage,
} from "./reindex-reporter.js";
import type { RunProgress } from "./progress-report.js";

/** In-memory storage for the tests. */
function memoryStorage(): ProgressStorage & { state: RunProgress | null } {
  return {
    state: null as RunProgress | null,
    load() {
      return this.state;
    },
    save(s: RunProgress) {
      this.state = s;
    },
  };
}

const fixedNow = () => new Date("2026-05-31T12:00:00Z");

test("C.6 — start: persists a running state (initial counters + startedAt)", () => {
  const storage = memoryStorage();
  const reporter = new ReindexReporter({ storage, now: fixedNow });

  reporter.start({ totalChunks: 660, scanned: 211, skipped: 103, removed: 0 });

  const state = storage.load()!;
  assert.equal(state.status, "running");
  assert.equal(state.startedAt, "2026-05-31T12:00:00.000Z");
  assert.equal(state.totalChunks, 660);
  assert.equal(state.scanned, 211);
  assert.equal(state.skipped, 103);
  assert.equal(state.removed, 0);
  assert.equal(state.doneChunks, 0);
  assert.equal(state.indexed, 0);
  assert.deepEqual(state.errors, []);
  assert.equal(state.hitCap, false);
});

test("C.7 — tick: increments doneChunks incrementally", () => {
  const storage = memoryStorage();
  const reporter = new ReindexReporter({ storage, now: fixedNow });
  reporter.start({ totalChunks: 660, scanned: 211, skipped: 103, removed: 0 });

  reporter.tick(7);
  reporter.tick(5);

  const state = storage.load()!;
  assert.equal(state.doneChunks, 12);
  assert.equal(state.status, "running");
});

test("C.8 — finish without hitCap → done, finishedAt, counters", () => {
  const storage = memoryStorage();
  let clock = new Date("2026-05-31T12:00:00Z");
  const reporter = new ReindexReporter({ storage, now: () => clock });
  reporter.start({ totalChunks: 660, scanned: 211, skipped: 103, removed: 0 });

  clock = new Date("2026-05-31T12:08:00Z");
  reporter.finish({ indexed: 108, errors: [], hitCap: false });

  const state = storage.load()!;
  assert.equal(state.status, "done");
  assert.equal(state.finishedAt, "2026-05-31T12:08:00.000Z");
  assert.equal(state.indexed, 108);
  assert.equal(state.hitCap, false);
});

test("C.8 — finish with hitCap → incomplete", () => {
  const storage = memoryStorage();
  const reporter = new ReindexReporter({ storage, now: fixedNow });
  reporter.start({ totalChunks: 660, scanned: 211, skipped: 103, removed: 0 });

  reporter.finish({ indexed: 80, errors: [], hitCap: true });

  assert.equal(storage.load()!.status, "incomplete");
});

test("C.9 — recordError: accumulates errors, status stays running", () => {
  const storage = memoryStorage();
  const reporter = new ReindexReporter({ storage, now: fixedNow });
  reporter.start({ totalChunks: 660, scanned: 211, skipped: 103, removed: 0 });

  reporter.recordError("doc-A: quota 429");
  reporter.recordError("doc-B: parse error");

  const state = storage.load()!;
  assert.deepEqual(state.errors, ["doc-A: quota 429", "doc-B: parse error"]);
  assert.equal(state.status, "running");
});

test("C.9 — fail: hard failure → status error, error appended, finishedAt", () => {
  const storage = memoryStorage();
  let clock = new Date("2026-05-31T12:00:00Z");
  const reporter = new ReindexReporter({ storage, now: () => clock });
  reporter.start({ totalChunks: 660, scanned: 211, skipped: 103, removed: 0 });
  reporter.recordError("doc-A: quota 429");

  clock = new Date("2026-05-31T12:03:00Z");
  reporter.fail("DB lock: disk I/O error");

  const state = storage.load()!;
  assert.equal(state.status, "error");
  assert.equal(state.finishedAt, "2026-05-31T12:03:00.000Z");
  assert.deepEqual(state.errors, ["doc-A: quota 429", "DB lock: disk I/O error"]);
});

test("C.9 — finish preserves accumulated errors (merge, not overwrite)", () => {
  const storage = memoryStorage();
  const reporter = new ReindexReporter({ storage, now: fixedNow });
  reporter.start({ totalChunks: 660, scanned: 211, skipped: 103, removed: 0 });
  reporter.recordError("doc-A: quota 429");

  reporter.finish({ indexed: 80, errors: ["doc-Z: late error"], hitCap: false });

  assert.deepEqual(storage.load()!.errors, ["doc-A: quota 429", "doc-Z: late error"]);
});

const sampleState: RunProgress = {
  status: "running",
  startedAt: "2026-05-31T12:00:00Z",
  totalChunks: 660,
  doneChunks: 120,
  scanned: 211,
  indexed: 0,
  skipped: 103,
  removed: 0,
  errors: [],
  hitCap: false,
};

test("C.10 — FileProgressStorage: round-trip load/save on a temp file", () => {
  const path = resolve(tmpdir(), `reindex-progress-test-${process.pid}.json`);
  rmSync(path, { force: true });
  const storage = new FileProgressStorage(path);
  try {
    assert.equal(storage.load(), null); // empty to start with
    storage.save(sampleState);
    assert.deepEqual(storage.load(), sampleState);
  } finally {
    rmSync(path, { force: true });
  }
});

test("C.10 — FileProgressStorage: corrupt file → absent state (null)", () => {
  const path = resolve(tmpdir(), `reindex-progress-corrupt-${process.pid}.json`);
  writeFileSync(path, "{ not json", "utf-8");
  const storage = new FileProgressStorage(path);
  try {
    assert.equal(storage.load(), null);
  } finally {
    rmSync(path, { force: true });
  }
});

// F10 — the worst failure mode this product has, in its quietest form: a confident
// answer over an incomplete index. `start()` runs AFTER phase 1 and used to reset
// `errors` to [], so every phase-1 read failure was erased before anyone could see
// it — `watcher.log` said "1 errors" while `last-run.json` said `"errors": []` and
// the brain told its owner "0 erreur, index à jour".
test("start: carries the errors the caller ALREADY knows about (phase-1 read failures)", () => {
  const storage = memoryStorage();
  const reporter = new ReindexReporter({ storage, now: fixedNow });

  reporter.start({
    totalChunks: 660,
    scanned: 211,
    skipped: 103,
    removed: 0,
    errors: ["Read error: topics/crise.md: duplicate key 'updated'"],
  });

  assert.deepEqual(storage.load()!.errors, [
    "Read error: topics/crise.md: duplicate key 'updated'",
  ]);
});

test("start: no errors passed still starts clean — a fresh run inherits nothing", () => {
  const storage = memoryStorage();
  const reporter = new ReindexReporter({ storage, now: fixedNow });
  reporter.start({ totalChunks: 1, scanned: 1, skipped: 0, removed: 0 });
  assert.deepEqual(storage.load()!.errors, []);
});
