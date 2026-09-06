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

// ── 9.6 — NOTHING IN A SESSION START WAITS ON THE NETWORK ANY MORE ───────────
// This hook was the LAST caller of the startup barrier: up to 3 s for the puller to
// appear, then up to 12 s for the pull to land, on the critical path of every session
// start. T11 had added it for a real reason (SessionStart hooks run in PARALLEL, the
// pull rewrites the manifest and `.engine-base/`, and a torn read makes this surface go
// quiet). The owner weighed the two on 2026-09-06, while the release was being cut, and
// stopped the cut to answer: *"on ne cut pas tant que le démarrage est ralenti ou
// bloqué"*, then *"on enlève cette attente qui pénalise tout le monde pour quelques rares
// cas"*. ADR 0028 says the same thing in writing.
//
// So the hook reads what is on disk AT ONCE, exactly as `session-universe.mjs` has since
// 9.4bis, and the cost is accepted rather than argued with: the standing fact it speaks
// can be one session out of date. Delayed, never lost — and unlike the universe pointer,
// which is USED by every search of the session, this surface's own contract is "a
// standing fact, not an alert … mention it only if they ask", so no correction is pushed
// in front of the owner's next prompt.
//
// The three T11 tests that pinned the wait are DELETED, not skipped: they asserted a
// behaviour we no longer want, and a skipped test is a claim nobody checks. What replaces
// them is their opposite, through both doors, and measured on the CLOCK — the only thing
// a re-introduced wait cannot fake.
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

/**
 * A brain in the exact state the wait existed for: a puller wired in its own settings,
 * this session's marker saying the pull is RUNNING and never flipped to `done`, and a
 * real divergence already on disk. Under the old barrier this is the fixture that waited
 * the full ceiling; under the new one it is the fixture that must answer at once.
 */
function brainMidPull(t, label) {
  // realpath: on macOS the temp dir is a symlink, and the hook only runs its main block
  // when argv[1] matches its own resolved module path.
  const brain = realpathSync(mkdtempSync(join(tmpdir(), `kenjaku-divergence-${label}-`)));
  t.after(() => rmSync(brain, { recursive: true, force: true }));
  cpSync(join(REPO_ROOT, "scripts"), join(brain, "scripts"), { recursive: true });
  const delivered = "---\nname: coach\n---\nas the engine wrote it\n";
  mkdirSync(join(brain, ".claude", "skills", "coach"), { recursive: true });
  writeFileSync(join(brain, ".claude/skills/coach/SKILL.md"), delivered + "and the owner's own paragraph\n");
  writeFileSync(join(brain, "engine-manifest.json"), divergentManifest(delivered));
  mkdirSync(join(brain, ".cache"), { recursive: true });
  writeFileSync(
    join(brain, ".claude", "settings.json"),
    JSON.stringify({
      hooks: { SessionStart: [{ hooks: [{ command: `node "${brain}/scripts/session-status.mjs"` }] }] },
    }),
  );
  writeFileSync(
    join(brain, ".cache", "startup-sync.json"),
    JSON.stringify({ sessionId: "s-nowait", phase: "running", at: Date.now() }),
  );
  return brain;
}

/** Runs the hook the way the harness does, and TIMES it. `payload` null → stdin is never written. */
async function runDivergenceHook(t, brain, payload) {
  const startedAt = Date.now();
  const child = spawn(process.execPath, [join(brain, "scripts", "session-engine-divergence.mjs")], {
    stdio: ["pipe", "pipe", "pipe"],
  });
  if (payload !== null) child.stdin.end(payload);
  // Never a wait without a way out (2026-09-05: four spinners with no deadline held a
  // laptop at 100 % for nine hours). The kill turns a hook that DOES wait into a failure
  // here, instead of a suite that hangs until the runner's own timeout.
  const deadline = setTimeout(() => child.kill("SIGKILL"), 8_000);
  t.after(() => {
    clearTimeout(deadline);
    child.kill("SIGKILL");
  });
  let stdout = "";
  child.stdout.on("data", (chunk) => (stdout += chunk));
  const code = await new Promise((resolve) => child.on("close", resolve));
  return { code, stdout, elapsed: Date.now() - startedAt };
}

// The old barrier's SHORTEST branch was a 3 s grace and its ceiling 12 s, so a hook that
// still waits cannot pass this — while a cold `node` start is well under it.
const PROMPTLY_MS = 2_000;

test("the divergence hook does not wait for the pull it is HANDED the key to: it speaks from disk", async (t) => {
  const brain = brainMidPull(t, "nowait");

  const { code, stdout, elapsed } = await runDivergenceHook(
    t,
    brain,
    JSON.stringify({ session_id: "s-nowait", source: "startup" }),
  );

  assert.equal(code, 0, "the hook is fail-open: it always exits 0");
  assert.ok(elapsed < PROMPTLY_MS, `the session start waited ${elapsed} ms on a pull it must not wait for`);
  assert.match(stdout, /\.claude\/skills\/coach\/SKILL\.md/, "what is on disk is what gets spoken about");
});

// The same claim through the other door, and the one that would catch a "repair" of the
// stdin race: fd 0 is a pipe nobody ever writes to, which a BLOCKING read waits on for a
// close that may never come (measured 2026-09-05: it took this suite from ~50 s to over
// 10 minutes, and in the field it is a hung session start). Unlike the test above, this
// one already passed before the removal — the barrier opened on a missing session id.
// It is kept because what it guards against is the FUTURE repair, not the past defect.
test("…and it does not wait on its own stdin either, when the harness writes nothing", async (t) => {
  const brain = brainMidPull(t, "nostdin");

  const { code, stdout, elapsed } = await runDivergenceHook(t, brain, null);

  assert.equal(code, 0);
  assert.ok(elapsed < PROMPTLY_MS, `the session start hung ${elapsed} ms on a stdin nobody wrote`);
  assert.match(stdout, /\.claude\/skills\/coach\/SKILL\.md/);
});

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
  // Handed over the way the harness does. Since 9.6 the hook does not read fd 0 at all —
  // the test above is the one that holds that line — so this is fidelity, not a lifeline.
  child.stdin.end(JSON.stringify({ session_id: "s-entry", source: "startup" }));
  let stdout = "";
  child.stdout.on("data", (chunk) => (stdout += chunk));
  const code = await new Promise((resolve) => child.on("close", resolve));

  assert.equal(code, 0, "fail-open: the hook always exits 0");
  assert.match(stdout, /\.claude\/skills\/coach\/SKILL\.md/, "it found the manifest one level ABOVE scripts/");
});
