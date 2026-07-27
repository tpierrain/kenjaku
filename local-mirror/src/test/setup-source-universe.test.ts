import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aLocalMirror, aNotionPage } from './builder.js';

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
  // The message must carry WHY choosing now matters, and where it would land.
  assert.match(result.message, /acme\/mirrors\/team-a\//);
  assert.match(result.message, /re-embed/i);
  assert.match(result.message, /setup_source again/);
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
  assert.match(result.message, /"acme-corp"/);
  assert.match(result.message, /default, acme, blue-team/);
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
