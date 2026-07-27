// Universes — a soft, progressively-disclosed retrieval scope (ADR 0034).
//
// THE default universe: a mirror with no explicit universe belongs to it, lands at the
// vault root, and never renders for a single-universe user. This is the ONE place the
// TS package names it.
//
// Kept in LOCK-STEP with the engine's two other declarations (they cannot import across
// package + language boundaries): `scripts/lib/universes.mjs` (launcher scripts) and
// `rag/src/lib/universe.ts` (RAG). If this value ever changes, change all three.
export const DEFAULT_UNIVERSE = 'default';

/**
 * Pure: the CREATED universes held by the committed registry (`.vault-rag/universes.json`,
 * shape `{ "universes": [...] }`). The implicit default is never stored — its absence IS what
 * "default" means — so it never appears here.
 */
export function parseUniverseRegistry(raw: string | null): string[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw ?? '');
  } catch {
    // A corrupt or absent registry must never break a mirror declaration: it reads as
    // "no created universe", i.e. exactly a single-universe brain, which has no file either.
    return [];
  }
  const universes = (parsed as { universes?: unknown } | null)?.universes;
  if (!Array.isArray(universes)) return [];
  return universes
    .filter((name): name is string => typeof name === 'string')
    .map((name) => name.trim())
    .filter((name) => name !== '');
}

/**
 * Pure: every universe that exists, as a menu — the default FIRST (it always exists, and it is
 * the cross-cutting scope), then the created ones sorted. Mirrors the brain-side
 * `listAllUniverses` (`scripts/lib/universes.mjs`).
 */
export function listAllUniverses(registry: readonly string[]): string[] {
  return [DEFAULT_UNIVERSE, ...[...registry].sort()];
}

/**
 * Pure: the progressive-disclosure gate (ADR 0034). True only once at least TWO universes exist
 * (the implicit default plus one created). Below it the whole notion stays invisible — a
 * single-universe owner must never meet the word. Mirrors the brain-side `isMultiverse`.
 */
export function isMultiverse(registry: readonly string[]): boolean {
  return listAllUniverses(registry).length >= 2;
}

/**
 * Pure: resolve the per-machine active pointer AGAINST the committed registry. A pointer naming
 * a universe that no longer exists (renamed or deleted on another machine, pulled in since) is an
 * orphan and resolves to the default scope — trusting it would freeze a GHOST universe into a new
 * mirror, whose notes are then filtered out of every search, silently. Blank/absent → default.
 *
 * Same rule as the brain-side `resolveActiveUniverse` (`scripts/lib/universes.mjs`); the two
 * cannot import across the package + language boundary, so they are kept in lock-step by hand.
 */
export function resolveActiveUniverse(raw: string | null, registry: readonly string[]): string {
  const trimmed = raw?.trim();
  return trimmed && registry.includes(trimmed) ? trimmed : DEFAULT_UNIVERSE;
}
