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
  joinNames,
  markAnnounced,
  remoteArrivalsDirective,
  universeArrivalDirective,
} from "./remote-arrivals.mjs";
import { ACTIVE_UNIVERSE_REL } from "./universes.mjs";

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

// Every test above matches a FRAGMENT, and a sentence is only as good as its worst half:
// the parts nobody asserts on are exactly where a wrong word survives. So twice — once with
// notes, once without — the whole thing is checked as what it is, a sentence a human reads.
test("the announcement, word for word, when notes arrived", () => {
  assert.equal(
    arrivalsDirective(trace({ files: ["vault/people/claire.md", "vault/daily/monday.md"], authors: ["Paul"] })),
    "📥 The brain synchronised on its own: 2 notes from Paul arrived since the last message: " +
      "people/claire.md, daily/monday.md. Say it in one sentence, in the owner's language, then answer them." +
      " Re-read any of those notes before editing it.",
  );
});

test("the announcement, word for word, when only engine files arrived — and then no re-read sentence", () => {
  assert.equal(
    arrivalsDirective(trace({ files: ["scripts/lib/x.mjs"], authors: ["Paul"] })),
    "📥 The brain synchronised on its own: 1 other file from Paul arrived since the last message: " +
      "scripts/lib/x.mjs. Say it in one sentence, in the owner's language, then answer them.",
  );
});

// `git log --format=%an` can come back empty — a commit with no author to speak of, or a
// trace written by an older engine that had no `authors` field at all. Neither may produce
// " from " with a hole in it, and neither may throw.
test("an arrival nobody can be credited for still says what landed", () => {
  const expected =
    "📥 The brain synchronised on its own: 1 note arrived since the last message: a.md. " +
    "Say it in one sentence, in the owner's language, then answer them. Re-read any of those notes before editing it.";

  assert.equal(arrivalsDirective(trace({ files: ["vault/a.md"], authors: [] })), expected);
  assert.equal(arrivalsDirective({ files: ["vault/a.md"] }), expected, "a trace with no `authors` key at all reads the same");
});

test("joining nobody is the empty string, never `undefined` spliced into a sentence", () => {
  assert.equal(joinNames([]), "");
  assert.equal(joinNames(["Claire"]), "Claire");
});

// A vault holds more than Markdown — an image pasted into a note, a PDF dropped beside it.
// "1 note" would be a lie about something the owner cannot re-read.
test("an attachment under vault/ is a file, not a note: only Markdown is a note", () => {
  const directive = arrivalsDirective(trace({ files: ["vault/attachments/photo.png"], authors: ["Paul"] }));

  assert.match(directive, /1 other file from Paul/);
  assert.doesNotMatch(directive, /\bnotes?\b/);
});

