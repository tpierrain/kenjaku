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
  // Through the writer's own path builder: a message naming a folder the files are not in is how
  // an owner concludes the mirror is broken.
  assert.equal(
    result.message,
    'Moved "team-a" to acme: 2 page(s) now live under acme/mirrors/team-a/.',
  );
});

// The move back: a mirror wrongly filed under one universe belongs to everybody. The cross-cutting
// scope is the ABSENCE of the key, so its pages return to the vault root and the config carries no
// universe at all — the same implicit-when-default rule a declaration follows.
test('moving a mirror to the cross-cutting universe returns its pages to the vault root', async () => {
  const harness = aLocalMirror()
    .withActiveUniverse('acme')
    .withDeclaredSources(aNotionLocalMirror({ universe: 'acme' }))
    .withNotionPages(aNotionPage({ id: 'page-1' }));
  const gss = harness.build();
  await gss.sync('team-a');

  const result = await gss.moveSource('team-a', 'default');

  assert.equal(result.ok, true);
  assert.equal(
    result.message,
    'Moved "team-a" to the cross-cutting universe: 1 page(s) now live under mirrors/team-a/.',
  );
  assert.deepEqual([...harness.vaultFiles().keys()], ['mirrors/team-a/page-1.md']);
  const [declared] = await harness.declaredSources();
  assert.equal('universe' in declared, false, 'the cross-cutting scope carries no key');
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

// Moving a mirror where it already is must be a no-op, not a shredder: the new path IS the old
// path, so the page written in phase 1 is the very file phase 2 would delete. An owner who
// re-confirms a scope, or a driver that replays the call, must not lose the corpus.
test('moving a mirror into the universe it already lives in keeps every page', async () => {
  const harness = aLocalMirror()
    .withActiveUniverse('acme')
    .withDeclaredSources(aNotionLocalMirror({ universe: 'acme' }))
    .withNotionPages(aNotionPage({ id: 'page-1' }), aNotionPage({ id: 'page-2' }));
  const gss = harness.build();
  await gss.sync('team-a');

  const result = await gss.moveSource('team-a', 'acme');

  assert.equal(result.ok, true);
  assert.deepEqual(
    [...harness.vaultFiles().keys()].sort(),
    ['acme/mirrors/team-a/page-1.md', 'acme/mirrors/team-a/page-2.md'],
    'the pages are still there — every one of them',
  );
});

// A move is all-or-nothing. Half a move is the worst possible outcome: some pages under the new
// universe, some under the old, a config that agrees with neither, and a corpus the owner can only
// repair by hand. So the new copies are written FIRST, and a failure anywhere puts them back —
// nothing is deleted and nothing is re-declared until every page has landed.
test('a move that fails partway leaves the mirror exactly as it was', async () => {
  const harness = aLocalMirror()
    .withActiveUniverse('acme')
    .withDeclaredSources(aNotionLocalMirror())
    .withNotionPages(aNotionPage({ id: 'page-1' }), aNotionPage({ id: 'page-2' }));
  const gss = harness.build();
  await gss.sync('team-a');
  harness.withFailingWriteOf('acme/mirrors/team-a/page-2.md');

  const result = await gss.moveSource('team-a', 'acme');

  assert.equal(result.ok, false);
  assert.equal(result.moved, 0, 'a partial move is not a move');
  assert.equal(
    result.message,
    '"team-a" was NOT moved: ENOSPC: cannot write acme/mirrors/team-a/page-2.md. Its 2 page(s) ' +
      'are untouched, where they were, and the mirror still belongs to the universe it did. ' +
      'Nothing was left half-moved — try again once the vault is writable.',
  );
  assert.deepEqual(
    harness.deletedVaultFiles(),
    ['acme/mirrors/team-a/page-1.md'],
    'the rollback removed the copy it had already written, and nothing else',
  );
  assert.deepEqual(
    [...harness.vaultFiles().keys()].sort(),
    ['mirrors/team-a/page-1.md', 'mirrors/team-a/page-2.md'],
    'every page is still at its old path, and no half-written copy is left in the new folder',
  );
  const [declared] = await harness.declaredSources();
  assert.equal('universe' in declared, false, 'and the mirror still belongs where it did');
});

// A name that matches no mirror is a typo or a mirror already removed. Silently succeeding would
// let an owner believe a corpus was re-filed when nothing exists to re-file.
test('moving a mirror that was never declared is refused, and the real ones are named', async () => {
  const harness = aLocalMirror()
    .withActiveUniverse('acme')
    .withDeclaredSources(aNotionLocalMirror(), aNotionLocalMirror({ name: 'product-wiki' }));
  const gss = harness.build();

  const result = await gss.moveSource('team-b', 'acme');

  assert.deepEqual(result, {
    name: 'team-b',
    ok: false,
    moved: 0,
    message:
      'There is no mirror called "team-b", so nothing was moved. The declared ones are: ' +
      'team-a, product-wiki.',
  });
});

// The same refusal on a brain that has declared nothing at all: listing "the declared ones are:"
// followed by an empty space would read as a bug. It says there are none.
test('moving on a brain with no mirror at all says exactly that', async () => {
  const gss = aLocalMirror().withActiveUniverse('acme').build();

  const result = await gss.moveSource('team-a', 'acme');

  assert.equal(
    result.message,
    'There is no mirror called "team-a", so nothing was moved. No mirror is declared on this brain yet.',
  );
});

// A mirror can be declared and never synced (its first pull failed, say). It has no pages to
// re-file, so the move is about the config alone — and it must not invent a sidecar for a mirror
// that has none, or a later sync would read a state claiming pages that were never pulled.
test('moving a mirror that was never synced re-files the config and touches no page', async () => {
  const harness = aLocalMirror()
    .withActiveUniverse('acme')
    .withDeclaredSources(aNotionLocalMirror());
  const gss = harness.build();

  const result = await gss.moveSource('team-a', 'acme');

  assert.deepEqual(result, {
    name: 'team-a',
    ok: true,
    moved: 0,
    message: 'Moved "team-a" to acme: 0 page(s) now live under acme/mirrors/team-a/.',
  });
  assert.equal(harness.vaultFiles().size, 0);
  assert.equal(await harness.sidecarOf('team-a'), null, 'and no sidecar was invented for it');
  const [declared] = await harness.declaredSources();
  assert.equal(declared.universe, 'acme');
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
