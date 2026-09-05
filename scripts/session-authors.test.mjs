// ─────────────────────────────────────────────────────────────────────────────
// session-authors.test.mjs — the SessionStart hook that notices a brain has more
// than one author (plan steps 4.3, 4.3bis).
//
// Two obligations, and they are different in kind:
//   • EVERY session past the gate gets the line, because a session that does not
//     know who is at the keyboard composes a colliding path;
//   • an unplaced second name gets a QUESTION, every session UNTIL IT IS ANSWERED
//     (step 8) — because the brain compares git author names and nothing else, so
//     it cannot tell an owner's second Mac from a colleague, and a question asked
//     once and ignored once would leave that wrong guess standing for good.
//
// Below two authors: nothing at all, not even an empty payload. A solo owner's
// session start must be byte-identical to what it was.
//
// Contract, like every session hook: fail-open, ALWAYS exit 0. A brain whose git
// history cannot be read still opens. And this hook WRITES NOTHING: what it used to
// remember per machine (`.cache/second-author-announced`) is now the answer itself,
// in `.vault-rag/authors.json`, which travels to the other machine.
// ─────────────────────────────────────────────────────────────────────────────
import { test } from "node:test";
import assert from "node:assert/strict";

import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { sessionAuthorsNotice } from "./session-authors.mjs";

const ME = "Thomas Pierrain";
const MY_OTHER_MAC = "tpierrain";
const HER = "Claire Dubois";

function fakeDeps(overrides = {}) {
  const emitted = [];
  return {
    deps: {
      authors: () => overrides.authors ?? [],
      me: () => (overrides.me === undefined ? ME : overrides.me),
      state: () => overrides.state ?? { identities: [], distinct: [] },
      emit: (o) => emitted.push(o),
    },
    emitted,
  };
}

test("a brain with one author emits nothing at all", () => {
  const { deps, emitted } = fakeDeps({ authors: [ME, ME] });

  assert.equal(sessionAuthorsNotice(deps), 0);
  assert.deepEqual(emitted, []);
});

test("an unplaced second name: the line rides every session, and so does the question", () => {
  const { deps, emitted } = fakeDeps({ authors: [HER, ME] });

  assert.equal(sessionAuthorsNotice(deps), 0);
  assert.equal(emitted.length, 1);
  const context = emitted[0].hookSpecificOutput.additionalContext;
  assert.match(context, /more than one person/i);
  assert.match(context, /never guess/i);
  assert.match(context, new RegExp(HER));
});

test("once the answer is 'that is a second person', the line stays and the question stops", () => {
  const { deps, emitted } = fakeDeps({ authors: [HER, ME], state: { identities: [], distinct: [HER] } });

  sessionAuthorsNotice(deps);

  const context = emitted[0].hookSpecificOutput.additionalContext;
  assert.match(context, /more than one person/i);
  assert.doesNotMatch(context, /never guess/i, "an answered question is not asked again");
});

// 🛑 THE DEFECT THE RELEASE WAS HELD ON, at the hook that says it out loud: one
// person, two Macs, one answer given — and the brain goes completely quiet.
test("once the answer is 'that is me on my other Mac', the whole notice disappears", () => {
  const { deps, emitted } = fakeDeps({
    authors: [MY_OTHER_MAC, ME],
    state: { identities: [{ name: ME, aka: [MY_OTHER_MAC] }], distinct: [] },
  });

  assert.equal(sessionAuthorsNotice(deps), 0);
  assert.deepEqual(emitted, [], "a solo owner's session start is byte-identical to what it was");
});

// 🛑 FAIL-OPEN. Session start belongs to the owner, not to this hook: anything that
// goes wrong here costs the notice, never the session.
test("git that cannot be read costs the notice, and nothing else", () => {
  const { deps, emitted } = fakeDeps();
  deps.authors = () => {
    throw new Error("not a git repository");
  };

  assert.equal(sessionAuthorsNotice(deps), 0);
  assert.deepEqual(emitted, []);
});

