import { test } from "node:test";
import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { frontmatterVerdict, engineParser, duplicateKeyDetail, guardDecision } from "./vault-write-guard.mjs";
import { duplicateFrontmatterKeys } from "./note-refresh.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// F16, and the reason this guard is worth having at all: it must run the ENGINE'S OWN
// parsing path (gray-matter routed through js-yaml 4's `load`, as frontmatter-parser.ts
// does), not a lookalike. A checker that parses differently measures a fiction — either
// it blocks notes the indexer would have accepted, or it waves through the very bytes
// the indexer refuses. So the real parser, on the real field payload.
const parse = engineParser({ brainDir: REPO_ROOT });

// The field note (F11): an unquoted YAML value containing ": ". The indexer refused it,
// the note stayed invisible to search for as long as it existed, and nothing said so.
test("frontmatterVerdict — the bytes the indexer refuses are refused HERE, with its own cause", () => {
  const raw = ["---", "type: briefing", "summary: Réunion: bilan du trimestre", "---", "", "# Briefing", ""].join("\n");

  const verdict = frontmatterVerdict({ raw, parse });

  assert.equal(verdict.ok, false);
  assert.match(verdict.reason, /bad indentation of a mapping entry \(3:\d+\)/);
});

// The false-positive side, which is what decides whether a guard is kept or resented.
// A quoted value, an accented one, a list, and a note with NO frontmatter at all — all
// of them index fine today, so all of them must pass untouched.
test("frontmatterVerdict — everything the indexer accepts passes, including a note with no frontmatter", () => {
  const accepted = [
    ["---", "type: briefing", 'summary: "Réunion: bilan du trimestre"', "tags:", "  - inqom", "---", "", "# Briefing", ""].join("\n"),
    "# Just a note\n\nNo frontmatter at all, and the indexer is fine with that.\n",
    "",
  ];

  for (const raw of accepted) {
    assert.deepEqual(frontmatterVerdict({ raw, parse }), { ok: true }, `refused a note the indexer accepts:\n${raw}`);
  }
});

// The F12 damage, caught at its source: a second `updated:` appended instead of the
// first being replaced. js-yaml says "duplicated mapping key (6:1)", which names neither
// the key nor the way out — the engine already upgrades that message when it READS such
// a note (frontmatter-parser.ts), and the message is worth even more here, where the
// note can still be fixed before it exists. Naming the key is the whole point.
test("frontmatterVerdict — a duplicated key is named, not left as a line/column", () => {
  const raw = ["---", "type: person", "updated: 2026-07-01", "tags: []", "updated: 2026-08-02", "---", "", "# Someone", ""].join("\n");

  const verdict = frontmatterVerdict({ raw, parse });

  // Asserted as a whole sentence on purpose: js-yaml's raw message already echoes the
  // offending lines, so a loose /updated/ + /3/ + /5/ passes on the noise alone and
  // proves nothing about the upgrade.
  assert.deepEqual(frontmatterVerdict({ raw, parse }), {
    ok: false,
    reason:
      'damaged front-matter key "updated": declared twice, on lines 3 and 5. A note can only ' +
      "carry one — the engine's parser refuses the file, so the note would never be indexed.",
  });
});

// The scan that names the key exists TWICE already (the engine's `findDuplicateKey` and
// the brain-side `duplicateFrontmatterKeys`), kept in step by a comment. This is a third
// caller, so the tie becomes a test: it must see a duplicate exactly when the sibling does.
test("duplicateKeyDetail agrees with the sibling scan — no third opinion on what a key is", () => {
  const notes = [
    ["---", "updated: a", "updated: b", "---", ""].join("\n"), //            plain duplicate
    ["---", "tags:", "  - https://a.com", "  - https://b.com", "---", ""].join("\n"), // NOT keys
    ["---", "type: person", "  updated: nested", "updated: real", "---", ""].join("\n"), // indentation matters
    "# no frontmatter\n",
  ];

  for (const raw of notes) {
    const detail = duplicateKeyDetail(raw);
    assert.equal(
      detail === null,
      duplicateFrontmatterKeys(raw).length === 0,
      `the two scans disagree on:\n${raw}`,
    );
    if (detail) assert.equal(detail.key, duplicateFrontmatterKeys(raw)[0]);
  }
});

