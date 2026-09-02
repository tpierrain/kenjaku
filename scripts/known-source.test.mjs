// ─────────────────────────────────────────────────────────────────────────────
// known-source.test.mjs — the door the capture path knocks on before it captures
// (ADR 0041, plan step 1.2/1.3).
//
// Three exit codes, and the third one is the whole safety of the thing:
//   0 — not held (or could not find out): capture.
//   1 — already held: go and read the note that names it.
//   2 — I was asked something I cannot answer.
//
// A usage error MUST NOT read as a hit. A caller that only tests "non-zero" would
// then skip a capture because of a typo in its own arguments — a silent loss,
// which is the one direction ADR 0041 §5 forbids. So the codes are three, and the
// difference between "held" and "broken" is asserted here rather than trusted.
// ─────────────────────────────────────────────────────────────────────────────
import { test } from "node:test";
import assert from "node:assert/strict";

import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { runKnownSource } from "./known-source.mjs";

const CLI = join(dirname(fileURLToPath(import.meta.url)), "known-source.mjs");

const MAIL = "mail|billing@example.com|20260902T161932Z|your-invoice-is-ready";
const THREAD = "slack|C0CEQ4R5E|1725283200.001200";

function fakeDeps(notes = []) {
  const logs = [];
  const errors = [];
  return { deps: { notes: () => notes, log: (l) => logs.push(l), error: (l) => errors.push(l) }, logs, errors };
}

const HELD_BY_TWO = [
  { path: "briefings/2026-09-02.md", frontmatter: { sources: [THREAD, MAIL] } },
  { path: "daily/2026-09-02.md", frontmatter: {} },
  { path: "raw-sources/2026-09-02-invoice.md", frontmatter: { sources: [MAIL] } },
];

test("a source the vault already holds exits 1 and names the note to go and read", () => {
  const { deps, logs, errors } = fakeDeps(HELD_BY_TWO);

  const code = runKnownSource(["--key", THREAD], deps);

  assert.equal(code, 1);
  assert.deepEqual(errors, []);
  assert.equal(logs.length, 1, "one line, so a skill can read it without parsing a report");
  assert.match(logs[0], /already held/);
  assert.match(logs[0], /vault\/briefings\/2026-09-02\.md/);
  // ADR 0041 §6: already held means go and READ it, never discard. Spelled out rather
  // than matched on /read/i, which the word "already" satisfies all by itself.
  assert.match(logs[0], /Read that note and enrich it/);
});

test("every note holding the source is named, and the names are separated", () => {
  const { deps, logs } = fakeDeps(HELD_BY_TWO);

  assert.equal(runKnownSource(["--key", MAIL], deps), 1);
  // The whole list, verbatim: two paths run together are one path nobody can open.
  assert.match(logs[0], /listed by vault\/briefings\/2026-09-02\.md, vault\/raw-sources\/2026-09-02-invoice\.md\./);
});

test("a source nobody holds exits 0, and says so in the affirmative", () => {
  const { deps, logs, errors } = fakeDeps(HELD_BY_TWO);

  const code = runKnownSource(["--key", "calendar|never-seen-before"], deps);

  assert.equal(code, 0);
  assert.deepEqual(errors, []);
  assert.equal(logs.length, 1);
  assert.match(logs[0], /not held/);
  assert.match(logs[0], /calendar\|never-seen-before/);
});

// 🎯 Normalization is the deterministic side's job, never the caller's (ADR 0009).
// The connector's raw fields go in; the key the vault would have written comes out.
test("the key is composed here from the raw fields a connector hands back, not by the caller", () => {
  const { deps, logs } = fakeDeps(HELD_BY_TWO);

  const code = runKnownSource(
    [
      "--type", "mail",
      "--from", "Billing Department <Billing@Example.COM>",
      "--date", "2026-09-02T18:19:32+02:00",
      "--subject", "Your invoice, is ready!",
    ],
    deps,
  );

  assert.equal(code, 1, "a display name, a timezone and some punctuation are the same mail");
  assert.match(logs[0], new RegExp(MAIL.replace(/[|.]/g, "\\$&")));
});

// 🛑 THE NEGATIVE POLE. Each of these is a caller mistake, and each must be
// distinguishable from a hit — otherwise a typo silently cancels a capture.
test("a question that cannot be answered exits 2, never 1", () => {
  const broken = [
    [[], /nothing to look up/],
    [["--key", "not a key at all"], /"not a key at all" is not a source key\. Compose one/],
    [["--type", "linkedin", "--post", "123"], /linkedin/],
    [["--type", "slack", "--channel", "C0CEQ4R5E"], /ts/],
    // A flag with nothing after it is the typo a caller actually makes, and it must not
    // fall through as "no key given" — which is a different mistake with a different fix.
    [["--key"], /--key needs a value/],
    [["--type"], /--type needs a value/],
    // Something that is not a flag at all: a shell that lost a quote, most often.
    [["Your invoice, is ready!", "--type", "mail"], /unexpected argument "Your invoice, is ready!"/],
  ];
  for (const [argv, expected] of broken) {
    const { deps, logs, errors } = fakeDeps(HELD_BY_TWO);
    assert.equal(runKnownSource(argv, deps), 2, `${JSON.stringify(argv)} is a broken question`);
    assert.deepEqual(logs, [], "a broken question answers nothing on stdout");
    assert.equal(errors.length, 1);
    assert.match(errors[0], expected);
  }
});

