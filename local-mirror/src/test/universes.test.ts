import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isMultiverse,
  listAllUniverses,
  parseUniverseRegistry,
  resolveActiveUniverse,
} from '../lib/universe.js';

// The committed universe registry (ADR 0034) lives at `<brainRoot>/.vault-rag/universes.json`
// and holds the CREATED universes only — the implicit default is never stored, its absence IS
// what "default" means. local-mirror reads it for two reasons: to resolve the per-machine active
// pointer against reality (a ghost pointer must never freeze a ghost universe into a mirror), and
// to let the owner pick the universe a new mirror belongs to.

test('parseUniverseRegistry: reads the created universes out of the committed registry', () => {
  assert.deepEqual(parseUniverseRegistry('{"universes":["acme","blue-team"]}'), ['acme', 'blue-team']);
});

// A single-universe brain has NO registry file at all — the common, healthy case. Every
// degenerate shape must read as "no created universe", never as a crash: this is read on the
// path that declares a mirror, and refusing to declare one because a state file is corrupt
// would be a worse failure than falling back to the default scope.
test('parseUniverseRegistry: an absent, corrupt or shapeless registry reads as no created universe', () => {
  assert.deepEqual(parseUniverseRegistry(null), []);
  assert.deepEqual(parseUniverseRegistry(''), []);
  assert.deepEqual(parseUniverseRegistry('{ not json'), []);
  assert.deepEqual(parseUniverseRegistry('{}'), []);
  assert.deepEqual(parseUniverseRegistry('{"universes":"acme"}'), []);
  assert.deepEqual(parseUniverseRegistry('[]'), []);
  assert.deepEqual(parseUniverseRegistry('null'), []);
});

test('parseUniverseRegistry: keeps only usable names, trimmed (a blank entry is not a universe)', () => {
  assert.deepEqual(parseUniverseRegistry('{"universes":[" acme ","",null,42,"blue-team"]}'), [
    'acme',
    'blue-team',
  ]);
});

// ── The active pointer, resolved AGAINST the registry ────────────────────────
// The pointer is per-machine and gitignored; the registry is committed. So a universe renamed
// or deleted on another machine leaves this one pointing at a ghost. Trusting that pointer here
// would FREEZE a ghost universe into a brand-new mirror: its notes would land under
// `vault/<ghost>/mirrors/…` and be filtered out of every search, silently. Same rule as the
// brain-side `resolveActiveUniverse` (scripts/lib/universes.mjs), in the package that writes
// the most files.

test('resolveActiveUniverse: a pointer naming a registered universe is honoured, trimmed', () => {
  assert.equal(resolveActiveUniverse('acme\n', ['acme', 'blue-team']), 'acme');
  assert.equal(resolveActiveUniverse('  blue-team  ', ['acme', 'blue-team']), 'blue-team');
});

test('resolveActiveUniverse: a pointer naming a universe absent from the registry is a ghost', () => {
  assert.equal(resolveActiveUniverse('acme', ['blue-team']), 'default');
  assert.equal(resolveActiveUniverse('acme', []), 'default');
});

test('resolveActiveUniverse: a blank, whitespace-only or absent pointer is the default scope', () => {
  assert.equal(resolveActiveUniverse('', ['acme']), 'default');
  assert.equal(resolveActiveUniverse('   \n', ['acme']), 'default');
  assert.equal(resolveActiveUniverse(null, ['acme']), 'default');
});

// ── The menu, and the disclosure gate ────────────────────────────────────────

test('listAllUniverses: the default comes FIRST (it is the cross-cutting one), the rest sorted', () => {
  assert.deepEqual(listAllUniverses(['zeta', 'acme', 'blue-team']), [
    'default',
    'acme',
    'blue-team',
    'zeta',
  ]);
  assert.deepEqual(listAllUniverses([]), ['default'], 'the default always exists, alone or not');
});

// The gate is what keeps a single-universe owner from ever meeting the notion (ADR 0034). Its
// boundary is exactly "one created universe", i.e. two in total counting the implicit default.
test('isMultiverse: closed on a brain with no created universe, open from the first one', () => {
  assert.equal(isMultiverse([]), false);
  assert.equal(isMultiverse(['acme']), true);
  assert.equal(isMultiverse(['acme', 'blue-team']), true);
});
