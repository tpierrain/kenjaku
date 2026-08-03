import { test } from "node:test";
import assert from "node:assert/strict";
import { buildStatusHookOutput } from "./status-hook-output.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// The SessionStart status banner's emission, as a pure seam.
//
// Why it exists: session-status.mjs is a top-level script no test can import
// (named debt, 0 % mutation), and it emitted `systemMessage` ONLY — which the
// Code tab of Claude Desktop drops. So its lines have always been CLI-only.
// Adding the version there and stopping would have shipped it to half the
// users while reading, from here, exactly like shipping it to all of them.
// ═══════════════════════════════════════════════════════════════════════════

test("the version leads the banner on the CLI, and reaches Desktop through the chat relay", () => {
  assert.deepEqual(
    buildStatusHookOutput({
      versionLine: "⚙️ Kenjaku engine v4.5.0",
      statusLines: ["📁 Repo up to date.", "🧠 RAG up to date — 436/436 files indexed."],
    }),
    {
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext:
          "[engine] ⚙️ Kenjaku engine v4.5.0 — state this version once, verbatim, in your first message.",
      },
      systemMessage:
        "⚙️ Kenjaku engine v4.5.0\n📁 Repo up to date.\n🧠 RAG up to date — 436/436 files indexed.",
    },
  );
});

// The absence twin: a brain that cannot say which release it runs (no install
// ref) must fall silent on BOTH channels rather than relay an empty directive —
// and the CLI banner must keep its own lines, unchanged, as it always had them.
test("no version → the banner is exactly what it was before, and Desktop hears nothing", () => {
  assert.deepEqual(
    buildStatusHookOutput({
      versionLine: null,
      statusLines: ["📁 Repo up to date.", "🧠 RAG up to date — 436/436 files indexed."],
    }),
    {
      hookSpecificOutput: { hookEventName: "SessionStart" },
      systemMessage: "📁 Repo up to date.\n🧠 RAG up to date — 436/436 files indexed.",
    },
  );
});

// The banner's own long-standing behaviour, moved here with the emission: each
// status line is optional (no restart pending, no key missing, no bootstrap), and
// an absent one must leave no blank line behind. Two present, one absent, so a
// mutant dropping the filter shows up as a real blank rather than as an empty
// systemMessage nobody would notice.
test("absent status lines are dropped, not rendered as blanks", () => {
  assert.equal(
    buildStatusHookOutput({
      versionLine: "⚙️ Kenjaku engine v4.5.0",
      statusLines: [null, "📁 Repo up to date.", undefined, "🧠 RAG up to date — 436/436 files indexed."],
    }).systemMessage,
    "⚙️ Kenjaku engine v4.5.0\n📁 Repo up to date.\n🧠 RAG up to date — 436/436 files indexed.",
  );
});
