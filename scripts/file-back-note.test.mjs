import { test } from "node:test";
import assert from "node:assert/strict";

import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { runFileBack, listPeopleCards, realListIo, realFileBackDeps } from "./file-back-note.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// file-back-note — the thin CLI glue over the pure filed-note core (ADR 0009
// rung 2). It reads a JSON filing spec on stdin, injects today's date, writes a
// taxonomy-conformant note under vault/, and NEVER overwrites (fail-loud). All
// side effects come through an injected `deps` port so the glue stays testable.
// Binary exit: 0 written / 1 refused-or-error.
// ═══════════════════════════════════════════════════════════════════════════

function fakeDeps(overrides = {}) {
  const logs = [];
  const errors = [];
  const writes = [];
  const existing = new Set(overrides.existing ?? []);
  const deps = {
    cwd: () => "/brain",
    today: () => "2026-07-17",
    universe: () => overrides.universe ?? "default",
    readInput: () => overrides.input ?? "{}",
    exists: (p) => existing.has(p),
    peopleCards: () => overrides.peopleCards ?? [],
    writeFile: (p, content) => writes.push({ path: p, content }),
    log: (line) => logs.push(line),
    error: (line) => errors.push(line),
  };
  return { deps, logs, errors, writes };
}

test("runFileBack — writes a conformant note under vault/, logs the path, exits 0", () => {
  const spec = JSON.stringify({
    type: "topic",
    title: "Capacity Management",
    tags: ["rag"],
    body: "The distilled answer.",
    links: ["topics/rag"],
  });
  const { deps, logs, writes } = fakeDeps({ input: spec });
  const code = runFileBack([], deps);
  assert.equal(code, 0);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].path, "/brain/vault/topics/capacity-management.md");
  assert.match(writes[0].content, /^---\ntype: topic\ncreated: 2026-07-17\nupdated: 2026-07-17\n/);
  assert.match(writes[0].content, /## Related\n\n- \[\[topics\/rag\]\]\n$/);
  assert.deepEqual(logs, ["✓ Filed back: vault/topics/capacity-management.md"]);
});

test("runFileBack — files the note under the ACTIVE universe, stamping universe:", () => {
  const spec = JSON.stringify({
    type: "person",
    title: "Jane Doe",
    tags: ["team"],
    body: "b",
    confidence: { level: "observed", basis: "her own intro in #general, 2026-07-17." },
  });
  const { deps, logs, writes } = fakeDeps({ input: spec, universe: "acme" });
  const code = runFileBack([], deps);
  assert.equal(code, 0);
  assert.equal(writes[0].path, "/brain/vault/acme/people/jane-doe.md");
  assert.match(writes[0].content, /\nuniverse: acme\n/);
  assert.deepEqual(logs, ["✓ Filed back: vault/acme/people/jane-doe.md"]);
});

test("runFileBack — refuses to overwrite an existing note, writes nothing, exits 1", () => {
  const spec = JSON.stringify({
    type: "topic",
    title: "RAG",
    tags: ["x"],
    body: "b",
  });
  const { deps, errors, writes } = fakeDeps({
    input: spec,
    existing: ["/brain/vault/topics/rag.md"],
  });
  const code = runFileBack([], deps);
  assert.equal(code, 1);
  assert.equal(writes.length, 0);
  // Whole: the second sentence is the only one telling the writer what to do
  // INSTEAD, and a refusal without it reads as a dead end.
  assert.equal(
    errors[0],
    "✗ vault/topics/rag.md already exists — filing back never overwrites. " +
      "Refine that living page by appending a dated section instead.",
  );
});

