// ─────────────────────────────────────────────────────────────────────────────
// native-binding-heal.mjs — the update heals a better-sqlite3 that npm 12 never
// built (plan v5.5.2 § S4.3, issue #132).
//
// npm 12 blocks a dependency's install scripts unless package.json allows them.
// A brain installed or updated with npm 12 before the engine declared
// `allowScripts` has a better-sqlite3 whose native binary was never built — and
// neither `npm install` nor `npm rebuild` re-runs a script npm 12 blocked
// (measured 2026-09-26, npm 12.1.0). Only removing the module and reinstalling
// brings the database back, so the update does exactly that: once, and ONLY on
// that failure. An ABI skew (a binary built for another Node) is left to the rag
// server's start-time rebuild, which already cures it (ADR 0021).
// ─────────────────────────────────────────────────────────────────────────────
import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { join } from "node:path";

// The one signature of a binary that was never built. Deliberately NOT the rag
// server's wider `isNativeAbiError` family: a NODE_MODULE_VERSION skew is cured
// by a rebuild at start, and reinstalling it here would only cost a download.
const NEVER_BUILT = "Could not locate the bindings file";

/**
 * Probe, and on a never-built binary: remove, reinstall, probe again — once.
 * Never throws: a brain that reaches this was already without a database, so a
 * failed repair leaves it no worse, and the caller reports it.
 */
export function healNeverBuiltBinding({ probe, remove, reinstall }) {
  const first = probe();
  if (first.ok) return { outcome: "loaded" };
  if (!first.message.includes(NEVER_BUILT)) return { outcome: "left-to-runtime", detail: first.message };
  try {
    remove();
    reinstall();
  } catch (err) {
    return { outcome: "still-broken", detail: err.message };
  }
  const second = probe();
  return second.ok ? { outcome: "healed" } : { outcome: "still-broken", detail: second.message };
}

// Open (and close) an in-memory database in a child Node, from rag/. The binding
// loads lazily in the constructor (ADR 0021), so a bare `require` would call a
// never-built binary healthy.
const PROBE = "const D = require('better-sqlite3'); new D(':memory:').close();";

export function buildProbeInvocation({ ragDir }) {
  return { command: process.execPath, args: ["-e", PROBE], options: { cwd: ragDir, stdio: "pipe" } };
}

export function probeSqlite({ ragDir }) {
  const { command, args, options } = buildProbeInvocation({ ragDir });
  try {
    execFileSync(command, args, options);
    return { ok: true };
  } catch (err) {
    return { ok: false, message: String(err.stderr ?? err.message) };
  }
}

export function removeSqliteModule({ ragDir }) {
  rmSync(join(ragDir, "node_modules", "better-sqlite3"), { recursive: true, force: true });
}
