// Tests for .github/workflows/mutation-nightly.yml — the guard that keeps one runaway
// mutant from taking the whole nightly down (plan v5.5.2 § S3).
//
// Measured over the nights of 2026-09-16 → 25: the local-mirror job died at mutant
// 349/1181 on 8 nights out of 10 with "The runner has received a shutdown signal". The
// mutant turned `name === 'all'` into `true`, so `sync` re-entered itself through
// `syncAll` without end; an async recursion never overflows the stack, it eats memory
// until the machine is killed. The recursion is fixed at its root, but the next
// runaway mutant is a matter of time, so every Node process of the mutate step runs
// under a heap ceiling: past it, the process crashes (Stryker scores the mutant as
// killed) instead of the machine going down with the night's other results.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const WORKFLOW = join(dirname(fileURLToPath(import.meta.url)), "..", "..", ".github", "workflows", "mutation-nightly.yml");

// A public repo's ubuntu-latest has 16 GB. The mutate step runs Stryker plus
// `--concurrency 2` test processes: three ceilings of at most 4 GB stay under it.
const MAX_HEAP_MB = 4096;

test("the mutate step caps every Node process's heap, under what the machine can hold three times", () => {
  const lines = readFileSync(WORKFLOW, "utf8").split(/\r?\n/);
  const step = lines.findIndex((l) => /^\s+- name: Mutate /.test(l));
  assert.notEqual(step, -1, "no 'Mutate' step in the nightly workflow");
  const indent = lines[step].indexOf("-");
  let end = step + 1;
  while (end < lines.length && !(lines[end].trim() !== "" && lines[end].indexOf(lines[end].trim()) <= indent)) end++;
  const body = lines.slice(step, end).join("\n");

  const cap = /NODE_OPTIONS:\s*["']?--max-old-space-size=(\d+)["']?\s*$/m.exec(body);
  assert.ok(cap, `the Mutate step sets no NODE_OPTIONS heap ceiling:\n${body}`);
  const mb = Number(cap[1]);
  assert.ok(mb > 0 && mb <= MAX_HEAP_MB, `heap ceiling ${mb} MB is outside (0, ${MAX_HEAP_MB}]`);
});

// The owner's call, 2026-09-26 (plan v5.5.2 § S3.2, option A): `scripts` is OUT of the
// nightly. 13 306 mutants, each judged by the whole 30 s harness suite, is ~90 h against
// a 6 h ceiling — it had not finished since at least 2026-08-18, so every night was a red
// that measured nothing. It comes back only as the rotation filed in
// ../plans/prospective/harness-speed-and-test-quality-action.md (S4), and this test is
// what makes putting it back a deliberate act instead of a one-line revert.
test("the nightly mutates exactly rag and local-mirror — scripts returns only as a rotation", () => {
  const packages = [...readFileSync(WORKFLOW, "utf8").matchAll(/^\s+- package:\s*(\S+)\s*$/gm)].map((m) => m[1]);
  assert.deepEqual(packages, ["rag", "local-mirror"]);
});