test("runFileBack — a Windows brain path is compared and written in POSIX form", () => {
  // On Windows join() yields backslashes; the vault path is matched as a string
  // and handed to the existence check, so one mixed form on either side is a
  // note written where nothing looks for it. Fed on purpose here: CI runs the
  // suite on macOS too, where nothing else tells this apart from the identity.
  const spec = JSON.stringify({ type: "topic", title: "RAG", tags: ["x"], body: "b" });
  const { deps, writes } = fakeDeps({ input: spec });
  deps.cwd = () => "C:\\brains\\mind-palace";
  assert.equal(runFileBack([], deps), 0);
  assert.equal(writes[0].path, "C:/brains/mind-palace/vault/topics/rag.md");
});

test("runFileBack — invalid JSON on stdin is a fail-loud error, exits 1", () => {
  const { deps, errors, writes } = fakeDeps({ input: "{not json" });
  const code = runFileBack([], deps);
  assert.equal(code, 1);
  assert.equal(writes.length, 0);
  assert.match(errors[0], /invalid json spec/i);
});

test("runFileBack — a spec the core rejects (empty tags) surfaces as exit 1, no write", () => {
  const spec = JSON.stringify({
    type: "topic",
    title: "X",
    tags: [],
    body: "b",
  });
  const { deps, errors, writes } = fakeDeps({ input: spec });
  const code = runFileBack([], deps);
  assert.equal(code, 1);
  assert.equal(writes.length, 0);
  assert.match(errors[0], /at least one tag|non-empty/i);
});

// ── The homonymy guard: a card that does not say WHICH Romain ───────────────
// Both doors that create a `people/` card (`/file-back` and `/consolidate`)
// write through this one script, so the check has a single choke point. The
// field brain carried 3 Romain, 3 Marie, 2 Karim, 2 Caroline and 2 Michael: a
// new card filed under a first name the vault already holds does not merely
// look ambiguous, it makes the identity discipline's "resolve against the
// vault" unusable — the vault's own answer is then three cards wide.
//
// Deterministic and refusing, on purpose (the F12 lesson `/consolidate` already
// carries): the builder KNOWS what the vault holds, and a warning that writes
// the card anyway renders a caught defect and an ordinary write identically.

test("runFileBack — refuses a person whose first name the vault already holds, naming the homonyms", () => {
  const spec = JSON.stringify({
    type: "person",
    title: "Romain Lefèvre",
    tags: ["acme"],
    body: "SRE, joined in March.",
    confidence: { level: "observed", basis: "the Acme org chart, 2026-03." },
  });
  const { deps, errors, writes } = fakeDeps({
    input: spec,
    peopleCards: ["people/marie-curie.md", "acme/people/romain-durand.md", "people/romain.md"],
  });
  const code = runFileBack([], deps);
  assert.equal(code, 1);
  assert.equal(writes.length, 0, "nothing is written until the card says which one");
  const said = errors.join("\n");
  assert.match(
    said,
    /acme\/people\/romain-durand\.md/,
    "the writer must not have to go looking again",
  );
  assert.match(said, /people\/romain\.md/, "every homonym is named, not just the first");
  assert.doesNotMatch(said, /marie-curie/, "a card bearing another first name is not a homonym");
  assert.match(said, /2 cards already carry the first name "Romain"/, "the count and its plural");
  assert.match(said, /distinguish/, "the refusal must name the field that unblocks it");
  // Asserted WHOLE, not by fragment: this text is the product here — the two
  // lines that say why the card is refused and what unblocks it could each go
  // missing with every match above still green, leaving a bare list of paths.
  assert.equal(
    errors[0],
    '✗ vault/people/romain-lefevre.md — 2 cards already carry the first name "Romain":\n' +
      "    acme/people/romain-durand.md\n" +
      "    people/romain.md\n" +
      "  A card that does not say WHICH Romain only moves the ambiguity.\n" +
      '  Add "distinguish" to the spec (role, org, and what tells them apart), then re-run.',
  );
});

