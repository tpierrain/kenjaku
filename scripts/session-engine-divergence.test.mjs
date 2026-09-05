import { test } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, cpSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { runSessionEngineDivergence, sessionEngineDivergence } from "./session-engine-divergence.mjs";
import { fingerprint } from "./lib/engine-source.mjs";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// S4-4a — the SessionStart core that says where the brain stands at REST.
//
// Same shape as every other session hook (session-wiki-health.mjs is the reference):
// seams injected, so the brain root is a plain string a test asserts on and never a temp
// dir, and `main` stays deterministic glue that is not unit-tested.
//
// Fail-open is the contract: a hook that throws costs the owner their session start, and
// this one reads a manifest and walks a tree — both of which can be missing on a brain
// that is mid-install or mid-sync.

const held = [{ rel: "CLAUDE.md", reason: "customized", since: "v4.7.0" }];

function seams(overrides = {}) {
  const calls = { emitted: [], divergenceFrom: [], refFrom: [], answersFrom: [] };
  const base = {
    brainDir: "/brain",
    readDivergence: (dir) => (calls.divergenceFrom.push(dir), held),
    readRef: (dir) => (calls.refFrom.push(dir), "v5.0.0"),
    readAnswers: (dir) => (calls.answersFrom.push(dir), {}),
    emit: (msg) => calls.emitted.push(msg),
  };
  return { args: { ...base, ...overrides }, calls };
}

test("sessionEngineDivergence — nothing held back → emits nothing", () => {
  const { args, calls } = seams({ readDivergence: () => [] });
  assert.deepEqual(sessionEngineDivergence(args), { reported: false });
  assert.deepEqual(calls.emitted, []);
});

test("sessionEngineDivergence — nothing held back → does not even read the version", () => {
  // The common case must cost one read, not two: the ref is only ever needed to
  // phrase a sentence there is no reason to say.
  const { args, calls } = seams({ readDivergence: () => [] });
  sessionEngineDivergence(args);
  assert.deepEqual(calls.refFrom, []);
});

test("sessionEngineDivergence — a held-back file → emits the whole nudge", () => {
  const { args, calls } = seams();
  assert.deepEqual(sessionEngineDivergence(args), { reported: true });
  assert.deepEqual(calls.emitted, [
    "⚙️ This brain runs v5.0.0, and the engine is leaving 1 file alone — CLAUDE.md" +
      " (yours; the engine last delivered here at v4.7.0)." +
      " Nothing to do: a file the engine leaves alone is a choice, not a problem.",
  ]);
});

test("sessionEngineDivergence — both reads are asked about the GIVEN brainDir", () => {
  const { args, calls } = seams({ brainDir: "/somewhere/else" });
  sessionEngineDivergence(args);
  assert.deepEqual(calls.divergenceFrom, ["/somewhere/else"]);
  assert.deepEqual(calls.refFrom, ["/somewhere/else"]);
});

test("sessionEngineDivergence — fail-open: a throwing divergence read never propagates", () => {
  const { args, calls } = seams({
    readDivergence: () => {
      // `readEngineDivergence` is fail-soft about the MANIFEST only; its installed-files
      // read sits outside that try, so a brainDir that does not exist throws out of it.
      throw new Error("ENOENT: no such file or directory");
    },
  });
  assert.deepEqual(sessionEngineDivergence(args), { reported: false });
  assert.deepEqual(calls.emitted, []);
});

test("sessionEngineDivergence — fail-open: a throwing version read never propagates either", () => {
  const { args, calls } = seams({
    readRef: () => {
      throw new Error("manifest unreadable");
    },
  });
  assert.deepEqual(sessionEngineDivergence(args), { reported: false });
  assert.deepEqual(calls.emitted, []);
});

// ── S10-3: the answers reach the surface that must subtract them ────────────────
//
// 🛑 THIS IS THE FORGETTABLE HALF. `engineDivergenceNudge` defaults `answers` to "nothing
// answered", which is right for the fleet and silent for a caller that never reads the
// file — the nudge would go on raising a settled file forever and no test would notice.
// So the wiring is pinned HERE, where it lives: the seam is called, with the brain's own
// directory, and its result reaches the sentence.

