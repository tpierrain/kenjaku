import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aLocalMirror, aNotionLocalMirror, aNotionPage } from './builder.js';

// Acceptance tests at the API port: which UNIVERSE a new mirror belongs to (ADR 0034).
//
// A mirror is ALWAYS attached to a universe — the default one when that is all there is, one of
// the existing ones otherwise. The attachment is FROZEN at declaration time (never re-read on the
// hot sync path), and moving a mirror afterwards costs a full re-embed of every mirrored note. So
// the cheap moment to get the scope right is BEFORE the first pull, which is why, past the
// progressive-disclosure gate, a `setup_source` that does not name a universe pulls nothing and
// asks. Below the gate there is nothing to choose: one call, one pull, and the owner never meets
// the word.

const aSetupRequest = (overrides: Record<string, string> = {}) => ({
  name: 'team-a',
  title: 'Team A — invoices',
  description: 'Questions about team workflows.',
  rootPageUrl: 'https://www.notion.so/acme/Page-0123abc0b1c24d6e8f0a1b2c3d4e5f60',
  tokenEnv: 'GOLDEN_TEAM_A_NOTION_TOKEN',
  ...overrides,
});

test('past the gate, a setup that names no universe pulls nothing and asks which one', async () => {
  const harness = aLocalMirror()
    .withActiveUniverse('acme')
    .withUniverses('blue-team')
    .withConnectablePages(aNotionPage({ id: 'page-1' }));
  const gss = harness.build();

  const result = await gss.setupSource(aSetupRequest());

  assert.deepEqual(
    result.awaitingUniverse,
    { active: 'acme', universes: ['default', 'acme', 'blue-team'] },
    'the core hands the caller the menu and the pre-selection — no prose to parse',
  );
  assert.equal(result.ok, false, 'nothing was set up yet');
  assert.equal((await harness.declaredSources()).length, 0, 'no mirror is declared before the choice');
  assert.equal(harness.vaultFiles().size, 0, 'and not a single note is pulled');
  // Asserted WHOLE, not by fragments: this message is the entire user-facing surface of the
  // choice — where the pages would land, the full menu (a list is not a list until it renders
  // with separators), why the default is the cross-cutting one, and what to do next. Matching
  // pieces of it let half the sentence be deleted without a single test noticing.
  assert.equal(
    result.message,
    'Nothing declared and nothing pulled yet: "team-a" must first be attached to a universe. ' +
      "Left as it is, it would join 'acme' (the one you are working in) and its pages would " +
      'land under acme/mirrors/team-a/. Available: default, acme, blue-team — ' +
      "'default' is the cross-cutting one, for a source every universe should find (a " +
      'company-wide wiki, say). Moving a mirror afterwards costs a full re-embed of every page ' +
      'it holds, so this is the cheap moment to get it right. Call setup_source again with the ' +
      'universe named.',
  );
});

test('naming a universe on the second call declares the mirror there and pulls it', async () => {
  const harness = aLocalMirror()
    .withActiveUniverse('acme')
    .withUniverses('blue-team')
    .withConnectablePages(aNotionPage({ id: 'page-1' }));
  const gss = harness.build();

  const result = await gss.setupSource(aSetupRequest({ universe: 'blue-team' }));

  assert.equal(result.ok, true);
  assert.equal(result.awaitingUniverse, undefined, 'the choice is made — nothing left to ask');
  const declared = await harness.declaredSources();
  assert.equal(declared[0].universe, 'blue-team', 'the CHOSEN universe is frozen, not the active one');
  assert.ok(
    harness.vaultFiles().has('blue-team/mirrors/team-a/page-1.md'),
    'and the first pull lands under the chosen universe',
  );
});

// A name that matches no universe is a typo or a stale memory of one that was renamed. Trusting
// it would create a folder no `/switch` knows about, whose notes no search would ever reach.
test('a universe that does not exist is refused, and the real ones are named', async () => {
  const harness = aLocalMirror()
    .withActiveUniverse('acme')
    .withUniverses('blue-team')
    .withConnectablePages(aNotionPage({ id: 'page-1' }));
  const gss = harness.build();

  const result = await gss.setupSource(aSetupRequest({ universe: 'acme-corp' }));

  assert.equal(result.ok, false);
  assert.equal(
    result.message,
    'There is no universe called "acme-corp", so nothing was declared or pulled. The ones that ' +
      'exist are: default, acme, blue-team. Call setup_source again with one of them (or create ' +
      'it first with /switch).',
  );
  assert.deepEqual(result.awaitingUniverse, { active: 'acme', universes: ['default', 'acme', 'blue-team'] });
  assert.equal((await harness.declaredSources()).length, 0, 'an unknown universe declares nothing');
  assert.equal(harness.vaultFiles().size, 0, 'and pulls nothing into a folder nobody knows about');
});

// The cross-cutting choice, and the reason confirm-only was rejected: a company-wide wiki belongs
// to no single universe, and requiring a `/switch` to default first is something nobody guesses.
test('choosing the default universe attaches the mirror cross-cutting, at the vault root', async () => {
  const harness = aLocalMirror()
    .withActiveUniverse('acme')
    .withConnectablePages(aNotionPage({ id: 'page-1' }));
  const gss = harness.build();

  const result = await gss.setupSource(aSetupRequest({ universe: 'default' }));

  assert.equal(result.ok, true);
  const declared = await harness.declaredSources();
  assert.equal('universe' in declared[0], false, 'the cross-cutting scope carries no key');
  assert.ok(harness.vaultFiles().has('mirrors/team-a/page-1.md'), 'and its pages live at the root');
});