test("runFileBack — the first name it quotes back survives a stray leading space", () => {
  // Models hand over titles with stray whitespace; untrimmed, the message would
  // name the first name as "" while still refusing — a refusal that cannot be
  // acted on.
  const spec = JSON.stringify({
    type: "person",
    title: " Romain Lefèvre",
    tags: ["acme"],
    body: "b",
    confidence: { level: "observed", basis: "the Acme org chart, 2026-03." },
  });
  const { deps, errors } = fakeDeps({
    input: spec,
    peopleCards: ["acme/people/romain-durand.md"],
  });
  assert.equal(runFileBack([], deps), 1);
  assert.match(errors[0], /the first name "Romain"/);
  assert.match(errors[0], /WHICH Romain only moves the ambiguity/);
});

test("runFileBack — ONE homonym is refused too, and reads as one card, not '1 cards'", () => {
  const spec = JSON.stringify({
    type: "person",
    title: "Marie Dupont",
    tags: ["acme"],
    body: "b",
    confidence: { level: "observed", basis: "the Acme org chart." },
  });
  const { deps, errors, writes } = fakeDeps({
    input: spec,
    peopleCards: ["people/marie-curie.md"],
  });
  assert.equal(runFileBack([], deps), 1);
  assert.equal(writes.length, 0);
  assert.match(errors.join("\n"), /1 card already carries the first name "Marie"/);
});

test("runFileBack — a person that DOES say which one is written, homonyms and all", () => {
  const spec = JSON.stringify({
    type: "person",
    title: "Romain Lefèvre",
    tags: ["acme"],
    body: "SRE, joined in March.",
    distinguish: "SRE at Acme — not [[people/romain-durand]] (product).",
    confidence: { level: "observed", basis: "the Acme org chart, 2026-03." },
  });
  const { deps, logs, errors, writes } = fakeDeps({
    input: spec,
    peopleCards: ["acme/people/romain-durand.md"],
  });
  assert.equal(runFileBack([], deps), 0);
  assert.deepEqual(errors, [], "the guard is a door, not a wall");
  assert.equal(writes[0].path, "/brain/vault/people/romain-lefevre.md");
  assert.match(
    writes[0].content,
    /# Romain Lefèvre\n\n> \*\*Which one\*\* — SRE at Acme — not \[\[people\/romain-durand\]\] \(product\)\.\n\n> \*\*Confidence\*\* — ✅ observed · the Acme org chart, 2026-03\.\n\nSRE, joined in March\.\n$/,
    "both answers land in the card itself, above the body, in that order: which one, then how sure",
  );
  assert.deepEqual(logs, ["✓ Filed back: vault/people/romain-lefevre.md"]);
});

// ── Conformant ≠ true: the card must say what its identity rests on ─────────
// The builder guarantees FORM — right path, complete frontmatter, green lint —
// and the vault then reads that form as substance. A card resolved from a bare
// "Jérémy (front Candor)" came out looking exactly like one resolved from a
// signed org chart, and became what every later resolution resolved against.
// So the level is REQUIRED on a person, not offered: left optional, its absence
// would mean "confirmed", which is silence rendered as confidence.

test("runFileBack — refuses a person card that does not say how sure its identity is", () => {
  const spec = JSON.stringify({
    type: "person",
    title: "Jérémy Hinard",
    tags: ["candor"],
    body: "Front-end at Candor.",
  });
  const { deps, errors, writes } = fakeDeps({ input: spec });
  assert.equal(runFileBack([], deps), 1);
  assert.equal(writes.length, 0, "an unbacked identity must not reach the vault at all");
  const said = errors.join("\n");
  assert.match(said, /confidence/, "the refusal must name the field that unblocks it");
  assert.match(
    said,
    /observed.*probable.*unverified/s,
    "and the scale it accepts, so the writer does not invent a fourth level",
  );
  // Whole, for the same reason as the homonymy refusal: the sentence saying what
  // a basis IS is the only thing standing between "confidence" and a field
  // filled with the word "yes".
  assert.equal(
    errors[0],
    "✗ vault/ — a person card must say how sure its identity is.\n" +
      '  Add "confidence": { "level": …, "basis": … } to the spec, where level is one of ' +
      "observed, probable, unverified,\n" +
      "  and basis says what the resolution rests on (the source, its date, the card it matched).",
  );
});

