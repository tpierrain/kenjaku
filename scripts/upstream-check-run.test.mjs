import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { resolveBrainDir, runUpstreamCheck } from "./upstream-check-run.mjs";

const CLI = join(dirname(fileURLToPath(import.meta.url)), "upstream-check-run.mjs");

// ═══════════════════════════════════════════════════════════════════════════
// upstream-check-run — the detached upstream child (ADR 0028). Its whole body
// used to live inside the entry guard, which is why it scored 0 % at v4.8.0 and
// is named as debt 1 in v4.9.0-mutation-debt-plan.md. The body is an ordinary
// function now; these are the tests that were impossible before.
// ═══════════════════════════════════════════════════════════════════════════

test("resolveBrainDir — the --brainDir flag wins over the fallback", () => {
  assert.equal(
    resolveBrainDir(["--brainDir", "/Users/dev/acme-brain"], "/fallback"),
    "/Users/dev/acme-brain",
  );
});

test("resolveBrainDir — the flag is found wherever it sits in the argument list", () => {
  assert.equal(resolveBrainDir(["--quiet", "--brainDir", "/b", "--force"], "/fallback"), "/b");
});

test("resolveBrainDir — no flag at all falls back to the script's own brain", () => {
  assert.equal(resolveBrainDir([], "/fallback"), "/fallback");
  assert.equal(resolveBrainDir(["--quiet"], "/fallback"), "/fallback");
});

test("resolveBrainDir — a trailing --brainDir with no value falls back, it does not probe undefined", () => {
  // `node upstream-check-run.mjs --brainDir` is a real typo, and probing
  // `undefined` would write the verdict cache to a garbage path.
  assert.equal(resolveBrainDir(["--brainDir"], "/fallback"), "/fallback");
  assert.equal(resolveBrainDir(["--brainDir", ""], "/fallback"), "/fallback");
});

test("runUpstreamCheck — probes the brain named on the command line, and exits 0", async () => {
  const probed = [];
  const code = await runUpstreamCheck(["--brainDir", "/Users/dev/acme-brain"], {
    probe: (arg) => probed.push(arg),
    defaultBrainDir: () => "/never-used",
  });

  assert.deepEqual(probed, [{ brainDir: "/Users/dev/acme-brain" }]);
  assert.equal(code, 0);
});

test("runUpstreamCheck — with no flag, it probes the script's own brain folder", async () => {
  const probed = [];
  const code = await runUpstreamCheck([], {
    probe: (arg) => probed.push(arg),
    defaultBrainDir: () => "/Users/dev/here-is-the-brain",
  });

  assert.deepEqual(probed, [{ brainDir: "/Users/dev/here-is-the-brain" }]);
  assert.equal(code, 0);
});

test("runUpstreamCheck — it AWAITS the probe before reporting success", async () => {
  // The whole point of this child is to leave a verdict on disk for the NEXT
  // session start. Returning before the probe settles would let the process exit
  // mid-write, and the cache would stay stale forever.
  const events = [];
  const code = await runUpstreamCheck([], {
    probe: async () => {
      await Promise.resolve();
      events.push("probe-finished");
    },
    defaultBrainDir: () => "/b",
  });

  assert.deepEqual(events, ["probe-finished"]);
  assert.equal(code, 0);
});

test("the CLI, IMPORTED rather than run — the body must not fire on import", () => {
  const probe = `import("${pathToFileURL(CLI).href}").then(() => { console.log("imported-and-still-alive"); });`;
  const run = spawnSync(process.execPath, ["--input-type=module", "-e", probe], { encoding: "utf8" });

  assert.equal(run.status, 0, `importing the CLI must not probe or exit — stderr: ${run.stderr}`);
  assert.equal(run.stdout.trim(), "imported-and-still-alive");
});