test("sessionEngineDivergence — the answers file is READ, and asked about the given brainDir", () => {
  const { args, calls } = seams({ brainDir: "/somewhere/else" });
  sessionEngineDivergence(args);
  assert.deepEqual(calls.answersFrom, ["/somewhere/else"]);
});

test("sessionEngineDivergence — an answered file is subtracted before a word is emitted", () => {
  const { args, calls } = seams({
    readAnswers: () => ({ "CLAUDE.md": { decision: "keep-mine", at: "v5.0.0" } }),
  });

  assert.deepEqual(sessionEngineDivergence(args), { reported: false });
  assert.deepEqual(calls.emitted, [], "the one held-back file was settled at this very ref");
});

test("sessionEngineDivergence — fail-open: a throwing answers read never propagates", () => {
  // `.engine-answers.json` is brain-side and travels through git, so it can arrive
  // half-written from another machine. A session start is never the casualty.
  const { args, calls } = seams({
    readAnswers: () => {
      throw new Error("EACCES: permission denied");
    },
  });
  assert.deepEqual(sessionEngineDivergence(args), { reported: false });
  assert.deepEqual(calls.emitted, []);
});

// ── S4-4b: the surface reaches a brain ──────────────────────────────────────────

test("settings.json.template wires session-engine-divergence as a SessionStart hook, LAST", () => {
  const settings = JSON.parse(readFileSync(join(REPO_ROOT, ".claude", "settings.json.template"), "utf8"));
  const commands = settings.hooks.SessionStart.flatMap((entry) => entry.hooks.map((h) => h.command));
  const mine = commands.findIndex((c) => c.includes("session-engine-divergence.mjs"));

  assert.ok(mine >= 0, "session-engine-divergence.mjs must be wired on SessionStart");
  // Last on purpose: this is the calmest thing a session start says. Breakage
  // (`session-health`), a pending restart (`session-self-heal`) and the version /
  // update line (`session-status`) all outrank a file the owner chose to keep.
  assert.equal(mine, commands.length - 1, "the standing fact goes after everything that is actionable");
});

test("the hook script is CARRIED by the manifest, or an upgrade never refreshes what the brain runs", () => {
  // The general guard in engine-manifest-integrity.test.mjs says "some regime"; this
  // one pins WHICH. `replace` is the only correct answer for a hook: `merge` would
  // offer it as a diff and a brain that ever touched it would keep its own copy
  // forever. Session hooks are listed one by one there — no `scripts/session-*.mjs`
  // glob exists — so a new one is an explicit line or it is nothing.
  const manifest = JSON.parse(readFileSync(join(REPO_ROOT, "engine-manifest.json"), "utf8"));
  assert.ok(
    (manifest.regimes.replace ?? []).includes("scripts/session-engine-divergence.mjs"),
    "add scripts/session-engine-divergence.mjs to the manifest's `replace` regime",
  );
});

// 🚨 S5 (second pass of the v5.0.0 review) — THE STANDING SURFACE IS THE ONE THAT MUST
// SURVIVE ONE BAD FILE.
//
// F7 made the update's own recap fail-soft and pointed HERE for the line it dropped: "a
// standing surface, re-read at every session start, so a line omitted once comes back on
// its own". This hook swallowed the identical failure, so it did not. One unreadable merge
// file — a bad umask, a locked file, a sync client's placeholder — blanked BOTH.
//
// Driven through the real composition root on a real directory, deliberately: the seams
// above are injected, so the defect lived in exactly the one line no unit test looked at.
test("runSessionEngineDivergence — one unreadable merge file no longer silences the whole surface", (t) => {
  if (process.platform === "win32" || process.getuid?.() === 0) {
    t.skip("needs POSIX permissions and a non-root user to make a file unreadable");
    return;
  }
  const delivered = "---\nname: coach\n---\nas the engine wrote it\n";
  const dir = mkdtempSync(join(tmpdir(), "sbg-session-divergence-"));
  t.after(() => {
    chmodSync(join(dir, ".claude", "settings.json"), 0o644);
    rmSync(dir, { recursive: true, force: true });
  });
  const write = (rel, body) => {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), body);
  };
  write(".claude/skills/coach/SKILL.md", delivered + "and the owner's own paragraph\n");
  write(".claude/settings.json", "{}\n");
  write(
    "engine-manifest.json",
    JSON.stringify({
      manifestVersion: 1,
      regimes: { replace: ["rag/src/**"], merge: [".claude/skills/**", ".claude/settings.json"] },
      source: { repo: "https://example.test/launcher.git", ref: "v5.0.0" },
      provenance: { ".claude/skills/coach/SKILL.md": fingerprint(delivered) },
      baseRefs: { ".claude/skills/coach/SKILL.md": "v4.7.0" },
    }) + "\n",
  );
  chmodSync(join(dir, ".claude", "settings.json"), 0o000);

  const written = [];
  const realWrite = process.stdout.write;
  process.stdout.write = (chunk) => (written.push(String(chunk)), true);
  try {
    runSessionEngineDivergence({ brainDir: dir });
  } finally {
    process.stdout.write = realWrite;
  }

  assert.equal(written.length, 1, "the file it COULD read is still spoken about");
  assert.match(written[0], /\.claude\/skills\/coach\/SKILL\.md/);
});