// A refusal that does not say what the caller SHOULD have typed sends them to the source,
// and this tool exists precisely so that nobody has to read it. Every line of the usage
// text is load-bearing: the two doors, the types, and the fields of each type.
test("a refusal that comes with the usage text carries all of it — both doors and every field", () => {
  const { deps, errors } = fakeDeps(HELD_BY_TWO);

  assert.equal(runKnownSource([], deps), 2);
  for (const fragment of [
    'usage: known-source.mjs --key "<source key>"',
    "or: known-source.mjs --type <slack|calendar|drive|notion|mail> --<field> <value>",
    "slack: --channel --ts · calendar: --event · drive: --file · notion: --page",
    "mail: --from --date --subject",
  ]) {
    assert.ok(errors[0].includes(fragment), `the usage text still says: ${fragment}`);
  }
});

// The other half of the same refusal: a ready-made key that is not one must point at the
// door that composes keys correctly, not merely at the fact that this one is wrong.
test("a malformed key is refused with the way to compose a real one", () => {
  const { deps, errors } = fakeDeps(HELD_BY_TWO);

  assert.equal(runKnownSource(["--key", "the invoice mail from billing"], deps), 2);
  assert.match(errors[0], /--type <…> --<field> <value>/);
  assert.match(errors[0], /a key nothing can match is worse than none/);
});

// A vault that cannot be read is "I could not find out", and the safe answer to that
// is to capture: a duplicate is greppable, a skipped capture is invisible.
test("a vault that cannot be read exits 0 and says it could not find out", () => {
  const logs = [];
  const errors = [];
  const code = runKnownSource(["--key", MAIL], {
    notes: () => {
      throw new Error("ENOENT: no such file or directory");
    },
    log: (l) => logs.push(l),
    error: (l) => errors.push(l),
  });

  assert.equal(code, 0, "unknown must never read as already held");
  assert.equal(logs.length, 1);
  assert.match(logs[0], /could not/i);
});

// ═══════════════════════════════════════════════════════════════════════════
// AS A PROCESS (rules/testing.md, CONVENTIONS §5bis): the entry point is what the
// skill actually runs, and everything above this line would still pass if argv
// never reached it, or if the real vault reader read the wrong folder.
// ═══════════════════════════════════════════════════════════════════════════

function brainWithNotes(notes) {
  const root = mkdtempSync(join(tmpdir(), "kenjaku-known-source-"));
  for (const [rel, sources] of Object.entries(notes)) {
    const abs = join(root, "vault", rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(
      abs,
      `---\ntype: briefing\ncreated: 2026-09-02\nupdated: 2026-09-02\ntags: [x]\nsources: [${sources.join(", ")}]\n---\n\n# A note\n`,
    );
  }
  return root;
}

const run = (root, argv) => spawnSync(process.execPath, [CLI, ...argv], { cwd: root, encoding: "utf8" });

test("run as a process from a brain folder, it reads that brain's vault and answers on stdout", () => {
  const root = brainWithNotes({
    "briefings/2026-09-02.md": [THREAD],
    "acme/raw-sources/2026-09-02-invoice.md": [MAIL],
  });

  const held = run(root, ["--key", THREAD]);
  assert.equal(held.status, 1);
  assert.match(held.stdout, /already held/);
  // The path is relative to the VAULT, spelled whole: a reader that started one folder
  // too high would print `vault/vault/…`, which names no file anyone can open.
  assert.match(held.stdout, /listed by vault\/briefings\/2026-09-02\.md\./);

  const fresh = run(root, ["--key", "drive|1A2b3C"]);
  assert.equal(fresh.status, 0);
  assert.match(fresh.stdout, /not held/);
});

// A refusal the caller never sees is a refusal that did not happen: the skill reads the
// exit code, but the human debugging their own arguments reads stderr.
test("as a process, a broken question reaches stderr and leaves stdout empty", () => {
  const root = brainWithNotes({ "briefings/2026-09-02.md": [MAIL] });

  const broken = run(root, ["--type", "linkedin", "--post", "123"]);

  assert.equal(broken.status, 2);
  assert.equal(broken.stdout, "");
  assert.match(broken.stderr, /linkedin/);
});

// A universe's notes live one folder deeper (ADR 0034). A check blind to them would
// answer "never seen" for every source a universe already holds.
test("as a process, it sees a note inside a universe subtree too", () => {
  const root = brainWithNotes({ "acme/raw-sources/2026-09-02-invoice.md": [MAIL] });

  const held = run(root, ["--key", MAIL]);

  assert.equal(held.status, 1);
  assert.match(held.stdout, /acme\/raw-sources\/2026-09-02-invoice\.md/);
});

// The arguments carry a human subject with spaces and punctuation. If the entry point
// were reading them any other way than as separate argv entries, this is where it shows.
test("as a process, the raw connector fields survive the command line", () => {
  const root = brainWithNotes({ "briefings/2026-09-02.md": [MAIL] });

  const held = run(root, [
    "--type", "mail",
    "--from", "Billing Department <Billing@Example.COM>",
    "--date", "2026-09-02T18:19:32+02:00",
    "--subject", "Your invoice, is ready!",
  ]);

  assert.equal(held.status, 1);
  assert.match(held.stdout, /already held/);
});

test("as a process, a brain with no vault at all still answers, and answers 0", () => {
  const root = mkdtempSync(join(tmpdir(), "kenjaku-known-source-empty-"));

  const answer = run(root, ["--key", MAIL]);

  assert.equal(answer.status, 0);
  assert.match(answer.stdout, /could not|not held/i);
});
