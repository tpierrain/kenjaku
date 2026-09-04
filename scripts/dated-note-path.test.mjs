// ─────────────────────────────────────────────────────────────────────────────
// dated-note-path.test.mjs — the entry point that answers "where does today's
// dated note go?" so nobody composes that path by hand (plan step 4).
//
// It answers TWO things, and the second is what makes the rule work next time:
// the path, and the `author:` the note must stamp. Without the stamp, tomorrow's
// resolution reads a note that claims nobody, degrades to the shared file, and the
// mechanism quietly stops existing.
// ─────────────────────────────────────────────────────────────────────────────
import { test } from "node:test";
import assert from "node:assert/strict";

import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { runDatedNotePath } from "./dated-note-path.mjs";

const CLI = join(dirname(fileURLToPath(import.meta.url)), "dated-note-path.mjs");

const ME = "Thomas Pierrain";
const HER = "Claire Dubois";

function fakeDeps(overrides = {}) {
  const logs = [];
  const errors = [];
  return {
    deps: {
      notes: () => overrides.notes ?? [],
      author: () => (overrides.author === undefined ? ME : overrides.author),
      identities: () => overrides.identities ?? [],
      log: (l) => logs.push(l),
      error: (l) => errors.push(l),
    },
    logs,
    errors,
  };
}

const HER_DAY = [{ path: "briefings/2026-09-02.md", frontmatter: { author: HER } }];

test("a day nobody has written yields the base name, and the author to stamp on it", () => {
  const { deps, logs, errors } = fakeDeps();

  assert.equal(runDatedNotePath(["--folder", "daily", "--date", "2026-09-02"], deps), 0);
  assert.deepEqual(errors, []);
  assert.deepEqual(logs, ["path: vault/daily/2026-09-02.md", `author: ${ME}`]);
});

// 🎯 The case the step exists for, and the line that explains it — a file appearing
// under a name nobody chose is confusing unless the reason comes with it.
test("a day someone else already wrote yields a file of my own, and says why", () => {
  // Two other notes sit in the vault, and neither is the day in question: the
  // explanation must name the person who wrote THAT day, not the first note it finds.
  const alongside = [
    { path: "briefings/2026-09-01.md", frontmatter: { author: "Amina Haddad" } },
    ...HER_DAY,
    { path: "acme/briefings/2026-09-02.md", frontmatter: { author: "Lena Fischer" } },
  ];
  const { deps, logs } = fakeDeps({ notes: alongside });

  assert.equal(runDatedNotePath(["--folder", "briefings", "--date", "2026-09-02"], deps), 0);
  assert.deepEqual(logs, [
    "path: vault/briefings/2026-09-02-thomas-pierrain.md",
    `author: ${ME}`,
    `note: ${HER} already wrote briefings/2026-09-02.md today, so this ` +
      "one is yours — both are kept, and neither is merged into the other.",
  ]);
});

test("the author who owns the day keeps writing to it, with nothing to explain", () => {
  const { deps, logs } = fakeDeps({ notes: HER_DAY, author: HER });

  assert.equal(runDatedNotePath(["--folder", "briefings", "--date", "2026-09-02"], deps), 0);
  assert.deepEqual(logs, ["path: vault/briefings/2026-09-02.md", `author: ${HER}`]);
});

test("an explicit --author overrides what git says, so the rule is testable and forceable", () => {
  const { deps, logs } = fakeDeps({ notes: HER_DAY });

  runDatedNotePath(["--folder", "briefings", "--date", "2026-09-02", "--author", "Amina Haddad"], deps);

  assert.equal(logs[0], "path: vault/briefings/2026-09-02-amina-haddad.md");
});

// A machine whose git has no user.name cannot name a person, and inventing one is
// worse than falling back: the shared file merges visibly, an invented path does not.
test("a machine with no git author falls back to the shared file, and says so", () => {
  const { deps, logs } = fakeDeps({ notes: HER_DAY, author: null });

  assert.equal(runDatedNotePath(["--folder", "briefings", "--date", "2026-09-02"], deps), 0);
  assert.doesNotMatch(logs.join("\n"), /^author:/m, "there is no name to stamp, so none is invented");
  // The whole answer, word for word: the explanation is the only thing that turns a
  // silently-shared file into something the owner can act on, so it is not optional prose.
  assert.deepEqual(logs, [
    "path: vault/briefings/2026-09-02.md",
    "note: this machine's git has no user.name, so there is no author to stamp and no file of " +
      'your own to give you. Set it (git config user.name "…") if two people write in this brain.',
  ]);
});

