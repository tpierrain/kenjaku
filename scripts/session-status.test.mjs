import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  DOC_COUNT_SQL,
  buildGitInvocation,
  buildReconcileInvocation,
  buildUpstreamProbeInvocation,
  countMarkdown,
  readDocCountFrom,
  realSessionStatusDeps,
  runGitInvocation,
  runSessionStatus,
} from "./session-status.mjs";
import { GIT_MAX_BUFFER } from "./lib/engine-fetch.mjs";
import { bootstrapReassuranceMessage } from "./lib/self-heal-message.mjs";
import { SWEEP_MESSAGE } from "./lib/startup-sync.mjs";
import { SYNC_MARKER_REL } from "./lib/startup-sync-gate.mjs";
import { RESTART_FLAG_REL } from "./lib/restart-nudge.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// session-status — the SessionStart hook: sweep, pull, then emit 2-3 status
// lines. It is the LAST of the three files debt 1 of the v4.8.0 mutation pass
// named (v4.9.0-mutation-debt-plan.md), and the only one that could not simply
// be run to check the work: executing it here sweeps and auto-commits this very
// working tree. So the equivalence of its OUTPUT before and after the move was
// proved in a disposable git worktree, where a sweep is harmless, and what is
// pinned here is the composition — driven entirely through injected seams, so
// no test in this file ever touches a real repo, a real disk or a real child.
//
// The one exception is the import probe at the bottom, which spawns the real
// file: after the move it is precisely the thing that must do NOTHING.
// ═══════════════════════════════════════════════════════════════════════════

const CLI = join(dirname(fileURLToPath(import.meta.url)), "session-status.mjs");

const REPO = join("/", "brain");
const SCRIPTS_DIR = join(REPO, "scripts");
const MARKER_PATH = join(REPO, SYNC_MARKER_REL);
const FLAG_PATH = join(REPO, RESTART_FLAG_REL);
const ENV_PATH = join(REPO, ".env");
const VAULT = join(REPO, "vault");

// A .env whose embedder needs no key, so the cases below assert COMPOSITION
// instead of dragging in gemini-key's own rule at every turn.
const KEYLESS_ENV = "EMBEDDING_PROVIDER=in-process\n";

const dirEntry = (name) => ({ name, isDirectory: () => true, isFile: () => false });
const fileEntry = (name) => ({ name, isDirectory: () => false, isFile: () => true });

// An in-memory disk that RECORDS. `files` is the content, `dirs` the listings;
// every write is appended to `written` in order, which is what lets the marker
// bracketing be asserted as a sequence rather than one call at a time.
//
// The two readers are DELIBERATELY strict about their second argument: a fake
// that ignores it makes the argument unobservable, and `readFileSync(p, "utf8")`
// could then lose its encoding — returning a Buffer to code that string-matches
// it — with every test still green. A double's answer has to be a fingerprint of
// what it was asked, or it certifies nothing.
function fakeDisk({ files = {}, dirs = {} } = {}) {
  const written = [];
  return {
    files,
    written,
    existsSync: (p) => p in files || p in dirs,
    readFileSync: (p, encoding) => {
      assert.equal(encoding, "utf8", `read of ${p} must ask for text, not a Buffer`);
      if (!(p in files)) throw new Error(`ENOENT: ${p}`);
      return files[p];
    },
    writeFileSync: (p, body) => {
      files[p] = body;
      written.push({ path: p, body });
    },
    mkdirSync: () => {},
    readdirSync: (p, options) => {
      assert.deepEqual(options, { withFileTypes: true }, "the scan needs dirents, not names");
      if (!(p in dirs)) throw new Error(`ENOENT: ${p}`);
      return dirs[p];
    },
  };
}

// A git that answers per command and records what it was ASKED, in order. The
// key is the whole argv joined — a pull and a status must never share an answer.
function scriptedGit(answers = {}) {
  const asked = [];
  const git = (args) => {
    asked.push(args);
    const hit = answers[args.join(" ")];
    if (hit === undefined) return { out: "", ok: true };
    return typeof hit === "string" ? { out: hit, ok: true } : hit;
  };
  return { git, asked };
}

