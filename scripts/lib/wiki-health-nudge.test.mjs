import { test } from "node:test";
import assert from "node:assert/strict";

import { wikiHealthNudge, buildWikiHealthHookOutput } from "./wiki-health-nudge.mjs";

// wikiHealthNudge is the pure Track-F core (ADR 0009 rung 1): given the two
// STRUCTURED reports (lintVault's + consolidationCandidates'), it builds the
// compact SessionStart chat nudge — or null when nothing actionable. It surfaces
// ONLY the self-clearing / true-regression signals (dangling links + consolidation
// candidates); orphans/stale/frontmatter stay in the on-demand /lint.

const emptyLint = { danglingLinks: [], orphans: [], staleEntityPages: [], frontmatterViolations: [] };
const emptyConsolidation = { newPages: [], refreshes: [] };

test("wikiHealthNudge — both reports empty → null (quiet, no session-start noise)", () => {
  const nudge = wikiHealthNudge({ lintReport: emptyLint, consolidationReport: emptyConsolidation });
  assert.equal(nudge, null);
});

test("wikiHealthNudge — dangling links only → names the count", () => {
  const lintReport = {
    ...emptyLint,
    danglingLinks: [
      { from: "meetings/2026-07-10.md", target: "Acme Corp" },
      { from: "daily/2026-07-11.md", target: "Widget X" },
    ],
  };
  const nudge = wikiHealthNudge({ lintReport, consolidationReport: emptyConsolidation });
  assert.equal(nudge, "2 dangling links");
});

test("wikiHealthNudge — consolidation candidates only → names the count", () => {
  const consolidationReport = {
    newPages: [{ target: "Acme Corp", sources: [{ path: "meetings/2026-07-10.md" }] }],
    refreshes: [
      { page: "people/jane.md", updated: "2026-01-01", sources: [{ path: "meetings/2026-07-10.md" }] },
      { page: "topics/widget.md", updated: "2026-02-01", sources: [{ path: "daily/2026-07-11.md" }] },
    ],
  };
  const nudge = wikiHealthNudge({ lintReport: emptyLint, consolidationReport });
  assert.equal(nudge, "3 consolidation candidates");
});

test("wikiHealthNudge — both signals present → names both, and nothing else (F5)", () => {
  // The nudge IS the systemMessage, which the CLI prints clean to the owner. It used
  // to read `1 consolidation candidates (offer /consolidate) and 1 dangling links
  // (offer /lint)` — showing them the instruction we give the agent, and duplicating
  // two command names the wrapper below already spells out. It states counts now.
  const lintReport = { ...emptyLint, danglingLinks: [{ from: "daily/x.md", target: "Nowhere" }] };
  const consolidationReport = {
    newPages: [{ target: "Acme Corp", sources: [{ path: "meetings/2026-07-10.md" }] }],
    refreshes: [],
  };
  const nudge = wikiHealthNudge({ lintReport, consolidationReport });

  assert.equal(nudge, "1 consolidation candidates and 1 dangling links");
});

test("wikiHealthNudge — orphans/stale/frontmatter but no dangling & no candidates → null (noise guardrail)", () => {
  const lintReport = {
    danglingLinks: [],
    orphans: ["notes/lonely.md", "notes/unlinked.md"],
    staleEntityPages: [{ path: "people/bob.md", updated: "2025-01-01", freshestReference: "2026-07-01" }],
    frontmatterViolations: [{ path: "notes/bad.md", missing: ["tags"] }],
  };
  const nudge = wikiHealthNudge({ lintReport, consolidationReport: emptyConsolidation });
  assert.equal(nudge, null);
});

test("buildWikiHealthHookOutput — null nudge → null (nothing to emit)", () => {
  assert.equal(buildWikiHealthHookOutput(null), null);
});

test("buildWikiHealthHookOutput — non-null → SessionStart directive on the Desktop-visible chat channel", () => {
  const nudge = "3 consolidation candidates (offer /consolidate) and 1 dangling links (offer /lint)";
  const out = buildWikiHealthHookOutput(nudge);

  assert.equal(out.hookSpecificOutput.hookEventName, "SessionStart");
  const ctx = out.hookSpecificOutput.additionalContext;
  // The directive must DIRECT the agent to tell the USER in the chat (additionalContext is agent-facing).
  assert.match(ctx, /tell (the user|them)/i);
  // It must carry the concrete facts, so the agent surfaces the real numbers.
  assert.match(ctx, /3 consolidation candidates/);
  assert.match(ctx, /1 dangling links/);
  // The wrapper is now the ONE place naming the commands, since the nudge stopped.
  assert.match(ctx, /\/consolidate/);
  assert.match(ctx, /\/lint/);
  // It must frame the write posture: optional housekeeping, never auto-file.
  assert.match(ctx, /optional/i);
  assert.match(ctx, /never (auto-file|write)|confirm/i);
  // systemMessage carries the raw nudge (dropped on Desktop, shown on CLI).
  assert.equal(out.systemMessage, nudge);
});

test("buildWikiHealthHookOutput keeps the echoed payload short — volume IS the defect (F5)", () => {
  // The CLI echoes additionalContext verbatim, prefixed `SessionStart:startup says:`,
  // before the owner types a word. Housekeeping is the least urgent of the startup
  // blocks, so it gets the least room: one sentence of direction around the counts.
  // The counts are excluded — they are facts about the owner's vault, not our prose.
  const nudge = "3 consolidation candidates and 1 dangling links";
  const ctx = buildWikiHealthHookOutput(nudge).hookSpecificOutput.additionalContext;
  const framing = ctx.length - nudge.length;

  assert.ok(framing <= 170, `the housekeeping framing grew back to ${framing} chars:\n${ctx}`);
});
