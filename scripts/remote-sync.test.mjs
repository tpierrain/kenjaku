// ─────────────────────────────────────────────────────────────────────────────
// remote-sync.test.mjs — the live-sync tick DRIVEN AS A PROCESS (plan #84, 2.4).
//
// `scripts/lib/remote-sync.test.mjs` pins the sequence against a fake git; this
// file runs the real entry point, with the real git, on a real temp repo whose
// `origin` is a local bare repo — the only place where the composition root is
// actually executed (CONVENTIONS §5bis: a module's exports can be green while the
// FILE does nothing). It is also the only place where the `union` merge rule of
// step 1 is proven THROUGH the tick rather than beside it.
//
// Three things only a process test can see, and all three are asserted below:
//   • the brain root comes from the module's own location, never from the cwd —
//     every run below is launched from somewhere else on purpose;
//   • the trace the tick leaves at the brain root is IGNORED by the launcher's
//     `.gitignore`, so a sync never dirties the tree it just cleaned (2.6);
//   • the local commits reach the remote in the same tick, in-process, without
//     `auto-push.mjs` as a child (the T2 cross-version trap).
// ─────────────────────────────────────────────────────────────────────────────
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { brainRoot, buildCheckNote, buildGit, buildGitInvocation, buildPush, gitEnv, minGapMsFrom, realTickDeps } from "./remote-sync.mjs";
import { buildNotifier } from "./lib/os-banner.mjs";
import { engineParser } from "./lib/vault-write-guard.mjs";
import { LAST_TICK_FILE } from "./lib/remote-sync-gate.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const LAUNCHER = join(HERE, "..");
const DAILY = join("vault", "daily", "2026-09-08.md");
const NOTE = "---\ntitle: Monday\n---\n\n## Log\n\n- shared line\n";

// The engine's own parser lives in `rag/node_modules`, and CI's harness step runs
// BEFORE `npm ci` (see vault-write-guard.test.mjs for the full story): the one test
// that needs the real parser defers instead of faking it, and CI re-runs this file
// after the engine's install.
const NEEDS_ENGINE_PARSER =
  engineParser({ brainDir: LAUNCHER }) === null
    ? { skip: "engine parser absent — CI re-runs this file after `npm ci` in rag/" }
    : {};

function gitIn(cwd) {
  return (...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function identify(cwd, name) {
  const git = gitIn(cwd);
  git("config", "user.email", `${name.toLowerCase()}@example.invalid`);
  git("config", "user.name", name);
  // The bytes of a merged note are the claim of the union test below: pin the line
  // endings so a Windows runner's autocrlf cannot turn a green into a CRLF red.
  git("config", "core.autocrlf", "false");
}

/**
 * A brain-shaped repo: the real entry point and the whole `scripts/lib/**` folder
 * (one `replace` glob in the manifest — a brain receives it whole, so the fixture
 * takes it whole and stops keeping a list of somebody else's imports), the
 * launcher's own `.gitattributes` and `.gitignore`, one daily note, and an
 * `origin` that is a local bare repo with an upstream set.
 */
function makeBrain(t, { name = "Paul", remote = true } = {}) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "remote-sync-")));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "scripts", "lib"), { recursive: true });
  copyFileSync(join(HERE, "remote-sync.mjs"), join(root, "scripts", "remote-sync.mjs"));
  for (const file of readdirSync(join(HERE, "lib"))) {
    if (!file.endsWith(".mjs") || file.endsWith(".test.mjs")) continue;
    copyFileSync(join(HERE, "lib", file), join(root, "scripts", "lib", file));
  }
  for (const file of [".gitattributes", ".gitignore"]) copyFileSync(join(LAUNCHER, file), join(root, file));

  const git = gitIn(root);
  git("init", "--quiet", "--initial-branch=main");
  identify(root, name);
  mkdirSync(join(root, "vault", "daily"), { recursive: true });
  writeFileSync(join(root, DAILY), NOTE);
  writeFileSync(join(root, "CLAUDE.md"), "# Constitution\n\n- rule one\n");
  git("add", "-A");
  git("commit", "--quiet", "-m", "the brain, as installed");

  let bare = null;
  if (remote) {
    bare = realpathSync(mkdtempSync(join(tmpdir(), "remote-sync-origin-")));
    t.after(() => rmSync(bare, { recursive: true, force: true }));
    // `--initial-branch=main` on the BARE side too: without it the remote's HEAD names
    // a branch nobody ever pushes, and a clone of it lands on no branch at all — the
    // other machine's commits would then go somewhere this brain never looks.
    execFileSync("git", ["init", "--bare", "--quiet", "--initial-branch=main", bare]);
    git("remote", "add", "origin", bare);
    git("push", "--quiet", "-u", "origin", "main");
  }
  return { root, git, bare };
}

