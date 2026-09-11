#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// unwrap-markdown.mjs — run FROM the brain folder to undo hard-wrapped Markdown.
//
// The deterministic net behind the constitution's "never insert a line break the
// content does not require" rule. It covers FILES only: nothing can inspect what
// Claude prints into the chat before you read it, so that half stays a written
// reflex (see CLAUDE.engine.md).
//
//   node scripts/unwrap-markdown.mjs vault            # rewrite every .md under vault/
//   node scripts/unwrap-markdown.mjs --check vault    # report, change nothing (exit 1 if any)
//   node scripts/unwrap-markdown.mjs a.md b.md        # named files
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync, statSync, readdirSync } from "node:fs";
import { join, extname } from "node:path";

import { unwrapMarkdown } from "./lib/unwrap-markdown.mjs";
import { runAsEntrypoint } from "./lib/entrypoint.mjs";

const CHECK_FLAG = "--check";
const USAGE = `usage: node scripts/unwrap-markdown.mjs [${CHECK_FLAG}] <file|dir> [...]`;

// Reported paths go out in POSIX form so the output reads identically on Windows,
// where join() yields backslashes (CONVENTIONS §9, as lint-vault does).
const toPosix = (p) => p.split("\\").join("/");

// Every .md under `target`, or `target` itself when it is a file. Dot-folders and
// node_modules are skipped: `.obsidian` holds the viewer's own JSON, and neither is
// the owner's prose.
export function listMarkdownFiles(target, deps) {
  if (!deps.isDirectory(target)) return extname(target) === ".md" ? [target] : [];
  const found = [];
  for (const entry of deps.readDir(target)) {
    if (entry.startsWith(".") || entry === "node_modules") continue;
    found.push(...listMarkdownFiles(join(target, entry), deps));
  }
  return found;
}

export const realUnwrapDeps = {
  isDirectory: (p) => statSync(p).isDirectory(),
  readDir: (p) => readdirSync(p),
  readFile: (p) => readFileSync(p, "utf8"),
  writeFile: (p, text) => writeFileSync(p, text),
  log: (...a) => console.log(...a),
  error: (...a) => console.error(...a),
};

// Rewrite (or, with --check, merely report) every hard-wrapped file under the
// targets. Returns the process exit code: 0 nothing left to do, 1 changes found
// in --check mode, 2 nothing to scan. All side effects come through `deps`.
export function runUnwrap(argv, deps = realUnwrapDeps) {
  const check = argv.includes(CHECK_FLAG);
  const targets = argv.filter((a) => a !== CHECK_FLAG);
  if (targets.length === 0) {
    deps.error(USAGE);
    return 2;
  }

  let changed = 0;
  for (const target of targets) {
    for (const file of listMarkdownFiles(target, deps)) {
      const before = deps.readFile(file);
      const after = unwrapMarkdown(before);
      // An untouched file is left untouched on disk too: rewriting it byte-identical
      // would still restamp its mtime and dirty every `git status` it appears in.
      if (before === after) continue;
      changed++;
      if (check) {
        deps.log(`would unwrap: ${toPosix(file)}`);
      } else {
        deps.writeFile(file, after);
        deps.log(`unwrapped: ${toPosix(file)}`);
      }
    }
  }

  deps.log(check ? `${changed} file(s) would change` : `${changed} file(s) rewritten`);
  // --check is the composable half: a non-zero exit is what lets it gate anything.
  return check && changed > 0 ? 1 : 0;
}

runAsEntrypoint(import.meta.url, process.argv, runUnwrap);
