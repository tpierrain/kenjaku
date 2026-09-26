// ─────────────────────────────────────────────────────────────────────────────
// install-scripts.mjs — which dependencies' install scripts the engine expects,
// and whether package.json says so (plan v5.5.2 § S1.4, issue #132).
//
// npm 12 blocks a dependency's install scripts unless `allowScripts` in the
// project's package.json allows them, and better-sqlite3's script is what fetches
// its native binary: an engine installed with npm 12 and no declaration has no
// database. The declaration is therefore not paperwork, it is load-bearing.
//
// Entries must be NAME-ONLY (`"better-sqlite3": true`). npm's own default writes
// pinned ones (`better-sqlite3@12.10.1`), which stop matching at the next bump —
// an `npm audit fix` would then silently turn the engine off again. The lockfile
// already pins exact versions; the allowlist only has to say which packages.
// ─────────────────────────────────────────────────────────────────────────────

// `name@range` → `name`, keeping a scope's leading `@` (`@google/genai`).
const PINNED = /^((?:@[^/@]+\/)?[^@]+)@/;
const nameOf = (entry) => entry.match(PINNED)?.[1] ?? entry;

/**
 * What `pkg.allowScripts` fails to cover among the dependencies the lockfile says
 * carry an install script: `missing` (no entry), `pinned` (an entry tied to a
 * version), `denied` (an explicit `false`). All three empty = the engine's install
 * scripts will run under npm 12.
 */
export function installScriptGaps(pkg, lock) {
  const allow = pkg.allowScripts ?? {};
  const ruleFor = new Map(Object.entries(allow).map(([entry, allowed]) => [nameOf(entry), allowed]));

  const scripted = new Set(
    Object.entries(lock.packages)
      .filter(([path, meta]) => path !== "" && meta.hasInstallScript)
      .map(([path]) => path.slice(path.lastIndexOf("node_modules/") + "node_modules/".length)),
  );
  const sorted = (names) => [...names].sort();
  return {
    missing: sorted([...scripted].filter((name) => !ruleFor.has(name))),
    pinned: sorted(Object.keys(allow).filter((entry) => PINNED.test(entry))),
    denied: sorted([...scripted].filter((name) => ruleFor.get(name) === false)),
  };
}