/** The OTHER machine (or the other person): a second clone of the same remote. */
function otherMachine(t, bare, name = "Claire") {
  const clone = realpathSync(mkdtempSync(join(tmpdir(), "remote-sync-other-")));
  t.after(() => rmSync(clone, { recursive: true, force: true }));
  // `-c core.autocrlf=false` on the CLONE ITSELF, not merely afterwards: the checkout
  // happens during `clone`, so a Windows runner's global autocrlf would land CRLF in the
  // other machine's working tree — and its very next commit would then rewrite the line
  // endings of every file in the repo. The tick would report three arrivals instead of
  // one, which is exactly what the Windows tripwire saw.
  execFileSync("git", ["-c", "core.autocrlf=false", "clone", "--quiet", bare, clone]);
  identify(clone, name);
  const git = gitIn(clone);
  return {
    dir: clone,
    git,
    /** Appends to a file and pushes it, the way the other side's auto-commit does. */
    pushes(rel, text, message = "from the other machine") {
      const file = join(clone, rel);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, (existsSync(file) ? readFileSync(file, "utf8") : "") + text);
      git("add", "-A");
      git("commit", "--quiet", "-m", message);
      git("push", "--quiet");
    },
  };
}

/**
 * Runs the REAL entry point as a process, deliberately from another working
 * directory: the brain root must come from the script's own location (as
 * auto-commit.mjs does), never from the cwd the hook happens to inherit.
 */
function tick(root, env = {}) {
  return execFileSync("node", [join(root, "scripts", "remote-sync.mjs")], {
    cwd: tmpdir(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, ...env },
  }).trim();
}

const traceOf = (root) => JSON.parse(readFileSync(join(root, "remote-arrivals.json"), "utf8"));
const appendedLine = "- CL: the notary answered\n";

// ── The tick, as a process, on a real repo ───────────────────────────────────

test("no remote: the tick says so and touches nothing", (t) => {
  const { root, git } = makeBrain(t, { remote: false });

  assert.equal(tick(root), "no-remote");
  assert.equal(existsSync(join(root, "remote-arrivals.json")), false, "nothing to announce, so no trace at all");
  assert.equal(git("status", "--porcelain"), "");
});

test("the remote holds nothing new: total silence, no trace written", (t) => {
  const { root } = makeBrain(t);

  assert.equal(tick(root), "up-to-date");
  assert.equal(existsSync(join(root, "remote-arrivals.json")), false, "a 'nothing new' every 90 s is alarm fatigue");
});