// The whole seam set, defaulted to "a clean brain with nothing to say", so each
// test overrides only the one thing it is about.
function harness(overrides = {}) {
  const { disk = fakeDisk(), git = scriptedGit().git, ...rest } = overrides;
  const emitted = [];
  const spawned = [];
  const dbAsked = [];
  const deps = {
    repo: REPO,
    scriptsDir: SCRIPTS_DIR,
    git,
    spawn: (command, args, options) => {
      spawned.push({ command, args, options });
      return { unref: () => {} };
    },
    execPath: join("/", "usr", "bin", "node"),
    platform: "darwin",
    existsSync: disk.existsSync,
    readFileSync: disk.readFileSync,
    writeFileSync: disk.writeFileSync,
    mkdirSync: disk.mkdirSync,
    readdirSync: disk.readdirSync,
    readHookPayload: () => '{"session_id":"session-7"}',
    readDocCount: (dbPath) => {
      dbAsked.push(dbPath);
      return null;
    },
    deriveWanted: () => ({ wantedSkillDirs: [], wantedServerIds: [] }),
    now: () => 1_755_000_000_000,
    write: (text) => emitted.push(text),
    ...rest,
  };
  return {
    deps,
    disk,
    emitted,
    spawned,
    dbAsked,
    run: () => runSessionStatus([], deps),
    // The emitted payload, parsed. One call, one line, and that is asserted here
    // rather than in every case: a hook that writes twice corrupts the harness's
    // stdin-JSON contract just as surely as one that writes malformed JSON.
    output: () => {
      assert.equal(emitted.length, 1, "the hook emits exactly once");
      assert.ok(emitted[0].endsWith("\n"), "the payload is one newline-terminated line");
      assert.equal(emitted[0].trimEnd().includes("\n"), false, "no newline of our own inside it");
      return JSON.parse(emitted[0]);
    },
  };
}

// ─── The startup sync: what runs, in which order ─────────────────────────────

test("the pull is BRACKETED by the session marker — running before it, done after", () => {
  const disk = fakeDisk();
  const { git, asked } = scriptedGit({ remote: "origin\n", "pull --rebase": "Updating a1b2c3..d4e5f6\n" });
  const h = harness({ disk, git });

  h.run();

  // The marker's two writes must straddle the pull, or a hook that waits on it
  // reads the pointer this machine woke up in (lib/startup-sync-gate.mjs).
  assert.deepEqual(
    disk.written.map((w) => [w.path, JSON.parse(w.body).phase]),
    [
      [MARKER_PATH, "running"],
      [MARKER_PATH, "done"],
    ],
  );
  assert.deepEqual(JSON.parse(disk.written[0].body), {
    sessionId: "session-7",
    phase: "running",
    at: 1_755_000_000_000,
  });
  // …and the pull itself happened between them, which the git log proves.
  assert.deepEqual(asked, [
    ["status", "--porcelain"],
    ["remote"],
    ["pull", "--rebase"],
    ["rev-parse", "--short", "HEAD"],
    ["status", "--porcelain"],
    ["diff", "--name-only", "ORIG_HEAD", "HEAD"],
  ]);
});

test("a dirty tree is SWEPT before the pull — the order is the whole point", () => {
  const { git, asked } = scriptedGit({
    "status --porcelain": " M vault/notes/a.md\n?? vault/notes/b.md\n",
    remote: "origin\n",
    "pull --rebase": "Updating a1b2c3..d4e5f6\n",
  });
  const h = harness({ git });

  h.run();

  assert.deepEqual(asked, [
    ["status", "--porcelain"],
    ["add", "-A"],
    ["commit", "-m", SWEEP_MESSAGE],
    ["remote"],
    ["pull", "--rebase"],
    ["rev-parse", "--short", "HEAD"],
    ["status", "--porcelain"],
    ["diff", "--name-only", "ORIG_HEAD", "HEAD"],
  ]);
});

test("no remote — nothing is pulled, and the banner still reports a clean repo", () => {
  const { git, asked } = scriptedGit({ "rev-parse --short HEAD": "9f0acb1\n" });
  const h = harness({ git, disk: fakeDisk({ files: { [ENV_PATH]: KEYLESS_ENV } }) });

  h.run();

  assert.equal(
    asked.some((args) => args[0] === "pull"),
    false,
    "a brain with no remote must never be made to pull",
  );
  assert.match(h.output().systemMessage, /^✅ Repo up to date \(commit 9f0acb1\)\./);
});

