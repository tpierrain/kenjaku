#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// crosscheck-cli.ts — the HEADLESS disk↔index crosscheck (F15): does the index really
// hold what the vault holds? Read-only, no server boot, no reindex, no watcher, no
// embedding — file reads plus one SQLite query.
//
// It exists because the engine's own counters cannot answer that question: they count
// what a run ATTEMPTED. A note whose frontmatter broke after it was indexed stays in the
// index and goes on ANSWERING, from the content it was last indexed with, while every
// counter reads green. So this reads both sides and compares them.
//
//   npx tsx src/crosscheck-cli.ts          # human report, exit 0 clean / 1 discrepancies
//   npx tsx src/crosscheck-cli.ts --json   # the raw report, for another program
//
// Exit 2 = the check itself could not run (no index yet, unreadable store) — never
// confused with "the index is fine" (0) nor "the index is out of step" (1).
//
// Glue (not unit-tested, mirrors health-check-cli.ts): every function it calls is
// unit-tested; the value here is wiring the real seams and the exit codes.
// ═══════════════════════════════════════════════════════════════════════════
import { runCrosscheck } from "./lib/index-crosscheck-scan.js";
import { affectedNotes, reportLines } from "./lib/index-crosscheck.js";

const asJson = process.argv.includes("--json");

runCrosscheck()
  .then((report) => {
    if (asJson) {
      process.stdout.write(JSON.stringify(report));
    } else {
      for (const line of reportLines(report)) console.log(line);
    }
    process.exit(affectedNotes(report).length === 0 ? 0 : 1);
  })
  .catch((err) => {
    console.error(`✗ The crosscheck could not run: ${err?.message ?? err}`);
    console.error(
      "  → The index is built on the first session in the brain folder. If you have " +
        "never opened one, ask me to reindex your vault, then run this again."
    );
    process.exit(2);
  });
