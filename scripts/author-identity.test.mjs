// ─────────────────────────────────────────────────────────────────────────────
// author-identity.test.mjs — how the answer to "someone else, or you on another
// machine?" is recorded (plan steps 8.5 and 8.7).
//
// This is the other half of the question: a question nobody can answer is a
// question asked forever, and the session hook asks it at EVERY session start
// until this entry point has written the answer down.
//
// Two things it owes beyond writing the file:
//   • the answer must LEAVE THE MACHINE — a fusion is a fact about the world, true
//     on both Macs, and the question is precisely about the other one. So it commits
//     and pushes itself, scoped to `.vault-rag/`, through the universe switch's own
//     machinery rather than a second copy of it;
//   • a confirmed duo is told what changes, once — the explanation duo mode always
//     owed, said at the moment the answer makes it true instead of on a guess.
//
// Exit 0 when the answer is recorded (even if it could not travel — it IS on disk,
// and the human must hear that it stayed local), 2 when the question itself is broken.
// ─────────────────────────────────────────────────────────────────────────────
import { test } from "node:test";
import assert from "node:assert/strict";

import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { ANSWER_NOT_COMMITTED_WARNING, ANSWER_DEFERRED_NOTE, runAuthorIdentity } from "./author-identity.mjs";
import { PUSH_FAILED_WARNING } from "./auto-push.mjs";
import { readAuthorsState } from "./lib/author-identities.mjs";

const DIR = "/brain/.vault-rag";
const PATH = `${DIR}/authors.json`;

const ME = "Thomas Pierrain";
const MY_OTHER_MAC = "tpierrain";
const HER = "Claire Dubois";

const FUSED = "auto: tpierrain is Thomas Pierrain on another machine";
const CONFIRMED = "auto: Claire Dubois is a second person in this brain";

// One shared timeline for both fakes: the ORDER matters here and cannot be seen from
// either side alone. An answer committed before it is written commits the previous
// answer, and every content assertion in this file would still pass.
function fakes(initial = {}, responses = {}) {
  const events = [];
  const files = new Map(Object.entries(initial));
  const io = {
    existsSync: (p) => files.has(p),
    readFileSync: (p) => {
      if (!files.has(p)) throw new Error(`ENOENT: ${p}`);
      return files.get(p);
    },
    writeFileSync: (p, data) => {
      events.push(`write ${p}`);
      files.set(p, data);
    },
    mkdirSync: () => {},
  };
  // Exact-keyed on the whole command with a STRICT default, like universe-persist's:
  // mutate any argument — the `-- .vault-rag` pathspec included — and the command
  // becomes unknown, the answer breaks, and the happy path fails structurally.
  let commits = 0;
  const git = (args) => {
    const key = args.join(" ");
    events.push(`git ${key}`);
    if (key === "rev-list --count @{u}..HEAD" && !(key in responses)) return { out: `${commits}\n`, ok: true };
    const mapped = responses[key];
    const result = mapped ? { out: "", ok: true, ...mapped } : { out: "", ok: false };
    if (result.ok && args[0] === "commit") commits += 1;
    return result;
  };
  const said = [];
  const wept = [];
  return {
    events,
    files,
    said,
    wept,
    deps: {
      io,
      vaultRagDir: DIR,
      git,
      sleep: () => {},
      author: () => ME,
      log: (m) => said.push(m),
      error: (m) => wept.push(m),
    },
  };
}

// A healthy scoped commit of the answer, and nothing else staged.
const committing = (message) => ({
  "status --porcelain": { out: " M .vault-rag/authors.json\n" },
  "add -A -- .vault-rag": {},
  "diff --cached --quiet -- .vault-rag": { ok: false },
  [`commit -m ${message} -- .vault-rag`]: {},
});

// A repository the owner has opted into pushing from — mapped EXPLICITLY, because an
// upstream that exists by accident is a test lying about its arrangement.
const pushReady = () => ({
  remote: { out: "origin\n" },
  "config --get secondbrain.autopush": { out: "true\n" },
  "rev-parse --abbrev-ref --symbolic-full-name @{u}": { out: "origin/main\n" },
});

const only = (said) => said.join("\n");

// ── "That is me, on my other Mac" ────────────────────────────────────────────

