// ─────────────────────────────────────────────────────────────────────────────
// remote-arrivals.test.mjs — the trace the live sync leaves behind, and the
// sentence the brain says about it at the next message (plan #84, step 4).
//
// Two claims run through every test here:
//   • the directive addresses CLAUDE, never the human. It says what to do with
//     what arrived; the sentence the owner reads is Claude's own, in their own
//     language. A hook that wrote the human's sentence would speak English into
//     a French conversation, and say it identically every single time.
//   • nothing to say → nothing emitted. A brain that announced "nothing new"
//     every 90 seconds would teach its owner to stop reading it.
// ─────────────────────────────────────────────────────────────────────────────
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  DIRECTIVE_MAX,
  arrivalsDirective,
  blockedDirective,
  buildTrace,
  markAnnounced,
  remoteArrivalsDirective,
} from "./remote-arrivals.mjs";

const trace = (over = {}) => ({ arrivedAt: "2026-09-08T09:00:00.000Z", files: [], authors: [], blocked: null, announcedAt: null, ...over });

// ── What arrived ─────────────────────────────────────────────────────────────

test("one note from one person: named, with its author, and an instruction addressed to Claude", () => {
  const directive = arrivalsDirective(trace({ files: ["vault/people/notaire.md"], authors: ["Claire"] }));

  assert.match(directive, /1 note from Claire/);
  assert.match(directive, /people\/notaire\.md/, "the note is named by its path inside the vault");
  assert.doesNotMatch(directive, /vault\//, "…without the `vault/` prefix, which means nothing to the owner");
  assert.match(directive, /one sentence/i, "Claude is told to say it, not handed a sentence to repeat");
  assert.match(directive, /re-read/i, "and to re-read before editing: the file on disk moved under it");
});

test("several notes and several people agree in number, and the authors are named in order", () => {
  const directive = arrivalsDirective(trace({ files: ["vault/a.md", "vault/b.md"], authors: ["Claire", "Paul"] }));

  assert.match(directive, /2 notes from Claire and Paul/);
});

test("three or more people are joined properly, not by a trailing comma", () => {
  const directive = arrivalsDirective(trace({ files: ["vault/a.md"], authors: ["Claire", "Paul", "Ana"] }));

  assert.match(directive, /from Claire, Paul and Ana/);
});

// A directive that reads out fifteen names has stopped being a directive. Past three the
// names become a count — the same treatment the file list gets, and for the same reason.
test("a crowd of authors becomes a count, and the count is right", () => {
  const directive = arrivalsDirective(trace({ files: ["vault/a.md"], authors: ["Claire", "Paul", "Ana", "Bo", "Lou"] }));

  assert.match(directive, /from Claire, Paul and 3 others/);
});

test("exactly one author past the cap is 'and 1 other', in the singular", () => {
  const directive = arrivalsDirective(trace({ files: ["vault/a.md"], authors: ["Claire", "Paul", "Ana", "Bo"] }));

  assert.match(directive, /from Claire, Paul and 2 others/);
  assert.match(
    arrivalsDirective(trace({ files: ["vault/a.md"], authors: ["Claire", "Paul", "Ana"] })),
    /from Claire, Paul and Ana/,
    "three still fit: the cap counts people, it does not hide them",
  );
});

// The directive rides in front of every prompt, so its length is a budget, not a detail.
// What gets cut is the LIST — never the instruction, which is the whole point of the message.
test("a long list of notes is capped, and says how many it did not name", () => {
  const files = ["a", "b", "c", "d", "e", "f"].map((n) => `vault/daily/${n}.md`);

  const directive = arrivalsDirective(trace({ files, authors: ["Claire"] }));

  assert.match(directive, /6 notes from Claire/, "the COUNT stays true even when the list is cut");
  assert.match(directive, /daily\/a\.md, daily\/b\.md, daily\/c\.md \(\+3 more\)/);
  assert.match(directive, /re-read/i, "the instruction survives the cut");
  assert.ok(directive.length <= DIRECTIVE_MAX, `${directive.length} > ${DIRECTIVE_MAX}`);
});

test("even absurdly long paths stay inside the budget", () => {
  const files = Array.from({ length: 40 }, (_, i) => `vault/daily/${"x".repeat(60)}-${i}.md`);

  const directive = arrivalsDirective(trace({ files, authors: ["Claire", "Paul", "Ana", "Bo"] }));

  assert.ok(directive.length <= DIRECTIVE_MAX, `${directive.length} > ${DIRECTIVE_MAX}`);
  assert.match(directive, /40 notes/);
});

// A pull can carry engine files too — a `/update-engine` run on the other machine, say. Calling
// those "notes" would be a lie told confidently, which is the one thing an announcement may not do.
test("files that are not vault notes are counted apart, never announced as notes", () => {
  const directive = arrivalsDirective(
    trace({ files: ["vault/daily/monday.md", "scripts/lib/x.mjs", "CLAUDE.md"], authors: ["Paul"] }),
  );

  assert.match(directive, /1 note from Paul/);
  assert.match(directive, /2 other files/);
});

test("an arrival of engine files ALONE is still announced, and calls them what they are", () => {
  const directive = arrivalsDirective(trace({ files: ["scripts/lib/x.mjs"], authors: ["Paul"] }));

  assert.match(directive, /1 other file/);
  assert.doesNotMatch(directive, /\bnotes?\b/, "nothing arrived that is a note");
});

test("nothing arrived, or it was already announced → nothing at all", () => {
  assert.equal(arrivalsDirective(trace({ files: [], authors: [] })), null);
  assert.equal(arrivalsDirective(null), null);
  assert.equal(
    remoteArrivalsDirective(trace({ files: ["vault/a.md"], authors: ["Claire"], announcedAt: "2026-09-08T09:01:00.000Z" })),
    null,
    "announced once is announced: the next prompt must carry nothing",
  );
});

// ── What could not be merged ─────────────────────────────────────────────────

test("a blocked merge asks Claude to speak FIRST, and to keep both sides by default", () => {
  const directive = blockedDirective(trace({ blocked: { files: ["CLAUDE.md"], reason: "conflict" } }));

  assert.match(directive, /CLAUDE\.md/);
  assert.match(directive, /before answering/i, "the merge comes before the answer");
  assert.match(directive, /sync/, "the assisted resolution already exists as a skill: use it, do not improvise");
  assert.match(directive, /keep both/i);
  assert.match(directive, /only if/i, "a question is the last resort, not the opening move");
  assert.ok(directive.length <= DIRECTIVE_MAX);
});

test("a damaged header names the note AND the cause the engine gave, so the repair is possible", () => {
  const directive = blockedDirective(
    trace({ blocked: { files: ["vault/daily/monday.md"], reason: 'damaged front-matter key "title": declared twice' } }),
  );

  assert.match(directive, /daily\/monday\.md/);
  assert.match(directive, /declared twice/, "the engine's own words: they say what to fix");
  assert.ok(directive.length <= DIRECTIVE_MAX);
});

test("a blocked list is capped like the other one, instruction intact", () => {
  const files = Array.from({ length: 12 }, (_, i) => `vault/daily/${"y".repeat(40)}-${i}.md`);

  const directive = blockedDirective(trace({ blocked: { files, reason: "conflict" } }));

  assert.ok(directive.length <= DIRECTIVE_MAX, `${directive.length} > ${DIRECTIVE_MAX}`);
  assert.match(directive, /keep both/i);
});

test("no block → nothing", () => {
  assert.equal(blockedDirective(trace()), null);
  assert.equal(blockedDirective(null), null);
});

// ── The two together ─────────────────────────────────────────────────────────

test("notes arrived AND something is stuck: both are said, arrivals first", () => {
  const directive = remoteArrivalsDirective(
    trace({ files: ["vault/a.md"], authors: ["Claire"], blocked: { files: ["CLAUDE.md"], reason: "conflict" } }),
  );

  assert.ok(directive.indexOf("1 note from Claire") < directive.indexOf("CLAUDE.md"), "what worked, then what needs a hand");
  assert.match(directive, /keep both/i);
});

test("markAnnounced stamps the trace and changes nothing else", () => {
  const before = trace({ files: ["vault/a.md"], authors: ["Claire"] });

  const after = markAnnounced(before, new Date("2026-09-08T09:02:00.000Z"));

  assert.deepEqual(after, { ...before, announcedAt: "2026-09-08T09:02:00.000Z" });
  assert.equal(before.announcedAt, null, "the input is not mutated: the caller decides what to write");
});

// ── The trace on disk ────────────────────────────────────────────────────────

function tempBrain(t) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "remote-arrivals-")));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

test("an absent trace reads as nothing, and a damaged one too: neither may stop the sync", (t) => {
  const root = tempBrain(t);

  assert.equal(buildTrace(root).read(), null);

  writeFileSync(join(root, "remote-arrivals.json"), "{ not json");
  assert.equal(buildTrace(root).read(), null);
});

test("what is written is what is read back, and the atomic rename leaves nothing behind", (t) => {
  const root = tempBrain(t);
  const written = trace({ files: ["vault/a.md"], authors: ["Claire"] });

  buildTrace(root).write(written);

  assert.deepEqual(buildTrace(root).read(), written);
  assert.deepEqual(JSON.parse(readFileSync(join(root, "remote-arrivals.json"), "utf8")), written);
  assert.deepEqual(readdirSync(join(root, ".cache")), [], "the staging copy is gone, and never sat at the brain root");
});