const BRAIN = "/brain";
const BROKEN = ["---", "type: briefing", "summary: Réunion: bilan", "---", "", "# Briefing", ""].join("\n");

// The decision the hook publishes. `readFile` is injected so the whole thing stays a
// pure function of (tool call, disk, parser) — no brain on disk, no hook harness.
const decide = (toolName, toolInput, files = {}) =>
  guardDecision({
    toolName,
    toolInput,
    brainDir: BRAIN,
    parse,
    readFile: (abs) => {
      if (!(abs in files)) throw new Error(`ENOENT: ${abs}`);
      return files[abs];
    },
  });

test("guardDecision — a Write that would create an unindexable vault note is refused, and says why", () => {
  const decision = decide("Write", { file_path: `${BRAIN}/vault/inqom/briefings/2026-08-02.md`, content: BROKEN });

  assert.equal(decision.allow, false);
  assert.match(decision.reason, /vault\/inqom\/briefings\/2026-08-02\.md/, "name the note, not just the fault");
  assert.match(decision.reason, /bad indentation of a mapping entry/);
  // The point of refusing rather than warning: state the consequence, so the fix is
  // obviously worth it rather than an obstacle to argue with.
  assert.match(decision.reason, /never be indexed|invisible/i);
});

// Everything that is NOT an indexed note is the owner's to write freely. A guard that
// creeps beyond the vault is a guard that gets disabled.
test("guardDecision — outside the vault, or not a note, it has no opinion", () => {
  const calls = [
    ["Write", { file_path: `${BRAIN}/maintainers/plans/draft.md`, content: BROKEN }], // .md, outside vault/
    ["Write", { file_path: `${BRAIN}/vault/.obsidian/workspace.json`, content: BROKEN }], // in vault, not a note
    ["Read", { file_path: `${BRAIN}/vault/notes/a.md`, content: BROKEN }], //                another tool
    ["Write", { file_path: `${BRAIN}/vault/notes/a.md` }], //                               no content to judge
  ];

  for (const [toolName, toolInput] of calls) {
    assert.deepEqual(decide(toolName, toolInput), { allow: true }, `blocked: ${toolName} ${toolInput.file_path}`);
  }
});

// An Edit hands over a fragment, not a file, so the resulting note has to be composed
// before it can be judged — otherwise the one gesture that produced the field's damaged
// note (appending a second `updated:`) walks straight past the guard.
test("guardDecision — an Edit is judged on the note it WOULD produce", () => {
  const before = ["---", "type: person", "updated: 2026-07-01", "---", "", "# Someone", ""].join("\n");
  const path = `${BRAIN}/vault/inqom/people/someone.md`;

  const decision = decide(
    "Edit",
    { file_path: path, old_string: "updated: 2026-07-01", new_string: "updated: 2026-07-01\nupdated: 2026-08-02" },
    { [path]: before },
  );

  assert.equal(decision.allow, false);
  assert.match(decision.reason, /declared twice, on lines 3 and 4/);
});

// The fail-open side, which is what makes a guard on EVERY write acceptable: anything it
// cannot judge must pass. An edit whose anchor is gone, a file it cannot read, a brain
// with no engine dependencies installed — none of those is a broken note (unknown ≠ broken).
test("guardDecision — what it cannot judge, it lets through", () => {
  const path = `${BRAIN}/vault/notes/a.md`;

  assert.deepEqual(
    decide("Edit", { file_path: path, old_string: "absent", new_string: BROKEN }, { [path]: "# fine\n" }),
    { allow: true },
    "an anchor that does not match: the edit will fail on its own, we judge nothing",
  );
  assert.deepEqual(
    decide("Edit", { file_path: path, old_string: "x", new_string: "y" }),
    { allow: true },
    "an unreadable file",
  );
  assert.deepEqual(
    guardDecision({
      toolName: "Write",
      toolInput: { file_path: path, content: BROKEN },
      brainDir: BRAIN,
      parse: null,
      readFile: () => "",
    }),
    { allow: true },
    "no engine parser (a clone nobody rehydrated yet)",
  );
});
