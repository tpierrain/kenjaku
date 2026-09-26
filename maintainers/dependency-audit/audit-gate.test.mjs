// Tests for audit-gate.mjs — the check that stops a release shipping a known,
// FIXABLE dependency vulnerability (issue #132, plan v5.5.2 § S1.3).
//
// v5.5.1 shipped 12 of them, every one fixable by `npm audit fix`, because CI ran
// `npm ci` and never `npm audit`. Every owner then read the same alarming banner.
// So the property asserted here is the one that failed: a fixable finding at
// moderate or above turns the check red, and a report the gate cannot read turns it
// red too — never a silent all-clear.
//
// Every fixture is hand-written in npm's audit v2 shape, never produced by the code
// under test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { blockingFindings } from "./audit-gate.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const GATE = join(HERE, "audit-gate.mjs");
const REPO = join(HERE, "..", "..");

const report = (vulnerabilities) => ({ auditReportVersion: 2, vulnerabilities });

test("a report with no finding blocks nothing", () => {
  assert.deepEqual(blockingFindings(report({})), []);
});

test("only fixable findings at moderate or above block, sorted by name, and a major-bump fix is named as such", () => {
  const findings = blockingFindings(
    report({
      "js-yaml": { name: "js-yaml", severity: "high", fixAvailable: true },
      "body-parser": { name: "body-parser", severity: "low", fixAvailable: true },
      "adm-zip": {
        name: "adm-zip",
        severity: "moderate",
        fixAvailable: { name: "onnxruntime-node", version: "2.0.0", isSemVerMajor: true },
      },
      "no-fix-yet": { name: "no-fix-yet", severity: "critical", fixAvailable: false },
      sharp: { name: "sharp", severity: "critical", fixAvailable: true },
    }),
  );

  assert.deepEqual(findings, [
    { name: "adm-zip", severity: "moderate", fixNeedsMajor: true },
    { name: "js-yaml", severity: "high", fixNeedsMajor: false },
    { name: "sharp", severity: "critical", fixNeedsMajor: false },
  ]);
});

test("a fix object that is NOT a major bump is not reported as one", () => {
  const findings = blockingFindings(
    report({ qs: { name: "qs", severity: "moderate", fixAvailable: { name: "qs", version: "6.16.0", isSemVerMajor: false } } }),
  );
  assert.deepEqual(findings, [{ name: "qs", severity: "moderate", fixNeedsMajor: false }]);
});

test("the threshold is inclusive: at 'high', a high blocks and a moderate does not", () => {
  const findings = blockingFindings(
    report({
      hono: { name: "hono", severity: "moderate", fixAvailable: true },
      "fast-uri": { name: "fast-uri", severity: "high", fixAvailable: true },
    }),
    { minSeverity: "high" },
  );
  assert.deepEqual(findings, [{ name: "fast-uri", severity: "high", fixNeedsMajor: false }]);
});

test("the default threshold is moderate: a moderate blocks without any option", () => {
  const findings = blockingFindings(report({ hono: { name: "hono", severity: "moderate", fixAvailable: true } }));
  assert.deepEqual(findings, [{ name: "hono", severity: "moderate", fixNeedsMajor: false }]);
});

test("npm's own error report (e.g. registry unreachable) is refused, never read as clean", () => {
  assert.throws(
    () => blockingFindings({ error: { code: "ENOTFOUND", summary: "request to registry failed" } }),
    /not an npm audit report/,
  );
});

test("an absent report is refused", () => {
  assert.throws(() => blockingFindings(undefined), /not an npm audit report/);
  assert.throws(() => blockingFindings(null), /not an npm audit report/);
});

test("a severity the gate does not know is refused rather than guessed", () => {
  assert.throws(
    () => blockingFindings(report({ odd: { name: "odd", severity: "severe", fixAvailable: true } })),
    /unknown severity "severe" for odd/,
  );
});

test("an unknown threshold is refused", () => {
  assert.throws(() => blockingFindings(report({}), { minSeverity: "medium" }), /^Error: unknown severity "medium"$/);
});

test("a report whose findings are null is refused, not read as empty", () => {
  assert.throws(() => blockingFindings({ auditReportVersion: 2, vulnerabilities: null }), /^Error: not an npm audit report$/);
});

test("a finding that says nothing about a fix blocks: unknown is not the same as unfixable", () => {
  const findings = blockingFindings(report({ hono: { name: "hono", severity: "high" } }));
  assert.deepEqual(findings, [{ name: "hono", severity: "high", fixNeedsMajor: false }]);
});