test("the fusion is written under the name this machine is configured with", () => {
  const f = fakes({}, committing(FUSED));

  assert.equal(runAuthorIdentity(["--same-person", MY_OTHER_MAC], f.deps), 0);

  assert.deepEqual(readAuthorsState(f.deps.io, DIR), {
    identities: [{ name: ME, aka: [MY_OTHER_MAC] }],
    distinct: [],
  });
});

test("it says which spelling was kept, because that is where the notes will be filed", () => {
  const f = fakes({}, committing(FUSED));

  runAuthorIdentity(["--same-person", MY_OTHER_MAC], f.deps);

  assert.match(only(f.said), new RegExp(MY_OTHER_MAC));
  assert.match(only(f.said), new RegExp(ME));
  assert.doesNotMatch(only(f.said), /second person/i, "nothing about their brain has changed");
});

// 🛑 THE ANSWER MUST LEAVE THE MACHINE. The question is about the OTHER Mac: an
// answer that stays here is an answer that machine will ask for again.
test("the answer is written first, then committed scoped to .vault-rag, then pushed", () => {
  const f = fakes({}, { ...committing(FUSED), ...pushReady(), push: {} });

  runAuthorIdentity(["--same-person", MY_OTHER_MAC], f.deps);

  const written = f.events.indexOf(`write ${PATH}`);
  const staged = f.events.indexOf("git add -A -- .vault-rag");
  const committed = f.events.indexOf(`git commit -m ${FUSED} -- .vault-rag`);
  const pushed = f.events.indexOf("git push");
  assert.ok(written >= 0 && staged > written, "an answer committed before it is written commits the last one");
  assert.ok(committed > staged);
  // The push has work to do only BECAUSE the commit ran first (the fake counts
  // commits, like real git): a swapped order reads nothing pending and skips.
  assert.ok(pushed > committed, `commit must precede push, got: ${f.events.join(" | ")}`);
});

test("recording the same answer twice writes nothing and commits nothing", () => {
  const f = fakes({ [PATH]: JSON.stringify({ identities: [{ name: ME, aka: [MY_OTHER_MAC] }], distinct: [] }) });

  assert.equal(runAuthorIdentity(["--same-person", MY_OTHER_MAC], f.deps), 0);

  assert.deepEqual(f.events, [], "no write, no git, nothing at all");
  assert.match(only(f.said), new RegExp(MY_OTHER_MAC), "and it still says what it already knew");
});

// ── "No, that really is somebody else" ───────────────────────────────────────

test("a confirmed second person is recorded, and told what changes — once", () => {
  const f = fakes({}, committing(CONFIRMED));

  assert.equal(runAuthorIdentity(["--different", HER], f.deps), 0);

  assert.deepEqual(readAuthorsState(f.deps.io, DIR), { identities: [], distinct: [HER] });
  const notice = only(f.said);
  assert.match(notice, new RegExp(HER));
  assert.match(notice, /once/i);
  assert.match(notice, /own/, "each person's day gets its own note");
  assert.match(notice, /twice/, "and a source you both meet is not stored twice");
});

// A wrong answer has to be correctable, or the first slip is permanent.
test("confirming a person undoes a fusion that had swallowed them", () => {
  const f = fakes(
    { [PATH]: JSON.stringify({ identities: [{ name: ME, aka: [HER] }], distinct: [] }) },
    committing(CONFIRMED),
  );

  assert.equal(runAuthorIdentity(["--different", HER], f.deps), 0);

  assert.deepEqual(readAuthorsState(f.deps.io, DIR), { identities: [{ name: ME, aka: [] }], distinct: [HER] });
});

// ── When the answer cannot travel — it is still an answer ────────────────────

test("a commit that fails is said out loud, and the answer still stands on disk", () => {
  const f = fakes({}, { "status --porcelain": { out: " M .vault-rag/authors.json\n" } }); // `add` unmapped → fails

  assert.equal(runAuthorIdentity(["--same-person", MY_OTHER_MAC], f.deps), 0, "the answer IS recorded");

  assert.ok(only(f.said).includes(ANSWER_NOT_COMMITTED_WARNING.trim()), only(f.said));
  assert.deepEqual(readAuthorsState(f.deps.io, DIR).identities, [{ name: ME, aka: [MY_OTHER_MAC] }]);
});

