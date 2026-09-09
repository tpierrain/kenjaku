import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

import {
  appRestartedSince,
  findClaudeApp,
  parseProcessTable,
  PS_ARGS,
  readClaudeAppIdentity,
} from "./claude-app-identity.mjs";

// ─────────────────────────────────────────────────────────────────────────────
// The fixture is the REAL ancestry, copied out of `ps` on 2026-09-09 while a
// Desktop conversation was open (the same chain the 2026-09-08 measurement read:
// Claude.app → disclaimer → the per-conversation `claude` → the hook). Nothing
// here is invented, because the whole module exists to survive this exact shape.
//
// Note what it holds, and why the whole fix hangs on it: the per-conversation
// binary lives at `…/claude-code/2.1.260/claude.app/Contents/MacOS/claude` — a
// path that differs from the APP's only by CASE. That process is respawned by a
// new conversation, so mistaking it for the app would make the verdict say
// "restarted" every time the owner opens a new tab, which is the silent failure.
// ─────────────────────────────────────────────────────────────────────────────
const REAL_TABLE = [
  "    1     0 Mon Aug 24 09:18:13 2026     /sbin/launchd",
  "75093     1 Wed Sep  9 09:20:39 2026     /Applications/Claude.app/Contents/MacOS/Claude",
  "75097 75093 Wed Sep  9 09:20:39 2026     /Applications/Claude.app/Contents/Frameworks/Claude Helper.app/Contents/MacOS/Claude Helper --type=gpu-process",
  "75296 75093 Wed Sep  9 09:21:19 2026     /Applications/Claude.app/Contents/Helpers/disclaimer -- /Users/tpierrain/Library/Application Support/Claude/claude-code",
  "75297 75296 Wed Sep  9 09:21:19 2026     /Users/tpierrain/Library/Application Support/Claude/claude-code/2.1.260/claude.app/Contents/MacOS/claude --output-format stream-json",
  "75400 75297 Wed Sep  9 09:22:01 2026     node /brain/scripts/prompt-restart-nudge.mjs",
].join("\n");

const THE_APP = { pid: "75093", startedAt: "Wed Sep  9 09:20:39 2026" };

test("the process table parses into pid, parent, start instant and command", () => {
  const table = parseProcessTable(REAL_TABLE);

  // The start instant is five whitespace-separated tokens, and the command is
  // everything after them — including its own spaces, which `Claude Helper.app`
  // and `Application Support` both have. A split on whitespace that stopped
  // counting would hand back a truncated command and match nothing.
  assert.deepEqual(table.get("75297"), {
    ppid: "75296",
    startedAt: "Wed Sep  9 09:21:19 2026",
    command:
      "/Users/tpierrain/Library/Application Support/Claude/claude-code/2.1.260/claude.app/Contents/MacOS/claude --output-format stream-json",
  });
  assert.equal(table.get("75097").command.endsWith("MacOS/Claude Helper --type=gpu-process"), true);
  assert.equal(table.size, 6);
});

test("a line `ps` could not fill in is skipped, not turned into a half-process", () => {
  const table = parseProcessTable(["", "   ", "42 7 Wed Sep  9 09:20:39 2026", "9 1 not a date at all /bin/sh"].join("\n"));

  // Three unusable lines: empty, whitespace, a row whose command is missing, and
  // one whose start instant is not five tokens of date. None may become an entry
  // a walk could then follow into nonsense.
  assert.equal(table.size, 0);
});

test("walking up from the hook finds the APP, four hops away", () => {
  assert.deepEqual(findClaudeApp({ startPid: "75400", table: parseProcessTable(REAL_TABLE) }), THE_APP);
});

test("the per-conversation `claude` is NOT the app — this is the whole point", () => {
  // Start the walk AT that process: if it were mistaken for the app, it would
  // answer itself, and every new conversation would look like a restart.
  const found = findClaudeApp({ startPid: "75297", table: parseProcessTable(REAL_TABLE) });
  assert.deepEqual(found, THE_APP);
  assert.notEqual(found.pid, "75297");
});

