import { test } from "node:test";
import assert from "node:assert/strict";

import { runGuard } from "./vault-write-guard.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// The WIRING half of F11/F12. `scripts/lib/vault-write-guard.mjs` already decides
// (and is tested against the engine's real parser, on the real field payload); this
// file is the entry script Claude Code actually runs as a `PreToolUse(Write|Edit)`
// hook. Its whole job is the contract with the harness: read the hook JSON on stdin,
// ask for the decision, and speak the ONE dialect the harness acts on
// (`hookSpecificOutput.permissionDecision`). A decision nobody reads blocks nothing.
// ═══════════════════════════════════════════════════════════════════════════

// A parser stub that refuses with a message no real YAML error would carry, so the
// deny reason proves the INJECTED parser was the one consulted — a stub throwing a
// plausible "bad indentation" would be indistinguishable from the guard inventing one.
const refusingParser = () => () => {
  throw new Error("stub parser refused (7:42)");
};

const hookInput = ({ tool = "Write", path = "/brain/vault/inqom/briefings/2026-08-02.md", content = "---\nsummary: Réunion: bilan\n---\n" } = {}) =>
  JSON.stringify({ tool_name: tool, tool_input: { file_path: path, content } });

const captured = (overrides = {}) => {
  const emitted = [];
  const code = runGuard({
    readInput: () => hookInput(),
    readFile: () => "",
    brainDir: () => "/brain",
    parser: refusingParser,
    emit: (payload) => emitted.push(payload),
    ...overrides,
  });
  return { emitted, code };
};

// Fail-open is not politeness here, it is the condition of survival: this hook stands in
// front of EVERY write the brain makes. A guard that throws its own stack at the owner
// once is a guard they disable, and a disabled guard protects nothing. So anything it
// cannot judge — stdin that is not JSON, a payload shaped like nothing we know — passes.
test("stdin that is not the hook JSON lets the write THROUGH, silently, without throwing", () => {
  for (const junk of ["", "not json at all", "null"]) {
    const { emitted, code } = captured({ readInput: () => junk });

    assert.deepEqual(emitted, [], `junk stdin produced a payload: ${junk}`);
    assert.equal(code, 0, `junk stdin produced a non-zero exit: ${junk}`);
  }
});

test("a note the parser accepts goes through in SILENCE — no payload, nothing for the owner to read", () => {
  const { emitted, code } = captured({ parser: () => () => ({ data: {}, content: "" }) });

  assert.deepEqual(emitted, []);
  assert.equal(code, 0);
});

test("a note the parser refuses is DENIED in the harness's own dialect, naming the note and the cause", () => {
  const { emitted, code } = captured();

  assert.equal(code, 0, "the hook itself did not fail — it decided; a non-zero exit is the harness's error path");
  assert.equal(emitted.length, 1);
  assert.equal(emitted[0].hookSpecificOutput.hookEventName, "PreToolUse");
  assert.equal(emitted[0].hookSpecificOutput.permissionDecision, "deny");
  assert.match(
    emitted[0].hookSpecificOutput.permissionDecisionReason,
    /vault\/inqom\/briefings\/2026-08-02\.md.*stub parser refused \(7:42\)/s,
  );
});
