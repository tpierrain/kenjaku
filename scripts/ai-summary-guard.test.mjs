import { test } from "node:test";
import assert from "node:assert/strict";

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { runSummaryGuard, realSummaryGuardDeps } from "./ai-summary-guard.mjs";
import { summaryNotice } from "./lib/ai-summary-guard.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// ai-summary-guard — the PostToolUse hook that says, at the moment of READING,
// that what just came back is an AI synthesis. The decision itself is pure and
// tested in lib/; this file is the contract with the harness: read the hook JSON
// on stdin, and answer in the one dialect that reaches the model
// (`hookSpecificOutput.additionalContext`).
//
// It never blocks and never fails loudly: it sits on the read path, so its own
// breakage must cost nothing (fail-open, silent). Exit is always 0.
// ═══════════════════════════════════════════════════════════════════════════

const MEET_EXPORT = `Point Julien - Notes par Gemini

Résumé

La capacité du studio.

Transcription

Julien: deux semaines ! Deux semaines !
`;

function fakeDeps(input) {
  const emitted = [];
  return {
    emitted,
    deps: {
      readInput: () => (typeof input === "string" ? input : JSON.stringify(input)),
      emit: (payload) => emitted.push(payload),
    },
  };
}

test("runSummaryGuard — an AI synthesis just read reaches the model as context", () => {
  const { deps, emitted } = fakeDeps({
    tool_name: "Read",
    tool_input: { file_path: "/tmp/meet.md" },
    tool_response: { file: { filePath: "/tmp/meet.md", content: MEET_EXPORT } },
  });
  assert.equal(runSummaryGuard(deps), 0, "a notice is not a failure");
  assert.equal(emitted.length, 1);
  assert.equal(emitted[0].hookSpecificOutput.hookEventName, "PostToolUse");
  assert.match(
    emitted[0].hookSpecificOutput.additionalContext,
    /verbatim is the source: it starts at the "Transcription" section/,
    "additionalContext is the only channel the model actually reads",
  );
});

test("runSummaryGuard — an ordinary read emits NOTHING, not an empty envelope", () => {
  // A hook that prints on every read is a hook whose output stops being read.
  const { deps, emitted } = fakeDeps({
    tool_name: "Read",
    tool_response: { file: { content: "# Capacity\n\nWIP per squad." } },
  });
  assert.equal(runSummaryGuard(deps), 0);
  assert.deepEqual(emitted, []);
});

test("runSummaryGuard — a search tool gets the snippet answer, keyed on the tool NAME", () => {
  // The same bytes mean two different things depending on how they arrived: a
  // hit is an extract the search chose, a read is a document someone opened.
  const hit = {
    tool_name: "mcp__claude_ai_Google_Drive__search_files",
    tool_response: { content: [{ type: "text", text: "Point Julien - Notes par Gemini — Résumé…" }] },
  };
  const { deps, emitted } = fakeDeps(hit);
  runSummaryGuard(deps);
  assert.match(emitted[0].hookSpecificOutput.additionalContext, /never a source/);

  const opened = fakeDeps({ ...hit, tool_name: "mcp__claude_ai_Google_Drive__read_file_content" });
  runSummaryGuard(opened.deps);
  assert.doesNotMatch(opened.emitted[0].hookSpecificOutput.additionalContext, /search hit/i);
});

test("runSummaryGuard — anything it cannot make sense of costs nothing", () => {
  // Fail-open, silently: on the read path, a guard that throws or complains
  // turns its own breakage into the owner's problem.
  for (const input of ["{not json", "null", '{"tool_name":"Read"}', '{"tool_response":42}']) {
    const { deps, emitted } = fakeDeps(input);
    assert.equal(runSummaryGuard(deps), 0, `input ${input} must not fail the hook`);
    assert.deepEqual(emitted, [], `input ${input} must stay silent`);
  }
});

test("runSummaryGuard — a tool_name that is not a string is not a search tool", () => {
  // `typeof toolName === "string"` reads like belt-and-braces, and it is not:
  // dropped, the regex test coerces whatever it is, so an array payload of
  // `["…search_files"]` stringifies straight back into a match. The brain would
  // then be told "open the document" about bytes that were, in fact, a document
  // — the one notice whose whole job is to tell those two apart.
  const { deps, emitted } = fakeDeps({
    tool_name: ["mcp__claude_ai_Google_Drive__search_files"],
    tool_response: { file: { content: MEET_EXPORT } },
  });
  assert.equal(runSummaryGuard(deps), 0);
  assert.doesNotMatch(
    emitted[0].hookSpecificOutput.additionalContext,
    /search hit/i,
    "an unrecognisable tool name falls back to the document answer, never the snippet one",
  );
});

test("ai-summary-guard, as a real process — stdin in, one JSON line out, exit 0", () => {
  // Every test above injects its ports, so `realSummaryGuardDeps` and the
  // entrypoint guard are observed by nothing: the file could read no stdin and
  // print nowhere with the suite still green.
  const run = (payload) =>
    spawnSync(process.execPath, [fileURLToPath(new URL("./ai-summary-guard.mjs", import.meta.url))], {
      input: JSON.stringify(payload),
      encoding: "utf8",
    });

  const spoke = run({
    tool_name: "Read",
    tool_response: { file: { content: MEET_EXPORT } },
  });
  assert.equal(spoke.status, 0, spoke.stderr);
  const parsed = JSON.parse(spoke.stdout);
  assert.match(parsed.hookSpecificOutput.additionalContext, /AI synthesis AND the verbatim/);

  const quiet = run({ tool_name: "Read", tool_response: { file: { content: "nothing to see" } } });
  assert.equal(quiet.status, 0);
  assert.equal(quiet.stdout.trim(), "", "silence is silence, not `{}`");
});

test("ai-summary-guard, IMPORTED rather than run — the body must not fire on import", async () => {
  // Mirrors the lint-vault conversion's canary (S0bis): importing the module runs
  // nothing. Asserted from a child process so an accidental process.exit() (e.g.
  // stdin blocked on a real TTY) cannot take the suite with it.
  const moduleUrl = new URL("./ai-summary-guard.mjs", import.meta.url).href;
  const probe = `import("${moduleUrl}").then(() => { console.log("imported-and-still-alive"); });`;
  const run = spawnSync(process.execPath, ["--input-type=module", "-e", probe], { encoding: "utf8" });

  assert.equal(run.status, 0, `importing the module must not exit — stderr: ${run.stderr}`);
  assert.equal(run.stdout.trim(), "imported-and-still-alive");
});

test("realSummaryGuardDeps — the real ports are what they claim", () => {
  assert.equal(typeof realSummaryGuardDeps.readInput, "function");
  assert.equal(typeof realSummaryGuardDeps.emit, "function");
});

test("the notice stays one line of text, in every state — volume IS the defect (F5)", () => {
  // This one does not ride a session start, it rides the READ path: it can fire
  // several times in a single exchange. That is exactly why it is allowed to
  // guess — a false positive must cost a line, not a refused read — and exactly
  // why the line has to stay a line. Every state is measured, not a sample: the
  // longest is the one nobody re-reads after editing it.
  const withVerbatim = "Notes par Gemini\nRésumé\nx\nTranscription\nJulien: deux semaines";
  const summaryOnly = "Notes par Gemini\nRésumé\nx";
  const states = [
    summaryNotice({ text: withVerbatim }),
    summaryNotice({ text: summaryOnly }),
    summaryNotice({ text: summaryOnly, fromSearch: true }),
  ];
  for (const notice of states) {
    assert.ok(notice.length <= 320, `a notice grew to ${notice.length} chars:\n${notice}`);
  }
});
