#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// refresh-note.mjs — run FROM the brain folder to REFRESH a living vault page:
// append a dated section and bump its `updated:` — deterministically (ADR 0009).
//
// The twin of file-back-note.mjs, for the other half of `/consolidate`: creation
// was already deterministic, the refresh was described in prose and performed
// freehand — and that is the one that damaged a page (F12: a second `updated:`
// key, invalid YAML, the note unreadable to the indexer ever since).
//
//   echo '{"path":"topics/crise.md","section":"## 2026-07-28 — …\n\n…"}' \
//     | node scripts/refresh-note.mjs
//
// It NEVER creates (that is file-back-note.mjs's door, which enforces the
// taxonomy) and never writes to a page whose frontmatter is already damaged —
// it names the damage instead. Exits 0 when written, 1 when refused/error.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { refreshNote } from "./lib/note-refresh.mjs";
import { isEntrypoint } from "./lib/entrypoint.mjs";

// Vault paths are compared and written in POSIX form so behaviour is identical
// across platforms (cf. file-back-note.mjs).
const toPosix = (p) => p.split("\\").join("/");

export const realRefreshDeps = {
  cwd: () => process.cwd(),
  today: () => new Date().toISOString().slice(0, 10),
  readInput: () => readFileSync(0, "utf8"),
  exists: (p) => existsSync(p),
  readFile: (p) => readFileSync(p, "utf8"),
  writeFile: (p, content) => {
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, content);
  },
  log: (...a) => console.log(...a),
  error: (...a) => console.error(...a),
};

/**
 * Reads a JSON refresh spec `{ path, section }` on stdin and rewrites that vault
 * page. Returns the process exit code: 0 written, 1 refused/error.
 */
export function runRefresh(argv, deps = realRefreshDeps) {
  let spec;
  try {
    spec = JSON.parse(deps.readInput());
  } catch (err) {
    deps.error(`✗ Invalid JSON spec on stdin: ${err.message}`);
    return 1;
  }

  // Parsing succeeded, which says nothing about the SHAPE: `null`, `"x"` and `[]` are
  // all valid JSON, and reaching for `.path` on the first threw a TypeError — a node
  // stack trace at an owner, from a script whose contract is "exit 1, and say why".
  if (typeof spec?.path !== "string" || !spec.path) {
    deps.error(
      `✗ The refresh spec needs a "path" (a note under vault/), e.g. {"path": "topics/x.md", "section": "…"}.`,
    );
    return 1;
  }

  const vaultDir = toPosix(join(deps.cwd(), "vault"));
  const absPath = toPosix(join(vaultDir, spec.path));
  // Containment, not politeness: a `..` in the spec would otherwise let a refresh
  // rewrite any file the brain can reach.
  if (!absPath.startsWith(`${vaultDir}/`)) {
    deps.error(`✗ "${spec.path}" is outside the vault — a refresh only ever touches vault/.`);
    return 1;
  }
  if (!deps.exists(absPath)) {
    deps.error(
      `✗ vault/${spec.path} does not exist — refreshing never creates. ` +
        `File a new page with scripts/file-back-note.mjs instead.`,
    );
    return 1;
  }

  let next;
  try {
    next = refreshNote({
      content: deps.readFile(absPath),
      today: deps.today(),
      section: spec.section,
    });
  } catch (err) {
    deps.error(`✗ vault/${spec.path}: ${err.message}`);
    return 1;
  }

  deps.writeFile(absPath, next);
  deps.log(`✓ Refreshed: vault/${spec.path} (updated: ${deps.today()})`);
  return 0;
}

if (isEntrypoint(import.meta.url, process.argv[1])) {
  process.exit(runRefresh(process.argv.slice(2)));
}
