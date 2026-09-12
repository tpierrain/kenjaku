import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { BYPASS_REL, NOTICE_STATE_REL, runNotice, sessionMemory } from "./vault-write-notice.mjs";
import { NOTICE_MAX } from "./lib/vault-write-notice.mjs";

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));

// ═══════════════════════════════════════════════════════════════════════════
// The WIRING half. `scripts/lib/vault-write-notice.mjs` already decides; this file
// is the entry script Claude Code runs as a PreToolUse(Write|Edit) hook, and its
// whole job is the contract with the harness: the two dialects the host honours,
// and — just as load-bearing — the one it must never speak.
// ═══════════════════════════════════════════════════════════════════════════

const PROFILE = "# Globex\n\n## Always true here\n\n- aXiom — never: Axion\n";

const hookInput = ({ tool = "Write", path = "/brain/vault/globex/note.md", content = "Axion confirmed.\n", session = "s-1" } = {}) =>
  JSON.stringify({ session_id: session, tool_name: tool, tool_input: { file_path: path, content } });

const captured = (overrides = {}) => {
  const emitted = [];
  const written = [];
  const cleared = [];
  const code = runNotice({
    readInput: () => hookInput(),
    brainDir: () => "/brain",
    registry: () => ["globex"],
    pointer: () => "globex",
    profile: () => PROFILE,
    readState: () => null,
    writeState: (_brain, state) => written.push(state),
    readBypass: () => [],
    clearBypass: (brain) => cleared.push(brain),
    emit: (payload) => emitted.push(payload),
    ...overrides,
  });
  return { emitted, written, cleared, code };
};

test("stdin that is not the hook JSON leaves the write UNTOUCHED, silently", () => {
  for (const junk of ["", "not json at all", "null"]) {
    const { emitted, code } = captured({ readInput: () => junk });
    assert.deepEqual(emitted, [], `junk stdin produced a payload: ${junk}`);
    assert.equal(code, 0);
  }
});

test("a correction is emitted as updatedInput, which the host applies before the bytes exist", () => {
  const { emitted } = captured();
  assert.equal(emitted.length, 1);
  assert.equal(emitted[0].hookSpecificOutput.hookEventName, "PreToolUse");
  assert.equal(emitted[0].hookSpecificOutput.updatedInput.content, "aXiom confirmed.\n");
});

test("🛑 it NEVER claims a permission decision — correcting must not GRANT the write", () => {
  // Measured 2026-09-12: `updatedInput` is honoured on its own. Emitting an "allow"
  // would auto-approve every write this hook touches, including ones the owner's own
  // rules would have stopped.
  const { emitted } = captured();
  assert.deepEqual(Object.keys(emitted[0].hookSpecificOutput).sort(), [
    "additionalContext",
    "hookEventName",
    "updatedInput",
  ]);
});

test("a write with nothing to disclose and nothing to fix emits NOTHING at all", () => {
  const { emitted, written } = captured({ readInput: () => hookInput({ content: "A clean note.\n" }) });
  assert.deepEqual(emitted, []);
  assert.deepEqual(written, [], "and it does not rewrite the state file for nothing");
});

test("what was said is remembered under THIS session's id", () => {
  const { written } = captured();
  assert.deepEqual(written, [{ sessionId: "s-1", universes: [], corrections: ["Axion→aXiom"] }]);
});

test("the same correction in the same session is applied again, and announced no more", () => {
  const { emitted } = captured({
    readState: () => ({ sessionId: "s-1", universes: [], corrections: ["Axion→aXiom"] }),
  });
  assert.equal(emitted[0].hookSpecificOutput.updatedInput.content, "aXiom confirmed.\n");
  assert.equal(emitted[0].hookSpecificOutput.additionalContext, undefined);
});

test("a NEW session says it again, which is what makes this survive a /clear", () => {
  const { emitted } = captured({
    readInput: () => hookInput({ session: "s-2" }),
    readState: () => ({ sessionId: "s-1", universes: [], corrections: ["Axion→aXiom"] }),
  });
  assert.match(emitted[0].hookSpecificOutput.additionalContext, /Axion/);
});

test("a one-shot bypass lets an undo through, and is consumed the moment it is used", () => {
  const { emitted, cleared } = captured({ readBypass: () => ["Axion"] });
  assert.deepEqual(emitted, [], "the undo is written exactly as the owner asked");
  assert.deepEqual(cleared, ["/brain"], "and the bypass does not outlive it");
});

test("a bypass nobody used is NOT consumed", () => {
  const { cleared } = captured({
    readInput: () => hookInput({ content: "A clean note.\n" }),
    readBypass: () => ["Axion"],
  });
  assert.deepEqual(cleared, []);
});