test("no session id on stdin — the marker is not written, and the pull happens anyway", () => {
  const disk = fakeDisk();
  const { git, asked } = scriptedGit({ remote: "origin\n" });
  const h = harness({ disk, git, readHookPayload: () => "" });

  h.run();

  assert.deepEqual(disk.written, [], "an unkeyable marker is worse than none — fail-open");
  // The pull is NOT conditional on the marker: a hook run by hand still syncs.
  assert.deepEqual(asked, [
    ["status", "--porcelain"],
    ["remote"],
    ["pull", "--rebase"],
    ["rev-parse", "--short", "HEAD"],
    ["status", "--porcelain"],
    ["diff", "--name-only", "ORIG_HEAD", "HEAD"],
  ]);
});

test("a FAILED pull is never asked what it changed — and the banner says it failed", () => {
  const { git, asked } = scriptedGit({
    remote: "origin\n",
    "pull --rebase": { out: "fatal: could not read from remote repository\n", ok: false },
  });
  const h = harness({ git, disk: fakeDisk({ files: { [ENV_PATH]: KEYLESS_ENV } }) });

  h.run();

  assert.equal(
    asked.some((args) => args[0] === "diff"),
    false,
    "ORIG_HEAD means nothing after a pull that did not land — asking would report a phantom diff",
  );
  assert.match(h.output().systemMessage, /^⚠️ Pull failed — /);
});

test("a pull that landed says HOW MANY files it changed", () => {
  const { git } = scriptedGit({
    remote: "origin\n",
    "rev-parse --short HEAD": "d4e5f6a\n",
    "pull --rebase": "Updating a1b2c3..d4e5f6\n",
    "diff --name-only ORIG_HEAD HEAD": "vault/notes/kept.md\nvault/notes/other.md\nvault/notes/third.md\n",
  });
  const h = harness({ git, disk: fakeDisk({ files: { [ENV_PATH]: KEYLESS_ENV } }) });

  h.run();

  assert.match(h.output().systemMessage, /^📥 Repo updated — 3 files changed \(commit d4e5f6a\)\./);
});

// ─── F20: a pull that lands the ENGINE freezes this session ───────────────────

test("a pull that lands frozen wiring ARMS the restart flag", () => {
  const disk = fakeDisk();
  const { git } = scriptedGit({
    remote: "origin\n",
    "pull --rebase": "Updating a1b2c3..d4e5f6\n",
    "diff --name-only ORIG_HEAD HEAD": "vault/notes/kept.md\nscripts/lib/rag-status.mjs\n",
  });
  const h = harness({ disk, git });

  h.run();

  assert.deepEqual(
    disk.written.filter((w) => w.path === FLAG_PATH).map((w) => w.body),
    ["restart needed to finish the engine update\n"],
  );
});

test("a pull that lands ONLY notes arms nothing", () => {
  const disk = fakeDisk();
  const { git } = scriptedGit({
    remote: "origin\n",
    "pull --rebase": "Updating a1b2c3..d4e5f6\n",
    "diff --name-only ORIG_HEAD HEAD": "vault/notes/kept.md\nvault/notes/other.md\n",
  });
  const h = harness({ disk, git });

  h.run();

  assert.deepEqual(disk.written.filter((w) => w.path === FLAG_PATH), []);
});

// ─── The emitted payload, asserted WHOLE ─────────────────────────────────────

test("the hook output is the whole object — both channels, version relayed to Desktop", () => {
  const disk = fakeDisk({
    files: {
      [ENV_PATH]: KEYLESS_ENV,
      [join(REPO, "engine-manifest.json")]: JSON.stringify({ source: { ref: "v4.9.1" } }),
    },
    dirs: { [VAULT]: [fileEntry("one.md"), fileEntry("two.md")] },
  });
  const { git } = scriptedGit({ "rev-parse --short HEAD": "9f0acb1\n" });
  const h = harness({ disk, git, readDocCount: () => 2 });

  h.run();

  // No cached upstream verdict here, so the version line says so rather than
  // implying "you are current" (F3) — and that whole line is what rides both
  // channels, which is exactly why this asserts the object and not a fragment.
  assert.deepEqual(h.output(), {
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext:
        "[engine] ⚙️ Kenjaku engine v4.9.1 · checking for updates… — " +
        "state this version once, verbatim, in your first message.",
    },
    systemMessage:
      "⚙️ Kenjaku engine v4.9.1 · checking for updates…\n" +
      "✅ Repo up to date (commit 9f0acb1).\n" +
      "🧠 RAG — 2/2 files indexed.",
  });
});

