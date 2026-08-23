#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// health-probe-run.mjs — the DETACHED probe child (ADR 0028 + 0030, F7/F7-bis).
// Spawned by session-health.mjs at SessionStart, it reads every ACTIVATED engine
// module's health HEADLESS (read-only, light depth — ADR 0030 §4/§6, F7-ter): it
// runs the SAME health-check definition (rag/src/health-check-cli.ts) the installer
// post-flight and verify-rag use, but WITHOUT booting a server. It persists the fresh
// verdict to engine-health.json and OS-notifies the moment a capability becomes NEWLY
// broken. Runs in the background → session start never waits.
//
// HEADLESS, never an MCP round-trip (revises fc2e4bb): a vault-rag MCP server is a
// private stdio child of Claude — booting one here would test a DIFFERENT process, not
// the live one, and waste resources. The light disk read catches the only truly silent
// failure (a live server answering from DEGRADED DATA: empty/stale index, embedder gone).
// ─────────────────────────────────────────────────────────────────────────────

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

import { runActivatedHealthChecks } from "./lib/health-check-runner.mjs";
import { buildHeadlessHealthCheckCaller } from "./lib/headless-health-check.mjs";
import { countOf } from "./lib/plural.mjs";
import { readInstalledMergeFiles } from "./lib/engine-base-fs.mjs";
import { tsxInvocation } from "./lib/tsx-invocation.mjs";
import { runAsEntrypoint } from "./lib/entrypoint.mjs";

export async function runProbeChild({ runProbes, readPriorVerdict, writeVerdict, notify }) {
  const verdict = await runProbes();
  // Notify ONLY on a NEWLY broken capability (broken now AND not broken before) so a
  // still-broken capability never re-nags every session; a fresh break is loud once.
  const wasBroken = new Set(
    (readPriorVerdict() ?? []).filter((p) => p.status === "broken").map((p) => p.capability),
  );
  const newlyBroken = verdict.filter((p) => p.status === "broken" && !wasBroken.has(p.capability));
  writeVerdict(verdict);
  for (const probe of newlyBroken) notify(probe);
  return { verdict, newlyBroken };
}

/**
 * What to spawn to raise the OS notification — a pure value, asserted without spawning.
 * Goes through the tsx installed in rag/ rather than npx (field report 2026-08-07,
 * defect 3): this fires when a capability has just broken, i.e. exactly when the machine
 * is least likely to have a spare 9.8 s for a registry round-trip.
 */
export function notifyInvocation({ brainDir, platform, title, body, ...seams }) {
  const { command, args, shell } = tsxInvocation({
    brainDir,
    platform,
    script: "rag/src/notify-cli.ts",
    args: [title, body],
    ...seams,
  });
  // `detached` (with the caller's unref) is what lets the warning outlive the probe child
  // that raised it. Composed inside the runner it was unobservable; losing it would turn a
  // notified break back into a silent one, which is this release's own bug family.
  return { command, args, options: { cwd: brainDir, detached: true, stdio: "ignore", windowsHide: true, shell } };
}

/**
 * S5's residual — the engine files this process could not READ, as a health verdict.
 *
 * `readInstalledMergeFiles` has taken an opt-in `unreadable` collector since S5, and the
 * SessionStart divergence hook hands it one and discards it, deliberately: that hook's
 * voice is *"a file the engine leaves alone is a choice, not a problem"*, and a file the
 * filesystem refused (a bad umask, a cloud sync client's placeholder, a half-restored
 * backup) is neither. It is an alarm, so it is said by the surface that owns the alarm
 * voice — and it reaches an owner the same way every other health fact does, through the
 * banner this probe's verdict feeds.
 *
 * Silent when everything reads: an `ok` row here would be a line in engine-health.json
 * and a thing to explain, for a state that is simply normal.
 */
export function engineFilesVerdict(unreadable) {
  if (unreadable.length === 0) return [];
  // Sorted because a human reads it: the same two files must not swap places between two
  // sessions and read as a new problem.
  const detail = `${countOf(unreadable.length, "engine file")} could not be read — ${[...unreadable].sort().join(", ")}`;
  return [
    {
      capability: "engine-files",
      status: "broken",
      detail,
      checks: [{ name: "readable", status: "broken", detail }],
    },
  ];
}