test("a brain whose registry cannot be read lets every write through, in silence", () => {
  const { emitted, code } = captured({
    registry: () => {
      throw new Error("no .vault-rag here");
    },
  });
  assert.deepEqual(emitted, []);
  assert.equal(code, 0);
});

// ── sessionMemory, the seam that makes "once" mean "once per conversation" ────

test("sessionMemory forgets everything a DIFFERENT session said", () => {
  const state = { sessionId: "s-1", universes: ["acme"], corrections: ["a→b"] };
  assert.deepEqual(sessionMemory(state, "s-2"), { universes: [], corrections: [] });
  assert.deepEqual(sessionMemory(state, "s-1"), { universes: ["acme"], corrections: ["a→b"] });
});

test("sessionMemory reads a damaged state file as an empty memory, never as a crash", () => {
  assert.deepEqual(sessionMemory(null, "s-1"), { universes: [], corrections: [] });
  assert.deepEqual(sessionMemory({ sessionId: "s-1", universes: "acme" }, "s-1"), {
    universes: [],
    corrections: [],
  });
});

// ── the entry point, run as the host runs it: a process, on real stdin ────────
//
// `realpathSync` on the temp brain is not ceremony: on macOS `/tmp` is a symlink to
// `/private/tmp`, so the hook (which derives the brain from its own resolved
// location) and the tool call (which carries the path as handed to it) would name the
// same folder two ways, and every note would look like it sits outside the vault.

test("run AS A PROCESS on a real brain, it corrects the bytes and remembers it did", () => {
  const brain = realpathSync(mkdtempSync(join(tmpdir(), "kenjaku-notice-")));
  try {
    mkdirSync(join(brain, ".vault-rag"), { recursive: true });
    mkdirSync(join(brain, "vault", "globex"), { recursive: true });
    writeFileSync(join(brain, ".vault-rag", "universes.json"), JSON.stringify({ universes: ["globex"] }));
    writeFileSync(join(brain, ".vault-rag", "active-universe"), "acme\n");
    writeFileSync(join(brain, "vault", "globex", "universe.md"), PROFILE);
    // The hook derives the brain from its OWN location, so it must run from a copy
    // that sits where a real one does: scripts/ inside the brain.
    mkdirSync(join(brain, "scripts", "lib"), { recursive: true });
    cpSync(SCRIPTS_DIR, join(brain, "scripts"), { recursive: true });

    const run = spawnSync(process.execPath, [join(brain, "scripts", "vault-write-notice.mjs")], {
      input: JSON.stringify({
        session_id: "s-live",
        tool_name: "Write",
        tool_input: { file_path: join(brain, "vault", "globex", "note.md"), content: "Axion confirmed.\n" },
      }),
      encoding: "utf8",
    });

    assert.equal(run.status, 0, run.stderr);
    const payload = JSON.parse(run.stdout).hookSpecificOutput;
    assert.equal(payload.updatedInput.content, "aXiom confirmed.\n");
    // The pointer says `acme` and the note lands in `globex`, so BOTH halves speak.
    assert.match(payload.additionalContext, /'globex'/);
    assert.match(payload.additionalContext, /aXiom/);

    const state = JSON.parse(readFileSync(join(brain, NOTICE_STATE_REL), "utf8"));
    assert.deepEqual(state, { sessionId: "s-live", universes: ["globex"], corrections: ["Axion→aXiom"] });
    assert.equal(state.sessionId, "s-live");
  } finally {
    rmSync(brain, { recursive: true, force: true });
  }
});

test("run AS A PROCESS, a one-shot bypass file is honoured and then deleted", () => {
  const brain = realpathSync(mkdtempSync(join(tmpdir(), "kenjaku-bypass-")));
  try {
    mkdirSync(join(brain, ".vault-rag"), { recursive: true });
    mkdirSync(join(brain, "vault", "globex"), { recursive: true });
    mkdirSync(join(brain, ".cache"), { recursive: true });
    writeFileSync(join(brain, ".vault-rag", "universes.json"), JSON.stringify({ universes: ["globex"] }));
    writeFileSync(join(brain, ".vault-rag", "active-universe"), "globex\n");
    writeFileSync(join(brain, "vault", "globex", "universe.md"), PROFILE);
    writeFileSync(join(brain, BYPASS_REL), JSON.stringify({ spellings: ["Axion"] }));
    mkdirSync(join(brain, "scripts", "lib"), { recursive: true });
    cpSync(SCRIPTS_DIR, join(brain, "scripts"), { recursive: true });

    const run = spawnSync(process.execPath, [join(brain, "scripts", "vault-write-notice.mjs")], {
      input: JSON.stringify({
        session_id: "s-undo",
        tool_name: "Write",
        tool_input: { file_path: join(brain, "vault", "globex", "note.md"), content: "Axion confirmed.\n" },
      }),
      encoding: "utf8",
    });

    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.stdout.trim(), "", "the owner's undo is written exactly as they asked");
    assert.equal(existsSync(join(brain, BYPASS_REL)), false, "and the one shot is spent");
  } finally {
    rmSync(brain, { recursive: true, force: true });
  }
});

