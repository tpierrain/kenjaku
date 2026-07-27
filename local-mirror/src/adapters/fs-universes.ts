// Driven adapter: reads the brain's universe state (ADR 0034) from the two files the `/switch`
// skill maintains under `<brainRoot>/.vault-rag/` — the COMMITTED registry (`universes.json`)
// and the PER-MACHINE, gitignored pointer (`active-universe`). Used ONLY by `setup_source`, to
// decide (and freeze) which universe a new mirror belongs to — never on the hot sync path.
//
// The pure rules (parsing, and resolving the pointer against the registry) live in
// `lib/universe.ts` so they are unit-testable without touching a disk; this file is I/O only.
// Any read failure degrades to the default scope rather than breaking a declaration: a
// single-universe brain has neither file, which is the common, healthy case.

import { readFileSync } from 'node:fs';
import { parseUniverseRegistry, resolveActiveUniverse } from '../lib/universe.js';
import type { UniverseState } from '../domain/ports.js';

/** Read a file, or `null` when it is absent/unreadable (both are "nothing declared" here). */
function readOrNull(path: string, read: (p: string) => string): string | null {
  try {
    return read(path);
  } catch {
    return null;
  }
}

/**
 * Read + normalize the brain's universe state. `read` is injectable for tests. The registry is
 * read FIRST because it is what makes the pointer trustworthy: a pointer naming a universe the
 * registry no longer holds is a ghost, and resolves to the default scope.
 */
export function readUniverses(
  pointerPath: string,
  registryPath: string,
  read: (p: string) => string = (p) => readFileSync(p, 'utf8'),
): UniverseState {
  const registry = parseUniverseRegistry(readOrNull(registryPath, read));
  return { active: resolveActiveUniverse(readOrNull(pointerPath, read), registry), registry };
}