// ── T11 (third review pass): this hook read state the startup pull was writing ─
// SessionStart hooks run in PARALLEL and the pull lives in `session-status.mjs`. This
// one reads the manifest, every merge file and `.engine-base/` — all tracked, all
// rewritten by a pull — and it took no barrier at all. `session-universe.mjs` was then
// the only non-test caller of `waitForStartupSync`; its wait was removed on 2026-09-05
// (ADR 0028, the owner's call), so this hook is now the last one that waits at all. A manifest caught mid-write parses as
// nothing and the hook goes silent: the one surface whose whole job is to speak about a
// freeze at REST is also the one that says nothing when the read comes at a bad moment.
//
// Proven by ORDER, not by timing: the injected barrier IS the pull. If the hook reads
// before waiting it sees the pre-pull state and has nothing to say — which is the defect,
// and it is what this asserted before the fix. No sleeping, nothing to go flaky.
function divergentManifest(delivered) {
  return (
    JSON.stringify({
      manifestVersion: 1,
      regimes: { replace: ["rag/src/**"], merge: [".claude/skills/**"] },
      source: { repo: "https://example.test/launcher.git", ref: "v5.0.0" },
      provenance: { ".claude/skills/coach/SKILL.md": fingerprint(delivered) },
      baseRefs: { ".claude/skills/coach/SKILL.md": "v4.7.0" },
    }) + "\n"
  );
}

