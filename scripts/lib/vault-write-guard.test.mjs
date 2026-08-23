import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  duplicateKeyDetail,
  editedNote,
  engineParser,
  engineRequireAnchor,
  frontmatterVerdict,
  guardDecision,
} from "./vault-write-guard.mjs";
import { duplicateFrontmatterKeys } from "./note-refresh.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// F16, and the reason this guard is worth having at all: it must run the ENGINE'S OWN
// parsing path (gray-matter routed through js-yaml 4's `load`, as frontmatter-parser.ts
// does), not a lookalike. A checker that parses differently measures a fiction — either
// it blocks notes the indexer would have accepted, or it waves through the very bytes
// the indexer refuses. So the real parser, on the real field payload.
const parse = engineParser({ brainDir: REPO_ROOT });

// …which lives in `rag/node_modules`, and CI's harness step runs BEFORE `npm ci` — on
// purpose: its stated invariant is "pure .mjs seams, no deps to install". These four
// assertions broke that invariant silently, so they had NEVER run in CI, on any OS,
// since the guard shipped; they passed on a developer machine only because
// `rag/node_modules` happens to exist there.
//
// Faking the parser is the one thing forbidden here (F16), so they DEFER instead: they
// skip when it cannot be resolved, and CI runs this same file again after the engine's
// `npm ci`. That second run is pinned by the last test in this file — without it a skip
// is just a silence that reads green, which is this release's whole subject.
const NEEDS_ENGINE_PARSER =
  parse === null ? { skip: "engine parser absent — CI re-runs this file after `npm ci` in rag/" } : {};

// The field note (F11): an unquoted YAML value containing ": ". The indexer refused it,
// the note stayed invisible to search for as long as it existed, and nothing said so.
test("frontmatterVerdict — the bytes the indexer refuses are refused HERE, with its own cause", NEEDS_ENGINE_PARSER, () => {
  const raw = ["---", "type: briefing", "summary: Réunion: bilan du trimestre", "---", "", "# Briefing", ""].join("\n");

  const verdict = frontmatterVerdict({ raw, parse });

  assert.equal(verdict.ok, false);
  assert.match(verdict.reason, /bad indentation of a mapping entry \(3:\d+\)/);
});