test("a pending restart LEADS the banner and silences the Desktop version relay", () => {
  const disk = fakeDisk({
    files: {
      [ENV_PATH]: KEYLESS_ENV,
      [join(REPO, "engine-manifest.json")]: JSON.stringify({ source: { ref: "v4.9.1" } }),
      [FLAG_PATH]: "restart needed to finish the engine update\n",
    },
    dirs: { [VAULT]: [fileEntry("one.md")] },
  });
  const h = harness({ disk, readDocCount: () => 1 });

  h.run();

  const out = h.output();
  assert.deepEqual(Object.keys(out.hookSpecificOutput), ["hookEventName"]);
  assert.match(
    out.systemMessage,
    /^⚠️ RESTART Claude to finish the engine update\n⚙️ Kenjaku engine v4\.9\.1 · checking for updates…\n/,
  );
});

// ─── The Gemini key line: only when the chosen embedder needs one ─────────────

test("the key warning appears when the embedder needs a key and .env has none", () => {
  const disk = fakeDisk({
    files: { [ENV_PATH]: "EMBEDDING_PROVIDER=gemini\n" },
    dirs: { [VAULT]: [fileEntry("one.md")] },
  });
  const h = harness({ disk });

  h.run();

  // Asserted WHOLE, not by a fragment: this line is three sentences glued from
  // three literals, and matching only the first lets the other two be blanked —
  // on the one line that tells an owner why their brain cannot answer.
  assert.deepEqual(h.output().systemMessage.split("\n")[0], [
    "⚠️ Your brain needs its Gemini key before it can search your notes. Ask me to open ",
    "your .env file, paste the key after GOOGLE_GEMINI_API_KEY=, save it, and ask your ",
    "question again — it picks the key up on its own. Your notes themselves are untouched.",
  ].join(""));
});

test("a keyless embedder never sees that warning, key or no key", () => {
  const disk = fakeDisk({
    files: { [ENV_PATH]: KEYLESS_ENV },
    dirs: { [VAULT]: [fileEntry("one.md")] },
  });
  const h = harness({ disk });

  h.run();

  assert.equal(h.output().systemMessage.includes("Gemini key"), false);
});

test("no .env at all — the default embedder is Gemini, so the warning is due", () => {
  const h = harness({ disk: fakeDisk({ dirs: { [VAULT]: [fileEntry("one.md")] } }) });

  h.run();

  assert.match(h.output().systemMessage, /Gemini key/);
});

// ─── The upstream re-probe: detached, throttled, and never in the way ─────────

test("the upstream re-probe is spawned detached, with the invocation asserted whole", () => {
  const disk = fakeDisk({ files: { [ENV_PATH]: KEYLESS_ENV } });
  const h = harness({ disk });

  h.run();

  assert.deepEqual(h.spawned, [
    {
      command: join("/", "usr", "bin", "node"),
      args: [join(SCRIPTS_DIR, "upstream-check-run.mjs"), "--brainDir", REPO],
      options: { detached: true, stdio: "ignore", windowsHide: true },
    },
  ]);
});

test("a fresh verdict about the engine actually installed is NOT re-probed", () => {
  const disk = fakeDisk({
    files: {
      [ENV_PATH]: KEYLESS_ENV,
      [join(REPO, "engine-manifest.json")]: JSON.stringify({ source: { ref: "v4.9.1" } }),
      [join(REPO, ".cache", "engine-upstream.json")]: JSON.stringify({
        state: "current",
        installed: "v4.9.1",
        checkedAt: new Date(1_755_000_000_000 - 60_000).toISOString(),
      }),
    },
  });
  const h = harness({ disk });

  h.run();

  assert.deepEqual(h.spawned, [], "the network must never sit between the owner and their session");
});