// 🛑 THE NEGATIVE POLE. Each of these is a caller mistake with a DIFFERENT fix, so each
// refusal has to say which one it is — "exit 2" alone sends the caller to the source.
test("a broken question exits 2, answers nothing on stdout, and says which mistake it was", () => {
  const broken = [
    [[], /--folder is required/],
    [["--folder", "daily"], /--date is required/],
    [["--date", "2026-09-02"], /--folder is required/],
    [["--folder", "daily", "--date", "yesterday"], /--date must be a day, spelled YYYY-MM-DD \(got "yesterday"\)/],
    // A flag with nothing after it is the typo a caller actually makes, and it must not
    // fall through as "the flag was never given" — a different mistake with a different fix.
    [["--folder", "daily", "--date"], /--date needs a value/],
    [["--folder"], /--folder needs a value/],
    // Something that is not a flag at all: a shell that lost a quote, most often.
    [["daily", "--date", "2026-09-02"], /unexpected argument "daily"/],
  ];
  for (const [argv, expected] of broken) {
    const { deps, logs, errors } = fakeDeps();
    assert.equal(runDatedNotePath(argv, deps), 2, JSON.stringify(argv));
    assert.deepEqual(logs, []);
    assert.equal(errors.length, 1);
    assert.match(errors[0], expected);
    assert.match(errors[0], /^✗ /, "a refusal is marked as one, not printed as an answer");
  }
});

// A date that merely CONTAINS a day is not a day: unanchored, `--date 2026-09-02T09:00Z`
// or a stray prefix would be accepted and would compose a filename nobody looks for.
test("a date must be a day WHOLE, not a string with a day somewhere inside it", () => {
  for (const date of ["2026-09-02T09:00:00Z", "on-2026-09-02", "2026-09-023"]) {
    const { deps, errors } = fakeDeps();
    assert.equal(runDatedNotePath(["--folder", "daily", "--date", date], deps), 2, date);
    assert.match(errors[0], /must be a day/);
  }
});

// The refusal comes with the usage text, and every line of it is load-bearing: the two
// required flags, the universe form, and where the author comes from when it is omitted.
test("a refusal carries the whole usage text, not a fragment of it", () => {
  const { deps, errors } = fakeDeps();

  assert.equal(runDatedNotePath([], deps), 2);
  for (const fragment of [
    "usage: dated-note-path.mjs --folder <daily|briefings|…> --date <YYYY-MM-DD> [--author \"<name>\"]",
    "--folder may carry a universe (acme/daily); --author defaults to git config user.name.",
  ]) {
    assert.ok(errors[0].includes(fragment), `the usage text still says: ${fragment}`);
  }
});

// A vault that cannot be read is "I could not find out", and the safe answer is the
// shared file — today's behaviour, a visible merge, never an invented path.
test("a vault that cannot be read still answers, with the shared file", () => {
  const { deps, logs } = fakeDeps();
  deps.notes = () => {
    throw new Error("ENOENT");
  };

  assert.equal(runDatedNotePath(["--folder", "daily", "--date", "2026-09-02"], deps), 0);
  assert.equal(logs[0], "path: vault/daily/2026-09-02.md");
});

// ═══════════════════════════════════════════════════════════════════════════
// AS A PROCESS (CONVENTIONS §5bis) — argv, the real vault reader, the real git.
// ═══════════════════════════════════════════════════════════════════════════

test("run as a process from a brain folder, it reads that brain's vault", () => {
  const root = mkdtempSync(join(tmpdir(), "kenjaku-dated-note-"));
  mkdirSync(join(root, "vault", "briefings"), { recursive: true });
  writeFileSync(
    join(root, "vault", "briefings", "2026-09-02.md"),
    `---\ntype: briefing\nauthor: ${HER}\n---\n\n# Briefing\n`,
  );

  const run = spawnSync(
    process.execPath,
    [CLI, "--folder", "briefings", "--date", "2026-09-02", "--author", ME],
    { cwd: root, encoding: "utf8" },
  );

  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /^path: vault\/briefings\/2026-09-02-thomas-pierrain\.md$/m);
  assert.match(run.stdout, new RegExp(`^author: ${ME}$`, "m"));
});

test("as a process, a brain with no vault at all still answers the base name", () => {
  const root = mkdtempSync(join(tmpdir(), "kenjaku-dated-note-empty-"));

  const run = spawnSync(process.execPath, [CLI, "--folder", "daily", "--date", "2026-09-02", "--author", ME], {
    cwd: root,
    encoding: "utf8",
  });

  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /^path: vault\/daily\/2026-09-02\.md$/m);
});

