import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";

import { CONVERSATION_READS_DIR_REL } from "./conversation-reads.mjs";

// Issue #130 — the SessionStart entry point of the recorder. Its behaviour lives in
// conversation-reads.mjs (tested there); what is judged here is the entry point itself,
// run as the host runs it: a process, on real stdin, from a copy of scripts/.

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));

test("run as a process on a fresh window: an empty record, in silence, exit 0", () => {
  const brain = realpathSync(mkdtempSync(join(tmpdir(), "kenjaku-session-reads-")));
  try {
    cpSync(SCRIPTS_DIR, join(brain, "scripts"), { recursive: true });
    const run = spawnSync(process.execPath, [join(brain, "scripts", "session-reads.mjs")], {
      input: JSON.stringify({ session_id: "s-new", hook_event_name: "SessionStart", source: "startup" }),
      encoding: "utf8",
    });
    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.stdout, "", "a SessionStart hook's stdout lands in the conversation");
    assert.deepEqual(readdirSync(join(brain, CONVERSATION_READS_DIR_REL)), ["s-new"]);
    assert.equal(readFileSync(join(brain, CONVERSATION_READS_DIR_REL, "s-new"), "utf8"), "");
  } finally {
    rmSync(brain, { recursive: true, force: true });
  }
});

test("imported rather than run, it fires nothing", () => {
  const probe = `import("${pathToFileURL(join(SCRIPTS_DIR, "session-reads.mjs")).href}").then(() => console.log("imported-and-still-alive"));`;
  const run = spawnSync(process.execPath, ["--input-type=module", "-e", probe], { encoding: "utf8", input: "" });
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.stdout.trim(), "imported-and-still-alive");
});