// ─── Fail-soft: a session start is never blocked by a side channel ───────────

test("a corrupt settings.json never blocks the session start", () => {
  const disk = fakeDisk({
    files: {
      [ENV_PATH]: KEYLESS_ENV,
      [join(REPO, ".claude", "settings.json")]: "{ not json",
      [join(REPO, ".claude", "settings.json.template")]: JSON.stringify({ hooks: {} }),
    },
    dirs: { [VAULT]: [fileEntry("one.md")] },
  });
  const h = harness({ disk, readDocCount: () => 1 });

  h.run();

  assert.match(h.output().systemMessage, /🧠 RAG — 1\/1 files indexed\./);
});

test("a last-run state that recorded a REFUSED note explains the shortfall on the RAG line", () => {
  const disk = fakeDisk({
    files: {
      [ENV_PATH]: KEYLESS_ENV,
      [join(REPO, "rag", ".cache", "last-run.json")]: JSON.stringify({
        errors: [{ file: "vault/notes/broken.md", reason: "front-matter is not valid YAML" }],
      }),
    },
    dirs: { [VAULT]: [fileEntry("one.md"), fileEntry("two.md"), fileEntry("three.md")] },
  });
  const h = harness({ disk, readDocCount: () => 1 });

  h.run();

  // 3 on disk, 1 indexed, 1 explained → the other one is genuinely queued, and
  // both halves must share the line rather than silence each other.
  assert.match(h.output().systemMessage, /🧠 RAG: 1\/3 files indexed, 1 failed, 1 pending — /);
});

test("a corrupt last-run state degrades to a plain count, never to a throw", () => {
  const disk = fakeDisk({
    files: {
      [ENV_PATH]: KEYLESS_ENV,
      [join(REPO, "rag", ".cache", "last-run.json")]: "{{{",
    },
    dirs: { [VAULT]: [fileEntry("one.md"), fileEntry("two.md")] },
  });
  const h = harness({ disk, readDocCount: () => 2 });

  h.run();

  assert.match(h.output().systemMessage, /🧠 RAG — 2\/2 files indexed\./);
});

test("an unreadable doc count is reported as unknown, never as zero", () => {
  const disk = fakeDisk({
    files: { [ENV_PATH]: KEYLESS_ENV },
    dirs: { [VAULT]: [fileEntry("one.md")] },
  });
  const h = harness({ disk });

  h.run();

  assert.match(h.output().systemMessage, /🧠 RAG: status unavailable/);
  // The count is read from the vault's OWN database, once. A wrong path here reads
  // as "nothing indexed yet" forever, on a brain that is perfectly indexed.
  assert.deepEqual(h.dbAsked, [join(REPO, "rag", ".cache", "vault.db")]);
});

// ─── The real adapters: the thin layer between the seams and the OS ──────────
// Every test above hands `runSessionStatus` a double, so nothing above judges the
// real git runner or the real DB read. Those two are where the file's remaining
// logic lives, and they are the pieces a mutation pass finds naked first.

test("runGitInvocation — a successful call returns git's stdout and says so", () => {
  const asked = [];
  const out = runGitInvocation({ command: "git", args: ["remote"], options: { cwd: REPO } }, (...call) => {
    asked.push(call);
    return "origin\n";
  });

  assert.deepEqual(out, { out: "origin\n", ok: true });
  assert.deepEqual(asked, [["git", ["remote"], { cwd: REPO }]]);
});

test("runGitInvocation — a command that returns nothing yields '', never undefined", () => {
  // repoStatusLine calls .trim() on this; undefined would crash a session start.
  assert.deepEqual(runGitInvocation({ command: "git", args: [], options: {} }, () => undefined), {
    out: "",
    ok: true,
  });
});

test("runGitInvocation — a FAILED call is data: both streams, stdout first, ok false", () => {
  const boom = Object.assign(new Error("exit 1"), { stdout: "hint: on a branch\n", stderr: "fatal: no upstream\n" });

  assert.deepEqual(
    runGitInvocation({ command: "git", args: ["pull", "--rebase"], options: {} }, () => {
      throw boom;
    }),
    { out: "hint: on a branch\nfatal: no upstream\n", ok: false },
  );
});

