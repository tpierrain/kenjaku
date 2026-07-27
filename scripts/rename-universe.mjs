#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// rename-universe.mjs — run FROM the brain folder to rename a universe, fully:
// the folder moves, every note under it is re-stamped, the registry entry
// changes name, and you keep standing where you were.
//
//   node scripts/rename-universe.mjs <old> <new>
//
// Decision D4 chose the FULL rename over a cheap display-name alias, cost
// accepted: paths change, so the index treats every note as new and re-embeds
// the whole universe. In exchange the new name is true everywhere — Obsidian,
// git and grep included — instead of leaving a stale folder behind.
//
// No TTY gate here, deliberately (unlike delete-universe.mjs): a rename loses
// nothing and is undone by renaming back.
// ─────────────────────────────────────────────────────────────────────────────
import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync } from "node:fs";
import { spawnSync } from "node:child_process";

import {
  planUniverseRename,
  vaultRagDir,
  writeRegistry,
  writeActiveUniverse,
} from "./lib/universes.mjs";
import { restampUniverse } from "./lib/stamp-universe.mjs";
import { needsShell } from "./lib/spawn-shell.mjs";
import { isEntrypoint } from "./lib/entrypoint.mjs";
import { listFilesRelPosix } from "./lib/fs-walk.mjs";

// What each refusal from the pure core says out loud, in one place, so no session
// has to invent it.
const REFUSALS = {
  empty: () => "✗ A rename needs both a universe to rename and a new name.",
  reserved: () =>
    "✗ The default scope cannot be renamed, nor be a rename's target: it is the " +
    "cross-cutting scope, and it has no folder of its own.",
  unknown: (plan) =>
    `✗ No universe named '${plan.name}'. Existing universes: ${plan.available.join(", ")}.`,
  exists: (plan) =>
    `✗ A universe named '${plan.name}' already exists. Merging two universes is a ` +
    `different operation — pick another name.`,
};

/**
 * What the rename is about to do, said BEFORE it is done. A rename is reversible,
 * so this is not a gate — it is the difference between a person who chose the
 * re-embed and one who is merely watching their machine be busy for a few minutes.
 * Deterministic here rather than improvised in chat (ADR 0009).
 */
function preflightMessage(plan, noteCount) {
  const pointer = plan.movePointer
    ? "you keep standing in it, under its new name"
    : "you stay where you are";
  return (
    `Renaming '${plan.from}' → '${plan.to}' will, in one go:\n` +
    `  · move vault/${plan.from}/ to vault/${plan.to}/, with its ${noteCount} notes\n` +
    `  · re-label every one of those notes with the new name\n` +
    `  · rename the registry entry (${pointer})\n` +
    `  · re-encode that whole universe for search: every path changed, so the index\n` +
    `    treats each note as new. This is the slow part — seconds on a small\n` +
    `    universe, a few minutes on a large one, and the machine works throughout.\n` +
    `Nothing is lost, and renaming back undoes it.`
  );
}

// Windows hands cwd() back as C:\brain, and a backslash survives into every path
// built from it — which fs tolerates but string comparisons do not. Normalising
// the ROOT once means every path below is POSIX by construction. Cf. installer
// toPosix / document-scanner / universes.mjs.
const toPosix = (p) => p.split("\\").join("/");

/** Runs the rename, or only describes it when argv starts with `--preflight`. */
export function runRenameUniverse(argv, deps) {
  const preflight = argv[0] === "--preflight";
  const [from, to] = preflight ? argv.slice(1) : argv;
  const root = toPosix(deps.cwd());
  const dir = vaultRagDir(root);
  const plan = planUniverseRename(deps.io, dir, from, to);
  if (!plan.ok) {
    deps.error(REFUSALS[plan.reason](plan));
    return 1;
  }

  if (preflight) {
    // Counted at the OLD path: nothing has moved, and nothing will on this path.
    deps.log(preflightMessage(plan, deps.listNotes(`${root}/vault/${plan.from}`).length));
    return 0;
  }

  const vault = `${root}/vault`;
  const universeDir = `${vault}/${plan.to}`;
  deps.renameSync(`${vault}/${plan.from}`, universeDir);

  // A note left declaring the old name would be filtered out of the very universe
  // it visibly lives in — the folder says one thing, the frontmatter another.
  for (const rel of deps.listNotes(universeDir)) {
    const path = `${universeDir}/${rel}`;
    deps.io.writeFileSync(path, restampUniverse(deps.io.readFileSync(path), plan.to));
  }

  writeRegistry(deps.io, dir, plan.registry);
  if (plan.movePointer) writeActiveUniverse(deps.io, dir, plan.to);

  // Every path under the universe changed, so the index treats each note as new:
  // this re-embeds the whole universe. That is the cost D4 accepted knowingly.
  const NPM = deps.platform === "win32" ? "npm.cmd" : "npm";
  const r = deps.spawnSync(NPM, ["run", "--silent", "reindex"], {
    cwd: `${root}/rag`,
    stdio: "inherit",
    // npm.cmd needs a shell since Node >= 18.20 (CVE-2024-27980) or EINVAL; no-op POSIX (ADR 0031).
    shell: needsShell(NPM, deps.platform),
  });
  if (r.status !== 0) {
    deps.error(
      "✗ The rename is done on disk but the re-index failed — run it by hand:  " +
        "cd rag && npm run reindex",
    );
    return 1;
  }

  deps.log(
    `✓ Renamed '${plan.from}' → '${plan.to}': the folder, every note's frontmatter, ` +
      `and the index. The whole universe was re-embedded, since all its paths changed.`,
  );
  return 0;
}

/** The real wiring, named rather than inlined so every branch above stays testable. */
export function realRenameDeps() {
  const io = {
    existsSync,
    readFileSync: (p) => readFileSync(p, "utf-8"),
    writeFileSync,
    mkdirSync,
  };
  return {
    cwd: () => process.cwd(),
    io,
    listNotes: (dir) =>
      existsSync(dir) ? listFilesRelPosix(dir).filter((f) => f.endsWith(".md")) : [],
    renameSync,
    spawnSync,
    platform: process.platform,
    log: (...a) => console.log(...a),
    error: (...a) => console.error(...a),
  };
}

if (isEntrypoint(import.meta.url, process.argv[1])) {
  process.exit(runRenameUniverse(process.argv.slice(2), realRenameDeps()));
}