function brainMidPull(t) {
  const delivered = "---\nname: coach\n---\nas the engine wrote it\n";
  const dir = mkdtempSync(join(tmpdir(), "sbg-divergence-race-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const write = (rel, body) => {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), body);
  };
  write(".claude/skills/coach/SKILL.md", delivered + "and the owner's own paragraph\n");
  // What is on disk BEFORE the pull lands: a manifest that declares no merge family at
  // all, so nothing is held back and the hook has nothing to say.
  write("engine-manifest.json", JSON.stringify({ manifestVersion: 1, regimes: {}, provenance: {} }) + "\n");
  return { dir, landThePull: () => write("engine-manifest.json", divergentManifest(delivered)) };
}

function captureStdout(run) {
  const written = [];
  const realWrite = process.stdout.write;
  process.stdout.write = (chunk) => (written.push(String(chunk)), true);
  try {
    run();
  } finally {
    process.stdout.write = realWrite;
  }
  return written;
}

test("runSessionEngineDivergence — waits for the startup pull, and speaks about the state that ARRIVED (T11)", (t) => {
  const { dir, landThePull } = brainMidPull(t);

  const written = captureStdout(() =>
    runSessionEngineDivergence({ brainDir: dir, awaitSync: () => landThePull() }),
  );

  assert.equal(written.length, 1, "reading before the barrier sees the pre-pull manifest and says nothing");
  assert.match(written[0], /\.claude\/skills\/coach\/SKILL\.md/);
});

test("runSessionEngineDivergence — hands the barrier the brain root, and an io that can read the marker (T11)", (t) => {
  // The barrier's answer depends entirely on WHICH repo it is pointed at and whether it
  // can read a file. A call wired with the wrong root, or with an io missing a method,
  // returns a fail-open verdict for the wrong brain and looks exactly like success.
  const { dir, landThePull } = brainMidPull(t);
  const seen = [];

  captureStdout(() =>
    runSessionEngineDivergence({
      brainDir: dir,
      awaitSync: (args) => (seen.push(args), landThePull()),
    }),
  );

  assert.equal(seen.length, 1, "the barrier is consulted exactly once");
  assert.equal(seen[0].repo, dir);
  assert.equal(typeof seen[0].io.existsSync, "function");
  assert.equal(typeof seen[0].io.readFileSync, "function");
});

test("runSessionEngineDivergence — a barrier that gives up is NOT a gate on speaking (T11)", (t) => {
  // Every non-`done` verdict — no puller wired, no session id, a pull that never lands —
  // means "read what is on disk anyway". A hook that stayed silent on a timeout would
  // have turned a race into a permanent silence for every brain without the puller.
  const { dir, landThePull } = brainMidPull(t);
  landThePull(); // the state is already on disk; the barrier simply gives up

  const written = captureStdout(() =>
    runSessionEngineDivergence({ brainDir: dir, awaitSync: () => ({ status: "timeout", waitedMs: 12_000 }) }),
  );

  assert.equal(written.length, 1);
  assert.match(written[0], /\.claude\/skills\/coach\/SKILL\.md/);
});

// The fail-open half of T11 is asserted on `awaitStartupSync` itself, in
// `lib/startup-sync-gate.test.mjs`, and deliberately not here: the barrier is now the
// FIRST thing this hook does, ahead of its own try/catch, so the guarantee has to be a
// property of what SHIPS rather than of a throwing double a test injects. Asserting it
// through the seam would have proved the double.

// ── The entry point, RUN AS A PROCESS — T7's lesson aimed at a DEFAULT ───────
// A mutant replaced this hook's own `brainDir` default, `".."`, with `""` and every
// test above stayed green: each one hands in its own brainDir, so not one of them ever
// ran the resolution that SHIPS. With `""` the hook would look for a brain inside
// `scripts/`, find no manifest, and be silent on every real brain forever — the same
// silence T11 is about, arriving by the other door.
//
// So it is spawned with no arguments at all, exactly as the harness spawns it, and the
// only thing that can make it speak is resolving its own root correctly.
test("session-engine-divergence, as a PROCESS with no arguments, resolves its OWN brain root", async (t) => {
  // realpath: on macOS the temp dir is a symlink, and `runAsEntrypoint` compares the
  // path as typed against the path Node realpath-resolved.
  const brain = realpathSync(mkdtempSync(join(tmpdir(), "kenjaku-divergence-entry-")));
  t.after(() => rmSync(brain, { recursive: true, force: true }));
  cpSync(join(REPO_ROOT, "scripts"), join(brain, "scripts"), { recursive: true });
  const delivered = "---\nname: coach\n---\nas the engine wrote it\n";
  mkdirSync(join(brain, ".claude", "skills", "coach"), { recursive: true });
  writeFileSync(join(brain, ".claude/skills/coach/SKILL.md"), delivered + "and the owner's own paragraph\n");
  writeFileSync(join(brain, "engine-manifest.json"), divergentManifest(delivered));

  const child = spawn(process.execPath, [join(brain, "scripts", "session-engine-divergence.mjs")], {
    stdio: ["pipe", "pipe", "pipe"],
  });
  // No puller is wired in this fixture, so the barrier returns at once. Feeding stdin is
  // still mandatory: the hook reads fd 0, and an open pipe would hang it forever.
  child.stdin.end(JSON.stringify({ session_id: "s-entry", source: "startup" }));
  let stdout = "";
  child.stdout.on("data", (chunk) => (stdout += chunk));
  const code = await new Promise((resolve) => child.on("close", resolve));

  assert.equal(code, 0, "fail-open: the hook always exits 0");
  assert.match(stdout, /\.claude\/skills\/coach\/SKILL\.md/, "it found the manifest one level ABOVE scripts/");
});