// The false-positive side, which is what decides whether a guard is kept or resented.
// A quoted value, an accented one, a list, and a note with NO frontmatter at all — all
// of them index fine today, so all of them must pass untouched.
test("frontmatterVerdict — everything the indexer accepts passes, including a note with no frontmatter", NEEDS_ENGINE_PARSER, () => {
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

test("guardDecision — a Write that would create an unindexable vault note is refused, and says why", NEEDS_ENGINE_PARSER, () => {
  const decision = decide("Write", { file_path: `${BRAIN}/vault/inqom/briefings/2026-08-02.md`, content: BROKEN });

  assert.equal(decision.allow, false);
  // Everything WE author is asserted verbatim, around the parser's own message: the note's
  // name, the consequence (the point of refusing rather than warning — the fix has to look
  // obviously worth it), and the way out. A regex on the middle leaves the ends free to go.
  assert.ok(
    decision.reason.startsWith(
      "vault/inqom/briefings/2026-08-02.md — the engine's own YAML parser refuses this note's frontmatter: ",
    ),
    decision.reason,
  );
  assert.match(decision.reason, /bad indentation of a mapping entry/);
  assert.ok(
    decision.reason.endsWith(
      "Written as is, the note would be committed like any other and never be indexed: " +
        "invisible to every search, with nothing to recover it. " +
        'Fix the frontmatter (quote any value containing ": ") and write again.',
    ),
    decision.reason,
  );
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
test("guardDecision — an Edit is judged on the note it WOULD produce", NEEDS_ENGINE_PARSER, () => {
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

// ── The net under the skip above ─────────────────────────────────────────────
// Four assertions that skip when the engine's parser is absent are worth exactly what
// CI does about it. Nothing did, for 67 commits: they were green on a developer machine
// and had never run in CI at all. So the second run is pinned here — a skip is a
// deferral only as long as something actually cashes it in.
test("CI cashes the deferral in: this file is re-run after the engine's own deps are installed", () => {
  const ci = readFileSync(join(REPO_ROOT, ".github", "workflows", "ci.yml"), "utf8");

  const engineInstall = ci.indexOf("run: npm ci");
  // Matched on the PATH plus "node --test", never on the whole command line: this guard's
  // claim is "this file is re-run after `npm ci`", and the flags are none of its business.
  // Pinning them made it go red on 2026-08-23 for a `--test-timeout` added to every suite
  // — a true statement about the file's position, refuted by an irrelevant edit.
  const rerunLine = ci.split("\n").find((l) => l.includes('"scripts/lib/vault-write-guard.test.mjs"'));
  const rerun = rerunLine ? ci.indexOf(rerunLine) : -1;

  assert.notEqual(rerun, -1, "ci.yml must re-run this file with the engine's parser resolvable");
  assert.match(rerunLine ?? "", /run: node --test\b/, "and it must be re-run BY the test runner, not merely named");
  assert.notEqual(engineInstall, -1, "ci.yml must still install the engine");
  assert.ok(
    engineInstall < rerun,
    "the re-run must come AFTER `npm ci`, or the parser is just as absent as in the harness step",
  );
});

// ── The seams the mutation pass found unwatched ───────────────────────────────

// F16, one level down: WHERE the parser is resolved from is the whole claim. Anchored on
// the engine's own `package.json`, resolution starts in `rag/` and finds `rag/node_modules`
// — the engine's gray-matter. Anchored one folder up, Node walks the parent chain and can
// bind a DIFFERENT gray-matter (or none), which is precisely the lookalike this guard
// exists to avoid. Nothing observable from outside distinguishes the two, so the anchor is
// asserted directly.
test("engineParser is anchored on the ENGINE's package.json, not on the brain folder", () => {
  assert.equal(engineRequireAnchor("/brains/mind-palace"), join("/brains/mind-palace", "rag", "package.json"));
});

test("engineParser returns null — not undefined — when the engine's deps cannot be resolved", () => {
  // `null` is the documented "we cannot judge" value the caller compares against; a
  // `catch {}` that falls out returning undefined reads the same in a truthiness test
  // and differently everywhere it matters.
  assert.equal(engineParser({ brainDir: join(REPO_ROOT, "no-such-brain") }), null);
});

// Three separate reasons an Edit cannot be composed, each fed ALONE — through
// guardDecision they all end in the same `{ allow: true }`, so nothing there can tell
// which one fired, or notice when one stops firing.
test("editedNote — a fragment with no anchor, or no replacement, composes nothing", () => {
  const read = () => ["---", "type: person", "---", "", "# Someone", ""].join("\n");

  assert.equal(editedNote({ toolInput: { file_path: "a.md", new_string: "x" }, readFile: read }), null, "no old_string");
  assert.equal(editedNote({ toolInput: { file_path: "a.md", old_string: "type" }, readFile: read }), null, "no new_string");
  assert.equal(editedNote({ toolInput: {}, readFile: read }), null, "neither");
  assert.equal(editedNote({ readFile: read }), null, "no tool input at all");
});

test("editedNote — an anchor the file does not contain composes nothing, rather than the file unchanged", () => {
  // The distinction that matters: returning the file UNCHANGED would hand a note the
  // owner never touched to the parser, so a pre-existing defect would be blamed on this
  // edit — and an edit that is about to fail on its own would be refused first.
  const current = ["---", "type: person", "---", ""].join("\n");

  assert.equal(
    editedNote({ toolInput: { file_path: "a.md", old_string: "absent", new_string: "x" }, readFile: () => current }),
    null,
  );
});

test("editedNote — an unreadable file composes nothing", () => {
  const boom = () => {
    throw new Error("ENOENT");
  };

  assert.equal(editedNote({ toolInput: { file_path: "a.md", old_string: "a", new_string: "b" }, readFile: boom }), null);
});

test("editedNote — composes the whole file, once or everywhere as asked", () => {
  const current = "x\nx\n";
  const input = (replace_all) => ({ file_path: "a.md", old_string: "x", new_string: "y", replace_all });

  assert.equal(editedNote({ toolInput: input(false), readFile: () => current }), "y\nx\n");
  assert.equal(editedNote({ toolInput: input(true), readFile: () => current }), "y\ny\n");
});

// The frontmatter fence, on both ends. This scan reads the header of a file it is about
// to refuse, so where it thinks the header STOPS decides whether an ordinary body — a
// changelog listing `updated:` twice, say — gets reported as damage.
test("duplicateKeyDetail — a body is not frontmatter: repeats below the closing fence are none of its business", () => {
  const raw = ["---", "type: note", "---", "", "updated: a", "updated: b", ""].join("\n");

  assert.equal(duplicateKeyDetail(raw), null);
});

test("duplicateKeyDetail — a file that opens with anything else has no frontmatter to scan", () => {
  const raw = ["# A plain note", "updated: a", "updated: b", ""].join("\n");

  assert.equal(duplicateKeyDetail(raw), null);
});

test("duplicateKeyDetail — a fence with trailing whitespace is still a fence, top and bottom", () => {
  // What an editor leaves behind. Both fences are compared trimmed; drop either trim and
  // this note reads as "no frontmatter" (top) or as one that never ends (bottom).
  const open = ["--- ", "type: note", "updated: a", "updated: b", "---", ""].join("\n");
  const close = ["---", "type: note", "--- ", "", "updated: a", "updated: b", ""].join("\n");

  assert.deepEqual(duplicateKeyDetail(open), { key: "updated", first: 3, second: 4 });
  assert.equal(duplicateKeyDetail(close), null);
});

test("duplicateKeyDetail — a blank line inside the frontmatter does not end it", () => {
  // js-yaml accepts one, so the scan must too: stopping there would leave the duplicate
  // below it unnamed, on a note the parser has already refused.
  const raw = ["---", "type: note", "", "updated: a", "updated: b", "---", ""].join("\n");

  assert.deepEqual(duplicateKeyDetail(raw), { key: "updated", first: 4, second: 5 });
});

test("duplicateKeyDetail — frontmatter nobody closed is scanned to the end, and stops there", () => {
  // The unterminated case: the loop must stop at the last line rather than walk past it.
  const raw = ["---", "type: note", "summary: no closing fence"].join("\n");

  assert.equal(duplicateKeyDetail(raw), null);
});

// The two gates on "is this call ours at all", each defeated on its own. A tool that is
// neither Write nor Edit can still carry an anchor and a replacement (Claude has more
// than two file tools), and a call can arrive with no path at all.
test("guardedNotePath — another tool's write is not ours, even shaped exactly like an Edit", () => {
  const path = `${BRAIN}/vault/notes/a.md`;

  assert.deepEqual(
    decide("NotebookEdit", { file_path: path, old_string: "x", new_string: BROKEN }, { [path]: "x\n" }),
    { allow: true },
  );
});

test("guardDecision — a call with no path, or no tool input at all, is let through rather than crashing", () => {
  // This runs in front of EVERY write the brain makes: a guard that throws its own stack
  // at the owner once is a guard they disable.
  assert.deepEqual(decide("Write", { content: BROKEN }), { allow: true }, "no file_path");
  assert.deepEqual(
    guardDecision({ toolName: "Write", brainDir: BRAIN, parse, readFile: () => "" }),
    { allow: true },
    "no toolInput at all",
  );
});
