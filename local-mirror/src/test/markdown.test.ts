import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toLocalMirrorMarkdown, parseLocalMirrorMarkdown } from '../lib/markdown.js';

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
