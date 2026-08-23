// ─────────────────────────────────────────────────────────────────────────────
// engine-script-coupling.mjs — one engine-owned script reaching into another.
//
// The `merge`-regime top-level scripts are refreshed INDEPENDENTLY of each other
// (`engine-script-refresh.mjs`, `groupOf: rel => rel`), and any one of them can be
// PRESERVED at its old version when the owner has tuned it. So a named import from
// one to another is a promise ACROSS VERSIONS that the engine cannot keep — and it
// breaks at LINK time, which is the one failure this family's defences are blind
// to: `node --check` parses the consumer happily, and `verifyWrite` only ever
// inspects the file it is writing, never the preserved sibling beside it.
//
// Same spirit and same shape as `entrypoint-discipline.mjs`: a pure scanner over a
// source string here, one repo-wide fail-loud test next door.
// ─────────────────────────────────────────────────────────────────────────────
import { lineOf, stripComments } from "./source-scan.mjs";

// A specifier naming a TOP-LEVEL neighbour: `./<name>.mjs`, no slash inside — so
// `./lib/repo-status.mjs` is deliberately not one. `scripts/lib/**` is a single
// `replace` glob, delivered whole at the engine's version and never preserved,
// which makes it the REMEDY this scanner points at rather than the disease.
const SIBLING_SPECIFIER = /["'](\.\/[^"'/]+\.mjs)["']/g;

// What makes a string a module specifier rather than a path in a variable: the
// `from` or `import(` immediately in front of it. That covers a static import, a
// default import, an `export … from` re-export and a dynamic `import()` — every
// form whose resolution binds this file to a version of the other one.
const IS_SPECIFIER = /(?:^|[^\w$])(?:from|import\()$/;

// Returns [{ line, module }] — one entry per sibling specifier, in source order,
// `module` being the bare file name (`auto-commit.mjs`).
export function findSiblingImports(source) {
  const clean = stripComments(source);
  const found = [];
  for (const match of clean.matchAll(SIBLING_SPECIFIER)) {
    const before = clean.slice(0, match.index).replace(/\s+$/, "");
    if (!IS_SPECIFIER.test(before)) continue;
    found.push({ line: lineOf(clean, match.index), module: match[1].slice("./".length) });
  }
  return found;
}