test("runFileBack — the homonymy guard is about PEOPLE: a topic sharing that first segment is written", () => {
  // `topics/romain-rolland.md` next to `people/romain-durand.md` is not an
  // identity collision at all — nothing will ever be resolved to a topic.
  const spec = JSON.stringify({
    type: "topic",
    title: "Romain Rolland",
    tags: ["x"],
    body: "b",
  });
  const { deps, errors, writes } = fakeDeps({
    input: spec,
    peopleCards: ["people/romain-durand.md"],
  });
  assert.equal(runFileBack([], deps), 0);
  assert.deepEqual(errors, []);
  assert.equal(writes[0].path, "/brain/vault/topics/romain-rolland.md");
});

// ── The real listing: which people cards the vault actually holds ───────────
// The guard is only as honest as what it is handed. Kept behind an io seam so
// every branch is reachable (§6): a vault with no people/ at all, the root's
// cross-cutting cards, and each universe's own subtree — the three shapes the
// resolution rule reads.

test("listPeopleCards — collects the root's cards and every universe's, ignoring non-notes", () => {
  const io = {
    list: (dir) =>
      ({
        "/brain/vault": [
          { name: "people", isDirectory: true },
          { name: "acme", isDirectory: true },
          { name: "topics", isDirectory: true },
          { name: "README.md", isDirectory: false },
        ],
        "/brain/vault/people": [
          { name: "jane-doe.md", isDirectory: false },
          { name: ".DS_Store", isDirectory: false },
          { name: "drafts", isDirectory: true },
        ],
        "/brain/vault/acme/people": [{ name: "romain-durand.md", isDirectory: false }],
        "/brain/vault/topics/people": [],
      })[dir] ?? [],
  };
  assert.deepEqual(listPeopleCards(io, "/brain/vault"), [
    "people/jane-doe.md",
    "acme/people/romain-durand.md",
  ]);
});

test("listPeopleCards — asks for exactly the folders a resolution reads, and no others", () => {
  // The fake RECORDS what it is handed: without that, "walks the universe
  // subtrees" and "walks everything at the root" are the same call — a file
  // mistaken for a folder, or `people/` walked into itself, both come back
  // empty and read as correct.
  const asked = [];
  const io = {
    list: (dir) => {
      asked.push(dir);
      return (
        {
          "/brain/vault": [
            { name: "people", isDirectory: true },
            { name: "acme", isDirectory: true },
            { name: "notes.md", isDirectory: false },
          ],
          "/brain/vault/people": [{ name: "jane-doe.md", isDirectory: false }],
          "/brain/vault/acme/people": [{ name: "romain-durand.md", isDirectory: false }],
        }[dir] ?? []
      );
    },
  };
  listPeopleCards(io, "/brain/vault");
  assert.deepEqual(
    asked,
    ["/brain/vault/people", "/brain/vault", "/brain/vault/acme/people"],
    "the root's cards, the vault listing, then each universe's people/ — nothing else",
  );
});

test("realListIo — maps a real folder's entries, and reads a missing one as 'no cards'", () => {
  const dir = mkdtempSync(join(tmpdir(), "file-back-list-"));
  mkdirSync(join(dir, "drafts"));
  writeFileSync(join(dir, "jane-doe.md"), "x");
  assert.deepEqual(
    realListIo.list(dir).sort((a, b) => a.name.localeCompare(b.name)),
    [
      { name: "drafts", isDirectory: true },
      { name: "jane-doe.md", isDirectory: false },
    ],
  );
  // A brain with no people/ yet is the ordinary first-week state, not a crash.
  assert.deepEqual(realListIo.list(join(dir, "nope")), []);
});

