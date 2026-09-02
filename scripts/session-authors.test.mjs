// ─────────────────────────────────────────────────────────────────────────────
// session-authors.test.mjs — the SessionStart hook that notices a brain has more
// than one author (plan steps 4.3, 4.3bis).
//
// Two obligations, and they are different in kind:
//   • EVERY session past the gate gets the line, because a session that does not
//     know who is at the keyboard composes a colliding path;
//   • ONE session in the brain's life gets the announcement, because implicitness
//     owes the human a sentence and owes it exactly once.
//
// Below two authors: nothing at all, not even an empty payload. A solo owner's
// session start must be byte-identical to what it was.
//
// Contract, like every session hook: fail-open, ALWAYS exit 0. A brain whose git
// history cannot be read still opens.
// ─────────────────────────────────────────────────────────────────────────────
import { test } from "node:test";
import assert from "node:assert/strict";

import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { sessionAuthorsNotice } from "./session-authors.mjs";

const ME = "Thomas Pierrain";
const HER = "Claire Dubois";

function fakeDeps(overrides = {}) {
  const emitted = [];
  const marked = [];
  return {
    deps: {
      authors: () => overrides.authors ?? [],
      me: () => (overrides.me === undefined ? ME : overrides.me),
      announced: () => overrides.announced ?? false,
      markAnnounced: () => marked.push(true),
      emit: (o) => emitted.push(o),
    },
    emitted,
    marked,
  };
}

test("a brain with one author emits nothing and marks nothing", () => {
  const { deps, emitted, marked } = fakeDeps({ authors: [ME, ME] });

  assert.equal(sessionAuthorsNotice(deps), 0);
  assert.deepEqual(emitted, []);
  assert.deepEqual(marked, [], "there is nothing to have announced, so nothing is remembered");
});

test("a second author: the line rides every session, the announcement rides this one", () => {
  const { deps, emitted, marked } = fakeDeps({ authors: [HER, ME] });

  assert.equal(sessionAuthorsNotice(deps), 0);
  assert.equal(emitted.length, 1);
  const context = emitted[0].hookSpecificOutput.additionalContext;
  assert.match(context, /more than one person/i);
  assert.match(context, /say this once/i);
  assert.deepEqual(marked, [true], "and it is remembered, so the next session stays quiet about it");
});

test("once announced, the line stays and the announcement is gone for good", () => {
  const { deps, emitted, marked } = fakeDeps({ authors: [HER, ME], announced: true });

  sessionAuthorsNotice(deps);

  const context = emitted[0].hookSpecificOutput.additionalContext;
  assert.match(context, /more than one person/i);
  assert.doesNotMatch(context, /say this once/i);
  assert.deepEqual(marked, [], "a marker already set is not rewritten at every session start");
});

// 🛑 FAIL-OPEN. Session start belongs to the owner, not to this hook: anything that
// goes wrong here costs the notice, never the session.
test("git that cannot be read, and a marker that cannot be written, both cost only the notice", () => {
  const unreadable = fakeDeps();
  unreadable.deps.authors = () => {
    throw new Error("not a git repository");
  };
  assert.equal(sessionAuthorsNotice(unreadable.deps), 0);
  assert.deepEqual(unreadable.emitted, []);

  const unwritable = fakeDeps({ authors: [HER, ME] });
  unwritable.deps.markAnnounced = () => {
    throw new Error("EACCES");
  };
  assert.equal(sessionAuthorsNotice(unwritable.deps), 0);
  assert.equal(unwritable.emitted.length, 1, "the sentence still gets out; only the memory of it is lost");
});

// The person who just cloned has committed nothing. Counting only the history would
// keep the brain silent on exactly the session that matters most: their first.
test("the person at the keyboard counts before their first commit", () => {
  const { deps, emitted } = fakeDeps({ authors: [HER] });

  sessionAuthorsNotice(deps);

  assert.match(emitted[0].hookSpecificOutput.additionalContext, new RegExp(ME));
});

