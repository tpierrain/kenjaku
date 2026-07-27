#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// delete-universe.mjs — run FROM the brain folder to delete a universe: its
// notes, its registry entry, and the pointer if you were standing in it.
//
//   node scripts/delete-universe.mjs <name>
//
// This is the one IRREVERSIBLE universe operation, so it is deliberately the
// least convenient (decision D3): it refuses to run unless a human is at the
// keyboard, and it deletes nothing until that human has retyped the name. There
// is no --yes and no piped-stdin path, ON PURPOSE — a gate an assistant can
// answer on your behalf guards nothing (ADR 0009).
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

import {
  planUniverseDeletion,
  vaultRagDir,
  writeRegistry,
  writeActiveUniverse,
  DEFAULT_UNIVERSE,
} from "./lib/universes.mjs";
import { needsShell } from "./lib/spawn-shell.mjs";
import { isEntrypoint } from "./lib/entrypoint.mjs";
import { listFilesRelPosix } from "./lib/fs-walk.mjs";

// What each refusal from the pure core says out loud. The wording lives here, in
// one place, so no session ever has to invent it.
const REFUSALS = {
  empty: () => "✗ No universe name given.",
  reserved: () =>
    "✗ The default scope cannot be deleted: it is where every note that belongs " +
    "to no particular sphere lives.",
  unknown: (plan) =>
    `✗ No universe named '${plan.name}'. Deletable universes: ${plan.available.join(", ")}.`,
};

/** Runs the guarded deletion. Returns the process exit code. */
export async function runDeleteUniverse(argv, deps) {
  if (!deps.isInteractive()) {
    deps.error(
      "✗ Deleting a universe needs an interactive terminal: run it yourself, " +
        "in your own terminal, from the brain folder.",
    );
    return 1;
  }

  const dir = vaultRagDir(deps.cwd());
  const plan = planUniverseDeletion(deps.io, dir, argv[0]);
  if (!plan.ok) {
    deps.error(REFUSALS[plan.reason](plan));
    return 1;
  }

  // Say what is about to be lost BEFORE asking, while there is still nothing to
  // regret: a confirmation you answer without knowing the count confirms nothing.
  const universeDir = `${deps.cwd()}/vault/${plan.name}`;
  const notes = deps.listNotes(universeDir);
  deps.log(
    `About to delete the universe '${plan.name}': ${notes.length} notes under ` +
      `vault/${plan.name}/, its registry entry, and its profile page.`,
  );

  const answer = await deps.askLine(`Type '${plan.name}' to confirm, anything else to cancel: `);
  if (answer.trim() !== plan.name) {
    deps.error("✗ Cancelled — nothing was deleted.");
    return 1;
  }

  // Notes first, registry second: the reverse order would leave a folder nobody
  // can name if this died in between.
  deps.rmSync(universeDir, { recursive: true, force: true });
  writeRegistry(deps.io, dir, plan.registry);
  if (plan.resetPointer) writeActiveUniverse(deps.io, dir, DEFAULT_UNIVERSE);

  // Files gone but still embedded means a brain that keeps quoting notes which no
  // longer exist — a failure nobody would ever trace back to a deletion.
  const NPM = deps.platform === "win32" ? "npm.cmd" : "npm";
  const r = deps.spawnSync(NPM, ["run", "--silent", "reindex"], {
    cwd: join(deps.cwd(), "rag"),
    stdio: "inherit",
    // npm.cmd needs a shell since Node >= 18.20 (CVE-2024-27980) or EINVAL; no-op POSIX (ADR 0031).
    shell: needsShell(NPM, deps.platform),
  });
  if (r.status !== 0) {
    deps.error("✗ re-index failed — run it by hand:  cd rag && npm run reindex");
    return 1;
  }

  // "Irreversible" is true of the working tree, not of the repo: the auto-commit
  // hook has been versioning these notes all along. The one moment that fact is
  // worth anything is right now, not buried in a doc nobody opens after the fact.
  deps.log(
    `✓ Universe '${plan.name}' deleted, and the index no longer knows it.\n` +
      `  Git still does: to bring it back, find the commit that removed it with\n` +
      `    git log --diff-filter=D -- vault/${plan.name}/\n` +
      `  then restore it from just before that commit:\n` +
      `    git checkout <commit>~1 -- vault/${plan.name}/`,
  );
  return 0;
}

/**
 * The real wiring, named rather than inlined so every branch above stays
 * reachable from a test — and so the ONE guarantee that cannot be unit-tested
 * (a real TTY) is a single visible line.
 */
export function realDeleteDeps() {
  return {
    cwd: () => process.cwd(),
    // BOTH ends must be a terminal: a piped stdin is exactly the shape an
    // assistant would use to answer the confirmation on the owner's behalf.
    isInteractive: () => Boolean(stdin.isTTY && stdout.isTTY),
    askLine: async (question) => {
      const rl = createInterface({ input: stdin, output: stdout });
      try {
        return await rl.question(question);
      } finally {
        rl.close();
      }
    },
    io: {
      existsSync,
      readFileSync: (p) => readFileSync(p, "utf-8"),
      writeFileSync,
      mkdirSync,
    },
    listNotes: (dir) =>
      existsSync(dir) ? listFilesRelPosix(dir).filter((f) => f.endsWith(".md")) : [],
    rmSync,
    spawnSync,
    platform: process.platform,
    log: (...a) => console.log(...a),
    error: (...a) => console.error(...a),
  };
}

if (isEntrypoint(import.meta.url, process.argv[1])) {
  process.exit(await runDeleteUniverse(process.argv.slice(2), realDeleteDeps()));
}