// Map the runner's per-module verdict onto the persisted shape session-health.mjs +
// formatHealthBanner read ({ capability, status, detail }). The structured `checks` are
// carried through too (ADR 0030 F7-ter, baby-step 5) so the banner can name each cause +
// its corrective gesture; `detail` keeps the flattened summary for the notification text
// and any legacy reader.
export function toBannerVerdict(modules) {
  return modules.map((m) => {
    const checks = m.checks ?? [];
    const bad = checks.filter((ch) => ch.status !== "ok");
    const detail = bad.length ? bad.map((ch) => `${ch.name}: ${ch.detail}`).join("; ") : m.status;
    return { capability: m.module, status: m.status, detail, checks };
  });
}

// ── main: wire the real I/O seams (deterministic glue, not unit-tested) ───────
// Runs in the DETACHED background child (a real health_check round-trip per module
// loads the embedder + searches → seconds) so session start never waits. Writes
// engine-health.json and OS-notifies only on a newly-broken capability. Fail-open:
// ALWAYS exit 0.
// runAsEntrypoint, never a hand-rolled argv[1] comparison: `resolve(argv[1])` is the
// path AS TYPED and `import.meta.url` is the path Node REALPATH-RESOLVED, so on any
// brain whose path holds a symlink the two differ and this whole block silently never
// ran -- no output, no error, no exit code. See lib/entrypoint.mjs.
runAsEntrypoint(import.meta.url, process.argv, async () => {
  const argv = process.argv.slice(2);
  const flag = (name) => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const brainDir = resolve(flag("brainDir") ?? join(__dirname, ".."));
  const platform = flag("platform") ?? process.platform;

  // FAIL-OPEN (#5): a missing/corrupt/partially-written (mid-update) engine-manifest.json
  // or .mcp.json must NEVER make this detached child exit non-zero. The JSON.parse reads
  // used to run synchronously OUTSIDE the promise chain → an uncaught throw escaped the
  // .catch and left the verdict cache silently un-refreshed. Wrap the WHOLE body so any
  // throw — sync read or async probe — routes to exit 0 (ALWAYS, the header's contract).
  try {
    const healthFile = join(brainDir, "engine-health.json");
    const manifest = JSON.parse(readFileSync(join(brainDir, "engine-manifest.json"), "utf8"));
    const mcpServers = JSON.parse(readFileSync(join(brainDir, ".mcp.json"), "utf8")).mcpServers ?? {};

    const { isRegistered, callHealthCheck } = buildHeadlessHealthCheckCaller({
      mcpServers,
      brainDir,
      platform,
      // Light depth: file/DB reads only, zero ONNX (ADR 0030 §6) — the per-session probe
      // must never slow startup. The deeper full read (real embed+search) is verify-rag's job.
      depth: "light",
    });

    await runProbeChild({
      runProbes: async () => {
        const { modules } = await runActivatedHealthChecks({ manifest, isRegistered, callHealthCheck });
        // S5 — read the engine's own body while we are here. It costs one pass over the
        // merge regime (16 files, ~2 ms on a real brain) in a child that already runs
        // detached, and it is the only surface that can say this in the alarm voice.
        const unreadable = [];
        readInstalledMergeFiles({ brainDir, manifest, unreadable });
        return [...toBannerVerdict(modules), ...engineFilesVerdict(unreadable)];
      },
      readPriorVerdict: () =>
        existsSync(healthFile) ? JSON.parse(readFileSync(healthFile, "utf8")).verdict ?? null : null,
      writeVerdict: (verdict) => writeFileSync(healthFile, JSON.stringify({ verdict }, null, 2) + "\n"),
      notify: (probe) => {
        const { command, args, options } = notifyInvocation({
          brainDir,
          platform,
          title: "Second brain — health check",
          body: `${probe.capability} is broken: ${probe.detail}`,
        });
        spawn(command, args, options).unref();
      },
    });
  } catch {
    // fail-open: swallow everything (a broken probe must never block / fail a session).
  }
  return 0; // ALWAYS exit 0
});