test("a paused merge defers the commit, and that is said calmly rather than as a failure", () => {
  const f = fakes({}, {
    "status --porcelain": { out: " M .vault-rag/authors.json\n" },
    "rev-parse -q --verify MERGE_HEAD": {},
  });

  runAuthorIdentity(["--same-person", MY_OTHER_MAC], f.deps);

  assert.ok(only(f.said).includes(ANSWER_DEFERRED_NOTE.trim()), only(f.said));
  assert.ok(!only(f.said).includes(ANSWER_NOT_COMMITTED_WARNING.trim()), "a deferral is not a failure");
});

test("a push that fails is said out loud too — the other machine has not heard the answer", () => {
  const f = fakes({}, { ...committing(FUSED), ...pushReady() }); // `push` unmapped → fails, twice

  runAuthorIdentity(["--same-person", MY_OTHER_MAC], f.deps);

  assert.ok(only(f.said).includes(PUSH_FAILED_WARNING.trim()), only(f.said));
});

// ── Broken questions ─────────────────────────────────────────────────────────

test("a machine whose git has no name cannot record a fusion, and says which command fixes it", () => {
  const f = fakes({}, committing(FUSED));
  f.deps.author = () => null;

  assert.equal(runAuthorIdentity(["--same-person", MY_OTHER_MAC], f.deps), 2);

  assert.deepEqual(f.events, [], "nothing written, nothing committed");
  assert.match(only(f.wept), /user\.name/);
});

test("a name this brain could not file under is refused, and nothing is written", () => {
  for (const argv of [["--same-person", "✨"], ["--different", "  "], ["--same-person", ""]]) {
    const f = fakes({}, committing(FUSED));

    assert.equal(runAuthorIdentity(argv, f.deps), 2, `on ${JSON.stringify(argv)}`);
    assert.deepEqual(f.events, []);
    assert.equal(f.wept.length, 1);
  }
});

test("a question that is not one of the two answers is refused with the usage", () => {
  for (const argv of [[], ["--maybe", HER], ["--same-person"], [HER], ["--different", HER, "--same-person", ME]]) {
    const f = fakes({}, committing(FUSED));

    assert.equal(runAuthorIdentity(argv, f.deps), 2, `on ${JSON.stringify(argv)}`);
    assert.match(only(f.wept), /--same-person/);
    assert.match(only(f.wept), /--different/);
    assert.deepEqual(f.events, []);
  }
});

// ── Reading back what was answered ───────────────────────────────────────────

test("--list shows both halves of the registry, in plain words", () => {
  const f = fakes({
    [PATH]: JSON.stringify({ identities: [{ name: ME, aka: [MY_OTHER_MAC] }], distinct: [HER] }),
  });

  assert.equal(runAuthorIdentity(["--list"], f.deps), 0);

  const listed = only(f.said);
  assert.match(listed, new RegExp(`${ME}.*${MY_OTHER_MAC}`, "s"));
  assert.match(listed, new RegExp(HER));
  assert.deepEqual(f.events, [], "reading answers nothing and changes nothing");
});

test("--list on a brain nobody has answered for says so, rather than printing an empty shape", () => {
  const f = fakes();

  assert.equal(runAuthorIdentity(["--list"], f.deps), 0);

  assert.match(only(f.said), /no|none|nothing/i);
  assert.doesNotMatch(only(f.said), /\[\]|\{\}/, "an empty JSON shape is not an answer to a human");
});

// ═══════════════════════════════════════════════════════════════════════════
// AS A PROCESS (CONVENTIONS §5bis, step 8.7) — a real git repository, a real run,
// and the loop closed end to end: the hook asks, this entry point answers, the
// hook goes quiet. Neither half proves that alone.
// ═══════════════════════════════════════════════════════════════════════════

const HERE = dirname(fileURLToPath(import.meta.url));
const gitIn = (root) => (...args) => spawnSync("git", ["-C", root, ...args], { encoding: "utf8" });

