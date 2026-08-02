import { test } from "node:test";
import assert from "node:assert/strict";
import { isEngineStatusLine, withoutEngineStatusLine } from "./status-line-retreat.mjs";

test("the line the engine installed is ours to remove", () => {
  assert.equal(
    isEngineStatusLine('"/usr/local/bin/node" "/Users/ana/brain/scripts/status-line.mjs"'),
    true,
  );
});

test("a Windows brain's line is ours too, backslashes and cmd wrapper included", () => {
  // The shape a pre-fix win32 installer baked (issue #31): same script, unreadable path.
  assert.equal(
    isEngineStatusLine(
      'cmd /c "C:\\Users\\ana\\brain\\scripts\\run-node.cmd" "C:/Users/ana/brain/scripts/status-line.mjs"',
    ),
    true,
  );
});

test("a line the OWNER wrote is theirs, and is left alone", () => {
  // The whole point of the retreat: give them back the line they configured.
  assert.equal(isEngineStatusLine("~/.config/starship/statusline.sh"), false);
  assert.equal(isEngineStatusLine('node "/Users/ana/dotfiles/my-status.mjs"'), false);
});

test("a missing or malformed command is not ours — when unsure, keep it", () => {
  assert.equal(isEngineStatusLine(undefined), false);
  assert.equal(isEngineStatusLine(""), false);
});

test("removing ours drops the key entirely, leaving every other setting untouched", () => {
  const settings = {
    permissions: { allow: ["Bash(git status:*)"] },
    statusLine: { type: "command", command: '"/bin/node" "/b/scripts/status-line.mjs"', padding: 0 },
    hooks: { Stop: [] },
  };

  const { settings: next, removed } = withoutEngineStatusLine(settings);

  assert.equal(removed, true);
  assert.deepEqual(next, { permissions: { allow: ["Bash(git status:*)"] }, hooks: { Stop: [] } });
  // The input is never mutated: the caller decides whether to write.
  assert.equal("statusLine" in settings, true);
});

test("a hand-customized line survives, and the settings come back UNCHANGED", () => {
  const settings = { statusLine: { type: "command", command: "starship prompt" } };
  const { settings: next, removed } = withoutEngineStatusLine(settings);
  assert.equal(removed, false);
  assert.deepEqual(next, settings);
});

test("a brain with no status line at all is left byte-identical", () => {
  // The converged-brain guarantee: no write, so no auto-commit churn.
  const settings = { hooks: {} };
  const { settings: next, removed } = withoutEngineStatusLine(settings);
  assert.equal(removed, false);
  assert.equal(next, settings);
});
