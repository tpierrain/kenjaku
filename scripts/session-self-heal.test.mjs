import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { sessionSelfHeal, buildSelfHealHookOutput } from "./session-self-heal.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// The DESIRED-STATE the wrapper derives from delivered files (F-B7 2g): the wanted
// skill dirs + wanted MCP server ids, fed straight into the gate.
const WANTED = {
  wantedSkillDirs: [".claude/skills/local-mirror"],
  wantedServerIds: ["vault-rag", "local-mirror"],
};

// Build the seam bundle with spies; override per test.
function seams(overrides = {}) {
  const calls = { spawned: [], emitted: [], restartPending: [] };
  const base = {
    brainDir: "/brain",
    readWanted: () => WANTED,
    skillDirExists: () => true,
    mcpServerRegistered: () => true,
    spawnReconcile: (arg) => calls.spawned.push(arg),
    emit: (msg) => calls.emitted.push(msg),
    setRestartPending: (pending) => calls.restartPending.push(pending),
  };
  return { args: { ...base, ...overrides }, calls };
}

test("sessionSelfHeal — converged brain → TRUE no-op (no reconcile spawned, nothing emitted)", async () => {
  const { args, calls } = seams();
  const result = await sessionSelfHeal(args);
  assert.equal(result.healed, false);
  assert.equal(calls.spawned.length, 0);
  assert.equal(calls.emitted.length, 0);
});

