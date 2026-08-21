import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { sessionEngineDivergence } from "./session-engine-divergence.mjs";

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
  const calls = { emitted: [], divergenceFrom: [], refFrom: [] };
  const base = {
    brainDir: "/brain",
    readDivergence: (dir) => (calls.divergenceFrom.push(dir), held),
    readRef: (dir) => (calls.refFrom.push(dir), "v5.0.0"),
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