// The last rung of the budget. Paths so long that not even ONE of them fits, so the list
// gives up its final name and becomes a bare count — which is still true, still short, and
// still leaves the instruction whole. Below this rung there is nothing left to give.
test("when not even one path fits, the list becomes a count and the instruction survives", () => {
  const files = Array.from({ length: 12 }, (_, i) => `vault/${"y".repeat(300)}-${i}.md`);

  const directive = arrivalsDirective(trace({ files, authors: ["Claire"] }));

  assert.ok(directive.length <= DIRECTIVE_MAX, `${directive.length} > ${DIRECTIVE_MAX}`);
  assert.match(directive, /: 12 of them\./, "named none, counted all");
  assert.match(directive, /one sentence/i, "the instruction is the half that may never be cut");
  assert.match(directive, /re-read/i);
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

// `conflict` is what the sentence ALREADY says in plain words ("both copies changed the same
// file"), so repeating it in brackets is noise. Any other reason is the engine telling the
// repairer what is actually wrong, and that must reach the message intact.
test("the cause is shown when it adds something, and suppressed when it only repeats the sentence", () => {
  const causeIn = (blocked) => blockedDirective(trace({ blocked }))?.match(/^⚠️ The background sync could not merge (.*?) and undid/)?.[1];

  assert.equal(causeIn({ files: ["vault/a.md"], reason: "damaged-header" }), "a.md (damaged-header)");
  assert.equal(causeIn({ files: ["vault/a.md"], reason: "conflict" }), "a.md", "the plain words below already say this");
  assert.equal(causeIn({ files: ["vault/a.md"] }), "a.md", "no reason given, nothing to put in brackets");
  assert.equal(causeIn({ files: ["vault/a.md"], reason: "" }), "a.md", "an empty reason is not a reason");
});

test("no block → nothing", () => {
  assert.equal(blockedDirective(trace()), null);
  assert.equal(blockedDirective(null), null);
  assert.equal(blockedDirective(trace({ blocked: { files: [], reason: "conflict" } })), null, "a block with no file blocks nothing");
  assert.equal(blockedDirective(trace({ blocked: { reason: "conflict" } })), null, "…and neither does one with no file LIST");
});

// ── The universe that arrived (2026-09-05, the owner's call: "enlève l'attente") ──
// The session-start hook no longer waits for the pull before naming the active universe
// (ADR 0028: a session start never blocks on the network). So it can announce the sphere
// this machine went to sleep in, and THIS is the half that repairs it — the correction
// rides the owner's next message. Keyed on the pointer ARRIVING, never on a remembered
// value: a local `/switch` must never produce a phantom correction, and git only lists
// the pointer when its bytes really changed.

test("the pointer arriving is announced as the universe now in force, and names it", () => {
  const directive = universeArrivalDirective(trace({ files: [ACTIVE_UNIVERSE_REL] }), () => "blue-team");

  assert.match(directive, /'blue-team'/, "the universe is NAMED: 'the scope changed' tells the owner nothing");
  assert.match(directive, /one sentence/i, "Claude is told to say it, not handed a sentence to repeat");
  assert.match(directive, /correct/i, "a session that already announced the other one must take it back");
  assert.doesNotMatch(directive, /active-universe|vault-rag/, "the pointer's PATH means nothing to the owner");
  assert.ok(directive.length <= DIRECTIVE_MAX, `${directive.length} > ${DIRECTIVE_MAX}`);
});

test("the universe correction, word for word", () => {
  assert.equal(
    universeArrivalDirective(trace({ files: [ACTIVE_UNIVERSE_REL], authors: ["Claire"] }), () => "blue-team"),
    "🧭 The active universe changed on another machine: it is now 'blue-team'. Say so in one " +
      "sentence, in the owner's language, before anything else — and correct it explicitly if this " +
      "session already announced another one. Searches are scoped to it plus their cross-cutting notes.",
  );
});

test("no pointer among the arrivals → nothing, and the pointer is never even read", () => {
  let asked = 0;
  const reader = () => {
    asked++;
    return "blue-team";
  };

  assert.equal(universeArrivalDirective(trace({ files: ["vault/a.md", "scripts/lib/x.mjs"] }), reader), null);
  assert.equal(universeArrivalDirective(trace({ files: [] }), reader), null);
  assert.equal(universeArrivalDirective(null, reader), null);
  assert.equal(asked, 0, "no arrival, no read: the disk is touched only when there is something to say");
});

// The pointer is on a Windows machine too, and `git diff --name-only` is not the only
// thing that ever fills this list. A separator must not be the reason a correction is lost.
test("the pointer is recognised whichever way its path is spelled", () => {
  assert.match(
    universeArrivalDirective(trace({ files: [".vault-rag\\active-universe"] }), () => "blue-team"),
    /'blue-team'/,
  );
});

test("a universe that cannot be read says NOTHING, rather than something false", () => {
  const unreadable = () => {
    throw new Error("no .vault-rag here");
  };

  assert.equal(universeArrivalDirective(trace({ files: [ACTIVE_UNIVERSE_REL] }), unreadable), null);
  assert.equal(universeArrivalDirective(trace({ files: [ACTIVE_UNIVERSE_REL] }), () => null), null);
  assert.equal(universeArrivalDirective(trace({ files: [ACTIVE_UNIVERSE_REL] }), () => ""), null, "an empty pointer names nobody");
});

// Same budget as every other directive, and the same rule about what gives way: the NAME
// is cut, never the instruction. A universe is named by its owner, and nothing bounds that.
test("an absurdly long universe name is cut to fit, and the instruction survives whole", () => {
  const directive = universeArrivalDirective(trace({ files: [ACTIVE_UNIVERSE_REL] }), () => "z".repeat(400));

  assert.equal(directive.length, DIRECTIVE_MAX, "it fills the budget exactly, and not one character more");
  assert.match(directive, /zzz…'/, "the name is truncated, and says so");
  assert.match(directive, /cross-cutting notes\.$/, "the sentence still ends where it should");
});

// It arrives in the same `git diff` as everything else, so without this it would be
// announced as "1 other file" — which is precisely what tells the owner nothing.
test("the pointer is not one of the files that arrived: it has its own sentence", () => {
  const directive = arrivalsDirective(trace({ files: ["vault/a.md", ACTIVE_UNIVERSE_REL], authors: ["Claire"] }));

  assert.match(directive, /1 note from Claire/);
  assert.doesNotMatch(directive, /other file/, "the pointer is not a file the owner has any use for");
  assert.equal(
    arrivalsDirective(trace({ files: [ACTIVE_UNIVERSE_REL], authors: ["Claire"] })),
    null,
    "a pointer arriving ALONE is not an arrival of files, and must not be announced as one",
  );
});

// ── The two together ─────────────────────────────────────────────────────────

test("notes arrived AND something is stuck: both are said, arrivals first", () => {
  const directive = remoteArrivalsDirective(
    trace({ files: ["vault/a.md"], authors: ["Claire"], blocked: { files: ["CLAUDE.md"], reason: "conflict" } }),
  );

  assert.ok(directive.indexOf("1 note from Claire") < directive.indexOf("CLAUDE.md"), "what worked, then what needs a hand");
  assert.match(directive, /keep both/i);
  assert.match(directive, /editing it\. ⚠️ The background sync/, "one space between the two, not run together");
});

// A correction of something ALREADY SAID comes before the news: the session opened by
// naming a universe that has since changed, and every sentence after that was scoped to it.
test("the universe correction leads the message — before the arrivals, before the block", () => {
  const directive = remoteArrivalsDirective(
    trace({
      files: [ACTIVE_UNIVERSE_REL, "vault/a.md"],
      authors: ["Claire"],
      blocked: { files: ["CLAUDE.md"], reason: "conflict" },
    }),
    () => "blue-team",
  );

  assert.ok(directive.indexOf("blue-team") < directive.indexOf("1 note from Claire"), "the correction first");
  assert.ok(directive.indexOf("1 note from Claire") < directive.indexOf("CLAUDE.md"), "then the news, then the ask");
  assert.match(directive, /cross-cutting notes\. 📥 The brain synchronised/, "one space between them, not run together");
});

test("a universe read that blows up costs the correction, never the arrivals", () => {
  const directive = remoteArrivalsDirective(
    trace({ files: [ACTIVE_UNIVERSE_REL, "vault/a.md"], authors: ["Claire"] }),
    () => {
      throw new Error("unreadable .vault-rag");
    },
  );

  assert.match(directive, /1 note from Claire/, "one broken part, one lost part");
  assert.doesNotMatch(directive, /universe/i);
});

test("announced once is announced: the correction is not repeated at the next message either", () => {
  assert.equal(
    remoteArrivalsDirective(
      trace({ files: [ACTIVE_UNIVERSE_REL], announcedAt: "2026-09-08T09:01:00.000Z" }),
      () => "blue-team",
    ),
    null,
  );
});

test("a trace that carries neither an arrival nor a block is nothing, not an empty message", () => {
  assert.equal(remoteArrivalsDirective(trace()), null);
  assert.equal(remoteArrivalsDirective(trace({ files: [], blocked: { files: [] } })), null);
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