// ── The real wiring, run the way the brain runs it ─────────────────────────
// Every test above injects its own deps, so `realFileBackDeps` and the
// entrypoint guard were observed by nothing: the whole file could be wired to
// write nowhere, read no stdin and log nothing, with the suite still green.
// One real child process closes that: it is the only thing here that reaches
// the stdin read, the recursive mkdir, the existence check and the exit code.

test("file-back-note, as a real process — reads stdin, creates the folders, exits 0", () => {
  const brain = mkdtempSync(join(tmpdir(), "file-back-e2e-"));
  const spec = JSON.stringify({
    type: "topic",
    title: "Capacity Management",
    tags: ["rag"],
    body: "The distilled answer.",
  });
  const run = (input) =>
    spawnSync(process.execPath, [fileURLToPath(new URL("./file-back-note.mjs", import.meta.url))], {
      cwd: brain,
      input,
      encoding: "utf8",
    });

  // No vault/ at all — the ordinary shape of a brand-new brain. Two levels are
  // missing, so a non-recursive mkdir fails here and a recursive one does not.
  const first = run(spec);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(first.stdout.trim(), "✓ Filed back: vault/topics/capacity-management.md");
  const written = readFileSync(join(brain, "vault", "topics", "capacity-management.md"), "utf8");
  const today = new Date().toISOString().slice(0, 10);
  assert.match(written, new RegExp(`^---\\ntype: topic\\ncreated: ${today}\\nupdated: ${today}\\n`));
  assert.match(written, /\n# Capacity Management\n\nThe distilled answer\.\n$/);

  // And the same spec twice does not overwrite the first one.
  const second = run(spec);
  assert.equal(second.status, 1);
  assert.match(second.stderr, /already exists — filing back never overwrites/);
});

test("file-back-note, as a real process — files under the universe the pointer names", () => {
  const brain = mkdtempSync(join(tmpdir(), "file-back-universe-"));
  mkdirSync(join(brain, ".vault-rag"), { recursive: true });
  writeFileSync(join(brain, ".vault-rag", "active-universe"), "acme\n");
  writeFileSync(
    join(brain, ".vault-rag", "universes.json"),
    JSON.stringify({ universes: ["acme"] }),
  );
  const run = spawnSync(
    process.execPath,
    [fileURLToPath(new URL("./file-back-note.mjs", import.meta.url))],
    {
      cwd: brain,
      input: JSON.stringify({ type: "topic", title: "Billing", tags: ["x"], body: "b" }),
      encoding: "utf8",
    },
  );
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.stdout.trim(), "✓ Filed back: vault/acme/topics/billing.md");
  assert.match(
    readFileSync(join(brain, "vault", "acme", "topics", "billing.md"), "utf8"),
    /\nuniverse: acme\n---\n/,
  );
});

test("realFileBackDeps — the real ports are what they claim, field by field", () => {
  assert.equal(realFileBackDeps.cwd(), process.cwd());
  assert.equal(realFileBackDeps.today(), new Date().toISOString().slice(0, 10));
  assert.match(realFileBackDeps.today(), /^\d{4}-\d{2}-\d{2}$/, "a date stamp, not an instant");
  assert.equal(realFileBackDeps.log, realFileBackDeps.log);
  assert.equal(typeof realFileBackDeps.exists, "function");
  assert.equal(realFileBackDeps.exists(process.cwd()), true);
  assert.equal(realFileBackDeps.exists(join(process.cwd(), "no-such-file-here")), false);
});

test("realFileBackDeps.peopleCards — reads the vault under the CURRENT brain folder", () => {
  const brain = mkdtempSync(join(tmpdir(), "file-back-brain-"));
  mkdirSync(join(brain, "vault", "acme", "people"), { recursive: true });
  writeFileSync(join(brain, "vault", "acme", "people", "romain-durand.md"), "x");
  const previous = process.cwd();
  try {
    process.chdir(brain);
    assert.deepEqual(realFileBackDeps.peopleCards(), ["acme/people/romain-durand.md"]);
  } finally {
    process.chdir(previous);
  }
});
