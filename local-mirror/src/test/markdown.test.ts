import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  toLocalMirrorMarkdown,
  parseLocalMirrorMarkdown,
  reuniverseLocalMirrorMarkdown,
} from '../lib/markdown.js';

// The note renderer, at the unit. The acceptance tests cover the two shapes that travel
// (a universe-scoped mirror stamps `universe:`, a rootless one does not), but they can only
// ever hand this function `undefined` — and js-yaml drops an undefined value, so an absent
// universe and a stamped-undefined one render identically. The case that IS observable is a
// BLANK universe: the codebase treats a blank name as "no universe" deliberately and in more
// than one place (`parseUniverseRegistry` filters blanks out, `vaultDirFor` guards on the same
// falsiness), so pin that intent here rather than leave it resting on a guard nothing asserts.

const anItem = {
  id: 'page-1',
  title: 'Team A — invoices',
  url: 'https://www.notion.so/acme/Page-0123abc',
  lastEditedTime: '2026-07-28T10:00:00.000Z',
};

test('a blank universe is not a universe: no key is stamped', () => {
  const raw = toLocalMirrorMarkdown('team-a', anItem, 'body', '');

  const { data } = parseLocalMirrorMarkdown(raw);
  assert.equal('universe' in data, false);
  assert.deepEqual(data, {
    mirror: 'team-a',
    source_id: 'page-1',
    title: 'Team A — invoices',
    source_url: 'https://www.notion.so/acme/Page-0123abc',
    last_edited_time: '2026-07-28T10:00:00.000Z',
  });
});

test('a named universe travels with the note', () => {
  const raw = toLocalMirrorMarkdown('team-a', anItem, 'body', 'acme');

  const { data, content } = parseLocalMirrorMarkdown(raw);
  assert.equal(data.universe, 'acme');
  assert.equal(content.trim(), 'body');
});

// A Notion page whose FIRST block is a divider renders a body starting with `---`. Handed to
// gray-matter as a string, that body is re-parsed as if it were a whole file: its characters
// come back scattered into the frontmatter (`'0': r`, `'1': e`…) and the note is written empty.
// The body is a payload here, never a document to parse.
test('a body that opens with a divider survives the write', () => {
  const raw = toLocalMirrorMarkdown('team-a', anItem, '---\n\nreal content\n', 'acme');

  const { data, content } = parseLocalMirrorMarkdown(raw);
  assert.deepEqual(data, {
    mirror: 'team-a',
    source_id: 'page-1',
    title: 'Team A — invoices',
    source_url: 'https://www.notion.so/acme/Page-0123abc',
    last_edited_time: '2026-07-28T10:00:00.000Z',
    universe: 'acme',
  });
  assert.equal(content.trim(), '---\n\nreal content');
});

// Hand-written on purpose (never produced by the code under test): a note on disk can carry keys
// this module never wrote — a `tags:` the owner added in Obsidian, a key a later engine version
// stamps. A move RE-FILES a note; it does not get to edit it, so those keys must come out the
// other side, in place, with `universe` still stamped last.
const aNoteCarrying = (extraLine: string) =>
  [
    '---',
    'mirror: team-a',
    'source_id: page-1',
    'title: Team A — invoices',
    'source_url: https://www.notion.so/acme/Page-0123abc',
    "last_edited_time: '2026-07-28T10:00:00.000Z'",
    extraLine,
    '---',
    'body',
    '',
  ].join('\n');

test('a move preserves a frontmatter key the engine does not know', () => {
  const moved = reuniverseLocalMirrorMarkdown(aNoteCarrying('tags: [invoices]'), 'acme');

  const { data, content } = parseLocalMirrorMarkdown(moved);
  assert.deepEqual(data, {
    mirror: 'team-a',
    source_id: 'page-1',
    title: 'Team A — invoices',
    source_url: 'https://www.notion.so/acme/Page-0123abc',
    last_edited_time: '2026-07-28T10:00:00.000Z',
    tags: ['invoices'],
    universe: 'acme',
  });
  assert.deepEqual(Object.keys(data), [
    'mirror',
    'source_id',
    'title',
    'source_url',
    'last_edited_time',
    'tags',
    'universe',
  ]);
  assert.equal(content.trim(), 'body');
});

// A note that lost its citation frontmatter cannot be rebuilt into a valid one: the move used to
// write `source_url: undefined` (a dead citation) and, since the rebuild now keeps what it finds,
// would write a note with no URL at all. Either way the page lands indexed and uncitable. Refusing
// throws inside phase 1 of the move, which already rolls the new copies back and leaves the old
// corpus untouched.
test('a note whose citation frontmatter is missing is refused, not rebuilt broken', () => {
  const noUrl = aNoteCarrying('tags: [invoices]').replace(
    'source_url: https://www.notion.so/acme/Page-0123abc\n',
    '',
  );

  assert.throws(() => reuniverseLocalMirrorMarkdown(noUrl, 'acme'), /source_url/);
});

// Two keys, gone at once, and neither is the one the first example pinned: the refusal must name
// what is actually missing (that is what tells the owner which note to repair), not a key it
// happens to check first.
test('the refusal names every missing key, not just the first it looks for', () => {
  const gutted = aNoteCarrying('tags: [invoices]')
    .replace('mirror: team-a\n', '')
    .replace("last_edited_time: '2026-07-28T10:00:00.000Z'\n", '');

  assert.throws(
    () => reuniverseLocalMirrorMarkdown(gutted, 'acme'),
    /mirror, last_edited_time/,
  );
});