test("a chain with no Claude app in it answers nothing — every CLI session", () => {
  const cli = ["    1     0 Mon Aug 24 09:18:13 2026     /sbin/launchd", "89637     1 Sun Sep  6 11:17:13 2026     claude", "90000 89637 Sun Sep  6 11:17:14 2026     node /brain/scripts/prompt-restart-nudge.mjs"].join("\n");

  // A terminal-launched `claude` has no app above it. Nothing to compare means
  // the nudge keeps behaving exactly as it does today — never a silent one.
  assert.equal(findClaudeApp({ startPid: "90000", table: parseProcessTable(cli) }), null);
});

test("a process the table does not know answers nothing", () => {
  assert.equal(findClaudeApp({ startPid: "999999", table: parseProcessTable(REAL_TABLE) }), null);
});

test("a parent cycle terminates instead of hanging the hook", () => {
  // Not hypothetical enough to skip: this runs in front of every prompt the
  // owner types, so a walk that could loop would freeze their brain, not slow it.
  const cyclic = ["10 11 Mon Aug 24 09:18:13 2026     /bin/a", "11 10 Mon Aug 24 09:18:13 2026     /bin/b"].join("\n");
  assert.equal(findClaudeApp({ startPid: "10", table: parseProcessTable(cyclic) }), null);
});

test("a numeric pid is accepted — `process.pid` is a number", () => {
  assert.deepEqual(findClaudeApp({ startPid: 75400, table: parseProcessTable(REAL_TABLE) }), THE_APP);
});

// ─── The decider ─────────────────────────────────────────────────────────────

test("a different app pid is a restart", () => {
  assert.equal(appRestartedSince(THE_APP, { pid: "80000", startedAt: "Wed Sep  9 11:00:00 2026" }), true);
});

test("the SAME pid with a different start instant is a restart too — pids are recycled", () => {
  assert.equal(appRestartedSince(THE_APP, { pid: "75093", startedAt: "Wed Sep  9 11:00:00 2026" }), true);
});

test("the same app, still running, is NOT a restart — the nudge stays", () => {
  assert.equal(appRestartedSince(THE_APP, { ...THE_APP }), false);
});

test("an unknown identity, on either side, proves nothing — and proving nothing means the nudge stays", () => {
  // The single most important assertion in this file. Every unreadable, absent
  // or unsupported case lands here, and all of them must fail TOWARDS the nudge:
  // a false alarm costs a sentence, a silent one leaves an owner on an engine
  // they believe they updated.
  assert.equal(appRestartedSince(null, THE_APP), false);
  assert.equal(appRestartedSince(THE_APP, null), false);
  assert.equal(appRestartedSince(null, null), false);
  assert.equal(appRestartedSince(undefined, THE_APP), false);
  assert.equal(appRestartedSince({ pid: "75093" }, THE_APP), false);
  assert.equal(appRestartedSince(THE_APP, { startedAt: "Wed Sep  9 09:20:39 2026" }), false);
});

// ─── Reading it for real ─────────────────────────────────────────────────────

test("the identity is read by running ps once, from the given pid", () => {
  const calls = [];
  const found = readClaudeAppIdentity({
    pid: "75400",
    runPs: (...args) => {
      calls.push(args);
      return REAL_TABLE;
    },
  });

  assert.deepEqual(found, THE_APP);
  assert.equal(calls.length, 1, "one process table read, not one per hop");
});

test("a machine with no usable ps answers nothing, in silence — Windows, a locked-down box", () => {
  const found = readClaudeAppIdentity({
    pid: "75400",
    runPs: () => {
      throw new Error("spawn ps ENOENT");
    },
  });
  assert.equal(found, null);
});

// The real seam: `ps` is a foreign program whose output format is the one thing
// no fixture can prove. This runs it for real and checks the parser against THIS
// process — if the columns ever move, the fixtures above would all still pass.
test(
  "the parser matches what the real ps prints on this machine",
  { skip: process.platform === "win32" ? "no ps on Windows" : false },
  () => {
    const table = parseProcessTable(execFileSync("ps", PS_ARGS, { encoding: "utf8" }));
    const self = table.get(String(process.pid));

    assert.ok(self, "the running test process must appear in the table it parses");
    assert.equal(self.ppid, String(process.ppid));
    assert.match(self.startedAt, /\d{4}$/);
  },
);