test("sessionSelfHeal — a gap → spawns reconcile in the background + emits one loud line", async () => {
  const { args, calls } = seams({ mcpServerRegistered: (id) => id !== "local-mirror" });
  const result = await sessionSelfHeal(args);
  assert.equal(result.healed, true);
  assert.deepEqual(calls.spawned, [{ brainDir: "/brain" }]);
  assert.equal(calls.emitted.length, 1);
  assert.match(calls.emitted[0], /local-mirror/);
  // Strong framing (Thomas): the line must make the gesture non-optional in tone —
  // an explicit "until you do it, your brain can't use it", not a polite hint.
  // The SHOUTING is deliberate and confined to the gesture itself (Thomas, 2026-08-07):
  // owners skim this banner, and the one thing they must not skim past is the restart.
  // Everything around it stays calm — a pending update is not an emergency, and a wall
  // of capitals teaches people to fear a banner that is usually harmless.
  assert.match(calls.emitted[0], /PLEASE CLOSE CLAUDE AND REOPEN IT/);
  assert.doesNotMatch(calls.emitted[0], /ACTION NEEDED|CAN'T|MUST/);
  assert.match(calls.emitted[0], /can(?:no|')?t use|won't work/i);
});

// F-B7d (A2): a gap means a background reconcile is about to install capabilities this
// session won't pick up → the on-disk state will be AHEAD of what this session loaded.
// Mark a restart as pending so the PERSISTENT statusLine nudges the (Desktop) user, since
// the emitted systemMessage is dropped by Desktop.
test("sessionSelfHeal — a gap → marks a restart as PENDING (the Desktop-visible nudge)", async () => {
  const { args, calls } = seams({ mcpServerRegistered: (id) => id !== "local-mirror" });
  await sessionSelfHeal(args);
  assert.deepEqual(calls.restartPending, [true]);
});

// F-B7d (A2) — the clear: a fresh, converged session HAS loaded the on-disk state, so the
// pending nudge is stale → clear it. This is what makes the statusLine nudge disappear once
// the user actually restarted (and not before).
test("sessionSelfHeal — converged brain → CLEARS any pending restart nudge", async () => {
  const { args, calls } = seams(); // all present → converged
  await sessionSelfHeal(args);
  assert.deepEqual(calls.restartPending, [false]);
});

// F14 — the same absent `.mcp.json` reads as a convergence gap (no `vault-rag` registered),
// so this hook used to promise "an engine update finishing in the background" and spawn a
// reconcile that CANNOT land: the reconcile only ever edits files that already exist. A second
// machine therefore heard the same false promise at every session start, forever. An unwired
// machine is not a half-finished update — it is a clone waiting for ONE command, and the hook's
// job is to name it.
test("sessionSelfHeal — an unwired machine is told to rehydrate, not promised an update", async () => {
  const { args, calls } = seams({
    missingWiring: () => [".mcp.json"],
    mcpServerRegistered: () => false, // the absent file is exactly what fakes the gap
  });

  const result = await sessionSelfHeal(args);

  assert.equal(result.needsRehydrate, true);
  assert.equal(result.healed, false);
  assert.deepEqual(calls.spawned, [], "the reconcile cannot create a file that does not exist");
  assert.equal(calls.emitted.length, 1);
  assert.match(calls.emitted[0], /node scripts\/rehydrate\.mjs/);
  assert.match(calls.emitted[0], /\.mcp\.json/);
  assert.doesNotMatch(calls.emitted[0], /update/i, "nothing is updating — say what is true");
});

// The boundary of the branch above: a brain whose wiring IS there has a real convergence gap,
// and must keep the reconcile + restart nudge it always had (a mutant reading any missing
// artifact as "unwired" would silence the engine's real self-heal).
test("sessionSelfHeal — a wired brain with a real gap still self-heals in the background", async () => {
  const { args, calls } = seams({
    missingWiring: () => [],
    mcpServerRegistered: (id) => id !== "local-mirror",
  });

  const result = await sessionSelfHeal(args);

  assert.equal(result.healed, true);
  assert.equal(result.needsRehydrate, undefined);
  assert.deepEqual(calls.spawned, [{ brainDir: "/brain" }]);
  assert.match(calls.emitted[0], /reopen/i);
});

test("sessionSelfHeal — fail-open: a throwing seam never propagates, logs loudly, spawns nothing", async () => {
  const { args, calls } = seams({
    readWanted: () => {
      throw new Error("manifest unreadable");
    },
  });
  const result = await sessionSelfHeal(args); // must NOT throw
  assert.equal(result.healed, false);
  assert.match(result.error, /manifest unreadable/);
  assert.equal(calls.spawned.length, 0);
  assert.equal(calls.emitted.length, 1);
  // NOT "harmless": this catch wraps the WHOLE detection, so when it fires nothing is
  // reconciled (the empty `spawned` above) and a missing skill or MCP server stays missing,
  // silently. "Non-blocking" means it does not block session start, not that it does not
  // matter — so the line keeps its ⚠️ and says what it means for the owner. The raw error
  // is OURS (it survives on `result.error`); what reaches them is a gesture.
  assert.match(calls.emitted[0], /couldn't check/i);
  assert.match(calls.emitted[0], /close claude and reopen/i);
  assert.doesNotMatch(calls.emitted[0], /manifest unreadable/, "the raw error is not the owner's problem");
});

// ⛔ CRITICAL (Thomas's Desktop QA, 2026-06-21): Claude Desktop's Code tab renders NEITHER a
// statusLine NOR `systemMessage` — the ONLY Desktop-visible channel is the CHAT. A SessionStart
// hook's `hookSpecificOutput.additionalContext` IS injected into the agent's context, so the
// agent relays it into the chat. The restart nudge MUST travel that channel, phrased as a
// directive the agent surfaces to the user (not raw user prose Desktop would drop).
test("buildSelfHealHookOutput — carries the nudge in additionalContext (the Desktop-visible chat channel)", () => {
  const out = buildSelfHealHookOutput(["⚠️ ACTION NEEDED — restart Claude (MCP: local-mirror)."]);
  assert.equal(out.hookSpecificOutput.hookEventName, "SessionStart");
  const ctx = out.hookSpecificOutput.additionalContext;
  assert.match(ctx, /restart/i);
  // It must DIRECT the agent to tell the USER in the chat (additionalContext is agent-facing).
  assert.match(ctx, /tell the user|inform the user/i);
  // The original detail line is preserved so the agent has the specifics to relay.
  assert.match(ctx, /local-mirror/);
});

test("buildSelfHealHookOutput keeps the echoed directive short — volume IS the defect (F5)", () => {
  // The CLI echoes additionalContext verbatim to the owner. This one has to stay LOUD
  // (a half-applied update must not pass for live), so it earns more room than the
  // other startup blocks — but not four lines of stage direction. The detail line is
  // excluded: it is already owner-readable prose, and it is the part worth reading.
  const detail = "⚠️ ACTION NEEDED — restart Claude (MCP: local-mirror).";
  const ctx = buildSelfHealHookOutput([detail]).hookSpecificOutput.additionalContext;
  const framing = ctx.length - detail.length;

  assert.ok(framing <= 260, `the restart directive grew back to ${framing} chars:\n${ctx}`);

  // Same budget for the rehydrate variant — a second framing is a second place to grow.
  const rehydrateCtx = buildSelfHealHookOutput([detail], { needsRehydrate: true }).hookSpecificOutput
    .additionalContext;
  const rehydrateFraming = rehydrateCtx.length - detail.length;
  assert.ok(
    rehydrateFraming <= 260,
    `the rehydrate directive grew to ${rehydrateFraming} chars:\n${rehydrateCtx}`,
  );
});

// F14 — the wrapper was the last surface still conflating the two: it framed EVERY emitted line
// as "RESTART REQUIRED … an update finishing in the background". Carrying the rehydrate line, that
// directive contradicts its own payload (nothing is updating, and a restart fixes nothing — a
// command has to be run). The framing must follow the line it carries.
test("buildSelfHealHookOutput — an unwired machine: the directive names the command, never a restart", () => {
  const detail =
    "⚠️ This machine isn't wired for your brain yet — missing .mcp.json. " +
    "From this folder, run:  node scripts/rehydrate.mjs";
  const ctx = buildSelfHealHookOutput([detail], { needsRehydrate: true }).hookSpecificOutput.additionalContext;
  const framing = ctx.slice(0, ctx.length - detail.length);

  assert.doesNotMatch(framing, /restart/i, "a restart heals nothing here");
  assert.doesNotMatch(framing, /update/i, "nothing is updating — say what is true");
  assert.match(framing, /tell the user/i, "additionalContext is agent-facing: it must direct the relay");
  assert.match(ctx, /node scripts\/rehydrate\.mjs/, "the detail line is preserved for the relay");
});

// ⚠️ This test used to end on "self-heal must RUN before the status banner", and that
// is not a thing settings.json can promise: the Claude Code hooks reference says "all
// matching hooks run in parallel". Declaration order buys the order their lines are
// READ, not the order they execute — so anything that genuinely must happen after
// another hook's work needs a barrier, not a position in this array (the universe hook
// and the startup pull are the case in point: scripts/lib/startup-sync-gate.mjs).
test("settings.json.template wires session-self-heal as a SessionStart hook, and declares it ahead of the status banner", () => {
  const settings = JSON.parse(readFileSync(join(REPO_ROOT, ".claude", "settings.json.template"), "utf8"));
  const commands = settings.hooks.SessionStart.flatMap((entry) => entry.hooks.map((h) => h.command));
  const selfHealIdx = commands.findIndex((c) => c.includes("session-self-heal.mjs"));
  const statusIdx = commands.findIndex((c) => c.includes("session-status.mjs"));
  assert.ok(selfHealIdx >= 0, "session-self-heal.mjs must be wired on SessionStart");
  assert.ok(statusIdx >= 0, "session-status.mjs must stay wired on SessionStart");
  assert.ok(selfHealIdx < statusIdx, "the self-heal's lines are declared ahead of the status banner's");
});