// ── The entry point, run as a process ────────────────────────────────────────
// A `.json` argument is read as a saved audit report instead of running npm, which
// is how these tests reach the real wiring without the network.

const fixtures = mkdtempSync(join(tmpdir(), "audit-gate-"));
const save = (name, content) => {
  const path = join(fixtures, name);
  writeFileSync(path, typeof content === "string" ? content : JSON.stringify(content, null, 4));
  return path;
};
const CLEAN = save("clean.json", report({ "body-parser": { name: "body-parser", severity: "low", fixAvailable: true } }));
const DIRTY = save("dirty.json", report({ "js-yaml": { name: "js-yaml", severity: "high", fixAvailable: true } }));
const BROKEN = save("broken.json", "{ this is not json");

const runGate = (...args) => spawnSync(process.execPath, [GATE, ...args], { encoding: "utf8" });

test("CLI: every report clean → exit 0", () => {
  assert.equal(runGate(CLEAN, CLEAN).status, 0);
});

test("CLI: one blocking report among clean ones → exit 1, whatever its position", () => {
  assert.equal(runGate(CLEAN, DIRTY).status, 1);
  assert.equal(runGate(DIRTY, CLEAN).status, 1);
});

test("CLI: a blocking report names the package to fix, and warns when its fix is a major bump", () => {
  assert.match(runGate(DIRTY).stderr, /^\s+js-yaml \(high\)$/m);
  const major = save(
    "major.json",
    report({ "adm-zip": { name: "adm-zip", severity: "high", fixAvailable: { name: "onnxruntime-node", version: "2.0.0", isSemVerMajor: true } } }),
  );
  assert.match(runGate(major).stderr, /^\s+adm-zip \(high\) — the fix is a MAJOR bump$/m);
});

// A real package directory, audited by the real npm. With no dependency npm needs
// no registry, so this reaches the npm wiring without the network.
const pkgDir = (withLockfile) => {
  const dir = mkdtempSync(join(tmpdir(), "audit-gate-pkg-"));
  const manifest = { name: "no-deps", version: "1.0.0" };
  writeFileSync(join(dir, "package.json"), JSON.stringify(manifest));
  if (withLockfile) {
    writeFileSync(
      join(dir, "package-lock.json"),
      JSON.stringify({ ...manifest, lockfileVersion: 3, requires: true, packages: { "": manifest } }),
    );
  }
  return dir;
};

test("CLI: a real package directory with nothing to fix → exit 0", () => {
  assert.equal(runGate(pkgDir(true)).status, 0);
});

test("CLI: a package directory npm cannot audit (no lockfile) → exit 2, not a pass", () => {
  assert.equal(runGate(pkgDir(false)).status, 2);
});

test("CLI: an unreadable report → exit 2, even when the others are clean", () => {
  assert.equal(runGate(BROKEN, CLEAN).status, 2);
  assert.equal(runGate(CLEAN, BROKEN).status, 2);
});

test("CLI: unreadable wins over blocking, in either order", () => {
  assert.equal(runGate(BROKEN, DIRTY).status, 2);
  assert.equal(runGate(DIRTY, BROKEN).status, 2);
});

test("CLI: no argument at all → exit 2, a gate given nothing to judge is not a pass", () => {
  assert.equal(runGate().status, 2);
});

// ── The wiring: the gate must actually run in CI ─────────────────────────────
// A gate that exists and is never called is the exact failure #132 describes.

test("CI runs the gate on both shipped dependency trees, in a job no condition can skip", () => {
  const lines = readFileSync(join(REPO, ".github", "workflows", "ci.yml"), "utf8").split(/\r?\n/);
  const at = lines.findIndex((l) => /node maintainers\/dependency-audit\/audit-gate\.mjs\b/.test(l));
  assert.notEqual(at, -1, "no CI step runs maintainers/dependency-audit/audit-gate.mjs");

  const args = lines[at].split(/audit-gate\.mjs/)[1].trim().split(/\s+/);
  assert.deepEqual(args, ["rag", "local-mirror"]);

  let jobStart = at;
  while (jobStart > 0 && !/^ {2}[\w-]+:\s*$/.test(lines[jobStart])) jobStart--;
  let jobEnd = at;
  while (jobEnd < lines.length - 1 && !/^ {2}[\w-]+:\s*$/.test(lines[jobEnd + 1])) jobEnd++;
  const job = lines.slice(jobStart, jobEnd + 1);
  assert.ok(/^ {2}[\w-]+:\s*$/.test(job[0]), "the gate step is not inside a job");
  assert.deepEqual(job.filter((l) => /^ {4}if:/.test(l)), []);
});