test("runGitInvocation — a failure carrying neither stream still yields a string", () => {
  assert.deepEqual(
    runGitInvocation({ command: "git", args: [], options: {} }, () => {
      throw new Error("spawn ENOENT");
    }),
    { out: "", ok: false },
  );
});

test("readDocCountFrom — no database on disk is UNKNOWN (null), never zero", () => {
  let opened = false;
  const docs = readDocCountFrom(join(REPO, "rag", ".cache", "vault.db"), {
    existsSync: () => false,
    openDatabase: () => {
      opened = true;
    },
  });

  assert.equal(docs, null);
  assert.equal(opened, false, "a database that is not there must not be opened into existence");
});

test("readDocCountFrom — opens READ-ONLY and must-exist, asks the one query, and closes", () => {
  const calls = [];
  const docs = readDocCountFrom(join(REPO, "rag", ".cache", "vault.db"), {
    existsSync: () => true,
    openDatabase: (path, options) => {
      calls.push(["open", path, options]);
      return {
        prepare: (sql) => {
          calls.push(["prepare", sql]);
          return { get: () => ({ n: 41 }) };
        },
        close: () => calls.push(["close"]),
      };
    },
  });

  assert.equal(docs, 41);
  assert.deepEqual(calls, [
    ["open", join(REPO, "rag", ".cache", "vault.db"), { readonly: true, fileMustExist: true }],
    // The SQL spelled out, NOT quoted through the constant: asserting against
    // DOC_COUNT_SQL would mutate on both sides and pin nothing. This is the one
    // string here that has to match the indexer's real schema.
    ["prepare", "SELECT COUNT(*) AS n FROM documents"],
    ["close"],
  ]);
  assert.equal(DOC_COUNT_SQL, "SELECT COUNT(*) AS n FROM documents");
});

test("readDocCountFrom — a database being written degrades to unknown, it never throws", () => {
  assert.equal(
    readDocCountFrom(join(REPO, "rag", ".cache", "vault.db"), {
      existsSync: () => true,
      openDatabase: () => {
        throw new Error("SQLITE_BUSY: database is locked");
      },
    }),
    null,
  );
});

test("the real seam set is wired to the real world — repo, process and stdout", () => {
  // The default argument of runSessionStatus: if this object drifts, every test
  // above keeps passing while the CLI itself talks to nothing.
  assert.equal(realSessionStatusDeps.repo, dirname(realSessionStatusDeps.scriptsDir));
  assert.equal(realSessionStatusDeps.scriptsDir, dirname(CLI));
  assert.equal(realSessionStatusDeps.execPath, process.execPath);
  assert.equal(realSessionStatusDeps.platform, process.platform);
  assert.equal(realSessionStatusDeps.now, Date.now);
  for (const seam of ["git", "spawn", "existsSync", "readFileSync", "readDocCount", "deriveWanted", "write"]) {
    assert.equal(typeof realSessionStatusDeps[seam], "function", `${seam} must be wired`);
  }
});

test("the real `git` seam really runs git — the one call safe enough to prove it", () => {
  // `--version` touches no repository and changes nothing, so this can assert that
  // the wiring reaches a real process without the hook's own dangerous commands.
  const version = realSessionStatusDeps.git(["--version"]);

  assert.equal(version.ok, true, `git must be reachable — got: ${version.out}`);
  assert.match(version.out, /^git version /);
});

test("the real `readDocCount` seam answers UNKNOWN for a database that is not there", () => {
  // Reaches realOpenDatabase not at all (the existence check short-circuits), which
  // is the point: the wiring must return null rather than undefined or a throw.
  assert.equal(realSessionStatusDeps.readDocCount(join(dirname(CLI), "no-such-vault.db")), null);
});

test("the real `write` seam reaches stdout — the banner's only delivery", () => {
  const original = process.stdout.write;
  const seen = [];
  process.stdout.write = (chunk) => {
    seen.push(chunk);
    return true;
  };
  try {
    realSessionStatusDeps.write("banner\n");
  } finally {
    process.stdout.write = original;
  }

  assert.deepEqual(seen, ["banner\n"]);
});