function brainRepo(t, commitAuthors, { as = ME } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "kenjaku-author-identity-")));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "scripts", "lib"), { recursive: true });
  for (const entry of ["author-identity.mjs", "session-authors.mjs", "auto-commit.mjs", "auto-push.mjs"]) {
    copyFileSync(join(HERE, entry), join(root, "scripts", entry));
  }
  for (const file of readdirSync(join(HERE, "lib"))) {
    if (!file.endsWith(".mjs") || file.endsWith(".test.mjs")) continue;
    copyFileSync(join(HERE, "lib", file), join(root, "scripts", "lib", file));
  }

  const git = gitIn(root);
  git("init", "--quiet", "--initial-branch=main");
  git("config", "user.email", "me@example.com");
  git("config", "user.name", as);
  // The brain, as installed: tracked and committed, so a later `git status` shows what
  // THIS run left behind rather than the fixture that was never committed.
  git("add", "-A");
  git("commit", "--quiet", "-m", "the brain, as installed");
  for (const [i, author] of commitAuthors.entries()) {
    git("commit", "--quiet", "--allow-empty", "-m", `note ${i}`, "--author", `${author} <a${i}@example.com>`);
  }
  return root;
}

const runIn = (root, script, args = []) =>
  spawnSync(process.execPath, [join(root, "scripts", script), ...args], { cwd: tmpdir(), encoding: "utf8" });

// 🛑 THE DEFECT THE RELEASE WAS HELD ON, closed end to end: one owner, two Macs,
// one answer — and the brain stops calling them two people.
test("as a process: the hook asks, the answer is recorded, and the hook goes silent", (t) => {
  const root = brainRepo(t, [ME, MY_OTHER_MAC]);

  const asked = runIn(root, "session-authors.mjs");
  assert.match(JSON.parse(asked.stdout).hookSpecificOutput.additionalContext, new RegExp(MY_OTHER_MAC));

  const answered = runIn(root, "author-identity.mjs", ["--same-person", MY_OTHER_MAC]);
  assert.equal(answered.status, 0, answered.stderr);
  assert.match(answered.stdout, new RegExp(ME));

  const again = runIn(root, "session-authors.mjs");
  assert.equal(again.status, 0, again.stderr);
  assert.equal(again.stdout.trim(), "", "the question is answered, so it is never asked again");
});

test("as a process, the answer lands in the brain's own .vault-rag and is committed there", (t) => {
  const root = brainRepo(t, [ME, MY_OTHER_MAC]);

  runIn(root, "author-identity.mjs", ["--same-person", MY_OTHER_MAC]);

  assert.deepEqual(JSON.parse(readFileSync(join(root, ".vault-rag", "authors.json"), "utf8")), {
    identities: [{ name: ME, aka: [MY_OTHER_MAC] }],
    distinct: [],
  });
  const log = gitIn(root)("log", "-1", "--format=%s").stdout.trim();
  assert.match(log, /tpierrain is Thomas Pierrain on another machine/);
  assert.equal(gitIn(root)("status", "--porcelain").stdout.trim(), "", "and it commits itself, leaving no dirt");
});

// The owner's pending work is theirs: a scoped commit must never sweep it up under
// an answer's message (the review finding the universe switch was fixed for).
test("as a process, it commits ONLY the answer, leaving other pending work alone", (t) => {
  const root = brainRepo(t, [ME, MY_OTHER_MAC]);
  mkdirSync(join(root, "vault"), { recursive: true });
  const draft = join(root, "vault", "draft.md");
  copyFileSync(join(HERE, "author-identity.mjs"), draft);

  gitIn(root)("add", "vault/draft.md"); // STAGED, which is the shape the v4.9.1 review found

  runIn(root, "author-identity.mjs", ["--different", HER]);

  assert.match(
    gitIn(root)("status", "--porcelain").stdout,
    /^A {2}vault\/draft\.md$/m,
    "the draft is still theirs: staged, uncommitted, exactly where they left it",
  );
  assert.match(gitIn(root)("log", "-1", "--format=%s").stdout, /Claire Dubois is a second person/);
});

test("as a process, a broken question exits 2 and says so on stderr", (t) => {
  const root = brainRepo(t, [ME, MY_OTHER_MAC]);

  const answer = runIn(root, "author-identity.mjs", ["--nonsense", HER]);

  assert.equal(answer.status, 2);
  assert.match(answer.stderr, /--same-person/);
  assert.equal(answer.stdout.trim(), "");
});

test("as a process, --list on an unanswered brain says nothing is recorded and exits 0", (t) => {
  const root = brainRepo(t, [ME, MY_OTHER_MAC]);

  const answer = runIn(root, "author-identity.mjs", ["--list"]);

  assert.equal(answer.status, 0, answer.stderr);
  assert.match(answer.stdout, /no|none|nothing/i);
});
