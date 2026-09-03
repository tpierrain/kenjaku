// ─────────────────────────────────────────────────────────────────────────────
// instrumented-source.test.mjs — the detector that lets a source-reading guard
// tell the repository's bytes from a mutation runner's rewrite of them.
// ─────────────────────────────────────────────────────────────────────────────
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { instrumentationStandDown, isInstrumented } from "./instrumented-source.mjs";

const PLAIN = `import { join } from "node:path";\nexport const go = () => join("a", "b");\n`;

test("plain engine source is not instrumented, and asks no guard to stand down", () => {
  assert.equal(isInstrumented(PLAIN), false);
  assert.equal(instrumentationStandDown([{ name: "scripts/a.mjs", source: PLAIN }]), null);
});

// Three markers, because Stryker emits three and a detector that knows only the
// famous one is blind to the file that happens to carry the other two.
test("each of the runner's three markers is recognised on its own", () => {
  const markers = {
    "the mutant switch": `if (stryMutAct_9fa48("12")) {}`,
    "the coverage recorder": `stryCov_9fa48("7");`,
    "the namespace it declares": `var stryNS_9fa48 = {};`,
  };
  for (const [what, source] of Object.entries(markers)) {
    assert.equal(isInstrumented(source), true, `${what} means the text was rewritten`);
  }
});

// The trap this detector exists inside: it is itself engine source, read by the very
// guards it protects. A detector that matched the bare word would fire on every file
// that TALKS about instrumentation — starting with its own — and silence all four
// guards for good, on a clean checkout, with nothing to see.
test("the bare word is not the marker: only the runner's hashed identifiers count", () => {
  assert.equal(isInstrumented("// stryMutAct_ is what the mutation runner injects"), false);
  assert.equal(isInstrumented("const name = 'stryNS_' + suffix;"), false);
});

test("this module's own source does not trip its own detector", () => {
  const onDisk = readFileSync(fileURLToPath(new URL("./instrumented-source.mjs", import.meta.url)), "utf8");

  // Under a mutation run this very file is one of the rewritten ones, and reading it
  // off disk would find the runner's markers rather than ours. The property being
  // pinned is about the bytes we COMMIT, so in that case ask git for them — which
  // keeps the assertion meaningful instead of standing it down into a tautology.
  const own = isInstrumented(onDisk)
    ? execFileSync("git", ["show", "HEAD:scripts/lib/instrumented-source.mjs"], {
        cwd: fileURLToPath(new URL("../..", import.meta.url)),
        encoding: "utf8",
      })
    : onDisk;

  assert.equal(isInstrumented(own), false, "a detector that fires on itself silences every guard that consults it");
});

test("the stand-down names every rewritten file, and no clean one", () => {
  const reason = instrumentationStandDown([
    { name: "scripts/z.mjs", source: `stryCov_9fa48("1");` },
    { name: "scripts/clean.mjs", source: PLAIN },
    { name: "scripts/a.mjs", source: `if (stryMutAct_9fa48("2")) {}` },
  ]);

  // The list WHOLE, separator included: two names run together read as one path
  // nobody can find, and the file that was NOT rewritten is not evidence of anything.
  assert.equal(
    reason,
    "the mutation runner has rewritten the engine's source text " +
      "(scripts/z.mjs, scripts/a.mjs), and this guard judges source text: it cannot tell the " +
      "repository's bytes from an instrumented copy of them, so it stands down rather than " +
      "report a defect that is not there",
  );
});

// A skip message nobody understands is a skip nobody questions: the sentence has to
// say what happened and why judging is impossible, not merely that it gave up. So it
// is asserted WHOLE — each of its three clauses answers a different question a reader
// will otherwise ask out loud (what happened, why this guard cannot judge it, why
// going quiet is the right answer), and any one of them can be emptied on its own.
test("the stand-down says what happened, so a reader is not left guessing why a guard went quiet", () => {
  const reason = instrumentationStandDown([{ name: "scripts/a.mjs", source: `var stryNS_9fa48 = {};` }]);

  assert.equal(
    reason,
    "the mutation runner has rewritten the engine's source text " +
      "(scripts/a.mjs), and this guard judges source text: it cannot tell the " +
      "repository's bytes from an instrumented copy of them, so it stands down rather than " +
      "report a defect that is not there",
  );
});

test("nothing to judge is not a reason to stand down", () => {
  assert.equal(instrumentationStandDown([]), null);
});

test("an unreadable or empty source is not instrumented, and never throws", () => {
  for (const source of ["", null, undefined]) {
    assert.equal(isInstrumented(source), false, `${JSON.stringify(source)} carries no marker`);
  }
  assert.equal(instrumentationStandDown([{ name: "scripts/a.mjs", source: null }]), null);
});

// 🛑 THE DIRECTION THIS MUST FAIL IN. `readFileSync(path)` with the encoding forgotten
// answers a Buffer, and this module's whole charter is that a guard cannot be right
// about text rewritten underneath it. Instrumented bytes are instrumented whatever
// their container, so a Buffer carrying the marker stands the guard DOWN — a false
// skip costs one unasked question, and the alternative costs a red that reads exactly
// like a real defect. Guessing wrong here is what cost the nightly measurement three
// weeks of unread failures.
test("instrumented BYTES are instrumented too: a caller that forgot the encoding is not judged", () => {
  const bytes = Buffer.from(`if (stryMutAct_9fa48("7")) {}`);

  assert.equal(isInstrumented(bytes), true);
  assert.match(
    instrumentationStandDown([{ name: "scripts/a.mjs", source: bytes }]),
    /scripts\/a\.mjs/,
  );
});
