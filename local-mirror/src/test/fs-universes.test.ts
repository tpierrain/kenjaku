import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readUniverses } from '../adapters/fs-universes.js';

// The brain's universe state (ADR 0034) lives in two files under `<brainRoot>/.vault-rag/`,
// both written by the `/switch` skill and both COMMITTED: the registry (`universes.json`, the
// created universes) and the pointer (`active-universe`). `setup_source` reads
// both — the registry to know what exists (and to disqualify a ghost pointer), the pointer to
// pre-select the universe the owner is working in. The pure rules live in `lib/universe.ts`;
// this adapter only does the I/O, and every read failure degrades to the default scope rather
// than breaking a declaration.

const POINTER = '/brain/.vault-rag/active-universe';
const REGISTRY = '/brain/.vault-rag/universes.json';

/** A fake filesystem: path → content; anything else throws ENOENT, like the real one. */
const filesystem =
  (files: Record<string, string>) =>
  (path: string): string => {
    const content = files[path];
    if (content === undefined) throw new Error(`ENOENT: no such file, open '${path}'`);
    return content;
  };

test('readUniverses: reads the registry and the pointer it validates', () => {
  const state = readUniverses(
    POINTER,
    REGISTRY,
    filesystem({ [REGISTRY]: '{"universes":["acme","blue-team"]}', [POINTER]: 'acme\n' }),
  );

  assert.deepEqual(state, { active: 'acme', registry: ['acme', 'blue-team'] });
});

test('readUniverses: a single-universe brain has neither file — the default scope, alone', () => {
  const state = readUniverses(POINTER, REGISTRY, filesystem({}));

  assert.deepEqual(state, { active: 'default', registry: [] });
});

// Pointer and registry travel together, so an ordinary rename/delete can no longer leave this
// one naming a ghost — but a brain can still arrive with the two out of step, and freezing that
// ghost into a new mirror would file its notes into a scope no search ever reaches.
test('readUniverses: a pointer naming a universe the registry no longer holds is disqualified', () => {
  const state = readUniverses(
    POINTER,
    REGISTRY,
    filesystem({ [REGISTRY]: '{"universes":["blue-team"]}', [POINTER]: 'acme\n' }),
  );

  assert.deepEqual(state, { active: 'default', registry: ['blue-team'] });
});

test('readUniverses: an unreadable pointer keeps the registry and falls back to the default', () => {
  const state = readUniverses(
    POINTER,
    REGISTRY,
    filesystem({ [REGISTRY]: '{"universes":["acme"]}' }),
  );

  assert.deepEqual(state, { active: 'default', registry: ['acme'] });
});

test('readUniverses: an unreadable registry disqualifies every pointer (nothing is known to exist)', () => {
  const state = readUniverses(POINTER, REGISTRY, filesystem({ [POINTER]: 'acme\n' }));

  assert.deepEqual(state, { active: 'default', registry: [] });
});

// Every test above injects its own reader, so the DEFAULT one — the only reader production ever
// uses — would go unexercised: read the two real files off a real disk once, or a brain that
// declares a mirror while working in `acme` would file it into the default scope for good.
test('readUniverses: the default reader reads the two real files off the disk', async () => {
  const stateDir = await mkdtemp(join(tmpdir(), 'gss-universes-'));
  const pointer = join(stateDir, 'active-universe');
  const registry = join(stateDir, 'universes.json');
  await writeFile(registry, '{"universes":["acme","blue-team"]}', 'utf8');
  await writeFile(pointer, 'acme\n', 'utf8');

  const state = readUniverses(pointer, registry);

  assert.deepEqual(state, { active: 'acme', registry: ['acme', 'blue-team'] });
});