test("what reaches the owner's channel is bounded, because volume IS the defect (F5)", () => {
  // The bound itself is decided and tested in lib/vault-write-notice.mjs; what this
  // asserts is that the ENTRY emits what the bound produced, on the most-walked path
  // there is — a payload on every write the brain makes.
  const many = Array.from({ length: 40 }, (_, i) => `Wrong${i}`);
  const { emitted } = captured({
    profile: () => `# Globex\n\n## Always true here\n\n- aXiom — never: ${many.join(", ")}\n`,
    readInput: () => hookInput({ content: `${many.join(" ")}\n` }),
  });
  assert.ok(emitted[0].hookSpecificOutput.additionalContext.length <= NOTICE_MAX);
});

test("both throwaway files sit under .cache/, which every brain gitignores", () => {
  // One laptop's "already said" is not the other's, and an undo's one-shot list is
  // meaningless two seconds later. Written anywhere else in the brain they would be
  // auto-committed and pulled by the other machine.
  assert.deepEqual(NOTICE_STATE_REL.split(sep), [".cache", "write-notices.json"]);
  assert.deepEqual(BYPASS_REL.split(sep), [".cache", "spelling-bypass.json"]);
});

test("a drift with nothing to correct emits the context ALONE, with no null input beside it", () => {
  // `updatedInput: null` in the payload is not the same as no `updatedInput` at all:
  // the host applies what the key holds, so spelling it out with nothing in it invites
  // a write of nothing. The key is absent, or it carries bytes.
  const { emitted } = captured({
    readInput: () => hookInput({ content: "Nothing to fix here.\n" }),
    pointer: () => "acme",
    registry: () => ["acme", "globex"],
  });
  assert.equal(emitted.length, 1);
  assert.deepEqual(Object.keys(emitted[0].hookSpecificOutput).sort(), ["additionalContext", "hookEventName"]);
});

test("run AS A PROCESS TWICE, the second write says the same thing no more", () => {
  // 🚨 The round trip the single-run test cannot see: run one writes the session's
  // memory, run two must READ it back off the disk. Everything about "once per
  // session" lives in that second read, and it is also the only test in which the
  // state file is written into a `.cache/` that already exists.
  const brain = realpathSync(mkdtempSync(join(tmpdir(), "kenjaku-twice-")));
  try {
    mkdirSync(join(brain, ".vault-rag"), { recursive: true });
    mkdirSync(join(brain, "vault", "globex"), { recursive: true });
    mkdirSync(join(brain, ".cache"), { recursive: true });
    writeFileSync(join(brain, ".vault-rag", "universes.json"), JSON.stringify({ universes: ["globex"] }));
    writeFileSync(join(brain, ".vault-rag", "active-universe"), "acme\n");
    writeFileSync(join(brain, "vault", "globex", "universe.md"), PROFILE);
    mkdirSync(join(brain, "scripts", "lib"), { recursive: true });
    cpSync(SCRIPTS_DIR, join(brain, "scripts"), { recursive: true });

    const once = () =>
      spawnSync(process.execPath, [join(brain, "scripts", "vault-write-notice.mjs")], {
        input: JSON.stringify({
          session_id: "s-twice",
          tool_name: "Write",
          tool_input: { file_path: join(brain, "vault", "globex", "note.md"), content: "Axion confirmed.\n" },
        }),
        encoding: "utf8",
      });

    const first = once();
    assert.equal(first.status, 0, first.stderr);
    assert.match(JSON.parse(first.stdout).hookSpecificOutput.additionalContext, /'globex'/);
    const raw = readFileSync(join(brain, NOTICE_STATE_REL), "utf8");
    assert.ok(raw.endsWith("\n"), "the record is a line, like every other file this brain writes");

    const second = once();
    assert.equal(second.status, 0, second.stderr);
    const payload = JSON.parse(second.stdout).hookSpecificOutput;
    assert.equal(payload.additionalContext, undefined, "the sphere and the correction were already said");
    assert.equal(payload.updatedInput.content, "aXiom confirmed.\n", "but the correction is still APPLIED");
  } finally {
    rmSync(brain, { recursive: true, force: true });
  }
});
