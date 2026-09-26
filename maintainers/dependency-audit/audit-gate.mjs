#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// audit-gate.mjs — a release may not ship a known vulnerability it could fix.
//
// v5.5.1 shipped 12 findings, every one fixable by `npm audit fix`, because CI
// ran `npm ci` and never `npm audit` (issue #132). The lockfiles ship with the
// engine, so every owner's update then printed the same alarming banner, and told
// them to report it upstream, where nothing was watching.
//
// So this gate turns CI red on any FIXABLE finding at moderate or above. An
// unfixable one is left to pass: blocking on it would block every release until
// someone else ships a patch, and a gate that is red for reasons nobody here can
// act on stops being read.
//
// Usage:  node maintainers/dependency-audit/audit-gate.mjs <target>...
//   <target> = a package directory (runs `npm audit --json` in it; only the
//               lockfile is needed, no install), or a `.json` file holding a
//               saved audit report (the seam the tests use, no network).
// Exit:   0 nothing blocks · 1 a fixable finding blocks · 2 a report could not
//         be read. Unreadable wins over blocking, and neither is ever a pass.
//
// Dev-only: under maintainers/, so it is never copied into a brain.
// ─────────────────────────────────────────────────────────────────────────────
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SEVERITY_RANK = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };

function rankOf(severity, subject) {
  const rank = SEVERITY_RANK[severity];
  if (rank === undefined) throw new Error(`unknown severity "${severity}"${subject ? ` for ${subject}` : ""}`);
  return rank;
}

/**
 * The findings that must block a release: fixable, and at `minSeverity` or above.
 * Throws on anything that is not an npm audit report — npm answers a registry
 * failure with `{ error }`, and reading that as "no vulnerabilities" is the
 * silent all-clear this gate exists to prevent.
 */
export function blockingFindings(report, { minSeverity = "moderate" } = {}) {
  if (typeof report?.vulnerabilities !== "object" || report.vulnerabilities === null) {
    throw new Error("not an npm audit report");
  }
  const floor = rankOf(minSeverity);
  return Object.entries(report.vulnerabilities)
    .filter(([name, v]) => rankOf(v.severity, name) >= floor && v.fixAvailable !== false)
    .map(([name, v]) => ({ name, severity: v.severity, fixNeedsMajor: v.fixAvailable?.isSemVerMajor === true }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function auditReportOf(target) {
  if (target.endsWith(".json")) return JSON.parse(readFileSync(target, "utf8"));
  // npm exits non-zero whenever it finds anything, so the exit code says nothing;
  // the JSON on stdout is the answer. POSIX only (CI runs it on Linux, maintainers
  // on macOS): Windows would need a shell to resolve `npm.cmd`, and an untested
  // branch for a platform that never runs this is a branch nothing judges.
  const run = spawnSync("npm", ["audit", "--json"], { cwd: target, encoding: "utf8" });
  return JSON.parse(run.stdout);
}

function main(targets) {
  if (targets.length === 0) {
    console.error("audit-gate: no target given — nothing judged is not a pass.");
    return 2;
  }
  let exit = 0;
  for (const target of targets) {
    let findings;
    try {
      findings = blockingFindings(auditReportOf(target));
    } catch (error) {
      console.error(`✖ ${target}: could not read the audit (${error.message}).`);
      exit = 2;
      continue;
    }
    if (findings.length === 0) {
      console.log(`✔ ${target}: no fixable finding at moderate or above.`);
      continue;
    }
    console.error(`✖ ${target}: ${findings.length} fixable finding(s) — run \`npm audit fix\` there:`);
    for (const f of findings) console.error(`    ${f.name} (${f.severity})${f.fixNeedsMajor ? " — the fix is a MAJOR bump" : ""}`);
    if (exit === 0) exit = 1;
  }
  return exit;
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