// A registry that cannot be read is "no answer yet", never "no notice": the safe
// reading of an unreadable answer is to ask again, which costs one line, where the
// other way round costs a brain that silently files a stranger's notes as the owner's.
test("a registry that cannot be read costs the fusion, never the question", () => {
  const { deps, emitted } = fakeDeps({ authors: [HER, ME] });
  deps.state = () => {
    throw new Error("EACCES");
  };

  assert.equal(sessionAuthorsNotice(deps), 0);
  assert.match(emitted[0].hookSpecificOutput.additionalContext, /never guess/i);
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

test("as a process on a two-author brain, it emits the payload — and keeps asking until answered", (t) => {
  const root = brainRepo(t, [ME, HER]);

  const first = run(root);
  assert.equal(first.status, 0, first.stderr);
  const payload = JSON.parse(first.stdout);
  assert.equal(payload.hookSpecificOutput.hookEventName, "SessionStart");
  assert.match(payload.hookSpecificOutput.additionalContext, new RegExp(HER));
  assert.match(payload.hookSpecificOutput.additionalContext, /never guess/i);
  // The name at the keyboard comes from THIS repository's git config, and this is the
  // only test that reaches that wiring: every other one injects it.
  assert.match(payload.hookSpecificOutput.additionalContext, new RegExp(`At this keyboard: ${ME}\\.`));

  const second = run(root);
  assert.equal(second.status, 0, second.stderr);
  const again = JSON.parse(second.stdout).hookSpecificOutput.additionalContext;
  assert.match(again, /more than one person/i, "the line every session needs is still there");
  assert.match(again, /never guess/i, "and an unanswered question is asked again, or it never gets answered");
});

// 🛑 THE WIRING THIS FILE OWNS, end to end: the registry is read from the brain's OWN
// `.vault-rag/`, resolved from the hook's file location. Read it from anywhere else and
// the answer the owner gave is on disk, correct, and never consulted.
test("as a process, an answered brain reads its registry and goes silent", (t) => {
  const root = brainRepo(t, [ME, MY_OTHER_MAC]);
  mkdirSync(join(root, ".vault-rag"), { recursive: true });
  writeFileSync(
    join(root, ".vault-rag", "authors.json"),
    `${JSON.stringify({ identities: [{ name: ME, aka: [MY_OTHER_MAC] }], distinct: [] }, null, 2)}\n`,
  );

  const answer = run(root);

  assert.equal(answer.status, 0, answer.stderr);
  assert.equal(answer.stdout.trim(), "", "one owner, two Macs, one answer given: complete silence");
});

test("as a process, a registry damaged by hand costs the fusion and not the session", (t) => {
  const root = brainRepo(t, [ME, MY_OTHER_MAC]);
  mkdirSync(join(root, ".vault-rag"), { recursive: true });
  writeFileSync(join(root, ".vault-rag", "authors.json"), "{ half-written");

  const answer = run(root);

  assert.equal(answer.status, 0, answer.stderr);
  assert.match(JSON.parse(answer.stdout).hookSpecificOutput.additionalContext, /never guess/i);
});

// 🛑 THIS HOOK WRITES NOTHING. It used to leave a per-machine marker; the memory is
// now the ANSWER, and the answer is written by the entry point the human's reply
// triggers. A session start that dirties the tree makes the next tick defer.
test("as a process, it leaves the repository exactly as it found it", (t) => {
  const root = brainRepo(t, [ME, HER]);
  copyFileSync(join(HERE, "..", ".gitignore"), join(root, ".gitignore"));
  gitIn(root)("add", "-A");
  gitIn(root)("commit", "--quiet", "-m", "the brain, as installed");

  run(root);

  assert.equal(gitIn(root)("status", "--porcelain").stdout.trim(), "", "no marker, no trace, nothing");
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

// ── A fusion decided on the other machine (step 9.1) ──────────────────────────
//
// 🛑 THE EXACT HOLE. Fusing is convergent on purpose, so "it's the same person"
// answered on the newcomer's machine makes two humans resolve to one — and every
// other line this hook can emit goes quiet at once: the roll call needs two people,
// the question needs an unplaced name, and there is neither. Without the notice
// below, this session start says NOTHING and the arrival is hidden.
test("a fusion nobody here endorsed reaches a session that has nothing else to say", () => {
  const { deps, emitted } = fakeDeps({
    authors: [ME, HER],
    state: { identities: [{ name: HER, aka: [ME], confirmedBy: [HER] }], distinct: [] },
  });

  assert.equal(sessionAuthorsNotice(deps), 0);

  assert.equal(emitted.length, 1, "silence here is the defect");
  assert.match(emitted[0].systemMessage, /another machine/i);
  assert.match(emitted[0].hookSpecificOutput.additionalContext, /decided elsewhere/i);
});

test("and it goes quiet once this keyboard has endorsed it", () => {
  const { deps, emitted } = fakeDeps({
    authors: [ME, HER],
    state: { identities: [{ name: HER, aka: [ME], confirmedBy: [HER, ME] }], distinct: [] },
  });

  sessionAuthorsNotice(deps);

  assert.deepEqual(emitted, []);
});

// Fail-open, in the direction the rest of this file already falls: a registry that
// cannot be read costs the answers it held, and never the session.
test("a registry that cannot be read costs the notice, not the session start", () => {
  const { deps, emitted } = fakeDeps({ authors: [ME, HER] });
  deps.state = () => {
    throw new Error("EACCES");
  };

  assert.equal(sessionAuthorsNotice(deps), 0);

  assert.match(emitted[0].systemMessage, /someone else, or them on another machine/i);
});
