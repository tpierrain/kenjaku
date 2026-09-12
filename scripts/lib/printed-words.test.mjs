import { test } from "node:test";
import assert from "node:assert/strict";

import { reportLines as lintReportLines } from "./wiki-lint.mjs";
import { reportLines as consolidateReportLines } from "./consolidation-candidates.mjs";
import { directiveTraces, jargonTraces } from "./owner-facing.mjs";

// ═══════════════════════════════════════════════════════════════════════════
// v5.4, step 6 — the words the engine PRINTS.
//
// Every other guard in this release judges ONE emitter. This one is the sweep:
// it runs each report producer for real and reads every line that comes back,
// so a new section added to either report is covered the day it is written,
// without anyone remembering to add a test for it.
//
// 🛑 WHAT IT CAN AND CANNOT DO — ADR 0043 is explicit that no deterministic
// guard can judge whether a sentence is plain, and this one does not pretend to.
// It decides exactly one honest subset: a banned word in a string the engine
// prints verbatim. That is a literal in code, not a judgement about prose. It
// cannot see a sentence the model composes at runtime, which is most of what an
// owner reads, and it cannot tell whether what replaced the banned word is any
// clearer. `owner-facing.mjs` states the same three blindnesses in its header;
// they are restated here because this is the file someone will trust.
//
// ⚠️ And it deliberately covers ONLY what a human reads. Instructions to the
// model are out of scope and stay in the machinery's vocabulary on purpose: the
// model needs the precise word to do the right thing. A sweep that starts
// "fixing" directives has drifted, and would make the product worse.
// ═══════════════════════════════════════════════════════════════════════════

// Fixtures with EVERY section populated, so no heading escapes the sweep by
// being empty — a report built from a clean vault prints one line and proves
// nothing about the other nine.
const FULL_LINT_REPORT = {
  danglingLinks: [{ from: "daily/2026-09-01.md", target: "topics/capacity-managment" }],
  orphans: ["topics/kanban.md"],
  staleEntityPages: [
    { path: "people/ada.md", updated: "2026-01-02", freshestReference: "2026-08-30" },
  ],
  frontmatterViolations: [{ path: "topics/wip.md", missing: ["type", "tags"] }],
  unreadableNotes: ["raw-sources/2026-08-11-review.md"],
};

const FULL_CONSOLIDATE_REPORT = {
  newPages: [
    {
      target: "people/ada-lovelace",
      sources: [{ path: "daily/2026-09-01.md" }, { path: "meetings/2026-09-02-review.md" }],
    },
  ],
  refreshes: [
    {
      page: "topics/capacity-management.md",
      updated: "2026-01-02",
      sources: [{ path: "daily/2026-09-01.md" }],
    },
  ],
};

const SURFACES = [
  { name: "the vault health report", lines: () => lintReportLines(FULL_LINT_REPORT) },
  {
    name: "the vault health report, when there is nothing to report",
    lines: () =>
      lintReportLines({
        danglingLinks: [],
        orphans: [],
        staleEntityPages: [],
        frontmatterViolations: [],
        unreadableNotes: [],
      }),
  },
  {
    name: "the consolidation report",
    lines: () => consolidateReportLines(FULL_CONSOLIDATE_REPORT),
  },
  {
    name: "the consolidation report, when there is nothing to fold in",
    lines: () => consolidateReportLines({ newPages: [], refreshes: [] }),
  },
];

for (const { name, lines } of SURFACES) {
  test(`${name} is printed in the owner's words`, () => {
    for (const line of lines()) {
      assert.deepEqual(jargonTraces(line), [], `the machinery's vocabulary reached the screen:\n${line}`);
    }
  });

  // The other half of ADR 0043's wording rule, and it costs one loop to check
  // here too: a report is printed straight to a human, so an instruction to the
  // model has even less business in it than in a startup payload.
  test(`${name} carries no instruction meant for the model`, () => {
    for (const line of lines()) {
      assert.deepEqual(directiveTraces(line), [], `a directive reached the screen:\n${line}`);
    }
  });

  // A sweep that reads an empty list passes for the wrong reason and would keep
  // passing after the report it guards was deleted.
  test(`${name} actually produced lines for the sweep to read`, () => {
    assert.ok(lines().length > 0, "nothing was swept");
  });
}
