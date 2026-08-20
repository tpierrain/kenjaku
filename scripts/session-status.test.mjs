import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { countMarkdown, runSessionStatus } from "./session-status.mjs";
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
function fakeDisk({ files = {}, dirs = {} } = {}) {
  const written = [];
  return {
    files,
    written,
    existsSync: (p) => p in files || p in dirs,
    readFileSync: (p) => {
      if (!(p in files)) throw new Error(`ENOENT: ${p}`);
      return files[p];
    },
    writeFileSync: (p, body) => {
      files[p] = body;
      written.push({ path: p, body });
    },
    mkdirSync: () => {},
    readdirSync: (p) => {
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
    readDocCount: () => null,
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

  assert.match(h.output().systemMessage, /Your brain needs its Gemini key before it can search your notes/);
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
  const h = harness({ disk, readDocCount: () => null });

  h.run();

  assert.match(h.output().systemMessage, /🧠 RAG: status unavailable/);
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
