import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  buildShLauncher,
  buildCmdLauncher,
  pathPrependSh,
  pathPrependCmd,
  minimalPathEnv,
  applyRagLauncher,
  buildNodeRunnerSh,
  buildNodeRunnerCmd,
  nodeHookCommand,
  buildRagInstallInvocation,
  buildLocalMirrorShLauncher,
  buildLocalMirrorCmdLauncher,
  applyLocalMirrorLauncher,
  realInstallIo,
  tsxRunSh,
  tsxRunCmd,
} from "./rag-launcher.mjs";

// Reproduces installer.mjs's (gen) text substitution: .split().join() per key.
function substitute(tpl, reps) {
  let out = tpl;
  for (const [k, v] of Object.entries(reps)) out = out.split(k).join(v);
  return out;
}

test("buildShLauncher: sh shebang + starts the RAG server", () => {
  const sh = buildShLauncher();
  assert.match(sh, /^#!\/bin\/sh/);
  assert.equal(sh.includes(tsxRunSh("rag", "src/index.ts")), true);
});

// ─── The tsx invocation (field report 2026-08-07, defect 3) ──────────────────────────
// `npx tsx …` resolved tsx from the npx CACHE, not from node_modules: tsx is a
// devDependency of rag/ and local-mirror/, the launchers run with cwd = the brain root,
// and there is no root node_modules. So npx could not resolve it locally and fell back to
// its own cache WITH A REGISTRY ROUND-TRIP — measured at 9.8 s on the reporters' Windows
// machines against the client's 30 s handshake ceiling, versus 2.6-2.8 s calling
// tsx/dist/cli.mjs directly. 3× headroom instead of 10×, on a startup already starved by
// defect 1's orphans. Anchor on the launcher's own directory (`$0` / `%~dp0`), never on
// the cwd, and keep npx as the fallback so a half-installed tree still boots.

test("tsxRunSh: runs tsx from the launcher's OWN directory, not from the cwd and not via npx", () => {
  const sh = tsxRunSh("rag", "src/index.ts");

  assert.match(sh, /d=\$\(dirname "\$0"\)/); // anchored on the script, cwd-independent
  assert.match(sh, /exec node "\$d\/node_modules\/tsx\/dist\/cli\.mjs" "\$d\/src\/index\.ts"/);
});

test("tsxRunSh: npx survives as a fallback, so a tree without node_modules still boots", () => {
  const sh = tsxRunSh("rag", "src/index.ts");

  assert.match(sh, /\[ -f "\$d\/node_modules\/tsx\/dist\/cli\.mjs" \]/); // guarded, not assumed
  assert.match(sh, /exec npx tsx rag\/src\/index\.ts/); // the old behaviour, demoted
});

test("tsxRunCmd: %~dp0 anchors on the launcher, and the whole if/else stays on ONE line", () => {
  const cmd = tsxRunCmd("rag", "src/index.ts");

  assert.match(cmd, /if exist "%~dp0node_modules\\tsx\\dist\\cli\.mjs" \(node "%~dp0node_modules\\tsx\\dist\\cli\.mjs" "%~dp0src\\index\.ts"\) else \(npx tsx rag\/src\/index\.ts\)/);
  // Defect 2 of the same report: cmd.exe re-seeks batch files BY BYTE OFFSET, and a
  // multi-line `if ( … ) else ( … )` is exactly what made it resume mid-token on our
  // LF-only launchers. One line has no second line to mis-seek into.
  assert.equal(cmd.includes("\n"), false);
});

test("tsxRunCmd: the path handed to cmd.exe is backslashed, the npx fallback is not", () => {
  const cmd = tsxRunCmd("local-mirror", "src/server.ts");

  assert.match(cmd, /"%~dp0src\\server\.ts"/); // cmd resolves a native path
  assert.match(cmd, /npx tsx local-mirror\/src\/server\.ts/); // node's own arg, unchanged
});

test("buildShLauncher: self-heal of node locations invisible in GUI (homebrew, nvm)", () => {
  const sh = buildShLauncher();
  assert.match(sh, /\/opt\/homebrew\/bin/); // Homebrew Apple Silicon (the case that breaks)
  assert.match(sh, /\.nvm\/versions\/node\/\*\/bin/); // nvm (glob resolved by sh at runtime)
  assert.match(sh, /\[ -d "\$1" \]/); // only prepends directories that exist (portable)
});

test("pathPrependSh: broadened coverage (usr/bin Linux, volta, nodenv, fnm Linux+macOS)", () => {
  const sh = pathPrependSh();
  assert.match(sh, /add \/usr\/bin/); // node via Linux system manager (apt/dnf/nodesource)
  assert.match(sh, /\$HOME\/\.volta\/bin/); // Volta
  assert.match(sh, /\$HOME\/\.nodenv\/shims/); // nodenv
  assert.match(sh, /\.local\/share\/fnm\/.*installation\/bin/); // fnm Linux (glob resolved by sh)
  // fnm macOS: "Application Support" directory (space) → must be quoted correctly in sh
  assert.match(sh, /"\$HOME\/Library\/Application Support\/fnm"\/.*installation\/bin/);
});

test("pathPrependCmd: Volta Windows coverage (%LOCALAPPDATA%\\Volta\\bin)", () => {
  const cmd = pathPrependCmd();
  assert.match(cmd, /%LOCALAPPDATA%\\Volta\\bin/); // Volta on Windows
});

test("buildCmdLauncher: @echo off + Windows self-heal + starts the RAG server", () => {
  const cmd = buildCmdLauncher();
  assert.match(cmd, /@echo off/);
  assert.match(cmd, /%ProgramFiles%\\nodejs/); // official Windows installer
  assert.equal(cmd.includes(tsxRunCmd("rag", "src/index.ts")), true);
});

test("buildNodeRunnerSh: PATH self-heal then exec node on the hook's arguments", () => {
  const sh = buildNodeRunnerSh();
  assert.match(sh, /^#!\/bin\/sh/);
  assert.match(sh, /\/opt\/homebrew\/bin/); // same self-heal as the RAG (Homebrew Apple Silicon)
  assert.match(sh, /\.nvm\/versions\/node\/\*\/bin/); // nvm (Achille's Mac case)
  assert.match(sh, /exec node "\$@"/); // relays node + all the hook's args
});

test("buildNodeRunnerCmd: @echo off + Windows self-heal then node on the arguments", () => {
  const cmd = buildNodeRunnerCmd();
  assert.match(cmd, /@echo off/);
  assert.match(cmd, /%ProgramFiles%\\nodejs/); // same Windows self-heal as the RAG
  assert.match(cmd, /node %\*/); // relays node + all the hook's args
});

test("nodeHookCommand posix: substituted in the JSON template → command parseable via run-node.sh", () => {
  // Mirror of .claude/settings.json.template (statusLine): {{NODE}} followed by the
  // .mjs script path, all inside a JSON string (escaped quotes).
  const tpl = '{ "command": "{{NODE}} \\"{{PROJECT_ROOT}}/scripts/status-line.mjs\\"" }';
  const out = substitute(tpl, {
    "{{NODE}}": nodeHookCommand("darwin", "/Users/x/brain"),
    "{{PROJECT_ROOT}}": "/Users/x/brain",
  });
  const parsed = JSON.parse(out); // must stay valid JSON
  assert.equal(
    parsed.command,
    '/bin/sh "/Users/x/brain/scripts/run-node.sh" "/Users/x/brain/scripts/status-line.mjs"',
  );
});

test("nodeHookCommand win32: forward-slash run-node.cmd, NO nested `cmd /c`, NO backslash (issue #31)", () => {
  // Claude Code runs Windows hooks through Git Bash by default (PowerShell if Git
  // Bash is absent). The old `cmd /c "C:\…\run-node.cmd"` shape was eaten by Git
  // Bash's backslash-as-escape handling — a char was dropped (`claude`→`laude`,
  // issue #31). A bare forward-slash path to the .cmd, with NO nested `cmd /c`,
  // runs the probe cleanly under bash, PowerShell AND cmd (proven on windows-latest;
  // see scripts/win-hook-exec.test.mjs). The script stays quoted by the template.
  const tpl = '{ "command": "{{NODE}} \\"{{PROJECT_ROOT}}/scripts/auto-commit.mjs\\"" }';
  const out = substitute(tpl, {
    "{{NODE}}": nodeHookCommand("win32", "C:/Users/x/brain"),
    "{{PROJECT_ROOT}}": "C:/Users/x/brain",
  });
  const parsed = JSON.parse(out); // must stay valid JSON
  assert.equal(
    parsed.command,
    'C:/Users/x/brain/scripts/run-node.cmd "C:/Users/x/brain/scripts/auto-commit.mjs"',
  );
  // The two things that broke Git Bash must be gone:
  assert.doesNotMatch(parsed.command, /cmd \/c/i); // no nested cmd wrapper
  assert.doesNotMatch(nodeHookCommand("win32", "C:/Users/x/brain"), /\\/); // no backslash to eat
});

test("minimalPathEnv posix: neutralizes PATH, preserves the rest of the env", () => {
  const env = minimalPathEnv("darwin", { HOME: "/h", PATH: "/usr/local/bin:/x" });
  assert.equal(env.PATH, ""); // sh launched by absolute path → node will come ONLY from the self-heal
  assert.equal(env.HOME, "/h"); // preserved: the self-heal needs it
});

test("minimalPathEnv win32: PATH reduced to System32 (cmd.exe findable), rest preserved", () => {
  const env = minimalPathEnv("win32", {
    SystemRoot: "C:\\Windows",
    ProgramFiles: "C:\\PF",
    PATH: "C:\\Windows\\System32;C:\\node;C:\\autre",
  });
  assert.match(env.PATH, /System32$/); // cmd.exe must stay resolvable; node will come from the self-heal
  assert.equal(env.ProgramFiles, "C:\\PF"); // preserved
});

test("minimalPathEnv win32: SystemRoot missing → fallback C:\\Windows", () => {
  const env = minimalPathEnv("win32", { PATH: "x" });
  assert.equal(env.PATH, "C:\\Windows\\System32");
});

test("buildRagInstallInvocation posix: npm install runs UNDER the launcher's self-heal PATH (same Node as runtime)", () => {
  const { command, args } = buildRagInstallInvocation("darwin");
  assert.equal(command, "/bin/sh");
  // the install must resolve node through the SAME self-heal block as launch.sh,
  // so the native binary is moulded for exactly the Node the launcher will load.
  assert.equal(args[0], "-c");
  assert.match(args[1], /\/opt\/homebrew\/bin/); // self-heal block embedded
  assert.match(args[1], /npm install/); // …then installs the rag deps
});

test("buildRagInstallInvocation win32: writes the self-heal block into rag/ and runs it by RELATIVE name", () => {
  // Why not a multi-line `cmd /c` arg: cmd does not reliably run the lines after the
  // first newline (the install was silently skipped, yet exit 0) — and a long PATH
  // trips the line-length limit. So we materialise the self-heal block + npm install
  // into a real .cmd file and execute that. Crucially the file goes INTO rag/ and is
  // invoked by a SPACE-FREE, PATH-QUALIFIED relative name (`cmd /c .\sbg-rag-install.cmd`),
  // with the caller setting cwd=rag/ — so a brain path containing spaces (C:\Users\John
  // Doe\…) can't break cmd's argument splitting, AND a hardened box with
  // NoDefaultCurrentDirectoryInExePath set still resolves it (a BARE name is not searched
  // in cwd there → bug B1). The fs is injected so the seam stays pure.
  let writtenDir, written;
  const io = {
    writeScript: (dir, content) => {
      writtenDir = dir;
      written = content;
      return "sbg-rag-install.cmd";
    },
    removeScript: () => {},
  };
  const { command, args } = buildRagInstallInvocation("win32", "C:\\Users\\John Doe\\brain\\rag", io);
  assert.equal(command, "cmd");
  assert.deepEqual(args, ["/c", ".\\sbg-rag-install.cmd"]); // relative, space-free, cwd-qualified
  assert.equal(writtenDir, "C:\\Users\\John Doe\\brain\\rag"); // file lands inside rag/
  // The materialised script still carries the SAME self-heal block as launch.cmd
  // (ADR 0021-A single source of truth) followed by the install.
  assert.match(written, /%ProgramFiles%\\nodejs/);
  assert.match(written, /npm install/);
});

test("buildRagInstallInvocation win32: cleanup() removes the script from rag/", () => {
  let removedDir, removedName;
  const io = {
    writeScript: () => "sbg-rag-install.cmd",
    removeScript: (dir, name) => {
      removedDir = dir;
      removedName = name;
    },
  };
  const { cleanup } = buildRagInstallInvocation("win32", "C:\\brain\\rag", io);
  cleanup();
  assert.equal(removedDir, "C:\\brain\\rag");
  assert.equal(removedName, "sbg-rag-install.cmd");
});

test("buildRagInstallInvocation posix: cleanup is a no-op (nothing to remove)", () => {
  const { cleanup } = buildRagInstallInvocation("darwin");
  assert.doesNotThrow(() => cleanup());
});

test("applyRagLauncher: rewrites the vault-rag command per OS, preserves cwd/env", () => {
  const base = {
    mcpServers: {
      "vault-rag": { type: "stdio", command: "npx", args: ["tsx", "rag/src/index.ts"], cwd: "/brain", env: {} },
    },
  };

  const mac = applyRagLauncher(structuredClone(base), "darwin");
  assert.equal(mac.mcpServers["vault-rag"].command, "/bin/sh");
  assert.deepEqual(mac.mcpServers["vault-rag"].args, ["rag/launch.sh"]);
  assert.equal(mac.mcpServers["vault-rag"].cwd, "/brain"); // preserved

  const win = applyRagLauncher(structuredClone(base), "win32");
  assert.equal(win.mcpServers["vault-rag"].command, "cmd");
  assert.deepEqual(win.mcpServers["vault-rag"].args, ["/c", "rag\\launch.cmd"]);
});

test("buildLocalMirrorShLauncher: sh shebang + self-heal + starts the server", () => {
  const sh = buildLocalMirrorShLauncher();
  assert.match(sh, /^#!\/bin\/sh/);
  assert.match(sh, /\/opt\/homebrew\/bin/); // same PATH self-heal as the RAG launcher
  assert.equal(sh.includes(tsxRunSh("local-mirror", "src/server.ts")), true);
});

test("buildLocalMirrorCmdLauncher: @echo off + Windows self-heal + starts the server", () => {
  const cmd = buildLocalMirrorCmdLauncher();
  assert.match(cmd, /@echo off/);
  assert.match(cmd, /%ProgramFiles%\\nodejs/);
  assert.equal(cmd.includes(tsxRunCmd("local-mirror", "src/server.ts")), true);
});

// The drift that caused this whole report is the two launchers being edited one at a
// time — `buildRagInstallInvocation` learned about CRLF ten lines away and the launchers
// never did. Four launchers, ONE way to start tsx: no launcher may keep the bare npx
// call the direct invocation replaced.
test("no launcher keeps a bare `npx tsx` — the four of them start tsx the same way", () => {
  const launchers = {
    "rag/launch.sh": buildShLauncher(),
    "rag/launch.cmd": buildCmdLauncher(),
    "local-mirror/launch.sh": buildLocalMirrorShLauncher(),
    "local-mirror/launch.cmd": buildLocalMirrorCmdLauncher(),
  };

  for (const [name, body] of Object.entries(launchers)) {
    assert.match(body, /node_modules[\\/]tsx[\\/]dist[\\/]cli\.mjs/, `${name} still resolves tsx through npx alone`);
    assert.match(body, /npx tsx /, `${name} dropped the npx fallback a half-installed tree needs`);
  }
});

test("applyLocalMirrorLauncher: rewrites the local-mirror command per OS, preserves cwd/env", () => {
  const base = {
    mcpServers: {
      "local-mirror": {
        type: "stdio",
        command: "npx",
        args: ["tsx", "local-mirror/src/server.ts"],
        cwd: "/brain",
        env: {},
      },
    },
  };

  const mac = applyLocalMirrorLauncher(structuredClone(base), "darwin");
  assert.equal(mac.mcpServers["local-mirror"].command, "/bin/sh");
  assert.deepEqual(mac.mcpServers["local-mirror"].args, ["local-mirror/launch.sh"]);
  assert.equal(mac.mcpServers["local-mirror"].cwd, "/brain");

  const win = applyLocalMirrorLauncher(structuredClone(base), "win32");
  assert.equal(win.mcpServers["local-mirror"].command, "cmd");
  assert.deepEqual(win.mcpServers["local-mirror"].args, ["/c", "local-mirror\\launch.cmd"]);
});

test("applyLocalMirrorLauncher: no local-mirror server → unchanged (no throw)", () => {
  const base = { mcpServers: { "vault-rag": { command: "npx" } } };
  const out = applyLocalMirrorLauncher(structuredClone(base), "darwin");
  assert.equal(out.mcpServers["vault-rag"].command, "npx");
});

// ── the two launcher rewrites, fed what a real .mcp.json can actually be ──────

test("applyRagLauncher and applyLocalMirrorLauncher leave a file that declares nothing alone", () => {
  // Both run over a brain's .mcp.json before anyone has validated it: a file with no
  // servers at all, or none read yet, is an ordinary state (local-mirror is opt-in, and
  // a rehydrating brain has just written the file). Throwing here breaks the install.
  for (const apply of [applyRagLauncher, applyLocalMirrorLauncher]) {
    assert.equal(apply(undefined, "darwin"), undefined, "no file read at all");
    assert.deepEqual(apply({}, "darwin"), {}, "a file with no mcpServers key");
    assert.deepEqual(apply({ mcpServers: {} }, "darwin"), { mcpServers: {} }, "no servers declared");
  }
});

test("applyRagLauncher touches nothing when vault-rag is not the server declared", () => {
  // `if (!srv) return mcp` is the whole guard: without it, the rewrite would land on
  // `undefined` — or, worse, invent a server this brain never declared.
  const other = { mcpServers: { "local-mirror": { command: "node", args: ["x.js"], cwd: "/brain" } } };

  assert.deepEqual(applyRagLauncher(structuredClone(other), "win32"), other);
});

// ── realInstallIo: the fs seam every test above injects around ────────────────
// Every buildRagInstallInvocation test passes its own `io`, so the REAL one — the code
// that runs on a Windows install — was observed by nothing.

test("realInstallIo writes the win32 install script into rag/, and names it back", () => {
  const ragDir = mkdtempSync(join(tmpdir(), "rag-install-io-"));
  try {
    const name = realInstallIo.writeScript(ragDir, "@echo off\r\nnpm install\r\n");

    // The name is returned because the caller invokes it BY name, `.\`-qualified, with
    // cwd=rag/ — so a blank or wrong one is a command Windows cannot run.
    assert.equal(name, "sbg-rag-install.cmd");
    assert.equal(readFileSync(join(ragDir, name), "utf8"), "@echo off\r\nnpm install\r\n");

    realInstallIo.removeScript(ragDir, name);
    assert.equal(existsSync(join(ragDir, name)), false, "the transient script does not survive the install");
  } finally {
    rmSync(ragDir, { recursive: true, force: true });
  }
});

test("realInstallIo.removeScript is silent about a script that is already gone", () => {
  // cleanup() runs on every path, including the ones where the install died before
  // writing anything. A throw there would replace the real error with this one.
  const ragDir = mkdtempSync(join(tmpdir(), "rag-install-io-"));
  try {
    realInstallIo.removeScript(ragDir, "never-written.cmd");
  } finally {
    rmSync(ragDir, { recursive: true, force: true });
  }
});