// 🛑 WITHOUT `--author`, and this is the only test that reaches the REAL git wiring.
// Every test above injects the name. The wiring roots git with `-C <cwd>` rather than
// trusting the process's directory — a hook's cwd is not this script's to assume, and a
// git command run in the wrong place does not fail, it answers about somewhere else.
test("as a process with no --author, the name comes from THIS brain's git config", () => {
  const root = mkdtempSync(join(tmpdir(), "kenjaku-dated-note-git-"));
  const git = (...args) => spawnSync("git", args, { cwd: root, encoding: "utf8" });
  git("init", "--quiet", "--initial-branch=main");
  git("config", "user.name", HER);
  git("config", "user.email", "claire@example.invalid");
  mkdirSync(join(root, "vault", "daily"), { recursive: true });
  writeFileSync(join(root, "vault", "daily", "2026-09-02.md"), `---\nauthor: ${ME}\n---\n\n# Monday\n`);

  const run = spawnSync(process.execPath, [CLI, "--folder", "daily", "--date", "2026-09-02"], {
    cwd: root,
    encoding: "utf8",
  });

  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, new RegExp(`^author: ${HER}$`, "m"), "the name really came from git, not from a default");
  assert.match(run.stdout, /^path: vault\/daily\/2026-09-02-claire-dubois\.md$/m);
});

// A refusal the caller never sees is a refusal that did not happen: the skill reads the
// exit code, the human debugging their own arguments reads stderr.
test("as a process, a broken question reaches stderr and leaves stdout empty", () => {
  const root = mkdtempSync(join(tmpdir(), "kenjaku-dated-note-broken-"));

  const run = spawnSync(process.execPath, [CLI, "--folder", "daily", "--date", "yesterday"], {
    cwd: root,
    encoding: "utf8",
  });

  assert.equal(run.status, 2);
  assert.equal(run.stdout, "");
  assert.match(run.stderr, /--date must be a day/);
});

// ═══════════════════════════════════════════════════════════════════════════
// STEP 8 — THE ANSWER REACHES THE FILING, and the stamp says who the person IS.
// ═══════════════════════════════════════════════════════════════════════════

const MY_OTHER_MAC = "tpierrain";

test("a confirmed alias is given the base note, and stamped with the spelling they kept", () => {
  const { deps, logs } = fakeDeps({
    notes: [{ path: "daily/2026-09-02.md", frontmatter: { author: ME } }],
    author: MY_OTHER_MAC,
    identities: [{ name: ME, aka: [MY_OTHER_MAC] }],
  });

  assert.equal(runDatedNotePath(["--folder", "daily", "--date", "2026-09-02"], deps), 0);

  assert.deepEqual(logs, ["path: vault/daily/2026-09-02.md", `author: ${ME}`]);
});

// The stamp is what tomorrow's resolution reads back. Stamping the machine's own
// spelling would leave every note claiming whichever Mac wrote it, and the fusion
// would have to be re-applied on every read forever.
test("the stamp is the canonical spelling even when nothing collides today", () => {
  const { deps, logs } = fakeDeps({ author: MY_OTHER_MAC, identities: [{ name: ME, aka: [MY_OTHER_MAC] }] });

  runDatedNotePath(["--folder", "daily", "--date", "2026-09-02"], deps);

  assert.deepEqual(logs, ["path: vault/daily/2026-09-02.md", `author: ${ME}`]);
});

test("a registry that cannot be read costs the fusion, never the answer", () => {
  const { deps, logs } = fakeDeps({
    notes: [{ path: "daily/2026-09-02.md", frontmatter: { author: ME } }],
    author: MY_OTHER_MAC,
  });
  deps.identities = () => {
    throw new Error("EACCES");
  };

  assert.equal(runDatedNotePath(["--folder", "daily", "--date", "2026-09-02"], deps), 0);

  assert.equal(logs[0], "path: vault/daily/2026-09-02-tpierrain.md");
});

// 🛑 The wiring, end to end: the registry is read from the brain the command runs in.
test("as a process, an answered brain files both Macs into one note", () => {
  const root = mkdtempSync(join(tmpdir(), "kenjaku-dated-note-fused-"));
  mkdirSync(join(root, "vault", "daily"), { recursive: true });
  writeFileSync(join(root, "vault", "daily", "2026-09-02.md"), `---\nauthor: ${ME}\n---\n\n# Monday\n`);
  mkdirSync(join(root, ".vault-rag"), { recursive: true });
  writeFileSync(
    join(root, ".vault-rag", "authors.json"),
    `${JSON.stringify({ identities: [{ name: ME, aka: [MY_OTHER_MAC] }], distinct: [] })}\n`,
  );

  const run = spawnSync(
    process.execPath,
    [CLI, "--folder", "daily", "--date", "2026-09-02", "--author", MY_OTHER_MAC],
    { cwd: root, encoding: "utf8" },
  );

  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /^path: vault\/daily\/2026-09-02\.md$/m, "one owner, one day, one note");
  assert.match(run.stdout, new RegExp(`^author: ${ME}$`, "m"));
});