// ─── The three child processes, asserted as VALUES (debt 2's shape) ──────────

test("buildGitInvocation — the whole read-only call, cwd and stdio included", () => {
  assert.deepEqual(buildGitInvocation(["status", "--porcelain"], REPO), {
    command: "git",
    args: ["status", "--porcelain"],
    options: { cwd: REPO, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: GIT_MAX_BUFFER },
  });
});

// F10 (v5.0.0 code review), found beside the finding's own two sites: this builder is a
// second, independent spelling of the same request — and the queries it carries are the
// ones that GROW with the vault. `git status --porcelain` on a brain whose notes are all
// dirty (a fresh clone, a restored backup, a bulk import) is one line per file; at ~40
// bytes a line, node's 1 MB default is reached around 25 000 notes. The banner would then
// report a git failure on a repository that is perfectly healthy — precisely when the
// owner has most files at stake.
test("the status hook's git ceiling is the same one the rest of the engine uses", () => {
  assert.equal(
    buildGitInvocation(["status", "--porcelain"], REPO).options.maxBuffer,
    GIT_MAX_BUFFER,
    "one ceiling, imported — two spellings of it would be two behaviours to keep in step forever",
  );
});

test("buildReconcileInvocation — sourceDir IS brainDir: a local converge, never a fetch", () => {
  assert.deepEqual(
    buildReconcileInvocation({
      execPath: join("/", "usr", "bin", "node"),
      reconcileCli: join(SCRIPTS_DIR, "lib", "reconcile-brain.mjs"),
      brainDir: REPO,
      platform: "win32",
    }),
    {
      command: join("/", "usr", "bin", "node"),
      args: [
        join(SCRIPTS_DIR, "lib", "reconcile-brain.mjs"),
        "--brainDir",
        REPO,
        "--sourceDir",
        REPO,
        "--platform",
        "win32",
      ],
      options: { detached: true, stdio: "ignore", windowsHide: true },
    },
  );
});

test("buildUpstreamProbeInvocation — detached, so the network never sits before the session", () => {
  assert.deepEqual(
    buildUpstreamProbeInvocation({
      execPath: join("/", "usr", "bin", "node"),
      probeCli: join(SCRIPTS_DIR, "upstream-check-run.mjs"),
      brainDir: REPO,
    }),
    {
      command: join("/", "usr", "bin", "node"),
      args: [join(SCRIPTS_DIR, "upstream-check-run.mjs"), "--brainDir", REPO],
      options: { detached: true, stdio: "ignore", windowsHide: true },
    },
  );
});

test("a settings drift spawns the reconcile ONCE, with the invocation asserted whole", () => {
  const disk = fakeDisk({
    files: {
      [ENV_PATH]: KEYLESS_ENV,
      [join(REPO, ".claude", "settings.json")]: JSON.stringify({ hooks: {} }),
      [join(REPO, ".claude", "settings.json.template")]: JSON.stringify({
        hooks: {
          SessionStart: [{ hooks: [{ type: "command", command: "node scripts/session-self-heal.mjs" }] }],
        },
      }),
      // A fresh verdict about the installed engine, so the upstream probe stays
      // silent and the ONLY child spawned here is the reconcile.
      [join(REPO, "engine-manifest.json")]: JSON.stringify({ source: { ref: "v4.9.1" } }),
      [join(REPO, ".cache", "engine-upstream.json")]: JSON.stringify({
        state: "current",
        installed: "v4.9.1",
        checkedAt: new Date(1_755_000_000_000 - 60_000).toISOString(),
      }),
    },
  });
  const h = harness({ disk, platform: "linux" });

  h.run();

  assert.deepEqual(h.spawned, [
    {
      command: join("/", "usr", "bin", "node"),
      args: [
        join(SCRIPTS_DIR, "lib", "reconcile-brain.mjs"),
        "--brainDir",
        REPO,
        "--sourceDir",
        REPO,
        "--platform",
        "linux",
      ],
      options: { detached: true, stdio: "ignore", windowsHide: true },
    },
  ]);
  // …and the reassurance it emits comes BEFORE the ordinary status, or the owner
  // watches an unexplained child process start on their machine.
  const message = h.output().systemMessage;
  const reassurance = message.indexOf(bootstrapReassuranceMessage());
  assert.notEqual(reassurance, -1, "a spawned reconcile must be announced");
  assert.ok(reassurance < message.indexOf("✅ Repo up to date"), "it leads the repo/RAG chatter");
});

