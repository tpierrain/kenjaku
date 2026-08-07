import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, chmodSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { spawnSync } from "node:child_process";

import { buildShLauncher, buildCmdLauncher, buildLocalMirrorShLauncher, buildLocalMirrorCmdLauncher } from "./lib/rag-launcher.mjs";

// ─────────────────────────────────────────────────────────────────────────────
// The test the launchers never had (field report 2026-08-07, defects 2 and 3).
//
// Every existing launcher test asserts the STRING the generator returns. The two
// defects that reached the field were not in the string:
//
//   • defect 2 — cmd.exe re-seeks a batch file BY BYTE OFFSET, so LF-only endings made
//     it resume MID-TOKEN (`REM` executed as 'M'). A string assertion cannot see that;
//     only cmd.exe reading the actual bytes can. It is also LENGTH-dependent, which is
//     why it broke local-mirror and spared rag, and why a toy fixture proves nothing —
//     this test runs the REAL generated launcher, at its real length.
//
//   • defect 3 — `npx tsx` resolved tsx from the npx cache instead of node_modules. The
//     string looked fine; what was wrong was which file it reached. Here the launcher
//     runs against a stub cli.mjs that reports the arguments it was handed, so a
//     launcher that silently fell back to npx (or resolved the wrong path) fails.
//
// The .sh side executes everywhere. The .cmd side executes on Windows only — the CI
// tripwire (CONVENTIONS.md §9) is what makes that cell non-optional rather than a
// courtesy: the reported bug existed ONLY there.
// ─────────────────────────────────────────────────────────────────────────────

const MARKER = "LAUNCHER_REACHED";

/**
 * A throwaway brain: one package directory holding the generated launcher, a STUB tsx CLI
 * where the real one lives, and a stub entry point. The stub prints the marker plus the
 * script path it was given, so the assertion is about what the launcher RESOLVED, not
 * merely about what it contained.
 */
function brainWith({ pkg, launcherName, body, entry }) {
  // realpath, not the raw temp path: macOS hands out /var/… which is a symlink to
  // /private/var/…, and the launcher's `cd && pwd` reports the resolved one. Comparing
  // against the unresolved path would fail for a reason that has nothing to do with the
  // launcher — and would hide the reason that does.
  const root = realpathSync(mkdtempSync(join(tmpdir(), "launcher-exec-")));
  const cli = join(root, pkg, "node_modules", "tsx", "dist", "cli.mjs");
  mkdirSync(dirname(cli), { recursive: true });
  writeFileSync(cli, `console.log("${MARKER}", process.argv[2]);\n`);

  const entryPath = join(root, pkg, entry);
  mkdirSync(dirname(entryPath), { recursive: true });
  writeFileSync(entryPath, "// never executed: the stub CLI above only reports its arguments\n");

  const launcher = join(root, pkg, launcherName);
  writeFileSync(launcher, body);
  chmodSync(launcher, 0o755);
  return { root, entryPath };
}

const shCases = [
  { name: "rag", pkg: "rag", body: buildShLauncher(), entry: "src/index.ts" },
  { name: "local-mirror", pkg: "local-mirror", body: buildLocalMirrorShLauncher(), entry: "src/server.ts" },
];

for (const c of shCases) {
  test(`${c.name}/launch.sh actually runs, and reaches the tsx installed beside it`, { skip: process.platform === "win32" ? "POSIX launcher" : false }, () => {
    const { root, entryPath } = brainWith({ ...c, launcherName: "launch.sh" });

    // Exactly how .mcp.json invokes it: /bin/sh <pkg>/launch.sh, cwd = the brain root —
    // the cwd where npx could never have resolved tsx, which is the whole point.
    const res = spawnSync("/bin/sh", [`${c.pkg}/launch.sh`], { cwd: root, encoding: "utf8" });

    assert.equal(res.status, 0, `launcher exited ${res.status}: ${res.stderr}`);
    assert.match(res.stdout, new RegExp(`^${MARKER} `), `the stub CLI was never reached: ${res.stdout}${res.stderr}`);
    assert.equal(res.stdout.trim(), `${MARKER} ${entryPath}`);
  });
}

const cmdCases = [
  { name: "rag", pkg: "rag", body: buildCmdLauncher(), entry: "src/index.ts" },
  { name: "local-mirror", pkg: "local-mirror", body: buildLocalMirrorCmdLauncher(), entry: "src/server.ts" },
];

for (const c of cmdCases) {
  test(`${c.name}/launch.cmd is parsed cleanly by cmd.exe, byte offsets and all`, { skip: process.platform === "win32" ? false : "cmd.exe only reads batch files on Windows" }, () => {
    const { root, entryPath } = brainWith({ ...c, launcherName: "launch.cmd" });

    const res = spawnSync("cmd", ["/c", `${c.pkg}\\launch.cmd`], { cwd: root, encoding: "utf8" });

    assert.equal(res.status, 0, `launcher exited ${res.status}: ${res.stderr}`);
    // The signature of the reported bug: cmd resuming mid-token and trying to execute
    // fragments of our own comment words ('M', 'lf-heal', 'epends'). Any of those on
    // stderr means the file was mis-seeked, whatever the exit status said.
    assert.doesNotMatch(res.stderr, /is not recognized as an internal or external command/i, res.stderr);
    assert.equal(res.stdout.trim(), `${MARKER} ${entryPath}`);
  });
}