// ═══════════════════════════════════════════════════════════════════════════
// AS A PROCESS (CONVENTIONS §5bis) — a real git repository, a real run.
//
// The hook roots itself on its OWN location, never on the process's directory, so
// the fixture is a brain-SHAPED repo: the entry point plus the whole `scripts/lib/**`
// folder (one `replace` glob in the manifest — a brain receives it whole, so the
// fixture takes it whole), exactly as remote-sync.test.mjs builds one.
// ═══════════════════════════════════════════════════════════════════════════

const HERE = dirname(fileURLToPath(import.meta.url));
const gitIn = (root) => (...args) => spawnSync("git", ["-C", root, ...args], { encoding: "utf8" });

function brainRepo(t, commitAuthors) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "kenjaku-session-authors-")));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "scripts", "lib"), { recursive: true });
  copyFileSync(join(HERE, "session-authors.mjs"), join(root, "scripts", "session-authors.mjs"));
  for (const file of readdirSync(join(HERE, "lib"))) {
    if (!file.endsWith(".mjs") || file.endsWith(".test.mjs")) continue;
    copyFileSync(join(HERE, "lib", file), join(root, "scripts", "lib", file));
  }

  const git = gitIn(root);
  git("init", "--quiet", "--initial-branch=main");
  git("config", "user.email", "me@example.com");
  git("config", "user.name", ME);
  for (const [i, author] of commitAuthors.entries()) {
    git("commit", "--quiet", "--allow-empty", "-m", `note ${i}`, "--author", `${author} <a${i}@example.com>`);
  }
  return root;
}

const run = (root) =>
  spawnSync(process.execPath, [join(root, "scripts", "session-authors.mjs")], { cwd: tmpdir(), encoding: "utf8" });

test("as a process on a one-author brain, it says nothing and exits 0", (t) => {
  const answer = run(brainRepo(t, [ME, ME]));

  assert.equal(answer.status, 0, answer.stderr);
  assert.equal(answer.stdout.trim(), "", "a solo brain's session start is untouched");
});

test("as a process on a two-author brain, it emits the SessionStart payload, and the sentence only once", (t) => {
  const root = brainRepo(t, [ME, HER]);

  const first = run(root);
  assert.equal(first.status, 0, first.stderr);
  const payload = JSON.parse(first.stdout);
  assert.equal(payload.hookSpecificOutput.hookEventName, "SessionStart");
  assert.match(payload.hookSpecificOutput.additionalContext, new RegExp(HER));
  assert.match(payload.hookSpecificOutput.additionalContext, /say this once/i);

  const second = run(root);
  assert.equal(second.status, 0, second.stderr);
  const again = JSON.parse(second.stdout).hookSpecificOutput.additionalContext;
  assert.match(again, /more than one person/i, "the line every session needs is still there");
  assert.doesNotMatch(again, /say this once/i, "and the sentence said once stays said");
});

// 🛑 The marker is per machine and must never travel: the other machine has its own
// first session to announce, and a committed marker would silence it.
test("as a process, the marker it writes leaves the repository clean", (t) => {
  const root = brainRepo(t, [ME, HER]);
  copyFileSync(join(HERE, "..", ".gitignore"), join(root, ".gitignore"));
  gitIn(root)("add", "-A");
  gitIn(root)("commit", "--quiet", "-m", "the brain, as installed");

  run(root);

  assert.equal(gitIn(root)("status", "--porcelain").stdout.trim(), "");
});

test("as a process outside a git repository, it exits 0 and says nothing", (t) => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "kenjaku-session-authors-bare-")));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "scripts", "lib"), { recursive: true });
  copyFileSync(join(HERE, "session-authors.mjs"), join(root, "scripts", "session-authors.mjs"));
  for (const file of readdirSync(join(HERE, "lib"))) {
    if (!file.endsWith(".mjs") || file.endsWith(".test.mjs")) continue;
    copyFileSync(join(HERE, "lib", file), join(root, "scripts", "lib", file));
  }

  const answer = run(root);

  assert.equal(answer.status, 0, answer.stderr);
  assert.equal(answer.stdout.trim(), "");
});