test("a note pushed from the other machine arrives, named with its author, and the tree stays clean", (t) => {
  const { root, git, bare } = makeBrain(t);
  otherMachine(t, bare).pushes(join("vault", "people", "claire.md"), "---\ntitle: Claire\n---\n\n- met the notary\n");

  assert.equal(tick(root), "arrived");

  assert.match(readFileSync(join(root, "vault", "people", "claire.md"), "utf8"), /met the notary/);
  const trace = traceOf(root);
  assert.deepEqual(trace.files, ["vault/people/claire.md"]);
  assert.deepEqual(trace.authors, ["Claire"]);
  assert.equal(trace.blocked, null);
  assert.equal(trace.announcedAt, null);
  assert.match(trace.arrivedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(git("status", "--porcelain"), "", "the trace is gitignored: a sync never dirties the tree it just cleaned");
});

test("two machines appending to the same daily note merge by union, through the entry point", (t) => {
  const { root, git, bare } = makeBrain(t);
  otherMachine(t, bare).pushes(DAILY, appendedLine);
  // The local side appended too, and has not pushed yet: the rebase must replay it.
  writeFileSync(join(root, DAILY), readFileSync(join(root, DAILY), "utf8") + "- TP: signed the lease\n");
  git("commit", "--quiet", "-am", "append here");

  assert.equal(tick(root), "arrived");

  const merged = readFileSync(join(root, DAILY), "utf8");
  assert.doesNotMatch(merged, /^(<{7}|={7}|>{7})/m, "no conflict marker may ever land in a note");
  assert.match(merged, /- CL: the notary answered\n/);
  assert.match(merged, /- TP: signed the lease\n/);
  assert.deepEqual(traceOf(root).authors, ["Claire"], "my own replayed commit is not an arrival");
  assert.equal(git("status", "--porcelain"), "", "nothing left for a human");
});

test("with auto-push on, the local commit reaches the remote in the same tick", (t) => {
  const { root, git, bare } = makeBrain(t);
  git("config", "secondbrain.autopush", "true");
  otherMachine(t, bare).pushes(DAILY, appendedLine);
  writeFileSync(join(root, DAILY), readFileSync(join(root, DAILY), "utf8") + "- TP: signed the lease\n");
  git("commit", "--quiet", "-am", "append here");

  assert.equal(tick(root), "arrived");

  const onRemote = execFileSync("git", ["--git-dir", bare, "log", "--format=%s"], { encoding: "utf8" });
  assert.match(onRemote, /append here/, "the other side receives at its next tick only if we pushed");
  assert.equal(git("rev-list", "--count", "@{u}..HEAD").trim(), "0");
});

test("auto-push OFF (the install default): the arrival is pulled, nothing is pushed", (t) => {
  const { root, git, bare } = makeBrain(t);
  otherMachine(t, bare).pushes(DAILY, appendedLine);
  writeFileSync(join(root, DAILY), readFileSync(join(root, DAILY), "utf8") + "- TP: signed the lease\n");
  git("commit", "--quiet", "-am", "append here");

  assert.equal(tick(root), "arrived");

  const onRemote = execFileSync("git", ["--git-dir", bare, "log", "--format=%s"], { encoding: "utf8" });
  assert.doesNotMatch(onRemote, /append here/, "push stays opt-in, exactly as the Stop hook's does");
});

test("a second window a moment later yields to the gate: one effective clock per machine", (t) => {
  const { root, bare } = makeBrain(t);
  const other = otherMachine(t, bare);
  other.pushes(join("vault", "people", "claire.md"), "---\ntitle: Claire\n---\n\n- first\n");
  assert.equal(tick(root), "arrived");

  other.pushes(join("vault", "people", "claire.md"), "- second\n", "another note, right after");
  assert.equal(tick(root), "gated", "the machine already probed within the interval");
  assert.doesNotMatch(readFileSync(join(root, "vault", "people", "claire.md"), "utf8"), /- second/);
  assert.equal(existsSync(join(root, ".cache", LAST_TICK_FILE)), true, "the marker the next window reads");
});

test("a shorter configured interval shortens the gate too, so no tick is silently dropped", (t) => {
  const { root, bare } = makeBrain(t);
  const other = otherMachine(t, bare);
  other.pushes(join("vault", "people", "claire.md"), "---\ntitle: Claire\n---\n\n- first\n");
  assert.equal(tick(root, { REMOTE_SYNC_INTERVAL: "1" }), "arrived");

  other.pushes(join("vault", "people", "claire.md"), "- second\n", "another note, right after");
  execFileSync("node", ["-e", "Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1100)"]);
  assert.equal(tick(root, { REMOTE_SYNC_INTERVAL: "1" }), "arrived", "a 1 s interval must not be gated by the 90 s default");
});

test("a dirty tree defers: nothing is pulled over a half-written note", (t) => {
  const { root, bare } = makeBrain(t);
  otherMachine(t, bare).pushes(join("vault", "people", "claire.md"), "---\ntitle: Claire\n---\n\n- met the notary\n");
  writeFileSync(join(root, DAILY), NOTE + "- half a sentence");

  assert.equal(tick(root), "deferred-dirty");
  assert.equal(existsSync(join(root, "vault", "people", "claire.md")), false, "the persistence path commits first");
  assert.equal(existsSync(join(root, "remote-arrivals.json")), false);
});

test("git is busy (.git/index.lock): the tick yields instead of racing the auto-commit hook", (t) => {
  const { root, bare } = makeBrain(t);
  otherMachine(t, bare).pushes(join("vault", "people", "claire.md"), "---\ntitle: Claire\n---\n\n- met the notary\n");
  writeFileSync(join(root, ".git", "index.lock"), "");

  assert.equal(tick(root), "deferred-index-lock");
  assert.equal(existsSync(join(root, "vault", "people", "claire.md")), false);
});

test("a conflict the union rule does not cover: the rebase is undone, the file named, the tree intact", (t) => {
  const { root, git, bare } = makeBrain(t);
  otherMachine(t, bare).pushes("CLAUDE.md", "- a rule from over there\n");
  writeFileSync(join(root, "CLAUDE.md"), "# Constitution\n\n- rule one\n- a rule from HERE\n");
  git("commit", "--quiet", "-am", "my own rule");

  assert.equal(tick(root), "blocked");

  assert.deepEqual(traceOf(root).blocked, { files: ["CLAUDE.md"], reason: "conflict" });
  assert.match(readFileSync(join(root, "CLAUDE.md"), "utf8"), /- a rule from HERE\n$/, "my version is untouched");
  assert.equal(git("status", "--porcelain"), "", "no rebase left half-done for a human to find");
  assert.equal(existsSync(join(root, ".git", "rebase-merge")), false);
});

test("a union merge that damages a note's header undoes the whole rebase, and says which note", NEEDS_ENGINE_PARSER, (t) => {
  const { root, git, bare } = makeBrain(t);
  // The honest limit of `union` (§ A): both sides edit the SAME frontmatter line, so the
  // driver keeps both — and the note carries `title:` twice, which the indexer refuses.
  const bothSidesTouchTheHeader = (side) => `---\ntitle: ${side}\n---\n\n## Log\n\n- shared line\n`;
  // The engine's parser is resolved from the brain's own `rag/`, exactly as a rehydrated
  // brain resolves it; the fixture borrows the launcher's installed dependencies through
  // NODE_PATH rather than installing its own.
  mkdirSync(join(root, "rag"), { recursive: true });
  copyFileSync(join(LAUNCHER, "rag", "package.json"), join(root, "rag", "package.json"));
  git("add", "-A");
  git("commit", "--quiet", "-m", "the engine, as rehydrated");

  writeFileSync(join(root, DAILY), bothSidesTouchTheHeader("Monday here"));
  git("commit", "--quiet", "-am", "retitled here");
  const other = otherMachine(t, bare, "Claire");
  writeFileSync(join(other.dir, DAILY), bothSidesTouchTheHeader("Monday there"));
  other.git("commit", "--quiet", "-am", "retitled there");
  other.git("push", "--quiet");

  const outcome = tick(root, { NODE_PATH: join(LAUNCHER, "rag", "node_modules") });

  assert.equal(outcome, "blocked");
  const trace = traceOf(root);
  assert.deepEqual(trace.blocked.files, [DAILY.split(/[\\/]/).join("/")]);
  assert.match(trace.blocked.reason, /title/, "the note is named, and so is the key that broke it");
  assert.equal(readFileSync(join(root, DAILY), "utf8"), bothSidesTouchTheHeader("Monday here"), "my note is exactly as it was");
  assert.equal(git("status", "--porcelain"), "");
});

// ── The composition root's seams, one by one ─────────────────────────────────

test("brainRoot resolves ONE level up from the module (scripts/ → the brain), not the cwd", () => {
  assert.equal(brainRoot(`file://${join(LAUNCHER, "scripts", "remote-sync.mjs")}`), LAUNCHER);
});

test("gitEnv forbids every prompt a child git could raise, and keeps the inherited environment", () => {
  const env = gitEnv({ PATH: "/usr/bin", GIT_ASKPASS: "/opt/some-gui-askpass" });
  assert.equal(env.PATH, "/usr/bin", "the inherited environment travels: git needs its PATH");
  assert.equal(env.GIT_TERMINAL_PROMPT, "0");
  assert.equal(env.GIT_ASKPASS, "echo", "an askpass that answers nothing beats a GUI popup nobody is there to close");
  assert.match(env.GIT_SSH_COMMAND, /BatchMode=yes/);
});

test("buildGitInvocation composes the WHOLE request as a value: the brain, the kill timeout, the closed doors", () => {
  const request = buildGitInvocation({ repo: "/brains/mine", args: ["status", "--porcelain"], env: { PATH: "/usr/bin" } });

  assert.equal(request.command, "git");
  assert.deepEqual(request.args, ["status", "--porcelain"]);
  assert.deepEqual(request.options, {
    cwd: "/brains/mine",
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 20_000,
    env: { PATH: "/usr/bin", GIT_TERMINAL_PROMPT: "0", GIT_ASKPASS: "echo", GIT_SSH_COMMAND: "ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new" },
  });
});

test("buildGit runs git in the brain, under the no-prompt environment and a 20 s kill", () => {
  const calls = [];
  const git = buildGit("/brains/mine", (bin, args, options) => (calls.push({ bin, args, options }), "out\n"));

  assert.deepEqual(git(["status", "--porcelain"]), { out: "out\n", ok: true });
  assert.equal(calls[0].bin, "git");
  assert.deepEqual(calls[0].args, ["status", "--porcelain"]);
  assert.equal(calls[0].options.cwd, "/brains/mine");
  assert.equal(calls[0].options.timeout, 20_000, "a git waiting on a password is a missed tick, never a hang");
  assert.equal(calls[0].options.encoding, "utf8");
  assert.deepEqual(calls[0].options.stdio, ["ignore", "pipe", "pipe"]);
  assert.equal(calls[0].options.env.GIT_TERMINAL_PROMPT, "0");
});

test("buildGit maps a refusing git to {ok:false} with both streams, and a silent one to ''", () => {
  const failing = buildGit("/brains/mine", () => {
    throw Object.assign(new Error("boom"), { stdout: "out", stderr: "err" });
  });
  assert.deepEqual(failing(["push"]), { out: "outerr", ok: false });

  const mute = buildGit("/brains/mine", () => {
    throw new Error("killed");
  });
  assert.deepEqual(mute(["push"]), { out: "", ok: false });
  assert.deepEqual(buildGit("/brains/mine", () => null)(["status"]), { out: "", ok: true });
});

test("minGapMsFrom follows the configured interval, and falls back to 90 s on anything else", () => {
  assert.equal(minGapMsFrom({ REMOTE_SYNC_INTERVAL: "30" }), 30_000);
  assert.equal(minGapMsFrom({ REMOTE_SYNC_INTERVAL: "1" }), 1_000);
  assert.equal(minGapMsFrom({ REMOTE_SYNC_INTERVAL: "0" }), 90_000, "0 turns the clock off upstream; it never opens the gate");
  assert.equal(minGapMsFrom({ REMOTE_SYNC_INTERVAL: "-5" }), 90_000);
  assert.equal(minGapMsFrom({ REMOTE_SYNC_INTERVAL: "90s" }), 90_000);
  assert.equal(minGapMsFrom({ REMOTE_SYNC_INTERVAL: "" }), 90_000);
  assert.equal(minGapMsFrom({}), 90_000);
  assert.equal(minGapMsFrom(undefined), 90_000, "called with no environment at all");
  assert.equal(minGapMsFrom({ REMOTE_SYNC_INTERVAL: "  30  " }), 30_000, "a value typed with spaces around it still counts");
  // Every one of these is a number JavaScript would happily accept and a person never
  // meant: whole seconds, or the default. Nothing in between.
  assert.equal(minGapMsFrom({ REMOTE_SYNC_INTERVAL: "1e3" }), 90_000);
  assert.equal(minGapMsFrom({ REMOTE_SYNC_INTERVAL: "0x1E" }), 90_000);
  assert.equal(minGapMsFrom({ REMOTE_SYNC_INTERVAL: "+30" }), 90_000);
  assert.equal(minGapMsFrom({ REMOTE_SYNC_INTERVAL: "30.5" }), 90_000);
});

// The banner is the one port whose wiring nothing else can observe: the tick calls it, the
// toast is native, and a port handed the wrong arguments would fail on a machine where
// nobody is watching. `CI` makes the decision "stay quiet", so this exercises the wiring
// with no child process at all — and a mis-wired port throws right here instead.
test("realTickDeps wires every port the tick needs, banner included", () => {
  const deps = realTickDeps(import.meta.url, { CI: "1" });

  assert.deepEqual(
    Object.keys(deps).sort(),
    ["checkNote", "gate", "git", "indexLockPresent", "notify", "now", "push", "readTrace", "writeTrace"],
    "runTick destructures exactly these: a port added there and forgotten here is `undefined is not a function`",
  );
  assert.doesNotThrow(() => deps.notify({ files: ["vault/a.md"], authors: ["Claire"] }));
});

test("buildPush pushes only when the four conditions of the Stop hook hold, and says so", () => {
  const answers = {
    remote: "origin\n",
    "config --get secondbrain.autopush": "true\n",
    "rev-parse --abbrev-ref --symbolic-full-name @{u}": "origin/main\n",
    "rev-list --count @{u}..HEAD": "2\n",
    push: "",
  };
  const calls = [];
  const gitOf = (overrides = {}) => (args) => {
    const key = args.join(" ");
    calls.push(key);
    const a = { ...answers, ...overrides }[key];
    return typeof a === "string" ? { out: a, ok: true } : a ?? { out: "", ok: false };
  };

  assert.equal(buildPush({ git: gitOf() })(), "pushed");
  assert.deepEqual(calls, [
    "remote",
    "config --get secondbrain.autopush",
    "rev-parse --abbrev-ref --symbolic-full-name @{u}",
    "rev-list --count @{u}..HEAD",
    "push",
  ]);
});

test("buildPush skips on each missing condition, and reports a refused push as failed", () => {
  const base = {
    remote: "origin\n",
    "config --get secondbrain.autopush": "true\n",
    "rev-parse --abbrev-ref --symbolic-full-name @{u}": "origin/main\n",
    "rev-list --count @{u}..HEAD": "2\n",
    push: "",
  };
  const push = (overrides) =>
    buildPush({
      git: (args) => {
        const a = { ...base, ...overrides }[args.join(" ")];
        return typeof a === "string" ? { out: a, ok: true } : a ?? { out: "", ok: false };
      },
    })();

  assert.equal(push({ remote: "" }), "skipped");
  assert.equal(push({ remote: "\n" }), "skipped", "a brain with no remote answers a blank line, not an empty string");
  assert.equal(push({ "config --get secondbrain.autopush": "false\n" }), "skipped", "push stays opt-in");
  assert.equal(push({ "rev-parse --abbrev-ref --symbolic-full-name @{u}": { out: "", ok: false } }), "skipped");
  assert.equal(push({ "rev-list --count @{u}..HEAD": "0\n" }), "skipped", "nothing to push");
  assert.equal(push({ "rev-list --count @{u}..HEAD": "not a number\n" }), "skipped");
  assert.equal(push({ push: { out: "rejected", ok: false } }), "failed", "the next tick retries; a hook never shouts");
});

// The trace's own read/write moved to `lib/remote-arrivals.mjs` — the announcement hook reads
// the very bytes this entry writes, and two top-level scripts may not import each other. Its
// tests moved with it, to `lib/remote-arrivals.test.mjs`.

test("buildCheckNote judges through the ENGINE's own parser: the header the indexer refuses is refused here", NEEDS_ENGINE_PARSER, (t) => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "remote-sync-check-")));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "vault"), { recursive: true });
  writeFileSync(join(root, "vault", "twice.md"), "---\ntitle: here\ntitle: there\n---\n\nbody\n");
  writeFileSync(join(root, "vault", "fine.md"), NOTE);
  const checkNote = buildCheckNote({ brainDir: root, parse: engineParser({ brainDir: LAUNCHER }) });

  const verdict = checkNote("vault/twice.md");
  assert.equal(verdict.ok, false);
  assert.match(verdict.reason, /"title"/, "the key that broke the note is named, not a line:column");
  assert.deepEqual(checkNote("vault/fine.md"), { ok: true });
});

