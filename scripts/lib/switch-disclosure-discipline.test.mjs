import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { conversationResidueReminder } from "./universes.mjs";

// Issue #68 — `/switch` re-scopes retrieval server-side and cannot re-scope the
// conversation window, so after a switch the assistant can restate a fact from the
// sphere it just left as established and uncited: the answer LOOKS scoped and is not.
//
// The CORE emits the sentence (conversationResidueReminder, ADR 0009). This guard is
// about the half a function cannot enforce: that the SKILL relays it and, crucially,
// that it tells the agent what to DO about it. A sentence relayed to the user while
// the agent goes on treating the previous universe's facts as confirmed would be the
// disclosure without the behaviour — and the behaviour is the part that protects trust.
//
// Scoped to the fast-path section on purpose: an assertion that passes on a stray
// mention somewhere else in a 300-line skill guards nothing.
const SKILL_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../.claude/skills/switch/SKILL.md"
);

function fastPathSection(skill = readFileSync(SKILL_PATH, "utf8")) {
  const start = skill.indexOf("### Fast path");
  assert.notEqual(start, -1, "the fast-path section must exist — it is what this guard is about");
  const end = skill.indexOf("\n### ", start + 1);
  return skill.slice(start, end === -1 ? undefined : end);
}

test("switch fast path — the skill relays the residue disclosure, and never judges when", () => {
  const section = fastPathSection();
  const claims = {
    // The window is the scope being disclosed. Naming it is the whole sentence.
    "names the conversation as what still holds the old sphere": /conversation\s+still\s+holds/i,
    // Same ADR 0009 rule as the connectors reminder beside it: the core decides.
    "forbids the agent deciding when to show it": /the\s+core\s+decides\s+when|never\s+judge\s+it/i,
  };
  const unmet = Object.entries(claims)
    .filter(([, pattern]) => !pattern.test(section))
    .map(([claim]) => claim);
  assert.deepEqual(unmet, [], "relaying the core's sentence is the minimum this issue asks for");
});

test("switch fast path — the disclosure comes with the BEHAVIOUR, not just the sentence", () => {
  // The defect #68 describes is the assistant restating an out-of-scope fact as if a
  // search had confirmed it. Telling the user about the residue while continuing to do
  // that is a disclosure that changes nothing — so the skill must say to search again,
  // or to say where the knowledge comes from.
  const section = fastPathSection();
  assert.match(section, /search\s+for\s+it\s+again|say\s+plainly\s+where\s+you\s+know\s+it\s+from/i);
});

test("switch fast path — a fresh conversation is OFFERED, never pushed, and never on an empty window", () => {
  const section = fastPathSection();
  // `\s+` between words, never a literal space: markdown wraps these lines, so a
  // phrase the copy really does contain can sit across a newline. The sibling guard
  // (switch-skill-prefill) hit the same trap and names it — worth not re-learning.
  const claims = {
    // #68 is explicit: unconditional nagging erodes the sentence that matters.
    "refuses to suggest it when there was nothing to carry": /nothing\s+to\s+carry/i,
    // The legitimate case the issue names: switching precisely in order to reuse
    // something from the other sphere. Clearing would destroy the reason for the switch.
    "names the reason someone may want to KEEP the window": /reuse\s+something\s+from\s+the\s+other\s+sphere/i,
    // `/clear` is only free when durable state is on disk — so filing comes first.
    "offers to write it down before anything is cleared": /file\s+it\s+as\s+a\s+note\s+first/i,
  };
  const unmet = Object.entries(claims)
    .filter(([, pattern]) => !pattern.test(section))
    .map(([claim]) => claim);
  assert.deepEqual(unmet, [], "all three, or this becomes the nagging the issue argues against");
});

test("switch fast path — the two disclosures stay DISTINCT, about two different scopes", () => {
  // The connectors reminder and the residue reminder fire on opposite switches
  // (default → named vs named → default), because they disclose different scopes.
  // A skill that blurs them into "the core prints some warnings" would let a future
  // edit drop one, so both must be named where the agent reads what to relay.
  const section = fastPathSection();
  assert.match(section, /single-account/i);
  assert.match(section, /conversation\s+still\s+holds/i);
  // And the core really does treat them as opposites — asserted here rather than only
  // in the unit tests, because it is the premise this section's copy rests on.
  assert.equal(conversationResidueReminder({ from: "default", to: "acme" }), "");
  assert.notEqual(conversationResidueReminder({ from: "acme", to: "default" }), "");
});

// ─────────────────────────────────────────────────────────────────────────────
// Issue #66 — the same rule, one section further: the CODE corrects a declared
// spelling before the bytes exist, and the half a pure function cannot carry is
// what the owner is told and what the brain does when they say the correction was
// wrong. A guard that corrects the UNDO is worse than the typo it fixes, so the
// escape hatch has to be written down where the agent reads.
// ─────────────────────────────────────────────────────────────────────────────

function alwaysTrueSection(skill = readFileSync(SKILL_PATH, "utf8")) {
  const start = skill.indexOf("### `## Always true here`");
  assert.notEqual(start, -1, "the section must exist — it is what the write-time guard reads");
  const end = skill.indexOf("\n### ", start + 1);
  return skill.slice(start, end === -1 ? undefined : end);
}

test("always-true-here — the section is a short list of past errors, never a glossary", () => {
  const section = alwaysTrueSection();
  const claims = {
    // The heading was chosen over `## Proper names` for exactly this reason: a
    // glossary is the second CLAUDE.md universes exist to prevent.
    "says only what has already caused an error goes in": /actually\s+caused\s+an\s+error/i,
    "refuses a preventive list": /never\s+preventively|not\s+a\s+glossary/i,
    // Without the written form, the owner writes prose and the guard reads nothing.
    "shows the one line-shape the guard can read": /never:\s*Cortex/,
  };
  const unmet = Object.entries(claims)
    .filter(([, pattern]) => !pattern.test(section))
    .map(([claim]) => claim);
  assert.deepEqual(unmet, [], "the discipline is what keeps this section worth reading");
});

test("always-true-here — the UNDO is a written gesture, because the guard would redo the correction", () => {
  const section = alwaysTrueSection();
  const claims = {
    "names the one-shot bypass the undo needs": /spelling-bypass\.json/,
    "says it covers one write only": /covers\s+\S*one\S*\s+write/i,
    // An undo that only ever bypasses leaves the wrong rule in place for ever.
    "offers to fix the RULE rather than repeat the bypass": /line\s+to\s+remove\s+from/i,
  };
  const unmet = Object.entries(claims)
    .filter(([, pattern]) => !pattern.test(section))
    .map(([claim]) => claim);
  assert.deepEqual(unmet, [], "the owner's word must be able to win against a hook");
});

test("always-true-here — it says the correction is announced, and that records are never rewritten", () => {
  const section = alwaysTrueSection();
  assert.match(section, /tells\s+you\s+once/i, "a silent correction is the one outcome worse than the bug");
  assert.match(section, /quoted\s+material/i, "falsifying a record is worse than the typo being fixed");
});
