import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aLocalMirror, aNotionLocalMirror, aNotionPage } from './builder.js';

// Acceptance tests at the API port: RE-FILING a declared mirror into another universe (ADR 0034).
//
// The universe is frozen at declaration because the sync path must never re-read it — a background
// tick firing while the owner switches would otherwise scatter one mirror's notes across universes.
// But a mirror declared before universes existed sits in the cross-cutting scope by default, and
// an employer's wiki does not belong there: it dilutes every other universe's results. So there is
// ONE deliberate way to change it, asked for explicitly, never inferred: a move.
//
// A move is local. It re-files the pages already on disk — no re-pull, no token, no network — and
// leaves nothing behind: the whole point is that the old copies cannot survive as a stale twin.

test('moving a mirror re-files its pages under the target universe, leaving nothing behind', async () => {
  const harness = aLocalMirror()
    .withActiveUniverse('acme')
    .withDeclaredSources(aNotionLocalMirror())
    .withNotionPages(aNotionPage({ id: 'page-1' }), aNotionPage({ id: 'page-2' }));
  const gss = harness.build();
  await gss.sync('team-a');

  const result = await gss.moveSource('team-a', 'acme');

  assert.equal(result.ok, true);
  assert.deepEqual(
    [...harness.vaultFiles().keys()].sort(),
    ['acme/mirrors/team-a/page-1.md', 'acme/mirrors/team-a/page-2.md'],
    'every page moved, and not one stayed at the old path',
  );
  const [declared] = await harness.declaredSources();
  assert.equal(declared.universe, 'acme', 'and the mirror now belongs to the target universe');
});

// The sidecar is the reconciliation map: it says where each page lives. Left pointing at the old
// paths, a later `remove_source cleanup` would delete files that are no longer there and leave the
// moved corpus orphaned in the vault — the exact stale-twin the move exists to prevent.
test('after a move, the sidecar tracks the pages where they now live', async () => {
  const harness = aLocalMirror()
    .withActiveUniverse('acme')
    .withDeclaredSources(aNotionLocalMirror())
    .withNotionPages(aNotionPage({ id: 'page-1' }), aNotionPage({ id: 'page-2' }));
  const gss = harness.build();
  await gss.sync('team-a');
  await gss.moveSource('team-a', 'acme');

  await gss.removeSource('team-a', true);

  assert.deepEqual([...harness.vaultFiles().keys()], [], 'the cleanup found every moved page');
});

// A moved page is REBUILT, not patched, so it must come out byte-identical to the page a sync
// would write in the new folder. If it drifts by so much as a newline, the very next refresh sees
// a hash mismatch and rewrites the whole corpus — a move would silently cost a full rewrite.
test('a refresh right after a move rewrites nothing: the moved pages are already what a sync writes', async () => {
  const harness = aLocalMirror()
    .withActiveUniverse('acme')
    .withDeclaredSources(aNotionLocalMirror())
    .withNotionPages(aNotionPage({ id: 'page-1' }), aNotionPage({ id: 'page-2' }));
  const gss = harness.build();
  await gss.sync('team-a');
  await gss.moveSource('team-a', 'acme');

  const report = await gss.sync('team-a');

  assert.deepEqual(report, { name: 'team-a', status: 'ok', written: 0, deleted: 0, unchanged: 2 });
});

// Same rule as a declaration (ADR 0034): a universe nobody created is a typo or the stale memory
// of a renamed one. Filing a whole corpus into it would put every page in a scope no search ever
// reaches — invisible, yet perfectly present on disk. Refuse, and name the ones that exist.
test('moving into a universe that does not exist is refused, and nothing is touched', async () => {
  const harness = aLocalMirror()
    .withActiveUniverse('acme')
    .withUniverses('blue-team')
    .withDeclaredSources(aNotionLocalMirror())
    .withNotionPages(aNotionPage({ id: 'page-1' }));
  const gss = harness.build();
  await gss.sync('team-a');

  const result = await gss.moveSource('team-a', 'acme-corp');

  assert.deepEqual(result, {
    name: 'team-a',
    ok: false,
    moved: 0,
    message:
      'There is no universe called "acme-corp", so "team-a" was not moved. The ones that exist ' +
      'are: default, acme, blue-team. Call move_source again with one of them (or create it ' +
      'first with /switch).',
  });
  assert.deepEqual(
    [...harness.vaultFiles().keys()],
    ['mirrors/team-a/page-1.md'],
    'the pages stayed exactly where they were',
  );
  const [declared] = await harness.declaredSources();
  assert.equal('universe' in declared, false, 'and the mirror still belongs where it did');
});