test("buildCheckNote says 'ok' when it cannot judge: an unverifiable note is not a broken one", (t) => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "remote-sync-check-")));
  t.after(() => rmSync(root, { recursive: true, force: true }));

  assert.deepEqual(buildCheckNote({ brainDir: root, parse: null })("vault/anything.md"), { ok: true }, "no engine deps yet (a clone nobody rehydrated)");
  assert.deepEqual(
    buildCheckNote({ brainDir: root, parse: () => assert.fail("nothing to parse") })("vault/gone.md"),
    { ok: true },
    "a note the merge DELETED cannot be read, and is not a damaged note",
  );
});

// The banner's own rules are pinned in `lib/os-banner.test.mjs`; what is asserted HERE is
// that the entry point hands the tick the real one, bound to this machine and its switches.
// A notifier wired to nothing looks exactly like a notifier that decided to stay quiet.
test("the tick's notifier is the real banner, bound to this platform and this environment", () => {
  const spawned = [];
  const notify = buildNotifier({
    platform: "darwin",
    env: {},
    spawn: (command, args) => (spawned.push({ command, args }), { unref: () => {} }),
  });

  notify({ files: ["vault/people/claire.md"], authors: ["Claire"] });

  assert.equal(spawned[0].command, "osascript");
  assert.match(spawned[0].args[1], /1 note from Claire/);
});

test("realTickDeps wires every seam the tick asks for, bound to the brain the module sits in", () => {
  const deps = realTickDeps(`file://${join(LAUNCHER, "scripts", "remote-sync.mjs")}`, { REMOTE_SYNC_INTERVAL: "90" });

  assert.deepEqual(Object.keys(deps).sort(), [
    "checkNote",
    "gate",
    "git",
    "indexLockPresent",
    "notify",
    "now",
    "push",
    "readTrace",
    "writeTrace",
  ]);
  for (const [name, value] of Object.entries(deps)) {
    if (name === "gate") continue;
    assert.equal(typeof value, "function", `${name} must be callable`);
  }
  assert.equal(typeof deps.gate.acquire, "function");
  assert.equal(typeof deps.gate.release, "function");
  assert.ok(deps.now() instanceof Date);
  assert.equal(deps.indexLockPresent(), false, "this repo is not mid-commit while its own test runs");
});
