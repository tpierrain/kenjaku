import { test } from "node:test";
import assert from "node:assert/strict";

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { ragStatusLine, LAST_RUN_REL } from "./rag-status.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// F16, applied to this very fix: a surface that re-derives the engine's own paths
// measures a fiction the day one of them moves. The banner reads the run state the
// engine WRITES, so the engine's sources are the reference — not a second copy of
// the string. Let them drift and the failure count silently goes back to zero,
// which is exactly the silence this finding is about.
test("the run state the banner reads is the file the engine writes", () => {
  const engineSource = (relPath) => readFileSync(join(REPO_ROOT, "rag", "src", "lib", relPath), "utf8");
  const [, fileName] = engineSource("reindex-reporter.ts").match(/resolve\(CACHE_DIR, "([^"]+)"\)/);
  const [, cacheDir] = engineSource("config.ts").match(/CACHE_DIR = resolvePath\(\s*process\.env\.CACHE_DIR,\s*resolve\(__dirname, "\.\.\/\.\.\/([^"]+)"\)/);

  // `rag/src/lib/../../.cache` → `rag/.cache`, from the engine's own two constants.
  assert.equal(LAST_RUN_REL, `rag/${cacheDir}/${fileName}`);
});

// F11/F12 — THE field defect. A note whose frontmatter the indexer refuses is scanned,
// never indexed, and shows up in the shortfall — which the banner rendered as
// `1 pending — auto catch-up in the background`, i.e. it ASSERTED a recovery that can
// never happen (the next run rejects the same bytes the same way). The engine did know:
// it recorded the file AND the cause in `last-run.json`, on a line the eye never reaches.
test("ragStatusLine — a recorded failure is a FAILURE, named on the counter's own line", () => {
  const line = ragStatusLine({
    docs: 435,
    scanned: 436,
    lastRun: {
      status: "done",
      errors: ["Read error: inqom/briefings/2026-08-02.md: bad indentation of a mapping entry (6:45)"],
    },
  });

  assert.match(line, /435\/436/);
  assert.match(line, /1 failed/);
  assert.doesNotMatch(line, /pending/, "a permanent failure must not be counted as a wait");
  assert.doesNotMatch(line, /auto catch-up/, "the next run rejects the same bytes — promise nothing");
  // File AND cause on the counter's own line: the whole point of the finding.
  assert.match(line, /inqom\/briefings\/2026-08-02\.md/);
  assert.match(line, /bad indentation of a mapping entry \(6:45\)/);
});

// The other half of the separation: a REAL wait must keep reading as a wait. A note
// written seconds ago is genuinely queued, the background catch-up genuinely picks it
// up, and turning that into an alarm would be the same conflation in the other direction.
test("ragStatusLine — a shortfall with nothing recorded against it is still a wait", () => {
  const line = ragStatusLine({ docs: 435, scanned: 436, lastRun: { status: "done", errors: [] } });

  assert.match(line, /435\/436/);
  assert.match(line, /1 pending/);
  assert.match(line, /auto catch-up in the background/);
  assert.doesNotMatch(line, /failed/);
});

// Both at once, which is the normal state of a busy vault: some notes are queued AND
// one is broken. Collapsing them into a single number is how the broken one hid.
test("ragStatusLine — a shortfall that is PART failure, part wait, says both", () => {
  const line = ragStatusLine({
    docs: 430,
    scanned: 433,
    lastRun: { status: "done", errors: ["Read error: a.md: boom"] },
  });

  assert.match(line, /1 failed/);
  assert.match(line, /2 pending/, "the 2 notes nothing was recorded against are still queued");
  assert.match(line, /a\.md: boom/);
});

// The stale-error guard. `last-run.json` is only rewritten by the NEXT run, so a repaired
// and reindexed note leaves its old error behind. Alarming over it would train the owner
// to ignore the line — the F16 lesson (a checker judged on its false positives, not only
// on catching the true one). No shortfall = nothing to explain, whatever the last run said.
test("ragStatusLine — a repaired vault silences a stale error instead of re-alarming", () => {
  const line = ragStatusLine({
    docs: 436,
    scanned: 436,
    lastRun: { status: "done", errors: ["Read error: inqom/briefings/2026-08-02.md: boom"] },
  });

  assert.equal(line, "🧠 RAG up to date — 436/436 files indexed.");
});

// The two degenerate states the banner already handled inline, kept verbatim by the
// extraction — an empty vault is not a broken index, and "we could not read the DB"
// is not "nothing is indexed" (the reframe again: unknown ≠ broken).
test("ragStatusLine — an empty vault says so, and does not read as a shortfall", () => {
  const line = ragStatusLine({ docs: 0, scanned: 0, lastRun: null });

  assert.match(line, /empty vault/);
  assert.doesNotMatch(line, /pending|failed/);
});

test("ragStatusLine — an unreadable index is UNKNOWN, never a count", () => {
  const line = ragStatusLine({ docs: null, scanned: 436, lastRun: null });

  assert.match(line, /status unavailable/);
  assert.doesNotMatch(line, /pending|failed|up to date/);
});

// A banner is read at a glance: five stack-like strings scroll the useful lines away
// and get skipped as noise. Name two, count the rest — the count is what makes the
// truncation honest rather than a silent cap.
test("ragStatusLine — many failures: two named, the rest counted, never all dumped", () => {
  const line = ragStatusLine({
    docs: 400,
    scanned: 405,
    lastRun: {
      status: "done",
      errors: ["Read error: a.md: boom", "Read error: b.md: bam", "Read error: c.md: bim", "Read error: d.md: bum"],
    },
  });

  assert.match(line, /4 failed/);
  assert.match(line, /a\.md: boom/);
  assert.match(line, /b\.md: bam/);
  assert.doesNotMatch(line, /c\.md|d\.md/);
  assert.match(line, /\(\+2 other\(s\)\)/);
  assert.match(line, /1 pending/, "405 − 400 − 4 = 1 genuinely queued");
});