// Progressive disclosure (ADR 0034): below the gate the notion does not exist yet. One call, one
// pull, and the owner must not meet the word — not in the message, not as a question.
test('below the gate, a single call pulls straight away and the word never surfaces', async () => {
  const harness = aLocalMirror().withConnectablePages(aNotionPage({ id: 'page-1' }));
  const gss = harness.build();

  const result = await gss.setupSource(aSetupRequest());

  assert.equal(result.ok, true);
  assert.equal(result.awaitingUniverse, undefined, 'there is nothing to choose from');
  assert.doesNotMatch(result.message, /universe/i);
  const declared = await harness.declaredSources();
  assert.equal('universe' in declared[0], false, 'no key: a pre-universes mirror reads the same');
  assert.ok(harness.vaultFiles().has('mirrors/team-a/page-1.md'));
});

// DEFECT (found while implementing the choice): the success message used to name `target_dir`
// alone, so a universe-scoped mirror was announced at `mirrors/<name>/` while its pages actually
// landed at `<universe>/mirrors/<name>/`. It now goes through the same path builder as the
// writer, so the sentence cannot drift from the disk again.
test('the success message names the folder the pages are really in, universe included', async () => {
  const harness = aLocalMirror()
    .withActiveUniverse('acme')
    .withConnectablePages(aNotionPage({ id: 'page-1' }));
  const gss = harness.build();

  const result = await gss.setupSource(aSetupRequest({ universe: 'acme' }));

  const [written] = [...harness.vaultFiles().keys()];
  assert.equal(written, 'acme/mirrors/team-a/page-1.md');
  assert.match(result.message, /Files live under acme\/mirrors\/team-a\//);
});

// A mirror declared before universes existed carries no universe, so it stays cross-cutting at the
// vault root. The natural way to re-file it is to call setup_source again with the universe named
// — and that used to REPLACE the config and pull the whole corpus into the new folder while the
// old files stayed on disk, indexed, frozen forever: one mirror, two copies, one of them dead.
// Deletion reconciliation cannot catch them (it only removes pages that left the NOTION perimeter),
// so nothing would ever clean up. Re-declaration is refused instead, before a single page is
// fetched, and the refusal names the route that actually works.
test('re-declaring a mirror into another universe is refused, and nothing is touched', async () => {
  const harness = aLocalMirror()
    .withActiveUniverse('acme')
    .withDeclaredSources(aNotionLocalMirror())
    .withNotionPages(aNotionPage({ id: 'page-1' }));
  const gss = harness.build();

  const result = await gss.setupSource(aSetupRequest({ universe: 'acme' }));

  assert.equal(result.ok, false);
  assert.equal(
    result.message,
    'The "team-a" mirror already exists, in the cross-cutting universe, and a mirror cannot ' +
      'change universe by being declared again: its pages would be pulled into acme/mirrors/' +
      'team-a/ while the old copies stayed behind, indexed and never refreshed again. To re-file ' +
      'it, remove it with its files (remove_source "team-a", cleanup: true) and set it up again ' +
      'in acme. To change anything else about it — a rotated token, a wider scope — declare it ' +
      'again in the cross-cutting universe.',
  );
  assert.deepEqual(
    await harness.declaredSources(),
    [aNotionLocalMirror()],
    'the declared mirror is left exactly as it was',
  );
  assert.equal(harness.vaultFiles().size, 0, 'and not one page was pulled into the new folder');
});

// The other half of that refusal: it targets a CHANGE of universe, nothing else. Re-declaring a
// mirror where it already lives is how a rotated token or a widened root page gets applied, and
// the refusal above explicitly promises it still works — so the promise is held to a test.
test('re-declaring a mirror in the universe it already lives in still works', async () => {
  const harness = aLocalMirror()
    .withActiveUniverse('acme')
    .withDeclaredSources(aNotionLocalMirror({ universe: 'acme' }))
    .withNotionPages(aNotionPage({ id: 'page-1' }));
  const gss = harness.build();

  const result = await gss.setupSource(
    aSetupRequest({ universe: 'acme', tokenEnv: 'ROTATED_TEAM_A_NOTION_TOKEN' }),
  );

  assert.equal(result.ok, true);
  const [declared] = await harness.declaredSources();
  assert.equal(declared.connector.config.token_env, 'ROTATED_TEAM_A_NOTION_TOKEN', 'the new token took');
  assert.ok(harness.vaultFiles().has('acme/mirrors/team-a/page-1.md'), 'and the pages stay put');
});

// The confirmation belongs to the FIRST pull only. Re-asking on every refresh is how a useful
// confirmation becomes noise people click through — and the universe is frozen in the config
// anyway, deliberately never re-read on the hot sync path.
test('refreshing a declared mirror never asks again, however many universes exist', async () => {
  const harness = aLocalMirror()
    .withActiveUniverse('acme')
    .withUniverses('blue-team')
    .withConnectablePages(aNotionPage({ id: 'page-1' }));
  const gss = harness.build();
  await gss.setupSource(aSetupRequest({ universe: 'blue-team' }));

  harness.withNotionPages(aNotionPage({ id: 'page-2' }));
  const report = await gss.sync('team-a');

  assert.deepEqual(report, { name: 'team-a', status: 'ok', written: 1, deleted: 0, unchanged: 1 });
  assert.ok(harness.vaultFiles().has('blue-team/mirrors/team-a/page-2.md'), 'still the frozen universe');
});