test("a brain already converged on the template spawns NOTHING and says nothing", () => {
  const hooks = {
    SessionStart: [{ hooks: [{ type: "command", command: "node scripts/session-self-heal.mjs" }] }],
  };
  const disk = fakeDisk({
    files: {
      [ENV_PATH]: KEYLESS_ENV,
      [join(REPO, ".claude", "settings.json")]: JSON.stringify({ hooks }),
      [join(REPO, ".claude", "settings.json.template")]: JSON.stringify({ hooks }),
      [join(REPO, "engine-manifest.json")]: JSON.stringify({ source: { ref: "v4.9.1" } }),
      [join(REPO, ".cache", "engine-upstream.json")]: JSON.stringify({
        state: "current",
        installed: "v4.9.1",
        checkedAt: new Date(1_755_000_000_000 - 60_000).toISOString(),
      }),
    },
  });
  const h = harness({ disk });

  h.run();

  assert.deepEqual(h.spawned, [], "a converged brain must be a no-op, every single session start");
  assert.equal(h.output().systemMessage.includes(bootstrapReassuranceMessage()), false);
});

test("a manifest with no `source` at all still triggers the upstream probe", () => {
  // The cached verdict is fresh, so only the UNKNOWN installed ref can ask for a
  // re-probe — which is what a manifest missing its whole `source` block means.
  const disk = fakeDisk({
    files: {
      [ENV_PATH]: KEYLESS_ENV,
      [join(REPO, "engine-manifest.json")]: JSON.stringify({ engineVersion: { rag: "1.3.0" } }),
      [join(REPO, ".cache", "engine-upstream.json")]: JSON.stringify({
        state: "current",
        installed: "v4.9.1",
        checkedAt: new Date(1_755_000_000_000 - 60_000).toISOString(),
      }),
    },
  });
  const h = harness({ disk });

  h.run();

  assert.deepEqual(h.spawned.map((s) => s.args[1]), ["--brainDir"]);
});

// ─── countMarkdown — the vault scan, recursive and fail-soft ─────────────────

test("countMarkdown — recurses, counts .md in any case, and ignores everything else", () => {
  const disk = fakeDisk({
    dirs: {
      [VAULT]: [fileEntry("b.md"), dirEntry("sub"), fileEntry("notes.txt"), fileEntry("A.MD")],
      [join(VAULT, "sub")]: [fileEntry("deep.md"), dirEntry("deeper"), fileEntry("image.png")],
      [join(VAULT, "sub", "deeper")]: [fileEntry("last.md")],
    },
  });

  assert.equal(countMarkdown(VAULT, disk.readdirSync), 4);
});

test("countMarkdown — an unreadable directory counts as zero, it does not throw", () => {
  const disk = fakeDisk({ dirs: { [VAULT]: [dirEntry("locked"), fileEntry("kept.md")] } });

  assert.equal(countMarkdown(VAULT, disk.readdirSync), 1);
  assert.equal(countMarkdown(join(VAULT, "nowhere"), disk.readdirSync), 0);
});

// ─── The entry-point seam — debt 1 of the v4.8.0 mutation pass ───────────────

test("the CLI, IMPORTED rather than run — the body must not fire on import", () => {
  // THE test this whole conversion exists for. Before the move, importing this
  // module ran the SessionStart hook in full: it swept and auto-committed the
  // importer's working tree, pulled, wrote markers, spawned a detached child and
  // printed the banner. That is why it could never be seen red here, and why the
  // red was taken in a disposable worktree instead.
  const probe = `import("${pathToFileURL(CLI).href}").then(() => { console.log("|imported-and-still-alive"); });`;
  const run = spawnSync(process.execPath, ["--input-type=module", "-e", probe], { encoding: "utf8" });

  assert.equal(run.status, 0, `importing the hook must not run it — stderr: ${run.stderr}`);
  // Nothing may precede the marker: the banner written at import would land here.
  assert.equal(run.stdout.trim(), "|imported-and-still-alive");
});
